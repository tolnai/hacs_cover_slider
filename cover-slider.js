/*
 * Author        : Gabor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 * Date          : 2025-03-20 - updated lit-element dependency version
 */
import { LitElement, html, css } from "https://unpkg.com/lit-element@4.1.1/lit-element.js?module";

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
      ha-card {
        overflow: hidden;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
      }
      .main {
        display: flex;
        height: 100%;
        margin: auto;
        padding: 16px 16px 6px 16px;
        width: 100%;
        justify-content: space-around;
        overflow-x: scroll;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
      .direction-vertical {
        flex-direction: row;
        align-items: center;
      }
      .direction-horizontal,
      .direction-horizontal-invert {
        flex-direction: column;
      }
      .cover {
        width: var(--cover-width);
        display: inline-block;
        margin: var(--center-slider);
        padding-bottom: 0px;
        flex: 1 1 0px;
      }

      .cover-name {
        font-weight: 300;
        font-size: var(--cover-fontSize);
        cursor: pointer;
      }
      .direction-vertical .cover-name {
        margin-top: calc(var(--cover-fontSize) / 3);
        margin-bottom: calc(var(--cover-fontSize) / 2);
        text-align: center;
      }
      .direction-horizontal .cover-name,
      .direction-horizontal-invert .cover-name {
        flex-grow: 2;
      }

      .cover-slider {
        display: flex;
        align-items: center;
      }
      .direction-vertical .cover-slider {
        flex-direction: column;
      }
      .direction-horizontal .cover-slider,
      .direction-horizontal-invert .cover-slider {
        flex-direction: row;
        justify-content: space-between;
      }

      .range-holder {
        position: relative;
      }
      .direction-vertical .range-holder {
        height: var(--slider-height);
      }
      .direction-horizontal .range-holder,
      .direction-horizontal-invert .range-holder {
        height: var(--slider-width);
      }

      .range-holder input[type="range"] {
        outline: 0;
        border: 0;
        border-radius: 4px;
        margin: 0;
        transition: box-shadow 0.2s ease-in-out;
        overflow: hidden;
        -webkit-appearance: none;
        background-color: var(--closed-color);
      }
      .direction-vertical .range-holder input[type="range"] {
        width: var(--slider-height);
        height: var(--slider-width);
        position: absolute;
        top: calc(50% - (var(--slider-width) / 2));
        right: calc(50% - (var(--slider-height) / 2));
        -webkit-transform: rotate(270deg);
        -moz-transform: rotate(270deg);
        -o-transform: rotate(270deg);
        -ms-transform: rotate(270deg);
        transform: rotate(270deg);
      }
      .direction-horizontal .range-holder input[type="range"],
      .direction-horizontal-invert .range-holder input[type="range"] {
        width: var(--slider-height);
        height: var(--slider-width);
      }
      .direction-horizontal .range-holder input[type="range"] {
        -webkit-transform: rotate(180deg);
        -moz-transform: rotate(180deg);
        -o-transform: rotate(180deg);
        -ms-transform: rotate(180deg);
        transform: rotate(180deg);
      }
      .range-holder input[type="range"]::-webkit-slider-runnable-track {
        height: var(--slider-width);
        -webkit-appearance: none;
        color: var(--open-color);
        margin-top: 0px;
        transition: box-shadow 0.2s ease-in-out;
      }
      .range-holder input[type="range"]::-webkit-slider-thumb {
        width: 10px;
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
        align-items: center;
        justify-content: center;
      }
    `;
  }

  _renderName(ent, stateObj) {
    const hideNames = this.config.hideNames || false;
    const titleSize = this.config.titleSize ? `${this.config.titleSize}px` : "14px";
    if (hideNames) {
      return html``;
    }
    return html`
      <p class="cover-name" style="--cover-fontSize:${titleSize};" @click=${() => this._openEntity(stateObj.entity_id)}>
        ${ent.name || stateObj.attributes.friendly_name}
      </p>
    `;
  }

  _renderUpButton(ent, stateObj) {
    const layout = this.config.layout || "full";
    const upIcon = ent.upIcon || this.config.upIcon || "mdi:arrow-up";
    const upLabel = ent.upLabel || this.config.upLabel || "Up";
    const ongoing = stateObj.state === (ent.invert ? "closing" : "opening");
    switch (layout) {
      case "full":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="${upLabel}" @click=${() => this._coverOpen(ent, stateObj)} style="display: block">
              <ha-icon icon="${upIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "compact":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? "Stop" : upLabel}"
              @click=${() => this._coverOpen(ent, stateObj)}
              style="display: block"
            >
              <ha-icon icon="${ongoing ? "mdi:stop" : upIcon}"></ha-icon>
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
    const layout = this.config.layout || "full";
    const downIcon = ent.downIcon || this.config.downIcon || "mdi:arrow-down";
    const downLabel = ent.downLabel || this.config.downLabel || "Down";
    const ongoing = stateObj.state === (ent.invert ? "opening" : "closing");
    switch (layout) {
      case "full":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button label="${downLabel}" @click=${() => this._coverClose(ent, stateObj)} style="display: block">
              <ha-icon icon="${downIcon}"></ha-icon>
            </ha-icon-button>
          </div>
        `;
      case "compact":
        return html`
          <div class="toggle" style="margin: 0;">
            <ha-icon-button
              label="${ongoing ? "Stop" : downLabel}"
              @click=${() => this._coverClose(ent, stateObj)}
              style="display: block"
            >
              <ha-icon icon="${ongoing ? "mdi:stop" : downIcon}"></ha-icon>
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
    const layout = this.config.layout || "full";
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

    const openColor = ent.openColor || this.config.openColor || "hsl(0, 0%, 90%, 0.6)";
    const closedColor = ent.closedColor || this.config.closedColor || "hsl(0, 0%, 20%)";

    const step = ent.step || this.config.step || 5;
    return html`
      <div
        class="range-holder"
        style="--slider-width:${sliderWidth};--slider-height:${sliderHeight};--closed-color:${closedColor};"
      >
        <input
          type="range"
          class="${stateObj.state}"
          step="${step}"
          style="--slider-width:${sliderWidth};--slider-height:${sliderHeight};--closed-color:${closedColor};--open-color:${openColor};"
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

  _renderCover(ent) {
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

  render() {
    const direction = this.config.direction || "vertical";

    return html`
      <ha-card>
        <div class="main direction-${direction}">
          ${this.config.entities.length === 0 ? html` You need to define entities ` : ""}
          ${this.config.entities.map((ent) => this._renderCover(ent))}
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
    "%c Cover Slider Card  \n%c Version v0.3.0",
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
          { name: "invert", label: "Invert position?", selector: { boolean: {} } },
          { name: "step", label: "Slider step size (default: 5)", selector: { number: {} } },
          { name: "openColor", label: "Open color", selector: { text: {} } },
          { name: "closedColor", label: "Closed color", selector: { text: {} } },
          { name: "upIcon", label: "Upper/left icon", selector: { icon: {} } },
          { name: "downIcon", label: "Lower/right icon", selector: { icon: {} } },
          { name: "upLabel", label: "Upper/left icon label", selector: { text: {} } },
          { name: "downLabel", label: "Lower/right icon label", selector: { text: {} } },
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
            name: "direction",
            label: "Slider direction",
            selector: {
              select: {
                options: [
                  { label: "Horizontal (left-to-right)", value: "horizontal" },
                  { label: "Horizontal (right-to-left)", value: "horizontal-invert" },
                  { label: "Vertical", value: "vertical" },
                ],
                mode: "dropdown",
              },
            },
          },
          {
            name: "layout",
            label: "Button layout",
            selector: {
              select: {
                options: [
                  { label: "Full (all buttons)", value: "full" },
                  { label: "Compact (stop appears during movement)", value: "compact" },
                  { label: "Stop (only Stop button)", value: "stop" },
                  { label: "Minimal (no buttons)", value: "minimal" },
                ],
                mode: "dropdown",
              },
            },
          },
          { name: "hideNames", label: "Hide names?", selector: { boolean: {} } },
          { name: "titleSize", label: "Title size in px (default: 14)", selector: { number: {} } },
          { name: "sliderWidth", label: "Slider width in px (default: 40)", selector: { number: {} } },
          { name: "sliderHeight", label: "Slider length in px (default: 200)", selector: { number: {} } },
          { name: "step", label: "Default slider step size (default: 5)", selector: { number: {} } },
          { name: "openColor", label: "Default open color", selector: { text: {} } },
          { name: "closedColor", label: "Default closed color", selector: { text: {} } },
          { name: "upIcon", label: "Default upper/left icon", selector: { icon: {} } },
          { name: "downIcon", label: "Default lower/right icon", selector: { icon: {} } },
          { name: "upLabel", label: "Default upper/left icon label", selector: { text: {} } },
          { name: "downLabel", label: "Default lower/right icon label", selector: { text: {} } },
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
