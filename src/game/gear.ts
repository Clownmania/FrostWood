import { canAfford } from './economy';
import type {
  GearBonuses,
  GearLevels,
  GearSetBonusSpec,
  GearSlotId,
  GearTierSpec,
  GearTierStats,
  ResourceCounts,
  WingsOfFireSpec,
} from './types';

export const MAX_GEAR_TIER = 5;

export const GEAR_SLOT_ORDER: GearSlotId[] = ['coat', 'boots', 'gloves', 'pack'];

export const GEAR_SLOT_META: Record<
  GearSlotId,
  { label: string; role: string; statLabel: string }
> = {
  coat: {
    label: 'Winter Coat',
    role: 'Vitals & Frost Armor',
    statLabel: 'Max HP · Max Warmth · Cold Resist',
  },
  boots: {
    label: 'Arctic Boots',
    role: 'Mobility & Stealth',
    statLabel: 'Sprint Speed · Creep Speed',
  },
  gloves: {
    label: 'Fletcher Gloves',
    role: 'Offense & Cadence',
    statLabel: 'Attack Damage · Swing Speed',
  },
  pack: {
    label: 'Expedition Pack',
    role: 'Cargo & Magnet',
    statLabel: 'Backpack Capacity · Pickup Pull',
  },
};

export const GEAR_TIERS: Record<GearSlotId, GearTierSpec[]> = {
  coat: [
    {
      slot: 'coat',
      tier: 1,
      name: 'Wool Cloak',
      rarity: 'common',
      cost: { wood: 0, pelts: 0, gold: 0 },
      summary: '100 HP · 100 Warmth · Base Frost',
      description: 'Standard woven parka suited for clearing light snow.',
      stats: { maxHp: 100, maxWarmth: 100, coldDecayMult: 1.0 },
    },
    {
      slot: 'coat',
      tier: 2,
      name: 'Hare-Lined Parka',
      rarity: 'uncommon',
      cost: { wood: 30, pelts: 12, stone: 6, gold: 75, meat: 3 },
      summary: '135 HP · 125 Warmth · -28% Chill',
      description: 'Soft hare-pelt lining locks in hearth warmth.',
      stats: { maxHp: 135, maxWarmth: 125, coldDecayMult: 0.72 },
    },
    {
      slot: 'coat',
      tier: 3,
      name: 'Staghide Mantle',
      rarity: 'rare',
      cost: { wood: 82, pelts: 26, stone: 22, gold: 215, meat: 8 },
      summary: '180 HP · 155 Warmth · -48% Chill',
      description: 'Layered stag leather shrugs off biting ridge winds.',
      stats: { maxHp: 180, maxWarmth: 155, coldDecayMult: 0.52 },
    },
    {
      slot: 'coat',
      tier: 4,
      name: 'Wolf-Fur Greatcoat',
      rarity: 'epic',
      cost: { wood: 195, pelts: 52, stone: 48, ice: 12, gold: 520, meat: 16 },
      summary: '240 HP · 190 Warmth · -64% Chill',
      description: 'Predator-grade pelage stitched with glacial thread.',
      stats: { maxHp: 240, maxWarmth: 190, coldDecayMult: 0.36 },
    },
    {
      slot: 'coat',
      tier: 5,
      name: 'Aurora Sovereign Cloak',
      rarity: 'mythic',
      cost: { wood: 410, pelts: 95, stone: 98, ice: 34, gold: 1180, meat: 28 },
      summary: '320 HP · 240 Warmth · -78% Chill',
      description: 'Mythic star-woven cloak impervious to brutal highland blizzards.',
      stats: { maxHp: 320, maxWarmth: 240, coldDecayMult: 0.22 },
    },
  ],
  boots: [
    {
      slot: 'boots',
      tier: 1,
      name: 'Fur Mukluks',
      rarity: 'common',
      cost: { wood: 0, pelts: 0, gold: 0 },
      summary: '+0% Move · +0% Creep',
      description: 'Reliable rawhide boots stitched for valley snow.',
      stats: { moveSpeedMult: 1.0, creepSpeedMult: 1.0 },
    },
    {
      slot: 'boots',
      tier: 2,
      name: 'Snowshoe Treads',
      rarity: 'uncommon',
      cost: { wood: 32, pelts: 10, stone: 6, gold: 70, meat: 3 },
      summary: '+8% Move · +8% Creep',
      description: 'Ashwood frames distribute weight cleanly across powder.',
      stats: { moveSpeedMult: 1.08, creepSpeedMult: 1.08 },
    },
    {
      slot: 'boots',
      tier: 3,
      name: 'Glacial Crampons',
      rarity: 'rare',
      cost: { wood: 80, pelts: 24, stone: 24, gold: 195, meat: 7 },
      summary: '+16% Move · +16% Creep',
      description: 'Forged stone-tempered spikes bite deep into highland ice.',
      stats: { moveSpeedMult: 1.16, creepSpeedMult: 1.16 },
    },
    {
      slot: 'boots',
      tier: 4,
      name: 'Windstride Sabatons',
      rarity: 'epic',
      cost: { wood: 185, pelts: 48, stone: 50, ice: 12, gold: 490, meat: 15 },
      summary: '+25% Move · +24% Creep',
      description: 'Cryo-infused greaves that glide effortlessly over drifts.',
      stats: { moveSpeedMult: 1.25, creepSpeedMult: 1.24 },
    },
    {
      slot: 'boots',
      tier: 5,
      name: 'Aurora Striders',
      rarity: 'mythic',
      cost: { wood: 390, pelts: 88, stone: 96, ice: 32, gold: 1120, meat: 26 },
      summary: '+36% Move · +35% Creep',
      description: 'Mythic starlight boots leaving frostless steps in their wake.',
      stats: { moveSpeedMult: 1.36, creepSpeedMult: 1.35 },
    },
  ],
  gloves: [
    {
      slot: 'gloves',
      tier: 1,
      name: 'Wool Mittens',
      rarity: 'common',
      cost: { wood: 0, pelts: 0, gold: 0 },
      summary: '+0% Damage · Base Speed',
      description: 'Knit wool mittens keeping fingers nimble around the axe.',
      stats: { damageMult: 1.0, cooldownMult: 1.0 },
    },
    {
      slot: 'gloves',
      tier: 2,
      name: 'Trapper Gauntlets',
      rarity: 'uncommon',
      cost: { wood: 30, pelts: 11, stone: 6, gold: 75, meat: 3 },
      summary: '+12% Damage · 8% Faster Attacks',
      description: 'Supple reinforced leather steadies bow draws and axe arcs.',
      stats: { damageMult: 1.12, cooldownMult: 0.92 },
    },
    {
      slot: 'gloves',
      tier: 3,
      name: 'Runic Bracers',
      rarity: 'rare',
      cost: { wood: 84, pelts: 26, stone: 24, gold: 210, meat: 8 },
      summary: '+24% Damage · 15% Faster Attacks',
      description: 'Carved stone-rune guards amplify every cleave and shot.',
      stats: { damageMult: 1.24, cooldownMult: 0.85 },
    },
    {
      slot: 'gloves',
      tier: 4,
      name: 'Frostiron Grips',
      rarity: 'epic',
      cost: { wood: 190, pelts: 50, stone: 52, ice: 14, gold: 510, meat: 16 },
      summary: '+38% Damage · 22% Faster Attacks',
      description: 'Cryo-tempered gauntlets built for felling apex beasts.',
      stats: { damageMult: 1.38, cooldownMult: 0.78 },
    },
    {
      slot: 'gloves',
      tier: 5,
      name: 'Starfall Vambraces',
      rarity: 'mythic',
      cost: { wood: 400, pelts: 92, stone: 102, ice: 34, gold: 1150, meat: 28 },
      summary: '+55% Damage · 30% Faster Attacks',
      description: 'Mythic aurora vambraces unleashing blinding combat cadence.',
      stats: { damageMult: 1.55, cooldownMult: 0.7 },
    },
  ],
  pack: [
    {
      slot: 'pack',
      tier: 1,
      name: 'Canvas Haversack',
      rarity: 'common',
      cost: { wood: 0, pelts: 0, gold: 0 },
      summary: '+0 Pack Cap · +0m Magnet',
      description: 'Basic oiled canvas bag strapped behind your shoulders.',
      stats: { packCapacityBonus: 0, magnetRadiusBonus: 0 },
    },
    {
      slot: 'pack',
      tier: 2,
      name: 'Timber-Frame Pack',
      rarity: 'uncommon',
      cost: { wood: 36, pelts: 9, stone: 6, gold: 68 },
      summary: '+25 Pack Cap · +0.6m Magnet',
      description: 'Braced pine rack expands cargo load and pickup reach.',
      stats: { packCapacityBonus: 25, magnetRadiusBonus: 0.6 },
    },
    {
      slot: 'pack',
      tier: 3,
      name: 'Reinforced Sledpack',
      rarity: 'rare',
      cost: { wood: 88, pelts: 25, stone: 22, gold: 205, meat: 7 },
      summary: '+60 Pack Cap · +1.3m Magnet',
      description: 'Heavy-duty compartments built for deep forest hauls.',
      stats: { packCapacityBonus: 60, magnetRadiusBonus: 1.3 },
    },
    {
      slot: 'pack',
      tier: 4,
      name: 'Highland Vaultpack',
      rarity: 'epic',
      cost: { wood: 200, pelts: 52, stone: 54, ice: 12, gold: 500, meat: 15 },
      summary: '+110 Pack Cap · +2.1m Magnet',
      description: 'Frost-sealed courier pack with wide loot attraction.',
      stats: { packCapacityBonus: 110, magnetRadiusBonus: 2.1 },
    },
    {
      slot: 'pack',
      tier: 5,
      name: 'Dimensional Satchel',
      rarity: 'mythic',
      cost: { wood: 420, pelts: 96, stone: 105, ice: 34, gold: 1160, meat: 28 },
      summary: '+180 Pack Cap · +3.2m Magnet',
      description: 'Mythic aurora-bound satchel pulling harvests straight from afar.',
      stats: { packCapacityBonus: 180, magnetRadiusBonus: 3.2 },
    },
  ],
};

export const WINGS_OF_FIRE_TIERS: WingsOfFireSpec[] = [
  {
    tier: 0,
    name: 'Unawakened Mantle',
    subtitle: 'Complete Valkyra’s Daily Quest in Frostcave City',
    rarity: 'common',
    moveSpeedMult: 1.0,
    damageMult: 1.0,
    coldDecayMult: 1.0,
    maxHpBonus: 0,
    hpRegenBonus: 0,
    description:
      'Speak with Valkyra Emberwing in Frostcave City Plaza and complete her Daily Hunting Bounty to awaken the mythic Wings of Fire.',
  },
  {
    tier: 1,
    name: 'Emberwing Mantle',
    subtitle: 'Tier I Wings of Fire · Living Cinder Pinions',
    rarity: 'epic',
    moveSpeedMult: 1.14,
    damageMult: 1.18,
    coldDecayMult: 0.72,
    maxHpBonus: 35,
    hpRegenBonus: 1.2,
    description:
      'Blazing crimson-and-gold ember wings unfurl from your shoulders: +14% Move Speed, +18% Attack Damage, +35 Max HP, and -28% Freezing.',
  },
  {
    tier: 2,
    name: 'Solaris Phoenix Wings',
    subtitle: 'Tier II Wings of Fire · Twin Sunfire Pinions',
    rarity: 'mythic',
    moveSpeedMult: 1.24,
    damageMult: 1.32,
    coldDecayMult: 0.52,
    maxHpBonus: 75,
    hpRegenBonus: 2.5,
    description:
      'Broad phoenix wings of molten gold and solar fire: +24% Move Speed, +32% Attack Damage, +75 Max HP, and -48% Freezing.',
  },
  {
    tier: 3,
    name: 'Archon Wings of Fire',
    subtitle: 'Tier III Wings of Fire · Celestial Flame Seraph',
    rarity: 'mythic',
    moveSpeedMult: 1.35,
    damageMult: 1.5,
    coldDecayMult: 0.34,
    maxHpBonus: 120,
    hpRegenBonus: 4.2,
    description:
      'Ascendant 6-pinion Archon Wings of Fire wreathed in a spinning solar halo: +35% Move Speed, +50% Attack Damage, +120 Max HP, and -66% Freezing.',
  },
];

export function getWingsOfFireSpec(wingsTier: number): WingsOfFireSpec {
  const idx = Math.max(0, Math.min(WINGS_OF_FIRE_TIERS.length - 1, Math.floor(wingsTier)));
  return WINGS_OF_FIRE_TIERS[idx];
}

export const GEAR_SET_BONUSES: GearSetBonusSpec[] = [
  {
    minTier: 2,
    name: 'Outfitted Trapper',
    rarity: 'uncommon',
    gatherYieldMult: 1.08,
    goldTradeMult: 1.08,
    coldDecayMult: 0.92,
    hpRegenPerSec: 0,
    damageMult: 1.0,
    summary: '+8% Gather Yield · +8% Gold Trade · -8% Chill',
  },
  {
    minTier: 3,
    name: 'Alpine Pathfinder',
    rarity: 'rare',
    gatherYieldMult: 1.16,
    goldTradeMult: 1.15,
    coldDecayMult: 0.86,
    hpRegenPerSec: 0.8,
    damageMult: 1.05,
    summary: '+16% Gather · +15% Gold · -14% Chill · +0.8 HP/s · +5% Dmg',
  },
  {
    minTier: 4,
    name: 'Highland Vanguard',
    rarity: 'epic',
    gatherYieldMult: 1.26,
    goldTradeMult: 1.24,
    coldDecayMult: 0.78,
    hpRegenPerSec: 1.6,
    damageMult: 1.12,
    summary: '+26% Gather · +24% Gold · -22% Chill · +1.6 HP/s · +12% Dmg',
  },
  {
    minTier: 5,
    name: 'Aurora Champion',
    rarity: 'mythic',
    gatherYieldMult: 1.4,
    goldTradeMult: 1.35,
    coldDecayMult: 0.68,
    hpRegenPerSec: 2.8,
    damageMult: 1.25,
    summary: '+40% Gather · +35% Gold · -32% Chill · +2.8 HP/s · +25% Dmg',
  },
];

export const UNEQUIPPED_SLOT_STATS: Record<GearSlotId, GearTierStats> = {
  coat: { maxHp: 85, maxWarmth: 85, coldDecayMult: 1.15 },
  boots: { moveSpeedMult: 0.94, creepSpeedMult: 0.94 },
  gloves: { damageMult: 0.92, cooldownMult: 1.06 },
  pack: { packCapacityBonus: 0, magnetRadiusBonus: 0 },
};

export function createInitialGearLevels(): GearLevels {
  return {
    coat: 1,
    boots: 1,
    gloves: 1,
    pack: 1,
  };
}

export function clampGearTier(tier: number): number {
  return Math.max(1, Math.min(MAX_GEAR_TIER, Math.floor(tier)));
}

export function clampEquippedGearTier(tier: number): number {
  return Math.max(0, Math.min(MAX_GEAR_TIER, Math.floor(tier)));
}

export function getGearSlotSpec(slot: GearSlotId, tier: number): GearTierSpec {
  const table = GEAR_TIERS[slot];
  const idx = clampGearTier(tier) - 1;
  return table[idx];
}

export function getNextGearUpgrade(slot: GearSlotId, unlockedGear: GearLevels): GearTierSpec | null {
  const current = clampGearTier(unlockedGear[slot] ?? 1);
  if (current >= MAX_GEAR_TIER) return null;
  return GEAR_TIERS[slot][current];
}

export function unequipGearSlot(equipped: GearLevels, slot: GearSlotId): GearLevels {
  return {
    ...equipped,
    [slot]: 0,
  };
}

export function equipGearSlot(
  equipped: GearLevels,
  unlocked: GearLevels,
  slot: GearSlotId,
  tier?: number,
): GearLevels {
  const ownedTier = clampGearTier(unlocked[slot] ?? 1);
  const chosenTier = tier !== undefined ? Math.min(ownedTier, clampGearTier(tier)) : ownedTier;
  return {
    ...equipped,
    [slot]: chosenTier,
  };
}

export function getMinimumGearTier(gear: GearLevels): number {
  let minTier = MAX_GEAR_TIER;
  for (const slot of GEAR_SLOT_ORDER) {
    minTier = Math.min(minTier, clampEquippedGearTier(gear[slot] ?? 0));
  }
  return minTier;
}

export function computeGearSetBonus(gear: GearLevels): GearSetBonusSpec | null {
  const minTier = getMinimumGearTier(gear);
  let matched: GearSetBonusSpec | null = null;
  for (const bonus of GEAR_SET_BONUSES) {
    if (minTier >= bonus.minTier) {
      matched = bonus;
    }
  }
  return matched;
}

export function getNextGearSetBonus(gear: GearLevels): GearSetBonusSpec | null {
  const minTier = getMinimumGearTier(gear);
  for (const bonus of GEAR_SET_BONUSES) {
    if (minTier < bonus.minTier) {
      return bonus;
    }
  }
  return null;
}

function getEffectiveSlotStats(slot: GearSlotId, tier: number): GearTierStats {
  const clamped = clampEquippedGearTier(tier);
  if (clamped <= 0) return UNEQUIPPED_SLOT_STATS[slot];
  return getGearSlotSpec(slot, clamped).stats;
}

export function computeGearBonuses(gear: GearLevels): GearBonuses {
  const coatStats = getEffectiveSlotStats('coat', gear.coat);
  const bootsStats = getEffectiveSlotStats('boots', gear.boots);
  const glovesStats = getEffectiveSlotStats('gloves', gear.gloves);
  const packStats = getEffectiveSlotStats('pack', gear.pack);
  const setBonus = computeGearSetBonus(gear);
  const minTier = getMinimumGearTier(gear);

  const coatCold = coatStats.coldDecayMult ?? 1.0;
  const setCold = setBonus?.coldDecayMult ?? 1.0;
  const gloveDmg = glovesStats.damageMult ?? 1.0;
  const setDmg = setBonus?.damageMult ?? 1.0;

  return {
    maxHp: coatStats.maxHp ?? 85,
    maxWarmth: coatStats.maxWarmth ?? 85,
    coldDecayMult: Number((coatCold * setCold).toFixed(3)),
    moveSpeedMult: bootsStats.moveSpeedMult ?? 0.94,
    creepSpeedMult: bootsStats.creepSpeedMult ?? 0.94,
    damageMult: Number((gloveDmg * setDmg).toFixed(3)),
    cooldownMult: glovesStats.cooldownMult ?? 1.06,
    packCapacityBonus: packStats.packCapacityBonus ?? 0,
    magnetRadiusBonus: packStats.magnetRadiusBonus ?? 0,
    gatherYieldMult: setBonus?.gatherYieldMult ?? 1.0,
    goldTradeMult: setBonus?.goldTradeMult ?? 1.0,
    hpRegenPerSec: setBonus?.hpRegenPerSec ?? 0,
    setTier: minTier,
  };
}

export function canUpgradeGearSlot(
  resources: ResourceCounts,
  unlockedGear: GearLevels,
  slot: GearSlotId,
): boolean {
  const next = getNextGearUpgrade(slot, unlockedGear);
  if (!next) return false;
  return canAfford(resources, next.cost);
}
