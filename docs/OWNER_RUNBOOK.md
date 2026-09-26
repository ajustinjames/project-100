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

`ajustinjames.com` is already a Cloudflare zone, so the subdomain needs no DNS work outside Cloudflare. Do this when the first app is ready to deploy, not before:

1. **Confirm the account.** The Worker must live in the same Cloudflare account as the `ajustinjames.com` zone.
2. **Create the Worker on first deploy** (`wrangler deploy` from the deploy workflow, or once by hand).
3. **Attach the domain.** In the Worker, open *Settings → Domains & Routes → Add → Custom Domain* and enter `hundred.ajustinjames.com`. Cloudflare creates the DNS record and certificate automatically. Don't create a `hundred` DNS record by hand first; it will conflict.
4. **Create a deploy API token scoped to the `project-100` Worker only** (a per-Worker [Workers permission](https://developers.cloudflare.com/workers/authorization/workers/), not account-wide *Workers Scripts: Edit*). An account-wide Workers token could modify any other Worker in the account, including one serving a personal site. Because the domain is attached in the dashboard, the token needs no zone permissions. On the first deploy, check that `wrangler deploy` leaves the custom domain in place.
5. **Store the credentials** as GitHub Actions secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
6. **Set up Web Analytics.** Under *Web Analytics → Add a site*, enter `hundred.ajustinjames.com`, choose the JS snippet (not automatic injection), and store its token as `P100_CF_ANALYTICS_TOKEN`.

The first deploy also needs a minimal home page at `/`, because every app footer links there.
