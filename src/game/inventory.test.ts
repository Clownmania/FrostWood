import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BUFFS,
  computeCraftDamageScale,
  computeCraftSpeedScale,
  computeCraftYieldScale,
  getLinkedBuffSeconds,
  tickCraftBuffs,
} from './crafting';
import {
  computeBackpackItemCapacity,
  computeBackpackPreparedness,
  countBackpackItems,
  craftItemToBackpack,
  createInitialBackpackInventory,
  useBackpackItem,
} from './inventory';

test('crafting gears, hammer temper kits, tools, and traps stores items in backpack inventory', () => {
  const inv0 = createInitialBackpackInventory();
  assert.equal(countBackpackItems(inv0), 0);

  const res0 = { wood: 30, stone: 30, ice: 4, pelts: 15, gold: 100 };

  // Cannot craft frost_trap or hammer_temper without clockwork gears
  assert.equal(
    craftItemToBackpack({
      resources: res0,
      inventory: inv0,
      maxItems: 14,
      id: 'hammer_temper',
    }),
    null,
  );
  assert.equal(
    craftItemToBackpack({
      resources: res0,
      inventory: inv0,
      maxItems: 14,
      id: 'frost_trap',
    }),
    null,
  );

  // Craft clockwork_gear (+2 gears per forge)
  const forgedGears = craftItemToBackpack({
    resources: res0,
    inventory: inv0,
    maxItems: 14,
    id: 'clockwork_gear',
  });
  assert.ok(forgedGears);
  assert.equal(forgedGears.inventory.clockwork_gear, 2);
  assert.equal(countBackpackItems(forgedGears.inventory), 2);

  // Craft hammer_temper consuming 1 gear
  const craftedHammer = craftItemToBackpack({
    resources: forgedGears.resources,
    inventory: forgedGears.inventory,
    maxItems: 14,
    id: 'hammer_temper',
  });
  assert.ok(craftedHammer);
  assert.equal(craftedHammer.inventory.clockwork_gear, 1);
  assert.equal(craftedHammer.inventory.hammer_temper, 1);

  // Craft snare_trap consuming remaining 1 gear
  const craftedSnare = craftItemToBackpack({
    resources: craftedHammer.resources,
    inventory: craftedHammer.inventory,
    maxItems: 14,
    id: 'snare_trap',
  });
  assert.ok(craftedSnare);
  assert.equal(craftedSnare.inventory.clockwork_gear, 0);
  assert.equal(craftedSnare.inventory.snare_trap, 1);
  assert.equal(craftedSnare.inventory.hammer_temper, 1);
});

test('using backpack items triggers active buffs and deploys traps while linking preparedness aura', () => {
  const inv = createInitialBackpackInventory({
    clockwork_gear: 2,
    hammer_temper: 1,
    utility_toolkit: 1,
    frost_trap: 1,
    fire_starter: 1,
  });

  // Preparedness scales passively from stocked backpack categories
  const prepBefore = computeBackpackPreparedness(inv, INITIAL_BUFFS);
  assert.equal(prepBefore.uniqueCategories, 3);
  assert.ok(prepBefore.damageMult > 1.05);
  assert.ok(prepBefore.moveSpeedMult > 1.04);
  assert.ok(prepBefore.coldDecayMult < 1.0);

  // Components (clockwork_gear) cannot be directly consumed as field buffs
  assert.equal(
    useBackpackItem({
      inventory: inv,
      buffs: INITIAL_BUFFS,
      hp: 80,
      maxHp: 100,
      warmth: 50,
      maxWarmth: 100,
      id: 'clockwork_gear',
    }),
    null,
  );

  // Use hammer_temper -> activates 45s hammerTemper buff (+30% power)
  const usedHammer = useBackpackItem({
    inventory: inv,
    buffs: INITIAL_BUFFS,
    hp: 80,
    maxHp: 100,
    warmth: 50,
    maxWarmth: 100,
    id: 'hammer_temper',
  });
  assert.ok(usedHammer);
  assert.equal(usedHammer.deployTrapKind, null);
  assert.equal(usedHammer.inventory.hammer_temper, 0);
  assert.equal(getLinkedBuffSeconds('hammer_temper', usedHammer.buffs), 45);
  assert.ok(computeCraftDamageScale(usedHammer.buffs) >= 1.3);

  // Use utility_toolkit -> activates 45s utilityToolkit buff (+25% yield, +16% speed)
  const usedToolkit = useBackpackItem({
    inventory: usedHammer.inventory,
    buffs: usedHammer.buffs,
    hp: usedHammer.hp,
    maxHp: 100,
    warmth: usedHammer.warmth,
    maxWarmth: 100,
    id: 'utility_toolkit',
  });
  assert.ok(usedToolkit);
  assert.ok(computeCraftSpeedScale(usedToolkit.buffs) >= 1.16);
  assert.ok(computeCraftYieldScale(usedToolkit.buffs) >= 1.25);

  // Use frost_trap -> consumes 1 trap and returns deployTrapKind: 'frost'
  const deployedTrap = useBackpackItem({
    inventory: usedToolkit.inventory,
    buffs: usedToolkit.buffs,
    hp: usedToolkit.hp,
    maxHp: 100,
    warmth: usedToolkit.warmth,
    maxWarmth: 100,
    id: 'frost_trap',
  });
  assert.ok(deployedTrap);
  assert.equal(deployedTrap.deployTrapKind, 'frost');
  assert.equal(deployedTrap.inventory.frost_trap, 0);

  // Buff timers tick down and clear cleanly
  const ticked = tickCraftBuffs(deployedTrap.buffs, 46);
  assert.equal(ticked.changed, true);
  assert.equal(getLinkedBuffSeconds('hammer_temper', ticked.buffs), 0);
  assert.equal(getLinkedBuffSeconds('utility_toolkit', ticked.buffs), 0);
});

test('backpack item capacity scales with cargo capacity upgrades and blocks overflow crafting', () => {
  assert.equal(computeBackpackItemCapacity(25), 12);
  assert.ok(computeBackpackItemCapacity(65) > computeBackpackItemCapacity(25));

  const fullInv = createInitialBackpackInventory({
    fire_starter: 12,
  });
  const res = { wood: 40, stone: 40, ice: 10, pelts: 20, gold: 100 };
  assert.equal(
    craftItemToBackpack({
      resources: res,
      inventory: fullInv,
      maxItems: 12,
      id: 'alpine_poultice',
    }),
    null,
  );
});
