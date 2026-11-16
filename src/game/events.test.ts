import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_LEVELS, INITIAL_RESOURCES } from './economy';
import {
  canPurchaseFestivalBuilding,
  createInitialSeasonalEvent,
  exchangeFestivalIce,
  getNextFestivalBuildingUpgrade,
  purchaseFestivalBuilding,
  tickSeasonalEvent,
} from './events';

test('seasonal event cycles through wait -> active festival -> cooldown -> next festival', () => {
  const init = createInitialSeasonalEvent();
  assert.equal(init.active, false);
  assert.equal(init.id, 'solstice_fair');

  // Tick partway through wait
  const midWait = tickSeasonalEvent(init, 6);
  assert.equal(midWait.event.active, false);
  assert.equal(midWait.justStarted, false);

  // Finish wait -> Winter Solstice Fair becomes active
  const started = tickSeasonalEvent(midWait.event, 7);
  assert.equal(started.justStarted, true);
  assert.equal(started.event.active, true);
  assert.equal(started.event.id, 'solstice_fair');
  assert.equal(started.event.cycleCount, 1);

  // Expire active duration -> transitions to Aurora Ice Festival cooldown
  const ended = tickSeasonalEvent(started.event, started.event.timeLeft + 1);
  assert.equal(ended.justEnded, true);
  assert.equal(ended.event.active, false);
  assert.equal(ended.event.id, 'aurora_festival');

  // Wait through cooldown -> Aurora Ice Festival starts
  const second = tickSeasonalEvent(ended.event, ended.event.timeLeft + 1);
  assert.equal(second.justStarted, true);
  assert.equal(second.event.active, true);
  assert.equal(second.event.id, 'aurora_festival');
  assert.equal(second.event.cycleCount, 2);
});

test('festival buildings and ice gift exchange are strictly time-gated by active event', () => {
  const closedEvent = createInitialSeasonalEvent();
  const activeEvent = createInitialSeasonalEvent('solstice_fair');
  const richResources = {
    ...INITIAL_RESOURCES,
    wood: 60,
    ice: 15,
    pelts: 10,
    gold: 150,
  };

  // Locked while seasonal event is dormant even when affordable
  assert.equal(
    canPurchaseFestivalBuilding('festivalPavilion', INITIAL_LEVELS, richResources, closedEvent),
    false,
  );
  assert.equal(
    purchaseFestivalBuilding('festivalPavilion', INITIAL_LEVELS, richResources, closedEvent),
    null,
  );
  assert.equal(exchangeFestivalIce(richResources, closedEvent), null);

  // Unlocked when active
  assert.equal(
    canPurchaseFestivalBuilding('festivalPavilion', INITIAL_LEVELS, richResources, activeEvent),
    true,
  );
  const boughtPavilion = purchaseFestivalBuilding(
    'festivalPavilion',
    INITIAL_LEVELS,
    richResources,
    activeEvent,
  );
  assert.ok(boughtPavilion);
  assert.equal(boughtPavilion.levels.festivalPavilion, 1);
  assert.equal(boughtPavilion.resources.ice, 12);

  // Can also erect decorative Ice Monument while event is active
  const boughtSculpture = purchaseFestivalBuilding(
    'iceMonument',
    boughtPavilion.levels,
    boughtPavilion.resources,
    activeEvent,
  );
  assert.ok(boughtSculpture);
  assert.equal(boughtSculpture.levels.iceMonument, 1);
  assert.equal(boughtSculpture.spec.name, 'Carved Ice Stag');

  // Next tier checks cleanly
  const nextPav = getNextFestivalBuildingUpgrade('festivalPavilion', boughtSculpture.levels);
  assert.equal(nextPav?.level, 2);

  // Ice gift exchange converts Ice Shards to Gold only while event is active
  const traded = exchangeFestivalIce(boughtSculpture.resources, activeEvent);
  assert.ok(traded);
  assert.equal(traded.goldGained, 30);
  assert.equal(traded.resources.ice, (boughtSculpture.resources.ice ?? 0) - 3);
});
