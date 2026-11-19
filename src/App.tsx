import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import {
  createDefaultAchievementCounters,
  evaluateAchievements,
} from './game/achievements';
import { buildCalendarState } from './game/calendar';
import { INITIAL_BUFFS } from './game/crafting';
import {
  INITIAL_LEVELS,
  INITIAL_RESOURCES,
  INITIAL_STATS,
  WEATHER_PHASE_DURATION_SECONDS,
  computeZoneWeatherStatusEffect,
  createDailyObjective,
} from './game/economy';
import { createInitialSeasonalEvent } from './game/events';
import { createInitialStormShelterState } from './game/shelter';
import { getCabinComfortSpec } from './game/housing';
import {
  buildFishingHudState,
  createInitialFishingState,
} from './game/fishing';
import { FrostwoodEngine } from './game/engine';
import { createEmptyBestiary } from './game/bestiary';
import {
  createInitialDayNightState,
  parseTimeOfDayParam,
} from './game/daynight';
import {
  BASE_BACKPACK_CAPACITY,
  computeSkillBonuses,
  createInitialSkillPerkPulse,
  createInitialSkillsState,
} from './game/skills';
import {
  computeGearBonuses,
  computeGearSetBonus,
  createInitialGearLevels,
  getWingsOfFireSpec,
} from './game/gear';
import { createCityDailyQuest } from './game/city';
import {
  createDefaultLifetimeStats,
  createDefaultProgress,
  createEmptySaveSlots,
  evaluateDailyLoginState,
} from './game/persistence';
import {
  computeBackpackItemCapacity,
  computeBackpackPreparedness,
  createInitialBackpackInventory,
} from './game/inventory';
import { createInitialHuntersSightState } from './game/tracking';
import {
  INITIAL_RESOURCE_TRENDS,
  INITIAL_RESOURCE_TREND_DELTAS,
} from './game/trends';
import { buildLootScalingHudInfo } from './game/loot';
import { createEmptyRareMaterials } from './game/mystery';
import { buildZoneHudInfo } from './game/zones';
import {
  type GameSettings,
  loadSettingsFromStorage,
} from './game/settings';
import type {
  ActiveTool,
  BuildingId,
  CraftItemId,
  DrawerTab,
  FestivalBuildingId,
  GearSlotId,
  HudSnapshot,
  MysteryShopItemId,
  MythicAscensionId,
  RivalHunterArchetypeId,
  SaveSlotId,
  SeasonalEventId,
  SkillPerkId,
  ToolUpgradeId,
  WeatherKind,
  ZoneId,
} from './game/types';

const INITIAL_SKILLS = createInitialSkillsState();
const INITIAL_GEAR = createInitialGearLevels();
const INITIAL_BACKPACK_INVENTORY = createInitialBackpackInventory();

const DEFAULT_HUD: HudSnapshot = {
  phase: 'title',
  victory: false,
  resources: { ...INITIAL_RESOURCES },
  resourceTrends: { ...INITIAL_RESOURCE_TRENDS },
  resourceTrendDeltas: { ...INITIAL_RESOURCE_TREND_DELTAS },
  harvestStreak: {
    count: 0,
    timeRemaining: 0,
    maxTime: 12,
    yieldBonusPct: 0,
  },
  levels: { ...INITIAL_LEVELS },
  gear: INITIAL_GEAR,
  unlockedGear: INITIAL_GEAR,
  gearBonuses: computeGearBonuses(INITIAL_GEAR),
  gearSet: computeGearSetBonus(INITIAL_GEAR),
  wingsTier: 0,
  wingsEquipped: true,
  wingsSpec: getWingsOfFireSpec(0),
  activeTool: 'axe',
  hp: 100,
  maxHp: 100,
  warmth: 100,
  maxWarmth: 100,
  stamina: 100,
  maxStamina: 100,
  nearCampfire: true,
  nearMarket: true,
  nearCraftingStation: false,
  nearCityTrader: null,
  nearCityQuestNpc: false,
  nearestCityNpcName: null,
  secretChestNear: null,
  chestBlips: [],
  contextHint: null,
  stats: { ...INITIAL_STATS },
  bestGold: 0,
  lifetimeStats: createDefaultLifetimeStats(0),
  hallOfFame: [],
  bestiary: createEmptyBestiary(),
  skills: INITIAL_SKILLS,
  skillBonuses: computeSkillBonuses(INITIAL_SKILLS),
  skillPerkPulse: createInitialSkillPerkPulse(),
  packUsed: 0,
  packCapacity: BASE_BACKPACK_CAPACITY,
  backpackInventory: INITIAL_BACKPACK_INVENTORY,
  backpackUsedSlots: 0,
  backpackMaxItems: computeBackpackItemCapacity(BASE_BACKPACK_CAPACITY),
  backpackPreparedness: computeBackpackPreparedness(INITIAL_BACKPACK_INVENTORY, INITIAL_BUFFS),
  deployedTraps: [],
  muted: false,
  settings: loadSettingsFromStorage(),
  endlessMode: false,
  woodRate: 0,
  goldRate: 0,
  workerCount: 0,
  weather: 'clear',
  weatherTimeLeft: WEATHER_PHASE_DURATION_SECONDS,
  frostIntensity: 0,
  zoneWeatherEffect: computeZoneWeatherStatusEffect({
    zone: 'level1',
    weather: 'clear',
    levels: INITIAL_LEVELS,
    nearCampfire: true,
    inStormShelter: false,
    activeBuffs: INITIAL_BUFFS,
  }),
  dayNight: createInitialDayNightState(),
  calendar: buildCalendarState(1),
  dailyObjective: createDailyObjective(1),
  cityDailyQuest: createCityDailyQuest(1, 0, 0),
  cityDailyQuestsCompleted: 0,
  wingsQuestRequirement: 30,
  seasonalEvent: createInitialSeasonalEvent(),
  stormShelter: createInitialStormShelterState(0),
  activeBuffs: { ...INITIAL_BUFFS },
  huntersSight: createInitialHuntersSightState(),
  trackedQuarry: null,
  nearbyTrack: null,
  wildlifeBlips: [],
  rivalHunters: [],
  hunterBlips: [],
  bossNear: null,
  bossBlip: null,
  lootScaling: buildLootScalingHudInfo({ zone: 'level1', gear: INITIAL_GEAR }),
  zone: buildZoneHudInfo('level1', 0, 4.6),
  achievements: evaluateAchievements(createDefaultAchievementCounters(), []).entries,
  achievementsUnlockedCount: 0,
  pets: {
    tamedPets: [],
    activePetUid: null,
    penLevel: 0,
    maxSlots: 1,
    passiveTameRateMult: 1,
    perkPotencyMult: 1,
    nearPen: false,
    nearbyWildPet: null,
    activeBonuses: {
      moveSpeedMult: 1,
      gatherYieldMult: 1,
      damageMult: 1,
      coldDecayMult: 1,
      goldTradeMult: 1,
      packCapacityBonus: 0,
      magnetRadiusBonus: 0,
    },
  },
  chatLogs: [],
  toastText: null,
  dailyLogin: evaluateDailyLoginState(createDefaultProgress(0)),
  saveSlots: createEmptySaveSlots(),
  rareMaterials: createEmptyRareMaterials(),
  unlockedAscensions: [],
  equippedAscension: null,
  nearMysteryShop: false,
  cameraOrbitDeg: 0,
  bowAutoAim: true,
  bowAutoAttack: true,
  autoHarvest: true,
  bowLockedTarget: null,
  housing: {
    inCabin: false,
    nearCabinDoor: false,
    nearInteriorDoor: false,
    nearBed: false,
    isSleeping: false,
    sleepProgress: 0,
    sleepTargetDay: 2,
    cabinTier: INITIAL_LEVELS.cabin,
    cabinTitle: getCabinComfortSpec(INITIAL_LEVELS.cabin).title,
    bedName: getCabinComfortSpec(INITIAL_LEVELS.cabin).bedName,
  },
  fishing: buildFishingHudState(
    createInitialFishingState(),
    0,
    4.6,
    'level1',
    ['common', 'uncommon', 'rare', 'epic', 'mythic'],
    0,
    0.18,
  ),
  damagePopups: [],
  engineReady: false,
  fpsEstimate: 60,
};

const VALID_DRAWER_TABS = new Set<DrawerTab>([
  'camp',
  'craft',
  'inventory',
  'travel',
  'city',
  'festival',
  'bestiary',
  'pets',
  'achievements',
  'skills',
  'daily',
  'saves',
  'mystery',
  'settings',
]);

interface DrawerState {
  open: boolean;
  tab: DrawerTab;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FrostwoodEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(DEFAULT_HUD);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, tab: 'camp' });

  const normalizeDrawerTab = useCallback((requestedTab?: string): DrawerTab | undefined => {
    if (!requestedTab) return undefined;
    if (requestedTab === 'tools') return 'craft';
    return VALID_DRAWER_TABS.has(requestedTab as DrawerTab)
      ? (requestedTab as DrawerTab)
      : undefined;
  }, []);

  const handleOpenDrawer = useCallback(
    (requestedTab?: DrawerTab | 'tools') => {
      const validTab = normalizeDrawerTab(requestedTab);

      setDrawer((prev) => {
        if (validTab) {
          if (!prev.open || prev.tab !== validTab) {
            return { open: true, tab: validTab };
          }
          return { open: false, tab: prev.tab };
        }
        return { open: !prev.open, tab: prev.tab };
      });
    },
    [normalizeDrawerTab],
  );

  const handleToggleDrawer = useCallback(() => {
    handleOpenDrawer();
  }, [handleOpenDrawer]);

  const handleChangeDrawerTab = useCallback(
    (tab: DrawerTab) => {
      const validTab = normalizeDrawerTab(tab);
      if (!validTab) return;
      setDrawer((prev) => (prev.tab === validTab ? prev : { ...prev, tab: validTab }));
    },
    [normalizeDrawerTab],
  );

  const handleOpenTab = useCallback(
    (targetTab: DrawerTab) => {
      handleOpenDrawer(targetTab);
    },
    [handleOpenDrawer],
  );

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const wParam = params.get('weather');
    const initialWeather: WeatherKind | null =
      wParam === 'clear' || wParam === 'light_snow' || wParam === 'blizzard'
        ? wParam
        : null;
    const eParam = params.get('event');
    const initialEvent: SeasonalEventId | boolean | null =
      eParam === 'solstice_fair' || eParam === 'aurora_festival'
        ? eParam
        : eParam === 'active' || eParam === '1'
          ? true
          : null;
    const initialShelter = params.get('shelter') === '1';
    const initialWildlifeShowcase = params.get('wildlife') === 'showcase';
    const initialTimeOfDay = parseTimeOfDayParam(params.get('time'));
    const initialSkillsReady = params.get('skills') === '1';
    const zParam = params.get('zone');
    const initialZone: ZoneId | null =
      zParam === 'level1' ||
      zParam === 'level2' ||
      zParam === 'level3' ||
      zParam === 'level4' ||
      zParam === 'level5' ||
      zParam === 'city'
        ? zParam
        : null;
    const initialPortalNear = params.get('portal') === '1';
    const gParam = params.get('gear');
    const gNum = Number(gParam);
    const initialGearReady: boolean | number =
      Number.isFinite(gNum) && gNum >= 2 && gNum <= 5
        ? Math.round(gNum)
        : gParam === '1';
    const initialSightReady = params.get('sight') === '1';
    const initialCraftReady = params.get('craft') === '1';
    const btParam = Number(params.get('basetier'));
    const initialBaseTier: number | null =
      Number.isFinite(btParam) && btParam >= 1 && btParam <= 5 ? Math.round(btParam) : null;
    const initialCityReady = params.get('city') === '1';
    const wtParam = Number(params.get('wings'));
    const initialWingsTier: number | null =
      Number.isFinite(wtParam) && wtParam >= 1 && wtParam <= 3 ? Math.round(wtParam) : null;
    const hunterParam = params.get('hunter');
    const initialHunterNear: RivalHunterArchetypeId | boolean =
      hunterParam === 'frost_berserker' ||
      hunterParam === 'aurora_warlock' ||
      hunterParam === 'raider' ||
      hunterParam === 'shadow_stalker' ||
      hunterParam === 'poacher'
        ? hunterParam
        : hunterParam === '1';
    const initialChestShowcase = params.get('chest') === '1';
    const initialPetShowcase = params.get('pet') === '1';
    const initialBossShowcase = params.get('boss') === '1';
    const initialCabinShowcase = params.get('cabin') === '1';
    const initialFishingShowcase = params.get('fishing') === '1';
    const iceRaw = params.get('ice');
    const iceParsed = iceRaw !== null ? Number(iceRaw) : NaN;
    const initialIceThickness =
      iceRaw !== null && Number.isFinite(iceParsed)
        ? Math.max(0, Math.min(1, iceParsed))
        : null;

    const engine = new FrostwoodEngine(
      mountEl,
      (snapshot) => setHud(snapshot),
      (tab) => handleOpenDrawer(tab ?? 'camp'),
      autostart,
      initialWeather,
      initialEvent,
      initialShelter,
      initialWildlifeShowcase,
      initialTimeOfDay,
      initialSkillsReady,
      initialZone,
      initialPortalNear,
      initialGearReady,
      initialSightReady,
      initialCraftReady,
      initialBaseTier,
      initialCityReady,
      initialWingsTier,
      initialHunterNear,
      initialChestShowcase,
      initialPetShowcase,
      initialBossShowcase,
      initialCabinShowcase,
      initialFishingShowcase,
      initialIceThickness,
    );
    engineRef.current = engine;
    setHud(engine.getHudSnapshot());

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleOpenDrawer]);

  const handleStart = useCallback(() => {
    setDrawer((prev) => (prev.open ? { ...prev, open: false } : prev));
    engineRef.current?.startNewRun();
  }, []);

  const handleSelectTool = useCallback((tool: ActiveTool) => {
    engineRef.current?.setTool(tool);
  }, []);

  const handleSellAll = useCallback(() => {
    engineRef.current?.sellAllTrade();
  }, []);

  const handleBuyCityOffer = useCallback((offerId: string) => {
    engineRef.current?.buyCityOffer(offerId);
  }, []);

  const handleSellMeat = useCallback((count?: number) => {
    engineRef.current?.sellMeat(count);
  }, []);

  const handleClaimCityDailyQuest = useCallback(() => {
    engineRef.current?.claimCityDailyQuest();
  }, []);

  const handleStartNextCityDailyQuest = useCallback(() => {
    engineRef.current?.startNextCityDailyQuest();
  }, []);

  const handleTouchMove = useCallback((dx: number, dz: number) => {
    engineRef.current?.setTouchMove(dx, dz);
  }, []);

  const handleTouchAttack = useCallback(() => {
    engineRef.current?.triggerTouchAttack();
  }, []);

  const handleTouchInteract = useCallback(() => {
    engineRef.current?.triggerTouchInteract();
  }, []);

  const handleBuyTool = useCallback((id: ToolUpgradeId) => {
    engineRef.current?.buyToolUpgrade(id);
  }, []);

  const handleBuyGear = useCallback((slot: GearSlotId) => {
    engineRef.current?.buyGearUpgrade(slot);
  }, []);

  const handleEquipGear = useCallback((slot: GearSlotId, tier?: number) => {
    engineRef.current?.equipGear(slot, tier);
  }, []);

  const handleUnequipGear = useCallback((slot: GearSlotId) => {
    engineRef.current?.unequipGear(slot);
  }, []);

  const handleToggleWingsEquipped = useCallback(() => {
    engineRef.current?.toggleWingsEquipped();
  }, []);

  const handleOpenSecretChest = useCallback(() => {
    engineRef.current?.openNearestSecretChest();
  }, []);

  const handleBuyBuilding = useCallback((id: BuildingId) => {
    engineRef.current?.buyBuildingUpgrade(id);
  }, []);

  const handleBuyFestivalBuilding = useCallback((id: FestivalBuildingId) => {
    engineRef.current?.buyFestivalBuilding(id);
  }, []);

  const handleExchangeFestivalIce = useCallback(() => {
    engineRef.current?.exchangeFestivalIce();
  }, []);

  const handleCraftItem = useCallback((id: CraftItemId) => {
    engineRef.current?.craftItem(id);
  }, []);

  const handleUseBackpackItem = useCallback((id: CraftItemId) => {
    engineRef.current?.useBackpackItem(id);
  }, []);

  const handleCraftAndUseItem = useCallback((id: CraftItemId) => {
    engineRef.current?.craftAndUseItem(id);
  }, []);

  const handleSalvageBackpackItem = useCallback((id: CraftItemId, qty = 1) => {
    engineRef.current?.salvageBackpackItem(id, qty);
  }, []);

  const handleUnlockSkillPerk = useCallback((id: SkillPerkId) => {
    engineRef.current?.unlockSkillPerk(id);
  }, []);

  const handleRespecSkills = useCallback(() => {
    engineRef.current?.respecSkills();
  }, []);

  const handleToggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  const handleUpdateSettings = useCallback((partial: Partial<GameSettings>) => {
    engineRef.current?.updateSettings(partial);
  }, []);

  const handleResetSettings = useCallback(() => {
    engineRef.current?.resetSettings();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setPhase('playing');
  }, []);

  const handleContinueEndless = useCallback(() => {
    engineRef.current?.continueEndless();
  }, []);

  const handleTitle = useCallback(() => {
    setDrawer((prev) => (prev.open ? { ...prev, open: false } : prev));
    engineRef.current?.setPhase('title');
  }, []);

  const handleUsePortal = useCallback(() => {
    engineRef.current?.activatePortal();
  }, []);

  const handleSelectZone = useCallback((targetZone: ZoneId) => {
    engineRef.current?.travelToZone(targetZone);
  }, []);

  const handleActivateHuntersSight = useCallback(() => {
    engineRef.current?.activateHuntersSight();
  }, []);

  const handleInspectTrack = useCallback(() => {
    engineRef.current?.inspectNearestTrack();
  }, []);

  const handleFeedWildPet = useCallback(() => {
    engineRef.current?.feedNearestWildPet();
  }, []);

  const handleSetActivePet = useCallback((uid: string | null) => {
    engineRef.current?.setActivePet(uid);
  }, []);

  const handlePetCompanion = useCallback((uid: string) => {
    engineRef.current?.petTamedCompanion(uid);
  }, []);

  const handleAttractWildStray = useCallback(() => {
    engineRef.current?.attractWildStray();
  }, []);

  const handleClaimDailyLoginReward = useCallback(() => {
    engineRef.current?.claimDailyLoginReward();
  }, []);

  const handleSaveGame = useCallback((slotId: SaveSlotId) => {
    engineRef.current?.saveGame(slotId);
  }, []);

  const handleLoadGame = useCallback((slotId: SaveSlotId) => {
    setDrawer((prev) => (prev.open ? { ...prev, open: false } : prev));
    engineRef.current?.loadGame(slotId);
  }, []);

  const handleDeleteSave = useCallback((slotId: SaveSlotId) => {
    engineRef.current?.deleteSave(slotId);
  }, []);

  const handleUnlockAscension = useCallback((id: MythicAscensionId) => {
    engineRef.current?.unlockMythicAscension(id);
  }, []);

  const handleEquipAscension = useCallback((id: MythicAscensionId | null) => {
    engineRef.current?.equipMythicAscension(id);
  }, []);

  const handleBuyMysteryItem = useCallback((id: MysteryShopItemId) => {
    engineRef.current?.buyMysteryShopItem(id);
  }, []);

  const handleToggleBowAutoAttack = useCallback(() => {
    engineRef.current?.toggleBowAutoAttack();
  }, []);

  const handleToggleBowAutoAim = useCallback(() => {
    engineRef.current?.toggleBowAutoAim();
  }, []);

  const handleToggleAutoHarvest = useCallback(() => {
    engineRef.current?.toggleAutoHarvest();
  }, []);

  const handleEnterCabin = useCallback(() => {
    engineRef.current?.enterCabin();
  }, []);

  const handleExitCabin = useCallback(() => {
    engineRef.current?.exitCabin();
  }, []);

  const handleSleepInCabin = useCallback(() => {
    engineRef.current?.sleepInCabin();
  }, []);

  const handleTravelToFishingLake = useCallback(() => {
    engineRef.current?.travelToFishingLake();
  }, []);

  const handleCastOrHookFish = useCallback(() => {
    engineRef.current?.castOrHookFishing();
  }, []);

  const handleSetFishingReel = useCallback((held: boolean) => {
    engineRef.current?.setFishingReelHeld(held);
  }, []);

  return (
    <main className="relative w-full h-full overflow-hidden">
      {/* Isolated WebGL canvas mount — never re-rendered by HUD state */}
      <div
        ref={mountRef}
        data-testid="game-canvas-mount"
        className="fixed inset-0 w-full h-full"
      />

      {!hud.engineReady && (
        <div
          data-testid="loading-screen"
          className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#0a1320] text-[#f4efe6] transition-opacity duration-300"
        >
          <div className="aaa-frame rounded-2xl px-7 py-6 flex flex-col items-center gap-3 text-center max-w-sm mx-4">
            <h1 className="font-display font-bold text-xl tracking-[0.2em] uppercase text-[#f6c344]">
              FROSTWOOD TYCOON
            </h1>
            <p className="text-xs font-medium tracking-wide text-[#9db4cb]">
              Initializing Glacial Engine &amp; Shaders...
            </p>
            <div className="hud-meter-track w-56 h-2 rounded-sm overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-[#38bdf8] via-[#7be0ff] to-[#f6c344]" />
            </div>
          </div>
        </div>
      )}

      {hud.phase === 'title' && (
        <TitleOverlay
          bestGold={hud.bestGold}
          lifetimeStats={hud.lifetimeStats}
          hallOfFame={hud.hallOfFame}
          dailyLogin={hud.dailyLogin}
          saveSlots={hud.saveSlots}
          settings={hud.settings}
          onStart={handleStart}
          onClaimDailyLoginReward={handleClaimDailyLoginReward}
          onLoadGame={handleLoadGame}
          onDeleteSave={handleDeleteSave}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
        />
      )}

      {hud.phase === 'playing' && (
        <GameHud
          hud={hud}
          drawerOpen={drawer.open}
          drawerTab={drawer.tab}
          onChangeDrawerTab={handleChangeDrawerTab}
          onToggleDrawer={handleToggleDrawer}
          onOpenTab={handleOpenTab}
          onSelectTool={handleSelectTool}
          onSellAll={handleSellAll}
          onBuyCityOffer={handleBuyCityOffer}
          onSellMeat={handleSellMeat}
          onClaimCityDailyQuest={handleClaimCityDailyQuest}
          onStartNextCityDailyQuest={handleStartNextCityDailyQuest}
          onTouchMove={handleTouchMove}
          onTouchAttack={handleTouchAttack}
          onTouchInteract={handleTouchInteract}
          onBuyTool={handleBuyTool}
          onBuyGear={handleBuyGear}
          onEquipGear={handleEquipGear}
          onUnequipGear={handleUnequipGear}
          onToggleWingsEquipped={handleToggleWingsEquipped}
          onOpenSecretChest={handleOpenSecretChest}
          onBuyBuilding={handleBuyBuilding}
          onBuyFestivalBuilding={handleBuyFestivalBuilding}
          onExchangeFestivalIce={handleExchangeFestivalIce}
          onCraftItem={handleCraftItem}
          onUseBackpackItem={handleUseBackpackItem}
          onCraftAndUseItem={handleCraftAndUseItem}
          onSalvageBackpackItem={handleSalvageBackpackItem}
          onUnlockSkillPerk={handleUnlockSkillPerk}
          onRespecSkills={handleRespecSkills}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onTitle={handleTitle}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
          onUsePortal={handleUsePortal}
          onSelectZone={handleSelectZone}
          onActivateHuntersSight={handleActivateHuntersSight}
          onInspectTrack={handleInspectTrack}
          onFeedWildPet={handleFeedWildPet}
          onSetActivePet={handleSetActivePet}
          onPetCompanion={handlePetCompanion}
          onAttractWildStray={handleAttractWildStray}
          onClaimDailyLoginReward={handleClaimDailyLoginReward}
          onSaveGame={handleSaveGame}
          onLoadGame={handleLoadGame}
          onDeleteSave={handleDeleteSave}
          onUnlockAscension={handleUnlockAscension}
          onEquipAscension={handleEquipAscension}
          onBuyMysteryItem={handleBuyMysteryItem}
          onToggleBowAutoAttack={handleToggleBowAutoAttack}
          onToggleBowAutoAim={handleToggleBowAutoAim}
          onToggleAutoHarvest={handleToggleAutoHarvest}
          onEnterCabin={handleEnterCabin}
          onExitCabin={handleExitCabin}
          onSleepInCabin={handleSleepInCabin}
          onTravelToFishingLake={handleTravelToFishingLake}
          onCastOrHookFish={handleCastOrHookFish}
          onSetFishingReel={handleSetFishingReel}
        />
      )}

      {(hud.phase === 'paused' || hud.phase === 'gameover') && (
        <StatusModal
          hud={hud}
          onResume={handleResume}
          onRestart={handleStart}
          onContinueEndless={handleContinueEndless}
          onTitle={handleTitle}
          onSaveGame={handleSaveGame}
          onLoadGame={handleLoadGame}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
        />
      )}
    </main>
  );
}

