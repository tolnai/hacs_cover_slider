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
    scrollbar-width: none;
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
    display: inline-block;
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
    appearance: none;
    background-color: var(--closed-color);
  }
  .direction-vertical .range-holder input[type='range'] {
    width: var(--slider-height);
    height: var(--slider-width);
    position: absolute;
    top: calc(50% - (var(--slider-width) / 2));
    right: calc(50% - (var(--slider-height) / 2));
    transform: rotate(270deg);
  }
  .direction-horizontal .range-holder input[type='range'],
  .direction-horizontal-invert .range-holder input[type='range'] {
    width: var(--slider-height);
    height: var(--slider-width);
  }
  .direction-horizontal .range-holder input[type='range'] {
    transform: rotate(180deg);
  }
  /* Slider shows position only: touches pass through, so page scrolling cannot move a cover. */
  .range-holder.no-drag input[type='range'] {
    pointer-events: none;
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
    box-shadow:
      -350px 0 0 350px var(--open-color),
      inset 0 0 0 80px var(--open-color);
    border-radius: 0;
    transition: box-shadow 0.2s ease-in-out;
    position: relative;
    top: 0;
  }
  /* Firefox: progress fills the open part, thumb mimics the WebKit one. */
  .range-holder input[type='range']::-moz-range-track {
    height: var(--slider-width);
    background: transparent;
  }
  .range-holder input[type='range']::-moz-range-progress {
    height: var(--slider-width);
    background: var(--open-color);
  }
  .range-holder input[type='range']::-moz-range-thumb {
    box-sizing: border-box;
    width: 18px;
    height: var(--slider-width);
    border-width: 10px 4px;
    border-style: solid;
    border-color: var(--closed-color);
    border-radius: 0;
    background: var(--open-color);
    cursor: ew-resize;
  }

  .toggle {
    margin: 0;
    align-items: center;
    justify-content: center;
  }
  .toggle ha-icon-button {
    display: block;
  }
`;
