import { clientsData } from "@/data/clientsData";

export type AccountingProvider = "xero" | "quickbooks" | "sage";
export type ClientSourceIntegration = AccountingProvider | null;

const DEMO_DATA_SOURCES: Readonly<Record<string, "csv" | "source">> = {
  "COM-NEW-Dec312024": "csv",
  "COM-INPROGRESS-Dec312024": "source",
  "COM-FYO-RF-Dec312025": "source",
  "COM-QB-Dec312026": "source",
  "COM-MRD-Dec312025": "source",
};

/** Demo: clients whose current connection was re-made outside the engagement (same provider, new connection id). */
const DEMO_CONNECTION_IDS: Readonly<Record<string, string>> = {
  "maple ridge dental corp.": "quickbooks-reconnected-1",
  "maple ridge dental": "quickbooks-reconnected-1",
};

/** Default connection id for engagements/connections saved before connection ids existed. */
export const initialConnectionId = (provider: AccountingProvider) => `${provider}-initial`;

/** Provider of a year-row value ("source:<provider>" or "source:<provider>|prev"). */
export const rowProvider = (v: string) => v.slice(7).split("|")[0] as AccountingProvider;

/**
 * True when an engagement source pulled from savedProvider/savedConnectionId can no longer use the
 * client's active connection: different provider, or same provider re-connected (new connection id).
 */
export function isConnectionChanged(
  savedProvider: AccountingProvider | null | undefined,
  savedConnectionId: string | null | undefined,
  activeProvider: AccountingProvider | null | undefined,
  activeConnectionId: string | null | undefined,
): boolean {
  if (!savedProvider || !activeProvider) return false;
  if (savedProvider !== activeProvider) return true;
  const saved = savedConnectionId ?? initialConnectionId(savedProvider);
  const active = activeConnectionId ?? initialConnectionId(activeProvider);
  return saved !== active;
}

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
  const given = (clientName || "").trim().toLowerCase();
  if (!given) return null;
  const normalized = LEGACY_CLIENT_ALIASES[given] ?? given;
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
type SavedSourceMeta = {
  dataSource?: "csv" | "source";
  sourceProvider?: AccountingProvider;
  yearDataSources?: { cy?: "csv" | "source" | string };
  yearSourceProviders?: { cy?: AccountingProvider };
};

/**
 * Pure derivation of the Data Type badge from an engagement's saved meta only.
 * Returns `undefined` when the meta has no saved provider for a Source CY (legacy).
 */
export function deriveEngagementDataType(meta: SavedSourceMeta | undefined | null): ClientSourceIntegration | undefined {
  if (!meta) return undefined;
  const cy = meta.yearDataSources?.cy ?? meta.dataSource;
  if (cy === undefined) return undefined;
  if (cy !== "source") return null;
  return meta.yearSourceProviders?.cy ?? meta.sourceProvider ?? undefined;
}

/**
 * Resolve the Data Type shown for an engagement from its SAVED current-year
 * source — never the client's live connection (unless legacy meta has no provider).
 */
export function getEngagementSourceIntegration(
  engagementId: string,
  clientName: string
): ClientSourceIntegration {
  let meta: SavedSourceMeta | undefined;
  try {
    const raw = localStorage.getItem(`engagement-meta-${engagementId}`);
    if (raw) meta = JSON.parse(raw);
  } catch {}
  if (!meta || (meta.dataSource === undefined && meta.yearDataSources?.cy === undefined)) {
    const seeded = DEMO_DATA_SOURCES[engagementId];
    meta = { ...(meta ?? {}), dataSource: seeded };
  }
  const derived = deriveEngagementDataType(meta);
  if (derived !== undefined) return derived;
  // Legacy: Source with no saved provider — fall back to the client's connection.
  return meta.dataSource === "source" ? getClientSourceIntegration(clientName) : null;
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

type StoredConnection = AccountingProvider | "none" | { provider: AccountingProvider; connectionId: string };

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
  for (const raw of names.flatMap(n => (n ? clientKeys(n) : []))) {
    const n = (raw || "").trim().toLowerCase();
    if (!n || !(n in overrides)) continue;
    const val = overrides[n];
    if (isProvider(val)) return val;
    if (val && typeof val === "object" && isProvider(val.provider)) return val.provider;
    if (val === "none") return null;
  }
  return undefined;
}

/** Id of the client's active connection (null when not connected). Legacy plain values = `${provider}-initial`. */
export function getClientConnectionId(...names: (string | undefined | null)[]): string | null {
  const overrides = readOverrides();
  for (const raw of names.flatMap(n => (n ? clientKeys(n) : []))) {
    const n = (raw || "").trim().toLowerCase();
    if (!n || !(n in overrides)) continue;
    const val = overrides[n];
    if (isProvider(val)) return initialConnectionId(val);
    if (val && typeof val === "object" && isProvider(val.provider)) return val.connectionId || initialConnectionId(val.provider);
    if (val === "none") return null;
  }
  const first = names.find(Boolean) || "";
  const provider = getClientSourceIntegration(first);
  if (!provider) return null;
  for (const raw of [first, ...clientKeys(first)]) {
    const id = DEMO_CONNECTION_IDS[(raw || "").trim().toLowerCase()];
    if (id) return id;
  }
  return initialConnectionId(provider);
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

/** Former display names, so overrides saved under them (and callers using them) still resolve. */
const LEGACY_CLIENT_ALIASES: Readonly<Record<string, string>> = {
  "harbor freight logistics": "harbor freight logistics llc",
};

/** All names a client may be stored under (given name plus entity/legal names and legacy aliases). */
function clientKeys(clientName: string): string[] {
  const given = clientName.trim().toLowerCase();
  const normalized = LEGACY_CLIENT_ALIASES[given] ?? given;
  const client = clientsData.find(
    c => c.entityName.toLowerCase() === normalized || c.legalEntityName.toLowerCase() === normalized
  );
  const names = client ? [clientName, client.entityName, client.legalEntityName] : [clientName];
  for (const [alias, target] of Object.entries(LEGACY_CLIENT_ALIASES)) if (names.some(n => n.trim().toLowerCase() === target)) names.push(alias);
  return Array.from(new Set(names.map(n => n.trim().toLowerCase()).filter(Boolean)));
}

export function connectClientSource(
  clientName: string,
  provider: AccountingProvider = "quickbooks",
  engagementId?: string
) {
  if (engagementId) localStorage.removeItem(`${ENGAGEMENT_CONN_PREFIX}${engagementId}`);
  const overrides = readOverrides();
  // Every connect (including switching provider) creates a new connection
  // (re-confirming the same live connection, e.g. closing the modal, keeps its id)
  const keys = clientKeys(clientName);
  const current = getClientSourceIntegration(clientName);
  const connectionId = current === provider
    ? (getClientConnectionId(...keys) ?? initialConnectionId(provider))
    : `${provider}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  for (const key of clientKeys(clientName)) overrides[key] = { provider, connectionId };
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
