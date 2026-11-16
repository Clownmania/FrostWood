import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_RESPAWN_SECONDS,
  ZONE_BOSS_BY_ZONE,
  ZONE_BOSS_ORDER,
  ZONE_BOSS_SPECS,
  computeArenaContainment,
  computeBossKinematicPose,
  computeBossLootReward,
  computeBossTacticalMovement,
  getZoneBossSpec,
  isBossEnraged,
  rollMeteorTargets,
  rollTacticalAoEPatternPoints,
  selectNextBossAttack,
} from './bosses.ts';
import { CITY_QUEST_NPC, CITY_TRADERS, CITY_TRADER_ORDER } from './city.ts';
import { ALL_CRAFT_RECIPES } from './crafting.ts';
import { CITY_CENTER_X, CITY_CENTER_Z, SURVIVAL_ZONE_ORDER, ZONE_SPECS } from './zones.ts';

test('each of the 6 zones has a unique dedicated boss encounter with distinct arena and 4 tactical attack patterns', () => {
  assert.equal(ZONE_BOSS_ORDER.length, 6);
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
    assert.equal(spec.patterns.length, 4, `${spec.name} should have 4 tactical attack patterns`);
    assert.ok(
      spec.patterns.some((p) => p.kind === 'cross_eruption' || p.kind === 'ring_wave'),
      `${spec.name} should include a multi-zone tactical AoE spell`,
    );
    assert.equal(spec.respawnSeconds, BOSS_RESPAWN_SECONDS);

    // Verify boss arena fits cleanly inside its expanded zone radius
    const zSpec = ZONE_SPECS[spec.zone];
    const distFromZoneCenter = Math.hypot(spec.arenaX - zSpec.centerX, spec.arenaZ - zSpec.centerZ);
    assert.ok(
      distFromZoneCenter + spec.leashRadius <= zSpec.radius,
      `${spec.name} arena should fit inside ${spec.zone} radius`,
    );
  }

  // Verify survival zone bosses escalate HP and reward gold across Level 1 -> Level 5
  for (let i = 1; i < SURVIVAL_ZONE_ORDER.length; i++) {
    const prevBoss = getZoneBossSpec(SURVIVAL_ZONE_ORDER[i - 1]);
    const currBoss = getZoneBossSpec(SURVIVAL_ZONE_ORDER[i]);
    assert.ok(currBoss.maxHp > prevBoss.maxHp, `${currBoss.name} should have more HP than ${prevBoss.name}`);
    assert.ok(
      currBoss.reward.gold > prevBoss.reward.gold,
      `${currBoss.name} should drop more gold than ${prevBoss.name}`,
    );
  }
});

test('zone boss arenas remain safely separated from camp hearth, portals, and Frostcave City traders', () => {
  for (const zoneId of SURVIVAL_ZONE_ORDER) {
    const boss = getZoneBossSpec(zoneId);
    const zSpec = ZONE_SPECS[zoneId];
    const distToHearth = Math.hypot(boss.arenaX - zSpec.hearthX, boss.arenaZ - zSpec.hearthZ);
    assert.ok(
      distToHearth > zSpec.clearingRadius + boss.engageRadius,
      `${boss.name} should be safely separated from ${zoneId} hearth`,
    );
    const distToPortal = Math.hypot(boss.arenaX - zSpec.portalX, boss.arenaZ - zSpec.portalZ);
    assert.ok(distToPortal > 25, `${boss.name} should be separated from ${zoneId} portal`);
  }

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
  assert.ok(
    midPattern.id === 'bark_barrage' ||
      midPattern.id === 'tremor_charge' ||
      midPattern.id === 'briar_fissure_cross',
  );

  const ignis = getZoneBossSpec('city');
  const p0 = selectNextBossAttack(ignis, 10, true, 0);
  const p1 = selectNextBossAttack(ignis, 10, true, 1);
  assert.notEqual(p0.id, p1.id);
});

test('boss arena containment leashes positions back inside arena boundary and tactical AoE hazard points stay bounded', () => {
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

  const crossPts = rollTacticalAoEPatternPoints(
    'cross_eruption',
    spec.arenaX,
    spec.arenaZ,
    spec.arenaX + 6,
    spec.arenaZ + 4,
    false,
    spec,
  );
  const crossEnragedPts = rollTacticalAoEPatternPoints(
    'cross_eruption',
    spec.arenaX,
    spec.arenaZ,
    spec.arenaX + 6,
    spec.arenaZ + 4,
    true,
    spec,
  );
  assert.equal(crossPts.length, 8);
  assert.equal(crossEnragedPts.length, 16);
  for (const pt of crossEnragedPts) {
    assert.ok(Math.hypot(pt.x - spec.arenaX, pt.z - spec.arenaZ) <= spec.leashRadius + 0.001);
  }

  const ringPts = rollTacticalAoEPatternPoints(
    'ring_wave',
    spec.arenaX,
    spec.arenaZ,
    spec.arenaX + 5,
    spec.arenaZ - 3,
    true,
    spec,
  );
  assert.equal(ringPts.length, 9);
  for (const pt of ringPts) {
    assert.ok(Math.hypot(pt.x - spec.arenaX, pt.z - spec.arenaZ) <= spec.leashRadius + 0.001);
  }
});

test('computeBossTacticalMovement and computeBossKinematicPose produce realistic tactical steering and articulated leg/arm poses', () => {
  const veyra = getZoneBossSpec('level2');
  const kiteMove = computeBossTacticalMovement({
    spec: veyra,
    bossX: veyra.arenaX,
    bossZ: veyra.arenaZ,
    playerX: veyra.arenaX,
    playerZ: veyra.arenaZ + 2.8,
    playerVx: 0,
    playerVz: 0,
    enraged: false,
    cooldownLeft: 1.2,
    strafeSign: 1,
    animPhase: 1.0,
  });
  assert.equal(kiteMove.tacticLabel, 'Tactical Kite');
  assert.ok(kiteMove.vz < 0, 'Caster boss should backpedal away when crowded on cooldown');

  const skarn = getZoneBossSpec('level1');
  const flankMove = computeBossTacticalMovement({
    spec: skarn,
    bossX: skarn.arenaX,
    bossZ: skarn.arenaZ,
    playerX: skarn.arenaX,
    playerZ: skarn.arenaZ + 5.2,
    playerVx: 0,
    playerVz: 0,
    enraged: false,
    cooldownLeft: 1.2,
    strafeSign: 1,
    animPhase: 1.0,
  });
  assert.equal(flankMove.tacticLabel, 'Flank Orbit');
  assert.ok(Math.abs(flankMove.vx) > 1.5, 'Boss should orbit laterally when flanking');

  const interceptMove = computeBossTacticalMovement({
    spec: skarn,
    bossX: skarn.arenaX,
    bossZ: skarn.arenaZ,
    playerX: skarn.arenaX + 12,
    playerZ: skarn.arenaZ + 12,
    playerVx: 4.5,
    playerVz: -2.0,
    enraged: true,
    cooldownLeft: 0.2,
    strafeSign: -1,
    animPhase: 2.0,
  });
  assert.equal(interceptMove.tacticLabel, 'Intercept Rush');
  assert.ok(interceptMove.strideSpeed > skarn.moveSpeed);

  const walkPose = computeBossKinematicPose({
    bossId: 'skarn_colossus',
    state: 'engage',
    attackKind: null,
    animPhase: Math.PI / 3,
    strideSpeed: 3.6,
    stateTimer: 0,
    windupSeconds: 0.7,
    enraged: false,
  });
  assert.ok(walkPose.leftLegX > 0.2 && walkPose.rightLegX < -0.2);
  assert.ok(walkPose.bodyPitchX > 0.05);

  const castPose = computeBossKinematicPose({
    bossId: 'skarn_colossus',
    state: 'telegraph',
    attackKind: 'cross_eruption',
    animPhase: 1.2,
    strideSpeed: 0.3,
    stateTimer: 0.1,
    windupSeconds: 0.8,
    enraged: true,
  });
  assert.ok(castPose.leftArmX < -1.5 && castPose.rightArmX < -1.5);
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

    assert.ok(highGearReward.resourcesDelta.gold > baseReward.resourcesDelta.gold);
    assert.ok(highGearReward.resourcesDelta.wood > baseReward.resourcesDelta.wood);
    assert.ok(highGearReward.huntingXp > baseReward.huntingXp);
    assert.ok(highGearReward.items.length > baseReward.items.length);
  }
});

