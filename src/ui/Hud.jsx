import { sceneFor } from '../model.js';
import { Competition, Connection, Production, Sponsors } from './components/Common.jsx';
import { Economy, KillFeed, MapSeries, RoundHistory, RoundSituation, Scoreboard } from './components/Match.jsx';
import { ObservedPlayer, Roster } from './components/Players.jsx';
import { Radar } from './components/Radar.jsx';
import { Break, Lineups, Postmatch, Prematch, Spotlight, Statistics, Veto } from './views/Scenes.jsx';

function Live({ state }) {
  return <><div className="live-brand"><Competition state={state} /></div><Scoreboard state={state} /><Radar state={state} /><KillFeed state={state} /><RoundHistory state={state} /><RoundSituation state={state} />
    {!state.snapshot?.game && <p className="waiting">WAITING FOR GAME DATA</p>}
    {state.settings.showRosters && <><Roster state={state} side="counterTerrorists" /><Roster state={state} side="terrorists" /></>}
    {state.settings.showEconomy && <><Economy state={state} side="counterTerrorists" /><Economy state={state} side="terrorists" /></>}
    {state.settings.showSeries && <MapSeries state={state} compact />}{state.settings.showObservedPlayer && <ObservedPlayer state={state} />}</>;
}
const views = { live: Live, prematch: Prematch, lineups: Lineups, veto: Veto, break: Break, postmatch: Postmatch, statistics: Statistics, spotlight: Spotlight };
export function Hud({ state, address = location.href }) {
  const scene = sceneFor(address, state.previewScene || state.settings.scene);
  const View = views[scene];
  return <main className={`stage view-${scene}`} aria-label={`sOU Showcase HUD · ${scene}`}>
    <View state={state} /><Sponsors state={state} /><Production state={state} /><Connection state={state} /><span className="signature">sOU / SHOWCASE</span>
  </main>;
}
