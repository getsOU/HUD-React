sOU Showcase HUD · React 0.2.0

The former small Basic HUD is now a modular CS2 broadcast reference with eight
views: Live, Prematch, Lineups, Map veto, Break, Results, Statistics and Spotlight.
The immutable package ID remains sou-basic-react.

- Live overlay with side-correct teams/logos, detailed rosters, observed player,
  source round/bomb state, honest economy, round history and real-event killfeed.
- Own MIT radar for fresh compatible HLAE data with GSI fallback; a labeled
  relative-world view by default, with optional local calibrated overview.
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
to this HUD's own code; all SDK/SignalR/React notices ship with the archive.

Download the .souhud and import it through sOU → HUDs → Paket importieren.
Use sOU's generated output URL for OBS (1920 × 1080). Select a dedicated subview
through sOU or set Display → Main output scene for the main output. Leave Hide
checkboxes unchecked to show their components. The SHA-256 file identifies the
exact archive; do not compare a download with an independently rebuilt ZIP.

The visible player defaults from 0.1.2 and transparent canvas correction from
0.1.1 remain in place. Existing versions, tags, archives and settings are not
replaced. Install 0.2.0 and open a new output for the new files.

No guessed MVPs, rosters, winners, picks/bans, damage or win probabilities. The
optional overview needs your own permitted local image and correct calibration.
Builds and isolated synthetic checks do not replace native CS2/OBS acceptance;
verify your actual GSI/HLAE and broadcast setup before a live cast.

See README for all eight views, every panel field, data sources, limits,
calibration, public SDK provenance and reproducible build/package commands.
