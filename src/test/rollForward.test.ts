import { beforeEach, describe, expect, it } from "vitest";
import { createRollForward, getEngagementMeta, loadEngagements, saveEngagements } from "@/store/engagementsStore";

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
});
