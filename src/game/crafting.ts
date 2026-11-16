import type {
  ActiveCraftBuffs,
  BackpackInventoryMap,
  CraftCategory,
  CraftItemId,
  ItemRarity,
  ResourceCounts,
  WeatherKind,
} from './types';

export type CraftUsableKind = 'component' | 'buff' | 'trap';

export interface CraftRecipe {
  id: CraftItemId;
  name: string;
  category: CraftCategory;
  usableKind: CraftUsableKind;
  rarity: ItemRarity;
  yieldQty: number;
  cost: {
    wood: number;
    stone: number;
    ice?: number;
    pelts: number;
    gold: number;
    gears?: number;
  };
  duration: number;
  instantHp: number;
  instantWarmth: number;
  summary: string;
  tag: string;
}

export const WORKBENCH_RECIPES: CraftRecipe[] = [
  {
    id: 'clockwork_gear',
    name: 'Clockwork Gears',
    category: 'parts',
    usableKind: 'component',
    rarity: 'common',
    yieldQty: 2,
    cost: { wood: 3, stone: 4, pelts: 0, gold: 5 },
    duration: 0,
    instantHp: 0,
    instantWarmth: 0,
    tag: 'Forge Part · Yields x2',
    summary: 'Hammer-forged brass & iron gears used to build traps, tempered kits & field tools.',
  },
  {
    id: 'hammer_temper',
    name: 'Hammer Temper Kit',
    category: 'tools',
    usableKind: 'buff',
    rarity: 'uncommon',
    yieldQty: 1,
    cost: { wood: 3, stone: 4, pelts: 0, gold: 10, gears: 1 },
    duration: 45,
    instantHp: 0,
    instantWarmth: 0,
    tag: '45s +30% Hammer Power',
    summary: 'Anvil-tempered honing kit: +30% axe chop, boulder mining & melee power for 45s.',
  },
  {
    id: 'utility_toolkit',
    name: 'Artisan Field Toolkit',
    category: 'tools',
    usableKind: 'buff',
    rarity: 'rare',
    yieldQty: 1,
    cost: { wood: 5, stone: 2, pelts: 2, gold: 15, gears: 1 },
    duration: 45,
    instantHp: 0,
    instantWarmth: 0,
    tag: '45s +25% Yield & +16% Spd',
    summary: 'Precision saw, tongs & pulleys: +25% harvest yield and +16% move speed for 45s.',
  },
  {
    id: 'snare_trap',
    name: 'Snow Snare Trap',
    category: 'traps',
    usableKind: 'trap',
    rarity: 'common',
    yieldQty: 1,
    cost: { wood: 4, stone: 1, pelts: 2, gold: 0, gears: 1 },
    duration: 0,
    instantHp: 0,
    instantWarmth: 0,
    tag: 'Deployable Snare Trap',
    summary: 'Spring-loaded snow snare: catches game in the field for 75 dmg, stun & Hunting XP.',
  },
  {
    id: 'frost_trap',
    name: 'Frostjaw Bear Trap',
    category: 'traps',
    usableKind: 'trap',
    rarity: 'rare',
    yieldQty: 1,
    cost: { wood: 4, stone: 5, ice: 1, pelts: 2, gold: 20, gears: 2 },
    duration: 0,
    instantHp: 0,
    instantWarmth: 0,
    tag: 'Deployable Heavy Trap',
    summary: 'Serrated steel jaw trap: clamps onto wolves, bears & apex beasts for 185 dmg + stun.',
  },
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'fire_starter',
    name: 'Fire Starter Kit',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'common',
    yieldQty: 1,
    cost: { wood: 6, stone: 3, pelts: 0, gold: 0 },
    duration: 30,
    instantHp: 12,
    instantWarmth: 45,
    tag: '30s Warmth Aura',
    summary: '+45 Warmth, +12 HP & cuts cold chill by 50% for 30s.',
  },
  {
    id: 'insulated_boots',
    name: 'Insulated Boots',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'uncommon',
    yieldQty: 1,
    cost: { wood: 2, stone: 0, pelts: 4, gold: 0 },
    duration: 45,
    instantHp: 0,
    instantWarmth: 15,
    tag: '45s Blizzard Stride',
    summary: 'Cuts blizzard chill by 65% & grants +22% snow speed for 45s.',
  },
  {
    id: 'flint_quiver',
    name: 'Flint-Tipped Quiver',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'uncommon',
    yieldQty: 1,
    cost: { wood: 5, stone: 4, pelts: 0, gold: 0 },
    duration: 40,
    instantHp: 0,
    instantWarmth: 0,
    tag: '40s +35% Power',
    summary: '+35% axe chop & bow hunting power for 40s.',
  },
  {
    id: 'alpine_poultice',
    name: 'Alpine Fur Poultice',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'common',
    yieldQty: 1,
    cost: { wood: 3, stone: 1, pelts: 3, gold: 0 },
    duration: 0,
    instantHp: 45,
    instantWarmth: 30,
    tag: 'Instant Restore',
    summary: 'Immediately restores +45 HP and +30 Warmth in the field.',
  },
  {
    id: 'frost_whetstone',
    name: 'Glacial Whetstone',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'rare',
    yieldQty: 1,
    cost: { wood: 6, stone: 4, ice: 1, pelts: 2, gold: 25 },
    duration: 45,
    instantHp: 0,
    instantWarmth: 0,
    tag: '45s +55% Weapon Power',
    summary: 'Rare frost-honed edge: +55% axe & bow damage for 45s.',
  },
  {
    id: 'mammoth_tonic',
    name: 'Mammoth Bone Draught',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'epic',
    yieldQty: 1,
    cost: { wood: 8, stone: 2, ice: 2, pelts: 6, gold: 65 },
    duration: 45,
    instantHp: 85,
    instantWarmth: 75,
    tag: 'Epic Vitality Surge',
    summary: 'Restores +85 HP & +75 Warmth, +28% speed & 50% frost shield for 45s.',
  },
  {
    id: 'aurora_charm',
    name: 'Aurora Heart Talisman',
    category: 'provisions',
    usableKind: 'buff',
    rarity: 'mythic',
    yieldQty: 1,
    cost: { wood: 14, stone: 5, ice: 4, pelts: 10, gold: 140 },
    duration: 50,
    instantHp: 120,
    instantWarmth: 100,
    tag: 'Mythic Aurora Blessing',
    summary: 'Full Warmth & +120 HP, blizzard immunity, +75% damage & +35% speed for 50s.',
  },
];

export const ALL_CRAFT_RECIPES: CraftRecipe[] = [
  ...WORKBENCH_RECIPES,
  ...CRAFT_RECIPES,
];

export const INITIAL_BUFFS: ActiveCraftBuffs = {
  fireStarter: 0,
  insulatedBoots: 0,
  flintEdge: 0,
  frostWhetstone: 0,
  auroraCharm: 0,
  hammerTemper: 0,
  utilityToolkit: 0,
};

export function getCraftRecipe(id: CraftItemId): CraftRecipe {
  const found = ALL_CRAFT_RECIPES.find((r) => r.id === id);
  return found ?? ALL_CRAFT_RECIPES[0];
}

export function canCraftRecipe(
  resources: ResourceCounts,
  id: CraftItemId,
  inventory?: Partial<BackpackInventoryMap>,
): boolean {
  const recipe = getCraftRecipe(id);
  const gearCost = recipe.cost.gears ?? 0;
  const gearsHave = inventory?.clockwork_gear ?? 0;
  return (
    resources.wood >= recipe.cost.wood &&
    (resources.stone ?? 0) >= recipe.cost.stone &&
    (resources.ice ?? 0) >= (recipe.cost.ice ?? 0) &&
    resources.pelts >= recipe.cost.pelts &&
    resources.gold >= recipe.cost.gold &&
    gearsHave >= gearCost
  );
}

export function applyRecipeBuffEffect(params: {
  buffs: ActiveCraftBuffs;
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  id: CraftItemId;
}): {
  buffs: ActiveCraftBuffs;
  hp: number;
  warmth: number;
  recipe: CraftRecipe;
} {
  const { buffs, hp, maxHp, warmth, maxWarmth, id } = params;
  const recipe = getCraftRecipe(id);
  const nextBuffs: ActiveCraftBuffs = { ...buffs };

  if (id === 'fire_starter') {
    nextBuffs.fireStarter = Math.max(nextBuffs.fireStarter, recipe.duration);
  } else if (id === 'insulated_boots') {
    nextBuffs.insulatedBoots = Math.max(nextBuffs.insulatedBoots, recipe.duration);
  } else if (id === 'flint_quiver') {
    nextBuffs.flintEdge = Math.max(nextBuffs.flintEdge, recipe.duration);
  } else if (id === 'frost_whetstone') {
    nextBuffs.frostWhetstone = Math.max(nextBuffs.frostWhetstone ?? 0, recipe.duration);
  } else if (id === 'mammoth_tonic') {
    nextBuffs.fireStarter = Math.max(nextBuffs.fireStarter, recipe.duration);
    nextBuffs.insulatedBoots = Math.max(nextBuffs.insulatedBoots, recipe.duration);
  } else if (id === 'aurora_charm') {
    nextBuffs.auroraCharm = Math.max(nextBuffs.auroraCharm ?? 0, recipe.duration);
  } else if (id === 'hammer_temper') {
    nextBuffs.hammerTemper = Math.max(nextBuffs.hammerTemper ?? 0, recipe.duration);
  } else if (id === 'utility_toolkit') {
    nextBuffs.utilityToolkit = Math.max(nextBuffs.utilityToolkit ?? 0, recipe.duration);
  }

  return {
    buffs: nextBuffs,
    hp: Math.min(maxHp, hp + recipe.instantHp),
    warmth: Math.min(maxWarmth, warmth + recipe.instantWarmth),
    recipe,
  };
}

export function getLinkedBuffSeconds(
  id: CraftItemId,
  buffs: ActiveCraftBuffs,
): number {
  switch (id) {
    case 'fire_starter':
    case 'mammoth_tonic':
      return buffs.fireStarter;
    case 'insulated_boots':
      return buffs.insulatedBoots;
    case 'flint_quiver':
      return buffs.flintEdge;
    case 'frost_whetstone':
      return buffs.frostWhetstone ?? 0;
    case 'aurora_charm':
      return buffs.auroraCharm ?? 0;
    case 'hammer_temper':
      return buffs.hammerTemper ?? 0;
    case 'utility_toolkit':
      return buffs.utilityToolkit ?? 0;
    default:
      return 0;
  }
}

export function applyCraftRecipe(params: {
  resources: ResourceCounts;
  buffs: ActiveCraftBuffs;
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  id: CraftItemId;
}): {
  resources: ResourceCounts;
  buffs: ActiveCraftBuffs;
  hp: number;
  warmth: number;
  recipe: CraftRecipe;
} | null {
  const { resources, buffs, hp, maxHp, warmth, maxWarmth, id } = params;
  if (!canCraftRecipe(resources, id)) return null;
  const recipe = getCraftRecipe(id);

  const nextResources: ResourceCounts = {
    wood: resources.wood - recipe.cost.wood,
    stone: (resources.stone ?? 0) - recipe.cost.stone,
    ice: Math.max(0, (resources.ice ?? 0) - (recipe.cost.ice ?? 0)),
    pelts: resources.pelts - recipe.cost.pelts,
    gold: resources.gold - recipe.cost.gold,
  };

  const effect = applyRecipeBuffEffect({
    buffs,
    hp,
    maxHp,
    warmth,
    maxWarmth,
    id,
  });

  return {
    resources: nextResources,
    buffs: effect.buffs,
    hp: effect.hp,
    warmth: effect.warmth,
    recipe,
  };
}

export function tickCraftBuffs(
  buffs: ActiveCraftBuffs,
  dt: number,
): { buffs: ActiveCraftBuffs; changed: boolean } {
  const prevWhet = buffs.frostWhetstone ?? 0;
  const prevAurora = buffs.auroraCharm ?? 0;
  const prevHammer = buffs.hammerTemper ?? 0;
  const prevToolkit = buffs.utilityToolkit ?? 0;
  const next: ActiveCraftBuffs = {
    fireStarter: Math.max(0, buffs.fireStarter - dt),
    insulatedBoots: Math.max(0, buffs.insulatedBoots - dt),
    flintEdge: Math.max(0, buffs.flintEdge - dt),
    frostWhetstone: Math.max(0, prevWhet - dt),
    auroraCharm: Math.max(0, prevAurora - dt),
    hammerTemper: Math.max(0, prevHammer - dt),
    utilityToolkit: Math.max(0, prevToolkit - dt),
  };
  const changed =
    (buffs.fireStarter > 0 && next.fireStarter === 0) ||
    (buffs.insulatedBoots > 0 && next.insulatedBoots === 0) ||
    (buffs.flintEdge > 0 && next.flintEdge === 0) ||
    (prevWhet > 0 && (next.frostWhetstone ?? 0) === 0) ||
    (prevAurora > 0 && (next.auroraCharm ?? 0) === 0) ||
    (prevHammer > 0 && (next.hammerTemper ?? 0) === 0) ||
    (prevToolkit > 0 && (next.utilityToolkit ?? 0) === 0);
  return { buffs: next, changed };
}

export function computeCraftChillScale(
  weather: WeatherKind,
  buffs: ActiveCraftBuffs,
): number {
  if ((buffs.auroraCharm ?? 0) > 0) {
    return 0.08;
  }
  let scale = 1.0;
  if (buffs.fireStarter > 0) {
    scale *= 0.5;
  }
  if (buffs.insulatedBoots > 0) {
    scale *= weather === 'blizzard' ? 0.35 : 0.65;
  }
  return scale;
}

export function computeCraftSpeedScale(buffs: ActiveCraftBuffs): number {
  let scale = 1.0;
  if ((buffs.utilityToolkit ?? 0) > 0) scale = Math.max(scale, 1.16);
  if (buffs.insulatedBoots > 0) scale = Math.max(scale, 1.22);
  if ((buffs.auroraCharm ?? 0) > 0) scale = Math.max(scale, 1.35);
  return scale;
}

export function computeCraftDamageScale(buffs: ActiveCraftBuffs): number {
  let scale = 1.0;
  if ((buffs.hammerTemper ?? 0) > 0) scale *= 1.3;
  if (buffs.flintEdge > 0) scale *= 1.35;
  if ((buffs.frostWhetstone ?? 0) > 0) scale *= 1.55;
  if ((buffs.auroraCharm ?? 0) > 0) scale *= 1.75;
  return scale;
}

export function computeCraftYieldScale(buffs: ActiveCraftBuffs): number {
  return (buffs.utilityToolkit ?? 0) > 0 ? 1.25 : 1.0;
}
