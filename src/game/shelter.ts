import type { ResourceCounts, StormShelterState } from './types';

export interface StormShelterSpec {
  level: number;
  name: string;
  cost: ResourceCounts;
  radius: number;
  duration: number;
  cooldown: number;
  description: string;
}

export const STORM_SHELTER_TIERS: StormShelterSpec[] = [
  {
    level: 0,
    name: 'Unbuilt Storm Shelter',
    cost: { wood: 0, pelts: 0, stone: 0, gold: 0 },
    radius: 0,
    duration: 0,
    cooldown: 0,
    description:
      'Construct an insulated refuge dome offering temporary immunity to blizzard damage & warmth loss.',
  },
  {
    level: 1,
    name: 'Storm Shelter',
    cost: { wood: 10, pelts: 0, stone: 3, gold: 15 },
    radius: 4.2,
    duration: 18,
    cooldown: 12,
    description:
      'Creates an 18s refuge dome: complete immunity to blizzard damage & warmth loss inside.',
  },
  {
    level: 2,
    name: 'Reinforced Bunker',
    cost: { wood: 28, pelts: 4, stone: 6, gold: 65 },
    radius: 5.0,
    duration: 26,
    cooldown: 10,
    description:
      'Expands refuge dome to 5.0m for 26s with a faster 10s recharge.',
  },
  {
    level: 3,
    name: 'Aegis Bastion',
    cost: { wood: 58, pelts: 8, stone: 12, gold: 155 },
    radius: 6.0,
    duration: 35,
    cooldown: 8,
    description:
      'Fortified 6.0m sanctuary dome lasting 35s with a rapid 8s recharge.',
  },
];

export function getStormShelterSpec(level: number): StormShelterSpec {
  const idx = Math.max(0, Math.min(STORM_SHELTER_TIERS.length - 1, Math.floor(level)));
  return STORM_SHELTER_TIERS[idx];
}

export function createInitialStormShelterState(level = 0): StormShelterState {
  const spec = getStormShelterSpec(level);
  if (spec.level <= 0) {
    return {
      level: 0,
      phase: 'unbuilt',
      timeLeft: 0,
      duration: 0,
      radius: 0,
      playerInside: false,
      shielded: false,
    };
  }
  return {
    level: spec.level,
    phase: 'ready',
    timeLeft: 0,
    duration: spec.duration,
    radius: spec.radius,
    playerInside: false,
    shielded: false,
  };
}

export function upgradeStormShelterState(
  current: StormShelterState,
  newLevel: number,
): StormShelterState {
  const spec = getStormShelterSpec(newLevel);
  if (spec.level <= 0) {
    return createInitialStormShelterState(0);
  }
  if (current.phase === 'unbuilt') {
    return createInitialStormShelterState(spec.level);
  }
  if (current.phase === 'active') {
    return {
      ...current,
      level: spec.level,
      radius: spec.radius,
      duration: spec.duration,
      timeLeft: Math.max(current.timeLeft, spec.duration),
      shielded: current.playerInside,
    };
  }
  return {
    ...current,
    level: spec.level,
    radius: spec.radius,
    phase: 'ready',
    timeLeft: 0,
    duration: spec.duration,
    shielded: false,
  };
}

export function isPlayerInsideStormShelter(
  playerX: number,
  playerZ: number,
  shelterX: number,
  shelterZ: number,
  radius: number,
): boolean {
  if (radius <= 0) return false;
  return Math.hypot(playerX - shelterX, playerZ - shelterZ) <= radius;
}

export function tickStormShelter(
  state: StormShelterState,
  playerInside: boolean,
  dt: number,
): {
  state: StormShelterState;
  justActivated: boolean;
  justExpired: boolean;
  justRecharged: boolean;
} {
  if (state.level <= 0 || state.phase === 'unbuilt') {
    return {
      state: createInitialStormShelterState(0),
      justActivated: false,
      justExpired: false,
      justRecharged: false,
    };
  }

  const spec = getStormShelterSpec(state.level);

  if (state.phase === 'ready') {
    if (playerInside) {
      return {
        state: {
          level: spec.level,
          phase: 'active',
          timeLeft: spec.duration,
          duration: spec.duration,
          radius: spec.radius,
          playerInside: true,
          shielded: true,
        },
        justActivated: true,
        justExpired: false,
        justRecharged: false,
      };
    }
    return {
      state: {
        ...state,
        radius: spec.radius,
        playerInside: false,
        shielded: false,
      },
      justActivated: false,
      justExpired: false,
      justRecharged: false,
    };
  }

  if (state.phase === 'active') {
    const nextTime = state.timeLeft - dt;
    if (nextTime <= 0) {
      return {
        state: {
          level: spec.level,
          phase: 'cooldown',
          timeLeft: spec.cooldown,
          duration: spec.cooldown,
          radius: spec.radius,
          playerInside,
          shielded: false,
        },
        justActivated: false,
        justExpired: true,
        justRecharged: false,
      };
    }
    return {
      state: {
        level: spec.level,
        phase: 'active',
        timeLeft: nextTime,
        duration: spec.duration,
        radius: spec.radius,
        playerInside,
        shielded: playerInside,
      },
      justActivated: false,
      justExpired: false,
      justRecharged: false,
    };
  }

  // Cooldown phase
  const nextCooldown = state.timeLeft - dt;
  if (nextCooldown <= 0) {
    if (playerInside) {
      return {
        state: {
          level: spec.level,
          phase: 'active',
          timeLeft: spec.duration,
          duration: spec.duration,
          radius: spec.radius,
          playerInside: true,
          shielded: true,
        },
        justActivated: true,
        justExpired: false,
        justRecharged: true,
      };
    }
    return {
      state: {
        level: spec.level,
        phase: 'ready',
        timeLeft: 0,
        duration: spec.duration,
        radius: spec.radius,
        playerInside: false,
        shielded: false,
      },
      justActivated: false,
      justExpired: false,
      justRecharged: true,
    };
  }

  return {
    state: {
      level: spec.level,
      phase: 'cooldown',
      timeLeft: nextCooldown,
      duration: spec.cooldown,
      radius: spec.radius,
      playerInside,
      shielded: false,
    },
    justActivated: false,
    justExpired: false,
    justRecharged: false,
  };
}
