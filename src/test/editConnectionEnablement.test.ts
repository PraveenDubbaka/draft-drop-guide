import { describe, expect, it } from "vitest";
import { connectionBlocksSave } from "@/pages/CreateEngagement";

describe("connection-related save blockers", () => {
  const original = ["source:quickbooks", "csv", "csv"];

  it("does not block unchanged saved sources when the client is disconnected", () => {
    expect(connectionBlocksSave(true, [...original], original, true, false)).toBe(false);
  });

  it("does not block unchanged saved sources when the client switches to Xero", () => {
    expect(connectionBlocksSave(true, [...original], original, false, true)).toBe(false);
  });

  it("keeps connection blockers after a year changes", () => {
    expect(connectionBlocksSave(true, ["source:quickbooks", "source:xero", "csv"], original, false, true)).toBe(true);
    expect(connectionBlocksSave(true, ["source:quickbooks", "csv", "source:none"], original, true, false)).toBe(true);
  });

  it("does not block a valid source change when neither connection blocker applies", () => {
    expect(connectionBlocksSave(true, ["source:xero", "csv", "csv"], original, false, false)).toBe(false);
  });

  it("preserves Create connection blockers regardless of original defaults", () => {
    expect(connectionBlocksSave(false, original, original, true, false)).toBe(true);
    expect(connectionBlocksSave(false, ["csv", "csv", "csv"], ["csv", "csv", "csv"], false, false)).toBe(false);
  });
});