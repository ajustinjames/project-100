// Checks a built HTML page for the project web standards. This checks the output, not the build
// tool, so it holds no matter how the page was built. Run by `pnpm p100 check-builds` in CI.

import type { AppMeta } from "@project-100/registry";

export function checkBuiltPage(meta: Pick<AppMeta, "status">, html: string): string[] {
  const problems: string[] = [];
  const isLive = meta.status === "live";
  if (!/<title>[^<]+<\/title>/i.test(html)) problems.push("missing <title>");
  if (!html.includes("data-p100-footer")) problems.push("missing the Project 100 footer");
  if (!isLive && !/<meta name="robots" content="noindex, nofollow">/i.test(html))
    problems.push("non-live page is missing noindex, nofollow");
  if (!isLive && html.includes("cloudflareinsights")) problems.push("non-live page has analytics");
  return problems;
}
