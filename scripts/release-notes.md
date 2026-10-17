sOU Basic HUD · React 0.1.2 — visible roster and observed-player defaults

Team rosters and the observed-player card are visible by default, including
after the initial panel state arrives and after saving only a new caption.

The host initializes unchecked panel checkboxes to false. Earlier versions
used Show fields, which incorrectly hid those components for that normal
initial state. The new Hide team rosters and Hide observed player fields hide
only when checked. Uncheck and save to show the corresponding component again.

Import 0.1.2 and open a new output. Your caption carries over. The visibility
fields have new IDs, so select any desired Hide option once in the new version
and save. Existing 0.1.0 and 0.1.1 packages remain unchanged. No host or SDK
update is required. The transparency correction from 0.1.1 is retained.

An MIT-licensed basic CS2 HUD using the public sOU SDK.

- Transparent scoreboard, map, round and reported countdown/bomb state.
- CT/T player rosters and observed-player information.
- Live caption and visibility settings in the sOU HUD panel.
- Explicit missing, waiting, stale and connection states.

Download the `.souhud` file and import it in **sOU → HUDs → Paket importieren**.
Use the browser-output URL provided by sOU for OBS (1920 × 1080).
The adjacent `.sha256` file records the exact package checksum.

Builds and model/lifecycle tests cover the actual panel schema, host-normalized
false values, caption-only saves and each visibility control. Isolated browser
checks use synthetic data. Test your own CS2/OBS setup before a live cast.
This release does not claim a native CS2/OBS acceptance test.

See the repository README for prerequisites, source builds, customization and
the public SDK packages. Package versions are immutable.
