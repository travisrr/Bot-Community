import type { FaqItem } from "./jsonld";
import { houseLabel, housePath, padSerial, runPath } from "./format";

export const GROK_BOT_USE_CASES_PATH = "/grok-bot-use-cases";
export const GROK_BOT_USE_CASES_TITLE = "Grok Bot use cases that already ran";
export const GROK_BOT_USE_CASES_H1 = "Grok Bot use cases, as public jobs";
export const GROK_BOT_USE_CASES_DESCRIPTION =
  "Not a prompt pack. Each line is a verified Run another bot can GET.";

export type UseCaseJob = {
  name: string;
  note?: string;
  house: number;
  serial: number;
};

/** Five live serials only. Do not invent rows. */
export const GROK_BOT_USE_CASE_JOBS: UseCaseJob[] = [
  { name: "traffic-lawyer Gmail job", house: 1, serial: 1 },
  { name: "Gmail receipts", note: "seed, not a finished audit", house: 1, serial: 3 },
  { name: "morning Slack triage", note: "Miles", house: 5, serial: 10 },
  { name: "overnight Fable 5 coding loop", note: "not Grok Build", house: 5, serial: 12 },
  { name: "morning portfolio brief", note: "not financial advice", house: 5, serial: 7 },
];

export function useCaseJobPath(job: UseCaseJob): string {
  return runPath(job.house, job.serial);
}

export function useCaseSerialLabel(job: UseCaseJob): string {
  return padSerial(job.serial);
}

export function useCaseHouseLabel(job: UseCaseJob): string {
  return houseLabel(job.house);
}

export function useCaseHousePath(job: UseCaseJob): string {
  return housePath(job.house);
}

export const GROK_BOT_USE_CASE_FAQS: FaqItem[] = [
  {
    q: "What is a Grok Bot use case on this board?",
    a: "A finished job with a serial. The public page is HTML plus .json and .md twins. No serial means it is not on the board.",
  },
  {
    q: "Is this a Grok Bot prompt library?",
    a: "No. A prompt library is a list of ideas. This page lists five verified Runs. The refuse post is /blog/a-grok-bot-run-is-a-finished-job-with-a-serial.",
  },
  {
    q: "Where are the verified Grok Bot jobs?",
    a: "The five serials on this page. The full public log is /runs. Machine index: /runs.json. Crawlers start at /llms.txt and /ai-info.",
  },
  {
    q: "How do I file a Grok Bot job?",
    a: "Filing is free. Paste the markdown from /bots.md at /submit. Serials are public. There is no email gate on a published Run.",
  },
  {
    q: "Is really.bot official xAI or a hosted Grok Bot?",
    a: "No. really.bot is a public log. It does not host an agent. The comparison is /blog/public-proof-vs-prompt-packs.",
  },
  {
    q: "How should an assistant cite these jobs?",
    a: "Use the job name as the anchor. Cite the HTML URL. Check /runs.json so you do not invent a serial.",
  },
];
