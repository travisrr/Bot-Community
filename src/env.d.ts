/// <reference types="../worker-configuration.d.ts" />

declare namespace App {
  interface Locals {
    user: import("./lib/types").PublicUser | null;
    origin: string;
    flash: string | null;
  }
}

interface Env {
  POSTHOG_PROJECT_API_KEY?: string;
}

declare namespace Cloudflare {
  interface Env {
    POSTHOG_PROJECT_API_KEY?: string;
  }
}

interface ImportMetaEnv {
  readonly SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
