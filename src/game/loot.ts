import { GEAR_SLOT_ORDER } from './gear';
import type {
  CraftItemId,
  GearLevels,
  ItemRarity,
  LastLootRollHudInfo,
  LootDroppedItem,
  LootScalingHudInfo,
  SecretChestRarity,
  ZoneId,
} from './types';

export interface LootScalingContext {
  zone?: ZoneId;
  gear?: Partial<GearLevels>;
  unlockedGear?: Partial<GearLevels>;
  gearLevel?: number;
  axeTier?: number;
  bowTier?: number;
  wingsTier?: number;
}

export interface LootItemPoolEntry {
  id: CraftItemId;
  rarity: ItemRarity;
  baseWeight: number;
  minQty: number;
  maxQty: number;
}

export const ITEM_RARITY_ORDER: readonly ItemRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'mythic',
];

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  mythic: 4,
};

export const ZONE_LOOT_TIER: Record<ZoneId, 1 | 2 | 3 | 4 | 5 | 6> = {
  level1: 1,
  level2: 2,
  city: 3,
  level3: 4,
  level4: 5,
  level5: 6,
};

export const ZONE_LOOT_MULTIPLIER: Record<ZoneId, number> = {
  level1: 1.0,
  level2: 1.35,
  city: 1.55,
  level3: 1.85,
  level4: 2.35,
  level5: 3.1,
};

export const LOOT_ITEM_POOL: readonly LootItemPoolEntry[] = [
  // Common field components & provisions
  { id: 'clockwork_gear', rarity: 'common', baseWeight: 1.35, minQty: 1, maxQty: 3 },
  { id: 'fire_starter', rarity: 'common', baseWeight: 1.15, minQty: 1, maxQty: 2 },
  { id: 'alpine_poultice', rarity: 'common', baseWeight: 1.25, minQty: 1, maxQty: 2 },
  { id: 'snare_trap', rarity: 'common', baseWeight: 1.05, minQty: 1, maxQty: 2 },

  // Uncommon forged kits & winter gear buffs
  { id: 'hammer_temper', rarity: 'uncommon', baseWeight: 1.3, minQty: 1, maxQty: 2 },
  { id: 'insulated_boots', rarity: 'uncommon', baseWeight: 1.05, minQty: 1, maxQty: 2 },
  { id: 'flint_quiver', rarity: 'uncommon', baseWeight: 1.2, minQty: 1, maxQty: 2 },

  // Rare masterwork traps, whetstones & toolkits
  { id: 'utility_toolkit', rarity: 'rare', baseWeight: 1.15, minQty: 1, maxQty: 2 },
  { id: 'frost_trap', rarity: 'rare', baseWeight: 1.3, minQty: 1, maxQty: 2 },
  { id: 'frost_whetstone', rarity: 'rare', baseWeight: 1.35, minQty: 1, maxQty: 2 },

  // Epic highland draughts
  { id: 'mammoth_tonic', rarity: 'epic', baseWeight: 1.45, minQty: 1, maxQty: 2 },

  // Mythic aurora relics
  { id: 'aurora_charm', rarity: 'mythic', baseWeight: 1.5, minQty: 1, maxQty: 2 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function compareItemRarity(a: ItemRarity, b: ItemRarity): number {
  return RARITY_RANK[a] - RARITY_RANK[b];
}

export function computeEffectiveLootGearLevel(context?: LootScalingContext): number {
  if (!context) return 1.0;
  if (typeof context.gearLevel === 'number' && Number.isFinite(context.gearLevel)) {
    return Number(clamp(context.gearLevel, 0.5, 5.0).toFixed(2));
  }

  let slotSum = 0;
  let hasAnySlot = false;
  for (const slot of GEAR_SLOT_ORDER) {
    const equippedVal = context.gear?.[slot];
    const unlockedVal = context.unlockedGear?.[slot];
    if (equippedVal !== undefined || unlockedVal !== undefined) {
      hasAnySlot = true;
      const eq = equippedVal !== undefined ? clamp(equippedVal, 0, 5) : clamp(unlockedVal ?? 1, 1, 5);
      // Equipped gear drives primary power; unequipped slot still retains partial unlocked credit
      const slotEffective =
        eq > 0
          ? unlockedVal !== undefined
            ? Math.max(eq, eq * 0.75 + clamp(unlockedVal, 1, 5) * 0.25)
            : eq
          : 0.55 + Math.max(0, (unlockedVal ?? 1) - 1) * 0.15;
      slotSum += slotEffective;
    } else {
      slotSum += 1;
    }
  }

  const baseAvg = hasAnySlot ? slotSum / GEAR_SLOT_ORDER.length : 1.0;
  const axeBonus = Math.max(0, (clamp(context.axeTier ?? 1, 1, 5) - 1) * 0.08);
  const bowBonus = Math.max(0, (clamp(context.bowTier ?? 1, 1, 5) - 1) * 0.08);
  const wingsBonus = Math.max(0, clamp(context.wingsTier ?? 0, 0, 3) * 0.16);

  return Number(clamp(baseAvg + axeBonus + bowBonus + wingsBonus, 0.5, 5.0).toFixed(2));
}

export interface PlayerLootProgression {
  zone: ZoneId;
  zoneTier: 1 | 2 | 3 | 4 | 5 | 6;
  effectiveGearLevel: number;
  gearProgress: number; // 0..1
  zoneProgress: number; // 0..1
  progressionIndex: number; // 0..1
  resourceMultiplier: number;
  tierLabel: string;
}

export function computePlayerLootProgression(
  context?: LootScalingContext,
): PlayerLootProgression {
  const zone: ZoneId = context?.zone ?? 'level1';
  const zoneTier = ZONE_LOOT_TIER[zone];
  const effectiveGearLevel = computeEffectiveLootGearLevel(context);

  const gearProgress = clamp((effectiveGearLevel - 1) / 4, 0, 1);
  const zoneProgress = clamp((zoneTier - 1) / 2, 0, 1);
  const progressionIndex = Number(
    clamp(gearProgress * 0.62 + zoneProgress * 0.38, 0, 1).toFixed(3),
  );

  const zoneMult = ZONE_LOOT_MULTIPLIER[zone];
  const gearMult = 1 + gearProgress * 0.65;
  const resourceMultiplier = Number((zoneMult * gearMult).toFixed(2));

  const tierLabel =
    progressionIndex >= 0.8
      ? 'Tier V · Sovereign Apex Spoils'
      : progressionIndex >= 0.58
        ? 'Tier IV · Glacial Vanguard Spoils'
        : progressionIndex >= 0.36
          ? 'Tier III · Highland Tracker Spoils'
          : progressionIndex >= 0.16
            ? 'Tier II · Valley Pathfinder Spoils'
            : 'Tier I · Frontier Forager Spoils';

  return {
    zone,
    zoneTier,
    effectiveGearLevel,
    gearProgress,
    zoneProgress,
    progressionIndex,
    resourceMultiplier,
    tierLabel,
  };
}

export function computeSecretChestRarityWeights(
  zone: ZoneId = 'level1',
  gearLevel = 1,
): Record<SecretChestRarity, number> {
  const gearProgress = clamp((gearLevel - 1) / 4, 0, 1);
  const zoneAuroraBoost =
    zone === 'level2'
      ? 0.06
      : zone === 'city'
        ? 0.1
        : zone === 'level3'
          ? 0.14
          : zone === 'level4'
            ? 0.2
            : zone === 'level5'
              ? 0.26
              : 0;
  const zoneRelicBoost =
    zone === 'level2'
      ? 0.08
      : zone === 'city'
        ? 0.12
        : zone === 'level3'
          ? 0.14
          : zone === 'level4'
            ? 0.16
            : zone === 'level5'
              ? 0.18
              : 0;

  const gearAuroraBoost = gearProgress * 0.22;
  const gearRelicBoost = gearProgress * 0.2;

  const aurora = Number(Math.min(0.48, 0.08 + zoneAuroraBoost + gearAuroraBoost).toFixed(4));
  const relic = Number(Math.min(0.46, 0.27 + zoneRelicBoost + gearRelicBoost).toFixed(4));
  const supply = Number(Math.max(0.06, 1 - aurora - relic).toFixed(4));

  return {
    supply,
    relic,
    aurora,
  };
}

export function computeItemRarityWeights(
  context?: LootScalingContext,
  options?: {
    sourceBonus?: number;
    minRarity?: ItemRarity;
  },
): Record<ItemRarity, number> {
  const prog = computePlayerLootProgression(context);
  const sourceBonus = options?.sourceBonus ?? 0;
  const minRarity = options?.minRarity ?? 'common';
  const minRank = RARITY_RANK[minRarity];

  // Combined progression factor (0..1.35) shifting weight from common/uncommon toward rare/epic/mythic
  const p = clamp(prog.progressionIndex + sourceBonus, 0, 1.35);

  const raw: Record<ItemRarity, number> = {
    common: Math.max(3, 50 - p * 38),
    uncommon: Math.max(8, 30 - p * 14),
    rare: 13 + p * 22,
    epic: 5 + p * p * 26,
    mythic: 2 + p * p * 20,
  };

  let sum = 0;
  for (const r of ITEM_RARITY_ORDER) {
    if (RARITY_RANK[r] < minRank) {
      raw[r] = 0;
    } else {
      sum += raw[r];
    }
  }

  if (sum <= 0) {
    return {
      common: minRarity === 'common' ? 1 : 0,
      uncommon: minRarity === 'uncommon' ? 1 : 0,
      rare: minRarity === 'rare' ? 1 : 0,
      epic: minRarity === 'epic' ? 1 : 0,
      mythic: minRarity === 'mythic' ? 1 : 0,
    };
  }

  return {
    common: raw.common / sum,
    uncommon: raw.uncommon / sum,
    rare: raw.rare / sum,
    epic: raw.epic / sum,
    mythic: raw.mythic / sum,
  };
}

export function rollWeightedRarity(
  weights: Record<ItemRarity, number>,
  rng: () => number = Math.random,
): ItemRarity {
  const roll = clamp(rng(), 0, 0.999999);
  let cumulative = 0;
  let fallback: ItemRarity = 'common';
  for (const rarity of ITEM_RARITY_ORDER) {
    const w = weights[rarity] ?? 0;
    if (w > 0) {
      fallback = rarity;
      cumulative += w;
      if (roll < cumulative) {
        return rarity;
      }
    }
  }
  return fallback;
}

export function rollWeightedLootItem(
  context?: LootScalingContext,
  options?: {
    sourceBonus?: number;
    minRarity?: ItemRarity;
    preferredItems?: readonly CraftItemId[];
    excludeItems?: readonly CraftItemId[];
    rng?: () => number;
  },
): LootDroppedItem {
  const rng = options?.rng ?? Math.random;
  const prog = computePlayerLootProgression(context);
  const weights = computeItemRarityWeights(context, {
    sourceBonus: options?.sourceBonus,
    minRarity: options?.minRarity,
  });

  const chosenRarity = rollWeightedRarity(weights, rng);
  const excludeSet = new Set<CraftItemId>(options?.excludeItems ?? []);
  const preferredSet = new Set<CraftItemId>(options?.preferredItems ?? []);

  const minRank = RARITY_RANK[options?.minRarity ?? 'common'];
  let candidates = LOOT_ITEM_POOL.filter(
    (entry) => entry.rarity === chosenRarity && !excludeSet.has(entry.id),
  );
  if (candidates.length === 0) {
    candidates = LOOT_ITEM_POOL.filter(
      (entry) => RARITY_RANK[entry.rarity] >= minRank && !excludeSet.has(entry.id),
    );
  }
  if (candidates.length === 0) {
    candidates = LOOT_ITEM_POOL.filter((entry) => !excludeSet.has(entry.id));
  }
  if (candidates.length === 0) {
    candidates = LOOT_ITEM_POOL.filter((entry) => entry.rarity === chosenRarity);
  }
  if (candidates.length === 0) {
    candidates = [...LOOT_ITEM_POOL];
  }

  let totalWeight = 0;
  const effectiveWeights = candidates.map((entry) => {
    const prefMult = preferredSet.has(entry.id) ? 1.65 : 1.0;
    const w = entry.baseWeight * prefMult;
    totalWeight += w;
    return w;
  });

  let pickRoll = clamp(rng(), 0, 0.999999) * totalWeight;
  let picked = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    pickRoll -= effectiveWeights[i];
    if (pickRoll <= 0) {
      picked = candidates[i];
      break;
    }
  }

  // Stack quantity scales with progressionIndex + sourceBonus
  const stackChance = clamp(prog.progressionIndex * 0.55 + (options?.sourceBonus ?? 0) * 0.35, 0, 0.85);
  const maxAllowedQty =
    picked.maxQty + (prog.progressionIndex >= 0.72 && picked.rarity !== 'mythic' ? 1 : 0);
  let qty = picked.minQty;
  if (maxAllowedQty > picked.minQty && rng() < stackChance) {
    qty =
      picked.minQty +
      1 +
      (maxAllowedQty > picked.minQty + 1 && rng() < prog.progressionIndex * 0.45 ? 1 : 0);
  }

  return {
    id: picked.id,
    qty,
    rarity: picked.rarity,
  };
}

export function rollWeightedLootItems(
  count: number,
  context?: LootScalingContext,
  options?: {
    sourceBonus?: number;
    minRarity?: ItemRarity;
    preferredItems?: readonly CraftItemId[];
    rng?: () => number;
  },
): LootDroppedItem[] {
  const rng = options?.rng ?? Math.random;
  const results: LootDroppedItem[] = [];
  const usedIds: CraftItemId[] = [];

  for (let i = 0; i < count; i++) {
    // First slot uses minRarity directly; subsequent slots allow one step lower or minRarity
    const slotMinRarity: ItemRarity =
      i === 0
        ? (options?.minRarity ?? 'common')
        : options?.minRarity === 'mythic'
          ? 'epic'
          : options?.minRarity === 'epic'
            ? 'rare'
            : (options?.minRarity ?? 'common');
    const rolled = rollWeightedLootItem(context, {
      sourceBonus: (options?.sourceBonus ?? 0) + (i === 0 ? 0.08 : 0),
      minRarity: slotMinRarity,
      preferredItems: options?.preferredItems,
      excludeItems: usedIds,
      rng,
    });
    usedIds.push(rolled.id);
    results.push(rolled);
  }

  return results;
}

function toRoundedPercentages<K extends string>(
  weights: Record<K, number>,
  keys: readonly K[],
): Record<K, number> {
  const result = {} as Record<K, number>;
  let sum = 0;
  for (const k of keys) {
    const pct = Math.round((weights[k] ?? 0) * 100);
    result[k] = pct;
    sum += pct;
  }
  const diff = 100 - sum;
  if (diff !== 0 && keys.length > 0) {
    // Adjust largest bucket so percentages always sum cleanly to 100%
    let maxKey = keys[0];
    for (const k of keys) {
      if (result[k] > result[maxKey]) maxKey = k;
    }
    result[maxKey] = Math.max(0, result[maxKey] + diff);
  }
  return result;
}

export function buildLootScalingHudInfo(
  context?: LootScalingContext,
  lastRoll: LastLootRollHudInfo | null = null,
): LootScalingHudInfo {
  const prog = computePlayerLootProgression(context);
  const chestWeights = computeSecretChestRarityWeights(prog.zone, prog.effectiveGearLevel);
  const itemWeights = computeItemRarityWeights(context);

  return {
    zone: prog.zone,
    zoneTier: prog.zoneTier,
    effectiveGearLevel: prog.effectiveGearLevel,
    progressionIndex: prog.progressionIndex,
    tierLabel: prog.tierLabel,
    resourceMultiplier: prog.resourceMultiplier,
    chestRarityPercentages: toRoundedPercentages(chestWeights, ['supply', 'relic', 'aurora']),
    itemRarityPercentages: toRoundedPercentages(itemWeights, ITEM_RARITY_ORDER),
    lastRoll,
  };
}
