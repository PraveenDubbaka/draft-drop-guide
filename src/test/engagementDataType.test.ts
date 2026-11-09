import { describe, it, expect } from "vitest";
import { deriveEngagementDataType } from "@/lib/clientSource";

describe("deriveEngagementDataType", () => {
  it("CY source uses saved CY provider", () => {
    expect(deriveEngagementDataType({ dataSource: "source", sourceProvider: "quickbooks", yearDataSources: { cy: "source" }, yearSourceProviders: { cy: "xero" } })).toBe("xero");
  });
  it("falls back to sourceProvider", () => {
    expect(deriveEngagementDataType({ dataSource: "source", sourceProvider: "quickbooks" })).toBe("quickbooks");
  });
  it("CY csv shows CSV even if engagement has a provider", () => {
    expect(deriveEngagementDataType({ dataSource: "source", sourceProvider: "quickbooks", yearDataSources: { cy: "csv" } })).toBeNull();
  });
  it("no meta is undefined", () => {
    expect(deriveEngagementDataType(undefined)).toBeUndefined();
  });
});
