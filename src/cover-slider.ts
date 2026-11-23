/*
 * Author        : Gábor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 */
import { LitElement, html, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HassEntity } from 'home-assistant-js-websocket';

import styles from './styles';
import { actionHandler } from './ha-action-handler-directive';
import { type HomeAssistant, type ActionHandlerEvent, type CoverConfig, type ElementConfig, hasAction } from './types';
import { DEV, CARD_TAG, EDITOR_TAG } from './const';
import './editor';
import { version } from '../package.json';

// CoverEntityFeature.SET_POSITION
const SUPPORT_SET_POSITION = 4;

console.info(
  `%c Cover Slider Card${DEV ? ' DEV' : ''} \n%c Version v${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: CARD_TAG,
  name: `Cover Slider${DEV ? ' DEV' : ''}`,
  preview: false, // Optional - defaults to false
  description: 'A card showing sliders for cover entities',
  documentationURL: 'https://github.com/tolnai/hacs_cover_slider',
});

@customElement(CARD_TAG)
export class CoverSliderCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: CoverConfig;
  @state() private error?: TemplateResult;

  // Slider value set by the user. Shown instead of the entity state while dragging (active),
  // and after release until the next state update arrives (stamp = last_updated at release).
  private sliderVal: Record<string, { val: number; active: boolean; stamp?: string }> = {};

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return { entities: [] };
  }

  public setConfig(config?: CoverConfig) {
    if (!config) {
      throw this.createError('Invalid configuration.');
    }
    this.error = undefined;
    if (!config.entities) {
      throw this.createError('You need to define entities.');
    }
    config.entities.forEach((entity, i) => {
      if (entity.entity === undefined) {
        throw this.createError(`Entity ${i + 1} is invalid! Must be an object, having an entity key.`);
      }
    });
    this.config = config;
  }

  // Estimated card height in px, used for masonry (getCardSize) and sections (getGridOptions) layouts.
  private _estimateHeight(): number {
    const config = this.config;
    const sliderWidth = config.sliderWidth && config.sliderWidth >= 10 ? config.sliderWidth : 40;
    const sliderHeight = config.sliderHeight && config.sliderHeight >= 30 ? config.sliderHeight : 200;
    const padding = 12;
    if ((config.direction ?? 'vertical') !== 'vertical') {
      return padding + config.entities.length * (Math.max(48, sliderWidth) + 8);
    }
    const buttons = { full: 3, compact: 2, 'compact-smart': 2, stop: 1, minimal: 0 }[config.layout ?? 'full'] ?? 3;
    const name = config.hideNames ? 0 : 2 * (config.titleSize ?? 14) + (config.showPercentage ? 14 : 0);
    return padding + name + buttons * 48 + sliderHeight;
  }

  public getCardSize() {
    return Math.ceil(this._estimateHeight() / 50);
  }

  // Sections view: 12 columns, one row is 56px + 8px gap.
  public getGridOptions() {
    const rows = Math.ceil((this._estimateHeight() + 8) / 64);
    return { columns: 12, rows };
  }

  private handleAction(ev: ActionHandlerEvent, ent: ElementConfig): void {
    if (this.hass && this.config && ev.detail.action) {
      ev.preventDefault();
      ev.stopPropagation();
      // Let Home Assistant execute the action: supports every action type (perform-action, confirmation, ...).
      this._fire('hass-action', {
        config: {
          entity: ent.entity,
          tap_action: ent.tap_action ?? this.config.tap_action ?? { action: 'more-info' },
          hold_action: ent.hold_action ?? this.config.hold_action,
          double_tap_action: ent.double_tap_action ?? this.config.double_tap_action,
        },
        action: ev.detail.action,
      });
    }
  }

  private createError(errorString: string): Error {
    const error = new Error(errorString);
    const errorCard = document.createElement('hui-error-card') as any;
    (errorCard as any).setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });
    this.error = html`${errorCard}`;
    return error;
  }

  _sliderChange(value: number, entity_id: string) {
    this.sliderVal[entity_id] = { val: value, active: true };
    this.requestUpdate();
  }

  _setPosition(ent: ElementConfig, entity_id: string, value: number) {
    const stateObj = this.hass.states[entity_id];
    this.sliderVal[entity_id] = { val: value, active: false, stamp: stateObj.last_updated };
    const position = ent.invert ? 100 - value : value;
    if (stateObj.attributes.current_position === position) {
      return;
    }
    this.hass.callService('cover', 'set_cover_position', {
      entity_id: entity_id,
      position,
    });
  }

  _coverStop(state: HassEntity) {
    this.hass.callService('cover', 'stop_cover', {
      entity_id: state.entity_id,
    });
  }

  _coverOpen(ent: ElementConfig, state: HassEntity) {
    const action =
      state.state === (ent.invert ? 'closing' : 'opening') ? 'stop_cover' : ent.invert ? 'close_cover' : 'open_cover';
    this.hass.callService('cover', action, {
      entity_id: state.entity_id,
    });
  }

  _coverClose(ent: ElementConfig, state: HassEntity) {
    const action =
      state.state === (ent.invert ? 'opening' : 'closing') ? 'stop_cover' : ent.invert ? 'open_cover' : 'close_cover';
    this.hass.callService('cover', action, {
      entity_id: state.entity_id,
    });
  }

  _fire(type: string, detail?: any) {
    const e = new CustomEvent(type, {
      detail: detail === null || detail === undefined ? {} : detail,
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    this.dispatchEvent(e);
    return e;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return styles;
  }

  _renderName(ent: ElementConfig, stateObj: HassEntity) {
    if (this.config.hideNames) {
      return html``;
    }
    const titleSize = this.config.titleSize ? `${this.config.titleSize}px` : '14px';
    const percentageSize = this.config.percentageSize ? `${this.config.percentageSize}px` : '10px';
    const percentagePosition = this.config.percentagePosition ?? (this.config.direction === 'vertical' ? 'under' : 'besides');
    const position = html`
      ${percentagePosition === 'under' ? html`<br />` : ''}
      <span class="cover-percentage" style="--percentage-fontSize:${percentageSize};">
        ${this._physicalToLogicalPosition(ent, stateObj)}%
      </span>
    `;
    return html`
      <p
        class="cover-name"
        style="--cover-fontSize:${titleSize};"
        @action=${(e: ActionHandlerEvent) => {
          this.handleAction(e, ent);
        }}
        .actionHandler=${actionHandler({
          hasHold: hasAction(ent.hold_action || this.config.hold_action),
          hasDoubleClick: hasAction(ent.double_tap_action || this.config.double_tap_action),
        })}
      >
        ${ent.name || stateObj.attributes.friendly_name} ${this.config.showPercentage ? position : ''}
      </p>
    `;
  }

  _physicalToLogicalPosition(ent: ElementConfig, stateObj: HassEntity) {
    // Covers without position support have no current_position: derive it from the open/closed state.
    const current = stateObj.attributes.current_position as number | undefined;
    const physical = stateObj.state === 'closed' ? 0 : current === undefined ? 100 : Math.round(current);
    return ent.invert ? 100 - physical : physical;
  }

  _supportsSetPosition(stateObj: HassEntity) {
    return ((stateObj.attributes.supported_features ?? 0) & SUPPORT_SET_POSITION) !== 0;
  }

  _renderUpButton(ent: ElementConfig, stateObj: HassEntity) {
    const layout = this.config.layout || 'full';
    const upIcon = ent.upIcon || this.config.upIcon || 'mdi:arrow-up';
    const upLabel = ent.upLabel || this.config.upLabel || 'Up';
    const ongoing = stateObj.state === (ent.invert ? 'closing' : 'opening');

    const sliderValue = this._physicalToLogicalPosition(ent, stateObj);
    const extremeUp = sliderValue === 100;

    switch (layout) {
      case 'full':
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="${upLabel}" @click=${() => this._coverOpen(ent, stateObj)} style="display: block">
              <ha-icon icon="${upIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case 'compact':
      case 'compact-smart':
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? 'Stop' : upLabel}"
              @click=${() => (ongoing ? this._coverStop(stateObj) : this._coverOpen(ent, stateObj))}
              style="display: block"
              ?disabled="${layout === 'compact-smart' && extremeUp}"
            >
              <ha-icon icon="${ongoing ? 'mdi:stop' : upIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case 'stop':
      case 'minimal':
      default:
        return html``;
    }
  }

  _renderDownButton(ent: ElementConfig, stateObj: HassEntity) {
    const layout = this.config.layout || 'full';
    const downIcon = ent.downIcon || this.config.downIcon || 'mdi:arrow-down';
    const downLabel = ent.downLabel || this.config.downLabel || 'Down';
    const ongoing = stateObj.state === (ent.invert ? 'opening' : 'closing');

    const sliderValue = this._physicalToLogicalPosition(ent, stateObj);
    const extremeDown = sliderValue === 0;

    switch (layout) {
      case 'full':
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="${downLabel}" @click=${() => this._coverClose(ent, stateObj)} style="display: block">
              <ha-icon icon="${downIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case 'compact':
      case 'compact-smart':
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? 'Stop' : downLabel}"
              @click=${() => (ongoing ? this._coverStop(stateObj) : this._coverClose(ent, stateObj))}
              style="display: block"
              ?disabled="${layout === 'compact-smart' && extremeDown}"
            >
              <ha-icon icon="${ongoing ? 'mdi:stop' : downIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case 'stop':
      case 'minimal':
      default:
        return html``;
    }
  }

  _renderStopButton(stateObj: HassEntity) {
    const layout = this.config.layout || 'full';
    switch (layout) {
      case 'full':
      case 'stop':
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="Stop" @click=${() => this._coverStop(stateObj)} style="display: block">
              <ha-icon icon="mdi:stop"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case 'compact':
      case 'compact-smart':
      case 'minimal':
      default:
        return html``;
    }
  }

  _renderSlider(ent: ElementConfig, stateObj: HassEntity) {
    const sliderWidth =
      this.config.sliderWidth && this.config.sliderWidth >= 10 ? `${this.config.sliderWidth}px` : '40px';
    const sliderHeight =
      this.config.sliderHeight && this.config.sliderHeight >= 30 ? `${this.config.sliderHeight}px` : '200px';

    const openColor = ent.openColor || this.config.openColor || 'hsl(0, 0%, 90%, 0.6)';
    const closedColor = ent.closedColor || this.config.closedColor || 'hsl(0, 0%, 20%)';

    const step = ent.step || this.config.step || 5;

    const disableSlider =
      !this._supportsSetPosition(stateObj) || (ent.disableSlider ?? this.config.disableSlider ?? false);

    const userValue = this.sliderVal[stateObj.entity_id];
    const sliderValue =
      userValue && (userValue.active || userValue.stamp === stateObj.last_updated)
        ? userValue.val
        : this._physicalToLogicalPosition(ent, stateObj);
    return html`
      <div
        class="range-holder${disableSlider ? ' no-drag' : ''}"
        style="--slider-width:${sliderWidth};--slider-height:${sliderHeight};--closed-color:${closedColor};"
      >
        <input
          type="range"
          class="${stateObj.state}"
          step="${step}"
          min="0"
          max="100"
          style="--slider-width:${sliderWidth};--slider-height:${sliderHeight};--closed-color:${closedColor};--open-color:${openColor};"
          .value="${sliderValue}"
          @input="${(e) => this._sliderChange(Number(e.target.value), stateObj.entity_id)}"
          @change=${(e) => this._setPosition(ent, stateObj.entity_id, Number(e.target.value))}
        />
      </div>
    `;
  }

  _renderCover(ent: ElementConfig) {
    // Entity not (yet) available: render it as unavailable with the same layout, so the card size does not change.
    const stateObj: HassEntity =
      this.hass.states[ent.entity] ??
      ({ entity_id: ent.entity, state: 'unavailable', attributes: {} } as unknown as HassEntity);
    return html`
      <div class="cover">
        <div class="cover-slider">
          ${this._renderName(ent, stateObj)} ${this._renderUpButton(ent, stateObj)} ${this._renderSlider(ent, stateObj)}
          ${this._renderDownButton(ent, stateObj)} ${this._renderStopButton(stateObj)}
        </div>
      </div>
    `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    if (this.error) {
      return this.error;
    }

    const direction = this.config.direction || 'vertical';

    return html`
      <ha-card>
        <div class="main direction-${direction}">
          ${this.config.entities.length === 0 ? html` You need to define entities ` : ''}
          ${this.config.entities.map((ent) => this._renderCover(ent))}
        </div>
      </ha-card>
    `;
  }
}
