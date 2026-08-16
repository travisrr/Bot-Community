/// <reference types="../worker-configuration.d.ts" />

declare namespace App {
  interface Locals {
    user: import("./lib/types").PublicUser | null;
    origin: string;
    flash: string | null;
  }
}

interface ImportMetaEnv {
  readonly SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
