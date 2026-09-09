import { clientsData } from "@/data/clientsData";

export type ClientSourceIntegration = "xero" | "quickbooks" | null;

/**
 * Resolve which accounting source a client is connected to.
 * Matches on legal entity name or short entity name (case/whitespace insensitive).
 * Clients with 'connect' / 'none' (or unknown clients) are treated as not connected (CSV).
 */
export function getClientSourceIntegration(clientName: string): ClientSourceIntegration {
  const normalized = (clientName || "").trim().toLowerCase();
  if (!normalized) return null;
  const client = clientsData.find(
    (c) =>
      c.legalEntityName.toLowerCase() === normalized ||
      c.entityName.toLowerCase() === normalized ||
      c.legalEntityName.toLowerCase().includes(normalized) ||
      normalized.includes(c.entityName.toLowerCase())
  );
  if (!client) return null;
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
  if (dataSource === "csv") return null;
  // No saved selection (legacy engagement): fall back to the client's connection.
  if (dataSource !== "source" && dataSource !== undefined) return null;
  return getClientSourceIntegration(clientName);
}
