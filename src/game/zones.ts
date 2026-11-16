import type { ZoneHudInfo, ZoneId } from './types';

export const LEVEL1_RADIUS = 156;
export const LEVEL2_RADIUS = 138;
export const LEVEL2_CENTER_Z = -340;

export const LEVEL3_RADIUS = 140;
export const LEVEL3_CENTER_X = -320;
export const LEVEL3_CENTER_Z = -340;

export const LEVEL4_RADIUS = 144;
export const LEVEL4_CENTER_X = -320;
export const LEVEL4_CENTER_Z = 0;

export const LEVEL5_RADIUS = 148;
export const LEVEL5_CENTER_X = 320;
export const LEVEL5_CENTER_Z = -340;

export const CITY_RADIUS = 92;
export const CITY_CENTER_X = 284;
export const CITY_CENTER_Z = 0;

export const LEVEL1_CITY_PORTAL_X = 96;
export const LEVEL1_CITY_PORTAL_Z = 0;
export const LEVEL1_CITY_ARRIVAL_X = 90.4;
export const LEVEL1_CITY_ARRIVAL_Z = 0;
export const LEVEL1_CITY_ARRIVAL_YAW = -Math.PI / 2;

export const PORTAL_INTERACT_RADIUS = 6.2;
export const PORTAL_VORTEX_RADIUS = 1.65;
export const PORTAL_COOLDOWN_SECONDS = 1.4;

export const SURVIVAL_ZONE_ORDER: readonly ZoneId[] = [
  'level1',
  'level2',
  'level3',
  'level4',
  'level5',
];

export const ALL_ZONE_ORDER: readonly ZoneId[] = [
  'level1',
  'level2',
  'level3',
  'level4',
  'level5',
  'city',
];

export interface ZoneSpec {
  id: ZoneId;
  levelNumber: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  subtitle: string;
  centerX: number;
  centerZ: number;
  radius: number;
  clearingRadius: number;
  portalX: number;
  portalZ: number;
  portalFacingYaw: number;
  arrivalX: number;
  arrivalZ: number;
  arrivalYaw: number;
  returnTargetZone: ZoneId;
  forwardPortalX?: number;
  forwardPortalZ?: number;
  forwardPortalFacingYaw?: number;
  forwardArrivalX?: number;
  forwardArrivalZ?: number;
  forwardArrivalYaw?: number;
  forwardTargetZone?: ZoneId;
  hearthX: number;
  hearthZ: number;
  hearthWarmthRadius: number;
  yieldMult: number;
  xpMult: number;
  chillMult: number;
  /** Exponential 3x survival difficulty progression (1x -> 3x -> 9x -> 27x -> 81x). */
  difficultyMult: number;
  enemyHpMult: number;
  enemyDamageMult: number;
}

export const ZONE_SPECS: Record<ZoneId, ZoneSpec> = {
  level1: {
    id: 'level1',
    levelNumber: 1,
    name: 'Frostwood Valley',
    subtitle: 'Frontier Camp & Deep Timberlands · 1x Base Survival',
    centerX: 0,
    centerZ: 0,
    radius: LEVEL1_RADIUS,
    clearingRadius: 15.5,
    portalX: 0,
    portalZ: -96,
    portalFacingYaw: 0, // Faces South (+Z) toward camp
    arrivalX: 0,
    arrivalZ: -90.4,
    arrivalYaw: 0, // Player faces South (+Z) away from Northgate Portal
    returnTargetZone: 'level2',
    forwardPortalX: 0,
    forwardPortalZ: -96,
    forwardPortalFacingYaw: 0,
    forwardArrivalX: 0,
    forwardArrivalZ: -90.4,
    forwardArrivalYaw: 0,
    forwardTargetZone: 'level2',
    hearthX: 0,
    hearthZ: 0,
    hearthWarmthRadius: 9.0,
    yieldMult: 1.0,
    xpMult: 1.0,
    chillMult: 1.0,
    difficultyMult: 1,
    enemyHpMult: 1.0,
    enemyDamageMult: 1.0,
  },
  level2: {
    id: 'level2',
    levelNumber: 2,
    name: 'Glacial Highlands',
    subtitle: 'Northern Summit · 3x Survival Difficulty & +55% Yield',
    centerX: 0,
    centerZ: LEVEL2_CENTER_Z,
    radius: LEVEL2_RADIUS,
    clearingRadius: 13.5,
    portalX: 0,
    portalZ: LEVEL2_CENTER_Z + 86, // z = -254 (South entrance of Level 2)
    portalFacingYaw: Math.PI, // Faces North (-Z) into Glacial Highlands
    arrivalX: 0,
    arrivalZ: LEVEL2_CENTER_Z + 80.4, // z = -259.6, clear of portal lintel & south of Waystation Brazier
    arrivalYaw: Math.PI, // Player faces North (-Z) toward Waystation Brazier
    returnTargetZone: 'level1',
    forwardPortalX: -88,
    forwardPortalZ: LEVEL2_CENTER_Z, // West Gate to Level 3 (Rimefang Abyss)
    forwardPortalFacingYaw: Math.PI / 2,
    forwardArrivalX: -82.4,
    forwardArrivalZ: LEVEL2_CENTER_Z,
    forwardArrivalYaw: Math.PI / 2,
    forwardTargetZone: 'level3',
    hearthX: 0,
    hearthZ: LEVEL2_CENTER_Z + 74, // z = -266 Waystation Brazier
    hearthWarmthRadius: 9.0,
    yieldMult: 1.55,
    xpMult: 1.75,
    chillMult: 1.85,
    difficultyMult: 3,
    enemyHpMult: 1.85,
    enemyDamageMult: 1.65,
  },
  level3: {
    id: 'level3',
    levelNumber: 3,
    name: 'Rimefang Abyss',
    subtitle: 'Shattered Glacier Trench · 9x Survival Difficulty & +135% Yield',
    centerX: LEVEL3_CENTER_X,
    centerZ: LEVEL3_CENTER_Z,
    radius: LEVEL3_RADIUS,
    clearingRadius: 14.0,
    portalX: LEVEL3_CENTER_X + 86, // x = -234 (East Return Gate to Level 2)
    portalZ: LEVEL3_CENTER_Z,
    portalFacingYaw: -Math.PI / 2, // Faces West (-X) into Rimefang Abyss
    arrivalX: LEVEL3_CENTER_X + 80.4, // x = -239.6
    arrivalZ: LEVEL3_CENTER_Z,
    arrivalYaw: -Math.PI / 2,
    returnTargetZone: 'level2',
    forwardPortalX: LEVEL3_CENTER_X,
    forwardPortalZ: LEVEL3_CENTER_Z + 88, // z = -252 (South Gate to Level 4: Obsidian Permafrost)
    forwardPortalFacingYaw: Math.PI,
    forwardArrivalX: LEVEL3_CENTER_X,
    forwardArrivalZ: LEVEL3_CENTER_Z + 82.4, // z = -257.6
    forwardArrivalYaw: Math.PI,
    forwardTargetZone: 'level4',
    hearthX: LEVEL3_CENTER_X + 74, // x = -246 Waystation Brazier
    hearthZ: LEVEL3_CENTER_Z,
    hearthWarmthRadius: 8.4,
    yieldMult: 2.35,
    xpMult: 2.8,
    chillMult: 3.1,
    difficultyMult: 9,
    enemyHpMult: 3.1,
    enemyDamageMult: 2.5,
  },
  level4: {
    id: 'level4',
    levelNumber: 4,
    name: 'Obsidian Permafrost',
    subtitle: 'Volcanic Frost Badlands · 27x Survival Difficulty & +260% Yield',
    centerX: LEVEL4_CENTER_X,
    centerZ: LEVEL4_CENTER_Z,
    radius: LEVEL4_RADIUS,
    clearingRadius: 14.5,
    portalX: LEVEL4_CENTER_X,
    portalZ: LEVEL4_CENTER_Z - 88, // z = -88 (North Return Gate to Level 3)
    portalFacingYaw: 0, // Faces South (+Z) into Obsidian Permafrost
    arrivalX: LEVEL4_CENTER_X,
    arrivalZ: LEVEL4_CENTER_Z - 82.4, // z = -82.4
    arrivalYaw: 0,
    returnTargetZone: 'level3',
    forwardPortalX: LEVEL4_CENTER_X + 88, // x = -232 (East Gate to Level 5: Starfall Eternal Zero)
    forwardPortalZ: LEVEL4_CENTER_Z,
    forwardPortalFacingYaw: -Math.PI / 2,
    forwardArrivalX: LEVEL4_CENTER_X + 82.4, // x = -237.6
    forwardArrivalZ: LEVEL4_CENTER_Z,
    forwardArrivalYaw: -Math.PI / 2,
    forwardTargetZone: 'level5',
    hearthX: LEVEL4_CENTER_X,
    hearthZ: LEVEL4_CENTER_Z - 76, // z = -76 Waystation Brazier
    hearthWarmthRadius: 7.8,
    yieldMult: 3.6,
    xpMult: 4.5,
    chillMult: 4.8,
    difficultyMult: 27,
    enemyHpMult: 5.2,
    enemyDamageMult: 3.7,
  },
  level5: {
    id: 'level5',
    levelNumber: 5,
    name: 'Starfall Eternal Zero',
    subtitle: 'Apex Polar Terminus · 81x Survival Difficulty & +450% Yield',
    centerX: LEVEL5_CENTER_X,
    centerZ: LEVEL5_CENTER_Z,
    radius: LEVEL5_RADIUS,
    clearingRadius: 15.0,
    portalX: LEVEL5_CENTER_X - 88, // x = 232 (West Return Gate to Level 4 / Level 2)
    portalZ: LEVEL5_CENTER_Z,
    portalFacingYaw: Math.PI / 2, // Faces East (+X) into Starfall Eternal Zero
    arrivalX: LEVEL5_CENTER_X - 82.4, // x = 237.6
    arrivalZ: LEVEL5_CENTER_Z,
    arrivalYaw: Math.PI / 2,
    returnTargetZone: 'level4',
    hearthX: LEVEL5_CENTER_X - 76, // x = 244 Waystation Brazier
    hearthZ: LEVEL5_CENTER_Z,
    hearthWarmthRadius: 7.2,
    yieldMult: 5.5,
    xpMult: 7.5,
    chillMult: 7.2,
    difficultyMult: 81,
    enemyHpMult: 8.5,
    enemyDamageMult: 5.4,
  },
  city: {
    id: 'city',
    levelNumber: 6,
    name: 'Frostcave City',
    subtitle: 'Subterranean Glacial Cavern · Coins & Meat Bazaar',
    centerX: CITY_CENTER_X,
    centerZ: CITY_CENTER_Z,
    radius: CITY_RADIUS,
    clearingRadius: 44,
    portalX: CITY_CENTER_X - 62, // x = 222 (West City Gate)
    portalZ: 0,
    portalFacingYaw: Math.PI / 2, // Faces East (+X) down Main Avenue
    arrivalX: CITY_CENTER_X - 56.4, // x = 227.6, safely clear of vortex
    arrivalZ: 0,
    arrivalYaw: Math.PI / 2, // Faces East (+X) into City Square
    returnTargetZone: 'level1',
    hearthX: CITY_CENTER_X,
    hearthZ: CITY_CENTER_Z, // Central Clocktower Hearth Fountain
    hearthWarmthRadius: 68, // Sheltered & heated inside City streets
    yieldMult: 1.0,
    xpMult: 1.0,
    chillMult: 0.25,
    difficultyMult: 3,
    enemyHpMult: 1.5,
    enemyDamageMult: 1.4,
  },
};

export function getZoneSpec(zone: ZoneId): ZoneSpec {
  return ZONE_SPECS[zone];
}

export function getZoneDifficultyMultiplier(zone: ZoneId): number {
  return ZONE_SPECS[zone].difficultyMult;
}

export function computeZoneCombatScale(zone: ZoneId): {
  difficultyMult: number;
  enemyHpScale: number;
  enemyDamageScale: number;
  chillMult: number;
} {
  const spec = ZONE_SPECS[zone];
  return {
    difficultyMult: spec.difficultyMult,
    enemyHpScale: spec.enemyHpMult,
    enemyDamageScale: spec.enemyDamageMult,
    chillMult: spec.chillMult,
  };
}

export function getOppositeZone(zone: ZoneId): ZoneId {
  return ZONE_SPECS[zone].returnTargetZone;
}

export function clampToZoneBounds(
  x: number,
  z: number,
  zone: ZoneId,
  margin = 1.5,
): { x: number; z: number; clamped: boolean } {
  const spec = ZONE_SPECS[zone];
  const dx = x - spec.centerX;
  const dz = z - spec.centerZ;
  const maxR = Math.max(4, spec.radius - margin);
  const dist = Math.hypot(dx, dz);
  if (dist > maxR && dist > 0.0001) {
    const scale = maxR / dist;
    return {
      x: spec.centerX + dx * scale,
      z: spec.centerZ + dz * scale,
      clamped: true,
    };
  }
  return { x, z, clamped: false };
}

export function cardinalBearingFromDelta(dx: number, dz: number): string {
  const dist = Math.hypot(dx, dz);
  if (dist < 0.5) return 'Here';
  // -Z is North, +Z is South, +X is East, -X is West
  const angle = Math.atan2(dx, -dz); // 0 = N, PI/2 = E, PI = S, -PI/2 = W
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return 'N';
  if (deg < 67.5) return 'NE';
  if (deg < 112.5) return 'E';
  if (deg < 157.5) return 'SE';
  if (deg < 202.5) return 'S';
  if (deg < 247.5) return 'SW';
  if (deg < 292.5) return 'W';
  return 'NW';
}

export interface PortalProximityResult {
  dist: number;
  direction: string;
  nearInteract: boolean;
  insideVortex: boolean;
}

export function computePortalProximity(
  playerX: number,
  playerZ: number,
  zone: ZoneId,
): PortalProximityResult {
  const spec = ZONE_SPECS[zone];
  const dx = spec.portalX - playerX;
  const dz = spec.portalZ - playerZ;
  const dist = Math.hypot(dx, dz);
  return {
    dist,
    direction: cardinalBearingFromDelta(dx, dz),
    nearInteract: dist <= PORTAL_INTERACT_RADIUS,
    insideVortex: dist <= PORTAL_VORTEX_RADIUS,
  };
}

export function computeForwardPortalProximity(
  playerX: number,
  playerZ: number,
  zone: ZoneId,
): PortalProximityResult | null {
  const spec = ZONE_SPECS[zone];
  if (
    spec.forwardPortalX === undefined ||
    spec.forwardPortalZ === undefined ||
    zone === 'level1'
  ) {
    return null;
  }
  const dx = spec.forwardPortalX - playerX;
  const dz = spec.forwardPortalZ - playerZ;
  const dist = Math.hypot(dx, dz);
  return {
    dist,
    direction: cardinalBearingFromDelta(dx, dz),
    nearInteract: dist <= PORTAL_INTERACT_RADIUS,
    insideVortex: dist <= PORTAL_VORTEX_RADIUS,
  };
}

export function computeCityPortalProximity(
  playerX: number,
  playerZ: number,
  zone: ZoneId,
): PortalProximityResult {
  if (zone !== 'level1' && zone !== 'city') {
    const spec = ZONE_SPECS[zone];
    return {
      dist: Math.round(Math.hypot(spec.portalX - playerX, spec.portalZ - playerZ)),
      direction: 'S',
      nearInteract: false,
      insideVortex: false,
    };
  }
  const px = zone === 'city' ? ZONE_SPECS.city.portalX : LEVEL1_CITY_PORTAL_X;
  const pz = zone === 'city' ? ZONE_SPECS.city.portalZ : LEVEL1_CITY_PORTAL_Z;
  const dx = px - playerX;
  const dz = pz - playerZ;
  const dist = Math.hypot(dx, dz);
  return {
    dist,
    direction: cardinalBearingFromDelta(dx, dz),
    nearInteract: dist <= PORTAL_INTERACT_RADIUS,
    insideVortex: dist <= PORTAL_VORTEX_RADIUS,
  };
}

export type PortalRouteKind =
  | 'to_level1'
  | 'to_level2'
  | 'to_level3'
  | 'to_level4'
  | 'to_level5'
  | 'to_city';

function routeForTargetZone(target: ZoneId): PortalRouteKind {
  switch (target) {
    case 'level1':
      return 'to_level1';
    case 'level2':
      return 'to_level2';
    case 'level3':
      return 'to_level3';
    case 'level4':
      return 'to_level4';
    case 'level5':
      return 'to_level5';
    case 'city':
      return 'to_city';
  }
}

export function computeNearestZonePortal(
  playerX: number,
  playerZ: number,
  zone: ZoneId,
): PortalProximityResult & { route: PortalRouteKind } {
  if (zone === 'level1') {
    const north = computePortalProximity(playerX, playerZ, 'level1');
    const eastCity = computeCityPortalProximity(playerX, playerZ, 'level1');
    if (eastCity.dist < north.dist) {
      return { ...eastCity, route: 'to_city' };
    }
    return { ...north, route: 'to_level2' };
  }

  const spec = ZONE_SPECS[zone];
  const primary = computePortalProximity(playerX, playerZ, zone);
  const forward = computeForwardPortalProximity(playerX, playerZ, zone);
  if (forward && spec.forwardTargetZone && forward.dist < primary.dist) {
    return { ...forward, route: routeForTargetZone(spec.forwardTargetZone) };
  }
  return { ...primary, route: routeForTargetZone(spec.returnTargetZone) };
}

export function getDestinationAfterPortal(
  fromZone: ZoneId,
  route?: PortalRouteKind,
): {
  zone: ZoneId;
  x: number;
  z: number;
  yaw: number;
} {
  if (fromZone === 'city') {
    return {
      zone: 'level1',
      x: LEVEL1_CITY_ARRIVAL_X,
      z: LEVEL1_CITY_ARRIVAL_Z,
      yaw: LEVEL1_CITY_ARRIVAL_YAW,
    };
  }
  if (fromZone === 'level1' && route === 'to_city') {
    const citySpec = ZONE_SPECS.city;
    return {
      zone: 'city',
      x: citySpec.arrivalX,
      z: citySpec.arrivalZ,
      yaw: citySpec.arrivalYaw,
    };
  }

  const fromSpec = ZONE_SPECS[fromZone];
  // Check if traveling forward into the next survival zone
  if (
    fromSpec.forwardTargetZone &&
    route === routeForTargetZone(fromSpec.forwardTargetZone)
  ) {
    const nextSpec = ZONE_SPECS[fromSpec.forwardTargetZone];
    return {
      zone: nextSpec.id,
      x: nextSpec.arrivalX,
      z: nextSpec.arrivalZ,
      yaw: nextSpec.arrivalYaw,
    };
  }

  // Returning to the previous zone: land at that zone's forward portal arrival if returning from its forwardTargetZone
  const returnZone = fromSpec.returnTargetZone;
  const returnSpec = ZONE_SPECS[returnZone];
  if (
    returnSpec.forwardTargetZone === fromZone &&
    returnSpec.forwardArrivalX !== undefined &&
    returnSpec.forwardArrivalZ !== undefined
  ) {
    return {
      zone: returnZone,
      x: returnSpec.forwardArrivalX,
      z: returnSpec.forwardArrivalZ,
      yaw: returnSpec.forwardArrivalYaw ?? returnSpec.arrivalYaw,
    };
  }

  return {
    zone: returnZone,
    x: returnSpec.arrivalX,
    z: returnSpec.arrivalZ,
    yaw: returnSpec.arrivalYaw,
  };
}

export function buildZoneHudInfo(
  zone: ZoneId,
  playerX: number,
  playerZ: number,
  playerYaw = Math.PI,
): ZoneHudInfo {
  const spec = ZONE_SPECS[zone];
  const prox = computePortalProximity(playerX, playerZ, zone);
  const forwardProx = computeForwardPortalProximity(playerX, playerZ, zone);
  const cityProx =
    zone === 'level1' ? computeCityPortalProximity(playerX, playerZ, 'level1') : null;
  const forwardSpec = spec.forwardTargetZone ? ZONE_SPECS[spec.forwardTargetZone] : null;
  const returnSpec = ZONE_SPECS[spec.returnTargetZone];

  return {
    id: spec.id,
    levelNumber: spec.levelNumber,
    name: spec.name,
    subtitle: spec.subtitle,
    playerX: Math.round(playerX * 10) / 10,
    playerZ: Math.round(playerZ * 10) / 10,
    playerYaw,
    portalDistance: Math.round(prox.dist),
    portalDirection: prox.direction,
    nearPortal: prox.nearInteract,
    returnZoneId: returnSpec.id,
    returnZoneName: returnSpec.name,
    ...(forwardProx && forwardSpec
      ? {
          forwardPortalDistance: Math.round(forwardProx.dist),
          forwardPortalDirection: forwardProx.direction,
          nearForwardPortal: forwardProx.nearInteract,
          forwardZoneId: forwardSpec.id,
          forwardZoneName: forwardSpec.name,
        }
      : {}),
    ...(cityProx
      ? {
          cityPortalDistance: Math.round(cityProx.dist),
          cityPortalDirection: cityProx.direction,
          nearCityPortal: cityProx.nearInteract,
        }
      : {}),
    yieldMult: spec.yieldMult,
    xpMult: spec.xpMult,
    chillMult: spec.chillMult,
    difficultyMult: spec.difficultyMult,
  };
}
