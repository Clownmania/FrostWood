import type { AnimalKind, GamePhase, ZoneBossId, ZoneId } from './types';

export interface SpeciesAttackSoundProfile {
  wave: OscillatorType;
  windupStartHz: number;
  windupPeakHz: number;
  windupEndHz: number;
  windupDuration: number;
  windupGain: number;
  attackStartHz: number;
  attackEndHz: number;
  attackDuration: number;
  attackGain: number;
  filterHz: number;
  biteNoiseHz: number;
}

export function getSpeciesAttackSoundProfile(
  kind: AnimalKind,
): SpeciesAttackSoundProfile {
  switch (kind) {
    case 'snow_owl':
      return {
        wave: 'triangle',
        windupStartHz: 520,
        windupPeakHz: 780,
        windupEndHz: 440,
        windupDuration: 0.28,
        windupGain: 0.09,
        attackStartHz: 860,
        attackEndHz: 340,
        attackDuration: 0.18,
        attackGain: 0.13,
        filterHz: 2200,
        biteNoiseHz: 2600,
      };
    case 'wolverine':
      return {
        wave: 'sawtooth',
        windupStartHz: 165,
        windupPeakHz: 295,
        windupEndHz: 120,
        windupDuration: 0.34,
        windupGain: 0.14,
        attackStartHz: 340,
        attackEndHz: 95,
        attackDuration: 0.24,
        attackGain: 0.2,
        filterHz: 1480,
        biteNoiseHz: 1850,
      };
    case 'frost_boar':
      return {
        wave: 'sawtooth',
        windupStartHz: 95,
        windupPeakHz: 168,
        windupEndHz: 74,
        windupDuration: 0.44,
        windupGain: 0.15,
        attackStartHz: 210,
        attackEndHz: 58,
        attackDuration: 0.3,
        attackGain: 0.22,
        filterHz: 920,
        biteNoiseHz: 840,
      };
    case 'lynx':
      return {
        wave: 'sawtooth',
        windupStartHz: 260,
        windupPeakHz: 440,
        windupEndHz: 210,
        windupDuration: 0.34,
        windupGain: 0.11,
        attackStartHz: 520,
        attackEndHz: 185,
        attackDuration: 0.22,
        attackGain: 0.16,
        filterHz: 1850,
        biteNoiseHz: 2200,
      };
    case 'sabertooth':
      return {
        wave: 'sawtooth',
        windupStartHz: 195,
        windupPeakHz: 350,
        windupEndHz: 145,
        windupDuration: 0.38,
        windupGain: 0.14,
        attackStartHz: 390,
        attackEndHz: 110,
        attackDuration: 0.26,
        attackGain: 0.2,
        filterHz: 1450,
        biteNoiseHz: 1750,
      };
    case 'polar_bear':
      return {
        wave: 'sawtooth',
        windupStartHz: 78,
        windupPeakHz: 118,
        windupEndHz: 62,
        windupDuration: 0.5,
        windupGain: 0.16,
        attackStartHz: 142,
        attackEndHz: 46,
        attackDuration: 0.34,
        attackGain: 0.24,
        filterHz: 680,
        biteNoiseHz: 480,
      };
    case 'mammoth':
      return {
        wave: 'sawtooth',
        windupStartHz: 155,
        windupPeakHz: 275,
        windupEndHz: 185,
        windupDuration: 0.62,
        windupGain: 0.16,
        attackStartHz: 245,
        attackEndHz: 58,
        attackDuration: 0.42,
        attackGain: 0.26,
        filterHz: 920,
        biteNoiseHz: 340,
      };
    case 'aurora_fenrir':
      return {
        wave: 'sawtooth',
        windupStartHz: 145,
        windupPeakHz: 240,
        windupEndHz: 120,
        windupDuration: 0.46,
        windupGain: 0.16,
        attackStartHz: 310,
        attackEndHz: 82,
        attackDuration: 0.32,
        attackGain: 0.22,
        filterHz: 1350,
        biteNoiseHz: 1450,
      };
    case 'wolf':
    default:
      return {
        wave: 'sawtooth',
        windupStartHz: 115,
        windupPeakHz: 178,
        windupEndHz: 92,
        windupDuration: 0.38,
        windupGain: 0.12,
        attackStartHz: 245,
        attackEndHz: 76,
        attackDuration: 0.22,
        attackGain: 0.18,
        filterHz: 1100,
        biteNoiseHz: 1300,
      };
  }
}

export interface BiomeAudioProfile {
  zone: ZoneId;
  label: string;
  rustleBaseHz: number;
  rustleScale: number;
  windBaseHz: number;
  windScale: number;
  whistleBaseHz: number;
  whistleQ: number;
  whistleScale: number;
  rumbleBaseHz: number;
  rumbleScale: number;
  callIntervalSec: number;
}

const BIOME_AUDIO_PROFILES: Record<ZoneId, BiomeAudioProfile> = {
  level1: {
    zone: 'level1',
    label: 'Whispering Pine Woods',
    rustleBaseHz: 1380,
    rustleScale: 1.15,
    windBaseHz: 245,
    windScale: 1.0,
    whistleBaseHz: 585,
    whistleQ: 4.2,
    whistleScale: 1.0,
    rumbleBaseHz: 110,
    rumbleScale: 0.85,
    callIntervalSec: 13,
  },
  level2: {
    zone: 'level2',
    label: 'Glacial Highlands Ridge',
    rustleBaseHz: 1560,
    rustleScale: 0.9,
    windBaseHz: 310,
    windScale: 1.25,
    whistleBaseHz: 740,
    whistleQ: 5.4,
    whistleScale: 1.35,
    rumbleBaseHz: 105,
    rumbleScale: 1.1,
    callIntervalSec: 15,
  },
  level3: {
    zone: 'level3',
    label: 'Rimefang Abyssal Trench',
    rustleBaseHz: 1120,
    rustleScale: 0.78,
    windBaseHz: 195,
    windScale: 1.18,
    whistleBaseHz: 460,
    whistleQ: 4.8,
    whistleScale: 1.15,
    rumbleBaseHz: 82,
    rumbleScale: 1.45,
    callIntervalSec: 16,
  },
  level4: {
    zone: 'level4',
    label: 'Obsidian Permafrost Caldera',
    rustleBaseHz: 1680,
    rustleScale: 1.05,
    windBaseHz: 265,
    windScale: 1.3,
    whistleBaseHz: 660,
    whistleQ: 4.6,
    whistleScale: 1.25,
    rumbleBaseHz: 74,
    rumbleScale: 1.6,
    callIntervalSec: 17,
  },
  level5: {
    zone: 'level5',
    label: 'Starfall Eternal Zero',
    rustleBaseHz: 1850,
    rustleScale: 0.95,
    windBaseHz: 340,
    windScale: 1.35,
    whistleBaseHz: 880,
    whistleQ: 6.2,
    whistleScale: 1.45,
    rumbleBaseHz: 92,
    rumbleScale: 1.35,
    callIntervalSec: 18,
  },
  city: {
    zone: 'city',
    label: 'Frostcave Geothermal Sanctuary',
    rustleBaseHz: 920,
    rustleScale: 0.45,
    windBaseHz: 165,
    windScale: 0.35,
    whistleBaseHz: 390,
    whistleQ: 2.8,
    whistleScale: 0.25,
    rumbleBaseHz: 68,
    rumbleScale: 0.95,
    callIntervalSec: 28,
  },
};

export function getBiomeAudioProfile(zone: ZoneId = 'level1'): BiomeAudioProfile {
  return BIOME_AUDIO_PROFILES[zone] ?? BIOME_AUDIO_PROFILES.level1;
}

export interface WeatherAmbientMix {
  rustleGain: number;
  rustleFilterHz: number;
  windGain: number;
  rumbleGain: number;
  rumbleFilterHz: number;
  windFilterHz: number;
  windQ: number;
  whistleGain: number;
  whistleFilterHz: number;
  whistleQ: number;
  whistlePan: number;
  weatherPan: number;
  campfireGain: number;
  campfirePan: number;
  wildlifeCallIntervalSec: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function computeSpatialStereoPan(
  listenerX: number,
  listenerZ: number,
  sourceX: number,
  sourceZ: number,
): number {
  const dx = sourceX - listenerX;
  const dz = sourceZ - listenerZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) return 0;
  return clamp(dx / Math.max(4.5, dist), -0.85, 0.85);
}

export function computeSpatialDistanceGain(dist: number, maxRange: number): number {
  if (maxRange <= 0) return 0;
  const t = clamp(1 - dist / maxRange, 0, 1);
  return t * Math.sqrt(t);
}

export function computeWeatherAmbientMix(params: {
  weatherIntensity: number;
  gustIntensity: number;
  campDist: number;
  campX: number;
  campZ: number;
  playerX: number;
  playerZ: number;
  time: number;
  nearCampfire: boolean;
  zone?: ZoneId;
  timeOfDay?: number;
}): WeatherAmbientMix {
  const w = clamp(params.weatherIntensity, 0, 1);
  const g = clamp(params.gustIntensity, 0, 1);
  const biome = getBiomeAudioProfile(params.zone ?? 'level1');

  // Soft pine & snowfall rustling: silky hush in clear, warm rustle in light snow, layered under blizzard
  const lightSnowBell = Math.sin(clamp(w, 0, 1) * Math.PI * 0.85);
  const rustleGain =
    (0.011 + lightSnowBell * 0.048 + g * 0.024) * biome.rustleScale;
  const rustleFilterHz =
    biome.rustleBaseHz + Math.sin(params.time * 0.42) * 110 + g * 180;

  // Smooth slow breathing swells for blizzard wind
  const howlPulse =
    0.88 + 0.08 * Math.sin(params.time * 0.34) + 0.04 * Math.sin(params.time * 0.19 + 1.1);
  const windGain = (0.006 + Math.pow(g, 1.42) * 0.155) * howlPulse * biome.windScale;
  const rumbleGain =
    (0.004 + Math.pow(g, 1.52) * 0.092 * howlPulse) * biome.rumbleScale;
  const filterWave =
    Math.sin(params.time * 0.27) * 58 + Math.sin(params.time * 0.15 + 0.8) * 32;
  const windFilterHz = biome.windBaseHz + w * 105 + g * (280 + filterWave);
  const windQ = 0.88 + g * 1.45;
  const weatherPan = Math.sin(params.time * 0.18) * (0.12 + g * 0.34);

  // Woodland & ridge wind whistling layer: organic resonant air whistling through pine needles & ice spires
  const whistleSweep =
    Math.sin(params.time * 0.52) * 85 + Math.cos(params.time * 0.31 + 0.6) * 55;
  const whistleEnvelope = Math.max(
    0,
    0.22 + 0.55 * Math.sin(params.time * 0.41 + 0.4) + 0.23 * Math.cos(params.time * 0.73),
  );
  const whistleGain =
    (0.0035 + (0.012 + g * 0.036 + w * 0.014) * whistleEnvelope) * biome.whistleScale;
  const whistleFilterHz = clamp(
    biome.whistleBaseHz + g * 240 + whistleSweep,
    260,
    1450,
  );
  const whistleQ = biome.whistleQ + g * 1.8;
  const whistlePan = Math.cos(params.time * 0.29 + 0.5) * (0.28 + g * 0.35);

  // Spatial campfire crackle around the hearth
  const baseFire = computeSpatialDistanceGain(params.campDist, 18);
  const campfireGain = (params.nearCampfire ? Math.max(baseFire, 0.52) : baseFire) * 0.068;
  const campfirePan = computeSpatialStereoPan(
    params.playerX,
    params.playerZ,
    params.campX,
    params.campZ,
  );

  // Dusk/night increases nocturnal owl & wolf calls slightly
  const tod = params.timeOfDay ?? 0.35;
  const isNightOrDusk = tod < 0.22 || tod > 0.74;
  const wildlifeCallIntervalSec = Math.max(
    7,
    biome.callIntervalSec * (isNightOrDusk ? 0.82 : 1.0) * (w > 0.7 ? 1.25 : 1.0),
  );

  return {
    rustleGain,
    rustleFilterHz,
    windGain,
    rumbleGain,
    rumbleFilterHz: biome.rumbleBaseHz,
    windFilterHz,
    windQ,
    whistleGain,
    whistleFilterHz,
    whistleQ,
    whistlePan,
    weatherPan,
    campfireGain,
    campfirePan,
    wildlifeCallIntervalSec,
  };
}

function createSeamlessWarmNoiseBuffer(
  ctx: AudioContext,
  seconds: number,
  warmthWeight: number,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const crossfadeSamples = Math.min(Math.floor(ctx.sampleRate * 0.6), Math.floor(length / 4));
  const totalGen = length + crossfadeSamples;
  const raw = new Float32Array(totalGen);

  // Warm Voss/pink-brownian cascade without harsh white-noise grit
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  // Pre-warm filter state so start has natural energy
  for (let w = 0; w < 2048; w++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.9975 * b0 + white * 0.025;
    b1 = 0.988 * b1 + white * 0.03;
    b2 = 0.96 * b2 + white * 0.042;
    b3 = 0.84 * b3 + white * 0.09;
  }

  for (let i = 0; i < totalGen; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.9975 * b0 + white * 0.025;
    b1 = 0.988 * b1 + white * 0.03;
    b2 = 0.96 * b2 + white * 0.042;
    b3 = 0.84 * b3 + white * 0.09;
    raw[i] = clamp((b0 + b1 + b2 * 0.85 + b3 * warmthWeight) * 1.15, -0.95, 0.95);
  }

  // Equal-power cosine crossfade from tail into head so looping is 100% click-free
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    out[i] = raw[i];
  }
  for (let i = 0; i < crossfadeSamples; i++) {
    const t = i / crossfadeSamples;
    const headFade = Math.sin(t * Math.PI * 0.5);
    const tailFade = Math.cos(t * Math.PI * 0.5);
    out[i] = raw[i] * headFade + raw[length + i] * tailFade;
  }

  return buffer;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterVolume = 0.75;

  private masterGain: GainNode | null = null;
  private ambientInit = false;
  private noiseSource: AudioBufferSourceNode | null = null;
  private windNoiseSource: AudioBufferSourceNode | null = null;
  private rustleFilter: BiquadFilterNode | null = null;
  private rustleSmoothFilter: BiquadFilterNode | null = null;
  private rustleGainNode: GainNode | null = null;
  private rustlePanner: StereoPannerNode | null = null;

  private windFilter: BiquadFilterNode | null = null;
  private windSmoothFilter: BiquadFilterNode | null = null;
  private windGainNode: GainNode | null = null;
  private windPanner: StereoPannerNode | null = null;
  private whistleFilter: BiquadFilterNode | null = null;
  private whistleGainNode: GainNode | null = null;
  private whistlePanner: StereoPannerNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGainNode: GainNode | null = null;

  private fireFilter: BiquadFilterNode | null = null;
  private fireGainNode: GainNode | null = null;
  private firePanner: StereoPannerNode | null = null;

  private listenerX = 0;
  private listenerZ = 4.6;

  public isMuted(): boolean {
    return this.muted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(volume: number): void {
    const next = clamp(volume, 0, 1);
    this.masterVolume = next;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : next, now, 0.08);
    }
  }

  public setMuted(next: boolean): void {
    this.muted = next;
    if (!next && !this.ctx) {
      this.ensureContext();
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(next ? 0 : this.masterVolume, now, 0.12);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    this.ensureContext();
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.ambientInit && this.masterGain) {
      this.initAmbientGraph(this.ctx, this.masterGain);
    }
    return this.ctx;
  }

  private initAmbientGraph(ctx: AudioContext, dest: GainNode): void {
    this.ambientInit = true;
    // Two long, seamless, crossfaded warm noise loops prevent repetition and comb filtering
    const softBuffer = createSeamlessWarmNoiseBuffer(ctx, 8.0, 0.48);
    const windBuffer = createSeamlessWarmNoiseBuffer(ctx, 9.5, 0.34);

    const src = ctx.createBufferSource();
    src.buffer = softBuffer;
    src.loop = true;

    const windSrc = ctx.createBufferSource();
    windSrc.buffer = windBuffer;
    windSrc.loop = true;

    // 1. Soft snowfall & pine rustle layer (bandpass + gentle lowpass rolloff for silky air)
    this.rustleFilter = ctx.createBiquadFilter();
    this.rustleFilter.type = 'bandpass';
    this.rustleFilter.frequency.value = 1350;
    this.rustleFilter.Q.value = 0.55;
    this.rustleSmoothFilter = ctx.createBiquadFilter();
    this.rustleSmoothFilter.type = 'lowpass';
    this.rustleSmoothFilter.frequency.value = 2800;
    this.rustleGainNode = ctx.createGain();
    this.rustleGainNode.gain.value = 0;
    this.rustlePanner = ctx.createStereoPanner();
    src
      .connect(this.rustleFilter)
      .connect(this.rustleSmoothFilter)
      .connect(this.rustleGainNode)
      .connect(this.rustlePanner)
      .connect(dest);

    // 2. Smooth howling blizzard wind layer (moderate Q + warm upper lowpass ceiling)
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 280;
    this.windFilter.Q.value = 1.1;
    this.windSmoothFilter = ctx.createBiquadFilter();
    this.windSmoothFilter.type = 'lowpass';
    this.windSmoothFilter.frequency.value = 1350;
    this.windGainNode = ctx.createGain();
    this.windGainNode.gain.value = 0;
    this.windPanner = ctx.createStereoPanner();
    windSrc
      .connect(this.windFilter)
      .connect(this.windSmoothFilter)
      .connect(this.windGainNode)
      .connect(this.windPanner)
      .connect(dest);

    // 2b. Woodland & canyon wind whistling layer (resonant pine-needle & ridge whistle)
    this.whistleFilter = ctx.createBiquadFilter();
    this.whistleFilter.type = 'bandpass';
    this.whistleFilter.frequency.value = 585;
    this.whistleFilter.Q.value = 4.5;
    this.whistleGainNode = ctx.createGain();
    this.whistleGainNode.gain.value = 0;
    this.whistlePanner = ctx.createStereoPanner();
    windSrc
      .connect(this.whistleFilter)
      .connect(this.whistleGainNode)
      .connect(this.whistlePanner)
      .connect(dest);

    // 2c. Deep velvety storm wind rumble
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 115;
    this.rumbleFilter.Q.value = 0.7;
    this.rumbleGainNode = ctx.createGain();
    this.rumbleGainNode.gain.value = 0;
    windSrc.connect(this.rumbleFilter).connect(this.rumbleGainNode).connect(dest);

    // 3. Spatial campfire hearth warmth layer
    this.fireFilter = ctx.createBiquadFilter();
    this.fireFilter.type = 'bandpass';
    this.fireFilter.frequency.value = 980;
    this.fireFilter.Q.value = 1.1;
    this.fireGainNode = ctx.createGain();
    this.fireGainNode.gain.value = 0;
    this.firePanner = ctx.createStereoPanner();
    src.connect(this.fireFilter).connect(this.fireGainNode).connect(this.firePanner).connect(dest);

    src.start(0);
    windSrc.start(0);
    this.noiseSource = src;
    this.windNoiseSource = windSrc;
  }

  public updateSpatialAmbient(params: {
    phase: GamePhase;
    playerX: number;
    playerZ: number;
    campX: number;
    campZ: number;
    weatherIntensity: number;
    gustIntensity: number;
    time: number;
    nearCampfire: boolean;
    zone?: ZoneId;
    timeOfDay?: number;
  }): void {
    this.listenerX = params.playerX;
    this.listenerZ = params.playerZ;

    if (!this.ctx || !this.ambientInit || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (this.muted || params.phase === 'paused' || params.phase === 'gameover') {
      this.rustleGainNode?.gain.setTargetAtTime(0, now, 0.25);
      this.windGainNode?.gain.setTargetAtTime(0, now, 0.25);
      this.whistleGainNode?.gain.setTargetAtTime(0, now, 0.25);
      this.rumbleGainNode?.gain.setTargetAtTime(0, now, 0.25);
      this.fireGainNode?.gain.setTargetAtTime(0, now, 0.2);
      return;
    }

    const campDist = Math.hypot(
      params.campX - params.playerX,
      params.campZ - params.playerZ,
    );
    const mix = computeWeatherAmbientMix({
      weatherIntensity: params.weatherIntensity,
      gustIntensity: params.gustIntensity,
      campDist,
      campX: params.campX,
      campZ: params.campZ,
      playerX: params.playerX,
      playerZ: params.playerZ,
      time: params.time,
      nearCampfire: params.nearCampfire,
      zone: params.zone,
      timeOfDay: params.timeOfDay,
    });

    const phaseScale = params.phase === 'title' ? 0.42 : 1.0;

    // Generous exponential smoothing constants avoid sudden steps between biomes & weather
    this.rustleFilter?.frequency.setTargetAtTime(mix.rustleFilterHz, now, 0.65);
    this.rustleGainNode?.gain.setTargetAtTime(mix.rustleGain * phaseScale, now, 0.55);
    this.rustlePanner?.pan.setTargetAtTime(-mix.weatherPan * 0.5, now, 0.6);

    this.windFilter?.frequency.setTargetAtTime(mix.windFilterHz, now, 0.65);
    this.windFilter?.Q.setTargetAtTime(mix.windQ, now, 0.65);
    this.windSmoothFilter?.frequency.setTargetAtTime(
      1050 + params.gustIntensity * 550,
      now,
      0.65,
    );
    this.windGainNode?.gain.setTargetAtTime(mix.windGain * phaseScale, now, 0.55);
    this.windPanner?.pan.setTargetAtTime(mix.weatherPan, now, 0.65);

    this.whistleFilter?.frequency.setTargetAtTime(mix.whistleFilterHz, now, 0.55);
    this.whistleFilter?.Q.setTargetAtTime(mix.whistleQ, now, 0.55);
    this.whistleGainNode?.gain.setTargetAtTime(mix.whistleGain * phaseScale, now, 0.5);
    this.whistlePanner?.pan.setTargetAtTime(mix.whistlePan, now, 0.55);

    this.rumbleFilter?.frequency.setTargetAtTime(mix.rumbleFilterHz, now, 0.7);
    this.rumbleGainNode?.gain.setTargetAtTime(mix.rumbleGain * phaseScale, now, 0.65);

    // Gentle organic ember glow for the spatial campfire (slow smooth flicker)
    const crackleFlicker =
      0.9 + 0.06 * Math.sin(params.time * 2.1) + 0.04 * Math.cos(params.time * 3.4);
    this.fireGainNode?.gain.setTargetAtTime(
      mix.campfireGain * crackleFlicker * phaseScale,
      now,
      0.24,
    );
    this.firePanner?.pan.setTargetAtTime(mix.campfirePan, now, 0.24);
  }

  public playBiomeWildlifeCall(
    kind: AnimalKind,
    worldX?: number,
    worldZ?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 48);

    if (kind === 'snow_owl') {
      // Haunting hollow woodland owl hoot ("hoo... hoo-hoo")
      const notes = [
        { delay: 0, dur: 0.34, f0: 410, f1: 375, gain: 0.085 },
        { delay: 0.46, dur: 0.18, f0: 425, f1: 395, gain: 0.07 },
        { delay: 0.68, dur: 0.42, f0: 390, f1: 335, gain: 0.08 },
      ];
      for (const n of notes) {
        const t = now + n.delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.jitter(n.f0, 0.03), t);
        osc.frequency.exponentialRampToValueAtTime(n.f1, t + n.dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(n.gain, t + 0.045);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(g).connect(out);
        osc.start(t);
        osc.stop(t + n.dur + 0.02);
      }
      return;
    }

    if (kind === 'wolf' || kind === 'aurora_fenrir') {
      // Distant mournful wolf howl echoing through the pines
      const dur = kind === 'aurora_fenrir' ? 1.25 : 0.95;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'triangle';
      const baseHz = this.jitter(kind === 'aurora_fenrir' ? 265 : 310, 0.05);
      osc.frequency.setValueAtTime(baseHz * 0.78, now);
      osc.frequency.exponentialRampToValueAtTime(baseHz * 1.32, now + dur * 0.36);
      osc.frequency.exponentialRampToValueAtTime(baseHz * 0.88, now + dur);
      filter.type = 'bandpass';
      filter.frequency.value = baseHz * 1.4;
      filter.Q.value = 1.8;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(filter).connect(g).connect(out);
      osc.start(now);
      osc.stop(now + dur + 0.04);
      return;
    }

    if (kind === 'stag' || kind === 'frost_stag') {
      // Resonant woodland elk/stag bugle call
      const dur = 0.62;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      const f0 = kind === 'frost_stag' ? 280 : 240;
      osc.frequency.setValueAtTime(this.jitter(f0, 0.05), now);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.65, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.92, now + dur);
      filter.type = 'lowpass';
      filter.frequency.value = 920;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.075, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(filter).connect(g).connect(out);
      osc.start(now);
      osc.stop(now + dur + 0.03);
      return;
    }

    // Default territorial call (fox yip, wolverine rasp, boar grunt, lynx cry)
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = kind === 'fox' || kind === 'hare' ? 'triangle' : 'sawtooth';
    const startHz =
      kind === 'fox'
        ? 540
        : kind === 'wolverine' || kind === 'lynx'
          ? 320
          : kind === 'frost_boar' || kind === 'musk_ox'
            ? 125
            : 220;
    osc.frequency.setValueAtTime(this.jitter(startHz, 0.06), now);
    osc.frequency.exponentialRampToValueAtTime(startHz * 0.62, now + 0.28);
    filter.type = 'lowpass';
    filter.frequency.value = 1280;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.07, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(filter).connect(g).connect(out);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  private createOutputNode(
    ctx: AudioContext,
    worldX?: number,
    worldZ?: number,
    maxRange = 28,
  ): AudioNode {
    const dest = this.masterGain ?? ctx.destination;
    if (worldX === undefined || worldZ === undefined) {
      return dest;
    }
    const dist = Math.hypot(worldX - this.listenerX, worldZ - this.listenerZ);
    const distGain = Math.max(0.22, computeSpatialDistanceGain(dist, maxRange));
    const gain = ctx.createGain();
    gain.gain.value = distGain;
    const panner = ctx.createStereoPanner();
    panner.pan.value = computeSpatialStereoPan(
      this.listenerX,
      this.listenerZ,
      worldX,
      worldZ,
    );
    gain.connect(panner).connect(dest);
    return gain;
  }

  private jitter(base: number, spread = 0.08): number {
    return base * (1 + (Math.random() * 2 - 1) * spread);
  }

  public playAxeSwing(tier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // 1. Air cleave whoosh via sweeping bandpass noise
    const buf =
      this.windNoiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.4, 0.45);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.6;
    const startHz = this.jitter(360 + tier * 35, 0.08);
    filter.frequency.setValueAtTime(startHz, now);
    filter.frequency.exponentialRampToValueAtTime(startHz * 2.7, now + 0.09);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.0001, now);
    whooshGain.gain.linearRampToValueAtTime(0.16, now + 0.045);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.23);

    src.connect(filter).connect(whooshGain).connect(out);
    const offset = Math.random() * Math.max(0.02, buf.duration - 0.25);
    src.start(now, offset);
    src.stop(now + 0.24);

    // 2. Weighty haft sweep sub-tone + rare/epic/mythic blade resonance
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'triangle';
    sweep.frequency.setValueAtTime(this.jitter(195 + tier * 16, 0.06), now);
    sweep.frequency.exponentialRampToValueAtTime(68, now + 0.16);
    sweepGain.gain.setValueAtTime(0.09, now + 0.02);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    sweep.connect(sweepGain).connect(out);
    sweep.start(now + 0.02);
    sweep.stop(now + 0.18);

    if (tier >= 4) {
      const shimmer = ctx.createOscillator();
      const shimGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(this.jitter(720 + tier * 95, 0.05), now + 0.03);
      shimmer.frequency.exponentialRampToValueAtTime(420 + tier * 40, now + 0.2);
      shimGain.gain.setValueAtTime(0.0001, now + 0.03);
      shimGain.gain.linearRampToValueAtTime(0.045 + (tier - 4) * 0.012, now + 0.06);
      shimGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
      shimmer.connect(shimGain).connect(out);
      shimmer.start(now + 0.03);
      shimmer.stop(now + 0.22);
    }
  }

  public playChop(tier = 1, worldX?: number, worldZ?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ);

    // 1. Deep timber trunk thud scaled by axe weight
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = this.jitter(142 + tier * 12, 0.08);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.16);

    // 2. Hollow heartwood resonance knock
    const knock = ctx.createOscillator();
    const knockGain = ctx.createGain();
    knock.type = 'sine';
    const knockFreq = this.jitter(295 + tier * 18, 0.07);
    knock.frequency.setValueAtTime(knockFreq, now + 0.008);
    knock.frequency.exponentialRampToValueAtTime(165, now + 0.095);
    knockGain.gain.setValueAtTime(0.14, now + 0.008);
    knockGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.1);
    knock.connect(knockGain).connect(out);
    knock.start(now + 0.008);
    knock.stop(now + 0.11);

    // 3. Crisp bark split & wood fiber snap
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(this.jitter(590 + tier * 38, 0.1), now);
    crack.frequency.exponentialRampToValueAtTime(140, now + 0.07);
    crackGain.gain.setValueAtTime(0.12, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    crack.connect(crackGain).connect(out);
    crack.start(now);
    crack.stop(now + 0.08);

    // 4. Wood-chip scatter burst
    const buf =
      this.noiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.25, 0.5);
    const chipSrc = ctx.createBufferSource();
    chipSrc.buffer = buf;
    const chipFilter = ctx.createBiquadFilter();
    chipFilter.type = 'bandpass';
    chipFilter.frequency.value = this.jitter(1220, 0.12);
    chipFilter.Q.value = 1.8;
    const chipGain = ctx.createGain();
    chipGain.gain.setValueAtTime(0.095, now);
    chipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    chipSrc.connect(chipFilter).connect(chipGain).connect(out);
    chipSrc.start(now, Math.random() * Math.max(0.01, buf.duration - 0.08));
    chipSrc.stop(now + 0.075);
  }

  public playBowDraw(tier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // Tactile yew-limb & sinew bowstring tension creak
    const creak = ctx.createOscillator();
    const creakGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    creak.type = 'triangle';
    const f0 = this.jitter(145 + tier * 10, 0.06);
    creak.frequency.setValueAtTime(f0, now);
    creak.frequency.linearRampToValueAtTime(f0 * 1.52, now + 0.12);
    filter.type = 'bandpass';
    filter.frequency.value = 460;
    filter.Q.value = 2.0;
    creakGain.gain.setValueAtTime(0.0001, now);
    creakGain.gain.linearRampToValueAtTime(0.065, now + 0.035);
    creakGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    creak.connect(filter).connect(creakGain).connect(out);
    creak.start(now);
    creak.stop(now + 0.15);
  }

  public playTreeFall(worldX?: number, worldZ?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.34);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.37);
  }

  public playBowTwang(tier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // 1. Elastic bowstring snap + tension resonance
    const str = ctx.createOscillator();
    const strGain = ctx.createGain();
    str.type = 'triangle';
    const baseFreq = this.jitter(250 + tier * 26, 0.06);
    str.frequency.setValueAtTime(baseFreq, now);
    str.frequency.exponentialRampToValueAtTime(115 + tier * 10, now + 0.19);
    strGain.gain.setValueAtTime(0.2, now);
    strGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    str.connect(strGain).connect(out);
    str.start(now);
    str.stop(now + 0.21);

    // 2. String harmonic overtone / limb snap
    const harm = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harm.type = 'sine';
    harm.frequency.setValueAtTime(baseFreq * 2.4, now);
    harm.frequency.exponentialRampToValueAtTime(baseFreq * 1.15, now + 0.14);
    harmGain.gain.setValueAtTime(0.08 + tier * 0.012, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    harm.connect(harmGain).connect(out);
    harm.start(now);
    harm.stop(now + 0.16);

    // 3. Fletched arrow air zip
    const buf =
      this.noiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.25, 0.5);
    const zipSrc = ctx.createBufferSource();
    zipSrc.buffer = buf;
    const zipFilter = ctx.createBiquadFilter();
    zipFilter.type = 'bandpass';
    zipFilter.Q.value = 2.4;
    zipFilter.frequency.setValueAtTime(this.jitter(1650 + tier * 180, 0.08), now);
    zipFilter.frequency.exponentialRampToValueAtTime(920, now + 0.13);
    const zipGain = ctx.createGain();
    zipGain.gain.setValueAtTime(0.0001, now);
    zipGain.gain.linearRampToValueAtTime(0.11, now + 0.015);
    zipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    zipSrc.connect(zipFilter).connect(zipGain).connect(out);
    zipSrc.start(now, Math.random() * Math.max(0.01, buf.duration - 0.16));
    zipSrc.stop(now + 0.15);
  }

  public playArrowHit(heavy = false, tier = 1, worldX?: number, worldZ?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ);

    const thwack = ctx.createOscillator();
    const thwackGain = ctx.createGain();
    thwack.type = 'triangle';
    thwack.frequency.setValueAtTime(this.jitter(heavy ? 320 : 280 + tier * 16, 0.07), now);
    thwack.frequency.exponentialRampToValueAtTime(75, now + 0.11);
    thwackGain.gain.setValueAtTime(heavy ? 0.22 : 0.17, now);
    thwackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thwack.connect(thwackGain).connect(out);
    thwack.start(now);
    thwack.stop(now + 0.13);

    if (tier >= 5) {
      const crystal = ctx.createOscillator();
      const crysGain = ctx.createGain();
      crystal.type = 'sine';
      crystal.frequency.setValueAtTime(this.jitter(980 + tier * 110, 0.06), now);
      crystal.frequency.exponentialRampToValueAtTime(520, now + 0.14);
      crysGain.gain.setValueAtTime(0.06, now);
      crysGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      crystal.connect(crysGain).connect(out);
      crystal.start(now);
      crystal.stop(now + 0.16);
    }
  }

  public playHit(heavy = false, worldX?: number, worldZ?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = heavy ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(this.jitter(heavy ? 185 : 230, 0.08), now);
    osc.frequency.exponentialRampToValueAtTime(55, now + (heavy ? 0.16 : 0.1));

    gain.gain.setValueAtTime(heavy ? 0.22 : 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.11));

    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.18);

    // Impact crunch noise for meatier melee cleave hit
    const buf =
      this.noiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.25, 0.5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = heavy ? 1150 : 900;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(heavy ? 0.11 : 0.07, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    src.connect(filter).connect(nGain).connect(out);
    src.start(now, Math.random() * Math.max(0.01, buf.duration - 0.11));
    src.stop(now + 0.1);
  }

  public playPickup(kind: 'wood' | 'stone' | 'ice' | 'pelt' | 'meat' | 'gold'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'gold' || kind === 'ice' ? 'sine' : 'triangle';

    const base =
      kind === 'ice'
        ? 1040
        : kind === 'gold'
          ? 880
          : kind === 'stone'
            ? 620
            : kind === 'pelt'
              ? 520
              : kind === 'meat'
                ? 460
                : 390;
    const f1 = this.jitter(base, 0.06);
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f1 * 1.45, now + 0.09);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playFootstep(creeping = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    const buf =
      this.noiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.25, 0.45);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = this.jitter(creeping ? 620 : 920, 0.12);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    const peak = creeping ? 0.018 : 0.036;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (creeping ? 0.075 : 0.095));

    src.connect(filter).connect(gain).connect(out);
    const offset = Math.random() * Math.max(0.02, buf.duration - 0.12);
    src.start(now, offset);
    src.stop(now + 0.11);
  }

  public playAnimalWindup(
    kind: AnimalKind,
    worldX?: number,
    worldZ?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 34);
    const prof = getSpeciesAttackSoundProfile(kind);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = prof.wave;
    osc.frequency.setValueAtTime(this.jitter(prof.windupStartHz, 0.06), now);
    osc.frequency.linearRampToValueAtTime(prof.windupPeakHz, now + prof.windupDuration * 0.55);
    osc.frequency.exponentialRampToValueAtTime(prof.windupEndHz, now + prof.windupDuration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(prof.windupGain, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + prof.windupDuration + 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = prof.filterHz;

    osc.connect(filter).connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + prof.windupDuration + 0.04);

    if (kind === 'aurora_fenrir' || kind === 'mammoth') {
      const harmonic = ctx.createOscillator();
      const hGain = ctx.createGain();
      harmonic.type = kind === 'aurora_fenrir' ? 'sine' : 'sawtooth';
      harmonic.frequency.setValueAtTime(prof.windupPeakHz * 1.95, now);
      harmonic.frequency.exponentialRampToValueAtTime(
        prof.windupEndHz * 1.6,
        now + prof.windupDuration,
      );
      hGain.gain.setValueAtTime(0.001, now);
      hGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + prof.windupDuration);
      harmonic.connect(hGain).connect(out);
      harmonic.start(now);
      harmonic.stop(now + prof.windupDuration + 0.02);
    }
  }

  public playAnimalAttack(
    kind: AnimalKind,
    worldX?: number,
    worldZ?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 34);
    const prof = getSpeciesAttackSoundProfile(kind);

    // 1. Predator vocal burst (snap, hiss, roar, or trumpet)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = prof.wave;
    osc.frequency.setValueAtTime(this.jitter(prof.attackStartHz, 0.07), now);
    osc.frequency.exponentialRampToValueAtTime(prof.attackEndHz, now + prof.attackDuration);

    gain.gain.setValueAtTime(prof.attackGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + prof.attackDuration + 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = prof.filterHz * 1.35;

    osc.connect(filter).connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + prof.attackDuration + 0.04);

    // 2. Bite/claw/stomp noise transient
    const buf =
      this.noiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 0.25, 0.5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = kind === 'mammoth' || kind === 'polar_bear' ? 'lowpass' : 'bandpass';
    nFilter.frequency.value = prof.biteNoiseHz;
    nFilter.Q.value = 1.4;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(prof.attackGain * 0.72, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.connect(nFilter).connect(nGain).connect(out);
    src.start(now, Math.random() * Math.max(0.01, buf.duration - 0.16));
    src.stop(now + 0.15);
  }

  public playWolfTelegraph(worldX?: number, worldZ?: number): void {
    this.playAnimalWindup('wolf', worldX, worldZ);
  }

  public playHurt(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playUpgrade(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const t = now + i * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playLevelUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const t = now + i * 0.068;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(i === notes.length - 1 ? 0.16 : 0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + (i === notes.length - 1 ? 0.55 : 0.28));
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.56);
    });
  }

  public playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [311.13, 277.18, 233.08, 174.61];
    notes.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  public playWeatherShift(isBlizzard: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // Gentle filtered air swell instead of an abrupt synth tone
    const swellBuffer =
      this.windNoiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 2.0, 0.36);
    const src = ctx.createBufferSource();
    src.buffer = swellBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(isBlizzard ? 260 : 520, now);
    filter.frequency.exponentialRampToValueAtTime(isBlizzard ? 480 : 340, now + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isBlizzard ? 0.055 : 0.032, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);

    src.connect(filter).connect(gain).connect(out);
    const offset = Math.random() * Math.max(0.1, swellBuffer.duration - 1.8);
    src.start(now, offset);
    src.stop(now + 1.7);
  }

  public playFestivalStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.095;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.65);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.68);
    });
  }

  public playPortalWarp(toLevel2: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // Resonant arcane crystalline arpeggio
    const notes = toLevel2
      ? [329.63, 493.88, 659.25, 987.77]
      : [659.25, 493.88, 392.0, 293.66];
    notes.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(
        freq * (toLevel2 ? 1.12 : 0.92),
        t + 0.42,
      );
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.48);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.5);
    });

    // Filtered wind/ether sweep
    const sweepBuf =
      this.windNoiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 1.2, 0.35);
    const src = ctx.createBufferSource();
    src.buffer = sweepBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.6;
    filter.frequency.setValueAtTime(toLevel2 ? 280 : 950, now);
    filter.frequency.exponentialRampToValueAtTime(toLevel2 ? 1150 : 320, now + 0.52);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0004, now + 0.55);
    src.connect(filter).connect(gain).connect(out);
    src.start(now, 0);
    src.stop(now + 0.58);
  }

  public playHuntersSightPulse(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // Resonant arctic harmonic pulse (layered fifths & crystal octave)
    const freqs = [293.66, 440, 587.33, 880, 1174.66];
    freqs.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, t + 0.52);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.13 : 0.085, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0004, t + 0.62);

      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.65);
    });

    // Subtle filtered wind-sweep breath underneath
    const sweepBuf =
      this.windNoiseSource?.buffer ?? createSeamlessWarmNoiseBuffer(ctx, 1.0, 0.34);
    const src = ctx.createBufferSource();
    src.buffer = sweepBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.1;
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(1250, now + 0.48);
    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0.0001, now);
    sweepGain.gain.linearRampToValueAtTime(0.07, now + 0.07);
    sweepGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.54);
    src.connect(filter).connect(sweepGain).connect(out);
    src.start(now, 0);
    src.stop(now + 0.56);
  }

  public playTrackInspect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    const notes = [523.25, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0004, t + 0.25);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playAnvilCraft(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    // 1. Forging hammer on iron anvil ring (metallic clang + overtone chime)
    const freqs = [620, 1245, 1890];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(this.jitter(freq, 0.04), now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 0.32);
      gain.gain.setValueAtTime(idx === 0 ? 0.18 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + (0.28 - idx * 0.04));
      osc.connect(gain).connect(out);
      osc.start(now);
      osc.stop(now + 0.34);
    });

    // 2. Crisp clockwork gear ratchet clicks
    [0.09, 0.145].forEach((offset, i) => {
      const tick = ctx.createOscillator();
      const tGain = ctx.createGain();
      tick.type = 'square';
      tick.frequency.setValueAtTime(i === 0 ? 940 : 1180, now + offset);
      tick.frequency.exponentialRampToValueAtTime(420, now + offset + 0.035);
      tGain.gain.setValueAtTime(0.055, now + offset);
      tGain.gain.exponentialRampToValueAtTime(0.0005, now + offset + 0.04);
      tick.connect(tGain).connect(out);
      tick.start(now + offset);
      tick.stop(now + offset + 0.045);
    });
  }

  public playTrapDeploy(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;

    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(340, now);
    click.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    cGain.gain.setValueAtTime(0.14, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    click.connect(cGain).connect(out);
    click.start(now);
    click.stop(now + 0.13);
  }

  public playTrapSnap(heavy = true, worldX?: number, worldZ?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 36);

    const jaw = ctx.createOscillator();
    const jGain = ctx.createGain();
    jaw.type = heavy ? 'sawtooth' : 'triangle';
    jaw.frequency.setValueAtTime(heavy ? 480 : 620, now);
    jaw.frequency.exponentialRampToValueAtTime(heavy ? 78 : 135, now + 0.18);
    jGain.gain.setValueAtTime(heavy ? 0.24 : 0.17, now);
    jGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    jaw.connect(jGain).connect(out);
    jaw.start(now);
    jaw.stop(now + 0.22);

    const ring = ctx.createOscillator();
    const rGain = ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(heavy ? 1120 : 880, now);
    ring.frequency.exponentialRampToValueAtTime(640, now + 0.24);
    rGain.gain.setValueAtTime(0.09, now);
    rGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.26);
    ring.connect(rGain).connect(out);
    ring.start(now);
    ring.stop(now + 0.28);
  }

  public playBossTelegraph(
    bossId: ZoneBossId,
    enraged: boolean,
    worldX?: number,
    worldZ?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 52);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const startHz =
      bossId === 'veyra_sovereign'
        ? enraged
          ? 280
          : 220
        : bossId === 'ignis_warden'
          ? enraged
            ? 145
            : 112
          : enraged
            ? 110
            : 88;
    const endHz = startHz * (enraged ? 2.15 : 1.75);

    osc.type = bossId === 'veyra_sovereign' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(startHz, now);
    osc.frequency.exponentialRampToValueAtTime(endHz, now + 0.42);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(enraged ? 0.22 : 0.16, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

    osc.connect(filter).connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playBossImpact(
    bossId: ZoneBossId,
    heavy: boolean,
    worldX?: number,
    worldZ?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.createOutputNode(ctx, worldX, worldZ, 54);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(
      bossId === 'veyra_sovereign' ? 185 : heavy ? 115 : 140,
      now,
    );
    sub.frequency.exponentialRampToValueAtTime(36, now + (heavy ? 0.36 : 0.24));
    subGain.gain.setValueAtTime(heavy ? 0.28 : 0.19, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.38 : 0.26));
    sub.connect(subGain).connect(out);
    sub.start(now);
    sub.stop(now + 0.4);

    if (bossId === 'veyra_sovereign' || heavy) {
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = bossId === 'veyra_sovereign' ? 'triangle' : 'sawtooth';
      shimmer.frequency.setValueAtTime(
        bossId === 'veyra_sovereign' ? 760 : 290,
        now,
      );
      shimmer.frequency.exponentialRampToValueAtTime(140, now + 0.26);
      sGain.gain.setValueAtTime(0.12, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      shimmer.connect(sGain).connect(out);
      shimmer.start(now);
      shimmer.stop(now + 0.3);
    }
  }

  public playBossVictoryFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.masterGain ?? ctx.destination;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.095;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.44);
    });
  }

  public dispose(): void {
    for (const source of [this.noiseSource, this.windNoiseSource]) {
      try {
        source?.stop();
        source?.disconnect();
      } catch {
        // ignore if already stopped
      }
    }
    this.noiseSource = null;
    this.windNoiseSource = null;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
