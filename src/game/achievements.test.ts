import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  createDefaultAchievementCounters,
  evaluateAchievements,
  sanitizeAchievementCounters,
  sanitizeUnlockedAchievementIds,
} from './achievements';

test('defines 20 unique achievements including 1000 timber collected and 50 animals hunted', () => {
  assert.equal(ACHIEVEMENTS.length, 20);
  const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
  assert.equal(ids.size, 20);

  const timber1000 = ACHIEVEMENTS.find((a) => a.id === 'timber_1000');
  assert.ok(timber1000);
  assert.equal(timber1000.target, 1000);
  assert.equal(timber1000.counterKey, 'woodCollected');

  const hunt50 = ACHIEVEMENTS.find((a) => a.id === 'hunt_50');
  assert.ok(hunt50);
  assert.equal(hunt50.target, 50);
  assert.equal(hunt50.counterKey, 'animalsHunted');
});

test('evaluateAchievements unlocks milestones once thresholds are met and preserves prior unlocks', () => {
  const counters = createDefaultAchievementCounters();
  counters.woodCollected = 1000;
  counters.animalsHunted = 50;
  counters.petsTamed = 1;

  const eval1 = evaluateAchievements(counters, []);
  const unlockedSet = new Set(eval1.unlockedIds);
  assert.ok(unlockedSet.has('timber_100'));
  assert.ok(unlockedSet.has('timber_1000'));
  assert.ok(unlockedSet.has('hunt_10'));
  assert.ok(unlockedSet.has('hunt_50'));
  assert.ok(unlockedSet.has('pet_first'));
  assert.equal(eval1.newlyUnlocked.length, 5);

  // Already unlocked IDs remain unlocked even if counters later reset or are evaluated again
  const emptyCounters = createDefaultAchievementCounters();
  const eval2 = evaluateAchievements(emptyCounters, eval1.unlockedIds);
  assert.equal(eval2.newlyUnlocked.length, 0);
  assert.equal(eval2.unlockedIds.length, 5);

  const huntEntry = eval2.entries.find((e) => e.id === 'hunt_50');
  assert.ok(huntEntry);
  assert.equal(huntEntry.unlocked, true);
  assert.equal(huntEntry.progress, 50);
});

test('sanitizers ignore invalid IDs and negative counter values', () => {
  const ids = sanitizeUnlockedAchievementIds(['timber_100', 'bogus_id', 'timber_100', 42]);
  assert.deepEqual(ids, ['timber_100']);

  const counters = sanitizeAchievementCounters({
    woodCollected: -50,
    animalsHunted: 17.9,
  });
  assert.equal(counters.woodCollected, 0);
  assert.equal(counters.animalsHunted, 17);
  assert.equal(counters.maxCabinTier, 1);
});
