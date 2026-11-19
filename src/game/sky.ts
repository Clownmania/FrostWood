import * as THREE from 'three';
import type { ZoneId } from './types';

export interface SkyDomeVisual {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  uniforms: {
    uHorizonColor: { value: THREE.Color };
    uZenithColor: { value: THREE.Color };
    uSunDir: { value: THREE.Vector3 };
    uSunColor: { value: THREE.Color };
    uNightFactor: { value: number };
    uTwilightFactor: { value: number };
    uAuroraStrength: { value: number };
    uCloudCover: { value: number };
    uTime: { value: number };
    uIsCity: { value: number };
    uEnhanced: { value: number };
  };
  dispose: () => void;
}

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uHorizonColor;
  uniform vec3 uZenithColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uNightFactor;
  uniform float uTwilightFactor;
  uniform float uAuroraStrength;
  uniform float uCloudCover;
  uniform float uTime;
  uniform float uIsCity;
  uniform float uEnhanced;

  varying vec3 vWorldDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * vnoise(p);
      p = p * 2.03 + vec2(11.3, 7.1);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float elev = clamp(dir.y, -0.15, 1.0);
    float skyGrad = pow(clamp(elev, 0.0, 1.0), 0.55);

    // Base arctic atmospheric gradient (deepened cobalt zenith when enhanced shader is active)
    vec3 richZenith = mix(uZenithColor, uZenithColor * vec3(0.68, 0.86, 1.18), uEnhanced * 0.72);
    vec3 richHorizon = mix(uHorizonColor, mix(uHorizonColor, vec3(0.62, 0.82, 0.98), 0.35), uEnhanced * 0.5);
    vec3 col = mix(richHorizon, richZenith, skyGrad);

    // Subterranean cavern dome override for Frostcave City
    if (uIsCity > 0.5) {
      vec2 cavUv = dir.xz / max(0.25, abs(dir.y) + 0.35);
      float cavNoise = fbm(cavUv * 2.4 + vec2(0.4, -0.2));
      vec3 cavDeep = vec3(0.04, 0.07, 0.13);
      vec3 cavIceGlow = mix(vec3(0.11, 0.24, 0.36), vec3(0.14, 0.42, 0.62), uEnhanced);
      vec3 cavCol = mix(uHorizonColor * 0.72, mix(cavDeep, cavIceGlow, cavNoise * (0.65 + uEnhanced * 0.25)), smoothstep(0.0, 0.65, elev));
      gl_FragColor = vec4(cavCol, 1.0);
      return;
    }

    // Horizon golden/rose atmospheric scattering band during dawn, dusk & sunlit days
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float horizonBand = exp(-max(elev, 0.0) * (4.8 - uEnhanced * 1.15));
    col += uSunColor * horizonBand * (0.16 + uEnhanced * 0.18 + uTwilightFactor * 0.38) * (0.35 + 0.65 * pow(sunDot, 2.0));

    // Solar / Lunar disc & Mie corona
    float disc = smoothstep(0.9968, 0.9988, sunDot);
    float halo = pow(sunDot, 26.0) * (0.48 + uEnhanced * 0.28 + 0.26 * uTwilightFactor) + pow(sunDot, 5.0) * (0.15 + uEnhanced * 0.14);
    float weatherMask = 1.0 - clamp(uCloudCover * 0.65, 0.0, 0.75);
    vec3 celestialTint = mix(uSunColor, vec3(0.75, 0.88, 1.0), uNightFactor * 0.85);
    col += celestialTint * (disc * (1.28 - uNightFactor * 0.55) + halo) * weatherMask * smoothstep(-0.04, 0.12, elev);

    // Volumetric dual-layer arctic clouds with sunlit forward-scattering rim highlights
    if (elev > 0.02) {
      vec2 cloudUv = dir.xz / (elev + 0.22);
      float c1 = fbm(cloudUv * 0.55 + vec2(uTime * 0.008, uTime * 0.004));
      float c2 = fbm(cloudUv * 1.18 - vec2(uTime * 0.005, uTime * 0.003));
      float cloudField = c1 * 0.7 + c2 * 0.3;
      float cloudAlpha = smoothstep(0.43 - uCloudCover * 0.16, 0.78, cloudField) * smoothstep(0.02, 0.25, elev) * (0.34 + uCloudCover * 0.44);
      vec3 cloudShadow = mix(vec3(0.48, 0.60, 0.76), vec3(0.09, 0.14, 0.25), uNightFactor * 0.88);
      vec3 cloudBright = mix(vec3(0.95, 0.97, 1.0), uSunColor * 0.95 + vec3(0.2), uTwilightFactor * 0.78 + uEnhanced * 0.20);
      cloudBright = mix(cloudBright, vec3(0.16, 0.24, 0.38), uNightFactor * 0.88);
      float cloudSunRim = pow(sunDot, 4.0) * (1.0 - c2 * 0.45) * (1.0 - uNightFactor * 0.75);
      vec3 cloudCol = mix(cloudShadow, cloudBright, clamp(0.42 + c2 * 0.55 + cloudSunRim * 0.45, 0.0, 1.0));
      col = mix(col, cloudCol, clamp(cloudAlpha, 0.0, 0.72));
    }

    // Polar starfield & shimmering Aurora Borealis curtains at night / high zones
    float starVis = clamp((uNightFactor * 0.95 + uAuroraStrength * 0.25) * (1.0 - uCloudCover * 0.7), 0.0, 1.0);
    if (starVis > 0.02 && elev > 0.08) {
      vec2 starGrid = floor((dir.xz / (elev + 0.45)) * 130.0);
      float starRand = hash21(starGrid);
      if (starRand > 0.991) {
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.6 + starRand * 62.0);
        col += vec3(0.82, 0.91, 1.0) * starVis * twinkle * smoothstep(0.08, 0.35, elev) * 0.85;
      }
    }

    float auroraVis = clamp(max(uNightFactor * 0.85, uAuroraStrength), 0.0, 1.0) * (1.0 - uCloudCover * 0.55);
    if (auroraVis > 0.02 && elev > 0.07) {
      vec2 aurUv = vec2(dir.x * 2.2 + dir.z * 0.9, elev * 3.0);
      float curtain = sin(aurUv.x * 3.2 + sin(aurUv.x * 1.4 + uTime * 0.22) * 1.8 + uTime * 0.14);
      float ribbon = smoothstep(0.2, 0.95, curtain * 0.5 + 0.5) * smoothstep(0.07, 0.28, elev) * smoothstep(0.88, 0.24, elev);
      float shimmer = 0.65 + 0.35 * sin(dir.x * 11.0 - uTime * 0.8 + dir.z * 7.0);
      vec3 aurGreen = vec3(0.18, 0.92, 0.68);
      vec3 aurViolet = vec3(0.58, 0.32, 0.96);
      vec3 aurCol = mix(aurGreen, aurViolet, smoothstep(0.22, 0.58, elev));
      col += aurCol * ribbon * shimmer * auroraVis * (0.42 + uEnhanced * 0.28);
    }

    // Seamless blend into fog near/below horizon
    float fogBlend = smoothstep(0.16, -0.02, elev);
    col = mix(col, richHorizon, fogBlend);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSkyDome(): SkyDomeVisual {
  const geo = new THREE.SphereGeometry(225, 32, 20);
  const uniforms = {
    uHorizonColor: { value: new THREE.Color(0x7da4cf) },
    uZenithColor: { value: new THREE.Color(0x2d588a) },
    uSunDir: { value: new THREE.Vector3(0.45, 0.65, 0.35).normalize() },
    uSunColor: { value: new THREE.Color(0xfff0d4) },
    uNightFactor: { value: 0 },
    uTwilightFactor: { value: 0 },
    uAuroraStrength: { value: 0 },
    uCloudCover: { value: 0.15 },
    uTime: { value: 0 },
    uIsCity: { value: 0 },
    uEnhanced: { value: 1.0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;

  return {
    mesh,
    uniforms,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

const _zenithDay = new THREE.Color(0x315f94);
const _zenithTwilight = new THREE.Color(0x282747);
const _zenithNight = new THREE.Color(0x040916);
const _zenithTemp = new THREE.Color();

export function updateSkyDome(
  dome: SkyDomeVisual,
  opts: {
    centerX: number;
    centerZ: number;
    horizonColor: THREE.Color;
    sunOffsetX: number;
    sunOffsetY: number;
    sunOffsetZ: number;
    sunColor: THREE.Color;
    nightFactor: number;
    twilightFactor: number;
    weatherCloudCover: number;
    time: number;
    zone: ZoneId;
    enhancedShaders?: boolean;
  },
): void {
  dome.mesh.position.set(opts.centerX, 0, opts.centerZ);
  dome.uniforms.uHorizonColor.value.copy(opts.horizonColor);

  _zenithTemp.copy(_zenithDay);
  _zenithTemp.lerp(_zenithTwilight, Math.min(1, opts.twilightFactor * 0.9));
  _zenithTemp.lerp(_zenithNight, Math.min(1, opts.nightFactor));
  if (opts.zone === 'level5') {
    _zenithTemp.lerp(new THREE.Color(0x1b1038), 0.45);
  } else if (opts.zone === 'level3') {
    _zenithTemp.lerp(new THREE.Color(0x13264d), 0.35);
  }
  dome.uniforms.uZenithColor.value.copy(_zenithTemp);

  dome.uniforms.uSunDir.value
    .set(opts.sunOffsetX, opts.sunOffsetY, opts.sunOffsetZ)
    .normalize();
  dome.uniforms.uSunColor.value.copy(opts.sunColor);
  dome.uniforms.uNightFactor.value = opts.nightFactor;
  dome.uniforms.uTwilightFactor.value = opts.twilightFactor;
  dome.uniforms.uCloudCover.value = opts.weatherCloudCover;
  dome.uniforms.uTime.value = opts.time;
  dome.uniforms.uIsCity.value = opts.zone === 'city' ? 1.0 : 0.0;
  if (opts.enhancedShaders !== undefined) {
    dome.uniforms.uEnhanced.value = opts.enhancedShaders ? 1.0 : 0.0;
  }
  dome.uniforms.uAuroraStrength.value =
    opts.zone === 'level5'
      ? 0.9
      : opts.zone === 'level3'
        ? 0.45
        : opts.zone === 'level2'
          ? 0.2
          : 0.08;
}
