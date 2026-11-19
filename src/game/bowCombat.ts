import { angleDiff, clamp } from './kinematics';

export type BowTargetKind = 'hunter' | 'boss' | 'animal';

export interface BowCandidateTarget {
  id: string;
  kind: BowTargetKind;
  label: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  isHostile: boolean;
  isTrackedQuarry: boolean;
  hitRadius: number;
}

export interface BowAutoAimInput {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  maxRange: number;
  arrowSpeed: number;
  candidates: BowCandidateTarget[];
  preferredTargetId?: string | null;
}

export interface BowAutoAimResult {
  target: BowCandidateTarget;
  distance: number;
  aimX: number;
  aimZ: number;
  aimYaw: number;
  ballisticLeadSeconds: number;
}

/**
 * Selects the highest-priority live bow target within range and computes
 * first-order velocity-predicted lead coordinates for accurate auto-aim & auto-fire.
 */
export function selectBestBowTarget(input: BowAutoAimInput): BowAutoAimResult | null {
  const {
    playerX,
    playerZ,
    playerYaw,
    maxRange,
    arrowSpeed,
    candidates,
    preferredTargetId = null,
  } = input;

  if (candidates.length === 0 || maxRange <= 0) return null;

  const effectiveRange = maxRange * 1.04;
  const safeArrowSpeed = Math.max(10, arrowSpeed);

  let bestCandidate: BowCandidateTarget | null = null;
  let bestScore = -Infinity;
  let bestDist = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.hp <= 0) continue;
    const dx = c.x - playerX;
    const dz = c.z - playerZ;
    const dist = Math.hypot(dx, dz);
    if (dist > effectiveRange + c.hitRadius * 0.5) continue;

    // Score prefers close threats, hostile hunters/bosses/predators, and tracked quarry
    const distNorm = 1 - clamp(dist / Math.max(1, effectiveRange), 0, 1);
    let score = distNorm * 100;

    if (c.kind === 'hunter') {
      score += c.isHostile ? 46 : 32;
    } else if (c.kind === 'boss') {
      score += c.isHostile ? 44 : 26;
    } else if (c.isHostile) {
      score += 36;
    }

    if (c.isTrackedQuarry) {
      score += 22;
    }

    // Immediate close-range danger boost so charging enemies get targeted first
    if (dist < 11) {
      score += (11 - dist) * 3.5;
    }

    // Small angular hysteresis & lock persistence to prevent rapid target flipping
    const rawYaw = dist > 0.05 ? Math.atan2(dx, dz) : playerYaw;
    const yawAlign = 1 - Math.abs(angleDiff(playerYaw, rawYaw)) / Math.PI;
    score += yawAlign * 12;

    if (preferredTargetId && c.id === preferredTargetId) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = c;
      bestDist = dist;
    }
  }

  if (!bestCandidate) return null;

  const tFlight = clamp(bestDist / safeArrowSpeed, 0, 0.65);
  const aimX = bestCandidate.x + bestCandidate.vx * tFlight * 0.85;
  const aimZ = bestCandidate.z + bestCandidate.vz * tFlight * 0.85;
  const adx = aimX - playerX;
  const adz = aimZ - playerZ;
  const aimYaw =
    Math.hypot(adx, adz) > 0.05
      ? Math.atan2(adx, adz)
      : Math.atan2(bestCandidate.x - playerX, bestCandidate.z - playerZ);

  return {
    target: bestCandidate,
    distance: bestDist,
    aimX,
    aimZ,
    aimYaw,
    ballisticLeadSeconds: tFlight,
  };
}
