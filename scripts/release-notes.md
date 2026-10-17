sOU Showcase HUD · React 0.3.0

Compact Live with automatic map radar and local weapon/equipment icons. The
package ID remains sou-basic-react; all eight views remain available: Live,
Prematch, Lineups, Map veto, Break, Results, Statistics and Spotlight.

- Fixed 1920 × 1080 reference composition scales proportionally: compact edge
  header, five two-line cards per side, economy footers, small observer card,
  series/history indicators, sponsor rail and bounded real-event killfeed.
- Active weapons, utility, armor/helmet/kit/bomb and killfeed flags use local
  icons instead of technical inventory text boxes. Detailed equipment, round
  statistics and recording coverage stay in the presentation views.
- Automatic calibrated overviews for 14 exact map identifiers, including Dust2;
  17 local PNGs include explicit lower-floor layers. Fresh compatible HLAE data
  takes priority over GSI. A valid local custom override still takes priority;
  unknown or failed maps are explicitly labeled relative-position fallbacks.
- Missing optional Live portraits/logos leave no replacement box. Presentation
  views retain neutral image fallbacks. Source player-name entities decode once
  as ordinary text; profile/operator text is unchanged.
- Actual match/series/veto/results and competition branding, including before GSI.
- Recorded-stat coverage, optional matching local roster/portrait metadata and
  safe SDK-resolved media; missing values and identities remain explicit.
- Complete HUD panel with scene selection, Hide controls, featured references,
  local branding, manual ticker/status labels and a deduplicated lower-third
  Show/Hide action that is not replayed on reconnect.
- Separate pure selectors, shared live/panel lifetime, reset on session change,
  explicit synthetic development previews and production packages without fixtures.

The public SOU.Hud.Templates and SOU.Hud.Tool NuGet packages remain pinned to
0.2.0-preview.4. The browser SDK files are unchanged and hash verified. MIT applies
to this HUD's own code; all SDK/SignalR/React/he notices ship with the archive.
Original CS2 equipment/UI/killfeed graphics, overviews and calibration are
separately attributed to Valve Corporation and the respective creators; they
are not relicensed as MIT. licenses/VALVE-ASSETS.md and licenses/valve-assets.json
document the source game build, original entries and hashes and ship with the
package. No GPL HUD assets or renderers are copied.

Download the .souhud and import it through sOU → HUDs → Paket importieren.
Use sOU's generated output URL for OBS (1920 × 1080). Select a dedicated subview
through sOU or set Display → Main output scene for the main output. Leave Hide
checkboxes unchecked to show their components. The SHA-256 file identifies the
exact archive; do not compare a download with an independently rebuilt ZIP.

The visible player defaults from 0.1.2 and transparent canvas correction from
0.1.1 remain in place. Existing versions, tags, archives and settings are not
replaced. Install 0.3.0 and open a new output for the new files. Existing panel
field IDs remain supported; no new SDK or sOU desktop version is required.

No guessed MVPs, rosters, winners, picks/bans, damage or win probabilities. Leave
radar override fields empty to use the bundled exact-map catalog. Custom images
need their own applicable rights and correct world bounds. Game patches may
require an artwork/calibration update.

Review the actual package over visible gameplay, including all five cards and
Dust2; a build or checkerboard image alone does not establish live usability.
Isolated browser checks do not replace native CS2/OBS acceptance. Verify your
actual GSI/HLAE and broadcast setup before a live cast.

See README for all eight views, every panel field, data sources, limits,
calibration, public SDK provenance and reproducible build/package commands.
