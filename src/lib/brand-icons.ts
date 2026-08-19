import type { SimpleIcon } from "simple-icons";
import {
  siAirtable,
  siAnki,
  siAnthropic,
  siApple,
  siArxiv,
  siBento,
  siBlender,
  siClaude,
  siClaudecode,
  siClickup,
  siCursor,
  siDatadog,
  siDiscord,
  siFigma,
  siGithubactions,
  siGodotengine,
  siGoogle,
  siGoogleads,
  siGoogleanalytics,
  siGoogledocs,
  siGoogledrive,
  siGooglemaps,
  siGooglemeet,
  siGooglephotos,
  siGooglesearchconsole,
  siGooglesheets,
  siGoogleslides,
  siHelpscout,
  siHubspot,
  siIcloud,
  siImessage,
  siInstagram,
  siIntercom,
  siPosthog,
  siPostiz,
  siQuickbooks,
  siReddit,
  siRss,
  siSnowflake,
  siSquarespace,
  siStripe,
  siTailscale,
  siUnity,
  siWebflow,
  siXero,
  siYcombinator,
  siYoutube,
  siZendesk,
  siZoom,
} from "simple-icons";

function mark(inner: string, viewBox = "0 0 24 24"): string {
  return `<svg class="tool-svg" viewBox="${viewBox}" width="16" height="16" aria-hidden="true">${inner}</svg>`;
}

function paint(hex: string): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return "#1c1916";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.78 ? "#1c1916" : `#${full}`;
}

function fromBrand(icon: SimpleIcon): string {
  return mark(`<path fill="${paint(icon.hex)}" d="${icon.path}"/>`);
}

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "");
}

const BY_NAME = new Map<string, string>();

function put(svg: string, ...names: string[]): void {
  for (const name of names) BY_NAME.set(norm(name), svg);
}

function putBrand(icon: SimpleIcon, ...names: string[]): void {
  put(fromBrand(icon), icon.title, ...names);
}

putBrand(siYoutube, "YouTube");
putBrand(siGoogledrive, "Google Drive");
putBrand(siGoogledocs, "Google Docs");
putBrand(siGooglesheets, "Google Sheets");
putBrand(siGoogleslides, "Google Slides");
putBrand(siGoogleanalytics, "Google Analytics", "Google Analytics 4", "GA4");
putBrand(siGoogleads, "Google Ads");
putBrand(siGooglemaps, "Google Maps");
putBrand(siGooglesearchconsole, "Google Search Console", "Search Console");
putBrand(siGoogle, "Google", "Google Search", "Google Trends", "Google Flights", "Google Ads Optimizer");
putBrand(siGooglephotos, "Google Photos", "Photos");
putBrand(siGooglemeet, "Google Meet");
putBrand(siGithubactions, "GitHub Actions");
putBrand(siZendesk, "Zendesk");
putBrand(siFigma, "Figma");
putBrand(siReddit, "Reddit");
putBrand(siDiscord, "Discord");
putBrand(siCursor, "Cursor");
putBrand(siStripe, "Stripe");
putBrand(siXero, "Xero");
putBrand(siQuickbooks, "QuickBooks");
putBrand(siHelpscout, "Help Scout");
putBrand(siIntercom, "Intercom");
putBrand(siClaude, "Claude");
putBrand(siClaudecode, "Claude Code");
putBrand(siAnthropic, "Anthropic");
putBrand(siPosthog, "PostHog");
putBrand(siPostiz, "Postiz");
putBrand(siSquarespace, "Squarespace");
putBrand(siWebflow, "Webflow");
putBrand(siInstagram, "Instagram");
putBrand(siHubspot, "HubSpot");
putBrand(siUnity, "Unity");
putBrand(siGodotengine, "Godot", "Godot Engine");
putBrand(siBlender, "Blender");
putBrand(siArxiv, "arXiv");
putBrand(siClickup, "ClickUp");
putBrand(siTailscale, "Tailscale");
putBrand(siApple, "Apple", "Apple Watch");
putBrand(siImessage, "iMessage", "Apple Messages");
putBrand(siYcombinator, "Hacker News", "HN", "Y Combinator");
putBrand(siZoom, "Zoom");
putBrand(siDatadog, "Datadog");
putBrand(siAirtable, "Airtable");
putBrand(siIcloud, "iCloud");
putBrand(siAnki, "Anki");
putBrand(siBento, "Bento", "Bento Chat");
putBrand(siSnowflake, "Snowflake");
putBrand(siRss, "Podcast RSS feeds", "RSS");

const SALESFORCE = mark(
  `<path fill="#00A1E0" d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 01-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 018.88 20.4a4.302 4.302 0 01-4.05-2.82c-.27.062-.54.076-.825.076-2.204 0-4.005-1.8-4.005-4.05 0-1.5.811-2.805 2.01-3.51-.255-.57-.39-1.2-.39-1.846 0-2.58 2.1-4.65 4.65-4.65 1.53 0 2.85.705 3.72 1.8"/>`,
);
const LINKEDIN = mark(
  `<path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`,
);
const OPENAI = mark(
  `<path fill="#412991" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>`,
);
const OUTLOOK = mark(
  `<path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"/>`,
);
const TWILIO = mark(
  `<path fill="#F22F46" d="M12 0C5.381-.008.008 5.352 0 11.971V12c0 6.64 5.359 12 12 12 6.64 0 12-5.36 12-12 0-6.641-5.36-12-12-12zm0 20.801c-4.846.015-8.786-3.904-8.801-8.75V12c-.014-4.846 3.904-8.786 8.75-8.801H12c4.847-.014 8.786 3.904 8.801 8.75V12c.015 4.847-3.904 8.786-8.75 8.801H12zm5.44-11.76c0 1.359-1.12 2.479-2.481 2.479-1.366-.007-2.472-1.113-2.479-2.479 0-1.361 1.12-2.481 2.479-2.481 1.361 0 2.481 1.12 2.481 2.481zm0 5.919c0 1.36-1.12 2.48-2.481 2.48-1.367-.008-2.473-1.114-2.479-2.48 0-1.359 1.12-2.479 2.479-2.479 1.361-.001 2.481 1.12 2.481 2.479zm-5.919 0c0 1.36-1.12 2.48-2.479 2.48-1.368-.007-2.475-1.113-2.481-2.48 0-1.359 1.12-2.479 2.481-2.479 1.358-.001 2.479 1.12 2.479 2.479zm0-5.919c0 1.359-1.12 2.479-2.479 2.479-1.367-.007-2.475-1.112-2.481-2.479 0-1.361 1.12-2.481 2.481-2.481 1.358 0 2.479 1.12 2.479 2.481z"/>`,
);
const GROK = mark(
  `<path fill="#111" d="M12 1.4 13.35 8.6 20.6 6.05 15.4 12l5.2 5.95-7.25-2.55L12 22.6l-1.35-7.2-7.25 2.55L8.6 12 3.4 6.05l7.25 2.55Z"/>`,
);
const GONG = mark(
  `<circle cx="12" cy="12" r="8.2" fill="none" stroke="#E11D48" stroke-width="2.6"/><circle cx="12" cy="12" r="2.3" fill="#E11D48"/>`,
);
const GRANOLA = mark(
  `<circle cx="12" cy="12" r="10" fill="#E8A020"/><path fill="#fff" d="M12 4.5c2.4 3.4 2.6 6.8 0 11.2-2.6-4.4-2.4-7.8 0-11.2z"/><path fill="#fff" d="M7.2 9.2c2.2 1.4 4.4 1.6 9.6 0-5.2 2.8-7.4 2.6-9.6 0z"/>`,
);
const FABLE = mark(
  `<rect x="3" y="4" width="18" height="16" rx="2.2" fill="#5B4CFF"/><path fill="#fff" d="M8 8h8v1.6H8zm0 3.2h8v1.6H8zm0 3.2h5.5V16H8z"/>`,
);
const GLEAN = mark(
  `<circle cx="12" cy="12" r="10" fill="#0B6EFE"/><path fill="#fff" d="M10.2 7.2h3.6c2 0 3.3 1.2 3.3 3.1 0 1.4-.7 2.4-1.9 2.8L17.4 17h-2.2l-1.9-3.6H12V17h-1.8zm3.4 5.1c.9 0 1.5-.6 1.5-1.5s-.6-1.5-1.5-1.5h-1.6v3h1.6z"/>`,
);
const LUMA = mark(
  `<circle cx="12" cy="12" r="10" fill="#111"/><circle cx="12" cy="12" r="4.2" fill="#7CFFB2"/>`,
);
const MATIC = mark(
  `<rect x="4" y="8" width="16" height="10" rx="3" fill="#2D6CDF"/><circle cx="8.5" cy="18.5" r="2.1" fill="#1c1916"/><circle cx="15.5" cy="18.5" r="2.1" fill="#1c1916"/><rect x="8" y="4.5" width="8" height="5" rx="1.2" fill="#6EA0F5"/>`,
);
const BEE = mark(
  `<ellipse cx="12" cy="13" rx="6.5" ry="7" fill="#F5C400"/><path fill="#1c1916" d="M6.2 11h11.6v1.6H6.2zm0 3.2h11.6v1.6H6.2z"/><path fill="#8EC5FF" d="M4 10c2-4 4-5 5.2-4.2C8 9 6.6 11 4 10zm16 0c-2-4-4-5-5.2-4.2C16 9 17.4 11 20 10z"/>`,
);
const AHREFS = mark(
  `<path fill="#FF8C00" d="M3 18.5 10.2 6.2h3.6L21 18.5h-3.3l-1.7-3.1H8.9l-1.7 3.1zm7.2-5.5h3.6L12 8.6z"/>`,
);
const CAPCUT = mark(
  `<rect width="24" height="24" rx="6" fill="#111"/><path fill="#fff" d="M8 6.5h3.2L16 12l-4.8 5.5H8L12.7 12z"/>`,
);
const PIZZA_HUT = mark(
  `<path fill="#EE3A43" d="M12 3 22 19H2z"/><path fill="#fff" d="M12 8.4 17.6 17H6.4z"/>`,
);
const PAPA_JOHNS = mark(
  `<circle cx="12" cy="12" r="10" fill="#00853E"/><path fill="#fff" d="M8.1 6.8h3.4c2.7 0 4.4 1.5 4.4 3.8 0 2.4-1.7 3.9-4.5 3.9H10v2.7H8.1zm3.2 5.8c1.3 0 2.2-.8 2.2-2s-.8-1.9-2.2-1.9H10v3.9z"/>`,
);
const WHOLE_FOODS = mark(
  `<circle cx="12" cy="12" r="10" fill="#00674B"/><path fill="#fff" d="M12 5c2.8 3.6 3 7.2 0 14-3-6.8-2.8-10.4 0-14z"/><path fill="#fff" d="M6.5 11.2c3 1.6 6.2 1.8 11 0-4.8 3.4-8 3.2-11 0z"/>`,
);
const HYPERLIQUID = mark(
  `<path fill="#00D1B2" d="M4 16.5 12 3.8 20 16.5h-3.2L12 8.6 7.2 16.5z"/><path fill="#0B3D38" d="M8.2 18.8h7.6v2.2H8.2z"/>`,
);
const AXIOM = mark(
  `<path fill="#5B4CFF" d="M12 3 21 20H3z"/><path fill="#fff" d="M12 8.6 16.6 18H7.4z"/>`,
);
const INFISICAL = mark(
  `<rect width="24" height="24" rx="6" fill="#5C4BFF"/><path fill="#fff" d="M8 11.2V10a4 4 0 1 1 8 0v1.2h1.4V18H6.6v-6.8zm2.2-1.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v1.2h-3.6z"/>`,
);
const CASTOS = mark(
  `<circle cx="12" cy="12" r="10" fill="#5B4CFF"/><path fill="#fff" d="M9 8.2h2.4v7.6H9zm3.6 1.6h2.4v4.4h-2.4z"/>`,
);
const FEEDHIVE = mark(
  `<path fill="#FFB703" d="M12 3 20 8.2v7.6L12 21 4 15.8V8.2z"/><path fill="#1c1916" d="M8.4 10.2h7.2v1.5H8.4zm0 2.6h7.2v1.5H8.4z"/>`,
);
const SCREENSHOTONE = mark(
  `<rect x="3" y="6" width="18" height="13" rx="2.2" fill="#2563EB"/><circle cx="12" cy="12.5" r="3.4" fill="#fff"/><rect x="8" y="3.6" width="8" height="3.2" rx="1" fill="#1D4ED8"/>`,
);
const CLICKFLOW = mark(
  `<path fill="#2563EB" d="M4 12a8 8 0 1 1 8 8v-3.2a4.8 4.8 0 1 0-4.8-4.8H4z"/><circle cx="17.4" cy="17.4" r="3.2" fill="#22C55E"/>`,
);
const CONVERLY = mark(
  `<rect width="24" height="24" rx="6" fill="#0F766E"/><path fill="#fff" d="M7 12.8 10.4 16 17 8.8l-1.5-1.4-5.1 5.3-2-1.9z"/>`,
);
const HIRENIMBUS = mark(
  `<path fill="#38BDF8" d="M7.2 14.8a4.2 4.2 0 0 1 .4-8.4 5.2 5.2 0 0 1 10 1.6 3.6 3.6 0 0 1 .6 7.1H7.4z"/>`,
);
const DELULU = mark(
  `<circle cx="12" cy="12" r="10" fill="#EC4899"/><path fill="#fff" d="M8 13.2c.8 2.2 2.2 3.4 4 3.4s3.2-1.2 4-3.4"/>`,
);
const FERNDESK = mark(
  `<rect width="24" height="24" rx="6" fill="#15803D"/><path fill="#BBF7D0" d="M12 4c3 4 3 8 0 16-3-8-3-12 0-16z"/><path fill="#fff" d="M6.8 11c3 1.6 6.4 1.8 10.4 0-4 2.8-7.4 2.6-10.4 0z"/>`,
);
const MAILOPS = mark(
  `<rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#0F766E"/><path fill="#fff" d="M4 7.2 12 13l8-5.8V8.8L12 14.7 4 8.8z"/>`,
);
const HELPSPOT = mark(
  `<circle cx="12" cy="12" r="10" fill="#F59E0B"/><path fill="#fff" d="M12 6.4c2.3 0 3.8 1.4 3.8 3.3 0 1.5-1 2.4-2.2 3l-.6.4v1.3h-2V12l1.1-.6c.8-.4 1.2-.9 1.2-1.6 0-.8-.6-1.3-1.5-1.3-.9 0-1.5.5-1.6 1.3H8.8c.2-1.8 1.6-3.4 3.2-3.4zM11 16.8h2v2h-2z"/>`,
);
const EXIFTOOL = mark(
  `<rect x="3" y="7" width="18" height="12" rx="2" fill="#334155"/><circle cx="12" cy="13" r="3.4" fill="#94A3B8"/><rect x="8" y="4.4" width="8" height="3.2" rx="1" fill="#1E293B"/>`,
);
const TRENDSVC = mark(
  `<rect width="24" height="24" rx="6" fill="#111"/><path fill="none" stroke="#4ADE80" stroke-width="2.2" d="M4 16.5 9 11l3.5 3.5L20 7"/>`,
);
const COMP_AI = mark(
  `<rect width="24" height="24" rx="6" fill="#111"/><path fill="#fff" d="M8 8h8v2H8zm0 3h8v2H8zm0 3h5v2H8z"/><circle cx="17.2" cy="16.6" r="2.2" fill="#22C55E"/>`,
);
const ILLIO = mark(
  `<rect width="24" height="24" rx="6" fill="#7C3AED"/><circle cx="9" cy="10" r="1.6" fill="#fff"/><circle cx="15" cy="10" r="1.6" fill="#fff"/><path fill="#fff" d="M8 14.4c1.2 1.8 2.8 2.6 4 2.6s2.8-.8 4-2.6"/>`,
);
const FAA = mark(
  `<path fill="#002868" d="M3 4h18v16H3z"/><path fill="#BF0A30" d="M3 4h7.5v16H3z"/><path fill="#fff" d="M5.2 6.2h3.1v1.4H5.2zm0 2.6h3.1v1.4H5.2zm0 2.6h3.1v1.4H5.2z"/>`,
);
const BIBLE = mark(
  `<path fill="#7C2D12" d="M5 4.2h12.5a1.5 1.5 0 0 1 1.5 1.5V19H6.4A1.4 1.4 0 0 1 5 17.6z"/><path fill="#FDE68A" d="M7.2 6.4h10v11.2H7.2z"/><path fill="#7C2D12" d="M11.2 8.2h2v8h-2zM9 11.2h6.4v2H9z"/>`,
);
const SMS = mark(
  `<path fill="#16A34A" d="M4 5.5h16a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H9l-4.5 3.2V17H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2z"/><circle cx="8.2" cy="11.2" r="1.1" fill="#fff"/><circle cx="12" cy="11.2" r="1.1" fill="#fff"/><circle cx="15.8" cy="11.2" r="1.1" fill="#fff"/>`,
);
const PLANE = mark(
  `<path fill="#4285F4" d="m3 13.2 7.4-1.2L21 5.2l-8.6 8.2 1.4 6.6-3.2-4.2-4.8 1.6z"/>`,
);

put(SALESFORCE, "Salesforce");
put(LINKEDIN, "LinkedIn", "Sales Navigator");
put(OPENAI, "OpenAI", "ChatGPT", "Codex", "Codex CLI");
put(OUTLOOK, "Outlook", "Microsoft Outlook");
put(TWILIO, "Twilio");
put(GROK, "Grok", "Grok Bot", "Grok Bots", "xAI", "HyperGrok");
put(GONG, "Gong");
put(GRANOLA, "Granola");
put(FABLE, "Fable");
put(GLEAN, "Glean");
put(LUMA, "Luma");
put(MATIC, "Matic");
put(BEE, "Bee");
put(AHREFS, "Ahrefs");
put(CAPCUT, "CapCut");
put(PIZZA_HUT, "Pizza Hut");
put(PAPA_JOHNS, "Papa John's", "Papa Johns");
put(WHOLE_FOODS, "Whole Foods");
put(HYPERLIQUID, "Hyperliquid");
put(AXIOM, "Axiom");
put(INFISICAL, "Infisical");
put(CASTOS, "Castos");
put(FEEDHIVE, "FeedHive");
put(SCREENSHOTONE, "ScreenshotOne");
put(CLICKFLOW, "ClickFlow");
put(CONVERLY, "Converly");
put(HIRENIMBUS, "HireNimbus");
put(DELULU, "Delulu Social", "Delulu");
put(FERNDESK, "Ferndesk");
put(MAILOPS, "MailOps");
put(HELPSPOT, "HelpSpot");
put(EXIFTOOL, "ExifTool");
put(TRENDSVC, "Trends.vc");
put(COMP_AI, "Comp AI");
put(ILLIO, "illo_skill");
put(FAA, "FAA NOTAM Search", "Aviation Weather Center");
put(BIBLE, "Bible");
put(SMS, "SMS");
const CLOUD = mark(
  `<path fill="#64748B" d="M8.2 17.5a4.2 4.2 0 0 1 .5-8.3 5.4 5.4 0 0 1 10.2 1.7 3.7 3.7 0 0 1 .6 7.1H8.4z"/>`,
);
const NOTE = mark(
  `<path fill="#CA8A04" d="M6 3.5h9l5 5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5z"/><path fill="#FEF3C7" d="M14.5 3.8V9h5.2z"/>`,
);
const BOOK = mark(
  `<path fill="#7C2D12" d="M5 4h13a1.5 1.5 0 0 1 1.5 1.5V19H6.2A1.2 1.2 0 0 1 5 17.8z"/><path fill="#FDE68A" d="M7 6h11v12H7z"/>`,
);
const CARDS = mark(
  `<rect x="5" y="6" width="11" height="14" rx="1.4" fill="#6366F1"/><rect x="8" y="4" width="11" height="14" rx="1.4" fill="#A5B4FC"/>`,
);
const SHARE = mark(
  `<circle cx="6.2" cy="12" r="2.4" fill="#2563EB"/><circle cx="17.4" cy="6.4" r="2.4" fill="#2563EB"/><circle cx="17.4" cy="17.6" r="2.4" fill="#2563EB"/><path fill="none" stroke="#2563EB" stroke-width="1.8" d="M8.2 11.2 15.2 7.4M8.2 12.8 15.2 16.6"/>`,
);
const FOLDER = mark(
  `<path fill="#F59E0B" d="M3.5 7.2h6.2l1.6 1.6H20.5v10.2H3.5z"/>`,
);
const SERVER = mark(
  `<rect x="4" y="4" width="16" height="5.2" rx="1.2" fill="#334155"/><rect x="4" y="9.4" width="16" height="5.2" rx="1.2" fill="#475569"/><rect x="4" y="14.8" width="16" height="5.2" rx="1.2" fill="#334155"/><circle cx="7.2" cy="6.6" r=".9" fill="#4ADE80"/><circle cx="7.2" cy="12" r=".9" fill="#4ADE80"/><circle cx="7.2" cy="17.4" r=".9" fill="#4ADE80"/>`,
);
const SHIELD = mark(
  `<path fill="#0F766E" d="M12 3 20 6.4v6.2c0 4.4-3.2 7.4-8 8.8-4.8-1.4-8-4.4-8-8.8V6.4z"/><path fill="#fff" d="m10.2 13.6-2.4-2.4 1.4-1.4 1 1 3.4-3.4 1.4 1.4z"/>`,
);
const LOGS = mark(
  `<rect x="4" y="4" width="16" height="16" rx="2" fill="#1E293B"/><path fill="#94A3B8" d="M7 8h10v1.5H7zm0 3.2h10v1.5H7zm0 3.2h7v1.5H7z"/>`,
);
const FILM = mark(
  `<rect x="3" y="6" width="18" height="12" rx="1.6" fill="#111"/><path fill="#F8FAFC" d="M5 8h2v2H5zm0 4h2v2H5zm12-4h2v2h-2zm0 4h2v2h-2z"/><rect x="8.2" y="8" width="7.6" height="8" fill="#64748B"/>`,
);
const BANK = mark(
  `<path fill="#1D4ED8" d="M4 10h16v9H4zm8-7 9 5.4H3z"/><path fill="#93C5FD" d="M7 12.2h2.2V19H7zm4 0h2.2V19H11zm4 0h2.2V19H15z"/>`,
);
const BRIEFCASE = mark(
  `<rect x="3.5" y="8" width="17" height="11" rx="1.6" fill="#334155"/><path fill="#1E293B" d="M9 6.2h6v2.4H9z"/>`,
);
const LAYOUT = mark(
  `<rect x="3" y="4" width="18" height="16" rx="2" fill="#475569"/><rect x="5" y="6" width="6" height="12" fill="#CBD5E1"/><rect x="12.2" y="6" width="6.8" height="5.4" fill="#E2E8F0"/><rect x="12.2" y="12.6" width="6.8" height="5.4" fill="#E2E8F0"/>`,
);
const GLOBE_SITES = mark(
  `<circle cx="12" cy="12" r="9" fill="none" stroke="#2563EB" stroke-width="2"/><path fill="none" stroke="#2563EB" stroke-width="1.6" d="M3.2 12h17.6M12 3.2c2.4 2.6 3.6 5.4 3.6 8.8S14.4 18.2 12 20.8C9.6 18.2 8.4 15.4 8.4 12S9.6 5.8 12 3.2"/>`,
);

put(CLOUD, "cloud storage service");
put(NOTE, "note-taking service");
put(BOOK, "e-reader");
put(CARDS, "flashcard app");
put(SHARE, "social media");
put(FOLDER, "Scanned-image folder");
put(SERVER, "Remote VM");
put(SHIELD, "SPF", "DKIM", "DMARC");
put(LOGS, "SMTP logs");
put(FILM, "video editing app");
put(BANK, "Self-hosted finance system");
put(BRIEFCASE, "CRM");
put(LAYOUT, "CMS");
put(GLOBE_SITES, "Contractor websites");

const PALETTE = ["#0F766E", "#1D4ED8", "#B45309", "#7C3AED", "#BE123C", "#365314", "#0E7490", "#9A3412"];

function letterMark(name: string): string {
  const letter = (name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1) || "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const fill = PALETTE[hash % PALETTE.length];
  return mark(
    `<rect width="24" height="24" rx="6" fill="${fill}"/><text x="12" y="16.2" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="ui-sans-serif,system-ui,sans-serif">${letter}</text>`,
  );
}

export function brandIconSvg(name: string): string | null {
  const key = norm(name);
  if (!key) return null;
  return BY_NAME.get(key) ?? null;
}

export function fallbackToolIcon(name: string): string {
  return letterMark(name.trim() || "?");
}
