import type { FishingHudState } from './fishing';
import type { GameSettings } from './settings';

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type DrawerTab =
  | 'camp'
  | 'craft'
  | 'inventory'
  | 'travel'
  | 'city'
  | 'festival'
  | 'bestiary'
  | 'pets'
  | 'achievements'
  | 'skills'
  | 'daily'
  | 'saves'
  | 'mystery'
  | 'settings';

export type WeatherKind = 'clear' | 'light_snow' | 'blizzard';

export type ActiveTool = 'axe' | 'bow' | 'rod';

export type TreeKind = 'pine' | 'spruce' | 'elder' | 'pyrewood' | 'void_heartwood';

export type BoulderKind = 'granite' | 'brimstone_ore' | 'voltaic_ore' | 'dark_matter_ore';

export type RareMaterialId =
  | 'pyrewood_heart'
  | 'brimstone_slag'
  | 'voltaic_core'
  | 'venom_resin'
  | 'void_timber'
  | 'dark_matter_ore';

export type RareMaterialMap = Record<RareMaterialId, number>;

export type MythicAscensionId =
  | 'infernal_fire'
  | 'glacial_frost'
  | 'thunder_lightning'
  | 'venom_poison'
  | 'dark_matter';

export type MysteryShopItemId =
  | 'pyreheart_elixir'
  | 'absolute_zero_draught'
  | 'fulminite_capacitor'
  | 'blight_venom_vial'
  | 'dark_matter_singularity';

export type AnimalRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
export type ItemRarity = AnimalRarity;

export type AnimalKind =
  | 'hare'
  | 'fox'
  | 'stag'
  | 'wolf'
  | 'lynx'
  | 'snow_owl'
  | 'wolverine'
  | 'polar_bear'
  | 'frost_stag'
  | 'musk_ox'
  | 'frost_boar'
  | 'mammoth'
  | 'sabertooth'
  | 'aurora_fenrir';

export interface BestiaryRecord {
  discovered: boolean;
  sightings: number;
  hunted: number;
  hitsLanded: number;
  damageDealt: number;
  ambushHits: number;
  peltsEarned: number;
  goldEarned: number;
  bestKillHits: number | null;
  firstDiscoveredAt: string | null;
}

export type BestiaryMap = Record<AnimalKind, BestiaryRecord>;

export type BuildingId =
  | 'cabin'
  | 'lumberCamp'
  | 'sawmill'
  | 'tannery'
  | 'forge'
  | 'watchtower'
  | 'grandGranary'
  | 'tamingPen'
  | 'stormShelter'
  | 'windbreak'
  | 'thermalConduit';

export type ShelterPhase = 'unbuilt' | 'ready' | 'active' | 'cooldown';

export interface StormShelterState {
  level: number;
  phase: ShelterPhase;
  timeLeft: number;
  duration: number;
  radius: number;
  playerInside: boolean;
  shielded: boolean;
}

export type FestivalBuildingId = 'festivalPavilion' | 'iceMonument';

export type SeasonalEventId = 'solstice_fair' | 'aurora_festival';

export interface SeasonalEventState {
  id: SeasonalEventId;
  name: string;
  subtitle: string;
  active: boolean;
  timeLeft: number;
  duration: number;
  cycleCount: number;
}

export type ToolUpgradeId = 'axe' | 'bow' | 'coat';

export type ObjectiveMetric =
  | 'treesFelled'
  | 'animalsHunted'
  | 'wolvesSlain'
  | 'woodHarvested'
  | 'peltsCollected';

export interface DailyObjective {
  id: string;
  dayNumber: number;
  title: string;
  metric: ObjectiveMetric;
  target: number;
  progress: number;
  timeLeft: number;
  duration: number;
  reward: Partial<ResourceCounts>;
  completed: boolean;
  failed: boolean;
  cooldownTimer: number;
}

export interface ResourceCounts {
  wood: number;
  pelts: number;
  stone?: number;
  ice?: number;
  meat?: number;
  gold: number;
}

export type CraftCategory = 'parts' | 'tools' | 'traps' | 'provisions';

export type CraftItemId =
  | 'clockwork_gear'
  | 'hammer_temper'
  | 'utility_toolkit'
  | 'snare_trap'
  | 'frost_trap'
  | 'fire_starter'
  | 'insulated_boots'
  | 'flint_quiver'
  | 'alpine_poultice'
  | 'frost_whetstone'
  | 'mammoth_tonic'
  | 'aurora_charm';

export interface ActiveCraftBuffs {
  fireStarter: number;
  insulatedBoots: number;
  flintEdge: number;
  frostWhetstone: number;
  auroraCharm: number;
  hammerTemper?: number;
  utilityToolkit?: number;
}

export type BackpackInventoryMap = Record<CraftItemId, number>;

export interface BackpackPreparednessBonus {
  stockedCount: number;
  uniqueCategories: number;
  damageMult: number;
  moveSpeedMult: number;
  coldDecayMult: number;
  label: string;
}

export interface DeployedTrapHudInfo {
  id: number;
  kind: 'snare' | 'frost';
  x: number;
  z: number;
  distance: number;
  direction: string;
  armed: boolean;
}

export interface UpgradeLevels {
  axe: number; // 1..7
  bow: number; // 1..7
  coat: number; // 1..4
  cabin: number; // 1..5
  lumberCamp: number; // 0..4
  sawmill: number; // 0..4
  tannery: number; // 0..4
  forge: number; // 0..4
  watchtower?: number; // 0..3
  grandGranary?: number; // 0..3
  tamingPen?: number; // 0..3
  stormShelter?: number; // 0..3
  windbreak?: number; // 0..3
  thermalConduit?: number; // 0..3
  festivalPavilion?: number; // 0..2
  iceMonument?: number; // 0..2
}

export interface RunStats {
  woodHarvested: number;
  peltsCollected: number;
  goldEarned: number;
  treesFelled: number;
  animalsHunted: number;
  wolvesSlain: number;
  completedObjectives: number;
  elapsedSeconds: number;
  bossesSlain?: number;
}

export interface ToolSpec {
  level: number;
  name: string;
  rarity?: ItemRarity;
  power: number;
  cooldown: number;
  range: number;
  cost: ResourceCounts;
  description: string;
}

export interface BuildingSpec {
  level: number;
  name: string;
  cost: ResourceCounts;
  woodPerSec: number;
  goldPerSec: number;
  warmthRadius: number;
  windResistanceBonusPct?: number;
  heatRetentionBonusPct?: number;
  description: string;
}

export interface HallOfFameEntry {
  id: string;
  goldEarned: number;
  woodHarvested: number;
  peltsCollected: number;
  treesFelled: number;
  animalsHunted: number;
  wolvesSlain: number;
  completedObjectives: number;
  cabinTier: number;
  elapsedSeconds: number;
  victory: boolean;
  recordedAt: string;
}

export interface PlayerLifetimeStats {
  totalRuns: number;
  victories: number;
  bestGold: number;
  totalGoldEarned: number;
  totalWoodHarvested: number;
  totalTreesFelled: number;
  totalAnimalsHunted: number;
  totalWolvesSlain: number;
  totalObjectivesCompleted: number;
  fastestVictorySeconds: number | null;
}

export type SkillBranch = 'gathering' | 'hunting';

export type SkillPerkId =
  | 'pack_capacity'
  | 'move_speed'
  | 'gather_yield'
  | 'hunt_damage'
  | 'pelt_yield'
  | 'cold_resist';

export interface SkillPerkSpec {
  id: SkillPerkId;
  branch: SkillBranch;
  name: string;
  tagline: string;
  maxRank: number;
  rankSummaries: string[];
  description: string;
}

export interface PlayerSkillsState {
  gatheringXp: number;
  gatheringLevel: number;
  gatheringPoints: number;
  huntingXp: number;
  huntingLevel: number;
  huntingPoints: number;
  ranks: Record<SkillPerkId, number>;
}

export interface SkillBonuses {
  packBonus: number;
  magnetRadiusBonus: number;
  moveSpeedMult: number;
  creepSpeedMult: number;
  gatherYieldMult: number;
  axePowerMult: number;
  huntDamageMult: number;
  ambushMult: number;
  arrowSpeedMult: number;
  peltYieldMult: number;
  peltValueMult: number;
  maxHpBonus: number;
  coldDecayMult: number;
  campfireRecoveryMult: number;
}

export type SkillGatheringResource = 'wood' | 'stone' | 'ice' | 'pelts' | 'pack';

export interface ActiveSkillPerkPulse {
  active: boolean;
  perkId: SkillPerkId | null;
  perkName: string;
  rank: number;
  maxRank: number;
  branch: SkillBranch;
  resource: SkillGatheringResource | null;
  bonusPct: number;
  secondaryBonusText: string;
  taskLabel: string;
  timeRemaining: number;
  duration: number;
  pulseNonce: number;
  activeResources: Partial<Record<SkillGatheringResource, number>>;
}

export interface AchievementCounters {
  woodCollected: number;
  treesFelled: number;
  animalsHunted: number;
  wolvesSlain: number;
  goldEarned: number;
  itemsCrafted: number;
  chestsOpened: number;
  rivalsDefeated: number;
  dailyQuestsCompleted: number;
  petsTamed: number;
  maxDaysSurvived: number;
  maxCabinTier: number;
  maxBuildingsBuilt: number;
  maxGearSetTier: number;
  maxSpeciesDiscovered: number;
  wingsUnlocked: number;
}

export type AchievementCategory =
  | 'gathering'
  | 'hunting'
  | 'crafting'
  | 'economy'
  | 'exploration'
  | 'pets';

export interface AchievementSpec {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: ItemRarity;
  counterKey: keyof AchievementCounters;
  target: number;
  iconKey: string;
}

export interface AchievementHudEntry {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: ItemRarity;
  iconKey: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface PersistentProgress {
  version: number;
  stats: PlayerLifetimeStats;
  hallOfFame: HallOfFameEntry[];
  bestiary?: BestiaryMap;
  skills?: PlayerSkillsState;
  cityDailyQuestsCompleted?: number;
  achievementsUnlocked?: string[];
  achievementCounters?: AchievementCounters;
  dailyLogin?: {
    streakDay: number;
    lastClaimedDateKey: string | null;
    totalDaysClaimed: number;
  };
}

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface DayNightState {
  dayNumber: number;
  timeOfDay: number;
  phase: DayPhase;
  phaseLabel: string;
  clockLabel: string;
  tempDecayMult: number;
  predatorActivityMult: number;
  preyActivityMult: number;
  wildlifeActivityLabel: string;
}

export type ZoneId =
  | 'level1'
  | 'level2'
  | 'level3'
  | 'level4'
  | 'level5'
  | 'city';

export interface ZoneHudInfo {
  id: ZoneId;
  levelNumber: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  subtitle: string;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  portalDistance: number;
  portalDirection: string;
  nearPortal: boolean;
  forwardPortalDistance?: number;
  forwardPortalDirection?: string;
  nearForwardPortal?: boolean;
  forwardZoneId?: ZoneId;
  forwardZoneName?: string;
  returnZoneId?: ZoneId;
  returnZoneName?: string;
  cityPortalDistance?: number;
  cityPortalDirection?: string;
  nearCityPortal?: boolean;
  yieldMult: number;
  xpMult: number;
  chillMult: number;
  difficultyMult: number;
}

export type GearSlotId = 'coat' | 'boots' | 'gloves' | 'pack';

export type GearLevels = Record<GearSlotId, number>;

export interface GearTierStats {
  maxHp?: number;
  maxWarmth?: number;
  coldDecayMult?: number;
  moveSpeedMult?: number;
  creepSpeedMult?: number;
  damageMult?: number;
  cooldownMult?: number;
  packCapacityBonus?: number;
  magnetRadiusBonus?: number;
}

export interface GearTierSpec {
  slot: GearSlotId;
  tier: number;
  name: string;
  rarity: ItemRarity;
  cost: ResourceCounts;
  summary: string;
  description: string;
  stats: GearTierStats;
}

export interface GearSetBonusSpec {
  minTier: number;
  name: string;
  rarity: ItemRarity;
  gatherYieldMult: number;
  goldTradeMult: number;
  coldDecayMult: number;
  hpRegenPerSec: number;
  damageMult: number;
  summary: string;
}

export interface GearBonuses {
  maxHp: number;
  maxWarmth: number;
  coldDecayMult: number;
  moveSpeedMult: number;
  creepSpeedMult: number;
  damageMult: number;
  cooldownMult: number;
  packCapacityBonus: number;
  magnetRadiusBonus: number;
  gatherYieldMult: number;
  goldTradeMult: number;
  hpRegenPerSec: number;
  setTier: number;
}

export interface HuntersSightState {
  active: boolean;
  timeLeft: number;
  duration: number;
  cooldownLeft: number;
  cooldownDuration: number;
  pulseRadius: number;
}

export interface TrackedQuarryHudInfo {
  id: number;
  kind: AnimalKind;
  label: string;
  rarity: AnimalRarity;
  predator: boolean;
  distance: number;
  direction: string;
  hp: number;
  maxHp: number;
  state: string;
  ambushReady: boolean;
}

export interface TrackInspectClueHud {
  kind: AnimalKind;
  label: string;
  rarity: AnimalRarity;
  distance: number;
  direction: string;
  freshnessPct: number;
}

export interface MinimapWildlifeBlip {
  id: number;
  kind: AnimalKind;
  rarity: AnimalRarity;
  predator: boolean;
  x: number;
  z: number;
  locked: boolean;
}

export type TrendResourceKey = 'wood' | 'stone' | 'ice' | 'meat' | 'pelts' | 'gold';
export type ResourceTrendDirection = 'up' | 'down' | 'flat';
export type ResourceTrendMap = Record<TrendResourceKey, ResourceTrendDirection>;
export type ResourceTrendDeltaMap = Record<TrendResourceKey, number>;

export type CityTraderId = 'butcher' | 'tinker' | 'apothecary' | 'quartermaster';

export interface CityTraderHudInfo {
  id: CityTraderId;
  name: string;
  title: string;
  distance: number;
  direction: string;
  near: boolean;
}

export interface WingsOfFireSpec {
  tier: number; // 0..3
  name: string;
  subtitle: string;
  rarity: ItemRarity;
  moveSpeedMult: number;
  damageMult: number;
  coldDecayMult: number;
  maxHpBonus: number;
  hpRegenBonus: number;
  description: string;
}

export interface CityDailyQuestState {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  npcName: string;
  npcTitle: string;
  targetKills: number;
  progressKills: number;
  bountyCost: ResourceCounts;
  rewardGold: number;
  rewardMeat: number;
  rewardIce: number;
  rewardWingsTier: number;
  rewardWingsName: string;
  completed: boolean;
}

export type RivalHunterArchetypeId =
  | 'poacher'
  | 'raider'
  | 'shadow_stalker'
  | 'frost_berserker'
  | 'aurora_warlock';

export interface RivalHunterHudInfo {
  id: number;
  archetype: RivalHunterArchetypeId;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  name: string;
  title: string;
  weapon: 'axe' | 'bow' | 'staff';
  distance: number;
  direction: string;
  hp: number;
  maxHp: number;
  state: 'stalking' | 'charging' | 'attacking' | 'fleeing';
  stolenValue: number;
}

export interface MinimapHunterBlip {
  id: number;
  name: string;
  x: number;
  z: number;
  weapon: 'axe' | 'bow' | 'staff';
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic';
}

export type SecretChestRarity = 'supply' | 'relic' | 'aurora';

export interface SecretChestHudInfo {
  id: number;
  rarity: SecretChestRarity;
  label: string;
  distance: number;
}

export interface MinimapChestBlip {
  id: number;
  rarity: SecretChestRarity;
  x: number;
  z: number;
}

export interface LootDroppedItem {
  id: CraftItemId;
  qty: number;
  rarity: ItemRarity;
}

export interface ChestLootRoll {
  rarity: SecretChestRarity;
  label: string;
  resources: Partial<ResourceCounts>;
  bonusItemId: CraftItemId;
  bonusQty: number;
  rolledRarity?: ItemRarity;
  extraItems?: LootDroppedItem[];
  lootTierLabel?: string;
  effectiveGearLevel?: number;
  resourceMultiplier?: number;
}

export interface LastLootRollHudInfo {
  source: 'chest' | 'boss';
  sourceLabel: string;
  zone: ZoneId;
  gearLevel: number;
  tierLabel: string;
  resourceMultiplier: number;
  gold: number;
  items: Array<{
    id: CraftItemId;
    name: string;
    qty: number;
    rarity: ItemRarity;
  }>;
}

export interface LootScalingHudInfo {
  zone: ZoneId;
  zoneTier: 1 | 2 | 3 | 4 | 5 | 6;
  effectiveGearLevel: number;
  progressionIndex: number; // 0..1
  tierLabel: string;
  resourceMultiplier: number;
  chestRarityPercentages: Record<SecretChestRarity, number>;
  itemRarityPercentages: Record<ItemRarity, number>;
  lastRoll: LastLootRollHudInfo | null;
}

export type CalendarSeasonId =
  | 'first_frost'
  | 'deep_winter'
  | 'aurora_solstice'
  | 'late_thaw';

export interface CalendarEventSpec {
  id: string;
  title: string;
  description: string;
  woodMult: number;
  goldTradeMult: number;
  tameRateMult: number;
  chillMult: number;
}

export interface CalendarUpcomingDay {
  dayNumber: number;
  seasonName: string;
  dayOfSeason: number;
  weekdayName: string;
  eventTitle: string | null;
}

export interface CalendarState {
  dayNumber: number;
  year: number;
  seasonId: CalendarSeasonId;
  seasonName: string;
  dayOfSeason: number;
  daysInSeason: number;
  weekdayName: string;
  formattedDate: string;
  shortDate: string;
  todayEvent: CalendarEventSpec | null;
  upcomingDays: CalendarUpcomingDay[];
}

export type PetSpeciesId =
  | 'snow_hare'
  | 'arctic_fox'
  | 'frost_pup'
  | 'snowy_owl'
  | 'glacial_lynx'
  | 'calf_mammoth';

export interface TamedPetRecord {
  uid: string;
  speciesId: PetSpeciesId;
  name: string;
  rarity: ItemRarity;
  tamedVia: 'passive' | 'feeding';
  affection: number; // 0..100
  inPen: boolean;
}

export interface NearbyTameablePetHudInfo {
  id: number;
  speciesId: PetSpeciesId;
  speciesLabel: string;
  rarity: ItemRarity;
  progress: number; // 0..100
  distance: number;
  passiveActive: boolean;
  feedMeatCost: number;
  feedGoldFallback: number;
  perkSummary: string;
}

export interface PetsHudState {
  tamedPets: TamedPetRecord[];
  activePetUid: string | null;
  penLevel: number;
  maxSlots: number;
  passiveTameRateMult: number;
  perkPotencyMult: number;
  nearPen: boolean;
  nearbyWildPet: NearbyTameablePetHudInfo | null;
  activeBonuses: {
    moveSpeedMult: number;
    gatherYieldMult: number;
    damageMult: number;
    coldDecayMult: number;
    goldTradeMult: number;
    packCapacityBonus: number;
    magnetRadiusBonus: number;
  };
}

export type ZoneBossId =
  | 'skarn_colossus'
  | 'veyra_sovereign'
  | 'ignis_warden'
  | 'malakor_gargoyle'
  | 'ulthar_behemoth'
  | 'astraea_valkyrie';

export type BossAttackPatternId =
  | 'root_slam'
  | 'bark_barrage'
  | 'tremor_charge'
  | 'briar_fissure_cross'
  | 'blizzard_nova'
  | 'glacial_volley'
  | 'meteor_shards'
  | 'cryo_ring_tempest'
  | 'magma_cleave'
  | 'ember_spiral'
  | 'leap_slam'
  | 'forge_cinder_cross'
  | 'rimefang_shatter'
  | 'abyssal_icicles'
  | 'wyrm_glaive_rush'
  | 'abyssal_void_ring'
  | 'tectonic_permafrost'
  | 'obsidian_comets'
  | 'monolith_crush'
  | 'caldera_cross_eruption'
  | 'supernova_cataclysm'
  | 'starfall_spiral'
  | 'void_aurora_judgment'
  | 'starfall_nova_matrix';

export type BossAttackKind =
  | 'aoe'
  | 'projectile_fan'
  | 'charge'
  | 'meteor'
  | 'leap'
  | 'cross_eruption'
  | 'ring_wave';

export interface ZoneBossHudInfo {
  id: ZoneBossId;
  zone: ZoneId;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  enraged: boolean;
  distance: number;
  direction: string;
  state: 'idle' | 'engage' | 'telegraph' | 'attack' | 'recover' | 'ko';
  telegraphLabel: string | null;
  telegraphProgress: number; // 0..1
  respawnSeconds: number;
  tacticLabel?: string;
}

export interface MinimapBossBlip {
  id: ZoneBossId;
  zone: ZoneId;
  name: string;
  x: number;
  z: number;
  alive: boolean;
  enraged: boolean;
}

export type ChatLogCategory = 'drop' | 'loot' | 'combat' | 'notification';

export interface ChatLogEntry {
  id: number;
  timestamp: string;
  category: ChatLogCategory;
  text: string;
  accent?: 'gold' | 'cyan' | 'purple' | 'red' | 'green' | 'amber';
  rarity?: ItemRarity;
}

export type ZoneWeatherSeverity = 'sheltered' | 'mild' | 'moderate' | 'severe' | 'extreme';

export interface ZoneWeatherEffectState {
  id: string;
  name: string;
  subtitle: string;
  zone: ZoneId;
  weather: WeatherKind;
  severity: ZoneWeatherSeverity;
  rawMovePenaltyPct: number;
  rawGatherPenaltyPct: number;
  windResistancePct: number;
  heatRetentionPct: number;
  requiredWindResistancePct: number;
  requiredHeatRetentionPct: number;
  effectiveMoveSpeedMult: number;
  effectiveGatherEfficiencyMult: number;
  effectiveChillMult: number;
  mitigated: boolean;
  infrastructureHint: string;
}

export interface HarvestStreakHudInfo {
  count: number;
  timeRemaining: number;
  maxTime: number;
  yieldBonusPct: number;
}

export interface HousingHudState {
  inCabin: boolean;
  nearCabinDoor: boolean;
  nearInteriorDoor: boolean;
  nearBed: boolean;
  isSleeping: boolean;
  sleepProgress: number;
  sleepTargetDay: number;
  cabinTier: number;
  cabinTitle: string;
  bedName: string;
}

export interface CombatDamagePopup {
  id: number;
  xPct: number;
  yPct: number;
  amount: number;
  crit: boolean;
  isPlayerDamage: boolean;
}

export interface HudSnapshot {
  phase: GamePhase;
  victory: boolean;
  zone: ZoneHudInfo;
  resources: ResourceCounts;
  resourceTrends: ResourceTrendMap;
  resourceTrendDeltas: ResourceTrendDeltaMap;
  harvestStreak: HarvestStreakHudInfo;
  housing: HousingHudState;
  fishing: FishingHudState;
  levels: UpgradeLevels;
  gear: GearLevels;
  unlockedGear: GearLevels;
  gearBonuses: GearBonuses;
  gearSet: GearSetBonusSpec | null;
  wingsTier: number;
  wingsEquipped: boolean;
  wingsSpec: WingsOfFireSpec;
  cityDailyQuest: CityDailyQuestState;
  cityDailyQuestsCompleted: number;
  wingsQuestRequirement: number;
  nearCityQuestNpc: boolean;
  secretChestNear: SecretChestHudInfo | null;
  chestBlips: MinimapChestBlip[];
  rivalHunters: RivalHunterHudInfo[];
  hunterBlips: MinimapHunterBlip[];
  bossNear: ZoneBossHudInfo | null;
  bossBlip: MinimapBossBlip | null;
  lootScaling: LootScalingHudInfo;
  activeTool: ActiveTool;
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  stamina: number;
  maxStamina: number;
  nearCampfire: boolean;
  nearMarket: boolean;
  nearCraftingStation: boolean;
  nearCityTrader: CityTraderId | null;
  nearestCityNpcName: string | null;
  contextHint: string | null;
  stats: RunStats;
  bestGold: number;
  lifetimeStats: PlayerLifetimeStats;
  hallOfFame: HallOfFameEntry[];
  bestiary: BestiaryMap;
  skills: PlayerSkillsState;
  skillBonuses: SkillBonuses;
  skillPerkPulse: ActiveSkillPerkPulse;
  packUsed: number;
  packCapacity: number;
  backpackInventory: BackpackInventoryMap;
  backpackUsedSlots: number;
  backpackMaxItems: number;
  backpackPreparedness: BackpackPreparednessBonus;
  deployedTraps: DeployedTrapHudInfo[];
  muted: boolean;
  settings: GameSettings;
  endlessMode: boolean;
  woodRate: number;
  goldRate: number;
  workerCount: number;
  weather: WeatherKind;
  weatherTimeLeft: number;
  frostIntensity: number;
  zoneWeatherEffect: ZoneWeatherEffectState;
  dayNight: DayNightState;
  calendar: CalendarState;
  dailyObjective: DailyObjective;
  seasonalEvent: SeasonalEventState;
  stormShelter: StormShelterState;
  activeBuffs: ActiveCraftBuffs;
  huntersSight: HuntersSightState;
  trackedQuarry: TrackedQuarryHudInfo | null;
  nearbyTrack: TrackInspectClueHud | null;
  wildlifeBlips: MinimapWildlifeBlip[];
  achievements: AchievementHudEntry[];
  achievementsUnlockedCount: number;
  pets: PetsHudState;
  chatLogs: ChatLogEntry[];
  toastText: string | null;
  dailyLogin: DailyLoginState;
  saveSlots: SaveSlotsMap;
  rareMaterials: RareMaterialMap;
  unlockedAscensions: MythicAscensionId[];
  equippedAscension: MythicAscensionId | null;
  nearMysteryShop: boolean;
  cameraOrbitDeg: number;
  bowAutoAim: boolean;
  bowAutoAttack: boolean;
  autoHarvest: boolean;
  bowLockedTarget: {
    label: string;
    kind: 'hunter' | 'boss' | 'animal';
    distance: number;
    hp: number;
    maxHp: number;
    isHostile: boolean;
  } | null;
  damagePopups?: CombatDamagePopup[];
  engineReady?: boolean;
  fpsEstimate?: number;
}

export interface DailyLoginRewardSpec {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  subtitle: string;
  rarity: ItemRarity;
  resources: Partial<ResourceCounts>;
  craftItems: Partial<Record<CraftItemId, number>>;
}

export interface DailyLoginState {
  streakDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  canClaimToday: boolean;
  claimedToday: boolean;
  lastClaimedDateKey: string | null;
  totalDaysClaimed: number;
  todayReward: DailyLoginRewardSpec;
  schedule: DailyLoginRewardSpec[];
}

export type SaveSlotId = 'autosave' | 'slot1' | 'slot2' | 'slot3';

export interface SavedGameSlot {
  slotId: SaveSlotId;
  label: string;
  savedAt: string;
  zone: ZoneId;
  zoneName: string;
  cabinTier: number;
  dayNumber: number;
  timeOfDay: number;
  weather: WeatherKind;
  weatherTimer: number;
  endlessMode: boolean;
  victory: boolean;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  hp: number;
  maxHp: number;
  warmth: number;
  maxWarmth: number;
  activeTool: ActiveTool;
  resources: ResourceCounts;
  levels: UpgradeLevels;
  gear: GearLevels;
  unlockedGear: GearLevels;
  wingsTier: number;
  wingsEquipped: boolean;
  backpackInventory: BackpackInventoryMap;
  activeBuffs: ActiveCraftBuffs;
  stats: RunStats;
  tamedPets: TamedPetRecord[];
  activePetUid: string | null;
  rareMaterials?: RareMaterialMap;
  unlockedAscensions?: MythicAscensionId[];
  equippedAscension?: MythicAscensionId | null;
}

export type SaveSlotsMap = Record<SaveSlotId, SavedGameSlot | null>;



