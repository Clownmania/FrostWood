import type { ItemRarity, WeatherKind, ZoneId } from './types';
import { ZONE_SPECS } from './zones';

export const FISHING_LAKE_CENTER = { x: -32, z: 14 } as const;
export const FISHING_LAKE_RADIUS = 17.5;
export const FISHING_LAKE_INTERACT_RADIUS = 24.5;
export const FISHING_LAKE_SAFE_RADIUS = 26.0;

export const FISHING_PIER_BOUNDS = {
  minX: -23.8,
  maxX: -14.5,
  minZ: 12.45,
  maxZ: 15.55,
  deckOffset: 0.34,
} as const;

export const WILDERNESS_POND_OFFSET = {
  dx: -38,
  dz: 26,
  radius: 9.0,
} as const;

export const FISHING_PIER_ANCHOR = {
  x: -19.2,
  z: 14.0,
  yaw: -Math.PI / 2,
} as const;

export type IceThicknessStage =
  | 'thin_water'
  | 'cracked_thin'
  | 'frosted_firm'
  | 'thick_glacial';

export interface IceThicknessSnapshot {
  thickness: number; // 0..1 normalized
  thicknessCm: number;
  stage: IceThicknessStage;
  stageLabel: string;
  walkable: boolean;
  crackRisk: number; // 0..1 visual stress fracture prominence
  frostCoverage: number; // 0..1 hoarfrost / rime crust coverage
  waveDamping: number; // 0..1 (0 = full open waves, 1 = rigid frozen sheet)
}

export const ICE_WALKABLE_THRESHOLD = 0.65;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep01(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Computes the equilibrium normalized ice thickness (0..1) from current weather,
 * diurnal temperature cycle, and zone chill severity.
 */
export function computeTargetIceThickness(params: {
  weather: WeatherKind;
  timeOfDay: number;
  zone: ZoneId;
}): number {
  const { weather, timeOfDay, zone } = params;
  const baseByWeather =
    weather === 'blizzard'
      ? 0.91
      : weather === 'light_snow'
        ? 0.54
        : 0.18;

  // Darkness cooling: 0 at solar noon (0.5), +0.08 at Arctic midnight (0.0)
  const darkness = (1 - Math.cos((timeOfDay - 0.5) * Math.PI * 2)) * 0.5;
  const nightBonus = Math.max(0, darkness) * 0.08;

  const zoneBonus =
    zone === 'level5'
      ? 0.14
      : zone === 'level3'
        ? 0.1
        : zone === 'level4'
          ? 0.08
          : zone === 'level2'
            ? 0.06
            : 0;

  return Math.round(clamp01(Math.max(0.08, baseByWeather + nightBonus + zoneBonus)) * 1000) / 1000;
}

export function stepIceThickness(
  current: number,
  target: number,
  dt: number,
): number {
  const safeDt = Math.max(0, Math.min(dt, 0.25));
  const diff = target - current;
  if (Math.abs(diff) <= 0.001) return clamp01(target);
  const alpha = 1 - Math.exp(-0.22 * safeDt);
  return clamp01(current + diff * alpha);
}

export function classifyIceThickness(thickness: number): IceThicknessSnapshot {
  const t = clamp01(thickness);
  const thicknessCm = Math.round(2 + t * 46);
  let stage: IceThicknessStage = 'thin_water';
  let stageLabel = 'Open Water · Thin Rim Ice';
  if (t >= 0.82) {
    stage = 'thick_glacial';
    stageLabel = 'Thick Glacial Pack Ice';
  } else if (t >= ICE_WALKABLE_THRESHOLD) {
    stage = 'frosted_firm';
    stageLabel = 'Frosted Firm Ice';
  } else if (t >= 0.28) {
    stage = 'cracked_thin';
    stageLabel = 'Fractured Thin Ice';
  }

  const crackRisk =
    clamp01((t - 0.08) / 0.32) * (1 - 0.28 * smoothstep01(0.78, 1.0, t));
  const frostCoverage = smoothstep01(0.22, 0.92, t);
  const waveDamping = smoothstep01(0.14, 0.62, t);

  return {
    thickness: Math.round(t * 1000) / 1000,
    thicknessCm,
    stage,
    stageLabel,
    walkable: t >= ICE_WALKABLE_THRESHOLD,
    crackRisk: Math.round(crackRisk * 1000) / 1000,
    frostCoverage: Math.round(frostCoverage * 1000) / 1000,
    waveDamping: Math.round(waveDamping * 1000) / 1000,
  };
}

export type FishSpeciesId =
  | 'frost_minnow'
  | 'glacial_perch'
  | 'silver_char'
  | 'boreal_trout'
  | 'crystal_pike'
  | 'aurora_salmon'
  | 'abyssal_sturgeon'
  | 'celestial_koi';

export interface FishSpec {
  id: FishSpeciesId;
  name: string;
  rarity: ItemRarity;
  minWeightKg: number;
  maxWeightKg: number;
  goldValue: number;
  meatYield: number;
  iceYield: number;
  xpReward: number;
  colorHex: number;
  accentHex: number;
  scale: number;
  difficulty: number;
  sweetSpotWidth: number;
  reelFillRate: number;
  description: string;
}

export const FISH_SPECIES_ORDER: FishSpeciesId[] = [
  'frost_minnow',
  'glacial_perch',
  'silver_char',
  'boreal_trout',
  'crystal_pike',
  'aurora_salmon',
  'abyssal_sturgeon',
  'celestial_koi',
];

export const FISH_SPECS: Record<FishSpeciesId, FishSpec> = {
  frost_minnow: {
    id: 'frost_minnow',
    name: 'Frost Minnow',
    rarity: 'common',
    minWeightKg: 0.4,
    maxWeightKg: 1.6,
    goldValue: 18,
    meatYield: 1,
    iceYield: 1,
    xpReward: 12,
    colorHex: 0x94a3b8,
    accentHex: 0xe2e8f0,
    scale: 0.78,
    difficulty: 0.25,
    sweetSpotWidth: 34,
    reelFillRate: 42,
    description: 'Swift schooling minnow that darts beneath the lagoon ice rim.',
  },
  glacial_perch: {
    id: 'glacial_perch',
    name: 'Glacial Perch',
    rarity: 'common',
    minWeightKg: 1.2,
    maxWeightKg: 3.4,
    goldValue: 26,
    meatYield: 2,
    iceYield: 1,
    xpReward: 16,
    colorHex: 0x64748b,
    accentHex: 0x93c5fd,
    scale: 0.92,
    difficulty: 0.32,
    sweetSpotWidth: 32,
    reelFillRate: 38,
    description: 'Striped cold-water perch prized for its tender fillets.',
  },
  silver_char: {
    id: 'silver_char',
    name: 'Silver Arctic Char',
    rarity: 'uncommon',
    minWeightKg: 2.5,
    maxWeightKg: 6.2,
    goldValue: 45,
    meatYield: 3,
    iceYield: 2,
    xpReward: 26,
    colorHex: 0x4ade80,
    accentHex: 0xa7f3d0,
    scale: 1.08,
    difficulty: 0.44,
    sweetSpotWidth: 28,
    reelFillRate: 34,
    description: 'Deep-basin char with emerald-tinted scales and rich winter fat.',
  },
  boreal_trout: {
    id: 'boreal_trout',
    name: 'Boreal Rainbow Trout',
    rarity: 'uncommon',
    minWeightKg: 3.0,
    maxWeightKg: 7.8,
    goldValue: 58,
    meatYield: 3,
    iceYield: 3,
    xpReward: 32,
    colorHex: 0x34d399,
    accentHex: 0xfda4af,
    scale: 1.15,
    difficulty: 0.5,
    sweetSpotWidth: 27,
    reelFillRate: 32,
    description: 'Energetic alpine trout that leaps when hooked in the current.',
  },
  crystal_pike: {
    id: 'crystal_pike',
    name: 'Crystal Glaive Pike',
    rarity: 'rare',
    minWeightKg: 5.5,
    maxWeightKg: 13.5,
    goldValue: 96,
    meatYield: 5,
    iceYield: 5,
    xpReward: 50,
    colorHex: 0x38bdf8,
    accentHex: 0xbae6fd,
    scale: 1.32,
    difficulty: 0.62,
    sweetSpotWidth: 24,
    reelFillRate: 28,
    description: 'Translucent apex predator whose fins crystallize glacial mana.',
  },
  aurora_salmon: {
    id: 'aurora_salmon',
    name: 'Aurora King Salmon',
    rarity: 'rare',
    minWeightKg: 7.0,
    maxWeightKg: 16.8,
    goldValue: 125,
    meatYield: 6,
    iceYield: 6,
    xpReward: 64,
    colorHex: 0x0ea5e9,
    accentHex: 0x67e8f9,
    scale: 1.4,
    difficulty: 0.68,
    sweetSpotWidth: 23,
    reelFillRate: 27,
    description: 'Shimmering cyan-and-gold salmon that swims beneath aurora reflections.',
  },
  abyssal_sturgeon: {
    id: 'abyssal_sturgeon',
    name: 'Abyssal Rime Sturgeon',
    rarity: 'epic',
    minWeightKg: 14.0,
    maxWeightKg: 34.0,
    goldValue: 220,
    meatYield: 9,
    iceYield: 10,
    xpReward: 110,
    colorHex: 0xf59e0b,
    accentHex: 0xfde047,
    scale: 1.65,
    difficulty: 0.78,
    sweetSpotWidth: 20,
    reelFillRate: 24,
    description: 'Ancient armored lake leviathan encrusted with golden permafrost plates.',
  },
  celestial_koi: {
    id: 'celestial_koi',
    name: 'Celestial Starfall Koi',
    rarity: 'mythic',
    minWeightKg: 18.0,
    maxWeightKg: 45.0,
    goldValue: 420,
    meatYield: 14,
    iceYield: 18,
    xpReward: 220,
    colorHex: 0xd946ef,
    accentHex: 0xf5d0fe,
    scale: 1.82,
    difficulty: 0.88,
    sweetSpotWidth: 18,
    reelFillRate: 22,
    description: 'Mythic astral sovereign of Crystal Lagoon that radiates nebula light.',
  },
};

export type FishingPhase =
  | 'idle'
  | 'casting'
  | 'waiting'
  | 'bite'
  | 'hooking'
  | 'caught'
  | 'escaped';

export interface CaughtFishSummary {
  speciesId: FishSpeciesId;
  name: string;
  rarity: ItemRarity;
  weightKg: number;
  gold: number;
  meat: number;
  ice: number;
}

export interface FishingSessionState {
  phase: FishingPhase;
  timer: number;
  biteWindow: number;
  bobberX: number;
  bobberZ: number;
  targetFishId: FishSpeciesId | null;
  targetFishWeightKg: number;
  hookBarPos: number; // 0..100
  hookBarVel: number;
  fishBarPos: number; // 0..100
  fishBarTarget: number; // 0..100
  fishBarTimer: number;
  catchProgress: number; // 0..100
  lineTension: number; // 0..100
  isInSweetSpot: boolean;
  totalCaught: number;
  lastCatch: CaughtFishSummary | null;
}

export interface FishingHudState {
  nearLake: boolean;
  inSafeZone: boolean;
  isSwimming: boolean;
  distanceToLake: number;
  directionToLake: string;
  iceThickness: number;
  iceThicknessCm: number;
  iceThicknessStage: IceThicknessStage;
  iceThicknessLabel: string;
  iceWalkable: boolean;
  phase: FishingPhase;
  timer: number;
  biteWindow: number;
  targetFishName: string | null;
  targetFishRarity: ItemRarity | null;
  targetFishWeightKg: number;
  hookBarPos: number;
  sweetSpotWidth: number;
  fishBarPos: number;
  catchProgress: number;
  lineTension: number;
  isInSweetSpot: boolean;
  totalCaught: number;
  lastCatch: CaughtFishSummary | null;
  nearbyFishRarities: ItemRarity[];
}

export function createInitialFishingState(): FishingSessionState {
  return {
    phase: 'idle',
    timer: 0,
    biteWindow: 0,
    bobberX: FISHING_LAKE_CENTER.x,
    bobberZ: FISHING_LAKE_CENTER.z,
    targetFishId: null,
    targetFishWeightKg: 0,
    hookBarPos: 50,
    hookBarVel: 0,
    fishBarPos: 50,
    fishBarTarget: 55,
    fishBarTimer: 0.6,
    catchProgress: 30,
    lineTension: 20,
    isInSweetSpot: true,
    totalCaught: 0,
    lastCatch: null,
  };
}

export function getDistanceToFishingLake(
  x: number,
  z: number,
  zone: ZoneId,
): number {
  if (zone !== 'level1') return 999;
  const distCenter = Math.hypot(x - FISHING_LAKE_CENTER.x, z - FISHING_LAKE_CENTER.z);
  return Math.max(0, Math.round(distCenter - FISHING_LAKE_RADIUS));
}

export function isNearFishingLake(
  x: number,
  z: number,
  zone: ZoneId,
): boolean {
  if (zone !== 'level1') return false;
  const distCenter = Math.hypot(x - FISHING_LAKE_CENTER.x, z - FISHING_LAKE_CENTER.z);
  return distCenter <= FISHING_LAKE_INTERACT_RADIUS;
}

/**
 * Returns true when the given position is inside the Crystal Lagoon Safe Sanctuary
 * where predators and rival hunters cannot enter, attack, or steal, and warmth is protected.
 */
export function isInsideFishingSanctuary(
  x: number,
  z: number,
  zone: ZoneId,
): boolean {
  if (zone !== 'level1') return false;
  const distCenter = Math.hypot(x - FISHING_LAKE_CENTER.x, z - FISHING_LAKE_CENTER.z);
  return distCenter <= FISHING_LAKE_SAFE_RADIUS;
}

/**
 * Returns true when the player is standing on the elevated wooden fishing pier in Level 1.
 */
export function isPlayerOnFishingPier(
  x: number,
  z: number,
  zone: ZoneId,
): boolean {
  if (zone !== 'level1') return false;
  return (
    x >= FISHING_PIER_BOUNDS.minX &&
    x <= FISHING_PIER_BOUNDS.maxX &&
    z >= FISHING_PIER_BOUNDS.minZ &&
    z <= FISHING_PIER_BOUNDS.maxZ
  );
}

/**
 * Returns the lake/pond center and radius for any wilderness zone, or null in the city.
 */
export function getLakeCenterForZone(
  zone: ZoneId,
): { x: number; z: number; radius: number } | null {
  if (zone === 'city') return null;
  if (zone === 'level1') {
    return {
      x: FISHING_LAKE_CENTER.x,
      z: FISHING_LAKE_CENTER.z,
      radius: FISHING_LAKE_RADIUS,
    };
  }
  const spec = ZONE_SPECS[zone];
  return {
    x: spec.centerX + WILDERNESS_POND_OFFSET.dx,
    z: spec.centerZ + WILDERNESS_POND_OFFSET.dz,
    radius: WILDERNESS_POND_OFFSET.radius,
  };
}

/**
 * Returns true when the player has fallen or stepped into open or fragile lake water
 * (off the pier/shore when ice is not thick enough to support walking) and should be swimming.
 */
export function isPositionInLakeWater(
  x: number,
  z: number,
  zone: ZoneId,
  playerY = 0,
  iceThickness = 0,
): boolean {
  if (iceThickness >= ICE_WALKABLE_THRESHOLD) return false;
  const lake = getLakeCenterForZone(zone);
  if (!lake) return false;
  if (playerY > 0.25) return false;
  if (isPlayerOnFishingPier(x, z, zone)) return false;
  const dist = Math.hypot(x - lake.x, z - lake.z);
  return dist <= lake.radius - 0.35;
}

/**
 * Returns movement speed multiplier when traversing frozen walkable lake ice.
 */
export function getIceSurfaceSpeedMultiplier(
  x: number,
  z: number,
  zone: ZoneId,
  playerY = 0,
  iceThickness = 0,
): number {
  if (iceThickness < ICE_WALKABLE_THRESHOLD) return 1.0;
  const lake = getLakeCenterForZone(zone);
  if (!lake || playerY > 0.25) return 1.0;
  if (isPlayerOnFishingPier(x, z, zone)) return 1.0;
  const dist = Math.hypot(x - lake.x, z - lake.z);
  if (dist > lake.radius - 0.35) return 1.0;
  return iceThickness >= 0.82 ? 1.08 : 0.88;
}

const RARITY_WEIGHT_TABLE: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: 'common', weight: 40 },
  { rarity: 'uncommon', weight: 28 },
  { rarity: 'rare', weight: 18 },
  { rarity: 'epic', weight: 9 },
  { rarity: 'mythic', weight: 5 },
];

export function rollRandomFishRarity(
  rng: () => number = Math.random,
  rarityBoost = 0,
): ItemRarity {
  const boost = Math.max(0, Math.min(0.5, rarityBoost));
  const weights = RARITY_WEIGHT_TABLE.map((entry) => {
    if (entry.rarity === 'common') return Math.max(10, entry.weight * (1 - boost));
    if (entry.rarity === 'rare' || entry.rarity === 'epic' || entry.rarity === 'mythic') {
      return entry.weight * (1 + boost * 1.6);
    }
    return entry.weight;
  });
  const total = weights.reduce((acc, w) => acc + w, 0);
  let pick = rng() * total;
  for (let i = 0; i < RARITY_WEIGHT_TABLE.length; i++) {
    pick -= weights[i];
    if (pick <= 0) {
      return RARITY_WEIGHT_TABLE[i].rarity;
    }
  }
  return 'common';
}

export function rollRandomFishSpecies(
  rng: () => number = Math.random,
  rarityBoost = 0,
): { spec: FishSpec; weightKg: number } {
  const rarity = rollRandomFishRarity(rng, rarityBoost);
  const candidates = FISH_SPECIES_ORDER.map((id) => FISH_SPECS[id]).filter(
    (s) => s.rarity === rarity,
  );
  const pool = candidates.length > 0 ? candidates : [FISH_SPECS.frost_minnow];
  const spec = pool[Math.floor(rng() * pool.length) % pool.length];
  const weightRaw =
    spec.minWeightKg + rng() * (spec.maxWeightKg - spec.minWeightKg);
  const weightKg = Math.round(weightRaw * 10) / 10;
  return { spec, weightKg };
}

/**
 * Generates the active species roster for Crystal Lagoon, guaranteeing every
 * species in `FISH_SPECIES_ORDER` is represented in the water and filling any
 * additional slots using the live `rollRandomFishSpecies` rarity distribution.
 */
export function createLakeFishSpawnPopulation(
  count = 12,
  rng: () => number = Math.random,
  rarityBoost = 0,
): FishSpeciesId[] {
  const safeCount = Math.max(1, Math.floor(count));
  const roster: FishSpeciesId[] = [];
  for (let i = 0; i < Math.min(safeCount, FISH_SPECIES_ORDER.length); i++) {
    roster.push(FISH_SPECIES_ORDER[i]);
  }
  while (roster.length < safeCount) {
    roster.push(rollRandomFishSpecies(rng, rarityBoost).spec.id);
  }
  return roster;
}

export function startFishingCast(
  state: FishingSessionState,
  playerX: number,
  playerZ: number,
  playerYaw: number,
  rng: () => number = Math.random,
  preferredSpeciesId?: FishSpeciesId,
): FishingSessionState {
  const rolled = preferredSpeciesId
    ? {
        spec: FISH_SPECS[preferredSpeciesId],
        weightKg:
          Math.round(
            (FISH_SPECS[preferredSpeciesId].minWeightKg +
              rng() *
                (FISH_SPECS[preferredSpeciesId].maxWeightKg -
                  FISH_SPECS[preferredSpeciesId].minWeightKg)) *
              10,
          ) / 10,
      }
    : rollRandomFishSpecies(rng);

  // Compute bobber landing spot inside the lake
  const castDist = 7.5 + rng() * 3.5;
  let bx = playerX + Math.sin(playerYaw) * castDist;
  let bz = playerZ + Math.cos(playerYaw) * castDist;
  const dx = bx - FISHING_LAKE_CENTER.x;
  const dz = bz - FISHING_LAKE_CENTER.z;
  const distFromCenter = Math.hypot(dx, dz);
  const maxBobberR = FISHING_LAKE_RADIUS - 2.4;
  if (distFromCenter > maxBobberR) {
    const angle = Math.atan2(
      FISHING_LAKE_CENTER.z - playerZ,
      FISHING_LAKE_CENTER.x - playerX,
    );
    const r = 3.5 + rng() * (maxBobberR - 4.5);
    bx = FISHING_LAKE_CENTER.x + Math.cos(angle + (rng() - 0.5) * 0.5) * r;
    bz = FISHING_LAKE_CENTER.z + Math.sin(angle + (rng() - 0.5) * 0.5) * r;
  }

  return {
    ...state,
    phase: 'casting',
    timer: 0.45,
    biteWindow: 0,
    bobberX: Number(bx.toFixed(2)),
    bobberZ: Number(bz.toFixed(2)),
    targetFishId: rolled.spec.id,
    targetFishWeightKg: rolled.weightKg,
    hookBarPos: 50,
    hookBarVel: 0,
    fishBarPos: 50,
    fishBarTarget: 55,
    fishBarTimer: 0.5,
    catchProgress: 34,
    lineTension: 22,
    isInSweetSpot: true,
  };
}

export function triggerFishingHook(
  state: FishingSessionState,
  rng: () => number = Math.random,
): { state: FishingSessionState; hooked: boolean; reason?: string } {
  if (state.phase === 'bite') {
    const spec = state.targetFishId
      ? FISH_SPECS[state.targetFishId]
      : FISH_SPECS.frost_minnow;
    const startFishPos = 35 + rng() * 30;
    return {
      hooked: true,
      state: {
        ...state,
        phase: 'hooking',
        timer: 0,
        biteWindow: 0,
        hookBarPos: startFishPos,
        hookBarVel: 0,
        fishBarPos: startFishPos,
        fishBarTarget: Math.max(15, Math.min(85, startFishPos + (rng() - 0.5) * 40)),
        fishBarTimer: 0.65,
        catchProgress: 36,
        lineTension: Math.round(25 + spec.difficulty * 20),
        isInSweetSpot: true,
      },
    };
  }

  if (state.phase === 'waiting' || state.phase === 'casting') {
    return {
      hooked: false,
      reason: 'Pulled line too early before a fish bit!',
      state: {
        ...state,
        phase: 'idle',
        timer: 0,
        biteWindow: 0,
      },
    };
  }

  return { hooked: false, state };
}

export function stepFishingState(
  state: FishingSessionState,
  dt: number,
  isReeling: boolean,
  rng: () => number = Math.random,
): {
  state: FishingSessionState;
  event: 'none' | 'bobber_landed' | 'bite_started' | 'fish_caught' | 'fish_escaped';
} {
  const safeDt = Math.max(0, Math.min(dt, 0.25));
  if (state.phase === 'idle') {
    return { state, event: 'none' };
  }

  if (state.phase === 'casting') {
    const nextTimer = state.timer - safeDt;
    if (nextTimer <= 0) {
      const waitDuration = 1.35 + rng() * 1.45;
      return {
        event: 'bobber_landed',
        state: {
          ...state,
          phase: 'waiting',
          timer: waitDuration,
        },
      };
    }
    return {
      event: 'none',
      state: {
        ...state,
        timer: nextTimer,
      },
    };
  }

  if (state.phase === 'waiting') {
    const nextTimer = state.timer - safeDt;
    if (nextTimer <= 0) {
      const spec = state.targetFishId
        ? FISH_SPECS[state.targetFishId]
        : FISH_SPECS.frost_minnow;
      const biteWindow = Math.max(2.6, 3.6 - spec.difficulty * 0.8);
      return {
        event: 'bite_started',
        state: {
          ...state,
          phase: 'bite',
          timer: biteWindow,
          biteWindow,
        },
      };
    }
    return {
      event: 'none',
      state: {
        ...state,
        timer: nextTimer,
      },
    };
  }

  if (state.phase === 'bite') {
    const nextTimer = state.timer - safeDt;
    if (nextTimer <= 0) {
      return {
        event: 'fish_escaped',
        state: {
          ...state,
          phase: 'escaped',
          timer: 1.4,
          biteWindow: 0,
        },
      };
    }
    return {
      event: 'none',
      state: {
        ...state,
        timer: nextTimer,
      },
    };
  }

  if (state.phase === 'hooking') {
    const spec = state.targetFishId
      ? FISH_SPECS[state.targetFishId]
      : FISH_SPECS.frost_minnow;

    // 1. Update player hook sweet-spot bar position (0..100)
    // Holding Reel pulls hook bar right/up; releasing lets it drift left/down
    const accel = isReeling ? 155 : -135;
    let nextVel = (state.hookBarVel + accel * safeDt) * Math.exp(-3.2 * safeDt);
    let nextHookPos = state.hookBarPos + nextVel * safeDt;
    const halfWidth = spec.sweetSpotWidth * 0.5;
    if (nextHookPos < halfWidth) {
      nextHookPos = halfWidth;
      nextVel = Math.max(0, nextVel * -0.25);
    } else if (nextHookPos > 100 - halfWidth) {
      nextHookPos = 100 - halfWidth;
      nextVel = Math.min(0, nextVel * -0.25);
    }

    // 2. Update fish marker movement along the bar
    let nextFishTimer = state.fishBarTimer - safeDt;
    let nextFishTarget = state.fishBarTarget;
    if (nextFishTimer <= 0) {
      const stride = 18 + spec.difficulty * 32;
      nextFishTarget = Math.max(
        10,
        Math.min(90, state.fishBarPos + (rng() - 0.5) * 2 * stride),
      );
      nextFishTimer = Math.max(0.35, 1.15 - spec.difficulty * 0.65);
    }
    const fishSpeed = 22 + spec.difficulty * 38;
    const deltaFish = nextFishTarget - state.fishBarPos;
    const maxFishStep = fishSpeed * safeDt;
    const nextFishPos =
      Math.abs(deltaFish) <= maxFishStep
        ? nextFishTarget
        : state.fishBarPos + Math.sign(deltaFish) * maxFishStep;

    // 3. Check if fish is inside the player's hook sweet-spot window
    const dist = Math.abs(nextFishPos - nextHookPos);
    const inSweetSpot = dist <= halfWidth + 2.5;

    const progressDelta = inSweetSpot
      ? spec.reelFillRate * safeDt
      : -(12 + spec.difficulty * 10) * safeDt;
    const nextProgress = Math.max(0, Math.min(100, state.catchProgress + progressDelta));

    const targetTension = inSweetSpot
      ? 35 + spec.difficulty * 25
      : 78 + spec.difficulty * 18;
    const nextTension =
      state.lineTension + (targetTension - state.lineTension) * Math.min(1, safeDt * 6);

    if (nextProgress >= 100) {
      const weightRatio =
        spec.maxWeightKg > spec.minWeightKg
          ? (state.targetFishWeightKg - spec.minWeightKg) /
            (spec.maxWeightKg - spec.minWeightKg)
          : 0.5;
      const goldBonus = Math.round(spec.goldValue * (1 + weightRatio * 0.35));
      const summary: CaughtFishSummary = {
        speciesId: spec.id,
        name: spec.name,
        rarity: spec.rarity,
        weightKg: state.targetFishWeightKg,
        gold: goldBonus,
        meat: spec.meatYield,
        ice: spec.iceYield,
      };
      return {
        event: 'fish_caught',
        state: {
          ...state,
          phase: 'caught',
          timer: 2.2,
          hookBarPos: nextHookPos,
          hookBarVel: 0,
          fishBarPos: nextFishPos,
          catchProgress: 100,
          lineTension: 20,
          isInSweetSpot: true,
          totalCaught: state.totalCaught + 1,
          lastCatch: summary,
        },
      };
    }

    if (nextProgress <= 0) {
      return {
        event: 'fish_escaped',
        state: {
          ...state,
          phase: 'escaped',
          timer: 1.5,
          hookBarPos: nextHookPos,
          hookBarVel: 0,
          fishBarPos: nextFishPos,
          catchProgress: 0,
          lineTension: 100,
          isInSweetSpot: false,
        },
      };
    }

    return {
      event: 'none',
      state: {
        ...state,
        hookBarPos: nextHookPos,
        hookBarVel: nextVel,
        fishBarPos: nextFishPos,
        fishBarTarget: nextFishTarget,
        fishBarTimer: nextFishTimer,
        catchProgress: nextProgress,
        lineTension: nextTension,
        isInSweetSpot: inSweetSpot,
      },
    };
  }

  if (state.phase === 'caught' || state.phase === 'escaped') {
    const nextTimer = state.timer - safeDt;
    if (nextTimer <= 0) {
      return {
        event: 'none',
        state: {
          ...state,
          phase: 'idle',
          timer: 0,
        },
      };
    }
    return {
      event: 'none',
      state: {
        ...state,
        timer: nextTimer,
      },
    };
  }

  return { state, event: 'none' };
}

function cardinalDirection(dx: number, dz: number): string {
  const angle = Math.atan2(dx, -dz);
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return dirs[idx];
}

export function buildFishingHudState(
  state: FishingSessionState,
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  nearbyFishRarities: ItemRarity[],
  playerY = 0,
  iceThickness = 0,
): FishingHudState {
  const nearLake = isNearFishingLake(playerX, playerZ, zone);
  const inSafeZone = isInsideFishingSanctuary(playerX, playerZ, zone);
  const isSwimming = isPositionInLakeWater(playerX, playerZ, zone, playerY, iceThickness);
  const distanceToLake = getDistanceToFishingLake(playerX, playerZ, zone);
  const iceSnap = classifyIceThickness(iceThickness);
  const directionToLake =
    zone === 'level1'
      ? cardinalDirection(
          FISHING_LAKE_CENTER.x - playerX,
          FISHING_LAKE_CENTER.z - playerZ,
        )
      : 'W';
  const spec = state.targetFishId ? FISH_SPECS[state.targetFishId] : null;

  return {
    nearLake,
    inSafeZone,
    isSwimming,
    distanceToLake,
    directionToLake,
    iceThickness: iceSnap.thickness,
    iceThicknessCm: iceSnap.thicknessCm,
    iceThicknessStage: iceSnap.stage,
    iceThicknessLabel: iceSnap.stageLabel,
    iceWalkable: iceSnap.walkable,
    phase: state.phase,
    timer: Number(Math.max(0, state.timer).toFixed(1)),
    biteWindow: Number(Math.max(0, state.biteWindow).toFixed(1)),
    targetFishName: spec ? spec.name : null,
    targetFishRarity: spec ? spec.rarity : null,
    targetFishWeightKg: state.targetFishWeightKg,
    hookBarPos: Math.round(state.hookBarPos),
    sweetSpotWidth: spec ? spec.sweetSpotWidth : 30,
    fishBarPos: Math.round(state.fishBarPos),
    catchProgress: Math.round(state.catchProgress),
    lineTension: Math.round(state.lineTension),
    isInSweetSpot: state.isInSweetSpot,
    totalCaught: state.totalCaught,
    lastCatch: state.lastCatch ? { ...state.lastCatch } : null,
    nearbyFishRarities: [...nearbyFishRarities],
  };
}
