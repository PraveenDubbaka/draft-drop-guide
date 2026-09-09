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
