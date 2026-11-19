import type { WeatherKind, ZoneId } from './types';
import { ZONE_SPECS } from './zones';
import { FISHING_LAKE_CENTER, FISHING_LAKE_RADIUS } from './fishing';

export type WorldLandmarkKind =
  | 'fishing_cabin'
  | 'abandoned_boat'
  | 'hunting_cabin'
  | 'hunting_lodge'
  | 'campsite'
  | 'ice_cave'
  | 'research_station'
  | 'mountain_shelter'
  | 'radar_mast'
  | 'watchtower'
  | 'frozen_waterfall'
  | 'tundra_ruin'
  | 'settlement_house'
  | 'settlement_shop'
  | 'settlement_warehouse'
  | 'settlement_hospital'
  | 'hospital_interior'
  | 'broken_vehicle'
  | 'supply_container'
  | 'cargo_crates';

export type EnvModelKey =
  | 'cabin_wood'
  | 'cabin_lodge'
  | 'cave_entrance'
  | 'watchtower'
  | 'expedition_tent'
  | 'research_lab'
  | 'research_dome'
  | 'supply_container'
  | 'cargo_crates'
  | 'radar_tower'
  | 'arctic_truck'
  | 'ruined_house_a'
  | 'ruined_shop'
  | 'ruined_warehouse'
  | 'ruined_hospital'
  | 'abandoned_car_sedan'
  | 'abandoned_car_wagon'
  | 'abandoned_car_patrol';

export const ENV_MODEL_URLS: Record<EnvModelKey, string> = {
  cabin_wood: '/models/env/cabin_wood.glb',
  cabin_lodge: '/models/env/cabin_lodge.glb',
  cave_entrance: '/models/env/cave_entrance.glb',
  watchtower: '/models/env/watchtower.glb',
  expedition_tent: '/models/env/expedition_tent.glb',
  research_lab: '/models/env/research_lab.glb',
  research_dome: '/models/env/research_dome.glb',
  supply_container: '/models/env/supply_container.glb',
  cargo_crates: '/models/env/cargo_crates.glb',
  radar_tower: '/models/env/radar_tower.glb',
  arctic_truck: '/models/env/arctic_truck.glb',
  ruined_house_a: '/models/env/ruined_house_a.glb',
  ruined_shop: '/models/env/ruined_shop.glb',
  ruined_warehouse: '/models/env/ruined_warehouse.glb',
  ruined_hospital: '/models/env/ruined_hospital.glb',
  abandoned_car_sedan: '/models/env/abandoned_car_sedan.glb',
  abandoned_car_wagon: '/models/env/abandoned_car_wagon.glb',
  abandoned_car_patrol: '/models/env/abandoned_car_patrol.glb',
};

export interface WorldBiomeProfile {
  zone: ZoneId;
  biomeName: string;
  tagline: string;
  fogDensityMult: number;
  windSpeedMult: number;
  snowOpacityMult: number;
  gustMult: number;
  coldExposureMult: number;
  extraTreeCount: number;
  extraBoulderCount: number;
  hasFrozenRiver: boolean;
  hasSettlementRoads: boolean;
  hasWaterfalls: boolean;
  skyTintHex: number;
}

export const WORLD_BIOME_PROFILES: Record<ZoneId, WorldBiomeProfile> = {
  level1: {
    zone: 'level1',
    biomeName: 'Zone 1 — Frozen Lake Sanctuary',
    tagline: 'Central glacial lake with rocky islands, fishing cabins, and thin-ice vents',
    fogDensityMult: 0.94,
    windSpeedMult: 1.0,
    snowOpacityMult: 1.0,
    gustMult: 1.0,
    coldExposureMult: 1.0,
    extraTreeCount: 84,
    extraBoulderCount: 28,
    hasFrozenRiver: false,
    hasSettlementRoads: false,
    hasWaterfalls: false,
    skyTintHex: 0xd8ecff,
  },
  level2: {
    zone: 'level2',
    biomeName: 'Zone 2 — Frozen Pine Forest',
    tagline: 'Dense snow-laden evergreens, trapper cabins, mist banks, and hidden ice caves',
    fogDensityMult: 1.24,
    windSpeedMult: 1.12,
    snowOpacityMult: 1.18,
    gustMult: 1.15,
    coldExposureMult: 1.12,
    extraTreeCount: 210,
    extraBoulderCount: 44,
    hasFrozenRiver: false,
    hasSettlementRoads: false,
    hasWaterfalls: false,
    skyTintHex: 0xc5dced,
  },
  level3: {
    zone: 'level3',
    biomeName: 'Zone 3 — Snow Mountains',
    tagline: 'Steep alpine peaks, frozen glacial waterfalls, icy caves, and abandoned research posts',
    fogDensityMult: 1.38,
    windSpeedMult: 1.52,
    snowOpacityMult: 1.32,
    gustMult: 1.65,
    coldExposureMult: 1.28,
    extraTreeCount: 56,
    extraBoulderCount: 78,
    hasFrozenRiver: false,
    hasSettlementRoads: false,
    hasWaterfalls: true,
    skyTintHex: 0xb9d2e8,
  },
  level4: {
    zone: 'level4',
    biomeName: 'Zone 4 — Frozen Tundra',
    tagline: 'Sweeping snow plains, meandering frozen rivers, ruined villages, and gale storms',
    fogDensityMult: 1.32,
    windSpeedMult: 1.62,
    snowOpacityMult: 1.36,
    gustMult: 1.72,
    coldExposureMult: 1.34,
    extraTreeCount: 38,
    extraBoulderCount: 54,
    hasFrozenRiver: true,
    hasSettlementRoads: false,
    hasWaterfalls: false,
    skyTintHex: 0xc2d4e4,
  },
  level5: {
    zone: 'level5',
    biomeName: 'Zone 5 — Abandoned Winter Settlement',
    tagline: 'Snow-buried streets, ruined hospital, arctic research complex, vehicles, and supply yards',
    fogDensityMult: 1.28,
    windSpeedMult: 1.35,
    snowOpacityMult: 1.26,
    gustMult: 1.4,
    coldExposureMult: 1.3,
    extraTreeCount: 46,
    extraBoulderCount: 42,
    hasFrozenRiver: false,
    hasSettlementRoads: true,
    hasWaterfalls: false,
    skyTintHex: 0xb8cada,
  },
  city: {
    zone: 'city',
    biomeName: 'Frostcave City',
    tagline: 'Subterranean glacial trade cavern sheltered from surface storms',
    fogDensityMult: 0.72,
    windSpeedMult: 0.25,
    snowOpacityMult: 0.2,
    gustMult: 0.2,
    coldExposureMult: 0.25,
    extraTreeCount: 0,
    extraBoulderCount: 0,
    hasFrozenRiver: false,
    hasSettlementRoads: false,
    hasWaterfalls: false,
    skyTintHex: 0x9ec0dc,
  },
};

export interface WorldLandmarkSpec {
  id: string;
  zone: Exclude<ZoneId, 'city'>;
  kind: WorldLandmarkKind;
  name: string;
  x: number;
  z: number;
  yaw: number;
  modelKey?: EnvModelKey;
  targetHeight?: number;
  collisionRadius: number;
  /** If true, standing within shelterRadius protects the survivor from blizzard chill. */
  isShelter?: boolean;
  shelterRadius?: number;
  /** Warm lantern/emergency glow beacon inside or beside the landmark. */
  warmLightHex?: number;
  /** Loot storytelling crate/beacon marker nearby. */
  hasLootBeacon?: boolean;
}

export interface LakeIslandSpec {
  id: string;
  x: number;
  z: number;
  radius: number;
  height: number;
  hasPine: boolean;
  hasCampLantern: boolean;
}

export interface WeakIcePatchSpec {
  id: string;
  zone: Exclude<ZoneId, 'city'>;
  x: number;
  z: number;
  radius: number;
  /** Minimum iceThickness required before this patch feels firm. */
  safeIceThreshold: number;
  label: string;
}

export interface RiverWaypoint {
  x: number;
  z: number;
  width: number;
}

const Z2 = ZONE_SPECS.level2;
const Z3 = ZONE_SPECS.level3;
const Z4 = ZONE_SPECS.level4;
const Z5 = ZONE_SPECS.level5;

/**
 * Frozen rocky islands scattered along the outer/mid pockets of Zone 1's massive Frozen Lake.
 * Positioned outside the central swimming lanes and fishing pier corridor.
 */
export const WORLD_LAKE_ISLANDS: readonly LakeIslandSpec[] = [
  {
    id: 'lake_island_north',
    x: FISHING_LAKE_CENTER.x - 9.8,
    z: FISHING_LAKE_CENTER.z - 9.6,
    radius: 3.1,
    height: 1.05,
    hasPine: true,
    hasCampLantern: true,
  },
  {
    id: 'lake_island_southwest',
    x: FISHING_LAKE_CENTER.x - 10.6,
    z: FISHING_LAKE_CENTER.z + 8.4,
    radius: 2.8,
    height: 0.92,
    hasPine: true,
    hasCampLantern: false,
  },
  {
    id: 'lake_island_south',
    x: FISHING_LAKE_CENTER.x + 6.4,
    z: FISHING_LAKE_CENTER.z + 11.4,
    radius: 2.35,
    height: 0.78,
    hasPine: false,
    hasCampLantern: true,
  },
];

/**
 * Weak-ice fracture hazard pockets across Zone 1's Frozen Lake and Zone 4's Frozen Tundra River.
 */
export const WORLD_WEAK_ICE_ZONES: readonly WeakIcePatchSpec[] = [
  {
    id: 'weak_ice_lake_north_vent',
    zone: 'level1',
    x: FISHING_LAKE_CENTER.x - 2.5,
    z: FISHING_LAKE_CENTER.z - 7.4,
    radius: 3.8,
    safeIceThreshold: 0.78,
    label: 'Thermal Thin Ice',
  },
  {
    id: 'weak_ice_lake_west_crack',
    zone: 'level1',
    x: FISHING_LAKE_CENTER.x - 8.2,
    z: FISHING_LAKE_CENTER.z + 0.6,
    radius: 3.5,
    safeIceThreshold: 0.72,
    label: 'Fractured Lake Shelf',
  },
  {
    id: 'weak_ice_lake_south_rift',
    zone: 'level1',
    x: FISHING_LAKE_CENTER.x + 1.4,
    z: FISHING_LAKE_CENTER.z + 7.2,
    radius: 3.6,
    safeIceThreshold: 0.74,
    label: 'Cracking Deep Ice',
  },
  {
    id: 'weak_ice_tundra_river_north',
    zone: 'level4',
    x: Z4.centerX - 18,
    z: Z4.centerZ - 26,
    radius: 4.5,
    safeIceThreshold: 0.95,
    label: 'Thin River Crossing',
  },
  {
    id: 'weak_ice_tundra_river_south',
    zone: 'level4',
    x: Z4.centerX + 20,
    z: Z4.centerZ + 32,
    radius: 4.6,
    safeIceThreshold: 0.95,
    label: 'Cracked Glacial Rapids',
  },
];

/**
 * Meandering frozen river spline slicing across Zone 4 (Frozen Tundra).
 */
export const WORLD_FROZEN_RIVER_POINTS: readonly RiverWaypoint[] = [
  { x: Z4.centerX - 78, z: Z4.centerZ - 76, width: 9.2 },
  { x: Z4.centerX - 46, z: Z4.centerZ - 48, width: 10.4 },
  { x: Z4.centerX - 18, z: Z4.centerZ - 24, width: 11.2 },
  { x: Z4.centerX + 4, z: Z4.centerZ + 4, width: 10.6 },
  { x: Z4.centerX + 22, z: Z4.centerZ + 34, width: 11.4 },
  { x: Z4.centerX + 52, z: Z4.centerZ + 62, width: 10.0 },
  { x: Z4.centerX + 82, z: Z4.centerZ + 86, width: 9.0 },
];

/**
 * Complete landmark & environmental storytelling registry across all 5 survival zones.
 * Every coordinate sits safely inside its zone's playable radius and avoids portals, hearths, and boss arenas.
 */
export const WORLD_LANDMARKS: readonly WorldLandmarkSpec[] = [
  // ================= ZONE 1 — FROZEN LAKE (CENTRAL AREA) =================
  {
    id: 'z1_fishing_cabin_north',
    zone: 'level1',
    kind: 'fishing_cabin',
    name: 'Northshore Fishing Cabin',
    x: FISHING_LAKE_CENTER.x + 2.5,
    z: FISHING_LAKE_CENTER.z - FISHING_LAKE_RADIUS - 6.5,
    yaw: 0.22,
    modelKey: 'cabin_wood',
    targetHeight: 4.6,
    collisionRadius: 2.6,
    isShelter: true,
    shelterRadius: 6.2,
    warmLightHex: 0xffa94d,
  },
  {
    id: 'z1_fishing_cabin_south',
    zone: 'level1',
    kind: 'fishing_cabin',
    name: 'Ice-Angler Boathouse',
    x: FISHING_LAKE_CENTER.x - 12.5,
    z: FISHING_LAKE_CENTER.z + FISHING_LAKE_RADIUS + 6.8,
    yaw: 2.75,
    modelKey: 'cabin_wood',
    targetHeight: 4.4,
    collisionRadius: 2.6,
    isShelter: true,
    shelterRadius: 6.0,
    warmLightHex: 0xffb366,
  },
  {
    id: 'z1_abandoned_boat_west',
    zone: 'level1',
    kind: 'abandoned_boat',
    name: 'Icebound Skiff',
    x: FISHING_LAKE_CENTER.x - FISHING_LAKE_RADIUS - 0.8,
    z: FISHING_LAKE_CENTER.z - 4.2,
    yaw: 0.65,
    collisionRadius: 1.4,
  },
  {
    id: 'z1_abandoned_boat_north',
    zone: 'level1',
    kind: 'abandoned_boat',
    name: 'Beached Fishing Dory',
    x: FISHING_LAKE_CENTER.x - 4.5,
    z: FISHING_LAKE_CENTER.z - FISHING_LAKE_RADIUS - 0.6,
    yaw: -0.45,
    collisionRadius: 1.4,
  },
  {
    id: 'z1_abandoned_boat_south',
    zone: 'level1',
    kind: 'abandoned_boat',
    name: 'Frost-Rimed Rowboat',
    x: FISHING_LAKE_CENTER.x + 9.2,
    z: FISHING_LAKE_CENTER.z + FISHING_LAKE_RADIUS - 1.2,
    yaw: 2.15,
    collisionRadius: 1.4,
  },
  {
    id: 'z1_lakeside_watchtower',
    zone: 'level1',
    kind: 'watchtower',
    name: 'Glacier Point Watchtower',
    x: FISHING_LAKE_CENTER.x - FISHING_LAKE_RADIUS - 14.5,
    z: FISHING_LAKE_CENTER.z + 2.5,
    yaw: Math.PI * 0.48,
    modelKey: 'watchtower',
    targetHeight: 8.8,
    collisionRadius: 2.8,
    warmLightHex: 0xff9b42,
  },

  // ================= ZONE 2 — FROZEN PINE FOREST =================
  {
    id: 'z2_hunting_lodge_west',
    zone: 'level2',
    kind: 'hunting_lodge',
    name: 'Abandoned Timber Lodge',
    x: Z2.centerX - 34,
    z: Z2.centerZ + 12,
    yaw: 0.72,
    modelKey: 'cabin_lodge',
    targetHeight: 6.2,
    collisionRadius: 3.6,
    isShelter: true,
    shelterRadius: 7.4,
    warmLightHex: 0xffaa44,
    hasLootBeacon: true,
  },
  {
    id: 'z2_hunting_cabin_east',
    zone: 'level2',
    kind: 'hunting_cabin',
    name: 'Old Trapper Cabin',
    x: Z2.centerX + 38,
    z: Z2.centerZ + 22,
    yaw: -0.85,
    modelKey: 'cabin_wood',
    targetHeight: 4.8,
    collisionRadius: 2.6,
    isShelter: true,
    shelterRadius: 6.2,
    warmLightHex: 0xffb35c,
  },
  {
    id: 'z2_campsite_north',
    zone: 'level2',
    kind: 'campsite',
    name: 'Snowed-In Hunter Camp',
    x: Z2.centerX - 18,
    z: Z2.centerZ - 32,
    yaw: 1.1,
    modelKey: 'expedition_tent',
    targetHeight: 3.1,
    collisionRadius: 1.8,
    isShelter: true,
    shelterRadius: 4.8,
    warmLightHex: 0xff7b29,
  },
  {
    id: 'z2_campsite_southeast',
    zone: 'level2',
    kind: 'campsite',
    name: 'Abandoned Forester Bivouac',
    x: Z2.centerX + 26,
    z: Z2.centerZ + 52,
    yaw: -0.5,
    modelKey: 'expedition_tent',
    targetHeight: 3.0,
    collisionRadius: 1.8,
    warmLightHex: 0xff8a3d,
  },
  {
    id: 'z2_hidden_pine_cave',
    zone: 'level2',
    kind: 'ice_cave',
    name: 'Hidden Pinewood Ice Cave',
    x: Z2.centerX - 58,
    z: Z2.centerZ - 46,
    yaw: 0.8,
    modelKey: 'cave_entrance',
    targetHeight: 5.8,
    collisionRadius: 3.0,
    isShelter: true,
    shelterRadius: 6.8,
    warmLightHex: 0x38bdf8,
    hasLootBeacon: true,
  },
  {
    id: 'z2_forest_crates',
    zone: 'level2',
    kind: 'cargo_crates',
    name: 'Trapper Supply Cache',
    x: Z2.centerX - 28,
    z: Z2.centerZ + 17,
    yaw: 0.4,
    modelKey: 'cargo_crates',
    targetHeight: 2.2,
    collisionRadius: 1.5,
  },

  // ================= ZONE 3 — SNOW MOUNTAINS =================
  {
    id: 'z3_research_station_main',
    zone: 'level3',
    kind: 'research_station',
    name: 'Alpine Research Outpost',
    x: Z3.centerX - 28,
    z: Z3.centerZ + 18,
    yaw: 0.52,
    modelKey: 'research_lab',
    targetHeight: 5.6,
    collisionRadius: 3.8,
    isShelter: true,
    shelterRadius: 8.2,
    warmLightHex: 0x38bdf8,
    hasLootBeacon: true,
  },
  {
    id: 'z3_mountain_storm_shelter',
    zone: 'level3',
    kind: 'mountain_shelter',
    name: 'Summit Storm Dome',
    x: Z3.centerX + 34,
    z: Z3.centerZ - 14,
    yaw: -0.65,
    modelKey: 'research_dome',
    targetHeight: 4.9,
    collisionRadius: 3.2,
    isShelter: true,
    shelterRadius: 7.4,
    warmLightHex: 0xff9e3d,
  },
  {
    id: 'z3_weather_radar_mast',
    zone: 'level3',
    kind: 'radar_mast',
    name: 'Abandoned Weather Telemetry Mast',
    x: Z3.centerX - 20,
    z: Z3.centerZ + 12,
    yaw: 0.25,
    modelKey: 'radar_tower',
    targetHeight: 11.4,
    collisionRadius: 2.1,
    warmLightHex: 0xef4444,
  },
  {
    id: 'z3_alpine_watchtower',
    zone: 'level3',
    kind: 'watchtower',
    name: 'Crag Ridge Lookout',
    x: Z3.centerX + 42,
    z: Z3.centerZ + 38,
    yaw: -1.1,
    modelKey: 'watchtower',
    targetHeight: 9.2,
    collisionRadius: 2.7,
    warmLightHex: 0xffb347,
  },
  {
    id: 'z3_frozen_waterfall_west',
    zone: 'level3',
    kind: 'frozen_waterfall',
    name: 'Glacier Veil Falls',
    x: Z3.centerX - 66,
    z: Z3.centerZ - 26,
    yaw: 0.95,
    collisionRadius: 4.5,
  },
  {
    id: 'z3_frozen_waterfall_north',
    zone: 'level3',
    kind: 'frozen_waterfall',
    name: 'Icicle Spire Cascade',
    x: Z3.centerX + 16,
    z: Z3.centerZ - 70,
    yaw: 0.15,
    collisionRadius: 4.5,
  },
  {
    id: 'z3_icy_cave_west',
    zone: 'level3',
    kind: 'ice_cave',
    name: 'Glacial Cavern Mouth',
    x: Z3.centerX - 58,
    z: Z3.centerZ - 54,
    yaw: 0.65,
    modelKey: 'cave_entrance',
    targetHeight: 6.2,
    collisionRadius: 3.1,
    isShelter: true,
    shelterRadius: 7.0,
    warmLightHex: 0x67e8f9,
    hasLootBeacon: true,
  },
  {
    id: 'z3_station_supplies',
    zone: 'level3',
    kind: 'cargo_crates',
    name: 'Expedition Core Samples',
    x: Z3.centerX - 35,
    z: Z3.centerZ + 22,
    yaw: 0.9,
    modelKey: 'cargo_crates',
    targetHeight: 2.4,
    collisionRadius: 1.5,
  },

  // ================= ZONE 4 — FROZEN TUNDRA =================
  {
    id: 'z4_ruined_village_a',
    zone: 'level4',
    kind: 'tundra_ruin',
    name: 'Abandoned Tundra Homestead',
    x: Z4.centerX - 38,
    z: Z4.centerZ + 24,
    yaw: 0.42,
    modelKey: 'cabin_wood',
    targetHeight: 4.5,
    collisionRadius: 2.6,
    isShelter: true,
    shelterRadius: 6.2,
    warmLightHex: 0xffa142,
  },
  {
    id: 'z4_ruined_village_b',
    zone: 'level4',
    kind: 'tundra_ruin',
    name: 'Snowbound Longhouse',
    x: Z4.centerX - 28,
    z: Z4.centerZ + 34,
    yaw: 1.75,
    modelKey: 'cabin_lodge',
    targetHeight: 5.8,
    collisionRadius: 3.5,
    isShelter: true,
    shelterRadius: 7.0,
    hasLootBeacon: true,
  },
  {
    id: 'z4_ruined_village_c',
    zone: 'level4',
    kind: 'tundra_ruin',
    name: 'Collapsed Furrier Hut',
    x: Z4.centerX - 46,
    z: Z4.centerZ + 36,
    yaw: -0.95,
    modelKey: 'cabin_wood',
    targetHeight: 4.2,
    collisionRadius: 2.5,
  },
  {
    id: 'z4_destroyed_camp_east',
    zone: 'level4',
    kind: 'campsite',
    name: 'Shattered Polar Camp',
    x: Z4.centerX + 40,
    z: Z4.centerZ - 26,
    yaw: -0.6,
    modelKey: 'expedition_tent',
    targetHeight: 3.1,
    collisionRadius: 1.8,
    isShelter: true,
    shelterRadius: 5.0,
    warmLightHex: 0xff8533,
  },
  {
    id: 'z4_destroyed_camp_crates',
    zone: 'level4',
    kind: 'cargo_crates',
    name: 'Frozen Sled Provisions',
    x: Z4.centerX + 45,
    z: Z4.centerZ - 22,
    yaw: 0.45,
    modelKey: 'cargo_crates',
    targetHeight: 2.3,
    collisionRadius: 1.5,
  },
  {
    id: 'z4_underground_ice_cave',
    zone: 'level4',
    kind: 'ice_cave',
    name: 'Permafrost Sinkhole Cave',
    x: Z4.centerX + 24,
    z: Z4.centerZ - 64,
    yaw: -0.22,
    modelKey: 'cave_entrance',
    targetHeight: 6.0,
    collisionRadius: 3.1,
    isShelter: true,
    shelterRadius: 7.2,
    warmLightHex: 0x38bdf8,
    hasLootBeacon: true,
  },

  // ================= ZONE 5 — ABANDONED WINTER SETTLEMENT =================
  {
    id: 'z5_hospital_complex',
    zone: 'level5',
    kind: 'settlement_hospital',
    name: 'St. Borealis Abandoned Hospital',
    x: Z5.centerX - 24,
    z: Z5.centerZ - 14,
    yaw: 0,
    modelKey: 'ruined_hospital',
    targetHeight: 9.2,
    collisionRadius: 4.5,
    isShelter: true,
    shelterRadius: 8.5,
    warmLightHex: 0x38bdf8,
    hasLootBeacon: true,
  },
  {
    id: 'z5_hospital_walkable_ward',
    zone: 'level5',
    kind: 'hospital_interior',
    name: 'Emergency Triage & Research Hall',
    x: Z5.centerX - 18,
    z: Z5.centerZ + 12,
    yaw: Math.PI * 0.5,
    collisionRadius: 0, // Walkable open-door interior hall!
    isShelter: true,
    shelterRadius: 7.6,
    warmLightHex: 0xf59e0b,
    hasLootBeacon: true,
  },
  {
    id: 'z5_arctic_research_wing',
    zone: 'level5',
    kind: 'research_station',
    name: 'Sector-9 Arctic Research Wing',
    x: Z5.centerX + 26,
    z: Z5.centerZ - 16,
    yaw: -Math.PI * 0.5,
    modelKey: 'research_lab',
    targetHeight: 6.2,
    collisionRadius: 3.8,
    isShelter: true,
    shelterRadius: 8.0,
    warmLightHex: 0x22d3ee,
    hasLootBeacon: true,
  },
  {
    id: 'z5_research_containment_dome',
    zone: 'level5',
    kind: 'mountain_shelter',
    name: 'Cryo-Lab Containment Dome',
    x: Z5.centerX + 36,
    z: Z5.centerZ - 26,
    yaw: -0.75,
    modelKey: 'research_dome',
    targetHeight: 5.2,
    collisionRadius: 3.2,
    isShelter: true,
    shelterRadius: 6.8,
  },
  {
    id: 'z5_ruined_house_nw',
    zone: 'level5',
    kind: 'settlement_house',
    name: 'Snow-Buried Residence',
    x: Z5.centerX - 42,
    z: Z5.centerZ - 32,
    yaw: 0.12,
    modelKey: 'ruined_house_a',
    targetHeight: 6.4,
    collisionRadius: 3.4,
  },
  {
    id: 'z5_ruined_shop_sw',
    zone: 'level5',
    kind: 'settlement_shop',
    name: 'Abandoned Provisioner Shop',
    x: Z5.centerX - 38,
    z: Z5.centerZ + 28,
    yaw: Math.PI * 0.5,
    modelKey: 'ruined_shop',
    targetHeight: 6.8,
    collisionRadius: 3.4,
    isShelter: true,
    shelterRadius: 6.5,
  },
  {
    id: 'z5_ruined_warehouse_east',
    zone: 'level5',
    kind: 'settlement_warehouse',
    name: 'Frozen Logistics Warehouse',
    x: Z5.centerX + 36,
    z: Z5.centerZ + 26,
    yaw: Math.PI,
    modelKey: 'ruined_warehouse',
    targetHeight: 7.4,
    collisionRadius: 4.0,
    isShelter: true,
    shelterRadius: 7.5,
    hasLootBeacon: true,
  },
  {
    id: 'z5_ruined_house_ne',
    zone: 'level5',
    kind: 'settlement_house',
    name: 'Derelict Quartermaster House',
    x: Z5.centerX + 46,
    z: Z5.centerZ + 4,
    yaw: -Math.PI * 0.5,
    modelKey: 'ruined_house_a',
    targetHeight: 6.2,
    collisionRadius: 3.4,
  },
  {
    id: 'z5_broken_sedan_avenue',
    zone: 'level5',
    kind: 'broken_vehicle',
    name: 'Snowed-In Civilian Sedan',
    x: Z5.centerX - 5.5,
    z: Z5.centerZ + 24,
    yaw: 0.35,
    modelKey: 'abandoned_car_sedan',
    targetHeight: 1.75,
    collisionRadius: 1.8,
  },
  {
    id: 'z5_broken_wagon_cross',
    zone: 'level5',
    kind: 'broken_vehicle',
    name: 'Abandoned Expedition Wagon',
    x: Z5.centerX + 12,
    z: Z5.centerZ - 4.5,
    yaw: 1.82,
    modelKey: 'abandoned_car_wagon',
    targetHeight: 1.85,
    collisionRadius: 1.9,
  },
  {
    id: 'z5_broken_patrol_car',
    zone: 'level5',
    kind: 'broken_vehicle',
    name: 'Frozen Security Cruiser',
    x: Z5.centerX - 10,
    z: Z5.centerZ - 26,
    yaw: -0.55,
    modelKey: 'abandoned_car_patrol',
    targetHeight: 1.8,
    collisionRadius: 1.85,
  },
  {
    id: 'z5_arctic_expedition_truck',
    zone: 'level5',
    kind: 'broken_vehicle',
    name: 'Derelict Polar Transport Truck',
    x: Z5.centerX + 20,
    z: Z5.centerZ + 32,
    yaw: -0.4,
    modelKey: 'arctic_truck',
    targetHeight: 3.2,
    collisionRadius: 2.6,
    hasLootBeacon: true,
  },
  {
    id: 'z5_military_container_a',
    zone: 'level5',
    kind: 'supply_container',
    name: 'Military Relief Container A',
    x: Z5.centerX + 22,
    z: Z5.centerZ + 12,
    yaw: 0.15,
    modelKey: 'supply_container',
    targetHeight: 2.9,
    collisionRadius: 2.4,
  },
  {
    id: 'z5_military_container_b',
    zone: 'level5',
    kind: 'supply_container',
    name: 'Military Relief Container B',
    x: Z5.centerX + 28,
    z: Z5.centerZ + 16,
    yaw: 1.62,
    modelKey: 'supply_container',
    targetHeight: 2.9,
    collisionRadius: 2.4,
  },
  {
    id: 'z5_supply_crates_yard',
    zone: 'level5',
    kind: 'cargo_crates',
    name: 'Evacuation Supply Pallet',
    x: Z5.centerX - 24,
    z: Z5.centerZ + 32,
    yaw: 0.6,
    modelKey: 'cargo_crates',
    targetHeight: 2.4,
    collisionRadius: 1.6,
  },
  {
    id: 'z5_comm_radar_tower',
    zone: 'level5',
    kind: 'radar_mast',
    name: 'Settlement Emergency Beacon Tower',
    x: Z5.centerX + 18,
    z: Z5.centerZ - 32,
    yaw: 0.3,
    modelKey: 'radar_tower',
    targetHeight: 11.8,
    collisionRadius: 2.2,
    warmLightHex: 0xef4444,
  },
];

export function getLandmarksForZone(zone: ZoneId): WorldLandmarkSpec[] {
  if (zone === 'city') return [];
  return WORLD_LANDMARKS.filter((lm) => lm.zone === zone);
}

export interface NaturalShelterMatch {
  landmarkId: string;
  name: string;
  warmthBonus: number;
}

/**
 * Checks whether the survivor is sheltered inside or immediately beside an abandoned cabin,
 * hunting lodge, ice cave, mountain storm dome, or Zone 5 hospital/research facility.
 */
export function isInsideNaturalShelter(
  x: number,
  z: number,
  zone: ZoneId,
): NaturalShelterMatch | null {
  if (zone === 'city') return null;
  for (const lm of WORLD_LANDMARKS) {
    if (lm.zone !== zone || !lm.isShelter) continue;
    const r = lm.shelterRadius ?? 6.0;
    const d = Math.hypot(x - lm.x, z - lm.z);
    if (d <= r) {
      return {
        landmarkId: lm.id,
        name: lm.name,
        warmthBonus: lm.kind === 'hospital_interior' ? 1.45 : 1.0,
      };
    }
  }
  return null;
}

export interface WeakIceHazardState {
  onWeakIce: boolean;
  patchId: string | null;
  label: string | null;
  /** 0 (solid/safe) to 1 (critical cracking thin ice) */
  crackDanger: number;
  /** Extra warmth chill multiplier while standing on wet/cracking thin ice */
  chillBonusMult: number;
  warning: string | null;
}

/**
 * Evaluates whether the player is stepping onto dangerous weak ice in Zone 1's Frozen Lake
 * or Zone 4's meandering Frozen Tundra River.
 */
export function evaluateWeakIceHazard(
  x: number,
  z: number,
  zone: ZoneId,
  iceThickness: number,
): WeakIceHazardState {
  if (zone === 'city') {
    return {
      onWeakIce: false,
      patchId: null,
      label: null,
      crackDanger: 0,
      chillBonusMult: 1,
      warning: null,
    };
  }

  for (const patch of WORLD_WEAK_ICE_ZONES) {
    if (patch.zone !== zone) continue;
    const d = Math.hypot(x - patch.x, z - patch.z);
    if (d <= patch.radius) {
      if (iceThickness >= patch.safeIceThreshold) {
        continue;
      }
      const edgeT = 1 - Math.min(1, d / patch.radius);
      const thinness = Math.min(
        1,
        Math.max(0.25, (patch.safeIceThreshold - iceThickness) / Math.max(0.15, patch.safeIceThreshold)),
      );
      const crackDanger = Math.min(1, Math.max(0.2, (0.45 + edgeT * 0.55) * thinness));
      return {
        onWeakIce: true,
        patchId: patch.id,
        label: patch.label,
        crackDanger,
        chillBonusMult: 1 + crackDanger * 0.65,
        warning: `⚠ Weak Ice (${patch.label}) — ice cracking underfoot!`,
      };
    }
  }

  return {
    onWeakIce: false,
    patchId: null,
    label: null,
    crackDanger: 0,
    chillBonusMult: 1,
    warning: null,
  };
}

export interface ZoneAtmosphereSnapshot {
  zone: ZoneId;
  weather: WeatherKind;
  conditionLabel: string;
  fogDensityMult: number;
  windSpeedMult: number;
  snowOpacityMult: number;
  gustMult: number;
  chillMult: number;
}

/**
 * Computes zone-scaled dynamic winter weather atmosphere while preserving WeatherKind compatibility.
 * Produces distinct clear winter skies, pine forest mist, alpine gales, tundra snowstorms,
 * and settlement whiteouts across all 5 connected survival zones.
 */
export function computeZoneAtmosphere(
  zone: ZoneId,
  weather: WeatherKind,
  timeOfDay: number,
): ZoneAtmosphereSnapshot {
  const profile = WORLD_BIOME_PROFILES[zone];
  const isNight = timeOfDay < 0.2 || timeOfDay > 0.82;
  const nightFogBoost = isNight ? 1.08 : 1.0;

  let conditionLabel: string;
  if (zone === 'city') {
    conditionLabel = 'Sheltered Cavern Air';
  } else if (weather === 'clear') {
    conditionLabel =
      zone === 'level3'
        ? 'Crisp Alpine Winds'
        : zone === 'level4'
          ? 'Clear Arctic Horizon'
          : zone === 'level2'
            ? 'Still Pine Mist'
            : 'Clear Winter Skies';
  } else if (weather === 'light_snow') {
    conditionLabel =
      zone === 'level2'
        ? 'Dense Forest Snowfall'
        : zone === 'level3'
          ? 'Mountain Squall'
          : zone === 'level4'
            ? 'Drifting Tundra Snow'
            : zone === 'level5'
              ? 'Heavy Settlement Flurries'
              : 'Light Lake Snowfall';
  } else {
    conditionLabel =
      zone === 'level3'
        ? 'Severe Alpine Blizzard'
        : zone === 'level4'
          ? 'Arctic Tundra Whiteout'
          : zone === 'level5'
            ? 'Settlement Gale Storm'
            : 'Winter Blizzard';
  }

  return {
    zone,
    weather,
    conditionLabel,
    fogDensityMult: profile.fogDensityMult * nightFogBoost,
    windSpeedMult: profile.windSpeedMult,
    snowOpacityMult: profile.snowOpacityMult,
    gustMult: profile.gustMult,
    chillMult: profile.coldExposureMult,
  };
}

/**
 * Computes shortest distance from (x, z) to the Zone 4 meandering frozen river centerline
 * and returns the local river half-width at the closest point.
 */
export function sampleTundraRiverDistance(
  x: number,
  z: number,
): { dist: number; halfWidth: number } {
  let bestDist = Infinity;
  let bestWidth = 10;
  for (let i = 0; i < WORLD_FROZEN_RIVER_POINTS.length - 1; i++) {
    const a = WORLD_FROZEN_RIVER_POINTS[i];
    const b = WORLD_FROZEN_RIVER_POINTS[i + 1];
    const vx = b.x - a.x;
    const vz = b.z - a.z;
    const lenSq = vx * vx + vz * vz;
    const t =
      lenSq > 0.0001
        ? Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / lenSq))
        : 0;
    const px = a.x + vx * t;
    const pz = a.z + vz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < bestDist) {
      bestDist = d;
      bestWidth = a.width + (b.width - a.width) * t;
    }
  }
  return { dist: bestDist, halfWidth: bestWidth * 0.5 };
}
