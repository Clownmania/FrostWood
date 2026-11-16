import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITY_RADIUS,
  LEVEL1_RADIUS,
  LEVEL2_RADIUS,
  LEVEL3_RADIUS,
  LEVEL4_RADIUS,
  LEVEL5_RADIUS,
  PORTAL_VORTEX_RADIUS,
  SURVIVAL_ZONE_ORDER,
  ZONE_SPECS,
  buildZoneHudInfo,
  clampToZoneBounds,
  computeForwardPortalProximity,
  computePortalProximity,
  getDestinationAfterPortal,
} from './zones';

test('map expands existing zones and adds 3 new survival zones with large radii', () => {
  assert.ok(LEVEL1_RADIUS >= 150, 'Level 1 should be expanded beyond 150m radius');
  assert.ok(LEVEL2_RADIUS >= 130, 'Level 2 should be expanded beyond 130m radius');
  assert.ok(LEVEL3_RADIUS >= 135, 'Level 3 should be a large zone');
  assert.ok(LEVEL4_RADIUS >= 140, 'Level 4 should be a large zone');
  assert.ok(LEVEL5_RADIUS >= 145, 'Level 5 should be a large zone');
  assert.ok(CITY_RADIUS >= 85, 'Frostcave City should be expanded');
  assert.deepEqual(SURVIVAL_ZONE_ORDER, ['level1', 'level2', 'level3', 'level4', 'level5']);
});

test('each survival zone increases difficulty 3x times (1x -> 3x -> 9x -> 27x -> 81x) and is tougher to survive', () => {
  assert.equal(ZONE_SPECS.level1.difficultyMult, 1);
  assert.equal(ZONE_SPECS.level2.difficultyMult, 3);
  assert.equal(ZONE_SPECS.level3.difficultyMult, 9);
  assert.equal(ZONE_SPECS.level4.difficultyMult, 27);
  assert.equal(ZONE_SPECS.level5.difficultyMult, 81);

  for (let i = 1; i < SURVIVAL_ZONE_ORDER.length; i++) {
    const prev = ZONE_SPECS[SURVIVAL_ZONE_ORDER[i - 1]];
    const curr = ZONE_SPECS[SURVIVAL_ZONE_ORDER[i]];
    assert.equal(
      curr.difficultyMult,
      prev.difficultyMult * 3,
      `${curr.id} should have 3x the difficultyMult of ${prev.id}`,
    );
    assert.ok(curr.chillMult > prev.chillMult, `${curr.id} should have harsher cold drain than ${prev.id}`);
    assert.ok(curr.enemyHpMult > prev.enemyHpMult, `${curr.id} should have tougher enemy HP than ${prev.id}`);
    assert.ok(
      curr.enemyDamageMult > prev.enemyDamageMult,
      `${curr.id} should have stronger enemy attacks than ${prev.id}`,
    );
  }
});

test('clampToZoneBounds constrains coordinates cleanly inside each expanded zone radius', () => {
  const l1Inside = clampToZoneBounds(40, -60, 'level1');
  assert.equal(l1Inside.clamped, false);

  const l1Outside = clampToZoneBounds(0, -200, 'level1', 1.5);
  assert.equal(l1Outside.clamped, true);
  assert.ok(Math.abs(l1Outside.z - -(LEVEL1_RADIUS - 1.5)) < 0.001);

  const l2Center = ZONE_SPECS.level2.centerZ;
  const l2Inside = clampToZoneBounds(25, l2Center - 40, 'level2');
  assert.equal(l2Inside.clamped, false);

  const l2Outside = clampToZoneBounds(0, l2Center - 190, 'level2', 2.5);
  assert.equal(l2Outside.clamped, true);
  assert.ok(Math.abs(Math.hypot(l2Outside.x, l2Outside.z - l2Center) - (LEVEL2_RADIUS - 2.5)) < 0.001);

  for (const zoneId of ['level3', 'level4', 'level5'] as const) {
    const spec = ZONE_SPECS[zoneId];
    const inside = clampToZoneBounds(spec.centerX + 30, spec.centerZ - 30, zoneId);
    assert.equal(inside.clamped, false);
    const outside = clampToZoneBounds(spec.centerX + 300, spec.centerZ, zoneId, 2.0);
    assert.equal(outside.clamped, true);
    assert.ok(
      Math.abs(Math.hypot(outside.x - spec.centerX, outside.z - spec.centerZ) - (spec.radius - 2.0)) < 0.001,
    );
  }
});

test('portal chain connects Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5 and prevents instant ping-pong', () => {
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

  const toLevel2 = getDestinationAfterPortal('level1', 'to_level2');
  assert.equal(toLevel2.zone, 'level2');
  const arrivalProx2 = computePortalProximity(toLevel2.x, toLevel2.z, 'level2');
  assert.ok(arrivalProx2.dist > PORTAL_VORTEX_RADIUS + 1.0);
  assert.equal(arrivalProx2.insideVortex, false);
  assert.equal(arrivalProx2.nearInteract, true);

  const toLevel3 = getDestinationAfterPortal('level2', 'to_level3');
  assert.equal(toLevel3.zone, 'level3');
  const fwdProx2 = computeForwardPortalProximity(
    ZONE_SPECS.level2.forwardPortalX!,
    ZONE_SPECS.level2.forwardPortalZ!,
    'level2',
  );
  assert.ok(fwdProx2 && fwdProx2.insideVortex);

  const toLevel4 = getDestinationAfterPortal('level3', 'to_level4');
  assert.equal(toLevel4.zone, 'level4');

  const toLevel5 = getDestinationAfterPortal('level4', 'to_level5');
  assert.equal(toLevel5.zone, 'level5');

  const backToLevel4 = getDestinationAfterPortal('level5', 'to_level4');
  assert.equal(backToLevel4.zone, 'level4');

  const hud5 = buildZoneHudInfo('level5', toLevel5.x, toLevel5.z);
  assert.equal(hud5.levelNumber, 5);
  assert.equal(hud5.difficultyMult, 81);
});
