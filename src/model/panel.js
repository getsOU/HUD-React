export const SCENES = Object.freeze(['live', 'prematch', 'lineups', 'veto', 'break', 'postmatch', 'statistics', 'spotlight']);
const string = value => typeof value === 'string' ? value.trim() : '';
const reference = (state, name) => {
  const value = state?.references?.feature?.[name];
  return value && value.id === state?.values?.feature?.[name] ? value : null;
};

export function panelSettings(state) {
  const values = state?.values;
  const display = values?.display;
  const production = values?.production;
  const feature = values?.feature;
  const radar = values?.radar;
  const visible = field => display?.[field] !== true;
  return {
    caption: string(display?.caption),
    scene: SCENES.includes(display?.scene) ? display.scene : 'live',
    showRosters: visible('hideRosters'), showObservedPlayer: visible('hideObservedPlayer'),
    showRadar: visible('hideRadar'), showKillfeed: visible('hideKillfeed'), showEconomy: visible('hideEconomy'),
    showRoundHistory: visible('hideRoundHistory'), showSeries: visible('hideSeries'), showSponsors: visible('hideSponsors'),
    production: Object.fromEntries(['title', 'subtitle', 'ticker', 'replayLabel', 'lowerTitle', 'lowerSubtitle'].map(key => [key, string(production?.[key])])),
    feature: {
      playerId: string(feature?.player), teamId: string(feature?.team), matchId: string(feature?.match),
      player: reference(state, 'player'), team: reference(state, 'team'), match: reference(state, 'match'),
      headline: string(feature?.headline), subline: string(feature?.subline),
    },
    branding: { logo: string(values?.branding?.logo), sponsors: Array.isArray(values?.branding?.sponsors) ? values.branding.sponsors.filter(v => typeof v === 'string').slice(0, 16) : [] },
    radar: Object.fromEntries(['overview', 'mapName', 'minX', 'maxX', 'minY', 'maxY'].map(key => [key, string(radar?.[key])])),
  };
}

/** An explicit subview is independent of the main output's panel scene selection. */
export function sceneFor(address, selected = 'live') {
  const path = new URL(address).pathname.split('/').filter(Boolean);
  const marker = path.lastIndexOf('views');
  if (marker >= 0 && marker === path.length - 2 && SCENES.includes(path[marker + 1])) return path[marker + 1];
  return SCENES.includes(selected) ? selected : 'live';
}
