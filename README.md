# sOU Showcase HUD · React

A transparent, MIT-licensed CS2 broadcast HUD and a practical reference for authors
using **React and the public sOU HUD SDK**. It includes a live overlay and seven
presentation views. Every display uses public protocol-v2 snapshots, optional
local profile metadata, or an explicit operator setting. It does not invent
players, match results, events or statistics.

Current HUD version: **0.2.0**. Package ID: `sou-basic-react`.

![React showcase HUD inside the transparent sOU output frame](docs/preview.png)

The example image uses the real packaged renderer with synthetic data in an
isolated host. The checkerboard is behind the HUD and demonstrates transparency;
it is not part of the overlay. Synthetic previews are excluded from production.

## Install and open an output

Download the `.souhud` file from [GitHub Releases](https://github.com/getsOU/sOU-HUD-React/releases/latest).
The adjacent `.sha256` identifies the exact archive. Ready-made packages require
no Node.js, .NET SDK, source checkout or separate web server.

1. Install [sOU](https://www.getsou.app/download), sign in with an enabled account,
   and select the workspace and active match you want to broadcast.
2. Open **HUDs → Paket importieren** and select the downloaded `.souhud`.
3. Select **sOU Basic · React** and open its output. Use the URL supplied by sOU in
   OBS or the native output. Do not open `index.html` as a local file.
4. Open the HUD panel. The **Display → Main output scene** selector controls the
   main output; leave it empty or choose **Live** for the game overlay. Dedicated
   subviews are described below.
5. Leave the **Hide…** checkboxes unchecked to display their components. Set text,
   optional images and featured references as needed, then save the panel.
6. Configure GSI in sOU, start CS2 and spectate the match. Use sOU's HLAE integration
   if you want its radar positions and killfeed. An observed-player card requires
   a real `observedPlayer`; selecting a featured player does not select a camera.

The composition is a 1920 × 1080 reference canvas, scaled uniformly into the
available viewport with transparent letterboxing. Use a 1920 × 1080 OBS browser
source. Keep the browser source transparent; the game area is deliberately open.
The output does not load remote fonts, CDNs, tracking, or foreign HUD assets.

An imported version has its own immutable files. Install a new version and open
an output for that version to update; an already running older output keeps its
original files. Existing 0.1.x packages and settings are not overwritten.

## Eight views

All views share the same renderer, SDK identity, current snapshot and panel.
There are no separate HTML builds or router dependencies.

| View | Relative output path | What it shows |
| --- | --- | --- |
| Live | `index.html` | Match header, round/bomb state, rosters, observed player, radar, killfeed, economy, round history, series and production overlays. The central game area stays clear. |
| Prematch | `views/prematch` | Active match before GSI, both managed teams, available logos, planned start/countdown, competition context and series. |
| Lineups | `views/lineups` | Actual matching team rosters and available local player portraits. Missing roster metadata stays unavailable rather than becoming a guessed five-player lineup. |
| Map veto | `views/veto` | Explicit picks, bans and decider, their recorded team assignments, play order and map results. |
| Break | `views/break` | Operator title/subtitle, competition branding, real planned-start countdown when available and match/series context. |
| Results | `views/postmatch` | Saved series and map results; a winner is stated only when the available rules and results determine one. |
| Statistics | `views/statistics` | Full player table: current K/D/A, MVP/score, round values, economy and recorded ADR/headshots with coverage. |
| Spotlight | `views/spotlight` | The selected player, team or match reference, available local images and matching live values; falls back to the actual observed player when appropriate. |

Open a dedicated subview through sOU's output selection. Relative paths above
are resolved beneath the installed package root, for example
`/hud-packages/sou-basic-react/0.2.0/views/veto`. Keep the sOU-generated address,
browser session and base path. Explicit subviews ignore the main scene selector;
changing **Main output scene** does not turn a dedicated statistics output into
another view.

## Components and data sources

| Component | Public source | Limits and missing-data behavior |
| --- | --- | --- |
| Match header and identities | `managedMatch` (also available before GSI), explicit CT/T assignments and `game.ct`/`game.t` | Team A/B are stable match identities, not permanent CT/T sides. Only matching IDs and recognized/inferred/manual assignments resolve managed side names. Unknown assignments stay explicit. |
| Player rosters | `game.players`, typed state, weapons and stats | Observer digits, HP/armor, helmet/kit/bomb, inventory/ammo, utility, money/equipment, K/D/A, round kills/damage and supplied flash/smoke/burn values. Missing HP does not mean alive; zero remains zero. |
| Observed player | `game.observedPlayer` | Actual observed identity and inventory; no first-player fallback. Optional portraits require matching local metadata. |
| Round state/history | `roundNumber`, `roundPhase`, `roundWinner`, `roundWinReason`, `roundWins`, source countdown | History retains the winner's side at that round. A side is not relabeled with today's team assignment. No guessed clutch, MVP or overtime result. |
| Bomb/defuse | `game.bomb` and source seconds; `game.roundBomb` as a state fallback | Planting/planted/defusing/defused/exploded are explicit. A state fallback does not invent a timer. Seconds are source values; no invented fixed plant or defuse duration and no authoritative progress from an unknown baseline. |
| Economy and alive counts | Complete known values for each side's supplied players | Missing summands are identified; a partial roster is not presented as a complete team total. |
| Killfeed | `game.killFeed` | Real killer/assist/victim/weapon and supplied special flags, identified by connection + epoch + event ID. No inferred kills from changes in HP. |
| Radar | Fresh, timeline-compatible `game.radar`, otherwise GSI player/bomb/grenade positions | Own MIT renderer. The default is a labeled relative world-position view, not a map. Local calibrated overviews are optional; details below. |
| Prematch/lineups | Managed match, competition, planned `startsAt`, optional matching local metadata | No prefilled players or imported roster assumptions. Missing start time means no countdown. |
| Series/veto/results | Managed map entries, explicit `number`/`playNumber`, status, result and `winnerTeamId` | Picks/bans and winners are never derived from list order or from the current scoreboard. Unknown team IDs stay unresolved. |
| Statistics | Player stats and `recordedStats` | ADR/HS are shown only when recorded. Rounds and `coversWholeMatch` distinguish a partial recording from full-match coverage. There are no guessed ratings or win probabilities. |
| Spotlight | Resolved public panel references, matching snapshot and optional metadata | An operator highlight, not an automatically awarded MVP. Unknown or stale references never silently become another person/team. |
| Branding | Managed competition logo/sponsors and selected local panel images | Local authorized media only. Failed images degrade to a neutral monogram or empty image area. |
| Production | Explicit panel title/subtitle, ticker, replay/status label and lower-third action | Manual text is not a detected replay or game event. It never drives CS2 camera controls. |

Connection status and data freshness are separate. Waiting, stale, unknown and
unsupported data are explicit; missing values use `–` or an unavailable state.
Source countdowns display received seconds and do not continue through missing
updates. A planned-start countdown instead uses the actual absolute `startsAt`
time. No automatic winner is asserted from incomplete series data.

## HUD panel reference

All fields below belong to the installed package version. Save normal values in
the panel to update open views. **Hide…** checkboxes default to unchecked because
the real sOU host initializes missing checkboxes to `false`: only `true` hides a
component. Caption-only saves keep every unrelated component visible.

### Display

| Field ID | UI label / type | Effect |
| --- | --- | --- |
| `display.caption` | Scoreboard caption · text | Caption in the match header; empty text uses the HUD default. |
| `display.scene` | Main output scene · select | `live`, `prematch`, `lineups`, `veto`, `break`, `postmatch`, `statistics`, `spotlight`. Empty/unknown selections use Live. Dedicated subviews retain their own scene. |
| `display.hideRosters` | Hide team rosters · checkbox | Hides both side rosters in Live. Observer digits otherwise remain visible when known. |
| `display.hideObservedPlayer` | Hide observed player · checkbox | Hides the actual observed-player card. |
| `display.hideRadar` | Hide radar · checkbox | Hides the radar component. |
| `display.hideKillfeed` | Hide killfeed · checkbox | Hides the real-event killfeed. |
| `display.hideEconomy` | Hide economy · checkbox | Hides side economy summaries. |
| `display.hideRoundHistory` | Hide round history · checkbox | Hides the round-history strip. |
| `display.hideSeries` | Hide map series · checkbox | Hides the shared compact series strip. |
| `display.hideSponsors` | Hide sponsors · checkbox | Hides competition and additional sponsor presentation. |

### Production

| Field ID | UI label / type | Effect |
| --- | --- | --- |
| `production.title` | Scene title · text | Operator-supplied presentation title, overriding the view's normal title and Spotlight headline. |
| `production.subtitle` | Scene subtitle · text | Supporting scene text, overriding the view's normal subtitle and Spotlight subline. |
| `production.ticker` | Bottom ticker · text | Bottom text line. Empty means no ticker. |
| `production.replayLabel` | Replay/status label (manual) · text | Explicit manual label; empty means no label. This is not replay detection. |
| `production.lowerTitle` | Lower third title · text | Saved text used by the lower-third overlay; empty uses `Live production`. |
| `production.lowerSubtitle` | Lower third subtitle · text | Saved supporting lower-third text. |
| `production.lowerThird` | Lower third · action | **Show now** (`show`) or **Hide now** (`hide`). Save the text first, then trigger the action. |

Lower-third actions are transient commands. Only a valid value and a new action
ID can change visibility. Duplicate delivery, a reconnect and replay of saved
panel state do not replay an earlier command. Reconnects and match/session changes
hide the transient lower third. Saved captions, selections and other panel
values remain ordinary configuration. An action does not change the selected scene.

### Spotlight

| Field ID | UI label / type | Effect |
| --- | --- | --- |
| `feature.player` | Featured player · player | Selects a public player reference. |
| `feature.team` | Featured team · team | Selects a public team reference. |
| `feature.match` | Featured match · match | Selects a public match reference. |
| `feature.headline` | Headline · text | Operator headline; no automatic MVP claim. |
| `feature.subline` | Subline · text | Supporting operator text. |

Names/images are read from the panel's resolved `references`, not from guessed
identities embedded in IDs. Live statistics require an exact matching identity.
When several selections are filled, player takes priority over team, then match.
Clear all three to show the actual observed player. A selected match outside the
active snapshot has only its public reference; the HUD does not fetch a second
live game. Unavailable references remain visibly unavailable. These controls do
not activate another sOU match, edit a roster, or move the spectator camera.

### Branding

| Field ID | UI label / type | Effect |
| --- | --- | --- |
| `branding.logo` | Broadcast logo · image | Optional local broadcast mark. |
| `branding.sponsors` | Additional sponsors · images | Up to 16 optional local sponsor images alongside actual competition sponsors. |

The sponsor rail rotates through unique competition/additional images every eight
seconds. Choose media in sOU rather than entering external image URLs. Neither a
logo nor a sponsor selection grants rights to an image; use material you may broadcast.

### Radar overview (optional)

| Field ID | UI label / type | Effect |
| --- | --- | --- |
| `radar.overview` | Local overview image · image | Optional local map image for which you hold the necessary rights. |
| `radar.mapName` | Exact map name · text | Must match the current source map name exactly, for example `de_mirage`. |
| `radar.minX` | World X at image left · text | Finite world coordinate at the image's left edge. |
| `radar.maxX` | World X at image right · text | Finite coordinate greater than `minX`. |
| `radar.minY` | World Y at image bottom · text | Finite world coordinate at the bottom edge. |
| `radar.maxY` | World Y at image top · text | Finite coordinate greater than `minY`. |

Without a valid image, exact map match and all four valid bounds, the radar stays
in **relative world-position** mode. It has no guessed map geometry. Coordinates
are native CS2 world units, not meters; negative coordinates are valid. Calibrate
the image edges rather than choosing a visual scale by eye:

```text
horizontal fraction = (worldX - minX) / (maxX - minX)
vertical fraction   = (maxY - worldY) / (maxY - minY)
```

This simple axis-aligned projection does not rotate an overview or determine
multi-floor layers. Use an appropriately oriented local image and check known
positions. No Valve overview images, third-party HUD radar assets or GPL map
projection tables are bundled. The display labels its source and calibration
mode. A fresh HLAE radar is used only on the compatible timeline; stale or
incompatible radar data cannot override the GSI fallback. Missing position and
orientation values remain missing.

## Optional local metadata and media

The normal snapshot is authoritative for the active match and game. It does not
contain a complete prematch roster or general player portrait fields. The HUD
can supplement it using the existing same-origin, browser-session-protected
`GET /hud-browser/options` response:

- `players[steamId]`: optional player `name`, `avatar` and `camera` metadata.
- `match.left` / `match.right`: team `id`, `name`, `shortName`, `logo` and `steamIds`.

Metadata is usable only for the matching active match/team identities. It is
neither a second live-state stream nor a reason to reuse an old match's roster.
A match/session change discards stale profile associations. There is at most one
request at a time, a three-second timeout and a 256 KiB response limit; another
poll follows two seconds after completion. Requests are cancellable and fail
independently: unavailable metadata leaves normal snapshot and panel displays
working. No URL, account token, diagnostic token or embedded credentials need
to be configured.

Images must be local `/cast-media/` references and are resolved through the
public SDK's media helper. External, cross-origin and malformed paths are
rejected. Camera URLs in metadata are not embedded automatically. Failed image
loads use a neutral fallback, never someone else's portrait.

## Build, verify and package

Requirements: **Node.js 22.13+**, npm and the **.NET 10 SDK** for the public
packaging tool. Use a supported Node LTS release; the workflow uses Node 24.
Versions and dependency integrity are pinned. No private sOU repository or
publication credentials are needed.

```sh
npm ci
npm run sdk:verify
npm run lint
npm test
npm run package
```

`npm run package` builds the renderer, restores the repository-local public
`SOU.Hud.Tool` **0.2.0-preview.4**, then packs and validates:

```text
artifacts/sou-basic-react-0.2.0.souhud
artifacts/sou-basic-react-0.2.0.souhud.sha256
```

`npm run build` creates `dist/hud.json` and `dist/wwwroot` without packaging.
The archive includes the HUD, SDK and production dependency licenses. Its
filename comes from the manifest ID/version. Keep `hud.json` and `package.json`
aligned when changing a version. ZIP timestamps can make independent rebuilds
differ; verify a download against its own published checksum, not a local rebuild.
Never overwrite an already published tag or package.

## Public NuGet SDK usage

A browser cannot execute a C# NuGet assembly. This React project uses the official
browser client, SignalR bundle and generated contracts shipped **inside the
public [SOU.Hud.Templates 0.2.0-preview.4 package](https://www.nuget.org/packages/SOU.Hud.Templates/0.2.0-preview.4)**.
The unchanged files are committed under `public/sdk`; JavaScript/JSDoc uses the
generated `contracts.d.ts`. Transport code is separate from display selectors
and React components. There is no unofficial npm SDK or private project link.

`npm run sdk:sync` downloads that exact NuGet version, verifies its pinned gallery
archive SHA-256, then copies only the explicitly listed SDK/license files:

```text
a403a12ab076e3aef341777ee724f66d51e7a530e540193a5ab1308848c56fd9
```

`npm run sdk:verify` compares committed files with that same verified public
release without changing them. The hash is for NuGet's signed public archive,
not the pre-upload package. Upgrading requires an intentional version/hash review.
The other consumed NuGet package is **SOU.Hud.Tool 0.2.0-preview.4**, pinned in
`.config/dotnet-tools.json` and used for the real `.souhud` package validation.

The [Blazor WebAssembly sibling](https://github.com/getsOU/sOU-HUD-WASM) uses the
public [SOU.Hud.Sdk](https://www.nuget.org/packages/SOU.Hud.Sdk/0.2.0-preview.4)
and [SOU.Live.Contracts](https://www.nuget.org/packages/SOU.Live.Contracts/0.2.0-preview.4)
assemblies. Both HUDs use the same SDK version and protocol-v2 data conventions.

## Local development and explicit preview

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5192/?preview=1** for the explicitly labeled synthetic
preview. Choose any view with `?preview=live`, `?preview=prematch`,
`?preview=lineups`, `?preview=veto`, `?preview=break`, `?preview=postmatch`,
`?preview=statistics` or `?preview=spotlight`. Additional cases are
`?preview=waiting`, `?preview=bomb`, `?preview=unresolved`, `?preview=stale`
and `?preview=missing`. These make no sOU requests and never send fixtures into
a real cast.
Opening the development server without `preview` does not manufacture a game;
it shows the normal instruction to open the installed HUD from sOU. Production
builds exclude the fixture module, regardless of query parameters.

For a real data test, build/package/import a new version and use its sOU output.
There is no insecure cross-origin development proxy. Relative SDK, script, style
and media paths resolve under the installed package base, including all subviews.
The production renderer works with sOU's Content Security Policy, without inline
scripts, `eval`, remote fonts or runtime CDN requests.

## Architecture and meaningful checks

| Source | Responsibility |
| --- | --- |
| `src/model.js` | Shared missing-value formatting, source clock and explicit team/side resolution. |
| `src/model/panel.js` | Panel normalization and installed subview selection. |
| `src/model/showcase.js` | Pure lineup, series, statistics, economy, event and radar selectors. |
| `src/model/metadata.js` | Narrow optional metadata adapter and bounded same-origin polling. |
| `src/hud-store.js` | Shared SDK lifetime, session/timeline replacement, panel actions and presentation time. |
| `src/ui/` | Reusable React components and view compositions. |
| `src/preview/` | Explicit development-only synthetic examples. |
| `public/panel.json` | The actual public panel schema, using all nine supported field types. |
| `scripts/` | Verified public SDK import, package assembly, validation and release guards. |

The public SDK owns browser-session setup and separate live/panel SignalR
subscriptions. The React store shares a single stream pair across subscribers,
tracks mount generations, aborts streams/metadata work on final disposal, and
rejects callbacks from previous lifetimes. Each new session replaces previous
live/radar/event/transient presentation state rather than merging matches.
Replayable panel configuration and one-shot actions are handled separately.

Display selectors stay pure and components consume prepared values. Tests cover
missing/unrecognized data, side swaps, observer ordering, honest totals and
recording coverage; radar calibration/source fallback; explicit map decisions;
panel references, host-initialized false values, caption-only saves and independent
hide controls; action identity/replay and session/lifetime cleanup. The build
checks the unchanged public SDK and validates the actual installable archive.

A successful automated build or synthetic browser check is not native CS2/OBS
acceptance. Check real GSI/HLAE, output transparency, frame behavior, performance,
reconnects and your own overlays in the target setup before a live cast.

## Earlier corrections retained

**0.1.2: visible standard player displays.** sOU initializes a missing checkbox to
`false`. The earlier Show controls hid the roster/observed card on normal panel
initialization and caption-only saves. Since 0.1.2, `display.hideRosters` and
`display.hideObservedPlayer` hide only when explicitly checked. Those IDs and the
caption remain supported in 0.2.0. When upgrading from 0.1.0/0.1.1, set any desired
Hide options once; the old Show IDs are not reused.

**0.1.1: transparent host-frame canvas.** The original 0.1.0 forced a dark root
color scheme, which could make the browser paint an opaque full-screen canvas
inside the output frame, including the native overlay. The forced scheme was
removed in 0.1.1 and stays removed. Component surfaces may be dark, while the
document and open game area stay transparent. Test the actual package in its
normal host frame over a visible background; computed CSS alone is insufficient.

## License and author references

This HUD's own code is **MIT**. Preserve `LICENSE`, `THIRD-PARTY-NOTICES.md` and
included dependency notices when reusing it. SDK/SignalR/React licenses are
included in the packaged output. No third-party broadcast HUD layout, weapon
icons, player photos, fonts or radar data are copied. Media you select separately
retains its own rights. Use of sOU names grants no separate trademark rights.

[Author guide](https://www.getsou.app/docs/hud-entwicklung) ·
[Live API](https://www.getsou.app/docs/hud-api) ·
[Types](https://www.getsou.app/docs/hud-vertragstypen) ·
[Panels](https://www.getsou.app/docs/hud-panel-referenz) ·
[Package format](https://www.getsou.app/docs/hud-paketformat)

## Publish a new version

Update manifest/project versions together, run the checks above and review the
source on `main`. A matching new `vVERSION` tag runs the checks again and publishes
that run's verified `.souhud` plus SHA-256 as a GitHub Release. Ordinary branch and
pull-request builds retain artifacts without publishing a release. Guards bind
the repository, event, tag, manifest and archive hash; existing releases are not
replaced. Only the release job has the short-lived write token needed to create
assets; no personal token or NuGet publication credential is required.
