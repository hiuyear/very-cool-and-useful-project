// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
<<<<<<< HEAD
import path from "node:path";
import { fileURLToPath } from "node:url";

// Recreate __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
=======
import path from "path";
>>>>>>> 0b25400e6c3e5ad7710a59c28054bd9998e97c40

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
