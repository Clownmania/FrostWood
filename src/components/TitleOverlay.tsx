import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  FolderOpen,
  Gift,
  Play,
  Settings,
  Trash2,
  Trophy,
} from 'lucide-react';
import { getCraftRecipe } from '../game/crafting';
import { SAVE_SLOT_IDS } from '../game/persistence';
import type { GameSettings } from '../game/settings';
import type {
  CraftItemId,
  DailyLoginState,
  HallOfFameEntry,
  PlayerLifetimeStats,
  SaveSlotId,
  SaveSlotsMap,
} from '../game/types';
import { SettingsPanel } from './SettingsPanel';
import { GoldIcon, TitleEmblemSvg } from './SvgAssets';

type TitleMenuView = 'home' | 'saves' | 'records' | 'settings';

interface TitleOverlayProps {
  bestGold: number;
  lifetimeStats: PlayerLifetimeStats;
  hallOfFame: HallOfFameEntry[];
  dailyLogin: DailyLoginState;
  saveSlots: SaveSlotsMap;
  settings: GameSettings;
  onStart: () => void;
  onClaimDailyLoginReward: () => void;
  onLoadGame: (slotId: SaveSlotId) => void;
  onDeleteSave: (slotId: SaveSlotId) => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetSettings: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TitleOverlay({
  bestGold,
  lifetimeStats,
  hallOfFame,
  dailyLogin,
  saveSlots,
  settings,
  onStart,
  onClaimDailyLoginReward,
  onLoadGame,
  onDeleteSave,
  onUpdateSettings,
  onResetSettings,
}: TitleOverlayProps) {
  const [view, setView] = useState<TitleMenuView>('home');

  const populatedSlots = SAVE_SLOT_IDS.map((id) => saveSlots[id]).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );
  const todayReward = dailyLogin.todayReward;

  return (
    <div
      data-testid="main-menu"
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-8 lg:p-10 overflow-y-auto"
    >
      <div className="my-auto w-full flex justify-center sm:justify-start">
        <div
          className={`pointer-events-auto transition-[max-width] duration-200 w-full ${
            view === 'home' ? 'max-w-[390px]' : 'max-w-[660px]'
          } aaa-frame rounded-2xl p-5 sm:p-6`}
        >
          {view === 'home' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-start gap-2">
                <TitleEmblemSvg className="w-[240px] sm:w-[290px] h-auto drop-shadow-[0_6px_18px_rgba(12,20,34,0.65)]" />
                <p className="text-xs font-medium tracking-wide text-[#9db4cb]">
                  Alpine survival · Timber, hunting &amp; crystal lagoon fishing
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  data-start="true"
                  data-testid="title-start-btn"
                  onClick={onStart}
                  className="aaa-cta-btn w-full px-5 py-3.5 rounded-xl active:translate-y-0.5 font-display font-bold text-base tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start New Expedition</span>
                </button>

                {populatedSlots.length > 0 && (
                  <button
                    type="button"
                    data-testid="title-continue-latest-btn"
                    onClick={() => onLoadGame(populatedSlots[0].slotId)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#234b3d] to-[#19352b] hover:brightness-110 text-[#e9f8ee] font-display font-bold text-sm tracking-wider uppercase border border-[#8ed49a]/60 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#8ed49a]" />
                      <span>Continue Expedition</span>
                    </span>
                    <span className="text-[11px] font-sans font-semibold text-[#a7f3d0] tabular-nums">
                      Day {populatedSlots[0].dayNumber} · {populatedSlots[0].resources.gold}g
                    </span>
                  </button>
                )}

                <div className="h-px bg-[#6e8eb0]/20 my-0.5" />

                <button
                  type="button"
                  data-testid="title-nav-saves"
                  onClick={() => setView('saves')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#16253a] hover:bg-[#1f334f] border border-[#6e8eb0]/30 text-sm font-bold text-[#e2eefb] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#7be0ff]" />
                    <span>Saved Expeditions</span>
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[#9db4cb]">
                    {populatedSlots.length}/4
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="title-nav-records"
                  onClick={() => setView('records')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#16253a] hover:bg-[#1f334f] border border-[#6e8eb0]/30 text-sm font-bold text-[#e2eefb] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-[#f6c344]" />
                    <span>Daily Drop &amp; Hall of Fame</span>
                  </span>
                  {dailyLogin.canClaimToday ? (
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f6c344]">
                      Claim D{dailyLogin.streakDay}
                    </span>
                  ) : bestGold > 0 ? (
                    <span className="text-xs font-semibold tabular-nums text-[#fde68a]">
                      Best {bestGold}g
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  data-testid="title-nav-settings"
                  onClick={() => setView('settings')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#16253a] hover:bg-[#1f334f] border border-[#6e8eb0]/30 text-sm font-bold text-[#e2eefb] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-[#9db4cb]" />
                    <span>Settings</span>
                  </span>
                  <span className="text-xs font-semibold text-[#9db4cb] uppercase">
                    {settings.hudLayout === 'minimal' ? 'Minimal HUD' : 'Classic HUD'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[82vh] overflow-y-auto pr-0.5">
              {/* Sub-view Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#6e8eb0]/25">
                <button
                  type="button"
                  data-testid="title-back-home-btn"
                  onClick={() => setView('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182940] hover:bg-[#223856] border border-[#6e8eb0]/35 text-xs font-bold text-[#dce6f2] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Main Menu</span>
                </button>
                <h2 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-[#f4efe6]">
                  {view === 'saves'
                    ? 'Saved Expeditions'
                    : view === 'records'
                      ? 'Daily Drop & Hall of Fame'
                      : 'Settings'}
                </h2>
              </div>

              {view === 'settings' && (
                <SettingsPanel
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  onResetSettings={onResetSettings}
                />
              )}

              {view === 'saves' && (
                <section
                  aria-label="Saved Expeditions"
                  data-testid="title-save-slots"
                  className="flex flex-col gap-2.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SAVE_SLOT_IDS.map((slotId) => {
                      const slot = saveSlots[slotId];
                      const slotTitle =
                        slotId === 'autosave'
                          ? 'Auto-Save'
                          : `Manual Slot ${slotId.replace('slot', '')}`;
                      if (!slot) {
                        return (
                          <div
                            key={slotId}
                            data-testid={`title-save-slot-${slotId}`}
                            className="rounded-xl bg-[#131f30] border border-[#6e8eb0]/20 px-3.5 py-3 text-xs text-[#7f97b0] flex items-center justify-between"
                          >
                            <span className="font-semibold">{slotTitle}</span>
                            <span className="text-[11px] italic">Empty Slot</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={slotId}
                          data-testid={`title-save-slot-${slotId}`}
                          className="rounded-xl bg-[#17273d] border border-[#7fa4c8]/40 px-3.5 py-3 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#f4efe6] truncate">
                              {slotTitle} · {slot.zoneName}
                            </div>
                            <div className="text-[11px] text-[#9db4cb] tabular-nums mt-0.5">
                              Day {slot.dayNumber} · Cabin T{slot.cabinTier} · {slot.resources.gold}g
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              data-testid={`title-load-${slotId}`}
                              onClick={() => onLoadGame(slotId)}
                              className="px-3 py-1.5 rounded-lg bg-[#2d5e4c] hover:bg-[#38755f] text-[#f4efe6] font-bold text-[11px] uppercase cursor-pointer"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${slotTitle}`}
                              data-testid={`title-delete-${slotId}`}
                              onClick={() => onDeleteSave(slotId)}
                              className="p-1.5 rounded-lg bg-[#2b2233] hover:bg-[#472936] text-[#fda4af] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {view === 'records' && (
                <div className="flex flex-col gap-4">
                  {/* Daily Login Reward Card */}
                  <section
                    aria-label="Daily Login Rewards"
                    data-testid="title-daily-login"
                    className="rounded-xl bg-[#162438] border border-[#f6c344]/40 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/25">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#f6c344] shrink-0" />
                        <h3 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-[#f4efe6]">
                          Daily Supply Drop · Day {dailyLogin.streakDay}/7
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#f6c344] tabular-nums">
                        {dailyLogin.totalDaysClaimed} Claimed
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#111c2c] border border-[#7fa4c8]/25 p-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#f6c344]">
                          {todayReward.subtitle} — {todayReward.title}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#e2ecf7]">
                          {Object.entries(todayReward.resources).map(([resKey, qty]) =>
                            qty ? (
                              <span key={resKey} className="text-[#f7d88b]">
                                +{qty} {resKey.charAt(0).toUpperCase() + resKey.slice(1)}
                              </span>
                            ) : null,
                          )}
                          {Object.entries(todayReward.craftItems).map(([itemId, qty]) =>
                            qty ? (
                              <span key={itemId} className="text-[#93c5fd]">
                                +{qty} {getCraftRecipe(itemId as CraftItemId).name}
                              </span>
                            ) : null,
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid="title-claim-daily-btn"
                        disabled={!dailyLogin.canClaimToday}
                        onClick={onClaimDailyLoginReward}
                        className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider shrink-0 transition-colors ${
                          dailyLogin.canClaimToday
                            ? 'bg-[#f6c344] hover:bg-[#ffd15c] text-[#131d2b] cursor-pointer'
                            : 'bg-[#22354f] text-[#8da4be] cursor-not-allowed'
                        }`}
                      >
                        {dailyLogin.canClaimToday ? 'Claim Bonus' : 'Claimed ✓'}
                      </button>
                    </div>
                  </section>

                  {/* Hall of Fame */}
                  <section
                    aria-label="Hall of Fame"
                    data-testid="hall-of-fame"
                    className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/25">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#f6c344] shrink-0" />
                        <h3 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-[#f4efe6]">
                          Hall of Fame
                        </h3>
                      </div>
                      {lifetimeStats.totalRuns > 0 && (
                        <span className="text-[11px] font-semibold tabular-nums text-[#9db4cb]">
                          {lifetimeStats.totalRuns} Runs · {lifetimeStats.victories} Wins
                        </span>
                      )}
                    </div>

                    {hallOfFame.length > 0 ? (
                      <ol className="mt-2.5 flex flex-col gap-1.5">
                        {hallOfFame.slice(0, 4).map((entry, idx) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[#111c2c] border border-[#6e8eb0]/25 px-3 py-2 text-xs tabular-nums"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#f4efe6] truncate">
                                #{idx + 1} · {entry.victory ? 'Lodge Built' : `Cabin Tier ${entry.cabinTier}/5`}
                              </div>
                              <div className="text-[11px] text-[#9db4cb]">
                                {entry.woodHarvested} wood · {entry.animalsHunted} hunts ·{' '}
                                {formatDuration(entry.elapsedSeconds)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-sm text-[#f6c344] shrink-0">
                              <GoldIcon className="w-3.5 h-3.5" />
                              <span>{entry.goldEarned}</span>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2.5 text-xs text-[#9db4cb]">
                        No expeditions logged yet. Start an expedition to set the first record.
                      </p>
                    )}
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {settings.showControlsHint && view === 'home' && (
        <div className="w-full flex justify-center pt-3">
          <p className="text-xs font-semibold tracking-wide text-[#f4efe6] hud-text-stroke text-center">
            WASD Move · Space Chop/Hunt · 1/2/3 Tool · Tab Menu · Esc Pause
          </p>
        </div>
      )}
    </div>
  );
}
