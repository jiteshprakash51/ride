# ride

Seven-page static information website for a zero-commission ride concept in Nepal. It is not an operating transport service or a booking app.

## Pages

- Overview: concept, principles and page directory.
- Technology: phones-only vs shared-service trade-offs and a local architecture switch.
- Playground: clearly labeled fictional ride request/acceptance/reset simulation.
- Budget: dated estimates, exclusions and a local pilot-cost calculator.
- Roadmap: future stages, privacy, checks, safety and legal questions.
- FAQ: local search and expand/collapse controls.
- Sources: official references and verified Cloudflare Pages free-plan limits.

## Run and deploy

No dependencies or build needed. Open index.html, or run `python3 -m http.server 8080` here. Optional JavaScript runs only in the browser, with no network calls, tracking, cookies or storage. Demo inputs do not leave the tab. Hosting providers may process normal request metadata.

Cloudflare Pages Git integration: framework none, build command `exit 0`, output directory `.`. Plain static assets only. No Functions, Workers, paid APIs, database, authentication, real map or payment service. The `_headers` file is applied by Pages, not the local Python server.

Cloudflare's documentation checked 16 November 2026 says static-asset requests are free and unlimited when no Functions are invoked. Other limits still apply, including 500 builds/month, 20,000 files/site and 25 MiB/asset on the Free plan. See https://developers.cloudflare.com/pages/functions/pricing/ and https://developers.cloudflare.com/pages/platform/limits/ . This is not a guarantee that all hosting capabilities or future terms are unlimited/free.

Use new dedicated resources only. Do not change existing sites or DNS. Source-code licensing has not been selected.

## Content and safety

Budget snapshot: 16 November 2026, using dated NRB rate NPR 151.09/USD. Not a quote or capacity guarantee. Pilot figures exclude taxes, FX fees, SMS, labor and public-operation costs. No funding, partners, coverage, legal compliance, insurance or safety guarantees are claimed. Mock-driver acceptance is only single-tab state, not tested distributed concurrency. The app is future work.
