import type {
  ResourceCounts,
  RivalHunterArchetypeId,
  ZoneId,
} from './types';
import { ZONE_SPECS } from './zones';

export interface RivalHunterArchetypeSpec {
  id: RivalHunterArchetypeId;
  name: string;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  /** Low spawn probability per enemy spawn roll (0 for baseline encounters). */
  spawnChance: number;
  weapon: 'axe' | 'bow' | 'staff';
  coatKind: 'red' | 'navy' | 'teal';
  maxHp: number;
  moveSpeed: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  stealRate: number;
  warmthDrain?: number;
  rewardGold: number;
  rewardPelts: number;
  rewardMeat: number;
  rewardWood: number;
  rewardIce?: number;
}

export const RIVAL_HUNTER_ARCHETYPES: Record<
  RivalHunterArchetypeId,
  RivalHunterArchetypeSpec
> = {
  poacher: {
    id: 'poacher',
    name: 'Vane the Rogue Poacher',
    title: 'Cutthroat Bow Stalker',
    rarity: 'common',
    spawnChance: 0,
    weapon: 'bow',
    coatKind: 'teal',
    maxHp: 145,
    moveSpeed: 5.8,
    attackDamage: 14,
    attackRange: 13.5,
    attackCooldown: 1.75,
    stealRate: 0.08,
    rewardGold: 95,
    rewardPelts: 5,
    rewardMeat: 3,
    rewardWood: 12,
  },
  raider: {
    id: 'raider',
    name: 'Skorri Frostbandit',
    title: 'Blood-Axe Marauder',
    rarity: 'uncommon',
    spawnChance: 0,
    weapon: 'axe',
    coatKind: 'red',
    maxHp: 195,
    moveSpeed: 6.3,
    attackDamage: 19,
    attackRange: 2.95,
    attackCooldown: 1.35,
    stealRate: 0.11,
    rewardGold: 135,
    rewardPelts: 7,
    rewardMeat: 4,
    rewardWood: 18,
  },
  shadow_stalker: {
    id: 'shadow_stalker',
    name: 'Kaelen Shadow-Hound',
    title: 'Highland Bounty Killer',
    rarity: 'uncommon',
    spawnChance: 0,
    weapon: 'axe',
    coatKind: 'navy',
    maxHp: 260,
    moveSpeed: 6.75,
    attackDamage: 24,
    attackRange: 3.15,
    attackCooldown: 1.2,
    stealRate: 0.14,
    rewardGold: 190,
    rewardPelts: 10,
    rewardMeat: 6,
    rewardWood: 25,
  },
  frost_berserker: {
    id: 'frost_berserker',
    name: 'Jotun Frost-Reaver',
    title: 'Rare Armored Warlord',
    rarity: 'rare',
    spawnChance: 0.09,
    weapon: 'axe',
    coatKind: 'navy',
    maxHp: 345,
    moveSpeed: 6.15,
    attackDamage: 29,
    attackRange: 3.45,
    attackCooldown: 1.45,
    stealRate: 0.16,
    warmthDrain: 5,
    rewardGold: 260,
    rewardPelts: 14,
    rewardMeat: 8,
    rewardWood: 35,
    rewardIce: 3,
  },
  aurora_warlock: {
    id: 'aurora_warlock',
    name: 'Valkyr Ice-Wraith',
    title: 'Mythic Frost Caster',
    rarity: 'mythic',
    spawnChance: 0.05,
    weapon: 'staff',
    coatKind: 'teal',
    maxHp: 270,
    moveSpeed: 7.05,
    attackDamage: 24,
    attackRange: 15.5,
    attackCooldown: 1.55,
    stealRate: 0.13,
    warmthDrain: 12,
    rewardGold: 320,
    rewardPelts: 12,
    rewardMeat: 6,
    rewardWood: 30,
    rewardIce: 5,
  },
};

export const RIVAL_HUNTER_ORDER: RivalHunterArchetypeId[] = [
  'poacher',
  'raider',
  'shadow_stalker',
  'frost_berserker',
  'aurora_warlock',
];

export const RARE_ENEMY_ARCHETYPES: RivalHunterArchetypeId[] = [
  'aurora_warlock',
  'frost_berserker',
];

export interface StolenBag {
  wood: number;
  pelts: number;
  meat: number;
  gold: number;
}

export function createEmptyStolenBag(): StolenBag {
  return { wood: 0, pelts: 0, meat: 0, gold: 0 };
}

export function pickRivalHunterArchetype(
  zone: ZoneId,
  dayNumber: number,
  rng = Math.random,
): RivalHunterArchetypeSpec {
  const rareZoneScale =
    zone === 'level5'
      ? 3.2
      : zone === 'level4'
        ? 2.4
        : zone === 'level3'
          ? 1.85
          : zone === 'level2'
            ? 1.35
            : 1.0;
  const rareRoll = rng();
  let cumulativeRare = 0;
  for (const rareId of RARE_ENEMY_ARCHETYPES) {
    const spec = RIVAL_HUNTER_ARCHETYPES[rareId];
    cumulativeRare += spec.spawnChance * rareZoneScale;
    if (rareRoll < cumulativeRare) {
      return spec;
    }
  }

  if (zone === 'level5' || zone === 'level4') {
    const r = rng();
    if (r < 0.35) return RIVAL_HUNTER_ARCHETYPES.frost_berserker;
    if (r < 0.65) return RIVAL_HUNTER_ARCHETYPES.aurora_warlock;
    return RIVAL_HUNTER_ARCHETYPES.shadow_stalker;
  }
  if (zone === 'level3') {
    return rng() < 0.72
      ? RIVAL_HUNTER_ARCHETYPES.shadow_stalker
      : RIVAL_HUNTER_ARCHETYPES.frost_berserker;
  }
  if (zone === 'level2') {
    return rng() < 0.55
      ? RIVAL_HUNTER_ARCHETYPES.shadow_stalker
      : RIVAL_HUNTER_ARCHETYPES.raider;
  }
  if (dayNumber >= 3 && rng() < 0.35) {
    return RIVAL_HUNTER_ARCHETYPES.shadow_stalker;
  }
  return rng() < 0.52
    ? RIVAL_HUNTER_ARCHETYPES.raider
    : RIVAL_HUNTER_ARCHETYPES.poacher;
}

/**
 * Rolls for a rare bonus enemy ambush when none of the rare archetypes are currently active in the zone.
 */
export function rollRareEnemyAmbush(
  zone: ZoneId,
  activeRareCount: number,
  rng = Math.random,
): RivalHunterArchetypeSpec | null {
  if (activeRareCount > 0 || zone === 'city') return null;
  const zoneScale =
    zone === 'level5'
      ? 3.35
      : zone === 'level4'
        ? 2.55
        : zone === 'level3'
          ? 1.95
          : zone === 'level2'
            ? 1.45
            : 1.0;
  const r = rng();
  let cumulative = 0;
  for (const rareId of RARE_ENEMY_ARCHETYPES) {
    const spec = RIVAL_HUNTER_ARCHETYPES[rareId];
    cumulative += spec.spawnChance * zoneScale;
    if (r < cumulative) {
      return spec;
    }
  }
  return null;
}

/**
 * Picks a safe wilderness spawn position in the current zone outside the camp hearth safe ring.
 */
export function pickRivalHunterSpawnPoint(
  zone: ZoneId,
  playerX: number,
  playerZ: number,
  rng = Math.random,
): { x: number; z: number } {
  const spec = ZONE_SPECS[zone];
  const minFromCenter = Math.max(spec.clearingRadius + 18, 34);
  const maxFromCenter = Math.max(minFromCenter + 16, spec.radius - 16);

  for (let attempt = 0; attempt < 18; attempt++) {
    const angle = rng() * Math.PI * 2;
    const dist = minFromCenter + rng() * (maxFromCenter - minFromCenter);
    const x = spec.centerX + Math.cos(angle) * dist;
    const z = spec.centerZ + Math.sin(angle) * dist;
    const distToPlayer = Math.hypot(x - playerX, z - playerZ);
    if (distToPlayer >= 26 && distToPlayer <= 84) {
      return { x, z };
    }
  }

  const fallbackAngle = rng() * Math.PI * 2;
  const fallbackDist = Math.min(maxFromCenter, minFromCenter + 24);
  return {
    x: spec.centerX + Math.cos(fallbackAngle) * fallbackDist,
    z: spec.centerZ + Math.sin(fallbackAngle) * fallbackDist,
  };
}

/**
 * Computes resources stolen when a Rival Hunter lands a hit on the player,
 * adding them to the hunter's stolen bag so the player can recover everything + bonus loot on kill.
 */
export function stealResourcesOnHunterHit(
  resources: ResourceCounts,
  stolenBag: StolenBag,
  stealRate: number,
): {
  resources: ResourceCounts;
  stolenBag: StolenBag;
  stolenWood: number;
  stolenPelts: number;
  stolenMeat: number;
  stolenGold: number;
  summaryText: string | null;
} {
  const rate = Math.max(0.03, Math.min(0.25, stealRate));
  const stolenWood =
    resources.wood > 0 ? Math.min(resources.wood, Math.max(1, Math.round(resources.wood * rate))) : 0;
  const stolenPelts =
    resources.pelts > 0 ? Math.min(resources.pelts, Math.max(1, Math.round(resources.pelts * rate))) : 0;
  const availMeat = resources.meat ?? 0;
  const stolenMeat =
    availMeat > 0 ? Math.min(availMeat, Math.max(1, Math.round(availMeat * rate))) : 0;
  const stolenGold =
    resources.gold > 0 ? Math.min(resources.gold, Math.max(2, Math.round(resources.gold * rate))) : 0;

  const nextResources: ResourceCounts = {
    ...resources,
    wood: resources.wood - stolenWood,
    pelts: resources.pelts - stolenPelts,
    meat: availMeat - stolenMeat,
    gold: resources.gold - stolenGold,
  };

  const nextBag: StolenBag = {
    wood: stolenBag.wood + stolenWood,
    pelts: stolenBag.pelts + stolenPelts,
    meat: stolenBag.meat + stolenMeat,
    gold: stolenBag.gold + stolenGold,
  };

  const parts: string[] = [];
  if (stolenGold > 0) parts.push(`${stolenGold}g`);
  if (stolenMeat > 0) parts.push(`${stolenMeat} Meat`);
  if (stolenPelts > 0) parts.push(`${stolenPelts} Pelts`);
  if (stolenWood > 0) parts.push(`${stolenWood} Wood`);

  return {
    resources: nextResources,
    stolenBag: nextBag,
    stolenWood,
    stolenPelts,
    stolenMeat,
    stolenGold,
    summaryText: parts.length > 0 ? parts.join(', ') : null,
  };
}

export function totalStolenItems(bag: StolenBag): number {
  return bag.wood + bag.pelts + bag.meat + bag.gold;
}

/**
 * Computes the total bounty + recovered stolen items when the player defeats an enemy hunter.
 */
export function computeRivalHunterDefeatLoot(
  archetype: RivalHunterArchetypeSpec,
  stolenBag: StolenBag,
  zoneYieldMult = 1,
): {
  wood: number;
  pelts: number;
  meat: number;
  ice: number;
  gold: number;
} {
  return {
    wood: Math.round(archetype.rewardWood * zoneYieldMult) + stolenBag.wood,
    pelts: Math.round(archetype.rewardPelts * zoneYieldMult) + stolenBag.pelts,
    meat: Math.round(archetype.rewardMeat * zoneYieldMult) + stolenBag.meat,
    ice: Math.round((archetype.rewardIce ?? 0) * zoneYieldMult),
    gold: Math.round(archetype.rewardGold * zoneYieldMult) + stolenBag.gold,
  };
}
