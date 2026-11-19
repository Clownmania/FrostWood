import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Backpack,
  BedDouble,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Cog,
  Compass,
  Crosshair,
  DoorOpen,
  Eye,
  Fish,
  Flame,
  FolderOpen,
  Gift,
  Hammer,
  Heart,
  Home,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Moon,
  Pause,
  PawPrint,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Skull,
  Sparkles,
  Store,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  BESTIARY_LORE,
  computeHuntingEfficiency,
  countDiscoveredSpecies,
  getRarityLabel,
} from '../game/bestiary';
import {
  CITY_OFFERS,
  CITY_QUEST_NPC,
  CITY_TRADERS,
  CITY_TRADER_ORDER,
  calculateMeatSellValue,
  canBuyCityOffer,
  canCompleteCityDailyQuest,
} from '../game/city';
import {
  ALL_CRAFT_RECIPES,
  canCraftRecipe,
  getCraftRecipe,
  getLinkedBuffSeconds,
} from '../game/crafting';
import {
  AXE_TIERS,
  BOW_TIERS,
  calculateSellRates,
  canAfford,
  formatWeatherCountdown,
  getAxeSpec,
  getBowSpec,
  getBuildingSpec,
  getNextBuildingUpgrade,
  getNextToolUpgrade,
  getWeatherProfile,
} from '../game/economy';
import {
  GEAR_SLOT_META,
  GEAR_SLOT_ORDER,
  MAX_GEAR_TIER,
  WINGS_OF_FIRE_TIERS,
  getGearSlotSpec,
  getNextGearSetBonus,
  getNextGearUpgrade,
  getWingsOfFireSpec,
} from '../game/gear';
import {
  FESTIVAL_BUILDING_IDS,
  canPurchaseFestivalBuilding,
  getFestivalBuildingSpec,
  getNextFestivalBuildingUpgrade,
} from '../game/events';
import {
  PET_SPECIES_ORDER,
  PET_SPECIES_SPECS,
  getTamingPenSpec,
} from '../game/pets';
import { SAVE_SLOT_IDS } from '../game/persistence';
import {
  SKILL_PERKS,
  SKILL_PERK_ORDER,
  canUnlockSkillPerk,
  countSpentSkillPoints,
  getSkillPerkRequiredLevel,
  getSkillPerkUpgradeCost,
  xpRequiredForSkillLevel,
} from '../game/skills';
import { computeTouchpadVector } from '../game/kinematics';
import {
  MYSTERY_SHOP_ITEMS,
  MYSTERY_SHOP_ITEM_ORDER,
  MYTHIC_ASCENSION_ORDER,
  MYTHIC_ASCENSION_SPECS,
  RARE_MATERIAL_ORDER,
  RARE_MATERIAL_SPECS,
  canBuyMysteryShopItem,
  canUnlockMythicAscension,
} from '../game/mystery';
import { SPECIES_SPECS, WILDLIFE_SPECIES_ORDER } from '../game/wildlife';
import type { GameSettings } from '../game/settings';
import type {
  AchievementCategory,
  ActiveTool,
  AnimalKind,
  AnimalRarity,
  BuildingId,
  CityTraderId,
  CraftCategory,
  CraftItemId,
  DrawerTab,
  FestivalBuildingId,
  GearSlotId,
  HudSnapshot,
  ItemRarity,
  MysteryShopItemId,
  MythicAscensionId,
  ResourceCounts,
  ResourceTrendDirection,
  SaveSlotId,
  SkillPerkId,
  ToolUpgradeId,
  TrendResourceKey,
  ZoneId,
} from '../game/types';
import {
  AxeIcon,
  BowIcon,
  GearIcon,
  GoldIcon,
  HeartIcon,
  IceIcon,
  MeatIcon,
  PeltIcon,
  StoneIcon,
  WarmthIcon,
  WeatherIcon,
  WoodIcon,
} from './SvgAssets';
import { InventoryGui } from './InventoryGui';
import { MinimapOverlay } from './MinimapOverlay';
import { SettingsPanel } from './SettingsPanel';

interface GameHudProps {
  hud: HudSnapshot;
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  onChangeDrawerTab: (tab: DrawerTab) => void;
  onToggleDrawer: () => void;
  onOpenTab: (tab: DrawerTab) => void;
  onSelectTool: (tool: ActiveTool) => void;
  onSellAll: () => void;
  onBuyCityOffer: (offerId: string) => void;
  onSellMeat: (count?: number) => void;
  onClaimCityDailyQuest: () => void;
  onStartNextCityDailyQuest: () => void;
  onTouchMove: (dx: number, dz: number) => void;
  onTouchAttack: () => void;
  onTouchInteract: () => void;
  onBuyTool: (id: ToolUpgradeId) => void;
  onBuyGear: (slot: GearSlotId) => void;
  onEquipGear: (slot: GearSlotId, tier?: number) => void;
  onUnequipGear: (slot: GearSlotId) => void;
  onToggleWingsEquipped: () => void;
  onBuyBuilding: (id: BuildingId) => void;
  onBuyFestivalBuilding: (id: FestivalBuildingId) => void;
  onExchangeFestivalIce: () => void;
  onCraftItem: (id: CraftItemId) => void;
  onUseBackpackItem: (id: CraftItemId) => void;
  onCraftAndUseItem: (id: CraftItemId) => void;
  onSalvageBackpackItem: (id: CraftItemId, qty?: number) => void;
  onUnlockSkillPerk: (id: SkillPerkId) => void;
  onRespecSkills: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onTitle: () => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  onUsePortal: () => void;
  onSelectZone: (zone: ZoneId) => void;
  onOpenSecretChest: () => void;
  onActivateHuntersSight: () => void;
  onInspectTrack: () => void;
  onFeedWildPet: () => void;
  onSetActivePet: (uid: string | null) => void;
  onPetCompanion: (uid: string) => void;
  onAttractWildStray: () => void;
  onClaimDailyLoginReward: () => void;
  onSaveGame: (slotId: SaveSlotId) => void;
  onLoadGame: (slotId: SaveSlotId) => void;
  onDeleteSave: (slotId: SaveSlotId) => void;
  onUnlockAscension: (id: MythicAscensionId) => void;
  onEquipAscension: (id: MythicAscensionId | null) => void;
  onBuyMysteryItem: (id: MysteryShopItemId) => void;
  onToggleBowAutoAttack: () => void;
  onToggleBowAutoAim: () => void;
  onToggleAutoHarvest: () => void;
  onEnterCabin: () => void;
  onExitCabin: () => void;
  onSleepInCabin: () => void;
  onTravelToFishingLake: () => void;
  onCastOrHookFish: () => void;
  onSetFishingReel: (held: boolean) => void;
}

function CostTags({
  cost,
  resources,
  gearsHave = 0,
}: {
  cost: ResourceCounts & { gears?: number };
  resources: ResourceCounts;
  gearsHave?: number;
}) {
  const stoneCost = cost.stone ?? 0;
  const stoneHave = resources.stone ?? 0;
  const iceCost = cost.ice ?? 0;
  const iceHave = resources.ice ?? 0;
  const meatCost = cost.meat ?? 0;
  const meatHave = resources.meat ?? 0;
  const gearsCost = cost.gears ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums font-semibold">
      {cost.wood > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            resources.wood >= cost.wood ? 'text-[#e8d5b8]' : 'text-[#ef7b73]'
          }`}
        >
          <WoodIcon className="w-3.5 h-3.5" />
          {cost.wood}
        </span>
      )}
      {stoneCost > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            stoneHave >= stoneCost ? 'text-[#cbd5e1]' : 'text-[#ef7b73]'
          }`}
        >
          <StoneIcon className="w-3.5 h-3.5" />
          {stoneCost}
        </span>
      )}
      {iceCost > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            iceHave >= iceCost ? 'text-[#7be0ff]' : 'text-[#ef7b73]'
          }`}
        >
          <IceIcon className="w-3.5 h-3.5" />
          {iceCost}
        </span>
      )}
      {cost.pelts > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            resources.pelts >= cost.pelts ? 'text-[#e8d5b8]' : 'text-[#ef7b73]'
          }`}
        >
          <PeltIcon className="w-3.5 h-3.5" />
          {cost.pelts}
        </span>
      )}
      {meatCost > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            meatHave >= meatCost ? 'text-[#fda4af]' : 'text-[#ef7b73]'
          }`}
        >
          <MeatIcon className="w-3.5 h-3.5" />
          {meatCost}
        </span>
      )}
      {gearsCost > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            gearsHave >= gearsCost ? 'text-[#f6d37a]' : 'text-[#ef7b73]'
          }`}
          title="Clockwork Gears (crafted in Pack)"
        >
          <GearIcon className="w-3.5 h-3.5" />
          {gearsCost}
        </span>
      )}
      {cost.gold > 0 && (
        <span
          className={`inline-flex items-center gap-1 ${
            resources.gold >= cost.gold ? 'text-[#f6c344]' : 'text-[#ef7b73]'
          }`}
        >
          <GoldIcon className="w-3.5 h-3.5" />
          {cost.gold}
        </span>
      )}
    </div>
  );
}

function ResourceTrendArrow({
  resource,
  trend,
  delta,
}: {
  resource: TrendResourceKey;
  trend: ResourceTrendDirection;
  delta: number;
}) {
  if (trend === 'flat') return null;
  const labelMap: Record<TrendResourceKey, string> = {
    wood: 'Wood',
    stone: 'Stone',
    ice: 'Ice Shards',
    pelts: 'Pelts',
    meat: 'Wild Meat',
    gold: 'Gold',
  };
  const label = labelMap[resource];
  if (trend === 'up') {
    const title =
      delta > 0
        ? `Gaining ${label} (+${delta} recently)`
        : `Gaining ${label} over time`;
    return (
      <span
        data-testid={`resource-trend-${resource}`}
        data-trend="up"
        title={title}
        aria-label={`Gaining ${label}`}
        className="inline-flex items-center text-[#8ed49a]"
      >
        <ArrowUp className="w-3.5 h-3.5 stroke-[2.75]" />
      </span>
    );
  }
  return (
    <span
      data-testid={`resource-trend-${resource}`}
      data-trend="down"
      title={`Losing ${label} (${delta} recently)`}
      aria-label={`Losing ${label}`}
      className="inline-flex items-center text-[#ef7b73]"
    >
      <ArrowDown className="w-3.5 h-3.5 stroke-[2.75]" />
    </span>
  );
}

interface TouchMovementPadProps {
  onTouchMove: (dx: number, dz: number) => void;
}

function TouchMovementPad({ onTouchMove }: TouchMovementPadProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    pointerId: number | null;
    originX: number;
    originY: number;
  }>({
    pointerId: null,
    originX: 0,
    originY: 0,
  });

  const [padVisual, setPadVisual] = useState<{
    active: boolean;
    knobX: number;
    knobY: number;
    dx: number;
    dz: number;
    magnitude: number;
    isStalking: boolean;
  }>({
    active: false,
    knobX: 0,
    knobY: 0,
    dx: 0,
    dz: 0,
    magnitude: 0,
    isStalking: false,
  });

  const maxRadius = 38;

  const updateFromClientXY = (clientX: number, clientY: number) => {
    const offsetX = clientX - pointerStateRef.current.originX;
    const offsetY = clientY - pointerStateRef.current.originY;
    const vec = computeTouchpadVector(offsetX, offsetY, maxRadius, 0.1);
    setPadVisual({
      active: true,
      knobX: vec.knobX,
      knobY: vec.knobY,
      dx: vec.dx,
      dz: vec.dz,
      magnitude: vec.magnitude,
      isStalking: vec.isStalking,
    });
    onTouchMove(vec.dx, vec.dz);
  };

  const resetTouchpad = () => {
    pointerStateRef.current.pointerId = null;
    setPadVisual({
      active: false,
      knobX: 0,
      knobY: 0,
      dx: 0,
      dz: 0,
      magnitude: 0,
      isStalking: false,
    });
    onTouchMove(0, 0);
  };

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 select-none">
      <div
        ref={padRef}
        role="slider"
        aria-label="Movement Touchpad"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(padVisual.magnitude * 100)}
        aria-valuetext={
          !padVisual.active || padVisual.magnitude === 0
            ? 'Idle'
            : padVisual.isStalking
              ? 'Stalking'
              : 'Running'
        }
        data-testid="touch-movement-pad"
        data-active={padVisual.active ? 'true' : 'false'}
        data-dx={padVisual.dx.toFixed(2)}
        data-dz={padVisual.dz.toFixed(2)}
        data-stalking={padVisual.isStalking ? 'true' : 'false'}
        onPointerDown={(e) => {
          const el = padRef.current;
          if (!el) return;
          e.preventDefault();
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            // Ignore synthetic events without active pointer id
          }
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width * 0.5;
          const centerY = rect.top + rect.height * 0.5;
          const distFromCenter = Math.hypot(e.clientX - centerX, e.clientY - centerY);
          // If thumb lands near center, anchor origin to thumb for zero-jump glide;
          // if pressing outer rim, anchor to pad center for immediate directional travel
          const originX = distFromCenter <= 12 ? e.clientX : centerX;
          const originY = distFromCenter <= 12 ? e.clientY : centerY;
          pointerStateRef.current = {
            pointerId: e.pointerId,
            originX,
            originY,
          };
          updateFromClientXY(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointerStateRef.current.pointerId !== e.pointerId) return;
          e.preventDefault();
          updateFromClientXY(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (pointerStateRef.current.pointerId !== e.pointerId) return;
          e.preventDefault();
          resetTouchpad();
        }}
        onPointerCancel={() => {
          resetTouchpad();
        }}
        onLostPointerCapture={() => {
          if (pointerStateRef.current.pointerId !== null) {
            resetTouchpad();
          }
        }}
        className={`relative w-28 h-28 rounded-full touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors shadow-[0_8px_22px_rgba(8,14,24,0.68)] ${
          padVisual.active
            ? padVisual.isStalking
              ? 'bg-[#102638]/95 border-2 border-[#7be0ff]/85'
              : 'bg-[#16273d]/95 border-2 border-[#f6c344]/85'
            : 'bg-[#121f31]/92 border-2 border-[#6e8eb0]/55'
        }`}
      >
        {/* Subtle Cardinal Bearings */}
        <span className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-widest text-[#8fb0cf]/80">
          N
        </span>
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-widest text-[#8fb0cf]/65">
          S
        </span>
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold tracking-widest text-[#8fb0cf]/65">
          W
        </span>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold tracking-widest text-[#8fb0cf]/65">
          E
        </span>

        {/* Inner Stealth / Stalk Zone Ring */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute w-14 h-14 rounded-full border border-dashed transition-colors ${
            padVisual.isStalking
              ? 'border-[#7be0ff]/75 bg-[#7be0ff]/10'
              : 'border-[#6e8eb0]/35 bg-[#0c1624]/45'
          }`}
        />

        {/* Directional Vector Line */}
        <svg
          aria-hidden="true"
          viewBox="-56 -56 112 112"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <circle cx="0" cy="0" r="3" fill="#6e8eb0" fillOpacity="0.55" />
          {padVisual.active && padVisual.magnitude > 0.02 && (
            <line
              x1="0"
              y1="0"
              x2={padVisual.knobX}
              y2={padVisual.knobY}
              stroke={padVisual.isStalking ? '#7be0ff' : '#f6c344'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          )}
        </svg>

        {/* Tactile Floating Thumb Puck */}
        <div
          data-testid="touchpad-thumb-puck"
          style={{
            transform: `translate3d(${padVisual.knobX.toFixed(1)}px, ${padVisual.knobY.toFixed(1)}px, 0)`,
          }}
          className={`pointer-events-none absolute w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-[0_4px_12px_rgba(6,10,18,0.75)] ${
            padVisual.active
              ? padVisual.isStalking
                ? 'bg-[#194766] border-[#9ef0ff] text-[#e0faff]'
                : 'bg-[#d98a2b] border-[#ffe394] text-[#131d2b]'
              : 'bg-[#213550]/95 border-[#8fb5d9]/75 text-[#dce6f2] transition-transform duration-150 ease-out'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              padVisual.active
                ? padVisual.isStalking
                  ? 'bg-[#9ef0ff]'
                  : 'bg-[#131d2b]'
                : 'bg-[#f6c344]/85'
            }`}
          />
        </div>
      </div>

      {/* Live Gait / Comfort Indicator Pill */}
      <div className="px-2 py-0.5 rounded-md bg-[#121f31]/90 border border-[#6e8eb0]/35 text-[9px] font-bold uppercase tracking-wider text-[#b8cbe0] tabular-nums">
        {!padVisual.active || padVisual.magnitude === 0
          ? 'Touchpad · 360°'
          : padVisual.isStalking
            ? 'Stalking · Quiet'
            : `Running · ${Math.round(padVisual.magnitude * 100)}%`}
      </div>
    </div>
  );
}

export function GameHud({
  hud,
  drawerOpen,
  drawerTab,
  onChangeDrawerTab,
  onToggleDrawer,
  onOpenTab,
  onSelectTool,
  onSellAll,
  onBuyCityOffer,
  onSellMeat,
  onClaimCityDailyQuest,
  onStartNextCityDailyQuest,
  onTouchMove,
  onTouchAttack,
  onTouchInteract,
  onBuyTool,
  onBuyGear,
  onEquipGear,
  onUnequipGear,
  onToggleWingsEquipped,
  onBuyBuilding,
  onBuyFestivalBuilding,
  onExchangeFestivalIce,
  onCraftItem,
  onUseBackpackItem,
  onCraftAndUseItem,
  onSalvageBackpackItem,
  onUnlockSkillPerk,
  onRespecSkills,
  onToggleMute,
  onPause,
  onTitle,
  onUpdateSettings,
  onResetSettings,
  onUsePortal,
  onSelectZone,
  onOpenSecretChest,
  onActivateHuntersSight,
  onInspectTrack,
  onFeedWildPet,
  onSetActivePet,
  onPetCompanion,
  onAttractWildStray,
  onClaimDailyLoginReward,
  onSaveGame,
  onLoadGame,
  onDeleteSave,
  onUnlockAscension,
  onEquipAscension,
  onBuyMysteryItem,
  onToggleBowAutoAttack,
  onToggleBowAutoAim,
  onToggleAutoHarvest,
  onEnterCabin,
  onExitCabin,
  onSleepInCabin,
  onTravelToFishingLake,
  onCastOrHookFish,
  onSetFishingReel,
}: GameHudProps) {
  const isMinimalHud = hud.settings.hudLayout !== 'expanded';
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [hudCompact, setHudCompact] = useState(false);
  const [mobilePlaquesOpen, setMobilePlaquesOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalKind>('hare');
  const [bestiaryFilter, setBestiaryFilter] = useState<'all' | 'common' | 'rare_epic'>('all');
  const [craftFilter, setCraftFilter] = useState<'all' | CraftCategory>('all');
  const [stationSection, setStationSection] = useState<'all' | 'craft' | 'gear' | 'tree'>('all');
  const [cityTraderFilter, setCityTraderFilter] = useState<'all' | CityTraderId>('all');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | AchievementCategory>('all');
  const [chatBoxCollapsed, setChatBoxCollapsed] = useState(true);
  const [chatFilter, setChatFilter] = useState<'all' | 'loot' | 'combat' | 'notification'>('all');
  const [treeTooltip, setTreeTooltip] = useState<{
    title: string;
    rarity: string;
    tier: string;
    description: string;
    sourceLocation: string;
    dropRate: string;
  } | null>(null);

  const axeSpec = getAxeSpec(hud.levels.axe);
  const bowSpec = getBowSpec(hud.levels.bow);
  const cabinSpec = getBuildingSpec('cabin', hud.levels.cabin);

  const discoveredCount = countDiscoveredSpecies(hud.bestiary);
  const totalSpeciesCount = WILDLIFE_SPECIES_ORDER.length;

  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const warmthPct = Math.max(0, Math.min(100, (hud.warmth / Math.max(1, hud.maxWarmth)) * 100));
  const packPct = Math.max(
    0,
    Math.min(100, (hud.packUsed / Math.max(1, hud.packCapacity)) * 100),
  );
  const packFull = hud.packUsed >= hud.packCapacity;
  const isChilled = warmthPct < 25;

  const totalSkillPoints = hud.skills.gatheringPoints + hud.skills.huntingPoints;
  const spentSkillPoints = countSpentSkillPoints(hud.skills);
  const gatherXpNext = xpRequiredForSkillLevel(hud.skills.gatheringLevel);
  const huntXpNext = xpRequiredForSkillLevel(hud.skills.huntingLevel);

  const { woodValue, peltValue } = calculateSellRates(
    hud.levels,
    hud.skillBonuses.peltValueMult,
    hud.gearBonuses.goldTradeMult,
  );
  const cargoGold = Math.round(hud.resources.wood * woodValue + hud.resources.pelts * peltValue);
  const meatCount = Math.floor(hud.resources.meat ?? 0);
  const meatUnitGold = calculateMeatSellValue(
    hud.skillBonuses.peltValueMult * hud.gearBonuses.goldTradeMult,
  );
  const allMeatGold = meatCount * meatUnitGold;
  const weatherProfile = getWeatherProfile(hud.weather);
  const isBlizzard = hud.weather === 'blizzard';
  const frostStrength =
    hud.housing.inCabin || hud.stormShelter.shielded
      ? 0
      : Math.max(
          hud.frostIntensity,
          isChilled ? 0.55 : isBlizzard ? 0.65 : hud.weather === 'light_snow' ? 0.22 : 0,
        );

  const buildingIds: BuildingId[] = [
    'cabin',
    'windbreak',
    'thermalConduit',
    'watchtower',
    'grandGranary',
    'lumberCamp',
    'sawmill',
    'tannery',
    'forge',
    'tamingPen',
    'stormShelter',
  ];
  const weaponIds: ToolUpgradeId[] = ['axe', 'bow'];
  const nextGearSet = getNextGearSetBonus(hud.unlockedGear);

  const rarityColor = (rarity: AnimalRarity | ItemRarity) => {
    switch (rarity) {
      case 'mythic':
        return 'text-[#f0abfc]';
      case 'epic':
        return 'text-[#f6c344]';
      case 'rare':
        return 'text-[#7be0ff]';
      case 'uncommon':
        return 'text-[#8ed49a]';
      default:
        return 'text-[#cbd5e1]';
    }
  };

  const rarityBadgeStyle = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-[#4a1d6e]/80 border-[#f0abfc]/60 text-[#f5d0fe]';
      case 'epic':
        return 'bg-[#3d2e14]/85 border-[#f6c344]/60 text-[#fde047]';
      case 'rare':
        return 'bg-[#14344d]/85 border-[#7be0ff]/60 text-[#9fe8ff]';
      case 'uncommon':
        return 'bg-[#183828]/85 border-[#8ed49a]/55 text-[#a7f3d0]';
      default:
        return 'bg-[#22354f]/85 border-[#6e8eb0]/40 text-[#cbd5e1]';
    }
  };

  const filteredSpecies = WILDLIFE_SPECIES_ORDER.filter((kind) => {
    const r = SPECIES_SPECS[kind].rarity;
    if (bestiaryFilter === 'common') return r === 'common' || r === 'uncommon';
    if (bestiaryFilter === 'rare_epic') return r === 'rare' || r === 'epic' || r === 'mythic';
    return true;
  });
  const activeBestiaryKind = filteredSpecies.includes(selectedSpecies)
    ? selectedSpecies
    : (filteredSpecies[0] ?? 'hare');
  const activeSpec = SPECIES_SPECS[activeBestiaryKind];
  const activeLore = BESTIARY_LORE[activeBestiaryKind];
  const activeRecord = hud.bestiary[activeBestiaryKind];
  const activeEfficiency = computeHuntingEfficiency(activeRecord, activeSpec);

  return (
    <div
      data-zone={hud.zone.id}
      className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5"
    >
      {/* Screen-Projected Floating Combat Damage Numbers */}
      {(hud.damagePopups?.length ?? 0) > 0 && (
        <div
          data-testid="combat-damage-popups"
          aria-hidden="true"
          className="fixed inset-0 z-20 pointer-events-none overflow-hidden"
        >
          {hud.damagePopups!.map((popup) => (
            <div
              key={popup.id}
              className={`absolute animate-dmg-float font-display font-extrabold tabular-nums hud-text-stroke whitespace-nowrap ${
                popup.isPlayerDamage
                  ? 'text-base sm:text-lg text-[#fb7185]'
                  : popup.crit
                    ? 'text-lg sm:text-xl text-[#fde047]'
                    : 'text-sm sm:text-base text-[#f8fafc]'
              }`}
              style={{
                left: `${popup.xPct}%`,
                top: `${popup.yPct}%`,
              }}
            >
              {popup.isPlayerDamage ? `-${popup.amount}` : popup.crit ? `${popup.amount}!` : popup.amount}
            </div>
          ))}
        </div>
      )}
      {/* Screen-Space Weather Frost & Blowing Mist Overlay */}
      {frostStrength > 0.02 && (
        <div
          data-testid="weather-frost-overlay"
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: Math.min(1, 0.25 + frostStrength * 0.75),
            boxShadow: `inset 0 0 ${Math.round(55 + frostStrength * 95)}px ${Math.round(
              14 + frostStrength * 34,
            )}px rgba(${isChilled ? '115, 202, 255' : '188, 228, 255'}, ${(
              0.18 +
              frostStrength * 0.42
            ).toFixed(2)})`,
            backgroundImage:
              isBlizzard || frostStrength > 0.42
                ? `radial-gradient(ellipse at center, transparent 52%, rgba(206, 234, 255, ${(
                    frostStrength * 0.34
                  ).toFixed(2)}) 100%), linear-gradient(112deg, rgba(232, 245, 255, ${(
                    frostStrength * 0.16
                  ).toFixed(2)}) 0%, transparent 34%, transparent 66%, rgba(210, 236, 255, ${(
                    frostStrength * 0.2
                  ).toFixed(2)}) 100%)`
                : `radial-gradient(ellipse at center, transparent 60%, rgba(196, 228, 255, ${(
                    frostStrength * 0.22
                  ).toFixed(2)}) 100%)`,
          }}
        />
      )}

      {/* Sleeping Day-Skip Curtain & Progress Banner */}
      {hud.housing.isSleeping && (() => {
        const p = hud.housing.sleepProgress;
        const curtainOpacity =
          p < 0.36
            ? 0
            : p < 0.58
              ? ((p - 0.36) / 0.22) * 0.72
              : p < 0.76
                ? 0.72
                : Math.max(0, (1 - p) / 0.24) * 0.72;
        return (
          <div
            data-testid="sleep-transition-overlay"
            className="fixed inset-0 z-30 pointer-events-none flex flex-col items-center justify-start pt-20 sm:pt-24 transition-colors"
            style={{
              backgroundColor: `rgba(6, 10, 20, ${curtainOpacity.toFixed(3)})`,
            }}
          >
            <div className="hud-plaque-gold px-5 py-3 rounded-xl border border-[#fbbf24]/75 bg-[#19140e]/95 shadow-[0_14px_34px_rgba(6,10,20,0.82)] flex flex-col items-center gap-1.5 min-w-[290px]">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#fde68a]">
                <BedDouble className="w-4 h-4 text-[#fbbf24]" />
                <span>Resting in {hud.housing.bedName}</span>
              </div>
              <div className="text-[11px] font-semibold text-[#e2e8f0] tabular-nums">
                {p >= 0.56
                  ? `Dawn Awakened · Day ${hud.housing.sleepTargetDay} (06:28 AM)`
                  : `Sleeping until Day ${hud.housing.sleepTargetDay} Dawn...`}
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#0f172a] overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fde047] transition-[width] duration-75"
                  style={{ width: `${Math.round(Math.min(1, Math.max(0, p)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top Cluster (Header + Zone Boss Encounter Plaque) */}
      <div className="flex flex-col w-full shrink-0">
        {/* Top Perimeter Clusters */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left Resource & Vitals Strip */}
        <div className="flex flex-col items-start gap-1.5 sm:gap-2 min-w-0 max-w-[calc(100vw-134px)] sm:max-w-none">
          <div
            data-testid="hud-vitals-bar"
            className="pointer-events-auto hud-plaque rounded-xl px-2.5 sm:px-3.5 py-2 flex flex-col gap-1.5 w-full sm:w-auto"
          >
            <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1">
              <div
                className={`flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                  (hud.skillPerkPulse.activeResources.wood ?? 0) > 0
                    ? 'bg-[#12382b]/90 ring-1 ring-[#6ee7b7]/80'
                    : ''
                }`}
                title="Wood"
                data-testid={
                  (hud.skillPerkPulse.activeResources.wood ?? 0) > 0
                    ? 'resource-skill-pulse-wood'
                    : undefined
                }
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {(hud.skillPerkPulse.activeResources.wood ?? 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-[#6ee7b7] animate-skill-ring-ripple pointer-events-none"
                    />
                  )}
                  <WoodIcon
                    className={`w-4 h-4 shrink-0 ${
                      (hud.skillPerkPulse.activeResources.wood ?? 0) > 0
                        ? 'animate-skill-icon-pulse'
                        : ''
                    }`}
                  />
                </div>
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#9db4cb] flex items-center gap-1">
                    <span>Wood</span>
                    {(hud.skillPerkPulse.activeResources.wood ?? 0) > 0 &&
                      hud.skillBonuses.gatherYieldMult > 1 && (
                        <span
                          data-testid="wood-skill-bonus-pill"
                          className="px-1 py-0.1 rounded bg-[#10b981] text-[#052e16] text-[8px] font-extrabold tracking-tight"
                        >
                          +{Math.round((hud.skillBonuses.gatherYieldMult - 1) * 100)}%
                        </span>
                      )}
                  </div>
                  <div className="text-sm sm:text-base font-bold tabular-nums text-[#f4efe6] inline-flex items-center gap-0.5">
                    <span>{hud.resources.wood}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="wood"
                        trend={hud.resourceTrends.wood}
                        delta={hud.resourceTrendDeltas.wood}
                      />
                    )}
                    {!isMinimalHud && hud.woodRate > 0 && (
                      <span className="hidden xl:inline text-[10px] font-semibold text-[#8ed49a]">
                        +{hud.woodRate.toFixed(1)}/s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                  (hud.skillPerkPulse.activeResources.stone ?? 0) > 0
                    ? 'bg-[#12382b]/90 ring-1 ring-[#6ee7b7]/80'
                    : ''
                }`}
                title="Stone"
                data-testid={
                  (hud.skillPerkPulse.activeResources.stone ?? 0) > 0
                    ? 'resource-skill-pulse-stone'
                    : undefined
                }
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {(hud.skillPerkPulse.activeResources.stone ?? 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-[#6ee7b7] animate-skill-ring-ripple pointer-events-none"
                    />
                  )}
                  <StoneIcon
                    className={`w-4 h-4 shrink-0 ${
                      (hud.skillPerkPulse.activeResources.stone ?? 0) > 0
                        ? 'animate-skill-icon-pulse'
                        : ''
                    }`}
                  />
                </div>
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#9db4cb] flex items-center gap-1">
                    <span>Stone</span>
                    {(hud.skillPerkPulse.activeResources.stone ?? 0) > 0 &&
                      hud.skillBonuses.gatherYieldMult > 1 && (
                        <span
                          data-testid="stone-skill-bonus-pill"
                          className="px-1 py-0.1 rounded bg-[#10b981] text-[#052e16] text-[8px] font-extrabold tracking-tight"
                        >
                          +{Math.round((hud.skillBonuses.gatherYieldMult - 1) * 100)}%
                        </span>
                      )}
                  </div>
                  <div className="text-sm sm:text-base font-bold tabular-nums text-[#dce6f2] inline-flex items-center gap-0.5">
                    <span>{hud.resources.stone ?? 0}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="stone"
                        trend={hud.resourceTrends.stone}
                        delta={hud.resourceTrendDeltas.stone}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                  (hud.skillPerkPulse.activeResources.ice ?? 0) > 0
                    ? 'bg-[#10344a]/90 ring-1 ring-[#7be0ff]/80'
                    : ''
                }`}
                title="Ice Shards"
                data-testid={
                  (hud.skillPerkPulse.activeResources.ice ?? 0) > 0
                    ? 'resource-skill-pulse-ice'
                    : undefined
                }
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {(hud.skillPerkPulse.activeResources.ice ?? 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-[#7be0ff] animate-skill-ring-ripple pointer-events-none"
                    />
                  )}
                  <IceIcon
                    className={`w-4 h-4 shrink-0 ${
                      (hud.skillPerkPulse.activeResources.ice ?? 0) > 0
                        ? 'animate-skill-icon-pulse'
                        : ''
                    }`}
                  />
                </div>
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#9db4cb] flex items-center gap-1">
                    <span>Ice</span>
                    {(hud.skillPerkPulse.activeResources.ice ?? 0) > 0 &&
                      hud.skillBonuses.gatherYieldMult > 1 && (
                        <span
                          data-testid="ice-skill-bonus-pill"
                          className="px-1 py-0.1 rounded bg-[#38bdf8] text-[#082f49] text-[8px] font-extrabold tracking-tight"
                        >
                          +{Math.round((hud.skillBonuses.gatherYieldMult - 1) * 100)}%
                        </span>
                      )}
                  </div>
                  <div className="text-sm sm:text-base font-bold tabular-nums text-[#9fe8ff] inline-flex items-center gap-0.5">
                    <span>{hud.resources.ice ?? 0}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="ice"
                        trend={hud.resourceTrends.ice}
                        delta={hud.resourceTrendDeltas.ice}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors ${
                  (hud.skillPerkPulse.activeResources.pelts ?? 0) > 0
                    ? 'bg-[#3b2912]/90 ring-1 ring-[#f6c344]/80'
                    : ''
                }`}
                title="Pelts"
                data-testid={
                  (hud.skillPerkPulse.activeResources.pelts ?? 0) > 0
                    ? 'resource-skill-pulse-pelts'
                    : undefined
                }
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {(hud.skillPerkPulse.activeResources.pelts ?? 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-[#f6c344] animate-skill-ring-ripple pointer-events-none"
                    />
                  )}
                  <PeltIcon
                    className={`w-4 h-4 shrink-0 ${
                      (hud.skillPerkPulse.activeResources.pelts ?? 0) > 0
                        ? 'animate-skill-icon-pulse'
                        : ''
                    }`}
                  />
                </div>
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#9db4cb] flex items-center gap-1">
                    <span>Pelts</span>
                    {(hud.skillPerkPulse.activeResources.pelts ?? 0) > 0 &&
                      hud.skillBonuses.peltYieldMult > 1 && (
                        <span
                          data-testid="pelts-skill-bonus-pill"
                          className="px-1 py-0.1 rounded bg-[#f6c344] text-[#1f1608] text-[8px] font-extrabold tracking-tight"
                        >
                          +{Math.round((hud.skillBonuses.peltYieldMult - 1) * 100)}%
                        </span>
                      )}
                  </div>
                  <div className="text-sm sm:text-base font-bold tabular-nums text-[#f4efe6] inline-flex items-center gap-0.5">
                    <span>{hud.resources.pelts}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="pelts"
                        trend={hud.resourceTrends.pelts}
                        delta={hud.resourceTrendDeltas.pelts}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1" title="Wild Meat (Hunt Wildlife & Trade in Frostcave City)">
                <MeatIcon className="w-4 h-4 shrink-0" />
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#fda4af]">
                    Meat
                  </div>
                  <div
                    data-testid="hud-meat-count"
                    className="text-sm sm:text-base font-bold tabular-nums text-[#ffe4e6] inline-flex items-center gap-0.5"
                  >
                    <span>{meatCount}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="meat"
                        trend={hud.resourceTrends.meat}
                        delta={hud.resourceTrendDeltas.meat}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1" title="Gold Coins">
                <GoldIcon className="w-4 h-4 shrink-0" />
                <div className="leading-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#9db4cb]">
                    Coins
                  </div>
                  <div
                    data-testid="hud-gold-count"
                    className="text-sm sm:text-base font-bold tabular-nums text-[#f6c344] inline-flex items-center gap-0.5"
                  >
                    <span>{hud.resources.gold}</span>
                    {!isMinimalHud && (
                      <ResourceTrendArrow
                        resource="gold"
                        trend={hud.resourceTrends.gold}
                        delta={hud.resourceTrendDeltas.gold}
                      />
                    )}
                    {!isMinimalHud && hud.goldRate > 0 && (
                      <span className="hidden xl:inline text-[10px] font-semibold text-[#ffd978]">
                        +{hud.goldRate.toFixed(1)}/s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* HP, Warmth, Stamina & Backpack Storage Bars */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-1.5 border-t border-[#78a0c8]/25">
              <div className="flex items-center gap-1 min-w-0">
                <HeartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-semibold tabular-nums text-[#dce6f2] mb-0.5 gap-0.5">
                    <span className="uppercase tracking-wider text-[#9db4cb]">HP</span>
                    <span className="font-bold text-[#f4efe6]">{hud.hp}/{hud.maxHp}</span>
                  </div>
                  <div className="hud-meter-track h-2 sm:h-2.5 rounded-sm overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#ffe4e6]/55 transition-[width] duration-700 ease-out pointer-events-none"
                      style={{ width: `${hpPct}%` }}
                    />
                    <div
                      className="relative z-[1] h-full bg-gradient-to-b from-[#f06b63] to-[#c43730] shadow-[inset_0_1px_0_rgba(255,210,210,0.45)] transition-[width] duration-150"
                      style={{ width: `${hpPct}%` }}
                    />
                    <div className="hud-meter-ticks absolute inset-0 z-[2] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 min-w-0">
                <WarmthIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-semibold tabular-nums text-[#dce6f2] mb-0.5 gap-0.5">
                    <span className="truncate uppercase tracking-wider text-[#9db4cb]">
                      {hud.stormShelter.shielded ? 'Shield' : 'Warm'}
                    </span>
                    <span className="font-bold text-[#f4efe6] shrink-0">{hud.warmth}%</span>
                  </div>
                  <div className="hud-meter-track h-2 sm:h-2.5 rounded-sm overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#fef3c7]/50 transition-[width] duration-700 ease-out pointer-events-none"
                      style={{ width: `${warmthPct}%` }}
                    />
                    <div
                      className={`relative z-[1] h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-[width] duration-150 ${
                        hud.stormShelter.shielded
                          ? 'bg-gradient-to-b from-[#96ecff] to-[#3ba9d6]'
                          : isChilled
                            ? 'bg-gradient-to-b from-[#7ad1ff] to-[#2e8bc7]'
                            : 'bg-gradient-to-b from-[#ffba59] to-[#d97719]'
                      }`}
                      style={{ width: `${warmthPct}%` }}
                    />
                    <div className="hud-meter-ticks absolute inset-0 z-[2] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 min-w-0" title="Stamina (Depletes on actions, regenerates over time)">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-semibold tabular-nums text-[#dce6f2] mb-0.5 gap-0.5">
                    <span className="uppercase tracking-wider text-[#9db4cb]">Stam</span>
                    <span className="font-bold text-[#f4efe6]">{hud.stamina ?? 100}</span>
                  </div>
                  <div className="hud-meter-track h-2 sm:h-2.5 rounded-sm overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#d1fae5]/45 transition-[width] duration-700 ease-out pointer-events-none"
                      style={{ width: `${Math.max(0, Math.min(100, ((hud.stamina ?? 100) / 100) * 100))}%` }}
                    />
                    <div
                      className="relative z-[1] h-full bg-gradient-to-b from-[#6ee7b7] to-[#059669] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-[width] duration-150"
                      style={{ width: `${Math.max(0, Math.min(100, ((hud.stamina ?? 100) / 100) * 100))}%` }}
                    />
                    <div className="hud-meter-ticks absolute inset-0 z-[2] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 min-w-0" title="Backpack Storage (Wood + Stone + Pelts)">
                <Backpack
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    packFull ? 'text-[#ef7b73]' : 'text-[#8ed49a]'
                  }`}
                />
                <div className="flex-1 min-w-0 sm:w-20">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-semibold tabular-nums text-[#dce6f2] mb-0.5 gap-0.5">
                    <span className="uppercase tracking-wider text-[#9db4cb]">Pack</span>
                    <span
                      data-testid="backpack-capacity-text"
                      className={packFull ? 'text-[#ef7b73] font-bold shrink-0' : 'font-bold text-[#f4efe6] shrink-0'}
                    >
                      {hud.packUsed}/{hud.packCapacity}
                    </span>
                  </div>
                  <div className="hud-meter-track h-2 sm:h-2.5 rounded-sm overflow-hidden">
                    <div
                      className={`h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[width] duration-150 ${
                        packFull
                          ? 'bg-gradient-to-b from-[#f48b84] to-[#c94a42]'
                          : packPct >= 80
                            ? 'bg-gradient-to-b from-[#ffd56b] to-[#d1901f]'
                            : 'bg-gradient-to-b from-[#a7e6b2] to-[#53a664]'
                      }`}
                      style={{ width: `${packPct}%` }}
                    />
                    <div className="hud-meter-ticks absolute inset-0 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {!isMinimalHud && (
              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#78a0c8]/20 text-[10px] font-semibold text-[#b8cbe0]">
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-compact-toggle"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    if (window.innerWidth < 640) {
                      setMobilePlaquesOpen((prev) => !prev);
                    } else {
                      setHudCompact((prev) => !prev);
                    }
                  }}
                  className="hud-keycap whitespace-nowrap inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[#dce6f2] cursor-pointer transition-colors"
                >
                  <span className="sm:hidden">
                    {mobilePlaquesOpen ? 'Hide' : 'Quests'}
                  </span>
                  <span className="hidden sm:inline">
                    {hudCompact ? 'Expand HUD Panels' : 'Compact HUD'}
                  </span>
                  {hudCompact ? <ChevronDown className="w-3 h-3 text-[#f6c344]" /> : <ChevronUp className="w-3 h-3 text-[#f6c344]" />}
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {hud.dailyLogin.canClaimToday ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="hud-daily-reward-pill"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onClaimDailyLoginReward();
                      }}
                      className="hud-keycap-active whitespace-nowrap inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      <Gift className="w-3 h-3 shrink-0" />
                      <span className="sm:hidden">D{hud.dailyLogin.todayReward.day} Drop</span>
                      <span className="hidden sm:inline">Claim Day {hud.dailyLogin.todayReward.day} Drop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onOpenTab('daily');
                      }}
                      className="hud-keycap whitespace-nowrap inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[#fde68a] cursor-pointer transition-colors"
                    >
                      <Gift className="w-3 h-3 text-[#f6c344]" />
                      <span>{hud.dailyLogin.streakDay}d</span>
                    </button>
                  )}

                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="hud-quick-save-pill"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSaveGame('slot1');
                    }}
                    title="Quick Save to Slot 1 [F5]"
                    className="whitespace-nowrap inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-gradient-to-b from-[#214534] to-[#162f23] hover:from-[#295742] hover:to-[#1c3d2e] border border-[#8ed49a]/55 text-[#a7f3d0] cursor-pointer shadow-[inset_0_1px_0_rgba(167,243,208,0.18)] transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Skill Perk Gathering Bonus Visual Effect & Icon Pulse Plaque */}
          {hud.skillPerkPulse.active && (
            <button
              key={`perk-pulse-${hud.skillPerkPulse.perkId}-${hud.skillPerkPulse.pulseNonce}`}
              type="button"
              tabIndex={-1}
              data-testid="skill-perk-bonus-pulse"
              data-perk-id={hud.skillPerkPulse.perkId ?? ''}
              data-pulse-nonce={hud.skillPerkPulse.pulseNonce}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenTab('skills');
              }}
              className="pointer-events-auto w-64 sm:w-72 text-left rounded-lg hud-plaque-skill-pulse border-l-[3px] border-l-[#34d399] px-3 py-2 cursor-pointer animate-skill-plaque-pop transition-transform hover:brightness-110"
            >
              <div className="flex items-center gap-2.5">
                {/* Pulsing Skill Perk Emblem Icon with Expanding Shockwave Ring */}
                <div
                  data-testid="skill-perk-pulse-icon"
                  className="relative w-8 h-8 rounded-lg bg-gradient-to-b from-[#10b981]/35 to-[#047857]/45 border border-[#6ee7b7] flex items-center justify-center shrink-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg border-2 border-[#6ee7b7] animate-skill-ring-ripple pointer-events-none"
                  />
                  <Award className="w-4 h-4 text-[#a7f3d0] animate-skill-icon-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#6ee7b7] truncate">
                      Skill Perk Bonus · R{hud.skillPerkPulse.rank}/{hud.skillPerkPulse.maxRank}
                    </span>
                    <span
                      data-testid="skill-perk-bonus-pct"
                      className="px-1.5 py-0.2 rounded bg-[#10b981] text-[#042f2e] text-[9px] font-extrabold uppercase tracking-wider tabular-nums shrink-0"
                    >
                      +{hud.skillPerkPulse.bonusPct}% Yield
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-1.5">
                    <span
                      data-testid="skill-perk-bonus-name"
                      className="text-xs font-extrabold text-[#f0fdf4] truncate"
                    >
                      {hud.skillPerkPulse.perkName}
                    </span>
                    <span className="text-[10px] font-bold text-[#fde68a] truncate shrink-0">
                      {hud.skillPerkPulse.taskLabel}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-1.5 text-[10px] font-semibold text-[#a7f3d0] tabular-nums">
                    <span className="truncate">{hud.skillPerkPulse.secondaryBonusText}</span>
                    <span>{hud.skillPerkPulse.timeRemaining.toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              <div className="hud-meter-track mt-1.5 h-1.5 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#34d399] via-[#6ee7b7] to-[#facc15] transition-[width] duration-100"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (hud.skillPerkPulse.timeRemaining /
                          Math.max(0.1, hud.skillPerkPulse.duration)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </button>
          )}

          {/* Daily Objective & Seasonal Event Plaques (Classic HUD Mode Only) */}
          <div className={`${isMinimalHud || hudCompact ? 'hidden' : mobilePlaquesOpen ? 'flex' : 'hidden sm:flex'} flex-col items-start gap-2`}>
          {(() => {
            const obj = hud.dailyObjective;
            const objPct = Math.max(0, Math.min(100, (obj.progress / Math.max(1, obj.target)) * 100));
            const objUrgent = !obj.completed && !obj.failed && obj.timeLeft <= 15;
            const plaqueCls = obj.completed
              ? 'hud-plaque border-l-[3px] border-l-[#8ed49a]'
              : obj.failed
                ? 'hud-plaque-crimson border-l-[3px] border-l-[#ef7b73]'
                : objUrgent
                  ? 'hud-plaque-gold border-l-[3px] border-l-[#f59e3d]'
                  : 'hud-plaque border-l-[3px] border-l-[#f6c344]';
            const barCls = obj.completed
              ? 'bg-gradient-to-b from-[#a7e6b2] to-[#53a664]'
              : obj.failed
                ? 'bg-gradient-to-b from-[#f48b84] to-[#c94a42]'
                : 'bg-gradient-to-b from-[#ffd56b] to-[#d98a2b]';
            return (
              <div
                data-testid="daily-objective"
                className={`pointer-events-auto w-64 sm:w-72 rounded-lg ${plaqueCls} px-3.5 py-2`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9db4cb]">
                    Day {obj.dayNumber} Objective
                  </span>
                  {obj.completed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ed49a]">
                      Completed
                    </span>
                  ) : obj.failed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ef7b73]">
                      Expired
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        objUrgent ? 'text-[#f59e3d]' : 'text-[#dce6f2]'
                      }`}
                    >
                      {Math.ceil(obj.timeLeft)}s
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#f4efe6] truncate">
                    {obj.title}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-[#dce6f2] shrink-0">
                    {obj.progress}/{obj.target}
                  </span>
                </div>

                <div className="hud-meter-track mt-1.5 h-2 rounded-sm overflow-hidden">
                  <div
                    className={`h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[width] duration-150 ${barCls}`}
                    style={{ width: `${objPct}%` }}
                  />
                  <div className="hud-meter-ticks absolute inset-0 pointer-events-none" />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold tabular-nums">
                  <span className="uppercase tracking-wider text-[#9db4cb]">Bonus</span>
                  <div className="flex items-center gap-2.5">
                    {obj.reward.gold ? (
                      <span className="inline-flex items-center gap-1 text-[#f6c344]">
                        <GoldIcon className="w-3 h-3" />+{obj.reward.gold}
                      </span>
                    ) : null}
                    {obj.reward.wood ? (
                      <span className="inline-flex items-center gap-1 text-[#e8d5b8]">
                        <WoodIcon className="w-3 h-3" />+{obj.reward.wood}
                      </span>
                    ) : null}
                    {obj.reward.pelts ? (
                      <span className="inline-flex items-center gap-1 text-[#e8d5b8]">
                        <PeltIcon className="w-3 h-3" />+{obj.reward.pelts}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Harvest Streak Plaque */}
          {hud.harvestStreak.count > 0 && (
            <div
              data-testid="harvest-streak-plaque"
              className="pointer-events-auto w-64 sm:w-72 rounded-lg hud-plaque-gold border-l-[3px] border-l-[#f59e3d] px-3.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#f59e3d]">
                  🔥 Harvest Streak
                </span>
                <span className="text-xs font-bold tabular-nums text-[#fde68a]">
                  {Math.ceil(hud.harvestStreak.timeRemaining)}s
                </span>
              </div>

              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#f4efe6]">
                  Streak {hud.harvestStreak.count}x
                </span>
                <span className="text-xs font-bold tabular-nums text-[#8ed49a]">
                  +{hud.harvestStreak.yieldBonusPct}% Wood Yield
                </span>
              </div>

              <div className="hud-meter-track mt-1.5 h-2 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-b from-[#ffd56b] to-[#d98a2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[width] duration-150"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (hud.harvestStreak.timeRemaining / hud.harvestStreak.maxTime) * 100,
                      ),
                    )}%`,
                  }}
                />
                <div className="hud-meter-ticks absolute inset-0 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Seasonal Event Plaque */}
          <button
            type="button"
            tabIndex={-1}
            data-testid="seasonal-event-banner"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenTab('festival');
            }}
            className={`pointer-events-auto w-64 sm:w-72 text-left rounded-lg px-3.5 py-2 transition-colors cursor-pointer ${
              hud.seasonalEvent.active
                ? 'hud-plaque-frost border-l-[3px] border-l-[#7be0ff] hover:brightness-110'
                : 'hud-plaque border-l-[3px] border-l-[#6e8eb0] hover:brightness-110'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                  hud.seasonalEvent.active ? 'text-[#7be0ff]' : 'text-[#9db4cb]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {hud.seasonalEvent.active ? 'Seasonal Event Active' : 'Next Seasonal Event'}
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${
                  hud.seasonalEvent.active ? 'text-[#f6c344]' : 'text-[#dce6f2]'
                }`}
              >
                {Math.ceil(hud.seasonalEvent.timeLeft)}s
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#f4efe6] truncate">
                {hud.seasonalEvent.name}
              </span>
              <span className="text-[10px] font-semibold text-[#9fe8ff] shrink-0">
                {hud.seasonalEvent.active ? '[F] Open' : 'Locked'}
              </span>
            </div>
            {hud.seasonalEvent.active && (
              <div className="mt-0.5 text-[10px] text-[#b9d8f0] truncate">
                {hud.seasonalEvent.subtitle}
              </div>
            )}
          </button>

          {/* Storm Shelter Immunity Plaque */}
          {hud.stormShelter.level > 0 && (
            <div
              data-testid="storm-shelter-status"
              className={`pointer-events-auto w-64 sm:w-72 rounded-lg px-3.5 py-2 ${
                hud.stormShelter.shielded
                  ? 'hud-plaque-frost border-l-[3px] border-l-[#8ce8ff]'
                  : hud.stormShelter.phase === 'active'
                    ? 'hud-plaque-frost'
                    : hud.stormShelter.phase === 'cooldown'
                      ? 'hud-plaque'
                      : 'hud-plaque-gold border-l-[3px] border-l-[#f6c344]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                    hud.stormShelter.shielded
                      ? 'text-[#9ef0ff]'
                      : hud.stormShelter.phase === 'cooldown'
                        ? 'text-[#9db4cb]'
                        : 'text-[#f6c344]'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {hud.stormShelter.shielded
                    ? 'Storm Shelter · Immune'
                    : hud.stormShelter.phase === 'active'
                      ? 'Shelter Dome Active'
                      : hud.stormShelter.phase === 'cooldown'
                        ? 'Shelter Recharging'
                        : 'Storm Shelter Ready'}
                </span>
                <span className="text-xs font-bold tabular-nums text-[#f4efe6]">
                  {hud.stormShelter.phase === 'ready'
                    ? 'Enter'
                    : `${Math.ceil(hud.stormShelter.timeLeft)}s`}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[#c7d9ec] truncate">
                {hud.stormShelter.shielded
                  ? 'Immune to blizzard damage & warmth loss'
                  : hud.stormShelter.phase === 'cooldown'
                    ? 'Shield recovering before next refuge cycle'
                    : 'Step inside eastern refuge dome to activate'}
              </div>
            </div>
          )}
          </div>

          {/* Active Crafted Item Buffs & Pack Preparedness Link (Classic HUD Only) */}
          {!isMinimalHud &&
            (hud.activeBuffs.fireStarter > 0 ||
            hud.activeBuffs.insulatedBoots > 0 ||
            hud.activeBuffs.flintEdge > 0 ||
            (hud.activeBuffs.frostWhetstone ?? 0) > 0 ||
            (hud.activeBuffs.auroraCharm ?? 0) > 0 ||
            (hud.activeBuffs.hammerTemper ?? 0) > 0 ||
            (hud.activeBuffs.utilityToolkit ?? 0) > 0 ||
            hud.backpackPreparedness.stockedCount > 0 ||
            hud.deployedTraps.length > 0) && (
            <div
              data-testid="active-craft-buffs"
              className="pointer-events-auto flex flex-wrap items-center gap-1.5 max-w-[360px]"
            >
              {hud.backpackPreparedness.stockedCount > 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="pack-link-badge"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onOpenTab('inventory');
                  }}
                  title={hud.backpackPreparedness.label}
                  className="whitespace-nowrap rounded-md bg-[#142d2a]/92 hover:bg-[#1a3a36] border border-[#8ed49a]/65 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold tabular-nums text-[#a7f3d0] cursor-pointer transition-colors"
                >
                  Pack Link +{Math.round((hud.backpackPreparedness.damageMult - 1) * 100)}% Dmg · +
                  {Math.round((hud.backpackPreparedness.moveSpeedMult - 1) * 100)}% Spd
                </button>
              )}
              {(hud.activeBuffs.hammerTemper ?? 0) > 0 && (
                <div className="rounded-md bg-[#2c2112]/92 border border-[#f59e3d]/70 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#ffd58a]">
                  Hammer Temper {Math.ceil(hud.activeBuffs.hammerTemper ?? 0)}s
                </div>
              )}
              {(hud.activeBuffs.utilityToolkit ?? 0) > 0 && (
                <div className="rounded-md bg-[#133246]/92 border border-[#7be0ff]/70 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#9fe8ff]">
                  Field Toolkit {Math.ceil(hud.activeBuffs.utilityToolkit ?? 0)}s
                </div>
              )}
              {hud.activeBuffs.fireStarter > 0 && (
                <div className="rounded-md bg-[#261a14]/90 border border-[#f59e3d]/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#ffd7a1]">
                  Fire Starter {Math.ceil(hud.activeBuffs.fireStarter)}s
                </div>
              )}
              {hud.activeBuffs.insulatedBoots > 0 && (
                <div className="rounded-md bg-[#16283d]/90 border border-[#7be0ff]/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#c4f2ff]">
                  Insulated Boots {Math.ceil(hud.activeBuffs.insulatedBoots)}s
                </div>
              )}
              {hud.activeBuffs.flintEdge > 0 && (
                <div className="rounded-md bg-[#242014]/90 border border-[#f6c344]/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#ffe69d]">
                  Flint Edge {Math.ceil(hud.activeBuffs.flintEdge)}s
                </div>
              )}
              {(hud.activeBuffs.frostWhetstone ?? 0) > 0 && (
                <div className="rounded-md bg-[#123047]/90 border border-[#7be0ff]/75 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#9fe8ff]">
                  Glacial Edge {Math.ceil(hud.activeBuffs.frostWhetstone)}s
                </div>
              )}
              {(hud.activeBuffs.auroraCharm ?? 0) > 0 && (
                <div className="rounded-md bg-[#34164d]/92 border border-[#f0abfc]/80 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#f5d0fe]">
                  Aurora Talisman {Math.ceil(hud.activeBuffs.auroraCharm)}s
                </div>
              )}
              {hud.deployedTraps.length > 0 && (
                <div
                  data-testid="armed-traps-badge"
                  className="rounded-md bg-[#261c16]/92 border border-[#f6c344]/65 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#fde68a]"
                >
                  Traps Armed ({hud.deployedTraps.length})
                </div>
              )}
            </div>
          )}

          {/* Tracked Quarry / Hunter's Sight Lock-On Plaque */}
          {hud.trackedQuarry && (
            <div
              data-testid="quarry-tracker"
              className="pointer-events-auto w-64 sm:w-72 rounded-lg px-3.5 py-2 hud-plaque-frost border-l-[3px] border-l-[#5be7ff]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#7be0ff]">
                  <Crosshair className="w-3 h-3" />
                  Tracked Quarry
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                    hud.trackedQuarry.rarity,
                  )}`}
                >
                  {getRarityLabel(hud.trackedQuarry.rarity)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#f4efe6] truncate">
                  {hud.trackedQuarry.label}
                </span>
                <span className="text-xs font-bold tabular-nums text-[#7be0ff] shrink-0">
                  {hud.trackedQuarry.distance}m {hud.trackedQuarry.direction}
                </span>
              </div>
              <div className="hud-meter-track mt-1 h-2 rounded-sm overflow-hidden">
                <div
                  className={`h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[width] duration-150 ${
                    hud.trackedQuarry.predator
                      ? 'bg-gradient-to-b from-[#f48b84] to-[#c94a42]'
                      : 'bg-gradient-to-b from-[#a7e6b2] to-[#53a664]'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (hud.trackedQuarry.hp / Math.max(1, hud.trackedQuarry.maxHp)) * 100,
                      ),
                    )}%`,
                  }}
                />
                <div className="hud-meter-ticks absolute inset-0 pointer-events-none" />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-semibold tabular-nums text-[#b8cbe0]">
                <span>
                  HP {hud.trackedQuarry.hp}/{hud.trackedQuarry.maxHp} · {hud.trackedQuarry.state}
                </span>
                {hud.trackedQuarry.ambushReady && (
                  <span className="text-[#f6c344] font-bold">+25% Focus</span>
                )}
              </div>
            </div>
          )}

          {/* Rival Hunter / Rare Enemy Encounter Alert Plaque */}
          {hud.rivalHunters.length > 0 &&
            hud.rivalHunters[0].distance <= 48 &&
            (!isMinimalHud ||
              hud.rivalHunters[0].distance <= 22 ||
              hud.rivalHunters[0].state === 'attacking' ||
              hud.rivalHunters[0].state === 'charging') && (
            <div
              data-testid="rival-hunter-alert"
              className={`pointer-events-auto w-[236px] sm:w-72 rounded-lg px-3 sm:px-3.5 py-2 border-l-[3px] ${
                hud.rivalHunters[0].rarity === 'mythic'
                  ? 'hud-plaque border-l-[#c084fc] border-[#c084fc]/70'
                  : hud.rivalHunters[0].rarity === 'rare'
                    ? 'hud-plaque-frost border-l-[#38bdf8]'
                    : 'hud-plaque-crimson border-l-[#ef4444]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                    hud.rivalHunters[0].rarity === 'mythic'
                      ? 'text-[#e9d5ff]'
                      : hud.rivalHunters[0].rarity === 'rare'
                        ? 'text-[#bae6fd]'
                        : 'text-[#fca5a5]'
                  }`}
                >
                  <Skull
                    className={`w-3.5 h-3.5 ${
                      hud.rivalHunters[0].rarity === 'mythic'
                        ? 'text-[#c084fc]'
                        : hud.rivalHunters[0].rarity === 'rare'
                          ? 'text-[#38bdf8]'
                          : 'text-[#ef4444]'
                    }`}
                  />
                  {hud.rivalHunters[0].rarity === 'mythic'
                    ? 'Mythic Frost Threat'
                    : hud.rivalHunters[0].rarity === 'rare'
                      ? 'Rare Warlord Threat'
                      : 'Rival Hunter Threat'}
                </span>
                <div className="flex items-center gap-1">
                  {(hud.rivalHunters[0].rarity === 'rare' ||
                    hud.rivalHunters[0].rarity === 'mythic') && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        hud.rivalHunters[0].rarity === 'mythic'
                          ? 'bg-[#6b21a8] text-[#f3e8ff]'
                          : 'bg-[#0369a1] text-[#e0f2fe]'
                      }`}
                    >
                      {hud.rivalHunters[0].rarity}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-[#450a0a] border border-[#f87171]/65 text-[9px] font-bold uppercase tracking-wider text-[#fecaca]">
                    {hud.rivalHunters[0].state}
                  </span>
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#fff1f2] truncate">
                  {hud.rivalHunters[0].name}
                </span>
                <span className="text-xs font-bold tabular-nums text-[#fca5a5] shrink-0">
                  {hud.rivalHunters[0].distance}m {hud.rivalHunters[0].direction}
                </span>
              </div>
              <div className="hud-meter-track mt-1 h-2 rounded-sm overflow-hidden">
                <div
                  className={`h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[width] duration-150 ${
                    hud.rivalHunters[0].rarity === 'mythic'
                      ? 'bg-gradient-to-b from-[#d8b4fe] to-[#9333ea]'
                      : hud.rivalHunters[0].rarity === 'rare'
                        ? 'bg-gradient-to-b from-[#7dd3fc] to-[#0284c7]'
                        : 'bg-gradient-to-b from-[#f87171] to-[#dc2626]'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (hud.rivalHunters[0].hp / Math.max(1, hud.rivalHunters[0].maxHp)) * 100,
                      ),
                    )}%`,
                  }}
                />
                <div className="hud-meter-ticks absolute inset-0 pointer-events-none" />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-semibold tabular-nums text-[#fecdd3]">
                <span>
                  HP {hud.rivalHunters[0].hp}/{hud.rivalHunters[0].maxHp} · {hud.rivalHunters[0].title}
                </span>
                {hud.rivalHunters[0].stolenValue > 0 ? (
                  <span className="text-[#fde047] font-bold">
                    Stolen: {hud.rivalHunters[0].stolenValue}
                  </span>
                ) : hud.rivalHunters[0].archetype === 'aurora_warlock' ? (
                  <span className="text-[#7dd3fc]">Chills Warmth!</span>
                ) : (
                  <span className="text-[#fca5a5]">Steals on hit!</span>
                )}
              </div>
            </div>
          )}

          {/* Left-Side Activity ChatBox (Classic HUD Mode Only; moved into World & Travel inside 1 Menu in Minimal mode) */}
          {!isMinimalHud && !drawerOpen && (
            <div
              data-testid="activity-chatbox"
              data-collapsed={chatBoxCollapsed ? 'true' : 'false'}
              className="pointer-events-auto w-[236px] sm:w-72 rounded-xl hud-plaque overflow-hidden"
            >
              {/* ChatBox Header */}
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#101c2d]/95 border-b border-[#78a0c8]/25">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7be0ff] shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e2eefb] truncate">
                    Activity &amp; Loot Log
                  </span>
                  <span
                    data-testid="chatbox-count"
                    className="px-1.5 py-0.2 rounded bg-[#0b1320] border border-[#6e8eb0]/40 text-[9px] font-bold tabular-nums text-[#9fe8ff]"
                  >
                    {hud.chatLogs.length}
                  </span>
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="chatbox-toggle"
                  aria-label={chatBoxCollapsed ? 'Expand Activity Log' : 'Minimize Activity Log'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setChatBoxCollapsed((prev) => !prev);
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#1d314a] hover:bg-[#274160] border border-[#6e8eb0]/40 text-[9px] font-bold uppercase tracking-wider text-[#cfe2f5] inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                >
                  <span>{chatBoxCollapsed ? 'Show' : 'Hide'}</span>
                  {chatBoxCollapsed ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </div>

              {!chatBoxCollapsed && (
                <>
                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#111d2e]/90 border-b border-[#6e8eb0]/25">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'loot', label: 'Drops & Loot' },
                        { id: 'combat', label: 'Combat' },
                        { id: 'notification', label: 'Alerts' },
                      ] as const
                    ).map((tab) => {
                      const active = chatFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          tabIndex={-1}
                          data-testid={`chatbox-filter-${tab.id}`}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            setChatFilter(tab.id);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#d98a2b] text-[#131d2b]'
                              : 'bg-[#1a2b42]/80 hover:bg-[#243b59] text-[#a9c1d9]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scrollable Log Feed */}
                  <div
                    data-testid="chatbox-log-list"
                    className="max-h-[96px] sm:max-h-[112px] overflow-y-auto overscroll-contain px-2 py-1.5 space-y-1 text-[10px] leading-snug"
                  >
                    {(() => {
                      const filtered = hud.chatLogs.filter((entry) => {
                        if (chatFilter === 'all') return true;
                        if (chatFilter === 'loot') {
                          return entry.category === 'drop' || entry.category === 'loot';
                        }
                        return entry.category === chatFilter;
                      });
                      const recent = filtered.slice(-14).reverse();
                      if (recent.length === 0) {
                        return (
                          <div className="py-2 text-center text-[10px] text-[#8aa4bf] italic">
                            No {chatFilter === 'all' ? 'activity' : chatFilter} logs yet — harvest, hunt, or open chests!
                          </div>
                        );
                      }
                      return recent.map((entry) => {
                        const badgeCls =
                          entry.category === 'loot'
                            ? 'bg-[#3d2e14] border-[#f6c344]/65 text-[#fde047]'
                            : entry.category === 'drop'
                              ? 'bg-[#153527] border-[#8ed49a]/60 text-[#a7f3d0]'
                              : entry.category === 'combat'
                                ? 'bg-[#3f1318] border-[#f87171]/65 text-[#fecaca]'
                                : 'bg-[#132f45] border-[#7be0ff]/55 text-[#bae6fd]';
                        const badgeLabel =
                          entry.category === 'loot'
                            ? 'LOOT'
                            : entry.category === 'drop'
                              ? 'DROP'
                              : entry.category === 'combat'
                                ? 'BOSS'
                                : 'INFO';
                        const textCls =
                          entry.accent === 'gold'
                            ? 'text-[#fde68a]'
                            : entry.accent === 'purple'
                              ? 'text-[#f5d0fe]'
                              : entry.accent === 'red'
                                ? 'text-[#fecdd3]'
                                : entry.accent === 'green'
                                  ? 'text-[#bbf7d0]'
                                  : entry.accent === 'amber'
                                    ? 'text-[#fed7aa]'
                                    : 'text-[#e2eefb]';
                        return (
                          <div
                            key={entry.id}
                            data-testid="chatbox-entry"
                            data-category={entry.category}
                            className="flex items-start gap-1.5 rounded bg-[#142236]/75 px-1.5 py-0.5 border border-[#6e8eb0]/20"
                          >
                            <span className="text-[9px] font-mono tabular-nums text-[#88a4c0] shrink-0 mt-0.5">
                              {entry.timestamp}
                            </span>
                            <span
                              className={`px-1 py-0.1 rounded border text-[8px] font-extrabold uppercase tracking-wider shrink-0 mt-0.5 ${badgeCls}`}
                            >
                              {badgeLabel}
                            </span>
                            <span className={`font-semibold break-words min-w-0 ${textCls}`}>
                              {entry.text}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Top-Right Compact Zone, Weather, Menu, Pause & Minimap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {isMinimalHud ? (
              <div
                data-testid="zone-status"
                data-difficulty-mult={hud.zone.difficultyMult}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg hud-plaque text-xs font-bold tabular-nums text-[#e2eefb]"
              >
                <Compass className="w-3.5 h-3.5 text-[#7be0ff] shrink-0" />
                <span>
                  {hud.zone.id === 'city' ? 'City' : `L${hud.zone.levelNumber} · ${hud.zone.name}`}
                </span>
                <span className="text-[#6e8eb0]">|</span>
                <WeatherIcon weather={hud.weather} className="w-3.5 h-3.5 shrink-0" />
                <span>{weatherProfile.label}</span>
                <span className="text-[#6e8eb0]">|</span>
                <span className="text-[#f6c344]">Day {hud.dayNight.dayNumber}</span>
              </div>
            ) : (
              <>
                <div
                  data-testid="zone-status"
                  data-difficulty-mult={hud.zone.difficultyMult}
                  className={`hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg ${
                    hud.zone.id === 'city'
                      ? 'hud-plaque-gold'
                      : hud.zone.id === 'level5'
                        ? 'hud-plaque border-[#e879f9]/70'
                        : hud.zone.id === 'level4'
                          ? 'hud-plaque-crimson'
                          : hud.zone.id === 'level3'
                            ? 'hud-plaque border-[#a855f7]/70'
                            : hud.zone.id === 'level2'
                              ? 'hud-plaque-frost'
                              : 'hud-plaque'
                  }`}
                >
                  <Compass
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                      hud.zone.id === 'city'
                        ? 'text-[#f6c344]'
                        : hud.zone.id === 'level5'
                          ? 'text-[#f0abfc]'
                          : hud.zone.id === 'level4'
                            ? 'text-[#fca5a5]'
                            : hud.zone.id === 'level3'
                              ? 'text-[#c084fc]'
                              : hud.zone.id === 'level2'
                                ? 'text-[#7be0ff]'
                                : 'text-[#9db4cb]'
                    }`}
                  />
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span
                        data-testid="zone-indicator-badge"
                        className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9db4cb]"
                      >
                        {hud.zone.id === 'city'
                          ? 'Cavern Sanctuary · Frostcave City'
                          : `Level ${hud.zone.levelNumber} · ${hud.zone.name}`}
                      </span>
                      <span
                        data-testid="zone-difficulty-badge"
                        className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider tabular-nums ${
                          hud.zone.id === 'city'
                            ? 'bg-[#3b2a14] text-[#fde047] border border-[#f6c344]/50'
                            : hud.zone.difficultyMult >= 27
                              ? 'bg-[#450a0a] text-[#fecaca] border border-[#f87171]/60'
                              : hud.zone.difficultyMult >= 9
                                ? 'bg-[#3b0764] text-[#f3e8ff] border border-[#c084fc]/60'
                                : hud.zone.difficultyMult >= 3
                                  ? 'bg-[#0c4a6e] text-[#e0f2fe] border border-[#38bdf8]/60'
                                  : 'bg-[#1e293b] text-[#cbd5e1] border border-[#64748b]/50'
                        }`}
                      >
                        {hud.zone.id === 'city' ? 'Safe Sanctuary' : `${hud.zone.difficultyMult}x Toughness`}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold tabular-nums text-[#dce6f2]">
                      {hud.zone.id === 'city'
                        ? `West Gate ${hud.zone.portalDistance}m ${hud.zone.portalDirection} · Bazaar [T]`
                        : hud.zone.id === 'level1'
                          ? `L2 ${hud.zone.portalDistance}m ${hud.zone.portalDirection} · City ${hud.zone.cityPortalDistance ?? 144}m ${hud.zone.cityPortalDirection ?? 'E'}`
                          : hud.zone.forwardPortalDistance !== undefined
                            ? `Ret ${hud.zone.portalDistance}m ${hud.zone.portalDirection} · Next L${hud.zone.levelNumber + 1} ${hud.zone.forwardPortalDistance}m ${hud.zone.forwardPortalDirection}`
                            : `Return ${hud.zone.portalDistance}m ${hud.zone.portalDirection} · +${Math.round((hud.zone.yieldMult - 1) * 100)}% Yield`}
                    </div>
                  </div>
                </div>

                <div
                  data-testid="day-night-status"
                  className={`hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                    hud.dayNight.phase === 'night'
                      ? 'hud-plaque-frost'
                      : hud.dayNight.phase === 'dusk' || hud.dayNight.phase === 'dawn'
                        ? 'hud-plaque-gold'
                        : 'hud-plaque'
                  }`}
                >
                  {hud.dayNight.phase === 'night' ? (
                    <Moon className="w-4 h-4 shrink-0 text-[#9bc2ff]" />
                  ) : hud.dayNight.phase === 'dawn' ? (
                    <Sunrise className="w-4 h-4 shrink-0 text-[#ffbe85]" />
                  ) : hud.dayNight.phase === 'dusk' ? (
                    <Sunset className="w-4 h-4 shrink-0 text-[#ff9b6e]" />
                  ) : (
                    <Sun className="w-4 h-4 shrink-0 text-[#f6c344]" />
                  )}
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-wider text-[#9db4cb] tabular-nums">
                      {hud.calendar.shortDate} · {hud.calendar.weekdayName} · {hud.dayNight.clockLabel}
                    </div>
                    <div className="text-[11px] font-bold tabular-nums text-[#dce6f2]">
                      {hud.calendar.todayEvent
                        ? `${hud.calendar.todayEvent.title} · ${hud.dayNight.phaseLabel}`
                        : `Chill ${hud.dayNight.tempDecayMult.toFixed(2)}× · ${hud.dayNight.wildlifeActivityLabel}`}
                    </div>
                  </div>
                </div>

                <div
                  data-testid="weather-status"
                  className={`hidden sm:flex items-center gap-2 px-2.5 py-1 sm:py-1.5 rounded-lg ${
                    isBlizzard ? 'hud-plaque-frost' : 'hud-plaque'
                  }`}
                >
                  <WeatherIcon weather={hud.weather} className="w-4 h-4 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">
                      {weatherProfile.label}
                    </div>
                    <div className="text-xs font-bold tabular-nums text-[#dce6f2]">
                      {formatWeatherCountdown(hud.weatherTimeLeft)} · Day {hud.dayNight.dayNumber}
                    </div>
                  </div>
                </div>

                {hud.housing.inCabin ? (
                  <div
                    data-testid="cabin-interior-badge"
                    className="flex items-center gap-2 px-2.5 py-1 sm:py-1.5 rounded-lg hud-plaque-gold border border-[#fbbf24]/65"
                  >
                    <Home className="w-4 h-4 shrink-0 text-[#fbbf24]" />
                    <div className="leading-tight">
                      <div className="text-[10px] uppercase tracking-wider text-[#fde68a]">
                        {hud.housing.cabinTitle} · Warm Hearth
                      </div>
                      <div className="text-xs font-bold tabular-nums text-[#fffbeb]">
                        Tier {hud.housing.cabinTier}/5 · Safe Indoors
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hidden 2xl:flex flex-col items-end px-2.5 py-1.5 rounded-lg hud-plaque">
                    <div className="text-[10px] uppercase tracking-wider text-[#9db4cb]">
                      {cabinSpec.name}
                    </div>
                    <div className="text-xs font-bold tabular-nums text-[#f6c344]">
                      Tier {hud.levels.cabin}/5 · {hud.workerCount} Workers
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              tabIndex={-1}
              data-testid="top-menu-btn"
              aria-label="Open Game Menu"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleDrawer();
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                drawerOpen ? 'hud-keycap-active' : 'hud-keycap text-[#f4efe6]'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hud-keycap text-[#f4efe6] flex items-center justify-center cursor-pointer transition-colors"
            >
              {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-testid="pause-button"
              aria-label="Pause Game"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hud-keycap text-[#f4efe6] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {!drawerOpen && (
            <div className="flex flex-col items-end gap-1.5">
              {!isMinimalHud && (
                <>
                  {/* 6-Zone Expedition Selector Bar (Classic HUD Mode Only) */}
                  <div
                    data-testid="zone-travel-bar"
                    className="pointer-events-auto hidden sm:flex flex-wrap items-center justify-end gap-1 rounded-lg hud-plaque px-1.5 py-1"
                  >
                    {(
                      [
                        { id: 'level1' as ZoneId, label: 'L1 · 1x', title: 'Level 1: Frostwood Valley (1x Difficulty)' },
                        { id: 'level2' as ZoneId, label: 'L2 · 3x', title: 'Level 2: Glacial Highlands (3x Difficulty)' },
                        { id: 'level3' as ZoneId, label: 'L3 · 9x', title: 'Level 3: Rimefang Abyss (9x Difficulty)' },
                        { id: 'level4' as ZoneId, label: 'L4 · 27x', title: 'Level 4: Obsidian Permafrost (27x Difficulty)' },
                        { id: 'level5' as ZoneId, label: 'L5 · 81x', title: 'Level 5: Starfall Eternal Zero (81x Difficulty)' },
                        { id: 'city' as ZoneId, label: 'City', title: 'Frostcave City: Cavern Sanctuary' },
                      ]
                    ).map((item) => {
                      const active = hud.zone.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          tabIndex={-1}
                          data-testid={`zone-travel-${item.id}`}
                          title={item.title}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            if (!active) onSelectZone(item.id);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-tight tabular-nums cursor-pointer transition-colors ${
                            active
                              ? item.id === 'city'
                                ? 'hud-keycap-active'
                                : 'bg-gradient-to-b from-[#1f5c82] to-[#133b56] text-[#e0faff] border border-[#7be0ff]'
                              : 'hud-keycap text-[#b8cbe0]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="zone-travel-lake"
                      title="Teleport to Crystal Lagoon Fishing Pier (Level 1)"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onTravelToFishingLake();
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-tight tabular-nums cursor-pointer transition-colors inline-flex items-center gap-1 ${
                        hud.fishing.nearLake
                          ? 'bg-gradient-to-b from-[#0ea5e9] to-[#0369a1] text-[#f0f9ff] border border-[#7dd3fc]'
                          : 'bg-gradient-to-b from-[#133b56] to-[#0c2638] text-[#7be0ff] border border-[#38bdf8]/65 hover:brightness-110'
                      }`}
                    >
                      <Fish className="w-2.5 h-2.5" />
                      <span>Lake</span>
                    </button>
                  </div>

                  {/* Zone-Specific Weather Status Effect Plaque (Classic HUD Mode Only) */}
                  {(() => {
                    const zw = hud.zoneWeatherEffect;
                    const moveDeltaPct = Math.round((zw.effectiveMoveSpeedMult - 1) * 100);
                    const gatherDeltaPct = Math.round((zw.effectiveGatherEfficiencyMult - 1) * 100);
                    const moveStr =
                      moveDeltaPct > 0
                        ? `+${moveDeltaPct}% Move`
                        : moveDeltaPct < 0
                          ? `${moveDeltaPct}% Move`
                          : '100% Move';
                    const gatherStr =
                      gatherDeltaPct > 0
                        ? `+${gatherDeltaPct}% Harvest`
                        : gatherDeltaPct < 0
                          ? `${gatherDeltaPct}% Harvest`
                          : '100% Harvest';
                    const borderCls = zw.mitigated
                      ? 'hud-plaque-frost border-l-[3px] border-l-[#8ed49a]'
                      : zw.severity === 'extreme' || zw.severity === 'severe'
                        ? 'hud-plaque-crimson border-l-[3px] border-l-[#f87171]'
                        : 'hud-plaque-gold border-l-[3px] border-l-[#f6c344]';
                    return (
                      <div
                        data-testid="zone-weather-effect-status"
                        data-effect-id={zw.id}
                        data-severity={zw.severity}
                        data-mitigated={zw.mitigated ? 'true' : 'false'}
                        className={`pointer-events-auto hidden sm:block w-60 sm:w-72 rounded-lg px-2.5 py-1.5 ${borderCls}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] sm:text-[11px] font-bold text-[#f4efe6] truncate">
                            {zw.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                              zw.mitigated
                                ? 'bg-[#163d2b] text-[#8ed49a] border border-[#8ed49a]/50'
                                : zw.severity === 'extreme' || zw.severity === 'severe'
                                  ? 'bg-[#451218] text-[#fca5a5] border border-[#f87171]/60'
                                  : 'bg-[#3b2a14] text-[#fde047] border border-[#f6c344]/55'
                            }`}
                          >
                            {zw.mitigated ? 'Mitigated' : `${zw.severity} Hazard`}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-bold tabular-nums">
                          <span
                            data-testid="zone-weather-move-impact"
                            className={
                              moveDeltaPct < 0
                                ? 'text-[#fca5a5]'
                                : moveDeltaPct > 0
                                  ? 'text-[#8ed49a]'
                                  : 'text-[#dce6f2]'
                            }
                          >
                            {moveStr}
                          </span>
                          <span
                            data-testid="zone-weather-gather-impact"
                            className={
                              gatherDeltaPct < 0
                                ? 'text-[#fdba74]'
                                : gatherDeltaPct > 0
                                  ? 'text-[#8ed49a]'
                                  : 'text-[#dce6f2]'
                            }
                          >
                            {gatherStr}
                          </span>
                          <span className="text-[9px] text-[#9db4cb]">
                            W:{zw.windResistancePct}/{zw.requiredWindResistancePct}% · H:{zw.heatRetentionPct}/{zw.requiredHeatRetentionPct}%
                          </span>
                        </div>

                        {!zw.mitigated && (
                          <div className="mt-1 flex items-center justify-between gap-1.5 pt-1 border-t border-[#6e8eb0]/25">
                            <span className="text-[9px] text-[#cbd5e1] truncate">
                              {zw.infrastructureHint}
                            </span>
                            <button
                              type="button"
                              tabIndex={-1}
                              data-testid="zone-weather-build-infra-btn"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onOpenTab('camp');
                              }}
                              className="px-1.5 py-0.5 rounded bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] text-[9px] font-extrabold uppercase tracking-wider shrink-0 cursor-pointer"
                            >
                              Build [U]
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {hud.settings.showMinimap && (
                <MinimapOverlay
                  zone={hud.zone}
                  wildlifeBlips={hud.wildlifeBlips}
                  hunterBlips={hud.hunterBlips}
                  chestBlips={hud.chestBlips}
                  bossBlip={hud.bossBlip}
                  sightActive={hud.huntersSight.active}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zone Boss Encounter Plaque (Top-Center, non-overlapping on Desktop & Mobile) */}
      {!drawerOpen && hud.bossNear && (
        <div
          data-testid="zone-boss-hud"
          data-boss-id={hud.bossNear.id}
          data-phase={hud.bossNear.phase}
          className={`pointer-events-none mx-auto mt-1.5 w-full max-w-[460px] lg:fixed lg:top-[68px] lg:left-1/2 lg:-translate-x-1/2 lg:mt-0 lg:w-[610px] rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 border-l-[3px] ${
            hud.bossNear.state === 'ko'
              ? 'hud-plaque border-l-[#64748b]'
              : hud.bossNear.enraged
                ? 'hud-plaque-crimson border-l-[#ef4444]'
                : hud.bossNear.zone === 'level2'
                  ? 'hud-plaque-frost border-l-[#38bdf8]'
                  : hud.bossNear.zone === 'city'
                    ? 'hud-plaque-gold border-l-[#f97316]'
                    : 'hud-plaque-gold border-l-[#f59e0b]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider truncate min-w-0 ${
                hud.bossNear.state === 'ko'
                  ? 'text-[#94a3b8]'
                  : hud.bossNear.enraged
                    ? 'text-[#fca5a5]'
                    : hud.bossNear.zone === 'level2'
                      ? 'text-[#7dd3fc]'
                      : 'text-[#fbbf24]'
              }`}
            >
              <Skull className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {hud.bossNear.state === 'ko'
                  ? 'Boss Defeated'
                  : hud.bossNear.enraged
                    ? 'Phase II · Enraged'
                    : `Phase I · ${hud.bossNear.title}`}
              </span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {hud.bossNear.tacticLabel && (
                <span
                  data-testid="zone-boss-tactic"
                  className="px-1.5 py-0.5 rounded bg-[#152234]/95 border border-[#7be0ff]/55 text-[9px] font-extrabold uppercase tracking-wider text-[#bae6fd] max-w-[148px] truncate"
                >
                  {hud.bossNear.tacticLabel}
                </span>
              )}
              <span className="text-[11px] font-bold tabular-nums text-[#e2e8f0] shrink-0">
                {hud.bossNear.distance}m {hud.bossNear.direction}
              </span>
            </div>
          </div>

          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#fffbeb] truncate">
              {hud.bossNear.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                data-testid="boss-loot-scale-badge"
                className="px-1.5 py-0.5 rounded bg-[#0c1420]/90 border border-[#f6c344]/55 text-[9px] font-bold uppercase tracking-wider text-[#fde68a] tabular-nums"
              >
                Spoils x{hud.lootScaling.resourceMultiplier.toFixed(2)} · Gear Lv{' '}
                {hud.lootScaling.effectiveGearLevel.toFixed(1)}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-[#f8fafc]">
                {hud.bossNear.state === 'ko'
                  ? `Respawn ${hud.bossNear.respawnSeconds}s`
                  : `${hud.bossNear.hp}/${hud.bossNear.maxHp} HP`}
              </span>
            </div>
          </div>

          <div className="hud-meter-track mt-1 h-2.5 rounded-sm overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#fef3c7]/55 transition-[width] duration-700 ease-out pointer-events-none"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (hud.bossNear.hp / Math.max(1, hud.bossNear.maxHp)) * 100,
                  ),
                )}%`,
              }}
            />
            <div
              className={`relative z-[1] h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[width] duration-150 ${
                hud.bossNear.state === 'ko'
                  ? 'bg-[#64748b]'
                  : hud.bossNear.enraged
                    ? 'bg-gradient-to-b from-[#f87171] to-[#b91c1c]'
                    : hud.bossNear.zone === 'level2'
                      ? 'bg-gradient-to-b from-[#7dd3fc] to-[#0284c7]'
                      : 'bg-gradient-to-b from-[#fbbf24] to-[#b45309]'
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (hud.bossNear.hp / Math.max(1, hud.bossNear.maxHp)) * 100,
                  ),
                )}%`,
              }}
            />
            <div className="hud-meter-ticks absolute inset-0 z-[2] pointer-events-none" />
          </div>

          {hud.bossNear.telegraphLabel && (
            <div
              data-testid="zone-boss-telegraph"
              className="mt-1 rounded-md bg-[#3f1116]/95 border border-[#f97316]/85 px-2 py-0.5 sm:py-1"
            >
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#fed7aa]">
                <span>Incoming Attack: {hud.bossNear.telegraphLabel}</span>
                <span className="tabular-nums">
                  {Math.round(hud.bossNear.telegraphProgress * 100)}%
                </span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-[#1a080a] overflow-hidden">
                <div
                  className="h-full bg-[#f97316]"
                  style={{ width: `${Math.round(hud.bossNear.telegraphProgress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Transient Context / Toast Notice & Portal / Trader / Track Trigger */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-end gap-2 mt-2">
        {!drawerOpen && hud.activeTool === 'bow' && hud.bowLockedTarget && (
          <div
            data-testid="bow-locked-target-badge"
            className="hud-plaque px-3 py-1 rounded-lg border border-[#f59e0b]/75 bg-[#152236]/95 flex items-center gap-2.5 text-[11px] font-bold text-[#fde68a] shadow-[0_6px_16px_rgba(8,14,24,0.65)]"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
            <span className="truncate max-w-[160px] sm:max-w-[240px]">
              {hud.bowLockedTarget.label}
            </span>
            <span className="text-[#93c5fd] tabular-nums">
              {hud.bowLockedTarget.distance.toFixed(1)}m
            </span>
            <span className="text-[#fca5a5] tabular-nums">
              {Math.ceil(hud.bowLockedTarget.hp)}/{Math.ceil(hud.bowLockedTarget.maxHp)} HP
            </span>
            {hud.bowAutoAttack && (
              <span className="px-1.5 py-0.5 rounded bg-[#92400e]/85 border border-[#fbbf24]/60 text-[9px] uppercase tracking-wider text-[#fef3c7]">
                Auto-Fire
              </span>
            )}
          </div>
        )}
        {!drawerOpen &&
          (hud.toastText || hud.contextHint) &&
          !(
            !hud.housing.inCabin &&
            (hud.fishing.nearLake || hud.activeTool === 'rod' || hud.fishing.phase !== 'idle')
          ) && (
          <div className="hud-plaque-gold px-3.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold text-[#f4efe6] text-center max-w-[92vw] sm:max-w-[680px]">
            {hud.toastText ?? hud.contextHint}
          </div>
        )}
        {!drawerOpen &&
          (hud.zone.nearPortal || hud.zone.nearForwardPortal || hud.zone.nearCityPortal) && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="use-portal-button"
            onClick={(e) => {
              e.currentTarget.blur();
              onUsePortal();
            }}
            className={`pointer-events-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide cursor-pointer transition-colors ${
              hud.zone.nearCityPortal
                ? 'hud-plaque-gold hover:brightness-110 text-[#ffe8a3]'
                : hud.zone.nearForwardPortal || hud.zone.id === 'level1'
                  ? 'hud-plaque-frost hover:brightness-110 text-[#c9f4ff]'
                  : 'hud-plaque-gold hover:brightness-110 text-[#ffe8a3]'
            }`}
          >
            {hud.zone.nearCityPortal
              ? 'Enter Frostcave City · Merchant Cavern [E]'
              : hud.zone.nearForwardPortal && hud.zone.forwardZoneName
                ? `Enter ${hud.zone.forwardZoneName} [E]`
                : hud.zone.id === 'level1'
                  ? 'Enter Level 2 · Glacial Highlands [E]'
                  : `Return to ${hud.zone.returnZoneName ?? 'Previous Zone'} [E]`}
          </button>
        )}
        {!drawerOpen &&
          !hud.zone.nearPortal &&
          !hud.zone.nearForwardPortal &&
          !hud.zone.nearCityPortal &&
          hud.nearCityQuestNpc && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="claim-daily-quest-prompt"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenTab('city');
            }}
            className="pointer-events-auto px-4 py-2 rounded-lg border border-[#fb923c]/90 bg-[#3b180c]/95 hover:bg-[#522211] text-xs sm:text-sm font-bold tracking-wide text-[#ffedd5] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(24,8,4,0.65)] inline-flex items-center gap-2"
          >
            <Flame className="w-4 h-4 text-[#fb923c]" />
            Speak with {CITY_QUEST_NPC.name} · Daily Quest &amp; Wings of Fire [E]
          </button>
        )}
        {!drawerOpen &&
          !hud.zone.nearPortal &&
          !hud.zone.nearForwardPortal &&
          !hud.zone.nearCityPortal &&
          !hud.nearCityQuestNpc &&
          hud.nearCityTrader && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="open-trader-button"
            onClick={(e) => {
              e.currentTarget.blur();
              setCityTraderFilter(hud.nearCityTrader!);
              onOpenTab('city');
            }}
            className="pointer-events-auto px-4 py-2 rounded-lg border border-[#f6c344]/85 bg-[#2d2111]/95 hover:bg-[#413018] text-xs sm:text-sm font-bold tracking-wide text-[#ffe8a3] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,14,24,0.6)] inline-flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#f6c344]" />
            Trade with {CITY_TRADERS[hud.nearCityTrader].name} ({CITY_TRADERS[hud.nearCityTrader].title}) [E]
          </button>
        )}
        {!drawerOpen &&
          !hud.zone.nearPortal &&
          !hud.zone.nearCityPortal &&
          !hud.nearCityTrader &&
          hud.nearestCityNpcName && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="talk-npc-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTouchInteract();
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#7be0ff]/80 bg-[#11334a]/95 hover:bg-[#194766] text-xs sm:text-sm font-bold tracking-wide text-[#c9f4ff] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,14,24,0.6)] inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#7be0ff]" />
              Talk to {hud.nearestCityNpcName} [E]
            </button>
          )}
        {!drawerOpen && !hud.zone.nearPortal && !hud.zone.nearCityPortal && hud.secretChestNear && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="open-secret-chest-button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSecretChest();
            }}
            className="pointer-events-auto px-4 py-2 rounded-lg border border-[#f6c344]/90 bg-[#33220f]/95 hover:bg-[#4a3216] text-xs sm:text-sm font-bold tracking-wide text-[#fef08a] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(24,14,4,0.65)] inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#f6c344]" />
            <span>
              Open {hud.secretChestNear.label} [E] ({hud.secretChestNear.distance}m)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1d1308]/90 border border-[#f6c344]/50 text-[10px] font-extrabold text-[#fde047] tabular-nums">
              x{hud.lootScaling.resourceMultiplier.toFixed(2)} Loot · Gear Lv{' '}
              {hud.lootScaling.effectiveGearLevel.toFixed(1)}
            </span>
          </button>
        )}
        {!drawerOpen && !hud.zone.nearPortal && !hud.zone.nearCityPortal && !hud.secretChestNear && hud.nearbyTrack && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="inspect-track-button"
            onClick={(e) => {
              e.currentTarget.blur();
              onInspectTrack();
            }}
            className="pointer-events-auto px-4 py-2 rounded-lg border border-[#7be0ff]/80 bg-[#11334a]/95 hover:bg-[#194766] text-xs sm:text-sm font-bold tracking-wide text-[#c9f4ff] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,14,24,0.6)]"
          >
            Inspect {hud.nearbyTrack.label} Tracks [E] ({hud.nearbyTrack.freshnessPct}% Fresh)
          </button>
        )}
        {!drawerOpen && !hud.zone.nearPortal && !hud.zone.nearCityPortal && hud.pets.nearbyWildPet && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="feed-wild-pet-button"
            onClick={(e) => {
              e.currentTarget.blur();
              onFeedWildPet();
            }}
            className="pointer-events-auto px-4 py-2 rounded-lg border border-[#f9a8d4]/85 bg-[#2d172c]/95 hover:bg-[#41213f] text-xs sm:text-sm font-bold tracking-wide text-[#fce7f3] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(24,8,20,0.65)] inline-flex items-center gap-2 tabular-nums"
          >
            <PawPrint className="w-4 h-4 text-[#f472b6]" />
            Feed &amp; Tame {hud.pets.nearbyWildPet.speciesLabel} [H] · {Math.round(hud.pets.nearbyWildPet.progress)}%
            <span className="px-1.5 py-0.5 rounded bg-[#1d0f1d]/80 text-[10px] text-[#fbcfe8]">
              {(hud.resources.meat ?? 0) >= hud.pets.nearbyWildPet.feedMeatCost
                ? `${hud.pets.nearbyWildPet.feedMeatCost} Meat`
                : `${hud.pets.nearbyWildPet.feedGoldFallback}g Treat`}
            </span>
          </button>
        )}
        {!drawerOpen &&
          !hud.zone.nearPortal &&
          !hud.zone.nearCityPortal &&
          !hud.secretChestNear &&
          !hud.nearbyTrack &&
          !hud.nearCraftingStation &&
          hud.pets.nearPen && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="open-pen-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenTab('pets');
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#8ed49a]/80 bg-[#142c22]/95 hover:bg-[#1b3c2e] text-xs sm:text-sm font-bold tracking-wide text-[#bbf7d0] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,24,16,0.6)] inline-flex items-center gap-2"
            >
              <PawPrint className="w-4 h-4 text-[#8ed49a]" />
              Open Taming Pen &amp; Companions [J]
            </button>
          )}
        {!drawerOpen &&
          !hud.housing.inCabin &&
          !hud.zone.nearPortal &&
          !hud.zone.nearForwardPortal &&
          !hud.zone.nearCityPortal &&
          !hud.secretChestNear &&
          !hud.nearbyTrack &&
          hud.housing.nearCabinDoor && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="enter-cabin-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onEnterCabin();
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#fbbf24]/90 bg-[#32210e]/95 hover:bg-[#493014] text-xs sm:text-sm font-bold tracking-wide text-[#fef3c7] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(24,14,4,0.68)] inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4 text-[#fbbf24]" />
              Enter {hud.housing.cabinTitle} · Sleep &amp; Hearth [E]
            </button>
          )}
        {!drawerOpen &&
          hud.housing.inCabin &&
          !hud.housing.isSleeping &&
          hud.housing.nearBed && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="sleep-bed-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onSleepInCabin();
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#fbbf24]/95 bg-[#33220f]/95 hover:bg-[#4a3216] text-xs sm:text-sm font-bold tracking-wide text-[#fef08a] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(24,14,4,0.72)] inline-flex items-center gap-2"
            >
              <BedDouble className="w-4 h-4 text-[#fbbf24]" />
              Sleep in {hud.housing.bedName} · Skip to Day {hud.dayNight.dayNumber + 1} [E]
            </button>
          )}
        {!drawerOpen &&
          hud.housing.inCabin &&
          !hud.housing.isSleeping &&
          hud.housing.nearInteriorDoor &&
          !hud.housing.nearBed && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="exit-cabin-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onExitCabin();
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#7be0ff]/85 bg-[#123249]/95 hover:bg-[#1a4869] text-xs sm:text-sm font-bold tracking-wide text-[#d4f6ff] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,14,24,0.68)] inline-flex items-center gap-2"
            >
              <DoorOpen className="w-4 h-4 text-[#7be0ff]" />
              Exit {hud.housing.cabinTitle} Outside [E]
            </button>
          )}
        {!drawerOpen &&
          !hud.zone.nearPortal &&
          !hud.zone.nearCityPortal &&
          !hud.secretChestNear &&
          !hud.nearbyTrack &&
          !hud.housing.nearCabinDoor &&
          hud.nearCraftingStation && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="open-station-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenTab('craft');
              }}
              className="pointer-events-auto px-4 py-2 rounded-lg border border-[#f6c344]/80 bg-[#2d2111]/95 hover:bg-[#413018] text-xs sm:text-sm font-bold tracking-wide text-[#ffe8a3] cursor-pointer transition-colors shadow-[0_6px_18px_rgba(8,14,24,0.6)] inline-flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-[#f6c344]" />
              Open Crafting Station Workbench [E]
            </button>
          )}

        {/* Crystal Lagoon · Fishing & Hooking HUD Panel */}
        {!drawerOpen &&
          !hud.housing.inCabin &&
          (hud.fishing.nearLake || hud.activeTool === 'rod' || hud.fishing.phase !== 'idle') && (
            <div
              data-testid="fishing-hud-panel"
              data-fishing-phase={hud.fishing.phase}
              className="pointer-events-auto w-full max-w-[530px] rounded-xl hud-plaque-frost border-2 border-[#38bdf8]/80 bg-[#0c1d2e]/95 px-3 py-1.5 shadow-[0_10px_28px_rgba(4,12,24,0.82)] flex flex-col gap-1.5"
            >
              {/* Header: Sanctuary Title, Total Caught & Ice Thickness Badge */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#38bdf8]/25 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Fish className="w-4 h-4 text-[#38bdf8] shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#e0f2fe]">
                    Crystal Lagoon Fishing
                  </span>
                  <span
                    data-testid="fishing-phase-badge"
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                      hud.fishing.phase === 'bite'
                        ? 'bg-[#f59e0b] text-[#111827] animate-pulse'
                        : hud.fishing.phase === 'hooking'
                          ? 'bg-[#0284c7] text-[#e0f2fe] border border-[#7dd3fc]'
                          : hud.fishing.phase === 'caught'
                            ? 'bg-[#059669] text-[#ecfdf5]'
                            : 'bg-[#152c44] text-[#93c5fd] border border-[#38bdf8]/40'
                    }`}
                  >
                    {hud.fishing.phase === 'idle'
                      ? hud.fishing.nearLake
                        ? 'Shore Ready'
                        : `${hud.fishing.distanceToLake}m ${hud.fishing.directionToLake}`
                      : hud.fishing.phase}
                  </span>
                  {hud.fishing.inSafeZone && (
                    <span
                      data-testid="fishing-safe-zone-badge"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#064e3b] border border-[#34d399]/70 text-[9px] font-extrabold uppercase tracking-wider text-[#a7f3d0]"
                    >
                      <Shield className="w-2.5 h-2.5 text-[#34d399]" />
                      Safe Sanctuary · No Hostiles
                    </span>
                  )}
                  {hud.fishing.isSwimming && (
                    <span
                      data-testid="fishing-swimming-badge"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0284c7] border border-[#7dd3fc] text-[9px] font-extrabold uppercase tracking-wider text-[#f0f9ff]"
                    >
                      Swimming in Lagoon
                    </span>
                  )}
                  <span
                    data-testid="fishing-ice-thickness-badge"
                    title={hud.fishing.iceThicknessLabel}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wider tabular-nums ${
                      hud.fishing.iceThicknessStage === 'thick_glacial'
                        ? 'bg-[#0c4a6e] border-[#7dd3fc] text-[#e0f2fe]'
                        : hud.fishing.iceThicknessStage === 'frosted_firm'
                          ? 'bg-[#164e63] border-[#67e8f9] text-[#cffafe]'
                          : hud.fishing.iceThicknessStage === 'cracked_thin'
                            ? 'bg-[#451a03] border-[#fbbf24]/80 text-[#fef3c7]'
                            : 'bg-[#082f49] border-[#38bdf8]/60 text-[#bae6fd]'
                    }`}
                  >
                    Ice: {hud.fishing.iceThicknessCm}cm ·{' '}
                    {hud.fishing.iceThicknessStage === 'thick_glacial'
                      ? 'Solid Glacial'
                      : hud.fishing.iceThicknessStage === 'frosted_firm'
                        ? 'Firm Frosted'
                        : hud.fishing.iceThicknessStage === 'cracked_thin'
                          ? 'Cracked Thin'
                          : 'Thin Rim'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
                  <span
                    data-testid="fishing-total-caught"
                    className="px-1.5 py-0.5 rounded bg-[#10253a] border border-[#38bdf8]/35 text-[#bae6fd]"
                  >
                    Caught: {hud.fishing.totalCaught}
                  </span>
                  {!hud.fishing.nearLake && (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="fishing-panel-travel-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onTravelToFishingLake();
                      }}
                      className="px-2 py-0.5 rounded bg-gradient-to-b from-[#0284c7] to-[#0369a1] hover:brightness-110 border border-[#7dd3fc] text-[#f0f9ff] cursor-pointer"
                    >
                      Go to Pier
                    </button>
                  )}
                </div>
              </div>

              {/* Nearby Fish Rarity Distribution Strip (shown while actively fishing) */}
              {hud.fishing.phase !== 'idle' && (
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                  <span className="font-semibold uppercase tracking-wider text-[#9db4cb]">
                    Lagoon School Rarities:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(['common', 'uncommon', 'rare', 'epic', 'mythic'] as ItemRarity[]).map((r) => {
                      const present = hud.fishing.nearbyFishRarities.includes(r);
                      return (
                        <span
                          key={r}
                          className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase tracking-wider ${
                            present ? rarityBadgeStyle(r) : 'bg-[#101c2b] border-[#334155]/40 text-[#64748b]'
                          }`}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Phase Content: Hooking Tension Mini-Game vs Bite Alert vs Cast Controls */}
              {hud.fishing.phase === 'hooking' && hud.fishing.targetFishName && hud.fishing.targetFishRarity ? (
                <div
                  data-testid="fishing-hooking-minigame"
                  className="flex flex-col gap-2 rounded-lg bg-[#081523] border border-[#38bdf8]/50 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        data-testid="hooked-fish-rarity"
                        className={`px-1.5 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${rarityBadgeStyle(
                          hud.fishing.targetFishRarity,
                        )}`}
                      >
                        {hud.fishing.targetFishRarity}
                      </span>
                      <span
                        data-testid="hooked-fish-name"
                        className="text-xs font-extrabold text-[#f8fafc] truncate"
                      >
                        {hud.fishing.targetFishName} ({hud.fishing.targetFishWeightKg} kg)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold tabular-nums text-[#fde68a] shrink-0">
                      {hud.fishing.isInSweetSpot ? 'REELING IN!' : 'Align Sweet-Spot!'}
                    </span>
                  </div>

                  {/* Interactive Hooking Sweet-Spot & Fish Marker Track */}
                  <div
                    data-testid="fishing-tension-bar"
                    className="relative h-6 w-full rounded-md bg-[#050d17] border border-[#475569] overflow-hidden select-none"
                  >
                    {/* Sweet-Spot Capture Window */}
                    <div
                      data-testid="fishing-sweet-spot"
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-[#10b981]/55 via-[#38bdf8]/65 to-[#10b981]/55 border-x-2 border-[#6ee7b7] transition-[left] duration-75"
                      style={{
                        left: `${Math.max(
                          0,
                          Math.min(
                            100 - hud.fishing.sweetSpotWidth,
                            hud.fishing.hookBarPos - hud.fishing.sweetSpotWidth / 2,
                          ),
                        )}%`,
                        width: `${hud.fishing.sweetSpotWidth}%`,
                      }}
                    />

                    {/* Hooked Fish Position Marker */}
                    <div
                      data-testid="fishing-fish-marker"
                      className="absolute top-0.5 bottom-0.5 w-5 -ml-2.5 rounded bg-[#f59e0b] border border-[#fef08a] shadow-[0_0_10px_rgba(251,191,36,0.9)] flex items-center justify-center transition-[left] duration-75"
                      style={{
                        left: `${Math.max(3, Math.min(97, hud.fishing.fishBarPos))}%`,
                      }}
                    >
                      <Fish className="w-3 h-3 text-[#0f172a]" />
                    </div>
                  </div>

                  {/* Dual Meters: Catch Progress & Line Tension */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tabular-nums">
                    <div>
                      <div className="flex justify-between text-[#a7f3d0] mb-0.5">
                        <span>HOOK PROGRESS</span>
                        <span data-testid="fishing-catch-progress">
                          {Math.round(hud.fishing.catchProgress)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-sm bg-[#0f172a] overflow-hidden border border-[#10b981]/40">
                        <div
                          className="h-full bg-gradient-to-r from-[#10b981] to-[#38bdf8] transition-[width] duration-75"
                          style={{
                            width: `${Math.max(0, Math.min(100, hud.fishing.catchProgress))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#fde68a] mb-0.5">
                        <span>LINE TENSION</span>
                        <span data-testid="fishing-line-tension">
                          {Math.round(hud.fishing.lineTension)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-sm bg-[#0f172a] overflow-hidden border border-[#f59e0b]/40">
                        <div
                          className={`h-full transition-[width] duration-75 ${
                            hud.fishing.lineTension > 75
                              ? 'bg-gradient-to-r from-[#f97316] to-[#ef4444]'
                              : 'bg-gradient-to-r from-[#38bdf8] to-[#fbbf24]'
                          }`}
                          style={{
                            width: `${Math.max(0, Math.min(100, hud.fishing.lineTension))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hold-to-Reel Interactive Button */}
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="fishing-reel-button"
                    onPointerDown={() => onSetFishingReel(true)}
                    onPointerUp={() => onSetFishingReel(false)}
                    onPointerLeave={() => onSetFishingReel(false)}
                    onPointerCancel={() => onSetFishingReel(false)}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onCastOrHookFish();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] active:from-[#38bdf8] active:to-[#0ea5e9] border border-[#bae6fd] text-xs font-extrabold uppercase tracking-wider text-[#f8fafc] cursor-pointer select-none shadow-[0_4px_12px_rgba(2,132,199,0.5)]"
                  >
                    Hold to Reel Line Right [Hold Space / Mouse / E]
                  </button>
                </div>
              ) : hud.fishing.phase === 'bite' ? (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="fishing-hook-button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onCastOrHookFish();
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-gradient-to-b from-[#fbbf24] to-[#d97706] hover:brightness-110 border-2 border-[#fef08a] text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#111827] cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.65)] flex items-center justify-center gap-2"
                  >
                    <Fish className="w-4 h-4 text-[#111827]" />
                    <span>
                      BITE ALERT! Strike &amp; Hook {(hud.fishing.targetFishRarity ?? 'rare').toUpperCase()} Fish [E / Space]
                    </span>
                  </button>
                </div>
              ) : hud.fishing.phase === 'casting' || hud.fishing.phase === 'waiting' ? (
                <div className="flex items-center justify-between gap-2 bg-[#091828] border border-[#38bdf8]/35 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] animate-ping shrink-0" />
                    <span className="text-xs font-semibold text-[#e0f2fe] truncate">
                      {hud.fishing.phase === 'casting'
                        ? 'Casting Glacial Line into Crystal Lagoon...'
                        : 'Bobber floating on the water ripples... wait for a bite!'}
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="fishing-cancel-button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onCastOrHookFish();
                    }}
                    className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#64748b]/60 text-[11px] font-bold text-[#e2e8f0] shrink-0 cursor-pointer"
                  >
                    Reel In [E]
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {hud.fishing.lastCatch && (
                    <div
                      data-testid="fishing-last-catch"
                      className="flex items-center justify-between gap-2 px-2.5 py-1 rounded bg-[#091828] border border-[#38bdf8]/35 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[#9db4cb] font-semibold shrink-0">Last Catch:</span>
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase shrink-0 ${rarityBadgeStyle(
                            hud.fishing.lastCatch.rarity,
                          )}`}
                        >
                          {hud.fishing.lastCatch.rarity}
                        </span>
                        <span className="font-bold text-[#f0f9ff] truncate">
                          {hud.fishing.lastCatch.name} ({hud.fishing.lastCatch.weightKg} kg)
                        </span>
                      </div>
                      <span className="font-bold text-[#fde68a] tabular-nums shrink-0">
                        +{hud.fishing.lastCatch.gold}g · +{hud.fishing.lastCatch.meat} Meat · +{hud.fishing.lastCatch.ice} Ice
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#bae6fd] truncate">
                      {hud.fishing.nearLake
                        ? 'Crystal Lagoon Pier — Cast line for Common to Mythic fish!'
                        : `Crystal Lagoon is ${hud.fishing.distanceToLake}m ${hud.fishing.directionToLake} of you`}
                    </span>
                    {hud.fishing.nearLake ? (
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="fishing-cast-button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onCastOrHookFish();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-[#0ea5e9] to-[#0369a1] hover:brightness-110 border border-[#7dd3fc] text-xs font-extrabold uppercase tracking-wider text-[#f0f9ff] shrink-0 cursor-pointer inline-flex items-center gap-1.5 shadow-[0_4px_14px_rgba(2,132,199,0.45)]"
                      >
                        <Fish className="w-3.5 h-3.5" />
                        <span>Cast Line [E]</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="fishing-cast-button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onTravelToFishingLake();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-[#0284c7] to-[#0369a1] hover:brightness-110 border border-[#7dd3fc] text-xs font-extrabold uppercase tracking-wider text-[#f0f9ff] shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Fish className="w-3.5 h-3.5" />
                        <span>Teleport to Lake</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Unified Single Command Menu Hub */}
        {drawerOpen && (
          <div
            data-testid="upgrade-craft-drawer"
            className="pointer-events-auto w-full max-w-[1120px] min-h-0 max-h-[min(84vh,610px)] flex flex-col rounded-2xl bg-[#0f1b2c]/96 border border-[#7fa4c8]/45 shadow-[0_20px_48px_rgba(6,10,18,0.85)] overflow-hidden"
          >
            {/* Unified Menu Header Bar */}
            <div className="px-4 py-3 bg-[#132236] border-b border-[#6e8eb0]/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Menu className="w-4 h-4 text-[#f6c344] shrink-0" />
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-sm uppercase tracking-wider text-[#f4efe6] truncate">
                    Frostwood Menu
                  </div>
                  <div className="text-[11px] text-[#9db4cb] truncate tabular-nums">
                    {hud.zone.name} · Day {hud.dayNight.dayNumber} ({hud.dayNight.clockLabel}) · {weatherProfile.label}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {meatCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onSellMeat()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#991b1b] hover:bg-[#b91c1c] text-xs font-bold tabular-nums text-[#ffe4e6] cursor-pointer transition-colors"
                  >
                    Sell Meat (+{allMeatGold}g)
                  </button>
                )}
                {cargoGold > 0 && (
                  <button
                    type="button"
                    onClick={onSellAll}
                    className="px-3 py-1.5 rounded-lg bg-[#f6c344] hover:bg-[#ffd05c] text-xs font-bold tabular-nums text-[#131d2b] cursor-pointer transition-colors"
                  >
                    Trade Cargo (+{cargoGold}g)
                  </button>
                )}
                <button
                  type="button"
                  data-testid="menu-return-title-btn"
                  onClick={onTitle}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1c2d45] hover:bg-[#263d5c] border border-[#6e8eb0]/35 text-xs font-bold text-[#cbd5e1] cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Main Menu</span>
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="close-unified-menu-btn"
                  aria-label="Close Menu"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleDrawer();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#22354f] hover:bg-[#2d4464] text-xs font-bold text-[#f4efe6] cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close [Tab]</span>
                </button>
              </div>
            </div>

            {/* 2-Column Body: Clean Sidebar Navigation + Active View */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              <nav
                aria-label="Menu Sections"
                data-testid="unified-menu-nav"
                className="md:w-48 shrink-0 bg-[#101c2d] border-b md:border-b-0 md:border-r border-[#6e8eb0]/25 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto"
              >
                {(
                  [
                    { id: 'camp' as DrawerTab, label: 'Camp & Base', icon: Hammer },
                    { id: 'craft' as DrawerTab, label: `Station · T${hud.gearBonuses.setTier}`, icon: Wrench },
                    { id: 'inventory' as DrawerTab, label: `Pack (${hud.backpackUsedSlots}/${hud.backpackMaxItems})`, icon: Backpack },
                    { id: 'travel' as DrawerTab, label: 'World & Travel', icon: MapIcon },
                    { id: 'city' as DrawerTab, label: 'Frostcave City', icon: Store },
                    { id: 'festival' as DrawerTab, label: 'Festival', icon: Sparkles },
                    { id: 'bestiary' as DrawerTab, label: `Bestiary (${discoveredCount}/${totalSpeciesCount})`, icon: BookOpen },
                    { id: 'pets' as DrawerTab, label: `Pets (${hud.pets.tamedPets.length}/${hud.pets.maxSlots})`, icon: PawPrint },
                    { id: 'skills' as DrawerTab, label: totalSkillPoints > 0 ? `Skills (+${totalSkillPoints})` : 'Skills', icon: Award },
                    { id: 'achievements' as DrawerTab, label: `Badges (${hud.achievementsUnlockedCount}/${hud.achievements.length})`, icon: Trophy },
                    { id: 'daily' as DrawerTab, label: hud.dailyLogin.canClaimToday ? 'Daily Drop (!)' : 'Daily Drop', icon: Gift },
                    { id: 'saves' as DrawerTab, label: 'Save & Load', icon: Save },
                    { id: 'mystery' as DrawerTab, label: 'Unknown', icon: Sparkles },
                    { id: 'settings' as DrawerTab, label: 'Settings', icon: Settings },
                  ]
                ).map((item) => {
                  const Icon = item.icon;
                  const active = drawerTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`drawer-tab-${item.id}`}
                      onClick={() => onChangeDrawerTab(item.id)}
                      className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer whitespace-nowrap ${
                        active
                          ? item.id === 'mystery'
                            ? 'bg-[#d946ef] text-[#14071f]'
                            : 'bg-[#d98a2b] text-[#131d2b]'
                          : 'text-[#b8cbe0] hover:bg-[#1a2b42] hover:text-[#f4efe6]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-3.5 sm:p-4">

            {drawerTab === 'camp' ? (
              <div className="flex flex-col gap-3">
                {/* Boreal Calendar & 4-Day Almanac */}
                <div
                  data-testid="calendar-almanac"
                  className="rounded-lg bg-[#18283e] border border-[#7be0ff]/35 p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7be0ff]">
                        <Calendar className="w-3.5 h-3.5" />
                        Boreal Calendar
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#121f31] border border-[#6e8eb0]/40 text-[10px] font-bold text-[#f6c344] tabular-nums">
                        {hud.calendar.formattedDate}
                      </span>
                    </div>
                    <p className="text-xs text-[#dce6f2]">
                      {hud.calendar.todayEvent ? (
                        <>
                          <span className="font-bold text-[#fde68a]">{hud.calendar.todayEvent.title}:</span>{' '}
                          {hud.calendar.todayEvent.description}
                        </>
                      ) : (
                        `Season ${hud.calendar.seasonName} (${hud.calendar.dayOfSeason}/${hud.calendar.daysInSeason}) · Weather shifts every 9m (${formatWeatherCountdown(hud.weatherTimeLeft)} left in ${weatherProfile.label}).`
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                    {hud.calendar.upcomingDays.map((up) => (
                      <div
                        key={up.dayNumber}
                        className={`rounded-md px-2 py-1 border text-[10px] leading-tight tabular-nums ${
                          up.eventTitle
                            ? 'bg-[#2a2214] border-[#f6c344]/55 text-[#fde68a]'
                            : 'bg-[#132032] border-[#6e8eb0]/30 text-[#b8cbe0]'
                        }`}
                      >
                        <div className="font-bold">
                          {up.seasonName} {up.dayOfSeason}
                        </div>
                        <div className="text-[9px] text-[#9db4cb] truncate">
                          {up.eventTitle ?? up.weekdayName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zone Weather & Infrastructure Mitigation Summary Banner */}
                <div
                  data-testid="camp-weather-infrastructure-banner"
                  className="rounded-lg bg-[#16283d] border border-[#7be0ff]/45 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#7be0ff] inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        Zone Weather Infrastructure Shield · {hud.zoneWeatherEffect.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          hud.zoneWeatherEffect.mitigated
                            ? 'bg-[#163d2b] text-[#8ed49a] border border-[#8ed49a]/50'
                            : 'bg-[#451218] text-[#fca5a5] border border-[#f87171]/60'
                        }`}
                      >
                        {hud.zoneWeatherEffect.mitigated
                          ? 'All Penalties Mitigated'
                          : `${hud.zoneWeatherEffect.severity} Weather Drag Active`}
                      </span>
                    </div>
                    <p className="text-xs text-[#b8cbe0] mt-0.5">
                      {hud.zoneWeatherEffect.subtitle}. Construct{' '}
                      <strong className="text-[#f4efe6]">Windbreak Palisades</strong> to counter
                      movement drag and{' '}
                      <strong className="text-[#f4efe6]">Thermal Conduits / Forges</strong> to
                      prevent sub-zero resource gathering penalties across all 6 zones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 tabular-nums">
                    <div className="px-2.5 py-1 rounded bg-[#101c2c] border border-[#7be0ff]/45 text-xs font-bold text-[#9fe8ff]">
                      Wind Resist: {hud.zoneWeatherEffect.windResistancePct}% (Req{' '}
                      {hud.zoneWeatherEffect.requiredWindResistancePct}%)
                    </div>
                    <div className="px-2.5 py-1 rounded bg-[#101c2c] border border-[#f59e3d]/50 text-xs font-bold text-[#fed7aa]">
                      Heat Retain: {hud.zoneWeatherEffect.heatRetentionPct}% (Req{' '}
                      {hud.zoneWeatherEffect.requiredHeatRetentionPct}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {buildingIds.map((id) => {
                    const currentLvl = hud.levels[id] ?? 0;
                    const curSpec = getBuildingSpec(id, currentLvl);
                    const nextSpec = getNextBuildingUpgrade(id, hud.levels);
                    const affordable = nextSpec ? canAfford(hud.resources, nextSpec.cost) : false;
                    const shownSpec = nextSpec ?? curSpec;
                    const windBonus = shownSpec.windResistanceBonusPct ?? 0;
                    const heatBonus = shownSpec.heatRetentionBonusPct ?? 0;

                    return (
                      <div
                        key={id}
                        data-testid={`camp-building-card-${id}`}
                        className={`rounded-lg bg-[#1d2e47] border p-3 flex flex-col justify-between gap-2 ${
                          id === 'windbreak' ||
                          id === 'thermalConduit' ||
                          id === 'watchtower' ||
                          id === 'grandGranary'
                            ? 'border-[#7be0ff]/55'
                            : 'border-[#6e8eb0]/35'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-sm text-[#f4efe6]">
                              {nextSpec ? nextSpec.name : curSpec.name}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-[#9db4cb] tabular-nums">
                              {nextSpec ? `Lv ${currentLvl} -> ${nextSpec.level}` : 'MAXED'}
                            </span>
                          </div>
                          {(windBonus > 0 || heatBonus > 0) && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold tabular-nums">
                              {windBonus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#122b3d] border border-[#7be0ff]/45 text-[#9fe8ff]">
                                  +{windBonus}% Wind Resist
                                </span>
                              )}
                              {heatBonus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#2d1e12] border border-[#f59e3d]/45 text-[#fed7aa]">
                                  +{heatBonus}% Heat Retain
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-[#b8cbe0] mt-1">
                            {nextSpec ? nextSpec.description : curSpec.description}
                          </p>
                        </div>

                        {nextSpec ? (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <CostTags cost={nextSpec.cost} resources={hud.resources} />
                            <button
                              type="button"
                              data-testid={`buy-building-${id}`}
                              disabled={!affordable}
                              onClick={() => onBuyBuilding(id)}
                              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                                affordable
                                  ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                                  : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                              }`}
                            >
                              {currentLvl === 0 ? 'Build' : 'Upgrade'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-[#8ed49a]">Fully Built</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : drawerTab === 'craft' ? (
              <div data-testid="crafting-station-panel" className="flex flex-col gap-3">
                {/* Unified Workbench & Forge Header Banner */}
                <div className="rounded-lg bg-[#182940] border border-[#f6c344]/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#f6c344] inline-flex items-center gap-1">
                        <Hammer className="w-3.5 h-3.5" />
                        Artisan Forge, Gear &amp; Crafting Station
                      </span>
                      {hud.nearCraftingStation && (
                        <span className="px-1.5 py-0.5 rounded bg-[#173628] border border-[#8ed49a]/60 text-[9px] font-bold uppercase tracking-wider text-[#8ed49a]">
                          At Workbench
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#b8cbe0] mt-0.5">
                      Forge Clockwork Gears, craft tools &amp; traps, upgrade your 5-tier Armor &amp; Weapons, and manage gear loadout in your Backpack.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 tabular-nums">
                    <div
                      data-testid="station-gear-count"
                      className="px-2.5 py-1 rounded bg-[#121f31] border border-[#f6c344]/40 text-xs font-bold text-[#f6d37a] inline-flex items-center gap-1.5"
                    >
                      <Cog className="w-3.5 h-3.5 text-[#f6c344]" />
                      {hud.backpackInventory.clockwork_gear ?? 0} Gears
                    </div>
                    <div
                      data-testid="station-pack-slots"
                      className="px-2.5 py-1 rounded bg-[#121f31] border border-[#8ed49a]/40 text-xs font-bold text-[#8ed49a] inline-flex items-center gap-1.5"
                    >
                      <Backpack className="w-3.5 h-3.5" />
                      Pack {hud.backpackUsedSlots}/{hud.backpackMaxItems}
                    </div>
                    <button
                      type="button"
                      onClick={() => onChangeDrawerTab('inventory')}
                      className="px-2.5 py-1 rounded bg-[#1d3a2f] hover:bg-[#264d3e] border border-[#8ed49a]/60 text-xs font-bold text-[#a7f3d0] cursor-pointer transition-colors"
                    >
                      Manage Loadout [I]
                    </button>
                  </div>
                </div>

                {/* Combined Station Section Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        ['all', 'All Station & Forge'],
                        ['craft', 'Hammer, Gears & Traps'],
                        ['gear', 'Armor, Weapons & Wings'],
                        ['tree', 'Crafting Tree (Progression)'],
                      ] as const
                    ).map(([secId, label]) => (
                      <button
                        key={secId}
                        type="button"
                        data-testid={`station-section-${secId}`}
                        onClick={() => setStationSection(secId)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                          stationSection === secId
                            ? 'bg-[#f6c344] text-[#131d2b]'
                            : 'bg-[#1d2e47] text-[#dce6f2] hover:bg-[#273d5c]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Crafting Dependency Tree Section */}
                {stationSection === 'tree' && (
                  <div
                    data-testid="crafting-tree-panel"
                    className="rounded-xl bg-[#152338] border border-[#f6c344]/55 p-3.5 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#6e8eb0]/35">
                      <div>
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#f6c344]" />
                          <h4 className="text-sm font-extrabold text-[#fdf4ff] uppercase tracking-wider">
                            Frontier Progression &amp; Rare Material Crafting Tree
                          </h4>
                        </div>
                        <p className="text-xs text-[#b8cbe0] mt-0.5">
                          Follow the dependency chains from base timber, stone and pelts all the way to Zone 4/5 Rare Materials and Mythic Ascensions.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-[#10231b] border border-[#4ade80]/50 text-[#bbf7d0]">
                          Available
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#2b1722] border border-[#f87171]/50 text-[#fecaca]">
                          Locked / Missing
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Tier 1: Base Gathering & Components (Common) */}
                      <div className="rounded-xl bg-[#111c2e] border-2 border-[#8ed49a]/60 p-3 flex flex-col gap-2.5 shadow-[0_4px_16px_rgba(74,222,128,0.12)]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#8ed49a] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8ed49a]" />
                            Tier 1 · Common Base Materials
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#10231b] border border-[#8ed49a]/40 text-[#bbf7d0] text-[10px] font-bold">
                            Common
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Raw Wood, Stone & Pelts',
                                rarity: 'Common / Uncommon',
                                tier: 'Tier 1 · Base Gathering',
                                description:
                                  'Sturdy frontier timber, rough flint stone, and warm animal pelts harvested from the wilderness.',
                                sourceLocation: 'Zones 1 & 2 (Whispering Woods & Tundra)',
                                dropRate: '100% Harvest Rate (Yield: +1 to +3 per action)',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#18263a] border-2 border-[#8ed49a]/50 p-2 flex items-center justify-between cursor-pointer hover:border-[#8ed49a] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f4efe6]">Raw Wood, Stone &amp; Pelts</div>
                              <div className="text-[10px] text-[#9db4cb]">Harvested from Forest Trees &amp; Boulders</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#143024] text-[#bbf7d0] text-[10px] font-bold">
                              Wood {hud.resources.wood} · Stone {hud.resources.stone ?? 0}
                            </span>
                          </div>

                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Clockwork Gears',
                                rarity: 'Common Component',
                                tier: 'Tier 1 · Workbench Part',
                                description:
                                  'Precision mechanical components built at the camp workbench to construct advanced tools and structures.',
                                sourceLocation: 'Camp Workbench (Crafting Station)',
                                dropRate: '100% Success Rate (Cost: 2 Wood, 2 Stone, 5 Gold)',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#18263a] border-2 border-[#f6c344]/55 p-2 flex items-center justify-between cursor-pointer hover:border-[#f6c344] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#fde68a]">Clockwork Gears</div>
                              <div className="text-[10px] text-[#9db4cb]">Workbench Part (Wood + Stone + 5g)</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#2c2214] text-[#fde68a] text-[10px] font-bold tabular-nums">
                              {hud.backpackInventory.clockwork_gear ?? 0} Built
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tier 2: Station Tools & Mid Tier Gear (Rare) */}
                      <div className="rounded-xl bg-[#111c2e] border-2 border-[#7be0ff]/65 p-3 flex flex-col gap-2.5 shadow-[0_4px_16px_rgba(123,224,255,0.12)]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#7be0ff] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#7be0ff]" />
                            Tier 2 · Rare Tools &amp; Gear
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#14344d] border border-[#7be0ff]/40 text-[#9fe8ff] text-[10px] font-bold">
                            Rare
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Hammer Temper & Toolkit',
                                rarity: 'Rare',
                                tier: 'Tier 2 · Station Buff',
                                description:
                                  'Hardened steel smithing tools and temper oils to amplify workstation output and gathering speed.',
                                sourceLocation: 'Camp Forge & Crafting Station',
                                dropRate: '100% Permanent Buff (+25% Efficiency)',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#18263a] border-2 border-[#7be0ff]/45 p-2 flex items-center justify-between cursor-pointer hover:border-[#7be0ff] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f4efe6]">Hammer Temper &amp; Toolkit</div>
                              <div className="text-[10px] text-[#9db4cb]">Requires Clockwork Gears + Wood/Stone</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#1d3042] text-[#9fe8ff] text-[10px] font-bold">
                              Buffs Active
                            </span>
                          </div>

                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Tier II–IV Armor & Tools',
                                rarity: 'Rare',
                                tier: 'Tier 2 · Gear Progression',
                                description:
                                  'Forged steel axes, composite hunter bows, and insulated cold-resistant garments.',
                                sourceLocation: 'Camp Armorers & Weaponsmiths (Zones 2–4)',
                                dropRate: '100% Upgrade Success',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#18263a] border-2 border-[#7be0ff]/45 p-2 flex items-center justify-between cursor-pointer hover:border-[#7be0ff] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f4efe6]">Tier II–IV Armor &amp; Tools</div>
                              <div className="text-[10px] text-[#9db4cb]">Axe, Bow, Coat, Boots, Gloves &amp; Pack</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#1d3042] text-[#9fe8ff] text-[10px] font-bold">
                              Set Tier T{hud.gearBonuses.setTier}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tier 3: Rare Caldera/Starfall Materials & Mythic Ascensions (Mythic) */}
                      <div className="rounded-xl bg-[#160b26] border-2 border-[#d946ef]/75 p-3 flex flex-col gap-2.5 shadow-[0_4px_18px_rgba(217,70,239,0.18)]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#e879f9] flex items-center gap-1.5">
                            <span className="w-2 h-2 rotate-45 bg-[#e879f9] shadow-[0_0_6px_rgba(232,121,249,0.7)]" />
                            Tier 3 · Mythic Materials &amp; Gear
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#4a1d6e] border border-[#d946ef]/60 text-[#f5d0fe] text-[10px] font-bold">
                            Mythic
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Pyrewood & Brimstone Slag',
                                rarity: 'Mythic',
                                tier: 'Tier 3 · Rare Caldera Materials',
                                description:
                                  'Superheated volcanic timber and smoldering sulfur ore infused with intense magma heat.',
                                sourceLocation: 'Zone 4 (Obsidian Caldera)',
                                dropRate: '25% Rare Node Harvest Drop Rate',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#1c122b] border-2 border-[#d946ef]/55 p-2 flex items-center justify-between cursor-pointer hover:border-[#d946ef] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f5d0fe]">Pyrewood &amp; Brimstone Slag</div>
                              <div className="text-[10px] text-[#c084fc]">Zone 4 Obsidian Caldera Harvesting</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#3b0764] text-[#f5d0fe] text-[10px] font-bold tabular-nums">
                              {(hud.rareMaterials?.pyrewood_heart ?? 0) + (hud.rareMaterials?.brimstone_slag ?? 0)} Materials
                            </span>
                          </div>

                          <div
                            onMouseEnter={() =>
                              setTreeTooltip({
                                title: 'Void Timber & Dark Matter',
                                rarity: 'Mythic',
                                tier: 'Tier 3 · Starfall Materials',
                                description:
                                  'Ether-warped stellar wood and gravity-bending cosmic ore from the edge of the void.',
                                sourceLocation: 'Zone 5 (Starfall Eternal Zero)',
                                dropRate: '10% Mythic Harvest Drop Rate',
                              })
                            }
                            onMouseLeave={() => setTreeTooltip(null)}
                            className="rounded-lg bg-[#1c122b] border-2 border-[#d946ef]/55 p-2 flex items-center justify-between cursor-pointer hover:border-[#d946ef] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f5d0fe]">Void Timber &amp; Dark Matter</div>
                              <div className="text-[10px] text-[#c084fc]">Zone 5 Starfall Eternal Zero</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#3b0764] text-[#f5d0fe] text-[10px] font-bold tabular-nums">
                              {(hud.rareMaterials?.void_timber ?? 0) + (hud.rareMaterials?.dark_matter_ore ?? 0)} Materials
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onChangeDrawerTab('mystery')}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#d946ef] hover:bg-[#e879f9] text-[#14071f] text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors text-center shadow-[0_0_12px_rgba(217,70,239,0.45)]"
                          >
                            Open Mysteries Unknown Shop [Y]
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hover Tooltip Inspection Details Box */}
                    <div className="rounded-lg bg-[#0d1726] border border-[#6e8eb0]/40 p-2.5 flex flex-col gap-1 transition-colors">
                      {treeTooltip ? (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#f6c344] uppercase tracking-wider">
                              {treeTooltip.title}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1e2f47] text-[#9fe8ff]">
                              {treeTooltip.rarity} · {treeTooltip.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#e2ecf7]">{treeTooltip.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] font-semibold text-[#b8cbe0] border-t border-[#6e8eb0]/25">
                            <span>📍 Source: <strong className="text-[#f4efe6]">{treeTooltip.sourceLocation}</strong></span>
                            <span>⚡ Drop Rate: <strong className="text-[#8ed49a]">{treeTooltip.dropRate}</strong></span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-[#9db4cb] text-center italic py-0.5">
                          🔍 Hover over any crafting node above to inspect material descriptions, source locations, and drop rates.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Blueprint Crafting Section */}
                {(stationSection === 'all' || stationSection === 'craft') && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          ['all', 'All Blueprints'],
                          ['parts', 'Hammer & Gears'],
                          ['tools', 'Tools & Buffs'],
                          ['traps', 'Traps'],
                          ['provisions', 'Provisions'],
                        ] as const
                      ).map(([catId, label]) => (
                        <button
                          key={catId}
                          type="button"
                          data-testid={`craft-filter-${catId}`}
                          onClick={() => setCraftFilter(catId)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            craftFilter === catId
                              ? 'bg-[#d98a2b] text-[#131d2b]'
                              : 'bg-[#1d2e47] text-[#b8cbe0] hover:bg-[#273d5c]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div
                      data-testid="crafting-grid"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                    >
                      {ALL_CRAFT_RECIPES.filter(
                        (r) => craftFilter === 'all' || r.category === craftFilter,
                      ).map((recipe) => {
                        const gearsHave = hud.backpackInventory.clockwork_gear ?? 0;
                        const inPack = hud.backpackInventory[recipe.id] ?? 0;
                        const netAdded = recipe.yieldQty - (recipe.cost.gears ?? 0);
                        const hasRoom = hud.backpackUsedSlots + netAdded <= hud.backpackMaxItems;
                        const affordable =
                          canCraftRecipe(hud.resources, recipe.id, hud.backpackInventory) && hasRoom;
                        const activeSecs = getLinkedBuffSeconds(recipe.id, hud.activeBuffs);

                        return (
                          <div
                            key={recipe.id}
                            data-testid={`craft-card-${recipe.id}`}
                            className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-3 flex flex-col justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display font-bold text-sm text-[#f4efe6]">
                                  {recipe.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {inPack > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#143429] border border-[#8ed49a]/55 text-[10px] font-bold tabular-nums text-[#8ed49a]">
                                      Pack x{inPack}
                                    </span>
                                  )}
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                                      recipe.rarity,
                                    )}`}
                                  >
                                    {getRarityLabel(recipe.rarity)}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`text-[10px] font-bold uppercase tabular-nums mt-0.5 ${
                                  activeSecs > 0 ? 'text-[#8ed49a]' : 'text-[#9db4cb]'
                                }`}
                              >
                                {activeSecs > 0 ? `Buff Active ${Math.ceil(activeSecs)}s` : recipe.tag}
                              </div>
                              <p className="text-xs text-[#b8cbe0] mt-1">{recipe.summary}</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <CostTags
                                cost={recipe.cost}
                                resources={hud.resources}
                                gearsHave={gearsHave}
                              />
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  data-testid={`craft-recipe-${recipe.id}`}
                                  disabled={!affordable}
                                  onClick={() => onCraftItem(recipe.id)}
                                  className={`px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                                    affordable
                                      ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                                      : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                                  }`}
                                >
                                  {!hasRoom ? 'Pack Full' : 'Craft'}
                                </button>
                                {recipe.usableKind !== 'component' && (
                                  <button
                                    type="button"
                                    data-testid={`quick-use-${recipe.id}`}
                                    disabled={
                                      inPack <= 0 &&
                                      !canCraftRecipe(hud.resources, recipe.id, hud.backpackInventory)
                                    }
                                    onClick={() =>
                                      inPack > 0
                                        ? onUseBackpackItem(recipe.id)
                                        : onCraftAndUseItem(recipe.id)
                                    }
                                    className={`px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                                      inPack > 0
                                        ? 'bg-[#8ed49a] hover:bg-[#a6e5b1] text-[#0f1d17] cursor-pointer'
                                        : canCraftRecipe(hud.resources, recipe.id, hud.backpackInventory)
                                          ? 'bg-[#234b66] hover:bg-[#2c5e80] text-[#9fe8ff] cursor-pointer'
                                          : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                                    }`}
                                  >
                                    {recipe.usableKind === 'trap'
                                      ? inPack > 0
                                        ? 'Deploy'
                                        : 'Craft+Deploy'
                                      : inPack > 0
                                        ? 'Use'
                                        : 'Craft+Use'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Combined Forge Gear, Weapons & Wings of Fire Section */}
                {(stationSection === 'all' || stationSection === 'gear') && (
                  <div
                    data-testid="gear-tools-panel"
                    className="flex flex-col gap-3 pt-2 border-t border-[#6e8eb0]/30"
                  >
                    {/* Active Gear Set Bonus Banner */}
                    <div
                      data-testid="gear-set-banner"
                      className={`rounded-lg px-3.5 py-2.5 border flex flex-wrap items-center justify-between gap-2 ${
                        hud.gearSet
                          ? 'bg-[#1a334d] border-[#7be0ff]/60'
                          : 'bg-[#18273d] border-[#516d8c]/45'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb]">
                            Expedition Gear Set
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                              hud.gearSet?.rarity ?? 'common',
                            )}`}
                          >
                            {hud.gearSet
                              ? `${getRarityLabel(hud.gearSet.rarity)} · Tier ${hud.gearSet.minTier}`
                              : `Equipped Tier ${hud.gearBonuses.setTier}/5`}
                          </span>
                        </div>
                        <div className="font-display font-bold text-sm text-[#f4efe6] mt-0.5">
                          {hud.gearSet ? hud.gearSet.name : 'Starter Frontier Kit (No Set Bonus)'}
                        </div>
                        <div className="text-xs text-[#9fe8ff]">
                          {hud.gearSet
                            ? hud.gearSet.summary
                            : 'Equip and upgrade all 4 gear slots to Tier 2+ to unlock cumulative Set Bonuses.'}
                        </div>
                      </div>
                      <div className="text-right text-[11px] tabular-nums">
                        {nextGearSet ? (
                          <>
                            <div className="text-[#9db4cb] uppercase text-[10px] font-bold">
                              Next Set · All Slots Tier {nextGearSet.minTier}+
                            </div>
                            <div className={`font-bold ${rarityColor(nextGearSet.rarity)}`}>
                              {nextGearSet.name}
                            </div>
                            <div className="text-[11px] text-[#cbd5e1]">{nextGearSet.summary}</div>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-[#f0abfc]">
                            Apex Mythic Set Complete
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mythic Relic: Wings of Fire Showcase Banner */}
                    <div
                      data-testid="wings-of-fire-banner"
                      className={`rounded-lg px-3.5 py-2.5 border flex flex-wrap items-center justify-between gap-2 ${
                        hud.wingsTier > 0
                          ? 'bg-[#36170d] border-[#fb923c]/75'
                          : 'bg-[#1f171b] border-[#9a3412]/45'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#fb923c]">
                            <Flame className="w-3.5 h-3.5 text-[#f97316]" />
                            Mythic Relic · Wings of Fire
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#431407] border border-[#fb923c]/60 text-[9px] font-bold uppercase tracking-wider text-[#fed7aa]">
                            Tier {hud.wingsTier}/{WINGS_OF_FIRE_TIERS.length - 1}
                          </span>
                          {hud.wingsTier > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                hud.wingsEquipped
                                  ? 'bg-[#143429] text-[#8ed49a]'
                                  : 'bg-[#1f2937] text-[#9ca3af]'
                              }`}
                            >
                              {hud.wingsEquipped ? 'Equipped' : 'Removed'}
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-sm text-[#fff7ed] mt-0.5">
                          {hud.wingsSpec.name} —{' '}
                          <span className="text-xs text-[#fde047]">{hud.wingsSpec.subtitle}</span>
                        </div>
                        <div className="text-xs text-[#fdba74] mt-0.5">
                          {hud.wingsTier > 0
                            ? hud.wingsSpec.description
                            : `Complete ${hud.wingsQuestRequirement} Daily Trials for Valkyra Emberwing in Frostcave City (${hud.cityDailyQuestsCompleted}/${hud.wingsQuestRequirement}).`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hud.wingsTier > 0 && (
                          <button
                            type="button"
                            onClick={onToggleWingsEquipped}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                              hud.wingsEquipped
                                ? 'bg-[#3b1d1d] hover:bg-[#522727] text-[#fecaca]'
                                : 'bg-[#1f4d36] hover:bg-[#2a6648] text-[#bbf7d0]'
                            }`}
                          >
                            {hud.wingsEquipped ? 'Remove Wings' : 'Equip Wings'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onChangeDrawerTab('city')}
                          className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#f97316] text-xs font-bold uppercase tracking-wider text-[#fff7ed] cursor-pointer transition-colors"
                        >
                          City Quests [T]
                        </button>
                      </div>
                    </div>

                    {/* 4-Slot Tiered Expedition Armor & Pack */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9db4cb]">
                          Expedition Gear Forge (Tiers 1–{MAX_GEAR_TIER})
                        </span>
                        <span className="text-[11px] text-[#8ed49a] tabular-nums font-semibold">
                          Speed +{Math.round((hud.gearBonuses.moveSpeedMult - 1) * 100)}% · Dmg +
                          {Math.round((hud.gearBonuses.damageMult - 1) * 100)}% · Pack +
                          {hud.gearBonuses.packCapacityBonus}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {GEAR_SLOT_ORDER.map((slot) => {
                          const ownedTier = hud.unlockedGear[slot] ?? 1;
                          const equippedTier = hud.gear[slot] ?? 0;
                          const isEquipped = equippedTier > 0;
                          const meta = GEAR_SLOT_META[slot];
                          const curSpec = getGearSlotSpec(slot, ownedTier);
                          const nextSpec = getNextGearUpgrade(slot, hud.unlockedGear);
                          const affordable = nextSpec ? canAfford(hud.resources, nextSpec.cost) : false;
                          const displayRarity: ItemRarity = curSpec.rarity;

                          const pipColor =
                            displayRarity === 'mythic'
                              ? 'bg-[#e879f9]'
                              : displayRarity === 'epic'
                                ? 'bg-[#f6c344]'
                                : displayRarity === 'rare'
                                  ? 'bg-[#7be0ff]'
                                  : displayRarity === 'uncommon'
                                    ? 'bg-[#8ed49a]'
                                    : 'bg-[#94a3b8]';

                          return (
                            <div
                              key={slot}
                              data-testid={`gear-slot-${slot}`}
                              className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-2.5 flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] uppercase tracking-wider text-[#9db4cb] font-bold">
                                    {meta.label}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {!isEquipped && (
                                      <span className="px-1 py-0.5 rounded bg-[#3b1d1d] text-[9px] font-bold uppercase text-[#fca5a5]">
                                        Removed
                                      </span>
                                    )}
                                    <span
                                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                                        displayRarity,
                                      )}`}
                                    >
                                      T{ownedTier}/{MAX_GEAR_TIER}
                                    </span>
                                  </div>
                                </div>

                                <div className="font-display font-bold text-sm text-[#f4efe6] mt-0.5">
                                  {curSpec.name}
                                </div>

                                {/* 5-Tier Progress Pips */}
                                <div
                                  className="flex items-center gap-1 my-1.5"
                                  aria-label={`Tier ${ownedTier} of ${MAX_GEAR_TIER}`}
                                >
                                  {[1, 2, 3, 4, 5].map((pip) => (
                                    <span
                                      key={pip}
                                      className={`h-1.5 flex-1 rounded-sm ${
                                        pip <= ownedTier ? pipColor : 'bg-[#0f1a29]'
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="text-[11px] font-semibold text-[#8ed49a]">
                                  {curSpec.summary}
                                </div>

                                {nextSpec ? (
                                  <div className="mt-1.5 pt-1.5 border-t border-[#6e8eb0]/20">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-[#9db4cb] uppercase font-bold">
                                        Next · T{nextSpec.tier}
                                      </span>
                                      <span className={`font-bold ${rarityColor(nextSpec.rarity)}`}>
                                        {nextSpec.name}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-[#cbd5e1] mt-0.5">
                                      {nextSpec.summary}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-[#b8cbe0] mt-1">
                                    {curSpec.description}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1.5 pt-1">
                                {nextSpec ? (
                                  <>
                                    <CostTags cost={nextSpec.cost} resources={hud.resources} />
                                    <button
                                      type="button"
                                      data-testid={`upgrade-gear-${slot}`}
                                      disabled={!affordable}
                                      onClick={() => onBuyGear(slot)}
                                      className={`w-full py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                                        affordable
                                          ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                                          : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                                      }`}
                                    >
                                      Upgrade Tier {nextSpec.tier}
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-xs font-bold text-[#f0abfc]">
                                    Mythic Tier Maxed
                                  </div>
                                )}
                                {!isEquipped && (
                                  <button
                                    type="button"
                                    onClick={() => onEquipGear(slot)}
                                    className="w-full py-1 rounded bg-[#1f4d36] hover:bg-[#2a6648] text-[11px] font-bold uppercase tracking-wide text-[#bbf7d0] cursor-pointer transition-colors"
                                  >
                                    Equip Owned T{ownedTier}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Forged Weapons (Woodaxe & Hunting Bow) */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#9db4cb] mb-1.5">
                        Forged Weapons (Tiers 1–7)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {weaponIds.map((id) => {
                          const currentLvl = hud.levels[id];
                          const maxTier = id === 'axe' ? AXE_TIERS.length : BOW_TIERS.length;
                          const curSpec = id === 'axe' ? getAxeSpec(currentLvl) : getBowSpec(currentLvl);
                          const nextSpec = getNextToolUpgrade(id, hud.levels);
                          const affordable = nextSpec ? canAfford(hud.resources, nextSpec.cost) : false;
                          const label = id === 'axe' ? 'Woodaxe' : 'Hunting Bow';
                          const displaySpec = nextSpec ?? curSpec;
                          const rarity: ItemRarity = displaySpec.rarity ?? 'common';

                          return (
                            <div
                              key={id}
                              className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-2.5 flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] uppercase tracking-wider text-[#9db4cb] font-bold">
                                    {label}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                                        rarity,
                                      )}`}
                                    >
                                      {getRarityLabel(rarity)}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#f6c344] tabular-nums">
                                      Tier {currentLvl}/{maxTier}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-display font-bold text-sm text-[#f4efe6] mt-0.5">
                                  {nextSpec ? nextSpec.name : `${curSpec.name} (MAX)`}
                                </div>
                                <div className="text-[11px] text-[#9db4cb] mt-0.5">
                                  Equipped:{' '}
                                  <span className="text-[#dce6f2] font-semibold">{curSpec.name}</span>
                                </div>
                                <p className="text-xs text-[#b8cbe0] mt-0.5">
                                  {nextSpec ? nextSpec.description : 'Mythic masterwork frontier weapon.'}
                                </p>
                              </div>

                              {nextSpec ? (
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <CostTags cost={nextSpec.cost} resources={hud.resources} />
                                  <button
                                    type="button"
                                    disabled={!affordable}
                                    onClick={() => onBuyTool(id)}
                                    className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wide shrink-0 transition-colors ${
                                      affordable
                                        ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                                        : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                                    }`}
                                  >
                                    Forge Tier {nextSpec.level}
                                  </button>
                                </div>
                              ) : (
                                <div className={`text-xs font-bold ${rarityColor(curSpec.rarity ?? 'mythic')}`}>
                                  Apex Masterwork
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : drawerTab === 'inventory' ? (
              <InventoryGui
                hud={hud}
                cargoGold={cargoGold}
                onSelectTool={onSelectTool}
                onEquipGear={onEquipGear}
                onUnequipGear={onUnequipGear}
                onToggleWingsEquipped={onToggleWingsEquipped}
                onEquipAscension={onEquipAscension}
                onUseBackpackItem={onUseBackpackItem}
                onCraftItem={onCraftItem}
                onSalvageBackpackItem={onSalvageBackpackItem}
                onSellAll={onSellAll}
                onSellMeat={onSellMeat}
                onChangeDrawerTab={(tab) => onChangeDrawerTab(tab)}
                rarityColor={rarityColor}
                rarityBadgeStyle={rarityBadgeStyle}
              />
            ) : drawerTab === 'festival' ? (
              <div data-testid="festival-panel" className="flex flex-col gap-3">
                <div
                  className={`rounded-lg px-3.5 py-2.5 border flex flex-wrap items-center justify-between gap-2 ${
                    hud.seasonalEvent.active
                      ? 'bg-[#18344f] border-[#7be0ff]/65'
                      : 'bg-[#1a293f] border-[#6e8eb0]/35'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#9fe8ff]">
                      {hud.seasonalEvent.active
                        ? `${hud.seasonalEvent.name} · Open`
                        : `${hud.seasonalEvent.name} · Gates Closed`}
                    </div>
                    <p className="text-xs text-[#c7d9ec] mt-0.5">
                      {hud.seasonalEvent.active
                        ? 'Harvest glowing Ice Sculptures in the forest to collect Ice Shards and construct limited-time Festival buildings.'
                        : 'Festival buildings and Ice Sculptures return when the next seasonal event countdown completes.'}
                    </p>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-[#f6c344]">
                    {hud.seasonalEvent.active
                      ? `${Math.ceil(hud.seasonalEvent.timeLeft)}s remaining`
                      : `Opens in ${Math.ceil(hud.seasonalEvent.timeLeft)}s`}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FESTIVAL_BUILDING_IDS.map((fid) => {
                    const currentLvl = hud.levels[fid] ?? 0;
                    const curSpec = getFestivalBuildingSpec(fid, currentLvl);
                    const nextSpec = getNextFestivalBuildingUpgrade(fid, hud.levels);
                    const purchasable = canPurchaseFestivalBuilding(
                      fid,
                      hud.levels,
                      hud.resources,
                      hud.seasonalEvent,
                    );

                    return (
                      <div
                        key={fid}
                        className="rounded-lg bg-[#1d2e47] border border-[#7be0ff]/35 p-3 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-sm text-[#f4efe6]">
                              {nextSpec ? nextSpec.name : curSpec.name}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-[#9fe8ff] tabular-nums">
                              {nextSpec ? `Lv ${currentLvl} -> ${nextSpec.level}` : 'MAXED'}
                            </span>
                          </div>
                          <p className="text-xs text-[#b8cbe0] mt-1">
                            {nextSpec ? nextSpec.description : curSpec.description}
                          </p>
                        </div>

                        {nextSpec ? (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <CostTags cost={nextSpec.cost} resources={hud.resources} />
                            <button
                              type="button"
                              disabled={!purchasable}
                              onClick={() => onBuyFestivalBuilding(fid)}
                              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                                purchasable
                                  ? 'bg-[#7be0ff] hover:bg-[#9ee9ff] text-[#102030] cursor-pointer'
                                  : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                              }`}
                            >
                              {!hud.seasonalEvent.active
                                ? 'Event Only'
                                : currentLvl === 0
                                  ? 'Build'
                                  : 'Upgrade'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-[#8ed49a]">
                            Permanent Winter Landmark
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg bg-[#1a293f] border border-[#6e8eb0]/35 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#f4efe6]">
                      Festival Ice Gift Exchange
                    </div>
                    <div className="text-[11px] text-[#b8cbe0]">
                      Trade 3 Ice Shards for +30 Gold while the festival market is open.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!hud.seasonalEvent.active || (hud.resources.ice ?? 0) < 3}
                    onClick={onExchangeFestivalIce}
                    className={`px-3.5 py-1.5 rounded text-xs font-bold tabular-nums transition-colors ${
                      hud.seasonalEvent.active && (hud.resources.ice ?? 0) >= 3
                        ? 'bg-[#f6c344] hover:bg-[#ffd05c] text-[#131d2b] cursor-pointer'
                        : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                    }`}
                  >
                    Trade 3 Ice (+30g)
                  </button>
                </div>
              </div>
            ) : drawerTab === 'city' ? (
              <div data-testid="city-market-panel" className="flex flex-col gap-3">
                {/* Subterranean Frostcave City Bazaar Header & Butcher Meat Exchange */}
                <div className="rounded-lg bg-[#241c11] border border-[#f6c344]/60 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f6c344]">
                        Frostcave City · Subterranean Merchant Bazaar
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#141e2e] border border-[#f6c344]/40 text-[10px] font-bold text-[#fde68a]">
                        {hud.zone.id === 'city' ? 'Inside Cavern Plaza' : 'East Gate Trade Network'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#e8d5b8] mt-0.5">
                      Barter hunted Wild Meat &amp; Gold Coins with the 4 guild merchants of Frostcave City, or sell fresh meat cuts for coin.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-2.5 py-1 rounded bg-[#141e2e] border border-[#6e8eb0]/35 flex items-center gap-3 text-xs font-bold tabular-nums">
                      <span className="inline-flex items-center gap-1 text-[#ffe4e6]">
                        <MeatIcon className="w-4 h-4" />
                        {meatCount} Meat
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#f6c344]">
                        <GoldIcon className="w-4 h-4" />
                        {hud.resources.gold} Coins
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid="sell-one-meat-button"
                      disabled={meatCount < 1}
                      onClick={() => onSellMeat(1)}
                      className={`px-3 py-1.5 rounded text-xs font-bold tabular-nums transition-colors ${
                        meatCount >= 1
                          ? 'bg-[#b91c1c] hover:bg-[#dc2626] text-[#ffe4e6] cursor-pointer'
                          : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                      }`}
                    >
                      Sell 1 Meat (+{meatUnitGold}g)
                    </button>
                    <button
                      type="button"
                      data-testid="sell-all-meat-button"
                      disabled={meatCount < 1}
                      onClick={() => onSellMeat()}
                      className={`px-3 py-1.5 rounded text-xs font-bold tabular-nums transition-colors ${
                        meatCount >= 1
                          ? 'bg-[#f6c344] hover:bg-[#ffd05c] text-[#131d2b] cursor-pointer'
                          : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                      }`}
                    >
                      Sell All Meat (+{allMeatGold}g)
                    </button>
                  </div>
                </div>

                {/* Valkyra Emberwing — City Daily Quest & 30-Trial Wings of Fire Altar Card */}
                {(() => {
                  const q = hud.cityDailyQuest;
                  const questCheck = canCompleteCityDailyQuest(q, hud.resources);
                  const milestoneTier = hud.wingsTier >= 2 ? 3 : hud.wingsTier >= 1 ? 2 : 1;
                  const nextWings = getWingsOfFireSpec(
                    q.rewardWingsTier > 0 ? q.rewardWingsTier : milestoneTier,
                  );
                  const killPct = Math.max(
                    0,
                    Math.min(100, (q.progressKills / Math.max(1, q.targetKills)) * 100),
                  );
                  const wingsMaxed = hud.wingsTier >= 3;
                  const nextMilestoneTarget =
                    hud.wingsTier === 0
                      ? hud.wingsQuestRequirement
                      : hud.wingsTier === 1
                        ? 45
                        : 60;
                  const milestonePct = wingsMaxed
                    ? 100
                    : Math.max(
                        0,
                        Math.min(
                          100,
                          (hud.cityDailyQuestsCompleted / Math.max(1, nextMilestoneTarget)) * 100,
                        ),
                      );
                  return (
                    <div
                      data-testid="city-daily-quest-card"
                      className={`rounded-lg border p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        q.completed
                          ? 'bg-[#1b2e25] border-[#8ed49a]/65'
                          : 'bg-[#2e160d] border-[#fb923c]/75'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#fb923c]">
                            <Flame className="w-3.5 h-3.5 text-[#f97316]" />
                            {CITY_QUEST_NPC.name} · {CITY_QUEST_NPC.title}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#431407] border border-[#fb923c]/60 text-[10px] font-bold text-[#ffedd5]">
                            Trial #{q.dayNumber}
                          </span>
                          <span
                            data-testid="city-daily-quests-progress-badge"
                            className="px-2 py-0.5 rounded bg-[#1f122b] border border-[#f0abfc]/60 text-[10px] font-bold text-[#f5d0fe] tabular-nums"
                          >
                            {wingsMaxed
                              ? `Flame Record: ${hud.cityDailyQuestsCompleted} Trials · Wings T3/3`
                              : `Flame Record: ${hud.cityDailyQuestsCompleted}/${nextMilestoneTarget} Quests · Wings T${hud.wingsTier}/3`}
                          </span>
                        </div>

                        <div className="font-display font-bold text-sm sm:text-base text-[#fff7ed] mt-1">
                          {q.title} — Reward:{' '}
                          <span className="text-[#fde047]">
                            {q.rewardWingsTier > 0
                              ? q.rewardWingsName
                              : wingsMaxed
                                ? 'Solar Flame Bounty'
                                : `Flame Tally +1 (Wings @ ${nextMilestoneTarget})`}
                          </span>{' '}
                          &amp; +{q.rewardGold} Coins
                        </div>
                        <p className="text-xs text-[#fed7aa] mt-0.5">{q.description}</p>
                        <div className="text-[11px] font-semibold text-[#fdba74] mt-1">
                          {wingsMaxed
                            ? `Awakened Relic (${hud.wingsSpec.name}): ${hud.wingsSpec.subtitle}`
                            : `Next Relic Milestone (${nextWings.name}): ${nextWings.subtitle} (${nextWings.description})`}
                        </div>

                        {/* Current Trial Kill Progress & Cumulative 30-Quest Wings Progress */}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#ffedd5] mb-0.5 tabular-nums">
                              <span>Trial Quarry Kills</span>
                              <span>
                                {q.progressKills}/{q.targetKills} Kills
                              </span>
                            </div>
                            <div className="h-2 rounded-sm bg-[#1a0c06] overflow-hidden border border-[#9a3412]">
                              <div
                                className="h-full bg-[#f97316] transition-[width] duration-150"
                                style={{ width: `${killPct}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#f5d0fe] mb-0.5 tabular-nums">
                              <span>
                                {wingsMaxed
                                  ? 'Wings of Fire Maxed'
                                  : hud.wingsTier === 0
                                    ? 'Wings of Fire Unlock'
                                    : `Wings Tier ${Math.min(3, hud.wingsTier + 1)} Awakening`}
                              </span>
                              <span>
                                {wingsMaxed
                                  ? 'Tier 3/3 Active'
                                  : `${hud.cityDailyQuestsCompleted}/${nextMilestoneTarget} Trials`}
                              </span>
                            </div>
                            <div className="h-2 rounded-sm bg-[#160b21] overflow-hidden border border-[#9333ea]/60">
                              <div
                                className="h-full bg-[#f0abfc] transition-[width] duration-150"
                                style={{ width: `${milestonePct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#fb923c]/25">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#fed7aa]">
                          Required Tribute Offering
                        </div>
                        <CostTags cost={q.bountyCost} resources={hud.resources} />

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            data-testid="claim-city-daily-quest-button"
                            disabled={!questCheck.ok}
                            onClick={onClaimCityDailyQuest}
                            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                              q.completed
                                ? 'bg-[#1f3b2d] text-[#8ed49a] border border-[#8ed49a]/50 cursor-not-allowed'
                                : questCheck.ok
                                  ? 'bg-[#f97316] hover:bg-[#fb923c] text-[#1c0a04] shadow-[0_0_16px_rgba(249,115,22,0.55)] cursor-pointer'
                                  : 'bg-[#2a3c55] text-[#8ca0b8] cursor-not-allowed'
                            }`}
                          >
                            {q.completed
                              ? 'Trial Claimed'
                              : !questCheck.ok
                                ? `Hunt ${Math.max(1, q.targetKills - q.progressKills)} More or Gather Tribute`
                                : q.rewardWingsTier > 0
                                  ? `Claim ${q.rewardWingsName}`
                                  : 'Claim Daily Trial'}
                          </button>

                          {q.completed && (
                            <button
                              type="button"
                              data-testid="next-city-daily-quest-button"
                              onClick={onStartNextCityDailyQuest}
                              className="px-3.5 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-xs font-extrabold uppercase tracking-wider text-[#fff7ed] cursor-pointer transition-colors"
                            >
                              Next Daily Trial
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4 Named City Trader Filter Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    data-testid="city-trader-filter-all"
                    onClick={() => setCityTraderFilter('all')}
                    className={`rounded-lg p-2.5 border text-left cursor-pointer transition-colors flex flex-col justify-between ${
                      cityTraderFilter === 'all'
                        ? 'bg-[#2c2214] border-[#f6c344] text-[#f4efe6]'
                        : 'bg-[#1a293f] border-[#6e8eb0]/35 text-[#b8cbe0] hover:bg-[#223550]'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#f6c344]">
                      All Stalls
                    </div>
                    <div className="font-display font-bold text-xs text-[#f4efe6] mt-0.5">
                      Grand Cavern Bazaar
                    </div>
                    <div className="text-[10px] text-[#9db4cb] mt-1">
                      {CITY_OFFERS.length} Merchant Wares
                    </div>
                  </button>

                  {CITY_TRADER_ORDER.map((tid) => {
                    const tr = CITY_TRADERS[tid];
                    const active = cityTraderFilter === tid;
                    const isNearby = hud.nearCityTrader === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        data-testid={`city-trader-filter-${tid}`}
                        onClick={() => setCityTraderFilter(tid)}
                        className={`rounded-lg p-2.5 border text-left cursor-pointer transition-colors flex flex-col justify-between ${
                          active
                            ? 'bg-[#2c2214] border-[#f6c344] text-[#f4efe6]'
                            : 'bg-[#1a293f] border-[#6e8eb0]/35 text-[#b8cbe0] hover:bg-[#223550]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#f6c344] truncate">
                            {tr.title}
                          </span>
                          {isNearby && (
                            <span className="px-1.5 py-0.2 rounded bg-[#8ed49a]/20 border border-[#8ed49a]/60 text-[9px] font-bold text-[#8ed49a]">
                              Near
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-xs text-[#f4efe6] mt-0.5 truncate">
                          {tr.name}
                        </div>
                        <div className="text-[10px] text-[#9db4cb] mt-1 truncate">
                          {tr.specialty}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Trader Greeting Quote */}
                {cityTraderFilter !== 'all' && (
                  <div className="rounded-lg bg-[#18263b] border border-[#6e8eb0]/40 px-3 py-2 flex items-center justify-between gap-2 text-xs text-[#dce6f2]">
                    <span>
                      <strong className="text-[#f6c344]">{CITY_TRADERS[cityTraderFilter].name}:</strong>{' '}
                      &ldquo;{CITY_TRADERS[cityTraderFilter].greeting}&rdquo;
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#9db4cb] shrink-0">
                      {CITY_TRADERS[cityTraderFilter].specialty}
                    </span>
                  </div>
                )}

                {/* Trader Offers Grid (Coins & Meat Barter) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {CITY_OFFERS.filter(
                    (o) => cityTraderFilter === 'all' || o.traderId === cityTraderFilter,
                  ).map((offer) => {
                    const trader = CITY_TRADERS[offer.traderId];
                    const check = canBuyCityOffer({
                      offer,
                      resources: hud.resources,
                      inventory: hud.backpackInventory,
                      maxItems: hud.backpackMaxItems,
                    });
                    const ownedCount = offer.itemId
                      ? hud.backpackInventory[offer.itemId] ?? 0
                      : null;
                    const costGold = offer.cost.gold;
                    const costMeat = offer.cost.meat ?? 0;

                    return (
                      <div
                        key={offer.id}
                        data-testid={`city-offer-card-${offer.id}`}
                        className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/40 p-3 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                                offer.rarity,
                              )}`}
                            >
                              {getRarityLabel(offer.rarity)}
                            </span>
                            <span className="text-[10px] font-semibold text-[#f6c344] truncate">
                              {trader.name}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-[#f4efe6] mt-1">
                            {offer.name}
                          </div>
                          <p className="text-xs text-[#b8cbe0] mt-0.5 leading-snug">
                            {offer.description}
                          </p>
                          <div className="mt-1 text-[10px] font-bold text-[#9be7ff]">
                            {offer.summary}
                          </div>
                          {ownedCount !== null && (
                            <div className="mt-0.5 text-[10px] font-semibold text-[#8ed49a] tabular-nums">
                              In Backpack: {ownedCount}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#6e8eb0]/25 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 text-xs font-bold tabular-nums">
                            {costGold > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  hud.resources.gold >= costGold
                                    ? 'text-[#f6c344]'
                                    : 'text-[#ef7b73]'
                                }`}
                              >
                                <GoldIcon className="w-3.5 h-3.5" />
                                {costGold}
                              </span>
                            )}
                            {costMeat > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  meatCount >= costMeat
                                    ? 'text-[#fda4af]'
                                    : 'text-[#ef7b73]'
                                }`}
                              >
                                <MeatIcon className="w-3.5 h-3.5" />
                                {costMeat}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            data-testid={`buy-city-offer-${offer.id}`}
                            disabled={!check.ok}
                            onClick={() => onBuyCityOffer(offer.id)}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                              check.ok
                                ? 'bg-[#f6c344] hover:bg-[#ffd05c] text-[#131d2b] cursor-pointer'
                                : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                            }`}
                          >
                            {check.reason === 'pack_full' ? 'Pack Full' : 'Buy'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : drawerTab === 'bestiary' ? (
              <div data-testid="bestiary-panel" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#f6c344]">
                      Arctic Wildlife Field Bestiary
                    </div>
                    <div className="text-[11px] text-[#b8cbe0] tabular-nums">
                      {discoveredCount} of {totalSpeciesCount} species charted · Spot creatures in the forest or hunt them to log efficiency &amp; lore
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        ['all', 'All'],
                        ['common', 'Common & Uncommon'],
                        ['rare_epic', 'Rare / Epic / Mythic'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setBestiaryFilter(id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                          bestiaryFilter === id
                            ? 'bg-[#d98a2b] text-[#131d2b]'
                            : 'bg-[#1d2e47] text-[#b8cbe0] hover:bg-[#273d5c]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                  {/* Species Index List */}
                  <div className="md:col-span-5 flex flex-col gap-1.5 max-h-[210px] overflow-y-auto pr-1">
                    {filteredSpecies.map((kind) => {
                      const spec = SPECIES_SPECS[kind];
                      const lore = BESTIARY_LORE[kind];
                      const rec = hud.bestiary[kind];
                      const eff = computeHuntingEfficiency(rec, spec);
                      const selected = kind === activeBestiaryKind;

                      return (
                        <button
                          key={kind}
                          type="button"
                          data-testid={`bestiary-entry-${kind}`}
                          onClick={() => setSelectedSpecies(kind)}
                          className={`w-full text-left rounded-lg px-3 py-2 border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            selected
                              ? 'bg-[#233856] border-[#f6c344]/75'
                              : 'bg-[#1a293f] border-[#6e8eb0]/30 hover:bg-[#21334d]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-display font-bold text-xs text-[#f4efe6] truncate">
                              {rec.discovered ? lore.name : '??? Uncharted Beast'}
                            </div>
                            <div className="text-[11px] text-[#9db4cb] truncate">
                              <span className={`font-semibold ${rarityColor(spec.rarity)}`}>
                                {getRarityLabel(spec.rarity)}
                              </span>
                              <span> · {rec.discovered ? lore.temperament : lore.biomeZone}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 tabular-nums">
                            {eff.status === 'hunted' ? (
                              <>
                                <div className="text-xs font-bold text-[#8ed49a]">
                                  {eff.efficiencyPct}% {eff.grade}
                                </div>
                                <div className="text-[10px] text-[#9db4cb]">
                                  {rec.hunted} hunted
                                </div>
                              </>
                            ) : eff.status === 'scouted' ? (
                              <div className="text-[11px] font-semibold text-[#7be0ff]">
                                Scouted
                              </div>
                            ) : (
                              <div className="text-[11px] font-semibold text-[#6e849c]">
                                Unseen
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Creature Field Entry */}
                  <div
                    data-testid="bestiary-detail"
                    className="md:col-span-7 rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/40 p-3 flex flex-col justify-between gap-2"
                  >
                    {activeRecord.discovered ? (
                      <>
                        <div>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <h3 className="font-display font-bold text-base text-[#f4efe6] leading-tight">
                                {activeLore.name}
                              </h3>
                              <div className="text-[11px] italic text-[#9db4cb]">
                                {activeLore.taxonomicName}
                              </div>
                            </div>
                            <div className="text-xs font-bold">
                              <span className={rarityColor(activeSpec.rarity)}>
                                {getRarityLabel(activeSpec.rarity)}
                              </span>
                              <span className="text-[#6e8eb0]"> · </span>
                              <span className="text-[#dce6f2]">{activeLore.temperament}</span>
                            </div>
                          </div>

                          <div className="mt-1 text-[11px] text-[#b8cbe0] tabular-nums">
                            Habitat: {activeLore.biomeZone} · Vitality {activeSpec.maxHp} HP · Base Drop {activeSpec.peltDrop} Pelts / {activeSpec.goldDrop}g
                          </div>

                          {/* Hunting Efficiency Metrics */}
                          <div className="mt-2 rounded-md bg-[#152336] border border-[#6e8eb0]/30 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb]">
                                Hunting Efficiency
                              </span>
                              {activeEfficiency.status === 'hunted' ? (
                                <span className="text-xs font-bold tabular-nums text-[#8ed49a]">
                                  {activeEfficiency.efficiencyPct}% · {activeEfficiency.grade}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-[#7be0ff]">
                                  Scouted · 0 Hunts Logged
                                </span>
                              )}
                            </div>

                            {activeEfficiency.status === 'hunted' ? (
                              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                                <div>
                                  <div className="text-[10px] text-[#9db4cb]">Hunted</div>
                                  <div className="font-bold text-[#f4efe6]">{activeRecord.hunted}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#9db4cb]">Avg Strikes</div>
                                  <div className="font-bold text-[#f4efe6]">
                                    {activeEfficiency.avgHitsPerHunt}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#9db4cb]">Ambush Rate</div>
                                  <div className="font-bold text-[#f6c344]">
                                    {activeEfficiency.ambushRatePct}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#9db4cb]">Yield / Hunt</div>
                                  <div className="font-bold text-[#dce6f2]">
                                    {activeEfficiency.avgPeltsPerHunt}p · {activeEfficiency.avgGoldPerHunt}g
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-[#b8cbe0]">
                                Sighted {activeRecord.sightings}x in the forest. Hunt this creature to record strike efficiency, ambush accuracy, and average pelt yield.
                              </p>
                            )}

                            <div className="mt-1.5 pt-1.5 border-t border-[#6e8eb0]/20 text-[11px] text-[#c7d9ec]">
                              <span className="font-semibold text-[#f6c344]">
                                {activeLore.recommendedTool}:
                              </span>{' '}
                              {activeLore.huntingTip}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb] mb-0.5">
                            Arctic Field Lore
                          </div>
                          <p className="text-xs leading-snug text-[#dce6f2]">
                            {activeLore.lore}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="my-auto py-4 text-center flex flex-col items-center gap-1.5">
                        <div className={`text-xs font-bold uppercase tracking-wider ${rarityColor(activeSpec.rarity)}`}>
                          Undiscovered {getRarityLabel(activeSpec.rarity)} Fauna
                        </div>
                        <div className="font-display font-bold text-base text-[#f4efe6]">
                          ??? Uncharted Species
                        </div>
                        <p className="text-xs text-[#b8cbe0] max-w-md mt-1">
                          Reported near <span className="text-[#f4efe6] font-semibold">{activeLore.biomeZone}</span>. Approach within sightline or track this creature through the snow to unlock its rarity record, hunting efficiency telemetry, and Arctic lore.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : drawerTab === 'pets' ? (
              <div data-testid="pets-panel" className="flex flex-col gap-3">
                {/* Base Taming Pen Header & Upgrade Banner */}
                {(() => {
                  const penSpec = getTamingPenSpec(hud.pets.penLevel);
                  const nextPen = getNextBuildingUpgrade('tamingPen', hud.levels);
                  const penAffordable = nextPen ? canAfford(hud.resources, nextPen.cost) : false;
                  return (
                    <div className="rounded-lg bg-[#182940] border border-[#f472b6]/45 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f9a8d4]">
                            <PawPrint className="w-3.5 h-3.5 text-[#f472b6]" />
                            {hud.pets.penLevel > 0 ? penSpec.name : 'Frontier Taming Pen (Unbuilt)'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#121f31] border border-[#f472b6]/40 text-[10px] font-bold text-[#fbcfe8] tabular-nums">
                            Slots {hud.pets.tamedPets.length}/{hud.pets.maxSlots} · Passive {hud.pets.passiveTameRateMult.toFixed(2)}× · Perks {hud.pets.perkPotencyMult.toFixed(2)}×
                          </span>
                        </div>
                        <p className="text-xs text-[#c7d9ec]">
                          Walk calmly near wild Arctic companions for <span className="text-[#8ed49a] font-semibold">Passive Taming</span>, or offer Meat / Gold Treats (<span className="text-[#f9a8d4] font-semibold">[H] Feed</span>). Inactive pets rest inside your SW Base Taming Pen.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid="attract-stray-button"
                          onClick={onAttractWildStray}
                          className="px-3 py-1.5 rounded bg-[#2d172c] hover:bg-[#41213f] border border-[#f472b6]/70 text-xs font-bold text-[#fce7f3] cursor-pointer transition-colors"
                        >
                          Call Wild Stray
                        </button>
                        {nextPen && (
                          <button
                            type="button"
                            disabled={!penAffordable}
                            onClick={() => onBuyBuilding('tamingPen')}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                              penAffordable
                                ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                                : 'bg-[#2a3c55] text-[#6f859d] cursor-not-allowed'
                            }`}
                          >
                            {hud.pets.penLevel === 0 ? 'Build Pen' : `Upgrade Pen Lv ${nextPen.level}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Nearby Wild Pet Encounter Card */}
                {hud.pets.nearbyWildPet && (
                  <div
                    data-testid="nearby-wild-pet-card"
                    className="rounded-lg bg-[#25182d] border border-[#f472b6]/70 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-display font-bold text-[#fff1f2]">
                          Wild {hud.pets.nearbyWildPet.speciesLabel} Nearby ({hud.pets.nearbyWildPet.distance}m)
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                            hud.pets.nearbyWildPet.rarity,
                          )}`}
                        >
                          {hud.pets.nearbyWildPet.rarity}
                        </span>
                        {hud.pets.nearbyWildPet.passiveActive && (
                          <span className="px-1.5 py-0.5 rounded bg-[#173628] border border-[#8ed49a]/60 text-[10px] font-bold text-[#8ed49a]">
                            Calmly Bonding...
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#fbcfe8] mt-0.5">
                        Companion Perk: {hud.pets.nearbyWildPet.perkSummary}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-sm bg-[#120b17] border border-[#703668] overflow-hidden">
                          <div
                            className="h-full bg-[#f472b6] transition-[width] duration-150"
                            style={{ width: `${Math.min(100, Math.round(hud.pets.nearbyWildPet.progress))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-[#fce7f3] shrink-0">
                          {Math.round(hud.pets.nearbyWildPet.progress)}%
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="feed-wild-pet-panel-button"
                      onClick={onFeedWildPet}
                      className="px-3.5 py-2 rounded-md bg-[#db2777] hover:bg-[#ec4899] text-xs font-extrabold uppercase tracking-wide text-white cursor-pointer transition-colors shrink-0 tabular-nums"
                    >
                      Feed &amp; Tame [H] (
                      {(hud.resources.meat ?? 0) >= hud.pets.nearbyWildPet.feedMeatCost
                        ? `${hud.pets.nearbyWildPet.feedMeatCost} Meat`
                        : `${hud.pets.nearbyWildPet.feedGoldFallback}g`}
                      )
                    </button>
                  </div>
                )}

                {/* Active Companion Bonus Summary */}
                <div className="rounded-lg bg-[#152437] border border-[#6e8eb0]/35 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#9db4cb] uppercase tracking-wider text-[11px]">
                    Active Companion Aura:
                  </span>
                  {hud.pets.activePetUid ? (
                    <div className="flex flex-wrap items-center gap-2 font-bold tabular-nums text-[#dce6f2]">
                      {hud.pets.activeBonuses.moveSpeedMult > 1 && (
                        <span className="text-[#8ed49a]">
                          +{Math.round((hud.pets.activeBonuses.moveSpeedMult - 1) * 100)}% Speed
                        </span>
                      )}
                      {hud.pets.activeBonuses.damageMult > 1 && (
                        <span className="text-[#fca5a5]">
                          +{Math.round((hud.pets.activeBonuses.damageMult - 1) * 100)}% Damage
                        </span>
                      )}
                      {hud.pets.activeBonuses.gatherYieldMult > 1 && (
                        <span className="text-[#7be0ff]">
                          +{Math.round((hud.pets.activeBonuses.gatherYieldMult - 1) * 100)}% Harvest
                        </span>
                      )}
                      {hud.pets.activeBonuses.coldDecayMult < 1 && (
                        <span className="text-[#9fe8ff]">
                          -{Math.round((1 - hud.pets.activeBonuses.coldDecayMult) * 100)}% Chill
                        </span>
                      )}
                      {hud.pets.activeBonuses.goldTradeMult > 1 && (
                        <span className="text-[#f6c344]">
                          +{Math.round((hud.pets.activeBonuses.goldTradeMult - 1) * 100)}% Gold Trade
                        </span>
                      )}
                      {hud.pets.activeBonuses.packCapacityBonus > 0 && (
                        <span className="text-[#fde68a]">
                          +{hud.pets.activeBonuses.packCapacityBonus} Pack Cap
                        </span>
                      )}
                      {hud.pets.activeBonuses.magnetRadiusBonus > 0 && (
                        <span className="text-[#f9a8d4]">
                          +{hud.pets.activeBonuses.magnetRadiusBonus}m Magnet
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#9db4cb]">
                      No active companion following — adopt one in the wild or assign a pet below.
                    </span>
                  )}
                </div>

                {/* Tamed Pets Roster */}
                {hud.pets.tamedPets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {hud.pets.tamedPets.map((pet) => {
                      const spec = PET_SPECIES_SPECS[pet.speciesId];
                      const isActive = hud.pets.activePetUid === pet.uid;
                      return (
                        <div
                          key={pet.uid}
                          data-testid={`tamed-pet-card-${pet.speciesId}`}
                          className={`rounded-lg border p-3 flex flex-col justify-between gap-2 ${
                            isActive
                              ? 'bg-[#1d3147] border-[#f472b6]/80'
                              : 'bg-[#1d2e47] border-[#6e8eb0]/35'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display font-bold text-sm text-[#f4efe6]">
                                {pet.name} ({spec.name})
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${rarityBadgeStyle(
                                  pet.rarity,
                                )}`}
                              >
                                {pet.rarity}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-[#8ed49a]">
                              {spec.perkSummary}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#b8cbe0] tabular-nums">
                              <span>
                                {isActive ? 'Following You' : 'Resting in Taming Pen'} ·{' '}
                                {pet.tamedVia === 'passive' ? 'Calm Bond' : 'Fed'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[#f9a8d4] font-bold">
                                <Heart className="w-3 h-3" /> {Math.round(pet.affection)}%
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-[#6e8eb0]/25 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onPetCompanion(pet.uid)}
                              className="px-2.5 py-1 rounded bg-[#273d5c] hover:bg-[#324f75] text-[11px] font-bold text-[#fbcfe8] cursor-pointer transition-colors"
                            >
                              Treat (+15)
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetActivePet(isActive ? null : pet.uid)}
                              className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                                isActive
                                  ? 'bg-[#2a3c55] hover:bg-[#364d6d] text-[#dce6f2]'
                                  : 'bg-[#f472b6] hover:bg-[#f9a8d4] text-[#240b18]'
                              }`}
                            >
                              {isActive ? 'Send to Pen' : 'Follow Me'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#18283e] border border-[#6e8eb0]/35 p-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#f9a8d4] mb-2">
                      Wild Arctic Companions (6 Species to Tame)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PET_SPECIES_ORDER.map((sid) => {
                        const spec = PET_SPECIES_SPECS[sid];
                        return (
                          <div
                            key={sid}
                            className="rounded-md bg-[#121f31] border border-[#6e8eb0]/25 p-2 flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-[#f4efe6]">{spec.name}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase ${rarityBadgeStyle(
                                  spec.rarity,
                                )}`}
                              >
                                {spec.rarity}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#8ed49a]">
                              {spec.perkSummary}
                            </span>
                            <span className="text-[10px] text-[#9db4cb]">{spec.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : drawerTab === 'achievements' ? (
              <div data-testid="achievements-panel" className="flex flex-col gap-3">
                <div className="rounded-lg bg-[#182940] border border-[#f6c344]/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#f6c344]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f6c344]">
                        Frostwood Milestone Badges
                      </span>
                      <span
                        data-testid="achievements-unlocked-count"
                        className="px-2 py-0.5 rounded bg-[#121f31] border border-[#f6c344]/45 text-[11px] font-extrabold tabular-nums text-[#fde68a]"
                      >
                        {hud.achievementsUnlockedCount} / {hud.achievements.length} Unlocked
                      </span>
                    </div>
                    <p className="text-xs text-[#b8cbe0] mt-0.5">
                      Lifetime milestones tracked automatically across expeditions, hunts, crafting, and pet taming.
                    </p>
                  </div>
                  <div className="w-full sm:w-48 h-2 rounded-sm bg-[#0f1a29] border border-[#3e536b] overflow-hidden shrink-0">
                    <div
                      className="h-full bg-[#f6c344] transition-[width] duration-200"
                      style={{
                        width: `${Math.round(
                          (hud.achievementsUnlockedCount / Math.max(1, hud.achievements.length)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['all', `All (${hud.achievements.length})`],
                      ['unlocked', `Unlocked (${hud.achievementsUnlockedCount})`],
                      ['gathering', 'Gathering'],
                      ['hunting', 'Hunting'],
                      ['crafting', 'Camp & Gear'],
                      ['economy', 'Economy & Trials'],
                      ['exploration', 'Exploration'],
                      ['pets', 'Pets'],
                    ] as const
                  ).map(([filterId, label]) => (
                    <button
                      key={filterId}
                      type="button"
                      data-testid={`ach-filter-${filterId}`}
                      onClick={() => setAchievementFilter(filterId)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        achievementFilter === filterId
                          ? 'bg-[#f6c344] text-[#131d2b]'
                          : 'bg-[#1d2e47] text-[#dce6f2] hover:bg-[#273d5c]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {hud.achievements
                    .filter((ach) => {
                      if (achievementFilter === 'all') return true;
                      if (achievementFilter === 'unlocked') return ach.unlocked;
                      return ach.category === achievementFilter;
                    })
                    .map((ach) => {
                      const pct = Math.max(
                        0,
                        Math.min(100, (ach.progress / Math.max(1, ach.target)) * 100),
                      );
                      return (
                        <div
                          key={ach.id}
                          data-testid={`achievement-card-${ach.id}`}
                          className={`rounded-lg border p-3 flex flex-col justify-between gap-2 ${
                            ach.unlocked
                              ? 'bg-[#232b1c] border-[#f6c344]/75 shadow-[0_4px_14px_rgba(246,195,68,0.14)]'
                              : 'bg-[#18263b] border-[#6e8eb0]/30 opacity-90'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Trophy
                                  className={`w-4 h-4 shrink-0 ${
                                    ach.unlocked ? 'text-[#f6c344]' : 'text-[#5b718a]'
                                  }`}
                                />
                                <span className="font-display font-bold text-sm text-[#f4efe6] truncate">
                                  {ach.title}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                  ach.unlocked
                                    ? 'bg-[#173628] border-[#8ed49a]/70 text-[#8ed49a]'
                                    : rarityBadgeStyle(ach.rarity)
                                }`}
                              >
                                {ach.unlocked ? 'Unlocked' : ach.rarity}
                              </span>
                            </div>
                            <p className="text-xs text-[#b8cbe0] mt-1">{ach.description}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1.5 rounded-sm bg-[#0f1a29] border border-[#3e536b] overflow-hidden">
                              <div
                                className={`h-full transition-[width] duration-200 ${
                                  ach.unlocked ? 'bg-[#8ed49a]' : 'bg-[#f6c344]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold tabular-nums text-[#dce6f2] shrink-0">
                              {Math.min(ach.progress, ach.target)}/{ach.target}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : drawerTab === 'skills' ? (
              <div data-testid="skills-panel" className="flex flex-col gap-2">
                {/* Branch XP Progress & Skill Points Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#1d2e47] border border-[#8ed49a]/40 p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-display font-bold text-sm text-[#f4efe6] flex items-center gap-1.5">
                          <span className="text-[#8ed49a]">Gathering Mastery</span>
                          <span
                            data-testid="gathering-level"
                            className="text-xs font-extrabold tabular-nums text-[#8ed49a]"
                          >
                            Lv {hud.skills.gatheringLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9db4cb]">
                          Chop trees, break granite &amp; harvest frost shards to earn points
                        </div>
                      </div>
                      <div
                        data-testid="gathering-points"
                        className={`px-2 py-0.5 rounded border text-xs font-bold tabular-nums shrink-0 ${
                          hud.skills.gatheringPoints > 0
                            ? 'bg-[#173628] border-[#8ed49a]/70 text-[#8ed49a]'
                            : 'bg-[#152336] border-[#6e8eb0]/30 text-[#9db4cb]'
                        }`}
                      >
                        {hud.skills.gatheringPoints} Pt{hud.skills.gatheringPoints === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-sm bg-[#0f1a29] border border-[#3e536b] overflow-hidden">
                        <div
                          className="h-full bg-[#8ed49a] transition-[width] duration-200"
                          style={{
                            width: `${
                              gatherXpNext > 0
                                ? Math.min(100, (hud.skills.gatheringXp / gatherXpNext) * 100)
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-[#dce6f2] shrink-0">
                        {gatherXpNext > 0
                          ? `${hud.skills.gatheringXp}/${gatherXpNext} XP`
                          : 'MAX LV'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#1d2e47] border border-[#f6c344]/40 p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-display font-bold text-sm text-[#f4efe6] flex items-center gap-1.5">
                          <span className="text-[#f6c344]">Hunting Mastery</span>
                          <span
                            data-testid="hunting-level"
                            className="text-xs font-extrabold tabular-nums text-[#f6c344]"
                          >
                            Lv {hud.skills.huntingLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9db4cb]">
                          Track, ambush &amp; hunt Arctic wildlife to earn points
                        </div>
                      </div>
                      <div
                        data-testid="hunting-points"
                        className={`px-2 py-0.5 rounded border text-xs font-bold tabular-nums shrink-0 ${
                          hud.skills.huntingPoints > 0
                            ? 'bg-[#382b12] border-[#f6c344]/70 text-[#f6c344]'
                            : 'bg-[#152336] border-[#6e8eb0]/30 text-[#9db4cb]'
                        }`}
                      >
                        {hud.skills.huntingPoints} Pt{hud.skills.huntingPoints === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-sm bg-[#0f1a29] border border-[#3e536b] overflow-hidden">
                        <div
                          className="h-full bg-[#f6c344] transition-[width] duration-200"
                          style={{
                            width: `${
                              huntXpNext > 0
                                ? Math.min(100, (hud.skills.huntingXp / huntXpNext) * 100)
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-[#dce6f2] shrink-0">
                        {huntXpNext > 0
                          ? `${hud.skills.huntingXp}/${huntXpNext} XP`
                          : 'MAX LV'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Permanent Passives Bar & Respec */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#142234] border border-[#6e8eb0]/30 px-3 py-1.5 text-[11px] tabular-nums">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#dce6f2]">
                    <span>
                      Speed{' '}
                      <strong className="text-[#8ed49a]">
                        +{Math.round((hud.skillBonuses.moveSpeedMult - 1) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Pack Bonus{' '}
                      <strong className="text-[#8ed49a]">+{hud.skillBonuses.packBonus}</strong>
                    </span>
                    <span>
                      Harvest{' '}
                      <strong className="text-[#8ed49a]">
                        +{Math.round((hud.skillBonuses.gatherYieldMult - 1) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Hunt Dmg{' '}
                      <strong className="text-[#f6c344]">
                        +{Math.round((hud.skillBonuses.huntDamageMult - 1) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Pelts{' '}
                      <strong className="text-[#f6c344]">
                        +{Math.round((hud.skillBonuses.peltYieldMult - 1) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Max HP{' '}
                      <strong className="text-[#7be0ff]">+{hud.skillBonuses.maxHpBonus}</strong>
                    </span>
                  </div>

                  {spentSkillPoints > 0 && (
                    <button
                      type="button"
                      data-testid="respec-skills-button"
                      onClick={onRespecSkills}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#22354f] hover:bg-[#2d4464] border border-[#6e8eb0]/40 text-[11px] font-semibold text-[#dce6f2] cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Respec ({spentSkillPoints})
                    </button>
                  )}
                </div>

                {/* Permanent Passive Perk Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SKILL_PERK_ORDER.map((perkId) => {
                    const spec = SKILL_PERKS[perkId];
                    const rank = hud.skills.ranks[perkId] ?? 0;
                    const maxed = rank >= spec.maxRank;
                    const unlockable = canUnlockSkillPerk(hud.skills, perkId);
                    const isGathering = spec.branch === 'gathering';
                    const cost = getSkillPerkUpgradeCost(rank);
                    const reqLvl = getSkillPerkRequiredLevel(rank);
                    const branchLvl = isGathering
                      ? hud.skills.gatheringLevel
                      : hud.skills.huntingLevel;
                    const branchPoints = isGathering
                      ? hud.skills.gatheringPoints
                      : hud.skills.huntingPoints;
                    const activeSummary = rank > 0 ? spec.rankSummaries[rank - 1] : null;
                    const nextSummary = !maxed ? spec.rankSummaries[rank] : null;

                    return (
                      <div
                        key={perkId}
                        data-testid={`skill-perk-${perkId}`}
                        className="rounded-lg bg-[#1d2e47] border border-[#6e8eb0]/35 p-2 flex flex-col justify-between gap-1.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-display font-bold text-sm text-[#f4efe6] leading-tight">
                              {spec.name}
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                                isGathering
                                  ? 'bg-[#173628] border-[#8ed49a]/55 text-[#8ed49a]'
                                  : 'bg-[#382b12] border-[#f6c344]/55 text-[#f6c344]'
                              }`}
                            >
                              {isGathering ? 'Gathering' : 'Hunting'}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9db4cb]">
                              {spec.tagline}
                            </span>
                            <div className="flex items-center gap-1" aria-label={`Rank ${rank} of ${spec.maxRank}`}>
                              {Array.from({ length: spec.maxRank }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`w-3 h-1.5 rounded-sm ${
                                    idx < rank
                                      ? isGathering
                                        ? 'bg-[#8ed49a]'
                                        : 'bg-[#f6c344]'
                                      : 'bg-[#0f1a29] border border-[#3e536b]'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-[10px] font-bold tabular-nums text-[#dce6f2]">
                                {rank}/{spec.maxRank}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-[#b8cbe0] leading-snug mt-1">
                            {spec.description}
                          </p>

                          {activeSummary && (
                            <div className="mt-1 text-[11px] font-semibold text-[#8ed49a]">
                              Active: {activeSummary}
                            </div>
                          )}
                          {nextSummary && (
                            <div className="mt-0.5 text-[11px] font-semibold text-[#dce6f2]">
                              {rank > 0 ? 'Next Rank: ' : 'Rank 1: '}
                              {nextSummary}
                            </div>
                          )}
                        </div>

                        <div className="pt-1.5 border-t border-[#6e8eb0]/20 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#9db4cb] tabular-nums">
                            {maxed
                              ? 'Permanent Mastery'
                              : `Req ${isGathering ? 'Gather' : 'Hunt'} Lv ${reqLvl} · Cost ${cost} Pt${cost > 1 ? 's' : ''}`}
                          </span>
                          <button
                            type="button"
                            disabled={!unlockable || maxed}
                            data-testid={`unlock-perk-${perkId}`}
                            onClick={() => onUnlockSkillPerk(perkId)}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors tabular-nums ${
                              maxed
                                ? 'bg-[#173628] text-[#8ed49a] cursor-default'
                                : unlockable
                                  ? isGathering
                                    ? 'bg-[#8ed49a] hover:bg-[#a6e5b1] text-[#0f1d17] cursor-pointer'
                                    : 'bg-[#f6c344] hover:bg-[#ffd05c] text-[#131d2b] cursor-pointer'
                                  : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                            }`}
                          >
                            {maxed
                              ? 'Maxed'
                              : branchLvl < reqLvl
                                ? `Need Lv ${reqLvl}`
                                : branchPoints < cost
                                  ? `Need ${cost} Pt${cost > 1 ? 's' : ''}`
                                  : `Unlock (${cost} Pt)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : drawerTab === 'daily' ? (
              <div data-testid="drawer-daily-panel" className="flex flex-col gap-3">
                <div className="rounded-lg bg-[#18283e] border border-[#f6c344]/45 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#f6c344]" />
                      <h3 className="text-sm font-bold text-[#f7f2e8] uppercase tracking-wider">
                        7-Day Boreal Supply Drop
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-[#2c2214] border border-[#f6c344]/50 text-[10px] font-extrabold text-[#fde68a] tabular-nums">
                        Streak: {hud.dailyLogin.streakDay} Day{hud.dailyLogin.streakDay === 1 ? '' : 's'} · Total Claimed: {hud.dailyLogin.totalDaysClaimed}
                      </span>
                    </div>
                    <p className="text-xs text-[#b8cbe0] mt-1">
                      Open the expedition each real-world day to claim bonus resources and rare crafted supplies directly into your pack.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="drawer-claim-daily-btn"
                    disabled={!hud.dailyLogin.canClaimToday}
                    onClick={onClaimDailyLoginReward}
                    className={`shrink-0 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      hud.dailyLogin.canClaimToday
                        ? 'bg-[#f6c344] hover:bg-[#ffd463] text-[#131d2b] cursor-pointer shadow-[0_0_16px_rgba(246,195,68,0.4)]'
                        : 'bg-[#22354f] text-[#7f96ad] cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    {hud.dailyLogin.canClaimToday
                      ? `Claim Day ${hud.dailyLogin.todayReward.day} Reward`
                      : 'Claimed Today — Come Back Tomorrow'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                  {hud.dailyLogin.schedule.map((reward) => {
                    const isToday = reward.day === hud.dailyLogin.todayReward.day;
                    const isPastClaimed =
                      (!hud.dailyLogin.canClaimToday && reward.day <= hud.dailyLogin.todayReward.day) ||
                      (hud.dailyLogin.canClaimToday && reward.day < hud.dailyLogin.todayReward.day);
                    const resourceEntries = Object.entries(reward.resources) as Array<[keyof ResourceCounts, number | undefined]>;
                    const craftItemEntries = Object.entries(reward.craftItems) as Array<[CraftItemId, number | undefined]>;
                    return (
                      <div
                        key={reward.day}
                        data-testid={`daily-reward-day-${reward.day}`}
                        className={`rounded-lg border p-3 flex flex-col justify-between gap-2 ${
                          isToday && hud.dailyLogin.canClaimToday
                            ? 'bg-[#2c2214]/90 border-[#f6c344] shadow-[0_0_14px_rgba(246,195,68,0.28)]'
                            : isPastClaimed
                              ? 'bg-[#132620]/85 border-[#8ed49a]/55'
                              : 'bg-[#17263b] border-[#516d8c]/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#fde68a]">
                              Day {reward.day}
                            </span>
                            {isPastClaimed ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#163828] text-[#8ed49a] text-[9px] font-bold uppercase">
                                Claimed
                              </span>
                            ) : isToday && hud.dailyLogin.canClaimToday ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#f6c344] text-[#131d2b] text-[9px] font-extrabold uppercase">
                                Ready
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold uppercase text-[#88a0b9]">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-[#f4efe6] mt-1">{reward.title}</div>
                          <p className="text-[11px] text-[#9db4cb] mt-0.5 leading-snug">
                            {reward.subtitle}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1 pt-1.5 border-t border-[#6e8eb0]/25 text-[11px]">
                          <div className="flex flex-wrap gap-1">
                            {resourceEntries.map(([resKey, amt]) =>
                              (amt ?? 0) > 0 ? (
                                <span
                                  key={resKey}
                                  className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#6e8eb0]/35 text-[#dce6f2] font-bold tabular-nums uppercase text-[10px]"
                                >
                                  +{amt} {resKey}
                                </span>
                              ) : null,
                            )}
                          </div>
                          {craftItemEntries.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {craftItemEntries.map(([itemId, count]) => {
                                if (!count || count <= 0) return null;
                                const recipe = getCraftRecipe(itemId);
                                return (
                                  <span
                                    key={itemId}
                                    className="px-1.5 py-0.5 rounded bg-[#1f334d] border border-[#7be0ff]/45 text-[#9fe8ff] font-bold text-[10px]"
                                  >
                                    +{count}× {recipe.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : drawerTab === 'mystery' ? (
              <div data-testid="drawer-mystery-panel" className="flex flex-col gap-3.5">
                {/* Mysteries Unknown Header & Lore Banner */}
                <div className="rounded-xl bg-[#160b26] border border-[#d946ef]/60 p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#e879f9]" />
                      <h3 className="text-sm font-extrabold text-[#fdf4ff] uppercase tracking-wider">
                        Mysteries Unknown Emporium — Xylar the Unknown
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-[#3b0764] border border-[#d946ef]/70 text-[10px] font-extrabold uppercase tracking-wider text-[#f5d0fe]">
                        Zone 4 &amp; Zone 5 Singularity Sanctum
                      </span>
                      {hud.nearMysteryShop && (
                        <span className="px-2 py-0.5 rounded bg-[#14532d] border border-[#4ade80]/70 text-[10px] font-extrabold uppercase tracking-wider text-[#bbf7d0]">
                          At Shrine [E / Y]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#e9d5ff] mt-1 leading-relaxed">
                      Harvest <span className="text-[#fb923c] font-bold">Ember-Vein Pyrewood</span>,{' '}
                      <span className="text-[#f87171] font-bold">Infernal Brimstone</span>, and{' '}
                      <span className="text-[#38bdf8] font-bold">Voltaic Fulminite</span> in{' '}
                      <span className="text-[#fde68a] font-bold">Zone 4 (Obsidian Caldera)</span>, or venture into{' '}
                      <span className="text-[#e879f9] font-bold">Zone 5 (Starfall Eternal Zero)</span> for{' '}
                      <span className="text-[#c084fc] font-bold">Astral Void-Heartwood</span> &amp;{' '}
                      <span className="text-[#f472b6] font-bold">Singularity Dark-Matter Monoliths</span> to forge Mythic Visual Panoply &amp; Forbidden Relics.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="mystery-warp-level4"
                      onClick={() => onSelectZone('level4')}
                      className="px-3 py-1.5 rounded-lg bg-[#3b1510] hover:bg-[#521d16] border border-[#f97316]/75 text-xs font-extrabold text-[#fed7aa] cursor-pointer transition-colors"
                    >
                      Warp Zone 4 (Caldera)
                    </button>
                    <button
                      type="button"
                      data-testid="mystery-warp-level5"
                      onClick={() => onSelectZone('level5')}
                      className="px-3 py-1.5 rounded-lg bg-[#2e1042] hover:bg-[#41175c] border border-[#d946ef]/80 text-xs font-extrabold text-[#f5d0fe] cursor-pointer transition-colors"
                    >
                      Warp Zone 5 (Starfall)
                    </button>
                  </div>
                </div>

                {/* Rare & Mythic Material Vault Bar */}
                <div
                  data-testid="rare-materials-vault"
                  className="rounded-xl bg-[#11192a] border border-[#6e8eb0]/45 p-3"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c7d6e6]">
                      Rare Woods &amp; Ores Vault (Zones 4 &amp; 5)
                    </span>
                    <span className="text-[11px] text-[#9db4cb]">
                      Chop glowing Pyrewood / Void-Heartwood trees &amp; mine Brimstone / Fulminite / Dark-Matter spires
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {RARE_MATERIAL_ORDER.map((matId) => {
                      const spec = RARE_MATERIAL_SPECS[matId];
                      const count = hud.rareMaterials?.[matId] ?? 0;
                      return (
                        <div
                          key={matId}
                          data-testid={`rare-mat-${matId}`}
                          className="rounded-lg bg-[#162338] border border-[#6e8eb0]/40 px-2.5 py-2 flex flex-col justify-between"
                          style={{ borderColor: count > 0 ? spec.accentHex : undefined }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="text-[11px] font-extrabold truncate"
                              style={{ color: spec.accentHex }}
                            >
                              {spec.shortName}
                            </span>
                            <span className="text-xs font-extrabold tabular-nums text-[#f8fafc]">
                              {count}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#94a3b8] truncate mt-0.5">
                            {spec.sourceHint}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mythic Visual Gear & Equipment Ascensions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#f5d0fe]">
                      Mythic Visual Gear &amp; Elemental / Dark-Matter Ascensions
                    </h4>
                    <span className="text-[11px] text-[#cbd5e1]">
                      Equipped Ascension transforms your 3D Armor, Crown, Back Rift, Axe &amp; Bow
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {MYTHIC_ASCENSION_ORDER.map((ascId) => {
                      const spec = MYTHIC_ASCENSION_SPECS[ascId];
                      const isUnlocked = hud.unlockedAscensions?.includes(ascId) ?? false;
                      const isEquipped = hud.equippedAscension === ascId;
                      const canUnlock = canUnlockMythicAscension(
                        ascId,
                        hud.resources,
                        hud.rareMaterials,
                        hud.unlockedAscensions ?? [],
                      );

                      return (
                        <div
                          key={ascId}
                          data-testid={`ascension-card-${ascId}`}
                          className={`rounded-xl p-3.5 border flex flex-col justify-between gap-3 transition-colors ${
                            isEquipped
                              ? 'bg-[#261138] border-[#e879f9] shadow-[0_0_20px_rgba(217,70,239,0.28)]'
                              : isUnlocked
                                ? 'bg-[#192338] border-[#7be0ff]/65'
                                : 'bg-[#141e30] border-[#516d8c]/45'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-[#0f172a]"
                                    style={{ backgroundColor: spec.primaryHex }}
                                  >
                                    {spec.elementLabel}
                                  </span>
                                  {isEquipped && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#f6c344] text-[#131d2b] text-[9px] font-extrabold uppercase">
                                      Equipped
                                    </span>
                                  )}
                                  {!isEquipped && isUnlocked && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/25 border border-[#4ade80]/60 text-[#bbf7d0] text-[9px] font-extrabold uppercase">
                                      Unlocked
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-sm font-extrabold text-[#f8fafc] mt-1">
                                  {spec.name}
                                </h5>
                                <div className="text-[11px] font-semibold text-[#cbd5e1]">
                                  {spec.subtitle}
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-[#94a3b8] mt-2 leading-relaxed">
                              {spec.description}
                            </p>

                            {/* Stat & Visual Badges */}
                            <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] font-bold tabular-nums">
                              <span className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#f97316]/50 text-[#fed7aa]">
                                DMG x{spec.bonuses.damageMult.toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#38bdf8]/50 text-[#bae6fd]">
                                Yield x{spec.bonuses.gatherYieldMult.toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#4ade80]/50 text-[#bbf7d0]">
                                +{spec.bonuses.maxHpBonus} Max HP · +{spec.bonuses.hpRegenPerSec}/s
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#e879f9]/55 text-[#f5d0fe]">
                                {spec.bonuses.onHitEffectLabel} (+{Math.round(spec.bonuses.onHitBonusDamagePct * 100)}%)
                              </span>
                            </div>

                            <div className="mt-2 text-[10px] text-[#e2e8f0] bg-[#0d1524] rounded-md px-2 py-1 border border-[#475569]/40">
                              <span className="font-bold text-[#f5d0fe]">3D Visual Gear: </span>
                              {spec.visualSummary}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#516d8c]/30 flex flex-col gap-2">
                            {!isUnlocked && (
                              <div className="flex flex-col gap-1.5">
                                <CostTags cost={spec.resourceCost} resources={hud.resources} />
                                <div className="flex flex-wrap gap-1">
                                  {RARE_MATERIAL_ORDER.map((matId) => {
                                    const req = spec.rareMaterialCost[matId] ?? 0;
                                    if (req <= 0) return null;
                                    const have = hud.rareMaterials?.[matId] ?? 0;
                                    const matSpec = RARE_MATERIAL_SPECS[matId];
                                    const ok = have >= req;
                                    return (
                                      <span
                                        key={matId}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums border ${
                                          ok
                                            ? 'bg-[#143024] border-[#4ade80]/60 text-[#bbf7d0]'
                                            : 'bg-[#2c161e] border-[#f87171]/60 text-[#fecaca]'
                                        }`}
                                      >
                                        {matSpec.shortName} {have}/{req}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {isUnlocked ? (
                              <button
                                type="button"
                                data-testid={`ascension-action-${ascId}`}
                                onClick={() => onEquipAscension(isEquipped ? null : ascId)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors ${
                                  isEquipped
                                    ? 'bg-[#334155] hover:bg-[#475569] text-[#f8fafc]'
                                    : 'bg-[#d946ef] hover:bg-[#e879f9] text-[#14071f]'
                                }`}
                              >
                                {isEquipped ? 'Unequip Mythic Panoply' : 'Equip Mythic Panoply'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid={`ascension-action-${ascId}`}
                                disabled={!canUnlock}
                                onClick={() => onUnlockAscension(ascId)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                                  canUnlock
                                    ? 'bg-[#f6c344] hover:bg-[#ffd463] text-[#131d2b] cursor-pointer'
                                    : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                                }`}
                              >
                                {canUnlock ? 'Forge & Equip Mythic Gear' : 'Requires Rare Zone 4/5 Materials'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mysteries Unknown Relics & Elixirs */}
                <div className="flex flex-col gap-2 pt-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#7be0ff]">
                    Mysteries Unknown Forbidden Relics &amp; Elixirs
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {MYSTERY_SHOP_ITEM_ORDER.map((itemId) => {
                      const item = MYSTERY_SHOP_ITEMS[itemId];
                      const affordable = canBuyMysteryShopItem(
                        itemId,
                        hud.resources,
                        hud.rareMaterials,
                      );
                      return (
                        <div
                          key={itemId}
                          data-testid={`mystery-item-${itemId}`}
                          className="rounded-xl bg-[#152236] border border-[#6e8eb0]/45 p-3 flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="text-xs font-extrabold"
                                style={{ color: item.accentHex }}
                              >
                                {item.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#f6c344]/50 text-[10px] font-extrabold text-[#fde68a] tabular-nums">
                                {item.goldCost}g
                              </span>
                            </div>
                            <div className="text-[10px] font-semibold text-[#cbd5e1] mt-0.5">
                              {item.effectSummary}
                            </div>
                            <p className="text-[11px] text-[#94a3b8] mt-1 leading-snug">
                              {item.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#516d8c]/30 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1">
                              {RARE_MATERIAL_ORDER.map((matId) => {
                                const req = item.rareMaterialCost[matId] ?? 0;
                                if (req <= 0) return null;
                                const have = hud.rareMaterials?.[matId] ?? 0;
                                const matSpec = RARE_MATERIAL_SPECS[matId];
                                const ok = have >= req;
                                return (
                                  <span
                                    key={matId}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums border ${
                                      ok
                                        ? 'bg-[#143024] border-[#4ade80]/60 text-[#bbf7d0]'
                                        : 'bg-[#2c161e] border-[#f87171]/60 text-[#fecaca]'
                                    }`}
                                  >
                                    {matSpec.shortName} {have}/{req}
                                  </span>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              data-testid={`buy-mystery-item-${itemId}`}
                              disabled={!affordable}
                              onClick={() => onBuyMysteryItem(itemId)}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                                affordable
                                  ? 'bg-[#7be0ff] hover:bg-[#9fe8ff] text-[#0c1928] cursor-pointer'
                                  : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                              }`}
                            >
                              {affordable ? 'Invoke Relic' : 'Insufficient Tribute'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : drawerTab === 'saves' ? (
              <div data-testid="drawer-saves-panel" className="flex flex-col gap-3">
                <div className="rounded-lg bg-[#18283e] border border-[#7be0ff]/45 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4 text-[#7be0ff]" />
                      <h3 className="text-sm font-bold text-[#f7f2e8] uppercase tracking-wider">
                        Expedition Save &amp; Load Manager
                      </h3>
                    </div>
                    <p className="text-xs text-[#b8cbe0] mt-1">
                      Save your current position, zone, resources, tools, armor, backpack items, and tamed pets to any slot, or restore a saved expedition at any time. Press <span className="text-[#f6c344] font-bold">[F5]</span> for instant Quick Save to Slot 1.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="drawer-quick-save-btn"
                    onClick={() => onSaveGame('slot1')}
                    className="shrink-0 px-4 py-2 rounded-lg bg-[#8ed49a] hover:bg-[#a5e3b0] text-[#0f1d17] text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Quick Save Slot 1 [F5]
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAVE_SLOT_IDS.map((slotId) => {
                    const slot = hud.saveSlots[slotId];
                    const isAuto = slotId === 'autosave';
                    const slotTitle =
                      slotId === 'autosave'
                        ? 'Autosave Slot'
                        : `Manual Slot ${slotId.replace('slot', '')}`;
                    return (
                      <div
                        key={slotId}
                        data-testid={`drawer-save-card-${slotId}`}
                        className="rounded-lg bg-[#17263b] border border-[#6e8eb0]/45 p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7be0ff]">
                              {slotTitle}
                            </span>
                            {slot ? (
                              <span className="text-[11px] font-semibold text-[#9db4cb] tabular-nums">
                                {new Date(slot.savedAt).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold uppercase text-[#6d839b]">
                                Empty Slot
                              </span>
                            )}
                          </div>

                          {slot ? (
                            <div className="mt-2 flex flex-col gap-1.5">
                              <div className="text-xs font-bold text-[#f4efe6]">
                                {slot.label} · Day {slot.dayNumber}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#c7d6e6] tabular-nums">
                                <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#6e8eb0]/30">
                                  HP {Math.round(slot.hp)}/{slot.maxHp}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#6e8eb0]/30">
                                  Warmth {Math.round(slot.warmth)}/{slot.maxWarmth}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#f6c344]/40 text-[#fde68a]">
                                  {slot.resources.gold}g
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#6e8eb0]/30">
                                  Wood {slot.resources.wood} · Stone {slot.resources.stone} · Ice {slot.resources.ice}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-[#101c2c] border border-[#6e8eb0]/30">
                                  Pets {slot.tamedPets.length}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#88a0b9] mt-2">
                              No expedition recorded in this slot yet. Click Save Current Run below to store a snapshot here.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#6e8eb0]/25">
                          <button
                            type="button"
                            data-testid={`drawer-save-${slotId}`}
                            onClick={() => onSaveGame(slotId)}
                            className="px-3 py-1.5 rounded-md bg-[#223854] hover:bg-[#2d4a6e] border border-[#7be0ff]/60 text-xs font-bold text-[#c9f4ff] cursor-pointer transition-colors inline-flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isAuto ? 'Overwrite Autosave' : 'Save Current Run'}
                          </button>

                          <button
                            type="button"
                            data-testid={`drawer-load-${slotId}`}
                            disabled={!slot}
                            onClick={() => onLoadGame(slotId)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                              slot
                                ? 'bg-[#f6c344] hover:bg-[#ffd463] text-[#131d2b] cursor-pointer'
                                : 'bg-[#1b2a3f] text-[#6d839b] cursor-not-allowed'
                            }`}
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Load Run
                          </button>

                          {slot && (
                            <button
                              type="button"
                              data-testid={`drawer-delete-${slotId}`}
                              onClick={() => onDeleteSave(slotId)}
                              className="ml-auto px-2.5 py-1.5 rounded-md bg-[#2b1820] hover:bg-[#3f202c] border border-[#ef7b73]/50 text-xs font-bold text-[#fca5a5] cursor-pointer transition-colors inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {drawerTab === 'travel' && (
              <div data-testid="travel-tab-panel" className="flex flex-col gap-4">
                <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/20">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7be0ff]">
                      Fast Travel &amp; Expedition Zones
                    </h3>
                    <span className="text-[11px] font-semibold text-[#9db4cb]">
                      Current: {hud.zone.name}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'level1' as ZoneId, label: 'L1 · Frostwood Valley (1x)' },
                        { id: 'level2' as ZoneId, label: 'L2 · Glacial Highlands (3x)' },
                        { id: 'level3' as ZoneId, label: 'L3 · Rimefang Abyss (9x)' },
                        { id: 'level4' as ZoneId, label: 'L4 · Obsidian Caldera (27x)' },
                        { id: 'level5' as ZoneId, label: 'L5 · Starfall Zero (81x)' },
                        { id: 'city' as ZoneId, label: 'Frostcave City (Sanctuary)' },
                      ]
                    ).map((item) => {
                      const active = hud.zone.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`menu-travel-${item.id}`}
                          onClick={() => {
                            if (!active) onSelectZone(item.id);
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold text-left cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#1f5c82] border-[#7be0ff] text-[#f0f9ff]'
                              : 'bg-[#101c2d] hover:bg-[#1a2c46] border-[#6e8eb0]/30 text-[#dce6f2]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      data-testid="menu-travel-lake"
                      onClick={() => onTravelToFishingLake()}
                      className="px-3 py-2 rounded-lg border border-[#38bdf8]/60 bg-[#0f2f46] hover:bg-[#14405f] text-xs font-bold text-[#9fe8ff] text-left cursor-pointer inline-flex items-center gap-2 transition-colors"
                    >
                      <Fish className="w-3.5 h-3.5 shrink-0" />
                      <span>Crystal Lagoon Pier</span>
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#f6c344] pb-2 border-b border-[#6e8eb0]/20">
                      <span>Day {hud.dailyObjective.dayNumber} Objective</span>
                      <span className="tabular-nums">
                        {hud.dailyObjective.progress}/{hud.dailyObjective.target}
                      </span>
                    </div>
                    <div className="mt-2.5 text-sm font-bold text-[#f4efe6]">
                      {hud.dailyObjective.title}
                    </div>
                    <div className="mt-1 text-xs text-[#9db4cb]">
                      {hud.dailyObjective.completed
                        ? 'Objective completed!'
                        : hud.dailyObjective.failed
                          ? 'Expired for today.'
                          : `${Math.ceil(hud.dailyObjective.timeLeft)}s remaining`}
                    </div>
                  </section>

                  <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#7be0ff] pb-2 border-b border-[#6e8eb0]/20">
                      <span>Weather &amp; Hazard</span>
                      <span className="uppercase">{hud.zoneWeatherEffect.severity}</span>
                    </div>
                    <div className="mt-2.5 text-sm font-bold text-[#f4efe6]">
                      {hud.zoneWeatherEffect.name} ({weatherProfile.label})
                    </div>
                    <div className="mt-1 text-xs text-[#9db4cb] tabular-nums">
                      Wind Resist {hud.zoneWeatherEffect.windResistancePct}/{hud.zoneWeatherEffect.requiredWindResistancePct}% · Heat {hud.zoneWeatherEffect.heatRetentionPct}/{hud.zoneWeatherEffect.requiredHeatRetentionPct}%
                    </div>
                  </section>
                </div>

                <section className="rounded-xl bg-[#162438] border border-[#6e8eb0]/35 p-3.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#6e8eb0]/20">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#e2eefb]">
                      <MessageSquare className="w-3.5 h-3.5 text-[#7be0ff]" />
                      <span>Activity &amp; Loot Log ({hud.chatLogs.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['all', 'loot', 'combat', 'notification'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setChatFilter(tab)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${
                            chatFilter === tab
                              ? 'bg-[#d98a2b] text-[#131d2b]'
                              : 'bg-[#101c2d] text-[#9db4cb] hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 max-h-44 overflow-y-auto space-y-1 text-xs">
                    {hud.chatLogs
                      .filter((e) =>
                        chatFilter === 'all'
                          ? true
                          : chatFilter === 'loot'
                            ? e.category === 'drop' || e.category === 'loot'
                            : e.category === chatFilter,
                      )
                      .slice(-20)
                      .reverse()
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-2 rounded bg-[#101c2d] px-2 py-1 border border-[#6e8eb0]/15"
                        >
                          <span className="font-mono text-[10px] text-[#7f97b0] shrink-0">
                            {entry.timestamp}
                          </span>
                          <span className="text-[#dce6f2]">{entry.text}</span>
                        </div>
                      ))}
                    {hud.chatLogs.length === 0 && (
                      <div className="text-xs text-[#7f97b0] italic py-2">
                        No activity logged yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {drawerTab === 'settings' && (
              <div data-testid="settings-tab-panel" className="flex flex-col gap-4">
                <SettingsPanel
                  settings={hud.settings}
                  onUpdateSettings={onUpdateSettings}
                  onResetSettings={onResetSettings}
                />
              </div>
            )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile On-Screen Touch Controls Pad (Phones & Compact Viewports) */}
        {!drawerOpen && (
          <div
            data-testid="mobile-touch-controls"
            className="sm:hidden pointer-events-none w-full flex items-end justify-between px-1 pb-1"
          >
            {/* 360° Ergonomic Analog Touchpad */}
            <TouchMovementPad onTouchMove={onTouchMove} />

            {/* Mobile Action Buttons Cluster */}
            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Toggle Bow Auto-Attack"
                  onClick={onToggleBowAutoAttack}
                  className={`h-8 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 shadow-[0_4px_12px_rgba(8,14,24,0.55)] ${
                    hud.bowAutoAttack
                      ? 'bg-[#4f3214]/95 border-[#f6c344]/80 text-[#fde68a]'
                      : 'bg-[#172335]/95 border-[#455c78]/60 text-[#8ca3ba]'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  Auto-Bow
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenTab('city')}
                  className="h-10 px-2.5 rounded-xl bg-[#2c2214]/95 active:bg-[#f6c344] border border-[#f6c344]/65 text-xs font-bold text-[#fde68a] active:text-[#131d2b] flex items-center gap-1 shadow-[0_6px_16px_rgba(8,14,24,0.55)]"
                >
                  <Store className="w-4 h-4" />
                  Bazaar
                </button>
                <button
                  type="button"
                  onClick={onTouchInteract}
                  className="h-10 px-2.5 rounded-xl bg-[#17364d]/95 active:bg-[#5be7ff] border border-[#7be0ff]/75 text-xs font-bold text-[#c9f4ff] active:text-[#102030] flex items-center gap-1 shadow-[0_6px_16px_rgba(8,14,24,0.55)]"
                >
                  [E] Act
                </button>
              </div>
              <button
                type="button"
                onClick={onTouchAttack}
                className="h-12 px-5 rounded-2xl bg-[#d98a2b] active:bg-[#f6c344] border-2 border-[#f7d88b] text-xs font-extrabold uppercase tracking-wider text-[#131d2b] flex items-center gap-2 shadow-[0_6px_18px_rgba(8,14,24,0.65)]"
              >
                {hud.activeTool === 'axe' ? (
                  <>
                    <AxeIcon className="w-4 h-4" />
                    Strike
                  </>
                ) : (
                  <>
                    <BowIcon className="w-4 h-4" />
                    Shoot
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Dock — Ultra-Clean Action Bar + 1 Unified Menu Trigger */}
        <div className="pointer-events-auto flex flex-col items-center w-full shrink-0 gap-1">
          {!isMinimalHud && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setDockCollapsed((prev) => !prev);
              }}
              className="hud-plaque border-b-0 px-3 py-0.5 rounded-t-md text-[10px] font-bold uppercase tracking-wider text-[#b6cbe0] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Show Menu Bar
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Hide Menu Bar
                </>
              )}
            </button>
          )}

          {!drawerOpen && (isMinimalHud || !dockCollapsed) && (
            <div
              data-testid="controls-dock"
              className="w-fit max-w-[96vw] rounded-xl hud-plaque px-2.5 py-1.5"
            >
              <div className="mx-auto flex flex-wrap justify-center items-center gap-1.5">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectTool('axe');
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                    hud.activeTool === 'axe'
                      ? 'hud-keycap-active'
                      : 'hud-keycap text-[#dce6f2]'
                  }`}
                >
                  <AxeIcon className="w-3.5 h-3.5" />
                  <span>[1] {isMinimalHud ? 'Hatchet' : axeSpec.name}</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectTool('bow');
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                    hud.activeTool === 'bow'
                      ? 'hud-keycap-active'
                      : 'hud-keycap text-[#dce6f2]'
                  }`}
                >
                  <BowIcon className="w-3.5 h-3.5" />
                  <span>[2] {isMinimalHud ? 'Bow' : bowSpec.name}</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="select-rod-button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectTool('rod');
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                    hud.activeTool === 'rod'
                      ? 'hud-keycap-active'
                      : 'hud-keycap text-[#7be0ff]'
                  }`}
                >
                  <Fish className="w-3.5 h-3.5" />
                  <span>[3] {isMinimalHud ? 'Rod' : 'Glacial Rod'}</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hunters-sight-button"
                  aria-label="Activate Hunter's Sight"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onActivateHuntersSight();
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border flex items-center gap-1 text-xs font-bold tabular-nums transition-colors ${
                    hud.huntersSight.active
                      ? 'bg-gradient-to-b from-[#175573] to-[#0f3b52] border-[#7be0ff] text-[#c9f4ff] cursor-default'
                      : hud.huntersSight.cooldownLeft > 0
                        ? 'bg-[#172335] border-[#455c78]/45 text-[#7f96ad] cursor-not-allowed'
                        : 'bg-gradient-to-b from-[#1b415c] to-[#132e42] hover:brightness-110 border-[#5be7ff]/70 text-[#9fe8ff] cursor-pointer'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {hud.huntersSight.active
                      ? `${Math.ceil(hud.huntersSight.timeLeft)}s`
                      : hud.huntersSight.cooldownLeft > 0
                        ? `${Math.ceil(hud.huntersSight.cooldownLeft)}s`
                        : '[Q] Sight'}
                  </span>
                </button>

                {(hud.backpackInventory.snare_trap ?? 0) > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="quick-snare-button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onUseBackpackItem('snare_trap');
                    }}
                    className="shrink-0 px-2 py-1 rounded-lg bg-gradient-to-b from-[#214233] to-[#172f24] hover:brightness-110 border border-[#8ed49a]/70 text-xs font-bold tabular-nums text-[#a7f3d0] cursor-pointer transition-colors"
                  >
                    Snare ({hud.backpackInventory.snare_trap})
                  </button>
                )}

                {(hud.backpackInventory.frost_trap ?? 0) > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="quick-frost-button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onUseBackpackItem('frost_trap');
                    }}
                    className="shrink-0 px-2 py-1 rounded-lg bg-gradient-to-b from-[#183e54] to-[#112c3d] hover:brightness-110 border border-[#7be0ff]/75 text-xs font-bold tabular-nums text-[#9fe8ff] cursor-pointer transition-colors"
                  >
                    Frost ({hud.backpackInventory.frost_trap})
                  </button>
                )}

                {cargoGold > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSellAll();
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#2b4568] to-[#1c304a] hover:brightness-110 border border-[#f6c344]/65 text-xs font-bold tabular-nums text-[#f6c344] cursor-pointer transition-colors"
                  >
                    Sell +{cargoGold}g
                  </button>
                )}

                <div className="h-5 w-px bg-[#78a0c8]/30 mx-0.5 shrink-0" />

                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="open-unified-menu-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleDrawer();
                  }}
                  className={`shrink-0 px-3 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors ${
                    drawerOpen
                      ? 'bg-[#f6c344] border-[#fff0b8] text-[#131d2b]'
                      : 'bg-gradient-to-b from-[#1f344f] to-[#142337] hover:brightness-110 border-[#7fa4c8]/60 text-[#f4efe6]'
                  }`}
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>[Tab] Menu</span>
                  {(hud.dailyLogin.canClaimToday || totalSkillPoints > 0) && (
                    <span className="w-2 h-2 rounded-full bg-[#f6c344]" />
                  )}
                </button>
              </div>
            </div>
          )}

          {isMinimalHud && hud.settings.showControlsHint && !drawerOpen && (
            <p className="text-[11px] font-semibold text-[#dce6f2] hud-text-stroke text-center">
              WASD Move · Space/Click Use Tool · E Interact · Tab Menu · Esc Pause
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
