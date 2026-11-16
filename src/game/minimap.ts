import type { ZoneId } from './types';
import {
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  ZONE_SPECS,
  cardinalBearingFromDelta,
} from './zones';

export const MINIMAP_WIDTH = 280;
export const MINIMAP_HEIGHT = 272;
export const MINIMAP_PADDING_Y = 20;
export const MINIMAP_WORLD_Z_MIN = -360;
export const MINIMAP_WORLD_Z_MAX = 132;
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
  cityZone: MinimapCircle;
  camp: MinimapPoint;
  portal1: MinimapPoint;
  portal2: MinimapPoint;
  cityPortal1: MinimapPoint;
  cityPortal2: MinimapPoint;
  cityFountain: MinimapPoint;
  brazier: MinimapPoint;
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
  const sc = ZONE_SPECS.city;

  const c1 = worldToMinimap(s1.centerX, s1.centerZ);
  const c2 = worldToMinimap(s2.centerX, s2.centerZ);
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
    cityZone: {
      ...cc,
      r: Math.round(sc.radius * MINIMAP_SCALE * 100) / 100,
    },
    camp: worldToMinimap(s1.hearthX, s1.hearthZ),
    portal1: worldToMinimap(s1.portalX, s1.portalZ),
    portal2: worldToMinimap(s2.portalX, s2.portalZ),
    cityPortal1: worldToMinimap(LEVEL1_CITY_PORTAL_X, LEVEL1_CITY_PORTAL_Z),
    cityPortal2: worldToMinimap(sc.portalX, sc.portalZ),
    cityFountain: worldToMinimap(sc.hearthX, sc.hearthZ),
    brazier: worldToMinimap(s2.hearthX, s2.hearthZ),
    player: {
      ...playerPt,
      headingDeg: yawToMinimapDegrees(playerYaw),
    },
    hearthDistance: Math.round(Math.hypot(dxHearth, dzHearth)),
    hearthDirection: cardinalBearingFromDelta(dxHearth, dzHearth),
  };
}
