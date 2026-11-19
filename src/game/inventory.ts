import {
  ALL_CRAFT_RECIPES,
  type CraftRecipe,
  applyRecipeBuffEffect,
  canCraftRecipe,
  getCraftRecipe,
} from './crafting';
import { getWingsOfFireSpec } from './gear';
import { computeMythicAscensionBonuses } from './mystery';
import type {
  ActiveCraftBuffs,
  BackpackInventoryMap,
  BackpackPreparednessBonus,
  CraftCategory,
  CraftItemId,
  GearBonuses,
  GearLevels,
  GearSetBonusSpec,
  ItemRarity,
  MythicAscensionId,
  ResourceCounts,
} from './types';

export const ALL_CRAFT_ITEM_IDS: CraftItemId[] = ALL_CRAFT_RECIPES.map((r) => r.id);

export type TrapKind = 'snare' | 'frost';

export interface TrapSpec {
  kind: TrapKind;
  name: string;
  triggerRadius: number;
  damage: number;
  stunSeconds: number;
  colorHex: number;
  xpReward: number;
}

export const TRAP_SPECS: Record<TrapKind, TrapSpec> = {
  snare: {
    kind: 'snare',
    name: 'Snow Snare Trap',
    triggerRadius: 2.05,
    damage: 75,
    stunSeconds: 2.4,
    colorHex: 0x8ed49a,
    xpReward: 18,
  },
  frost: {
    kind: 'frost',
    name: 'Frostjaw Bear Trap',
    triggerRadius: 2.35,
    damage: 185,
    stunSeconds: 3.2,
    colorHex: 0x7be0ff,
    xpReward: 34,
  },
};

export function createInitialBackpackInventory(
  seed?: Partial<BackpackInventoryMap>,
): BackpackInventoryMap {
  return {
    clockwork_gear: seed?.clockwork_gear ?? 0,
    hammer_temper: seed?.hammer_temper ?? 0,
    utility_toolkit: seed?.utility_toolkit ?? 0,
    snare_trap: seed?.snare_trap ?? 0,
    frost_trap: seed?.frost_trap ?? 0,
    fire_starter: seed?.fire_starter ?? 0,
    insulated_boots: seed?.insulated_boots ?? 0,
    flint_quiver: seed?.flint_quiver ?? 0,
    alpine_poultice: seed?.alpine_poultice ?? 0,
    frost_whetstone: seed?.frost_whetstone ?? 0,
    mammoth_tonic: seed?.mammoth_tonic ?? 0,
    aurora_charm: seed?.aurora_charm ?? 0,
  };
}

export function computeBackpackItemCapacity(cargoCapacity: number): number {
  return 48 + Math.floor(Math.max(0, cargoCapacity - 25) / 4);
}

export function countBackpackItems(inv: BackpackInventoryMap): number {
  let total = 0;
  for (const id of ALL_CRAFT_ITEM_IDS) {
    total += Math.max(0, inv[id] ?? 0);
  }
  return total;
}

export interface CraftToBackpackResult {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  recipe: CraftRecipe;
  craftedQty: number;
}

export function craftItemToBackpack(params: {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  maxItems: number;
  id: CraftItemId;
}): CraftToBackpackResult | null {
  const { resources, inventory, maxItems, id } = params;
  if (!canCraftRecipe(resources, id, inventory)) {
    return null;
  }

  const recipe = getCraftRecipe(id);
  const gearCost = recipe.cost.gears ?? 0;
  const currentTotal = countBackpackItems(inventory);
  const netAdded = recipe.yieldQty - gearCost;
  if (currentTotal + netAdded > maxItems) {
    return null;
  }

  const nextResources: ResourceCounts = {
    wood: resources.wood - recipe.cost.wood,
    stone: (resources.stone ?? 0) - recipe.cost.stone,
    ice: Math.max(0, (resources.ice ?? 0) - (recipe.cost.ice ?? 0)),
    ...(resources.meat !== undefined ? { meat: resources.meat } : {}),
    pelts: resources.pelts - recipe.cost.pelts,
    gold: resources.gold - recipe.cost.gold,
  };

  const nextInventory: BackpackInventoryMap = {
    ...inventory,
    clockwork_gear: Math.max(0, (inventory.clockwork_gear ?? 0) - gearCost),
  };
  nextInventory[id] = (nextInventory[id] ?? 0) + recipe.yieldQty;

  return {
    resources: nextResources,
    inventory: nextInventory,
    recipe,
    craftedQty: recipe.yieldQty,
  };
}

export interface UseBackpackItemResult {
  inventory: BackpackInventoryMap;
  buffs: ActiveCraftBuffs;
  hp: number;
  warmth: number;
  recipe: CraftRecipe;
  deployTrapKind: TrapKind | null;
}

export function useBackpackItem(params: {
  inventory: BackpackInventoryMap;
  buffs: ActiveCraftBuffs;
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  id: CraftItemId;
}): UseBackpackItemResult | null {
  const { inventory, buffs, hp, maxHp, warmth, maxWarmth, id } = params;
  if ((inventory[id] ?? 0) <= 0) return null;

  const recipe = getCraftRecipe(id);
  if (recipe.usableKind === 'component') {
    return null;
  }

  const nextInventory: BackpackInventoryMap = {
    ...inventory,
    [id]: inventory[id] - 1,
  };

  if (recipe.usableKind === 'trap') {
    const deployTrapKind: TrapKind = id === 'frost_trap' ? 'frost' : 'snare';
    return {
      inventory: nextInventory,
      buffs: { ...buffs },
      hp,
      warmth,
      recipe,
      deployTrapKind,
    };
  }

  const applied = applyRecipeBuffEffect({
    buffs,
    hp,
    maxHp,
    warmth,
    maxWarmth,
    id,
  });

  return {
    inventory: nextInventory,
    buffs: applied.buffs,
    hp: applied.hp,
    warmth: applied.warmth,
    recipe: applied.recipe,
    deployTrapKind: null,
  };
}

export interface SalvageBackpackItemResult {
  inventory: BackpackInventoryMap;
  resources: ResourceCounts;
  recipe: CraftRecipe;
  salvagedQty: number;
  refunded: {
    wood: number;
    stone: number;
    ice: number;
    pelts: number;
    gold: number;
  };
}

export function salvageBackpackItem(params: {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  id: CraftItemId;
  qty?: number;
}): SalvageBackpackItemResult | null {
  const { resources, inventory, id, qty = 1 } = params;
  const available = Math.max(0, inventory[id] ?? 0);
  const requested = Math.floor(qty);
  if (available <= 0 || requested <= 0) return null;

  const salvagedQty = Math.min(available, requested);
  const recipe = getCraftRecipe(id);
  const yieldDivisor = Math.max(1, recipe.yieldQty);
  const rate = 0.35;

  const unitWood = (recipe.cost.wood * rate) / yieldDivisor;
  const unitStone = (recipe.cost.stone * rate) / yieldDivisor;
  const unitIce = ((recipe.cost.ice ?? 0) * rate) / yieldDivisor;
  const unitPelts = (recipe.cost.pelts * rate) / yieldDivisor;
  const unitGold = (recipe.cost.gold * rate) / yieldDivisor;

  const refunded = {
    wood: Math.floor(unitWood * salvagedQty),
    stone: Math.floor(unitStone * salvagedQty),
    ice: Math.floor(unitIce * salvagedQty),
    pelts: Math.floor(unitPelts * salvagedQty),
    gold: Math.floor(unitGold * salvagedQty),
  };

  if (
    refunded.wood === 0 &&
    refunded.stone === 0 &&
    refunded.ice === 0 &&
    refunded.pelts === 0 &&
    refunded.gold === 0 &&
    recipe.cost.wood > 0
  ) {
    refunded.wood = 1;
  }

  const nextInventory: BackpackInventoryMap = {
    ...inventory,
    [id]: available - salvagedQty,
  };

  const nextResources: ResourceCounts = {
    wood: resources.wood + refunded.wood,
    stone: (resources.stone ?? 0) + refunded.stone,
    ice: (resources.ice ?? 0) + refunded.ice,
    ...(resources.meat !== undefined ? { meat: resources.meat } : {}),
    pelts: resources.pelts + refunded.pelts,
    gold: resources.gold + refunded.gold,
  };

  return {
    inventory: nextInventory,
    resources: nextResources,
    recipe,
    salvagedQty,
    refunded,
  };
}

export type InventoryCategoryFilter = 'all' | CraftCategory;
export type InventorySortMode = 'stocked' | 'rarity' | 'name' | 'category';

const RARITY_WEIGHT: Record<ItemRarity, number> = {
  mythic: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const CATEGORY_WEIGHT: Record<CraftCategory, number> = {
  traps: 1,
  tools: 2,
  provisions: 3,
  parts: 4,
};

export function filterAndSortInventoryItems(params: {
  recipes?: CraftRecipe[];
  inventory: BackpackInventoryMap;
  filter: InventoryCategoryFilter;
  sort: InventorySortMode;
  searchQuery: string;
  stockedOnly?: boolean;
}): CraftRecipe[] {
  const {
    recipes = ALL_CRAFT_RECIPES,
    inventory,
    filter,
    sort,
    searchQuery,
    stockedOnly = false,
  } = params;

  const needle = searchQuery.trim().toLowerCase();

  const filtered = recipes.filter((recipe) => {
    if (filter !== 'all' && recipe.category !== filter) return false;
    if (stockedOnly && (inventory[recipe.id] ?? 0) <= 0) return false;
    if (needle.length > 0) {
      const hay = `${recipe.name} ${recipe.summary} ${recipe.tag} ${recipe.category} ${recipe.rarity}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    const qtyA = inventory[a.id] ?? 0;
    const qtyB = inventory[b.id] ?? 0;

    if (sort === 'stocked') {
      if ((qtyB > 0 ? 1 : 0) !== (qtyA > 0 ? 1 : 0)) {
        return (qtyB > 0 ? 1 : 0) - (qtyA > 0 ? 1 : 0);
      }
      if (qtyB !== qtyA) return qtyB - qtyA;
      const rDiff = RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
      if (rDiff !== 0) return rDiff;
      return a.name.localeCompare(b.name);
    }

    if (sort === 'rarity') {
      const rDiff = RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
      if (rDiff !== 0) return rDiff;
      if (qtyB !== qtyA) return qtyB - qtyA;
      return a.name.localeCompare(b.name);
    }

    if (sort === 'category') {
      const cDiff = CATEGORY_WEIGHT[a.category] - CATEGORY_WEIGHT[b.category];
      if (cDiff !== 0) return cDiff;
      if (qtyB !== qtyA) return qtyB - qtyA;
      return a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });
}

export interface InventorySlotOccupancy {
  used: number;
  maxItems: number;
  free: number;
  pct: number;
  visibleEmptySockets: number;
  hiddenEmptySockets: number;
}

export function getInventorySlotOccupancy(params: {
  inventory: BackpackInventoryMap;
  maxItems: number;
  maxEmptySocketsShown?: number;
}): InventorySlotOccupancy {
  const { inventory, maxItems, maxEmptySocketsShown = 6 } = params;
  const used = countBackpackItems(inventory);
  const safeMax = Math.max(1, maxItems);
  const free = Math.max(0, safeMax - used);
  const pct = Math.min(100, Math.round((used / safeMax) * 100));
  const visibleEmptySockets = Math.min(free, maxEmptySocketsShown);
  const hiddenEmptySockets = Math.max(0, free - visibleEmptySockets);
  return {
    used,
    maxItems: safeMax,
    free,
    pct,
    visibleEmptySockets,
    hiddenEmptySockets,
  };
}

export interface TotalEquipmentSummary {
  damageMult: number;
  moveSpeedMult: number;
  coldResistPct: number;
  hpRegenPerSec: number;
  gatherYieldMult: number;
  goldTradeMult: number;
  equippedGearCount: number;
  totalGearSlots: number;
  setTier: number;
}

export function computeTotalEquipmentSummary(params: {
  gear: GearLevels;
  gearBonuses: GearBonuses;
  gearSet: GearSetBonusSpec | null;
  wingsTier: number;
  wingsEquipped: boolean;
  equippedAscension: MythicAscensionId | null;
  preparedness: BackpackPreparednessBonus;
}): TotalEquipmentSummary {
  const {
    gear,
    gearBonuses,
    gearSet,
    wingsTier,
    wingsEquipped,
    equippedAscension,
    preparedness,
  } = params;

  const wingsActive = wingsTier > 0 && wingsEquipped;
  const wingsSpec = getWingsOfFireSpec(wingsActive ? wingsTier : 0);
  const ascBonuses = computeMythicAscensionBonuses(equippedAscension);

  const damageMult = Number(
    (
      gearBonuses.damageMult *
      (gearSet?.damageMult ?? 1) *
      wingsSpec.damageMult *
      ascBonuses.damageMult *
      preparedness.damageMult
    ).toFixed(2),
  );

  const moveSpeedMult = Number(
    (
      gearBonuses.moveSpeedMult *
      wingsSpec.moveSpeedMult *
      ascBonuses.moveSpeedMult *
      preparedness.moveSpeedMult
    ).toFixed(2),
  );

  const coldDecayMult =
    gearBonuses.coldDecayMult *
    (gearSet?.coldDecayMult ?? 1) *
    wingsSpec.coldDecayMult *
    ascBonuses.coldDecayMult *
    preparedness.coldDecayMult;
  const coldResistPct = Math.max(0, Math.min(99, Math.round((1 - coldDecayMult) * 100)));

  const hpRegenPerSec = Number(
    (
      gearBonuses.hpRegenPerSec +
      (gearSet?.hpRegenPerSec ?? 0) +
      wingsSpec.hpRegenBonus +
      ascBonuses.hpRegenPerSec
    ).toFixed(1),
  );

  const gatherYieldMult = Number(
    (
      gearBonuses.gatherYieldMult *
      (gearSet?.gatherYieldMult ?? 1) *
      ascBonuses.gatherYieldMult
    ).toFixed(2),
  );

  const goldTradeMult = Number(
    (gearBonuses.goldTradeMult * (gearSet?.goldTradeMult ?? 1)).toFixed(2),
  );

  const equippedArmorCount = (['coat', 'boots', 'gloves', 'pack'] as const).filter(
    (slot) => (gear[slot] ?? 0) > 0,
  ).length;
  const equippedGearCount =
    equippedArmorCount + (wingsActive ? 1 : 0) + (equippedAscension ? 1 : 0);

  return {
    damageMult,
    moveSpeedMult,
    coldResistPct,
    hpRegenPerSec,
    gatherYieldMult,
    goldTradeMult,
    equippedGearCount,
    totalGearSlots: 6,
    setTier: gearBonuses.setTier,
  };
}

export function computeBackpackPreparedness(
  inv: BackpackInventoryMap,
  buffs?: ActiveCraftBuffs,
): BackpackPreparednessBonus {
  const stockedCount = countBackpackItems(inv);

  const toolsAndPartsCount =
    (inv.clockwork_gear ?? 0) +
    (inv.hammer_temper ?? 0) +
    (inv.utility_toolkit ?? 0);
  const trapsCount = (inv.snare_trap ?? 0) + (inv.frost_trap ?? 0);
  const provisionsCount =
    (inv.fire_starter ?? 0) +
    (inv.insulated_boots ?? 0) +
    (inv.flint_quiver ?? 0) +
    (inv.alpine_poultice ?? 0) +
    (inv.frost_whetstone ?? 0) +
    (inv.mammoth_tonic ?? 0) +
    (inv.aurora_charm ?? 0);

  let uniqueCategories = 0;
  if (toolsAndPartsCount > 0) uniqueCategories += 1;
  if (trapsCount > 0) uniqueCategories += 1;
  if (provisionsCount > 0) uniqueCategories += 1;

  const activeBuffCount = buffs
    ? [
        buffs.fireStarter,
        buffs.insulatedBoots,
        buffs.flintEdge,
        buffs.frostWhetstone ?? 0,
        buffs.auroraCharm ?? 0,
        buffs.hammerTemper ?? 0,
        buffs.utilityToolkit ?? 0,
      ].filter((s) => s > 0).length
    : 0;

  const damageMult =
    1 + Math.min(0.12, toolsAndPartsCount * 0.03 + activeBuffCount * 0.02);
  const moveSpeedMult = 1 + Math.min(0.08, trapsCount * 0.025 + uniqueCategories * 0.015);
  const coldDecayMult = Math.max(0.84, 1 - Math.min(0.16, provisionsCount * 0.03));

  const label =
    stockedCount === 0 && activeBuffCount === 0
      ? 'Pack Empty · Craft kits & gears to empower buffs'
      : `Pack Link (${stockedCount} items · ${activeBuffCount} active buffs)`;

  return {
    stockedCount,
    uniqueCategories,
    damageMult: Number(damageMult.toFixed(3)),
    moveSpeedMult: Number(moveSpeedMult.toFixed(3)),
    coldDecayMult: Number(coldDecayMult.toFixed(3)),
    label,
  };
}
