import assert from 'node:assert/strict';
import test from 'node:test';
import { spendResources } from './economy';
import {
  GEAR_SET_BONUSES,
  GEAR_SLOT_ORDER,
  GEAR_TIERS,
  MAX_GEAR_TIER,
  canUpgradeGearSlot,
  computeGearBonuses,
  computeGearSetBonus,
  createInitialGearLevels,
  equipGearSlot,
  getGearSlotSpec,
  getMinimumGearTier,
  getNextGearSetBonus,
  getNextGearUpgrade,
  unequipGearSlot,
} from './gear';
import {
  BASE_BACKPACK_CAPACITY,
  computeBackpackCapacity,
  createInitialSkillsState,
} from './skills';

test('initial gear starts at tier 1 across all 4 slots with baseline bonuses', () => {
  const gear = createInitialGearLevels();
  for (const slot of GEAR_SLOT_ORDER) {
    assert.equal(gear[slot], 1);
    assert.equal(GEAR_TIERS[slot].length, MAX_GEAR_TIER);
  }
  const bonuses = computeGearBonuses(gear);
  assert.equal(bonuses.maxHp, 100);
  assert.equal(bonuses.maxWarmth, 100);
  assert.equal(bonuses.coldDecayMult, 1);
  assert.equal(bonuses.moveSpeedMult, 1);
  assert.equal(bonuses.damageMult, 1);
  assert.equal(bonuses.cooldownMult, 1);
  assert.equal(bonuses.packCapacityBonus, 0);
  assert.equal(bonuses.magnetRadiusBonus, 0);
  assert.equal(bonuses.setTier, 1);
  assert.equal(computeGearSetBonus(gear), null);
  assert.equal(getNextGearSetBonus(gear)?.minTier, 2);
});

test('each gear slot scales progressively from common tier 1 to mythic tier 5', () => {
  for (const slot of GEAR_SLOT_ORDER) {
    const specs = GEAR_TIERS[slot];
    assert.equal(specs[0].rarity, 'common');
    assert.equal(specs[1].rarity, 'uncommon');
    assert.equal(specs[2].rarity, 'rare');
    assert.equal(specs[3].rarity, 'epic');
    assert.equal(specs[4].rarity, 'mythic');
    for (let i = 1; i < specs.length; i++) {
      assert.ok(specs[i].cost.gold > specs[i - 1].cost.gold);
    }
  }
});

test('upgrading coat, boots, gloves, and pack increases respective bonuses and checks affordability', () => {
  const gear = createInitialGearLevels();
  const nextPack = getNextGearUpgrade('pack', gear);
  assert.ok(nextPack);
  assert.equal(nextPack.tier, 2);

  const poor = { wood: 5, pelts: 1, stone: 0, ice: 0, gold: 5 };
  assert.equal(canUpgradeGearSlot(poor, gear, 'pack'), false);

  const rich = { wood: 100, pelts: 40, stone: 30, ice: 15, gold: 500 };
  assert.equal(canUpgradeGearSlot(rich, gear, 'pack'), true);
  const spent = spendResources(rich, nextPack.cost);
  assert.ok(spent);

  gear.pack = 3;
  gear.boots = 4;
  gear.gloves = 5;
  gear.coat = 4;

  const bonuses = computeGearBonuses(gear);
  assert.equal(bonuses.maxHp, 240);
  assert.equal(bonuses.maxWarmth, 190);
  assert.equal(bonuses.moveSpeedMult, 1.25);
  assert.ok(bonuses.damageMult >= 1.55);
  assert.equal(bonuses.cooldownMult, 0.7);
  assert.equal(bonuses.packCapacityBonus, 60);
  assert.equal(bonuses.magnetRadiusBonus, 1.3);

  const skills = createInitialSkillsState();
  assert.equal(
    computeBackpackCapacity(skills, 1, bonuses.packCapacityBonus),
    BASE_BACKPACK_CAPACITY + 60,
  );
});

test('gear set bonus activates only when all 4 slots reach the minimum tier threshold', () => {
  const gear = { coat: 5, boots: 5, gloves: 5, pack: 1 };
  assert.equal(computeGearSetBonus(gear), null);

  gear.pack = 2;
  const set2 = computeGearSetBonus(gear);
  assert.ok(set2);
  assert.equal(set2.minTier, 2);
  assert.equal(set2.name, GEAR_SET_BONUSES[0].name);
  assert.equal(getNextGearSetBonus(gear)?.minTier, 3);

  gear.coat = 5;
  gear.boots = 5;
  gear.gloves = 5;
  gear.pack = 5;
  const set5 = computeGearSetBonus(gear);
  assert.ok(set5);
  assert.equal(set5.minTier, 5);
  assert.equal(set5.rarity, 'mythic');
  assert.equal(getNextGearSetBonus(gear), null);
  assert.equal(getNextGearUpgrade('coat', gear), null);
  assert.equal(getGearSlotSpec('coat', 99).tier, 5);
});

test('removing and equipping gear slots updates bonuses, set tier, and preserves owned tier', () => {
  const unlocked = { coat: 3, boots: 2, gloves: 2, pack: 3 };
  let equipped = { ...unlocked };
  assert.equal(getMinimumGearTier(equipped), 2);
  assert.ok(computeGearSetBonus(equipped));

  equipped = unequipGearSlot(equipped, 'coat');
  assert.equal(equipped.coat, 0);
  assert.equal(getMinimumGearTier(equipped), 0);
  assert.equal(computeGearSetBonus(equipped), null);
  const unarmored = computeGearBonuses(equipped);
  assert.equal(unarmored.maxHp, 85);
  assert.equal(unarmored.maxWarmth, 85);

  equipped = unequipGearSlot(equipped, 'pack');
  assert.equal(computeGearBonuses(equipped).packCapacityBonus, 0);

  equipped = equipGearSlot(equipped, unlocked, 'coat');
  equipped = equipGearSlot(equipped, unlocked, 'pack');
  assert.equal(equipped.coat, 3);
  assert.equal(equipped.pack, 3);
  assert.equal(getMinimumGearTier(equipped), 2);
  assert.ok(computeGearSetBonus(equipped));
});
