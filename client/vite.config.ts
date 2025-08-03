import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // The 'react()' plugin is essential for Vite to handle React components.
  // I have removed the Replit-specific plugins which were causing the module not found error.
  plugins: [react()],
});