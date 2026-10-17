import { packageAsset } from './assets.js';
import { radarView } from './showcase.js';

/** A failed custom image falls back to the known map; failed package art stays unavailable. */
export function radarPresentation(state, failedImages = []) {
  const failed = new Set(failedImages);
  const requested = state.media(state.settings.radar.overview);
  const config = requested && !failed.has(requested) ? state.settings.radar : { ...state.settings.radar, overview: '' };
  let view = radarView(state.snapshot, config, state.now, state.radarTimelineAccepted, state.radarCatalog, state.radarFlashes);
  let overview = view.packagedOverview ? packageAsset(view.overview, state.assetBase) : state.media(view.overview);
  if (overview && failed.has(overview)) {
    view = radarView(state.snapshot, { ...config, overview: '' }, state.now, state.radarTimelineAccepted, undefined, state.radarFlashes);
    overview = null;
  }
  return { view, overview };
}
