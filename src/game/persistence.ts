import {
  cloneAchievementCounters,
  createDefaultAchievementCounters,
  sanitizeAchievementCounters,
  sanitizeUnlockedAchievementIds,
} from './achievements';
import { createEmptyBestiary, sanitizeBestiary, cloneBestiary } from './bestiary';
import {
  cloneSkillsState,
  createInitialSkillsState,
  sanitizeSkillsState,
} from './skills';
import type {
  BestiaryMap,
  HallOfFameEntry,
  PersistentProgress,
  PlayerLifetimeStats,
  PlayerSkillsState,
  RunStats,
} from './types';

export const PROGRESS_STORAGE_KEY = 'frostwood_progress_v1';
export const LEGACY_BEST_GOLD_STORAGE_KEY = 'frostwood_best_gold_v1';
export const MAX_HALL_OF_FAME_ENTRIES = 10;

function nonNegInt(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function createDefaultLifetimeStats(legacyBestGold = 0): PlayerLifetimeStats {
  return {
    totalRuns: 0,
    victories: 0,
    bestGold: nonNegInt(legacyBestGold),
    totalGoldEarned: 0,
    totalWoodHarvested: 0,
    totalTreesFelled: 0,
    totalAnimalsHunted: 0,
    totalWolvesSlain: 0,
    totalObjectivesCompleted: 0,
    fastestVictorySeconds: null,
  };
}

export function createDefaultProgress(legacyBestGold = 0): PersistentProgress {
  return {
    version: 1,
    stats: createDefaultLifetimeStats(legacyBestGold),
    hallOfFame: [],
    bestiary: createEmptyBestiary(),
    skills: createInitialSkillsState(),
    cityDailyQuestsCompleted: 0,
    achievementsUnlocked: [],
    achievementCounters: createDefaultAchievementCounters(),
  };
}

function compareHallOfFame(a: HallOfFameEntry, b: HallOfFameEntry): number {
  if (b.goldEarned !== a.goldEarned) {
    return b.goldEarned - a.goldEarned;
  }
  if (a.victory !== b.victory) {
    return a.victory ? -1 : 1;
  }
  const aScore = a.treesFelled + a.animalsHunted;
  const bScore = b.treesFelled + b.animalsHunted;
  if (bScore !== aScore) {
    return bScore - aScore;
  }
  return b.recordedAt.localeCompare(a.recordedAt);
}

function sanitizeEntry(raw: unknown, idx: number): HallOfFameEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const goldEarned = nonNegInt(obj.goldEarned);
  const cabinTier = Math.max(1, Math.min(5, nonNegInt(obj.cabinTier) || 1));
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `run-${idx}-${goldEarned}`,
    goldEarned,
    woodHarvested: nonNegInt(obj.woodHarvested),
    peltsCollected: nonNegInt(obj.peltsCollected),
    treesFelled: nonNegInt(obj.treesFelled),
    animalsHunted: nonNegInt(obj.animalsHunted),
    wolvesSlain: nonNegInt(obj.wolvesSlain),
    completedObjectives: nonNegInt(obj.completedObjectives),
    cabinTier,
    elapsedSeconds: nonNegInt(obj.elapsedSeconds),
    victory: Boolean(obj.victory),
    recordedAt:
      typeof obj.recordedAt === 'string' && obj.recordedAt
        ? obj.recordedAt
        : new Date(0).toISOString(),
  };
}

export function parseStoredProgress(
  raw: string | null,
  legacyBestGold = 0,
): PersistentProgress {
  const safeLegacy = nonNegInt(legacyBestGold);
  if (!raw) {
    return createDefaultProgress(safeLegacy);
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultProgress(safeLegacy);
    }

    const rawStats =
      parsed.stats && typeof parsed.stats === 'object'
        ? (parsed.stats as Record<string, unknown>)
        : {};

    const rawEntries = Array.isArray(parsed.hallOfFame) ? parsed.hallOfFame : [];
    const hallOfFame = rawEntries
      .map((item, idx) => sanitizeEntry(item, idx))
      .filter((item): item is HallOfFameEntry => item !== null)
      .sort(compareHallOfFame)
      .slice(0, MAX_HALL_OF_FAME_ENTRIES);

    const topBoardGold = hallOfFame[0]?.goldEarned ?? 0;
    const storedBest = nonNegInt(rawStats.bestGold);
    const fastestRaw = rawStats.fastestVictorySeconds;
    const fastestVictorySeconds =
      typeof fastestRaw === 'number' && Number.isFinite(fastestRaw) && fastestRaw > 0
        ? Math.round(fastestRaw)
        : null;

    return {
      version: 1,
      stats: {
        totalRuns: nonNegInt(rawStats.totalRuns),
        victories: nonNegInt(rawStats.victories),
        bestGold: Math.max(storedBest, topBoardGold, safeLegacy),
        totalGoldEarned: nonNegInt(rawStats.totalGoldEarned),
        totalWoodHarvested: nonNegInt(rawStats.totalWoodHarvested),
        totalTreesFelled: nonNegInt(rawStats.totalTreesFelled),
        totalAnimalsHunted: nonNegInt(rawStats.totalAnimalsHunted),
        totalWolvesSlain: nonNegInt(rawStats.totalWolvesSlain),
        totalObjectivesCompleted: nonNegInt(rawStats.totalObjectivesCompleted),
        fastestVictorySeconds,
      },
      hallOfFame,
      bestiary: sanitizeBestiary(parsed.bestiary),
      skills: sanitizeSkillsState(parsed.skills),
      cityDailyQuestsCompleted: nonNegInt(parsed.cityDailyQuestsCompleted),
      achievementsUnlocked: sanitizeUnlockedAchievementIds(parsed.achievementsUnlocked),
      achievementCounters: sanitizeAchievementCounters(parsed.achievementCounters),
    };
  } catch {
    return createDefaultProgress(safeLegacy);
  }
}

export function recordExpeditionResult(
  current: PersistentProgress,
  params: {
    stats: RunStats;
    cabinTier: number;
    victory: boolean;
    recordedAt?: string;
    id?: string;
  },
): {
  progress: PersistentProgress;
  entry: HallOfFameEntry;
  rank: number | null;
  isNewBest: boolean;
} {
  const goldEarned = nonNegInt(params.stats.goldEarned);
  const woodHarvested = nonNegInt(params.stats.woodHarvested);
  const peltsCollected = nonNegInt(params.stats.peltsCollected);
  const treesFelled = nonNegInt(params.stats.treesFelled);
  const animalsHunted = nonNegInt(params.stats.animalsHunted);
  const wolvesSlain = nonNegInt(params.stats.wolvesSlain);
  const completedObjectives = nonNegInt(params.stats.completedObjectives);
  const elapsedSeconds = nonNegInt(params.stats.elapsedSeconds);
  const recordedAt = params.recordedAt ?? new Date().toISOString();
  const id =
    params.id ??
    `exp-${Date.now()}-${Math.floor(Math.random() * 10000).toString(36)}`;

  const entry: HallOfFameEntry = {
    id,
    goldEarned,
    woodHarvested,
    peltsCollected,
    treesFelled,
    animalsHunted,
    wolvesSlain,
    completedObjectives,
    cabinTier: Math.max(1, Math.min(5, nonNegInt(params.cabinTier) || 1)),
    elapsedSeconds,
    victory: params.victory,
    recordedAt,
  };

  const isNewBest = goldEarned > current.stats.bestGold;
  const nextFastest =
    params.victory && elapsedSeconds > 0
      ? current.stats.fastestVictorySeconds === null
        ? elapsedSeconds
        : Math.min(current.stats.fastestVictorySeconds, elapsedSeconds)
      : current.stats.fastestVictorySeconds;

  const nextStats: PlayerLifetimeStats = {
    totalRuns: current.stats.totalRuns + 1,
    victories: current.stats.victories + (params.victory ? 1 : 0),
    bestGold: Math.max(current.stats.bestGold, goldEarned),
    totalGoldEarned: current.stats.totalGoldEarned + goldEarned,
    totalWoodHarvested: current.stats.totalWoodHarvested + woodHarvested,
    totalTreesFelled: current.stats.totalTreesFelled + treesFelled,
    totalAnimalsHunted: current.stats.totalAnimalsHunted + animalsHunted,
    totalWolvesSlain: current.stats.totalWolvesSlain + wolvesSlain,
    totalObjectivesCompleted:
      current.stats.totalObjectivesCompleted + completedObjectives,
    fastestVictorySeconds: nextFastest,
  };

  const mergedBoard = [...current.hallOfFame, entry]
    .sort(compareHallOfFame)
    .slice(0, MAX_HALL_OF_FAME_ENTRIES);

  const rankIndex = mergedBoard.findIndex((item) => item.id === entry.id);

  const bestiary: BestiaryMap = current.bestiary
    ? cloneBestiary(current.bestiary)
    : createEmptyBestiary();

  const skills: PlayerSkillsState = current.skills
    ? cloneSkillsState(current.skills)
    : createInitialSkillsState();

  return {
    progress: {
      version: 1,
      stats: nextStats,
      hallOfFame: mergedBoard,
      bestiary,
      skills,
      cityDailyQuestsCompleted: nonNegInt(current.cityDailyQuestsCompleted),
      achievementsUnlocked: sanitizeUnlockedAchievementIds(current.achievementsUnlocked),
      achievementCounters: current.achievementCounters
        ? cloneAchievementCounters(current.achievementCounters)
        : createDefaultAchievementCounters(),
    },
    entry,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    isNewBest,
  };
}

export function loadProgressFromStorage(
  storage?: Pick<Storage, 'getItem'>,
): PersistentProgress {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return createDefaultProgress(0);
    const legacyRaw = store.getItem(LEGACY_BEST_GOLD_STORAGE_KEY);
    const legacyBest = legacyRaw ? nonNegInt(Number(legacyRaw)) : 0;
    const raw = store.getItem(PROGRESS_STORAGE_KEY);
    return parseStoredProgress(raw, legacyBest);
  } catch {
    return createDefaultProgress(0);
  }
}

export function saveProgressToStorage(
  progress: PersistentProgress,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return;
    store.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    store.setItem(
      LEGACY_BEST_GOLD_STORAGE_KEY,
      String(nonNegInt(progress.stats.bestGold)),
    );
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}
