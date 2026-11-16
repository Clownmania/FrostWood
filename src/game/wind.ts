export interface WindDirection {
  x: number;
  z: number;
}

// Matches SnowfallSystem drift (+1.0 X, +0.25 Z) normalized
const RAW_WIND_X = 1.0;
const RAW_WIND_Z = 0.25;
const WIND_LEN = Math.hypot(RAW_WIND_X, RAW_WIND_Z);

export const WIND_DIRECTION: WindDirection = {
  x: RAW_WIND_X / WIND_LEN,
  z: RAW_WIND_Z / WIND_LEN,
};

export interface WindGustSample {
  /** World-space lean displacement factor along +X (positive means leaning toward +X). */
  leanX: number;
  /** World-space lean displacement factor along +Z (positive means leaning toward +Z). */
  leanZ: number;
  /** Rapid turbulent flutter offset (-1..1 scaled by gust intensity). */
  flutter: number;
  /** Traveling gust front envelope (0..1.5+). */
  gustFactor: number;
}

export interface WindTiltInput {
  time: number;
  gustIntensity: number;
  worldX: number;
  worldZ: number;
  stiffness?: number;
  phaseOffset?: number;
}

/**
 * Computes deterministic, spatially coherent wind gust lean & flutter in world XZ space.
 * Clear weather produces a whisper-light breeze; blizzards drive strong sweeping waves
 * that visibly bend foliage, banners, and lanterns in the wind direction.
 */
export function computeWindGustSample(input: WindTiltInput): WindGustSample {
  const intensity = Math.max(0, Math.min(1.25, input.gustIntensity));
  const stiffness = Math.max(0.25, input.stiffness ?? 1.0);
  const offset = input.phaseOffset ?? 0;

  // Traveling wave crest moving along WIND_DIRECTION across the forest clearing
  const proj = input.worldX * WIND_DIRECTION.x + input.worldZ * WIND_DIRECTION.z;
  const cross = -input.worldX * WIND_DIRECTION.z + input.worldZ * WIND_DIRECTION.x;

  const waveSpeed = 2.4 + intensity * 3.1;
  const gustWaveA = Math.sin(proj * 0.16 - input.time * waveSpeed + offset);
  const gustWaveB = Math.sin(proj * 0.08 + cross * 0.11 - input.time * (waveSpeed * 0.65) + offset * 1.7);
  const gustEnvelope = 0.58 + 0.27 * gustWaveA + 0.15 * gustWaveB;

  const turbulenceFreq = 4.6 + intensity * 6.2;
  const flutterRaw =
    Math.sin(input.time * turbulenceFreq + input.worldX * 0.73 + input.worldZ * 0.91 + offset) * 0.65 +
    Math.cos(input.time * (turbulenceFreq * 1.47) - input.worldZ * 0.6 + offset * 2.1) * 0.35;

  // Baseline gentle ambient sway in clear skies + dramatic directional bend in gusts/blizzards
  const ambientBreeze = 0.015 / stiffness;
  const gustLean = (intensity * intensity * 0.27 + intensity * 0.095) / stiffness;
  const totalForward = ambientBreeze * (0.4 + gustEnvelope) + gustLean * Math.max(0.25, gustEnvelope);

  const flutterScale = (0.008 + intensity * 0.088) / stiffness;
  const flutter = flutterRaw * flutterScale;

  // Subtle cross-wind wobble from vortices, smaller than main directional lean
  const crossWobble = flutter * 0.42;

  const leanX = WIND_DIRECTION.x * (totalForward + flutter * 0.65) - WIND_DIRECTION.z * crossWobble;
  const leanZ = WIND_DIRECTION.z * (totalForward + flutter * 0.65) + WIND_DIRECTION.x * crossWobble;

  return {
    leanX,
    leanZ,
    flutter,
    gustFactor: gustEnvelope * intensity,
  };
}

/**
 * Converts a desired world-space XZ lean vector (leanX toward +X, leanZ toward +Z)
 * into Euler X and Z rotations inside a parent object rotated by `parentYaw` around Y.
 *
 * In Three.js right-handed coordinates:
 * - A positive X rotation leans +Y forward toward +Z.
 * - A negative Z rotation leans +Y right toward +X.
 */
export function worldLeanToLocalEuler(
  leanX: number,
  leanZ: number,
  parentYaw: number,
): { rotX: number; rotZ: number } {
  const cos = Math.cos(parentYaw);
  const sin = Math.sin(parentYaw);
  // Inverse Y-rotation (-parentYaw) transforms world XZ vector into object's local XZ plane:
  // localX =  cos(y) * worldX - sin(y) * worldZ
  // localZ =  sin(y) * worldX + cos(y) * worldZ
  const localX = cos * leanX - sin * leanZ;
  const localZ = sin * leanX + cos * leanZ;

  return {
    rotX: localZ,
    rotZ: -localX,
  };
}
