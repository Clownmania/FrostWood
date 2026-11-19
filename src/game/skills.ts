import type {
  ActiveSkillPerkPulse,
  AnimalRarity,
  PlayerSkillsState,
  ResourceCounts,
  SkillBonuses,
  SkillBranch,
  SkillGatheringResource,
  SkillPerkId,
  SkillPerkSpec,
  TreeKind,
} from './types';

export const BASE_BACKPACK_CAPACITY = 250;
export const CABIN_STORAGE_PER_TIER = 50;
export const MAX_SKILL_LEVEL = 25;

export const SKILL_PERK_ORDER: SkillPerkId[] = [
  'pack_capacity',
  'move_speed',
  'gather_yield',
  'hunt_damage',
  'pelt_yield',
  'cold_resist',
];

export const SKILL_PERKS: Record<SkillPerkId, SkillPerkSpec> = {
  pack_capacity: {
    id: 'pack_capacity',
    branch: 'gathering',
    name: 'Expedition Pack',
    tagline: 'Backpack Storage & Loot Magnet',
    maxRank: 3,
    rankSummaries: [
      '+35 Backpack Capacity',
      '+85 Backpack Capacity & +0.8m Loot Magnet',
      '+160 Backpack Capacity & +2.0m Loot Magnet',
    ],
    description:
      'Reinforced sled-frame rucksack expands carried wood, stone & pelt capacity between camp runs.',
  },
  move_speed: {
    id: 'move_speed',
    branch: 'gathering',
    name: 'Swift Stride',
    tagline: 'Permanent Snow Mobility',
    maxRank: 3,
    rankSummaries: [
      '+8% Movement Speed',
      '+16% Movement Speed & +10% Creep Speed',
      '+25% Movement Speed & +20% Creep Speed',
    ],
    description:
      'Lightweight snowshoe bindings let you traverse deep drifts and haul cargo faster.',
  },
  gather_yield: {
    id: 'gather_yield',
    branch: 'gathering',
    name: 'Boreal Harvester',
    tagline: 'Harvest Yield & Axe Cleave',
    maxRank: 3,
    rankSummaries: [
      '+15% Wood/Stone/Ice Yield · +12% Axe Power',
      '+30% Wood/Stone/Ice Yield · +25% Axe Power',
      '+50% Wood/Stone/Ice Yield · +40% Axe Power',
    ],
    description:
      'Clean felling technique extracts more timber, stone, and frost shards from every node.',
  },
  hunt_damage: {
    id: 'hunt_damage',
    branch: 'hunting',
    name: 'Deadeye Fletcher',
    tagline: 'Bow Power & Ambush Precision',
    maxRank: 3,
    rankSummaries: [
      '+15% Bow & Hunting Damage · +15% Ambush Bonus',
      '+30% Bow & Hunting Damage · +30% Ambush Bonus',
      '+50% Bow & Hunting Damage · +45% Ambush · +15% Arrow Velocity',
    ],
    description:
      'Tuned draw weight and vital-shot tracking punish unaware Arctic wildlife.',
  },
  pelt_yield: {
    id: 'pelt_yield',
    branch: 'hunting',
    name: 'Master Skinner',
    tagline: 'Pelt Yield & Furrier Value',
    maxRank: 3,
    rankSummaries: [
      '+20% Pelt Drops · +10% Pelt Trade Gold',
      '+45% Pelt Drops · +22% Pelt Trade Gold',
      '+75% Pelt Drops · +35% Pelt Trade Gold',
    ],
    description:
      'Preserve pristine winter pelts from every hunt and command top gold at the trading rack.',
  },
  cold_resist: {
    id: 'cold_resist',
    branch: 'hunting',
    name: 'Arctic Endurance',
    tagline: 'Vitality & Frost Resistance',
    maxRank: 3,
    rankSummaries: [
      '+15 Max HP · -14% Cold Decay',
      '+35 Max HP · -26% Cold Decay',
      '+60 Max HP · -38% Cold Decay · +15% Campfire Recovery',
    ],
    description:
      'Hardened frostblood stamina keeps warmth longer during blizzards and night hunts.',
  },
};

export const SKILL_RANK_COSTS = [1, 2, 3] as const;
export const SKILL_RANK_MIN_LEVEL = [1, 4, 8] as const;

export function getSkillPerkUpgradeCost(currentRank: number): number {
  if (currentRank < 0 || currentRank >= SKILL_RANK_COSTS.length) return 0;
  return SKILL_RANK_COSTS[currentRank];
}

export function getSkillPerkRequiredLevel(currentRank: number): number {
  if (currentRank < 0 || currentRank >= SKILL_RANK_MIN_LEVEL.length) return MAX_SKILL_LEVEL;
  return SKILL_RANK_MIN_LEVEL[currentRank];
}

export function getCumulativeRankCost(rank: number): number {
  let sum = 0;
  for (let i = 0; i < Math.min(rank, SKILL_RANK_COSTS.length); i++) {
    sum += SKILL_RANK_COSTS[i];
  }
  return sum;
}

export function xpRequiredForSkillLevel(level: number): number {
  const safeLvl = Math.max(1, Math.floor(level));
  if (safeLvl >= MAX_SKILL_LEVEL) return 0;
  return Math.round(135 + (safeLvl - 1) * 90 + Math.pow(safeLvl - 1, 1.75) * 32);
}

export function createInitialSkillsState(): PlayerSkillsState {
  return {
    gatheringXp: 0,
    gatheringLevel: 1,
    gatheringPoints: 0,
    huntingXp: 0,
    huntingLevel: 1,
    huntingPoints: 0,
    ranks: {
      pack_capacity: 0,
      move_speed: 0,
      gather_yield: 0,
      hunt_damage: 0,
      pelt_yield: 0,
      cold_resist: 0,
    },
  };
}

export function cloneSkillsState(skills: PlayerSkillsState): PlayerSkillsState {
  return {
    gatheringXp: skills.gatheringXp,
    gatheringLevel: skills.gatheringLevel,
    gatheringPoints: skills.gatheringPoints,
    huntingXp: skills.huntingXp,
    huntingLevel: skills.huntingLevel,
    huntingPoints: skills.huntingPoints,
    ranks: { ...skills.ranks },
  };
}

function clampInt(val: unknown, min: number, max: number): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function sanitizeSkillsState(raw: unknown): PlayerSkillsState {
  const def = createInitialSkillsState();
  if (!raw || typeof raw !== 'object') return def;
  const obj = raw as Record<string, unknown>;
  const rawRanks =
    obj.ranks && typeof obj.ranks === 'object'
      ? (obj.ranks as Record<string, unknown>)
      : {};

  const ranks = { ...def.ranks };
  for (const id of SKILL_PERK_ORDER) {
    ranks[id] = clampInt(rawRanks[id], 0, SKILL_PERKS[id].maxRank);
  }

  const gatheringLevel = clampInt(obj.gatheringLevel, 1, MAX_SKILL_LEVEL);
  const huntingLevel = clampInt(obj.huntingLevel, 1, MAX_SKILL_LEVEL);
  const gatherReq = xpRequiredForSkillLevel(gatheringLevel);
  const huntReq = xpRequiredForSkillLevel(huntingLevel);

  return {
    gatheringLevel,
    gatheringXp:
      gatherReq > 0 ? clampInt(obj.gatheringXp, 0, Math.max(0, gatherReq - 1)) : 0,
    gatheringPoints: clampInt(obj.gatheringPoints, 0, MAX_SKILL_LEVEL * 2),
    huntingLevel,
    huntingXp: huntReq > 0 ? clampInt(obj.huntingXp, 0, Math.max(0, huntReq - 1)) : 0,
    huntingPoints: clampInt(obj.huntingPoints, 0, MAX_SKILL_LEVEL * 2),
    ranks,
  };
}

export function grantSkillXp(
  skills: PlayerSkillsState,
  branch: SkillBranch,
  amount: number,
): {
  skills: PlayerSkillsState;
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
} {
  const safeAmount = Math.max(0, Math.round(amount));
  const next = cloneSkillsState(skills);
  if (safeAmount <= 0) {
    const currentLvl = branch === 'gathering' ? next.gatheringLevel : next.huntingLevel;
    return { skills: next, leveledUp: false, newLevel: currentLvl, levelsGained: 0 };
  }

  let level = branch === 'gathering' ? next.gatheringLevel : next.huntingLevel;
  let xp = (branch === 'gathering' ? next.gatheringXp : next.huntingXp) + safeAmount;
  let points = branch === 'gathering' ? next.gatheringPoints : next.huntingPoints;
  let levelsGained = 0;

  while (level < MAX_SKILL_LEVEL) {
    const needed = xpRequiredForSkillLevel(level);
    if (needed <= 0 || xp < needed) break;
    xp -= needed;
    level += 1;
    points += 1;
    levelsGained += 1;
  }

  if (level >= MAX_SKILL_LEVEL) {
    xp = 0;
  }

  if (branch === 'gathering') {
    next.gatheringLevel = level;
    next.gatheringXp = xp;
    next.gatheringPoints = points;
  } else {
    next.huntingLevel = level;
    next.huntingXp = xp;
    next.huntingPoints = points;
  }

  return {
    skills: next,
    leveledUp: levelsGained > 0,
    newLevel: level,
    levelsGained,
  };
}

export function getAvailableBranchPoints(
  skills: PlayerSkillsState,
  branch: SkillBranch,
): number {
  return branch === 'gathering' ? skills.gatheringPoints : skills.huntingPoints;
}

export function getBranchLevel(
  skills: PlayerSkillsState,
  branch: SkillBranch,
): number {
  return branch === 'gathering' ? skills.gatheringLevel : skills.huntingLevel;
}

export function canUnlockSkillPerk(
  skills: PlayerSkillsState,
  perkId: SkillPerkId,
): boolean {
  const spec = SKILL_PERKS[perkId];
  const currentRank = skills.ranks[perkId] ?? 0;
  if (currentRank >= spec.maxRank) return false;
  const cost = getSkillPerkUpgradeCost(currentRank);
  const minLvl = getSkillPerkRequiredLevel(currentRank);
  return (
    getAvailableBranchPoints(skills, spec.branch) >= cost &&
    getBranchLevel(skills, spec.branch) >= minLvl
  );
}

export function unlockSkillPerk(
  skills: PlayerSkillsState,
  perkId: SkillPerkId,
): {
  skills: PlayerSkillsState;
  unlocked: boolean;
  newRank: number;
} {
  if (!canUnlockSkillPerk(skills, perkId)) {
    return {
      skills,
      unlocked: false,
      newRank: skills.ranks[perkId] ?? 0,
    };
  }
  const spec = SKILL_PERKS[perkId];
  const next = cloneSkillsState(skills);
  const currentRank = next.ranks[perkId] ?? 0;
  const cost = getSkillPerkUpgradeCost(currentRank);
  const nextRank = currentRank + 1;
  next.ranks[perkId] = nextRank;
  if (spec.branch === 'gathering') {
    next.gatheringPoints -= cost;
  } else {
    next.huntingPoints -= cost;
  }
  return {
    skills: next,
    unlocked: true,
    newRank: nextRank,
  };
}

export function respecSkillPerks(skills: PlayerSkillsState): {
  skills: PlayerSkillsState;
  refunded: number;
} {
  const next = cloneSkillsState(skills);
  let refunded = 0;
  for (const id of SKILL_PERK_ORDER) {
    const rank = next.ranks[id];
    if (rank > 0) {
      const pointsSpent = getCumulativeRankCost(rank);
      if (SKILL_PERKS[id].branch === 'gathering') {
        next.gatheringPoints += pointsSpent;
      } else {
        next.huntingPoints += pointsSpent;
      }
      next.ranks[id] = 0;
      refunded += pointsSpent;
    }
  }
  return { skills: next, refunded };
}

export function countSpentSkillPoints(skills: PlayerSkillsState): number {
  let total = 0;
  for (const id of SKILL_PERK_ORDER) {
    total += getCumulativeRankCost(skills.ranks[id] ?? 0);
  }
  return total;
}

export function computeSkillBonuses(skills: PlayerSkillsState): SkillBonuses {
  const packRank = skills.ranks.pack_capacity ?? 0;
  const speedRank = skills.ranks.move_speed ?? 0;
  const gatherRank = skills.ranks.gather_yield ?? 0;
  const huntDmgRank = skills.ranks.hunt_damage ?? 0;
  const peltRank = skills.ranks.pelt_yield ?? 0;
  const coldRank = skills.ranks.cold_resist ?? 0;

  const packBonusTable = [0, 35, 85, 160];
  const magnetTable = [0, 0, 0.8, 2.0];
  const moveSpeedTable = [1, 1.08, 1.16, 1.25];
  const creepSpeedTable = [1, 1.04, 1.1, 1.2];
  const gatherYieldTable = [1, 1.15, 1.3, 1.5];
  const axePowerTable = [1, 1.12, 1.25, 1.4];
  const huntDmgTable = [1, 1.15, 1.3, 1.5];
  const ambushTable = [1, 1.15, 1.3, 1.45];
  const arrowSpeedTable = [1, 1, 1.06, 1.15];
  const peltYieldTable = [1, 1.2, 1.45, 1.75];
  const peltValueTable = [1, 1.1, 1.22, 1.35];
  const maxHpTable = [0, 15, 35, 60];
  const coldDecayTable = [1, 0.86, 0.74, 0.62];
  const recoveryTable = [1, 1, 1.06, 1.15];

  return {
    packBonus: packBonusTable[packRank] ?? 160,
    magnetRadiusBonus: magnetTable[packRank] ?? 2.0,
    moveSpeedMult: moveSpeedTable[speedRank] ?? 1.25,
    creepSpeedMult: creepSpeedTable[speedRank] ?? 1.2,
    gatherYieldMult: gatherYieldTable[gatherRank] ?? 1.5,
    axePowerMult: axePowerTable[gatherRank] ?? 1.4,
    huntDamageMult: huntDmgTable[huntDmgRank] ?? 1.5,
    ambushMult: ambushTable[huntDmgRank] ?? 1.45,
    arrowSpeedMult: arrowSpeedTable[huntDmgRank] ?? 1.15,
    peltYieldMult: peltYieldTable[peltRank] ?? 1.75,
    peltValueMult: peltValueTable[peltRank] ?? 1.35,
    maxHpBonus: maxHpTable[coldRank] ?? 60,
    coldDecayMult: coldDecayTable[coldRank] ?? 0.62,
    campfireRecoveryMult: recoveryTable[coldRank] ?? 1.15,
  };
}

export function computeBackpackCapacity(
  skills: PlayerSkillsState,
  cabinLevel = 1,
  gearPackBonus = 0,
): number {
  const bonuses = computeSkillBonuses(skills);
  const cabinStorage = Math.max(0, Math.floor(cabinLevel) - 1) * CABIN_STORAGE_PER_TIER;
  return (
    BASE_BACKPACK_CAPACITY +
    cabinStorage +
    bonuses.packBonus +
    Math.max(0, Math.floor(gearPackBonus))
  );
}

export function computeBackpackUsed(resources: ResourceCounts): number {
  return (
    Math.max(0, Math.floor(resources.wood)) +
    Math.max(0, Math.floor(resources.stone ?? 0)) +
    Math.max(0, Math.floor(resources.pelts))
  );
}

export function clampCargoAddition(
  currentUsed: number,
  capacity: number,
  incomingAmount: number,
): number {
  const space = Math.max(0, capacity - currentUsed);
  return Math.max(0, Math.min(space, Math.floor(incomingAmount)));
}

export function computeGatheringNodeXp(
  node: TreeKind | 'boulder' | 'ice_sculpture',
): number {
  switch (node) {
    case 'void_heartwood':
      return 38;
    case 'pyrewood':
      return 28;
    case 'elder':
      return 20;
    case 'spruce':
      return 14;
    case 'pine':
      return 11;
    case 'boulder':
      return 13;
    case 'ice_sculpture':
      return 18;
  }
}

export function computeHuntingKillXp(rarity: AnimalRarity): number {
  switch (rarity) {
    case 'mythic':
      return 120;
    case 'epic':
      return 72;
    case 'rare':
      return 44;
    case 'uncommon':
      return 24;
    default:
      return 14;
  }
}

export const SKILL_PERK_PULSE_DURATION = 3.2;

export function createInitialSkillPerkPulse(): ActiveSkillPerkPulse {
  return {
    active: false,
    perkId: null,
    perkName: '',
    rank: 0,
    maxRank: 3,
    branch: 'gathering',
    resource: null,
    bonusPct: 0,
    secondaryBonusText: '',
    taskLabel: '',
    timeRemaining: 0,
    duration: SKILL_PERK_PULSE_DURATION,
    pulseNonce: 0,
    activeResources: {},
  };
}

const DEFAULT_TASK_LABELS: Record<SkillGatheringResource, string> = {
  wood: 'Timber Felling',
  stone: 'Granite Quarrying',
  ice: 'Glacial Ice Harvest',
  pelts: 'Arctic Pelt Skinning',
  pack: 'Cargo Pack Hauling',
};

export function triggerSkillPerkGatheringPulse(
  current: ActiveSkillPerkPulse,
  skills: PlayerSkillsState,
  resource: SkillGatheringResource,
  customTaskLabel?: string,
): ActiveSkillPerkPulse {
  const bonuses = computeSkillBonuses(skills);
  const gatherRank = skills.ranks.gather_yield ?? 0;
  const peltRank = skills.ranks.pelt_yield ?? 0;
  const packRank = skills.ranks.pack_capacity ?? 0;
  const huntDmgRank = skills.ranks.hunt_damage ?? 0;

  let perkId: SkillPerkId | null = null;
  let rank = 0;
  let bonusPct = 0;
  let secondaryBonusText = '';

  if (resource === 'wood' || resource === 'stone' || resource === 'ice') {
    if (gatherRank > 0) {
      perkId = 'gather_yield';
      rank = gatherRank;
      bonusPct = Math.round((bonuses.gatherYieldMult - 1) * 100);
      const axeBonusPct = Math.round((bonuses.axePowerMult - 1) * 100);
      secondaryBonusText = `+${axeBonusPct}% Axe Cleave Power`;
    } else if (packRank > 0 && (resource === 'wood' || resource === 'stone')) {
      perkId = 'pack_capacity';
      rank = packRank;
      bonusPct = Math.round((bonuses.packBonus / BASE_BACKPACK_CAPACITY) * 100);
      secondaryBonusText =
        bonuses.magnetRadiusBonus > 0
          ? `+${bonuses.packBonus} Cap · +${bonuses.magnetRadiusBonus}m Magnet`
          : `+${bonuses.packBonus} Pack Capacity`;
    }
  } else if (resource === 'pelts') {
    if (peltRank > 0) {
      perkId = 'pelt_yield';
      rank = peltRank;
      bonusPct = Math.round((bonuses.peltYieldMult - 1) * 100);
      const valPct = Math.round((bonuses.peltValueMult - 1) * 100);
      secondaryBonusText = `+${valPct}% Furrier Trade Gold`;
    } else if (huntDmgRank > 0) {
      perkId = 'hunt_damage';
      rank = huntDmgRank;
      bonusPct = Math.round((bonuses.huntDamageMult - 1) * 100);
      const ambushPct = Math.round((bonuses.ambushMult - 1) * 100);
      secondaryBonusText = `+${ambushPct}% Ambush Precision`;
    }
  } else if (resource === 'pack') {
    if (packRank > 0) {
      perkId = 'pack_capacity';
      rank = packRank;
      bonusPct = Math.round((bonuses.packBonus / BASE_BACKPACK_CAPACITY) * 100);
      secondaryBonusText =
        bonuses.magnetRadiusBonus > 0
          ? `+${bonuses.packBonus} Cap · +${bonuses.magnetRadiusBonus}m Magnet`
          : `+${bonuses.packBonus} Pack Capacity`;
    }
  }

  if (!perkId || rank <= 0) {
    return current;
  }

  const spec = SKILL_PERKS[perkId];
  const nextActiveResources: Partial<Record<SkillGatheringResource, number>> = {
    ...current.activeResources,
    [resource]: SKILL_PERK_PULSE_DURATION,
  };
  if (packRank > 0 && (resource === 'wood' || resource === 'stone' || resource === 'pelts')) {
    nextActiveResources.pack = SKILL_PERK_PULSE_DURATION;
  }

  return {
    active: true,
    perkId,
    perkName: spec.name,
    rank,
    maxRank: spec.maxRank,
    branch: spec.branch,
    resource,
    bonusPct,
    secondaryBonusText,
    taskLabel: customTaskLabel ?? DEFAULT_TASK_LABELS[resource],
    timeRemaining: SKILL_PERK_PULSE_DURATION,
    duration: SKILL_PERK_PULSE_DURATION,
    pulseNonce: current.pulseNonce + 1,
    activeResources: nextActiveResources,
  };
}

export function stepSkillPerkGatheringPulse(
  current: ActiveSkillPerkPulse,
  dt: number,
): ActiveSkillPerkPulse {
  const safeDt = Math.max(0, dt);
  if (!current.active && Object.keys(current.activeResources).length === 0) {
    return current;
  }

  const nextTime = Math.max(0, current.timeRemaining - safeDt);
  const nextResources: Partial<Record<SkillGatheringResource, number>> = {};
  for (const [k, v] of Object.entries(current.activeResources) as Array<
    [SkillGatheringResource, number | undefined]
  >) {
    if (typeof v === 'number' && v - safeDt > 0.01) {
      nextResources[k] = Number((v - safeDt).toFixed(2));
    }
  }

  if (nextTime <= 0.01) {
    return {
      ...current,
      active: false,
      timeRemaining: 0,
      activeResources: nextResources,
    };
  }

  return {
    ...current,
    active: true,
    timeRemaining: Number(nextTime.toFixed(2)),
    activeResources: nextResources,
  };
}

