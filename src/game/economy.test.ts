import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AXE_TIERS,
  BOW_TIERS,
  INITIAL_LEVELS,
  INITIAL_RESOURCES,
  WEATHER_PROFILES,
  calculatePassiveRates,
  canAfford,
  computeScreenFrostIntensity,
  getAxeSpec,
  getBowSpec,
  getNextBuildingUpgrade,
  getNextToolUpgrade,
  isEmpireVictory,
  sellTradeBundle,
  spendResources,
  stepWarmthAndHealth,
} from './economy';

test('upgrade availability and affordability checks work accurately', () => {
  const nextAxe = getNextToolUpgrade('axe', INITIAL_LEVELS);
  assert.ok(nextAxe);
  assert.equal(nextAxe.level, 2);
  assert.equal(canAfford(INITIAL_RESOURCES, nextAxe.cost), false);

  const rich = { wood: 50, pelts: 10, gold: 100 };
  assert.equal(canAfford(rich, nextAxe.cost), true);
  const after = spendResources(rich, nextAxe.cost);
  assert.deepEqual(after, {
    wood: 50 - nextAxe.cost.wood,
    pelts: 10 - nextAxe.cost.pelts,
    gold: 100 - nextAxe.cost.gold,
  });

  const maxLevels = { ...INITIAL_LEVELS, axe: AXE_TIERS.length, bow: BOW_TIERS.length };
  assert.equal(getNextToolUpgrade('axe', maxLevels), null);
  assert.equal(getNextToolUpgrade('bow', maxLevels), null);
});

test('axes and bows feature 7 progressive tiers up to Rare, Epic, and Mythic rarities', () => {
  assert.equal(AXE_TIERS.length, 7);
  assert.equal(BOW_TIERS.length, 7);
  assert.equal(getAxeSpec(5).rarity, 'epic');
  assert.equal(getAxeSpec(7).rarity, 'mythic');
  assert.equal(getBowSpec(4).rarity, 'rare');
  assert.equal(getBowSpec(7).rarity, 'mythic');

  for (let i = 1; i < AXE_TIERS.length; i++) {
    assert.ok(AXE_TIERS[i].power > AXE_TIERS[i - 1].power);
    assert.ok(AXE_TIERS[i].cooldown < AXE_TIERS[i - 1].cooldown);
  }
  for (let i = 1; i < BOW_TIERS.length; i++) {
    assert.ok(BOW_TIERS[i].power > BOW_TIERS[i - 1].power);
    assert.ok(BOW_TIERS[i].cooldown < BOW_TIERS[i - 1].cooldown);
  }
});

test('building sawmill and tannery increases passive rates and worker count', () => {
  const baseRates = calculatePassiveRates(INITIAL_LEVELS);
  assert.equal(baseRates.woodPerSec, 0);
  assert.equal(baseRates.goldPerSec, 0);
  assert.equal(baseRates.workerCount, 0);

  const upgraded = {
    ...INITIAL_LEVELS,
    cabin: 2,
    sawmill: 2,
    tannery: 1,
    forge: 1,
  };
  const nextRates = calculatePassiveRates(upgraded);
  assert.ok(nextRates.woodPerSec > 1.5);
  assert.ok(nextRates.goldPerSec > 2.5);
  assert.equal(nextRates.workerCount, 3);
  assert.ok(nextRates.harvestMultiplier > 1);
});

test('selling wood and pelts yields gold scaled by tannery & forge', () => {
  const start = { wood: 10, pelts: 4, gold: 0 };
  const baseTrade = sellTradeBundle(start, INITIAL_LEVELS, 5, 2);
  assert.equal(baseTrade.goldGained, 5 * 2 + 2 * 8);
  assert.deepEqual(baseTrade.resources, { wood: 5, pelts: 2, gold: 26 });

  const upgradedTrade = sellTradeBundle(
    start,
    { ...INITIAL_LEVELS, tannery: 3, forge: 2 },
    5,
    2,
  );
  assert.ok(upgradedTrade.goldGained > baseTrade.goldGained);

  const skinnerTrade = sellTradeBundle(start, INITIAL_LEVELS, 5, 2, 1.35);
  assert.ok(skinnerTrade.goldGained > baseTrade.goldGained);
});

test('warmth drains in snow, freezes HP at zero warmth, and recovers near campfire', () => {
  const chilled = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 1,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    dt: 1,
  });
  assert.equal(chilled.warmth, 0);
  assert.ok(chilled.hp < 100);
  assert.equal(chilled.defeated, false);

  const frozen = stepWarmthAndHealth({
    hp: 2,
    maxHp: 100,
    warmth: 0,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    dt: 1,
  });
  assert.equal(frozen.hp, 0);
  assert.equal(frozen.defeated, true);

  const warmed = stepWarmthAndHealth({
    hp: 60,
    maxHp: 100,
    warmth: 50,
    maxWarmth: 100,
    nearCampfire: true,
    coatLevel: 1,
    dt: 1,
  });
  assert.ok(warmed.warmth > 50);
  assert.ok(warmed.hp > 60);
});

test('cabin tier 5 triggers victory unless in endless mode', () => {
  assert.equal(isEmpireVictory(INITIAL_LEVELS, false), false);
  assert.equal(isEmpireVictory({ ...INITIAL_LEVELS, cabin: 5 }, false), true);
  assert.equal(isEmpireVictory({ ...INITIAL_LEVELS, cabin: 5 }, true), false);

  const nextCabin = getNextBuildingUpgrade('cabin', { ...INITIAL_LEVELS, cabin: 4 });
  assert.ok(nextCabin);
  assert.equal(nextCabin.level, 5);
  assert.equal(getNextBuildingUpgrade('cabin', { ...INITIAL_LEVELS, cabin: 5 }), null);
});

import { advanceWeatherState, getWeatherProfile } from './economy';

test('weather cycles deterministically clear -> light_snow -> blizzard -> clear', () => {
  const s1 = advanceWeatherState('clear', 1, 0.5);
  assert.equal(s1.changed, false);
  assert.equal(s1.weather, 'clear');
  assert.equal(s1.timeLeft, 0.5);

  const s2 = advanceWeatherState('clear', 0.5, 1.0);
  assert.equal(s2.changed, true);
  assert.equal(s2.weather, 'light_snow');

  const s3 = advanceWeatherState('light_snow', 0.1, 0.2);
  assert.equal(s3.changed, true);
  assert.equal(s3.weather, 'blizzard');

  const s4 = advanceWeatherState('blizzard', 0.1, 0.2);
  assert.equal(s4.changed, true);
  assert.equal(s4.weather, 'clear');
});

test('blizzard decreases visibility and accelerates warmth drain vs clear weather', () => {
  const clearProf = getWeatherProfile('clear');
  const snowProf = getWeatherProfile('light_snow');
  const blizProf = getWeatherProfile('blizzard');

  assert.ok(clearProf.fogDensity < snowProf.fogDensity);
  assert.ok(snowProf.fogDensity < blizProf.fogDensity);

  const clearStep = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 80,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    weather: 'clear',
    dt: 2,
  });

  const blizzardStep = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 80,
    maxWarmth: 100,
    nearCampfire: false,
    coatLevel: 1,
    weather: 'blizzard',
    dt: 2,
  });

  assert.ok(blizzardStep.warmth < clearStep.warmth);
});

import {
  applyObjectiveReward,
  createDailyObjective,
  recordObjectiveProgress,
  tickDailyObjective,
} from './economy';

test('daily objectives track matching progress, award bonus resources, and advance days', () => {
  const day1 = createDailyObjective(1);
  assert.equal(day1.dayNumber, 1);
  assert.equal(day1.metric, 'treesFelled');
  assert.equal(day1.target, 10);

  // Unrelated metric does not advance progress
  const ignored = recordObjectiveProgress(day1, 'animalsHunted', 2);
  assert.equal(ignored.objective.progress, 0);
  assert.equal(ignored.justCompleted, false);

  // Completing target marks completed and unlocks reward
  const partial = recordObjectiveProgress(day1, 'treesFelled', 6);
  assert.equal(partial.objective.progress, 6);
  assert.equal(partial.justCompleted, false);

  const done = recordObjectiveProgress(partial.objective, 'treesFelled', 5);
  assert.equal(done.objective.progress, 10);
  assert.equal(done.objective.completed, true);
  assert.equal(done.justCompleted, true);

  const paid = applyObjectiveReward({ wood: 0, pelts: 0, gold: 20 }, done.objective.reward);
  assert.equal(paid.goldGained, 55);
  assert.equal(paid.resources.gold, 75);
  assert.equal(paid.resources.wood, 12);

  // Cooldown finishes -> ready for Day 2 objective ('Hunt 3 Animals')
  const afterCooldown = tickDailyObjective(done.objective, 3.1);
  assert.equal(afterCooldown.nextDayReady, true);

  const day2 = createDailyObjective(2);
  assert.equal(day2.metric, 'animalsHunted');
  assert.equal(day2.target, 3);
});

test('daily objective expires cleanly when timer hits zero and rolls over', () => {
  const obj = createDailyObjective(2);
  const expiredTick = tickDailyObjective(obj, obj.duration + 0.5);
  assert.equal(expiredTick.expired, true);
  assert.equal(expiredTick.objective.failed, true);
  assert.equal(expiredTick.nextDayReady, false);

  const rollover = tickDailyObjective(expiredTick.objective, 3.0);
  assert.equal(rollover.nextDayReady, true);
});

test('lumberjack camp passively generates wood over time and upgrades cleanly', () => {
  const nextLv1 = getNextBuildingUpgrade('lumberCamp', INITIAL_LEVELS);
  assert.ok(nextLv1);
  assert.equal(nextLv1.name, 'Lumberjack Camp');
  assert.equal(nextLv1.level, 1);
  assert.ok(nextLv1.woodPerSec > 0 && nextLv1.woodPerSec <= 0.5);

  const ratesLv1 = calculatePassiveRates({ ...INITIAL_LEVELS, lumberCamp: 1 });
  assert.equal(ratesLv1.woodPerSec, nextLv1.woodPerSec);
  assert.equal(ratesLv1.workerCount, 0);

  const ratesLv2 = calculatePassiveRates({ ...INITIAL_LEVELS, lumberCamp: 2 });
  assert.ok(ratesLv2.woodPerSec > ratesLv1.woodPerSec);
  assert.equal(ratesLv2.workerCount, 1);

  const maxCamp = getNextBuildingUpgrade('lumberCamp', { ...INITIAL_LEVELS, lumberCamp: 3 });
  assert.equal(maxCamp, null);
});

test('weather particle gusts and screen frost intensity escalate from clear to light snow to blizzard', () => {
  assert.ok(WEATHER_PROFILES.clear.gustIntensity < WEATHER_PROFILES.light_snow.gustIntensity);
  assert.ok(WEATHER_PROFILES.light_snow.gustIntensity < WEATHER_PROFILES.blizzard.gustIntensity);

  const clearWarm = computeScreenFrostIntensity({
    weather: 'clear',
    warmth: 100,
    maxWarmth: 100,
    nearCampfire: false,
  });
  const lightSnow = computeScreenFrostIntensity({
    weather: 'light_snow',
    warmth: 90,
    maxWarmth: 100,
    nearCampfire: false,
  });
  const blizzardAway = computeScreenFrostIntensity({
    weather: 'blizzard',
    warmth: 75,
    maxWarmth: 100,
    nearCampfire: false,
  });
  const blizzardNearFire = computeScreenFrostIntensity({
    weather: 'blizzard',
    warmth: 75,
    maxWarmth: 100,
    nearCampfire: true,
  });
  const blizzardFreezing = computeScreenFrostIntensity({
    weather: 'blizzard',
    warmth: 10,
    maxWarmth: 100,
    nearCampfire: false,
  });

  assert.equal(clearWarm, 0);
  assert.ok(lightSnow > clearWarm);
  assert.ok(blizzardAway > lightSnow);
  assert.ok(blizzardNearFire < blizzardAway);
  assert.ok(blizzardFreezing > blizzardAway);
});

import {
  THERMAL_CONDUIT_TIERS,
  WEATHER_PHASE_DURATION_SECONDS,
  WINDBREAK_TIERS,
  computeZoneWeatherStatusEffect,
  formatWeatherCountdown,
} from './economy';

test('weather phases last 9 minutes (540s) and countdown formats cleanly as Xm YYs', () => {
  assert.equal(WEATHER_PHASE_DURATION_SECONDS, 540);
  assert.equal(WEATHER_PROFILES.clear.duration, 540);
  assert.equal(WEATHER_PROFILES.light_snow.duration, 540);
  assert.equal(WEATHER_PROFILES.blizzard.duration, 540);
  assert.equal(formatWeatherCountdown(540), '9m 00s');
  assert.equal(formatWeatherCountdown(534), '8m 54s');
  assert.equal(formatWeatherCountdown(45), '45s');

  const penUpgrade = getNextBuildingUpgrade('tamingPen', INITIAL_LEVELS);
  assert.ok(penUpgrade);
  assert.equal(penUpgrade.level, 1);
});

test('zone-specific weather status effects scale penalties across L1-L5 and are mitigated by Windbreak & Thermal Conduit infrastructure', () => {
  assert.equal(WINDBREAK_TIERS.length, 4);
  assert.equal(THERMAL_CONDUIT_TIERS.length, 4);

  const l1BlizzardUnbuilt = computeZoneWeatherStatusEffect({
    zone: 'level1',
    weather: 'blizzard',
    levels: INITIAL_LEVELS,
    nearCampfire: false,
  });
  assert.equal(l1BlizzardUnbuilt.name, 'Frostwood Whiteout Gale');
  assert.equal(l1BlizzardUnbuilt.mitigated, false);
  assert.ok(l1BlizzardUnbuilt.effectiveMoveSpeedMult < 1.0);
  assert.ok(l1BlizzardUnbuilt.effectiveGatherEfficiencyMult < 1.0);

  const l3BlizzardUnbuilt = computeZoneWeatherStatusEffect({
    zone: 'level3',
    weather: 'blizzard',
    levels: INITIAL_LEVELS,
    nearCampfire: false,
  });
  assert.equal(l3BlizzardUnbuilt.name, 'Rimefang Vortex Howl');
  assert.ok(l3BlizzardUnbuilt.effectiveMoveSpeedMult < l1BlizzardUnbuilt.effectiveMoveSpeedMult);
  assert.ok(
    l3BlizzardUnbuilt.effectiveGatherEfficiencyMult <
      l1BlizzardUnbuilt.effectiveGatherEfficiencyMult,
  );

  const l5BlizzardUnbuilt = computeZoneWeatherStatusEffect({
    zone: 'level5',
    weather: 'blizzard',
    levels: INITIAL_LEVELS,
    nearCampfire: false,
  });
  assert.equal(l5BlizzardUnbuilt.name, 'Absolute Zero Cryo-Vortex');
  assert.equal(l5BlizzardUnbuilt.severity, 'extreme');
  assert.ok(l5BlizzardUnbuilt.effectiveMoveSpeedMult < l3BlizzardUnbuilt.effectiveMoveSpeedMult);
  assert.ok(
    l5BlizzardUnbuilt.effectiveGatherEfficiencyMult <
      l3BlizzardUnbuilt.effectiveGatherEfficiencyMult,
  );

  // Building Windbreak Palisade & Thermal Conduit + Forge/Cabin mitigates penalties and grants bonus
  const fortifiedLevels = {
    ...INITIAL_LEVELS,
    cabin: 5,
    forge: 3,
    stormShelter: 2,
    windbreak: 3,
    thermalConduit: 3,
  };
  const l5BlizzardFortified = computeZoneWeatherStatusEffect({
    zone: 'level5',
    weather: 'blizzard',
    levels: fortifiedLevels,
    nearCampfire: false,
  });
  assert.equal(l5BlizzardFortified.mitigated, true);
  assert.equal(l5BlizzardFortified.windResistancePct, 100);
  assert.equal(l5BlizzardFortified.heatRetentionPct, 100);
  assert.ok(l5BlizzardFortified.effectiveMoveSpeedMult >= 1.0);
  assert.ok(l5BlizzardFortified.effectiveGatherEfficiencyMult >= 1.0);

  // Passive rates reflect Thermal Conduit warmth & harvest bonuses
  const baseRates = calculatePassiveRates(INITIAL_LEVELS);
  const fortifiedRates = calculatePassiveRates(fortifiedLevels);
  assert.ok(fortifiedRates.harvestMultiplier > baseRates.harvestMultiplier);
  assert.ok(fortifiedRates.warmthRadius > baseRates.warmthRadius);

  // Frostcave City is always a sheltered geothermal sanctuary
  const cityEffect = computeZoneWeatherStatusEffect({
    zone: 'city',
    weather: 'blizzard',
    levels: INITIAL_LEVELS,
  });
  assert.equal(cityEffect.mitigated, true);
  assert.equal(cityEffect.severity, 'sheltered');
  assert.ok(cityEffect.effectiveMoveSpeedMult > 1.0);
});



