import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  Backpack,
  Cog,
  Crosshair,
  Flame,
  FlaskConical,
  Footprints,
  Gem,
  Hammer,
  Hand,
  HeartPulse,
  Package,
  Search,
  Shield,
  Snowflake,
  Sparkles,
  Store,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { getRarityLabel } from '../game/bestiary';
import {
  ALL_CRAFT_RECIPES,
  canCraftRecipe,
  getCraftRecipe,
  getLinkedBuffSeconds,
} from '../game/crafting';
import { calculateMeatSellValue } from '../game/city';
import { getAxeSpec, getBowSpec } from '../game/economy';
import {
  GEAR_SLOT_META,
  GEAR_SLOT_ORDER,
  getGearSlotSpec,
} from '../game/gear';
import {
  type InventoryCategoryFilter,
  type InventorySortMode,
  computeTotalEquipmentSummary,
  filterAndSortInventoryItems,
  getInventorySlotOccupancy,
} from '../game/inventory';
import {
  MYTHIC_ASCENSION_SPECS,
  RARE_MATERIAL_ORDER,
  RARE_MATERIAL_SPECS,
} from '../game/mystery';
import type {
  ActiveTool,
  CraftItemId,
  GearSlotId,
  HudSnapshot,
  ItemRarity,
  MythicAscensionId,
  RareMaterialId,
} from '../game/types';
import {
  AxeIcon,
  BowIcon,
  GearIcon,
  GoldIcon,
  IceIcon,
  MeatIcon,
  PeltIcon,
  StoneIcon,
  WoodIcon,
} from './SvgAssets';

type InspectorSelection =
  | { kind: 'item'; id: CraftItemId }
  | { kind: 'gear'; slot: GearSlotId }
  | { kind: 'material'; id: RareMaterialId }
  | { kind: 'wings' }
  | { kind: 'ascension' };

interface InventoryGuiProps {
  hud: HudSnapshot;
  cargoGold: number;
  onSelectTool: (tool: ActiveTool) => void;
  onEquipGear: (slot: GearSlotId, tier?: number) => void;
  onUnequipGear: (slot: GearSlotId) => void;
  onToggleWingsEquipped: () => void;
  onEquipAscension: (id: MythicAscensionId | null) => void;
  onUseBackpackItem: (id: CraftItemId) => void;
  onCraftItem: (id: CraftItemId) => void;
  onSalvageBackpackItem: (id: CraftItemId, qty?: number) => void;
  onSellAll: () => void;
  onSellMeat: (count?: number) => void;
  onChangeDrawerTab: (tab: 'craft' | 'city' | 'mystery' | 'camp') => void;
  rarityColor: (rarity: ItemRarity) => string;
  rarityBadgeStyle: (rarity: ItemRarity) => string;
}

const FILTER_TABS: Array<{ id: InventoryCategoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'parts', label: 'Parts' },
  { id: 'tools', label: 'Tools' },
  { id: 'traps', label: 'Traps' },
  { id: 'provisions', label: 'Provisions' },
];

function rarityBorderStyle(rarity: ItemRarity, selected: boolean): string {
  if (selected) {
    return 'border-[#f6c344] ring-1 ring-[#f6c344]/70';
  }
  switch (rarity) {
    case 'mythic':
      return 'border-[#e879f9]/70';
    case 'epic':
      return 'border-[#f59e0b]/65';
    case 'rare':
      return 'border-[#38bdf8]/65';
    case 'uncommon':
      return 'border-[#8ed49a]/60';
    default:
      return 'border-[#6e8eb0]/40';
  }
}

function CraftItemIcon({ id, className = 'w-5 h-5' }: { id: CraftItemId; className?: string }) {
  switch (id) {
    case 'clockwork_gear':
      return <Cog className={`${className} text-[#f6d37a]`} />;
    case 'hammer_temper':
      return <Hammer className={`${className} text-[#fb923c]`} />;
    case 'utility_toolkit':
      return <Wrench className={`${className} text-[#7be0ff]`} />;
    case 'snare_trap':
      return <Crosshair className={`${className} text-[#8ed49a]`} />;
    case 'frost_trap':
      return <Snowflake className={`${className} text-[#7be0ff]`} />;
    case 'fire_starter':
      return <Flame className={`${className} text-[#ff9d3b]`} />;
    case 'insulated_boots':
      return <Footprints className={`${className} text-[#9fe8ff]`} />;
    case 'flint_quiver':
      return <Zap className={`${className} text-[#f6c344]`} />;
    case 'alpine_poultice':
      return <HeartPulse className={`${className} text-[#8ed49a]`} />;
    case 'frost_whetstone':
      return <Gem className={`${className} text-[#7be0ff]`} />;
    case 'mammoth_tonic':
      return <FlaskConical className={`${className} text-[#fbbf24]`} />;
    case 'aurora_charm':
      return <Sparkles className={`${className} text-[#f0abfc]`} />;
  }
}

function GearSlotIcon({ slot, className = 'w-4 h-4' }: { slot: GearSlotId; className?: string }) {
  switch (slot) {
    case 'coat':
      return <Shield className={className} />;
    case 'boots':
      return <Footprints className={className} />;
    case 'gloves':
      return <Hand className={className} />;
    case 'pack':
      return <Backpack className={className} />;
  }
}

function hotkeyLabelForItem(id: CraftItemId, usableKind: string): string {
  if (usableKind === 'component') return 'Material';
  if (id === 'snare_trap') return '[3]';
  if (id === 'frost_trap') return '[4]';
  return '[5]';
}

export function InventoryGui({
  hud,
  cargoGold,
  onSelectTool,
  onEquipGear,
  onUnequipGear,
  onToggleWingsEquipped,
  onEquipAscension,
  onUseBackpackItem,
  onCraftItem,
  onSalvageBackpackItem,
  onSellAll,
  onSellMeat,
  onChangeDrawerTab,
  rarityColor,
  rarityBadgeStyle,
}: InventoryGuiProps) {
  const [filter, setFilter] = useState<InventoryCategoryFilter>('all');
  const [sortMode, setSortMode] = useState<InventorySortMode>('stocked');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockedOnly, setStockedOnly] = useState(false);

  const defaultSelectedItem = useMemo<CraftItemId>(() => {
    const firstStocked = ALL_CRAFT_RECIPES.find((r) => (hud.backpackInventory[r.id] ?? 0) > 0);
    return firstStocked?.id ?? 'clockwork_gear';
  }, [hud.backpackInventory]);

  const [selection, setSelection] = useState<InspectorSelection>(() => ({
    kind: 'item',
    id: defaultSelectedItem,
  }));

  type EquipAnimKind = 'equip' | 'unequip';
  type EquipSlotKey = GearSlotId | 'wings' | 'ascension' | 'axe' | 'bow';

  const [slotAnims, setSlotAnims] = useState<
    Partial<Record<EquipSlotKey, { kind: EquipAnimKind; nonce: number }>>
  >({});
  const [flyingGhost, setFlyingGhost] = useState<{
    key: number;
    label: string;
    slot: GearSlotId | 'wings';
    dx: number;
    dy: number;
    targetLeft: number;
    targetTop: number;
    targetWidth: number;
    targetHeight: number;
  } | null>(null);

  const slotRefs = useRef<Partial<Record<EquipSlotKey, HTMLElement | null>>>({});
  const animTimersRef = useRef<Record<string, number>>({});
  const flyTimerRef = useRef<number | null>(null);
  const animNonceRef = useRef(1);
  const prevLoadoutRef = useRef<{
    gear: Record<GearSlotId, number>;
    wingsEquipped: boolean;
    equippedAscension: MythicAscensionId | null;
    activeTool: ActiveTool;
  } | null>(null);

  const triggerSlotAnim = (key: EquipSlotKey, kind: EquipAnimKind) => {
    const existing = animTimersRef.current[key];
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const nonce = animNonceRef.current++;
    setSlotAnims((prev) => ({ ...prev, [key]: { kind, nonce } }));
    animTimersRef.current[key] = window.setTimeout(() => {
      setSlotAnims((prev) => {
        if (prev[key]?.nonce !== nonce) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete animTimersRef.current[key];
    }, 780);
  };

  const launchFlyToSlot = (
    sourceEl: HTMLElement | null,
    targetKey: GearSlotId | 'wings',
    label: string,
  ) => {
    const targetEl = slotRefs.current[targetKey];
    if (!sourceEl || !targetEl) return;
    const src = sourceEl.getBoundingClientRect();
    const dst = targetEl.getBoundingClientRect();
    if (dst.width === 0 || dst.height === 0) return;
    const dx = src.left + src.width / 2 - (dst.left + dst.width / 2);
    const dy = src.top + src.height / 2 - (dst.top + dst.height / 2);
    if (flyTimerRef.current !== null) {
      window.clearTimeout(flyTimerRef.current);
    }
    const key = animNonceRef.current++;
    setFlyingGhost({
      key,
      label,
      slot: targetKey,
      dx,
      dy,
      targetLeft: dst.left + dst.width / 2,
      targetTop: dst.top + dst.height / 2,
      targetWidth: dst.width,
      targetHeight: dst.height,
    });
    flyTimerRef.current = window.setTimeout(() => {
      setFlyingGhost((cur) => (cur?.key === key ? null : cur));
      flyTimerRef.current = null;
    }, 460);
  };

  useEffect(() => {
    return () => {
      for (const timer of Object.values(animTimersRef.current)) {
        window.clearTimeout(timer);
      }
      if (flyTimerRef.current !== null) {
        window.clearTimeout(flyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const prev = prevLoadoutRef.current;
    const currentSnapshot = {
      gear: {
        coat: hud.gear.coat ?? 0,
        boots: hud.gear.boots ?? 0,
        gloves: hud.gear.gloves ?? 0,
        pack: hud.gear.pack ?? 0,
      },
      wingsEquipped: hud.wingsEquipped,
      equippedAscension: hud.equippedAscension,
      activeTool: hud.activeTool,
    };

    if (!prev) {
      prevLoadoutRef.current = currentSnapshot;
      return;
    }

    for (const slot of GEAR_SLOT_ORDER) {
      const before = prev.gear[slot];
      const after = currentSnapshot.gear[slot];
      if (before !== after) {
        triggerSlotAnim(slot, after > 0 ? 'equip' : 'unequip');
      }
    }

    if (prev.wingsEquipped !== currentSnapshot.wingsEquipped && hud.wingsTier > 0) {
      triggerSlotAnim('wings', currentSnapshot.wingsEquipped ? 'equip' : 'unequip');
    }

    if (prev.equippedAscension !== currentSnapshot.equippedAscension) {
      triggerSlotAnim(
        'ascension',
        currentSnapshot.equippedAscension ? 'equip' : 'unequip',
      );
    }

    if (
      prev.activeTool !== currentSnapshot.activeTool &&
      (currentSnapshot.activeTool === 'axe' || currentSnapshot.activeTool === 'bow')
    ) {
      triggerSlotAnim(currentSnapshot.activeTool, 'equip');
    }

    prevLoadoutRef.current = currentSnapshot;
  }, [hud.gear, hud.wingsEquipped, hud.wingsTier, hud.equippedAscension, hud.activeTool]);

  const filteredItems = useMemo(
    () =>
      filterAndSortInventoryItems({
        inventory: hud.backpackInventory,
        filter,
        sort: sortMode,
        searchQuery,
        stockedOnly,
      }),
    [hud.backpackInventory, filter, sortMode, searchQuery, stockedOnly],
  );

  const occupancy = useMemo(
    () =>
      getInventorySlotOccupancy({
        inventory: hud.backpackInventory,
        maxItems: hud.backpackMaxItems,
        maxEmptySocketsShown: 6,
      }),
    [hud.backpackInventory, hud.backpackMaxItems],
  );

  const equipSummary = useMemo(
    () =>
      computeTotalEquipmentSummary({
        gear: hud.gear,
        gearBonuses: hud.gearBonuses,
        gearSet: hud.gearSet,
        wingsTier: hud.wingsTier,
        wingsEquipped: hud.wingsEquipped,
        equippedAscension: hud.equippedAscension,
        preparedness: hud.backpackPreparedness,
      }),
    [
      hud.gear,
      hud.gearBonuses,
      hud.gearSet,
      hud.wingsTier,
      hud.wingsEquipped,
      hud.equippedAscension,
      hud.backpackPreparedness,
    ],
  );

  const axeSpec = getAxeSpec(hud.levels.axe);
  const bowSpec = getBowSpec(hud.levels.bow);
  const meatUnitGold = calculateMeatSellValue(hud.gearBonuses.goldTradeMult);
  const meatCount = Math.floor(hud.resources.meat ?? 0);
  const cargoPct = Math.min(100, Math.round((hud.packUsed / Math.max(1, hud.packCapacity)) * 100));
  const equippedAscSpec = hud.equippedAscension
    ? MYTHIC_ASCENSION_SPECS[hud.equippedAscension]
    : null;

  const selectedRecipe =
    selection.kind === 'item'
      ? getCraftRecipe(selection.id)
      : null;

  return (
    <div data-testid="backpack-panel" className="flex flex-col gap-3">
      {/* Top Inventory Capacity, Weight & Preparedness Bar */}
      <div
        data-testid="backpack-preparedness-card"
        className="rounded-lg bg-[#162d33] border border-[#8ed49a]/50 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8ed49a] inline-flex items-center gap-1.5">
              <Backpack className="w-3.5 h-3.5" />
              Expedition Inventory &amp; Loadout
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0f2126] border border-[#8ed49a]/45 text-[10px] font-bold tabular-nums text-[#a7f3d0]">
              Slots {occupancy.used}/{occupancy.maxItems} ({occupancy.free} Open)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0f2126] border border-[#6e8eb0]/45 text-[10px] font-bold tabular-nums text-[#dce6f2]">
              Cargo {hud.packUsed}/{hud.packCapacity}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#2a1f10] border border-[#f6c344]/55 text-[10px] font-bold tabular-nums text-[#fde68a] inline-flex items-center gap-1">
              <GoldIcon className="w-3 h-3" />
              {hud.resources.gold}g
            </span>
          </div>

          {/* Dual Capacity Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#b8e2cc] tabular-nums mb-0.5">
                <span>Pack Item Capacity</span>
                <span>{occupancy.pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded bg-[#0c1a1e] overflow-hidden border border-[#8ed49a]/25">
                <div
                  className={`h-full transition-all ${
                    occupancy.pct >= 95 ? 'bg-[#ef7b73]' : 'bg-[#8ed49a]'
                  }`}
                  style={{ width: `${occupancy.pct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#c7d9ec] tabular-nums mb-0.5">
                <span>Raw Cargo Weight</span>
                <span>{cargoPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded bg-[#0c1a1e] overflow-hidden border border-[#7be0ff]/25">
                <div
                  className={`h-full transition-all ${
                    cargoPct >= 95 ? 'bg-[#f59e0b]' : 'bg-[#7be0ff]'
                  }`}
                  style={{ width: `${cargoPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold tabular-nums">
            <span className="text-[#f6c344] inline-flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Pack Link Power +{Math.round((hud.backpackPreparedness.damageMult - 1) * 100)}%
            </span>
            <span className="text-[#7be0ff]">
              Move +{Math.round((hud.backpackPreparedness.moveSpeedMult - 1) * 100)}%
            </span>
            <span className="text-[#8ed49a]">
              Chill -{Math.round((1 - hud.backpackPreparedness.coldDecayMult) * 100)}%
            </span>
            <span className="text-[#fde68a]">Armed Traps: {hud.deployedTraps.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={cargoGold <= 0}
            onClick={onSellAll}
            title="Sell carried wood & pelts for gold"
            className={`px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider tabular-nums inline-flex items-center gap-1 transition-colors ${
              cargoGold > 0
                ? 'bg-[#2a3f5c] hover:bg-[#365175] border border-[#f6c344]/65 text-[#fde68a] cursor-pointer'
                : 'bg-[#1a2936] border border-[#455c78]/40 text-[#6e849c] cursor-not-allowed'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Sell Cargo (+{cargoGold}g)
          </button>
          <button
            type="button"
            onClick={() => onChangeDrawerTab('craft')}
            className="px-3 py-1.5 rounded bg-[#d98a2b] hover:bg-[#ea9c3b] text-xs font-bold uppercase tracking-wider text-[#131d2b] cursor-pointer transition-colors"
          >
            Station &amp; Forge [C]
          </button>
          <button
            type="button"
            onClick={() => onChangeDrawerTab('mystery')}
            className="px-2.5 py-1.5 rounded bg-[#361a4c] hover:bg-[#492266] border border-[#d946ef]/65 text-xs font-bold uppercase tracking-wider text-[#f5d0fe] cursor-pointer transition-colors"
          >
            Mysteries [Y]
          </button>
        </div>
      </div>

      {/* Main Two-Column RPG Workspace: Loadout (Left) + Bag Grid & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT COLUMN: Character Equipment Paper-Doll & Total Combat Stats */}
        <div
          data-testid="backpack-equipment-manager"
          className="lg:col-span-5 lg:sticky lg:top-[84px] rounded-lg bg-[#152438] border border-[#6e8eb0]/45 p-3 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#6e8eb0]/25 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9fe8ff] inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Equipped Loadout ({equipSummary.equippedGearCount}/{equipSummary.totalGearSlots})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1d314a] border border-[#7be0ff]/45 text-[10px] font-bold text-[#9fe8ff] tabular-nums">
              Set Bonus T{equipSummary.setTier}/5
            </span>
          </div>

          {/* Active Weapon Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              ref={(el) => {
                slotRefs.current.axe = el;
              }}
              data-equip-anim={slotAnims.axe?.kind ?? 'idle'}
              onClick={() => onSelectTool('axe')}
              className={`relative overflow-hidden rounded-lg border p-2 text-left flex items-center gap-2 cursor-pointer transition-colors ${
                hud.activeTool === 'axe'
                  ? 'bg-[#2c2214] border-[#f6c344] text-[#fff7ed]'
                  : 'bg-[#1a2b42] border-[#516d8c]/45 text-[#cbd5e1] hover:bg-[#223854]'
              } ${slotAnims.axe?.kind === 'equip' ? 'animate-equip-snap' : ''}`}
            >
              {slotAnims.axe?.kind === 'equip' && (
                <span
                  key={`axe-sheen-${slotAnims.axe.nonce}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#fde68a]/30 to-transparent animate-equip-sheen"
                />
              )}
              <AxeIcon className="w-6 h-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase text-[#f6c344]">
                  <span>[1] Melee</span>
                  {hud.activeTool === 'axe' && (
                    <span className={slotAnims.axe?.kind === 'equip' ? 'animate-equip-badge-pop' : ''}>
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold truncate text-[#f4efe6]">{axeSpec.name}</div>
                <div className="text-[10px] text-[#9db4cb] tabular-nums">
                  Lv{axeSpec.level} · {axeSpec.power} Pwr
                </div>
              </div>
            </button>

            <button
              type="button"
              ref={(el) => {
                slotRefs.current.bow = el;
              }}
              data-equip-anim={slotAnims.bow?.kind ?? 'idle'}
              onClick={() => onSelectTool('bow')}
              className={`relative overflow-hidden rounded-lg border p-2 text-left flex items-center gap-2 cursor-pointer transition-colors ${
                hud.activeTool === 'bow'
                  ? 'bg-[#2c2214] border-[#f6c344] text-[#fff7ed]'
                  : 'bg-[#1a2b42] border-[#516d8c]/45 text-[#cbd5e1] hover:bg-[#223854]'
              } ${slotAnims.bow?.kind === 'equip' ? 'animate-equip-snap' : ''}`}
            >
              {slotAnims.bow?.kind === 'equip' && (
                <span
                  key={`bow-sheen-${slotAnims.bow.nonce}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#7be0ff]/30 to-transparent animate-equip-sheen"
                />
              )}
              <BowIcon className="w-6 h-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase text-[#7be0ff]">
                  <span>[2] Ranged</span>
                  {hud.activeTool === 'bow' && (
                    <span className={slotAnims.bow?.kind === 'equip' ? 'animate-equip-badge-pop' : ''}>
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold truncate text-[#f4efe6]">{bowSpec.name}</div>
                <div className="text-[10px] text-[#9db4cb] tabular-nums">
                  Lv{bowSpec.level} · {bowSpec.power} Pwr
                </div>
              </div>
            </button>
          </div>

          {/* 4 Armor & Gear Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GEAR_SLOT_ORDER.map((slot) => {
              const ownedTier = hud.unlockedGear[slot] ?? 1;
              const equippedTier = hud.gear[slot] ?? 0;
              const equipped = equippedTier > 0;
              const activeSpec = getGearSlotSpec(slot, equipped ? equippedTier : ownedTier);
              const meta = GEAR_SLOT_META[slot];
              const isSelected = selection.kind === 'gear' && selection.slot === slot;
              const slotAnim = slotAnims[slot];

              return (
                <div
                  key={slot}
                  ref={(el) => {
                    slotRefs.current[slot] = el;
                  }}
                  data-testid={`backpack-gear-card-${slot}`}
                  data-equip-anim={slotAnim?.kind ?? 'idle'}
                  className={`relative overflow-hidden rounded-lg border p-2.5 flex flex-col justify-between gap-2 transition-colors ${
                    equipped
                      ? `bg-[#1c3048] ${rarityBorderStyle(activeSpec.rarity, isSelected)}`
                      : `bg-[#172130] ${isSelected ? 'border-[#f6c344]' : 'border-[#6e8eb0]/30'} opacity-85`
                  } ${
                    slotAnim?.kind === 'equip'
                      ? 'animate-equip-snap'
                      : slotAnim?.kind === 'unequip'
                        ? 'animate-unequip-return'
                        : ''
                  }`}
                >
                  {slotAnim?.kind === 'equip' && (
                    <>
                      <span
                        key={`${slot}-sheen-${slotAnim.nonce}`}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#e0f7ff]/30 to-transparent animate-equip-sheen"
                      />
                      <span
                        key={`${slot}-confirm-${slotAnim.nonce}`}
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 bottom-9 z-10 px-1.5 py-0.5 rounded bg-[#143429] border border-[#8ed49a]/80 text-[9px] font-extrabold uppercase text-[#bbf7d0] animate-equip-confirm"
                      >
                        +Equipped
                      </span>
                    </>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setSelection({ kind: 'gear', slot })}
                        className="text-[10px] font-bold uppercase tracking-tight text-[#9db4cb] hover:text-white inline-flex items-center gap-1 min-w-0 cursor-pointer"
                      >
                        <GearSlotIcon slot={slot} className="w-3 h-3 shrink-0" />
                        <span className="truncate">{meta.label}</span>
                      </button>
                      <span
                        key={slotAnim ? `${slot}-badge-${slotAnim.nonce}` : `${slot}-badge`}
                        className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tabular-nums ${
                          equipped
                            ? 'bg-[#143429] text-[#8ed49a]'
                            : 'bg-[#3b1d1d] text-[#fca5a5]'
                        } ${slotAnim?.kind === 'equip' ? 'animate-equip-badge-pop' : ''}`}
                      >
                        {equipped ? `Eq T${equippedTier}` : 'Removed'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelection({ kind: 'gear', slot })}
                      className="w-full text-left mt-1 cursor-pointer"
                    >
                      <div className="font-display font-bold text-xs text-[#f4efe6] truncate">
                        {activeSpec.name}
                      </div>
                      <div className="text-[10px] text-[#b8cbe0] mt-0.5 truncate">
                        {equipped ? activeSpec.summary : `Stored T${ownedTier} in Backpack`}
                      </div>
                    </button>

                    {ownedTier > 1 && (
                      <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                        {Array.from({ length: ownedTier }, (_, i) => i + 1).map((tierNum) => (
                          <button
                            key={tierNum}
                            type="button"
                            onClick={() => onEquipGear(slot, tierNum)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums cursor-pointer transition-colors ${
                              equippedTier === tierNum
                                ? 'bg-[#7be0ff] text-[#0f1d2b]'
                                : 'bg-[#122033] text-[#9db4cb] hover:bg-[#233958]'
                            }`}
                          >
                            T{tierNum}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid={`toggle-equip-${slot}`}
                    onClick={() => (equipped ? onUnequipGear(slot) : onEquipGear(slot))}
                    className={`w-full py-1 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      equipped
                        ? 'bg-[#3b1d1d] hover:bg-[#522727] border border-[#f87171]/50 text-[#fecaca]'
                        : 'bg-[#1f4d36] hover:bg-[#2a6648] border border-[#8ed49a]/60 text-[#bbf7d0]'
                    }`}
                  >
                    {equipped ? 'Remove' : 'Equip'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Wings Relic & Mythic Ascension Visual Gear Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Wings of Fire Equipment Slot */}
            <div
              ref={(el) => {
                slotRefs.current.wings = el;
              }}
              data-testid="backpack-wings-card"
              data-equip-anim={slotAnims.wings?.kind ?? 'idle'}
              className={`relative overflow-hidden rounded-lg border p-2.5 flex flex-col justify-between gap-2 ${
                hud.wingsTier > 0 && hud.wingsEquipped
                  ? 'bg-[#36170d] border-[#fb923c]/75'
                  : 'bg-[#1b1720] border-[#9a3412]/40'
              } ${
                slotAnims.wings?.kind === 'equip'
                  ? 'animate-equip-snap'
                  : slotAnims.wings?.kind === 'unequip'
                    ? 'animate-unequip-return'
                    : ''
              }`}
            >
              {slotAnims.wings?.kind === 'equip' && (
                <>
                  <span
                    key={`wings-sheen-${slotAnims.wings.nonce}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#fed7aa]/35 to-transparent animate-equip-sheen"
                  />
                  <span
                    key={`wings-confirm-${slotAnims.wings.nonce}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 bottom-9 z-10 px-1.5 py-0.5 rounded bg-[#143429] border border-[#8ed49a]/80 text-[9px] font-extrabold uppercase text-[#bbf7d0] animate-equip-confirm"
                  >
                    +Equipped
                  </span>
                </>
              )}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'wings' })}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#fb923c] hover:text-[#fed7aa] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Flame className="w-3 h-3" />
                    Wings Relic
                  </button>
                  <span
                    key={slotAnims.wings ? `wings-badge-${slotAnims.wings.nonce}` : 'wings-badge'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tabular-nums ${
                      hud.wingsTier === 0
                        ? 'bg-[#2a2024] text-[#fdba74]'
                        : hud.wingsEquipped
                          ? 'bg-[#143429] text-[#8ed49a]'
                          : 'bg-[#3b1d1d] text-[#fca5a5]'
                    } ${slotAnims.wings?.kind === 'equip' ? 'animate-equip-badge-pop' : ''}`}
                  >
                    {hud.wingsTier === 0
                      ? `${hud.cityDailyQuestsCompleted}/${hud.wingsQuestRequirement}`
                      : hud.wingsEquipped
                        ? `Active T${hud.wingsTier}`
                        : `Stored T${hud.wingsTier}`}
                  </span>
                </div>
                <div className="font-display font-bold text-xs text-[#fff7ed] mt-1 truncate">
                  {hud.wingsSpec.name}
                </div>
                <div className="text-[10px] text-[#fed7aa] mt-0.5 truncate">
                  {hud.wingsTier === 0
                    ? `Unlock after ${hud.wingsQuestRequirement} City Quests`
                    : hud.wingsEquipped
                      ? hud.wingsSpec.subtitle
                      : 'Flame aura folded'}
                </div>
              </div>

              {hud.wingsTier > 0 ? (
                <button
                  type="button"
                  data-testid="toggle-equip-wings"
                  onClick={onToggleWingsEquipped}
                  className={`w-full py-1 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    hud.wingsEquipped
                      ? 'bg-[#3b1d1d] hover:bg-[#522727] border border-[#f87171]/50 text-[#fecaca]'
                      : 'bg-[#ea580c] hover:bg-[#f97316] text-[#fff7ed]'
                  }`}
                >
                  {hud.wingsEquipped ? 'Remove' : 'Equip'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeDrawerTab('city')}
                  className="w-full py-1 rounded bg-[#2c2214] hover:bg-[#3d2f1b] border border-[#f6c344]/50 text-[11px] font-bold uppercase tracking-wider text-[#fde68a] cursor-pointer transition-colors"
                >
                  City Quests
                </button>
              )}
            </div>

            {/* Mythic Ascension Panoply Slot */}
            <div
              ref={(el) => {
                slotRefs.current.ascension = el;
              }}
              data-testid="backpack-ascension-card"
              data-equip-anim={slotAnims.ascension?.kind ?? 'idle'}
              className={`relative overflow-hidden rounded-lg border p-2.5 flex flex-col justify-between gap-2 ${
                equippedAscSpec
                  ? 'bg-[#2a153d] border-[#e879f9]/75'
                  : 'bg-[#1a1829] border-[#a855f7]/35'
              } ${
                slotAnims.ascension?.kind === 'equip'
                  ? 'animate-equip-snap'
                  : slotAnims.ascension?.kind === 'unequip'
                    ? 'animate-unequip-return'
                    : ''
              }`}
            >
              {slotAnims.ascension?.kind === 'equip' && (
                <>
                  <span
                    key={`asc-sheen-${slotAnims.ascension.nonce}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#f0abfc]/35 to-transparent animate-equip-sheen"
                  />
                  <span
                    key={`asc-confirm-${slotAnims.ascension.nonce}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 bottom-9 z-10 px-1.5 py-0.5 rounded bg-[#2c1240] border border-[#e879f9]/80 text-[9px] font-extrabold uppercase text-[#fae8ff] animate-equip-confirm"
                  >
                    +Equipped
                  </span>
                </>
              )}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'ascension' })}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#e879f9] hover:text-[#fae8ff] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Mythic Visual
                  </button>
                  <span className="px-1.5 py-0.5 rounded bg-[#140e24] text-[9px] font-bold uppercase text-[#f0abfc] tabular-nums">
                    {hud.unlockedAscensions.length}/5 Unlocked
                  </span>
                </div>
                <div className="font-display font-bold text-xs text-[#fae8ff] mt-1 truncate">
                  {equippedAscSpec ? equippedAscSpec.name : 'No Panoply Equipped'}
                </div>
                <div className="text-[10px] text-[#d8b4fe] mt-0.5 truncate">
                  {equippedAscSpec
                    ? equippedAscSpec.elementLabel
                    : hud.unlockedAscensions.length > 0
                      ? 'Select an unlocked mythic aura below'
                      : 'Forge in Mysteries Unknown [Y]'}
                </div>
              </div>

              {hud.unlockedAscensions.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {hud.unlockedAscensions.map((ascId) => {
                    const spec = MYTHIC_ASCENSION_SPECS[ascId];
                    const active = hud.equippedAscension === ascId;
                    return (
                      <button
                        key={ascId}
                        type="button"
                        onClick={() => onEquipAscension(active ? null : ascId)}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#e879f9] text-[#1f0a29]'
                            : 'bg-[#1e1233] hover:bg-[#311d52] text-[#f5d0fe] border border-[#a855f7]/45'
                        }`}
                      >
                        {spec.element === 'dark_matter' ? 'Void' : spec.element}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeDrawerTab('mystery')}
                  className="w-full py-1 rounded bg-[#2d1742] hover:bg-[#3d2059] border border-[#d946ef]/55 text-[11px] font-bold uppercase tracking-wider text-[#f5d0fe] cursor-pointer transition-colors"
                >
                  Open Mysteries [Y]
                </button>
              )}
            </div>
          </div>

          {/* Aggregated Equipment Combat & Survival Summary */}
          <div className="rounded-lg bg-[#101c2d] border border-[#6e8eb0]/30 p-2.5 grid grid-cols-3 gap-2 text-center tabular-nums">
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">Max HP</div>
              <div className="text-xs font-extrabold text-[#f4efe6]">{hud.maxHp}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">Max Warmth</div>
              <div className="text-xs font-extrabold text-[#ffad5c]">{hud.maxWarmth}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">Cold Resist</div>
              <div className="text-xs font-extrabold text-[#7be0ff]">{equipSummary.coldResistPct}%</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">Power Mult</div>
              <div className="text-xs font-extrabold text-[#f6c344]">x{equipSummary.damageMult}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">Move Mult</div>
              <div className="text-xs font-extrabold text-[#8ed49a]">x{equipSummary.moveSpeedMult}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#9db4cb]">HP Regen</div>
              <div className="text-xs font-extrabold text-[#a7f3d0]">+{equipSummary.hpRegenPerSec}/s</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Search/Filter Toolbar + Bag Slot Grid + Item Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          {/* Bag Toolbar */}
          <div className="rounded-lg bg-[#152438] border border-[#6e8eb0]/40 p-2.5 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[170px]">
                <Search className="w-3.5 h-3.5 text-[#7f96ad] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  data-testid="inventory-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, buffs, traps..."
                  aria-label="Search inventory items"
                  className="w-full pl-8 pr-7 py-1.5 rounded bg-[#0f1a29] border border-[#516d8c]/55 focus:border-[#7be0ff] focus:outline-none text-xs text-[#f4efe6] placeholder:text-[#6d839b]"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9db4cb] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                data-testid="inventory-stocked-toggle"
                onClick={() => setStockedOnly((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                  stockedOnly
                    ? 'bg-[#1a3e2e] border-[#8ed49a] text-[#a7f3d0]'
                    : 'bg-[#101c2d] border-[#516d8c]/50 text-[#9db4cb] hover:text-white'
                }`}
              >
                Stocked Only
              </button>

              <select
                aria-label="Sort backpack items"
                data-testid="inventory-sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as InventorySortMode)}
                className="px-2.5 py-1.5 rounded bg-[#0f1a29] border border-[#516d8c]/55 text-xs font-semibold text-[#dce6f2] focus:border-[#7be0ff] focus:outline-none cursor-pointer"
              >
                <option value="stocked">Sort: Stocked First</option>
                <option value="rarity">Sort: Rarity</option>
                <option value="category">Sort: Category</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`inventory-filter-${tab.id}`}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    filter === tab.id
                      ? 'bg-[#8ed49a] text-[#0f1d17]'
                      : 'bg-[#1e314a] text-[#b8cbe0] hover:bg-[#294161]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bag Slot Grid */}
          <div
            data-testid="inventory-bag-grid"
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:max-h-[340px] lg:overflow-y-auto lg:pr-1"
          >
            {/* Stored Unequipped Gear in Pack (surfaced first so moving to Equipment Slot is immediately visible) */}
            {filter === 'all' &&
              GEAR_SLOT_ORDER.filter((slot) => (hud.gear[slot] ?? 0) === 0).map((slot) => {
                const ownedTier = hud.unlockedGear[slot] ?? 1;
                const spec = getGearSlotSpec(slot, ownedTier);
                const meta = GEAR_SLOT_META[slot];
                if (
                  searchQuery.trim() !== '' &&
                  !`${spec.name} ${meta.label} ${spec.summary} gear`
                    .toLowerCase()
                    .includes(searchQuery.trim().toLowerCase())
                ) {
                  return null;
                }
                const isSelected = selection.kind === 'gear' && selection.slot === slot;
                return (
                  <div
                    key={`stored-${slot}`}
                    data-testid={`bag-stored-gear-${slot}`}
                    className={`rounded-lg border p-2.5 flex flex-col justify-between gap-2 bg-[#1a2940] ${rarityBorderStyle(
                      spec.rarity,
                      isSelected,
                    )}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: 'gear', slot })}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="w-8 h-8 rounded-md bg-[#101c2d] border border-[#7be0ff]/45 flex items-center justify-center shrink-0 text-[#9fe8ff]">
                          <GearSlotIcon slot={slot} className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#142a40] border border-[#7be0ff]/50 text-[10px] font-extrabold tabular-nums text-[#9fe8ff]">
                            T{ownedTier}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-[#8ed49a]">
                            Stored Gear
                          </span>
                        </div>
                      </div>
                      <div className="font-display font-bold text-xs text-[#f4efe6] mt-1.5 truncate">
                        {spec.name}
                      </div>
                      <div className="text-[10px] font-bold uppercase mt-0.5 text-[#9db4cb] truncate">
                        {meta.label} · {getRarityLabel(spec.rarity)}
                      </div>
                    </button>

                    <button
                      type="button"
                      data-testid={`equip-from-bag-${slot}`}
                      onClick={(e) => {
                        launchFlyToSlot(
                          (e.currentTarget.closest(
                            `[data-testid="bag-stored-gear-${slot}"]`,
                          ) as HTMLElement | null) ?? e.currentTarget,
                          slot,
                          spec.name,
                        );
                        onEquipGear(slot);
                      }}
                      className="w-full py-1 rounded bg-[#1f4d36] hover:bg-[#2a6648] border border-[#8ed49a]/65 text-[11px] font-bold uppercase tracking-wide text-[#bbf7d0] cursor-pointer transition-colors"
                    >
                      Equip to Slot
                    </button>
                  </div>
                );
              })}

            {filter === 'all' && hud.wingsTier > 0 && !hud.wingsEquipped && (
              <div
                data-testid="bag-stored-wings"
                className="rounded-lg border border-[#fb923c]/65 p-2.5 flex flex-col justify-between gap-2 bg-[#2b1812]"
              >
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'wings' })}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="w-8 h-8 rounded-md bg-[#1c0f0a] border border-[#fb923c]/55 flex items-center justify-center shrink-0 text-[#fb923c]">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#3b1c0e] border border-[#fb923c]/55 text-[10px] font-extrabold tabular-nums text-[#fed7aa]">
                        T{hud.wingsTier}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-[#fdba74]">
                        Stored Relic
                      </span>
                    </div>
                  </div>
                  <div className="font-display font-bold text-xs text-[#fff7ed] mt-1.5 truncate">
                    {hud.wingsSpec.name}
                  </div>
                  <div className="text-[10px] font-bold uppercase mt-0.5 text-[#fdba74] truncate">
                    Wings Relic · Mythic
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="equip-from-bag-wings"
                  onClick={(e) => {
                    launchFlyToSlot(
                      (e.currentTarget.closest('[data-testid="bag-stored-wings"]') as HTMLElement | null) ??
                        e.currentTarget,
                      'wings',
                      hud.wingsSpec.name,
                    );
                    onToggleWingsEquipped();
                  }}
                  className="w-full py-1 rounded bg-[#ea580c] hover:bg-[#f97316] text-[11px] font-bold uppercase tracking-wide text-[#fff7ed] cursor-pointer transition-colors"
                >
                  Equip Wings
                </button>
              </div>
            )}

            {filteredItems.map((recipe) => {
              const qty = hud.backpackInventory[recipe.id] ?? 0;
              const activeSecs = getLinkedBuffSeconds(recipe.id, hud.activeBuffs);
              const isComponent = recipe.usableKind === 'component';
              const isTrap = recipe.usableKind === 'trap';
              const isSelected = selection.kind === 'item' && selection.id === recipe.id;
              const canCraftMore =
                canCraftRecipe(hud.resources, recipe.id, hud.backpackInventory) &&
                occupancy.used + recipe.yieldQty - (recipe.cost.gears ?? 0) <= occupancy.maxItems;

              return (
                <div
                  key={recipe.id}
                  data-testid={`backpack-item-${recipe.id}`}
                  className={`rounded-lg border p-2.5 flex flex-col justify-between gap-2 transition-colors ${
                    qty > 0
                      ? `bg-[#1d3149] ${rarityBorderStyle(recipe.rarity, isSelected)}`
                      : `bg-[#152235] ${rarityBorderStyle(recipe.rarity, isSelected)} opacity-85`
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'item', id: recipe.id })}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="w-8 h-8 rounded-md bg-[#101c2d] border border-[#6e8eb0]/35 flex items-center justify-center shrink-0">
                        <CraftItemIcon id={recipe.id} className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold tabular-nums ${
                            qty > 0
                              ? 'bg-[#143429] border border-[#8ed49a]/70 text-[#8ed49a]'
                              : 'bg-[#132032] border border-[#455c78]/40 text-[#7f96ad]'
                          }`}
                        >
                          x{qty}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-[#9db4cb]">
                          {hotkeyLabelForItem(recipe.id, recipe.usableKind)}
                        </span>
                      </div>
                    </div>

                    <div className="font-display font-bold text-xs text-[#f4efe6] mt-1.5 truncate">
                      {recipe.name}
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase mt-0.5">
                      <span className={rarityColor(recipe.rarity)}>
                        {getRarityLabel(recipe.rarity)}
                      </span>
                      {activeSecs > 0 ? (
                        <span className="text-[#8ed49a] tabular-nums">{Math.ceil(activeSecs)}s</span>
                      ) : (
                        <span className="text-[#7f96ad]">{recipe.category}</span>
                      )}
                    </div>
                  </button>

                  {isComponent ? (
                    <button
                      type="button"
                      disabled={!canCraftMore}
                      onClick={() => onCraftItem(recipe.id)}
                      className={`w-full py-1 rounded text-[11px] font-bold uppercase tracking-wide transition-colors ${
                        canCraftMore
                          ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                          : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                      }`}
                    >
                      Forge +2
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`use-backpack-${recipe.id}`}
                      disabled={qty <= 0}
                      onClick={() => onUseBackpackItem(recipe.id)}
                      className={`w-full py-1 rounded text-[11px] font-bold uppercase tracking-wide transition-colors ${
                        qty > 0
                          ? isTrap
                            ? 'bg-[#7be0ff] hover:bg-[#9ee9ff] text-[#102030] cursor-pointer'
                            : 'bg-[#8ed49a] hover:bg-[#a6e5b1] text-[#0f1d17] cursor-pointer'
                          : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                      }`}
                    >
                      {isTrap ? 'Deploy Trap' : 'Use Item'}
                    </button>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full rounded-lg bg-[#121e30] border border-[#6e8eb0]/30 p-4 text-center text-xs text-[#9db4cb]">
                No backpack items match your current filter or search.
              </div>
            )}

            {/* Visual Empty Bag Sockets */}
            {filter === 'all' &&
              !stockedOnly &&
              searchQuery.trim() === '' &&
              Array.from({ length: occupancy.visibleEmptySockets }, (_, idx) => (
                <div
                  key={`empty-socket-${idx}`}
                  data-testid="inventory-empty-socket"
                  className="rounded-lg border border-dashed border-[#4e6987]/40 bg-[#101a28]/70 p-2.5 flex flex-col items-center justify-center gap-1 min-h-[104px] text-[#5e7794]"
                >
                  <Package className="w-4 h-4 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Empty Slot
                  </span>
                </div>
              ))}
          </div>

          {filter === 'all' &&
            !stockedOnly &&
            searchQuery.trim() === '' &&
            occupancy.hiddenEmptySockets > 0 && (
              <div className="text-[11px] font-semibold text-[#7f96ad] text-right tabular-nums">
                +{occupancy.hiddenEmptySockets} additional open bag slots available
              </div>
            )}

          {/* Selected Item / Gear / Material Inspector */}
          <div
            data-testid="inventory-inspector"
            className="rounded-lg bg-[#132033] border border-[#7be0ff]/45 p-3 flex flex-col gap-2.5"
          >
            {selection.kind === 'item' && selectedRecipe && (() => {
              const qty = hud.backpackInventory[selectedRecipe.id] ?? 0;
              const isComponent = selectedRecipe.usableKind === 'component';
              const isTrap = selectedRecipe.usableKind === 'trap';
              const canCraftMore =
                canCraftRecipe(hud.resources, selectedRecipe.id, hud.backpackInventory) &&
                occupancy.used +
                  selectedRecipe.yieldQty -
                  (selectedRecipe.cost.gears ?? 0) <=
                  occupancy.maxItems;
              const gearsHave = hud.backpackInventory.clockwork_gear ?? 0;
              return (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#0d1726] border border-[#6e8eb0]/45 flex items-center justify-center shrink-0">
                        <CraftItemIcon id={selectedRecipe.id} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display font-bold text-sm text-[#f4efe6]">
                            {selectedRecipe.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-extrabold uppercase ${rarityBadgeStyle(
                              selectedRecipe.rarity,
                            )}`}
                          >
                            {getRarityLabel(selectedRecipe.rarity)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#1b2d45] text-[10px] font-bold text-[#9fe8ff] tabular-nums">
                            Owned: x{qty}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9db4cb] font-semibold mt-0.5">
                          {selectedRecipe.tag} · Hotkey {hotkeyLabelForItem(selectedRecipe.id, selectedRecipe.usableKind)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#dce6f2] leading-relaxed">{selectedRecipe.summary}</p>

                  {/* Recipe Ingredient Breakdown */}
                  <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums bg-[#0e1826] border border-[#455c78]/40 rounded px-2.5 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb] mr-1">
                      Craft Cost:
                    </span>
                    {selectedRecipe.cost.wood > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          hud.resources.wood >= selectedRecipe.cost.wood
                            ? 'text-[#e8d5b8]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <WoodIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.wood}
                      </span>
                    )}
                    {selectedRecipe.cost.stone > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          (hud.resources.stone ?? 0) >= selectedRecipe.cost.stone
                            ? 'text-[#cbd5e1]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <StoneIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.stone}
                      </span>
                    )}
                    {(selectedRecipe.cost.ice ?? 0) > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          (hud.resources.ice ?? 0) >= (selectedRecipe.cost.ice ?? 0)
                            ? 'text-[#7be0ff]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <IceIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.ice}
                      </span>
                    )}
                    {selectedRecipe.cost.pelts > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          hud.resources.pelts >= selectedRecipe.cost.pelts
                            ? 'text-[#e8d5b8]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <PeltIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.pelts}
                      </span>
                    )}
                    {(selectedRecipe.cost.gears ?? 0) > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          gearsHave >= (selectedRecipe.cost.gears ?? 0)
                            ? 'text-[#f6d37a]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <GearIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.gears}
                      </span>
                    )}
                    {selectedRecipe.cost.gold > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          hud.resources.gold >= selectedRecipe.cost.gold
                            ? 'text-[#f6c344]'
                            : 'text-[#ef7b73]'
                        }`}
                      >
                        <GoldIcon className="w-3.5 h-3.5" />
                        {selectedRecipe.cost.gold}g
                      </span>
                    )}
                  </div>

                  {/* Inspector Action Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isComponent && (
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => onUseBackpackItem(selectedRecipe.id)}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                          qty > 0
                            ? isTrap
                              ? 'bg-[#7be0ff] hover:bg-[#9ee9ff] text-[#0f1f2e] cursor-pointer'
                              : 'bg-[#8ed49a] hover:bg-[#a6e5b1] text-[#0f1d17] cursor-pointer'
                            : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                        }`}
                      >
                        {isTrap ? 'Deploy Trap Now' : 'Activate / Consume'}
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid={`inspector-craft-${selectedRecipe.id}`}
                      disabled={!canCraftMore}
                      onClick={() => onCraftItem(selectedRecipe.id)}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                        canCraftMore
                          ? 'bg-[#d98a2b] hover:bg-[#ea9c3b] text-[#131d2b] cursor-pointer'
                          : 'bg-[#253750] text-[#6d839b] cursor-not-allowed'
                      }`}
                    >
                      Craft +{selectedRecipe.yieldQty}
                    </button>

                    <button
                      type="button"
                      data-testid={`salvage-item-${selectedRecipe.id}`}
                      disabled={qty <= 0}
                      onClick={() => onSalvageBackpackItem(selectedRecipe.id, 1)}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 transition-colors ${
                        qty > 0
                          ? 'bg-[#3b1d1d] hover:bg-[#522727] border border-[#f87171]/45 text-[#fecaca] cursor-pointer'
                          : 'bg-[#1c2738] text-[#5e748d] cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Salvage 1
                    </button>

                    {qty > 1 && (
                      <button
                        type="button"
                        onClick={() => onSalvageBackpackItem(selectedRecipe.id, qty)}
                        className="px-2.5 py-1.5 rounded bg-[#2d1616] hover:bg-[#422020] border border-[#f87171]/35 text-[11px] font-bold uppercase text-[#fca5a5] cursor-pointer transition-colors"
                      >
                        Salvage All ({qty})
                      </button>
                    )}
                  </div>
                </>
              );
            })()}

            {selection.kind === 'gear' && (() => {
              const slot = selection.slot;
              const ownedTier = hud.unlockedGear[slot] ?? 1;
              const equippedTier = hud.gear[slot] ?? 0;
              const spec = getGearSlotSpec(slot, equippedTier > 0 ? equippedTier : ownedTier);
              const meta = GEAR_SLOT_META[slot];
              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display font-bold text-sm text-[#f4efe6]">
                        {spec.name} ({meta.label})
                      </div>
                      <div className="text-[11px] text-[#9fe8ff] font-semibold">
                        {meta.role} · Unlocked Tier {ownedTier}/5
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${rarityBadgeStyle(
                        spec.rarity,
                      )}`}
                    >
                      {getRarityLabel(spec.rarity)}
                    </span>
                  </div>
                  <p className="text-xs text-[#dce6f2]">{spec.description}</p>
                  <div className="text-xs font-bold text-[#8ed49a]">Bonus: {spec.summary}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid={`inspector-equip-gear-${slot}`}
                      onClick={(e) => {
                        if (equippedTier > 0) {
                          onUnequipGear(slot);
                        } else {
                          launchFlyToSlot(e.currentTarget, slot, spec.name);
                          onEquipGear(slot);
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-[#1f4d36] hover:bg-[#2a6648] text-xs font-bold uppercase text-[#bbf7d0] cursor-pointer"
                    >
                      {equippedTier > 0 ? 'Remove to Pack' : `Equip Tier ${ownedTier}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeDrawerTab('craft')}
                      className="px-3 py-1.5 rounded bg-[#d98a2b] hover:bg-[#ea9c3b] text-xs font-bold uppercase text-[#131d2b] cursor-pointer"
                    >
                      Upgrade at Station [C]
                    </button>
                  </div>
                </>
              );
            })()}

            {selection.kind === 'material' && (() => {
              const mat = RARE_MATERIAL_SPECS[selection.id];
              const count = hud.rareMaterials[selection.id] ?? 0;
              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display font-bold text-sm text-[#f4efe6]">
                        {mat.name}
                      </div>
                      <div className="text-[11px] font-semibold text-[#d8b4fe]">
                        {mat.zoneHint} · {mat.sourceHint}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#2c1544] border border-[#d946ef]/55 text-xs font-extrabold tabular-nums text-[#f5d0fe]">
                      Owned: {count}
                    </span>
                  </div>
                  <p className="text-xs text-[#dce6f2]">{mat.description}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeDrawerTab('mystery')}
                      className="px-3 py-1.5 rounded bg-[#581c87] hover:bg-[#6b21a8] border border-[#e879f9]/60 text-xs font-bold uppercase text-[#fae8ff] cursor-pointer"
                    >
                      Forge Mythic Gear in Mysteries [Y]
                    </button>
                  </div>
                </>
              );
            })()}

            {selection.kind === 'wings' && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-sm text-[#fff7ed]">
                      {hud.wingsSpec.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[#fdba74]">
                      {hud.wingsSpec.subtitle}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#36170d] border border-[#fb923c]/60 text-[10px] font-bold uppercase text-[#fed7aa]">
                    Tier {hud.wingsTier}/3
                  </span>
                </div>
                <p className="text-xs text-[#dce6f2]">{hud.wingsSpec.description}</p>
              </>
            )}

            {selection.kind === 'ascension' && (
              <>
                <div className="font-display font-bold text-sm text-[#fae8ff]">
                  {equippedAscSpec ? equippedAscSpec.name : 'Mythic Ascension Panoply Slot'}
                </div>
                <p className="text-xs text-[#dce6f2]">
                  {equippedAscSpec
                    ? `${equippedAscSpec.description} (${equippedAscSpec.visualSummary})`
                    : 'Unlock elemental Fire, Frost, Lightning, Poison, or Dark Matter visual gear in the Mysteries Unknown Emporium [Y] using rare Zone 4/5 ores & woods.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cargo Resources & Zone 4/5 Rare Materials Vault */}
      <div
        data-testid="inventory-materials-vault"
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
      >
        {/* Raw Cargo Resources */}
        <div className="rounded-lg bg-[#152438] border border-[#6e8eb0]/40 p-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9fe8ff]">
              Raw Cargo &amp; Trade Stock
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={meatCount <= 0}
                onClick={() => onSellMeat()}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tabular-nums transition-colors ${
                  meatCount > 0
                    ? 'bg-[#362417] hover:bg-[#4a3120] border border-[#fbbf24]/55 text-[#fde68a] cursor-pointer'
                    : 'bg-[#1a2936] text-[#6e849c] cursor-not-allowed'
                }`}
              >
                Sell Meat ({meatUnitGold}g ea)
              </button>
              <button
                type="button"
                disabled={cargoGold <= 0}
                onClick={onSellAll}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tabular-nums transition-colors ${
                  cargoGold > 0
                    ? 'bg-[#223854] hover:bg-[#2d4a6e] border border-[#f6c344]/60 text-[#f6c344] cursor-pointer'
                    : 'bg-[#1a2936] text-[#6e849c] cursor-not-allowed'
                }`}
              >
                Sell All (+{cargoGold}g)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 tabular-nums">
            <div className="rounded bg-[#101c2d] border border-[#6e8eb0]/30 p-2 flex flex-col items-center">
              <WoodIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#f4efe6] mt-1">{hud.resources.wood}</span>
              <span className="text-[9px] uppercase text-[#9db4cb]">Wood</span>
            </div>
            <div className="rounded bg-[#101c2d] border border-[#6e8eb0]/30 p-2 flex flex-col items-center">
              <StoneIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#cbd5e1] mt-1">{hud.resources.stone ?? 0}</span>
              <span className="text-[9px] uppercase text-[#9db4cb]">Stone</span>
            </div>
            <div className="rounded bg-[#101c2d] border border-[#6e8eb0]/30 p-2 flex flex-col items-center">
              <IceIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#7be0ff] mt-1">{hud.resources.ice ?? 0}</span>
              <span className="text-[9px] uppercase text-[#9db4cb]">Ice</span>
            </div>
            <div className="rounded bg-[#101c2d] border border-[#6e8eb0]/30 p-2 flex flex-col items-center">
              <PeltIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#e8d5b8] mt-1">{hud.resources.pelts}</span>
              <span className="text-[9px] uppercase text-[#9db4cb]">Pelts</span>
            </div>
            <div className="rounded bg-[#101c2d] border border-[#6e8eb0]/30 p-2 flex flex-col items-center">
              <MeatIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#fda4af] mt-1">{meatCount}</span>
              <span className="text-[9px] uppercase text-[#9db4cb]">Meat</span>
            </div>
            <div className="rounded bg-[#221c12] border border-[#f6c344]/40 p-2 flex flex-col items-center">
              <GoldIcon className="w-4 h-4" />
              <span className="text-xs font-extrabold text-[#f6c344] mt-1">{hud.resources.gold}</span>
              <span className="text-[9px] uppercase text-[#fde68a]">Gold</span>
            </div>
          </div>
        </div>

        {/* Zone 4 & 5 Rare Materials Vault */}
        <div className="rounded-lg bg-[#1d152b] border border-[#a855f7]/45 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#e879f9] inline-flex items-center gap-1">
              <Gem className="w-3.5 h-3.5" />
              Rare Zone 4 &amp; 5 Materials Vault
            </span>
            <button
              type="button"
              onClick={() => onChangeDrawerTab('mystery')}
              className="text-[10px] font-bold uppercase text-[#f0abfc] hover:text-white cursor-pointer"
            >
              Mysteries Shop &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {RARE_MATERIAL_ORDER.map((matId) => {
              const mat = RARE_MATERIAL_SPECS[matId];
              const count = hud.rareMaterials[matId] ?? 0;
              const isSelected = selection.kind === 'material' && selection.id === matId;
              return (
                <button
                  key={matId}
                  type="button"
                  data-testid={`inventory-rare-mat-${matId}`}
                  onClick={() => setSelection({ kind: 'material', id: matId })}
                  className={`rounded border px-2 py-1.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#311d52] border-[#f6c344]'
                      : count > 0
                        ? 'bg-[#26163d] border-[#c084fc]/55 hover:bg-[#311d4f]'
                        : 'bg-[#161024] border-[#6e8eb0]/25 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[10px] font-bold truncate"
                      style={{ color: mat.accentHex }}
                    >
                      {mat.shortName}
                    </span>
                    <span className="text-xs font-extrabold tabular-nums text-[#f4efe6]">
                      {count}
                    </span>
                  </div>
                  <div className="text-[9px] uppercase text-[#b8a2d6] truncate">
                    {mat.rarity} · {mat.element.replace('_', ' ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weighted Random Loot Scaling & Drop Odds Breakdown (Secret Chests & Zone Bosses) */}
      <div
        data-testid="loot-scaling-card"
        className="rounded-lg bg-[#192338] border border-[#f6c344]/45 p-3 flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#f6c344] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Weighted Loot Scaling · Chest &amp; Boss Drop Table
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tabular-nums">
            <span
              data-testid="loot-scaling-tier-label"
              className="px-2 py-0.5 rounded bg-[#2a1f10] border border-[#f6c344]/55 text-[#fde68a]"
            >
              {hud.lootScaling.tierLabel}
            </span>
            <span
              data-testid="loot-scaling-multiplier"
              className="px-2 py-0.5 rounded bg-[#10283b] border border-[#7be0ff]/55 text-[#9fe8ff]"
            >
              Zone T{hud.lootScaling.zoneTier} · Gear Lv{' '}
              {hud.lootScaling.effectiveGearLevel.toFixed(1)} · x
              {hud.lootScaling.resourceMultiplier.toFixed(2)} Yield
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-[#121a2a] border border-[#4a6280]/40 px-2.5 py-2 flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb]">
              Secret Chest Spawn Weights ({hud.zone.name})
            </div>
            <div
              data-testid="chest-rarity-weights"
              className="flex flex-wrap items-center gap-3 font-bold tabular-nums text-[11px]"
            >
              <span className="text-[#8ed49a]">
                Supply {hud.lootScaling.chestRarityPercentages.supply}%
              </span>
              <span className="text-[#7be0ff]">
                Relic {hud.lootScaling.chestRarityPercentages.relic}%
              </span>
              <span className="text-[#f0abfc]">
                Aurora {hud.lootScaling.chestRarityPercentages.aurora}%
              </span>
            </div>
          </div>

          <div className="rounded bg-[#121a2a] border border-[#4a6280]/40 px-2.5 py-2 flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9db4cb]">
              Weighted Item Rarity Odds (Scales w/ Zone &amp; Gear)
            </div>
            <div
              data-testid="item-rarity-weights"
              className="flex flex-wrap items-center gap-2.5 font-bold tabular-nums text-[11px]"
            >
              <span className="text-[#cbd5e1]">
                Common {hud.lootScaling.itemRarityPercentages.common}%
              </span>
              <span className="text-[#8ed49a]">
                Uncommon {hud.lootScaling.itemRarityPercentages.uncommon}%
              </span>
              <span className="text-[#7be0ff]">
                Rare {hud.lootScaling.itemRarityPercentages.rare}%
              </span>
              <span className="text-[#fbbf24]">
                Epic {hud.lootScaling.itemRarityPercentages.epic}%
              </span>
              <span className="text-[#f0abfc]">
                Mythic {hud.lootScaling.itemRarityPercentages.mythic}%
              </span>
            </div>
          </div>
        </div>

        {hud.lootScaling.lastRoll && (
          <div
            data-testid="last-loot-roll-banner"
            className="rounded bg-[#221a12] border border-[#f6c344]/55 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <span className="font-bold text-[#fde68a]">
              Latest Spoils ({hud.lootScaling.lastRoll.sourceLabel} · +
              {hud.lootScaling.lastRoll.gold}g):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {hud.lootScaling.lastRoll.items.map((rolled, idx) => (
                <span
                  key={`${rolled.id}-${idx}`}
                  className={`px-1.5 py-0.5 rounded border text-[10px] font-extrabold uppercase ${rarityBadgeStyle(
                    rolled.rarity,
                  )}`}
                >
                  {rolled.qty}x {rolled.name} ({rolled.rarity})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {flyingGhost && (
        <div
          key={flyingGhost.key}
          data-testid="equip-flying-ghost"
          aria-hidden="true"
          className="fixed z-[90] pointer-events-none flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#19334d] border-2 border-[#8ed49a] shadow-[0_0_20px_rgba(123,224,255,0.65)] text-xs font-bold text-[#f4efe6] animate-item-fly-to-slot"
          style={
            {
              left: `${flyingGhost.targetLeft}px`,
              top: `${flyingGhost.targetTop}px`,
              marginLeft: '-56px',
              marginTop: '-18px',
              '--fly-dx': `${flyingGhost.dx}px`,
              '--fly-dy': `${flyingGhost.dy}px`,
            } as CSSProperties
          }
        >
          {flyingGhost.slot === 'wings' ? (
            <Flame className="w-4 h-4 text-[#fb923c]" />
          ) : (
            <GearSlotIcon slot={flyingGhost.slot} className="w-4 h-4 text-[#9fe8ff]" />
          )}
          <span className="truncate max-w-[110px]">{flyingGhost.label}</span>
        </div>
      )}
    </div>
  );
}
