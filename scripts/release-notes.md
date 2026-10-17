sOU Broadcast HUD · React 0.4.0

Original Boltobserv radar and a clear broadcast header. The stable package ID
remains sou-basic-react, and all eight Live/presentation views remain available.

- Original Boltobserv terrain, buyzones, logos and per-map calibration for ten
  exact map names, including Dust2. Original directional droplets, upright slots,
  observed-player ring, flashed state, bomb carrier, death crosses and local
  projectile/bomb artwork. No opaque radar square or technical captions.
- Nuke and Vertigo use the original combined images with split offsets per
  player/object, not a whole-image floor switch. Original logical dimensions,
  strict split boundaries and height scaling are preserved. Actual supplied smoke,
  flash and fire use original world dimensions. Smoke uses positive effect time,
  Flash uses lifetime >=1.4 seconds; deployed effects stop displaying a flying
  projectile. Flash IDs keep one bounded 100/1200/2200 ms pulse without extending
  on repeated snapshots; session/map/round changes clear it. Exploded bombs disappear.
- One chosen header caption, otherwise the competition name. Central ROUND 5 or
  the actual bomb/defuse/timeout/pause state; no invented unknown round number.
  No raw map ID, enum phase or concatenated best-of/map metadata strip.
- Series-win pips follow the actual managed team through side changes. Compact
  ordered map cells sit below the radar; only complete completed results appear,
  and only an exact actual map match receives a current-map highlight. A real
  Dust2 game does not pretend to be a configured Inferno series map.
- Numbered round history appears only during Freeze, Pause, team timeout and
  Intermission. It is absent during active play, bomb/defuse and round over.
  Time expiry has a clock; unknown reasons remain neutral. Statistics can show
  all supplied results independently.

This HUD project is GPL-3.0-only from 0.4.0 following the explicit license decision
for original Boltobserv. Earlier releases through 0.3.0 remain unchanged under MIT.
The public sOU SDK and NuGet packages remain MIT and pinned to 0.2.0-preview.4.
Original Boltobserv licenses, Ancient/Anubis MIT exceptions, complete upstream
source ZIP and per-file provenance ship with the package. Separately owned Valve
artwork and React/SDK dependencies retain their own notices; see LICENSING.md.

Import the .souhud through sOU → HUDs → Paket importieren, select sOU Broadcast ·
React and open a new output for version 0.4.0. Use sOU's output URL for OBS with a
1920 × 1080 source. Existing tags, packages and settings are preserved; current
Hide controls and caption are carried over. No new SDK or desktop version is
needed. Leave radar override fields empty for automatic original map selection.

Compact rosters, economy footers, observer card, weapon/equipment icons, actual
killfeed, sponsors, manual production controls, safe local media and session/
lifetime guards remain. Missing values, metadata and unknown maps stay explicit.
There are no guessed rosters, wins, picks/bans, ratings, damage or camera events.

Review the actual package over visible gameplay. Browser checks and automated
regressions do not replace native CS2/OBS acceptance for the intended setup.
See README for all views, panel fields, exact projection, data limits, licensing
scope and reproducible public SDK build/package instructions.
