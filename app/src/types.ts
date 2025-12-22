// Re-export API types
export type { Project, Effect, EffectInput, CreateProjectInput } from './api';

// Frontend-specific types
export interface Timeframe {
  start: number;
  end: number;
}

// Convert Effect to Timeframe
export function effectToTimeframe(effect: { start_time: number; end_time: number }): Timeframe {
  return {
    start: effect.start_time,
    end: effect.end_time,
  };
}

// Convert Timeframe to EffectInput
export function timeframeToEffectInput(timeframe: Timeframe, type: string = 'segmentation'): { type: string; start_time: number; end_time: number } {
  return {
    type,
    start_time: timeframe.start,
    end_time: timeframe.end,
  };
}
