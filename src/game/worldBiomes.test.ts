import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ENV_MODEL_URLS,
  WORLD_BIOME_PROFILES,
  WORLD_FROZEN_RIVER_POINTS,
  WORLD_LAKE_ISLANDS,
  WORLD_LANDMARKS,
  WORLD_WEAK_ICE_ZONES,
  computeZoneAtmosphere,
  evaluateWeakIceHazard,
  getLandmarksForZone,
  isInsideNaturalShelter,
  sampleTundraRiverDistance,
} from './worldBiomes';
import { FISHING_LAKE_CENTER, FISHING_LAKE_RADIUS } from './fishing';
import { ZONE_SPECS, SURVIVAL_ZONE_ORDER } from './zones';
import { getZoneBossSpec } from './bosses';

describe('5-Zone Realistic Winter Survival World Biomes & Landmarks', () => {
  it('defines distinct biome profiles for all 5 survival zones plus Frostcave City', () => {
    for (const z of [...SURVIVAL_ZONE_ORDER, 'city'] as const) {
      const profile = WORLD_BIOME_PROFILES[z];
      assert.ok(profile, `Missing biome profile for ${z}`);
      assert.ok(profile.biomeName.length > 5);
      assert.ok(profile.fogDensityMult > 0);
      assert.ok(profile.windSpeedMult > 0);
    }
    // Zone 2 Pine Forest has highest extra tree density
    assert.ok(
      WORLD_BIOME_PROFILES.level2.extraTreeCount > WORLD_BIOME_PROFILES.level4.extraTreeCount,
    );
    // Zone 3 Snow Mountains has waterfalls & highest boulder crag density
    assert.equal(WORLD_BIOME_PROFILES.level3.hasWaterfalls, true);
    assert.ok(
      WORLD_BIOME_PROFILES.level3.extraBoulderCount > WORLD_BIOME_PROFILES.level1.extraBoulderCount,
    );
    // Zone 4 Frozen Tundra has meandering frozen river
    assert.equal(WORLD_BIOME_PROFILES.level4.hasFrozenRiver, true);
    // Zone 5 Abandoned Winter Settlement has snow-buried street grid
    assert.equal(WORLD_BIOME_PROFILES.level5.hasSettlementRoads, true);
  });

  it('ships real binary GLB files on disk for every ENV_MODEL_URLS entry', () => {
    for (const [key, url] of Object.entries(ENV_MODEL_URLS)) {
      const diskPath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Missing GLB file for ${key} at ${diskPath}`);
      const buf = fs.readFileSync(diskPath);
      assert.equal(buf.subarray(0, 4).toString('ascii'), 'glTF', `${key} must be valid GLB v2`);
      assert.ok(buf.byteLength > 10_000, `${key} GLB unexpectedly small (${buf.byteLength} bytes)`);
    }
  });

  it('places every landmark across Zones 1-5 inside playable radius and clear of portals & boss arenas', () => {
    for (const zone of SURVIVAL_ZONE_ORDER) {
      const spec = ZONE_SPECS[zone];
      const boss = getZoneBossSpec(zone);
      const landmarks = getLandmarksForZone(zone);
      assert.ok(landmarks.length >= 5, `Zone ${zone} should have at least 5 rich landmarks`);

      for (const lm of landmarks) {
        const distCenter = Math.hypot(lm.x - spec.centerX, lm.z - spec.centerZ);
        assert.ok(
          distCenter < spec.radius - 12,
          `Landmark ${lm.id} too close to boundary (${distCenter.toFixed(1)} vs ${spec.radius})`,
        );

        const distPortal = Math.hypot(lm.x - spec.portalX, lm.z - spec.portalZ);
        assert.ok(distPortal >= 10, `Landmark ${lm.id} overlaps return portal`);

        if (spec.forwardPortalX !== undefined && spec.forwardPortalZ !== undefined) {
          const distFwd = Math.hypot(lm.x - spec.forwardPortalX, lm.z - spec.forwardPortalZ);
          assert.ok(distFwd >= 10, `Landmark ${lm.id} overlaps forward portal`);
        }

        const distBoss = Math.hypot(lm.x - boss.arenaX, lm.z - boss.arenaZ);
        assert.ok(distBoss >= 16, `Landmark ${lm.id} overlaps boss arena`);
      }
    }
  });

  it('places Zone 1 frozen rocky islands inside the central frozen lake cleanly', () => {
    assert.ok(WORLD_LAKE_ISLANDS.length >= 3);
    for (const isl of WORLD_LAKE_ISLANDS) {
      const d = Math.hypot(isl.x - FISHING_LAKE_CENTER.x, isl.z - FISHING_LAKE_CENTER.z);
      assert.ok(d > 8 && d < FISHING_LAKE_RADIUS + 1.5, `Island ${isl.id} poorly placed (${d})`);
    }
  });

  it('provides walkable shelter protection inside abandoned cabins, caves, research shelters, and Zone 5 hospital', () => {
    // Zone 5 Walkable Emergency Triage & Research Hall has collisionRadius === 0 and isShelter === true
    const hospitalHall = WORLD_LANDMARKS.find((l) => l.id === 'z5_hospital_walkable_ward');
    assert.ok(hospitalHall);
    assert.equal(hospitalHall.collisionRadius, 0);
    assert.equal(hospitalHall.isShelter, true);

    const shelterHit = isInsideNaturalShelter(hospitalHall.x, hospitalHall.z, 'level5');
    assert.ok(shelterHit);
    assert.equal(shelterHit.landmarkId, 'z5_hospital_walkable_ward');
    assert.ok(shelterHit.warmthBonus > 1.0);

    // Standing far away in open wilderness returns null
    const openHit = isInsideNaturalShelter(
      ZONE_SPECS.level5.centerX,
      ZONE_SPECS.level5.centerZ,
      'level5',
    );
    assert.equal(openHit, null);
  });

  it('evaluates dangerous weak-ice hazard zones in Zone 1 lake and Zone 4 frozen river', () => {
    const lakePatch = WORLD_WEAK_ICE_ZONES.find((w) => w.zone === 'level1');
    assert.ok(lakePatch);

    // Thin ice triggers hazard warning & chill bonus
    const thinRes = evaluateWeakIceHazard(lakePatch.x, lakePatch.z, 'level1', 0.32);
    assert.equal(thinRes.onWeakIce, true);
    assert.ok(thinRes.crackDanger > 0.3);
    assert.ok(thinRes.chillBonusMult > 1.15);
    assert.ok(thinRes.warning && thinRes.warning.includes('Weak Ice'));

    // Thick solid ice makes the lake patch safe
    const thickRes = evaluateWeakIceHazard(lakePatch.x, lakePatch.z, 'level1', 0.92);
    assert.equal(thickRes.onWeakIce, false);
    assert.equal(thickRes.chillBonusMult, 1);

    // Zone 4 frozen river centerline samples cleanly near 0 distance
    const midPt = WORLD_FROZEN_RIVER_POINTS[3];
    const rivSample = sampleTundraRiverDistance(midPt.x, midPt.z);
    assert.ok(rivSample.dist < 0.01);
    assert.ok(rivSample.halfWidth >= 4.5);
  });

  it('computes distinct zone-scaled dynamic winter atmospheres across weather & day/night', () => {
    const lakeClear = computeZoneAtmosphere('level1', 'clear', 0.5);
    const forestSnow = computeZoneAtmosphere('level2', 'light_snow', 0.5);
    const mountainBlizz = computeZoneAtmosphere('level3', 'blizzard', 0.05);
    const cityAir = computeZoneAtmosphere('city', 'blizzard', 0.5);

    assert.ok(forestSnow.fogDensityMult > lakeClear.fogDensityMult);
    assert.ok(mountainBlizz.windSpeedMult > lakeClear.windSpeedMult);
    assert.ok(mountainBlizz.fogDensityMult > forestSnow.fogDensityMult);
    assert.ok(cityAir.windSpeedMult < 0.5);
    assert.notEqual(lakeClear.conditionLabel, mountainBlizz.conditionLabel);
  });
});
