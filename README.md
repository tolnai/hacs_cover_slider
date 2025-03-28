# Cover Slider card for Home Assistant

This is a custom card loaded via HACS into Home Assistant, which shows sliders for cover type entities. Sliders can go both vertically and horizontally.

The card has a visual editor, but all configuration options are detailed below.

## Samples

![Basic example](images/basic.png)

![Vertical example](images/vertical.png)

![Horizontal example](images/horizontal.png)

## Options

| Name         | Type    | Default          | Description                                                      |
| ------------ | ------- | ---------------- | ---------------------------------------------------------------- |
| type         | string  | **Required**     | `custom:cover-slider-card`                                       |
| entities     | array   | **Required**     | Entities configured as below                                     |
| direction    | string  | `vertical`       | Slider direction: `vertical`, `horizontal`, `horizontal-invert`  |
| layout       | string  | `full`           | Layout: `full`, `compact`, `stop`, `minimal`                     |
| hideNames    | boolean | `false`          | Hides names of entities. Not recommended for horizontal sliders. |
| sliderWidth  | number  | `40`             | Width of sliders in px                                           |
| sliderHeight | number  | `200`            | Length of sliders in px                                          |
| step         | number  | `5`              | Default slider step size (you'll get 100/step positions)         |
| openColor    | string  |                  | Default color used for open area                                 |
| closedColor  | string  |                  | Default color used for closed area                               |
| upIcon       | icon    | `mdi:arrow-up`   | Default upper/left icon                                          |
| downIcon     | icon    | `mdi:arrow-down` | Default lower/right icon                                         |
| upLabel      | string  | `Up`             | Default label of upper/left icon                                 |
| downLabel    | string  | `Down`           | Default label of lower/right icon                                |

## Entity options

| Name        | Type    | Default          | Description                                      |
| ----------- | ------- | ---------------- | ------------------------------------------------ |
| entity      | entity  | **Required**     | Cover entity                                     |
| name        | string  | entity's name    | Show this name instead entity's name             |
| invert      | boolean | `false`          | Inverts 0/100 position values                    |
| step        | number  | `5`              | Slider step size (you'll get 100/step positions) |
| openColor   | string  |                  | Individual color used for open area              |
| closedColor | string  |                  | Individual color used for closed area            |
| upIcon      | icon    | `mdi:arrow-up`   | Individual upper/left icon                       |
| downIcon    | icon    | `mdi:arrow-down` | Individual lower/right icon                      |
| upLabel     | string  | `Up`             | Individual label of upper/left icon              |
| downLabel   | string  | `Down`           | Individual label of lower/right icon             |

## Installation

Prefered method of installation is [Home Assistant Community Store](https://github.com/hacs/integration).

- Open HACS in Home Assistant, Click the "..." menu, Custom repositories
- Cope the URL of this repo (<https://github.com/tolnai/hacs_cover_slider>) and press Add
- Search for "cover slider", pick "Cover Slider card" from the list, press Download
- After reloading the page, the card will be available in the card picker

## Examples

### Basic example

```yaml
type: custom:cover-slider-card
entities:
  - entity: cover.cover_1
  - entity: cover.cover_2
  - entity: cover.cover_3
  - entity: cover.cover_4
```

### Horizontal example

```yaml
type: custom:cover-slider-card
entities:
  - entity: cover.shade_1
    name: "Kitchen"
  - entity: cover.shade_2
    name: "Living room"
direction: horizontal-invert
layout: compact
step: 5
upIcon: mdi:arrow-collapse-horizontal
downIcon: mdi:arrow-expand-horizontal
upLabel: In
downLabel: Out
```

### Full example

```yaml
type: custom:cover-slider-card
entities:
  - entity: cover.cover_1
    name: "South 1"
    invert: True
    step: 10
  - entity: cover.cover_2
    name: "South 2"
    invert: True
    step: 10
  - entity: cover.cover_3
    name: "West 1"
  - entity: cover.cover_4
    name: "West 2"
  - entity: cover.covers_group
    name: "All"
    openColor: ""
    closedColor: hsl(200, 20%, 20%)
    upIcon: mdi:arrow-up-bold
    downIcon: mdi:arrow-down-bold
    upLabel: All up
    downLabel: All down
direction: vertical
layout: full
hideNames: false
sliderWidth: 40
sliderHeight: 200
step: 5
openColor: ""
closedColor: ""
upIcon: mdi-arrow-left
downIcon: mdi:arrow-right
```

## Changelog

### v0.3.0

Updating lit-element dependency, the card doesn't appear otherwise.

## Credits

Inspired by [Vertical Slider Cover Card](https://github.com/konnectedvn/lovelace-vertical-slider-cover-card) by [konnectedvn](https://github.com/konnectedvn).
