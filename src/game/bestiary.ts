import type {
  AnimalKind,
  AnimalRarity,
  BestiaryMap,
  BestiaryRecord,
} from './types';
import { SPECIES_SPECS, WILDLIFE_SPECIES_ORDER, type SpeciesSpec } from './wildlife';

export interface BestiaryLoreEntry {
  kind: AnimalKind;
  name: string;
  taxonomicName: string;
  rarity: AnimalRarity;
  biomeZone: string;
  temperament: string;
  recommendedTool: string;
  huntingTip: string;
  lore: string;
}

export const BESTIARY_LORE: Record<AnimalKind, BestiaryLoreEntry> = {
  hare: {
    kind: 'hare',
    name: 'Snow Hare',
    taxonomicName: 'Lepus arcticus borealis',
    rarity: 'common',
    biomeZone: 'Inner Pine Clearings',
    temperament: 'Timid Prey',
    recommendedTool: 'Ashwood Bow',
    huntingTip: 'Crouch-walk or loose an arrow before closing inside 6m; ambush hits drop hares cleanly in one shot.',
    lore: 'Snow hares shed their autumn russet fur for dense winter white before the first hard freeze. Trappers prize their light pelts for glove linings and hood trim.',
  },
  fox: {
    kind: 'fox',
    name: 'Winter Fox',
    taxonomicName: 'Vulpes lagopus',
    rarity: 'common',
    biomeZone: 'Mid-Forest Snowdrifts',
    temperament: 'Curious · Evasive',
    recommendedTool: 'Ashwood Bow',
    huntingTip: 'Stand still when a fox spots you at mid-range—its curiosity will draw it into an easy orbiting trot for an ambush shot.',
    lore: 'Sharp-eyed scavengers of the Frostwood timberline. Older woodsmen say a fox that circles your lantern rather than bolting is gauging whether you carry dried venison.',
  },
  stag: {
    kind: 'stag',
    name: 'Alpine Deer',
    taxonomicName: 'Rangifer montanus',
    rarity: 'common',
    biomeZone: 'Boreal Birch & Pine Groves',
    temperament: 'Alert Grazer',
    recommendedTool: 'Upgraded Bow',
    huntingTip: 'Pause whenever its head snaps upright in alert; once it lowers its muzzle to graze again, strike from the flank.',
    lore: 'Broad hooves let these alpine stags cross chest-deep powder without sinking. Shed antlers gathered in late winter are carved into bow nocks and camp tools.',
  },
  wolf: {
    kind: 'wolf',
    name: 'Timber Wolf',
    taxonomicName: 'Canis lupus glacialis',
    rarity: 'uncommon',
    biomeZone: 'Outer Timber Ring',
    temperament: 'Pack Predator',
    recommendedTool: 'Cleaver Hatchet or Bow',
    huntingTip: 'Watch for the crimson pounce ring during its windup crouch; sidestep the lunge and counter with heavy strikes.',
    lore: 'Driven down from the high ridges whenever blizzards sweep the valley, timber wolves respect only the forge fire and the radius of a blazing camp ward.',
  },
  lynx: {
    kind: 'lynx',
    name: 'Snow Lynx',
    taxonomicName: 'Lynx canadensis nivis',
    rarity: 'uncommon',
    biomeZone: 'Deep Spruce Thickets',
    temperament: 'Agile Stalker',
    recommendedTool: 'Ashwood Bow',
    huntingTip: 'Faster than a wolf with a shorter windup—tag it at range before it closes into pounce distance.',
    lore: 'Tufted ears and broad snowshoe paws make the snow lynx nearly silent among fallen boughs. Its dappled silver coat fetches steep prices at southern markets.',
  },
  polar_bear: {
    kind: 'polar_bear',
    name: 'Arctic Polar Bear',
    taxonomicName: 'Ursus maritimus boreus',
    rarity: 'rare',
    biomeZone: 'Far Glacial Drift',
    temperament: 'Territorial Apex Predator',
    recommendedTool: 'Flint-Tipped Bow & Fire Buffs',
    huntingTip: 'Wait out its heavy maul windup outside reach, kite with bow volleys, and retreat inside the Storm Shelter or campfire ward if injured.',
    lore: 'Occasionally a wandering sea-ice bear follows frozen riverbeds miles inland into the Frostwood basin. Its double-layered coat shrugs off sleet and light arrows alike.',
  },
  frost_stag: {
    kind: 'frost_stag',
    name: 'Frosthorn White Stag',
    taxonomicName: 'Cervus pruina',
    rarity: 'rare',
    biomeZone: 'Elder Frostwood Glades',
    temperament: 'Mythic Shy Grazer',
    recommendedTool: 'Masterwork Bow (Ambush)',
    huntingTip: 'Lightning-fast when spooked—approach slowly in snowfall cover and open with a full-draw ambush arrow.',
    lore: 'Rime ice crystallizes along the sweeping antlers of this rare albino monarch. Charter lore claims its antlers hum softly whenever aurora ribbons cross the sky.',
  },
  mammoth: {
    kind: 'mammoth',
    name: 'Elder Woolly Mammoth',
    taxonomicName: 'Mammuthus primigenius',
    rarity: 'epic',
    biomeZone: 'Frozen Perimeter Wastes',
    temperament: 'Colossal Titan',
    recommendedTool: 'Tier 3+ Bow & Insulated Boots',
    huntingTip: 'Its massive tusk charge hits like an avalanche—keep moving perpendicular to its windup telegraph and chip away with sustained bow fire.',
    lore: 'A living relic of the deep ice epoch, rarely glimpsed beyond the outer pines. Its shaggy umber fleece and twin ivory tusks can fund an entire timber settlement.',
  },
  musk_ox: {
    kind: 'musk_ox',
    name: 'Tundra Musk Ox',
    taxonomicName: 'Ovibos moschatus glacialis',
    rarity: 'rare',
    biomeZone: 'Wind-Swept Tundra Ridges',
    temperament: 'Stout Armored Grazer',
    recommendedTool: 'Tier 3+ Axe or Runic Longbow',
    huntingTip: 'Dense woolly coat absorbs light arrows—aim from ambush with upgraded bows or flank its sweeping horn boss.',
    lore: 'Weathered herdsmen call its silky under-wool qiviut—warmer than any sheep fleece. Heavy horned skulls form living bulwarks when Arctic gales sweep across the drifts.',
  },
  sabertooth: {
    kind: 'sabertooth',
    name: 'Glacial Sabertooth',
    taxonomicName: 'Smilodon borealis',
    rarity: 'epic',
    biomeZone: 'Deep Frozen Timberline',
    temperament: 'Ambush Apex Predator',
    recommendedTool: 'Epic Bow & Insulated Boots',
    huntingTip: 'Coils low before an explosive pounce—watch the red telegraph ring, strafe wide, and burst it down during recovery.',
    lore: 'Thought vanished since the elder frost, solitary sabertooths occasionally prowl out from mountain ice caves at dusk. Their twin serrated fangs cleave through heavy pelts effortlessly.',
  },
  aurora_fenrir: {
    kind: 'aurora_fenrir',
    name: 'Aurora Frost-Fenrir',
    taxonomicName: 'Lupus borealis aetherius',
    rarity: 'mythic',
    biomeZone: 'Outer Aurora Glades',
    temperament: 'Mythic Alpha Guardian',
    recommendedTool: 'Mythic Bow / Greataxe & Aurora Charm',
    huntingTip: 'Extremely rare and relentless—stock Glacial Whetstone or Aurora Heart Talisman, kite around cover, and harvest its rich Ice Shards.',
    lore: 'Crowned with living glacier crystal spines that shimmer beneath northern skies, this mythic alpha hound walks only the deepest cold. Trappers whisper that a single pelt can ransom a fortress.',
  },
};

export function createEmptyBestiaryRecord(): BestiaryRecord {
  return {
    discovered: false,
    sightings: 0,
    hunted: 0,
    hitsLanded: 0,
    damageDealt: 0,
    ambushHits: 0,
    peltsEarned: 0,
    goldEarned: 0,
    bestKillHits: null,
    firstDiscoveredAt: null,
  };
}

export function createEmptyBestiary(): BestiaryMap {
  const map = {} as BestiaryMap;
  for (const kind of WILDLIFE_SPECIES_ORDER) {
    map[kind] = createEmptyBestiaryRecord();
  }
  return map;
}

function nonNegInt(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function sanitizeBestiary(raw: unknown): BestiaryMap {
  const base = createEmptyBestiary();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  for (const kind of WILDLIFE_SPECIES_ORDER) {
    const entry = obj[kind];
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    const hunted = nonNegInt(rec.hunted);
    const sightings = nonNegInt(rec.sightings);
    const hitsLanded = nonNegInt(rec.hitsLanded);
    const discovered =
      Boolean(rec.discovered) || hunted > 0 || sightings > 0 || hitsLanded > 0;
    const bestKillRaw = rec.bestKillHits;
    const bestKillHits =
      typeof bestKillRaw === 'number' && Number.isFinite(bestKillRaw) && bestKillRaw > 0
        ? Math.round(bestKillRaw)
        : null;

    base[kind] = {
      discovered,
      sightings: Math.max(sightings, discovered ? 1 : 0),
      hunted,
      hitsLanded,
      damageDealt: nonNegInt(rec.damageDealt),
      ambushHits: nonNegInt(rec.ambushHits),
      peltsEarned: nonNegInt(rec.peltsEarned),
      goldEarned: nonNegInt(rec.goldEarned),
      bestKillHits,
      firstDiscoveredAt:
        typeof rec.firstDiscoveredAt === 'string' && rec.firstDiscoveredAt
          ? rec.firstDiscoveredAt
          : null,
    };
  }
  return base;
}

export function cloneBestiary(map: BestiaryMap): BestiaryMap {
  const copy = {} as BestiaryMap;
  for (const kind of WILDLIFE_SPECIES_ORDER) {
    copy[kind] = { ...(map[kind] ?? createEmptyBestiaryRecord()) };
  }
  return copy;
}

export function recordAnimalSighting(
  map: BestiaryMap,
  kind: AnimalKind,
  timestamp: string = new Date().toISOString(),
): { bestiary: BestiaryMap; newlyDiscovered: boolean } {
  const prev = map[kind] ?? createEmptyBestiaryRecord();
  const newlyDiscovered = !prev.discovered;
  const next = cloneBestiary(map);
  next[kind] = {
    ...prev,
    discovered: true,
    sightings: prev.sightings + 1,
    firstDiscoveredAt: prev.firstDiscoveredAt ?? timestamp,
  };
  return { bestiary: next, newlyDiscovered };
}

export function recordAnimalHit(
  map: BestiaryMap,
  kind: AnimalKind,
  damage: number,
  ambush: boolean,
  timestamp: string = new Date().toISOString(),
): { bestiary: BestiaryMap; newlyDiscovered: boolean } {
  const prev = map[kind] ?? createEmptyBestiaryRecord();
  const newlyDiscovered = !prev.discovered;
  const next = cloneBestiary(map);
  next[kind] = {
    ...prev,
    discovered: true,
    sightings: prev.sightings > 0 ? prev.sightings : 1,
    hitsLanded: prev.hitsLanded + 1,
    damageDealt: prev.damageDealt + Math.max(0, Math.round(damage)),
    ambushHits: prev.ambushHits + (ambush ? 1 : 0),
    firstDiscoveredAt: prev.firstDiscoveredAt ?? timestamp,
  };
  return { bestiary: next, newlyDiscovered };
}

export function recordAnimalKill(
  map: BestiaryMap,
  kind: AnimalKind,
  hitsOnTarget: number,
  peltsEarned: number,
  goldEarned: number,
  timestamp: string = new Date().toISOString(),
): { bestiary: BestiaryMap; newlyDiscovered: boolean } {
  const prev = map[kind] ?? createEmptyBestiaryRecord();
  const newlyDiscovered = !prev.discovered;
  const killHits = Math.max(1, Math.round(hitsOnTarget));
  const next = cloneBestiary(map);
  next[kind] = {
    ...prev,
    discovered: true,
    sightings: prev.sightings > 0 ? prev.sightings : 1,
    hunted: prev.hunted + 1,
    peltsEarned: prev.peltsEarned + Math.max(0, Math.round(peltsEarned)),
    goldEarned: prev.goldEarned + Math.max(0, Math.round(goldEarned)),
    bestKillHits:
      prev.bestKillHits === null ? killHits : Math.min(prev.bestKillHits, killHits),
    firstDiscoveredAt: prev.firstDiscoveredAt ?? timestamp,
  };
  return { bestiary: next, newlyDiscovered };
}

export interface HuntingEfficiencySummary {
  status: 'undiscovered' | 'scouted' | 'hunted';
  grade: string;
  efficiencyPct: number | null;
  avgHitsPerHunt: number | null;
  ambushRatePct: number | null;
  avgPeltsPerHunt: number | null;
  avgGoldPerHunt: number | null;
  avgDamagePerHit: number | null;
}

export function computeHuntingEfficiency(
  record: BestiaryRecord,
  spec: SpeciesSpec,
): HuntingEfficiencySummary {
  if (!record.discovered) {
    return {
      status: 'undiscovered',
      grade: 'Unknown',
      efficiencyPct: null,
      avgHitsPerHunt: null,
      ambushRatePct: null,
      avgPeltsPerHunt: null,
      avgGoldPerHunt: null,
      avgDamagePerHit: null,
    };
  }

  if (record.hunted <= 0) {
    return {
      status: 'scouted',
      grade: 'Scouted',
      efficiencyPct: null,
      avgHitsPerHunt: null,
      ambushRatePct: null,
      avgPeltsPerHunt: null,
      avgGoldPerHunt: null,
      avgDamagePerHit:
        record.hitsLanded > 0
          ? Math.round((record.damageDealt / record.hitsLanded) * 10) / 10
          : null,
    };
  }

  const hitsForHunts = Math.max(record.hunted, record.hitsLanded);
  const avgHits = hitsForHunts / record.hunted;
  const optimalHits = Math.max(1, Math.ceil(spec.maxHp / 45));
  const strikeEfficiency = Math.min(1, optimalHits / Math.max(1, avgHits));
  const ambushRatio = Math.min(1, record.ambushHits / Math.max(1, hitsForHunts));

  const efficiencyPct = Math.max(
    18,
    Math.min(100, Math.round(strikeEfficiency * 84 + ambushRatio * 16)),
  );

  const grade =
    efficiencyPct >= 90
      ? 'Apex'
      : efficiencyPct >= 75
        ? 'Sharp'
        : efficiencyPct >= 55
          ? 'Steady'
          : 'Raw';

  return {
    status: 'hunted',
    grade,
    efficiencyPct,
    avgHitsPerHunt: Math.round(avgHits * 10) / 10,
    ambushRatePct: Math.round(ambushRatio * 100),
    avgPeltsPerHunt: Math.round((record.peltsEarned / record.hunted) * 10) / 10,
    avgGoldPerHunt: Math.round((record.goldEarned / record.hunted) * 10) / 10,
    avgDamagePerHit:
      record.hitsLanded > 0
        ? Math.round((record.damageDealt / record.hitsLanded) * 10) / 10
        : null,
  };
}

export function countDiscoveredSpecies(bestiary: BestiaryMap): number {
  let count = 0;
  for (const kind of WILDLIFE_SPECIES_ORDER) {
    if (bestiary[kind]?.discovered) count += 1;
  }
  return count;
}

export function getRarityLabel(rarity: AnimalRarity): string {
  switch (rarity) {
    case 'common':
      return 'Common';
    case 'uncommon':
      return 'Uncommon';
    case 'rare':
      return 'Rare';
    case 'epic':
      return 'Epic';
    case 'mythic':
      return 'Mythic';
  }
}

export function getSpeciesSpecAndLore(kind: AnimalKind) {
  return {
    spec: SPECIES_SPECS[kind],
    lore: BESTIARY_LORE[kind],
  };
}
