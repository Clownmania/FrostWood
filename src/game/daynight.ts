import * as THREE from 'three';
import type { AnimalKind, DayNightState, DayPhase, WeatherKind } from './types';

export const DAY_CYCLE_DURATION = 120; // Full 24h Arctic day-night cycle in seconds
export const INITIAL_TIME_OF_DAY = 0.36; // ~08:38 AM crisp morning start

export interface WildlifeTimeProfile {
  speedScale: number;
  stalkSpeedScale: number;
  detectRadiusScale: number;
  spookRadiusScale: number;
  windupScale: number;
  spawnWeightScale: number;
}

export interface EnvironmentLightingSample {
  skyColorHex: number;
  fogDensityMult: number;
  sunColorHex: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  rimColorHex: number;
  rimIntensity: number;
  environmentIntensity: number;
  exposure: number;
  campfireGlowMult: number;
  nightFactor: number;
  twilightFactor: number;
  predatorEyeEmissive: number;
}

export function normalizeTimeOfDay(t: number): number {
  const mod = t % 1;
  return mod < 0 ? mod + 1 : mod;
}

export function parseTimeOfDayParam(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'dawn') return 0.26;
  if (trimmed === 'day' || trimmed === 'noon') return 0.5;
  if (trimmed === 'dusk' || trimmed === 'sunset') return 0.76;
  if (trimmed === 'night' || trimmed === 'midnight') return 0.0;
  const num = Number(trimmed);
  if (Number.isFinite(num)) {
    return normalizeTimeOfDay(num);
  }
  return null;
}

export function getDayPhase(timeOfDay: number): DayPhase {
  const hour = normalizeTimeOfDay(timeOfDay) * 24;
  if (hour >= 5 && hour < 7.5) return 'dawn';
  if (hour >= 7.5 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19.5) return 'dusk';
  return 'night';
}

export function getDayPhaseLabel(phase: DayPhase): string {
  switch (phase) {
    case 'dawn':
      return 'Dawn';
    case 'day':
      return 'Daylight';
    case 'dusk':
      return 'Dusk';
    case 'night':
      return 'Arctic Night';
  }
}

export function formatClockTime(timeOfDay: number): string {
  const totalMinutes = Math.floor(normalizeTimeOfDay(timeOfDay) * 24 * 60) % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function advanceTimeOfDay(
  timeOfDay: number,
  dayNumber: number,
  dt: number,
  cycleDuration = DAY_CYCLE_DURATION,
): {
  timeOfDay: number;
  dayNumber: number;
  prevPhase: DayPhase;
  nextPhase: DayPhase;
  phaseChanged: boolean;
  dayWrapped: boolean;
} {
  const prevPhase = getDayPhase(timeOfDay);
  const safeDuration = Math.max(10, cycleDuration);
  const rawNext = timeOfDay + Math.max(0, dt) / safeDuration;
  const dayWrapped = rawNext >= 1;
  const nextTime = normalizeTimeOfDay(rawNext);
  const nextDay = dayWrapped ? dayNumber + Math.floor(rawNext) : dayNumber;
  const nextPhase = getDayPhase(nextTime);
  return {
    timeOfDay: nextTime,
    dayNumber: nextDay,
    prevPhase,
    nextPhase,
    phaseChanged: prevPhase !== nextPhase,
    dayWrapped,
  };
}

/**
 * Computes continuous thermal chill multiplier across the 24h cycle:
 * 1.00x at solar noon (timeOfDay = 0.5), rising smoothly through twilight (~1.22x)
 * to 1.65x during deep Arctic midnight (timeOfDay = 0.0).
 */
export function computeTemperatureDecayMultiplier(timeOfDay: number): number {
  const t = normalizeTimeOfDay(timeOfDay);
  // cos(2*PI*(t - 0.5)) is +1 at noon (0.5) and -1 at midnight (0.0)
  const darkness = (1 - Math.cos((t - 0.5) * Math.PI * 2)) * 0.5; // 0 at noon, 1 at midnight
  const smoothDarkness = Math.pow(darkness, 1.15);
  return Math.round((1.0 + smoothDarkness * 0.65) * 1000) / 1000;
}

export function computeNightFactor(timeOfDay: number): number {
  const t = normalizeTimeOfDay(timeOfDay);
  // Sun height sine: +1 at noon, 0 at 06:00 & 18:00, -1 at midnight
  const sunSin = Math.sin((t - 0.25) * Math.PI * 2);
  // Delay deep Arctic night onset until sun drops below horizon (-0.02 -> -0.28) so sunset glows amber-gold
  return THREE.MathUtils.clamp((-0.02 - sunSin) / 0.26, 0, 1);
}

export function computeTwilightFactor(timeOfDay: number): number {
  const t = normalizeTimeOfDay(timeOfDay);
  const sunSin = Math.sin((t - 0.25) * Math.PI * 2);
  // Peaks around sunSin === 0 (dawn & dusk)
  return THREE.MathUtils.clamp(1 - Math.abs(sunSin) / 0.34, 0, 1);
}

/**
 * Species-specific circadian activity scaling for speeds, perception radii, and spawns.
 */
export function computeWildlifeTimeProfile(
  timeOfDay: number,
  kind: AnimalKind,
): WildlifeTimeProfile {
  const night = computeNightFactor(timeOfDay);
  const twilight = computeTwilightFactor(timeOfDay);

  if (kind === 'hare' || kind === 'stag' || kind === 'frost_stag' || kind === 'musk_ox') {
    // Diurnal grazers: brisk & alert by day, slower & less perceptive at night
    return {
      speedScale: THREE.MathUtils.lerp(1.04, 0.72, night),
      stalkSpeedScale: 1,
      detectRadiusScale: THREE.MathUtils.lerp(1.0, 0.82, night),
      spookRadiusScale: THREE.MathUtils.lerp(1.0, 0.86, night),
      windupScale: 1,
      spawnWeightScale: THREE.MathUtils.lerp(1.15, 0.65, night),
    };
  }

  if (kind === 'fox' || kind === 'snow_owl') {
    // Crepuscular / nocturnal avian & curious hunter: liveliest at dawn, dusk, and twilight
    return {
      speedScale: 0.98 + twilight * 0.22 + night * 0.06,
      stalkSpeedScale: 1,
      detectRadiusScale: 0.96 + twilight * 0.18 + night * 0.08,
      spookRadiusScale: 1.0 + twilight * 0.1,
      windupScale: 1,
      spawnWeightScale: 1.0 + twilight * 0.25 + night * 0.15,
    };
  }

  if (kind === 'mammoth' || kind === 'frost_boar') {
    // Colossal tundra titan & armored tusker: steady by day, more territorial at dusk/night
    return {
      speedScale: THREE.MathUtils.lerp(1.0, 1.12, night),
      stalkSpeedScale: THREE.MathUtils.lerp(1.0, 1.14, night),
      detectRadiusScale: THREE.MathUtils.lerp(1.0, 1.16, night),
      spookRadiusScale: 1.0,
      windupScale: THREE.MathUtils.lerp(1.0, 0.92, night),
      spawnWeightScale: THREE.MathUtils.lerp(0.95, 1.22, night),
    };
  }

  // Nocturnal / crepuscular predators: wolf, lynx, wolverine, polar_bear, sabertooth, aurora_fenrir
  const prowlBoost = Math.max(night, twilight * 0.65);
  return {
    speedScale: 0.92 + prowlBoost * 0.32,
    stalkSpeedScale: 0.95 + prowlBoost * 0.28,
    detectRadiusScale: 0.92 + prowlBoost * 0.34,
    spookRadiusScale: 0.95 + prowlBoost * 0.15,
    windupScale: 1.04 - prowlBoost * 0.16,
    spawnWeightScale: 0.9 + prowlBoost * 0.55,
  };
}

export function buildDayNightState(
  timeOfDay: number,
  dayNumber: number,
): DayNightState {
  const t = normalizeTimeOfDay(timeOfDay);
  const phase = getDayPhase(t);
  const wolfProfile = computeWildlifeTimeProfile(t, 'wolf');
  const stagProfile = computeWildlifeTimeProfile(t, 'stag');

  let wildlifeActivityLabel = 'Diurnal Grazing';
  if (phase === 'night') {
    wildlifeActivityLabel = 'Nocturnal Predators';
  } else if (phase === 'dawn' || phase === 'dusk') {
    wildlifeActivityLabel = 'Twilight Prowl';
  }

  return {
    dayNumber,
    timeOfDay: t,
    phase,
    phaseLabel: getDayPhaseLabel(phase),
    clockLabel: formatClockTime(t),
    tempDecayMult: computeTemperatureDecayMultiplier(t),
    predatorActivityMult: Math.round(wolfProfile.speedScale * 100) / 100,
    preyActivityMult: Math.round(stagProfile.speedScale * 100) / 100,
    wildlifeActivityLabel,
  };
}

const _cA = new THREE.Color();
const _cB = new THREE.Color();
const _cC = new THREE.Color();

function blendColors(hexA: number, hexB: number, t: number): number {
  _cA.setHex(hexA);
  _cB.setHex(hexB);
  _cA.lerp(_cB, THREE.MathUtils.clamp(t, 0, 1));
  return _cA.getHex();
}

export function computeEnvironmentLighting(
  timeOfDay: number,
  weather: WeatherKind,
): EnvironmentLightingSample {
  const t = normalizeTimeOfDay(timeOfDay);
  const hour = t * 24;
  const sunAngle = (t - 0.25) * Math.PI * 2;
  const sunSin = Math.sin(sunAngle);
  const sunCos = Math.cos(sunAngle);
  const night = computeNightFactor(t);
  const twilight = computeTwilightFactor(t);
  const isDawn = hour < 12;

  // Base clear-sky diurnal colors
  let skyHex = 0x7ea6d1;
  let sunColorHex = 0xfff1d6;
  let sunIntensity = 2.45;
  let hemiSkyHex = 0xcbe4ff;
  let hemiGroundHex = 0x3b526e;
  let hemiIntensity = 0.78;
  let rimColorHex = 0x82b6ed;
  let rimIntensity = 0.64;
  let environmentIntensity = 0.88;
  let exposure = 1.08;

  // Blend in golden-hour dawn / sunset warmth near horizon crossings
  if (twilight > 0.01) {
    const horizonSky = isDawn ? 0xb87b78 : 0x915b6d;
    const horizonSun = isDawn ? 0xffaa6b : 0xff7a45;
    const horizonHemiSky = isDawn ? 0xebaa84 : 0xd98468;
    skyHex = blendColors(skyHex, horizonSky, twilight * 0.88);
    sunColorHex = blendColors(sunColorHex, horizonSun, twilight * 0.94);
    hemiSkyHex = blendColors(hemiSkyHex, horizonHemiSky, twilight * 0.78);
    hemiGroundHex = blendColors(hemiGroundHex, 0x2c283d, twilight * 0.74);
    sunIntensity = THREE.MathUtils.lerp(sunIntensity, 1.55, twilight * 0.85);
    hemiIntensity = THREE.MathUtils.lerp(hemiIntensity, 0.5, twilight * 0.75);
    environmentIntensity = THREE.MathUtils.lerp(environmentIntensity, 0.36, twilight * 0.85);
    exposure = THREE.MathUtils.lerp(exposure, 0.98, twilight * 0.75);
  }

  // Blend into deep Arctic night lit by cool silver moonlight
  if (night > 0.01) {
    skyHex = blendColors(skyHex, 0x091326, night);
    sunColorHex = blendColors(sunColorHex, 0x7aa8f0, night);
    hemiSkyHex = blendColors(hemiSkyHex, 0x1c3460, night);
    hemiGroundHex = blendColors(hemiGroundHex, 0x080e19, night);
    rimColorHex = blendColors(rimColorHex, 0x5c96f0, night);
    sunIntensity = THREE.MathUtils.lerp(sunIntensity, 0.58, night);
    hemiIntensity = THREE.MathUtils.lerp(hemiIntensity, 0.28, night);
    rimIntensity = THREE.MathUtils.lerp(rimIntensity, 0.85, night);
    environmentIntensity = THREE.MathUtils.lerp(environmentIntensity, 0.16, night);
    exposure = THREE.MathUtils.lerp(exposure, 0.88, night);
  }

  // Weather atmospheric tinting layered smoothly on top of time-of-day
  let fogDensityMult = 1.0;
  if (weather === 'light_snow') {
    const overcastSky = blendColors(0x6f92b8, 0x101c30, night);
    skyHex = blendColors(skyHex, overcastSky, 0.42);
    sunIntensity *= 0.86;
    fogDensityMult = 1.05;
  } else if (weather === 'blizzard') {
    const stormSky = blendColors(0x93abc2, 0x132238, night);
    skyHex = blendColors(skyHex, stormSky, 0.68);
    sunColorHex = blendColors(sunColorHex, blendColors(0xdce8f5, 0x6587b8, night), 0.55);
    sunIntensity *= 0.64;
    hemiIntensity = Math.max(hemiIntensity, THREE.MathUtils.lerp(0.5, 0.24, night));
    fogDensityMult = 1.15;
  }

  // Smooth sun/moon celestial position so shadows swing naturally across day and hold readable moon angle at night
  const dayPosX = sunCos * 38;
  const dayPosY = Math.max(10, sunSin * 42 + 6);
  const dayPosZ = 18 + Math.abs(sunCos) * 6;

  const moonAngle = (t + 0.25) * Math.PI * 2;
  const moonPosX = Math.cos(moonAngle) * 28;
  const moonPosY = 30;
  const moonPosZ = -18 + Math.sin(moonAngle) * 8;

  const sunPos: [number, number, number] = [
    THREE.MathUtils.lerp(dayPosX, moonPosX, night),
    THREE.MathUtils.lerp(dayPosY, moonPosY, night),
    THREE.MathUtils.lerp(dayPosZ, moonPosZ, night),
  ];

  // Unused helper color reference kept clean; ensure _cC stays available if needed
  _cC.setHex(skyHex);

  return {
    skyColorHex: skyHex,
    fogDensityMult,
    sunColorHex,
    sunIntensity,
    sunPos,
    hemiSkyHex,
    hemiGroundHex,
    hemiIntensity,
    rimColorHex,
    rimIntensity,
    environmentIntensity,
    exposure,
    campfireGlowMult: 1.0 + twilight * 0.55 + night * 1.45,
    nightFactor: night,
    twilightFactor: twilight,
    predatorEyeEmissive: 0.25 + twilight * 0.5 + night * 1.65,
  };
}

export function createInitialDayNightState(
  timeOfDay = INITIAL_TIME_OF_DAY,
  dayNumber = 1,
): DayNightState {
  return buildDayNightState(timeOfDay, dayNumber);
}
