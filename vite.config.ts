import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "docs",
    sourcemap: true,
    target: "es2022"
  }
});
