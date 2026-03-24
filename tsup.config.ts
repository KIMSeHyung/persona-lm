import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "db/seed": "src/db/seed.ts",
    "mcp/stdio": "src/mcp/stdio.ts"
  },
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false
});
