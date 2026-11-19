import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  FISH_SPECIES_ORDER,
  FISHING_LAKE_CENTER,
  FISHING_LAKE_RADIUS,
  createLakeFishSpawnPopulation,
} from './fishing';
import { FISH_MODEL_SPECS } from './characterRig';
import {
  REALISTIC_FISH_PROFILES,
  buildLakeFishSpawnPlan,
  computeFishSwimKinematics,
  upgradeFishMaterialsWithSwimShader,
} from './fishVisuals';

test('REALISTIC_FISH_PROFILES covers every species in FISH_SPECIES_ORDER with valid PBR & proportions', () => {
  for (const id of FISH_SPECIES_ORDER) {
    const profile = REALISTIC_FISH_PROFILES[id];
    const spec = FISH_MODEL_SPECS[id];
    assert.ok(profile, `Missing realistic fish profile for ${id}`);
    assert.ok(spec, `Missing FISH_MODEL_SPECS entry for ${id}`);
    assert.equal(profile.speciesId, id);
    assert.ok(profile.anatomy === 'barramundi' || profile.anatomy === 'snapper');
    for (const axisScale of profile.bodyProportions) {
      assert.ok(axisScale >= 0.7 && axisScale <= 1.5);
    }
    assert.ok(profile.clearcoat > 0.5 && profile.clearcoat <= 1.0);
    assert.ok(profile.iridescence > 0.1 && profile.iridescence <= 0.8);
    assert.ok(profile.swimCadence.struggleFreq > profile.swimCadence.baseFreq);
    assert.ok(profile.swimCadence.struggleAmp > profile.swimCadence.cruiseAmp);
  }
});

test('createLakeFishSpawnPopulation and buildLakeFishSpawnPlan integrate cleanly with Crystal Lagoon bounds', () => {
  let seed = 42;
  const deterministicRng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const pop = createLakeFishSpawnPopulation(12, deterministicRng, 0.1);
  assert.equal(pop.length, 12);
  for (const id of FISH_SPECIES_ORDER) {
    assert.ok(pop.includes(id), `Expected all species present in lake roster, missing ${id}`);
  }

  const lakeSurfaceY = 0.14;
  const plan = buildLakeFishSpawnPlan({
    count: 12,
    lakeSurfaceY,
    rng: deterministicRng,
    luckBonus: 0.12,
  });
  assert.equal(plan.length, 12);

  for (const entry of plan) {
    const dist = Math.hypot(
      entry.x - FISHING_LAKE_CENTER.x,
      entry.z - FISHING_LAKE_CENTER.z,
    );
    assert.ok(
      dist >= 2.5 && dist <= FISHING_LAKE_RADIUS - 3.0,
      `Fish ${entry.speciesId} spawned out of lagoon basin: dist=${dist}`,
    );
    // Must remain above the opaque lakebed (lakeSurfaceY - 0.11) and seated in the water surface
    assert.ok(
      entry.depthOffset > lakeSurfaceY - 0.04 && entry.depthOffset <= lakeSurfaceY + 0.06,
      `Fish ${entry.speciesId} depthOffset out of water column: ${entry.depthOffset}`,
    );
    assert.ok(Number.isFinite(entry.yaw));
    assert.ok(Math.abs(entry.orbitSpeed) > 0.1);
  }
});

test('computeFishSwimKinematics produces bounded burst-glide and intense struggle outputs', () => {
  const cruise = computeFishSwimKinematics({
    speciesId: 'crystal_pike',
    totalTime: 4.5,
    phaseOffset: 0.8,
    turnRate: 0.9,
    verticalVel: 0.02,
    isStruggling: false,
  });

  const struggle = computeFishSwimKinematics({
    speciesId: 'crystal_pike',
    totalTime: 4.5,
    phaseOffset: 0.8,
    turnRate: -1.8,
    verticalVel: -0.05,
    isStruggling: true,
  });

  assert.ok(cruise.speedMultiplier >= 0.8 && cruise.speedMultiplier <= 1.6);
  assert.ok(struggle.waveFreq > cruise.waveFreq * 1.5);
  assert.ok(struggle.waveAmp > cruise.waveAmp);
  assert.ok(struggle.finFlutter > cruise.finFlutter);
  assert.ok(cruise.turnBend > 0 && struggle.turnBend < 0);
  assert.ok(Math.abs(cruise.rollZ) <= 0.34 && Math.abs(struggle.rollZ) <= 0.34);
  assert.ok(Math.abs(cruise.pitchX) <= 0.22 && Math.abs(struggle.pitchX) <= 0.22);
});

test('upgradeFishMaterialsWithSwimShader upgrades PBR materials and calibrates nose-to-tail axis polarity', () => {
  const buildFishMesh = (minZ: number, maxZ: number) => {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.2, 0.3, maxZ - minZ);
    geo.translate(0, 0, (minZ + maxZ) * 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    return { group, mesh };
  };

  // Barramundi anatomy: nose is minZ, tail is maxZ, flipX = -1
  const barra = buildFishMesh(-0.32, 0.33);
  const resBarra = upgradeFishMaterialsWithSwimShader(barra.group, 'boreal_trout', 1.45);
  assert.equal(resBarra.upgradedMaterials, 1);
  assert.ok(barra.mesh.material instanceof THREE.MeshPhysicalMaterial);
  assert.ok(resBarra.uniforms.uNoseZ.value < resBarra.uniforms.uTailZ.value);
  assert.equal(resBarra.uniforms.uFlipX.value, -1);

  // Snapper anatomy: nose is maxZ, tail is minZ, flipX = +1
  const snap = buildFishMesh(-19.8, 20.3);
  const resSnap = upgradeFishMaterialsWithSwimShader(snap.group, 'celestial_koi', 1.45);
  assert.equal(resSnap.upgradedMaterials, 1);
  assert.ok(snap.mesh.material instanceof THREE.MeshPhysicalMaterial);
  assert.ok(resSnap.uniforms.uNoseZ.value > resSnap.uniforms.uTailZ.value);
  assert.equal(resSnap.uniforms.uFlipX.value, 1);
  assert.ok(Math.abs(resSnap.uniforms.uBodyLength.value - 40.1) < 0.05);
});
