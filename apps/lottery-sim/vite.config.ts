import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: '/lottery-sim',
  build: {
    outDir: '../../dist/lottery-sim',
    emptyOutDir: true,
  },
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "8081"),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
