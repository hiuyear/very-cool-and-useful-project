// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Point all /api/* calls to your Express backend on 3000
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // If you still need to hit Flask for other routes:
      "/findHacker": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/summarizeCandidates": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/profile": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
