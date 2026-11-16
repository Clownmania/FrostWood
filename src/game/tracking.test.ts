import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HUNTERS_SIGHT_COOLDOWN,
  HUNTERS_SIGHT_DURATION,
  TRACK_MAX_AGE,
  activateHuntersSight,
  collectMinimapWildlifeBlips,
  computeTrackVisualAlpha,
  createInitialHuntersSightState,
  findNearestInspectableTrack,
  pickForestFlushSpecies,
  selectBestTrackedQuarry,
  tickHuntersSight,
} from './tracking';

test("Hunter's Sight activates for duration, enters cooldown, and recovers cleanly", () => {
  const initial = createInitialHuntersSightState();
  assert.equal(initial.active, false);
  assert.equal(initial.cooldownLeft, 0);

  const first = activateHuntersSight(initial);
  assert.equal(first.activated, true);
  assert.equal(first.state.active, true);
  assert.equal(first.state.timeLeft, HUNTERS_SIGHT_DURATION);
  assert.equal(first.state.cooldownLeft, HUNTERS_SIGHT_COOLDOWN);

  // Re-activating while active or on cooldown is rejected
  const blocked = activateHuntersSight(first.state);
  assert.equal(blocked.activated, false);

  // Tick past active window, still in remaining cooldown
  const midTick = tickHuntersSight(first.state, HUNTERS_SIGHT_DURATION + 0.5);
  assert.equal(midTick.expired, true);
  assert.equal(midTick.state.active, false);
  assert.ok(midTick.state.cooldownLeft > 0);
  assert.equal(activateHuntersSight(midTick.state).activated, false);

  // Tick past full cooldown
  const readyTick = tickHuntersSight(midTick.state, HUNTERS_SIGHT_COOLDOWN);
  assert.equal(readyTick.readyNow, true);
  assert.equal(readyTick.state.cooldownLeft, 0);
  assert.equal(activateHuntersSight(readyTick.state).activated, true);
});

test('snow track alpha decays with age and boosts while Hunter’s Sight is active', () => {
  const normalFresh = computeTrackVisualAlpha(2, false);
  const sightFresh = computeTrackVisualAlpha(2, true);
  const normalOld = computeTrackVisualAlpha(TRACK_MAX_AGE - 2, false);
  const expired = computeTrackVisualAlpha(TRACK_MAX_AGE + 1, true);

  assert.ok(sightFresh > normalFresh);
  assert.ok(normalFresh > normalOld);
  assert.equal(expired, 0);
});

test('findNearestInspectableTrack selects closest non-expired clue in active zone', () => {
  const tracks = [
    { id: 1, zone: 'level2' as const, kind: 'wolf' as const, animalId: 10, x: 0, z: 0, yaw: 0, age: 1 },
    { id: 2, zone: 'level1' as const, kind: 'stag' as const, animalId: 11, x: 2.2, z: 0, yaw: 0, age: 4 },
    { id: 3, zone: 'level1' as const, kind: 'fox' as const, animalId: 12, x: 1.1, z: 0.4, yaw: Math.PI, age: 6 },
    { id: 4, zone: 'level1' as const, kind: 'hare' as const, animalId: 13, x: 0.2, z: 0.2, yaw: 0, age: TRACK_MAX_AGE + 2 },
  ];

  const found = findNearestInspectableTrack(tracks, 0, 0, 'level1', 3.2);
  assert.ok(found);
  assert.equal(found.track.id, 3);
  assert.equal(found.clue.kind, 'fox');
  assert.equal(found.clue.direction, 'N');
  assert.ok(found.clue.freshnessPct > 70);
});

test("selectBestTrackedQuarry locks onto tracked animal or prioritizes rarest visible fauna under Hunter's Sight", () => {
  const animals = [
    { id: 1, zone: 'level1' as const, kind: 'hare' as const, x: 8, z: 0, hp: 30, maxHp: 30, state: 'wander' },
    { id: 2, zone: 'level1' as const, kind: 'polar_bear' as const, x: 28, z: -12, hp: 210, maxHp: 210, state: 'wander' },
    { id: 3, zone: 'level2' as const, kind: 'aurora_fenrir' as const, x: 10, z: -240, hp: 460, maxHp: 460, state: 'stalk' },
  ];

  // Idle without sight and without lock returns null
  assert.equal(selectBestTrackedQuarry(animals, 0, 0, 'level1', null, false, 0), null);

  // Explicit lock works even when Hunter's Sight is off
  const locked = selectBestTrackedQuarry(animals, 0, 0, 'level1', 1, false, 8);
  assert.ok(locked);
  assert.equal(locked.id, 1);
  assert.equal(locked.ambushReady, true);

  // Hunter's Sight prioritizes rare polar bear over common hare
  const sighted = selectBestTrackedQuarry(animals, 0, 0, 'level1', null, true, 0);
  assert.ok(sighted);
  assert.equal(sighted.kind, 'polar_bear');
  assert.equal(sighted.rarity, 'rare');
});

test("collectMinimapWildlifeBlips reveals forest wildlife during Hunter's Sight and keeps locked quarry visible", () => {
  const animals = [
    { id: 1, zone: 'level1' as const, kind: 'hare' as const, x: 8, z: 0, hp: 30, maxHp: 30, state: 'wander' },
    { id: 2, zone: 'level1' as const, kind: 'stag' as const, x: 35, z: -18, hp: 75, maxHp: 75, state: 'wander' },
    { id: 3, zone: 'level1' as const, kind: 'wolf' as const, x: -24, z: 16, hp: 0, maxHp: 105, state: 'ko' },
  ];

  // Idle: only close animal (<= 14m) or explicitly locked animal shows
  const idleBlips = collectMinimapWildlifeBlips(animals, 0, 0, 'level1', false, 2);
  assert.equal(idleBlips.length, 2);
  assert.equal(idleBlips.find((b) => b.id === 2)?.locked, true);

  // Hunter's Sight active: reveals all living animals within sight pulse radius (ignoring KO)
  const sightBlips = collectMinimapWildlifeBlips(animals, 0, 0, 'level1', true, null);
  assert.equal(sightBlips.length, 2);
  assert.ok(sightBlips.some((b) => b.id === 1));
  assert.ok(sightBlips.some((b) => b.id === 2));
});

test('pickForestFlushSpecies selects regional wildlife respecting caps and preferences', () => {
  const sparseCounts = { hare: 1 };
  const l1Pick = pickForestFlushSpecies(sparseCounts, 'level1', () => 0.45, 'frost_stag');
  assert.equal(l1Pick, 'frost_stag');

  const l2Pick = pickForestFlushSpecies({}, 'level2', () => 0.1, null);
  assert.equal(l2Pick, 'frost_stag');
});
