import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: '/history-timeline',
  build: {
    outDir: '../../dist/history-timeline',
    emptyOutDir: true,
  },
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "8085"),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
});
