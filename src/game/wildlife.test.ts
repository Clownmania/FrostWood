import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPECIES_SPECS,
  WILDLIFE_SPECIES_ORDER,
  computeEffectiveRadii,
  evaluatePreyReaction,
  isUnawareBehavior,
  pickDynamicWildlifeSpawn,
  pickHabitatRespawnPoint,
  pickMissingSpecies,
  pickWildlifeSpawnPoint,
} from './wildlife';

test('player movement speed and weather adjust effective wildlife detection and spook radii', () => {
  const stag = SPECIES_SPECS.stag;
  const stillClear = computeEffectiveRadii(stag, 0, 'clear');
  const creepSnow = computeEffectiveRadii(stag, 4.0, 'light_snow');
  const runClear = computeEffectiveRadii(stag, 8.4, 'clear');
  const runBlizzard = computeEffectiveRadii(stag, 8.4, 'blizzard');

  assert.ok(stillClear.detectRadius < runClear.detectRadius);
  assert.ok(stillClear.spookRadius < runClear.spookRadius);
  assert.ok(creepSnow.detectRadius < runClear.detectRadius);
  assert.ok(runBlizzard.detectRadius < runClear.detectRadius);

  // Wolves become more sensitive in blizzards
  const wolfSnow = computeEffectiveRadii(SPECIES_SPECS.wolf, 8.4, 'light_snow');
  const wolfBliz = computeEffectiveRadii(SPECIES_SPECS.wolf, 8.4, 'blizzard');
  assert.ok(wolfBliz.detectRadius > wolfSnow.detectRadius);
});

test('fox watches curiously when player is stationary and bolts when player runs close', () => {
  const curious = evaluatePreyReaction({
    kind: 'fox',
    state: 'wander',
    stateTimer: 1.0,
    distPlayer: 10.0,
    playerSpeed: 0,
    weather: 'light_snow',
    dxToPlayer: -10,
    dzToPlayer: 0,
    wanderAngle: 0,
    dt: 0.1,
    rng: () => 0.5,
  });
  assert.equal(curious.state, 'curious');
  assert.equal(isUnawareBehavior(curious.state), true);

  const alerted = evaluatePreyReaction({
    kind: 'fox',
    state: 'wander',
    stateTimer: 1.0,
    distPlayer: 10.0,
    playerSpeed: 8.4,
    weather: 'light_snow',
    dxToPlayer: -10,
    dzToPlayer: 0,
    wanderAngle: 0,
    dt: 0.1,
    rng: () => 0.5,
  });
  assert.equal(alerted.state, 'alert');
  assert.equal(alerted.vx, 0);
  assert.equal(alerted.vz, 0);

  const spooked = evaluatePreyReaction({
    kind: 'fox',
    state: 'alert',
    stateTimer: 0.5,
    distPlayer: 4.5,
    playerSpeed: 8.4,
    weather: 'light_snow',
    dxToPlayer: -4.5,
    dzToPlayer: 0,
    wanderAngle: 0,
    dt: 0.1,
    rng: () => 0.5,
  });
  assert.equal(spooked.state, 'flee');
  assert.ok(Math.hypot(spooked.vx, spooked.vz) > 7);
});

test('stag freezes in alert state on noisy movement and calms if player holds still', () => {
  const alertStep = evaluatePreyReaction({
    kind: 'stag',
    state: 'wander',
    stateTimer: 2.0,
    distPlayer: 9.5,
    playerSpeed: 8.4,
    weather: 'light_snow',
    dxToPlayer: 0,
    dzToPlayer: 9.5,
    wanderAngle: 0,
    dt: 0.1,
    rng: () => 0.5,
  });
  assert.equal(alertStep.state, 'alert');

  // If player freezes at safe distance until alert timer ends, stag returns to wander
  const calmDown = evaluatePreyReaction({
    kind: 'stag',
    state: 'alert',
    stateTimer: 0.05,
    distPlayer: 9.5,
    playerSpeed: 0,
    weather: 'light_snow',
    dxToPlayer: 0,
    dzToPlayer: 9.5,
    wanderAngle: 0,
    dt: 0.1,
    rng: () => 0.5,
  });
  assert.equal(calmDown.state, 'wander');
});

test('dynamic wildlife spawner prioritizes missing species and spawns away from player & trees', () => {
  const missingFox = pickMissingSpecies({ hare: 6, fox: 3, stag: 5, wolf: 4 });
  assert.equal(missingFox, 'fox');

  const full = pickMissingSpecies({ hare: 6, fox: 5, stag: 5, wolf: 4 });
  assert.equal(full, null);

  const pos = pickWildlifeSpawnPoint({
    minR: 17,
    maxR: 37,
    playerX: 18,
    playerZ: 0,
    minPlayerDist: 14,
    obstacles: [{ x: -20, z: 0 }],
    minObstacleDist: 2.5,
  });
  const distFromCenter = Math.hypot(pos.x, pos.z);
  const distFromPlayer = Math.hypot(pos.x - 18, pos.z);
  assert.ok(distFromCenter >= 16.9 && distFromCenter <= 37.1);
  assert.ok(distFromPlayer >= 13.5);
});

test('expanded wildlife roster includes rare, epic & mythic creatures with small spawn chances and active caps', () => {
  assert.equal(WILDLIFE_SPECIES_ORDER.length, 11);
  assert.equal(SPECIES_SPECS.lynx.rarity, 'uncommon');
  assert.equal(SPECIES_SPECS.polar_bear.rarity, 'rare');
  assert.equal(SPECIES_SPECS.frost_stag.rarity, 'rare');
  assert.equal(SPECIES_SPECS.musk_ox.rarity, 'rare');
  assert.equal(SPECIES_SPECS.mammoth.rarity, 'epic');
  assert.equal(SPECIES_SPECS.sabertooth.rarity, 'epic');
  assert.equal(SPECIES_SPECS.aurora_fenrir.rarity, 'mythic');

  const emptyRareCounts = {
    hare: 6,
    fox: 5,
    stag: 5,
    wolf: 4,
    lynx: 1,
    polar_bear: 0,
    frost_stag: 0,
    musk_ox: 0,
    mammoth: 0,
    sabertooth: 0,
    aurora_fenrir: 0,
  };

  // Very small roll selects Mythic Aurora Frost-Fenrir
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.01), 'aurora_fenrir');
  // Epic rolls select Mammoth and Sabertooth
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.03), 'mammoth');
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.06), 'sabertooth');
  // Rare rolls select Polar Bear, Frosthorn Stag, or Tundra Musk Ox
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.1), 'polar_bear');
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.18), 'frost_stag');
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.26), 'musk_ox');
  // Standard roll backfills missing uncommon Snow Lynx
  assert.equal(pickDynamicWildlifeSpawn(emptyRareCounts, () => 0.65), 'lynx');

  // When rare/epic/mythic are at maxActive (1), even low rolls do not duplicate them
  const cappedRareCounts = {
    ...emptyRareCounts,
    polar_bear: 1,
    frost_stag: 1,
    musk_ox: 1,
    mammoth: 1,
    sabertooth: 1,
    aurora_fenrir: 1,
    lynx: 2,
  };
  assert.equal(pickDynamicWildlifeSpawn(cappedRareCounts, () => 0.01), null);
});

test('Level 2 wildlife spawns around northern Level 2 center and boosts apex species', () => {
  const pos = pickWildlifeSpawnPoint({
    minR: 18,
    maxR: 60,
    centerX: 0,
    centerZ: -240,
    playerX: 0,
    playerZ: -180,
    minPlayerDist: 16,
  });
  const distFromL2Center = Math.hypot(pos.x, pos.z + 240);
  const distFromPlayer = Math.hypot(pos.x, pos.z + 180);
  assert.ok(distFromL2Center >= 17.9 && distFromL2Center <= 60.1);
  assert.ok(distFromPlayer >= 15.9);

  const l2Spawn = pickDynamicWildlifeSpawn({}, () => 0.99, 0.5, 'level2');
  assert.ok(l2Spawn !== null);

  const habitatPos = pickHabitatRespawnPoint({
    kind: 'wolf',
    zone: 'level1',
    centerX: 0,
    centerZ: 0,
    zoneRadius: 116,
    hearthX: 0,
    hearthZ: 0,
    portalX: 0,
    portalZ: -102,
    cityPortalX: 102,
    cityPortalZ: 0,
    playerX: 0,
    playerZ: 0,
    minPlayerDist: 20,
    rng: () => 0.5,
  });
  assert.ok(Math.hypot(habitatPos.x, habitatPos.z) >= 20);
  assert.ok(Math.hypot(habitatPos.x, habitatPos.z) <= 116);
});
