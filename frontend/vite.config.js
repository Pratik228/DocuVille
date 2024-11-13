import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Get the environment variable directly during config
// eslint-disable-next-line no-undef
const API_URL = process.env.VITE_API_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: API_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
