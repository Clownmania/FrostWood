import {
  type LootScalingContext,
  ZONE_LOOT_MULTIPLIER,
  compareItemRarity,
  computePlayerLootProgression,
  rollWeightedLootItems,
} from './loot';
import {
  CITY_CENTER_X,
  CITY_CENTER_Z,
  LEVEL2_CENTER_Z,
  LEVEL3_CENTER_X,
  LEVEL3_CENTER_Z,
  LEVEL4_CENTER_X,
  LEVEL4_CENTER_Z,
  LEVEL5_CENTER_X,
  LEVEL5_CENTER_Z,
} from './zones';
import type {
  BossAttackKind,
  BossAttackPatternId,
  CraftItemId,
  ItemRarity,
  LootDroppedItem,
  ResourceCounts,
  ZoneBossId,
  ZoneId,
} from './types';

export interface BossAttackPatternSpec {
  id: BossAttackPatternId;
  label: string;
  kind: BossAttackKind;
  windupSeconds: number;
  cooldownSeconds: number;
  damage: number;
  warmthDrain: number;
  radius: number;
  enragedRadius: number;
  projectileCount: number;
  enragedProjectileCount: number;
  projectileSpreadRad: number;
  projectileSpeed: number;
  chargeSpeed: number;
  minRange: number;
  maxRange: number;
  phase2Only?: boolean;
  telegraphColorHex: number;
}

export interface BossRewardDropSpec {
  gold: number;
  wood: number;
  stone: number;
  pelts: number;
  meat: number;
  ice: number;
  huntingXp: number;
  items: Array<{ id: CraftItemId; qty: number }>;
}

export interface ZoneBossSpec {
  id: ZoneBossId;
  zone: ZoneId;
  name: string;
  title: string;
  arenaName: string;
  arenaX: number;
  arenaZ: number;
  arenaRadius: number;
  engageRadius: number;
  leashRadius: number;
  maxHp: number;
  moveSpeed: number;
  enrageMoveMult: number;
  enrageCooldownMult: number;
  enrageDamageMult: number;
  respawnSeconds: number;
  primaryColorHex: number;
  accentColorHex: number;
  telegraphColorHex: number;
  elementalAuraType: 'root_snare' | 'cryo_blizzard' | 'abyssal_frost' | 'caldera_heat' | 'supernova_zero' | 'magma_forge';
  auraRadius: number;
  auraColorHex: number;
  auraEffectLabel: string;
  patterns: BossAttackPatternSpec[];
  reward: BossRewardDropSpec;
}

export const BOSS_RESPAWN_SECONDS = 120;
export const BOSS_HUD_DETECT_RADIUS = 52;

export const ZONE_BOSS_SPECS: Record<ZoneBossId, ZoneBossSpec> = {
  skarn_colossus: {
    id: 'skarn_colossus',
    zone: 'level1',
    name: 'Skarn, Boreal Root-Warden',
    title: 'Ancient Elderwood Titan · 1x Zone Boss',
    arenaName: 'Elderwood Hollow',
    arenaX: -68,
    arenaZ: -42,
    arenaRadius: 24,
    engageRadius: 26,
    leashRadius: 38,
    maxHp: 780,
    moveSpeed: 3.15,
    enrageMoveMult: 1.28,
    enrageCooldownMult: 0.72,
    enrageDamageMult: 1.25,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x3b2f26,
    accentColorHex: 0xf59e0b,
    telegraphColorHex: 0xf59e0b,
    elementalAuraType: 'root_snare',
    auraRadius: 10.5,
    auraColorHex: 0xf59e0b,
    auraEffectLabel: 'Root Entanglement (Movement Slow & Stamina Drain)',
    patterns: [
      {
        id: 'root_slam',
        label: 'Seismic Root Slam',
        kind: 'aoe',
        windupSeconds: 0.7,
        cooldownSeconds: 2.3,
        damage: 30,
        warmthDrain: 0,
        radius: 5.0,
        enragedRadius: 6.2,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 6.2,
        telegraphColorHex: 0xf59e0b,
      },
      {
        id: 'bark_barrage',
        label: 'Amber Thorn Volley',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.5,
        damage: 20,
        warmthDrain: 4,
        radius: 3.0,
        enragedRadius: 3.4,
        projectileCount: 3,
        enragedProjectileCount: 5,
        projectileSpreadRad: 0.72,
        projectileSpeed: 15.5,
        chargeSpeed: 0,
        minRange: 3.5,
        maxRange: 25,
        telegraphColorHex: 0xfbbf24,
      },
      {
        id: 'tremor_charge',
        label: 'Timber Tremor Charge',
        kind: 'charge',
        windupSeconds: 0.65,
        cooldownSeconds: 3.1,
        damage: 34,
        warmthDrain: 0,
        radius: 3.2,
        enragedRadius: 3.8,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 15.5,
        minRange: 4.0,
        maxRange: 22,
        telegraphColorHex: 0xf97316,
      },
      {
        id: 'briar_fissure_cross',
        label: 'Briar Fissure Cross',
        kind: 'cross_eruption',
        windupSeconds: 0.78,
        cooldownSeconds: 2.8,
        damage: 32,
        warmthDrain: 5,
        radius: 3.1,
        enragedRadius: 3.6,
        projectileCount: 4,
        enragedProjectileCount: 8,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 20,
        telegraphColorHex: 0xd97706,
      },
    ],
    reward: {
      gold: 450,
      wood: 85,
      stone: 30,
      pelts: 28,
      meat: 16,
      ice: 6,
      huntingXp: 65,
      items: [
        { id: 'frost_trap', qty: 1 },
        { id: 'frost_whetstone', qty: 1 },
        { id: 'mammoth_tonic', qty: 1 },
      ],
    },
  },
  veyra_sovereign: {
    id: 'veyra_sovereign',
    zone: 'level2',
    name: 'Veyra, Cryo-Sovereign',
    title: 'Highland Glacial Empress · 3x Zone Boss',
    arenaName: 'Frostspire Summit',
    arenaX: 0,
    arenaZ: LEVEL2_CENTER_Z - 74, // z = -414
    arenaRadius: 24,
    engageRadius: 26,
    leashRadius: 38,
    maxHp: 1480,
    moveSpeed: 3.45,
    enrageMoveMult: 1.32,
    enrageCooldownMult: 0.68,
    enrageDamageMult: 1.28,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x0c4a6e,
    accentColorHex: 0x67e8f9,
    telegraphColorHex: 0x38bdf8,
    elementalAuraType: 'cryo_blizzard',
    auraRadius: 11.0,
    auraColorHex: 0x38bdf8,
    auraEffectLabel: 'Absolute Zero Aura (Rapid Warmth Drain)',
    patterns: [
      {
        id: 'blizzard_nova',
        label: 'Absolute Blizzard Nova',
        kind: 'aoe',
        windupSeconds: 0.75,
        cooldownSeconds: 2.4,
        damage: 34,
        warmthDrain: 18,
        radius: 6.4,
        enragedRadius: 7.6,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 7.6,
        telegraphColorHex: 0x38bdf8,
      },
      {
        id: 'glacial_volley',
        label: 'Glacial Lance Fan',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.3,
        damage: 25,
        warmthDrain: 8,
        radius: 3.2,
        enragedRadius: 3.8,
        projectileCount: 5,
        enragedProjectileCount: 7,
        projectileSpreadRad: 0.96,
        projectileSpeed: 18.0,
        chargeSpeed: 0,
        minRange: 3.0,
        maxRange: 27,
        telegraphColorHex: 0x7dd3fc,
      },
      {
        id: 'meteor_shards',
        label: 'Celestial Spire Barrage',
        kind: 'meteor',
        windupSeconds: 0.95,
        cooldownSeconds: 3.2,
        damage: 38,
        warmthDrain: 12,
        radius: 3.2,
        enragedRadius: 3.2,
        projectileCount: 2,
        enragedProjectileCount: 3,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 26,
        telegraphColorHex: 0xc084fc,
      },
      {
        id: 'cryo_ring_tempest',
        label: 'Cryo-Ring Tempest',
        kind: 'ring_wave',
        windupSeconds: 0.82,
        cooldownSeconds: 2.7,
        damage: 36,
        warmthDrain: 16,
        radius: 3.0,
        enragedRadius: 3.5,
        projectileCount: 6,
        enragedProjectileCount: 8,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 24,
        telegraphColorHex: 0x06b6d4,
      },
    ],
    reward: {
      gold: 920,
      wood: 65,
      stone: 60,
      pelts: 42,
      meat: 24,
      ice: 16,
      huntingXp: 120,
      items: [
        { id: 'aurora_charm', qty: 1 },
        { id: 'mammoth_tonic', qty: 1 },
        { id: 'frost_trap', qty: 1 },
      ],
    },
  },
  malakor_gargoyle: {
    id: 'malakor_gargoyle',
    zone: 'level3',
    name: 'Malakor, Rimefang Dread-Wyrm',
    title: 'Abyssal Glacier Overlord · 9x Zone Boss',
    arenaName: 'Rimefang Trench Citadel',
    arenaX: LEVEL3_CENTER_X - 72, // x = -392
    arenaZ: LEVEL3_CENTER_Z - 42, // z = -382
    arenaRadius: 25,
    engageRadius: 27,
    leashRadius: 40,
    maxHp: 2650,
    moveSpeed: 3.65,
    enrageMoveMult: 1.35,
    enrageCooldownMult: 0.66,
    enrageDamageMult: 1.32,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x1e1b4b,
    accentColorHex: 0x818cf8,
    telegraphColorHex: 0x6366f1,
    elementalAuraType: 'abyssal_frost',
    auraRadius: 11.5,
    auraColorHex: 0x6366f1,
    auraEffectLabel: 'Abyssal Rime Aura (Armor Vulnerability & Cold Drain)',
    patterns: [
      {
        id: 'rimefang_shatter',
        label: 'Rimefang Shatter Nova',
        kind: 'aoe',
        windupSeconds: 0.72,
        cooldownSeconds: 2.2,
        damage: 44,
        warmthDrain: 24,
        radius: 6.8,
        enragedRadius: 8.0,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 8.0,
        telegraphColorHex: 0x818cf8,
      },
      {
        id: 'abyssal_icicles',
        label: 'Abyssal Icicle Volley',
        kind: 'projectile_fan',
        windupSeconds: 0.52,
        cooldownSeconds: 2.2,
        damage: 32,
        warmthDrain: 14,
        radius: 3.4,
        enragedRadius: 4.0,
        projectileCount: 6,
        enragedProjectileCount: 8,
        projectileSpreadRad: 1.15,
        projectileSpeed: 19.2,
        chargeSpeed: 0,
        minRange: 3.0,
        maxRange: 28,
        telegraphColorHex: 0xa5b4fc,
      },
      {
        id: 'wyrm_glaive_rush',
        label: 'Dread-Wyrm Glaive Rush',
        kind: 'charge',
        windupSeconds: 0.62,
        cooldownSeconds: 2.8,
        damage: 48,
        warmthDrain: 16,
        radius: 3.6,
        enragedRadius: 4.2,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 17.5,
        minRange: 4.0,
        maxRange: 24,
        telegraphColorHex: 0x6366f1,
      },
      {
        id: 'abyssal_void_ring',
        label: 'Abyssal Void Ring',
        kind: 'ring_wave',
        windupSeconds: 0.8,
        cooldownSeconds: 2.6,
        damage: 46,
        warmthDrain: 20,
        radius: 3.2,
        enragedRadius: 3.8,
        projectileCount: 6,
        enragedProjectileCount: 8,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 25,
        telegraphColorHex: 0x4f46e5,
      },
    ],
    reward: {
      gold: 1650,
      wood: 95,
      stone: 85,
      pelts: 65,
      meat: 36,
      ice: 28,
      huntingXp: 210,
      items: [
        { id: 'aurora_charm', qty: 1 },
        { id: 'frost_whetstone', qty: 2 },
        { id: 'mammoth_tonic', qty: 1 },
      ],
    },
  },
  ulthar_behemoth: {
    id: 'ulthar_behemoth',
    zone: 'level4',
    name: 'Ulthar, Obsidian Behemoth',
    title: 'Permafrost Caldera Colossus · 27x Zone Boss',
    arenaName: 'Obsidian Caldera Throne',
    arenaX: LEVEL4_CENTER_X - 66, // x = -386
    arenaZ: LEVEL4_CENTER_Z + 56, // z = 56
    arenaRadius: 26,
    engageRadius: 28,
    leashRadius: 42,
    maxHp: 5400,
    moveSpeed: 3.8,
    enrageMoveMult: 1.38,
    enrageCooldownMult: 0.64,
    enrageDamageMult: 1.36,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x27171c,
    accentColorHex: 0xf43f5e,
    telegraphColorHex: 0xe11d48,
    elementalAuraType: 'caldera_heat',
    auraRadius: 12.0,
    auraColorHex: 0xf43f5e,
    auraEffectLabel: 'Permafrost Caldera Aura (Thermal Burn & Quake Hazard)',
    patterns: [
      {
        id: 'tectonic_permafrost',
        label: 'Permafrost Tectonic Quake',
        kind: 'aoe',
        windupSeconds: 0.7,
        cooldownSeconds: 2.1,
        damage: 56,
        warmthDrain: 30,
        radius: 7.2,
        enragedRadius: 8.4,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 8.4,
        telegraphColorHex: 0xf43f5e,
      },
      {
        id: 'obsidian_comets',
        label: 'Obsidian Comet Rain',
        kind: 'meteor',
        windupSeconds: 0.88,
        cooldownSeconds: 2.8,
        damage: 52,
        warmthDrain: 22,
        radius: 3.5,
        enragedRadius: 3.8,
        projectileCount: 3,
        enragedProjectileCount: 4,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 28,
        telegraphColorHex: 0xfb7185,
      },
      {
        id: 'monolith_crush',
        label: 'Glacial Monolith Crush',
        kind: 'leap',
        windupSeconds: 0.8,
        cooldownSeconds: 2.7,
        damage: 62,
        warmthDrain: 20,
        radius: 4.0,
        enragedRadius: 4.8,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 18.2,
        minRange: 3.5,
        maxRange: 23,
        telegraphColorHex: 0xe11d48,
      },
      {
        id: 'caldera_cross_eruption',
        label: 'Caldera Cross Eruption',
        kind: 'cross_eruption',
        windupSeconds: 0.76,
        cooldownSeconds: 2.5,
        damage: 58,
        warmthDrain: 24,
        radius: 3.4,
        enragedRadius: 4.0,
        projectileCount: 4,
        enragedProjectileCount: 8,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 26,
        telegraphColorHex: 0xf43f5e,
      },
    ],
    reward: {
      gold: 3100,
      wood: 140,
      stone: 125,
      pelts: 95,
      meat: 55,
      ice: 46,
      huntingXp: 380,
      items: [
        { id: 'aurora_charm', qty: 2 },
        { id: 'mammoth_tonic', qty: 2 },
        { id: 'frost_trap', qty: 2 },
      ],
    },
  },
  astraea_valkyrie: {
    id: 'astraea_valkyrie',
    zone: 'level5',
    name: 'Astraea, Starfall Eternal Monarch',
    title: 'Sovereign of Absolute Zero · 81x Zone Boss',
    arenaName: 'Sanctum of Eternal Zero',
    arenaX: LEVEL5_CENTER_X + 68, // x = 388
    arenaZ: LEVEL5_CENTER_Z - 48, // z = -388
    arenaRadius: 27,
    engageRadius: 29,
    leashRadius: 44,
    maxHp: 11200,
    moveSpeed: 4.0,
    enrageMoveMult: 1.42,
    enrageCooldownMult: 0.62,
    enrageDamageMult: 1.4,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x2e1065,
    accentColorHex: 0xe879f9,
    telegraphColorHex: 0xd946ef,
    elementalAuraType: 'supernova_zero',
    auraRadius: 12.5,
    auraColorHex: 0xd946ef,
    auraEffectLabel: 'Supernova Starlight Aura (Severe Cold & Starlight Slow)',
    patterns: [
      {
        id: 'supernova_cataclysm',
        label: 'Supernova Zero Cataclysm',
        kind: 'aoe',
        windupSeconds: 0.72,
        cooldownSeconds: 2.0,
        damage: 72,
        warmthDrain: 38,
        radius: 7.6,
        enragedRadius: 8.8,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 8.8,
        telegraphColorHex: 0xe879f9,
      },
      {
        id: 'starfall_spiral',
        label: 'Starfall Lance Spiral',
        kind: 'projectile_fan',
        windupSeconds: 0.5,
        cooldownSeconds: 2.1,
        damage: 54,
        warmthDrain: 24,
        radius: 3.6,
        enragedRadius: 4.2,
        projectileCount: 8,
        enragedProjectileCount: 10,
        projectileSpreadRad: Math.PI * 2,
        projectileSpeed: 20.5,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 29,
        telegraphColorHex: 0xf0abfc,
      },
      {
        id: 'void_aurora_judgment',
        label: 'Void-Aurora Judgment',
        kind: 'meteor',
        windupSeconds: 0.85,
        cooldownSeconds: 2.6,
        damage: 68,
        warmthDrain: 32,
        radius: 3.8,
        enragedRadius: 4.2,
        projectileCount: 4,
        enragedProjectileCount: 5,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 30,
        telegraphColorHex: 0xc084fc,
      },
      {
        id: 'starfall_nova_matrix',
        label: 'Starfall Nova Matrix',
        kind: 'ring_wave',
        windupSeconds: 0.78,
        cooldownSeconds: 2.4,
        damage: 70,
        warmthDrain: 34,
        radius: 3.5,
        enragedRadius: 4.1,
        projectileCount: 8,
        enragedProjectileCount: 10,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 28,
        telegraphColorHex: 0xd946ef,
      },
    ],
    reward: {
      gold: 5800,
      wood: 220,
      stone: 190,
      pelts: 150,
      meat: 85,
      ice: 80,
      huntingXp: 680,
      items: [
        { id: 'aurora_charm', qty: 2 },
        { id: 'mammoth_tonic', qty: 2 },
        { id: 'frost_whetstone', qty: 2 },
      ],
    },
  },
  ignis_warden: {
    id: 'ignis_warden',
    zone: 'city',
    name: 'Ignis, Pit-Forged Warden',
    title: 'Obsidian Cavern Champion · City Trial Boss',
    arenaName: 'Obsidian Trial Arena',
    arenaX: CITY_CENTER_X + 62, // x = 346
    arenaZ: CITY_CENTER_Z,
    arenaRadius: 18,
    engageRadius: 20,
    leashRadius: 26,
    maxHp: 1020,
    moveSpeed: 3.55,
    enrageMoveMult: 1.3,
    enrageCooldownMult: 0.7,
    enrageDamageMult: 1.26,
    respawnSeconds: BOSS_RESPAWN_SECONDS,
    primaryColorHex: 0x332b36,
    accentColorHex: 0xff6b2c,
    telegraphColorHex: 0xf97316,
    elementalAuraType: 'magma_forge',
    auraRadius: 10.0,
    auraColorHex: 0xf97316,
    auraEffectLabel: 'Magma Forge Aura (Molten Heat Damage)',
    patterns: [
      {
        id: 'magma_cleave',
        label: 'Anvil Shockwave Cleave',
        kind: 'aoe',
        windupSeconds: 0.65,
        cooldownSeconds: 2.1,
        damage: 34,
        warmthDrain: 0,
        radius: 5.2,
        enragedRadius: 6.4,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 6.4,
        telegraphColorHex: 0xf97316,
      },
      {
        id: 'ember_spiral',
        label: 'Forge Ember Ring',
        kind: 'projectile_fan',
        windupSeconds: 0.55,
        cooldownSeconds: 2.4,
        damage: 22,
        warmthDrain: 0,
        radius: 3.2,
        enragedRadius: 3.6,
        projectileCount: 6,
        enragedProjectileCount: 8,
        projectileSpreadRad: Math.PI * 2,
        projectileSpeed: 15.0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 20,
        telegraphColorHex: 0xfb923c,
      },
      {
        id: 'leap_slam',
        label: 'Molten Vault Slam',
        kind: 'leap',
        windupSeconds: 0.85,
        cooldownSeconds: 2.9,
        damage: 38,
        warmthDrain: 0,
        radius: 3.6,
        enragedRadius: 4.3,
        projectileCount: 0,
        enragedProjectileCount: 0,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 16.5,
        minRange: 3.5,
        maxRange: 19,
        telegraphColorHex: 0xef4444,
      },
      {
        id: 'forge_cinder_cross',
        label: 'Forge Cinder Cross',
        kind: 'cross_eruption',
        windupSeconds: 0.72,
        cooldownSeconds: 2.6,
        damage: 35,
        warmthDrain: 0,
        radius: 3.0,
        enragedRadius: 3.5,
        projectileCount: 4,
        enragedProjectileCount: 8,
        projectileSpreadRad: 0,
        projectileSpeed: 0,
        chargeSpeed: 0,
        minRange: 0,
        maxRange: 19,
        telegraphColorHex: 0xea580c,
      },
    ],
    reward: {
      gold: 760,
      wood: 45,
      stone: 55,
      pelts: 35,
      meat: 20,
      ice: 10,
      huntingXp: 95,
      items: [
        { id: 'mammoth_tonic', qty: 1 },
        { id: 'hammer_temper', qty: 1 },
        { id: 'clockwork_gear', qty: 2 },
      ],
    },
  },
};

export const ZONE_BOSS_ORDER: ZoneBossId[] = [
  'skarn_colossus',
  'veyra_sovereign',
  'malakor_gargoyle',
  'ulthar_behemoth',
  'astraea_valkyrie',
  'ignis_warden',
];

export const ZONE_BOSS_BY_ZONE: Record<ZoneId, ZoneBossId> = {
  level1: 'skarn_colossus',
  level2: 'veyra_sovereign',
  level3: 'malakor_gargoyle',
  level4: 'ulthar_behemoth',
  level5: 'astraea_valkyrie',
  city: 'ignis_warden',
};

export function getZoneBossSpec(zone: ZoneId): ZoneBossSpec {
  return ZONE_BOSS_SPECS[ZONE_BOSS_BY_ZONE[zone]];
}

export function isBossEnraged(hp: number, maxHp: number): boolean {
  if (maxHp <= 0) return false;
  return hp > 0 && hp <= maxHp * 0.5;
}

export function selectNextBossAttack(
  spec: ZoneBossSpec,
  distToPlayer: number,
  enraged: boolean,
  patternIndex: number,
): BossAttackPatternSpec {
  const eligible = spec.patterns.filter((p) => {
    if (p.phase2Only && !enraged) return false;
    const rangeCap = enraged ? p.maxRange + 1.5 : p.maxRange;
    return distToPlayer >= p.minRange && distToPlayer <= rangeCap;
  });
  const pool = eligible.length > 0 ? eligible : spec.patterns;
  const idx = ((patternIndex % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

export function computeArenaContainment(
  x: number,
  z: number,
  spec: ZoneBossSpec,
): { x: number; z: number; leashed: boolean } {
  const dx = x - spec.arenaX;
  const dz = z - spec.arenaZ;
  const dist = Math.hypot(dx, dz);
  if (dist <= spec.leashRadius || dist < 0.0001) {
    return { x, z, leashed: false };
  }
  const scale = spec.leashRadius / dist;
  return {
    x: spec.arenaX + dx * scale,
    z: spec.arenaZ + dz * scale,
    leashed: true,
  };
}

export function rollMeteorTargets(
  playerX: number,
  playerZ: number,
  count: number,
  spec: ZoneBossSpec,
  rng: () => number = Math.random,
): Array<{ x: number; z: number }> {
  const targets: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < count; i++) {
    let rawX = playerX;
    let rawZ = playerZ;
    if (i > 0) {
      const a = rng() * Math.PI * 2;
      const offset = 3.2 + rng() * 3.4;
      rawX += Math.cos(a) * offset;
      rawZ += Math.sin(a) * offset;
    }
    const clamped = computeArenaContainment(rawX, rawZ, spec);
    targets.push({ x: clamped.x, z: clamped.z });
  }
  return targets;
}

/**
 * Generates multi-node ground hazard coordinates for tactical AoE spells:
 * - 'cross_eruption': cardinal + diagonal fissure lines radiating from boss toward player
 * - 'ring_wave': concentric shockwave ring nodes around the boss / player
 */
export function rollTacticalAoEPatternPoints(
  kind: 'cross_eruption' | 'ring_wave',
  bossX: number,
  bossZ: number,
  playerX: number,
  playerZ: number,
  enraged: boolean,
  spec: ZoneBossSpec,
): Array<{ x: number; z: number; radiusScale: number }> {
  const points: Array<{ x: number; z: number; radiusScale: number }> = [];
  const baseAngle = Math.atan2(playerX - bossX, playerZ - bossZ);

  if (kind === 'cross_eruption') {
    const armCount = enraged ? 8 : 4;
    const stepsPerArm = 2;
    for (let arm = 0; arm < armCount; arm++) {
      const angle = baseAngle + (arm / armCount) * Math.PI * 2;
      for (let step = 1; step <= stepsPerArm; step++) {
        const dist = step * 4.4;
        const rawX = bossX + Math.sin(angle) * dist;
        const rawZ = bossZ + Math.cos(angle) * dist;
        const clamped = computeArenaContainment(rawX, rawZ, spec);
        points.push({
          x: clamped.x,
          z: clamped.z,
          radiusScale: step === 1 ? 0.9 : 1.08,
        });
      }
    }
    return points;
  }

  // 'ring_wave': concentric ring around the boss plus a player-tracking outer node
  const nodeCount = enraged ? 8 : 6;
  const ringRadius = enraged ? 6.8 : 5.6;
  for (let i = 0; i < nodeCount; i++) {
    const angle = baseAngle + (i / nodeCount) * Math.PI * 2;
    const rawX = bossX + Math.sin(angle) * ringRadius;
    const rawZ = bossZ + Math.cos(angle) * ringRadius;
    const clamped = computeArenaContainment(rawX, rawZ, spec);
    points.push({ x: clamped.x, z: clamped.z, radiusScale: 0.95 });
  }
  const playerClamped = computeArenaContainment(playerX, playerZ, spec);
  points.push({ x: playerClamped.x, z: playerClamped.z, radiusScale: 1.1 });
  return points;
}

export interface BossTacticalMovementInput {
  spec: ZoneBossSpec;
  bossX: number;
  bossZ: number;
  playerX: number;
  playerZ: number;
  playerVx: number;
  playerVz: number;
  enraged: boolean;
  cooldownLeft: number;
  strafeSign: -1 | 1;
  animPhase: number;
}

export interface BossTacticalMovementResult {
  vx: number;
  vz: number;
  desiredYaw: number;
  strideSpeed: number;
  tacticLabel: string;
}

/**
 * Computes realistic tactical AI positioning during combat:
 * - Caster sovereigns ('veyra_sovereign', 'astraea_valkyrie') kite backward and orbit-strafe when crowded while spells recharge.
 * - Melee/Juggernaut bosses lead the player's velocity vector ('Intercept Rush') when closing gap, and flank-strafe ('Flank Orbit') at mid-range between attacks.
 */
export function computeBossTacticalMovement(
  input: BossTacticalMovementInput,
): BossTacticalMovementResult {
  const {
    spec,
    bossX,
    bossZ,
    playerX,
    playerZ,
    playerVx,
    playerVz,
    enraged,
    cooldownLeft,
    strafeSign,
    animPhase,
  } = input;

  const dx = playerX - bossX;
  const dz = playerZ - bossZ;
  const dist = Math.hypot(dx, dz);
  const norm = Math.max(0.001, dist);
  const dirX = dx / norm;
  const dirZ = dz / norm;
  // Perpendicular unit vector for flank strafing
  const perpX = -dirZ * strafeSign;
  const perpZ = dirX * strafeSign;

  const baseSpeed = spec.moveSpeed * (enraged ? spec.enrageMoveMult : 1);
  const isCaster =
    spec.id === 'veyra_sovereign' || spec.id === 'astraea_valkyrie';

  let moveX = 0;
  let moveZ = 0;
  let tacticLabel = 'Closing Range';

  if (isCaster && dist < 4.5 && cooldownLeft > 0.35) {
    // Tactical Retreat / Kite while weaving sideways
    moveX = (-dirX * 0.72 + perpX * 0.68) * baseSpeed * 0.95;
    moveZ = (-dirZ * 0.72 + perpZ * 0.68) * baseSpeed * 0.95;
    tacticLabel = 'Tactical Kite';
  } else if (dist >= 3.2 && dist <= 7.8 && cooldownLeft > 0.45) {
    // Mid-range Flank Orbit: circle-strafe around the player with subtle radial adjustment
    const idealDist = isCaster ? 6.2 : 4.2;
    const radialPush = Math.max(-0.55, Math.min(0.65, (dist - idealDist) * 0.35));
    moveX = (dirX * radialPush + perpX * 0.88) * baseSpeed * 0.92;
    moveZ = (dirZ * radialPush + perpZ * 0.88) * baseSpeed * 0.92;
    tacticLabel = 'Flank Orbit';
  } else if (dist > 3.1) {
    // Predictive Intercept Rush: lead the player's current velocity vector
    const leadSeconds = Math.min(0.65, dist / Math.max(4, baseSpeed * 2.4));
    const interceptX = playerX + playerVx * leadSeconds;
    const interceptZ = playerZ + playerVz * leadSeconds;
    const idx = interceptX - bossX;
    const idz = interceptZ - bossZ;
    const inorm = Math.max(0.001, Math.hypot(idx, idz));
    const weave = Math.sin(animPhase * 1.4) * 0.22;
    moveX = (idx / inorm + perpX * weave) * baseSpeed;
    moveZ = (idz / inorm + perpZ * weave) * baseSpeed;
    tacticLabel = Math.hypot(playerVx, playerVz) > 1.2 ? 'Intercept Rush' : 'Closing Range';
  } else {
    // Close combat micro-footwork
    moveX = perpX * baseSpeed * 0.45;
    moveZ = perpZ * baseSpeed * 0.45;
    tacticLabel = 'Close Press';
  }

  const strideSpeed = Math.hypot(moveX, moveZ);
  // Face the player with slight lead toward velocity when rushing
  const desiredYaw = Math.atan2(dx + moveX * 0.12, dz + moveZ * 0.12);

  return {
    vx: moveX,
    vz: moveZ,
    desiredYaw,
    strideSpeed,
    tacticLabel,
  };
}

export interface BossKinematicPose {
  leftLegX: number;
  rightLegX: number;
  leftLegZ: number;
  rightLegZ: number;
  leftArmX: number;
  rightArmX: number;
  leftArmZ: number;
  rightArmZ: number;
  bodyY: number;
  bodyPitchX: number;
  bodyRollZ: number;
  headYawY: number;
  headPitchX: number;
}

/**
 * Computes articulated procedural animation angles for boss legs, arms, torso, and head
 * so movement, windups, AoE casts, and charges read with weight and biomechanical momentum.
 */
export function computeBossKinematicPose(params: {
  bossId: ZoneBossId;
  state: 'idle' | 'engage' | 'telegraph' | 'attack' | 'recover' | 'ko';
  attackKind: BossAttackKind | null;
  animPhase: number;
  strideSpeed: number;
  stateTimer: number;
  windupSeconds: number;
  enraged: boolean;
}): BossKinematicPose {
  const {
    bossId,
    state,
    attackKind,
    animPhase,
    strideSpeed,
    stateTimer,
    windupSeconds,
    enraged,
  } = params;

  const isLevitating =
    bossId === 'veyra_sovereign' || bossId === 'astraea_valkyrie';
  const baseBodyY = isLevitating ? 0.35 : 0;
  const speedRatio = Math.min(1.6, strideSpeed / 3.4);

  if (state === 'ko') {
    return {
      leftLegX: 0,
      rightLegX: 0,
      leftLegZ: 0,
      rightLegZ: 0,
      leftArmX: 0.4,
      rightArmX: 0.4,
      leftArmZ: 0,
      rightArmZ: 0,
      bodyY: baseBodyY,
      bodyPitchX: 0.35,
      bodyRollZ: 0,
      headYawY: 0,
      headPitchX: 0.3,
    };
  }

  // Alternating stride cycle
  const strideAngle = animPhase * (isLevitating ? 1.1 : 1.55);
  const strideSin = Math.sin(strideAngle);
  const strideCos = Math.cos(strideAngle);

  let leftLegX = strideSin * 0.56 * speedRatio;
  let rightLegX = -strideSin * 0.56 * speedRatio;
  let leftLegZ = -0.04 * speedRatio;
  let rightLegZ = 0.04 * speedRatio;

  let leftArmX = -strideSin * 0.46 * Math.max(0.3, speedRatio);
  let rightArmX = strideSin * 0.46 * Math.max(0.3, speedRatio);
  let leftArmZ = -0.1 - (enraged ? 0.08 : 0);
  let rightArmZ = 0.1 + (enraged ? 0.08 : 0);

  // Double-frequency vertical footfall bounce on each step
  const stepBounce = isLevitating
    ? Math.sin(animPhase * 0.9) * 0.16
    : Math.abs(strideCos) * 0.14 * Math.max(0.35, speedRatio);
  let bodyY = baseBodyY + stepBounce;
  // Forward lean into movement + hip roll weight shift
  let bodyPitchX = Math.min(0.24, speedRatio * 0.14);
  let bodyRollZ = strideSin * 0.075 * speedRatio;
  let headYawY = Math.sin(animPhase * 0.55) * 0.12;
  let headPitchX = -bodyPitchX * 0.55;

  if (state === 'telegraph') {
    const progress = Math.max(
      0,
      Math.min(1, 1 - stateTimer / Math.max(0.1, windupSeconds)),
    );
    const tremor = Math.sin(animPhase * 9) * 0.06 * progress;

    if (attackKind === 'cross_eruption' || attackKind === 'aoe') {
      // Deep wide stance + both arms raised high overhead to slam the ground
      leftLegX = -0.32 * progress;
      rightLegX = 0.32 * progress;
      leftLegZ = -0.14;
      rightLegZ = 0.14;
      leftArmX = -2.25 * progress + tremor;
      rightArmX = -2.25 * progress - tremor;
      leftArmZ = -0.38 * progress;
      rightArmZ = 0.38 * progress;
      bodyY = baseBodyY - 0.18 * progress;
      bodyPitchX = -0.18 * progress;
      headPitchX = -0.25 * progress;
    } else if (attackKind === 'ring_wave' || attackKind === 'meteor') {
      // Levitating arcane invocation: arms spread wide into an X-crucible, torso rises
      leftLegX = 0.18 * progress;
      rightLegX = -0.18 * progress;
      leftArmX = -1.65 * progress;
      rightArmX = -1.85 * progress;
      leftArmZ = -0.82 * progress + tremor;
      rightArmZ = 0.82 * progress - tremor;
      bodyY = baseBodyY + 0.36 * progress;
      bodyPitchX = -0.14 * progress;
      headPitchX = -0.32 * progress;
    } else if (attackKind === 'charge' || attackKind === 'leap') {
      // Coiled predator crouch before lunging
      leftLegX = -0.58 * progress;
      rightLegX = 0.48 * progress;
      leftArmX = 0.72 * progress;
      rightArmX = -1.35 * progress;
      bodyY = baseBodyY - 0.26 * progress;
      bodyPitchX = 0.32 * progress;
      headPitchX = -0.22 * progress;
    } else {
      // Projectile fan windup: sweeping arm draw
      leftArmX = -1.45 * progress;
      rightArmX = -1.65 * progress;
      leftArmZ = -0.45 * progress;
      rightArmZ = 0.45 * progress;
      bodyPitchX = -0.1 * progress;
    }
  } else if (state === 'attack') {
    // Active charge / leap rush pose: aggressive forward drive + rapid pump
    leftLegX = Math.sin(animPhase * 2.4) * 0.78;
    rightLegX = -Math.sin(animPhase * 2.4) * 0.78;
    leftArmX = -0.95 + Math.cos(animPhase * 2.4) * 0.35;
    rightArmX = -1.15 - Math.cos(animPhase * 2.4) * 0.35;
    bodyPitchX = 0.28;
    bodyRollZ = Math.sin(animPhase * 2.4) * 0.1;
  } else if (state === 'recover') {
    // Follow-through slam impact pose settling back to neutral
    const settle = Math.max(0, Math.min(1, stateTimer / 0.55));
    leftLegX = -0.25 * settle;
    rightLegX = 0.28 * settle;
    leftArmX = 0.55 * settle;
    rightArmX = 0.65 * settle;
    bodyY = baseBodyY - 0.14 * settle;
    bodyPitchX = 0.22 * settle;
    headPitchX = 0.15 * settle;
  }

  return {
    leftLegX,
    rightLegX,
    leftLegZ,
    rightLegZ,
    leftArmX,
    rightArmX,
    leftArmZ,
    rightArmZ,
    bodyY,
    bodyPitchX,
    bodyRollZ,
    headYawY,
    headPitchX,
  };
}

export function computeBossLootReward(
  spec: ZoneBossSpec,
  context?: LootScalingContext,
  rng: () => number = Math.random,
): {
  resourcesDelta: ResourceCounts;
  huntingXp: number;
  items: LootDroppedItem[];
  lootTierLabel: string;
  effectiveGearLevel: number;
  resourceMultiplier: number;
  highestRarity: ItemRarity;
} {
  const effectiveContext: LootScalingContext = {
    ...context,
    zone: context?.zone ?? spec.zone,
  };
  const prog = computePlayerLootProgression(effectiveContext);
  const zoneRatio =
    ZONE_LOOT_MULTIPLIER[prog.zone] / Math.max(0.1, ZONE_LOOT_MULTIPLIER[spec.zone]);
  const gearScale = 1 + prog.gearProgress * 0.65;
  const variance = 1 + Math.max(0, Math.min(1, rng())) * 0.08;
  const rewardScale = zoneRatio * gearScale * variance;

  const slotCount =
    3 +
    (prog.effectiveGearLevel >= 3.0 ? 1 : 0) +
    (prog.effectiveGearLevel >= 4.5 ? 1 : 0);

  const minRarity: ItemRarity =
    prog.progressionIndex >= 0.65
      ? 'epic'
      : prog.zoneTier >= 2 || prog.effectiveGearLevel >= 2.5
        ? 'rare'
        : 'uncommon';

  const preferredItems = spec.reward.items.map((item) => item.id);
  const rolledItems = rollWeightedLootItems(slotCount, effectiveContext, {
    sourceBonus: 0.28 + (prog.zoneTier - 1) * 0.1,
    minRarity,
    preferredItems,
    rng,
  });

  let highestRarity: ItemRarity = 'common';
  for (const item of rolledItems) {
    if (compareItemRarity(item.rarity, highestRarity) > 0) {
      highestRarity = item.rarity;
    }
  }

  return {
    resourcesDelta: {
      wood: Math.round(spec.reward.wood * rewardScale),
      stone: Math.round(spec.reward.stone * rewardScale),
      pelts: Math.round(spec.reward.pelts * rewardScale),
      meat: Math.round(spec.reward.meat * rewardScale),
      ice: Math.round(spec.reward.ice * rewardScale),
      gold: Math.round(spec.reward.gold * rewardScale),
    },
    huntingXp: Math.round(spec.reward.huntingXp * (1 + prog.gearProgress * 0.45) * zoneRatio),
    items: rolledItems,
    lootTierLabel: prog.tierLabel,
    effectiveGearLevel: prog.effectiveGearLevel,
    resourceMultiplier: prog.resourceMultiplier,
    highestRarity,
  };
}

