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
