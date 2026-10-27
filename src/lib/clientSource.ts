import { clientsData } from "@/data/clientsData";

export type AccountingProvider = "xero" | "quickbooks" | "sage";
export type ClientSourceIntegration = AccountingProvider | null;

const DEMO_DATA_SOURCES: Readonly<Record<string, "csv" | "source">> = {
  "COM-NEW-Dec312024": "csv",
  "COM-INPROGRESS-Dec312024": "source",
};

/** Exact client-name connections for demo engagements (exact match only, so "Cedar Point Logistics" stays unconnected). */
const DEMO_EXACT_CONNECTIONS: Readonly<Record<string, "xero" | "quickbooks">> = {
  "riverstone capital": "quickbooks",
};

/**
 * Resolve which accounting source a client is connected to.
 * Matches on legal entity name or short entity name (case/whitespace insensitive).
 * User-made connections/disconnections (overrides) win over demo seeds and client data.
 */
export function getClientSourceIntegration(clientName: string): ClientSourceIntegration {
  const normalized = (clientName || "").trim().toLowerCase();
  if (!normalized) return null;
  const client = clientsData.find(
    (c) =>
      c.legalEntityName.toLowerCase() === normalized ||
      c.entityName.toLowerCase() === normalized
  );
  const state = getClientConnectionState(clientName, client?.legalEntityName, client?.entityName);
  if (state !== undefined) return state;
  for (const n of [clientName, client?.legalEntityName, client?.entityName]) {
    const key = (n || "").trim().toLowerCase();
    if (key && DEMO_EXACT_CONNECTIONS[key]) return DEMO_EXACT_CONNECTIONS[key];
  }
  if (!client) return null;
  if (client.integration === "xero" || client.integration === "quickbooks") {
    return client.integration;
  }
  return null;
}

export const sourceLabel = (t: ClientSourceIntegration) =>
   t === "xero" ? "Xero" : t === "quickbooks" ? "QuickBooks Online" : t === "sage" ? "Sage" : "CSV";

/**
 * Resolve the source shown for an engagement: it reflects the Data Source the
 * user picked when creating/editing the engagement. CSV engagements always show
 * CSV even when the client has a live source connection.
 */
export function getEngagementSourceIntegration(
  engagementId: string,
  clientName: string
): ClientSourceIntegration {
  let dataSource: "csv" | "source" | undefined;
  try {
    const raw = localStorage.getItem(`engagement-meta-${engagementId}`);
    if (raw) dataSource = JSON.parse(raw)?.dataSource;
  } catch {}
  dataSource ??= DEMO_DATA_SOURCES[engagementId];
  if (dataSource === "csv") return null;
  // No saved selection (legacy engagement): fall back to the client's connection.
  if (dataSource !== "source" && dataSource !== undefined) return null;
  return getClientSourceIntegration(clientName);
}

/** The five scenario engagements shown on Dashboard and Engagements, in display order. */
export const VISIBLE_ENGAGEMENT_IDS: readonly string[] = [
  "COM-NEW-Dec312024",
  "COM-INPROGRESS-Dec312024",
];

/** Keep only the visible engagements, in the fixed scenario order. */
export function filterVisibleEngagements<T extends { id: string }>(list: T[]): T[] {
  const visibleSet = new Set<string>(VISIBLE_ENGAGEMENT_IDS);
  // Seeded engagements in fixed order, user-created engagements first
  const seeded = VISIBLE_ENGAGEMENT_IDS
    .map((id) => list.find((e) => e.id === id))
    .filter((e): e is T => !!e);
  const userCreated = list.filter((e) => !visibleSet.has(e.id));
  return [...userCreated, ...seeded];
}

// ── Client connection overrides (connections made after the demo was seeded) ──
const CONN_OVERRIDE_KEY = "client-connection-overrides";
export const CLIENT_CONNECTION_EVENT = "client-connection-changed";

type StoredConnection = AccountingProvider | "none";

function readOverrides(): Record<string, StoredConnection> {
  try {
    return JSON.parse(localStorage.getItem(CONN_OVERRIDE_KEY) || "{}");
  } catch {
    return {};
  }
}

const isProvider = (v: unknown): v is AccountingProvider =>
  v === "xero" || v === "quickbooks" || v === "sage";

/**
 * Client-level connection state saved by the user.
 * provider = connected, null = explicitly disconnected ("none"), undefined = no entry.
 */
export function getClientConnectionState(
  ...names: (string | undefined | null)[]
): AccountingProvider | null | undefined {
  const overrides = readOverrides();
  for (const raw of names) {
    const n = (raw || "").trim().toLowerCase();
    if (!n || !(n in overrides)) continue;
    const val = overrides[n];
    if (isProvider(val)) return val;
    if (val === "none") return null;
  }
  return undefined;
}

/** Connection the user made from the Clients page or inline on Edit Engagement. */
export function getClientConnectionOverride(...names: (string | undefined | null)[]): ClientSourceIntegration {
  return getClientConnectionState(...names) ?? null;
}

const ENGAGEMENT_CONN_PREFIX = "engagement-connection-";

/** Connections are client-level only; kept for compatibility and always null. */
export function getEngagementConnectionOverride(_engagementId?: string | null): ClientSourceIntegration {
  return null;
}

/** All names a client may be stored under (given name plus entity/legal names). */
function clientKeys(clientName: string): string[] {
  const normalized = clientName.trim().toLowerCase();
  const client = clientsData.find(
    c => c.entityName.toLowerCase() === normalized || c.legalEntityName.toLowerCase() === normalized
  );
  const names = client ? [client.entityName, client.legalEntityName] : [clientName];
  return Array.from(new Set(names.map(n => n.trim().toLowerCase()).filter(Boolean)));
}

export function connectClientSource(
  clientName: string,
  provider: AccountingProvider = "quickbooks",
  engagementId?: string
) {
  if (engagementId) localStorage.removeItem(`${ENGAGEMENT_CONN_PREFIX}${engagementId}`);
  const overrides = readOverrides();
  for (const key of clientKeys(clientName)) overrides[key] = provider;
  localStorage.setItem(CONN_OVERRIDE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(CLIENT_CONNECTION_EVENT));
}

/** Mark the client explicitly disconnected; never disconnects a real accounting service. */
export function disconnectClientSource(clientName: string, _engagementId?: string) {
  const overrides = readOverrides();
  for (const key of clientKeys(clientName)) overrides[key] = "none";
  localStorage.setItem(CONN_OVERRIDE_KEY, JSON.stringify(overrides));
  const staleKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(ENGAGEMENT_CONN_PREFIX)) staleKeys.push(k);
  }
  staleKeys.forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new Event(CLIENT_CONNECTION_EVENT));
}
