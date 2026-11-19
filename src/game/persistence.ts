import {
  cloneAchievementCounters,
  createDefaultAchievementCounters,
  sanitizeAchievementCounters,
  sanitizeUnlockedAchievementIds,
} from './achievements';
import { createEmptyBestiary, sanitizeBestiary, cloneBestiary } from './bestiary';
import {
  sanitizeEquippedAscension,
  sanitizeMythicAscensionList,
  sanitizeRareMaterials,
} from './mystery';
import {
  cloneSkillsState,
  createInitialSkillsState,
  sanitizeSkillsState,
} from './skills';
import type {
  ActiveCraftBuffs,
  ActiveTool,
  BackpackInventoryMap,
  BestiaryMap,
  CraftItemId,
  DailyLoginRewardSpec,
  DailyLoginState,
  GearLevels,
  HallOfFameEntry,
  PersistentProgress,
  PlayerLifetimeStats,
  PlayerSkillsState,
  ResourceCounts,
  RunStats,
  SavedGameSlot,
  SaveSlotId,
  SaveSlotsMap,
  TamedPetRecord,
  UpgradeLevels,
  WeatherKind,
  ZoneId,
} from './types';

export const PROGRESS_STORAGE_KEY = 'frostwood_progress_v1';
export const LEGACY_BEST_GOLD_STORAGE_KEY = 'frostwood_best_gold_v1';
export const SAVE_SLOTS_STORAGE_KEY = 'frostwood_save_slots_v1';
export const MAX_HALL_OF_FAME_ENTRIES = 10;

export const SAVE_SLOT_IDS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];

export const DAILY_LOGIN_REWARDS: DailyLoginRewardSpec[] = [
  {
    day: 1,
    title: 'Kindling & Poultice Cache',
    subtitle: 'Day 1 Welcome Cache',
    rarity: 'common',
    resources: { wood: 25, stone: 10, meat: 3, gold: 40 },
    craftItems: { fire_starter: 1, alpine_poultice: 1 },
  },
  {
    day: 2,
    title: 'Trapper’s Quarry Bundle',
    subtitle: 'Day 2 Frontier Supply',
    rarity: 'uncommon',
    resources: { wood: 35, stone: 20, pelts: 3, gold: 65 },
    craftItems: { snare_trap: 2, flint_quiver: 1 },
  },
  {
    day: 3,
    title: 'Glacier Forge Shipment',
    subtitle: 'Day 3 Rare Alloy Crate',
    rarity: 'rare',
    resources: { wood: 45, stone: 30, ice: 15, gold: 95 },
    craftItems: { clockwork_gear: 1, frost_whetstone: 1 },
  },
  {
    day: 4,
    title: 'Beastmaster’s Outfitter Pack',
    subtitle: 'Day 4 Expedition Provision',
    rarity: 'rare',
    resources: { wood: 55, stone: 35, pelts: 5, meat: 6, gold: 130 },
    craftItems: { insulated_boots: 1, frost_trap: 1, alpine_poultice: 1 },
  },
  {
    day: 5,
    title: 'Runesmith’s Tempered Chest',
    subtitle: 'Day 5 Masterwork Materials',
    rarity: 'epic',
    resources: { wood: 70, stone: 50, ice: 25, pelts: 6, gold: 175 },
    craftItems: { hammer_temper: 1, utility_toolkit: 1, clockwork_gear: 1 },
  },
  {
    day: 6,
    title: 'Mammoth Vanguard Vault',
    subtitle: 'Day 6 High-Altitude Cache',
    rarity: 'epic',
    resources: { wood: 90, stone: 65, ice: 40, pelts: 8, meat: 8, gold: 230 },
    craftItems: { mammoth_tonic: 1, frost_whetstone: 1, hammer_temper: 1 },
  },
  {
    day: 7,
    title: 'Aurora Sovereign Reliquary',
    subtitle: 'Day 7 Weekly Jackpot Chest',
    rarity: 'mythic',
    resources: { wood: 125, stone: 90, ice: 60, pelts: 12, meat: 12, gold: 350 },
    craftItems: { aurora_charm: 1, mammoth_tonic: 1, clockwork_gear: 2, hammer_temper: 1 },
  },
];

function nonNegInt(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function getTodayDateKey(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKeyToUtcMs(dateKey: string | null | undefined): number | null {
  if (!dateKey || typeof dateKey !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const ms = Date.UTC(year, month, day);
  return Number.isFinite(ms) ? ms : null;
}

function diffCalendarDays(fromKey: string | null | undefined, toKey: string): number | null {
  const fromMs = parseDateKeyToUtcMs(fromKey);
  const toMs = parseDateKeyToUtcMs(toKey);
  if (fromMs === null || toMs === null) return null;
  return Math.round((toMs - fromMs) / 86_400_000);
}

export function evaluateDailyLoginState(
  progress: PersistentProgress,
  todayDateKey: string = getTodayDateKey(),
): DailyLoginState {
  const rawLogin = progress.dailyLogin;
  const storedStreak = Math.max(1, Math.min(7, nonNegInt(rawLogin?.streakDay) || 1)) as
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7;
  const lastKey =
    typeof rawLogin?.lastClaimedDateKey === 'string' && rawLogin.lastClaimedDateKey
      ? rawLogin.lastClaimedDateKey
      : null;
  const totalDaysClaimed = nonNegInt(rawLogin?.totalDaysClaimed);

  if (!lastKey) {
    const streakDay: 1 = 1;
    return {
      streakDay,
      canClaimToday: true,
      claimedToday: false,
      lastClaimedDateKey: null,
      totalDaysClaimed,
      todayReward: DAILY_LOGIN_REWARDS[0],
      schedule: DAILY_LOGIN_REWARDS,
    };
  }

  const dayDiff = diffCalendarDays(lastKey, todayDateKey);
  if (dayDiff === 0) {
    // Already claimed today
    return {
      streakDay: storedStreak,
      canClaimToday: false,
      claimedToday: true,
      lastClaimedDateKey: lastKey,
      totalDaysClaimed,
      todayReward: DAILY_LOGIN_REWARDS[storedStreak - 1],
      schedule: DAILY_LOGIN_REWARDS,
    };
  }

  let nextStreakDay: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1;
  if (dayDiff === 1) {
    nextStreakDay = (((storedStreak % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7);
  } else {
    nextStreakDay = 1;
  }

  return {
    streakDay: nextStreakDay,
    canClaimToday: true,
    claimedToday: false,
    lastClaimedDateKey: lastKey,
    totalDaysClaimed,
    todayReward: DAILY_LOGIN_REWARDS[nextStreakDay - 1],
    schedule: DAILY_LOGIN_REWARDS,
  };
}

export function claimDailyLoginRewardInProgress(
  progress: PersistentProgress,
  todayDateKey: string = getTodayDateKey(),
): {
  progress: PersistentProgress;
  state: DailyLoginState;
  claimedReward: DailyLoginRewardSpec | null;
} {
  const evalState = evaluateDailyLoginState(progress, todayDateKey);
  if (!evalState.canClaimToday) {
    return {
      progress,
      state: evalState,
      claimedReward: null,
    };
  }

  const nextProgress: PersistentProgress = {
    ...progress,
    dailyLogin: {
      streakDay: evalState.streakDay,
      lastClaimedDateKey: todayDateKey,
      totalDaysClaimed: evalState.totalDaysClaimed + 1,
    },
  };

  const nextState = evaluateDailyLoginState(nextProgress, todayDateKey);
  return {
    progress: nextProgress,
    state: nextState,
    claimedReward: evalState.todayReward,
  };
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
    dailyLogin: {
      streakDay: 1,
      lastClaimedDateKey: null,
      totalDaysClaimed: 0,
    },
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

function sanitizeDailyLogin(raw: unknown): {
  streakDay: number;
  lastClaimedDateKey: string | null;
  totalDaysClaimed: number;
} {
  if (!raw || typeof raw !== 'object') {
    return { streakDay: 1, lastClaimedDateKey: null, totalDaysClaimed: 0 };
  }
  const obj = raw as Record<string, unknown>;
  const streakDay = Math.max(1, Math.min(7, nonNegInt(obj.streakDay) || 1));
  const lastClaimedDateKey =
    typeof obj.lastClaimedDateKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.lastClaimedDateKey)
      ? obj.lastClaimedDateKey
      : null;
  const totalDaysClaimed = nonNegInt(obj.totalDaysClaimed);
  return { streakDay, lastClaimedDateKey, totalDaysClaimed };
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
      dailyLogin: sanitizeDailyLogin(parsed.dailyLogin),
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
      dailyLogin: sanitizeDailyLogin(current.dailyLogin),
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

// ============================================================================
// Save Game & Load Game Multi-Slot System
// ============================================================================

export function createEmptySaveSlots(): SaveSlotsMap {
  return {
    autosave: null,
    slot1: null,
    slot2: null,
    slot3: null,
  };
}

const VALID_ZONES: ZoneId[] = ['level1', 'level2', 'level3', 'level4', 'level5', 'city'];
const VALID_WEATHERS: WeatherKind[] = ['clear', 'light_snow', 'blizzard'];
const VALID_TOOLS: ActiveTool[] = ['axe', 'bow'];

export function sanitizeSavedGameSlot(
  raw: unknown,
  expectedSlotId: SaveSlotId,
): SavedGameSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const zone = VALID_ZONES.includes(obj.zone as ZoneId)
    ? (obj.zone as ZoneId)
    : 'level1';
  const weather = VALID_WEATHERS.includes(obj.weather as WeatherKind)
    ? (obj.weather as WeatherKind)
    : 'clear';
  const activeTool = VALID_TOOLS.includes(obj.activeTool as ActiveTool)
    ? (obj.activeTool as ActiveTool)
    : 'axe';

  const rawRes =
    obj.resources && typeof obj.resources === 'object'
      ? (obj.resources as Record<string, unknown>)
      : {};
  const resources: ResourceCounts = {
    wood: nonNegInt(rawRes.wood),
    stone: nonNegInt(rawRes.stone),
    ice: nonNegInt(rawRes.ice),
    pelts: nonNegInt(rawRes.pelts),
    meat: nonNegInt(rawRes.meat),
    gold: nonNegInt(rawRes.gold),
  };

  const rawLevels =
    obj.levels && typeof obj.levels === 'object'
      ? (obj.levels as Record<string, unknown>)
      : {};
  const levels: UpgradeLevels = {
    axe: Math.max(1, Math.min(7, nonNegInt(rawLevels.axe) || 1)),
    bow: Math.max(1, Math.min(7, nonNegInt(rawLevels.bow) || 1)),
    coat: Math.max(1, Math.min(4, nonNegInt(rawLevels.coat) || 1)),
    cabin: Math.max(1, Math.min(5, nonNegInt(rawLevels.cabin) || 1)),
    lumberCamp: Math.max(0, Math.min(4, nonNegInt(rawLevels.lumberCamp))),
    sawmill: Math.max(0, Math.min(4, nonNegInt(rawLevels.sawmill))),
    tannery: Math.max(0, Math.min(4, nonNegInt(rawLevels.tannery))),
    forge: Math.max(0, Math.min(4, nonNegInt(rawLevels.forge))),
    tamingPen: Math.max(0, Math.min(3, nonNegInt(rawLevels.tamingPen))),
    stormShelter: Math.max(0, Math.min(3, nonNegInt(rawLevels.stormShelter))),
    windbreak: Math.max(0, Math.min(3, nonNegInt(rawLevels.windbreak))),
    thermalConduit: Math.max(0, Math.min(3, nonNegInt(rawLevels.thermalConduit))),
    watchtower: Math.max(0, Math.min(3, nonNegInt(rawLevels.watchtower))),
    grandGranary: Math.max(0, Math.min(3, nonNegInt(rawLevels.grandGranary))),
    festivalPavilion: Math.max(0, Math.min(2, nonNegInt(rawLevels.festivalPavilion))),
    iceMonument: Math.max(0, Math.min(2, nonNegInt(rawLevels.iceMonument))),
  };

  const sanitizeGearObj = (g: unknown): GearLevels => {
    const rec = g && typeof g === 'object' ? (g as Record<string, unknown>) : {};
    return {
      coat: Math.max(1, Math.min(5, nonNegInt(rec.coat) || 1)),
      boots: Math.max(1, Math.min(5, nonNegInt(rec.boots) || 1)),
      gloves: Math.max(1, Math.min(5, nonNegInt(rec.gloves) || 1)),
      pack: Math.max(1, Math.min(5, nonNegInt(rec.pack) || 1)),
    };
  };

  const gear = sanitizeGearObj(obj.gear);
  const unlockedGear = sanitizeGearObj(obj.unlockedGear);
  (Object.keys(gear) as Array<keyof GearLevels>).forEach((k) => {
    if (unlockedGear[k] < gear[k]) unlockedGear[k] = gear[k];
  });

  const rawBackpack =
    obj.backpackInventory && typeof obj.backpackInventory === 'object'
      ? (obj.backpackInventory as Record<string, unknown>)
      : {};
  const backpackInventory: BackpackInventoryMap = {
    clockwork_gear: nonNegInt(rawBackpack.clockwork_gear),
    hammer_temper: nonNegInt(rawBackpack.hammer_temper),
    utility_toolkit: nonNegInt(rawBackpack.utility_toolkit),
    snare_trap: nonNegInt(rawBackpack.snare_trap),
    frost_trap: nonNegInt(rawBackpack.frost_trap),
    fire_starter: nonNegInt(rawBackpack.fire_starter),
    insulated_boots: nonNegInt(rawBackpack.insulated_boots),
    flint_quiver: nonNegInt(rawBackpack.flint_quiver),
    alpine_poultice: nonNegInt(rawBackpack.alpine_poultice),
    frost_whetstone: nonNegInt(rawBackpack.frost_whetstone),
    mammoth_tonic: nonNegInt(rawBackpack.mammoth_tonic),
    aurora_charm: nonNegInt(rawBackpack.aurora_charm),
  };

  const rawBuffs =
    obj.activeBuffs && typeof obj.activeBuffs === 'object'
      ? (obj.activeBuffs as Record<string, unknown>)
      : {};
  const numOrZero = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
  const activeBuffs: ActiveCraftBuffs = {
    fireStarter: numOrZero(rawBuffs.fireStarter),
    insulatedBoots: numOrZero(rawBuffs.insulatedBoots),
    flintEdge: numOrZero(rawBuffs.flintEdge),
    frostWhetstone: numOrZero(rawBuffs.frostWhetstone),
    auroraCharm: numOrZero(rawBuffs.auroraCharm),
    hammerTemper: numOrZero(rawBuffs.hammerTemper),
    utilityToolkit: numOrZero(rawBuffs.utilityToolkit),
  };

  const rawStats =
    obj.stats && typeof obj.stats === 'object'
      ? (obj.stats as Record<string, unknown>)
      : {};
  const stats: RunStats = {
    woodHarvested: nonNegInt(rawStats.woodHarvested),
    peltsCollected: nonNegInt(rawStats.peltsCollected),
    goldEarned: nonNegInt(rawStats.goldEarned),
    treesFelled: nonNegInt(rawStats.treesFelled),
    animalsHunted: nonNegInt(rawStats.animalsHunted),
    wolvesSlain: nonNegInt(rawStats.wolvesSlain),
    completedObjectives: nonNegInt(rawStats.completedObjectives),
    elapsedSeconds: nonNegInt(rawStats.elapsedSeconds),
    bossesSlain: nonNegInt(rawStats.bossesSlain),
  };

  const rawPets = Array.isArray(obj.tamedPets) ? obj.tamedPets : [];
  const tamedPets: TamedPetRecord[] = rawPets
    .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
    .map((p, idx) => ({
      uid: typeof p.uid === 'string' && p.uid ? p.uid : `pet-${idx}`,
      speciesId: (typeof p.speciesId === 'string' ? p.speciesId : 'arctic_fox') as TamedPetRecord['speciesId'],
      name: typeof p.name === 'string' && p.name ? p.name : 'Companion',
      rarity: (typeof p.rarity === 'string' ? p.rarity : 'common') as TamedPetRecord['rarity'],
      tamedVia: p.tamedVia === 'feeding' ? 'feeding' : 'passive',
      affection: Math.max(0, Math.min(100, nonNegInt(p.affection) || 50)),
      inPen: Boolean(p.inPen),
    }));

  const activePetUid =
    typeof obj.activePetUid === 'string' &&
    tamedPets.some((p) => p.uid === obj.activePetUid)
      ? obj.activePetUid
      : null;

  const coord = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0;

    const unlockedAscensions = sanitizeMythicAscensionList(obj.unlockedAscensions);
    const equippedAscension = sanitizeEquippedAscension(
      obj.equippedAscension,
      unlockedAscensions,
    );
    const rareMaterials = sanitizeRareMaterials(obj.rareMaterials);

  return {
    slotId: expectedSlotId,
    label:
      typeof obj.label === 'string' && obj.label
        ? obj.label
        : expectedSlotId === 'autosave'
          ? 'Auto-Save'
          : `Save Slot ${expectedSlotId.replace('slot', '')}`,
    savedAt:
      typeof obj.savedAt === 'string' && obj.savedAt
        ? obj.savedAt
        : new Date().toISOString(),
    zone,
    zoneName:
      typeof obj.zoneName === 'string' && obj.zoneName ? obj.zoneName : 'Frostwood Valley',
    cabinTier: Math.max(1, Math.min(5, nonNegInt(obj.cabinTier) || levels.cabin)),
    dayNumber: Math.max(1, nonNegInt(obj.dayNumber) || 1),
    timeOfDay:
      typeof obj.timeOfDay === 'number' && Number.isFinite(obj.timeOfDay)
        ? Math.max(0, Math.min(1, obj.timeOfDay))
        : 0.25,
    weather,
    weatherTimer: Math.max(5, numOrZero(obj.weatherTimer) || 35),
    endlessMode: Boolean(obj.endlessMode),
    victory: Boolean(obj.victory),
    playerX: coord(obj.playerX),
    playerZ: coord(obj.playerZ),
    playerYaw: coord(obj.playerYaw),
    hp: Math.max(1, nonNegInt(obj.hp) || 100),
    maxHp: Math.max(100, nonNegInt(obj.maxHp) || 100),
    warmth: Math.max(1, nonNegInt(obj.warmth) || 100),
    maxWarmth: Math.max(100, nonNegInt(obj.maxWarmth) || 100),
    activeTool,
    resources,
    levels,
    gear,
    unlockedGear,
    wingsTier: Math.max(0, Math.min(3, nonNegInt(obj.wingsTier))),
    wingsEquipped: Boolean(obj.wingsEquipped),
    backpackInventory,
    activeBuffs,
    stats,
    tamedPets,
    activePetUid,
    rareMaterials,
    unlockedAscensions,
    equippedAscension,
  };
}

export function parseSaveSlots(raw: string | null): SaveSlotsMap {
  const empty = createEmptySaveSlots();
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return empty;
    for (const slotId of SAVE_SLOT_IDS) {
      empty[slotId] = sanitizeSavedGameSlot(parsed[slotId], slotId);
    }
    return empty;
  } catch {
    return empty;
  }
}

export function loadSaveSlotsFromStorage(
  storage?: Pick<Storage, 'getItem'>,
): SaveSlotsMap {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return createEmptySaveSlots();
    return parseSaveSlots(store.getItem(SAVE_SLOTS_STORAGE_KEY));
  } catch {
    return createEmptySaveSlots();
  }
}

export function saveSlotToStorage(
  slotId: SaveSlotId,
  slotData: SavedGameSlot,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): SaveSlotsMap {
  const current = loadSaveSlotsFromStorage(storage);
  const sanitized = sanitizeSavedGameSlot(slotData, slotId);
  const next: SaveSlotsMap = {
    ...current,
    [slotId]: sanitized,
  };
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (store) {
      store.setItem(SAVE_SLOTS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

export function deleteSaveSlotFromStorage(
  slotId: SaveSlotId,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): SaveSlotsMap {
  const current = loadSaveSlotsFromStorage(storage);
  const next: SaveSlotsMap = {
    ...current,
    [slotId]: null,
  };
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (store) {
      store.setItem(SAVE_SLOTS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

