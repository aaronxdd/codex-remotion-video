import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/news-ui.test.tsx"],
  outfile: "out/news-ui-test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  loader: { ".css": "empty" },
});
const result = spawnSync(process.execPath, ["out/news-ui-test.mjs"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
