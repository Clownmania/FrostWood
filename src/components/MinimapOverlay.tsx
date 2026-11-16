import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react';
import { computeMinimapLayout, worldToMinimap } from '../game/minimap';
import type {
  MinimapBossBlip,
  MinimapChestBlip,
  MinimapHunterBlip,
  MinimapWildlifeBlip,
  ZoneHudInfo,
} from '../game/types';

interface MinimapOverlayProps {
  zone: ZoneHudInfo;
  wildlifeBlips?: MinimapWildlifeBlip[];
  hunterBlips?: MinimapHunterBlip[];
  chestBlips?: MinimapChestBlip[];
  bossBlip?: MinimapBossBlip | null;
  sightActive?: boolean;
}

function blipColorHex(blip: MinimapWildlifeBlip): string {
  if (blip.rarity === 'mythic') return '#f0abfc';
  if (blip.rarity === 'epic') return '#f6c344';
  if (blip.rarity === 'rare') return '#5be7ff';
  return blip.predator ? '#ef7b73' : '#8ed49a';
}

export function MinimapOverlay({
  zone,
  wildlifeBlips = [],
  hunterBlips = [],
  chestBlips = [],
  bossBlip = null,
  sightActive = false,
}: MinimapOverlayProps) {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const onResize = () => {
      setCollapsed(window.innerWidth < 640);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const layout = computeMinimapLayout(
    zone.playerX,
    zone.playerZ,
    zone.playerYaw,
    zone.id,
  );
  const inLevel2 = zone.id === 'level2';
  const inCity = zone.id === 'city';

  return (
    <aside
      aria-label="World Navigation Minimap"
      data-testid="minimap-overlay"
      data-zone={zone.id}
      data-player-x={zone.playerX}
      data-player-z={zone.playerZ}
      className={`pointer-events-auto rounded-xl border shadow-[0_8px_22px_rgba(8,14,24,0.58)] transition-colors ${
        inCity
          ? 'bg-[#1f1a12]/94 border-[#f6c344]/65'
          : inLevel2
            ? 'bg-[#102638]/94 border-[#5be7ff]/60'
            : 'bg-[#162336]/92 border-[#6e8eb0]/45'
      } ${collapsed ? 'w-auto' : 'w-[148px] sm:w-[184px]'}`}
    >
      {/* Header / Collapse Toggle */}
      <button
        type="button"
        tabIndex={-1}
        data-testid="minimap-toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand World Minimap' : 'Collapse World Minimap'}
        onClick={(e) => {
          e.currentTarget.blur();
          setCollapsed((prev) => !prev);
        }}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left cursor-pointer hover:bg-[#22354f]/55 rounded-t-xl"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#dce6f2]">
          <MapIcon
            className={`w-3.5 h-3.5 shrink-0 ${
              inCity ? 'text-[#f6c344]' : inLevel2 ? 'text-[#7be0ff]' : 'text-[#f6c344]'
            }`}
          />
          <span>Map</span>
          <span className="text-[#9db4cb] font-semibold">
            {inCity ? 'CITY' : `L${zone.levelNumber}`}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#9db4cb]" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-[#9db4cb]" />
        )}
      </button>

      {!collapsed && (
        <div className="px-2 pb-2 pt-0.5 flex flex-col gap-1.5 border-t border-[#6e8eb0]/25">
          {/* Tri-Zone North-Up SVG Map */}
          <div className="relative rounded-lg bg-[#0d1726] border border-[#3e536b]/80 overflow-hidden">
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="w-full h-auto block"
              role="img"
              aria-label={`Minimap showing Frostwood Valley, northern Glacial Highlands, and eastern Frostcave City. Player in ${zone.name}.`}
            >
              <defs>
                <radialGradient id="l2-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={inLevel2 ? '#1c4d6b' : '#132a3e'} />
                  <stop offset="100%" stopColor={inLevel2 ? '#12334a' : '#0f2030'} />
                </radialGradient>
                <radialGradient id="l1-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={zone.id === 'level1' ? '#233a54' : '#162538'} />
                  <stop offset="100%" stopColor={zone.id === 'level1' ? '#17283d' : '#111d2d'} />
                </radialGradient>
                <radialGradient id="city-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={inCity ? '#3d2e18' : '#1f1c18'} />
                  <stop offset="100%" stopColor={inCity ? '#261d11' : '#141312'} />
                </radialGradient>
              </defs>

              {/* Subtle Coordinate Crosshairs */}
              <line
                x1={layout.width * 0.5}
                y1={6}
                x2={layout.width * 0.5}
                y2={layout.height - 6}
                stroke="#324963"
                strokeWidth="0.6"
                strokeDasharray="2 3"
              />
              <line
                x1={10}
                y1={layout.level2Zone.y}
                x2={layout.width - 10}
                y2={layout.level2Zone.y}
                stroke="#283d54"
                strokeWidth="0.5"
              />
              <line
                x1={10}
                y1={layout.level1Zone.y}
                x2={layout.width - 10}
                y2={layout.level1Zone.y}
                stroke="#283d54"
                strokeWidth="0.5"
              />

              {/* North Cardinal Indicator */}
              <text
                x={layout.width - 11}
                y={13}
                textAnchor="middle"
                fill="#7be0ff"
                fontSize="8"
                fontWeight="700"
              >
                N
              </text>

              {/* Level 2: Northern Glacial Highlands Circle */}
              <circle
                cx={layout.level2Zone.x}
                cy={layout.level2Zone.y}
                r={layout.level2Zone.r}
                fill="url(#l2-zone-grad)"
                stroke={inLevel2 ? '#67e8f9' : '#4a7091'}
                strokeWidth={inLevel2 ? 1.8 : 1.1}
              />
              <text
                x={layout.level2Zone.x}
                y={layout.level2Zone.y - layout.level2Zone.r - 4.5}
                textAnchor="middle"
                fill={inLevel2 ? '#a5f3fc' : '#85a6c4'}
                fontSize="6.8"
                fontWeight="700"
                letterSpacing="0.5"
              >
                L2 HIGHLANDS
              </text>

              {/* Level 1: Starting Frostwood Valley Circle */}
              <circle
                cx={layout.level1Zone.x}
                cy={layout.level1Zone.y}
                r={layout.level1Zone.r}
                fill="url(#l1-zone-grad)"
                stroke={zone.id === 'level1' ? '#f6c344' : '#4a6887'}
                strokeWidth={zone.id === 'level1' ? 1.7 : 1.1}
              />
              <text
                x={layout.level1Zone.x}
                y={layout.level1Zone.y + layout.level1Zone.r + 10.5}
                textAnchor="middle"
                fill={zone.id === 'level1' ? '#fde68a' : '#85a6c4'}
                fontSize="6.8"
                fontWeight="700"
                letterSpacing="0.5"
              >
                L1 VALLEY
              </text>

              {/* Frostcave City: Eastern Subterranean Cavern Circle */}
              <circle
                cx={layout.cityZone.x}
                cy={layout.cityZone.y}
                r={layout.cityZone.r}
                fill="url(#city-zone-grad)"
                stroke={inCity ? '#f6c344' : '#9c7b38'}
                strokeWidth={inCity ? 1.8 : 1.2}
              />
              <text
                x={layout.cityZone.x}
                y={layout.cityZone.y - layout.cityZone.r - 4.5}
                textAnchor="middle"
                fill={inCity ? '#fde047' : '#d6b672'}
                fontSize="6.5"
                fontWeight="700"
                letterSpacing="0.4"
              >
                FROSTCAVE CITY
              </text>

              {/* Arcane Portal Rift Link between Level 1 & Level 2 */}
              <line
                x1={layout.portal1.x}
                y1={layout.portal1.y}
                x2={layout.portal2.x}
                y2={layout.portal2.y}
                stroke="#5be7ff"
                strokeWidth="1.5"
                strokeDasharray="3 2.5"
                opacity="0.82"
              />

              {/* Golden Portal Rift Link between Level 1 East Gate & Frostcave City */}
              <line
                x1={layout.cityPortal1.x}
                y1={layout.cityPortal1.y}
                x2={layout.cityPortal2.x}
                y2={layout.cityPortal2.y}
                stroke="#f6c344"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.88"
              />

              {/* Northern Expedition Trail (Camp -> Northgate Portal) */}
              <line
                x1={layout.camp.x}
                y1={layout.camp.y}
                x2={layout.portal1.x}
                y2={layout.portal1.y}
                stroke="#d6c5a7"
                strokeWidth="2.1"
                strokeLinecap="round"
                opacity="0.72"
              />

              {/* Eastern Trade Road (Camp -> East City Gate Portal) */}
              <line
                x1={layout.camp.x}
                y1={layout.camp.y}
                x2={layout.cityPortal1.x}
                y2={layout.cityPortal1.y}
                stroke="#eab308"
                strokeWidth="1.9"
                strokeLinecap="round"
                opacity="0.72"
              />

              {/* City West Gate -> Central Clocktower Fountain Avenue */}
              <line
                x1={layout.cityPortal2.x}
                y1={layout.cityPortal2.y}
                x2={layout.cityFountain.x}
                y2={layout.cityFountain.y}
                stroke="#fcd34d"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.68"
              />

              {/* Level 2 Brazier Plaza Path (Return Portal -> Waystation Brazier) */}
              <line
                x1={layout.portal2.x}
                y1={layout.portal2.y}
                x2={layout.brazier.x}
                y2={layout.brazier.y}
                stroke="#b8cbe0"
                strokeWidth="1.9"
                strokeLinecap="round"
                opacity="0.65"
              />

              {/* Campfire Hearth Landmark (Level 1 Center) */}
              <circle
                cx={layout.camp.x}
                cy={layout.camp.y}
                r={4.2}
                fill="#f59e3d"
                fillOpacity="0.24"
              />
              <polygon
                points={`${layout.camp.x},${layout.camp.y - 3.6} ${layout.camp.x + 3.2},${layout.camp.y} ${layout.camp.x},${layout.camp.y + 3.6} ${layout.camp.x - 3.2},${layout.camp.y}`}
                fill="#f59e3d"
                stroke="#fff2cc"
                strokeWidth="0.7"
              />

              {/* Waystation Brazier Landmark (Level 2 South Plaza) */}
              <circle
                cx={layout.brazier.x}
                cy={layout.brazier.y}
                r={3.2}
                fill="#fb923c"
                stroke="#ffedd5"
                strokeWidth="0.7"
              />

              {/* Frostcave City Central Clocktower Hearth Fountain */}
              <circle
                cx={layout.cityFountain.x}
                cy={layout.cityFountain.y}
                r={3.4}
                fill="#f6c344"
                stroke="#fffbeb"
                strokeWidth="0.8"
              />

              {/* Level 1 Northgate Portal */}
              <circle
                cx={layout.portal1.x}
                cy={layout.portal1.y}
                r={3.8}
                fill="#0e2a3f"
                stroke="#5be7ff"
                strokeWidth="1.6"
              />

              {/* Level 2 Return Portal */}
              <circle
                cx={layout.portal2.x}
                cy={layout.portal2.y}
                r={3.8}
                fill="#292211"
                stroke="#f6c344"
                strokeWidth="1.6"
              />

              {/* Level 1 East City Gate Portal */}
              <circle
                cx={layout.cityPortal1.x}
                cy={layout.cityPortal1.y}
                r={3.4}
                fill="#292211"
                stroke="#f6c344"
                strokeWidth="1.5"
              />

              {/* Frostcave City Return Gate Portal */}
              <circle
                cx={layout.cityPortal2.x}
                cy={layout.cityPortal2.y}
                r={3.4}
                fill="#292211"
                stroke="#fde047"
                strokeWidth="1.5"
              />

              {/* Hunter's Sight Scan Aura & Revealed Wildlife Blips */}
              {sightActive && (
                <circle
                  cx={layout.player.x}
                  cy={layout.player.y}
                  r={22}
                  fill="none"
                  stroke="#5be7ff"
                  strokeWidth="0.9"
                  strokeDasharray="3 2"
                  opacity="0.75"
                />
              )}

              {wildlifeBlips.map((blip) => {
                const pt = worldToMinimap(blip.x, blip.z);
                const color = blipColorHex(blip);
                return (
                  <g
                    key={blip.id}
                    data-testid="minimap-wildlife-blip"
                    data-kind={blip.kind}
                    data-locked={blip.locked ? 'true' : 'false'}
                    transform={`translate(${pt.x}, ${pt.y})`}
                  >
                    {blip.locked && (
                      <circle
                        r={4.2}
                        fill="none"
                        stroke="#fde047"
                        strokeWidth="1.0"
                      />
                    )}
                    <circle
                      r={blip.rarity === 'rare' || blip.rarity === 'epic' || blip.rarity === 'mythic' ? 2.5 : 2.0}
                      fill={color}
                      stroke="#0d1726"
                      strokeWidth="0.6"
                    />
                  </g>
                );
              })}

              {/* Secret Loot Chest Blips */}
              {chestBlips.map((cb) => {
                const pt = worldToMinimap(cb.x, cb.z);
                const chestColor =
                  cb.rarity === 'aurora'
                    ? '#f0abfc'
                    : cb.rarity === 'relic'
                      ? '#5be7ff'
                      : '#f6c344';
                return (
                  <g
                    key={`chest-${cb.id}`}
                    data-testid="minimap-chest-blip"
                    data-rarity={cb.rarity}
                    transform={`translate(${pt.x}, ${pt.y})`}
                  >
                    <polygon
                      points="0,-3.4 3.4,0 0,3.4 -3.4,0"
                      fill={chestColor}
                      stroke="#0d1726"
                      strokeWidth="0.7"
                    />
                  </g>
                );
              })}

              {/* Hostile Rival Hunter & Rare Enemy Blips */}
              {hunterBlips.map((hb) => {
                const pt = worldToMinimap(hb.x, hb.z);
                const ringColor =
                  hb.rarity === 'mythic'
                    ? '#38bdf8'
                    : hb.rarity === 'rare'
                      ? '#c084fc'
                      : hb.weapon === 'bow'
                        ? '#fde047'
                        : '#ef4444';
                const fillColor =
                  hb.rarity === 'mythic'
                    ? '#38bdf8'
                    : hb.rarity === 'rare'
                      ? '#a855f7'
                      : '#ef4444';
                return (
                  <g
                    key={hb.id}
                    data-testid="minimap-hunter-blip"
                    data-rarity={hb.rarity ?? 'common'}
                    transform={`translate(${pt.x}, ${pt.y})`}
                  >
                    <circle
                      r={hb.rarity === 'rare' || hb.rarity === 'mythic' ? 5.2 : 4.6}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={hb.rarity === 'rare' || hb.rarity === 'mythic' ? '1.3' : '1.0'}
                    />
                    <polygon
                      points="0,-3.2 3.0,0 0,3.2 -3.0,0"
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth="0.65"
                    />
                  </g>
                );
              })}

              {/* Zone Boss Arena Marker */}
              {bossBlip && (() => {
                const pt = worldToMinimap(bossBlip.x, bossBlip.z);
                const bossRingColor = !bossBlip.alive
                  ? '#64748b'
                  : bossBlip.enraged
                    ? '#ef4444'
                    : '#f97316';
                const bossFillColor = !bossBlip.alive
                  ? '#475569'
                  : bossBlip.enraged
                    ? '#dc2626'
                    : '#fbbf24';
                return (
                  <g
                    data-testid="minimap-boss-blip"
                    data-boss-id={bossBlip.id}
                    data-alive={bossBlip.alive ? 'true' : 'false'}
                    transform={`translate(${pt.x}, ${pt.y})`}
                  >
                    <circle
                      r={6.6}
                      fill="none"
                      stroke={bossRingColor}
                      strokeWidth={bossBlip.alive ? '1.4' : '0.9'}
                      strokeDasharray={bossBlip.alive ? undefined : '2 2'}
                    />
                    <polygon
                      points="0,-4.6 1.5,-1.5 4.6,0 1.5,1.5 0,4.6 -1.5,1.5 -4.6,0 -1.5,-1.5"
                      fill={bossFillColor}
                      stroke="#0d1726"
                      strokeWidth="0.7"
                    />
                  </g>
                );
              })()}

              {/* Player Directional Chevron & Pulse Halo */}
              <g
                data-testid="minimap-player"
                transform={`translate(${layout.player.x}, ${layout.player.y}) rotate(${layout.player.headingDeg})`}
              >
                <circle r={6.2} fill="#ffffff" fillOpacity="0.18" />
                <polygon
                  points="0,-5.4 4.1,4.2 0,2.1 -4.1,4.2"
                  fill="#ffffff"
                  stroke="#0d1726"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>

          {/* Compact Navigation Readout & Legend */}
          <div className="flex flex-col gap-0.5 text-[10px] leading-tight tabular-nums text-[#c7d6e6]">
            <div className="flex items-center justify-between">
              <span className="text-[#9db4cb]">
                {inCity ? 'Plaza' : inLevel2 ? 'Brazier' : 'Camp'}
              </span>
              <span className="font-bold text-[#f4efe6]">
                {layout.hearthDistance}m {layout.hearthDirection}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9db4cb]">
                {inCity || inLevel2 ? 'Return' : 'L2 Gate'}
              </span>
              <span className="font-bold text-[#7be0ff]">
                {zone.portalDistance}m {zone.portalDirection}
              </span>
            </div>
            {zone.id === 'level1' && zone.cityPortalDistance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[#9db4cb]">City Gate</span>
                <span className="font-bold text-[#f6c344]">
                  {zone.cityPortalDistance}m {zone.cityPortalDirection}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-0.5 mt-0.5 border-t border-[#6e8eb0]/20 text-[9px] text-[#9db4cb]">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e3d] inline-block" />
                Hearth
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] inline-block" />
                Boss
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] inline-block" />
                Hunters{hunterBlips.length > 0 ? ` (${hunterBlips.length})` : ''}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8ed49a] inline-block" />
                Fauna{wildlifeBlips.length > 0 ? ` (${wildlifeBlips.length})` : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
