import { beforeEach, describe, expect, it } from "vitest";
import { deriveEngagementConnectors, getClientEngagementConnectors, withoutClientAccountingConnectors } from "@/lib/engagementConnectors";
import { connectClientSource, disconnectClientSource } from "@/lib/clientSource";

describe("client-managed engagement accounting connectors", () => {
  beforeEach(() => localStorage.clear());

  it.each([
    ["quickbooks", "qbo"], ["xero", "xero"], ["sage", "sage50"],
  ] as const)("shows only the active %s provider and preserves other connectors", (provider, id) => {
    expect([...deriveEngagementConnectors(["qbo", "xero", "sage50", "gdrive"], provider)]).toEqual(["gdrive", id]);
  });

  it("disconnected clients have no accounting connectors despite stale local entries", () => {
    expect([...deriveEngagementConnectors(["qbo", "xero", "sage50", "plaid"], null)]).toEqual(["plaid"]);
  });

  it("cleans only client-managed accounting entries from persistence", () => {
    expect([...withoutClientAccountingConnectors(["qbo", "xero", "sage50", "gdrive", "netsuite"])]).toEqual(["gdrive", "netsuite"]);
  });

  it("resolves both client name variants and follows connect, switch and disconnect", () => {
    const oldName = "Harbor Freight Logistics";
    const name = "Harbor Freight Logistics LLC";
    expect([...getClientEngagementConnectors(name, [])]).toEqual(["qbo"]);
    connectClientSource(oldName, "xero");
    expect([...getClientEngagementConnectors(name, ["qbo"])]).toEqual(["xero"]);
    disconnectClientSource(oldName);
    expect([...getClientEngagementConnectors(name, ["qbo", "xero"])]).toEqual([]);
  });

  it("uses Maple Ridge's live connection rather than its engagement's older connection", () => {
    expect([...getClientEngagementConnectors("Maple Ridge Dental Corp.", ["xero"])]).toEqual(["qbo"]);
    expect([...getClientEngagementConnectors("Maple Ridge Dental", [])]).toEqual(["qbo"]);
  });

  it("keeps Cedar Point disconnected even if the local list contains providers", () => {
    expect([...getClientEngagementConnectors("Cedar Point Logistics", ["qbo", "xero", "sage50"])]).toEqual([]);
  });
});