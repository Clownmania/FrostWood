import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AudioManager } from './audio';
import {
  INITIAL_LEVELS,
  INITIAL_RESOURCES,
  INITIAL_STATS,
  advanceWeatherState,
  applyObjectiveReward,
  calculatePassiveRates,
  computeScreenFrostIntensity,
  computeZoneWeatherStatusEffect,
  createDailyObjective,
  getAxeSpec,
  getBowSpec,
  getNextBuildingUpgrade,
  getNextToolUpgrade,
  getWeatherProfile,
  isEmpireVictory,
  recordObjectiveProgress,
  sellTradeBundle,
  spendResources,
  stepWarmthAndHealth,
  tickDailyObjective,
} from './economy';
import {
  computeGearBonuses,
  computeGearSetBonus,
  createInitialGearLevels,
  equipGearSlot,
  getGearSlotSpec,
  getNextGearUpgrade,
  getWingsOfFireSpec,
  unequipGearSlot,
} from './gear';
import {
  type AnimalModel,
  type AnimalTrackVisual,
  type CharacterRig,
  type CityStallVisual,
  type CraftingStationVisual,
  type DeployedTrapVisual,
  type PetVisual,
  type PortalVisual,
  type SecretChestVisual,
  type StormShelterVisual,
  type WaystationBrazierVisual,
  applyFrostBerserkerVisuals,
  applyIceWraithVisuals,
  createAnimalModel,
  createAnimalTrackMesh,
  createBoulderModel,
  createCabinMesh,
  createCampIceSculptureMesh,
  createCampfireModel,
  createCharacterRig,
  createCityMarketStallMesh,
  createCraftingStationMesh,
  createDeployedTrapMesh,
  createFestivalPavilionMesh,
  createForgeMesh,
  createLumberCampMesh,
  createMaterialPalette,
  createPetModel,
  createPickupModel,
  createPlotMarkerMesh,
  createPortalModel,
  createSawmillMesh,
  createSecretChestModel,
  createStormShelterMesh,
  createTamingPenMesh,
  createTanneryMesh,
  createThermalConduitMesh,
  createTreeModel,
  createWaystationBrazierModel,
  createWildIceSculptureModel,
  createWindbreakPalisadeMesh,
  createTimberColossusModel,
  createCryoSovereignModel,
  createCavernWardenModel,
  type ZoneBossModel,
  getWindTargets,
  updateCharacterEquipmentVisuals,
} from './models';
import {
  BOSS_HUD_DETECT_RADIUS,
  BOSS_RESPAWN_SECONDS,
  type BossAttackPatternSpec,
  type ZoneBossSpec,
  ZONE_BOSS_ORDER,
  ZONE_BOSS_SPECS,
  computeArenaContainment,
  computeBossKinematicPose,
  computeBossLootReward,
  computeBossTacticalMovement,
  getZoneBossSpec,
  isBossEnraged,
  rollMeteorTargets,
  rollTacticalAoEPatternPoints,
  selectNextBossAttack,
} from './bosses';
import {
  cloneAchievementCounters,
  createDefaultAchievementCounters,
  evaluateAchievements,
  sanitizeUnlockedAchievementIds,
} from './achievements';
import { buildCalendarState, getCalendarGameplayModifiers } from './calendar';
import {
  PEN_INTERACT_RADIUS,
  PET_FEED_INTERACT_RADIUS,
  PET_PASSIVE_CALM_MAX_SPEED,
  PET_PASSIVE_TAME_RADIUS,
  PET_SPECIES_ORDER,
  PET_SPECIES_SPECS,
  applyFeedWildPet,
  canFeedWildPet,
  computeActivePetBonuses,
  computePassiveTameGain,
  getTamingPenSpec,
} from './pets';
import {
  CITY_AMBIENT_NPCS,
  CITY_NPC_INTERACT_RADIUS,
  CITY_QUEST_NPC,
  CITY_TRADERS,
  CITY_TRADER_ORDER,
  WINGS_DAILY_QUEST_REQUIREMENT,
  canCompleteCityDailyQuest,
  completeCityDailyQuest,
  computeWingsTierForCompletedQuests,
  createCityDailyQuest,
  findNearestCityTrader,
  isNearCityQuestNpc,
  purchaseCityOffer,
  recordCityDailyQuestKill,
  sellMeatForGold,
} from './city';
import {
  SECRET_CHEST_INTERACT_RADIUS,
  SECRET_CHEST_SPAWN_INTERVAL,
  collectMinimapChestBlips,
  findNearestSecretChest,
  pickSecretChestRarity,
  pickSecretChestSpawnPoint,
  rollSecretChestLoot,
  shouldSpawnSecretChest,
} from './chests';
import {
  type LootScalingContext,
  buildLootScalingHudInfo,
} from './loot';
import {
  RARE_ENEMY_ARCHETYPES,
  RIVAL_HUNTER_ARCHETYPES,
  type StolenBag as RivalHunterStolenBag,
  computeRivalHunterDefeatLoot,
  createEmptyStolenBag,
  pickRivalHunterArchetype,
  pickRivalHunterSpawnPoint,
  rollRareEnemyAmbush,
  stealResourcesOnHunterHit,
  totalStolenItems,
} from './hunters';
import {
  createInitialStormShelterState,
  getStormShelterSpec,
  isPlayerInsideStormShelter,
  tickStormShelter,
  upgradeStormShelterState,
} from './shelter';
import {
  INITIAL_BUFFS,
  computeCraftChillScale,
  computeCraftDamageScale,
  computeCraftSpeedScale,
  computeCraftYieldScale,
  getCraftRecipe,
  tickCraftBuffs,
} from './crafting';
import {
  TRAP_SPECS,
  type TrapKind,
  computeBackpackItemCapacity,
  computeBackpackPreparedness,
  countBackpackItems,
  craftItemToBackpack,
  createInitialBackpackInventory,
  useBackpackItem as applyBackpackItemUse,
} from './inventory';
import { ResourceTrendTracker } from './trends';
import {
  createInitialSeasonalEvent,
  exchangeFestivalIce as performFestivalIceExchange,
  getSeasonalEventProfile,
  purchaseFestivalBuilding,
  tickSeasonalEvent,
} from './events';
import { createProceduralTextures } from './textures';
import {
  cloneBestiary,
  countDiscoveredSpecies,
  createEmptyBestiary,
  recordAnimalHit,
  recordAnimalKill,
  recordAnimalSighting,
} from './bestiary';
import {
  LEGACY_BEST_GOLD_STORAGE_KEY,
  createDefaultProgress,
  loadProgressFromStorage,
  recordExpeditionResult,
  saveProgressToStorage,
} from './persistence';
import {
  SKILL_PERKS,
  clampCargoAddition,
  cloneSkillsState,
  computeBackpackCapacity,
  computeBackpackUsed,
  computeGatheringNodeXp,
  computeHuntingKillXp,
  computeSkillBonuses,
  createInitialSkillsState,
  grantSkillXp,
  respecSkillPerks,
  unlockSkillPerk as applySkillPerkUnlock,
} from './skills';
import type {
  AchievementCounters,
  ActiveCraftBuffs,
  ActiveTool,
  AnimalKind,
  BackpackInventoryMap,
  BestiaryMap,
  BuildingId,
  ChatLogCategory,
  ChatLogEntry,
  CityDailyQuestState,
  CityTraderId,
  CraftItemId,
  DailyObjective,
  DeployedTrapHudInfo,
  FestivalBuildingId,
  GamePhase,
  GearLevels,
  GearSlotId,
  HudSnapshot,
  HuntersSightState,
  ItemRarity,
  LastLootRollHudInfo,
  LootDroppedItem,
  MinimapBossBlip,
  MinimapChestBlip,
  MinimapHunterBlip,
  NearbyTameablePetHudInfo,
  ObjectiveMetric,
  PersistentProgress,
  PetSpeciesId,
  PetsHudState,
  PlayerSkillsState,
  ResourceCounts,
  RivalHunterArchetypeId,
  RivalHunterHudInfo,
  RunStats,
  SeasonalEventId,
  SeasonalEventState,
  SecretChestHudInfo,
  SecretChestRarity,
  SkillBranch,
  SkillPerkId,
  StormShelterState,
  TamedPetRecord,
  ToolUpgradeId,
  TreeKind,
  UpgradeLevels,
  WeatherKind,
  ZoneBossHudInfo,
  ZoneBossId,
  ZoneId,
} from './types';
import {
  BUILDING_POSITIONS,
  ParticlePool,
  SnowfallSystem,
  createZoneTerrain,
  groundHeightAt,
  updateBackdropForestWind,
} from './world';
import {
  LEVEL1_CITY_PORTAL_X,
  LEVEL1_CITY_PORTAL_Z,
  PORTAL_COOLDOWN_SECONDS,
  ZONE_SPECS,
  buildZoneHudInfo,
  cardinalBearingFromDelta,
  clampToZoneBounds,
  computeNearestZonePortal,
  getDestinationAfterPortal,
} from './zones';
import { computeWindGustSample, worldLeanToLocalEuler } from './wind';
import {
  type AnimalBehaviorState,
  SPECIES_SPECS,
  WILDLIFE_SPECIES_ORDER,
  computeEffectiveRadii,
  evaluatePreyReaction,
  isUnawareBehavior,
  pickDynamicWildlifeSpawn,
  pickHabitatRespawnPoint,
  pickWildlifeSpawnPoint,
} from './wildlife';
import {
  HUNTERS_SIGHT_RADIUS,
  MAX_ACTIVE_TRACKS,
  MIN_TRACK_DROP_DIST,
  TRACK_AMBUSH_DAMAGE_MULT,
  TRACK_AMBUSH_DURATION,
  TRACK_INSPECT_RADIUS,
  TRACK_MAX_AGE,
  activateHuntersSight as activateSightState,
  collectMinimapWildlifeBlips,
  computeTrackVisualAlpha,
  createInitialHuntersSightState,
  findNearestInspectableTrack,
  getRarityColorHex,
  pickForestFlushSpecies,
  selectBestTrackedQuarry,
  tickHuntersSight,
} from './tracking';
import {
  INITIAL_TIME_OF_DAY,
  advanceTimeOfDay,
  buildDayNightState,
  computeEnvironmentLighting,
  computeWildlifeTimeProfile,
} from './daynight';
import {
  angleDiff,
  clamp,
  computeBipedGait,
  computeQuadrupedGait,
  dampAngle,
  dampScalar,
  stepPlanarVelocity,
} from './kinematics';

interface TreeEntity {
  id: number;
  zone: ZoneId;
  kind: TreeKind;
  x: number;
  z: number;
  y: number;
  hp: number;
  maxHp: number;
  woodYield: number;
  respawnTimer: number;
  fallTimer: number;
  shakeTimer: number;
  flashTimer: number;
  mesh: THREE.Group;
}

interface BoulderEntity {
  id: number;
  zone: ZoneId;
  x: number;
  z: number;
  y: number;
  hp: number;
  maxHp: number;
  stoneYield: number;
  respawnTimer: number;
  shakeTimer: number;
  mesh: THREE.Group;
}

interface AnimalEntity {
  id: number;
  zone: ZoneId;
  kind: AnimalKind;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  hitsTaken: number;
  state: AnimalBehaviorState;
  stateTimer: number;
  wanderAngle: number;
  flashTimer: number;
  walkPhase: number;
  lastTrackX: number;
  lastTrackZ: number;
  model: AnimalModel;
}

interface AnimalTrackEntity {
  id: number;
  zone: ZoneId;
  kind: AnimalKind;
  animalId: number;
  x: number;
  z: number;
  yaw: number;
  age: number;
  visual: AnimalTrackVisual;
}

interface IceSculptureEntity {
  id: number;
  zone: ZoneId;
  x: number;
  z: number;
  y: number;
  hp: number;
  maxHp: number;
  iceYield: number;
  respawnTimer: number;
  shakeTimer: number;
  mesh: THREE.Group;
}

interface PickupEntity {
  zone: ZoneId;
  kind: 'wood' | 'stone' | 'ice' | 'pelt' | 'meat' | 'gold';
  amount: number;
  x: number;
  y: number;
  z: number;
  vy: number;
  age: number;
  mesh: THREE.Group;
}

interface ArrowEntity {
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  life: number;
  mesh: THREE.Mesh;
}

interface EnemyBoltEntity {
  zone: ZoneId;
  sourceName: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  warmthDrain: number;
  life: number;
  mesh: THREE.Mesh;
}

interface WorkerEntity {
  role: 'lumberjack' | 'campcutter' | 'trapper';
  x: number;
  z: number;
  yaw: number;
  state: 'toTarget' | 'work' | 'return';
  timer: number;
  targetX: number;
  targetZ: number;
  walkPhase: number;
  rig: CharacterRig;
}

interface DeployedTrapEntity {
  id: number;
  zone: ZoneId;
  kind: TrapKind;
  x: number;
  z: number;
  armed: boolean;
  despawnTimer: number;
  visual: DeployedTrapVisual;
}

interface RivalHunterEntity {
  id: number;
  zone: ZoneId;
  archetypeId: RivalHunterArchetypeId;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  state: 'prowl' | 'pursue' | 'attack' | 'flee' | 'ko';
  stateTimer: number;
  attackCooldown: number;
  wanderAngle: number;
  walkPhase: number;
  flashTimer: number;
  stolenBag: RivalHunterStolenBag;
  rig: CharacterRig;
  threatRing: THREE.Mesh;
}

interface SecretChestEntity {
  id: number;
  zone: ZoneId;
  rarity: SecretChestRarity;
  x: number;
  z: number;
  opened: boolean;
  openAnim: number;
  despawnTimer: number;
  visual: SecretChestVisual;
}

interface WildPetEntity {
  id: number;
  zone: ZoneId;
  speciesId: PetSpeciesId;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  wanderAngle: number;
  stateTimer: number;
  walkPhase: number;
  progress: number;
  visual: PetVisual;
}

interface TamedPetInstance {
  uid: string;
  speciesId: PetSpeciesId;
  x: number;
  z: number;
  yaw: number;
  walkPhase: number;
  wanderAngle: number;
  stateTimer: number;
  currentZone: ZoneId;
  visual: PetVisual;
}

interface ZoneBossEntity {
  id: ZoneBossId;
  spec: ZoneBossSpec;
  zone: ZoneId;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  enraged: boolean;
  enrageAnnounced: boolean;
  state: 'idle' | 'engage' | 'telegraph' | 'attack' | 'recover' | 'ko';
  stateTimer: number;
  attackCooldown: number;
  patternIndex: number;
  activePattern: BossAttackPatternSpec | null;
  telegraphDuration: number;
  chargeDirX: number;
  chargeDirZ: number;
  targetX: number;
  targetZ: number;
  respawnTimer: number;
  flashTimer: number;
  walkPhase: number;
  strafeSign: -1 | 1;
  strafeFlipTimer: number;
  strideSpeed: number;
  tacticLabel: string;
  model: ZoneBossModel;
}

interface BossProjectileEntity {
  zone: ZoneId;
  bossId: ZoneBossId;
  sourceName: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  warmthDrain: number;
  life: number;
  mesh: THREE.Mesh;
}

interface BossHazardZoneEntity {
  zone: ZoneId;
  bossId: ZoneBossId;
  sourceName: string;
  x: number;
  z: number;
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  warmthDrain: number;
  colorHex: number;
  group: THREE.Group;
  fillMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
}

const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();

export class FrostwoodEngine {
  private readonly mountEl: HTMLElement;
  private readonly onHudUpdate: (snapshot: HudSnapshot) => void;
  private readonly onOpenDrawer: (
    tab?:
      | 'camp'
      | 'tools'
      | 'craft'
      | 'inventory'
      | 'festival'
      | 'bestiary'
      | 'skills'
      | 'city'
      | 'pets'
      | 'achievements',
  ) => void;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly isSoftwareGl: boolean;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly rimLight: THREE.DirectionalLight;
  private readonly skyColor = new THREE.Color(0x6f92b8);
  private readonly targetSkyColor = new THREE.Color(0x6f92b8);
  private readonly targetHemiSky = new THREE.Color(0xc2dcff);
  private readonly targetHemiGround = new THREE.Color(0x3b4d63);
  private readonly targetSunColor = new THREE.Color(0xffe1b0);
  private readonly targetRimColor = new THREE.Color(0x7fb4eb);
  private readonly sceneFog: THREE.FogExp2;

  private readonly audio = new AudioManager();
  private readonly textures;
  private readonly palette;
  private readonly level1Group = new THREE.Group();
  private readonly level2Group = new THREE.Group();
  private readonly level3Group = new THREE.Group();
  private readonly level4Group = new THREE.Group();
  private readonly level5Group = new THREE.Group();
  private readonly cityGroup = new THREE.Group();
  private readonly worldGroup: THREE.Group;
  private readonly level2WorldGroup: THREE.Group;
  private readonly level3WorldGroup: THREE.Group;
  private readonly level4WorldGroup: THREE.Group;
  private readonly level5WorldGroup: THREE.Group;
  private readonly cityWorldGroup: THREE.Group;
  private readonly portal1: PortalVisual;
  private readonly portal2: PortalVisual;
  private readonly portal2Forward: PortalVisual;
  private readonly portal3Return: PortalVisual;
  private readonly portal3Forward: PortalVisual;
  private readonly portal4Return: PortalVisual;
  private readonly portal4Forward: PortalVisual;
  private readonly portal5Return: PortalVisual;
  private readonly cityPortal1: PortalVisual;
  private readonly cityPortal2: PortalVisual;
  private readonly waystationBrazier: WaystationBrazierVisual;
  private readonly waystationBrazier3: WaystationBrazierVisual;
  private readonly waystationBrazier4: WaystationBrazierVisual;
  private readonly waystationBrazier5: WaystationBrazierVisual;
  private readonly cityStalls: CityStallVisual[] = [];
  private readonly cityTraderRigs: Array<{
    id: CityTraderId;
    rig: CharacterRig;
    x: number;
    z: number;
    yaw: number;
  }> = [];
  private readonly cityNpcs: Array<{
    spec: (typeof CITY_AMBIENT_NPCS)[number];
    rig: CharacterRig;
    x: number;
    z: number;
    yaw: number;
    wpIdx: number;
    walkPhase: number;
  }> = [];
  private cityQuestNpcRig: CharacterRig | null = null;
  private cityQuestDaisGroup: THREE.Group | null = null;
  private readonly rivalHunters: RivalHunterEntity[] = [];
  private nextHunterId = 1;
  private hunterSpawnTimer = 18;
  private readonly chests: SecretChestEntity[] = [];
  private nextChestId = 1;
  private chestSpawnTimer = SECRET_CHEST_SPAWN_INTERVAL;
  private readonly particles: ParticlePool;
  private readonly snowfall: SnowfallSystem;
  private activeZone: ZoneId = 'level1';
  private portalCooldown = 0;
  private vortexCooldown = 0;
  private sunOffsetX = 28;
  private sunOffsetY = 36;
  private sunOffsetZ = 22;

  private readonly playerRig: CharacterRig;
  private readonly campfire;
  private cabinGroup: THREE.Group;
  private lumberCampGroup: THREE.Group | null = null;
  private sawmillVisual: { group: THREE.Group; blade: THREE.Mesh } | null = null;
  private tanneryGroup: THREE.Group | null = null;
  private forgeGroup: THREE.Group | null = null;
  private tamingPenGroup: THREE.Group | null = null;
  private stormShelterVisual: StormShelterVisual | null = null;
  private windbreakGroup: THREE.Group | null = null;
  private thermalConduitGroup: THREE.Group | null = null;
  private festivalPavilionGroup: THREE.Group | null = null;
  private iceMonumentGroup: THREE.Group | null = null;
  private craftingStationVisual: CraftingStationVisual | null = null;

  private readonly trees: TreeEntity[] = [];
  private readonly boulders: BoulderEntity[] = [];
  private readonly iceSculptures: IceSculptureEntity[] = [];
  private readonly animals: AnimalEntity[] = [];
  private readonly tracks: AnimalTrackEntity[] = [];
  private readonly wildPets: WildPetEntity[] = [];
  private nextWildPetId = 1;
  private wildPetRespawnTimer = 14;
  private tamedPets: TamedPetRecord[] = [];
  private activePetUid: string | null = null;
  private readonly tamedPetInstances: TamedPetInstance[] = [];
  private readonly deployedTraps: DeployedTrapEntity[] = [];
  private readonly pickups: PickupEntity[] = [];
  private readonly arrows: ArrowEntity[] = [];
  private readonly enemyBolts: EnemyBoltEntity[] = [];
  private readonly zoneBosses: ZoneBossEntity[] = [];
  private readonly bossProjectiles: BossProjectileEntity[] = [];
  private readonly bossHazards: BossHazardZoneEntity[] = [];
  private readonly workers: WorkerEntity[] = [];
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();

  private phase: GamePhase = 'title';
  private victory = false;
  private endlessMode = false;
  private resources: ResourceCounts = { ...INITIAL_RESOURCES };
  private levels: UpgradeLevels = { ...INITIAL_LEVELS };
  private stats: RunStats = { ...INITIAL_STATS };
  private activeTool: ActiveTool = 'axe';

  private hp = 100;
  private maxHp = 100;
  private warmth = 100;
  private maxWarmth = 100;
  private bestGold = 0;
  private progress: PersistentProgress = createDefaultProgress(0);
  private achievementsUnlocked: string[] = [];
  private achievementCounters: AchievementCounters = createDefaultAchievementCounters();
  private achievementCheckTimer = 0;
  private bestiary: BestiaryMap = createEmptyBestiary();
  private skills: PlayerSkillsState = createInitialSkillsState();
  private gear: GearLevels = createInitialGearLevels();
  private unlockedGear: GearLevels = createInitialGearLevels();
  private wingsTier = 0;
  private wingsEquipped = true;
  private cityDailyQuest: CityDailyQuestState = createCityDailyQuest(1, 0, 0);
  private backpackInventory: BackpackInventoryMap = createInitialBackpackInventory();
  private readonly resourceTrendTracker = new ResourceTrendTracker();
  private runRecorded = false;
  private packFullToastCooldown = 0;
  private readonly initialWildlifeShowcase: boolean;
  private readonly initialZoneOverride: ZoneId | null;
  private readonly initialPortalNear: boolean;
  private readonly initialGearReady: boolean | number;
  private readonly initialSightReady: boolean;
  private readonly initialCraftReady: boolean;
  private readonly initialBaseTier: number | null;
  private readonly initialCityReady: boolean;
  private readonly initialWingsTier: number | null;
  private readonly initialHunterNear: RivalHunterArchetypeId | boolean;
  private readonly initialChestShowcase: boolean;
  private readonly initialPetShowcase: boolean;
  private readonly initialBossShowcase: boolean;
  private lastLootRoll: LastLootRollHudInfo | null = null;
  private touchMoveX = 0;
  private touchMoveZ = 0;

  private playerX = 0;
  private playerZ = 4.6;
  private playerVx = 0;
  private playerVz = 0;
  private playerYaw = Math.PI;
  private playerSpeed = 0;
  private playerWalkPhase = 0;
  private playerTurnBank = 0;
  private idleTime = 0;
  private lastFootstepStep = 0;
  private attackCooldown = 0;
  private swingTimer = 0;
  private swingDuration = 0.28;
  private hurtFlashTimer = 0;
  private hitstopTimer = 0;
  private trauma = 0;
  private camLookX = 0;
  private camLookZ = 4.6;

  private nextAnimalId = 1;
  private nextTrackId = 1;
  private nextTrapId = 1;
  private anvilAnimTimer = 0;
  private wildlifeSpawnTimer = 2.0;
  private huntersSight: HuntersSightState = createInitialHuntersSightState();
  private trackedAnimalId: number | null = null;
  private trackAmbushBonusTimer = 0;
  private sightPulseAnimTimer = 0;
  private readonly sightPulseRingMat: THREE.MeshBasicMaterial;
  private readonly sightPulseRingMesh: THREE.Mesh;
  private passiveWoodAcc = 0;
  private passiveGoldAcc = 0;
  private weather: WeatherKind = 'clear';
  private weatherTimer = getWeatherProfile('clear').duration;
  private initialWeatherOverride: WeatherKind | null = null;
  private timeOfDay = INITIAL_TIME_OF_DAY;
  private cycleDayNumber = 1;
  private initialTimeOverride: number | null = null;
  private campfireGlowMult = 1.0;
  private currentWindX = 0.35;
  private currentFallMult = 0.55;
  private currentSnowOpacity = 0.16;
  private currentGustIntensity = 0;
  private currentFrostOverlay = 0;
  private dailyObjective: DailyObjective = createDailyObjective(1);
  private seasonalEvent: SeasonalEventState = createInitialSeasonalEvent();
  private initialEventOverride: SeasonalEventId | boolean | null = null;
  private stormShelter: StormShelterState = createInitialStormShelterState(0);
  private initialShelterOverride = false;
  private activeBuffs: ActiveCraftBuffs = { ...INITIAL_BUFFS };
  private chatLogs: ChatLogEntry[] = [];
  private nextChatLogId = 1;
  private toastText: string | null = null;
  private toastTimer = 0;

  private readonly keysHeld = new Set<string>();
  private readonly keysJustPressed = new Set<string>();
  private pointerDown = false;
  private pointerJustPressed = false;
  private pointerClientX = 0;
  private pointerClientY = 0;

  private frameId = 0;
  private lastTimestamp = 0;
  private totalTime = 0;
  private hudSyncTimer = 0;
  private disposed = false;

  private readonly arrowGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6);
  private readonly arrowMat = new THREE.MeshStandardMaterial({
    color: 0xf6d38b,
    emissive: 0x553310,
    emissiveIntensity: 0.4,
    roughness: 0.4,
  });
  private readonly enemyBoltGeo = new THREE.OctahedronGeometry(0.18, 0);
  private readonly enemyBoltMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.5,
    roughness: 0.12,
    metalness: 0.4,
  });
  private readonly bossOrbGeo = new THREE.OctahedronGeometry(0.26, 0);
  private readonly bossHazardFillGeo = (() => {
    const g = new THREE.CircleGeometry(1, 32);
    g.rotateX(-Math.PI / 2);
    return g;
  })();
  private readonly bossHazardRingGeo = (() => {
    const g = new THREE.RingGeometry(0.84, 1.0, 36);
    g.rotateX(-Math.PI / 2);
    return g;
  })();

  constructor(
    mountEl: HTMLElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onOpenDrawer: (
      tab?:
        | 'camp'
        | 'tools'
        | 'craft'
        | 'inventory'
        | 'festival'
        | 'bestiary'
        | 'skills'
        | 'city'
        | 'pets'
        | 'achievements',
    ) => void,
    autostart = false,
    initialWeather: WeatherKind | null = null,
    initialEvent: SeasonalEventId | boolean | null = null,
    initialShelter = false,
    initialWildlifeShowcase = false,
    initialTimeOfDay: number | null = null,
    initialSkillsReady = false,
    initialZone: ZoneId | null = null,
    initialPortalNear = false,
    initialGearReady: boolean | number = false,
    initialSightReady = false,
    initialCraftReady = false,
    initialBaseTier: number | null = null,
    initialCityReady = false,
    initialWingsTier: number | null = null,
    initialHunterNear: RivalHunterArchetypeId | boolean = false,
    initialChestShowcase = false,
    initialPetShowcase = false,
    initialBossShowcase = false,
  ) {
    this.mountEl = mountEl;
    this.onHudUpdate = onHudUpdate;
    this.onOpenDrawer = onOpenDrawer;
    this.initialWeatherOverride = initialWeather;
    this.initialEventOverride = initialEvent;
    this.initialShelterOverride = initialShelter;
    this.initialWildlifeShowcase = initialWildlifeShowcase;
    this.initialZoneOverride = initialZone;
    this.initialPortalNear = initialPortalNear;
    this.initialGearReady = initialGearReady;
    this.initialSightReady = initialSightReady;
    this.initialCraftReady = initialCraftReady;
    this.initialBaseTier = initialBaseTier;
    this.initialCityReady = initialCityReady;
    this.initialWingsTier = initialWingsTier;
    this.initialHunterNear = initialHunterNear;
    this.initialChestShowcase = initialChestShowcase;
    this.initialPetShowcase = initialPetShowcase;
    this.initialBossShowcase = initialBossShowcase;
    this.initialTimeOverride = initialTimeOfDay;
    if (initialTimeOfDay !== null) {
      this.timeOfDay = initialTimeOfDay;
    }

    this.progress = loadProgressFromStorage();
    this.bestGold = this.progress.stats.bestGold;
    this.achievementsUnlocked = sanitizeUnlockedAchievementIds(this.progress.achievementsUnlocked);
    this.achievementCounters = this.progress.achievementCounters
      ? cloneAchievementCounters(this.progress.achievementCounters)
      : createDefaultAchievementCounters();
    this.bestiary = this.progress.bestiary
      ? cloneBestiary(this.progress.bestiary)
      : createEmptyBestiary();
    this.skills = this.progress.skills
      ? cloneSkillsState(this.progress.skills)
      : createInitialSkillsState();
    if (initialSkillsReady) {
      this.skills.gatheringLevel = Math.max(2, this.skills.gatheringLevel);
      this.skills.gatheringPoints = Math.max(1, this.skills.gatheringPoints);
      this.skills.huntingLevel = Math.max(2, this.skills.huntingLevel);
      this.skills.huntingPoints = Math.max(1, this.skills.huntingPoints);
    }

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(mountEl.clientWidth || window.innerWidth, mountEl.clientHeight || window.innerHeight);

    mountEl.innerHTML = '';
    mountEl.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.scene = new THREE.Scene();
    this.scene.background = this.skyColor;
    this.sceneFog = new THREE.FogExp2(this.skyColor.getHex(), 0.0115);
    this.scene.fog = this.sceneFog;

    const aspect = (mountEl.clientWidth || window.innerWidth) / (mountEl.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.2, 240);
    this.camera.position.set(16, 13, 18);
    this.camera.lookAt(0, 1.5, 0);

    // Mandatory studio environment reflection map on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm/cool lighting contrast
    this.hemiLight = new THREE.HemisphereLight(0xc2dcff, 0x3b4d63, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffe1b0, 2.1);
    this.sunLight.position.set(28, 36, 22);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -36;
    this.sunLight.shadow.camera.right = 36;
    this.sunLight.shadow.camera.top = 36;
    this.sunLight.shadow.camera.bottom = -36;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 110;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x7fb4eb, 0.65);
    this.rimLight.position.set(-24, 14, -22);
    this.scene.add(this.rimLight);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);
    this.palette = createMaterialPalette(this.textures);

    this.scene.add(
      this.level1Group,
      this.level2Group,
      this.level3Group,
      this.level4Group,
      this.level5Group,
      this.cityGroup,
    );
    this.level2Group.visible = false;
    this.level3Group.visible = false;
    this.level4Group.visible = false;
    this.level5Group.visible = false;
    this.cityGroup.visible = false;

    // Level 1: Frostwood Valley (1x Difficulty)
    this.worldGroup = createZoneTerrain('level1', this.textures, this.palette);
    this.level1Group.add(this.worldGroup);

    this.campfire = createCampfireModel(this.palette);
    this.campfire.flames.rotation.order = 'YXZ';
    this.campfire.group.position.copy(BUILDING_POSITIONS.campfire);
    this.level1Group.add(this.campfire.group);

    this.cabinGroup = createCabinMesh(1, this.palette);
    this.cabinGroup.position.copy(BUILDING_POSITIONS.cabin);
    this.cabinGroup.rotation.y = Math.atan2(-BUILDING_POSITIONS.cabin.x, -BUILDING_POSITIONS.cabin.z);
    this.level1Group.add(this.cabinGroup);

    const spec1 = ZONE_SPECS.level1;
    this.portal1 = createPortalModel('to_level2', this.palette);
    this.portal1.group.position.set(
      spec1.portalX,
      groundHeightAt(spec1.portalX, spec1.portalZ),
      spec1.portalZ,
    );
    this.portal1.group.rotation.y = spec1.portalFacingYaw;
    this.level1Group.add(this.portal1.group);

    this.cityPortal1 = createPortalModel('to_city', this.palette);
    this.cityPortal1.group.position.set(
      LEVEL1_CITY_PORTAL_X,
      groundHeightAt(LEVEL1_CITY_PORTAL_X, LEVEL1_CITY_PORTAL_Z),
      LEVEL1_CITY_PORTAL_Z,
    );
    this.cityPortal1.group.rotation.y = -Math.PI / 2;
    this.level1Group.add(this.cityPortal1.group);

    // Level 2: Glacial Highlands (3x Difficulty)
    this.level2WorldGroup = createZoneTerrain('level2', this.textures, this.palette);
    this.level2Group.add(this.level2WorldGroup);

    const spec2 = ZONE_SPECS.level2;
    this.portal2 = createPortalModel('to_level1', this.palette);
    this.portal2.group.position.set(
      spec2.portalX,
      groundHeightAt(spec2.portalX, spec2.portalZ),
      spec2.portalZ,
    );
    this.portal2.group.rotation.y = spec2.portalFacingYaw;
    this.level2Group.add(this.portal2.group);

    this.portal2Forward = createPortalModel('to_level2', this.palette);
    this.portal2Forward.group.position.set(
      spec2.forwardPortalX ?? spec2.portalX,
      groundHeightAt(spec2.forwardPortalX ?? spec2.portalX, spec2.forwardPortalZ ?? spec2.portalZ),
      spec2.forwardPortalZ ?? spec2.portalZ,
    );
    this.portal2Forward.group.rotation.y = spec2.forwardPortalFacingYaw ?? Math.PI / 2;
    this.level2Group.add(this.portal2Forward.group);

    this.waystationBrazier = createWaystationBrazierModel(this.palette);
    this.waystationBrazier.flames.rotation.order = 'YXZ';
    this.waystationBrazier.group.position.set(
      spec2.hearthX,
      groundHeightAt(spec2.hearthX, spec2.hearthZ),
      spec2.hearthZ,
    );
    this.level2Group.add(this.waystationBrazier.group);

    // Level 3: Rimefang Abyss (9x Difficulty)
    this.level3WorldGroup = createZoneTerrain('level3', this.textures, this.palette);
    this.level3Group.add(this.level3WorldGroup);

    const spec3 = ZONE_SPECS.level3;
    this.portal3Return = createPortalModel('to_level1', this.palette);
    this.portal3Return.group.position.set(
      spec3.portalX,
      groundHeightAt(spec3.portalX, spec3.portalZ),
      spec3.portalZ,
    );
    this.portal3Return.group.rotation.y = spec3.portalFacingYaw;
    this.level3Group.add(this.portal3Return.group);

    this.portal3Forward = createPortalModel('to_level2', this.palette);
    this.portal3Forward.group.position.set(
      spec3.forwardPortalX ?? spec3.portalX,
      groundHeightAt(spec3.forwardPortalX ?? spec3.portalX, spec3.forwardPortalZ ?? spec3.portalZ),
      spec3.forwardPortalZ ?? spec3.portalZ,
    );
    this.portal3Forward.group.rotation.y = spec3.forwardPortalFacingYaw ?? Math.PI;
    this.level3Group.add(this.portal3Forward.group);

    this.waystationBrazier3 = createWaystationBrazierModel(this.palette);
    this.waystationBrazier3.flames.rotation.order = 'YXZ';
    this.waystationBrazier3.group.position.set(
      spec3.hearthX,
      groundHeightAt(spec3.hearthX, spec3.hearthZ),
      spec3.hearthZ,
    );
    this.level3Group.add(this.waystationBrazier3.group);

    // Level 4: Obsidian Permafrost (27x Difficulty)
    this.level4WorldGroup = createZoneTerrain('level4', this.textures, this.palette);
    this.level4Group.add(this.level4WorldGroup);

    const spec4 = ZONE_SPECS.level4;
    this.portal4Return = createPortalModel('to_level1', this.palette);
    this.portal4Return.group.position.set(
      spec4.portalX,
      groundHeightAt(spec4.portalX, spec4.portalZ),
      spec4.portalZ,
    );
    this.portal4Return.group.rotation.y = spec4.portalFacingYaw;
    this.level4Group.add(this.portal4Return.group);

    this.portal4Forward = createPortalModel('to_level2', this.palette);
    this.portal4Forward.group.position.set(
      spec4.forwardPortalX ?? spec4.portalX,
      groundHeightAt(spec4.forwardPortalX ?? spec4.portalX, spec4.forwardPortalZ ?? spec4.portalZ),
      spec4.forwardPortalZ ?? spec4.portalZ,
    );
    this.portal4Forward.group.rotation.y = spec4.forwardPortalFacingYaw ?? -Math.PI / 2;
    this.level4Group.add(this.portal4Forward.group);

    this.waystationBrazier4 = createWaystationBrazierModel(this.palette);
    this.waystationBrazier4.flames.rotation.order = 'YXZ';
    this.waystationBrazier4.group.position.set(
      spec4.hearthX,
      groundHeightAt(spec4.hearthX, spec4.hearthZ),
      spec4.hearthZ,
    );
    this.level4Group.add(this.waystationBrazier4.group);

    // Level 5: Starfall Eternal Zero (81x Difficulty)
    this.level5WorldGroup = createZoneTerrain('level5', this.textures, this.palette);
    this.level5Group.add(this.level5WorldGroup);

    const spec5 = ZONE_SPECS.level5;
    this.portal5Return = createPortalModel('to_level1', this.palette);
    this.portal5Return.group.position.set(
      spec5.portalX,
      groundHeightAt(spec5.portalX, spec5.portalZ),
      spec5.portalZ,
    );
    this.portal5Return.group.rotation.y = spec5.portalFacingYaw;
    this.level5Group.add(this.portal5Return.group);

    this.waystationBrazier5 = createWaystationBrazierModel(this.palette);
    this.waystationBrazier5.flames.rotation.order = 'YXZ';
    this.waystationBrazier5.group.position.set(
      spec5.hearthX,
      groundHeightAt(spec5.hearthX, spec5.hearthZ),
      spec5.hearthZ,
    );
    this.level5Group.add(this.waystationBrazier5.group);

    // Frostcave City (East Subterranean Cavern City)
    this.cityWorldGroup = createZoneTerrain('city', this.textures, this.palette);
    this.cityGroup.add(this.cityWorldGroup);

    const specCity = ZONE_SPECS.city;
    this.cityPortal2 = createPortalModel('from_city', this.palette);
    this.cityPortal2.group.position.set(
      specCity.portalX,
      groundHeightAt(specCity.portalX, specCity.portalZ),
      specCity.portalZ,
    );
    this.cityPortal2.group.rotation.y = specCity.portalFacingYaw;
    this.cityGroup.add(this.cityPortal2.group);

    this.playerRig = createCharacterRig(this.palette, this.palette.coatRedMat, true);
    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;
    this.scene.add(this.playerRig.group);

    this.particles = new ParticlePool(this.scene, 180);
    this.snowfall = new SnowfallSystem(this.scene, 380);

    this.sightPulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x5be7ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const pulseGeo = new THREE.RingGeometry(0.84, 1.0, 56);
    pulseGeo.rotateX(-Math.PI / 2);
    this.sightPulseRingMesh = new THREE.Mesh(pulseGeo, this.sightPulseRingMat);
    this.sightPulseRingMesh.visible = false;
    this.scene.add(this.sightPulseRingMesh);

    this.arrowGeo.rotateX(Math.PI / 2);

    this.populateForest();
    this.populateBoulders();
    this.populateIceSculptures();
    this.populateWildlife();
    this.populateCityActors();
    this.populateZoneBosses();
    this.rebuildCampStructures();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    if (autostart) {
      this.startNewRun();
    } else {
      this.setPhase('title');
      this.updateTitleCamera(0);
    }

    // Draw initial frame immediately so first paint shows the live 3D winter clearing
    this.renderer.render(this.scene, this.camera);
    this.lastTimestamp = performance.now();
    this.scheduleNextFrame();
  }

  private getZoneGroup(zone: ZoneId): THREE.Group {
    if (zone === 'level2') return this.level2Group;
    if (zone === 'level3') return this.level3Group;
    if (zone === 'level4') return this.level4Group;
    if (zone === 'level5') return this.level5Group;
    if (zone === 'city') return this.cityGroup;
    return this.level1Group;
  }

  private populateForest(): void {
    const buildingCoords = Object.values(BUILDING_POSITIONS);
    const spec1 = ZONE_SPECS.level1;
    let nextTreeId = 0;

    // Level 1: Expanded Frostwood Valley forest (96 trees across radius 156)
    const count1 = 96;
    for (let i = 0; i < count1; i++) {
      const angle = i * 2.39996 + 0.4;
      const ringT = (i + 1) / count1;
      let dist = spec1.clearingRadius + ringT * (spec1.radius - spec1.clearingRadius - 4.0);
      let x = Math.cos(angle) * dist;
      let z = Math.sin(angle) * dist;
      const boss1 = ZONE_BOSS_SPECS.skarn_colossus;
      while (
        dist < spec1.radius - 4.0 &&
        (buildingCoords.some((bp) => Math.hypot(bp.x - x, bp.z - z) < 5.4) ||
          (Math.abs(x) < 4.5 && z < -8 && z > -104) ||
          (Math.abs(z) < 4.5 && x > 8 && x < 104) ||
          Math.hypot(x - spec1.portalX, z - spec1.portalZ) < 8.5 ||
          Math.hypot(x - LEVEL1_CITY_PORTAL_X, z - LEVEL1_CITY_PORTAL_Z) < 8.5 ||
          Math.hypot(x - boss1.arenaX, z - boss1.arenaZ) < 15.5)
      ) {
        dist += 3.0;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
      }
      if (
        Math.hypot(x - spec1.portalX, z - spec1.portalZ) < 8.0 ||
        Math.hypot(x - LEVEL1_CITY_PORTAL_X, z - LEVEL1_CITY_PORTAL_Z) < 8.0 ||
        Math.hypot(x - boss1.arenaX, z - boss1.arenaZ) < 15.0
      ) {
        continue;
      }

      const kind: TreeKind = i % 8 === 0 ? 'elder' : i % 3 === 0 ? 'spruce' : 'pine';
      const mesh = createTreeModel(kind, this.palette);
      const y = groundHeightAt(x, z);
      mesh.position.set(x, y, z);
      mesh.rotation.y = (i * 1.17) % (Math.PI * 2);
      this.level1Group.add(mesh);

      const maxHp = kind === 'elder' ? 140 : kind === 'spruce' ? 90 : 70;
      const woodYield = kind === 'elder' ? 10 : kind === 'spruce' ? 5 : 4;
      this.trees.push({
        id: nextTreeId++,
        zone: 'level1',
        kind,
        x,
        z,
        y,
        hp: maxHp,
        maxHp,
        woodYield,
        respawnTimer: 0,
        fallTimer: 0,
        shakeTimer: 0,
        flashTimer: 0,
        mesh,
      });
    }

    // Populate Wilderness Zones 2, 3, 4, 5 (76 trees each across their expanded radii)
    const highZones: Array<'level2' | 'level3' | 'level4' | 'level5'> = [
      'level2',
      'level3',
      'level4',
      'level5',
    ];
    for (const hz of highZones) {
      const zSpec = ZONE_SPECS[hz];
      const zBoss = getZoneBossSpec(hz);
      const treeCount = 76;
      const zoneGroup = this.getZoneGroup(hz);
      for (let i = 0; i < treeCount; i++) {
        const angle = i * 2.39996 + 0.9;
        const ringT = (i + 1) / treeCount;
        let dist = zSpec.clearingRadius + ringT * (zSpec.radius - zSpec.clearingRadius - 4.0);
        let x = zSpec.centerX + Math.cos(angle) * dist;
        let z = zSpec.centerZ + Math.sin(angle) * dist;
        while (
          dist < zSpec.radius - 4.0 &&
          (Math.hypot(x - zSpec.portalX, z - zSpec.portalZ) < 9.0 ||
            (zSpec.forwardPortalX !== undefined &&
              zSpec.forwardPortalZ !== undefined &&
              Math.hypot(x - zSpec.forwardPortalX, z - zSpec.forwardPortalZ) < 9.0) ||
            Math.hypot(x - zSpec.hearthX, z - zSpec.hearthZ) < 9.0 ||
            Math.hypot(x - zBoss.arenaX, z - zBoss.arenaZ) < 15.5)
        ) {
          dist += 3.0;
          x = zSpec.centerX + Math.cos(angle) * dist;
          z = zSpec.centerZ + Math.sin(angle) * dist;
        }
        if (
          Math.hypot(x - zSpec.portalX, z - zSpec.portalZ) < 8.5 ||
          (zSpec.forwardPortalX !== undefined &&
            zSpec.forwardPortalZ !== undefined &&
            Math.hypot(x - zSpec.forwardPortalX, z - zSpec.forwardPortalZ) < 8.5) ||
          Math.hypot(x - zSpec.hearthX, z - zSpec.hearthZ) < 8.5 ||
          Math.hypot(x - zBoss.arenaX, z - zBoss.arenaZ) < 15.0
        ) {
          continue;
        }

        const kind: TreeKind = i % 4 === 0 ? 'elder' : i % 2 === 0 ? 'spruce' : 'pine';
        const mesh = createTreeModel(kind, this.palette);
        const y = groundHeightAt(x, z);
        mesh.position.set(x, y, z);
        mesh.rotation.y = (i * 1.43) % (Math.PI * 2);
        zoneGroup.add(mesh);

        const hpScale = hz === 'level5' ? 1.6 : hz === 'level4' ? 1.4 : hz === 'level3' ? 1.2 : 1.0;
        const baseHp = kind === 'elder' ? 160 : kind === 'spruce' ? 100 : 80;
        const maxHp = Math.round(baseHp * hpScale);
        const woodYield = Math.round((kind === 'elder' ? 12 : kind === 'spruce' ? 6 : 5) * zSpec.yieldMult);
        this.trees.push({
          id: nextTreeId++,
          zone: hz,
          kind,
          x,
          z,
          y,
          hp: maxHp,
          maxHp,
          woodYield,
          respawnTimer: 0,
          fallTimer: 0,
          shakeTimer: 0,
          flashTimer: 0,
          mesh,
        });
      }
    }
  }

  private populateBoulders(): void {
    const buildingCoords = Object.values(BUILDING_POSITIONS);
    const spec1 = ZONE_SPECS.level1;
    let nextId = 0;

    // Level 1 boulders (28 across expanded radius)
    const count1 = 28;
    for (let i = 0; i < count1; i++) {
      const baseAngle = i * ((Math.PI * 2) / count1) + 0.35;
      const dist = 20.5 + (i % 6) * 20.5;

      let bx = Math.cos(baseAngle) * dist;
      let bz = Math.sin(baseAngle) * dist;
      for (let attempt = 0; attempt < 16; attempt++) {
        const a = baseAngle + attempt * 0.19;
        const r = Math.min(spec1.radius - 6, dist + (attempt % 3) * 2.4);
        const cx = Math.cos(a) * r;
        const cz = Math.sin(a) * r;
        const nearBuilding = buildingCoords.some(
          (bp) => Math.hypot(bp.x - cx, bp.z - cz) < 5.0,
        );
        const nearRoadOrPortal =
          (Math.abs(cx) < 4.5 && cz < -8 && cz > -104) ||
          (Math.abs(cz) < 4.6 && cx > 8 && cx < 104) ||
          Math.hypot(cx - spec1.portalX, cz - spec1.portalZ) < 8.5 ||
          Math.hypot(cx - LEVEL1_CITY_PORTAL_X, cz - LEVEL1_CITY_PORTAL_Z) < 8.5 ||
          Math.hypot(cx - ZONE_BOSS_SPECS.skarn_colossus.arenaX, cz - ZONE_BOSS_SPECS.skarn_colossus.arenaZ) < 15.0;
        const nearTree = this.trees.some(
          (t) => t.zone === 'level1' && Math.hypot(t.x - cx, t.z - cz) < 2.8,
        );
        const nearBoulder = this.boulders.some(
          (b) => b.zone === 'level1' && Math.hypot(b.x - cx, b.z - cz) < 3.5,
        );
        if (!nearBuilding && !nearRoadOrPortal && !nearTree && !nearBoulder) {
          bx = cx;
          bz = cz;
          break;
        }
      }

      const by = groundHeightAt(bx, bz);
      const mesh = createBoulderModel(this.palette);
      mesh.position.set(bx, by, bz);
      mesh.rotation.y = (i * 1.9) % (Math.PI * 2);
      this.level1Group.add(mesh);

      this.boulders.push({
        id: nextId++,
        zone: 'level1',
        x: bx,
        z: bz,
        y: by,
        hp: 75,
        maxHp: 75,
        stoneYield: 3,
        respawnTimer: 0,
        shakeTimer: 0,
        mesh,
      });
    }

    // Wilderness Zones 2, 3, 4, 5 Glacial Boulders (22 each)
    const highZones: Array<'level2' | 'level3' | 'level4' | 'level5'> = [
      'level2',
      'level3',
      'level4',
      'level5',
    ];
    for (const hz of highZones) {
      const zSpec = ZONE_SPECS[hz];
      const zBoss = getZoneBossSpec(hz);
      const zoneGroup = this.getZoneGroup(hz);
      const count = 22;
      for (let i = 0; i < count; i++) {
        const baseAngle = i * ((Math.PI * 2) / count) + 0.55;
        const dist = 18.5 + (i % 5) * 21.0;

        let bx = zSpec.centerX + Math.cos(baseAngle) * dist;
        let bz = zSpec.centerZ + Math.sin(baseAngle) * dist;
        for (let attempt = 0; attempt < 16; attempt++) {
          const a = baseAngle + attempt * 0.21;
          const r = Math.min(zSpec.radius - 6, dist + (attempt % 3) * 2.2);
          const cx = zSpec.centerX + Math.cos(a) * r;
          const cz = zSpec.centerZ + Math.sin(a) * r;
          const nearPlaza =
            Math.hypot(cx - zSpec.portalX, cz - zSpec.portalZ) < 9.0 ||
            (zSpec.forwardPortalX !== undefined &&
              zSpec.forwardPortalZ !== undefined &&
              Math.hypot(cx - zSpec.forwardPortalX, cz - zSpec.forwardPortalZ) < 9.0) ||
            Math.hypot(cx - zSpec.hearthX, cz - zSpec.hearthZ) < 9.0 ||
            Math.hypot(cx - zBoss.arenaX, cz - zBoss.arenaZ) < 15.0;
          const nearTree = this.trees.some(
            (t) => t.zone === hz && Math.hypot(t.x - cx, t.z - cz) < 2.8,
          );
          const nearBoulder = this.boulders.some(
            (b) => b.zone === hz && Math.hypot(b.x - cx, b.z - cz) < 3.5,
          );
          if (!nearPlaza && !nearTree && !nearBoulder) {
            bx = cx;
            bz = cz;
            break;
          }
        }

        const by = groundHeightAt(bx, bz);
        const mesh = createBoulderModel(this.palette);
        mesh.scale.setScalar(1.12);
        mesh.position.set(bx, by, bz);
        mesh.rotation.y = (i * 2.1) % (Math.PI * 2);
        zoneGroup.add(mesh);

        const maxHp = Math.round(95 * (hz === 'level5' ? 1.5 : hz === 'level4' ? 1.35 : hz === 'level3' ? 1.2 : 1.0));
        const stoneYield = Math.max(5, Math.round(4 * zSpec.yieldMult));
        this.boulders.push({
          id: nextId++,
          zone: hz,
          x: bx,
          z: bz,
          y: by,
          hp: maxHp,
          maxHp,
          stoneYield,
          respawnTimer: 0,
          shakeTimer: 0,
          mesh,
        });
      }
    }
  }

  private populateIceSculptures(): void {
    const buildingCoords = Object.values(BUILDING_POSITIONS);
    const spec1 = ZONE_SPECS.level1;
    let nextId = 0;

    // Level 1 wild ice sculptures (10)
    const count1 = 10;
    for (let i = 0; i < count1; i++) {
      const baseAngle = i * ((Math.PI * 2) / count1) + 0.65;
      const dist = 22.5 + (i % 4) * 24.5;

      let ix = Math.cos(baseAngle) * dist;
      let iz = Math.sin(baseAngle) * dist;
      for (let attempt = 0; attempt < 16; attempt++) {
        const a = baseAngle + attempt * 0.18;
        const r = Math.min(spec1.radius - 6, dist + (attempt % 2) * 2.2);
        const cx = Math.cos(a) * r;
        const cz = Math.sin(a) * r;
        const nearBuilding = buildingCoords.some(
          (bp) => Math.hypot(bp.x - cx, bp.z - cz) < 4.5,
        );
        const nearRoadOrPortal =
          (Math.abs(cx) < 4.5 && cz < -8 && cz > -104) ||
          Math.hypot(cx - spec1.portalX, cz - spec1.portalZ) < 8.5;
        const nearTree = this.trees.some(
          (t) => t.zone === 'level1' && Math.hypot(t.x - cx, t.z - cz) < 2.6,
        );
        const nearBoulder = this.boulders.some(
          (b) => b.zone === 'level1' && Math.hypot(b.x - cx, b.z - cz) < 3.0,
        );
        if (!nearBuilding && !nearRoadOrPortal && !nearTree && !nearBoulder) {
          ix = cx;
          iz = cz;
          break;
        }
      }

      const iy = groundHeightAt(ix, iz);
      const variant = (i % 3) as 0 | 1 | 2;
      const mesh = createWildIceSculptureModel(variant, this.palette);
      mesh.position.set(ix, iy, iz);
      mesh.rotation.y = (i * 1.3) % (Math.PI * 2);
      mesh.visible = false;
      this.level1Group.add(mesh);

      this.iceSculptures.push({
        id: nextId++,
        zone: 'level1',
        x: ix,
        z: iz,
        y: iy,
        hp: 55,
        maxHp: 55,
        iceYield: 2,
        respawnTimer: 0,
        shakeTimer: 0,
        mesh,
      });
    }

    // Wilderness Zones 2, 3, 4, 5 glacial crystal sculptures (8 each)
    const highZones: Array<'level2' | 'level3' | 'level4' | 'level5'> = [
      'level2',
      'level3',
      'level4',
      'level5',
    ];
    for (const hz of highZones) {
      const zSpec = ZONE_SPECS[hz];
      const zoneGroup = this.getZoneGroup(hz);
      const count = 8;
      for (let i = 0; i < count; i++) {
        const baseAngle = i * ((Math.PI * 2) / count) + 0.8;
        const dist = 20.0 + (i % 4) * 24.0;

        let ix = zSpec.centerX + Math.cos(baseAngle) * dist;
        let iz = zSpec.centerZ + Math.sin(baseAngle) * dist;
        for (let attempt = 0; attempt < 16; attempt++) {
          const a = baseAngle + attempt * 0.2;
          const r = Math.min(zSpec.radius - 6, dist + (attempt % 2) * 2.0);
          const cx = zSpec.centerX + Math.cos(a) * r;
          const cz = zSpec.centerZ + Math.sin(a) * r;
          const nearPlaza =
            Math.hypot(cx - zSpec.portalX, cz - zSpec.portalZ) < 8.5 ||
            Math.hypot(cx - zSpec.hearthX, cz - zSpec.hearthZ) < 8.5;
          const nearTree = this.trees.some(
            (t) => t.zone === hz && Math.hypot(t.x - cx, t.z - cz) < 2.6,
          );
          const nearBoulder = this.boulders.some(
            (b) => b.zone === hz && Math.hypot(b.x - cx, b.z - cz) < 3.0,
          );
          if (!nearPlaza && !nearTree && !nearBoulder) {
            ix = cx;
            iz = cz;
            break;
          }
        }

        const iy = groundHeightAt(ix, iz);
        const variant = ((i + 1) % 3) as 0 | 1 | 2;
        const mesh = createWildIceSculptureModel(variant, this.palette);
        mesh.position.set(ix, iy, iz);
        mesh.rotation.y = (i * 1.7) % (Math.PI * 2);
        mesh.visible = false;
        zoneGroup.add(mesh);

        this.iceSculptures.push({
          id: nextId++,
          zone: hz,
          x: ix,
          z: iz,
          y: iy,
          hp: 65,
          maxHp: 65,
          iceYield: Math.max(3, Math.round(2.5 * zSpec.yieldMult)),
          respawnTimer: 0,
          shakeTimer: 0,
          mesh,
        });
      }
    }
  }

  private spawnAnimal(
    kind: AnimalKind,
    minPlayerDist: number,
    zone: ZoneId = 'level1',
    explicitPos?: { x: number; z: number },
  ): AnimalEntity {
    const spec = SPECIES_SPECS[kind];
    const zSpec = ZONE_SPECS[zone];
    const zoneObstacles = this.trees.filter((t) => t.zone === zone);
    const { x, z } =
      explicitPos ??
      pickHabitatRespawnPoint({
        kind,
        zone,
        centerX: zSpec.centerX,
        centerZ: zSpec.centerZ,
        zoneRadius: zSpec.radius,
        hearthX: zSpec.hearthX,
        hearthZ: zSpec.hearthZ,
        portalX: zSpec.portalX,
        portalZ: zSpec.portalZ,
        forwardPortalX: zSpec.forwardPortalX,
        forwardPortalZ: zSpec.forwardPortalZ,
        cityPortalX: zone === 'level1' ? LEVEL1_CITY_PORTAL_X : undefined,
        cityPortalZ: zone === 'level1' ? LEVEL1_CITY_PORTAL_Z : undefined,
        playerX: this.playerX,
        playerZ: this.playerZ,
        minPlayerDist,
        obstacles: zoneObstacles,
        minObstacleDist: 2.3,
      });
    const model = createAnimalModel(kind, this.palette);
    model.group.position.set(x, groundHeightAt(x, z), z);
    const wanderAngle = Math.random() * Math.PI * 2;
    model.group.rotation.y = wanderAngle;
    this.getZoneGroup(zone).add(model.group);
    const scaledMaxHp = Math.round(
      spec.maxHp * (spec.predator ? zSpec.enemyHpMult : Math.max(1, zSpec.enemyHpMult * 0.65)),
    );
    const entity: AnimalEntity = {
      id: this.nextAnimalId++,
      zone,
      kind,
      x,
      z,
      vx: 0,
      vz: 0,
      yaw: wanderAngle,
      hp: scaledMaxHp,
      maxHp: scaledMaxHp,
      hitsTaken: 0,
      state: 'wander',
      stateTimer: 1 + Math.random() * 2,
      wanderAngle,
      flashTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      lastTrackX: x,
      lastTrackZ: z,
      model,
    };
    this.animals.push(entity);
    return entity;
  }

  private clearAllTracks(): void {
    for (const tr of this.tracks) {
      tr.visual.group.parent?.remove(tr.visual.group);
      tr.visual.printMat.dispose();
      tr.visual.glowMat.dispose();
    }
    this.tracks.length = 0;
  }

  private spawnTrackDecal(
    zone: ZoneId,
    kind: AnimalKind,
    animalId: number,
    x: number,
    z: number,
    yaw: number,
  ): void {
    while (this.tracks.length >= MAX_ACTIVE_TRACKS) {
      const oldest = this.tracks.shift();
      if (oldest) {
        oldest.visual.group.parent?.remove(oldest.visual.group);
        oldest.visual.printMat.dispose();
        oldest.visual.glowMat.dispose();
      }
    }
    const spec = SPECIES_SPECS[kind];
    const visual = createAnimalTrackMesh(kind, spec.rarity);
    visual.group.position.set(x, groundHeightAt(x, z) + 0.03, z);
    visual.group.rotation.y = yaw;
    this.getZoneGroup(zone).add(visual.group);
    this.tracks.push({
      id: this.nextTrackId++,
      zone,
      kind,
      animalId,
      x,
      z,
      yaw,
      age: 0,
      visual,
    });
  }

  private populateWildlife(): void {
    for (const a of this.animals) {
      a.model.group.parent?.remove(a.model.group);
    }
    this.animals.length = 0;
    this.clearAllTracks();

    // Level 1 wildlife population
    for (const kind of WILDLIFE_SPECIES_ORDER) {
      const target = SPECIES_SPECS[kind].targetCount;
      for (let i = 0; i < target; i++) {
        this.spawnAnimal(kind, 13.5, 'level1');
      }
    }

    // Level 2..5 Wilderness populations (increasing apex & mythic density in higher zones)
    const zonePackSpecs: Record<'level2' | 'level3' | 'level4' | 'level5', [AnimalKind, number][]> = {
      level2: [
        ['hare', 3],
        ['fox', 3],
        ['wolf', 4],
        ['lynx', 3],
        ['frost_stag', 2],
        ['musk_ox', 2],
        ['polar_bear', 1],
        ['sabertooth', 1],
      ],
      level3: [
        ['fox', 2],
        ['wolf', 4],
        ['lynx', 4],
        ['frost_stag', 3],
        ['musk_ox', 3],
        ['polar_bear', 2],
        ['mammoth', 1],
        ['sabertooth', 2],
      ],
      level4: [
        ['wolf', 5],
        ['lynx', 4],
        ['frost_stag', 3],
        ['musk_ox', 3],
        ['polar_bear', 3],
        ['mammoth', 2],
        ['sabertooth', 2],
        ['aurora_fenrir', 1],
      ],
      level5: [
        ['wolf', 5],
        ['lynx', 4],
        ['frost_stag', 3],
        ['musk_ox', 3],
        ['polar_bear', 3],
        ['mammoth', 2],
        ['sabertooth', 3],
        ['aurora_fenrir', 2],
      ],
    };

    for (const [hz, pack] of Object.entries(zonePackSpecs) as Array<
      ['level2' | 'level3' | 'level4' | 'level5', [AnimalKind, number][]]
    >) {
      for (const [kind, count] of pack) {
        for (let i = 0; i < count; i++) {
          this.spawnAnimal(kind, 14.0, hz);
        }
      }
    }

    if (this.initialWildlifeShowcase) {
      this.spawnAnimal('polar_bear', 10, 'level1', { x: -8.5, z: 13.5 });
      this.spawnAnimal('frost_stag', 10, 'level1', { x: 7.5, z: 12.5 });
      this.spawnAnimal('musk_ox', 10, 'level1', { x: -13.5, z: 10.5 });
      this.spawnAnimal('mammoth', 11, 'level1', { x: 0.5, z: 15.8 });
      this.spawnAnimal('sabertooth', 10, 'level1', { x: 13.5, z: 10.5 });
      this.spawnAnimal('aurora_fenrir', 11, 'level1', { x: -2.2, z: 19.8 });
    }

    if (this.initialSightReady) {
      const stag = this.spawnAnimal('frost_stag', 10, 'level1', { x: 9.2, z: -13.5 });
      this.spawnAnimal('fox', 10, 'level1', { x: -10.5, z: -12.0 });
      this.spawnTrackDecal(
        'level1',
        stag.kind,
        stag.id,
        1.6,
        3.2,
        Math.atan2(stag.x - 1.6, stag.z - 3.2),
      );
    }

    this.wildlifeSpawnTimer = 2.2;
  }

  private updateWildlifeSpawning(dt: number): void {
    this.wildlifeSpawnTimer -= dt;
    if (this.wildlifeSpawnTimer > 0) return;
    this.wildlifeSpawnTimer = 2.2;

    const zone = this.activeZone;
    const counts: Record<AnimalKind, number> = {
      hare: 0,
      fox: 0,
      stag: 0,
      wolf: 0,
      lynx: 0,
      polar_bear: 0,
      frost_stag: 0,
      musk_ox: 0,
      mammoth: 0,
      sabertooth: 0,
      aurora_fenrir: 0,
    };
    for (const a of this.animals) {
      if (a.zone === zone && a.state !== 'ko') {
        counts[a.kind] += 1;
      }
    }

    const nextKind = pickDynamicWildlifeSpawn(
      counts,
      Math.random,
      this.timeOfDay,
      zone,
    );
    if (nextKind) {
      this.spawnAnimal(nextKind, 15.5, zone);
      const spec = SPECIES_SPECS[nextKind];
      const placeName = ZONE_SPECS[zone].name;
      if (spec.rarity === 'mythic') {
        this.showToast(`Northern lights flare — a Mythic ${spec.label} stalks ${placeName}!`);
      } else if (spec.rarity === 'epic') {
        this.showToast(`The earth trembles — an Epic ${spec.label} roams ${placeName}!`);
      } else if (spec.rarity === 'rare') {
        this.showToast(`Fresh tracks in deep snow: a Rare ${spec.label} has entered ${placeName}!`);
      }
    }
  }

  private populateCityActors(): void {
    for (const st of this.cityStalls) {
      st.group.parent?.remove(st.group);
    }
    this.cityStalls.length = 0;
    for (const tr of this.cityTraderRigs) {
      tr.rig.group.parent?.remove(tr.rig.group);
    }
    this.cityTraderRigs.length = 0;
    for (const npc of this.cityNpcs) {
      npc.rig.group.parent?.remove(npc.rig.group);
    }
    this.cityNpcs.length = 0;

    // 4 Market Stalls & Merchant NPCs
    for (let i = 0; i < CITY_TRADER_ORDER.length; i++) {
      const id = CITY_TRADER_ORDER[i];
      const spec = CITY_TRADERS[id];
      const stall = createCityMarketStallMesh(spec.accentHex, id, this.palette);
      stall.group.position.set(
        spec.stallX,
        groundHeightAt(spec.stallX, spec.stallZ),
        spec.stallZ,
      );
      stall.group.rotation.y = spec.facingYaw;
      this.cityGroup.add(stall.group);
      this.cityStalls.push(stall);

      const coatMat = new THREE.MeshStandardMaterial({
        color: spec.accentHex,
        roughness: 0.72,
      });
      const rig = createCharacterRig(this.palette, coatMat, false);
      rig.axeGroup.visible = id === 'butcher' || id === 'tinker';
      rig.bowGroup.visible = id === 'quartermaster';
      rig.group.position.set(spec.npcX, groundHeightAt(spec.npcX, spec.npcZ), spec.npcZ);
      rig.group.rotation.y = spec.facingYaw;
      this.cityGroup.add(rig.group);
      this.cityTraderRigs.push({
        id,
        rig,
        x: spec.npcX,
        z: spec.npcZ,
        yaw: spec.facingYaw,
      });
    }

    // 5 Patrolling Townspeople NPCs
    for (let i = 0; i < CITY_AMBIENT_NPCS.length; i++) {
      const spec = CITY_AMBIENT_NPCS[i];
      const coatColor =
        spec.coatKind === 'blue'
          ? 0x3b6e9e
          : spec.coatKind === 'green'
            ? 0x3f8f60
            : 0xb5443a;
      const coatMat = new THREE.MeshStandardMaterial({
        color: coatColor,
        roughness: 0.74,
      });
      const rig = createCharacterRig(this.palette, coatMat, false);
      rig.axeGroup.visible = i % 2 === 0;
      rig.bowGroup.visible = i % 2 === 1;
      const wp0 = spec.waypoints[0];
      rig.group.position.set(wp0.x, groundHeightAt(wp0.x, wp0.z), wp0.z);
      this.cityGroup.add(rig.group);
      this.cityNpcs.push({
        spec,
        rig,
        x: wp0.x,
        z: wp0.z,
        yaw: 0,
        wpIdx: 1 % spec.waypoints.length,
        walkPhase: i * 1.4,
      });
    }

    // Valkyra Emberwing — Daily Quest Herald with Blazing 3D Wings of Fire
    if (this.cityQuestNpcRig) {
      this.cityQuestNpcRig.group.parent?.remove(this.cityQuestNpcRig.group);
      this.cityQuestNpcRig = null;
    }
    if (this.cityQuestDaisGroup) {
      this.cityQuestDaisGroup.parent?.remove(this.cityQuestDaisGroup);
      this.cityQuestDaisGroup = null;
    }

    const qx = CITY_QUEST_NPC.x;
    const qz = CITY_QUEST_NPC.z;
    const qy = groundHeightAt(qx, qz);

    const daisGroup = new THREE.Group();
    const daisBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 2.05, 0.24, 16),
      this.palette.stoneMat,
    );
    daisBase.position.y = 0.12;
    daisBase.receiveShadow = true;
    const daisRuneRing = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 1.72, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff6b1a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      }),
    );
    daisRuneRing.rotation.x = -Math.PI / 2;
    daisRuneRing.position.y = 0.25;
    daisGroup.add(daisBase, daisRuneRing);
    daisGroup.position.set(qx, qy, qz);
    this.cityGroup.add(daisGroup);
    this.cityQuestDaisGroup = daisGroup;

    const heraldCoatMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.35,
      roughness: 0.55,
    });
    const questRig = createCharacterRig(this.palette, heraldCoatMat, false);
    questRig.axeGroup.visible = true;
    questRig.bowGroup.visible = false;
    questRig.group.position.set(qx, qy + 0.24, qz);
    questRig.group.rotation.y = CITY_QUEST_NPC.facingYaw;
    updateCharacterEquipmentVisuals(questRig, {
      axeLevel: 7,
      bowLevel: 7,
      gearAvgTier: 5,
      activeBuffCount: 3,
      wingsTier: 3,
      time: 0,
      moveSpeedRatio: 0.25,
    });
    this.cityGroup.add(questRig.group);
    this.cityQuestNpcRig = questRig;
  }

  private updateCityActors(dt: number): void {
    // Animate merchant idle & subtle wave
    for (let i = 0; i < this.cityTraderRigs.length; i++) {
      const tr = this.cityTraderRigs[i];
      const dx = this.playerX - tr.x;
      const dz = this.playerZ - tr.z;
      const dist = Math.hypot(dx, dz);
      const targetYaw = dist < 6.5 ? Math.atan2(dx, dz) : tr.yaw;
      tr.rig.group.rotation.y = dampAngle(tr.rig.group.rotation.y, targetYaw, 6, dt);

      const pose = computeBipedGait({
        walkPhase: 0,
        speed: 0,
        maxSpeed: 4.0,
        isCreeping: false,
        idleTime: this.totalTime + i * 1.7,
        swingProgress: dist < 4.5 ? 0.35 + Math.sin(this.totalTime * 3.8 + i) * 0.15 : 0,
        activeTool: 'axe',
        turnBank: 0,
      });
      tr.rig.leftLeg.rotation.x = pose.leftHipX;
      tr.rig.rightLeg.rotation.x = pose.rightHipX;
      tr.rig.leftArm.rotation.x = pose.leftShoulderX;
      tr.rig.rightArm.rotation.x = pose.rightShoulderX;
      tr.rig.torsoPivot.rotation.set(pose.torsoPitchX, pose.torsoTwistY, pose.torsoRollZ);
      tr.rig.bodyGroup.position.y = pose.pelvisY;
    }

    // Animate patrolling townspeople along plaza avenues
    for (let i = 0; i < this.cityNpcs.length; i++) {
      const npc = this.cityNpcs[i];
      const targetWp = npc.spec.waypoints[npc.wpIdx];
      const dx = targetWp.x - npc.x;
      const dz = targetWp.z - npc.z;
      const dist = Math.hypot(dx, dz);
      const distPlayer = Math.hypot(this.playerX - npc.x, this.playerZ - npc.z);
      let moveSpd = 0;

      if (distPlayer < 2.6) {
        // Pause politely & face player when close
        npc.yaw = dampAngle(npc.yaw, Math.atan2(this.playerX - npc.x, this.playerZ - npc.z), 8, dt);
      } else if (dist < 0.65) {
        npc.wpIdx = (npc.wpIdx + 1) % npc.spec.waypoints.length;
      } else {
        moveSpd = 2.65;
        npc.x += (dx / dist) * moveSpd * dt;
        npc.z += (dz / dist) * moveSpd * dt;
        npc.yaw = dampAngle(npc.yaw, Math.atan2(dx, dz), 9, dt);
        npc.walkPhase += moveSpd * dt * 1.55;
      }

      const pose = computeBipedGait({
        walkPhase: npc.walkPhase,
        speed: moveSpd,
        maxSpeed: 3.4,
        isCreeping: false,
        idleTime: this.totalTime + i * 1.1,
        swingProgress: 0,
        activeTool: i % 2 === 0 ? 'axe' : 'bow',
        turnBank: 0,
      });
      npc.rig.leftLeg.rotation.x = pose.leftHipX;
      npc.rig.leftKnee.rotation.x = pose.leftKneeX;
      npc.rig.rightLeg.rotation.x = pose.rightHipX;
      npc.rig.rightKnee.rotation.x = pose.rightKneeX;
      npc.rig.leftArm.rotation.x = pose.leftShoulderX;
      npc.rig.rightArm.rotation.x = pose.rightShoulderX;
      npc.rig.torsoPivot.rotation.set(pose.torsoPitchX, pose.torsoTwistY, pose.torsoRollZ);
      npc.rig.bodyGroup.position.y = pose.pelvisY;
      npc.rig.group.position.set(npc.x, groundHeightAt(npc.x, npc.z), npc.z);
      npc.rig.group.rotation.y = npc.yaw;
    }

    // Animate Valkyra Emberwing (Daily Quest Herald & 3D Wings of Fire Showcase)
    if (this.cityQuestNpcRig) {
      const dx = this.playerX - CITY_QUEST_NPC.x;
      const dz = this.playerZ - CITY_QUEST_NPC.z;
      const dist = Math.hypot(dx, dz);
      const targetYaw = dist < 8.5 ? Math.atan2(dx, dz) : CITY_QUEST_NPC.facingYaw;
      this.cityQuestNpcRig.group.rotation.y = dampAngle(
        this.cityQuestNpcRig.group.rotation.y,
        targetYaw,
        6,
        dt,
      );
      const pose = computeBipedGait({
        walkPhase: 0,
        speed: 0,
        maxSpeed: 4.0,
        isCreeping: false,
        idleTime: this.totalTime + 2.4,
        swingProgress: dist < 5.0 ? 0.3 + Math.sin(this.totalTime * 3.5) * 0.14 : 0,
        activeTool: 'axe',
        turnBank: 0,
      });
      this.cityQuestNpcRig.leftLeg.rotation.x = pose.leftHipX;
      this.cityQuestNpcRig.rightLeg.rotation.x = pose.rightHipX;
      this.cityQuestNpcRig.leftArm.rotation.x = pose.leftShoulderX;
      this.cityQuestNpcRig.rightArm.rotation.x = pose.rightShoulderX;
      this.cityQuestNpcRig.torsoPivot.rotation.set(
        pose.torsoPitchX,
        pose.torsoTwistY,
        pose.torsoRollZ,
      );
      this.cityQuestNpcRig.bodyGroup.position.y = pose.pelvisY;
      updateCharacterEquipmentVisuals(this.cityQuestNpcRig, {
        axeLevel: 7,
        bowLevel: 7,
        gearAvgTier: 5,
        activeBuffCount: 3,
        wingsTier: 3,
        time: this.totalTime,
        moveSpeedRatio: 0.35,
      });
    }
  }

  private rebuildCampStructures(): void {
    // Cabin
    this.cabinGroup.parent?.remove(this.cabinGroup);
    this.cabinGroup = createCabinMesh(this.levels.cabin, this.palette);
    this.cabinGroup.position.copy(BUILDING_POSITIONS.cabin);
    this.cabinGroup.rotation.y = Math.atan2(-BUILDING_POSITIONS.cabin.x, -BUILDING_POSITIONS.cabin.z);
    this.level1Group.add(this.cabinGroup);

    // Lumberjack Camp or plot marker
    if (this.lumberCampGroup) {
      this.lumberCampGroup.parent?.remove(this.lumberCampGroup);
      this.lumberCampGroup = null;
    }
    if (this.levels.lumberCamp > 0) {
      this.lumberCampGroup = createLumberCampMesh(this.levels.lumberCamp, this.palette);
      this.lumberCampGroup.position.copy(BUILDING_POSITIONS.lumberCamp);
      this.lumberCampGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.lumberCamp.x,
        -BUILDING_POSITIONS.lumberCamp.z,
      );
      this.level1Group.add(this.lumberCampGroup);
    } else {
      this.lumberCampGroup = createPlotMarkerMesh(this.palette);
      this.lumberCampGroup.position.copy(BUILDING_POSITIONS.lumberCamp);
      this.lumberCampGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.lumberCamp.x,
        -BUILDING_POSITIONS.lumberCamp.z,
      );
      this.level1Group.add(this.lumberCampGroup);
    }

    // Sawmill or plot marker
    if (this.sawmillVisual) {
      this.sawmillVisual.group.parent?.remove(this.sawmillVisual.group);
      this.sawmillVisual = null;
    }
    if (this.levels.sawmill > 0) {
      this.sawmillVisual = createSawmillMesh(this.levels.sawmill, this.palette);
      this.sawmillVisual.group.position.copy(BUILDING_POSITIONS.sawmill);
      this.sawmillVisual.group.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.sawmill.x,
        -BUILDING_POSITIONS.sawmill.z,
      );
      this.level1Group.add(this.sawmillVisual.group);
    } else {
      const marker = createPlotMarkerMesh(this.palette);
      marker.position.copy(BUILDING_POSITIONS.sawmill);
      marker.rotation.y = Math.atan2(-BUILDING_POSITIONS.sawmill.x, -BUILDING_POSITIONS.sawmill.z);
      this.sawmillVisual = { group: marker, blade: marker.children[1] as THREE.Mesh };
      this.level1Group.add(marker);
    }

    // Tannery or plot marker
    if (this.tanneryGroup) {
      this.tanneryGroup.parent?.remove(this.tanneryGroup);
      this.tanneryGroup = null;
    }
    if (this.levels.tannery > 0) {
      this.tanneryGroup = createTanneryMesh(this.levels.tannery, this.palette);
      this.tanneryGroup.position.copy(BUILDING_POSITIONS.tannery);
      this.tanneryGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.tannery.x,
        -BUILDING_POSITIONS.tannery.z,
      );
      this.level1Group.add(this.tanneryGroup);
    } else {
      this.tanneryGroup = createPlotMarkerMesh(this.palette);
      this.tanneryGroup.position.copy(BUILDING_POSITIONS.tannery);
      this.tanneryGroup.rotation.y = Math.atan2(-BUILDING_POSITIONS.tannery.x, -BUILDING_POSITIONS.tannery.z);
      this.level1Group.add(this.tanneryGroup);
    }

    // Forge or plot marker
    if (this.forgeGroup) {
      this.forgeGroup.parent?.remove(this.forgeGroup);
      this.forgeGroup = null;
    }
    if (this.levels.forge > 0) {
      this.forgeGroup = createForgeMesh(this.levels.forge, this.palette);
      this.forgeGroup.position.copy(BUILDING_POSITIONS.forge);
      this.forgeGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.forge.x,
        -BUILDING_POSITIONS.forge.z,
      );
      this.level1Group.add(this.forgeGroup);
    } else {
      this.forgeGroup = createPlotMarkerMesh(this.palette);
      this.forgeGroup.position.copy(BUILDING_POSITIONS.forge);
      this.forgeGroup.rotation.y = Math.atan2(-BUILDING_POSITIONS.forge.x, -BUILDING_POSITIONS.forge.z);
      this.level1Group.add(this.forgeGroup);
    }

    // Pet Taming Pen or plot marker (open +Z gate aimed cleanly toward Hearth Plaza)
    if (this.tamingPenGroup) {
      this.tamingPenGroup.parent?.remove(this.tamingPenGroup);
      this.tamingPenGroup = null;
    }
    const penLevel = this.levels.tamingPen ?? 0;
    if (penLevel > 0) {
      this.tamingPenGroup = createTamingPenMesh(penLevel, this.palette);
      this.tamingPenGroup.position.copy(BUILDING_POSITIONS.tamingPen);
      this.tamingPenGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.tamingPen.x,
        -BUILDING_POSITIONS.tamingPen.z,
      );
      this.level1Group.add(this.tamingPenGroup);
    } else {
      this.tamingPenGroup = createPlotMarkerMesh(this.palette);
      this.tamingPenGroup.position.copy(BUILDING_POSITIONS.tamingPen);
      this.tamingPenGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.tamingPen.x,
        -BUILDING_POSITIONS.tamingPen.z,
      );
      this.level1Group.add(this.tamingPenGroup);
    }

    // Storm Shelter or plot marker
    if (this.stormShelterVisual) {
      this.stormShelterVisual.group.parent?.remove(this.stormShelterVisual.group);
      this.stormShelterVisual = null;
    }
    const shelterLevel = this.levels.stormShelter ?? 0;
    if (shelterLevel > 0) {
      const spec = getStormShelterSpec(shelterLevel);
      this.stormShelterVisual = createStormShelterMesh(
        shelterLevel,
        this.palette,
        spec.radius,
      );
      this.stormShelterVisual.group.position.copy(BUILDING_POSITIONS.stormShelter);
      this.stormShelterVisual.group.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.stormShelter.x,
        -BUILDING_POSITIONS.stormShelter.z,
      );
      this.level1Group.add(this.stormShelterVisual.group);
    } else {
      const marker = createPlotMarkerMesh(this.palette);
      marker.position.copy(BUILDING_POSITIONS.stormShelter);
      marker.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.stormShelter.x,
        -BUILDING_POSITIONS.stormShelter.z,
      );
      this.stormShelterVisual = {
        group: marker,
        dome: marker.children[0] as THREE.Mesh,
        ring: marker.children[0] as THREE.Mesh,
        beacon: marker.children[2] as THREE.Mesh,
      };
      this.level1Group.add(marker);
    }

    // Windbreak Palisade (Wind-Resistant Infrastructure) or plot marker
    if (this.windbreakGroup) {
      this.windbreakGroup.parent?.remove(this.windbreakGroup);
      this.windbreakGroup = null;
    }
    const windbreakLevel = this.levels.windbreak ?? 0;
    if (windbreakLevel > 0) {
      this.windbreakGroup = createWindbreakPalisadeMesh(windbreakLevel, this.palette);
      this.windbreakGroup.position.copy(BUILDING_POSITIONS.windbreak);
      this.windbreakGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.windbreak.x,
        -BUILDING_POSITIONS.windbreak.z,
      );
      this.level1Group.add(this.windbreakGroup);
    } else {
      this.windbreakGroup = createPlotMarkerMesh(this.palette);
      this.windbreakGroup.position.copy(BUILDING_POSITIONS.windbreak);
      this.windbreakGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.windbreak.x,
        -BUILDING_POSITIONS.windbreak.z,
      );
      this.level1Group.add(this.windbreakGroup);
    }

    // Thermal Conduit (Heat-Retaining Infrastructure) or plot marker
    if (this.thermalConduitGroup) {
      this.thermalConduitGroup.parent?.remove(this.thermalConduitGroup);
      this.thermalConduitGroup = null;
    }
    const thermalLevel = this.levels.thermalConduit ?? 0;
    if (thermalLevel > 0) {
      this.thermalConduitGroup = createThermalConduitMesh(thermalLevel, this.palette);
      this.thermalConduitGroup.position.copy(BUILDING_POSITIONS.thermalConduit);
      this.thermalConduitGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.thermalConduit.x,
        -BUILDING_POSITIONS.thermalConduit.z,
      );
      this.level1Group.add(this.thermalConduitGroup);
    } else {
      this.thermalConduitGroup = createPlotMarkerMesh(this.palette);
      this.thermalConduitGroup.position.copy(BUILDING_POSITIONS.thermalConduit);
      this.thermalConduitGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.thermalConduit.x,
        -BUILDING_POSITIONS.thermalConduit.z,
      );
      this.level1Group.add(this.thermalConduitGroup);
    }

    // Seasonal Festival Pavilion (plot marker visible when event is active; stays standing once built)
    if (this.festivalPavilionGroup) {
      this.festivalPavilionGroup.parent?.remove(this.festivalPavilionGroup);
      this.festivalPavilionGroup = null;
    }
    const pavLevel = this.levels.festivalPavilion ?? 0;
    if (pavLevel > 0) {
      this.festivalPavilionGroup = createFestivalPavilionMesh(pavLevel, this.palette);
      this.festivalPavilionGroup.position.copy(BUILDING_POSITIONS.festivalPavilion);
      this.festivalPavilionGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.festivalPavilion.x,
        -BUILDING_POSITIONS.festivalPavilion.z,
      );
      this.level1Group.add(this.festivalPavilionGroup);
    } else if (this.seasonalEvent.active) {
      this.festivalPavilionGroup = createPlotMarkerMesh(this.palette);
      this.festivalPavilionGroup.position.copy(BUILDING_POSITIONS.festivalPavilion);
      this.festivalPavilionGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.festivalPavilion.x,
        -BUILDING_POSITIONS.festivalPavilion.z,
      );
      this.level1Group.add(this.festivalPavilionGroup);
    }

    // Seasonal Camp Ice Sculpture Monument
    if (this.iceMonumentGroup) {
      this.iceMonumentGroup.parent?.remove(this.iceMonumentGroup);
      this.iceMonumentGroup = null;
    }
    const monumentLevel = this.levels.iceMonument ?? 0;
    if (monumentLevel > 0) {
      this.iceMonumentGroup = createCampIceSculptureMesh(monumentLevel, this.palette);
      this.iceMonumentGroup.position.copy(BUILDING_POSITIONS.iceMonument);
      this.iceMonumentGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.iceMonument.x,
        -BUILDING_POSITIONS.iceMonument.z,
      );
      this.level1Group.add(this.iceMonumentGroup);
    } else if (this.seasonalEvent.active) {
      this.iceMonumentGroup = createPlotMarkerMesh(this.palette);
      this.iceMonumentGroup.position.copy(BUILDING_POSITIONS.iceMonument);
      this.iceMonumentGroup.rotation.y = Math.atan2(
        -BUILDING_POSITIONS.iceMonument.x,
        -BUILDING_POSITIONS.iceMonument.z,
      );
      this.level1Group.add(this.iceMonumentGroup);
    }

    // Artisan Crafting Station (Hammer, Gears, Tools & Traps)
    if (this.craftingStationVisual) {
      this.craftingStationVisual.group.parent?.remove(this.craftingStationVisual.group);
      this.craftingStationVisual = null;
    }
    this.craftingStationVisual = createCraftingStationMesh(this.palette);
    this.craftingStationVisual.group.position.copy(BUILDING_POSITIONS.craftingStation);
    // Orient open workbench face south-southwest toward camera & camp path
    this.craftingStationVisual.group.rotation.y = -0.32;
    this.level1Group.add(this.craftingStationVisual.group);

    // Sync warmth boundary ring radius
    const { warmthRadius } = calculatePassiveRates(this.levels);
    const scale = warmthRadius / 8.45;
    this.campfire.warmthRing.scale.set(scale, scale, 1);

    // Sync AI Workers
    this.syncWorkers();
    this.syncPlayerWeaponVisuals();
    this.syncPlayerGearVisuals();
  }

  private syncWorkers(): void {
    for (const w of this.workers) {
      w.rig.group.parent?.remove(w.rig.group);
    }
    this.workers.length = 0;

    if (this.levels.lumberCamp >= 2) {
      const rig = createCharacterRig(this.palette, this.palette.coatBlueMat, true);
      rig.axeGroup.visible = true;
      rig.bowGroup.visible = false;
      const cx = BUILDING_POSITIONS.lumberCamp.x;
      const cz = BUILDING_POSITIONS.lumberCamp.z + 2.2;
      rig.group.position.set(cx, groundHeightAt(cx, cz), cz);
      this.level1Group.add(rig.group);
      this.workers.push({
        role: 'campcutter',
        x: cx,
        z: cz,
        yaw: 0,
        state: 'toTarget',
        timer: 0.5,
        targetX: -2,
        targetZ: -20,
        walkPhase: 0,
        rig,
      });
    }

    for (let i = 0; i < this.levels.sawmill; i++) {
      const rig = createCharacterRig(this.palette, this.palette.coatBlueMat, true);
      rig.axeGroup.visible = true;
      rig.bowGroup.visible = false;
      const sx = BUILDING_POSITIONS.sawmill.x + (i - 0.5) * 1.5;
      const sz = BUILDING_POSITIONS.sawmill.z + 2.4;
      rig.group.position.set(sx, groundHeightAt(sx, sz), sz);
      this.level1Group.add(rig.group);
      this.workers.push({
        role: 'lumberjack',
        x: sx,
        z: sz,
        yaw: 0,
        state: 'toTarget',
        timer: 0.4 + i * 0.5,
        targetX: 16 + i * 4,
        targetZ: -8 + i * 6,
        walkPhase: 0,
        rig,
      });
    }

    const trapperCount = this.levels.tannery >= 3 ? 2 : this.levels.tannery >= 1 ? 1 : 0;
    for (let i = 0; i < trapperCount; i++) {
      const rig = createCharacterRig(this.palette, this.palette.coatGreenMat, true);
      rig.axeGroup.visible = false;
      rig.bowGroup.visible = true;
      rig.quiverGroup.visible = true;
      const tx = BUILDING_POSITIONS.tannery.x + (i - 0.5) * 1.4;
      const tz = BUILDING_POSITIONS.tannery.z + 2.4;
      rig.group.position.set(tx, groundHeightAt(tx, tz), tz);
      this.level1Group.add(rig.group);
      this.workers.push({
        role: 'trapper',
        x: tx,
        z: tz,
        yaw: 0,
        state: 'toTarget',
        timer: 0.6 + i * 0.7,
        targetX: -18 - i * 3,
        targetZ: 14 - i * 5,
        walkPhase: 0,
        rig,
      });
    }
  }

  private syncPlayerWeaponVisuals(): void {
    this.playerRig.axeGroup.visible = this.activeTool === 'axe';
    this.playerRig.bowGroup.visible = this.activeTool === 'bow';
    this.playerRig.quiverGroup.visible = this.activeTool === 'bow';

    // Visual progression on 7-tier Axe Blades & Rune Inlay
    const axeLvl = this.levels.axe;
    this.playerRig.axeGroup.scale.setScalar(1 + (axeLvl - 1) * 0.036);
    this.playerRig.axeRuneMesh.visible = axeLvl >= 4;
    if (axeLvl === 1) {
      this.playerRig.axeHeadMat.color.setHex(0x8a9199);
      this.playerRig.axeHeadMat.emissive.setHex(0x000000);
      this.playerRig.axeHeadMat.emissiveIntensity = 0;
    } else if (axeLvl === 2) {
      this.playerRig.axeHeadMat.color.setHex(0xb8c4d0);
      this.playerRig.axeHeadMat.emissive.setHex(0x000000);
      this.playerRig.axeHeadMat.emissiveIntensity = 0;
    } else if (axeLvl === 3) {
      this.playerRig.axeHeadMat.color.setHex(0xe5ecf5);
      this.playerRig.axeHeadMat.emissive.setHex(0x223344);
      this.playerRig.axeHeadMat.emissiveIntensity = 0.25;
    } else if (axeLvl === 4) {
      this.playerRig.axeHeadMat.color.setHex(0x88e8ff);
      this.playerRig.axeHeadMat.emissive.setHex(0x1f7ca8);
      this.playerRig.axeHeadMat.emissiveIntensity = 0.65;
      this.playerRig.axeRuneMat.color.setHex(0x9cecff);
      this.playerRig.axeRuneMat.emissive.setHex(0x38bdf8);
    } else if (axeLvl === 5) {
      this.playerRig.axeHeadMat.color.setHex(0xc4b5fd);
      this.playerRig.axeHeadMat.emissive.setHex(0x5b21b6);
      this.playerRig.axeHeadMat.emissiveIntensity = 0.72;
      this.playerRig.axeRuneMat.color.setHex(0xe9d5ff);
      this.playerRig.axeRuneMat.emissive.setHex(0xa855f7);
    } else if (axeLvl === 6) {
      this.playerRig.axeHeadMat.color.setHex(0xbae6fd);
      this.playerRig.axeHeadMat.emissive.setHex(0x0369a1);
      this.playerRig.axeHeadMat.emissiveIntensity = 0.85;
      this.playerRig.axeRuneMat.color.setHex(0xe0f2fe);
      this.playerRig.axeRuneMat.emissive.setHex(0x38bdf8);
    } else {
      this.playerRig.axeHeadMat.color.setHex(0xf5d0fe);
      this.playerRig.axeHeadMat.emissive.setHex(0xa21caf);
      this.playerRig.axeHeadMat.emissiveIntensity = 1.0;
      this.playerRig.axeRuneMat.color.setHex(0xfde047);
      this.playerRig.axeRuneMat.emissive.setHex(0xf472b6);
    }

    // Visual progression on 7-tier Bow Staves, Crystal Sights & Projectiles
    const bowLvl = this.levels.bow;
    this.playerRig.bowGroup.scale.setScalar(1 + (bowLvl - 1) * 0.025);
    this.playerRig.bowCrystalGroup.visible = bowLvl >= 4;
    if (bowLvl === 1) {
      this.playerRig.bowLimbMat.color.setHex(0x8c5b39);
      this.playerRig.bowLimbMat.emissive.setHex(0x000000);
      this.arrowMat.color.setHex(0xf6d38b);
      this.arrowMat.emissive.setHex(0x553310);
    } else if (bowLvl === 2) {
      this.playerRig.bowLimbMat.color.setHex(0xb57b45);
      this.playerRig.bowLimbMat.emissive.setHex(0x000000);
      this.arrowMat.color.setHex(0xf6d38b);
      this.arrowMat.emissive.setHex(0x664415);
    } else if (bowLvl === 3) {
      this.playerRig.bowLimbMat.color.setHex(0xa8bac9);
      this.playerRig.bowLimbMat.emissive.setHex(0x223344);
      this.arrowMat.color.setHex(0xdce8f5);
      this.arrowMat.emissive.setHex(0x2d4866);
    } else if (bowLvl === 4) {
      this.playerRig.bowLimbMat.color.setHex(0xf2c24e);
      this.playerRig.bowLimbMat.emissive.setHex(0x9a6412);
      this.playerRig.bowLimbMat.emissiveIntensity = 0.5;
      this.playerRig.bowCrystalMat.color.setHex(0x8ef7ff);
      this.playerRig.bowCrystalMat.emissive.setHex(0x38bdf8);
      this.arrowMat.color.setHex(0x8ef7ff);
      this.arrowMat.emissive.setHex(0x2890c8);
    } else if (bowLvl === 5) {
      this.playerRig.bowLimbMat.color.setHex(0x8ce8ff);
      this.playerRig.bowLimbMat.emissive.setHex(0x0369a1);
      this.playerRig.bowLimbMat.emissiveIntensity = 0.65;
      this.playerRig.bowCrystalMat.color.setHex(0xd8b4fe);
      this.playerRig.bowCrystalMat.emissive.setHex(0x9333ea);
      this.arrowMat.color.setHex(0xc4f1ff);
      this.arrowMat.emissive.setHex(0x38bdf8);
    } else if (bowLvl === 6) {
      this.playerRig.bowLimbMat.color.setHex(0xd8b4fe);
      this.playerRig.bowLimbMat.emissive.setHex(0x581c87);
      this.playerRig.bowLimbMat.emissiveIntensity = 0.72;
      this.playerRig.bowCrystalMat.color.setHex(0x9ef0ff);
      this.playerRig.bowCrystalMat.emissive.setHex(0x06b6d4);
      this.arrowMat.color.setHex(0xe9d5ff);
      this.arrowMat.emissive.setHex(0x9333ea);
    } else {
      this.playerRig.bowLimbMat.color.setHex(0xfef08a);
      this.playerRig.bowLimbMat.emissive.setHex(0xc026d3);
      this.playerRig.bowLimbMat.emissiveIntensity = 0.9;
      this.playerRig.bowCrystalMat.color.setHex(0xf5d0fe);
      this.playerRig.bowCrystalMat.emissive.setHex(0xe879f9);
      this.arrowMat.color.setHex(0xfdf4ff);
      this.arrowMat.emissive.setHex(0xd946ef);
    }

    const gearAvgTier =
      (this.gear.coat + this.gear.boots + this.gear.gloves + this.gear.pack) / 4;
    updateCharacterEquipmentVisuals(this.playerRig, {
      axeLevel: this.levels.axe,
      bowLevel: this.levels.bow,
      gearAvgTier,
      activeBuffCount: this.countActiveCraftBuffs(),
      wingsTier: this.wingsTier,
      wingsEquipped: this.wingsEquipped,
      time: this.totalTime,
      moveSpeedRatio: 0,
    });
  }

  private getEffectiveWingsTier(): number {
    return this.wingsEquipped ? this.wingsTier : 0;
  }

  private countActiveCraftBuffs(): number {
    let count = 0;
    if (this.activeBuffs.fireStarter > 0) count++;
    if (this.activeBuffs.insulatedBoots > 0) count++;
    if (this.activeBuffs.flintEdge > 0) count++;
    if ((this.activeBuffs.frostWhetstone ?? 0) > 0) count++;
    if ((this.activeBuffs.auroraCharm ?? 0) > 0) count++;
    if ((this.activeBuffs.hammerTemper ?? 0) > 0) count++;
    if ((this.activeBuffs.utilityToolkit ?? 0) > 0) count++;
    return count;
  }

  private syncPlayerGearVisuals(): void {
    const coatTier = this.gear.coat;
    const coatColors = [0xb8382c, 0xc25b32, 0x8a5b36, 0x3b4859, 0x164e63];
    const trimColors = [0xf2ece1, 0xf6efe6, 0xeadbc8, 0xcbd5e1, 0x9fe8ff];
    if (coatTier <= 0) {
      this.playerRig.coatMat.color.setHex(0x64748b);
      this.playerRig.coatMat.emissive.setHex(0x000000);
      this.playerRig.coatMat.emissiveIntensity = 0;
      this.playerRig.trimMat.color.setHex(0xcfd8e3);
    } else {
      const cIdx = Math.max(0, Math.min(4, coatTier - 1));
      this.playerRig.coatMat.color.setHex(coatColors[cIdx]);
      this.playerRig.coatMat.emissive.setHex(
        coatTier >= 5 ? 0x0e7490 : coatTier >= 4 ? 0x1e293b : 0x000000,
      );
      this.playerRig.coatMat.emissiveIntensity = coatTier >= 5 ? 0.32 : coatTier >= 4 ? 0.14 : 0;
      this.playerRig.trimMat.color.setHex(trimColors[cIdx]);
    }

    const bootsTier = this.gear.boots;
    const bootColors = [0x3b2a20, 0x6b442a, 0x64748b, 0x38bdf8, 0xc084fc];
    if (bootsTier <= 0) {
      this.playerRig.bootMat.color.setHex(0x475569);
      this.playerRig.bootMat.emissive.setHex(0x000000);
      this.playerRig.bootMat.emissiveIntensity = 0;
    } else {
      const bIdx = Math.max(0, Math.min(4, bootsTier - 1));
      this.playerRig.bootMat.color.setHex(bootColors[bIdx]);
      this.playerRig.bootMat.emissive.setHex(
        bootsTier >= 5 ? 0x9333ea : bootsTier >= 4 ? 0x0369a1 : 0x000000,
      );
      this.playerRig.bootMat.emissiveIntensity = bootsTier >= 5 ? 0.42 : bootsTier >= 4 ? 0.25 : 0;
    }

    const glovesTier = this.gear.gloves;
    const gloveColors = [0x3b2a20, 0x7c4a2d, 0x475569, 0x38bdf8, 0xf0abfc];
    if (glovesTier <= 0) {
      this.playerRig.gloveMat.color.setHex(0xd6a584);
      this.playerRig.gloveMat.emissive.setHex(0x000000);
      this.playerRig.gloveMat.emissiveIntensity = 0;
    } else {
      const gIdx = Math.max(0, Math.min(4, glovesTier - 1));
      this.playerRig.gloveMat.color.setHex(gloveColors[gIdx]);
      this.playerRig.gloveMat.emissive.setHex(
        glovesTier >= 5 ? 0xc026d3 : glovesTier >= 4 ? 0x0284c7 : 0x000000,
      );
      this.playerRig.gloveMat.emissiveIntensity = glovesTier >= 5 ? 0.48 : glovesTier >= 4 ? 0.26 : 0;
    }

    const packTier = this.gear.pack;
    this.playerRig.backpackGroup.visible = packTier > 0;
    if (packTier > 0) {
      const packColors = [0x8c5b39, 0xa86f3f, 0x4b6378, 0x2563eb, 0x9333ea];
      const pIdx = Math.max(0, Math.min(4, packTier - 1));
      this.playerRig.packMat.color.setHex(packColors[pIdx]);
      this.playerRig.packMat.emissive.setHex(
        packTier >= 5 ? 0x7e22ce : packTier >= 4 ? 0x1d4ed8 : 0x000000,
      );
      this.playerRig.packMat.emissiveIntensity = packTier >= 5 ? 0.38 : packTier >= 4 ? 0.2 : 0;
      this.playerRig.backpackGroup.scale.setScalar(1 + (packTier - 1) * 0.08);
    }

    const setBonus = computeGearSetBonus(this.gear);
    this.playerRig.auroraClaspMesh.visible = coatTier >= 3 || setBonus !== null;
    if (this.playerRig.auroraClaspMesh.visible) {
      const setTier = setBonus?.minTier ?? coatTier;
      const claspColor =
        setTier >= 5 ? 0xf5d0fe : setTier >= 4 ? 0xfde047 : setTier >= 3 ? 0x7be0ff : 0x8ed49a;
      const claspEmissive =
        setTier >= 5 ? 0xd946ef : setTier >= 4 ? 0xd97706 : setTier >= 3 ? 0x0284c7 : 0x16a34a;
      this.playerRig.auroraClaspMat.color.setHex(claspColor);
      this.playerRig.auroraClaspMat.emissive.setHex(claspEmissive);
    }

    const gearAvgTier =
      (this.gear.coat + this.gear.boots + this.gear.gloves + this.gear.pack) / 4;
    updateCharacterEquipmentVisuals(this.playerRig, {
      axeLevel: this.levels.axe,
      bowLevel: this.levels.bow,
      gearAvgTier,
      activeBuffCount: this.countActiveCraftBuffs(),
      wingsTier: this.wingsTier,
      wingsEquipped: this.wingsEquipped,
      time: this.totalTime,
      moveSpeedRatio: 0,
    });
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearInputs);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handleResize = (): void => {
    const w = this.mountEl.clientWidth || window.innerWidth;
    const h = this.mountEl.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (e.repeat) return;
    this.audio.unlock();
    this.keysHeld.add(e.code);
    this.keysJustPressed.add(e.code);

    if (
      this.phase === 'title' &&
      (e.code === 'Enter' || e.code === 'Space')
    ) {
      e.preventDefault();
      this.startNewRun();
      return;
    }

    if (e.code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.phase === 'playing') {
        this.setPhase('paused');
      } else if (this.phase === 'paused') {
        this.setPhase('playing');
      }
      return;
    }

    if (this.phase !== 'playing') return;

    if (e.code === 'Digit1') {
      this.setTool('axe');
    } else if (e.code === 'Digit2') {
      this.setTool('bow');
    } else if (e.code === 'Digit3') {
      this.useBackpackItem('snare_trap');
    } else if (e.code === 'Digit4') {
      this.useBackpackItem('frost_trap');
    } else if (e.code === 'Digit5') {
      this.useQuickHealOrBuff();
    } else if (e.code === 'KeyU') {
      this.onOpenDrawer('camp');
    } else if (e.code === 'KeyG' || e.code === 'KeyC') {
      this.onOpenDrawer('craft');
    } else if (e.code === 'KeyI') {
      this.onOpenDrawer('inventory');
    } else if (e.code === 'KeyF') {
      this.onOpenDrawer('festival');
    } else if (e.code === 'KeyB') {
      this.onOpenDrawer('bestiary');
    } else if (e.code === 'KeyK') {
      this.onOpenDrawer('skills');
    } else if (e.code === 'KeyJ') {
      this.onOpenDrawer('pets');
    } else if (e.code === 'KeyL') {
      this.onOpenDrawer('achievements');
    } else if (e.code === 'KeyH') {
      this.feedNearestWildPet();
    } else if (e.code === 'KeyT' || e.code === 'KeyV') {
      this.onOpenDrawer('city');
    } else if (e.code === 'KeyQ') {
      this.activateHuntersSight();
    } else if (e.code === 'KeyE') {
      this.handleInteract();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private clearInputs = (): void => {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.pointerDown = false;
    this.pointerJustPressed = false;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearInputs();
    }
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || this.phase !== 'playing') return;
    this.audio.unlock();
    this.pointerDown = true;
    this.pointerJustPressed = true;
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
  };

  private handlePointerUp = (): void => {
    this.pointerDown = false;
  };

  private screenToWorldGround(clientX: number, clientY: number, out: THREE.Vector3): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, out) !== null;
  }

  public setPhase(next: GamePhase): void {
    if (next === 'gameover') {
      this.finalizeRunPersistence(true);
    } else if (next === 'title' && (this.phase === 'playing' || this.phase === 'paused')) {
      this.finalizeRunPersistence(false);
    }
    this.phase = next;
    document.body.dataset.state = next;
    this.clearInputs();
    if (next === 'playing') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    this.emitHudSnapshot();
  }

  public startNewRun(): void {
    if (this.phase === 'playing' || this.phase === 'paused') {
      this.finalizeRunPersistence(false);
    }
    this.runRecorded = false;
    this.victory = false;
    this.endlessMode = false;
    this.resources = this.initialCityReady
      ? { wood: 140, pelts: 38, stone: 48, ice: 16, gold: 420, meat: 28 }
      : this.initialCraftReady
        ? { wood: 110, pelts: 34, stone: 48, ice: 12, gold: 320, meat: 18 }
        : this.initialGearReady
          ? { wood: 180, pelts: 48, stone: 42, ice: 14, gold: 520, meat: 18 }
          : this.initialBaseTier !== null
            ? { wood: 320, pelts: 65, stone: 100, ice: 32, gold: 880, meat: 28 }
            : this.initialPetShowcase
              ? { ...INITIAL_RESOURCES, meat: Math.max(10, INITIAL_RESOURCES.meat ?? 0), gold: Math.max(80, INITIAL_RESOURCES.gold) }
              : { ...INITIAL_RESOURCES };
    this.levels = {
      ...INITIAL_LEVELS,
      ...(this.initialBaseTier !== null
        ? { cabin: Math.max(1, Math.min(5, Math.round(this.initialBaseTier))) }
        : {}),
    };
    const startGearTier =
      typeof this.initialGearReady === 'number' && this.initialGearReady >= 2
        ? Math.max(1, Math.min(5, Math.round(this.initialGearReady)))
        : 1;
    this.unlockedGear = {
      coat: startGearTier,
      boots: startGearTier,
      gloves: startGearTier,
      pack: startGearTier,
    };
    this.gear = { ...this.unlockedGear };
    this.lastLootRoll = null;
    const savedDailyCount = this.progress.cityDailyQuestsCompleted ?? 0;
    const overrideWings =
      this.initialWingsTier !== null
        ? Math.max(0, Math.min(3, Math.round(this.initialWingsTier)))
        : 0;
    this.wingsTier = computeWingsTierForCompletedQuests(savedDailyCount, overrideWings);
    this.wingsEquipped = this.wingsTier > 0;
    this.cityDailyQuest = createCityDailyQuest(1, this.wingsTier, savedDailyCount);
    if (this.initialCityReady) {
      this.cityDailyQuest = {
        ...this.cityDailyQuest,
        progressKills: this.cityDailyQuest.targetKills,
      };
    }
    this.backpackInventory = this.initialCraftReady
      ? createInitialBackpackInventory({
          clockwork_gear: 2,
          hammer_temper: 1,
          utility_toolkit: 1,
          snare_trap: 1,
          frost_trap: 1,
          fire_starter: 1,
        })
      : createInitialBackpackInventory();
    this.stats = { ...INITIAL_STATS };
    this.activeTool = 'axe';
    this.resourceTrendTracker.reset(this.resources, this.totalTime);

    const gearBonuses = computeGearBonuses(this.gear);
    const skillBonuses = computeSkillBonuses(this.skills);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    this.maxHp = gearBonuses.maxHp + skillBonuses.maxHpBonus + wingsSpec.maxHpBonus;
    this.hp = this.maxHp;
    this.maxWarmth = gearBonuses.maxWarmth;
    this.warmth = this.maxWarmth;
    this.packFullToastCooldown = 0;

    this.portalCooldown = 0;
    this.vortexCooldown = 0;
    const startZone: ZoneId = this.initialZoneOverride ?? 'level1';
    const startSpec = ZONE_SPECS[startZone];
    let startX = startSpec.arrivalX;
    let startZ = startSpec.arrivalZ;
    let startYaw = startSpec.arrivalYaw;
    if (this.initialBossShowcase) {
      const bSpec = getZoneBossSpec(startZone);
      startX = bSpec.arenaX - 7.8;
      startZ = bSpec.arenaZ + 2.2;
      startYaw = Math.atan2(7.8, -2.2);
    } else if (startZone === 'city') {
      startX = this.initialCityReady ? CITY_QUEST_NPC.x : startSpec.arrivalX;
      startZ = this.initialCityReady ? CITY_QUEST_NPC.z + 3.2 : startSpec.arrivalZ;
      startYaw = this.initialCityReady ? Math.PI : startSpec.arrivalYaw;
    } else if (this.initialPortalNear) {
      startX = startSpec.portalX;
      startZ = startZone === 'level1' ? startSpec.portalZ + 2.8 : startSpec.portalZ - 2.6;
      startYaw = startZone === 'level1' ? Math.PI : 0;
    } else if (typeof this.initialHunterNear === 'string' && startZone === 'level1') {
      startX = 9.2;
      startZ = 21.8;
      startYaw = Math.PI;
    }

    this.playerX = startX;
    this.playerZ = startZ;
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerYaw = startYaw;
    this.playerSpeed = 0;
    this.playerWalkPhase = 0;
    this.playerTurnBank = 0;
    this.idleTime = 0;
    this.lastFootstepStep = 0;
    this.attackCooldown = 0;
    this.swingTimer = 0;
    this.swingDuration = 0.28;
    this.hurtFlashTimer = 0;
    this.hitstopTimer = 0;
    this.trauma = 0;
    this.camLookX = this.playerX;
    this.camLookZ = this.playerZ;
    this.passiveWoodAcc = 0;
    this.passiveGoldAcc = 0;

    this.timeOfDay = this.initialTimeOverride ?? INITIAL_TIME_OF_DAY;
    this.cycleDayNumber = 1;
    const startWeather: WeatherKind = this.initialWeatherOverride ?? 'clear';
    const wp = getWeatherProfile(startWeather);
    this.weather = startWeather;
    this.weatherTimer = wp.duration;
    this.applyWeatherImmediate(startWeather);
    this.dailyObjective = createDailyObjective(1);
    this.seasonalEvent = createInitialSeasonalEvent(this.initialEventOverride);
    if (this.initialShelterOverride) {
      this.levels = { ...this.levels, stormShelter: 1 };
    }
    this.stormShelter = createInitialStormShelterState(this.levels.stormShelter ?? 0);
    this.activeBuffs = { ...INITIAL_BUFFS };
    this.huntersSight = createInitialHuntersSightState();
    this.trackedAnimalId = null;
    this.trackAmbushBonusTimer = 0;
    this.sightPulseAnimTimer = 0;
    this.sightPulseRingMesh.visible = false;

    // Clear active pickups, arrows & traps
    for (const p of this.pickups) p.mesh.parent?.remove(p.mesh);
    this.pickups.length = 0;
    for (const a of this.arrows) a.mesh.parent?.remove(a.mesh);
    this.arrows.length = 0;
    for (const eb of this.enemyBolts) eb.mesh.parent?.remove(eb.mesh);
    this.enemyBolts.length = 0;
    for (const bp of this.bossProjectiles) bp.mesh.parent?.remove(bp.mesh);
    this.bossProjectiles.length = 0;
    this.clearAllBossHazards();
    for (const t of this.deployedTraps) t.visual.group.parent?.remove(t.visual.group);
    this.deployedTraps.length = 0;

    // Reset trees
    for (const t of this.trees) {
      t.hp = t.maxHp;
      t.respawnTimer = 0;
      t.fallTimer = 0;
      t.mesh.visible = true;
      t.mesh.rotation.x = 0;
      t.mesh.rotation.z = 0;
      t.mesh.scale.set(1, 1, 1);
    }

    // Reset granite boulders
    for (const b of this.boulders) {
      b.hp = b.maxHp;
      b.respawnTimer = 0;
      b.shakeTimer = 0;
      b.mesh.visible = true;
      const baseScale = b.zone !== 'level1' ? 1.12 : 1;
      b.mesh.scale.set(baseScale, baseScale, baseScale);
    }

    // Sync temporary winter ice sculptures to initial event state
    this.syncWildIceSculptures(this.seasonalEvent.active);

    // Reset animals, wild pets & companions
    this.tamedPets = [];
    this.activePetUid = null;
    this.syncTamedPetVisuals();
    this.setActiveZone(startZone, { x: startX, z: startZ, yaw: startYaw }, false);
    this.populateWildlife();
    this.populateWildPets();
    this.populateRivalHunters();
    this.populateInitialChests();
    this.populateZoneBosses();

    this.rebuildCampStructures();
    this.syncPlayerWeaponVisuals();
    this.syncPlayerGearVisuals();
    this.checkAchievements(false);
    this.chatLogs = [];
    this.nextChatLogId = 1;
    this.pushChatLog(
      'notification',
      `Expedition begun in ${ZONE_SPECS[startZone].name} (${ZONE_SPECS[startZone].difficultyMult}x Survival).`,
      'cyan',
    );
    const startWeatherEffect = this.getActiveZoneWeatherEffect();
    if (!startWeatherEffect.mitigated) {
      this.pushChatLog(
        'notification',
        `Zone Weather: ${startWeatherEffect.name} (${Math.round((startWeatherEffect.effectiveMoveSpeedMult - 1) * 100)}% Move, ${Math.round((startWeatherEffect.effectiveGatherEfficiencyMult - 1) * 100)}% Harvest) · ${startWeatherEffect.infrastructureHint}`,
        'amber',
      );
    }
    this.showToast(
      startZone === 'city'
        ? 'Welcome to Frostcave City — trade Coins & Meat with cavern merchants!'
        : startZone === 'level2'
          ? 'Entered Level 2: Glacial Highlands (+45% Harvest Yield & Apex Fauna)!'
          : this.seasonalEvent.active
            ? `${this.seasonalEvent.name} active — harvest glowing Ice Sculptures!`
            : 'Follow the East Trade Road to Frostcave City or North Road to Level 2!',
    );
    this.setPhase('playing');
  }

  public continueEndless(): void {
    this.endlessMode = true;
    this.victory = false;
    this.showToast('Endless Frontier Mode active!');
    this.setPhase('playing');
  }

  public setTool(tool: ActiveTool): void {
    this.activeTool = tool;
    this.syncPlayerWeaponVisuals();
    this.emitHudSnapshot();
  }

  public toggleMute(): boolean {
    const muted = this.audio.toggleMute();
    this.emitHudSnapshot();
    return muted;
  }

  public sellAllTrade(): boolean {
    const bonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const { resources, goldGained } = sellTradeBundle(
      this.resources,
      this.levels,
      Math.floor(this.resources.wood),
      Math.floor(this.resources.pelts),
      bonuses.peltValueMult,
      gearBonuses.goldTradeMult * calMods.goldTradeMult * petBonuses.goldTradeMult,
    );
    if (goldGained <= 0) {
      this.showToast('No wood or pelts to trade yet.');
      return false;
    }
    this.resources = resources;
    this.recordGoldEarned(goldGained);
    this.audio.playPickup('gold');
    this.particles.spawnBurst(this.playerX, 1.4, this.playerZ, 0xf6c344, 14, 4, 0.9, 3.5);
    this.showToast(`Sold cargo for +${goldGained} Gold!`);
    this.emitHudSnapshot();
    return true;
  }

  public buyCityOffer(offerId: string): boolean {
    const maxItems = this.getBackpackMaxItems();
    const res = purchaseCityOffer({
      offerId,
      resources: this.resources,
      inventory: this.backpackInventory,
      maxItems,
    });
    if (!res) {
      this.showToast('Not enough Coins or Meat (or Backpack pouch is full)!');
      return false;
    }
    this.resources = res.resources;
    this.backpackInventory = res.inventory;
    if (res.hpDelta > 0) {
      this.hp = Math.min(this.maxHp, this.hp + res.hpDelta);
    }
    if (res.warmthDelta > 0) {
      this.warmth = Math.min(this.maxWarmth, this.warmth + res.warmthDelta);
    }
    this.audio.playUpgrade();
    this.particles.spawnBurst(this.playerX, 1.45, this.playerZ, 0xf6c344, 18, 5, 1.0, 4.0);
    this.showToast(`Purchased ${res.offer.name} from ${CITY_TRADERS[res.offer.traderId].name}!`);
    this.emitHudSnapshot();
    return true;
  }

  public sellMeat(count?: number): boolean {
    const bonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const availMeat = Math.floor(this.resources.meat ?? 0);
    const toSell = count !== undefined ? Math.min(availMeat, count) : availMeat;
    const res = sellMeatForGold(
      this.resources,
      toSell,
      bonuses.peltValueMult * gearBonuses.goldTradeMult * calMods.goldTradeMult * petBonuses.goldTradeMult,
    );
    if (res.meatSold <= 0 || res.goldGained <= 0) {
      this.showToast('No Wild Meat in stock — hunt Arctic wildlife first!');
      return false;
    }
    this.resources = res.resources;
    this.recordGoldEarned(res.goldGained);
    this.audio.playPickup('gold');
    this.particles.spawnBurst(this.playerX, 1.4, this.playerZ, 0xf6c344, 15, 4.2, 0.95, 3.6);
    this.showToast(`Sold ${res.meatSold} Meat for +${res.goldGained} Gold Coins!`);
    this.emitHudSnapshot();
    return true;
  }

  public claimCityDailyQuest(): boolean {
    const completedSoFar = this.progress.cityDailyQuestsCompleted ?? 0;
    const res = completeCityDailyQuest({
      quest: this.cityDailyQuest,
      resources: this.resources,
      currentWingsTier: this.wingsTier,
      completedQuestsCount: completedSoFar,
    });
    if (!res) {
      const check = canCompleteCityDailyQuest(this.cityDailyQuest, this.resources);
      this.showToast(
        check.reason ??
          `Hunt ${this.cityDailyQuest.targetKills - this.cityDailyQuest.progressKills} more quarry or gather tribute!`,
      );
      return false;
    }

    this.cityDailyQuest = res.quest;
    this.resources = res.resources;
    this.wingsTier = res.wingsTier;
    if (res.wingsUnlockedNow) {
      this.wingsEquipped = true;
    }
    this.progress = {
      ...this.progress,
      cityDailyQuestsCompleted: res.completedQuestsCount,
    };
    this.achievementCounters.dailyQuestsCompleted = Math.max(
      this.achievementCounters.dailyQuestsCompleted,
      res.completedQuestsCount,
    );
    if (this.wingsTier > 0) {
      this.achievementCounters.wingsUnlocked = Math.max(
        this.achievementCounters.wingsUnlocked,
        1,
      );
    }
    saveProgressToStorage(this.progress);
    this.recordGoldEarned(res.quest.rewardGold);

    this.recalculateVitalsFromEquipment(res.wingsUnlockedNow);
    if (res.wingsUnlockedNow) {
      this.hp = this.maxHp;
      this.warmth = this.maxWarmth;
    }

    this.syncPlayerWeaponVisuals();
    this.syncPlayerGearVisuals();
    this.audio.playLevelUp();
    this.particles.spawnBurst(this.playerX, 1.85, this.playerZ, 0xff5a1f, 34, 6.8, 1.35, 5.2);
    this.particles.spawnBurst(this.playerX, 2.2, this.playerZ, 0xfde047, 24, 5.8, 1.2, 4.4);
    const wingsSpec = getWingsOfFireSpec(this.wingsTier);
    if (res.wingsUnlockedNow) {
      this.showToast(
        `30-Trial Flame Pact Fulfilled! Awakened ${wingsSpec.name} (Tier ${this.wingsTier}/3) +${res.quest.rewardGold}g!`,
      );
    } else {
      this.showToast(
        `Daily Trial Complete (${res.completedQuestsCount}/${WINGS_DAILY_QUEST_REQUIREMENT} toward Wings of Fire)! +${res.quest.rewardGold}g, +${res.quest.rewardMeat} Meat`,
      );
    }
    this.checkAchievements(true);
    this.emitHudSnapshot();
    return true;
  }

  public startNextCityDailyQuest(): boolean {
    if (!this.cityDailyQuest.completed) return false;
    this.cycleDayNumber += 1;
    const completedSoFar = this.progress.cityDailyQuestsCompleted ?? 0;
    this.cityDailyQuest = createCityDailyQuest(
      this.cycleDayNumber,
      this.wingsTier,
      completedSoFar,
    );
    this.audio.playTrackInspect();
    this.showToast(
      `Accepted ${this.cityDailyQuest.title} (${completedSoFar}/${WINGS_DAILY_QUEST_REQUIREMENT} completed)!`,
    );
    this.emitHudSnapshot();
    return true;
  }

  public setTouchMove(dx: number, dz: number): void {
    this.touchMoveX = Math.max(-1, Math.min(1, dx));
    this.touchMoveZ = Math.max(-1, Math.min(1, dz));
  }

  public triggerTouchAttack(): void {
    if (this.phase !== 'playing') return;
    this.audio.unlock();
    if (this.attackCooldown <= 0) {
      if (this.activeTool === 'axe') {
        this.performAxeStrike();
      } else {
        this.performBowShot();
      }
    }
  }

  public triggerTouchInteract(): void {
    if (this.phase !== 'playing') return;
    this.audio.unlock();
    this.handleInteract();
  }

  public unlockSkillPerk(perkId: SkillPerkId): boolean {
    const prevBonuses = computeSkillBonuses(this.skills);
    const res = applySkillPerkUnlock(this.skills, perkId);
    if (!res.unlocked) {
      return false;
    }
    this.skills = res.skills;
    const nextBonuses = computeSkillBonuses(this.skills);
    const hpDiff = nextBonuses.maxHpBonus - prevBonuses.maxHpBonus;
    if (hpDiff > 0) {
      this.maxHp += hpDiff;
      this.hp = Math.min(this.maxHp, this.hp + hpDiff);
    }
    this.persistSkills();
    this.audio.playUpgrade();
    this.particles.spawnBurst(this.playerX, 1.5, this.playerZ, 0x8ed49a, 18, 5, 1.0, 4.2);
    const spec = SKILL_PERKS[perkId];
    this.showToast(`Unlocked ${spec.name} Rank ${res.newRank}/${spec.maxRank}!`);
    this.emitHudSnapshot();
    return true;
  }

  private recalculateVitalsFromEquipment(healBoost = false): void {
    const gearBonuses = computeGearBonuses(this.gear);
    const skillBonuses = computeSkillBonuses(this.skills);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    const targetMaxHp = gearBonuses.maxHp + skillBonuses.maxHpBonus + wingsSpec.maxHpBonus;
    const hpDelta = targetMaxHp - this.maxHp;
    this.maxHp = targetMaxHp;
    if (healBoost && hpDelta > 0) {
      this.hp = Math.min(this.maxHp, this.hp + Math.max(20, hpDelta));
    } else {
      this.hp = Math.min(this.maxHp, this.hp);
    }
    this.maxWarmth = gearBonuses.maxWarmth;
    this.warmth = Math.min(this.maxWarmth, this.warmth);
  }

  public respecSkills(): boolean {
    const prevBonuses = computeSkillBonuses(this.skills);
    const res = respecSkillPerks(this.skills);
    if (res.refunded <= 0) {
      return false;
    }
    this.skills = res.skills;
    this.recalculateVitalsFromEquipment(false);
    if (prevBonuses.maxHpBonus > 0 && this.hp > this.maxHp) {
      this.hp = this.maxHp;
    }
    this.persistSkills();
    this.audio.playPickup('gold');
    this.showToast(`Refunded ${res.refunded} Skill Point${res.refunded > 1 ? 's' : ''}!`);
    this.emitHudSnapshot();
    return true;
  }

  public equipGear(slot: GearSlotId, tier?: number): boolean {
    const nextEquipped = equipGearSlot(this.gear, this.unlockedGear, slot, tier);
    if (nextEquipped[slot] === this.gear[slot]) return false;
    this.gear = nextEquipped;
    if (slot === 'coat') {
      this.levels = { ...this.levels, coat: Math.min(4, Math.max(1, this.gear.coat)) };
    }
    this.recalculateVitalsFromEquipment(false);
    this.syncPlayerGearVisuals();
    this.audio.playUpgrade();
    const spec = getGearSlotSpec(slot, this.gear[slot]);
    this.showToast(`Equipped ${spec.name} (Tier ${this.gear[slot]})!`);
    this.emitHudSnapshot();
    return true;
  }

  public unequipGear(slot: GearSlotId): boolean {
    if ((this.gear[slot] ?? 0) <= 0) return false;
    const spec = getGearSlotSpec(slot, this.gear[slot]);
    this.gear = unequipGearSlot(this.gear, slot);
    this.recalculateVitalsFromEquipment(false);
    this.syncPlayerGearVisuals();
    this.audio.playTrackInspect();
    this.showToast(`Removed ${spec.name} into Backpack loadout!`);
    this.emitHudSnapshot();
    return true;
  }

  public toggleWingsEquipped(): boolean {
    if (this.wingsTier <= 0) return false;
    this.wingsEquipped = !this.wingsEquipped;
    this.recalculateVitalsFromEquipment(false);
    this.syncPlayerGearVisuals();
    this.audio.playUpgrade();
    const spec = getWingsOfFireSpec(this.wingsTier);
    this.showToast(
      this.wingsEquipped
        ? `Equipped ${spec.name} — Wings of Fire unfurled!`
        : `Unequipped ${spec.name} into Backpack loadout.`,
    );
    this.emitHudSnapshot();
    return true;
  }

  public buyGearUpgrade(slot: GearSlotId): boolean {
    const next = getNextGearUpgrade(slot, this.unlockedGear);
    if (!next) return false;
    const spent = spendResources(this.resources, next.cost);
    if (!spent) return false;

    const prevSet = computeGearSetBonus(this.gear);
    this.resources = spent;
    this.unlockedGear = { ...this.unlockedGear, [slot]: next.tier };
    this.gear = equipGearSlot(this.gear, this.unlockedGear, slot, next.tier);

    if (slot === 'coat') {
      this.levels = { ...this.levels, coat: Math.min(4, next.tier) };
      this.recalculateVitalsFromEquipment(true);
      this.warmth = this.maxWarmth;
    }

    this.syncPlayerGearVisuals();
    this.audio.playUpgrade();
    const burstColor =
      next.rarity === 'mythic'
        ? 0xf0abfc
        : next.rarity === 'epic'
          ? 0xf6c344
          : next.rarity === 'rare'
            ? 0x7be0ff
            : 0x8ed49a;
    this.particles.spawnBurst(this.playerX, 1.5, this.playerZ, burstColor, 20, 5.2, 1.05, 4.4);

    const nextSet = computeGearSetBonus(this.gear);
    this.checkAchievements(false);
    if (nextSet && (!prevSet || nextSet.minTier > prevSet.minTier)) {
      this.showToast(`Equipped ${next.name} (Tier ${next.tier}) · Set Unlocked: ${nextSet.name}!`);
    } else {
      this.showToast(`Equipped ${next.name} (Tier ${next.tier})!`);
    }
    this.emitHudSnapshot();
    return true;
  }

  public buyToolUpgrade(id: ToolUpgradeId): boolean {
    if (id === 'coat') {
      return this.buyGearUpgrade('coat');
    }
    const next = getNextToolUpgrade(id, this.levels);
    if (!next) return false;
    const spent = spendResources(this.resources, next.cost);
    if (!spent) return false;
    this.resources = spent;
    this.levels = { ...this.levels, [id]: next.level };

    this.syncPlayerWeaponVisuals();
    this.audio.playUpgrade();
    this.particles.spawnBurst(this.playerX, 1.5, this.playerZ, 0x7be0ff, 18, 5, 1.0, 4.2);
    this.showToast(`Upgraded to ${next.name}!`);
    this.emitHudSnapshot();
    return true;
  }

  public buyBuildingUpgrade(id: BuildingId): boolean {
    const next = getNextBuildingUpgrade(id, this.levels);
    if (!next) return false;
    const spent = spendResources(this.resources, next.cost);
    if (!spent) return false;
    this.resources = spent;
    this.levels = { ...this.levels, [id]: next.level };
    if (id === 'stormShelter') {
      this.stormShelter = upgradeStormShelterState(this.stormShelter, next.level);
    }

    this.rebuildCampStructures();
    this.checkAchievements(true);
    this.audio.playUpgrade();
    const bPos = BUILDING_POSITIONS[id];
    this.particles.spawnBurst(bPos.x, 2.2, bPos.z, 0xffc74d, 24, 6.5, 1.3, 5);
    const updatedWeatherEffect = this.getActiveZoneWeatherEffect();
    if (id === 'windbreak' || id === 'thermalConduit' || id === 'forge' || id === 'stormShelter') {
      this.pushChatLog(
        'notification',
        `Built ${next.name}! Infrastructure Shield: ${updatedWeatherEffect.windResistancePct}% Wind Resist · ${updatedWeatherEffect.heatRetentionPct}% Heat Retain.`,
        'green',
      );
    } else {
      this.pushChatLog('notification', `Built ${next.name} (Lv ${next.level}) in Camp Base.`, 'amber');
    }
    this.showToast(`Built ${next.name}!`);

    if (isEmpireVictory(this.levels, this.endlessMode)) {
      this.victory = true;
      this.audio.playVictory();
      this.setPhase('gameover');
      return true;
    }

    this.emitHudSnapshot();
    return true;
  }

  public buyFestivalBuilding(id: FestivalBuildingId): boolean {
    const result = purchaseFestivalBuilding(
      id,
      this.levels,
      this.resources,
      this.seasonalEvent,
    );
    if (!result) {
      if (!this.seasonalEvent.active) {
        this.showToast('Festival buildings can only be constructed during an active Seasonal Event.');
      }
      return false;
    }

    this.resources = result.resources;
    this.levels = result.levels;
    this.rebuildCampStructures();
    this.audio.playFestivalStart();
    const bPos = BUILDING_POSITIONS[id];
    this.particles.spawnBurst(bPos.x, 2.2, bPos.z, 0x9fe8ff, 26, 6.5, 1.35, 5);
    this.showToast(`Celebrated ${result.spec.name}!`);
    this.emitHudSnapshot();
    return true;
  }

  public exchangeFestivalIce(): boolean {
    const res = performFestivalIceExchange(this.resources, this.seasonalEvent);
    if (!res) {
      this.showToast(
        this.seasonalEvent.active
          ? 'Need 3 Ice Shards for a Festival Gift Exchange.'
          : 'Festival Gift Exchange opens during seasonal events.',
      );
      return false;
    }
    this.resources = res.resources;
    this.recordGoldEarned(res.goldGained);
    this.audio.playPickup('gold');
    this.particles.spawnBurst(this.playerX, 1.5, this.playerZ, 0x9fe8ff, 16, 4.5, 1.0, 3.6);
    this.showToast(`Traded 3 Ice Shards for +${res.goldGained} Gold!`);
    this.emitHudSnapshot();
    return true;
  }

  private getBackpackMaxItems(): number {
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const cargoCap = computeBackpackCapacity(
      this.skills,
      this.levels.cabin,
      gearBonuses.packCapacityBonus + petBonuses.packCapacityBonus,
    );
    return computeBackpackItemCapacity(cargoCap + (skillBonuses.packBonus > 0 ? 4 : 0));
  }

  public craftItem(id: CraftItemId): boolean {
    const maxItems = this.getBackpackMaxItems();
    const crafted = craftItemToBackpack({
      resources: this.resources,
      inventory: this.backpackInventory,
      maxItems,
      id,
    });
    if (!crafted) {
      const used = countBackpackItems(this.backpackInventory);
      if (used >= maxItems) {
        this.showToast(`Backpack Pouch full (${used}/${maxItems})! Use items or upgrade Pack Gear.`);
      }
      return false;
    }

    this.resources = crafted.resources;
    this.backpackInventory = crafted.inventory;
    this.achievementCounters.itemsCrafted += 1;
    this.checkAchievements(false);
    this.anvilAnimTimer = 0.42;
    this.audio.playAnvilCraft();

    const burstColor =
      id === 'clockwork_gear' || id === 'hammer_temper'
        ? 0xf6c344
        : id === 'frost_trap' || id === 'insulated_boots' || id === 'frost_whetstone'
          ? 0x7be0ff
          : id === 'snare_trap' || id === 'utility_toolkit'
            ? 0x8ed49a
            : id === 'aurora_charm'
              ? 0xf0abfc
              : 0xff9d3b;
    this.particles.spawnBurst(this.playerX, 1.45, this.playerZ, burstColor, 18, 5, 1.0, 4.0);
    this.showToast(
      `Forged ${crafted.recipe.name}${crafted.craftedQty > 1 ? ` x${crafted.craftedQty}` : ''} -> Stored in Backpack [I]`,
    );
    this.emitHudSnapshot();
    return true;
  }

  public useBackpackItem(id: CraftItemId): boolean {
    if (this.phase !== 'playing') return false;
    const used = applyBackpackItemUse({
      inventory: this.backpackInventory,
      buffs: this.activeBuffs,
      hp: this.hp,
      maxHp: this.maxHp,
      warmth: this.warmth,
      maxWarmth: this.maxWarmth,
      id,
    });
    if (!used) {
      if ((this.backpackInventory[id] ?? 0) <= 0) {
        this.showToast(`None left in Backpack — craft more at the Crafting Station [C]!`);
      }
      return false;
    }

    this.backpackInventory = used.inventory;
    this.activeBuffs = used.buffs;
    this.hp = used.hp;
    this.warmth = used.warmth;

    if (used.deployTrapKind) {
      this.deployTrap(used.deployTrapKind);
      this.emitHudSnapshot();
      return true;
    }

    this.audio.playUpgrade();
    const burstColor =
      id === 'fire_starter'
        ? 0xff9d3b
        : id === 'hammer_temper' || id === 'flint_quiver' || id === 'mammoth_tonic'
          ? 0xf6c344
          : id === 'utility_toolkit' || id === 'alpine_poultice'
            ? 0x8ed49a
            : id === 'aurora_charm'
              ? 0xf0abfc
              : 0x7be0ff;
    this.particles.spawnBurst(this.playerX, 1.5, this.playerZ, burstColor, 20, 5.2, 1.05, 4.0);
    this.showToast(`Activated ${used.recipe.name} from Backpack!`);
    this.emitHudSnapshot();
    return true;
  }

  public craftAndUseItem(id: CraftItemId): boolean {
    if ((this.backpackInventory[id] ?? 0) <= 0) {
      if (!this.craftItem(id)) return false;
    }
    return this.useBackpackItem(id);
  }

  private useQuickHealOrBuff(): boolean {
    const order: CraftItemId[] = [
      'alpine_poultice',
      'fire_starter',
      'hammer_temper',
      'utility_toolkit',
      'mammoth_tonic',
      'aurora_charm',
      'frost_whetstone',
      'flint_quiver',
      'insulated_boots',
    ];
    for (const id of order) {
      if ((this.backpackInventory[id] ?? 0) > 0) {
        return this.useBackpackItem(id);
      }
    }
    this.showToast('Backpack has no quick buffs stocked — open Crafting Station [C]!');
    return false;
  }

  private deployTrap(kind: TrapKind): void {
    const fx = Math.sin(this.playerYaw);
    const fz = Math.cos(this.playerYaw);
    const rawX = this.playerX + fx * 1.7;
    const rawZ = this.playerZ + fz * 1.7;
    const clamped = clampToZoneBounds(rawX, rawZ, this.activeZone, 2.2);
    const ty = groundHeightAt(clamped.x, clamped.z);

    const visual = createDeployedTrapMesh(kind, this.palette);
    visual.group.position.set(clamped.x, ty, clamped.z);
    visual.group.rotation.y = this.playerYaw;
    this.getZoneGroup(this.activeZone).add(visual.group);

    this.deployedTraps.push({
      id: this.nextTrapId++,
      zone: this.activeZone,
      kind,
      x: clamped.x,
      z: clamped.z,
      armed: true,
      despawnTimer: 0,
      visual,
    });

    const spec = TRAP_SPECS[kind];
    this.audio.playTrapDeploy();
    this.particles.spawnBurst(clamped.x, ty + 0.35, clamped.z, spec.colorHex, 14, 4.2, 0.9, 3.2);
    this.showToast(`Deployed ${spec.name}!`);
  }

  private updateDeployedTraps(dt: number): void {
    for (let i = this.deployedTraps.length - 1; i >= 0; i--) {
      const trap = this.deployedTraps[i];
      if (trap.zone !== this.activeZone) continue;

      if (!trap.armed) {
        trap.despawnTimer -= dt;
        trap.visual.leftJaw.rotation.x = THREE.MathUtils.damp(
          trap.visual.leftJaw.rotation.x,
          0,
          20,
          dt,
        );
        trap.visual.rightJaw.rotation.x = THREE.MathUtils.damp(
          trap.visual.rightJaw.rotation.x,
          0,
          20,
          dt,
        );
        const rMat = trap.visual.ring.material as THREE.MeshBasicMaterial;
        rMat.opacity = Math.max(0, (trap.despawnTimer / 1.4) * 0.4);
        if (trap.despawnTimer <= 0) {
          trap.visual.group.parent?.remove(trap.visual.group);
          rMat.dispose();
          this.deployedTraps.splice(i, 1);
        }
        continue;
      }

      const pulse = 1 + Math.sin(this.totalTime * 4 + trap.id) * 0.05;
      trap.visual.ring.scale.setScalar(pulse);

      const spec = TRAP_SPECS[trap.kind];
      for (const animal of this.animals) {
        if (animal.zone !== trap.zone || animal.state === 'ko') continue;
        const dist = Math.hypot(animal.x - trap.x, animal.z - trap.z);
        if (dist <= spec.triggerRadius) {
          trap.armed = false;
          trap.despawnTimer = 1.4;
          const skillBonuses = computeSkillBonuses(this.skills);
          const dmg = Math.round(spec.damage * skillBonuses.huntDamageMult);
          this.audio.playTrapSnap(trap.kind === 'frost', trap.x, trap.z);
          this.particles.spawnBurst(
            trap.x,
            groundHeightAt(trap.x, trap.z) + 0.55,
            trap.z,
            spec.colorHex,
            24,
            6.0,
            1.15,
            4.4,
          );
          this.damageAnimal(animal, dmg, animal.x - trap.x, animal.z - trap.z, true);
          if (animal.hp > 0) {
            animal.state = 'alert';
            animal.stateTimer = spec.stunSeconds;
            animal.vx = 0;
            animal.vz = 0;
          }
          const zSpec = ZONE_SPECS[trap.zone];
          this.awardSkillXp('hunting', Math.round(spec.xpReward * zSpec.xpMult));
          this.showToast(
            `${spec.name} snapped ${SPECIES_SPECS[animal.kind].label} for ${dmg} dmg!`,
          );
          this.emitHudSnapshot();
          break;
        }
      }

      if (trap.armed) {
        for (const boss of this.zoneBosses) {
          if (boss.zone !== trap.zone || boss.state === 'ko') continue;
          const dist = Math.hypot(boss.x - trap.x, boss.z - trap.z);
          if (dist <= spec.triggerRadius + 1.2) {
            trap.armed = false;
            trap.despawnTimer = 1.4;
            const skillBonuses = computeSkillBonuses(this.skills);
            const dmg = Math.round(spec.damage * skillBonuses.huntDamageMult);
            this.audio.playTrapSnap(true, trap.x, trap.z);
            this.particles.spawnBurst(
              trap.x,
              groundHeightAt(trap.x, trap.z) + 0.65,
              trap.z,
              spec.colorHex,
              26,
              6.2,
              1.2,
              4.4,
            );
            this.damageZoneBoss(boss, dmg, boss.x - trap.x, boss.z - trap.z, true);
            if (boss.hp > 0) {
              boss.state = 'recover';
              boss.stateTimer = Math.max(boss.stateTimer, 1.2);
              boss.model.telegraphGroup.visible = false;
              boss.activePattern = null;
              boss.vx = 0;
              boss.vz = 0;
            }
            this.showToast(`${spec.name} staggered ${boss.spec.name} for ${dmg} dmg!`);
            this.emitHudSnapshot();
            break;
          }
        }
      }
    }
  }

  private setActiveZone(
    nextZone: ZoneId,
    spawnAt?: { x: number; z: number; yaw: number },
    playWarp = false,
  ): void {
    this.activeZone = nextZone;
    this.level1Group.visible = nextZone === 'level1';
    this.level2Group.visible = nextZone === 'level2';
    this.level3Group.visible = nextZone === 'level3';
    this.level4Group.visible = nextZone === 'level4';
    this.level5Group.visible = nextZone === 'level5';
    this.cityGroup.visible = nextZone === 'city';

    for (const a of this.arrows) {
      a.mesh.parent?.remove(a.mesh);
    }
    this.arrows.length = 0;
    for (const eb of this.enemyBolts) {
      eb.mesh.parent?.remove(eb.mesh);
    }
    this.enemyBolts.length = 0;

    if (spawnAt) {
      this.playerX = spawnAt.x;
      this.playerZ = spawnAt.z;
      this.playerYaw = spawnAt.yaw;
      this.playerVx = 0;
      this.playerVz = 0;
      this.playerSpeed = 0;
      const groundY = groundHeightAt(this.playerX, this.playerZ);
      this.playerRig.group.position.set(this.playerX, groundY, this.playerZ);
      this.playerRig.group.rotation.y = this.playerYaw;
      this.camLookX = this.playerX;
      this.camLookZ = this.playerZ;
      this.camera.position.set(this.playerX, groundY + 14.5, this.playerZ + 14.2);
      this.camera.lookAt(this.playerX, groundY + 1.35, this.playerZ);
    }

    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
    this.sunLight.position.set(
      this.playerX + this.sunOffsetX,
      this.sunOffsetY,
      this.playerZ + this.sunOffsetZ,
    );
    this.updateDayNightCycle(0.016);
    if (nextZone === 'city') {
      this.updateCityActors(0.016);
    }

    if (playWarp) {
      this.portalCooldown = 0.25;
      this.vortexCooldown = PORTAL_COOLDOWN_SECONDS;
      this.audio.playPortalWarp(nextZone !== 'level1');
      const burstY = groundHeightAt(this.playerX, this.playerZ) + 1.4;
      const zSpec = ZONE_SPECS[nextZone];
      this.particles.spawnBurst(
        this.playerX,
        burstY,
        this.playerZ,
        nextZone !== 'level1' && nextZone !== 'city' ? 0x5be7ff : 0xf6c344,
        28,
        6.2,
        1.25,
        4.6,
      );
      this.trauma = Math.min(0.45, this.trauma + 0.18);
      this.showToast(
        nextZone === 'city'
          ? 'Entered Frostcave City — Subterranean Merchant Bazaar & Hearth Sanctuary!'
          : nextZone === 'level1'
            ? 'Returned to Level 1: Frostwood Valley (1x Baseline Survival)!'
            : `Entered ${zSpec.name} (${zSpec.subtitle} · ${zSpec.difficultyMult}x Survival Difficulty)!`,
      );
      const zEffect = this.getActiveZoneWeatherEffect();
      if (nextZone === 'city') {
        this.pushChatLog(
          'notification',
          `Entered ${zSpec.name}: ${zEffect.name} (+5% Move & +5% Harvest).`,
          'green',
        );
      } else if (zEffect.mitigated) {
        this.pushChatLog(
          'notification',
          `Entered ${zSpec.name}: ${zEffect.name} mitigated by Base Infrastructure (${zEffect.windResistancePct}% Wind / ${zEffect.heatRetentionPct}% Heat)!`,
          'green',
        );
      } else {
        this.pushChatLog(
          'notification',
          `Zone Hazard: ${zEffect.name} (${Math.round((zEffect.effectiveMoveSpeedMult - 1) * 100)}% Move, ${Math.round((zEffect.effectiveGatherEfficiencyMult - 1) * 100)}% Harvest) · ${zEffect.infrastructureHint}`,
          'amber',
        );
      }
      this.emitHudSnapshot();
    }
  }

  public travelToZone(targetZone: ZoneId): boolean {
    if (this.phase !== 'playing') return false;
    const spec = ZONE_SPECS[targetZone];
    if (!spec) return false;
    this.trackedAnimalId = null;
    this.trackAmbushBonusTimer = 0;
    this.sightPulseAnimTimer = 0;
    this.sightPulseRingMesh.visible = false;
    let spawnX = spec.arrivalX;
    let spawnZ = spec.arrivalZ;
    let spawnYaw = spec.arrivalYaw;
    if (this.initialBossShowcase) {
      const bSpec = getZoneBossSpec(targetZone);
      spawnX = bSpec.arenaX - 7.8;
      spawnZ = bSpec.arenaZ + 2.2;
      spawnYaw = Math.atan2(7.8, -2.2);
    }
    this.setActiveZone(targetZone, { x: spawnX, z: spawnZ, yaw: spawnYaw }, true);
    return true;
  }

  public activatePortal(): boolean {
    if (this.phase !== 'playing' || this.portalCooldown > 0) return false;
    const prox = computeNearestZonePortal(this.playerX, this.playerZ, this.activeZone);
    if (!prox.nearInteract) return false;
    const dest = getDestinationAfterPortal(this.activeZone, prox.route);
    this.trackedAnimalId = null;
    this.trackAmbushBonusTimer = 0;
    this.sightPulseAnimTimer = 0;
    this.sightPulseRingMesh.visible = false;
    this.setActiveZone(
      dest.zone,
      { x: dest.x, z: dest.z, yaw: dest.yaw },
      true,
    );
    return true;
  }

  public activateHuntersSight(): boolean {
    if (this.phase !== 'playing') return false;
    const res = activateSightState(this.huntersSight);
    if (!res.activated) {
      if (this.huntersSight.cooldownLeft > 0 && !this.huntersSight.active) {
        this.showToast(
          `Hunter's Sight recharging (${Math.ceil(this.huntersSight.cooldownLeft)}s)`,
        );
      }
      return false;
    }

    this.huntersSight = res.state;
    this.sightPulseAnimTimer = 1.15;
    this.audio.playHuntersSightPulse();
    this.particles.spawnBurst(
      this.playerX,
      groundHeightAt(this.playerX, this.playerZ) + 1.1,
      this.playerZ,
      0x5be7ff,
      24,
      6.4,
      1.1,
      4.5,
    );

    // Flush fresh wildlife into surrounding forest if local sector is quiet
    const zone = this.activeZone;
    const counts: Partial<Record<AnimalKind, number>> = {};
    let nearbyCount = 0;
    for (const a of this.animals) {
      if (a.zone !== zone || a.state === 'ko') continue;
      counts[a.kind] = (counts[a.kind] ?? 0) + 1;
      if (Math.hypot(a.x - this.playerX, a.z - this.playerZ) <= 36) {
        nearbyCount++;
      }
    }
    if (nearbyCount < 3) {
      const flushKind = pickForestFlushSpecies(counts, zone);
      const zSpec = ZONE_SPECS[zone];
      const zoneObstacles = this.trees.filter((t) => t.zone === zone);
      const pos = pickWildlifeSpawnPoint({
        minR: zone === 'level2' ? 16 : 16,
        maxR: Math.min(zSpec.radius - 4.5, 42),
        centerX: zSpec.centerX,
        centerZ: zSpec.centerZ,
        playerX: this.playerX,
        playerZ: this.playerZ,
        minPlayerDist: 16.5,
        obstacles: zoneObstacles,
        minObstacleDist: 2.2,
      });
      const flushed = this.spawnAnimal(flushKind, 16.5, zone, pos);
      this.spawnTrackDecal(
        zone,
        flushed.kind,
        flushed.id,
        flushed.x,
        flushed.z,
        flushed.yaw,
      );
    }

    const quarry = selectBestTrackedQuarry(
      this.animals,
      this.playerX,
      this.playerZ,
      zone,
      this.trackedAnimalId,
      true,
      this.trackAmbushBonusTimer,
    );
    if (quarry) {
      this.trackedAnimalId = quarry.id;
      this.showToast(
        `Hunter's Sight active — ${quarry.label} spotted ${quarry.distance}m ${quarry.direction}!`,
      );
    } else {
      this.showToast("Hunter's Sight active — scanning Arctic forest!");
    }

    this.emitHudSnapshot();
    return true;
  }

  public inspectNearestTrack(): boolean {
    if (this.phase !== 'playing') return false;
    const found = findNearestInspectableTrack(
      this.tracks,
      this.playerX,
      this.playerZ,
      this.activeZone,
      TRACK_INSPECT_RADIUS,
    );
    if (!found) return false;

    const { track, clue } = found;
    let target =
      this.animals.find(
        (a) =>
          a.id === track.animalId &&
          a.zone === this.activeZone &&
          a.state !== 'ko',
      ) ??
      this.animals.find(
        (a) =>
          a.kind === track.kind &&
          a.zone === this.activeZone &&
          a.state !== 'ko',
      );

    if (!target) {
      const zSpec = ZONE_SPECS[this.activeZone];
      const zoneObstacles = this.trees.filter((t) => t.zone === this.activeZone);
      const spawnPos = pickWildlifeSpawnPoint({
        minR: 16,
        maxR: Math.min(zSpec.radius - 4.5, 42),
        centerX: zSpec.centerX,
        centerZ: zSpec.centerZ,
        playerX: this.playerX,
        playerZ: this.playerZ,
        minPlayerDist: 16,
        obstacles: zoneObstacles,
        minObstacleDist: 2.2,
      });
      target = this.spawnAnimal(track.kind, 16, this.activeZone, spawnPos);
    }

    this.trackedAnimalId = target.id;
    this.trackAmbushBonusTimer = TRACK_AMBUSH_DURATION;

    const idx = this.tracks.indexOf(track);
    if (idx !== -1) {
      this.tracks.splice(idx, 1);
      track.visual.group.parent?.remove(track.visual.group);
      track.visual.printMat.dispose();
      track.visual.glowMat.dispose();
    }

    const zSpec = ZONE_SPECS[this.activeZone];
    this.awardSkillXp('hunting', Math.round(8 * zSpec.xpMult));
    this.audio.playTrackInspect();
    this.particles.spawnBurst(
      track.x,
      groundHeightAt(track.x, track.z) + 0.35,
      track.z,
      getRarityColorHex(clue.rarity),
      16,
      4.5,
      0.85,
      3.4,
    );

    const dx = target.x - this.playerX;
    const dz = target.z - this.playerZ;
    const dist = Math.round(Math.hypot(dx, dz));
    const dir = cardinalBearingFromDelta(dx, dz);
    this.showToast(
      `Tracked ${clue.label} — ${dist}m ${dir} (+25% Hunt Focus)!`,
    );
    this.emitHudSnapshot();
    return true;
  }

  private handleInteract(): void {
    const portalProx = computeNearestZonePortal(this.playerX, this.playerZ, this.activeZone);
    if (portalProx.nearInteract && this.portalCooldown <= 0) {
      this.activatePortal();
      return;
    }

    if (this.activeZone === 'city') {
      if (isNearCityQuestNpc(this.playerX, this.playerZ)) {
        const check = canCompleteCityDailyQuest(this.cityDailyQuest, this.resources);
        if (check.ok) {
          this.claimCityDailyQuest();
        } else {
          this.audio.playTrackInspect();
          this.showToast(
            `${CITY_QUEST_NPC.name}: "${this.cityDailyQuest.title} (${this.cityDailyQuest.progressKills}/${this.cityDailyQuest.targetKills} Kills) — Reward: ${this.cityDailyQuest.rewardWingsName}!"`,
          );
        }
        this.onOpenDrawer('city');
        return;
      }
      const nearTrader = findNearestCityTrader(this.playerX, this.playerZ);
      if (nearTrader) {
        this.onOpenDrawer('city');
        return;
      }
      for (const npc of this.cityNpcs) {
        if (Math.hypot(this.playerX - npc.x, this.playerZ - npc.z) <= CITY_NPC_INTERACT_RADIUS) {
          this.audio.playTrackInspect();
          this.showToast(`${npc.spec.name} (${npc.spec.role}): "${npc.spec.dialogue}"`);
          this.emitHudSnapshot();
          return;
        }
      }
      this.onOpenDrawer('city');
      return;
    }

    if (this.openNearestSecretChest()) {
      return;
    }

    if (this.inspectNearestTrack()) {
      return;
    }

    if (this.feedNearestWildPet()) {
      return;
    }

    if (this.activeZone !== 'level1') return;

    const distPen = Math.hypot(
      this.playerX - BUILDING_POSITIONS.tamingPen.x,
      this.playerZ - BUILDING_POSITIONS.tamingPen.z,
    );
    if (distPen <= PEN_INTERACT_RADIUS) {
      this.onOpenDrawer('pets');
      return;
    }

    const distStation = Math.hypot(
      this.playerX - BUILDING_POSITIONS.craftingStation.x,
      this.playerZ - BUILDING_POSITIONS.craftingStation.z,
    );
    if (distStation <= 4.5) {
      this.onOpenDrawer('craft');
      return;
    }

    const distCamp = Math.hypot(this.playerX, this.playerZ);
    const distTannery = Math.hypot(
      this.playerX - BUILDING_POSITIONS.tannery.x,
      this.playerZ - BUILDING_POSITIONS.tannery.z,
    );
    if (distTannery < 4.5 && (this.resources.wood >= 1 || this.resources.pelts >= 1)) {
      this.sellAllTrade();
      return;
    }
    if (distCamp < 10) {
      this.onOpenDrawer('camp');
    }
  }

  private formatRunClock(): string {
    const totalSec = Math.max(0, Math.floor(this.totalTime || 0));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private pushChatLog(
    category: ChatLogCategory,
    text: string,
    accent?: ChatLogEntry['accent'],
    rarity?: ItemRarity,
  ): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    const last = this.chatLogs[this.chatLogs.length - 1];
    if (last && last.text === trimmed && last.category === category) {
      return;
    }
    this.chatLogs.push({
      id: this.nextChatLogId++,
      timestamp: this.formatRunClock(),
      category,
      text: trimmed,
      accent,
      rarity,
    });
    if (this.chatLogs.length > 48) {
      this.chatLogs.splice(0, this.chatLogs.length - 48);
    }
  }

  private showToast(msg: string): void {
    this.toastText = msg;
    this.toastTimer = 3.2;

    const lower = msg.toLowerCase();
    if (
      msg.startsWith('Opened ') ||
      msg.startsWith('BOSS VANQUISHED:') ||
      msg.startsWith('Purchased ') ||
      msg.startsWith('Sold ') ||
      msg.startsWith('Traded ') ||
      lower.includes('spoils') ||
      lower.includes('glints somewhere')
    ) {
      const rarity: ItemRarity | undefined = lower.includes('mythic')
        ? 'mythic'
        : lower.includes('epic')
          ? 'epic'
          : lower.includes('rare')
            ? 'rare'
            : lower.includes('uncommon')
              ? 'uncommon'
              : undefined;
      this.pushChatLog(
        'loot',
        msg,
        rarity === 'mythic' || rarity === 'epic' ? 'purple' : 'gold',
        rarity,
      );
    } else if (
      msg.startsWith('BOSS ENCOUNTER:') ||
      msg.startsWith('PHASE II ENRAGE:') ||
      lower.includes('struck') ||
      lower.includes('landed') ||
      lower.includes('projectile hit') ||
      lower.includes('eruption') ||
      lower.includes('ambushed') ||
      lower.includes('felled') ||
      lower.includes('staggered') ||
      lower.includes('stalks')
    ) {
      this.pushChatLog('combat', msg, 'red');
    } else {
      this.pushChatLog('notification', msg, 'cyan');
    }
  }

  private recordGoldEarned(amount: number): void {
    this.stats.goldEarned += amount;
    this.achievementCounters.goldEarned += Math.max(0, Math.round(amount));
    const totalGold = Math.round(this.stats.goldEarned);
    if (totalGold > this.bestGold) {
      this.bestGold = totalGold;
      try {
        localStorage.setItem(LEGACY_BEST_GOLD_STORAGE_KEY, String(this.bestGold));
      } catch {
        // ignore
      }
    }
  }

  private syncAchievementSnapshotCounters(): void {
    const gearSet = computeGearSetBonus(this.gear);
    const builtCount =
      (this.levels.lumberCamp > 0 ? 1 : 0) +
      (this.levels.sawmill > 0 ? 1 : 0) +
      (this.levels.tannery > 0 ? 1 : 0) +
      (this.levels.forge > 0 ? 1 : 0) +
      ((this.levels.tamingPen ?? 0) > 0 ? 1 : 0) +
      ((this.levels.stormShelter ?? 0) > 0 ? 1 : 0);
    this.achievementCounters.maxDaysSurvived = Math.max(
      this.achievementCounters.maxDaysSurvived,
      this.cycleDayNumber,
    );
    this.achievementCounters.maxCabinTier = Math.max(
      this.achievementCounters.maxCabinTier,
      this.levels.cabin,
    );
    this.achievementCounters.maxBuildingsBuilt = Math.max(
      this.achievementCounters.maxBuildingsBuilt,
      builtCount,
    );
    this.achievementCounters.maxGearSetTier = Math.max(
      this.achievementCounters.maxGearSetTier,
      gearSet?.minTier ?? 1,
    );
    this.achievementCounters.maxSpeciesDiscovered = Math.max(
      this.achievementCounters.maxSpeciesDiscovered,
      countDiscoveredSpecies(this.bestiary),
    );
    this.achievementCounters.dailyQuestsCompleted = Math.max(
      this.achievementCounters.dailyQuestsCompleted,
      this.progress.cityDailyQuestsCompleted ?? 0,
    );
    if (this.wingsTier > 0) {
      this.achievementCounters.wingsUnlocked = Math.max(
        this.achievementCounters.wingsUnlocked,
        1,
      );
    }
  }

  private checkAchievements(forceSave = false): void {
    this.syncAchievementSnapshotCounters();
    const res = evaluateAchievements(
      this.achievementCounters,
      this.achievementsUnlocked,
    );
    if (res.newlyUnlocked.length > 0) {
      this.achievementsUnlocked = res.unlockedIds;
      const first = res.newlyUnlocked[0];
      this.audio.playLevelUp();
      this.particles.spawnBurst(this.playerX, 1.8, this.playerZ, 0xf6c344, 22, 5.5, 1.15, 4.2);
      this.showToast(
        res.newlyUnlocked.length > 1
          ? `Achievements Unlocked: ${first.title} (+${res.newlyUnlocked.length - 1} more) · [L] Badges!`
          : `Achievement Unlocked: ${first.title} · Open [L] Badges!`,
      );
      this.progress = {
        ...this.progress,
        achievementsUnlocked: [...this.achievementsUnlocked],
        achievementCounters: cloneAchievementCounters(this.achievementCounters),
      };
      saveProgressToStorage(this.progress);
      this.emitHudSnapshot();
    } else if (forceSave) {
      this.progress = {
        ...this.progress,
        achievementsUnlocked: [...this.achievementsUnlocked],
        achievementCounters: cloneAchievementCounters(this.achievementCounters),
      };
      saveProgressToStorage(this.progress);
    }
  }

  private finalizeRunPersistence(force: boolean): void {
    if (this.runRecorded) return;
    const hasMeaningfulProgress =
      force ||
      this.stats.goldEarned > 0 ||
      this.stats.treesFelled > 0 ||
      this.stats.animalsHunted > 0;
    if (!hasMeaningfulProgress) return;

    this.runRecorded = true;
    this.syncAchievementSnapshotCounters();
    const resEval = evaluateAchievements(
      this.achievementCounters,
      this.achievementsUnlocked,
    );
    this.achievementsUnlocked = resEval.unlockedIds;
    const result = recordExpeditionResult(
      {
        ...this.progress,
        bestiary: cloneBestiary(this.bestiary),
        skills: cloneSkillsState(this.skills),
        achievementsUnlocked: [...this.achievementsUnlocked],
        achievementCounters: cloneAchievementCounters(this.achievementCounters),
      },
      {
        stats: this.stats,
        cabinTier: this.levels.cabin,
        victory: this.victory,
      },
    );
    this.progress = result.progress;
    this.bestGold = this.progress.stats.bestGold;
    saveProgressToStorage(this.progress);
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        if (!this.disposed) this.tick();
      });
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.totalTime += dt;

    if (this.phase === 'title') {
      this.updateTitleCamera(dt);
      this.updateCampfireAndAmbient(dt);
      this.updateWindGustVisuals(0.28);
      this.snowfall.update(dt, 0, 0, this.totalTime, 1.1, 1.0, 0.78, 0.28);
      this.particles.update(dt);
      this.audio.updateSpatialAmbient({
        phase: 'title',
        playerX: 0,
        playerZ: 4.6,
        campX: BUILDING_POSITIONS.campfire.x,
        campZ: BUILDING_POSITIONS.campfire.z,
        weatherIntensity: 0.42,
        gustIntensity: 0.28,
        time: this.totalTime,
        nearCampfire: true,
      });
    } else if (this.phase === 'playing') {
      this.updatePlaying(dt);
    } else {
      // Paused or gameover: freeze simulation, gentle ember flicker only
      this.updateCampfireAndAmbient(dt * 0.25);
      this.audio.updateSpatialAmbient({
        phase: this.phase,
        playerX: this.playerX,
        playerZ: this.playerZ,
        campX: BUILDING_POSITIONS.campfire.x,
        campZ: BUILDING_POSITIONS.campfire.z,
        weatherIntensity: 0,
        gustIntensity: 0,
        time: this.totalTime,
        nearCampfire: false,
      });
    }

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  private updateTitleCamera(_dt: number): void {
    const t = this.totalTime * 0.14;
    const radius = 19.5;
    const cx = Math.sin(t + 0.55) * radius;
    const cz = Math.cos(t + 0.55) * radius;
    this.camera.position.set(cx, 7.6 + Math.sin(t * 1.4) * 0.65, cz);
    // Aim slightly down & left of camp center so Campfire + Tent + Pines frame the right side,
    // leaving calm alpine sky & snowy slope behind the left-aligned Title Emblem.
    this.camera.lookAt(-4.2, 2.4, -2.0);
  }

  private animatePortal(portal: PortalVisual, dt: number, pulseOffset: number): void {
    portal.outerRing.rotation.z += dt * 0.9;
    portal.innerRing.rotation.z -= dt * 1.45;
    const pulse = 0.44 + Math.sin(this.totalTime * 3.4 + pulseOffset) * 0.12;
    (portal.vortexDisc.material as THREE.MeshBasicMaterial).opacity = pulse;
    const s = 0.96 + Math.sin(this.totalTime * 2.8 + pulseOffset) * 0.05;
    portal.vortexDisc.scale.set(s, s, 1);
    portal.groundHalo.rotation.z += dt * 0.55;
    (portal.groundHalo.material as THREE.MeshBasicMaterial).opacity =
      0.48 + Math.sin(this.totalTime * 3.1 + pulseOffset) * 0.14;
    for (let i = 0; i < portal.shards.length; i++) {
      const shard = portal.shards[i];
      const a = this.totalTime * 1.35 + (i / portal.shards.length) * Math.PI * 2;
      shard.position.set(
        Math.cos(a) * 1.48,
        2.48 + Math.sin(a) * 1.48,
        0.18 * Math.sin(this.totalTime * 2 + i),
      );
      shard.rotation.y += dt * 2.2;
      shard.rotation.x += dt * 1.3;
    }
    portal.light.intensity = 5.2 + Math.sin(this.totalTime * 5 + pulseOffset) * 1.0;
  }

  private updateCampfireAndAmbient(dt: number): void {
    const flicker = 1 + Math.sin(this.totalTime * 14) * 0.12 + Math.cos(this.totalTime * 23) * 0.08;
    if (this.activeZone === 'level1') {
      this.campfire.flames.scale.set(1, flicker, 1);
      this.campfire.flames.rotation.y += dt * 1.5;
      this.campfire.light.intensity = 8.5 * flicker * this.campfireGlowMult;
      this.campfire.light.distance = 22 + (this.campfireGlowMult - 1) * 14;
      this.animatePortal(this.portal1, dt, 0);
      this.animatePortal(this.cityPortal1, dt, 0.85);

      if (this.sawmillVisual && this.levels.sawmill > 0) {
        this.sawmillVisual.blade.rotation.y += dt * (4 + this.levels.sawmill * 2.5);
      }
      if (this.craftingStationVisual) {
        this.craftingStationVisual.largeGear.rotation.z += dt * 1.15;
        this.craftingStationVisual.smallGear.rotation.z -= dt * 1.725;
        if (this.anvilAnimTimer > 0) {
          this.anvilAnimTimer = Math.max(0, this.anvilAnimTimer - dt);
          this.craftingStationVisual.hammerGroup.rotation.z =
            -0.18 + Math.sin(this.anvilAnimTimer * 28) * 0.42;
        } else {
          this.craftingStationVisual.hammerGroup.rotation.z = THREE.MathUtils.damp(
            this.craftingStationVisual.hammerGroup.rotation.z,
            -0.18,
            10,
            dt,
          );
        }
      }
    } else if (this.activeZone === 'level2') {
      this.waystationBrazier.flames.scale.set(1, flicker, 1);
      this.waystationBrazier.flames.rotation.y += dt * 1.6;
      this.waystationBrazier.light.intensity = 7.4 * flicker * this.campfireGlowMult;
      this.animatePortal(this.portal2, dt, 1.7);
      this.animatePortal(this.portal2Forward, dt, 2.0);
    } else if (this.activeZone === 'level3') {
      this.waystationBrazier3.flames.scale.set(1, flicker, 1);
      this.waystationBrazier3.flames.rotation.y += dt * 1.6;
      this.waystationBrazier3.light.intensity = 7.0 * flicker * this.campfireGlowMult;
      this.animatePortal(this.portal3Return, dt, 2.5);
      this.animatePortal(this.portal3Forward, dt, 2.9);
    } else if (this.activeZone === 'level4') {
      this.waystationBrazier4.flames.scale.set(1, flicker, 1);
      this.waystationBrazier4.flames.rotation.y += dt * 1.6;
      this.waystationBrazier4.light.intensity = 6.6 * flicker * this.campfireGlowMult;
      this.animatePortal(this.portal4Return, dt, 3.2);
      this.animatePortal(this.portal4Forward, dt, 3.6);
    } else if (this.activeZone === 'level5') {
      this.waystationBrazier5.flames.scale.set(1, flicker, 1);
      this.waystationBrazier5.flames.rotation.y += dt * 1.6;
      this.waystationBrazier5.light.intensity = 6.2 * flicker * this.campfireGlowMult;
      this.animatePortal(this.portal5Return, dt, 4.0);
    } else {
      this.animatePortal(this.cityPortal2, dt, 2.3);
    }
  }

  private updatePlaying(dt: number): void {
    this.stats.elapsedSeconds += dt;

    if (this.portalCooldown > 0) {
      this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    }
    if (this.vortexCooldown > 0) {
      this.vortexCooldown = Math.max(0, this.vortexCooldown - dt);
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastText = null;
      }
    }

    // Hitstop pauses gameplay simulation physics while camera shake & particles remain alive
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.particles.update(dt);
      this.updateCameraFollow(dt);
      this.keysJustPressed.clear();
      this.pointerJustPressed = false;
      return;
    }

    this.updateCampfireAndAmbient(dt);
    this.updateDayNightCycle(dt);
    this.updateWeather(dt);
    this.updateSeasonalEvent(dt);
    this.updateDailyObjective(dt);
    if (this.packFullToastCooldown > 0) {
      this.packFullToastCooldown = Math.max(0, this.packFullToastCooldown - dt);
    }
    const buffTick = tickCraftBuffs(this.activeBuffs, dt);
    this.activeBuffs = buffTick.buffs;
    if (buffTick.changed) {
      this.emitHudSnapshot();
    }
    this.updatePlayerActions(dt);
    this.updatePlayerMovement(dt);

    // Seamless vortex portal transition when stepping through the glowing threshold
    if (this.vortexCooldown <= 0 && this.portalCooldown <= 0) {
      const portalProx = computeNearestZonePortal(this.playerX, this.playerZ, this.activeZone);
      if (portalProx.insideVortex) {
        this.activatePortal();
      }
    }

    this.updateTrees(dt);
    this.updateBoulders(dt);
    this.updateIceSculptures(dt);
    this.updateTrackingSystems(dt);
    this.updateDeployedTraps(dt);
    this.updateAnimals(dt);
    this.updateWildPets(dt);
    this.updateTamedPets(dt);
    if (this.activeZone !== 'city') {
      this.updateWildlifeSpawning(dt);
      this.updateRivalHunters(dt);
      this.updateSecretChests(dt);
    } else {
      this.updateCityActors(dt);
    }
    this.updateArrows(dt);
    this.updateEnemyBolts(dt);
    this.updateZoneBosses(dt);
    this.updateBossProjectiles(dt);
    this.updateBossHazards(dt);
    this.updatePickups(dt);
    this.updateWorkers(dt);
    this.updatePassiveTycoon(dt);
    this.updateStormShelter(dt);
    this.updateWarmthAndVitals(dt);
    this.achievementCheckTimer += dt;
    if (this.achievementCheckTimer >= 2.0) {
      this.achievementCheckTimer = 0;
      this.checkAchievements(false);
    }
    const { warmthRadius } = calculatePassiveRates(this.levels);
    const zSpec = ZONE_SPECS[this.activeZone];
    const effectiveWarmthRadius =
      this.activeZone === 'level1' ? warmthRadius : zSpec.hearthWarmthRadius;
    const hearthDist = Math.hypot(this.playerX - zSpec.hearthX, this.playerZ - zSpec.hearthZ);
    const shieldedInZone = this.activeZone === 'level1' && this.stormShelter.shielded;
    const rawWeatherIntensity = Math.min(1, Math.max(0, (this.currentSnowOpacity - 0.16) / 0.8));
    this.audio.updateSpatialAmbient({
      phase: this.phase,
      playerX: this.playerX,
      playerZ: this.playerZ,
      campX: zSpec.hearthX,
      campZ: zSpec.hearthZ,
      weatherIntensity: shieldedInZone ? rawWeatherIntensity * 0.35 : rawWeatherIntensity,
      gustIntensity: shieldedInZone ? this.currentGustIntensity * 0.2 : this.currentGustIntensity,
      time: this.totalTime,
      nearCampfire: hearthDist <= effectiveWarmthRadius,
    });
    this.particles.update(dt);
    this.updateWindGustVisuals(this.currentGustIntensity);
    this.snowfall.update(
      dt,
      this.playerX,
      this.playerZ,
      this.totalTime,
      this.currentWindX,
      this.currentFallMult,
      this.currentSnowOpacity,
      this.currentGustIntensity,
    );
    if (this.currentGustIntensity > 0.5 && Math.random() < dt * 8 * this.currentGustIntensity) {
      const gx = this.playerX + (Math.random() - 0.5) * 18;
      const gz = this.playerZ + (Math.random() - 0.5) * 18;
      const gy = groundHeightAt(gx, gz) + 0.35;
      this.particles.spawnBurst(gx, gy, gz, 0xeef7ff, 2, 3.2 * this.currentGustIntensity, 0.65, 0.7);
    }
    this.updateCameraFollow(dt);

    this.keysJustPressed.clear();
    this.pointerJustPressed = false;

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.1) {
      this.hudSyncTimer = 0;
      this.emitHudSnapshot();
    }
  }

  private updatePlayerMovement(dt: number): void {
    let moveX = this.touchMoveX;
    let moveZ = this.touchMoveZ;
    const touchMag = Math.hypot(this.touchMoveX, this.touchMoveZ);
    const hasKeyMove =
      this.keysHeld.has('KeyW') ||
      this.keysHeld.has('ArrowUp') ||
      this.keysHeld.has('KeyS') ||
      this.keysHeld.has('ArrowDown') ||
      this.keysHeld.has('KeyA') ||
      this.keysHeld.has('ArrowLeft') ||
      this.keysHeld.has('KeyD') ||
      this.keysHeld.has('ArrowRight');
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) moveZ -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) moveZ += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) moveX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) moveX += 1;

    const isTouchStalking = !hasKeyMove && touchMag > 0.05 && touchMag <= 0.55;
    const isCreeping =
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight') ||
      isTouchStalking;
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    const prepBonus = computeBackpackPreparedness(this.backpackInventory, this.activeBuffs);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
    const speedScale =
      computeCraftSpeedScale(this.activeBuffs) *
      prepBonus.moveSpeedMult *
      wingsSpec.moveSpeedMult *
      petBonuses.moveSpeedMult *
      zoneWeatherEffect.effectiveMoveSpeedMult *
      (isCreeping
        ? skillBonuses.creepSpeedMult * gearBonuses.creepSpeedMult
        : skillBonuses.moveSpeedMult * gearBonuses.moveSpeedMult);
    const maxSpeed = (isCreeping ? 4.2 : 8.6) * speedScale;

    const stepVel = stepPlanarVelocity({
      vx: this.playerVx,
      vz: this.playerVz,
      inputX: moveX,
      inputZ: moveZ,
      maxSpeed,
      accelRate: 21,
      decelRate: 17,
      dt,
    });
    this.playerVx = stepVel.vx;
    this.playerVz = stepVel.vz;
    this.playerSpeed = stepVel.speed;

    let nextX = this.playerX + this.playerVx * dt;
    let nextZ = this.playerZ + this.playerVz * dt;

    // Clamp to active zone ridge boundary
    const clamped = clampToZoneBounds(nextX, nextZ, this.activeZone, 1.5);
    nextX = clamped.x;
    nextZ = clamped.z;

    // Soft collision around active zone campfire / waystation brazier / city fountain
    const zSpec = ZONE_SPECS[this.activeZone];
    const hdx = nextX - zSpec.hearthX;
    const hdz = nextZ - zSpec.hearthZ;
    const fireDist = Math.hypot(hdx, hdz);
    const hearthCollisionR = this.activeZone === 'city' ? 3.8 : 1.55;
    if (fireDist < hearthCollisionR && fireDist > 0.001) {
      nextX = zSpec.hearthX + (hdx / fireDist) * hearthCollisionR;
      nextZ = zSpec.hearthZ + (hdz / fireDist) * hearthCollisionR;
    }

    if (this.activeZone === 'city') {
      for (const id of CITY_TRADER_ORDER) {
        const st = CITY_TRADERS[id];
        const sdx = nextX - st.stallX;
        const sdz = nextZ - st.stallZ;
        const sDist = Math.hypot(sdx, sdz);
        if (sDist < 1.95 && sDist > 0.001) {
          nextX = st.stallX + (sdx / sDist) * 1.95;
          nextZ = st.stallZ + (sdz / sDist) * 1.95;
        }
      }
    }

    this.playerX = nextX;
    this.playerZ = nextZ;

    if (stepVel.moveYaw !== null) {
      const prevYaw = this.playerYaw;
      const nextYaw = dampAngle(prevYaw, stepVel.moveYaw, 15, dt);
      const yawVel = angleDiff(prevYaw, nextYaw) / Math.max(0.001, dt);
      const targetBank = clamp(-yawVel * 0.032 * (stepVel.speed / maxSpeed), -0.18, 0.18);
      this.playerTurnBank = dampScalar(this.playerTurnBank, targetBank, 14, dt);
      this.playerYaw = nextYaw;
    } else {
      this.playerTurnBank = dampScalar(this.playerTurnBank, 0, 12, dt);
    }

    if (this.playerSpeed > 0.25) {
      this.playerWalkPhase += this.playerSpeed * dt * 1.45;
      this.idleTime = 0;

      // Subtle snow footstep crunch + snow kick puff on each stride beat
      const stepIdx = Math.floor(this.playerWalkPhase / Math.PI);
      if (stepIdx !== this.lastFootstepStep) {
        this.lastFootstepStep = stepIdx;
        if (!isCreeping || stepIdx % 2 === 0) {
          this.audio.playFootstep(isCreeping);
          const stepY = groundHeightAt(this.playerX, this.playerZ) + 0.06;
          this.particles.spawnBurst(
            this.playerX,
            stepY,
            this.playerZ,
            0xeaf4fc,
            isCreeping ? 2 : 4,
            1.4,
            0.35,
            1.2,
          );
        }
      }
    } else {
      this.idleTime += dt;
    }

    const swingProgress =
      this.swingTimer > 0 && this.swingDuration > 0
        ? clamp(this.swingTimer / this.swingDuration, 0, 1)
        : 0;
    const isAiming =
      this.activeTool === 'bow' &&
      (this.pointerDown || this.keysHeld.has('Space'));
    const pose = computeBipedGait({
      walkPhase: this.playerWalkPhase,
      speed: this.playerSpeed,
      maxSpeed,
      isCreeping,
      idleTime: this.idleTime,
      swingProgress,
      activeTool: this.activeTool,
      turnBank: this.playerTurnBank,
      isAiming,
    });

    this.playerRig.leftLeg.rotation.x = pose.leftHipX;
    this.playerRig.leftKnee.rotation.x = pose.leftKneeX;
    this.playerRig.rightLeg.rotation.x = pose.rightHipX;
    this.playerRig.rightKnee.rotation.x = pose.rightKneeX;

    this.playerRig.leftArm.rotation.x = pose.leftShoulderX;
    this.playerRig.leftArm.rotation.z = pose.leftShoulderZ;
    this.playerRig.leftElbow.rotation.x = pose.leftElbowX;

    this.playerRig.rightArm.rotation.x = pose.rightShoulderX;
    this.playerRig.rightArm.rotation.z = pose.rightShoulderZ;
    this.playerRig.rightElbow.rotation.x = pose.rightElbowX;

    this.playerRig.torsoPivot.rotation.set(
      pose.torsoPitchX,
      pose.torsoTwistY,
      pose.torsoRollZ,
    );
    this.playerRig.headGroup.rotation.x = pose.headPitchX;
    this.playerRig.bodyGroup.position.y = pose.pelvisY;

    // Articulated Bowstring Pull & Axe Slash Crescent VFX
    this.playerRig.bowStringMesh.position.z = -0.19 - pose.bowStringPull * 0.24;
    this.playerRig.bowStringMesh.scale.y = 1 + pose.bowStringPull * 0.14;
    this.playerRig.bowArrowGroup.position.z = -pose.bowStringPull * 0.24;
    this.playerRig.bowArrowGroup.visible =
      this.activeTool === 'bow' && (this.attackCooldown < 0.08 || pose.bowStringPull > 0.18);

    if (this.activeTool === 'axe' && pose.slashAlpha > 0.02) {
      this.playerRig.slashArcMesh.visible = true;
      this.playerRig.slashArcMat.opacity = pose.slashAlpha * 0.78;
      const axeLvl = this.levels.axe;
      this.playerRig.slashArcMat.color.setHex(
        axeLvl >= 7
          ? 0xe879f9
          : axeLvl >= 5
            ? 0xa855f7
            : axeLvl >= 4
              ? 0x22d3ee
              : 0x38bdf8,
      );
      this.playerRig.slashArcMesh.rotation.z = pose.slashSweep * 0.85;
      this.playerRig.slashArcMesh.scale.setScalar(1 + (axeLvl - 1) * 0.08);
    } else {
      this.playerRig.slashArcMesh.visible = false;
    }

    const groundY = groundHeightAt(this.playerX, this.playerZ);
    this.playerRig.group.position.set(this.playerX, groundY, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;

    const gearAvgTier =
      (this.gear.coat + this.gear.boots + this.gear.gloves + this.gear.pack) / 4;
    updateCharacterEquipmentVisuals(this.playerRig, {
      axeLevel: this.levels.axe,
      bowLevel: this.levels.bow,
      gearAvgTier,
      activeBuffCount: this.countActiveCraftBuffs(),
      wingsTier: this.wingsTier,
      wingsEquipped: this.wingsEquipped,
      time: this.totalTime,
      moveSpeedRatio: clamp(this.playerSpeed / Math.max(1, maxSpeed), 0, 1.4),
    });

    // Hurt flash decay
    if (this.hurtFlashTimer > 0) {
      this.hurtFlashTimer -= dt;
      const scalePulse = 1 + Math.sin(this.hurtFlashTimer * 35) * 0.08;
      this.playerRig.bodyGroup.scale.set(scalePulse, 1 / scalePulse, scalePulse);
    } else {
      this.playerRig.bodyGroup.scale.set(1, 1, 1);
    }
  }

  private updatePlayerActions(dt: number): void {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.swingTimer > 0) {
      this.swingTimer = Math.max(0, this.swingTimer - dt);
    }

    const wantAttack =
      this.keysJustPressed.has('Space') ||
      this.keysHeld.has('Space') ||
      this.pointerJustPressed ||
      this.pointerDown;

    if (!wantAttack || this.attackCooldown > 0) return;

    // Aim toward cursor if pointer triggered
    if (this.pointerJustPressed || this.pointerDown) {
      if (this.screenToWorldGround(this.pointerClientX, this.pointerClientY, _vec3)) {
        const dx = _vec3.x - this.playerX;
        const dz = _vec3.z - this.playerZ;
        if (Math.hypot(dx, dz) > 0.3) {
          this.playerYaw = Math.atan2(dx, dz);
        }
      }
    }

    if (this.activeTool === 'axe') {
      this.performAxeStrike();
    } else {
      this.performBowShot();
    }
  }

  private performAxeStrike(): void {
    const spec = getAxeSpec(this.levels.axe);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    const prepBonus = computeBackpackPreparedness(this.backpackInventory, this.activeBuffs);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
    const dmgScale =
      computeCraftDamageScale(this.activeBuffs) *
      gearBonuses.damageMult *
      wingsSpec.damageMult *
      prepBonus.damageMult *
      petBonuses.damageMult;
    const hitPower = Math.max(
      1,
      Math.round(
        spec.power *
          dmgScale *
          skillBonuses.axePowerMult *
          zoneWeatherEffect.effectiveGatherEfficiencyMult,
      ),
    );
    const animalCleavePower = Math.round(spec.power * dmgScale * skillBonuses.huntDamageMult * 0.9);
    const effectiveCooldown = spec.cooldown * gearBonuses.cooldownMult;
    this.attackCooldown = effectiveCooldown;
    this.swingDuration = Math.min(0.32, Math.max(0.18, effectiveCooldown * 0.85));
    this.swingTimer = this.swingDuration;
    this.audio.playAxeSwing(this.levels.axe);

    const fx = Math.sin(this.playerYaw);
    const fz = Math.cos(this.playerYaw);
    let hitSomething = false;

    // Check trees in reach & forward cone (or close radial cleave)
    for (const tree of this.trees) {
      if (tree.zone !== this.activeZone || tree.respawnTimer > 0 || tree.fallTimer > 0) continue;
      const dx = tree.x - this.playerX;
      const dz = tree.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist > spec.range) continue;

      const dot = dist > 0.01 ? (dx / dist) * fx + (dz / dist) * fz : 1;
      if (dot < 0.15 && dist > 1.8) continue;

      hitSomething = true;
      tree.hp -= hitPower;
      tree.shakeTimer = 0.22;
      tree.flashTimer = 0.06;
      this.audio.playChop(this.levels.axe, tree.x, tree.z);
      this.particles.spawnBurst(tree.x, tree.y + 1.4, tree.z, 0xd8a86e, 9, 4.5, 0.9, 3.0);
      this.particles.spawnBurst(tree.x, tree.y + 2.1, tree.z, 0xf2f7fc, 5, 3.2, 0.85, 2.2);

      if (tree.hp <= 0) {
        this.fellTree(tree);
      } else {
        this.awardSkillXp('gathering', Math.round(4 * ZONE_SPECS[tree.zone].xpMult));
        this.trauma = Math.min(0.45, this.trauma + 0.16);
      }
      break;
    }

    // Check granite boulders if no tree struck
    if (!hitSomething) {
      for (const boulder of this.boulders) {
        if (boulder.zone !== this.activeZone || boulder.respawnTimer > 0) continue;
        const dx = boulder.x - this.playerX;
        const dz = boulder.z - this.playerZ;
        const dist = Math.hypot(dx, dz);
        if (dist > spec.range + 0.35) continue;

        const dot = dist > 0.01 ? (dx / dist) * fx + (dz / dist) * fz : 1;
        if (dot < 0.1 && dist > 1.9) continue;

        hitSomething = true;
        boulder.hp -= hitPower;
        boulder.shakeTimer = 0.2;
        this.audio.playChop(this.levels.axe, boulder.x, boulder.z);
        this.particles.spawnBurst(
          boulder.x,
          boulder.y + 0.9,
          boulder.z,
          0xaab5c2,
          9,
          4.2,
          0.9,
          3.2,
        );

        if (boulder.hp <= 0) {
          this.breakBoulder(boulder);
        } else {
          this.awardSkillXp('gathering', Math.round(4 * ZONE_SPECS[boulder.zone].xpMult));
          this.trauma = Math.min(0.45, this.trauma + 0.14);
        }
        break;
      }
    }

    // Check seasonal wild Ice Sculptures if active and neither tree nor boulder was hit
    if (!hitSomething && this.seasonalEvent.active) {
      for (const sculp of this.iceSculptures) {
        if (sculp.zone !== this.activeZone || !sculp.mesh.visible || sculp.respawnTimer > 0) {
          continue;
        }
        const dx = sculp.x - this.playerX;
        const dz = sculp.z - this.playerZ;
        const dist = Math.hypot(dx, dz);
        if (dist > spec.range + 0.45) continue;

        const dot = dist > 0.01 ? (dx / dist) * fx + (dz / dist) * fz : 1;
        if (dot < 0.1 && dist > 1.9) continue;

        hitSomething = true;
        sculp.hp -= hitPower;
        sculp.shakeTimer = 0.22;
        this.audio.playPickup('ice');
        this.particles.spawnBurst(
          sculp.x,
          sculp.y + 1.1,
          sculp.z,
          0x9fe8ff,
          12,
          4.8,
          0.95,
          3.4,
        );

        if (sculp.hp <= 0) {
          this.harvestIceSculpture(sculp);
        } else {
          this.awardSkillXp('gathering', Math.round(5 * ZONE_SPECS[sculp.zone].xpMult));
          this.trauma = Math.min(0.45, this.trauma + 0.14);
        }
        break;
      }
    }

    // Axe can also cleave nearby aggressive predators, wildlife, or rival hunters
    for (const animal of this.animals) {
      if (animal.zone !== this.activeZone || animal.state === 'ko') continue;
      const dx = animal.x - this.playerX;
      const dz = animal.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      const sizeBonus =
        animal.kind === 'mammoth'
          ? 1.15
          : animal.kind === 'polar_bear' || animal.kind === 'musk_ox'
            ? 0.75
            : animal.kind === 'aurora_fenrir' || animal.kind === 'sabertooth'
              ? 0.6
              : 0.4;
      if (dist <= spec.range + sizeBonus) {
        hitSomething = true;
        this.damageAnimal(animal, animalCleavePower, dx, dz, true);
      }
    }

    for (const hunter of this.rivalHunters) {
      if (hunter.zone !== this.activeZone || hunter.state === 'ko') continue;
      const dx = hunter.x - this.playerX;
      const dz = hunter.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist <= spec.range + 0.65) {
        hitSomething = true;
        this.damageRivalHunter(hunter, animalCleavePower, dx, dz, true);
      }
    }

    for (const boss of this.zoneBosses) {
      if (boss.zone !== this.activeZone || boss.state === 'ko') continue;
      const dx = boss.x - this.playerX;
      const dz = boss.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist <= spec.range + 1.45) {
        hitSomething = true;
        this.damageZoneBoss(boss, animalCleavePower, dx, dz, true);
      }
    }
  }

  private performBowShot(): void {
    const spec = getBowSpec(this.levels.bow);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    const prepBonus = computeBackpackPreparedness(this.backpackInventory, this.activeBuffs);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const dmgScale =
      computeCraftDamageScale(this.activeBuffs) *
      skillBonuses.huntDamageMult *
      gearBonuses.damageMult *
      wingsSpec.damageMult *
      prepBonus.damageMult *
      petBonuses.damageMult;
    const effectiveCooldown = spec.cooldown * gearBonuses.cooldownMult;
    this.attackCooldown = effectiveCooldown;
    this.swingDuration = Math.min(0.24, Math.max(0.14, effectiveCooldown * 0.65));
    this.swingTimer = this.swingDuration;
    this.audio.playBowTwang(this.levels.bow);

    const fx = Math.sin(this.playerYaw);
    const fz = Math.cos(this.playerYaw);
    const spawnX = this.playerX + fx * 0.7;
    const spawnY = groundHeightAt(this.playerX, this.playerZ) + 1.25;
    const spawnZ = this.playerZ + fz * 0.7;

    const mesh = new THREE.Mesh(this.arrowGeo, this.arrowMat);
    mesh.position.set(spawnX, spawnY, spawnZ);
    mesh.rotation.y = this.playerYaw;
    this.getZoneGroup(this.activeZone).add(mesh);

    const speed = (28 + this.levels.bow * 3) * skillBonuses.arrowSpeedMult;
    this.arrows.push({
      zone: this.activeZone,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      vx: fx * speed,
      vy: 0.6,
      vz: fz * speed,
      damage: Math.round(spec.power * dmgScale),
      life: spec.range / speed,
      mesh,
    });
  }

  private fellTree(tree: TreeEntity): void {
    tree.fallTimer = 0.48;
    tree.respawnTimer = 16;
    this.hitstopTimer = 0.045;
    this.trauma = Math.min(0.7, this.trauma + 0.35);
    this.audio.playTreeFall(tree.x, tree.z);
    this.stats.treesFelled += 1;
    this.achievementCounters.treesFelled += 1;
    this.advanceObjectiveMetric('treesFelled', 1);

    const zSpec = ZONE_SPECS[tree.zone];
    const { harvestMultiplier } = calculatePassiveRates(this.levels);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const craftYieldMult = computeCraftYieldScale(this.activeBuffs);
    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
    const woodTotal = Math.max(
      1,
      Math.round(
        tree.woodYield *
          harvestMultiplier *
          skillBonuses.gatherYieldMult *
          gearBonuses.gatherYieldMult *
          craftYieldMult *
          calMods.woodMult *
          petBonuses.gatherYieldMult *
          zoneWeatherEffect.effectiveGatherEfficiencyMult *
          zSpec.yieldMult,
      ),
    );
    const bundles = tree.kind === 'elder' ? 3 : 2;
    const perBundle = Math.max(1, Math.ceil(woodTotal / bundles));

    for (let i = 0; i < bundles; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawnPickup(
        'wood',
        perBundle,
        tree.x + Math.cos(a) * 1.1,
        tree.y + 0.8,
        tree.z + Math.sin(a) * 1.1,
        tree.zone,
      );
    }
    if (tree.kind === 'elder') {
      this.spawnPickup(
        'gold',
        Math.round(10 * zSpec.yieldMult),
        tree.x,
        tree.y + 1.1,
        tree.z,
        tree.zone,
      );
    }
    this.particles.spawnBurst(tree.x, tree.y + 1.8, tree.z, 0xf2f7fc, 16, 5.5, 1.15, 4.2);
    this.awardSkillXp(
      'gathering',
      Math.round(computeGatheringNodeXp(tree.kind) * zSpec.xpMult),
    );
    this.checkAchievements(false);
  }

  private breakBoulder(boulder: BoulderEntity): void {
    boulder.respawnTimer = 20;
    boulder.mesh.visible = false;
    this.hitstopTimer = 0.04;
    this.trauma = Math.min(0.65, this.trauma + 0.28);
    this.audio.playTreeFall(boulder.x, boulder.z);

    const zSpec = ZONE_SPECS[boulder.zone];
    const { harvestMultiplier } = calculatePassiveRates(this.levels);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const craftYieldMult = computeCraftYieldScale(this.activeBuffs);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
    const stoneTotal = Math.max(
      1,
      Math.round(
        boulder.stoneYield *
          harvestMultiplier *
          skillBonuses.gatherYieldMult *
          gearBonuses.gatherYieldMult *
          craftYieldMult *
          petBonuses.gatherYieldMult *
          zoneWeatherEffect.effectiveGatherEfficiencyMult *
          zSpec.yieldMult,
      ),
    );
    const bundles = 2;
    const perBundle = Math.max(1, Math.ceil(stoneTotal / bundles));
    for (let i = 0; i < bundles; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawnPickup(
        'stone',
        perBundle,
        boulder.x + Math.cos(a) * 0.9,
        boulder.y + 0.7,
        boulder.z + Math.sin(a) * 0.9,
        boulder.zone,
      );
    }
    if (boulder.zone === 'level2') {
      this.spawnPickup('ice', 1, boulder.x, boulder.y + 0.85, boulder.z, boulder.zone);
    }
    this.particles.spawnBurst(
      boulder.x,
      boulder.y + 1.0,
      boulder.z,
      boulder.zone === 'level2' ? 0x9fe8ff : 0x9aa6b4,
      16,
      5.2,
      1.1,
      4.0,
    );
    this.awardSkillXp(
      'gathering',
      Math.round(computeGatheringNodeXp('boulder') * zSpec.xpMult),
    );
  }

  private harvestIceSculpture(sculp: IceSculptureEntity): void {
    sculp.respawnTimer = 18;
    sculp.mesh.visible = false;
    this.hitstopTimer = 0.04;
    this.trauma = Math.min(0.65, this.trauma + 0.25);
    this.audio.playPickup('ice');

    const zSpec = ZONE_SPECS[sculp.zone];
    const profile = getSeasonalEventProfile(this.seasonalEvent.id);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const craftYieldMult = computeCraftYieldScale(this.activeBuffs);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
    const baseIce = Math.max(sculp.iceYield, profile.sculptureIceYield);
    const totalIce = Math.max(
      1,
      Math.round(
        baseIce *
          skillBonuses.gatherYieldMult *
          gearBonuses.gatherYieldMult *
          craftYieldMult *
          petBonuses.gatherYieldMult *
          zoneWeatherEffect.effectiveGatherEfficiencyMult *
          zSpec.yieldMult,
      ),
    );
    for (let i = 0; i < totalIce; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawnPickup(
        'ice',
        1,
        sculp.x + Math.cos(a) * 0.85,
        sculp.y + 0.85,
        sculp.z + Math.sin(a) * 0.85,
        sculp.zone,
      );
    }
    this.spawnPickup(
      'gold',
      Math.round(6 * zSpec.yieldMult),
      sculp.x,
      sculp.y + 1.0,
      sculp.z,
      sculp.zone,
    );
    this.particles.spawnBurst(
      sculp.x,
      sculp.y + 1.2,
      sculp.z,
      0xb7eeff,
      20,
      5.6,
      1.15,
      4.4,
    );
    this.awardSkillXp(
      'gathering',
      Math.round(computeGatheringNodeXp('ice_sculpture') * zSpec.xpMult),
    );
  }

  private syncWildIceSculptures(active: boolean): void {
    for (const sculp of this.iceSculptures) {
      sculp.hp = sculp.maxHp;
      sculp.respawnTimer = 0;
      sculp.shakeTimer = 0;
      sculp.mesh.visible = active;
      sculp.mesh.scale.set(active ? 0.25 : 1, active ? 0.25 : 1, active ? 0.25 : 1);
      sculp.mesh.rotation.z = 0;
    }
  }

  private updateIceSculptures(dt: number): void {
    if (!this.seasonalEvent.active) return;
    for (const sculp of this.iceSculptures) {
      if (sculp.respawnTimer > 0) {
        sculp.respawnTimer -= dt;
        if (sculp.respawnTimer <= 0) {
          sculp.hp = sculp.maxHp;
          sculp.mesh.visible = true;
          sculp.mesh.scale.set(0.25, 0.25, 0.25);
        }
      } else if (sculp.mesh.visible) {
        if (sculp.mesh.scale.x < 0.999) {
          const s = THREE.MathUtils.damp(sculp.mesh.scale.x, 1, 7, dt);
          sculp.mesh.scale.set(s, s, s);
        }
        sculp.mesh.rotation.y += dt * 0.32;
        if (sculp.shakeTimer > 0) {
          sculp.shakeTimer -= dt;
          sculp.mesh.rotation.z = Math.sin(sculp.shakeTimer * 52) * 0.08;
        } else {
          sculp.mesh.rotation.z *= 0.8;
        }
      }
    }
  }

  private persistBestiary(): void {
    this.progress = {
      ...this.progress,
      bestiary: cloneBestiary(this.bestiary),
    };
    saveProgressToStorage(this.progress);
  }

  private persistSkills(): void {
    this.progress = {
      ...this.progress,
      skills: cloneSkillsState(this.skills),
    };
    saveProgressToStorage(this.progress);
  }

  private awardSkillXp(branch: SkillBranch, amount: number): void {
    if (amount <= 0) return;
    const res = grantSkillXp(this.skills, branch, amount);
    this.skills = res.skills;
    if (res.leveledUp) {
      this.persistSkills();
      this.audio.playLevelUp();
      this.particles.spawnBurst(
        this.playerX,
        1.65,
        this.playerZ,
        branch === 'gathering' ? 0x8ed49a : 0xf6c344,
        24,
        5.5,
        1.2,
        4.6,
      );
      const label = branch === 'gathering' ? 'Gathering' : 'Hunting';
      this.showToast(
        `${label} Level ${res.newLevel}! +${res.levelsGained} Skill Point${
          res.levelsGained > 1 ? 's' : ''
        } ([K] Skills)`,
      );
      this.emitHudSnapshot();
    } else if (Math.random() < 0.35) {
      // Periodically persist partial XP without spamming storage writes on every frame
      this.persistSkills();
    }
  }

  private damageAnimal(
    animal: AnimalEntity,
    dmg: number,
    dirX: number,
    dirZ: number,
    heavy: boolean,
  ): void {
    const skillBonuses = computeSkillBonuses(this.skills);
    const ambushHit = !heavy && isUnawareBehavior(animal.state);
    const focusBoost =
      this.trackAmbushBonusTimer > 0 ? TRACK_AMBUSH_DAMAGE_MULT : 1.0;
    if (this.trackAmbushBonusTimer > 0) {
      this.trackAmbushBonusTimer = 0;
    }
    const baseDmg = ambushHit
      ? Math.round(dmg * 1.35 * skillBonuses.ambushMult)
      : dmg;
    const effectiveDmg = Math.round(baseDmg * focusBoost);
    animal.hp -= effectiveDmg;
    animal.hitsTaken += 1;
    animal.flashTimer = 0.08;
    const d = Math.hypot(dirX, dirZ) || 1;
    const knockback =
      animal.kind === 'mammoth'
        ? 0.25
        : animal.kind === 'musk_ox'
          ? 0.35
          : animal.kind === 'polar_bear' || animal.kind === 'aurora_fenrir'
            ? 0.45
            : animal.kind === 'sabertooth'
              ? 0.65
              : 0.85;
    animal.x += (dirX / d) * knockback;
    animal.z += (dirZ / d) * knockback;

    const hitTrack = recordAnimalHit(this.bestiary, animal.kind, effectiveDmg, ambushHit);
    this.bestiary = hitTrack.bestiary;

    if (heavy) {
      this.audio.playHit(true, animal.x, animal.z);
    } else {
      this.audio.playArrowHit(ambushHit, this.levels.bow, animal.x, animal.z);
    }
    this.particles.spawnBurst(
      animal.x,
      groundHeightAt(animal.x, animal.z) + 0.7,
      animal.z,
      ambushHit || focusBoost > 1 ? 0xf6c344 : 0xffe7c2,
      ambushHit ? 14 : 10,
      4.5,
      0.95,
      3.0,
    );

    const spec = SPECIES_SPECS[animal.kind];
    if (animal.hp <= 0) {
      animal.state = 'ko';
      animal.stateTimer = 0.4;
      if (animal.model.telegraphRing) animal.model.telegraphRing.visible = false;
      if (animal.model.attackSlashMesh) animal.model.attackSlashMesh.visible = false;
      if (animal.model.alertMarker) animal.model.alertMarker.visible = false;
      if (animal.model.sightBeacon) animal.model.sightBeacon.group.visible = false;
      if (this.trackedAnimalId === animal.id) {
        this.trackedAnimalId = null;
      }
      this.hitstopTimer = 0.05;
      this.trauma = Math.min(0.6, this.trauma + 0.28);
      this.stats.animalsHunted += 1;
      this.achievementCounters.animalsHunted += 1;
      this.advanceObjectiveMetric('animalsHunted', 1);
      this.cityDailyQuest = recordCityDailyQuestKill(this.cityDailyQuest, 1).quest;
      if (animal.kind === 'wolf' || animal.kind === 'aurora_fenrir') {
        this.stats.wolvesSlain += 1;
        this.achievementCounters.wolvesSlain += 1;
        this.advanceObjectiveMetric('wolvesSlain', 1);
      }

      const zSpec = ZONE_SPECS[animal.zone];
      const { harvestMultiplier } = calculatePassiveRates(this.levels);
      const zoneWeatherEffect = this.getActiveZoneWeatherEffect();
      const peltsAwarded = Math.max(
        1,
        Math.round(
          spec.peltDrop *
            harvestMultiplier *
            skillBonuses.peltYieldMult *
            zoneWeatherEffect.effectiveGatherEfficiencyMult *
            zSpec.yieldMult,
        ),
      );
      const meatAwarded = Math.max(
        1,
        Math.round(
          spec.meatDrop *
            harvestMultiplier *
            zoneWeatherEffect.effectiveGatherEfficiencyMult *
            zSpec.yieldMult,
        ),
      );
      const goldAwarded = Math.round(spec.goldDrop * zSpec.yieldMult);
      const y = groundHeightAt(animal.x, animal.z) + 0.5;
      this.spawnPickup(
        'pelt',
        peltsAwarded,
        animal.x - 0.38,
        y,
        animal.z,
        animal.zone,
      );
      this.spawnPickup(
        'meat',
        meatAwarded,
        animal.x,
        y + 0.12,
        animal.z - 0.34,
        animal.zone,
      );
      this.spawnPickup('gold', goldAwarded, animal.x + 0.38, y, animal.z, animal.zone);
      if (spec.iceDrop && spec.iceDrop > 0) {
        this.spawnPickup('ice', spec.iceDrop, animal.x, y + 0.18, animal.z + 0.32, animal.zone);
      }

      const killTrack = recordAnimalKill(
        this.bestiary,
        animal.kind,
        animal.hitsTaken,
        peltsAwarded,
        goldAwarded,
      );
      this.bestiary = killTrack.bestiary;
      this.persistBestiary();
      this.awardSkillXp(
        'hunting',
        Math.round(computeHuntingKillXp(spec.rarity) * zSpec.xpMult),
      );
      if (spec.rarity === 'mythic' || spec.rarity === 'rare' || spec.rarity === 'epic') {
        const tierLabel =
          spec.rarity === 'mythic' ? 'Mythic' : spec.rarity === 'epic' ? 'Epic' : 'Rare';
        this.showToast(`Felled ${tierLabel} ${spec.label}! Bestiary updated.`);
      }
      this.emitHudSnapshot();
    } else {
      const zSpec = ZONE_SPECS[animal.zone];
      this.awardSkillXp('hunting', Math.round((ambushHit ? 14 : 8) * zSpec.xpMult));
      if (hitTrack.newlyDiscovered) {
        this.persistBestiary();
        this.emitHudSnapshot();
      }
      if (spec.predator) {
        animal.state = 'stalk';
      } else {
        animal.state = 'flee';
        animal.stateTimer = 2.8;
        animal.wanderAngle = Math.atan2(dirX, dirZ);
      }
    }
  }

  private spawnPickup(
    kind: 'wood' | 'stone' | 'ice' | 'pelt' | 'meat' | 'gold',
    amount: number,
    x: number,
    y: number,
    z: number,
    zone: ZoneId = this.activeZone,
  ): void {
    const mesh = createPickupModel(kind, this.palette);
    mesh.position.set(x, y, z);
    this.getZoneGroup(zone).add(mesh);
    this.pickups.push({
      zone,
      kind,
      amount,
      x,
      y,
      z,
      vy: 4.5,
      age: 0,
      mesh,
    });
  }

  private updateTrees(dt: number): void {
    for (const tree of this.trees) {
      if (tree.fallTimer > 0) {
        tree.fallTimer -= dt;
        const progress = 1 - Math.max(0, tree.fallTimer / 0.48);
        tree.mesh.rotation.z = progress * (Math.PI / 2.1);
        if (tree.fallTimer <= 0) {
          tree.mesh.visible = false;
        }
      } else if (tree.respawnTimer > 0) {
        tree.respawnTimer -= dt;
        if (tree.respawnTimer <= 0) {
          tree.hp = tree.maxHp;
          tree.mesh.visible = true;
          tree.mesh.rotation.z = 0;
          tree.mesh.scale.set(0.25, 0.25, 0.25);
        }
      } else {
        // Elastic pop-in regrowth
        if (tree.mesh.scale.x < 0.999) {
          const s = THREE.MathUtils.damp(tree.mesh.scale.x, 1, 8, dt);
          tree.mesh.scale.set(s, s, s);
        }
        if (tree.shakeTimer > 0) {
          tree.shakeTimer -= dt;
          tree.mesh.rotation.x = Math.sin(tree.shakeTimer * 48) * 0.08;
        } else {
          tree.mesh.rotation.x *= 0.8;
        }
      }
    }
  }

  private applyWindTargetsOnObject(
    root: THREE.Object3D | null,
    worldX: number,
    worldZ: number,
    parentYaw: number,
    gustIntensity: number,
  ): void {
    if (!root) return;
    const targets = getWindTargets(root);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const sample = computeWindGustSample({
        time: this.totalTime,
        gustIntensity,
        worldX,
        worldZ,
        stiffness: target.stiffness,
        phaseOffset: target.phaseOffset,
      });
      const euler = worldLeanToLocalEuler(
        sample.leanX,
        sample.leanZ,
        target.useGroupYaw ? parentYaw : 0,
      );
      target.pivot.rotation.x = target.baseRotX + euler.rotX;
      target.pivot.rotation.z = target.baseRotZ + euler.rotZ;
    }
  }

  private updateWindGustVisuals(gustIntensity: number): void {
    // 1. Foreground pine, spruce, and elder trees bend and shake in traveling gusts
    for (const tree of this.trees) {
      if (
        tree.zone !== this.activeZone ||
        !tree.mesh.visible ||
        tree.fallTimer > 0 ||
        tree.respawnTimer > 0
      ) {
        continue;
      }
      this.applyWindTargetsOnObject(
        tree.mesh,
        tree.x,
        tree.z,
        tree.mesh.rotation.y,
        gustIntensity,
      );
    }

    // 2. Backdrop horizon forest ring sways synchronously in blizzard waves
    updateBackdropForestWind(
      this.activeZone === 'city'
        ? this.cityWorldGroup
        : this.activeZone === 'level2'
          ? this.level2WorldGroup
          : this.activeZone === 'level3'
            ? this.level3WorldGroup
            : this.activeZone === 'level4'
              ? this.level4WorldGroup
              : this.activeZone === 'level5'
                ? this.level5WorldGroup
                : this.worldGroup,
      this.totalTime,
      gustIntensity,
    );

    // 3. Environmental camp structures: hanging lanterns, banners, drying pelts, plot signs
    if (this.activeZone === 'level1') {
      const structures: (THREE.Object3D | null)[] = [
        this.worldGroup,
        this.cabinGroup,
        this.lumberCampGroup,
        this.sawmillVisual?.group ?? null,
        this.tanneryGroup,
        this.forgeGroup,
        this.tamingPenGroup,
        this.stormShelterVisual?.group ?? null,
        this.festivalPavilionGroup,
        this.iceMonumentGroup,
        this.craftingStationVisual?.group ?? null,
      ];
      for (const obj of structures) {
        if (!obj) continue;
        this.applyWindTargetsOnObject(
          obj,
          obj.position.x,
          obj.position.z,
          obj.rotation.y,
          gustIntensity,
        );
      }
    } else if (this.activeZone === 'city') {
      for (const st of this.cityStalls) {
        this.applyWindTargetsOnObject(
          st.group,
          st.group.position.x,
          st.group.position.z,
          st.group.rotation.y,
          gustIntensity * 0.45,
        );
      }
    }

    // 4. Wildlife tails flutter lightly in gusts on top of their animated gait pose
    for (const a of this.animals) {
      if (a.zone !== this.activeZone || a.state === 'ko' || !a.model.tailPivot) continue;
      const sample = computeWindGustSample({
        time: this.totalTime,
        gustIntensity,
        worldX: a.x,
        worldZ: a.z,
        stiffness: 0.8,
        phaseOffset: a.id * 0.7,
      });
      a.model.tailPivot.rotation.x += sample.leanZ * 0.32;
      a.model.tailPivot.rotation.z += sample.leanX * 0.48;
    }

    // 5. Campfire flame tongues lean downwind during gusts & snowstorms
    if (this.activeZone === 'level1') {
      const flameSample = computeWindGustSample({
        time: this.totalTime,
        gustIntensity,
        worldX: BUILDING_POSITIONS.campfire.x,
        worldZ: BUILDING_POSITIONS.campfire.z,
        stiffness: 0.42,
        phaseOffset: 0.3,
      });
      const flameEuler = worldLeanToLocalEuler(
        flameSample.leanX * 1.4,
        flameSample.leanZ * 1.4,
        this.campfire.flames.rotation.y,
      );
      this.campfire.flames.rotation.x = flameEuler.rotX;
      this.campfire.flames.rotation.z = flameEuler.rotZ;
    }
  }

  private updateBoulders(dt: number): void {
    for (const b of this.boulders) {
      const baseScale = b.zone !== 'level1' ? 1.12 : 1;
      if (b.respawnTimer > 0) {
        b.respawnTimer -= dt;
        if (b.respawnTimer <= 0) {
          b.hp = b.maxHp;
          b.mesh.visible = true;
          b.mesh.scale.set(0.25, 0.25, 0.25);
        }
      } else {
        if (b.mesh.scale.x < baseScale - 0.001) {
          const s = THREE.MathUtils.damp(b.mesh.scale.x, baseScale, 8, dt);
          b.mesh.scale.set(s, s, s);
        }
        if (b.shakeTimer > 0) {
          b.shakeTimer -= dt;
          b.mesh.rotation.z = Math.sin(b.shakeTimer * 52) * 0.07;
        } else {
          b.mesh.rotation.z *= 0.8;
        }
      }
    }
  }

  private updateTrackingSystems(dt: number): void {
    const sightTick = tickHuntersSight(this.huntersSight, dt);
    this.huntersSight = sightTick.state;
    if (sightTick.readyNow) {
      this.showToast("Hunter's Sight Ready ([Q])!");
    }

    if (this.trackAmbushBonusTimer > 0) {
      this.trackAmbushBonusTimer = Math.max(0, this.trackAmbushBonusTimer - dt);
    }

    if (this.sightPulseAnimTimer > 0) {
      this.sightPulseAnimTimer = Math.max(0, this.sightPulseAnimTimer - dt);
      const t = 1 - this.sightPulseAnimTimer / 1.15;
      const radius = 1.5 + t * Math.min(36, HUNTERS_SIGHT_RADIUS * 0.55);
      this.sightPulseRingMesh.visible = true;
      this.sightPulseRingMesh.position.set(
        this.playerX,
        groundHeightAt(this.playerX, this.playerZ) + 0.14,
        this.playerZ,
      );
      this.sightPulseRingMesh.scale.setScalar(radius);
      this.sightPulseRingMat.opacity = Math.max(0, (1 - t) * 0.75);
      if (this.sightPulseAnimTimer <= 0) {
        this.sightPulseRingMesh.visible = false;
      }
    }

    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const tr = this.tracks[i];
      tr.age += dt;
      if (tr.age >= TRACK_MAX_AGE) {
        tr.visual.group.parent?.remove(tr.visual.group);
        tr.visual.printMat.dispose();
        tr.visual.glowMat.dispose();
        this.tracks.splice(i, 1);
        continue;
      }
      if (tr.zone === this.activeZone) {
        const alpha = computeTrackVisualAlpha(
          tr.age,
          this.huntersSight.active,
          TRACK_MAX_AGE,
        );
        tr.visual.printMat.opacity = alpha * 0.88;
        tr.visual.glowMat.opacity = this.huntersSight.active
          ? Math.min(0.95, alpha * 1.05)
          : alpha * 0.52;
      }
    }
  }

  private updateAnimals(dt: number): void {
    const zSpec = ZONE_SPECS[this.activeZone];
    let activePredatorAttackers = 0;
    for (const a of this.animals) {
      if (
        a.zone === this.activeZone &&
        SPECIES_SPECS[a.kind].predator &&
        (a.state === 'windup' || a.state === 'lunge')
      ) {
        activePredatorAttackers++;
      }
    }

    const wardRadius =
      this.activeZone === 'level1' ? (this.levels.forge >= 3 ? 19 : 15.5) : 11;
    let bestiaryDirty = false;
    let newlyDiscoveredLabel: string | null = null;

    for (let i = this.animals.length - 1; i >= 0; i--) {
      const a = this.animals[i];
      if (a.zone !== this.activeZone) continue;

      if (a.state === 'ko') {
        a.stateTimer -= dt;
        a.model.group.rotation.z = THREE.MathUtils.damp(
          a.model.group.rotation.z,
          Math.PI / 2,
          14,
          dt,
        );
        if (a.stateTimer <= 0) {
          a.model.group.parent?.remove(a.model.group);
          this.animals.splice(i, 1);
        }
        continue;
      }

      const spec = SPECIES_SPECS[a.kind];
      const dxToPlayer = this.playerX - a.x;
      const dzToPlayer = this.playerZ - a.z;
      const distPlayer = Math.hypot(dxToPlayer, dzToPlayer);
      const distHearth = Math.hypot(a.x - zSpec.hearthX, a.z - zSpec.hearthZ);
      let forcedYaw: number | null = null;

      // Bestiary discovery when player spots wildlife within sightline
      if (distPlayer <= 16.5 && !this.bestiary[a.kind].discovered) {
        const res = recordAnimalSighting(this.bestiary, a.kind);
        this.bestiary = res.bestiary;
        if (res.newlyDiscovered) {
          bestiaryDirty = true;
          const rarityWord =
            spec.rarity === 'mythic'
              ? 'Mythic '
              : spec.rarity === 'epic'
                ? 'Epic '
                : spec.rarity === 'rare'
                  ? 'Rare '
                  : spec.rarity === 'uncommon'
                    ? 'Uncommon '
                    : '';
          newlyDiscoveredLabel = `${rarityWord}${spec.label}`;
        }
      }

      // Distinct sensory & movement-reactive behavior policies per species
      const timeProfile = computeWildlifeTimeProfile(this.timeOfDay, a.kind);
      if (!spec.predator) {
        const res = evaluatePreyReaction({
          kind: a.kind,
          state: a.state,
          stateTimer: a.stateTimer,
          distPlayer,
          playerSpeed: this.playerSpeed,
          weather: this.weather,
          timeOfDay: this.timeOfDay,
          dxToPlayer,
          dzToPlayer,
          wanderAngle: a.wanderAngle,
          dt,
        });
        a.state = res.state;
        a.stateTimer = res.stateTimer;
        a.wanderAngle = res.wanderAngle;
        a.vx = res.vx;
        a.vz = res.vz;
        forcedYaw = res.facingYaw;
      } else {
        // Predators (Timber Wolf, Snow Lynx, Arctic Polar Bear, Elder Woolly Mammoth, Sabertooth, Aurora Fenrir)
        const predRadii = computeEffectiveRadii(
          spec,
          this.playerSpeed,
          this.weather,
          this.timeOfDay,
        );
        const playerHearthDist = Math.hypot(
          this.playerX - zSpec.hearthX,
          this.playerZ - zSpec.hearthZ,
        );
        const playerSafeInCamp =
          playerHearthDist < wardRadius ||
          (this.activeZone === 'level1' && this.stormShelter.shielded);
        if (playerSafeInCamp && a.state !== 'wander') {
          a.state = 'wander';
          if (a.model.telegraphRing) a.model.telegraphRing.visible = false;
          if (a.model.attackSlashMesh) a.model.attackSlashMesh.visible = false;
        }

        const strikeRange =
          a.kind === 'mammoth'
            ? 5.6
            : a.kind === 'aurora_fenrir'
              ? 5.3
              : a.kind === 'polar_bear'
                ? 5.0
                : a.kind === 'sabertooth'
                  ? 4.8
                  : 4.5;
        const hitDist =
          a.kind === 'mammoth'
            ? 2.15
            : a.kind === 'aurora_fenrir' || a.kind === 'polar_bear'
              ? 1.75
              : 1.4;
        const lungeDur = a.kind === 'mammoth' ? 0.36 : 0.28;

        if (a.state === 'windup') {
          a.stateTimer -= dt;
          a.vx = 0;
          a.vz = 0;
          forcedYaw = Math.atan2(dxToPlayer, dzToPlayer);
          if (a.model.attackSlashMesh) a.model.attackSlashMesh.visible = false;
          if (a.model.telegraphRing) {
            a.model.telegraphRing.visible = true;
            const pulse = 1 + (spec.windupDuration * timeProfile.windupScale - a.stateTimer) * 1.05;
            a.model.telegraphRing.scale.set(pulse, pulse, 1);
          }
          if (a.stateTimer <= 0) {
            a.state = 'lunge';
            a.stateTimer = lungeDur;
            const d = distPlayer || 1;
            a.vx = (dxToPlayer / d) * spec.lungeSpeed;
            a.vz = (dzToPlayer / d) * spec.lungeSpeed;
            if (a.model.telegraphRing) a.model.telegraphRing.visible = false;
            this.audio.playAnimalAttack(a.kind, a.x, a.z);
          }
        } else if (a.state === 'lunge') {
          a.stateTimer -= dt;
          if (a.model.attackSlashMesh) {
            const p = clamp(1 - a.stateTimer / lungeDur, 0, 1);
            a.model.attackSlashMesh.visible = true;
            a.model.attackSlashMesh.rotation.z = -0.9 + p * 1.8;
            (a.model.attackSlashMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
              0.1,
              (1 - p) * 0.85,
            );
          }
          if (distPlayer < hitDist && this.hurtFlashTimer <= 0) {
            this.damagePlayer(Math.round(spec.lungeDamage * zSpec.enemyDamageMult));
            a.stateTimer = 0;
          }
          if (a.stateTimer <= 0) {
            if (a.model.attackSlashMesh) a.model.attackSlashMesh.visible = false;
            a.state = 'stalk';
            a.stateTimer = 0.9;
          }
        } else if (
          !playerSafeInCamp &&
          distPlayer < predRadii.detectRadius &&
          distHearth > wardRadius - 1
        ) {
          if (a.model.attackSlashMesh) a.model.attackSlashMesh.visible = false;
          a.state = 'stalk';
          const d = distPlayer || 1;
          const stalkSpd = spec.stalkSpeed * timeProfile.stalkSpeedScale;
          a.vx = (dxToPlayer / d) * stalkSpd;
          a.vz = (dzToPlayer / d) * stalkSpd;
          if (distPlayer < strikeRange && activePredatorAttackers < 2) {
            a.state = 'windup';
            a.stateTimer = spec.windupDuration * timeProfile.windupScale;
            activePredatorAttackers++;
            this.audio.playAnimalWindup(a.kind, a.x, a.z);
          }
        } else {
          if (a.model.telegraphRing) a.model.telegraphRing.visible = false;
          if (a.model.attackSlashMesh) a.model.attackSlashMesh.visible = false;
          a.state = 'wander';
          a.stateTimer -= dt;
          if (a.stateTimer <= 0) {
            a.stateTimer = 2 + Math.random() * 2;
            a.wanderAngle += (Math.random() - 0.5) * 1.9;
          }
          if (distHearth < wardRadius + 2) {
            a.wanderAngle = Math.atan2(a.x - zSpec.hearthX, a.z - zSpec.hearthZ);
          }
          const wanderSpd = spec.wanderSpeed * timeProfile.speedScale;
          a.vx = Math.sin(a.wanderAngle) * wanderSpd;
          a.vz = Math.cos(a.wanderAngle) * wanderSpd;
        }
      }

      a.x += a.vx * dt;
      a.z += a.vz * dt;

      // Keep inside active zone perimeter & outside safe hearth circle
      const boundClamped = clampToZoneBounds(a.x, a.z, a.zone, 2.5);
      if (boundClamped.clamped) {
        a.x = boundClamped.x;
        a.z = boundClamped.z;
        a.wanderAngle += Math.PI;
      } else {
        const hx = a.x - zSpec.hearthX;
        const hz = a.z - zSpec.hearthZ;
        const rHearth = Math.hypot(hx, hz);
        const minHearthDist = this.activeZone === 'level1' ? 15.5 : 11.5;
        if (rHearth < minHearthDist) {
          const s = minHearthDist / (rHearth || 1);
          a.x = zSpec.hearthX + hx * s;
          a.z = zSpec.hearthZ + hz * s;
          a.wanderAngle = Math.atan2(hx, hz);
        }
      }

      const spd = Math.hypot(a.vx, a.vz);
      const prevYaw = a.yaw;
      const turnRate =
        a.kind === 'mammoth'
          ? 5.5
          : a.kind === 'musk_ox'
            ? 6.2
            : a.kind === 'polar_bear'
              ? 7.5
              : 13.0;
      if (forcedYaw !== null) {
        a.yaw = dampAngle(prevYaw, forcedYaw, a.state === 'windup' ? turnRate * 1.3 : turnRate, dt);
      } else if (spd > 0.25) {
        a.yaw = dampAngle(prevYaw, Math.atan2(a.vx, a.vz), turnRate, dt);
      }

      const yawVel = angleDiff(prevYaw, a.yaw) / Math.max(0.001, dt);
      const targetRoll = clamp(-yawVel * 0.025 * Math.min(1, spd / 3), -0.14, 0.14);
      a.model.bodyGroup.rotation.z = dampScalar(a.model.bodyGroup.rotation.z, targetRoll, 10, dt);

      const strideMult =
        a.kind === 'mammoth'
          ? 1.45
          : a.kind === 'musk_ox'
            ? 1.6
            : a.kind === 'polar_bear'
              ? 1.75
              : a.kind === 'hare'
                ? 2.85
                : 2.2;
      a.walkPhase += spd * dt * strideMult;

      const gPose = computeQuadrupedGait({
        kind: a.kind,
        state: a.state,
        walkPhase: a.walkPhase,
        speed: spd,
        maxWanderSpeed: spec.wanderSpeed,
        time: this.totalTime,
        animalId: a.id,
      });

      for (let j = 0; j < 4; j++) {
        if (a.model.legs[j]) {
          a.model.legs[j].rotation.x = gPose.legUpperX[j];
        }
        if (a.model.lowerLegs[j]) {
          const baseX = (a.model.lowerLegs[j].userData.baseRotX as number | undefined) ?? 0;
          a.model.lowerLegs[j].rotation.x = baseX + gPose.legLowerX[j];
        }
      }
      a.model.bodyGroup.position.y = gPose.bodyY;
      a.model.spinePivot.rotation.x = gPose.spinePitchX;
      a.model.spinePivot.rotation.z = gPose.spineRollZ ?? 0;
      if (a.model.headGroup) {
        a.model.headGroup.rotation.set(gPose.headPitchX, gPose.headYawY, 0);
        for (const ch of a.model.headGroup.children) {
          if (ch.userData.animalBreathPuff) {
            const breathPhase = (this.totalTime * (spd > 0.5 ? 3.2 : 1.5) + a.id * 0.9) % 1;
            const bScale = 0.65 + Math.sin(breathPhase * Math.PI) * 0.75;
            ch.scale.set(bScale, bScale * 0.72, bScale * 1.45);
          }
        }
      }
      for (let e = 0; e < a.model.earPivots.length; e++) {
        const ear = a.model.earPivots[e];
        const baseX = (ear.userData.baseRotX as number | undefined) ?? 0;
        ear.rotation.x = baseX + gPose.earPitchX;
      }
      if (a.model.tailPivot) {
        a.model.tailPivot.rotation.set(gPose.tailPitchX, gPose.tailYawY, 0);
      }
      if (a.model.trunkPivot) {
        a.model.trunkPivot.rotation.x = gPose.trunkPitchX;
      }

      if (a.model.alertMarker) {
        if (a.state === 'alert' || a.state === 'curious') {
          a.model.alertMarker.visible = true;
          const markerMat = a.model.alertMarker.material as THREE.MeshBasicMaterial;
          markerMat.color.setHex(a.state === 'curious' ? 0x64d2ff : 0xf6c344);
          a.model.alertMarker.rotation.y += dt * 3.5;
          const baseH =
            a.kind === 'mammoth'
              ? 3.15
              : a.kind === 'frost_stag'
                ? 3.1
                : a.kind === 'stag'
                  ? 2.68
                  : a.kind === 'polar_bear' || a.kind === 'aurora_fenrir'
                    ? 2.05
                    : a.kind === 'musk_ox'
                      ? 1.92
                      : a.kind === 'sabertooth'
                        ? 1.72
                        : a.kind === 'wolf'
                          ? 1.54
                          : a.kind === 'lynx'
                            ? 1.38
                            : a.kind === 'fox'
                              ? 1.32
                              : 1.12;
          a.model.alertMarker.position.y = baseH + Math.sin(this.totalTime * 6 + a.id) * 0.08;
        } else {
          a.model.alertMarker.visible = false;
        }
      }

      if (a.flashTimer > 0) {
        a.flashTimer -= dt;
        a.model.bodyGroup.scale.set(1.14, 0.86, 1.14);
      } else {
        a.model.bodyGroup.scale.set(1, 1, 1);
      }

      if (a.model.sightBeacon) {
        const beaconVisible =
          this.huntersSight.active || this.trackedAnimalId === a.id;
        a.model.sightBeacon.group.visible = beaconVisible;
        if (beaconVisible) {
          const pulse = 1 + Math.sin(this.totalTime * 4.5 + a.id) * 0.1;
          a.model.sightBeacon.ring.scale.setScalar(pulse);
          a.model.sightBeacon.diamond.rotation.y += dt * 2.4;
          a.model.sightBeacon.diamond.position.y =
            a.model.sightBeacon.baseY +
            Math.sin(this.totalTime * 4 + a.id) * 0.14;
        }
      }

      if (spd > 0.45 && Math.hypot(a.x - a.lastTrackX, a.z - a.lastTrackZ) >= MIN_TRACK_DROP_DIST) {
        a.lastTrackX = a.x;
        a.lastTrackZ = a.z;
        this.spawnTrackDecal(a.zone, a.kind, a.id, a.x, a.z, a.yaw);
      }

      a.model.group.position.set(a.x, groundHeightAt(a.x, a.z), a.z);
      a.model.group.rotation.y = a.yaw;
    }

    if (bestiaryDirty) {
      this.persistBestiary();
      if (newlyDiscoveredLabel) {
        this.showToast(`Bestiary Entry Unlocked: ${newlyDiscoveredLabel} ([B])`);
      }
      this.emitHudSnapshot();
    }
  }

  private damagePlayer(dmg: number): void {
    this.hp = Math.max(0, this.hp - dmg);
    this.hurtFlashTimer = 0.25;
    this.trauma = Math.min(0.85, this.trauma + 0.45);
    this.hitstopTimer = 0.04;
    this.audio.playHurt();
    this.particles.spawnBurst(
      this.playerX,
      groundHeightAt(this.playerX, this.playerZ) + 1.0,
      this.playerZ,
      0xff5c48,
      12,
      4.8,
      1.0,
      3.5,
    );

    if (this.hp <= 0) {
      this.victory = false;
      this.audio.playDefeat();
      this.setPhase('gameover');
    } else {
      this.emitHudSnapshot();
    }
  }

  private updateArrows(dt: number): void {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arr = this.arrows[i];
      arr.life -= dt;
      arr.vy -= 4.5 * dt;
      arr.x += arr.vx * dt;
      arr.y += arr.vy * dt;
      arr.z += arr.vz * dt;
      arr.mesh.position.set(arr.x, arr.y, arr.z);

      let remove = arr.life <= 0 || arr.y < groundHeightAt(arr.x, arr.z);

      if (!remove) {
        for (const animal of this.animals) {
          if (animal.zone !== arr.zone || animal.state === 'ko') continue;
          const dist = Math.hypot(arr.x - animal.x, arr.z - animal.z);
          const hitRadius =
            animal.kind === 'mammoth'
              ? 1.75
              : animal.kind === 'polar_bear' || animal.kind === 'musk_ox'
                ? 1.45
                : animal.kind === 'aurora_fenrir'
                  ? 1.35
                  : animal.kind === 'stag' ||
                      animal.kind === 'frost_stag' ||
                      animal.kind === 'sabertooth'
                    ? 1.25
                    : 1.1;
          if (dist < hitRadius) {
            this.damageAnimal(animal, arr.damage, arr.vx, arr.vz, false);
            remove = true;
            break;
          }
        }
      }

      if (!remove) {
        for (const hunter of this.rivalHunters) {
          if (hunter.zone !== arr.zone || hunter.state === 'ko') continue;
          const dist = Math.hypot(arr.x - hunter.x, arr.z - hunter.z);
          if (dist < 1.25) {
            this.damageRivalHunter(hunter, arr.damage, arr.vx, arr.vz, false);
            remove = true;
            break;
          }
        }
      }

      if (!remove) {
        for (const boss of this.zoneBosses) {
          if (boss.zone !== arr.zone || boss.state === 'ko') continue;
          const dist = Math.hypot(arr.x - boss.x, arr.z - boss.z);
          if (dist < 1.95) {
            this.damageZoneBoss(boss, arr.damage, arr.vx, arr.vz, false);
            remove = true;
            break;
          }
        }
      }

      if (remove) {
        arr.mesh.parent?.remove(arr.mesh);
        this.arrows.splice(i, 1);
      }
    }
  }

  private spawnEnemyFrostBolt(
    hunter: RivalHunterEntity,
    targetX: number,
    targetZ: number,
    damage: number,
    warmthDrain: number,
  ): void {
    const arch = RIVAL_HUNTER_ARCHETYPES[hunter.archetypeId];
    const startY = groundHeightAt(hunter.x, hunter.z) + 1.45;
    const targetY = groundHeightAt(targetX, targetZ) + 1.1;
    const dx = targetX - hunter.x;
    const dy = targetY - startY;
    const dz = targetZ - hunter.z;
    const dist = Math.hypot(dx, dy, dz) || 1;
    const speed = 18.5;

    const boltMesh = new THREE.Mesh(this.enemyBoltGeo, this.enemyBoltMat);
    boltMesh.scale.set(0.85, 1.8, 0.85);
    boltMesh.position.set(hunter.x, startY, hunter.z);
    boltMesh.lookAt(targetX, targetY, targetZ);
    boltMesh.rotateX(Math.PI / 2);
    this.getZoneGroup(hunter.zone).add(boltMesh);

    this.enemyBolts.push({
      zone: hunter.zone,
      sourceName: arch.name,
      x: hunter.x,
      y: startY,
      z: hunter.z,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      vz: (dz / dist) * speed,
      damage,
      warmthDrain,
      life: 1.5,
      mesh: boltMesh,
    });
    this.audio.playBowTwang(5);
  }

  private updateEnemyBolts(dt: number): void {
    for (let i = this.enemyBolts.length - 1; i >= 0; i--) {
      const b = this.enemyBolts[i];
      if (b.zone !== this.activeZone) {
        b.mesh.parent?.remove(b.mesh);
        this.enemyBolts.splice(i, 1);
        continue;
      }
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.y += dt * 10;

      let remove = b.life <= 0 || b.y < groundHeightAt(b.x, b.z);
      if (!remove) {
        const dPlayer = Math.hypot(b.x - this.playerX, b.z - this.playerZ);
        if (dPlayer < 0.95) {
          this.damagePlayer(b.damage);
          if (b.warmthDrain > 0) {
            this.warmth = Math.max(0, this.warmth - b.warmthDrain);
          }
          this.particles.spawnBurst(b.x, b.y, b.z, 0x67e8f9, 14, 4.6, 0.95, 2.8);
          this.showToast(
            `${b.sourceName} struck you with a Frost Lance (-${b.damage} HP, -${b.warmthDrain}% Warmth)!`,
          );
          this.emitHudSnapshot();
          remove = true;
        }
      }
      if (remove) {
        b.mesh.parent?.remove(b.mesh);
        this.enemyBolts.splice(i, 1);
      }
    }
  }

  private clearAllBossHazards(): void {
    for (const hz of this.bossHazards) {
      hz.group.parent?.remove(hz.group);
      (hz.fillMesh.material as THREE.Material).dispose();
      (hz.ringMesh.material as THREE.Material).dispose();
    }
    this.bossHazards.length = 0;
  }

  private populateZoneBosses(): void {
    for (const boss of this.zoneBosses) {
      boss.model.group.parent?.remove(boss.model.group);
    }
    this.zoneBosses.length = 0;

    for (const id of ZONE_BOSS_ORDER) {
      const spec = ZONE_BOSS_SPECS[id];
      const model =
        id === 'skarn_colossus' || id === 'ulthar_behemoth'
          ? createTimberColossusModel(this.palette)
          : id === 'veyra_sovereign' || id === 'astraea_valkyrie'
            ? createCryoSovereignModel(this.palette)
            : createCavernWardenModel(this.palette);
      if (id === 'ulthar_behemoth') {
        model.group.scale.setScalar(1.18);
      } else if (id === 'astraea_valkyrie') {
        model.group.scale.setScalar(1.16);
      } else if (id === 'malakor_gargoyle') {
        model.group.scale.setScalar(1.1);
      }
      const gy = groundHeightAt(spec.arenaX, spec.arenaZ);
      const yaw = spec.zone === 'city' ? -Math.PI / 2 : 0;
      model.group.position.set(spec.arenaX, gy, spec.arenaZ);
      model.group.rotation.y = yaw;
      this.getZoneGroup(spec.zone).add(model.group);

      this.zoneBosses.push({
        id,
        spec,
        zone: spec.zone,
        x: spec.arenaX,
        z: spec.arenaZ,
        vx: 0,
        vz: 0,
        yaw,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        enraged: false,
        enrageAnnounced: false,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: this.initialBossShowcase ? 0.15 : 1.4,
        patternIndex: 0,
        activePattern: null,
        telegraphDuration: 0,
        chargeDirX: 0,
        chargeDirZ: 1,
        targetX: spec.arenaX,
        targetZ: spec.arenaZ,
        respawnTimer: 0,
        flashTimer: 0,
        walkPhase: 0,
        strafeSign: id === 'veyra_sovereign' || id === 'ulthar_behemoth' ? -1 : 1,
        strafeFlipTimer: 2.4,
        strideSpeed: 0,
        tacticLabel: 'Arena Patrol',
        model,
      });
    }
  }

  private damageZoneBoss(
    boss: ZoneBossEntity,
    dmg: number,
    dirX: number,
    dirZ: number,
    isAxe: boolean,
  ): void {
    if (boss.state === 'ko' || boss.hp <= 0) return;

    boss.hp = Math.max(0, boss.hp - dmg);
    boss.flashTimer = 0.14;
    boss.model.coreMat.emissiveIntensity = 3.2;

    const gy = groundHeightAt(boss.x, boss.z);
    this.particles.spawnBurst(
      boss.x,
      gy + 2.0,
      boss.z,
      boss.spec.accentColorHex,
      isAxe ? 16 : 12,
      5.2,
      1.1,
      4.0,
    );
    if (isAxe) {
      this.audio.playHit();
    }

    // Slight poise nudge on hit
    const norm = Math.hypot(dirX, dirZ) || 1;
    if (boss.state === 'idle') {
      boss.state = 'engage';
    }
    const nextX = boss.x + (dirX / norm) * 0.18;
    const nextZ = boss.z + (dirZ / norm) * 0.18;
    const bounded = computeArenaContainment(nextX, nextZ, boss.spec);
    boss.x = bounded.x;
    boss.z = bounded.z;

    if (!boss.enraged && isBossEnraged(boss.hp, boss.maxHp)) {
      boss.enraged = true;
      boss.model.auraRingMat.color.setHex(0xef4444);
      boss.model.auraRingMat.opacity = 0.78;
      if (!boss.enrageAnnounced) {
        boss.enrageAnnounced = true;
        this.audio.playBossTelegraph(boss.id, true, boss.x, boss.z);
        this.particles.spawnBurst(
          boss.x,
          gy + 2.2,
          boss.z,
          0xef4444,
          28,
          6.8,
          1.3,
          4.8,
        );
        this.trauma = Math.min(0.65, this.trauma + 0.25);
        this.showToast(`PHASE II ENRAGE: ${boss.spec.name} unleashes full fury!`);
      }
    }

    if (boss.hp <= 0) {
      boss.state = 'ko';
      boss.stateTimer = 1.6;
      boss.respawnTimer = boss.spec.respawnSeconds;
      boss.activePattern = null;
      boss.model.telegraphGroup.visible = false;
      this.audio.playBossVictoryFanfare();
      this.hitstopTimer = 0.06;
      this.trauma = Math.min(0.85, this.trauma + 0.35);

      const lootCtx = this.getLootScalingContext(boss.zone);
      const loot = computeBossLootReward(boss.spec, lootCtx);
      const dropY = groundHeightAt(boss.x, boss.z) + 0.55;
      this.spawnPickup('gold', loot.resourcesDelta.gold, boss.x, dropY, boss.z, boss.zone);
      this.spawnPickup('wood', loot.resourcesDelta.wood, boss.x - 1.1, dropY, boss.z + 0.5, boss.zone);
      this.spawnPickup('stone', loot.resourcesDelta.stone ?? 0, boss.x + 1.1, dropY, boss.z + 0.5, boss.zone);
      this.spawnPickup('pelt', loot.resourcesDelta.pelts, boss.x - 0.8, dropY, boss.z - 1.0, boss.zone);
      this.spawnPickup('meat', loot.resourcesDelta.meat ?? 0, boss.x + 0.8, dropY, boss.z - 1.0, boss.zone);
      if ((loot.resourcesDelta.ice ?? 0) > 0) {
        this.spawnPickup('ice', loot.resourcesDelta.ice ?? 0, boss.x, dropY + 0.2, boss.z + 1.2, boss.zone);
      }

      // Grant weighted high-tier backpack loot directly (with Coin fallback if backpack pouch full)
      const maxItems = this.getBackpackMaxItems();
      const grantedLabels: string[] = [];
      let fallbackGold = 0;
      for (const itemDrop of loot.items) {
        const used = countBackpackItems(this.backpackInventory);
        const room = Math.max(0, maxItems - used);
        const added = Math.min(room, itemDrop.qty);
        if (added > 0) {
          this.backpackInventory = {
            ...this.backpackInventory,
            [itemDrop.id]: (this.backpackInventory[itemDrop.id] ?? 0) + added,
          };
          const rec = getCraftRecipe(itemDrop.id);
          grantedLabels.push(`${added}x ${rec.name} (${itemDrop.rarity.toUpperCase()})`);
        }
        if (added < itemDrop.qty) {
          fallbackGold += (itemDrop.qty - added) * 45;
        }
      }
      if (fallbackGold > 0) {
        this.resources.gold += fallbackGold;
        this.recordGoldEarned(fallbackGold);
      }

      this.lastLootRoll = {
        source: 'boss',
        sourceLabel: boss.spec.name,
        zone: boss.zone,
        gearLevel: loot.effectiveGearLevel,
        tierLabel: loot.lootTierLabel,
        resourceMultiplier: loot.resourceMultiplier,
        gold: loot.resourcesDelta.gold + fallbackGold,
        items: loot.items.map((itemDrop) => ({
          id: itemDrop.id,
          name: getCraftRecipe(itemDrop.id).name,
          qty: itemDrop.qty,
          rarity: itemDrop.rarity,
        })),
      };

      this.stats.bossesSlain = (this.stats.bossesSlain ?? 0) + 1;
      const zSpec = ZONE_SPECS[boss.zone];
      this.awardSkillXp('hunting', Math.round(loot.huntingXp * zSpec.xpMult));
      this.advanceObjectiveMetric('wolvesSlain', 2);
      this.particles.spawnBurst(boss.x, gy + 1.8, boss.z, 0xf6c344, 34, 7.2, 1.4, 5.2);
      const packSummary =
        grantedLabels.length > 0 ? ` + ${grantedLabels.join(', ')}` : '';
      this.showToast(
        `BOSS VANQUISHED: ${boss.spec.name} (${loot.lootTierLabel})! +${loot.resourcesDelta.gold}g Spoils${packSummary}`,
      );
      this.emitHudSnapshot();
    } else {
      this.emitHudSnapshot();
    }
  }

  private spawnBossProjectile(
    boss: ZoneBossEntity,
    angleYaw: number,
    pattern: BossAttackPatternSpec,
  ): void {
    const startY = groundHeightAt(boss.x, boss.z) + 2.15;
    const speed = pattern.projectileSpeed * (boss.enraged ? 1.15 : 1.0);
    const dmg = Math.round(pattern.damage * (boss.enraged ? boss.spec.enrageDamageMult : 1.0));
    const mat = boss.model.coreMat;
    const mesh = new THREE.Mesh(this.bossOrbGeo, mat);
    mesh.position.set(boss.x, startY, boss.z);
    this.getZoneGroup(boss.zone).add(mesh);

    this.bossProjectiles.push({
      zone: boss.zone,
      bossId: boss.id,
      sourceName: boss.spec.name,
      x: boss.x,
      y: startY,
      z: boss.z,
      vx: Math.sin(angleYaw) * speed,
      vy: 0,
      vz: Math.cos(angleYaw) * speed,
      damage: dmg,
      warmthDrain: pattern.warmthDrain,
      life: 2.3,
      mesh,
    });
  }

  private spawnBossHazardZone(
    boss: ZoneBossEntity,
    x: number,
    z: number,
    radius: number,
    duration: number,
    damage: number,
    warmthDrain: number,
    colorHex: number,
  ): void {
    const gy = groundHeightAt(x, z) + 0.16;
    const group = new THREE.Group();
    group.position.set(x, gy, z);

    const fillMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const fillMesh = new THREE.Mesh(this.bossHazardFillGeo, fillMat);
    fillMesh.scale.setScalar(0.12);

    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
    });
    const ringMesh = new THREE.Mesh(this.bossHazardRingGeo, ringMat);
    ringMesh.scale.setScalar(radius);

    group.add(fillMesh, ringMesh);
    this.getZoneGroup(boss.zone).add(group);

    this.bossHazards.push({
      zone: boss.zone,
      bossId: boss.id,
      sourceName: boss.spec.name,
      x,
      z,
      radius,
      timer: duration,
      duration,
      damage,
      warmthDrain,
      colorHex,
      group,
      fillMesh,
      ringMesh,
    });
  }

  private executeBossPatternImpact(
    boss: ZoneBossEntity,
    pattern: BossAttackPatternSpec,
  ): void {
    const dmg = Math.round(pattern.damage * (boss.enraged ? boss.spec.enrageDamageMult : 1.0));
    const radius = boss.enraged ? pattern.enragedRadius : pattern.radius;
    const distToPlayer = Math.hypot(this.playerX - boss.x, this.playerZ - boss.z);
    const gy = groundHeightAt(boss.x, boss.z);

    if (pattern.kind === 'aoe') {
      this.audio.playBossImpact(boss.id, true, boss.x, boss.z);
      this.trauma = Math.min(0.75, this.trauma + 0.34);
      this.particles.spawnBurst(
        boss.x,
        gy + 0.65,
        boss.z,
        pattern.telegraphColorHex,
        28,
        7.5,
        1.25,
        4.6,
      );
      if (distToPlayer <= radius) {
        this.damagePlayer(dmg);
        if (pattern.warmthDrain > 0) {
          this.warmth = Math.max(0, this.warmth - pattern.warmthDrain);
        }
        const pushNorm = distToPlayer || 1;
        this.playerVx += ((this.playerX - boss.x) / pushNorm) * 7.5;
        this.playerVz += ((this.playerZ - boss.z) / pushNorm) * 7.5;
        this.showToast(`${boss.spec.name} struck you with ${pattern.label} (-${dmg} HP)!`);
      }
      boss.state = 'recover';
      boss.stateTimer = 0.72;
      return;
    }

    if (pattern.kind === 'projectile_fan') {
      const count = boss.enraged ? pattern.enragedProjectileCount : pattern.projectileCount;
      const aimYaw = Math.atan2(this.playerX - boss.x, this.playerZ - boss.z);
      boss.yaw = aimYaw;
      this.audio.playBossImpact(boss.id, false, boss.x, boss.z);
      const fullCircle = pattern.projectileSpreadRad >= Math.PI * 1.95;
      for (let i = 0; i < count; i++) {
        const angle = fullCircle
          ? aimYaw + (i / count) * Math.PI * 2
          : aimYaw + (count <= 1 ? 0 : (i / (count - 1) - 0.5) * pattern.projectileSpreadRad);
        this.spawnBossProjectile(boss, angle, pattern);
      }
      boss.state = 'recover';
      boss.stateTimer = 0.6;
      return;
    }

    if (pattern.kind === 'meteor') {
      const count = boss.enraged ? pattern.enragedProjectileCount : pattern.projectileCount;
      const targets = rollMeteorTargets(this.playerX, this.playerZ, count, boss.spec);
      this.audio.playBossTelegraph(boss.id, true, boss.x, boss.z);
      for (const pt of targets) {
        this.spawnBossHazardZone(
          boss,
          pt.x,
          pt.z,
          radius,
          0.95,
          dmg,
          pattern.warmthDrain,
          pattern.telegraphColorHex,
        );
      }
      boss.state = 'recover';
      boss.stateTimer = 0.85;
      return;
    }

    if (pattern.kind === 'cross_eruption' || pattern.kind === 'ring_wave') {
      const points = rollTacticalAoEPatternPoints(
        pattern.kind,
        boss.x,
        boss.z,
        this.playerX,
        this.playerZ,
        boss.enraged,
        boss.spec,
      );
      this.audio.playBossImpact(boss.id, true, boss.x, boss.z);
      this.trauma = Math.min(0.78, this.trauma + 0.32);
      this.particles.spawnBurst(
        boss.x,
        gy + 0.85,
        boss.z,
        pattern.telegraphColorHex,
        26,
        7.2,
        1.2,
        4.5,
      );
      for (const pt of points) {
        this.spawnBossHazardZone(
          boss,
          pt.x,
          pt.z,
          radius * pt.radiusScale,
          0.92,
          dmg,
          pattern.warmthDrain,
          pattern.telegraphColorHex,
        );
      }
      this.pushChatLog(
        'combat',
        `${boss.spec.name} unleashed ${pattern.label} (${points.length} AoE hazard zones)!`,
        'amber',
      );
      boss.state = 'recover';
      boss.stateTimer = 0.78;
      return;
    }

    if (pattern.kind === 'charge' || pattern.kind === 'leap') {
      // Lead player's velocity slightly on charge/leap for tactical precision
      const leadX = this.playerX + this.playerVx * 0.28;
      const leadZ = this.playerZ + this.playerVz * 0.28;
      const dx = leadX - boss.x;
      const dz = leadZ - boss.z;
      const norm = Math.hypot(dx, dz) || 1;
      boss.chargeDirX = dx / norm;
      boss.chargeDirZ = dz / norm;
      boss.yaw = Math.atan2(boss.chargeDirX, boss.chargeDirZ);
      boss.targetX = leadX;
      boss.targetZ = leadZ;
      boss.state = 'attack';
      boss.stateTimer = pattern.kind === 'leap' ? 0.48 : 0.42;
      this.audio.playBossImpact(boss.id, false, boss.x, boss.z);
    }
  }

  private updateZoneBosses(dt: number): void {
    for (const boss of this.zoneBosses) {
      if (boss.zone !== this.activeZone) continue;

      if (boss.flashTimer > 0) {
        boss.flashTimer = Math.max(0, boss.flashTimer - dt);
        if (boss.flashTimer === 0) {
          boss.model.coreMat.emissiveIntensity = boss.enraged ? 2.1 : 1.5;
        }
      }

      if (boss.state === 'ko') {
        boss.strideSpeed = 0;
        boss.tacticLabel = 'Vanquished';
        if (boss.stateTimer > 0) {
          boss.stateTimer = Math.max(0, boss.stateTimer - dt);
          boss.model.bodyPivot.rotation.x = THREE.MathUtils.damp(
            boss.model.bodyPivot.rotation.x,
            -Math.PI / 2.2,
            7,
            dt,
          );
        }
        boss.respawnTimer -= dt;
        if (boss.respawnTimer <= 0) {
          boss.hp = boss.maxHp;
          boss.enraged = false;
          boss.enrageAnnounced = false;
          boss.state = 'idle';
          boss.tacticLabel = 'Arena Patrol';
          boss.x = boss.spec.arenaX;
          boss.z = boss.spec.arenaZ;
          boss.model.bodyPivot.rotation.x = 0;
          boss.model.bodyPivot.rotation.z = 0;
          boss.model.auraRingMat.color.setHex(boss.spec.accentColorHex);
          boss.model.auraRingMat.opacity = 0.46;
          boss.model.group.visible = true;
          this.showToast(`${boss.spec.name} has awakened again in ${boss.spec.arenaName}!`);
          this.emitHudSnapshot();
        } else {
          boss.model.group.visible = boss.stateTimer > 0;
        }
        continue;
      }

      boss.model.group.visible = true;

      const dx = this.playerX - boss.x;
      const dz = this.playerZ - boss.z;
      const distToPlayer = Math.hypot(dx, dz);
      const distPlayerArena = Math.hypot(
        this.playerX - boss.spec.arenaX,
        this.playerZ - boss.spec.arenaZ,
      );
      const desiredYaw = Math.atan2(dx, dz);

      if (boss.attackCooldown > 0) {
        boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
      }

      boss.strafeFlipTimer -= dt;
      if (boss.strafeFlipTimer <= 0) {
        boss.strafeSign = boss.strafeSign === 1 ? -1 : 1;
        boss.strafeFlipTimer = 2.1 + (boss.patternIndex % 3) * 0.65;
      }

      if (boss.state === 'idle') {
        boss.model.telegraphGroup.visible = false;
        boss.tacticLabel = 'Arena Patrol';
        // Drift calmly back to arena heart if displaced
        const homeDx = boss.spec.arenaX - boss.x;
        const homeDz = boss.spec.arenaZ - boss.z;
        const homeDist = Math.hypot(homeDx, homeDz);
        if (homeDist > 1.2) {
          const returnSpd = boss.spec.moveSpeed * 0.7;
          boss.x += (homeDx / homeDist) * returnSpd * dt;
          boss.z += (homeDz / homeDist) * returnSpd * dt;
          boss.yaw = dampAngle(boss.yaw, Math.atan2(homeDx, homeDz), 6, dt);
          boss.strideSpeed = returnSpd;
          boss.walkPhase += dt * returnSpd * 1.45;
        } else {
          boss.strideSpeed = 0;
          boss.walkPhase += dt * 1.6;
        }
        if (distPlayerArena <= boss.spec.engageRadius) {
          boss.state = 'engage';
          boss.tacticLabel = 'Closing Range';
          this.showToast(`BOSS ENCOUNTER: ${boss.spec.name} — ${boss.spec.title}!`);
          this.emitHudSnapshot();
        }
      } else if (boss.state === 'engage') {
        boss.model.telegraphGroup.visible = false;
        if (distPlayerArena > boss.spec.leashRadius + 4) {
          // Player retreated safely out of the arena; reset boss calmly
          boss.state = 'idle';
          boss.strideSpeed = 0;
          boss.tacticLabel = 'Arena Patrol';
          boss.hp = Math.min(boss.maxHp, boss.hp + boss.maxHp * 0.15);
          boss.enraged = isBossEnraged(boss.hp, boss.maxHp);
          boss.activePattern = null;
          this.emitHudSnapshot();
        } else {
          const tactic = computeBossTacticalMovement({
            spec: boss.spec,
            bossX: boss.x,
            bossZ: boss.z,
            playerX: this.playerX,
            playerZ: this.playerZ,
            playerVx: this.playerVx,
            playerVz: this.playerVz,
            enraged: boss.enraged,
            cooldownLeft: boss.attackCooldown,
            strafeSign: boss.strafeSign,
            animPhase: boss.walkPhase,
          });
          boss.vx = tactic.vx;
          boss.vz = tactic.vz;
          boss.strideSpeed = tactic.strideSpeed;
          boss.tacticLabel = tactic.tacticLabel;
          boss.yaw = dampAngle(boss.yaw, tactic.desiredYaw, 7.5, dt);

          const nextPos = computeArenaContainment(
            boss.x + tactic.vx * dt,
            boss.z + tactic.vz * dt,
            boss.spec,
          );
          boss.x = nextPos.x;
          boss.z = nextPos.z;
          boss.walkPhase += dt * Math.max(1.8, tactic.strideSpeed * 1.55);

          if (boss.attackCooldown <= 0) {
            const pattern = selectNextBossAttack(
              boss.spec,
              distToPlayer,
              boss.enraged,
              boss.patternIndex++,
            );
            boss.activePattern = pattern;
            const windup = pattern.windupSeconds * (boss.enraged ? 0.84 : 1.0);
            boss.telegraphDuration = windup;
            boss.stateTimer = windup;
            boss.state = 'telegraph';
            boss.strideSpeed = 0.4;
            boss.tacticLabel = `Casting ${pattern.label}`;
            this.audio.playBossTelegraph(boss.id, boss.enraged, boss.x, boss.z);
            this.pushChatLog(
              'combat',
              `[Boss] ${boss.spec.name} telegraphs ${pattern.label}!`,
              'amber',
            );
            this.emitHudSnapshot();
          }
        }
      } else if (boss.state === 'telegraph') {
        boss.yaw = dampAngle(boss.yaw, desiredYaw, 5.5, dt);
        boss.stateTimer -= dt;
        boss.strideSpeed = 0.25;
        boss.walkPhase += dt * 3.2;
        const pattern = boss.activePattern;
        if (pattern) {
          boss.tacticLabel = `Casting ${pattern.label}`;
          const progress = clamp(
            1 - boss.stateTimer / Math.max(0.01, boss.telegraphDuration),
            0,
            1,
          );
          const radius = boss.enraged ? pattern.enragedRadius : pattern.radius;
          boss.model.telegraphGroup.visible = true;
          boss.model.telegraphBorderMesh.scale.setScalar(radius);
          boss.model.telegraphFillMesh.scale.setScalar(Math.max(0.15, radius * progress));
          boss.model.telegraphFillMat.color.setHex(pattern.telegraphColorHex);
          boss.model.telegraphBorderMat.color.setHex(
            boss.zone === 'level2' ? 0xe879f9 : 0xef4444,
          );
          boss.model.telegraphFillMat.opacity = 0.28 + progress * 0.36;
        }
        if (boss.stateTimer <= 0) {
          boss.model.telegraphGroup.visible = false;
          if (pattern) {
            boss.attackCooldown =
              pattern.cooldownSeconds * (boss.enraged ? boss.spec.enrageCooldownMult : 1.0);
            this.executeBossPatternImpact(boss, pattern);
          } else {
            boss.state = 'engage';
          }
          this.emitHudSnapshot();
        }
      } else if (boss.state === 'attack') {
        const pattern = boss.activePattern;
        boss.stateTimer -= dt;
        if (pattern && (pattern.kind === 'charge' || pattern.kind === 'leap')) {
          const speed = pattern.chargeSpeed * (boss.enraged ? 1.16 : 1.0);
          boss.strideSpeed = speed;
          boss.tacticLabel = pattern.kind === 'leap' ? 'Aerial Leap Slam' : 'Juggernaut Charge';
          const bounded = computeArenaContainment(
            boss.x + boss.chargeDirX * speed * dt,
            boss.z + boss.chargeDirZ * speed * dt,
            boss.spec,
          );
          boss.x = bounded.x;
          boss.z = bounded.z;
          boss.walkPhase += dt * 15;
          if (boss.stateTimer <= 0) {
            const impactRadius = boss.enraged ? pattern.enragedRadius : pattern.radius;
            const hitDist = Math.hypot(this.playerX - boss.x, this.playerZ - boss.z);
            const dmg = Math.round(
              pattern.damage * (boss.enraged ? boss.spec.enrageDamageMult : 1.0),
            );
            this.audio.playBossImpact(boss.id, true, boss.x, boss.z);
            this.trauma = Math.min(0.75, this.trauma + 0.3);
            this.particles.spawnBurst(
              boss.x,
              groundHeightAt(boss.x, boss.z) + 0.6,
              boss.z,
              pattern.telegraphColorHex,
              24,
              7.0,
              1.1,
              4.4,
            );
            if (hitDist <= impactRadius) {
              this.damagePlayer(dmg);
              this.showToast(`${boss.spec.name} landed ${pattern.label} (-${dmg} HP)!`);
            }
            boss.state = 'recover';
            boss.stateTimer = 0.65;
          }
        } else {
          boss.state = 'recover';
          boss.stateTimer = 0.5;
        }
      } else if (boss.state === 'recover') {
        boss.model.telegraphGroup.visible = false;
        boss.stateTimer -= dt;
        boss.strideSpeed = 0.2;
        boss.tacticLabel = 'Recovering Stance';
        if (boss.stateTimer <= 0) {
          boss.activePattern = null;
          boss.state = 'engage';
        }
      }

      // Articulated Procedural Kinematic Animation (legs, arms, torso pitch/roll, head tracking)
      const gy = groundHeightAt(boss.x, boss.z);
      boss.model.group.position.set(boss.x, gy, boss.z);
      boss.model.group.rotation.y = boss.yaw;
      boss.model.orbitGroup.rotation.y += dt * (boss.enraged ? 3.2 : 1.7);
      boss.model.auraRingMesh.rotation.z += dt * (boss.enraged ? 1.8 : 0.8);

      const pose = computeBossKinematicPose({
        bossId: boss.id,
        state: boss.state,
        attackKind: boss.activePattern?.kind ?? null,
        animPhase: boss.walkPhase,
        strideSpeed: boss.strideSpeed,
        stateTimer: boss.stateTimer,
        windupSeconds: Math.max(0.1, boss.telegraphDuration),
        enraged: boss.enraged,
      });

      const isLeapMidAir =
        boss.state === 'attack' && boss.activePattern?.kind === 'leap';
      const targetBodyY = isLeapMidAir
        ? pose.bodyY + Math.sin(clamp(boss.stateTimer / 0.48, 0, 1) * Math.PI) * 2.4
        : pose.bodyY;

      boss.model.bodyPivot.position.y = THREE.MathUtils.damp(
        boss.model.bodyPivot.position.y,
        targetBodyY,
        12,
        dt,
      );
      boss.model.bodyPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.bodyPivot.rotation.x,
        pose.bodyPitchX,
        10,
        dt,
      );
      boss.model.bodyPivot.rotation.z = THREE.MathUtils.damp(
        boss.model.bodyPivot.rotation.z,
        pose.bodyRollZ,
        10,
        dt,
      );
      boss.model.leftLegPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.leftLegPivot.rotation.x,
        pose.leftLegX,
        14,
        dt,
      );
      boss.model.rightLegPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.rightLegPivot.rotation.x,
        pose.rightLegX,
        14,
        dt,
      );
      boss.model.leftLegPivot.rotation.z = THREE.MathUtils.damp(
        boss.model.leftLegPivot.rotation.z,
        pose.leftLegZ,
        12,
        dt,
      );
      boss.model.rightLegPivot.rotation.z = THREE.MathUtils.damp(
        boss.model.rightLegPivot.rotation.z,
        pose.rightLegZ,
        12,
        dt,
      );
      boss.model.leftArmPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.leftArmPivot.rotation.x,
        pose.leftArmX,
        12,
        dt,
      );
      boss.model.rightArmPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.rightArmPivot.rotation.x,
        pose.rightArmX,
        12,
        dt,
      );
      boss.model.leftArmPivot.rotation.z = THREE.MathUtils.damp(
        boss.model.leftArmPivot.rotation.z,
        pose.leftArmZ,
        10,
        dt,
      );
      boss.model.rightArmPivot.rotation.z = THREE.MathUtils.damp(
        boss.model.rightArmPivot.rotation.z,
        pose.rightArmZ,
        10,
        dt,
      );
      boss.model.headPivot.rotation.y = THREE.MathUtils.damp(
        boss.model.headPivot.rotation.y,
        pose.headYawY,
        10,
        dt,
      );
      boss.model.headPivot.rotation.x = THREE.MathUtils.damp(
        boss.model.headPivot.rotation.x,
        pose.headPitchX,
        10,
        dt,
      );
    }
  }

  private updateBossProjectiles(dt: number): void {
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      if (p.zone !== this.activeZone) {
        p.mesh.parent?.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
        continue;
      }
      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y = groundHeightAt(p.x, p.z) + 1.25;
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.rotation.y += dt * 9;
      p.mesh.rotation.x += dt * 5;

      let remove = p.life <= 0;
      if (!remove && Math.hypot(p.x - this.playerX, p.z - this.playerZ) < 1.1) {
        this.damagePlayer(p.damage);
        if (p.warmthDrain > 0) {
          this.warmth = Math.max(0, this.warmth - p.warmthDrain);
        }
        this.particles.spawnBurst(p.x, p.y, p.z, 0xfbbf24, 14, 4.5, 0.95, 2.8);
        this.showToast(`${p.sourceName} projectile hit (-${p.damage} HP)!`);
        remove = true;
      }
      if (remove) {
        p.mesh.parent?.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  private updateBossHazards(dt: number): void {
    for (let i = this.bossHazards.length - 1; i >= 0; i--) {
      const hz = this.bossHazards[i];
      if (hz.zone !== this.activeZone) {
        hz.group.parent?.remove(hz.group);
        (hz.fillMesh.material as THREE.Material).dispose();
        (hz.ringMesh.material as THREE.Material).dispose();
        this.bossHazards.splice(i, 1);
        continue;
      }

      hz.timer -= dt;
      const progress = clamp(1 - hz.timer / Math.max(0.01, hz.duration), 0, 1);
      hz.fillMesh.scale.setScalar(Math.max(0.12, hz.radius * progress));

      if (hz.timer <= 0) {
        const gy = groundHeightAt(hz.x, hz.z);
        this.audio.playBossImpact(hz.bossId, true, hz.x, hz.z);
        this.particles.spawnBurst(hz.x, gy + 0.85, hz.z, hz.colorHex, 24, 6.8, 1.2, 4.4);
        const hitDist = Math.hypot(this.playerX - hz.x, this.playerZ - hz.z);
        if (hitDist <= hz.radius) {
          this.damagePlayer(hz.damage);
          if (hz.warmthDrain > 0) {
            this.warmth = Math.max(0, this.warmth - hz.warmthDrain);
          }
          this.showToast(`${hz.sourceName} eruption struck (-${hz.damage} HP)!`);
        }
        hz.group.parent?.remove(hz.group);
        (hz.fillMesh.material as THREE.Material).dispose();
        (hz.ringMesh.material as THREE.Material).dispose();
        this.bossHazards.splice(i, 1);
      }
    }
  }

  private spawnRivalHunter(
    zone: ZoneId,
    explicitPos?: { x: number; z: number },
    explicitArchId?: RivalHunterArchetypeId,
  ): RivalHunterEntity {
    const arch = explicitArchId
      ? RIVAL_HUNTER_ARCHETYPES[explicitArchId]
      : pickRivalHunterArchetype(zone, this.cycleDayNumber, Math.random);
    const pos =
      explicitPos ??
      pickRivalHunterSpawnPoint(zone, this.playerX, this.playerZ, Math.random);

    const cloakMat =
      arch.coatKind === 'navy'
        ? this.palette.coatBlueMat
        : arch.coatKind === 'teal'
          ? this.palette.coatGreenMat
          : this.palette.coatRedMat;
    const rig = createCharacterRig(this.palette, cloakMat, true);
    rig.axeGroup.visible = arch.weapon === 'axe';
    rig.bowGroup.visible = arch.weapon === 'bow';
    rig.quiverGroup.visible = arch.weapon === 'bow';
    const weaponTier =
      arch.id === 'frost_berserker' || arch.id === 'aurora_warlock'
        ? 7
        : arch.id === 'shadow_stalker'
          ? 6
          : arch.id === 'raider'
            ? 5
            : 4;
    const gearTier =
      arch.id === 'frost_berserker' || arch.id === 'aurora_warlock'
        ? 5
        : arch.id === 'shadow_stalker'
          ? 4
          : 3;
    updateCharacterEquipmentVisuals(rig, {
      axeLevel: weaponTier,
      bowLevel: weaponTier,
      gearAvgTier: gearTier,
      activeBuffCount: arch.rarity === 'rare' || arch.rarity === 'mythic' ? 2 : 1,
      wingsTier: arch.id === 'shadow_stalker' ? 1 : 0,
      time: 0,
      moveSpeedRatio: 0,
    });

    if (arch.id === 'frost_berserker') {
      applyFrostBerserkerVisuals(rig, this.palette);
    } else if (arch.id === 'aurora_warlock') {
      applyIceWraithVisuals(rig, this.palette);
    }

    const ringRadius = arch.id === 'frost_berserker' ? 1.15 : 0.92;
    const ringGeo = new THREE.RingGeometry(ringRadius, ringRadius + 0.25, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringColor =
      arch.id === 'aurora_warlock'
        ? 0xa855f7
        : arch.id === 'frost_berserker'
          ? 0x38bdf8
          : 0xef4444;
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: arch.rarity === 'rare' || arch.rarity === 'mythic' ? 0.85 : 0.72,
    });
    const threatRing = new THREE.Mesh(ringGeo, ringMat);
    threatRing.position.y = 0.06;
    rig.group.add(threatRing);

    const gy = groundHeightAt(pos.x, pos.z);
    rig.group.position.set(pos.x, gy, pos.z);
    const wanderAngle = Math.random() * Math.PI * 2;
    rig.group.rotation.y = wanderAngle;
    this.getZoneGroup(zone).add(rig.group);

    const zSpec = ZONE_SPECS[zone];
    const scaledHunterHp = Math.round(arch.maxHp * zSpec.enemyHpMult);
    const entity: RivalHunterEntity = {
      id: this.nextHunterId++,
      zone,
      archetypeId: arch.id,
      x: pos.x,
      z: pos.z,
      vx: 0,
      vz: 0,
      yaw: wanderAngle,
      hp: scaledHunterHp,
      maxHp: scaledHunterHp,
      state: 'prowl',
      stateTimer: 2 + Math.random() * 2,
      attackCooldown: 0,
      wanderAngle,
      walkPhase: Math.random() * Math.PI * 2,
      flashTimer: 0,
      stolenBag: createEmptyStolenBag(),
      rig,
      threatRing,
    };
    this.rivalHunters.push(entity);
    return entity;
  }

  private populateRivalHunters(): void {
    for (const h of this.rivalHunters) {
      h.rig.group.parent?.remove(h.rig.group);
    }
    this.rivalHunters.length = 0;

    // Spawn baseline Rival Rogue Hunters across all 5 wilderness zones
    const explicitNearHunter: RivalHunterArchetypeId =
      typeof this.initialHunterNear === 'string' ? this.initialHunterNear : 'poacher';
    this.spawnRivalHunter(
      'level1',
      this.initialHunterNear ? { x: 9.2, z: 16.2 } : undefined,
      explicitNearHunter,
    );
    this.spawnRivalHunter('level1', undefined, 'raider');
    this.spawnRivalHunter('level2', undefined, 'raider');
    this.spawnRivalHunter('level2', undefined, 'shadow_stalker');
    this.spawnRivalHunter('level3', undefined, 'shadow_stalker');
    this.spawnRivalHunter('level3', undefined, 'frost_berserker');
    this.spawnRivalHunter('level4', undefined, 'frost_berserker');
    this.spawnRivalHunter('level4', undefined, 'aurora_warlock');
    this.spawnRivalHunter('level5', undefined, 'frost_berserker');
    this.spawnRivalHunter('level5', undefined, 'aurora_warlock');

    // Small initial chance for an extra Rare / Mythic enemy encounter in each wilderness zone
    const wildernessZones: ZoneId[] = ['level1', 'level2', 'level3', 'level4', 'level5'];
    for (const z of wildernessZones) {
      const rareAmbush = rollRareEnemyAmbush(z, 0, Math.random);
      if (rareAmbush) {
        this.spawnRivalHunter(z, undefined, rareAmbush.id);
      }
    }
    this.hunterSpawnTimer = 20;
  }

  private getLootScalingContext(zoneOverride?: ZoneId): LootScalingContext {
    return {
      zone: zoneOverride ?? this.activeZone,
      gear: this.gear,
      unlockedGear: this.unlockedGear,
      axeTier: this.levels.axe,
      bowTier: this.levels.bow,
      wingsTier: this.getEffectiveWingsTier(),
    };
  }

  private spawnSecretChest(
    zone: ZoneId,
    explicitPos?: { x: number; z: number },
    explicitRarity?: SecretChestRarity,
  ): SecretChestEntity {
    const lootCtx = this.getLootScalingContext(zone);
    const rarity = explicitRarity ?? pickSecretChestRarity(zone, Math.random, lootCtx);
    const zoneObstacles = this.trees.filter((t) => t.zone === zone);
    const pos =
      explicitPos ??
      pickSecretChestSpawnPoint({
        zone,
        playerX: this.playerX,
        playerZ: this.playerZ,
        obstacles: zoneObstacles,
      });
    const visual = createSecretChestModel(rarity, this.palette);
    const gy = groundHeightAt(pos.x, pos.z);
    visual.group.position.set(pos.x, gy, pos.z);
    visual.group.rotation.y = explicitPos ? 0 : Math.random() * Math.PI * 2;
    this.getZoneGroup(zone).add(visual.group);

    const entity: SecretChestEntity = {
      id: this.nextChestId++,
      zone,
      rarity,
      x: pos.x,
      z: pos.z,
      opened: false,
      openAnim: 0,
      despawnTimer: 0,
      visual,
    };
    this.chests.push(entity);
    return entity;
  }

  private populateInitialChests(): void {
    for (const c of this.chests) {
      c.visual.group.parent?.remove(c.visual.group);
    }
    this.chests.length = 0;
    this.chestSpawnTimer = SECRET_CHEST_SPAWN_INTERVAL;

    if (this.initialChestShowcase) {
      const targetZone = this.activeZone === 'city' ? 'level1' : this.activeZone;
      const lootInfo = buildLootScalingHudInfo(this.getLootScalingContext(targetZone));
      const showcaseRarity: SecretChestRarity =
        targetZone !== 'level1' || lootInfo.effectiveGearLevel >= 3.5 ? 'aurora' : 'relic';
      const showcasePos =
        targetZone !== 'level1' || this.initialBossShowcase
          ? { x: this.playerX - 2.4, z: this.playerZ + 1.2 }
          : { x: -3.1, z: 5.8 };
      this.spawnSecretChest(targetZone, showcasePos, showcaseRarity);
    } else {
      if (Math.random() < 0.35) this.spawnSecretChest('level1');
      if (Math.random() < 0.45) this.spawnSecretChest('level2');
      if (Math.random() < 0.55) this.spawnSecretChest('level3');
      if (Math.random() < 0.65) this.spawnSecretChest('level4');
      if (Math.random() < 0.75) this.spawnSecretChest('level5');
    }
  }

  private updateSecretChests(dt: number): void {
    const zone = this.activeZone;
    if (zone === 'city') return;

    this.chestSpawnTimer -= dt;
    if (this.chestSpawnTimer <= 0) {
      this.chestSpawnTimer = SECRET_CHEST_SPAWN_INTERVAL;
      const activeCount = this.chests.filter((c) => c.zone === zone && !c.opened).length;
      if (
        shouldSpawnSecretChest({
          activeCountInZone: activeCount,
          zone,
        })
      ) {
        const chest = this.spawnSecretChest(zone);
        const rarityLabel =
          chest.rarity === 'aurora'
            ? 'Mythic Aurora Lockbox'
            : chest.rarity === 'relic'
              ? 'Gilded Relic Coffer'
              : 'Secret Supply Cache';
        this.showToast(`A hidden ${rarityLabel} glints somewhere in ${ZONE_SPECS[zone].name}!`);
        this.emitHudSnapshot();
      }
    }

    for (let i = this.chests.length - 1; i >= 0; i--) {
      const c = this.chests[i];
      if (c.zone !== zone) continue;

      if (c.opened) {
        c.openAnim = Math.min(1, c.openAnim + dt * 4.5);
        c.visual.lidPivot.rotation.x = -c.openAnim * Math.PI * 0.65;
        c.visual.beaconDiamond.visible = false;
        (c.visual.glowRing.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          0.55 * (1 - c.openAnim),
        );
        c.despawnTimer -= dt;
        if (c.despawnTimer <= 0) {
          c.visual.group.parent?.remove(c.visual.group);
          this.chests.splice(i, 1);
        }
      } else {
        const pulse = 1 + Math.sin(this.totalTime * 3.2 + c.id) * 0.08;
        c.visual.glowRing.scale.setScalar(pulse);
        c.visual.beaconDiamond.rotation.y += dt * 1.8;
        c.visual.beaconDiamond.position.y = 1.25 + Math.sin(this.totalTime * 2.8 + c.id) * 0.1;
      }
    }
  }

  public openNearestSecretChest(): boolean {
    if (this.phase !== 'playing') return false;
    const found = findNearestSecretChest(
      this.chests,
      this.playerX,
      this.playerZ,
      this.activeZone,
      SECRET_CHEST_INTERACT_RADIUS,
    );
    if (!found) return false;

    const { chest } = found;
    chest.opened = true;
    chest.openAnim = 0;
    chest.despawnTimer = 2.6;

    const lootCtx = this.getLootScalingContext(chest.zone);
    const roll = rollSecretChestLoot(chest.rarity, Math.random, lootCtx);

    const woodGain = roll.resources.wood ?? 0;
    const stoneGain = roll.resources.stone ?? 0;
    const iceGain = roll.resources.ice ?? 0;
    const meatGain = roll.resources.meat ?? 0;
    const peltsGain = roll.resources.pelts ?? 0;
    let goldGain = roll.resources.gold ?? 0;

    // Combine primary rolled item and any extra progression bonus items
    const primaryRecipe = getCraftRecipe(roll.bonusItemId);
    const allRolledItems: LootDroppedItem[] = [
      {
        id: roll.bonusItemId,
        qty: roll.bonusQty,
        rarity: roll.rolledRarity ?? primaryRecipe.rarity,
      },
      ...(roll.extraItems ?? []),
    ];

    const maxItems = this.getBackpackMaxItems();
    const grantedSummaryParts: string[] = [];
    let overflowGold = 0;
    for (const drop of allRolledItems) {
      const usedItems = countBackpackItems(this.backpackInventory);
      const room = Math.max(0, maxItems - usedItems);
      const addedQty = Math.min(room, drop.qty);
      const rec = getCraftRecipe(drop.id);
      if (addedQty > 0) {
        this.backpackInventory = {
          ...this.backpackInventory,
          [drop.id]: (this.backpackInventory[drop.id] ?? 0) + addedQty,
        };
        grantedSummaryParts.push(`${addedQty}x ${rec.name} (${drop.rarity.toUpperCase()})`);
      }
      if (addedQty < drop.qty) {
        overflowGold += (drop.qty - addedQty) * 35;
      }
    }
    goldGain += overflowGold;

    this.resources = {
      ...this.resources,
      wood: this.resources.wood + woodGain,
      stone: (this.resources.stone ?? 0) + stoneGain,
      ice: (this.resources.ice ?? 0) + iceGain,
      meat: (this.resources.meat ?? 0) + meatGain,
      pelts: this.resources.pelts + peltsGain,
      gold: this.resources.gold + goldGain,
    };
    if (goldGain > 0) {
      this.recordGoldEarned(goldGain);
    }

    this.lastLootRoll = {
      source: 'chest',
      sourceLabel: roll.label,
      zone: chest.zone,
      gearLevel: roll.effectiveGearLevel ?? 1,
      tierLabel: roll.lootTierLabel ?? 'Tier I · Frontier Forager Spoils',
      resourceMultiplier: roll.resourceMultiplier ?? 1,
      gold: goldGain,
      items: allRolledItems.map((drop) => ({
        id: drop.id,
        name: getCraftRecipe(drop.id).name,
        qty: drop.qty,
        rarity: drop.rarity,
      })),
    };

    this.audio.playLevelUp();
    this.achievementCounters.chestsOpened += 1;
    this.checkAchievements(true);
    const gy = groundHeightAt(chest.x, chest.z);
    const burstColor =
      chest.rarity === 'aurora' ? 0xe879f9 : chest.rarity === 'relic' ? 0x38bdf8 : 0xf6c344;
    this.particles.spawnBurst(chest.x, gy + 0.75, chest.z, burstColor, 26, 5.8, 1.2, 4.6);
    this.particles.spawnBurst(chest.x, gy + 1.0, chest.z, 0xfde047, 16, 4.4, 1.0, 3.8);

    const bonusText =
      grantedSummaryParts.length > 0
        ? ` + ${grantedSummaryParts.join(', ')}`
        : ' (Pack full -> Coin bonus)';
    this.showToast(
      `Opened ${roll.label} (${roll.lootTierLabel ?? 'Scaled Loot'})! +${goldGain}g, +${woodGain} Wood, +${peltsGain} Pelts${bonusText}`,
    );
    this.emitHudSnapshot();
    return true;
  }

  private damageRivalHunter(
    hunter: RivalHunterEntity,
    dmg: number,
    dirX: number,
    dirZ: number,
    heavy: boolean,
  ): void {
    const arch = RIVAL_HUNTER_ARCHETYPES[hunter.archetypeId];
    hunter.hp -= dmg;
    hunter.flashTimer = 0.1;
    const d = Math.hypot(dirX, dirZ) || 1;
    hunter.x += (dirX / d) * 0.7;
    hunter.z += (dirZ / d) * 0.7;

    if (heavy) {
      this.audio.playHit(true, hunter.x, hunter.z);
    } else {
      this.audio.playArrowHit(false, this.levels.bow, hunter.x, hunter.z);
    }
    this.particles.spawnBurst(
      hunter.x,
      groundHeightAt(hunter.x, hunter.z) + 1.1,
      hunter.z,
      0xef4444,
      14,
      4.8,
      1.0,
      3.4,
    );

    if (hunter.hp <= 0) {
      hunter.state = 'ko';
      hunter.stateTimer = 0.45;
      hunter.threatRing.visible = false;
      this.hitstopTimer = 0.055;
      this.trauma = Math.min(0.7, this.trauma + 0.35);
      this.cityDailyQuest = recordCityDailyQuestKill(this.cityDailyQuest, 1).quest;

      const zSpec = ZONE_SPECS[hunter.zone];
      const loot = computeRivalHunterDefeatLoot(
        arch,
        hunter.stolenBag,
        zSpec.yieldMult,
      );
      const y = groundHeightAt(hunter.x, hunter.z) + 0.55;
      if (loot.gold > 0) this.spawnPickup('gold', loot.gold, hunter.x + 0.4, y, hunter.z, hunter.zone);
      if (loot.meat > 0) this.spawnPickup('meat', loot.meat, hunter.x - 0.4, y + 0.1, hunter.z, hunter.zone);
      if (loot.pelts > 0) this.spawnPickup('pelt', loot.pelts, hunter.x, y, hunter.z + 0.4, hunter.zone);
      if (loot.wood > 0) this.spawnPickup('wood', loot.wood, hunter.x, y, hunter.z - 0.4, hunter.zone);
      if (loot.ice > 0) this.spawnPickup('ice', loot.ice, hunter.x + 0.25, y + 0.2, hunter.z + 0.25, hunter.zone);

      const recovered = totalStolenItems(hunter.stolenBag);
      this.achievementCounters.rivalsDefeated += 1;
      this.checkAchievements(false);
      this.awardSkillXp('hunting', Math.round((arch.rarity === 'mythic' ? 95 : arch.rarity === 'rare' ? 70 : 45) * zSpec.xpMult));
      const iceNote = loot.ice > 0 ? ` + ${loot.ice} Ice Shards` : '';
      this.showToast(
        recovered > 0
          ? `Slain ${arch.name}! Recovered ${recovered} stolen items + ${loot.gold}g${iceNote}!`
          : `Slain ${arch.name} (${arch.title})! Dropped +${loot.gold}g${iceNote} & supplies!`,
      );
      this.emitHudSnapshot();
    } else if (hunter.state === 'prowl') {
      hunter.state = 'pursue';
    }
  }

  private updateRivalHunters(dt: number): void {
    const zone = this.activeZone;
    if (zone === 'city') return;
    const zSpec = ZONE_SPECS[zone];
    const wardRadius = zone === 'level1' ? (this.levels.forge >= 3 ? 19 : 15.5) : 12;
    const playerHearthDist = Math.hypot(
      this.playerX - zSpec.hearthX,
      this.playerZ - zSpec.hearthZ,
    );
    const playerSafeInCamp =
      playerHearthDist < wardRadius ||
      (zone === 'level1' && this.stormShelter.shielded);

    this.hunterSpawnTimer -= dt;
    if (this.hunterSpawnTimer <= 0) {
      this.hunterSpawnTimer = 24;
      const activeList = this.rivalHunters.filter(
        (h) => h.zone === zone && h.state !== 'ko',
      );
      const activeRareCount = activeList.filter((h) =>
        RARE_ENEMY_ARCHETYPES.includes(h.archetypeId),
      ).length;
      if (activeList.length < 2) {
        const spawned = this.spawnRivalHunter(zone);
        const arch = RIVAL_HUNTER_ARCHETYPES[spawned.archetypeId];
        const prefix =
          arch.rarity === 'mythic'
            ? 'MYTHIC ENEMY ALERT'
            : arch.rarity === 'rare'
              ? 'RARE ENEMY ALERT'
              : 'Warning';
        this.showToast(`${prefix}: ${arch.name} (${arch.title}) has entered ${zSpec.name}!`);
      } else if (activeList.length < 3) {
        const rareAmbush = rollRareEnemyAmbush(zone, activeRareCount, Math.random);
        if (rareAmbush) {
          this.spawnRivalHunter(zone, undefined, rareAmbush.id);
          const prefix = rareAmbush.rarity === 'mythic' ? 'MYTHIC AMBUSH' : 'RARE AMBUSH';
          this.showToast(`${prefix}: ${rareAmbush.name} (${rareAmbush.title}) appeared in ${zSpec.name}!`);
        }
      }
    }

    for (let i = this.rivalHunters.length - 1; i >= 0; i--) {
      const h = this.rivalHunters[i];
      if (h.zone !== zone) continue;

      if (h.state === 'ko') {
        h.stateTimer -= dt;
        h.rig.group.rotation.z = THREE.MathUtils.damp(
          h.rig.group.rotation.z,
          Math.PI / 2,
          14,
          dt,
        );
        if (h.stateTimer <= 0) {
          h.rig.group.parent?.remove(h.rig.group);
          this.rivalHunters.splice(i, 1);
        }
        continue;
      }

      if (h.attackCooldown > 0) {
        h.attackCooldown = Math.max(0, h.attackCooldown - dt);
      }

      const arch = RIVAL_HUNTER_ARCHETYPES[h.archetypeId];
      const dxToPlayer = this.playerX - h.x;
      const dzToPlayer = this.playerZ - h.z;
      const distPlayer = Math.hypot(dxToPlayer, dzToPlayer);
      const distHearth = Math.hypot(h.x - zSpec.hearthX, h.z - zSpec.hearthZ);
      let swingProg = 0;
      const detectRadius = arch.rarity === 'mythic' || arch.rarity === 'rare' ? 30 : 26;
      const pursueSpeed = arch.moveSpeed;
      const prowlSpeed = arch.moveSpeed * 0.55;

      if (!playerSafeInCamp && distPlayer <= detectRadius && distHearth > wardRadius - 1) {
        if (distPlayer <= arch.attackRange) {
          h.state = 'attack';
          h.vx = 0;
          h.vz = 0;
          h.yaw = dampAngle(h.yaw, Math.atan2(dxToPlayer, dzToPlayer), 14, dt);
          if (h.attackCooldown <= 0) {
            h.attackCooldown = arch.attackCooldown;
            h.stateTimer = 0.34;
            const scaledDmg = Math.round(arch.attackDamage * zSpec.enemyDamageMult);
            if (arch.id === 'aurora_warlock') {
              this.spawnEnemyFrostBolt(
                h,
                this.playerX,
                this.playerZ,
                scaledDmg,
                arch.warmthDrain ?? 12,
              );
            } else {
              this.damagePlayer(scaledDmg);
              if (arch.warmthDrain && arch.warmthDrain > 0) {
                this.warmth = Math.max(0, this.warmth - arch.warmthDrain);
              }
              const theft = stealResourcesOnHunterHit(
                this.resources,
                h.stolenBag,
                arch.stealRate,
              );
              this.resources = theft.resources;
              h.stolenBag = theft.stolenBag;
              if (theft.summaryText) {
                this.showToast(
                  `${arch.name} struck you (-${scaledDmg} HP) & stole ${theft.summaryText}! Slay them to recover it!`,
                );
              } else {
                this.showToast(`${arch.name} ambushed you for -${scaledDmg} HP!`);
              }
              this.emitHudSnapshot();
            }
          }
          if (h.stateTimer > 0) {
            h.stateTimer = Math.max(0, h.stateTimer - dt);
            swingProg = h.stateTimer / 0.34;
          }
        } else {
          h.state = 'pursue';
          const d = distPlayer || 1;
          h.vx = (dxToPlayer / d) * pursueSpeed;
          h.vz = (dzToPlayer / d) * pursueSpeed;
          h.yaw = dampAngle(h.yaw, Math.atan2(dxToPlayer, dzToPlayer), 11, dt);
        }
      } else {
        h.state = 'prowl';
        h.stateTimer -= dt;
        if (h.stateTimer <= 0) {
          h.stateTimer = 2.5 + Math.random() * 2.5;
          h.wanderAngle += (Math.random() - 0.5) * 1.8;
        }
        if (distHearth < wardRadius + 3) {
          h.wanderAngle = Math.atan2(h.x - zSpec.hearthX, h.z - zSpec.hearthZ);
        }
        h.vx = Math.sin(h.wanderAngle) * prowlSpeed;
        h.vz = Math.cos(h.wanderAngle) * prowlSpeed;
        h.yaw = dampAngle(h.yaw, h.wanderAngle, 8, dt);
      }

      h.x += h.vx * dt;
      h.z += h.vz * dt;
      const clamped = clampToZoneBounds(h.x, h.z, h.zone, 3.0);
      if (clamped.clamped) {
        h.x = clamped.x;
        h.z = clamped.z;
        h.wanderAngle += Math.PI;
      } else {
        const hx = h.x - zSpec.hearthX;
        const hz = h.z - zSpec.hearthZ;
        const rHearth = Math.hypot(hx, hz);
        if (rHearth < wardRadius) {
          const s = wardRadius / (rHearth || 1);
          h.x = zSpec.hearthX + hx * s;
          h.z = zSpec.hearthZ + hz * s;
          h.wanderAngle = Math.atan2(hx, hz);
        }
      }

      const spd = Math.hypot(h.vx, h.vz);
      h.walkPhase += spd * dt * 1.55;
      const gaitTool: 'axe' | 'bow' = arch.weapon === 'bow' ? 'bow' : 'axe';
      const hPose = computeBipedGait({
        walkPhase: h.walkPhase,
        speed: spd,
        maxSpeed: pursueSpeed,
        isCreeping: h.state === 'prowl',
        idleTime: this.totalTime + h.id,
        swingProgress: swingProg,
        activeTool: gaitTool,
        turnBank: 0,
      });
      h.rig.leftLeg.rotation.x = hPose.leftHipX;
      h.rig.leftKnee.rotation.x = hPose.leftKneeX;
      h.rig.rightLeg.rotation.x = hPose.rightHipX;
      h.rig.rightKnee.rotation.x = hPose.rightKneeX;
      h.rig.leftArm.rotation.x = hPose.leftShoulderX;
      h.rig.leftArm.rotation.z = hPose.leftShoulderZ;
      h.rig.leftElbow.rotation.x = hPose.leftElbowX;
      h.rig.rightArm.rotation.x = hPose.rightShoulderX;
      h.rig.rightArm.rotation.z = hPose.rightShoulderZ;
      h.rig.rightElbow.rotation.x = hPose.rightElbowX;
      h.rig.torsoPivot.rotation.set(hPose.torsoPitchX, hPose.torsoTwistY, hPose.torsoRollZ);
      h.rig.headGroup.rotation.x = hPose.headPitchX;
      h.rig.bodyGroup.position.y = hPose.pelvisY;

      if (h.archetypeId === 'aurora_warlock') {
        const orbitalRing = h.rig.torsoPivot.getObjectByName('wraithOrbitalRing');
        if (orbitalRing) {
          orbitalRing.rotation.y = this.totalTime * 2.4;
        }
        const wings = h.rig.torsoPivot.getObjectByName('wraithWings');
        if (wings) {
          wings.rotation.z = Math.sin(this.totalTime * 3.1 + h.id) * 0.08;
        }
      } else if (h.archetypeId === 'frost_berserker') {
        const core = h.rig.torsoPivot.getObjectByName('berserkerCore');
        if (core) {
          core.rotation.y = this.totalTime * 2.1;
          core.scale.setScalar(0.95 + Math.sin(this.totalTime * 4.5 + h.id) * 0.12);
        }
      }

      if (h.flashTimer > 0) {
        h.flashTimer -= dt;
        h.rig.bodyGroup.scale.set(1.12, 0.88, 1.12);
      } else {
        h.rig.bodyGroup.scale.set(1, 1, 1);
      }

      const pulse = 1 + Math.sin(this.totalTime * 5 + h.id) * 0.1;
      h.threatRing.scale.setScalar(pulse);
      (h.threatRing.material as THREE.MeshBasicMaterial).color.setHex(
        h.state === 'pursue' || h.state === 'attack'
          ? 0xff2e2e
          : arch.id === 'aurora_warlock'
            ? 0xa855f7
            : arch.id === 'frost_berserker'
              ? 0x38bdf8
              : 0xf97316,
      );

      const floatOffset =
        h.archetypeId === 'aurora_warlock'
          ? 0.22 + Math.sin(this.totalTime * 3.4 + h.id) * 0.1
          : 0;
      h.rig.group.position.set(h.x, groundHeightAt(h.x, h.z) + floatOffset, h.z);
      h.rig.group.rotation.y = h.yaw;
    }
  }

  private updatePickups(dt: number): void {
    const bonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const magnetRange =
      3.8 + bonuses.magnetRadiusBonus + gearBonuses.magnetRadiusBonus + petBonuses.magnetRadiusBonus;
    const packCapacity = computeBackpackCapacity(
      this.skills,
      this.levels.cabin,
      gearBonuses.packCapacityBonus + petBonuses.packCapacityBonus,
    );

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (p.zone !== this.activeZone) continue;
      p.age += dt;
      const floorY = groundHeightAt(p.x, p.z);
      if (p.y > floorY || p.vy > 0) {
        p.vy -= 18 * dt;
        p.y += p.vy * dt;
        if (p.y <= floorY) {
          p.y = floorY;
          p.vy = 0;
        }
      }

      const isCargoKind = p.kind === 'wood' || p.kind === 'stone' || p.kind === 'pelt';
      const packUsed = computeBackpackUsed(this.resources);
      const canFitSome = !isCargoKind || packUsed < packCapacity;

      // Magnetize toward player
      const dx = this.playerX - p.x;
      const dz = this.playerZ - p.z;
      const dist = Math.hypot(dx, dz);
      if (canFitSome && dist < magnetRange && p.age > 0.2) {
        const pull = (12.5 + bonuses.magnetRadiusBonus * 1.5) * dt;
        p.x += (dx / (dist || 1)) * pull;
        p.z += (dz / (dist || 1)) * pull;
      }

      p.mesh.position.set(p.x, p.y + Math.sin(this.totalTime * 4 + i) * 0.08, p.z);
      p.mesh.rotation.y += dt * 1.8;

      if (dist < 1.15 && p.age > 0.15) {
        if (isCargoKind) {
          const added = clampCargoAddition(packUsed, packCapacity, p.amount);
          if (added <= 0) {
            if (this.packFullToastCooldown <= 0) {
              this.packFullToastCooldown = 3.5;
              this.showToast(
                `Backpack full (${packUsed}/${packCapacity})! Sell cargo or unlock Expedition Pack ([K]).`,
              );
            }
            continue;
          }

          if (p.kind === 'wood') {
            this.resources.wood += added;
            this.stats.woodHarvested += added;
            this.achievementCounters.woodCollected += added;
            this.advanceObjectiveMetric('woodHarvested', added);
            this.awardSkillXp('gathering', 3);
            this.pushChatLog('drop', `+${added} Timber Wood collected`, 'green');
          } else if (p.kind === 'stone') {
            this.resources.stone = (this.resources.stone ?? 0) + added;
            this.awardSkillXp('gathering', 3);
            this.pushChatLog('drop', `+${added} Granite Stone quarried`, 'cyan');
          } else {
            this.resources.pelts += added;
            this.stats.peltsCollected += added;
            this.advanceObjectiveMetric('peltsCollected', added);
            this.awardSkillXp('hunting', 5);
            this.pushChatLog('drop', `+${added} Arctic Pelt collected`, 'amber');
          }

          this.audio.playPickup(p.kind);
          if (added < p.amount) {
            p.amount -= added;
            this.emitHudSnapshot();
            continue;
          }
          p.mesh.parent?.remove(p.mesh);
          this.pickups.splice(i, 1);
          this.emitHudSnapshot();
          continue;
        }

        if (p.kind === 'ice') {
          this.resources.ice = (this.resources.ice ?? 0) + p.amount;
          this.awardSkillXp('gathering', 4);
          this.pushChatLog('drop', `+${p.amount} Glacial Ice Shards collected`, 'cyan');
        } else if (p.kind === 'meat') {
          this.resources.meat = (this.resources.meat ?? 0) + p.amount;
          this.awardSkillXp('hunting', 3);
          this.pushChatLog('drop', `+${p.amount} Wild Meat harvested`, 'amber');
        } else {
          this.resources.gold += p.amount;
          this.recordGoldEarned(p.amount);
          this.pushChatLog('drop', `+${p.amount} Gold Coins picked up`, 'gold');
        }
        this.audio.playPickup(p.kind);
        p.mesh.parent?.remove(p.mesh);
        this.pickups.splice(i, 1);
        this.emitHudSnapshot();
      }
    }
  }

  private updateWorkers(dt: number): void {
    for (let i = 0; i < this.workers.length; i++) {
      const w = this.workers[i];
      const home =
        w.role === 'lumberjack'
          ? BUILDING_POSITIONS.sawmill
          : w.role === 'campcutter'
            ? BUILDING_POSITIONS.lumberCamp
            : BUILDING_POSITIONS.tannery;
      const destX = w.state === 'return' ? home.x : w.targetX;
      const destZ = w.state === 'return' ? home.z + 2.1 : w.targetZ;
      const tool: ActiveTool = w.role === 'trapper' ? 'bow' : 'axe';
      let moveSpd = 0;
      let workSwing = 0;

      if (w.state === 'work') {
        w.timer -= dt;
        const cycle = ((1.6 - w.timer) * 2.2) % 1;
        workSwing = 1 - cycle;
        if (w.timer <= 0) {
          w.state = 'return';
          if (this.activeZone === 'level1') {
            this.particles.spawnBurst(w.x, groundHeightAt(w.x, w.z) + 1.1, w.z, 0xd8a86e, 5, 3, 0.7, 2);
          }
        }
      } else {
        const dx = destX - w.x;
        const dz = destZ - w.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.75) {
          if (w.state === 'toTarget') {
            w.state = 'work';
            w.timer = 1.6;
          } else {
            w.state = 'toTarget';
            const angle = (i * 1.4 + this.totalTime * 0.2) % (Math.PI * 2);
            const radius = 17 + (i % 3) * 5;
            w.targetX = Math.cos(angle) * radius;
            w.targetZ = Math.sin(angle) * radius;
          }
        } else {
          moveSpd = 4.4;
          w.x += (dx / dist) * moveSpd * dt;
          w.z += (dz / dist) * moveSpd * dt;
          w.yaw = dampAngle(w.yaw, Math.atan2(dx, dz), 11, dt);
          w.walkPhase += moveSpd * dt * 1.6;
        }
      }

      const wPose = computeBipedGait({
        walkPhase: w.walkPhase,
        speed: moveSpd,
        maxSpeed: 4.4,
        isCreeping: false,
        idleTime: this.totalTime + i * 1.3,
        swingProgress: workSwing,
        activeTool: tool,
        turnBank: 0,
      });
      w.rig.leftLeg.rotation.x = wPose.leftHipX;
      w.rig.leftKnee.rotation.x = wPose.leftKneeX;
      w.rig.rightLeg.rotation.x = wPose.rightHipX;
      w.rig.rightKnee.rotation.x = wPose.rightKneeX;
      w.rig.leftArm.rotation.x = wPose.leftShoulderX;
      w.rig.leftArm.rotation.z = wPose.leftShoulderZ;
      w.rig.leftElbow.rotation.x = wPose.leftElbowX;
      w.rig.rightArm.rotation.x = wPose.rightShoulderX;
      w.rig.rightArm.rotation.z = wPose.rightShoulderZ;
      w.rig.rightElbow.rotation.x = wPose.rightElbowX;
      w.rig.torsoPivot.rotation.set(wPose.torsoPitchX, wPose.torsoTwistY, wPose.torsoRollZ);
      w.rig.headGroup.rotation.x = wPose.headPitchX;
      w.rig.bodyGroup.position.y = wPose.pelvisY;

      w.rig.group.position.set(w.x, groundHeightAt(w.x, w.z), w.z);
      w.rig.group.rotation.y = w.yaw;
    }
  }

  private updatePassiveTycoon(dt: number): void {
    const rates = calculatePassiveRates(this.levels);
    if (rates.woodPerSec > 0) {
      this.passiveWoodAcc += rates.woodPerSec * dt;
      if (this.passiveWoodAcc >= 1) {
        const whole = Math.floor(this.passiveWoodAcc);
        this.passiveWoodAcc -= whole;
        this.resources.wood += whole;
        this.stats.woodHarvested += whole;
        this.achievementCounters.woodCollected += whole;
      }
    }
    if (rates.goldPerSec > 0) {
      this.passiveGoldAcc += rates.goldPerSec * dt;
      if (this.passiveGoldAcc >= 1) {
        const whole = Math.floor(this.passiveGoldAcc);
        this.passiveGoldAcc -= whole;
        this.resources.gold += whole;
        this.recordGoldEarned(whole);
      }
    }
  }

  private applyWeatherImmediate(kind: WeatherKind): void {
    const wp = getWeatherProfile(kind);
    const env = computeEnvironmentLighting(this.timeOfDay, kind);
    this.skyColor.setHex(env.skyColorHex);
    this.sceneFog.color.copy(this.skyColor);
    this.sceneFog.density = wp.fogDensity * env.fogDensityMult;
    this.sunLight.color.setHex(env.sunColorHex);
    this.sunLight.intensity = env.sunIntensity;
    this.sunOffsetX = env.sunPos[0];
    this.sunOffsetY = env.sunPos[1];
    this.sunOffsetZ = env.sunPos[2];
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
    this.sunLight.position.set(
      this.playerX + this.sunOffsetX,
      this.sunOffsetY,
      this.playerZ + this.sunOffsetZ,
    );
    this.hemiLight.color.setHex(env.hemiSkyHex);
    this.hemiLight.groundColor.setHex(env.hemiGroundHex);
    this.hemiLight.intensity = env.hemiIntensity;
    this.rimLight.color.setHex(env.rimColorHex);
    this.rimLight.intensity = env.rimIntensity;
    this.scene.environmentIntensity = env.environmentIntensity;
    this.renderer.toneMappingExposure = env.exposure;
    this.campfireGlowMult = env.campfireGlowMult;
    this.palette.predatorEyeMat.emissiveIntensity = env.predatorEyeEmissive;

    this.currentWindX = wp.windSpeedX;
    this.currentFallMult = wp.fallMultiplier;
    this.currentSnowOpacity = wp.snowOpacity;
    this.currentGustIntensity = wp.gustIntensity;
    this.currentFrostOverlay = wp.frostOverlay;
  }

  private updateDayNightCycle(dt: number): void {
    const tick = advanceTimeOfDay(this.timeOfDay, this.cycleDayNumber, dt);
    this.timeOfDay = tick.timeOfDay;
    this.cycleDayNumber = tick.dayNumber;
    if (tick.phaseChanged) {
      if (tick.nextPhase === 'dusk') {
        this.showToast('Dusk settles over Frostwood — frost deepens and predators prowl.');
      } else if (tick.nextPhase === 'night') {
        this.showToast('Arctic Night falls — rapid chill outside warmth & heightened predator hunt!');
      } else if (tick.nextPhase === 'dawn') {
        const completedCount = this.progress.cityDailyQuestsCompleted ?? 0;
        this.cityDailyQuest = createCityDailyQuest(
          this.cycleDayNumber,
          this.wingsTier,
          completedCount,
        );
        this.showToast(
          `Day ${this.cycleDayNumber} Dawn breaks — Valkyra Emberwing has posted a new Daily Quest in Frostcave City!`,
        );
      } else if (tick.nextPhase === 'day') {
        this.showToast('Morning sunlight warms Frostwood.');
      }
      this.emitHudSnapshot();
    }
  }

  private updateWeather(dt: number): void {
    const next = advanceWeatherState(this.weather, this.weatherTimer, dt);
    this.weatherTimer = next.timeLeft;
    if (next.changed) {
      this.weather = next.weather;
      const wp = getWeatherProfile(this.weather);
      this.audio.playWeatherShift(this.weather === 'blizzard');
      if (this.weather === 'blizzard') {
        this.showToast('Blizzard rolling in — stay near camp warmth!');
      } else if (this.weather === 'clear') {
        this.showToast('Skies clearing over Frostwood.');
      } else {
        this.showToast(`${wp.label} drifting across the pines.`);
      }
      const zEffect = this.getActiveZoneWeatherEffect();
      this.pushChatLog(
        'notification',
        `Weather Shift (${wp.label}): ${zEffect.name} — Move ${Math.round(zEffect.effectiveMoveSpeedMult * 100)}%, Harvest ${Math.round(zEffect.effectiveGatherEfficiencyMult * 100)}%.`,
        this.weather === 'blizzard' ? 'amber' : 'cyan',
      );
      this.emitHudSnapshot();
    }

    const target = getWeatherProfile(this.weather);
    const env = computeEnvironmentLighting(this.timeOfDay, this.weather);
    const k = 1 - Math.exp(-1.35 * dt);

    this.targetSkyColor.setHex(env.skyColorHex);
    this.skyColor.lerp(this.targetSkyColor, k);
    this.sceneFog.color.copy(this.skyColor);
    this.sceneFog.density = THREE.MathUtils.lerp(
      this.sceneFog.density,
      target.fogDensity * env.fogDensityMult,
      k,
    );

    this.targetSunColor.setHex(env.sunColorHex);
    this.sunLight.color.lerp(this.targetSunColor, k);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, env.sunIntensity, k);
    this.sunOffsetX = THREE.MathUtils.lerp(this.sunOffsetX, env.sunPos[0], k);
    this.sunOffsetY = THREE.MathUtils.lerp(this.sunOffsetY, env.sunPos[1], k);
    this.sunOffsetZ = THREE.MathUtils.lerp(this.sunOffsetZ, env.sunPos[2], k);
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
    this.sunLight.position.set(
      this.playerX + this.sunOffsetX,
      this.sunOffsetY,
      this.playerZ + this.sunOffsetZ,
    );

    this.targetHemiSky.setHex(env.hemiSkyHex);
    this.targetHemiGround.setHex(env.hemiGroundHex);
    this.hemiLight.color.lerp(this.targetHemiSky, k);
    this.hemiLight.groundColor.lerp(this.targetHemiGround, k);
    this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, env.hemiIntensity, k);

    this.targetRimColor.setHex(env.rimColorHex);
    this.rimLight.color.lerp(this.targetRimColor, k);
    this.rimLight.intensity = THREE.MathUtils.lerp(this.rimLight.intensity, env.rimIntensity, k);

    this.scene.environmentIntensity = THREE.MathUtils.lerp(
      this.scene.environmentIntensity,
      env.environmentIntensity,
      k,
    );
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      env.exposure,
      k,
    );
    this.campfireGlowMult = THREE.MathUtils.lerp(
      this.campfireGlowMult,
      env.campfireGlowMult,
      k,
    );
    this.palette.predatorEyeMat.emissiveIntensity = THREE.MathUtils.lerp(
      this.palette.predatorEyeMat.emissiveIntensity,
      env.predatorEyeEmissive,
      k,
    );

    this.currentWindX = THREE.MathUtils.lerp(this.currentWindX, target.windSpeedX, k);
    this.currentFallMult = THREE.MathUtils.lerp(this.currentFallMult, target.fallMultiplier, k);
    this.currentSnowOpacity = THREE.MathUtils.lerp(this.currentSnowOpacity, target.snowOpacity, k);
    this.currentGustIntensity = THREE.MathUtils.lerp(
      this.currentGustIntensity,
      target.gustIntensity,
      k,
    );
    this.currentFrostOverlay = THREE.MathUtils.lerp(
      this.currentFrostOverlay,
      target.frostOverlay,
      k,
    );
  }

  private advanceObjectiveMetric(metric: ObjectiveMetric, delta: number): void {
    const prevProgress = this.dailyObjective.progress;
    const { objective, justCompleted } = recordObjectiveProgress(
      this.dailyObjective,
      metric,
      delta,
    );
    this.dailyObjective = objective;
    if (justCompleted) {
      const paid = applyObjectiveReward(this.resources, objective.reward);
      this.resources = paid.resources;
      if (paid.goldGained > 0) {
        this.recordGoldEarned(paid.goldGained);
      }
      this.stats.completedObjectives += 1;
      this.audio.playUpgrade();
      this.particles.spawnBurst(
        this.playerX,
        1.8,
        this.playerZ,
        0xf6c344,
        22,
        6.0,
        1.15,
        4.5,
      );
      const rewardParts: string[] = [];
      if (objective.reward.gold) rewardParts.push(`+${objective.reward.gold} Gold`);
      if (objective.reward.wood) rewardParts.push(`+${objective.reward.wood} Wood`);
      if (objective.reward.pelts) rewardParts.push(`+${objective.reward.pelts} Pelts`);
      this.showToast(
        `Day ${objective.dayNumber} Objective Complete! ${rewardParts.join(', ')}`,
      );
      this.emitHudSnapshot();
    } else if (objective.progress !== prevProgress) {
      this.emitHudSnapshot();
    }
  }

  private updateSeasonalEvent(dt: number): void {
    const tick = tickSeasonalEvent(this.seasonalEvent, dt);
    this.seasonalEvent = tick.event;
    if (tick.justStarted) {
      this.syncWildIceSculptures(true);
      this.rebuildCampStructures();
      this.audio.playFestivalStart();
      this.showToast(
        `${this.seasonalEvent.name} has begun! Harvest Ice Sculptures & open [F] Festival!`,
      );
      this.emitHudSnapshot();
    } else if (tick.justEnded) {
      this.syncWildIceSculptures(false);
      this.rebuildCampStructures();
      this.showToast('Festival gates closed — built decorations remain in Frostwood.');
      this.emitHudSnapshot();
    }
  }

  private updateDailyObjective(dt: number): void {
    const tick = tickDailyObjective(this.dailyObjective, dt);
    this.dailyObjective = tick.objective;
    if (tick.expired) {
      this.showToast(
        `Day ${this.dailyObjective.dayNumber} Objective expired — next contract incoming!`,
      );
      this.emitHudSnapshot();
    } else if (tick.nextDayReady) {
      const nextDay = this.dailyObjective.dayNumber + 1;
      this.dailyObjective = createDailyObjective(nextDay);
      this.showToast(`Day ${nextDay} Objective: ${this.dailyObjective.title}`);
      this.emitHudSnapshot();
    }
  }

  private updateStormShelter(dt: number): void {
    const shelterLvl = this.levels.stormShelter ?? 0;
    if (shelterLvl <= 0) {
      if (this.stormShelter.phase !== 'unbuilt') {
        this.stormShelter = createInitialStormShelterState(0);
      }
      return;
    }

    const pos = BUILDING_POSITIONS.stormShelter;
    const spec = getStormShelterSpec(shelterLvl);
    const inside =
      this.activeZone === 'level1' &&
      isPlayerInsideStormShelter(
        this.playerX,
        this.playerZ,
        pos.x,
        pos.z,
        spec.radius,
      );
    const tick = tickStormShelter(this.stormShelter, inside, dt);
    this.stormShelter = tick.state;

    if (tick.justActivated) {
      this.audio.playUpgrade();
      this.particles.spawnBurst(pos.x, 1.5, pos.z, 0x8ce8ff, 22, 5.2, 1.1, 4.2);
      this.showToast(
        `Storm Shelter Shield active (${spec.duration}s) — immune to blizzards & warmth loss!`,
      );
      this.emitHudSnapshot();
    } else if (tick.justExpired) {
      this.showToast(`Storm Shelter dome recharging (${spec.cooldown}s).`);
      this.emitHudSnapshot();
    } else if (tick.justRecharged) {
      this.showToast('Storm Shelter recharged and ready!');
      this.emitHudSnapshot();
    }

    if (this.stormShelterVisual) {
      const { dome, ring, beacon } = this.stormShelterVisual;
      const ringMat = ring.material as THREE.MeshBasicMaterial;
      const domeMat = dome.material as THREE.MeshBasicMaterial;

      if (this.stormShelter.phase === 'active') {
        dome.visible = true;
        const pulse = 0.16 + Math.sin(this.totalTime * 4.5) * 0.04;
        domeMat.opacity = pulse;
        domeMat.color.setHex(this.stormShelter.shielded ? 0x9ef0ff : 0x6ec5eb);
        ringMat.color.setHex(0x9ef0ff);
        ringMat.opacity = 0.72;
        beacon.rotation.y += dt * 3.0;
      } else if (this.stormShelter.phase === 'cooldown') {
        dome.visible = false;
        ringMat.color.setHex(0x6e8eb0);
        ringMat.opacity = 0.24;
        beacon.rotation.y += dt * 0.6;
      } else {
        dome.visible = false;
        ringMat.color.setHex(0xf6c344);
        ringMat.opacity = 0.45 + Math.sin(this.totalTime * 2.5) * 0.1;
        beacon.rotation.y += dt * 1.4;
      }
    }
  }

  private spawnWildPet(
    zone: ZoneId,
    speciesId: PetSpeciesId,
    explicitPos?: { x: number; z: number },
  ): WildPetEntity {
    const pos = explicitPos ?? (() => {
      const zSpec = ZONE_SPECS[zone];
      const angle = Math.random() * Math.PI * 2;
      const dist = zone === 'level1' ? 18 + Math.random() * 24 : 15 + Math.random() * 26;
      return clampToZoneBounds(
        zSpec.centerX + Math.cos(angle) * dist,
        zSpec.centerZ + Math.sin(angle) * dist,
        zone,
        4,
      );
    })();
    const visual = createPetModel(speciesId, this.palette);
    visual.collarMesh.visible = false;
    visual.group.position.set(pos.x, groundHeightAt(pos.x, pos.z), pos.z);
    const yaw = Math.random() * Math.PI * 2;
    visual.group.rotation.y = yaw;
    this.getZoneGroup(zone).add(visual.group);
    const wp: WildPetEntity = {
      id: this.nextWildPetId++,
      zone,
      speciesId,
      x: pos.x,
      z: pos.z,
      vx: 0,
      vz: 0,
      yaw,
      wanderAngle: yaw,
      stateTimer: 1.5 + Math.random() * 2,
      walkPhase: Math.random() * Math.PI * 2,
      progress: 0,
      visual,
    };
    this.wildPets.push(wp);
    return wp;
  }

  private populateWildPets(): void {
    for (const wp of this.wildPets) {
      wp.visual.group.parent?.remove(wp.visual.group);
    }
    this.wildPets.length = 0;

    if (this.initialPetShowcase) {
      this.spawnWildPet('level1', 'arctic_fox', { x: -2.8, z: 7.4 });
    }
    const level1Species: PetSpeciesId[] = ['snow_hare', 'arctic_fox', 'snowy_owl', 'frost_pup'];
    for (const sp of level1Species) {
      this.spawnWildPet('level1', sp);
    }
    const level2Species: PetSpeciesId[] = ['snowy_owl', 'glacial_lynx', 'calf_mammoth'];
    for (const sp of level2Species) {
      this.spawnWildPet('level2', sp);
      this.spawnWildPet('level3', sp);
      this.spawnWildPet('level4', sp);
      this.spawnWildPet('level5', sp);
    }
    this.wildPetRespawnTimer = 14;
  }

  private findNearestWildPet(maxRadius: number): { pet: WildPetEntity; dist: number } | null {
    if (this.activeZone === 'city') return null;
    let best: { pet: WildPetEntity; dist: number } | null = null;
    for (const wp of this.wildPets) {
      if (wp.zone !== this.activeZone) continue;
      const dist = Math.hypot(wp.x - this.playerX, wp.z - this.playerZ);
      if (dist <= maxRadius && (!best || dist < best.dist)) {
        best = { pet: wp, dist };
      }
    }
    return best;
  }

  private animatePetModel(
    visual: PetVisual,
    speciesId: PetSpeciesId,
    speed: number,
    walkPhase: number,
    tamed: boolean,
    progressPct: number,
  ): void {
    const stride = Math.min(1, speed / 3.4);
    for (let i = 0; i < visual.legs.length; i++) {
      const diag = i === 0 || i === 3 ? 0 : Math.PI;
      visual.legs[i].rotation.x = Math.sin(walkPhase + diag) * 0.58 * stride;
    }
    const hop =
      speciesId === 'snow_hare' || speciesId === 'snowy_owl'
        ? Math.abs(Math.sin(walkPhase)) * 0.14 * stride
        : Math.abs(Math.sin(walkPhase * 2)) * 0.045 * stride;
    visual.bodyGroup.position.y = hop;
    visual.headGroup.rotation.y = Math.sin(this.totalTime * 1.6 + progressPct * 0.05) * 0.12;
    if (visual.tailPivot) {
      visual.tailPivot.rotation.y = Math.sin(this.totalTime * (tamed ? 7.5 : 4.0)) * (tamed ? 0.34 : 0.16);
    }
    if (visual.leftWingPivot && visual.rightWingPivot) {
      const flap = Math.sin(this.totalTime * (speed > 0.3 ? 11 : 4.2)) * (speed > 0.3 ? 0.42 : 0.12);
      visual.leftWingPivot.rotation.z = flap;
      visual.rightWingPivot.rotation.z = -flap;
    }
    visual.collarMesh.visible = tamed;
    visual.heartBeacon.visible = tamed || progressPct >= 15;
    visual.heartBeacon.rotation.y += 0.03;
    visual.tameRingMat.opacity = tamed ? 0.42 : Math.min(0.65, 0.15 + (progressPct / 100) * 0.5);
    const pulse = 1 + Math.sin(this.totalTime * 3.5) * 0.07;
    visual.tameRingMesh.scale.setScalar(pulse);
  }

  private completePetTaming(wp: WildPetEntity, via: 'passive' | 'feeding'): void {
    const penSpec = getTamingPenSpec(this.levels.tamingPen ?? 0);
    if (this.tamedPets.length >= penSpec.maxPets) {
      return;
    }
    const idx = this.wildPets.indexOf(wp);
    if (idx !== -1) {
      wp.visual.group.parent?.remove(wp.visual.group);
      this.wildPets.splice(idx, 1);
    }

    const spec = PET_SPECIES_SPECS[wp.speciesId];
    const uid = `pet-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const makeActive = !this.activePetUid;
    const record: TamedPetRecord = {
      uid,
      speciesId: wp.speciesId,
      name: spec.defaultNick,
      rarity: spec.rarity,
      tamedVia: via,
      affection: via === 'feeding' ? 50 : 35,
      inPen: !makeActive,
    };
    this.tamedPets.push(record);
    if (makeActive) {
      this.activePetUid = uid;
    }
    this.achievementCounters.petsTamed += 1;
    this.syncTamedPetVisuals();
    this.audio.playLevelUp();
    this.particles.spawnBurst(wp.x, groundHeightAt(wp.x, wp.z) + 0.8, wp.z, spec.accentHex, 24, 5.2, 1.1, 4.0);
    this.showToast(
      `Tamed ${spec.name} "${record.name}" via ${via === 'feeding' ? 'Feeding' : 'Calm Approach'}! (${spec.perkSummary})`,
    );
    this.checkAchievements(true);
    this.emitHudSnapshot();
  }

  private updateWildPets(dt: number): void {
    if (this.activeZone === 'city') return;
    const penLevel = this.levels.tamingPen ?? 0;
    const penSpec = getTamingPenSpec(penLevel);
    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const hasSlot = this.tamedPets.length < penSpec.maxPets;

    this.wildPetRespawnTimer -= dt;
    if (this.wildPetRespawnTimer <= 0) {
      this.wildPetRespawnTimer = 16;
      const inZone = this.wildPets.filter((p) => p.zone === this.activeZone).length;
      if (inZone < 4) {
        const pool: PetSpeciesId[] =
          this.activeZone !== 'level1'
            ? ['snowy_owl', 'frost_pup', 'glacial_lynx', 'calf_mammoth']
            : ['snow_hare', 'arctic_fox', 'snowy_owl', 'frost_pup'];
        const sp = pool[Math.floor(Math.random() * pool.length)] ?? 'snow_hare';
        this.spawnWildPet(this.activeZone, sp);
      }
    }

    for (let i = this.wildPets.length - 1; i >= 0; i--) {
      const wp = this.wildPets[i];
      if (wp.zone !== this.activeZone) continue;

      const dx = this.playerX - wp.x;
      const dz = this.playerZ - wp.z;
      const dist = Math.hypot(dx, dz);

      const passiveGain = hasSlot
        ? computePassiveTameGain({
            speciesId: wp.speciesId,
            distance: dist,
            playerSpeed: this.playerSpeed,
            penLevel,
            calendarTameMult: calMods.tameRateMult,
            dt,
          })
        : 0;
      if (passiveGain > 0) {
        wp.progress = Math.min(100, wp.progress + passiveGain);
        if (wp.progress >= 100) {
          this.completePetTaming(wp, 'passive');
          continue;
        }
      }

      if (dist <= PET_PASSIVE_TAME_RADIUS && this.playerSpeed <= PET_PASSIVE_CALM_MAX_SPEED) {
        wp.vx = 0;
        wp.vz = 0;
        wp.yaw = dampAngle(wp.yaw, Math.atan2(dx, dz), 6, dt);
      } else {
        wp.stateTimer -= dt;
        if (wp.stateTimer <= 0) {
          wp.stateTimer = 2.0 + Math.random() * 2.5;
          wp.wanderAngle += (Math.random() - 0.5) * 1.9;
        }
        const spd = 1.6;
        wp.vx = Math.sin(wp.wanderAngle) * spd;
        wp.vz = Math.cos(wp.wanderAngle) * spd;
        wp.x += wp.vx * dt;
        wp.z += wp.vz * dt;
        const clamped = clampToZoneBounds(wp.x, wp.z, wp.zone, 3.5);
        wp.x = clamped.x;
        wp.z = clamped.z;
        if (clamped.clamped) wp.wanderAngle += Math.PI;
        wp.yaw = dampAngle(wp.yaw, wp.wanderAngle, 8, dt);
      }

      const moveSpd = Math.hypot(wp.vx, wp.vz);
      wp.walkPhase += moveSpd * dt * 2.8;
      wp.visual.group.position.set(wp.x, groundHeightAt(wp.x, wp.z), wp.z);
      wp.visual.group.rotation.y = wp.yaw;
      this.animatePetModel(wp.visual, wp.speciesId, moveSpd, wp.walkPhase, false, wp.progress);
    }
  }

  public feedNearestWildPet(): boolean {
    if (this.phase !== 'playing') return false;
    const match = this.findNearestWildPet(PET_FEED_INTERACT_RADIUS);
    if (!match) {
      this.showToast('Approach a wild Snow Hare, Arctic Fox, or Owl within 5m to feed & tame [H]!');
      return false;
    }
    const penLevel = this.levels.tamingPen ?? 0;
    const penSpec = getTamingPenSpec(penLevel);
    if (this.tamedPets.length >= penSpec.maxPets) {
      this.showToast(`Taming Pen full (${this.tamedPets.length}/${penSpec.maxPets}) — upgrade Taming Pen in Camp Base!`);
      return false;
    }

    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const res = applyFeedWildPet({
      speciesId: match.pet.speciesId,
      currentProgress: match.pet.progress,
      resources: this.resources,
      penLevel,
      calendarTameMult: calMods.tameRateMult,
    });
    if (!res.ok) {
      const spec = PET_SPECIES_SPECS[match.pet.speciesId];
      this.showToast(`Need ${spec.feedMeatCost} Meat or ${spec.feedGoldFallback}g to feed ${spec.name}!`);
      return false;
    }

    this.resources = res.resources;
    match.pet.progress = res.nextProgress;
    const spec = PET_SPECIES_SPECS[match.pet.speciesId];
    this.audio.playPickup('gold');
    this.particles.spawnBurst(match.pet.x, groundHeightAt(match.pet.x, match.pet.z) + 0.65, match.pet.z, 0xf6c344, 14, 4, 0.9, 3.2);
    if (res.tamedNow) {
      this.completePetTaming(match.pet, 'feeding');
    } else {
      this.showToast(`Fed ${spec.name} (${res.spentLabel}) — Affinity ${Math.round(match.pet.progress)}%!`);
      this.emitHudSnapshot();
    }
    return true;
  }

  private syncTamedPetVisuals(): void {
    for (const inst of this.tamedPetInstances) {
      inst.visual.group.parent?.remove(inst.visual.group);
    }
    this.tamedPetInstances.length = 0;

    for (let i = 0; i < this.tamedPets.length; i++) {
      const pet = this.tamedPets[i];
      const isActive = pet.uid === this.activePetUid;
      const zone: ZoneId = isActive ? this.activeZone : 'level1';
      const penPos = BUILDING_POSITIONS.tamingPen;
      const sx = isActive ? this.playerX - 1.5 : penPos.x + ((i % 3) - 1) * 0.85;
      const sz = isActive ? this.playerZ + 1.1 : penPos.z + (Math.floor(i / 3) - 0.5) * 0.85;
      const visual = createPetModel(pet.speciesId, this.palette);
      visual.collarMesh.visible = true;
      visual.group.position.set(sx, groundHeightAt(sx, sz), sz);
      this.getZoneGroup(zone).add(visual.group);
      this.tamedPetInstances.push({
        uid: pet.uid,
        speciesId: pet.speciesId,
        x: sx,
        z: sz,
        yaw: 0,
        walkPhase: i * 1.1,
        wanderAngle: i * 1.7,
        stateTimer: 1.5,
        currentZone: zone,
        visual,
      });
    }
  }

  private updateTamedPets(dt: number): void {
    const penPos = BUILDING_POSITIONS.tamingPen;
    for (const inst of this.tamedPetInstances) {
      const isActive = inst.uid === this.activePetUid;
      const targetZone: ZoneId = isActive ? this.activeZone : 'level1';
      if (inst.currentZone !== targetZone) {
        inst.currentZone = targetZone;
        inst.visual.group.parent?.remove(inst.visual.group);
        this.getZoneGroup(targetZone).add(inst.visual.group);
        inst.x = isActive ? this.playerX - 1.4 : penPos.x;
        inst.z = isActive ? this.playerZ + 1.2 : penPos.z;
      }

      if (targetZone !== this.activeZone) continue;

      let moveSpd = 0;
      if (isActive) {
        const behindX = this.playerX - Math.sin(this.playerYaw) * 1.85 + Math.cos(this.playerYaw) * 0.95;
        const behindZ = this.playerZ - Math.cos(this.playerYaw) * 1.85 - Math.sin(this.playerYaw) * 0.95;
        const dx = behindX - inst.x;
        const dz = behindZ - inst.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 14) {
          inst.x = behindX;
          inst.z = behindZ;
        } else if (dist > 0.75) {
          moveSpd = Math.min(9.5, 4.4 + dist * 1.6);
          inst.x += (dx / dist) * moveSpd * dt;
          inst.z += (dz / dist) * moveSpd * dt;
          inst.yaw = dampAngle(inst.yaw, Math.atan2(dx, dz), 11, dt);
        } else {
          inst.yaw = dampAngle(inst.yaw, this.playerYaw, 6, dt);
        }
      } else {
        inst.stateTimer -= dt;
        if (inst.stateTimer <= 0) {
          inst.stateTimer = 1.6 + Math.random() * 2.0;
          inst.wanderAngle += (Math.random() - 0.5) * 2.1;
        }
        const px = inst.x - penPos.x;
        const pz = inst.z - penPos.z;
        if (Math.hypot(px, pz) > 1.55) {
          inst.wanderAngle = Math.atan2(-px, -pz);
        }
        moveSpd = 1.25;
        inst.x += Math.sin(inst.wanderAngle) * moveSpd * dt;
        inst.z += Math.cos(inst.wanderAngle) * moveSpd * dt;
        inst.yaw = dampAngle(inst.yaw, inst.wanderAngle, 8, dt);
      }

      inst.walkPhase += moveSpd * dt * 2.8;
      inst.visual.group.position.set(inst.x, groundHeightAt(inst.x, inst.z), inst.z);
      inst.visual.group.rotation.y = inst.yaw;
      this.animatePetModel(inst.visual, inst.speciesId, moveSpd, inst.walkPhase, true, 100);
    }
  }

  public setActivePet(uid: string | null): boolean {
    if (uid !== null && !this.tamedPets.some((p) => p.uid === uid)) return false;
    this.activePetUid = uid;
    this.tamedPets = this.tamedPets.map((p) => ({ ...p, inPen: p.uid !== uid }));
    this.syncTamedPetVisuals();
    const active = this.tamedPets.find((p) => p.uid === uid);
    if (active) {
      const spec = PET_SPECIES_SPECS[active.speciesId];
      this.showToast(`${active.name} (${spec.name}) is now following you! (${spec.perkSummary})`);
    } else {
      this.showToast('Active companion resting in Base Taming Pen.');
    }
    this.emitHudSnapshot();
    return true;
  }

  public petTamedCompanion(uid: string): boolean {
    const pet = this.tamedPets.find((p) => p.uid === uid);
    if (!pet) return false;
    pet.affection = Math.min(100, pet.affection + 15);
    this.audio.playPickup('gold');
    const inst = this.tamedPetInstances.find((v) => v.uid === uid);
    if (inst) {
      this.particles.spawnBurst(inst.x, groundHeightAt(inst.x, inst.z) + 0.7, inst.z, 0xfda4af, 12, 3.8, 0.9, 3.2);
    }
    this.showToast(`Bonded with ${pet.name}! Affection ${pet.affection}/100`);
    this.emitHudSnapshot();
    return true;
  }

  public attractWildStray(): boolean {
    if ((this.levels.tamingPen ?? 0) < 1) {
      this.showToast('Build the Taming Pen (Lv 1+) in Camp Base first!');
      return false;
    }
    const existing = this.findNearestWildPet(7.5);
    if (existing) {
      this.showToast(`${PET_SPECIES_SPECS[existing.pet.speciesId].name} is already visiting nearby!`);
      return false;
    }
    if (this.resources.gold < 12) {
      this.showToast('Need 12 Gold for scented bait to attract a stray pet.');
      return false;
    }
    this.resources.gold -= 12;
    const choices: PetSpeciesId[] =
      (this.levels.tamingPen ?? 0) >= 3
        ? PET_SPECIES_ORDER
        : (this.levels.tamingPen ?? 0) >= 2
          ? ['snow_hare', 'arctic_fox', 'snowy_owl', 'frost_pup']
          : ['snow_hare', 'arctic_fox', 'snowy_owl'];
    const sp = choices[Math.floor(Math.random() * choices.length)] ?? 'arctic_fox';
    const penPos = BUILDING_POSITIONS.tamingPen;
    this.spawnWildPet('level1', sp, { x: penPos.x + 2.2, z: penPos.z - 2.4 });
    this.audio.playTrackInspect();
    this.showToast(`A friendly ${PET_SPECIES_SPECS[sp].name} approached the Taming Pen! Feed [H] or stand calm!`);
    this.emitHudSnapshot();
    return true;
  }

  private updateWarmthAndVitals(dt: number): void {
    const { warmthRadius } = calculatePassiveRates(this.levels);
    const zSpec = ZONE_SPECS[this.activeZone];
    const hearthDist = Math.hypot(this.playerX - zSpec.hearthX, this.playerZ - zSpec.hearthZ);
    const effectiveWarmthRadius =
      this.activeZone === 'level1'
        ? warmthRadius
        : zSpec.hearthWarmthRadius + (this.levels.thermalConduit ?? 0) * 2.2;
    const nearCampfire = hearthDist <= effectiveWarmthRadius;
    const inStormShelter = this.activeZone === 'level1' && this.stormShelter.shielded;
    const chillScale = computeCraftChillScale(this.weather, this.activeBuffs);
    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const wingsSpec = getWingsOfFireSpec(this.getEffectiveWingsTier());
    const prepBonus = computeBackpackPreparedness(this.backpackInventory, this.activeBuffs);
    const calMods = getCalendarGameplayModifiers(this.cycleDayNumber);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      this.levels.tamingPen ?? 0,
    );
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect(nearCampfire);

    const next = stepWarmthAndHealth({
      hp: this.hp,
      maxHp: this.maxHp,
      warmth: this.warmth,
      maxWarmth: this.maxWarmth,
      nearCampfire,
      inStormShelter,
      coatLevel: 1,
      weather: this.weather,
      chillScale,
      coldDecayMult:
        skillBonuses.coldDecayMult *
        gearBonuses.coldDecayMult *
        wingsSpec.coldDecayMult *
        prepBonus.coldDecayMult *
        calMods.chillMult *
        petBonuses.coldDecayMult *
        zoneWeatherEffect.effectiveChillMult *
        zSpec.chillMult,
      campfireRecoveryMult: skillBonuses.campfireRecoveryMult,
      timeOfDay: this.timeOfDay,
      dt,
    });
    this.hp = next.hp;
    this.warmth = next.warmth;
    const totalHpRegen = gearBonuses.hpRegenPerSec + wingsSpec.hpRegenBonus;
    if (!next.defeated && totalHpRegen > 0 && this.warmth > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + totalHpRegen * dt);
    }
    if (next.defeated) {
      this.victory = false;
      this.audio.playDefeat();
      this.setPhase('gameover');
    }
  }

  private updateCameraFollow(dt: number): void {
    const playerY = groundHeightAt(this.playerX, this.playerZ);
    const aheadX = this.playerX + this.playerVx * 0.22;
    const aheadZ = this.playerZ + this.playerVz * 0.22;
    this.camLookX = dampScalar(this.camLookX, aheadX, 7.2, dt);
    this.camLookZ = dampScalar(this.camLookZ, aheadZ, 7.2, dt);
    const lookY = groundHeightAt(this.camLookX, this.camLookZ);

    _targetPos.set(this.camLookX, lookY + 14.5, this.camLookZ + 14.2);

    const k = 1 - Math.exp(-7.5 * dt);
    this.camera.position.lerp(_targetPos, k);

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.6 * dt);
      const shake = this.trauma * this.trauma * 0.55;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
    }

    _rayOrigin.set(this.camLookX, playerY + 1.35, this.camLookZ);
    this.camera.lookAt(_rayOrigin);
  }

  private getActiveZoneWeatherEffect(nearCampfireOverride?: boolean) {
    const zSpec = ZONE_SPECS[this.activeZone];
    const nearCampfire =
      nearCampfireOverride !== undefined
        ? nearCampfireOverride
        : (() => {
            const { warmthRadius } = calculatePassiveRates(this.levels);
            const effectiveWarmthR =
              this.activeZone === 'level1'
                ? warmthRadius
                : zSpec.hearthWarmthRadius + (this.levels.thermalConduit ?? 0) * 2.2;
            return (
              Math.hypot(this.playerX - zSpec.hearthX, this.playerZ - zSpec.hearthZ) <=
              effectiveWarmthR
            );
          })();
    const inStormShelter = this.activeZone === 'level1' && this.stormShelter.shielded;
    return computeZoneWeatherStatusEffect({
      zone: this.activeZone,
      weather: this.weather,
      levels: this.levels,
      nearCampfire,
      inStormShelter,
      activeBuffs: this.activeBuffs,
    });
  }

  public getHudSnapshot(): HudSnapshot {
    const rates = calculatePassiveRates(this.levels);
    const zSpec = ZONE_SPECS[this.activeZone];
    const zoneInfo = buildZoneHudInfo(
      this.activeZone,
      this.playerX,
      this.playerZ,
      this.playerYaw,
    );
    const hearthDist = Math.hypot(this.playerX - zSpec.hearthX, this.playerZ - zSpec.hearthZ);
    const effectiveWarmthRadius =
      this.activeZone === 'level1'
        ? rates.warmthRadius
        : zSpec.hearthWarmthRadius + (this.levels.thermalConduit ?? 0) * 2.2;
    const nearCampfire = hearthDist <= effectiveWarmthRadius;
    const zoneWeatherEffect = this.getActiveZoneWeatherEffect(nearCampfire);

    const distCamp = Math.hypot(this.playerX, this.playerZ);
    const distTannery = Math.hypot(
      this.playerX - BUILDING_POSITIONS.tannery.x,
      this.playerZ - BUILDING_POSITIONS.tannery.z,
    );
    const distStation = Math.hypot(
      this.playerX - BUILDING_POSITIONS.craftingStation.x,
      this.playerZ - BUILDING_POSITIONS.craftingStation.z,
    );
    const nearCraftingStation = this.activeZone === 'level1' && distStation <= 4.5;
    const nearMarket =
      this.activeZone === 'level1' && (distTannery <= 4.5 || distCamp <= 4.5);

    const nearbyTrackMatch = findNearestInspectableTrack(
      this.tracks,
      this.playerX,
      this.playerZ,
      this.activeZone,
      TRACK_INSPECT_RADIUS,
    );
    const nearbyTrack = nearbyTrackMatch ? nearbyTrackMatch.clue : null;
    const trackedQuarry = selectBestTrackedQuarry(
      this.animals,
      this.playerX,
      this.playerZ,
      this.activeZone,
      this.trackedAnimalId,
      this.huntersSight.active,
      this.trackAmbushBonusTimer,
    );
    const wildlifeBlips = collectMinimapWildlifeBlips(
      this.animals,
      this.playerX,
      this.playerZ,
      this.activeZone,
      this.huntersSight.active,
      this.trackedAnimalId,
    );

    const nearCityQuestNpc =
      this.activeZone === 'city' && isNearCityQuestNpc(this.playerX, this.playerZ);
    const nearCityTrader =
      this.activeZone === 'city'
        ? findNearestCityTrader(this.playerX, this.playerZ)
        : null;
    let nearestCityNpcName: string | null = null;
    if (this.activeZone === 'city' && !nearCityTrader && !nearCityQuestNpc) {
      for (const npc of this.cityNpcs) {
        if (Math.hypot(this.playerX - npc.x, this.playerZ - npc.z) <= CITY_NPC_INTERACT_RADIUS) {
          nearestCityNpcName = `${npc.spec.name} (${npc.spec.role})`;
          break;
        }
      }
    }

    const rivalHuntersHud: RivalHunterHudInfo[] = this.rivalHunters
      .filter((h) => h.zone === this.activeZone && h.state !== 'ko')
      .map((h) => {
        const arch = RIVAL_HUNTER_ARCHETYPES[h.archetypeId];
        const dx = h.x - this.playerX;
        const dz = h.z - this.playerZ;
        const hudState: RivalHunterHudInfo['state'] =
          h.state === 'attack'
            ? 'attacking'
            : h.state === 'pursue'
              ? 'charging'
              : h.state === 'flee'
                ? 'fleeing'
                : 'stalking';
        return {
          id: h.id,
          archetype: h.archetypeId,
          rarity: arch.rarity,
          name: arch.name,
          title: arch.title,
          weapon: arch.weapon,
          hp: Math.max(0, Math.round(h.hp)),
          maxHp: h.maxHp,
          distance: Math.round(Math.hypot(dx, dz)),
          direction: cardinalBearingFromDelta(dx, dz),
          state: hudState,
          stolenValue: totalStolenItems(h.stolenBag),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    const hunterBlips: MinimapHunterBlip[] = this.rivalHunters
      .filter((h) => h.zone === this.activeZone && h.state !== 'ko')
      .map((h) => {
        const arch = RIVAL_HUNTER_ARCHETYPES[h.archetypeId];
        return {
          id: h.id,
          x: h.x,
          z: h.z,
          name: arch.name,
          weapon: arch.weapon,
          rarity: arch.rarity,
        };
      });

    const nearbySecretMatch = findNearestSecretChest(
      this.chests,
      this.playerX,
      this.playerZ,
      this.activeZone,
      SECRET_CHEST_INTERACT_RADIUS,
    );
    const secretChestNear: SecretChestHudInfo | null = nearbySecretMatch
      ? nearbySecretMatch.info
      : null;
    const chestBlips: MinimapChestBlip[] = collectMinimapChestBlips(
      this.chests,
      this.playerX,
      this.playerZ,
      this.activeZone,
      this.huntersSight.active,
    );

    const nearbyWildPetMatch = this.findNearestWildPet(PET_FEED_INTERACT_RADIUS);
    const nearPen =
      this.activeZone === 'level1' &&
      Math.hypot(
        this.playerX - BUILDING_POSITIONS.tamingPen.x,
        this.playerZ - BUILDING_POSITIONS.tamingPen.z,
      ) <= PEN_INTERACT_RADIUS;

    let contextHint: string | null = null;
    if (zoneInfo.nearCityPortal) {
      contextHint = 'Press [E] or step through East Gate Portal -> Frostcave City (Traders & Bazaar)';
    } else if (zoneInfo.nearForwardPortal && zoneInfo.forwardZoneName) {
      contextHint = `Press [E] or step through Forward Portal -> ${zoneInfo.forwardZoneName}`;
    } else if (zoneInfo.nearPortal) {
      contextHint = `Press [E] or step through Portal -> ${zoneInfo.returnZoneName ?? 'Level 2: Glacial Highlands'}`;
    } else if (nearCityQuestNpc) {
      contextHint = `Press [E] to speak with ${CITY_QUEST_NPC.name} · Daily Quest for Wings of Fire!`;
    } else if (nearCityTrader) {
      contextHint = `Press [E] to Trade with ${nearCityTrader.trader.name} (${nearCityTrader.trader.title}) · Coins & Meat`;
    } else if (nearestCityNpcName) {
      contextHint = `Press [E] to Talk to ${nearestCityNpcName}`;
    } else if (secretChestNear) {
      contextHint = `Press [E] to Open ${secretChestNear.label} (${secretChestNear.distance}m)`;
    } else if (nearbyWildPetMatch) {
      const petSpec = PET_SPECIES_SPECS[nearbyWildPetMatch.pet.speciesId];
      contextHint = `Wild ${petSpec.name} (${Math.round(nearbyWildPetMatch.pet.progress)}% Bond) · Stand calm or [H] Feed & Tame!`;
    } else if (nearbyTrack) {
      contextHint = `Press [E] to Inspect ${nearbyTrack.label} Tracks (${nearbyTrack.freshnessPct}% Fresh · Moving ${nearbyTrack.direction})`;
    } else if (nearPen) {
      contextHint = 'Base Taming Pen · Press [E] or [J] to manage Companions & attract Strays';
    } else if (nearCraftingStation) {
      contextHint = 'Press [E] to Open Crafting Station (Hammer, Gears, Tools & Traps)';
    } else if (this.activeZone === 'level1' && this.stormShelter.shielded) {
      contextHint = `Storm Shelter Shield (${Math.ceil(this.stormShelter.timeLeft)}s) · Immune to Blizzards & Warmth Loss`;
    } else if (
      this.activeZone === 'level1' &&
      this.stormShelter.playerInside &&
      this.stormShelter.phase === 'cooldown'
    ) {
      contextHint = `Storm Shelter Recharging (${Math.ceil(this.stormShelter.timeLeft)}s)`;
    } else if (
      this.activeZone === 'level1' &&
      distTannery <= 4.5 &&
      (this.resources.wood >= 1 || this.resources.pelts >= 1)
    ) {
      contextHint = 'Press E to Sell Wood & Pelts';
    } else if (this.activeZone === 'level1' && distCamp <= 6.5) {
      contextHint = 'Campfire Warmth · [C] Station · [J] Pets · [L] Badges · East Road -> City';
    } else if (this.activeZone !== 'level1' && this.activeZone !== 'city' && nearCampfire) {
      contextHint = `Waystation Brazier · Safe Warmth (${zSpec.difficultyMult}x Survival Zone)`;
    } else if (this.activeZone === 'city') {
      contextHint = 'Frostcave City · Visit Valkyra Emberwing for Wings of Fire Daily Quest or trade at Stalls [E]';
    }

    const skillBonuses = computeSkillBonuses(this.skills);
    const gearBonuses = computeGearBonuses(this.gear);
    const gearSet = computeGearSetBonus(this.gear);
    const wingsSpec = getWingsOfFireSpec(this.wingsTier);
    const penLevel = this.levels.tamingPen ?? 0;
    const penSpec = getTamingPenSpec(penLevel);
    const petBonuses = computeActivePetBonuses(
      this.tamedPets,
      this.activePetUid,
      penLevel,
    );
    const floorResources: ResourceCounts = {
      wood: Math.floor(this.resources.wood),
      stone: Math.floor(this.resources.stone ?? 0),
      ice: Math.floor(this.resources.ice ?? 0),
      pelts: Math.floor(this.resources.pelts),
      meat: Math.floor(this.resources.meat ?? 0),
      gold: Math.floor(this.resources.gold),
    };
    const packUsed = computeBackpackUsed(floorResources);
    const packCapacity = computeBackpackCapacity(
      this.skills,
      this.levels.cabin,
      gearBonuses.packCapacityBonus + petBonuses.packCapacityBonus,
    );
    const backpackMaxItems = this.getBackpackMaxItems();
    const backpackUsedSlots = countBackpackItems(this.backpackInventory);
    const backpackPreparedness = computeBackpackPreparedness(
      this.backpackInventory,
      this.activeBuffs,
    );
    const deployedTraps: DeployedTrapHudInfo[] = this.deployedTraps
      .filter((t) => t.zone === this.activeZone)
      .map((t) => {
        const dx = t.x - this.playerX;
        const dz = t.z - this.playerZ;
        return {
          id: t.id,
          kind: t.kind,
          x: t.x,
          z: t.z,
          distance: Math.round(Math.hypot(dx, dz)),
          direction: cardinalBearingFromDelta(dx, dz),
          armed: t.armed,
        };
      });

    const trendSnapshot = this.resourceTrendTracker.update(
      this.totalTime,
      this.resources,
      { wood: rates.woodPerSec, gold: rates.goldPerSec },
    );
    this.syncAchievementSnapshotCounters();
    const achievementEval = evaluateAchievements(
      this.achievementCounters,
      this.achievementsUnlocked,
    );
    const nearbyWildPetHud: NearbyTameablePetHudInfo | null = nearbyWildPetMatch
      ? (() => {
          const spec = PET_SPECIES_SPECS[nearbyWildPetMatch.pet.speciesId];
          return {
            id: nearbyWildPetMatch.pet.id,
            speciesId: nearbyWildPetMatch.pet.speciesId,
            speciesLabel: spec.name,
            rarity: spec.rarity,
            progress: Math.round(nearbyWildPetMatch.pet.progress),
            distance: Math.round(nearbyWildPetMatch.dist * 10) / 10,
            passiveActive:
              nearbyWildPetMatch.dist <= PET_PASSIVE_TAME_RADIUS &&
              this.playerSpeed <= PET_PASSIVE_CALM_MAX_SPEED,
            feedMeatCost: spec.feedMeatCost,
            feedGoldFallback: spec.feedGoldFallback,
            perkSummary: spec.perkSummary,
          };
        })()
      : null;
    const petsHud: PetsHudState = {
      tamedPets: this.tamedPets.map((p) => ({ ...p })),
      activePetUid: this.activePetUid,
      penLevel,
      maxSlots: penSpec.maxPets,
      passiveTameRateMult: penSpec.passiveTameRateMult,
      perkPotencyMult: penSpec.perkPotencyMult,
      nearPen,
      nearbyWildPet: nearbyWildPetHud,
      activeBonuses: petBonuses,
    };

    return {
      phase: this.phase,
      victory: this.victory,
      zone: zoneInfo,
      resources: floorResources,
      resourceTrends: trendSnapshot.trends,
      resourceTrendDeltas: trendSnapshot.deltas,
      levels: { ...this.levels },
      gear: { ...this.gear },
      unlockedGear: { ...this.unlockedGear },
      gearBonuses,
      gearSet,
      wingsTier: this.wingsTier,
      wingsEquipped: this.wingsEquipped,
      wingsSpec,
      cityDailyQuest: {
        ...this.cityDailyQuest,
        bountyCost: { ...this.cityDailyQuest.bountyCost },
      },
      cityDailyQuestsCompleted: this.progress.cityDailyQuestsCompleted ?? 0,
      wingsQuestRequirement: WINGS_DAILY_QUEST_REQUIREMENT,
      nearCityQuestNpc,
      secretChestNear,
      chestBlips,
      rivalHunters: rivalHuntersHud,
      hunterBlips,
      bossNear: (() => {
        const activeBoss = this.zoneBosses.find((b) => b.zone === this.activeZone);
        if (!activeBoss) return null;
        const dx = activeBoss.x - this.playerX;
        const dz = activeBoss.z - this.playerZ;
        const dist = Math.hypot(dx, dz);
        const engagedOrNearby =
          activeBoss.state !== 'idle' ||
          dist <= BOSS_HUD_DETECT_RADIUS ||
          this.initialBossShowcase;
        if (!engagedOrNearby) return null;
        return {
          id: activeBoss.id,
          zone: activeBoss.zone,
          name: activeBoss.spec.name,
          title: activeBoss.spec.title,
          hp: Math.round(activeBoss.hp),
          maxHp: activeBoss.maxHp,
          phase: activeBoss.enraged ? 2 : 1,
          enraged: activeBoss.enraged,
          distance: Math.round(dist),
          direction: cardinalBearingFromDelta(dx, dz),
          state: activeBoss.state,
          telegraphLabel:
            activeBoss.state === 'telegraph' && activeBoss.activePattern
              ? activeBoss.activePattern.label
              : null,
          telegraphProgress:
            activeBoss.state === 'telegraph' && activeBoss.telegraphDuration > 0
              ? clamp(1 - activeBoss.stateTimer / activeBoss.telegraphDuration, 0, 1)
              : 0,
          respawnSeconds:
            activeBoss.state === 'ko' ? Math.max(0, Math.ceil(activeBoss.respawnTimer)) : 0,
          tacticLabel: activeBoss.tacticLabel,
        } satisfies ZoneBossHudInfo;
      })(),
      bossBlip: (() => {
        const activeBoss = this.zoneBosses.find((b) => b.zone === this.activeZone);
        if (!activeBoss) return null;
        return {
          id: activeBoss.id,
          zone: activeBoss.zone,
          name: activeBoss.spec.name,
          x: activeBoss.x,
          z: activeBoss.z,
          alive: activeBoss.state !== 'ko',
          enraged: activeBoss.enraged,
        } satisfies MinimapBossBlip;
      })(),
      lootScaling: buildLootScalingHudInfo(this.getLootScalingContext(), this.lastLootRoll),
      activeTool: this.activeTool,
      hp: Math.round(this.hp),
      maxHp: Math.round(this.maxHp),
      warmth: Math.round(this.warmth),
      maxWarmth: Math.round(this.maxWarmth),
      nearCampfire,
      nearMarket: nearMarket || this.activeZone === 'city',
      nearCraftingStation,
      nearCityTrader: nearCityTrader ? nearCityTrader.trader.id : null,
      nearestCityNpcName,
      contextHint,
      stats: { ...this.stats },
      bestGold: Math.round(this.bestGold),
      lifetimeStats: { ...this.progress.stats },
      hallOfFame: this.progress.hallOfFame.slice(0, 5),
      bestiary: cloneBestiary(this.bestiary),
      skills: cloneSkillsState(this.skills),
      skillBonuses,
      packUsed,
      packCapacity,
      backpackInventory: { ...this.backpackInventory },
      backpackUsedSlots,
      backpackMaxItems,
      backpackPreparedness,
      deployedTraps,
      muted: this.audio.isMuted(),
      endlessMode: this.endlessMode,
      woodRate: rates.woodPerSec,
      goldRate: rates.goldPerSec,
      workerCount: rates.workerCount,
      weather: this.weather,
      weatherTimeLeft: Math.ceil(this.weatherTimer),
      frostIntensity: computeScreenFrostIntensity({
        weather: this.weather,
        baseWeatherFrost: this.currentFrostOverlay,
        warmth: this.warmth,
        maxWarmth: this.maxWarmth,
        nearCampfire,
        inStormShelter: this.activeZone === 'level1' && this.stormShelter.shielded,
        timeOfDay: this.timeOfDay,
      }),
      zoneWeatherEffect,
      dayNight: buildDayNightState(this.timeOfDay, this.cycleDayNumber),
      calendar: buildCalendarState(this.cycleDayNumber),
      dailyObjective: {
        ...this.dailyObjective,
        reward: { ...this.dailyObjective.reward },
      },
      seasonalEvent: { ...this.seasonalEvent },
      stormShelter: { ...this.stormShelter },
      activeBuffs: { ...this.activeBuffs },
      huntersSight: { ...this.huntersSight },
      trackedQuarry,
      nearbyTrack,
      wildlifeBlips,
      achievements: achievementEval.entries,
      achievementsUnlockedCount: achievementEval.unlockedIds.length,
      pets: petsHud,
      chatLogs: this.chatLogs.slice(-40),
      toastText: this.toastText,
    };
  }

  private emitHudSnapshot(): void {
    this.onHudUpdate(this.getHudSnapshot());
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clearInputs);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.clearAllTracks();
    this.clearAllBossHazards();
    this.sightPulseRingMesh.geometry.dispose();
    this.sightPulseRingMat.dispose();
    this.audio.dispose();
    this.particles.dispose();
    this.snowfall.dispose();
    this.textures.dispose();
    this.arrowGeo.dispose();
    this.arrowMat.dispose();
    this.enemyBoltGeo.dispose();
    this.enemyBoltMat.dispose();
    this.bossOrbGeo.dispose();
    this.bossHazardFillGeo.dispose();
    this.bossHazardRingGeo.dispose();
    this.renderer.dispose();
  }
}
