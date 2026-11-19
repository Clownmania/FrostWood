import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_GAME_SETTINGS,
  SETTINGS_STORAGE_KEY,
  applyGraphicsPreset,
  evaluateAdaptiveGraphicsStep,
  getSnowDensityMultiplier,
  loadSettingsFromStorage,
  mergeGameSettings,
  resolveGraphicsRuntimeConfig,
  sanitizeGameSettings,
  saveSettingsToStorage,
  type StorageLike,
} from './settings';

function createMemoryStorage(): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

test('sanitizeGameSettings falls back to minimal HUD defaults for invalid input', () => {
  const result = sanitizeGameSettings(null);
  assert.deepEqual(result, DEFAULT_GAME_SETTINGS);
  assert.equal(result.hudLayout, 'minimal');
  assert.equal(result.showMinimap, true);
  assert.equal(result.showControlsHint, false);
  assert.equal(result.enhancedShaders, true);
  assert.equal(result.graphicsPreset, 'high');
});

test('sanitizeGameSettings clamps out-of-range numeric sliders and invalid enums', () => {
  const result = sanitizeGameSettings({
    masterVolume: 5,
    cameraSensitivity: -3,
    cameraDistance: 99,
    hudLayout: 'unknown_layout',
    snowDensity: 'blizzard_extreme',
    muted: 'yes',
    resolutionScale: 9,
    shadowQuality: 'extreme_8k',
  });
  assert.equal(result.masterVolume, 1);
  assert.equal(result.cameraSensitivity, 0.4);
  assert.equal(result.cameraDistance, 11.5);
  assert.equal(result.hudLayout, 'minimal');
  assert.equal(result.snowDensity, 'normal');
  assert.equal(result.muted, false);
  assert.equal(result.enhancedShaders, true);
  assert.equal(result.resolutionScale, 1.25);
  assert.equal(result.shadowQuality, 'high');
});

test('mergeGameSettings updates targeted fields while preserving others', () => {
  const next = mergeGameSettings(DEFAULT_GAME_SETTINGS, {
    masterVolume: 0.35,
    hudLayout: 'expanded',
    showMinimap: false,
    enhancedShaders: false,
  });
  assert.equal(next.masterVolume, 0.35);
  assert.equal(next.hudLayout, 'expanded');
  assert.equal(next.showMinimap, false);
  assert.equal(next.enhancedShaders, false);
  assert.equal(next.cameraSensitivity, DEFAULT_GAME_SETTINGS.cameraSensitivity);
});

test('graphics presets apply cleanly, detect custom edits, and resolve runtime config', () => {
  const low = applyGraphicsPreset(DEFAULT_GAME_SETTINGS, 'low');
  assert.equal(low.graphicsPreset, 'low');
  assert.equal(low.shadowQuality, 'low');
  assert.equal(low.postProcessing, false);
  assert.equal(low.ambientOcclusion, false);

  const ultra = mergeGameSettings(low, { graphicsPreset: 'ultra' });
  assert.equal(ultra.graphicsPreset, 'ultra');
  assert.equal(ultra.shadowQuality, 'ultra');
  assert.equal(ultra.viewDistance, 'ultra');
  assert.equal(ultra.ambientOcclusion, true);

  const custom = mergeGameSettings(ultra, { resolutionScale: 0.8 });
  assert.equal(custom.graphicsPreset, 'custom');

  const ultraRuntime = resolveGraphicsRuntimeConfig(ultra);
  const lowRuntime = resolveGraphicsRuntimeConfig(low);
  assert.ok(ultraRuntime.shadowMapSize > lowRuntime.shadowMapSize);
  assert.ok(ultraRuntime.farPlane > lowRuntime.farPlane);
  assert.equal(ultraRuntime.aoEnabled, true);
  assert.equal(lowRuntime.bloomEnabled, false);
});

test('evaluateAdaptiveGraphicsStep uses hysteresis band for FPS auto-scaling', () => {
  const down = evaluateAdaptiveGraphicsStep('high', 33);
  assert.equal(down.nextPreset, 'medium');
  assert.equal(down.reason, 'downgrade');

  const steady = evaluateAdaptiveGraphicsStep('high', 18);
  assert.equal(steady.nextPreset, null);
  assert.equal(steady.reason, null);

  const up = evaluateAdaptiveGraphicsStep('medium', 10);
  assert.equal(up.nextPreset, 'high');
  assert.equal(up.reason, 'upgrade');
});

test('loadSettingsFromStorage and saveSettingsToStorage round-trip cleanly and survive corrupt JSON', () => {
  const mem = createMemoryStorage();
  assert.deepEqual(loadSettingsFromStorage(mem), DEFAULT_GAME_SETTINGS);

  const saved = saveSettingsToStorage(
    {
      ...DEFAULT_GAME_SETTINGS,
      masterVolume: 0.55,
      cameraSensitivity: 1.45,
      snowDensity: 'high',
      muted: true,
    },
    mem,
  );
  assert.equal(saved.masterVolume, 0.55);
  const reloaded = loadSettingsFromStorage(mem);
  assert.equal(reloaded.masterVolume, 0.55);
  assert.equal(reloaded.cameraSensitivity, 1.45);
  assert.equal(reloaded.snowDensity, 'high');
  assert.equal(reloaded.muted, true);

  mem.setItem(SETTINGS_STORAGE_KEY, '{corrupt json');
  assert.deepEqual(loadSettingsFromStorage(mem), DEFAULT_GAME_SETTINGS);
});

test('getSnowDensityMultiplier returns distinct scales per preset', () => {
  assert.ok(getSnowDensityMultiplier('low') < getSnowDensityMultiplier('normal'));
  assert.ok(getSnowDensityMultiplier('normal') < getSnowDensityMultiplier('high'));
});
