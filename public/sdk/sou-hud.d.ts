import type { LiveSnapshot, HudPanelMessage } from './contracts';
export * from './contracts';
export type HudConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'stopped';
export interface WatchOptions {
  signal?: AbortSignal;
  status?: (channel: 'live' | 'panel', status: HudConnectionStatus) => void;
  error?: (error: unknown) => void;
}
export class HudClient {
  constructor(address?: string);
  readonly identity: Readonly<{ id: string; version: string }>;
  media(path: string): string;
  watch(receive: (snapshot: LiveSnapshot) => void, options?: WatchOptions): () => void;
  watchPanel(receive: (message: HudPanelMessage) => void, options?: WatchOptions): () => void;
}
