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
  | "generic";

const SVG_ATTRS =
  'class="tool-svg" viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"';

export function toolKey(name: string): ToolKey {
  const n = name.trim().toLowerCase();
  if (/(gmail|e-?mail|\bmail\b)/.test(n)) return "gmail";
  if (/\bslack\b/.test(n)) return "slack";
  if (/\bgithub\b/.test(n)) return "github";
  if (/\b(calendar|gcal)\b/.test(n)) return "calendar";
  if (/\bnotion\b/.test(n)) return "notion";
  if (/\blinear\b/.test(n)) return "linear";
  if (/\b(chrome|safari|firefox|browser)\b/.test(n)) return "browser";
  if (/(^|[^a-z])(x|twitter)([^a-z]|$)/.test(n)) return "x";
  if (/\bweb\b/.test(n)) return "web";
  return "generic";
}

export function toolIcon(name: string): string {
  const key = toolKey(name);
  switch (key) {
    case "gmail":
      return `<svg ${SVG_ATTRS}><path d="M2.5 4.5h11v8h-11v-8z" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 4.5l5.5 4 5.5-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case "slack":
      return `<svg ${SVG_ATTRS}><path d="M6 2.5v3M10 10.5v3M2.5 6h3M10.5 10h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="5.2" y="5.2" width="5.6" height="5.6" rx="1.2" stroke="currentColor" stroke-width="1.4"/></svg>`;
    case "github":
      return `<svg ${SVG_ATTRS}><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.4"/><path d="M6 12.2c.4-1.4.6-2.2 2-2.2s1.6.8 2 2.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
    case "calendar":
      return `<svg ${SVG_ATTRS}><rect x="2.5" y="3.5" width="11" height="10" rx="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    case "web":
      return `<svg ${SVG_ATTRS}><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h10M8 2.8c1.6 1.8 2.4 3.5 2.4 5.2S9.6 11.4 8 13.2M8 2.8C6.4 4.6 5.6 6.3 5.6 8s.8 3.4 2.4 5.2" stroke="currentColor" stroke-width="1.3"/></svg>`;
    case "x":
      return `<svg ${SVG_ATTRS}><path d="M4 3.5l8 9M12 3.5l-8 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    case "notion":
      return `<svg ${SVG_ATTRS}><path d="M4 3.5h7.2L12.5 5v7.5H4.8L3.5 11V3.5H4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 6v5M9.5 6v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
    case "linear":
      return `<svg ${SVG_ATTRS}><path d="M3.5 11.5L11.5 3.5M3.5 7.5l4-4M7.5 12.5l4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    case "browser":
      return `<svg ${SVG_ATTRS}><rect x="2.5" y="3.5" width="11" height="9" rx="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 6h11M5 4.8v.2M6.6 4.8v.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    case "generic":
      return `<svg ${SVG_ATTRS}><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/></svg>`;
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function toolsHtml(tools: string[], escape: (s: string) => string): string {
  if (!tools.length) return `<span class="tools-empty">—</span>`;
  return tools
    .map(
      (tool) =>
        `<span class="tool"><span class="tool-ic" aria-hidden="true">${toolIcon(tool)}</span>${escape(tool)}</span>`,
    )
    .join("");
}
