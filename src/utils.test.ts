import { describe, expect, it } from 'vitest';
import type { HassEntity } from 'home-assistant-js-websocket';
import { estimateHeight, hasAction, logicalPosition, physicalPosition, supportsSetPosition } from './utils';
import type { CoverConfig } from './types';

const cover = (state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: 'cover.test', state, attributes }) as unknown as HassEntity;

describe('logicalPosition', () => {
  it('uses current_position', () => {
    expect(logicalPosition(cover('open', { current_position: 42.4 }))).toBe(42);
  });
  it('inverts the position', () => {
    expect(logicalPosition(cover('open', { current_position: 30 }), true)).toBe(70);
  });
  it('treats closed as 0, even with a stale position', () => {
    expect(logicalPosition(cover('closed', { current_position: 10 }))).toBe(0);
    expect(logicalPosition(cover('closed'), true)).toBe(100);
  });
  it('derives the position from the state when there is no current_position', () => {
    expect(logicalPosition(cover('open'))).toBe(100);
    expect(logicalPosition(cover('unavailable'))).toBe(100);
  });
});

describe('physicalPosition', () => {
  it('is the inverse of the invert mapping', () => {
    expect(physicalPosition(30)).toBe(30);
    expect(physicalPosition(30, true)).toBe(70);
  });
});

describe('supportsSetPosition', () => {
  it('checks the SET_POSITION feature bit', () => {
    expect(supportsSetPosition(cover('open', { supported_features: 15 }))).toBe(true);
    expect(supportsSetPosition(cover('open', { supported_features: 3 }))).toBe(false);
    expect(supportsSetPosition(cover('open'))).toBe(false);
  });
});

describe('hasAction', () => {
  it('is false for missing and none actions', () => {
    expect(hasAction(undefined)).toBe(false);
    expect(hasAction({ action: 'none' })).toBe(false);
    expect(hasAction({ action: 'more-info' })).toBe(true);
  });
});

describe('estimateHeight', () => {
  const entities = [{ entity: 'cover.a' }, { entity: 'cover.b' }];

  it('vertical: name + 3 buttons + slider by default', () => {
    expect(estimateHeight({ entities })).toBe(12 + 28 + 3 * 48 + 200);
  });
  it('vertical: honours layout, sizes and hidden names', () => {
    const config: CoverConfig = { entities, layout: 'minimal', hideNames: true, sliderHeight: 100 };
    expect(estimateHeight(config)).toBe(12 + 100);
  });
  it('horizontal: one row per entity', () => {
    expect(estimateHeight({ entities, direction: 'horizontal' })).toBe(12 + 2 * (48 + 8));
    expect(estimateHeight({ entities, direction: 'horizontal', sliderWidth: 60 })).toBe(12 + 2 * (60 + 8));
  });
  it('falls back to defaults for too small sizes', () => {
    expect(estimateHeight({ entities, sliderHeight: 5 })).toBe(estimateHeight({ entities }));
  });
});
