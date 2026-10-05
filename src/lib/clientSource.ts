import { clientsData } from "@/data/clientsData";

export type ClientSourceIntegration = "xero" | "quickbooks" | null;

const DEMO_DATA_SOURCES: Readonly<Record<string, "csv" | "source">> = {
  "COM-QB-Jan142026": "source",
  "COM-QB-Dec312024": "csv",
  "COM-QB-Dec312025": "source",
  "COM-CHE-Dec252024": "csv",
  "COM-HF-Dec312024": "source",
  "COM-HFRF-Dec312024": "csv",
  "COM-QB-STCSV-Dec312024": "source",
  "COM-HFRF-STCSV-Dec312024": "source",
  "COM-STUB-FOO-Dec312024": "csv",
  "COM-STUB-NOFOO-Dec312024": "csv",
};

/** Exact client-name connections for demo engagements (exact match only, so "Cedar Point Logistics" stays unconnected). */
const DEMO_EXACT_CONNECTIONS: Readonly<Record<string, "xero" | "quickbooks">> = {
  "cedar point logistics inc.": "quickbooks",
  "sunrise ventures inc.": "quickbooks",
  "maple grove partners llc": "quickbooks",
  "harbor freight logistics llc": "quickbooks",
  "riverstone capital": "quickbooks",
  "riverstone capital group inc.": "quickbooks",
  "shipping line inc.": "quickbooks",
};

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
  t === "xero" ? "Xero" : t === "quickbooks" ? "QuickBooks Online" : "CSV";

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
  "COM-QB-Jan142026",
  "COM-QB-Dec312024",
  "COM-QB-Dec312025",
  "COM-CHE-Dec252024",
  "COM-HF-Dec312024",
  "COM-HFRF-Dec312024",
  "COM-QB-STCSV-Dec312024",
  "COM-HFRF-STCSV-Dec312024",
  "COM-STUB-FOO-Dec312024",
  "COM-STUB-NOFOO-Dec312024",
  "COM-FULL-TO-STUB-Dec312024",
  "COM-STUB-TO-FULL-Dec312024",
  "COM-STUB-SRC-TO-CSV-Dec312024",
];

/** Keep only the visible engagements, in the fixed scenario order. */
export function filterVisibleEngagements<T extends { id: string }>(list: T[]): T[] {
  const byId = new Map(list.map((e) => [e.id, e]));
  return VISIBLE_ENGAGEMENT_IDS.map((id) => byId.get(id)).filter((e): e is T => !!e);
}

// ── Client connection overrides (connections made after the demo was seeded) ──
const CONN_OVERRIDE_KEY = "client-connection-overrides";
export const CLIENT_CONNECTION_EVENT = "client-connection-changed";

function readOverrides(): Record<string, "xero" | "quickbooks"> {
  try {
    return JSON.parse(localStorage.getItem(CONN_OVERRIDE_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Connection the user made from the Clients page or inline on Edit Engagement. */
export function getClientConnectionOverride(...names: (string | undefined | null)[]): "xero" | "quickbooks" | null {
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
export function getEngagementConnectionOverride(engagementId?: string | null): "xero" | "quickbooks" | null {
  if (!engagementId) return null;
  try {
    const v = localStorage.getItem(engagementConnKey(engagementId));
    return v === "xero" || v === "quickbooks" ? v : null;
  } catch {
    return null;
  }
}

export function connectClientSource(
  clientName: string,
  provider: "xero" | "quickbooks" = "quickbooks",
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
