import { describe, expect, it } from "vitest";
import { getPreviewMode } from "./previewMode";

describe("getPreviewMode", () => {
  it("retargets the stable internal hash route to dashboard preview", () => {
    const mode = getPreviewMode({
      hash: "#internal/preview",
      pathname: "/",
      search: "",
    });

    expect(mode).toEqual({
      showControls: true,
    });
  });

  it("returns dashboard preview config for the stable internal hash route", () => {
    const mode = getPreviewMode({
      hash: "#internal/preview/dashboard",
      pathname: "/",
      search: "",
    });

    expect(mode).toEqual({
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
      showControls: false,
    });
  });

  it("supports the preview dashboard query entry", () => {
    const mode = getPreviewMode({
      hash: "",
      pathname: "/",
      search: "?preview=dashboard&controls=0",
    });

    expect(mode).toEqual({
      showControls: false,
    });
  });

  it("ignores removed concept query entries", () => {
    const mode = getPreviewMode({
      hash: "",
      pathname: "/",
      search: "?concept=dashboard&controls=0",
    });

    expect(mode).toBeNull();
  });

  it("retargets the preview index query entry to dashboard preview", () => {
    const mode = getPreviewMode({
      hash: "",
      pathname: "/",
      search: "?preview=index",
    });

    expect(mode).toEqual({
      showControls: true,
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
