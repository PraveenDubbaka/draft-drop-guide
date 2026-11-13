import { beforeEach, describe, expect, it } from "vitest";
import {
  connectClientSource,
  disconnectClientSource,
  getClientConnectionId,
  getClientConnectionState,
  getClientSourceIntegration,
  getEngagementConnectionOverride,
} from "@/lib/clientSource";

describe("client-level source connections", () => {
  beforeEach(() => localStorage.clear());

  it("returns undefined when a client has no saved entry", () => {
    expect(getClientConnectionState("Nobody Inc")).toBeUndefined();
  });

  it('resolves "Harbor Freight" to its QuickBooks client connection', () => {
    expect(getClientSourceIntegration("Harbor Freight")).toBe("quickbooks");
    expect(getClientConnectionId("Harbor Freight")).toBe(getClientConnectionId("Harbor Freight Logistics LLC"));
    disconnectClientSource("Harbor Freight Logistics LLC");
    expect(getClientSourceIntegration("Harbor Freight")).toBeNull();
    expect(getClientConnectionState("Harbor Freight")).toBeNull();
    expect(getClientConnectionId("Harbor Freight")).toBeNull();
  });

  it("does not resolve an ambiguous partial client name", () => {
    expect(getClientSourceIntegration("Maple")).toBeNull();
    expect(getClientConnectionState("Maple")).toBeUndefined();
    expect(getClientConnectionId("Maple")).toBeNull();
  });

  it("matches partial names case-insensitively in either direction", () => {
    expect(getClientSourceIntegration("  HARBOR FREIGHT  ")).toBe("quickbooks");
    expect(getClientSourceIntegration("Harbor Freight Logistics LLC accounting")).toBe("quickbooks");
  });

  it("keeps exact matches ahead of ambiguous partial matches", () => {
    expect(getClientSourceIntegration("Maple Ridge Dental Corp.")).toBe("quickbooks");
    expect(getClientConnectionId("Maple Ridge Dental Corp.")).toBe("quickbooks-reconnected-1");
  });

  it("Riverstone starts on QuickBooks and can be disconnected", () => {
    expect(getClientSourceIntegration("Riverstone Capital")).toBe("quickbooks");
    disconnectClientSource("Riverstone Capital");
    expect(getClientConnectionState("Riverstone Capital")).toBeNull();
    expect(getClientSourceIntegration("Riverstone Capital")).toBeNull();
  });

  it("connecting saves the provider for the client, not the engagement", () => {
    localStorage.setItem("engagement-connection-ENG1", "xero");
    connectClientSource("Riverstone Capital", "sage", "ENG1");
    expect(localStorage.getItem("engagement-connection-ENG1")).toBeNull();
    expect(getClientSourceIntegration("Riverstone Capital")).toBe("sage");
  });

  it("disconnecting clears every engagement-level connection key", () => {
    localStorage.setItem("engagement-connection-A", "xero");
    localStorage.setItem("engagement-connection-B", "quickbooks");
    disconnectClientSource("Riverstone Capital");
    expect(localStorage.getItem("engagement-connection-A")).toBeNull();
    expect(localStorage.getItem("engagement-connection-B")).toBeNull();
  });

  it("engagement-level overrides are never used", () => {
    localStorage.setItem("engagement-connection-A", "xero");
    expect(getEngagementConnectionOverride("A")).toBeNull();
  });
});
