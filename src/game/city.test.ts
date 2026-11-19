import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITY_AMBIENT_NPCS,
  CITY_OFFERS,
  CITY_TRADERS,
  CITY_TRADER_ORDER,
  canBuyCityOffer,
  findNearestCityTrader,
  getOffersForTrader,
  purchaseCityOffer,
  sellMeatForGold,
} from './city';
import { createInitialBackpackInventory } from './inventory';
import {
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  ZONE_SPECS,
  computeCityPortalProximity,
  computeNearestZonePortal,
  getDestinationAfterPortal,
} from './zones';

test('Frosthaven City traders offer goods purchasable with Coins and Meat', () => {
  assert.equal(CITY_TRADER_ORDER.length, 4);
  for (const id of CITY_TRADER_ORDER) {
    assert.ok(CITY_TRADERS[id]);
    const offers = getOffersForTrader(id);
    assert.ok(offers.length >= 3, `${id} should have multiple offers`);
    for (const offer of offers) {
      assert.ok(offer.cost.gold > 0, `${offer.id} should cost gold`);
      assert.ok((offer.cost.meat ?? 0) > 0, `${offer.id} should accept meat`);
    }
  }

  const inv = createInitialBackpackInventory();
  const insufficient = purchaseCityOffer({
    resources: { wood: 0, pelts: 0, gold: 50, meat: 0 },
    inventory: inv,
    maxItems: 14,
    offerId: 'tinker_gear_pair',
  });
  assert.equal(insufficient, null);

  const tinkerGearOffer = CITY_OFFERS.find((o) => o.id === 'tinker_gear_pair')!;
  const checkDenied = canBuyCityOffer({
    resources: { wood: 0, pelts: 0, gold: 50, meat: 0 },
    inventory: inv,
    maxItems: 14,
    offer: tinkerGearOffer,
  });
  assert.equal(checkDenied.ok, false);
  assert.match(checkDenied.reason ?? '', /Meat/i);

  const bought = purchaseCityOffer({
    resources: { wood: 5, pelts: 2, gold: 80, meat: 6 },
    inventory: inv,
    maxItems: 14,
    offerId: 'tinker_gear_pair',
  });
  assert.ok(bought);
  assert.equal(bought.inventory.clockwork_gear, 2);
  assert.equal(bought.resources.gold, 80 - tinkerGearOffer.cost.gold);
  assert.equal(bought.resources.meat, 6 - (tinkerGearOffer.cost.meat ?? 0));
});

test('selling meat in Frosthaven City awards coins and scales with trade multiplier', () => {
  const sold = sellMeatForGold({ wood: 0, pelts: 0, gold: 20, meat: 5 }, 3, 1);
  assert.equal(sold.meatSold, 3);
  assert.equal(sold.goldGained, 36);
  assert.equal(sold.resources.meat, 2);
  assert.equal(sold.resources.gold, 56);

  const boosted = sellMeatForGold({ wood: 0, pelts: 0, gold: 0, meat: 4 }, 2, 1.25);
  assert.equal(boosted.goldGained, 30);
});

test('city portal routing & nearest trader detection work smoothly', () => {
  assert.ok(CITY_AMBIENT_NPCS.length >= 4);
  const atCityGate = computeCityPortalProximity(LEVEL1_CITY_PORTAL_X - 1.5, LEVEL1_CITY_PORTAL_Z, 'level1');
  assert.equal(atCityGate.nearInteract, true);
  const route = computeNearestZonePortal(LEVEL1_CITY_PORTAL_X - 0.5, LEVEL1_CITY_PORTAL_Z, 'level1');
  assert.equal(route.route, 'to_city');

  const toCity = getDestinationAfterPortal('level1', 'to_city');
  assert.equal(toCity.zone, 'city');
  assert.ok(toCity.x > ZONE_SPECS.city.portalX + 2);

  const backHome = getDestinationAfterPortal('city');
  assert.equal(backHome.zone, 'level1');
  assert.ok(backHome.x < LEVEL1_CITY_PORTAL_X - 2);

  const butcher = CITY_TRADERS.butcher;
  const found = findNearestCityTrader(butcher.npcX + 1.2, butcher.npcZ + 1.0);
  assert.ok(found);
  assert.equal(found.trader.id, 'butcher');
});

test('City Daily Quest NPC Valkyra Emberwing requires 30 Daily Quests to unlock Wings of Fire', async () => {
  const {
    WINGS_DAILY_QUEST_REQUIREMENT,
    createCityDailyQuest,
    recordCityDailyQuestKill,
    canCompleteCityDailyQuest,
    completeCityDailyQuest,
  } = await import('./city');

  assert.equal(WINGS_DAILY_QUEST_REQUIREMENT, 30);

  // Quest #1 awards loot and increments Flame Record, without unlocking Wings yet
  const q1 = createCityDailyQuest(1, 0, 0);
  assert.equal(q1.rewardWingsTier, 0);
  assert.equal(q1.completed, false);

  const poor = { wood: 0, pelts: 0, meat: 0, gold: 10 };
  assert.equal(canCompleteCityDailyQuest(q1, poor).ok, false);

  let progressed = q1;
  for (let i = 0; i < q1.targetKills; i++) {
    progressed = recordCityDailyQuestKill(progressed, 1).quest;
  }
  assert.equal(canCompleteCityDailyQuest(progressed, poor).ok, true);

  const claimedFirst = completeCityDailyQuest({
    quest: progressed,
    resources: poor,
    currentWingsTier: 0,
    completedQuestsCount: 0,
  });
  assert.ok(claimedFirst);
  assert.equal(claimedFirst.wingsTier, 0);
  assert.equal(claimedFirst.wingsUnlockedNow, false);
  assert.equal(claimedFirst.completedQuestsCount, 1);
  assert.equal(claimedFirst.quest.completed, true);
  assert.ok(claimedFirst.resources.gold > poor.gold);

  // Quest #30 (completedQuestsCount = 29 -> 30) bestows Wings of Fire Tier 1
  const q30 = createCityDailyQuest(5, 0, 29);
  assert.equal(q30.rewardWingsTier, 1);
  let progressed30 = q30;
  for (let i = 0; i < q30.targetKills; i++) {
    progressed30 = recordCityDailyQuestKill(progressed30, 1).quest;
  }
  const claimed30 = completeCityDailyQuest({
    quest: progressed30,
    resources: poor,
    currentWingsTier: 0,
    completedQuestsCount: 29,
  });
  assert.ok(claimed30);
  assert.equal(claimed30.completedQuestsCount, 30);
  assert.equal(claimed30.wingsTier, 1);
  assert.equal(claimed30.wingsUnlockedNow, true);
});

test('Frostcave City spawns randomized high-quality chibi NPCs with consistent skeletal rigs and varied PBR material sets', async () => {
  const {
    CITY_CHIBI_PBR_MATERIAL_SETS,
    generateCityNpcSpawnManifest,
  } = await import('./city');

  assert.ok(CITY_CHIBI_PBR_MATERIAL_SETS.length >= 7);
  for (const matSet of CITY_CHIBI_PBR_MATERIAL_SETS) {
    assert.ok(matSet.roughnessMin > 0 && matSet.roughnessMax <= 1);
    assert.ok(matSet.roughnessMin < matSet.roughnessMax);
    assert.ok(matSet.metalnessMax >= 0 && matSet.metalnessMax <= 1);
    assert.ok(matSet.envMapIntensity > 0);
  }

  // Deterministic LCG RNG to verify variety and consistency
  let seedA = 42;
  const rngA = () => {
    seedA = (seedA * 1664525 + 1013904223) >>> 0;
    return seedA / 0x100000000;
  };
  let seedB = 987654321;
  const rngB = () => {
    seedB = (seedB * 1664525 + 1013904223) >>> 0;
    return seedB / 0x100000000;
  };

  const manifestA = generateCityNpcSpawnManifest(rngA);
  const manifestB = generateCityNpcSpawnManifest(rngB);

  // All 4 traders get distinct chibi silhouettes, consistent Rig_Medium skeleton, and distinct PBR sets
  const traderArchIds = new Set<string>();
  const traderMatIds = new Set<string>();
  for (const id of CITY_TRADER_ORDER) {
    const tr = manifestA.traders[id];
    assert.equal(tr.rigProfile, 'kaykit_rig_medium_chibi');
    assert.ok(tr.archetype.spec.url.endsWith('.glb'));
    traderArchIds.add(tr.archetype.id);
    traderMatIds.add(tr.materialSet.id);
  }
  assert.equal(traderArchIds.size, CITY_TRADER_ORDER.length);
  assert.equal(traderMatIds.size, CITY_TRADER_ORDER.length);

  // All patrolling citizens use consistent chibi rig profile with varied PBR material sets & archetypes
  assert.equal(manifestA.citizens.length, CITY_AMBIENT_NPCS.length);
  const citizenMatIds = new Set<string>();
  for (let i = 0; i < manifestA.citizens.length; i++) {
    const c = manifestA.citizens[i];
    assert.equal(c.rigProfile, 'kaykit_rig_medium_chibi');
    citizenMatIds.add(c.materialSet.id);
    if (i > 0) {
      assert.notEqual(c.archetype.id, manifestA.citizens[i - 1].archetype.id);
    }
  }
  assert.ok(citizenMatIds.size >= 3);

  // Valkyra Emberwing uses herald PBR regalia + wings on consistent chibi rig
  assert.equal(manifestA.questHerald.rigProfile, 'kaykit_rig_medium_chibi');
  assert.equal(manifestA.questHerald.materialSet.id, 'ember_herald_regalia');
  assert.equal(manifestA.questHerald.attachWings, true);
  assert.notEqual(manifestA.questHerald.archetype.id, 'barbarian');

  // Different RNG seeds produce randomized variation across city spawns
  const sigA = manifestA.citizens.map((c) => `${c.archetype.id}:${c.materialSet.id}`).join('|');
  const sigB = manifestB.citizens.map((c) => `${c.archetype.id}:${c.materialSet.id}`).join('|');
  assert.notEqual(sigA, sigB);
});


