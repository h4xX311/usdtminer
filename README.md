# USDT Miner Protocol

This repository contains the frontend for the USDT Miner Protocol DApp.

Quick start

1. Install dependencies

   npm ci

2. Lint

   npm run lint

3. Run tests

   npm test

4. Serve locally

   python3 -m http.server 8080
   # open http://localhost:8080

Security & deployment checklist

- SRI (Subresource Integrity): calculate sha384 hashes for external CDNs (e.g. ethers) and replace the TODO placeholders in `index.html`.
  Example:

  curl -sS -o ethers.umd.min.js https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js
  SRI=$(openssl dgst -sha384 -binary ethers.umd.min.js | openssl base64 -A)
  echo "sha384-$SRI"

  Then replace the placeholder in `index.html` with the resulting `sha384-...` string.

- Content-Security-Policy: after inserting SRI, tighten the CSP (remove 'unsafe-inline' where possible).

- Secrets/config: do NOT commit secrets. Move PROJECT_ID, BACKEND_URL and other secrets to environment variables or use your CI/CD secret manager.

- Test in staging (HTTPS) before using mainnet. Use ngrok or deploy to Vercel/Netlify for a staging URL.

CI

A GitHub Actions workflow was added to run lint and tests on push/PR to `main`.

If you want me to calculate and insert SRI automatically, confirm and I will download the CDN assets and update `index.html`.
