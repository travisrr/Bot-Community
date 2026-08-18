import { handle } from "@astrojs/cloudflare/handler";
import { pollXMentions } from "./lib/x-import";
import { processQueuedQaRevisits } from "./lib/qa";
import {
  maybeQueueDailyPromptStrengthens,
  MAX_DAILY_PROMPT_STRENGTHENS,
  processQueuedPromptStrengthens,
  runDailyPromptStrengthens,
} from "./lib/prompt-strengthen";
import { fillMissingXBios } from "./lib/x-bio";
import { DAILY_PROMPT_CRON, MINUTE_CRON } from "./lib/cron";
import { setEnv } from "./lib/env";

async function runMinuteJobs() {
  try {
    const mentions = await pollXMentions();
    console.log(JSON.stringify({ event: "x_mentions_poll", ...mentions }));
  } catch (err) {
    console.error(JSON.stringify({ event: "x_mentions_poll_failed", error: String(err) }));
  }
  try {
    const qa = await processQueuedQaRevisits();
    console.log(JSON.stringify({ event: "qa_revisit_poll", ...qa }));
  } catch (err) {
    console.error(JSON.stringify({ event: "qa_revisit_poll_failed", error: String(err) }));
  }
  try {
    const queued = await maybeQueueDailyPromptStrengthens();
    const prompts = await processQueuedPromptStrengthens(
      queued.skipped ? 2 : MAX_DAILY_PROMPT_STRENGTHENS,
    );
    console.log(JSON.stringify({ event: "prompt_strengthen_poll", queued, ...prompts }));
  } catch (err) {
    console.error(JSON.stringify({ event: "prompt_strengthen_poll_failed", error: String(err) }));
  }
  try {
    const bios = await fillMissingXBios();
    console.log(JSON.stringify({ event: "x_bio_fill", ...bios }));
  } catch (err) {
    console.error(JSON.stringify({ event: "x_bio_fill_failed", error: String(err) }));
  }
}

export default {
  fetch: handle,
  async scheduled(controller, env) {
    setEnv(env);
    switch (controller.cron) {
      case DAILY_PROMPT_CRON: {
        const prompts = await runDailyPromptStrengthens();
        console.log(JSON.stringify({ event: "prompt_strengthen_daily", ...prompts }));
        break;
      }
      case MINUTE_CRON:
        await runMinuteJobs();
        break;
      default:
        await runMinuteJobs();
        break;
    }
  },
} satisfies ExportedHandler<Env>;
