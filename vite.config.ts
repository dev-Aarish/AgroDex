import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import componentTagger from "./plugins/component-tagger";

export default defineConfig({
  plugins: [
    react(),
    componentTagger(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/lib/__tests__/setup.ts",
    exclude: ["**/node_modules/**", "backend/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/lib/__tests__/"],
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://agro-dex-nine.vercel.app",
        changeOrigin: true,
        headers: {
          "Access-Control-Allow-Origin": "https://agro-dex-1u85.vercel.app",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    },
    hmr: {
      overlay: false,
      timeout: 15000,
    },
    watch: {
      usePolling: true,
      interval: 500,
      binaryInterval: 500,
    },
  },
});