import { beforeEach, describe, expect, it } from "vitest";
import { createRollForward, getEngagementMeta, loadEngagements, saveEngagements, setEngagementMeta } from "@/store/engagementsStore";

describe("createRollForward", () => {
  beforeEach(() => localStorage.clear());

  it("bumps only the last year in the ID and year end", () => {
    const r = createRollForward("COM-NEW-Dec312024", null)!;
    expect(r.id).toBe("COM-NEW-Dec312025");
    expect(r.yearEnd).toBe("Dec 31, 2025");
    expect(r.status).toBe("New");
    expect(r.hasRF).toBe(true);
  });

  it("adds -2 when the rolled-forward ID already exists", () => {
    const first = createRollForward("COM-NEW-Dec312024", null)!;
    saveEngagements([first, ...loadEngagements()]);
    expect(createRollForward("COM-NEW-Dec312024", null)!.id).toBe("COM-NEW-Dec312025-2");
  });

  it("Riverstone: PY1 inherits last year's CY (QBO), PY2 inherits last year's priorYearSources.py1", () => {
    const r = createRollForward("COM-INPROGRESS-Dec312024", "quickbooks")!;
    const m = getEngagementMeta(r.id);
    expect(m.priorYearSources).toEqual({ py1: "quickbooks", py2: "quickbooks" });
    expect(m.yearDataSources).toEqual({ cy: "source", py1: "source", py2: "source" });
    expect(m.sourceProvider).toBe("quickbooks");
    expect(m.sourceYears).toBe(1);
    expect(m.sourceRollForward).toBe(true);
  });

  it("CY is CSV when the client is not connected", () => {
    const r = createRollForward("COM-NEW-Dec312024", null)!;
    const m = getEngagementMeta(r.id);
    expect(m.dataSource).toBe("csv");
    expect(m.yearDataSources).toEqual({ cy: "csv", py1: "csv", py2: "csv" });
    expect(m.priorYearSources).toEqual({ py1: "csv", py2: "csv" });
  });

  it("First Year of Operations (chain 1) rolls into FOO chain 2: 12-month CY, PY1 = last CY, PY2 = No data", () => {
    setEngagementMeta("COM-NEW-Dec312024", {
      firstYearAudit: false, dataSource: "source", sourceProvider: "quickbooks",
      auditPeriodType: "First Year of Operations", firstYearOfOperations: true,
      periodStart: "03/15/2024", periodEnd: "12/31/2024",
      yearDataSources: { cy: "source", py1: "csv", py2: "csv" }, yearSourceProviders: { cy: "quickbooks" },
    });
    const r = createRollForward("COM-NEW-Dec312024", "quickbooks")!;
    const m = getEngagementMeta(r.id);
    expect(m.auditPeriodType).toBe("First Year of Operations");
    expect(m.firstYearOfOperations).toBe(true);
    expect(m.fyoChainYear).toBe(2);
    expect(m.periodStart).toBe("01/01/2025");
    expect(m.periodEnd).toBe("12/31/2025");
    expect(m.priorYearSources).toEqual({ py1: "quickbooks", py2: "nodata" });
    expect(m.yearSourceProviders?.py2).toBeUndefined();
  });

  it("FOO chain 2 rolls into chain 3: PY2 inherits last year's PY1", () => {
    setEngagementMeta("COM-NEW-Dec312024", {
      firstYearAudit: false, dataSource: "source", sourceProvider: "quickbooks", sourceRollForward: true,
      auditPeriodType: "First Year of Operations", firstYearOfOperations: true, fyoChainYear: 2,
      periodStart: "01/01/2024", periodEnd: "12/31/2024",
      priorYearSources: { py1: "quickbooks", py2: "nodata" },
      yearDataSources: { cy: "source", py1: "source", py2: "csv" }, yearSourceProviders: { cy: "quickbooks", py1: "quickbooks" },
    });
    const m = getEngagementMeta(createRollForward("COM-NEW-Dec312024", "quickbooks")!.id);
    expect(m.auditPeriodType).toBe("First Year of Operations");
    expect(m.fyoChainYear).toBe(3);
    expect(m.priorYearSources).toEqual({ py1: "quickbooks", py2: "quickbooks" });
  });

  it("FOO chain 3 rolls into a normal Full year without fyoChainYear", () => {
    setEngagementMeta("COM-NEW-Dec312024", {
      firstYearAudit: false, dataSource: "source", sourceProvider: "quickbooks", sourceRollForward: true,
      auditPeriodType: "First Year of Operations", firstYearOfOperations: true, fyoChainYear: 3,
      periodStart: "01/01/2024", periodEnd: "12/31/2024",
      priorYearSources: { py1: "quickbooks", py2: "quickbooks" },
      yearDataSources: { cy: "source", py1: "source", py2: "source" },
    });
    const m = getEngagementMeta(createRollForward("COM-NEW-Dec312024", "quickbooks")!.id);
    expect(m.auditPeriodType).toBe("Full year");
    expect(m.firstYearOfOperations).toBeUndefined();
    expect(m.fyoChainYear).toBeUndefined();
  });

  it("rolling a rolled-forward FYO file again: PY1 = last CY, PY2 = last PY1", () => {
    setEngagementMeta("COM-NEW-Dec312024", {
      firstYearAudit: false, dataSource: "csv", auditPeriodType: "Full year", sourceRollForward: true,
      periodStart: "01/01/2024", periodEnd: "12/31/2024",
      priorYearSources: { py1: "csv", py2: "nodata" },
      yearDataSources: { cy: "csv", py1: "csv", py2: "csv" },
    });
    const r = createRollForward("COM-NEW-Dec312024", null)!;
    expect(getEngagementMeta(r.id).priorYearSources).toEqual({ py1: "csv", py2: "csv" });
  });

  it("Partial year rolls into a Full year with the 12 months ending on the new year-end", () => {
    setEngagementMeta("COM-NEW-Dec312024", {
      firstYearAudit: false, dataSource: "csv", auditPeriodType: "Partial year",
      periodStart: "04/01/2024", periodEnd: "12/31/2024",
    });
    const r = createRollForward("COM-NEW-Dec312024", "xero")!;
    const m = getEngagementMeta(r.id);
    expect(m.auditPeriodType).toBe("Full year");
    expect(m.periodStart).toBe("01/01/2025");
    expect(m.periodEnd).toBe("12/31/2025");
    expect(m.yearDataSources?.cy).toBe("source");
    expect(m.priorYearSources).toEqual({ py1: "csv", py2: "csv" });
  });
});
