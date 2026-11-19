import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
  type AnimalAnimState,
  type FishAnimState,
  type ModelAssetSpec,
  type MonsterAnimState,
  type PlayerAnimState,
  computeEntityLod,
  resolveClipName,
} from './characterRig';

let sharedLoader: GLTFLoader | null = null;
const modelCache = new Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }>();
const loadingPromises = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>();
const clipPackCache = new Map<string, THREE.AnimationClip[]>();

const GLB_MAGIC = 0x46546c67; // 'glTF' little-endian
const TRACK_PROPERTY_SUFFIXES = [
  '.position',
  '.quaternion',
  '.scale',
  '.morphTargetInfluences',
  '.rotation',
] as const;

export function getSharedGltfLoader(): GLTFLoader {
  if (!sharedLoader) {
    sharedLoader = new GLTFLoader();
  }
  return sharedLoader;
}

export interface GltfLoadOptions {
  onProgress?: (event: ProgressEvent<EventTarget>) => void;
  useCache?: boolean;
}

export interface LoadedGltf {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

export interface HierarchyNodeIndex {
  exact: Map<string, string>;
  sanitized: Map<string, string>;
  canonical: Map<string, string>;
  boneNames: Set<string>;
}

/**
 * Strips punctuation differences (., :, /, |, spaces) to produce a canonical bone lookup key
 * so Blender-exported dotted bone tracks (e.g. 'FrontUpperLeg.L') always bind cleanly to
 * Three.js-sanitized nodes ('FrontUpperLegL') and vice-versa.
 */
export function canonicalizeBoneKey(name: string): string {
  const leaf = name.includes('|') ? name.slice(name.lastIndexOf('|') + 1) : name;
  return leaf.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes a raw GLB binary ArrayBuffer before GLTFLoader.parse:
 * - Verifies glTF v2 magic header when binary GLB.
 * - Ensures the buffer byteLength matches the declared GLB header length and is 4-byte aligned,
 *   preventing misaligned typed-array reads on skinning/animation accessors.
 */
export function normalizeGlbArrayBuffer(rawBuffer: ArrayBuffer): ArrayBuffer {
  if (rawBuffer.byteLength < 12) return rawBuffer;
  const view = new DataView(rawBuffer);
  const magic = view.getUint32(0, true);
  if (magic !== GLB_MAGIC) {
    return rawBuffer;
  }

  const declaredLength = view.getUint32(8, true);
  const targetLen = Math.min(rawBuffer.byteLength, declaredLength);
  const paddedLen = (targetLen + 3) & ~3;

  if (paddedLen === rawBuffer.byteLength && declaredLength === rawBuffer.byteLength) {
    return rawBuffer;
  }

  const normalized = new ArrayBuffer(paddedLen);
  const dst = new Uint8Array(normalized);
  dst.set(new Uint8Array(rawBuffer, 0, targetLen));
  new DataView(normalized).setUint32(8, paddedLen, true);
  return normalized;
}

/**
 * Normalizes a SkinnedMesh geometry's skinIndex and skinWeight BufferAttributes so:
 * - Every joint index is strictly clamped inside [0, boneCount - 1].
 * - Every vertex's 4 skin weights are finite, non-negative, and sum to exactly 1.0.
 * Eliminates stretched/exploded phantom limb artifacts caused by unnormalized skinning buffers.
 */
export function normalizeSkinnedGeometryWeights(
  geometry: THREE.BufferGeometry,
  boneCount: number,
): { fixedVertices: number } {
  const skinWeight = geometry.getAttribute('skinWeight');
  const skinIndex = geometry.getAttribute('skinIndex');
  if (!skinWeight || !skinIndex || boneCount <= 0) {
    return { fixedVertices: 0 };
  }

  const maxIdx = Math.max(0, boneCount - 1);
  const count = Math.min(skinWeight.count, skinIndex.count);
  let fixedVertices = 0;

  for (let i = 0; i < count; i++) {
    let i0 = Math.round(skinIndex.getX(i));
    let i1 = Math.round(skinIndex.getY(i));
    let i2 = Math.round(skinIndex.getZ(i));
    let i3 = Math.round(skinIndex.getW(i));

    let w0 = skinWeight.getX(i);
    let w1 = skinWeight.getY(i);
    let w2 = skinWeight.getZ(i);
    let w3 = skinWeight.getW(i);

    let dirty = false;
    if (!Number.isFinite(i0) || i0 < 0 || i0 > maxIdx) { i0 = THREE.MathUtils.clamp(i0 || 0, 0, maxIdx); dirty = true; }
    if (!Number.isFinite(i1) || i1 < 0 || i1 > maxIdx) { i1 = THREE.MathUtils.clamp(i1 || 0, 0, maxIdx); dirty = true; }
    if (!Number.isFinite(i2) || i2 < 0 || i2 > maxIdx) { i2 = THREE.MathUtils.clamp(i2 || 0, 0, maxIdx); dirty = true; }
    if (!Number.isFinite(i3) || i3 < 0 || i3 > maxIdx) { i3 = THREE.MathUtils.clamp(i3 || 0, 0, maxIdx); dirty = true; }

    if (!Number.isFinite(w0) || w0 < 0) { w0 = 0; dirty = true; }
    if (!Number.isFinite(w1) || w1 < 0) { w1 = 0; dirty = true; }
    if (!Number.isFinite(w2) || w2 < 0) { w2 = 0; dirty = true; }
    if (!Number.isFinite(w3) || w3 < 0) { w3 = 0; dirty = true; }

    const sum = w0 + w1 + w2 + w3;
    if (sum <= 1e-6) {
      w0 = 1;
      w1 = 0;
      w2 = 0;
      w3 = 0;
      dirty = true;
    } else if (Math.abs(sum - 1.0) > 1e-3) {
      const inv = 1 / sum;
      w0 *= inv;
      w1 *= inv;
      w2 *= inv;
      w3 *= inv;
      dirty = true;
    }

    if (dirty) {
      skinIndex.setXYZW(i, i0, i1, i2, i3);
      skinWeight.setXYZW(i, w0, w1, w2, w3);
      fixedVertices++;
    }
  }

  if (fixedVertices > 0) {
    skinIndex.needsUpdate = true;
    skinWeight.needsUpdate = true;
  }
  return { fixedVertices };
}

/**
 * Builds an authoritative name index for every node & Bone inside a loaded GLTF scene root.
 */
export function buildHierarchyNodeIndex(root: THREE.Object3D): HierarchyNodeIndex {
  const exact = new Map<string, string>();
  const sanitized = new Map<string, string>();
  const canonical = new Map<string, string>();
  const boneNames = new Set<string>();

  root.traverse((obj) => {
    if (!obj.name) return;
    const isBone = (obj as THREE.Bone).isBone === true;
    if (isBone) {
      boneNames.add(obj.name);
    }

    // Prefer Bone nodes over non-bone wrapper nodes if two objects ever collide in name
    if (!exact.has(obj.name) || isBone) {
      exact.set(obj.name, obj.name);
    }
    const san = THREE.PropertyBinding.sanitizeNodeName(obj.name);
    if (!sanitized.has(san) || isBone) {
      sanitized.set(san, obj.name);
    }
    const canon = canonicalizeBoneKey(obj.name);
    if (canon && (!canonical.has(canon) || isBone)) {
      canonical.set(canon, obj.name);
    }
  });

  return { exact, sanitized, canonical, boneNames };
}

/**
 * Splits a Three.js KeyframeTrack name into (targetNodeName, propertySuffix) safely even when
 * Blender bone names contain dots (e.g. 'FrontUpperLeg.L.quaternion').
 */
export function splitTrackNodeAndProperty(
  trackName: string,
): { nodeName: string; propertySuffix: string } | null {
  for (const suffix of TRACK_PROPERTY_SUFFIXES) {
    if (trackName.endsWith(suffix)) {
      const nodeName = trackName.slice(0, -suffix.length);
      if (nodeName.length > 0) {
        return { nodeName, propertySuffix: suffix };
      }
    }
  }
  const lastDot = trackName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot >= trackName.length - 1) return null;
  return {
    nodeName: trackName.slice(0, lastDot),
    propertySuffix: trackName.slice(lastDot),
  };
}

/**
 * Maps an AnimationClip KeyframeTrack name onto the exact node/bone name present in the target
 * hierarchy, returning null for orphan tracks targeting nonexistent nodes.
 */
export function remapTrackTargetToHierarchy(
  trackName: string,
  nodeIndex: HierarchyNodeIndex,
): string | null {
  const parsed = splitTrackNodeAndProperty(trackName);
  if (!parsed) return null;

  const { nodeName, propertySuffix } = parsed;
  const leafName = nodeName.includes('/')
    ? nodeName.slice(nodeName.lastIndexOf('/') + 1)
    : nodeName;

  const resolved =
    nodeIndex.exact.get(leafName) ??
    nodeIndex.sanitized.get(THREE.PropertyBinding.sanitizeNodeName(leafName)) ??
    nodeIndex.canonical.get(canonicalizeBoneKey(leafName));

  if (!resolved) return null;
  return `${resolved}${propertySuffix}`;
}

/**
 * Normalizes an array of AnimationClips against a loaded GLTF scene's actual bone/node hierarchy:
 * - Remaps dotted/sanitized/prefixed track names to exact existing nodes in `root`.
 * - Strips orphan tracks that target absent nodes.
 * - Deduplicates conflicting `(node, property)` tracks within each clip so no leg/spine bone
 *   ever receives competing dual transforms.
 */
export function normalizeAnimationClipsForHierarchy(
  clips: readonly THREE.AnimationClip[],
  root: THREE.Object3D,
): THREE.AnimationClip[] {
  const nodeIndex = buildHierarchyNodeIndex(root);
  const normalizedClips: THREE.AnimationClip[] = [];

  for (const clip of clips) {
    const validTracks: THREE.KeyframeTrack[] = [];
    const seenTrackKeys = new Set<string>();

    for (const track of clip.tracks) {
      const remappedName = remapTrackTargetToHierarchy(track.name, nodeIndex);
      if (!remappedName) continue;
      if (seenTrackKeys.has(remappedName)) continue;
      seenTrackKeys.add(remappedName);

      const clonedTrack = track.clone();
      clonedTrack.name = remappedName;
      validTracks.push(clonedTrack);
    }

    if (validTracks.length > 0) {
      normalizedClips.push(new THREE.AnimationClip(clip.name, clip.duration, validTracks));
    }
  }

  return normalizedClips;
}

/**
 * Cleans and normalizes a loaded or cloned GLTF scene hierarchy:
 * - Physically detaches redundant embedded `_LOD1`/`_LOD2` sibling meshes when `_LOD0` exists
 *   (preventing duplicate SkinnedMeshes bound to the same skeleton from rendering ghost limbs).
 * - Verifies every SkinnedMesh skeleton binds exclusively to bones inside `root`.
 * - Normalizes every SkinnedMesh's `skinIndex` and `skinWeight` attributes.
 */
export function normalizeGltfSceneHierarchy(root: THREE.Group): void {
  let hasEmbeddedLod0 = false;
  const redundantLodNodes: THREE.Object3D[] = [];

  root.traverse((child) => {
    if (child instanceof THREE.Mesh && /_lod0$/i.test(child.name)) {
      hasEmbeddedLod0 = true;
    }
  });

  if (hasEmbeddedLod0) {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && /_lod[1-9]$/i.test(child.name)) {
        redundantLodNodes.push(child);
      }
    });
    for (const node of redundantLodNodes) {
      node.parent?.remove(node);
    }
  }

  const bonesByName = new Map<string, THREE.Bone>();
  root.traverse((child) => {
    if ((child as THREE.Bone).isBone && child.name) {
      bonesByName.set(child.name, child as THREE.Bone);
    }
  });

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const skinned = child as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh) {
      skinned.frustumCulled = false;
      if (skinned.skeleton) {
        // Re-verify all skeleton bones belong to this root hierarchy
        let remappedAnyBone = false;
        const verifiedBones = skinned.skeleton.bones.map((bone) => {
          let cur: THREE.Object3D | null = bone;
          while (cur) {
            if (cur === root) return bone;
            cur = cur.parent;
          }
          const replacement = bonesByName.get(bone.name);
          if (replacement) {
            remappedAnyBone = true;
            return replacement;
          }
          return bone;
        });

        if (remappedAnyBone) {
          const freshSkeleton = new THREE.Skeleton(
            verifiedBones,
            skinned.skeleton.boneInverses.map((m) => m.clone()),
          );
          skinned.bind(freshSkeleton, skinned.bindMatrix);
        }

        normalizeSkinnedGeometryWeights(skinned.geometry, skinned.skeleton.bones.length);
      }
    }
  });
}

function cloneSceneSafely(source: THREE.Group): THREE.Group {
  let hasSkinned = false;
  source.traverse((obj) => {
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
      hasSkinned = true;
    }
  });
  const cloned = hasSkinned
    ? (SkeletonUtils.clone(source) as THREE.Group)
    : source.clone(true);

  // Clone materials per instance so tinting / hit-flash / emissive changes never leak across instances
  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => m.clone());
      } else if (child.material) {
        child.material = child.material.clone();
      }
    }
  });

  normalizeGltfSceneHierarchy(cloned);
  return cloned;
}

/**
 * Asynchronously loads a .gltf or .glb 3D model with normalized binary buffer parsing,
 * built-in caching, SkeletonUtils.clone() for SkinnedMesh safety, and bone-hierarchy
 * normalized AnimationClip extraction.
 */
export async function loadGltfModelWithAnimations(
  url: string,
  options: GltfLoadOptions = {},
): Promise<LoadedGltf> {
  const useCache = options.useCache ?? true;
  if (useCache && modelCache.has(url)) {
    const cached = modelCache.get(url)!;
    return {
      scene: cloneSceneSafely(cached.scene),
      animations: cached.animations,
    };
  }

  if (loadingPromises.has(url)) {
    const res = await loadingPromises.get(url)!;
    return {
      scene: cloneSceneSafely(res.scene),
      animations: res.animations,
    };
  }

  const loader = getSharedGltfLoader();
  const promise = (async (): Promise<LoadedGltf> => {
    const resourcePath = url.slice(0, url.lastIndexOf('/') + 1);
    const gltf: GLTF = await (async () => {
      if (typeof fetch === 'function') {
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} loading glTF asset ${url}`);
        }
        const rawBuffer = await resp.arrayBuffer();
        const normalizedBuffer = normalizeGlbArrayBuffer(rawBuffer);
        return await new Promise<GLTF>((resolve, reject) => {
          loader.parse(normalizedBuffer, resourcePath, resolve, reject);
        });
      }
      return await new Promise<GLTF>((resolve, reject) => {
        loader.load(url, resolve, options.onProgress, reject);
      });
    })();

    const rootGroup = gltf.scene || new THREE.Group();
    normalizeGltfSceneHierarchy(rootGroup);
    const rawAnimations = gltf.animations || [];
    const normalizedAnimations =
      rawAnimations.length > 0
        ? normalizeAnimationClipsForHierarchy(rawAnimations, rootGroup)
        : [];
    // Keep raw animations for external animation-only pack files (which may only contain skeleton nodes)
    const finalAnimations =
      normalizedAnimations.length > 0 ? normalizedAnimations : rawAnimations;

    const entry = { scene: rootGroup, animations: finalAnimations };
    if (useCache) {
      modelCache.set(url, entry);
    }
    return entry;
  })();

  loadingPromises.set(url, promise);
  try {
    const result = await promise;
    return {
      scene: cloneSceneSafely(result.scene),
      animations: result.animations,
    };
  } finally {
    loadingPromises.delete(url);
  }
}

export async function loadGltfModel(
  url: string,
  options: GltfLoadOptions = {},
): Promise<THREE.Group> {
  const res = await loadGltfModelWithAnimations(url, options);
  return res.scene;
}

/**
 * Loads and caches animation clips from one or more GLB animation libraries (e.g., KayKit Rig_Medium_*).
 */
export async function loadAnimationClipLibrary(
  urls: readonly string[],
): Promise<THREE.AnimationClip[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const cached = clipPackCache.get(url);
      if (cached) return cached;
      try {
        const loaded = await loadGltfModelWithAnimations(url);
        clipPackCache.set(url, loaded.animations);
        return loaded.animations;
      } catch (err) {
        console.warn(`Failed to load animation library ${url}:`, err);
        return [] as THREE.AnimationClip[];
      }
    }),
  );

  const merged: THREE.AnimationClip[] = [];
  const seen = new Set<string>();
  for (const list of results) {
    for (const clip of list) {
      if (!seen.has(clip.name)) {
        seen.add(clip.name);
        merged.push(clip);
      }
    }
  }
  return merged;
}

/**
 * Finds the first Bone or Object3D matching any of the provided lowercase substrings.
 */
export function findBoneByPattern(
  root: THREE.Object3D,
  patterns: readonly string[],
): THREE.Object3D | null {
  for (const pat of patterns) {
    let exactMatch: THREE.Object3D | null = null;
    root.traverse((obj) => {
      if (exactMatch) return;
      if (obj.name.toLowerCase() === pat) {
        exactMatch = obj;
      }
    });
    if (exactMatch) return exactMatch;
  }

  for (const pat of patterns) {
    let partialMatch: THREE.Object3D | null = null;
    root.traverse((obj) => {
      if (partialMatch) return;
      if (obj.name.toLowerCase().includes(pat)) {
        partialMatch = obj;
      }
    });
    if (partialMatch) return partialMatch;
  }

  return null;
}

const _tmpBoneWorldScale = new THREE.Vector3();

/**
 * Attaches an equipment Object3D (authored in world meters) onto a skeletal bone while
 * automatically compensating for armature world scaling (e.g. Blender 100x / cm rigs).
 */
export function attachEquipmentToBone(
  bone: THREE.Object3D,
  child: THREE.Object3D,
  worldOffset: readonly [number, number, number],
  localRotation: readonly [number, number, number],
  targetWorldScale = 1.0,
): void {
  bone.updateWorldMatrix(true, false);
  bone.getWorldScale(_tmpBoneWorldScale);
  const avgScale = Math.max(
    0.0005,
    (Math.abs(_tmpBoneWorldScale.x) +
      Math.abs(_tmpBoneWorldScale.y) +
      Math.abs(_tmpBoneWorldScale.z)) /
      3,
  );
  const inv = 1 / avgScale;
  child.scale.setScalar(targetWorldScale * inv);
  child.position.set(
    worldOffset[0] * inv,
    worldOffset[1] * inv,
    worldOffset[2] * inv,
  );
  child.rotation.set(localRotation[0], localRotation[1], localRotation[2]);
  bone.add(child);
}

export interface MaterialEnhancementOptions {
  furBumpMap?: THREE.Texture | null;
  scaleBumpMap?: THREE.Texture | null;
  envMapIntensity?: number;
  /** Optional mesh node names to physically remove before measuring & rendering (e.g. duplicate NPC weapons/shields). */
  hideMeshNames?: readonly string[];
}

/**
 * Normalizes a loaded GLTF/GLB model to exact world height, grounds its feet at y=0,
 * centers X/Z, rotates to face +Z, refines PBR materials, and wraps it in a THREE.LOD node.
 */
export function prepareNormalizedGltfAsset(
  rawScene: THREE.Group,
  spec: ModelAssetSpec,
  matOptions: MaterialEnhancementOptions = {},
): {
  lod: THREE.LOD;
  modelRoot: THREE.Group;
  normalizedHeight: number;
  normalizedRadius: number;
  meshes: THREE.Mesh[];
} {
  // Remove unwanted alternate gear meshes BEFORE measuring bounds so height/centering stay exact
  if (matOptions.hideMeshNames && matOptions.hideMeshNames.length > 0) {
    const hideSet = new Set(matOptions.hideMeshNames.map((n) => n.toLowerCase()));
    const toRemove: THREE.Object3D[] = [];
    rawScene.traverse((child) => {
      if (child.name && hideSet.has(child.name.toLowerCase())) {
        toRemove.push(child);
      }
    });
    for (const obj of toRemove) {
      obj.parent?.remove(obj);
    }
  }

  // Inner transform container that holds the GLTF scene
  const innerHolder = new THREE.Group();
  innerHolder.add(rawScene);

  // Apply yaw offset BEFORE measuring/centering so forward axis aligns to +Z
  rawScene.rotation.y += spec.yawOffset;
  innerHolder.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(innerHolder);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Guard against degenerate/huge bounds
  const measuredHeight = Number.isFinite(size.y) && size.y > 0.0005 ? size.y : 1.0;
  const scaleFactor = spec.targetHeight / measuredHeight;

  rawScene.scale.multiplyScalar(scaleFactor);
  innerHolder.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(innerHolder);
  const scaledCenter = new THREE.Vector3();
  const scaledSize = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  scaledBox.getSize(scaledSize);

  // Ground flush on y = 0 (+ optional hover offset) and center horizontally
  rawScene.position.x -= scaledCenter.x;
  rawScene.position.z -= scaledCenter.z;
  rawScene.position.y -= scaledBox.min.y;
  rawScene.position.y += spec.groundOffsetY ?? 0;

  // Hide embedded lower-detail _LOD1/_LOD2 sibling meshes when _LOD0 exists (e.g. owl.glb)
  let hasEmbeddedLod0 = false;
  rawScene.traverse((child) => {
    if (child instanceof THREE.Mesh && /_lod0$/i.test(child.name)) {
      hasEmbeddedLod0 = true;
    }
  });

  // PBR Material refinement & shadow setup
  const meshes: THREE.Mesh[] = [];
  const tintColor = spec.tintHex !== undefined ? new THREE.Color(spec.tintHex) : null;
  const tintStrength = spec.tintStrength ?? 0.3;
  const emissiveColor = spec.emissiveHex !== undefined ? new THREE.Color(spec.emissiveHex) : null;

  rawScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (hasEmbeddedLod0 && /_lod[1-9]$/i.test(child.name)) {
      child.visible = false;
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      child.frustumCulled = false;
    }
    meshes.push(child);

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = Math.max(mat.map.anisotropy || 1, 4);
      }

      if (tintColor) {
        mat.color.lerp(tintColor, tintStrength);
      }

      if (emissiveColor && (spec.emissiveIntensity ?? 0) > 0) {
        const eStrength = spec.emissiveIntensity ?? 0.1;
        mat.emissive.lerp(emissiveColor, eStrength <= 0.1 ? 0.5 : 0.72);
        mat.emissiveIntensity = Math.min(0.45, Math.max(mat.emissiveIntensity, eStrength));
      }

      const rMin = spec.roughnessMin ?? 0.65;
      const rMax = spec.roughnessMax ?? 0.94;
      mat.roughness = THREE.MathUtils.clamp(mat.roughness, rMin, rMax);
      if (spec.metalnessMax !== undefined) {
        mat.metalness = Math.min(mat.metalness, spec.metalnessMax);
      }
      mat.envMapIntensity = matOptions.envMapIntensity ?? 0.85;

      // Add subtle procedural micro-relief bump map when the GLB lacks a normal/bump map
      if (!mat.normalMap && !mat.bumpMap) {
        if (
          (spec.surfacePreset === 'fur' ||
            spec.surfacePreset === 'thick_fur' ||
            spec.surfacePreset === 'hero_fur_leather') &&
          matOptions.furBumpMap
        ) {
          mat.bumpMap = matOptions.furBumpMap;
          mat.bumpScale = spec.surfacePreset === 'thick_fur' ? 0.032 : 0.02;
        } else if (
          (spec.surfacePreset === 'scales' || spec.surfacePreset === 'monster_flesh' || spec.surfacePreset === 'chitin') &&
          matOptions.scaleBumpMap
        ) {
          mat.bumpMap = matOptions.scaleBumpMap;
          mat.bumpScale = 0.028;
        }
      }

      mat.needsUpdate = true;
    }
  });

  // Build THREE.LOD wrapper:
  // Level 0 (0m - 58m): Full high-detail GLB rig
  // Level 1 (58m+): Lightweight silhouette proxy preserving color/proportions for distant views
  const lod = new THREE.LOD();
  lod.addLevel(innerHolder, 0);

  const avgRadius = Math.max(0.25, Math.min(scaledSize.x, scaledSize.z) * 0.42);
  const proxyGeo = new THREE.CapsuleGeometry(
    avgRadius,
    Math.max(0.15, scaledSize.y - avgRadius * 2),
    4,
    8,
  );
  const proxyMat = new THREE.MeshStandardMaterial({
    color: spec.tintHex ?? 0x8b95a5,
    roughness: 0.88,
    metalness: 0.05,
  });
  const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
  proxyMesh.position.y = scaledSize.y * 0.5 + (spec.groundOffsetY ?? 0);
  proxyMesh.castShadow = false;
  proxyMesh.receiveShadow = true;
  const lowDetailGroup = new THREE.Group();
  lowDetailGroup.add(proxyMesh);
  lod.addLevel(lowDetailGroup, 58);

  return {
    lod,
    modelRoot: innerHolder,
    normalizedHeight: scaledSize.y,
    normalizedRadius: Math.max(scaledSize.x, scaledSize.z) * 0.5,
    meshes,
  };
}

/**
 * Smooth crossfading THREE.AnimationMixer controller with distance-based LOD throttling
 * and bone-hierarchy normalized AnimationClip binding.
 */
export class SkeletalAnimController {
  public readonly mixer: THREE.AnimationMixer;
  public readonly clipNames: string[];
  private readonly clipsByName = new Map<string, THREE.AnimationClip>();
  private readonly actionsByName = new Map<string, THREE.AnimationAction>();
  private activeAction: THREE.AnimationAction | null = null;
  private activeStateKey: string | null = null;
  private activeClipName: string | null = null;
  private accumDt = 0;
  private readonly meshes: THREE.Mesh[];
  private lastCastShadow = true;

  constructor(
    root: THREE.Object3D,
    clips: readonly THREE.AnimationClip[],
    meshes: THREE.Mesh[] = [],
  ) {
    this.mixer = new THREE.AnimationMixer(root);
    const boundClips = normalizeAnimationClipsForHierarchy(clips, root);
    const activeClips = boundClips.length > 0 ? boundClips : clips;
    this.clipNames = activeClips.map((c) => c.name);
    this.meshes = meshes;
    for (const clip of activeClips) {
      this.clipsByName.set(clip.name, clip);
    }
  }

  public get hasClips(): boolean {
    return this.clipNames.length > 0;
  }

  public get currentState(): string | null {
    return this.activeStateKey;
  }

  public setState(
    desiredState: PlayerAnimState | AnimalAnimState | MonsterAnimState | FishAnimState,
    options: {
      timeScale?: number;
      fadeDuration?: number;
      loopOnce?: boolean;
      forceRestart?: boolean;
    } = {},
  ): void {
    if (this.clipNames.length === 0) return;

    const timeScale = options.timeScale ?? 1.0;
    const fadeDuration = options.fadeDuration ?? 0.18;
    const loopOnce = options.loopOnce ?? false;
    const forceRestart = options.forceRestart ?? false;

    const clipName = resolveClipName(this.clipNames, desiredState);
    if (!clipName) return;

    if (this.activeStateKey === desiredState && this.activeClipName === clipName && !forceRestart) {
      if (this.activeAction) {
        this.activeAction.setEffectiveTimeScale(timeScale);
      }
      return;
    }

    let nextAction = this.actionsByName.get(clipName);
    if (!nextAction) {
      const clip = this.clipsByName.get(clipName);
      if (!clip) return;
      nextAction = this.mixer.clipAction(clip);
      this.actionsByName.set(clipName, nextAction);
    }

    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    if (loopOnce) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    if (this.activeAction && this.activeAction !== nextAction) {
      nextAction.reset().fadeIn(fadeDuration).play();
      this.activeAction.fadeOut(fadeDuration);
    } else {
      nextAction.reset().play();
    }

    this.activeAction = nextAction;
    this.activeStateKey = desiredState;
    this.activeClipName = clipName;
  }

  /**
   * Advances the AnimationMixer with optional distance-squared LOD throttling & shadow culling.
   */
  public update(dt: number, distanceSq?: number): void {
    if (this.clipNames.length === 0) return;

    if (distanceSq !== undefined) {
      const lod = computeEntityLod(distanceSq);
      if (lod.castShadow !== this.lastCastShadow) {
        this.lastCastShadow = lod.castShadow;
        for (const mesh of this.meshes) {
          mesh.castShadow = lod.castShadow;
        }
      }
      if (lod.mixerStepInterval > 0) {
        this.accumDt += dt;
        if (this.accumDt < lod.mixerStepInterval) {
          return;
        }
        const step = Math.min(0.15, this.accumDt);
        this.accumDt = 0;
        this.mixer.update(step);
        return;
      }
    }

    this.mixer.update(dt);
  }
}

export function clearGltfCache(): void {
  modelCache.clear();
  loadingPromises.clear();
  clipPackCache.clear();
}
