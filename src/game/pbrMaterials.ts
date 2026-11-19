import * as THREE from 'three';

export type PbrSurfaceKey =
  | 'snow'
  | 'glacial_ice'
  | 'lake_water'
  | 'lake_fracture_ice'
  | 'lake_hoarfrost'
  | 'forged_iron'
  | 'burnished_gold'
  | 'frost_steel'
  | 'aurora_crystal'
  | 'mythic_alloy'
  | 'glass_window'
  | 'timber'
  | 'stone'
  | 'fur';

export interface PbrSurfaceProfile {
  roughness: number;
  metalness: number;
  ior: number;
  reflectivity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenRoughness: number;
  sheenColorHex: number;
  anisotropy: number;
  iridescence: number;
  iridescenceIOR: number;
  specularIntensity: number;
  specularColorHex: number;
  envMapIntensity: number;
  normalScale: number;
  clearcoatNormalScale: number;
}

/**
 * Physically calibrated PBR material parameters for Frostwood's core material library.
 * - Dielectrics (snow, ice, water, stone, timber, fur) keep metalness <= 0.08 with accurate IOR.
 * - Conductors (forged iron, burnished gold, frost steel, mythic alloy) use metalness >= 0.88
 *   with brushed anisotropy and clearcoat sheen for crisp alpine sky reflections.
 * - Snow & ice use dual-layer micro-surface normal maps (base relief + clearcoat micro-facets).
 */
export const PBR_SURFACE_PROFILES: Record<PbrSurfaceKey, PbrSurfaceProfile> = {
  snow: {
    roughness: 0.78,
    metalness: 0.01,
    ior: 1.31,
    reflectivity: 0.48,
    clearcoat: 0.36,
    clearcoatRoughness: 0.28,
    sheen: 0.38,
    sheenRoughness: 0.56,
    sheenColorHex: 0xdff2ff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 0.85,
    specularColorHex: 0xeef7ff,
    envMapIntensity: 1.05,
    normalScale: 0.42,
    clearcoatNormalScale: 0.55,
  },
  glacial_ice: {
    roughness: 0.14,
    metalness: 0.04,
    ior: 1.31,
    reflectivity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0.18,
    iridescenceIOR: 1.31,
    specularIntensity: 1.0,
    specularColorHex: 0xe6f7ff,
    envMapIntensity: 1.72,
    normalScale: 0.62,
    clearcoatNormalScale: 0.42,
  },
  lake_water: {
    roughness: 0.09,
    metalness: 0.04,
    ior: 1.333,
    reflectivity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.33,
    specularIntensity: 1.0,
    specularColorHex: 0xeaf6ff,
    envMapIntensity: 1.48,
    normalScale: 0.52,
    clearcoatNormalScale: 0.34,
  },
  lake_fracture_ice: {
    roughness: 0.18,
    metalness: 0.03,
    ior: 1.31,
    reflectivity: 0.92,
    clearcoat: 0.95,
    clearcoatRoughness: 0.07,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0.12,
    iridescenceIOR: 1.31,
    specularIntensity: 0.96,
    specularColorHex: 0xe0f4ff,
    envMapIntensity: 1.38,
    normalScale: 0.68,
    clearcoatNormalScale: 0.48,
  },
  lake_hoarfrost: {
    roughness: 0.72,
    metalness: 0.01,
    ior: 1.31,
    reflectivity: 0.42,
    clearcoat: 0.32,
    clearcoatRoughness: 0.32,
    sheen: 0.36,
    sheenRoughness: 0.58,
    sheenColorHex: 0xe6f4ff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 0.8,
    specularColorHex: 0xf0f9ff,
    envMapIntensity: 0.94,
    normalScale: 0.48,
    clearcoatNormalScale: 0.52,
  },
  forged_iron: {
    roughness: 0.28,
    metalness: 0.92,
    ior: 1.5,
    reflectivity: 0.95,
    clearcoat: 0.32,
    clearcoatRoughness: 0.18,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0.58,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 1.0,
    specularColorHex: 0xe2ecf5,
    envMapIntensity: 1.65,
    normalScale: 0.44,
    clearcoatNormalScale: 0.22,
  },
  burnished_gold: {
    roughness: 0.18,
    metalness: 0.96,
    ior: 1.5,
    reflectivity: 0.98,
    clearcoat: 0.48,
    clearcoatRoughness: 0.1,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0.65,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 1.0,
    specularColorHex: 0xfff0c2,
    envMapIntensity: 1.85,
    normalScale: 0.32,
    clearcoatNormalScale: 0.16,
  },
  frost_steel: {
    roughness: 0.16,
    metalness: 0.94,
    ior: 1.5,
    reflectivity: 0.98,
    clearcoat: 0.68,
    clearcoatRoughness: 0.08,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0.7,
    iridescence: 0.24,
    iridescenceIOR: 1.36,
    specularIntensity: 1.0,
    specularColorHex: 0xcff5ff,
    envMapIntensity: 1.9,
    normalScale: 0.36,
    clearcoatNormalScale: 0.24,
  },
  aurora_crystal: {
    roughness: 0.08,
    metalness: 0.08,
    ior: 1.46,
    reflectivity: 0.98,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0.58,
    iridescenceIOR: 1.34,
    specularIntensity: 1.0,
    specularColorHex: 0xd8f8ff,
    envMapIntensity: 1.92,
    normalScale: 0.56,
    clearcoatNormalScale: 0.36,
  },
  mythic_alloy: {
    roughness: 0.15,
    metalness: 0.95,
    ior: 1.5,
    reflectivity: 0.98,
    clearcoat: 0.76,
    clearcoatRoughness: 0.08,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0.68,
    iridescence: 0.48,
    iridescenceIOR: 1.4,
    specularIntensity: 1.0,
    specularColorHex: 0xf5d0fe,
    envMapIntensity: 1.95,
    normalScale: 0.34,
    clearcoatNormalScale: 0.2,
  },
  glass_window: {
    roughness: 0.12,
    metalness: 0.06,
    ior: 1.52,
    reflectivity: 0.94,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    sheen: 0,
    sheenRoughness: 0.5,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 1.0,
    specularColorHex: 0xffe8c2,
    envMapIntensity: 1.52,
    normalScale: 0.18,
    clearcoatNormalScale: 0.12,
  },
  timber: {
    roughness: 0.72,
    metalness: 0.03,
    ior: 1.45,
    reflectivity: 0.35,
    clearcoat: 0,
    clearcoatRoughness: 0.6,
    sheen: 0,
    sheenRoughness: 0.8,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 0.65,
    specularColorHex: 0xffffff,
    envMapIntensity: 0.72,
    normalScale: 0.52,
    clearcoatNormalScale: 0,
  },
  stone: {
    roughness: 0.84,
    metalness: 0.05,
    ior: 1.52,
    reflectivity: 0.4,
    clearcoat: 0,
    clearcoatRoughness: 0.6,
    sheen: 0,
    sheenRoughness: 0.8,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 0.7,
    specularColorHex: 0xffffff,
    envMapIntensity: 0.78,
    normalScale: 0.64,
    clearcoatNormalScale: 0,
  },
  fur: {
    roughness: 0.88,
    metalness: 0.01,
    ior: 1.42,
    reflectivity: 0.25,
    clearcoat: 0,
    clearcoatRoughness: 0.8,
    sheen: 0.58,
    sheenRoughness: 0.7,
    sheenColorHex: 0xffffff,
    anisotropy: 0,
    iridescence: 0,
    iridescenceIOR: 1.3,
    specularIntensity: 0.55,
    specularColorHex: 0xffffff,
    envMapIntensity: 0.74,
    normalScale: 0.35,
    clearcoatNormalScale: 0,
  },
};

export interface LakeReflectionParams {
  waterRoughness: number;
  waterClearcoat: number;
  waterClearcoatRoughness: number;
  waterEnvMapIntensity: number;
  iceRoughness: number;
  iceClearcoat: number;
  iceClearcoatRoughness: number;
  iceEnvMapIntensity: number;
  shoreIceEnvMapIntensity: number;
}

/**
 * Pure physically-based reflection curve for the glacial lake across iceThickness [0..1].
 * - Open water (0.0): glassy mirror-like reflections (low roughness, strong clearcoat & IBL).
 * - Thin/fractured black ice (0.25..0.65): crisp specular ice plates with sharp Fresnel glint.
 * - Thick frosted pack ice (0.65..1.0): higher micro-roughness with preserved clearcoat sheen.
 */
export function computeLakeReflectionParams(iceThickness: number): LakeReflectionParams {
  const t = Math.max(0, Math.min(1, iceThickness));
  return {
    waterRoughness: 0.08 + t * 0.24,
    waterClearcoat: Math.max(0.42, 1.0 - t * 0.45),
    waterClearcoatRoughness: 0.04 + t * 0.16,
    waterEnvMapIntensity: Math.max(0.58, 1.52 - t * 0.78),
    iceRoughness: 0.14 + t * 0.28,
    iceClearcoat: Math.max(0.52, 0.98 - t * 0.34),
    iceClearcoatRoughness: 0.05 + t * 0.14,
    iceEnvMapIntensity: Math.max(0.72, 1.42 - t * 0.48),
    shoreIceEnvMapIntensity: Math.max(0.66, 1.24 - t * 0.36),
  };
}

/**
 * Generates an Arctic Alpine prefiltered environment cubemap via PMREMGenerator.
 * Combines a deep cobalt alpine sky dome, crisp glacial horizon glow, warm solar specular key,
 * cool northern sky bounce, snowfield albedo ground reflection, and subtle mountain horizon ring
 * so reflective surfaces (water, glacial ice, frost steel, gold, snow micro-facets) reflect
 * realistic outdoor lighting instead of flat indoor boxes.
 */
export function createArcticEnvironmentMap(
  renderer: THREE.WebGLRenderer,
): THREE.Texture {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x527aa6);

  // 1. Gradient Alpine Sky + Snow Bounce Sphere
  const skyGeo = new THREE.SphereGeometry(40, 32, 20);
  const posAttr = skyGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const zenith = new THREE.Color(0x285694);
  const midSky = new THREE.Color(0x6da4dc);
  const horizon = new THREE.Color(0xd8ecff);
  const snowGround = new THREE.Color(0x6c88ab);
  const deepGround = new THREE.Color(0x2b3f59);
  const tmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const ny = posAttr.getY(i) / 40;
    if (ny >= 0) {
      if (ny < 0.25) {
        tmp.copy(horizon).lerp(midSky, ny / 0.25);
      } else {
        tmp.copy(midSky).lerp(zenith, (ny - 0.25) / 0.75);
      }
    } else {
      const dn = Math.min(1, -ny);
      tmp.copy(horizon).lerp(snowGround, Math.min(1, dn * 2.2));
      if (dn > 0.4) {
        tmp.lerp(deepGround, (dn - 0.4) / 0.6);
      }
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const skyMesh = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }),
  );
  envScene.add(skyMesh);

  // 2. Warm Solar Key Disc + Soft Corona (creates crisp specular glints on ice, water & weapons)
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.55, 2.55) }),
  );
  sunDisc.position.set(16, 21, 13);
  envScene.add(sunDisc);

  const sunCorona = new THREE.Mesh(
    new THREE.SphereGeometry(7.2, 16, 12),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.65, 1.48, 1.24),
      transparent: true,
      opacity: 0.42,
    }),
  );
  sunCorona.position.set(16, 21, 13);
  envScene.add(sunCorona);

  // 3. Cool Glacial Sky Fill & Northern Aurora Rim Panels (gives metallic edges rich cool/warm contrast)
  const fillPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 10),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.85, 1.35, 1.85),
      side: THREE.DoubleSide,
    }),
  );
  fillPanel.position.set(-18, 12, -16);
  fillPanel.lookAt(0, 0, 0);
  envScene.add(fillPanel);

  const horizonBounce = new THREE.Mesh(
    new THREE.CylinderGeometry(32, 32, 5.5, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.05, 1.18, 1.32),
      side: THREE.BackSide,
    }),
  );
  horizonBounce.position.y = 1.6;
  envScene.add(horizonBounce);

  // 4. Subtle dark alpine pine/ridge band just below horizon for authentic fresnel reflection breakup
  const ridgeBand = new THREE.Mesh(
    new THREE.CylinderGeometry(30, 30, 3.2, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x26394d,
      side: THREE.BackSide,
    }),
  );
  ridgeBand.position.y = -2.2;
  envScene.add(ridgeBand);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const renderTarget = pmrem.fromScene(envScene, 0.03);
  const envTex = renderTarget.texture;
  pmrem.dispose();

  // Dispose temporary scene geometries & materials (renderTarget.texture remains owned by scene.environment)
  envScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });

  return envTex;
}
