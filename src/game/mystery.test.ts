import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addRareMaterialDrops,
  buyMysteryShopItem,
  canBuyMysteryShopItem,
  canUnlockMythicAscension,
  computeMythicAscensionBonuses,
  createEmptyRareMaterials,
  rollRareBoulderDrops,
  rollRareTreeDrops,
  unlockMythicAscension,
} from './mystery';

test('rollRareTreeDrops yields Pyrewood Heartwood from pyrewood and Void Timber from void_heartwood', () => {
  const pyreDrops = rollRareTreeDrops('level4', 'pyrewood', () => 0.2);
  assert.equal(pyreDrops.pyrewood_heart, 2);
  assert.equal(pyreDrops.venom_resin, 2);

  const voidDrops = rollRareTreeDrops('level5', 'void_heartwood', () => 0.15);
  assert.equal(voidDrops.void_timber, 2);
  assert.equal(voidDrops.venom_resin, 2);
  assert.equal(voidDrops.pyrewood_heart, 1);
});

test('rollRareBoulderDrops yields Brimstone, Fulminite, and Dark Matter from rare ore veins', () => {
  const brimstone = rollRareBoulderDrops('level4', 'brimstone_ore', () => 0.2);
  assert.equal(brimstone.brimstone_slag, 2);
  assert.equal(brimstone.venom_resin, 1);

  const voltaic = rollRareBoulderDrops('level4', 'voltaic_ore', () => 0.2);
  assert.equal(voltaic.voltaic_core, 2);
  assert.equal(voltaic.brimstone_slag, 1);

  const darkMatter = rollRareBoulderDrops('level5', 'dark_matter_ore', () => 0.2);
  assert.equal(darkMatter.dark_matter_ore, 2);
  assert.equal(darkMatter.voltaic_core, 1);
  assert.equal(darkMatter.venom_resin, 1);
});

test('addRareMaterialDrops accumulates drops and produces readable summary parts', () => {
  const base = createEmptyRareMaterials();
  const { next, summaryParts } = addRareMaterialDrops(base, {
    pyrewood_heart: 2,
    dark_matter_ore: 1,
  });
  assert.equal(next.pyrewood_heart, 2);
  assert.equal(next.dark_matter_ore, 1);
  assert.equal(summaryParts.length, 2);
  assert.ok(summaryParts.some((s) => s.includes('+2 Pyrewood')));
  assert.ok(summaryParts.some((s) => s.includes('+1 Dark Matter')));
});

test('unlockMythicAscension validates resource and rare material costs and applies Dark Matter bonuses', () => {
  const scarceRes = { wood: 50, stone: 20, ice: 10, pelts: 5, meat: 5, gold: 100 };
  const scarceRare = createEmptyRareMaterials();
  assert.equal(
    canUnlockMythicAscension('dark_matter', scarceRes, scarceRare, []),
    false,
  );

  const richRes = {
    wood: 2000,
    stone: 1500,
    ice: 1000,
    pelts: 200,
    meat: 200,
    gold: 10000,
  };
  const richRare = {
    pyrewood_heart: 20,
    brimstone_slag: 20,
    voltaic_core: 20,
    venom_resin: 20,
    void_timber: 30,
    dark_matter_ore: 30,
  };

  assert.equal(
    canUnlockMythicAscension('dark_matter', richRes, richRare, []),
    true,
  );

  const res = unlockMythicAscension('dark_matter', richRes, richRare, []);
  assert.equal(res.unlocked, true);
  assert.ok(res.unlockedAscensions.includes('dark_matter'));
  assert.ok(res.rareMaterials.dark_matter_ore < richRare.dark_matter_ore);

  const bonuses = computeMythicAscensionBonuses('dark_matter');
  assert.ok(bonuses.damageMult > 1.5);
  assert.ok(bonuses.gatherYieldMult > 1.4);
  assert.ok(bonuses.maxHpBonus >= 90);
});

test('buyMysteryShopItem deducts gold and rare materials and grants bonus resources', () => {
  const resources = {
    wood: 100,
    stone: 100,
    ice: 50,
    pelts: 10,
    meat: 10,
    gold: 2000,
  };
  const rare = {
    ...createEmptyRareMaterials(),
    void_timber: 6,
    dark_matter_ore: 6,
  };

  assert.equal(
    canBuyMysteryShopItem('dark_matter_singularity', resources, rare),
    true,
  );
  const bought = buyMysteryShopItem('dark_matter_singularity', resources, rare);
  assert.equal(bought.purchased, true);
  assert.equal(bought.resources.gold, 900);
  assert.ok(bought.resources.wood > 100);
  assert.equal(bought.rareMaterials.void_timber, 2);
  assert.equal(bought.rareMaterials.dark_matter_ore, 2);
});
