export type HudLayoutMode = 'minimal' | 'expanded';
export type SnowDensitySetting = 'low' | 'normal' | 'high';
export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra' | 'custom';
export type NamedGraphicsPreset = Exclude<GraphicsPreset, 'custom'>;
export type ShadowQualitySetting = 'off' | 'low' | 'medium' | 'high' | 'ultra';
export type TextureQualitySetting = 'low' | 'medium' | 'high';
export type ParticleQualitySetting = 'low' | 'medium' | 'high';
export type ViewDistanceSetting = 'short' | 'medium' | 'far' | 'ultra';

export interface GraphicsConfigFields {
  shadowQuality: ShadowQualitySetting;
  textureQuality: TextureQualitySetting;
  resolutionScale: number;
  antialias: boolean;
  postProcessing: boolean;
  ambientOcclusion: boolean;
  particleQuality: ParticleQualitySetting;
  viewDistance: ViewDistanceSetting;
}

export interface GameSettings extends GraphicsConfigFields {
  masterVolume: number;
  muted: boolean;
  cameraSensitivity: number;
  cameraDistance: number;
  hudLayout: HudLayoutMode;
  showMinimap: boolean;
  showControlsHint: boolean;
  snowDensity: SnowDensitySetting;
  enhancedShaders: boolean;
  bowAutoAttack: boolean;
  bowAutoAim: boolean;
  autoHarvest: boolean;
  graphicsPreset: GraphicsPreset;
  autoAdaptQuality: boolean;
}

export const GRAPHICS_PRESET_ORDER: readonly NamedGraphicsPreset[] = [
  'low',
  'medium',
  'high',
  'ultra',
];

export const GRAPHICS_PRESET_CONFIGS: Record<
  NamedGraphicsPreset,
  GraphicsConfigFields & { snowDensity: SnowDensitySetting; enhancedShaders: boolean }
> = {
  low: {
    shadowQuality: 'low',
    textureQuality: 'low',
    resolutionScale: 0.75,
    antialias: false,
    postProcessing: false,
    ambientOcclusion: false,
    particleQuality: 'low',
    viewDistance: 'short',
    snowDensity: 'low',
    enhancedShaders: true,
  },
  medium: {
    shadowQuality: 'medium',
    textureQuality: 'medium',
    resolutionScale: 0.9,
    antialias: true,
    postProcessing: true,
    ambientOcclusion: false,
    particleQuality: 'medium',
    viewDistance: 'medium',
    snowDensity: 'normal',
    enhancedShaders: true,
  },
  high: {
    shadowQuality: 'high',
    textureQuality: 'high',
    resolutionScale: 1.0,
    antialias: true,
    postProcessing: true,
    ambientOcclusion: true,
    particleQuality: 'high',
    viewDistance: 'far',
    snowDensity: 'normal',
    enhancedShaders: true,
  },
  ultra: {
    shadowQuality: 'ultra',
    textureQuality: 'high',
    resolutionScale: 1.15,
    antialias: true,
    postProcessing: true,
    ambientOcclusion: true,
    particleQuality: 'high',
    viewDistance: 'ultra',
    snowDensity: 'high',
    enhancedShaders: true,
  },
};

export const SETTINGS_STORAGE_KEY = 'frostwood_settings_v1';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  masterVolume: 0.75,
  muted: false,
  cameraSensitivity: 1.0,
  cameraDistance: 7.8,
  hudLayout: 'minimal',
  showMinimap: true,
  showControlsHint: false,
  snowDensity: 'normal',
  enhancedShaders: true,
  bowAutoAttack: true,
  bowAutoAim: true,
  autoHarvest: true,
  graphicsPreset: 'high',
  shadowQuality: 'high',
  textureQuality: 'high',
  resolutionScale: 1.0,
  antialias: true,
  postProcessing: true,
  ambientOcclusion: true,
  particleQuality: 'high',
  viewDistance: 'far',
  autoAdaptQuality: true,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function detectMatchingGraphicsPreset(
  fields: GraphicsConfigFields,
): GraphicsPreset {
  for (const preset of GRAPHICS_PRESET_ORDER) {
    const cfg = GRAPHICS_PRESET_CONFIGS[preset];
    if (
      fields.shadowQuality === cfg.shadowQuality &&
      fields.textureQuality === cfg.textureQuality &&
      Math.abs(fields.resolutionScale - cfg.resolutionScale) < 0.01 &&
      fields.antialias === cfg.antialias &&
      fields.postProcessing === cfg.postProcessing &&
      fields.ambientOcclusion === cfg.ambientOcclusion &&
      fields.particleQuality === cfg.particleQuality &&
      fields.viewDistance === cfg.viewDistance
    ) {
      return preset;
    }
  }
  return 'custom';
}

export function sanitizeGameSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_GAME_SETTINGS };
  }
  const obj = raw as Record<string, unknown>;
  const hudLayout: HudLayoutMode =
    obj.hudLayout === 'expanded' ? 'expanded' : 'minimal';
  const snowDensity: SnowDensitySetting =
    obj.snowDensity === 'low' || obj.snowDensity === 'high'
      ? obj.snowDensity
      : 'normal';

  const shadowQuality = readEnum<ShadowQualitySetting>(
    obj.shadowQuality,
    ['off', 'low', 'medium', 'high', 'ultra'],
    DEFAULT_GAME_SETTINGS.shadowQuality,
  );
  const textureQuality = readEnum<TextureQualitySetting>(
    obj.textureQuality,
    ['low', 'medium', 'high'],
    DEFAULT_GAME_SETTINGS.textureQuality,
  );
  const particleQuality = readEnum<ParticleQualitySetting>(
    obj.particleQuality,
    ['low', 'medium', 'high'],
    DEFAULT_GAME_SETTINGS.particleQuality,
  );
  const viewDistance = readEnum<ViewDistanceSetting>(
    obj.viewDistance,
    ['short', 'medium', 'far', 'ultra'],
    DEFAULT_GAME_SETTINGS.viewDistance,
  );
  const resolutionScale =
    Math.round(
      clampNumber(
        obj.resolutionScale,
        0.5,
        1.25,
        DEFAULT_GAME_SETTINGS.resolutionScale,
      ) * 20,
    ) / 20;
  const antialias = readBoolean(obj.antialias, DEFAULT_GAME_SETTINGS.antialias);
  const postProcessing = readBoolean(
    obj.postProcessing,
    DEFAULT_GAME_SETTINGS.postProcessing,
  );
  const ambientOcclusion = readBoolean(
    obj.ambientOcclusion,
    DEFAULT_GAME_SETTINGS.ambientOcclusion,
  );

  const requestedPreset = readEnum<GraphicsPreset>(
    obj.graphicsPreset,
    ['low', 'medium', 'high', 'ultra', 'custom'],
    DEFAULT_GAME_SETTINGS.graphicsPreset,
  );
  const matchedPreset = detectMatchingGraphicsPreset({
    shadowQuality,
    textureQuality,
    resolutionScale,
    antialias,
    postProcessing,
    ambientOcclusion,
    particleQuality,
    viewDistance,
  });

  return {
    masterVolume:
      Math.round(
        clampNumber(obj.masterVolume, 0, 1, DEFAULT_GAME_SETTINGS.masterVolume) * 100,
      ) / 100,
    muted: readBoolean(obj.muted, DEFAULT_GAME_SETTINGS.muted),
    cameraSensitivity:
      Math.round(
        clampNumber(
          obj.cameraSensitivity,
          0.4,
          2.0,
          DEFAULT_GAME_SETTINGS.cameraSensitivity,
        ) * 100,
      ) / 100,
    cameraDistance:
      Math.round(
        clampNumber(obj.cameraDistance, 5.5, 11.5, DEFAULT_GAME_SETTINGS.cameraDistance) *
          10,
      ) / 10,
    hudLayout,
    showMinimap: readBoolean(obj.showMinimap, DEFAULT_GAME_SETTINGS.showMinimap),
    showControlsHint: readBoolean(
      obj.showControlsHint,
      DEFAULT_GAME_SETTINGS.showControlsHint,
    ),
    snowDensity,
    enhancedShaders: readBoolean(
      obj.enhancedShaders,
      DEFAULT_GAME_SETTINGS.enhancedShaders,
    ),
    bowAutoAttack: readBoolean(
      obj.bowAutoAttack,
      DEFAULT_GAME_SETTINGS.bowAutoAttack,
    ),
    bowAutoAim: readBoolean(obj.bowAutoAim, DEFAULT_GAME_SETTINGS.bowAutoAim),
    autoHarvest: readBoolean(obj.autoHarvest, DEFAULT_GAME_SETTINGS.autoHarvest),
    graphicsPreset:
      requestedPreset === 'custom' && matchedPreset === 'custom'
        ? 'custom'
        : matchedPreset,
    shadowQuality,
    textureQuality,
    resolutionScale,
    antialias,
    postProcessing,
    ambientOcclusion,
    particleQuality,
    viewDistance,
    autoAdaptQuality: readBoolean(
      obj.autoAdaptQuality,
      DEFAULT_GAME_SETTINGS.autoAdaptQuality,
    ),
  };
}

export function applyGraphicsPreset(
  current: GameSettings,
  preset: NamedGraphicsPreset,
): GameSettings {
  const cfg = GRAPHICS_PRESET_CONFIGS[preset];
  return sanitizeGameSettings({
    ...current,
    ...cfg,
    graphicsPreset: preset,
  });
}

export function mergeGameSettings(
  current: GameSettings,
  partial: Partial<GameSettings>,
): GameSettings {
  if (
    partial.graphicsPreset &&
    partial.graphicsPreset !== 'custom' &&
    partial.graphicsPreset !== current.graphicsPreset
  ) {
    const presetApplied = applyGraphicsPreset(current, partial.graphicsPreset);
    return sanitizeGameSettings({
      ...presetApplied,
      ...partial,
    });
  }
  return sanitizeGameSettings({
    ...current,
    ...partial,
  });
}

export interface ResolvedGraphicsRuntimeConfig {
  shadowMapSize: 0 | 512 | 1024 | 2048 | 4096;
  pixelRatioCap: number;
  farPlane: number;
  fogScale: number;
  particleScale: number;
  anisotropyFraction: number;
  postProcessingEnabled: boolean;
  bloomEnabled: boolean;
  aoEnabled: boolean;
}

export function resolveGraphicsRuntimeConfig(
  settings: GameSettings,
): ResolvedGraphicsRuntimeConfig {
  const shadowMapSize: ResolvedGraphicsRuntimeConfig['shadowMapSize'] =
    settings.shadowQuality === 'off'
      ? 0
      : settings.shadowQuality === 'low'
        ? 512
        : settings.shadowQuality === 'medium'
          ? 1024
          : settings.shadowQuality === 'ultra'
            ? 2048
            : 1024;

  const farPlane =
    settings.viewDistance === 'short'
      ? 145
      : settings.viewDistance === 'medium'
        ? 195
        : settings.viewDistance === 'ultra'
          ? 320
          : 250;

  const fogScale =
    settings.viewDistance === 'short'
      ? 1.28
      : settings.viewDistance === 'medium'
        ? 1.08
        : settings.viewDistance === 'ultra'
          ? 0.82
          : 0.96;

  const particleScale =
    settings.particleQuality === 'low'
      ? 0.45
      : settings.particleQuality === 'medium'
        ? 0.8
        : 1.2;

  const anisotropyFraction =
    settings.textureQuality === 'low'
      ? 0.125
      : settings.textureQuality === 'medium'
        ? 0.5
        : 1.0;

  const postProcessingEnabled = settings.enhancedShaders && settings.postProcessing;

  return {
    shadowMapSize,
    pixelRatioCap: settings.resolutionScale,
    farPlane,
    fogScale,
    particleScale,
    anisotropyFraction,
    postProcessingEnabled,
    bloomEnabled: postProcessingEnabled,
    aoEnabled: postProcessingEnabled && settings.ambientOcclusion,
  };
}

export function evaluateAdaptiveGraphicsStep(
  currentPreset: GraphicsPreset,
  avgFrameMs: number,
): {
  nextPreset: NamedGraphicsPreset | null;
  reason: 'downgrade' | 'upgrade' | null;
} {
  if (!Number.isFinite(avgFrameMs) || avgFrameMs <= 0) {
    return { nextPreset: null, reason: null };
  }
  const normalized: NamedGraphicsPreset =
    currentPreset === 'custom' ? 'high' : currentPreset;
  const idx = GRAPHICS_PRESET_ORDER.indexOf(normalized);

  // Hysteresis band: downgrade above ~27ms (<37 FPS), upgrade only below ~13ms (>76 FPS)
  if (avgFrameMs > 27 && idx > 0) {
    return {
      nextPreset: GRAPHICS_PRESET_ORDER[idx - 1],
      reason: 'downgrade',
    };
  }
  if (avgFrameMs < 13 && idx < GRAPHICS_PRESET_ORDER.length - 1) {
    return {
      nextPreset: GRAPHICS_PRESET_ORDER[idx + 1],
      reason: 'upgrade',
    };
  }
  return { nextPreset: null, reason: null };
}

export function getSnowDensityMultiplier(density: SnowDensitySetting): number {
  switch (density) {
    case 'low':
      return 0.42;
    case 'high':
      return 1.38;
    case 'normal':
    default:
      return 1.0;
  }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveDefaultStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadSettingsFromStorage(
  storage: StorageLike | null = resolveDefaultStorage(),
): GameSettings {
  if (!storage) return { ...DEFAULT_GAME_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    return sanitizeGameSettings(parsed);
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveSettingsToStorage(
  settings: GameSettings,
  storage: StorageLike | null = resolveDefaultStorage(),
): GameSettings {
  const sanitized = sanitizeGameSettings(settings);
  if (!storage) return sanitized;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore quota or privacy mode errors
  }
  return sanitized;
}
