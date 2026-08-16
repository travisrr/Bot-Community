import type { APIRoute } from "astro";
import { json } from "../../../lib/http";
import { getRepoStars } from "../../../lib/github";
import { GITHUB_REPO, GITHUB_URL } from "../../../lib/site";

export const GET: APIRoute = async () => {
  const stars = await getRepoStars();
  return json(
    { stars, repo: GITHUB_REPO, url: GITHUB_URL },
    200,
    { "Cache-Control": "public, max-age=15, stale-while-revalidate=45" },
  );
};
