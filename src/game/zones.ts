import type { ZoneHudInfo, ZoneId } from './types';

export const LEVEL1_RADIUS = 116;
export const LEVEL2_RADIUS = 102;
export const LEVEL2_CENTER_Z = -240;

export const CITY_RADIUS = 68;
export const CITY_CENTER_X = 186;
export const CITY_CENTER_Z = 0;

export const LEVEL1_CITY_PORTAL_X = 68;
export const LEVEL1_CITY_PORTAL_Z = 0;
export const LEVEL1_CITY_ARRIVAL_X = 62.6;
export const LEVEL1_CITY_ARRIVAL_Z = 0;
export const LEVEL1_CITY_ARRIVAL_YAW = -Math.PI / 2;

export const PORTAL_INTERACT_RADIUS = 6.2;
export const PORTAL_VORTEX_RADIUS = 1.65;
export const PORTAL_COOLDOWN_SECONDS = 1.4;

export interface ZoneSpec {
  id: ZoneId;
  levelNumber: 1 | 2 | 3;
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
  hearthX: number;
  hearthZ: number;
  hearthWarmthRadius: number;
  yieldMult: number;
  xpMult: number;
  chillMult: number;
}

export const ZONE_SPECS: Record<ZoneId, ZoneSpec> = {
  level1: {
    id: 'level1',
    levelNumber: 1,
    name: 'Frostwood Valley',
    subtitle: 'Frontier Camp & Deep Timberlands',
    centerX: 0,
    centerZ: 0,
    radius: LEVEL1_RADIUS,
    clearingRadius: 13.5,
    portalX: 0,
    portalZ: -68,
    portalFacingYaw: 0, // Faces South (+Z) toward camp
    arrivalX: 0,
    arrivalZ: -63.4,
    arrivalYaw: 0, // Player faces South (+Z) away from Northgate Portal
    hearthX: 0,
    hearthZ: 0,
    hearthWarmthRadius: 8.5,
    yieldMult: 1.0,
    xpMult: 1.0,
    chillMult: 1.0,
  },
  level2: {
    id: 'level2',
    levelNumber: 2,
    name: 'Glacial Highlands',
    subtitle: 'Northern Summit · +45% Yield & Apex Fauna',
    centerX: 0,
    centerZ: LEVEL2_CENTER_Z,
    radius: LEVEL2_RADIUS,
    clearingRadius: 11.5,
    portalX: 0,
    portalZ: LEVEL2_CENTER_Z + 62, // z = -178 (South entrance of Level 2)
    portalFacingYaw: Math.PI, // Faces North (-Z) into Glacial Highlands
    arrivalX: 0,
    arrivalZ: LEVEL2_CENTER_Z + 56.2, // z = -183.8, clear of portal lintel & beside Waystation Brazier
    arrivalYaw: Math.PI, // Player faces North (-Z) toward Glacial Highlands
    hearthX: 0,
    hearthZ: LEVEL2_CENTER_Z + 52, // z = -188 Waystation Brazier
    hearthWarmthRadius: 9.0,
    yieldMult: 1.45,
    xpMult: 1.5,
    chillMult: 1.18,
  },
  city: {
    id: 'city',
    levelNumber: 3,
    name: 'Frostcave City',
    subtitle: 'Subterranean Glacial Cavern · Coins & Meat Bazaar',
    centerX: CITY_CENTER_X,
    centerZ: CITY_CENTER_Z,
    radius: CITY_RADIUS,
    clearingRadius: 34,
    portalX: CITY_CENTER_X - 46, // x = 140 (West City Gate)
    portalZ: 0,
    portalFacingYaw: Math.PI / 2, // Faces East (+X) down Main Avenue
    arrivalX: CITY_CENTER_X - 40.4, // x = 145.6, safely clear of vortex
    arrivalZ: 0,
    arrivalYaw: Math.PI / 2, // Faces East (+X) into City Square
    hearthX: CITY_CENTER_X,
    hearthZ: CITY_CENTER_Z, // Central Clocktower Hearth Fountain
    hearthWarmthRadius: 52, // Sheltered & heated inside City streets
    yieldMult: 1.0,
    xpMult: 1.0,
    chillMult: 0.25,
  },
};

export function getZoneSpec(zone: ZoneId): ZoneSpec {
  return ZONE_SPECS[zone];
}

export function getOppositeZone(zone: ZoneId): ZoneId {
  return zone === 'level1' ? 'level2' : 'level1';
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

export function computeCityPortalProximity(
  playerX: number,
  playerZ: number,
  zone: ZoneId,
): PortalProximityResult {
  if (zone === 'level2') {
    const spec = ZONE_SPECS.level2;
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

export type PortalRouteKind = 'to_level2' | 'to_city' | 'to_level1';

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
  const primary = computePortalProximity(playerX, playerZ, zone);
  return { ...primary, route: 'to_level1' };
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
  const nextZone = getOppositeZone(fromZone);
  const spec = ZONE_SPECS[nextZone];
  return {
    zone: nextZone,
    x: spec.arrivalX,
    z: spec.arrivalZ,
    yaw: spec.arrivalYaw,
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
  const cityProx =
    zone === 'level1' ? computeCityPortalProximity(playerX, playerZ, 'level1') : null;
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
    ...(cityProx
      ? {
          cityPortalDistance: Math.round(cityProx.dist),
          cityPortalDirection: cityProx.direction,
          nearCityPortal: cityProx.nearInteract,
        }
      : {}),
    yieldMult: spec.yieldMult,
    xpMult: spec.xpMult,
  };
}
