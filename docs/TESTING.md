# Test record

16 November 2026. These are development tests, not a safety certification.

## Passed locally

- Five Node test groups: authorized role transitions, exact revisions, cancellation boundaries, fare and field validation, pairing-code type/expiry/size validation, unique request IDs and immutable terms across transitions.
- Actual WebRTC ordered data channel between two isolated Chromium contexts on one Linux host, served by one loopback static HTTP origin, no STUN/TURN. Manual offer and answer pasted between screens.
- Matching fingerprints, both-side verification, request delivered to driver context, acceptance, arrival, rider start, completion and peer acknowledgements.
- A message containing HTML-like attack text rendered as literal text, not markup.
- Disconnect propagated and cleared session chat/state.
- Extended regression passed against deployed `https://ride-abo.pages.dev/app/` in two isolated contexts on one host, including driver cancellation and empty local/session storage. This is still same-host testing, not an independent-network pass.
- The custom-domain app rendered in the separate remote browser and was visually inspected live. One later automation-runner lookup of the custom domain failed with `ERR_NAME_NOT_RESOLVED`; that run did not establish an app failure or a functional pass.
- No browser page errors; no horizontal overflow at 320, 390, 768 or 1440 CSS pixels.
- Full-page desktop/mobile screenshots inspected for layout and readable structure.

## Failed separate-host test

A second test used an application-test Chromium host and a separate remote browser host, both loading the deployed HTTPS app. Cloudflare STUN was enabled on both. Manual offer/answer exchange succeeded. Both descriptions contained host and server-reflexive ICE candidates, but the direct connection failed before a data channel or fingerprint was established. The app reported a connection failure and did not confirm a journey.

This is a recorded failure, not proof of physical-phone reliability. It shows that collecting public-facing candidates with STUN alone was insufficient for this tested network pair. No TURN or other relay was enabled, and no journey data was transferred in this failed test.

## Not yet established

- Physical phones, Android vs iOS, Safari, independent cellular networks, carrier-grade NAT, restricted corporate Wi-Fi or STUN reachability.
- Long background suspension, battery interruption, accessibility assistive technology or external security review.
- Reliable citywide discovery, dispatch, fraud prevention, legal compliance, insurance or driver screening. These are not implemented.

## Manual release test

Open on two physical phones using separate networks. Use fictional details. Enable optional STUN on both. Record browser/OS/network types, whether pairing succeeds, elapsed connection time, completed state revisions, interruption behavior and whether a direct selected candidate pair exists. Do not record IP addresses, SDP or real journey details in public issues. If direct pairing fails, record it as a failure; do not claim a relay fallback exists.
