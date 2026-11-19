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
  const inLevel3 = zone.id === 'level3';
  const inLevel4 = zone.id === 'level4';
  const inLevel5 = zone.id === 'level5';
  const inCity = zone.id === 'city';

  return (
    <aside
      aria-label="World Navigation Minimap"
      data-testid="minimap-overlay"
      data-zone={zone.id}
      data-player-x={zone.playerX}
      data-player-z={zone.playerZ}
      className={`pointer-events-auto rounded-xl transition-colors ${
        inCity
          ? 'hud-plaque-gold'
          : inLevel5
            ? 'hud-plaque border-[#f0abfc]/65'
            : inLevel4
              ? 'hud-plaque-crimson'
              : inLevel3
                ? 'hud-plaque border-[#818cf8]/60'
                : inLevel2
                  ? 'hud-plaque-frost'
                  : 'hud-plaque'
      } ${collapsed ? 'w-auto' : 'w-[156px] sm:w-[196px]'}`}
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
              inCity ? 'text-[#f6c344]' : inLevel2 || inLevel3 || inLevel4 || inLevel5 ? 'text-[#7be0ff]' : 'text-[#f6c344]'
            }`}
          />
          <span>Map</span>
          <span className="text-[#9db4cb] font-semibold">
            {inCity ? 'CITY' : `L${zone.levelNumber} · ${zone.difficultyMult}x`}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#9db4cb]" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-[#9db4cb]" />
        )}
      </button>

      {!collapsed && (
        <div className="px-2 pb-2 pt-0.5 flex flex-col gap-1.5 border-t border-[#78a0c8]/25">
          {/* 6-Zone North-Up SVG Map */}
          <div className="relative rounded-lg bg-[#09121e] border border-[#567494]/70 shadow-[inset_0_0_14px_rgba(4,9,18,0.85)] overflow-hidden">
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="w-full h-auto block"
              role="img"
              aria-label={`Minimap showing all 6 Frostwood zones. Player in ${zone.name}.`}
            >
              <defs>
                <radialGradient id="l5-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={inLevel5 ? '#4c1d95' : '#1e1338'} />
                  <stop offset="100%" stopColor={inLevel5 ? '#2e1065' : '#120b24'} />
                </radialGradient>
                <radialGradient id="l4-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={inLevel4 ? '#4c1128' : '#26111c'} />
                  <stop offset="100%" stopColor={inLevel4 ? '#310b19' : '#180a12'} />
                </radialGradient>
                <radialGradient id="l3-zone-grad" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor={inLevel3 ? '#1e3a8a' : '#132042'} />
                  <stop offset="100%" stopColor={inLevel3 ? '#172554' : '#0d152e'} />
                </radialGradient>
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

              {/* Level 3: Rimefang Abyss Circle (NW) */}
              <circle
                cx={layout.level3Zone.x}
                cy={layout.level3Zone.y}
                r={layout.level3Zone.r}
                fill="url(#l3-zone-grad)"
                stroke={inLevel3 ? '#a5b4fc' : '#435585'}
                strokeWidth={inLevel3 ? 1.8 : 1.0}
              />
              <text
                x={layout.level3Zone.x}
                y={layout.level3Zone.y - layout.level3Zone.r - 3.5}
                textAnchor="middle"
                fill={inLevel3 ? '#c7d2fe' : '#859bc4'}
                fontSize="6.2"
                fontWeight="700"
              >
                L3 ABYSS (9x)
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
                y={layout.level2Zone.y - layout.level2Zone.r - 3.5}
                textAnchor="middle"
                fill={inLevel2 ? '#a5f3fc' : '#85a6c4'}
                fontSize="6.2"
                fontWeight="700"
              >
                L2 HIGHLANDS (3x)
              </text>

              {/* Level 5: Starfall Eternal Zero Circle (NE) */}
              <circle
                cx={layout.level5Zone.x}
                cy={layout.level5Zone.y}
                r={layout.level5Zone.r}
                fill="url(#l5-zone-grad)"
                stroke={inLevel5 ? '#f0abfc' : '#704a91'}
                strokeWidth={inLevel5 ? 1.8 : 1.0}
              />
              <text
                x={layout.level5Zone.x}
                y={layout.level5Zone.y - layout.level5Zone.r - 3.5}
                textAnchor="middle"
                fill={inLevel5 ? '#f5d0fe' : '#b794d6'}
                fontSize="6.2"
                fontWeight="700"
              >
                L5 STARFALL (81x)
              </text>

              {/* Level 4: Obsidian Permafrost Circle (SW) */}
              <circle
                cx={layout.level4Zone.x}
                cy={layout.level4Zone.y}
                r={layout.level4Zone.r}
                fill="url(#l4-zone-grad)"
                stroke={inLevel4 ? '#fda4af' : '#874a62'}
                strokeWidth={inLevel4 ? 1.8 : 1.0}
              />
              <text
                x={layout.level4Zone.x}
                y={layout.level4Zone.y + layout.level4Zone.r + 9.5}
                textAnchor="middle"
                fill={inLevel4 ? '#fecdd3' : '#c4859b'}
                fontSize="6.2"
                fontWeight="700"
              >
                L4 PERMAFROST (27x)
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
                y={layout.level1Zone.y + layout.level1Zone.r + 9.5}
                textAnchor="middle"
                fill={zone.id === 'level1' ? '#fde68a' : '#85a6c4'}
                fontSize="6.2"
                fontWeight="700"
              >
                L1 VALLEY (1x)
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
                y={layout.cityZone.y + layout.cityZone.r + 9.5}
                textAnchor="middle"
                fill={inCity ? '#fde047' : '#d6b672'}
                fontSize="6.0"
                fontWeight="700"
              >
                FROSTCAVE CITY
              </text>

              {/* Arcane Portal Rift Links across L1 -> L2 -> L3 -> L4 -> L5 */}
              <line
                x1={layout.portal1.x}
                y1={layout.portal1.y}
                x2={layout.portal2.x}
                y2={layout.portal2.y}
                stroke="#5be7ff"
                strokeWidth="1.4"
                strokeDasharray="3 2.5"
                opacity="0.82"
              />
              <line
                x1={layout.portal2Forward.x}
                y1={layout.portal2Forward.y}
                x2={layout.portal3Return.x}
                y2={layout.portal3Return.y}
                stroke="#818cf8"
                strokeWidth="1.3"
                strokeDasharray="3 2.5"
                opacity="0.78"
              />
              <line
                x1={layout.portal3Forward.x}
                y1={layout.portal3Forward.y}
                x2={layout.portal4Return.x}
                y2={layout.portal4Return.y}
                stroke="#fb7185"
                strokeWidth="1.3"
                strokeDasharray="3 2.5"
                opacity="0.78"
              />
              <line
                x1={layout.portal4Forward.x}
                y1={layout.portal4Forward.y}
                x2={layout.portal5Return.x}
                y2={layout.portal5Return.y}
                stroke="#f0abfc"
                strokeWidth="1.2"
                strokeDasharray="2.5 2.5"
                opacity="0.68"
              />

              {/* Golden Portal Rift Link between Level 1 East Gate & Frostcave City */}
              <line
                x1={layout.cityPortal1.x}
                y1={layout.cityPortal1.y}
                x2={layout.cityPortal2.x}
                y2={layout.cityPortal2.y}
                stroke="#f6c344"
                strokeWidth="1.4"
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
                strokeWidth="1.9"
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
                strokeWidth="1.8"
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
                strokeWidth="1.7"
                strokeLinecap="round"
                opacity="0.68"
              />

              {/* Campfire Hearth Landmark (Level 1 Center) */}
              <circle
                cx={layout.camp.x}
                cy={layout.camp.y}
                r={3.8}
                fill="#f59e3d"
                fillOpacity="0.24"
              />
              <polygon
                points={`${layout.camp.x},${layout.camp.y - 3.2} ${layout.camp.x + 2.8},${layout.camp.y} ${layout.camp.x},${layout.camp.y + 3.2} ${layout.camp.x - 2.8},${layout.camp.y}`}
                fill="#f59e3d"
                stroke="#fff2cc"
                strokeWidth="0.65"
              />

              {/* Waystation Braziers (Levels 2, 3, 4, 5) */}
              <circle cx={layout.brazier.x} cy={layout.brazier.y} r={2.8} fill="#fb923c" stroke="#ffedd5" strokeWidth="0.6" />
              <circle cx={layout.brazier3.x} cy={layout.brazier3.y} r={2.8} fill="#818cf8" stroke="#e0e7ff" strokeWidth="0.6" />
              <circle cx={layout.brazier4.x} cy={layout.brazier4.y} r={2.8} fill="#fb7185" stroke="#ffe4e6" strokeWidth="0.6" />
              <circle cx={layout.brazier5.x} cy={layout.brazier5.y} r={2.8} fill="#e879f9" stroke="#fae8ff" strokeWidth="0.6" />

              {/* Frostcave City Central Clocktower Hearth Fountain */}
              <circle
                cx={layout.cityFountain.x}
                cy={layout.cityFountain.y}
                r={3.0}
                fill="#f6c344"
                stroke="#fffbeb"
                strokeWidth="0.7"
              />

              {/* Portal Nodes */}
              <circle cx={layout.portal1.x} cy={layout.portal1.y} r={3.2} fill="#0e2a3f" stroke="#5be7ff" strokeWidth="1.4" />
              <circle cx={layout.portal2.x} cy={layout.portal2.y} r={3.2} fill="#292211" stroke="#f6c344" strokeWidth="1.4" />
              <circle cx={layout.portal2Forward.x} cy={layout.portal2Forward.y} r={3.0} fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.3" />
              <circle cx={layout.portal3Return.x} cy={layout.portal3Return.y} r={3.0} fill="#0e2a3f" stroke="#5be7ff" strokeWidth="1.3" />
              <circle cx={layout.portal3Forward.x} cy={layout.portal3Forward.y} r={3.0} fill="#4c0519" stroke="#fb7185" strokeWidth="1.3" />
              <circle cx={layout.portal4Return.x} cy={layout.portal4Return.y} r={3.0} fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.3" />
              <circle cx={layout.portal4Forward.x} cy={layout.portal4Forward.y} r={3.0} fill="#3b0764" stroke="#f0abfc" strokeWidth="1.3" />
              <circle cx={layout.portal5Return.x} cy={layout.portal5Return.y} r={3.0} fill="#4c0519" stroke="#fb7185" strokeWidth="1.3" />
              <circle cx={layout.cityPortal1.x} cy={layout.cityPortal1.y} r={3.0} fill="#292211" stroke="#f6c344" strokeWidth="1.3" />
              <circle cx={layout.cityPortal2.x} cy={layout.cityPortal2.y} r={3.0} fill="#292211" stroke="#fde047" strokeWidth="1.3" />

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
                {inCity ? 'Plaza' : zone.id === 'level1' ? 'Camp' : 'Brazier'}
              </span>
              <span className="font-bold text-[#f4efe6]">
                {layout.hearthDistance}m {layout.hearthDirection}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9db4cb]">
                {zone.id === 'level1' ? 'L2 Gate' : 'Return'}
              </span>
              <span className="font-bold text-[#7be0ff]">
                {zone.portalDistance}m {zone.portalDirection}
              </span>
            </div>
            {zone.forwardPortalDistance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[#9db4cb]">
                  L{zone.levelNumber + 1} Gate
                </span>
                <span className="font-bold text-[#c084fc]">
                  {zone.forwardPortalDistance}m {zone.forwardPortalDirection}
                </span>
              </div>
            )}
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
