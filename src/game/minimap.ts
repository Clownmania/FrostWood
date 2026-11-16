import type { ZoneId } from './types';
import {
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  ZONE_SPECS,
  cardinalBearingFromDelta,
} from './zones';

export const MINIMAP_WIDTH = 340;
export const MINIMAP_HEIGHT = 272;
export const MINIMAP_PADDING_Y = 20;
export const MINIMAP_WORLD_Z_MIN = -515;
export const MINIMAP_WORLD_Z_MAX = 185;
export const MINIMAP_SCALE =
  (MINIMAP_HEIGHT - MINIMAP_PADDING_Y * 2) /
  (MINIMAP_WORLD_Z_MAX - MINIMAP_WORLD_Z_MIN);

export interface MinimapPoint {
  x: number;
  y: number;
}

export interface MinimapCircle extends MinimapPoint {
  r: number;
}

export interface MinimapLayout {
  width: number;
  height: number;
  activeZone: ZoneId;
  level1Zone: MinimapCircle;
  level2Zone: MinimapCircle;
  level3Zone: MinimapCircle;
  level4Zone: MinimapCircle;
  level5Zone: MinimapCircle;
  cityZone: MinimapCircle;
  camp: MinimapPoint;
  portal1: MinimapPoint;
  portal2: MinimapPoint;
  portal2Forward: MinimapPoint;
  portal3Return: MinimapPoint;
  portal3Forward: MinimapPoint;
  portal4Return: MinimapPoint;
  portal4Forward: MinimapPoint;
  portal5Return: MinimapPoint;
  cityPortal1: MinimapPoint;
  cityPortal2: MinimapPoint;
  cityFountain: MinimapPoint;
  brazier: MinimapPoint;
  brazier3: MinimapPoint;
  brazier4: MinimapPoint;
  brazier5: MinimapPoint;
  player: MinimapPoint & { headingDeg: number };
  hearthDistance: number;
  hearthDirection: string;
}

export function worldToMinimap(worldX: number, worldZ: number): MinimapPoint {
  const x = MINIMAP_WIDTH * 0.5 + worldX * MINIMAP_SCALE;
  const y = MINIMAP_PADDING_Y + (worldZ - MINIMAP_WORLD_Z_MIN) * MINIMAP_SCALE;
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  };
}

/**
 * Converts Three.js world yaw (where forward is (sin(yaw), cos(yaw)) and -Z is North)
 * into North-Up SVG rotation degrees (0 deg points straight up toward -Y).
 */
export function yawToMinimapDegrees(yaw: number): number {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  return Math.round(Math.atan2(fx, -fz) * (180 / Math.PI) * 10) / 10;
}

export function computeMinimapLayout(
  playerX: number,
  playerZ: number,
  playerYaw: number,
  activeZone: ZoneId,
): MinimapLayout {
  const s1 = ZONE_SPECS.level1;
  const s2 = ZONE_SPECS.level2;
  const s3 = ZONE_SPECS.level3;
  const s4 = ZONE_SPECS.level4;
  const s5 = ZONE_SPECS.level5;
  const sc = ZONE_SPECS.city;

  const c1 = worldToMinimap(s1.centerX, s1.centerZ);
  const c2 = worldToMinimap(s2.centerX, s2.centerZ);
  const c3 = worldToMinimap(s3.centerX, s3.centerZ);
  const c4 = worldToMinimap(s4.centerX, s4.centerZ);
  const c5 = worldToMinimap(s5.centerX, s5.centerZ);
  const cc = worldToMinimap(sc.centerX, sc.centerZ);
  const playerPt = worldToMinimap(playerX, playerZ);

  const activeSpec = ZONE_SPECS[activeZone];
  const dxHearth = activeSpec.hearthX - playerX;
  const dzHearth = activeSpec.hearthZ - playerZ;

  return {
    width: MINIMAP_WIDTH,
    height: MINIMAP_HEIGHT,
    activeZone,
    level1Zone: {
      ...c1,
      r: Math.round(s1.radius * MINIMAP_SCALE * 100) / 100,
    },
    level2Zone: {
      ...c2,
      r: Math.round(s2.radius * MINIMAP_SCALE * 100) / 100,
    },
    level3Zone: {
      ...c3,
      r: Math.round(s3.radius * MINIMAP_SCALE * 100) / 100,
    },
    level4Zone: {
      ...c4,
      r: Math.round(s4.radius * MINIMAP_SCALE * 100) / 100,
    },
    level5Zone: {
      ...c5,
      r: Math.round(s5.radius * MINIMAP_SCALE * 100) / 100,
    },
    cityZone: {
      ...cc,
      r: Math.round(sc.radius * MINIMAP_SCALE * 100) / 100,
    },
    camp: worldToMinimap(s1.hearthX, s1.hearthZ),
    portal1: worldToMinimap(s1.portalX, s1.portalZ),
    portal2: worldToMinimap(s2.portalX, s2.portalZ),
    portal2Forward: worldToMinimap(s2.forwardPortalX ?? s2.portalX, s2.forwardPortalZ ?? s2.portalZ),
    portal3Return: worldToMinimap(s3.portalX, s3.portalZ),
    portal3Forward: worldToMinimap(s3.forwardPortalX ?? s3.portalX, s3.forwardPortalZ ?? s3.portalZ),
    portal4Return: worldToMinimap(s4.portalX, s4.portalZ),
    portal4Forward: worldToMinimap(s4.forwardPortalX ?? s4.portalX, s4.forwardPortalZ ?? s4.portalZ),
    portal5Return: worldToMinimap(s5.portalX, s5.portalZ),
    cityPortal1: worldToMinimap(LEVEL1_CITY_PORTAL_X, LEVEL1_CITY_PORTAL_Z),
    cityPortal2: worldToMinimap(sc.portalX, sc.portalZ),
    cityFountain: worldToMinimap(sc.hearthX, sc.hearthZ),
    brazier: worldToMinimap(s2.hearthX, s2.hearthZ),
    brazier3: worldToMinimap(s3.hearthX, s3.hearthZ),
    brazier4: worldToMinimap(s4.hearthX, s4.hearthZ),
    brazier5: worldToMinimap(s5.hearthX, s5.hearthZ),
    player: {
      ...playerPt,
      headingDeg: yawToMinimapDegrees(playerYaw),
    },
    hearthDistance: Math.round(Math.hypot(dxHearth, dzHearth)),
    hearthDirection: cardinalBearingFromDelta(dxHearth, dzHearth),
  };
}
