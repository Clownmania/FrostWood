import {
  type LootScalingContext,
  computeEffectiveLootGearLevel,
  computePlayerLootProgression,
  computeSecretChestRarityWeights,
  rollWeightedLootItem,
  rollWeightedLootItems,
} from './loot';
import type {
  ChestLootRoll,
  CraftItemId,
  ItemRarity,
  MinimapChestBlip,
  ResourceCounts,
  SecretChestHudInfo,
  SecretChestRarity,
  ZoneId,
} from './types';
import {
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  ZONE_SPECS,
} from './zones';

export const SECRET_CHEST_INTERACT_RADIUS = 3.6;
export const MAX_ACTIVE_SECRET_CHESTS = 3;
export const SECRET_CHEST_SPAWN_INTERVAL = 12.0;
/** Small random chance (9%) per spawn tick for a Secret Loot Box to appear. */
export const SECRET_CHEST_SPAWN_CHANCE = 0.09;
export const SECRET_CHEST_MIN_HEARTH_DIST = 34;
export const SECRET_CHEST_MIN_PLAYER_DIST = 22;

export interface SecretChestSpec {
  rarity: SecretChestRarity;
  itemRarity: ItemRarity;
  label: string;
  weight: number;
  accentHex: number;
  woodRange: [number, number];
  stoneRange: [number, number];
  iceRange: [number, number];
  meatRange: [number, number];
  peltsRange: [number, number];
  goldRange: [number, number];
  bonusItems: CraftItemId[];
}

export const SECRET_CHEST_SPECS: Record<SecretChestRarity, SecretChestSpec> = {
  supply: {
    rarity: 'supply',
    itemRarity: 'uncommon',
    label: 'Frostbound Supply Cache',
    weight: 0.65,
    accentHex: 0x8ed49a,
    woodRange: [18, 28],
    stoneRange: [6, 12],
    iceRange: [0, 1],
    meatRange: [2, 4],
    peltsRange: [2, 4],
    goldRange: [28, 46],
    bonusItems: ['clockwork_gear', 'fire_starter', 'alpine_poultice'],
  },
  relic: {
    rarity: 'relic',
    itemRarity: 'rare',
    label: 'Gilded Relic Coffer',
    weight: 0.27,
    accentHex: 0x7be0ff,
    woodRange: [22, 34],
    stoneRange: [10, 18],
    iceRange: [2, 4],
    meatRange: [4, 7],
    peltsRange: [4, 7],
    goldRange: [55, 92],
    bonusItems: ['snare_trap', 'hammer_temper', 'frost_whetstone', 'utility_toolkit'],
  },
  aurora: {
    rarity: 'aurora',
    itemRarity: 'mythic',
    label: 'Mythic Aurora Lockbox',
    weight: 0.08,
    accentHex: 0xf0abfc,
    woodRange: [30, 44],
    stoneRange: [14, 22],
    iceRange: [5, 8],
    meatRange: [6, 10],
    peltsRange: [6, 10],
    goldRange: [120, 175],
    bonusItems: ['aurora_charm', 'frost_trap', 'mammoth_tonic'],
  },
};

function rollInt(min: number, max: number, rng: () => number): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

export function pickSecretChestRarity(
  zone: ZoneId = 'level1',
  rng: () => number = Math.random,
  gearOrContext?: number | LootScalingContext,
): SecretChestRarity {
  const gearLevel =
    typeof gearOrContext === 'number'
      ? gearOrContext
      : computeEffectiveLootGearLevel(gearOrContext);
  const weights = computeSecretChestRarityWeights(zone, gearLevel);
  const auroraThreshold = weights.aurora;
  const relicThreshold = weights.aurora + weights.relic;
  const roll = rng();
  if (roll < auroraThreshold) return 'aurora';
  if (roll < relicThreshold) return 'relic';
  return 'supply';
}

export function shouldSpawnSecretChest(params: {
  activeCountInZone: number;
  zone: ZoneId;
  rng?: () => number;
  chanceOverride?: number;
}): boolean {
  const { activeCountInZone, zone, rng = Math.random, chanceOverride } = params;
  if (zone === 'city') return false;
  if (activeCountInZone >= MAX_ACTIVE_SECRET_CHESTS) return false;
  const chance = chanceOverride ?? SECRET_CHEST_SPAWN_CHANCE;
  return rng() < chance;
}

export function pickSecretChestSpawnPoint(params: {
  zone: ZoneId;
  playerX: number;
  playerZ: number;
  obstacles?: Array<{ x: number; z: number }>;
  rng?: () => number;
}): { x: number; z: number } {
  const { zone, playerX, playerZ, obstacles = [], rng = Math.random } = params;
  const zSpec = ZONE_SPECS[zone];
  const minR = SECRET_CHEST_MIN_HEARTH_DIST;
  const maxR = Math.max(minR + 12, zSpec.radius - 10);

  let fallbackX = zSpec.centerX + minR;
  let fallbackZ = zSpec.centerZ + minR * 0.4;
  let bestScore = -1;

  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = rng() * Math.PI * 2;
    const r = minR + Math.sqrt(rng()) * (maxR - minR);
    const x = zSpec.centerX + Math.cos(angle) * r;
    const z = zSpec.centerZ + Math.sin(angle) * r;
    const dPlayer = Math.hypot(x - playerX, z - playerZ);
    const dPortal = Math.hypot(x - zSpec.portalX, z - zSpec.portalZ);
    const dForwardPortal =
      zSpec.forwardPortalX !== undefined && zSpec.forwardPortalZ !== undefined
        ? Math.hypot(x - zSpec.forwardPortalX, z - zSpec.forwardPortalZ)
        : 99;
    const dCityPortal =
      zone === 'level1'
        ? Math.hypot(x - LEVEL1_CITY_PORTAL_X, z - LEVEL1_CITY_PORTAL_Z)
        : 99;

    if (dPortal < 10 || dForwardPortal < 10 || dCityPortal < 10) continue;

    let blocked = false;
    for (let i = 0; i < obstacles.length; i++) {
      if (Math.hypot(x - obstacles[i].x, z - obstacles[i].z) < 2.8) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    if (dPlayer > bestScore) {
      bestScore = dPlayer;
      fallbackX = x;
      fallbackZ = z;
    }
    if (dPlayer >= SECRET_CHEST_MIN_PLAYER_DIST) {
      return { x, z };
    }
  }

  return { x: fallbackX, z: fallbackZ };
}

export function rollSecretChestLoot(
  rarity: SecretChestRarity,
  rng: () => number = Math.random,
  context?: LootScalingContext,
): ChestLootRoll {
  const spec = SECRET_CHEST_SPECS[rarity];
  const prog = computePlayerLootProgression(context);
  const mult = prog.resourceMultiplier;

  const baseIceMin = spec.iceRange[0] + (prog.progressionIndex >= 0.4 ? 1 : 0);
  const baseIceMax = spec.iceRange[1] + (prog.progressionIndex >= 0.35 ? 2 : 0);

  const resources: Partial<ResourceCounts> = {
    wood: Math.max(1, Math.round(rollInt(spec.woodRange[0], spec.woodRange[1], rng) * mult)),
    stone: Math.max(1, Math.round(rollInt(spec.stoneRange[0], spec.stoneRange[1], rng) * mult)),
    ice: Math.round(rollInt(baseIceMin, baseIceMax, rng) * mult),
    meat: Math.max(1, Math.round(rollInt(spec.meatRange[0], spec.meatRange[1], rng) * mult)),
    pelts: Math.max(1, Math.round(rollInt(spec.peltsRange[0], spec.peltsRange[1], rng) * mult)),
    gold: Math.max(1, Math.round(rollInt(spec.goldRange[0], spec.goldRange[1], rng) * mult)),
  };

  const sourceBonus = rarity === 'aurora' ? 0.42 : rarity === 'relic' ? 0.22 : 0.04;
  const minRarity: ItemRarity =
    rarity === 'aurora'
      ? prog.progressionIndex >= 0.55
        ? 'mythic'
        : 'rare'
      : rarity === 'relic'
        ? prog.progressionIndex >= 0.65
          ? 'epic'
          : 'uncommon'
        : prog.progressionIndex >= 0.6
          ? 'rare'
          : prog.progressionIndex >= 0.28
            ? 'uncommon'
            : 'common';

  const primaryRoll = rollWeightedLootItem(context, {
    sourceBonus,
    minRarity,
    preferredItems: spec.bonusItems,
    rng,
  });

  const extraCount =
    (rarity === 'aurora' ? 1 : 0) +
    (prog.progressionIndex >= 0.35 ? 1 : 0) +
    (prog.progressionIndex >= 0.75 ? 1 : 0);

  const extraItems =
    extraCount > 0
      ? rollWeightedLootItems(extraCount, context, {
          sourceBonus: sourceBonus * 0.85,
          minRarity: rarity === 'aurora' ? 'rare' : prog.progressionIndex >= 0.5 ? 'uncommon' : 'common',
          preferredItems: spec.bonusItems,
          rng,
        }).filter((item) => item.id !== primaryRoll.id)
      : [];

  return {
    rarity,
    label: spec.label,
    resources,
    bonusItemId: primaryRoll.id,
    bonusQty: primaryRoll.qty,
    rolledRarity: primaryRoll.rarity,
    extraItems,
    lootTierLabel: prog.tierLabel,
    effectiveGearLevel: prog.effectiveGearLevel,
    resourceMultiplier: prog.resourceMultiplier,
  };
}

export function findNearestSecretChest<
  T extends { id: number; zone: ZoneId; rarity: SecretChestRarity; x: number; z: number; opened: boolean },
>(
  chests: readonly T[],
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  maxRadius = SECRET_CHEST_INTERACT_RADIUS,
): { chest: T; info: SecretChestHudInfo } | null {
  let best: { chest: T; dist: number } | null = null;
  for (const ch of chests) {
    if (ch.opened || ch.zone !== zone) continue;
    const dist = Math.hypot(ch.x - playerX, ch.z - playerZ);
    if (dist <= maxRadius && (!best || dist < best.dist)) {
      best = { chest: ch, dist };
    }
  }
  if (!best) return null;
  const spec = SECRET_CHEST_SPECS[best.chest.rarity];
  return {
    chest: best.chest,
    info: {
      id: best.chest.id,
      rarity: best.chest.rarity,
      label: spec.label,
      distance: Math.round(best.dist * 10) / 10,
    },
  };
}

export function collectMinimapChestBlips<
  T extends { id: number; zone: ZoneId; rarity: SecretChestRarity; x: number; z: number; opened: boolean },
>(
  chests: readonly T[],
  playerX: number,
  playerZ: number,
  zone: ZoneId,
  sightActive: boolean,
): MinimapChestBlip[] {
  const maxRevealDist = sightActive ? 175 : 46;
  const blips: MinimapChestBlip[] = [];
  for (const ch of chests) {
    if (ch.opened || ch.zone !== zone) continue;
    if (Math.hypot(ch.x - playerX, ch.z - playerZ) <= maxRevealDist) {
      blips.push({
        id: ch.id,
        rarity: ch.rarity,
        x: ch.x,
        z: ch.z,
      });
    }
  }
  return blips;
}
