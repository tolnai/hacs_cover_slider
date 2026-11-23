import { LitElement, html, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import editStyles from './styles-edit';
import type { HomeAssistant, CoverConfig, ElementConfig } from './types';
import { EDITOR_TAG } from './const';

// Extend the Window interface to include loadCardHelpers
declare global {
  interface Window {
    loadCardHelpers?: () => Promise<any>;
  }
}

// ha-form and hui-entities-card-row-editor (the multi-entity list editor) are lazy-loaded by Home Assistant.
// Creating an entities card and asking for its editor forces HA to load them, so this editor can use them.
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

const actions: string[] = ['navigate', 'url', 'perform-action', 'none'];

@customElement(EDITOR_TAG)
export class CoverSliderCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config!: CoverConfig;
  @state() private _selectedTab = 'entities';
  @state() private _editingEntity: { index: number; elementConfig: ElementConfig } | null = null;

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
    this._config = { ...this._config, entities: ev.detail.entities };
    this._publishConfig();
  }

  _entityChanged(ev: CustomEvent) {
    if (!this._editingEntity) {
      return;
    }
    // Config objects from Home Assistant may be frozen: never mutate, always copy.
    const entities = [...this._config.entities];
    entities[this._editingEntity.index] = ev.detail.value;
    this._config = { ...this._config, entities };
    this._editingEntity = { ...this._editingEntity, elementConfig: ev.detail.value };
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

  _selectTab(tab: string) {
    this._selectedTab = tab;
  }

  // Own tab bar: HA's internal tab components changed twice already (sl-tab -> ha-tab-group), breaking the editor.
  _renderTab(tab: string, label: string) {
    const active = this._selectedTab === tab;
    return html`
      <button
        class="tab ${active ? 'active' : ''}"
        role="tab"
        aria-selected=${active}
        @click=${() => this._selectTab(tab)}
      >
        ${label}
      </button>
    `;
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
            {
              name: 'disableSlider',
              label: 'Disable dragging the slider (buttons only)',
              selector: { boolean: {} },
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
            { name: 'percentageSize', label: 'Percentage size in px (default: 10)', selector: { number: {} } },
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
              name: 'disableSlider',
              label: 'Disable dragging sliders (buttons only, prevents accidental moves while scrolling)',
              selector: { boolean: {} },
            },
            { name: 'showPercentage', label: 'Show percentage?', selector: { boolean: {} } },
            {
              name: 'percentagePosition',
              label: 'Percentage position',
              selector: {
                select: {
                  options: [
                    { label: 'Besides name', value: 'besides' },
                    { label: 'Under name', value: 'under' },
                  ],
                  mode: 'dropdown',
                },
              },
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
        <div class="toolbar" role="tablist">
          ${this._renderTab('entities', 'Cover Entities')} ${this._renderTab('configuration', 'Configuration')}
        </div>
        <div id="editor">${this._renderContent()}</div>
      </div>
    `;
  }
}
