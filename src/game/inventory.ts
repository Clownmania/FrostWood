import {
  ALL_CRAFT_RECIPES,
  type CraftRecipe,
  applyRecipeBuffEffect,
  canCraftRecipe,
  getCraftRecipe,
} from './crafting';
import type {
  ActiveCraftBuffs,
  BackpackInventoryMap,
  BackpackPreparednessBonus,
  CraftItemId,
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
  return 12 + Math.floor(Math.max(0, cargoCapacity - 25) / 8);
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
