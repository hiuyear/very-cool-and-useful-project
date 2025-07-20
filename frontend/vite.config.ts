// vite.config.js
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
      // forward any call to /findHacker → Flask on 5000
      "/findHacker": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // if you later add a /api/search endpoint in Flask:
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
