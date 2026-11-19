import assert from 'node:assert/strict';
import test from 'node:test';
import { selectBestBowTarget, type BowCandidateTarget } from './bowCombat';

function makeCandidate(overrides: Partial<BowCandidateTarget>): BowCandidateTarget {
  return {
    id: 'target-1',
    kind: 'animal',
    label: 'Arctic Fox',
    x: 0,
    z: -12,
    vx: 0,
    vz: 0,
    hp: 40,
    maxHp: 40,
    isHostile: false,
    isTrackedQuarry: false,
    hitRadius: 1.1,
    ...overrides,
  };
}

test('selectBestBowTarget prioritizes hostile threats within bow range and filters out-of-range targets', () => {
  const farHostile = makeCandidate({
    id: 'hunter-far',
    kind: 'hunter',
    label: 'Raider',
    x: 0,
    z: -42,
    isHostile: true,
  });
  const passivePrey = makeCandidate({
    id: 'hare-1',
    kind: 'animal',
    label: 'Arctic Hare',
    x: -10,
    z: -8,
    isHostile: false,
  });
  const nearbyHunter = makeCandidate({
    id: 'hunter-near',
    kind: 'hunter',
    label: 'Frost Poacher',
    x: 2,
    z: -15,
    isHostile: true,
  });

  const result = selectBestBowTarget({
    playerX: 0,
    playerZ: 0,
    playerYaw: Math.PI,
    maxRange: 26,
    arrowSpeed: 34,
    candidates: [farHostile, passivePrey, nearbyHunter],
  });

  assert.ok(result !== null);
  assert.equal(result.target.id, 'hunter-near');
  assert.ok(result.distance > 14 && result.distance < 17);
});

test('selectBestBowTarget predicts lead position for moving wildlife and ignores defeated targets', () => {
  const deadTarget = makeCandidate({
    id: 'dead-wolf',
    kind: 'animal',
    label: 'Wolf',
    x: 0,
    z: -5,
    hp: 0,
    isHostile: true,
  });
  const movingStag = makeCandidate({
    id: 'stag-1',
    kind: 'animal',
    label: 'Tundra Stag',
    x: 0,
    z: -18,
    vx: 6,
    vz: 0,
    hp: 90,
    isTrackedQuarry: true,
  });

  const result = selectBestBowTarget({
    playerX: 0,
    playerZ: 0,
    playerYaw: Math.PI,
    maxRange: 28,
    arrowSpeed: 36,
    candidates: [deadTarget, movingStag],
  });

  assert.ok(result !== null);
  assert.equal(result.target.id, 'stag-1');
  assert.ok(result.aimX > 2.0, 'should lead moving target along +X velocity');
  assert.ok(result.ballisticLeadSeconds > 0.4);
});
