import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_BEST_GOLD_STORAGE_KEY,
  MAX_HALL_OF_FAME_ENTRIES,
  PROGRESS_STORAGE_KEY,
  createDefaultProgress,
  loadProgressFromStorage,
  parseStoredProgress,
  recordExpeditionResult,
  saveProgressToStorage,
} from './persistence';

function makeRunStats(overrides: Partial<Parameters<typeof recordExpeditionResult>[1]['stats']> = {}) {
  return {
    woodHarvested: 40,
    peltsCollected: 5,
    goldEarned: 120,
    treesFelled: 12,
    animalsHunted: 4,
    wolvesSlain: 1,
    completedObjectives: 2,
    elapsedSeconds: 185,
    ...overrides,
  };
}

test('parses defaults, recovers from malformed JSON, and migrates legacy best gold', () => {
  const empty = parseStoredProgress(null, 85);
  assert.equal(empty.stats.bestGold, 85);
  assert.equal(empty.stats.totalRuns, 0);
  assert.deepEqual(empty.hallOfFame, []);

  const malformed = parseStoredProgress('{not valid json', 42);
  assert.equal(malformed.stats.bestGold, 42);
  assert.deepEqual(malformed.hallOfFame, []);
});

test('records expeditions, sorts Hall of Fame descending by gold earned, and caps entries', () => {
  let progress = createDefaultProgress(0);

  for (let i = 1; i <= MAX_HALL_OF_FAME_ENTRIES + 3; i++) {
    const res = recordExpeditionResult(progress, {
      id: `run-${i}`,
      stats: makeRunStats({
        goldEarned: i * 50,
        woodHarvested: i * 10,
        treesFelled: i,
        animalsHunted: 2,
        elapsedSeconds: 200 - i * 5,
      }),
      cabinTier: i % 2 === 0 ? 5 : 3,
      victory: i % 2 === 0,
      recordedAt: `2026-11-14T12:00:${String(i).padStart(2, '0')}.000Z`,
    });
    progress = res.progress;
    assert.equal(res.isNewBest, true);
    assert.equal(res.rank, 1);
  }

  assert.equal(progress.hallOfFame.length, MAX_HALL_OF_FAME_ENTRIES);
  assert.equal(progress.hallOfFame[0].goldEarned, (MAX_HALL_OF_FAME_ENTRIES + 3) * 50);
  assert.equal(progress.stats.bestGold, (MAX_HALL_OF_FAME_ENTRIES + 3) * 50);
  assert.equal(progress.stats.totalRuns, MAX_HALL_OF_FAME_ENTRIES + 3);
  assert.equal(progress.stats.victories, 6);
  assert.equal(progress.stats.fastestVictorySeconds, 200 - 12 * 5);

  // Adding a lower-scoring run keeps leaderboard sorted and preserves bestGold
  const lower = recordExpeditionResult(progress, {
    id: 'run-low',
    stats: makeRunStats({ goldEarned: 15 }),
    cabinTier: 1,
    victory: false,
    recordedAt: '2026-11-14T12:30:00.000Z',
  });
  assert.equal(lower.isNewBest, false);
  assert.equal(lower.rank, null);
  assert.equal(lower.progress.stats.bestGold, (MAX_HALL_OF_FAME_ENTRIES + 3) * 50);
});

test('round-trips Hall of Fame and stats through storage adapter', () => {
  const backing = new Map<string, string>();
  backing.set(LEGACY_BEST_GOLD_STORAGE_KEY, '90');
  const mockStorage = {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, val: string) => {
      backing.set(key, val);
    },
  };

  let progress = loadProgressFromStorage(mockStorage);
  assert.equal(progress.stats.bestGold, 90);

  const recorded = recordExpeditionResult(progress, {
    id: 'expedition-alpha',
    stats: makeRunStats({ goldEarned: 340, woodHarvested: 95, animalsHunted: 8 }),
    cabinTier: 5,
    victory: true,
    recordedAt: '2026-11-14T15:00:00.000Z',
  });
  progress = {
    ...recorded.progress,
    skills: {
      gatheringXp: 18,
      gatheringLevel: 3,
      gatheringPoints: 1,
      huntingXp: 24,
      huntingLevel: 2,
      huntingPoints: 0,
      ranks: {
        pack_capacity: 1,
        move_speed: 0,
        gather_yield: 0,
        hunt_damage: 1,
        pelt_yield: 0,
        cold_resist: 0,
      },
    },
  };
  saveProgressToStorage(progress, mockStorage);

  assert.ok(backing.has(PROGRESS_STORAGE_KEY));
  assert.equal(backing.get(LEGACY_BEST_GOLD_STORAGE_KEY), '340');

  const reloaded = loadProgressFromStorage(mockStorage);
  assert.equal(reloaded.stats.bestGold, 340);
  assert.equal(reloaded.stats.totalWoodHarvested, 95);
  assert.equal(reloaded.stats.totalAnimalsHunted, 8);
  assert.equal(reloaded.hallOfFame.length, 1);
  assert.equal(reloaded.hallOfFame[0].id, 'expedition-alpha');
  assert.equal(reloaded.hallOfFame[0].victory, true);
  assert.equal(reloaded.skills?.gatheringLevel, 3);
  assert.equal(reloaded.skills?.ranks.pack_capacity, 1);
  assert.equal(reloaded.skills?.ranks.hunt_damage, 1);
});
