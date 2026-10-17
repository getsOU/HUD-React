sOU Basic HUD · React 0.1.1 — transparency correction

Fixes the opaque full-screen background reported in the native CS2 overlay.
Version 0.1.0 forced a dark document color scheme that differed from the sOU
output frame's scheme, causing the browser to paint an opaque canvas. This
release removes that document-level color-scheme override; the scoreboard,
roster and observed-player panel colors remain unchanged.

Import 0.1.1 and open a new output to use the corrected package. Existing 0.1.0
files and outputs are immutable and retain their original behavior.

An MIT-licensed basic CS2 HUD using the public sOU SDK.

- Transparent scoreboard, map, round and reported countdown/bomb state.
- CT/T player rosters and observed-player information.
- Live caption and visibility settings in the sOU HUD panel.
- Explicit missing, waiting, stale and connection states.

Download the `.souhud` file and import it in **sOU → HUDs → Paket importieren**.
Use the browser-output URL provided by sOU for OBS (1920 × 1080).
The adjacent `.sha256` file records the exact package checksum.

Builds, model/lifecycle tests and isolated protocol-v2/CSP browser checks were
performed with synthetic data. Test your own CS2/OBS setup before a live cast.
This release does not claim a native CS2/OBS acceptance test.

See the repository README for prerequisites, source builds, customization and
the public SDK packages. Package versions are immutable.
