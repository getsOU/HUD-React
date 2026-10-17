# Changelog

## 0.4.4

- Use original CS2 SVGs consistently for status, equipment, killfeed and round results. Add original clock and rescued-hostage artwork.
- Remove hand-drawn icon fallbacks; unavailable assets retain a text label. Preserve SVG aspect ratios and size status/utility icons for their HUD context.


## 0.4.3

- Restore original Boltobserv Arial numerals, line height, marker/label proportions, active size and shared height scaling.
- Render WASM player dots and upright labels in a separate HTML layer, matching the original and React.


## 0.4.2

- Match NYXIA radar motion and coherent HLAE source selection; correct the WASM receipt clock.
- Show explicit pick teams and deciders in all map-series displays, without guessing missing decisions.

## 0.4.1

- Dead players no longer display stale active weapons, ammunition or inventory
  icons in rosters, the observer card or expanded Spotlight.
- Living unarmed players leave the current-weapon area empty. An explicitly empty
  or holstered-only inventory does not fall back to a stale `activeWeapon` field.
- A genuinely supplied unknown active/reloading weapon retains its own accessible
  unknown-equipment fallback. Missing health remains unknown, not dead.
- Public SDK version, package identity, layout, panel fields and prior releases
  remain unchanged. Import the new package and open a new output to use it.

## 0.4.0

- Original Boltobserv radar, per-object split-floor projection and bounded flash
  pulses over the public sOU protocol.
- One chosen broadcast caption, actual round label, reliable team series pips,
  compact map cells and round history shown during pauses.
- GPL-3.0-only HUD project with original upstream provenance/source and separate
  dependency notices. Public sOU SDK remains MIT; older releases retain their
  original licenses.
