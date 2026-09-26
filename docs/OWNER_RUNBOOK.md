# Owner Runbook

One-time setup the project owner does by hand. Agents: you don't need this file unless asked to help with setup.

## GitHub repository settings

1. **Protect `main`** with a ruleset (*Settings → Rules → Rulesets*) on the default branch:
   - require a pull request, with **0** required approvals (agents merge their own PRs; see [AI_ROLES.md](AI_ROLES.md#merging))
   - require the `verify` status check to pass, and branches to be up to date before merging (so id collisions between PRs are caught)
   - block force pushes and deletion
   - add no bypass actors: agents use your account, so a bypass for you is a bypass for them
2. **Pull request settings** (*Settings → General*): allow squash merging and auto-merge, and delete head branches automatically.
3. **Turn on security features** (*Settings → Code security*): private vulnerability reporting, Dependabot alerts, and Dependabot security updates.
4. **Create the labels:** `approval-request`, `launch`, `archive`, `disagreement`, `stuck`, and `owner-approved`. Only you apply `owner-approved`; it lets an owner-gated PR pass CI ([AI_ROLES.md](AI_ROLES.md#merging)).

## Cloudflare domain and deploy

`ajustinjames.com` is already a Cloudflare zone, so the subdomain needs no DNS work outside Cloudflare. Do this when the first app is ready to deploy, not before. It is the same dashboard Git integration as `ajustinjames-v2`.

1. **Connect the repository.** Under *Workers & Pages → Create → Import a repository*, choose `ajustinjames/project-100`. Use the same Cloudflare account as the `ajustinjames.com` zone.
2. **Set the build.**
   - Production branch: `main`
   - Build command: `pnpm build:site`
   - Output directory: the folder `build:site` writes (recorded in [CLOUDFLARE.md](CLOUDFLARE.md#deploys-cloudflare-git-integration) when the script is written)
   - Enable preview deployments for non-production branches.
3. **Attach the domain.** In the project, open the custom domains settings and add `hundred.ajustinjames.com`. Cloudflare creates the DNS record and certificate automatically. Don't create a `hundred` DNS record by hand first; it will conflict.
4. **Set up Web Analytics.** Under *Web Analytics → Add a site*, enter `hundred.ajustinjames.com` and choose the JS snippet (not automatic injection). Add its token as the build variable `P100_CF_ANALYTICS_TOKEN` for **production only**, so previews get no beacon.
5. **Check previews aren't indexed:** open a preview URL and look for `X-Robots-Tag: noindex` in the response headers. See [CLOUDFLARE.md](CLOUDFLARE.md#deploys-cloudflare-git-integration) for what to do if it's missing.

No API tokens are created, and nothing is stored in GitHub.

The first deploy also needs a minimal home page at `/`, because every app footer links there.
