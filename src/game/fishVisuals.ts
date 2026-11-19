import * as THREE from 'three';
import {
  FISH_SPECS,
  FISH_SPECIES_ORDER,
  FISHING_LAKE_CENTER,
  FISHING_LAKE_RADIUS,
  createLakeFishSpawnPopulation,
  type FishSpeciesId,
} from './fishing';
import type { ItemRarity } from './types';

export type RealisticFishAnatomy = 'barramundi' | 'snapper';

export interface FishSwimCadence {
  /** Base carangiform tail-beat frequency (rad/s) during relaxed cruising. */
  baseFreq: number;
  /** Lateral tail displacement amplitude (fraction of body length) while cruising. */
  cruiseAmp: number;
  /** Rapid tail-beat frequency (rad/s) when biting or fighting on the fishing hook. */
  struggleFreq: number;
  /** Lateral tail displacement amplitude (fraction of body length) while fighting. */
  struggleAmp: number;
  /** Spatial wave count along spine (radians from nose to tail; ~5.4-6.8 = realistic S-curve). */
  waveNumber: number;
  /** Period (seconds) between natural burst-and-glide swimming accelerations. */
  burstInterval: number;
  /** Speed multiplier boost during a natural swimming burst (0.15..0.55). */
  burstStrength: number;
  /** Roll banking gain (radians per rad/s yaw rate) into turns. */
  bankGain: number;
}

export interface RealisticFishProfile {
  speciesId: FishSpeciesId;
  anatomy: RealisticFishAnatomy;
  /**
   * Non-uniform anatomical scale multipliers [widthX, heightY, lengthZ] applied on top of
   * normalized GLB height so every species exhibits an authentic silhouette.
   */
  bodyProportions: readonly [number, number, number];
  /** Wet underwater clearcoat intensity (0..1) for MeshPhysicalMaterial. */
  clearcoat: number;
  clearcoatRoughness: number;
  /** Subtle scale mother-of-pearl iridescence (0..1). */
  iridescence: number;
  iridescenceIOR: number;
  /** Multiplier applied to the GLB ORM roughness channel for wet underwater sheen. */
  roughnessScale: number;
  /** Multiplier applied to the GLB ORM metalness channel for silvery scale glint. */
  metalnessScale: number;
  /** Normal map micro-scale strength. */
  normalScale: number;
  /** Preferred orbital zone as a fraction of usable lagoon radius (0.2..0.85). */
  preferredOrbitBand: readonly [number, number];
  /** Cruise angular speed baseline (rad/s). */
  baseOrbitSpeed: number;
  swimCadence: FishSwimCadence;
}

export const REALISTIC_FISH_PROFILES: Record<FishSpeciesId, RealisticFishProfile> = {
  frost_minnow: {
    speciesId: 'frost_minnow',
    anatomy: 'snapper',
    bodyProportions: [0.82, 0.84, 1.12],
    clearcoat: 0.78,
    clearcoatRoughness: 0.14,
    iridescence: 0.28,
    iridescenceIOR: 1.34,
    roughnessScale: 0.44,
    metalnessScale: 0.72,
    normalScale: 1.15,
    preferredOrbitBand: [0.22, 0.56],
    baseOrbitSpeed: 0.36,
    swimCadence: {
      baseFreq: 9.8,
      cruiseAmp: 0.085,
      struggleFreq: 24.0,
      struggleAmp: 0.155,
      waveNumber: 6.2,
      burstInterval: 3.1,
      burstStrength: 0.46,
      bankGain: 0.34,
    },
  },
  glacial_perch: {
    speciesId: 'glacial_perch',
    anatomy: 'snapper',
    bodyProportions: [1.04, 1.06, 0.98],
    clearcoat: 0.76,
    clearcoatRoughness: 0.16,
    iridescence: 0.24,
    iridescenceIOR: 1.33,
    roughnessScale: 0.48,
    metalnessScale: 0.64,
    normalScale: 1.25,
    preferredOrbitBand: [0.26, 0.64],
    baseOrbitSpeed: 0.29,
    swimCadence: {
      baseFreq: 8.2,
      cruiseAmp: 0.082,
      struggleFreq: 21.5,
      struggleAmp: 0.148,
      waveNumber: 5.8,
      burstInterval: 4.2,
      burstStrength: 0.34,
      bankGain: 0.3,
    },
  },
  silver_char: {
    speciesId: 'silver_char',
    anatomy: 'barramundi',
    bodyProportions: [0.92, 0.94, 1.14],
    clearcoat: 0.86,
    clearcoatRoughness: 0.11,
    iridescence: 0.36,
    iridescenceIOR: 1.36,
    roughnessScale: 0.42,
    metalnessScale: 0.84,
    normalScale: 1.2,
    preferredOrbitBand: [0.3, 0.7],
    baseOrbitSpeed: 0.33,
    swimCadence: {
      baseFreq: 8.6,
      cruiseAmp: 0.086,
      struggleFreq: 22.5,
      struggleAmp: 0.155,
      waveNumber: 6.0,
      burstInterval: 3.8,
      burstStrength: 0.42,
      bankGain: 0.32,
    },
  },
  boreal_trout: {
    speciesId: 'boreal_trout',
    anatomy: 'barramundi',
    bodyProportions: [0.98, 0.98, 1.08],
    clearcoat: 0.82,
    clearcoatRoughness: 0.13,
    iridescence: 0.4,
    iridescenceIOR: 1.37,
    roughnessScale: 0.45,
    metalnessScale: 0.74,
    normalScale: 1.28,
    preferredOrbitBand: [0.32, 0.72],
    baseOrbitSpeed: 0.31,
    swimCadence: {
      baseFreq: 8.0,
      cruiseAmp: 0.088,
      struggleFreq: 22.0,
      struggleAmp: 0.158,
      waveNumber: 5.9,
      burstInterval: 4.0,
      burstStrength: 0.38,
      bankGain: 0.3,
    },
  },
  crystal_pike: {
    speciesId: 'crystal_pike',
    anatomy: 'barramundi',
    bodyProportions: [0.78, 0.82, 1.32],
    clearcoat: 0.88,
    clearcoatRoughness: 0.11,
    iridescence: 0.44,
    iridescenceIOR: 1.38,
    roughnessScale: 0.4,
    metalnessScale: 0.78,
    normalScale: 1.3,
    preferredOrbitBand: [0.42, 0.78],
    baseOrbitSpeed: 0.27,
    swimCadence: {
      baseFreq: 7.4,
      cruiseAmp: 0.095,
      struggleFreq: 23.0,
      struggleAmp: 0.165,
      waveNumber: 6.5,
      burstInterval: 5.2,
      burstStrength: 0.54,
      bankGain: 0.28,
    },
  },
  aurora_salmon: {
    speciesId: 'aurora_salmon',
    anatomy: 'barramundi',
    bodyProportions: [1.0, 1.02, 1.12],
    clearcoat: 0.88,
    clearcoatRoughness: 0.12,
    iridescence: 0.48,
    iridescenceIOR: 1.39,
    roughnessScale: 0.42,
    metalnessScale: 0.8,
    normalScale: 1.28,
    preferredOrbitBand: [0.38, 0.76],
    baseOrbitSpeed: 0.32,
    swimCadence: {
      baseFreq: 7.8,
      cruiseAmp: 0.09,
      struggleFreq: 23.5,
      struggleAmp: 0.165,
      waveNumber: 6.1,
      burstInterval: 4.4,
      burstStrength: 0.44,
      bankGain: 0.32,
    },
  },
  abyssal_sturgeon: {
    speciesId: 'abyssal_sturgeon',
    anatomy: 'barramundi',
    bodyProportions: [1.1, 0.88, 1.28],
    clearcoat: 0.74,
    clearcoatRoughness: 0.18,
    iridescence: 0.3,
    iridescenceIOR: 1.35,
    roughnessScale: 0.52,
    metalnessScale: 0.7,
    normalScale: 1.4,
    preferredOrbitBand: [0.46, 0.82],
    baseOrbitSpeed: 0.21,
    swimCadence: {
      baseFreq: 5.8,
      cruiseAmp: 0.092,
      struggleFreq: 18.5,
      struggleAmp: 0.16,
      waveNumber: 6.4,
      burstInterval: 6.2,
      burstStrength: 0.26,
      bankGain: 0.22,
    },
  },
  celestial_koi: {
    speciesId: 'celestial_koi',
    anatomy: 'snapper',
    bodyProportions: [1.08, 1.06, 1.06],
    clearcoat: 0.92,
    clearcoatRoughness: 0.1,
    iridescence: 0.52,
    iridescenceIOR: 1.41,
    roughnessScale: 0.38,
    metalnessScale: 0.76,
    normalScale: 1.22,
    preferredOrbitBand: [0.24, 0.62],
    baseOrbitSpeed: 0.25,
    swimCadence: {
      baseFreq: 6.8,
      cruiseAmp: 0.096,
      struggleFreq: 20.5,
      struggleAmp: 0.162,
      waveNumber: 6.0,
      burstInterval: 4.8,
      burstStrength: 0.3,
      bankGain: 0.28,
    },
  },
};

export interface FishSwimKinematicsInput {
  speciesId: FishSpeciesId;
  totalTime: number;
  phaseOffset: number;
  /** Signed angular turn rate (rad/s) around Y axis. */
  turnRate: number;
  /** Vertical velocity / bob slope (m/s) for natural pitch tilt. */
  verticalVel: number;
  /** True when biting or actively hooked on the fishing line. */
  isStruggling: boolean;
}

export interface FishSwimKinematicsResult {
  /** Multiplier on forward orbital speed (burst-and-glide). */
  speedMultiplier: number;
  /** Tail-beat angular frequency (rad/s) for GPU travelling wave. */
  waveFreq: number;
  /** Normalized lateral amplitude (fraction of body length). */
  waveAmp: number;
  /** Normalized lateral spine turn curvature (-1..1). */
  turnBend: number;
  /** Natural roll bank angle around local forward axis (radians). */
  rollZ: number;
  /** Subtle nose pitch angle (radians). */
  pitchX: number;
  /** Fin flutter strength multiplier. */
  finFlutter: number;
}

/**
 * Pure biomechanics solver producing lifelike burst-and-glide carangiform swimming
 * parameters, natural banking into turns, and intense struggle thrashing when hooked.
 */
export function computeFishSwimKinematics(
  input: FishSwimKinematicsInput,
): FishSwimKinematicsResult {
  const profile = REALISTIC_FISH_PROFILES[input.speciesId] ?? REALISTIC_FISH_PROFILES.boreal_trout;
  const c = profile.swimCadence;

  const safeTurn = Number.isFinite(input.turnRate) ? input.turnRate : 0;
  const safeVert = Number.isFinite(input.verticalVel) ? input.verticalVel : 0;

  // Smooth burst-and-glide envelope using skewed raised cosine so fish surge and then glide
  const burstCycle =
    ((input.totalTime + input.phaseOffset * 1.37) / Math.max(1.5, c.burstInterval)) *
    Math.PI *
    2;
  const rawBurst = Math.max(0, Math.sin(burstCycle));
  const burstEnvelope = rawBurst * rawBurst * rawBurst; // sharp energetic kick, long smooth glide

  const speedMultiplier = input.isStruggling
    ? 1.75
    : 0.86 + burstEnvelope * c.burstStrength;

  const waveFreq = input.isStruggling
    ? c.struggleFreq
    : c.baseFreq * (0.85 + burstEnvelope * 0.55);

  const waveAmp = input.isStruggling
    ? c.struggleAmp
    : c.cruiseAmp * (0.82 + burstEnvelope * 0.42);

  const clampedTurn = Math.max(-2.6, Math.min(2.6, safeTurn));
  const turnBend = Math.max(-1, Math.min(1, clampedTurn * 0.42));
  const rollZ = Math.max(-0.34, Math.min(0.34, -clampedTurn * c.bankGain));
  const pitchX = Math.max(-0.22, Math.min(0.22, -safeVert * 1.4));
  const finFlutter = input.isStruggling ? 1.7 : 0.85 + burstEnvelope * 0.45;

  return {
    speedMultiplier,
    waveFreq,
    waveAmp,
    turnBend,
    rollZ,
    pitchX,
    finFlutter,
  };
}

export interface LakeFishSpawnEntry {
  id: number;
  speciesId: FishSpeciesId;
  rarity: ItemRarity;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  depthOffset: number;
  phase: number;
  x: number;
  z: number;
  yaw: number;
}

/**
 * Generates a realistic, non-crowded Crystal Lagoon fish school layout directly
 * integrated with `src/game/fishing.ts` (`FISH_SPECS`, `FISHING_LAKE_CENTER`,
 * `FISHING_LAKE_RADIUS`, and `createLakeFishSpawnPopulation`).
 */
export function buildLakeFishSpawnPlan(params: {
  count?: number;
  lakeSurfaceY: number;
  rng?: () => number;
  luckBonus?: number;
}): LakeFishSpawnEntry[] {
  const count = Math.max(FISH_SPECIES_ORDER.length, Math.floor(params.count ?? 12));
  const rng = params.rng ?? Math.random;
  const population = createLakeFishSpawnPopulation(count, rng, params.luckBonus ?? 0);

  // Keep fish comfortably inside the open water basin (avoiding shallow shore & pier pilings)
  const maxUsableRadius = FISHING_LAKE_RADIUS - 3.6;
  const minUsableRadius = 2.9;
  const entries: LakeFishSpawnEntry[] = [];

  for (let i = 0; i < population.length; i++) {
    const speciesId = population[i];
    const spec = FISH_SPECS[speciesId];
    const profile = REALISTIC_FISH_PROFILES[speciesId];
    const [bandMin, bandMax] = profile.preferredOrbitBand;
    const laneT = ((i * 0.61803398875) % 1 + rng() * 0.25) % 1;
    const orbitRadius = Math.max(
      minUsableRadius,
      Math.min(
        maxUsableRadius,
        maxUsableRadius * (bandMin + (bandMax - bandMin) * laneT),
      ),
    );
    // Distribute angles evenly with gentle jitter so several fish are always visible from the pier
    const orbitAngle =
      (i / population.length) * Math.PI * 2 + (rng() - 0.5) * 0.35;
    const dir = i % 2 === 0 ? 1 : -1;
    const orbitSpeed = dir * profile.baseOrbitSpeed * (0.88 + rng() * 0.26);
    const x = FISHING_LAKE_CENTER.x + Math.cos(orbitAngle) * orbitRadius;
    const z = FISHING_LAKE_CENTER.z + Math.sin(orbitAngle) * orbitRadius;
    // Keep fish visibly seated right in the clear glacial water surface, safely above the lakebed
    const depthOffset = params.lakeSurfaceY + 0.025 + (i % 3) * 0.012;
    const yaw = orbitAngle + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);

    entries.push({
      id: i + 1,
      speciesId,
      rarity: spec.rarity,
      orbitRadius,
      orbitAngle,
      orbitSpeed,
      depthOffset,
      phase: i * 1.13 + rng() * Math.PI,
      x,
      z,
      yaw,
    });
  }

  return entries;
}

export interface FishSwimShaderUniforms {
  uSwimPhase: { value: number };
  uSwimAmp: { value: number };
  uWaveNumber: { value: number };
  uTurnBend: { value: number };
  uFinFlutter: { value: number };
  uNoseZ: { value: number };
  uTailZ: { value: number };
  uBodyLength: { value: number };
  uFlipX: { value: number };
}

/**
 * Upgrades every PBR mesh material on a loaded realistic fish GLB to a wet, subtly
 * iridescent MeshPhysicalMaterial and injects a GPU carangiform travelling-wave +
 * lateral turn-bend + fin-flutter vertex shader via `onBeforeCompile`.
 *
 * Preserves 100% of embedded PBR Albedo, Normal, Metallic-Roughness, and AO maps,
 * Three.js shadows, tone mapping, and scene environment reflections.
 */
export function upgradeFishMaterialsWithSwimShader(
  modelRoot: THREE.Object3D,
  speciesId: FishSpeciesId,
  envMapIntensity = 1.45,
): { uniforms: FishSwimShaderUniforms; upgradedMaterials: number } {
  const profile = REALISTIC_FISH_PROFILES[speciesId] ?? REALISTIC_FISH_PROFILES.boreal_trout;
  const isBarramundi = profile.anatomy === 'barramundi';

  // Compute exact mesh-local nose-to-tail Z range so wave deformation is scale-invariant
  let minZ = Infinity;
  let maxZ = -Infinity;
  const meshes: THREE.Mesh[] = [];
  modelRoot.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      meshes.push(obj);
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      const bb = obj.geometry.boundingBox;
      if (bb) {
        minZ = Math.min(minZ, bb.min.z);
        maxZ = Math.max(maxZ, bb.max.z);
      }
    }
  });

  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ) || Math.abs(maxZ - minZ) < 1e-4) {
    minZ = -0.5;
    maxZ = 0.5;
  }

  // Barramundi mesh-local nose is minZ (node rotated 180 deg Y); Snapper mesh-local nose is maxZ.
  const noseZ = isBarramundi ? minZ : maxZ;
  const tailZ = isBarramundi ? maxZ : minZ;
  const bodyLength = Math.max(0.01, Math.abs(tailZ - noseZ));
  const flipX = isBarramundi ? -1.0 : 1.0;

  const uniforms: FishSwimShaderUniforms = {
    uSwimPhase: { value: 0 },
    uSwimAmp: { value: profile.swimCadence.cruiseAmp },
    uWaveNumber: { value: profile.swimCadence.waveNumber },
    uTurnBend: { value: 0 },
    uFinFlutter: { value: 1.0 },
    uNoseZ: { value: noseZ },
    uTailZ: { value: tailZ },
    uBodyLength: { value: bodyLength },
    uFlipX: { value: flipX },
  };

  let upgradedMaterials = 0;

  for (const mesh of meshes) {
    const srcList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const nextList = srcList.map((src) => {
      if (!(src instanceof THREE.MeshStandardMaterial)) {
        return src;
      }

      // Ensure proper color spaces on all embedded PBR maps
      if (src.map) {
        src.map.colorSpace = THREE.SRGBColorSpace;
        src.map.needsUpdate = true;
      }
      if (src.normalMap) {
        src.normalMap.colorSpace = THREE.NoColorSpace;
      }
      if (src.roughnessMap) {
        src.roughnessMap.colorSpace = THREE.NoColorSpace;
      }
      if (src.metalnessMap) {
        src.metalnessMap.colorSpace = THREE.NoColorSpace;
      }
      if (src.aoMap) {
        src.aoMap.colorSpace = THREE.NoColorSpace;
      }

      const phys = new THREE.MeshPhysicalMaterial({
        name: src.name ? `${src.name}_wetPbr` : 'RealisticFishWetPbr',
        color: src.color.clone(),
        map: src.map,
        normalMap: src.normalMap,
        normalScale: new THREE.Vector2(profile.normalScale, profile.normalScale),
        roughnessMap: src.roughnessMap,
        metalnessMap: src.metalnessMap,
        aoMap: src.aoMap,
        aoMapIntensity: src.aoMap ? 0.85 : 0,
        roughness: Math.max(0.14, Math.min(0.65, src.roughness * profile.roughnessScale)),
        metalness: Math.max(0.08, Math.min(0.85, src.metalness * profile.metalnessScale)),
        emissive: src.emissive.clone(),
        emissiveIntensity: src.emissiveIntensity,
        clearcoat: profile.clearcoat,
        clearcoatRoughness: profile.clearcoatRoughness,
        iridescence: profile.iridescence,
        iridescenceIOR: profile.iridescenceIOR,
        envMapIntensity,
        side: THREE.DoubleSide,
        vertexColors: false,
      });

      phys.customProgramCacheKey = () => 'frostwood_realistic_fish_swim_v1';
      phys.onBeforeCompile = (shader) => {
        shader.uniforms.uSwimPhase = uniforms.uSwimPhase;
        shader.uniforms.uSwimAmp = uniforms.uSwimAmp;
        shader.uniforms.uWaveNumber = uniforms.uWaveNumber;
        shader.uniforms.uTurnBend = uniforms.uTurnBend;
        shader.uniforms.uFinFlutter = uniforms.uFinFlutter;
        shader.uniforms.uNoseZ = uniforms.uNoseZ;
        shader.uniforms.uTailZ = uniforms.uTailZ;
        shader.uniforms.uBodyLength = uniforms.uBodyLength;
        shader.uniforms.uFlipX = uniforms.uFlipX;

        shader.vertexShader =
          `
uniform float uSwimPhase;
uniform float uSwimAmp;
uniform float uWaveNumber;
uniform float uTurnBend;
uniform float uFinFlutter;
uniform float uNoseZ;
uniform float uTailZ;
uniform float uBodyLength;
uniform float uFlipX;
` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <beginnormal_vertex>',
          `
#include <beginnormal_vertex>
float _fishSpanZ = uTailZ - uNoseZ;
float _fishTailT = clamp((position.z - uNoseZ) / (abs(_fishSpanZ) > 0.0001 ? _fishSpanZ : 1.0), 0.0, 1.0);
float _fishFlex = pow(max(0.0, _fishTailT - 0.10) / 0.90, 1.65);
float _fishWaveArg = uSwimPhase - _fishTailT * uWaveNumber;
float _fishSlope = -cos(_fishWaveArg) * uWaveNumber * _fishFlex * uSwimAmp * 0.65;
objectNormal = normalize(vec3(objectNormal.x - _fishSlope * objectNormal.z * uFlipX, objectNormal.y, objectNormal.z));
`,
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
#include <begin_vertex>
float _swimTailT = clamp((transformed.z - uNoseZ) / (abs(uTailZ - uNoseZ) > 0.0001 ? (uTailZ - uNoseZ) : 1.0), 0.0, 1.0);
float _swimFlex = pow(max(0.0, _swimTailT - 0.10) / 0.90, 1.65);
// Subtle anterior counter-yaw stabilization + full posterior carangiform travelling S-wave
float _headStabilize = sin(uSwimPhase + 0.55) * (1.0 - _swimTailT) * 0.012 * uBodyLength;
float _bodyWave = sin(uSwimPhase - _swimTailT * uWaveNumber) * _swimFlex * uSwimAmp * uBodyLength;
// Natural spine curvature when turning left or right
float _turnArc = uTurnBend * _swimTailT * _swimTailT * uBodyLength * 0.22;
// Delicate high-frequency fin-tip shimmer on dorsal/pectoral extremities
float _finEdge = smoothstep(0.14 * uBodyLength, 0.34 * uBodyLength, abs(transformed.y));
float _finRipple = sin(uSwimPhase * 1.85 - _swimTailT * 8.5) * _finEdge * 0.016 * uBodyLength * uFinFlutter;
transformed.x += (_bodyWave + _headStabilize + _turnArc + _finRipple) * uFlipX;
`,
        );
      };
      phys.needsUpdate = true;

      src.dispose();
      upgradedMaterials += 1;
      return phys;
    });

    mesh.material = Array.isArray(mesh.material) ? nextList : nextList[0];
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  return { uniforms, upgradedMaterials };
}
