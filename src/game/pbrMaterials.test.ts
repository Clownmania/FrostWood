import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PBR_SURFACE_PROFILES,
  computeLakeReflectionParams,
  type PbrSurfaceKey,
} from './pbrMaterials';

test('PBR_SURFACE_PROFILES enforces physically valid dielectric vs metallic ranges', () => {
  const dielectrics: PbrSurfaceKey[] = [
    'snow',
    'glacial_ice',
    'lake_water',
    'lake_fracture_ice',
    'lake_hoarfrost',
    'glass_window',
    'timber',
    'stone',
    'fur',
  ];
  const metals: PbrSurfaceKey[] = [
    'forged_iron',
    'burnished_gold',
    'frost_steel',
    'mythic_alloy',
  ];

  for (const key of dielectrics) {
    const p = PBR_SURFACE_PROFILES[key];
    assert.ok(p.metalness <= 0.08, `${key} dielectric metalness should stay <= 0.08`);
    assert.ok(p.ior >= 1.3 && p.ior <= 1.6, `${key} IOR should be physically plausible`);
    assert.ok(p.roughness >= 0.04 && p.roughness <= 1.0, `${key} roughness in [0.04, 1]`);
  }

  for (const key of metals) {
    const p = PBR_SURFACE_PROFILES[key];
    assert.ok(p.metalness >= 0.9, `${key} metallic material should have metalness >= 0.9`);
    assert.ok(p.anisotropy > 0.4, `${key} brushed metal should have directional anisotropy`);
    assert.ok(p.envMapIntensity >= 1.5, `${key} reflective metal should have crisp envMapIntensity`);
  }
});

test('snow and glacial ice profiles include dual-layer micro-surface clearcoat detail', () => {
  const snow = PBR_SURFACE_PROFILES.snow;
  assert.ok(snow.clearcoat > 0.25, 'snow should enable crystalline micro-sparkle clearcoat');
  assert.ok(snow.clearcoatNormalScale > 0.3, 'snow should use micro-facet clearcoatNormalScale');
  assert.ok(snow.sheen > 0.25, 'snow should have soft powdery grazing sheen');
  assert.equal(snow.ior, 1.31);

  const ice = PBR_SURFACE_PROFILES.glacial_ice;
  assert.equal(ice.clearcoat, 1.0);
  assert.ok(ice.clearcoatRoughness <= 0.06, 'glacial ice clearcoat must remain razor-crisp');
  assert.ok(ice.clearcoatNormalScale > 0.25, 'glacial ice should include micro-scratch normal scale');
  assert.ok(ice.reflectivity >= 0.94);
  assert.ok(ice.envMapIntensity >= 1.6);
});

test('computeLakeReflectionParams transitions smoothly from open mirror water to frosted ice', () => {
  const open = computeLakeReflectionParams(0);
  const fractured = computeLakeReflectionParams(0.45);
  const frozen = computeLakeReflectionParams(1.0);

  assert.ok(open.waterRoughness < fractured.waterRoughness);
  assert.ok(fractured.waterRoughness < frozen.waterRoughness);
  assert.ok(open.waterEnvMapIntensity > frozen.waterEnvMapIntensity);
  assert.ok(open.iceClearcoat > frozen.iceClearcoat);
  assert.ok(open.waterClearcoat >= 0.95);
  assert.ok(frozen.iceEnvMapIntensity >= 0.7);
});

test('computeLakeReflectionParams clamps out-of-range inputs safely', () => {
  assert.deepEqual(computeLakeReflectionParams(-0.5), computeLakeReflectionParams(0));
  assert.deepEqual(computeLakeReflectionParams(2.5), computeLakeReflectionParams(1));
});
