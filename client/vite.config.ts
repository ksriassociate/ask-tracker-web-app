import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add this build target to ensure "import.meta" is supported.
  // This resolves the warning about "empty-import-meta".
  build: {
    target: 'es2020'
  }
});