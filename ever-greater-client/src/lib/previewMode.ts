export type PreviewMode =
  | {
      kind: "index";
    }
  | {
      kind: "dashboard";
      showControls: boolean;
    };

type LocationShape = Pick<Location, "hash" | "pathname" | "search">;

const DASHBOARD_HASH_ROUTES = new Set([
  "internal/preview/dashboard",
  "preview/dashboard",
]);

const INDEX_HASH_ROUTES = new Set(["internal/preview", "preview"]);

const DASHBOARD_PATH_ROUTES = new Set([
  "/internal/preview/dashboard",
  "/preview/dashboard",
]);

const INDEX_PATH_ROUTES = new Set(["/internal/preview", "/preview"]);

function getHashParts(hash: string): {
  hashPath: string;
  hashSearchParams: URLSearchParams;
} {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [rawHashPath, rawHashSearch = ""] = normalizedHash.split("?");

  return {
    hashPath: rawHashPath.replace(/^\/+|\/+$/g, ""),
    hashSearchParams: new URLSearchParams(rawHashSearch),
  };
}

export function getPreviewMode(location: LocationShape): PreviewMode | null {
  const searchParams = new URLSearchParams(location.search);
  const { hashPath, hashSearchParams } = getHashParts(location.hash);

  if (
    searchParams.get("preview") === "index" ||
    INDEX_HASH_ROUTES.has(hashPath) ||
    INDEX_PATH_ROUTES.has(location.pathname)
  ) {
    return { kind: "index" };
  }

  if (
    searchParams.get("concept") === "dashboard" ||
    searchParams.get("preview") === "dashboard"
  ) {
    return {
      kind: "dashboard",
      showControls: searchParams.get("controls") !== "0",
    };
  }

  if (
    DASHBOARD_HASH_ROUTES.has(hashPath) ||
    DASHBOARD_PATH_ROUTES.has(location.pathname)
  ) {
    return {
      kind: "dashboard",
      showControls:
        hashSearchParams.get("controls") !== "0" &&
        searchParams.get("controls") !== "0",
    };
  }

  return null;
}
