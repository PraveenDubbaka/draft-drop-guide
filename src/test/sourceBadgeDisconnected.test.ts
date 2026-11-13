import { describe, it, expect } from "vitest";
import { engagementSourceDisconnected } from "@/pages/Engagements";

describe("engagementSourceDisconnected", () => {
  it("CSV engagement is never flagged, even with no client connection", () => {
    expect(engagementSourceDisconnected(null, undefined, null, null)).toBe(false);
    expect(engagementSourceDisconnected(null, "quickbooks-initial", "quickbooks", "quickbooks-initial")).toBe(false);
  });
  it("unknown Source badge is never flagged", () => {
    expect(engagementSourceDisconnected("unknown", undefined, null, null)).toBe(false);
    expect(engagementSourceDisconnected("unknown", "quickbooks-initial", "xero", "xero-2")).toBe(false);
  });
  it("saved Source with no active client connection is flagged", () => {
    expect(engagementSourceDisconnected("quickbooks", "quickbooks-initial", null, null)).toBe(true);
  });
  it("same provider, same connection id is not flagged", () => {
    expect(engagementSourceDisconnected("quickbooks", "quickbooks-initial", "quickbooks", "quickbooks-initial")).toBe(false);
    expect(engagementSourceDisconnected("quickbooks", undefined, "quickbooks", null)).toBe(false);
  });
  it("same provider re-connected (new connection id) is flagged", () => {
    expect(engagementSourceDisconnected("quickbooks", "quickbooks-initial", "quickbooks", "quickbooks-reconnected-1")).toBe(true);
  });
  it("different active provider is flagged", () => {
    expect(engagementSourceDisconnected("quickbooks", "quickbooks-initial", "xero", "xero-1")).toBe(true);
  });
  it("updating the engagement to the new source clears the flag", () => {
    expect(engagementSourceDisconnected("xero", "xero-1", "xero", "xero-1")).toBe(false);
  });
});
