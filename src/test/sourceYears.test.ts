import { describe, it, expect } from "vitest";
import { isYearOnProvider } from "@/lib/tbYearData";
import { savedYearSources } from "@/lib/yearSourceSave";

describe("Trial Balance refresh across roll-forward source years", () => {
  it("roll forward with priorYearSources.py1 = linked provider: CY and PY1 refreshable, CSV PY2 not", () => {
    const meta = { sourceProvider: "quickbooks", sourceRollForward: true, priorYearSources: { py1: "quickbooks", py2: "csv" } };
    expect(isYearOnProvider(meta, "cy", 0, "quickbooks", 1)).toBe(true);
    expect(isYearOnProvider(meta, "py1", 1, "quickbooks", 1)).toBe(true);
    expect(isYearOnProvider(meta, "py2", 2, "quickbooks", 1)).toBe(false);
  });

  it("an inherited prior-year provider that isn't the linked one is not refreshable", () => {
    const meta = { sourceProvider: "quickbooks", sourceRollForward: true, priorYearSources: { py1: "xero", py2: "csv" } };
    expect(isYearOnProvider(meta, "py1", 1, "quickbooks", 1)).toBe(false);
  });
});

describe("Edit roll forward: Current Year Source → CSV", () => {
  it("saves all three years as CSV with no providers and keeps sourceRollForward", () => {
    const r = savedYearSources({
      rows: ["csv", "locked", "locked"],
      lockedSource: () => "quickbooks",
      priorToCsv: true,
      priorYearSources: { py1: "quickbooks", py2: "quickbooks" },
      sourceRollForward: true,
    });
    expect(r.yearDataSources).toEqual({ cy: "csv", py1: "csv", py2: "csv" });
    expect(r.yearSourceProviders).toEqual({});
    expect(r.priorYearSources).toEqual({ py1: "csv", py2: "csv" });
    expect(r.sourceRollForward).toBe(true);
  });

  it("CY kept on Source keeps the inherited prior-year providers", () => {
    const r = savedYearSources({
      rows: ["source:quickbooks", "locked", "locked"],
      lockedSource: () => "quickbooks",
      priorToCsv: false,
      priorYearSources: { py1: "quickbooks", py2: "quickbooks" },
      sourceRollForward: true,
    });
    expect(r.yearDataSources).toEqual({ cy: "source", py1: "source", py2: "source" });
    expect(r.priorYearSources).toEqual({ py1: "quickbooks", py2: "quickbooks" });
  });
});
