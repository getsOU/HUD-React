# Third-party notices

This HUD project is distributed under **GPL-3.0-only** from 0.4.0; see `LICENSE`
and `LICENSING.md`. Earlier releases through 0.3.0 retain their original MIT
license. Separately licensed SDK/framework files, Boltobserv's map-specific MIT
exceptions and Valve artwork retain their own notices.

- **Boltobserv**, boltgolt and contributors, revision
  `0320883198e438cd6ae9fd490fa310027003727e`. Original ten-map terrain/buyzone/logo
  PNGs, calibration and projectile/bomb images are included unchanged. Projection,
  per-object floor splits, marker shape/colors/size, observed/flashed rings and
  tombstones are adapted to the public sOU v2 contracts in `src/model/boltobserv.js`
  and `src/ui/components/Radar.jsx`, with derived styling in `src/styles.css`.
  The original GPLv3 text, Ancient/Anubis MIT exceptions, complete original source
  archive and file-by-file SHA-256 inventory ship under `licenses/`.
  See [Boltobserv notice](licenses/BOLTOBSERV-NOTICE.md) and
  [provenance inventory](licenses/boltobserv-origins.json). Map artwork reflects
  the pinned original revision; it is not a claim that every later CS2 geometry
  change is already included. No upstream server, sockets or remote services run.

- **sOU JavaScript HUD SDK and generated contracts**, 0.2.0-preview.4, copyright
  2026 sofc, MIT. The unchanged files under `public/sdk` come from the public
  [SOU.Hud.Templates NuGet package](https://www.nuget.org/packages/SOU.Hud.Templates/0.2.0-preview.4),
  not from a private source checkout. License: `licenses/SOU-SDK-MIT.txt`.
  Reproduction and package hash: `scripts/sync-sdk.mjs`.
- **Microsoft SignalR browser client**, 10.0.0, .NET Foundation and Contributors,
  MIT, bundled unchanged by the official SDK. Original provenance and license:
  `public/sdk/vendor/NOTICE.md` and `public/sdk/vendor/LICENSE-signalr.txt`.
  It runs locally; there is no runtime CDN request.
- **React and React DOM**, 19.3.1, plus their Scheduler dependency, Meta Platforms, Inc. and affiliates, MIT.
  Their production code is bundled into the built HUD. Licenses are copied
  from the pinned npm packages into `dist/licenses` by the build script.
- **he**, 2.0.0, copyright Mathias Bynens, MIT. Used for one-pass decoding of
  standard HTML named/numeric entities in GSI/HLAE player names; decoded names
  remain ordinary escaped React text. The pinned library is bundled into the
  renderer. Its `LICENSE-MIT.txt` is copied to `dist/licenses/he-MIT.txt`.
- **Counter-Strike 2 artwork and original overview definitions**, Valve
  Corporation and the respective creators. The local `public/assets/weapons/`,
  `public/assets/killfeed/`, `public/assets/ui/` and `public/assets/radar/` files
  were exported directly from the game's original VPK archive, not from a
  third-party HUD. They include 101 equipment SVGs and 17 radar PNGs for 14 exact
  map identifiers. Source game build: `25966348`, Steam application `730`.
  Copyright, source paths, export method and coordinate conventions:
  [`licenses/VALVE-ASSETS.md`](licenses/VALVE-ASSETS.md). Per-file source/export
  SHA-256 and original entry identifiers:
  [`licenses/valve-assets.json`](licenses/valve-assets.json). These files ship
  with the installable package. No Valve endorsement, unrestricted asset
  redistribution or commercial permission is asserted by this project.
  Source 2 Viewer / ValveResourceFormat was a development-only exporter; its
  MIT license concerns that tool and does not license the game artwork.

The remaining npm packages are development/build tools and are not shipped
as whole packages in the HUD. Their versions and integrity hashes are locked
in `package-lock.json`; their individual license notices remain in npm.

The built package stores the SDK at `wwwroot/sdk` and includes this notice,
the HUD license, licensing scope, the SDK license, React/React DOM/Scheduler/he
licenses, Boltobserv licenses/source/provenance and the separate Valve
notice/provenance manifest under `licenses/`. Bundled game
artwork lives under `wwwroot/assets/`; the factual catalog and original overview
definitions accompany the PNGs. This project's GPL distribution does not change
separate artwork rights or the SDK's MIT license. Separately selected player,
team or sponsor images retain their own rights. Use of sOU or Counter-Strike
names grants no separate trademark rights.
