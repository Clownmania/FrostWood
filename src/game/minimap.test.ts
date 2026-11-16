import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MINIMAP_HEIGHT,
  MINIMAP_WIDTH,
  computeMinimapLayout,
  worldToMinimap,
  yawToMinimapDegrees,
} from './minimap';
import { ZONE_SPECS } from './zones';

test('worldToMinimap projects all 6 expanded zones cleanly inside SVG bounds', () => {
  const layout = computeMinimapLayout(0, 4.6, Math.PI, 'level1');

  // North (-Z) maps to smaller Y (near top of SVG)
  assert.ok(layout.level2Zone.y < layout.portal2.y);
  assert.ok(layout.portal2.y < layout.portal1.y);
  assert.ok(layout.portal1.y < layout.camp.y);
  assert.ok(layout.camp.y < layout.player.y);

  // Level 3 and Level 4 sit West of Level 1/2, Level 5 and City sit East
  assert.ok(layout.level3Zone.x < layout.level2Zone.x);
  assert.ok(layout.level4Zone.x < layout.level1Zone.x);
  assert.ok(layout.level5Zone.x > layout.level2Zone.x);
  assert.ok(layout.cityZone.x > layout.level1Zone.x);

  // All 6 zone circles stay strictly inside the SVG frame
  for (const circle of [
    layout.level1Zone,
    layout.level2Zone,
    layout.level3Zone,
    layout.level4Zone,
    layout.level5Zone,
    layout.cityZone,
  ]) {
    assert.ok(circle.y - circle.r >= 0, `Zone top out of bounds: ${circle.y - circle.r}`);
    assert.ok(circle.y + circle.r <= MINIMAP_HEIGHT, `Zone bottom out of bounds: ${circle.y + circle.r}`);
    assert.ok(circle.x - circle.r >= 0, `Zone left out of bounds: ${circle.x - circle.r}`);
    assert.ok(circle.x + circle.r <= MINIMAP_WIDTH, `Zone right out of bounds: ${circle.x + circle.r}`);
  }
});

test('player marker tracks coordinates across all wilderness zones', () => {
  const eastL1 = worldToMinimap(30, -20);
  const centerL1 = worldToMinimap(0, -20);
  assert.ok(eastL1.x > centerL1.x, 'East (+X) maps right on minimap');
  assert.equal(eastL1.y, centerL1.y);

  for (const zoneId of ['level2', 'level3', 'level4', 'level5'] as const) {
    const spec = ZONE_SPECS[zoneId];
    const zLayout = computeMinimapLayout(spec.arrivalX, spec.arrivalZ, spec.arrivalYaw, zoneId);
    const zoneCircle =
      zoneId === 'level2'
        ? zLayout.level2Zone
        : zoneId === 'level3'
          ? zLayout.level3Zone
          : zoneId === 'level4'
            ? zLayout.level4Zone
            : zLayout.level5Zone;
    assert.ok(
      Math.hypot(zLayout.player.x - zoneCircle.x, zLayout.player.y - zoneCircle.y) < zoneCircle.r,
      `Arriving in ${zoneId} places player inside ${zoneId} zone boundary`,
    );
  }
});

test('yawToMinimapDegrees aligns North-Up heading arrow accurately', () => {
  assert.equal(yawToMinimapDegrees(Math.PI), 0);
  assert.equal(yawToMinimapDegrees(Math.PI / 2), 90);
  assert.equal(yawToMinimapDegrees(-Math.PI / 2), -90);
  assert.equal(Math.abs(yawToMinimapDegrees(0)), 180);
});
