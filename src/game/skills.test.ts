import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_BACKPACK_CAPACITY,
  MAX_SKILL_LEVEL,
  clampCargoAddition,
  computeBackpackCapacity,
  computeBackpackUsed,
  computeGatheringNodeXp,
  computeHuntingKillXp,
  computeSkillBonuses,
  countSpentSkillPoints,
  createInitialSkillsState,
  getSkillPerkRequiredLevel,
  getSkillPerkUpgradeCost,
  grantSkillXp,
  respecSkillPerks,
  sanitizeSkillsState,
  unlockSkillPerk,
  xpRequiredForSkillLevel,
} from './skills';

test('grantSkillXp advances Gathering & Hunting levels and awards skill points across thresholds', () => {
  let skills = createInitialSkillsState();
  assert.equal(skills.gatheringLevel, 1);
  assert.equal(skills.gatheringPoints, 0);

  const req1 = xpRequiredForSkillLevel(1);
  const partial = grantSkillXp(skills, 'gathering', req1 - 5);
  assert.equal(partial.leveledUp, false);
  assert.equal(partial.skills.gatheringLevel, 1);
  assert.equal(partial.skills.gatheringXp, req1 - 5);

  // Grant enough XP to jump two levels at once
  const req2 = xpRequiredForSkillLevel(2);
  const levelUp = grantSkillXp(partial.skills, 'gathering', 5 + req2 + 12);
  assert.equal(levelUp.leveledUp, true);
  assert.equal(levelUp.levelsGained, 2);
  assert.equal(levelUp.newLevel, 3);
  assert.equal(levelUp.skills.gatheringPoints, 2);
  assert.equal(levelUp.skills.gatheringXp, 12);

  // Hunting branch progresses independently
  const huntRes = grantSkillXp(levelUp.skills, 'hunting', xpRequiredForSkillLevel(1) + 4);
  assert.equal(huntRes.leveledUp, true);
  assert.equal(huntRes.skills.huntingLevel, 2);
  assert.equal(huntRes.skills.huntingPoints, 1);
  assert.equal(huntRes.skills.gatheringPoints, 2);

  // XP caps cleanly at MAX_SKILL_LEVEL
  const maxed = grantSkillXp(huntRes.skills, 'hunting', 999999);
  assert.equal(maxed.skills.huntingLevel, MAX_SKILL_LEVEL);
  assert.equal(maxed.skills.huntingXp, 0);
});

test('unlockSkillPerk enforces escalating point costs, branch level gates, and cumulative respec refunds', () => {
  let skills = createInitialSkillsState();
  const denied = unlockSkillPerk(skills, 'pack_capacity');
  assert.equal(denied.unlocked, false);

  assert.equal(getSkillPerkUpgradeCost(0), 1);
  assert.equal(getSkillPerkUpgradeCost(1), 2);
  assert.equal(getSkillPerkUpgradeCost(2), 3);
  assert.equal(getSkillPerkRequiredLevel(0), 1);
  assert.equal(getSkillPerkRequiredLevel(1), 4);
  assert.equal(getSkillPerkRequiredLevel(2), 8);

  // Grant enough XP to reach level 3 in gathering -> can unlock Rank 1, but Rank 2 requires Level 4 & 2 pts
  const lvl3Xp = xpRequiredForSkillLevel(1) + xpRequiredForSkillLevel(2) + 5;
  skills = grantSkillXp(skills, 'gathering', lvl3Xp).skills;
  assert.equal(skills.gatheringLevel, 3);
  const rank1 = unlockSkillPerk(skills, 'pack_capacity');
  assert.equal(rank1.unlocked, true);
  assert.equal(rank1.newRank, 1);
  const rank2Gated = unlockSkillPerk(rank1.skills, 'pack_capacity');
  assert.equal(rank2Gated.unlocked, false);

  // Grant substantial XP so both branches reach >= Level 8 with enough points
  skills = grantSkillXp(skills, 'gathering', 25000).skills;
  skills = grantSkillXp(skills, 'hunting', 25000).skills;
  assert.ok(skills.gatheringLevel >= 8);
  assert.ok(skills.huntingLevel >= 8);

  const baseBonuses = computeSkillBonuses(skills);
  const baseCap = computeBackpackCapacity(skills, 1);
  assert.equal(baseCap, BASE_BACKPACK_CAPACITY);
  assert.equal(baseBonuses.moveSpeedMult, 1);

  // Unlock Expedition Pack Rank 1 (1 pt) & Rank 2 (2 pts) = 3 pts spent
  const r1 = unlockSkillPerk(skills, 'pack_capacity');
  assert.equal(r1.unlocked, true);
  const r2 = unlockSkillPerk(r1.skills, 'pack_capacity');
  assert.equal(r2.unlocked, true);
  assert.equal(r2.newRank, 2);
  assert.ok(computeBackpackCapacity(r2.skills, 1) > baseCap + 70);

  // Unlock Swift Stride Rank 1 (1) + 2 (2) + 3 (3) = 6 pts spent
  let s = r2.skills;
  s = unlockSkillPerk(s, 'move_speed').skills;
  s = unlockSkillPerk(s, 'move_speed').skills;
  s = unlockSkillPerk(s, 'move_speed').skills;
  assert.equal(unlockSkillPerk(s, 'move_speed').unlocked, false); // Rank cap is 3

  // Unlock Hunting passives: 1 pt each (total 3 hunting pts spent)
  s = unlockSkillPerk(s, 'hunt_damage').skills;
  s = unlockSkillPerk(s, 'pelt_yield').skills;
  s = unlockSkillPerk(s, 'cold_resist').skills;

  const upgradedBonuses = computeSkillBonuses(s);
  assert.ok(upgradedBonuses.moveSpeedMult >= 1.24);
  assert.ok(upgradedBonuses.huntDamageMult > 1.1);
  assert.ok(upgradedBonuses.peltYieldMult > 1.15);
  assert.ok(upgradedBonuses.peltValueMult > 1.05);
  assert.ok(upgradedBonuses.maxHpBonus >= 15);
  assert.ok(upgradedBonuses.coldDecayMult < 0.9);
  assert.equal(countSpentSkillPoints(s), 12);

  // Respec refunds cumulative spent points (9 gathering + 3 hunting = 12) while keeping levels
  const beforeGatherPts = s.gatheringPoints;
  const beforeHuntPts = s.huntingPoints;
  const respec = respecSkillPerks(s);
  assert.equal(respec.refunded, 12);
  assert.equal(respec.skills.gatheringPoints, beforeGatherPts + 9);
  assert.equal(respec.skills.huntingPoints, beforeHuntPts + 3);
  assert.equal(computeBackpackCapacity(respec.skills, 1), BASE_BACKPACK_CAPACITY);
});

test('backpack usage, clamping, XP rewards, and malformed storage sanitization work reliably', () => {
  const used = computeBackpackUsed({ wood: 24, stone: 10, ice: 4, pelts: 11, gold: 300 });
  // Only carried cargo (wood + stone + pelts) consumes backpack capacity; gold & ice are light currency/shards
  assert.equal(used, 45);
  assert.equal(clampCargoAddition(used, 50, 8), 5);
  assert.equal(clampCargoAddition(50, 50, 8), 0);

  assert.ok(computeGatheringNodeXp('elder') > computeGatheringNodeXp('pine'));
  assert.ok(computeHuntingKillXp('mythic') > computeHuntingKillXp('epic'));
  assert.ok(computeHuntingKillXp('epic') > computeHuntingKillXp('rare'));

  const sanitized = sanitizeSkillsState({
    gatheringLevel: 999,
    gatheringXp: -12,
    gatheringPoints: 3,
    ranks: { pack_capacity: 99, move_speed: '2' },
  });
  assert.equal(sanitized.gatheringLevel, MAX_SKILL_LEVEL);
  assert.equal(sanitized.gatheringXp, 0);
  assert.equal(sanitized.ranks.pack_capacity, 3);
  assert.equal(sanitized.ranks.move_speed, 2);
});

test('triggerSkillPerkGatheringPulse and stepSkillPerkGatheringPulse activate and decay HUD perk pulses during gathering tasks', async () => {
  const {
    createInitialSkillPerkPulse,
    triggerSkillPerkGatheringPulse,
    stepSkillPerkGatheringPulse,
    SKILL_PERK_PULSE_DURATION,
  } = await import('./skills');

  const baseSkills = createInitialSkillsState();
  let pulse = createInitialSkillPerkPulse();
  assert.equal(pulse.active, false);

  // Without any unlocked gathering perks, triggering a wood task does not activate the pulse
  const noPerkPulse = triggerSkillPerkGatheringPulse(pulse, baseSkills, 'wood');
  assert.equal(noPerkPulse.active, false);

  // Unlock Boreal Harvester (gather_yield Rank 2) and Expedition Pack (pack_capacity Rank 1)
  const boostedSkills = {
    ...baseSkills,
    ranks: {
      ...baseSkills.ranks,
      gather_yield: 2,
      pack_capacity: 1,
      pelt_yield: 3,
    },
  };

  pulse = triggerSkillPerkGatheringPulse(pulse, boostedSkills, 'wood', 'Timber Felling');
  assert.equal(pulse.active, true);
  assert.equal(pulse.perkId, 'gather_yield');
  assert.equal(pulse.perkName, 'Boreal Harvester');
  assert.equal(pulse.rank, 2);
  assert.equal(pulse.bonusPct, 30);
  assert.equal(pulse.pulseNonce, 1);
  assert.equal(pulse.activeResources.wood, SKILL_PERK_PULSE_DURATION);
  assert.equal(pulse.activeResources.pack, SKILL_PERK_PULSE_DURATION);

  // Triggering pelt gathering activates Master Skinner (pelt_yield Rank 3 = +75%)
  pulse = triggerSkillPerkGatheringPulse(pulse, boostedSkills, 'pelts', 'Arctic Skinning');
  assert.equal(pulse.active, true);
  assert.equal(pulse.perkId, 'pelt_yield');
  assert.equal(pulse.perkName, 'Master Skinner');
  assert.equal(pulse.bonusPct, 75);
  assert.equal(pulse.pulseNonce, 2);
  assert.equal(pulse.activeResources.pelts, SKILL_PERK_PULSE_DURATION);

  // Stepping partially keeps pulse active; stepping past duration deactivates it cleanly
  const mid = stepSkillPerkGatheringPulse(pulse, 1.2);
  assert.equal(mid.active, true);
  assert.ok(mid.timeRemaining > 1.5);

  const expired = stepSkillPerkGatheringPulse(mid, 3.0);
  assert.equal(expired.active, false);
  assert.equal(expired.timeRemaining, 0);
});

