import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildHierarchyNodeIndex,
  canonicalizeBoneKey,
  normalizeAnimationClipsForHierarchy,
  normalizeGlbArrayBuffer,
  normalizeGltfSceneHierarchy,
  normalizeSkinnedGeometryWeights,
  remapTrackTargetToHierarchy,
  splitTrackNodeAndProperty,
} from './gltfLoader';
import {
  CITY_CHIBI_NPC_ARCHETYPES,
  FISH_MODEL_SPECS,
  pickRandomChibiNpcArchetype,
  resolveClipName,
} from './characterRig';
import type { FishSpeciesId } from './fishing';

test('normalizeGlbArrayBuffer enforces 4-byte aligned length on binary GLB headers', () => {
  const raw = new ArrayBuffer(22);
  const view = new DataView(raw);
  view.setUint32(0, 0x46546c67, true); // 'glTF'
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, 22, true); // unaligned declared length

  const normalized = normalizeGlbArrayBuffer(raw);
  assert.equal(normalized.byteLength, 24);
  assert.equal(new DataView(normalized).getUint32(8, true), 24);
  assert.equal(new DataView(normalized).getUint32(0, true), 0x46546c67);
});

test('normalizeGlbArrayBuffer leaves non-GLB buffers untouched', () => {
  const raw = new ArrayBuffer(18);
  const view = new DataView(raw);
  view.setUint32(0, 0x7b226173, true); // '{"as' JSON glTF
  const normalized = normalizeGlbArrayBuffer(raw);
  assert.equal(normalized.byteLength, 18);
});

test('normalizeSkinnedGeometryWeights clamps bone indices and normalizes vertex weights to 1.0', () => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute([0, 99, 1, 2, 0, 1, 2, 3], 4),
  );
  geo.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute([2.0, 2.0, -0.5, Number.NaN, 0, 0, 0, 0], 4),
  );

  const res = normalizeSkinnedGeometryWeights(geo, 8);
  assert.equal(res.fixedVertices, 2);

  const idx = geo.getAttribute('skinIndex');
  const wt = geo.getAttribute('skinWeight');
  // Vertex 0: index 99 clamped to 7, negative/NaN weights zeroed, remaining (2,2) -> (0.5,0.5)
  assert.equal(idx.getY(0), 7);
  assert.ok(Math.abs(wt.getX(0) - 0.5) < 1e-5);
  assert.ok(Math.abs(wt.getY(0) - 0.5) < 1e-5);
  assert.equal(wt.getZ(0), 0);
  assert.equal(wt.getW(0), 0);

  // Vertex 1: all-zero weights fall back safely to root weight (1, 0, 0, 0)
  assert.equal(wt.getX(1), 1);
  assert.equal(wt.getY(1) + wt.getZ(1) + wt.getW(1), 0);
});

test('splitTrackNodeAndProperty preserves dotted Blender bone names like FrontUpperLeg.L', () => {
  const parsed = splitTrackNodeAndProperty('FrontUpperLeg.L.quaternion');
  assert.deepEqual(parsed, {
    nodeName: 'FrontUpperLeg.L',
    propertySuffix: '.quaternion',
  });
  assert.equal(canonicalizeBoneKey('AnimalArmature|FrontUpperLeg.L'), 'frontupperlegl');
});

test('normalizeAnimationClipsForHierarchy remaps dotted bones, strips orphans, and deduplicates tracks', () => {
  const root = new THREE.Group();
  const body = new THREE.Bone();
  body.name = 'Body';
  const frontLeg = new THREE.Bone();
  frontLeg.name = 'FrontUpperLegL'; // Three.js sanitized form without dot
  body.add(frontLeg);
  root.add(body);

  const index = buildHierarchyNodeIndex(root);
  assert.equal(
    remapTrackTargetToHierarchy('FrontUpperLeg.L.quaternion', index),
    'FrontUpperLegL.quaternion',
  );
  assert.equal(remapTrackTargetToHierarchy('GhostExtraLeg.L.quaternion', index), null);

  const clip = new THREE.AnimationClip('AnimalArmature|Walk', 1.0, [
    new THREE.QuaternionKeyframeTrack('FrontUpperLeg.L.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    // Conflicting duplicate track targeting the same bone & property
    new THREE.QuaternionKeyframeTrack('FrontUpperLegL.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    // Orphan track targeting a bone absent from the skeleton
    new THREE.VectorKeyframeTrack('NonExistentExtraLeg.position', [0, 1], [0, 0, 0, 0, 1, 0]),
    new THREE.VectorKeyframeTrack('Body.position', [0, 1], [0, 0, 0, 0, 0.1, 0]),
  ]);

  const normalized = normalizeAnimationClipsForHierarchy([clip], root);
  assert.equal(normalized.length, 1);
  assert.deepEqual(
    normalized[0].tracks.map((t) => t.name),
    ['FrontUpperLegL.quaternion', 'Body.position'],
  );
});

test('normalizeGltfSceneHierarchy physically removes redundant _LOD1 sibling meshes when _LOD0 exists', () => {
  const root = new THREE.Group();
  const lod0 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  lod0.name = 'cat_LOD0';
  const lod1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  lod1.name = 'cat_LOD1';
  root.add(lod0, lod1);

  normalizeGltfSceneHierarchy(root);

  const remainingNames: string[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) remainingNames.push(obj.name);
  });
  assert.deepEqual(remainingNames, ['cat_LOD0']);
});

test('FISH_MODEL_SPECS covers all 8 lake species and resolves Quaternius swimming clips', () => {
  const allSpecies: FishSpeciesId[] = [
    'frost_minnow',
    'glacial_perch',
    'silver_char',
    'boreal_trout',
    'crystal_pike',
    'aurora_salmon',
    'abyssal_sturgeon',
    'celestial_koi',
  ];
  for (const id of allSpecies) {
    const spec = FISH_MODEL_SPECS[id];
    assert.ok(spec, `Missing fish GLB spec for ${id}`);
    assert.equal(spec.url, `/models/fish/${id}.glb`);
    assert.ok(spec.targetHeight > 0.25 && spec.targetHeight < 1.0);
  }

  const fishClips = [
    'Fish_Armature|Attack',
    'Fish_Armature|Death',
    'Fish_Armature|Out_Of_Water',
    'Fish_Armature|Swimming_Fast',
    'Fish_Armature|Swimming_Impulse',
    'Fish_Armature|Swimming_Normal',
  ];
  assert.equal(resolveClipName(fishClips, 'swim_normal'), 'Fish_Armature|Swimming_Normal');
  assert.equal(resolveClipName(fishClips, 'swim_fast'), 'Fish_Armature|Swimming_Fast');
});

test('pickRandomChibiNpcArchetype distributes across all Frostcave City chibi archetypes cleanly', () => {
  assert.equal(CITY_CHIBI_NPC_ARCHETYPES.length, 5);
  const pickedIds = new Set<string>();
  const samples = [0.01, 0.22, 0.45, 0.65, 0.92];
  for (const r of samples) {
    const picked = pickRandomChibiNpcArchetype(() => r);
    pickedIds.add(picked.archetype.id);
    assert.ok(picked.archetype.spec.url.endsWith('.glb'));
    assert.ok(picked.tintHex > 0);
  }
  assert.equal(pickedIds.size, 5);

  // Exclude filter works cleanly (e.g. Valkyra Emberwing)
  for (const r of samples) {
    const picked = pickRandomChibiNpcArchetype(() => r, 'barbarian');
    assert.notEqual(picked.archetype.id, 'barbarian');
  }

  // KayKit NPC embedded social clips resolve cleanly
  const npcClips = ['Idle', 'Walking_A', 'Cheer', 'Interact'];
  assert.equal(resolveClipName(npcClips, 'idle'), 'Idle');
  assert.equal(resolveClipName(npcClips, 'walk'), 'Walking_A');
  assert.equal(resolveClipName(npcClips, 'cheer'), 'Cheer');
  assert.equal(resolveClipName(npcClips, 'interact'), 'Interact');
});
