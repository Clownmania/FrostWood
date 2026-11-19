import type { CityTraderId } from './types';
import type { ChibiNpcArchetype } from './characterRig';
import type { CityChibiPbrMaterialSet } from './city';

export type NpcRole =
  | 'leader'
  | 'doctor'
  | 'merchant'
  | 'engineer'
  | 'recruiter'
  | 'hunter'
  | 'black_market'
  | 'security'
  | 'scientist'
  | 'mechanic'
  | 'citizen'
  | 'guard';

export type FactionId = 'survivors' | 'iron_wolves' | 'northern_order';

export interface NpcScheduleEntry {
  startHour: number;
  endHour: number;
  locationName: string;
  x: number;
  z: number;
  activity: string;
}

export interface NpcDialogueNode {
  id: string;
  speaker: string;
  text: string;
  responses: Array<{
    label: string;
    nextNodeId?: string;
    action?: 'open_shop' | 'open_quests' | 'heal_player' | 'trigger_bounty' | 'close';
  }>;
}

export interface NpcArchetype {
  name: string;
  role: NpcRole;
  archetypeId: ChibiNpcArchetype['id'];
  dialogueTree: Record<string, NpcDialogueNode>;
  schedule: readonly NpcScheduleEntry[];
}

export interface FrosthavenNpcDefinition extends NpcArchetype {
  id: string;
  title: string;
  faction: FactionId;
  district: 'District A' | 'District B' | 'District C' | 'District D' | 'District E' | 'District F';
  baseX: number;
  baseZ: number;
  facingYaw: number;
  personality: string;
  bio: string;
  preferredTraderId?: CityTraderId;
}

export const FROSTHAVEN_NPCS: readonly FrosthavenNpcDefinition[] = [
  {
    id: 'marcus_leader',
    name: 'Marcus Vance',
    title: 'City Leader & Founder',
    role: 'leader',
    faction: 'survivors',
    district: 'District A',
    baseX: 96,
    baseZ: -8,
    facingYaw: 0,
    personality: 'Stoic, determined, pragmatic survivor leader.',
    bio: 'Former military commander who organized Frosthaven out of the ruins of the northern capital.',
    schedule: [
      { startHour: 6, endHour: 20, locationName: 'City Hall Command Office', x: 96, z: -8, activity: 'Governing & Mission Briefings' },
      { startHour: 20, endHour: 6, locationName: 'Commander Quarters', x: 92, z: -14, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Marcus Vance',
        text: 'Welcome to Frosthaven, survivor. We stand at the edge of the abyss, but together we endure.',
        responses: [
          { label: 'What is our current situation?', nextNodeId: 'situation' },
          { label: 'Do you have any directives for me?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Farewell.', action: 'close' },
        ],
      },
      situation: {
        id: 'situation',
        speaker: 'Marcus Vance',
        text: 'Supplies are dwindling, and the Iron Wolves are probing our perimeter. We need scouts, fuel, and restored power.',
        responses: [{ label: 'Understood.', nextNodeId: 'root' }],
      },
    },
  },
  {
    id: 'elena_doctor',
    name: 'Dr. Elena Rostova',
    title: 'Chief Medical Officer',
    role: 'doctor',
    faction: 'survivors',
    district: 'District E',
    baseX: 114,
    baseZ: 18,
    facingYaw: Math.PI * 0.5,
    personality: 'Compassionate, exhausted, unflappable under pressure.',
    bio: 'Worked in the central hospital before the cataclysm; now fights daily to keep wounded hunters alive.',
    schedule: [
      { startHour: 7, endHour: 21, locationName: 'St. Borealis Triage Ward', x: 114, z: 18, activity: 'Treating Patients' },
      { startHour: 21, endHour: 7, locationName: 'Medical Quarters', x: 118, z: 14, activity: 'Sleeping' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Dr. Elena Rostova',
        text: 'Keep your distance if you are running a fever. Otherwise, state your medical needs.',
        responses: [
          { label: 'I need medical supplies or healing.', nextNodeId: 'heal', action: 'heal_player' },
          { label: 'Any research samples you need retrieved?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Goodbye.', action: 'close' },
        ],
      },
      heal: {
        id: 'heal',
        speaker: 'Dr. Elena Rostova',
        text: 'Let me check your vitals. Drink this warm saline solution and rest.',
        responses: [{ label: 'Thank you, Doctor.', nextNodeId: 'root' }],
      },
    },
  },
  {
    id: 'viktor_weapons',
    name: 'Viktor "Iron" Garan',
    title: 'Master Armorer & Weaponsmith',
    role: 'merchant',
    faction: 'survivors',
    district: 'District C',
    baseX: 114,
    baseZ: -14,
    facingYaw: 0,
    personality: 'Rough, blunt, takes immense pride in forged steel.',
    bio: 'Forges tempered frost-steel blades and reinforces firearms for the city militia.',
    preferredTraderId: 'tinker',
    schedule: [
      { startHour: 8, endHour: 19, locationName: 'Commercial Armory Stall', x: 114, z: -14, activity: 'Trading & Forging' },
      { startHour: 19, endHour: 8, locationName: 'Forge Backroom', x: 118, z: -18, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Viktor Garan',
        text: 'You want iron that won’t snap when the temperature drops to minus forty? You came to the right stall.',
        responses: [
          { label: 'Show me your weapons and gear.', nextNodeId: 'shop', action: 'open_shop' },
          { label: 'Got any work for a hunter?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'See you later.', action: 'close' },
        ],
      },
      shop: {
        id: 'shop',
        speaker: 'Viktor Garan',
        text: 'Take your pick. Keep your powder dry.',
        responses: [{ label: 'Back.', nextNodeId: 'root' }],
      },
    },
  },
  {
    id: 'thomas_engineer',
    name: 'Thomas Kael',
    title: 'Chief Infrastructure Engineer',
    role: 'engineer',
    faction: 'survivors',
    district: 'District D',
    baseX: 78,
    baseZ: 22,
    facingYaw: -Math.PI * 0.5,
    personality: 'Obsessive, energetic, speaks in gear ratios and voltage.',
    bio: 'Maintains the hydroelectric generator and steam pipes feeding warmth across Frosthaven.',
    schedule: [
      { startHour: 6, endHour: 22, locationName: 'Industrial Power Station', x: 78, z: 22, activity: 'Repairing Generators' },
      { startHour: 22, endHour: 6, locationName: 'Control Room Cot', x: 74, z: 26, activity: 'Sleeping' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Thomas Kael',
        text: 'If the secondary turbine drops another five PSI, half the residential block freezes tonight!',
        responses: [
          { label: 'How can I help restore power?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Stay warm, Thomas.', action: 'close' },
        ],
      },
    },
  },
  {
    id: 'sarah_recruiter',
    name: 'Sarah Chen',
    title: 'Survivor Scout & Recruiter',
    role: 'recruiter',
    faction: 'survivors',
    district: 'District A',
    baseX: 88,
    baseZ: -4,
    facingYaw: Math.PI * 0.25,
    personality: 'Optimistic, watchful, empathetic.',
    bio: 'Leads search parties into the frozen ruins to rescue trapped survivors.',
    schedule: [
      { startHour: 7, endHour: 19, locationName: 'Headquarters Plaza', x: 88, z: -4, activity: 'Coordinate Scouting' },
      { startHour: 19, endHour: 7, locationName: 'Barracks Loft', x: 84, z: -10, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Sarah Chen',
        text: 'So many souls still out there in the blizzard. Have you heard any radio signals?',
        responses: [
          { label: 'Any missing person missions available?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Not today, Sarah.', action: 'close' },
        ],
      },
    },
  },
  {
    id: 'daniel_hunter',
    name: 'Daniel Boone',
    title: 'Master Wilderness Tracker',
    role: 'hunter',
    faction: 'survivors',
    district: 'District F',
    baseX: 74,
    baseZ: -24,
    facingYaw: Math.PI,
    personality: 'Quiet, observant, lives for the hunt.',
    bio: 'Knows every wolf pack migration route and bear den across all five survival zones.',
    preferredTraderId: 'butcher',
    schedule: [
      { startHour: 6, endHour: 18, locationName: 'Outskirt Hunting Post', x: 74, z: -24, activity: 'Tracking & Skinning' },
      { startHour: 18, endHour: 6, locationName: 'Trapper Cabin', x: 70, z: -28, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Daniel Boone',
        text: 'The apex wolves are restless tonight. The cold brings out the hungriest beasts.',
        responses: [
          { label: 'Show me your meat and pelt trades.', nextNodeId: 'shop', action: 'open_shop' },
          { label: 'Got any hunting bounties?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Happy hunting.', action: 'close' },
        ],
      },
      shop: {
        id: 'shop',
        speaker: 'Daniel Boone',
        text: 'Fresh cuts and thick pelts. Fair trade.',
        responses: [{ label: 'Back.', nextNodeId: 'root' }],
      },
    },
  },
  {
    id: 'alex_black_market',
    name: 'Alex "Shadow" Vance',
    title: 'Black Market Broker',
    role: 'black_market',
    faction: 'iron_wolves',
    district: 'District C',
    baseX: 118,
    baseZ: 14,
    facingYaw: -Math.PI * 0.75,
    personality: 'Cunning, opportunistic, always smiling.',
    bio: 'Deals in contraband tech, rare narcotics, and classified military intel.',
    schedule: [
      { startHour: 18, endHour: 4, locationName: 'Hidden Alleyway Market', x: 118, z: 14, activity: 'Black Market Trading' },
      { startHour: 4, endHour: 18, locationName: 'Secret Safehouse', x: 124, z: 20, activity: 'Hiding' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Alex Vance',
        text: 'Keep your voice down. If Marcus asks, you bought those explosives from an honest merchant.',
        responses: [
          { label: 'Show me your contraband.', nextNodeId: 'shop', action: 'open_shop' },
          { label: 'Any high-risk jobs?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Goodbye.', action: 'close' },
        ],
      },
      shop: {
        id: 'shop',
        speaker: 'Alex Vance',
        text: 'For a price, I can get you anything from before the fall.',
        responses: [{ label: 'Back.', nextNodeId: 'root' }],
      },
    },
  },
  {
    id: 'richard_security',
    name: 'Commander Richard Sterling',
    title: 'City Defense Commander',
    role: 'security',
    faction: 'survivors',
    district: 'District A',
    baseX: 104,
    baseZ: -12,
    facingYaw: Math.PI * 0.75,
    personality: 'Strict, unyielding, tactical.',
    bio: 'Commands the gate guards and fortifies the perimeter against mutant incursions.',
    schedule: [
      { startHour: 6, endHour: 22, locationName: 'Gate Command Post', x: 104, z: -12, activity: 'Perimeter Defense' },
      { startHour: 22, endHour: 6, locationName: 'Guard Barracks', x: 108, z: -16, activity: 'Sleeping' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Commander Sterling',
        text: 'Perimeter is secure, but intelligence reports armed bandits gathering in District D.',
        responses: [
          { label: 'Any defense missions?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Carry on, Commander.', action: 'close' },
        ],
      },
    },
  },
  {
    id: 'sophia_scientist',
    name: 'Dr. Sophia Vane',
    title: 'Senior Research Scientist',
    role: 'scientist',
    faction: 'northern_order',
    district: 'District E',
    baseX: 108,
    baseZ: 26,
    facingYaw: 0,
    personality: 'Brilliant, secretive, obsessed with the anomaly.',
    bio: 'Studies the atmospheric ice core samples to uncover the root cause of the eternal winter.',
    schedule: [
      { startHour: 8, endHour: 23, locationName: 'Underground Lab Sector 9', x: 108, z: 26, activity: 'Analyzing Samples' },
      { startHour: 23, endHour: 8, locationName: 'Laboratory Quarters', x: 112, z: 30, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Dr. Sophia Vane',
        text: 'The isotopic signature in the glacial ice is artificial. Something caused this climate collapse intentionally.',
        responses: [
          { label: 'What do you need investigated?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Fascinating. Farewell.', action: 'close' },
        ],
      },
    },
  },
  {
    id: 'noah_mechanic',
    name: 'Noah Briggs',
    title: 'Vehicle & Snowcat Mechanic',
    role: 'mechanic',
    faction: 'survivors',
    district: 'District D',
    baseX: 86,
    baseZ: 14,
    facingYaw: Math.PI * 0.5,
    personality: 'Greasy, cheerful, talks to engines like pets.',
    bio: 'Keeps the snowcats and transport trucks running through snowdrifts.',
    schedule: [
      { startHour: 7, endHour: 19, locationName: 'Industrial Motor Pool', x: 86, z: 14, activity: 'Repairing Vehicles' },
      { startHour: 19, endHour: 7, locationName: 'Mechanic Shed', x: 82, z: 18, activity: 'Resting' },
    ],
    dialogueTree: {
      root: {
        id: 'root',
        speaker: 'Noah Briggs',
        text: 'Give me a spare battery and a gallon of antifreeze, and I can get that transport truck rolling!',
        responses: [
          { label: 'Need any mechanical parts recovered?', nextNodeId: 'quests', action: 'open_quests' },
          { label: 'Keep wrenching, Noah.', action: 'close' },
        ],
      },
    },
  },
  // 15 additional vibrant citizens & guards to reach 25+ unique NPCs
  { id: 'npc_11', name: 'Bram Ironcleaver', title: 'Butcher & Provisioner', role: 'merchant', faction: 'survivors', district: 'District C', baseX: 68, z: -13, facingYaw: 0, personality: 'Friendly', bio: 'Cuts meat.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Bram', text: 'Fresh venison in stock!', responses: [{ label: 'Trade', action: 'open_shop' }] } }, preferredTraderId: 'butcher' },
  { id: 'npc_12', name: 'Astrid Gearwright', title: 'Tinker & Trap Smith', role: 'merchant', faction: 'survivors', district: 'District C', baseX: 128, z: -13, facingYaw: 0, personality: 'Clever', bio: 'Builds gears.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Astrid', text: 'Precision gears!', responses: [{ label: 'Trade', action: 'open_shop' }] } }, preferredTraderId: 'tinker' },
  { id: 'npc_13', name: 'Linnea Frostherb', title: 'Alchemist & Herbalist', role: 'merchant', faction: 'survivors', district: 'District C', baseX: 68, z: 13, facingYaw: 0, personality: 'Calm', bio: 'Mixes herbs.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Linnea', text: 'Warming tonics.', responses: [{ label: 'Trade', action: 'open_shop' }] } }, preferredTraderId: 'apothecary' },
  { id: 'npc_14', name: 'Halvor Crest', title: 'Royal Quartermaster', role: 'merchant', faction: 'survivors', district: 'District C', baseX: 128, z: 13, facingYaw: 0, personality: 'Firm', bio: 'Supplies crates.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Halvor', text: 'Timber and ice.', responses: [{ label: 'Trade', action: 'open_shop' }] } }, preferredTraderId: 'quartermaster' },
  { id: 'npc_15', name: 'Valkyra Emberwing', title: 'Herald of the Flame', role: 'recruiter', faction: 'survivors', district: 'District A', baseX: 96, z: -19, facingYaw: 0, personality: 'Fiery', bio: 'Grants wings.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Valkyra', text: 'Step before the Solar Brazier!', responses: [{ label: 'Daily Trial', action: 'open_quests' }] } } },
  { id: 'npc_16', name: 'Caleb Vance', title: 'Gate Guard', role: 'guard', faction: 'survivors', district: 'District F', baseX: 142, z: 0, facingYaw: Math.PI * 0.5, personality: 'Vigilant', bio: 'Guards east gate.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Caleb', text: 'Halt! State your business.', responses: [{ label: 'Just passing.', action: 'close' }] } } },
  { id: 'npc_17', name: 'Hilda Snow', title: 'Baker', role: 'citizen', faction: 'survivors', district: 'District B', baseX: 82, z: -28, facingYaw: 0, personality: 'Warm', bio: 'Bakes bread.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Hilda', text: 'Hot soup available!', responses: [{ label: 'Thanks.', action: 'close' }] } } },
  { id: 'npc_18', name: 'Gunnar Ironbrow', title: 'Miner', role: 'citizen', faction: 'survivors', district: 'District D', baseX: 62, z: 28, facingYaw: 0, personality: 'Rugged', bio: 'Digs coal.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Gunnar', text: 'Cold down in the shafts.', responses: [{ label: 'Stay safe.', action: 'close' }] } } },
  { id: 'npc_19', name: 'Freya Storm', title: 'Fisher', role: 'citizen', faction: 'survivors', district: 'District F', baseX: 45, z: 14, facingYaw: 0, personality: 'Patient', bio: 'Ice fishing.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Freya', text: 'The bite is good today.', responses: [{ label: 'Nice catch.', action: 'close' }] } } },
  { id: 'npc_20', name: 'Torsten Black', title: 'Bandit Lookout', role: 'guard', faction: 'iron_wolves', district: 'District F', baseX: 168, z: -45, facingYaw: 0, personality: 'Hostile', bio: 'Iron Wolf scout.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Torsten', text: 'Wrong neighborhood, traveler!', responses: [{ label: 'Fight!', action: 'close' }] } } },
  { id: 'npc_21', name: 'Sven Hammer', title: 'Blacksmith Apprentice', role: 'citizen', faction: 'survivors', district: 'District C', baseX: 110, z: -20, facingYaw: 0, personality: 'Eager', bio: 'Learns smithing.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Sven', text: 'Working the bellows!', responses: [{ label: 'Keep it up.', action: 'close' }] } } },
  { id: 'npc_22', name: 'Karin White', title: 'Medic Assistant', role: 'doctor', faction: 'survivors', district: 'District E', baseX: 118, z: 22, facingYaw: 0, personality: 'Kind', bio: 'Helps Elena.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Karin', text: 'Need a bandage?', responses: [{ label: 'Yes please.', action: 'heal_player' }] } } },
  { id: 'npc_23', name: 'Olaf Red', title: 'Scout Leader', role: 'hunter', faction: 'survivors', district: 'District F', baseX: 60, z: -40, facingYaw: 0, personality: 'Brave', bio: 'Explores north.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Olaf', text: 'Blizzards are thickening.', responses: [{ label: 'Be careful.', action: 'close' }] } } },
  { id: 'npc_24', name: 'Sigrid Moon', title: 'Astronomer', role: 'scientist', faction: 'northern_order', district: 'District E', baseX: 104, z: 34, facingYaw: 0, personality: 'Quiet', bio: 'Watches auroras.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Sigrid', text: 'Aurora pulse is abnormal.', responses: [{ label: 'Indeed.', action: 'close' }] } } },
  { id: 'npc_25', name: 'Bjorn Ironwolf', title: 'Iron Wolf Enforcer', role: 'guard', faction: 'iron_wolves', district: 'District D', baseX: 145, z: 42, facingYaw: 0, personality: 'Aggressive', bio: 'Raider enforcer.', schedule: [], dialogueTree: { root: { id: 'root', speaker: 'Bjorn', text: 'Hand over your supplies!', responses: [{ label: 'Never!', action: 'close' }] } } },
];
