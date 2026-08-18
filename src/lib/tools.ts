import { parseJsonArray } from "./html";

export type ToolKey =
  | "gmail"
  | "slack"
  | "github"
  | "calendar"
  | "web"
  | "x"
  | "notion"
  | "linear"
  | "browser"
  | "lighthouse"
  | "generic";

const CANON_LABEL: Record<Exclude<ToolKey, "generic">, string> = {
  gmail: "Gmail",
  slack: "Slack",
  github: "GitHub",
  calendar: "Calendar",
  web: "web",
  x: "X",
  notion: "Notion",
  linear: "Linear",
  browser: "browser",
  lighthouse: "Lighthouse",
};

const WEAK_LABEL: Record<Exclude<ToolKey, "generic">, string[]> = {
  gmail: ["email", "e-mail", "mail", "e mail", "google mail"],
  slack: [],
  github: ["gh", "git hub"],
  calendar: ["gcal", "google calendar"],
  web: ["www", "internet", "the web"],
  x: ["twitter", "x.com"],
  notion: [],
  linear: [],
  browser: ["browser", "web browser", "the browser"],
  lighthouse: ["psi", "pagespeed"],
};

function mark(inner: string, viewBox = "0 0 24 24"): string {
  return `<svg class="tool-svg" viewBox="${viewBox}" width="16" height="16" aria-hidden="true">${inner}</svg>`;
}

export function toolKey(name: string): ToolKey {
  const n = name.trim().toLowerCase();
  if (/(gmail|e-?mail|\bmail\b)/.test(n)) return "gmail";
  if (/\bslack\b/.test(n)) return "slack";
  if (/\bgithub\b/.test(n)) return "github";
  if (/\b(calendar|gcal)\b/.test(n)) return "calendar";
  if (/\bnotion\b/.test(n)) return "notion";
  if (/\blinear\b/.test(n)) return "linear";
  if (/\blighthouse\b/.test(n)) return "lighthouse";
  if (/\b(chrome|safari|firefox|browser)\b/.test(n)) return "browser";
  if (/(^|[^a-z])(x|twitter)([^a-z]|$)/.test(n)) return "x";
  if (/\bweb\b/.test(n)) return "web";
  return "generic";
}

function groupKey(name: string): string {
  const key = toolKey(name);
  if (key === "generic") return `generic:${name.trim().toLowerCase()}`;
  return key;
}

function pickLabel(names: string[], key: ToolKey): string {
  if (key === "generic") return names[0]?.trim() || "";
  const weak = new Set(WEAK_LABEL[key]);
  const specific = names.find((n) => !weak.has(n.trim().toLowerCase()));
  if (!specific) return CANON_LABEL[key];
  const trimmed = specific.trim();
  if (trimmed.toLowerCase() === CANON_LABEL[key].toLowerCase()) return CANON_LABEL[key];
  return trimmed;
}

export function duplicateConnectorGroups(tools: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const tool of tools) {
    const trimmed = tool.trim();
    if (!trimmed) continue;
    const key = groupKey(trimmed);
    const list = groups.get(key) ?? [];
    if (!list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) list.push(trimmed);
    groups.set(key, list);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

export function dedupeConnectors(tools: string[]): string[] {
  const order: string[] = [];
  const groups = new Map<string, string[]>();
  for (const tool of tools) {
    const trimmed = tool.trim();
    if (!trimmed) continue;
    const key = groupKey(trimmed);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    const list = groups.get(key) ?? [];
    if (!list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) list.push(trimmed);
  }
  return order.map((key) => {
    const names = groups.get(key) ?? [];
    const tool = key.startsWith("generic:") ? "generic" : (key as ToolKey);
    return pickLabel(names, tool);
  });
}

export function parseConnectors(raw: string | null | undefined): string[] {
  return dedupeConnectors(parseJsonArray(raw));
}

export function toolIcon(name: string): string {
  const key = toolKey(name);
  switch (key) {
    case "gmail":
      return mark(
        `<path fill="#4CAF50" d="M45 16.2 40 18.95 35 23.7V40h7c1.657 0 3-1.343 3-3V16.2z"/><path fill="#1E88E5" d="M3 16.2 6.614 17.91 13 23.25V40H6c-1.657 0-3-1.343-3-3V16.2z"/><polygon fill="#E53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.25 24,31.5 35,23.25 36,17"/><path fill="#C62828" d="M3 12.298V16.2l10 7.05V11.2L9.876 8.726C9.132 8.223 8.228 8 7.298 8 4.619 8 3 9.619 3 12.298z"/><path fill="#FBC02D" d="M45 12.298V16.2l-10 7.05V11.2l3.124-2.474C38.868 8.223 39.772 8 40.702 8 43.381 8 45 9.619 45 12.298z"/>`,
        "0 0 48 48",
      );
    case "slack":
      return mark(
        `<path fill="#36C5F0" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/><path fill="#2EB67D" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/><path fill="#ECB22E" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/><path fill="#E01E5A" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>`,
      );
    case "github":
      return mark(
        `<path fill="#F0F6FC" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>`,
      );
    case "calendar":
      return mark(
        `<path fill="#1A73E8" d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z"/>`,
      );
    case "web":
      return mark(
        `<circle cx="12" cy="12" r="10" fill="#4285F4"/><ellipse cx="12" cy="12" rx="4.2" ry="10" fill="none" stroke="#E8F0FE" stroke-width="1.35"/><path d="M2.2 12h19.6M4.2 7.2h15.6M4.2 16.8h15.6" fill="none" stroke="#E8F0FE" stroke-width="1.35"/>`,
      );
    case "x":
      return mark(
        `<path fill="#F5F5F5" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>`,
      );
    case "notion":
      return mark(
        `<path fill="#F5F5F5" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>`,
      );
    case "linear":
      return mark(
        `<path fill="#5E6AD2" d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z"/>`,
      );
    case "browser":
      return mark(
        `<path fill="#EA4335" d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0z"/><path fill="#34A853" d="M1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29z"/><path fill="#FBBC05" d="M15.273 7.636a5.446 5.446 0 0 1 1.45 7.09l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364z"/><circle cx="12" cy="12" r="4.364" fill="#4285F4"/>`,
      );
    case "lighthouse":
      return mark(
        `<path fill="#0CCE6B" d="M12 0l5.5 3.5v5H20v3h-2.25l2 12.5H4.25l2-12.5H4v-3h2.5V3.53zm2.94 13.25-6.22 2.26L8 20.04l7.5-2.75zM12 3.56 9.5 5.17V8.5h5V5.15Z"/>`,
      );
    case "generic":
      return mark(
        `<circle cx="12" cy="12" r="9" fill="none" stroke="var(--brass)" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="var(--brass)"/>`,
      );
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function toolsHtml(tools: string[], escape: (s: string) => string): string {
  const unique = dedupeConnectors(tools);
  if (!unique.length) return `<span class="tools-empty">—</span>`;
  return unique
    .map(
      (tool) =>
        `<span class="tool"><span class="tool-ic" aria-hidden="true">${toolIcon(tool)}</span>${escape(tool)}</span>`,
    )
    .join("");
}
