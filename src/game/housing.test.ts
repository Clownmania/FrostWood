import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CABIN_INTERIOR_BED_POS,
  CABIN_INTERIOR_CENTER_X,
  CABIN_INTERIOR_CENTER_Z,
  CABIN_INTERIOR_DOOR_POS,
  CABIN_INTERIOR_HALF_D,
  CABIN_INTERIOR_HALF_W,
  CABIN_MORNING_TIME_OF_DAY,
  clampToCabinInterior,
  computeSleepDaySkip,
  getCabinComfortSpec,
  getCabinExteriorDoorPos,
  isNearCabinBed,
  isNearCabinExteriorDoor,
  isNearCabinInteriorDoor,
} from './housing';
import { BUILDING_POSITIONS } from './world';

test('getCabinExteriorDoorPos places doorstep facing campfire and detects proximity', () => {
  const door = getCabinExteriorDoorPos();
  const distToCampfireFromDoor = Math.hypot(door.x, door.z);
  const distToCampfireFromCabin = Math.hypot(
    BUILDING_POSITIONS.cabin.x,
    BUILDING_POSITIONS.cabin.z,
  );
  assert.ok(distToCampfireFromDoor < distToCampfireFromCabin, 'doorstep faces campfire plaza');
  assert.equal(isNearCabinExteriorDoor(door.x, door.z), true);
  assert.equal(isNearCabinExteriorDoor(0, 0), false);
});

test('interior proximity and clamping keep player inside cabin bounds and around bed/hearth', () => {
  assert.equal(
    isNearCabinInteriorDoor(CABIN_INTERIOR_DOOR_POS.x, CABIN_INTERIOR_DOOR_POS.z),
    true,
  );
  assert.equal(isNearCabinInteriorDoor(CABIN_INTERIOR_BED_POS.x, CABIN_INTERIOR_BED_POS.z), false);
  assert.equal(isNearCabinBed(CABIN_INTERIOR_BED_POS.x, CABIN_INTERIOR_BED_POS.z + 1.5), true);
  assert.equal(isNearCabinBed(CABIN_INTERIOR_DOOR_POS.x, CABIN_INTERIOR_DOOR_POS.z), false);

  const clampedWall = clampToCabinInterior(
    CABIN_INTERIOR_CENTER_X + 20,
    CABIN_INTERIOR_CENTER_Z - 20,
  );
  assert.ok(clampedWall.x < CABIN_INTERIOR_CENTER_X + CABIN_INTERIOR_HALF_W);
  assert.ok(clampedWall.z > CABIN_INTERIOR_CENTER_Z - CABIN_INTERIOR_HALF_D);

  // Attempting to walk straight into bed center pushes player neatly outside bed frame
  const pushedBed = clampToCabinInterior(
    CABIN_INTERIOR_BED_POS.x + 0.1,
    CABIN_INTERIOR_BED_POS.z,
  );
  const offsetFromBed = Math.max(
    Math.abs(pushedBed.x - CABIN_INTERIOR_BED_POS.x),
    Math.abs(pushedBed.z - CABIN_INTERIOR_BED_POS.z),
  );
  assert.ok(offsetFromBed >= 1.04);
});

test('computeSleepDaySkip increments dayNumber and resets clock cleanly to dawn morning', () => {
  const nightSleep = computeSleepDaySkip({ dayNumber: 1, timeOfDay: 0.92 });
  assert.equal(nightSleep.nextDayNumber, 2);
  assert.equal(nightSleep.nextTimeOfDay, CABIN_MORNING_TIME_OF_DAY);
  assert.ok(nightSleep.hoursSkipped >= 6 && nightSleep.hoursSkipped <= 10);

  const afternoonSleep = computeSleepDaySkip({ dayNumber: 4, timeOfDay: 0.55 });
  assert.equal(afternoonSleep.nextDayNumber, 5);
  assert.equal(afternoonSleep.nextTimeOfDay, CABIN_MORNING_TIME_OF_DAY);
  assert.ok(afternoonSleep.hoursSkipped >= 15);
});

test('getCabinComfortSpec scales recovery and morning bonuses across tiers 1..5', () => {
  const t1 = getCabinComfortSpec(1);
  const t5 = getCabinComfortSpec(5);
  assert.equal(t1.tier, 1);
  assert.equal(t5.tier, 5);
  assert.ok(t5.hearthWarmthPerSec > t1.hearthWarmthPerSec);
  assert.ok(t5.hearthHpPerSec > t1.hearthHpPerSec);
  assert.ok(t5.restedWoodBonus > t1.restedWoodBonus);
});
