import { beforeEach, describe, it, expect } from "vitest";
import { isEngagementSourceDisconnected, type EngagementDataType, type ClientSourceIntegration } from "@/lib/clientSource";

describe("isEngagementSourceDisconnected", () => {
  beforeEach(() => localStorage.clear());

  function check(savedType: EngagementDataType, savedId: string | undefined, active: ClientSourceIntegration, activeId?: string) {
    localStorage.setItem("engagement-meta-test", JSON.stringify({
      dataSource: savedType ? "source" : "csv",
      sourceProvider: savedType === "unknown" ? undefined : savedType,
      sourceConnectionId: savedId,
    }));
    localStorage.setItem("client-connection-overrides", JSON.stringify({
      "harbor freight logistics llc": active ? (activeId ? { provider: active, connectionId: activeId } : active) : "none",
    }));
    return isEngagementSourceDisconnected("test", "Harbor Freight");
  }

  it("CSV engagement is never flagged, even with no client connection", () => {
    expect(check(null, undefined, null)).toBe(false);
    expect(check(null, "quickbooks-initial", "quickbooks", "quickbooks-initial")).toBe(false);
  });
  it("unknown Source badge is never flagged", () => {
    expect(check("unknown", undefined, null)).toBe(false);
    expect(check("unknown", "quickbooks-initial", "xero", "xero-2")).toBe(false);
  });
  it("saved Source with no active client connection is flagged", () => {
    expect(check("quickbooks", "quickbooks-initial", null)).toBe(true);
  });
  it("same provider, same connection id is not flagged, including legacy ids", () => {
    expect(check("quickbooks", "quickbooks-initial", "quickbooks", "quickbooks-initial")).toBe(false);
    expect(check("quickbooks", undefined, "quickbooks")).toBe(false);
  });
  it("same provider re-connected (new connection id) is flagged", () => {
    expect(check("quickbooks", "quickbooks-initial", "quickbooks", "quickbooks-reconnected-1")).toBe(true);
  });
  it("different active provider is flagged", () => {
    expect(check("quickbooks", "quickbooks-initial", "xero", "xero-1")).toBe(true);
  });
  it("updating the engagement to the new source clears the flag", () => {
    expect(check("quickbooks", "quickbooks-initial", "xero", "xero-1")).toBe(true);
    expect(check("xero", "xero-1", "xero", "xero-1")).toBe(false);
  });
});