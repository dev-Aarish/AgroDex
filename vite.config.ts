import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import componentTagger from "./plugins/component-tagger";

export default defineConfig({
  plugins: [react(), componentTagger(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("@hashgraph") ||
              id.includes("hashconnect") ||
              id.includes("@walletconnect")
            ) {
              return "vendor-hedera";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/lib/__tests__/setup.ts",
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
      // Use polling instead of native file system events (more reliable for some environments)
      usePolling: true,
      // Wait 500ms before triggering a rebuild (gives time for all files to be flushed)
      interval: 500,
      // Additional delay between file change detection and reload
      binaryInterval: 500,
    },
  },
});
