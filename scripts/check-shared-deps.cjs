const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getSharedSpec(pkg, packageName) {
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  return deps[packageName] || devDeps[packageName] || null;
}

const root = path.resolve(__dirname, "..");
const clientPkg = readJson(path.join(root, "ever-greater-client", "package.json"));
const serverPkg = readJson(path.join(root, "ever-greater-server", "package.json"));

const packageName = "ever-greater-shared";
const clientSpec = getSharedSpec(clientPkg, packageName);
const serverSpec = getSharedSpec(serverPkg, packageName);

if (!clientSpec || !serverSpec) {
  throw new Error(
    `Missing ${packageName} dependency. client=${String(clientSpec)} server=${String(serverSpec)}`,
  );
}

if (clientSpec !== serverSpec) {
  throw new Error(
    `Dependency mismatch for ${packageName}: client=${clientSpec} server=${serverSpec}`,
  );
}

console.log(`Shared dependency check passed: ${packageName}=${clientSpec}`);
