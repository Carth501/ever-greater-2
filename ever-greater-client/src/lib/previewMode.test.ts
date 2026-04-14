import { describe, expect, it } from "vitest";
import { getPreviewMode } from "./previewMode";

describe("getPreviewMode", () => {
  it("returns dashboard preview config for the stable internal hash route", () => {
    const mode = getPreviewMode({
      hash: "#internal/preview/dashboard",
      pathname: "/",
      search: "",
    });

    expect(mode).toEqual({
      kind: "dashboard",
      showControls: true,
    });
  });

  it("honors controls=0 in the hash route", () => {
    const mode = getPreviewMode({
      hash: "#internal/preview/dashboard?controls=0",
      pathname: "/",
      search: "",
    });

    expect(mode).toEqual({
      kind: "dashboard",
      showControls: false,
    });
  });

  it("supports the legacy concept query entry", () => {
    const mode = getPreviewMode({
      hash: "",
      pathname: "/",
      search: "?concept=dashboard&controls=0",
    });

    expect(mode).toEqual({
      kind: "dashboard",
      showControls: false,
    });
  });

  it("returns null for non-preview locations", () => {
    const mode = getPreviewMode({
      hash: "#account",
      pathname: "/",
      search: "",
    });

    expect(mode).toBeNull();
  });
});
