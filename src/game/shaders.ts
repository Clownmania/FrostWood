import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { MaterialPalette } from './models';
import type { WeatherKind, ZoneId } from './types';

export type FrostwoodSurfaceRole =
  | 'snow'
  | 'foliage'
  | 'stone'
  | 'wood'
  | 'ice'
  | 'water'
  | 'fabric';

export interface DynamicShaderInput {
  time: number;
  timeOfDay: number;
  nightFactor: number;
  twilightFactor: number;
  weather: WeatherKind;
  zone: ZoneId;
  frostOverlay: number;
  sunPos: readonly [number, number, number];
  sunColorHex: number;
  skyColorHex: number;
  hearthPos: readonly [number, number, number];
  hearthIntensity: number;
  enabled: boolean;
}

export interface DynamicShaderParams {
  enabledFactor: number;
  frostStrength: number;
  sparkleStrength: number;
  campfireWarmth: number;
  zoneMoodHex: number;
  vibrance: number;
  contrast: number;
  bloomLift: number;
  frostVignette: number;
  splitWarmth: number;
}

export interface FrostwoodShaderUniforms {
  uFwEnabled: { value: number };
  uFwSinglePassGrade: { value: number };
  uFwTime: { value: number };
  uFwSunDir: { value: THREE.Vector3 };
  uFwSunColor: { value: THREE.Color };
  uFwSkyColor: { value: THREE.Color };
  uFwZoneMood: { value: THREE.Color };
  uFwFrostStrength: { value: number };
  uFwSparkleStrength: { value: number };
  uFwCampfirePos: { value: THREE.Vector3 };
  uFwCampfireWarmth: { value: number };
  uFwNightFactor: { value: number };
  uFwTwilightFactor: { value: number };
  uFwVibrance: { value: number };
  uFwContrast: { value: number };
  uFwSplitWarmth: { value: number };
}

export interface FrostwoodPostPipeline {
  composer: EffectComposer;
  renderPass: RenderPass;
  ssaoPass: SSAOPass;
  bloomPass: UnrealBloomPass;
  shaderPass: ShaderPass;
  outputPass: OutputPass;
  setQuality: (opts: {
    postProcessing: boolean;
    bloom: boolean;
    ao: boolean;
  }) => void;
  setSize: (width: number, height: number, pixelRatio: number) => void;
  dispose: () => void;
}

const ZONE_MOOD_HEX: Record<ZoneId, number> = {
  level1: 0x56c3ff,
  level2: 0x3de5f2,
  level3: 0x8b6dff,
  level4: 0xff6e3d,
  level5: 0xd966ff,
  city: 0xffc66e,
};

const ZONE_CHILL_BIAS: Record<ZoneId, number> = {
  level1: 0.0,
  level2: 0.14,
  level3: 0.22,
  level4: 0.04,
  level5: 0.28,
  city: 0.02,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Computes normalized dynamic uniforms for the Frostwood world & post shaders
 * from live weather, day-night cycle, zone biome, and hearth state.
 */
export function computeDynamicShaderParams(
  input: DynamicShaderInput,
): DynamicShaderParams {
  const night = clamp01(input.nightFactor);
  const twilight = clamp01(input.twilightFactor);
  const enabledFactor = input.enabled ? 1.0 : 0.0;

  const weatherFrost =
    input.weather === 'blizzard'
      ? 0.92
      : input.weather === 'light_snow'
        ? 0.48
        : 0.18;
  const frostStrength = clamp01(
    weatherFrost + ZONE_CHILL_BIAS[input.zone] + night * 0.12,
  );

  const weatherSparkle =
    input.weather === 'clear'
      ? 0.96
      : input.weather === 'light_snow'
        ? 0.46
        : 0.18;
  const sparkleStrength =
    input.zone === 'city'
      ? 0.36
      : clamp01(weatherSparkle * (1.0 - night * 0.6) + twilight * 0.16);

  const hearthWeatherBoost =
    input.weather === 'blizzard' ? 0.34 : input.weather === 'light_snow' ? 0.16 : 0.0;
  const campfireWarmth = Math.max(
    0,
    Math.min(
      2.4,
      input.hearthIntensity * (0.48 + night * 1.02 + twilight * 0.62 + hearthWeatherBoost),
    ),
  );

  const zoneMoodHex = ZONE_MOOD_HEX[input.zone];
  const vibrance = input.enabled
    ? 0.36 + twilight * 0.1 + (input.zone === 'city' ? 0.06 : 0)
    : 0;
  const contrast = input.enabled
    ? 1.08 + (input.weather === 'clear' ? 0.03 : 0.01)
    : 1.0;
  const bloomLift = input.enabled
    ? 0.32 + twilight * 0.2 + night * 0.22 + (input.zone === 'city' ? 0.12 : 0)
    : 0;
  const frostVignette = input.enabled
    ? clamp01(
        input.frostOverlay * 0.48 +
          (input.weather === 'blizzard' ? 0.3 : input.weather === 'light_snow' ? 0.14 : 0.06),
      ) * 0.72
    : 0;
  const splitWarmth = input.enabled
    ? clamp01(0.46 + twilight * 0.44 - night * 0.16 + (input.zone === 'city' ? 0.22 : 0))
    : 0;

  return {
    enabledFactor,
    frostStrength,
    sparkleStrength,
    campfireWarmth,
    zoneMoodHex,
    vibrance,
    contrast,
    bloomLift,
    frostVignette,
    splitWarmth,
  };
}

export function createFrostwoodShaderUniforms(): FrostwoodShaderUniforms {
  return {
    uFwEnabled: { value: 1.0 },
    uFwSinglePassGrade: { value: 0.0 },
    uFwTime: { value: 0.0 },
    uFwSunDir: { value: new THREE.Vector3(0.45, 0.7, 0.35).normalize() },
    uFwSunColor: { value: new THREE.Color(0xffe4ba) },
    uFwSkyColor: { value: new THREE.Color(0x7da4cf) },
    uFwZoneMood: { value: new THREE.Color(ZONE_MOOD_HEX.level1) },
    uFwFrostStrength: { value: 0.18 },
    uFwSparkleStrength: { value: 0.94 },
    uFwCampfirePos: { value: new THREE.Vector3(0, 0.6, 0) },
    uFwCampfireWarmth: { value: 0.95 },
    uFwNightFactor: { value: 0.0 },
    uFwTwilightFactor: { value: 0.0 },
    uFwVibrance: { value: 0.34 },
    uFwContrast: { value: 1.15 },
    uFwSplitWarmth: { value: 0.46 },
  };
}

const ROLE_WEIGHTS: Record<
  FrostwoodSurfaceRole,
  {
    roleId: number;
    frost: number;
    sparkle: number;
    sss: number;
    rim: number;
    satBoost: number;
  }
> = {
  snow: { roleId: 0, frost: 0.22, sparkle: 1.0, sss: 0.45, rim: 0.35, satBoost: 0.1 },
  foliage: { roleId: 1, frost: 0.45, sparkle: 0.12, sss: 0.32, rim: 0.42, satBoost: 0.35 },
  stone: { roleId: 2, frost: 0.28, sparkle: 0.15, sss: 0.1, rim: 0.45, satBoost: 0.18 },
  wood: { roleId: 3, frost: 0.28, sparkle: 0.08, sss: 0.18, rim: 0.45, satBoost: 0.34 },
  ice: { roleId: 4, frost: 0.16, sparkle: 0.85, sss: 0.14, rim: 0.16, satBoost: 0.3 },
  water: { roleId: 5, frost: 0.04, sparkle: 0.72, sss: 0.08, rim: 0.14, satBoost: 0.42 },
  fabric: { roleId: 6, frost: 0.2, sparkle: 0.06, sss: 0.38, rim: 0.65, satBoost: 0.32 },
};

/**
 * Extends a Three.js MeshStandardMaterial / MeshPhysicalMaterial via onBeforeCompile
 * with sculpted snow sastrugi drift relief, rich boreal foliage color variation & frost tips,
 * translucent subsurface glow, crisp rim separation, living hearth bounce light,
 * crystalline snow sparkles, atmospheric horizon scatter, and snow-preserving vibrance.
 */
export function applyFrostwoodSurfaceShader(
  material: THREE.MeshStandardMaterial,
  role: FrostwoodSurfaceRole,
  sharedUniforms: FrostwoodShaderUniforms,
): void {
  if (material.userData.fwShaderApplied) return;
  material.userData.fwShaderApplied = true;
  material.userData.fwShaderRole = role;

  const weights = ROLE_WEIGHTS[role];
  const prevOnBeforeCompile = material.onBeforeCompile;
  const prevCacheKey = material.customProgramCacheKey?.bind(material);

  material.customProgramCacheKey = () => {
    const base = prevCacheKey ? prevCacheKey() : '';
    return `${base}|fwSurface_${role}_v2`;
  };

  material.onBeforeCompile = (shader, renderer) => {
    if (prevOnBeforeCompile) {
      prevOnBeforeCompile(shader, renderer);
    }

    shader.uniforms.uFwEnabled = sharedUniforms.uFwEnabled;
    shader.uniforms.uFwSinglePassGrade = sharedUniforms.uFwSinglePassGrade;
    shader.uniforms.uFwTime = sharedUniforms.uFwTime;
    shader.uniforms.uFwSunDir = sharedUniforms.uFwSunDir;
    shader.uniforms.uFwSunColor = sharedUniforms.uFwSunColor;
    shader.uniforms.uFwSkyColor = sharedUniforms.uFwSkyColor;
    shader.uniforms.uFwZoneMood = sharedUniforms.uFwZoneMood;
    shader.uniforms.uFwFrostStrength = sharedUniforms.uFwFrostStrength;
    shader.uniforms.uFwSparkleStrength = sharedUniforms.uFwSparkleStrength;
    shader.uniforms.uFwCampfirePos = sharedUniforms.uFwCampfirePos;
    shader.uniforms.uFwCampfireWarmth = sharedUniforms.uFwCampfireWarmth;
    shader.uniforms.uFwNightFactor = sharedUniforms.uFwNightFactor;
    shader.uniforms.uFwTwilightFactor = sharedUniforms.uFwTwilightFactor;
    shader.uniforms.uFwVibrance = sharedUniforms.uFwVibrance;
    shader.uniforms.uFwContrast = sharedUniforms.uFwContrast;
    shader.uniforms.uFwSplitWarmth = sharedUniforms.uFwSplitWarmth;

    shader.vertexShader =
      `varying vec3 vFwWorldPos;\nvarying vec3 vFwWorldNormal;\n` +
      shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vec4 fwPos4 = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          fwPos4 = instanceMatrix * fwPos4;
        #endif
        fwPos4 = modelMatrix * fwPos4;
        vFwWorldPos = fwPos4.xyz;
        vec3 fwLocN = objectNormal;
        #ifdef USE_INSTANCING
          fwLocN = mat3( instanceMatrix ) * fwLocN;
        #endif
        vFwWorldNormal = normalize( mat3( modelMatrix ) * fwLocN );`,
      );

    const fragHeader = /* glsl */ `
      uniform float uFwEnabled;
      uniform float uFwSinglePassGrade;
      uniform float uFwTime;
      uniform vec3 uFwSunDir;
      uniform vec3 uFwSunColor;
      uniform vec3 uFwSkyColor;
      uniform vec3 uFwZoneMood;
      uniform float uFwFrostStrength;
      uniform float uFwSparkleStrength;
      uniform vec3 uFwCampfirePos;
      uniform float uFwCampfireWarmth;
      uniform float uFwNightFactor;
      uniform float uFwTwilightFactor;
      uniform float uFwVibrance;
      uniform float uFwContrast;
      uniform float uFwSplitWarmth;
      varying vec3 vFwWorldPos;
      varying vec3 vFwWorldNormal;

      float fwHash31( vec3 p ) {
        p = fract( p * vec3( 0.1031, 0.1030, 0.0973 ) );
        p += dot( p, p.yxz + 33.33 );
        return fract( ( p.x + p.y ) * p.z );
      }

      float fwSmoothField( vec3 p ) {
        return sin( p.x * 0.72 + p.z * 0.48 ) * cos( p.z * 0.67 - p.y * 0.35 ) * 0.5 + 0.5;
      }

      vec2 fwSnowDriftGrad( vec2 xz ) {
        float w1 = sin( xz.x * 0.55 + xz.y * 0.32 ) * cos( xz.y * 0.44 - xz.x * 0.18 );
        float w2 = sin( xz.x * 1.45 - xz.y * 0.92 ) * 0.55;
        float gx = cos( xz.x * 0.55 + xz.y * 0.32 ) * 0.55 * cos( xz.y * 0.44 - xz.x * 0.18 ) + cos( xz.x * 1.45 - xz.y * 0.92 ) * 0.75;
        float gz = -sin( xz.y * 0.44 - xz.x * 0.18 ) * 0.44 * sin( xz.x * 0.55 + xz.y * 0.32 ) - cos( xz.x * 1.45 - xz.y * 0.92 ) * 0.5;
        return vec2( gx + w1 * 0.15, gz + w2 * 0.15 );
      }

      float fwCausticPattern( vec2 xz, float t ) {
        float a = sin( xz.x * 1.85 + t * 1.1 + sin( xz.y * 1.35 - t * 0.8 ) );
        float b = cos( xz.y * 2.15 - t * 0.95 + cos( xz.x * 1.45 + t * 0.7 ) );
        return pow( clamp( 1.0 - abs( a + b ) * 0.5, 0.0, 1.0 ), 3.2 );
      }
    `;

    const colorInject = /* glsl */ `
      #include <color_fragment>
      if ( uFwEnabled > 0.01 ) {
        vec3 fwColN = normalize( vFwWorldNormal );
        float fwUpMask = smoothstep( 0.18, 0.86, fwColN.y );
        float fwNoise = fwSmoothField( vFwWorldPos * 0.42 );
        int fwRole = ${weights.roleId};

        if ( fwRole == 0 ) {
          // Sculpted wind-swept sastrugi snow ripples with cool glacial troughs & sunlit ivory crests
          float fwRipple = sin( vFwWorldPos.x * 0.55 + vFwWorldPos.z * 0.32 ) * cos( vFwWorldPos.z * 0.44 - vFwWorldPos.x * 0.18 ) * 0.5 + 0.5;
          float fwSubRipple = fwSmoothField( vFwWorldPos * 1.35 );
          float fwCrest = clamp( fwRipple * 0.65 + fwSubRipple * 0.35, 0.0, 1.0 );
          vec3 fwSnowTrough = mix( vec3( 0.48, 0.60, 0.86 ), uFwZoneMood * 0.28 + vec3( 0.46, 0.58, 0.82 ), 0.24 );
          vec3 fwSnowCrest = vec3( 0.96, 0.95, 0.93 );
          vec3 fwSnowSculpt = mix( fwSnowTrough, fwSnowCrest, smoothstep( 0.18, 0.86, fwCrest ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * fwSnowSculpt, 0.65 * uFwEnabled );
        } else if ( fwRole == 1 ) {
          // Linear-sRGB calibrated deep boreal conifer gradient (rich pine-spruce contrast under white snow caps)
          float fwBough = fwSmoothField( vFwWorldPos * 0.9 + vec3( 0.0, vFwWorldPos.y * 1.1, 0.0 ) );
          vec3 fwDeepSpruce = vec3( 0.015, 0.058, 0.048 );
          vec3 fwEmeraldSun = vec3( 0.042, 0.145, 0.072 );
          vec3 fwCanopyTint = mix( fwDeepSpruce, fwEmeraldSun, clamp( fwUpMask * 0.65 + fwBough * 0.35, 0.0, 1.0 ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, fwCanopyTint, 0.58 * uFwEnabled );
          float fwTipFrost = smoothstep( 0.52, 0.94, fwColN.y ) * ( 0.4 + 0.6 * fwBough ) * ( 0.24 + uFwFrostStrength * 0.76 );
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.55, 0.72, 0.88 ), clamp( fwTipFrost * 0.24, 0.0, 0.24 ) * uFwEnabled );
        } else if ( fwRole == 2 ) {
          // Alpine granite strata contrast without chalk-bleaching flat cobblestones or arena slabs
          float fwStrata = fwSmoothField( vec3( vFwWorldPos.x * 0.3, vFwWorldPos.y * 1.65, vFwWorldPos.z * 0.3 ) );
          vec3 fwSlate = mix( vec3( 0.56, 0.62, 0.74 ), vec3( 0.98, 0.95, 0.90 ), fwStrata );
          diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * fwSlate, 0.42 * uFwEnabled );
          float fwRockSnow = fwUpMask * ( 0.25 + 0.75 * fwNoise ) * ( 0.18 + uFwFrostStrength * 0.65 );
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.74, 0.84, 0.94 ), clamp( fwRockSnow * 0.14, 0.0, 0.14 ) * uFwEnabled );
        } else if ( fwRole == 3 ) {
          // Warm honeyed Nordic cedar wood richness & subtle grain variation
          float fwGrain = fwSmoothField( vFwWorldPos * vec3( 1.2, 2.8, 1.2 ) );
          vec3 fwCedar = mix( vec3( 0.92, 0.78, 0.66 ), vec3( 1.15, 0.96, 0.76 ), fwGrain );
          diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * fwCedar, 0.48 * uFwEnabled );
        } else if ( fwRole == 4 ) {
          // Crisp translucent glacial ice cracks & clear frosted sheen
          float fwWave = fwCausticPattern( vFwWorldPos.xz * 0.65, uFwTime );
          vec3 fwIceCol = mix( vec3( 0.08, 0.30, 0.56 ), vec3( 0.34, 0.66, 0.88 ), fwWave );
          diffuseColor.rgb = mix( diffuseColor.rgb, mix( diffuseColor.rgb, fwIceCol, 0.42 ), 0.50 * uFwEnabled );
        } else if ( fwRole == 5 ) {
          // Deep glacial sapphire lagoon water contrasting cleanly beneath ice fractures
          float fwWave = fwCausticPattern( vFwWorldPos.xz * 0.65, uFwTime );
          vec3 fwLagoon = mix( vec3( 0.004, 0.042, 0.145 ), vec3( 0.020, 0.145, 0.34 ), fwWave );
          diffuseColor.rgb = mix( diffuseColor.rgb, mix( diffuseColor.rgb, fwLagoon, 0.72 ), 0.82 * uFwEnabled );
        } else {
          // Cozy woven wool & banner vibrancy boost
          float fwL = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
          vec3 fwRich = mix( vec3( fwL ), diffuseColor.rgb, 1.0 + ${weights.satBoost.toFixed(2)} );
          diffuseColor.rgb = mix( diffuseColor.rgb, clamp( fwRich, 0.0, 1.2 ), 0.75 * uFwEnabled );
        }

        // Subtle procedural cavity micro-occlusion on downward overhangs & shadowed crevices
        if ( fwRole != 0 && fwRole != 4 && fwRole != 5 ) {
          float fwCavityAo = mix( 0.84, 1.0, clamp( smoothstep( -0.45, 0.35, fwColN.y ) * 0.76 + fwNoise * 0.24, 0.0, 1.0 ) );
          diffuseColor.rgb *= mix( 1.0, fwCavityAo, 0.75 * uFwEnabled );
        }
      }
    `;

    const lightingInject = /* glsl */ `
      if ( uFwEnabled > 0.01 ) {
        vec3 fwN = normalize( vFwWorldNormal );
        int fwLightRole = ${weights.roleId};
        if ( fwLightRole == 0 ) {
          vec2 fwDrift = fwSnowDriftGrad( vFwWorldPos.xz );
          fwN = normalize( fwN + vec3( fwDrift.x * 0.24, 0.0, fwDrift.y * 0.24 ) );
        }
        vec3 fwV = normalize( cameraPosition - vFwWorldPos );
        vec3 fwL = normalize( uFwSunDir );
        float fwNdotL = dot( fwN, fwL );
        float fwLit = smoothstep( -0.18, 0.58, fwNdotL );
        float fwShade = 1.0 - max( fwNdotL, 0.0 );

        // 1. Prevent flat white clipping on snow so warm-sun / cool-cobalt relief reads crisply
        if ( fwLightRole == 0 ) {
          outgoingLight *= mix( 1.0, 0.78, uFwEnabled );
        }

        // 2. Sculpted Golden Sunlight vs Deep Arctic Cobalt Shadow Split Contrast
        vec3 fwCoolTint = mix( vec3( 0.48, 0.66, 1.04 ), uFwZoneMood * 0.65 + vec3( 0.42, 0.54, 0.82 ), 0.34 );
        vec3 fwWarmTint = mix( vec3( 1.14, 1.03, 0.86 ), uFwSunColor * 0.42 + vec3( 0.82 ), 0.55 );
        vec3 fwStyledLight = mix( outgoingLight * fwCoolTint, outgoingLight * fwWarmTint, fwLit );
        outgoingLight = mix( outgoingLight, fwStyledLight, 0.78 * uFwEnabled );

        // 3. Soft Snow, Ice & Conifer Subsurface Scattering Glow
        float fwWrap = clamp( ( fwNdotL + 0.55 ) / 1.55, 0.0, 1.0 );
        float fwBack = pow( clamp( dot( fwV, -fwL ) * 0.5 + 0.5, 0.0, 1.0 ), 2.1 );
        float fwSunHeight = clamp( fwL.y * 1.45 + 0.35, 0.0, 1.0 );
        vec3 fwSssColor = fwLightRole == 1
          ? mix( vec3( 0.22, 0.68, 0.42 ), uFwSunColor, 0.38 )
          : mix( uFwSunColor, uFwZoneMood, 0.34 + uFwNightFactor * 0.35 );
        outgoingLight += fwSssColor * ( fwBack * 0.34 + fwWrap * 0.12 ) * fwSunHeight * ${weights.sss.toFixed(2)} * uFwEnabled;

        // 4. Crisp Rim Light Separation & Glacial Caustic Sheen
        float fwFresnel = pow( 1.0 - max( dot( fwN, fwV ), 0.0 ), 2.3 );
        vec3 fwRimTint = mix( mix( uFwSkyColor, uFwZoneMood, 0.55 ), uFwSunColor, 0.35 + uFwTwilightFactor * 0.45 );
        outgoingLight += fwRimTint * fwFresnel * ${weights.rim.toFixed(2)} * ( 0.46 + 0.28 * uFwTwilightFactor ) * uFwEnabled;

        if ( fwLightRole == 4 || fwLightRole == 5 ) {
          float fwCaustic = fwCausticPattern( vFwWorldPos.xz * 0.72, uFwTime );
          outgoingLight += vec3( 0.06, 0.32, 0.62 ) * fwCaustic * 0.14 * uFwEnabled;
        }

        // 5. Cozy Living Campfire & Hearth Bounce Radiance (richer in shade, twilight & night without washing bright snow)
        vec3 fwToFire = uFwCampfirePos - vFwWorldPos;
        float fwFireDist = length(fwToFire );
        if ( fwFireDist < 19.0 && uFwCampfireWarmth > 0.01 ) {
          float fwFireAtten = clamp( 9.5 / ( dot( fwToFire, fwToFire ) + 3.4 ), 0.0, 1.0 ) * smoothstep( 19.0, 1.8, fwFireDist );
          float fwFireFace = clamp( dot( fwN, normalize( fwToFire + vec3( 0.0, 0.65, 0.0 ) ) ) * 0.72 + 0.28, 0.0, 1.0 );
          float fwPulse = 0.88 + 0.12 * sin( uFwTime * 6.8 + vFwWorldPos.x * 0.45 + vFwWorldPos.z * 0.39 );
          float fwAlreadyBright = smoothstep( 0.95, 2.35, dot( outgoingLight, vec3( 0.333 ) ) ) * ( 1.0 - max( uFwNightFactor, uFwTwilightFactor * 0.75 ) );
          float fwEmberWeight = mix( 0.72, 0.18, fwAlreadyBright );
          vec3 fwEmberGlow = vec3( 1.0, 0.44, 0.11 ) * fwFireAtten * fwFireFace * fwPulse * uFwCampfireWarmth * fwEmberWeight;
          outgoingLight = mix( outgoingLight, outgoingLight * vec3( 1.07, 0.91, 0.72 ), fwFireAtten * 0.45 * uFwEnabled ) + fwEmberGlow * uFwEnabled;
        }

        // 6. Crystalline Sunlit Snow & Lake Ice Sparkle Glints
        if ( uFwSparkleStrength * ${weights.sparkle.toFixed(2)} > 0.04 ) {
          vec3 fwScaled = vFwWorldPos * 3.8;
          vec3 fwCell = floor( fwScaled );
          vec3 fwFrac = fract( fwScaled ) - 0.5;
          float fwSpark = fwHash31( fwCell );
          if ( fwSpark > 0.86 ) {
            float fwPin = smoothstep( 0.40, 0.03, length( fwFrac ) );
            vec3 fwH = normalize( fwL + fwV );
            float fwSpec = pow( max( dot( fwN, fwH ), 0.0 ), 10.0 );
            float fwTwinkle = 0.45 + 0.55 * sin( uFwTime * 3.6 + fwSpark * 61.0 );
            float fwDistFade = smoothstep( 52.0, 2.5, distance( cameraPosition, vFwWorldPos ) );
            outgoingLight += mix( vec3( 0.82, 0.96, 1.0 ), uFwSunColor, 0.45 ) * fwPin * ( 0.45 + 0.85 * fwSpec ) * fwTwinkle * fwDistFade * uFwSparkleStrength * ${weights.sparkle.toFixed(2)} * 0.78 * uFwEnabled;
          }
        }

        // Crisp sapphire skylight shadow bounce on steep leeward slopes
        outgoingLight += mix( vec3( 0.04, 0.13, 0.30 ), uFwZoneMood * 0.18, 0.35 ) * fwShade * smoothstep( -0.25, 0.85, fwN.y ) * 0.24 * ( 1.0 - uFwNightFactor * 0.45 ) * uFwEnabled;
      }
      #include <opaque_fragment>
    `;

    const fogAndGradeInject = /* glsl */ `
      #include <fog_fragment>
      if ( uFwEnabled > 0.01 ) {
        float fwCamDist = distance( cameraPosition, vFwWorldPos );
        vec3 fwViewDir = normalize( vFwWorldPos - cameraPosition );
        float fwSunAlign = pow( max( dot( fwViewDir, normalize( uFwSunDir ) ), 0.0 ), 3.0 );
        float fwAerial = smoothstep( 18.0, 95.0, fwCamDist ) * 0.24;
        vec3 fwAerialTint = mix( mix( vec3( 0.34, 0.56, 0.86 ), uFwZoneMood * 0.75 + vec3( 0.22 ), 0.32 ), uFwSunColor, fwSunAlign * 0.48 + uFwTwilightFactor * 0.22 );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fwAerialTint, fwAerial * uFwEnabled );

        if ( uFwSinglePassGrade > 0.5 ) {
          vec3 fwSrgb = gl_FragColor.rgb;
          float fwLuma = dot( fwSrgb, vec3( 0.2126, 0.7152, 0.0722 ) );
          float fwMaxC = max( fwSrgb.r, max( fwSrgb.g, fwSrgb.b ) );
          float fwMinC = min( fwSrgb.r, min( fwSrgb.g, fwSrgb.b ) );
          float fwSat = fwMaxC - fwMinC;
          float fwVibWeight = ( 1.0 - clamp( fwSat * 1.35, 0.0, 1.0 ) ) * smoothstep( 0.04, 0.22, fwLuma ) * ( 1.0 - smoothstep( 0.84, 0.99, fwLuma ) * 0.72 );
          fwSrgb = mix( vec3( fwLuma ), fwSrgb, 1.0 + uFwVibrance * fwVibWeight );

          vec3 fwCoolSh = mix( vec3( 0.04, 0.12, 0.28 ), uFwZoneMood * 0.22, 0.35 );
          vec3 fwWarmHi = mix( vec3( 1.0, 0.96, 0.88 ), vec3( 1.0, 0.88, 0.72 ), uFwSplitWarmth );
          float fwShMask = clamp( 1.0 - fwLuma * 1.75, 0.0, 1.0 );
          float fwHiMask = smoothstep( 0.52, 0.94, fwLuma );
          fwSrgb = mix( fwSrgb, fwSrgb + fwCoolSh * 0.12, fwShMask );
          fwSrgb = mix( fwSrgb, fwSrgb * fwWarmHi, fwHiMask * 0.14 );
          vec3 fwContrasted = clamp( ( fwSrgb - 0.42 ) * uFwContrast + 0.42, 0.0, 1.0 );
          float fwHighlightRoll = smoothstep( 0.74, 0.99, fwLuma );
          fwSrgb = mix( fwContrasted, fwSrgb * 0.96, fwHighlightRoll * 0.78 );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fwSrgb, uFwEnabled );
        }
      }
    `;

    shader.fragmentShader =
      fragHeader +
      shader.fragmentShader
        .replace('#include <color_fragment>', colorInject)
        .replace('#include <opaque_fragment>', lightingInject)
        .replace('#include <fog_fragment>', fogAndGradeInject);
  };

  material.needsUpdate = true;
}

export function enhancePaletteMaterialsWithShader(
  palette: MaterialPalette,
  sharedUniforms: FrostwoodShaderUniforms,
): void {
  applyFrostwoodSurfaceShader(palette.snowMat, 'snow', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.pineNeedleMat, 'foliage', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.spruceNeedleMat, 'foliage', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.elderNeedleMat, 'foliage', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.barkMat, 'wood', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.birchBarkMat, 'wood', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.logEndMat, 'wood', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.timberMat, 'wood', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.darkWoodMat, 'wood', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.stoneMat, 'stone', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.rockMat, 'stone', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.iceMat, 'ice', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.furTrimMat, 'fabric', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.coatRedMat, 'fabric', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.coatBlueMat, 'fabric', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.coatGreenMat, 'fabric', sharedUniforms);
  applyFrostwoodSurfaceShader(palette.canvasMat, 'fabric', sharedUniforms);
}

/**
 * Full-screen linear HDR post-processing shader pass providing thresholded
 * sunlit/fire bloom halation, snow-preserving vibrance, cool/warm split-toning,
 * and adaptive blizzard frost vignette.
 */
export const FrostwoodPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uTime: { value: 0 },
    uEnabled: { value: 1.0 },
    uVibrance: { value: 0.34 },
    uContrast: { value: 1.15 },
    uBloomLift: { value: 0.36 },
    uFrostVignette: { value: 0.08 },
    uSplitWarmth: { value: 0.46 },
    uZoneMood: { value: new THREE.Color(ZONE_MOOD_HEX.level1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uEnabled;
    uniform float uVibrance;
    uniform float uContrast;
    uniform float uBloomLift;
    uniform float uFrostVignette;
    uniform float uSplitWarmth;
    uniform vec3 uZoneMood;
    varying vec2 vUv;

    vec3 fwBrightPass( vec3 c ) {
      float lum = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
      float soft = smoothstep( 0.72, 1.45, lum );
      return c * soft;
    }

    void main() {
      vec4 baseSample = texture2D( tDiffuse, vUv );
      if ( uEnabled < 0.01 ) {
        gl_FragColor = baseSample;
        return;
      }

      vec3 col = baseSample.rgb;

      // 1. 5-tap edge-preserving linear HDR bloom halation around campfires, portals & crystal glints
      vec2 texel = 2.2 / max( uResolution, vec2( 1.0 ) );
      vec3 bloom = fwBrightPass( texture2D( tDiffuse, vUv + vec2( texel.x, 0.0 ) ).rgb );
      bloom += fwBrightPass( texture2D( tDiffuse, vUv - vec2( texel.x, 0.0 ) ).rgb );
      bloom += fwBrightPass( texture2D( tDiffuse, vUv + vec2( 0.0, texel.y ) ).rgb );
      bloom += fwBrightPass( texture2D( tDiffuse, vUv - vec2( 0.0, texel.y ) ).rgb );
      bloom += fwBrightPass( col );
      bloom *= 0.2;
      col += bloom * uBloomLift * 0.45;

      // 2. Snow-preserving adaptive vibrance
      float luma = dot( col, vec3( 0.2126, 0.7152, 0.0722 ) );
      float maxC = max( col.r, max( col.g, col.b ) );
      float minC = min( col.r, min( col.g, col.b ) );
      float sat = maxC - minC;
      float vibWeight = ( 1.0 - clamp( sat * 1.35, 0.0, 1.0 ) ) * smoothstep( 0.04, 0.24, luma ) * ( 1.0 - smoothstep( 0.90, 1.45, luma ) * 0.7 );
      col = mix( vec3( luma ), col, 1.0 + uVibrance * vibWeight );

      // 3. Arctic cool-shadow / warm-highlight filmic split-toning
      vec3 coolShadow = mix( vec3( 0.06, 0.14, 0.30 ), uZoneMood * 0.25, 0.35 );
      vec3 warmHighlight = mix( vec3( 1.0, 0.95, 0.86 ), vec3( 1.0, 0.85, 0.66 ), uSplitWarmth );
      float shadowMask = clamp( 1.0 - luma * 1.8, 0.0, 1.0 );
      float hiMask = smoothstep( 0.50, 1.30, luma );
      col = mix( col, col + coolShadow * 0.14, shadowMask );
      col = mix( col, col * warmHighlight, hiMask * 0.20 );

      // 4. Crisp filmic midtone contrast curve around neutral pivot
      col = max( vec3( 0.0 ), ( col - 0.18 ) * uContrast + 0.18 );

      // 5. Soft cinematic & frost edge vignette during blizzards
      vec2 centered = vUv - 0.5;
      float rad = length( centered * vec2( 1.15, 0.95 ) );
      float vig = smoothstep( 0.44, 0.88, rad );
      vec3 edgeFrostTint = mix( vec3( 0.03, 0.07, 0.14 ), vec3( 0.55, 0.78, 0.95 ), clamp( uFrostVignette * 1.2, 0.0, 0.65 ) );
      col = mix( col, col * ( 1.0 - vig * ( 0.20 + uFrostVignette * 0.24 ) ) + edgeFrostTint * vig * uFrostVignette * 0.34, vig );

      gl_FragColor = vec4( col, baseSample.a );
    }
  `,
};

export function createFrostwoodPostPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number,
): FrostwoodPostPipeline {
  const pixelRatio = renderer.getPixelRatio();
  const safeW = Math.max(1, Math.floor(width));
  const safeH = Math.max(1, Math.floor(height));

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(safeW, safeH);

  const renderPass = new RenderPass(scene, camera);

  // 16-tap contact SSAO tuned for crisp snow architecture & rocky crevices without noise
  const ssaoPass = new SSAOPass(scene, camera, safeW, safeH, 16);
  ssaoPass.kernelRadius = 10;
  ssaoPass.minDistance = 0.004;
  ssaoPass.maxDistance = 0.08;
  ssaoPass.output = SSAOPass.OUTPUT.Default;

  // Threshold >= 0.86 preserves crisp sunlit snow albedo while blooming campfires, portals & lanterns
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(safeW, safeH),
    0.34,
    0.35,
    0.86,
  );

  const shaderPass = new ShaderPass(FrostwoodPostShader);
  const outputPass = new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(ssaoPass);
  composer.addPass(bloomPass);
  composer.addPass(shaderPass);
  composer.addPass(outputPass);

  shaderPass.uniforms.uResolution.value.set(
    Math.max(1, safeW * pixelRatio),
    Math.max(1, safeH * pixelRatio),
  );

  return {
    composer,
    renderPass,
    ssaoPass,
    bloomPass,
    shaderPass,
    outputPass,
    setQuality: ({ postProcessing, bloom, ao }) => {
      ssaoPass.enabled = postProcessing && ao;
      bloomPass.enabled = postProcessing && bloom;
      shaderPass.enabled = postProcessing;
    },
    setSize: (w: number, h: number, pr: number) => {
      const cw = Math.max(1, Math.floor(w));
      const ch = Math.max(1, Math.floor(h));
      composer.setPixelRatio(pr);
      composer.setSize(cw, ch);
      ssaoPass.setSize(cw, ch);
      bloomPass.setSize(cw, ch);
      shaderPass.uniforms.uResolution.value.set(
        Math.max(1, cw * pr),
        Math.max(1, ch * pr),
      );
    },
    dispose: () => {
      ssaoPass.dispose();
      bloomPass.dispose();
      shaderPass.dispose();
      outputPass.dispose();
      composer.dispose();
    },
  };
}

export function updateFrostwoodShaderUniforms(
  uniforms: FrostwoodShaderUniforms,
  postPipeline: FrostwoodPostPipeline | null,
  input: DynamicShaderInput,
  composerActive = Boolean(postPipeline),
): DynamicShaderParams {
  const params = computeDynamicShaderParams(input);

  uniforms.uFwEnabled.value = params.enabledFactor;
  uniforms.uFwSinglePassGrade.value = input.enabled && !composerActive ? 1.0 : 0.0;
  uniforms.uFwTime.value = input.time;
  uniforms.uFwSunDir.value
    .set(input.sunPos[0], input.sunPos[1], input.sunPos[2])
    .normalize();
  uniforms.uFwSunColor.value.setHex(input.sunColorHex);
  uniforms.uFwSkyColor.value.setHex(input.skyColorHex);
  uniforms.uFwZoneMood.value.setHex(params.zoneMoodHex);
  uniforms.uFwFrostStrength.value = params.frostStrength;
  uniforms.uFwSparkleStrength.value = params.sparkleStrength;
  uniforms.uFwCampfirePos.value.set(
    input.hearthPos[0],
    input.hearthPos[1],
    input.hearthPos[2],
  );
  uniforms.uFwCampfireWarmth.value = params.campfireWarmth;
  uniforms.uFwNightFactor.value = clamp01(input.nightFactor);
  uniforms.uFwTwilightFactor.value = clamp01(input.twilightFactor);
  uniforms.uFwVibrance.value = params.vibrance;
  uniforms.uFwContrast.value = params.contrast;
  uniforms.uFwSplitWarmth.value = params.splitWarmth;

  if (postPipeline) {
    const pu = postPipeline.shaderPass.uniforms;
    pu.uTime.value = input.time;
    pu.uEnabled.value = params.enabledFactor;
    pu.uVibrance.value = params.vibrance;
    pu.uContrast.value = params.contrast;
    // Scale screen-space halation down when UnrealBloomPass handles HDR mip bloom
    pu.uBloomLift.value = postPipeline.bloomPass.enabled
      ? params.bloomLift * 0.35
      : params.bloomLift;
    pu.uFrostVignette.value = params.frostVignette;
    pu.uSplitWarmth.value = params.splitWarmth;
    (pu.uZoneMood.value as THREE.Color).setHex(params.zoneMoodHex);
  }

  return params;
}
