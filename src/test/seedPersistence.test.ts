import { beforeEach, describe, expect, it } from "vitest";
import { getEngagementMeta, loadEngagements, setEngagementMeta } from "@/store/engagementsStore";

describe("demo seed does not overwrite saved edits on reload", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a saved roll-forward priorYearSources (CY switched to CSV) after reload", () => {
    loadEngagements();
    const id = "COM-INPROGRESS-Dec312024";
    setEngagementMeta(id, {
      ...getEngagementMeta(id), dataSource: "csv",
      yearDataSources: { cy: "csv", py1: "csv", py2: "csv" }, yearSourceProviders: {},
      priorYearSources: { py1: "csv", py2: "csv" },
    });
    loadEngagements();
    expect(getEngagementMeta(id).priorYearSources).toEqual({ py1: "csv", py2: "csv" });
  });

  it("keeps a saved year-end change on a seeded period after reload", () => {
    loadEngagements();
    const id = "COM-QB-Dec312026";
    expect(getEngagementMeta(id).periodEnd).toBe("12/31/2026");
    setEngagementMeta(id, { ...getEngagementMeta(id), periodStart: "07/01/2025", periodEnd: "06/30/2026" });
    loadEngagements();
    expect(getEngagementMeta(id).periodEnd).toBe("06/30/2026");
    expect(getEngagementMeta(id).periodStart).toBe("07/01/2025");
  });
});
