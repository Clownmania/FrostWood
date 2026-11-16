import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WIND_DIRECTION,
  computeWindGustSample,
  worldLeanToLocalEuler,
} from './wind';

test('WIND_DIRECTION is normalized and aligned with snow drift (+X, slight +Z)', () => {
  const mag = Math.hypot(WIND_DIRECTION.x, WIND_DIRECTION.z);
  assert.ok(Math.abs(mag - 1) < 1e-6);
  assert.ok(WIND_DIRECTION.x > 0.9);
  assert.ok(WIND_DIRECTION.z > 0.2);
});

test('blizzard gusts produce substantially stronger directional lean than clear weather', () => {
  let clearTotal = 0;
  let blizzardTotal = 0;

  for (let i = 0; i < 12; i++) {
    const t = i * 0.35;
    const clear = computeWindGustSample({
      time: t,
      gustIntensity: 0,
      worldX: 12,
      worldZ: -6,
    });
    const blizzard = computeWindGustSample({
      time: t,
      gustIntensity: 1.0,
      worldX: 12,
      worldZ: -6,
    });
    clearTotal += Math.hypot(clear.leanX, clear.leanZ);
    blizzardTotal += Math.hypot(blizzard.leanX, blizzard.leanZ);

    // Blizzard trees consistently bend forward in the wind direction (+X)
    assert.ok(blizzard.leanX > 0.02, `expected positive wind leanX, got ${blizzard.leanX}`);
  }

  assert.ok(blizzardTotal > clearTotal * 6);
});

test('stiffer objects sway less than supple branches or hanging banners', () => {
  const supple = computeWindGustSample({
    time: 1.2,
    gustIntensity: 1.0,
    worldX: 5,
    worldZ: 4,
    stiffness: 0.6,
  });
  const stiff = computeWindGustSample({
    time: 1.2,
    gustIntensity: 1.0,
    worldX: 5,
    worldZ: 4,
    stiffness: 2.0,
  });

  assert.ok(Math.hypot(supple.leanX, supple.leanZ) > Math.hypot(stiff.leanX, stiff.leanZ) * 2.5);
});

test('worldLeanToLocalEuler preserves world +X wind direction for rotated trees', () => {
  const leanX = 0.2;
  const leanZ = 0.05;

  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 3, 2.4]) {
    const { rotX, rotZ } = worldLeanToLocalEuler(leanX, leanZ, yaw);
    // In local space of a mesh rotated by yaw around Y:
    // +X displacement of (0,1,0) is approx -rotZ; +Z displacement is approx +rotX.
    const localDx = -rotZ;
    const localDz = rotX;
    // Rotate local displacement back into world space by +yaw around Y
    const worldDx = Math.cos(yaw) * localDx + Math.sin(yaw) * localDz;
    const worldDz = -Math.sin(yaw) * localDx + Math.cos(yaw) * localDz;

    assert.ok(Math.abs(worldDx - leanX) < 1e-6);
    assert.ok(Math.abs(worldDz - leanZ) < 1e-6);
  }
});
