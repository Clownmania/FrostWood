import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRAFT_RECIPES,
  INITIAL_BUFFS,
  applyCraftRecipe,
  canCraftRecipe,
  computeCraftChillScale,
  computeCraftDamageScale,
  computeCraftSpeedScale,
  getCraftRecipe,
  tickCraftBuffs,
} from './crafting';

test('crafting checks wood, stone, and pelt costs accurately', () => {
  const poor = { wood: 4, stone: 1, pelts: 2, gold: 0 };
  assert.equal(canCraftRecipe(poor, 'fire_starter'), false);
  assert.equal(canCraftRecipe(poor, 'insulated_boots'), false);

  const ready = { wood: 10, stone: 5, pelts: 5, gold: 0 };
  assert.equal(canCraftRecipe(ready, 'fire_starter'), true);
  assert.equal(canCraftRecipe(ready, 'insulated_boots'), true);

  const craftedFire = applyCraftRecipe({
    resources: ready,
    buffs: INITIAL_BUFFS,
    hp: 70,
    maxHp: 100,
    warmth: 30,
    maxWarmth: 100,
    id: 'fire_starter',
  });
  assert.ok(craftedFire);
  assert.equal(craftedFire.resources.wood, 4);
  assert.equal(craftedFire.resources.stone, 2);
  assert.equal(craftedFire.buffs.fireStarter, 30);
  assert.equal(craftedFire.hp, 82);
  assert.equal(craftedFire.warmth, 75);
});

test('fire starter and insulated boots mitigate blizzard chill and boost movement speed', () => {
  const baseBlizzardChill = computeCraftChillScale('blizzard', INITIAL_BUFFS);
  assert.equal(baseBlizzardChill, 1.0);
  assert.equal(computeCraftSpeedScale(INITIAL_BUFFS), 1.0);
  assert.equal(computeCraftDamageScale(INITIAL_BUFFS), 1.0);

  const withBoots = { ...INITIAL_BUFFS, insulatedBoots: 20 };
  const bootsChill = computeCraftChillScale('blizzard', withBoots);
  assert.ok(bootsChill <= 0.4);
  assert.ok(computeCraftSpeedScale(withBoots) > 1.2);

  const withBoth = { ...withBoots, fireStarter: 15, flintEdge: 12 };
  assert.ok(computeCraftChillScale('blizzard', withBoth) < bootsChill);
  assert.ok(computeCraftDamageScale(withBoth) > 1.3);

  const ticked = tickCraftBuffs(withBoth, 13);
  assert.equal(ticked.buffs.flintEdge, 0);
  assert.equal(ticked.changed, true);
  assert.equal(ticked.buffs.fireStarter, 2);
});

test('rare, epic, and mythic craft items enforce ice/gold costs and grant high-tier buffs', () => {
  assert.equal(CRAFT_RECIPES.length, 7);
  assert.equal(getCraftRecipe('frost_whetstone').rarity, 'rare');
  assert.equal(getCraftRecipe('mammoth_tonic').rarity, 'epic');
  assert.equal(getCraftRecipe('aurora_charm').rarity, 'mythic');

  const noIce = { wood: 30, stone: 10, ice: 0, pelts: 20, gold: 200 };
  assert.equal(canCraftRecipe(noIce, 'frost_whetstone'), false);
  assert.equal(canCraftRecipe(noIce, 'aurora_charm'), false);

  const mythicResources = { wood: 30, stone: 10, ice: 6, pelts: 20, gold: 220 };
  assert.equal(canCraftRecipe(mythicResources, 'aurora_charm'), true);

  const craftedAurora = applyCraftRecipe({
    resources: mythicResources,
    buffs: INITIAL_BUFFS,
    hp: 40,
    maxHp: 230,
    warmth: 20,
    maxWarmth: 185,
    id: 'aurora_charm',
  });
  assert.ok(craftedAurora);
  assert.equal(craftedAurora.resources.ice, 2);
  assert.equal(craftedAurora.buffs.auroraCharm, 50);
  assert.equal(craftedAurora.hp, 160);
  assert.equal(craftedAurora.warmth, 120);
  assert.ok(computeCraftChillScale('blizzard', craftedAurora.buffs) <= 0.1);
  assert.ok(computeCraftSpeedScale(craftedAurora.buffs) >= 1.35);
  assert.ok(computeCraftDamageScale(craftedAurora.buffs) >= 1.75);
});
