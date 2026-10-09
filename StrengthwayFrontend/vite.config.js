import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(({ mode }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": srcDir },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
    ],
  },
  server: {
    port: 5173,
    watch: {
      awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
    },
  },
  plugins: [tailwindcss(), viteReact()],
  envPrefix: "VITE_",
  define:
    mode === "development" ? { "process.env.NODE_ENV": JSON.stringify("development") } : undefined,
}));
