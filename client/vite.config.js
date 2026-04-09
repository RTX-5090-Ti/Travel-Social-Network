import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          if (id.includes("/react-router/") || id.includes("/react-router-dom/")) {
            return "router-vendor";
          }

          if (id.includes("/framer-motion/")) {
            return "motion-vendor";
          }

          if (id.includes("/lucide-react/")) {
            return "icons-vendor";
          }

          if (id.includes("/socket.io-client/") || id.includes("/engine.io-client/")) {
            return "socket-vendor";
          }

          if (id.includes("/axios/")) {
            return "http-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
