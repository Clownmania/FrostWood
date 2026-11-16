import * as THREE from 'three';
import type {
  AnimalKind,
  AnimalRarity,
  PetSpeciesId,
  SecretChestRarity,
  TreeKind,
} from './types';
import type { ProceduralTextureSet } from './textures';
import { PET_SPECIES_SPECS } from './pets';
import { SPECIES_SPECS } from './wildlife';
import { getRarityColorHex } from './tracking';

export interface WindSwayTarget {
  pivot: THREE.Object3D;
  stiffness: number;
  phaseOffset: number;
  baseRotX: number;
  baseRotZ: number;
  /** Optional world-relative yaw offset if pivot sits inside a rotated parent. */
  localYaw?: number;
  /** True for canopies/boughs whose parent group already rotates by tree yaw. */
  useGroupYaw?: boolean;
}

export function registerWindTarget(
  root: THREE.Object3D,
  target: WindSwayTarget,
): void {
  const list = (root.userData.windTargets as WindSwayTarget[] | undefined) ?? [];
  list.push(target);
  root.userData.windTargets = list;
}

export function getWindTargets(root: THREE.Object3D): WindSwayTarget[] {
  return (root.userData.windTargets as WindSwayTarget[] | undefined) ?? [];
}

/**
 * Generates an organic, faceted granite rock geometry by displacing shared vertices
 * using deterministic 3D harmonics so rocks have geological ridges & planar faces.
 */
export function createCraggyRockGeometry(
  radius: number,
  detail = 2,
  seed = 1,
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    const ridgeA = Math.sin(nx * 3.7 + seed * 1.9) * Math.cos(nz * 3.2 - seed * 0.7);
    const ridgeB = Math.sin((ny * 4.5 + nx * 2.8) + seed * 2.3);
    const strata = Math.abs(Math.sin(ny * 5.2 + seed)) * 0.08;
    const disp = 1 + ridgeA * 0.19 + ridgeB * 0.11 - strata;
    // Slightly flatten bottom contact area for grounded sitting
    const flatBottom = ny < -0.45 ? 0.82 : 1.0;
    pos.setXYZ(i, x * disp, y * disp * flatBottom, z * disp);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an organic drooping conifer bough tier with scalloped branch lobes
 * rather than a uniform geometric cone.
 */
export function createSculptedTreeTierGeometry(
  radius: number,
  height: number,
  seed = 1,
): THREE.BufferGeometry {
  const radialSegs = 16;
  const heightSegs = 4;
  const geo = new THREE.ConeGeometry(radius, height, radialSegs, heightSegs, false);
  const pos = geo.attributes.position;
  const halfH = height * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.02) continue;

    const angle = Math.atan2(z, x);
    // Normalized height from bottom skirt (0) to tip (1)
    const hNorm = THREE.MathUtils.clamp((y + halfH) / height, 0, 1);
    // Scalloped 7-8 branch clusters around circumference, strongest near lower skirt
    const lobeCount = 7 + (seed % 2);
    const lobe = Math.sin(angle * lobeCount + seed * 1.7 + hNorm * 1.4);
    const subLobe = Math.cos(angle * 3 - seed * 2.1) * 0.45;
    const skirtWeight = Math.pow(1 - hNorm, 0.85);

    const radialFactor = 1 + (lobe * 0.14 + subLobe * 0.08) * skirtWeight;
    // Slight natural gravity droop at outer branch tips
    const droopY = -Math.max(0, lobe) * 0.11 * height * skirtWeight;

    pos.setXYZ(i, x * radialFactor, y + droopY, z * radialFactor);
  }
  geo.computeVertexNormals();
  return geo;
}

function createLogMesh(
  radius: number,
  length: number,
  radialSegs: number,
  palette: MaterialPalette,
  useBirch = false,
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius * 1.04, length, radialSegs);
  const sideMat = useBirch ? palette.birchBarkMat : palette.barkMat;
  const mesh = new THREE.Mesh(geo, [sideMat, palette.logEndMat, palette.logEndMat]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export interface MaterialPalette {
  snowMat: THREE.MeshStandardMaterial;
  pineNeedleMat: THREE.MeshStandardMaterial;
  spruceNeedleMat: THREE.MeshStandardMaterial;
  elderNeedleMat: THREE.MeshStandardMaterial;
  barkMat: THREE.MeshStandardMaterial;
  birchBarkMat: THREE.MeshStandardMaterial;
  logEndMat: THREE.MeshStandardMaterial;
  timberMat: THREE.MeshStandardMaterial;
  darkWoodMat: THREE.MeshStandardMaterial;
  stoneMat: THREE.MeshStandardMaterial;
  rockMat: THREE.MeshStandardMaterial;
  ironMat: THREE.MeshStandardMaterial;
  goldMat: THREE.MeshStandardMaterial;
  frostSteelMat: THREE.MeshStandardMaterial;
  iceMat: THREE.MeshPhysicalMaterial;
  warmWindowMat: THREE.MeshStandardMaterial;
  emberMat: THREE.MeshStandardMaterial;
  furTrimMat: THREE.MeshPhysicalMaterial;
  skinMat: THREE.MeshStandardMaterial;
  coatRedMat: THREE.MeshPhysicalMaterial;
  coatBlueMat: THREE.MeshPhysicalMaterial;
  coatGreenMat: THREE.MeshPhysicalMaterial;
  canvasMat: THREE.MeshStandardMaterial;
  hareMat: THREE.MeshPhysicalMaterial;
  foxMat: THREE.MeshPhysicalMaterial;
  foxDarkMat: THREE.MeshStandardMaterial;
  stagMat: THREE.MeshPhysicalMaterial;
  antlerMat: THREE.MeshStandardMaterial;
  wolfMat: THREE.MeshPhysicalMaterial;
  wolfDarkMat: THREE.MeshStandardMaterial;
  lynxMat: THREE.MeshPhysicalMaterial;
  polarBearMat: THREE.MeshPhysicalMaterial;
  frostStagMat: THREE.MeshPhysicalMaterial;
  mammothMat: THREE.MeshPhysicalMaterial;
  mammothUnderMat: THREE.MeshPhysicalMaterial;
  muskOxMat: THREE.MeshPhysicalMaterial;
  muskOxWoolMat: THREE.MeshPhysicalMaterial;
  sabertoothMat: THREE.MeshPhysicalMaterial;
  auroraFenrirMat: THREE.MeshPhysicalMaterial;
  auroraCrystalMat: THREE.MeshPhysicalMaterial;
  mythicMat: THREE.MeshStandardMaterial;
  ivoryMat: THREE.MeshPhysicalMaterial;
  eyeGlintMat: THREE.MeshPhysicalMaterial;
  eyeScleraMat: THREE.MeshStandardMaterial;
  eyeCatchlightMat: THREE.MeshBasicMaterial;
  predatorEyeMat: THREE.MeshStandardMaterial;
  noseWetMat: THREE.MeshPhysicalMaterial;
  innerEarMat: THREE.MeshStandardMaterial;
  clawMat: THREE.MeshStandardMaterial;
  bootLeatherMat: THREE.MeshStandardMaterial;
  contactShadowMat: THREE.MeshBasicMaterial;
}

export function createMaterialPalette(textures: ProceduralTextureSet): MaterialPalette {
  return {
    snowMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.snowMap,
      bumpMap: textures.snowBump,
      bumpScale: 0.045,
      roughnessMap: textures.snowRoughness,
      roughness: 0.78,
      metalness: 0.02,
    }),
    pineNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x244c3c,
      bumpMap: textures.barkBump,
      bumpScale: 0.03,
      roughness: 0.84,
      metalness: 0.02,
    }),
    spruceNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x1a3b32,
      bumpMap: textures.barkBump,
      bumpScale: 0.03,
      roughness: 0.85,
      metalness: 0.02,
    }),
    elderNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x2c6054,
      bumpMap: textures.barkBump,
      bumpScale: 0.035,
      roughness: 0.76,
      metalness: 0.05,
    }),
    barkMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.barkMap,
      bumpMap: textures.barkBump,
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.02,
    }),
    birchBarkMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.birchBarkMap,
      bumpMap: textures.birchBarkBump,
      bumpScale: 0.04,
      roughness: 0.82,
      metalness: 0.02,
    }),
    logEndMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.logEndMap,
      bumpMap: textures.timberBump,
      bumpScale: 0.025,
      roughness: 0.78,
      metalness: 0.02,
    }),
    timberMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.timberMap,
      bumpMap: textures.timberBump,
      bumpScale: 0.04,
      roughness: 0.74,
      metalness: 0.04,
    }),
    darkWoodMat: new THREE.MeshStandardMaterial({
      color: 0x5c3c27,
      map: textures.timberMap,
      bumpMap: textures.timberBump,
      bumpScale: 0.035,
      roughness: 0.8,
      metalness: 0.05,
    }),
    stoneMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.065,
      roughness: 0.86,
      metalness: 0.05,
    }),
    rockMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.rockMap,
      bumpMap: textures.rockBump,
      bumpScale: 0.075,
      roughness: 0.88,
      metalness: 0.06,
    }),
    ironMat: new THREE.MeshStandardMaterial({
      color: 0x768594,
      bumpMap: textures.metalBump,
      bumpScale: 0.025,
      roughness: 0.3,
      metalness: 0.88,
    }),
    goldMat: new THREE.MeshStandardMaterial({
      color: 0xf7c648,
      bumpMap: textures.metalBump,
      bumpScale: 0.015,
      roughness: 0.2,
      metalness: 0.94,
    }),
    frostSteelMat: new THREE.MeshStandardMaterial({
      color: 0x86e3ff,
      emissive: 0x1e6088,
      emissiveIntensity: 0.48,
      bumpMap: textures.metalBump,
      bumpScale: 0.02,
      roughness: 0.18,
      metalness: 0.92,
    }),
    iceMat: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.iceMap,
      bumpMap: textures.iceBump,
      bumpScale: 0.04,
      emissive: 0x176aa8,
      emissiveIntensity: 0.56,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.93,
    }),
    warmWindowMat: new THREE.MeshStandardMaterial({
      color: 0xffd78a,
      emissive: 0xff9b35,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.08,
    }),
    emberMat: new THREE.MeshStandardMaterial({
      color: 0xff7024,
      emissive: 0xff5a12,
      emissiveIntensity: 1.85,
      bumpMap: textures.rockBump,
      bumpScale: 0.04,
      roughness: 0.45,
      metalness: 0.05,
    }),
    furTrimMat: new THREE.MeshPhysicalMaterial({
      color: 0xf3eee3,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.035,
      roughness: 0.92,
      metalness: 0.0,
      sheen: 0.6,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color(0xffffff),
    }),
    skinMat: new THREE.MeshStandardMaterial({
      color: 0xe6b593,
      roughness: 0.62,
      metalness: 0.02,
    }),
    coatRedMat: new THREE.MeshPhysicalMaterial({
      color: 0xb83c33,
      map: textures.fabricMap,
      bumpMap: textures.fabricBump,
      bumpScale: 0.03,
      roughness: 0.82,
      metalness: 0.03,
      sheen: 0.35,
      sheenRoughness: 0.85,
    }),
    coatBlueMat: new THREE.MeshPhysicalMaterial({
      color: 0x36648f,
      map: textures.fabricMap,
      bumpMap: textures.fabricBump,
      bumpScale: 0.03,
      roughness: 0.82,
      metalness: 0.03,
      sheen: 0.35,
      sheenRoughness: 0.85,
    }),
    coatGreenMat: new THREE.MeshPhysicalMaterial({
      color: 0x3b6e4e,
      map: textures.fabricMap,
      bumpMap: textures.fabricBump,
      bumpScale: 0.03,
      roughness: 0.82,
      metalness: 0.03,
      sheen: 0.35,
      sheenRoughness: 0.85,
    }),
    canvasMat: new THREE.MeshStandardMaterial({
      color: 0xd9be94,
      map: textures.fabricMap,
      bumpMap: textures.fabricBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.02,
    }),
    hareMat: new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fb,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.03,
      roughness: 0.86,
      metalness: 0.01,
      sheen: 0.5,
      sheenRoughness: 0.75,
    }),
    foxMat: new THREE.MeshPhysicalMaterial({
      color: 0xd96126,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.035,
      roughness: 0.8,
      metalness: 0.02,
      sheen: 0.55,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color(0xffb478),
    }),
    foxDarkMat: new THREE.MeshStandardMaterial({
      color: 0x2b2421,
      bumpMap: textures.furBump,
      bumpScale: 0.025,
      roughness: 0.84,
      metalness: 0.04,
    }),
    stagMat: new THREE.MeshPhysicalMaterial({
      color: 0x946241,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.035,
      roughness: 0.8,
      metalness: 0.02,
      sheen: 0.45,
      sheenRoughness: 0.7,
    }),
    antlerMat: new THREE.MeshStandardMaterial({
      color: 0xe6dac5,
      bumpMap: textures.barkBump,
      bumpScale: 0.015,
      roughness: 0.44,
      metalness: 0.08,
    }),
    wolfMat: new THREE.MeshPhysicalMaterial({
      color: 0x626d7d,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.03,
      sheen: 0.5,
      sheenRoughness: 0.7,
    }),
    wolfDarkMat: new THREE.MeshStandardMaterial({
      color: 0x323945,
      bumpMap: textures.furBump,
      bumpScale: 0.035,
      roughness: 0.86,
      metalness: 0.04,
    }),
    lynxMat: new THREE.MeshPhysicalMaterial({
      color: 0xd4d8de,
      map: textures.lynxFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.038,
      roughness: 0.84,
      metalness: 0.02,
      sheen: 0.55,
      sheenRoughness: 0.68,
      sheenColor: new THREE.Color(0xeef2f7),
    }),
    polarBearMat: new THREE.MeshPhysicalMaterial({
      color: 0xf4f1e8,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.048,
      roughness: 0.88,
      metalness: 0.01,
      sheen: 0.6,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color(0xffffff),
    }),
    frostStagMat: new THREE.MeshPhysicalMaterial({
      color: 0xeaf4fc,
      map: textures.furMap,
      bumpMap: textures.furBump,
      bumpScale: 0.035,
      roughness: 0.74,
      metalness: 0.03,
      sheen: 0.7,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0x9fe8ff),
    }),
    mammothMat: new THREE.MeshPhysicalMaterial({
      color: 0x5c4230,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.06,
      roughness: 0.92,
      metalness: 0.02,
      sheen: 0.45,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0x9a785c),
    }),
    mammothUnderMat: new THREE.MeshPhysicalMaterial({
      color: 0x3e2b1e,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.055,
      roughness: 0.94,
      metalness: 0.02,
    }),
    muskOxMat: new THREE.MeshPhysicalMaterial({
      color: 0x453124,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.055,
      roughness: 0.92,
      metalness: 0.02,
      sheen: 0.45,
      sheenRoughness: 0.78,
      sheenColor: new THREE.Color(0x886a54),
    }),
    muskOxWoolMat: new THREE.MeshPhysicalMaterial({
      color: 0x2b1e16,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.06,
      roughness: 0.95,
      metalness: 0.01,
    }),
    sabertoothMat: new THREE.MeshPhysicalMaterial({
      color: 0xd9b382,
      map: textures.lynxFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.036,
      roughness: 0.78,
      metalness: 0.02,
      sheen: 0.55,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color(0xf6dfc2),
    }),
    auroraFenrirMat: new THREE.MeshPhysicalMaterial({
      color: 0x1e2c48,
      map: textures.shaggyFurMap,
      bumpMap: textures.furBump,
      bumpScale: 0.045,
      roughness: 0.74,
      metalness: 0.06,
      sheen: 0.85,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color(0x68f0ff),
    }),
    auroraCrystalMat: new THREE.MeshPhysicalMaterial({
      color: 0x8ef7ff,
      map: textures.iceMap,
      bumpMap: textures.iceBump,
      bumpScale: 0.03,
      emissive: 0xa855f7,
      emissiveIntensity: 1.05,
      roughness: 0.1,
      metalness: 0.12,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.92,
    }),
    mythicMat: new THREE.MeshStandardMaterial({
      color: 0xf4c4ff,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.62,
      bumpMap: textures.metalBump,
      bumpScale: 0.018,
      roughness: 0.16,
      metalness: 0.94,
    }),
    ivoryMat: new THREE.MeshPhysicalMaterial({
      color: 0xf4ecd8,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
    }),
    eyeGlintMat: new THREE.MeshPhysicalMaterial({
      color: 0x16181d,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }),
    eyeScleraMat: new THREE.MeshStandardMaterial({
      color: 0xeef2f7,
      roughness: 0.35,
      metalness: 0.02,
    }),
    eyeCatchlightMat: new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }),
    predatorEyeMat: new THREE.MeshStandardMaterial({
      color: 0xf4a836,
      emissive: 0xc26c14,
      emissiveIntensity: 0.75,
      roughness: 0.18,
      metalness: 0.1,
    }),
    noseWetMat: new THREE.MeshPhysicalMaterial({
      color: 0x1b1918,
      roughness: 0.22,
      metalness: 0.04,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
    }),
    innerEarMat: new THREE.MeshStandardMaterial({
      color: 0xd9a192,
      roughness: 0.78,
      metalness: 0.0,
    }),
    clawMat: new THREE.MeshStandardMaterial({
      color: 0x2a2623,
      roughness: 0.32,
      metalness: 0.12,
    }),
    bootLeatherMat: new THREE.MeshStandardMaterial({
      color: 0x3b2a20,
      bumpMap: textures.fabricBump,
      bumpScale: 0.02,
      roughness: 0.68,
      metalness: 0.06,
    }),
    contactShadowMat: new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.78,
    }),
  };
}

function addContactShadow(parent: THREE.Group, mat: THREE.MeshBasicMaterial, radius: number): void {
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  parent.add(shadow);
}

export interface CharacterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  torsoPivot: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightLeg: THREE.Group;
  rightKnee: THREE.Group;
  leftArm: THREE.Group;
  leftElbow: THREE.Group;
  rightArm: THREE.Group;
  rightElbow: THREE.Group;
  axeGroup: THREE.Group;
  bowGroup: THREE.Group;
  quiverGroup: THREE.Group;
  backpackGroup: THREE.Group;
  auroraClaspMesh: THREE.Mesh;
  auroraClaspMat: THREE.MeshStandardMaterial;
  coatMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  bootMat: THREE.MeshStandardMaterial;
  gloveMat: THREE.MeshStandardMaterial;
  packMat: THREE.MeshStandardMaterial;
  axeHeadMat: THREE.MeshStandardMaterial;
  axeRuneMat: THREE.MeshStandardMaterial;
  axeRuneMesh: THREE.Mesh;
  axeDoubleBitMesh: THREE.Mesh;
  axeHalberdSpikeGroup: THREE.Group;
  axeAuraHaloMesh: THREE.Mesh;
  bowLimbMat: THREE.MeshStandardMaterial;
  bowCrystalMat: THREE.MeshStandardMaterial;
  bowCrystalGroup: THREE.Group;
  bowCompoundCamsGroup: THREE.Group;
  bowWingBladesGroup: THREE.Group;
  bowAuraHaloMesh: THREE.Mesh;
  bowStringMesh: THREE.Mesh;
  bowArrowGroup: THREE.Group;
  slashArcMesh: THREE.Mesh;
  slashArcMat: THREE.MeshBasicMaterial;
  pauldronsGroup: THREE.Group;
  gearAuraGroup: THREE.Group;
  gearGroundRingMesh: THREE.Mesh;
  gearGroundRingMat: THREE.MeshBasicMaterial;
  gearOrbitMotesGroup: THREE.Group;
  wingsGroup: THREE.Group;
  leftWingPivot: THREE.Group;
  rightWingPivot: THREE.Group;
  wingsHaloMesh: THREE.Mesh;
}

export function createCharacterRig(
  palette: MaterialPalette,
  coatMat: THREE.MeshStandardMaterial,
  withWeapons = true,
): CharacterRig {
  const rigCoatMat = coatMat.clone();
  const rigTrimMat = palette.furTrimMat.clone();
  const rigBootMat = palette.bootLeatherMat.clone();
  const rigGloveMat = palette.bootLeatherMat.clone();
  const rigPackMat = palette.timberMat.clone();

  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 0.76);

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // Articulated 2-segment winter legs (hip -> knee -> fur-cuffed mukluk boot)
  const makeLeg = (x: number): { legPivot: THREE.Group; kneePivot: THREE.Group } => {
    const legPivot = new THREE.Group();
    legPivot.position.set(x, 0.6, 0);

    const hipCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 12, 10),
      palette.darkWoodMat,
    );
    hipCap.scale.set(1, 0.9, 1);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.136, 0.11, 0.3, 14),
      palette.darkWoodMat,
    );
    thigh.position.y = -0.15;
    thigh.castShadow = true;

    const kneeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.112, 12, 10),
      palette.darkWoodMat,
    );
    kneeSphere.position.y = -0.3;

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.3, 0);

    const bootCuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.108, 0.042, 8, 16),
      rigTrimMat,
    );
    bootCuff.rotation.x = Math.PI / 2;
    bootCuff.position.y = -0.02;

    const bootShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.112, 0.122, 0.19, 14),
      rigBootMat,
    );
    bootShaft.position.y = -0.12;
    bootShaft.castShadow = true;

    const bootAnkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.112, 12, 10),
      rigBootMat,
    );
    bootAnkle.position.set(0, -0.21, 0.01);

    const bootFoot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.15, 6, 12),
      rigBootMat,
    );
    bootFoot.rotation.x = Math.PI / 2;
    bootFoot.position.set(0, -0.22, 0.075);
    bootFoot.castShadow = true;

    const bootToeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 10, 8),
      palette.foxDarkMat,
    );
    bootToeCap.scale.set(1.0, 0.72, 1.05);
    bootToeCap.position.set(0, -0.23, 0.145);

    const bootSole = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.098, 0.17, 4, 10),
      palette.foxDarkMat,
    );
    bootSole.rotation.x = Math.PI / 2;
    bootSole.scale.set(1.04, 1.0, 0.44);
    bootSole.position.set(0, -0.275, 0.065);

    kneePivot.add(bootCuff, bootShaft, bootAnkle, bootFoot, bootToeCap, bootSole);
    legPivot.add(hipCap, thigh, kneeSphere, kneePivot);
    return { legPivot, kneePivot };
  };

  const leftLegBuilt = makeLeg(-0.175);
  const rightLegBuilt = makeLeg(0.175);
  const leftLeg = leftLegBuilt.legPivot;
  const leftKnee = leftLegBuilt.kneePivot;
  const rightLeg = rightLegBuilt.legPivot;
  const rightKnee = rightLegBuilt.kneePivot;
  bodyGroup.add(leftLeg, rightLeg);

  // Upper body torso pivot (allows sprint lean, crouch stealth, and axe cleave twist)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.56, 0);
  bodyGroup.add(torsoPivot);

  // Sculpted insulated winter parka (Lathe profile with flared hem + broad chest + shoulders)
  const parkaProfile = [
    new THREE.Vector2(0.01, -0.06),
    new THREE.Vector2(0.41, -0.04),
    new THREE.Vector2(0.38, 0.16),
    new THREE.Vector2(0.33, 0.36),
    new THREE.Vector2(0.37, 0.62),
    new THREE.Vector2(0.34, 0.77),
    new THREE.Vector2(0.17, 0.83),
    new THREE.Vector2(0.01, 0.83),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(parkaProfile, 20), rigCoatMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoPivot.add(torso);

  // Parka fur-lined bottom hem & curved storm lapel placket with brass buttons
  const furHem = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.044, 10, 24),
    rigTrimMat,
  );
  furHem.rotation.x = Math.PI / 2;
  furHem.position.y = -0.03;

  const placket = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.048, 0.64, 4, 8),
    palette.bootLeatherMat,
  );
  placket.scale.set(1.15, 1.0, 0.45);
  placket.position.set(0, 0.38, 0.345);
  torsoPivot.add(furHem, placket);

  for (const by of [0.16, 0.34, 0.52, 0.68]) {
    const toggle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.024, 8),
      palette.goldMat,
    );
    toggle.rotation.x = Math.PI / 2;
    toggle.position.set(0, by, 0.368);
    torsoPivot.add(toggle);
  }

  // Tier 3+ chest clasp emblem (glows on higher coat / gear set tiers)
  const auroraClaspMat = new THREE.MeshStandardMaterial({
    color: 0x7be0ff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.5,
  });
  const auroraClaspMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.056, 0),
    auroraClaspMat,
  );
  auroraClaspMesh.scale.set(0.95, 1.2, 0.6);
  auroraClaspMesh.position.set(0, 0.61, 0.388);
  auroraClaspMesh.visible = false;
  torsoPivot.add(auroraClaspMesh);

  // Sculpted leather waist belt, brass buckle, and hip utility pouch
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.342, 0.352, 0.09, 20),
    palette.bootLeatherMat,
  );
  belt.position.y = 0.28;
  const buckleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.014, 6, 12),
    palette.goldMat,
  );
  buckleRing.position.set(0, 0.28, 0.356);
  const pouch = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.085, 0.07, 4, 10),
    palette.timberMat,
  );
  pouch.scale.set(0.9, 1.05, 0.65);
  pouch.position.set(-0.34, 0.23, 0.14);
  pouch.rotation.z = 0.14;
  const pouchFlap = new THREE.Mesh(
    new THREE.SphereGeometry(0.078, 10, 8),
    palette.bootLeatherMat,
  );
  pouchFlap.scale.set(0.95, 0.55, 0.72);
  pouchFlap.position.set(-0.34, 0.29, 0.14);
  torsoPivot.add(belt, buckleRing, pouch, pouchFlap);

  // Layered winter fur collar, folded wool parka hood & shoulder mantle trim
  const furCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.245, 0.092, 10, 24),
    rigTrimMat,
  );
  furCollar.rotation.x = Math.PI / 2;
  furCollar.position.y = 0.79;
  const loweredHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    rigCoatMat,
  );
  loweredHood.scale.set(1.08, 0.78, 1.15);
  loweredHood.rotation.x = -Math.PI * 0.42;
  loweredHood.position.set(0, 0.78, -0.22);
  torsoPivot.add(furCollar, loweredHood);

  // Shoulder leather pack straps curving smoothly from front chest over shoulders
  for (const side of [-1, 1]) {
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.21, 0.28, 0.31),
      new THREE.Vector3(side * 0.25, 0.64, 0.25),
      new THREE.Vector3(side * 0.23, 0.81, 0.02),
      new THREE.Vector3(side * 0.19, 0.68, -0.25),
      new THREE.Vector3(side * 0.18, 0.34, -0.29),
    ]);
    const strap = new THREE.Mesh(
      new THREE.TubeGeometry(strapCurve, 14, 0.028, 6, false),
      palette.bootLeatherMat,
    );
    torsoPivot.add(strap);
  }

  // Expedition backpack + leather flap + brass clasp + rolled bedroll
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.48, -0.34);

  const pack = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.19, 0.24, 6, 14),
    rigPackMat,
  );
  pack.scale.set(1.12, 1.0, 0.72);
  pack.castShadow = true;
  const packFlap = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.12, 4, 12),
    palette.bootLeatherMat,
  );
  packFlap.rotation.z = Math.PI / 2;
  packFlap.scale.set(0.65, 1.0, 0.88);
  packFlap.position.set(0, 0.13, -0.01);
  const packBuckle = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.011, 6, 10),
    palette.goldMat,
  );
  packBuckle.position.set(0, 0.04, -0.135);
  const bedroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.46, 14),
    palette.canvasMat,
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.28, 0);
  bedroll.castShadow = true;
  backpackGroup.add(pack, packFlap, packBuckle, bedroll);
  torsoPivot.add(backpackGroup);

  // Back Quiver with feathered arrows (highlighted when bow equipped)
  const quiverGroup = new THREE.Group();
  quiverGroup.position.set(0.24, 0.52, -0.31);
  quiverGroup.rotation.z = -0.38;
  quiverGroup.rotation.x = 0.18;
  const quiverTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.052, 0.44, 12),
    palette.bootLeatherMat,
  );
  quiverTube.castShadow = true;
  const quiverRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.016, 6, 12),
    palette.furTrimMat,
  );
  quiverRim.rotation.x = Math.PI / 2;
  quiverRim.position.y = 0.22;
  quiverGroup.add(quiverTube, quiverRim);
  for (const [ax, az, rot] of [
    [-0.022, 0.015, 0.08],
    [0.02, -0.01, -0.06],
    [0.0, 0.024, 0.03],
  ] as const) {
    const fletchArrow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6),
      palette.antlerMat,
    );
    fletchArrow.position.set(ax, 0.28, az);
    fletchArrow.rotation.z = rot;
    const fletch = new THREE.Mesh(
      new THREE.ConeGeometry(0.026, 0.075, 4),
      palette.coatRedMat,
    );
    fletch.rotation.x = Math.PI;
    fletch.position.set(ax, 0.37, az);
    quiverGroup.add(fletchArrow, fletch);
  }
  quiverGroup.visible = false;
  torsoPivot.add(quiverGroup);

  // Articulated Sculpted Head + Ushanka Fur Hat (no blocky box shapes!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.89, 0);
  torsoPivot.add(headGroup);

  const neckScarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.068, 10, 20),
    palette.coatRedMat,
  );
  neckScarf.rotation.x = Math.PI / 2;
  neckScarf.position.y = -0.03;

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, 20, 18),
    palette.skinMat,
  );
  cranium.scale.set(0.96, 1.04, 1.02);
  cranium.position.y = 0.12;
  cranium.castShadow = true;

  // Sculpted warm nose & rosy cheeks
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 10, 8),
    palette.skinMat,
  );
  nose.scale.set(0.88, 0.95, 1.28);
  nose.position.set(0, 0.1, 0.215);

  const chinBeard = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.52),
    palette.darkWoodMat,
  );
  chinBeard.scale.set(0.95, 1.05, 0.98);
  chinBeard.position.set(0, 0.095, 0.045);

  // Expressive layered eyes (sclera + dark iris + bright glint + sculpted brow ridge)
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 10, 8),
      palette.eyeScleraMat,
    );
    eyeSocket.scale.set(1.05, 0.85, 0.6);
    eyeSocket.position.set(side * 0.076, 0.148, 0.19);

    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 8),
      palette.eyeGlintMat,
    );
    iris.position.set(side * 0.076, 0.148, 0.205);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 6, 6),
      palette.eyeCatchlightMat,
    );
    glint.position.set(side * 0.083, 0.156, 0.222);

    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.014, 0.048, 4, 6),
      palette.darkWoodMat,
    );
    brow.rotation.z = Math.PI / 2 - side * 0.12;
    brow.position.set(side * 0.076, 0.188, 0.198);

    headGroup.add(eyeSocket, iris, glint, brow);
  }

  // Tailored Ushanka Hat: stitched dome crown + curved fur front cuff + ear flaps
  const hatCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.242, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    palette.bootLeatherMat,
  );
  hatCrown.position.y = 0.185;
  hatCrown.castShadow = true;

  const hatRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.215, 0.056, 10, 22),
    palette.furTrimMat,
  );
  hatRim.rotation.x = Math.PI / 2;
  hatRim.position.set(0, 0.21, -0.01);

  const hatFrontFold = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.085, 0.24, 6, 12),
    palette.furTrimMat,
  );
  hatFrontFold.rotation.z = Math.PI / 2;
  hatFrontFold.scale.set(0.88, 1.0, 0.72);
  hatFrontFold.position.set(0, 0.255, 0.175);

  for (const side of [-1, 1]) {
    const earFlap = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.15, 6, 10),
      palette.furTrimMat,
    );
    earFlap.scale.set(0.8, 1.0, 1.05);
    earFlap.position.set(side * 0.228, 0.11, 0.0);
    earFlap.rotation.z = side * 0.16;

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.11, 6),
      palette.darkWoodMat,
    );
    cord.position.set(side * 0.215, -0.01, 0.03);
    headGroup.add(earFlap, cord);
  }

  headGroup.add(neckScarf, cranium, nose, chinBeard, hatCrown, hatRim, hatFrontFold);

  // Articulated 2-segment arms (shoulder -> upper sleeve -> elbow -> forearm -> fur cuff -> mitten)
  const makeArm = (
    x: number,
    isLeft: boolean,
  ): { armPivot: THREE.Group; elbowPivot: THREE.Group } => {
    const armPivot = new THREE.Group();
    armPivot.position.set(x, 0.71, 0);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.118, 14, 12),
      rigCoatMat,
    );
    shoulder.castShadow = true;

    const upperSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.106, 0.094, 0.22, 14),
      rigCoatMat,
    );
    upperSleeve.position.y = -0.11;
    upperSleeve.castShadow = true;

    const elbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 12, 10),
      rigCoatMat,
    );
    elbowJoint.position.y = -0.22;

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.22, 0);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.092, 0.08, 0.2, 14),
      rigCoatMat,
    );
    forearm.position.y = -0.1;
    forearm.castShadow = true;

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.084, 0.032, 8, 14),
      rigTrimMat,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.19;

    const bracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.089, 0.084, 0.11, 12),
      rigGloveMat,
    );
    bracer.position.y = -0.115;

    const mitten = new THREE.Mesh(
      new THREE.SphereGeometry(0.088, 12, 10),
      rigGloveMat,
    );
    mitten.scale.set(0.95, 1.15, 1.05);
    mitten.position.y = -0.265;

    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.045, 4, 8),
      rigGloveMat,
    );
    thumb.position.set(isLeft ? 0.065 : -0.065, -0.25, 0.05);
    thumb.rotation.z = isLeft ? -0.45 : 0.45;
    thumb.rotation.x = 0.35;

    elbowPivot.add(forearm, bracer, cuff, mitten, thumb);
    armPivot.add(shoulder, upperSleeve, elbowJoint, elbowPivot);
    return { armPivot, elbowPivot };
  };

  const leftArmBuilt = makeArm(-0.415, true);
  const rightArmBuilt = makeArm(0.415, false);
  const leftArm = leftArmBuilt.armPivot;
  const leftElbow = leftArmBuilt.elbowPivot;
  const rightArm = rightArmBuilt.armPivot;
  const rightElbow = rightArmBuilt.elbowPivot;
  torsoPivot.add(leftArm, rightArm);

  // Weapons: Forged Bearded Nordic Woodaxe (right hand) & Recurve Bow (left hand)
  const axeHeadMat = palette.ironMat.clone();
  const axeRuneMat = new THREE.MeshStandardMaterial({
    color: 0x9cecff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.7,
  });
  const axeGroup = new THREE.Group();
  axeGroup.position.set(0, -0.265, 0.06);
  axeGroup.rotation.x = Math.PI / 2.25;

  const axeShaftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.18, 0.02),
    new THREE.Vector3(0, 0.08, 0),
    new THREE.Vector3(0, 0.42, -0.015),
    new THREE.Vector3(0, 0.72, 0.01),
  ]);
  const axeHandle = new THREE.Mesh(
    new THREE.TubeGeometry(axeShaftCurve, 14, 0.032, 10, false),
    palette.timberMat,
  );
  axeHandle.castShadow = true;

  const gripWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.04, 0.24, 12),
    palette.bootLeatherMat,
  );
  gripWrap.position.y = -0.02;

  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 10, 8),
    palette.goldMat,
  );
  pommel.position.set(0, -0.185, 0.02);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -0.075);
  bladeShape.lineTo(0.3, -0.19);
  bladeShape.quadraticCurveTo(0.37, 0, 0.29, 0.16);
  bladeShape.lineTo(0, 0.09);
  bladeShape.closePath();
  const axeBladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.052,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  axeBladeGeo.translate(0, 0, -0.026);
  axeBladeGeo.rotateY(Math.PI / 2);
  const axeBlade = new THREE.Mesh(axeBladeGeo, axeHeadMat);
  axeBlade.position.set(0, 0.68, 0.025);
  axeBlade.castShadow = true;

  // Tier 4+ glowing forged rune inlay along axe beard
  const axeRuneMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.014, 6, 16, Math.PI * 1.15),
    axeRuneMat,
  );
  axeRuneMesh.rotation.y = Math.PI / 2;
  axeRuneMesh.rotation.z = -Math.PI * 0.57;
  axeRuneMesh.position.set(0, 0.68, 0.16);
  axeRuneMesh.visible = false;

  const axePoll = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.048, 0.08, 4, 8),
    palette.darkWoodMat,
  );
  axePoll.rotation.z = Math.PI / 2;
  axePoll.position.set(0, 0.68, -0.02);

  // Tier 3+ Twin-bitted rear battleaxe blade (mirrored crescent)
  const axeDoubleBitGeo = axeBladeGeo.clone();
  axeDoubleBitGeo.scale(0.86, 0.92, -0.88);
  const axeDoubleBitMesh = new THREE.Mesh(axeDoubleBitGeo, axeHeadMat);
  axeDoubleBitMesh.position.set(0, 0.68, -0.025);
  axeDoubleBitMesh.castShadow = true;
  axeDoubleBitMesh.visible = false;

  // Tier 5+ Halberd spear spike & winged crossguard at top of shaft
  const axeHalberdSpikeGroup = new THREE.Group();
  axeHalberdSpikeGroup.position.set(0, 0.78, 0.01);
  axeHalberdSpikeGroup.visible = false;
  const halberdSpike = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.28, 6),
    axeHeadMat,
  );
  halberdSpike.position.y = 0.14;
  const halberdCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.056, 0.014, 6, 12),
    palette.goldMat,
  );
  halberdCollar.rotation.x = Math.PI / 2;
  axeHalberdSpikeGroup.add(halberdSpike, halberdCollar);

  // Tier 6+ Spinning Mythic Weapon Aura Halo around axe head
  const axeAuraHaloMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.012, 8, 24),
    axeRuneMat,
  );
  axeAuraHaloMesh.rotation.y = Math.PI / 2;
  axeAuraHaloMesh.position.set(0, 0.68, 0.04);
  axeAuraHaloMesh.visible = false;

  axeGroup.add(
    axeHandle,
    gripWrap,
    pommel,
    axeBlade,
    axeRuneMesh,
    axePoll,
    axeDoubleBitMesh,
    axeHalberdSpikeGroup,
    axeAuraHaloMesh,
  );

  const bowLimbMat = palette.timberMat.clone();
  const bowCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x8ef7ff,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.0,
    roughness: 0.18,
    metalness: 0.4,
  });
  const bowGroup = new THREE.Group();
  bowGroup.position.set(0.02, -0.25, 0.02);
  bowGroup.rotation.x = Math.PI * 0.43;
  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.58, -0.2),
    new THREE.Vector3(0, -0.36, 0.03),
    new THREE.Vector3(0, -0.13, 0.22),
    new THREE.Vector3(0, 0, 0.24),
    new THREE.Vector3(0, 0.13, 0.22),
    new THREE.Vector3(0, 0.36, 0.03),
    new THREE.Vector3(0, 0.58, -0.2),
  ]);
  const bowArc = new THREE.Mesh(
    new THREE.TubeGeometry(bowCurve, 26, 0.032, 10, false),
    bowLimbMat,
  );
  const bowGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.22, 10),
    palette.bootLeatherMat,
  );
  bowGrip.position.z = 0.23;

  // Tier 3+ Compound Cams & Front Stabilizer Rod
  const bowCompoundCamsGroup = new THREE.Group();
  bowCompoundCamsGroup.visible = false;
  for (const cy of [-0.56, 0.56]) {
    const camWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.022, 12),
      palette.goldMat,
    );
    camWheel.rotation.z = Math.PI / 2;
    camWheel.position.set(0, cy, -0.19);
    bowCompoundCamsGroup.add(camWheel);
  }
  const stabilizerRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.24, 8),
    palette.ironMat,
  );
  stabilizerRod.rotation.x = Math.PI / 2;
  stabilizerRod.position.set(0, -0.06, 0.34);
  bowCompoundCamsGroup.add(stabilizerRod);

  // Tier 5+ Swept Crystalline Wing-Blades along bow limbs
  const bowWingBladesGroup = new THREE.Group();
  bowWingBladesGroup.visible = false;
  for (const signY of [-1, 1]) {
    const wingBlade = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.34, 5),
      bowCrystalMat,
    );
    wingBlade.position.set(0, signY * 0.34, 0.14);
    wingBlade.rotation.x = signY > 0 ? 0.42 : Math.PI - 0.42;
    bowWingBladesGroup.add(wingBlade);
  }

  // Tier 6+ Spinning Mythic Bow Aura Halo
  const bowAuraHaloMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.011, 8, 24),
    bowCrystalMat,
  );
  bowAuraHaloMesh.rotation.y = Math.PI / 2;
  bowAuraHaloMesh.position.set(0, 0, 0.14);
  bowAuraHaloMesh.visible = false;

  const bowCrystalGroup = new THREE.Group();
  bowCrystalGroup.visible = false;
  for (const ty of [-0.58, 0.58]) {
    const hornTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.028, 0.085, 8),
      palette.antlerMat,
    );
    hornTip.position.set(0, ty + (ty > 0 ? 0.02 : -0.02), -0.21);
    hornTip.rotation.x = ty > 0 ? -0.45 : Math.PI + 0.45;
    bowGroup.add(hornTip);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.046, 0),
      bowCrystalMat,
    );
    gem.position.set(0, ty * 0.85, -0.12);
    bowCrystalGroup.add(gem);
  }
  const riserSight = new THREE.Mesh(
    new THREE.TorusGeometry(0.056, 0.011, 6, 14),
    bowCrystalMat,
  );
  riserSight.position.set(0, 0, 0.29);
  bowCrystalGroup.add(riserSight);

  const bowStringMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 1.14, 8),
    palette.furTrimMat,
  );
  bowStringMesh.position.z = -0.19;

  const bowArrowGroup = new THREE.Group();
  const arrowShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.78, 8),
    palette.antlerMat,
  );
  arrowShaft.rotation.x = Math.PI / 2;
  arrowShaft.position.z = 0.16;
  const arrowTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.1, 6),
    palette.ironMat,
  );
  arrowTip.rotation.x = Math.PI / 2;
  arrowTip.position.z = 0.57;
  const arrowFletch = new THREE.Mesh(
    new THREE.ConeGeometry(0.034, 0.11, 4),
    palette.coatRedMat,
  );
  arrowFletch.rotation.x = Math.PI / 2;
  arrowFletch.position.z = -0.18;
  bowArrowGroup.add(arrowShaft, arrowTip, arrowFletch);

  bowGroup.add(
    bowArc,
    bowGrip,
    bowCompoundCamsGroup,
    bowWingBladesGroup,
    bowAuraHaloMesh,
    bowCrystalGroup,
    bowStringMesh,
    bowArrowGroup,
  );
  bowGroup.visible = false;

  // Shoulder Pauldrons for higher Gear Tiers (Coat/Gloves Tier 3+)
  const pauldronsGroup = new THREE.Group();
  pauldronsGroup.visible = false;
  for (const side of [-1, 1]) {
    const pauldronPlate = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      palette.goldMat,
    );
    pauldronPlate.position.set(side * 0.4, 0.76, 0);
    pauldronPlate.rotation.z = -side * 0.38;
    pauldronPlate.scale.set(1.15, 0.9, 1.18);

    const pauldronSpike = new THREE.Mesh(
      new THREE.ConeGeometry(0.034, 0.13, 5),
      auroraClaspMat,
    );
    pauldronSpike.position.set(side * 0.46, 0.85, 0);
    pauldronSpike.rotation.z = -side * 0.45;
    pauldronsGroup.add(pauldronPlate, pauldronSpike);
  }
  torsoPivot.add(pauldronsGroup);

  // Articulated 3D Mythic "Wings of Fire" on player/Valkyra back
  const wingsGroup = new THREE.Group();
  wingsGroup.position.set(0, 0.68, -0.28);
  wingsGroup.visible = false;

  const wingCoreMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff6b00,
    emissiveIntensity: 1.55,
    roughness: 0.2,
    metalness: 0.35,
  });
  const wingFeatherMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xe11d48,
    emissiveIntensity: 1.25,
    roughness: 0.25,
    metalness: 0.2,
  });
  const wingTipMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffbe0b,
    emissiveIntensity: 1.75,
    roughness: 0.16,
    metalness: 0.25,
  });
  const wingVeilMat = new THREE.MeshBasicMaterial({
    color: 0xff7b24,
    transparent: true,
    opacity: 0.44,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Sculpted smooth curved feather blade profile (airfoil/plume silhouette)
  const makeSmoothFeatherGeo = (len: number, width: number): THREE.BufferGeometry => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.72, -len * 0.18, width * 0.85, -len * 0.58, width * 0.18, -len * 0.94);
    shape.quadraticCurveTo(0, -len * 1.03, -width * 0.2, -len * 0.92);
    shape.bezierCurveTo(-width * 0.65, -len * 0.52, -width * 0.45, -len * 0.16, 0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 14,
    });
    geo.translate(0, 0, -0.008);
    return geo;
  };

  const makeFireWing = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.11, 0.02, 0);

    // Smooth arched tapered wingbone spar
    const sparPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.34, 0.29, -0.05),
      new THREE.Vector3(side * 0.74, 0.42, -0.14),
      new THREE.Vector3(side * 1.12, 0.24, -0.22),
    ];
    const sparGeo = createTaperedCurveGeometry(sparPoints, 0.036, 0.013, 8, 22);
    const spar = new THREE.Mesh(sparGeo, wingCoreMat);
    pivot.add(spar);

    // Soft glowing inner flame membrane connecting upper wing arc
    const veilShape = new THREE.Shape();
    veilShape.moveTo(0, 0);
    veilShape.bezierCurveTo(side * 0.36, 0.28, side * 0.76, 0.4, side * 1.08, 0.22);
    veilShape.bezierCurveTo(side * 0.82, -0.22, side * 0.44, -0.34, side * 0.08, -0.28);
    veilShape.closePath();
    const veilGeo = new THREE.ShapeGeometry(veilShape, 16);
    const veilMesh = new THREE.Mesh(veilGeo, wingVeilMat);
    veilMesh.position.z = -0.1;
    pivot.add(veilMesh);

    const feathersGroup = new THREE.Group();
    feathersGroup.name = 'wingFeathers';
    // 7 Smooth layered curved phoenix pinions with upper covert plumes
    const primaryCount = 7;
    for (let f = 0; f < primaryCount; f++) {
      const t = f / (primaryCount - 1);
      const fx = side * (0.18 + t * 0.88);
      const fy = 0.2 + Math.sin(t * Math.PI * 0.92) * 0.21 - t * 0.12;
      const fz = -0.05 - t * 0.15;
      const featherLen = 0.56 + (1 - Math.abs(t - 0.38)) * 0.38;
      const featherW = 0.105 + (1 - t) * 0.03;

      const featherGroup = new THREE.Group();
      featherGroup.position.set(fx, fy, fz);
      featherGroup.rotation.z = side * (0.28 + t * 0.58);
      featherGroup.rotation.x = 0.2;
      featherGroup.rotation.y = -side * (0.06 + t * 0.12);
      featherGroup.userData.baseRotZ = featherGroup.rotation.z;
      featherGroup.userData.phase = f * 0.45;

      const primaryBlade = new THREE.Mesh(
        makeSmoothFeatherGeo(featherLen, featherW),
        f % 2 === 0 ? wingFeatherMat : wingCoreMat,
      );
      const innerTipBlade = new THREE.Mesh(
        makeSmoothFeatherGeo(featherLen * 0.72, featherW * 0.62),
        wingTipMat,
      );
      innerTipBlade.position.set(0, -featherLen * 0.22, 0.012);

      // Soft upper covert feather layering the wing shoulder
      const covertBlade = new THREE.Mesh(
        makeSmoothFeatherGeo(featherLen * 0.45, featherW * 0.88),
        wingCoreMat,
      );
      covertBlade.position.set(0, 0.04, 0.024);
      covertBlade.rotation.x = -0.08;

      featherGroup.add(primaryBlade, innerTipBlade, covertBlade);
      feathersGroup.add(featherGroup);
    }
    pivot.add(feathersGroup);
    return pivot;
  };

  const leftWingPivot = makeFireWing(-1);
  const rightWingPivot = makeFireWing(1);
  const wingsHaloMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.016, 10, 36),
    wingTipMat,
  );
  wingsHaloMesh.position.set(0, 0.2, -0.14);
  wingsGroup.add(leftWingPivot, rightWingPivot, wingsHaloMesh);
  torsoPivot.add(wingsGroup);

  // Player Gear & Item Aura Ring + Orbiting Elemental Motes
  const gearAuraGroup = new THREE.Group();
  gearAuraGroup.visible = false;
  const gearGroundRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const gearGroundRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.86, 32),
    gearGroundRingMat,
  );
  gearGroundRingMesh.rotation.x = -Math.PI / 2;
  gearGroundRingMesh.position.y = 0.04;
  gearAuraGroup.add(gearGroundRingMesh);

  const gearOrbitMotesGroup = new THREE.Group();
  gearOrbitMotesGroup.position.y = 0.92;
  for (let m = 0; m < 4; m++) {
    const a = (m / 4) * Math.PI * 2;
    const mote = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 0),
      m % 2 === 0 ? auroraClaspMat : wingTipMat,
    );
    mote.position.set(Math.cos(a) * 0.68, (m % 2) * 0.14 - 0.07, Math.sin(a) * 0.68);
    gearOrbitMotesGroup.add(mote);
  }
  gearAuraGroup.add(gearOrbitMotesGroup);
  group.add(gearAuraGroup);

  // Crescent glowing swing arc VFX for axe cleaves
  const slashArcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slashArcGeo = new THREE.RingGeometry(0.68, 1.62, 28, 1, -Math.PI / 2 - 1.0, 2.0);
  const slashArcMesh = new THREE.Mesh(slashArcGeo, slashArcMat);
  slashArcMesh.rotation.x = -Math.PI / 2.25;
  slashArcMesh.position.set(0, 1.15, 0.28);
  slashArcMesh.visible = false;
  slashArcMesh.renderOrder = 6;
  group.add(slashArcMesh);

  if (withWeapons) {
    rightElbow.add(axeGroup);
    leftElbow.add(bowGroup);
  }

  return {
    group,
    bodyGroup,
    torsoPivot,
    headGroup,
    leftLeg,
    leftKnee,
    rightLeg,
    rightKnee,
    leftArm,
    leftElbow,
    rightArm,
    rightElbow,
    axeGroup,
    bowGroup,
    quiverGroup,
    backpackGroup,
    auroraClaspMesh,
    auroraClaspMat,
    coatMat: rigCoatMat,
    trimMat: rigTrimMat,
    bootMat: rigBootMat,
    gloveMat: rigGloveMat,
    packMat: rigPackMat,
    axeHeadMat,
    axeRuneMat,
    axeRuneMesh,
    axeDoubleBitMesh,
    axeHalberdSpikeGroup,
    axeAuraHaloMesh,
    bowLimbMat,
    bowCrystalMat,
    bowCrystalGroup,
    bowCompoundCamsGroup,
    bowWingBladesGroup,
    bowAuraHaloMesh,
    bowStringMesh,
    bowArrowGroup,
    slashArcMesh,
    slashArcMat,
    pauldronsGroup,
    gearAuraGroup,
    gearGroundRingMesh,
    gearGroundRingMat,
    gearOrbitMotesGroup,
    wingsGroup,
    leftWingPivot,
    rightWingPivot,
    wingsHaloMesh,
  };
}

/**
 * Updates 3D weapon tier geometry/scale/aura, shoulder pauldrons, gear & item orbiting aura,
 * and articulated 3D Wings of Fire on a CharacterRig.
 */
export function updateCharacterEquipmentVisuals(
  rig: CharacterRig,
  params: {
    axeLevel: number;
    bowLevel: number;
    gearAvgTier: number;
    activeBuffCount: number;
    wingsTier: number;
    wingsEquipped?: boolean;
    time: number;
    moveSpeedRatio?: number;
  },
): void {
  const {
    axeLevel,
    bowLevel,
    gearAvgTier,
    activeBuffCount,
    wingsTier,
    wingsEquipped = true,
    time,
    moveSpeedRatio = 0,
  } = params;

  const activeWings = wingsTier > 0 && wingsEquipped;

  // Progressive Axe shape & aura (Levels 1..7)
  const axeScale = 1 + Math.max(0, axeLevel - 1) * 0.085;
  rig.axeGroup.scale.setScalar(axeScale);
  rig.axeDoubleBitMesh.visible = axeLevel >= 3;
  rig.axeRuneMesh.visible = axeLevel >= 4;
  rig.axeHalberdSpikeGroup.visible = axeLevel >= 5;
  rig.axeAuraHaloMesh.visible = axeLevel >= 6;
  if (axeLevel >= 6) {
    rig.axeAuraHaloMesh.rotation.x = time * 2.8;
    const s = 1 + Math.sin(time * 5.2) * 0.08 + (axeLevel >= 7 ? 0.18 : 0);
    rig.axeAuraHaloMesh.scale.setScalar(s);
  }

  // Progressive Bow shape & aura (Levels 1..7)
  const bowScale = 1 + Math.max(0, bowLevel - 1) * 0.075;
  rig.bowGroup.scale.setScalar(bowScale);
  rig.bowCompoundCamsGroup.visible = bowLevel >= 3;
  rig.bowCrystalGroup.visible = bowLevel >= 4;
  rig.bowWingBladesGroup.visible = bowLevel >= 5;
  rig.bowAuraHaloMesh.visible = bowLevel >= 6;
  if (bowLevel >= 6) {
    rig.bowAuraHaloMesh.rotation.z = -time * 2.6;
    const s = 1 + Math.cos(time * 4.8) * 0.08 + (bowLevel >= 7 ? 0.16 : 0);
    rig.bowAuraHaloMesh.scale.setScalar(s);
  }

  // Shoulder pauldrons & Gear/Item visual aura progression
  rig.pauldronsGroup.visible = gearAvgTier >= 2.5 || activeWings;
  const showAura = gearAvgTier >= 2.0 || activeBuffCount > 0 || activeWings;
  rig.gearAuraGroup.visible = showAura;
  if (showAura) {
    const auraColor =
      activeWings && wingsTier >= 2
        ? 0xff7b00
        : activeWings
          ? 0xf59e0b
          : gearAvgTier >= 4.5
            ? 0xe879f9
            : gearAvgTier >= 3.5
              ? 0x38bdf8
              : 0x34d399;
    rig.gearGroundRingMat.color.setHex(auraColor);
    rig.gearGroundRingMat.opacity =
      0.26 +
      Math.min(0.38, Math.max(0, gearAvgTier - 1) * 0.08 + (activeWings ? wingsTier * 0.09 : 0)) +
      Math.sin(time * 3.5) * 0.06;
    const ringScale = 1 + (activeWings ? wingsTier * 0.12 : 0) + Math.sin(time * 2.8) * 0.04;
    rig.gearGroundRingMesh.scale.setScalar(ringScale);

    rig.gearOrbitMotesGroup.visible = gearAvgTier >= 3.0 || activeBuffCount > 0 || activeWings;
    rig.gearOrbitMotesGroup.rotation.y = time * (1.8 + (activeWings ? wingsTier * 0.45 : 0));
    rig.gearOrbitMotesGroup.position.y = 0.88 + Math.sin(time * 2.4) * 0.08;
  }

  // Articulated Smooth 3D "Wings of Fire" (Tiers 1..3) with fluid wave-lag flapping
  rig.wingsGroup.visible = activeWings;
  if (activeWings) {
    const wingScale = wingsTier === 1 ? 1.06 : wingsTier === 2 ? 1.28 : 1.5;
    rig.wingsGroup.scale.setScalar(wingScale);
    const flapFreq = 2.6 + moveSpeedRatio * 3.0;
    const flapAmp = 0.2 + moveSpeedRatio * 0.18;
    const glideSweep = moveSpeedRatio * 0.18;
    const flap = Math.sin(time * flapFreq) * flapAmp;
    rig.leftWingPivot.rotation.y = 0.36 + glideSweep + flap;
    rig.rightWingPivot.rotation.y = -0.36 - glideSweep - flap;
    rig.leftWingPivot.rotation.z = Math.cos(time * flapFreq) * 0.085;
    rig.rightWingPivot.rotation.z = -Math.cos(time * flapFreq) * 0.085;
    rig.leftWingPivot.rotation.x = moveSpeedRatio * 0.12;
    rig.rightWingPivot.rotation.x = moveSpeedRatio * 0.12;

    // Fluid outer-pinion wave lag along individual sculpted feathers
    for (const pivot of [rig.leftWingPivot, rig.rightWingPivot]) {
      const feathersObj = pivot.getObjectByName('wingFeathers');
      if (feathersObj) {
        const sign = pivot === rig.leftWingPivot ? -1 : 1;
        for (const ch of feathersObj.children) {
          const baseZ = (ch.userData.baseRotZ as number | undefined) ?? ch.rotation.z;
          const phase = (ch.userData.phase as number | undefined) ?? 0;
          ch.rotation.z = baseZ + sign * Math.sin(time * flapFreq - phase) * (0.045 + moveSpeedRatio * 0.04);
        }
      }
    }

    rig.wingsHaloMesh.visible = wingsTier >= 2;
    rig.wingsHaloMesh.rotation.z = time * 2.2;
  }
}

/**
 * Equips the rare Jotun Frost-Reaver warlord enemy with sculpted curved frost-iron horns,
 * dark forged war-mask, spiked glacial pauldrons, and a glowing runic chest core.
 */
export function applyFrostBerserkerVisuals(
  rig: CharacterRig,
  palette: MaterialPalette,
): void {
  rig.group.scale.setScalar(1.24);
  rig.coatMat.color.setHex(0x1f2d46);
  rig.coatMat.roughness = 0.52;
  rig.coatMat.metalness = 0.25;
  rig.trimMat.color.setHex(0xcbe4f5);

  const warIronMat = new THREE.MeshStandardMaterial({
    color: 0x263142,
    roughness: 0.34,
    metalness: 0.78,
  });
  const frostShardMat = new THREE.MeshStandardMaterial({
    color: 0x7be0ff,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.16,
    metalness: 0.45,
  });
  const warGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff6b4a,
    emissive: 0xef4444,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  // Forged Iron Brow Helmet + Curved Viking/Jotun Horns
  const helmGroup = new THREE.Group();
  const helmDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.258, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    warIronMat,
  );
  helmDome.position.y = 0.19;
  helmDome.castShadow = true;

  const visorBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.238, 0.11, 16, 1, true, -Math.PI * 0.45, Math.PI * 0.9),
    warIronMat,
  );
  visorBand.position.set(0, 0.15, 0.01);

  const noseGuard = new THREE.Mesh(
    new THREE.ConeGeometry(0.036, 0.16, 4),
    warIronMat,
  );
  noseGuard.rotation.x = Math.PI;
  noseGuard.position.set(0, 0.11, 0.245);
  helmGroup.add(helmDome, visorBand, noseGuard);

  for (const side of [-1, 1] as const) {
    const hornCurve = [
      new THREE.Vector3(side * 0.21, 0.22, 0.02),
      new THREE.Vector3(side * 0.38, 0.34, 0.04),
      new THREE.Vector3(side * 0.44, 0.52, 0.11),
      new THREE.Vector3(side * 0.35, 0.65, 0.18),
    ];
    const horn = new THREE.Mesh(
      createTaperedCurveGeometry(hornCurve, 0.055, 0.016, 10, 14),
      palette.ivoryMat,
    );
    horn.castShadow = true;

    const frostTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.024, 0.11, 6),
      frostShardMat,
    );
    frostTip.position.set(side * 0.34, 0.68, 0.19);
    frostTip.rotation.z = side * 0.35;
    frostTip.rotation.x = 0.35;

    const visorEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 8, 6),
      warGlowMat,
    );
    visorEye.scale.set(1.3, 0.65, 0.8);
    visorEye.position.set(side * 0.078, 0.148, 0.225);

    helmGroup.add(horn, frostTip, visorEye);
  }
  rig.headGroup.add(helmGroup);

  // Heavy Spiked Shoulder Plates & Chest Frost-Heart Core
  const armorGroup = new THREE.Group();
  armorGroup.name = 'berserkerArmor';
  for (const side of [-1, 1] as const) {
    const plate = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      warIronMat,
    );
    plate.scale.set(1.22, 0.92, 1.24);
    plate.position.set(side * 0.43, 0.77, 0);
    plate.rotation.z = -side * 0.36;
    plate.castShadow = true;

    const iceSpike = new THREE.Mesh(
      new THREE.ConeGeometry(0.054, 0.26, 6),
      frostShardMat,
    );
    iceSpike.position.set(side * 0.54, 0.92, 0);
    iceSpike.rotation.z = -side * 0.52;
    armorGroup.add(plate, iceSpike);
  }

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.115, 0),
    frostShardMat,
  );
  core.name = 'berserkerCore';
  core.scale.set(0.95, 1.25, 0.65);
  core.position.set(0, 0.56, 0.39);

  const warMantleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.024, 8, 24),
    warGlowMat,
  );
  warMantleRing.rotation.x = Math.PI / 2;
  warMantleRing.position.set(0, 0.78, 0);
  armorGroup.add(core, warMantleRing);

  rig.torsoPivot.add(armorGroup);
}

/**
 * Equips the mythic-rare Valkyr Ice-Wraith caster enemy with a floating glacial crystal crown,
 * ethereal ice-crystal wing shards, an orbiting frost-rune halo, and a Frostbone Staff.
 */
export function applyIceWraithVisuals(
  rig: CharacterRig,
  palette: MaterialPalette,
): void {
  rig.group.scale.setScalar(1.08);
  rig.coatMat.color.setHex(0x164e63);
  rig.coatMat.roughness = 0.28;
  rig.coatMat.metalness = 0.32;
  rig.trimMat.color.setHex(0xa5f3fc);

  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.25,
    roughness: 0.12,
    metalness: 0.35,
  });
  const arcaneVioletMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.35,
    roughness: 0.16,
    metalness: 0.4,
  });

  // Glacial Crystal Crown & Glowing Cyan Eyes
  const crownGroup = new THREE.Group();
  const hoodRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.042, 10, 22),
    crystalMat,
  );
  hoodRim.rotation.x = Math.PI / 2;
  hoodRim.position.y = 0.24;
  crownGroup.add(hoodRim);

  for (let i = 0; i < 5; i++) {
    const a = -0.8 + i * 0.4;
    const h = i === 2 ? 0.24 : i === 1 || i === 3 ? 0.18 : 0.13;
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.036, h, 5),
      i === 2 ? arcaneVioletMat : crystalMat,
    );
    spire.position.set(Math.sin(a) * 0.22, 0.29 + h * 0.45, Math.cos(a) * 0.22);
    spire.rotation.x = Math.cos(a) * 0.22;
    spire.rotation.z = -Math.sin(a) * 0.22;
    crownGroup.add(spire);
  }
  for (const side of [-1, 1] as const) {
    const wraithEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 6),
      crystalMat,
    );
    wraithEye.scale.set(1.2, 0.85, 0.9);
    wraithEye.position.set(side * 0.076, 0.148, 0.224);
    crownGroup.add(wraithEye);
  }
  rig.headGroup.add(crownGroup);

  // Floating Twin Glacial Crystal Wing Shards on back
  const crystalWingsGroup = new THREE.Group();
  crystalWingsGroup.name = 'wraithWings';
  crystalWingsGroup.position.set(0, 0.66, -0.34);

  const shardShape = new THREE.Shape();
  shardShape.moveTo(0, 0);
  shardShape.lineTo(0.16, 0.26);
  shardShape.lineTo(0.04, 0.72);
  shardShape.lineTo(-0.08, 0.34);
  shardShape.closePath();
  const shardGeo = new THREE.ExtrudeGeometry(shardShape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  shardGeo.translate(0, 0, -0.013);

  for (const side of [-1, 1] as const) {
    for (let s = 0; s < 3; s++) {
      const shard = new THREE.Mesh(
        shardGeo,
        s === 1 ? arcaneVioletMat : crystalMat,
      );
      shard.scale.setScalar(1.0 - s * 0.18);
      shard.position.set(side * (0.24 + s * 0.18), 0.12 - s * 0.14, -s * 0.06);
      shard.rotation.z = -side * (0.48 + s * 0.26);
      shard.rotation.y = side * 0.22;
      shard.castShadow = true;
      crystalWingsGroup.add(shard);
    }
  }
  rig.torsoPivot.add(crystalWingsGroup);

  // Orbiting Glacial Rune Ring around torso
  const orbitalRing = new THREE.Group();
  orbitalRing.name = 'wraithOrbitalRing';
  orbitalRing.position.y = 0.56;
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.016, 8, 28),
    crystalMat,
  );
  ringMesh.rotation.x = Math.PI / 2;
  orbitalRing.add(ringMesh);
  for (let m = 0; m < 4; m++) {
    const a = (m / 4) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 0),
      m % 2 === 0 ? crystalMat : arcaneVioletMat,
    );
    node.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    orbitalRing.add(node);
  }
  rig.torsoPivot.add(orbitalRing);

  // Replace right-hand weapon with Frostbone Crystal Lance Staff
  rig.axeGroup.visible = false;
  rig.bowGroup.visible = false;
  rig.quiverGroup.visible = false;

  const staffGroup = new THREE.Group();
  staffGroup.name = 'wraithStaff';
  staffGroup.position.set(0, -0.265, 0.06);
  staffGroup.rotation.x = Math.PI / 2.25;

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.032, 1.48, 10),
    palette.darkWoodMat,
  );
  shaft.position.y = 0.42;
  shaft.castShadow = true;

  const staffRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.016, 8, 18),
    arcaneVioletMat,
  );
  staffRing.position.y = 1.2;

  const staffGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.085, 0),
    crystalMat,
  );
  staffGem.scale.set(0.85, 1.45, 0.85);
  staffGem.position.y = 1.22;

  staffGroup.add(shaft, staffRing, staffGem);
  rig.rightElbow.add(staffGroup);
}

export function createTreeModel(
  kind: TreeKind,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  const isElder = kind === 'elder';
  const scale = isElder ? 1.35 : kind === 'spruce' ? 1.15 : 1.0;
  const seed = isElder ? 7 : kind === 'spruce' ? 3 : 5;

  addContactShadow(group, palette.contactShadowMat, 1.62 * scale);

  const trunkMat = isElder ? palette.birchBarkMat : palette.barkMat;

  // Exposed gnarled root knees & buttress flares gripping the snowpack
  for (let r = 0; r < 6; r++) {
    const a = (r / 6) * Math.PI * 2 + seed * 0.25;
    const rootCurve = [
      new THREE.Vector3(Math.cos(a) * 0.18 * scale, 0.45 * scale, Math.sin(a) * 0.18 * scale),
      new THREE.Vector3(Math.cos(a) * 0.36 * scale, 0.18 * scale, Math.sin(a) * 0.36 * scale),
      new THREE.Vector3(Math.cos(a) * 0.58 * scale, 0.02 * scale, Math.sin(a) * 0.58 * scale),
    ];
    const root = new THREE.Mesh(
      createTaperedCurveGeometry(rootCurve, 0.145 * scale, 0.055 * scale, 8, 8),
      trunkMat,
    );
    root.castShadow = true;
    root.receiveShadow = true;
    group.add(root);
  }

  // Organic slightly curved lower trunk base
  const lowerTrunkCurve = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04 * scale, 0.65 * scale, -0.02 * scale),
    new THREE.Vector3(0.02 * scale, 1.32 * scale, 0.03 * scale),
  ];
  const lowerTrunk = new THREE.Mesh(
    createTaperedCurveGeometry(lowerTrunkCurve, 0.41 * scale, 0.25 * scale, 10, 12),
    trunkMat,
  );
  lowerTrunk.castShadow = true;
  lowerTrunk.receiveShadow = true;
  group.add(lowerTrunk);

  // Wind-reactive upper trunk + foliage crown pivot
  const canopyPivot = new THREE.Group();
  canopyPivot.position.set(0.02 * scale, 1.18 * scale, 0.03 * scale);
  group.add(canopyPivot);
  registerWindTarget(group, {
    pivot: canopyPivot,
    stiffness: isElder ? 1.25 : 0.92,
    phaseOffset: seed * 0.9,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });

  const upperTrunkCurve = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.04 * scale, 1.25 * scale, 0.02 * scale),
    new THREE.Vector3(0.02 * scale, 2.75 * scale, -0.02 * scale),
    new THREE.Vector3(0, 4.05 * scale, 0),
  ];
  const upperTrunk = new THREE.Mesh(
    createTaperedCurveGeometry(upperTrunkCurve, 0.25 * scale, 0.045 * scale, 12, 10),
    trunkMat,
  );
  upperTrunk.castShadow = true;
  upperTrunk.receiveShadow = true;
  canopyPivot.add(upperTrunk);

  // Lower deadwood weathered branch snags for silhouette realism
  for (let b = 0; b < 4; b++) {
    const a = b * 1.65 + 0.45;
    const len = (0.45 + (b % 2) * 0.2) * scale;
    const stub = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, (0.2 + b * 0.22) * scale, 0),
          new THREE.Vector3(Math.cos(a) * len * 0.6, (0.28 + b * 0.22) * scale, Math.sin(a) * len * 0.6),
          new THREE.Vector3(Math.cos(a) * len, (0.22 + b * 0.22) * scale, Math.sin(a) * len),
        ],
        0.055 * scale,
        0.016 * scale,
        6,
        6,
      ),
      trunkMat,
    );
    stub.castShadow = true;
    canopyPivot.add(stub);
  }

  const needleMat =
    kind === 'elder'
      ? palette.elderNeedleMat
      : kind === 'spruce'
        ? palette.spruceNeedleMat
        : palette.pineNeedleMat;

  const tiers = kind === 'spruce' ? 5 : 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const radius = (1.78 - t * 1.02) * scale;
    const height = (1.58 - t * 0.26) * scale;
    const relY = (0.42 + i * 0.88) * scale;

    const tierPivot = new THREE.Group();
    tierPivot.position.y = relY;
    canopyPivot.add(tierPivot);

    registerWindTarget(group, {
      pivot: tierPivot,
      stiffness: Math.max(0.45, 1.55 - i * 0.24),
      phaseOffset: seed * 1.1 + i * 0.75,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });

    // Visible timber bough arms supporting each foliage crown from underneath
    if (i < tiers - 1) {
      const armCount = 4;
      for (let armIdx = 0; armIdx < armCount; armIdx++) {
        const a = (armIdx / armCount) * Math.PI * 2 + i * 0.72;
        const reach = radius * 0.64;
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022 * scale, 0.048 * scale, reach, 6),
          trunkMat,
        );
        arm.position.set(Math.cos(a) * reach * 0.45, 0.08 * scale, Math.sin(a) * reach * 0.45);
        arm.rotation.z = -Math.cos(a) * 1.25;
        arm.rotation.x = Math.sin(a) * 1.25;
        tierPivot.add(arm);
      }
    }

    const boughGeo = createSculptedTreeTierGeometry(radius, height, seed + i * 3);
    const bough = new THREE.Mesh(boughGeo, needleMat);
    bough.position.y = height * 0.46;
    bough.rotation.y = i * 0.85;
    bough.castShadow = true;
    bough.receiveShadow = true;

    const snowCapGeo = createSculptedTreeTierGeometry(radius * 0.83, height * 0.56, seed + i * 5);
    const snowCap = new THREE.Mesh(snowCapGeo, palette.snowMat);
    snowCap.position.y = height * 0.72;
    snowCap.rotation.y = i * 0.85 + 0.14;
    snowCap.receiveShadow = true;

    tierPivot.add(bough, snowCap);

    // Hanging pinecones on lower boughs of pine & spruce
    if (!isElder && i <= 1) {
      for (let pc = 0; pc < 2; pc++) {
        const pa = i * 1.9 + pc * Math.PI;
        const cone = new THREE.Mesh(
          new THREE.SphereGeometry(0.055 * scale, 7, 6),
          palette.darkWoodMat,
        );
        cone.scale.set(0.75, 1.5, 0.75);
        cone.position.set(Math.cos(pa) * radius * 0.72, 0.02 * scale, Math.sin(pa) * radius * 0.72);
        tierPivot.add(cone);
      }
    }
  }

  // Distinct conical top spire crown
  const spireCrown = new THREE.Mesh(
    createSculptedTreeTierGeometry(0.42 * scale, 0.92 * scale, seed + 19),
    needleMat,
  );
  spireCrown.position.y = (0.42 + tiers * 0.88 + 0.25) * scale;
  spireCrown.castShadow = true;
  canopyPivot.add(spireCrown);

  if (isElder) {
    for (let r = 0; r < 3; r++) {
      const a = r * 2.1 + 0.4;
      const resin = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 1),
        palette.emberMat,
      );
      resin.scale.set(0.75, 1.35, 0.75);
      resin.position.set(Math.cos(a) * 0.3 * scale, (0.95 + r * 0.42) * scale, Math.sin(a) * 0.3 * scale);
      group.add(resin);
    }
    for (let c = 0; c < 5; c++) {
      const a = (c / 5) * Math.PI * 2 + 0.4;
      const icicle = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.4, 6),
        palette.iceMat,
      );
      icicle.rotation.x = Math.PI;
      icicle.position.set(Math.cos(a) * 1.38 * scale, 0.22 * scale, Math.sin(a) * 1.38 * scale);
      canopyPivot.add(icicle);
    }
  }

  return group;
}

export interface SightBeaconVisual {
  group: THREE.Group;
  ring: THREE.Mesh;
  diamond: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  diamondMat: THREE.MeshBasicMaterial;
  baseY: number;
}

export interface AnimalModel {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  spinePivot: THREE.Group;
  legs: THREE.Group[];
  lowerLegs: THREE.Group[];
  headGroup?: THREE.Group;
  earPivots: THREE.Group[];
  tailPivot?: THREE.Group;
  trunkPivot?: THREE.Group;
  alertMarker?: THREE.Mesh;
  telegraphRing?: THREE.Mesh;
  attackSlashMesh?: THREE.Mesh;
  sightBeacon?: SightBeaconVisual;
}

function attachAlertMarker(group: THREE.Group, heightY: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color: 0xf6c344 });
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), mat);
  marker.position.set(0, heightY, 0);
  marker.visible = false;
  group.add(marker);
  return marker;
}

function attachTelegraphRing(group: THREE.Group, innerR: number, outerR: number): THREE.Mesh {
  const ringGeo = new THREE.RingGeometry(innerR, outerR, 40);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff5a36,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(ringGeo, ringMat);
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.y = 0.05;
  telegraphRing.visible = false;

  // Forward directional lunge chevron on ground telegraph (+Y in rotated ring space -> +Z forward)
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, outerR + 0.72);
  arrowShape.lineTo(0.28, outerR + 0.16);
  arrowShape.lineTo(0.1, outerR + 0.22);
  arrowShape.lineTo(0.1, outerR - 0.02);
  arrowShape.lineTo(-0.1, outerR - 0.02);
  arrowShape.lineTo(-0.1, outerR + 0.22);
  arrowShape.lineTo(-0.28, outerR + 0.16);
  arrowShape.closePath();
  const arrowMesh = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), ringMat);
  arrowMesh.position.z = 0.005;
  telegraphRing.add(arrowMesh);

  group.add(telegraphRing);
  return telegraphRing;
}

function attachRarityHalo(
  group: THREE.Group,
  radius: number,
  colorHex: number,
): void {
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.82, radius, 40),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.035;
  group.add(halo);
}

function attachSightBeacon(
  group: THREE.Group,
  kind: AnimalKind,
): SightBeaconVisual {
  const spec = SPECIES_SPECS[kind];
  const colorHex = getRarityColorHex(spec.rarity);
  const baseY =
    kind === 'mammoth'
      ? 3.35
      : kind === 'frost_stag'
        ? 3.25
        : kind === 'stag'
          ? 2.85
          : kind === 'polar_bear' || kind === 'aurora_fenrir'
            ? 2.25
            : kind === 'musk_ox'
              ? 2.1
              : kind === 'sabertooth'
                ? 1.9
                : kind === 'wolf'
                  ? 1.72
                  : kind === 'lynx'
                    ? 1.56
                    : kind === 'fox'
                      ? 1.48
                      : 1.28;
  const ringRadius =
    kind === 'mammoth'
      ? 2.0
      : kind === 'polar_bear' || kind === 'musk_ox' || kind === 'aurora_fenrir'
        ? 1.5
        : kind === 'stag' || kind === 'frost_stag' || kind === 'sabertooth'
          ? 1.25
          : 0.92;

  const beaconGroup = new THREE.Group();
  beaconGroup.visible = false;

  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(ringRadius * 0.78, ringRadius, 32),
    ringMat,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  const beamMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.22, baseY, 10, 1, true),
    beamMat,
  );
  beam.position.y = baseY * 0.5;

  const diamondMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.95,
  });
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), diamondMat);
  diamond.position.y = baseY;

  beaconGroup.add(ring, beam, diamond);
  group.add(beaconGroup);

  return {
    group: beaconGroup,
    ring,
    diamond,
    ringMat,
    diamondMat,
    baseY,
  };
}

let sharedTrackPrintGeo: THREE.CircleGeometry | null = null;
let sharedTrackRingGeo: THREE.RingGeometry | null = null;

export interface AnimalTrackVisual {
  group: THREE.Group;
  printMat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
}

export function createAnimalTrackMesh(
  kind: AnimalKind,
  rarity: AnimalRarity,
): AnimalTrackVisual {
  if (!sharedTrackPrintGeo) {
    sharedTrackPrintGeo = new THREE.CircleGeometry(0.11, 10);
    sharedTrackPrintGeo.rotateX(-Math.PI / 2);
  }
  if (!sharedTrackRingGeo) {
    sharedTrackRingGeo = new THREE.RingGeometry(0.32, 0.42, 20);
    sharedTrackRingGeo.rotateX(-Math.PI / 2);
  }

  const sizeScale =
    kind === 'mammoth'
      ? 1.75
      : kind === 'polar_bear' || kind === 'musk_ox'
        ? 1.4
        : kind === 'stag' || kind === 'frost_stag' || kind === 'sabertooth' || kind === 'aurora_fenrir'
          ? 1.2
          : kind === 'hare'
            ? 0.78
            : 1.0;

  const group = new THREE.Group();

  const printMat = new THREE.MeshBasicMaterial({
    color: 0x3b5878,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: getRarityColorHex(rarity),
    transparent: true,
    opacity: rarity === 'common' ? 0.25 : 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const leftPrint = new THREE.Mesh(sharedTrackPrintGeo, printMat);
  leftPrint.position.set(-0.14 * sizeScale, 0.01, 0.12 * sizeScale);
  leftPrint.scale.set(0.95 * sizeScale, 1, 1.35 * sizeScale);

  const rightPrint = new THREE.Mesh(sharedTrackPrintGeo, printMat);
  rightPrint.position.set(0.14 * sizeScale, 0.01, -0.1 * sizeScale);
  rightPrint.scale.set(0.95 * sizeScale, 1, 1.35 * sizeScale);

  const clueRing = new THREE.Mesh(sharedTrackRingGeo, glowMat);
  clueRing.position.y = 0.015;
  clueRing.scale.setScalar(sizeScale);

  group.add(leftPrint, rightPrint, clueRing);
  return { group, printMat, glowMat };
}

interface TorsoSlice {
  z: number;
  yOffset: number;
  rx: number;
  ry: number;
}

/**
 * Generates an anatomical quadruped torso with elliptical ribcage, arched spine,
 * lumbar tuck, and tapered rump/shoulders instead of a cylinder or sphere.
 */
function createSculptedTorsoGeometry(
  slices: TorsoSlice[],
  radialSegs = 18,
): THREE.BufferGeometry {
  const ringCount = slices.length;
  const cols = radialSegs + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < ringCount; i++) {
    const s = slices[i];
    const v = i / Math.max(1, ringCount - 1);
    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * s.rx;
      // Slightly broaden ribcage chest below spine and taper ventral tuck
      const verticalShape = Math.sin(theta) < 0 ? 0.92 : 1.04;
      const y = s.yOffset + Math.sin(theta) * s.ry * verticalShape;
      positions.push(x, y, s.z);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < ringCount - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + (j + 1);
      const d = i * cols + (j + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a tapered curved TubeGeometry (used for tusks, trunks, antlers, and curved tails).
 */
function createTaperedCurveGeometry(
  points: THREE.Vector3[],
  startRadius: number,
  endRadius: number,
  tubularSegs = 16,
  radialSegs = 10,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const cols = radialSegs + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const pt = curve.getPointAt(t);
    const r = THREE.MathUtils.lerp(startRadius, endRadius, t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const angle = u * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const vx = pt.x + r * (cos * N.x + sin * B.x);
      const vy = pt.y + r * (cos * N.y + sin * B.y);
      const vz = pt.z + r * (cos * N.z + sin * B.z);
      positions.push(vx, vy, vz);
      uvs.push(u, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + (j + 1);
      const d = i * cols + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

interface LegOptions {
  x: number;
  y: number;
  z: number;
  upperRadius: number;
  midRadius: number;
  lowerRadius: number;
  upperLen: number;
  lowerLen: number;
  upperAngleX: number;
  lowerAngleX: number;
  upperMat: THREE.Material;
  lowerMat: THREE.Material;
  footMat: THREE.Material;
  footType: 'paw' | 'hoof' | 'pillar' | 'clawed_paw';
}

function createArticulatedLeg(opts: LegOptions): {
  pivot: THREE.Group;
  lowerPivot: THREE.Group;
} {
  const pivot = new THREE.Group();
  pivot.position.set(opts.x, opts.y, opts.z);

  const shoulderBulge = new THREE.Mesh(
    new THREE.SphereGeometry(opts.upperRadius * 1.22, 14, 12),
    opts.upperMat,
  );
  shoulderBulge.scale.set(0.96, 1.24, 1.22);
  pivot.add(shoulderBulge);

  const upperGroup = new THREE.Group();
  upperGroup.rotation.x = opts.upperAngleX;
  pivot.add(upperGroup);

  const upperMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(opts.upperRadius * 1.06, opts.midRadius, opts.upperLen, 14),
    opts.upperMat,
  );
  upperMesh.position.y = -opts.upperLen * 0.5;
  upperMesh.castShadow = true;
  upperGroup.add(upperMesh);

  // Sculpted outer deltoid / thigh muscle ridge
  const muscleCrest = new THREE.Mesh(
    new THREE.CapsuleGeometry(opts.upperRadius * 0.52, opts.upperLen * 0.48, 4, 8),
    opts.upperMat,
  );
  muscleCrest.position.set(
    Math.sign(opts.x) * opts.upperRadius * 0.42,
    -opts.upperLen * 0.42,
    opts.upperRadius * 0.18,
  );
  upperGroup.add(muscleCrest);

  // Smooth joint muscle sphere at knee/hock
  const jointMesh = new THREE.Mesh(
    new THREE.SphereGeometry(opts.midRadius * 1.12, 10, 8),
    opts.upperMat,
  );
  jointMesh.position.y = -opts.upperLen;
  upperGroup.add(jointMesh);

  const lowerPivot = new THREE.Group();
  lowerPivot.position.y = -opts.upperLen;
  lowerPivot.rotation.x = opts.lowerAngleX;
  lowerPivot.userData.baseRotX = opts.lowerAngleX;
  upperGroup.add(lowerPivot);

  const lowerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(opts.midRadius * 0.94, opts.lowerRadius, opts.lowerLen, 12),
    opts.lowerMat,
  );
  lowerMesh.position.y = -opts.lowerLen * 0.5;
  lowerMesh.castShadow = true;
  lowerPivot.add(lowerMesh);

  // Feathered winter fetlock fur tuft above foot/hoof
  const fetlockTuft = new THREE.Mesh(
    new THREE.ConeGeometry(opts.lowerRadius * 1.18, opts.lowerLen * 0.36, 8),
    opts.upperMat,
  );
  fetlockTuft.position.set(0, -opts.lowerLen * 0.78, -opts.lowerRadius * 0.28);
  fetlockTuft.rotation.x = -0.24;
  lowerPivot.add(fetlockTuft);

  if (opts.footType === 'hoof') {
    // Split cloven cervid hoof
    for (const hx of [-opts.lowerRadius * 0.52, opts.lowerRadius * 0.52]) {
      const halfHoof = new THREE.Mesh(
        new THREE.CylinderGeometry(opts.lowerRadius * 0.65, opts.lowerRadius * 0.82, 0.085, 8),
        opts.footMat,
      );
      halfHoof.position.set(hx, -opts.lowerLen - 0.032, 0.02);
      halfHoof.castShadow = true;
      lowerPivot.add(halfHoof);
    }
  } else if (opts.footType === 'pillar') {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(opts.lowerRadius * 1.12, opts.lowerRadius * 1.24, 0.14, 14),
      opts.footMat,
    );
    pad.position.set(0, -opts.lowerLen - 0.04, 0.02);
    pad.castShadow = true;
    lowerPivot.add(pad);
    for (const tx of [-0.085, 0, 0.085]) {
      const nail = new THREE.Mesh(
        new THREE.SphereGeometry(opts.lowerRadius * 0.26, 8, 6),
        opts.upperMat,
      );
      nail.position.set(tx, -opts.lowerLen - 0.075, opts.lowerRadius * 1.12);
      lowerPivot.add(nail);
    }
  } else {
    const paw = new THREE.Mesh(
      new THREE.SphereGeometry(opts.lowerRadius * 1.38, 12, 8),
      opts.footMat,
    );
    paw.scale.set(1.1, 0.62, 1.5);
    paw.position.set(0, -opts.lowerLen - opts.lowerRadius * 0.24, opts.lowerRadius * 0.72);
    paw.castShadow = true;
    lowerPivot.add(paw);

    if (opts.footType === 'clawed_paw') {
      for (const cx of [-0.045, 0, 0.045]) {
        const claw = new THREE.Mesh(
          new THREE.ConeGeometry(0.015, 0.065, 6),
          opts.upperMat,
        );
        claw.rotation.x = Math.PI / 2.15;
        claw.position.set(
          cx,
          -opts.lowerLen - opts.lowerRadius * 0.36,
          opts.lowerRadius * 2.2,
        );
        lowerPivot.add(claw);
      }
    }
  }

  return { pivot, lowerPivot };
}

function attachRealisticAnimalEye(
  headGroup: THREE.Group,
  x: number,
  y: number,
  z: number,
  radius: number,
  irisMat: THREE.Material,
  palette: MaterialPalette,
): void {
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.24, 10, 8),
    palette.foxDarkMat,
  );
  rim.scale.set(0.95, 0.92, 0.68);
  rim.position.set(x * 0.96, y, z * 0.97);

  const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), irisMat);
  eye.position.set(x, y, z);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.34, 6, 6),
    palette.eyeCatchlightMat,
  );
  glint.position.set(x + Math.sign(x) * radius * 0.25, y + radius * 0.3, z + radius * 0.75);

  headGroup.add(rim, eye, glint);
}

function attachWhiskerMuzzlePads(
  headGroup: THREE.Group,
  y: number,
  z: number,
  spread: number,
  radius: number,
  mat: THREE.Material,
): void {
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
    pad.scale.set(1.1, 0.85, 1.15);
    pad.position.set(side * spread, y, z);
    headGroup.add(pad);
  }
}

export function createAnimalModel(
  kind: AnimalKind,
  palette: MaterialPalette,
): AnimalModel {
  const model = buildAnimalModel(kind, palette);
  model.sightBeacon = attachSightBeacon(model.group, kind);

  // Glowing claw/fang slash arc VFX shown during predator lunge attacks
  if (SPECIES_SPECS[kind].predator) {
    const slashColor =
      kind === 'aurora_fenrir'
        ? 0xe879f9
        : kind === 'polar_bear'
          ? 0x7be0ff
          : kind === 'mammoth'
            ? 0xf6c344
            : 0xff5a36;
    const slashMat = new THREE.MeshBasicMaterial({
      color: slashColor,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slashRadius =
      kind === 'mammoth' ? 1.15 : kind === 'polar_bear' || kind === 'aurora_fenrir' ? 0.85 : 0.65;
    const slashGeo = new THREE.RingGeometry(
      slashRadius * 0.68,
      slashRadius * 1.18,
      24,
      1,
      -Math.PI / 2 - 0.95,
      1.9,
    );
    const attackSlashMesh = new THREE.Mesh(slashGeo, slashMat);
    attackSlashMesh.rotation.x = -Math.PI / 2.2;
    attackSlashMesh.position.set(
      0,
      kind === 'mammoth' ? 1.18 : kind === 'polar_bear' || kind === 'aurora_fenrir' ? 0.92 : 0.72,
      kind === 'mammoth' ? 1.35 : 0.95,
    );
    attackSlashMesh.visible = false;
    attackSlashMesh.renderOrder = 6;
    model.group.add(attackSlashMesh);
    model.attackSlashMesh = attackSlashMesh;
  }

  // Add subtle cold-air frost breath vapor plume to the animal's snout/head
  if (model.headGroup && kind !== 'hare') {
    const breathMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const breathPuff = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), breathMat);
    breathPuff.scale.set(1.1, 0.75, 1.65);
    breathPuff.position.set(0, -0.05, 0.38);
    breathPuff.name = 'animalBreathPuff';
    breathPuff.userData.animalBreathPuff = true;
    model.headGroup.add(breathPuff);
  }
  return model;
}

function buildAnimalModel(
  kind: AnimalKind,
  palette: MaterialPalette,
): AnimalModel {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const spinePivot = new THREE.Group();
  bodyGroup.add(spinePivot);
  group.add(bodyGroup);
  const legs: THREE.Group[] = [];
  const lowerLegs: THREE.Group[] = [];
  const earPivots: THREE.Group[] = [];

  if (kind === 'hare') {
    addContactShadow(group, palette.contactShadowMat, 0.54);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.35, yOffset: 0.27, rx: 0.02, ry: 0.02 },
      { z: -0.24, yOffset: 0.3, rx: 0.195, ry: 0.21 },
      { z: -0.04, yOffset: 0.31, rx: 0.22, ry: 0.225 },
      { z: 0.17, yOffset: 0.28, rx: 0.175, ry: 0.185 },
      { z: 0.29, yOffset: 0.27, rx: 0.02, ry: 0.02 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.hareMat);
    torso.castShadow = true;

    const chestRuff = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 10),
      palette.furTrimMat,
    );
    chestRuff.scale.set(0.95, 1.1, 0.9);
    chestRuff.position.set(0, 0.28, 0.22);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.44, 0.22);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 18, 16),
      palette.hareMat,
    );
    cranium.scale.set(0.92, 0.9, 1.16);
    cranium.castShadow = true;

    attachWhiskerMuzzlePads(headGroup, -0.032, 0.14, 0.042, 0.052, palette.furTrimMat);

    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 10),
      palette.hareMat,
    );
    muzzle.scale.set(0.95, 0.78, 1.25);
    muzzle.position.set(0, -0.02, 0.135);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 8, 8),
      palette.innerEarMat,
    );
    nose.position.set(0, -0.012, 0.232);

    headGroup.add(cranium, muzzle, nose);

    for (const side of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.062, 0.11, -0.02);
      earPivot.rotation.x = -0.26;
      earPivot.rotation.z = -side * 0.16;
      earPivot.userData.baseRotX = earPivot.rotation.x;

      const earOuter = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.038, 0.23, 6, 10),
        palette.hareMat,
      );
      earOuter.scale.set(0.85, 1.0, 0.55);
      earOuter.position.y = 0.13;
      earOuter.castShadow = true;

      const earInner = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.18, 4, 8),
        palette.innerEarMat,
      );
      earInner.scale.set(0.8, 1.0, 0.35);
      earInner.position.set(0, 0.13, 0.016);

      const earTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        palette.foxDarkMat,
      );
      earTip.position.set(0, 0.27, 0);

      earPivot.add(earOuter, earInner, earTip);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.114,
        0.036,
        0.092,
        0.026,
        palette.eyeGlintMat,
        palette,
      );
    }

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.29, -0.34);
    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 12, 10),
      palette.furTrimMat,
    );
    tail.scale.set(0.95, 1.05, 1.1);
    tailPivot.add(tail);

    spinePivot.add(torso, chestRuff, headGroup, tailPivot);

    for (const side of [-1, 1]) {
      const frontLeg = createArticulatedLeg({
        x: side * 0.11,
        y: 0.22,
        z: 0.16,
        upperRadius: 0.044,
        midRadius: 0.034,
        lowerRadius: 0.028,
        upperLen: 0.11,
        lowerLen: 0.09,
        upperAngleX: 0.12,
        lowerAngleX: -0.18,
        upperMat: palette.hareMat,
        lowerMat: palette.hareMat,
        footMat: palette.furTrimMat,
        footType: 'paw',
      });
      bodyGroup.add(frontLeg.pivot);
      legs.push(frontLeg.pivot);
      lowerLegs.push(frontLeg.lowerPivot);
    }

    for (const side of [-1, 1]) {
      const hindLeg = createArticulatedLeg({
        x: side * 0.145,
        y: 0.26,
        z: -0.18,
        upperRadius: 0.08,
        midRadius: 0.046,
        lowerRadius: 0.034,
        upperLen: 0.16,
        lowerLen: 0.16,
        upperAngleX: -0.68,
        lowerAngleX: 1.08,
        upperMat: palette.hareMat,
        lowerMat: palette.furTrimMat,
        footMat: palette.furTrimMat,
        footType: 'paw',
      });
      bodyGroup.add(hindLeg.pivot);
      legs.push(hindLeg.pivot);
      lowerLegs.push(hindLeg.lowerPivot);
    }

    const alertMarker = attachAlertMarker(group, 1.12);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
    };
  }

  if (kind === 'fox') {
    addContactShadow(group, palette.contactShadowMat, 0.72);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.46, yOffset: 0.45, rx: 0.02, ry: 0.02 },
      { z: -0.34, yOffset: 0.46, rx: 0.165, ry: 0.18 },
      { z: -0.06, yOffset: 0.44, rx: 0.16, ry: 0.17 },
      { z: 0.22, yOffset: 0.48, rx: 0.205, ry: 0.23 },
      { z: 0.4, yOffset: 0.52, rx: 0.15, ry: 0.17 },
      { z: 0.48, yOffset: 0.54, rx: 0.02, ry: 0.02 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.foxMat);
    torso.castShadow = true;

    const chestBib = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 12),
      palette.furTrimMat,
    );
    chestBib.scale.set(0.88, 1.18, 0.85);
    chestBib.position.set(0, 0.47, 0.34);

    const neck = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0.5, 0.32),
          new THREE.Vector3(0, 0.58, 0.42),
          new THREE.Vector3(0, 0.65, 0.48),
        ],
        0.155,
        0.112,
        8,
        12,
      ),
      palette.foxMat,
    );
    neck.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0.48);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 16, 14),
      palette.foxMat,
    );
    cranium.scale.set(1.06, 0.92, 1.12);
    cranium.castShadow = true;

    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 10, 8),
        palette.furTrimMat,
      );
      cheek.scale.set(1.05, 0.72, 1.1);
      cheek.position.set(side * 0.092, -0.04, 0.045);
      headGroup.add(cheek);
    }

    const muzzleGeo = createTaperedCurveGeometry(
      [
        new THREE.Vector3(0, -0.02, 0.08),
        new THREE.Vector3(0, -0.035, 0.2),
        new THREE.Vector3(0, -0.04, 0.32),
      ],
      0.088,
      0.032,
      8,
      10,
    );
    const muzzle = new THREE.Mesh(muzzleGeo, palette.foxMat);
    attachWhiskerMuzzlePads(headGroup, -0.048, 0.25, 0.032, 0.034, palette.furTrimMat);

    const jaw = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.035, 0.14, 4, 8),
      palette.furTrimMat,
    );
    jaw.rotation.x = Math.PI / 2;
    jaw.position.set(0, -0.068, 0.2);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 8),
      palette.noseWetMat,
    );
    nose.position.set(0, -0.036, 0.335);

    for (const side of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.085, 0.11, -0.04);
      earPivot.rotation.z = -side * 0.18;
      earPivot.rotation.x = 0.14;
      earPivot.userData.baseRotX = earPivot.rotation.x;

      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.21, 10),
        palette.foxMat,
      );
      ear.scale.set(1.0, 1.0, 0.6);
      ear.position.y = 0.07;

      const earInner = new THREE.Mesh(
        new THREE.ConeGeometry(0.042, 0.14, 8),
        palette.furTrimMat,
      );
      earInner.scale.set(1, 1, 0.35);
      earInner.position.set(0, 0.06, 0.022);

      const earTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.036, 0.08, 8),
        palette.foxDarkMat,
      );
      earTip.scale.set(1, 1, 0.6);
      earTip.position.y = 0.145;

      earPivot.add(ear, earInner, earTip);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.086,
        0.032,
        0.116,
        0.025,
        palette.eyeGlintMat,
        palette,
      );
    }
    headGroup.add(cranium, muzzle, jaw, nose);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.48, -0.44);
    const tailBody = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.05, -0.22),
          new THREE.Vector3(0, 0.16, -0.46),
          new THREE.Vector3(0, 0.22, -0.66),
        ],
        0.078,
        0.138,
        14,
        12,
      ),
      palette.foxMat,
    );
    tailBody.castShadow = true;
    const tailTip = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0.21, -0.62),
          new THREE.Vector3(0, 0.24, -0.76),
          new THREE.Vector3(0, 0.23, -0.88),
        ],
        0.128,
        0.02,
        8,
        10,
      ),
      palette.furTrimMat,
    );
    tailPivot.add(tailBody, tailTip);
    registerWindTarget(group, {
      pivot: tailPivot,
      stiffness: 0.72,
      phaseOffset: 1.8,
      baseRotX: 0,
      baseRotZ: 0,
    });

    spinePivot.add(torso, chestBib, neck, headGroup, tailPivot);

    const foxLegs: [number, number, boolean][] = [
      [-0.125, 0.27, true],
      [0.125, 0.27, true],
      [-0.125, -0.29, false],
      [0.125, -0.29, false],
    ];
    for (const [lx, lz, isFront] of foxLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.42,
        z: lz,
        upperRadius: isFront ? 0.058 : 0.072,
        midRadius: 0.04,
        lowerRadius: 0.028,
        upperLen: 0.21,
        lowerLen: 0.2,
        upperAngleX: isFront ? 0.08 : -0.18,
        lowerAngleX: isFront ? -0.1 : 0.22,
        upperMat: palette.foxMat,
        lowerMat: palette.foxDarkMat,
        footMat: palette.foxDarkMat,
        footType: 'paw',
      });
      bodyGroup.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const alertMarker = attachAlertMarker(group, 1.32);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
    };
  }

  if (kind === 'stag' || kind === 'frost_stag') {
    const isFrostStag = kind === 'frost_stag';
    const scale = isFrostStag ? 1.18 : 1.0;
    const coatMat = isFrostStag ? palette.frostStagMat : palette.stagMat;
    const maneMat = isFrostStag ? palette.frostStagMat : palette.furTrimMat;
    const antlerMaterial = isFrostStag ? palette.frostSteelMat : palette.antlerMat;
    const hoofMat = isFrostStag ? palette.frostSteelMat : palette.foxDarkMat;

    addContactShadow(group, palette.contactShadowMat, isFrostStag ? 1.24 : 1.02);
    if (isFrostStag) {
      attachRarityHalo(group, 1.32, 0x7be0ff);
    }

    const stagScaleGroup = new THREE.Group();
    stagScaleGroup.scale.setScalar(scale);
    spinePivot.add(stagScaleGroup);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.68, yOffset: 0.96, rx: 0.03, ry: 0.03 },
      { z: -0.52, yOffset: 0.98, rx: 0.28, ry: 0.31 },
      { z: -0.15, yOffset: 0.93, rx: 0.29, ry: 0.31 },
      { z: 0.25, yOffset: 0.98, rx: 0.36, ry: 0.41 },
      { z: 0.52, yOffset: 1.04, rx: 0.29, ry: 0.34 },
      { z: 0.64, yOffset: 1.08, rx: 0.03, ry: 0.03 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.castShadow = true;

    const chestMane = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      maneMat,
    );
    chestMane.scale.set(0.88, 1.22, 0.92);
    chestMane.position.set(0, 1.0, 0.48);

    const rumpPatch = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 12, 10),
      palette.furTrimMat,
    );
    rumpPatch.scale.set(1.05, 1.1, 0.65);
    rumpPatch.position.set(0, 0.96, -0.62);

    const neck = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 1.04, 0.44),
          new THREE.Vector3(0, 1.28, 0.58),
          new THREE.Vector3(0, 1.54, 0.68),
        ],
        0.22,
        0.135,
        10,
        14,
      ),
      coatMat,
    );
    neck.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.6, 0.72);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 14, 12),
      coatMat,
    );
    cranium.scale.set(0.95, 0.92, 1.2);
    cranium.castShadow = true;

    const snout = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, -0.01, 0.06),
          new THREE.Vector3(0, -0.05, 0.22),
          new THREE.Vector3(0, -0.08, 0.34),
        ],
        0.095,
        0.052,
        8,
        10,
      ),
      coatMat,
    );

    const nosePad = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 8),
      palette.noseWetMat,
    );
    nosePad.position.set(0, -0.082, 0.36);

    headGroup.add(cranium, snout, nosePad);

    for (const side of [-1, 1]) {
      const mainCurve = [
        new THREE.Vector3(side * 0.07, 0.1, -0.02),
        new THREE.Vector3(side * 0.22, 0.36, -0.06),
        new THREE.Vector3(side * 0.38, 0.64, 0.02),
        new THREE.Vector3(side * 0.34, 0.9, 0.14),
      ];
      const mainBeam = new THREE.Mesh(
        createTaperedCurveGeometry(mainCurve, 0.032, 0.012, 14, 8),
        antlerMaterial,
      );
      mainBeam.castShadow = true;

      const browTine = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.15, 0.28, -0.04),
            new THREE.Vector3(side * 0.2, 0.42, 0.14),
            new THREE.Vector3(side * 0.17, 0.56, 0.25),
          ],
          0.022,
          0.008,
          8,
          6,
        ),
        antlerMaterial,
      );

      const bezTine = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.28, 0.48, -0.02),
            new THREE.Vector3(side * 0.38, 0.66, 0.12),
            new THREE.Vector3(side * 0.34, 0.8, 0.24),
          ],
          0.02,
          0.007,
          8,
          6,
        ),
        antlerMaterial,
      );

      const crownTine = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.36, 0.66, 0.03),
            new THREE.Vector3(side * 0.5, 0.84, -0.02),
            new THREE.Vector3(side * 0.53, 0.98, 0.05),
          ],
          0.018,
          0.006,
          8,
          6,
        ),
        antlerMaterial,
      );

      if (isFrostStag) {
        const crystalTip = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.048, 0),
          palette.iceMat,
        );
        crystalTip.position.set(side * 0.34, 0.92, 0.15);
        headGroup.add(crystalTip);
      }

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.12, 0.06, -0.07);
      earPivot.rotation.z = -side * 1.05;
      earPivot.rotation.x = -0.25;
      earPivot.userData.baseRotX = earPivot.rotation.x;
      const ear = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.15, 4, 8),
        coatMat,
      );
      ear.scale.set(0.95, 1.0, 0.55);
      ear.position.y = 0.04;
      const earIn = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.024, 0.1, 4, 6),
        palette.innerEarMat,
      );
      earIn.scale.set(0.8, 1, 0.3);
      earIn.position.set(0, 0.04, 0.018);
      earPivot.add(ear, earIn);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.115,
        0.03,
        0.09,
        0.028,
        isFrostStag ? palette.frostSteelMat : palette.eyeGlintMat,
        palette,
      );

      headGroup.add(mainBeam, browTine, bezTine, crownTine);
    }

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 1.04, -0.66);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.22, 10),
      palette.furTrimMat,
    );
    tail.rotation.x = -Math.PI / 1.55;
    tail.position.set(0, -0.04, -0.06);
    tailPivot.add(tail);

    stagScaleGroup.add(torso, chestMane, rumpPatch, neck, headGroup, tailPivot);

    const legContainer = new THREE.Group();
    legContainer.scale.setScalar(scale);
    bodyGroup.add(legContainer);

    const legCoords: [number, number, boolean][] = [
      [-0.2, 0.4, true],
      [0.2, 0.4, true],
      [-0.21, -0.43, false],
      [0.21, -0.43, false],
    ];
    for (const [lx, lz, isFront] of legCoords) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.86,
        z: lz,
        upperRadius: isFront ? 0.078 : 0.098,
        midRadius: 0.048,
        lowerRadius: 0.034,
        upperLen: 0.42,
        lowerLen: 0.39,
        upperAngleX: isFront ? 0.04 : -0.16,
        lowerAngleX: isFront ? -0.05 : 0.18,
        upperMat: coatMat,
        lowerMat: coatMat,
        footMat: hoofMat,
        footType: 'hoof',
      });
      legContainer.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const alertMarker = attachAlertMarker(group, isFrostStag ? 3.1 : 2.68);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
    };
  }

  if (kind === 'lynx') {
    addContactShadow(group, palette.contactShadowMat, 0.84);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.52, yOffset: 0.62, rx: 0.025, ry: 0.025 },
      { z: -0.38, yOffset: 0.64, rx: 0.22, ry: 0.23 },
      { z: -0.06, yOffset: 0.6, rx: 0.21, ry: 0.22 },
      { z: 0.26, yOffset: 0.64, rx: 0.26, ry: 0.27 },
      { z: 0.44, yOffset: 0.68, rx: 0.19, ry: 0.21 },
      { z: 0.52, yOffset: 0.7, rx: 0.02, ry: 0.02 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.lynxMat);
    torso.castShadow = true;

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      palette.furTrimMat,
    );
    belly.scale.set(0.9, 0.72, 2.2);
    belly.position.set(0, 0.5, 0);

    const neck = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0.68, 0.36),
          new THREE.Vector3(0, 0.75, 0.46),
          new THREE.Vector3(0, 0.79, 0.53),
        ],
        0.18,
        0.135,
        8,
        12,
      ),
      palette.lynxMat,
    );

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.79, 0.53);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.175, 16, 14),
      palette.lynxMat,
    );
    cranium.scale.set(1.12, 0.95, 1.05);
    cranium.castShadow = true;

    for (const side of [-1, 1]) {
      const ruff = new THREE.Mesh(
        new THREE.ConeGeometry(0.082, 0.17, 8),
        palette.furTrimMat,
      );
      ruff.position.set(side * 0.145, -0.05, 0.04);
      ruff.rotation.z = side * 0.95;
      ruff.rotation.x = 0.25;
      headGroup.add(ruff);
    }

    attachWhiskerMuzzlePads(headGroup, -0.048, 0.18, 0.042, 0.042, palette.furTrimMat);

    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 10),
      palette.furTrimMat,
    );
    muzzle.scale.set(1.08, 0.76, 1.12);
    muzzle.position.set(0, -0.038, 0.135);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 8, 8),
      palette.innerEarMat,
    );
    nose.position.set(0, -0.022, 0.235);

    for (const side of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.105, 0.125, -0.02);
      earPivot.rotation.z = -side * 0.16;
      earPivot.userData.baseRotX = 0;

      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.19, 10),
        palette.lynxMat,
      );
      ear.scale.set(1, 1, 0.55);
      ear.position.y = 0.06;

      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.11, 6),
        palette.foxDarkMat,
      );
      tuft.position.y = 0.185;

      earPivot.add(ear, tuft);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.085,
        0.036,
        0.146,
        0.028,
        palette.predatorEyeMat,
        palette,
      );
    }
    headGroup.add(cranium, muzzle, nose);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.64, -0.5);
    const bobtail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.16, 6, 8),
      palette.lynxMat,
    );
    bobtail.rotation.x = -Math.PI / 2.6;
    bobtail.position.set(0, 0.04, -0.08);
    const tailTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 8, 8),
      palette.foxDarkMat,
    );
    tailTip.position.set(0, 0.07, -0.17);
    tailPivot.add(bobtail, tailTip);

    spinePivot.add(torso, belly, neck, headGroup, tailPivot);

    const lynxLegs: [number, number, boolean][] = [
      [-0.16, 0.3, true],
      [0.16, 0.3, true],
      [-0.165, -0.32, false],
      [0.165, -0.32, false],
    ];
    for (const [lx, lz, isFront] of lynxLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.54,
        z: lz,
        upperRadius: isFront ? 0.072 : 0.088,
        midRadius: 0.05,
        lowerRadius: 0.04,
        upperLen: 0.27,
        lowerLen: 0.24,
        upperAngleX: isFront ? 0.06 : -0.18,
        lowerAngleX: isFront ? -0.08 : 0.22,
        upperMat: palette.lynxMat,
        lowerMat: palette.lynxMat,
        footMat: palette.furTrimMat,
        footType: 'clawed_paw',
      });
      bodyGroup.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 0.9, 1.15);
    const alertMarker = attachAlertMarker(group, 1.38);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
      telegraphRing,
    };
  }

  if (kind === 'polar_bear') {
    addContactShadow(group, palette.contactShadowMat, 1.36);
    attachRarityHalo(group, 1.45, 0x8ce8ff);

    const bearScale = 1.22;
    const bearSpine = new THREE.Group();
    bearSpine.scale.setScalar(bearScale);
    spinePivot.add(bearSpine);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.74, yOffset: 0.78, rx: 0.04, ry: 0.04 },
      { z: -0.58, yOffset: 0.82, rx: 0.38, ry: 0.36 },
      { z: -0.14, yOffset: 0.81, rx: 0.44, ry: 0.42 },
      { z: 0.32, yOffset: 0.89, rx: 0.46, ry: 0.46 },
      { z: 0.62, yOffset: 0.88, rx: 0.33, ry: 0.34 },
      { z: 0.76, yOffset: 0.86, rx: 0.04, ry: 0.04 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.polarBearMat);
    torso.castShadow = true;

    const hump = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 12),
      palette.polarBearMat,
    );
    hump.scale.set(1.05, 0.86, 1.05);
    hump.position.set(0, 1.12, 0.35);
    hump.castShadow = true;

    const neck = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0.86, 0.52),
          new THREE.Vector3(0, 0.93, 0.74),
          new THREE.Vector3(0, 0.98, 0.9),
        ],
        0.31,
        0.23,
        10,
        14,
      ),
      palette.polarBearMat,
    );
    neck.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.98, 0.92);

    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 14),
      palette.polarBearMat,
    );
    skull.scale.set(1.06, 0.94, 1.18);
    skull.castShadow = true;

    const muzzle = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, -0.03, 0.14),
          new THREE.Vector3(0, -0.06, 0.28),
          new THREE.Vector3(0, -0.075, 0.42),
        ],
        0.135,
        0.088,
        8,
        12,
      ),
      palette.polarBearMat,
    );

    const jaw = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.2, 4, 8),
      palette.polarBearMat,
    );
    jaw.rotation.x = Math.PI / 2;
    jaw.position.set(0, -0.115, 0.25);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 10, 8),
      palette.noseWetMat,
    );
    nose.position.set(0, -0.065, 0.445);

    for (const side of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.165, 0.175, -0.04);
      earPivot.userData.baseRotX = 0;

      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.068, 10, 8),
        palette.polarBearMat,
      );
      ear.scale.set(0.95, 1.05, 0.55);

      const earInner = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        palette.wolfDarkMat,
      );
      earInner.scale.set(0.9, 1, 0.35);
      earInner.position.set(0, -0.005, 0.025);

      earPivot.add(ear, earInner);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.125,
        0.052,
        0.182,
        0.032,
        palette.eyeGlintMat,
        palette,
      );
    }
    headGroup.add(skull, muzzle, jaw, nose);

    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 10, 8),
      palette.polarBearMat,
    );
    tail.position.set(0, 0.86, -0.74);

    bearSpine.add(torso, hump, neck, headGroup, tail);

    const legContainer = new THREE.Group();
    legContainer.scale.setScalar(bearScale);
    bodyGroup.add(legContainer);

    const bearLegs: [number, number, boolean][] = [
      [-0.27, 0.42, true],
      [0.27, 0.42, true],
      [-0.28, -0.44, false],
      [0.28, -0.44, false],
    ];
    for (const [lx, lz, isFront] of bearLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.72,
        z: lz,
        upperRadius: isFront ? 0.14 : 0.155,
        midRadius: 0.11,
        lowerRadius: 0.092,
        upperLen: 0.34,
        lowerLen: 0.32,
        upperAngleX: isFront ? 0.04 : -0.1,
        lowerAngleX: isFront ? -0.04 : 0.1,
        upperMat: palette.polarBearMat,
        lowerMat: palette.polarBearMat,
        footMat: palette.polarBearMat,
        footType: 'clawed_paw',
      });
      legContainer.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 1.35, 1.72);
    const alertMarker = attachAlertMarker(group, 2.05);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      alertMarker,
      telegraphRing,
    };
  }

  if (kind === 'mammoth') {
    addContactShadow(group, palette.contactShadowMat, 1.95);
    attachRarityHalo(group, 2.05, 0xf6c344);

    const mammothScale = 1.32;
    const mammothSpine = new THREE.Group();
    mammothSpine.scale.setScalar(mammothScale);
    spinePivot.add(mammothSpine);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.95, yOffset: 1.1, rx: 0.05, ry: 0.05 },
      { z: -0.74, yOffset: 1.15, rx: 0.52, ry: 0.5 },
      { z: -0.22, yOffset: 1.24, rx: 0.64, ry: 0.62 },
      { z: 0.32, yOffset: 1.38, rx: 0.68, ry: 0.72 },
      { z: 0.74, yOffset: 1.44, rx: 0.52, ry: 0.58 },
      { z: 0.94, yOffset: 1.42, rx: 0.05, ry: 0.05 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.mammothMat);
    torso.castShadow = true;

    const snowMantle = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 16, 12),
      palette.snowMat,
    );
    snowMantle.scale.set(0.95, 0.36, 1.35);
    snowMantle.position.set(0, 1.88, 0.3);

    const woolSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.62, 0.45, 16),
      palette.mammothUnderMat,
    );
    woolSkirt.scale.set(1.0, 1.0, 1.35);
    woolSkirt.position.set(0, 0.92, -0.05);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0.92);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 14),
      palette.mammothMat,
    );
    cranium.scale.set(0.96, 1.12, 1.08);
    cranium.castShadow = true;

    const topKnot = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 12),
      palette.mammothMat,
    );
    topKnot.scale.set(0.92, 1.1, 0.95);
    topKnot.position.set(0, 0.28, -0.04);

    // Articulated swinging & curling trunk pivot
    const trunkPivot = new THREE.Group();
    trunkPivot.position.set(0, -0.08, 0.32);
    const trunk = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.3, 0.16),
          new THREE.Vector3(0, -0.7, 0.12),
          new THREE.Vector3(0, -0.96, 0.24),
          new THREE.Vector3(0, -0.94, 0.4),
        ],
        0.16,
        0.062,
        16,
        12,
      ),
      palette.mammothMat,
    );
    trunk.castShadow = true;
    trunkPivot.add(trunk);

    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.22, -0.22, 0.24),
            new THREE.Vector3(side * 0.34, -0.44, 0.58),
            new THREE.Vector3(side * 0.42, -0.32, 0.96),
            new THREE.Vector3(side * 0.32, 0.04, 1.24),
            new THREE.Vector3(side * 0.18, 0.36, 1.3),
          ],
          0.085,
          0.015,
          18,
          10,
        ),
        palette.ivoryMat,
      );
      tusk.castShadow = true;

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.36, 0.02, -0.08);
      earPivot.userData.baseRotX = 0;
      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 8),
        palette.mammothUnderMat,
      );
      ear.scale.set(0.35, 1.25, 0.85);
      ear.rotation.z = side * 0.24;
      earPivot.add(ear);
      headGroup.add(earPivot);
      earPivots.push(earPivot);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.28,
        0.04,
        0.26,
        0.04,
        palette.predatorEyeMat,
        palette,
      );

      headGroup.add(tusk);
    }
    headGroup.add(cranium, topKnot, trunkPivot);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 1.18, -0.92);
    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.03, 0.42, 8),
      palette.mammothUnderMat,
    );
    tail.rotation.x = -0.38;
    tail.position.set(0, -0.18, -0.08);
    const tailTuft = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      palette.mammothUnderMat,
    );
    tailTuft.position.set(0, -0.38, -0.16);
    tailPivot.add(tail, tailTuft);

    mammothSpine.add(torso, snowMantle, woolSkirt, headGroup, tailPivot);

    const legContainer = new THREE.Group();
    legContainer.scale.setScalar(mammothScale);
    bodyGroup.add(legContainer);

    const mammothLegs: [number, number][] = [
      [-0.38, 0.52],
      [0.38, 0.52],
      [-0.36, -0.52],
      [0.36, -0.52],
    ];
    for (const [lx, lz] of mammothLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 1.05,
        z: lz,
        upperRadius: 0.215,
        midRadius: 0.175,
        lowerRadius: 0.16,
        upperLen: 0.48,
        lowerLen: 0.46,
        upperAngleX: 0.02,
        lowerAngleX: -0.02,
        upperMat: palette.mammothMat,
        lowerMat: palette.mammothUnderMat,
        footMat: palette.ivoryMat,
        footType: 'pillar',
      });
      legContainer.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 1.85, 2.3);
    const alertMarker = attachAlertMarker(group, 3.15);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      trunkPivot,
      alertMarker,
      telegraphRing,
    };
  }

  if (kind === 'musk_ox') {
    addContactShadow(group, palette.contactShadowMat, 1.32);
    attachRarityHalo(group, 1.38, 0x38bdf8);

    const oxScale = 1.15;
    const oxSpine = new THREE.Group();
    oxSpine.scale.setScalar(oxScale);
    spinePivot.add(oxSpine);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.7, yOffset: 0.74, rx: 0.04, ry: 0.04 },
      { z: -0.52, yOffset: 0.76, rx: 0.34, ry: 0.35 },
      { z: -0.14, yOffset: 0.76, rx: 0.4, ry: 0.42 },
      { z: 0.28, yOffset: 0.85, rx: 0.44, ry: 0.48 },
      { z: 0.56, yOffset: 0.84, rx: 0.32, ry: 0.35 },
      { z: 0.7, yOffset: 0.82, rx: 0.04, ry: 0.04 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.muskOxMat);
    torso.castShadow = true;

    // Shaggy flowing winter skirt & broad shoulder hump
    const woolSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.45, 0.42, 16),
      palette.muskOxWoolMat,
    );
    woolSkirt.scale.set(1.0, 1.0, 1.48);
    woolSkirt.position.set(0, 0.56, -0.05);
    woolSkirt.castShadow = true;

    const shoulderHump = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 14, 12),
      palette.muskOxMat,
    );
    shoulderHump.scale.set(0.95, 0.92, 1.15);
    shoulderHump.position.set(0, 1.06, 0.28);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.86, 0.78);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 14, 12),
      palette.muskOxMat,
    );
    cranium.scale.set(1.06, 0.96, 1.12);
    cranium.castShadow = true;

    const snout = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 12, 10),
      palette.muskOxWoolMat,
    );
    snout.scale.set(0.95, 0.82, 1.25);
    snout.position.set(0, -0.06, 0.2);

    const hornBoss = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.22, 6, 10),
      palette.ivoryMat,
    );
    hornBoss.rotation.z = Math.PI / 2;
    hornBoss.scale.set(0.85, 1.0, 0.75);
    hornBoss.position.set(0, 0.19, 0.04);

    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.1, 0.19, 0.04),
            new THREE.Vector3(side * 0.28, 0.04, 0.08),
            new THREE.Vector3(side * 0.34, -0.1, 0.18),
            new THREE.Vector3(side * 0.31, 0.06, 0.28),
          ],
          0.072,
          0.016,
          14,
          10,
        ),
        palette.ivoryMat,
      );
      horn.castShadow = true;
      headGroup.add(horn);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.13,
        0.04,
        0.16,
        0.028,
        palette.eyeGlintMat,
        palette,
      );

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.18, 0.08, -0.06);
      earPivot.rotation.z = -side * 0.9;
      earPivot.userData.baseRotX = 0;
      const ear = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.036, 0.09, 4, 6),
        palette.muskOxWoolMat,
      );
      earPivot.add(ear);
      headGroup.add(earPivot);
      earPivots.push(earPivot);
    }

    headGroup.add(cranium, snout, hornBoss);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.78, -0.68);
    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      palette.muskOxWoolMat,
    );
    tailPivot.add(tail);

    oxSpine.add(torso, woolSkirt, shoulderHump, headGroup, tailPivot);

    const legContainer = new THREE.Group();
    legContainer.scale.setScalar(oxScale);
    bodyGroup.add(legContainer);

    const oxLegs: [number, number, boolean][] = [
      [-0.24, 0.4, true],
      [0.24, 0.4, true],
      [-0.24, -0.42, false],
      [0.24, -0.42, false],
    ];
    for (const [lx, lz, isFront] of oxLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.62,
        z: lz,
        upperRadius: isFront ? 0.115 : 0.125,
        midRadius: 0.082,
        lowerRadius: 0.064,
        upperLen: 0.28,
        lowerLen: 0.26,
        upperAngleX: isFront ? 0.04 : -0.1,
        lowerAngleX: isFront ? -0.04 : 0.1,
        upperMat: palette.muskOxWoolMat,
        lowerMat: palette.furTrimMat,
        footMat: palette.foxDarkMat,
        footType: 'hoof',
      });
      legContainer.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const alertMarker = attachAlertMarker(group, 1.92);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
    };
  }

  if (kind === 'sabertooth') {
    addContactShadow(group, palette.contactShadowMat, 1.18);
    attachRarityHalo(group, 1.28, 0xfbbf24);

    const catScale = 1.18;
    const catSpine = new THREE.Group();
    catSpine.scale.setScalar(catScale);
    spinePivot.add(catSpine);

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.62, yOffset: 0.68, rx: 0.03, ry: 0.03 },
      { z: -0.46, yOffset: 0.71, rx: 0.24, ry: 0.26 },
      { z: -0.08, yOffset: 0.68, rx: 0.25, ry: 0.26 },
      { z: 0.3, yOffset: 0.74, rx: 0.32, ry: 0.34 },
      { z: 0.52, yOffset: 0.78, rx: 0.24, ry: 0.28 },
      { z: 0.64, yOffset: 0.8, rx: 0.03, ry: 0.03 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, palette.sabertoothMat);
    torso.castShadow = true;

    const shoulderMuscles = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 12),
      palette.sabertoothMat,
    );
    shoulderMuscles.scale.set(1.04, 1.0, 1.12);
    shoulderMuscles.position.set(0, 0.82, 0.36);

    const neck = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0.76, 0.44),
          new THREE.Vector3(0, 0.84, 0.58),
          new THREE.Vector3(0, 0.89, 0.66),
        ],
        0.22,
        0.165,
        8,
        12,
      ),
      palette.sabertoothMat,
    );

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.89, 0.68);

    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.195, 16, 14),
      palette.sabertoothMat,
    );
    skull.scale.set(1.12, 0.94, 1.08);
    skull.castShadow = true;

    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 12, 10),
      palette.furTrimMat,
    );
    muzzle.scale.set(1.02, 0.82, 1.18);
    muzzle.position.set(0, -0.038, 0.16);

    const jaw = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.048, 0.14, 4, 8),
      palette.furTrimMat,
    );
    jaw.rotation.x = Math.PI / 2;
    jaw.position.set(0, -0.095, 0.15);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 8, 8),
      palette.noseWetMat,
    );
    nose.position.set(0, -0.018, 0.28);

    // Twin iconic curved Smilodon saber fangs
    for (const side of [-1, 1]) {
      const fang = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.062, -0.038, 0.21),
            new THREE.Vector3(side * 0.064, -0.14, 0.225),
            new THREE.Vector3(side * 0.06, -0.255, 0.195),
          ],
          0.022,
          0.004,
          10,
          8,
        ),
        palette.ivoryMat,
      );
      fang.castShadow = true;
      headGroup.add(fang);

      attachRealisticAnimalEye(
        headGroup,
        side * 0.105,
        0.045,
        0.16,
        0.03,
        palette.predatorEyeMat,
        palette,
      );

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.125, 0.135, -0.02);
      earPivot.rotation.z = -side * 0.2;
      earPivot.userData.baseRotX = 0;
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.058, 0.14, 8),
        palette.sabertoothMat,
      );
      ear.scale.set(1, 1, 0.55);
      ear.position.y = 0.045;
      earPivot.add(ear);
      headGroup.add(earPivot);
      earPivots.push(earPivot);
    }

    headGroup.add(skull, muzzle, jaw, nose);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.72, -0.58);
    const bobtail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.2, 6, 8),
      palette.sabertoothMat,
    );
    bobtail.rotation.x = -Math.PI / 2.8;
    bobtail.position.set(0, 0.03, -0.1);
    tailPivot.add(bobtail);

    catSpine.add(torso, shoulderMuscles, neck, headGroup, tailPivot);

    const legContainer = new THREE.Group();
    legContainer.scale.setScalar(catScale);
    bodyGroup.add(legContainer);

    const catLegs: [number, number, boolean][] = [
      [-0.2, 0.36, true],
      [0.2, 0.36, true],
      [-0.2, -0.38, false],
      [0.2, -0.38, false],
    ];
    for (const [lx, lz, isFront] of catLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.6,
        z: lz,
        upperRadius: isFront ? 0.095 : 0.1,
        midRadius: 0.068,
        lowerRadius: 0.054,
        upperLen: 0.29,
        lowerLen: 0.26,
        upperAngleX: isFront ? 0.06 : -0.15,
        lowerAngleX: isFront ? -0.06 : 0.16,
        upperMat: palette.sabertoothMat,
        lowerMat: palette.sabertoothMat,
        footMat: palette.furTrimMat,
        footType: 'clawed_paw',
      });
      legContainer.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 1.15, 1.48);
    const alertMarker = attachAlertMarker(group, 1.72);
    return {
      group,
      bodyGroup,
      spinePivot,
      legs,
      lowerLegs,
      headGroup,
      earPivots,
      tailPivot,
      alertMarker,
      telegraphRing,
    };
  }

  // Timber Wolf & Mythic Aurora Frost-Fenrir
  const isFenrir = kind === 'aurora_fenrir';
  const wolfScale = isFenrir ? 1.32 : 1.04;
  const bodyFurMat = isFenrir ? palette.auroraFenrirMat : palette.wolfMat;
  const darkFurMat = isFenrir ? palette.auroraCrystalMat : palette.wolfDarkMat;

  addContactShadow(group, palette.contactShadowMat, isFenrir ? 1.36 : 0.96);
  if (isFenrir) {
    attachRarityHalo(group, 1.65, 0xe879f9);
    attachRarityHalo(group, 1.32, 0x38bdf8);
  }

  const wolfSpine = new THREE.Group();
  wolfSpine.scale.setScalar(wolfScale);
  spinePivot.add(wolfSpine);

  const torsoGeo = createSculptedTorsoGeometry([
    { z: -0.58, yOffset: 0.7, rx: 0.025, ry: 0.025 },
    { z: -0.44, yOffset: 0.72, rx: 0.22, ry: 0.23 },
    { z: -0.08, yOffset: 0.69, rx: 0.21, ry: 0.22 },
    { z: 0.28, yOffset: 0.73, rx: 0.29, ry: 0.32 },
    { z: 0.48, yOffset: 0.76, rx: 0.24, ry: 0.27 },
    { z: 0.58, yOffset: 0.78, rx: 0.025, ry: 0.025 },
  ]);
  const torso = new THREE.Mesh(torsoGeo, bodyFurMat);
  torso.castShadow = true;

  const hackles = new THREE.Mesh(
    new THREE.SphereGeometry(0.29, 16, 12),
    isFenrir ? palette.auroraFenrirMat : palette.wolfDarkMat,
  );
  hackles.scale.set(1.0, 1.08, 1.15);
  hackles.position.set(0, 0.81, 0.38);
  hackles.castShadow = true;

  if (isFenrir) {
    // Glowing dorsal & shoulder crystal ridge spikes on Mythic Aurora Fenrir
    for (let sp = 0; sp < 5; sp++) {
      const crystalSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.32 - sp * 0.03, 5),
        palette.auroraCrystalMat,
      );
      crystalSpike.position.set(0, 1.06 - sp * 0.025, 0.4 - sp * 0.19);
      crystalSpike.rotation.x = -0.35 - sp * 0.06;
      wolfSpine.add(crystalSpike);
    }
    for (const side of [-1, 1]) {
      const shoulderCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        palette.auroraCrystalMat,
      );
      shoulderCrystal.scale.set(0.65, 1.5, 0.65);
      shoulderCrystal.position.set(side * 0.27, 0.9, 0.36);
      shoulderCrystal.rotation.z = -side * 0.45;
      wolfSpine.add(shoulderCrystal);
    }
  }

  const neck = new THREE.Mesh(
    createTaperedCurveGeometry(
      [
        new THREE.Vector3(0, 0.76, 0.42),
        new THREE.Vector3(0, 0.83, 0.52),
        new THREE.Vector3(0, 0.88, 0.6),
      ],
      0.22,
      0.16,
      8,
      12,
    ),
    bodyFurMat,
  );

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.88, 0.6);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 16, 14),
    bodyFurMat,
  );
  cranium.scale.set(1.06, 0.94, 1.12);
  cranium.castShadow = true;

  const snout = new THREE.Mesh(
    createTaperedCurveGeometry(
      [
        new THREE.Vector3(0, -0.02, 0.1),
        new THREE.Vector3(0, -0.045, 0.24),
        new THREE.Vector3(0, -0.055, 0.36),
      ],
      0.105,
      0.05,
      8,
      10,
    ),
    isFenrir ? palette.auroraFenrirMat : palette.wolfDarkMat,
  );

  attachWhiskerMuzzlePads(headGroup, -0.058, 0.28, 0.042, 0.038, bodyFurMat);

  const lowerJaw = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.042, 0.16, 4, 8),
    bodyFurMat,
  );
  lowerJaw.rotation.x = Math.PI / 2;
  lowerJaw.position.set(0, -0.088, 0.22);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 8, 8),
    palette.noseWetMat,
  );
  nose.position.set(0, -0.045, 0.38);

  for (const side of [-1, 1]) {
    attachRealisticAnimalEye(
      headGroup,
      side * 0.092,
      0.04,
      0.15,
      0.028,
      isFenrir ? palette.auroraCrystalMat : palette.predatorEyeMat,
      palette,
    );

    const earPivot = new THREE.Group();
    earPivot.position.set(side * 0.1, 0.125, -0.02);
    earPivot.rotation.z = -side * 0.12;
    earPivot.rotation.x = 0.12;
    earPivot.userData.baseRotX = earPivot.rotation.x;
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.064, 0.19, 10),
      isFenrir ? palette.auroraFenrirMat : palette.wolfDarkMat,
    );
    ear.scale.set(1, 1, 0.55);
    ear.position.y = 0.055;
    const earIn = new THREE.Mesh(
      new THREE.ConeGeometry(0.038, 0.12, 8),
      darkFurMat,
    );
    earIn.scale.set(1, 1, 0.35);
    earIn.position.set(0, 0.045, 0.018);
    earPivot.add(ear, earIn);
    headGroup.add(earPivot);
    earPivots.push(earPivot);
  }
  headGroup.add(cranium, snout, lowerJaw, nose);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.72, -0.52);
  const tail = new THREE.Mesh(
    createTaperedCurveGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.08, -0.22),
        new THREE.Vector3(0, -0.14, -0.44),
      ],
      0.088,
      0.038,
      10,
      10,
    ),
    isFenrir ? palette.auroraCrystalMat : palette.wolfDarkMat,
  );
  tailPivot.add(tail);
  registerWindTarget(group, {
    pivot: tailPivot,
    stiffness: 0.9,
    phaseOffset: 0.9,
    baseRotX: 0,
    baseRotZ: 0,
  });

  wolfSpine.add(torso, hackles, neck, headGroup, tailPivot);

  const legContainer = new THREE.Group();
  legContainer.scale.setScalar(wolfScale);
  bodyGroup.add(legContainer);

  const wolfLegCoords: [number, number, boolean][] = [
    [-0.175, 0.35, true],
    [0.175, 0.35, true],
    [-0.18, -0.37, false],
    [0.18, -0.37, false],
  ];
  for (const [lx, lz, isFront] of wolfLegCoords) {
    const lp = createArticulatedLeg({
      x: lx,
      y: 0.62,
      z: lz,
      upperRadius: isFront ? 0.074 : 0.088,
      midRadius: 0.052,
      lowerRadius: 0.038,
      upperLen: 0.29,
      lowerLen: 0.29,
      upperAngleX: isFront ? 0.06 : -0.15,
      lowerAngleX: isFront ? -0.06 : 0.16,
      upperMat: bodyFurMat,
      lowerMat: isFenrir ? palette.auroraFenrirMat : palette.wolfDarkMat,
      footMat: darkFurMat,
      footType: 'clawed_paw',
    });
    legContainer.add(lp.pivot);
    legs.push(lp.pivot);
    lowerLegs.push(lp.lowerPivot);
  }

  const telegraphRing = attachTelegraphRing(
    group,
    isFenrir ? 1.25 : 0.95,
    isFenrir ? 1.62 : 1.24,
  );
  const alertMarker = attachAlertMarker(group, isFenrir ? 2.05 : 1.54);
  return {
    group,
    bodyGroup,
    spinePivot,
    legs,
    lowerLegs,
    headGroup,
    earPivots,
    tailPivot,
    alertMarker,
    telegraphRing,
  };
}

export function createPickupModel(
  kind: 'wood' | 'stone' | 'ice' | 'meat' | 'pelt' | 'gold',
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 0.44);

  if (kind === 'wood') {
    for (const [x, y, z] of [
      [-0.1, 0.14, 0],
      [0.1, 0.14, 0],
      [0, 0.3, 0],
    ]) {
      const log = createLogMesh(0.11, 0.56, 12, palette);
      log.rotation.z = Math.PI / 2;
      log.position.set(x, y, z);
      group.add(log);
    }
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.025, 8, 16),
      palette.darkWoodMat,
    );
    strap.rotation.y = Math.PI / 2;
    strap.position.y = 0.2;
    group.add(strap);
    return group;
  }

  if (kind === 'stone') {
    const chunkA = new THREE.Mesh(
      createCraggyRockGeometry(0.22, 1, 11),
      palette.rockMat,
    );
    chunkA.position.set(-0.08, 0.2, 0.04);
    chunkA.scale.set(1.15, 0.85, 1.0);
    chunkA.castShadow = true;

    const chunkB = new THREE.Mesh(
      createCraggyRockGeometry(0.16, 1, 17),
      palette.rockMat,
    );
    chunkB.position.set(0.12, 0.16, -0.05);
    chunkB.scale.set(0.95, 0.8, 1.1);
    chunkB.castShadow = true;

    const flint = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      palette.ironMat,
    );
    flint.position.set(0.02, 0.34, 0.02);
    group.add(chunkA, chunkB, flint);
    return group;
  }

  if (kind === 'ice') {
    const shardMain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.18, 0.55, 6),
      palette.iceMat,
    );
    shardMain.position.set(0, 0.32, 0);
    shardMain.castShadow = true;

    const shardLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.11, 0.38, 6),
      palette.iceMat,
    );
    shardLeft.position.set(-0.14, 0.22, 0.05);
    shardLeft.rotation.z = 0.45;

    const shardRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.1, 0.34, 6),
      palette.frostSteelMat,
    );
    shardRight.position.set(0.14, 0.22, -0.04);
    shardRight.rotation.z = -0.4;

    group.add(shardMain, shardLeft, shardRight);
    return group;
  }

  if (kind === 'meat') {
    const meatMat = new THREE.MeshStandardMaterial({
      color: 0xa6332e,
      roughness: 0.52,
      metalness: 0.04,
    });
    const marblingMat = new THREE.MeshStandardMaterial({
      color: 0xf0dcd2,
      roughness: 0.58,
      metalness: 0.02,
    });
    const haunch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.44, 12),
      meatMat,
    );
    haunch.rotation.z = Math.PI / 2;
    haunch.position.set(0, 0.24, 0);
    haunch.castShadow = true;

    const marblingRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.188, 0.195, 0.09, 12),
      marblingMat,
    );
    marblingRing.rotation.z = Math.PI / 2;
    marblingRing.position.set(0.06, 0.24, 0);

    const bone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.055, 0.68, 8),
      palette.ivoryMat,
    );
    bone.rotation.z = Math.PI / 2;
    bone.position.set(0, 0.24, 0);

    for (const bx of [-0.34, 0.34]) {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), palette.ivoryMat);
      knob.position.set(bx, 0.25, 0);
      group.add(knob);
    }
    group.add(haunch, marblingRing, bone);
    return group;
  }

  if (kind === 'pelt') {
    const roll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.54, 14),
      palette.stagMat,
    );
    roll.rotation.z = Math.PI / 2;
    roll.position.y = 0.22;
    roll.castShadow = true;
    const furEdge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.178, 0.178, 0.13, 14),
      palette.furTrimMat,
    );
    furEdge.rotation.z = Math.PI / 2;
    furEdge.position.set(0.22, 0.22, 0);
    const cord = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.022, 8, 16),
      palette.coatRedMat,
    );
    cord.rotation.y = Math.PI / 2;
    cord.position.y = 0.22;
    group.add(roll, furEdge, cord);
    return group;
  }

  // Beveled stamped gold coin
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.065, 24),
    palette.goldMat,
  );
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.32;
  coin.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.032, 10, 24),
    palette.goldMat,
  );
  rim.position.y = 0.32;
  const starEmboss = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    palette.warmWindowMat,
  );
  starEmboss.scale.set(1, 1, 0.45);
  starEmboss.position.set(0, 0.32, 0);
  group.add(coin, rim, starEmboss);
  return group;
}

export interface CampfireModel {
  group: THREE.Group;
  flames: THREE.Group;
  light: THREE.PointLight;
  warmthRing: THREE.Mesh;
}

export function createCampfireModel(palette: MaterialPalette): CampfireModel {
  const group = new THREE.Group();

  // Craggy natural stone hearth ring (10 unique displaced boulders)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(
      createCraggyRockGeometry(0.28, 1, i + 3),
      palette.rockMat,
    );
    stone.position.set(Math.cos(a) * 1.06, 0.16, Math.sin(a) * 1.06);
    stone.scale.set(1.15, 0.72, 1.0);
    stone.rotation.y = a + i * 0.4;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  // Glowing coal bed + split firewood logs with visible end-grain rings
  const bed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.94, 0.14, 18),
    palette.emberMat,
  );
  bed.position.y = 0.07;
  group.add(bed);

  for (let i = 0; i < 5; i++) {
    const log = createLogMesh(0.105, 1.48, 10, palette);
    const a = (i / 5) * Math.PI * 2 + 0.2;
    log.position.set(Math.cos(a) * 0.18, 0.26, Math.sin(a) * 0.18);
    log.rotation.order = 'YXZ';
    log.rotation.y = a;
    log.rotation.z = Math.PI / 2.3;
    group.add(log);
  }

  // Iron cooking tripod & suspended cast-iron kettle
  for (let p = 0; p < 3; p++) {
    const a = (p / 3) * Math.PI * 2 + 0.35;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.032, 2.05, 8),
      palette.ironMat,
    );
    pole.position.set(Math.cos(a) * 0.56, 0.9, Math.sin(a) * 0.56);
    pole.rotation.z = Math.cos(a) * 0.42;
    pole.rotation.x = -Math.sin(a) * 0.42;
    pole.castShadow = true;
    group.add(pole);
  }
  const kettleProfile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.24, 0.04),
    new THREE.Vector2(0.32, 0.18),
    new THREE.Vector2(0.28, 0.32),
    new THREE.Vector2(0.22, 0.4),
    new THREE.Vector2(0.25, 0.43),
  ];
  const kettle = new THREE.Mesh(
    new THREE.LatheGeometry(kettleProfile, 14),
    palette.ironMat,
  );
  kettle.position.set(0, 0.92, 0);
  kettle.castShadow = true;
  const kettleChain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.48, 6),
    palette.ironMat,
  );
  kettleChain.position.set(0, 1.56, 0);
  group.add(kettle, kettleChain);

  // Multi-layered flame tongues
  const flames = new THREE.Group();
  flames.position.y = 0.3;
  const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0xff6e24 });
  const flameMidMat = new THREE.MeshBasicMaterial({ color: 0xffa633 });
  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xffe885 });

  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.05, 10), flameOuterMat);
  c1.position.y = 0.45;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.78, 8), flameCoreMat);
  c2.position.set(0.11, 0.35, 0.08);
  const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), flameMidMat);
  c3.position.set(-0.14, 0.32, -0.06);
  const c4 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.56, 8), flameOuterMat);
  c4.position.set(0.05, 0.28, -0.14);
  flames.add(c1, c2, c3, c4);
  group.add(flames);

  const light = new THREE.PointLight(0xff9a3c, 9, 20, 1.5);
  light.position.set(0, 1.75, 0);
  group.add(light);

  // Subtle warmth boundary ring on ground
  const warmthRing = new THREE.Mesh(
    new THREE.RingGeometry(8.38, 8.5, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffa640,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
  );
  warmthRing.rotation.x = -Math.PI / 2;
  warmthRing.position.y = 0.04;
  group.add(warmthRing);

  return { group, flames, light, warmthRing };
}

function createHangingLantern(palette: MaterialPalette): THREE.Group {
  const pivot = new THREE.Group();
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6),
    palette.ironMat,
  );
  chain.position.y = -0.12;

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.1, 8),
    palette.ironMat,
  );
  cap.position.y = -0.24;

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.075, 0.18, 8),
    palette.warmWindowMat,
  );
  glass.position.y = -0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.05, 8),
    palette.ironMat,
  );
  base.position.y = -0.46;

  pivot.add(chain, cap, glass, base);
  return pivot;
}

function createPennantBanner(
  palette: MaterialPalette,
  clothMat: THREE.MeshStandardMaterial,
  length = 0.85,
  height = 0.34,
): THREE.Group {
  const pivot = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, height * 0.5);
  shape.lineTo(length, 0.06);
  shape.lineTo(length * 0.84, 0);
  shape.lineTo(length, -height * 0.35);
  shape.lineTo(0, -height * 0.5);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -0.015);
  const cloth = new THREE.Mesh(geo, clothMat);
  cloth.castShadow = true;

  const trim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, height + 0.08, 8),
    palette.goldMat,
  );
  pivot.add(cloth, trim);
  return pivot;
}

export function createPlotMarkerMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.78, 32),
    new THREE.MeshBasicMaterial({
      color: 0xd9a24b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    }),
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.04;

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.11, 1.65, 10),
    palette.darkWoodMat,
  );
  post.position.set(0, 0.82, 0);
  post.castShadow = true;

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.08, 0.08),
    palette.darkWoodMat,
  );
  arm.position.set(0.24, 1.56, 0);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.42, 0.09),
    palette.timberMat,
  );
  signBoard.position.set(0, 1.1, 0.06);
  signBoard.castShadow = true;

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(0.45, 1.54, 0);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 0.4,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });

  group.add(baseRing, post, arm, signBoard, lanternPivot);
  return group;
}

function addMullionedWindow(
  parent: THREE.Group,
  palette: MaterialPalette,
  x: number,
  y: number,
  z: number,
  rotY = 0,
): void {
  const frameGroup = new THREE.Group();
  frameGroup.position.set(x, y, z);
  frameGroup.rotation.y = rotY;

  const outerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.84, 0.12),
    palette.darkWoodMat,
  );
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.68, 0.14),
    palette.warmWindowMat,
  );
  const mullionV = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.72, 0.16),
    palette.darkWoodMat,
  );
  const mullionH = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.06, 0.16),
    palette.darkWoodMat,
  );
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.09, 0.22),
    palette.darkWoodMat,
  );
  sill.position.y = -0.44;
  const snowSill = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.06, 0.18),
    palette.snowMat,
  );
  snowSill.position.set(0, -0.39, 0.02);

  frameGroup.add(outerFrame, glass, mullionV, mullionH, sill, snowSill);
  parent.add(frameGroup);
}

function createArchMaterials(palette: MaterialPalette) {
  return {
    plasterMat: new THREE.MeshStandardMaterial({
      color: 0xefe3ce,
      roughness: 0.88,
      metalness: 0.02,
    }),
    cedarShingleMat: new THREE.MeshStandardMaterial({
      color: 0x45352c,
      bumpMap: palette.timberMat.bumpMap,
      bumpScale: 0.05,
      roughness: 0.84,
      metalness: 0.04,
    }),
    slateRoofMat: new THREE.MeshStandardMaterial({
      color: 0x354454,
      bumpMap: palette.stoneMat.bumpMap,
      bumpScale: 0.045,
      roughness: 0.68,
      metalness: 0.12,
    }),
    copperMat: new THREE.MeshStandardMaterial({
      color: 0x498f82,
      roughness: 0.34,
      metalness: 0.78,
    }),
    brickMat: new THREE.MeshStandardMaterial({
      color: 0x8b5244,
      bumpMap: palette.stoneMat.bumpMap,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.03,
    }),
  };
}

function addFramedDoor(
  parent: THREE.Group,
  palette: MaterialPalette,
  x: number,
  y: number,
  z: number,
  width = 1.04,
  height = 1.72,
  arched = false,
): void {
  const doorGroup = new THREE.Group();
  doorGroup.position.set(x, y, z);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.24, height + 0.16, 0.16),
    palette.darkWoodMat,
  );
  frame.castShadow = true;

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.2),
    palette.timberMat,
  );
  panel.castShadow = true;

  // Vertical plank grooves + iron strap hinges
  for (const px of [-width * 0.26, 0, width * 0.26]) {
    const plankSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, height - 0.1, 0.22),
      palette.darkWoodMat,
    );
    plankSeam.position.x = px;
    doorGroup.add(plankSeam);
  }
  for (const hy of [height * 0.25, -height * 0.25]) {
    const hinge = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.62, 0.08, 0.24),
      palette.ironMat,
    );
    hinge.position.set(-width * 0.16, hy, 0);
    doorGroup.add(hinge);
  }

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    palette.goldMat,
  );
  handle.position.set(width * 0.33, -0.04, 0.12);

  // Warm upper peep-pane
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.44, height * 0.22, 0.23),
    palette.warmWindowMat,
  );
  glass.position.set(0, height * 0.22, 0);

  if (arched) {
    const stoneArch = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.65, width * 0.65, 0.28, 12, 1, false, 0, Math.PI),
      palette.stoneMat,
    );
    stoneArch.rotation.z = Math.PI / 2;
    stoneArch.rotation.y = Math.PI / 2;
    stoneArch.position.set(0, height * 0.48, 0.04);
    doorGroup.add(stoneArch);
  }

  doorGroup.add(frame, panel, handle, glass);
  parent.add(doorGroup);
}

function addShutterWindow(
  parent: THREE.Group,
  palette: MaterialPalette,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  shutterMat?: THREE.Material,
): void {
  addMullionedWindow(parent, palette, x, y, z, rotY);
  const sMat = shutterMat ?? palette.coatRedMat;
  const shutterGroup = new THREE.Group();
  shutterGroup.position.set(x, y, z);
  shutterGroup.rotation.y = rotY;
  for (const sx of [-0.56, 0.56]) {
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.84, 0.08), sMat);
    shutter.position.set(sx, 0, 0.02);
    shutter.castShadow = true;
    shutterGroup.add(shutter);
  }
  parent.add(shutterGroup);
}

function addPitchedSnowRoof(
  parent: THREE.Group,
  halfW: number,
  ridgeH: number,
  depth: number,
  baseY: number,
  shingleMat: THREE.Material,
  palette: MaterialPalette,
): void {
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfW, 0);
  roofShape.lineTo(0, ridgeH);
  roofShape.lineTo(halfW, 0);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  roofGeo.translate(0, 0, -depth * 0.5);

  const timberRoof = new THREE.Mesh(roofGeo, shingleMat);
  timberRoof.position.y = baseY;
  timberRoof.castShadow = true;
  timberRoof.receiveShadow = true;
  parent.add(timberRoof);

  // Thick sculpted snow blanket resting cleanly on top slope
  const snowShape = new THREE.Shape();
  snowShape.moveTo(-halfW - 0.08, 0.04);
  snowShape.lineTo(0, ridgeH + 0.14);
  snowShape.lineTo(halfW + 0.08, 0.04);
  snowShape.lineTo(halfW - 0.12, -0.02);
  snowShape.lineTo(0, ridgeH - 0.08);
  snowShape.lineTo(-halfW + 0.12, -0.02);
  snowShape.closePath();

  const snowGeo = new THREE.ExtrudeGeometry(snowShape, {
    depth: depth + 0.08,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  snowGeo.translate(0, 0, -(depth + 0.08) * 0.5);
  const snowCap = new THREE.Mesh(snowGeo, palette.snowMat);
  snowCap.position.y = baseY + 0.08;
  snowCap.castShadow = true;
  snowCap.receiveShadow = true;
  parent.add(snowCap);

  // Eave fascia trim + exposed rafter tails
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2 + 0.15, 0.18, depth + 0.12),
    palette.darkWoodMat,
  );
  fascia.position.y = baseY;
  parent.add(fascia);

  const rafterCount = Math.max(4, Math.round(depth / 0.85));
  for (let i = 0; i < rafterCount; i++) {
    const rz = -depth * 0.45 + (i / Math.max(1, rafterCount - 1)) * (depth * 0.9);
    for (const side of [-1, 1]) {
      const icicle = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.26 + ((i + 3) % 2) * 0.12, 6),
        palette.iceMat,
      );
      icicle.rotation.x = Math.PI;
      icicle.position.set(side * (halfW - 0.08), baseY - 0.14, rz);
      parent.add(icicle);
    }
  }
}

function addStoneChimney(
  parent: THREE.Group,
  palette: MaterialPalette,
  x: number,
  z: number,
  height: number,
  width = 0.86,
): void {
  const stack = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, width),
    palette.stoneMat,
  );
  stack.position.set(x, height * 0.5 + 0.18, z);
  stack.castShadow = true;
  stack.receiveShadow = true;

  const hearthShoulder = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.34, Math.min(2.0, height * 0.42), width + 0.34),
    palette.rockMat,
  );
  hearthShoulder.position.set(x, Math.min(1.1, height * 0.24), z);
  hearthShoulder.castShadow = true;

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.22, 0.18, width + 0.22),
    palette.stoneMat,
  );
  cap.position.set(x, height + 0.24, z);

  const flue = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.22, width * 0.26, 0.35, 8),
    palette.ironMat,
  );
  flue.position.set(x, height + 0.42, z);

  const snowRim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.18, 0.08, width + 0.18),
    palette.snowMat,
  );
  snowRim.position.set(x, height + 0.34, z);

  parent.add(stack, hearthShoulder, cap, flue, snowRim);
}

function addRoofDormer(
  parent: THREE.Group,
  palette: MaterialPalette,
  shingleMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotY = 0,
): void {
  const dormer = new THREE.Group();
  dormer.position.set(x, y, z);
  dormer.rotation.y = rotY;

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.92, 1.1),
    palette.timberMat,
  );
  box.castShadow = true;
  dormer.add(box);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 0.68, 4),
    shingleMat,
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.78;
  roof.castShadow = true;
  const roofSnow = new THREE.Mesh(
    new THREE.ConeGeometry(0.97, 0.56, 4),
    palette.snowMat,
  );
  roofSnow.rotation.y = Math.PI / 4;
  roofSnow.position.y = 0.87;
  dormer.add(roof, roofSnow);

  addMullionedWindow(dormer, palette, 0, 0.02, 0.56, 0);
  parent.add(dormer);
}

export function createCabinMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  if (tier <= 1) {
    // Tier 1: Authentic Trapper Canvas A-Frame Shelter on Raised Timber Sleeper Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.26, 3.65),
      palette.darkWoodMat,
    );
    deck.position.y = 0.13;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    for (let p = -3; p <= 3; p++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 0.06, 0.42),
        palette.timberMat,
      );
      plank.position.set(0, 0.28, p * 0.48);
      plank.receiveShadow = true;
      group.add(plank);
    }

    const tentShape = new THREE.Shape();
    tentShape.moveTo(-1.72, 0);
    tentShape.lineTo(0, 2.42);
    tentShape.lineTo(1.72, 0);
    tentShape.closePath();

    const tentGeo = new THREE.ExtrudeGeometry(tentShape, {
      depth: 3.15,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    tentGeo.translate(0, 0, -1.575);
    const tent = new THREE.Mesh(tentGeo, palette.canvasMat);
    tent.position.y = 0.3;
    tent.castShadow = true;
    tent.receiveShadow = true;
    group.add(tent);

    // Ridge reinforcement saddle cloth & snow drifts banking the canvas sides
    const saddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, 3.24),
      palette.coatRedMat,
    );
    saddle.position.y = 2.66;
    group.add(saddle);

    for (const sx of [-1.72, 1.72]) {
      const drift = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 3.2, 8),
        palette.snowMat,
      );
      drift.rotation.x = Math.PI / 2;
      drift.scale.set(1.2, 1, 0.65);
      drift.position.set(sx, 0.34, 0);
      group.add(drift);
    }

    // Crossed front/back timber A-frame poles & horizontal ridge pole
    const ridgePole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 3.85, 10),
      palette.darkWoodMat,
    );
    ridgePole.rotation.x = Math.PI / 2;
    ridgePole.position.y = 2.7;
    group.add(ridgePole);

    for (const ez of [-1.66, 1.66]) {
      for (const side of [-1, 1]) {
        const legPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.065, 3.15, 8),
          palette.darkWoodMat,
        );
        legPole.position.set(side * 0.92, 1.56, ez);
        legPole.rotation.z = side * 0.56;
        legPole.castShadow = true;
        group.add(legPole);
      }
    }

    // Open V-vestibule revealing warm glowing interior bedroll & lantern light
    const warmPortal = new THREE.Mesh(
      new THREE.ConeGeometry(0.74, 1.78, 3),
      palette.warmWindowMat,
    );
    warmPortal.rotation.y = Math.PI;
    warmPortal.scale.set(1, 1, 0.22);
    warmPortal.position.set(0, 1.18, 1.56);
    group.add(warmPortal);

    // Rolled fur bedroll & expedition crate inside/beside porch
    const bedroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 1.05, 10),
      palette.furTrimMat,
    );
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.54, 1.08);
    const blanket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.255, 0.255, 0.45, 10),
      palette.coatBlueMat,
    );
    blanket.rotation.z = Math.PI / 2;
    blanket.position.set(0.25, 0.54, 1.08);
    group.add(bedroll, blanket);

    // Stacked split firewood & supply crate beside entrance
    for (let i = 0; i < 4; i++) {
      const fLog = createLogMesh(0.11, 0.78, 8, palette);
      fLog.rotation.x = Math.PI / 2;
      fLog.position.set(-2.05 + (i % 2) * 0.24, 0.16 + Math.floor(i / 2) * 0.2, 0.85);
      group.add(fLog);
    }
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.62, 0.76),
      palette.timberMat,
    );
    crate.position.set(2.02, 0.34, 0.96);
    crate.castShadow = true;
    group.add(crate);

    // Guy ropes & driven wooden tent stakes
    for (const sx of [-1, 1]) {
      for (const sz of [-1.15, 1.15]) {
        const stake = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.045, 0.38, 6),
          palette.darkWoodMat,
        );
        stake.position.set(sx * 2.28, 0.16, sz);
        stake.rotation.z = sx * 0.36;
        const rope = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 1.35, 5),
          palette.canvasMat,
        );
        rope.position.set(sx * 1.84, 0.75, sz);
        rope.rotation.z = sx * 0.68;
        group.add(stake, rope);
      }
    }

    const lanternPivot = createHangingLantern(palette);
    lanternPivot.position.set(0, 2.66, 1.88);
    registerWindTarget(group, {
      pivot: lanternPivot,
      stiffness: 0.55,
      phaseOffset: 0.2,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });

    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.95, 8),
      palette.darkWoodMat,
    );
    flagPole.position.set(0, 3.08, 1.62);
    const pennant = createPennantBanner(palette, palette.coatRedMat, 0.78, 0.3);
    pennant.position.set(0, 3.36, 1.62);
    registerWindTarget(group, {
      pivot: pennant,
      stiffness: 0.42,
      phaseOffset: 0.7,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });

    group.add(lanternPivot, flagPole, pennant);
    return group;
  }

  // Tiers 2..5: Realistic Multi-Story Architectural Alpine Cabins, Homesteads & Lodges
  const width = tier >= 5 ? 6.4 : tier === 4 ? 5.9 : tier === 3 ? 5.1 : 4.3;
  const depth = tier >= 5 ? 5.2 : tier === 4 ? 4.8 : tier === 3 ? 4.3 : 3.6;
  const baseWallH = tier >= 4 ? 2.5 : tier === 3 ? 2.3 : 2.25;
  const foundationH = tier >= 4 ? 0.68 : 0.52;
  const roofMat = tier >= 4 ? arch.slateRoofMat : arch.cedarShingleMat;

  // 1. Dressed river-stone foundation plinth & stepped entry stair stoop
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.62, foundationH, depth + 0.62),
    palette.stoneMat,
  );
  foundation.position.y = foundationH * 0.5;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  group.add(foundation);

  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.85 - s * 0.14, 0.16, 0.45),
      palette.stoneMat,
    );
    step.position.set(0, 0.08 + s * 0.16, depth * 0.5 + 1.38 - s * 0.36);
    step.receiveShadow = true;
    step.castShadow = true;
    group.add(step);
  }

  // 2. Ground-story hand-hewn interlocking notched log walls
  const groundBody = new THREE.Mesh(
    new THREE.BoxGeometry(width, baseWallH, depth),
    tier >= 4 ? palette.stoneMat : arch.plasterMat,
  );
  groundBody.position.y = foundationH + baseWallH * 0.5;
  groundBody.castShadow = true;
  groundBody.receiveShadow = true;
  group.add(groundBody);

  if (tier <= 3) {
    const logRows = Math.floor(baseWallH / 0.32);
    for (let r = 0; r < logRows; r++) {
      const ly = foundationH + 0.18 + r * 0.32;
      for (const sz of [-depth * 0.5, depth * 0.5]) {
        const logFB = createLogMesh(0.145, width + 0.52, 10, palette);
        logFB.rotation.z = Math.PI / 2;
        logFB.position.set(0, ly, sz);
        group.add(logFB);
      }
      for (const sx of [-width * 0.5, width * 0.5]) {
        const logSide = createLogMesh(0.145, depth + 0.52, 10, palette);
        logSide.rotation.x = Math.PI / 2;
        logSide.position.set(sx, ly + 0.13, 0);
        group.add(logSide);
      }
    }
  } else {
    // Tier 4 & 5: Stone masonry quoins & timber belt course
    const beltBeam = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.36, 0.22, depth + 0.36),
      palette.darkWoodMat,
    );
    beltBeam.position.y = foundationH + baseWallH;
    group.add(beltBeam);
  }

  // 3. Tiers 3..5: Upper Half-Timbered Alpine Chalet Story (cream stucco + dark oak beams & diagonal braces)
  let upperH = 0;
  if (tier >= 3) {
    upperH = tier >= 5 ? 2.15 : tier === 4 ? 1.95 : 1.55;
    const upperW = width + 0.32;
    const upperD = depth + 0.26;
    const upperBaseY = foundationH + baseWallH;

    const upperWall = new THREE.Mesh(
      new THREE.BoxGeometry(upperW, upperH, upperD),
      arch.plasterMat,
    );
    upperWall.position.y = upperBaseY + upperH * 0.5;
    upperWall.castShadow = true;
    upperWall.receiveShadow = true;
    group.add(upperWall);

    // Timber framing posts & cross-beams around upper story
    for (const sx of [-upperW * 0.5, 0, upperW * 0.5]) {
      for (const sz of [-upperD * 0.5, upperD * 0.5]) {
        const beamV = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, upperH + 0.08, 0.18),
          palette.darkWoodMat,
        );
        beamV.position.set(sx, upperBaseY + upperH * 0.5, sz);
        group.add(beamV);
      }
    }
    const topPlate = new THREE.Mesh(
      new THREE.BoxGeometry(upperW + 0.18, 0.2, upperD + 0.18),
      palette.darkWoodMat,
    );
    topPlate.position.y = upperBaseY + upperH;
    group.add(topPlate);

    // Upper story windows & shutters
    for (const wx of [-upperW * 0.28, upperW * 0.28]) {
      addShutterWindow(
        group,
        palette,
        wx,
        upperBaseY + upperH * 0.52,
        upperD * 0.5 + 0.04,
        0,
        tier >= 4 ? palette.coatBlueMat : palette.coatRedMat,
      );
    }
    for (const side of [-1, 1]) {
      addMullionedWindow(
        group,
        palette,
        side * (upperW * 0.5 + 0.04),
        upperBaseY + upperH * 0.52,
        0,
        (side * Math.PI) / 2,
      );
    }
  }

  const eaveY = foundationH + baseWallH + upperH;
  const roofH = tier >= 5 ? 2.55 : tier === 4 ? 2.35 : tier === 3 ? 2.0 : 1.85;
  addPitchedSnowRoof(
    group,
    width * 0.5 + 0.72,
    roofH,
    depth + 1.15,
    eaveY,
    roofMat,
    palette,
  );

  // 4. Front Arch/Plank Door & Ground Floor Shuttered Windows + Side Windows
  addFramedDoor(
    group,
    palette,
    0,
    foundationH + 0.88,
    depth * 0.5 + 0.06,
    tier >= 4 ? 1.24 : 1.02,
    tier >= 4 ? 1.82 : 1.66,
    tier >= 4,
  );
  for (const wx of [-width * 0.31, width * 0.31]) {
    addShutterWindow(
      group,
      palette,
      wx,
      foundationH + 1.22,
      depth * 0.5 + 0.06,
      0,
      tier >= 4 ? palette.coatGreenMat : palette.coatRedMat,
    );
  }
  for (const side of [-1, 1]) {
    addMullionedWindow(
      group,
      palette,
      side * (width * 0.5 + 0.06),
      foundationH + 1.22,
      0.35,
      (side * Math.PI) / 2,
    );
  }

  // 5. Covered Front Porch Deck, Turned Balustrades & Timber Support Posts
  const porchW = tier >= 3 ? width + 0.35 : 2.35;
  const porchD = tier >= 3 ? 1.55 : 1.18;
  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(porchW, 0.24, porchD),
    palette.darkWoodMat,
  );
  porch.position.set(0, foundationH - 0.08, depth * 0.5 + porchD * 0.5);
  porch.receiveShadow = true;
  porch.castShadow = true;
  group.add(porch);

  const postXs =
    tier >= 3
      ? [-porchW * 0.44, -1.05, 1.05, porchW * 0.44]
      : [-0.96, 0.96];
  for (const px of postXs) {
    const pPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.1, baseWallH + 0.1, 10),
      palette.darkWoodMat,
    );
    pPost.position.set(px, foundationH + baseWallH * 0.5, depth * 0.5 + porchD - 0.14);
    pPost.castShadow = true;
    group.add(pPost);
  }

  // Porch overhang gable awning
  const awningRoof = new THREE.Mesh(
    new THREE.BoxGeometry(porchW + 0.25, 0.14, porchD + 0.28),
    roofMat,
  );
  awningRoof.position.set(0, foundationH + baseWallH - 0.08, depth * 0.5 + porchD * 0.52);
  awningRoof.rotation.x = 0.22;
  awningRoof.castShadow = true;
  const awningSnow = new THREE.Mesh(
    new THREE.BoxGeometry(porchW + 0.28, 0.12, porchD + 0.3),
    palette.snowMat,
  );
  awningSnow.position.set(0, foundationH + baseWallH + 0.04, depth * 0.5 + porchD * 0.52);
  awningSnow.rotation.x = 0.22;
  group.add(awningRoof, awningSnow);

  if (tier >= 3) {
    // Porch railings flanking central steps
    for (const side of [-1, 1]) {
      const railLen = porchW * 0.5 - 1.15;
      if (railLen > 0.3) {
        const topRail = new THREE.Mesh(
          new THREE.BoxGeometry(railLen, 0.09, 0.1),
          palette.timberMat,
        );
        topRail.position.set(
          side * (1.1 + railLen * 0.5),
          foundationH + 0.72,
          depth * 0.5 + porchD - 0.14,
        );
        group.add(topRail);
        for (let b = 0; b < 4; b++) {
          const bal = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.68, 0.07),
            palette.darkWoodMat,
          );
          bal.position.set(
            side * (1.24 + (b / 3) * (railLen - 0.28)),
            foundationH + 0.38,
            depth * 0.5 + porchD - 0.14,
          );
          group.add(bal);
        }
      }
    }
    // Roof Dormer on front slope + barrel/firewood porch props
    addRoofDormer(
      group,
      palette,
      roofMat,
      tier >= 4 ? -1.45 : 0,
      eaveY + roofH * 0.42,
      depth * 0.26,
      0,
    );
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.26, 0.68, 12),
      palette.timberMat,
    );
    barrel.position.set(-porchW * 0.38, foundationH + 0.36, depth * 0.5 + 0.65);
    barrel.castShadow = true;
    group.add(barrel);
  }

  // Primary stone chimney + firewood stack
  addStoneChimney(
    group,
    palette,
    width * 0.32,
    -depth * 0.24,
    eaveY + roofH + 0.85,
    tier >= 4 ? 0.96 : 0.82,
  );
  for (let i = 0; i < 6; i++) {
    const fLog = createLogMesh(0.11, 0.85, 8, palette);
    fLog.rotation.x = Math.PI / 2;
    fLog.position.set(
      width * 0.5 + 0.32,
      0.18 + Math.floor(i / 3) * 0.21,
      -0.45 + (i % 3) * 0.25,
    );
    group.add(fLog);
  }

  // Swaying porch lanterns
  const lanternXs = tier >= 3 ? [-1.1, 1.1] : [-0.88];
  lanternXs.forEach((lx, idx) => {
    const lanternPivot = createHangingLantern(palette);
    lanternPivot.position.set(lx, foundationH + baseWallH - 0.34, depth * 0.5 + porchD - 0.08);
    registerWindTarget(group, {
      pivot: lanternPivot,
      stiffness: 0.58,
      phaseOffset: 0.9 + idx * 1.1,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(lanternPivot);
  });

  // 6. Tier 4 & 5: Cross-Gable Side Wing, Bay Window, Dual Chimneys & Twin Braziers
  if (tier >= 4) {
    const wingW = 2.65;
    const wingH = baseWallH + upperH * 0.72;
    const wingD = 2.85;
    const wingX = -width * 0.5 - wingW * 0.38;

    const wingFoundation = new THREE.Mesh(
      new THREE.BoxGeometry(wingW + 0.3, foundationH, wingD + 0.3),
      palette.stoneMat,
    );
    wingFoundation.position.set(wingX, foundationH * 0.5, 0.2);
    wingFoundation.castShadow = true;
    wingFoundation.receiveShadow = true;

    const wingBody = new THREE.Mesh(
      new THREE.BoxGeometry(wingW, wingH, wingD),
      arch.plasterMat,
    );
    wingBody.position.set(wingX, foundationH + wingH * 0.5, 0.2);
    wingBody.castShadow = true;
    wingBody.receiveShadow = true;

    const wingGroup = new THREE.Group();
    wingGroup.position.set(wingX, 0, 0.2);
    addPitchedSnowRoof(
      wingGroup,
      wingD * 0.5 + 0.45,
      1.65,
      wingW + 0.55,
      foundationH + wingH,
      roofMat,
      palette,
    );
    wingGroup.rotation.y = Math.PI / 2;

    addRoofDormer(
      group,
      palette,
      roofMat,
      1.45,
      eaveY + roofH * 0.42,
      depth * 0.26,
      0,
    );

    // Projecting warm bay window on cross-gable wing
    addShutterWindow(
      group,
      palette,
      wingX,
      foundationH + 1.32,
      0.2 + wingD * 0.5 + 0.06,
      0,
      palette.coatBlueMat,
    );
    addStoneChimney(
      group,
      palette,
      -width * 0.32,
      -depth * 0.24,
      eaveY + roofH + 0.85,
      0.92,
    );

    group.add(wingFoundation, wingBody, wingGroup);
  }

  // 7. Tier 5: Grand Winter Lodge — Bell/Clock Turret Spire, Rose Gable Window, Symmetrical Wing & Braziers
  if (tier >= 5) {
    // Symmetrical East Wing
    const wingW = 2.6;
    const wingH = baseWallH + upperH * 0.72;
    const wingD = 2.85;
    const wingX = width * 0.5 + wingW * 0.38;

    const wingFoundation = new THREE.Mesh(
      new THREE.BoxGeometry(wingW + 0.3, foundationH, wingD + 0.3),
      palette.stoneMat,
    );
    wingFoundation.position.set(wingX, foundationH * 0.5, 0.2);
    wingFoundation.castShadow = true;
    const wingBody = new THREE.Mesh(
      new THREE.BoxGeometry(wingW, wingH, wingD),
      arch.plasterMat,
    );
    wingBody.position.set(wingX, foundationH + wingH * 0.5, 0.2);
    wingBody.castShadow = true;
    const wingRoofGroup = new THREE.Group();
    wingRoofGroup.position.set(wingX, 0, 0.2);
    addPitchedSnowRoof(
      wingRoofGroup,
      wingD * 0.5 + 0.45,
      1.65,
      wingW + 0.55,
      foundationH + wingH,
      arch.slateRoofMat,
      palette,
    );
    wingRoofGroup.rotation.y = Math.PI / 2;
    addShutterWindow(
      group,
      palette,
      wingX,
      foundationH + 1.32,
      0.2 + wingD * 0.5 + 0.06,
      0,
      palette.coatRedMat,
    );
    group.add(wingFoundation, wingBody, wingRoofGroup);

    // Octagonal Clock/Bell Turret Spire rising above center ridge
    const turretBaseY = eaveY + roofH * 0.72;
    const turretShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.08, 1.75, 8),
      arch.plasterMat,
    );
    turretShaft.position.set(0, turretBaseY + 0.85, -0.2);
    turretShaft.castShadow = true;

    const belfryLantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 0.85, 8),
      palette.warmWindowMat,
    );
    belfryLantern.position.set(0, turretBaseY + 2.05, -0.2);

    for (let p = 0; p < 4; p++) {
      const pa = (p / 4) * Math.PI * 2 + Math.PI / 4;
      const bPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6),
        palette.darkWoodMat,
      );
      bPost.position.set(
        Math.cos(pa) * 0.86,
        turretBaseY + 2.05,
        -0.2 + Math.sin(pa) * 0.86,
      );
      group.add(bPost);
    }

    const copperSpire = new THREE.Mesh(
      new THREE.ConeGeometry(1.18, 2.05, 8),
      arch.copperMat,
    );
    copperSpire.position.set(0, turretBaseY + 3.45, -0.2);
    copperSpire.castShadow = true;

    const finialOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      palette.goldMat,
    );
    finialOrb.position.set(0, turretBaseY + 4.62, -0.2);

    // Stained aurora-gold rose medallion over main gable
    const roseTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.08, 8, 20),
      palette.goldMat,
    );
    roseTrim.position.set(0, eaveY + 1.15, depth * 0.5 + 0.56);
    const roseGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 20),
      palette.warmWindowMat,
    );
    roseGlass.position.set(0, eaveY + 1.15, depth * 0.5 + 0.58);

    // Twin roaring wrought-iron pedestal braziers flanking front staircase
    for (const bx of [-1.45, 1.45]) {
      const brazierPed = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 0.72, 8),
        palette.stoneMat,
      );
      brazierPed.position.set(bx, 0.36, depth * 0.5 + porchD + 0.55);
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.2, 0.24, 8),
        palette.ironMat,
      );
      bowl.position.set(bx, 0.82, depth * 0.5 + porchD + 0.55);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.52, 7),
        palette.emberMat,
      );
      flame.position.set(bx, 1.15, depth * 0.5 + porchD + 0.55);
      group.add(brazierPed, bowl, flame);
    }

    // Royal crimson & gold fluttering banners
    for (const bx of [-width * 0.38, width * 0.38]) {
      const bPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.044, 1.45, 8),
        palette.goldMat,
      );
      bPole.position.set(bx, eaveY + 0.65, depth * 0.5 + 0.35);
      const banner = createPennantBanner(palette, palette.coatRedMat, 1.0, 0.38);
      banner.position.set(bx, eaveY + 1.15, depth * 0.5 + 0.35);
      registerWindTarget(group, {
        pivot: banner,
        stiffness: 0.45,
        phaseOffset: bx + 0.8,
        baseRotX: 0,
        baseRotZ: 0,
        useGroupYaw: true,
      });
      group.add(bPole, banner);
    }

    group.add(turretShaft, belfryLantern, copperSpire, finialOrb, roseTrim, roseGlass);
  }

  return group;
}

export interface SawmillVisual {
  group: THREE.Group;
  blade: THREE.Mesh;
}

function createToothedSawBladeGeometry(radius: number, teeth = 24): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.86;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.16, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -0.0275);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function createSawmillMesh(tier: number, palette: MaterialPalette): SawmillVisual {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 0.36, 3.5),
    palette.timberMat,
  );
  deck.position.y = 0.18;
  deck.receiveShadow = true;
  group.add(deck);

  for (const sx of [-1.75, 1.75]) {
    for (const sz of [-1.35, 1.35]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 2.35, 12),
        palette.darkWoodMat,
      );
      post.position.set(sx, 1.32, sz);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Timber roof + snow blanket + saw carriage table
  const roofTimber = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.18, 3.8),
    palette.darkWoodMat,
  );
  roofTimber.position.y = 2.48;
  roofTimber.rotation.z = 0.08;
  roofTimber.castShadow = true;

  const roofSnow = new THREE.Mesh(
    new THREE.BoxGeometry(4.65, 0.16, 3.85),
    palette.snowMat,
  );
  roofSnow.position.y = 2.62;
  roofSnow.rotation.z = 0.08;
  roofSnow.receiveShadow = true;
  group.add(roofTimber, roofSnow);

  const sawTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.18, 1.15),
    palette.timberMat,
  );
  sawTable.position.set(0, 0.92, 0.45);
  sawTable.castShadow = true;
  group.add(sawTable);

  // Toothed circular saw blade
  const blade = new THREE.Mesh(
    createToothedSawBladeGeometry(0.68 + tier * 0.08, 22),
    tier >= 3 ? palette.frostSteelMat : palette.ironMat,
  );
  blade.rotation.x = Math.PI / 2;
  blade.position.set(0, 1.05, 0.45);
  blade.castShadow = true;
  group.add(blade);

  // Stacked growth-ring timber logs beside saw
  for (let i = 0; i < 3; i++) {
    const log = createLogMesh(0.2, 1.65, 12, palette);
    log.rotation.z = Math.PI / 2;
    log.position.set(-0.9, 0.56 + (i === 2 ? 0.32 : 0), -0.62 + (i % 2) * 0.44);
    group.add(log);
  }

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(1.75, 2.38, 1.48);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 2.3,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  if (tier >= 2) {
    const flywheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.76, 0.1, 10, 24),
      palette.ironMat,
    );
    flywheel.position.set(2.28, 1.18, 0);
    flywheel.rotation.y = Math.PI / 2;
    flywheel.castShadow = true;
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.24, 12),
      palette.ironMat,
    );
    hub.rotation.z = Math.PI / 2;
    hub.position.set(2.28, 1.18, 0);
    group.add(flywheel, hub);
  }

  if (tier >= 3) {
    const boiler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.48, 1.35, 14),
      palette.ironMat,
    );
    boiler.position.set(1.2, 1.05, -0.8);
    boiler.castShadow = true;
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 2.55, 14),
      palette.ironMat,
    );
    stack.position.set(1.2, 2.8, -0.8);
    stack.castShadow = true;
    group.add(boiler, stack);
  }

  return { group, blade };
}

export function createTanneryMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 0.3, 3.1),
    palette.darkWoodMat,
  );
  platform.position.y = 0.15;
  platform.receiveShadow = true;
  group.add(platform);

  // Wooden soaking vat with iron bands (Lathe barrel)
  const vat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.42, 0.72, 14),
    palette.timberMat,
  );
  vat.position.set(1.38, 0.62, 0.95);
  vat.castShadow = true;
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.465, 0.025, 6, 18),
    palette.ironMat,
  );
  hoop.rotation.x = Math.PI / 2;
  hoop.position.set(1.38, 0.8, 0.95);
  group.add(vat, hoop);

  // Drying rack frame + wind-swaying stretched pelts
  for (let r = 0; r < Math.min(tier + 1, 3); r++) {
    const zOff = -0.82 + r * 0.88;
    const postL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.95, 10),
      palette.timberMat,
    );
    postL.position.set(-1.32, 1.08, zOff);
    const postR = postL.clone();
    postR.position.x = 1.32;
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 2.95, 10),
      palette.timberMat,
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 1.9, zOff);

    const peltPivot = new THREE.Group();
    peltPivot.position.set(0, 1.88, zOff);

    const peltShape = new THREE.Shape();
    peltShape.moveTo(-0.56, 0);
    peltShape.lineTo(0.56, 0);
    peltShape.quadraticCurveTo(0.64, -0.55, 0.45, -1.12);
    peltShape.quadraticCurveTo(0, -1.0, -0.45, -1.12);
    peltShape.quadraticCurveTo(-0.64, -0.55, -0.56, 0);
    const peltGeo = new THREE.ExtrudeGeometry(peltShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
    });
    peltGeo.translate(0, 0, -0.0275);
    const pelt = new THREE.Mesh(
      peltGeo,
      r === 1 ? palette.wolfMat : palette.stagMat,
    );
    pelt.castShadow = true;
    peltPivot.add(pelt);

    registerWindTarget(group, {
      pivot: peltPivot,
      stiffness: 0.62,
      phaseOffset: r * 1.15,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });

    group.add(postL, postR, crossbar, peltPivot);
  }

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(-1.32, 2.02, 1.05);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 0.9,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  if (tier >= 2) {
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.14, 1.65),
      palette.coatRedMat,
    );
    awning.position.set(0, 2.28, 0.3);
    awning.rotation.x = 0.2;
    awning.castShadow = true;
    group.add(awning);
  }

  if (tier >= 3) {
    const banner = createPennantBanner(palette, palette.goldMat, 0.95, 0.35);
    banner.position.set(0, 2.85, 0.3);
    registerWindTarget(group, {
      pivot: banner,
      stiffness: 0.45,
      phaseOffset: 1.4,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(banner);
  }

  return group;
}

function createAnvilGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.22, 0);
  shape.lineTo(0.22, 0);
  shape.lineTo(0.16, 0.1);
  shape.lineTo(0.14, 0.2);
  shape.lineTo(0.36, 0.24);
  shape.lineTo(0.36, 0.32);
  shape.lineTo(-0.18, 0.32);
  shape.lineTo(-0.38, 0.25);
  shape.lineTo(-0.14, 0.2);
  shape.lineTo(-0.16, 0.1);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.12);
  return geo;
}

export function createForgeMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  // Octagonal mortared stone hearth plinth
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 2.15, 0.4, 12),
    palette.stoneMat,
  );
  base.position.y = 0.2;
  base.receiveShadow = true;
  group.add(base);

  // Stone furnace dome + tapered flue chimney + arched glowing firebrick hearth
  const fHeight = 1.65 + tier * 0.34;
  const furnace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.18, fHeight, 10),
    palette.stoneMat,
  );
  furnace.position.set(0, 0.4 + fHeight / 2, -0.55);
  furnace.castShadow = true;

  const chimneyNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.65, 0.9, 10),
    palette.stoneMat,
  );
  chimneyNeck.position.set(0, 0.4 + fHeight + 0.4, -0.55);
  chimneyNeck.castShadow = true;

  const hearthGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    palette.emberMat,
  );
  hearthGlow.position.set(0, 0.88, 0.06);

  // Leather forge bellows beside furnace
  const bellows = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.65, 8),
    palette.darkWoodMat,
  );
  bellows.rotation.z = Math.PI / 2;
  bellows.rotation.y = 0.4;
  bellows.position.set(-1.02, 0.82, -0.25);

  // Horned Blacksmith Anvil on heavy growth-ring oak stump
  const stump = createLogMesh(0.36, 0.62, 14, palette);
  stump.position.set(0.85, 0.51, 0.72);
  const anvil = new THREE.Mesh(
    createAnvilGeometry(),
    tier >= 2 ? palette.frostSteelMat : palette.ironMat,
  );
  anvil.position.set(0.85, 0.82, 0.72);
  anvil.castShadow = true;

  // Quenching water barrel
  const quenchBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.25, 0.58, 12),
    palette.timberMat,
  );
  quenchBarrel.position.set(-0.92, 0.65, 0.82);
  quenchBarrel.castShadow = true;

  group.add(furnace, chimneyNeck, hearthGlow, bellows, stump, anvil, quenchBarrel);

  if (tier >= 3) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.82, 3.1, 12),
      palette.stoneMat,
    );
    tower.position.set(0, 3.45, -0.55);
    tower.castShadow = true;
    const cage = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.055, 8, 16),
      palette.ironMat,
    );
    cage.rotation.x = Math.PI / 2;
    cage.position.set(0, 5.05, -0.55);
    const brazier = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 14, 12),
      palette.emberMat,
    );
    brazier.position.set(0, 5.2, -0.55);
    group.add(tower, cage, brazier);
  }

  return group;
}

export function createLumberCampMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(3.85, 0.24, 3.05),
    palette.darkWoodMat,
  );
  pad.position.y = 0.12;
  pad.receiveShadow = true;
  group.add(pad);

  for (const sx of [-1.48, 1.48]) {
    const backPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 2.02, 10),
      palette.timberMat,
    );
    backPost.position.set(sx, 1.11, -0.95);
    backPost.castShadow = true;

    const frontPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 2.38, 10),
      palette.timberMat,
    );
    frontPost.position.set(sx, 1.29, 0.35);
    frontPost.castShadow = true;
    group.add(backPost, frontPost);
  }

  const roofPlank = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.16, 2.15),
    palette.timberMat,
  );
  roofPlank.position.set(0, 2.28, -0.3);
  roofPlank.rotation.x = -0.24;
  roofPlank.castShadow = true;

  const roofSnow = new THREE.Mesh(
    new THREE.BoxGeometry(3.55, 0.15, 2.18),
    palette.snowMat,
  );
  roofSnow.position.set(0, 2.41, -0.3);
  roofSnow.rotation.x = -0.24;
  roofSnow.receiveShadow = true;
  group.add(roofPlank, roofSnow);

  // Growth-ring stacked firewood pile under shelter
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3 - row; col++) {
      const log = createLogMesh(0.15, 1.48, 12, palette);
      log.rotation.z = Math.PI / 2;
      log.position.set(-0.6, 0.4 + row * 0.26, -0.65 + col * 0.31 + row * 0.15);
      group.add(log);
    }
  }

  // Oak chopping block with beveled bearded axe
  const stump = createLogMesh(0.36, 0.62, 14, palette);
  stump.position.set(0.92, 0.55, 0.72);

  const axeBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.24, 0.32),
    tier >= 3 ? palette.frostSteelMat : palette.ironMat,
  );
  axeBlade.position.set(0.92, 0.9, 0.72);
  axeBlade.rotation.z = 0.22;

  const axeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.72, 10),
    palette.timberMat,
  );
  axeHandle.position.set(0.84, 1.15, 0.72);
  axeHandle.rotation.z = 0.45;
  group.add(stump, axeBlade, axeHandle);

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(1.48, 2.18, 0.58);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 0.6,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  if (tier >= 2) {
    const beam = createLogMesh(0.16, 1.78, 12, palette);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(-0.75, 0.68, 0.85);
    group.add(beam);
  }

  if (tier >= 3) {
    const banner = createPennantBanner(palette, palette.goldMat, 0.85, 0.32);
    banner.position.set(0, 2.75, 0.35);
    registerWindTarget(group, {
      pivot: banner,
      stiffness: 0.45,
      phaseOffset: 1.7,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(banner);
  }

  return group;
}

export function createBoulderModel(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 1.42);

  const mainRock = new THREE.Mesh(
    createCraggyRockGeometry(1.06, 2, 13),
    palette.rockMat,
  );
  mainRock.position.set(0, 0.6, 0);
  mainRock.scale.set(1.2, 0.82, 1.06);
  mainRock.castShadow = true;
  mainRock.receiveShadow = true;

  const sideRock = new THREE.Mesh(
    createCraggyRockGeometry(0.68, 2, 29),
    palette.rockMat,
  );
  sideRock.position.set(0.76, 0.4, 0.36);
  sideRock.scale.set(1.04, 0.78, 0.94);
  sideRock.castShadow = true;
  sideRock.receiveShadow = true;

  const snowCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.86, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    palette.snowMat,
  );
  snowCap.position.set(-0.04, 1.08, -0.02);
  snowCap.scale.set(1.12, 0.56, 0.98);
  snowCap.castShadow = true;
  snowCap.receiveShadow = true;

  const flintVein = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.21, 0),
    palette.ironMat,
  );
  flintVein.position.set(-0.52, 0.74, 0.64);
  flintVein.rotation.set(0.3, 0.8, 0.2);

  group.add(mainRock, sideRock, snowCap, flintVein);
  return group;
}

export function createWildIceSculptureModel(
  variant: 0 | 1 | 2,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 1.28);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.2, 0.34, 12),
    palette.stoneMat,
  );
  plinth.position.y = 0.17;
  plinth.receiveShadow = true;
  group.add(plinth);

  const iceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.92, 0.26, 8),
    palette.iceMat,
  );
  iceBase.position.y = 0.42;
  group.add(iceBase);

  if (variant === 0) {
    const torso = new THREE.Mesh(
      createCraggyRockGeometry(0.52, 1, 71),
      palette.iceMat,
    );
    torso.position.set(0, 0.95, 0);
    torso.scale.set(0.85, 1.2, 1.25);
    torso.castShadow = true;

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 0.72, 8),
      palette.iceMat,
    );
    neck.position.set(0, 1.52, 0.26);
    neck.rotation.x = 0.28;

    const head = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 1),
      palette.iceMat,
    );
    head.position.set(0, 1.92, 0.42);
    head.scale.set(0.85, 0.95, 1.35);

    for (const side of [-1, 1]) {
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.1, 2.02, 0.36),
        new THREE.Vector3(side * 0.26, 2.34, 0.32),
        new THREE.Vector3(side * 0.34, 2.58, 0.44),
      ]);
      const horn = new THREE.Mesh(
        new THREE.TubeGeometry(hornCurve, 10, 0.032, 6, false),
        palette.frostSteelMat,
      );
      group.add(horn);
    }
    group.add(torso, neck, head);
  } else if (variant === 1) {
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.74, 0),
      palette.iceMat,
    );
    core.position.y = 1.48;
    core.scale.set(0.78, 1.65, 0.78);
    core.castShadow = true;

    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI * 2;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.95, 6),
        palette.iceMat,
      );
      spire.position.set(Math.cos(a) * 0.42, 1.0, Math.sin(a) * 0.42);
      spire.rotation.z = -Math.cos(a) * 0.28;
      spire.rotation.x = Math.sin(a) * 0.28;
      group.add(spire);
    }

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.065, 8, 20),
      palette.frostSteelMat,
    );
    halo.position.y = 1.52;
    halo.rotation.x = 0.4;
    group.add(core, halo);
  } else {
    for (let tier = 0; tier < 3; tier++) {
      const cone = new THREE.Mesh(
        createSculptedTreeTierGeometry(0.84 - tier * 0.2, 0.95, 20 + tier),
        palette.iceMat,
      );
      cone.position.y = 0.85 + tier * 0.56;
      cone.rotation.y = tier * 0.5;
      cone.castShadow = true;
      group.add(cone);
    }
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      palette.goldMat,
    );
    star.position.y = 2.58;
    group.add(star);
  }

  return group;
}

export function createFestivalPavilionMesh(
  tier: number,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.68, 0.34, 16),
    palette.timberMat,
  );
  deck.position.y = 0.17;
  deck.receiveShadow = true;
  group.add(deck);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = Math.cos(a) * 1.78;
    const pz = Math.sin(a) * 1.78;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 2.45, 10),
      palette.darkWoodMat,
    );
    post.position.set(px, 1.42, pz);
    post.castShadow = true;
    group.add(post);

    const lanternPivot = createHangingLantern(palette);
    lanternPivot.position.set(px * 1.08, 2.42, pz * 1.08);
    registerWindTarget(group, {
      pivot: lanternPivot,
      stiffness: 0.52,
      phaseOffset: i * 0.85,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(lanternPivot);
  }

  const canopyProfile = [
    new THREE.Vector2(2.72, 0),
    new THREE.Vector2(1.9, 0.5),
    new THREE.Vector2(0.85, 1.05),
    new THREE.Vector2(0.01, 1.38),
  ];
  const awning = new THREE.Mesh(
    new THREE.LatheGeometry(canopyProfile, 16),
    palette.coatRedMat,
  );
  awning.position.y = 2.52;
  awning.castShadow = true;

  const snowTrim = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.14, 8, 24),
    palette.snowMat,
  );
  snowTrim.rotation.x = Math.PI / 2;
  snowTrim.position.y = 2.54;

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.86, 0.72),
    palette.timberMat,
  );
  counter.position.set(0, 0.74, 0.45);
  counter.castShadow = true;

  const ciderKeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12),
    palette.darkWoodMat,
  );
  ciderKeg.rotation.z = Math.PI / 2;
  ciderKeg.position.set(-0.4, 1.36, 0.45);

  const pennant = createPennantBanner(palette, palette.goldMat, 0.9, 0.34);
  pennant.position.y = 4.08;
  registerWindTarget(group, {
    pivot: pennant,
    stiffness: 0.42,
    phaseOffset: 2.1,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });

  group.add(awning, snowTrim, counter, ciderKeg, pennant);

  if (tier >= 2) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.08, 8, 24),
      palette.goldMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.55;

    const auroraSpire = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.46, 0),
      palette.iceMat,
    );
    auroraSpire.position.y = 4.68;
    auroraSpire.scale.set(0.85, 1.8, 0.85);
    group.add(ring, auroraSpire);
  }

  return group;
}

export function createCampIceSculptureMesh(
  tier: number,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.38, 1.58, 0.46, 14),
    palette.stoneMat,
  );
  plinth.position.y = 0.23;
  plinth.receiveShadow = true;
  group.add(plinth);

  const sculpture = createWildIceSculptureModel(tier >= 2 ? 1 : 0, palette);
  sculpture.position.y = 0.44;
  sculpture.scale.setScalar(tier >= 2 ? 1.28 : 1.08);
  group.add(sculpture);

  if (tier >= 2) {
    const basin = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.14, 10, 24),
      palette.iceMat,
    );
    basin.rotation.x = Math.PI / 2;
    basin.position.y = 0.56;
    group.add(basin);
  }

  return group;
}

export interface StormShelterVisual {
  group: THREE.Group;
  dome: THREE.Mesh;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
}

export function createStormShelterMesh(
  tier: number,
  palette: MaterialPalette,
  radius = 4.2,
): StormShelterVisual {
  const group = new THREE.Group();

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.9, 0.3, 14),
    palette.stoneMat,
  );
  pad.position.y = 0.15;
  pad.receiveShadow = true;
  group.add(pad);

  for (const sx of [-1.46, 1.46]) {
    const buttress = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 1.58, 2.4),
      palette.stoneMat,
    );
    buttress.position.set(sx, 0.94, -0.15);
    buttress.castShadow = true;
    buttress.receiveShadow = true;
    group.add(buttress);
  }

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 1.85, 0.36),
    palette.timberMat,
  );
  backWall.position.set(0, 1.06, -1.15);
  backWall.castShadow = true;
  group.add(backWall);

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-2.18, 0);
  roofShape.lineTo(0, 1.88);
  roofShape.lineTo(2.18, 0);
  roofShape.lineTo(1.75, 0);
  roofShape.lineTo(0, 1.46);
  roofShape.lineTo(-1.75, 0);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 2.8,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  roofGeo.translate(0, 0, -1.4);

  const timberRoof = new THREE.Mesh(roofGeo, palette.darkWoodMat);
  timberRoof.position.set(0, 1.38, -0.1);
  timberRoof.castShadow = true;
  group.add(timberRoof);

  const snowRoofShape = new THREE.Shape();
  snowRoofShape.moveTo(-2.22, 0);
  snowRoofShape.lineTo(0, 1.92);
  snowRoofShape.lineTo(2.22, 0);
  snowRoofShape.lineTo(2.04, -0.14);
  snowRoofShape.lineTo(0, 1.68);
  snowRoofShape.lineTo(-2.04, -0.14);
  snowRoofShape.closePath();

  const snowRoofGeo = new THREE.ExtrudeGeometry(snowRoofShape, {
    depth: 2.86,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  snowRoofGeo.translate(0, 0, -1.43);

  const snowBlanket = new THREE.Mesh(snowRoofGeo, palette.snowMat);
  snowBlanket.position.set(0, 1.48, -0.1);
  snowBlanket.castShadow = true;
  snowBlanket.receiveShadow = true;
  group.add(snowBlanket);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 2.1, 10),
    palette.darkWoodMat,
  );
  post.position.set(1.24, 1.18, 1.25);
  post.castShadow = true;

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    palette.warmWindowMat,
  );
  beacon.position.set(0, 3.68, -0.1);
  group.add(post, beacon);

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(1.24, 2.25, 1.25);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 0.5,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  // Storm weathervane pennant on roof ridge
  const pennant = createPennantBanner(palette, palette.coatRedMat, 0.78, 0.28);
  pennant.position.set(0, 4.02, -0.1);
  registerWindTarget(group, {
    pivot: pennant,
    stiffness: 0.4,
    phaseOffset: 1.3,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(pennant);

  if (tier >= 2) {
    for (const zOff of [-0.75, 0.55]) {
      const brace = new THREE.Mesh(
        new THREE.TorusGeometry(1.68, 0.08, 8, 18, Math.PI),
        palette.ironMat,
      );
      brace.position.set(0, 1.28, zOff);
      group.add(brace);
    }
  }

  if (tier >= 3) {
    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.07, 8, 22),
      palette.frostSteelMat,
    );
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, 3.68, -0.1);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.72, 10),
      palette.goldMat,
    );
    spire.position.set(0, 4.2, -0.1);
    group.add(crown, spire);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.16, radius, 56),
    new THREE.MeshBasicMaterial({
      color: 0x7be0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshBasicMaterial({
      color: 0x8ce8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  dome.position.y = 0.04;
  dome.visible = false;
  group.add(dome);

  return { group, dome, ring, beacon };
}

export interface PortalVisual {
  group: THREE.Group;
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  vortexDisc: THREE.Mesh;
  shards: THREE.Mesh[];
  groundHalo: THREE.Mesh;
  light: THREE.PointLight;
}

export function createPortalModel(
  variant: 'to_level2' | 'to_level1' | 'to_city' | 'from_city',
  palette: MaterialPalette,
): PortalVisual {
  const group = new THREE.Group();
  const primaryHex =
    variant === 'to_level2'
      ? 0x5be7ff
      : variant === 'to_city' || variant === 'from_city'
        ? 0xffb347
        : 0xf6c344;
  const secondaryHex =
    variant === 'to_level2'
      ? 0xa78bfa
      : variant === 'to_city' || variant === 'from_city'
        ? 0xf6c344
        : 0x7be0ff;

  // 1-2. Stepped stone dais & frost-carved inner plinth (bottom-center grounded at Y=0)
  const daisBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.45, 3.85, 0.24, 16),
    palette.rockMat,
  );
  daisBase.position.y = 0.12;
  daisBase.receiveShadow = true;
  daisBase.castShadow = true;
  group.add(daisBase);

  const daisTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.95, 0.22, 16),
    palette.stoneMat,
  );
  daisTop.position.y = 0.35;
  daisTop.receiveShadow = true;
  daisTop.castShadow = true;
  group.add(daisTop);

  // 3. Emissive rune material & glowing crystal accents
  const runeMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    emissive: primaryHex,
    emissiveIntensity: 1.6,
    roughness: 0.22,
    metalness: 0.35,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: secondaryHex,
    emissive: secondaryHex,
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.45,
  });

  // 4-5. Twin carved granite monolith pillars + frost snow caps + rune bands
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 4.1, 0.86),
      palette.stoneMat,
    );
    pillar.position.set(side * 2.05, 2.45, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.55, 1.08),
      palette.rockMat,
    );
    plinth.position.set(side * 2.05, 0.72, 0);
    plinth.castShadow = true;
    group.add(plinth);

    const runeBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.24, 0.92),
      runeMat,
    );
    runeBand.position.set(side * 2.05, 2.35, 0);
    group.add(runeBand);

    const pillarCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.56, 0.85, 6),
      palette.frostSteelMat,
    );
    pillarCap.position.set(side * 2.05, 4.88, 0);
    pillarCap.castShadow = true;
    group.add(pillarCap);

    // Side torch-brazier crystal
    const brazierCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      accentMat,
    );
    brazierCrystal.position.set(side * 2.7, 1.55, 0.45);
    group.add(brazierCrystal);
  }

  // 6. Carved arch lintel & keystone crown
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.62, 0.92),
    palette.stoneMat,
  );
  lintel.position.set(0, 4.65, 0);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  group.add(lintel);

  const keystone = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.54, 0),
    runeMat,
  );
  keystone.position.set(0, 5.38, 0);
  group.add(keystone);

  // 7-8. Rotating portal torus rings inside the archway
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.56, 0.11, 10, 36),
    runeMat,
  );
  outerRing.position.set(0, 2.48, 0);
  group.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.24, 0.065, 8, 32),
    accentMat,
  );
  innerRing.position.set(0, 2.48, 0);
  group.add(innerRing);

  // 9. Translucent shimmering vortex plane
  const vortexDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.42, 32),
    new THREE.MeshBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  vortexDisc.position.set(0, 2.48, 0);
  group.add(vortexDisc);

  // 10. Orbiting floating crystal shards
  const shards: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      i % 2 === 0 ? runeMat : accentMat,
    );
    const a = (i / 4) * Math.PI * 2;
    shard.position.set(Math.cos(a) * 1.48, 2.48 + Math.sin(a) * 1.48, 0.18);
    group.add(shard);
    shards.push(shard);
  }

  // 11. Ground threshold ring
  const groundHalo = new THREE.Mesh(
    new THREE.RingGeometry(2.15, 2.55, 42),
    new THREE.MeshBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  groundHalo.rotation.x = -Math.PI / 2;
  groundHalo.position.y = 0.47;
  group.add(groundHalo);

  // 12. Portal beacon light
  const light = new THREE.PointLight(primaryHex, 5.5, 18, 1.5);
  light.position.set(0, 2.6, 0.6);
  group.add(light);

  return {
    group,
    outerRing,
    innerRing,
    vortexDisc,
    shards,
    groundHalo,
    light,
  };
}

export interface WaystationBrazierVisual {
  group: THREE.Group;
  flames: THREE.Group;
  light: THREE.PointLight;
}

export function createWaystationBrazierModel(
  palette: MaterialPalette,
): WaystationBrazierVisual {
  const group = new THREE.Group();

  const stoneBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.4, 0.45, 10),
    palette.stoneMat,
  );
  stoneBase.position.y = 0.22;
  stoneBase.receiveShadow = true;
  stoneBase.castShadow = true;
  group.add(stoneBase);

  const ironBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.52, 0.52, 10),
    palette.ironMat,
  );
  ironBowl.position.y = 0.66;
  ironBowl.castShadow = true;
  group.add(ironBowl);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.72, 0.16),
      palette.frostSteelMat,
    );
    strut.position.set(Math.cos(a) * 0.78, 0.56, Math.sin(a) * 0.78);
    strut.rotation.y = -a;
    group.add(strut);
  }

  const flames = new THREE.Group();
  flames.position.y = 0.92;
  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 1.15, 8),
    palette.emberMat,
  );
  outerFlame.position.y = 0.55;
  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.78, 8),
    palette.warmWindowMat,
  );
  innerFlame.position.y = 0.42;
  flames.add(outerFlame, innerFlame);
  group.add(flames);

  const warmthRing = new THREE.Mesh(
    new THREE.RingGeometry(8.3, 8.6, 48),
    new THREE.MeshBasicMaterial({
      color: 0xf6c344,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  warmthRing.rotation.x = -Math.PI / 2;
  warmthRing.position.y = 0.04;
  group.add(warmthRing);

  const light = new THREE.PointLight(0xffb454, 7.2, 22, 1.4);
  light.position.set(0, 1.65, 0);
  group.add(light);

  return { group, flames, light };
}

export interface CraftingStationVisual {
  group: THREE.Group;
  smallGear: THREE.Mesh;
  largeGear: THREE.Mesh;
  hammerGroup: THREE.Group;
  beaconRing: THREE.Mesh;
}

function createToothedGearGeometry(
  outerRadius: number,
  teeth: number,
  thickness: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const rootR = outerRadius * 0.8;
  const steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 1 || phase === 2 ? outerRadius : rootR;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, outerRadius * 0.24, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -thickness * 0.5);
  return geo;
}

export function createCraftingStationMesh(
  palette: MaterialPalette,
): CraftingStationVisual {
  const group = new THREE.Group();

  // 1. Grounded stone & timber workshop deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.28, 2.9),
    palette.timberMat,
  );
  deck.position.y = 0.14;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  const stoneApron = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.24, 1.35),
    palette.stoneMat,
  );
  stoneApron.position.set(1.25, 0.12, 0.45);
  stoneApron.receiveShadow = true;
  group.add(stoneApron);

  // 2. Open-front workshop framing: tall rear tool-wall posts + narrow rear awning (keeps workbench, gears & anvil unobstructed from above)
  for (const px of [-1.62, 1.62]) {
    const rearPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 2.35, 10),
      palette.darkWoodMat,
    );
    rearPost.position.set(px, 1.32, -1.18);
    rearPost.castShadow = true;
    group.add(rearPost);
  }
  // Front-left lantern post
  const lanternPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 2.32, 10),
    palette.darkWoodMat,
  );
  lanternPost.position.set(-1.62, 1.3, 1.12);
  lanternPost.castShadow = true;
  const lanternArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.1, 0.48),
    palette.darkWoodMat,
  );
  lanternArm.position.set(-1.62, 2.4, 1.22);
  group.add(lanternPost, lanternArm);

  const roofTimber = new THREE.Mesh(
    new THREE.BoxGeometry(3.95, 0.14, 1.18),
    palette.darkWoodMat,
  );
  roofTimber.position.set(0, 2.46, -0.92);
  roofTimber.rotation.x = 0.16;
  roofTimber.castShadow = true;

  const roofSnow = new THREE.Mesh(
    new THREE.BoxGeometry(4.02, 0.13, 1.24),
    palette.snowMat,
  );
  roofSnow.position.set(0, 2.57, -0.92);
  roofSnow.rotation.x = 0.16;
  roofSnow.receiveShadow = true;
  group.add(roofTimber, roofSnow);

  // 3. Heavy Oak Artisan Workbench + legs + vise + crafting blueprint scroll
  const benchTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.16, 1.05),
    palette.timberMat,
  );
  benchTop.position.set(-0.48, 1.06, -0.15);
  benchTop.castShadow = true;
  benchTop.receiveShadow = true;
  group.add(benchTop);

  for (const lx of [-1.38, 0.42]) {
    for (const lz of [-0.55, 0.25]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.78, 0.14),
        palette.darkWoodMat,
      );
      leg.position.set(lx, 0.65, lz);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xefe3c8,
    roughness: 0.9,
    metalness: 0.02,
  });
  const scroll = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.025, 0.48),
    parchmentMat,
  );
  scroll.position.set(-0.78, 1.155, -0.1);
  scroll.rotation.y = 0.14;
  group.add(scroll);

  // Workbench jaw vise
  const viseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.22, 0.28),
    palette.ironMat,
  );
  viseBody.position.set(-1.35, 1.12, 0.42);
  group.add(viseBody);

  // 4. Oak Anvil Stump + Iron Anvil + Resting Forging Hammer
  const anvilStump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.44, 0.56, 12),
    palette.barkMat,
  );
  anvilStump.position.set(1.22, 0.52, 0.38);
  anvilStump.castShadow = true;
  group.add(anvilStump);

  const anvilBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.16, 0.38),
    palette.ironMat,
  );
  anvilBase.position.set(1.22, 0.88, 0.38);
  const anvilWaist = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.18, 0.24),
    palette.ironMat,
  );
  anvilWaist.position.set(1.22, 1.02, 0.38);
  const anvilHorn = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.18, 0.3),
    palette.frostSteelMat,
  );
  anvilHorn.position.set(1.22, 1.18, 0.38);
  anvilHorn.castShadow = true;
  group.add(anvilBase, anvilWaist, anvilHorn);

  const hammerGroup = new THREE.Group();
  hammerGroup.position.set(1.16, 1.32, 0.38);
  hammerGroup.rotation.set(0.08, 0.45, -0.18);
  const hammerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.62, 8),
    palette.timberMat,
  );
  hammerShaft.rotation.z = Math.PI / 2;
  const hammerHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.24, 0.16),
    palette.frostSteelMat,
  );
  hammerHead.position.x = 0.26;
  hammerHead.castShadow = true;
  hammerGroup.add(hammerShaft, hammerHead);
  group.add(hammerGroup);

  // Small glowing forge coal pot next to anvil
  const emberPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.24, 10),
    palette.ironMat,
  );
  emberPot.position.set(1.42, 0.36, -0.35);
  const emberCoal = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.2, 0),
    palette.emberMat,
  );
  emberCoal.scale.set(1.1, 0.5, 1.1);
  emberCoal.position.set(1.42, 0.49, -0.35);
  group.add(emberPot, emberCoal);

  // 5. Meshing Rotating Clockwork Gears mounted prominently above left/front side
  const gearBacking = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.32, 1.2),
    palette.darkWoodMat,
  );
  gearBacking.position.set(-1.54, 1.48, -0.12);
  group.add(gearBacking);

  const largeGear = new THREE.Mesh(
    createToothedGearGeometry(0.48, 12, 0.11),
    palette.goldMat,
  );
  largeGear.rotation.y = Math.PI / 2;
  largeGear.position.set(-1.68, 1.68, -0.32);
  largeGear.castShadow = true;

  const smallGear = new THREE.Mesh(
    createToothedGearGeometry(0.32, 8, 0.11),
    palette.frostSteelMat,
  );
  smallGear.rotation.y = Math.PI / 2;
  smallGear.position.set(-1.68, 1.24, 0.28);
  smallGear.castShadow = true;
  group.add(largeGear, smallGear);

  // 6. Hanging Crafting Tools Rack (Saw, Wrench, Chisel) on back beam
  const toolRackBeam = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.16, 0.12),
    palette.darkWoodMat,
  );
  toolRackBeam.position.set(-0.2, 1.98, -1.12);
  group.add(toolRackBeam);

  // Hanging Saw
  const sawBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.62, 0.03),
    palette.frostSteelMat,
  );
  sawBlade.position.set(-0.9, 1.58, -1.04);
  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.12, 0.06),
    palette.timberMat,
  );
  sawHandle.position.set(-0.9, 1.92, -1.04);

  // Hanging Wrench / Tongs
  const wrenchShaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.56, 0.04),
    palette.ironMat,
  );
  wrenchShaft.position.set(-0.35, 1.62, -1.04);
  const wrenchHead = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.03, 6, 12, Math.PI * 1.4),
    palette.ironMat,
  );
  wrenchHead.position.set(-0.35, 1.34, -1.04);
  wrenchHead.rotation.z = -Math.PI * 0.2;

  // Hanging Chisel
  const chiselShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8),
    palette.goldMat,
  );
  chiselShaft.position.set(0.22, 1.66, -1.04);
  group.add(sawBlade, sawHandle, wrenchShaft, wrenchHead, chiselShaft);

  // 7. Mounted Hunting Trap & Coiled Rope Snare displayed on workbench front
  const displayTrapBase = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.28, 12),
    palette.ironMat,
  );
  displayTrapBase.rotation.x = -Math.PI / 2;
  displayTrapBase.position.set(0.1, 1.15, 0.05);
  const displayTrapJawL = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.03, 6, 12, Math.PI),
    palette.frostSteelMat,
  );
  displayTrapJawL.position.set(0.1, 1.16, 0.05);
  displayTrapJawL.rotation.set(0.5, 0, 0);
  const displayTrapJawR = displayTrapJawL.clone();
  displayTrapJawR.rotation.set(-0.5, Math.PI, 0);

  const coiledSnare = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.04, 8, 16),
    palette.canvasMat,
  );
  coiledSnare.rotation.x = Math.PI / 2;
  coiledSnare.position.set(0.1, 1.18, -0.42);
  group.add(displayTrapBase, displayTrapJawL, displayTrapJawR, coiledSnare);

  // 8. Hanging Lantern (Wind Target)
  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(-1.62, 2.38, 1.24);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.55,
    phaseOffset: 1.9,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  // 9. Grounded amber workshop interaction ring
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.6, 42),
    new THREE.MeshBasicMaterial({
      color: 0xf6c344,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.04;
  group.add(beaconRing);

  return { group, smallGear, largeGear, hammerGroup, beaconRing };
}

export interface DeployedTrapVisual {
  group: THREE.Group;
  leftJaw: THREE.Group;
  rightJaw: THREE.Group;
  ring: THREE.Mesh;
}

export function createDeployedTrapMesh(
  kind: 'snare' | 'frost',
  palette: MaterialPalette,
): DeployedTrapVisual {
  const group = new THREE.Group();
  const isFrost = kind === 'frost';
  const accentHex = isFrost ? 0x7be0ff : 0x8ed49a;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(isFrost ? 1.55 : 1.25, isFrost ? 1.72 : 1.4, 32),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  const leftJaw = new THREE.Group();
  const rightJaw = new THREE.Group();

  if (!isFrost) {
    // Snow Snare Trap: driven wood anchor peg + brass clockwork latch + rope loop
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.42, 8),
      palette.timberMat,
    );
    stake.position.set(0.45, 0.2, 0);
    stake.rotation.z = -0.22;
    stake.castShadow = true;

    const latchGear = new THREE.Mesh(
      createToothedGearGeometry(0.18, 8, 0.05),
      palette.goldMat,
    );
    latchGear.rotation.x = -Math.PI / 2;
    latchGear.position.set(0.32, 0.09, 0);

    const snareLoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 8, 22),
      palette.canvasMat,
    );
    snareLoop.rotation.x = Math.PI / 2;
    snareLoop.position.set(0, 0.08, 0);
    leftJaw.add(snareLoop);

    group.add(stake, latchGear, leftJaw, rightJaw);
  } else {
    // Frostjaw Bear Trap: heavy iron base + pressure crystal + serrated twin steel jaws
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.62, 0.1, 10),
      palette.ironMat,
    );
    basePlate.position.y = 0.05;
    basePlate.receiveShadow = true;
    group.add(basePlate);

    const springGear = new THREE.Mesh(
      createToothedGearGeometry(0.24, 10, 0.06),
      palette.goldMat,
    );
    springGear.rotation.x = -Math.PI / 2;
    springGear.position.set(0.62, 0.09, 0);
    group.add(springGear);

    const coreCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      palette.auroraCrystalMat,
    );
    coreCrystal.position.set(0, 0.16, 0);
    group.add(coreCrystal);

    const jawArcL = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.055, 6, 16, Math.PI),
      palette.frostSteelMat,
    );
    jawArcL.castShadow = true;
    leftJaw.position.set(0, 0.12, 0);
    leftJaw.rotation.x = -0.68;
    leftJaw.add(jawArcL);

    const jawArcR = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.055, 6, 16, Math.PI),
      palette.frostSteelMat,
    );
    jawArcR.rotation.y = Math.PI;
    jawArcR.castShadow = true;
    rightJaw.position.set(0, 0.12, 0);
    rightJaw.rotation.x = 0.68;
    rightJaw.add(jawArcR);

    for (let t = 0; t < 4; t++) {
      const a = 0.35 + (t / 3) * (Math.PI - 0.7);
      const toothL = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.14, 4),
        palette.frostSteelMat,
      );
      toothL.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0.06);
      toothL.rotation.x = Math.PI / 2;
      leftJaw.add(toothL);

      const toothR = toothL.clone();
      toothR.position.set(-Math.cos(a) * 0.48, Math.sin(a) * 0.48, -0.06);
      toothR.rotation.x = -Math.PI / 2;
      rightJaw.add(toothR);
    }

    group.add(leftJaw, rightJaw);
  }

  return { group, leftJaw, rightJaw, ring };
}

export function createCityHallMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.85, 8.2), palette.stoneMat);
  plinth.position.y = 0.425;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(9.8, 3.2, 7.2), palette.stoneMat);
  groundFloor.position.y = 0.85 + 1.6;
  groundFloor.castShadow = true;
  groundFloor.receiveShadow = true;
  group.add(groundFloor);

  const upperHall = new THREE.Mesh(new THREE.BoxGeometry(10.1, 2.8, 7.45), arch.plasterMat);
  upperHall.position.y = 4.05 + 1.4;
  upperHall.castShadow = true;
  upperHall.receiveShadow = true;
  group.add(upperHall);

  for (const bx of [-5.0, -2.5, 0, 2.5, 5.0]) {
    for (const bz of [-3.72, 3.72]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.9, 0.24), palette.darkWoodMat);
      post.position.set(bx, 5.45, bz);
      group.add(post);
    }
  }

  addPitchedSnowRoof(group, 5.65, 2.85, 8.3, 6.85, arch.slateRoofMat, palette);
  addFramedDoor(group, palette, 0, 1.85, 3.68, 1.6, 2.1, true);

  for (const wx of [-3.1, 3.1]) {
    addShutterWindow(group, palette, wx, 2.25, 3.66, 0, palette.coatBlueMat);
    addShutterWindow(group, palette, wx, 5.35, 3.76, 0, palette.coatBlueMat);
  }
  addMullionedWindow(group, palette, 0, 5.35, 3.76, 0);

  // Clock / Bell Tower cupola
  const tower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.9, 2.3), palette.stoneMat);
  tower.position.set(0, 9.75, 0);
  tower.castShadow = true;
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.14, 16), palette.warmWindowMat);
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 9.95, 1.18);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.07, 8, 20), palette.goldMat);
  clockRim.position.set(0, 9.95, 1.24);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.75, 2.8, 4), arch.copperMat);
  spire.rotation.y = Math.PI / 4;
  spire.position.set(0, 12.6, 0);
  spire.castShadow = true;
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), palette.goldMat);
  finial.position.set(0, 14.15, 0);
  group.add(tower, clockFace, clockRim, spire, finial);

  addStoneChimney(group, palette, 3.6, -2.0, 9.6, 0.95);
  return group;
}

export function createCityTavernMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.65, 7.2), palette.stoneMat);
  plinth.position.y = 0.325;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const lower = new THREE.Mesh(new THREE.BoxGeometry(8.0, 2.8, 6.4), palette.timberMat);
  lower.position.y = 0.65 + 1.4;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(8.45, 2.4, 6.8), arch.plasterMat);
  upper.position.y = 3.45 + 1.2;
  upper.castShadow = true;
  upper.receiveShadow = true;
  group.add(upper);

  for (const bx of [-4.2, -1.4, 1.4, 4.2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.45, 0.2), palette.darkWoodMat);
    beam.position.set(bx, 4.65, 3.42);
    group.add(beam);
  }

  addPitchedSnowRoof(group, 4.85, 2.35, 7.6, 5.85, arch.cedarShingleMat, palette);
  addFramedDoor(group, palette, -1.2, 1.55, 3.28, 1.25, 1.85, false);
  addShutterWindow(group, palette, 1.65, 1.95, 3.26, 0, palette.coatRedMat);
  addShutterWindow(group, palette, -2.1, 4.65, 3.44, 0, palette.coatRedMat);
  addShutterWindow(group, palette, 2.1, 4.65, 3.44, 0, palette.coatRedMat);
  addRoofDormer(group, palette, arch.cedarShingleMat, 0, 6.85, 2.0, 0);
  addStoneChimney(group, palette, -2.9, -1.8, 8.6, 0.92);

  // Hanging tavern signboard + glowing mug sign
  const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.35), palette.darkWoodMat);
  signPost.position.set(-1.2, 3.25, 3.85);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.6, 0.08), palette.goldMat);
  signBoard.position.set(-1.2, 2.82, 4.32);
  group.add(signPost, signBoard);

  return group;
}

export function createCityGuildhouseMesh(
  palette: MaterialPalette,
  accentMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.6, 7.0), palette.stoneMat);
  plinth.position.y = 0.3;
  plinth.receiveShadow = true;
  group.add(plinth);

  const lower = new THREE.Mesh(new THREE.BoxGeometry(7.7, 2.95, 6.2), palette.stoneMat);
  lower.position.y = 0.6 + 1.475;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(7.9, 2.15, 6.35), arch.plasterMat);
  upper.position.y = 3.55 + 1.075;
  upper.castShadow = true;
  group.add(upper);

  addPitchedSnowRoof(group, 4.55, 2.15, 7.1, 5.7, arch.slateRoofMat, palette);
  addFramedDoor(group, palette, 0, 1.5, 3.16, 1.35, 1.85, true);
  addShutterWindow(group, palette, -2.3, 2.0, 3.16, 0, accentMat);
  addShutterWindow(group, palette, 2.3, 2.0, 3.16, 0, accentMat);
  addShutterWindow(group, palette, -2.0, 4.6, 3.2, 0, accentMat);
  addShutterWindow(group, palette, 2.0, 4.6, 3.2, 0, accentMat);
  addStoneChimney(group, palette, 2.6, -1.6, 8.2, 0.88);

  // Supply barrels & crates outside guild entrance
  for (const [bx, bz] of [
    [-2.8, 3.8],
    [-2.15, 3.95],
  ]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.78, 10), palette.timberMat);
    barrel.position.set(bx, 0.39, bz);
    barrel.castShadow = true;
    group.add(barrel);
  }
  const supplyCrate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.78, 0.9), palette.darkWoodMat);
  supplyCrate.position.set(2.65, 0.39, 3.85);
  supplyCrate.castShadow = true;
  group.add(supplyCrate);

  return group;
}

export function createCityFountainClocktowerMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.56, 16), palette.stoneMat);
  outerRim.position.y = 0.28;
  outerRim.receiveShadow = true;
  outerRim.castShadow = true;
  group.add(outerRim);

  const iceBasin = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 0.18, 20), palette.iceMat);
  iceBasin.position.y = 0.52;
  group.add(iceBasin);

  const centerPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 2.4, 8), palette.stoneMat);
  centerPedestal.position.y = 1.45;
  centerPedestal.castShadow = true;
  group.add(centerPedestal);

  const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.92, 2.8, 8), arch.plasterMat);
  obelisk.position.y = 3.85;
  obelisk.castShadow = true;
  group.add(obelisk);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.96, 1.85, 8), arch.copperMat);
  spire.position.y = 6.15;
  spire.castShadow = true;
  const beaconOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), palette.goldMat);
  beaconOrb.position.y = 7.25;
  group.add(spire, beaconOrb);

  // 4 warm corner brazier sconces around the plaza fountain rim
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const fx = Math.cos(a) * 3.55;
    const fz = Math.sin(a) * 3.55;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.2, 0.28, 8), palette.ironMat);
    bowl.position.set(fx, 0.72, fz);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.52, 7), palette.emberMat);
    flame.position.set(fx, 1.06, fz);
    group.add(bowl, flame);
  }

  const warmLight = new THREE.PointLight(0xffb86b, 6.2, 24, 1.4);
  warmLight.position.set(0, 3.2, 0);
  group.add(warmLight);

  return group;
}

export interface CityStallVisual {
  group: THREE.Group;
  beaconRing: THREE.Mesh;
}

export function createCityMarketStallMesh(
  accentHex: number,
  traderKind: 'butcher' | 'tinker' | 'apothecary' | 'quartermaster',
  palette: MaterialPalette,
): CityStallVisual {
  const group = new THREE.Group();
  const awningMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4ead5,
    roughness: 0.85,
    metalness: 0.02,
  });

  // Grounded stone platform & oak counter
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 2.5), palette.stoneMat);
  base.position.y = 0.1;
  base.receiveShadow = true;
  group.add(base);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.96, 0.95), palette.timberMat);
  counter.position.set(0, 0.68, 0.58);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  for (const px of [-1.62, 1.62]) {
    for (const pz of [-0.95, 0.95]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.095, 2.55, 8),
        palette.darkWoodMat,
      );
      post.position.set(px, 1.42, pz);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Striped canopy awning
  for (let s = 0; s < 5; s++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.12, 2.55),
      s % 2 === 0 ? awningMat : creamMat,
    );
    strip.position.set(-1.44 + s * 0.72, 2.75, 0.05);
    strip.rotation.x = 0.18;
    strip.castShadow = true;
    group.add(strip);
  }

  // Tailored counter goods display
  if (traderKind === 'butcher') {
    const meatMat = new THREE.MeshStandardMaterial({ color: 0xa6332e, roughness: 0.52 });
    const cutA = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.44, 10), meatMat);
    cutA.rotation.z = Math.PI / 2;
    cutA.position.set(-0.65, 1.32, 0.58);
    const cutB = cutA.clone();
    cutB.position.set(0.15, 1.32, 0.62);
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.26, 12), palette.timberMat);
    block.position.set(0.95, 1.28, 0.58);
    group.add(cutA, cutB, block);
  } else if (traderKind === 'tinker') {
    const gearA = new THREE.Mesh(createToothedGearGeometry(0.32, 10, 0.08), palette.goldMat);
    gearA.rotation.x = -Math.PI / 2;
    gearA.position.set(-0.7, 1.21, 0.58);
    const gearB = new THREE.Mesh(createToothedGearGeometry(0.24, 8, 0.08), palette.frostSteelMat);
    gearB.rotation.x = -Math.PI / 2;
    gearB.position.set(0.05, 1.21, 0.58);
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.26, 0.25), palette.ironMat);
    anvil.position.set(0.88, 1.29, 0.58);
    group.add(gearA, gearB, anvil);
  } else if (traderKind === 'apothecary') {
    const vialColors = [0x8ed49a, 0x5be7ff, 0xf6c344, 0xf0abfc];
    vialColors.forEach((hex, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      });
      const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.34, 8), mat);
      vial.position.set(-0.95 + idx * 0.62, 1.33, 0.58);
      group.add(vial);
    });
  } else {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.5), palette.goldMat);
    chest.position.set(-0.65, 1.37, 0.58);
    const pelt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.62, 10), palette.stagMat);
    pelt.rotation.z = Math.PI / 2;
    pelt.position.set(0.35, 1.34, 0.58);
    const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.24), palette.iceMat);
    ingot.position.set(1.05, 1.26, 0.58);
    group.add(chest, pelt, ingot);
  }

  const lantern = createHangingLantern(palette);
  lantern.position.set(1.42, 2.38, 1.05);
  group.add(lantern);

  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.6, 36),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.set(0, 0.05, 1.45);
  group.add(beaconRing);

  return { group, beaconRing };
}

export function createCityStreetlampMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.38, 8), palette.ironMat);
  base.position.y = 0.19;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 3.1, 8), palette.ironMat);
  pole.position.y = 1.9;
  pole.castShadow = true;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), palette.ironMat);
  arm.position.set(0.22, 3.35, 0);
  const bulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), palette.warmWindowMat);
  bulb.position.set(0.42, 3.12, 0);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 6), palette.ironMat);
  cap.position.set(0.42, 3.32, 0);
  group.add(base, pole, arm, bulb, cap);
  return group;
}

export interface SecretChestVisual {
  group: THREE.Group;
  lidPivot: THREE.Group;
  lockMat: THREE.MeshStandardMaterial;
  glowRing: THREE.Mesh;
  beaconDiamond: THREE.Mesh;
}

export function createSecretChestModel(
  rarity: SecretChestRarity,
  palette: MaterialPalette,
): SecretChestVisual {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 1.15);

  const glowHex =
    rarity === 'aurora' ? 0xe879f9 : rarity === 'relic' ? 0x38bdf8 : 0xf6c344;
  const trimMat =
    rarity === 'aurora'
      ? palette.auroraCrystalMat
      : rarity === 'relic'
        ? palette.frostSteelMat
        : palette.goldMat;

  const lockMat = new THREE.MeshStandardMaterial({
    color: glowHex,
    emissive: glowHex,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.45,
  });

  // Ground arcane/golden discovery ring
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1.04, 32),
    new THREE.MeshBasicMaterial({
      color: glowHex,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.04;
  group.add(glowRing);

  // Chest body timber slats + iron corner bands
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.48, 0.62), palette.darkWoodMat);
  body.position.y = 0.24;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  for (const bx of [-0.36, 0.36]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.65), trimMat);
    strap.position.set(bx, 0.25, 0);
    strap.castShadow = true;
    group.add(strap);
  }

  // Front crystal clasp lock plate
  const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), trimMat);
  lockPlate.position.set(0, 0.38, 0.32);
  const lockGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), lockMat);
  lockGem.position.set(0, 0.41, 0.37);
  group.add(lockPlate, lockGem);

  // Hinged vaulted lid pivot (rotates open on -X when looted)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.48, -0.31);

  const lidBase = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.14, 0.64), palette.timberMat);
  lidBase.position.set(0, 0.07, 0.31);
  lidBase.castShadow = true;
  const lidVault = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.94, 12, 1, false, 0, Math.PI),
    palette.darkWoodMat,
  );
  lidVault.rotation.z = Math.PI / 2;
  lidVault.rotation.y = Math.PI / 2;
  lidVault.position.set(0, 0.12, 0.31);
  lidVault.castShadow = true;
  lidPivot.add(lidBase, lidVault);

  for (const bx of [-0.36, 0.36]) {
    const lidBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.325, 0.325, 0.1, 12, 1, false, 0, Math.PI),
      trimMat,
    );
    lidBand.rotation.z = Math.PI / 2;
    lidBand.rotation.y = Math.PI / 2;
    lidBand.position.set(bx, 0.12, 0.31);
    lidPivot.add(lidBand);
  }
  group.add(lidPivot);

  // Floating subtle beacon diamond above lid
  const beaconDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), lockMat);
  beaconDiamond.position.set(0, 1.25, 0);
  group.add(beaconDiamond);

  return { group, lidPivot, lockMat, glowRing, beaconDiamond };
}

export function createTamingPenMesh(
  tier: number,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  const safeTier = Math.max(1, Math.min(3, Math.round(tier)));

  // Paddock stone corner plinths + compacted timber-edged yard (4.8m x 4.8m, open gate on +Z)
  const yardMat = new THREE.MeshStandardMaterial({
    color: safeTier >= 3 ? 0x6f8498 : 0x7c6a58,
    roughness: 0.9,
    metalness: 0.04,
  });
  const yardFloor = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.08, 4.7), yardMat);
  yardFloor.position.y = 0.04;
  yardFloor.receiveShadow = true;
  group.add(yardFloor);

  // Warm sanctuary perimeter ring inside the pen
  const penRing = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.72, 32),
    new THREE.MeshBasicMaterial({
      color: safeTier >= 3 ? 0x7be0ff : safeTier >= 2 ? 0xf6c344 : 0x8ed49a,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  penRing.rotation.x = -Math.PI / 2;
  penRing.position.set(0, 0.09, 0.25);
  group.add(penRing);

  // Fence posts & split rails around perimeter (front +Z has 1.9m open gate between x = -0.95 and +0.95)
  const postCoords: Array<[number, number]> = [
    [-2.25, -2.25],
    [-0.75, -2.25],
    [0.75, -2.25],
    [2.25, -2.25],
    [-2.25, -0.75],
    [-2.25, 0.75],
    [-2.25, 2.25],
    [2.25, -0.75],
    [2.25, 0.75],
    [2.25, 2.25],
    [-0.95, 2.25],
    [0.95, 2.25],
  ];

  for (const [px, pz] of postCoords) {
    const isGatePost = Math.abs(pz - 2.25) < 0.05 && Math.abs(Math.abs(px) - 0.95) < 0.05;
    const postH = isGatePost ? 1.38 : 0.98;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, postH, 7),
      palette.darkWoodMat,
    );
    post.position.set(px, postH * 0.5 + 0.04, pz);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    if (isGatePost) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24), palette.timberMat);
      cap.position.set(px, postH + 0.07, pz);
      group.add(cap);
      if (safeTier >= 2 || px > 0) {
        const lantern = createHangingLantern(palette);
        lantern.position.set(px, postH + 0.02, pz + 0.12);
        registerWindTarget(group, {
          pivot: lantern,
          stiffness: 0.55,
          phaseOffset: px + pz,
          baseRotX: 0,
          baseRotZ: 0,
          useGroupYaw: true,
        });
        group.add(lantern);
      }
    }
  }

  // Horizontal fence rails (back, left, right, and front wing panels flanking the open gate)
  const addRailSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const angle = Math.atan2(x2 - x1, z2 - z1);
    for (const ry of [0.42, 0.78]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, len), palette.timberMat);
      rail.position.set((x1 + x2) * 0.5, ry, (z1 + z2) * 0.5);
      rail.rotation.y = angle;
      rail.castShadow = true;
      group.add(rail);
    }
  };
  addRailSegment(-2.25, -2.25, 2.25, -2.25);
  addRailSegment(-2.25, -2.25, -2.25, 2.25);
  addRailSegment(2.25, -2.25, 2.25, 2.25);
  addRailSegment(-2.25, 2.25, -0.95, 2.25);
  addRailSegment(0.95, 2.25, 2.25, 2.25);

  // Gate overhead timber archway beam at Lv 2+
  if (safeTier >= 2) {
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.16, 0.18), palette.darkWoodMat);
    archBeam.position.set(0, 1.56, 2.25);
    archBeam.castShadow = true;
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.24, 0.08),
      safeTier >= 3 ? palette.goldMat : palette.timberMat,
    );
    plaque.position.set(0, 1.72, 2.28);
    group.add(archBeam, plaque);
  }

  // Back kennel / sanctuary lodge at z = -1.35
  const kennelW = safeTier === 1 ? 1.5 : safeTier === 2 ? 2.15 : 2.75;
  const kennelH = safeTier === 1 ? 1.05 : safeTier === 2 ? 1.35 : 1.72;
  const kennelD = safeTier === 1 ? 1.25 : 1.5;

  const kennelStone = new THREE.Mesh(
    new THREE.BoxGeometry(kennelW + 0.24, 0.22, kennelD + 0.24),
    palette.stoneMat,
  );
  kennelStone.position.set(-0.35, 0.15, -1.35);
  kennelStone.receiveShadow = true;
  group.add(kennelStone);

  const kennelBody = new THREE.Mesh(
    new THREE.BoxGeometry(kennelW, kennelH, kennelD),
    safeTier >= 3 ? palette.darkWoodMat : palette.timberMat,
  );
  kennelBody.position.set(-0.35, 0.26 + kennelH * 0.5, -1.35);
  kennelBody.castShadow = true;
  kennelBody.receiveShadow = true;
  group.add(kennelBody);

  // Cozy warm arched kennel doorway facing +Z
  const doorWarm = new THREE.Mesh(
    new THREE.BoxGeometry(0.58 + safeTier * 0.08, kennelH * 0.62, 0.12),
    palette.warmWindowMat,
  );
  doorWarm.position.set(-0.35, 0.26 + kennelH * 0.31, -1.35 + kennelD * 0.5 + 0.02);
  group.add(doorWarm);

  // Pitched snow-topped kennel roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(kennelW * 0.78, 0.85, 4),
    safeTier >= 3 ? palette.coatBlueMat : palette.coatRedMat,
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(-0.35, 0.26 + kennelH + 0.38, -1.35);
  roof.castShadow = true;
  const roofSnow = new THREE.Mesh(
    new THREE.ConeGeometry(kennelW * 0.74, 0.72, 4),
    palette.snowMat,
  );
  roofSnow.rotation.y = Math.PI / 4;
  roofSnow.position.set(-0.35, 0.26 + kennelH + 0.48, -1.35);
  group.add(roof, roofSnow);

  // Wooden feeding & water trough on West fence side
  const troughBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 1.15), palette.darkWoodMat);
  troughBox.position.set(-1.55, 0.24, 0.45);
  troughBox.castShadow = true;
  const troughWater = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.08, 0.96),
    palette.iceMat,
  );
  troughWater.position.set(-1.55, 0.37, 0.45);
  group.add(troughBox, troughWater);

  // Straw / warm fur bedding mat on East side of pen
  const bedding = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.74, 0.14, 12),
    palette.canvasMat,
  );
  bedding.position.set(1.28, 0.15, -0.35);
  const furBlanket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.56, 0.12, 10),
    palette.furTrimMat,
  );
  furBlanket.position.set(1.28, 0.2, -0.35);
  group.add(bedding, furBlanket);

  if (safeTier >= 3) {
    // Frost-crystal sanctuary spire & wind-swaying banner
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      palette.auroraCrystalMat,
    );
    crystal.position.set(1.38, 1.35, -1.55);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.95, 8),
      palette.stoneMat,
    );
    pedestal.position.set(1.38, 0.55, -1.55);
    const banner = createPennantBanner(palette, palette.coatBlueMat, 0.85, 0.3);
    banner.position.set(-0.35, 0.26 + kennelH + 0.88, -1.35);
    registerWindTarget(group, {
      pivot: banner,
      stiffness: 0.45,
      phaseOffset: 0.8,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(pedestal, crystal, banner);
  }

  return group;
}

export interface PetVisual {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  tailPivot: THREE.Group | null;
  leftWingPivot: THREE.Group | null;
  rightWingPivot: THREE.Group | null;
  legs: THREE.Group[];
  collarMesh: THREE.Mesh;
  tameRingMesh: THREE.Mesh;
  tameRingMat: THREE.MeshBasicMaterial;
  heartBeacon: THREE.Mesh;
}

export function createPetModel(
  speciesId: PetSpeciesId,
  palette: MaterialPalette,
): PetVisual {
  const spec = PET_SPECIES_SPECS[speciesId];
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, speciesId === 'calf_mammoth' ? 0.72 : 0.44);

  const tameRingMat = new THREE.MeshBasicMaterial({
    color: spec.accentHex,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const tameRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.58, 24), tameRingMat);
  tameRingMesh.rotation.x = -Math.PI / 2;
  tameRingMesh.position.y = 0.04;
  group.add(tameRingMesh);

  const heartMat = new THREE.MeshStandardMaterial({
    color: spec.accentHex,
    emissive: spec.accentHex,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  const heartBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), heartMat);
  heartBeacon.position.y = speciesId === 'calf_mammoth' ? 1.42 : 0.98;
  group.add(heartBeacon);

  const bodyGroup = new THREE.Group();
  const headGroup = new THREE.Group();
  let tailPivot: THREE.Group | null = null;
  let leftWingPivot: THREE.Group | null = null;
  let rightWingPivot: THREE.Group | null = null;
  const legs: THREE.Group[] = [];

  const bodyMat =
    speciesId === 'snow_hare'
      ? palette.hareMat
      : speciesId === 'arctic_fox'
        ? palette.snowMat
        : speciesId === 'snowy_owl'
          ? palette.snowMat
          : speciesId === 'frost_pup'
            ? palette.wolfMat
            : speciesId === 'glacial_lynx'
              ? palette.lynxMat
              : palette.mammothMat;

  const collarMat = new THREE.MeshStandardMaterial({
    color: spec.accentHex,
    emissive: spec.accentHex,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.25,
  });

  if (speciesId === 'snowy_owl') {
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), bodyMat);
    torso.scale.set(0.95, 1.25, 0.9);
    torso.position.y = 0.42;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const breast = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), palette.furTrimMat);
    breast.position.set(0, 0.38, 0.1);
    bodyGroup.add(breast);

    headGroup.position.set(0, 0.68, 0.03);
    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), bodyMat);
    headGroup.add(headSphere);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 6), palette.goldMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.21);
    headGroup.add(beak);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), palette.goldMat);
      eye.position.set(sx * 0.08, 0.03, 0.16);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), palette.eyeGlintMat);
      pupil.position.set(sx * 0.08, 0.03, 0.185);
      headGroup.add(eye, pupil);
    }

    leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-0.22, 0.48, 0);
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), bodyMat);
    lw.position.x = -0.14;
    lw.castShadow = true;
    leftWingPivot.add(lw);

    rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(0.22, 0.48, 0);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), bodyMat);
    rw.position.x = 0.14;
    rw.castShadow = true;
    rightWingPivot.add(rw);
    bodyGroup.add(headGroup, leftWingPivot, rightWingPivot);
  } else {
    const isMammoth = speciesId === 'calf_mammoth';
    const isHare = speciesId === 'snow_hare';
    const scale = isMammoth ? 1.45 : isHare ? 0.72 : 0.92;

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18 * scale, 0.3 * scale, 6, 12),
      bodyMat,
    );
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.34 * scale, 0);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Chest ruff
    const ruff = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 * scale, 10, 10),
      speciesId === 'calf_mammoth' ? palette.mammothUnderMat : palette.furTrimMat,
    );
    ruff.position.set(0, 0.36 * scale, 0.18 * scale);
    bodyGroup.add(ruff);

    // 4 animated legs
    const legOffsets: Array<[number, number]> = [
      [-0.11 * scale, 0.15 * scale],
      [0.11 * scale, 0.15 * scale],
      [-0.11 * scale, -0.15 * scale],
      [0.11 * scale, -0.15 * scale],
    ];
    for (const [lx, lz] of legOffsets) {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, 0.24 * scale, lz);
      const legMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045 * scale, 0.04 * scale, 0.24 * scale, 8),
        bodyMat,
      );
      legMesh.position.y = -0.12 * scale;
      legMesh.castShadow = true;
      legPivot.add(legMesh);
      legs.push(legPivot);
      bodyGroup.add(legPivot);
    }

    // Head + snout + expressive eyes + species ears/tusks
    headGroup.position.set(0, 0.45 * scale, 0.25 * scale);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 12, 10), bodyMat);
    headGroup.add(head);

    const snout = new THREE.Mesh(
      new THREE.ConeGeometry(0.08 * scale, 0.15 * scale, 8),
      bodyMat,
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.02 * scale, 0.14 * scale);
    headGroup.add(snout);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.032 * scale, 8, 8),
      palette.noseWetMat,
    );
    nose.position.set(0, -0.01 * scale, 0.21 * scale);
    headGroup.add(nose);

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.032 * scale, 8, 8),
        palette.eyeGlintMat,
      );
      eye.position.set(sx * 0.075 * scale, 0.04 * scale, 0.13 * scale);
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.012 * scale, 6, 6),
        palette.eyeCatchlightMat,
      );
      glint.position.set(sx * 0.08 * scale, 0.05 * scale, 0.155 * scale);
      headGroup.add(eye, glint);

      const earH = isHare ? 0.22 * scale : isMammoth ? 0.16 * scale : 0.11 * scale;
      const ear = new THREE.Mesh(
        isMammoth
          ? new THREE.BoxGeometry(0.04 * scale, 0.15 * scale, 0.12 * scale)
          : new THREE.ConeGeometry(0.055 * scale, earH, 6),
        bodyMat,
      );
      ear.position.set(
        sx * (isMammoth ? 0.17 : 0.09) * scale,
        (isHare ? 0.18 : isMammoth ? 0.04 : 0.14) * scale,
        -0.02 * scale,
      );
      ear.rotation.z = sx * (isHare ? -0.15 : isMammoth ? -0.45 : -0.2);
      headGroup.add(ear);

      if (isMammoth) {
        const tusk = new THREE.Mesh(
          new THREE.ConeGeometry(0.025, 0.16, 6),
          palette.ivoryMat,
        );
        tusk.rotation.x = Math.PI * 0.65;
        tusk.position.set(sx * 0.08, -0.08, 0.18);
        headGroup.add(tusk);
      }
    }

    if (isMammoth) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.032, 0.34, 8),
        bodyMat,
      );
      trunk.rotation.x = 0.62;
      trunk.position.set(0, -0.14, 0.22);
      headGroup.add(trunk);
    }

    bodyGroup.add(headGroup);

    // Tail pivot
    tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.38 * scale, -0.24 * scale);
    const tailLen =
      speciesId === 'arctic_fox' || speciesId === 'glacial_lynx' ? 0.34 * scale : 0.16 * scale;
    const tail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055 * scale, tailLen, 5, 8),
      speciesId === 'frost_pup' ? palette.frostSteelMat : bodyMat,
    );
    tail.rotation.x = -0.85;
    tail.position.set(0, 0.06 * scale, -tailLen * 0.45);
    tailPivot.add(tail);
    bodyGroup.add(tailPivot);
  }

  // Pet Sanctuary Collar (visible once tamed!)
  const collarScale = speciesId === 'calf_mammoth' ? 1.45 : speciesId === 'snow_hare' ? 0.72 : 0.92;
  const collarMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.145 * collarScale, 0.026 * collarScale, 8, 16),
    collarMat,
  );
  collarMesh.rotation.x = Math.PI / 2 - 0.32;
  collarMesh.position.set(
    0,
    speciesId === 'snowy_owl' ? 0.56 : 0.41 * collarScale,
    speciesId === 'snowy_owl' ? 0.03 : 0.19 * collarScale,
  );
  collarMesh.visible = false;
  bodyGroup.add(collarMesh);

  group.add(bodyGroup);
  return {
    group,
    bodyGroup,
    headGroup,
    tailPivot,
    leftWingPivot,
    rightWingPivot,
    legs,
    collarMesh,
    tameRingMesh,
    tameRingMat,
    heartBeacon,
  };
}

export function createBaseCampPropsMesh(palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  // 1. Central Hearth Flagstone Curb Ring (leaves wide avenues for N/E/S/W trails)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.34), palette.stoneMat);
    stone.position.set(Math.cos(a) * 3.05, 0.07, Math.sin(a) * 3.05);
    stone.rotation.y = -a;
    stone.receiveShadow = true;
    stone.castShadow = true;
    group.add(stone);
  }

  // 2. Quadrant Corner Lantern Stanchions framing the central Hearth Plaza
  const lanternCorners: Array<[number, number]> = [
    [-4.3, -4.3],
    [4.3, -4.3],
    [-4.3, 4.3],
    [4.3, 4.3],
  ];
  for (let i = 0; i < lanternCorners.length; i++) {
    const [lx, lz] = lanternCorners[i];
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 2.25, 8),
      palette.darkWoodMat,
    );
    post.position.set(lx, 1.12, lz);
    post.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.09), palette.timberMat);
    arm.position.set(lx * 0.94, 2.15, lz * 0.94);
    arm.rotation.y = Math.atan2(-lx, -lz);
    const lantern = createHangingLantern(palette);
    lantern.position.set(lx * 0.9, 1.98, lz * 0.9);
    registerWindTarget(group, {
      pivot: lantern,
      stiffness: 0.55,
      phaseOffset: i * 0.9,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(post, arm, lantern);
  }

  // 3. Organized Perimeter Split-Rail Fence Arcs framing the 4 Base Quadrants (open gates at N/S/E/W roads!)
  const fenceAngles = [
    // NW Quadrant arc
    2.0, 2.22, 2.44, 2.66, 2.88,
    // NE Quadrant arc
    0.26, 0.48, 0.7, 0.92, 1.14,
    // SE Quadrant arc
    -1.14, -0.92, -0.7, -0.48, -0.26,
    // SW Quadrant arc
    -2.88, -2.66, -2.44, -2.22, -2.0,
  ];
  const fenceR = 14.9;
  for (let i = 0; i < fenceAngles.length; i++) {
    const a = fenceAngles[i];
    const fx = Math.cos(a) * fenceR;
    const fz = Math.sin(a) * fenceR;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.095, 0.95, 6),
      palette.darkWoodMat,
    );
    post.position.set(fx, 0.47, fz);
    post.castShadow = true;
    group.add(post);

    // Connect to next post inside the same quadrant arc (group of 5)
    if (i % 5 < 4) {
      const aNext = fenceAngles[i + 1];
      const nx = Math.cos(aNext) * fenceR;
      const nz = Math.sin(aNext) * fenceR;
      const segLen = Math.hypot(nx - fx, nz - fz);
      const yaw = Math.atan2(nx - fx, nz - fz);
      for (const ry of [0.38, 0.72]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, segLen), palette.timberMat);
        rail.position.set((fx + nx) * 0.5, ry, (fz + nz) * 0.5);
        rail.rotation.y = yaw;
        rail.castShadow = true;
        group.add(rail);
      }
    }
  }

  // 4. Stacked Firewood Ricks & Supply Crates tucked neatly beside Homestead Quadrants
  const supplyStacks: Array<[number, number, number]> = [
    [-6.6, -9.2, 0.4],
    [8.6, -8.4, -0.5],
    [-8.6, 8.2, 0.7],
    [8.8, 8.6, -0.7],
  ];
  for (const [sx, sz, rotY] of supplyStacks) {
    const stack = new THREE.Group();
    stack.position.set(sx, 0, sz);
    stack.rotation.y = rotY;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3 - row; col++) {
        const log = createLogMesh(0.11, 1.05, 8, palette);
        log.rotation.z = Math.PI / 2;
        log.position.set(0, 0.12 + row * 0.19, -0.25 + col * 0.24 + row * 0.12);
        stack.add(log);
      }
    }
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.62), palette.timberMat);
    crate.position.set(0.75, 0.26, 0.12);
    crate.castShadow = true;
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.64, 10),
      palette.darkWoodMat,
    );
    barrel.position.set(-0.72, 0.32, 0.18);
    barrel.castShadow = true;
    stack.add(crate, barrel);
    group.add(stack);
  }

  return group;
}

export interface ZoneBossModel {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  orbitGroup: THREE.Group;
  auraRingMesh: THREE.Mesh;
  auraRingMat: THREE.MeshBasicMaterial;
  coreMat: THREE.MeshStandardMaterial;
  telegraphGroup: THREE.Group;
  telegraphFillMesh: THREE.Mesh;
  telegraphBorderMesh: THREE.Mesh;
  telegraphFillMat: THREE.MeshBasicMaterial;
  telegraphBorderMat: THREE.MeshBasicMaterial;
}

function createBossGroundTelegraph(colorHex: number): {
  telegraphGroup: THREE.Group;
  telegraphFillMesh: THREE.Mesh;
  telegraphBorderMesh: THREE.Mesh;
  telegraphFillMat: THREE.MeshBasicMaterial;
  telegraphBorderMat: THREE.MeshBasicMaterial;
} {
  const telegraphGroup = new THREE.Group();
  telegraphGroup.visible = false;
  telegraphGroup.position.y = 0.16;

  const telegraphFillMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const fillGeo = new THREE.CircleGeometry(1, 44);
  fillGeo.rotateX(-Math.PI / 2);
  const telegraphFillMesh = new THREE.Mesh(fillGeo, telegraphFillMat);

  const telegraphBorderMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });
  const borderGeo = new THREE.RingGeometry(0.82, 1.0, 48);
  borderGeo.rotateX(-Math.PI / 2);
  const telegraphBorderMesh = new THREE.Mesh(borderGeo, telegraphBorderMat);
  telegraphBorderMesh.position.y = 0.015;

  telegraphGroup.add(telegraphFillMesh, telegraphBorderMesh);
  return {
    telegraphGroup,
    telegraphFillMesh,
    telegraphBorderMesh,
    telegraphFillMat,
    telegraphBorderMat,
  };
}

/**
 * Zone 1 Boss: Skarn, Boreal Root-Warden — colossal elderwood & moss-stone guardian.
 */
export function createTimberColossusModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.1);

  const elderBarkMat = new THREE.MeshStandardMaterial({
    color: 0x4b3626,
    roughness: 0.88,
    metalness: 0.06,
  });
  const mossStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d3f,
    roughness: 0.82,
    metalness: 0.1,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.45,
    roughness: 0.22,
    metalness: 0.25,
  });

  const auraRingMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const auraRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.55, 42),
    auraRingMat,
  );
  auraRingMesh.rotation.x = -Math.PI / 2;
  auraRingMesh.position.y = 0.05;
  group.add(auraRingMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Heavy gnarled trunk legs & root feet
  for (const side of [-1, 1] as const) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.62, 1.35, 8),
      elderBarkMat,
    );
    leg.position.set(side * 0.72, 0.68, 0);
    leg.castShadow = true;
    leg.receiveShadow = true;

    const foot = new THREE.Mesh(
      createCraggyRockGeometry(0.54, 1, side === -1 ? 3 : 9),
      mossStoneMat,
    );
    foot.scale.set(1.05, 0.55, 1.35);
    foot.position.set(side * 0.75, 0.2, 0.18);
    foot.castShadow = true;
    bodyPivot.add(leg, foot);
  }

  // Barrel-chested elderwood ribcage torso with glowing amber resin core
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 0.88, 1.85, 9),
    elderBarkMat,
  );
  torso.position.set(0, 2.05, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  const chestCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    coreMat,
  );
  chestCore.scale.set(1.0, 1.28, 0.75);
  chestCore.position.set(0, 2.1, 0.92);
  bodyPivot.add(chestCore);

  // Mossy granite boulder pauldrons + back crown boughs
  for (const side of [-1, 1] as const) {
    const pauldron = new THREE.Mesh(
      createCraggyRockGeometry(0.76, 1, side === -1 ? 11 : 17),
      mossStoneMat,
    );
    pauldron.scale.set(1.15, 0.92, 1.1);
    pauldron.position.set(side * 1.32, 2.75, 0);
    pauldron.castShadow = true;
    bodyPivot.add(pauldron);
  }

  // Sculpted Root-Horns & Glowing Amber Visor Head
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.18, 0.16);
  const skull = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.62, 1),
    elderBarkMat,
  );
  skull.scale.set(1.05, 0.95, 1.12);
  skull.castShadow = true;
  headPivot.add(skull);

  for (const side of [-1, 1] as const) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), coreMat);
    eye.position.set(side * 0.22, 0.06, 0.56);
    const branchPoints = [
      new THREE.Vector3(side * 0.26, 0.32, 0.05),
      new THREE.Vector3(side * 0.68, 0.72, -0.08),
      new THREE.Vector3(side * 0.96, 1.25, -0.2),
    ];
    const antler = new THREE.Mesh(
      createTaperedCurveGeometry(branchPoints, 0.15, 0.035, 10, 8),
      elderBarkMat,
    );
    antler.castShadow = true;
    const tipBud = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), coreMat);
    tipBud.position.set(side * 0.98, 1.28, -0.2);
    headPivot.add(eye, antler, tipBud);
  }
  bodyPivot.add(headPivot);

  // Massive Articulated Root-Maul Arms
  const makeBossArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 1.48, 2.55, 0.08);
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 1.15, 8),
      elderBarkMat,
    );
    upper.position.y = -0.58;
    upper.castShadow = true;
    const fist = new THREE.Mesh(
      createCraggyRockGeometry(0.52, 1, side === -1 ? 21 : 27),
      mossStoneMat,
    );
    fist.scale.set(1.05, 1.25, 1.1);
    fist.position.set(0, -1.32, 0.12);
    fist.castShadow = true;
    const amberKnuckle = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      coreMat,
    );
    amberKnuckle.position.set(0, -1.38, 0.56);
    armPivot.add(upper, fist, amberKnuckle);
    return armPivot;
  };
  const leftArmPivot = makeBossArm(-1);
  const rightArmPivot = makeBossArm(1);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Amber Sap Motes
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const mote = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), coreMat);
    mote.position.set(Math.cos(a) * 2.15, (i % 2) * 0.35 - 0.15, Math.sin(a) * 2.15);
    orbitGroup.add(mote);
  }
  bodyPivot.add(orbitGroup);

  const telegraph = createBossGroundTelegraph(0xf59e0b);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 2 Boss: Veyra, Cryo-Sovereign — levitating glacial crystal empress.
 */
export function createCryoSovereignModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 2.9);

  const glacialArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0c4a6e,
    roughness: 0.28,
    metalness: 0.55,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 1.05,
    roughness: 0.14,
    metalness: 0.4,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.55,
    roughness: 0.18,
    metalness: 0.35,
  });

  const auraRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const auraRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.42, 42),
    auraRingMat,
  );
  auraRingMesh.rotation.x = -Math.PI / 2;
  auraRingMesh.position.y = 0.05;
  group.add(auraRingMesh);

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.35;
  group.add(bodyPivot);

  // Floating Crystal Dress Mantle (layered inverted ice cones)
  const robeLower = new THREE.Mesh(
    new THREE.ConeGeometry(1.18, 2.15, 7),
    glacialArmorMat,
  );
  robeLower.rotation.x = Math.PI;
  robeLower.position.y = 1.25;
  robeLower.castShadow = true;
  bodyPivot.add(robeLower);

  const bust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.52, 1.1, 8),
    glacialArmorMat,
  );
  bust.position.y = 2.55;
  bust.castShadow = true;
  bodyPivot.add(bust);

  const heartGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), coreMat);
  heartGem.scale.set(0.85, 1.3, 0.7);
  heartGem.position.set(0, 2.55, 0.62);
  bodyPivot.add(heartGem);

  // Twin Floating Crystal Wing Blades on Back
  for (const side of [-1, 1] as const) {
    for (let s = 0; s < 3; s++) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.18 - s * 0.03, 1.45 - s * 0.25, 5),
        s === 1 ? coreMat : crystalMat,
      );
      spire.position.set(side * (0.72 + s * 0.46), 2.75 - s * 0.26, -0.58 - s * 0.08);
      spire.rotation.z = -side * (0.58 + s * 0.28);
      spire.rotation.x = -0.18;
      spire.castShadow = true;
      bodyPivot.add(spire);
    }
  }

  // Crowned Cryo-Helm Head Pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.45, 0.05);
  const helm = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), glacialArmorMat);
  helm.scale.set(0.95, 1.15, 1.0);
  helm.castShadow = true;
  headPivot.add(helm);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 8, 28), crystalMat);
  halo.position.set(0, 0.25, -0.22);
  headPivot.add(halo);

  for (let c = -2; c <= 2; c++) {
    const crownSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.52 - Math.abs(c) * 0.08, 5),
      c === 0 ? coreMat : crystalMat,
    );
    crownSpire.position.set(c * 0.16, 0.58 - Math.abs(c) * 0.05, 0.06);
    crownSpire.rotation.z = -c * 0.16;
    headPivot.add(crownSpire);
  }
  bodyPivot.add(headPivot);

  // Articulated Floating Gauntlet Arms + Scepter
  const makeCryoArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 1.02, 2.75, 0.12);
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.26, 0.95, 7),
      glacialArmorMat,
    );
    sleeve.position.y = -0.52;
    sleeve.castShadow = true;
    const claw = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.68, 5),
      crystalMat,
    );
    claw.rotation.x = Math.PI;
    claw.position.set(0, -1.15, 0.12);
    armPivot.add(sleeve, claw);
    return armPivot;
  };
  const leftArmPivot = makeCryoArm(-1);
  const rightArmPivot = makeCryoArm(1);
  // Frost-Scepter in right hand
  const scepterShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 2.4, 8),
    glacialArmorMat,
  );
  scepterShaft.position.set(0, -0.85, 0.35);
  scepterShaft.rotation.x = 1.2;
  const scepterOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
  scepterOrb.position.set(0, -0.35, 1.48);
  rightArmPivot.add(scepterShaft, scepterOrb);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Glacial Shards
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      i % 2 === 0 ? crystalMat : coreMat,
    );
    shard.scale.set(0.75, 1.5, 0.75);
    shard.position.set(Math.cos(a) * 1.95, Math.sin(i) * 0.22, Math.sin(a) * 1.95);
    orbitGroup.add(shard);
  }
  bodyPivot.add(orbitGroup);

  const telegraph = createBossGroundTelegraph(0x38bdf8);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 3 (Frostcave City Arena) Boss: Ignis, Pit-Forged Warden — obsidian furnace juggernaut.
 */
export function createCavernWardenModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.0);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x26222c,
    roughness: 0.42,
    metalness: 0.72,
  });
  const forgedBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x854d27,
    roughness: 0.34,
    metalness: 0.78,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff6b2c,
    emissive: 0xea580c,
    emissiveIntensity: 1.65,
    roughness: 0.2,
    metalness: 0.25,
  });

  const auraRingMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const auraRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(2.05, 2.48, 42),
    auraRingMat,
  );
  auraRingMesh.rotation.x = -Math.PI / 2;
  auraRingMesh.position.y = 0.05;
  group.add(auraRingMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Armored Greave Legs
  for (const side of [-1, 1] as const) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.48, 1.3, 8),
      obsidianMat,
    );
    leg.position.set(side * 0.68, 0.65, 0);
    leg.castShadow = true;
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.46), forgedBronzeMat);
    knee.position.set(side * 0.68, 0.85, 0.14);
    bodyPivot.add(leg, knee);
  }

  // Broad Furnace Breastplate + Magma Grate Core
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 0.78, 1.7, 8),
    obsidianMat,
  );
  chest.position.y = 2.05;
  chest.castShadow = true;
  chest.receiveShadow = true;
  bodyPivot.add(chest);

  const magmaHeart = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.44, 0),
    coreMat,
  );
  magmaHeart.position.set(0, 2.08, 0.86);
  bodyPivot.add(magmaHeart);

  // Dual Back Forge Chimney Stacks
  for (const side of [-1, 1] as const) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 1.15, 8),
      forgedBronzeMat,
    );
    stack.position.set(side * 0.56, 3.02, -0.56);
    stack.rotation.x = -0.25;
    stack.castShadow = true;
    const emberCap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), coreMat);
    emberCap.position.set(side * 0.56, 3.58, -0.7);
    bodyPivot.add(stack, emberCap);
  }

  // Horned Obsidian Anvil Helm
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.16, 0.14);
  const helm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.5, 0.72, 8),
    obsidianMat,
  );
  helm.castShadow = true;
  const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.16), coreMat);
  visorSlit.position.set(0, 0.04, 0.44);
  headPivot.add(helm, visorSlit);

  for (const side of [-1, 1] as const) {
    const hornCurve = [
      new THREE.Vector3(side * 0.36, 0.18, 0),
      new THREE.Vector3(side * 0.74, 0.44, 0.08),
      new THREE.Vector3(side * 0.62, 0.86, 0.24),
    ];
    const horn = new THREE.Mesh(
      createTaperedCurveGeometry(hornCurve, 0.14, 0.03, 10, 8),
      forgedBronzeMat,
    );
    horn.castShadow = true;
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      forgedBronzeMat,
    );
    pauldron.position.set(side * 1.26, -0.45, -0.1);
    pauldron.rotation.z = -side * 0.4;
    headPivot.add(horn);
    bodyPivot.add(pauldron);
  }
  bodyPivot.add(headPivot);

  // Heavy Piston Gauntlet Left + Great Obsidian Forge Hammer Right
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.38, 2.55, 0.08);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.24, 1.08, 8),
    obsidianMat,
  );
  leftUpper.position.y = -0.54;
  leftUpper.castShadow = true;
  const leftFist = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.58), forgedBronzeMat);
  leftFist.position.set(0, -1.24, 0.08);
  leftFist.castShadow = true;
  leftArmPivot.add(leftUpper, leftFist);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.38, 2.55, 0.08);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.24, 1.08, 8),
    obsidianMat,
  );
  rightUpper.position.y = -0.54;
  rightUpper.castShadow = true;
  const hammerHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.15, 8),
    forgedBronzeMat,
  );
  hammerHandle.rotation.x = Math.PI / 2;
  hammerHandle.position.set(0, -1.16, 0.55);
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 1.08), obsidianMat);
  hammerHead.position.set(0, -1.16, 1.48);
  hammerHead.castShadow = true;
  const hammerEmber = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.78), coreMat);
  hammerEmber.position.set(0, -1.16, 1.48);
  rightArmPivot.add(rightUpper, hammerHandle, hammerHead, hammerEmber);

  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Molten Cinders
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.05;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const cinder = new THREE.Mesh(new THREE.OctahedronGeometry(0.19, 0), coreMat);
    cinder.position.set(Math.cos(a) * 2.0, (i % 2) * 0.28 - 0.14, Math.sin(a) * 2.0);
    orbitGroup.add(cinder);
  }
  bodyPivot.add(orbitGroup);

  const telegraph = createBossGroundTelegraph(0xf97316);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    coreMat,
    ...telegraph,
  };
}


