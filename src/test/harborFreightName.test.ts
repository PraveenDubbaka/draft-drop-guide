import { describe, it, expect, beforeEach } from "vitest";
import { getClientSourceIntegration, getClientConnectionId, getClientConnectionState } from "@/lib/clientSource";
describe("Harbor Freight display name", () => {
  beforeEach(() => localStorage.clear());
  it("defaults to QuickBooks under both names", () => {
    expect(getClientSourceIntegration("Harbor Freight Logistics LLC")).toBe("quickbooks");
    expect(getClientSourceIntegration("Harbor Freight Logistics")).toBe("quickbooks");
  });
  it("reads a legacy override saved only under the short name", () => {
    localStorage.setItem("client-connection-overrides", JSON.stringify({ "harbor freight logistics": "none" }));
    expect(getClientConnectionState("Harbor Freight Logistics LLC")).toBeNull();
    expect(getClientConnectionId("Harbor Freight Logistics LLC")).toBeNull();
    expect(getClientSourceIntegration("Harbor Freight Logistics LLC")).toBeNull();
  });
});

describe("Maple Ridge display name", () => {
  beforeEach(() => localStorage.clear());
  it("keeps the reconnected demo connection under both names", () => {
    expect(getClientConnectionId("Maple Ridge Dental Corp.")).toBe("quickbooks-reconnected-1");
    expect(getClientConnectionId("Maple Ridge Dental")).toBe("quickbooks-reconnected-1");
  });
  it("reads a legacy override saved only under the old name", () => {
    localStorage.setItem("client-connection-overrides", JSON.stringify({ "maple ridge dental": "none" }));
    expect(getClientSourceIntegration("Maple Ridge Dental Corp.")).toBeNull();
  });
});
