import { describe, expect, it } from "bun:test";
import { getEffectiveHeaderLayout, normalizeHeaderLayout } from "../layout-options";

describe("normalizeHeaderLayout", () => {
  it("falls back to classic for unknown or empty values", () => {
    expect(normalizeHeaderLayout(undefined)).toBe("classic");
    expect(normalizeHeaderLayout(null)).toBe("classic");
    expect(normalizeHeaderLayout("v2")).toBe("classic");
    expect(normalizeHeaderLayout("nonsense")).toBe("classic");
  });

  it("keeps known options", () => {
    expect(normalizeHeaderLayout("classic")).toBe("classic");
    expect(normalizeHeaderLayout("compact")).toBe("compact");
  });
});

describe("getEffectiveHeaderLayout", () => {
  it("forces v2 layout when home version is v2", () => {
    expect(getEffectiveHeaderLayout({ headerLayout: "classic", homeVersion: "v2" })).toBe("v2");
    expect(getEffectiveHeaderLayout({ headerLayout: "compact", homeVersion: "v2" })).toBe("v2");
  });

  it("respects the header layout setting when home version is v1", () => {
    expect(getEffectiveHeaderLayout({ headerLayout: "classic", homeVersion: "v1" })).toBe("classic");
    expect(getEffectiveHeaderLayout({ headerLayout: "compact", homeVersion: "v1" })).toBe("compact");
  });

  it("falls back to classic for unknown header layout values", () => {
    expect(getEffectiveHeaderLayout({ headerLayout: "nonsense", homeVersion: "v1" })).toBe("classic");
    expect(getEffectiveHeaderLayout({ homeVersion: "v1" })).toBe("classic");
  });
});
