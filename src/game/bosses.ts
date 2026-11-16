import {
  type LootScalingContext,
  ZONE_LOOT_MULTIPLIER,
  compareItemRarity,
  computePlayerLootProgression,
  rollWeightedLootItems,
} from './loot';
import { CITY_CENTER_X, CITY_CENTER_Z } from './zones';
import type {
  BossAttackKind,
  BossAttackPatternId,
  CraftItemId,
  ItemRarity,
  LootDroppedItem,
  ResourceCounts,
  ZoneBossId,
  ZoneId,
} from './types';

export interface BossAttackPatternSpec {
  id: BossAttackPatternId;
  label: string;
  kind: BossAttackKind;
  windupSeconds: number;
  cooldownSeconds: number;
  damage: number;
  warmthDrain: number;
  radius: number;
  enragedRadius: number;
  projectileCount: number;
  enragedProjectileCount: number;
  projectileSpreadRad: number;
  projectileSpeed: number;
  chargeSpeed: number;
  minRange: number;
  maxRange: number;
  phase2Only?: boolean;
  telegraphColorHex: number;
}

export interface BossRewardDropSpec {
  gold: number;
  wood: number;
  stone: number;
  pelts: number;
  meat: number;
  ice: number;
  huntingXp: number;
  items: Array<{ id: CraftItemId; qty: number }>;
}

export interface ZoneBossSpec {
  id: ZoneBossId;
  zone: ZoneId;
  name: string;
  title: string;
  arenaName: string;
  arenaX: number;
  arenaZ: number;
  arenaRadius: number;
  engageRadius: number;
  leashRadius: number;
  maxHp: number;
  moveSpeed: number;
  enrageMoveMult: number;
  enrageCooldownMult: number;
  enrageDamageMult: number;
  respawnSeconds: number;
  primaryColorHex: number;
  accentColorHex: number;
  telegraphColorHex: number;
  patterns: BossAttackPatternSpec[];
  reward: BossRewardDropSpec;
}

export const BOSS_RESPAWN_SECONDS = 120;
export const BOSS_HUD_DETECT_RADIUS = 44;

export const ZONE_BOSS_SPECS: Record<ZoneBossId, ZoneBossSpec> = {
  skarn_colossus: {
    id: 'skarn_colossus',
    zone: 'level1',
    name: 'Skarn, Boreal Root-Warden',
    title: 'Ancient Elderwood Titan',
    arenaName: 'Elderwood Hollow',
    arenaX: -46,
    arenaZ: -28,
    arenaRadius: 21,
    engageRadius: 24,
    leashRadius: 34,
    maxHp: 780,
    moveSpeed: 3.15,
    enrageMoveMult: 1.28,
    enrageCooldownMult: 0.72,
    enrageDamageMult: 1.25,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x3b2f26,
    accentColorHex: 0xf59e0b,
    telegraphColorHex: 0xf59e0b,
    patterns: [
      {
        id: 'root_slam',
        label: 'Seismic Root Slam',
        kind: 'aoe',
        windupSeconds: 0.7,
        cooldownSeconds: 2.3,
        damage: 30,
        warmthDrain: 0,
        radius: 5.0,
        enragedRadius: 6.2,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 6.2,
        telegraphColorHex: 0xf59e0b,
      },
      {
        id: 'bark_barrage',
        label: 'Amber Thorn Volley',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.5,
        damage: 20,
        warmthDrain: 4,
        radius: 3.0,
        enragedRadius: 3.4,
        projectileCount: 3,
        enragedProjectileCount: 5,
        projectileSpreadRad: 0.72,
        projectileSpeed: 15.5,
        chargeSpeed: 0,
        minRange: 3.5,
        maxRange: 25,
        telegraphColorHex: 0xfbbf24,
      },
      {
        id: 'tremor_charge',
        label: 'Timber Tremor Charge',
        kind: 'charge',
        windupSeconds: 0.65,
        cooldownSeconds: 3.1,
        damage: 34,
        warmthDrain: 0,
        radius: 3.2,
        enragedRadius: 3.8,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 15.5,
        minRange: 4.0,
        maxRange: 22,
        telegraphColorHex: 0xf97316,
      },
    ],
    reward: {
      gold: 450,
      wood: 85,
      stone: 30,
      pelts: 28,
      meat: 16,
      ice: 6,
      huntingXp: 65,
      items: [
        { id: 'frost_trap', qty: 1 },
        { id: 'frost_whetstone', qty: 1 },
        { id: 'mammoth_tonic', qty: 1 },
      ],
    },
  },
  veyra_sovereign: {
    id: 'veyra_sovereign',
    zone: 'level2',
    name: 'Veyra, Cryo-Sovereign',
    title: 'Highland Glacial Empress',
    arenaName: 'Frostspire Summit',
    arenaX: 0,
    arenaZ: -292,
    arenaRadius: 22,
    engageRadius: 25,
    leashRadius: 36,
    maxHp: 1320,
    moveSpeed: 3.45,
    enrageMoveMult: 1.32,
    enrageCooldownMult: 0.68,
    enrageDamageMult: 1.28,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x0c4a6e,
    accentColorHex: 0x67e8f9,
    telegraphColorHex: 0x38bdf8,
    patterns: [
      {
        id: 'blizzard_nova',
        label: 'Absolute Blizzard Nova',
        kind: 'aoe',
        windupSeconds: 0.75,
        cooldownSeconds: 2.4,
        damage: 32,
        warmthDrain: 18,
        radius: 6.4,
        enragedRadius: 7.6,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 7.6,
        telegraphColorHex: 0x38bdf8,
      },
      {
        id: 'glacial_volley',
        label: 'Glacial Lance Fan',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.3,
        damage: 24,
        warmthDrain: 8,
        radius: 3.2,
        enragedRadius: 3.8,
        projectileCount: 5,
        enragedProjectileCount: 7,
        projectileSpreadRad: 0.96,
        projectileSpeed: 18.0,
        chargeSpeed: 0,
        minRange: 3.0,
        maxRange: 27,
        telegraphColorHex: 0x7dd3fc,
      },
      {
        id: 'meteor_shards',
        label: 'Celestial Spire Barrage',
        kind: 'meteor',
        windupSeconds: 0.95,
        cooldownSeconds: 3.2,
        damage: 36,
        warmthDrain: 12,
        radius: 3.2,
        enragedRadius: 3.2,
        projectileCount: 2,
        enragedProjectileCount: 3,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 26,
        telegraphColorHex: 0xc084fc,
      },
    ],
    reward: {
      gold: 920,
      wood: 65,
      stone: 60,
      pelts: 42,
      meat: 24,
      ice: 16,
      huntingXp: 120,
      items: [
        { id: 'aurora_charm', qty: 1 },
        { id: 'mammoth_tonic', qty: 1 },
        { id: 'frost_trap', qty: 1 },
      ],
    },
  },
  ignis_warden: {
    id: 'ignis_warden',
    zone: 'city',
    name: 'Ignis, Pit-Forged Warden',
    title: 'Obsidian Cavern Champion',
    arenaName: 'Obsidian Trial Arena',
    arenaX: CITY_CENTER_X + 46,
    arenaZ: CITY_CENTER_Z,
    arenaRadius: 16,
    engageRadius: 18,
    leashRadius: 24,
    maxHp: 1020,
    moveSpeed: 3.55,
    enrageMoveMult: 1.3,
    enrageCooldownMult: 0.7,
    enrageDamageMult: 1.26,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x332b36,
    accentColorHex: 0xff6b2c,
    telegraphColorHex: 0xf97316,
    patterns: [
      {
        id: 'magma_cleave',
        label: 'Anvil Shockwave Cleave',
        kind: 'aoe',
        windupSeconds: 0.65,
        cooldownSeconds: 2.1,
        damage: 34,
        warmthDrain: 0,
        radius: 5.2,
        enragedRadius: 6.4,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 6.4,
        telegraphColorHex: 0xf97316,
      },
      {
        id: 'ember_spiral',
        label: 'Forge Ember Ring',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.4,
        damage: 22,
        warmthDrain: 0,
        radius: 3.2,
        enragedRadius: 3.6,
        projectileCount: 6,
        enragedProjectileCount: 8,
        projectileSpreadRad: Math.PI * 2,
        projectileSpeed: 15.0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 20,
        telegraphColorHex: 0xfb923c,
      },
      {
        id: 'leap_slam',
        label: 'Molten Vault Slam',
        kind: 'leap',
        windupSeconds: 0.85,
        cooldownSeconds: 2.9,
        damage: 38,
        warmthDrain: 0,
        radius: 3.6,
        enragedRadius: 4.3,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 16.5,
        minRange: 3.5,
        maxRange: 19,
        telegraphColorHex: 0xef4444,
      },
    ],
    reward: {
      gold: 760,
      wood: 45,
      stone: 55,
      pelts: 35,
      meat: 20,
      ice: 10,
      huntingXp: 95,
      items: [
        { id: 'mammoth_tonic', qty: 1 },
        { id: 'hammer_temper', qty: 1 },
        { id: 'clockwork_gear', qty: 2 },
      ],
    },
  },
};

export const ZONE_BOSS_ORDER: ZoneBossId[] = [
  'skarn_colossus',
  'veyra_sovereign',
  'ignis_warden',
];

export const ZONE_BOSS_BY_ZONE: Record<ZoneId, ZoneBossId> = {
  level1: 'skarn_colossus',
  level2: 'veyra_sovereign',
  city: 'ignis_warden',
};

export function getZoneBossSpec(zone: ZoneId): ZoneBossSpec {
  return ZONE_BOSS_SPECS[ZONE_BOSS_BY_ZONE[zone]];
}

export function isBossEnraged(hp: number, maxHp: number): boolean {
  if (maxHp <= 0) return false;
  return hp > 0 && hp <= maxHp * 0.5;
}

export function selectNextBossAttack(
  spec: ZoneBossSpec,
  distToPlayer: number,
  enraged: boolean,
  patternIndex: number,
): BossAttackPatternSpec {
  const eligible = spec.patterns.filter((p) => {
    if (p.phase2Only && !enraged) return false;
    const rangeCap = enraged ? p.maxRange + 1.5 : p.maxRange;
    return distToPlayer >= p.minRange && distToPlayer <= rangeCap;
  });
  const pool = eligible.length > 0 ? eligible : spec.patterns;
  const idx = ((patternIndex % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

export function computeArenaContainment(
  x: number,
  z: number,
  spec: ZoneBossSpec,
): { x: number; z: number; leashed: boolean } {
  const dx = x - spec.arenaX;
  const dz = z - spec.arenaZ;
  const dist = Math.hypot(dx, dz);
  if (dist <= spec.leashRadius || dist < 0.0001) {
    return { x, z, leashed: false };
  }
  const scale = spec.leashRadius / dist;
  return {
    x: spec.arenaX + dx * scale,
    z: spec.arenaZ + dz * scale,
    leashed: true,
  };
}

export function rollMeteorTargets(
  playerX: number,
  playerZ: number,
  count: number,
  spec: ZoneBossSpec,
  rng: () => number = Math.random,
): Array<{ x: number; z: number }> {
  const targets: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < count; i++) {
    let rawX = playerX;
    let rawZ = playerZ;
    if (i > 0) {
      const a = rng() * Math.PI * 2;
      const offset = 3.2 + rng() * 3.4;
      rawX += Math.cos(a) * offset;
      rawZ += Math.sin(a) * offset;
    }
    const clamped = computeArenaContainment(rawX, rawZ, spec);
    targets.push({ x: clamped.x, z: clamped.z });
  }
  return targets;
}

export function computeBossLootReward(
  spec: ZoneBossSpec,
  context?: LootScalingContext,
  rng: () => number = Math.random,
): {
  resourcesDelta: ResourceCounts;
  huntingXp: number;
  items: LootDroppedItem[];
  lootTierLabel: string;
  effectiveGearLevel: number;
  resourceMultiplier: number;
  highestRarity: ItemRarity;
} {
  const effectiveContext: LootScalingContext = {
    ...context,
    zone: context?.zone ?? spec.zone,
  };
  const prog = computePlayerLootProgression(effectiveContext);
  const zoneRatio =
    ZONE_LOOT_MULTIPLIER[prog.zone] / Math.max(0.1, ZONE_LOOT_MULTIPLIER[spec.zone]);
  const gearScale = 1 + prog.gearProgress * 0.65;
  const variance = 1 + Math.max(0, Math.min(1, rng())) * 0.08;
  const rewardScale = zoneRatio * gearScale * variance;

  const slotCount =
    3 +
    (prog.effectiveGearLevel >= 3.0 ? 1 : 0) +
    (prog.effectiveGearLevel >= 4.5 ? 1 : 0);

  const minRarity: ItemRarity =
    prog.progressionIndex >= 0.65
      ? 'epic'
      : prog.zoneTier >= 2 || prog.effectiveGearLevel >= 2.5
        ? 'rare'
        : 'uncommon';

  const preferredItems = spec.reward.items.map((item) => item.id);
  const rolledItems = rollWeightedLootItems(slotCount, effectiveContext, {
    sourceBonus: 0.28 + (prog.zoneTier - 1) * 0.1,
    minRarity,
    preferredItems,
    rng,
  });

  let highestRarity: ItemRarity = 'common';
  for (const item of rolledItems) {
    if (compareItemRarity(item.rarity, highestRarity) > 0) {
      highestRarity = item.rarity;
    }
  }

  return {
    resourcesDelta: {
      wood: Math.round(spec.reward.wood * rewardScale),
      stone: Math.round(spec.reward.stone * rewardScale),
      pelts: Math.round(spec.reward.pelts * rewardScale),
      meat: Math.round(spec.reward.meat * rewardScale),
      ice: Math.round(spec.reward.ice * rewardScale),
      gold: Math.round(spec.reward.gold * rewardScale),
    },
    huntingXp: Math.round(spec.reward.huntingXp * (1 + prog.gearProgress * 0.45) * zoneRatio),
    items: rolledItems,
    lootTierLabel: prog.tierLabel,
    effectiveGearLevel: prog.effectiveGearLevel,
    resourceMultiplier: prog.resourceMultiplier,
    highestRarity,
  };
}

