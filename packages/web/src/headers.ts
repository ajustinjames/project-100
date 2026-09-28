// The Cloudflare `_headers` file for the assembled site: security headers for every response,
// and noindex for Labs and for every Cloudflare-hosted URL other than the custom domain.
// Format: https://developers.cloudflare.com/workers/static-assets/headers/

/**
 * Strict baseline: only our own files, plus Cloudflare Web Analytics (the beacon script and its
 * reporting endpoint). Two documented exceptions (docs/CLOUDFLARE.md#security-headers):
 * - `data:` images, for the empty favicon every app uses
 * - inline style *attributes* (not <style> elements), because ajj-design components render
 *   `style="..."` in their templates
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://static.cloudflareinsights.com",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "connect-src 'self' https://cloudflareinsights.com",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Powerful features no app uses yet. An app that needs one removes it here, with a reason. */
export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

/**
 * Hostnames that are not the production domain: branch previews on the preview domain set in the
 * Cloudflare dashboard (<branch>.hundred.dev.ajustinjames.com), and pages.dev and workers.dev
 * aliases. They must never be indexed. The production domain never matches these.
 */
export const PREVIEW_URL_PATTERNS = [
  "https://:preview.hundred.dev.ajustinjames.com/*",
  "https://:project.pages.dev/*",
  "https://:version.:project.pages.dev/*",
  "https://:worker.:subdomain.workers.dev/*",
];

export function renderHeaders(): string {
  const rules: [string, string[]][] = [
    [
      "/*",
      [
        `Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`,
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        `Permissions-Policy: ${PERMISSIONS_POLICY}`,
      ],
    ],
    ["/labs/*", ["X-Robots-Tag: noindex"]],
    ...PREVIEW_URL_PATTERNS.map((pattern): [string, string[]] => [
      pattern,
      ["X-Robots-Tag: noindex"],
    ]),
  ];
  return `${rules.map(([pattern, headers]) => [pattern, ...headers.map((h) => `  ${h}`)].join("\n")).join("\n\n")}\n`;
}
