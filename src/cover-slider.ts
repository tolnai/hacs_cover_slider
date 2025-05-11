/*
 * Author        : Gábor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 */
import { LitElement, html, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
  hasAction,
  type ActionHandlerEvent,
  handleAction,
  type ActionConfig,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { type HassEntity } from 'home-assistant-js-websocket';

import styles from './styles';
import editStyles from './styles-edit';
import { actionHandler } from './ha-action-handler-directive';
import { version } from '../package.json';

const DEV = false;

export type ElementConfig = {
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
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  // script?: string;
};

type CoverConfig = {
  entities: ElementConfig[];
  direction?: 'vertical' | 'horizontal' | 'horizontal-invert';
  layout: 'full' | 'compact' | 'compact-smart' | 'stop' | 'minimal';
  hideNames?: boolean;
  sliderWidth?: number;
  sliderHeight?: number;
  step?: number;
  openColor?: string;
  closedColor?: string;
  upIcon?: string;
  downIcon?: string;
  upLabel?: string;
  downLabel?: string;
  titleSize?: number;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

// Extend the Window interface to include loadCardHelpers
declare global {
  interface Window {
    loadCardHelpers?: () => Promise<any>;
  }
}

const loadHaForm = async () => {
  if (customElements.get('ha-form') && customElements.get('hui-entities-card-editor')) return;
  if (window.loadCardHelpers) {
    const helpers = await window.loadCardHelpers();
    if (!helpers) return;
    const card = await helpers.createCardElement({ type: 'entities', entities: [] });
    if (!card) return;
    card.constructor.getConfigElement();
  }
};

console.info(
  `%c Cover Slider Card${DEV ? ' DEV' : ''} \n%c Version v${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: `cover-slider-card${DEV ? '-dev' : ''}`,
  name: `Cover Slider${DEV ? ' DEV' : ''}`,
  preview: false, // Optional - defaults to false
  description: 'A card showing sliders for cover entities',
  documentationURL: 'https://github.com/tolnai/hacs_cover_slider',
});

@customElement(`cover-slider-card${DEV ? '-dev' : ''}`)
export class CoverSliderCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: CoverConfig;
  @state() private error?: TemplateResult;

  private sliderVal: Record<string, { val: number; active: boolean }> = {};

  constructor() {
    super();
  }

  static getConfigElement() {
    return document.createElement(`cover-slider-card-editor${DEV ? '-dev' : ''}`);
  }

  static getStubConfig() {
    return { entities: [] };
  }

  public setConfig(config?: CoverConfig) {
    if (!config) {
      throw this.createError('Invalid configuration.');
    }
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

  public getCardSize() {
    return 3;
  }

  /*configChanged(newConfig) {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }*/

  private handleAction(ev: ActionHandlerEvent, ent: ElementConfig): void {
    if (this.hass && this.config && ev.detail.action) {
      ev.preventDefault();
      ev.stopPropagation();
      handleAction(
        this,
        this.hass,
        ent.tap_action ? ent : this.config.tap_action ? this.config : { ...ent, tap_action: { action: 'more-info' } as ActionConfig },
        ev.detail.action,
      );
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
    if (this.hass.states[entity_id].attributes.current_position === value) {
      return;
    }
    this.hass.callService('cover', 'set_cover_position', {
      entity_id: entity_id,
      position: ent.invert ? 100 - value : value,
    });
    this.sliderVal[entity_id]['active'] = false;
    /*if (ent.script) {
      this.hass.callService('script', 'turn_on', {
        entity_id: ent.script,
      });
    }*/
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

  _openEntity(entityId: string) {
    this._fire('hass-more-info', { entityId });
  }

  _fire(type: string, detail?: any) {
    const e = new CustomEvent(type, {
      detail: detail === null || detail === undefined ? {} : detail,
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    /*const e = new Event(type, {
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    e.detail = detail === null || detail === undefined ? {} : detail;*/
    this.dispatchEvent(e);
    return e;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return styles;
  }

  _renderName(ent: ElementConfig, stateObj: HassEntity) {
    const hideNames = this.config.hideNames || false;
    const titleSize = this.config.titleSize ? `${this.config.titleSize}px` : '14px';
    if (hideNames) {
      return html``;
    }
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
        ${ent.name || stateObj.attributes.friendly_name}
      </p>
    `;
  }

  _physicalToLogicalPosition(ent: ElementConfig, stateObj: HassEntity) {
    const sliderValue =
      stateObj.state === 'closed'
        ? ent.invert
          ? 100
          : 0
        : ent.invert
        ? 100 - Math.round(stateObj.attributes.current_position)
        : Math.round(stateObj.attributes.current_position);
    return sliderValue;
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

    const sliderValue = this._physicalToLogicalPosition(ent, stateObj);
    return html`
      <div
        class="range-holder"
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
          @input="${(e) => this._sliderChange(e.target.value, stateObj.entity_id)}}"
          @change=${(e) => this._setPosition(ent, stateObj.entity_id, e.target.value)}
        />
      </div>
    `;
  }

  _renderCover(ent: ElementConfig) {
    const stateObj = this.hass.states[ent.entity];
    if (!stateObj) {
      return html``;
    }
    return html`
      <div class="cover" style="--cover-width:30;--center-slider:30;">
        <div class="cover-slider" style="">
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

const actions: string[] = ['navigate', 'url', 'perform-action', 'none'];

@customElement(`cover-slider-card-editor${DEV ? '-dev' : ''}`)
export class CoverSliderCardEditor extends LitElement {
  // @query("hui-entities-card-row-editor")
  // @query("ha-form")
  // private _cardEditorEl?: HuiCardElementEditor;

  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config!: CoverConfig;
  @state() private _selectedTab = 'entities';
  @state() private _editingEntity: { index: number; elementConfig: ElementConfig } | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    loadHaForm();
  }

  setConfig(config: CoverConfig) {
    this._config = config;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return editStyles;
  }

  _backClick(_e: Event) {
    this._editingEntity = null;
  }

  _computeLabel(e) {
    return e.label || e.name;
  }

  _valuesChanged(ev: CustomEvent) {
    this._config = ev.detail.value;
    this._publishConfig();
  }

  _entitiesChanged(ev: CustomEvent) {
    const _config = Object.assign({}, this._config);
    _config.entities = ev.detail.entities;
    this._config = _config;
    this._publishConfig();
  }

  _entityChanged(ev: CustomEvent) {
    if (!this._editingEntity) {
      return;
    }
    this._config.entities[this._editingEntity.index] = ev.detail.value;
    this._editingEntity.elementConfig = ev.detail.value;
    this._publishConfig();
  }

  _publishConfig() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _handleSwitchTab(ev: CustomEvent) {
    this._selectedTab = ev.detail.name;
  }

  _editDetails(ev: CustomEvent) {
    this._editingEntity = ev.detail.subElementConfig;
  }

  _renderEntityEditor() {
    return html`
      <div><ha-icon-button-prev @click=${(e) => this._backClick(e)} /> Back</div>
      <div class="box">
        <h3>Entity</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity?.elementConfig}
          .schema=${[
            { name: 'entity', label: 'Entity', selector: { entity: { domain: 'cover' } }, required: true },
            { name: 'name', label: 'Name', selector: { text: {} } },
            { name: 'invert', label: 'Invert position?', selector: { boolean: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Visual settings</h3>
        <p class="intro">Individual visual settings of this entity (override any default settings).</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity?.elementConfig}
          .schema=${[
            {
              name: 'step',
              label: 'Slider step size (default: 5)',
              selector: { number: {} },
            },
            { name: 'openColor', label: 'Open color', selector: { text: {} } },
            { name: 'closedColor', label: 'Closed color', selector: { text: {} } },
            {
              name: 'upIcon',
              label: `${this._config.direction === 'vertical' ? 'Up' : 'Up (left)'} button icon`,
              selector: { icon: {} },
            },
            {
              name: 'downIcon',
              label: `${this._config.direction === 'vertical' ? 'Down' : 'Down (right)'} button icon`,
              selector: { icon: {} },
            },
            {
              name: 'upLabel',
              label: `${this._config.direction === 'vertical' ? 'Up' : 'Up (left)'} button tooltip`,
              selector: { text: {} },
            },
            {
              name: 'downLabel',
              label: `${this._config.direction === 'vertical' ? 'Down' : 'Down (right)'} button tooltip`,
              selector: { text: {} },
            },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Actions (override defaults)</h3>
        <p class="intro">Individual actions of this entity (override any default actions).</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity?.elementConfig}
          .schema=${[
            { name: 'tap_action', label: 'Tap action', selector: { ui_action: { actions } } },
            { name: 'hold_action', label: 'Hold action', selector: { ui_action: { actions } } },
            { name: 'double_tap_action', label: 'Double tap action', selector: { ui_action: { actions } } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      </div>
    `;
  }

  _renderEntitiesEditor() {
    return html`
      <div class="box">
        <hui-entities-card-row-editor
          .hass=${this.hass}
          .entities=${this._config.entities}
          @entities-changed=${this._entitiesChanged}
          @edit-detail-element=${this._editDetails}
        ></hui-entities-card-row-editor>
      </div>
    `;
  }

  _renderVisualsEditor() {
    return html`
      <div class="box">
        <h3>Layout</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            {
              name: 'direction',
              label: 'Slider direction',
              selector: {
                select: {
                  options: [
                    { label: 'Horizontal (left-to-right)', value: 'horizontal' },
                    { label: 'Horizontal (right-to-left)', value: 'horizontal-invert' },
                    { label: 'Vertical', value: 'vertical' },
                  ],
                  mode: 'dropdown',
                },
              },
              required: true,
            },
            {
              name: 'layout',
              label: 'Button layout',
              selector: {
                select: {
                  options: [
                    { label: 'Full (all buttons)', value: 'full' },
                    { label: 'Compact (stop appears during movement)', value: 'compact' },
                    { label: 'Compact-smart (disable up/down in extreme positions)', value: 'compact-smart' },
                    { label: 'Stop (only Stop button)', value: 'stop' },
                    { label: 'Minimal (no buttons, only slider)', value: 'minimal' },
                  ],
                  mode: 'dropdown',
                },
              },
              required: true,
            },
            { name: 'hideNames', label: 'Hide names?', selector: { boolean: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Sizes</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: 'titleSize', label: 'Title size in px (default: 14)', selector: { number: {} } },
            { name: 'sliderWidth', label: 'Slider width in px (default: 40)', selector: { number: {} } },
            { name: 'sliderHeight', label: 'Slider length in px (default: 200)', selector: { number: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Default visual settings</h3>
        <p class="intro">These settings can be set globally here, or individually in the entity editor.</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            {
              name: 'step',
              label: 'Default slider step size (default: 5)',
              selector: { number: {} },
            },
            {
              name: 'openColor',
              label: 'Default open color',
              selector: { text: {} },
            },
            {
              name: 'closedColor',
              label: 'Default closed color',
              selector: { text: {} },
            },
            {
              name: 'upIcon',
              label: `Default ${this._config.direction === 'vertical' ? 'up' : 'up (left)'} button icon`,
              selector: { icon: {} },
            },
            {
              name: 'downIcon',
              label: `Default ${this._config.direction === 'vertical' ? 'down' : 'down (right)'} button icon`,
              selector: { icon: {} },
            },
            {
              name: 'upLabel',
              label: `Default ${this._config.direction === 'vertical' ? 'up' : 'up (left)'} button tooltip`,
              selector: { text: {} },
            },
            {
              name: 'downLabel',
              label: `Default ${this._config.direction === 'vertical' ? 'down' : 'down (right)'} button tooltip`,
              selector: { text: {} },
            },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Default actions</h3>
        <p class="intro">These settings can be set globally here, or individually in the entity editor.</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: 'tap_action', label: 'Default tap action', selector: { ui_action: { actions } } },
            { name: 'hold_action', label: 'Default hold action', selector: { ui_action: { actions } } },
            { name: 'double_tap_action', label: 'Default double tap action', selector: { ui_action: { actions } } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
    `;
  }

  _renderContent() {
    if (this._selectedTab === 'entities' && this._editingEntity !== null) {
      return this._renderEntityEditor();
    }

    if (this._selectedTab === 'entities') {
      return this._renderEntitiesEditor();
    }
    if (this._selectedTab === 'configuration') {
      return this._renderVisualsEditor();
    }
    return html``;
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="toolbar">
          <sl-tab-group @sl-tab-show=${this._handleSwitchTab}>
            <sl-tab slot="nav" panel="entities" .active=${this._selectedTab === 'entities'}>Cover Entities</sl-tab>
            <sl-tab slot="nav" panel="configuration" .active=${this._selectedTab === 'configuration'}>Configuration</sl-tab>
          </sl-tab-group>
        </div>
        <div id="editor">${this._renderContent()}</div>
      </div>
    `;
  }
}
