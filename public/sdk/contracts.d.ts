// Generated from SOU.Live.Contracts by sou-hud types. Do not edit.
export interface BombState {
  state: BombStatus | null;
  playerSteamId: string | null;
  position: Vector3State | null;
  secondsRemaining: number | null;
}
export type BombStatus = "unknown" | "carried" | "dropped" | "planting" | "planted" | "defusing" | "defused" | "exploded";
export type CompetitionSectionKind = "unknown" | "region" | "division" | "phase" | "group" | "round" | "other";
export type CountdownPhase = "unknown" | "warmup" | "freezeTime" | "live" | "over" | "bomb" | "defuse" | "timeoutCounterTerrorists" | "timeoutTerrorists" | "paused" | "gameOver";
export interface CountdownState {
  phase: CountdownPhase | null;
  secondsRemaining: number | null;
}
export type DataFreshness = "unknown" | "waiting" | "live" | "stale" | "disconnected";
export type DraftStatus = "unknown" | "live";
export interface DraftTeam {
  id: number | null;
  name: string | null;
}
export type FeedConnectionStatus = "unknown" | "connecting" | "connected" | "disconnected";
export interface FlamePoint {
  id: string;
  position: Vector3State;
}
export type GameMode = "unknown" | "competitive" | "casual" | "deathmatch" | "wingman" | "armsRace" | "demolition" | "custom" | "cooperative" | "skirmish" | "training" | "scrimCompetitive5v5";
export interface GameState {
  map: string | null;
  phase: MatchPhase | null;
  roundNumber: number | null;
  roundPhase: RoundPhase | null;
  ct: SideState | null;
  t: SideState | null;
  observedPlayer: PlayerState | null;
  players: Array<PlayerState>;
  managedMatch: ManagedMatch | null;
  radar: RadarState | null;
  killFeed: Array<KillFeedEntry>;
  mapKind: MapKind | null;
  provider: ProviderState | null;
  tournamentDraft: TournamentDraftState | null;
  matchesToWinSeries: number | null;
  currentSpectators: number | null;
  souvenirsTotal: number | null;
  roundWinReason: RoundWinReason | null;
  availableSections: Array<GsiSection>;
  currentPlayer: PlayerState | null;
  mode: GameMode | null;
  roundWinner: TeamSide | null;
  roundBomb: BombStatus | null;
  roundWins: Array<RoundResult> | null;
  countdown: CountdownState | null;
  bomb: BombState | null;
  grenades: Array<GrenadeState> | null;
}
export type GrenadeKind = "unknown" | "smoke" | "flashbang" | "highExplosive" | "molotov" | "incendiary" | "decoy" | "inferno" | "firebomb";
export interface GrenadeState {
  id: string;
  type: GrenadeKind | null;
  ownerSteamId: string | null;
  position: Vector3State | null;
  velocity: Vector3State | null;
  lifetimeSeconds: number | null;
  effectTimeSeconds: number | null;
  flames: Array<FlamePoint> | null;
}
export type GsiSection = "unknown" | "provider" | "map" | "round" | "player" | "allPlayers" | "phaseCountdowns" | "bomb" | "grenades" | "tournamentDraft";
export interface HudPanelAction {
  id: string;
  section: string;
  name: string;
  value: string | null;
}
export interface HudPanelChoice {
  name: string;
  label: string;
}
export type HudPanelFieldType = "text" | "checkbox" | "select" | "player" | "team" | "match" | "image" | "images" | "action";
export interface HudPanelInput {
  type: HudPanelFieldType;
  name: string;
  label: string;
  values: Array<HudPanelChoice> | null;
}
export interface HudPanelMessage {
  hudId: string;
  version: string;
  state: HudPanelState | null;
  action: HudPanelAction | null;
}
export interface HudPanelReference {
  id: string;
  name: string | null;
  image: string | null;
  teamId: string | null;
  missing: boolean;
}
export interface HudPanelSection {
  name: string;
  label: string;
  inputs: Array<HudPanelInput>;
}
export interface HudPanelState {
  revision: number;
  values: Record<string, Record<string, unknown>>;
  references: Record<string, Record<string, HudPanelReference>>;
}
export interface KillFeedEntry {
  id: number;
  connectionId: string;
  epoch: number;
  gameTimeSeconds: number;
  killer: KillParticipant | null;
  victim: KillParticipant;
  assister: KillParticipant | null;
  weapon: string;
  weaponKind: WeaponKind;
  flashAssist: boolean;
  headshot: boolean;
  wallbang: boolean;
  attackerBlind: boolean;
  throughSmoke: boolean;
  noScope: boolean;
}
export interface KillParticipant {
  entityIndex: number;
  steamId: string | null;
  name: string | null;
  side: TeamSide | null;
}
export interface LiveSnapshot {
  schemaVersion: number;
  sessionId: string;
  revision: number;
  receivedAt: string | null;
  freshness: DataFreshness;
  game: GameState | null;
  managedMatch: ManagedMatch | null;
}
export interface LocalDiagnostics {
  accepted: number;
  rejected: number;
  subscribers: number;
  snapshot: LiveSnapshot;
}
export interface ManagedCompetition {
  id: string;
  name: string;
  seasonId: string | null;
  seasonName: string | null;
  sections: Array<ManagedCompetitionSection>;
  round: string | null;
  logo: string | null;
  sponsors: Array<ManagedCompetitionSponsor> | null;
  sectionId: string | null;
  structure: ManagedCompetitionStructure | null;
}
export interface ManagedCompetitionSeason {
  id: string;
  competitionId: string;
  name: string;
}
export interface ManagedCompetitionSection {
  id: string;
  name: string;
  kind: CompetitionSectionKind;
}
export interface ManagedCompetitionSponsor {
  id: string;
  name: string;
  image: string;
}
export interface ManagedCompetitionStructure {
  seasons: Array<ManagedCompetitionSeason>;
  sections: Array<ManagedCompetitionStructureSection>;
}
export interface ManagedCompetitionStructureSection {
  id: string;
  competitionId: string;
  seasonId: string | null;
  parentId: string | null;
  name: string;
  kind: CompetitionSectionKind;
}
export interface ManagedMatch {
  id: string;
  name: string;
  bestOf: number;
  teamA: ManagedTeam;
  teamB: ManagedTeam;
  ct: TeamSideResolution;
  t: TeamSideResolution;
  startsAt: string | null;
  maps: Array<ManagedMatchMap>;
  vetos: Array<ManagedVeto>;
  competition: ManagedCompetition | null;
}
export interface ManagedMatchMap {
  id: string;
  name: string;
  gameName: string;
  number: number;
  kind: MapKind | null;
  status: MapResultStatus | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerTeamId: string | null;
}
export interface ManagedTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  seriesWins: number;
}
export interface ManagedVeto {
  mapId: string;
  name: string;
  gameName: string;
  type: MapDecisionKind;
  teamId: string | null;
  number: number;
  playNumber: number | null;
}
export type MapDecisionKind = "unknown" | "pick" | "ban" | "decider";
export type MapKind = "unknown" | "dust2" | "mirage" | "inferno" | "nuke" | "overpass" | "ancient" | "anubis" | "vertigo" | "train" | "cache" | "office" | "italy" | "assault" | "aztec" | "cobblestone" | "tuscan" | "canals" | "agency" | "baggage" | "shoots" | "lake" | "safehouse" | "shortDust" | "shortNuke" | "rialto" | "stMarc" | "bank" | "sugarcane" | "monastery" | "dizzy";
export type MapResultStatus = "unknown" | "pending" | "live" | "completed";
export type MatchPhase = "unknown" | "warmup" | "live" | "intermission" | "gameOver";
export interface MatchStats {
  kills: number | null;
  assists: number | null;
  deaths: number | null;
  mvps: number | null;
  score: number | null;
}
export type PlayerActivity = "unknown" | "menu" | "playing" | "textInput";
export interface PlayerState {
  steamId: string | null;
  name: string | null;
  side: TeamSide | null;
  activity: PlayerActivity | null;
  health: number | null;
  activeWeapon: WeaponState | null;
  isAlive: boolean | null;
  clan: string | null;
  xpOverloadLevel: number | null;
  spectationTargetSteamId: string | null;
  observerSlot: number | null;
  armor: number | null;
  helmet: boolean | null;
  defuseKit: boolean | null;
  money: number | null;
  equipmentValue: number | null;
  flashed: number | null;
  smoked: number | null;
  burning: number | null;
  roundKills: number | null;
  roundHeadshotKills: number | null;
  roundDamage: number | null;
  position: Vector3State | null;
  forward: Vector3State | null;
  stats: MatchStats | null;
  recordedStats: RecordedPlayerStats | null;
  weapons: Array<WeaponState> | null;
}
export interface ProviderState {
  name: string | null;
  appId: number;
  version: number | null;
  steamId: string | null;
  timestampUnixSeconds: number | null;
}
export interface RadarPlayer {
  steamId: string;
  pawnHandle: number;
  position: Vector3State;
  forward: Vector3State;
  health: number;
}
export interface RadarState {
  connectionId: string;
  epoch: number;
  sequence: number;
  gameTimeSeconds: number;
  receivedAt: string;
  players: Array<RadarPlayer>;
}
export interface RecordedPlayerStats {
  rounds: number;
  damage: number;
  kills: number;
  headshotKills: number;
  coversWholeMatch: boolean;
  headshotPercentage: number | null;
  averageDamagePerRound: number | null;
}
export type RoundPhase = "unknown" | "freezeTime" | "live" | "over";
export interface RoundResult {
  roundNumber: number;
  winner: TeamSide;
  reason: RoundWinReason;
}
export type RoundWinReason = "unknown" | "elimination" | "bombExploded" | "bombDefused" | "timeExpired" | "hostageRescued";
export interface SideState {
  name: string | null;
  score: number | null;
  flag: string | null;
  consecutiveRoundLosses: number | null;
  timeoutsRemaining: number | null;
  matchesWon: number | null;
}
export type TeamRecognitionStatus = "unknown" | "noMatch" | "tied" | "conflicting" | "recognized" | "inferred" | "manual";
export type TeamSide = "unknown" | "counterTerrorists" | "terrorists" | "spectator";
export interface TeamSideResolution {
  side: TeamSide;
  status: TeamRecognitionStatus;
  teamId: string | null;
  teamAScore: number;
  teamBScore: number;
}
export interface TournamentDraftState {
  state: DraftStatus | null;
  eventId: number | null;
  eventName: string | null;
  stageId: number | null;
  stageName: string | null;
  firstTeam: DraftTeam;
  secondTeam: DraftTeam;
}
export interface Vector3State {
  x: number;
  y: number;
  z: number;
}
export type WeaponCategory = "unknown" | "knife" | "pistol" | "submachineGun" | "rifle" | "sniperRifle" | "shotgun" | "machineGun" | "grenade" | "bomb" | "equipment" | "stackableItem" | "tablet" | "fists" | "breachCharge" | "melee";
export type WeaponKind = "unknown" | "ak47" | "aug" | "awp" | "bayonet" | "ppBizon" | "c4" | "cz75Auto" | "desertEagle" | "decoy" | "dualBerettas" | "famas" | "fiveSeven" | "flashbang" | "g3Sg1" | "galilAr" | "glock18" | "healthshot" | "highExplosiveGrenade" | "p2000" | "incendiaryGrenade" | "defaultCtKnife" | "butterflyKnife" | "survivalKnife" | "paracordKnife" | "classicKnife" | "falchionKnife" | "flipKnife" | "gutKnife" | "navajaKnife" | "karambit" | "kukriKnife" | "m9Bayonet" | "nomadKnife" | "shadowDaggers" | "skeletonKnife" | "stilettoKnife" | "bowieKnife" | "defaultTKnife" | "huntsmanKnife" | "ursusKnife" | "talonKnife" | "goldenKnife" | "m249" | "m4A4" | "m4A1S" | "mac10" | "mag7" | "molotov" | "mp5Sd" | "mp7" | "mp9" | "negev" | "nova" | "p250" | "p90" | "r8Revolver" | "sawedOff" | "scar20" | "sg553" | "smokeGrenade" | "ssg08" | "zeusX27" | "tec9" | "ump45" | "uspS" | "xm1014";
export interface WeaponState {
  slot: string;
  name: string | null;
  type: WeaponCategory | null;
  state: WeaponStatus | null;
  paintKit: string | null;
  ammoClip: number | null;
  ammoClipMax: number | null;
  ammoReserve: number | null;
  kind: WeaponKind | null;
}
export type WeaponStatus = "unknown" | "active" | "holstered" | "reloading";
