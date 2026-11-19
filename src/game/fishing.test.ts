import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FISHING_LAKE_CENTER,
  FISHING_PIER_ANCHOR,
  FISH_SPECS,
  buildFishingHudState,
  classifyIceThickness,
  computeTargetIceThickness,
  createInitialFishingState,
  getDistanceToFishingLake,
  getIceSurfaceSpeedMultiplier,
  isInsideFishingSanctuary,
  isNearFishingLake,
  isPlayerOnFishingPier,
  isPositionInLakeWater,
  rollRandomFishRarity,
  rollRandomFishSpecies,
  startFishingCast,
  stepFishingState,
  stepIceThickness,
  triggerFishingHook,
} from './fishing';
import { computeBipedGait } from './kinematics';

describe('Fishing & Hooking System', () => {
  it('accurately detects proximity and distance to Crystal Lagoon', () => {
    assert.equal(
      isNearFishingLake(FISHING_PIER_ANCHOR.x, FISHING_PIER_ANCHOR.z, 'level1'),
      true,
    );
    assert.equal(isNearFishingLake(0, 0, 'level1'), false);
    assert.equal(
      isNearFishingLake(FISHING_PIER_ANCHOR.x, FISHING_PIER_ANCHOR.z, 'level2'),
      false,
    );
    assert.equal(
      getDistanceToFishingLake(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1'),
      0,
    );
  });

  it('protects the Crystal Lagoon safe sanctuary and distinguishes the wooden pier from lake water', () => {
    // Pier anchor is inside the safe sanctuary and on the wooden pier (dry, not swimming)
    assert.equal(
      isInsideFishingSanctuary(FISHING_PIER_ANCHOR.x, FISHING_PIER_ANCHOR.z, 'level1'),
      true,
    );
    assert.equal(
      isPlayerOnFishingPier(FISHING_PIER_ANCHOR.x, FISHING_PIER_ANCHOR.z, 'level1'),
      true,
    );
    assert.equal(
      isPositionInLakeWater(FISHING_PIER_ANCHOR.x, FISHING_PIER_ANCHOR.z, 'level1', 0),
      false,
    );

    // Falling off the end or side of the pier into Crystal Lagoon triggers water immersion
    assert.equal(
      isPlayerOnFishingPier(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1'),
      false,
    );
    assert.equal(
      isPositionInLakeWater(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1', 0),
      true,
    );
    // Jumping high above the water is not immersed until landing
    assert.equal(
      isPositionInLakeWater(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1', 0.8),
      false,
    );

    // Far away camp center is outside the fishing sanctuary and not in water
    assert.equal(isInsideFishingSanctuary(0, 0, 'level1'), false);
    assert.equal(isPositionInLakeWater(0, 0, 'level1', 0), false);
  });

  it('computes buoyant treading and prone freestyle swimming kinematics when player is in water', () => {
    const treadPose = computeBipedGait({
      walkPhase: 0,
      speed: 0,
      maxSpeed: 6.5,
      isCreeping: false,
      idleTime: 1.2,
      swingProgress: 0,
      activeTool: 'rod',
      turnBank: 0,
      isSwimming: true,
      swimTime: 1.2,
    });
    assert.ok(treadPose.pelvisY < -0.35, 'treading water lowers pelvis into water');
    assert.ok((treadPose.bodyPitchX ?? 0) > 0.15, 'treading water has slight forward buoyancy tilt');

    const swimPose = computeBipedGait({
      walkPhase: 2.4,
      speed: 6.0,
      maxSpeed: 6.5,
      isCreeping: false,
      idleTime: 0,
      swingProgress: 0,
      activeTool: 'rod',
      turnBank: 0.05,
      isSwimming: true,
      swimTime: 1.8,
    });
    assert.ok(
      (swimPose.bodyPitchX ?? 0) > (treadPose.bodyPitchX ?? 0) + 0.45,
      'active forward swimming tilts body into prone freestyle stroke posture',
    );
    assert.ok(swimPose.headPitchX < -0.4, 'head counter-pitches up to stay above water surface');
  });

  it('rolls all 5 fish rarities deterministically across RNG values', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const val = i / 100;
      const r = rollRandomFishRarity(() => val);
      seen.add(r);
    }
    assert.equal(seen.has('common'), true);
    assert.equal(seen.has('uncommon'), true);
    assert.equal(seen.has('rare'), true);
    assert.equal(seen.has('epic'), true);
    assert.equal(seen.has('mythic'), true);
  });

  it('rolls valid fish species with bounded weight', () => {
    const rolled = rollRandomFishSpecies(() => 0.98);
    assert.equal(rolled.spec.rarity, 'mythic');
    assert.equal(rolled.spec.id, 'celestial_koi');
    assert.ok(rolled.weightKg >= FISH_SPECS.celestial_koi.minWeightKg);
    assert.ok(rolled.weightKg <= FISH_SPECS.celestial_koi.maxWeightKg);
  });

  it('progresses from casting -> waiting -> bite -> hooking -> caught when reeled inside sweet spot', () => {
    let state = createInitialFishingState();
    state = startFishingCast(
      state,
      FISHING_PIER_ANCHOR.x,
      FISHING_PIER_ANCHOR.z,
      FISHING_PIER_ANCHOR.yaw,
      () => 0.2,
      'glacial_perch',
    );
    assert.equal(state.phase, 'casting');
    assert.equal(state.targetFishId, 'glacial_perch');

    // Step through casting until bobber lands
    const castStep1 = stepFishingState(state, 0.25, false, () => 0.2);
    const castStep2 = stepFishingState(castStep1.state, 0.25, false, () => 0.2);
    assert.equal(castStep2.event, 'bobber_landed');
    assert.equal(castStep2.state.phase, 'waiting');

    // Step through waiting until bite starts
    let cur = castStep2.state;
    let lastEvent = 'none';
    for (let i = 0; i < 20 && cur.phase === 'waiting'; i++) {
      const res = stepFishingState(cur, 0.2, false, () => 0.3);
      cur = res.state;
      lastEvent = res.event;
    }
    assert.equal(lastEvent, 'bite_started');
    assert.equal(cur.phase, 'bite');

    // Trigger hook during bite window
    const hooked = triggerFishingHook(cur, () => 0.5);
    assert.equal(hooked.hooked, true);
    assert.equal(hooked.state.phase, 'hooking');

    // Simulate player reeling to keep hook bar aligned with fish bar until catchProgress reaches 100
    cur = hooked.state;
    let caughtEvent = 'none';
    for (let i = 0; i < 120 && cur.phase === 'hooking'; i++) {
      const shouldReel = cur.hookBarPos < cur.fishBarPos;
      const res = stepFishingState(cur, 0.1, shouldReel, () => 0.5);
      cur = res.state;
      caughtEvent = res.event;
    }
    assert.equal(caughtEvent, 'fish_caught');
    assert.equal(cur.phase, 'caught');
    assert.equal(cur.totalCaught, 1);
    assert.ok(cur.lastCatch);
    assert.equal(cur.lastCatch.speciesId, 'glacial_perch');
  });

  it('escapes if the player misses the bite window or pulls too early', () => {
    let state = createInitialFishingState();
    state = startFishingCast(
      state,
      FISHING_PIER_ANCHOR.x,
      FISHING_PIER_ANCHOR.z,
      FISHING_PIER_ANCHOR.yaw,
      () => 0.1,
    );
    // Pulling while casting/waiting cancels to idle
    const earlyPull = triggerFishingHook(state);
    assert.equal(earlyPull.hooked, false);
    assert.equal(earlyPull.state.phase, 'idle');

    // Missing the bite window transitions to escaped
    const biteState = {
      ...state,
      phase: 'bite' as const,
      timer: 0.1,
      biteWindow: 2.0,
    };
    const missed = stepFishingState(biteState, 0.2, false);
    assert.equal(missed.event, 'fish_escaped');
    assert.equal(missed.state.phase, 'escaped');

    const hud = buildFishingHudState(
      missed.state,
      FISHING_PIER_ANCHOR.x,
      FISHING_PIER_ANCHOR.z,
      'level1',
      ['common', 'rare'],
    );
    assert.equal(hud.nearLake, true);
    assert.equal(hud.inSafeZone, true);
    assert.equal(hud.isSwimming, false);
    assert.deepEqual(hud.nearbyFishRarities, ['common', 'rare']);

    const swimHud = buildFishingHudState(
      missed.state,
      FISHING_LAKE_CENTER.x,
      FISHING_LAKE_CENTER.z,
      'level1',
      ['common', 'rare'],
      0,
    );
    assert.equal(swimHud.inSafeZone, true);
    assert.equal(swimHud.isSwimming, true);
  });

  it('computes dynamic ice thickness targets from weather, time of day, and zone chill', () => {
    const clearDay = computeTargetIceThickness({
      weather: 'clear',
      timeOfDay: 0.5,
      zone: 'level1',
    });
    const snowDay = computeTargetIceThickness({
      weather: 'light_snow',
      timeOfDay: 0.5,
      zone: 'level1',
    });
    const blizzardDay = computeTargetIceThickness({
      weather: 'blizzard',
      timeOfDay: 0.5,
      zone: 'level1',
    });
    const blizzardNightHigh = computeTargetIceThickness({
      weather: 'blizzard',
      timeOfDay: 0.0,
      zone: 'level5',
    });

    assert.ok(clearDay < 0.25, 'clear daytime keeps lake open/thin rim ice');
    assert.ok(snowDay > 0.45 && snowDay < 0.65, 'light snow produces fractured thin ice');
    assert.ok(blizzardDay >= 0.85, 'blizzard freezes thick glacial pack ice');
    assert.ok(blizzardNightHigh >= blizzardDay, 'night and arctic zones thicken ice further');

    // Smooth stepping moves monotonically toward target
    let cur = clearDay;
    for (let i = 0; i < 40; i++) {
      cur = stepIceThickness(cur, blizzardDay, 0.25);
    }
    assert.ok(cur > 0.78, 'stepping toward blizzard target thickens ice cleanly');
  });

  it('classifies ice stages and toggles walkable frozen lake traversal cleanly', () => {
    const thin = classifyIceThickness(0.18);
    assert.equal(thin.stage, 'thin_water');
    assert.equal(thin.walkable, false);
    assert.ok(thin.waveDamping < 0.1);
    assert.ok(thin.frostCoverage === 0);

    const cracked = classifyIceThickness(0.54);
    assert.equal(cracked.stage, 'cracked_thin');
    assert.equal(cracked.walkable, false);
    assert.ok(cracked.crackRisk > 0.85);
    assert.ok(cracked.frostCoverage > 0.3 && cracked.frostCoverage < 0.7);
    assert.equal(
      isPositionInLakeWater(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1', 0, 0.54),
      true,
    );

    const firm = classifyIceThickness(0.7);
    assert.equal(firm.stage, 'frosted_firm');
    assert.equal(firm.walkable, true);
    assert.equal(
      isPositionInLakeWater(FISHING_LAKE_CENTER.x, FISHING_LAKE_CENTER.z, 'level1', 0, 0.7),
      false,
    );
    assert.ok(
      getIceSurfaceSpeedMultiplier(
        FISHING_LAKE_CENTER.x,
        FISHING_LAKE_CENTER.z,
        'level1',
        0,
        0.7,
      ) < 1,
    );

    const glacial = classifyIceThickness(0.92);
    assert.equal(glacial.stage, 'thick_glacial');
    assert.equal(glacial.walkable, true);
    assert.equal(glacial.waveDamping, 1);
    assert.ok(glacial.frostCoverage >= 0.95);
    assert.ok(
      getIceSurfaceSpeedMultiplier(
        FISHING_LAKE_CENTER.x,
        FISHING_LAKE_CENTER.z,
        'level1',
        0,
        0.92,
      ) > 1,
    );

    const frozenHud = buildFishingHudState(
      createInitialFishingState(),
      FISHING_LAKE_CENTER.x,
      FISHING_LAKE_CENTER.z,
      'level1',
      ['common'],
      0,
      0.92,
    );
    assert.equal(frozenHud.iceWalkable, true);
    assert.equal(frozenHud.iceThicknessStage, 'thick_glacial');
    assert.equal(frozenHud.isSwimming, false);
  });
});
