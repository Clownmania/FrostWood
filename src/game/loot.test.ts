import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_CRAFT_RECIPES } from './crafting';
import {
  ITEM_RARITY_ORDER,
  buildLootScalingHudInfo,
  compareItemRarity,
  computeEffectiveLootGearLevel,
  computeItemRarityWeights,
  computePlayerLootProgression,
  computeSecretChestRarityWeights,
  rollWeightedLootItem,
  rollWeightedLootItems,
} from './loot';

test('effective loot gear level and progression index scale monotonically with gear tier and zone', () => {
  const l1T1 = computePlayerLootProgression({
    zone: 'level1',
    gear: { coat: 1, boots: 1, gloves: 1, pack: 1 },
  });
  const l1T3 = computePlayerLootProgression({
    zone: 'level1',
    gear: { coat: 3, boots: 3, gloves: 3, pack: 3 },
  });
  const l2T3 = computePlayerLootProgression({
    zone: 'level2',
    gear: { coat: 3, boots: 3, gloves: 3, pack: 3 },
  });
  const cityT5 = computePlayerLootProgression({
    zone: 'city',
    gear: { coat: 5, boots: 5, gloves: 5, pack: 5 },
    axeTier: 5,
    bowTier: 5,
    wingsTier: 3,
  });

  assert.equal(l1T1.effectiveGearLevel, 1);
  assert.equal(l1T3.effectiveGearLevel, 3);
  assert.equal(cityT5.effectiveGearLevel, 5);

  assert.ok(l1T3.progressionIndex > l1T1.progressionIndex);
  assert.ok(l2T3.progressionIndex > l1T3.progressionIndex);
  assert.ok(cityT5.progressionIndex > l2T3.progressionIndex);

  assert.ok(l1T3.resourceMultiplier > l1T1.resourceMultiplier);
  assert.ok(l2T3.resourceMultiplier > l1T3.resourceMultiplier);
  assert.ok(cityT5.resourceMultiplier > l2T3.resourceMultiplier);

  // Removing a gear slot reduces effective gear level compared to fully equipped
  const unequippedGear = computeEffectiveLootGearLevel({
    gear: { coat: 0, boots: 3, gloves: 3, pack: 3 },
    unlockedGear: { coat: 3, boots: 3, gloves: 3, pack: 3 },
  });
  assert.ok(unequippedGear < l1T3.effectiveGearLevel);
});

test('secret chest rarity weights shift toward relic and aurora as zone and gear level increase', () => {
  const lowWeights = computeSecretChestRarityWeights('level1', 1);
  const midZoneWeights = computeSecretChestRarityWeights('level2', 1);
  const highGearWeights = computeSecretChestRarityWeights('level1', 5);
  const maxWeights = computeSecretChestRarityWeights('level2', 5);

  // Base Level 1 + Gear T1 preserves 65% supply, 27% relic, 8% aurora
  assert.equal(lowWeights.aurora, 0.08);
  assert.equal(lowWeights.relic, 0.27);
  assert.equal(lowWeights.supply, 0.65);

  // Advancing to Level 2 increases relic & aurora weights
  assert.ok(midZoneWeights.aurora > lowWeights.aurora);
  assert.ok(midZoneWeights.relic > lowWeights.relic);
  assert.ok(midZoneWeights.supply < lowWeights.supply);

  // Upgrading gear to Tier 5 increases relic & aurora weights
  assert.ok(highGearWeights.aurora > lowWeights.aurora);
  assert.ok(highGearWeights.relic > lowWeights.relic);
  assert.ok(highGearWeights.supply < lowWeights.supply);

  // Combining Level 2 + Gear T5 yields the highest high-tier chest odds
  assert.ok(maxWeights.aurora > midZoneWeights.aurora);
  assert.ok(maxWeights.aurora > highGearWeights.aurora);
});

test('item rarity weights shift probability mass from common/uncommon to rare/epic/mythic with progression', () => {
  const starterOdds = computeItemRarityWeights({ zone: 'level1', gearLevel: 1 });
  const midOdds = computeItemRarityWeights({ zone: 'level2', gearLevel: 3 });
  const endgameOdds = computeItemRarityWeights({ zone: 'city', gearLevel: 5 });

  const sumStarter = ITEM_RARITY_ORDER.reduce((acc, r) => acc + starterOdds[r], 0);
  const sumEndgame = ITEM_RARITY_ORDER.reduce((acc, r) => acc + endgameOdds[r], 0);
  assert.ok(Math.abs(sumStarter - 1) < 1e-6);
  assert.ok(Math.abs(sumEndgame - 1) < 1e-6);

  // Common odds strictly decrease as progression rises
  assert.ok(midOdds.common < starterOdds.common);
  assert.ok(endgameOdds.common < midOdds.common);

  // Epic + Mythic odds strictly increase as progression rises
  const starterHigh = starterOdds.epic + starterOdds.mythic;
  const midHigh = midOdds.epic + midOdds.mythic;
  const endgameHigh = endgameOdds.epic + endgameOdds.mythic;
  assert.ok(midHigh > starterHigh);
  assert.ok(endgameHigh > midHigh);

  // Minimum rarity floor zeros out lower rarities
  const epicFloorOdds = computeItemRarityWeights(
    { zone: 'level1', gearLevel: 1 },
    { minRarity: 'epic' },
  );
  assert.equal(epicFloorOdds.common, 0);
  assert.equal(epicFloorOdds.uncommon, 0);
  assert.equal(epicFloorOdds.rare, 0);
  assert.ok(epicFloorOdds.epic + epicFloorOdds.mythic > 0.999);
});

test('weighted item rolls respect rarity floors, avoid duplicates in multi-rolls, and scale higher-tier frequency', () => {
  const validIds = new Set(ALL_CRAFT_RECIPES.map((r) => r.id));

  // Deterministic sequence of 40 rolls at low vs high progression
  let seedLow = 1;
  const rngLow = () => {
    seedLow = (seedLow * 48271) % 2147483647;
    return (seedLow - 1) / 2147483646;
  };
  let seedHigh = 1;
  const rngHigh = () => {
    seedHigh = (seedHigh * 48271) % 2147483647;
    return (seedHigh - 1) / 2147483646;
  };

  let lowHighTierCount = 0;
  let highHighTierCount = 0;
  for (let i = 0; i < 60; i++) {
    const itemLow = rollWeightedLootItem({ zone: 'level1', gearLevel: 1 }, { rng: rngLow });
    const itemHigh = rollWeightedLootItem(
      { zone: 'city', gearLevel: 5 },
      { sourceBonus: 0.25, rng: rngHigh },
    );
    assert.ok(validIds.has(itemLow.id));
    assert.ok(validIds.has(itemHigh.id));
    if (compareItemRarity(itemLow.rarity, 'rare') >= 0) lowHighTierCount++;
    if (compareItemRarity(itemHigh.rarity, 'rare') >= 0) highHighTierCount++;
  }
  assert.ok(
    highHighTierCount > lowHighTierCount,
    `Expected more rare/epic/mythic drops at high progression (${highHighTierCount} vs ${lowHighTierCount})`,
  );

  const multi = rollWeightedLootItems(
    4,
    { zone: 'level2', gearLevel: 4 },
    { minRarity: 'rare', rng: () => 0.42 },
  );
  assert.equal(multi.length, 4);
  const distinct = new Set(multi.map((m) => m.id));
  assert.equal(distinct.size, 4);
});

test('buildLootScalingHudInfo returns normalized 100% percentage breakdowns', () => {
  const info = buildLootScalingHudInfo({
    zone: 'level2',
    gear: { coat: 4, boots: 4, gloves: 3, pack: 5 },
  });
  assert.equal(info.zone, 'level2');
  assert.equal(info.zoneTier, 2);
  assert.equal(info.effectiveGearLevel, 4);

  const chestSum =
    info.chestRarityPercentages.supply +
    info.chestRarityPercentages.relic +
    info.chestRarityPercentages.aurora;
  assert.equal(chestSum, 100);

  const itemSum = ITEM_RARITY_ORDER.reduce(
    (acc, r) => acc + info.itemRarityPercentages[r],
    0,
  );
  assert.equal(itemSum, 100);
});
