// Canonical event ledger types, ported from BOT server/eventLedger.ts (North Star M1).
// Persistence adapters live outside foundation; this file is types only.

export type CanonicalEventType =
  | 'SYSTEM'
  | 'EVIDENCE'
  | 'STRATEGY'
  | 'COUNCIL'
  | 'DECISION'
  | 'RISK'
  | 'ORDER'
  | 'TRADE'
  | 'OUTCOME'
  | 'EXPERIMENT'
  | 'AI';

export type CanonicalEventInput = {
  eventKey: string;
  occurredAt: number | string;
  runtimeId?: string | null;
  eventType: CanonicalEventType;
  eventName: string;
  market?: string | null;
  strategyId?: string | null;
  strategyVersion?: string | null;
  action?: string | null;
  summary: string;
  reason?: string | null;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  authority?: string;
  executionAuthority?: boolean;
  source: string;
  trace?: Record<string, unknown> | null;
  links?: Record<string, unknown> | null;
};

export type CanonicalEventRow = {
  id: string;
  eventKey: string;
  occurredAt: number;
  recordedAt: number;
  runtimeId: string | null;
  eventType: CanonicalEventType;
  eventName: string;
  market: string | null;
  strategyId: string | null;
  strategyVersion: string | null;
  action: string | null;
  summary: string;
  reason: string | null;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  authority: string;
  executionAuthority: boolean;
  source: string;
  trace: Record<string, unknown>;
  links: Record<string, unknown>;
  schemaVersion: number;
};
