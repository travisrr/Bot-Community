import { handle } from "@astrojs/cloudflare/handler";
import { pollXMentions } from "./lib/x-import";
import { processQueuedQaRevisits } from "./lib/qa";
import {
  maybeQueueDailyPromptStrengthens,
  processQueuedPromptStrengthens,
  queueDailyPromptStrengthens,
} from "./lib/prompt-strengthen";
import { DAILY_PROMPT_CRON, MINUTE_CRON } from "./lib/cron";
import { setEnv } from "./lib/env";

async function runMinuteJobs() {
  const mentions = await pollXMentions();
  console.log(JSON.stringify({ event: "x_mentions_poll", ...mentions }));
  const qa = await processQueuedQaRevisits();
  console.log(JSON.stringify({ event: "qa_revisit_poll", ...qa }));
  const queued = await maybeQueueDailyPromptStrengthens();
  const prompts = await processQueuedPromptStrengthens();
  console.log(JSON.stringify({ event: "prompt_strengthen_poll", queued, ...prompts }));
}

async function runDailyPromptJobs() {
  const queued = await queueDailyPromptStrengthens();
  const prompts = await processQueuedPromptStrengthens();
  console.log(JSON.stringify({ event: "prompt_strengthen_daily", queued, ...prompts }));
}

export default {
  fetch: handle,
  async scheduled(controller, env) {
    setEnv(env);
    switch (controller.cron) {
      case DAILY_PROMPT_CRON:
        await runDailyPromptJobs();
        break;
      case MINUTE_CRON:
        await runMinuteJobs();
        break;
      default:
        await runMinuteJobs();
        break;
    }
  },
} satisfies ExportedHandler<Env>;
