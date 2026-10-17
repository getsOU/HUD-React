# 0.4.2

Match NYXIA radar behavior: 50 ms linear player/projectile movement, stable marker identities and resets at source, session, map, round and floor boundaries. A fresh HLAE player frame is authoritative as a whole; missing HLAE pawns no longer jump to older GSI positions. GSI is used only when that frame is absent or expires at 750 ms. The WASM renderer also refreshes its clock on receipt, preventing new HLAE frames from being incorrectly rejected against an old timestamp.

Map series now show the explicit pick team, or DECIDER, in Live and presentation views. Pick ownership follows veto MapId and TeamId, independently of current CT/T sides. Missing or conflicting decisions remain unresolved.

Import 0.4.2 and reopen the output. Existing releases, panel values, all eight views, original Boltobserv assets, GPL terms and public MIT SDK 0.2.0-preview.4 are preserved. Browser movement checks do not replace native CS2/OBS acceptance.
sOU Broadcast HUD · React 0.4.1

Fix missing weapons being displayed as unknown equipment.

- Dead players no longer show stale current weapons, ammunition or inventory
  icons in rosters, the observer card or expanded Spotlight.
- Living unarmed players leave the current-weapon area empty, without an unknown
  box/name or ammunition placeholder. Explicitly empty and holstered-only
  inventories never reactivate a stale activeWeapon field.
- Real unknown active/reloading weapons retain their accessible unknown fallback.
  Missing health alone does not mean dead.

The layout, original Boltobserv integration, all eight views and panel settings
remain unchanged. The public SDK stays 0.2.0-preview.4. GPLv3 and the separate
upstream/dependency notices remain as in 0.4.0.

Import the .souhud through sOU → HUDs → Paket importieren and open a new output
for version 0.4.1. Previous packages, release tags and settings are preserved.
The SHA-256 sidecar identifies the exact download.

See README and CHANGELOG.md for behavior, public data limits and build steps.
Browser and automated checks do not replace native CS2/OBS acceptance.
