import { describe, it, expect, beforeEach } from "vitest";
import { readUploadedYears, tbYearHasData, TB_UPLOADED_KEY, TB_LOADED_KEY } from "@/lib/tbYearData";

describe("Trial Balance per-year data", () => {
  beforeEach(() => localStorage.clear());

  it("a CSV year on a new engagement has no data until uploaded", () => {
    expect(tbYearHasData({ isSeeded: false, isSource: false, uploaded: false })).toBe(false);
    expect(tbYearHasData({ isSeeded: false, isSource: false, uploaded: true })).toBe(true);
  });

  it("a Source year always has data", () => {
    expect(tbYearHasData({ isSeeded: false, isSource: true, uploaded: false })).toBe(true);
  });

  it("seeded demo engagements keep their data", () => {
    expect(tbYearHasData({ isSeeded: true, isSource: false, uploaded: false })).toBe(true);
  });

  it("uploads are remembered per year", () => {
    localStorage.setItem(TB_UPLOADED_KEY("E1"), JSON.stringify({ cy: true }));
    expect(readUploadedYears("E1")).toEqual({ cy: true, py1: false, py2: false });
  });

  it("the old single upload marker counts as all years uploaded", () => {
    localStorage.setItem(TB_LOADED_KEY("E2"), "1");
    expect(readUploadedYears("E2")).toEqual({ cy: true, py1: true, py2: true });
  });
});
