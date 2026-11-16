import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceTrendTracker } from './trends.ts';

test('ResourceTrendTracker starts flat and reports down immediately on spending then recovers to flat', () => {
  const tracker = new ResourceTrendTracker(10, 0.25);
  tracker.reset({ wood: 85, stone: 42, ice: 10, pelts: 28, gold: 240 }, 0);

  const initial = tracker.update(0, {
    wood: 85,
    stone: 42,
    ice: 10,
    pelts: 28,
    gold: 240,
  });
  assert.equal(initial.trends.wood, 'flat');
  assert.equal(initial.trends.gold, 'flat');
  assert.equal(initial.deltas.gold, 0);

  // Player spends resources at t=1s
  const afterSpend = tracker.update(1, {
    wood: 81,
    stone: 37,
    ice: 9,
    pelts: 26,
    gold: 220,
  });
  assert.equal(afterSpend.trends.wood, 'down');
  assert.equal(afterSpend.trends.stone, 'down');
  assert.equal(afterSpend.trends.ice, 'down');
  assert.equal(afterSpend.trends.pelts, 'down');
  assert.equal(afterSpend.trends.gold, 'down');
  assert.equal(afterSpend.deltas.gold, -20);

  // Sample periodically past the 10s rolling window with no further changes
  for (let t = 1.5; t <= 12; t += 0.5) {
    tracker.update(t, {
      wood: 81,
      stone: 37,
      ice: 9,
      pelts: 26,
      gold: 220,
    });
  }
  const settled = tracker.update(12.5, {
    wood: 81,
    stone: 37,
    ice: 9,
    pelts: 26,
    gold: 220,
  });
  assert.equal(settled.trends.wood, 'flat');
  assert.equal(settled.trends.gold, 'flat');
  assert.equal(settled.deltas.gold, 0);
});

test('ResourceTrendTracker detects resource gains and reflects passive income rates', () => {
  const tracker = new ResourceTrendTracker(10, 0.25);
  tracker.reset({ wood: 10, stone: 0, ice: 0, pelts: 2, gold: 20 }, 0);

  // Harvested wood & pelts + passive gold income
  const gained = tracker.update(
    1,
    { wood: 16, stone: 3, ice: 1, pelts: 5, gold: 20 },
    { wood: 1.2, gold: 0.8 },
  );
  assert.equal(gained.trends.wood, 'up');
  assert.equal(gained.trends.stone, 'up');
  assert.equal(gained.trends.ice, 'up');
  assert.equal(gained.trends.pelts, 'up');
  // Passive gold rate keeps gold trend 'up' even before first whole gold ticks
  assert.equal(gained.trends.gold, 'up');

  // Reset clears previous run history cleanly
  tracker.reset({ wood: 0, stone: 0, ice: 0, pelts: 0, gold: 0 }, 0);
  const resetRes = tracker.update(0.1, { wood: 0, stone: 0, ice: 0, pelts: 0, gold: 0 });
  assert.equal(resetRes.trends.wood, 'flat');
  assert.equal(resetRes.trends.pelts, 'flat');
  assert.equal(resetRes.trends.gold, 'flat');
});
