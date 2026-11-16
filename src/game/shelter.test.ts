import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_LEVELS,
  computeScreenFrostIntensity,
  getNextBuildingUpgrade,
  stepWarmthAndHealth,
} from './economy';
import {
  createInitialStormShelterState,
  getStormShelterSpec,
  isPlayerInsideStormShelter,
  tickStormShelter,
  upgradeStormShelterState,
} from './shelter';

test('storm shelter progression specs and upgrade state transitions', () => {
  const unbuilt = createInitialStormShelterState(0);
  assert.equal(unbuilt.phase, 'unbuilt');
  assert.equal(unbuilt.shielded, false);

  const nextLv1 = getNextBuildingUpgrade('stormShelter', INITIAL_LEVELS);
  assert.ok(nextLv1);
  assert.equal(nextLv1.name, 'Storm Shelter');
  assert.equal(nextLv1.level, 1);

  const built = upgradeStormShelterState(unbuilt, 1);
  assert.equal(built.level, 1);
  assert.equal(built.phase, 'ready');
  assert.equal(built.radius, getStormShelterSpec(1).radius);

  const maxTier = getNextBuildingUpgrade('stormShelter', {
    ...INITIAL_LEVELS,
    stormShelter: 3,
  });
  assert.equal(maxTier, null);
});

test('storm shelter triggers temporary immunity on entry, tracks inside/outside, and cycles cooldown', () => {
  const spec = getStormShelterSpec(1);
  let state = createInitialStormShelterState(1);

  // Outside shelter -> stays ready, unshielded
  const outsideTick = tickStormShelter(state, false, 1);
  state = outsideTick.state;
  assert.equal(state.phase, 'ready');
  assert.equal(state.shielded, false);
  assert.equal(outsideTick.justActivated, false);

  // Step inside -> activates temporary immunity dome
  const enterTick = tickStormShelter(state, true, 0.1);
  state = enterTick.state;
  assert.equal(enterTick.justActivated, true);
  assert.equal(state.phase, 'active');
  assert.equal(state.shielded, true);
  assert.equal(state.timeLeft, spec.duration);

  // Stepping out mid-duration keeps dome active until timer runs out, without shielding outside
  const stepOut = tickStormShelter(state, false, 4.0);
  state = stepOut.state;
  assert.equal(state.phase, 'active');
  assert.equal(state.shielded, false);

  // Stepping back inside regains shield for remaining time
  const stepBackIn = tickStormShelter(state, true, 2.0);
  state = stepBackIn.state;
  assert.equal(state.phase, 'active');
  assert.equal(state.shielded, true);

  // Expiring duration enters cooldown
  const expire = tickStormShelter(state, true, spec.duration);
  state = expire.state;
  assert.equal(expire.justExpired, true);
  assert.equal(state.phase, 'cooldown');
  assert.equal(state.shielded, false);

  // Finishing cooldown while outside returns to ready
  const recharged = tickStormShelter(state, false, spec.cooldown + 0.1);
  assert.equal(recharged.justRecharged, true);
  assert.equal(recharged.state.phase, 'ready');
  assert.equal(recharged.state.shielded, false);
});

test('storm shelter grants complete immunity to blizzard damage, warmth loss, and screen frost', () => {
  // Outside shelter in blizzard with 0 warmth -> loses HP and warmth drains
  const exposed = stepWarmthAndHealth({
    hp: 80,
    maxHp: 100,
    warmth: 0,
    maxWarmth: 100,
    nearCampfire: false,
    inStormShelter: false,
    coatLevel: 1,
    weather: 'blizzard',
    dt: 2,
  });
  assert.ok(exposed.hp < 80);

  // Inside active shelter in blizzard with 0 warmth -> zero blizzard HP damage
  const zeroWarmthShielded = stepWarmthAndHealth({
    hp: 80,
    maxHp: 100,
    warmth: 0,
    maxWarmth: 100,
    nearCampfire: false,
    inStormShelter: true,
    coatLevel: 1,
    weather: 'blizzard',
    dt: 2,
  });
  assert.equal(zeroWarmthShielded.hp, 80);
  assert.equal(zeroWarmthShielded.warmth, 0);

  // Inside active shelter in blizzard with partial warmth -> zero warmth loss
  const warmShielded = stepWarmthAndHealth({
    hp: 100,
    maxHp: 100,
    warmth: 64,
    maxWarmth: 100,
    nearCampfire: false,
    inStormShelter: true,
    coatLevel: 1,
    weather: 'blizzard',
    dt: 5,
  });
  assert.equal(warmShielded.warmth, 64);
  assert.equal(warmShielded.hp, 100);

  // Screen frost overlay is completely cleared inside shelter
  assert.equal(
    computeScreenFrostIntensity({
      weather: 'blizzard',
      warmth: 10,
      maxWarmth: 100,
      nearCampfire: false,
      inStormShelter: true,
    }),
    0,
  );

  // Containment geometry check
  assert.equal(isPlayerInsideStormShelter(11.2, 0.4, 11.2, 0.4, 4.2), true);
  assert.equal(isPlayerInsideStormShelter(16.0, 0.4, 11.2, 0.4, 4.2), false);
});
