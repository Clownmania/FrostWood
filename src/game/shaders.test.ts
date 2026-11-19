import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeDynamicShaderParams,
  createFrostwoodShaderUniforms,
  updateFrostwoodShaderUniforms,
} from './shaders';

const BASE_INPUT = {
  time: 12.5,
  timeOfDay: 0.5,
  nightFactor: 0,
  twilightFactor: 0,
  weather: 'clear' as const,
  zone: 'level1' as const,
  frostOverlay: 0,
  sunPos: [28, 36, 22] as const,
  sunColorHex: 0xfff1d6,
  skyColorHex: 0x7ea6d1,
  hearthPos: [0, 0.6, 0] as const,
  hearthIntensity: 1.0,
  enabled: true,
};

test('computeDynamicShaderParams escalates frost accumulation across weather states', () => {
  const clear = computeDynamicShaderParams(BASE_INPUT);
  const snow = computeDynamicShaderParams({ ...BASE_INPUT, weather: 'light_snow' });
  const blizzard = computeDynamicShaderParams({
    ...BASE_INPUT,
    weather: 'blizzard',
    frostOverlay: 0.85,
  });

  assert.ok(clear.frostStrength < snow.frostStrength);
  assert.ok(snow.frostStrength < blizzard.frostStrength);
  assert.ok(clear.sparkleStrength > blizzard.sparkleStrength);
  assert.ok(blizzard.frostVignette > clear.frostVignette);
});

test('computeDynamicShaderParams intensifies hearth warmth and bloom at night and twilight', () => {
  const noon = computeDynamicShaderParams(BASE_INPUT);
  const twilight = computeDynamicShaderParams({
    ...BASE_INPUT,
    timeOfDay: 0.76,
    twilightFactor: 0.9,
  });
  const night = computeDynamicShaderParams({
    ...BASE_INPUT,
    timeOfDay: 0.0,
    nightFactor: 0.95,
  });

  assert.ok(twilight.campfireWarmth > noon.campfireWarmth);
  assert.ok(night.campfireWarmth > noon.campfireWarmth);
  assert.ok(twilight.bloomLift > noon.bloomLift);
  assert.ok(night.bloomLift > noon.bloomLift);
});

test('computeDynamicShaderParams adapts zone mood colors across biomes', () => {
  const valley = computeDynamicShaderParams({ ...BASE_INPUT, zone: 'level1' });
  const caldera = computeDynamicShaderParams({ ...BASE_INPUT, zone: 'level4' });
  const starfall = computeDynamicShaderParams({ ...BASE_INPUT, zone: 'level5' });
  const city = computeDynamicShaderParams({ ...BASE_INPUT, zone: 'city' });

  assert.notEqual(valley.zoneMoodHex, caldera.zoneMoodHex);
  assert.notEqual(caldera.zoneMoodHex, starfall.zoneMoodHex);
  assert.notEqual(city.zoneMoodHex, valley.zoneMoodHex);
  assert.ok(starfall.frostStrength > valley.frostStrength);
});

test('computeDynamicShaderParams cleanly disables shader contributions when toggled off', () => {
  const disabled = computeDynamicShaderParams({ ...BASE_INPUT, enabled: false });
  assert.equal(disabled.enabledFactor, 0);
  assert.equal(disabled.vibrance, 0);
  assert.equal(disabled.bloomLift, 0);
  assert.equal(disabled.frostVignette, 0);
  assert.equal(disabled.contrast, 1);
});

test('updateFrostwoodShaderUniforms activates single-pass grade when post pipeline is null', () => {
  const uniforms = createFrostwoodShaderUniforms();
  updateFrostwoodShaderUniforms(uniforms, null, BASE_INPUT);
  assert.equal(uniforms.uFwEnabled.value, 1);
  assert.equal(uniforms.uFwSinglePassGrade.value, 1);

  updateFrostwoodShaderUniforms(uniforms, null, { ...BASE_INPUT, enabled: false });
  assert.equal(uniforms.uFwEnabled.value, 0);
  assert.equal(uniforms.uFwSinglePassGrade.value, 0);
});
