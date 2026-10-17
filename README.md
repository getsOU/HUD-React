# sOU Basic HUD · React

A small, transparent CS2 broadcast HUD built with React, Vite and the **public
sOU HUD SDK**. This is an independent, MIT-licensed starting point for authors.
It renders real protocol-v2 snapshots from the local sOU desktop host.

![Basic React HUD showing a synthetic example match](docs/preview.png)

The screenshot uses only synthetic example data in an isolated local package
host. The empty game area is transparent; it appears dark in this capture.

- CT on the left, blue; T on the right, warm orange.
- Score, map, round, source phase/countdown and explicit bomb state.
- Player rosters with health, armor, money, K/D/A and active/reloading weapon.
- Observed player with health, armor and ammunition.
- Live caption and visibility controls through the sOU HUD panel.
- A transparent 1920 × 1080 reference composition that scales uniformly to a
  16:9 region inside the browser viewport. Use a 1920 × 1080 OBS browser source.

No player/team identities, photos, kills, timers or health values are invented.
Missing values show `–`; no-game and no-player states remain explicit. Managed
team names require a recognized/inferred/manual side assignment with an exact
team ID match, including side swaps. Ambiguous assignments fall back to the
source side name or CT/T. The countdown displays received source seconds and
does not keep counting through missing updates. Connection and data freshness
are separate.

## Build and package

Requirements: **Node.js 22.13+** (Node 24 LTS recommended), npm, and the **.NET 10
SDK** for the public packaging tool. No private repository or credentials are
needed. Use a supported Node LTS release; dependency versions are pinned.

```sh
npm ci
npm run sdk:verify
npm run lint
npm test
npm run package
```

`npm run package` builds the production renderer, restores the repository-local
`SOU.Hud.Tool` **0.2.0-preview.4** from nuget.org, packages and validates:

```text
artifacts/sou-basic-react-0.1.0.souhud
artifacts/sou-basic-react-0.1.0.souhud.sha256
```

The build tree is `dist/hud.json` plus `dist/wwwroot`. The final package also
contains licenses. `npm run build` builds without producing a `.souhud`.
Package versions are immutable: increment `hud.json` (and keep the project
version in `package.json` aligned) before publishing a changed version. The
artifact filename is derived from the HUD manifest's ID and version.
The SHA-256 file identifies the exact built archive; ZIPs from separate builds
may differ because of timestamps. Do not replace an already published version.

## Install and use

Download the installable `.souhud` file from [GitHub Releases](https://github.com/getsOU/sOU-HUD-React/releases/latest).
The adjacent `.sha256` records the exact download checksum. Source builds are
explained above; no developer tools are needed to import a ready-made package.

1. Install [sOU](https://www.getsou.app/download), sign in with an enabled account.
2. Open **HUDs → Paket importieren** and select the `.souhud` file.
3. Select **sOU Basic · React** and open its browser output. Use that sOU-generated
   output URL in OBS; do not open `index.html` as a file.
4. Open the HUD panel. Under **Display**, set **Caption**, **Show player rosters**,
   or **Show observed player**, then save. Missing checkbox values default to
   visible; an explicitly saved `false` hides that component.
5. Configure CS2 GSI in sOU and spectate a match. Until game data arrives, the HUD
   shows a waiting state. An observed-player card appears only when supplied by
   the source. `0` ammunition/health is retained; an absent value stays `–`.

The renderer is static browser code; there is no web server to deploy and no
cloud API URL or account token to configure. The official SDK establishes the
local browser session and subscribes to separate live/panel SignalR streams.
It reconnects after interruption; past panel actions are not replayed. The
React store aborts both streams when its last subscriber leaves and rejects
late callbacks from old mounts. Each new live session replaces prior match data.

## Local development and explicit preview

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5192/?preview=1** for an explicitly labeled synthetic
preview. Additional cases: `?preview=waiting`, `?preview=bomb`, and
`?preview=unresolved`. These fixtures are local-only, make no sOU requests and
are removed from the production build. They are never sent to a running cast.
Opening the dev server without `preview` does not create a fake game and shows
the normal "Open this HUD from sOU" message.

For real snapshots, build/package/import a new version in sOU. A Vite server is
not a replacement for the installed package URL or the sOU browser session.
There is no insecure cross-origin development proxy. The build uses relative
asset paths and runs under `/hud-packages/sou-basic-react/0.1.0/` with the host's
Content Security Policy; no CDN, inline script, `eval`, telemetry, remote fonts,
or external assets are required.

## How the public NuGet packages are used

React cannot consume a C# NuGet assembly in a JavaScript bundle. Instead, this
project uses the official browser client, SignalR bundle and generated types
shipped **inside the public `SOU.Hud.Templates` 0.2.0-preview.4 NuGet package**.
The unchanged files are committed in `public/sdk` for ordinary offline builds.
No private source files or invented npm SDK are used. JavaScript/JSDoc references
the generated `contracts.d.ts`; rendering code is separate from transport.

`npm run sdk:sync` fetches that exact public NuGet version, verifies the pinned
SHA-256 `a403a12ab076e3aef341777ee724f66d51e7a530e540193a5ab1308848c56fd9`,
and copies only the explicitly listed SDK/license files. `npm run sdk:verify`
compares committed files against the same verified release without changing
them. This is the NuGet-gallery-signed archive hash, not the pre-upload CI hash.
Review a new version and update the pin intentionally when upgrading the SDK.

The second public package is the real packaging CLI, **SOU.Hud.Tool
0.2.0-preview.4**, pinned in `.config/dotnet-tools.json`. C# consumers can instead
use [SOU.Hud.Sdk](https://www.nuget.org/packages/SOU.Hud.Sdk/0.2.0-preview.4)
and [SOU.Live.Contracts](https://www.nuget.org/packages/SOU.Live.Contracts/0.2.0-preview.4),
as the [Blazor WASM sibling](https://github.com/getsOU/sOU-HUD-WASM) does.

## Structure and checks

- `src/model.js`: pure display rules and explicit team/side resolution.
- `src/hud-store.js`: shared streams, mount lifetime and session replacement.
- `src/ui/Hud.jsx`: focused presentational components.
- `src/preview/fixture.js`: development-only synthetic fixtures.
- `public/panel.json`: public HUD panel contract.
- `scripts`: pinned SDK synchronization, package assembly and validation.
- `tests`: missing data, team swaps/ambiguity, source timers, observer ordering,
  panel defaults, new sessions and StrictMode-safe cleanup.

The CI workflow checks the SDK origin, lint, tests and installable package. It
requires no publication secret. An automated build or a synthetic browser
preview is not a native CS2/OBS acceptance test. Real GSI, OBS transparency,
performance and prolonged reconnect behavior must be checked in your setup.

## License and references

MIT for this HUD; preserve `LICENSE` and `THIRD-PARTY-NOTICES.md` when reusing it.
No assets from GPL or third-party broadcast HUDs are included.

[Author guide](https://www.getsou.app/docs/hud-entwicklung) ·
[Live API](https://www.getsou.app/docs/hud-api) ·
[Types](https://www.getsou.app/docs/hud-vertragstypen) ·
[Panels](https://www.getsou.app/docs/hud-panel-referenz) ·
[Package format](https://www.getsou.app/docs/hud-paketformat)

## Publishing a new version

Update the HUD manifest version and the project version together, then run the
build and tests. Commit the reviewed source to `main`. An existing `vVERSION`
tag matching `hud.json` starts the same checks, then publishes the built
`.souhud` and its SHA-256 as a GitHub Release. Pull requests and ordinary branch
builds only retain CI artifacts. Publication checks repository, event, tag,
manifest and package hash; existing releases are never overwritten.

The build job has read-only repository access. Only the release job can create
release assets, using the automatic short-lived GitHub Actions token. No
personal access token or NuGet publishing credential is required. Test the
actual target CS2/OBS setup separately before using a changed HUD for a cast.
