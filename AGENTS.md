# AGENTS.md

## Production shipping

After **any** code edit in this repo:

1. Commit on the production branch.
2. Push to production (not a feature branch, unless Travis explicitly asks).
3. Verify the live deployment.
4. Reply with the commit **short hash** and a short summary of the edits.

Do this even when the edit looks small (copy, CSS, `AGENTS.md`).

### Production branch

Production is whichever of `main` or `master` this repo actually uses. **Check every time** — do not assume.

```bash
git symbolic-ref refs/remotes/origin/HEAD
git branch -a
git rev-parse --abbrev-ref HEAD
```

This repo currently tracks `origin/main`. If HEAD is not production, check out production (or fast-forward it) before committing. Never open a PR branch for routine work unless asked.

### Safety before push

Other agents may be committing at the same time. Before every push:

1. `git fetch origin`
2. Confirm `HEAD` is production and matches what you edited (`git status`, `git diff origin/<prod>...HEAD`)
3. If `origin/<prod>` moved, integrate those commits first (`git pull --ff-only` or a non-interactive rebase). Do not overwrite someone else's work.
4. Abort the push if the working tree has files you did not change, if a rebase/merge would drop concurrent commits, or if the commit contains secrets (`.env`, credentials, tokens).
5. Never `--force` push to production. Never skip hooks.

### Deploy check

This site is an Astro app on **Cloudflare Workers** (`wrangler.jsonc` name: `botruns`, canonical `really.bot`). There is no Vercel project and no GitHub Actions workflow in-repo.

After pushing:

1. Deploy with `npm run deploy` (`astro build && wrangler deploy`) if git-push does not already trigger a Worker deploy.
2. Confirm the new Worker deployment exists and is successful (Wrangler output and/or Cloudflare).
3. If this repo is later on Vercel or another host, check **that** host instead — always identify the actual platform first.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
