export type BotStatus = 'idle' | 'running' | 'done' | 'error';

export interface Bot {
  id: string;
  name: string;
  description: string;
  lastRun: string | null;
  status: BotStatus;
  scriptPath: string;
}

export interface Execution {
  id: string;
  botId: string;
  botName: string;
  status: BotStatus;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string;
  result: string | null;
}

export interface LogEntry {
  id: string;
  executionId: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
