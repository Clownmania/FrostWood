import { canAfford, spendResources } from './economy';
import { getWingsOfFireSpec, WINGS_OF_FIRE_TIERS } from './gear';
import { countBackpackItems } from './inventory';
import type {
  BackpackInventoryMap,
  CityDailyQuestState,
  CityTraderId,
  CraftItemId,
  ItemRarity,
  ResourceCounts,
} from './types';
import { CITY_CENTER_X, CITY_CENTER_Z } from './zones';

export const CITY_TRADER_INTERACT_RADIUS = 5.4;
export const CITY_NPC_INTERACT_RADIUS = 4.6;
export const CITY_QUEST_NPC_INTERACT_RADIUS = 5.8;
export const MEAT_BASE_SELL_GOLD = 12;
export const WINGS_DAILY_QUEST_REQUIREMENT = 30;
export const WINGS_TIER2_QUEST_REQUIREMENT = 45;
export const WINGS_TIER3_QUEST_REQUIREMENT = 60;

export interface CityQuestNpcSpec {
  id: 'valkyra_emberwing';
  name: string;
  title: string;
  x: number;
  z: number;
  facingYaw: number;
  greeting: string;
}

export const CITY_QUEST_NPC: CityQuestNpcSpec = {
  id: 'valkyra_emberwing',
  name: 'Valkyra Emberwing',
  title: 'Herald of the Flame · Daily Quest & Wings of Fire',
  x: CITY_CENTER_X,
  z: CITY_CENTER_Z - 9.4,
  facingYaw: 0,
  greeting:
    'Step before the Solar Brazier, hunter! Complete 30 Daily Frostcave Trials to prove your mastery — then I shall bestow the mythic Wings of Fire upon your shoulders!',
};

export interface CityTraderSpec {
  id: CityTraderId;
  name: string;
  title: string;
  specialty: string;
  greeting: string;
  stallX: number;
  stallZ: number;
  npcX: number;
  npcZ: number;
  facingYaw: number;
  accentHex: number;
  coatKind: 'red' | 'teal' | 'green' | 'navy';
}

export const CITY_TRADERS: Record<CityTraderId, CityTraderSpec> = {
  butcher: {
    id: 'butcher',
    name: 'Bram Ironcleaver',
    title: 'Master Butcher & Game Broker',
    specialty: 'Fresh Venison Rations & Top Coin for Hunted Meat',
    greeting:
      'Step right up! Bring me prime Arctic cuts and pelts — I pay fair gold or trade hot trail rations.',
    stallX: CITY_CENTER_X - 18.5,
    stallZ: CITY_CENTER_Z - 13.5,
    npcX: CITY_CENTER_X - 18.5,
    npcZ: CITY_CENTER_Z - 11.2,
    facingYaw: 0,
    accentHex: 0xc94238,
    coatKind: 'red',
  },
  tinker: {
    id: 'tinker',
    name: 'Astrid Gearwright',
    title: 'Clockwork & Trap Tinker',
    specialty: 'Gears, Hammer Temper Kits, Snare & Frostjaw Traps',
    greeting:
      'Need precision gears or frost-steel jaws? A few coins and hearty camp meat keep the forge turning.',
    stallX: CITY_CENTER_X + 18.5,
    stallZ: CITY_CENTER_Z - 13.5,
    npcX: CITY_CENTER_X + 18.5,
    npcZ: CITY_CENTER_Z - 11.2,
    facingYaw: 0,
    accentHex: 0x3b8ea5,
    coatKind: 'teal',
  },
  apothecary: {
    id: 'apothecary',
    name: 'Linnea Frostherb',
    title: 'Alchemist & Provisioner',
    specialty: 'Poultices, Boot Wraps, Tonics & Aurora Charms',
    greeting:
      'Blizzards bite hard beyond the gate. Trade coin and meat for warming salves and rare charms.',
    stallX: CITY_CENTER_X - 18.5,
    stallZ: CITY_CENTER_Z + 13.5,
    npcX: CITY_CENTER_X - 18.5,
    npcZ: CITY_CENTER_Z + 11.2,
    facingYaw: Math.PI,
    accentHex: 0x3f8f60,
    coatKind: 'green',
  },
  quartermaster: {
    id: 'quartermaster',
    name: 'Halvor Crest',
    title: 'Royal Quartermaster',
    specialty: 'Timber, Quarry Stone, Glacial Ice & Supply Crates',
    greeting:
      'Frosthaven runs on lumber, stone, and good venison. Stock your sled or cash in your hunt!',
    stallX: CITY_CENTER_X + 18.5,
    stallZ: CITY_CENTER_Z + 13.5,
    npcX: CITY_CENTER_X + 18.5,
    npcZ: CITY_CENTER_Z + 11.2,
    facingYaw: Math.PI,
    accentHex: 0x36648f,
    coatKind: 'navy',
  },
};

export const CITY_TRADER_ORDER: CityTraderId[] = [
  'butcher',
  'tinker',
  'apothecary',
  'quartermaster',
];

export type CityOfferKind = 'backpack_item' | 'resource_bundle' | 'feast_heal';

export interface CityOfferSpec {
  id: string;
  traderId: CityTraderId;
  name: string;
  rarity: ItemRarity;
  kind: CityOfferKind;
  cost: ResourceCounts;
  summary: string;
  description: string;
  itemId?: CraftItemId;
  itemQty?: number;
  grantResources?: Partial<ResourceCounts>;
  healHp?: number;
  restoreWarmth?: number;
}

export const CITY_OFFERS: CityOfferSpec[] = [
  // Butcher (Bram)
  {
    id: 'smoked_venison_feast',
    traderId: 'butcher',
    name: 'Smoked Venison Plate',
    rarity: 'common',
    kind: 'feast_heal',
    cost: { wood: 0, pelts: 0, gold: 12, meat: 1 },
    summary: 'Instant +55 HP & +40 Warmth',
    description: 'Seared venison skewer and spiced broth served hot from the butcher grill.',
    healHp: 55,
    restoreWarmth: 40,
  },
  {
    id: 'butcher_poultice_pack',
    traderId: 'butcher',
    name: 'Tallow & Herb Ration (x2)',
    rarity: 'uncommon',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 18, meat: 2 },
    summary: '+2 Alpine Poultice in Pack',
    description: 'Packed field salves & cured rations stored in your backpack for wilderness emergencies.',
    itemId: 'alpine_poultice',
    itemQty: 2,
  },
  {
    id: 'hunters_fire_bundle',
    traderId: 'butcher',
    name: 'Spiced Trail Kindle (x2)',
    rarity: 'common',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 14, meat: 1 },
    summary: '+2 Fire Starter in Pack',
    description: 'Resin-soaked tinder bundles bundled for hunters heading back north.',
    itemId: 'fire_starter',
    itemQty: 2,
  },

  // Tinker (Astrid)
  {
    id: 'tinker_gear_pair',
    traderId: 'tinker',
    name: 'Precision Gear Pair (x2)',
    rarity: 'uncommon',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 22, meat: 2 },
    summary: '+2 Clockwork Gears in Pack',
    description: 'Machined brass cogwheels ready for crafting traps and upgraded tool kits.',
    itemId: 'clockwork_gear',
    itemQty: 2,
  },
  {
    id: 'tinker_hammer_temper',
    traderId: 'tinker',
    name: 'Master Hammer Temper',
    rarity: 'rare',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 30, meat: 2 },
    summary: '+1 Hammer Temper in Pack',
    description: 'Tempered anvil kit boosting axe & bow damage by +30% for 45s.',
    itemId: 'hammer_temper',
    itemQty: 1,
  },
  {
    id: 'tinker_snare_bundle',
    traderId: 'tinker',
    name: 'Snow Snare Bundle (x2)',
    rarity: 'uncommon',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 24, meat: 3 },
    summary: '+2 Snow Snare Traps in Pack',
    description: 'Pre-coiled tension snares baited with cured meat scraps.',
    itemId: 'snare_trap',
    itemQty: 2,
  },
  {
    id: 'tinker_frostjaw_trap',
    traderId: 'tinker',
    name: 'Frostjaw Bear Trap',
    rarity: 'rare',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 46, meat: 4 },
    summary: '+1 Frostjaw Bear Trap in Pack',
    description: 'Heavy frost-steel jaw trap dealing 185 damage & freezing predators.',
    itemId: 'frost_trap',
    itemQty: 1,
  },
  {
    id: 'tinker_utility_toolkit',
    traderId: 'tinker',
    name: 'Artisan Utility Toolkit',
    rarity: 'rare',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 34, meat: 3 },
    summary: '+1 Utility Toolkit in Pack',
    description: 'Field tool roll granting +25% gather yield and +16% stride for 45s.',
    itemId: 'utility_toolkit',
    itemQty: 1,
  },

  // Apothecary (Linnea)
  {
    id: 'apothecary_insulated_boots',
    traderId: 'apothecary',
    name: 'Fur-Lined Boot Wraps',
    rarity: 'common',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 18, meat: 2 },
    summary: '+1 Insulated Boot Wraps',
    description: 'Waxed alpine gaiters granting +22% speed and -25% chill for 35s.',
    itemId: 'insulated_boots',
    itemQty: 1,
  },
  {
    id: 'apothecary_whetstone',
    traderId: 'apothecary',
    name: 'Glacial Whetstone',
    rarity: 'rare',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 32, meat: 3 },
    summary: '+1 Frost Whetstone in Pack',
    description: 'Crystalline hone stone amplifying melee & arrow strikes for 40s.',
    itemId: 'frost_whetstone',
    itemQty: 1,
  },
  {
    id: 'apothecary_mammoth_tonic',
    traderId: 'apothecary',
    name: 'Mammoth Blood Tonic',
    rarity: 'epic',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 44, meat: 5 },
    summary: '+1 Mammoth Tonic in Pack',
    description: 'Hearty restorative draught healing +95 HP and +65 Warmth instantly.',
    itemId: 'mammoth_tonic',
    itemQty: 1,
  },
  {
    id: 'apothecary_aurora_charm',
    traderId: 'apothecary',
    name: 'Aurora Resonance Charm',
    rarity: 'mythic',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 72, meat: 6 },
    summary: '+1 Aurora Charm in Pack',
    description: 'Illuminated sky-crystal relic boosting speed, damage & cold immunity.',
    itemId: 'aurora_charm',
    itemQty: 1,
  },

  // Quartermaster (Halvor)
  {
    id: 'qm_timber_wagon',
    traderId: 'quartermaster',
    name: 'Seasoned Timber Crate',
    rarity: 'common',
    kind: 'resource_bundle',
    cost: { wood: 0, pelts: 0, gold: 24, meat: 2 },
    summary: '+18 Wood Cargo',
    description: 'Kiln-dried pine beams delivered straight to your expedition stores.',
    grantResources: { wood: 18 },
  },
  {
    id: 'qm_quarry_stone',
    traderId: 'quartermaster',
    name: 'Dressed Quarry Stone',
    rarity: 'uncommon',
    kind: 'resource_bundle',
    cost: { wood: 0, pelts: 0, gold: 28, meat: 3 },
    summary: '+14 Stone Cargo',
    description: 'Cut granite blocks ideal for camp upgrades, tools, and traps.',
    grantResources: { stone: 14 },
  },
  {
    id: 'qm_glacial_ice',
    traderId: 'quartermaster',
    name: 'Sealed Glacial Ice Cask',
    rarity: 'rare',
    kind: 'resource_bundle',
    cost: { wood: 0, pelts: 0, gold: 38, meat: 4 },
    summary: '+5 Ice Shards',
    description: 'High-altitude blue glacier crystals packed in frost-silk.',
    grantResources: { ice: 5 },
  },
  {
    id: 'qm_flint_quiver',
    traderId: 'quartermaster',
    name: 'Flint-Tipped Quiver',
    rarity: 'uncommon',
    kind: 'backpack_item',
    cost: { wood: 0, pelts: 0, gold: 22, meat: 2 },
    summary: '+1 Flint Quiver in Pack',
    description: 'Balanced iron-tipped arrows granting +28% hunting power for 35s.',
    itemId: 'flint_quiver',
    itemQty: 1,
  },
];

export interface CityAmbientNpcSpec {
  id: string;
  name: string;
  role: string;
  coatKind: 'blue' | 'green' | 'red';
  dialogue: string;
  waypoints: Array<{ x: number; z: number }>;
  speed: number;
}

export const CITY_AMBIENT_NPCS: CityAmbientNpcSpec[] = [
  {
    id: 'guard_kael',
    name: 'Captain Kael',
    role: 'West Gate Watch',
    coatKind: 'blue',
    dialogue:
      'Roads east of Frostwood Valley stay salted. Keep your pack stocked with meat & coin!',
    waypoints: [
      { x: CITY_CENTER_X - 46, z: CITY_CENTER_Z - 4.8 },
      { x: CITY_CENTER_X - 24, z: CITY_CENTER_Z - 4.8 },
      { x: CITY_CENTER_X - 24, z: CITY_CENTER_Z + 4.8 },
      { x: CITY_CENTER_X - 46, z: CITY_CENTER_Z + 4.8 },
    ],
    speed: 1.55,
  },
  {
    id: 'villager_maren',
    name: 'Maren the Baker',
    role: 'Plaza Shopper',
    coatKind: 'red',
    dialogue:
      'Bram’s smoked venison smells heavenly today! Hunters from the northern abyss keep the city fed.',
    waypoints: [
      { x: CITY_CENTER_X - 12, z: CITY_CENTER_Z - 7.5 },
      { x: CITY_CENTER_X + 12, z: CITY_CENTER_Z - 7.5 },
      { x: CITY_CENTER_X + 12, z: CITY_CENTER_Z + 7.5 },
      { x: CITY_CENTER_X - 12, z: CITY_CENTER_Z + 7.5 },
    ],
    speed: 1.75,
  },
  {
    id: 'villager_torin',
    name: 'Torin Mason',
    role: 'Stoneworker',
    coatKind: 'green',
    dialogue:
      'Seen the Manor upgrades back at camp? Granite foundations hold off winter gales for decades!',
    waypoints: [
      { x: CITY_CENTER_X + 24, z: CITY_CENTER_Z - 20 },
      { x: CITY_CENTER_X + 34, z: CITY_CENTER_Z - 3 },
      { x: CITY_CENTER_X + 24, z: CITY_CENTER_Z + 20 },
      { x: CITY_CENTER_X + 13, z: CITY_CENTER_Z + 3 },
    ],
    speed: 1.6,
  },
  {
    id: 'scout_soren',
    name: 'Scout Soren',
    role: 'Expedition Cartographer',
    coatKind: 'green',
    dialogue:
      'Beyond Glacial Highlands lie Rimefang Abyss, Obsidian Permafrost, and Starfall Eternal Zero — each 3x deadlier than the last!',
    waypoints: [
      { x: CITY_CENTER_X - 7, z: CITY_CENTER_Z - 26 },
      { x: CITY_CENTER_X + 7, z: CITY_CENTER_Z - 26 },
      { x: CITY_CENTER_X + 7, z: CITY_CENTER_Z + 26 },
      { x: CITY_CENTER_X - 7, z: CITY_CENTER_Z + 26 },
    ],
    speed: 1.9,
  },
  {
    id: 'merchant_signe',
    name: 'Signe Furrier',
    role: 'Guild Appraiser',
    coatKind: 'red',
    dialogue:
      'Prime pelts and hunted meat from the deep northern zones fetch steep coins here in Frosthaven Plaza.',
    waypoints: [
      { x: CITY_CENTER_X - 28, z: CITY_CENTER_Z - 18 },
      { x: CITY_CENTER_X - 13, z: CITY_CENTER_Z - 18 },
      { x: CITY_CENTER_X - 13, z: CITY_CENTER_Z + 18 },
      { x: CITY_CENTER_X - 28, z: CITY_CENTER_Z + 18 },
    ],
    speed: 1.5,
  },
  {
    id: 'warden_freya',
    name: 'Warden Freya',
    role: 'Trial Arena Sentinel',
    coatKind: 'blue',
    dialogue:
      'East of this arch stands Ignis, Pit-Forged Warden — temper your gear before entering the arena!',
    waypoints: [
      { x: CITY_CENTER_X + 32, z: CITY_CENTER_Z - 9 },
      { x: CITY_CENTER_X + 42, z: CITY_CENTER_Z - 5 },
      { x: CITY_CENTER_X + 42, z: CITY_CENTER_Z + 5 },
      { x: CITY_CENTER_X + 32, z: CITY_CENTER_Z + 9 },
    ],
    speed: 1.65,
  },
];

export function getCityOffer(offerId: string): CityOfferSpec | null {
  return CITY_OFFERS.find((o) => o.id === offerId) ?? null;
}

export function getOffersForTrader(traderId: CityTraderId): CityOfferSpec[] {
  return CITY_OFFERS.filter((o) => o.traderId === traderId);
}

export function canBuyCityOffer(params: {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  maxItems: number;
  offer: CityOfferSpec;
}): { ok: boolean; reason?: string } {
  const { resources, inventory, maxItems, offer } = params;
  if (!canAfford(resources, offer.cost)) {
    const needMeat = (offer.cost.meat ?? 0) > (resources.meat ?? 0);
    const needGold = offer.cost.gold > resources.gold;
    if (needMeat && needGold) return { ok: false, reason: 'Need more Gold & Meat' };
    if (needMeat) return { ok: false, reason: 'Need more Meat (hunt wildlife)' };
    return { ok: false, reason: 'Need more Gold' };
  }
  if (offer.kind === 'backpack_item' && offer.itemId) {
    const qty = offer.itemQty ?? 1;
    const used = countBackpackItems(inventory);
    if (used + qty > maxItems) {
      return { ok: false, reason: `Backpack full (${used}/${maxItems})` };
    }
  }
  return { ok: true };
}

export interface BuyCityOfferResult {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  offer: CityOfferSpec;
  hpDelta: number;
  warmthDelta: number;
}

export function purchaseCityOffer(params: {
  resources: ResourceCounts;
  inventory: BackpackInventoryMap;
  maxItems: number;
  offerId: string;
}): BuyCityOfferResult | null {
  const offer = getCityOffer(params.offerId);
  if (!offer) return null;
  const check = canBuyCityOffer({
    resources: params.resources,
    inventory: params.inventory,
    maxItems: params.maxItems,
    offer,
  });
  if (!check.ok) return null;

  const afterSpend = spendResources(params.resources, offer.cost);
  if (!afterSpend) return null;

  const nextResources: ResourceCounts = {
    ...afterSpend,
    wood: afterSpend.wood + (offer.grantResources?.wood ?? 0),
    stone: (afterSpend.stone ?? 0) + (offer.grantResources?.stone ?? 0),
    ice: (afterSpend.ice ?? 0) + (offer.grantResources?.ice ?? 0),
    meat: (afterSpend.meat ?? 0) + (offer.grantResources?.meat ?? 0),
    pelts: afterSpend.pelts + (offer.grantResources?.pelts ?? 0),
    gold: afterSpend.gold + (offer.grantResources?.gold ?? 0),
  };

  const nextInventory: BackpackInventoryMap = { ...params.inventory };
  if (offer.kind === 'backpack_item' && offer.itemId) {
    nextInventory[offer.itemId] =
      (nextInventory[offer.itemId] ?? 0) + (offer.itemQty ?? 1);
  }

  return {
    resources: nextResources,
    inventory: nextInventory,
    offer,
    hpDelta: offer.healHp ?? 0,
    warmthDelta: offer.restoreWarmth ?? 0,
  };
}

export function calculateMeatSellValue(goldTradeMult = 1): number {
  return Math.max(MEAT_BASE_SELL_GOLD, Math.round(MEAT_BASE_SELL_GOLD * goldTradeMult));
}

export function sellMeatForGold(
  resources: ResourceCounts,
  count: number,
  goldTradeMult = 1,
): { resources: ResourceCounts; meatSold: number; goldGained: number } {
  const available = Math.max(0, Math.floor(resources.meat ?? 0));
  const meatSold = Math.max(0, Math.min(available, Math.floor(count)));
  const unitPrice = calculateMeatSellValue(goldTradeMult);
  const goldGained = meatSold * unitPrice;
  return {
    resources: {
      ...resources,
      meat: (resources.meat ?? 0) - meatSold,
      gold: resources.gold + goldGained,
    },
    meatSold,
    goldGained,
  };
}

export function findNearestCityTrader(
  playerX: number,
  playerZ: number,
  maxRadius = CITY_TRADER_INTERACT_RADIUS,
): { trader: CityTraderSpec; dist: number } | null {
  let best: { trader: CityTraderSpec; dist: number } | null = null;
  for (const id of CITY_TRADER_ORDER) {
    const trader = CITY_TRADERS[id];
    const dist = Math.hypot(playerX - trader.npcX, playerZ - trader.npcZ);
    if (dist <= maxRadius && (!best || dist < best.dist)) {
      best = { trader, dist };
    }
  }
  return best;
}

export function isNearCityQuestNpc(
  playerX: number,
  playerZ: number,
  maxRadius = CITY_QUEST_NPC_INTERACT_RADIUS,
): boolean {
  const dist = Math.hypot(playerX - CITY_QUEST_NPC.x, playerZ - CITY_QUEST_NPC.z);
  return dist <= maxRadius;
}

export function computeWingsTierForCompletedQuests(
  completedCount: number,
  currentWingsTier = 0,
): number {
  const safeCount = Math.max(0, Math.floor(completedCount));
  let earned = 0;
  if (safeCount >= WINGS_TIER3_QUEST_REQUIREMENT) earned = 3;
  else if (safeCount >= WINGS_TIER2_QUEST_REQUIREMENT) earned = 2;
  else if (safeCount >= WINGS_DAILY_QUEST_REQUIREMENT) earned = 1;
  return Math.max(currentWingsTier, earned);
}

export function createCityDailyQuest(
  dayNumber: number,
  currentWingsTier = 0,
  completedQuestsCount = 0,
): CityDailyQuestState {
  const safeDay = Math.max(1, Math.floor(dayNumber));
  const nextQuestOrdinal = Math.max(0, Math.floor(completedQuestsCount)) + 1;
  const projectedTier = computeWingsTierForCompletedQuests(nextQuestOrdinal, currentWingsTier);
  const unlocksWingsThisQuest = projectedTier > currentWingsTier;
  const targetMilestone =
    currentWingsTier >= 2
      ? WINGS_TIER3_QUEST_REQUIREMENT
      : currentWingsTier >= 1
        ? WINGS_TIER2_QUEST_REQUIREMENT
        : WINGS_DAILY_QUEST_REQUIREMENT;
  const displayWingsTier = unlocksWingsThisQuest
    ? projectedTier
    : Math.min(WINGS_OF_FIRE_TIERS.length - 1, Math.max(1, currentWingsTier + 1));
  const wingsSpec = getWingsOfFireSpec(displayWingsTier);

  const titles = [
    'Trial of the Solar Pinions',
    'Emberwing Hunter’s Tribute',
    'Sacred Flame of Frostcave',
    'Highland Predator Culling',
    'Hearthflame Warden Contract',
  ];
  const title = unlocksWingsThisQuest
    ? `Final Trial (${nextQuestOrdinal}/${targetMilestone}): ${wingsSpec.name}`
    : `${titles[(safeDay + nextQuestOrdinal - 2) % titles.length]} (#${nextQuestOrdinal})`;
  const targetKills = 4 + Math.min(8, Math.floor((safeDay + nextQuestOrdinal) / 3));
  const tierFactor = Math.max(1, displayWingsTier);
  const bountyCost: ResourceCounts = {
    wood: 25 + tierFactor * 14 + Math.min(40, nextQuestOrdinal * 2),
    pelts: 6 + tierFactor * 4 + Math.min(12, Math.floor(nextQuestOrdinal / 2)),
    meat: 4 + tierFactor * 2 + Math.min(10, Math.floor(nextQuestOrdinal / 3)),
    gold: 85 + tierFactor * 55 + Math.min(160, nextQuestOrdinal * 8),
  };

  return {
    id: `city_flame_quest_${safeDay}_${nextQuestOrdinal}`,
    dayNumber: safeDay,
    title,
    description: unlocksWingsThisQuest
      ? `Final Trial! Hunt ${targetKills} beasts OR bring ${bountyCost.meat ?? 0} Meat, ${bountyCost.pelts} Pelts & ${bountyCost.gold}g to awaken ${wingsSpec.name}!`
      : `Hunt ${targetKills} beasts OR offer tribute (${bountyCost.meat ?? 0} Meat, ${bountyCost.pelts} Pelts & ${bountyCost.gold}g) — advances Flame Record (${completedQuestsCount}/${targetMilestone} toward ${wingsSpec.name}).`,
    npcName: CITY_QUEST_NPC.name,
    npcTitle: CITY_QUEST_NPC.title,
    targetKills,
    progressKills: 0,
    bountyCost,
    rewardGold: 130 + Math.min(260, nextQuestOrdinal * 10),
    rewardMeat: 4 + tierFactor * 2,
    rewardIce: 2 + tierFactor,
    rewardWingsTier: unlocksWingsThisQuest ? projectedTier : 0,
    rewardWingsName: unlocksWingsThisQuest
      ? wingsSpec.name
      : `${wingsSpec.name} (${nextQuestOrdinal}/${targetMilestone})`,
    completed: false,
  };
}

export function recordCityDailyQuestKill(
  quest: CityDailyQuestState,
  killsDelta = 1,
): { quest: CityDailyQuestState; readyToClaim: boolean } {
  if (quest.completed || killsDelta <= 0) {
    return { quest, readyToClaim: false };
  }
  const progressKills = Math.min(quest.targetKills, quest.progressKills + killsDelta);
  return {
    quest: {
      ...quest,
      progressKills,
    },
    readyToClaim: progressKills >= quest.targetKills,
  };
}

export function canCompleteCityDailyQuest(
  quest: CityDailyQuestState,
  resources: ResourceCounts,
): { ok: boolean; viaKills: boolean; viaBounty: boolean; reason?: string } {
  if (quest.completed) {
    return {
      ok: false,
      viaKills: false,
      viaBounty: false,
      reason: 'Trial claimed! Start the next Daily Trial or return at Dawn.',
    };
  }
  const viaKills = quest.progressKills >= quest.targetKills;
  const viaBounty = canAfford(resources, quest.bountyCost);
  if (viaKills || viaBounty) {
    return { ok: true, viaKills, viaBounty };
  }
  return {
    ok: false,
    viaKills: false,
    viaBounty: false,
    reason: `Hunt ${quest.targetKills - quest.progressKills} more quarry OR bring ${quest.bountyCost.meat ?? 0} Meat, ${quest.bountyCost.pelts} Pelts & ${quest.bountyCost.gold}g`,
  };
}

export function completeCityDailyQuest(params: {
  quest: CityDailyQuestState;
  resources: ResourceCounts;
  currentWingsTier: number;
  completedQuestsCount?: number;
}): {
  quest: CityDailyQuestState;
  resources: ResourceCounts;
  wingsTier: number;
  wingsUnlockedNow: boolean;
  completedQuestsCount: number;
  usedBounty: boolean;
} | null {
  const { quest, resources, currentWingsTier, completedQuestsCount = 0 } = params;
  const check = canCompleteCityDailyQuest(quest, resources);
  if (!check.ok) return null;

  let baseResources = resources;
  let usedBounty = false;
  if (!check.viaKills && check.viaBounty) {
    const spent = spendResources(resources, quest.bountyCost);
    if (!spent) return null;
    baseResources = spent;
    usedBounty = true;
  }

  const nextResources: ResourceCounts = {
    ...baseResources,
    gold: baseResources.gold + quest.rewardGold,
    meat: (baseResources.meat ?? 0) + quest.rewardMeat,
    ice: (baseResources.ice ?? 0) + quest.rewardIce,
  };

  const nextCompleted = Math.max(0, Math.floor(completedQuestsCount)) + 1;
  const nextWingsTier = computeWingsTierForCompletedQuests(nextCompleted, currentWingsTier);
  const wingsUnlockedNow = nextWingsTier > currentWingsTier;

  return {
    quest: {
      ...quest,
      progressKills: quest.targetKills,
      completed: true,
    },
    resources: nextResources,
    wingsTier: nextWingsTier,
    wingsUnlockedNow,
    completedQuestsCount: nextCompleted,
    usedBounty,
  };
}

