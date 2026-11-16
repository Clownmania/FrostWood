import type {
  AchievementCounters,
  AchievementHudEntry,
  AchievementSpec,
} from './types';

export const ACHIEVEMENTS: AchievementSpec[] = [
  {
    id: 'timber_100',
    title: 'First Cord Stacked',
    description: 'Collect 100 Timber across your expeditions.',
    category: 'gathering',
    rarity: 'common',
    counterKey: 'woodCollected',
    target: 100,
    iconKey: 'wood',
  },
  {
    id: 'timber_1000',
    title: 'Timber Baron',
    description: 'Collect 1,000 Timber for the Frostwood settlement.',
    category: 'gathering',
    rarity: 'rare',
    counterKey: 'woodCollected',
    target: 1000,
    iconKey: 'wood',
  },
  {
    id: 'trees_50',
    title: 'Clearcut Foreman',
    description: 'Fell 50 wild pine, spruce, or elder trees.',
    category: 'gathering',
    rarity: 'uncommon',
    counterKey: 'treesFelled',
    target: 50,
    iconKey: 'axe',
  },
  {
    id: 'trees_250',
    title: 'Boreal Lumber Legend',
    description: 'Fell 250 trees across the valley and highlands.',
    category: 'gathering',
    rarity: 'epic',
    counterKey: 'treesFelled',
    target: 250,
    iconKey: 'axe',
  },
  {
    id: 'hunt_10',
    title: 'Winter Marksman',
    description: 'Hunt 10 wild animals across Frostwood.',
    category: 'hunting',
    rarity: 'common',
    counterKey: 'animalsHunted',
    target: 10,
    iconKey: 'bow',
  },
  {
    id: 'hunt_50',
    title: 'Master Tracker',
    description: 'Hunt 50 animals in the frozen wilds.',
    category: 'hunting',
    rarity: 'rare',
    counterKey: 'animalsHunted',
    target: 50,
    iconKey: 'bow',
  },
  {
    id: 'wolves_15',
    title: 'Packbreaker',
    description: 'Slay 15 Timber Wolves or apex predators.',
    category: 'hunting',
    rarity: 'uncommon',
    counterKey: 'wolvesSlain',
    target: 15,
    iconKey: 'skull',
  },
  {
    id: 'bestiary_all',
    title: 'Arctic Naturalist',
    description: 'Discover all 11 wildlife species in the Field Bestiary.',
    category: 'hunting',
    rarity: 'epic',
    counterKey: 'maxSpeciesDiscovered',
    target: 11,
    iconKey: 'book',
  },
  {
    id: 'gold_500',
    title: 'Merchant Coin',
    description: 'Earn 500 total Gold from trade, hunts, and camp.',
    category: 'economy',
    rarity: 'common',
    counterKey: 'goldEarned',
    target: 500,
    iconKey: 'gold',
  },
  {
    id: 'gold_5000',
    title: 'Frostwood Magnate',
    description: 'Earn 5,000 total Gold across your frontier career.',
    category: 'economy',
    rarity: 'epic',
    counterKey: 'goldEarned',
    target: 5000,
    iconKey: 'gold',
  },
  {
    id: 'daily_quests_5',
    title: 'Flame Initiate',
    description: 'Complete 5 Daily Trials for Valkyra Emberwing.',
    category: 'economy',
    rarity: 'uncommon',
    counterKey: 'dailyQuestsCompleted',
    target: 5,
    iconKey: 'flame',
  },
  {
    id: 'wings_unlocked',
    title: 'Heir of Emberwing',
    description: 'Unlock the mythic Wings of Fire through 30 Daily Trials.',
    category: 'economy',
    rarity: 'mythic',
    counterKey: 'wingsUnlocked',
    target: 1,
    iconKey: 'flame',
  },
  {
    id: 'base_organized',
    title: 'Frontier Architect',
    description: 'Construct 4 distinct support buildings in your Base.',
    category: 'crafting',
    rarity: 'uncommon',
    counterKey: 'maxBuildingsBuilt',
    target: 4,
    iconKey: 'hammer',
  },
  {
    id: 'cabin_5',
    title: 'Winter Sovereign',
    description: 'Upgrade your Homestead Cabin to Tier 5 (Grand Winter Lodge).',
    category: 'crafting',
    rarity: 'epic',
    counterKey: 'maxCabinTier',
    target: 5,
    iconKey: 'hammer',
  },
  {
    id: 'craft_10',
    title: 'Artisan Tinkering',
    description: 'Craft 10 tools, traps, parts, or tonics at the Station.',
    category: 'crafting',
    rarity: 'uncommon',
    counterKey: 'itemsCrafted',
    target: 10,
    iconKey: 'gear',
  },
  {
    id: 'gear_set_4',
    title: 'Glacial Sentinel',
    description: 'Reach full Gear Set Tier 4+ across all equipment slots.',
    category: 'crafting',
    rarity: 'rare',
    counterKey: 'maxGearSetTier',
    target: 4,
    iconKey: 'shield',
  },
  {
    id: 'chests_5',
    title: 'Relic Seeker',
    description: 'Discover and open 5 Secret Loot Chests in the wild.',
    category: 'exploration',
    rarity: 'rare',
    counterKey: 'chestsOpened',
    target: 5,
    iconKey: 'sparkles',
  },
  {
    id: 'rivals_3',
    title: 'Bounty Defender',
    description: 'Drive off or defeat 3 Rival Hunters.',
    category: 'exploration',
    rarity: 'rare',
    counterKey: 'rivalsDefeated',
    target: 3,
    iconKey: 'crosshair',
  },
  {
    id: 'pet_first',
    title: 'Kindred Spirit',
    description: 'Tame your first wild pet companion by calm approach or feeding.',
    category: 'pets',
    rarity: 'common',
    counterKey: 'petsTamed',
    target: 1,
    iconKey: 'heart',
  },
  {
    id: 'pet_sanctuary',
    title: 'Sanctuary Keeper',
    description: 'Tame 3 companions and bond at your Base Taming Pen.',
    category: 'pets',
    rarity: 'epic',
    counterKey: 'petsTamed',
    target: 3,
    iconKey: 'heart',
  },
];

function nonNegInt(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function createDefaultAchievementCounters(): AchievementCounters {
  return {
    woodCollected: 0,
    treesFelled: 0,
    animalsHunted: 0,
    wolvesSlain: 0,
    goldEarned: 0,
    itemsCrafted: 0,
    chestsOpened: 0,
    rivalsDefeated: 0,
    dailyQuestsCompleted: 0,
    petsTamed: 0,
    maxDaysSurvived: 1,
    maxCabinTier: 1,
    maxBuildingsBuilt: 0,
    maxGearSetTier: 1,
    maxSpeciesDiscovered: 0,
    wingsUnlocked: 0,
  };
}

export function cloneAchievementCounters(
  c: AchievementCounters,
): AchievementCounters {
  return { ...c };
}

export function sanitizeAchievementCounters(
  raw: unknown,
): AchievementCounters {
  const base = createDefaultAchievementCounters();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  return {
    woodCollected: nonNegInt(obj.woodCollected),
    treesFelled: nonNegInt(obj.treesFelled),
    animalsHunted: nonNegInt(obj.animalsHunted),
    wolvesSlain: nonNegInt(obj.wolvesSlain),
    goldEarned: nonNegInt(obj.goldEarned),
    itemsCrafted: nonNegInt(obj.itemsCrafted),
    chestsOpened: nonNegInt(obj.chestsOpened),
    rivalsDefeated: nonNegInt(obj.rivalsDefeated),
    dailyQuestsCompleted: nonNegInt(obj.dailyQuestsCompleted),
    petsTamed: nonNegInt(obj.petsTamed),
    maxDaysSurvived: Math.max(1, nonNegInt(obj.maxDaysSurvived) || 1),
    maxCabinTier: Math.max(1, nonNegInt(obj.maxCabinTier) || 1),
    maxBuildingsBuilt: nonNegInt(obj.maxBuildingsBuilt),
    maxGearSetTier: Math.max(1, nonNegInt(obj.maxGearSetTier) || 1),
    maxSpeciesDiscovered: nonNegInt(obj.maxSpeciesDiscovered),
    wingsUnlocked: nonNegInt(obj.wingsUnlocked),
  };
}

export function sanitizeUnlockedAchievementIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && validIds.has(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

export function evaluateAchievements(
  counters: AchievementCounters,
  alreadyUnlocked: string[],
): {
  unlockedIds: string[];
  newlyUnlocked: AchievementSpec[];
  entries: AchievementHudEntry[];
} {
  const unlockedSet = new Set(sanitizeUnlockedAchievementIds(alreadyUnlocked));
  const newlyUnlocked: AchievementSpec[] = [];
  const entries: AchievementHudEntry[] = [];

  for (const spec of ACHIEVEMENTS) {
    const rawVal = counters[spec.counterKey] ?? 0;
    const clampedProgress = Math.min(spec.target, Math.max(0, Math.floor(rawVal)));
    const wasUnlocked = unlockedSet.has(spec.id);
    const nowUnlocked = wasUnlocked || rawVal >= spec.target;
    if (nowUnlocked && !wasUnlocked) {
      unlockedSet.add(spec.id);
      newlyUnlocked.push(spec);
    }
    entries.push({
      id: spec.id,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      rarity: spec.rarity,
      iconKey: spec.iconKey,
      progress: nowUnlocked ? spec.target : clampedProgress,
      target: spec.target,
      unlocked: nowUnlocked,
    });
  }

  return {
    unlockedIds: Array.from(unlockedSet),
    newlyUnlocked,
    entries,
  };
}
