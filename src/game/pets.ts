import type {
  BuildingSpec,
  ItemRarity,
  PetSpeciesId,
  ResourceCounts,
  TamedPetRecord,
} from './types';

export const PET_PASSIVE_TAME_RADIUS = 5.2;
export const PET_FEED_INTERACT_RADIUS = 5.4;
export const PET_PASSIVE_CALM_MAX_SPEED = 4.6;
export const PEN_INTERACT_RADIUS = 5.8;

export interface PetSpeciesSpec {
  id: PetSpeciesId;
  name: string;
  defaultNick: string;
  rarity: ItemRarity;
  accentHex: number;
  passiveGainPerSec: number;
  feedGain: number;
  feedMeatCost: number;
  feedGoldFallback: number;
  moveSpeedBonus: number; // e.g. 0.12 = +12%
  gatherYieldBonus: number;
  damageBonus: number;
  coldResistBonus: number; // fraction reduced e.g. 0.15 = -15% chill
  goldTradeBonus: number;
  packCapacityBonus: number;
  magnetRadiusBonus: number;
  perkSummary: string;
  description: string;
}

export const PET_SPECIES_ORDER: PetSpeciesId[] = [
  'snow_hare',
  'arctic_fox',
  'snowy_owl',
  'frost_pup',
  'glacial_lynx',
  'calf_mammoth',
];

export const PET_SPECIES_SPECS: Record<PetSpeciesId, PetSpeciesSpec> = {
  snow_hare: {
    id: 'snow_hare',
    name: 'Snow Hare',
    defaultNick: 'Flurry',
    rarity: 'common',
    accentHex: 0x8ed49a,
    passiveGainPerSec: 15,
    feedGain: 48,
    feedMeatCost: 1,
    feedGoldFallback: 8,
    moveSpeedBonus: 0.1,
    gatherYieldBonus: 0,
    damageBonus: 0,
    coldResistBonus: 0,
    goldTradeBonus: 0,
    packCapacityBonus: 0,
    magnetRadiusBonus: 2.5,
    perkSummary: '+10% Move Speed · +2.5m Pickup Magnet',
    description: 'Fleet-footed snowshoe hopper that rounds up scattered timber & pelts.',
  },
  arctic_fox: {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    defaultNick: 'Cinder',
    rarity: 'uncommon',
    accentHex: 0xfb923c,
    passiveGainPerSec: 12,
    feedGain: 42,
    feedMeatCost: 1,
    feedGoldFallback: 10,
    moveSpeedBonus: 0.08,
    gatherYieldBonus: 0,
    damageBonus: 0,
    coldResistBonus: 0,
    goldTradeBonus: 0.16,
    packCapacityBonus: 0,
    magnetRadiusBonus: 1.5,
    perkSummary: '+16% Gold Trade Value · +8% Move Speed',
    description: 'Clever ember-tailed scout favored by Frosthaven caravan traders.',
  },
  snowy_owl: {
    id: 'snowy_owl',
    name: 'Snowy Owl',
    defaultNick: 'Vesper',
    rarity: 'uncommon',
    accentHex: 0x7be0ff,
    passiveGainPerSec: 11,
    feedGain: 40,
    feedMeatCost: 1,
    feedGoldFallback: 10,
    moveSpeedBonus: 0.04,
    gatherYieldBonus: 0.16,
    damageBonus: 0,
    coldResistBonus: 0.08,
    goldTradeBonus: 0,
    packCapacityBonus: 0,
    magnetRadiusBonus: 1.0,
    perkSummary: '+16% Harvest Yield · -8% Frost Chill',
    description: 'Sharp-eyed tundra owl that spots rich timber veins and dry kindling.',
  },
  frost_pup: {
    id: 'frost_pup',
    name: 'Frost Wolf Pup',
    defaultNick: 'Borealis',
    rarity: 'rare',
    accentHex: 0x60a5fa,
    passiveGainPerSec: 9.5,
    feedGain: 36,
    feedMeatCost: 2,
    feedGoldFallback: 16,
    moveSpeedBonus: 0.06,
    gatherYieldBonus: 0,
    damageBonus: 0.18,
    coldResistBonus: 0.06,
    goldTradeBonus: 0,
    packCapacityBonus: 0,
    magnetRadiusBonus: 0,
    perkSummary: '+18% Hunt & Combat Damage · +6% Speed',
    description: 'Loyal silver-furred wolf pup trained to flank quarry and rival hunters.',
  },
  glacial_lynx: {
    id: 'glacial_lynx',
    name: 'Glacial Lynx',
    defaultNick: 'Sable',
    rarity: 'epic',
    accentHex: 0xc084fc,
    passiveGainPerSec: 8,
    feedGain: 34,
    feedMeatCost: 2,
    feedGoldFallback: 20,
    moveSpeedBonus: 0.12,
    gatherYieldBonus: 0,
    damageBonus: 0.24,
    coldResistBonus: 0.08,
    goldTradeBonus: 0,
    packCapacityBonus: 0,
    magnetRadiusBonus: 1.2,
    perkSummary: '+24% Strike & Bow Damage · +12% Move Speed',
    description: 'Tufted-ear snow stalker whose keen instincts sharpen every strike.',
  },
  calf_mammoth: {
    id: 'calf_mammoth',
    name: 'Calf Mammoth',
    defaultNick: 'Tundra',
    rarity: 'mythic',
    accentHex: 0xf6c344,
    passiveGainPerSec: 7,
    feedGain: 32,
    feedMeatCost: 3,
    feedGoldFallback: 26,
    moveSpeedBonus: 0,
    gatherYieldBonus: 0.12,
    damageBonus: 0.1,
    coldResistBonus: 0.24,
    goldTradeBonus: 0,
    packCapacityBonus: 18,
    magnetRadiusBonus: 0,
    perkSummary: '+18 Pack Capacity · -24% Frost Chill · +12% Yield',
    description: 'Woolly highland calf whose thick coat shields camp expeditions from blizzards.',
  },
};

export interface TamingPenTierSpec extends BuildingSpec {
  maxPets: number;
  passiveTameRateMult: number;
  perkPotencyMult: number;
}

export const TAMING_PEN_TIERS: TamingPenTierSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Taming Pen',
    cost: { wood: 0, pelts: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    maxPets: 1,
    passiveTameRateMult: 1.0,
    perkPotencyMult: 1.0,
    description: 'Build a fenced Taming Pen to house multiple companions & boost taming.',
  },
  {
    level: 1,
    name: 'Split-Rail Pet Paddock',
    cost: { wood: 24, pelts: 2, gold: 38 },
    woodPerSec: 0,
    goldPerSec: 0.15,
    warmthRadius: 0,
    maxPets: 2,
    passiveTameRateMult: 1.25,
    perkPotencyMult: 1.05,
    description: 'Houses up to 2 pets · +25% Passive Taming speed & friendly strays visit camp.',
  },
  {
    level: 2,
    name: 'Warm Timber Kennel',
    cost: { wood: 85, pelts: 12, stone: 14, gold: 155, meat: 4 },
    woodPerSec: 0,
    goldPerSec: 0.45,
    warmthRadius: 5,
    maxPets: 4,
    passiveTameRateMult: 1.55,
    perkPotencyMult: 1.2,
    description: 'Houses up to 4 pets · +55% Taming speed & +20% Companion perk potency.',
  },
  {
    level: 3,
    name: 'Frosthound Sanctuary',
    cost: { wood: 200, pelts: 28, stone: 36, ice: 8, gold: 390, meat: 10 },
    woodPerSec: 0,
    goldPerSec: 1.1,
    warmthRadius: 8,
    maxPets: 6,
    passiveTameRateMult: 1.95,
    perkPotencyMult: 1.4,
    description: 'Houses all 6 companions · +95% Taming speed & +40% Companion perk potency!',
  },
];

export function getTamingPenSpec(level: number): TamingPenTierSpec {
  const clamped = Math.max(0, Math.min(TAMING_PEN_TIERS.length - 1, Math.floor(level)));
  return TAMING_PEN_TIERS[clamped];
}

export function computePassiveTameGain(params: {
  speciesId: PetSpeciesId;
  distance: number;
  playerSpeed: number;
  penLevel: number;
  calendarTameMult?: number;
  dt: number;
}): number {
  if (params.distance > PET_PASSIVE_TAME_RADIUS) return 0;
  if (params.playerSpeed > PET_PASSIVE_CALM_MAX_SPEED) return 0;
  const spec = PET_SPECIES_SPECS[params.speciesId];
  const pen = getTamingPenSpec(params.penLevel);
  const proxFactor = 0.75 + 0.45 * (1 - params.distance / PET_PASSIVE_TAME_RADIUS);
  const stillnessBonus = params.playerSpeed < 0.4 ? 1.25 : 1.0;
  const calMult = params.calendarTameMult ?? 1.0;
  return (
    spec.passiveGainPerSec *
    proxFactor *
    stillnessBonus *
    pen.passiveTameRateMult *
    calMult *
    Math.max(0, params.dt)
  );
}

export function canFeedWildPet(
  speciesId: PetSpeciesId,
  resources: ResourceCounts,
): { ok: boolean; usesMeat: boolean; usesGoldFallback: boolean } {
  const spec = PET_SPECIES_SPECS[speciesId];
  const meatHave = resources.meat ?? 0;
  if (meatHave >= spec.feedMeatCost) {
    return { ok: true, usesMeat: true, usesGoldFallback: false };
  }
  if (resources.gold >= spec.feedGoldFallback) {
    return { ok: true, usesMeat: false, usesGoldFallback: true };
  }
  return { ok: false, usesMeat: false, usesGoldFallback: false };
}

export function applyFeedWildPet(params: {
  speciesId: PetSpeciesId;
  currentProgress: number;
  resources: ResourceCounts;
  penLevel: number;
  calendarTameMult?: number;
}): {
  ok: boolean;
  nextProgress: number;
  tamedNow: boolean;
  resources: ResourceCounts;
  spentLabel: string;
} {
  const check = canFeedWildPet(params.speciesId, params.resources);
  if (!check.ok) {
    return {
      ok: false,
      nextProgress: params.currentProgress,
      tamedNow: false,
      resources: params.resources,
      spentLabel: '',
    };
  }
  const spec = PET_SPECIES_SPECS[params.speciesId];
  const pen = getTamingPenSpec(params.penLevel);
  const nextResources: ResourceCounts = { ...params.resources };
  let spentLabel = '';
  if (check.usesMeat) {
    nextResources.meat = (nextResources.meat ?? 0) - spec.feedMeatCost;
    spentLabel = `${spec.feedMeatCost} Meat`;
  } else {
    nextResources.gold -= spec.feedGoldFallback;
    spentLabel = `${spec.feedGoldFallback}g Treat`;
  }
  const gain = spec.feedGain * (0.9 + 0.1 * pen.passiveTameRateMult) * (params.calendarTameMult ?? 1);
  const nextProgress = Math.min(100, params.currentProgress + gain);
  return {
    ok: true,
    nextProgress,
    tamedNow: nextProgress >= 100,
    resources: nextResources,
    spentLabel,
  };
}

export function computeActivePetBonuses(
  tamedPets: TamedPetRecord[],
  activePetUid: string | null,
  penLevel: number,
): {
  moveSpeedMult: number;
  gatherYieldMult: number;
  damageMult: number;
  coldDecayMult: number;
  goldTradeMult: number;
  packCapacityBonus: number;
  magnetRadiusBonus: number;
} {
  const active = tamedPets.find((p) => p.uid === activePetUid);
  if (!active) {
    return {
      moveSpeedMult: 1,
      gatherYieldMult: 1,
      damageMult: 1,
      coldDecayMult: 1,
      goldTradeMult: 1,
      packCapacityBonus: 0,
      magnetRadiusBonus: 0,
    };
  }
  const spec = PET_SPECIES_SPECS[active.speciesId];
  const pen = getTamingPenSpec(penLevel);
  const affectionMult = 1 + Math.max(0, Math.min(100, active.affection)) * 0.002;
  const pot = pen.perkPotencyMult * affectionMult;

  return {
    moveSpeedMult: Math.round((1 + spec.moveSpeedBonus * pot) * 1000) / 1000,
    gatherYieldMult: Math.round((1 + spec.gatherYieldBonus * pot) * 1000) / 1000,
    damageMult: Math.round((1 + spec.damageBonus * pot) * 1000) / 1000,
    coldDecayMult:
      Math.round(Math.max(0.55, 1 - spec.coldResistBonus * pot) * 1000) / 1000,
    goldTradeMult: Math.round((1 + spec.goldTradeBonus * pot) * 1000) / 1000,
    packCapacityBonus: Math.round(spec.packCapacityBonus * pot),
    magnetRadiusBonus: Math.round(spec.magnetRadiusBonus * pot * 10) / 10,
  };
}
