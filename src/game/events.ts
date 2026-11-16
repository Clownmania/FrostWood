import type {
  BuildingSpec,
  FestivalBuildingId,
  ResourceCounts,
  SeasonalEventId,
  SeasonalEventState,
  UpgradeLevels,
} from './types';

export interface SeasonalEventProfile {
  id: SeasonalEventId;
  name: string;
  subtitle: string;
  activeDuration: number;
  cooldownDuration: number;
  initialWait: number;
  sculptureIceYield: number;
  accentColorHex: number;
}

export const SEASONAL_EVENT_ORDER: SeasonalEventId[] = [
  'solstice_fair',
  'aurora_festival',
];

export const SEASONAL_EVENT_PROFILES: Record<SeasonalEventId, SeasonalEventProfile> = {
  solstice_fair: {
    id: 'solstice_fair',
    name: 'Winter Solstice Fair',
    subtitle: 'Harvest Ice Sculptures · Festival open',
    activeDuration: 50,
    cooldownDuration: 30,
    initialWait: 12,
    sculptureIceYield: 2,
    accentColorHex: 0xf6c344,
  },
  aurora_festival: {
    id: 'aurora_festival',
    name: 'Aurora Ice Festival',
    subtitle: 'Glacial monoliths spawned · Festival open',
    activeDuration: 50,
    cooldownDuration: 30,
    initialWait: 12,
    sculptureIceYield: 3,
    accentColorHex: 0x7be0ff,
  },
};

export const FESTIVAL_PAVILION_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Festival Stall',
    cost: { wood: 0, pelts: 0, ice: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Available during seasonal festivals. Harvest Ice Shards to raise a stall.',
  },
  {
    level: 1,
    name: 'Solstice Festival Stall',
    cost: { wood: 12, pelts: 0, ice: 3, gold: 20 },
    woodPerSec: 0,
    goldPerSec: 1.2,
    warmthRadius: 10,
    description: 'Lantern-lit timber gazebo serving spiced cider. +1.2 Gold/s.',
  },
  {
    level: 2,
    name: 'Grand Aurora Hall',
    cost: { wood: 26, pelts: 2, ice: 7, gold: 65 },
    woodPerSec: 0.3,
    goldPerSec: 3.0,
    warmthRadius: 13,
    description: 'Illuminated crystal winter hall. +3.0 Gold/s & +18% trade prices.',
  },
];

export const ICE_MONUMENT_TIERS: BuildingSpec[] = [
  {
    level: 0,
    name: 'Empty Ice Plinth',
    cost: { wood: 0, pelts: 0, ice: 0, gold: 0 },
    woodPerSec: 0,
    goldPerSec: 0,
    warmthRadius: 0,
    description: 'Carve a decorative winter ice monument during a seasonal event.',
  },
  {
    level: 1,
    name: 'Carved Ice Stag',
    cost: { wood: 6, pelts: 0, ice: 4, gold: 15 },
    woodPerSec: 0,
    goldPerSec: 0.9,
    warmthRadius: 0,
    description: 'Translucent sculpted stag drawing curious frontier traders. +0.9 Gold/s.',
  },
  {
    level: 2,
    name: 'Aurora Crystal Fountain',
    cost: { wood: 14, pelts: 0, ice: 8, gold: 50 },
    woodPerSec: 0,
    goldPerSec: 2.4,
    warmthRadius: 0,
    description: 'Radiant multi-tiered ice centerpiece. +2.4 Gold/s passive income.',
  },
];

export const FESTIVAL_BUILDING_IDS: FestivalBuildingId[] = [
  'festivalPavilion',
  'iceMonument',
];

export function getSeasonalEventProfile(id: SeasonalEventId): SeasonalEventProfile {
  return SEASONAL_EVENT_PROFILES[id];
}

export function createInitialSeasonalEvent(
  override?: SeasonalEventId | boolean | null,
): SeasonalEventState {
  if (override === true || override === 'solstice_fair' || override === 'aurora_festival') {
    const id: SeasonalEventId =
      override === 'aurora_festival' ? 'aurora_festival' : 'solstice_fair';
    const profile = SEASONAL_EVENT_PROFILES[id];
    return {
      id,
      name: profile.name,
      subtitle: profile.subtitle,
      active: true,
      timeLeft: profile.activeDuration,
      duration: profile.activeDuration,
      cycleCount: 1,
    };
  }

  const first = SEASONAL_EVENT_PROFILES.solstice_fair;
  return {
    id: first.id,
    name: first.name,
    subtitle: first.subtitle,
    active: false,
    timeLeft: first.initialWait,
    duration: first.initialWait,
    cycleCount: 0,
  };
}

export function tickSeasonalEvent(
  state: SeasonalEventState,
  dt: number,
): {
  event: SeasonalEventState;
  justStarted: boolean;
  justEnded: boolean;
} {
  const remaining = state.timeLeft - dt;
  if (remaining > 0) {
    return {
      event: { ...state, timeLeft: remaining },
      justStarted: false,
      justEnded: false,
    };
  }

  if (!state.active) {
    // Wait window finished -> start the scheduled event
    const profile = SEASONAL_EVENT_PROFILES[state.id];
    return {
      event: {
        id: profile.id,
        name: profile.name,
        subtitle: profile.subtitle,
        active: true,
        timeLeft: profile.activeDuration,
        duration: profile.activeDuration,
        cycleCount: state.cycleCount + 1,
      },
      justStarted: true,
      justEnded: false,
    };
  }

  // Active event ended -> advance to next seasonal event cooldown window
  const idx = SEASONAL_EVENT_ORDER.indexOf(state.id);
  const nextId = SEASONAL_EVENT_ORDER[(idx + 1) % SEASONAL_EVENT_ORDER.length];
  const nextProfile = SEASONAL_EVENT_PROFILES[nextId];
  return {
    event: {
      id: nextProfile.id,
      name: nextProfile.name,
      subtitle: nextProfile.subtitle,
      active: false,
      timeLeft: nextProfile.cooldownDuration,
      duration: nextProfile.cooldownDuration,
      cycleCount: state.cycleCount,
    },
    justStarted: false,
    justEnded: true,
  };
}

export function getFestivalBuildingTable(id: FestivalBuildingId): BuildingSpec[] {
  return id === 'festivalPavilion' ? FESTIVAL_PAVILION_TIERS : ICE_MONUMENT_TIERS;
}

export function getFestivalBuildingSpec(
  id: FestivalBuildingId,
  level: number,
): BuildingSpec {
  const table = getFestivalBuildingTable(id);
  const exact = table.find((spec) => spec.level === level);
  if (exact) return exact;
  return level <= table[0].level ? table[0] : table[table.length - 1];
}

export function getNextFestivalBuildingUpgrade(
  id: FestivalBuildingId,
  levels: UpgradeLevels,
): BuildingSpec | null {
  const current = levels[id] ?? 0;
  const table = getFestivalBuildingTable(id);
  const maxLevel = table[table.length - 1].level;
  if (current >= maxLevel) return null;
  const next = table.find((spec) => spec.level === current + 1);
  return next ?? null;
}

export function canAffordSeasonalCost(
  resources: ResourceCounts,
  cost: ResourceCounts,
): boolean {
  return (
    resources.wood >= cost.wood &&
    resources.pelts >= cost.pelts &&
    (resources.stone ?? 0) >= (cost.stone ?? 0) &&
    (resources.ice ?? 0) >= (cost.ice ?? 0) &&
    resources.gold >= cost.gold
  );
}

export function canPurchaseFestivalBuilding(
  id: FestivalBuildingId,
  levels: UpgradeLevels,
  resources: ResourceCounts,
  event: SeasonalEventState,
): boolean {
  if (!event.active) return false;
  const next = getNextFestivalBuildingUpgrade(id, levels);
  if (!next) return false;
  return canAffordSeasonalCost(resources, next.cost);
}

export function purchaseFestivalBuilding(
  id: FestivalBuildingId,
  levels: UpgradeLevels,
  resources: ResourceCounts,
  event: SeasonalEventState,
): {
  levels: UpgradeLevels;
  resources: ResourceCounts;
  spec: BuildingSpec;
} | null {
  if (!event.active) return null;
  const next = getNextFestivalBuildingUpgrade(id, levels);
  if (!next || !canAffordSeasonalCost(resources, next.cost)) return null;

  const updatedResources: ResourceCounts = {
    wood: resources.wood - next.cost.wood,
    pelts: resources.pelts - next.cost.pelts,
    stone: (resources.stone ?? 0) - (next.cost.stone ?? 0),
    ice: (resources.ice ?? 0) - (next.cost.ice ?? 0),
    gold: resources.gold - next.cost.gold,
  };

  return {
    levels: {
      ...levels,
      [id]: next.level,
    },
    resources: updatedResources,
    spec: next,
  };
}

export function exchangeFestivalIce(
  resources: ResourceCounts,
  event: SeasonalEventState,
  iceCost = 3,
  goldReward = 30,
): { resources: ResourceCounts; goldGained: number } | null {
  if (!event.active) return null;
  const iceHave = resources.ice ?? 0;
  if (iceHave < iceCost) return null;
  return {
    resources: {
      ...resources,
      ice: iceHave - iceCost,
      gold: resources.gold + goldReward,
    },
    goldGained: goldReward,
  };
}
