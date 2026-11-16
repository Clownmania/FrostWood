import type { HudSnapshot } from '../game/types';

interface StatusModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onContinueEndless: () => void;
  onTitle: () => void;
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
}: StatusModalProps) {
  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b1320]/70 p-4">
        <div
          role="dialog"
          aria-label="Game Paused"
          className="w-full max-w-md rounded-xl bg-[#162336] border-2 border-[#7fa4c8]/55 p-6 shadow-[0_18px_44px_rgba(6,10,18,0.8)] text-center"
        >
          <h2 className="font-display font-extrabold text-2xl tracking-wider text-[#f4efe6]">
            EXPEDITION PAUSED
          </h2>
          <p className="text-sm text-[#a8bdd3] mt-1.5">
            Cabin Tier {hud.levels.cabin}/5 · {hud.workerCount} Active Workers
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-lg bg-[#d98a2b] hover:bg-[#e89b38] text-[#131d2b] font-display font-bold tracking-wider uppercase cursor-pointer transition-colors"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 rounded-lg bg-[#22354f] hover:bg-[#2c4566] text-[#f4efe6] font-semibold cursor-pointer transition-colors"
            >
              Restart Expedition
            </button>
            <button
              type="button"
              onClick={onTitle}
              className="w-full py-2.5 rounded-lg bg-[#1b2b42] hover:bg-[#253a57] text-[#b4c8dd] font-semibold cursor-pointer transition-colors"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase !== 'gameover') return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b1320]/75 p-4">
      <div
        role="dialog"
        aria-label={hud.victory ? 'Grand Winter Lodge Completed' : 'Expedition Lost'}
        className="w-full max-w-lg rounded-xl bg-[#162336] border-2 border-[#f6c344]/60 p-6 sm:p-7 shadow-[0_18px_44px_rgba(6,10,18,0.85)] text-center"
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

        {/* Stat Tiles */}
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

          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="px-6 py-3 rounded-lg bg-[#d98a2b] hover:bg-[#e89b38] text-[#131d2b] font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors"
          >
            {hud.victory ? 'Play Again' : 'Try Again'}
          </button>

          <button
            type="button"
            onClick={onTitle}
            className="px-4 py-3 rounded-lg bg-[#22354f] hover:bg-[#2c4566] text-[#dce6f2] font-semibold text-sm cursor-pointer transition-colors"
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
}
