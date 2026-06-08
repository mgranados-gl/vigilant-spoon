import { defineConfig } from "vite";

export default defineConfig({
  base: "/vigilant-spoon/",
  build: {
    outDir: "docs",
    sourcemap: true,
    target: "es2022"
  }
});
