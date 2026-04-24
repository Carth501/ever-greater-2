export type PreviewMode = {
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

function resolveShowControls(
  searchParams: URLSearchParams,
  hashSearchParams: URLSearchParams,
): boolean {
  return (
    searchParams.get("controls") !== "0" &&
    hashSearchParams.get("controls") !== "0"
  );
}

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
    searchParams.get("preview") === "dashboard" ||
    INDEX_HASH_ROUTES.has(hashPath) ||
    INDEX_PATH_ROUTES.has(location.pathname) ||
    DASHBOARD_HASH_ROUTES.has(hashPath) ||
    DASHBOARD_PATH_ROUTES.has(location.pathname)
  ) {
    return {
      showControls: resolveShowControls(searchParams, hashSearchParams),
    };
  }

  return null;
}
