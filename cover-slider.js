/*
 * Author        : Gabor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 * Date          : 2024-10-28
 */
import { LitElement, html, css } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const loadHaForm = async () => {
  if (customElements.get("ha-form") && customElements.get("hui-entities-card-editor")) return;
  if (window.loadCardHelpers) {
    const helpers = await window.loadCardHelpers();
    if (!helpers) return;
    const card = await helpers.createCardElement({ type: "entities", entities: [] });
    if (!card) return;
    card.constructor.getConfigElement();
  }
};

class CoverSliderCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  static getConfigElement() {
    return document.createElement("cover-slider-card-editor");
  }

  static getStubConfig() {
    return { entities: [] };
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities.");
    }
    config.entities.forEach((entity, i) => {
      if (entity.entity === undefined) {
        throw new Error(`Entity ${i + 1} is invalid! Must be an object, having an entity key.`);
      }
    });
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  _sliderChange(value, entity_id) {
    this.sliderVal[entity_id] = { val: value, active: true };
    this.requestUpdate();
  }

  _setPosition(ent, entity_id, value) {
    if (this.hass.states[entity_id].attributes.current_position === value) {
      return;
    }
    this.hass.callService("cover", "set_cover_position", {
      entity_id: entity_id,
      position: ent.invert ? 100 - value : value,
    });
    this.sliderVal[entity_id]["active"] = false;
    if (script) {
      this.hass.callService("script", "turn_on", {
        entity_id: ent.script,
      });
    }
  }

  _coverStop(state) {
    console.log(state);
    this.hass.callService("cover", "stop_cover", {
      entity_id: state.entity_id,
    });
  }

  _coverOpen(ent, state) {
    const action =
      state.state === (ent.invert ? "closing" : "opening") ? "stop_cover" : ent.invert ? "close_cover" : "open_cover";
    this.hass.callService("cover", action, {
      entity_id: state.entity_id,
    });
  }

  _coverClose(ent, state) {
    const action =
      state.state === (ent.invert ? "opening" : "closing") ? "stop_cover" : ent.invert ? "open_cover" : "close_cover";
    this.hass.callService("cover", action, {
      entity_id: state.entity_id,
    });
  }

  _openEntity(entityId) {
    console.log(entityId);
    this._fire("hass-more-info", { entityId });
  }

  _fire(type, detail) {
    const e = new Event(type, {
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    e.detail = detail === null || detail === undefined ? {} : detail;
    this.dispatchEvent(e);
    return e;
  }

  static get styles() {
    return css`
      :host([is-panel]) ha-card {
        left: 50;
        top: 0;
        width: 100%;
        height: 100%;
        position: absolute;
      }
      ha-card {
        overflow: hidden;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
      }
      .page {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        padding: 16px;
      }
      .page > .main {
        width: 100%;
        overflow-x: scroll;
        padding-bottom: 0px;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
      .page > .main::-webkit-scrollbar {
        display: none;
      }
      .page > .main > .inner-main {
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 100%;
        margin: auto;
        padding-right: 0px;
        width: 100%;
        justify-content: space-around;
      }
      .page > .main > .inner-main > .cover {
        width: var(--cover-width);
        display: inline-block;
        margin: var(--center-slider);
        padding-bottom: 0px;
        flex: 1 1 0px;
      }

      .cover .icon {
        margin: 0 auto;
        text-align: center;
        display: block;
        height: 50px;
        width: 50px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 30px;
        padding-top: 5px;
      }
      .cover .icon ha-icon {
        width: 30px;
        height: 30px;
        text-align: center;
      }
      .cover .icon.on ha-icon {
        fill: #f7d959;
      }
      .cover-name {
        display: var(--show-name);
        font-weight: 300;
        margin-top: calc(var(--cover-fontSize) / 3);
        margin-bottom: calc(var(--cover-fontSize) / 2);
        text-align: center;
        font-size: var(--cover-fontSize);
      }
      .range-holder {
        height: var(--slider-height);
        position: relative;
        display: block;
      }
      .range-holder input[type="range"] {
        outline: 0;
        border: 0;
        border-radius: 4px;
        width: var(--slider-height);
        margin: 0;
        transition: box-shadow 0.2s ease-in-out;
        -webkit-transform: rotate(270deg);
        -moz-transform: rotate(270deg);
        -o-transform: rotate(270deg);
        -ms-transform: rotate(270deg);
        transform: rotate(270deg);
        overflow: hidden;
        height: var(--slider-width);
        -webkit-appearance: none;
        background-color: var(--closed-color);
        position: absolute;
        top: calc(50% - (var(--slider-width) / 2));
        right: calc(50% - (var(--slider-height) / 2));
      }
      .range-holder input[type="range"]::-webkit-slider-runnable-track {
        height: var(--slider-width);
        -webkit-appearance: none;
        color: var(--open-color);
        margin-top: 0px;
        transition: box-shadow 0.2s ease-in-out;
      }
      .range-holder input[type="range"]::-webkit-slider-thumb {
        width: calc((var(--slider-width) / 5) + 2px);
        border-right: 4px solid var(--closed-color);
        border-left: 4px solid var(--closed-color);
        border-top: 10px solid var(--closed-color);
        border-bottom: 10px solid var(--closed-color);
        -webkit-appearance: none;
        height: var(--slider-width);
        cursor: ew-resize;
        background: var(--closed-color);
        box-shadow: -350px 0 0 350px var(--open-color), inset 0 0 0 80px var(--open-color);
        border-radius: 0;
        transition: box-shadow 0.2s ease-in-out;
        position: relative;
        top: 0;
      }
      .toggle {
        display: var(--show-switch);
        align-items: center;
        justify-content: center;
      }
      .toggle > input.toggle-btn {
        display: none;
      }
    `;
  }

  _renderName(ent, stateObj) {
    const hideNames = this.config.hideNames ? this.config.hideNames : false;
    const titleSize = this.config.titleSize ? `${this.config.titleSize}px` : "14px";
    return html`
      <p
        class="cover-name"
        style="display: ${hideNames ? "none" : "block"};--cover-fontSize: ${titleSize};"
        @click=${(e) => this._openEntity(stateObj.entity_id)}
      >
        ${ent.name || stateObj.attributes.friendly_name}
      </p>
    `;
  }

  _renderUpButton(ent, stateObj) {
    const layout = this.config.layout ? this.config.layout : "full";
    const ongoing = stateObj.state === (ent.invert ? "closing" : "opening");
    switch (layout) {
      case "full":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="Up" @click=${() => this._coverOpen(ent, stateObj)} style="display: block">
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "compact":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? "Stop" : "Up"}"
              @click=${() => this._coverOpen(ent, stateObj)}
              style="display: block"
            >
              <ha-icon icon="${ongoing ? "mdi:stop" : "mdi:arrow-up"}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "stop":
      case "minimal":
      default:
        return html``;
    }
  }

  _renderDownButton(ent, stateObj) {
    const layout = this.config.layout ? this.config.layout : "full";
    const ongoing = stateObj.state === (ent.invert ? "opening" : "closing");
    switch (layout) {
      case "full":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="Down" @click=${() => this._coverClose(ent, stateObj)} style="display: block">
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "compact":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? "Stop" : "Down"}"
              @click=${() => this._coverClose(ent, stateObj)}
              style="display: block"
            >
              <ha-icon icon="${ongoing ? "mdi:stop" : "mdi:arrow-down"}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "stop":
      case "minimal":
      default:
        return html``;
    }
  }

  _renderStopButton(stateObj) {
    const layout = this.config.layout ? this.config.layout : "full";
    switch (layout) {
      case "full":
      case "stop":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="Stop" @click=${(e) => this._coverStop(stateObj)} style="display: block">
              <ha-icon icon="mdi:stop"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "compact":
      case "minimal":
      default:
        return html``;
    }
  }

  _renderSlider(ent, stateObj) {
    const sliderWidth =
      this.config.sliderWidth && this.config.sliderWidth >= 10 ? `${this.config.sliderWidth}px` : "40px";
    const sliderHeight =
      this.config.sliderHeight && this.config.sliderHeight >= 30 ? `${this.config.sliderHeight}px` : "200px";

    const openColor = this.config.openColor ? this.config.openColor : "hsl(0, 0%, 90%, 0.6)";
    const closedColor = this.config.closedColor ? this.config.closedColor : "hsl(0, 0%, 20%)";

    const step = ent.step ? ent.step : 5;
    return html`
      <div class="range-holder" style="--slider-height: ${sliderHeight};--closed-color: ${closedColor};">
        <input
          type="range"
          class="${stateObj.state}"
          step="${step}"
          style="--slider-width: ${sliderWidth};--slider-height: ${sliderHeight};--closed-color: ${closedColor};--open-color: ${openColor};"
          .value="${stateObj.state === "closed"
            ? ent.invert
              ? 100
              : 0
            : ent.invert
            ? 100 - Math.round(stateObj.attributes.current_position)
            : Math.round(stateObj.attributes.current_position)}"
          @input="${(e) => this._sliderChange(e.target.value, stateObj.entity_id)}}"
          @change=${(e) => this._setPosition(ent, stateObj.entity_id, e.target.value)}
        />
      </div>
    `;
  }

  render() {
    return html`
      <ha-card>
        <div class="page">
          <div class="main">
            <div class="inner-main">
              ${this.config.entities.length === 0 ? html` You need to define entities ` : ""}
              ${this.config.entities.map((ent) => {
                const stateObj = this.hass.states[ent.entity];
                return stateObj
                  ? html`
                      <div class="cover" style="--cover-width:30;--center-slider:30;">
                        <div class="cover-slider" style="display: flex; flex-direction: column; align-items: center;">
                          ${this._renderName(ent, stateObj)} ${this._renderUpButton(ent, stateObj)}
                          ${this._renderSlider(ent, stateObj)} ${this._renderDownButton(ent, stateObj)}
                          ${this._renderStopButton(stateObj)}
                        </div>
                      </div>
                    `
                  : html``;
              })}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

if (!customElements.get("cover-slider-card")) {
  customElements.define("cover-slider-card", CoverSliderCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "cover-slider-card",
    name: "Cover Slider",
    preview: false, // Optional - defaults to false
    description: "A card showing sliders for cover entities",
    documentationURL: "https://github.com/tolnai/hacs_cover_slider",
  });
  console.info(
    "%c Cover Slider Card  \n%c Version v0.1.3",
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray"
  );
}

class CoverSliderCardEditor extends LitElement {
  // @query("hui-entities-card-row-editor")
  // private _cardEditorEl?: HuiCardElementEditor;

  _selectedTab = 0;

  _editingEntity = null;

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  connectedCallback() {
    super.connectedCallback();
    loadHaForm();
  }

  setConfig(config) {
    this._config = config;
  }

  _backClick(ev) {
    this._editingEntity = null;
  }

  _computeLabel(e) {
    return e.label || e.name;
  }

  _valuesChanged(ev) {
    console.log(ev.detail);
    this._config = ev.detail.value;
    this._publishConfig();
  }

  _entitiesChanged(ev) {
    const _config = Object.assign({}, this._config);
    _config.entities = ev.detail.entities;
    this._config = _config;
    this._publishConfig();
  }

  _entityChanged(ev) {
    this._config.entities[this._editingEntity.index] = ev.detail.value;
    this._editingEntity.elementConfig = ev.detail.value;
    this._publishConfig();
  }

  _publishConfig() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _handleSwitchTab(ev) {
    this._selectedTab = parseInt(ev.detail.index, 10);
  }

  _editDetails(ev) {
    this._editingEntity = ev.detail.subElementConfig;
  }

  _renderEntityEditor() {
    return html`
      <div><ha-icon-button-prev @click=${(e) => this._backClick(e)} /> Back</div>
      <ha-form
        .hass=${this.hass}
        .data=${this._editingEntity.elementConfig}
        .schema=${[
          { name: "entity", label: "Entity", selector: { entity: { domain: "cover" } } },
          { name: "name", label: "Name", selector: { text: {} } },
          { name: "step", label: "Slider step size (default: 5)", selector: { number: {} } },
          { name: "invert", label: "Invert position?", selector: { boolean: {} } },
        ]}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._entityChanged}
      ></ha-form>
    `;
  }

  _renderEntitiesEditor() {
    return html`
      <hui-entities-card-row-editor
        .hass=${this.hass}
        .entities=${this._config.entities}
        @entities-changed=${this._entitiesChanged}
        @edit-detail-element=${this._editDetails}
      ></hui-entities-card-row-editor>
    `;
  }

  _renderVisualsEditor() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          {
            name: "layout",
            label: "Button layout",
            selector: {
              select: { options: ["full", "compact", "stop", "minimal"], mode: "dropdown" },
            },
          },
          { name: "hideNames", label: "Hide names?", selector: { boolean: {} } },
          { name: "titleSize", label: "Title size in px (default: 14)", selector: { number: {} } },
          { name: "sliderWidth", label: "Slider width in px (default: 40)", selector: { number: {} } },
          { name: "sliderHeight", label: "Slider height in px (default: 200)", selector: { number: {} } },
          { name: "openColor", label: "Open color", selector: { text: {} } },
          { name: "closedColor", label: "Closed color", selector: { text: {} } },
        ]}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valuesChanged}
      ></ha-form>
    `;
  }

  _renderContent() {
    if (this._selectedTab === 0 && this._editingEntity !== null) {
      return this._renderEntityEditor();
    }

    return [this._renderEntitiesEditor, this._renderVisualsEditor][this._selectedTab].bind(this)();
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="toolbar">
          <mwc-tab-bar .activeIndex=${this._selectedTab} @MDCTabBar:activated=${this._handleSwitchTab}>
            <mwc-tab .label=${"Cover Entities"}></mwc-tab>
            <mwc-tab .label=${"Visuals"}></mwc-tab>
          </mwc-tab-bar>
        </div>
        <div id="editor">${this._renderContent()}</div>
      </div>
    `;
  }
}

if (!customElements.get("cover-slider-card-editor")) {
  customElements.define("cover-slider-card-editor", CoverSliderCardEditor);
}
