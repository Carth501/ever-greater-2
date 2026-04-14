const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const slicesDir = path.join(
  root,
  "ever-greater-client",
  "src",
  "store",
  "slices",
);

const allowedCrossImports = new Map([
  ["authSlice.ts", new Set(["./operationsSlice", "./ticketSlice"])],
]);

function getSliceFiles() {
  return fs
    .readdirSync(slicesDir)
    .filter((fileName) => fileName.endsWith("Slice.ts") && !fileName.endsWith(".test.ts"));
}

function findCrossSliceImports(source) {
  const importPattern = /from\s+["'](\.\/[A-Za-z]+Slice)["']/g;
  return Array.from(source.matchAll(importPattern), (match) => match[1]);
}

const violations = [];

for (const fileName of getSliceFiles()) {
  const filePath = path.join(slicesDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const allowedImports = allowedCrossImports.get(fileName) ?? new Set();

  for (const specifier of findCrossSliceImports(source)) {
    if (!allowedImports.has(specifier)) {
      violations.push(`${fileName} imports ${specifier}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Client slice boundary check failed:\n${violations.join("\n")}`,
  );
}

console.log("Client slice boundary check passed.");