# Owner Runbook

One-time setup the project owner does by hand. Agents: you don't need this file unless asked to help with setup.

## GitHub repository settings

1. **Protect `main`** with a ruleset (*Settings → Rules → Rulesets*) on the default branch:
   - require a pull request, with **0** required approvals (agents merge their own PRs; see [AI_ROLES.md](AI_ROLES.md#merging))
   - require the `verify` status check to pass
   - block force pushes and deletion
   - add no bypass actors: agents use your account, so a bypass for you is a bypass for them
2. **Pull request settings** (*Settings → General*): allow squash merging and auto-merge, and delete head branches automatically.
3. **Turn on security features** (*Settings → Code security*): private vulnerability reporting, Dependabot alerts, and Dependabot security updates.
4. **Create the issue labels:** `approval-request`, `launch`, `archive`, `disagreement`, and `stuck`.

## Cloudflare domain and deploy

`ajustinjames.com` is already a Cloudflare zone, so the subdomain needs no DNS work outside Cloudflare. Do this when the first app is ready to deploy, not before:

1. **Confirm the account.** The Worker must live in the same Cloudflare account as the `ajustinjames.com` zone.
2. **Create the Worker on first deploy** (`wrangler deploy` from the deploy workflow, or once by hand).
3. **Attach the domain.** In the Worker, open *Settings → Domains & Routes → Add → Custom Domain* and enter `hundred.ajustinjames.com`. Cloudflare creates the DNS record and certificate automatically. Don't create a `hundred` DNS record by hand first; it will conflict.
4. **Create a deploy API token** scoped to this account with only *Workers Scripts: Edit*. Because the domain is attached once in the dashboard, the token needs no permissions on the `ajustinjames.com` zone, and so can't touch the personal site. Verify on the first deploy that `wrangler deploy` leaves the custom domain in place. If it needs zone permissions, scope them to that zone and Workers routes only.
5. **Store the credentials** as GitHub Actions secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
6. **Set up Web Analytics.** Under *Web Analytics → Add a site*, enter `hundred.ajustinjames.com`, choose the JS snippet (not automatic injection), and store its token as `P100_CF_ANALYTICS_TOKEN`.

The first deploy also needs a minimal home page at `/`, because every app footer links there.
