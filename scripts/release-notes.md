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
