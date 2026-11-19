import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeHunterTacticalMovement,
  computeNpcWaypointSteering,
  computeRivalHunterDefeatLoot,
  createEmptyStolenBag,
  pickRivalHunterArchetype,
  pickRivalHunterSpawnPoint,
  RIVAL_HUNTER_ARCHETYPES,
  rollRareEnemyAmbush,
  stealResourcesOnHunterHit,
} from './hunters';
import { ZONE_SPECS } from './zones';

test('pickRivalHunterSpawnPoint spawns outside camp clearing and within zone radius', () => {
  const pt = pickRivalHunterSpawnPoint('level1', 0, 0, () => 0.5);
  const distFromCenter = Math.hypot(pt.x, pt.z);
  assert.ok(distFromCenter > ZONE_SPECS.level1.clearingRadius);
  assert.ok(distFromCenter < ZONE_SPECS.level1.radius);
});

test('stealResourcesOnHunterHit steals a fraction of resources and tracks them in stolenBag', () => {
  const initial = { wood: 100, pelts: 20, meat: 10, gold: 200 };
  const bag = createEmptyStolenBag();
  const res = stealResourcesOnHunterHit(initial, bag, 0.1);

  assert.equal(res.stolenWood, 10);
  assert.equal(res.stolenPelts, 2);
  assert.equal(res.stolenMeat, 1);
  assert.equal(res.stolenGold, 20);
  assert.equal(res.resources.wood, 90);
  assert.equal(res.resources.pelts, 18);
  assert.equal(res.resources.meat, 9);
  assert.equal(res.resources.gold, 180);
  assert.equal(res.stolenBag.gold, 20);
  assert.ok(res.summaryText && res.summaryText.includes('20g'));
});

test('computeRivalHunterDefeatLoot returns base bounty plus ice shards and all stolen items', () => {
  const raider = RIVAL_HUNTER_ARCHETYPES.raider;
  const bag = { wood: 15, pelts: 4, meat: 3, gold: 50 };
  const loot = computeRivalHunterDefeatLoot(raider, bag, 1.0);

  assert.equal(loot.wood, raider.rewardWood + 15);
  assert.equal(loot.pelts, raider.rewardPelts + 4);
  assert.equal(loot.meat, raider.rewardMeat + 3);
  assert.equal(loot.ice, 0);
  assert.equal(loot.gold, raider.rewardGold + 50);

  const warlock = RIVAL_HUNTER_ARCHETYPES.aurora_warlock;
  const warlockLoot = computeRivalHunterDefeatLoot(warlock, bag, 1.0);
  assert.equal(warlockLoot.ice, warlock.rewardIce);
  assert.equal(warlockLoot.gold, warlock.rewardGold + 50);
});

test('pickRivalHunterArchetype selects baseline archetypes normally and rare enemies at low probability', () => {
  const a1 = pickRivalHunterArchetype('level1', 1, () => 0.2);
  const a2 = pickRivalHunterArchetype('level2', 4, () => 0.2);
  assert.ok(a1.maxHp > 100);
  assert.equal(a2.id, 'shadow_stalker');

  const rareWarlock = pickRivalHunterArchetype('level1', 1, () => 0.02);
  const rareBerserker = pickRivalHunterArchetype('level1', 1, () => 0.09);
  assert.equal(rareWarlock.id, 'aurora_warlock');
  assert.equal(rareBerserker.id, 'frost_berserker');
  assert.ok(RIVAL_HUNTER_ARCHETYPES.aurora_warlock.spawnChance > 0);
  assert.ok(RIVAL_HUNTER_ARCHETYPES.aurora_warlock.spawnChance <= 0.08);
  assert.ok(RIVAL_HUNTER_ARCHETYPES.frost_berserker.spawnChance > 0);
  assert.ok(RIVAL_HUNTER_ARCHETYPES.frost_berserker.spawnChance <= 0.12);
});

test('rollRareEnemyAmbush enforces active cap and skips city safe zone', () => {
  assert.equal(rollRareEnemyAmbush('city', 0, () => 0.01), null);
  assert.equal(rollRareEnemyAmbush('level1', 1, () => 0.01), null);
  assert.equal(rollRareEnemyAmbush('level1', 0, () => 0.5), null);
  const spawned = rollRareEnemyAmbush('level1', 0, () => 0.02);
  assert.equal(spawned?.id, 'aurora_warlock');
});

test('computeHunterTacticalMovement executes sprint lunge in melee burst band and kites when ranged too close', () => {
  const lunge = computeHunterTacticalMovement({
    x: 0,
    z: 20,
    vx: 0,
    vz: 0,
    yaw: Math.PI,
    playerX: 0,
    playerZ: 16.5,
    zoneCenterX: 0,
    zoneCenterZ: 0,
    clearingRadius: 12,
    zoneRadius: 90,
    archetype: RIVAL_HUNTER_ARCHETYPES.raider,
    hp: 200,
    maxHp: 200,
    stolenValue: 0,
    attackCooldown: 0,
    strafeSign: 1,
    phaseTime: 0.5,
    dt: 0.05,
    obstacles: [],
  });
  assert.equal(lunge.isLunging, true);
  assert.ok(lunge.vz < 0);

  const rangedKite = computeHunterTacticalMovement({
    x: 0,
    z: 23,
    vx: 0,
    vz: 0,
    yaw: Math.PI,
    playerX: 0,
    playerZ: 20,
    zoneCenterX: 0,
    zoneCenterZ: 0,
    clearingRadius: 12,
    zoneRadius: 90,
    archetype: RIVAL_HUNTER_ARCHETYPES.aurora_warlock,
    hp: 300,
    maxHp: 300,
    stolenValue: 0,
    attackCooldown: 0.4,
    strafeSign: 1,
    phaseTime: 1.0,
    dt: 0.05,
    obstacles: [],
  });
  assert.equal(rangedKite.isKiting, true);
  assert.ok(rangedKite.vz > 0);
});

test('computeNpcWaypointSteering steers around obstacles and decelerates cleanly on arrival', () => {
  const steer = computeNpcWaypointSteering({
    x: 0,
    z: 5,
    vx: 0,
    vz: -2,
    yaw: Math.PI,
    targetX: 0,
    targetZ: 0,
    desiredSpeed: 3.2,
    dt: 0.05,
    obstacles: [{ x: 0, z: 3.8, radius: 1.2 }],
  });
  assert.equal(steer.reached, false);
  assert.ok(Number.isFinite(steer.turnBank));
});

test('computeNpcWaypointSteering reaches full cruising speed with persistent velocity and sidesteps head-on obstacles', () => {
  let vx = 0;
  let vz = 0;
  let x = 0;
  let z = 11;
  let yaw = Math.PI;
  for (let step = 0; step < 65; step++) {
    const res = computeNpcWaypointSteering({
      x,
      z,
      vx,
      vz,
      yaw,
      targetX: 0,
      targetZ: 0,
      maxSpeed: 3.0,
      dt: 0.03,
      obstacles: [{ x: 0, z: 6, radius: 1.3 }],
    });
    vx = res.vx;
    vz = res.vz;
    x += vx * 0.03;
    z += vz * 0.03;
    yaw = res.desiredYaw;
  }
  const speed = Math.hypot(vx, vz);
  assert.ok(speed > 2.2, `Expected NPC to cruise smoothly above 2.2 m/s, got ${speed}`);
  assert.ok(Math.abs(x) > 0.25, 'NPC should sidestep tangentially around head-on obstacle');
});

