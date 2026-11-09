import { describe, it, expect } from "vitest";
import { resolveSavedClientName } from "@/pages/CreateEngagement";
describe("resolveSavedClientName", () => {
  it("Edit keeps stored name", () => expect(resolveSavedClientName(true, "Harbor Freight Logistics LLC", "Harbor Freight Logistics")).toBe("Harbor Freight Logistics LLC"));
  it("Create uses selection", () => expect(resolveSavedClientName(false, undefined, "Maple Ridge Dental Corp.")).toBe("Maple Ridge Dental Corp."));
});
