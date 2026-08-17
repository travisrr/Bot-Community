import { handle } from "@astrojs/cloudflare/handler";
import { pollXMentions } from "./lib/x-import";
import { setEnv } from "./lib/env";

export default {
  fetch: handle,
  async scheduled(_controller, env) {
    setEnv(env);
    const result = await pollXMentions();
    console.log(JSON.stringify({ event: "x_mentions_poll", ...result }));
  },
} satisfies ExportedHandler<Env>;
