Deployment checklist for Cloudflare Pages / Workers (production-ready static site)

1) Production config (required)
- Open js/config.js and set production values:
  - BACKEND_URL: only if you use a server backend. If not using backend, leave as empty string or a placeholder.
  - BLOCK_EXPLORER: production block explorer (e.g., https://bscscan.com)
  - CONTRACT_ADDRESS, USDT_ADDRESS: ensure production addresses are correct.
- Commit config changes to a protected branch or set them via environment replacement in build pipeline.

2) Prepare build output (dist/)
- Run scripts\prepare-dist.ps1 (Windows PowerShell) or run equivalent shell script to copy files into dist/.
- Recommended: have Node installed and run `npx esbuild` via the prepare script for JS minification.
- Verify dist/ contains: index.html, css/, js/, img/.

3) Security headers and CSP
- Add a strict Content Security Policy. Minimal suggestion for this static app:
  Content-Security-Policy: default-src 'none'; script-src 'self' https://cdnjs.cloudflare.com https://esm.sh; connect-src 'self' https://*; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
- Add X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer-when-downgrade, Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Cloudflare Pages allows you to set headers via _headers file or via Pages configuration; for Workers you can set headers in the response. Add these headers to your deployment.

4) Subresource Integrity (optional but recommended)
- When loading third-party scripts (CDNs), compute SRI hashes and add integrity= and crossorigin attributes. For dynamic ESM imports from esm.sh this is tricky; prefer pinned versions and host critical libs locally or via your own asset host.

5) Performance
- Minify JS and CSS (esbuild/terser/clean-css). The prepare script tries esbuild via npx if available.
- Enable Brotli compression on the CDN or Workers routes (Cloudflare does this automatically).
- Add caching headers for static assets (immutable) and short cache for HTML (or use Pages immutable deploys).

6) Accessibility & UX smoke tests
- Run a11y checks (axe, Pa11y) against a deployed preview.
- Keyboard-only navigation test: Tab through the page, open the wallet modal, ensure modals trap focus and return focus on close.

7) Testing flows
- Demo mode: append ?demo=1 to shorten lock periods and test investment/withdraw flows.
- Connect wallet via AppKit, invest, ensure the history record appears in the panel for that wallet only.
- Disconnect wallet and verify panel hides private info.

8) Monitoring & logs
- If using backend, enable request tracing and basic logging. For static-only setup, track client-side errors with Sentry or a lightweight logging endpoint.

9) Rollout & backups
- Use a staging Pages site first. Smoke-test on mobile and desktop.
- Keep a backup of the previous deployed commit to revert quickly.

10) Post-deploy checklist
- Verify SSL/CORS and CSP in production.
- Run performance audit (Lighthouse) and accessibility audit.

Notes
- For Cloudflare Workers + Pages, you can add a small Worker to inject security headers at edge time and to add SRI/nonce or dynamic replacements if needed.
- If you prefer, I can add an _headers file or a small Worker script that injects the headers automatically during deployment.