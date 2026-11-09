import { getClientSourceIntegration, type ClientSourceIntegration } from "@/lib/clientSource";

const ACCOUNTING_CONNECTOR_IDS = ["qbo", "xero", "sage50"] as const;

export function isClientAccountingConnector(id: string): boolean {
  return ACCOUNTING_CONNECTOR_IDS.some(accountingId => accountingId === id);
}

export function withoutClientAccountingConnectors(ids: Iterable<string>): Set<string> {
  return new Set(Array.from(ids).filter(id => !isClientAccountingConnector(id)));
}

/** Client-managed accounting connections never come from the engagement's local list. */
export function deriveEngagementConnectors(ids: Iterable<string>, provider: ClientSourceIntegration): Set<string> {
  const result = withoutClientAccountingConnectors(ids);
  const id = provider === "quickbooks" ? "qbo" : provider === "sage" ? "sage50" : provider;
  if (id) result.add(id);
  return result;
}

export function getClientEngagementConnectors(clientName: string, ids: Iterable<string>): Set<string> {
  return deriveEngagementConnectors(ids, getClientSourceIntegration(clientName));
}