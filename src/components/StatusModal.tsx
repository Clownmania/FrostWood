import { useEffect, useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { SAVE_SLOT_IDS } from '../game/persistence';
import type { GameSettings } from '../game/settings';
import type { HudSnapshot, SaveSlotId } from '../game/types';
import { SettingsPanel } from './SettingsPanel';

interface StatusModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onContinueEndless: () => void;
  onTitle: () => void;
  onSaveGame: (slotId: SaveSlotId) => void;
  onLoadGame: (slotId: SaveSlotId) => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetSettings: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StatusModal({
  hud,
  onResume,
  onRestart,
  onContinueEndless,
  onTitle,
  onSaveGame,
  onLoadGame,
  onUpdateSettings,
  onResetSettings,
}: StatusModalProps) {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (hud.phase !== 'paused' && showSettings) {
      setShowSettings(false);
    }
  }, [hud.phase, showSettings]);

  if (hud.phase === 'paused') {
    const manualSlots: SaveSlotId[] = ['slot1', 'slot2', 'slot3'];
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b1320]/75 p-4">
        <div
          role="dialog"
          aria-label="Game Paused"
          data-testid="pause-modal"
          className={`w-full ${
            showSettings ? 'max-w-xl' : 'max-w-md'
          } aaa-frame rounded-2xl p-5 sm:p-6 max-h-[88vh] overflow-y-auto`}
        >
          {showSettings ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#6e8eb0]/25">
                <button
                  type="button"
                  data-testid="pause-settings-back-btn"
                  onClick={() => setShowSettings(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2b42] hover:bg-[#233a59] border border-[#6e8eb0]/35 text-xs font-bold text-[#dce6f2] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#f4efe6]">
                  Settings
                </h2>
              </div>
              <SettingsPanel
                settings={hud.settings}
                onUpdateSettings={onUpdateSettings}
                onResetSettings={onResetSettings}
                compact
              />
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl tracking-wider text-[#f4efe6]">
                EXPEDITION PAUSED
              </h2>
              <p className="text-xs text-[#9db4cb] mt-1">
                {hud.zone.name} · Day {hud.dayNight.dayNumber} · Cabin Tier {hud.levels.cabin}/5
              </p>

              {/* Quick Save / Load */}
              <div className="mt-4 rounded-xl bg-[#162438] border border-[#6e8eb0]/30 p-3 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9db4cb] mb-2 flex items-center justify-between">
                  <span>Save / Load</span>
                  <span className="text-[#8ed49a]">Auto-saved ✓</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {manualSlots.map((slotId) => {
                    const slot = hud.saveSlots[slotId];
                    const slotTitle = `Slot ${slotId.replace('slot', '')}`;
                    return (
                      <div
                        key={slotId}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#101c2d] border border-[#6e8eb0]/25 px-2.5 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#f4efe6]">{slotTitle}: </span>
                          {slot ? (
                            <span className="text-[#9db4cb] tabular-nums">
                              {slot.zoneName} · D{slot.dayNumber} · {slot.resources.gold}g
                            </span>
                          ) : (
                            <span className="text-[#7f97b0] italic">Empty</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            data-testid={`pause-save-${slotId}`}
                            onClick={() => onSaveGame(slotId)}
                            className="px-2.5 py-1 rounded bg-[#2b4c70] hover:bg-[#365f8c] text-[#f4efe6] font-bold text-[11px] uppercase cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            data-testid={`pause-load-${slotId}`}
                            disabled={!slot}
                            onClick={() => onLoadGame(slotId)}
                            className={`px-2.5 py-1 rounded font-bold text-[11px] uppercase ${
                              slot
                                ? 'bg-[#2d5e4c] hover:bg-[#38755f] text-[#f4efe6] cursor-pointer'
                                : 'bg-[#1f2e42] text-[#5e738b] cursor-not-allowed'
                            }`}
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  data-testid="pause-resume-btn"
                  onClick={onResume}
                  className="aaa-cta-btn w-full py-2.5 rounded-xl font-display font-bold tracking-wider uppercase cursor-pointer transition-colors"
                >
                  Resume Expedition
                </button>
                <button
                  type="button"
                  data-testid="pause-settings-btn"
                  onClick={() => setShowSettings(true)}
                  className="w-full py-2.5 rounded-xl bg-[#182940] hover:bg-[#223856] border border-[#6e8eb0]/35 text-[#e2eefb] font-bold text-sm cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4 text-[#7be0ff]" />
                  Settings
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onRestart}
                    className="w-full py-2 rounded-xl bg-[#1b2b42] hover:bg-[#253a57] text-[#f4efe6] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Restart Run
                  </button>
                  <button
                    type="button"
                    data-testid="pause-main-menu-btn"
                    onClick={onTitle}
                    className="w-full py-2 rounded-xl bg-[#1b2b42] hover:bg-[#253a57] text-[#b4c8dd] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (hud.phase !== 'gameover') return null;

  const latestSave = SAVE_SLOT_IDS.map((id) => hud.saveSlots[id]).find((s) => s !== null) ?? null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b1320]/75 p-4">
      <div
        role="dialog"
        aria-label={hud.victory ? 'Grand Winter Lodge Completed' : 'Expedition Lost'}
        className="aaa-frame w-full max-w-lg rounded-2xl p-6 sm:p-7 text-center"
      >
        <h2
          className={`font-display font-extrabold text-2xl sm:text-3xl tracking-wider ${
            hud.victory ? 'text-[#f6c344]' : 'text-[#ef7b73]'
          }`}
        >
          {hud.victory ? 'FROSTWOOD EMPIRE BUILT' : 'FROZEN IN THE WILDS'}
        </h2>
        <p className="text-sm text-[#b8cbe0] mt-1.5">
          {hud.victory
            ? 'Your Grand Winter Lodge stands triumphant over the alpine frontier.'
            : 'The winter cold and timber wolves claimed the expedition.'}
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-5">
          <div className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#9db4cb]">
              {hud.victory ? 'Clear Time' : 'Cabin Tier'}
            </div>
            <div className="text-lg font-bold tabular-nums text-[#f4efe6] mt-0.5">
              {hud.victory
                ? formatDuration(hud.stats.elapsedSeconds)
                : `${hud.levels.cabin} / 5`}
            </div>
          </div>

          <div className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#9db4cb]">
              Wood &amp; Hunts
            </div>
            <div className="text-lg font-bold tabular-nums text-[#f4efe6] mt-0.5">
              {Math.round(hud.stats.woodHarvested)} / {hud.stats.animalsHunted}
            </div>
          </div>

          <div className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#9db4cb]">
              Gold (Best)
            </div>
            <div className="text-lg font-bold tabular-nums text-[#f6c344] mt-0.5">
              {Math.round(hud.stats.goldEarned)} ({hud.bestGold})
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-[#9db4cb]">
          Expedition saved to Hall of Fame · {hud.lifetimeStats.totalRuns} total{' '}
          {hud.lifetimeStats.totalRuns === 1 ? 'run' : 'runs'} logged.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {hud.victory && (
            <button
              type="button"
              onClick={onContinueEndless}
              className="px-5 py-3 rounded-lg bg-[#2d5e4c] hover:bg-[#38755f] border border-[#8ed49a]/50 text-[#f4efe6] font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors"
            >
              Continue Endless Tycoon
            </button>
          )}

          {latestSave && !hud.victory && (
            <button
              type="button"
              onClick={() => onLoadGame(latestSave.slotId)}
              className="px-5 py-3 rounded-lg bg-[#2d5e4c] hover:bg-[#38755f] border border-[#8ed49a]/50 text-[#f4efe6] font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors"
            >
              Load {latestSave.label}
            </button>
          )}

          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="aaa-cta-btn px-6 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors"
          >
            {hud.victory ? 'Play Again' : 'Try Again'}
          </button>

          <button
            type="button"
            onClick={onTitle}
            className="px-4 py-3 rounded-lg bg-[#22354f] hover:bg-[#2c4566] text-[#dce6f2] font-semibold text-sm cursor-pointer transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
