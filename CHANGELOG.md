# Changelog

## Unreleased

🚀 New features:

- `disableSlider` option (global and per entity): the slider only shows the position, so scrolling on mobile cannot move a cover by accident
- sections view support (card size is estimated from the configuration)

🪲 Fixes:

- `perform-action` and every other action type works now (actions are handled by Home Assistant)
- global hold/double tap actions are no longer lost when an entity has its own tap action
- config editor no longer mutates the configuration
- card recovers after an invalid configuration is fixed
- slider does not jump back while dragging a moving cover
- covers without position support show open/closed state and their slider cannot be dragged
- slider styling in Firefox

🧹 Maintenance:

- updated build toolchain, lit 3, removed `custom-card-helpers`

## v0.5.1 (2025-05-14)

🚀 New features:

- ability to show percentage (besides or under name)

## v0.5.0 (2025-05-11)

⚠️ BREAKING CHANGES:

- Config editor might not work with earlier versions of HA. Only upgrade after upgrading to HA 2025.5!

🪲 Fixes:

- make compatible with HA 2025.5 (config editor tabs)

## v0.4.1 (2025-05-06)

🪲 Fixes:

- bring back default "more-info" action when tapping on cover name

## v0.4.0 (2025-05-05)

⚙️ Complete internal refactor.

🚀 New features:

- 🎉 support actions (defaults and on individual level as well)
- new layout: "compact smart" (disable up/down buttons in extreme positions)
- refine config editor UI a bit

## v0.3.0

Updating lit-element dependency, the card doesn't appear otherwise.

## v0.2.0

First public release.
