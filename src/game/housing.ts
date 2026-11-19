import { BUILDING_POSITIONS } from './world';

export interface CabinComfortSpec {
  tier: number;
  title: string;
  bedName: string;
  sleepDurationSec: number;
  hearthWarmthPerSec: number;
  hearthHpPerSec: number;
  restedWoodBonus: number;
  description: string;
}

export const CABIN_INTERIOR_CENTER_X = 0;
export const CABIN_INTERIOR_CENTER_Z = 250;
export const CABIN_INTERIOR_HALF_W = 5.1;
export const CABIN_INTERIOR_HALF_D = 4.1;

export const CABIN_INTERIOR_DOOR_POS = {
  x: CABIN_INTERIOR_CENTER_X,
  z: CABIN_INTERIOR_CENTER_Z + 3.55,
} as const;

export const CABIN_INTERIOR_SPAWN_POS = {
  x: CABIN_INTERIOR_CENTER_X,
  z: CABIN_INTERIOR_CENTER_Z + 2.55,
  yaw: Math.PI,
} as const;

export const CABIN_INTERIOR_BED_POS = {
  x: CABIN_INTERIOR_CENTER_X - 2.85,
  z: CABIN_INTERIOR_CENTER_Z - 1.75,
} as const;

export const CABIN_INTERIOR_SLEEP_ANCHOR = {
  x: CABIN_INTERIOR_BED_POS.x,
  z: CABIN_INTERIOR_BED_POS.z + 0.85,
  yaw: 0,
} as const;

export const CABIN_INTERIOR_WAKE_POS = {
  x: CABIN_INTERIOR_BED_POS.x + 1.55,
  z: CABIN_INTERIOR_BED_POS.z + 0.65,
  yaw: Math.PI / 2,
} as const;

export const CABIN_INTERIOR_HEARTH_POS = {
  x: CABIN_INTERIOR_CENTER_X + 0.25,
  z: CABIN_INTERIOR_CENTER_Z - 3.35,
} as const;

export const CABIN_INTERIOR_TABLE_POS = {
  x: CABIN_INTERIOR_CENTER_X + 2.55,
  z: CABIN_INTERIOR_CENTER_Z + 0.65,
} as const;

export const CABIN_ENTER_RADIUS = 4.25;
export const CABIN_EXIT_RADIUS = 2.65;
export const CABIN_BED_RADIUS = 3.2;

export const CABIN_MORNING_TIME_OF_DAY = 0.27; // ~06:28 AM crisp golden-hour dawn

/**
 * Exterior doorstep position directly in front of the Level 1 cabin porch,
 * facing the central campfire plaza.
 */
export function getCabinExteriorDoorPos(): { x: number; z: number; yaw: number } {
  const cx = BUILDING_POSITIONS.cabin.x;
  const cz = BUILDING_POSITIONS.cabin.z;
  const yaw = Math.atan2(-cx, -cz);
  const dist = Math.hypot(cx, cz) || 1;
  const ux = -cx / dist;
  const uz = -cz / dist;
  const stepOut = 3.55;
  return {
    x: cx + ux * stepOut,
    z: cz + uz * stepOut,
    yaw,
  };
}

export function isNearCabinExteriorDoor(x: number, z: number): boolean {
  const door = getCabinExteriorDoorPos();
  const distDoor = Math.hypot(x - door.x, z - door.z);
  const distCabinCenter = Math.hypot(
    x - BUILDING_POSITIONS.cabin.x,
    z - BUILDING_POSITIONS.cabin.z,
  );
  return distDoor <= 3.1 || distCabinCenter <= CABIN_ENTER_RADIUS;
}

export function isNearCabinInteriorDoor(x: number, z: number): boolean {
  return (
    Math.hypot(x - CABIN_INTERIOR_DOOR_POS.x, z - CABIN_INTERIOR_DOOR_POS.z) <=
    CABIN_EXIT_RADIUS
  );
}

export function isNearCabinBed(x: number, z: number): boolean {
  return (
    Math.hypot(x - CABIN_INTERIOR_BED_POS.x, z - CABIN_INTERIOR_BED_POS.z) <=
    CABIN_BED_RADIUS
  );
}

export function clampToCabinInterior(
  x: number,
  z: number,
): { x: number; z: number } {
  let nx = Math.max(
    CABIN_INTERIOR_CENTER_X - CABIN_INTERIOR_HALF_W + 0.65,
    Math.min(CABIN_INTERIOR_CENTER_X + CABIN_INTERIOR_HALF_W - 0.65, x),
  );
  let nz = Math.max(
    CABIN_INTERIOR_CENTER_Z - CABIN_INTERIOR_HALF_D + 0.75,
    Math.min(CABIN_INTERIOR_CENTER_Z + CABIN_INTERIOR_HALF_D - 0.65, z),
  );

  // Soft collision around hearth stones
  const hdx = nx - CABIN_INTERIOR_HEARTH_POS.x;
  const hdz = nz - CABIN_INTERIOR_HEARTH_POS.z;
  const hDist = Math.hypot(hdx, hdz);
  if (hDist < 1.35 && hDist > 0.001) {
    nx = CABIN_INTERIOR_HEARTH_POS.x + (hdx / hDist) * 1.35;
    nz = CABIN_INTERIOR_HEARTH_POS.z + (hdz / hDist) * 1.35;
  }

  // Soft collision around oak dining table
  const tdx = nx - CABIN_INTERIOR_TABLE_POS.x;
  const tdz = nz - CABIN_INTERIOR_TABLE_POS.z;
  const tDist = Math.hypot(tdx, tdz);
  if (tDist < 1.25 && tDist > 0.001) {
    nx = CABIN_INTERIOR_TABLE_POS.x + (tdx / tDist) * 1.25;
    nz = CABIN_INTERIOR_TABLE_POS.z + (tdz / tDist) * 1.25;
  }

  // Soft bounding box around bed frame so awake player walks cleanly alongside it
  const bedHalfW = 1.05;
  const bedHalfD = 1.45;
  const relBx = nx - CABIN_INTERIOR_BED_POS.x;
  const relBz = nz - CABIN_INTERIOR_BED_POS.z;
  if (Math.abs(relBx) < bedHalfW && Math.abs(relBz) < bedHalfD) {
    const pushX = bedHalfW - Math.abs(relBx);
    const pushZ = bedHalfD - Math.abs(relBz);
    if (pushX < pushZ) {
      nx = CABIN_INTERIOR_BED_POS.x + (relBx >= 0 ? bedHalfW : -bedHalfW);
    } else {
      nz = CABIN_INTERIOR_BED_POS.z + (relBz >= 0 ? bedHalfD : -bedHalfD);
    }
  }

  return { x: nx, z: nz };
}

const CABIN_COMFORT_SPECS: readonly CabinComfortSpec[] = [
  {
    tier: 1,
    title: 'Trapper Shelter',
    bedName: 'Wool-Lined Fur Cot',
    sleepDurationSec: 2.2,
    hearthWarmthPerSec: 24,
    hearthHpPerSec: 4,
    restedWoodBonus: 0,
    description: 'Sheltered dry bedroll beside glowing embers. Restores full Health & Warmth overnight.',
  },
  {
    tier: 2,
    title: 'Timber Cabin',
    bedName: 'Hand-Hewn Pine Bed',
    sleepDurationSec: 2.1,
    hearthWarmthPerSec: 30,
    hearthHpPerSec: 6,
    restedWoodBonus: 4,
    description: 'Sturdy log walls and hearth rug. Skips night cleanly and yields +4 morning kindling.',
  },
  {
    tier: 3,
    title: 'Alpine Homestead',
    bedName: 'Quilted Oak Bedstead',
    sleepDurationSec: 2.0,
    hearthWarmthPerSec: 36,
    hearthHpPerSec: 9,
    restedWoodBonus: 8,
    description: 'Layered fleece bedding and stone hearth. Restores full vitals with +8 morning wood.',
  },
  {
    tier: 4,
    title: 'Stone Lodge',
    bedName: 'Carved Canopy Bed',
    sleepDurationSec: 1.9,
    hearthWarmthPerSec: 44,
    hearthHpPerSec: 12,
    restedWoodBonus: 12,
    description: 'Grand hearth sanctuary with velvet drapes and fast indoor recovery.',
  },
  {
    tier: 5,
    title: 'Sovereign Manor',
    bedName: 'Royal Frostwood Four-Poster',
    sleepDurationSec: 1.8,
    hearthWarmthPerSec: 54,
    hearthHpPerSec: 16,
    restedWoodBonus: 18,
    description: 'Master frontier suite with blazing stone hearth, rapid healing, and +18 morning timber.',
  },
];

export function getCabinComfortSpec(cabinTier: number): CabinComfortSpec {
  const idx = Math.max(0, Math.min(CABIN_COMFORT_SPECS.length - 1, Math.round(cabinTier) - 1));
  return CABIN_COMFORT_SPECS[idx];
}

export interface SleepDaySkipInput {
  dayNumber: number;
  timeOfDay: number;
  morningTimeOfDay?: number;
}

export interface SleepDaySkipResult {
  nextDayNumber: number;
  nextTimeOfDay: number;
  hoursSkipped: number;
}

/**
 * Skips forward cleanly to the next calendar day at morning dawn
 * whenever the player sleeps in their cabin bed.
 */
export function computeSleepDaySkip(input: SleepDaySkipInput): SleepDaySkipResult {
  const currentDay = Math.max(1, Math.floor(input.dayNumber));
  const morningTime = input.morningTimeOfDay ?? CABIN_MORNING_TIME_OF_DAY;
  const currentTime = ((input.timeOfDay % 1) + 1) % 1;
  const deltaFraction = (1 - currentTime) + morningTime;
  const hoursSkipped = Math.max(1, Math.round(deltaFraction * 24));
  return {
    nextDayNumber: currentDay + 1,
    nextTimeOfDay: morningTime,
    hoursSkipped,
  };
}
