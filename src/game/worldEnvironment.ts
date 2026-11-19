import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  loadGltfModelWithAnimations,
  prepareNormalizedGltfAsset,
} from './gltfLoader';
import {
  type MaterialPalette,
  createCraggyRockGeometry,
  createSculptedTreeTierGeometry,
} from './models';
import { PBR_SURFACE_PROFILES } from './pbrMaterials';
import type { ProceduralTextureSet } from './textures';
import type { ZoneId } from './types';
import { getZoneBossSpec } from './bosses';
import { FISHING_LAKE_CENTER, FISHING_LAKE_RADIUS } from './fishing';
import { ZONE_SPECS } from './zones';
import {
  ENV_MODEL_URLS,
  WORLD_BIOME_PROFILES,
  WORLD_FROZEN_RIVER_POINTS,
  WORLD_LAKE_ISLANDS,
  WORLD_LANDMARKS,
  WORLD_WEAK_ICE_ZONES,
  getLandmarksForZone,
  sampleTundraRiverDistance,
  type WorldLandmarkSpec,
} from './worldBiomes';

export type HeightSampler = (x: number, z: number) => number;

/**
 * Loads a genuine CC0 KayKit environment GLB, normalizes its scale & ground contact,
 * dusts its materials with subtle winter frost reflectance, and mounts it inside a LOD container.
 */
function mountEnvGltfLandmark(
  parent: THREE.Group,
  lm: WorldLandmarkSpec,
  groundY: number,
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): void {
  if (!lm.modelKey) return;
  const url = ENV_MODEL_URLS[lm.modelKey];
  const anchor = new THREE.Group();
  anchor.name = `landmark_${lm.id}`;
  anchor.position.set(lm.x, groundY, lm.z);
  anchor.rotation.y = lm.yaw;

  // Grounding snow-drift skirt collar so every building/vehicle feels nestled in real snow
  const skirtRadius = Math.max(1.6, lm.collisionRadius * 1.18);
  const skirtGeo = new THREE.CylinderGeometry(skirtRadius * 0.78, skirtRadius * 1.12, 0.36, 14);
  const skirtMesh = new THREE.Mesh(skirtGeo, palette.snowMat);
  skirtMesh.position.y = 0.08;
  skirtMesh.receiveShadow = true;
  anchor.add(skirtMesh);

  // Optional warm hearth/emergency beacon glow pool beside sheltered landmarks
  if (lm.warmLightHex !== undefined) {
    const glowMat = new THREE.MeshBasicMaterial({
      color: lm.warmLightHex,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glowPool = new THREE.Mesh(new THREE.CircleGeometry(skirtRadius * 1.25, 24), glowMat);
    glowPool.rotation.x = -Math.PI / 2;
    glowPool.position.y = 0.09;
    anchor.add(glowPool);

    // Compact exterior camp/warning lantern post
    const postMat = palette.ironMat;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), postMat);
    post.position.set(skirtRadius * 0.72, 1.1, skirtRadius * 0.45);
    post.castShadow = true;
    const lampMat = new THREE.MeshStandardMaterial({
      color: lm.warmLightHex,
      emissive: lm.warmLightHex,
      emissiveIntensity: 1.65,
      roughness: 0.2,
      metalness: 0.1,
    });
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), lampMat);
    lamp.position.set(skirtRadius * 0.72, 2.28, skirtRadius * 0.45);
    anchor.add(post, lamp);
  }

  // Optional glowing ice-crystal exploration beacon for secret caves & supply complexes
  if (lm.hasLootBeacon) {
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.25,
    });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), beaconMat);
    crystal.position.set(-skirtRadius * 0.58, 1.05, skirtRadius * 0.58);
    crystal.scale.set(0.85, 1.45, 0.85);
    anchor.add(crystal);
  }

  // Campsite smoldering firepit & log seating next to expedition tents
  if (lm.kind === 'campsite') {
    const ringMat = palette.stoneMat;
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), ringMat);
      stone.position.set(2.3 + Math.cos(a) * 0.58, 0.14, 1.6 + Math.sin(a) * 0.58);
      stone.scale.set(1.1, 0.65, 1.0);
      anchor.add(stone);
    }
    const embers = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.42, 7),
      palette.emberMat,
    );
    embers.position.set(2.3, 0.22, 1.6);
    anchor.add(embers);
  }

  // Crystalline icicle archway & frost stalagmites framing hidden ice caves
  if (lm.kind === 'ice_cave') {
    const icicleGeo = new THREE.ConeGeometry(0.38, 1.85, 6);
    for (let k = -2; k <= 2; k++) {
      const icicle = new THREE.Mesh(icicleGeo, palette.iceMat);
      icicle.position.set(k * 0.72, 3.35 - Math.abs(k) * 0.32, 1.65);
      icicle.rotation.x = Math.PI;
      icicle.scale.setScalar(0.8 + (2 - Math.abs(k)) * 0.16);
      anchor.add(icicle);
    }
  }

  parent.add(anchor);

  const isVehicle = lm.kind === 'broken_vehicle';
  const isIndustrial =
    lm.kind === 'research_station' ||
    lm.kind === 'mountain_shelter' ||
    lm.kind === 'radar_mast' ||
    lm.kind === 'supply_container' ||
    lm.kind === 'settlement_hospital' ||
    lm.kind === 'settlement_warehouse';

  loadGltfModelWithAnimations(url)
    .then((loaded) => {
      const prepared = prepareNormalizedGltfAsset(
        loaded.scene,
        {
          url,
          targetHeight: lm.targetHeight ?? 4.8,
          yawOffset: 0,
          collisionRadius: lm.collisionRadius,
          surfacePreset: isIndustrial ? 'hide' : 'hero_fur_leather',
          tintHex: isVehicle ? 0xcbd5e1 : isIndustrial ? 0xdbeafe : 0xe2e8f0,
          tintStrength: isVehicle ? 0.26 : 0.16,
          roughnessMin: isVehicle ? 0.45 : 0.64,
          roughnessMax: isVehicle ? 0.82 : 0.94,
          metalnessMax: isVehicle || isIndustrial ? 0.38 : 0.14,
        },
        {
          furBumpMap: textures.snowNormal,
          envMapIntensity: isVehicle || isIndustrial ? 0.96 : 0.84,
        },
      );

      // Subtle authentic winter settling tilt on derelict vehicles & ruined settlement buildings
      if (isVehicle) {
        prepared.lod.rotation.z = ((lm.x * 0.13) % 0.14) - 0.06;
        prepared.lod.rotation.x = 0.04;
      }

      anchor.add(prepared.lod);
    })
    .catch((err) => {
      console.warn(`Failed to load environment GLB (${lm.modelKey}):`, err);
    });
}

/**
 * Detailed multi-plank abandoned wooden fishing boat with gunwales, benches, frost pile, and oars.
 */
function createAbandonedWoodenBoatMesh(palette: MaterialPalette): THREE.Group {
  const boat = new THREE.Group();

  // Sculpted hull shell
  const hullGeo = new THREE.CylinderGeometry(0.92, 0.56, 3.4, 10, 1, false, 0, Math.PI);
  hullGeo.rotateZ(Math.PI / 2);
  hullGeo.rotateY(Math.PI / 2);
  hullGeo.scale(1.0, 0.62, 1.0);
  const hull = new THREE.Mesh(hullGeo, palette.timberMat);
  hull.position.y = 0.48;
  hull.castShadow = true;
  hull.receiveShadow = true;
  boat.add(hull);

  // Dark inner hull cavity & ribs
  const innerHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.12, 2.7),
    palette.darkWoodMat,
  );
  innerHull.position.y = 0.28;
  boat.add(innerHull);

  for (const bz of [-0.65, 0.15, 0.92]) {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.08, 0.34),
      palette.timberMat,
    );
    bench.position.set(0, 0.52, bz);
    bench.castShadow = true;
    boat.add(bench);
  }

  // Tapered bow & stern posts
  for (const dir of [-1, 1]) {
    const prow = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.9, 6),
      palette.darkWoodMat,
    );
    prow.rotation.x = dir * (Math.PI / 2);
    prow.scale.set(1.0, 1.0, 0.62);
    prow.position.set(0, 0.44, dir * 1.92);
    prow.castShadow = true;
    boat.add(prow);
  }

  // Snow accumulation drift inside the abandoned boat
  const snowDrift = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 10, 8),
    palette.snowMat,
  );
  snowDrift.scale.set(0.88, 0.34, 1.65);
  snowDrift.position.set(0.05, 0.42, -0.15);
  snowDrift.receiveShadow = true;
  boat.add(snowDrift);

  // Resting wooden oar diagonal across thwarts
  const oarShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.036, 2.4, 6),
    palette.timberMat,
  );
  oarShaft.rotation.set(Math.PI / 2 - 0.06, 0.24, 0.12);
  oarShaft.position.set(0.18, 0.62, 0.12);
  const oarBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.03, 0.55),
    palette.darkWoodMat,
  );
  oarBlade.position.set(0.42, 0.66, 1.24);
  oarBlade.rotation.y = 0.24;
  boat.add(oarShaft, oarBlade);

  // Slight weathered list on the frozen shore
  boat.rotation.z = 0.16;
  return boat;
}

/**
 * Towering frozen glacial waterfall cascading down an alpine cliff buttress into a misty ice pool.
 */
function createFrozenWaterfallMesh(
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): THREE.Group {
  const wf = new THREE.Group();

  // Craggy dark alpine cliff backing wall
  const cliffGeo = createCraggyRockGeometry(5.6, 2, 109);
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d61,
    map: textures.rockMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.9,
    metalness: 0.06,
    flatShading: true,
  });
  const cliffMain = new THREE.Mesh(cliffGeo, cliffMat);
  cliffMain.scale.set(1.45, 2.1, 0.85);
  cliffMain.position.set(0, 7.2, -3.4);
  cliffMain.castShadow = true;
  cliffMain.receiveShadow = true;
  wf.add(cliffMain);

  // Snow cornice overhanging the waterfall ledge
  const cornice = new THREE.Mesh(
    createCraggyRockGeometry(4.8, 1, 121),
    palette.snowMat,
  );
  cornice.scale.set(1.5, 0.42, 0.92);
  cornice.position.set(0, 14.5, -2.1);
  wf.add(cornice);

  // Sculpted translucent glacial ice columns & icicle curtains
  const pIce = PBR_SURFACE_PROFILES.glacial_ice;
  const cascadeMat = new THREE.MeshPhysicalMaterial({
    color: 0xbceeff,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.16,
    map: textures.lakeFractureMap,
    normalMap: textures.lakeFractureNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.12,
    metalness: 0.04,
    ior: pIce.ior,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    iridescence: 0.32,
    iridescenceIOR: 1.31,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.35,
  });

  const columnSpecs: Array<[number, number, number, number]> = [
    [-2.1, 12.2, 0.85, 0.72],
    [-0.95, 13.6, 1.15, 0.9],
    [0.25, 14.1, 1.35, 1.05],
    [1.45, 12.8, 1.05, 0.8],
    [2.5, 10.6, 0.75, 0.65],
  ];
  for (const [cx, ch, radTop, radBot] of columnSpecs) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(radTop * 0.75, radBot * 1.15, ch, 9, 4),
      cascadeMat,
    );
    col.position.set(cx, ch * 0.48, 0.25 + Math.sin(cx) * 0.35);
    col.rotation.x = 0.08;
    col.castShadow = true;
    col.receiveShadow = true;
    wf.add(col);
  }

  // Hanging icicle spears along the upper rim
  const spearGeo = new THREE.ConeGeometry(0.24, 2.8, 6);
  for (let i = -4; i <= 4; i++) {
    const spear = new THREE.Mesh(spearGeo, cascadeMat);
    spear.position.set(i * 0.78, 12.6 - Math.abs(i) * 0.28, 1.15);
    spear.rotation.x = Math.PI;
    wf.add(spear);
  }

  // Frozen plunge-pool ice basin & frosted mist ring at base
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5.6, 32), cascadeMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.12, 2.6);
  pool.receiveShadow = true;
  wf.add(pool);

  const mistMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mistRing = new THREE.Mesh(new THREE.CircleGeometry(6.4, 24), mistMat);
  mistRing.rotation.x = -Math.PI / 2;
  mistRing.position.set(0, 0.18, 2.6);
  wf.add(mistRing);

  return wf;
}

/**
 * Walkable open-door interior hall for Zone 5's Emergency Triage & Arctic Research Hall.
 * Features open front & rear arches so the survivor can walk directly inside for blizzard shelter
 * and inspect medical gurneys, glowing research terminals, and supply lockers.
 */
function createWalkableHospitalInteriorMesh(
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): THREE.Group {
  const hall = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x6b7b8c,
    map: textures.stoneMap,
    normalMap: textures.stoneNormal,
    roughness: 0.86,
    metalness: 0.08,
  });
  const trimSteelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.52,
    metalness: 0.48,
  });
  const tileFloorMat = new THREE.MeshStandardMaterial({
    color: 0x9fb0c2,
    roughness: 0.68,
    metalness: 0.1,
  });
  const medCrossMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.55,
    roughness: 0.35,
  });
  const screenGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.35,
    roughness: 0.18,
  });
  const warmBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // Walkable elevated concrete slab (9.6m x 7.6m)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 7.6), tileFloorMat);
  floor.position.y = 0.12;
  floor.receiveShadow = true;
  hall.add(floor);

  // Side walls with frosted broken window cutouts
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.2, 7.4), concreteMat);
    wall.position.set(side * 4.58, 2.2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    hall.add(wall);
  }

  // Front & back portal lintels (wide 4.2m open walkthrough doorway!)
  for (const zDir of [-1, 1]) {
    for (const xSide of [-3.35, 3.35]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.2, 0.45), concreteMat);
      jamb.position.set(xSide, 2.2, zDir * 3.58);
      jamb.castShadow = true;
      jamb.receiveShadow = true;
      hall.add(jamb);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.15, 0.52), trimSteelMat);
    lintel.position.set(0, 3.72, zDir * 3.58);
    lintel.castShadow = true;
    hall.add(lintel);
  }

  // Heavy snow-drifted roof deck with partial skylight breach
  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.34, 7.9), concreteMat);
  roofLeft.position.set(-2.7, 4.38, 0);
  roofLeft.castShadow = true;
  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.34, 7.9), concreteMat);
  roofRight.position.set(2.7, 4.38, 0);
  roofRight.castShadow = true;
  const snowRoof = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.28, 7.8), palette.snowMat);
  snowRoof.position.set(0, 4.64, 0);
  snowRoof.receiveShadow = true;
  hall.add(roofLeft, roofRight, snowRoof);

  // Red emergency hospital cross sign above front entry
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.92, 0.12), medCrossMat);
  crossV.position.set(0, 3.75, 3.92);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.12), medCrossMat);
  crossH.position.set(0, 3.75, 3.92);
  hall.add(crossV, crossH);

  // Interior Storytelling Props: 2 Medical Triage Cots (left) + Arctic Research Consoles (right)
  const cotMattressMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.85 });
  for (const cz of [-1.5, 1.35]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.95), trimSteelMat);
    frame.position.set(-3.1, 0.45, cz);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 0.88), cotMattressMat);
    mattress.position.set(-3.1, 0.74, cz);
    hall.add(frame, mattress);
  }

  for (const lz of [-1.55, 1.25]) {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 1.85), trimSteelMat);
    desk.position.set(3.25, 0.72, lz);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 1.15), screenGlowMat);
    monitor.position.set(3.45, 1.52, lz);
    hall.add(desk, monitor);
  }

  // Warm emergency shelter ceiling lantern + floor warmth pool
  const ceilingLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.28, 12), warmBeaconMat);
  ceilingLamp.position.set(0, 4.1, 0);
  const warmPool = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 24),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  warmPool.rotation.x = -Math.PI / 2;
  warmPool.position.y = 0.26;
  hall.add(ceilingLamp, warmPool);

  return hall;
}

/**
 * Builds the meandering Frozen Tundra Ice River spanning Zone 4 using a smooth ribbon mesh
 * with glacial fracture PBR textures and raised snow embankments.
 */
function buildFrozenTundraRiver(
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): void {
  const curvePts = WORLD_FROZEN_RIVER_POINTS.map(
    (p) => new THREE.Vector3(p.x, groundHeightAt(p.x, p.z) + 0.14, p.z),
  );
  const curve = new THREE.CatmullRomCurve3(curvePts);
  const samples = 56;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normalX = -tangent.z;
    const normalZ = tangent.x;
    const halfW = 5.1 + Math.sin(t * Math.PI * 3) * 0.75;

    const lx = pt.x + normalX * halfW;
    const lz = pt.z + normalZ * halfW;
    const rx = pt.x - normalX * halfW;
    const rz = pt.z - normalZ * halfW;
    const ly = groundHeightAt(lx, lz) + 0.16;
    const ry = groundHeightAt(rx, rz) + 0.16;
    const riverY = Math.max(ly, ry, pt.y) + 0.04;

    positions.push(lx, riverY, lz, rx, riverY, rz);
    uvs.push(0, t * 14, 1, t * 14);

    if (i < samples) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  riverGeo.setIndex(indices);
  riverGeo.computeVertexNormals();

  const pFrac = PBR_SURFACE_PROFILES.lake_fracture_ice;
  const riverMat = new THREE.MeshPhysicalMaterial({
    color: 0xa5dff9,
    emissive: 0x083354,
    emissiveIntensity: 0.12,
    map: textures.lakeFractureMap,
    normalMap: textures.lakeFractureNormal,
    normalScale: new THREE.Vector2(pFrac.normalScale, pFrac.normalScale),
    roughnessMap: textures.lakeFractureRoughness,
    roughness: 0.2,
    metalness: 0.05,
    ior: pFrac.ior,
    clearcoat: 0.92,
    clearcoatRoughness: 0.14,
    iridescence: 0.26,
    iridescenceIOR: 1.31,
    envMapIntensity: 1.28,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.receiveShadow = true;
  worldGroup.add(riverMesh);

  // Snow-crusted boulder banks along the frozen river edges (InstancedMesh)
  const bankGeo = createCraggyRockGeometry(1.1, 1, 83);
  const bankCount = 44;
  const banks = new THREE.InstancedMesh(bankGeo, palette.snowMat, bankCount);
  banks.receiveShadow = true;
  banks.castShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < bankCount; i++) {
    const t = (i + 0.5) / bankCount;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const bx = pt.x + -tangent.z * side * (5.9 + (i % 3) * 0.5);
    const bz = pt.z + tangent.x * side * (5.9 + (i % 3) * 0.5);
    const by = groundHeightAt(bx, bz);
    dummy.position.set(bx, by + 0.18, bz);
    dummy.rotation.set(0, i * 1.1, 0);
    dummy.scale.set(1.5 + (i % 3) * 0.45, 0.42 + (i % 2) * 0.18, 1.15);
    dummy.updateMatrix();
    banks.setMatrixAt(i, dummy.matrix);
  }
  banks.instanceMatrix.needsUpdate = true;
  worldGroup.add(banks);
}

/**
 * Builds Zone 5's snow-buried abandoned settlement road network & tilted streetlamps.
 */
function buildAbandonedSettlementRoads(
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): void {
  const z5 = ZONE_SPECS.level5;
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x3b4654,
    map: textures.stoneMap,
    normalMap: textures.stoneNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.88,
    metalness: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const stripeMat = new THREE.MeshBasicMaterial({
    color: 0xd6c78d,
    transparent: true,
    opacity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  // Main North-South Avenue (length 124m, width 9.5m)
  const nsGeo = new THREE.PlaneGeometry(9.5, 124, 6, 48);
  nsGeo.rotateX(-Math.PI / 2);
  nsGeo.translate(z5.centerX, 0, z5.centerZ);
  const nsPos = nsGeo.attributes.position;
  for (let i = 0; i < nsPos.count; i++) {
    nsPos.setY(i, groundHeightAt(nsPos.getX(i), nsPos.getZ(i)) + 0.08);
  }
  nsGeo.computeVertexNormals();
  const nsRoad = new THREE.Mesh(nsGeo, asphaltMat);
  nsRoad.receiveShadow = true;
  worldGroup.add(nsRoad);

  // East-West Cross Street (length 118m, width 8.5m)
  const ewGeo = new THREE.PlaneGeometry(118, 8.5, 48, 6);
  ewGeo.rotateX(-Math.PI / 2);
  ewGeo.translate(z5.centerX, 0, z5.centerZ);
  const ewPos = ewGeo.attributes.position;
  for (let i = 0; i < ewPos.count; i++) {
    ewPos.setY(i, groundHeightAt(ewPos.getX(i), ewPos.getZ(i)) + 0.085);
  }
  ewGeo.computeVertexNormals();
  const ewRoad = new THREE.Mesh(ewGeo, asphaltMat);
  ewRoad.receiveShadow = true;
  worldGroup.add(ewRoad);

  // Faded painted road dashes along Main Avenue
  for (let d = -52; d <= 52; d += 8) {
    if (Math.abs(d) < 6) continue;
    const dz = z5.centerZ + d;
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 3.2), stripeMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(z5.centerX, groundHeightAt(z5.centerX, dz) + 0.11, dz);
    worldGroup.add(dash);
  }

  // Tilted snow-frosted streetlamps lining the abandoned avenues
  const lampPositions: Array<[number, number, number, boolean]> = [
    [z5.centerX - 6.0, z5.centerZ - 36, 0.12, true],
    [z5.centerX + 6.0, z5.centerZ - 20, -0.08, false],
    [z5.centerX - 6.0, z5.centerZ + 18, 0.06, true],
    [z5.centerX + 6.0, z5.centerZ + 38, -0.15, false],
    [z5.centerX - 30, z5.centerZ - 5.6, 0.1, true],
    [z5.centerX + 30, z5.centerZ + 5.6, -0.11, true],
  ];
  const poleMat = palette.ironMat;
  const activeLampMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });
  const deadLampMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.7,
  });
  for (const [lx, lz, tilt, lit] of lampPositions) {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.2, 7), poleMat);
    pole.position.y = 2.6;
    pole.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.1), poleMat);
    arm.position.set(0.5, 5.1, 0);
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.18, 0.28),
      lit ? activeLampMat : deadLampMat,
    );
    bulb.position.set(0.95, 4.96, 0);
    lamp.add(pole, arm, bulb);
    lamp.position.set(lx, groundHeightAt(lx, lz), lz);
    lamp.rotation.z = tilt;
    lamp.rotation.y = lx > z5.centerX ? Math.PI : 0;
    worldGroup.add(lamp);
  }
}

/**
 * Renders visible blue fractured weak-ice hazard indicators on Zone 1's lake & Zone 4's river
 * so players can read dangerous thin-ice vents visually while exploring.
 */
function buildWeakIceVisualMarkers(
  zone: Exclude<ZoneId, 'city'>,
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
): void {
  const patches = WORLD_WEAK_ICE_ZONES.filter((p) => p.zone === zone);
  if (patches.length === 0) return;

  const crackRingMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const darkAbyssMat = new THREE.MeshBasicMaterial({
    color: 0x041f3a,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });

  for (const patch of patches) {
    const py = groundHeightAt(patch.x, patch.z) + (zone === 'level1' ? 0.275 : 0.24);
    const group = new THREE.Group();
    group.position.set(patch.x, py, patch.z);

    const pool = new THREE.Mesh(new THREE.CircleGeometry(patch.radius * 0.85, 24), darkAbyssMat);
    pool.rotation.x = -Math.PI / 2;
    group.add(pool);

    const outerCrack = new THREE.Mesh(
      new THREE.RingGeometry(patch.radius * 0.72, patch.radius * 0.92, 24),
      crackRingMat,
    );
    outerCrack.rotation.x = -Math.PI / 2;
    outerCrack.position.y = 0.008;
    group.add(outerCrack);

    // 5 radiating fracture lines across the thin-ice pocket
    for (let f = 0; f < 5; f++) {
      const a = (f / 5) * Math.PI * 2 + 0.3;
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(patch.radius * 1.45, 0.14),
        crackRingMat,
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = a;
      crack.position.y = 0.012;
      group.add(crack);
    }

    worldGroup.add(group);
  }
}

/**
 * Adds Zone 1 Frozen Lake rocky islands scattered around the outer/mid lake perimeter.
 */
function buildZone1LakeIslands(
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
  palette: MaterialPalette,
): void {
  const lakeY = groundHeightAt(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z) + 0.14;
  for (let i = 0; i < WORLD_LAKE_ISLANDS.length; i++) {
    const isl = WORLD_LAKE_ISLANDS[i];
    const group = new THREE.Group();
    group.position.set(isl.x, lakeY, isl.z);

    const rockBase = new THREE.Mesh(
      createCraggyRockGeometry(isl.radius, 2, 131 + i * 17),
      palette.rockMat,
    );
    rockBase.scale.set(1.08, isl.height / isl.radius, 0.96);
    rockBase.position.y = isl.height * 0.25;
    rockBase.castShadow = true;
    rockBase.receiveShadow = true;
    group.add(rockBase);

    const snowCap = new THREE.Mesh(
      createCraggyRockGeometry(isl.radius * 0.86, 1, 173 + i * 11),
      palette.snowMat,
    );
    snowCap.scale.set(1.02, (isl.height * 0.42) / isl.radius, 0.92);
    snowCap.position.y = isl.height * 0.68;
    snowCap.receiveShadow = true;
    group.add(snowCap);

    if (isl.hasPine) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.24, 2.2, 7),
        palette.barkMat,
      );
      trunk.position.set(0.25, isl.height + 0.9, -0.15);
      trunk.castShadow = true;
      const tier1 = new THREE.Mesh(
        createSculptedTreeTierGeometry(1.45, 2.1, 91 + i),
        palette.spruceNeedleMat,
      );
      tier1.position.set(0.25, isl.height + 2.1, -0.15);
      tier1.castShadow = true;
      const tier2 = new THREE.Mesh(
        createSculptedTreeTierGeometry(1.05, 1.85, 97 + i),
        palette.snowMat,
      );
      tier2.position.set(0.25, isl.height + 3.15, -0.15);
      tier2.castShadow = true;
      group.add(trunk, tier1, tier2);
    }

    if (isl.hasCampLantern) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 1.55, 6),
        palette.darkWoodMat,
      );
      post.position.set(-0.65, isl.height + 0.65, 0.55);
      const bulb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffc069,
          emissive: 0xff8c24,
          emissiveIntensity: 1.55,
          roughness: 0.2,
        }),
      );
      bulb.position.set(-0.65, isl.height + 1.5, 0.55);
      group.add(post, bulb);
    }

    worldGroup.add(group);
  }
}

/**
 * Adds high-density InstancedMesh biome forests (with snow-capped boughs!) & rocky alpine outcrops
 * tailored distinctly to each of the 5 survival zones — keeping draw calls minimal while making
 * Zone 2 feel like a dense frozen pine forest, Zone 3 like jagged snow mountains, and Zone 4 like
 * wind-swept open tundra!
 */
function buildZoneBiomeInstancedNature(
  zone: Exclude<ZoneId, 'city'>,
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
  palette: MaterialPalette,
  landmarks: readonly WorldLandmarkSpec[],
): void {
  const spec = ZONE_SPECS[zone];
  const profile = WORLD_BIOME_PROFILES[zone];
  const boss = getZoneBossSpec(zone);
  const dummy = new THREE.Object3D();

  const isClearOfPoi = (x: number, z: number, minPad = 8.5): boolean => {
    if (Math.hypot(x - spec.hearthX, z - spec.hearthZ) < 16.5) return false;
    if (Math.hypot(x - spec.portalX, z - spec.portalZ) < 12.5) return false;
    if (
      spec.forwardPortalX !== undefined &&
      spec.forwardPortalZ !== undefined &&
      Math.hypot(x - spec.forwardPortalX, z - spec.forwardPortalZ) < 12.5
    ) {
      return false;
    }
    if (Math.hypot(x - boss.arenaX, z - boss.arenaZ) < 18.5) return false;
    if (
      zone === 'level1' &&
      Math.hypot(x - FISHING_LAKE_CENTER.x, z - FISHING_LAKE_CENTER.z) <
        FISHING_LAKE_RADIUS + 6.5
    ) {
      return false;
    }
    if (zone === 'level1' && (Math.abs(x) < 7.5 || Math.abs(z) < 7.5)) return false;
    if (zone === 'level4') {
      const riv = sampleTundraRiverDistance(x, z);
      if (riv.dist < riv.halfWidth + 4.0) return false;
    }
    if (zone === 'level5') {
      if (Math.abs(x - spec.centerX) < 8.5 || Math.abs(z - spec.centerZ) < 8.0) {
        return false;
      }
    }
    for (const lm of landmarks) {
      if (Math.hypot(x - lm.x, z - lm.z) < Math.max(minPad, lm.collisionRadius + 4.8)) {
        return false;
      }
    }
    return true;
  };

  // 1. Dense Instanced Multi-Tier Snow-Capped Evergreen Pines (just 3 draw calls total!)
  const treeCount = profile.extraTreeCount;
  if (treeCount > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.36, 3.0, 7);
    const t1 = createSculptedTreeTierGeometry(2.15, 2.5, 51);
    t1.translate(0, -1.1, 0);
    const t2 = createSculptedTreeTierGeometry(1.62, 2.25, 57);
    t2.translate(0, 0.4, 0);
    const t3 = createSculptedTreeTierGeometry(1.06, 1.9, 61);
    t3.translate(0, 1.75, 0);
    const foliageGeo = mergeGeometries([t1, t2, t3], false) ?? t1;
    t1.dispose();
    t2.dispose();
    t3.dispose();

    const capGeo = createSculptedTreeTierGeometry(1.22, 1.6, 67);
    const trunks = new THREE.InstancedMesh(trunkGeo, palette.barkMat, treeCount);
    const crowns = new THREE.InstancedMesh(
      foliageGeo,
      zone === 'level2' ? palette.pineNeedleMat : palette.spruceNeedleMat,
      treeCount,
    );
    const caps = new THREE.InstancedMesh(capGeo, palette.snowMat, treeCount);
    trunks.castShadow = true;
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    caps.receiveShadow = true;

    const shade = new THREE.Color();
    let placed = 0;
    for (let i = 0; i < treeCount * 3 && placed < treeCount; i++) {
      const goldenA = i * 2.3999632 + (zone === 'level2' ? 0.2 : 1.1);
      const frac = Math.sqrt((i + 0.5) / (treeCount * 2.3));
      const minR = zone === 'level2' ? 19 : 28;
      const maxR = spec.radius - 7;
      const r = minR + (frac % 1) * (maxR - minR);
      const tx = spec.centerX + Math.cos(goldenA) * r;
      const tz = spec.centerZ + Math.sin(goldenA) * r;
      if (!isClearOfPoi(tx, tz, 7.5)) continue;

      const ty = groundHeightAt(tx, tz);
      const sc =
        zone === 'level2'
          ? 0.92 + (placed % 6) * 0.16
          : zone === 'level4'
            ? 0.62 + (placed % 4) * 0.12
            : 0.78 + (placed % 5) * 0.14;
      const lean = zone === 'level4' ? 0.14 : zone === 'level3' ? 0.08 : 0.02;

      dummy.position.set(tx, ty + 1.4 * sc, tz);
      dummy.rotation.set(lean, goldenA, lean * 0.6);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(tx, ty + 4.15 * sc, tz);
      dummy.updateMatrix();
      crowns.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(tx, ty + 5.75 * sc, tz);
      dummy.scale.set(sc * 1.05, sc * 0.92, sc * 1.05);
      dummy.updateMatrix();
      caps.setMatrixAt(placed, dummy.matrix);

      shade.setHSL(0.43 + (placed % 3) * 0.02, 0.36, 0.18 + (placed % 4) * 0.03);
      crowns.setColorAt(placed, shade);
      placed++;
    }
    trunks.count = placed;
    crowns.count = placed;
    caps.count = placed;
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();
    caps.computeBoundingSphere();
    worldGroup.add(trunks, crowns, caps);
  }

  // 2. Zone-specific Sculpted Alpine Crags & Erratic Snow-Capped Boulders (InstancedMesh)
  const rockCount = profile.extraBoulderCount;
  if (rockCount > 0) {
    const cragGeo = createCraggyRockGeometry(zone === 'level3' ? 2.4 : 1.35, 2, 149);
    const crags = new THREE.InstancedMesh(cragGeo, palette.rockMat, rockCount);
    crags.castShadow = true;
    crags.receiveShadow = true;
    let placed = 0;
    for (let i = 0; i < rockCount * 3 && placed < rockCount; i++) {
      const a = i * 2.3999632 + 0.85;
      const r = 24 + ((i * 23) % Math.max(24, spec.radius - 32));
      const rx = spec.centerX + Math.cos(a) * r;
      const rz = spec.centerZ + Math.sin(a) * r;
      if (!isClearOfPoi(rx, rz, 7.2)) continue;

      const ry = groundHeightAt(rx, rz);
      const sx = zone === 'level3' ? 1.2 + (placed % 4) * 0.48 : 0.85 + (placed % 3) * 0.35;
      const sy = zone === 'level3' ? 1.45 + (placed % 4) * 0.72 : 0.65 + (placed % 3) * 0.28;
      dummy.position.set(rx, ry + sy * 0.3, rz);
      dummy.rotation.set((placed % 3) * 0.14, a, (placed % 4) * 0.1);
      dummy.scale.set(sx, sy, sx * 0.88);
      dummy.updateMatrix();
      crags.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    crags.count = placed;
    crags.instanceMatrix.needsUpdate = true;
    crags.computeBoundingSphere();
    worldGroup.add(crags);
  }

  // 3. Atmospheric Pine Forest Ground-Mist Banks in Zone 2
  if (zone === 'level2') {
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mistGeo = new THREE.CircleGeometry(14, 18);
    mistGeo.rotateX(-Math.PI / 2);
    for (let m = 0; m < 10; m++) {
      const a = (m / 10) * Math.PI * 2 + 0.4;
      const r = 34 + (m % 3) * 24;
      const mx = spec.centerX + Math.cos(a) * r;
      const mz = spec.centerZ + Math.sin(a) * r;
      const mist = new THREE.Mesh(mistGeo, mistMat);
      mist.position.set(mx, groundHeightAt(mx, mz) + 0.85, mz);
      mist.scale.set(1.2, 1, 0.85);
      worldGroup.add(mist);
    }
  }

  // 4. Mountain Climbing Trail Red-Flagged Cairn Markers in Zone 3
  if (zone === 'level3') {
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35,
      roughness: 0.6,
    });
    const trailPts: Array<[number, number]> = [
      [spec.centerX - 8, spec.centerZ + 44],
      [spec.centerX - 15, spec.centerZ + 32],
      [spec.centerX - 22, spec.centerZ + 24],
      [spec.centerX + 12, spec.centerZ + 12],
      [spec.centerX + 24, spec.centerZ - 4],
    ];
    for (const [cx, cz] of trailPts) {
      const cy = groundHeightAt(cx, cz);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 2.3, 6),
        palette.darkWoodMat,
      );
      pole.position.set(cx, cy + 1.15, cz);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, 0.04), flagMat);
      flag.position.set(cx + 0.38, cy + 2.05, cz);
      worldGroup.add(pole, flag);
    }
  }
}

/**
 * Populates all AAA winter survival landmarks, real CC0 GLB structures, instanced biome nature,
 * Zone 1 lake islands & boats, Zone 3 frozen waterfalls, Zone 4 meandering frozen river,
 * and Zone 5 abandoned winter settlement roads & walkable hospital hall.
 */
export function populateZoneWinterLandmarks(
  zone: ZoneId,
  worldGroup: THREE.Group,
  groundHeightAt: HeightSampler,
  textures: ProceduralTextureSet,
  palette: MaterialPalette,
): void {
  if (zone === 'city') return;

  const landmarks = getLandmarksForZone(zone);

  // 1. Biome-specific large environmental features
  if (zone === 'level1') {
    buildZone1LakeIslands(worldGroup, groundHeightAt, palette);
  }
  if (zone === 'level4') {
    buildFrozenTundraRiver(worldGroup, groundHeightAt, textures, palette);
  }
  if (zone === 'level5') {
    buildAbandonedSettlementRoads(worldGroup, groundHeightAt, textures, palette);
  }

  // 2. Weak-ice hazard fractures (Zone 1 Frozen Lake & Zone 4 Frozen River)
  buildWeakIceVisualMarkers(zone, worldGroup, groundHeightAt);

  // 3. Instanced biome forests, alpine crags, forest mist, and climbing markers
  buildZoneBiomeInstancedNature(zone, worldGroup, groundHeightAt, palette, landmarks);

  // 4. Mount all Zone Landmarks (real CC0 GLBs + custom boats, frozen waterfalls & walkable hospital hall)
  for (const lm of landmarks) {
    const gy = groundHeightAt(lm.x, lm.z);
    if (lm.kind === 'abandoned_boat') {
      const boat = createAbandonedWoodenBoatMesh(palette);
      boat.position.set(lm.x, gy + 0.08, lm.z);
      boat.rotation.y = lm.yaw;
      worldGroup.add(boat);
    } else if (lm.kind === 'frozen_waterfall') {
      const wf = createFrozenWaterfallMesh(textures, palette);
      wf.position.set(lm.x, gy, lm.z);
      wf.rotation.y = lm.yaw;
      worldGroup.add(wf);
    } else if (lm.kind === 'hospital_interior') {
      const hall = createWalkableHospitalInteriorMesh(textures, palette);
      hall.position.set(lm.x, gy, lm.z);
      hall.rotation.y = lm.yaw;
      worldGroup.add(hall);
    } else if (lm.modelKey) {
      mountEnvGltfLandmark(worldGroup, lm, gy, textures, palette);
    }
  }
}
