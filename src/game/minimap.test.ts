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

test('worldToMinimap places Level 2 cleanly north (above) Level 1 inside bounds', () => {
  const layout = computeMinimapLayout(0, 4.6, Math.PI, 'level1');

  assert.equal(layout.level1Zone.x, MINIMAP_WIDTH * 0.5);
  assert.equal(layout.level2Zone.x, MINIMAP_WIDTH * 0.5);
  // North (-Z) maps to smaller Y (near top of SVG)
  assert.ok(layout.level2Zone.y < layout.portal2.y);
  assert.ok(layout.portal2.y < layout.portal1.y);
  assert.ok(layout.portal1.y < layout.camp.y);
  assert.ok(layout.camp.y < layout.player.y);

  // Both zone circles stay strictly inside the SVG frame
  assert.ok(layout.level2Zone.y - layout.level2Zone.r > 0);
  assert.ok(layout.level1Zone.y + layout.level1Zone.r < MINIMAP_HEIGHT);
  assert.ok(layout.level1Zone.x - layout.level1Zone.r > 0);
  assert.ok(layout.level1Zone.x + layout.level1Zone.r < MINIMAP_WIDTH);
});

test('player marker tracks coordinates across both Level 1 and Level 2', () => {
  const eastL1 = worldToMinimap(30, -20);
  const centerL1 = worldToMinimap(0, -20);
  assert.ok(eastL1.x > centerL1.x, 'East (+X) maps right on minimap');
  assert.equal(eastL1.y, centerL1.y);

  const l2Layout = computeMinimapLayout(
    ZONE_SPECS.level2.arrivalX,
    ZONE_SPECS.level2.arrivalZ,
    ZONE_SPECS.level2.arrivalYaw,
    'level2',
  );
  assert.ok(
    Math.hypot(l2Layout.player.x - l2Layout.level2Zone.x, l2Layout.player.y - l2Layout.level2Zone.y) <
      l2Layout.level2Zone.r,
    'Arriving in Level 2 places player inside Level 2 zone boundary',
  );
  assert.equal(l2Layout.hearthDirection, 'N');
});

test('yawToMinimapDegrees aligns North-Up heading arrow accurately', () => {
  // Facing North (-Z) is yaw = PI -> 0 deg (pointing straight up)
  assert.equal(yawToMinimapDegrees(Math.PI), 0);
  // Facing East (+X) is yaw = PI/2 -> +90 deg (pointing right)
  assert.equal(yawToMinimapDegrees(Math.PI / 2), 90);
  // Facing West (-X) is yaw = -PI/2 -> -90 deg (pointing left)
  assert.equal(yawToMinimapDegrees(-Math.PI / 2), -90);
  // Facing South (+Z) is yaw = 0 -> 180 deg (pointing down)
  assert.equal(Math.abs(yawToMinimapDegrees(0)), 180);
});
