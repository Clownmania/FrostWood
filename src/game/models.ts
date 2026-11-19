import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  SkeletalAnimController,
  attachEquipmentToBone,
  findBoneByPattern,
  loadAnimationClipLibrary,
  loadGltfModelWithAnimations,
  prepareNormalizedGltfAsset,
} from './gltfLoader';
import {
  ANIMAL_MODEL_SPECS,
  BOSS_MODEL_SPECS,
  FISH_MODEL_SPECS,
  PLAYER_ANIMATION_PACK_URLS,
  PLAYER_MODEL_SPEC,
  ROAMING_MONSTER_SPECS,
  type ChibiNpcArchetype,
  type RoamingMonsterKind,
} from './characterRig';
import type { CityChibiNpcPbrMaterialSet } from './city';
import type {
  AnimalKind,
  AnimalRarity,
  BoulderKind,
  MythicAscensionId,
  PetSpeciesId,
  SecretChestRarity,
  TreeKind,
  ZoneBossId,
} from './types';
import type { FishSpeciesId } from './fishing';
import type { ProceduralTextureSet } from './textures';
import { PBR_SURFACE_PROFILES } from './pbrMaterials';
import { PET_SPECIES_SPECS } from './pets';
import { SPECIES_SPECS } from './wildlife';
import { getRarityColorHex } from './tracking';
import {
  REALISTIC_FISH_PROFILES,
  upgradeFishMaterialsWithSwimShader,
  type FishSwimShaderUniforms,
} from './fishVisuals';

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
  snowMat: THREE.MeshPhysicalMaterial;
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
  ironMat: THREE.MeshPhysicalMaterial;
  goldMat: THREE.MeshPhysicalMaterial;
  frostSteelMat: THREE.MeshPhysicalMaterial;
  iceMat: THREE.MeshPhysicalMaterial;
  warmWindowMat: THREE.MeshPhysicalMaterial;
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
  mythicMat: THREE.MeshPhysicalMaterial;
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
  warmGlowMat: THREE.MeshBasicMaterial;
  cyanGlowMat: THREE.MeshBasicMaterial;
}

export function createMaterialPalette(textures: ProceduralTextureSet): MaterialPalette {
  const pSnow = PBR_SURFACE_PROFILES.snow;
  const pIce = PBR_SURFACE_PROFILES.glacial_ice;
  const pIron = PBR_SURFACE_PROFILES.forged_iron;
  const pGold = PBR_SURFACE_PROFILES.burnished_gold;
  const pFrostSteel = PBR_SURFACE_PROFILES.frost_steel;
  const pWindow = PBR_SURFACE_PROFILES.glass_window;
  const pTimber = PBR_SURFACE_PROFILES.timber;
  const pStone = PBR_SURFACE_PROFILES.stone;
  const pAurora = PBR_SURFACE_PROFILES.aurora_crystal;
  const pMythic = PBR_SURFACE_PROFILES.mythic_alloy;

  return {
    snowMat: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.snowMap,
      normalMap: textures.snowNormal,
      normalScale: new THREE.Vector2(pSnow.normalScale, pSnow.normalScale),
      roughnessMap: textures.snowRoughness,
      roughness: pSnow.roughness,
      metalness: pSnow.metalness,
      ior: pSnow.ior,
      reflectivity: pSnow.reflectivity,
      clearcoat: pSnow.clearcoat,
      clearcoatRoughness: pSnow.clearcoatRoughness,
      clearcoatRoughnessMap: textures.snowClearcoatRoughness,
      clearcoatNormalMap: textures.snowMicroNormal,
      clearcoatNormalScale: new THREE.Vector2(
        pSnow.clearcoatNormalScale,
        pSnow.clearcoatNormalScale,
      ),
      sheen: pSnow.sheen,
      sheenRoughness: pSnow.sheenRoughness,
      sheenColor: new THREE.Color(pSnow.sheenColorHex),
      specularIntensity: pSnow.specularIntensity,
      specularColor: new THREE.Color(pSnow.specularColorHex),
      envMapIntensity: pSnow.envMapIntensity,
    }),
    pineNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x1b3d32,
      bumpMap: textures.barkBump,
      bumpScale: 0.04,
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.68,
    }),
    spruceNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x14302a,
      bumpMap: textures.barkBump,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.02,
      envMapIntensity: 0.65,
    }),
    elderNeedleMat: new THREE.MeshStandardMaterial({
      color: 0x224f46,
      bumpMap: textures.barkBump,
      bumpScale: 0.045,
      roughness: 0.76,
      metalness: 0.05,
      envMapIntensity: 0.76,
    }),
    barkMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.barkMap,
      normalMap: textures.barkNormal,
      normalScale: new THREE.Vector2(0.58, 0.58),
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.68,
    }),
    birchBarkMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.birchBarkMap,
      bumpMap: textures.birchBarkBump,
      bumpScale: 0.04,
      roughness: 0.82,
      metalness: 0.02,
      envMapIntensity: 0.72,
    }),
    logEndMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.logEndMap,
      bumpMap: textures.timberBump,
      bumpScale: 0.025,
      roughness: 0.78,
      metalness: 0.02,
      envMapIntensity: pTimber.envMapIntensity,
    }),
    timberMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.timberMap,
      normalMap: textures.timberNormal,
      normalScale: new THREE.Vector2(pTimber.normalScale, pTimber.normalScale),
      roughness: pTimber.roughness,
      metalness: pTimber.metalness,
      envMapIntensity: pTimber.envMapIntensity,
    }),
    darkWoodMat: new THREE.MeshStandardMaterial({
      color: 0x5c3c27,
      map: textures.timberMap,
      normalMap: textures.timberNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.78,
      metalness: 0.04,
      envMapIntensity: pTimber.envMapIntensity,
    }),
    stoneMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.stoneMap,
      normalMap: textures.stoneNormal,
      normalScale: new THREE.Vector2(pStone.normalScale, pStone.normalScale),
      roughness: pStone.roughness,
      metalness: pStone.metalness,
      envMapIntensity: pStone.envMapIntensity,
    }),
    rockMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.rockMap,
      normalMap: textures.rockNormal,
      normalScale: new THREE.Vector2(0.68, 0.68),
      roughness: 0.86,
      metalness: 0.05,
      envMapIntensity: pStone.envMapIntensity,
    }),
    ironMat: new THREE.MeshPhysicalMaterial({
      color: 0x7b8b9c,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(pIron.normalScale, pIron.normalScale),
      roughnessMap: textures.metalRoughness,
      roughness: pIron.roughness,
      metalness: pIron.metalness,
      anisotropy: pIron.anisotropy,
      clearcoat: pIron.clearcoat,
      clearcoatRoughness: pIron.clearcoatRoughness,
      reflectivity: pIron.reflectivity,
      specularIntensity: pIron.specularIntensity,
      specularColor: new THREE.Color(pIron.specularColorHex),
      envMapIntensity: pIron.envMapIntensity,
    }),
    goldMat: new THREE.MeshPhysicalMaterial({
      color: 0xf7c648,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(pGold.normalScale, pGold.normalScale),
      roughnessMap: textures.metalRoughness,
      roughness: pGold.roughness,
      metalness: pGold.metalness,
      anisotropy: pGold.anisotropy,
      clearcoat: pGold.clearcoat,
      clearcoatRoughness: pGold.clearcoatRoughness,
      reflectivity: pGold.reflectivity,
      specularIntensity: pGold.specularIntensity,
      specularColor: new THREE.Color(pGold.specularColorHex),
      envMapIntensity: pGold.envMapIntensity,
    }),
    frostSteelMat: new THREE.MeshPhysicalMaterial({
      color: 0x86e3ff,
      emissive: 0x1e6088,
      emissiveIntensity: 0.52,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(pFrostSteel.normalScale, pFrostSteel.normalScale),
      roughnessMap: textures.metalRoughness,
      roughness: pFrostSteel.roughness,
      metalness: pFrostSteel.metalness,
      anisotropy: pFrostSteel.anisotropy,
      clearcoat: pFrostSteel.clearcoat,
      clearcoatRoughness: pFrostSteel.clearcoatRoughness,
      clearcoatNormalMap: textures.iceMicroNormal,
      clearcoatNormalScale: new THREE.Vector2(
        pFrostSteel.clearcoatNormalScale,
        pFrostSteel.clearcoatNormalScale,
      ),
      iridescence: pFrostSteel.iridescence,
      iridescenceIOR: pFrostSteel.iridescenceIOR,
      reflectivity: pFrostSteel.reflectivity,
      specularIntensity: pFrostSteel.specularIntensity,
      specularColor: new THREE.Color(pFrostSteel.specularColorHex),
      envMapIntensity: pFrostSteel.envMapIntensity,
    }),
    iceMat: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.iceMap,
      normalMap: textures.iceNormal,
      normalScale: new THREE.Vector2(pIce.normalScale, pIce.normalScale),
      roughnessMap: textures.iceRoughness,
      emissive: 0x176aa8,
      emissiveIntensity: 0.48,
      roughness: pIce.roughness,
      metalness: pIce.metalness,
      ior: pIce.ior,
      clearcoat: pIce.clearcoat,
      clearcoatRoughness: pIce.clearcoatRoughness,
      clearcoatNormalMap: textures.iceMicroNormal,
      clearcoatNormalScale: new THREE.Vector2(
        pIce.clearcoatNormalScale,
        pIce.clearcoatNormalScale,
      ),
      iridescence: pIce.iridescence,
      iridescenceIOR: pIce.iridescenceIOR,
      reflectivity: pIce.reflectivity,
      specularIntensity: pIce.specularIntensity,
      specularColor: new THREE.Color(pIce.specularColorHex),
      envMapIntensity: pIce.envMapIntensity,
      transparent: true,
      opacity: 0.93,
    }),
    warmWindowMat: new THREE.MeshPhysicalMaterial({
      color: 0xffd78a,
      emissive: 0xff9b35,
      emissiveIntensity: 1.45,
      roughness: pWindow.roughness,
      metalness: pWindow.metalness,
      ior: pWindow.ior,
      clearcoat: pWindow.clearcoat,
      clearcoatRoughness: pWindow.clearcoatRoughness,
      reflectivity: pWindow.reflectivity,
      specularIntensity: pWindow.specularIntensity,
      specularColor: new THREE.Color(pWindow.specularColorHex),
      envMapIntensity: pWindow.envMapIntensity,
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
      normalMap: textures.iceNormal,
      normalScale: new THREE.Vector2(pAurora.normalScale, pAurora.normalScale),
      roughnessMap: textures.iceRoughness,
      emissive: 0xa855f7,
      emissiveIntensity: 1.02,
      roughness: pAurora.roughness,
      metalness: pAurora.metalness,
      ior: pAurora.ior,
      clearcoat: pAurora.clearcoat,
      clearcoatRoughness: pAurora.clearcoatRoughness,
      clearcoatNormalMap: textures.iceMicroNormal,
      clearcoatNormalScale: new THREE.Vector2(
        pAurora.clearcoatNormalScale,
        pAurora.clearcoatNormalScale,
      ),
      iridescence: pAurora.iridescence,
      iridescenceIOR: pAurora.iridescenceIOR,
      reflectivity: pAurora.reflectivity,
      specularIntensity: pAurora.specularIntensity,
      specularColor: new THREE.Color(pAurora.specularColorHex),
      envMapIntensity: pAurora.envMapIntensity,
      transparent: true,
      opacity: 0.92,
    }),
    mythicMat: new THREE.MeshPhysicalMaterial({
      color: 0xf4c4ff,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.62,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(pMythic.normalScale, pMythic.normalScale),
      roughnessMap: textures.metalRoughness,
      roughness: pMythic.roughness,
      metalness: pMythic.metalness,
      anisotropy: pMythic.anisotropy,
      clearcoat: pMythic.clearcoat,
      clearcoatRoughness: pMythic.clearcoatRoughness,
      iridescence: pMythic.iridescence,
      iridescenceIOR: pMythic.iridescenceIOR,
      reflectivity: pMythic.reflectivity,
      specularIntensity: pMythic.specularIntensity,
      specularColor: new THREE.Color(pMythic.specularColorHex),
      envMapIntensity: pMythic.envMapIntensity,
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
      opacity: 0.86,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    warmGlowMat: new THREE.MeshBasicMaterial({
      color: 0xff9d42,
      map: textures.warmGlowMap,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.22,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
    cyanGlowMat: new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      map: textures.warmGlowMap,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.18,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
  };
}

const UNIT_CONTACT_SHADOW_GEO = (() => {
  const geo = new THREE.PlaneGeometry(2, 2);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

function addContactShadow(
  parent: THREE.Group,
  mat: THREE.MeshBasicMaterial,
  radius: number,
  yOffset = 0.03,
): THREE.Mesh {
  const shadow = new THREE.Mesh(UNIT_CONTACT_SHADOW_GEO, mat);
  shadow.position.y = yOffset;
  shadow.scale.set(radius, 1, radius);
  parent.add(shadow);
  return shadow;
}

interface BakedPartSpec {
  geo: THREE.BufferGeometry;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

const _bakeDummy = new THREE.Object3D();

function bakeAndMergeGeometries(parts: BakedPartSpec[]): THREE.BufferGeometry {
  const normalized: THREE.BufferGeometry[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    _bakeDummy.position.set(p.px ?? 0, p.py ?? 0, p.pz ?? 0);
    _bakeDummy.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
    _bakeDummy.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
    _bakeDummy.updateMatrix();
    g.applyMatrix4(_bakeDummy.matrix);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const attrName of Object.keys(g.attributes)) {
      if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
        g.deleteAttribute(attrName);
      }
    }
    normalized.push(g);
    p.geo.dispose();
  }
  const merged = mergeGeometries(normalized, false);
  for (let i = 0; i < normalized.length; i++) {
    normalized[i].dispose();
  }
  return merged ?? new THREE.BufferGeometry();
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
  leftWrist?: THREE.Group;
  rightArm: THREE.Group;
  rightElbow: THREE.Group;
  rightWrist?: THREE.Group;
  axeGroup: THREE.Group;
  bowGroup: THREE.Group;
  rodGroup: THREE.Group;
  rodTipAnchor: THREE.Object3D;
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
  swimRippleGroup?: THREE.Group;
  contactShadowMesh?: THREE.Mesh;
  mixer?: THREE.AnimationMixer;
  skeletalAnim?: SkeletalAnimController;
  skeletalRightArmBone?: THREE.Object3D;
  skeletalLeftArmBone?: THREE.Object3D;
  gltfLod?: THREE.LOD;
  gltfReady?: boolean;
}

export interface ChibiNpcRigConfig {
  archetype: ChibiNpcArchetype;
  tintHex?: number;
  tintStrength?: number;
  attachWings?: boolean;
  scaleFactor?: number;
  pbrMaterialSet?: CityChibiNpcPbrMaterialSet;
}

export function createCharacterRig(
  palette: MaterialPalette,
  coatMat: THREE.MeshStandardMaterial,
  withWeapons = true,
  isPlayer = false,
  chibiNpcConfig?: ChibiNpcRigConfig,
): CharacterRig {
  const rigCoatMat = coatMat.clone();
  const rigTrimMat = palette.furTrimMat.clone();
  const rigBootMat = palette.bootLeatherMat.clone();
  const rigGloveMat = palette.bootLeatherMat.clone();
  const rigPackMat = palette.timberMat.clone();

  // Dedicated Barbarian materials inspired by KayKit Adventurers Barbarian
  const barbarianSkinMat = palette.skinMat.clone();
  const bearPeltMat = new THREE.MeshStandardMaterial({
    color: 0x6f5846,
    bumpMap: palette.furTrimMat.bumpMap,
    bumpScale: 0.04,
    roughness: 0.86,
    metalness: 0.02,
  });
  const bearSnoutMat = new THREE.MeshStandardMaterial({
    color: 0x8d735e,
    roughness: 0.82,
    metalness: 0.02,
  });
  const beardFurMat = new THREE.MeshStandardMaterial({
    color: 0x7b6a58,
    bumpMap: palette.furTrimMat.bumpMap,
    bumpScale: 0.045,
    roughness: 0.88,
    metalness: 0.02,
  });
  const beltHarnessMat = new THREE.MeshStandardMaterial({
    color: 0x8c4a27,
    roughness: 0.72,
    metalness: 0.08,
  });

  const group = new THREE.Group();
  const contactShadowMesh = addContactShadow(group, palette.contactShadowMat, 0.78);

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const rig: CharacterRig = {} as CharacterRig;
  rig.group = group;
  rig.contactShadowMesh = contactShadowMesh;

  // Asynchronous genuine rigged GLB player hero upgrade is attached right after
  // weapons & gear are constructed so equipment sockets directly onto skeleton bones.
  bodyGroup.visible = true;

  // Articulated 2-segment muscular winter legs (hip -> thigh -> knee -> fur-cuffed barbarian boot)
  const makeLeg = (x: number): { legPivot: THREE.Group; kneePivot: THREE.Group } => {
    const legPivot = new THREE.Group();
    legPivot.position.set(x, 0.6, 0);

    const hipCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.138, 12, 10),
      bearPeltMat,
    );
    hipCap.scale.set(1.04, 0.92, 1.04);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.116, 0.3, 14),
      bearPeltMat,
    );
    thigh.position.y = -0.15;
    thigh.castShadow = true;

    const kneeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.116, 12, 10),
      bearPeltMat,
    );
    kneeSphere.position.y = -0.3;

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.3, 0);

    const bootCuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.114, 0.046, 8, 16),
      rigTrimMat,
    );
    bootCuff.rotation.x = Math.PI / 2;
    bootCuff.position.y = -0.02;

    const bootShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.128, 0.19, 14),
      rigBootMat,
    );
    bootShaft.position.y = -0.12;
    bootShaft.castShadow = true;

    // Crossed leather boot bindings
    const bootStrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.018, 6, 14),
      beltHarnessMat,
    );
    bootStrap.rotation.x = Math.PI / 2;
    bootStrap.position.y = -0.12;

    const bootAnkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.116, 12, 10),
      rigBootMat,
    );
    bootAnkle.position.set(0, -0.21, 0.01);

    const bootFoot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.098, 0.155, 6, 12),
      rigBootMat,
    );
    bootFoot.rotation.x = Math.PI / 2;
    bootFoot.position.set(0, -0.22, 0.078);
    bootFoot.castShadow = true;

    const bootToeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 10, 8),
      palette.foxDarkMat,
    );
    bootToeCap.scale.set(1.04, 0.74, 1.08);
    bootToeCap.position.set(0, -0.23, 0.148);

    const bootSole = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.102, 0.175, 4, 10),
      palette.foxDarkMat,
    );
    bootSole.rotation.x = Math.PI / 2;
    bootSole.scale.set(1.06, 1.0, 0.46);
    bootSole.position.set(0, -0.275, 0.068);

    kneePivot.add(bootCuff, bootShaft, bootStrap, bootAnkle, bootFoot, bootToeCap, bootSole);
    legPivot.add(hipCap, thigh, kneeSphere, kneePivot);
    return { legPivot, kneePivot };
  };

  const leftLegBuilt = makeLeg(-0.18);
  const rightLegBuilt = makeLeg(0.18);
  const leftLeg = leftLegBuilt.legPivot;
  const leftKnee = leftLegBuilt.kneePivot;
  const rightLeg = rightLegBuilt.legPivot;
  const rightKnee = rightLegBuilt.kneePivot;
  bodyGroup.add(leftLeg, rightLeg);

  // Upper body torso pivot (allows sprint lean, crouch stealth, and axe cleave twist)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.56, 0);
  bodyGroup.add(torsoPivot);

  // Sculpted muscular Barbarian upper torso + waist loincloth kilt
  const barbarianTorsoProfile = [
    new THREE.Vector2(0.01, -0.06),
    new THREE.Vector2(0.39, -0.04),
    new THREE.Vector2(0.37, 0.18),
    new THREE.Vector2(0.34, 0.34),
    new THREE.Vector2(0.41, 0.62),
    new THREE.Vector2(0.38, 0.77),
    new THREE.Vector2(0.19, 0.84),
    new THREE.Vector2(0.01, 0.84),
  ];
  const torso = new THREE.Mesh(
    new THREE.LatheGeometry(barbarianTorsoProfile, 22),
    barbarianSkinMat,
  );
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoPivot.add(torso);

  // Sculpted pectoral chest plates & abdominal muscle definition
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 12, 10),
      barbarianSkinMat,
    );
    pec.scale.set(1.18, 0.78, 0.68);
    pec.position.set(side * 0.135, 0.58, 0.28);
    torsoPivot.add(pec);
  }

  // Fur-trimmed armored waist kilt (uses rigCoatMat so coat upgrades tint the barbarian harness/kilt)
  const kiltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.355, 0.405, 0.32, 20),
    rigCoatMat,
  );
  kiltMesh.position.y = 0.12;
  kiltMesh.castShadow = true;
  torsoPivot.add(kiltMesh);

  // Jagged white wolf-tooth fur trim above and below the leather war-belt (matching KayKit Barbarian)
  const furHemLower = new THREE.Mesh(
    new THREE.TorusGeometry(0.385, 0.045, 10, 24),
    rigTrimMat,
  );
  furHemLower.rotation.x = Math.PI / 2;
  furHemLower.position.y = -0.02;
  torsoPivot.add(furHemLower);

  const toothCount = 14;
  for (let i = 0; i < toothCount; i++) {
    const a = (i / toothCount) * Math.PI * 2;
    const toothTop = new THREE.Mesh(
      new THREE.ConeGeometry(0.052, 0.095, 4),
      rigTrimMat,
    );
    toothTop.position.set(Math.cos(a) * 0.355, 0.35, Math.sin(a) * 0.355);
    toothTop.rotation.y = -a;
    toothTop.rotation.x = 0.18;
    torsoPivot.add(toothTop);
  }

  // Diagonal leather baldric strap across chest (matching KayKit Barbarian)
  const baldricCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.26, 0.79, 0.22),
    new THREE.Vector3(-0.06, 0.56, 0.39),
    new THREE.Vector3(0.18, 0.32, 0.36),
    new THREE.Vector3(0.28, 0.28, 0.02),
    new THREE.Vector3(0.05, 0.56, -0.38),
    new THREE.Vector3(-0.24, 0.78, -0.2),
  ]);
  const baldricStrap = new THREE.Mesh(
    new THREE.TubeGeometry(baldricCurve, 20, 0.044, 8, false),
    beltHarnessMat,
  );
  baldricStrap.castShadow = true;
  torsoPivot.add(baldricStrap);

  // Tier 3+ chest clasp emblem on the diagonal baldric
  const auroraClaspMat = new THREE.MeshStandardMaterial({
    color: 0x7be0ff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.5,
  });
  const auroraClaspMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.062, 0),
    auroraClaspMat,
  );
  auroraClaspMesh.scale.set(0.95, 1.2, 0.6);
  auroraClaspMesh.position.set(-0.04, 0.58, 0.415);
  auroraClaspMesh.visible = false;
  torsoPivot.add(auroraClaspMesh);

  // Heavy studded leather war-belt + octagonal iron championship buckle + rivets
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.362, 0.375, 0.15, 20),
    beltHarnessMat,
  );
  belt.position.y = 0.24;
  belt.castShadow = true;

  const bucklePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.045, 8),
    palette.ironMat,
  );
  bucklePlate.rotation.x = Math.PI / 2;
  bucklePlate.position.set(0, 0.24, 0.368);

  const buckleRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.016, 6, 8),
    palette.goldMat,
  );
  buckleRim.position.set(0, 0.24, 0.378);

  for (const studAngle of [-0.95, -0.52, 0.52, 0.95, -2.2, 2.2]) {
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 8, 6),
      palette.ironMat,
    );
    stud.position.set(
      Math.sin(studAngle) * 0.368,
      0.24,
      Math.cos(studAngle) * 0.368,
    );
    torsoPivot.add(stud);
  }

  const pouch = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.085, 0.07, 4, 10),
    palette.timberMat,
  );
  pouch.scale.set(0.9, 1.05, 0.65);
  pouch.position.set(-0.36, 0.21, 0.14);
  pouch.rotation.z = 0.14;
  const pouchFlap = new THREE.Mesh(
    new THREE.SphereGeometry(0.078, 10, 8),
    palette.bootLeatherMat,
  );
  pouchFlap.scale.set(0.95, 0.55, 0.72);
  pouchFlap.position.set(-0.36, 0.27, 0.14);
  torsoPivot.add(belt, bucklePlate, buckleRim, pouch, pouchFlap);

  // Layered bear-pelt shoulder mantle with hanging front bear-paw claws (matching KayKit Barbarian)
  const furCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.095, 10, 24),
    bearPeltMat,
  );
  furCollar.rotation.x = Math.PI / 2;
  furCollar.position.y = 0.79;

  const backPeltCape = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
    bearPeltMat,
  );
  backPeltCape.scale.set(1.18, 0.85, 1.12);
  backPeltCape.rotation.x = -Math.PI * 0.44;
  backPeltCape.position.set(0, 0.76, -0.21);
  torsoPivot.add(furCollar, backPeltCape);

  // Hanging bear paws + ivory claws on front shoulders
  for (const side of [-1, 1]) {
    const pawPad = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 10, 8),
      bearPeltMat,
    );
    pawPad.scale.set(1.1, 0.75, 0.85);
    pawPad.position.set(side * 0.21, 0.73, 0.29);
    torsoPivot.add(pawPad);
    for (const cOff of [-0.026, 0, 0.026]) {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.014, 0.055, 5),
        palette.ivoryMat,
      );
      claw.rotation.x = Math.PI * 0.88;
      claw.position.set(side * 0.21 + cOff, 0.68, 0.33);
      torsoPivot.add(claw);
    }
  }

  // Expedition backpack + leather flap + brass clasp + rolled bedroll
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.48, -0.35);

  const pack = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.22, 6, 14),
    rigPackMat,
  );
  pack.scale.set(1.08, 0.96, 0.68);
  pack.castShadow = true;
  const packFlap = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.15, 0.11, 4, 12),
    palette.bootLeatherMat,
  );
  packFlap.rotation.z = Math.PI / 2;
  packFlap.scale.set(0.65, 1.0, 0.88);
  packFlap.position.set(0, 0.12, -0.01);
  const packBuckle = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.011, 6, 10),
    palette.goldMat,
  );
  packBuckle.position.set(0, 0.04, -0.13);
  const bedroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.098, 0.098, 0.44, 14),
    palette.canvasMat,
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.26, 0);
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

  // Articulated Sculpted Barbarian Head + Ferocious Bear-Pelt Hood (matching KayKit Barbarian)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.89, 0);
  torsoPivot.add(headGroup);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.225, 20, 18),
    barbarianSkinMat,
  );
  cranium.scale.set(1.04, 1.0, 1.02);
  cranium.position.y = 0.12;
  cranium.castShadow = true;

  // Sculpted barbarian ears
  for (const side of [-1, 1]) {
    const humanEar = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 10, 8),
      barbarianSkinMat,
    );
    humanEar.scale.set(0.55, 1.05, 0.75);
    humanEar.position.set(side * 0.225, 0.12, 0.02);
    headGroup.add(humanEar);
  }

  // Broad barbarian nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 10, 8),
    barbarianSkinMat,
  );
  nose.scale.set(1.18, 0.92, 1.25);
  nose.position.set(0, 0.105, 0.225);

  // Full sculpted grey-brown Barbarian beard + thick mustache + sideburns
  const chinBeard = new THREE.Mesh(
    new THREE.SphereGeometry(0.205, 16, 12, 0, Math.PI * 2, Math.PI * 0.36, Math.PI * 0.58),
    beardFurMat,
  );
  chinBeard.scale.set(1.08, 1.14, 1.06);
  chinBeard.position.set(0, 0.095, 0.045);

  for (const side of [-1, 1]) {
    const mustacheWing = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.085, 4, 8),
      beardFurMat,
    );
    mustacheWing.rotation.z = Math.PI / 2 + side * 0.28;
    mustacheWing.position.set(side * 0.058, 0.068, 0.215);

    const beardPoint = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.14, 6),
      beardFurMat,
    );
    beardPoint.rotation.x = Math.PI;
    beardPoint.position.set(side * 0.065, -0.05, 0.155);
    headGroup.add(mustacheWing, beardPoint);
  }

  // Expressive warrior eyes + heavy furrowed brows
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 8),
      palette.eyeGlintMat,
    );
    eyeSocket.scale.set(0.95, 1.1, 0.7);
    eyeSocket.position.set(side * 0.082, 0.145, 0.205);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 6, 6),
      palette.eyeCatchlightMat,
    );
    glint.position.set(side * 0.088, 0.154, 0.224);

    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.065, 4, 6),
      beardFurMat,
    );
    brow.rotation.z = Math.PI / 2 - side * 0.18;
    brow.position.set(side * 0.082, 0.188, 0.212);

    headGroup.add(eyeSocket, glint, brow);
  }

  // Sculpted KayKit Barbarian Bear-Pelt Hood & Snout Visor
  const bearCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.262, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.72),
    bearPeltMat,
  );
  bearCap.scale.set(1.05, 1.02, 1.08);
  bearCap.position.set(0, 0.2, -0.01);
  bearCap.castShadow = true;

  const bearMuzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 14, 10),
    bearSnoutMat,
  );
  bearMuzzle.scale.set(1.18, 0.68, 0.96);
  bearMuzzle.position.set(0, 0.255, 0.205);

  const bearNose = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 10, 8),
    palette.noseWetMat,
  );
  bearNose.scale.set(1.15, 0.85, 0.95);
  bearNose.position.set(0, 0.265, 0.315);

  // Bear hood angry brow ridges, dark bear eyes, and overhanging upper fangs
  for (const side of [-1, 1]) {
    const bearEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 8, 8),
      palette.noseWetMat,
    );
    bearEye.position.set(side * 0.125, 0.295, 0.215);

    const bearBrow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.08, 4, 8),
      bearPeltMat,
    );
    bearBrow.rotation.z = Math.PI / 2 - side * 0.28;
    bearBrow.position.set(side * 0.12, 0.335, 0.22);

    const bearFang = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, 0.075, 6),
      palette.ivoryMat,
    );
    bearFang.rotation.x = Math.PI * 0.94;
    bearFang.position.set(side * 0.078, 0.195, 0.255);

    headGroup.add(bearEye, bearBrow, bearFang);
  }

  const bearEarGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const bearEar = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 10, 8),
      bearPeltMat,
    );
    bearEar.scale.set(1.0, 1.05, 0.55);
    bearEar.position.set(side * 0.195, 0.39, -0.02);
    bearEar.rotation.z = -side * 0.28;

    const bearEarInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 8, 6),
      bearSnoutMat,
    );
    bearEarInner.scale.set(0.95, 0.95, 0.4);
    bearEarInner.position.set(side * 0.192, 0.388, 0.015);
    bearEarInner.rotation.z = -side * 0.28;
    bearEarGroup.add(bearEar, bearEarInner);
  }

  // Crimson diagonal battle scar across left side of bear hood & left eye (matching reference image)
  const hoodScar = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.014, 0.16, 4, 6),
    palette.coatRedMat,
  );
  hoodScar.rotation.z = -0.52;
  hoodScar.rotation.x = 0.38;
  hoodScar.position.set(-0.11, 0.36, 0.19);

  const faceScar = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.011, 0.11, 4, 6),
    palette.coatRedMat,
  );
  faceScar.rotation.z = -0.45;
  faceScar.position.set(-0.086, 0.16, 0.208);

  headGroup.add(
    cranium,
    nose,
    chinBeard,
    bearCap,
    bearMuzzle,
    bearNose,
    bearEarGroup,
    hoodScar,
    faceScar,
  );

  // Articulated 3-segment muscular Barbarian arms (shoulder -> bicep -> elbow -> bracer -> wrist -> hand)
  const makeArm = (
    x: number,
    isLeft: boolean,
  ): { armPivot: THREE.Group; elbowPivot: THREE.Group; wristPivot: THREE.Group } => {
    const armPivot = new THREE.Group();
    armPivot.position.set(x, 0.71, 0);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.126, 14, 12),
      barbarianSkinMat,
    );
    shoulder.castShadow = true;

    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.112, 0.098, 0.22, 14),
      barbarianSkinMat,
    );
    upperArm.position.y = -0.11;
    upperArm.castShadow = true;

    // Leather bicep band matching KayKit Barbarian
    const bicepBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.106, 0.02, 6, 14),
      beltHarnessMat,
    );
    bicepBand.rotation.x = Math.PI / 2;
    bicepBand.position.y = -0.09;

    const elbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.094, 12, 10),
      barbarianSkinMat,
    );
    elbowJoint.position.y = -0.22;

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.22, 0);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.096, 0.084, 0.2, 14),
      barbarianSkinMat,
    );
    forearm.position.y = -0.1;
    forearm.castShadow = true;

    // Studded leather barbarian bracer + white fur trim rings
    const bracerUpperTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.022, 6, 14),
      rigTrimMat,
    );
    bracerUpperTrim.rotation.x = Math.PI / 2;
    bracerUpperTrim.position.y = -0.055;

    const bracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.088, 0.13, 12),
      beltHarnessMat,
    );
    bracer.position.y = -0.12;
    bracer.castShadow = true;

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.086, 0.028, 8, 14),
      rigTrimMat,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.19;

    const wristPivot = new THREE.Group();
    wristPivot.position.set(0, -0.24, 0);

    const mitten = new THREE.Mesh(
      new THREE.SphereGeometry(0.088, 12, 10),
      barbarianSkinMat,
    );
    mitten.scale.set(0.96, 1.12, 1.06);
    mitten.position.y = -0.025;

    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.045, 4, 8),
      barbarianSkinMat,
    );
    thumb.position.set(isLeft ? 0.065 : -0.065, -0.01, 0.05);
    thumb.rotation.z = isLeft ? -0.45 : 0.45;
    thumb.rotation.x = 0.35;

    wristPivot.add(mitten, thumb);
    elbowPivot.add(forearm, bracerUpperTrim, bracer, cuff, wristPivot);
    armPivot.add(shoulder, upperArm, bicepBand, elbowJoint, elbowPivot);
    return { armPivot, elbowPivot, wristPivot };
  };

  const leftArmBuilt = makeArm(-0.42, true);
  const rightArmBuilt = makeArm(0.42, false);
  const leftArm = leftArmBuilt.armPivot;
  const leftElbow = leftArmBuilt.elbowPivot;
  const leftWrist = leftArmBuilt.wristPivot;
  const rightArm = rightArmBuilt.armPivot;
  const rightElbow = rightArmBuilt.elbowPivot;
  const rightWrist = rightArmBuilt.wristPivot;
  torsoPivot.add(leftArm, rightArm);

  // Weapons: Forged Bearded Nordic Barbarian War-Axe (right hand) & Recurve Hunter Bow (left hand)
  const axeHeadMat = palette.ironMat.clone();
  const axeRuneMat = new THREE.MeshStandardMaterial({
    color: 0x9cecff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.7,
  });
  const axeGroup = new THREE.Group();
  axeGroup.position.set(0, -0.025, 0.06);
  axeGroup.rotation.x = Math.PI / 2.25;

  const axeShaftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.2, 0.02),
    new THREE.Vector3(0, 0.08, 0),
    new THREE.Vector3(0, 0.44, -0.015),
    new THREE.Vector3(0, 0.76, 0.01),
  ]);
  const axeHandle = new THREE.Mesh(
    new THREE.TubeGeometry(axeShaftCurve, 16, 0.035, 10, false),
    palette.timberMat,
  );
  axeHandle.castShadow = true;

  const gripWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.041, 0.044, 0.26, 12),
    beltHarnessMat,
  );
  gripWrap.position.y = -0.02;

  // Iron reinforcing shaft collars matching the KayKit Barbarian axe
  for (const collarY of [0.16, 0.48, 0.56]) {
    const shaftCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.048, 10),
      palette.ironMat,
    );
    shaftCollar.position.set(0, collarY, 0);
    axeGroup.add(shaftCollar);
  }

  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 10, 8),
    palette.goldMat,
  );
  pommel.position.set(0, -0.205, 0.02);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -0.085);
  bladeShape.lineTo(0.34, -0.22);
  bladeShape.quadraticCurveTo(0.42, 0, 0.33, 0.19);
  bladeShape.lineTo(0, 0.105);
  bladeShape.closePath();
  const axeBladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.056,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  axeBladeGeo.translate(0, 0, -0.028);
  axeBladeGeo.rotateY(Math.PI / 2);
  const axeBlade = new THREE.Mesh(axeBladeGeo, axeHeadMat);
  axeBlade.position.set(0, 0.69, 0.025);
  axeBlade.castShadow = true;

  // Tier 4+ glowing forged rune inlay along axe beard
  const axeRuneMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.094, 0.015, 6, 16, Math.PI * 1.15),
    axeRuneMat,
  );
  axeRuneMesh.rotation.y = Math.PI / 2;
  axeRuneMesh.rotation.z = -Math.PI * 0.57;
  axeRuneMesh.position.set(0, 0.69, 0.175);
  axeRuneMesh.visible = false;

  const axePoll = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.052, 0.09, 4, 8),
    palette.ironMat,
  );
  axePoll.rotation.z = Math.PI / 2;
  axePoll.position.set(0, 0.69, -0.02);

  // Tier 3+ Twin-bitted rear battleaxe blade (mirrored crescent)
  const axeDoubleBitGeo = axeBladeGeo.clone();
  axeDoubleBitGeo.scale(0.88, 0.94, -0.9);
  const axeDoubleBitMesh = new THREE.Mesh(axeDoubleBitGeo, axeHeadMat);
  axeDoubleBitMesh.position.set(0, 0.69, -0.025);
  axeDoubleBitMesh.castShadow = true;
  axeDoubleBitMesh.visible = false;

  // Tier 5+ Halberd spear spike & winged crossguard at top of shaft
  const axeHalberdSpikeGroup = new THREE.Group();
  axeHalberdSpikeGroup.position.set(0, 0.79, 0.01);
  axeHalberdSpikeGroup.visible = false;
  const halberdSpike = new THREE.Mesh(
    new THREE.ConeGeometry(0.044, 0.29, 6),
    axeHeadMat,
  );
  halberdSpike.position.y = 0.145;
  const halberdCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.015, 6, 12),
    palette.goldMat,
  );
  halberdCollar.rotation.x = Math.PI / 2;
  axeHalberdSpikeGroup.add(halberdSpike, halberdCollar);

  // Tier 6+ Spinning Mythic Weapon Aura Halo around axe head
  const axeAuraHaloMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.013, 8, 24),
    axeRuneMat,
  );
  axeAuraHaloMesh.rotation.y = Math.PI / 2;
  axeAuraHaloMesh.position.set(0, 0.69, 0.04);
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
  bowGroup.position.set(0.02, -0.015, 0.02);
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
    new THREE.TubeGeometry(bowCurve, 26, 0.034, 10, false),
    bowLimbMat,
  );
  const bowGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.23, 10),
    beltHarnessMat,
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
  wingsGroup.position.set(0, 0.48, -0.38);
  wingsGroup.scale.setScalar(0.82);
  wingsGroup.visible = false;

  const wingCoreMat = new THREE.MeshStandardMaterial({
    color: 0xea8c1e,
    emissive: 0xd94e0f,
    emissiveIntensity: 0.48,
    roughness: 0.34,
    metalness: 0.42,
  });
  const wingFeatherMat = new THREE.MeshStandardMaterial({
    color: 0xd9381e,
    emissive: 0x9e1b32,
    emissiveIntensity: 0.38,
    roughness: 0.36,
    metalness: 0.24,
  });
  const wingTipMat = new THREE.MeshStandardMaterial({
    color: 0xf7b93e,
    emissive: 0xd97706,
    emissiveIntensity: 0.56,
    roughness: 0.28,
    metalness: 0.32,
  });
  const wingVeilMat = new THREE.MeshBasicMaterial({
    color: 0xea580c,
    transparent: true,
    opacity: 0.18,
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
    pivot.position.set(side * 0.25, -0.02, -0.06);

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
    new THREE.TorusGeometry(0.32, 0.013, 10, 36),
    wingTipMat,
  );
  wingsHaloMesh.position.set(0, 0.14, -0.18);
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
  gearOrbitMotesGroup.position.y = 0.86;
  for (let m = 0; m < 4; m++) {
    const a = (m / 4) * Math.PI * 2;
    const mote = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.036, 1),
      m % 2 === 0 ? auroraClaspMat : wingTipMat,
    );
    mote.position.set(Math.cos(a) * 0.78, (m % 2) * 0.12 - 0.06, Math.sin(a) * 0.78);
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

  // Mythic Ascension Visual Panoply (Fire, Frost, Lightning, Poison, Dark Matter)
  const mythicCrownGroup = new THREE.Group();
  mythicCrownGroup.name = 'mythicCrownGroup';
  mythicCrownGroup.visible = false;
  headGroup.add(mythicCrownGroup);

  const mythicAscensionGroup = new THREE.Group();
  mythicAscensionGroup.name = 'mythicAscensionGroup';
  mythicAscensionGroup.visible = false;
  torsoPivot.add(mythicAscensionGroup);

  // Dark Matter / Elemental Back Halo & Singularity Core
  const mythicBackRiftGroup = new THREE.Group();
  mythicBackRiftGroup.name = 'mythicBackRiftGroup';
  mythicBackRiftGroup.position.set(0, 0.72, -0.44);
  mythicAscensionGroup.add(mythicBackRiftGroup);

  const singularityCoreMat = new THREE.MeshStandardMaterial({
    color: 0x090414,
    emissive: 0x6b21a8,
    emissiveIntensity: 1.4,
    roughness: 0.08,
    metalness: 0.95,
  });
  const singularityCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 20, 16),
    singularityCoreMat,
  );
  singularityCore.name = 'singularityCore';
  mythicBackRiftGroup.add(singularityCore);

  const accretionDiskMat = new THREE.MeshStandardMaterial({
    color: 0xf0abfc,
    emissive: 0xd946ef,
    emissiveIntensity: 2.1,
    roughness: 0.14,
    metalness: 0.6,
  });
  const accretionDisk = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.032, 10, 36),
    accretionDiskMat,
  );
  accretionDisk.name = 'accretionDisk';
  accretionDisk.rotation.x = Math.PI * 0.34;
  mythicBackRiftGroup.add(accretionDisk);

  const outerHorizonRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.014, 8, 36),
    accretionDiskMat,
  );
  outerHorizonRing.name = 'outerHorizonRing';
  outerHorizonRing.rotation.y = Math.PI * 0.18;
  mythicBackRiftGroup.add(outerHorizonRing);

  // Orbiting Elemental / Dark-Matter Spheres & Runic Shards
  const mythicOrbitGroup = new THREE.Group();
  mythicOrbitGroup.name = 'mythicOrbitGroup';
  mythicOrbitGroup.position.set(0, 0.56, 0);
  mythicAscensionGroup.add(mythicOrbitGroup);

  const orbitPrimaryMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.9,
    roughness: 0.15,
    metalness: 0.45,
  });
  const orbitSecondaryMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0.5,
  });

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const orbGroup = new THREE.Group();
    orbGroup.position.set(Math.cos(angle) * 0.86, (i % 2 === 0 ? 0.14 : -0.12), Math.sin(angle) * 0.86);
    const orbCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.082, 1),
      i % 2 === 0 ? orbitPrimaryMat : orbitSecondaryMat,
    );
    const orbRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.125, 0.012, 6, 16),
      i % 2 === 0 ? orbitSecondaryMat : orbitPrimaryMat,
    );
    orbRing.rotation.x = Math.PI / 3;
    orbGroup.add(orbCore, orbRing);
    mythicOrbitGroup.add(orbGroup);
  }

  // Crackling 3D Lightning / Energy Arcs around torso & shoulders
  const mythicLightningGroup = new THREE.Group();
  mythicLightningGroup.name = 'mythicLightningGroup';
  mythicAscensionGroup.add(mythicLightningGroup);
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + 0.4;
    const boltPts = [
      new THREE.Vector3(Math.cos(a) * 0.36, 0.15, Math.sin(a) * 0.36),
      new THREE.Vector3(Math.cos(a + 0.35) * 0.52, 0.42, Math.sin(a + 0.35) * 0.52),
      new THREE.Vector3(Math.cos(a - 0.2) * 0.46, 0.68, Math.sin(a - 0.2) * 0.46),
      new THREE.Vector3(Math.cos(a + 0.25) * 0.38, 0.92, Math.sin(a + 0.25) * 0.38),
    ];
    const boltCurve = new THREE.CatmullRomCurve3(boltPts);
    const boltMesh = new THREE.Mesh(
      new THREE.TubeGeometry(boltCurve, 12, 0.015, 6, false),
      orbitSecondaryMat,
    );
    mythicLightningGroup.add(boltMesh);
  }

  // Mythic Horned Sovereign Crown on headGroup
  for (const side of [-1, 1] as const) {
    const hornPts = [
      new THREE.Vector3(side * 0.2, 0.28, 0.04),
      new THREE.Vector3(side * 0.36, 0.44, 0.06),
      new THREE.Vector3(side * 0.42, 0.64, -0.04),
      new THREE.Vector3(side * 0.28, 0.82, -0.12),
    ];
    const hornMesh = new THREE.Mesh(
      createTaperedCurveGeometry(hornPts, 0.048, 0.012, 8, 12),
      orbitPrimaryMat,
    );
    mythicCrownGroup.add(hornMesh);
  }
  const crownCenterSpire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    orbitSecondaryMat,
  );
  crownCenterSpire.scale.set(0.75, 1.65, 0.65);
  crownCenterSpire.position.set(0, 0.48, 0.22);
  mythicCrownGroup.add(crownCenterSpire);

  rig.group.userData.mythicMaterials = {
    singularityCoreMat,
    accretionDiskMat,
    orbitPrimaryMat,
    orbitSecondaryMat,
    mythicAscensionGroup,
    mythicBackRiftGroup,
    mythicOrbitGroup,
    mythicLightningGroup,
    mythicCrownGroup,
    singularityCore,
    accretionDisk,
    outerHorizonRing,
  };

  // 3D Glacial Fishing Rod attached to right wrist
  const rodGroup = new THREE.Group();
  rodGroup.position.set(0.01, -0.04, 0.02);
  rodGroup.rotation.x = Math.PI * 0.36;
  rodGroup.visible = false;

  const rodHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.036, 0.42, 10),
    beltHarnessMat,
  );
  rodHandle.position.y = 0.05;

  const rodReelWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.038, 12),
    palette.goldMat,
  );
  rodReelWheel.rotation.z = Math.PI / 2;
  rodReelWheel.position.set(0.035, 0.14, 0.045);

  const rodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(0, 0.78, 0.02),
    new THREE.Vector3(0, 1.32, 0.08),
    new THREE.Vector3(0, 1.78, 0.18),
  ]);
  const rodShaft = new THREE.Mesh(
    new THREE.TubeGeometry(rodCurve, 18, 0.014, 8, false),
    palette.timberMat,
  );
  rodShaft.castShadow = true;

  for (const [gy, gz] of [
    [0.65, 0.03],
    [1.1, 0.07],
    [1.5, 0.13],
  ]) {
    const eyeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.005, 6, 12),
      palette.goldMat,
    );
    eyeRing.position.set(0, gy, gz + 0.02);
    rodGroup.add(eyeRing);
  }

  const rodTipGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.032, 0),
    bowCrystalMat,
  );
  rodTipGem.position.set(0, 1.78, 0.18);

  const rodTipAnchor = new THREE.Object3D();
  rodTipAnchor.position.set(0, 1.8, 0.19);
  rodGroup.add(rodHandle, rodReelWheel, rodShaft, rodTipGem, rodTipAnchor);

  if (withWeapons) {
    rightWrist.add(axeGroup);
    rightWrist.add(rodGroup);
    leftWrist.add(bowGroup);
  }

  // Upgrade player character with restored chibi KayKit Barbarian GLB + 6-pack skeletal animations
  if (isPlayer) {
    const isChibiBarbarian = PLAYER_MODEL_SPEC.url.includes('Barbarian');
    Promise.all([
      loadGltfModelWithAnimations(PLAYER_MODEL_SPEC.url),
      isChibiBarbarian
        ? loadAnimationClipLibrary(PLAYER_ANIMATION_PACK_URLS)
        : Promise.resolve([] as THREE.AnimationClip[]),
    ])
      .then(([loaded, extraClips]) => {
        const prepared = prepareNormalizedGltfAsset(loaded.scene, PLAYER_MODEL_SPEC, {
          furBumpMap: palette.furTrimMat.bumpMap,
          envMapIntensity: 0.96,
        });

        // Hide procedural body limbs/torso & oversized pauldrons cleanly
        leftLeg.visible = false;
        rightLeg.visible = false;
        torsoPivot.visible = false;
        pauldronsGroup.visible = false;

        bodyGroup.add(prepared.lod);
        bodyGroup.updateMatrixWorld(true);
        rig.gltfLod = prepared.lod;
        rig.gltfReady = true;

        // Attach dynamic equipment directly onto skeletal bones (prioritizing KayKit handslot.r/l, chest, head)
        const rightHandBone = findBoneByPattern(loaded.scene, [
          'handslot.r',
          'hand.r',
          'wrist.r',
          'middlehand.r',
          'palm.r',
        ]);
        const leftHandBone = findBoneByPattern(loaded.scene, [
          'handslot.l',
          'hand.l',
          'wrist.l',
          'middlehand.l',
          'palm.l',
        ]);
        const rightArmBone = findBoneByPattern(loaded.scene, ['upperarm01.r', 'upperarm.r']);
        const leftArmBone = findBoneByPattern(loaded.scene, ['upperarm01.l', 'upperarm.l']);
        const chestBone = findBoneByPattern(loaded.scene, ['chest', 'spine03', 'torso', 'spine']);
        const headBone = findBoneByPattern(loaded.scene, ['head']);

        // Only apply fallback additive arm overrides when the rig lacks dedicated KayKit combat/tool clips
        if (!isChibiBarbarian) {
          if (rightArmBone) rig.skeletalRightArmBone = rightArmBone;
          if (leftArmBone) rig.skeletalLeftArmBone = leftArmBone;
        }

        if (withWeapons && rightHandBone) {
          attachEquipmentToBone(
            rightHandBone,
            axeGroup,
            isChibiBarbarian ? [-0.08, 0.02, 0.08] : [-0.03, -0.06, 0.08],
            isChibiBarbarian
              ? [Math.PI * 0.24, -0.24, -0.34]
              : [Math.PI * 0.28, -Math.PI * 0.2, -Math.PI * 0.18],
            isChibiBarbarian ? 1.16 : 1.18,
          );
          attachEquipmentToBone(
            rightHandBone,
            rodGroup,
            isChibiBarbarian ? [-0.04, 0.02, 0.06] : [-0.02, -0.04, 0.08],
            isChibiBarbarian ? [Math.PI * 0.36, 0, -0.1] : [Math.PI * 0.35, 0, 0],
            1.04,
          );
        }
        if (withWeapons && leftHandBone) {
          attachEquipmentToBone(
            leftHandBone,
            bowGroup,
            isChibiBarbarian ? [0.09, 0.02, 0.08] : [0.03, -0.05, 0.08],
            isChibiBarbarian
              ? [0.08, Math.PI * 0.22, 0.14]
              : [Math.PI * 0.12, Math.PI * 0.18, Math.PI * 0.08],
            isChibiBarbarian ? 1.12 : 1.12,
          );
        }
        if (chestBone) {
          attachEquipmentToBone(
            chestBone,
            backpackGroup,
            isChibiBarbarian ? [0, -0.04, -0.44] : [0, 0.06, -0.22],
            [0, 0, 0],
            isChibiBarbarian ? 0.84 : 0.92,
          );
          attachEquipmentToBone(
            chestBone,
            quiverGroup,
            isChibiBarbarian ? [0.24, 0.04, -0.38] : [0.19, 0.1, -0.19],
            [0, 0, 0],
            0.88,
          );
          attachEquipmentToBone(
            chestBone,
            wingsGroup,
            isChibiBarbarian ? [0, 0.1, -0.4] : [0, 0.14, -0.24],
            [0, 0, 0],
            0.96,
          );
          attachEquipmentToBone(
            chestBone,
            mythicAscensionGroup,
            [0, -0.08, 0],
            [0, 0, 0],
            0.95,
          );
        }
        if (headBone) {
          attachEquipmentToBone(
            headBone,
            mythicCrownGroup,
            isChibiBarbarian ? [0, 0.56, 0] : [0, 0.14, 0],
            [0, 0, 0],
            0.92,
          );
        }

        const allClips = [...loaded.animations, ...extraClips];
        const animCtrl = new SkeletalAnimController(loaded.scene, allClips, prepared.meshes);
        animCtrl.setState('idle', { fadeDuration: 0 });
        rig.skeletalAnim = animCtrl;
        rig.mixer = animCtrl.mixer;
      })
      .catch((err) => {
        console.warn('Failed to load rigged player GLB, using procedural fallback:', err);
      });
  } else if (chibiNpcConfig) {
    const { archetype, tintHex, tintStrength, attachWings, scaleFactor, pbrMaterialSet } =
      chibiNpcConfig;
    const effectiveTintHex = pbrMaterialSet?.albedoTintHex ?? tintHex ?? archetype.spec.tintHex;
    const effectiveTintStrength =
      pbrMaterialSet?.tintStrength ??
      (tintHex !== undefined ? (tintStrength ?? 0.22) : archetype.spec.tintStrength);
    const npcSpec = {
      ...archetype.spec,
      targetHeight: archetype.spec.targetHeight * (scaleFactor ?? 1.0),
      tintHex: effectiveTintHex,
      tintStrength: effectiveTintStrength,
      roughnessMin: pbrMaterialSet?.roughnessMin ?? archetype.spec.roughnessMin,
      roughnessMax: pbrMaterialSet?.roughnessMax ?? archetype.spec.roughnessMax,
      metalnessMax: pbrMaterialSet?.metalnessMax ?? archetype.spec.metalnessMax,
      emissiveHex: pbrMaterialSet?.emissiveHex ?? archetype.spec.emissiveHex,
      emissiveIntensity: pbrMaterialSet?.emissiveIntensity ?? archetype.spec.emissiveIntensity,
    };
    Promise.all([
      loadGltfModelWithAnimations(npcSpec.url),
      archetype.hasEmbeddedAnimations
        ? Promise.resolve([] as THREE.AnimationClip[])
        : loadAnimationClipLibrary(PLAYER_ANIMATION_PACK_URLS),
    ])
      .then(([loaded, extraClips]) => {
        const prepared = prepareNormalizedGltfAsset(loaded.scene, npcSpec, {
          furBumpMap: palette.furTrimMat.bumpMap,
          envMapIntensity: pbrMaterialSet?.envMapIntensity ?? 0.94,
          hideMeshNames: archetype.hideMeshNames,
        });

        // Upgrade chibi NPC meshes with the assigned varied PBR clearcoat/sheen material set
        if (pbrMaterialSet && (pbrMaterialSet.clearcoat > 0 || pbrMaterialSet.sheen > 0)) {
          const sheenColor = new THREE.Color(pbrMaterialSet.sheenColorHex);
          for (const mesh of prepared.meshes) {
            const upgradeMat = (m: THREE.Material): THREE.Material => {
              if (!(m instanceof THREE.MeshStandardMaterial)) return m;
              const phys = new THREE.MeshPhysicalMaterial({
                name: m.name,
                color: m.color.clone(),
                map: m.map,
                normalMap: m.normalMap,
                normalScale: m.normalScale.clone(),
                bumpMap: m.bumpMap,
                bumpScale: m.bumpScale,
                roughnessMap: m.roughnessMap,
                metalnessMap: m.metalnessMap,
                aoMap: m.aoMap,
                aoMapIntensity: m.aoMapIntensity,
                emissive: m.emissive.clone(),
                emissiveMap: m.emissiveMap,
                emissiveIntensity: m.emissiveIntensity,
                roughness: m.roughness,
                metalness: m.metalness,
                envMapIntensity: pbrMaterialSet.envMapIntensity,
                clearcoat: pbrMaterialSet.clearcoat,
                clearcoatRoughness: pbrMaterialSet.clearcoatRoughness,
                sheen: pbrMaterialSet.sheen,
                sheenRoughness: 0.65,
                sheenColor,
                transparent: m.transparent,
                opacity: m.opacity,
                alphaTest: m.alphaTest,
                side: m.side,
              });
              m.dispose();
              return phys;
            };
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(upgradeMat);
            } else {
              mesh.material = upgradeMat(mesh.material);
            }
          }
        }

        // Cleanly hide & detach procedural fallback body so only the genuine chibi GLB renders
        leftLeg.visible = false;
        rightLeg.visible = false;
        torsoPivot.visible = false;
        pauldronsGroup.visible = false;
        bodyGroup.remove(leftLeg, rightLeg, torsoPivot);

        bodyGroup.add(prepared.lod);
        bodyGroup.updateMatrixWorld(true);
        rig.gltfLod = prepared.lod;
        rig.gltfReady = true;

        // Socket blazing wings onto the chibi chest bone when requested (e.g. Valkyra Emberwing)
        if (attachWings) {
          const chestBone = findBoneByPattern(loaded.scene, ['chest', 'spine03', 'torso', 'spine']);
          if (chestBone) {
            attachEquipmentToBone(
              chestBone,
              wingsGroup,
              [0, 0.12, -0.38],
              [0, 0, 0],
              0.96,
            );
          }
        }

        const allClips = [...loaded.animations, ...extraClips];
        const animCtrl = new SkeletalAnimController(loaded.scene, allClips, prepared.meshes);
        animCtrl.setState('idle', { fadeDuration: 0 });
        rig.skeletalAnim = animCtrl;
        rig.mixer = animCtrl.mixer;
      })
      .catch((err) => {
        console.warn(`Failed to load chibi NPC GLB (${archetype.id}):`, err);
      });
  }

  // 3D Water Surface Swim Ripple & Foam Wake Rings (shown when player is swimming in a lake)
  const swimRippleGroup = new THREE.Group();
  swimRippleGroup.position.set(0, 0.04, 0);
  swimRippleGroup.visible = false;

  const swimInnerRingMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const swimInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.56, 32),
    swimInnerRingMat,
  );
  swimInnerRing.rotation.x = -Math.PI / 2;
  swimInnerRing.name = 'swimInnerRing';

  const swimOuterRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const swimOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.82, 32),
    swimOuterRingMat,
  );
  swimOuterRing.rotation.x = -Math.PI / 2;
  swimOuterRing.name = 'swimOuterRing';

  swimRippleGroup.add(swimInnerRing, swimOuterRing);
  group.add(swimRippleGroup);

  Object.assign(rig, {
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
    leftWrist,
    rightArm,
    rightElbow,
    rightWrist,
    axeGroup,
    bowGroup,
    rodGroup,
    rodTipAnchor,
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
    swimRippleGroup,
    contactShadowMesh,
  });

  return rig;
}

/**
 * Updates 3D weapon tier geometry/scale/aura, shoulder pauldrons, gear & item orbiting aura,
 * articulated 3D Wings of Fire, and Mythic Elemental / Dark Matter Ascensions on a CharacterRig.
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
    equippedAscension?: MythicAscensionId | null;
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
    equippedAscension = null,
    time,
    moveSpeedRatio = 0,
  } = params;

  const activeWings = wingsTier > 0 && wingsEquipped;
  const hasAscension = Boolean(equippedAscension);

  // Progressive Axe shape & aura (Levels 1..7, supercharged when a Mythic Ascension is equipped)
  const effectiveAxeLevel = hasAscension ? Math.max(axeLevel, 7) : axeLevel;
  const axeScale = 1 + Math.max(0, effectiveAxeLevel - 1) * 0.085 + (hasAscension ? 0.12 : 0);
  rig.axeGroup.scale.setScalar(axeScale);
  rig.axeDoubleBitMesh.visible = effectiveAxeLevel >= 3;
  rig.axeRuneMesh.visible = effectiveAxeLevel >= 4;
  rig.axeHalberdSpikeGroup.visible = effectiveAxeLevel >= 5;
  rig.axeAuraHaloMesh.visible = effectiveAxeLevel >= 6;
  if (effectiveAxeLevel >= 6) {
    rig.axeAuraHaloMesh.rotation.x = time * (hasAscension ? 4.2 : 2.8);
    const s = 1 + Math.sin(time * 5.2) * 0.08 + (effectiveAxeLevel >= 7 ? 0.22 : 0);
    rig.axeAuraHaloMesh.scale.setScalar(s);
  }

  // Progressive Bow shape & aura (Levels 1..7, supercharged when a Mythic Ascension is equipped)
  const effectiveBowLevel = hasAscension ? Math.max(bowLevel, 7) : bowLevel;
  const bowScale = 1 + Math.max(0, effectiveBowLevel - 1) * 0.075 + (hasAscension ? 0.12 : 0);
  rig.bowGroup.scale.setScalar(bowScale);
  rig.bowCompoundCamsGroup.visible = effectiveBowLevel >= 3;
  rig.bowCrystalGroup.visible = effectiveBowLevel >= 4;
  rig.bowWingBladesGroup.visible = effectiveBowLevel >= 5;
  rig.bowAuraHaloMesh.visible = effectiveBowLevel >= 6;
  if (effectiveBowLevel >= 6) {
    rig.bowAuraHaloMesh.rotation.z = -time * (hasAscension ? 3.8 : 2.6);
    const s = 1 + Math.cos(time * 4.8) * 0.08 + (effectiveBowLevel >= 7 ? 0.2 : 0);
    rig.bowAuraHaloMesh.scale.setScalar(s);
  }

  // Mythic Elemental & Dark Matter Ascension Panoply Visuals
  const mythicRefs = rig.group.userData.mythicMaterials as
    | {
        singularityCoreMat: THREE.MeshStandardMaterial;
        accretionDiskMat: THREE.MeshStandardMaterial;
        orbitPrimaryMat: THREE.MeshStandardMaterial;
        orbitSecondaryMat: THREE.MeshStandardMaterial;
        mythicAscensionGroup: THREE.Group;
        mythicBackRiftGroup: THREE.Group;
        mythicOrbitGroup: THREE.Group;
        mythicLightningGroup: THREE.Group;
        mythicCrownGroup: THREE.Group;
        singularityCore: THREE.Mesh;
        accretionDisk: THREE.Mesh;
        outerHorizonRing: THREE.Mesh;
      }
    | undefined;

  let ascensionAuraHex = 0x38bdf8;
  if (mythicRefs) {
    mythicRefs.mythicAscensionGroup.visible = hasAscension;
    mythicRefs.mythicCrownGroup.visible = hasAscension;

    if (equippedAscension) {
      let primaryHex = 0xf97316;
      let secondaryHex = 0xfef08a;
      let coreColorHex = 0x1c0a04;
      let weaponBladeHex = 0x2b1208;
      let coatTintHex = 0x7c2d12;
      let trimTintHex = 0xfdba74;

      if (equippedAscension === 'infernal_fire') {
        primaryHex = 0xf97316;
        secondaryHex = 0xef4444;
        coreColorHex = 0x450a0a;
        weaponBladeHex = 0x431407;
        coatTintHex = 0x7c2d12;
        trimTintHex = 0xfdba74;
        ascensionAuraHex = 0xf97316;
      } else if (equippedAscension === 'glacial_frost') {
        primaryHex = 0x38bdf8;
        secondaryHex = 0xe0f2fe;
        coreColorHex = 0x082f49;
        weaponBladeHex = 0xbae6fd;
        coatTintHex = 0x0c4a6e;
        trimTintHex = 0xe0f2fe;
        ascensionAuraHex = 0x38bdf8;
      } else if (equippedAscension === 'thunder_lightning') {
        primaryHex = 0x22d3ee;
        secondaryHex = 0xfacc15;
        coreColorHex = 0x1e1b4b;
        weaponBladeHex = 0x164e63;
        coatTintHex = 0x1e3a8a;
        trimTintHex = 0xfef08a;
        ascensionAuraHex = 0x22d3ee;
      } else if (equippedAscension === 'venom_poison') {
        primaryHex = 0x22c55e;
        secondaryHex = 0xa3e635;
        coreColorHex = 0x052e16;
        weaponBladeHex = 0x14532d;
        coatTintHex = 0x064e3b;
        trimTintHex = 0x86efac;
        ascensionAuraHex = 0x22c55e;
      } else if (equippedAscension === 'dark_matter') {
        primaryHex = 0xd946ef;
        secondaryHex = 0xa855f7;
        coreColorHex = 0x05020a;
        weaponBladeHex = 0x130724;
        coatTintHex = 0x2e1065;
        trimTintHex = 0xf0abfc;
        ascensionAuraHex = 0xd946ef;
      }

      const pulse = 1.45 + Math.sin(time * 5.2) * 0.45;
      mythicRefs.orbitPrimaryMat.color.setHex(primaryHex);
      mythicRefs.orbitPrimaryMat.emissive.setHex(primaryHex);
      mythicRefs.orbitPrimaryMat.emissiveIntensity = pulse;

      mythicRefs.orbitSecondaryMat.color.setHex(secondaryHex);
      mythicRefs.orbitSecondaryMat.emissive.setHex(secondaryHex);
      mythicRefs.orbitSecondaryMat.emissiveIntensity = pulse * 1.1;

      mythicRefs.singularityCoreMat.color.setHex(coreColorHex);
      mythicRefs.singularityCoreMat.emissive.setHex(
        equippedAscension === 'dark_matter' ? 0x581c87 : primaryHex,
      );
      mythicRefs.singularityCoreMat.emissiveIntensity =
        equippedAscension === 'dark_matter' ? 0.95 : 1.5;

      mythicRefs.accretionDiskMat.color.setHex(secondaryHex);
      mythicRefs.accretionDiskMat.emissive.setHex(primaryHex);
      mythicRefs.accretionDiskMat.emissiveIntensity = pulse * 1.25;

      // Transform Weapon Blades, Runes, Bow Crystals & Slash Arc to Mythic Element
      rig.axeHeadMat.color.setHex(weaponBladeHex);
      rig.axeHeadMat.emissive.setHex(primaryHex);
      rig.axeHeadMat.emissiveIntensity = 0.55 + Math.sin(time * 4.5) * 0.2;
      rig.axeRuneMat.color.setHex(secondaryHex);
      rig.axeRuneMat.emissive.setHex(primaryHex);
      rig.axeRuneMat.emissiveIntensity = 1.85;

      rig.bowLimbMat.color.setHex(weaponBladeHex);
      rig.bowLimbMat.emissive.setHex(primaryHex);
      rig.bowLimbMat.emissiveIntensity = 0.45;
      rig.bowCrystalMat.color.setHex(secondaryHex);
      rig.bowCrystalMat.emissive.setHex(primaryHex);
      rig.bowCrystalMat.emissiveIntensity = 1.9;

      rig.slashArcMat.color.setHex(primaryHex);
      rig.auroraClaspMesh.visible = true;
      rig.auroraClaspMat.color.setHex(secondaryHex);
      rig.auroraClaspMat.emissive.setHex(primaryHex);
      rig.auroraClaspMat.emissiveIntensity = 1.8;

      rig.coatMat.color.setHex(coatTintHex);
      rig.trimMat.color.setHex(trimTintHex);

      // Animate Back Singularity / Elemental Core & Accretion Rings
      mythicRefs.mythicBackRiftGroup.visible = true;
      const coreScale =
        (equippedAscension === 'dark_matter' ? 1.32 : 0.92) +
        Math.sin(time * 4.2) * 0.08;
      mythicRefs.singularityCore.scale.setScalar(coreScale);
      mythicRefs.accretionDisk.rotation.z = time * 3.4;
      mythicRefs.accretionDisk.rotation.x = Math.PI * 0.34 + Math.sin(time * 1.8) * 0.16;
      mythicRefs.outerHorizonRing.rotation.x = -time * 2.5;
      mythicRefs.outerHorizonRing.rotation.y = time * 1.9;

      // Animate Orbiting Elemental / Dark Matter Spheres
      mythicRefs.mythicOrbitGroup.rotation.y = time * 2.6;
      mythicRefs.mythicOrbitGroup.position.y = 0.56 + Math.sin(time * 3.1) * 0.08;
      for (let idx = 0; idx < mythicRefs.mythicOrbitGroup.children.length; idx++) {
        const orb = mythicRefs.mythicOrbitGroup.children[idx];
        orb.rotation.x = time * 3.2 + idx;
        orb.rotation.y = time * 2.4 - idx;
      }

      // Crackling Lightning / Energy Bolts (always active for lightning & dark_matter, pulsing on others)
      mythicRefs.mythicLightningGroup.visible =
        equippedAscension === 'thunder_lightning' ||
        equippedAscension === 'dark_matter' ||
        equippedAscension === 'infernal_fire';
      mythicRefs.mythicLightningGroup.rotation.y = -time * 4.5;
      const boltScale = 0.92 + Math.sin(time * 18) * 0.12;
      mythicRefs.mythicLightningGroup.scale.setScalar(boltScale);
    }
  }

  // Shoulder pauldrons & Gear/Item visual aura progression
  rig.pauldronsGroup.visible = !rig.gltfReady && (gearAvgTier >= 2.5 || activeWings || hasAscension);
  const showAura = gearAvgTier >= 2.0 || activeBuffCount > 0 || activeWings || hasAscension;
  rig.gearAuraGroup.visible = showAura;
  if (showAura) {
    const auraColor = hasAscension
      ? ascensionAuraHex
      : activeWings && wingsTier >= 2
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
      (hasAscension ? 0.58 : 0.26) +
      Math.min(0.38, Math.max(0, gearAvgTier - 1) * 0.08 + (activeWings ? wingsTier * 0.09 : 0)) +
      Math.sin(time * 3.5) * 0.06;
    const ringScale =
      1 +
      (hasAscension ? 0.34 : 0) +
      (activeWings ? wingsTier * 0.12 : 0) +
      Math.sin(time * 2.8) * 0.04;
    rig.gearGroundRingMesh.scale.setScalar(ringScale);

    rig.gearOrbitMotesGroup.visible =
      gearAvgTier >= 3.0 || activeBuffCount > 0 || activeWings || hasAscension;
    rig.gearOrbitMotesGroup.rotation.y = time * (1.8 + (activeWings ? wingsTier * 0.45 : 0));
    rig.gearOrbitMotesGroup.position.y = 0.88 + Math.sin(time * 2.4) * 0.08;
  }

  // Articulated Smooth 3D "Wings of Fire" (Tiers 1..3) with fluid wave-lag flapping
  rig.wingsGroup.visible = activeWings;
  if (activeWings) {
    const wingScale = wingsTier === 1 ? 0.76 : wingsTier === 2 ? 0.88 : 0.96;
    rig.wingsGroup.scale.setScalar(wingScale);
    const flapFreq = 2.6 + moveSpeedRatio * 3.0;
    const flapAmp = 0.2 + moveSpeedRatio * 0.18;
    const glideSweep = moveSpeedRatio * 0.18;
    const flap = Math.sin(time * flapFreq) * flapAmp;
    rig.leftWingPivot.rotation.y = 0.42 + glideSweep + flap;
    rig.rightWingPivot.rotation.y = -0.42 - glideSweep - flap;
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

    rig.wingsHaloMesh.visible = false;
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

interface BakedTreeTemplate {
  scale: number;
  seed: number;
  isElder: boolean;
  isRareTree: boolean;
  isVoidHeartwood: boolean;
  trunkMat: THREE.MeshStandardMaterial;
  needleMat: THREE.MeshStandardMaterial;
  capMat: THREE.MeshStandardMaterial;
  detailMat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | null;
  baseTrunkGeo: THREE.BufferGeometry;
  upperTimberGeo: THREE.BufferGeometry;
  foliageGeo: THREE.BufferGeometry;
  snowCapGeo: THREE.BufferGeometry;
  baseDetailGeo: THREE.BufferGeometry | null;
  canopyDetailGeo: THREE.BufferGeometry | null;
}

const TREE_TEMPLATE_CACHE = new WeakMap<MaterialPalette, Map<TreeKind, BakedTreeTemplate>>();

function getOrBuildTreeTemplate(
  kind: TreeKind,
  palette: MaterialPalette,
): BakedTreeTemplate {
  let byKind = TREE_TEMPLATE_CACHE.get(palette);
  if (!byKind) {
    byKind = new Map();
    TREE_TEMPLATE_CACHE.set(palette, byKind);
  }
  const cached = byKind.get(kind);
  if (cached) return cached;

  const isElder = kind === 'elder';
  const isPyrewood = kind === 'pyrewood';
  const isVoidHeartwood = kind === 'void_heartwood';
  const isRareTree = isPyrewood || isVoidHeartwood;
  const scale = isVoidHeartwood
    ? 1.48
    : isPyrewood
      ? 1.4
      : isElder
        ? 1.35
        : kind === 'spruce'
          ? 1.15
          : 1.0;
  const seed = isVoidHeartwood
    ? 13
    : isPyrewood
      ? 11
      : isElder
        ? 7
        : kind === 'spruce'
          ? 3
          : 5;

  const trunkMat = isVoidHeartwood
    ? new THREE.MeshStandardMaterial({
        color: 0x160b28,
        emissive: 0x581c87,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.55,
      })
    : isPyrewood
      ? new THREE.MeshStandardMaterial({
          color: 0x24120b,
          emissive: 0x9a3412,
          emissiveIntensity: 0.4,
          roughness: 0.65,
          metalness: 0.25,
        })
      : isElder
        ? palette.birchBarkMat
        : palette.barkMat;

  const needleMat = isVoidHeartwood
    ? new THREE.MeshStandardMaterial({
        color: 0x3b0764,
        emissive: 0xa855f7,
        emissiveIntensity: 0.72,
        roughness: 0.28,
        metalness: 0.4,
      })
    : isPyrewood
      ? new THREE.MeshStandardMaterial({
          color: 0x7c2d12,
          emissive: 0xf97316,
          emissiveIntensity: 0.68,
          roughness: 0.42,
          metalness: 0.18,
        })
      : kind === 'elder'
        ? palette.elderNeedleMat
        : kind === 'spruce'
          ? palette.spruceNeedleMat
          : palette.pineNeedleMat;

  const capMat = isVoidHeartwood
    ? new THREE.MeshStandardMaterial({
        color: 0xf0abfc,
        emissive: 0xd946ef,
        emissiveIntensity: 0.95,
        roughness: 0.2,
        metalness: 0.5,
      })
    : isPyrewood
      ? new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xea580c,
          emissiveIntensity: 0.9,
          roughness: 0.3,
          metalness: 0.2,
        })
      : palette.snowMat;

  // Base trunk + 6 root buttresses merged into 1 geometry
  const baseParts: BakedPartSpec[] = [];
  for (let r = 0; r < 6; r++) {
    const a = (r / 6) * Math.PI * 2 + seed * 0.25;
    const rootCurve = [
      new THREE.Vector3(Math.cos(a) * 0.18 * scale, 0.45 * scale, Math.sin(a) * 0.18 * scale),
      new THREE.Vector3(Math.cos(a) * 0.36 * scale, 0.18 * scale, Math.sin(a) * 0.36 * scale),
      new THREE.Vector3(Math.cos(a) * 0.58 * scale, 0.02 * scale, Math.sin(a) * 0.58 * scale),
    ];
    baseParts.push({
      geo: createTaperedCurveGeometry(rootCurve, 0.145 * scale, 0.055 * scale, 6, 7),
    });
  }
  const lowerTrunkCurve = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04 * scale, 0.65 * scale, -0.02 * scale),
    new THREE.Vector3(0.02 * scale, 1.32 * scale, 0.03 * scale),
  ];
  baseParts.push({
    geo: createTaperedCurveGeometry(lowerTrunkCurve, 0.41 * scale, 0.25 * scale, 8, 10),
  });
  const baseTrunkGeo = bakeAndMergeGeometries(baseParts);

  // Upper canopy timber + stubs + tier bough arms merged into 1 geometry
  const upperTimberParts: BakedPartSpec[] = [];
  const upperTrunkCurve = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.04 * scale, 1.25 * scale, 0.02 * scale),
    new THREE.Vector3(0.02 * scale, 2.75 * scale, -0.02 * scale),
    new THREE.Vector3(0, 4.05 * scale, 0),
  ];
  upperTimberParts.push({
    geo: createTaperedCurveGeometry(upperTrunkCurve, 0.25 * scale, 0.045 * scale, 10, 9),
  });
  for (let b = 0; b < 4; b++) {
    const a = b * 1.65 + 0.45;
    const len = (0.45 + (b % 2) * 0.2) * scale;
    upperTimberParts.push({
      geo: createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, (0.2 + b * 0.22) * scale, 0),
          new THREE.Vector3(
            Math.cos(a) * len * 0.6,
            (0.28 + b * 0.22) * scale,
            Math.sin(a) * len * 0.6,
          ),
          new THREE.Vector3(
            Math.cos(a) * len,
            (0.22 + b * 0.22) * scale,
            Math.sin(a) * len,
          ),
        ],
        0.055 * scale,
        0.016 * scale,
        5,
        5,
      ),
    });
  }

  const foliageParts: BakedPartSpec[] = [];
  const snowCapParts: BakedPartSpec[] = [];
  const pineconeParts: BakedPartSpec[] = [];

  const tiers = kind === 'spruce' || isVoidHeartwood ? 5 : 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const radius = (1.78 - t * 1.02) * scale;
    const height = (1.58 - t * 0.26) * scale;
    const relY = (0.42 + i * 0.88) * scale;

    if (i < tiers - 1) {
      const armCount = 4;
      for (let armIdx = 0; armIdx < armCount; armIdx++) {
        const a = (armIdx / armCount) * Math.PI * 2 + i * 0.72;
        const reach = radius * 0.64;
        upperTimberParts.push({
          geo: new THREE.CylinderGeometry(0.022 * scale, 0.048 * scale, reach, 5),
          px: Math.cos(a) * reach * 0.45,
          py: relY + 0.08 * scale,
          pz: Math.sin(a) * reach * 0.45,
          rx: Math.sin(a) * 1.25,
          rz: -Math.cos(a) * 1.25,
        });
      }
    }

    foliageParts.push({
      geo: createSculptedTreeTierGeometry(radius, height, seed + i * 3),
      py: relY + height * 0.46,
      ry: i * 0.85,
    });
    snowCapParts.push({
      geo: createSculptedTreeTierGeometry(radius * 0.83, height * 0.56, seed + i * 5),
      py: relY + height * 0.72,
      ry: i * 0.85 + 0.14,
    });

    if (!isElder && !isRareTree && i <= 1) {
      for (let pc = 0; pc < 2; pc++) {
        const pa = i * 1.9 + pc * Math.PI;
        pineconeParts.push({
          geo: new THREE.SphereGeometry(0.055 * scale, 6, 5),
          px: Math.cos(pa) * radius * 0.72,
          py: relY + 0.02 * scale,
          pz: Math.sin(pa) * radius * 0.72,
          sx: 0.75,
          sy: 1.5,
          sz: 0.75,
        });
      }
    }
  }

  foliageParts.push({
    geo: createSculptedTreeTierGeometry(0.42 * scale, 0.92 * scale, seed + 19),
    py: (0.42 + tiers * 0.88 + 0.25) * scale,
  });

  if (isRareTree) {
    snowCapParts.push({
      geo: new THREE.TorusGeometry(1.45 * scale, 0.035, 8, 28),
      py: 2.2 * scale,
      rx: Math.PI * 0.44,
    });
  }

  const upperTimberGeo = bakeAndMergeGeometries(upperTimberParts);
  const foliageGeo = bakeAndMergeGeometries(foliageParts);
  const snowCapGeo = bakeAndMergeGeometries(snowCapParts);

  let detailMat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | null = null;
  let baseDetailGeo: THREE.BufferGeometry | null = null;
  let canopyDetailGeo: THREE.BufferGeometry | null = null;

  if (isElder || isRareTree) {
    const resinParts: BakedPartSpec[] = [];
    for (let r = 0; r < 5; r++) {
      const a = (r / 5) * Math.PI * 2 + 0.4;
      resinParts.push({
        geo: new THREE.OctahedronGeometry(isRareTree ? 0.26 : 0.2, 1),
        px: Math.cos(a) * 0.34 * scale,
        py: (0.85 + r * 0.36) * scale,
        pz: Math.sin(a) * 0.34 * scale,
        sx: 0.75,
        sy: 1.45,
        sz: 0.75,
      });
    }
    baseDetailGeo = bakeAndMergeGeometries(resinParts);
    detailMat = isVoidHeartwood ? palette.mythicMat : palette.emberMat;

    if (!isRareTree) {
      const icicleParts: BakedPartSpec[] = [];
      for (let c = 0; c < 5; c++) {
        const a = (c / 5) * Math.PI * 2 + 0.4;
        icicleParts.push({
          geo: new THREE.ConeGeometry(0.055, 0.4, 5),
          px: Math.cos(a) * 1.38 * scale,
          py: 0.22 * scale,
          pz: Math.sin(a) * 1.38 * scale,
          rx: Math.PI,
        });
      }
      canopyDetailGeo = bakeAndMergeGeometries(icicleParts);
    }
  } else if (pineconeParts.length > 0) {
    canopyDetailGeo = bakeAndMergeGeometries(pineconeParts);
    detailMat = palette.darkWoodMat;
  }

  const tpl: BakedTreeTemplate = {
    scale,
    seed,
    isElder,
    isRareTree,
    isVoidHeartwood,
    trunkMat,
    needleMat,
    capMat,
    detailMat,
    baseTrunkGeo,
    upperTimberGeo,
    foliageGeo,
    snowCapGeo,
    baseDetailGeo,
    canopyDetailGeo,
  };
  byKind.set(kind, tpl);
  return tpl;
}

export function createTreeModel(
  kind: TreeKind,
  palette: MaterialPalette,
): THREE.Group {
  const tpl = getOrBuildTreeTemplate(kind, palette);
  const group = new THREE.Group();

  addContactShadow(group, palette.contactShadowMat, 1.62 * tpl.scale);

  const lowerTrunkMesh = new THREE.Mesh(tpl.baseTrunkGeo, tpl.trunkMat);
  lowerTrunkMesh.castShadow = true;
  lowerTrunkMesh.receiveShadow = true;
  group.add(lowerTrunkMesh);

  if (tpl.baseDetailGeo && tpl.detailMat) {
    const resinMesh = new THREE.Mesh(tpl.baseDetailGeo, tpl.detailMat);
    group.add(resinMesh);
  }

  // Wind-reactive upper trunk + foliage crown pivot (1 wind target per tree)
  const canopyPivot = new THREE.Group();
  canopyPivot.position.set(0.02 * tpl.scale, 1.18 * tpl.scale, 0.03 * tpl.scale);
  group.add(canopyPivot);
  registerWindTarget(group, {
    pivot: canopyPivot,
    stiffness: tpl.isElder || tpl.isRareTree ? 1.25 : 0.92,
    phaseOffset: tpl.seed * 0.9,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });

  const upperTimberMesh = new THREE.Mesh(tpl.upperTimberGeo, tpl.trunkMat);
  upperTimberMesh.castShadow = true;
  upperTimberMesh.receiveShadow = true;

  const foliageMesh = new THREE.Mesh(tpl.foliageGeo, tpl.needleMat);
  foliageMesh.castShadow = true;
  foliageMesh.receiveShadow = true;

  const snowCapMesh = new THREE.Mesh(tpl.snowCapGeo, tpl.capMat);
  snowCapMesh.receiveShadow = true;

  canopyPivot.add(upperTimberMesh, foliageMesh, snowCapMesh);

  if (tpl.canopyDetailGeo) {
    const detailMesh = new THREE.Mesh(
      tpl.canopyDetailGeo,
      tpl.isElder && !tpl.isRareTree ? palette.iceMat : (tpl.detailMat ?? palette.darkWoodMat),
    );
    canopyPivot.add(detailMesh);
  }

  if (tpl.isRareTree) {
    attachRarityHalo(
      group,
      1.85 * tpl.scale,
      tpl.isVoidHeartwood ? 0xd946ef : 0xf97316,
    );
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
  mixer?: THREE.AnimationMixer;
  animations?: THREE.AnimationClip[];
  skeletalAnim?: SkeletalAnimController;
  gltfLod?: THREE.LOD;
  gltfReady?: boolean;
  proceduralGaitAssist?: boolean;
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

const UNIT_RARITY_HALO_GEO = (() => {
  const geo = new THREE.RingGeometry(0.82, 1.0, 36);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();
const RARITY_HALO_MAT_CACHE = new Map<number, THREE.MeshBasicMaterial>();

function attachRarityHalo(
  group: THREE.Group,
  radius: number,
  colorHex: number,
): void {
  let mat = RARITY_HALO_MAT_CACHE.get(colorHex);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    RARITY_HALO_MAT_CACHE.set(colorHex, mat);
  }
  const halo = new THREE.Mesh(UNIT_RARITY_HALO_GEO, mat);
  halo.position.y = 0.035;
  halo.scale.set(radius, 1, radius);
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
            : kind === 'musk_ox' || kind === 'frost_boar'
              ? 2.1
              : kind === 'sabertooth'
                ? 1.9
                : kind === 'wolf' || kind === 'wolverine'
                  ? 1.72
                  : kind === 'lynx' || kind === 'snow_owl'
                    ? 1.56
                    : kind === 'fox'
                      ? 1.48
                      : 1.28;
  const ringRadius =
    kind === 'mammoth'
      ? 2.0
      : kind === 'polar_bear' || kind === 'musk_ox' || kind === 'aurora_fenrir' || kind === 'frost_boar'
        ? 1.5
        : kind === 'stag' || kind === 'frost_stag' || kind === 'sabertooth' || kind === 'wolverine'
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
      : kind === 'polar_bear' || kind === 'musk_ox' || kind === 'frost_boar'
        ? 1.4
        : kind === 'stag' || kind === 'frost_stag' || kind === 'sabertooth' || kind === 'aurora_fenrir' || kind === 'wolverine'
          ? 1.2
          : kind === 'hare' || kind === 'snow_owl'
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

  model.bodyGroup.visible = true;

  // Replace procedural animal mesh with genuine CC0 GLB model + THREE.LOD + SkeletalAnimController
  const gltfSpec = ANIMAL_MODEL_SPECS[kind];
  if (gltfSpec) {
    model.proceduralGaitAssist = gltfSpec.proceduralGaitAssist ?? false;
    loadGltfModelWithAnimations(gltfSpec.url)
      .then((loaded) => {
        const prepared = prepareNormalizedGltfAsset(loaded.scene, gltfSpec, {
          furBumpMap: palette.furTrimMat.bumpMap,
          scaleBumpMap: palette.rockMat.bumpMap,
          envMapIntensity: 0.85,
        });

        // Physically detach ALL procedural body & leg geometry from bodyGroup and clear leg arrays
        // so zero phantom procedural legs can ever remain visible or receive gait rotations
        const existingChildren = [...model.bodyGroup.children];
        for (const child of existingChildren) {
          child.visible = false;
          model.bodyGroup.remove(child);
        }
        model.spinePivot.visible = false;
        for (const leg of model.legs) {
          leg.visible = false;
          leg.parent?.remove(leg);
        }
        model.legs.length = 0;
        model.lowerLegs.length = 0;

        model.bodyGroup.add(prepared.lod);
        model.gltfLod = prepared.lod;
        model.gltfReady = true;

        if (loaded.animations.length > 0) {
          const animCtrl = new SkeletalAnimController(
            loaded.scene,
            loaded.animations,
            prepared.meshes,
          );
          animCtrl.setState('idle', { fadeDuration: 0 });
          model.skeletalAnim = animCtrl;
          model.mixer = animCtrl.mixer;
          model.animations = loaded.animations;
        }
      })
      .catch((err) => {
        console.warn(`Failed to load GLB for wildlife ${kind}:`, err);
      });
  }

  // Glowing claw/fang slash arc VFX shown during predator lunge attacks
  if (SPECIES_SPECS[kind].predator) {
    const slashColor =
      kind === 'aurora_fenrir'
        ? 0xe879f9
        : kind === 'polar_bear' || kind === 'frost_boar'
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
      kind === 'mammoth'
        ? 1.15
        : kind === 'polar_bear' || kind === 'aurora_fenrir' || kind === 'frost_boar'
          ? 0.85
          : 0.65;
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
      kind === 'mammoth'
        ? 1.18
        : kind === 'polar_bear' || kind === 'aurora_fenrir' || kind === 'frost_boar'
          ? 0.92
          : 0.72,
      kind === 'mammoth' ? 1.35 : 0.95,
    );
    attackSlashMesh.visible = false;
    attackSlashMesh.renderOrder = 6;
    model.group.add(attackSlashMesh);
    model.attackSlashMesh = attackSlashMesh;
  }

  // Add subtle cold-air frost breath vapor plume to the animal's snout/head
  if (model.headGroup && kind !== 'hare' && kind !== 'snow_owl') {
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

  if (kind === 'snow_owl') {
    addContactShadow(group, palette.contactShadowMat, 0.78);

    const owlWhiteMat = palette.polarBearMat;
    const owlBarredMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      bumpMap: palette.furTrimMat.bumpMap,
      bumpScale: 0.035,
      roughness: 0.78,
      metalness: 0.04,
    });
    const owlSlateMat = palette.wolfDarkMat;

    // Aerodynamic swooping avian body elevated above snow
    const owlBody = new THREE.Mesh(
      createSculptedTorsoGeometry([
        { z: -0.34, yOffset: 0.88, rx: 0.04, ry: 0.04 },
        { z: -0.22, yOffset: 0.9, rx: 0.16, ry: 0.15 },
        { z: 0.0, yOffset: 0.94, rx: 0.22, ry: 0.21 },
        { z: 0.2, yOffset: 0.98, rx: 0.2, ry: 0.19 },
        { z: 0.3, yOffset: 1.0, rx: 0.05, ry: 0.05 },
      ]),
      owlWhiteMat,
    );
    owlBody.castShadow = true;

    // Barred dorsal mantle plumage
    const mantle = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 14, 10),
      owlBarredMat,
    );
    mantle.scale.set(1.04, 0.72, 1.25);
    mantle.position.set(0, 1.03, 0.02);

    // Round facial disc + golden-amber raptor eyes + hooked beak + ear tufts
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.08, 0.26);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 16, 14),
      owlWhiteMat,
    );
    cranium.scale.set(1.08, 0.96, 0.98);
    cranium.castShadow = true;

    const facialDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.04, 16),
      owlBarredMat,
    );
    facialDisc.rotation.x = Math.PI / 2;
    facialDisc.position.set(0, 0, 0.13);

    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.036, 0.1, 8),
      owlSlateMat,
    );
    beak.rotation.x = Math.PI * 0.62;
    beak.position.set(0, -0.02, 0.185);

    for (const side of [-1, 1]) {
      attachRealisticAnimalEye(
        headGroup,
        side * 0.068,
        0.015,
        0.148,
        0.028,
        palette.predatorEyeMat,
        palette,
      );

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.095, 0.12, 0.04);
      earPivot.rotation.z = -side * 0.32;
      earPivot.userData.baseRotX = 0.12;
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.032, 0.11, 6),
        owlSlateMat,
      );
      tuft.position.y = 0.045;
      earPivot.add(tuft);
      headGroup.add(earPivot);
      earPivots.push(earPivot);
    }
    headGroup.add(cranium, facialDisc, beak);

    // Fanned barred tail feathers
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.88, -0.3);
    for (let t = -2; t <= 2; t++) {
      const feather = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.02, 0.28),
        Math.abs(t) % 2 === 0 ? owlWhiteMat : owlBarredMat,
      );
      feather.position.set(t * 0.048, -0.02, -0.12);
      feather.rotation.y = t * 0.14;
      feather.rotation.x = -0.12;
      tailPivot.add(feather);
    }

    // Articulated broad wings mapped to legs[0..1] and lowerLegs[0..1] for wing-flap kinematics
    for (const side of [-1, 1]) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.18, 0.98, 0.04);

      const innerWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.035, 0.32),
        owlWhiteMat,
      );
      innerWing.position.set(side * 0.22, 0, -0.02);
      innerWing.castShadow = true;
      wingPivot.add(innerWing);

      const outerWingPivot = new THREE.Group();
      outerWingPivot.position.set(side * 0.44, 0, 0);
      outerWingPivot.userData.baseRotX = 0;

      const outerWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.028, 0.26),
        owlBarredMat,
      );
      outerWing.position.set(side * 0.22, 0, -0.04);
      outerWing.castShadow = true;
      outerWingPivot.add(outerWing);

      for (let p = 0; p < 4; p++) {
        const pinion = new THREE.Mesh(
          new THREE.ConeGeometry(0.038, 0.26, 5),
          p % 2 === 0 ? owlWhiteMat : owlSlateMat,
        );
        pinion.rotation.z = -side * (Math.PI / 2 - 0.18 - p * 0.1);
        pinion.position.set(side * (0.38 + p * 0.05), 0, 0.04 - p * 0.06);
        outerWingPivot.add(pinion);
      }

      wingPivot.add(outerWingPivot);
      spinePivot.add(wingPivot);
      legs.push(wingPivot);
      lowerLegs.push(outerWingPivot);
    }

    // Tucked feathered raptor talons mapped to legs[2..3] and lowerLegs[2..3]
    for (const side of [-1, 1]) {
      const talonPivot = new THREE.Group();
      talonPivot.position.set(side * 0.1, 0.78, -0.02);
      const legFeather = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.18, 8),
        owlWhiteMat,
      );
      legFeather.rotation.x = Math.PI;
      legFeather.position.y = -0.08;
      const lowerTalon = new THREE.Group();
      lowerTalon.position.y = -0.15;
      lowerTalon.userData.baseRotX = 0.25;
      for (const cx of [-0.022, 0, 0.022]) {
        const claw = new THREE.Mesh(
          new THREE.ConeGeometry(0.012, 0.06, 5),
          owlSlateMat,
        );
        claw.rotation.x = Math.PI * 0.65;
        claw.position.set(cx, -0.02, 0.03);
        lowerTalon.add(claw);
      }
      talonPivot.add(legFeather, lowerTalon);
      spinePivot.add(talonPivot);
      legs.push(talonPivot);
      lowerLegs.push(lowerTalon);
    }

    spinePivot.add(owlBody, mantle, headGroup, tailPivot);
    const alertMarker = attachAlertMarker(group, 1.52);
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

  if (kind === 'wolverine') {
    addContactShadow(group, palette.contactShadowMat, 0.96);
    attachRarityHalo(group, 1.08, 0x38bdf8);

    const wolverineDarkMat = new THREE.MeshStandardMaterial({
      color: 0x2d1e16,
      bumpMap: palette.furTrimMat.bumpMap,
      bumpScale: 0.045,
      roughness: 0.84,
      metalness: 0.04,
    });
    const wolverineGoldStripeMat = new THREE.MeshStandardMaterial({
      color: 0xc8964e,
      bumpMap: palette.furTrimMat.bumpMap,
      bumpScale: 0.038,
      roughness: 0.8,
      metalness: 0.04,
    });

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.52, yOffset: 0.48, rx: 0.03, ry: 0.03 },
      { z: -0.38, yOffset: 0.52, rx: 0.24, ry: 0.22 },
      { z: 0.0, yOffset: 0.56, rx: 0.29, ry: 0.26 },
      { z: 0.3, yOffset: 0.55, rx: 0.28, ry: 0.25 },
      { z: 0.48, yOffset: 0.52, rx: 0.04, ry: 0.04 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, wolverineDarkMat);
    torso.castShadow = true;

    // Characteristic golden-buff lateral wolverine stripes along flanks
    for (const side of [-1, 1]) {
      const flankStripe = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.068, 0.56, 4, 10),
        wolverineGoldStripeMat,
      );
      flankStripe.rotation.x = Math.PI / 2 - 0.08;
      flankStripe.position.set(side * 0.23, 0.56, -0.03);
      spinePivot.add(flankStripe);
    }

    const shoulderHump = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 14, 10),
      wolverineDarkMat,
    );
    shoulderHump.scale.set(1.08, 0.92, 1.15);
    shoulderHump.position.set(0, 0.62, 0.24);
    shoulderHump.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0.48);

    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 16, 12),
      wolverineDarkMat,
    );
    skull.scale.set(1.16, 0.92, 1.08);
    skull.castShadow = true;

    const browMask = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.042, 0.18, 4, 8),
      wolverineGoldStripeMat,
    );
    browMask.rotation.z = Math.PI / 2;
    browMask.position.set(0, 0.065, 0.14);

    const snout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.115, 0.2, 10),
      wolverineDarkMat,
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.025, 0.19);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 8, 8),
      palette.noseWetMat,
    );
    nose.position.set(0, -0.015, 0.29);

    for (const side of [-1, 1]) {
      attachRealisticAnimalEye(
        headGroup,
        side * 0.088,
        0.03,
        0.145,
        0.025,
        palette.predatorEyeMat,
        palette,
      );
      const fang = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.065, 6),
        palette.ivoryMat,
      );
      fang.rotation.x = Math.PI;
      fang.position.set(side * 0.048, -0.068, 0.23);
      headGroup.add(fang);

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.13, 0.11, -0.02);
      earPivot.userData.baseRotX = 0.08;
      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.048, 8, 8),
        wolverineDarkMat,
      );
      ear.scale.set(1.0, 1.0, 0.55);
      earPivot.add(ear);
      headGroup.add(earPivot);
      earPivots.push(earPivot);
    }
    headGroup.add(skull, browMask, snout, nose);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.5, -0.46);
    const tail = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.05, -0.2),
          new THREE.Vector3(0, -0.1, -0.38),
        ],
        0.11,
        0.065,
        8,
        10,
      ),
      wolverineDarkMat,
    );
    tailPivot.add(tail);

    spinePivot.add(torso, shoulderHump, headGroup, tailPivot);

    const legCoords: [number, number, boolean][] = [
      [-0.21, 0.28, true],
      [0.21, 0.28, true],
      [-0.22, -0.3, false],
      [0.22, -0.3, false],
    ];
    for (const [lx, lz, isFront] of legCoords) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.46,
        z: lz,
        upperRadius: isFront ? 0.092 : 0.102,
        midRadius: 0.068,
        lowerRadius: 0.056,
        upperLen: 0.21,
        lowerLen: 0.2,
        upperAngleX: isFront ? 0.06 : -0.12,
        lowerAngleX: isFront ? -0.06 : 0.12,
        upperMat: wolverineDarkMat,
        lowerMat: wolverineDarkMat,
        footMat: wolverineGoldStripeMat,
        footType: 'clawed_paw',
      });
      bodyGroup.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 0.95, 1.25);
    const alertMarker = attachAlertMarker(group, 1.42);
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

  if (kind === 'frost_boar') {
    addContactShadow(group, palette.contactShadowMat, 1.28);
    attachRarityHalo(group, 1.38, 0xc084fc);

    const boarHideMat = new THREE.MeshStandardMaterial({
      color: 0x3b4252,
      bumpMap: palette.furTrimMat.bumpMap,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.06,
    });
    const boarBristleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.05,
    });

    const torsoGeo = createSculptedTorsoGeometry([
      { z: -0.68, yOffset: 0.68, rx: 0.04, ry: 0.04 },
      { z: -0.52, yOffset: 0.72, rx: 0.32, ry: 0.34 },
      { z: -0.08, yOffset: 0.78, rx: 0.42, ry: 0.44 },
      { z: 0.34, yOffset: 0.86, rx: 0.46, ry: 0.5 },
      { z: 0.62, yOffset: 0.82, rx: 0.34, ry: 0.36 },
      { z: 0.74, yOffset: 0.76, rx: 0.05, ry: 0.05 },
    ]);
    const torso = new THREE.Mesh(torsoGeo, boarHideMat);
    torso.castShadow = true;

    // Massive armored razorback ridge + glowing ice-crystal dorsal spines
    const dorsalCrest = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.88, 6, 12),
      boarBristleMat,
    );
    dorsalCrest.rotation.x = Math.PI / 2 - 0.14;
    dorsalCrest.position.set(0, 1.18, 0.05);
    spinePivot.add(dorsalCrest);

    for (let sp = 0; sp < 5; sp++) {
      const iceSpine = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.28 - sp * 0.03, 5),
        palette.iceMat,
      );
      iceSpine.position.set(0, 1.32 - sp * 0.04, 0.38 - sp * 0.2);
      iceSpine.rotation.x = -0.32;
      spinePivot.add(iceSpine);
    }

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.78, 0.66);

    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 14),
      boarHideMat,
    );
    skull.scale.set(1.06, 1.02, 1.18);
    skull.castShadow = true;

    // Sloped wedge boar snout + flat rooter disc
    const snout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.21, 0.38, 12),
      boarHideMat,
    );
    snout.rotation.x = Math.PI / 2 + 0.18;
    snout.position.set(0, -0.06, 0.26);

    const snoutDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.138, 0.05, 12),
      palette.noseWetMat,
    );
    snoutDisc.rotation.x = Math.PI / 2 + 0.18;
    snoutDisc.position.set(0, -0.095, 0.45);

    // Pair of massive upward-curving ivory razor tusks + cheek frost plates
    for (const side of [-1, 1]) {
      attachRealisticAnimalEye(
        headGroup,
        side * 0.145,
        0.055,
        0.16,
        0.03,
        palette.predatorEyeMat,
        palette,
      );

      const tusk = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.12, -0.1, 0.28),
            new THREE.Vector3(side * 0.22, -0.04, 0.38),
            new THREE.Vector3(side * 0.26, 0.14, 0.42),
            new THREE.Vector3(side * 0.22, 0.28, 0.38),
          ],
          0.048,
          0.012,
          12,
          8,
        ),
        palette.ivoryMat,
      );
      tusk.castShadow = true;
      headGroup.add(tusk);

      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.18, 0.18, -0.04);
      earPivot.rotation.z = -side * 0.38;
      earPivot.userData.baseRotX = 0.2;
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.2, 8),
        boarHideMat,
      );
      ear.scale.set(1, 1, 0.5);
      ear.position.y = 0.08;
      earPivot.add(ear);
      headGroup.add(earPivot);
      earPivots.push(earPivot);
    }

    headGroup.add(skull, snout, snoutDisc);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.74, -0.64);
    const tail = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.08, -0.18),
          new THREE.Vector3(0, -0.16, -0.28),
        ],
        0.055,
        0.035,
        8,
        8,
      ),
      boarBristleMat,
    );
    tailPivot.add(tail);

    spinePivot.add(torso, headGroup, tailPivot);

    const boarLegs: [number, number, boolean][] = [
      [-0.25, 0.38, true],
      [0.25, 0.38, true],
      [-0.25, -0.4, false],
      [0.25, -0.4, false],
    ];
    for (const [lx, lz, isFront] of boarLegs) {
      const lp = createArticulatedLeg({
        x: lx,
        y: 0.62,
        z: lz,
        upperRadius: isFront ? 0.115 : 0.125,
        midRadius: 0.082,
        lowerRadius: 0.064,
        upperLen: 0.29,
        lowerLen: 0.27,
        upperAngleX: isFront ? 0.05 : -0.14,
        lowerAngleX: isFront ? -0.05 : 0.14,
        upperMat: boarHideMat,
        lowerMat: boarBristleMat,
        footMat: palette.noseWetMat,
        footType: 'hoof',
      });
      bodyGroup.add(lp.pivot);
      legs.push(lp.pivot);
      lowerLegs.push(lp.lowerPivot);
    }

    const telegraphRing = attachTelegraphRing(group, 1.2, 1.55);
    const alertMarker = attachAlertMarker(group, 1.85);
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

  const light = new THREE.PointLight(0xff9a3c, 11, 24, 1.45);
  light.position.set(0, 1.75, 0);
  group.add(light);

  // Warm additive firelight pool on surrounding flagstones & snow
  const firePool = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 11.5),
    palette.warmGlowMat,
  );
  firePool.rotation.x = -Math.PI / 2;
  firePool.position.y = 0.042;
  group.add(firePool);

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

  if (tier >= 4) {
    // Tier 4 Clockwork Frost-Sawmill: twin frost-steel auxiliary saw carriage + glowing arcane dynamo core
    const secondBlade = new THREE.Mesh(
      createToothedSawBladeGeometry(0.84, 26),
      palette.frostSteelMat,
    );
    secondBlade.rotation.x = Math.PI / 2;
    secondBlade.position.set(0.55, 1.12, 0.45);
    secondBlade.castShadow = true;

    const dynamoRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.06, 10, 20),
      palette.goldMat,
    );
    dynamoRing.position.set(1.2, 1.45, -0.8);

    const dynamoCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      palette.auroraCrystalMat,
    );
    dynamoCore.position.set(1.2, 2.1, -0.8);

    const guildBanner = createPennantBanner(palette, palette.goldMat, 1.05, 0.38);
    guildBanner.position.set(-1.75, 2.95, 1.35);
    registerWindTarget(group, {
      pivot: guildBanner,
      stiffness: 0.45,
      phaseOffset: 1.9,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(secondBlade, dynamoRing, dynamoCore, guildBanner);
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

  if (tier >= 4) {
    // Tier 4 Imperial Fur Exchange: gilded merchant canopy + stacked luxury fur bales + trophy antlers
    const guildArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.08, 8, 20, Math.PI),
      palette.goldMat,
    );
    guildArch.position.set(0, 2.25, 1.25);

    for (let b = 0; b < 3; b++) {
      const bale = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.68, 12),
        b % 2 === 0 ? palette.polarBearMat : palette.foxMat,
      );
      bale.rotation.z = Math.PI / 2;
      bale.position.set(-1.1, 0.48 + b * 0.28, 1.15);
      bale.castShadow = true;
      group.add(bale);
    }
    group.add(guildArch);
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

  if (tier >= 4) {
    // Tier 4 Starfire Runeforge: floating arcane rune rings + crystal obelisk + starfire hearth halo
    const runeHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.045, 8, 24),
      palette.auroraCrystalMat,
    );
    runeHalo.rotation.x = Math.PI / 2;
    runeHalo.position.set(0, 4.45, -0.55);

    for (const side of [-1, 1]) {
      const crystalPillar = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.35, 6),
        palette.auroraCrystalMat,
      );
      crystalPillar.position.set(side * 1.45, 1.05, -0.2);
      crystalPillar.rotation.z = -side * 0.14;
      group.add(crystalPillar);
    }
    group.add(runeHalo);
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

  if (tier >= 4) {
    // Tier 4 Frostwood Timber Guild: overhead log-hoist crane beam + gilded guild crest
    const craneMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 3.2, 10),
      palette.darkWoodMat,
    );
    craneMast.position.set(-1.55, 1.72, 0.95);
    craneMast.castShadow = true;

    const craneBoom = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.14, 0.14),
      palette.timberMat,
    );
    craneBoom.position.set(-0.85, 3.12, 0.95);
    craneBoom.rotation.z = 0.12;

    const hoistChain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6),
      palette.ironMat,
    );
    hoistChain.position.set(-0.2, 2.7, 0.95);

    const hoistedLog = createLogMesh(0.22, 1.65, 12, palette);
    hoistedLog.rotation.z = Math.PI / 2;
    hoistedLog.position.set(-0.2, 2.18, 0.95);

    group.add(craneMast, craneBoom, hoistChain, hoistedLog);
  }

  return group;
}

/**
 * Hunter's Watchtower (Tiers 1-3): Elevated timber & stone lookout spire with signal brazier,
 * wraparound ranger gallery, and wind-swaying banners.
 */
export function createWatchtowerMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 2.05, 0.45, 8),
    palette.stoneMat,
  );
  plinth.position.y = 0.225;
  plinth.receiveShadow = true;
  group.add(plinth);

  const towerHeight = 3.1 + tier * 0.65;
  for (const sx of [-1.05, 1.05]) {
    for (const sz of [-1.05, 1.05]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.17, towerHeight, 10),
        palette.darkWoodMat,
      );
      leg.position.set(sx * 0.88, 0.4 + towerHeight * 0.5, sz * 0.88);
      leg.rotation.z = -sx * 0.06;
      leg.rotation.x = sz * 0.06;
      leg.castShadow = true;
      group.add(leg);
    }
  }

  // Cross-bracing X-timbers
  for (let level = 0; level < 2; level++) {
    const yLevel = 1.2 + level * 1.35;
    for (const sideZ of [-0.92, 0.92]) {
      const braceA = new THREE.Mesh(
        new THREE.BoxGeometry(1.95, 0.09, 0.09),
        palette.timberMat,
      );
      braceA.position.set(0, yLevel, sideZ);
      braceA.rotation.z = 0.52;
      const braceB = braceA.clone();
      braceB.rotation.z = -0.52;
      group.add(braceA, braceB);
    }
  }

  // Lookout deck platform + railing
  const deckY = 0.4 + towerHeight;
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.22, 2.55),
    palette.timberMat,
  );
  deck.position.y = deckY;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  for (const rx of [-1.15, 1.15]) {
    for (const rz of [-1.15, 1.15]) {
      const roofPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 1.55, 8),
        palette.darkWoodMat,
      );
      roofPost.position.set(rx, deckY + 0.82, rz);
      roofPost.castShadow = true;
      group.add(roofPost);
    }
  }

  const roofCone = new THREE.Mesh(
    new THREE.ConeGeometry(2.05, 1.55, 8),
    tier >= 3 ? palette.frostSteelMat : palette.darkWoodMat,
  );
  roofCone.position.y = deckY + 2.25;
  roofCone.castShadow = true;

  const snowCone = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 1.25, 8),
    palette.snowMat,
  );
  snowCone.position.y = deckY + 2.42;
  group.add(roofCone, snowCone);

  const lanternPivot = createHangingLantern(palette);
  lanternPivot.position.set(0, deckY + 1.45, 1.18);
  registerWindTarget(group, {
    pivot: lanternPivot,
    stiffness: 0.52,
    phaseOffset: 1.1,
    baseRotX: 0,
    baseRotZ: 0,
    useGroupYaw: true,
  });
  group.add(lanternPivot);

  if (tier >= 2) {
    // Ranger Signal Spire brazier beacon
    const brazierBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.22, 0.28, 10),
      palette.ironMat,
    );
    brazierBowl.position.set(1.38, deckY + 0.35, 1.38);
    const brazierFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.62, 8),
      palette.emberMat,
    );
    brazierFlame.position.set(1.38, deckY + 0.72, 1.38);
    group.add(brazierBowl, brazierFlame);
  }

  if (tier >= 3) {
    // Aurora Falconry Citadel banner + crystalline spyglass beacon
    const citadelOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      palette.auroraCrystalMat,
    );
    citadelOrb.position.set(0, deckY + 3.25, 0);

    const banner = createPennantBanner(palette, palette.coatBlueMat, 1.15, 0.42);
    banner.position.set(-1.18, deckY + 1.25, 1.18);
    registerWindTarget(group, {
      pivot: banner,
      stiffness: 0.42,
      phaseOffset: 2.1,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(citadelOrb, banner);
  }

  return group;
}

/**
 * Provision Smokehouse & Granary (Tiers 1-3): Timber-and-stone curing lodge with smoking flue,
 * suspended meat racks, and provision barrels.
 */
export function createGrandGranaryMesh(tier: number, palette: MaterialPalette): THREE.Group {
  const group = new THREE.Group();

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(3.75, 0.36, 3.05),
    palette.stoneMat,
  );
  foundation.position.y = 0.18;
  foundation.receiveShadow = true;
  group.add(foundation);

  const cabinBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.75, 2.45),
    palette.timberMat,
  );
  cabinBody.position.set(0, 1.22, -0.1);
  cabinBody.castShadow = true;
  cabinBody.receiveShadow = true;
  group.add(cabinBody);

  addPitchedSnowRoof(
    group,
    1.85,
    1.15,
    2.85,
    2.08,
    palette.darkWoodMat,
    palette,
  );

  // Stone smokehouse curing chimney with glowing ember vent
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.44, 2.95, 10),
    palette.stoneMat,
  );
  chimney.position.set(-1.15, 1.85, -0.45);
  chimney.castShadow = true;
  const flueCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 0.32, 10),
    palette.ironMat,
  );
  flueCap.position.set(-1.15, 3.48, -0.45);
  group.add(chimney, flueCap);

  // Front curing rack with hanging smoked venison haunches
  const rackBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8),
    palette.darkWoodMat,
  );
  rackBeam.rotation.z = Math.PI / 2;
  rackBeam.position.set(0, 1.82, 1.32);
  group.add(rackBeam);

  const meatMat = new THREE.MeshStandardMaterial({
    color: 0x9e342b,
    roughness: 0.55,
    metalness: 0.05,
  });
  for (let m = 0; m < Math.min(tier + 1, 4); m++) {
    const mx = -0.75 + m * 0.5;
    const haunchPivot = new THREE.Group();
    haunchPivot.position.set(mx, 1.8, 1.32);
    const haunch = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.26, 6, 10),
      meatMat,
    );
    haunch.position.y = -0.24;
    haunch.castShadow = true;
    haunchPivot.add(haunch);
    registerWindTarget(group, {
      pivot: haunchPivot,
      stiffness: 0.65,
      phaseOffset: m * 0.9,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(haunchPivot);
  }

  if (tier >= 2) {
    // Provision barrels & grain sacks on front deck
    for (const bx of [-1.28, 1.28]) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.24, 0.62, 12),
        palette.timberMat,
      );
      barrel.position.set(bx, 0.66, 1.15);
      barrel.castShadow = true;
      group.add(barrel);
    }
  }

  if (tier >= 3) {
    // Royal Feast Smokehouse gilded banner + warm hearth lantern
    const banner = createPennantBanner(palette, palette.coatRedMat, 0.95, 0.36);
    banner.position.set(1.25, 2.95, 1.15);
    registerWindTarget(group, {
      pivot: banner,
      stiffness: 0.45,
      phaseOffset: 1.5,
      baseRotX: 0,
      baseRotZ: 0,
      useGroupYaw: true,
    });
    group.add(banner);
  }

  return group;
}

interface BakedBoulderTemplate {
  isRareOre: boolean;
  isDarkMatter: boolean;
  isVoltaic: boolean;
  rockMat: THREE.MeshStandardMaterial;
  crystalMat: THREE.MeshStandardMaterial | null;
  orbMat: THREE.MeshStandardMaterial | null;
  rockClusterGeo: THREE.BufferGeometry;
  snowCapGeo: THREE.BufferGeometry | null;
  flintVeinGeo: THREE.BufferGeometry | null;
  spiresGeo: THREE.BufferGeometry | null;
  coreOrbGeo: THREE.BufferGeometry | null;
  ringGeo: THREE.BufferGeometry | null;
}

const BOULDER_TEMPLATE_CACHE = new WeakMap<MaterialPalette, Map<BoulderKind, BakedBoulderTemplate>>();

function getOrBuildBoulderTemplate(
  palette: MaterialPalette,
  kind: BoulderKind,
): BakedBoulderTemplate {
  let byKind = BOULDER_TEMPLATE_CACHE.get(palette);
  if (!byKind) {
    byKind = new Map();
    BOULDER_TEMPLATE_CACHE.set(palette, byKind);
  }
  const cached = byKind.get(kind);
  if (cached) return cached;

  const isBrimstone = kind === 'brimstone_ore';
  const isVoltaic = kind === 'voltaic_ore';
  const isDarkMatter = kind === 'dark_matter_ore';
  const isRareOre = isBrimstone || isVoltaic || isDarkMatter;

  const rockMat = isDarkMatter
    ? new THREE.MeshStandardMaterial({
        color: 0x11071f,
        emissive: 0x3b0764,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.78,
      })
    : isVoltaic
      ? new THREE.MeshStandardMaterial({
          color: 0x162b40,
          emissive: 0x0369a1,
          emissiveIntensity: 0.38,
          roughness: 0.32,
          metalness: 0.65,
        })
      : isBrimstone
        ? new THREE.MeshStandardMaterial({
            color: 0x26120b,
            emissive: 0x7c2d12,
            emissiveIntensity: 0.42,
            roughness: 0.5,
            metalness: 0.45,
          })
        : palette.rockMat;

  const rockClusterGeo = bakeAndMergeGeometries([
    {
      geo: createCraggyRockGeometry(isRareOre ? 1.18 : 1.06, 2, isDarkMatter ? 41 : isVoltaic ? 31 : 13),
      py: isDarkMatter ? 0.85 : 0.6,
      sx: 1.2,
      sy: isRareOre ? 0.98 : 0.82,
      sz: 1.06,
    },
    {
      geo: createCraggyRockGeometry(0.68, 2, 29),
      px: 0.76,
      py: 0.4,
      pz: 0.36,
      sx: 1.04,
      sy: 0.78,
      sz: 0.94,
    },
  ]);

  if (!isRareOre) {
    const snowCapGeo = bakeAndMergeGeometries([
      {
        geo: new THREE.SphereGeometry(0.86, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
        px: -0.04,
        py: 1.08,
        pz: -0.02,
        sx: 1.12,
        sy: 0.56,
        sz: 0.98,
      },
    ]);
    const flintVeinGeo = bakeAndMergeGeometries([
      {
        geo: new THREE.OctahedronGeometry(0.21, 0),
        px: -0.52,
        py: 0.74,
        pz: 0.64,
        rx: 0.3,
        ry: 0.8,
        rz: 0.2,
      },
    ]);
    const tpl: BakedBoulderTemplate = {
      isRareOre: false,
      isDarkMatter: false,
      isVoltaic: false,
      rockMat,
      crystalMat: null,
      orbMat: null,
      rockClusterGeo,
      snowCapGeo,
      flintVeinGeo,
      spiresGeo: null,
      coreOrbGeo: null,
      ringGeo: null,
    };
    byKind.set(kind, tpl);
    return tpl;
  }

  const crystalMat = isDarkMatter
    ? new THREE.MeshStandardMaterial({
        color: 0xf0abfc,
        emissive: 0xd946ef,
        emissiveIntensity: 1.75,
        roughness: 0.1,
        metalness: 0.85,
      })
    : isVoltaic
      ? new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x22d3ee,
          emissiveIntensity: 1.65,
          roughness: 0.12,
          metalness: 0.7,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xfdba74,
          emissive: 0xf97316,
          emissiveIntensity: 1.6,
          roughness: 0.18,
          metalness: 0.5,
        });

  const spireParts: BakedPartSpec[] = [];
  const spireCount = isDarkMatter ? 7 : 6;
  for (let i = 0; i < spireCount; i++) {
    const a = (i / spireCount) * Math.PI * 2 + 0.35;
    const dist = 0.55 + (i % 2) * 0.28;
    const h = 0.75 + (i % 3) * 0.28;
    spireParts.push({
      geo: new THREE.ConeGeometry(0.18, h, 5),
      px: Math.cos(a) * dist,
      py: 0.65 + h * 0.35,
      pz: Math.sin(a) * dist,
      rx: Math.sin(a) * 0.42,
      rz: -Math.cos(a) * 0.42,
    });
  }
  const spiresGeo = bakeAndMergeGeometries(spireParts);

  let orbMat: THREE.MeshStandardMaterial | null = null;
  let coreOrbGeo: THREE.BufferGeometry | null = null;
  let ringGeo: THREE.BufferGeometry | null = null;
  if (isDarkMatter) {
    orbMat = new THREE.MeshStandardMaterial({
      color: 0x05020a,
      emissive: 0x7e22ce,
      emissiveIntensity: 1.35,
      roughness: 0.06,
      metalness: 0.96,
    });
    coreOrbGeo = new THREE.SphereGeometry(0.36, 16, 12);
    ringGeo = new THREE.TorusGeometry(0.78, 0.036, 8, 28);
  } else if (isVoltaic) {
    ringGeo = new THREE.TorusGeometry(0.72, 0.025, 8, 24);
  }

  const tpl: BakedBoulderTemplate = {
    isRareOre: true,
    isDarkMatter,
    isVoltaic,
    rockMat,
    crystalMat,
    orbMat,
    rockClusterGeo,
    snowCapGeo: null,
    flintVeinGeo: null,
    spiresGeo,
    coreOrbGeo,
    ringGeo,
  };
  byKind.set(kind, tpl);
  return tpl;
}

export function createBoulderModel(
  palette: MaterialPalette,
  kind: BoulderKind = 'granite',
): THREE.Group {
  const tpl = getOrBuildBoulderTemplate(palette, kind);
  const group = new THREE.Group();

  addContactShadow(group, palette.contactShadowMat, tpl.isRareOre ? 1.75 : 1.42);

  const rockCluster = new THREE.Mesh(tpl.rockClusterGeo, tpl.rockMat);
  rockCluster.castShadow = true;
  rockCluster.receiveShadow = true;
  group.add(rockCluster);

  if (!tpl.isRareOre) {
    if (tpl.snowCapGeo) {
      const snowCap = new THREE.Mesh(tpl.snowCapGeo, palette.snowMat);
      snowCap.castShadow = true;
      snowCap.receiveShadow = true;
      group.add(snowCap);
    }
    if (tpl.flintVeinGeo) {
      const flintVein = new THREE.Mesh(tpl.flintVeinGeo, palette.ironMat);
      group.add(flintVein);
    }
    return group;
  }

  if (tpl.spiresGeo && tpl.crystalMat) {
    const spires = new THREE.Mesh(tpl.spiresGeo, tpl.crystalMat);
    spires.castShadow = true;
    group.add(spires);
  }

  if (tpl.isDarkMatter && tpl.coreOrbGeo && tpl.orbMat && tpl.ringGeo && tpl.crystalMat) {
    const singularityOrb = new THREE.Mesh(tpl.coreOrbGeo, tpl.orbMat);
    singularityOrb.position.set(0, 1.85, 0);
    const accretionRing = new THREE.Mesh(tpl.ringGeo, tpl.crystalMat);
    accretionRing.position.set(0, 1.85, 0);
    accretionRing.rotation.x = Math.PI * 0.36;
    group.add(singularityOrb, accretionRing);
    group.userData.coreMesh = singularityOrb;
    group.userData.ringMesh = accretionRing;
  } else if (tpl.isVoltaic && tpl.ringGeo && tpl.crystalMat) {
    const coilRing = new THREE.Mesh(tpl.ringGeo, tpl.crystalMat);
    coilRing.position.set(0, 1.25, 0);
    coilRing.rotation.x = Math.PI * 0.45;
    group.add(coilRing);
    group.userData.ringMesh = coilRing;
  }

  attachRarityHalo(
    group,
    1.75,
    tpl.isDarkMatter ? 0xd946ef : tpl.isVoltaic ? 0x22d3ee : 0xf97316,
  );

  return group;
}

/**
 * Creates the 3D "Mysteries Unknown" Singularity Shrine & Xylar the Unknown merchant podium
 * placed in Zone 4, Zone 5, and Frostcave City.
 */
export function createMysteryShrineMesh(palette: MaterialPalette): {
  group: THREE.Group;
  riftRing: THREE.Mesh;
  innerCore: THREE.Mesh;
  orbitGroup: THREE.Group;
} {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.4);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x0f071e,
    emissive: 0x3b0764,
    emissiveIntensity: 0.38,
    roughness: 0.24,
    metalness: 0.82,
  });
  const voidGlowMat = new THREE.MeshStandardMaterial({
    color: 0xf0abfc,
    emissive: 0xd946ef,
    emissiveIntensity: 1.85,
    roughness: 0.12,
    metalness: 0.65,
  });

  // Stepped Octagonal Obsidian Dais
  const baseStep1 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.85, 3.2, 0.34, 8),
    obsidianMat,
  );
  baseStep1.position.y = 0.17;
  baseStep1.receiveShadow = true;
  const baseStep2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.5, 0.32, 8),
    obsidianMat,
  );
  baseStep2.position.y = 0.48;
  baseStep2.receiveShadow = true;
  const runeRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.22, 0.04, 8, 32),
    voidGlowMat,
  );
  runeRing.rotation.x = Math.PI / 2;
  runeRing.position.y = 0.65;
  group.add(baseStep1, baseStep2, runeRing);

  // 4 Curved Obsidian Monolith Pillars framing the Rift
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = Math.cos(a) * 2.15;
    const pz = Math.sin(a) * 2.15;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.28, 3.1, 6),
      obsidianMat,
    );
    pillar.position.set(px, 1.85, pz);
    pillar.castShadow = true;
    const capGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      voidGlowMat,
    );
    capGem.position.set(px, 3.62, pz);
    group.add(pillar, capGem);
  }

  // Towering Dark-Matter Singularity Rift Portal behind Xylar
  const riftRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.095, 12, 40),
    voidGlowMat,
  );
  riftRing.position.set(0, 2.55, -0.65);

  const innerCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0x030108,
      emissive: 0x6b21a8,
      emissiveIntensity: 1.25,
      roughness: 0.05,
      metalness: 0.98,
    }),
  );
  innerCore.position.set(0, 2.55, -0.65);
  group.add(riftRing, innerCore);

  // 5 Orbiting Elemental Relics (Fire, Frost, Lightning, Poison, Dark Matter)
  const orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 2.55, -0.65);
  const elemColors = [0xf97316, 0x38bdf8, 0x22d3ee, 0x22c55e, 0xd946ef];
  for (let e = 0; e < elemColors.length; e++) {
    const a = (e / elemColors.length) * Math.PI * 2;
    const elemMat = new THREE.MeshStandardMaterial({
      color: elemColors[e],
      emissive: elemColors[e],
      emissiveIntensity: 1.75,
      roughness: 0.15,
      metalness: 0.5,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), elemMat);
    gem.position.set(Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0.18);
    orbitGroup.add(gem);
  }
  group.add(orbitGroup);

  // Xylar the Unknown — Cloaked Cosmic Arch-Merchant standing at the front altar
  const merchantRig = createCharacterRig(palette, obsidianMat, false);
  applyIceWraithVisuals(merchantRig, palette);
  merchantRig.group.position.set(0, 0.64, 0.65);
  merchantRig.group.scale.setScalar(1.16);
  group.add(merchantRig.group);

  attachRarityHalo(group, 3.25, 0xd946ef);

  return {
    group,
    riftRing,
    innerCore,
    orbitGroup,
  };
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

  const brazierPool = new THREE.Mesh(
    new THREE.PlaneGeometry(10.0, 10.0),
    palette.warmGlowMat,
  );
  brazierPool.rotation.x = -Math.PI / 2;
  brazierPool.position.y = 0.045;
  group.add(brazierPool);

  const light = new THREE.PointLight(0xffb454, 8.2, 24, 1.4);
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
  skeletalAnim?: SkeletalAnimController;
  gltfReady?: boolean;
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
  const petVisual: PetVisual = {
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

  // Upgrade companion pet visual with genuine CC0 rigged GLB
  const petModelUrl: Record<PetSpeciesId, { url: string; height: number; tintHex?: number }> = {
    snow_hare: { url: '/models/animals/hare.glb', height: 0.48 },
    arctic_fox: { url: '/models/animals/fox.glb', height: 0.68, tintHex: 0xf1f5f9 },
    snowy_owl: { url: '/models/animals/owl.glb', height: 0.72, tintHex: 0xf8fafc },
    frost_pup: { url: '/models/animals/husky.glb', height: 0.78 },
    glacial_lynx: { url: '/models/animals/snow_leopard.glb', height: 0.72, tintHex: 0xdbeafe },
    calf_mammoth: { url: '/models/animals/mammoth.glb', height: 1.32 },
  };
  const pCfg = petModelUrl[speciesId];
  if (pCfg) {
    loadGltfModelWithAnimations(pCfg.url)
      .then((loaded) => {
        const prepared = prepareNormalizedGltfAsset(
          loaded.scene,
          {
            url: pCfg.url,
            targetHeight: pCfg.height,
            yawOffset: 0,
            collisionRadius: 0.5,
            surfacePreset: speciesId === 'snowy_owl' ? 'feathers' : 'fur',
            tintHex: pCfg.tintHex,
            tintStrength: pCfg.tintHex ? 0.35 : 0,
            roughnessMin: 0.78,
            roughnessMax: 0.94,
            metalnessMax: 0.04,
            groundOffsetY: speciesId === 'snowy_owl' ? 0.42 : 0,
          },
          { furBumpMap: palette.furTrimMat.bumpMap, envMapIntensity: 0.85 },
        );
        // Physically detach procedural pet meshes (and clear legs) so zero extra limbs linger
        const existingPetChildren = [...bodyGroup.children];
        for (const child of existingPetChildren) {
          if (child !== collarMesh) {
            child.visible = false;
            bodyGroup.remove(child);
          }
        }
        petVisual.legs.length = 0;
        bodyGroup.add(prepared.lod);
        petVisual.gltfReady = true;
        if (loaded.animations.length > 0) {
          const animCtrl = new SkeletalAnimController(loaded.scene, loaded.animations, prepared.meshes);
          animCtrl.setState(speciesId === 'snowy_owl' ? 'fly' : 'idle', { fadeDuration: 0 });
          petVisual.skeletalAnim = animCtrl;
        }
      })
      .catch((err) => {
        console.warn(`Failed to load pet GLB ${speciesId}:`, err);
      });
  }

  return petVisual;
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
    const lanternPool = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      palette.warmGlowMat,
    );
    lanternPool.rotation.x = -Math.PI / 2;
    lanternPool.position.set(lx * 0.9, 0.038, lz * 0.9);
    group.add(post, arm, lantern, lanternPool);
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
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  orbitGroup: THREE.Group;
  auraRingMesh: THREE.Mesh;
  auraRingMat: THREE.MeshBasicMaterial;
  coreMat: THREE.MeshStandardMaterial;
  telegraphGroup: THREE.Group;
  telegraphFillMesh: THREE.Mesh;
  telegraphBorderMesh: THREE.Mesh;
  telegraphFillMat: THREE.MeshBasicMaterial;
  telegraphBorderMat: THREE.MeshBasicMaterial;
  innerAuraMesh?: THREE.Mesh;
  secondaryOrbitGroup?: THREE.Group;
  leftWingPivot?: THREE.Group;
  rightWingPivot?: THREE.Group;
  tailPivot?: THREE.Group;
  haloRingGroup?: THREE.Group;
  skeletalAnim?: SkeletalAnimController;
  gltfLod?: THREE.LOD;
  gltfReady?: boolean;
  proceduralGaitAssist?: boolean;
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
  const fillGeo = new THREE.CircleGeometry(1, 48);
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
  const borderGeo = new THREE.RingGeometry(0.84, 1.0, 48);
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

function createBossRuneAura(
  colorHex: number,
  innerRadius: number,
  outerRadius: number,
  segments = 48,
): {
  auraRingMesh: THREE.Mesh;
  auraRingMat: THREE.MeshBasicMaterial;
  innerAuraMesh: THREE.Mesh;
} {
  const auraRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const auraRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, segments),
    auraRingMat,
  );
  auraRingMesh.rotation.x = -Math.PI / 2;
  auraRingMesh.position.y = 0.128;

  // Inner faceted polygonal rune ring for layered magic-circle silhouette
  const innerAuraMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3.5,
    polygonOffsetUnits: -3.5,
  });
  const innerAuraMesh = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius * 0.68, innerRadius * 0.78, 8),
    innerAuraMat,
  );
  innerAuraMesh.rotation.x = -Math.PI / 2;
  innerAuraMesh.position.y = 0.132;

  return { auraRingMesh, auraRingMat, innerAuraMesh };
}

function createExtrudedShapeGeometry(
  points: Array<[number, number]>,
  depth: number,
  bevel = 0.03,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, y], idx) => {
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(0, 0, -depth * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Zone 1 Boss: Skarn, Boreal Root-Warden — ancient gnarled elderwood & mossy monolith titan.
 */
export function createTimberColossusModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.35, 0.128);

  const elderBarkMat = new THREE.MeshStandardMaterial({
    color: 0x8a694e,
    map: palette.barkMat.map,
    normalMap: palette.barkMat.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.88,
    metalness: 0.04,
  });
  const heartwoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3e2c,
    map: palette.barkMat.map,
    normalMap: palette.barkMat.normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.84,
    metalness: 0.06,
  });
  const mossStoneMat = new THREE.MeshStandardMaterial({
    color: 0x628268,
    map: palette.rockMat.map,
    normalMap: palette.rockMat.normalMap,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughness: 0.78,
    metalness: 0.12,
  });
  const evergreenMossMat = new THREE.MeshStandardMaterial({
    color: 0x265336,
    bumpMap: palette.barkMat.normalMap,
    bumpScale: 0.05,
    roughness: 0.86,
    metalness: 0.04,
  });
  const agedBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8f6940,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.03,
    roughness: 0.34,
    metalness: 0.78,
    envMapIntensity: 1.35,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffc324,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.45,
    roughness: 0.2,
    metalness: 0.28,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0xf59e0b,
    2.2,
    2.68,
    48,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Articulated gnarled trunk legs with bronze knee-clamps and 3 spreading root toes
  const makeColossusLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.76, 1.38, 0);

    const hipJoint = new THREE.Mesh(
      createCraggyRockGeometry(0.44, 1, side === -1 ? 2 : 5),
      mossStoneMat,
    );
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.36, 0.72, 9),
      elderBarkMat,
    );
    thigh.position.set(0, -0.34, 0);
    thigh.castShadow = true;

    const kneeClamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.44, 0.24, 8),
      agedBronzeMat,
    );
    kneeClamp.position.set(0, -0.68, 0.04);
    kneeClamp.castShadow = true;

    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.62, 0.72, 9),
      heartwoodMat,
    );
    shin.position.set(0, -1.02, 0);
    shin.castShadow = true;

    const footBase = new THREE.Mesh(
      createCraggyRockGeometry(0.52, 1, side === -1 ? 3 : 9),
      mossStoneMat,
    );
    footBase.scale.set(1.08, 0.48, 1.32);
    footBase.position.set(side * 0.03, -1.22, 0.16);
    footBase.castShadow = true;

    legPivot.add(hipJoint, thigh, kneeClamp, shin, footBase);
    for (let t = -1; t <= 1; t++) {
      const rootToe = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(t * 0.16, -1.16, 0.25),
            new THREE.Vector3(t * 0.28, -1.26, 0.54),
            new THREE.Vector3(t * 0.36, -1.32, 0.78),
          ],
          0.16,
          0.05,
          8,
          6,
        ),
        elderBarkMat,
      );
      rootToe.castShadow = true;
      legPivot.add(rootToe);
    }
    return legPivot;
  };
  const leftLegPivot = makeColossusLeg(-1);
  const rightLegPivot = makeColossusLeg(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Sculpted Waist Belt + Massive Elderwood Trunk Torso + Hollowed Hearth Cage
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.88, 0.34, 10),
    agedBronzeMat,
  );
  belt.position.set(0, 1.4, 0);
  belt.castShadow = true;

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(1.24, 0.88, 1.78, 10),
    elderBarkMat,
  );
  torso.position.set(0, 2.15, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(belt, torso);

  // Overlapping back bark buttress + mossy monolith ridge spines
  for (let b = 0; b < 3; b++) {
    const backSpire = new THREE.Mesh(
      createCraggyRockGeometry(0.48 - b * 0.06, 1, 31 + b * 7),
      mossStoneMat,
    );
    backSpire.scale.set(0.85, 1.45, 0.7);
    backSpire.position.set((b - 1) * 0.52, 2.75 + (b === 1 ? 0.28 : 0), -0.82);
    backSpire.rotation.x = -0.28;
    backSpire.castShadow = true;
    bodyPivot.add(backSpire);
  }

  // Carved Heartwood Hearth Cavity + Pulsing Amber Core + Ribcage Struts
  const hearthCavity = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 0.42, 8),
    heartwoodMat,
  );
  hearthCavity.rotation.x = Math.PI / 2;
  hearthCavity.position.set(0, 2.18, 0.82);

  const chestCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 0),
    coreMat,
  );
  chestCore.scale.set(0.95, 1.32, 0.78);
  chestCore.position.set(0, 2.18, 0.96);
  bodyPivot.add(hearthCavity, chestCore);

  for (const side of [-1, 1] as const) {
    for (let r = 0; r < 2; r++) {
      const rib = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 0.92, 1.98 + r * 0.38, 0.44),
            new THREE.Vector3(side * 0.62, 1.96 + r * 0.36, 0.94),
            new THREE.Vector3(side * 0.22, 2.02 + r * 0.34, 1.08),
          ],
          0.11,
          0.07,
          8,
          6,
        ),
        agedBronzeMat,
      );
      rib.castShadow = true;
      bodyPivot.add(rib);
    }

    // Colossal Moss-Boulder Pauldrons Crowned with Evergreen Boughs
    const pauldron = new THREE.Mesh(
      createCraggyRockGeometry(0.82, 1, side === -1 ? 11 : 17),
      mossStoneMat,
    );
    pauldron.scale.set(1.18, 0.88, 1.12);
    pauldron.position.set(side * 1.42, 2.84, -0.02);
    pauldron.castShadow = true;

    const shoulderMoss = new THREE.Mesh(
      createSculptedTreeTierGeometry(0.62, 0.75, side === -1 ? 4 : 7),
      evergreenMossMat,
    );
    shoulderMoss.position.set(side * 1.46, 3.36, -0.04);
    shoulderMoss.rotation.z = -side * 0.16;
    shoulderMoss.castShadow = true;

    const shoulderRune = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      coreMat,
    );
    shoulderRune.position.set(side * 1.5, 2.86, 0.72);
    bodyPivot.add(pauldron, shoulderMoss, shoulderRune);
  }

  // Sculpted Horned Elderwood Spirit Head + Multi-Tined Antlers + Amber Visor
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.28, 0.18);

  const skull = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.64, 1),
    elderBarkMat,
  );
  skull.scale.set(1.06, 0.96, 1.14);
  skull.castShadow = true;

  const browPlate = new THREE.Mesh(
    createCraggyRockGeometry(0.46, 1, 41),
    mossStoneMat,
  );
  browPlate.scale.set(1.25, 0.46, 0.82);
  browPlate.position.set(0, 0.26, 0.34);
  browPlate.castShadow = true;

  const beardRoot = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.72, 7),
    heartwoodMat,
  );
  beardRoot.rotation.x = Math.PI - 0.12;
  beardRoot.position.set(0, -0.42, 0.38);
  beardRoot.castShadow = true;
  headPivot.add(skull, browPlate, beardRoot);

  for (const side of [-1, 1] as const) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), coreMat);
    eye.scale.set(1.2, 0.75, 0.8);
    eye.position.set(side * 0.24, 0.06, 0.6);

    const antlerMain = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(side * 0.26, 0.34, 0.04),
          new THREE.Vector3(side * 0.72, 0.78, -0.06),
          new THREE.Vector3(side * 1.08, 1.38, -0.22),
          new THREE.Vector3(side * 0.92, 1.72, -0.05),
        ],
        0.16,
        0.04,
        12,
        8,
      ),
      elderBarkMat,
    );
    antlerMain.castShadow = true;

    const antlerTine = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(side * 0.68, 0.74, -0.06),
          new THREE.Vector3(side * 0.58, 1.15, 0.26),
        ],
        0.09,
        0.03,
        8,
        6,
      ),
      elderBarkMat,
    );
    antlerTine.castShadow = true;

    const tipBud = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), coreMat);
    tipBud.position.set(side * 0.92, 1.74, -0.04);
    const tineBud = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), coreMat);
    tineBud.position.set(side * 0.58, 1.18, 0.28);

    headPivot.add(eye, antlerMain, antlerTine, tipBud, tineBud);
  }
  bodyPivot.add(headPivot);

  // Left Arm: Knotted Root-Gauntlet + Amber Knuckle Ward; Right Arm: Elderwood Greatmaul
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.54, 2.6, 0.08);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.27, 0.96, 8),
    elderBarkMat,
  );
  leftUpper.position.y = -0.48;
  leftUpper.castShadow = true;
  const leftBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.2, 8),
    agedBronzeMat,
  );
  leftBand.position.y = -0.82;
  const leftFist = new THREE.Mesh(
    createCraggyRockGeometry(0.54, 1, 21),
    mossStoneMat,
  );
  leftFist.scale.set(1.06, 1.24, 1.12);
  leftFist.position.set(0, -1.32, 0.14);
  leftFist.castShadow = true;
  const leftKnuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
  leftKnuckle.position.set(0, -1.36, 0.58);
  leftArmPivot.add(leftUpper, leftBand, leftFist, leftKnuckle);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.54, 2.6, 0.08);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.27, 0.96, 8),
    elderBarkMat,
  );
  rightUpper.position.y = -0.48;
  rightUpper.castShadow = true;
  const rightFist = new THREE.Mesh(
    createCraggyRockGeometry(0.48, 1, 27),
    mossStoneMat,
  );
  rightFist.position.set(0, -1.24, 0.12);
  rightFist.castShadow = true;

  // Root-Bound Timber Greatmaul
  const maulHaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 2.35, 8),
    heartwoodMat,
  );
  maulHaft.rotation.x = Math.PI / 2;
  maulHaft.position.set(0, -1.24, 0.56);
  maulHaft.castShadow = true;

  const maulHead = new THREE.Mesh(
    createCraggyRockGeometry(0.64, 1, 53),
    mossStoneMat,
  );
  maulHead.scale.set(0.95, 1.0, 1.38);
  maulHead.position.set(0, -1.24, 1.62);
  maulHead.castShadow = true;

  const maulCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.34, 8),
    agedBronzeMat,
  );
  maulCollar.rotation.x = Math.PI / 2;
  maulCollar.position.set(0, -1.24, 1.58);

  const maulCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), coreMat);
  maulCore.position.set(0, -1.24, 2.26);

  rightArmPivot.add(rightUpper, rightFist, maulHaft, maulHead, maulCollar, maulCore);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Amber Sap Crystals & Mossy Runestones
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.25;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const mote = new THREE.Mesh(
      i % 2 === 0 ? new THREE.OctahedronGeometry(0.2, 0) : createCraggyRockGeometry(0.2, 0, i + 7),
      i % 2 === 0 ? coreMat : mossStoneMat,
    );
    mote.position.set(Math.cos(a) * 2.25, Math.sin(i * 1.4) * 0.34, Math.sin(a) * 2.25);
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
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 2 Boss: Veyra, Cryo-Sovereign — levitating glacial crystal seraph empress.
 */
export function createCryoSovereignModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.05, 0.128);

  const glacialArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0c4a6e,
    bumpMap: palette.iceMat.bumpMap,
    bumpScale: 0.045,
    roughness: 0.26,
    metalness: 0.68,
    envMapIntensity: 1.4,
  });
  const frostSilverMat = new THREE.MeshStandardMaterial({
    color: 0xcbe9f9,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.025,
    roughness: 0.22,
    metalness: 0.84,
    envMapIntensity: 1.5,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    map: palette.iceMat.map,
    bumpMap: palette.iceMat.bumpMap,
    bumpScale: 0.04,
    emissive: 0x0284c7,
    emissiveIntensity: 1.08,
    roughness: 0.14,
    metalness: 0.4,
    envMapIntensity: 1.45,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.65,
    roughness: 0.18,
    metalness: 0.36,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0x38bdf8,
    2.1,
    2.55,
    48,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.38;
  group.add(bodyPivot);

  // Scalloped 8-Panel Faceted Glacial Dress Skirt + Silver Filigree Trim
  const robeCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 2.05, 8),
    glacialArmorMat,
  );
  robeCore.rotation.x = Math.PI;
  robeCore.position.y = 1.25;
  robeCore.castShadow = true;
  bodyPivot.add(robeCore);

  for (let p = 0; p < 8; p++) {
    const angle = (p / 8) * Math.PI * 2;
    const petalPivot = new THREE.Group();
    petalPivot.position.y = 1.26;
    petalPivot.rotation.y = angle;
    const petal = new THREE.Mesh(
      createExtrudedShapeGeometry(
        [
          [-0.22, 0.84],
          [0.22, 0.84],
          [0.34, -0.78],
          [0, -1.12],
          [-0.34, -0.78],
        ],
        0.08,
        0.02,
      ),
      p % 2 === 0 ? glacialArmorMat : crystalMat,
    );
    petal.position.set(0, 0, 0.74);
    petal.rotation.x = -0.26;
    petal.castShadow = true;
    petalPivot.add(petal);
    bodyPivot.add(petalPivot);
  }

  const waistRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.075, 8, 24),
    frostSilverMat,
  );
  waistRing.rotation.x = Math.PI / 2;
  waistRing.position.y = 2.04;
  bodyPivot.add(waistRing);

  // Floating Crystal Leg Blades
  const makeCryoLegTasset = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.48, 1.38, 0.14);
    const crystalGreave = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 1.18, 5),
      crystalMat,
    );
    crystalGreave.rotation.x = Math.PI;
    crystalGreave.position.set(0, -0.56, 0);
    crystalGreave.castShadow = true;
    const silverKnee = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      frostSilverMat,
    );
    silverKnee.position.set(0, -0.25, 0.14);
    legPivot.add(crystalGreave, silverKnee);
    return legPivot;
  };
  const leftLegPivot = makeCryoLegTasset(-1);
  const rightLegPivot = makeCryoLegTasset(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Armored Corset Bust + Silver Mantle Collar + Violet Cryo Heart
  const bust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.5, 1.14, 8),
    glacialArmorMat,
  );
  bust.position.y = 2.58;
  bust.castShadow = true;

  const collarCrescent = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.08, 8, 22, Math.PI * 1.25),
    frostSilverMat,
  );
  collarCrescent.position.set(0, 3.05, -0.14);
  collarCrescent.rotation.set(0.35, 0, Math.PI * 0.875);

  const heartGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), coreMat);
  heartGem.scale.set(0.85, 1.35, 0.72);
  heartGem.position.set(0, 2.58, 0.65);
  bodyPivot.add(bust, collarCrescent, heartGem);

  // Articulated Multi-Feather Glacial Seraph Wings
  const makeCryoWing = (side: -1 | 1): THREE.Group => {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(side * 0.56, 2.86, -0.44);

    const wingSpine = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.65, 0.42, -0.12),
          new THREE.Vector3(side * 1.45, 0.68, -0.24),
        ],
        0.1,
        0.04,
        10,
        6,
      ),
      frostSilverMat,
    );
    wingPivot.add(wingSpine);

    for (let f = 0; f < 4; f++) {
      const feather = new THREE.Mesh(
        createExtrudedShapeGeometry(
          [
            [-0.12, 0],
            [0.12, 0],
            [0.2, 0.95 - f * 0.14],
            [0, 1.42 - f * 0.18],
            [-0.2, 0.95 - f * 0.14],
          ],
          0.06,
          0.015,
        ),
        f % 2 === 0 ? crystalMat : coreMat,
      );
      feather.position.set(
        side * (0.45 + f * 0.34),
        0.26 - f * 0.14,
        -0.1 - f * 0.04,
      );
      feather.rotation.z = -side * (0.68 + f * 0.24);
      feather.rotation.x = -0.14;
      feather.castShadow = true;
      wingPivot.add(feather);
    }
    return wingPivot;
  };
  const leftWingPivot = makeCryoWing(-1);
  const rightWingPivot = makeCryoWing(1);
  bodyPivot.add(leftWingPivot, rightWingPivot);

  // Crowned Cryo-Helm Head Pivot + Rotating Frost Halo Ring
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.48, 0.06);
  const helm = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), glacialArmorMat);
  helm.scale.set(0.95, 1.15, 1.02);
  helm.castShadow = true;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.14), coreMat);
  visor.position.set(0, 0.04, 0.44);
  headPivot.add(helm, visor);

  const haloRingGroup = new THREE.Group();
  haloRingGroup.position.set(0, 0.28, -0.28);
  const outerHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.04, 8, 32),
    crystalMat,
  );
  haloRingGroup.add(outerHalo);
  for (let h = 0; h < 6; h++) {
    const a = (h / 6) * Math.PI * 2;
    const pip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      h % 2 === 0 ? coreMat : frostSilverMat,
    );
    pip.position.set(Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0);
    haloRingGroup.add(pip);
  }
  headPivot.add(haloRingGroup);

  for (let c = -2; c <= 2; c++) {
    const crownSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.56 - Math.abs(c) * 0.09, 5),
      c === 0 ? coreMat : frostSilverMat,
    );
    crownSpire.position.set(c * 0.16, 0.6 - Math.abs(c) * 0.05, 0.06);
    crownSpire.rotation.z = -c * 0.16;
    headPivot.add(crownSpire);
  }
  bodyPivot.add(headPivot);

  // Articulated Gauntlet Arms: Left Floating Cryo Grimoire Prism, Right Sovereign Scepter
  const makeCryoArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 1.04, 2.78, 0.12);
    const pauldron = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.52, 6),
      frostSilverMat,
    );
    pauldron.rotation.z = -side * 0.65;
    pauldron.position.set(side * 0.08, 0.05, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 0.96, 7),
      glacialArmorMat,
    );
    sleeve.position.y = -0.52;
    sleeve.castShadow = true;
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 5), crystalMat);
    claw.rotation.x = Math.PI;
    claw.position.set(0, -1.16, 0.12);
    armPivot.add(pauldron, sleeve, claw);
    return armPivot;
  };
  const leftArmPivot = makeCryoArm(-1);
  const cryoFocus = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), coreMat);
  cryoFocus.position.set(-0.08, -1.05, 0.55);
  const cryoFocusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.035, 6, 20),
    frostSilverMat,
  );
  cryoFocusRing.position.set(-0.08, -1.05, 0.55);
  leftArmPivot.add(cryoFocus, cryoFocusRing);

  const rightArmPivot = makeCryoArm(1);
  const scepterShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.058, 2.65, 8),
    frostSilverMat,
  );
  scepterShaft.position.set(0, -0.82, 0.42);
  scepterShaft.rotation.x = 1.2;
  const scepterCradle = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.045, 8, 20, Math.PI * 1.35),
    frostSilverMat,
  );
  scepterCradle.position.set(0, -0.32, 1.58);
  scepterCradle.rotation.z = -Math.PI * 0.17;
  const scepterOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), coreMat);
  scepterOrb.position.set(0, -0.32, 1.58);
  rightArmPivot.add(scepterShaft, scepterCradle, scepterOrb);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Dual Concentric Orbiting Glacial Shards
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.35;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.19, 0),
      i % 2 === 0 ? crystalMat : coreMat,
    );
    shard.scale.set(0.75, 1.6, 0.75);
    shard.position.set(Math.cos(a) * 2.05, Math.sin(i) * 0.24, Math.sin(a) * 2.05);
    orbitGroup.add(shard);
  }
  const secondaryOrbitGroup = new THREE.Group();
  secondaryOrbitGroup.position.y = 2.4;
  secondaryOrbitGroup.rotation.z = 0.28;
  const frostOrbRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.28, 0.035, 6, 44),
    crystalMat,
  );
  frostOrbRing.rotation.x = Math.PI / 2;
  secondaryOrbitGroup.add(frostOrbRing);
  bodyPivot.add(orbitGroup, secondaryOrbitGroup);

  const telegraph = createBossGroundTelegraph(0x38bdf8);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    secondaryOrbitGroup,
    leftWingPivot,
    rightWingPivot,
    haloRingGroup,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 3 Boss: Malakor, Rimefang Dread-Wyrm — abyssal winged dragon-gargoyle overlord.
 */
export function createRimefangWyrmModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.55, 0.128);

  const abyssalScaleMat = new THREE.MeshStandardMaterial({
    color: 0x211d42,
    normalMap: palette.rockMat.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.38,
    metalness: 0.6,
    envMapIntensity: 1.25,
  });
  const paleBoneMat = new THREE.MeshStandardMaterial({
    color: 0x9aa6c4,
    bumpMap: palette.furTrimMat.bumpMap,
    bumpScale: 0.03,
    roughness: 0.34,
    metalness: 0.74,
    envMapIntensity: 1.2,
  });
  const wingMembraneMat = new THREE.MeshStandardMaterial({
    color: 0x312e81,
    emissive: 0x3730a3,
    emissiveIntensity: 0.5,
    roughness: 0.38,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    emissive: 0x4f46e5,
    emissiveIntensity: 1.7,
    roughness: 0.18,
    metalness: 0.35,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0x6366f1,
    2.28,
    2.76,
    48,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Digitigrade Clawed Wyrm Hindlegs
  const makeWyrmLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.78, 1.38, -0.04);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.3, 0.78, 8),
      abyssalScaleMat,
    );
    thigh.position.set(0, -0.34, 0.08);
    thigh.rotation.x = -0.22;
    thigh.castShadow = true;

    const hock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.32, 0.76, 8),
      abyssalScaleMat,
    );
    hock.position.set(0, -0.95, -0.06);
    hock.rotation.x = 0.25;
    hock.castShadow = true;

    const footPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.24, 0.62),
      abyssalScaleMat,
    );
    footPad.position.set(0, -1.26, 0.12);
    footPad.castShadow = true;
    legPivot.add(thigh, hock, footPad);

    for (let t = -1; t <= 1; t++) {
      const talon = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.44, 5),
        paleBoneMat,
      );
      talon.rotation.x = Math.PI * 0.48;
      talon.position.set(t * 0.16, -1.28, 0.54);
      talon.castShadow = true;
      legPivot.add(talon);
    }
    return legPivot;
  };
  const leftLegPivot = makeWyrmLeg(-1);
  const rightLegPivot = makeWyrmLeg(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Armored Draconic Thorax + Sternum Rime-Fissure + Dorsal Spine Crests
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 0.74, 1.82, 8),
    abyssalScaleMat,
  );
  chest.position.set(0, 2.15, 0.04);
  chest.castShadow = true;

  const sternumCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    coreMat,
  );
  sternumCore.scale.set(0.88, 1.45, 0.7);
  sternumCore.position.set(0, 2.24, 0.88);
  bodyPivot.add(chest, sternumCore);

  for (let i = 0; i < 4; i++) {
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.22 - i * 0.14, 0.2, 0.34),
      paleBoneMat,
    );
    chestPlate.position.set(0, 1.62 + i * 0.32, 0.68 + i * 0.04);
    chestPlate.rotation.x = 0.2;
    bodyPivot.add(chestPlate);

    const dorsalSpine = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.65 - i * 0.06, 5),
      i % 2 === 0 ? paleBoneMat : coreMat,
    );
    dorsalSpine.position.set(0, 2.86 - i * 0.36, -0.78 - i * 0.08);
    dorsalSpine.rotation.x = -0.95;
    dorsalSpine.castShadow = true;
    bodyPivot.add(dorsalSpine);
  }

  // Articulated Spiked S-Curved Dread-Wyrm Tail
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 1.42, -0.58);
  const tailMesh = new THREE.Mesh(
    createTaperedCurveGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.28, -0.25, -0.95),
        new THREE.Vector3(-0.35, -0.18, -1.95),
        new THREE.Vector3(0.18, 0.22, -2.85),
      ],
      0.34,
      0.08,
      14,
      8,
    ),
    abyssalScaleMat,
  );
  tailMesh.castShadow = true;
  const tailStinger = new THREE.Mesh(
    createExtrudedShapeGeometry(
      [
        [-0.24, 0],
        [0.24, 0],
        [0, 0.68],
      ],
      0.08,
      0.02,
    ),
    coreMat,
  );
  tailStinger.rotation.x = -Math.PI * 0.42;
  tailStinger.position.set(0.18, 0.22, -2.92);
  tailPivot.add(tailMesh, tailStinger);
  bodyPivot.add(tailPivot);

  // Massive Articulated Wyrm Bat Wings (Bone Struts + Translucent Indigo Membrane)
  const makeWyrmWing = (side: -1 | 1): THREE.Group => {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(side * 0.64, 2.84, -0.52);

    const upperArm = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.78, 0.68, -0.12),
          new THREE.Vector3(side * 1.48, 1.38, -0.2),
        ],
        0.13,
        0.07,
        10,
        6,
      ),
      paleBoneMat,
    );
    upperArm.castShadow = true;

    const elbowSpur = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.48, 5),
      coreMat,
    );
    elbowSpur.position.set(side * 1.48, 1.56, -0.18);
    elbowSpur.rotation.z = -side * 0.35;

    const fingerConfigs: Array<[number, number, number]> = [
      [2.68, 1.62, -0.28],
      [2.52, 0.65, -0.22],
      [1.82, -0.25, -0.18],
    ];
    for (const [fx, fy, fz] of fingerConfigs) {
      const spar = new THREE.Mesh(
        createTaperedCurveGeometry(
          [
            new THREE.Vector3(side * 1.44, 1.32, -0.18),
            new THREE.Vector3(side * fx, fy, fz),
          ],
          0.07,
          0.025,
          6,
          5,
        ),
        paleBoneMat,
      );
      spar.castShadow = true;
      wingPivot.add(spar);
    }

    const membrane = new THREE.Mesh(
      createExtrudedShapeGeometry(
        [
          [0, 0],
          [side * 1.46, 1.34],
          [side * 2.66, 1.6],
          [side * 2.5, 0.64],
          [side * 1.8, -0.24],
          [side * 0.55, -0.68],
        ],
        0.04,
        0.01,
      ),
      wingMembraneMat,
    );
    membrane.position.z = -0.2;
    membrane.castShadow = true;

    wingPivot.add(upperArm, elbowSpur, membrane);
    return wingPivot;
  };
  const leftWingPivot = makeWyrmWing(-1);
  const rightWingPivot = makeWyrmWing(1);
  bodyPivot.add(leftWingPivot, rightWingPivot);

  // Armored Draconic Neck + Horned Gargoyle Skull + Glowing Jaw & Swept Horns
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.52, 0.72, 8),
    abyssalScaleMat,
  );
  neck.position.set(0, 3.18, 0.22);
  neck.rotation.x = 0.42;
  neck.castShadow = true;
  bodyPivot.add(neck);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.54, 0.44);
  const cranium = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.52, 1),
    abyssalScaleMat,
  );
  cranium.scale.set(0.94, 0.86, 1.28);
  cranium.castShadow = true;

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.3, 0.68),
    abyssalScaleMat,
  );
  snout.position.set(0, -0.02, 0.56);
  snout.castShadow = true;

  const lowerJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.14, 0.56),
    paleBoneMat,
  );
  lowerJaw.position.set(0, -0.22, 0.5);
  lowerJaw.rotation.x = 0.18;
  headPivot.add(cranium, snout, lowerJaw);

  for (const side of [-1, 1] as const) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), coreMat);
    eye.scale.set(1.3, 0.65, 0.9);
    eye.position.set(side * 0.22, 0.1, 0.54);

    const horn = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(side * 0.24, 0.26, 0.02),
          new THREE.Vector3(side * 0.58, 0.62, -0.36),
          new THREE.Vector3(side * 0.72, 1.12, -0.82),
        ],
        0.15,
        0.03,
        10,
        7,
      ),
      paleBoneMat,
    );
    horn.castShadow = true;

    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), paleBoneMat);
    fang.rotation.x = Math.PI;
    fang.position.set(side * 0.14, -0.18, 0.78);

    // Sculpted layered dragon-scale shoulder dome + bone ridge horn (replaces flat wall block)
    const pauldronDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      abyssalScaleMat,
    );
    pauldronDome.position.set(side * 1.24, 2.78, 0.02);
    pauldronDome.rotation.z = -side * 0.45;
    pauldronDome.castShadow = true;

    const pauldronSpur = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.72, 5),
      paleBoneMat,
    );
    pauldronSpur.position.set(side * 1.44, 3.24, -0.06);
    pauldronSpur.rotation.z = -side * 0.58;
    pauldronSpur.castShadow = true;

    bodyPivot.add(pauldronDome, pauldronSpur);
    headPivot.add(eye, horn, fang);
  }
  bodyPivot.add(headPivot);

  // Clawed Left Gauntlet + Right Dread-Wyrm Abyssal Halberd-Glaive
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.38, 2.58, 0.1);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 1.05, 8),
    abyssalScaleMat,
  );
  leftUpper.position.y = -0.52;
  leftUpper.castShadow = true;
  const leftGauntlet = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.56, 0.44),
    paleBoneMat,
  );
  leftGauntlet.position.set(0, -1.18, 0.1);
  leftArmPivot.add(leftUpper, leftGauntlet);
  for (let c = -1; c <= 1; c++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.42, 4), coreMat);
    claw.rotation.x = Math.PI * 0.72;
    claw.position.set(c * 0.12, -1.52, 0.26);
    leftArmPivot.add(claw);
  }

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.38, 2.58, 0.1);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 1.05, 8),
    abyssalScaleMat,
  );
  rightUpper.position.y = -0.52;
  rightUpper.castShadow = true;
  const rightGauntlet = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.52, 0.42),
    paleBoneMat,
  );
  rightGauntlet.position.set(0, -1.16, 0.1);

  // Forged Dread-Wyrm Halberd / Glaive angled heroically
  const glaiveGroup = new THREE.Group();
  glaiveGroup.position.set(0, -1.16, 0.18);
  glaiveGroup.rotation.x = 0.88;
  glaiveGroup.rotation.z = -0.14;

  const glaiveShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.075, 3.15, 8),
    abyssalScaleMat,
  );
  glaiveShaft.position.y = 0.62;
  glaiveShaft.castShadow = true;

  const glaiveCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.24, 6),
    paleBoneMat,
  );
  glaiveCollar.position.y = 1.65;

  const glaiveSpine = new THREE.Mesh(
    createExtrudedShapeGeometry(
      [
        [-0.08, 0],
        [0.18, 0.22],
        [0.42, 0.65],
        [0.06, 1.25],
        [-0.1, 0.82],
      ],
      0.08,
      0.02,
    ),
    paleBoneMat,
  );
  glaiveSpine.rotation.y = Math.PI / 2;
  glaiveSpine.position.set(0, 1.68, 0);
  glaiveSpine.castShadow = true;

  const glaiveRazorEdge = new THREE.Mesh(
    createExtrudedShapeGeometry(
      [
        [0.24, 0.22],
        [0.54, 0.68],
        [0.14, 1.32],
        [0.08, 1.1],
        [0.34, 0.66],
      ],
      0.04,
      0.01,
    ),
    coreMat,
  );
  glaiveRazorEdge.rotation.y = Math.PI / 2;
  glaiveRazorEdge.position.set(0, 1.68, 0);

  glaiveGroup.add(glaiveShaft, glaiveCollar, glaiveSpine, glaiveRazorEdge);
  rightArmPivot.add(rightUpper, rightGauntlet, glaiveGroup);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Rimefang Crystal Daggers
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.35;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dagger = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.62, 4), coreMat);
    dagger.position.set(Math.cos(a) * 2.25, Math.sin(i * 1.3) * 0.3, Math.sin(a) * 2.25);
    dagger.rotation.x = Math.PI;
    orbitGroup.add(dagger);
  }
  bodyPivot.add(orbitGroup);

  const telegraph = createBossGroundTelegraph(0x6366f1);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    leftWingPivot,
    rightWingPivot,
    tailPivot,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 4 Boss: Ulthar, Obsidian Behemoth — volcanic permafrost caldera colossus.
 */
export function createObsidianBehemothModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.85, 0.128);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x241920,
    normalMap: palette.rockMat.normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.32,
    metalness: 0.74,
    envMapIntensity: 1.4,
  });
  const basaltSlabMat = new THREE.MeshStandardMaterial({
    color: 0x5c444d,
    map: palette.rockMat.map,
    normalMap: palette.rockMat.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.8,
    metalness: 0.16,
  });
  const crimsonBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x7d303d,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.03,
    roughness: 0.36,
    metalness: 0.78,
    envMapIntensity: 1.4,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0.25,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0xf43f5e,
    2.45,
    2.98,
    48,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Pillar Volcanic Monolith Legs with Magma Seam Knee-Guards
  const makeBehemothLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.88, 1.48, 0);

    const upperPillar = new THREE.Mesh(
      createCraggyRockGeometry(0.56, 1, side === -1 ? 13 : 19),
      obsidianMat,
    );
    upperPillar.scale.set(0.95, 1.25, 0.95);
    upperPillar.position.set(0, -0.35, 0);
    upperPillar.castShadow = true;

    const magmaJoint = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8),
      coreMat,
    );
    magmaJoint.position.set(0, -0.78, 0);

    const lowerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.62, 0.75, 7),
      basaltSlabMat,
    );
    lowerPillar.position.set(0, -1.08, 0);
    lowerPillar.castShadow = true;

    const boulderFoot = new THREE.Mesh(
      createCraggyRockGeometry(0.62, 1, side === -1 ? 23 : 29),
      obsidianMat,
    );
    boulderFoot.scale.set(1.12, 0.52, 1.38);
    boulderFoot.position.set(0, -1.32, 0.18);
    boulderFoot.castShadow = true;

    legPivot.add(upperPillar, magmaJoint, lowerPillar, boulderFoot);
    return legPivot;
  };
  const leftLegPivot = makeBehemothLeg(-1);
  const rightLegPivot = makeBehemothLeg(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Broad Volcanic Caldera Torso Split by Glowing Crimson Magma Fissure
  const waist = new THREE.Mesh(
    new THREE.CylinderGeometry(0.98, 0.84, 0.55, 8),
    crimsonBronzeMat,
  );
  waist.position.set(0, 1.56, 0);

  const innerMagmaCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.84, 1),
    coreMat,
  );
  innerMagmaCore.scale.set(1.05, 1.22, 0.85);
  innerMagmaCore.position.set(0, 2.38, 0.22);

  bodyPivot.add(waist, innerMagmaCore);

  for (const side of [-1, 1] as const) {
    // Split Left/Right Obsidian Chest Carapace Halves Revealing Glowing Magma Fissure
    const chestHalf = new THREE.Mesh(
      createCraggyRockGeometry(0.95, 1, side === -1 ? 37 : 43),
      obsidianMat,
    );
    chestHalf.scale.set(0.92, 1.15, 0.95);
    chestHalf.position.set(side * 0.66, 2.42, 0.08);
    chestHalf.castShadow = true;
    bodyPivot.add(chestHalf);

    // Colossal Spiked Volcanic Shoulder Monoliths
    const shoulderSlab = new THREE.Mesh(
      createCraggyRockGeometry(0.94, 1, side === -1 ? 47 : 59),
      basaltSlabMat,
    );
    shoulderSlab.scale.set(1.25, 0.96, 1.12);
    shoulderSlab.position.set(side * 1.58, 3.06, -0.02);
    shoulderSlab.castShadow = true;

    const shoulderCrystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.96, 5),
      coreMat,
    );
    shoulderCrystal.position.set(side * 1.72, 3.74, -0.08);
    shoulderCrystal.rotation.z = -side * 0.32;
    shoulderCrystal.castShadow = true;
    bodyPivot.add(shoulderSlab, shoulderCrystal);
  }

  // 4 Jagged Volcanic Dorsal Spires along Upper Back
  for (let s = 0; s < 4; s++) {
    const offset = (s - 1.5) * 0.54;
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 1.38 - Math.abs(offset) * 0.25, 5),
      obsidianMat,
    );
    spire.position.set(offset, 3.35, -0.78);
    spire.rotation.x = -0.36;
    spire.rotation.z = -offset * 0.22;
    spire.castShadow = true;

    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), coreMat);
    tip.position.set(offset * 1.15, 3.92 - Math.abs(offset) * 0.14, -1.04);
    bodyPivot.add(spire, tip);
  }

  // Volcanic Horned Juggernaut Visage + Jaw Tusks (elevated forward for heroic read)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.58, 0.42);

  const helmBlock = new THREE.Mesh(
    createCraggyRockGeometry(0.62, 1, 61),
    obsidianMat,
  );
  helmBlock.scale.set(1.08, 0.92, 1.1);
  helmBlock.castShadow = true;

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.22), coreMat);
  visor.position.set(0, 0.08, 0.56);
  headPivot.add(helmBlock, visor);

  for (const side of [-1, 1] as const) {
    const crownHorn = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(side * 0.32, 0.3, 0.05),
          new THREE.Vector3(side * 0.68, 0.68, 0.14),
          new THREE.Vector3(side * 0.52, 1.12, 0.34),
        ],
        0.16,
        0.04,
        10,
        7,
      ),
      crimsonBronzeMat,
    );
    crownHorn.castShadow = true;

    const jawTusk = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.44, 5),
      coreMat,
    );
    jawTusk.position.set(side * 0.24, -0.26, 0.58);
    jawTusk.rotation.x = 0.28;
    headPivot.add(crownHorn, jawTusk);
  }
  bodyPivot.add(headPivot);

  // Brutal Asymmetrical Siege Arms: Left Obsidian Caldera-Fist, Right Vertical Caldera Great-Cleaver
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.74, 2.75, 0.1);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.32, 1.04, 7),
    basaltSlabMat,
  );
  leftUpper.position.y = -0.52;
  leftUpper.castShadow = true;
  const leftFist = new THREE.Mesh(
    createCraggyRockGeometry(0.66, 1, 71),
    obsidianMat,
  );
  leftFist.scale.set(1.12, 1.22, 1.18);
  leftFist.position.set(0, -1.34, 0.16);
  leftFist.castShadow = true;
  const leftMagmaCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), coreMat);
  leftMagmaCore.position.set(0, -1.34, 0.62);
  leftArmPivot.add(leftUpper, leftFist, leftMagmaCore);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.74, 2.75, 0.1);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.32, 1.04, 7),
    basaltSlabMat,
  );
  rightUpper.position.y = -0.52;
  rightUpper.castShadow = true;
  const rightGauntlet = new THREE.Mesh(
    createCraggyRockGeometry(0.56, 1, 73),
    obsidianMat,
  );
  rightGauntlet.position.set(0, -1.25, 0.14);
  rightGauntlet.castShadow = true;

  // Jagged Caldera Great-Cleaver oriented vertically in strike plane
  const cleaverGroup = new THREE.Group();
  cleaverGroup.position.set(0, -1.24, 0.18);
  cleaverGroup.rotation.x = 1.18;

  const cleaverShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 2.5, 7),
    crimsonBronzeMat,
  );
  cleaverShaft.position.y = 0.56;
  cleaverShaft.castShadow = true;

  const cleaverBlade = new THREE.Mesh(
    createExtrudedShapeGeometry(
      [
        [-0.08, -0.32],
        [0.46, -0.22],
        [0.62, 0.75],
        [0.18, 1.25],
        [-0.1, 0.85],
      ],
      0.16,
      0.03,
    ),
    obsidianMat,
  );
  cleaverBlade.rotation.y = Math.PI / 2;
  cleaverBlade.position.set(0, 1.28, 0.12);
  cleaverBlade.castShadow = true;

  const cleaverEdgeGlow = new THREE.Mesh(
    createExtrudedShapeGeometry(
      [
        [0.34, -0.2],
        [0.54, -0.18],
        [0.7, 0.78],
        [0.24, 1.3],
        [0.14, 1.05],
        [0.52, 0.72],
      ],
      0.08,
      0.01,
    ),
    coreMat,
  );
  cleaverEdgeGlow.rotation.y = Math.PI / 2;
  cleaverEdgeGlow.position.set(0, 1.28, 0.12);

  cleaverGroup.add(cleaverShaft, cleaverBlade, cleaverEdgeGlow);
  rightArmPivot.add(rightUpper, rightGauntlet, cleaverGroup);

  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Volcanic Obsidian Comets
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.45;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const comet = new THREE.Mesh(
      i % 2 === 0 ? new THREE.OctahedronGeometry(0.24, 0) : createCraggyRockGeometry(0.24, 0, 80 + i),
      i % 2 === 0 ? coreMat : obsidianMat,
    );
    comet.position.set(Math.cos(a) * 2.55, Math.sin(i * 1.6) * 0.32, Math.sin(a) * 2.55);
    orbitGroup.add(comet);
  }
  bodyPivot.add(orbitGroup);

  const telegraph = createBossGroundTelegraph(0xe11d48);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

/**
 * Zone 5 Boss: Astraea, Starfall Eternal Monarch — six-winged celestial starlight valkyrie archon.
 */
export function createStarfallValkyrieModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.45, 0.128);

  const cosmicArmorMat = new THREE.MeshStandardMaterial({
    color: 0x2e1065,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.025,
    roughness: 0.22,
    metalness: 0.78,
    envMapIntensity: 1.45,
  });
  const starPlatinumMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.02,
    roughness: 0.2,
    metalness: 0.88,
    envMapIntensity: 1.55,
  });
  const starCrystalMat = new THREE.MeshStandardMaterial({
    color: 0xf0abfc,
    bumpMap: palette.iceMat.bumpMap,
    bumpScale: 0.035,
    emissive: 0xa21caf,
    emissiveIntensity: 1.2,
    roughness: 0.14,
    metalness: 0.42,
    envMapIntensity: 1.45,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xe879f9,
    emissive: 0xd946ef,
    emissiveIntensity: 1.85,
    roughness: 0.15,
    metalness: 0.35,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0xd946ef,
    2.32,
    2.82,
    56,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.42;
  group.add(bodyPivot);

  // Flowing Celestial Battle-Skirt Tassets & Armored Valkyrie Greaves
  const skirtCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.96, 1.45, 8),
    cosmicArmorMat,
  );
  skirtCore.position.set(0, 1.52, -0.06);
  skirtCore.castShadow = true;
  bodyPivot.add(skirtCore);

  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    const tassetPivot = new THREE.Group();
    tassetPivot.position.y = 1.4;
    tassetPivot.rotation.y = a;
    const tasset = new THREE.Mesh(
      createExtrudedShapeGeometry(
        [
          [-0.22, 0.72],
          [0.22, 0.72],
          [0.3, -0.68],
          [0, -1.04],
          [-0.3, -0.68],
        ],
        0.07,
        0.02,
      ),
      p % 2 === 0 ? starPlatinumMat : cosmicArmorMat,
    );
    tasset.position.set(0, 0, 0.7);
    tasset.rotation.x = -0.24;
    tasset.castShadow = true;
    tassetPivot.add(tasset);
    bodyPivot.add(tassetPivot);
  }

  const makeValkyrieLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.42, 1.48, 0.16);
    const greave = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.12, 1.18, 7),
      cosmicArmorMat,
    );
    greave.position.y = -0.58;
    greave.castShadow = true;
    const sabaton = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.46, 5),
      starPlatinumMat,
    );
    sabaton.rotation.x = Math.PI * 0.82;
    sabaton.position.set(0, -1.16, 0.08);
    legPivot.add(greave, sabaton);
    return legPivot;
  };
  const leftLegPivot = makeValkyrieLeg(-1);
  const rightLegPivot = makeValkyrieLeg(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Royal Valkyrie Cuirass + Winged Collar + Supernova Heart Core
  const cuirass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.48, 1.18, 8),
    cosmicArmorMat,
  );
  cuirass.position.y = 2.68;
  cuirass.castShadow = true;

  const beltGold = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.07, 8, 24),
    starPlatinumMat,
  );
  beltGold.rotation.x = Math.PI / 2;
  beltGold.position.y = 2.12;

  const novaHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), coreMat);
  novaHeart.scale.set(0.85, 1.35, 0.72);
  novaHeart.position.set(0, 2.7, 0.66);
  bodyPivot.add(cuirass, beltGold, novaHeart);

  // Six-Winged Celestial Starlight Archon Array (3 Fanned Tiers per Side)
  const makeStarlightWing = (side: -1 | 1): THREE.Group => {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(side * 0.58, 2.98, -0.46);

    const wingTiers: Array<{
      x: number;
      y: number;
      len: number;
      rotZ: number;
      useCore: boolean;
    }> = [
      { x: 1.05, y: 0.94, len: 2.38, rotZ: -0.72, useCore: false },
      { x: 1.38, y: 0.32, len: 2.02, rotZ: -1.12, useCore: true },
      { x: 1.05, y: -0.32, len: 1.68, rotZ: -1.48, useCore: false },
    ];
    for (const tier of wingTiers) {
      const blade = new THREE.Mesh(
        createExtrudedShapeGeometry(
          [
            [-0.14, 0],
            [0.14, 0],
            [0.26, tier.len * 0.65],
            [0, tier.len],
            [-0.24, tier.len * 0.65],
          ],
          0.06,
          0.015,
        ),
        tier.useCore ? coreMat : starCrystalMat,
      );
      blade.position.set(side * tier.x * 0.38, tier.y * 0.38, -0.06);
      blade.rotation.z = side * tier.rotZ;
      blade.castShadow = true;

      const goldRib = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, tier.len * 0.85, 0.1),
        starPlatinumMat,
      );
      goldRib.position.set(side * tier.x * 0.38, tier.y * 0.38, -0.02);
      goldRib.rotation.z = side * tier.rotZ;
      wingPivot.add(blade, goldRib);
    }
    return wingPivot;
  };
  const leftWingPivot = makeStarlightWing(-1);
  const rightWingPivot = makeStarlightWing(1);
  bodyPivot.add(leftWingPivot, rightWingPivot);

  // Dual-Ring Celestial Astrolabe Halo Raised Heroically Behind Head & Shoulders
  const haloRingGroup = new THREE.Group();
  haloRingGroup.position.set(0, 3.68, -0.58);
  const astrolabeOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.26, 0.05, 8, 40),
    starPlatinumMat,
  );
  const astrolabeInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.038, 8, 32),
    coreMat,
  );
  astrolabeInner.rotation.y = 0.45;
  haloRingGroup.add(astrolabeOuter, astrolabeInner);
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const starPip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      s % 2 === 0 ? coreMat : starPlatinumMat,
    );
    starPip.position.set(Math.cos(a) * 1.26, Math.sin(a) * 1.26, 0);
    haloRingGroup.add(starPip);
  }
  bodyPivot.add(haloRingGroup);

  // Winged Valkyrie Warhelm + Star Diadem
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.6, 0.08);
  const helm = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 1), cosmicArmorMat);
  helm.scale.set(0.92, 1.15, 1.02);
  helm.castShadow = true;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.16), coreMat);
  visor.position.set(0, 0.04, 0.44);
  const starDiadem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), coreMat);
  starDiadem.scale.set(0.75, 1.4, 0.75);
  starDiadem.position.set(0, 0.56, 0.22);
  headPivot.add(helm, visor, starDiadem);

  for (const side of [-1, 1] as const) {
    const templePlume = new THREE.Mesh(
      createExtrudedShapeGeometry(
        [
          [0, 0],
          [side * 0.48, 0.56],
          [side * 0.28, 0.78],
          [0, 0.24],
        ],
        0.05,
        0.01,
      ),
      starPlatinumMat,
    );
    templePlume.position.set(side * 0.28, 0.08, -0.05);
    headPivot.add(templePlume);
  }
  bodyPivot.add(headPivot);

  // Left Arm: Hexagonal Starlight Buckler Shield; Right Arm: Starfall Eternal Lance
  const makeValkyrieArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 1.04, 2.86, 0.12);
    const pauldron = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.54, 6),
      starPlatinumMat,
    );
    pauldron.rotation.z = -side * 0.72;
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.2, 0.98, 7),
      cosmicArmorMat,
    );
    arm.position.y = -0.52;
    arm.castShadow = true;
    armPivot.add(pauldron, arm);
    return armPivot;
  };
  const leftArmPivot = makeValkyrieArm(-1);
  const shieldFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.1, 6),
    starPlatinumMat,
  );
  shieldFrame.rotation.x = Math.PI / 2;
  shieldFrame.rotation.z = Math.PI / 6;
  shieldFrame.position.set(-0.22, -0.96, 0.36);
  shieldFrame.castShadow = true;
  const shieldCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.14, 6),
    coreMat,
  );
  shieldCore.rotation.x = Math.PI / 2;
  shieldCore.position.set(-0.22, -0.96, 0.38);
  leftArmPivot.add(shieldFrame, shieldCore);

  const rightArmPivot = makeValkyrieArm(1);
  const lanceGroup = new THREE.Group();
  lanceGroup.position.set(0.08, -0.96, 0.22);
  lanceGroup.rotation.x = 0.78;
  lanceGroup.rotation.z = -0.1;

  const lanceShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 3.35, 8),
    starPlatinumMat,
  );
  lanceShaft.position.y = 0.72;
  lanceShaft.castShadow = true;
  const lanceGuardRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.05, 8, 22),
    starPlatinumMat,
  );
  lanceGuardRing.position.y = 1.98;
  const lanceTip = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.05, 6), coreMat);
  lanceTip.position.y = 2.65;
  lanceGroup.add(lanceShaft, lanceGuardRing, lanceTip);
  rightArmPivot.add(lanceGroup);
  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Starlight Prisms & Planetary Ring
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.55;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const prism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      i % 2 === 0 ? coreMat : starPlatinumMat,
    );
    prism.scale.set(0.75, 1.55, 0.75);
    prism.position.set(Math.cos(a) * 2.35, Math.sin(i * 1.2) * 0.28, Math.sin(a) * 2.35);
    orbitGroup.add(prism);
  }
  const secondaryOrbitGroup = new THREE.Group();
  secondaryOrbitGroup.position.y = 2.55;
  secondaryOrbitGroup.rotation.x = 0.32;
  const starRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.036, 6, 48),
    starCrystalMat,
  );
  starRing.rotation.x = Math.PI / 2;
  secondaryOrbitGroup.add(starRing);
  bodyPivot.add(orbitGroup, secondaryOrbitGroup);

  const telegraph = createBossGroundTelegraph(0xd946ef);
  group.add(telegraph.telegraphGroup);

  return {
    group,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    secondaryOrbitGroup,
    leftWingPivot,
    rightWingPivot,
    haloRingGroup,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

/**
 * Frostcave City Arena Boss: Ignis, Pit-Forged Warden — armored obsidian furnace juggernaut.
 */
export function createCavernWardenModel(palette: MaterialPalette): ZoneBossModel {
  const group = new THREE.Group();
  addContactShadow(group, palette.contactShadowMat, 3.35, 0.128);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x25222c,
    normalMap: palette.rockMat.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.36,
    metalness: 0.76,
    envMapIntensity: 1.35,
  });
  const forgedBronzeMat = new THREE.MeshStandardMaterial({
    color: 0xa1622a,
    bumpMap: palette.ironMat.bumpMap,
    bumpScale: 0.03,
    roughness: 0.3,
    metalness: 0.84,
    envMapIntensity: 1.45,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff6b2c,
    emissive: 0xea580c,
    emissiveIntensity: 1.75,
    roughness: 0.2,
    metalness: 0.25,
  });

  const { auraRingMesh, auraRingMat, innerAuraMesh } = createBossRuneAura(
    0xf97316,
    2.15,
    2.62,
    48,
  );
  group.add(auraRingMesh, innerAuraMesh);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  // Articulated Heavy Riveted Greave Legs & Sabaton Boots
  const makeWardenLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.74, 1.38, 0);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.36, 0.68, 8),
      obsidianMat,
    );
    thigh.position.set(0, -0.34, 0);
    thigh.castShadow = true;

    const kneeBoss = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.36, 0.5),
      forgedBronzeMat,
    );
    kneeBoss.position.set(0, -0.58, 0.14);
    kneeBoss.castShadow = true;

    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.48, 0.72, 8),
      obsidianMat,
    );
    shin.position.set(0, -0.96, 0);
    shin.castShadow = true;

    const sabaton = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.3, 0.86),
      forgedBronzeMat,
    );
    sabaton.position.set(0, -1.24, 0.18);
    sabaton.castShadow = true;

    legPivot.add(thigh, kneeBoss, shin, sabaton);
    return legPivot;
  };
  const leftLegPivot = makeWardenLeg(-1);
  const rightLegPivot = makeWardenLeg(1);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Broad Furnace Breastplate + Molten Grate Core + Riveted Bronze Waist Belt
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.84, 0.36, 8),
    forgedBronzeMat,
  );
  belt.position.set(0, 1.48, 0);

  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 0.82, 1.72, 8),
    obsidianMat,
  );
  chest.position.y = 2.22;
  chest.castShadow = true;
  chest.receiveShadow = true;

  const magmaHeart = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.48, 0),
    coreMat,
  );
  magmaHeart.position.set(0, 2.24, 0.88);
  bodyPivot.add(belt, chest, magmaHeart);

  // Vertical Furnace Grate Bars over Glowing Molten Core
  for (let g = -1; g <= 1; g++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.86, 0.14),
      forgedBronzeMat,
    );
    bar.position.set(g * 0.24, 2.24, 1.04);
    bodyPivot.add(bar);
  }

  // Dual Back Forge Chimney Stacks + Domed Siege Pauldrons
  for (const side of [-1, 1] as const) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 1.24, 8),
      forgedBronzeMat,
    );
    stack.position.set(side * 0.6, 3.16, -0.58);
    stack.rotation.x = -0.26;
    stack.castShadow = true;

    const stackRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.055, 6, 16),
      obsidianMat,
    );
    stackRim.rotation.x = Math.PI / 2 - 0.26;
    stackRim.position.set(side * 0.6, 3.74, -0.74);

    const emberCap = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
    emberCap.position.set(side * 0.6, 3.78, -0.74);

    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
      forgedBronzeMat,
    );
    pauldron.position.set(side * 1.38, 2.74, -0.04);
    pauldron.rotation.z = -side * 0.42;
    pauldron.castShadow = true;

    const pauldronSpike = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.56, 5),
      obsidianMat,
    );
    pauldronSpike.position.set(side * 1.56, 3.3, -0.04);
    pauldronSpike.rotation.z = -side * 0.42;

    bodyPivot.add(stack, stackRim, emberCap, pauldron, pauldronSpike);
  }

  // Horned Obsidian Anvil Warhelm
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.3, 0.16);
  const helm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.52, 0.76, 8),
    obsidianMat,
  );
  helm.castShadow = true;
  const anvilCrest = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.28, 0.72),
    forgedBronzeMat,
  );
  anvilCrest.position.set(0, 0.42, 0);
  const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.18), coreMat);
  visorSlit.position.set(0, 0.04, 0.46);
  headPivot.add(helm, anvilCrest, visorSlit);

  for (const side of [-1, 1] as const) {
    const horn = new THREE.Mesh(
      createTaperedCurveGeometry(
        [
          new THREE.Vector3(side * 0.38, 0.2, 0),
          new THREE.Vector3(side * 0.78, 0.48, 0.08),
          new THREE.Vector3(side * 0.66, 0.92, 0.28),
        ],
        0.15,
        0.035,
        10,
        8,
      ),
      forgedBronzeMat,
    );
    horn.castShadow = true;
    headPivot.add(horn);
  }
  bodyPivot.add(headPivot);

  // Left Arm: Piston Gauntlet + Pit-Iron Siege Buckler; Right Arm: Magma Forge Warhammer
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.48, 2.66, 0.08);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.26, 1.08, 8),
    obsidianMat,
  );
  leftUpper.position.y = -0.54;
  leftUpper.castShadow = true;
  const leftFist = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.6, 0.6),
    forgedBronzeMat,
  );
  leftFist.position.set(0, -1.24, 0.08);
  leftFist.castShadow = true;
  const buckler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.64, 0.64, 0.16, 8),
    obsidianMat,
  );
  buckler.rotation.z = Math.PI / 2;
  buckler.position.set(-0.34, -1.1, 0.16);
  buckler.castShadow = true;
  const bucklerBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
  bucklerBoss.position.set(-0.44, -1.1, 0.16);
  leftArmPivot.add(leftUpper, leftFist, buckler, bucklerBoss);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.48, 2.66, 0.08);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.26, 1.08, 8),
    obsidianMat,
  );
  rightUpper.position.y = -0.54;
  rightUpper.castShadow = true;

  const hammerGroup = new THREE.Group();
  hammerGroup.position.set(0, -1.18, 0.16);
  hammerGroup.rotation.x = 0.85;
  hammerGroup.rotation.z = -0.12;

  const hammerHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.1, 2.55, 8),
    forgedBronzeMat,
  );
  hammerHandle.position.y = 0.56;
  hammerHandle.castShadow = true;

  const hammerHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.82, 1.26),
    obsidianMat,
  );
  hammerHead.position.y = 1.65;
  hammerHead.castShadow = true;

  const hammerRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.88, 0.32),
    forgedBronzeMat,
  );
  hammerRim.position.y = 1.65;

  const hammerEmber = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.28, 1.3),
    coreMat,
  );
  hammerEmber.position.y = 1.65;

  hammerGroup.add(hammerHandle, hammerHead, hammerRim, hammerEmber);
  rightArmPivot.add(rightUpper, hammerGroup);

  bodyPivot.add(leftArmPivot, rightArmPivot);

  // Orbiting Molten Slag Cinders
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 2.2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const cinder = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), coreMat);
    cinder.position.set(Math.cos(a) * 2.15, (i % 2) * 0.3 - 0.15, Math.sin(a) * 2.15);
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
    leftLegPivot,
    rightLegPivot,
    orbitGroup,
    auraRingMesh,
    auraRingMat,
    innerAuraMesh,
    coreMat,
    ...telegraph,
  };
}

export function createZoneBossModel(
  bossId: ZoneBossId,
  palette: MaterialPalette,
): ZoneBossModel {
  let bossModel: ZoneBossModel;
  switch (bossId) {
    case 'skarn_colossus':
      bossModel = createTimberColossusModel(palette);
      break;
    case 'veyra_sovereign':
      bossModel = createCryoSovereignModel(palette);
      break;
    case 'malakor_gargoyle':
      bossModel = createRimefangWyrmModel(palette);
      break;
    case 'ulthar_behemoth':
      bossModel = createObsidianBehemothModel(palette);
      break;
    case 'astraea_valkyrie':
      bossModel = createStarfallValkyrieModel(palette);
      break;
    case 'ignis_warden':
    default:
      bossModel = createCavernWardenModel(palette);
      break;
  }

  // Upgrade Zone Boss body with genuine CC0 rigged Fantasy Monster GLB/GLTF while preserving
  // its magical aura rings, orbiting rune crystals, and combat telegraph indicators.
  const bossSpec = BOSS_MODEL_SPECS[bossId];
  if (bossSpec) {
    bossModel.proceduralGaitAssist = bossSpec.proceduralGaitAssist ?? false;
    loadGltfModelWithAnimations(bossSpec.url)
      .then((loaded) => {
        const prepared = prepareNormalizedGltfAsset(loaded.scene, bossSpec, {
          furBumpMap: palette.furTrimMat.bumpMap,
          scaleBumpMap: palette.rockMat.bumpMap,
          envMapIntensity: 1.0,
        });

        // Hide procedural boss body parts inside bodyPivot, keeping magical orbits/halos intact
        for (const child of bossModel.bodyPivot.children) {
          if (
            child !== bossModel.orbitGroup &&
            child !== bossModel.secondaryOrbitGroup &&
            child !== bossModel.haloRingGroup
          ) {
            child.visible = false;
          }
        }
        bossModel.bodyPivot.add(prepared.lod);
        bossModel.gltfLod = prepared.lod;
        bossModel.gltfReady = true;

        if (loaded.animations.length > 0) {
          const animCtrl = new SkeletalAnimController(
            loaded.scene,
            loaded.animations,
            prepared.meshes,
          );
          animCtrl.setState('idle', { fadeDuration: 0 });
          bossModel.skeletalAnim = animCtrl;
        }
      })
      .catch((err) => {
        console.warn(`Failed to load boss GLB for ${bossId}:`, err);
      });
  }

  return bossModel;
}

export interface RoamingMonsterModel {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  telegraphRing: THREE.Mesh;
  auraRing: THREE.Mesh;
  skeletalAnim?: SkeletalAnimController;
  gltfLod?: THREE.LOD;
  gltfReady?: boolean;
}

/**
 * Creates a roaming Fantasy Monster (Frostbound Draugr Warrior, Rime Lich, or Glacier Broodmother)
 * backed by genuine rigged & animated CC0 GLBs with LOD, contact shadows, and combat telegraphs.
 */
export function createRoamingMonsterModel(
  kind: RoamingMonsterKind,
  palette: MaterialPalette,
): RoamingMonsterModel {
  const spec = ROAMING_MONSTER_SPECS[kind];
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  addContactShadow(group, palette.contactShadowMat, spec.collisionRadius * 1.15);

  const auraColor = spec.emissiveHex ?? 0x38bdf8;
  const auraMat = new THREE.MeshBasicMaterial({
    color: auraColor,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(spec.collisionRadius * 0.78, spec.collisionRadius * 1.0, 28),
    auraMat,
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.04;
  group.add(auraRing);

  const telegraphRing = attachTelegraphRing(
    group,
    spec.collisionRadius * 0.9,
    spec.collisionRadius * 1.35,
  );

  // Minimal placeholder silhouette shown only during the ~30ms local GLB load
  const loadingFallback = new THREE.Mesh(
    new THREE.CapsuleGeometry(spec.collisionRadius * 0.42, spec.targetHeight * 0.45, 4, 8),
    palette.frostSteelMat,
  );
  loadingFallback.position.y = spec.targetHeight * 0.5;
  loadingFallback.castShadow = true;
  bodyGroup.add(loadingFallback);

  const model: RoamingMonsterModel = {
    group,
    bodyGroup,
    telegraphRing,
    auraRing,
  };

  loadGltfModelWithAnimations(spec.url)
    .then((loaded) => {
      const prepared = prepareNormalizedGltfAsset(loaded.scene, spec, {
        furBumpMap: palette.furTrimMat.bumpMap,
        scaleBumpMap: palette.rockMat.bumpMap,
        envMapIntensity: 0.95,
      });

      loadingFallback.visible = false;
      bodyGroup.add(prepared.lod);
      model.gltfLod = prepared.lod;
      model.gltfReady = true;

      if (loaded.animations.length > 0) {
        const animCtrl = new SkeletalAnimController(
          loaded.scene,
          loaded.animations,
          prepared.meshes,
        );
        animCtrl.setState('idle', { fadeDuration: 0 });
        model.skeletalAnim = animCtrl;
      }
    })
    .catch((err) => {
      console.warn(`Failed to load roaming monster GLB ${kind}:`, err);
    });

  return model;
}

export function createWindbreakPalisadeMesh(
  level: number,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  const safeLevel = Math.max(1, Math.min(3, level));

  // Ground foundation pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.35, 0.22, 12),
    palette.stoneMat,
  );
  pad.position.y = 0.11;
  pad.receiveShadow = true;
  group.add(pad);

  // Curved arc of angled wind-baffle timbers / granite piers / cryo-runed pylons
  const postCount = safeLevel === 1 ? 5 : safeLevel === 2 ? 7 : 9;
  const arcSpan = 2.1;
  for (let i = 0; i < postCount; i++) {
    const t = postCount > 1 ? i / (postCount - 1) - 0.5 : 0;
    const angle = t * arcSpan;
    const radius = 1.45;
    const px = Math.sin(angle) * radius;
    const pz = -Math.cos(angle) * radius * 0.65;
    const height = (1.65 + (1 - Math.abs(t)) * 0.55) * (0.9 + safeLevel * 0.14);

    const postMat =
      safeLevel >= 3
        ? palette.frostSteelMat
        : safeLevel === 2
          ? palette.stoneMat
          : palette.barkMat;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.19, height, 8),
      postMat,
    );
    post.position.set(px, height * 0.5 + 0.15, pz);
    post.rotation.x = 0.22;
    post.rotation.z = -t * 0.18;
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    if (safeLevel >= 2) {
      const buttress = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, height * 0.65, 0.42),
        palette.rockMat,
      );
      buttress.position.set(px * 0.85, height * 0.32 + 0.15, pz + 0.25);
      buttress.castShadow = true;
      group.add(buttress);
    }

    if (safeLevel >= 3 && i % 2 === 0) {
      const vane = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        palette.auroraCrystalMat,
      );
      vane.position.set(px, height + 0.32, pz);
      group.add(vane);
    }
  }

  // Crossbeam wind-deflector slats
  const crossBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.22, 0.26),
    safeLevel >= 2 ? palette.ironMat : palette.timberMat,
  );
  crossBar.position.set(0, 1.15, -0.55);
  crossBar.castShadow = true;
  group.add(crossBar);

  return group;
}

export function createThermalConduitMesh(
  level: number,
  palette: MaterialPalette,
): THREE.Group {
  const group = new THREE.Group();
  const safeLevel = Math.max(1, Math.min(3, level));

  // Stepped stone geothermal cistern base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 2.05, 0.38, 12),
    palette.stoneMat,
  );
  base.position.y = 0.19;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Central boiler / geothermal hearth core
  const coreHeight = 1.45 + safeLevel * 0.32;
  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.82, coreHeight, 12),
    safeLevel >= 2 ? palette.ironMat : palette.rockMat,
  );
  boiler.position.y = 0.38 + coreHeight * 0.5;
  boiler.castShadow = true;
  group.add(boiler);

  // Glowing ember / solaris thermal ring
  const glowBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.74, 0.34, 12),
    palette.emberMat,
  );
  glowBand.position.y = 0.38 + coreHeight * 0.48;
  group.add(glowBand);

  // Radial heat-retaining copper/iron steam ducts
  const ductCount = safeLevel === 1 ? 3 : safeLevel === 2 ? 4 : 6;
  for (let i = 0; i < ductCount; i++) {
    const a = (i / ductCount) * Math.PI * 2;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 1.35, 8),
      safeLevel >= 3 ? palette.goldMat : palette.ironMat,
    );
    pipe.position.set(Math.cos(a) * 1.05, 0.65, Math.sin(a) * 1.05);
    pipe.rotation.z = Math.cos(a) * 0.55;
    pipe.rotation.x = -Math.sin(a) * 0.55;
    pipe.castShadow = true;
    group.add(pipe);

    const brazierBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.18, 0.26, 8),
      palette.emberMat,
    );
    brazierBowl.position.set(Math.cos(a) * 1.42, 0.42, Math.sin(a) * 1.42);
    group.add(brazierBowl);
  }

  if (safeLevel >= 3) {
    const crown = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      palette.emberMat,
    );
    crown.position.y = 0.45 + coreHeight + 0.38;
    group.add(crown);
  }

  return group;
}

export interface CabinInteriorVisual {
  group: THREE.Group;
  fireplaceFlames: THREE.Group;
  fireplaceLight: THREE.PointLight;
  bedGroup: THREE.Group;
  bedMattressTopY: number;
  sleepZzzGroup: THREE.Group;
  sleepZzzNodes: THREE.Group[];
  doorGroup: THREE.Group;
}

function createSleepZGlyph(mat: THREE.MeshBasicMaterial, scale = 1): THREE.Group {
  const zGroup = new THREE.Group();
  const barGeoH = new THREE.BoxGeometry(0.24 * scale, 0.055 * scale, 0.04 * scale);
  const barGeoDiag = new THREE.BoxGeometry(0.3 * scale, 0.055 * scale, 0.04 * scale);
  const top = new THREE.Mesh(barGeoH, mat);
  top.position.set(0, 0.1 * scale, 0);
  const bot = new THREE.Mesh(barGeoH, mat);
  bot.position.set(0, -0.1 * scale, 0);
  const diag = new THREE.Mesh(barGeoDiag, mat);
  diag.rotation.z = 0.72;
  zGroup.add(top, bot, diag);
  return zGroup;
}

/**
 * Builds the cozy open-top cutaway 3D Cabin Interior Room scaled by Cabin Tier (1..5),
 * complete with timber plank floor, braided hearth rug, crackling stone fireplace,
 * tier-upgraded bed with fur mattress & pillow, bedside lantern, oak dining table,
 * exit door frame, and floating 3D sleeping Zzz bubbles.
 */
export function createCabinInteriorMesh(
  tier: number,
  palette: MaterialPalette,
): CabinInteriorVisual {
  const safeTier = Math.max(1, Math.min(5, Math.round(tier)));
  const group = new THREE.Group();
  const arch = createArchMaterials(palette);

  const roomW = 10.4;
  const roomD = 8.4;
  const wallH = 2.85;

  // 1. Subfloor foundation slab + warm oak plank floorboards
  const subFloor = new THREE.Mesh(
    new THREE.BoxGeometry(roomW + 0.6, 0.28, roomD + 0.6),
    palette.darkWoodMat,
  );
  subFloor.position.set(0, -0.14, 0);
  subFloor.receiveShadow = true;
  group.add(subFloor);

  const plankCount = 12;
  const plankD = roomD / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const pz = -roomD * 0.5 + plankD * (i + 0.5);
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(roomW - 0.1, 0.03, plankD - 0.035),
      i % 2 === 0 ? palette.timberMat : palette.darkWoodMat,
    );
    plank.position.set(0, 0.005, pz);
    plank.receiveShadow = true;
    group.add(plank);
  }

  // Central woven hearth rug + cozy fur runner beside the bed
  const rugMat =
    safeTier >= 4 ? palette.coatBlueMat : safeTier >= 2 ? palette.coatRedMat : palette.canvasMat;
  const mainRug = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.035, 3.1),
    rugMat,
  );
  mainRug.position.set(0.25, 0.025, -0.45);
  mainRug.receiveShadow = true;
  const rugBorder = new THREE.Mesh(
    new THREE.BoxGeometry(4.42, 0.024, 3.32),
    safeTier >= 4 ? palette.goldMat : palette.furTrimMat,
  );
  rugBorder.position.set(0.25, 0.018, -0.45);
  group.add(rugBorder, mainRug);

  const furMat = new THREE.MeshPhysicalMaterial({
    color: 0xeae2d2,
    roughness: 0.9,
    sheen: 0.6,
  });
  const bedsidePelt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.03, 14),
    furMat,
  );
  bedsidePelt.scale.set(0.85, 1, 1.35);
  bedsidePelt.position.set(-1.35, 0.024, -1.65);
  bedsidePelt.receiveShadow = true;
  group.add(bedsidePelt);

  // 2. Interior Cutaway Walls (North, West, East full height; South cutaway sill with Exit Door)
  const wallMat = safeTier >= 4 ? palette.stoneMat : safeTier >= 2 ? arch.plasterMat : palette.timberMat;
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomW + 0.36, wallH, 0.28),
    wallMat,
  );
  northWall.position.set(0, wallH * 0.5, -roomD * 0.5);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  group.add(northWall);

  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, wallH, roomD + 0.2),
      wallMat,
    );
    sideWall.position.set(side * (roomW * 0.5), wallH * 0.5, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    group.add(sideWall);

    // Timber corner posts & wainscot rail
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.14, roomD + 0.22),
      palette.darkWoodMat,
    );
    rail.position.set(side * (roomW * 0.5), 1.08, 0);
    group.add(rail);

    // Glowing frost-lit windows on West and East walls
    addMullionedWindow(
      group,
      palette,
      side * (roomW * 0.5 - 0.14),
      1.75,
      -0.4,
      (side * Math.PI) / 2,
    );
  }

  // Timber structural studs along North wall
  for (const sx of [-4.9, -2.5, 2.5, 4.9]) {
    const stud = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, wallH + 0.08, 0.34),
      palette.darkWoodMat,
    );
    stud.position.set(sx, wallH * 0.5, -roomD * 0.5);
    group.add(stud);
  }

  // Low South cutaway sill walls flanking the Exit Doorway so camera has 100% clear view
  for (const side of [-1, 1]) {
    const lowWall = new THREE.Mesh(
      new THREE.BoxGeometry(3.85, 0.56, 0.24),
      palette.darkWoodMat,
    );
    lowWall.position.set(side * 3.15, 0.28, roomD * 0.5);
    lowWall.receiveShadow = true;
    group.add(lowWall);
  }

  // Framed South Exit Doorway + Welcome Mat (aligned with CABIN_INTERIOR_DOOR_POS = (0, z+3.55))
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, roomD * 0.5 - 0.12);
  const exitMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.04, 0.95),
    palette.canvasMat,
  );
  exitMat.position.set(0, 0.025, -0.58);
  exitMat.receiveShadow = true;
  doorGroup.add(exitMat);
  addFramedDoor(doorGroup, palette, 0, 1.02, 0, 1.18, 1.98, safeTier >= 4);
  const doorLantern = createHangingLantern(palette);
  doorLantern.position.set(0.98, 1.85, -0.22);
  doorGroup.add(doorLantern);
  group.add(doorGroup);

  // 3. Stone Hearth & Crackling Fireplace at (0.25, 0, -3.65)
  const hearthGroup = new THREE.Group();
  hearthGroup.position.set(0.25, 0, -3.65);

  const hearthSlab = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.16, 1.45),
    palette.stoneMat,
  );
  hearthSlab.position.set(0, 0.08, 0.15);
  hearthSlab.receiveShadow = true;
  const hearthBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 2.7, 0.86),
    palette.stoneMat,
  );
  hearthBack.position.set(0, 1.35, -0.18);
  hearthBack.castShadow = true;
  hearthBack.receiveShadow = true;
  const fireBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.95, 0.56),
    palette.foxDarkMat,
  );
  fireBox.position.set(0, 0.58, 0.05);
  const mantle = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.16, 0.96),
    palette.darkWoodMat,
  );
  mantle.position.set(0, 1.32, -0.02);
  mantle.castShadow = true;

  // Mantle brass candlesticks + trophy antlers for Tier 2+
  for (const mx of [-0.88, 0.88]) {
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.22, 8),
      palette.warmWindowMat,
    );
    candle.position.set(mx, 1.5, 0.16);
    hearthGroup.add(candle);
  }
  if (safeTier >= 2) {
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.44, 0.1),
      palette.darkWoodMat,
    );
    plaque.position.set(0, 1.98, 0.24);
    hearthGroup.add(plaque);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.52, 6),
        palette.antlerMat,
      );
      horn.position.set(side * 0.26, 2.15, 0.34);
      horn.rotation.z = -side * 0.65;
      horn.rotation.x = 0.25;
      hearthGroup.add(horn);
    }
  }

  // Glowing ember bed, split logs & dynamic flame cones
  const embers = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.6, 0.1, 12),
    palette.emberMat,
  );
  embers.position.set(0, 0.19, 0.14);
  for (let i = 0; i < 3; i++) {
    const log = createLogMesh(0.085, 0.96, 8, palette);
    log.rotation.z = Math.PI / 2 + (i - 1) * 0.18;
    log.position.set((i - 1) * 0.12, 0.26 + (i === 1 ? 0.06 : 0), 0.16);
    hearthGroup.add(log);
  }

  const fireplaceFlames = new THREE.Group();
  fireplaceFlames.position.set(0, 0.32, 0.16);
  const fMatOuter = new THREE.MeshBasicMaterial({ color: 0xff6b22 });
  const fMatMid = new THREE.MeshBasicMaterial({ color: 0xffa834 });
  const fMatCore = new THREE.MeshBasicMaterial({ color: 0xffeb8c });
  const fc1 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 8), fMatOuter);
  fc1.position.y = 0.32;
  const fc2 = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.56, 8), fMatMid);
  fc2.position.set(0.11, 0.24, 0.04);
  const fc3 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 8), fMatCore);
  fc3.position.set(-0.09, 0.21, -0.02);
  fireplaceFlames.add(fc1, fc2, fc3);

  const fireplaceLight = new THREE.PointLight(0xffa44c, 7.2, 16, 1.35);
  fireplaceLight.position.set(0, 0.95, 0.85);

  hearthGroup.add(hearthSlab, hearthBack, fireBox, mantle, embers, fireplaceFlames, fireplaceLight);
  group.add(hearthGroup);

  // 4. Cozy Bed at (-2.85, 0, -1.75) aligned North (pillow) -> South (footboard)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-2.85, 0, -1.75);

  const bedW = safeTier >= 4 ? 1.62 : 1.44;
  const bedD = 2.28;
  const frameH = safeTier >= 3 ? 0.32 : 0.26;
  const mattressH = safeTier >= 3 ? 0.2 : 0.18;
  const bedMattressTopY = frameH + mattressH;

  const frameMat = safeTier >= 4 ? palette.darkWoodMat : palette.timberMat;
  const bedBase = new THREE.Mesh(
    new THREE.BoxGeometry(bedW, frameH, bedD),
    frameMat,
  );
  bedBase.position.y = frameH * 0.5;
  bedBase.castShadow = true;
  bedBase.receiveShadow = true;
  bedGroup.add(bedBase);

  // Carved corner bedposts (taller & brass-tipped canopy posts for Tiers 4–5)
  const postHeight = safeTier >= 4 ? 1.58 : safeTier >= 2 ? 0.92 : 0.54;
  for (const px of [-bedW * 0.48, bedW * 0.48]) {
    for (const pz of [-bedD * 0.48, bedD * 0.48]) {
      const isHead = pz < 0;
      const h = isHead ? postHeight : safeTier >= 4 ? postHeight : postHeight * 0.72;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.08, h, 8),
        palette.darkWoodMat,
      );
      post.position.set(px, h * 0.5, pz);
      post.castShadow = true;
      bedGroup.add(post);

      if (safeTier >= 3) {
        const finial = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          safeTier >= 4 ? palette.goldMat : palette.timberMat,
        );
        finial.position.set(px, h + 0.05, pz);
        bedGroup.add(finial);
      }
    }
  }

  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(bedW + 0.06, safeTier >= 2 ? 0.88 : 0.5, 0.12),
    frameMat,
  );
  headboard.position.set(0, frameH + 0.38, -bedD * 0.48);
  headboard.castShadow = true;
  bedGroup.add(headboard);

  // Soft fur-lined mattress (top surface at bedMattressTopY)
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(bedW - 0.12, mattressH, bedD - 0.16),
    palette.furTrimMat,
  );
  mattress.position.set(0, frameH + mattressH * 0.5, 0);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  // Folded quilt blanket on lower foot third of bed (stays flush so sleeping player rests cleanly visible on top)
  const quiltMat =
    safeTier >= 5
      ? palette.coatGreenMat
      : safeTier >= 3
        ? palette.coatRedMat
        : palette.coatBlueMat;
  const quilt = new THREE.Mesh(
    new THREE.BoxGeometry(bedW - 0.06, 0.075, bedD * 0.34),
    quiltMat,
  );
  quilt.position.set(0, bedMattressTopY + 0.015, bedD * 0.28);
  quilt.receiveShadow = true;
  bedGroup.add(quilt);

  // Plump pillow at head end (z = -0.72 local -> world z = -2.47)
  const pillow = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.14, bedW * 0.46, 6, 12),
    palette.hareMat,
  );
  pillow.rotation.z = Math.PI / 2;
  pillow.scale.set(0.65, 1, 0.88);
  pillow.position.set(0, bedMattressTopY + 0.055, -bedD * 0.33);
  pillow.castShadow = true;
  bedGroup.add(pillow);

  // Bedside nightstand & warm candle lantern
  const nightstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.54, 0.64),
    palette.darkWoodMat,
  );
  nightstand.position.set(-bedW * 0.5 - 0.62, 0.27, -bedD * 0.32);
  nightstand.castShadow = true;
  const bedCandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.18, 8),
    palette.warmWindowMat,
  );
  bedCandle.position.set(-bedW * 0.5 - 0.62, 0.63, -bedD * 0.32);
  bedGroup.add(nightstand, bedCandle);

  // Floating 3D Sleeping Zzz Group positioned cleanly above the pillow
  const sleepZzzGroup = new THREE.Group();
  sleepZzzGroup.position.set(-2.5, bedMattressTopY + 0.85, -2.18);
  sleepZzzGroup.visible = false;
  const zMat = new THREE.MeshBasicMaterial({ color: 0x7ee8ff });
  const sleepZzzNodes: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const zGlyph = createSleepZGlyph(zMat, 1.05 + i * 0.26);
    zGlyph.position.set(i * 0.26, i * 0.42, i * 0.08);
    sleepZzzGroup.add(zGlyph);
    sleepZzzNodes.push(zGlyph);
  }
  group.add(sleepZzzGroup);
  group.add(bedGroup);

  // 5. Oak Dining Table, Stools, Firewood Rack & Supply Chest on East Side
  const tableGroup = new THREE.Group();
  tableGroup.position.set(2.55, 0, 0.65);
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.92, 0.1, 14),
    palette.timberMat,
  );
  tableTop.position.y = 0.76;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  const tablePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.26, 0.74, 10),
    palette.darkWoodMat,
  );
  tablePedestal.position.y = 0.37;
  tablePedestal.castShadow = true;
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.065, 0.16, 8),
    palette.goldMat,
  );
  mug.position.set(0.24, 0.89, 0.14);
  const lanternBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8),
    palette.warmWindowMat,
  );
  lanternBody.position.set(-0.18, 0.92, -0.14);
  tableGroup.add(tableTop, tablePedestal, mug, lanternBody);

  for (const [sx, sz] of [
    [-1.12, -0.25],
    [1.08, 0.35],
  ] as const) {
    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.22, 0.44, 10),
      palette.darkWoodMat,
    );
    stool.position.set(sx, 0.22, sz);
    stool.castShadow = true;
    tableGroup.add(stool);
  }
  group.add(tableGroup);

  // Stacked firewood & frontier supply chest against East wall
  for (let i = 0; i < 6; i++) {
    const fLog = createLogMesh(0.095, 0.76, 8, palette);
    fLog.rotation.x = Math.PI / 2;
    fLog.position.set(4.48 - (i % 3) * 0.21, 0.14 + Math.floor(i / 3) * 0.19, -2.55);
    group.add(fLog);
  }
  const footLocker = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.56, 1.25),
    palette.darkWoodMat,
  );
  footLocker.position.set(4.38, 0.28, -1.25);
  footLocker.castShadow = true;
  const chestBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.12, 1.28),
    safeTier >= 3 ? palette.goldMat : palette.ironMat,
  );
  chestBand.position.set(4.38, 0.48, -1.25);
  group.add(footLocker, chestBand);

  return {
    group,
    fireplaceFlames,
    fireplaceLight,
    bedGroup,
    bedMattressTopY,
    sleepZzzGroup,
    sleepZzzNodes,
    doorGroup,
  };
}

export interface SwimmingFishVisual {
  group: THREE.Group;
  tailPivot: THREE.Group;
  rarityRing: THREE.Mesh;
  skeletalAnim?: SkeletalAnimController;
  swimUniforms?: FishSwimShaderUniforms;
  gltfReady?: boolean;
}

export function createSwimmingFishMesh(params: {
  speciesId?: FishSpeciesId;
  colorHex: number;
  accentHex: number;
  scale: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
}): SwimmingFishVisual {
  const { speciesId, colorHex, accentHex, scale, rarity } = params;
  const group = new THREE.Group();
  const fallbackGroup = new THREE.Group();
  group.add(fallbackGroup);

  const isRarePlus = rarity === 'rare' || rarity === 'epic' || rarity === 'mythic';
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: rarity === 'mythic' ? 0.2 : isRarePlus ? 0.12 : 0.06,
    roughness: 0.2,
    metalness: 0.35,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: rarity === 'mythic' ? 0.25 : 0.1,
    roughness: 0.24,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  // Streamlined placeholder fish shown briefly until the realistic PBR GLB resolves
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), bodyMat);
  body.scale.set(0.48, 0.68, 1.9);
  fallbackGroup.add(body);

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), finMat);
  dorsal.position.set(0, 0.18, -0.05);
  dorsal.rotation.x = -0.45;
  dorsal.scale.set(0.3, 1, 1.25);
  fallbackGroup.add(dorsal);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0, -0.38);
  const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 4), finMat);
  tailFin.rotation.x = Math.PI / 2;
  tailFin.scale.set(0.22, 1, 1.15);
  tailFin.position.z = -0.13;
  tailPivot.add(tailFin);
  fallbackGroup.add(tailPivot);

  // Subtle translucent water-surface wake/rarity ripple ring so players can read rarity without obscuring the 3D fish
  const ringColor =
    rarity === 'mythic'
      ? 0xfbbf24
      : rarity === 'epic'
        ? 0xc084fc
        : rarity === 'rare'
          ? 0x38bdf8
          : rarity === 'uncommon'
            ? 0x86efac
            : 0xe0f2fe;
  const rarityRing = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.495, 32),
    new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: rarity === 'common' ? 0.09 : rarity === 'uncommon' ? 0.14 : 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  rarityRing.rotation.x = -Math.PI / 2;
  rarityRing.position.y = 0.055;
  group.add(rarityRing);

  group.scale.setScalar(scale);

  const visual: SwimmingFishVisual = {
    group,
    tailPivot,
    rarityRing,
    gltfReady: false,
  };

  // Mount high-polygon realistic 4-channel PBR 3D fish GLB with GPU carangiform swim shader
  const fishSpec = speciesId ? FISH_MODEL_SPECS[speciesId] : undefined;
  if (fishSpec && speciesId) {
    loadGltfModelWithAnimations(fishSpec.url)
      .then((loaded) => {
        const prepared = prepareNormalizedGltfAsset(loaded.scene, fishSpec, {
          envMapIntensity: 1.45,
        });

        // Apply species-authentic anatomical body proportions (sleek pike, deep perch, heavy sturgeon, etc.)
        const profile = REALISTIC_FISH_PROFILES[speciesId];
        if (profile) {
          const [px, py, pz] = profile.bodyProportions;
          prepared.modelRoot.scale.set(px, py, pz);
        }

        // Upgrade GLB PBR materials to wet clearcoat + iridescent scales & inject GPU carangiform swim shader
        const { uniforms } = upgradeFishMaterialsWithSwimShader(
          prepared.modelRoot,
          speciesId,
          1.45,
        );
        visual.swimUniforms = uniforms;

        // Seat fish at sweet-spot depth: belly naturally submerged beneath water surface, flanks & dorsal clearly readable
        prepared.modelRoot.position.y -= prepared.normalizedHeight * 0.24;

        // Physically remove placeholder fallback fish so only the realistic PBR GLB renders
        fallbackGroup.visible = false;
        group.remove(fallbackGroup);
        group.add(prepared.lod);
        visual.gltfReady = true;

        if (loaded.animations.length > 0) {
          const animCtrl = new SkeletalAnimController(
            loaded.scene,
            loaded.animations,
            prepared.meshes,
          );
          animCtrl.setState('swim_normal', { fadeDuration: 0 });
          visual.skeletalAnim = animCtrl;
        }
      })
      .catch((err) => {
        console.warn(`Failed to load realistic fish GLB for ${speciesId}:`, err);
      });
  }

  return visual;
}

export function createFishingBobberMesh(): {
  group: THREE.Group;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const topHalf = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    redMat,
  );
  const bottomHalf = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    whiteMat,
  );
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.026, 0.28, 8),
    goldMat,
  );
  antenna.position.y = 0.24;

  const tipBead = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), goldMat);
  tipBead.position.y = 0.39;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.42, 28),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;

  group.add(topHalf, bottomHalf, antenna, tipBead, ring);
  return { group, ring };
}

