import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PET_PASSIVE_TAME_RADIUS,
  PET_SPECIES_ORDER,
  applyFeedWildPet,
  computeActivePetBonuses,
  computePassiveTameGain,
  getTamingPenSpec,
} from './pets';

test('taming pen tiers scale max pet capacity and passive taming multiplier', () => {
  assert.equal(PET_SPECIES_ORDER.length, 6);
  const lv0 = getTamingPenSpec(0);
  const lv1 = getTamingPenSpec(1);
  const lv3 = getTamingPenSpec(3);
  assert.equal(lv0.maxPets, 1);
  assert.equal(lv1.maxPets, 2);
  assert.equal(lv3.maxPets, 6);
  assert.ok(lv3.passiveTameRateMult > lv1.passiveTameRateMult);
});

test('passive taming requires proximity and calm movement speed', () => {
  const calm = computePassiveTameGain({
    speciesId: 'snow_hare',
    distance: 2.0,
    playerSpeed: 0,
    penLevel: 1,
    dt: 2.0,
  });
  assert.ok(calm > 30);

  const sprintingTooFast = computePassiveTameGain({
    speciesId: 'snow_hare',
    distance: 2.0,
    playerSpeed: 6.5,
    penLevel: 1,
    dt: 2.0,
  });
  assert.equal(sprintingTooFast, 0);

  const tooFar = computePassiveTameGain({
    speciesId: 'snow_hare',
    distance: PET_PASSIVE_TAME_RADIUS + 1.5,
    playerSpeed: 0,
    penLevel: 1,
    dt: 2.0,
  });
  assert.equal(tooFar, 0);
});

test('feeding taming spends meat or coin treats and completes at 100%', () => {
  const res1 = applyFeedWildPet({
    speciesId: 'snow_hare',
    currentProgress: 20,
    resources: { wood: 0, pelts: 0, gold: 30, meat: 2 },
    penLevel: 1,
  });
  assert.equal(res1.ok, true);
  assert.equal(res1.resources.meat, 1);
  assert.equal(res1.tamedNow, false);
  assert.ok(res1.nextProgress > 60);

  const res2 = applyFeedWildPet({
    speciesId: 'snow_hare',
    currentProgress: res1.nextProgress,
    resources: res1.resources,
    penLevel: 1,
  });
  assert.equal(res2.ok, true);
  assert.equal(res2.tamedNow, true);
  assert.equal(res2.nextProgress, 100);
});

test('active companion grants scaled movement, damage, or pack bonuses', () => {
  const bonuses = computeActivePetBonuses(
    [
      {
        uid: 'pet-1',
        speciesId: 'frost_pup',
        name: 'Borealis',
        rarity: 'rare',
        tamedVia: 'feeding',
        affection: 50,
        inPen: false,
      },
    ],
    'pet-1',
    2,
  );
  assert.ok(bonuses.damageMult > 1.2);
  assert.ok(bonuses.moveSpeedMult > 1.05);
});
