# Third-party notices

This HUD's own code is MIT licensed; see `LICENSE`. No third-party HUD layout,
weapon icons, player photos, fonts, or other broadcast assets are included.

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

The remaining npm packages are development/build tools and are not shipped
as whole packages in the HUD. Their versions and integrity hashes are locked
in `package-lock.json`; their individual license notices remain in npm.

The built package stores the SDK at `wwwroot/sdk` and includes this notice,
the HUD license, the SDK license and the React/React DOM/Scheduler licenses.
Use of sOU names does not grant separate rights to its trademarks.
