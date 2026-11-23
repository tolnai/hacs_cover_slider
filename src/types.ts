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

export const hasAction = (config?: ActionConfig): boolean => config !== undefined && config.action !== 'none';
