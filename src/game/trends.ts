import type {
  ResourceCounts,
  ResourceTrendDeltaMap,
  ResourceTrendDirection,
  ResourceTrendMap,
  TrendResourceKey,
} from './types';

export const TREND_RESOURCE_KEYS: TrendResourceKey[] = [
  'wood',
  'stone',
  'ice',
  'meat',
  'pelts',
  'gold',
];

export const TREND_WINDOW_SECONDS = 10;
export const TREND_SAMPLE_INTERVAL_SECONDS = 0.25;
export const TREND_DELTA_THRESHOLD = 0.2;
export const TREND_PASSIVE_RATE_THRESHOLD = 0.05;

export const INITIAL_RESOURCE_TRENDS: ResourceTrendMap = {
  wood: 'flat',
  stone: 'flat',
  ice: 'flat',
  meat: 'flat',
  pelts: 'flat',
  gold: 'flat',
};

export const INITIAL_RESOURCE_TREND_DELTAS: ResourceTrendDeltaMap = {
  wood: 0,
  stone: 0,
  ice: 0,
  meat: 0,
  pelts: 0,
  gold: 0,
};

interface ResourceTrendSample {
  time: number;
  values: Record<TrendResourceKey, number>;
}

export interface PassiveTrendRates {
  wood?: number;
  gold?: number;
}

function extractValues(resources: ResourceCounts): Record<TrendResourceKey, number> {
  return {
    wood: resources.wood,
    stone: resources.stone ?? 0,
    ice: resources.ice ?? 0,
    meat: resources.meat ?? 0,
    pelts: resources.pelts,
    gold: resources.gold,
  };
}

export class ResourceTrendTracker {
  private readonly windowSeconds: number;
  private readonly sampleIntervalSeconds: number;
  private samples: ResourceTrendSample[] = [];

  constructor(
    windowSeconds = TREND_WINDOW_SECONDS,
    sampleIntervalSeconds = TREND_SAMPLE_INTERVAL_SECONDS,
  ) {
    this.windowSeconds = windowSeconds;
    this.sampleIntervalSeconds = sampleIntervalSeconds;
  }

  public reset(resources: ResourceCounts, time = 0): void {
    this.samples = [
      {
        time,
        values: extractValues(resources),
      },
    ];
  }

  public update(
    time: number,
    resources: ResourceCounts,
    passiveRates: PassiveTrendRates = {},
  ): {
    trends: ResourceTrendMap;
    deltas: ResourceTrendDeltaMap;
  } {
    const current = extractValues(resources);

    if (
      this.samples.length === 0 ||
      time < this.samples[this.samples.length - 1].time
    ) {
      this.samples = [{ time, values: current }];
    } else {
      const last = this.samples[this.samples.length - 1];
      if (time - last.time >= this.sampleIntervalSeconds) {
        this.samples.push({ time, values: current });
      }
      while (
        this.samples.length > 1 &&
        time - this.samples[1].time > this.windowSeconds
      ) {
        this.samples.shift();
      }
    }

    const baseline = this.samples[0].values;
    const trends: ResourceTrendMap = { ...INITIAL_RESOURCE_TRENDS };
    const deltas: ResourceTrendDeltaMap = { ...INITIAL_RESOURCE_TREND_DELTAS };

    for (const key of TREND_RESOURCE_KEYS) {
      const net = current[key] - baseline[key];
      const rounded = Math.round(net * 10) / 10;
      deltas[key] = Object.is(rounded, -0) ? 0 : rounded;

      let dir: ResourceTrendDirection = 'flat';
      if (net > TREND_DELTA_THRESHOLD) {
        dir = 'up';
      } else if (net < -TREND_DELTA_THRESHOLD) {
        dir = 'down';
      } else {
        const passive =
          key === 'wood'
            ? (passiveRates.wood ?? 0)
            : key === 'gold'
              ? (passiveRates.gold ?? 0)
              : 0;
        if (passive >= TREND_PASSIVE_RATE_THRESHOLD) {
          dir = 'up';
        }
      }
      trends[key] = dir;
    }

    return { trends, deltas };
  }
}
