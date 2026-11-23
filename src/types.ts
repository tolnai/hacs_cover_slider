import type { HassEntities } from 'home-assistant-js-websocket';

// Minimal subset of Home Assistant frontend types used by this card.
// (Replaces the unmaintained custom-card-helpers package.)

export interface HomeAssistant {
  states: HassEntities;
  callService(domain: string, service: string, serviceData?: Record<string, unknown>): Promise<unknown>;
}

export interface ActionConfig {
  action: string;
  [key: string]: unknown;
}

export type ActionHandlerEvent = CustomEvent<{ action: 'tap' | 'hold' | 'double_tap' }>;

export type Layout = 'full' | 'compact' | 'compact-smart' | 'stop' | 'minimal';

export interface ElementConfig {
  entity: string;
  name?: string;
  invert?: boolean;
  step?: number;
  openColor?: string;
  closedColor?: string;
  upIcon?: string;
  downIcon?: string;
  upLabel?: string;
  downLabel?: string;
  disableSlider?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface CoverConfig {
  entities: ElementConfig[];
  direction?: 'vertical' | 'horizontal' | 'horizontal-invert';
  layout?: Layout;
  hideNames?: boolean;
  sliderWidth?: number;
  sliderHeight?: number;
  step?: number;
  showPercentage?: boolean;
  percentagePosition?: 'besides' | 'under';
  openColor?: string;
  closedColor?: string;
  upIcon?: string;
  downIcon?: string;
  upLabel?: string;
  downLabel?: string;
  titleSize?: number;
  percentageSize?: number;
  disableSlider?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

// Card picker registry and HA card helpers on window.
declare global {
  interface Window {
    customCards?: {
      type: string;
      name: string;
      description?: string;
      preview?: boolean;
      documentationURL?: string;
    }[];
    loadCardHelpers?: () => Promise<{
      createCardElement(config: Record<string, unknown>): Promise<HTMLElement | undefined>;
    }>;
  }
}
