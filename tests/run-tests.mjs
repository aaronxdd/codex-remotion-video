import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/creator.test.tsx"],
  outfile: "out/creator-test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  loader: { ".css": "empty" },
  plugins: [
    {
      name: "player-test-double",
      setup(build) {
        build.onResolve({ filter: /^@remotion\/player$/ }, () => ({
          path: "player-mock",
          namespace: "test",
        }));
        build.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          loader: "js",
          contents: `import React from 'react'; export const Player=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>({seekTo(){},play(){},pause(){}}));return React.createElement('div',{'data-testid':'player',inputProps:props.inputProps});});`,
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const result = spawnSync(process.execPath, ["out/creator-test.mjs"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
