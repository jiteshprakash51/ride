# ride direct

An open-source, static-hosted peer-to-peer ride connectivity experiment for Nepal. MIT licensed. Original information website: https://ride.jiteshprakash.com.np/ . Paired test app: `/app/`.

**This is not a public ride marketplace or an operating transport service.** You must already be able to contact your test partner. Use fictional data, not real passenger journeys. No drivers, vehicles, insurance or legal eligibility are verified. No emergency monitoring, payments, commission collection, background dispatch or citywide discovery is provided.

## What actually works

Two separate browsers exchange manual WebRTC connection codes, compare the connection fingerprint over a trusted channel, then use an encrypted data channel for a fictional journey: rider request with proposed NPR fare, driver acceptance of that fare, driver arrival, rider start confirmation, driver completion or pre-start cancellation. Each state update is acknowledged by the peer. Simple text messages travel on the same channel. Each tab holds its own copy in memory; there is no browser-only mock driver and no shared database.

No blockchain, Cloudflare Functions, Workers, D1, account signup, wallet, payment API, public signaling service or TURN relay is used. Optional Cloudflare public STUN only helps discover a direct network route. It does not carry journey messages and does not guarantee connection through every NAT or mobile network.

## Try with a known test partner

1. Open `/app/` in two current browsers. Keep both tabs in the foreground.
2. Choose opposite rider/driver roles. Read and accept the test notice.
3. For different networks, both may opt into Cloudflare STUN. Without it, expect local-network connectivity only.
4. One tester chooses **Create a pairing code** and shares that code privately. Codes contain network metadata and expire after ten minutes.
5. The other chooses **Respond to a code**, pastes the code and sends the generated response back.
6. The initiator pastes the response. Compare the full connection fingerprint through a trusted voice or in-person channel, then both confirm.
7. The rider sends fictional pickup/destination details and a proposed fare. Follow the buttons on both screens.
8. Disconnect to clear this session. Reloading also loses the session. There is no recovery or offline action queue.

Manual pairing is intentionally explicit. Do not post connection codes in public chats. Fingerprints verify the chosen connection, not the peer's identity, license, vehicle or safety. Your peer can save anything received. Direct peers can learn network addresses. A malicious peer can modify their own client; this is not fraud-resistant dispatch or enforceable payment settlement.

## Run and test

Runtime is plain HTML, CSS and browser JavaScript, with no runtime dependencies.

```sh
npm ci
npm run check
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Visit `http://localhost:8080/app/`. For phones use an HTTPS deployment; localhost exceptions do not cover a remote phone opening a plain HTTP LAN address.

Browser integration tests:

```sh
npx playwright install chromium
node tests/browser.mjs
```

The automated integration test uses two isolated Chromium contexts on one host. It proves actual data-channel communication and application state exchange, not independent-phone/mobile-network reliability. See `docs/TESTING.md` for scope and remaining checks.

## Deploy static files only

`npm run build` produces `dist/`. Cloudflare Pages settings: build command `npm run build`, output directory `dist`. No Functions directory or server resources are required. Preserve the existing project/domain and do not alter unrelated DNS. Only this build output should be served, not source tests or config. `_headers` supplies the production CSP. Root information pages remain unchanged apart from adding a test-app link.

The PWA manifest supports installation where the browser permits it. The service worker caches the app shell using network-first fetching. Offline does not create a public network, discover drivers or guarantee delivery. New versions wait for normal service-worker lifecycle activation; close all app tabs and reopen to ensure an update.

## Open work

- Independent physical Android/iOS and separate cellular-network tests.
- A user-approved discovery design for finding unknown nearby drivers.
- Network paths needing a relay cannot be solved by STUN alone.
- Reconnection, durable receipts, abuse controls, accessibility and security review.
- Driver verification, transport/legal/insurance review and operational safety before any real passenger launch.

A public discovery relay is not silently bundled. It would need provider/operator approval, privacy and abuse design, and a realistic funding/availability plan. See `docs/ARCHITECTURE.md`.

## License and credits

Original project code and artwork: MIT, copyright Jitesh Prakash Chaudhary. Fonts are system fonts. No external image, map tiles or runtime library is loaded. Development tooling licenses remain those in their own packages; the package lock records versions. Official references are linked in the information site's Sources page and architecture notes. Referenced articles and provider documentation are not relicensed by this repository.
