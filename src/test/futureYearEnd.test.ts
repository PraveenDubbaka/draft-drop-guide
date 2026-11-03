import { describe, it, expect } from "vitest";
import { isFutureYearEnd, todayMdY } from "@/lib/tbYearData";

const today = new Date(2026, 10, 3); // Nov 3, 2026

describe("future Current Year end", () => {
  it("Dec 31, 2026 is in the future on Nov 3, 2026", () => {
    expect(isFutureYearEnd("12/31/2026", today)).toBe(true);
    expect(isFutureYearEnd("Dec 31, 2026", today)).toBe(true);
  });
  it("a year end of today is not in the future (dates only)", () => {
    expect(isFutureYearEnd("11/03/2026", today)).toBe(false);
  });
  it("a past year end is not in the future", () => {
    expect(isFutureYearEnd("12/31/2025", today)).toBe(false);
  });
  it("pulled-as-of date is stored as MM/dd/yyyy", () => {
    expect(todayMdY(today)).toBe("11/03/2026");
  });
});
