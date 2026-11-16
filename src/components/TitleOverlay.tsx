import { Trophy } from 'lucide-react';
import type { HallOfFameEntry, PlayerLifetimeStats } from '../game/types';
import { GoldIcon, TitleEmblemSvg } from './SvgAssets';

interface TitleOverlayProps {
  bestGold: number;
  lifetimeStats: PlayerLifetimeStats;
  hallOfFame: HallOfFameEntry[];
  onStart: () => void;
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
  onStart,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 sm:p-8 lg:p-12 overflow-y-auto">
      {/* Left Negative Space Lockup: Title, Primary CTA & Hall of Fame */}
      <div className="max-w-[520px] pt-2 sm:pt-4 pointer-events-auto flex flex-col gap-5">
        <div>
          <TitleEmblemSvg className="w-[300px] sm:w-[390px] h-auto drop-shadow-[0_6px_18px_rgba(12,20,34,0.65)]" />

          <div className="mt-5 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="px-7 py-3.5 rounded-lg bg-[#d98a2b] hover:bg-[#e89b38] active:translate-y-0.5 text-[#131d2b] font-display font-bold text-lg tracking-wider uppercase border-2 border-[#f7d88b] shadow-[0_6px_20px_rgba(10,16,28,0.55)] transition-colors cursor-pointer"
            >
              Start Expedition
            </button>

            {bestGold > 0 && (
              <div className="px-4 py-2.5 rounded-lg bg-[#162336]/90 border border-[#7fa4c8]/45 text-sm font-semibold text-[#f4efe6] tabular-nums shadow-[0_4px_12px_rgba(10,16,28,0.45)]">
                Best Run: <span className="text-[#f6c344]">{bestGold} Gold</span>
              </div>
            )}
          </div>
        </div>

        {/* Hall of Fame & Career Statistics */}
        <section
          aria-label="Hall of Fame"
          data-testid="hall-of-fame"
          className="rounded-xl bg-[#162336]/90 border border-[#7fa4c8]/45 p-4 shadow-[0_12px_28px_rgba(8,14,24,0.6)]"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#6e8eb0]/30">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#f6c344] shrink-0" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#f4efe6]">
                Hall of Fame
              </h2>
            </div>
            {lifetimeStats.totalRuns > 0 && (
              <span className="text-[11px] font-semibold tabular-nums text-[#9db4cb]">
                {lifetimeStats.totalRuns} {lifetimeStats.totalRuns === 1 ? 'Run' : 'Runs'} ·{' '}
                {lifetimeStats.victories} {lifetimeStats.victories === 1 ? 'Victory' : 'Victories'}
              </span>
            )}
          </div>

          {lifetimeStats.totalRuns > 0 && (
            <div className="grid grid-cols-4 gap-2 py-2.5 border-b border-[#6e8eb0]/25 text-center tabular-nums">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">Total Gold</div>
                <div className="text-sm font-bold text-[#f6c344]">
                  {lifetimeStats.totalGoldEarned}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">Timber</div>
                <div className="text-sm font-bold text-[#f4efe6]">
                  {lifetimeStats.totalWoodHarvested}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">Hunts</div>
                <div className="text-sm font-bold text-[#f4efe6]">
                  {lifetimeStats.totalAnimalsHunted}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">
                  {lifetimeStats.fastestVictorySeconds !== null ? 'Fastest Win' : 'Objectives'}
                </div>
                <div className="text-sm font-bold text-[#8ed49a]">
                  {lifetimeStats.fastestVictorySeconds !== null
                    ? formatDuration(lifetimeStats.fastestVictorySeconds)
                    : lifetimeStats.totalObjectivesCompleted}
                </div>
              </div>
            </div>
          )}

          {hallOfFame.length > 0 ? (
            <ol className="mt-2.5 flex flex-col gap-1.5">
              {hallOfFame.slice(0, 5).map((entry, idx) => {
                const rankBadgeCls =
                  idx === 0
                    ? 'bg-[#f6c344] text-[#131d2b]'
                    : idx === 1
                      ? 'bg-[#cbd5e1] text-[#131d2b]'
                      : idx === 2
                        ? 'bg-[#d98a2b] text-[#131d2b]'
                        : 'bg-[#22354f] text-[#b8cbe0]';

                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#1d2e47]/90 border border-[#6e8eb0]/25 px-3 py-1.5 text-xs tabular-nums"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded font-bold text-[11px] flex items-center justify-center shrink-0 ${rankBadgeCls}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-[#f4efe6] truncate">
                          {entry.victory ? 'Lodge Built' : `Cabin Tier ${entry.cabinTier}/5`}
                        </div>
                        <div className="text-[11px] text-[#9db4cb]">
                          {entry.woodHarvested} wood · {entry.animalsHunted} hunts ·{' '}
                          {formatDuration(entry.elapsedSeconds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-sm text-[#f6c344] shrink-0">
                      <GoldIcon className="w-3.5 h-3.5" />
                      <span>{entry.goldEarned}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-[#b8cbe0] leading-relaxed">
              No expeditions logged yet. Harvest timber, hunt wildlife, and return with gold to claim the top rank.
            </p>
          )}
        </section>
      </div>

      {/* Single Flat Borderless Control Hint Line */}
      <div className="w-full flex justify-center pt-4 pb-1">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#f4efe6] hud-text-stroke text-center">
          WASD Move · Shift Creep · Space / Click Chop &amp; Hunt · 1 / 2 Tool · E Trade · U Upgrades · C Craft · Esc Pause
        </p>
      </div>
    </div>
  );
}
