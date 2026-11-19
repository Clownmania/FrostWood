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

export interface HunterObstaclePoint {
  x: number;
  z: number;
  radius: number;
}

export interface HunterTacticalMovementInput {
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  playerX: number;
  playerZ: number;
  zoneCenterX: number;
  zoneCenterZ: number;
  clearingRadius: number;
  zoneRadius: number;
  archetype: RivalHunterArchetypeSpec;
  hp: number;
  maxHp: number;
  stolenValue: number;
  attackCooldown: number;
  strafeSign: 1 | -1;
  phaseTime: number;
  dt: number;
  obstacles?: HunterObstaclePoint[];
}

export interface HunterTacticalMovementOutput {
  state: 'stalking' | 'charging' | 'attacking' | 'fleeing';
  vx: number;
  vz: number;
  speed: number;
  targetYaw: number;
  turnBank: number;
  isLunging: boolean;
  isKiting: boolean;
}

function wrapAngleRad(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Computes tactical, obstacle-aware planar velocity, yaw, and turn-bank for Rival Hunters:
 * - Ranged hunters (`bow` / `staff`) kite and strafe-orbit at 62%–88% of `attackRange`, backpedaling when the player closes in.
 * - Melee hunters (`axe`) weave with an S-curve flank, trigger a 1.38x Sprint-Lunge burst when closing at 1.05x–2.2x range, and circle-strafe laterally between swings.
 * - Smoothly repels around nearby trees/boulders and outside the camp hearth safe ring.
 */
export function computeHunterTacticalMovement(
  input: HunterTacticalMovementInput,
): HunterTacticalMovementOutput {
  const {
    x,
    z,
    vx,
    vz,
    yaw,
    playerX,
    playerZ,
    zoneCenterX,
    zoneCenterZ,
    clearingRadius,
    zoneRadius,
    archetype,
    hp,
    maxHp,
    stolenValue,
    attackCooldown,
    strafeSign,
    phaseTime,
    dt,
    obstacles = [],
  } = input;

  const toPlayerX = playerX - x;
  const toPlayerZ = playerZ - z;
  const distToPlayer = Math.max(0.001, Math.hypot(toPlayerX, toPlayerZ));
  const dirToPlayerX = toPlayerX / distToPlayer;
  const dirToPlayerZ = toPlayerZ / distToPlayer;
  // Perpendicular tangent vector for strafing/flanking
  const perpX = -dirToPlayerZ * strafeSign;
  const perpZ = dirToPlayerX * strafeSign;

  const playerDistFromCamp = Math.hypot(playerX - zoneCenterX, playerZ - zoneCenterZ);
  const playerInSafeHearth = playerDistFromCamp < clearingRadius - 1.5;

  let state: 'stalking' | 'charging' | 'attacking' | 'fleeing' = 'stalking';
  if (hp < maxHp * 0.22 && stolenValue > 0) {
    state = 'fleeing';
  } else if (playerInSafeHearth) {
    state = 'stalking';
  } else if (distToPlayer <= archetype.attackRange) {
    state = 'attacking';
  } else if (distToPlayer <= 42) {
    state = 'charging';
  } else {
    state = 'stalking';
  }

  const isRanged = archetype.weapon === 'bow' || archetype.weapon === 'staff';
  let desiredDirX = 0;
  let desiredDirZ = 0;
  let desiredSpeed = archetype.moveSpeed;
  let isLunging = false;
  let isKiting = false;

  if (state === 'fleeing') {
    // Sprint away from player with a weaving juke
    const weave = Math.sin(phaseTime * 3.8) * 0.36;
    desiredDirX = -dirToPlayerX + perpX * weave;
    desiredDirZ = -dirToPlayerZ + perpZ * weave;
    desiredSpeed = archetype.moveSpeed * 1.18;
  } else if (playerInSafeHearth) {
    // Prowl menacingly along the perimeter of the safe hearth ring
    const fromCampX = x - zoneCenterX;
    const fromCampZ = z - zoneCenterZ;
    const campDist = Math.max(0.001, Math.hypot(fromCampX, fromCampZ));
    const orbitRadius = clearingRadius + 6.5;
    const radialPull = Math.max(-1, Math.min(1, (orbitRadius - campDist) * 0.25));
    const tangX = (-fromCampZ / campDist) * strafeSign;
    const tangZ = (fromCampX / campDist) * strafeSign;
    desiredDirX = tangX + (fromCampX / campDist) * radialPull;
    desiredDirZ = tangZ + (fromCampZ / campDist) * radialPull;
    desiredSpeed = archetype.moveSpeed * 0.68;
  } else if (isRanged) {
    // Ranged tactical kiting & orbit strafing
    const minKiteDist = archetype.attackRange * 0.54;
    const idealMinDist = archetype.attackRange * 0.66;
    const idealMaxDist = archetype.attackRange * 0.92;

    if (distToPlayer < minKiteDist) {
      // Player is too close: kite backwards while strafing
      isKiting = true;
      desiredDirX = -dirToPlayerX * 0.85 + perpX * 0.55;
      desiredDirZ = -dirToPlayerZ * 0.85 + perpZ * 0.55;
      desiredSpeed = archetype.moveSpeed * 1.04;
    } else if (distToPlayer <= idealMaxDist) {
      // Inside sweet spot: orbit-strafe laterally and adjust radial spacing
      const radialBias =
        distToPlayer < idealMinDist ? -0.32 : distToPlayer > archetype.attackRange * 0.82 ? 0.28 : 0;
      desiredDirX = perpX * 0.92 + dirToPlayerX * radialBias;
      desiredDirZ = perpZ * 0.92 + dirToPlayerZ * radialBias;
      desiredSpeed = archetype.moveSpeed * (attackCooldown > 0.35 ? 0.78 : 0.45);
    } else {
      // Advance along a curved flank path into firing range
      const flankBias = Math.sin(phaseTime * 2.1) * 0.38;
      desiredDirX = dirToPlayerX + perpX * flankBias;
      desiredDirZ = dirToPlayerZ + perpZ * flankBias;
      desiredSpeed = archetype.moveSpeed * (state === 'charging' ? 1.05 : 0.72);
    }
  } else {
    // Melee tactical flanking, sprint-lunge, and cooldown circle-strafing
    const lungeMinDist = archetype.attackRange * 1.02;
    const lungeMaxDist = archetype.attackRange * 2.25;

    if (distToPlayer <= archetype.attackRange * 0.96) {
      if (attackCooldown > 0.28) {
        // Circle-strafe around the player while waiting for next axe swing
        const radialAdjust = distToPlayer < archetype.attackRange * 0.62 ? -0.35 : 0.15;
        desiredDirX = perpX * 0.95 + dirToPlayerX * radialAdjust;
        desiredDirZ = perpZ * 0.95 + dirToPlayerZ * radialAdjust;
        desiredSpeed = archetype.moveSpeed * 0.74;
      } else {
        // Step in for the strike
        desiredDirX = dirToPlayerX * 0.8 + perpX * 0.35;
        desiredDirZ = dirToPlayerZ * 0.8 + perpZ * 0.35;
        desiredSpeed = archetype.moveSpeed * 0.58;
      }
    } else if (
      distToPlayer >= lungeMinDist &&
      distToPlayer <= lungeMaxDist &&
      attackCooldown <= 0.45
    ) {
      // Sprint-Lunge burst!
      isLunging = true;
      desiredDirX = dirToPlayerX * 0.96 + perpX * 0.18;
      desiredDirZ = dirToPlayerZ * 0.96 + perpZ * 0.18;
      desiredSpeed = archetype.moveSpeed * 1.38;
    } else {
      // S-curve flanking approach
      const flankWave = Math.sin(phaseTime * 2.6) * 0.44 + 0.18 * strafeSign;
      desiredDirX = dirToPlayerX + perpX * flankWave;
      desiredDirZ = dirToPlayerZ + perpZ * flankWave;
      desiredSpeed = archetype.moveSpeed * (state === 'charging' ? 1.08 : 0.68);
    }
  }

  // Apply smooth obstacle avoidance repulsion from nearby trees/boulders
  let repelX = 0;
  let repelZ = 0;
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    const ox = x - obs.x;
    const oz = z - obs.z;
    const minDist = obs.radius + 1.35;
    const dSq = ox * ox + oz * oz;
    if (dSq > 0.0001 && dSq < minDist * minDist) {
      const d = Math.sqrt(dSq);
      const strength = ((minDist - d) / minDist) * 2.1;
      repelX += (ox / d) * strength;
      repelZ += (oz / d) * strength;
    }
  }

  // Keep outside the camp safe hearth and inside zone outer border
  const fromCenterX = x - zoneCenterX;
  const fromCenterZ = z - zoneCenterZ;
  const distFromCenter = Math.max(0.001, Math.hypot(fromCenterX, fromCenterZ));
  if (distFromCenter < clearingRadius + 4.5) {
    const push = ((clearingRadius + 4.5 - distFromCenter) / 4.5) * 2.4;
    repelX += (fromCenterX / distFromCenter) * push;
    repelZ += (fromCenterZ / distFromCenter) * push;
  } else if (distFromCenter > zoneRadius - 8) {
    const pull = ((distFromCenter - (zoneRadius - 8)) / 8) * 2.4;
    repelX -= (fromCenterX / distFromCenter) * pull;
    repelZ -= (fromCenterZ / distFromCenter) * pull;
  }

  const combinedX = desiredDirX + repelX;
  const combinedZ = desiredDirZ + repelZ;
  const combinedLen = Math.hypot(combinedX, combinedZ);
  const normX = combinedLen > 0.001 ? combinedX / combinedLen : 0;
  const normZ = combinedLen > 0.001 ? combinedZ / combinedLen : 0;

  const targetVx = normX * desiredSpeed;
  const targetVz = normZ * desiredSpeed;

  const accel = isLunging ? 14 : 9.5;
  const blend = 1 - Math.exp(-accel * Math.max(0.001, Math.min(0.1, dt)));
  const nextVx = vx + (targetVx - vx) * blend;
  const nextVz = vz + (targetVz - vz) * blend;
  const nextSpeed = Math.hypot(nextVx, nextVz);

  // When attacking or kiting close to the player, face the player; otherwise face movement vector
  const facePlayer =
    state === 'attacking' || isKiting || (isRanged && distToPlayer < archetype.attackRange * 1.15);
  const targetYaw = facePlayer
    ? Math.atan2(dirToPlayerX, dirToPlayerZ)
    : nextSpeed > 0.25
      ? Math.atan2(nextVx, nextVz)
      : Math.atan2(dirToPlayerX, dirToPlayerZ);

  const yawDelta = wrapAngleRad(targetYaw - yaw);
  const turnBank = Math.max(-0.34, Math.min(0.34, -yawDelta * 0.45 * Math.min(1, nextSpeed / 5)));

  return {
    state,
    vx: nextVx,
    vz: nextVz,
    speed: nextSpeed,
    targetYaw,
    turnBank,
    isLunging,
    isKiting,
  };
}

export interface NpcWaypointSteeringInput {
  x: number;
  z: number;
  vx?: number;
  vz?: number;
  yaw: number;
  targetX: number;
  targetZ: number;
  desiredSpeed?: number;
  maxSpeed?: number;
  dt: number;
  obstacles?: HunterObstaclePoint[];
}

export interface NpcWaypointSteeringOutput {
  vx: number;
  vz: number;
  speed: number;
  targetYaw: number;
  desiredYaw: number;
  turnBank: number;
  distToTarget: number;
  reached: boolean;
}

/**
 * Smooth planar velocity, obstacle avoidance, and banking for City NPCs and Camp Workers.
 */
export function computeNpcWaypointSteering(
  input: NpcWaypointSteeringInput,
): NpcWaypointSteeringOutput {
  const {
    x,
    z,
    vx = 0,
    vz = 0,
    yaw,
    targetX,
    targetZ,
    desiredSpeed,
    maxSpeed,
    dt,
    obstacles = [],
  } = input;
  const topSpeed = desiredSpeed ?? maxSpeed ?? 3.0;
  const dx = targetX - x;
  const dz = targetZ - z;
  const distToTarget = Math.hypot(dx, dz);
  const reached = distToTarget < 0.65;

  // Slow down smoothly as the NPC approaches the waypoint
  const arrivalScale = distToTarget < 1.8 ? Math.max(0, distToTarget / 1.8) : 1;
  let dirX = distToTarget > 0.001 ? dx / distToTarget : 0;
  let dirZ = distToTarget > 0.001 ? dz / distToTarget : 0;

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    const ox = x - obs.x;
    const oz = z - obs.z;
    const minDist = obs.radius + 1.35;
    const dSq = ox * ox + oz * oz;
    if (dSq > 0.0001 && dSq < minDist * minDist) {
      const d = Math.sqrt(dSq);
      const nx = ox / d;
      const nz = oz / d;
      const strength = (minDist - d) / minDist;
      const push = strength * 1.65;
      dirX += nx * push;
      dirZ += nz * push;

      // Tangential sidestep when obstacle sits directly between NPC and target
      const dot = dirX * nx + dirZ * nz;
      if (dot < 0.25) {
        const tx = -nz;
        const tz = nx;
        const side = tx * dx + tz * dz >= 0 ? 1 : -1;
        dirX += tx * side * strength * 1.35;
        dirZ += tz * side * strength * 1.35;
      }
    }
  }

  const len = Math.hypot(dirX, dirZ);
  if (len > 0.001) {
    dirX /= len;
    dirZ /= len;
  }

  const targetVx = dirX * topSpeed * arrivalScale;
  const targetVz = dirZ * topSpeed * arrivalScale;
  const blend = 1 - Math.exp(-8.5 * Math.max(0.001, Math.min(0.1, dt)));
  const nextVx = vx + (targetVx - vx) * blend;
  const nextVz = vz + (targetVz - vz) * blend;
  const speed = Math.hypot(nextVx, nextVz);

  const targetYaw =
    speed > 0.12
      ? Math.atan2(nextVx, nextVz)
      : distToTarget > 0.05
        ? Math.atan2(dx, dz)
        : yaw;
  const yawDelta = wrapAngleRad(targetYaw - yaw);
  const turnBank = Math.max(-0.26, Math.min(0.26, -yawDelta * 0.42 * Math.min(1, speed / 3.5)));

  return {
    vx: nextVx,
    vz: nextVz,
    speed,
    targetYaw,
    desiredYaw: targetYaw,
    turnBank,
    distToTarget,
    reached,
  };
}

