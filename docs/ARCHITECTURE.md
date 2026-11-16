# Architecture and honest limits

Status: paired connectivity milestone, not a public ride service. Reviewed 16 November 2026.

## Data path

Static Pages origin -> HTML/CSS/JS. Manual private connection-code exchange -> WebRTC offer/answer and ICE candidates. Optional free public Cloudflare STUN -> discover public-facing network candidates. Direct DTLS/SCTP WebRTC data channel -> fictional journey state and text messages. No audio/video permissions requested.

The rider tab coordinates this one paired journey and sends versioned state; driver actions propose transitions against a revision. Both testers confirm the same fingerprint before app messages are enabled. Actions are not regarded as acknowledged until a peer response arrives. Channel close clears current app state. No keys, identities, journey details or chat are written to browser storage or service-worker caches. The service worker caches app assets only, not signaling or journey messages.

There is no consensus network and no guarantee against a malicious modified client. Browser-to-browser encryption protects transport, not a compromised endpoint, peer screenshots, identity impersonation, abusive pairing partners or device access. No private identity directory or public ledger exists.

## Discovery options investigated

| Approach | Benefit | Constraint |
|---|---|---|
| Manual trusted pairing, implemented | No hosted signaling dependency; works with static hosting | Already-known partners only; cumbersome for public transport |
| Community rendezvous/signaling relay | Unknown peers can advertise approximate zones and exchange signaling | Someone must operate it, moderate abuse, fund uptime and process metadata; not authorized or configured |
| Public third-party decentralized relay networks | Potentially shared discovery infrastructure | External operators/terms, spam, tracking, retention and reliability dependencies; not chosen or contacted by the app |
| Native local radio mesh | Nearby discovery without an Internet backend may be possible | Native platform APIs, range, background limits, density and device-specific testing; not equivalent to a mobile-browser citywide network |
| Blockchain | Durable public coordination | Rejected by project intent; fees, public history and wallet/legal concerns; not used |

A fully static web app cannot promise automatic citywide discovery, persistence and mobile-network reachability with no rendezvous/relay infrastructure. A peer network still requires reachable peers, a bootstrapping path and operating nodes. Do not describe manual pairing as completing that problem.

## Provider scope

Optional `stun:stun.cloudflare.com:3478` is documented by Cloudflare as free and unlimited. It processes connection metadata, not application messages. No TURN key, account upgrade or metered relay is enabled. Cloudflare Pages serves normal request metadata under its service terms. The app loads no remote analytics, ads, fonts, scripts, maps or AI services.

## Sources

- https://webrtc.org/getting-started/peer-connections - signaling, ICE, STUN/TURN.
- https://webrtc.org/getting-started/turn-server - direct connections can fail behind NAT/firewalls; TURN relays.
- https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection - without ICE servers connectivity is limited to local peers.
- https://developers.cloudflare.com/realtime/turn/faq/index.md - free/unlimited Cloudflare STUN; TURN is distinct and metered.
- https://developers.cloudflare.com/realtime/turn/ - STUN endpoint and port.
- https://developers.cloudflare.com/realtime/turn/generate-credentials/ - TURN requires protected credential generation; not enabled here.
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable - manifest and HTTPS installation requirements.
