import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_LOGIN_REWARDS,
  LEGACY_BEST_GOLD_STORAGE_KEY,
  MAX_HALL_OF_FAME_ENTRIES,
  PROGRESS_STORAGE_KEY,
  claimDailyLoginRewardInProgress,
  createDefaultProgress,
  createEmptySaveSlots,
  deleteSaveSlotFromStorage,
  evaluateDailyLoginState,
  loadProgressFromStorage,
  loadSaveSlotsFromStorage,
  parseStoredProgress,
  recordExpeditionResult,
  saveProgressToStorage,
  saveSlotToStorage,
} from './persistence';
import type { SavedGameSlot } from './types';

function makeRunStats(overrides: Partial<Parameters<typeof recordExpeditionResult>[1]['stats']> = {}) {
  return {
    woodHarvested: 40,
    stoneHarvested: 12,
    iceHarvested: 5,
    peltsCollected: 5,
    meatCooked: 3,
    goldEarned: 120,
    treesFelled: 12,
    animalsHunted: 4,
    wolvesSlain: 1,
    rivalsDefeated: 0,
    chestsOpened: 1,
    itemsCrafted: 2,
    completedObjectives: 2,
    daysSurvived: 3,
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

test('daily login reward tracks 7-day streaks, blocks duplicate same-day claims, and resets after missed days', () => {
  let progress = createDefaultProgress(0);
  assert.equal(DAILY_LOGIN_REWARDS.length, 7);

  // Day 1 initial state
  const initialState = evaluateDailyLoginState(progress, '2026-11-01');
  assert.equal(initialState.streakDay, 1);
  assert.equal(initialState.canClaimToday, true);
  assert.equal(initialState.claimedToday, false);
  assert.equal(initialState.todayReward.day, 1);

  // Claim Day 1
  const claim1 = claimDailyLoginRewardInProgress(progress, '2026-11-01');
  progress = claim1.progress;
  assert.ok(claim1.claimedReward);
  assert.equal(claim1.claimedReward?.day, 1);
  assert.equal(claim1.state.canClaimToday, false);
  assert.equal(claim1.state.claimedToday, true);
  assert.equal(claim1.state.totalDaysClaimed, 1);

  // Duplicate claim on the same day is blocked
  const duplicateClaim = claimDailyLoginRewardInProgress(progress, '2026-11-01');
  assert.equal(duplicateClaim.claimedReward, null);
  assert.equal(duplicateClaim.state.totalDaysClaimed, 1);

  // Consecutive days 2 through 7 advance streak up to Day 7 legendary reward
  for (let d = 2; d <= 7; d++) {
    const dateKey = `2026-11-0${d}`;
    const pre = evaluateDailyLoginState(progress, dateKey);
    assert.equal(pre.streakDay, d);
    assert.equal(pre.canClaimToday, true);
    const claimed = claimDailyLoginRewardInProgress(progress, dateKey);
    progress = claimed.progress;
    assert.equal(claimed.claimedReward?.day, d);
    assert.equal(claimed.state.totalDaysClaimed, d);
  }

  // Day 8 consecutive wraps streak cleanly back to Day 1
  const day8State = evaluateDailyLoginState(progress, '2026-11-08');
  assert.equal(day8State.streakDay, 1);
  assert.equal(day8State.canClaimToday, true);
  const claim8 = claimDailyLoginRewardInProgress(progress, '2026-11-08');
  progress = claim8.progress;

  // Claim Day 2 on 2026-11-09
  const claim9 = claimDailyLoginRewardInProgress(progress, '2026-11-09');
  progress = claim9.progress;
  assert.equal(claim9.claimedReward?.day, 2);

  // Skipping 2026-11-10 and logging in on 2026-11-11 resets streak to Day 1
  const missedState = evaluateDailyLoginState(progress, '2026-11-11');
  assert.equal(missedState.streakDay, 1);
  assert.equal(missedState.canClaimToday, true);
});

test('save game and load game multi-slot persistence round-trips and deletes slots cleanly', () => {
  const backing = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, val: string) => {
      backing.set(key, val);
    },
  };

  assert.deepEqual(loadSaveSlotsFromStorage(mockStorage), createEmptySaveSlots());

  const sampleSlot: SavedGameSlot = {
    slotId: 'slot1',
    label: 'Save Slot 1',
    savedAt: '2026-11-17T10:00:00.000Z',
    zone: 'level3',
    zoneName: 'Rimefang Abyss',
    cabinTier: 4,
    dayNumber: 6,
    timeOfDay: 0.45,
    weather: 'light_snow',
    weatherTimer: 28,
    endlessMode: false,
    victory: false,
    playerX: 12.5,
    playerZ: -18.2,
    playerYaw: 1.1,
    hp: 95,
    maxHp: 120,
    warmth: 88,
    maxWarmth: 115,
    activeTool: 'bow',
    resources: {
      wood: 140,
      stone: 85,
      ice: 42,
      pelts: 19,
      meat: 11,
      gold: 520,
    },
    levels: {
      axe: 3,
      bow: 4,
      coat: 3,
      cabin: 4,
      lumberCamp: 2,
      sawmill: 2,
      tannery: 1,
      forge: 1,
      tamingPen: 2,
      stormShelter: 1,
      windbreak: 1,
      thermalConduit: 1,
      festivalPavilion: 0,
      iceMonument: 0,
    },
    gear: {
      coat: 2,
      boots: 3,
      gloves: 2,
      pack: 2,
    },
    unlockedGear: {
      coat: 3,
      boots: 3,
      gloves: 2,
      pack: 2,
    },
    wingsTier: 2,
    wingsEquipped: true,
    backpackInventory: {
      clockwork_gear: 3,
      hammer_temper: 1,
      utility_toolkit: 1,
      snare_trap: 3,
      frost_trap: 1,
      fire_starter: 2,
      insulated_boots: 1,
      flint_quiver: 1,
      alpine_poultice: 2,
      frost_whetstone: 2,
      mammoth_tonic: 1,
      aurora_charm: 1,
    },
    activeBuffs: {
      fireStarter: 25,
      insulatedBoots: 0,
      flintEdge: 0,
      frostWhetstone: 18,
      auroraCharm: 40,
      hammerTemper: 0,
      utilityToolkit: 0,
    },
    stats: makeRunStats({ goldEarned: 520 }),
    tamedPets: [
      {
        uid: 'pet-wolf-1',
        speciesId: 'frost_pup',
        name: 'Frostfang',
        rarity: 'rare',
        tamedVia: 'feeding',
        affection: 85,
        inPen: false,
      },
    ],
    activePetUid: 'pet-wolf-1',
  };

  saveSlotToStorage('slot1', sampleSlot, mockStorage);
  const loaded = loadSaveSlotsFromStorage(mockStorage);
  assert.ok(loaded.slot1);
  assert.equal(loaded.slot1?.zone, 'level3');
  assert.equal(loaded.slot1?.resources.gold, 520);
  assert.equal(loaded.slot1?.backpackInventory.clockwork_gear, 3);
  assert.equal(loaded.slot1?.tamedPets.length, 1);
  assert.equal(loaded.slot1?.activePetUid, 'pet-wolf-1');
  assert.equal(loaded.slot2, null);

  deleteSaveSlotFromStorage('slot1', mockStorage);
  const afterDelete = loadSaveSlotsFromStorage(mockStorage);
  assert.equal(afterDelete.slot1, null);
});


