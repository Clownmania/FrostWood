import {
  Camera,
  Crosshair,
  Eye,
  LayoutTemplate,
  Monitor,
  RotateCcw,
  Snowflake,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  GRAPHICS_PRESET_CONFIGS,
  GRAPHICS_PRESET_ORDER,
  type GameSettings,
  type HudLayoutMode,
  type ParticleQualitySetting,
  type ShadowQualitySetting,
  type SnowDensitySetting,
  type TextureQualitySetting,
  type ViewDistanceSetting,
  detectMatchingGraphicsPreset,
} from '../game/settings';

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  compact?: boolean;
}

const SHADOW_OPTIONS: ReadonlyArray<{ id: ShadowQualitySetting; label: string }> = [
  { id: 'off', label: 'Off' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Med' },
  { id: 'high', label: 'High' },
  { id: 'ultra', label: 'Ultra' },
];

const TEXTURE_OPTIONS: ReadonlyArray<{ id: TextureQualitySetting; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Med' },
  { id: 'high', label: 'High' },
];

const PARTICLE_OPTIONS: ReadonlyArray<{ id: ParticleQualitySetting; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Med' },
  { id: 'high', label: 'High' },
];

const VIEW_DIST_OPTIONS: ReadonlyArray<{ id: ViewDistanceSetting; label: string }> = [
  { id: 'short', label: 'Near' },
  { id: 'medium', label: 'Mid' },
  { id: 'far', label: 'Far' },
  { id: 'ultra', label: 'Ultra' },
];

export function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetSettings,
  compact = false,
}: SettingsPanelProps) {
  const volumePct = Math.round(settings.masterVolume * 100);
  const renderScalePct = Math.round(settings.resolutionScale * 100);
  const effectivePreset = detectMatchingGraphicsPreset(settings);

  return (
    <div
      data-testid="settings-panel"
      className={`flex flex-col ${compact ? 'gap-3' : 'gap-4'}`}
    >
      {/* Graphics & Performance Section */}
      <section className="aaa-section rounded-xl p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/20">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#f6c344]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f4efe6]">
              Graphics &amp; Performance
            </h3>
          </div>
          <span
            data-testid="settings-active-preset-label"
            className="text-[11px] font-extrabold uppercase tracking-wider text-[#f6c344]"
          >
            {effectivePreset === 'custom' ? 'Custom Profile' : `${effectivePreset} Preset`}
          </span>
        </div>

        {/* Preset Selector */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-1.5">
            {GRAPHICS_PRESET_ORDER.map((presetId) => {
              const active = effectivePreset === presetId;
              return (
                <button
                  key={presetId}
                  type="button"
                  data-testid={`settings-preset-${presetId}`}
                  aria-pressed={active}
                  onClick={() =>
                    onUpdateSettings({
                      graphicsPreset: presetId,
                      ...GRAPHICS_PRESET_CONFIGS[presetId],
                    })
                  }
                  className={`py-1.5 rounded-lg border text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#d98a2b] border-[#ffeeb3] text-[#131d2b]'
                      : 'bg-[#101c2d] hover:bg-[#1a2c44] border-[#6e8eb0]/35 text-[#cbd5e1]'
                  }`}
                >
                  {presetId}
                </button>
              );
            })}
          </div>

          {/* Granular Quality Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#9db4cb]">Shadow Quality</span>
              <div className="grid grid-cols-5 rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5 gap-0.5">
                {SHADOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`settings-shadow-${opt.id}`}
                    onClick={() => onUpdateSettings({ shadowQuality: opt.id })}
                    className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.shadowQuality === opt.id
                        ? 'bg-[#38bdf8] text-[#082f49]'
                        : 'text-[#b8cbe0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#9db4cb]">View Distance</span>
              <div className="grid grid-cols-4 rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5 gap-0.5">
                {VIEW_DIST_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`settings-viewdist-${opt.id}`}
                    onClick={() => onUpdateSettings({ viewDistance: opt.id })}
                    className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.viewDistance === opt.id
                        ? 'bg-[#38bdf8] text-[#082f49]'
                        : 'text-[#b8cbe0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#9db4cb]">Texture Filtering</span>
              <div className="grid grid-cols-3 rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5 gap-0.5">
                {TEXTURE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`settings-texture-${opt.id}`}
                    onClick={() => onUpdateSettings({ textureQuality: opt.id })}
                    className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.textureQuality === opt.id
                        ? 'bg-[#38bdf8] text-[#082f49]'
                        : 'text-[#b8cbe0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#9db4cb]">Particle Quality</span>
              <div className="grid grid-cols-3 rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5 gap-0.5">
                {PARTICLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`settings-particle-${opt.id}`}
                    onClick={() => onUpdateSettings({ particleQuality: opt.id })}
                    className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.particleQuality === opt.id
                        ? 'bg-[#38bdf8] text-[#082f49]'
                        : 'text-[#b8cbe0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Render Resolution Slider */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#cbd5e1]">
              <label htmlFor="settings-resolution-range">Render Resolution Scale</label>
              <span className="tabular-nums font-bold text-[#7be0ff]">{renderScalePct}%</span>
            </div>
            <input
              id="settings-resolution-range"
              data-testid="settings-resolution-slider"
              type="range"
              min={50}
              max={125}
              step={5}
              value={renderScalePct}
              onChange={(e) =>
                onUpdateSettings({ resolutionScale: Number(e.target.value) / 100 })
              }
              className="w-full accent-[#7be0ff] cursor-pointer"
            />
          </div>

          {/* Feature Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              data-testid="settings-aa-toggle"
              aria-pressed={settings.antialias}
              onClick={() => onUpdateSettings({ antialias: !settings.antialias })}
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                settings.antialias
                  ? 'bg-[#17364d] border-[#7be0ff]/65 text-[#e0f2fe]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span>Anti-Alias</span>
              <span>{settings.antialias ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="settings-postprocess-toggle"
              aria-pressed={settings.postProcessing}
              onClick={() =>
                onUpdateSettings({ postProcessing: !settings.postProcessing })
              }
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                settings.postProcessing
                  ? 'bg-[#3b2912] border-[#f6c344]/70 text-[#fde68a]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span>Post-FX</span>
              <span>{settings.postProcessing ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="settings-ao-toggle"
              aria-pressed={settings.ambientOcclusion}
              onClick={() =>
                onUpdateSettings({ ambientOcclusion: !settings.ambientOcclusion })
              }
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                settings.ambientOcclusion
                  ? 'bg-[#17364d] border-[#7be0ff]/65 text-[#e0f2fe]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span>SSAO</span>
              <span>{settings.ambientOcclusion ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="settings-autoadapt-toggle"
              aria-pressed={settings.autoAdaptQuality}
              onClick={() =>
                onUpdateSettings({ autoAdaptQuality: !settings.autoAdaptQuality })
              }
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                settings.autoAdaptQuality
                  ? 'bg-[#183b30] border-[#6ee7b7]/65 text-[#a7f3d0]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span>Auto FPS</span>
              <span>{settings.autoAdaptQuality ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Audio Section */}
      <section className="aaa-section rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/20">
          <div className="flex items-center gap-2">
            {settings.muted ? (
              <VolumeX className="w-4 h-4 text-[#ef7b73]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#7be0ff]" />
            )}
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f4efe6]">
              Audio
            </h3>
          </div>
          <button
            type="button"
            data-testid="settings-mute-toggle"
            aria-pressed={!settings.muted}
            onClick={() => onUpdateSettings({ muted: !settings.muted })}
            className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
              settings.muted
                ? 'bg-[#3b1820] border border-[#ef7b73]/60 text-[#fecaca]'
                : 'bg-[#1a3c30] border border-[#8ed49a]/60 text-[#a7f3d0]'
            }`}
          >
            {settings.muted ? 'Sound Muted' : 'Sound On'}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#cbd5e1]">
            <label htmlFor="settings-volume-range">Master Volume</label>
            <span className="tabular-nums font-bold text-[#f6c344]">
              {settings.muted ? 'Muted' : `${volumePct}%`}
            </span>
          </div>
          <input
            id="settings-volume-range"
            data-testid="settings-volume-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={volumePct}
            onChange={(e) =>
              onUpdateSettings({
                masterVolume: Number(e.target.value) / 100,
                muted: Number(e.target.value) === 0 ? true : settings.muted,
              })
            }
            className="w-full accent-[#f6c344] cursor-pointer"
          />
        </div>
      </section>

      {/* HUD & Display Section */}
      <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#6e8eb0]/20">
          <LayoutTemplate className="w-4 h-4 text-[#f6c344]" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f4efe6]">
            HUD &amp; Display
          </h3>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[#f4efe6]">HUD Density</div>
              <div className="text-[11px] text-[#9db4cb]">
                Minimal keeps the 3D world open and puts panels in one Menu.
              </div>
            </div>
            <div className="inline-flex rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5">
              {(
                [
                  { id: 'minimal' as HudLayoutMode, label: 'Minimal' },
                  { id: 'expanded' as HudLayoutMode, label: 'Classic' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`settings-hud-layout-${opt.id}`}
                  onClick={() => onUpdateSettings({ hudLayout: opt.id })}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    settings.hudLayout === opt.id
                      ? 'bg-[#d98a2b] text-[#131d2b]'
                      : 'text-[#b8cbe0] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              data-testid="settings-minimap-toggle"
              aria-pressed={settings.showMinimap}
              onClick={() => onUpdateSettings({ showMinimap: !settings.showMinimap })}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                settings.showMinimap
                  ? 'bg-[#17364d] border-[#7be0ff]/65 text-[#e0f2fe]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Radar Minimap
              </span>
              <span>{settings.showMinimap ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="settings-hints-toggle"
              aria-pressed={settings.showControlsHint}
              onClick={() =>
                onUpdateSettings({ showControlsHint: !settings.showControlsHint })
              }
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                settings.showControlsHint
                  ? 'bg-[#17364d] border-[#7be0ff]/65 text-[#e0f2fe]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span>Control Hints</span>
              <span>{settings.showControlsHint ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="settings-shader-toggle"
              aria-pressed={settings.enhancedShaders}
              onClick={() =>
                onUpdateSettings({ enhancedShaders: !settings.enhancedShaders })
              }
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                settings.enhancedShaders
                  ? 'bg-[#3b2912] border-[#f6c344]/70 text-[#fde68a]'
                  : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Shaders
              </span>
              <span>{settings.enhancedShaders ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f4efe6]">
              <Snowflake className="w-3.5 h-3.5 text-[#7be0ff]" />
              <span>Snowfall Density</span>
            </div>
            <div className="inline-flex rounded-lg bg-[#0f1928] border border-[#6e8eb0]/30 p-0.5">
              {(
                [
                  { id: 'low' as SnowDensitySetting, label: 'Low' },
                  { id: 'normal' as SnowDensitySetting, label: 'Normal' },
                  { id: 'high' as SnowDensitySetting, label: 'High' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`settings-snow-${opt.id}`}
                  onClick={() => onUpdateSettings({ snowDensity: opt.id })}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    settings.snowDensity === opt.id
                      ? 'bg-[#38bdf8] text-[#082f49]'
                      : 'text-[#b8cbe0] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Camera & Gameplay Assists */}
      <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#6e8eb0]/20">
          <Camera className="w-4 h-4 text-[#8ed49a]" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f4efe6]">
            Camera &amp; Field Assists
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#cbd5e1]">
              <label htmlFor="settings-sens-range">Orbit Sensitivity</label>
              <span className="tabular-nums font-bold text-[#f6c344]">
                {settings.cameraSensitivity.toFixed(1)}×
              </span>
            </div>
            <input
              id="settings-sens-range"
              data-testid="settings-sensitivity-slider"
              type="range"
              min={40}
              max={200}
              step={10}
              value={Math.round(settings.cameraSensitivity * 100)}
              onChange={(e) =>
                onUpdateSettings({ cameraSensitivity: Number(e.target.value) / 100 })
              }
              className="w-full accent-[#f6c344] cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#cbd5e1]">
              <label htmlFor="settings-dist-range">Camera Distance</label>
              <span className="tabular-nums font-bold text-[#7be0ff]">
                {settings.cameraDistance.toFixed(1)}m
              </span>
            </div>
            <input
              id="settings-dist-range"
              data-testid="settings-distance-slider"
              type="range"
              min={55}
              max={115}
              step={5}
              value={Math.round(settings.cameraDistance * 10)}
              onChange={(e) =>
                onUpdateSettings({ cameraDistance: Number(e.target.value) / 10 })
              }
              className="w-full accent-[#7be0ff] cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            data-testid="settings-auto-bow-toggle"
            aria-pressed={settings.bowAutoAttack}
            onClick={() => onUpdateSettings({ bowAutoAttack: !settings.bowAutoAttack })}
            className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
              settings.bowAutoAttack
                ? 'bg-[#402b12] border-[#f6c344]/70 text-[#fde68a]'
                : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
            }`}
          >
            <span className="inline-flex items-center gap-1 truncate">
              <Crosshair className="w-3.5 h-3.5 shrink-0" />
              Auto-Bow
            </span>
            <span>{settings.bowAutoAttack ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            data-testid="settings-auto-aim-toggle"
            aria-pressed={settings.bowAutoAim}
            onClick={() => onUpdateSettings({ bowAutoAim: !settings.bowAutoAim })}
            className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
              settings.bowAutoAim
                ? 'bg-[#183b30] border-[#6ee7b7]/65 text-[#a7f3d0]'
                : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
            }`}
          >
            <span className="truncate">Auto-Aim</span>
            <span>{settings.bowAutoAim ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            data-testid="settings-auto-harvest-toggle"
            aria-pressed={settings.autoHarvest}
            onClick={() => onUpdateSettings({ autoHarvest: !settings.autoHarvest })}
            className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
              settings.autoHarvest
                ? 'bg-[#402b12] border-[#f6c344]/70 text-[#fde68a]'
                : 'bg-[#111c2c] border-[#455c78]/45 text-[#8da4be]'
            }`}
          >
            <span className="truncate">Auto-Chop</span>
            <span>{settings.autoHarvest ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </section>

      <div className="flex items-center justify-end">
        <button
          type="button"
          data-testid="settings-reset-btn"
          onClick={onResetSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d2e45] hover:bg-[#283f5e] border border-[#6e8eb0]/40 text-xs font-bold text-[#cbd5e1] cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
