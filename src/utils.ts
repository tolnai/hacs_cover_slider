import type { HassEntity } from 'home-assistant-js-websocket';
import type { ActionConfig, CoverConfig, Layout } from './types';

// CoverEntityFeature.SET_POSITION
const SUPPORT_SET_POSITION = 4;

export const DEFAULT_SLIDER_WIDTH = 40;
export const DEFAULT_SLIDER_HEIGHT = 200;

export const hasAction = (config?: ActionConfig): boolean => config !== undefined && config.action !== 'none';

// Logical position shown on the slider (0..100). `invert` flips it relative to the physical cover position.
// Covers without position support have no current_position: it is derived from the open/closed state.
export const logicalPosition = (stateObj: HassEntity, invert = false): number => {
  const current = stateObj.attributes.current_position as number | undefined;
  const physical = stateObj.state === 'closed' ? 0 : current === undefined ? 100 : Math.round(current);
  return invert ? 100 - physical : physical;
};

export const physicalPosition = (logical: number, invert = false): number => (invert ? 100 - logical : logical);

export const supportsSetPosition = (stateObj: HassEntity): boolean =>
  ((stateObj.attributes.supported_features ?? 0) & SUPPORT_SET_POSITION) !== 0;

// Values below a sane minimum fall back to the default.
export const sliderWidth = (config: CoverConfig): number =>
  config.sliderWidth && config.sliderWidth >= 10 ? config.sliderWidth : DEFAULT_SLIDER_WIDTH;

export const sliderHeight = (config: CoverConfig): number =>
  config.sliderHeight && config.sliderHeight >= 30 ? config.sliderHeight : DEFAULT_SLIDER_HEIGHT;

const BUTTON_COUNT: Record<Layout, number> = { full: 3, compact: 2, 'compact-smart': 2, stop: 1, minimal: 0 };

// Estimated card height in px, used for masonry (getCardSize) and sections (getGridOptions) layouts.
export const estimateHeight = (config: CoverConfig): number => {
  const padding = 12;
  if ((config.direction ?? 'vertical') !== 'vertical') {
    return padding + config.entities.length * (Math.max(48, sliderWidth(config)) + 8);
  }
  const buttons = BUTTON_COUNT[config.layout ?? 'full'] ?? BUTTON_COUNT.full;
  const name = config.hideNames ? 0 : 2 * (config.titleSize || 14) + (config.showPercentage ? 14 : 0);
  return padding + name + buttons * 48 + sliderHeight(config);
};
