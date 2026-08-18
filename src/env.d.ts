/// <reference types="../worker-configuration.d.ts" />

declare module "*.wasm" {
  const value: WebAssembly.Module;
  export default value;
}

declare module "*.wasm?module" {
  const value: WebAssembly.Module;
  export default value;
}

declare module "*.css?inline" {
  const css: string;
  export default css;
}

declare namespace App {
  interface Locals {
    user: import("./lib/types").PublicUser | null;
    origin: string;
    flash: string | null;
  }
}

interface Env {
  POSTHOG_PROJECT_API_KEY?: string;
  BEEHIIV_API_KEY?: string;
  X_BOT_REFRESH_TOKEN?: string;
  CRON_SECRET?: string;
  AI?: Ai;
}

declare namespace Cloudflare {
  interface Env {
    POSTHOG_PROJECT_API_KEY?: string;
    BEEHIIV_API_KEY?: string;
    X_BOT_REFRESH_TOKEN?: string;
    CRON_SECRET?: string;
    AI?: Ai;
  }
}

interface ImportMetaEnv {
  readonly SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
