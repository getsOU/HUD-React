import { useState } from 'react';
import { number, statistic, text } from '../../model.js';
import { matchOf, startCountdown } from '../../model/showcase.js';
import { time } from '../../model.js';

export function LocalImage({ path, name = '', media, className = '', optional = false }) {
  const [failed, setFailed] = useState(null);
  const source = media?.(path);
  const initials = typeof name === 'string' && name.trim() && name !== '–'
    ? name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() : '?';
  return source && failed !== source ? <img className={`local-image ${className}`} src={source} alt={name} onError={() => setFailed(source)} />
    : optional ? null : <span className={`image-fallback ${className}`} aria-label={name || 'No image available'}>{initials}</span>;
}
export function Meter({ value, label }) {
  return number(value) === null ? <span className="meter unknown" aria-label={`${label} unknown`} />
    : <progress className="meter" max="100" value={Math.min(100, value)} aria-label={label} />;
}
export function Empty({ children }) { return <p className="empty-message">{children}</p>; }
export function NumberStat({ label, value }) { return <div><dt>{label}</dt><dd>{statistic(value)}</dd></div>; }
export function Competition({ state }) {
  const competition = matchOf(state.snapshot)?.competition;
  if (!competition && !state.settings.branding.logo) return null;
  return <div className="competition-brand">
    {state.settings.branding.logo && <LocalImage path={state.settings.branding.logo} name="Broadcast" media={state.media} />}
    {competition?.logo && <LocalImage path={competition.logo} name={competition.name} media={state.media} />}
    <div><strong>{competition?.name}</strong><span>{[competition?.seasonName, ...(competition?.sections ?? []).map(s => s.name), competition?.round].filter(Boolean).join(' / ')}</span></div>
  </div>;
}
export function SceneHeader({ state, title, subtitle }) {
  return <header className="scene-heading"><Competition state={state} /><p className="eyebrow">{state.settings.caption}</p>
    <h1>{state.settings.production.title || title}</h1><p>{state.settings.production.subtitle || subtitle}</p></header>;
}
export function MatchTeams({ state }) {
  const match = matchOf(state.snapshot);
  if (!match) return <Empty>No active match selected</Empty>;
  return <div className="match-teams">{[match.teamA, match.teamB].map((team, i) => <section key={team?.id ?? i}>
    <LocalImage path={team?.logo} name={text(team?.name)} media={state.media} />
    <h2>{text(team?.name)}</h2><p>{text(team?.shortName)}</p><strong>{statistic(team?.seriesWins)}</strong><span>series maps won</span>
  </section>)}<div className="match-format">BEST OF {statistic(match.bestOf)}<small>{text(match.name)}</small></div></div>;
}
export function ScheduledStart({ state }) {
  const match = matchOf(state.snapshot);
  const remaining = startCountdown(state.snapshot, state.now);
  if (remaining === null) return <p className="scheduled-start">Start time not set</p>;
  const date = new Date(match.startsAt);
  return <div className="scheduled-start"><span>{date.toLocaleString()}</span><strong>{remaining > 0 ? `Starts in ${time(remaining)}` : 'Scheduled start time reached'}</strong></div>;
}
export function Production({ state }) {
  const content = state.settings.production;
  return <>
    {content.replayLabel && <div className="manual-status">{content.replayLabel}</div>}
    {content.ticker && <div className="ticker">{content.ticker}</div>}
    {state.lowerThirdVisible && <section className="lower-third"><strong>{content.lowerTitle || 'Live production'}</strong><span>{content.lowerSubtitle}</span></section>}
  </>;
}
export function Connection({ state }) {
  const freshness = text(state.snapshot?.freshness, 'waiting');
  const connected = state.liveStatus === 'connected';
  return <aside className={`connection ${connected && freshness === 'live' ? 'live' : ''}`} aria-label="HUD status" role="status">
    {state.preview && <strong>LOCAL PREVIEW</strong>}<span className="status-dot" />
    <span>{state.message ?? (connected ? `DATA · ${freshness.toUpperCase()}` : `LIVE · ${state.liveStatus.toUpperCase()}`)}</span>
    {state.panelStatus !== 'connected' && <span> · PANEL {state.panelStatus.toUpperCase()}</span>}
  </aside>;
}
export function Sponsors({ state }) {
  if (!state.settings.showSponsors) return null;
  const items = [...(matchOf(state.snapshot)?.competition?.sponsors ?? []), ...state.settings.branding.sponsors.map((image, i) => ({ id: `panel-${i}`, image, name: 'Broadcast sponsor' }))];
  const unique = items.filter((item, i) => item?.image && items.findIndex(candidate => candidate.image === item.image) === i);
  if (!unique.length) return null;
  const item = unique[Math.floor(state.now / 8000) % unique.length];
  return <aside className="sponsor-rail"><LocalImage path={item.image} name={item.name} media={state.media} /><span>{item.name}</span></aside>;
}
