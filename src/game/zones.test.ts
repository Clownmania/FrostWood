import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVEL1_RADIUS,
  LEVEL2_RADIUS,
  PORTAL_VORTEX_RADIUS,
  ZONE_SPECS,
  buildZoneHudInfo,
  clampToZoneBounds,
  computePortalProximity,
  getDestinationAfterPortal,
} from './zones';

test('map expands Level 1 radius beyond 50 and places Level 2 & portal on the North side', () => {
  assert.ok(LEVEL1_RADIUS >= 85, 'Level 1 should be noticeably larger than legacy 50m radius');
  assert.ok(LEVEL2_RADIUS >= 70);
  // North is -Z in world coordinates
  assert.ok(ZONE_SPECS.level1.portalZ < -50);
  assert.ok(ZONE_SPECS.level2.centerZ < -150);
});

test('clampToZoneBounds constrains coordinates cleanly inside each zone radius', () => {
  const l1Inside = clampToZoneBounds(20, -30, 'level1');
  assert.equal(l1Inside.clamped, false);

  const l1Outside = clampToZoneBounds(0, -140, 'level1', 1.5);
  assert.equal(l1Outside.clamped, true);
  assert.ok(Math.abs(l1Outside.z - -(LEVEL1_RADIUS - 1.5)) < 0.001);

  const l2Center = ZONE_SPECS.level2.centerZ;
  const l2Inside = clampToZoneBounds(12, l2Center - 20, 'level2');
  assert.equal(l2Inside.clamped, false);

  const l2Outside = clampToZoneBounds(0, l2Center - 120, 'level2', 2.5);
  assert.equal(l2Outside.clamped, true);
  assert.ok(Math.abs(Math.hypot(l2Outside.x, l2Outside.z - l2Center) - (LEVEL2_RADIUS - 2.5)) < 0.001);
});

test('portal proximity and destination switching prevent instant ping-pong', () => {
  const fromCamp = computePortalProximity(0, 4.6, 'level1');
  assert.equal(fromCamp.direction, 'N');
  assert.equal(fromCamp.nearInteract, false);
  assert.equal(fromCamp.insideVortex, false);

  const atNorthPortal = computePortalProximity(
    ZONE_SPECS.level1.portalX,
    ZONE_SPECS.level1.portalZ + 1.0,
    'level1',
  );
  assert.equal(atNorthPortal.nearInteract, true);
  assert.equal(atNorthPortal.insideVortex, true);

  const toLevel2 = getDestinationAfterPortal('level1');
  assert.equal(toLevel2.zone, 'level2');
  const arrivalProx2 = computePortalProximity(toLevel2.x, toLevel2.z, 'level2');
  assert.ok(arrivalProx2.dist > PORTAL_VORTEX_RADIUS + 1.0);
  assert.equal(arrivalProx2.insideVortex, false);
  assert.equal(arrivalProx2.nearInteract, true);

  const toLevel1 = getDestinationAfterPortal('level2');
  assert.equal(toLevel1.zone, 'level1');
  const arrivalProx1 = computePortalProximity(toLevel1.x, toLevel1.z, 'level1');
  assert.ok(arrivalProx1.dist > PORTAL_VORTEX_RADIUS + 1.0);
  assert.equal(arrivalProx1.insideVortex, false);
  assert.equal(arrivalProx1.nearInteract, true);

  const hud2 = buildZoneHudInfo('level2', toLevel2.x, toLevel2.z);
  assert.equal(hud2.levelNumber, 2);
  assert.equal(hud2.portalDirection, 'S');
});
