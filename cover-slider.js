/*
 * Author        : Gabor Tolnai
 * Github        : https://github.com/tolnai/hacs_cover_slider
 * Description   : Cover slider card
 * Date          : 2024-10-27
 */
console.info(
  '%c Cover Slider Card  \n%c Version v0.1.0',
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

import {
  LitElement,
  html,
  css,
} from 'https://unpkg.com/lit-element@2.0.1/lit-element.js?module';

class CoverSliderCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  render() {
    var sliderWidth =
      this.config.sliderWidth && this.config.sliderWidth >= 10
        ? `${this.config.sliderWidth}px`
        : '40px';
    var sliderHeight =
      this.config.sliderHeight && this.config.sliderHeight >= 30
        ? `${this.config.sliderHeight}px`
        : '200px';
    var hideNames = this.config.hideNames ? this.config.hideNames : false;
    var hideDirections = this.config.hideDirections
      ? this.config.hideDirections
      : false;
    var hideStop = this.config.hideStop ? this.config.hideStop : false;

    var closedColor = this.config.closedColor
      ? this.config.closedColor
      : 'hsl(0, 0%, 20%)';
    var openColor = this.config.openColor
      ? this.config.openColor
      : 'hsl(0, 0%, 90%, 0.6)';
    var titleSize = this.config.titleSize ? this.config.titleSize : '14px';

    return html`
      <ha-card>
        <div class="page">
          <div class="main">
            <div class="inner-main">
              ${this.config.entities.length === 0
                ? html` You need to define entities `
                : ''}
              ${this.config.entities.map((ent) => {
                var step = ent.step ? ent.step : 5;
                const stateObj = this.hass.states[ent.entity];
                return stateObj
                  ? html`
                      <div
                        class="cover"
                        style="--cover-width:30;--center-slider:30;"
                      >
                        <div
                          class="cover-slider"
                          style="display: flex; flex-direction: column; align-items: center;"
                        >
                          <p
                            class="cover-name"
                            style="display: ${hideNames
                              ? 'none'
                              : 'block'};--cover-fontSize: ${titleSize};"
                            @click=${(e) =>
                              this._openEntity(stateObj.entity_id)}
                          >
                            ${ent.name || stateObj.attributes.friendly_name}
                          </p>
                          <div
                            class="toggle"
                            style="display: ${hideDirections
                              ? 'none'
                              : 'block'};margin: 0;"
                          >
                            <ha-icon-button
                              label="Up"
                              @click=${(e) => this._coverOpen(ent, stateObj)}
                              style="display: block"
                            >
                              <ha-icon icon="mdi:arrow-up"></ha-icon>
                            </ha-icon-button>
                          </div>
                          <div
                            class="range-holder"
                            style="--slider-height: ${sliderHeight};--closed-color: ${closedColor};"
                          >
                            <input
                              type="range"
                              class="${stateObj.state}"
                              step="${step}"
                              style="--slider-width: ${sliderWidth};--slider-height: ${sliderHeight};--closed-color: ${closedColor};--open-color: ${openColor};"
                              .value="${stateObj.state === 'closed'
                                ? ent.invert
                                  ? 100
                                  : 0
                                : ent.invert
                                ? 100 -
                                  Math.round(
                                    stateObj.attributes.current_position
                                  )
                                : Math.round(
                                    stateObj.attributes.current_position
                                  )}"
                              @input="${(e) =>
                                this._sliderChange(
                                  e.target.value,
                                  stateObj.entity_id
                                )}}"
                              @change=${(e) =>
                                this._setPosition(
                                  ent,
                                  stateObj.entity_id,
                                  e.target.value
                                )}
                            />
                          </div>
                          <div
                            class="toggle"
                            style="display: ${hideDirections
                              ? 'none'
                              : 'block'};margin: 0;"
                          >
                            <ha-icon-button
                              label="Down"
                              @click=${(e) => this._coverClose(ent, stateObj)}
                              style="display: block"
                            >
                              <ha-icon icon="mdi:arrow-down"></ha-icon>
                            </ha-icon-button>
                          </div>
                          <div
                            class="toggle"
                            style="display: ${hideStop
                              ? 'none'
                              : 'block'};margin: 0;"
                          >
                            <ha-icon-button
                              label="Stop"
                              @click=${(e) => this._coverStop(stateObj)}
                              style="display: block"
                            >
                              <ha-icon icon="mdi:stop"></ha-icon>
                            </ha-icon-button>
                          </div>
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

  _sliderChange(value, entity_id) {
    this.sliderVal[entity_id] = { val: value, active: true };
    this.requestUpdate();
  }

  _setPosition(ent, entity_id, value) {
    if (this.hass.states[entity_id].attributes.current_position === value) {
      return;
    }
    this.hass.callService('cover', 'set_cover_position', {
      entity_id: entity_id,
      position: ent.invert ? 100 - value : value,
    });
    this.sliderVal[entity_id]['active'] = false;
    if (script) {
      this.hass.callService('script', 'turn_on', {
        entity_id: ent.script,
      });
    }
  }

  _coverStop(state) {
    console.log(state);
    this.hass.callService('cover', 'stop_cover', {
      entity_id: state.entity_id,
    });
  }

  _coverOpen(ent, state) {
    this.hass.callService('cover', ent.invert ? 'close_cover' : 'open_cover', {
      entity_id: state.entity_id,
    });
  }

  _coverClose(ent, state) {
    this.hass.callService('cover', ent.invert ? 'open_cover' : 'close_cover', {
      entity_id: state.entity_id,
    });
  }

  _openEntity(entityId) {
    console.log(entityId);
    this._fire('hass-more-info', { entityId });
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

  static getConfigElement() {
    return document.createElement('cover-slider-card-editor');
  }

  static getStubConfig() {
    return { entities: [] };
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define entities');
    }
    for (var i = 0, len = config.entities.length; i < len; i++) {
      if (config.entities[i].entity === undefined) {
        throw new Error(
          config.entities[i] +
            ' is INVALID! Should be object: - entity: ' +
            config.entities[i] +
            '.'
        );
      }
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  configChanged(newConfig) {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
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
      .range-holder input[type='range'] {
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
      .range-holder input[type='range']::-webkit-slider-runnable-track {
        height: var(--slider-width);
        -webkit-appearance: none;
        color: var(--open-color);
        margin-top: 0px;
        transition: box-shadow 0.2s ease-in-out;
      }
      .range-holder input[type='range']::-webkit-slider-thumb {
        width: calc((var(--slider-width) / 5) + 2px);
        border-right: 4px solid var(--closed-color);
        border-left: 4px solid var(--closed-color);
        border-top: 10px solid var(--closed-color);
        border-bottom: 10px solid var(--closed-color);
        -webkit-appearance: none;
        height: var(--slider-width);
        cursor: ew-resize;
        background: var(--closed-color);
        box-shadow: -350px 0 0 350px var(--open-color),
          inset 0 0 0 80px var(--open-color);
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
}

customElements.define('cover-slider-card', CoverSliderCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'cover-slider-card',
  name: 'Cover Slider',
  preview: false, // Optional - defaults to false
  description: 'A card showing sliders for cover entities',
  documentationURL: 'https://github.com/tolnai/hacs_cover_slider',
});

class CoverSliderCardEditor extends LitElement {
  // @query("hui-entities-card-row-editor")
  // private _cardEditorEl?: HuiCardElementEditor;

  _editingEntity = null;

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  setConfig(config) {
    this._config = config;
  }

  _backClick(ev) {
    this._editingEntity = null;
  }

  _computeLabel(e) {
    switch (e.name) {
      case 'hideNames':
        return 'Hide names?';
      case 'hideDirections':
        return 'Hide up/down buttons?';
      case 'hideStop':
        return 'Hide stop button?';
      case 'sliderWidth':
        return 'Slider width (default: 40)';
      case 'sliderHeight':
        return 'Slider height (default: 200)';
      case 'entity':
        return 'Entity';
      case 'name':
        return 'Name';
      case 'step':
        return 'Slider step size (default: 5)';
      case 'invert':
        return 'Invert position?';
    }
    return e.name;
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
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _editDetails(ev) {
    this._editingEntity = ev.detail.subElementConfig;
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    if (this._editingEntity !== null) {
      return html`
        <div>
          <ha-icon-button-prev @click=${(e) => this._backClick(e)} /> Back
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity.elementConfig}
          .schema=${[
            { name: 'entity', selector: { entity: { domain: 'cover' } } },
            { name: 'name', selector: { text: {} } },
            { name: 'step', selector: { number: {} } },
            { name: 'invert', selector: { boolean: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      `;
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          { name: 'hideNames', selector: { boolean: {} } },
          { name: 'hideDirections', selector: { boolean: {} } },
          { name: 'hideStop', selector: { boolean: {} } },
          { name: 'sliderWidth', selector: { number: {} } },
          { name: 'sliderHeight', selector: { number: {} } },
        ]}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valuesChanged}
      ></ha-form>
      <hui-entities-card-row-editor
        .hass=${this.hass}
        .entities=${this._config.entities}
        @entities-changed=${this._entitiesChanged}
        @edit-detail-element=${this._editDetails}
      ></hui-entities-card-row-editor>
    `;
  }
}

customElements.define('cover-slider-card-editor', CoverSliderCardEditor);
