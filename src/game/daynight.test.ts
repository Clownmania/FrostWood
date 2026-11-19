import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_CYCLE_DURATION,
  advanceTimeOfDay,
  buildDayNightState,
  computeEnvironmentLighting,
  computeTemperatureDecayMultiplier,
  computeWildlifeTimeProfile,
  formatClockTime,
  getDayPhase,
  parseTimeOfDayParam,
} from './daynight';
import { stepWarmthAndHealth } from './economy';
import {
  SPECIES_SPECS,
  computeEffectiveRadii,
  evaluatePreyReaction,
  pickDynamicWildlifeSpawn,
} from './wildlife';

test('day-night cycle advances phases continuously and increments day counter on wrap', () => {
  assert.equal(getDayPhase(0.26), 'dawn');
  assert.equal(getDayPhase(0.5), 'day');
  assert.equal(getDayPhase(0.76), 'dusk');
  assert.equal(getDayPhase(0.0), 'night');

  assert.equal(formatClockTime(0.0), '00:00');
  assert.equal(formatClockTime(0.5), '12:00');
  assert.equal(parseTimeOfDayParam('dusk'), 0.76);
  assert.equal(parseTimeOfDayParam('night'), 0.0);

  // Advance from late night (0.95) across midnight into day 2
  const wrap = advanceTimeOfDay(0.95, 1, DAY_CYCLE_DURATION * 0.1, DAY_CYCLE_DURATION);
  assert.equal(wrap.dayWrapped, true);
  assert.equal(wrap.dayNumber, 2);
  assert.ok(Math.abs(wrap.timeOfDay - 0.05) < 1e-6);

  // Advance from day (0.65) into dusk (0.75)
  const intoDusk = advanceTimeOfDay(0.65, 1, DAY_CYCLE_DURATION * 0.1, DAY_CYCLE_DURATION);
  assert.equal(intoDusk.prevPhase, 'day');
  assert.equal(intoDusk.nextPhase, 'dusk');
  assert.equal(intoDusk.phaseChanged, true);
});

test('environmental lighting transitions from bright noon to warm dusk to moonlit night', () => {
  const noon = computeEnvironmentLighting(0.5, 'clear');
  const dusk = computeEnvironmentLighting(0.76, 'clear');
  const night = computeEnvironmentLighting(0.0, 'clear');

  assert.ok(noon.sunIntensity > dusk.sunIntensity);
  assert.ok(dusk.sunIntensity > night.sunIntensity);
  assert.ok(night.sunIntensity >= 0.45, 'moonlight keeps terrain readable');
  assert.ok(noon.environmentIntensity > dusk.environmentIntensity);
  assert.ok(dusk.environmentIntensity > night.environmentIntensity);
  assert.ok(night.campfireGlowMult > dusk.campfireGlowMult);
  assert.ok(dusk.campfireGlowMult > noon.campfireGlowMult);
  assert.ok(night.predatorEyeEmissive > noon.predatorEyeEmissive);
  assert.ok(night.exposure < noon.exposure);
});

test('nighttime accelerates temperature decay rate outside shelter while hearth & shelter still protect', () => {
  const noonChill = computeTemperatureDecayMultiplier(0.5);
  const duskChill = computeTemperatureDecayMultiplier(0.76);
  const nightChill = computeTemperatureDecayMultiplier(0.0);

  assert.equal(noonChill, 1);
  assert.ok(duskChill > noonChill);
  assert.ok(nightChill > duskChill);
  assert.ok(nightChill >= 1.6);

  const dayStep = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 80,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    weather: 'clear',
    timeOfDay: 0.5,
    dt: 4,
  });
  const nightStep = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 80,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    weather: 'clear',
    timeOfDay: 0.0,
    dt: 4,
  });

  assert.ok(
    nightStep.warmth < dayStep.warmth,
    `night warmth (${nightStep.warmth}) should drop faster than noon warmth (${dayStep.warmth})`,
  );

  const shelteredNight = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 80,
    maxWarmth: 100,
    nearCampfire: false,
    inStormShelter: true,
    coatLevel: 1,
    weather: 'blizzard',
    timeOfDay: 0.0,
    dt: 4,
  });
  assert.equal(shelteredNight.warmth, 80);
});

test('wildlife activity increases nocturnal predator speed & perception while slowing diurnal prey', () => {
  const wolfDay = computeWildlifeTimeProfile(0.5, 'wolf');
  const wolfNight = computeWildlifeTimeProfile(0.0, 'wolf');
  const hareDay = computeWildlifeTimeProfile(0.5, 'hare');
  const hareNight = computeWildlifeTimeProfile(0.0, 'hare');

  assert.ok(wolfNight.speedScale > wolfDay.speedScale);
  assert.ok(wolfNight.detectRadiusScale > wolfDay.detectRadiusScale);
  assert.ok(wolfNight.windupScale < wolfDay.windupScale);
  assert.ok(hareNight.speedScale < hareDay.speedScale);

  const wolfRadiiDay = computeEffectiveRadii(SPECIES_SPECS.wolf, 4.0, 'clear', 0.5);
  const wolfRadiiNight = computeEffectiveRadii(SPECIES_SPECS.wolf, 4.0, 'clear', 0.0);
  assert.ok(wolfRadiiNight.detectRadius > wolfRadiiDay.detectRadius);

  const hareDayMove = evaluatePreyReaction({
    kind: 'hare',
    state: 'wander',
    stateTimer: 1.5,
    distPlayer: 20,
    playerSpeed: 0,
    weather: 'clear',
    timeOfDay: 0.5,
    dxToPlayer: 20,
    dzToPlayer: 0,
    wanderAngle: 0,
    dt: 0.05,
    rng: () => 0.5,
  });
  const hareNightMove = evaluatePreyReaction({
    kind: 'hare',
    state: 'wander',
    stateTimer: 1.5,
    distPlayer: 20,
    playerSpeed: 0,
    weather: 'clear',
    timeOfDay: 0.0,
    dxToPlayer: 20,
    dzToPlayer: 0,
    wanderAngle: 0,
    dt: 0.05,
    rng: () => 0.5,
  });
  assert.ok(
    Math.hypot(hareNightMove.vx, hareNightMove.vz) <
      Math.hypot(hareDayMove.vx, hareDayMove.vz),
  );

  // At night, nocturnal species (wolf/lynx/snow_owl/wolverine) can spawn above baseline daytime pack size
  const baseCounts = { hare: 6, fox: 5, stag: 5, wolf: 4, lynx: 2, snow_owl: 2, wolverine: 1 };
  const nightSpawn = pickDynamicWildlifeSpawn(baseCounts, () => 0.99, 0.0);
  assert.ok(
    nightSpawn === 'wolf' ||
      nightSpawn === 'lynx' ||
      nightSpawn === 'snow_owl' ||
      nightSpawn === 'wolverine',
  );

  const nightHud = buildDayNightState(0.0, 2);
  assert.equal(nightHud.phase, 'night');
  assert.equal(nightHud.wildlifeActivityLabel, 'Nocturnal Predators');
  assert.ok(nightHud.predatorActivityMult > nightHud.preyActivityMult);
});
