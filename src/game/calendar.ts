import type {
  CalendarEventSpec,
  CalendarSeasonId,
  CalendarState,
  CalendarUpcomingDay,
} from './types';

export const DAYS_PER_SEASON = 14;
export const SEASONS_PER_YEAR = 4;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS_PER_YEAR;

export interface SeasonDefinition {
  id: CalendarSeasonId;
  name: string;
  chillMult: number;
  woodMult: number;
}

export const CALENDAR_SEASONS: SeasonDefinition[] = [
  {
    id: 'first_frost',
    name: 'First Frost',
    chillMult: 0.96,
    woodMult: 1.05,
  },
  {
    id: 'deep_winter',
    name: 'Deep Winter',
    chillMult: 1.08,
    woodMult: 1.0,
  },
  {
    id: 'aurora_solstice',
    name: 'Aurora Solstice',
    chillMult: 1.04,
    woodMult: 1.04,
  },
  {
    id: 'late_thaw',
    name: 'Late Thaw',
    chillMult: 0.92,
    woodMult: 1.08,
  },
];

export const CALENDAR_WEEKDAYS = [
  'Frostday',
  'Timberday',
  'Huntday',
  'Anvilday',
  'Galeday',
  'Caveday',
  'Hearthday',
] as const;

export const CALENDAR_EVENTS: Record<number, CalendarEventSpec> = {
  1: {
    id: 'founders_dawn',
    title: 'Founder’s Dawn',
    description: 'Clear morning kickoff — +10% Timber & +20% Pet Taming.',
    woodMult: 1.1,
    goldTradeMult: 1.0,
    tameRateMult: 1.2,
    chillMult: 0.92,
  },
  3: {
    id: 'timber_surplus',
    title: 'Timber Surplus',
    description: 'Seasoned pine sap runs crisp — +20% Timber harvest.',
    woodMult: 1.2,
    goldTradeMult: 1.0,
    tameRateMult: 1.0,
    chillMult: 1.0,
  },
  5: {
    id: 'wolf_moon',
    title: 'Silver Hunt Day',
    description: 'Brisk winds sharpen tracks & wildlife bounty (+10% Gold Trade).',
    woodMult: 1.0,
    goldTradeMult: 1.1,
    tameRateMult: 1.05,
    chillMult: 1.02,
  },
  7: {
    id: 'market_fair',
    title: 'Frosthaven Market Fair',
    description: 'Caravan demand surges — +18% Gold from Wood, Pelts & Meat.',
    woodMult: 1.0,
    goldTradeMult: 1.18,
    tameRateMult: 1.0,
    chillMult: 0.96,
  },
  10: {
    id: 'kindred_day',
    title: 'Kindred Bonding Day',
    description: 'Calm alpine air — +35% Passive Pet Taming affinity.',
    woodMult: 1.0,
    goldTradeMult: 1.05,
    tameRateMult: 1.35,
    chillMult: 0.95,
  },
  14: {
    id: 'solstice_eve',
    title: 'Aurora Solstice Crown',
    description: 'Skyfires bless camp — +15% Timber, +15% Trade Gold & +25% Taming.',
    woodMult: 1.15,
    goldTradeMult: 1.15,
    tameRateMult: 1.25,
    chillMult: 0.9,
  },
};

export function getCalendarEventForSeasonDay(
  dayOfSeason: number,
): CalendarEventSpec | null {
  return CALENDAR_EVENTS[dayOfSeason] ?? null;
}

export function buildCalendarState(dayNumber: number): CalendarState {
  const safeDay = Math.max(1, Math.floor(dayNumber));
  const zeroBased = safeDay - 1;
  const year = Math.floor(zeroBased / DAYS_PER_YEAR) + 1;
  const dayInYear = zeroBased % DAYS_PER_YEAR;
  const seasonIdx = Math.floor(dayInYear / DAYS_PER_SEASON);
  const seasonDef = CALENDAR_SEASONS[seasonIdx] ?? CALENDAR_SEASONS[0];
  const dayOfSeason = (dayInYear % DAYS_PER_SEASON) + 1;
  const weekdayName =
    CALENDAR_WEEKDAYS[zeroBased % CALENDAR_WEEKDAYS.length] ?? 'Frostday';
  const todayEvent = getCalendarEventForSeasonDay(dayOfSeason);

  const upcomingDays: CalendarUpcomingDay[] = [];
  for (let offset = 1; offset <= 4; offset++) {
    const fDay = safeDay + offset;
    const fZero = fDay - 1;
    const fDayInYear = fZero % DAYS_PER_YEAR;
    const fSeasonIdx = Math.floor(fDayInYear / DAYS_PER_SEASON);
    const fSeason = CALENDAR_SEASONS[fSeasonIdx] ?? CALENDAR_SEASONS[0];
    const fDayOfSeason = (fDayInYear % DAYS_PER_SEASON) + 1;
    const fWeekday =
      CALENDAR_WEEKDAYS[fZero % CALENDAR_WEEKDAYS.length] ?? 'Frostday';
    const fEvent = getCalendarEventForSeasonDay(fDayOfSeason);
    upcomingDays.push({
      dayNumber: fDay,
      seasonName: fSeason.name,
      dayOfSeason: fDayOfSeason,
      weekdayName: fWeekday,
      eventTitle: fEvent ? fEvent.title : null,
    });
  }

  return {
    dayNumber: safeDay,
    year,
    seasonId: seasonDef.id,
    seasonName: seasonDef.name,
    dayOfSeason,
    daysInSeason: DAYS_PER_SEASON,
    weekdayName,
    formattedDate: `Year ${year} · ${seasonDef.name} ${dayOfSeason} · ${weekdayName}`,
    shortDate: `${seasonDef.name} ${dayOfSeason} · Yr ${year}`,
    todayEvent,
    upcomingDays,
  };
}

export function getCalendarGameplayModifiers(dayNumber: number): {
  woodMult: number;
  goldTradeMult: number;
  tameRateMult: number;
  chillMult: number;
} {
  const cal = buildCalendarState(dayNumber);
  const season =
    CALENDAR_SEASONS.find((s) => s.id === cal.seasonId) ?? CALENDAR_SEASONS[0];
  const ev = cal.todayEvent;
  return {
    woodMult: Math.round(season.woodMult * (ev?.woodMult ?? 1) * 1000) / 1000,
    goldTradeMult: Math.round((ev?.goldTradeMult ?? 1) * 1000) / 1000,
    tameRateMult: Math.round((ev?.tameRateMult ?? 1) * 1000) / 1000,
    chillMult: Math.round(season.chillMult * (ev?.chillMult ?? 1) * 1000) / 1000,
  };
}
