import type {
  ActiveCraftBuffs,
  BuildingId,
  BuildingSpec,
  DailyObjective,
  ObjectiveMetric,
  ResourceCounts,
  RunStats,
  ToolSpec,
  ToolUpgradeId,
  UpgradeLevels,
  WeatherKind,
  ZoneId,
  ZoneWeatherEffectState,
  ZoneWeatherSeverity,
} from './types';
import { getFestivalBuildingSpec } from './events';
import { TAMING_PEN_TIERS } from './pets';
import { STORM_SHELTER_TIERS } from './shelter';
import {
  computeNightFactor,
  computeTemperatureDecayMultiplier,
} from './daynight';

export const AXE_TIERS: ToolSpec[] = [
  {
    level: 1,
    name: 'Stone Hatchet',
    rarity: 'common',
    power: 25,
    cooldown: 0.42,
    range: 3.1,
    cost: { wood: 0, pelts: 0, gold: 0 },
    description: 'Reliable starter hatchet for young pines.',
  },
  {
    level: 2,
    name: 'Iron Woodaxe',
    rarity: 'common',
    power: 45,
    cooldown: 0.36,
    range: 3.4,
    cost: { wood: 32, pelts: 6, gold: 65 },
    description: '+80% chop power & twin-edge iron bit.',
  },
  {
    level: 3,
    name: 'Tempered Broadaxe',
    rarity: 'uncommon',
    power: 75,
    cooldown: 0.31,
    range: 3.8,
    cost: { wood: 95, pelts: 16, stone: 12, gold: 185, meat: 4 },
    description: 'Bearded Nordic steel cleaves heavy Frostwood trunks.',
  },
  {
    level: 4,
    name: 'Frostforged Greataxe',
    rarity: 'rare',
    power: 120,
    cooldown: 0.27,
    range: 4.3,
    cost: { wood: 210, pelts: 34, stone: 30, ice: 6, gold: 440, meat: 10 },
    description: 'Runed glacial edge with glowing frost core.',
  },
  {
    level: 5,
    name: 'Stormcleaver Battleaxe',
    rarity: 'epic',
    power: 175,
    cooldown: 0.24,
    range: 4.6,
    cost: { wood: 360, pelts: 56, stone: 58, ice: 16, gold: 780, meat: 18 },
    description: 'Epic double-bitted storm-blade that splits timber & hides alike.',
  },
  {
    level: 6,
    name: 'Glacierbane Halberd',
    rarity: 'epic',
    power: 245,
    cooldown: 0.21,
    range: 4.9,
    cost: { wood: 560, pelts: 86, stone: 95, ice: 32, gold: 1280, meat: 28 },
    description: 'Crowned halberd poleaxe wreathed in a spinning frost halo.',
  },
  {
    level: 7,
    name: 'Aurora Worldsplitter',
    rarity: 'mythic',
    power: 340,
    cooldown: 0.18,
    range: 5.3,
    cost: { wood: 850, pelts: 130, stone: 145, ice: 55, gold: 2100, meat: 42 },
    description: 'Mythic star-ice greataxe radiating northern fire & sweeping cleaves.',
  },
];

export const BOW_TIERS: ToolSpec[] = [
  {
    level: 1,
    name: 'Ashwood Bow',
    rarity: 'common',
    power: 25,
    cooldown: 0.52,
    range: 18,
    cost: { wood: 0, pelts: 0, gold: 0 },
    description: 'Crisp shortbow for hares & stags.',
  },
  {
    level: 2,
    name: 'Sinew Recurve',
    rarity: 'common',
    power: 45,
    cooldown: 0.43,
    range: 22,
    cost: { wood: 40, pelts: 9, gold: 85, meat: 2 },
    description: 'Swept horn-tipped limbs & wolf-stopping power.',
  },
  {
    level: 3,
    name: 'Steel Crossbow',
    rarity: 'uncommon',
    power: 75,
    cooldown: 0.36,
    range: 26,
    cost: { wood: 105, pelts: 22, stone: 14, gold: 220, meat: 6 },
    description: 'Reinforced prod & piercing bolts drop timber wolves swiftly.',
  },
  {
    level: 4,
    name: 'Runic Longbow',
    rarity: 'rare',
    power: 125,
    cooldown: 0.3,
    range: 30,
    cost: { wood: 220, pelts: 40, stone: 34, ice: 8, gold: 510, meat: 12 },
    description: 'Carved rune stave with glowing crystal stabilizers.',
  },
  {
    level: 5,
    name: 'Frostwind Compound',
    rarity: 'epic',
    power: 185,
    cooldown: 0.25,
    range: 36,
    cost: { wood: 380, pelts: 64, stone: 62, ice: 18, gold: 860, meat: 20 },
    description: 'Epic cam-strung tundra bow firing hyper-velocity frost shafts.',
  },
  {
    level: 6,
    name: 'Glacierbane Repeater',
    rarity: 'epic',
    power: 260,
    cooldown: 0.21,
    range: 42,
    cost: { wood: 590, pelts: 95, stone: 100, ice: 34, gold: 1380, meat: 30 },
    description: 'Twin-limbed siege bow wreathed in a spinning cryo-aura ring.',
  },
  {
    level: 7,
    name: 'Starfall Greatbow',
    rarity: 'mythic',
    power: 365,
    cooldown: 0.17,
    range: 48,
    cost: { wood: 900, pelts: 140, stone: 155, ice: 60, gold: 2300, meat: 45 },
    description: 'Mythic aurora-crystal warbow firing blazing starlight bolts.',
  },
];

export const COAT_TIERS: ToolSpec[] = [
  {
    level: 1,
    name: 'Wool Cloak',
    rarity: 'common',
    power: 100, // maxHP
    cooldown: 1.0, // cold resistance multiplier (lower = slower chill)
    range: 100, // maxWarmth
    cost: { wood: 0, pelts: 0, gold: 0 },
    description: '100 HP · Standard winter warmth.',
  },
  {
    level: 2,
    name: 'Hare-Lined Parka',
    rarity: 'common',
    power: 135,
    cooldown: 0.72,
    range: 125,
    cost: { wood: 28, pelts: 12, gold: 75, meat: 3 },
    description: '135 HP · +28% frost resistance.',
  },
  {
    level: 3,
    name: 'Staghide Mantle',
    rarity: 'rare',
    power: 175,
    cooldown: 0.5,
    range: 150,
    cost: { wood: 75, pelts: 26, stone: 16, gold: 220, meat: 8 },
    description: '175 HP · +50% frost resistance.',
  },
  {
    level: 4,
    name: 'Wolf-Fur Greatcoat',
    rarity: 'epic',
    power: 230,
    cooldown: 0.32,
    range: 185,
    cost: { wood: 175, pelts: 52, stone: 38, ice: 10, gold: 520, meat: 16 },
    description: '230 HP · Master Arctic insulation.',
  },
];

export const CABIN_TIERS: BuildingSpec[] = [
  {
    level: 1,
    name: 'Trapper Tent',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 8.5,
    description: 'Humble shelter around your campfire.',
  },
  {
    level: 2,
    name: 'Timber Cabin',
    cost: { wood: 65, pelts: 12, stone: 8, gold: 120, meat: 4 },
    woodPerSec: 0.25,
    goldPerSec: 0.4,
    warmthRadius: 11,
    description: 'Sturdy hearth cabin. +0.25 Wood/s & +0.4 Gold/s.',
  },
  {
    level: 3,
    name: 'Alpine Homestead',
    cost: { wood: 175, pelts: 32, stone: 28, gold: 340, meat: 10 },
    woodPerSec: 0.6,
    goldPerSec: 1.1,
    warmthRadius: 13.5,
    description: 'Two-story lodge with stone chimney & warm porch.',
  },
  {
    level: 4,
    name: 'Frostwood Manor',
    cost: { wood: 380, pelts: 65, stone: 70, ice: 14, gold: 820, meat: 22 },
    woodPerSec: 1.2,
    goldPerSec: 2.2,
    warmthRadius: 16,
    description: 'Grand timber manor. Strong passive income.',
  },
  {
    level: 5,
    name: 'Grand Winter Lodge',
    cost: { wood: 780, pelts: 125, stone: 150, ice: 40, gold: 1950, meat: 40 },
    woodPerSec: 2.4,
    goldPerSec: 4.5,
    warmthRadius: 20,
    description: 'Apex frontier estate. Completes the Tycoon Empire!',
  },
];

export const LUMBER_CAMP_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Lumberjack Camp',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Set up a chopping camp for steady passive wood.',
  },
  {
    level: 1,
    name: 'Lumberjack Camp',
    cost: { wood: 32, pelts: 4, gold: 55, meat: 2 },
    woodPerSec: 0.35,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Rustic chopping camp. Passively generates +0.35 Wood/s.',
  },
  {
    level: 2,
    name: 'Forester Outpost',
    cost: { wood: 95, pelts: 14, stone: 18, gold: 165, meat: 5 },
    woodPerSec: 0.75,
    goldPerSec: 0.2,
    warmthRadius: 0,
    description: 'Adds 1 AI Woodcutter & +0.75 Wood/s passive yield.',
  },
  {
    level: 3,
    name: 'Timber Syndicate',
    cost: { wood: 220, pelts: 34, stone: 48, ice: 8, gold: 420, meat: 12 },
    woodPerSec: 1.35,
    goldPerSec: 0.5,
    warmthRadius: 0,
    description: 'Master woodcutting camp. +1.35 Wood/s & +0.5 Gold/s.',
  },
  {
    level: 4,
    name: 'Frostwood Timber Guild',
    cost: { wood: 460, pelts: 68, stone: 95, ice: 22, gold: 920, meat: 24 },
    woodPerSec: 2.4,
    goldPerSec: 1.2,
    warmthRadius: 5,
    description: '2 AI Woodcutters, heated log yard, +2.4 Wood/s & +1.2 Gold/s.',
  },
];

export const SAWMILL_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Sawmill',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Hire an AI Lumberjack & automate timber.',
  },
  {
    level: 1,
    name: 'Water-Saw Shed',
    cost: { wood: 55, pelts: 8, stone: 12, gold: 105, meat: 3 },
    woodPerSec: 0.65,
    goldPerSec: 0.3,
    warmthRadius: 0,
    description: 'Spawns 1 AI Lumberjack worker + 0.65 Wood/s.',
  },
  {
    level: 2,
    name: 'Twin-Blade Mill',
    cost: { wood: 145, pelts: 22, stone: 34, gold: 280, meat: 8 },
    woodPerSec: 1.5,
    goldPerSec: 0.8,
    warmthRadius: 0,
    description: 'Spawns 2 AI Lumberjacks + 1.5 Wood/s.',
  },
  {
    level: 3,
    name: 'Steam Lumberworks',
    cost: { wood: 320, pelts: 46, stone: 75, ice: 14, gold: 660, meat: 18 },
    woodPerSec: 3.1,
    goldPerSec: 1.6,
    warmthRadius: 4,
    description: '3 AI Lumberjacks + massive automated timber yield.',
  },
  {
    level: 4,
    name: 'Clockwork Frost-Sawmill',
    cost: { wood: 640, pelts: 88, stone: 145, ice: 34, gold: 1380, meat: 32 },
    woodPerSec: 5.5,
    goldPerSec: 3.2,
    warmthRadius: 7,
    description: '4 AI Lumberjacks + overdrive twin-turbine timber mill (+5.5 Wood/s).',
  },
];

export const TANNERY_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Tannery',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Cure pelts for trade & hire an AI Trapper.',
  },
  {
    level: 1,
    name: 'Furrier Rack',
    cost: { wood: 48, pelts: 12, gold: 95, meat: 3 },
    woodPerSec: 0,
    goldPerSec: 1.1,
    warmthRadius: 0,
    description: 'Spawns 1 AI Hunter & +1.1 Gold/s passive trade.',
  },
  {
    level: 2,
    name: 'Guild Tannery',
    cost: { wood: 125, pelts: 28, stone: 24, gold: 265, meat: 8 },
    woodPerSec: 0,
    goldPerSec: 2.5,
    warmthRadius: 0,
    description: '+40% pelt sale value & +2.5 Gold/s.',
  },
  {
    level: 3,
    name: 'Royal Fur Trading Post',
    cost: { wood: 285, pelts: 58, stone: 60, ice: 12, gold: 640, meat: 18 },
    woodPerSec: 0,
    goldPerSec: 5.0,
    warmthRadius: 0,
    description: '2 AI Hunters, +80% pelt value & +5.0 Gold/s.',
  },
  {
    level: 4,
    name: 'Imperial Fur Exchange',
    cost: { wood: 580, pelts: 115, stone: 120, ice: 28, gold: 1320, meat: 34 },
    woodPerSec: 0,
    goldPerSec: 9.2,
    warmthRadius: 6,
    description: '3 AI Hunters, +125% pelt value & +9.2 Gold/s.',
  },
];

export const FORGE_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Forge',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Smelt winter iron & project warmth across camp.',
  },
  {
    level: 1,
    name: 'Anvil Hearth',
    cost: { wood: 70, pelts: 12, stone: 18, gold: 145, meat: 4 },
    woodPerSec: 0.2,
    goldPerSec: 0.8,
    warmthRadius: 9,
    description: 'Extends camp warmth aura & +15% harvest yield.',
  },
  {
    level: 2,
    name: 'Frostiron Smithy',
    cost: { wood: 175, pelts: 30, stone: 45, ice: 6, gold: 380, meat: 10 },
    woodPerSec: 0.45,
    goldPerSec: 2.0,
    warmthRadius: 12,
    description: 'Warms outer clearing & +30% harvest yield.',
  },
  {
    level: 3,
    name: 'Beacon Watchforge',
    cost: { wood: 360, pelts: 62, stone: 90, ice: 20, gold: 860, meat: 22 },
    woodPerSec: 0.9,
    goldPerSec: 4.2,
    warmthRadius: 16,
    description: 'Towering signal brazier wards off wolves near camp.',
  },
  {
    level: 4,
    name: 'Starfire Runeforge',
    cost: { wood: 720, pelts: 120, stone: 175, ice: 44, gold: 1750, meat: 42 },
    woodPerSec: 1.8,
    goldPerSec: 7.8,
    warmthRadius: 21,
    description: 'Starfire crucible projects 21m warmth & +60% harvest yield.',
  },
];

export const WATCHTOWER_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Watchtower',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    windResistanceBonusPct: 0,
    description: 'Erect a frontier lookout spire to scout timberlines & guide trade.',
  },
  {
    level: 1,
    name: 'Timber Scout Lookout',
    cost: { wood: 38, pelts: 6, stone: 10, gold: 75, meat: 2 },
    woodPerSec: 0.35,
    goldPerSec: 0.65,
    warmthRadius: 9,
    windResistanceBonusPct: 12,
    description: 'Elevated pine lookout tower (+0.35 Wood/s, +0.65 Gold/s & +12% Wind Resist).',
  },
  {
    level: 2,
    name: 'Ranger Signal Spire',
    cost: { wood: 110, pelts: 18, stone: 32, ice: 4, gold: 220, meat: 6 },
    woodPerSec: 0.85,
    goldPerSec: 1.75,
    warmthRadius: 13,
    windResistanceBonusPct: 24,
    description: 'Stone-buttressed signal beacon (+0.85 Wood/s, +1.75 Gold/s & +24% Wind Resist).',
  },
  {
    level: 3,
    name: 'Aurora Falconry Citadel',
    cost: { wood: 260, pelts: 44, stone: 72, ice: 16, gold: 560, meat: 14 },
    woodPerSec: 1.8,
    goldPerSec: 4.1,
    warmthRadius: 17,
    windResistanceBonusPct: 38,
    description: 'Highland falconry spire with aurora lens (+1.8 Wood/s, +4.1 Gold/s & +38% Wind Resist).',
  },
];

export const GRAND_GRANARY_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Smokehouse',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    heatRetentionBonusPct: 0,
    description: 'Cure venison & store frontier provisions for passive gold & warmth.',
  },
  {
    level: 1,
    name: 'Trapper Smokehouse',
    cost: { wood: 42, pelts: 8, stone: 12, gold: 85, meat: 4 },
    woodPerSec: 0.2,
    goldPerSec: 0.95,
    warmthRadius: 10,
    heatRetentionBonusPct: 14,
    description: 'Hickory-smoke curing shed (+0.95 Gold/s, +15% trade value & +14% Heat Retention).',
  },
  {
    level: 2,
    name: 'Provision Granary',
    cost: { wood: 125, pelts: 22, stone: 36, ice: 6, gold: 250, meat: 10 },
    woodPerSec: 0.5,
    goldPerSec: 2.35,
    warmthRadius: 14,
    heatRetentionBonusPct: 28,
    description: 'Insulated stone storehouse (+2.35 Gold/s, +30% trade value & +28% Heat Retention).',
  },
  {
    level: 3,
    name: 'Royal Feast Smokehouse',
    cost: { wood: 290, pelts: 50, stone: 80, ice: 18, gold: 620, meat: 22 },
    woodPerSec: 1.1,
    goldPerSec: 5.4,
    warmthRadius: 18,
    heatRetentionBonusPct: 44,
    description: 'Grand provision hall (+5.4 Gold/s, +50% trade value & +44% Heat Retention).',
  },
];

export const WINDBREAK_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Windbreak',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    windResistanceBonusPct: 0,
    description: 'Construct wind-resistant baffles to counter zone gale movement penalties.',
  },
  {
    level: 1,
    name: 'Timber Windbreak Palisade',
    cost: { wood: 24, pelts: 3, stone: 6, gold: 45 },
    woodPerSec: 0.15,
    goldPerSec: 0.3,
    warmthRadius: 8,
    windResistanceBonusPct: 26,
    description: 'Angled pine palisade baffles crosswinds (+26% Wind Resistance · counters L1-L2 gale drag).',
  },
  {
    level: 2,
    name: 'Granite Baffle Wall',
    cost: { wood: 75, pelts: 12, stone: 24, ice: 4, gold: 160 },
    woodPerSec: 0.35,
    goldPerSec: 0.9,
    warmthRadius: 11,
    windResistanceBonusPct: 52,
    description: 'Buttressed granite wind-wall & trail screens (+52% Wind Resistance · counters L3-L4 squalls).',
  },
  {
    level: 3,
    name: 'Aero-Runed Tempest Barrier',
    cost: { wood: 190, pelts: 32, stone: 58, ice: 16, gold: 440 },
    woodPerSec: 0.7,
    goldPerSec: 2.2,
    warmthRadius: 15,
    windResistanceBonusPct: 78,
    description: 'Runed aerodynamic monoliths channel katabatic gales into tailwinds (+78% Wind Resistance).',
  },
];

export const THERMAL_CONDUIT_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Thermal Conduit',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    heatRetentionBonusPct: 0,
    description: 'Build heat-retaining geothermal ducts to prevent freezing harvest penalties.',
  },
  {
    level: 1,
    name: 'Brazier Heat-Ducts',
    cost: { wood: 26, pelts: 4, stone: 8, gold: 50 },
    woodPerSec: 0.15,
    goldPerSec: 0.4,
    warmthRadius: 10,
    heatRetentionBonusPct: 26,
    description: 'Copper-lined stone ducts retain hearth heat (+26% Heat Retention · +12% harvest yield).',
  },
  {
    level: 2,
    name: 'Geothermal Steam Conduit',
    cost: { wood: 80, pelts: 14, stone: 28, ice: 5, gold: 175 },
    woodPerSec: 0.4,
    goldPerSec: 1.1,
    warmthRadius: 14,
    heatRetentionBonusPct: 52,
    description: 'Pressurized geothermal pipes warm Waystation Braziers (+52% Heat Retention · +24% harvest yield).',
  },
  {
    level: 3,
    name: 'Solaris Hearth Core',
    cost: { wood: 210, pelts: 36, stone: 64, ice: 18, gold: 480 },
    woodPerSec: 0.85,
    goldPerSec: 2.6,
    warmthRadius: 19,
    heatRetentionBonusPct: 78,
    description: 'Radiant geothermal core keeps tools & hands nimble in sub-zero vortices (+78% Heat Retention · +36% harvest yield).',
  },
];

export const INITIAL_RESOURCES: ResourceCounts = {
  wood: 0,
  pelts: 0,
  stone: 0,
  ice: 0,
  meat: 0,
  gold: 20,
};

export const INITIAL_LEVELS: UpgradeLevels = {
  axe: 1,
  bow: 1,
  coat: 1,
  cabin: 1,
  lumberCamp: 0,
  sawmill: 0,
  tannery: 0,
  forge: 0,
  tamingPen: 0,
  stormShelter: 0,
  windbreak: 0,
  thermalConduit: 0,
  watchtower: 0,
  grandGranary: 0,
  festivalPavilion: 0,
  iceMonument: 0,
};

export const INITIAL_STATS: RunStats = {
  woodHarvested: 0,
  peltsCollected: 0,
  goldEarned: 0,
  treesFelled: 0,
  animalsHunted: 0,
  wolvesSlain: 0,
  completedObjectives: 0,
  elapsedSeconds: 0,
};

export function getAxeSpec(level: number): ToolSpec {
  return AXE_TIERS[Math.max(0, Math.min(AXE_TIERS.length - 1, level - 1))];
}

export function getBowSpec(level: number): ToolSpec {
  return BOW_TIERS[Math.max(0, Math.min(BOW_TIERS.length - 1, level - 1))];
}

export function getCoatSpec(level: number): ToolSpec {
  return COAT_TIERS[Math.max(0, Math.min(COAT_TIERS.length - 1, level - 1))];
}

export function getBuildingSpec(id: BuildingId, level: number): BuildingSpec {
  const table = getBuildingTable(id);
  const exact = table.find((spec) => spec.level === level);
  if (exact) return exact;
  return level <= table[0].level ? table[0] : table[table.length - 1];
}

export function getBuildingTable(id: BuildingId): BuildingSpec[] {
  switch (id) {
    case 'cabin':
      return CABIN_TIERS.map((s) => ({
        ...s,
        windResistanceBonusPct: s.level * 3,
        heatRetentionBonusPct: s.level * 4,
      }));
    case 'lumberCamp':
      return LUMBER_CAMP_TIERS.map((s) => ({
        ...s,
        windResistanceBonusPct: s.level * 3,
      }));
    case 'sawmill':
      return SAWMILL_TIERS;
    case 'tannery':
      return TANNERY_TIERS;
    case 'forge':
      return FORGE_TIERS.map((s) => ({
        ...s,
        heatRetentionBonusPct: s.level * 9,
      }));
    case 'tamingPen':
      return TAMING_PEN_TIERS;
    case 'stormShelter':
      return STORM_SHELTER_TIERS.map((s) => ({
        level: s.level,
        name: s.name,
        cost: s.cost,
        woodPerSec: 0,
        goldPerSec: 0,
        warmthRadius: 0,
        windResistanceBonusPct: s.level * 8,
        description: s.description,
      }));
    case 'windbreak':
      return WINDBREAK_TIERS;
    case 'thermalConduit':
      return THERMAL_CONDUIT_TIERS;
    case 'watchtower':
      return WATCHTOWER_TIERS;
    case 'grandGranary':
      return GRAND_GRANARY_TIERS;
  }
}

export function getNextToolUpgrade(
  id: ToolUpgradeId,
  levels: UpgradeLevels,
): ToolSpec | null {
  const current = levels[id];
  const table = id === 'axe' ? AXE_TIERS : id === 'bow' ? BOW_TIERS : COAT_TIERS;
  if (current >= table.length) return null;
  return table[current]; // 0-indexed next level (level N is at index N-1, so level current+1 is at index current)
}

export function getNextBuildingUpgrade(
  id: BuildingId,
  levels: UpgradeLevels,
): BuildingSpec | null {
  const current = levels[id] ?? 0;
  const table = getBuildingTable(id);
  const maxLevel = table[table.length - 1].level;
  if (current >= maxLevel) return null;
  const nextIdx = table.findIndex((spec) => spec.level === current + 1);
  return nextIdx >= 0 ? table[nextIdx] : null;
}

export function canAfford(resources: ResourceCounts, cost: ResourceCounts): boolean {
  return (
    resources.wood >= cost.wood &&
    resources.pelts >= cost.pelts &&
    (resources.stone ?? 0) >= (cost.stone ?? 0) &&
    (resources.ice ?? 0) >= (cost.ice ?? 0) &&
    (resources.meat ?? 0) >= (cost.meat ?? 0) &&
    resources.gold >= cost.gold
  );
}

export function spendResources(
  resources: ResourceCounts,
  cost: ResourceCounts,
): ResourceCounts | null {
  if (!canAfford(resources, cost)) return null;
  const next: ResourceCounts = {
    wood: resources.wood - cost.wood,
    pelts: resources.pelts - cost.pelts,
    gold: resources.gold - cost.gold,
  };
  if (resources.stone !== undefined || (cost.stone ?? 0) > 0) {
    next.stone = (resources.stone ?? 0) - (cost.stone ?? 0);
  }
  if (resources.ice !== undefined || (cost.ice ?? 0) > 0) {
    next.ice = (resources.ice ?? 0) - (cost.ice ?? 0);
  }
  if (resources.meat !== undefined || (cost.meat ?? 0) > 0) {
    next.meat = (resources.meat ?? 0) - (cost.meat ?? 0);
  }
  return next;
}

export function calculateSellRates(
  levels: UpgradeLevels,
  peltValueMult = 1,
  goldTradeMult = 1,
): {
  woodValue: number;
  peltValue: number;
} {
  const tanneryBonus =
    levels.tannery === 0
      ? 1
      : levels.tannery === 1
        ? 1.15
        : levels.tannery === 2
          ? 1.4
          : levels.tannery === 3
            ? 1.8
            : 2.25;
  const forgeBonus = 1 + levels.forge * 0.1;
  const granaryLvl = levels.grandGranary ?? 0;
  const granaryBonus = granaryLvl === 0 ? 1 : granaryLvl === 1 ? 1.15 : granaryLvl === 2 ? 1.3 : 1.5;
  const festivalBonus = (levels.festivalPavilion ?? 0) >= 2 ? 1.18 : 1.0;
  return {
    woodValue: Math.round(2 * forgeBonus * granaryBonus * festivalBonus * goldTradeMult * 10) / 10,
    peltValue:
      Math.round(8 * tanneryBonus * granaryBonus * festivalBonus * peltValueMult * goldTradeMult * 10) /
      10,
  };
}

export function sellTradeBundle(
  resources: ResourceCounts,
  levels: UpgradeLevels,
  sellWoodCount: number,
  sellPeltCount: number,
  peltValueMult = 1,
  goldTradeMult = 1,
): { resources: ResourceCounts; goldGained: number } {
  const woodSold = Math.max(0, Math.min(Math.floor(resources.wood), sellWoodCount));
  const peltsSold = Math.max(0, Math.min(Math.floor(resources.pelts), sellPeltCount));
  const { woodValue, peltValue } = calculateSellRates(levels, peltValueMult, goldTradeMult);
  const goldGained = Math.round(woodSold * woodValue + peltsSold * peltValue);
  return {
    resources: {
      ...resources,
      wood: resources.wood - woodSold,
      pelts: resources.pelts - peltsSold,
      gold: resources.gold + goldGained,
    },
    goldGained,
  };
}

export function calculatePassiveRates(levels: UpgradeLevels): {
  woodPerSec: number;
  goldPerSec: number;
  workerCount: number;
  warmthRadius: number;
  harvestMultiplier: number;
} {
  const cabin = getBuildingSpec('cabin', levels.cabin);
  const lumberCamp = getBuildingSpec('lumberCamp', levels.lumberCamp);
  const sawmill = getBuildingSpec('sawmill', levels.sawmill);
  const tannery = getBuildingSpec('tannery', levels.tannery);
  const forge = getBuildingSpec('forge', levels.forge);
  const windbreak = getBuildingSpec('windbreak', levels.windbreak ?? 0);
  const thermalConduit = getBuildingSpec('thermalConduit', levels.thermalConduit ?? 0);
  const watchtower = getBuildingSpec('watchtower', levels.watchtower ?? 0);
  const grandGranary = getBuildingSpec('grandGranary', levels.grandGranary ?? 0);
  const festivalPavilion = getFestivalBuildingSpec(
    'festivalPavilion',
    levels.festivalPavilion ?? 0,
  );
  const iceMonument = getFestivalBuildingSpec(
    'iceMonument',
    levels.iceMonument ?? 0,
  );
  const tamingPen = getBuildingSpec('tamingPen', levels.tamingPen ?? 0);

  const woodPerSec =
    cabin.woodPerSec +
    lumberCamp.woodPerSec +
    sawmill.woodPerSec +
    forge.woodPerSec +
    windbreak.woodPerSec +
    thermalConduit.woodPerSec +
    watchtower.woodPerSec +
    grandGranary.woodPerSec +
    festivalPavilion.woodPerSec;
  const goldPerSec =
    cabin.goldPerSec +
    lumberCamp.goldPerSec +
    sawmill.goldPerSec +
    tannery.goldPerSec +
    forge.goldPerSec +
    windbreak.goldPerSec +
    thermalConduit.goldPerSec +
    watchtower.goldPerSec +
    grandGranary.goldPerSec +
    tamingPen.goldPerSec +
    festivalPavilion.goldPerSec +
    iceMonument.goldPerSec;
  const workerCount =
    (levels.lumberCamp >= 2 ? (levels.lumberCamp >= 4 ? 2 : 1) : 0) +
    levels.sawmill +
    (levels.tannery >= 1 ? (levels.tannery >= 4 ? 3 : levels.tannery >= 3 ? 2 : 1) : 0);
  const warmthRadius = Math.max(
    cabin.warmthRadius,
    forge.warmthRadius,
    windbreak.warmthRadius,
    thermalConduit.warmthRadius,
    watchtower.warmthRadius,
    grandGranary.warmthRadius,
    tamingPen.warmthRadius,
    festivalPavilion.warmthRadius,
    8.5 +
      levels.cabin * 1.4 +
      levels.forge * 1.6 +
      (levels.thermalConduit ?? 0) * 2.2 +
      (levels.grandGranary ?? 0) * 1.1,
  );
  const harvestMultiplier =
    1 +
    levels.forge * 0.15 +
    (levels.thermalConduit ?? 0) * 0.12 +
    (levels.watchtower ?? 0) * 0.06;

  return {
    woodPerSec,
    goldPerSec,
    workerCount,
    warmthRadius,
    harvestMultiplier,
  };
}

interface ZoneWeatherHazardTemplate {
  names: Record<WeatherKind, string>;
  subtitle: string;
  requiredWind: Record<WeatherKind, number>;
  requiredHeat: Record<WeatherKind, number>;
  rawMovePenalty: Record<WeatherKind, number>;
  rawGatherPenalty: Record<WeatherKind, number>;
}

const ZONE_WEATHER_HAZARDS: Record<ZoneId, ZoneWeatherHazardTemplate> = {
  city: {
    names: {
      clear: 'Geothermal Cavern Draft',
      light_snow: 'Geothermal Cavern Draft',
      blizzard: 'Geothermal Cavern Sanctuary',
    },
    subtitle: 'Sheltered subterranean magma vents block all surface gales & rime',
    requiredWind: { clear: 0, light_snow: 0, blizzard: 0 },
    requiredHeat: { clear: 0, light_snow: 0, blizzard: 0 },
    rawMovePenalty: { clear: 0, light_snow: 0, blizzard: 0 },
    rawGatherPenalty: { clear: 0, light_snow: 0, blizzard: 0 },
  },
  level1: {
    names: {
      clear: 'Valley Frost Draft',
      light_snow: 'Timberland Hoarfrost',
      blizzard: 'Frostwood Whiteout Gale',
    },
    subtitle: 'Valley crosswinds & hoarfrost slow movement and stiffen axe grip',
    requiredWind: { clear: 8, light_snow: 18, blizzard: 30 },
    requiredHeat: { clear: 8, light_snow: 18, blizzard: 30 },
    rawMovePenalty: { clear: 4, light_snow: 10, blizzard: 18 },
    rawGatherPenalty: { clear: 4, light_snow: 12, blizzard: 22 },
  },
  level2: {
    names: {
      clear: 'Highland Ridge Shear',
      light_snow: 'Highland Katabatic Gale',
      blizzard: 'Glacial Cyclone Squall',
    },
    subtitle: 'Katabatic ridge gales push against stride & numb harvesting hands',
    requiredWind: { clear: 18, light_snow: 32, blizzard: 48 },
    requiredHeat: { clear: 18, light_snow: 32, blizzard: 48 },
    rawMovePenalty: { clear: 9, light_snow: 16, blizzard: 26 },
    rawGatherPenalty: { clear: 10, light_snow: 18, blizzard: 28 },
  },
  level3: {
    names: {
      clear: 'Abyssal Trench Draft',
      light_snow: 'Abyssal Rime-Squall',
      blizzard: 'Rimefang Vortex Howl',
    },
    subtitle: 'Dense trench rime encrusts timber & stone while shear winds drag boots',
    requiredWind: { clear: 30, light_snow: 48, blizzard: 65 },
    requiredHeat: { clear: 30, light_snow: 48, blizzard: 65 },
    rawMovePenalty: { clear: 14, light_snow: 22, blizzard: 34 },
    rawGatherPenalty: { clear: 16, light_snow: 26, blizzard: 38 },
  },
  level4: {
    names: {
      clear: 'Caldera Permafrost Shear',
      light_snow: 'Permafrost Ash-Tempest',
      blizzard: 'Obsidian Razor Blizzard',
    },
    subtitle: 'Volcanic frost-ash scours exposed travelers & freezes iron blades',
    requiredWind: { clear: 45, light_snow: 64, blizzard: 82 },
    requiredHeat: { clear: 45, light_snow: 64, blizzard: 82 },
    rawMovePenalty: { clear: 20, light_snow: 30, blizzard: 42 },
    rawGatherPenalty: { clear: 22, light_snow: 34, blizzard: 46 },
  },
  level5: {
    names: {
      clear: 'Cryo-Singularity Downdraft',
      light_snow: 'Starfall Cryo-Tempest',
      blizzard: 'Absolute Zero Cryo-Vortex',
    },
    subtitle: 'Polar vortex demands high-tier Windbreak & Thermal Conduit infrastructure',
    requiredWind: { clear: 60, light_snow: 80, blizzard: 95 },
    requiredHeat: { clear: 60, light_snow: 80, blizzard: 95 },
    rawMovePenalty: { clear: 26, light_snow: 38, blizzard: 50 },
    rawGatherPenalty: { clear: 28, light_snow: 42, blizzard: 55 },
  },
};

export function computeZoneWeatherStatusEffect(params: {
  zone: ZoneId;
  weather: WeatherKind;
  levels: UpgradeLevels;
  nearCampfire?: boolean;
  inStormShelter?: boolean;
  activeBuffs?: Partial<ActiveCraftBuffs>;
}): ZoneWeatherEffectState {
  const { zone, weather, levels } = params;
  const nearCampfire = Boolean(params.nearCampfire);
  const inStormShelter = Boolean(params.inStormShelter);
  const buffs = params.activeBuffs;

  const windbreakSpec = getBuildingSpec('windbreak', levels.windbreak ?? 0);
  const thermalSpec = getBuildingSpec('thermalConduit', levels.thermalConduit ?? 0);
  const watchtowerSpec = getBuildingSpec('watchtower', levels.watchtower ?? 0);
  const granarySpec = getBuildingSpec('grandGranary', levels.grandGranary ?? 0);
  const cabinSpec = getBuildingSpec('cabin', levels.cabin ?? 1);
  const lumberSpec = getBuildingSpec('lumberCamp', levels.lumberCamp ?? 0);
  const forgeSpec = getBuildingSpec('forge', levels.forge ?? 0);
  const shelterSpec = getBuildingSpec('stormShelter', levels.stormShelter ?? 0);
  const coatBonus = Math.max(0, ((levels.coat ?? 1) - 1) * 3);

  const rawWindResist = inStormShelter
    ? 100
    : (windbreakSpec.windResistanceBonusPct ?? 0) +
      (watchtowerSpec.windResistanceBonusPct ?? 0) +
      (shelterSpec.windResistanceBonusPct ?? 0) +
      (cabinSpec.windResistanceBonusPct ?? 0) +
      (lumberSpec.windResistanceBonusPct ?? 0) +
      coatBonus +
      ((buffs?.insulatedBoots ?? 0) > 0 ? 15 : 0);

  const rawHeatRetain = inStormShelter
    ? 100
    : (thermalSpec.heatRetentionBonusPct ?? 0) +
      (granarySpec.heatRetentionBonusPct ?? 0) +
      (forgeSpec.heatRetentionBonusPct ?? 0) +
      (cabinSpec.heatRetentionBonusPct ?? 0) +
      coatBonus +
      (nearCampfire ? 30 : 0) +
      ((buffs?.fireStarter ?? 0) > 0 ? 18 : 0);

  const windResistancePct = Math.max(0, Math.min(100, Math.round(rawWindResist)));
  const heatRetentionPct = Math.max(0, Math.min(100, Math.round(rawHeatRetain)));

  const tpl = ZONE_WEATHER_HAZARDS[zone];
  const name = tpl.names[weather];

  if (zone === 'city') {
    return {
      id: `${zone}_${weather}`,
      name,
      subtitle: tpl.subtitle,
      zone,
      weather,
      severity: 'sheltered',
      rawMovePenaltyPct: 0,
      rawGatherPenaltyPct: 0,
      windResistancePct,
      heatRetentionPct,
      requiredWindResistancePct: 0,
      requiredHeatRetentionPct: 0,
      effectiveMoveSpeedMult: 1.05,
      effectiveGatherEfficiencyMult: 1.05,
      effectiveChillMult: 0,
      mitigated: true,
      infrastructureHint: 'Geothermal cavern sanctuary grants +5% Move & +5% Harvest.',
    };
  }

  const requiredWindResistancePct = tpl.requiredWind[weather];
  const requiredHeatRetentionPct = tpl.requiredHeat[weather];
  const rawMovePenaltyPct = tpl.rawMovePenalty[weather];
  const rawGatherPenaltyPct = tpl.rawGatherPenalty[weather];

  let effectiveMoveSpeedMult = 1.0;
  if (windResistancePct >= requiredWindResistancePct) {
    const surplusWind = windResistancePct - requiredWindResistancePct;
    effectiveMoveSpeedMult =
      Math.round((1.0 + Math.min(0.08, surplusWind * 0.0015)) * 1000) / 1000;
  } else {
    const unmitigatedWindRatio =
      (requiredWindResistancePct - windResistancePct) /
      Math.max(1, requiredWindResistancePct);
    const netMovePenaltyPct = Math.round(rawMovePenaltyPct * unmitigatedWindRatio);
    effectiveMoveSpeedMult = Math.max(
      0.45,
      Math.round((1 - netMovePenaltyPct / 100) * 1000) / 1000,
    );
  }

  let effectiveGatherEfficiencyMult = 1.0;
  if (heatRetentionPct >= requiredHeatRetentionPct) {
    const surplusHeat = heatRetentionPct - requiredHeatRetentionPct;
    effectiveGatherEfficiencyMult =
      Math.round((1.0 + Math.min(0.15, surplusHeat * 0.0025)) * 1000) / 1000;
  } else {
    const unmitigatedHeatRatio =
      (requiredHeatRetentionPct - heatRetentionPct) /
      Math.max(1, requiredHeatRetentionPct);
    const netGatherPenaltyPct = Math.round(rawGatherPenaltyPct * unmitigatedHeatRatio);
    effectiveGatherEfficiencyMult = Math.max(
      0.4,
      Math.round((1 - netGatherPenaltyPct / 100) * 1000) / 1000,
    );
  }

  const windCoverage =
    requiredWindResistancePct > 0
      ? Math.min(1.4, windResistancePct / requiredWindResistancePct)
      : 1;
  const heatCoverage =
    requiredHeatRetentionPct > 0
      ? Math.min(1.4, heatRetentionPct / requiredHeatRetentionPct)
      : 1;
  const avgCoverage = (windCoverage + heatCoverage) * 0.5;
  const effectiveChillMult = inStormShelter
    ? 0
    : Math.max(
        0.55,
        Math.min(1.35, Math.round((1.28 - avgCoverage * 0.52) * 100) / 100),
      );

  const mitigated =
    windResistancePct >= requiredWindResistancePct &&
    heatRetentionPct >= requiredHeatRetentionPct;

  const worstMoveDrop = Math.max(0, Math.round((1 - effectiveMoveSpeedMult) * 100));
  const worstGatherDrop = Math.max(
    0,
    Math.round((1 - effectiveGatherEfficiencyMult) * 100),
  );
  const maxDrop = Math.max(worstMoveDrop, worstGatherDrop);

  let severity: ZoneWeatherSeverity = 'sheltered';
  if (!mitigated) {
    if (maxDrop >= 30) severity = 'extreme';
    else if (maxDrop >= 18) severity = 'severe';
    else if (maxDrop >= 9) severity = 'moderate';
    else severity = 'mild';
  }

  let infrastructureHint =
    'Windbreak & Thermal Conduit infrastructure fully counter zone weather!';
  if (!mitigated) {
    const needWind = windResistancePct < requiredWindResistancePct;
    const needHeat = heatRetentionPct < requiredHeatRetentionPct;
    if (needWind && needHeat) {
      infrastructureHint = `Build Windbreak Palisade (${windResistancePct}/${requiredWindResistancePct}% Wind) & Thermal Conduit (${heatRetentionPct}/${requiredHeatRetentionPct}% Heat) in Base [U]`;
    } else if (needWind) {
      infrastructureHint = `Upgrade Windbreak Palisade (${windResistancePct}/${requiredWindResistancePct}% Wind Resist) in Base [U] to restore Move Speed`;
    } else {
      infrastructureHint = `Upgrade Thermal Conduit or Forge (${heatRetentionPct}/${requiredHeatRetentionPct}% Heat Retain) in Base [U] to restore Harvest Yield`;
    }
  }

  return {
    id: `${zone}_${weather}`,
    name,
    subtitle: tpl.subtitle,
    zone,
    weather,
    severity,
    rawMovePenaltyPct,
    rawGatherPenaltyPct,
    windResistancePct,
    heatRetentionPct,
    requiredWindResistancePct,
    requiredHeatRetentionPct,
    effectiveMoveSpeedMult,
    effectiveGatherEfficiencyMult,
    effectiveChillMult,
    mitigated,
    infrastructureHint,
  };
}

export interface WeatherProfile {
  kind: WeatherKind;
  label: string;
  duration: number;
  chillMultiplier: number;
  fogDensity: number;
  skyColorHex: number;
  sunIntensity: number;
  snowOpacity: number;
  windSpeedX: number;
  fallMultiplier: number;
  gustIntensity: number;
  frostOverlay: number;
}

export const WEATHER_CYCLE_ORDER: WeatherKind[] = [
  'clear',
  'light_snow',
  'blizzard',
];

export const WEATHER_PHASE_DURATION_SECONDS = 540; // 9 minutes per weather phase

export const WEATHER_PROFILES: Record<WeatherKind, WeatherProfile> = {
  clear: {
    kind: 'clear',
    label: 'Clear Skies',
    duration: WEATHER_PHASE_DURATION_SECONDS,
    chillMultiplier: 0.65,
    fogDensity: 0.0075,
    skyColorHex: 0x7da4cf,
    sunIntensity: 2.35,
    snowOpacity: 0.16,
    windSpeedX: 0.35,
    fallMultiplier: 0.55,
    gustIntensity: 0,
    frostOverlay: 0,
  },
  light_snow: {
    kind: 'light_snow',
    label: 'Light Snow',
    duration: WEATHER_PHASE_DURATION_SECONDS,
    chillMultiplier: 1.0,
    fogDensity: 0.012,
    skyColorHex: 0x6f92b8,
    sunIntensity: 1.95,
    snowOpacity: 0.78,
    windSpeedX: 1.1,
    fallMultiplier: 1.0,
    gustIntensity: 0.28,
    frostOverlay: 0.24,
  },
  blizzard: {
    kind: 'blizzard',
    label: 'Blizzard',
    duration: WEATHER_PHASE_DURATION_SECONDS,
    chillMultiplier: 2.35,
    fogDensity: 0.032,
    skyColorHex: 0x99afc4,
    sunIntensity: 1.25,
    snowOpacity: 0.96,
    windSpeedX: 7.8,
    fallMultiplier: 2.4,
    gustIntensity: 1.0,
    frostOverlay: 0.78,
  },
};

export function formatWeatherCountdown(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  if (safe >= 60) {
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${safe}s`;
}

export function getWeatherProfile(weather: WeatherKind): WeatherProfile {
  return WEATHER_PROFILES[weather];
}

export function computeScreenFrostIntensity(params: {
  weather: WeatherKind;
  baseWeatherFrost?: number;
  warmth: number;
  maxWarmth: number;
  nearCampfire: boolean;
  inStormShelter?: boolean;
  timeOfDay?: number;
}): number {
  if (params.inStormShelter) {
    return 0;
  }
  const weatherBase =
    params.baseWeatherFrost ?? getWeatherProfile(params.weather).frostOverlay;
  const warmthRatio = Math.max(
    0,
    Math.min(1, params.warmth / Math.max(1, params.maxWarmth)),
  );
  const coldBoost =
    warmthRatio < 0.45 ? ((0.45 - warmthRatio) / 0.45) * 0.48 : 0;
  const nightChillFrost =
    params.timeOfDay !== undefined && !params.nearCampfire
      ? computeNightFactor(params.timeOfDay) * 0.14
      : 0;
  const shelteredWeather = params.nearCampfire ? weatherBase * 0.65 : weatherBase;
  return Math.max(0, Math.min(1, shelteredWeather + coldBoost + nightChillFrost));
}

export function advanceWeatherState(
  current: WeatherKind,
  timeLeft: number,
  dt: number,
): { weather: WeatherKind; timeLeft: number; changed: boolean } {
  let remaining = timeLeft - dt;
  if (remaining > 0) {
    return { weather: current, timeLeft: remaining, changed: false };
  }
  const idx = WEATHER_CYCLE_ORDER.indexOf(current);
  const nextWeather =
    WEATHER_CYCLE_ORDER[(idx + 1) % WEATHER_CYCLE_ORDER.length];
  remaining = WEATHER_PROFILES[nextWeather].duration;
  return { weather: nextWeather, timeLeft: remaining, changed: true };
}

export function stepWarmthAndHealth(params: {
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  nearCampfire: boolean;
  inStormShelter?: boolean;
  coatLevel: number;
  weather?: WeatherKind;
  chillScale?: number;
  coldDecayMult?: number;
  campfireRecoveryMult?: number;
  timeOfDay?: number;
  dt: number;
}): { hp: number; warmth: number; defeated: boolean } {
  const { maxHp, maxWarmth, nearCampfire, inStormShelter, coatLevel, dt } = params;
  const weather = params.weather ?? 'light_snow';
  const chillScale = params.chillScale ?? 1.0;
  const coldDecayMult = params.coldDecayMult ?? 1.0;
  const campfireRecoveryMult = params.campfireRecoveryMult ?? 1.0;
  const dayNightMult =
    params.timeOfDay !== undefined
      ? computeTemperatureDecayMultiplier(params.timeOfDay)
      : 1.0;
  const weatherProfile = getWeatherProfile(weather);
  let { hp, warmth } = params;
  const coat = getCoatSpec(coatLevel);

  if (nearCampfire) {
    const recoveryRate = (weather === 'blizzard' ? 18 : 24) * campfireRecoveryMult;
    warmth = Math.min(maxWarmth, warmth + recoveryRate * dt);
    if (warmth > maxWarmth * 0.45 && hp < maxHp) {
      hp = Math.min(maxHp, hp + 7.5 * campfireRecoveryMult * dt);
    }
  } else if (inStormShelter) {
    // Complete immunity to blizzard damage and warmth loss while sheltered inside
    warmth = Math.max(0, Math.min(maxWarmth, warmth));
  } else {
    const chillRate =
      2.6 *
      coat.cooldown *
      weatherProfile.chillMultiplier *
      chillScale *
      coldDecayMult *
      dayNightMult;
    warmth = Math.max(0, warmth - chillRate * dt);
    if (warmth <= 0) {
      const frostDmg =
        (weather === 'blizzard' ? 8.5 : 5.5) *
        chillScale *
        coldDecayMult *
        dayNightMult;
      hp = Math.max(0, hp - frostDmg * dt);
    }
  }

  return {
    hp,
    warmth,
    defeated: hp <= 0,
  };
}

export function isEmpireVictory(levels: UpgradeLevels, endlessMode: boolean): boolean {
  return !endlessMode && levels.cabin >= 5;
}

export interface ObjectiveTemplate {
  id: string;
  title: string;
  metric: ObjectiveMetric;
  target: number;
  duration: number;
  reward: Partial<ResourceCounts>;
}

export const OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  {
    id: 'fell_trees',
    title: 'Fell 10 Trees',
    metric: 'treesFelled',
    target: 10,
    duration: 75,
    reward: { gold: 55, wood: 12 },
  },
  {
    id: 'hunt_animals',
    title: 'Hunt 3 Animals',
    metric: 'animalsHunted',
    target: 3,
    duration: 65,
    reward: { gold: 50, pelts: 3 },
  },
  {
    id: 'gather_wood',
    title: 'Gather 30 Wood',
    metric: 'woodHarvested',
    target: 30,
    duration: 65,
    reward: { gold: 45, pelts: 2 },
  },
  {
    id: 'collect_pelts',
    title: 'Collect 5 Pelts',
    metric: 'peltsCollected',
    target: 5,
    duration: 70,
    reward: { gold: 55, wood: 12 },
  },
  {
    id: 'slay_wolves',
    title: 'Slay 2 Timber Wolves',
    metric: 'wolvesSlain',
    target: 2,
    duration: 75,
    reward: { gold: 85, pelts: 4 },
  },
];

export function createDailyObjective(dayNumber: number): DailyObjective {
  const safeDay = Math.max(1, Math.floor(dayNumber));
  const tpl = OBJECTIVE_TEMPLATES[(safeDay - 1) % OBJECTIVE_TEMPLATES.length];
  const cycleBoost = Math.floor((safeDay - 1) / OBJECTIVE_TEMPLATES.length);
  const goldScale = 1 + cycleBoost * 0.35;
  const reward: Partial<ResourceCounts> = {};
  if (tpl.reward.gold) reward.gold = Math.round(tpl.reward.gold * goldScale);
  if (tpl.reward.wood) reward.wood = Math.round(tpl.reward.wood * goldScale);
  if (tpl.reward.pelts) reward.pelts = Math.round(tpl.reward.pelts * goldScale);

  return {
    id: `${tpl.id}_day_${safeDay}`,
    dayNumber: safeDay,
    title: tpl.title,
    metric: tpl.metric,
    target: tpl.target,
    progress: 0,
    timeLeft: tpl.duration,
    duration: tpl.duration,
    reward,
    completed: false,
    failed: false,
    cooldownTimer: 0,
  };
}

export function recordObjectiveProgress(
  obj: DailyObjective,
  metric: ObjectiveMetric,
  delta: number,
): { objective: DailyObjective; justCompleted: boolean } {
  if (obj.completed || obj.failed || obj.metric !== metric || delta <= 0) {
    return { objective: obj, justCompleted: false };
  }
  const nextProgress = Math.min(obj.target, obj.progress + delta);
  const justCompleted = nextProgress >= obj.target;
  return {
    objective: {
      ...obj,
      progress: nextProgress,
      completed: justCompleted,
      cooldownTimer: justCompleted ? 3.0 : 0,
    },
    justCompleted,
  };
}

export function tickDailyObjective(
  obj: DailyObjective,
  dt: number,
): { objective: DailyObjective; expired: boolean; nextDayReady: boolean } {
  if (obj.completed || obj.failed) {
    const remainingCooldown = obj.cooldownTimer - dt;
    if (remainingCooldown <= 0) {
      return {
        objective: { ...obj, cooldownTimer: 0 },
        expired: false,
        nextDayReady: true,
      };
    }
    return {
      objective: { ...obj, cooldownTimer: remainingCooldown },
      expired: false,
      nextDayReady: false,
    };
  }

  const nextTime = obj.timeLeft - dt;
  if (nextTime <= 0) {
    return {
      objective: {
        ...obj,
        timeLeft: 0,
        failed: true,
        cooldownTimer: 2.5,
      },
      expired: true,
      nextDayReady: false,
    };
  }

  return {
    objective: { ...obj, timeLeft: nextTime },
    expired: false,
    nextDayReady: false,
  };
}

export function applyObjectiveReward(
  resources: ResourceCounts,
  reward: Partial<ResourceCounts>,
): { resources: ResourceCounts; goldGained: number } {
  const goldGained = reward.gold ?? 0;
  const next: ResourceCounts = {
    wood: resources.wood + (reward.wood ?? 0),
    pelts: resources.pelts + (reward.pelts ?? 0),
    gold: resources.gold + goldGained,
  };
  if (resources.stone !== undefined || (reward.stone ?? 0) > 0) {
    next.stone = (resources.stone ?? 0) + (reward.stone ?? 0);
  }
  if (resources.ice !== undefined || (reward.ice ?? 0) > 0) {
    next.ice = (resources.ice ?? 0) + (reward.ice ?? 0);
  }
  if (resources.meat !== undefined || (reward.meat ?? 0) > 0) {
    next.meat = (resources.meat ?? 0) + (reward.meat ?? 0);
  }
  return {
    resources: next,
    goldGained,
  };
}
