import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function getVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("@mui/icons-material")) {
    return "mui-icons";
  }

  if (
    id.includes("@mui/material") ||
    id.includes("@emotion/react") ||
    id.includes("@emotion/styled") ||
    id.includes("react") ||
    id.includes("scheduler")
  ) {
    return "framework-vendor";
  }

  if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) {
    return "state-vendor";
  }

  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: getVendorChunk,
      },
    },
  },
});
