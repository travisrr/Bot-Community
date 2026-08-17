import { handle } from "@astrojs/cloudflare/handler";
import { pollXMentions } from "./lib/x-import";

export default {
  fetch: handle,
  async scheduled() {
    const result = await pollXMentions();
    console.log(JSON.stringify({ event: "x_mentions_poll", ...result }));
  },
} satisfies ExportedHandler<Env>;
