import { describe, expect, it } from "vitest";
import { clientInitials, generateEngagementId } from "@/pages/CreateEngagement";

describe("engagement ID generation", () => {
  it("builds PREFIX-INITIALS-MonDDYYYY", () => {
    expect(generateEngagementId("Compilation (COM)", "Riverstone Capital", "11/30/2023", [])).toBe("COM-RC-Nov302023");
  });

  it("ignores Inc/LLC/Ltd/Corp/Co/Group and caps initials at 3 letters", () => {
    expect(clientInitials("Riverstone Capital Group Inc.")).toBe("RC");
    expect(clientInitials("Harbor Freight Logistics West LLC")).toBe("HFL");
  });

  it("uses the first 3 letters for a single-word client", () => {
    expect(clientInitials("Sunrise Ltd")).toBe("SUN");
  });

  it("appends -2, -3 when the ID already exists", () => {
    expect(generateEngagementId("Audit (AUD)", "Riverstone Capital", "12/31/2024", ["AUD-RC-Dec312024"])).toBe("AUD-RC-Dec312024-2");
    expect(generateEngagementId("Audit (AUD)", "Riverstone Capital", "12/31/2024", ["AUD-RC-Dec312024", "AUD-RC-Dec312024-2"])).toBe("AUD-RC-Dec312024-3");
  });

  it("falls back to the Review prefix for unknown types", () => {
    expect(generateEngagementId("Unknown", "Riverstone Capital", "12/31/2024", [])).toBe("REV-RC-Dec312024");
  });
});
