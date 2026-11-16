import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAYS_PER_SEASON,
  DAYS_PER_YEAR,
  buildCalendarState,
  getCalendarGameplayModifiers,
} from './calendar';

test('calendar maps dayNumber into seasons, weekdays, years, and upcoming forecast', () => {
  const day1 = buildCalendarState(1);
  assert.equal(day1.year, 1);
  assert.equal(day1.seasonId, 'first_frost');
  assert.equal(day1.dayOfSeason, 1);
  assert.equal(day1.weekdayName, 'Frostday');
  assert.equal(day1.todayEvent?.id, 'founders_dawn');
  assert.equal(day1.upcomingDays.length, 4);
  assert.equal(day1.upcomingDays[1].eventTitle, 'Timber Surplus');

  const day15 = buildCalendarState(DAYS_PER_SEASON + 1);
  assert.equal(day15.year, 1);
  assert.equal(day15.seasonId, 'deep_winter');
  assert.equal(day15.dayOfSeason, 1);

  const year2 = buildCalendarState(DAYS_PER_YEAR + 1);
  assert.equal(year2.year, 2);
  assert.equal(year2.seasonId, 'first_frost');
  assert.equal(year2.dayOfSeason, 1);
});

test('calendar modifiers reflect seasonal & festival event bonuses', () => {
  const marketDay = getCalendarGameplayModifiers(7);
  assert.ok(marketDay.goldTradeMult > 1.15);

  const bondingDay = getCalendarGameplayModifiers(10);
  assert.ok(bondingDay.tameRateMult >= 1.35);
});
