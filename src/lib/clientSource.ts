import { clientsData } from "@/data/clientsData";

export type AccountingProvider = "xero" | "quickbooks" | "sage";
export type ClientSourceIntegration = AccountingProvider | null;

const DEMO_DATA_SOURCES: Readonly<Record<string, "csv" | "source">> = {
  "COM-NEW-Dec312024": "csv",
  "COM-INPROGRESS-Dec312024": "csv",
};

/** Exact client-name connections for demo engagements (exact match only, so "Cedar Point Logistics" stays unconnected). */
const DEMO_EXACT_CONNECTIONS: Readonly<Record<string, "xero" | "quickbooks">> = {};

/**
 * Resolve which accounting source a client is connected to.
 * Matches on legal entity name or short entity name (case/whitespace insensitive).
 * Clients with 'connect' / 'none' (or unknown clients) are treated as not connected (CSV).
 */
export function getClientSourceIntegration(clientName: string): ClientSourceIntegration {
  const normalized = (clientName || "").trim().toLowerCase();
  if (!normalized) return null;
  if (DEMO_EXACT_CONNECTIONS[normalized]) return DEMO_EXACT_CONNECTIONS[normalized];
  const override = getClientConnectionOverride(normalized);
  if (override) return override;
  const client = clientsData.find(
    (c) =>
      c.legalEntityName.toLowerCase() === normalized ||
      c.entityName.toLowerCase() === normalized
  );
  if (!client) return null;
  const clientOverride = getClientConnectionOverride(client.legalEntityName, client.entityName);
  if (clientOverride) return clientOverride;
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

function readOverrides(): Record<string, AccountingProvider | null> {
  try {
    return JSON.parse(localStorage.getItem(CONN_OVERRIDE_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Connection the user made from the Clients page or inline on Edit Engagement. */
export function getClientConnectionOverride(...names: (string | undefined | null)[]): ClientSourceIntegration {
  const overrides = readOverrides();
  for (const raw of names) {
    const n = (raw || "").trim().toLowerCase();
    if (!n) continue;
    for (const [key, val] of Object.entries(overrides)) {
      if (key === n) return val;
    }
  }
  return null;
}

const engagementConnKey = (engagementId: string) => `engagement-connection-${engagementId}`;

/** Connection made inline for one specific engagement ("Connect here →"). */
export function getEngagementConnectionOverride(engagementId?: string | null): ClientSourceIntegration {
  if (!engagementId) return null;
  try {
    const v = localStorage.getItem(engagementConnKey(engagementId));
    return v === "xero" || v === "quickbooks" || v === "sage" ? v : null;
  } catch {
    return null;
  }
}

export function connectClientSource(
  clientName: string,
  provider: AccountingProvider = "quickbooks",
  engagementId?: string
) {
  if (engagementId) {
    localStorage.setItem(engagementConnKey(engagementId), provider);
  } else {
    const overrides = readOverrides();
    overrides[clientName.trim().toLowerCase()] = provider;
    localStorage.setItem(CONN_OVERRIDE_KEY, JSON.stringify(overrides));
  }
  window.dispatchEvent(new Event(CLIENT_CONNECTION_EVENT));
}

/** Remove only prototype overrides; never disconnect a real accounting service. */
export function disconnectClientSource(clientName: string, engagementId?: string) {
  if (engagementId) localStorage.removeItem(engagementConnKey(engagementId));
  const overrides = readOverrides();
  const normalized = clientName.trim().toLowerCase();
  const client = clientsData.find(c => c.entityName.toLowerCase() === normalized || c.legalEntityName.toLowerCase() === normalized);
  for (const name of [clientName, client?.entityName, client?.legalEntityName]) {
    if (name) delete overrides[name.trim().toLowerCase()];
  }
  localStorage.setItem(CONN_OVERRIDE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(CLIENT_CONNECTION_EVENT));
}
