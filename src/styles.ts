import { css } from 'lit';

export default css`
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
    padding: 6px 16px 6px 16px;
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
    line-height: var(--cover-fontSize);
    cursor: pointer;
  }
  .cover-name .cover-percentage {
    font-size: var(--percentage-fontSize);
  }
  .direction-vertical .cover-name {
    margin-top: var(--cover-fontSize);
    margin-bottom: 0;
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

  .range-holder input[type='range'] {
    outline: 0;
    border: 0;
    border-radius: 4px;
    margin: 0;
    transition: box-shadow 0.2s ease-in-out;
    overflow: hidden;
    -webkit-appearance: none;
    background-color: var(--closed-color);
  }
  .direction-vertical .range-holder input[type='range'] {
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
  .direction-horizontal .range-holder input[type='range'],
  .direction-horizontal-invert .range-holder input[type='range'] {
    width: var(--slider-height);
    height: var(--slider-width);
  }
  .direction-horizontal .range-holder input[type='range'] {
    -webkit-transform: rotate(180deg);
    -moz-transform: rotate(180deg);
    -o-transform: rotate(180deg);
    -ms-transform: rotate(180deg);
    transform: rotate(180deg);
  }
  .range-holder input[type='range']::-webkit-slider-runnable-track {
    height: var(--slider-width);
    -webkit-appearance: none;
    color: var(--open-color);
    margin-top: 0px;
    transition: box-shadow 0.2s ease-in-out;
  }
  .range-holder input[type='range']::-webkit-slider-thumb {
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
