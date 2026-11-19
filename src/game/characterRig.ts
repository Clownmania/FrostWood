import type { ActiveTool, AnimalKind, ZoneBossId } from './types';
import type { FishSpeciesId } from './fishing';
import type { AnimalBehaviorState } from './wildlife';

export type PlayerAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'crouch'
  | 'jump_start'
  | 'jump_air'
  | 'jump_land'
  | 'attack_melee'
  | 'attack_bow'
  | 'fish_cast'
  | 'fish_idle'
  | 'fish_reel'
  | 'interact'
  | 'cheer'
  | 'hit'
  | 'death';

export type AnimalAnimState =
  | 'idle'
  | 'eat'
  | 'walk'
  | 'run'
  | 'fly'
  | 'attack'
  | 'hit'
  | 'death';

export type MonsterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack_melee'
  | 'attack_spell'
  | 'roar'
  | 'hit'
  | 'death';

export type FishAnimState =
  | 'swim_normal'
  | 'swim_fast'
  | 'swim_impulse'
  | 'fish_attack'
  | 'out_of_water';

export type RoamingMonsterKind =
  | 'draugr_warrior'
  | 'frost_lich'
  | 'glacier_spider';

export interface ChibiNpcArchetype {
  id: 'knight' | 'mage' | 'rogue' | 'rogue_hooded' | 'barbarian';
  label: string;
  spec: ModelAssetSpec;
  /** Whether the GLB already embeds its own KayKit animation set (no external pack needed). */
  hasEmbeddedAnimations: boolean;
  /** Optional mesh node names inside the GLB to hide so duplicate weapons/shields never overlap. */
  hideMeshNames: readonly string[];
  /** Optional randomizable wardrobe tint palette for city variety. */
  tintVariants: readonly number[];
}

export interface ModelAssetSpec {
  url: string;
  /** Desired standing height in world meters after bounding-box normalization. */
  targetHeight: number;
  /** Yaw rotation offset in radians so the model's front faces +Z in engine space. */
  yawOffset: number;
  /** Optional collision radius in meters for combat/physics. */
  collisionRadius: number;
  /** PBR surface preset for material refinement. */
  surfacePreset: 'hero_fur_leather' | 'fur' | 'thick_fur' | 'feathers' | 'hide' | 'chitin' | 'scales' | 'bone' | 'monster_flesh';
  /** Optional multiplicative tint color applied subtly to preserve embedded textures while matching arctic variants. */
  tintHex?: number;
  /** Blend factor 0..1 when tinting base color toward tintHex. */
  tintStrength?: number;
  /** Optional emissive accent for mythical/boss/magical creatures. */
  emissiveHex?: number;
  emissiveIntensity?: number;
  /** Optional rough/metal overrides to prevent glossy plastic look. */
  roughnessMin?: number;
  roughnessMax?: number;
  metalnessMax?: number;
  /** Optional vertical lift above ground (e.g. hovering owl/wyvern). */
  groundOffsetY?: number;
  /** Whether model relies on biomechanical locomotion supplement because it has <=2 skeletal clips. */
  proceduralGaitAssist?: boolean;
}

export const PLAYER_MODEL_URL = '/Barbarian.glb';

export const PLAYER_ANIMATION_PACK_URLS: readonly string[] = [
  '/Rig_Medium_General.glb',
  '/Rig_Medium_MovementBasic.glb',
  '/models/player/Rig_Medium_CombatMelee.glb',
  '/models/player/Rig_Medium_CombatRanged.glb',
  '/models/player/Rig_Medium_MovementAdvanced.glb',
  '/models/player/Rig_Medium_Tools.glb',
];

export const PLAYER_MODEL_SPEC: ModelAssetSpec = {
  url: PLAYER_MODEL_URL,
  targetHeight: 1.88,
  yawOffset: 0,
  collisionRadius: 0.55,
  surfacePreset: 'hero_fur_leather',
  roughnessMin: 0.52,
  roughnessMax: 0.88,
  metalnessMax: 0.25,
};

/**
 * Complete registry mapping every Frostwood wildlife species to its genuine CC0 GLB asset,
 * calibrated world height, forward orientation, PBR material profile, and collision radius.
 */
export const ANIMAL_MODEL_SPECS: Record<AnimalKind, ModelAssetSpec> = {
  wolf: {
    url: '/models/animals/wolf.glb',
    targetHeight: 1.08,
    yawOffset: 0,
    collisionRadius: 0.85,
    surfacePreset: 'fur',
    roughnessMin: 0.78,
    roughnessMax: 0.94,
    metalnessMax: 0.04,
  },
  aurora_fenrir: {
    url: '/models/animals/wolf.glb',
    targetHeight: 1.56,
    yawOffset: 0,
    collisionRadius: 1.2,
    surfacePreset: 'fur',
    tintHex: 0xc4b5fd,
    tintStrength: 0.42,
    emissiveHex: 0x7c3aed,
    emissiveIntensity: 0.28,
    roughnessMin: 0.68,
    roughnessMax: 0.88,
    metalnessMax: 0.12,
  },
  polar_bear: {
    url: '/models/animals/polar_bear.glb',
    targetHeight: 1.68,
    yawOffset: 0,
    collisionRadius: 1.35,
    surfacePreset: 'thick_fur',
    roughnessMin: 0.84,
    roughnessMax: 0.96,
    metalnessMax: 0.02,
    proceduralGaitAssist: true,
  },
  stag: {
    url: '/models/animals/stag.glb',
    targetHeight: 1.95,
    yawOffset: 0,
    collisionRadius: 1.05,
    surfacePreset: 'fur',
    roughnessMin: 0.76,
    roughnessMax: 0.92,
    metalnessMax: 0.03,
  },
  frost_stag: {
    url: '/models/animals/stag.glb',
    targetHeight: 2.28,
    yawOffset: 0,
    collisionRadius: 1.2,
    surfacePreset: 'fur',
    tintHex: 0xdbeafe,
    tintStrength: 0.55,
    emissiveHex: 0x38bdf8,
    emissiveIntensity: 0.22,
    roughnessMin: 0.65,
    roughnessMax: 0.86,
    metalnessMax: 0.1,
  },
  frost_boar: {
    url: '/models/animals/boar.glb',
    targetHeight: 1.08,
    yawOffset: 0,
    collisionRadius: 0.95,
    surfacePreset: 'thick_fur',
    tintHex: 0x9fb8cc,
    tintStrength: 0.2,
    roughnessMin: 0.82,
    roughnessMax: 0.95,
    metalnessMax: 0.04,
    proceduralGaitAssist: true,
  },
  hare: {
    url: '/models/animals/hare.glb',
    targetHeight: 0.54,
    yawOffset: 0,
    collisionRadius: 0.42,
    surfacePreset: 'fur',
    roughnessMin: 0.84,
    roughnessMax: 0.96,
    metalnessMax: 0.02,
    proceduralGaitAssist: true,
  },
  fox: {
    url: '/models/animals/fox.glb',
    targetHeight: 0.84,
    yawOffset: 0,
    collisionRadius: 0.65,
    surfacePreset: 'fur',
    roughnessMin: 0.78,
    roughnessMax: 0.93,
    metalnessMax: 0.03,
  },
  lynx: {
    url: '/models/animals/snow_leopard.glb',
    targetHeight: 0.98,
    yawOffset: 0,
    collisionRadius: 0.78,
    surfacePreset: 'fur',
    roughnessMin: 0.8,
    roughnessMax: 0.94,
    metalnessMax: 0.03,
    proceduralGaitAssist: true,
  },
  sabertooth: {
    url: '/models/animals/sabertooth_tiger.glb',
    targetHeight: 1.24,
    yawOffset: 0,
    collisionRadius: 1.1,
    surfacePreset: 'thick_fur',
    tintHex: 0xd6b58c,
    tintStrength: 0.25,
    roughnessMin: 0.78,
    roughnessMax: 0.94,
    metalnessMax: 0.04,
    proceduralGaitAssist: true,
  },
  snow_owl: {
    url: '/models/animals/owl.glb',
    targetHeight: 0.92,
    yawOffset: 0,
    collisionRadius: 0.6,
    surfacePreset: 'feathers',
    tintHex: 0xf1f5f9,
    tintStrength: 0.45,
    roughnessMin: 0.8,
    roughnessMax: 0.94,
    metalnessMax: 0.02,
    groundOffsetY: 0.55,
  },
  wolverine: {
    url: '/models/animals/wolverine.glb',
    targetHeight: 0.82,
    yawOffset: 0,
    collisionRadius: 0.78,
    surfacePreset: 'thick_fur',
    roughnessMin: 0.82,
    roughnessMax: 0.95,
    metalnessMax: 0.04,
    proceduralGaitAssist: true,
  },
  musk_ox: {
    url: '/models/animals/bull.glb',
    targetHeight: 1.65,
    yawOffset: 0,
    collisionRadius: 1.3,
    surfacePreset: 'thick_fur',
    tintHex: 0x6b5547,
    tintStrength: 0.25,
    roughnessMin: 0.82,
    roughnessMax: 0.95,
    metalnessMax: 0.04,
  },
  mammoth: {
    url: '/models/animals/mammoth.glb',
    targetHeight: 2.95,
    yawOffset: 0,
    collisionRadius: 2.15,
    surfacePreset: 'thick_fur',
    roughnessMin: 0.84,
    roughnessMax: 0.96,
    metalnessMax: 0.03,
    proceduralGaitAssist: true,
  },
};

/**
 * Complete registry mapping every Zone Boss to a distinctive genuine CC0 Fantasy Monster GLB/GLTF.
 */
export const BOSS_MODEL_SPECS: Record<ZoneBossId, ModelAssetSpec> = {
  skarn_colossus: {
    url: '/models/monsters/creep_creature.glb',
    targetHeight: 4.55,
    yawOffset: 0,
    collisionRadius: 2.25,
    surfacePreset: 'monster_flesh',
    tintHex: 0x26381c,
    tintStrength: 0.74,
    emissiveHex: 0x4d7c0f,
    emissiveIntensity: 0.05,
    roughnessMin: 0.74,
    roughnessMax: 0.94,
    metalnessMax: 0.12,
  },
  veyra_sovereign: {
    url: '/models/monsters/skeleton_mage.glb',
    targetHeight: 4.45,
    yawOffset: 0,
    collisionRadius: 2.0,
    surfacePreset: 'bone',
    tintHex: 0x1e3a5f,
    tintStrength: 0.58,
    emissiveHex: 0x38bdf8,
    emissiveIntensity: 0.08,
    roughnessMin: 0.48,
    roughnessMax: 0.8,
    metalnessMax: 0.28,
  },
  malakor_gargoyle: {
    url: '/models/monsters/elder_dragon.glb',
    targetHeight: 4.95,
    yawOffset: 0,
    collisionRadius: 2.5,
    surfacePreset: 'scales',
    tintHex: 0x1e3a5f,
    tintStrength: 0.68,
    emissiveHex: 0x38bdf8,
    emissiveIntensity: 0.07,
    roughnessMin: 0.44,
    roughnessMax: 0.76,
    metalnessMax: 0.32,
    proceduralGaitAssist: true,
  },
  ulthar_behemoth: {
    url: '/models/monsters/frost_tyrant.glb',
    targetHeight: 4.85,
    yawOffset: 0,
    collisionRadius: 2.45,
    surfacePreset: 'scales',
    tintHex: 0x1c1917,
    tintStrength: 0.78,
    emissiveHex: 0xb45309,
    emissiveIntensity: 0.06,
    roughnessMin: 0.62,
    roughnessMax: 0.88,
    metalnessMax: 0.22,
  },
  astraea_valkyrie: {
    url: '/models/monsters/wyvern.glb',
    targetHeight: 4.9,
    yawOffset: 0,
    collisionRadius: 2.35,
    surfacePreset: 'scales',
    tintHex: 0x1e1b4b,
    tintStrength: 0.62,
    emissiveHex: 0x22d3ee,
    emissiveIntensity: 0.12,
    roughnessMin: 0.42,
    roughnessMax: 0.74,
    metalnessMax: 0.32,
    groundOffsetY: 0.75,
    proceduralGaitAssist: true,
  },
  ignis_warden: {
    url: '/models/monsters/western_dragon.glb',
    targetHeight: 4.65,
    yawOffset: 0,
    collisionRadius: 2.35,
    surfacePreset: 'scales',
    tintHex: 0x450a0a,
    tintStrength: 0.62,
    emissiveHex: 0xf97316,
    emissiveIntensity: 0.14,
    roughnessMin: 0.46,
    roughnessMax: 0.78,
    metalnessMax: 0.28,
    proceduralGaitAssist: true,
  },
};

export interface RoamingMonsterSpec extends ModelAssetSpec {
  kind: RoamingMonsterKind;
  label: string;
  maxHp: number;
  moveSpeed: number;
  chaseSpeed: number;
  attackRange: number;
  aggroRadius: number;
  attackDamage: number;
  attackCooldown: number;
  goldDrop: number;
  xpDrop: number;
  peltsDrop: number;
  isRanged?: boolean;
}

export const ROAMING_MONSTER_SPECS: Record<RoamingMonsterKind, RoamingMonsterSpec> = {
  draugr_warrior: {
    kind: 'draugr_warrior',
    label: 'Frostbound Draugr',
    url: '/models/monsters/skeleton_warrior.glb',
    targetHeight: 2.08,
    yawOffset: 0,
    collisionRadius: 0.9,
    surfacePreset: 'bone',
    tintHex: 0x64748b,
    tintStrength: 0.35,
    emissiveHex: 0x0ea5e9,
    emissiveIntensity: 0.06,
    roughnessMin: 0.64,
    roughnessMax: 0.88,
    metalnessMax: 0.36,
    maxHp: 175,
    moveSpeed: 2.4,
    chaseSpeed: 5.1,
    attackRange: 2.45,
    aggroRadius: 16.5,
    attackDamage: 18,
    attackCooldown: 1.75,
    goldDrop: 46,
    xpDrop: 38,
    peltsDrop: 2,
  },
  frost_lich: {
    kind: 'frost_lich',
    label: 'Rime Lich',
    url: '/models/monsters/skeleton_mage.glb',
    targetHeight: 2.05,
    yawOffset: 0,
    collisionRadius: 0.85,
    surfacePreset: 'bone',
    tintHex: 0x1e293b,
    tintStrength: 0.56,
    emissiveHex: 0x6366f1,
    emissiveIntensity: 0.09,
    roughnessMin: 0.6,
    roughnessMax: 0.86,
    metalnessMax: 0.28,
    maxHp: 145,
    moveSpeed: 2.1,
    chaseSpeed: 4.2,
    attackRange: 9.5,
    aggroRadius: 18.0,
    attackDamage: 20,
    attackCooldown: 2.25,
    goldDrop: 62,
    xpDrop: 48,
    peltsDrop: 2,
    isRanged: true,
  },
  glacier_spider: {
    kind: 'glacier_spider',
    label: 'Glacier Broodmother',
    url: '/models/monsters/spider.glb',
    targetHeight: 1.25,
    yawOffset: 0,
    collisionRadius: 1.15,
    surfacePreset: 'chitin',
    tintHex: 0x334155,
    tintStrength: 0.48,
    emissiveHex: 0x06b6d4,
    emissiveIntensity: 0.08,
    roughnessMin: 0.42,
    roughnessMax: 0.72,
    metalnessMax: 0.22,
    maxHp: 150,
    moveSpeed: 3.1,
    chaseSpeed: 6.2,
    attackRange: 2.6,
    aggroRadius: 15.5,
    attackDamage: 16,
    attackCooldown: 1.45,
    goldDrop: 52,
    xpDrop: 42,
    peltsDrop: 3,
  },
};

export interface PlayerAnimDecision {
  state: PlayerAnimState;
  timeScale: number;
  fadeDuration: number;
  loopOnce: boolean;
}

export interface PlayerAnimInput {
  speed: number;
  maxSpeed: number;
  isCreeping: boolean;
  isAirborne: boolean;
  verticalVelocity: number;
  landingBounce: number;
  swingTimer: number;
  activeTool: ActiveTool;
  isAiming: boolean;
  fishingPhase: 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling';
  hurtFlashTimer: number;
  hp: number;
}

/**
 * Pure animation state machine for the player character's skeletal rig.
 * Prioritizes death > hit > airborne > combat/tool action > locomotion > idle.
 */
export function selectPlayerAnimState(input: PlayerAnimInput): PlayerAnimDecision {
  if (input.hp <= 0) {
    return { state: 'death', timeScale: 1.0, fadeDuration: 0.16, loopOnce: true };
  }
  if (input.hurtFlashTimer > 0.12) {
    return { state: 'hit', timeScale: 1.25, fadeDuration: 0.08, loopOnce: true };
  }
  if (input.isAirborne) {
    if (input.verticalVelocity > 2.2) {
      return { state: 'jump_start', timeScale: 1.15, fadeDuration: 0.08, loopOnce: true };
    }
    return { state: 'jump_air', timeScale: 1.0, fadeDuration: 0.12, loopOnce: false };
  }
  if (input.landingBounce > 0.14 && input.speed < 2.0) {
    return { state: 'jump_land', timeScale: 1.2, fadeDuration: 0.08, loopOnce: true };
  }

  if (input.activeTool === 'rod' && input.fishingPhase !== 'idle') {
    if (input.fishingPhase === 'casting') {
      return { state: 'fish_cast', timeScale: 1.2, fadeDuration: 0.1, loopOnce: true };
    }
    if (input.fishingPhase === 'reeling' || input.fishingPhase === 'bite') {
      return { state: 'fish_reel', timeScale: 1.25, fadeDuration: 0.12, loopOnce: false };
    }
    return { state: 'fish_idle', timeScale: 1.0, fadeDuration: 0.18, loopOnce: false };
  }

  if (input.swingTimer > 0.02) {
    if (input.activeTool === 'bow') {
      return { state: 'attack_bow', timeScale: 1.4, fadeDuration: 0.07, loopOnce: true };
    }
    if (input.activeTool === 'rod') {
      return { state: 'fish_cast', timeScale: 1.25, fadeDuration: 0.08, loopOnce: true };
    }
    return { state: 'attack_melee', timeScale: 1.45, fadeDuration: 0.06, loopOnce: true };
  }

  if (input.activeTool === 'bow' && input.isAiming && input.speed < 1.2) {
    return { state: 'attack_bow', timeScale: 0.85, fadeDuration: 0.14, loopOnce: false };
  }

  const speedRatio = input.speed / Math.max(1, input.maxSpeed);
  if (input.speed > 0.35) {
    if (input.isCreeping) {
      return {
        state: 'crouch',
        timeScale: Math.max(0.75, Math.min(1.5, input.speed / 3.2)),
        fadeDuration: 0.16,
        loopOnce: false,
      };
    }
    if (input.speed > 8.9 || speedRatio > 0.92) {
      return {
        state: 'sprint',
        timeScale: Math.max(0.95, Math.min(1.55, input.speed / 7.8)),
        fadeDuration: 0.14,
        loopOnce: false,
      };
    }
    if (input.speed > 4.2 || speedRatio > 0.5) {
      return {
        state: 'run',
        timeScale: Math.max(0.85, Math.min(1.4, input.speed / 6.2)),
        fadeDuration: 0.15,
        loopOnce: false,
      };
    }
    return {
      state: 'walk',
      timeScale: Math.max(0.75, Math.min(1.35, input.speed / 3.0)),
      fadeDuration: 0.16,
      loopOnce: false,
    };
  }

  if (input.isCreeping) {
    return { state: 'crouch', timeScale: 0.4, fadeDuration: 0.18, loopOnce: false };
  }

  return { state: 'idle', timeScale: 1.0, fadeDuration: 0.22, loopOnce: false };
}

export interface AnimalAnimDecision {
  state: AnimalAnimState;
  timeScale: number;
  fadeDuration: number;
  loopOnce: boolean;
}

export function selectAnimalAnimState(input: {
  kind: AnimalKind;
  behavior: AnimalBehaviorState;
  speed: number;
  wanderSpeed: number;
  flashTimer: number;
}): AnimalAnimDecision {
  if (input.behavior === 'ko') {
    return { state: 'death', timeScale: 1.0, fadeDuration: 0.16, loopOnce: true };
  }
  if (input.flashTimer > 0.08) {
    return { state: 'hit', timeScale: 1.25, fadeDuration: 0.07, loopOnce: true };
  }
  if (input.behavior === 'lunge' || input.behavior === 'windup') {
    return {
      state: 'attack',
      timeScale: input.behavior === 'windup' ? 0.72 : 1.35,
      fadeDuration: 0.09,
      loopOnce: input.behavior === 'lunge',
    };
  }
  if (input.kind === 'snow_owl' && (input.speed > 0.4 || input.behavior === 'flee')) {
    return {
      state: 'fly',
      timeScale: Math.max(0.9, Math.min(1.8, input.speed / 3.2)),
      fadeDuration: 0.18,
      loopOnce: false,
    };
  }
  if (input.behavior === 'flee' || input.speed > input.wanderSpeed * 1.38) {
    return {
      state: 'run',
      timeScale: Math.max(0.9, Math.min(1.75, input.speed / Math.max(2.2, input.wanderSpeed * 1.9))),
      fadeDuration: 0.14,
      loopOnce: false,
    };
  }
  if (input.speed > 0.3) {
    return {
      state: 'walk',
      timeScale: Math.max(0.75, Math.min(1.45, input.speed / Math.max(1.5, input.wanderSpeed))),
      fadeDuration: 0.18,
      loopOnce: false,
    };
  }
  if (input.behavior === 'curious') {
    return { state: 'eat', timeScale: 0.9, fadeDuration: 0.24, loopOnce: false };
  }
  return { state: 'idle', timeScale: 1.0, fadeDuration: 0.24, loopOnce: false };
}

export interface MonsterAnimDecision {
  state: MonsterAnimState;
  timeScale: number;
  fadeDuration: number;
  loopOnce: boolean;
}

export function selectMonsterAnimState(input: {
  state: 'idle' | 'engage' | 'telegraph' | 'attack' | 'recover' | 'ko';
  strideSpeed: number;
  enraged: boolean;
  flashTimer: number;
  isSpellAttack?: boolean;
}): MonsterAnimDecision {
  if (input.state === 'ko') {
    return { state: 'death', timeScale: 1.0, fadeDuration: 0.18, loopOnce: true };
  }
  if (input.flashTimer > 0.08 && input.state !== 'attack') {
    return { state: 'hit', timeScale: 1.2, fadeDuration: 0.08, loopOnce: true };
  }
  if (input.state === 'telegraph') {
    return {
      state: input.isSpellAttack ? 'attack_spell' : 'roar',
      timeScale: input.enraged ? 1.25 : 1.0,
      fadeDuration: 0.12,
      loopOnce: false,
    };
  }
  if (input.state === 'attack') {
    return {
      state: input.isSpellAttack ? 'attack_spell' : 'attack_melee',
      timeScale: input.enraged ? 1.35 : 1.15,
      fadeDuration: 0.08,
      loopOnce: true,
    };
  }
  if (input.strideSpeed > 3.1) {
    return {
      state: 'run',
      timeScale: input.enraged ? 1.3 : 1.05,
      fadeDuration: 0.16,
      loopOnce: false,
    };
  }
  if (input.strideSpeed > 0.45) {
    return {
      state: 'walk',
      timeScale: Math.max(0.8, Math.min(1.4, input.strideSpeed / 2.5)),
      fadeDuration: 0.18,
      loopOnce: false,
    };
  }
  return { state: 'idle', timeScale: 1.0, fadeDuration: 0.24, loopOnce: false };
}

const CLIP_CANDIDATES: Record<string, readonly string[]> = {
  // Player & universal rig clips (Quaternius HumanArmature, KayKit, Quaternius Animals, Monsters, TRex)
  idle: [
    'HumanArmature|Idle_swordRight',
    'HumanArmature|Idle',
    'Idle_A',
    'Idle_B',
    'Idle',
    'idle',
    'AnimalArmature|Idle',
    'AnimalArmature|Idle_2',
    'Armature|TRex_Idle',
    'Idle1_Action',
    'SpiderArmature|Spider_Idle',
  ],
  walk: [
    'HumanArmature|Walking',
    'Walking_A',
    'Walking_B',
    'Walk',
    'walk',
    'AnimalArmature|Walk',
    'Armature|TRex_Walk',
    'SpiderArmature|Spider_Walk',
    'Walking_C',
    'Gallop',
  ],
  run: [
    'HumanArmature|Run_swordRight',
    'HumanArmature|Run',
    'Running_A',
    'Run',
    'run',
    'AnimalArmature|Gallop',
    'Armature|TRex_Run',
    'Gallop',
    'Running_B',
    'SpiderArmature|Spider_Walk',
    'Walk',
  ],
  sprint: ['HumanArmature|Run', 'HumanArmature|Run_swordRight', 'Running_B', 'Running_A', 'Run', 'Gallop'],
  crouch: ['HumanArmature|Walking', 'Sneaking', 'Crouching', 'Crouch_Action', 'Duck', 'Walking_A'],
  jump_start: ['HumanArmature|Jump', 'Jump_Start', 'Jump_Full_Short', 'Jump', 'jump', 'Armature|TRex_Jump', 'SpiderArmature|Spider_Jump'],
  jump_air: ['HumanArmature|Jump', 'Jump_Idle', 'Jump_Full_Long', 'Jump', 'jump'],
  jump_land: ['HumanArmature|Roll', 'Jump_Land', 'Jump_toIdle', 'Jump_ToIdle', 'Idle_A', 'HumanArmature|Idle'],
  attack_melee: [
    'HumanArmature|Run_swordAttack',
    'HumanArmature|swordAttackJump',
    'Melee_1H_Attack_Chop',
    '1H_Melee_Attack_Chop',
    'Melee_1H_Attack_Slice_Diagonal',
    'Armature|TRex_Attack',
    'Punch',
    'Punch_Action',
    'Bite_Action',
    'SpiderArmature|Spider_Attack',
    'Attack',
    'attack',
    'grasp',
  ],
  attack_bow: [
    'HumanArmature|Idle_swordLeft',
    'Ranged_Bow_Draw',
    'Ranged_Bow_Aiming_Idle',
    'Ranged_2H_Shoot',
    '1H_Ranged_Shoot',
    'Spellcast_Shoot',
    'grasp',
  ],
  attack_spell: [
    'Spellcast_Shoot',
    'Spellcast_Raise',
    'Spellcast_Long',
    '1H_Ranged_Shoot',
    'Roar_Action',
    'Armature|TRex_Attack',
    'Wave',
    'Punch',
  ],
  roar: ['Roar_Action', 'Armature|TRex_Jump', 'Wave', 'Jump', 'Punch', '1H_Melee_Attack_Jump_Chop', 'Idle_2'],
  fish_cast: ['HumanArmature|Run_swordAttack', 'Fishing_Cast', 'Throw', 'Interact', 'Melee_1H_Attack_Chop', 'grasp'],
  fish_idle: ['HumanArmature|Idle_swordRight', 'Fishing_Idle', 'Idle_A', 'Idle', 'idle'],
  fish_reel: ['HumanArmature|Idle_swordRight', 'Fishing_Reeling', 'Fishing_Struggling', 'Fishing_Tug', 'Interact', 'grasp'],
  eat: ['AnimalArmature|Eating', 'AnimalArmature|Idle_Headlow', 'AnimalArmature|Idle_2_HeadLow', 'eat', 'Eating_Action', 'head-turn', 'Idle'],
  fly: ['fly', 'AnimalArmature|Gallop', 'run', 'walk'],
  attack: [
    'AnimalArmature|Attack',
    'AnimalArmature|Attack_Headbutt',
    'Armature|TRex_Attack',
    'attack',
    'SpiderArmature|Spider_Attack',
    'Punch',
    'Bite_Action',
    'head-turn',
  ],
  hit: [
    'HumanArmature|Roll',
    'Hit_A',
    'Hit_B',
    'HitReact',
    'hit',
    'Damage_Action',
    'AnimalArmature|Idle_HitReact_Left',
    'AnimalArmature|Idle_HitReact_Right',
  ],
  interact: ['Interact', 'Wave', 'Cheer', 'Idle_A', 'Idle'],
  cheer: ['Cheer', 'Interact', 'Wave', 'Idle_B', 'Idle'],
  swim_normal: ['Fish_Armature|Swimming_Normal', 'Swimming_Normal', 'Fish_Armature|Swimming_Impulse'],
  swim_fast: ['Fish_Armature|Swimming_Fast', 'Swimming_Fast', 'Fish_Armature|Swimming_Normal'],
  swim_impulse: ['Fish_Armature|Swimming_Impulse', 'Swimming_Impulse', 'Fish_Armature|Swimming_Normal'],
  fish_attack: ['Fish_Armature|Attack', 'Attack', 'Fish_Armature|Swimming_Fast'],
  out_of_water: ['Fish_Armature|Out_Of_Water', 'Out_Of_Water', 'Fish_Armature|Swimming_Fast'],
  death: [
    'HumanArmature|Death',
    'Death_A',
    'Death_B',
    'Death',
    'death',
    'Death_Action',
    'Armature|TRex_Death',
    'AnimalArmature|Death',
    'SpiderArmature|Spider_Death',
    'Fish_Armature|Death',
  ],
};

/**
 * Curated roster of genuine CC0 KayKit Adventurers Chibi models for Frostcave City NPCs.
 * Each archetype hides overlapping alternate weapons/shields inside the GLB for a crisp silhouette.
 */
export const CITY_CHIBI_NPC_ARCHETYPES: readonly ChibiNpcArchetype[] = [
  {
    id: 'knight',
    label: 'Frostguard Knight',
    spec: {
      url: '/models/npcs/Knight.glb',
      targetHeight: 1.82,
      yawOffset: 0,
      collisionRadius: 0.52,
      surfacePreset: 'hero_fur_leather',
      roughnessMin: 0.42,
      roughnessMax: 0.78,
      metalnessMax: 0.42,
    },
    hasEmbeddedAnimations: true,
    hideMeshNames: [
      '1H_Sword_Offhand',
      'Rectangle_Shield',
      'Round_Shield',
      'Spike_Shield',
      '2H_Sword',
    ],
    tintVariants: [0x93c5fd, 0xfca5a5, 0xfde68a, 0xa7f3d0],
  },
  {
    id: 'mage',
    label: 'Glacier Scholar',
    spec: {
      url: '/models/npcs/Mage.glb',
      targetHeight: 1.86,
      yawOffset: 0,
      collisionRadius: 0.5,
      surfacePreset: 'hero_fur_leather',
      roughnessMin: 0.58,
      roughnessMax: 0.88,
      metalnessMax: 0.18,
    },
    hasEmbeddedAnimations: true,
    hideMeshNames: ['Spellbook_open', '1H_Wand'],
    tintVariants: [0xc4b5fd, 0x7dd3fc, 0xfda4af, 0x99f6e4],
  },
  {
    id: 'rogue',
    label: 'Snowtrail Scout',
    spec: {
      url: '/models/npcs/Rogue.glb',
      targetHeight: 1.76,
      yawOffset: 0,
      collisionRadius: 0.48,
      surfacePreset: 'hero_fur_leather',
      roughnessMin: 0.56,
      roughnessMax: 0.88,
      metalnessMax: 0.2,
    },
    hasEmbeddedAnimations: true,
    hideMeshNames: ['Knife_Offhand', '1H_Crossbow', '2H_Crossbow', 'Throwable'],
    tintVariants: [0x86efac, 0xfdba74, 0x93c5fd, 0xe2e8f0],
  },
  {
    id: 'rogue_hooded',
    label: 'Frostcloak Ranger',
    spec: {
      url: '/models/npcs/Rogue_Hooded.glb',
      targetHeight: 1.78,
      yawOffset: 0,
      collisionRadius: 0.48,
      surfacePreset: 'hero_fur_leather',
      roughnessMin: 0.58,
      roughnessMax: 0.9,
      metalnessMax: 0.18,
    },
    hasEmbeddedAnimations: true,
    hideMeshNames: ['Knife_Offhand', '2H_Crossbow', 'Knife', 'Throwable'],
    tintVariants: [0x6ee7b7, 0xbae6fd, 0xd8b4fe, 0xfecdd3],
  },
  {
    id: 'barbarian',
    label: 'Hearthland Clansman',
    spec: {
      url: '/Barbarian.glb',
      targetHeight: 1.84,
      yawOffset: 0,
      collisionRadius: 0.54,
      surfacePreset: 'hero_fur_leather',
      roughnessMin: 0.56,
      roughnessMax: 0.88,
      metalnessMax: 0.22,
    },
    hasEmbeddedAnimations: false,
    hideMeshNames: [],
    tintVariants: [0xfed7aa, 0xbfdbfe, 0xfecaca, 0xd9f99d],
  },
];

export function pickRandomChibiNpcArchetype(
  rng: () => number = Math.random,
  excludeId?: ChibiNpcArchetype['id'],
): { archetype: ChibiNpcArchetype; tintHex: number } {
  const pool = excludeId
    ? CITY_CHIBI_NPC_ARCHETYPES.filter((a) => a.id !== excludeId)
    : CITY_CHIBI_NPC_ARCHETYPES;
  const idx = Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length);
  const archetype = pool[idx] ?? CITY_CHIBI_NPC_ARCHETYPES[0];
  const tIdx = Math.floor(
    Math.max(0, Math.min(0.999999, rng())) * archetype.tintVariants.length,
  );
  const tintHex = archetype.tintVariants[tIdx] ?? 0xffffff;
  return { archetype, tintHex };
}

/**
 * Complete registry mapping every Crystal Lagoon fish species to a high-polygon,
 * realistic 4-channel PBR (Albedo + Normal + ORM) 3D fish GLB with calibrated
 * aquatic scale and wet specular finish.
 */
export const FISH_MODEL_SPECS: Record<FishSpeciesId, ModelAssetSpec> = {
  frost_minnow: {
    url: '/models/fish/frost_minnow.glb',
    targetHeight: 0.3,
    yawOffset: 0,
    collisionRadius: 0.24,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    roughnessMin: 0.14,
    roughnessMax: 0.34,
    metalnessMax: 0.42,
  },
  glacial_perch: {
    url: '/models/fish/glacial_perch.glb',
    targetHeight: 0.34,
    yawOffset: 0,
    collisionRadius: 0.28,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    roughnessMin: 0.14,
    roughnessMax: 0.36,
    metalnessMax: 0.38,
  },
  silver_char: {
    url: '/models/fish/silver_char.glb',
    targetHeight: 0.35,
    yawOffset: 0,
    collisionRadius: 0.32,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    roughnessMin: 0.12,
    roughnessMax: 0.32,
    metalnessMax: 0.48,
  },
  boreal_trout: {
    url: '/models/fish/boreal_trout.glb',
    targetHeight: 0.37,
    yawOffset: 0,
    collisionRadius: 0.34,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    roughnessMin: 0.14,
    roughnessMax: 0.34,
    metalnessMax: 0.42,
  },
  crystal_pike: {
    url: '/models/fish/crystal_pike.glb',
    targetHeight: 0.38,
    yawOffset: 0,
    collisionRadius: 0.38,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    emissiveHex: 0x0ea5e9,
    emissiveIntensity: 0.03,
    roughnessMin: 0.12,
    roughnessMax: 0.3,
    metalnessMax: 0.45,
  },
  aurora_salmon: {
    url: '/models/fish/aurora_salmon.glb',
    targetHeight: 0.39,
    yawOffset: 0,
    collisionRadius: 0.38,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    emissiveHex: 0xc084fc,
    emissiveIntensity: 0.03,
    roughnessMin: 0.12,
    roughnessMax: 0.3,
    metalnessMax: 0.45,
  },
  abyssal_sturgeon: {
    url: '/models/fish/abyssal_sturgeon.glb',
    targetHeight: 0.43,
    yawOffset: 0,
    collisionRadius: 0.46,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    emissiveHex: 0x38bdf8,
    emissiveIntensity: 0.03,
    roughnessMin: 0.16,
    roughnessMax: 0.38,
    metalnessMax: 0.4,
  },
  celestial_koi: {
    url: '/models/fish/celestial_koi.glb',
    targetHeight: 0.42,
    yawOffset: 0,
    collisionRadius: 0.44,
    surfacePreset: 'scales',
    tintHex: 0xffffff,
    tintStrength: 0.0,
    emissiveHex: 0xf59e0b,
    emissiveIntensity: 0.04,
    roughnessMin: 0.1,
    roughnessMax: 0.26,
    metalnessMax: 0.42,
  },
};

/**
 * Matches a logical animation state against any GLB's actual AnimationClip names
 * (supports KayKit, Quaternius Animals, Quaternius Monsters, Quaternius Fish, Vuena, and 3DAssets naming conventions).
 */
export function resolveClipName(
  availableClipNames: readonly string[],
  desiredState: PlayerAnimState | AnimalAnimState | MonsterAnimState | FishAnimState,
): string | null {
  if (availableClipNames.length === 0) return null;

  const exactMap = new Map<string, string>();
  for (const name of availableClipNames) {
    exactMap.set(name, name);
    exactMap.set(name.toLowerCase(), name);
  }

  const candidates = CLIP_CANDIDATES[desiredState] ?? [];
  // 1. Exact match (case-sensitive, then case-insensitive)
  for (const cand of candidates) {
    if (exactMap.has(cand)) return exactMap.get(cand)!;
    if (exactMap.has(cand.toLowerCase())) return exactMap.get(cand.toLowerCase())!;
  }

  // 2. Suffix / substring match (handles prefixed armature names like 'Armature|Walk')
  for (const cand of candidates) {
    const lc = cand.toLowerCase();
    for (const avail of availableClipNames) {
      const la = avail.toLowerCase();
      if (la.endsWith('|' + lc) || la.endsWith('_' + lc) || la.includes(lc)) {
        return avail;
      }
    }
  }

  // 3. Fallback to any idle or swim clip or first available clip
  for (const avail of availableClipNames) {
    const la = avail.toLowerCase();
    if (la.includes('idle') || la.includes('swimming_normal')) return avail;
  }
  return availableClipNames[0];
}

export interface LodDecision {
  tier: 'high' | 'medium' | 'low';
  mixerStepInterval: number;
  castShadow: boolean;
}

/**
 * Computes distance-based LOD and AnimationMixer update throttling so large herds
 * and roaming monsters stay 60fps smooth on both dedicated GPU and software WebGL.
 */
export function computeEntityLod(distanceSq: number): LodDecision {
  if (distanceSq <= 34 * 34) {
    return { tier: 'high', mixerStepInterval: 0, castShadow: true };
  }
  if (distanceSq <= 68 * 68) {
    return { tier: 'medium', mixerStepInterval: 1 / 20, castShadow: false };
  }
  return { tier: 'low', mixerStepInterval: 1 / 6, castShadow: false };
}
