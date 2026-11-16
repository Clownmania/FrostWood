import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_RESPAWN_SECONDS,
  ZONE_BOSS_BY_ZONE,
  ZONE_BOSS_ORDER,
  ZONE_BOSS_SPECS,
  computeArenaContainment,
  computeBossLootReward,
  getZoneBossSpec,
  isBossEnraged,
  rollMeteorTargets,
  selectNextBossAttack,
} from './bosses.ts';
import { CITY_QUEST_NPC, CITY_TRADERS, CITY_TRADER_ORDER } from './city.ts';
import { ALL_CRAFT_RECIPES } from './crafting.ts';
import { CITY_CENTER_X, CITY_CENTER_Z, ZONE_SPECS } from './zones.ts';

test('each of the 3 zones has a unique dedicated boss encounter with distinct arena and 3+ attack patterns', () => {
  assert.equal(ZONE_BOSS_ORDER.length, 3);
  const seenZones = new Set<string>();
  const seenIds = new Set<string>();

  for (const id of ZONE_BOSS_ORDER) {
    const spec = ZONE_BOSS_SPECS[id];
    assert.ok(spec, `Missing spec for ${id}`);
    assert.ok(!seenZones.has(spec.zone), `Duplicate zone ${spec.zone}`);
    assert.ok(!seenIds.has(spec.id), `Duplicate id ${spec.id}`);
    seenZones.add(spec.zone);
    seenIds.add(spec.id);

    assert.equal(ZONE_BOSS_BY_ZONE[spec.zone], spec.id);
    assert.equal(getZoneBossSpec(spec.zone).id, spec.id);
    assert.ok(spec.maxHp >= 750);
    assert.ok(spec.patterns.length >= 3, `${spec.name} should have at least 3 attack patterns`);
    assert.equal(spec.respawnSeconds, BOSS_RESPAWN_SECONDS);
  }
});

test('zone boss arenas remain safely separated from camp hearth, portals, and Frostcave City traders', () => {
  const s1 = ZONE_BOSS_SPECS.skarn_colossus;
  const distToCamp = Math.hypot(s1.arenaX, s1.arenaZ);
  assert.ok(distToCamp > ZONE_SPECS.level1.clearingRadius + s1.engageRadius);
  assert.ok(
    Math.hypot(s1.arenaX - ZONE_SPECS.level1.portalX, s1.arenaZ - ZONE_SPECS.level1.portalZ) > 25,
  );

  const s2 = ZONE_BOSS_SPECS.veyra_sovereign;
  const distToHearth2 = Math.hypot(
    s2.arenaX - ZONE_SPECS.level2.hearthX,
    s2.arenaZ - ZONE_SPECS.level2.hearthZ,
  );
  assert.ok(distToHearth2 > 60);

  const sCity = ZONE_BOSS_SPECS.ignis_warden;
  const distToCityPlaza = Math.hypot(sCity.arenaX - CITY_CENTER_X, sCity.arenaZ - CITY_CENTER_Z);
  assert.ok(distToCityPlaza > ZONE_SPECS.city.clearingRadius);
  for (const traderId of CITY_TRADER_ORDER) {
    const tr = CITY_TRADERS[traderId];
    assert.ok(Math.hypot(sCity.arenaX - tr.npcX, sCity.arenaZ - tr.npcZ) > 30);
  }
  assert.ok(Math.hypot(sCity.arenaX - CITY_QUEST_NPC.x, sCity.arenaZ - CITY_QUEST_NPC.z) > 30);
});

test('boss enrage activates cleanly at or below 50% HP and expands attack capabilities', () => {
  assert.equal(isBossEnraged(501, 1000), false);
  assert.equal(isBossEnraged(500, 1000), true);
  assert.equal(isBossEnraged(120, 1000), true);
  assert.equal(isBossEnraged(0, 1000), false);

  const skarn = getZoneBossSpec('level1');
  const closePattern = selectNextBossAttack(skarn, 2.5, false, 0);
  assert.equal(closePattern.kind, 'aoe');
  const midPattern = selectNextBossAttack(skarn, 11, true, 1);
  assert.ok(midPattern.id === 'bark_barrage' || midPattern.id === 'tremor_charge');

  const ignis = getZoneBossSpec('city');
  const p0 = selectNextBossAttack(ignis, 10, true, 0);
  const p1 = selectNextBossAttack(ignis, 10, true, 1);
  assert.notEqual(p0.id, p1.id);
});

test('boss arena containment leashes positions back inside arena boundary and meteor targets stay bounded', () => {
  const spec = getZoneBossSpec('level2');
  const inside = computeArenaContainment(spec.arenaX + 5, spec.arenaZ - 4, spec);
  assert.equal(inside.leashed, false);

  const far = computeArenaContainment(spec.arenaX + 100, spec.arenaZ, spec);
  assert.equal(far.leashed, true);
  assert.ok(
    Math.hypot(far.x - spec.arenaX, far.z - spec.arenaZ) <= spec.leashRadius + 0.001,
  );

  const meteors = rollMeteorTargets(spec.arenaX, spec.arenaZ, 3, spec, () => 0.5);
  assert.equal(meteors.length, 3);
  for (const m of meteors) {
    assert.ok(Math.hypot(m.x - spec.arenaX, m.z - spec.arenaZ) <= spec.leashRadius + 0.001);
  }
});

test('every zone boss awards valid high-tier craftable items and scales loot with player zone and gear level', () => {
  for (const id of ZONE_BOSS_ORDER) {
    const spec = ZONE_BOSS_SPECS[id];
    const baseReward = computeBossLootReward(spec, { zone: spec.zone, gearLevel: 1 }, () => 0.5);
    const highGearReward = computeBossLootReward(
      spec,
      { zone: spec.zone, gearLevel: 5 },
      () => 0.5,
    );

    assert.ok(baseReward.resourcesDelta.gold >= 400);
    assert.ok(baseReward.huntingXp >= 60);
    assert.ok(baseReward.items.length >= 3);
    for (const drop of baseReward.items) {
      assert.ok(
        ALL_CRAFT_RECIPES.some((r) => r.id === drop.id),
        `Unknown craft drop item ${drop.id}`,
      );
      assert.ok(drop.qty >= 1);
    }

    // Higher gear level yields more gold, resources, XP, and bonus item slots
    assert.ok(highGearReward.resourcesDelta.gold > baseReward.resourcesDelta.gold);
    assert.ok(highGearReward.resourcesDelta.wood > baseReward.resourcesDelta.wood);
    assert.ok(highGearReward.huntingXp > baseReward.huntingXp);
    assert.ok(highGearReward.items.length > baseReward.items.length);
  }
});

