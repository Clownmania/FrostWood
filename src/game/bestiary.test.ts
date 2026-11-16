import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BESTIARY_LORE,
  computeHuntingEfficiency,
  countDiscoveredSpecies,
  createEmptyBestiary,
  recordAnimalHit,
  recordAnimalKill,
  recordAnimalSighting,
  sanitizeBestiary,
} from './bestiary';
import { createDefaultProgress, parseStoredProgress, recordExpeditionResult } from './persistence';
import { INITIAL_STATS } from './economy';
import { SPECIES_SPECS, WILDLIFE_SPECIES_ORDER } from './wildlife';

test('every Arctic species has Bestiary lore and starts undiscovered', () => {
  const bestiary = createEmptyBestiary();
  assert.equal(countDiscoveredSpecies(bestiary), 0);

  for (const kind of WILDLIFE_SPECIES_ORDER) {
    assert.ok(BESTIARY_LORE[kind].lore.length > 30);
    assert.ok(BESTIARY_LORE[kind].huntingTip.length > 20);
    assert.equal(bestiary[kind].discovered, false);
    const eff = computeHuntingEfficiency(bestiary[kind], SPECIES_SPECS[kind]);
    assert.equal(eff.status, 'undiscovered');
    assert.equal(eff.efficiencyPct, null);
  }
});

test('sightings, hits, and kills track discovery and compute real hunting efficiency', () => {
  let bestiary = createEmptyBestiary();

  const seen = recordAnimalSighting(bestiary, 'polar_bear', '2026-11-15T12:00:00Z');
  bestiary = seen.bestiary;
  assert.equal(seen.newlyDiscovered, true);
  assert.equal(countDiscoveredSpecies(bestiary), 1);

  const scoutEff = computeHuntingEfficiency(bestiary.polar_bear, SPECIES_SPECS.polar_bear);
  assert.equal(scoutEff.status, 'scouted');
  assert.equal(scoutEff.efficiencyPct, null);

  // Land an ambush opening hit and follow-up hits to fell a hare cleanly
  const h1 = recordAnimalHit(bestiary, 'hare', 35, true);
  bestiary = h1.bestiary;
  assert.equal(h1.newlyDiscovered, true);
  const k1 = recordAnimalKill(bestiary, 'hare', 1, 2, 5);
  bestiary = k1.bestiary;
  assert.equal(k1.newlyDiscovered, false);

  const hareEff = computeHuntingEfficiency(bestiary.hare, SPECIES_SPECS.hare);
  assert.equal(hareEff.status, 'hunted');
  assert.equal(hareEff.efficiencyPct, 100);
  assert.equal(hareEff.grade, 'Apex');
  assert.equal(hareEff.avgHitsPerHunt, 1);
  assert.equal(hareEff.ambushRatePct, 100);
  assert.equal(hareEff.avgPeltsPerHunt, 2);
  assert.equal(hareEff.avgGoldPerHunt, 5);
});

test('persistence preserves and sanitizes Bestiary records across runs', () => {
  let progress = createDefaultProgress(0);
  const seen = recordAnimalSighting(
    progress.bestiary ?? createEmptyBestiary(),
    'mammoth',
  );
  progress = {
    ...progress,
    bestiary: seen.bestiary,
  };

  const recorded = recordExpeditionResult(progress, {
    stats: { ...INITIAL_STATS, goldEarned: 250, animalsHunted: 4 },
    cabinTier: 3,
    victory: false,
  });

  const roundTrip = parseStoredProgress(JSON.stringify(recorded.progress), 0);
  assert.equal(roundTrip.bestiary?.mammoth.discovered, true);
  assert.equal(roundTrip.bestiary?.mammoth.sightings, 1);
  assert.equal(roundTrip.bestiary?.hare.discovered, false);

  const sanitized = sanitizeBestiary({ wolf: { hunted: 3, hitsLanded: 9, ambushHits: 3 } });
  assert.equal(sanitized.wolf.discovered, true);
  assert.equal(sanitized.wolf.hunted, 3);
  assert.equal(sanitized.fox.discovered, false);
});
