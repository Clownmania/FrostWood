import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMAL_MODEL_SPECS,
  BOSS_MODEL_SPECS,
  PLAYER_ANIMATION_PACK_URLS,
  PLAYER_MODEL_SPEC,
  ROAMING_MONSTER_SPECS,
  computeEntityLod,
  resolveClipName,
  selectAnimalAnimState,
  selectMonsterAnimState,
  selectPlayerAnimState,
} from './characterRig';
import { SPECIES_SPECS } from './wildlife';
import { ZONE_BOSS_ORDER } from './bosses';

test('model registry covers player, all 14 wildlife species, all 6 bosses, and roaming monsters', () => {
  assert.ok(PLAYER_MODEL_SPEC.url.endsWith('.glb'));
  assert.ok(PLAYER_ANIMATION_PACK_URLS.length >= 6);

  for (const kind of Object.keys(SPECIES_SPECS) as Array<keyof typeof SPECIES_SPECS>) {
    const spec = ANIMAL_MODEL_SPECS[kind];
    assert.ok(spec, `Missing ANIMAL_MODEL_SPECS entry for ${kind}`);
    assert.ok(spec.url.startsWith('/models/animals/'), `Bad URL for ${kind}: ${spec.url}`);
    assert.ok(spec.targetHeight > 0.3 && spec.targetHeight < 4.0);
    assert.ok(spec.collisionRadius > 0.2);
  }

  for (const bossId of ZONE_BOSS_ORDER) {
    const spec = BOSS_MODEL_SPECS[bossId];
    assert.ok(spec, `Missing BOSS_MODEL_SPECS entry for ${bossId}`);
    assert.ok(spec.url.startsWith('/models/monsters/'), `Bad URL for ${bossId}: ${spec.url}`);
    assert.ok(spec.targetHeight >= 3.5);
  }

  assert.equal(Object.keys(ROAMING_MONSTER_SPECS).length, 3);
});

test('selectPlayerAnimState resolves idle, walk, run, sprint, crouch, jump, combat, fishing, hit, and death', () => {
  const base = {
    speed: 0,
    maxSpeed: 8.6,
    isCreeping: false,
    isAirborne: false,
    verticalVelocity: 0,
    landingBounce: 0,
    swingTimer: 0,
    activeTool: 'axe' as const,
    isAiming: false,
    fishingPhase: 'idle' as const,
    hurtFlashTimer: 0,
    hp: 100,
  };

  assert.equal(selectPlayerAnimState(base).state, 'idle');
  assert.equal(selectPlayerAnimState({ ...base, speed: 2.5 }).state, 'walk');
  assert.equal(selectPlayerAnimState({ ...base, speed: 6.4 }).state, 'run');
  assert.equal(selectPlayerAnimState({ ...base, speed: 9.2 }).state, 'sprint');
  assert.equal(selectPlayerAnimState({ ...base, speed: 3.1, isCreeping: true }).state, 'crouch');
  assert.equal(selectPlayerAnimState({ ...base, isAirborne: true, verticalVelocity: 5.0 }).state, 'jump_start');
  assert.equal(selectPlayerAnimState({ ...base, isAirborne: true, verticalVelocity: -1.5 }).state, 'jump_air');
  assert.equal(selectPlayerAnimState({ ...base, swingTimer: 0.25, activeTool: 'axe' }).state, 'attack_melee');
  assert.equal(selectPlayerAnimState({ ...base, swingTimer: 0.25, activeTool: 'bow' }).state, 'attack_bow');
  assert.equal(selectPlayerAnimState({ ...base, activeTool: 'rod', fishingPhase: 'reeling' }).state, 'fish_reel');
  assert.equal(selectPlayerAnimState({ ...base, hurtFlashTimer: 0.25 }).state, 'hit');
  assert.equal(selectPlayerAnimState({ ...base, hp: 0 }).state, 'death');
});

test('selectAnimalAnimState handles predators, fleeing prey, flying owls, hit, and ko', () => {
  assert.equal(
    selectAnimalAnimState({ kind: 'wolf', behavior: 'wander', speed: 0.1, wanderSpeed: 2.8, flashTimer: 0 }).state,
    'idle',
  );
  assert.equal(
    selectAnimalAnimState({ kind: 'wolf', behavior: 'wander', speed: 2.5, wanderSpeed: 2.8, flashTimer: 0 }).state,
    'walk',
  );
  assert.equal(
    selectAnimalAnimState({ kind: 'stag', behavior: 'flee', speed: 8.5, wanderSpeed: 2.2, flashTimer: 0 }).state,
    'run',
  );
  assert.equal(
    selectAnimalAnimState({ kind: 'wolf', behavior: 'lunge', speed: 12, wanderSpeed: 2.8, flashTimer: 0 }).state,
    'attack',
  );
  assert.equal(
    selectAnimalAnimState({ kind: 'snow_owl', behavior: 'wander', speed: 3.1, wanderSpeed: 3.1, flashTimer: 0 }).state,
    'fly',
  );
  assert.equal(
    selectAnimalAnimState({ kind: 'polar_bear', behavior: 'ko', speed: 0, wanderSpeed: 2.0, flashTimer: 0 }).state,
    'death',
  );
});

test('selectMonsterAnimState handles boss/monster combat states', () => {
  assert.equal(selectMonsterAnimState({ state: 'idle', strideSpeed: 0, enraged: false, flashTimer: 0 }).state, 'idle');
  assert.equal(selectMonsterAnimState({ state: 'engage', strideSpeed: 2.2, enraged: false, flashTimer: 0 }).state, 'walk');
  assert.equal(selectMonsterAnimState({ state: 'engage', strideSpeed: 4.5, enraged: true, flashTimer: 0 }).state, 'run');
  assert.equal(selectMonsterAnimState({ state: 'telegraph', strideSpeed: 0, enraged: false, flashTimer: 0 }).state, 'roar');
  assert.equal(selectMonsterAnimState({ state: 'attack', strideSpeed: 0, enraged: false, flashTimer: 0 }).state, 'attack_melee');
  assert.equal(
    selectMonsterAnimState({ state: 'attack', strideSpeed: 0, enraged: false, flashTimer: 0, isSpellAttack: true }).state,
    'attack_spell',
  );
  assert.equal(selectMonsterAnimState({ state: 'ko', strideSpeed: 0, enraged: false, flashTimer: 0 }).state, 'death');
});

test('resolveClipName matches KayKit, Quaternius Animal, Quaternius Monster, and Vuena clip conventions', () => {
  const kaykitClips = ['Idle_A', 'Walking_A', 'Running_A', 'Running_B', 'Melee_1H_Attack_Chop', 'Ranged_Bow_Draw', 'Fishing_Reeling', 'Hit_A', 'Death_A'];
  assert.equal(resolveClipName(kaykitClips, 'idle'), 'Idle_A');
  assert.equal(resolveClipName(kaykitClips, 'attack_melee'), 'Melee_1H_Attack_Chop');
  assert.equal(resolveClipName(kaykitClips, 'fish_reel'), 'Fishing_Reeling');

  const quaterniusWolf = ['AnimalArmature|Idle', 'AnimalArmature|Walk', 'AnimalArmature|Gallop', 'AnimalArmature|Attack', 'AnimalArmature|Death'];
  assert.equal(resolveClipName(quaterniusWolf, 'idle'), 'AnimalArmature|Idle');
  assert.equal(resolveClipName(quaterniusWolf, 'run'), 'AnimalArmature|Gallop');
  assert.equal(resolveClipName(quaterniusWolf, 'attack'), 'AnimalArmature|Attack');

  const quaterniusDemon = ['Idle', 'Walk', 'Run', 'Punch', 'HitReact', 'Death'];
  assert.equal(resolveClipName(quaterniusDemon, 'attack_melee'), 'Punch');
  assert.equal(resolveClipName(quaterniusDemon, 'hit'), 'HitReact');

  const vuenaOwl = ['idle', 'walk', 'fly', 'attack', 'hit', 'death'];
  assert.equal(resolveClipName(vuenaOwl, 'fly'), 'fly');

  const knightHero = [
    'HumanArmature|Idle',
    'HumanArmature|Idle_swordRight',
    'HumanArmature|Walking',
    'HumanArmature|Run',
    'HumanArmature|Run_swordRight',
    'HumanArmature|Jump',
    'HumanArmature|Roll',
    'HumanArmature|Run_swordAttack',
    'HumanArmature|Death',
  ];
  assert.equal(resolveClipName(knightHero, 'idle'), 'HumanArmature|Idle_swordRight');
  assert.equal(resolveClipName(knightHero, 'walk'), 'HumanArmature|Walking');
  assert.equal(resolveClipName(knightHero, 'run'), 'HumanArmature|Run_swordRight');
  assert.equal(resolveClipName(knightHero, 'attack_melee'), 'HumanArmature|Run_swordAttack');
  assert.equal(resolveClipName(knightHero, 'jump_start'), 'HumanArmature|Jump');
  assert.equal(resolveClipName(knightHero, 'death'), 'HumanArmature|Death');

  const frostTyrant = ['Armature|TRex_Idle', 'Armature|TRex_Walk', 'Armature|TRex_Run', 'Armature|TRex_Attack', 'Armature|TRex_Death'];
  assert.equal(resolveClipName(frostTyrant, 'idle'), 'Armature|TRex_Idle');
  assert.equal(resolveClipName(frostTyrant, 'attack_melee'), 'Armature|TRex_Attack');
  assert.equal(resolveClipName(frostTyrant, 'death'), 'Armature|TRex_Death');

  const gorgeholdScout = ['idle', 'walk', 'run', 'grasp'];
  assert.equal(resolveClipName(gorgeholdScout, 'idle'), 'idle');
  assert.equal(resolveClipName(gorgeholdScout, 'walk'), 'walk');
  assert.equal(resolveClipName(gorgeholdScout, 'run'), 'run');
  assert.equal(resolveClipName(gorgeholdScout, 'attack_melee'), 'grasp');
});

test('computeEntityLod transitions cleanly from high -> medium -> low with shadow culling', () => {
  const near = computeEntityLod(15 * 15);
  assert.equal(near.tier, 'high');
  assert.equal(near.castShadow, true);
  assert.equal(near.mixerStepInterval, 0);

  const mid = computeEntityLod(50 * 50);
  assert.equal(mid.tier, 'medium');
  assert.equal(mid.castShadow, false);
  assert.ok(mid.mixerStepInterval > 0);

  const far = computeEntityLod(90 * 90);
  assert.equal(far.tier, 'low');
  assert.equal(far.castShadow, false);
  assert.ok(far.mixerStepInterval > mid.mixerStepInterval);
});
