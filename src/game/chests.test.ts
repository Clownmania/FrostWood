import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ACTIVE_SECRET_CHESTS,
  SECRET_CHEST_MIN_HEARTH_DIST,
  SECRET_CHEST_SPAWN_CHANCE,
  collectMinimapChestBlips,
  findNearestSecretChest,
  pickSecretChestRarity,
  pickSecretChestSpawnPoint,
  rollSecretChestLoot,
  shouldSpawnSecretChest,
} from './chests';
import { ZONE_SPECS } from './zones';

test('secret chests spawn only in wilderness with a small random percentage and active cap', () => {
  assert.ok(SECRET_CHEST_SPAWN_CHANCE > 0 && SECRET_CHEST_SPAWN_CHANCE <= 0.15);
  assert.equal(
    shouldSpawnSecretChest({ activeCountInZone: 0, zone: 'city', rng: () => 0.01 }),
    false,
  );
  assert.equal(
    shouldSpawnSecretChest({ activeCountInZone: MAX_ACTIVE_SECRET_CHESTS, zone: 'level1', rng: () => 0.01 }),
    false,
  );
  assert.equal(
    shouldSpawnSecretChest({ activeCountInZone: 0, zone: 'level1', rng: () => 0.02 }),
    true,
  );
  assert.equal(
    shouldSpawnSecretChest({ activeCountInZone: 0, zone: 'level1', rng: () => 0.45 }),
    false,
  );
});

test('secret chest spawn positions stay within zone bounds and away from hearth & portals', () => {
  const pos = pickSecretChestSpawnPoint({
    zone: 'level1',
    playerX: 0,
    playerZ: 4,
    obstacles: [{ x: 30, z: 30 }],
  });
  const distHearth = Math.hypot(pos.x, pos.z);
  assert.ok(distHearth >= SECRET_CHEST_MIN_HEARTH_DIST - 0.1);
  assert.ok(distHearth <= ZONE_SPECS.level1.radius);

  const posL2 = pickSecretChestSpawnPoint({
    zone: 'level2',
    playerX: ZONE_SPECS.level2.arrivalX,
    playerZ: ZONE_SPECS.level2.arrivalZ,
  });
  const distL2 = Math.hypot(posL2.x - ZONE_SPECS.level2.centerX, posL2.z - ZONE_SPECS.level2.centerZ);
  assert.ok(distL2 >= SECRET_CHEST_MIN_HEARTH_DIST - 0.1);
  assert.ok(distL2 <= ZONE_SPECS.level2.radius);
});

test('secret chest loot scales from supply caches to mythic aurora lockboxes and scales with zone & gear level', () => {
  assert.equal(pickSecretChestRarity('level1', () => 0.02), 'aurora');
  assert.equal(pickSecretChestRarity('level1', () => 0.2), 'relic');
  assert.equal(pickSecretChestRarity('level1', () => 0.8), 'supply');

  // Higher gear level in Level 2 shifts roll=0.22 into 'aurora' (whereas it is 'relic' at L1 Gear 1)
  assert.equal(pickSecretChestRarity('level2', () => 0.22, 5), 'aurora');

  const supply = rollSecretChestLoot('supply', () => 0.5, { zone: 'level1', gearLevel: 1 });
  const aurora = rollSecretChestLoot('aurora', () => 0.5, { zone: 'level1', gearLevel: 1 });
  const highProgSupply = rollSecretChestLoot('supply', () => 0.5, {
    zone: 'level2',
    gearLevel: 5,
  });

  assert.ok((aurora.resources.gold ?? 0) > (supply.resources.gold ?? 0));
  assert.ok((aurora.resources.ice ?? 0) > (supply.resources.ice ?? 0));
  assert.ok(aurora.bonusItemId);

  // Higher zone & gear level scales chest resource yields and bonus item count/rarity
  assert.ok((highProgSupply.resources.gold ?? 0) > (supply.resources.gold ?? 0));
  assert.ok((highProgSupply.resources.wood ?? 0) > (supply.resources.wood ?? 0));
  assert.ok((highProgSupply.extraItems?.length ?? 0) > (supply.extraItems?.length ?? 0));
});

test('nearest secret chest and minimap blips respect proximity and sight reveal', () => {
  const chests = [
    { id: 1, zone: 'level1' as const, rarity: 'relic' as const, x: 12, z: 12, opened: false },
    { id: 2, zone: 'level1' as const, rarity: 'aurora' as const, x: 75, z: 0, opened: false },
    { id: 3, zone: 'level1' as const, rarity: 'supply' as const, x: 11, z: 11, opened: true },
  ];
  const near = findNearestSecretChest(chests, 10.5, 11.2, 'level1');
  assert.ok(near);
  assert.equal(near.chest.id, 1);

  const shortBlips = collectMinimapChestBlips(chests, 10, 10, 'level1', false);
  assert.equal(shortBlips.length, 1);
  assert.equal(shortBlips[0].id, 1);

  const sightBlips = collectMinimapChestBlips(chests, 10, 10, 'level1', true);
  assert.equal(sightBlips.length, 2);
});
