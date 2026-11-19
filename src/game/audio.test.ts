import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSpatialDistanceGain,
  computeSpatialStereoPan,
  computeWeatherAmbientMix,
  getBiomeAudioProfile,
  getSpeciesAttackSoundProfile,
} from './audio';

test('biome audio profiles shape wind whistling and canopy rustle across zones', () => {
  const woods = getBiomeAudioProfile('level1');
  const chasm = getBiomeAudioProfile('level3');
  const city = getBiomeAudioProfile('city');

  assert.ok(woods.rustleScale > chasm.rustleScale, 'pine woods have stronger needle rustle than ice chasm');
  assert.ok(chasm.whistleScale > city.whistleScale, 'glacial chasm has stronger wind whistle than sheltered city');
  assert.ok(woods.callIntervalSec < city.callIntervalSec);

  const woodsMix = computeWeatherAmbientMix({
    weatherIntensity: 0.5,
    gustIntensity: 0.4,
    campDist: 20,
    campX: 0,
    campZ: 0,
    playerX: 10,
    playerZ: 10,
    time: 2.0,
    nearCampfire: false,
    zone: 'level1',
  });
  const cityMix = computeWeatherAmbientMix({
    weatherIntensity: 0.5,
    gustIntensity: 0.4,
    campDist: 20,
    campX: 0,
    campZ: 0,
    playerX: 10,
    playerZ: 10,
    time: 2.0,
    nearCampfire: false,
    zone: 'city',
  });
  assert.ok(woodsMix.whistleGain > cityMix.whistleGain);
  assert.ok(woodsMix.whistleFilterHz > 200);
});

test('spatial stereo pan and distance attenuation follow listener coordinates accurately', () => {
  assert.equal(computeSpatialStereoPan(0, 0, 0, 0), 0);
  const rightPan = computeSpatialStereoPan(0, 0, 12, 0);
  const leftPan = computeSpatialStereoPan(0, 0, -12, 0);
  assert.ok(rightPan > 0.7 && rightPan <= 0.85);
  assert.ok(leftPan < -0.7 && leftPan >= -0.85);

  assert.equal(computeSpatialDistanceGain(0, 18), 1);
  const mid = computeSpatialDistanceGain(9, 18);
  assert.ok(mid > 0.2 && mid < 0.5);
  assert.equal(computeSpatialDistanceGain(22, 18), 0);
});

test('weather ambient mix shifts smoothly from clear rustle to light snow to howling blizzard wind', () => {
  const clearMix = computeWeatherAmbientMix({
    weatherIntensity: 0,
    gustIntensity: 0,
    campDist: 3,
    campX: 0,
    campZ: 0,
    playerX: 0,
    playerZ: 3,
    time: 1.5,
    nearCampfire: true,
  });

  const lightSnowMix = computeWeatherAmbientMix({
    weatherIntensity: 0.45,
    gustIntensity: 0.28,
    campDist: 10,
    campX: 0,
    campZ: 0,
    playerX: -8,
    playerZ: 6,
    time: 1.5,
    nearCampfire: false,
  });

  const blizzardMix = computeWeatherAmbientMix({
    weatherIntensity: 1.0,
    gustIntensity: 1.0,
    campDist: 24,
    campX: 0,
    campZ: 0,
    playerX: 16,
    playerZ: 18,
    time: 1.5,
    nearCampfire: false,
  });

  // Soft snowfall rustling rises cleanly in light snow
  assert.ok(lightSnowMix.rustleGain > clearMix.rustleGain);

  // Howling wind gain, resonance Q, and filter sweep intensify strongly in blizzard without sharp Q whistling
  assert.ok(blizzardMix.windGain > lightSnowMix.windGain * 3);
  assert.ok(blizzardMix.rumbleGain > lightSnowMix.rumbleGain * 3);
  assert.ok(blizzardMix.windQ > lightSnowMix.windQ);
  assert.ok(blizzardMix.windQ <= 2.5);
  assert.ok(blizzardMix.windFilterHz > lightSnowMix.windFilterHz);

  // Frame-to-frame modulation changes gently without sudden spikes
  const nextFrameMix = computeWeatherAmbientMix({
    weatherIntensity: 1.0,
    gustIntensity: 1.0,
    campDist: 24,
    campX: 0,
    campZ: 0,
    playerX: 16,
    playerZ: 18,
    time: 1.6,
    nearCampfire: false,
  });
  assert.ok(Math.abs(nextFrameMix.windFilterHz - blizzardMix.windFilterHz) < 5);
  assert.ok(Math.abs(nextFrameMix.windGain - blizzardMix.windGain) < 0.005);

  // Campfire spatial crackle fades to 0 when far away and pans opposite to player X
  assert.ok(clearMix.campfireGain > lightSnowMix.campfireGain);
  assert.equal(blizzardMix.campfireGain, 0);
  assert.ok(lightSnowMix.campfirePan > 0); // camp at X=0 is to the right of player at X=-8
  assert.ok(blizzardMix.campfirePan < 0); // camp at X=0 is to the left of player at X=16
});

test('predator species have distinct windup and attack sound profiles', () => {
  const wolf = getSpeciesAttackSoundProfile('wolf');
  const lynx = getSpeciesAttackSoundProfile('lynx');
  const sabertooth = getSpeciesAttackSoundProfile('sabertooth');
  const bear = getSpeciesAttackSoundProfile('polar_bear');
  const mammoth = getSpeciesAttackSoundProfile('mammoth');
  const fenrir = getSpeciesAttackSoundProfile('aurora_fenrir');

  // Bear roar sits deeper than feline lynx shriek
  assert.ok(bear.attackStartHz < lynx.attackStartHz);
  assert.ok(bear.windupStartHz < wolf.windupStartHz);
  // Sabertooth strike is heavier & deeper than lynx
  assert.ok(sabertooth.attackEndHz < lynx.attackEndHz);
  // Mammoth trumpet windup lasts longer than fast ambush lynx
  assert.ok(mammoth.windupDuration > lynx.windupDuration);
  // Fenrir has a stronger lunge gain & distinct pitch sweep vs base wolf
  assert.ok(fenrir.attackGain > wolf.attackGain);
  assert.notEqual(fenrir.attackStartHz, wolf.attackStartHz);
});
