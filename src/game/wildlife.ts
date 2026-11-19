import type { AnimalKind, AnimalRarity, WeatherKind, ZoneId } from './types';
import { computeNightFactor, computeWildlifeTimeProfile } from './daynight';

export type AnimalBehaviorState =
  | 'wander'
  | 'curious'
  | 'alert'
  | 'flee'
  | 'stalk'
  | 'windup'
  | 'lunge'
  | 'ko';

export interface SpeciesSpec {
  kind: AnimalKind;
  label: string;
  rarity: AnimalRarity;
  targetCount: number;
  maxActive: number;
  /** Probability roll weight / chance per dynamic spawn cycle for rare/epic encounters (0 for guaranteed baseline). */
  spawnChance: number;
  maxHp: number;
  minSpawnR: number;
  maxSpawnR: number;
  respawnDelay: number;
  wanderSpeed: number;
  fleeSpeed: number;
  stalkSpeed: number;
  lungeSpeed: number;
  lungeDamage: number;
  windupDuration: number;
  detectRadius: number;
  spookRadius: number;
  peltDrop: number;
  meatDrop: number;
  goldDrop: number;
  iceDrop?: number;
  predator: boolean;
}

export const SPECIES_SPECS: Record<AnimalKind, SpeciesSpec> = {
  hare: {
    kind: 'hare',
    label: 'Snow Hare',
    rarity: 'common',
    targetCount: 6,
    maxActive: 6,
    spawnChance: 0,
    maxHp: 30,
    minSpawnR: 15,
    maxSpawnR: 33,
    respawnDelay: 8,
    wanderSpeed: 1.9,
    fleeSpeed: 7.4,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 9.5,
    spookRadius: 5.8,
    peltDrop: 1,
    meatDrop: 2,
    goldDrop: 5,
    predator: false,
  },
  fox: {
    kind: 'fox',
    label: 'Winter Fox',
    rarity: 'common',
    targetCount: 5,
    maxActive: 5,
    spawnChance: 0,
    maxHp: 45,
    minSpawnR: 17,
    maxSpawnR: 37,
    respawnDelay: 10,
    wanderSpeed: 2.5,
    fleeSpeed: 8.6,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 12.5,
    spookRadius: 5.2,
    peltDrop: 2,
    meatDrop: 2,
    goldDrop: 12,
    predator: false,
  },
  stag: {
    kind: 'stag',
    label: 'Alpine Deer',
    rarity: 'common',
    targetCount: 5,
    maxActive: 5,
    spawnChance: 0,
    maxHp: 75,
    minSpawnR: 19,
    maxSpawnR: 41,
    respawnDelay: 12,
    wanderSpeed: 2.2,
    fleeSpeed: 8.8,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 11.5,
    spookRadius: 5.5,
    peltDrop: 2,
    meatDrop: 5,
    goldDrop: 10,
    predator: false,
  },
  wolf: {
    kind: 'wolf',
    label: 'Timber Wolf',
    rarity: 'uncommon',
    targetCount: 4,
    maxActive: 4,
    spawnChance: 0,
    maxHp: 105,
    minSpawnR: 25,
    maxSpawnR: 45,
    respawnDelay: 15,
    wanderSpeed: 2.8,
    fleeSpeed: 4.8,
    stalkSpeed: 4.8,
    lungeSpeed: 14.5,
    lungeDamage: 14,
    windupDuration: 0.48,
    detectRadius: 15.0,
    spookRadius: 4.5,
    peltDrop: 3,
    meatDrop: 3,
    goldDrop: 18,
    predator: true,
  },
  lynx: {
    kind: 'lynx',
    label: 'Snow Lynx',
    rarity: 'uncommon',
    targetCount: 2,
    maxActive: 2,
    spawnChance: 0,
    maxHp: 90,
    minSpawnR: 21,
    maxSpawnR: 43,
    respawnDelay: 16,
    wanderSpeed: 2.7,
    fleeSpeed: 6.4,
    stalkSpeed: 5.6,
    lungeSpeed: 16.0,
    lungeDamage: 13,
    windupDuration: 0.4,
    detectRadius: 13.5,
    spookRadius: 4.2,
    peltDrop: 3,
    meatDrop: 3,
    goldDrop: 24,
    predator: true,
  },
  snow_owl: {
    kind: 'snow_owl',
    label: 'Great Snowy Owl',
    rarity: 'uncommon',
    targetCount: 2,
    maxActive: 3,
    spawnChance: 0.095,
    maxHp: 82,
    minSpawnR: 18,
    maxSpawnR: 44,
    respawnDelay: 15,
    wanderSpeed: 3.1,
    fleeSpeed: 9.2,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 12.8,
    spookRadius: 4.6,
    peltDrop: 3,
    meatDrop: 2,
    goldDrop: 22,
    iceDrop: 1,
    predator: false,
  },
  wolverine: {
    kind: 'wolverine',
    label: 'Glacier Wolverine',
    rarity: 'rare',
    targetCount: 1,
    maxActive: 2,
    spawnChance: 0.085,
    maxHp: 165,
    minSpawnR: 23,
    maxSpawnR: 45,
    respawnDelay: 24,
    wanderSpeed: 2.65,
    fleeSpeed: 5.8,
    stalkSpeed: 5.4,
    lungeSpeed: 15.2,
    lungeDamage: 18,
    windupDuration: 0.46,
    detectRadius: 14.8,
    spookRadius: 4.4,
    peltDrop: 5,
    meatDrop: 5,
    goldDrop: 42,
    iceDrop: 1,
    predator: true,
  },
  polar_bear: {
    kind: 'polar_bear',
    label: 'Arctic Polar Bear',
    rarity: 'rare',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.08,
    maxHp: 210,
    minSpawnR: 27,
    maxSpawnR: 46,
    respawnDelay: 35,
    wanderSpeed: 2.0,
    fleeSpeed: 3.6,
    stalkSpeed: 4.3,
    lungeSpeed: 12.8,
    lungeDamage: 22,
    windupDuration: 0.65,
    detectRadius: 16.0,
    spookRadius: 5.0,
    peltDrop: 6,
    meatDrop: 8,
    goldDrop: 55,
    iceDrop: 1,
    predator: true,
  },
  frost_stag: {
    kind: 'frost_stag',
    label: 'Frosthorn White Stag',
    rarity: 'rare',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.075,
    maxHp: 155,
    minSpawnR: 24,
    maxSpawnR: 45,
    respawnDelay: 35,
    wanderSpeed: 2.4,
    fleeSpeed: 9.8,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 13.8,
    spookRadius: 6.4,
    peltDrop: 5,
    meatDrop: 7,
    goldDrop: 48,
    iceDrop: 2,
    predator: false,
  },
  musk_ox: {
    kind: 'musk_ox',
    label: 'Tundra Musk Ox',
    rarity: 'rare',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.075,
    maxHp: 240,
    minSpawnR: 24,
    maxSpawnR: 45,
    respawnDelay: 36,
    wanderSpeed: 1.75,
    fleeSpeed: 6.8,
    stalkSpeed: 0,
    lungeSpeed: 0,
    lungeDamage: 0,
    windupDuration: 0,
    detectRadius: 12.2,
    spookRadius: 4.8,
    peltDrop: 7,
    meatDrop: 10,
    goldDrop: 58,
    iceDrop: 1,
    predator: false,
  },
  frost_boar: {
    kind: 'frost_boar',
    label: 'Razorback Frost Boar',
    rarity: 'epic',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.045,
    maxHp: 265,
    minSpawnR: 26,
    maxSpawnR: 46,
    respawnDelay: 42,
    wanderSpeed: 2.4,
    fleeSpeed: 5.2,
    stalkSpeed: 5.2,
    lungeSpeed: 15.8,
    lungeDamage: 24,
    windupDuration: 0.56,
    detectRadius: 15.6,
    spookRadius: 4.8,
    peltDrop: 7,
    meatDrop: 11,
    goldDrop: 84,
    iceDrop: 2,
    predator: true,
  },
  mammoth: {
    kind: 'mammoth',
    label: 'Elder Woolly Mammoth',
    rarity: 'epic',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.032,
    maxHp: 360,
    minSpawnR: 30,
    maxSpawnR: 47,
    respawnDelay: 55,
    wanderSpeed: 1.55,
    fleeSpeed: 2.8,
    stalkSpeed: 3.6,
    lungeSpeed: 11.4,
    lungeDamage: 28,
    windupDuration: 0.85,
    detectRadius: 16.5,
    spookRadius: 5.5,
    peltDrop: 10,
    meatDrop: 16,
    goldDrop: 115,
    iceDrop: 2,
    predator: true,
  },
  sabertooth: {
    kind: 'sabertooth',
    label: 'Glacial Sabertooth',
    rarity: 'epic',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.032,
    maxHp: 280,
    minSpawnR: 28,
    maxSpawnR: 46,
    respawnDelay: 50,
    wanderSpeed: 2.85,
    fleeSpeed: 5.5,
    stalkSpeed: 6.1,
    lungeSpeed: 17.4,
    lungeDamage: 24,
    windupDuration: 0.42,
    detectRadius: 16.2,
    spookRadius: 4.4,
    peltDrop: 8,
    meatDrop: 7,
    goldDrop: 105,
    iceDrop: 2,
    predator: true,
  },
  aurora_fenrir: {
    kind: 'aurora_fenrir',
    label: 'Aurora Frost-Fenrir',
    rarity: 'mythic',
    targetCount: 0,
    maxActive: 1,
    spawnChance: 0.015,
    maxHp: 460,
    minSpawnR: 31,
    maxSpawnR: 47,
    respawnDelay: 75,
    wanderSpeed: 3.0,
    fleeSpeed: 6.0,
    stalkSpeed: 6.4,
    lungeSpeed: 18.2,
    lungeDamage: 30,
    windupDuration: 0.52,
    detectRadius: 17.5,
    spookRadius: 4.8,
    peltDrop: 14,
    meatDrop: 12,
    goldDrop: 220,
    iceDrop: 4,
    predator: true,
  },
};

export const BASE_WILDLIFE_SPECIES_ORDER: AnimalKind[] = [
  'hare',
  'fox',
  'stag',
  'wolf',
  'snow_owl',
];

export const WILDLIFE_SPECIES_ORDER: AnimalKind[] = [
  'hare',
  'fox',
  'stag',
  'wolf',
  'lynx',
  'snow_owl',
  'wolverine',
  'polar_bear',
  'frost_stag',
  'musk_ox',
  'frost_boar',
  'mammoth',
  'sabertooth',
  'aurora_fenrir',
];

export const RARE_AND_EPIC_SPECIES: AnimalKind[] = [
  'aurora_fenrir',
  'mammoth',
  'sabertooth',
  'frost_boar',
  'polar_bear',
  'wolverine',
  'frost_stag',
  'musk_ox',
];

export function computeMovementNoiseFactor(playerSpeed: number): number {
  if (playerSpeed < 0.35) return 0.55;
  if (playerSpeed <= 4.8) return 0.78;
  return 1.22;
}

export function computeEffectiveRadii(
  spec: SpeciesSpec,
  playerSpeed: number,
  weather: WeatherKind,
  timeOfDay = 0.5,
): { detectRadius: number; spookRadius: number } {
  const noise = computeMovementNoiseFactor(playerSpeed);
  const weatherFactor =
    weather === 'clear'
      ? 1.08
      : weather === 'blizzard'
        ? spec.predator
          ? 1.12
          : 0.78
        : 1.0;
  const timeProfile = computeWildlifeTimeProfile(timeOfDay, spec.kind);

  return {
    detectRadius:
      spec.detectRadius * noise * weatherFactor * timeProfile.detectRadiusScale,
    spookRadius:
      spec.spookRadius * noise * weatherFactor * timeProfile.spookRadiusScale,
  };
}

export function isUnawareBehavior(state: AnimalBehaviorState): boolean {
  return state === 'wander' || state === 'curious';
}

export interface PreyReactionInput {
  kind: AnimalKind;
  state: AnimalBehaviorState;
  stateTimer: number;
  distPlayer: number;
  playerSpeed: number;
  weather: WeatherKind;
  timeOfDay?: number;
  dxToPlayer: number;
  dzToPlayer: number;
  wanderAngle: number;
  dt: number;
  rng?: () => number;
}

export interface PreyReactionResult {
  state: AnimalBehaviorState;
  stateTimer: number;
  wanderAngle: number;
  vx: number;
  vz: number;
  facingYaw: number | null;
}

export function evaluatePreyReaction(input: PreyReactionInput): PreyReactionResult {
  const {
    kind,
    distPlayer,
    playerSpeed,
    weather,
    timeOfDay = 0.5,
    dxToPlayer,
    dzToPlayer,
    dt,
    rng = Math.random,
  } = input;
  const spec = SPECIES_SPECS[kind];
  const timeProfile = computeWildlifeTimeProfile(timeOfDay, kind);
  const { detectRadius, spookRadius } = computeEffectiveRadii(
    spec,
    playerSpeed,
    weather,
    timeOfDay,
  );
  const isLargeGrazer = kind === 'stag' || kind === 'frost_stag' || kind === 'musk_ox';
  const isCuriousSpecies = kind === 'fox' || kind === 'snow_owl';

  let state = input.state;
  let stateTimer = input.stateTimer;
  let wanderAngle = input.wanderAngle;
  let facingYaw: number | null = null;

  const awayAngle = Math.atan2(-dxToPlayer, -dzToPlayer);
  const towardAngle = Math.atan2(dxToPlayer, dzToPlayer);

  // Immediate close/loud spook triggers flee
  if (distPlayer < spookRadius && state !== 'flee') {
    state = 'flee';
    stateTimer = kind === 'hare' ? 2.1 : isCuriousSpecies ? 2.4 : 2.7;
    const jitter = kind === 'hare' ? (rng() - 0.5) * 0.7 : (rng() - 0.5) * 0.4;
    wanderAngle = awayAngle + jitter;
  } else if (state === 'flee') {
    stateTimer -= dt;
    if (kind === 'hare' || isCuriousSpecies || kind === 'frost_stag') {
      // Subtle evasive zig-zag while fleeing
      wanderAngle += Math.sin(stateTimer * 7.5) * 1.1 * dt;
    }
    if (stateTimer <= 0) {
      state = 'wander';
      stateTimer = 1.5 + rng() * 1.5;
    }
  } else if (state === 'alert') {
    stateTimer -= dt;
    facingYaw = towardAngle;

    if (distPlayer < detectRadius * 0.72 && playerSpeed > 4.8) {
      // Player kept charging toward alerted animal -> bolt!
      state = 'flee';
      stateTimer = 2.4;
      wanderAngle = awayAngle + (rng() - 0.5) * 0.35;
    } else if (stateTimer <= 0) {
      if (isCuriousSpecies && playerSpeed < 1.2 && distPlayer < detectRadius) {
        state = 'curious';
        stateTimer = 2.2;
      } else if (distPlayer < detectRadius * 0.85 && playerSpeed > 1.6) {
        state = 'flee';
        stateTimer = 2.2;
        wanderAngle = awayAngle;
      } else {
        state = 'wander';
        stateTimer = 1.8 + rng() * 1.8;
      }
    }
    return {
      state,
      stateTimer,
      wanderAngle,
      vx: 0,
      vz: 0,
      facingYaw,
    };
  } else if (state === 'curious' && isCuriousSpecies) {
    stateTimer -= dt;
    if (playerSpeed > 4.8 && distPlayer < detectRadius * 0.8) {
      state = 'alert';
      stateTimer = 0.75;
      facingYaw = towardAngle;
      return { state, stateTimer, wanderAngle, vx: 0, vz: 0, facingYaw };
    }
    if (stateTimer <= 0 || distPlayer > spec.detectRadius * 1.15) {
      state = 'wander';
      stateTimer = 1.6 + rng() * 1.8;
    } else {
      // Circle / observe player cautiously at ~8-11m
      const orbitAngle = towardAngle + (Math.PI / 2) * (distPlayer < 9.2 ? 1.18 : 0.78);
      const speed = distPlayer > 10.5 ? 1.6 : 1.1;
      return {
        state,
        stateTimer,
        wanderAngle: orbitAngle,
        vx: Math.sin(orbitAngle) * speed,
        vz: Math.cos(orbitAngle) * speed,
        facingYaw: towardAngle,
      };
    }
  } else {
    // 'wander' state checks sensory triggers
    if (isCuriousSpecies && playerSpeed < 1.2 && distPlayer < spec.detectRadius * 0.9) {
      state = 'curious';
      stateTimer = 2.2;
      facingYaw = towardAngle;
    } else if (distPlayer < detectRadius) {
      if (
        (isLargeGrazer && playerSpeed > 1.5) ||
        (isCuriousSpecies && playerSpeed >= 1.2) ||
        (kind === 'hare' && playerSpeed > 4.2)
      ) {
        state = 'alert';
        stateTimer = isLargeGrazer ? 1.05 : isCuriousSpecies ? 0.85 : 0.65;
        facingYaw = towardAngle;
        return { state, stateTimer, wanderAngle, vx: 0, vz: 0, facingYaw };
      }
    }

    stateTimer -= dt;
    if (stateTimer <= 0) {
      stateTimer = (isLargeGrazer ? 2.2 : 1.4) + rng() * 2.4;
      wanderAngle += (rng() - 0.5) * (kind === 'hare' ? 2.4 : 1.8);
    }
  }

  if (state === 'flee') {
    const fleeSpd = spec.fleeSpeed * timeProfile.speedScale;
    return {
      state,
      stateTimer,
      wanderAngle,
      vx: Math.sin(wanderAngle) * fleeSpd,
      vz: Math.cos(wanderAngle) * fleeSpd,
      facingYaw: null,
    };
  }

  let speed = spec.wanderSpeed * timeProfile.speedScale;
  if (isLargeGrazer && Math.sin(stateTimer * 1.5) > 0.3) {
    speed = 0.45 * timeProfile.speedScale; // Grazing pause
  }

  return {
    state,
    stateTimer,
    wanderAngle,
    vx: Math.sin(wanderAngle) * speed,
    vz: Math.cos(wanderAngle) * speed,
    facingYaw,
  };
}

export function pickMissingSpecies(
  counts: Partial<Record<AnimalKind, number>>,
): AnimalKind | null {
  let bestKind: AnimalKind | null = null;
  let bestDeficit = 0;

  for (const kind of BASE_WILDLIFE_SPECIES_ORDER) {
    const target = SPECIES_SPECS[kind].targetCount;
    const deficit = target - (counts[kind] ?? 0);
    if (deficit > bestDeficit) {
      bestDeficit = deficit;
      bestKind = kind;
    }
  }
  return bestKind;
}

/**
 * Dynamic forest population spawner that maintains common/uncommon wildlife while
 * giving Rare (polar_bear, frost_stag, wolverine) and Epic (mammoth, frost_boar, sabertooth)
 * creatures a small probability of appearing when below their active cap, and adjusting
 * spawn priority by time of day.
 */
export function pickDynamicWildlifeSpawn(
  counts: Partial<Record<AnimalKind, number>>,
  rng: () => number = Math.random,
  timeOfDay = 0.5,
  zone: ZoneId = 'level1',
): AnimalKind | null {
  const roll = rng();
  const isHighZone = zone !== 'level1' && zone !== 'city';
  const rarityZoneScale =
    zone === 'level5'
      ? 4.8
      : zone === 'level4'
        ? 3.8
        : zone === 'level3'
          ? 3.0
          : zone === 'level2'
            ? 2.4
            : 1.0;
  const maxActiveBonus =
    zone === 'level5'
      ? 3
      : zone === 'level4' || zone === 'level3'
        ? 2
        : zone === 'level2'
          ? 1
          : 0;
  let cumulative = 0;
  for (const kind of RARE_AND_EPIC_SPECIES) {
    const spec = SPECIES_SPECS[kind];
    if ((counts[kind] ?? 0) >= spec.maxActive + maxActiveBonus) continue;
    const timeProfile = computeWildlifeTimeProfile(timeOfDay, kind);
    cumulative += spec.spawnChance * rarityZoneScale * timeProfile.spawnWeightScale;
    if (roll < cumulative) {
      return kind;
    }
  }

  const night = computeNightFactor(timeOfDay);
  const candidates: AnimalKind[] =
    zone === 'level5' || zone === 'level4'
      ? ['wolf', 'lynx', 'wolverine', 'frost_boar', 'polar_bear', 'sabertooth', 'mammoth', 'frost_stag', 'musk_ox', 'snow_owl', 'fox']
      : zone === 'level3' || zone === 'level2'
        ? ['wolf', 'lynx', 'wolverine', 'snow_owl', 'frost_stag', 'musk_ox', 'frost_boar', 'polar_bear', 'fox', 'hare']
        : night > 0.45
          ? ['wolf', 'lynx', 'snow_owl', 'wolverine', 'fox', 'hare', 'stag']
          : ['hare', 'fox', 'stag', 'snow_owl', 'wolf', 'lynx', 'wolverine'];

  const highZoneBaselineTargets: Partial<Record<AnimalKind, number>> =
    zone === 'level5'
      ? {
          wolf: 5,
          lynx: 4,
          wolverine: 3,
          frost_boar: 2,
          snow_owl: 2,
          polar_bear: 3,
          sabertooth: 2,
          mammoth: 2,
          frost_stag: 2,
          musk_ox: 2,
          fox: 2,
        }
      : zone === 'level4'
        ? {
            wolf: 5,
            lynx: 4,
            wolverine: 3,
            frost_boar: 2,
            snow_owl: 2,
            polar_bear: 2,
            sabertooth: 2,
            mammoth: 1,
            frost_stag: 2,
            musk_ox: 2,
            fox: 2,
          }
        : zone === 'level3'
          ? {
              hare: 2,
              fox: 3,
              snow_owl: 2,
              wolf: 5,
              lynx: 3,
              wolverine: 2,
              frost_stag: 2,
              musk_ox: 2,
              frost_boar: 1,
              polar_bear: 2,
            }
          : {
              hare: 3,
              fox: 3,
              snow_owl: 2,
              wolf: 4,
              lynx: 3,
              wolverine: 2,
              frost_stag: 2,
              musk_ox: 2,
              frost_boar: 1,
              polar_bear: 1,
            };

  let bestKind: AnimalKind | null = null;
  let bestWeightedDeficit = 0;
  for (const kind of candidates) {
    const spec = SPECIES_SPECS[kind];
    const timeProfile = computeWildlifeTimeProfile(timeOfDay, kind);
    const baseTarget = isHighZone
      ? (highZoneBaselineTargets[kind] ?? spec.targetCount)
      : spec.targetCount;
    // At night, active nocturnal predators get +1 dynamic pack cap; diurnal prey scale slightly down
    const dynamicTarget =
      spec.predator && night > 0.55
        ? baseTarget + 1
        : !spec.predator && night > 0.35
          ? Math.max(1, Math.round(baseTarget * timeProfile.spawnWeightScale))
          : baseTarget;
    const deficit = dynamicTarget - (counts[kind] ?? 0);
    if (deficit <= 0) continue;
    const weightedDeficit = deficit * timeProfile.spawnWeightScale;
    if (weightedDeficit > bestWeightedDeficit) {
      bestWeightedDeficit = weightedDeficit;
      bestKind = kind;
    }
  }
  return bestKind;
}

export interface SpawnPointInput {
  minR: number;
  maxR: number;
  centerX?: number;
  centerZ?: number;
  playerX: number;
  playerZ: number;
  minPlayerDist: number;
  obstacles?: { x: number; z: number }[];
  minObstacleDist?: number;
  rng?: () => number;
}

export interface HabitatAnchorZone {
  id: string;
  zone: ZoneId;
  xOffset: number;
  zOffset: number;
  radius: number;
  species: AnimalKind[];
}

export const ANIMAL_HABITAT_ZONES: HabitatAnchorZone[] = [
  // Level 1: Expanded Frostwood Valley (156m radius) curated dens & warrens
  {
    id: 'meadow_warrens_west',
    zone: 'level1',
    xOffset: -62,
    zOffset: 34,
    radius: 26,
    species: ['hare', 'fox', 'stag', 'snow_owl'],
  },
  {
    id: 'meadow_warrens_south',
    zone: 'level1',
    xOffset: 42,
    zOffset: 78,
    radius: 28,
    species: ['hare', 'fox', 'stag', 'snow_owl', 'frost_stag'],
  },
  {
    id: 'whispering_pine_nw',
    zone: 'level1',
    xOffset: -82,
    zOffset: -64,
    radius: 30,
    species: ['fox', 'stag', 'snow_owl', 'wolf', 'lynx', 'wolverine'],
  },
  {
    id: 'wolf_den_sw',
    zone: 'level1',
    xOffset: -88,
    zOffset: 74,
    radius: 28,
    species: ['wolf', 'lynx', 'wolverine', 'frost_boar', 'sabertooth', 'musk_ox'],
  },
  {
    id: 'frost_ridge_ne',
    zone: 'level1',
    xOffset: 78,
    zOffset: -82,
    radius: 30,
    species: ['wolf', 'wolverine', 'polar_bear', 'frost_stag', 'aurora_fenrir'],
  },
  {
    id: 'mammoth_hollow_se',
    zone: 'level1',
    xOffset: 92,
    zOffset: 78,
    radius: 28,
    species: ['musk_ox', 'frost_boar', 'mammoth', 'stag', 'hare'],
  },
  // Level 2: Expanded Glacial Highlands (138m radius) curated dens
  {
    id: 'glacier_basin_west',
    zone: 'level2',
    xOffset: -72,
    zOffset: -26,
    radius: 28,
    species: ['wolf', 'lynx', 'wolverine', 'musk_ox', 'polar_bear'],
  },
  {
    id: 'aurora_shrine_north',
    zone: 'level2',
    xOffset: 12,
    zOffset: -88,
    radius: 30,
    species: ['aurora_fenrir', 'frost_stag', 'frost_boar', 'sabertooth', 'mammoth'],
  },
  {
    id: 'ice_crags_east',
    zone: 'level2',
    xOffset: 76,
    zOffset: 24,
    radius: 28,
    species: ['hare', 'fox', 'snow_owl', 'lynx', 'wolverine', 'polar_bear', 'musk_ox'],
  },
  // Level 3: Rimefang Abyss (140m radius, 9x Difficulty) curated dens
  {
    id: 'rimefang_trench_nw',
    zone: 'level3',
    xOffset: -68,
    zOffset: -58,
    radius: 30,
    species: ['wolf', 'lynx', 'wolverine', 'polar_bear', 'sabertooth'],
  },
  {
    id: 'abyssal_shelf_south',
    zone: 'level3',
    xOffset: -24,
    zOffset: 72,
    radius: 28,
    species: ['musk_ox', 'frost_boar', 'frost_stag', 'mammoth', 'snow_owl', 'fox'],
  },
  {
    id: 'frozen_fang_ne',
    zone: 'level3',
    xOffset: 62,
    zOffset: -66,
    radius: 28,
    species: ['aurora_fenrir', 'polar_bear', 'wolverine', 'wolf', 'hare'],
  },
  // Level 4: Obsidian Permafrost (144m radius, 27x Difficulty) curated dens
  {
    id: 'obsidian_crags_west',
    zone: 'level4',
    xOffset: -78,
    zOffset: -24,
    radius: 30,
    species: ['sabertooth', 'frost_boar', 'polar_bear', 'wolverine', 'wolf', 'lynx'],
  },
  {
    id: 'permafrost_caldera_south',
    zone: 'level4',
    xOffset: 18,
    zOffset: 82,
    radius: 30,
    species: ['mammoth', 'frost_boar', 'musk_ox', 'aurora_fenrir', 'frost_stag'],
  },
  {
    id: 'basalt_ridge_east',
    zone: 'level4',
    xOffset: 74,
    zOffset: 42,
    radius: 28,
    species: ['wolf', 'lynx', 'wolverine', 'polar_bear', 'snow_owl', 'fox'],
  },
  // Level 5: Starfall Eternal Zero (148m radius, 81x Difficulty) curated dens
  {
    id: 'starfall_glacier_north',
    zone: 'level5',
    xOffset: 14,
    zOffset: -86,
    radius: 32,
    species: ['aurora_fenrir', 'mammoth', 'frost_boar', 'sabertooth', 'polar_bear'],
  },
  {
    id: 'eternal_zero_east',
    zone: 'level5',
    xOffset: 84,
    zOffset: 18,
    radius: 30,
    species: ['polar_bear', 'wolverine', 'sabertooth', 'wolf', 'lynx'],
  },
  {
    id: 'celestial_drift_south',
    zone: 'level5',
    xOffset: -28,
    zOffset: 84,
    radius: 30,
    species: ['frost_stag', 'snow_owl', 'musk_ox', 'mammoth', 'aurora_fenrir'],
  },
];

export function pickWildlifeSpawnPoint(input: SpawnPointInput): { x: number; z: number } {
  const {
    minR,
    maxR,
    centerX = 0,
    centerZ = 0,
    playerX,
    playerZ,
    minPlayerDist,
    obstacles = [],
    minObstacleDist = 2.0,
    rng = Math.random,
  } = input;

  let fallbackX = centerX + Math.cos(0) * ((minR + maxR) * 0.5);
  let fallbackZ = centerZ + Math.sin(0) * ((minR + maxR) * 0.5);
  let bestPlayerDist = -1;

  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = rng() * Math.PI * 2;
    const r = minR + Math.sqrt(rng()) * Math.max(1, maxR - minR);
    const x = centerX + Math.cos(angle) * r;
    const z = centerZ + Math.sin(angle) * r;
    const pDist = Math.hypot(x - playerX, z - playerZ);

    if (pDist > bestPlayerDist) {
      bestPlayerDist = pDist;
      fallbackX = x;
      fallbackZ = z;
    }

    if (pDist < minPlayerDist) continue;

    let blocked = false;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (Math.hypot(x - obs.x, z - obs.z) < minObstacleDist) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      return { x, z };
    }
  }

  return { x: fallbackX, z: fallbackZ };
}

export function pickHabitatRespawnPoint(input: {
  kind: AnimalKind;
  zone: ZoneId;
  centerX: number;
  centerZ: number;
  zoneRadius: number;
  hearthX: number;
  hearthZ: number;
  portalX?: number;
  portalZ?: number;
  forwardPortalX?: number;
  forwardPortalZ?: number;
  cityPortalX?: number;
  cityPortalZ?: number;
  playerX: number;
  playerZ: number;
  minPlayerDist: number;
  obstacles?: { x: number; z: number }[];
  minObstacleDist?: number;
  rng?: () => number;
}): { x: number; z: number } {
  const {
    kind,
    zone,
    centerX,
    centerZ,
    zoneRadius,
    hearthX,
    hearthZ,
    portalX,
    portalZ,
    forwardPortalX,
    forwardPortalZ,
    cityPortalX,
    cityPortalZ,
    playerX,
    playerZ,
    minPlayerDist,
    obstacles = [],
    minObstacleDist = 2.4,
    rng = Math.random,
  } = input;

  const matchingZones = ANIMAL_HABITAT_ZONES.filter(
    (h) => h.zone === zone && h.species.includes(kind),
  );
  const spec = SPECIES_SPECS[kind];
  const scale = zoneRadius / 50;
  // Scale habitat anchor offsets proportionally if a smaller test zoneRadius is passed
  const nominalRadius =
    zone === 'level1'
      ? 156
      : zone === 'level2'
        ? 138
        : zone === 'level3'
          ? 140
          : zone === 'level4'
            ? 144
            : 148;
  const anchorScale = Math.min(1.0, zoneRadius / nominalRadius);

  if (matchingZones.length > 0) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const anchor = matchingZones[Math.floor(rng() * matchingZones.length)];
      const angle = rng() * Math.PI * 2;
      const dist = Math.sqrt(rng()) * anchor.radius * anchorScale;
      const x = centerX + anchor.xOffset * anchorScale + Math.cos(angle) * dist;
      const z = centerZ + anchor.zOffset * anchorScale + Math.sin(angle) * dist;

      if (Math.hypot(x - centerX, z - centerZ) > zoneRadius - 4.5) continue;
      if (Math.hypot(x - hearthX, z - hearthZ) < 18) continue;
      if (Math.hypot(x - playerX, z - playerZ) < minPlayerDist) continue;
      if (portalX !== undefined && portalZ !== undefined && Math.hypot(x - portalX, z - portalZ) < 9) {
        continue;
      }
      if (
        forwardPortalX !== undefined &&
        forwardPortalZ !== undefined &&
        Math.hypot(x - forwardPortalX, z - forwardPortalZ) < 9
      ) {
        continue;
      }
      if (
        cityPortalX !== undefined &&
        cityPortalZ !== undefined &&
        Math.hypot(x - cityPortalX, z - cityPortalZ) < 9
      ) {
        continue;
      }

      let blocked = false;
      for (let i = 0; i < obstacles.length; i++) {
        if (Math.hypot(x - obstacles[i].x, z - obstacles[i].z) < minObstacleDist) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        return { x, z };
      }
    }
  }

  return pickWildlifeSpawnPoint({
    minR: spec.minSpawnR * scale,
    maxR: Math.min(zoneRadius - 4.5, spec.maxSpawnR * scale),
    centerX,
    centerZ,
    playerX,
    playerZ,
    minPlayerDist,
    obstacles,
    minObstacleDist,
    rng,
  });
}
