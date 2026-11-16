import type {
  AnimalKind,
  AnimalRarity,
  HuntersSightState,
  MinimapWildlifeBlip,
  TrackInspectClueHud,
  TrackedQuarryHudInfo,
  ZoneId,
} from './types';
import { SPECIES_SPECS } from './wildlife';
import { cardinalBearingFromDelta } from './zones';

export const HUNTERS_SIGHT_DURATION = 10;
export const HUNTERS_SIGHT_COOLDOWN = 18;
export const HUNTERS_SIGHT_RADIUS = 72;
export const CLOSE_RADAR_RADIUS = 14;
export const TRACK_MAX_AGE = 34;
export const TRACK_INSPECT_RADIUS = 3.2;
export const MIN_TRACK_DROP_DIST = 2.6;
export const MAX_ACTIVE_TRACKS = 48;
export const TRACK_AMBUSH_DURATION = 12;
export const TRACK_AMBUSH_DAMAGE_MULT = 1.25;

export interface TrackRecordLike {
  id: number;
  zone: ZoneId;
  kind: AnimalKind;
  animalId: number;
  x: number;
  z: number;
  yaw: number;
  age: number;
}

export interface TrackableAnimalLike {
  id: number;
  zone: ZoneId;
  kind: AnimalKind;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  state: string;
}

export function createInitialHuntersSightState(): HuntersSightState {
  return {
    active: false,
    timeLeft: 0,
    duration: HUNTERS_SIGHT_DURATION,
    cooldownLeft: 0,
    cooldownDuration: HUNTERS_SIGHT_COOLDOWN,
    pulseRadius: HUNTERS_SIGHT_RADIUS,
  };
}

export function activateHuntersSight(state: HuntersSightState): {
  state: HuntersSightState;
  activated: boolean;
} {
  if (state.active || state.cooldownLeft > 0) {
    return { state, activated: false };
  }
  return {
    activated: true,
    state: {
      ...state,
      active: true,
      timeLeft: state.duration,
      cooldownLeft: state.cooldownDuration,
    },
  };
}

export function tickHuntersSight(
  state: HuntersSightState,
  dt: number,
): { state: HuntersSightState; expired: boolean; readyNow: boolean } {
  let active = state.active;
  let timeLeft = state.timeLeft;
  let cooldownLeft = state.cooldownLeft;
  let expired = false;
  let readyNow = false;

  if (active) {
    timeLeft = Math.max(0, timeLeft - dt);
    if (timeLeft <= 0) {
      active = false;
      timeLeft = 0;
      expired = true;
    }
  }

  if (cooldownLeft > 0) {
    cooldownLeft = Math.max(0, cooldownLeft - dt);
    if (cooldownLeft <= 0) {
      cooldownLeft = 0;
      readyNow = true;
    }
  }

  return {
    state: {
      ...state,
      active,
      timeLeft,
      cooldownLeft,
    },
    expired,
    readyNow,
  };
}

export function getRarityPriority(rarity: AnimalRarity): number {
  switch (rarity) {
    case 'mythic':
      return 5;
    case 'epic':
      return 4;
    case 'rare':
      return 3;
    case 'uncommon':
      return 2;
    default:
      return 1;
  }
}

export function getRarityColorHex(rarity: AnimalRarity): number {
  switch (rarity) {
    case 'mythic':
      return 0xf0abfc;
    case 'epic':
      return 0xf6c344;
    case 'rare':
      return 0x5be7ff;
    case 'uncommon':
      return 0x8ed49a;
    default:
      return 0xcbd5e1;
  }
}

export function computeTrackVisualAlpha(
  age: number,
  sightActive: boolean,
  maxAge = TRACK_MAX_AGE,
): number {
  const life = Math.max(0, Math.min(1, 1 - age / Math.max(1, maxAge)));
  if (life <= 0) return 0;
  return sightActive ? Math.min(0.95, 0.38 + life * 0.57) : Math.min(0.68, 0.16 + life * 0.52);
}

export function formatAnimalStateLabel(state: string): string {
  switch (state) {
    case 'stalk':
      return 'Stalking';
    case 'windup':
    case 'lunge':
      return 'Attacking';
    case 'flee':
      return 'Fleeing';
    case 'alert':
      return 'Alert';
    case 'curious':
      return 'Curious';
    default:
      return 'Grazing';
  }
}

export function findNearestInspectableTrack<T extends TrackRecordLike>(
  tracks: readonly T[],
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  maxDist = TRACK_INSPECT_RADIUS,
): { track: T; clue: TrackInspectClueHud } | null {
  let best: T | null = null;
  let bestDist = maxDist;

  for (let i = 0; i < tracks.length; i++) {
    const tr = tracks[i];
    if (tr.zone !== zone || tr.age >= TRACK_MAX_AGE) continue;
    const d = Math.hypot(tr.x - playerX, tr.z - playerZ);
    if (d <= bestDist) {
      bestDist = d;
      best = tr;
    }
  }

  if (!best) return null;
  const spec = SPECIES_SPECS[best.kind];
  const dirX = Math.sin(best.yaw);
  const dirZ = Math.cos(best.yaw);
  return {
    track: best,
    clue: {
      kind: best.kind,
      label: spec.label,
      rarity: spec.rarity,
      distance: Math.round(bestDist * 10) / 10,
      direction: cardinalBearingFromDelta(dirX, dirZ),
      freshnessPct: Math.max(
        5,
        Math.round((1 - best.age / TRACK_MAX_AGE) * 100),
      ),
    },
  };
}

export function selectBestTrackedQuarry(
  animals: readonly TrackableAnimalLike[],
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  preferredAnimalId: number | null,
  sightActive: boolean,
  ambushBonusTimer = 0,
): TrackedQuarryHudInfo | null {
  const living = animals.filter((a) => a.zone === zone && a.state !== 'ko');
  if (living.length === 0) return null;

  let chosen: TrackableAnimalLike | null = null;
  if (preferredAnimalId !== null) {
    chosen = living.find((a) => a.id === preferredAnimalId) ?? null;
  }

  if (!chosen && !sightActive) {
    return null;
  }

  if (!chosen) {
    // During Hunter's Sight without explicit lock: prioritize rare/epic/mythic within sight radius, else closest animal
    let bestScore = -Infinity;
    for (let i = 0; i < living.length; i++) {
      const a = living[i];
      const dist = Math.hypot(a.x - playerX, a.z - playerZ);
      if (dist > HUNTERS_SIGHT_RADIUS) continue;
      const spec = SPECIES_SPECS[a.kind];
      const rarityWeight = getRarityPriority(spec.rarity) * 28;
      const score = rarityWeight - dist;
      if (score > bestScore) {
        bestScore = score;
        chosen = a;
      }
    }
  }

  if (!chosen) {
    // Fallback to nearest living animal in active zone
    let nearestDist = Infinity;
    for (let i = 0; i < living.length; i++) {
      const a = living[i];
      const d = Math.hypot(a.x - playerX, a.z - playerZ);
      if (d < nearestDist) {
        nearestDist = d;
        chosen = a;
      }
    }
  }

  if (!chosen) return null;
  const spec = SPECIES_SPECS[chosen.kind];
  const dx = chosen.x - playerX;
  const dz = chosen.z - playerZ;

  return {
    id: chosen.id,
    kind: chosen.kind,
    label: spec.label,
    rarity: spec.rarity,
    predator: spec.predator,
    distance: Math.round(Math.hypot(dx, dz)),
    direction: cardinalBearingFromDelta(dx, dz),
    hp: Math.max(0, Math.round(chosen.hp)),
    maxHp: Math.max(1, Math.round(chosen.maxHp)),
    state: formatAnimalStateLabel(chosen.state),
    ambushReady: ambushBonusTimer > 0,
  };
}

export function collectMinimapWildlifeBlips(
  animals: readonly TrackableAnimalLike[],
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  sightActive: boolean,
  preferredAnimalId: number | null,
): MinimapWildlifeBlip[] {
  const blips: MinimapWildlifeBlip[] = [];
  for (let i = 0; i < animals.length; i++) {
    const a = animals[i];
    if (a.zone !== zone || a.state === 'ko') continue;
    const isLocked = preferredAnimalId !== null && a.id === preferredAnimalId;
    const dist = Math.hypot(a.x - playerX, a.z - playerZ);
    const visible =
      isLocked ||
      (sightActive ? dist <= HUNTERS_SIGHT_RADIUS : dist <= CLOSE_RADAR_RADIUS);
    if (!visible) continue;
    const spec = SPECIES_SPECS[a.kind];
    blips.push({
      id: a.id,
      kind: a.kind,
      rarity: spec.rarity,
      predator: spec.predator,
      x: Math.round(a.x * 100) / 100,
      z: Math.round(a.z * 100) / 100,
      locked: isLocked,
    });
  }
  return blips;
}

/**
 * Picks an engaging forest wildlife species to flush/spawn when activating Hunter's Sight
 * in a quiet sector or following cold tracks. Respects active caps and favors uncommon/rare
 * regional game so forest hunting feels rewarding.
 */
export function pickForestFlushSpecies(
  counts: Partial<Record<AnimalKind, number>>,
  zone: ZoneId,
  rng: () => number = Math.random,
  preferredKind: AnimalKind | null = null,
): AnimalKind {
  if (preferredKind) {
    const prefSpec = SPECIES_SPECS[preferredKind];
    if ((counts[preferredKind] ?? 0) < prefSpec.maxActive + (zone === 'level2' ? 1 : 0)) {
      return preferredKind;
    }
  }

  const pool: { kind: AnimalKind; weight: number }[] =
    zone === 'level2'
      ? [
          { kind: 'frost_stag', weight: 3.0 },
          { kind: 'musk_ox', weight: 2.5 },
          { kind: 'lynx', weight: 2.2 },
          { kind: 'polar_bear', weight: 2.0 },
          { kind: 'sabertooth', weight: 1.4 },
          { kind: 'wolf', weight: 2.0 },
          { kind: 'aurora_fenrir', weight: 0.7 },
        ]
      : [
          { kind: 'stag', weight: 2.8 },
          { kind: 'fox', weight: 2.4 },
          { kind: 'lynx', weight: 2.0 },
          { kind: 'wolf', weight: 2.0 },
          { kind: 'frost_stag', weight: 1.6 },
          { kind: 'polar_bear', weight: 1.2 },
          { kind: 'musk_ox', weight: 1.2 },
          { kind: 'hare', weight: 1.5 },
        ];

  const available = pool.filter(
    (entry) =>
      (counts[entry.kind] ?? 0) <
      SPECIES_SPECS[entry.kind].maxActive + (zone === 'level2' ? 1 : 0),
  );
  const candidates = available.length > 0 ? available : pool;
  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  let pick = rng() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    pick -= candidates[i].weight;
    if (pick <= 0) {
      return candidates[i].kind;
    }
  }
  return candidates[0].kind;
}
