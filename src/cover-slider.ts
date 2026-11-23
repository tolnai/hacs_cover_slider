/*
 * Author        : Gábor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 */
import { LitElement, html, nothing, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HassEntity } from 'home-assistant-js-websocket';

import styles from './styles';
import { actionHandler } from './ha-action-handler-directive';
import type { HomeAssistant, ActionHandlerEvent, CoverConfig, ElementConfig } from './types';
import {
  estimateHeight,
  hasAction,
  logicalPosition,
  physicalPosition,
  sliderHeight,
  sliderWidth,
  supportsSetPosition,
} from './utils';
import { DEV, CARD_TAG, EDITOR_TAG } from './const';
import './editor';
import { version } from '../package.json';

// eslint-disable-next-line no-console
console.info(
  `%c Cover Slider Card${DEV ? ' DEV' : ''} \n%c Version v${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts the card into the UI card picker dialog
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: CARD_TAG,
  name: `Cover Slider${DEV ? ' DEV' : ''}`,
  preview: false,
  description: 'A card showing sliders for cover entities',
  documentationURL: 'https://github.com/tolnai/hacs_cover_slider',
});

type MoveDirection = 'up' | 'down';

@customElement(CARD_TAG)
export class CoverSliderCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: CoverConfig;
  @state() private error?: TemplateResult;

  // Slider value set by the user. Shown instead of the entity state while dragging (active),
  // and after release until the next state update arrives (stamp = last_updated at release).
  private sliderVal: Record<string, { val: number; active: boolean; stamp?: string }> = {};

  static styles: CSSResultGroup = styles;

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return { entities: [] };
  }

  public setConfig(config?: CoverConfig) {
    this.error = undefined;
    if (!config) {
      throw this.createError('Invalid configuration.');
    }
    if (!Array.isArray(config.entities)) {
      throw this.createError('You need to define entities.');
    }
    config.entities.forEach((entity, i) => {
      if (typeof entity?.entity !== 'string') {
        throw this.createError(`Entity ${i + 1} is invalid! Must be an object, having an entity key.`);
      }
    });
    this.config = config;
  }

  public getCardSize() {
    return Math.ceil(estimateHeight(this.config) / 50);
  }

  // Sections view: 12 columns, one row is 56px + 8px gap.
  public getGridOptions() {
    return { columns: 12, rows: Math.ceil((estimateHeight(this.config) + 8) / 64) };
  }

  private createError(message: string): Error {
    const error = new Error(message);
    const errorCard = document.createElement('hui-error-card') as HTMLElement & {
      setConfig?: (config: Record<string, unknown>) => void;
    };
    errorCard.setConfig?.({ type: 'error', error, origConfig: this.config });
    this.error = html`${errorCard}`;
    return error;
  }

  private _handleAction(ev: ActionHandlerEvent, ent: ElementConfig): void {
    ev.preventDefault();
    ev.stopPropagation();
    // Let Home Assistant execute the action: supports every action type (perform-action, confirmation, ...).
    this.dispatchEvent(
      new CustomEvent('hass-action', {
        bubbles: true,
        composed: true,
        detail: {
          config: {
            entity: ent.entity,
            tap_action: ent.tap_action ?? this.config.tap_action ?? { action: 'more-info' },
            hold_action: ent.hold_action ?? this.config.hold_action,
            double_tap_action: ent.double_tap_action ?? this.config.double_tap_action,
          },
          action: ev.detail.action,
        },
      }),
    );
  }

  private _callCover(service: string, data: Record<string, unknown>) {
    void this.hass.callService('cover', service, data);
  }

  private _sliderInput(entityId: string, value: number) {
    this.sliderVal[entityId] = { val: value, active: true };
    this.requestUpdate();
  }

  private _sliderChange(ent: ElementConfig, stateObj: HassEntity, value: number) {
    this.sliderVal[stateObj.entity_id] = { val: value, active: false, stamp: stateObj.last_updated };
    const position = physicalPosition(value, ent.invert);
    if (stateObj.attributes.current_position === position) {
      return;
    }
    this._callCover('set_cover_position', { entity_id: stateObj.entity_id, position });
  }

  // Up/down movement in slider terms; `invert` swaps the physical direction.
  private _movement(ent: ElementConfig, stateObj: HassEntity, direction: MoveDirection) {
    const towardsOpen = (direction === 'up') !== !!ent.invert;
    const ongoing = stateObj.state === (towardsOpen ? 'opening' : 'closing');
    return { ongoing, service: ongoing ? 'stop_cover' : towardsOpen ? 'open_cover' : 'close_cover' };
  }

  private _renderButton(label: string, icon: string, onClick: () => void, disabled = false) {
    return html`
      <div class="toggle">
        <ha-icon-button label=${label} @click=${onClick} ?disabled=${disabled}>
          <ha-icon icon=${icon}></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  private _renderMoveButton(ent: ElementConfig, stateObj: HassEntity, direction: MoveDirection) {
    const layout = this.config.layout || 'full';
    if (layout !== 'full' && layout !== 'compact' && layout !== 'compact-smart') {
      return nothing;
    }
    const up = direction === 'up';
    const icon =
      (up ? ent.upIcon || this.config.upIcon : ent.downIcon || this.config.downIcon) || `mdi:arrow-${direction}`;
    const label =
      (up ? ent.upLabel || this.config.upLabel : ent.downLabel || this.config.downLabel) || (up ? 'Up' : 'Down');
    const { ongoing, service } = this._movement(ent, stateObj, direction);
    const onClick = () => this._callCover(service, { entity_id: stateObj.entity_id });

    if (layout === 'full') {
      return this._renderButton(label, icon, onClick);
    }
    // compact: the button turns into stop during movement; compact-smart also disables it at the end position.
    const atEnd = logicalPosition(stateObj, ent.invert) === (up ? 100 : 0);
    return this._renderButton(
      ongoing ? 'Stop' : label,
      ongoing ? 'mdi:stop' : icon,
      onClick,
      layout === 'compact-smart' && atEnd,
    );
  }

  private _renderStopButton(stateObj: HassEntity) {
    const layout = this.config.layout || 'full';
    if (layout !== 'full' && layout !== 'stop') {
      return nothing;
    }
    return this._renderButton('Stop', 'mdi:stop', () =>
      this._callCover('stop_cover', { entity_id: stateObj.entity_id }),
    );
  }

  private _renderName(ent: ElementConfig, stateObj: HassEntity) {
    if (this.config.hideNames) {
      return nothing;
    }
    const titleSize = `${this.config.titleSize || 14}px`;
    const percentageSize = `${this.config.percentageSize || 10}px`;
    const percentagePosition =
      this.config.percentagePosition ?? (this.config.direction === 'vertical' ? 'under' : 'besides');
    const position = html`
      ${percentagePosition === 'under' ? html`<br />` : nothing}
      <span class="cover-percentage" style="--percentage-fontSize:${percentageSize};">
        ${logicalPosition(stateObj, ent.invert)}%
      </span>
    `;
    return html`
      <p
        class="cover-name"
        style="--cover-fontSize:${titleSize};"
        @action=${(e: ActionHandlerEvent) => this._handleAction(e, ent)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(ent.hold_action ?? this.config.hold_action),
          hasDoubleClick: hasAction(ent.double_tap_action ?? this.config.double_tap_action),
        })}
      >
        ${ent.name || stateObj.attributes.friendly_name || ent.entity}
        ${this.config.showPercentage ? position : nothing}
      </p>
    `;
  }

  private _renderSlider(ent: ElementConfig, stateObj: HassEntity) {
    const openColor = ent.openColor || this.config.openColor || 'hsl(0, 0%, 90%, 0.6)';
    const closedColor = ent.closedColor || this.config.closedColor || 'hsl(0, 0%, 20%)';
    const step = ent.step || this.config.step || 5;
    const disabled = !supportsSetPosition(stateObj) || (ent.disableSlider ?? this.config.disableSlider ?? false);

    const userValue = this.sliderVal[stateObj.entity_id];
    const value =
      userValue && (userValue.active || userValue.stamp === stateObj.last_updated)
        ? userValue.val
        : logicalPosition(stateObj, ent.invert);
    const sizes = `--slider-width:${sliderWidth(this.config)}px;--slider-height:${sliderHeight(this.config)}px;`;

    return html`
      <div class="range-holder${disabled ? ' no-drag' : ''}" style="${sizes}--closed-color:${closedColor};">
        <input
          type="range"
          class=${stateObj.state}
          step=${step}
          min="0"
          max="100"
          style="${sizes}--closed-color:${closedColor};--open-color:${openColor};"
          .value=${String(value)}
          @input=${(e: Event) => this._sliderInput(stateObj.entity_id, (e.target as HTMLInputElement).valueAsNumber)}
          @change=${(e: Event) => this._sliderChange(ent, stateObj, (e.target as HTMLInputElement).valueAsNumber)}
        />
      </div>
    `;
  }

  private _renderCover(ent: ElementConfig) {
    // Entity not (yet) available: render it as unavailable with the same layout, so the card size does not change.
    const stateObj: HassEntity =
      this.hass.states[ent.entity] ??
      ({ entity_id: ent.entity, state: 'unavailable', attributes: {} } as unknown as HassEntity);
    return html`
      <div class="cover">
        <div class="cover-slider">
          ${this._renderName(ent, stateObj)} ${this._renderMoveButton(ent, stateObj, 'up')}
          ${this._renderSlider(ent, stateObj)} ${this._renderMoveButton(ent, stateObj, 'down')}
          ${this._renderStopButton(stateObj)}
        </div>
      </div>
    `;
  }

  protected render(): TemplateResult {
    if (this.error) {
      return this.error;
    }
    const direction = this.config.direction || 'vertical';
    return html`
      <ha-card>
        <div class="main direction-${direction}">
          ${this.config.entities.length === 0 ? 'You need to define entities' : nothing}
          ${this.config.entities.map((ent) => this._renderCover(ent))}
        </div>
      </ha-card>
    `;
  }
}
