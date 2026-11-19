import type {
  BoulderKind,
  MythicAscensionId,
  MysteryShopItemId,
  RareMaterialId,
  RareMaterialMap,
  ResourceCounts,
  TreeKind,
  ZoneId,
} from './types';

export interface RareMaterialSpec {
  id: RareMaterialId;
  name: string;
  shortName: string;
  element: 'fire' | 'frost' | 'lightning' | 'poison' | 'dark_matter';
  rarity: 'epic' | 'mythic';
  zoneHint: string;
  sourceHint: string;
  accentHex: string;
  description: string;
}

export const RARE_MATERIAL_ORDER: RareMaterialId[] = [
  'pyrewood_heart',
  'brimstone_slag',
  'voltaic_core',
  'venom_resin',
  'void_timber',
  'dark_matter_ore',
];

export const RARE_MATERIAL_SPECS: Record<RareMaterialId, RareMaterialSpec> = {
  pyrewood_heart: {
    id: 'pyrewood_heart',
    name: 'Pyrewood Heartwood',
    shortName: 'Pyrewood',
    element: 'fire',
    rarity: 'epic',
    zoneHint: 'Zone 4 (Obsidian Caldera) & Zone 5',
    sourceHint: 'Felling Ember-Vein Pyrewood Trees',
    accentHex: '#f97316',
    description:
      'Smoldering volcanic timber veined with living magma embers that never cool, even in absolute-zero blizzards.',
  },
  brimstone_slag: {
    id: 'brimstone_slag',
    name: 'Infernal Brimstone Ore',
    shortName: 'Brimstone',
    element: 'fire',
    rarity: 'epic',
    zoneHint: 'Zone 4 (Obsidian Caldera)',
    sourceHint: 'Mining Infernal Brimstone Ore Veins',
    accentHex: '#ef4444',
    description:
      'Dense, fiery sulfurous metal crystallized inside deep caldera fissures. Essential for Hellfire weapons and armor.',
  },
  voltaic_core: {
    id: 'voltaic_core',
    name: 'Voltaic Fulminite Ore',
    shortName: 'Fulminite',
    element: 'lightning',
    rarity: 'epic',
    zoneHint: 'Zone 4 (Caldera) & Zone 5 (Starfall)',
    sourceHint: 'Mining Voltaic Fulminite Spires',
    accentHex: '#38bdf8',
    description:
      'High-voltage storm-quartz ore perpetually arcing with trapped supercell lightning.',
  },
  venom_resin: {
    id: 'venom_resin',
    name: 'Blight-Spore Venom Resin',
    shortName: 'Venom Resin',
    element: 'poison',
    rarity: 'epic',
    zoneHint: 'Zone 4 & Zone 5 Ancient Roots',
    sourceHint: 'Harvesting Rare Caldera & Starfall Trees/Ores',
    accentHex: '#22c55e',
    description:
      'Bioluminescent emerald neuro-resin distilled from abyssal permafrost flora and geothermal vents.',
  },
  void_timber: {
    id: 'void_timber',
    name: 'Astral Void-Heartwood',
    shortName: 'Void Timber',
    element: 'dark_matter',
    rarity: 'mythic',
    zoneHint: 'Zone 5 (Starfall Eternal Zero)',
    sourceHint: 'Felling Astral Void-Heartwood Trees',
    accentHex: '#a855f7',
    description:
      'Gravity-defying crystalline heartwood grown under fallen stars, resonating with cosmic dark-matter energy.',
  },
  dark_matter_ore: {
    id: 'dark_matter_ore',
    name: 'Singularity Dark-Matter Ore',
    shortName: 'Dark Matter',
    element: 'dark_matter',
    rarity: 'mythic',
    zoneHint: 'Zone 5 (Starfall Eternal Zero)',
    sourceHint: 'Mining Levitating Dark-Matter Monoliths',
    accentHex: '#d946ef',
    description:
      'A shard of compressed event-horizon matter that warps light and space around its wielder.',
  },
};

export interface MythicAscensionSpec {
  id: MythicAscensionId;
  name: string;
  subtitle: string;
  elementLabel: string;
  element: 'fire' | 'frost' | 'lightning' | 'poison' | 'dark_matter';
  rarity: 'mythic';
  primaryHex: string;
  secondaryHex: string;
  resourceCost: ResourceCounts;
  rareMaterialCost: Partial<RareMaterialMap>;
  bonuses: {
    damageMult: number;
    gatherYieldMult: number;
    moveSpeedMult: number;
    coldDecayMult: number;
    maxHpBonus: number;
    hpRegenPerSec: number;
    onHitEffectLabel: string;
    onHitBonusDamagePct: number;
  };
  visualSummary: string;
  description: string;
}

export const MYTHIC_ASCENSION_ORDER: MythicAscensionId[] = [
  'infernal_fire',
  'glacial_frost',
  'thunder_lightning',
  'venom_poison',
  'dark_matter',
];

export const MYTHIC_ASCENSION_SPECS: Record<MythicAscensionId, MythicAscensionSpec> = {
  infernal_fire: {
    id: 'infernal_fire',
    name: 'Hellfire Pyreheart Panoply',
    subtitle: 'Mythic Fire Visual Gear & Magma Weapons',
    elementLabel: 'INFERNAL FIRE',
    element: 'fire',
    rarity: 'mythic',
    primaryHex: '#f97316',
    secondaryHex: '#ef4444',
    resourceCost: {
      wood: 950,
      stone: 680,
      ice: 280,
      pelts: 85,
      meat: 60,
      gold: 4200,
    },
    rareMaterialCost: {
      pyrewood_heart: 18,
      brimstone_slag: 16,
      voltaic_core: 4,
    },
    bonuses: {
      damageMult: 1.55,
      gatherYieldMult: 1.35,
      moveSpeedMult: 1.16,
      coldDecayMult: 0.25,
      maxHpBonus: 90,
      hpRegenPerSec: 3.5,
      onHitEffectLabel: 'Ignites targets with searing Hellfire Nova (+32% burn burst)',
      onHitBonusDamagePct: 32,
    },
    visualSummary:
      'Wreathes your Barbarian in molten obsidian-gold magma plates, a blazing Hellfire Crown, orbiting fireballs, and a Molten Greataxe & Pyre Bow.',
    description:
      'Forged in the deepest magma vents of the Caldera. Grants near-complete immunity to freezing winds and turns every axe cleave and arrow into a volcanic eruption.',
  },
  glacial_frost: {
    id: 'glacial_frost',
    name: 'Absolute Zero Cryo-Aether Regalia',
    subtitle: 'Mythic Frost Visual Gear & Rime-Crystal Weapons',
    elementLabel: 'GLACIAL FROST',
    element: 'frost',
    rarity: 'mythic',
    primaryHex: '#38bdf8',
    secondaryHex: '#e0f2fe',
    resourceCost: {
      wood: 900,
      stone: 640,
      ice: 520,
      pelts: 90,
      meat: 55,
      gold: 4400,
    },
    rareMaterialCost: {
      pyrewood_heart: 10,
      voltaic_core: 12,
      void_timber: 8,
    },
    bonuses: {
      damageMult: 1.5,
      gatherYieldMult: 1.45,
      moveSpeedMult: 1.18,
      coldDecayMult: 0.18,
      maxHpBonus: 110,
      hpRegenPerSec: 4.0,
      onHitEffectLabel: 'Shatters targets with Absolute-Zero Rime Spikes (+30% cryo burst)',
      onHitBonusDamagePct: 30,
    },
    visualSummary:
      'Armors you in translucent diamond-ice pauldrons, a Sovereign Frost Halo, orbiting glacier icicles, and a Rime-Shatter Crystal Greataxe & Cryo Bow.',
    description:
      'Crystallized from the eternal zero of Starfall. You become one with the blizzard, regenerating vitality rapidly while shattering beasts and boulders alike.',
  },
  thunder_lightning: {
    id: 'thunder_lightning',
    name: 'Stormcaller Voltaic Aegis',
    subtitle: 'Mythic Lightning Visual Gear & Fulminite Weapons',
    elementLabel: 'THUNDER LIGHTNING',
    element: 'lightning',
    rarity: 'mythic',
    primaryHex: '#22d3ee',
    secondaryHex: '#facc15',
    resourceCost: {
      wood: 1050,
      stone: 750,
      ice: 360,
      pelts: 95,
      meat: 65,
      gold: 4800,
    },
    rareMaterialCost: {
      voltaic_core: 22,
      brimstone_slag: 10,
      void_timber: 6,
    },
    bonuses: {
      damageMult: 1.62,
      gatherYieldMult: 1.4,
      moveSpeedMult: 1.28,
      coldDecayMult: 0.35,
      maxHpBonus: 85,
      hpRegenPerSec: 3.2,
      onHitEffectLabel: 'Triggers high-voltage Chain-Lightning Arcs (+38% shock burst)',
      onHitBonusDamagePct: 38,
    },
    visualSummary:
      'Equips twin shoulder Tesla-Fulminite Coils, crackling 3D lightning arcs around your body, and a Thunderstrike Runic Greataxe & Stormbow.',
    description:
      'Harnesses raw supercell voltage from Voltaic Fulminite veins. Supercharges your movement speed and discharges devastating arcs on every strike.',
  },
  venom_poison: {
    id: 'venom_poison',
    name: 'Blightweaver Venom-Spore Shroud',
    subtitle: 'Mythic Poison Visual Gear & Viperfang Weapons',
    elementLabel: 'VENOM POISON',
    element: 'poison',
    rarity: 'mythic',
    primaryHex: '#22c55e',
    secondaryHex: '#a3e635',
    resourceCost: {
      wood: 1000,
      stone: 700,
      ice: 340,
      pelts: 110,
      meat: 85,
      gold: 4600,
    },
    rareMaterialCost: {
      venom_resin: 20,
      pyrewood_heart: 12,
      void_timber: 8,
    },
    bonuses: {
      damageMult: 1.58,
      gatherYieldMult: 1.5,
      moveSpeedMult: 1.22,
      coldDecayMult: 0.3,
      maxHpBonus: 105,
      hpRegenPerSec: 5.2,
      onHitEffectLabel: 'Inflicts corrosive Blight-Venom Dissolution (+35% acid burst + leech)',
      onHitBonusDamagePct: 35,
    },
    visualSummary:
      'Adorns your warrior with glowing emerald Viperfang Pauldrons, orbiting toxic spore spheres, acid miasma rings, and a Venomfang Cleaver & Viper Bow.',
    description:
      'Steeped in concentrated Blight-Spore Venom Resin. Dissolves armor, boosts harvest yields, and siphons life force into rapid regeneration.',
  },
  dark_matter: {
    id: 'dark_matter',
    name: 'Singularity Dark-Matter Ascendant',
    subtitle: 'Ultimate Mythic Cosmic Visual Gear & Event-Horizon Weapons',
    elementLabel: 'DARK MATTER SINGULARITY',
    element: 'dark_matter',
    rarity: 'mythic',
    primaryHex: '#d946ef',
    secondaryHex: '#7e22ce',
    resourceCost: {
      wood: 1650,
      stone: 1250,
      ice: 750,
      pelts: 160,
      meat: 120,
      gold: 8500,
    },
    rareMaterialCost: {
      pyrewood_heart: 16,
      brimstone_slag: 16,
      voltaic_core: 16,
      venom_resin: 16,
      void_timber: 24,
      dark_matter_ore: 24,
    },
    bonuses: {
      damageMult: 2.15,
      gatherYieldMult: 1.85,
      moveSpeedMult: 1.35,
      coldDecayMult: 0.08,
      maxHpBonus: 180,
      hpRegenPerSec: 7.5,
      onHitEffectLabel: 'Unleashes a gravitational Dark-Matter Singularity Collapse (+60% void burst)',
      onHitBonusDamagePct: 60,
    },
    visualSummary:
      'Manifests a levitating Black-Hole Singularity & relativistic Violet Accretion Disk behind your back, orbiting dark-matter spheres, Void-Horned Crown, and Event-Horizon Greataxe & Void Bow.',
    description:
      'The ultimate forbidden panoply of Xylar the Unknown. Bends space-time around your warrior, multiplying all combat damage, harvesting yields, and survival to godlike levels.',
  },
};

export interface MysteryShopItemSpec {
  id: MysteryShopItemId;
  name: string;
  subtitle: string;
  element: 'fire' | 'frost' | 'lightning' | 'poison' | 'dark_matter';
  rarity: 'mythic';
  accentHex: string;
  goldCost: number;
  rareMaterialCost: Partial<RareMaterialMap>;
  effectSummary: string;
  description: string;
  reward: {
    healHp: number;
    restoreWarmth: number;
    buffSeconds: number;
    bonusResources?: Partial<ResourceCounts>;
  };
}

export const MYSTERY_SHOP_ITEMS: Record<MysteryShopItemId, MysteryShopItemSpec> = {
  pyreheart_elixir: {
    id: 'pyreheart_elixir',
    name: 'Draught of the Undying Pyre',
    subtitle: 'Mythic Fire Overdrive Elixir',
    element: 'fire',
    rarity: 'mythic',
    accentHex: '#f97316',
    goldCost: 480,
    rareMaterialCost: {
      pyrewood_heart: 3,
      brimstone_slag: 3,
    },
    effectSummary: 'Full HP/Warmth + 180s Hellfire Brand & Hammer Temper Overdrive',
    description:
      'Bottled caldera magma fused with Pyrewood sap. Instantly restores full warmth and health while supercharging weapon strikes for 3 minutes.',
    reward: {
      healHp: 999,
      restoreWarmth: 999,
      buffSeconds: 180,
    },
  },
  absolute_zero_draught: {
    id: 'absolute_zero_draught',
    name: 'Crystalline Rime-Sovereign Vial',
    subtitle: 'Mythic Frost Resilience Phial',
    element: 'frost',
    rarity: 'mythic',
    accentHex: '#38bdf8',
    goldCost: 520,
    rareMaterialCost: {
      voltaic_core: 2,
      void_timber: 2,
    },
    effectSummary: 'Full HP/Warmth + 180s Cryo-Whetstone & Aurora Charm Aegis + 60 Ice',
    description:
      'Distilled liquid starlight and eternal ice. Grants 3 minutes of supreme frost edge, blizzard immunity, and 60 pure Ice Shards.',
    reward: {
      healHp: 999,
      restoreWarmth: 999,
      buffSeconds: 180,
      bonusResources: { ice: 60 },
    },
  },
  fulminite_capacitor: {
    id: 'fulminite_capacitor',
    name: 'Fulminite Storm-Core Injector',
    subtitle: 'Mythic Lightning Velocity Relic',
    element: 'lightning',
    rarity: 'mythic',
    accentHex: '#22d3ee',
    goldCost: 560,
    rareMaterialCost: {
      voltaic_core: 4,
      brimstone_slag: 2,
    },
    effectSummary: 'Full HP/Warmth + 210s Lightning Stride, Flint Quiver & Toolkit Surge',
    description:
      'Releases a controlled burst of storm-quartz voltage into your nervous system, maximizing movement speed and draw speed for 3.5 minutes.',
    reward: {
      healHp: 999,
      restoreWarmth: 999,
      buffSeconds: 210,
    },
  },
  blight_venom_vial: {
    id: 'blight_venom_vial',
    name: 'Alchemical Blight-Spore Transmutation',
    subtitle: 'Mythic Poison & Harvest Catalyst',
    element: 'poison',
    rarity: 'mythic',
    accentHex: '#22c55e',
    goldCost: 540,
    rareMaterialCost: {
      venom_resin: 4,
      pyrewood_heart: 2,
    },
    effectSummary: 'Grants +180 Wood, +120 Stone, +25 Pelts, +20 Meat & 180s All-Tool Buff',
    description:
      'Xylar’s forbidden bio-alchemical catalyst that multiplies raw organic and mineral matter while coating your weapons in corrosive venom.',
    reward: {
      healHp: 999,
      restoreWarmth: 999,
      buffSeconds: 180,
      bonusResources: { wood: 180, stone: 120, pelts: 25, meat: 20 },
    },
  },
  dark_matter_singularity: {
    id: 'dark_matter_singularity',
    name: 'Collapsed Singularity Reliquary',
    subtitle: 'Mythic Dark Matter Omnipotence Cache',
    element: 'dark_matter',
    rarity: 'mythic',
    accentHex: '#d946ef',
    goldCost: 1100,
    rareMaterialCost: {
      void_timber: 4,
      dark_matter_ore: 4,
    },
    effectSummary: '300s ALL Buffs Active + +300 Wood, +220 Stone, +120 Ice, +35 Pelts',
    description:
      'Cracks open a miniature pocket dimension of compressed Dark Matter, flooding your pack with high-tier resources and activating every combat & survival buff for 5 full minutes.',
    reward: {
      healHp: 999,
      restoreWarmth: 999,
      buffSeconds: 300,
      bonusResources: { wood: 300, stone: 220, ice: 120, pelts: 35, meat: 30 },
    },
  },
};

export const MYSTERY_SHOP_ITEM_ORDER: MysteryShopItemId[] = [
  'pyreheart_elixir',
  'absolute_zero_draught',
  'fulminite_capacitor',
  'blight_venom_vial',
  'dark_matter_singularity',
];

export function createInitialRareMaterials(): RareMaterialMap {
  return {
    pyrewood_heart: 0,
    brimstone_slag: 0,
    voltaic_core: 0,
    venom_resin: 0,
    void_timber: 0,
    dark_matter_ore: 0,
  };
}

export const createEmptyRareMaterials = createInitialRareMaterials;

export function sanitizeRareMaterials(raw: unknown): RareMaterialMap {
  const base = createInitialRareMaterials();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  for (const id of RARE_MATERIAL_ORDER) {
    const val = Number(obj[id]);
    base[id] = Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  }
  return base;
}

export function sanitizeMythicAscensionList(raw: unknown): MythicAscensionId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<MythicAscensionId>(MYTHIC_ASCENSION_ORDER);
  const out: MythicAscensionId[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && valid.has(item as MythicAscensionId)) {
      const id = item as MythicAscensionId;
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

export function sanitizeEquippedAscension(
  raw: unknown,
  unlocked: MythicAscensionId[],
): MythicAscensionId | null {
  if (typeof raw !== 'string') return null;
  if (unlocked.includes(raw as MythicAscensionId)) {
    return raw as MythicAscensionId;
  }
  return null;
}

export function totalRareMaterialsCount(materials: RareMaterialMap): number {
  let sum = 0;
  for (const id of RARE_MATERIAL_ORDER) {
    sum += materials[id] ?? 0;
  }
  return sum;
}

/**
 * Rolls rare material drops when felling a tree in Zone 4 or Zone 5 (or special rare tree kinds).
 */
export function rollRareTreeDrops(
  zone: ZoneId,
  treeKind: TreeKind,
  rng: () => number = Math.random,
): Partial<RareMaterialMap> {
  const drops: Partial<RareMaterialMap> = {};
  if (treeKind === 'pyrewood') {
    drops.pyrewood_heart = 1 + (rng() < 0.55 ? 1 : 0);
    if (rng() < 0.42) {
      drops.venom_resin = 1 + (rng() < 0.25 ? 1 : 0);
    }
    return drops;
  }
  if (treeKind === 'void_heartwood') {
    drops.void_timber = 1 + (rng() < 0.6 ? 1 : 0);
    if (rng() < 0.45) {
      drops.venom_resin = 1 + (rng() < 0.35 ? 1 : 0);
    }
    if (rng() < 0.28) {
      drops.pyrewood_heart = 1;
    }
    return drops;
  }

  // Elder trees in Zone 4 / Zone 5 also have a smaller chance to yield rare materials
  if (zone === 'level4' && treeKind === 'elder' && rng() < 0.35) {
    drops.pyrewood_heart = 1;
  } else if (zone === 'level5' && treeKind === 'elder' && rng() < 0.4) {
    drops.void_timber = 1;
  }
  return drops;
}

/**
 * Rolls rare ore drops when breaking a boulder/vein in Zone 4 or Zone 5.
 */
export function rollRareBoulderDrops(
  zone: ZoneId,
  boulderKind: BoulderKind,
  rng: () => number = Math.random,
): Partial<RareMaterialMap> {
  const drops: Partial<RareMaterialMap> = {};
  if (boulderKind === 'brimstone_ore') {
    drops.brimstone_slag = 1 + (rng() < 0.55 ? 1 : 0);
    if (rng() < 0.35) {
      drops.venom_resin = 1;
    }
    return drops;
  }
  if (boulderKind === 'voltaic_ore') {
    drops.voltaic_core = 1 + (rng() < 0.55 ? 1 : 0);
    if (zone === 'level4' && rng() < 0.3) {
      drops.brimstone_slag = 1;
    }
    if (zone === 'level5' && rng() < 0.3) {
      drops.dark_matter_ore = 1;
    }
    return drops;
  }
  if (boulderKind === 'dark_matter_ore') {
    drops.dark_matter_ore = 1 + (rng() < 0.6 ? 1 : 0);
    if (rng() < 0.4) {
      drops.voltaic_core = 1;
    }
    if (rng() < 0.35) {
      drops.venom_resin = 1;
    }
    return drops;
  }

  if (zone === 'level4' && rng() < 0.25) {
    drops.brimstone_slag = 1;
  } else if (zone === 'level5' && rng() < 0.3) {
    drops.dark_matter_ore = 1;
  }
  return drops;
}

export function addRareMaterialDrops(
  current: RareMaterialMap,
  drops: Partial<RareMaterialMap>,
): { next: RareMaterialMap; summaryParts: string[] } {
  const next: RareMaterialMap = { ...current };
  const summaryParts: string[] = [];
  for (const id of RARE_MATERIAL_ORDER) {
    const gain = Math.max(0, Math.round(drops[id] ?? 0));
    if (gain > 0) {
      next[id] = (next[id] ?? 0) + gain;
      summaryParts.push(`+${gain} ${RARE_MATERIAL_SPECS[id].shortName}`);
    }
  }
  return { next, summaryParts };
}

export function canUnlockMythicAscension(
  id: MythicAscensionId,
  resources: ResourceCounts,
  rareMaterials: RareMaterialMap,
  unlocked: MythicAscensionId[],
): boolean {
  if (unlocked.includes(id)) return false;
  const spec = MYTHIC_ASCENSION_SPECS[id];
  if (!spec) return false;

  const cost = spec.resourceCost;
  if (resources.wood < cost.wood) return false;
  if ((resources.stone ?? 0) < (cost.stone ?? 0)) return false;
  if ((resources.ice ?? 0) < (cost.ice ?? 0)) return false;
  if (resources.pelts < cost.pelts) return false;
  if ((resources.meat ?? 0) < (cost.meat ?? 0)) return false;
  if (resources.gold < cost.gold) return false;

  for (const matId of RARE_MATERIAL_ORDER) {
    const req = spec.rareMaterialCost[matId] ?? 0;
    if (req > 0 && (rareMaterials[matId] ?? 0) < req) {
      return false;
    }
  }
  return true;
}

export function unlockMythicAscension(
  id: MythicAscensionId,
  resources: ResourceCounts,
  rareMaterials: RareMaterialMap,
  unlocked: MythicAscensionId[],
): {
  unlocked: boolean;
  resources: ResourceCounts;
  rareMaterials: RareMaterialMap;
  unlockedAscensions: MythicAscensionId[];
  spec: MythicAscensionSpec;
} {
  const spec = MYTHIC_ASCENSION_SPECS[id];
  if (!canUnlockMythicAscension(id, resources, rareMaterials, unlocked)) {
    return {
      unlocked: false,
      resources,
      rareMaterials,
      unlockedAscensions: unlocked,
      spec,
    };
  }

  const cost = spec.resourceCost;
  const nextResources: ResourceCounts = {
    ...resources,
    wood: resources.wood - cost.wood,
    stone: (resources.stone ?? 0) - (cost.stone ?? 0),
    ice: (resources.ice ?? 0) - (cost.ice ?? 0),
    pelts: resources.pelts - cost.pelts,
    meat: (resources.meat ?? 0) - (cost.meat ?? 0),
    gold: resources.gold - cost.gold,
  };

  const nextRare: RareMaterialMap = { ...rareMaterials };
  for (const matId of RARE_MATERIAL_ORDER) {
    const req = spec.rareMaterialCost[matId] ?? 0;
    if (req > 0) {
      nextRare[matId] = Math.max(0, (nextRare[matId] ?? 0) - req);
    }
  }

  return {
    unlocked: true,
    resources: nextResources,
    rareMaterials: nextRare,
    unlockedAscensions: [...unlocked, id],
    spec,
  };
}

export function computeMythicAscensionBonuses(
  equipped: MythicAscensionId | null,
): MythicAscensionSpec['bonuses'] {
  if (!equipped || !MYTHIC_ASCENSION_SPECS[equipped]) {
    return {
      damageMult: 1,
      gatherYieldMult: 1,
      moveSpeedMult: 1,
      coldDecayMult: 1,
      maxHpBonus: 0,
      hpRegenPerSec: 0,
      onHitEffectLabel: 'None',
      onHitBonusDamagePct: 0,
    };
  }
  return MYTHIC_ASCENSION_SPECS[equipped].bonuses;
}

export function canBuyMysteryShopItem(
  id: MysteryShopItemId,
  resources: ResourceCounts,
  rareMaterials: RareMaterialMap,
): boolean {
  const spec = MYSTERY_SHOP_ITEMS[id];
  if (!spec) return false;
  if (resources.gold < spec.goldCost) return false;
  for (const matId of RARE_MATERIAL_ORDER) {
    const req = spec.rareMaterialCost[matId] ?? 0;
    if (req > 0 && (rareMaterials[matId] ?? 0) < req) {
      return false;
    }
  }
  return true;
}

export function buyMysteryShopItem(
  id: MysteryShopItemId,
  resources: ResourceCounts,
  rareMaterials: RareMaterialMap,
): {
  purchased: boolean;
  resources: ResourceCounts;
  rareMaterials: RareMaterialMap;
  spec: MysteryShopItemSpec;
} {
  const spec = MYSTERY_SHOP_ITEMS[id];
  if (!canBuyMysteryShopItem(id, resources, rareMaterials)) {
    return {
      purchased: false,
      resources,
      rareMaterials,
      spec,
    };
  }

  const bonus = spec.reward.bonusResources ?? {};
  const nextResources: ResourceCounts = {
    ...resources,
    gold: resources.gold - spec.goldCost,
    wood: resources.wood + (bonus.wood ?? 0),
    stone: (resources.stone ?? 0) + (bonus.stone ?? 0),
    ice: (resources.ice ?? 0) + (bonus.ice ?? 0),
    pelts: resources.pelts + (bonus.pelts ?? 0),
    meat: (resources.meat ?? 0) + (bonus.meat ?? 0),
  };

  const nextRare: RareMaterialMap = { ...rareMaterials };
  for (const matId of RARE_MATERIAL_ORDER) {
    const req = spec.rareMaterialCost[matId] ?? 0;
    if (req > 0) {
      nextRare[matId] = Math.max(0, (nextRare[matId] ?? 0) - req);
    }
  }

  return {
    purchased: true,
    resources: nextResources,
    rareMaterials: nextRare,
    spec,
  };
}
