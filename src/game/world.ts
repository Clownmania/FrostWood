import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  type MaterialPalette,
  createBaseCampPropsMesh,
  createCityFountainClocktowerMesh,
  createCityGuildhouseMesh,
  createCityHallMesh,
  createCityStreetlampMesh,
  createCityTavernMesh,
  createCraggyRockGeometry,
  createSculptedTreeTierGeometry,
} from './models';
import type { ProceduralTextureSet } from './textures';
import type { ZoneId } from './types';
import { computeWindGustSample } from './wind';
import { getZoneBossSpec } from './bosses';
import {
  CITY_CENTER_X,
  CITY_CENTER_Z,
  CITY_RADIUS,
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  LEVEL1_RADIUS,
  LEVEL2_CENTER_Z,
  LEVEL2_RADIUS,
  ZONE_SPECS,
} from './zones';

export { LEVEL1_RADIUS, LEVEL2_RADIUS, LEVEL2_CENTER_Z, ZONE_SPECS };
export const PLAY_RADIUS = LEVEL1_RADIUS;
export const CLEARING_RADIUS = 15.5;

// Organized Frontier Quadrant base layout around the central Hearth Plaza (0, 0) in Level 1
// Leaves North Expedition Road (x = 0) and East Trade Road (z = 0) completely unobstructed.
export const BUILDING_POSITIONS = {
  campfire: new THREE.Vector3(0, 0, 0),
  cabin: new THREE.Vector3(-9.2, 0, -6.8),
  festivalPavilion: new THREE.Vector3(-5.2, 0, -11.4),
  lumberCamp: new THREE.Vector3(5.4, 0, -10.8),
  sawmill: new THREE.Vector3(11.2, 0, -5.6),
  stormShelter: new THREE.Vector3(11.0, 0, 5.4),
  forge: new THREE.Vector3(5.8, 0, 10.8),
  craftingStation: new THREE.Vector3(0.0, 0, 10.8),
  tamingPen: new THREE.Vector3(-6.2, 0, 10.6),
  tannery: new THREE.Vector3(-11.0, 0, 4.8),
  iceMonument: new THREE.Vector3(-11.4, 0, -1.2),
} as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function wildernessZoneHeight(
  zone: 'level2' | 'level3' | 'level4' | 'level5',
  x: number,
  z: number,
): number {
  const spec = ZONE_SPECS[zone];
  const lx = x - spec.centerX;
  const lz = z - spec.centerZ;
  const dist = Math.hypot(lx, lz);

  const hearthDist = Math.hypot(x - spec.hearthX, z - spec.hearthZ);
  const portalDist = Math.hypot(x - spec.portalX, z - spec.portalZ);
  const fwdDist =
    spec.forwardPortalX !== undefined && spec.forwardPortalZ !== undefined
      ? Math.hypot(x - spec.forwardPortalX, z - spec.forwardPortalZ)
      : 999;

  const minPadDist = Math.min(hearthDist, portalDist, fwdDist);
  const padBlend = smoothstep(6.5, 15.5, minPadDist);

  const hillAmp =
    zone === 'level5'
      ? 1.95
      : zone === 'level4'
        ? 1.75
        : zone === 'level3'
          ? 1.6
          : 1.45;
  const hills =
    (Math.sin(lx * 0.075) * Math.cos(lz * 0.07) * hillAmp +
      Math.sin((lx - lz) * 0.042) * 0.85) *
    padBlend;

  const boss = getZoneBossSpec(zone);
  const distBoss = Math.hypot(x - boss.arenaX, z - boss.arenaZ);
  const bossBlend = smoothstep(14.8, 25.0, distBoss);
  const leveled = THREE.MathUtils.lerp(0.35, hills, bossBlend);

  if (dist > spec.radius) {
    const rim = dist - spec.radius;
    return leveled + Math.pow(rim * 0.42, 1.55);
  }
  return leveled;
}

export function groundHeightAt(x: number, z: number): number {
  // North continent row (z <= -185): Level 3 (West), Level 2 (Center), Level 5 (East)
  if (z <= -185) {
    if (x < -160) {
      return wildernessZoneHeight('level3', x, z);
    }
    if (x > 160) {
      return wildernessZoneHeight('level5', x, z);
    }
    return wildernessZoneHeight('level2', x, z);
  }

  // South continent row (z > -185): Level 4 (West), Level 1 (Center), Frostcave City (East)
  if (x < -168) {
    return wildernessZoneHeight('level4', x, z);
  }

  if (x >= 175) {
    const lx = x - CITY_CENTER_X;
    const lz = z - CITY_CENTER_Z;
    const dist = Math.hypot(lx, lz);
    // Flat subterranean cavern plaza out to radius 56
    if (dist <= 56) {
      return 0;
    }
    const outerBlend = smoothstep(56, CITY_RADIUS, dist);
    let cavernFloor =
      (Math.sin(lx * 0.08) * Math.cos(lz * 0.08) * 0.65 + 0.35) * outerBlend;

    const bossCity = getZoneBossSpec('city');
    const distBossCity = Math.hypot(x - bossCity.arenaX, z - bossCity.arenaZ);
    const bossCityBlend = smoothstep(13.5, 22.0, distBossCity);
    cavernFloor = THREE.MathUtils.lerp(0.2, cavernFloor, bossCityBlend);

    if (dist > CITY_RADIUS) {
      const rim = dist - CITY_RADIUS;
      return cavernFloor + Math.pow(rim * 0.46, 1.58);
    }
    return cavernFloor;
  }

  // Level 1: Expanded Frostwood Valley centered at (0, 0)
  const spec1 = ZONE_SPECS.level1;
  const dist = Math.hypot(x, z);
  if (dist <= CLEARING_RADIUS) {
    return 0;
  }

  const blend = Math.min(1, (dist - CLEARING_RADIUS) / 14);
  const gentleHills =
    (Math.sin(x * 0.08) * Math.cos(z * 0.075) * 1.2 +
      Math.sin((x + z) * 0.045) * 0.68) *
    blend;

  // Smoothly level the Northgate Portal clearing at (0, -96)
  const distPortal = Math.hypot(x - spec1.portalX, z - spec1.portalZ);
  const portalBlend = smoothstep(5.5, 14.5, distPortal);
  let leveledHills = THREE.MathUtils.lerp(0.65, gentleHills, portalBlend);

  // Smoothly level the East Frostcave City Gate clearing at (96, 0)
  const distCityGate = Math.hypot(x - LEVEL1_CITY_PORTAL_X, z - LEVEL1_CITY_PORTAL_Z);
  const cityGateBlend = smoothstep(5.5, 14.5, distCityGate);
  leveledHills = THREE.MathUtils.lerp(0.45, leveledHills, cityGateBlend);

  // Smoothly level the Zone 1 Boss Arena plateau around Elderwood Hollow
  const boss1 = getZoneBossSpec('level1');
  const distBoss1 = Math.hypot(x - boss1.arenaX, z - boss1.arenaZ);
  const boss1Blend = smoothstep(14.8, 25.0, distBoss1);
  leveledHills = THREE.MathUtils.lerp(0.4, leveledHills, boss1Blend);

  if (dist > LEVEL1_RADIUS) {
    const rim = dist - LEVEL1_RADIUS;
    return leveledHills + Math.pow(rim * 0.38, 1.55);
  }
  return leveledHills;
}

interface BgTreeBase {
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
}

interface BgForestWindState {
  bgCones: THREE.InstancedMesh;
  bases: BgTreeBase[];
}

const _bgDummy = new THREE.Object3D();

export function createSnowTerrain(
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): THREE.Group {
  return createZoneTerrain('level1', textures, palette);
}

export function createZoneTerrain(
  zone: ZoneId,
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): THREE.Group {
  const worldGroup = new THREE.Group();
  const spec = ZONE_SPECS[zone];
  const isCity = zone === 'city';
  const isHighWilderness = zone !== 'level1' && !isCity;

  // Continuous terrain mesh extending well beyond playable radius into horizon fog
  const terrainSize = isCity ? 260 : 380;
  const segments = isCity ? 108 : 136;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(spec.centerX, 0, spec.centerZ);

  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    pos.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const terrainColorHex =
    zone === 'city'
      ? 0xd8e8f8
      : zone === 'level5'
        ? 0xf3e8ff
        : zone === 'level4'
          ? 0xfde2e7
          : zone === 'level3'
            ? 0xdbeafe
            : zone === 'level2'
              ? 0xe5f2ff
              : 0xffffff;

  const terrainMat = new THREE.MeshStandardMaterial({
    color: terrainColorHex,
    map: textures.snowMap,
    bumpMap: textures.snowBump,
    bumpScale: isHighWilderness || isCity ? 0.11 : 0.09,
    roughnessMap: textures.snowRoughness,
    roughness: isCity ? 0.76 : isHighWilderness ? 0.78 : 0.84,
    metalness: isCity ? 0.08 : isHighWilderness ? 0.06 : 0.02,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // Packed cobble-and-frost footpath trails
  const trailMat = new THREE.MeshStandardMaterial({
    color: isCity ? 0xd9d2c5 : isHighWilderness ? 0xd9ebff : 0xffffff,
    map: textures.trailMap,
    bumpMap: textures.trailBump,
    bumpScale: 0.06,
    roughness: 0.88,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  if (zone === 'level1') {
    const hubCircle = new THREE.Mesh(new THREE.CircleGeometry(3.15, 36), trailMat);
    hubCircle.rotation.x = -Math.PI / 2;
    hubCircle.position.y = 0.03;
    hubCircle.receiveShadow = true;
    worldGroup.add(hubCircle);

    // Outer perimeter ring path connecting Frontier Quadrants cleanly around r = 9.4m
    const ringWalk = new THREE.Mesh(new THREE.RingGeometry(8.55, 10.05, 48), trailMat);
    ringWalk.rotation.x = -Math.PI / 2;
    ringWalk.position.y = 0.024;
    ringWalk.receiveShadow = true;
    worldGroup.add(ringWalk);

    const targets = [
      BUILDING_POSITIONS.cabin,
      BUILDING_POSITIONS.lumberCamp,
      BUILDING_POSITIONS.sawmill,
      BUILDING_POSITIONS.tannery,
      BUILDING_POSITIONS.forge,
      BUILDING_POSITIONS.stormShelter,
      BUILDING_POSITIONS.festivalPavilion,
      BUILDING_POSITIONS.craftingStation,
      BUILDING_POSITIONS.tamingPen,
      BUILDING_POSITIONS.iceMonument,
    ];
    for (const t of targets) {
      const len = Math.hypot(t.x, t.z);
      const pathGeo = new THREE.PlaneGeometry(1.55, len);
      pathGeo.rotateX(-Math.PI / 2);
      const path = new THREE.Mesh(pathGeo, trailMat);
      path.rotation.y = Math.atan2(t.x, t.z);
      path.position.set(t.x * 0.5, 0.028, t.z * 0.5);
      path.receiveShadow = true;
      worldGroup.add(path);
    }

    // Organized Homestead Props (stone hearth curb, quadrant lanterns, split-rail fences, cordwood stacks)
    const baseProps = createBaseCampPropsMesh(palette);
    worldGroup.add(baseProps);
    if (Array.isArray(baseProps.userData.windTargets)) {
      worldGroup.userData.windTargets = baseProps.userData.windTargets;
    }

    // Northern Expedition Trail leading cleanly from Hearth Circle to Northgate Portal at (0, -96)
    const northDist = Math.abs(spec.portalZ) - 3.5;
    const roadSegs = 28;
    for (let s = 0; s < roadSegs; s++) {
      const z0 = -3.0 - (s / roadSegs) * northDist;
      const z1 = -3.0 - ((s + 1) / roadSegs) * northDist;
      const midZ = (z0 + z1) * 0.5;
      const y0 = groundHeightAt(0, z0);
      const y1 = groundHeightAt(0, z1);
      const segLen = Math.hypot(z1 - z0, y1 - y0) + 0.25;
      const segGeo = new THREE.PlaneGeometry(2.05, segLen);
      segGeo.rotateX(-Math.PI / 2);
      const seg = new THREE.Mesh(segGeo, trailMat);
      seg.position.set(0, (y0 + y1) * 0.5 + 0.035, midZ);
      seg.rotation.x = Math.atan2(y1 - y0, Math.abs(z1 - z0));
      seg.receiveShadow = true;
      worldGroup.add(seg);
    }

    // Northgate Portal stone apron
    const portalPadY = groundHeightAt(spec.portalX, spec.portalZ);
    const portalApron = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), trailMat);
    portalApron.rotation.x = -Math.PI / 2;
    portalApron.position.set(spec.portalX, portalPadY + 0.035, spec.portalZ);
    portalApron.receiveShadow = true;
    worldGroup.add(portalApron);

    // Carved cyan-lit wayfinder guide posts along the northern road
    const postCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x5be7ff,
      emissive: 0x5be7ff,
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.3,
    });
    for (const markerZ of [-22, -38, -54, -70, -84]) {
      for (const side of [-1.75, 1.75]) {
        const my = groundHeightAt(side, markerZ);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.11, 1.35, 6),
          palette.timberMat,
        );
        post.position.set(side, my + 0.65, markerZ);
        post.castShadow = true;
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.16, 0),
          postCrystalMat,
        );
        crystal.position.set(side, my + 1.46, markerZ);
        worldGroup.add(post, crystal);
      }
    }

    // Eastern Cobblestone Trade Road leading cleanly from Hearth Circle to Frostcave City Gate at (96, 0)
    const eastDist = LEVEL1_CITY_PORTAL_X - 3.5;
    const eastRoadSegs = 26;
    for (let s = 0; s < eastRoadSegs; s++) {
      const x0 = 3.0 + (s / eastRoadSegs) * eastDist;
      const x1 = 3.0 + ((s + 1) / eastRoadSegs) * eastDist;
      const midX = (x0 + x1) * 0.5;
      const y0 = groundHeightAt(x0, 0);
      const y1 = groundHeightAt(x1, 0);
      const segLen = Math.hypot(x1 - x0, y1 - y0) + 0.25;
      const segGeo = new THREE.PlaneGeometry(segLen, 2.2);
      segGeo.rotateX(-Math.PI / 2);
      const seg = new THREE.Mesh(segGeo, trailMat);
      seg.position.set(midX, (y0 + y1) * 0.5 + 0.036, 0);
      seg.rotation.z = -Math.atan2(y1 - y0, Math.abs(x1 - x0));
      seg.receiveShadow = true;
      worldGroup.add(seg);
    }

    const cityGateY = groundHeightAt(LEVEL1_CITY_PORTAL_X, LEVEL1_CITY_PORTAL_Z);
    const cityGateApron = new THREE.Mesh(new THREE.CircleGeometry(5.6, 28), trailMat);
    cityGateApron.rotation.x = -Math.PI / 2;
    cityGateApron.position.set(LEVEL1_CITY_PORTAL_X, cityGateY + 0.036, LEVEL1_CITY_PORTAL_Z);
    cityGateApron.receiveShadow = true;
    worldGroup.add(cityGateApron);

    // Warm golden lantern wayfinder posts along the Eastern Trade Road
    const goldLanternMat = new THREE.MeshStandardMaterial({
      color: 0xf6c344,
      emissive: 0xf59e3d,
      emissiveIntensity: 1.35,
      roughness: 0.25,
      metalness: 0.3,
    });
    for (const markerX of [22, 38, 54, 70, 84]) {
      for (const sideZ of [-1.85, 1.85]) {
        const my = groundHeightAt(markerX, sideZ);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.11, 1.45, 6),
          palette.darkWoodMat,
        );
        post.position.set(markerX, my + 0.7, sideZ);
        post.castShadow = true;
        const lantern = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.18, 0),
          goldLanternMat,
        );
        lantern.position.set(markerX, my + 1.55, sideZ);
        worldGroup.add(post, lantern);
      }
    }
  } else if (isHighWilderness) {
    // Waystation Brazier Circle & Return/Forward Portal Stone Aprons for Levels 2, 3, 4, 5
    const hy = groundHeightAt(spec.hearthX, spec.hearthZ);
    const brazierCircle = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), trailMat);
    brazierCircle.rotation.x = -Math.PI / 2;
    brazierCircle.position.set(spec.hearthX, hy + 0.035, spec.hearthZ);
    brazierCircle.receiveShadow = true;
    worldGroup.add(brazierCircle);

    const py = groundHeightAt(spec.portalX, spec.portalZ);
    const portalPad = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), trailMat);
    portalPad.rotation.x = -Math.PI / 2;
    portalPad.position.set(spec.portalX, py + 0.035, spec.portalZ);
    portalPad.receiveShadow = true;
    worldGroup.add(portalPad);

    if (spec.forwardPortalX !== undefined && spec.forwardPortalZ !== undefined) {
      const fy = groundHeightAt(spec.forwardPortalX, spec.forwardPortalZ);
      const fwdPad = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), trailMat);
      fwdPad.rotation.x = -Math.PI / 2;
      fwdPad.position.set(spec.forwardPortalX, fy + 0.035, spec.forwardPortalZ);
      fwdPad.receiveShadow = true;
      worldGroup.add(fwdPad);
    }
  } else {
    // Subterranean Frostcave City Plaza, Cobblestone Avenues, Buildings & Glacial Cavern Vault
    const plazaCircle = new THREE.Mesh(new THREE.CircleGeometry(26.5, 48), trailMat);
    plazaCircle.rotation.x = -Math.PI / 2;
    plazaCircle.position.set(CITY_CENTER_X, 0.03, CITY_CENTER_Z);
    plazaCircle.receiveShadow = true;
    worldGroup.add(plazaCircle);

    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x8ea4ba,
      roughness: 0.75,
      metalness: 0.12,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const innerRing = new THREE.Mesh(new THREE.RingGeometry(10.5, 11.3, 40), innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(CITY_CENTER_X, 0.04, CITY_CENTER_Z);
    worldGroup.add(innerRing);

    // West-East Grand Cavern Avenue (from West Portal at x=206 through Plaza to East Obsidian Trial Arena at x=346)
    const ewAveGeo = new THREE.PlaneGeometry(156, 4.6);
    ewAveGeo.rotateX(-Math.PI / 2);
    const ewAve = new THREE.Mesh(ewAveGeo, trailMat);
    ewAve.position.set(CITY_CENTER_X - 4, 0.028, CITY_CENTER_Z);
    ewAve.receiveShadow = true;
    worldGroup.add(ewAve);

    // North-South Cross Avenue
    const nsAveGeo = new THREE.PlaneGeometry(4.4, 72);
    nsAveGeo.rotateX(-Math.PI / 2);
    const nsAve = new THREE.Mesh(nsAveGeo, trailMat);
    nsAve.position.set(CITY_CENTER_X, 0.028, CITY_CENTER_Z);
    nsAve.receiveShadow = true;
    worldGroup.add(nsAve);

    const westGatePad = new THREE.Mesh(new THREE.CircleGeometry(5.6, 28), trailMat);
    westGatePad.rotation.x = -Math.PI / 2;
    westGatePad.position.set(spec.portalX, 0.035, spec.portalZ);
    westGatePad.receiveShadow = true;
    worldGroup.add(westGatePad);

    // Central Clocktower & Hearth Fountain at (CITY_CENTER_X, 0)
    const fountain = createCityFountainClocktowerMesh(palette);
    fountain.position.set(CITY_CENTER_X, 0, CITY_CENTER_Z);
    worldGroup.add(fountain);

    // Grand Frostcave City Hall on the North side of the square facing South
    const cityHall = createCityHallMesh(palette);
    cityHall.position.set(CITY_CENTER_X, 0, CITY_CENTER_Z - 29.5);
    cityHall.rotation.y = 0;
    worldGroup.add(cityHall);

    // Frosthearth Tavern on the Northwest corner facing South-East
    const tavern = createCityTavernMesh(palette);
    tavern.position.set(CITY_CENTER_X - 28.5, 0, CITY_CENTER_Z - 23.5);
    tavern.rotation.y = 0.42;
    worldGroup.add(tavern);

    // Royal Armory & Guildhouses framing the Northeast, Southwest, and Southeast corners
    const guildNE = createCityGuildhouseMesh(palette, palette.coatBlueMat);
    guildNE.position.set(CITY_CENTER_X + 28.5, 0, CITY_CENTER_Z - 23.5);
    guildNE.rotation.y = -0.42;
    worldGroup.add(guildNE);

    const guildSW = createCityGuildhouseMesh(palette, palette.coatGreenMat);
    guildSW.position.set(CITY_CENTER_X - 27.5, 0, CITY_CENTER_Z + 24.5);
    guildSW.rotation.y = Math.PI - 0.38;
    worldGroup.add(guildSW);

    const guildSE = createCityGuildhouseMesh(palette, palette.coatRedMat);
    guildSE.position.set(CITY_CENTER_X + 27.5, 0, CITY_CENTER_Z + 24.5);
    guildSE.rotation.y = Math.PI + 0.38;
    worldGroup.add(guildSE);

    // Wrought-iron warm streetlamps along the avenues and plaza perimeter
    const lampCoords: Array<[number, number, number]> = [
      [CITY_CENTER_X - 48, -3.4, Math.PI / 2],
      [CITY_CENTER_X - 48, 3.4, -Math.PI / 2],
      [CITY_CENTER_X - 30, -3.4, Math.PI / 2],
      [CITY_CENTER_X - 30, 3.4, -Math.PI / 2],
      [CITY_CENTER_X - 11.5, -11.5, Math.PI / 4],
      [CITY_CENTER_X + 11.5, -11.5, -Math.PI / 4],
      [CITY_CENTER_X - 11.5, 11.5, (Math.PI * 3) / 4],
      [CITY_CENTER_X + 11.5, 11.5, (-Math.PI * 3) / 4],
    ];
    for (const [lx, lz, lyaw] of lampCoords) {
      const lamp = createCityStreetlampMesh(palette);
      lamp.position.set(lx, groundHeightAt(lx, lz), lz);
      lamp.rotation.y = lyaw;
      worldGroup.add(lamp);
    }

    // Subterranean Frost Cave Rib Arches, Stalagmites & Glowing Aurora Crystal Clusters
    const caveCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.95,
      roughness: 0.18,
      metalness: 0.25,
    });
    const caveStoneMat = new THREE.MeshStandardMaterial({
      color: 0x4b5e73,
      roughness: 0.82,
      metalness: 0.14,
    });

    const archCount = 22;
    for (let i = 0; i < archCount; i++) {
      const angle = (i / archCount) * Math.PI * 2;
      // Leave wide welcoming openings at both the West Gate (angle ~ Math.PI) and East Trial Arena Archway (angle ~ 0)
      if (Math.abs(Math.cos(angle) + 1) < 0.08 || Math.abs(Math.cos(angle) - 1) < 0.08) {
        continue;
      }

      const r = 58.5 + (i % 2) * 3.8;
      const ax = CITY_CENTER_X + Math.cos(angle) * r;
      const az = CITY_CENTER_Z + Math.sin(angle) * r;
      const ay = groundHeightAt(ax, az);

      const pillar = new THREE.Group();
      pillar.position.set(ax, ay, az);
      pillar.rotation.y = Math.atan2(CITY_CENTER_X - ax, CITY_CENTER_Z - az);

      // Massive cavern wall column curving inward like a vaulted frost cave rib
      const colH = 13.5 + (i % 3) * 2.6;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 2.6, colH, 7),
        caveStoneMat,
      );
      col.position.y = colH * 0.46;
      col.rotation.x = 0.24;
      col.castShadow = true;
      col.receiveShadow = true;
      pillar.add(col);

      // Upper vaulted cave overhang rib with hanging ice stalactites
      const rib = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 7.5, 6),
        caveStoneMat,
      );
      rib.position.set(0, colH - 1.2, 2.8);
      rib.rotation.x = 1.05;
      pillar.add(rib);

      const stalactite = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 2.6, 6),
        palette.iceMat,
      );
      stalactite.position.set(0, colH - 2.6, 3.6);
      stalactite.rotation.x = Math.PI;
      pillar.add(stalactite);

      // Glowing subterranean frost-crystal cluster at the base of the cave pillar
      const crystalMain = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 2.35, 5),
        i % 3 === 0 ? palette.auroraCrystalMat : caveCrystalMat,
      );
      crystalMain.position.set(0.4, 1.1, 1.45);
      crystalMain.rotation.set(0.22, 0.3, -0.18);
      const crystalSide = new THREE.Mesh(
        new THREE.ConeGeometry(0.36, 1.55, 5),
        caveCrystalMat,
      );
      crystalSide.position.set(-0.35, 0.72, 1.55);
      crystalSide.rotation.set(0.32, -0.2, 0.25);
      pillar.add(crystalMain, crystalSide);

      worldGroup.add(pillar);
    }
  }

  // Dedicated Zone Boss Trial Arena Pad, Glowing Rune Circle & 4 Outer Corner Monoliths
  {
    const bossSpec = getZoneBossSpec(zone);
    const ay = groundHeightAt(bossSpec.arenaX, bossSpec.arenaZ);
    const padRadius = zone === 'city' ? 11.5 : 13.5;
    const arenaGroup = new THREE.Group();
    arenaGroup.position.set(bossSpec.arenaX, ay, bossSpec.arenaZ);

    const slabMat = new THREE.MeshStandardMaterial({
      color: isHighWilderness ? 0x3b5875 : zone === 'city' ? 0x2b2430 : 0x3e3a35,
      roughness: 0.78,
      metalness: 0.18,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const slab = new THREE.Mesh(
      new THREE.CylinderGeometry(padRadius, padRadius + 0.85, 0.14, 32),
      slabMat,
    );
    slab.position.y = 0.04;
    slab.receiveShadow = true;
    arenaGroup.add(slab);

    const runeRingMat = new THREE.MeshBasicMaterial({
      color: bossSpec.accentColorHex,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(padRadius - 0.65, padRadius - 0.18, 48),
      runeRingMat,
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.125;
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 4.15, 36),
      runeRingMat,
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.125;
    arenaGroup.add(outerRing, innerRing);

    const pillarStoneMat = new THREE.MeshStandardMaterial({
      color: isHighWilderness ? 0x6283a3 : zone === 'city' ? 0x3a3140 : 0x524c44,
      roughness: 0.72,
      metalness: 0.22,
    });
    const pillarCrystalMat = new THREE.MeshStandardMaterial({
      color: bossSpec.accentColorHex,
      emissive: bossSpec.accentColorHex,
      emissiveIntensity: 1.15,
      roughness: 0.2,
      metalness: 0.35,
    });
    for (let m = 0; m < 4; m++) {
      const angle = (m / 4) * Math.PI * 2 + Math.PI / 4;
      const mx = Math.cos(angle) * (padRadius - 0.35);
      const mz = Math.sin(angle) * (padRadius - 0.35);
      const localY = groundHeightAt(bossSpec.arenaX + mx, bossSpec.arenaZ + mz) - ay;

      const monolith = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.68, 3.2, 6),
        pillarStoneMat,
      );
      monolith.position.set(mx, localY + 1.55, mz);
      monolith.castShadow = true;
      monolith.receiveShadow = true;

      const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.36, 0),
        pillarCrystalMat,
      );
      beacon.position.set(mx, localY + 3.55, mz);
      arenaGroup.add(monolith, beacon);
    }

    worldGroup.add(arenaGroup);
  }

  // Natural perimeter craggy granite boulders & alpine/cavern ridge stones (InstancedMesh)
  const rockSeed =
    zone === 'level5'
      ? 29
      : zone === 'level4'
        ? 23
        : zone === 'level3'
          ? 17
          : zone === 'level2'
            ? 13
            : isCity
              ? 19
              : 7;
  const rockGeo = createCraggyRockGeometry(1.15, 2, rockSeed);
  const rockCount = isCity ? 88 : 96;
  const rockMat = isCity
    ? new THREE.MeshStandardMaterial({
        color: 0x5c738c,
        roughness: 0.68,
        metalness: 0.18,
      })
    : isHighWilderness
      ? new THREE.MeshStandardMaterial({
          color: 0xaec8e0,
          roughness: 0.62,
          metalness: 0.16,
        })
      : palette.rockMat;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const rockColor = new THREE.Color();

  const arenaBossSpec = getZoneBossSpec(zone);
  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.08;
    const isInnerVignette = !isCity && i % 5 === 0;
    const r = isInnerVignette
      ? 22 + ((i * 7) % (spec.radius - 32))
      : spec.radius + (isCity ? -6 : 2) + ((i * 11) % 14);
    let rx = spec.centerX + Math.cos(angle) * r;
    let rz = spec.centerZ + Math.sin(angle) * r;

    // Keep North Road, East Road & Portal approaches clear of oversized boulders
    if (
      Math.hypot(rx - spec.portalX, rz - spec.portalZ) < 10.5 ||
      (spec.forwardPortalX !== undefined &&
        spec.forwardPortalZ !== undefined &&
        Math.hypot(rx - spec.forwardPortalX, rz - spec.forwardPortalZ) < 10.5) ||
      (zone === 'level1' && Math.abs(rx) < 5.5 && rz < -8 && rz > -102) ||
      (zone === 'level1' && Math.abs(rz) < 5.5 && rx > 8 && rx < 102) ||
      (zone === 'level1' && Math.hypot(rx - LEVEL1_CITY_PORTAL_X, rz - LEVEL1_CITY_PORTAL_Z) < 10.5) ||
      (isHighWilderness && Math.hypot(rx - spec.hearthX, rz - spec.hearthZ) < 10.5)
    ) {
      rz += (rz >= spec.centerZ ? 1 : -1) * 11.5;
    }

    // Keep Zone Boss Arena clear of decorative boulders
    const arenaDx = rx - arenaBossSpec.arenaX;
    const arenaDz = rz - arenaBossSpec.arenaZ;
    const arenaDist = Math.hypot(arenaDx, arenaDz);
    if (arenaDist < 17.5) {
      const pushNorm = arenaDist || 1;
      rx = arenaBossSpec.arenaX + (arenaDx / pushNorm) * 18.5;
      rz = arenaBossSpec.arenaZ + (arenaDz / pushNorm) * 18.5;
    }

    const ry = groundHeightAt(rx, rz);
    const sx = isInnerVignette
      ? 0.68 + (i % 3) * 0.25
      : isCity
        ? 2.4 + (i % 4) * 1.15
        : 1.9 + (i % 4) * 0.95;
    const sy = isInnerVignette
      ? 0.48 + (i % 2) * 0.22
      : isCity
        ? 2.2 + (i % 3) * 1.65
        : 1.5 + (i % 3) * 1.15;
    const sz = sx * 0.88;

    dummy.position.set(rx, ry + sy * 0.32, rz);
    dummy.rotation.set((i % 4) * 0.2, angle, (i % 3) * 0.15);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);

    if (isCity) {
      const tint = 0.68 + (i % 5) * 0.05;
      rockColor.setRGB(tint * 0.78, tint * 0.92, tint * 1.12);
    } else if (isHighWilderness) {
      const tint = 0.8 + (i % 5) * 0.04;
      rockColor.setRGB(tint * 0.86, tint * 0.96, tint * 1.1);
    } else {
      const shade = 0.82 + (i % 5) * 0.04;
      rockColor.setRGB(shade, shade + 0.02, shade + 0.05);
    }
    rocks.setColorAt(i, rockColor);
  }
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  worldGroup.add(rocks);

  // Outer dense backdrop forest ring (multi-tier sculpted pines + wind-reactive crowns)
  const bgCount = isCity ? 84 : 136;
  const bgTrunkGeo = new THREE.CylinderGeometry(0.24, 0.46, 3.2, 8);
  const bgTier1 = createSculptedTreeTierGeometry(2.3, 2.7, isHighWilderness ? 31 : 19);
  bgTier1.translate(0, -1.25, 0);
  const bgTier2 = createSculptedTreeTierGeometry(1.75, 2.4, isHighWilderness ? 37 : 23);
  bgTier2.translate(0, 0.35, 0);
  const bgTier3 = createSculptedTreeTierGeometry(1.15, 2.1, isHighWilderness ? 41 : 29);
  bgTier3.translate(0, 1.75, 0);
  const bgConeGeo = mergeGeometries([bgTier1, bgTier2, bgTier3], false) ?? bgTier1;
  bgTier1.dispose();
  bgTier2.dispose();
  bgTier3.dispose();

  const bgTrunks = new THREE.InstancedMesh(bgTrunkGeo, palette.barkMat, bgCount);
  const bgCones = new THREE.InstancedMesh(
    bgConeGeo,
    isHighWilderness || isCity ? palette.elderNeedleMat : palette.spruceNeedleMat,
    bgCount,
  );
  const coneColor = new THREE.Color();
  const bgBases: BgTreeBase[] = [];

  for (let i = 0; i < bgCount; i++) {
    const a = (i / bgCount) * Math.PI * 2 + (i % 5) * 0.04;
    const r = spec.radius + 4.0 + ((i * 13) % 24);
    const tx = spec.centerX + Math.cos(a) * r;
    const tz = spec.centerZ + Math.sin(a) * r;
    const ty = groundHeightAt(tx, tz);
    const sc = 0.9 + (i % 5) * 0.18;

    bgBases.push({ x: tx, y: ty, z: tz, yaw: a, scale: sc });

    dummy.position.set(tx, ty + 1.5 * sc, tz);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    bgTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, ty + 4.4 * sc, tz);
    dummy.updateMatrix();
    bgCones.setMatrixAt(i, dummy.matrix);

    if (isHighWilderness || isCity) {
      coneColor.setHSL(0.49, 0.38, 0.2 + (i % 4) * 0.03);
    } else {
      coneColor.setHSL(0.43, 0.34, 0.17 + (i % 4) * 0.03);
    }
    bgCones.setColorAt(i, coneColor);
  }
  bgTrunks.instanceMatrix.needsUpdate = true;
  bgCones.instanceMatrix.needsUpdate = true;
  if (bgCones.instanceColor) bgCones.instanceColor.needsUpdate = true;
  bgTrunks.computeBoundingSphere();
  bgCones.computeBoundingSphere();
  worldGroup.add(bgTrunks, bgCones);

  worldGroup.userData.bgForestWind = {
    bgCones,
    bases: bgBases,
  } satisfies BgForestWindState;

  // Environmental Realism Polish: Frozen Glacial Pond & Distant Alpine Mountain Skyline (Wilderness Zones)
  if (!isCity) {
    const pondX = spec.centerX - 38;
    const pondZ = spec.centerZ + 26;
    const pondY = groundHeightAt(pondX, pondZ) + 0.06;

    const glacialIceMat = new THREE.MeshPhysicalMaterial({
      color: 0xa7ddf5,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      ior: 1.31,
      reflectivity: 0.72,
    });
    const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(7.8, 28), glacialIceMat);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.scale.set(1.32, 0.88, 1);
    pondMesh.position.set(pondX, pondY, pondZ);
    pondMesh.receiveShadow = true;
    worldGroup.add(pondMesh);

    const pondRimMat = new THREE.MeshStandardMaterial({
      color: 0xe6f1fc,
      roughness: 0.85,
      metalness: 0.02,
    });
    for (let r = 0; r < 14; r++) {
      const a = (r / 14) * Math.PI * 2;
      const sx = pondX + Math.cos(a) * 10.0;
      const sz = pondZ + Math.sin(a) * 6.6;
      const bank = new THREE.Mesh(
        createCraggyRockGeometry(0.95 + (r % 3) * 0.25, 1, 50 + r),
        r % 2 === 0 ? palette.rockMat : pondRimMat,
      );
      bank.position.set(sx, groundHeightAt(sx, sz) + 0.16, sz);
      bank.scale.set(1.2, 0.45, 0.95);
      bank.castShadow = true;
      bank.receiveShadow = true;
      worldGroup.add(bank);
    }

    // Scattered natural pine saplings & snowdrifts in outer wilderness clearings
    const saplingCount = 54;
    const sapGeo = createSculptedTreeTierGeometry(0.68, 1.35, 91);
    const sapMat = isHighWilderness ? palette.elderNeedleMat : palette.pineNeedleMat;
    const saplings = new THREE.InstancedMesh(sapGeo, sapMat, saplingCount);
    saplings.castShadow = true;
    saplings.receiveShadow = true;
    for (let s = 0; s < saplingCount; s++) {
      const a = s * 2.39996 + 0.2;
      const rad = 24 + ((s * 17) % Math.max(16, spec.radius - 28));
      let sx = spec.centerX + Math.cos(a) * rad;
      let sz = spec.centerZ + Math.sin(a) * rad;
      if (Math.hypot(sx - pondX, sz - pondZ) < 12.5) {
        sx += 15;
      }
      if (
        (zone === 'level1' && Math.abs(sx) < 4.5 && sz < -4) ||
        (zone === 'level1' && Math.abs(sz) < 4.5 && sx > 4)
      ) {
        sz += 6.5;
      }
      // Keep saplings clear of Zone Boss Arena pad & outer monoliths
      const sapDx = sx - arenaBossSpec.arenaX;
      const sapDz = sz - arenaBossSpec.arenaZ;
      const sapDist = Math.hypot(sapDx, sapDz);
      if (sapDist < 17.5) {
        const pushNorm = sapDist || 1;
        sx = arenaBossSpec.arenaX + (sapDx / pushNorm) * 18.5;
        sz = arenaBossSpec.arenaZ + (sapDz / pushNorm) * 18.5;
      }
      const sy = groundHeightAt(sx, sz);
      const sc = 0.65 + (s % 4) * 0.2;
      dummy.position.set(sx, sy + 0.55 * sc, sz);
      dummy.rotation.set(0, a, 0);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      saplings.setMatrixAt(s, dummy.matrix);
    }
    saplings.instanceMatrix.needsUpdate = true;
    saplings.computeBoundingSphere();
    worldGroup.add(saplings);

    // Distant Snow-Capped Faceted Alpine Mountain Ridge Skyline Ring
    const peakCount = 28;
    const peakGeo = new THREE.ConeGeometry(16, 26, 7);
    const peakMat = new THREE.MeshStandardMaterial({
      color: isHighWilderness ? 0x627c96 : 0x5c7288,
      roughness: 0.9,
      metalness: 0.04,
      flatShading: true,
    });
    const capGeo = new THREE.ConeGeometry(8.8, 11.5, 7);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xeef6ff,
      roughness: 0.78,
      metalness: 0.02,
      flatShading: true,
    });
    const peaks = new THREE.InstancedMesh(peakGeo, peakMat, peakCount);
    const peakCaps = new THREE.InstancedMesh(capGeo, capMat, peakCount);
    for (let m = 0; m < peakCount; m++) {
      const a = (m / peakCount) * Math.PI * 2 + (m % 3) * 0.05;
      const distR = spec.radius + 36 + (m % 4) * 8;
      const mx = spec.centerX + Math.cos(a) * distR;
      const mz = spec.centerZ + Math.sin(a) * distR;
      const my = groundHeightAt(mx, mz) - 4;
      const sx = 0.9 + (m % 4) * 0.26;
      const sy = 0.85 + (m % 3) * 0.35;
      dummy.position.set(mx, my + 12.5 * sy, mz);
      dummy.rotation.set(0, a + m, 0);
      dummy.scale.set(sx, sy, sx * 0.86);
      dummy.updateMatrix();
      peaks.setMatrixAt(m, dummy.matrix);

      dummy.position.set(mx, my + 20.4 * sy, mz);
      dummy.scale.set(sx * 0.96, sy * 0.98, sx * 0.84);
      dummy.updateMatrix();
      peakCaps.setMatrixAt(m, dummy.matrix);
    }
    peaks.instanceMatrix.needsUpdate = true;
    peakCaps.instanceMatrix.needsUpdate = true;
    peaks.computeBoundingSphere();
    peakCaps.computeBoundingSphere();
    worldGroup.add(peaks, peakCaps);
  }

  return worldGroup;
}

export function updateBackdropForestWind(
  worldGroup: THREE.Group,
  time: number,
  gustIntensity: number,
): void {
  const state = worldGroup.userData.bgForestWind as BgForestWindState | undefined;
  if (!state) return;

  const { bgCones, bases } = state;
  for (let i = 0; i < bases.length; i++) {
    const b = bases[i];
    const sample = computeWindGustSample({
      time,
      gustIntensity,
      worldX: b.x,
      worldZ: b.z,
      stiffness: 1.05,
      phaseOffset: i * 0.37,
    });
    _bgDummy.position.set(
      b.x + sample.leanX * 1.45 * b.scale,
      b.y + 4.4 * b.scale,
      b.z + sample.leanZ * 1.45 * b.scale,
    );
    _bgDummy.rotation.set(sample.leanZ * 0.85, b.yaw, -sample.leanX * 0.85);
    _bgDummy.scale.set(b.scale, b.scale, b.scale);
    _bgDummy.updateMatrix();
    bgCones.setMatrixAt(i, _bgDummy.matrix);
  }
  bgCones.instanceMatrix.needsUpdate = true;
}

export class ParticlePool {
  public readonly mesh: THREE.InstancedMesh;
  private readonly capacity: number;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly sizes: Float32Array;
  private readonly colors: Float32Array;
  private cursor = 0;

  private readonly dummy = new THREE.Object3D();
  private readonly tmpColor = new THREE.Color();

  constructor(scene: THREE.Scene, capacity = 180) {
    this.capacity = capacity;
    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.pos = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.sizes = new Float32Array(capacity);
    this.colors = new Float32Array(capacity * 3);

    for (let i = 0; i < capacity; i++) {
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.tmpColor.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public spawnBurst(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
    speed = 4.5,
    size = 1.0,
    upBias = 3.2,
  ): void {
    this.tmpColor.setHex(colorHex);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;

      const idx3 = i * 3;
      this.pos[idx3] = x + (Math.random() - 0.5) * 0.35;
      this.pos[idx3 + 1] = y + (Math.random() - 0.5) * 0.25;
      this.pos[idx3 + 2] = z + (Math.random() - 0.5) * 0.35;

      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.45 + Math.random() * 0.75);
      this.vel[idx3] = Math.cos(angle) * spd;
      this.vel[idx3 + 1] = upBias + Math.random() * speed * 0.7;
      this.vel[idx3 + 2] = Math.sin(angle) * spd;

      const ttl = 0.35 + Math.random() * 0.35;
      this.life[i] = ttl;
      this.maxLife[i] = ttl;
      this.sizes[i] = size * (0.7 + Math.random() * 0.6);

      this.colors[idx3] = this.tmpColor.r;
      this.colors[idx3 + 1] = this.tmpColor.g;
      this.colors[idx3 + 2] = this.tmpColor.b;
      this.mesh.setColorAt(i, this.tmpColor);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public update(dt: number): void {
    let anyActive = false;
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      anyActive = true;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      const idx3 = i * 3;
      this.vel[idx3 + 1] -= 14 * dt;
      this.pos[idx3] += this.vel[idx3] * dt;
      this.pos[idx3 + 1] += this.vel[idx3 + 1] * dt;
      this.pos[idx3 + 2] += this.vel[idx3 + 2] * dt;

      const t = Math.max(0, this.life[i] / this.maxLife[i]);
      const s = this.sizes[i] * t;
      this.dummy.position.set(this.pos[idx3], this.pos[idx3 + 1], this.pos[idx3 + 2]);
      this.dummy.rotation.set(t * 4, t * 3, 0);
      this.dummy.scale.set(s, s, s);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    if (anyActive) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function createSnowflakeTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.5, 'rgba(236, 246, 255, 0.85)');
  grad.addColorStop(1, 'rgba(220, 238, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class SnowfallSystem {
  public readonly points: THREE.Points;
  public readonly gustMesh: THREE.InstancedMesh;
  private readonly count: number;
  private readonly positions: Float32Array;
  private readonly speeds: Float32Array;
  private readonly flakeTexture: THREE.CanvasTexture | null;

  private readonly gustCount = 150;
  private readonly gustPos: Float32Array;
  private readonly gustSpeeds: Float32Array;
  private readonly gustScales: Float32Array;
  private readonly gustDummy = new THREE.Object3D();

  constructor(scene: THREE.Scene, count = 560) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 68;
      this.positions[i * 3 + 1] = Math.random() * 24;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 68;
      this.speeds[i] = 2.1 + Math.random() * 2.2;
    }

    this.flakeTexture = createSnowflakeTexture();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf4f9ff,
      map: this.flakeTexture,
      size: 0.34,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // Layer 2: Horizontal blowing snow-drift streaks for light snow spindrift & blizzard gusts
    const gustGeo = new THREE.PlaneGeometry(1.15, 0.065);
    const gustMat = new THREE.MeshBasicMaterial({
      color: 0xf0f7ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.gustMesh = new THREE.InstancedMesh(gustGeo, gustMat, this.gustCount);
    this.gustMesh.frustumCulled = false;
    this.gustMesh.visible = false;
    scene.add(this.gustMesh);

    this.gustPos = new Float32Array(this.gustCount * 3);
    this.gustSpeeds = new Float32Array(this.gustCount);
    this.gustScales = new Float32Array(this.gustCount);
    for (let i = 0; i < this.gustCount; i++) {
      this.gustPos[i * 3] = (Math.random() - 0.5) * 56;
      this.gustPos[i * 3 + 1] = 0.35 + Math.random() * 7.2;
      this.gustPos[i * 3 + 2] = (Math.random() - 0.5) * 56;
      this.gustSpeeds[i] = 0.8 + Math.random() * 0.65;
      this.gustScales[i] = 0.65 + Math.random() * 0.9;
    }
  }

  public update(
    dt: number,
    centerX: number,
    centerZ: number,
    time: number,
    windSpeedX = 1.1,
    fallMultiplier = 1.0,
    snowOpacity = 0.78,
    gustIntensity = 0.28,
  ): void {
    const mat = this.points.material as THREE.PointsMaterial;
    mat.opacity = snowOpacity;
    mat.size = 0.3 + Math.max(0, fallMultiplier - 1) * 0.1;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      this.positions[idx] += (windSpeedX + Math.sin(time * 0.9 + i) * 0.65) * dt;
      this.positions[idx + 1] -= this.speeds[i] * fallMultiplier * dt;
      this.positions[idx + 2] += windSpeedX * 0.25 * dt;

      if (this.positions[idx] - centerX > 34) {
        this.positions[idx] -= 68;
      } else if (this.positions[idx] - centerX < -34) {
        this.positions[idx] += 68;
      }
      if (this.positions[idx + 2] - centerZ > 34) {
        this.positions[idx + 2] -= 68;
      } else if (this.positions[idx + 2] - centerZ < -34) {
        this.positions[idx + 2] += 68;
      }

      if (this.positions[idx + 1] < 0) {
        this.positions[idx] = centerX + (Math.random() - 0.5) * 64;
        this.positions[idx + 1] = 20 + Math.random() * 5;
        this.positions[idx + 2] = centerZ + (Math.random() - 0.5) * 64;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    const gustMat = this.gustMesh.material as THREE.MeshBasicMaterial;
    if (gustIntensity <= 0.03) {
      this.gustMesh.visible = false;
      return;
    }
    this.gustMesh.visible = true;
    gustMat.opacity = Math.min(0.62, gustIntensity * 0.56);

    const streakSpeed = (3.5 + windSpeedX * 1.95) * (0.45 + gustIntensity * 0.85);
    const lengthScale = 0.55 + gustIntensity * 1.45;
    for (let i = 0; i < this.gustCount; i++) {
      const idx = i * 3;
      const spd = streakSpeed * this.gustSpeeds[i];
      this.gustPos[idx] += spd * dt;
      this.gustPos[idx + 1] += Math.sin(time * 3.2 + i) * 0.45 * dt - 0.4 * dt;
      this.gustPos[idx + 2] += spd * 0.26 * dt;

      if (this.gustPos[idx] - centerX > 28) {
        this.gustPos[idx] -= 56;
      } else if (this.gustPos[idx] - centerX < -28) {
        this.gustPos[idx] += 56;
      }
      if (this.gustPos[idx + 2] - centerZ > 28) {
        this.gustPos[idx + 2] -= 56;
      } else if (this.gustPos[idx + 2] - centerZ < -28) {
        this.gustPos[idx + 2] += 56;
      }
      if (this.gustPos[idx + 1] < 0.25) {
        this.gustPos[idx + 1] = 0.8 + Math.random() * 6.5;
      }

      const s = this.gustScales[i];
      this.gustDummy.position.set(
        this.gustPos[idx],
        this.gustPos[idx + 1],
        this.gustPos[idx + 2],
      );
      this.gustDummy.rotation.set(0.35, -0.25, -0.08 * gustIntensity);
      this.gustDummy.scale.set(s * lengthScale, 0.8 + gustIntensity * 0.6, 1);
      this.gustDummy.updateMatrix();
      this.gustMesh.setMatrixAt(i, this.gustDummy.matrix);
    }
    this.gustMesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.flakeTexture?.dispose();
    this.gustMesh.geometry.dispose();
    (this.gustMesh.material as THREE.Material).dispose();
  }
}
