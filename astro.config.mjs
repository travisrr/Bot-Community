// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://really.bot",
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node",
  }),
  session: false,
  build: {
    inlineStylesheets: "always",
  },
  server: {
    host: true,
  },
  security: {
    checkOrigin: true,
  },
  vite: {
    optimizeDeps: {
      include: ["astro/assets/services/noop"],
    },
  },
});
