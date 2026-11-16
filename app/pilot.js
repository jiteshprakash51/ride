import {
  cleanText,
  requestRide,
  transition,
  validateRide,
  encodeSignal,
  decodeSignal,
} from "./protocol.js";
const $ = (id) => document.getElementById(id);
let pc,
  dc,
  role,
  peerRole,
  ride,
  verified = false,
  localVerified = false,
  peerVerified = false,
  mode = "",
  timer,
  poll,
  handshake = [],
  seen = new Set(),
  pending = false;
const message = (s) => {
  $("message").textContent = s;
};
const roleNow = () => document.querySelector("[name=role]:checked").value;
function send(data) {
  if (!dc || dc.readyState !== "open")
    throw Error("The direct connection is not open. Nothing was sent.");
  dc.send(JSON.stringify({ v: 1, ...data }));
}
function status(s) {
  $("connection-state").textContent = s;
}
function close(clear = true) {
  clearTimeout(timer);
  clearInterval(poll);
  if (dc) {
    dc.onclose = null;
    dc.close();
  }
  if (pc) {
    pc.onconnectionstatechange = null;
    pc.close();
  }
  pc = dc = null;
  role = peerRole = null;
  verified = false;
  localVerified = false;
  peerVerified = false;
  pending = false;
  ride = null;
  seen.clear();
  handshake = [];
  $("messages").replaceChildren();
  $("settings").disabled = false;
  $("create").disabled = $("join").disabled = false;
  for (const id of [
    "incoming-box",
    "outgoing-box",
    "verify-box",
    "disconnect",
    "trip-app",
  ])
    $(id).hidden = true;
  $("waiting").hidden = false;
  $("incoming").value = $("outgoing").value = "";
  $("pickup").value = $("destination").value = $("fare").value = "";
  status("Not paired");
  if (clear)
    message(
      "Disconnected. This tab’s journey and messages have been cleared. Your peer may have kept a copy.",
    );
}
function bindChannel(channel) {
  dc = channel;
  dc.onopen = () => {
    clearTimeout(timer);
    status("Connected · compare code");
    send({ type: "hello", role });
    fingerprint().catch(() =>
      message("Could not verify this connection. Disconnect and retry."),
    );
    poll = setInterval(async () => {
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let relay = false;
        stats.forEach((s) => {
          if (s.type === "local-candidate" && s.candidateType === "relay")
            relay = true;
        });
        if (relay)
          message("Unexpected relay candidate detected. Disconnecting.");
        if (relay) close(false);
      } catch {}
    }, 15000);
  };
  dc.onmessage = (event) => {
    try {
      receive(event.data);
    } catch (e) {
      message(e.message);
    }
  };
  dc.onclose = () => {
    close(false);
    message(
      "Peer disconnected. Session data cleared. No active journey is confirmed. Pair again to continue testing.",
    );
  };
  dc.onerror = () =>
    message(
      "The direct channel had an error. No new journey action is confirmed.",
    );
}
async function fingerprint() {
  const joined = handshake.map((d) => d.type + "\n" + d.sdp).join("\n");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(joined),
  );
  const hex = Array.from(new Uint8Array(hash).slice(0, 12), (b) =>
    b.toString(16).padStart(2, "0"),
  )
    .join("")
    .match(/.{1,4}/g)
    .join(" ");
  $("fingerprint").textContent = hex;
  $("verify-box").hidden = false;
}
function begin() {
  if (!window.RTCPeerConnection)
    throw Error("This browser does not support WebRTC. Try a current browser.");
  if (!$("consent").checked)
    throw Error("Read and check the test-connection notice first.");
  role = roleNow();
  pc = new RTCPeerConnection({
    iceServers: $("stun").checked
      ? [{ urls: "stun:stun.cloudflare.com:3478" }]
      : [],
  });
  $("settings").disabled = true;
  $("create").disabled = $("join").disabled = true;
  $("disconnect").hidden = false;
  pc.ondatachannel = (e) => bindChannel(e.channel);
  pc.onconnectionstatechange = () => {
    if (!pc) return;
    if (pc.connectionState === "failed") {
      status("Connection failed");
      message(
        "These networks could not connect directly. No relay is enabled. Try the same Wi-Fi or another network, then make fresh pairing codes.",
      );
    }
    if (pc.connectionState === "disconnected") {
      status("Connection interrupted");
      message(
        "Connection interrupted. Keep both tabs open. No new action is confirmed until reconnected.",
      );
    }
    if (pc.connectionState === "connected" && verified)
      status("Direct · verified by you");
  };
  timer = setTimeout(() => {
    if (dc?.readyState !== "open") {
      status("Not connected");
      message(
        "No direct connection yet. Finish exchanging both codes, or disconnect and try another network. STUN cannot connect every mobile network.",
      );
    }
  }, 60000);
}
async function gather() {
  await new Promise((resolve, reject) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const current = pc;
    const timeout = setTimeout(() => {
      current.removeEventListener("icegatheringstatechange", done);
      resolve();
    }, 12000);
    function done() {
      if (current.iceGatheringState === "complete") {
        clearTimeout(timeout);
        current.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    }
    current.addEventListener("icegatheringstatechange", done);
  });
  if (!pc) throw Error("Connection was closed.");
}
function showCode(type) {
  const d = pc.localDescription;
  handshake.push({ type: d.type, sdp: d.sdp });
  $("outgoing").value = encodeSignal(d, role);
  $("outgoing-box").hidden = false;
  $("outgoing-label").textContent =
    type === "offer"
      ? "1. Send this pairing code to your partner"
      : "2. Send this response back to the initiator";
  $("code-help").textContent =
    type === "offer"
      ? "Expires in 10 minutes. Your partner chooses the other role, clicks Respond to a code, pastes this and sends their response back. Keep this tab open."
      : "Keep this tab open. The initiator must paste your response into their screen. Connection codes contain network metadata. Share privately.";
  if (type === "offer") {
    $("incoming-box").hidden = false;
    $("incoming").placeholder =
      "When your partner replies, paste their response here";
  }
}
async function makeOffer() {
  begin();
  mode = "offer";
  bindChannel(pc.createDataChannel("ride-direct", { ordered: true }));
  status("Gathering connection code");
  await pc.setLocalDescription(await pc.createOffer());
  await gather();
  showCode("offer");
  status("Waiting for partner");
  message(
    "Send your code privately, then paste your partner’s response below.",
  );
}
async function apply() {
  const d = decodeSignal(
    $("incoming").value,
    mode === "offer" ? "answer" : "offer",
  );
  if (d.role === roleNow())
    throw Error(
      "Your partner selected the same role. Choose opposite rider and driver roles and make fresh codes.",
    );
  if (mode === "offer") {
    if (!pc || pc.signalingState !== "have-local-offer")
      throw Error("Create a fresh pairing code first.");
    await pc.setRemoteDescription({ type: d.type, sdp: d.sdp });
    handshake.push({ type: d.type, sdp: d.sdp });
    $("incoming-box").hidden = true;
    message("Response received. Waiting for the direct channel.");
  } else {
    if (pc) throw Error("Disconnect before responding to another code.");
    begin();
    mode = "answer";
    handshake = [{ type: d.type, sdp: d.sdp }];
    await pc.setRemoteDescription({ type: d.type, sdp: d.sdp });
    await pc.setLocalDescription(await pc.createAnswer());
    await gather();
    showCode("answer");
    $("incoming-box").hidden = true;
    message("Send the response code back to your partner.");
  }
}
function receive(raw) {
  if (typeof raw !== "string" || raw.length > 10000)
    throw Error("Ignored an oversized peer message.");
  let m;
  try {
    m = JSON.parse(raw);
  } catch {
    throw Error("Ignored an invalid peer message.");
  }
  if (!m || m.v !== 1) throw Error("Peer protocol version is not supported.");
  if (m.type === "hello") {
    if (!["rider", "driver"].includes(m.role) || m.role === role)
      throw Error("Peer role mismatch. Disconnect and choose opposite roles.");
    peerRole = m.role;
    return;
  }
  if (m.type === "verified") {
    peerVerified = true;
    finishVerification();
    return;
  }
  if (!verified || !peerRole)
    throw Error("Compare and confirm the connection fingerprint first.");
  if (m.type === "chat") {
    addMessage("Peer", cleanText(m.text, 160));
    return;
  }
  if (m.type === "state") {
    if (role !== "driver" || peerRole !== "rider")
      throw Error("Ignored an unauthorized journey update.");
    const next = validateRide(m.ride);
    if (ride && next.id === ride.id && next.revision < ride.revision) return;
    if (
      ride &&
      next.id === ride.id &&
      (next.pickup !== ride.pickup ||
        next.destination !== ride.destination ||
        next.fare !== ride.fare)
    )
      throw Error("Peer tried to change agreed journey terms. Disconnect.");
    if (
      ride &&
      next.id !== ride.id &&
      !["completed", "cancelled"].includes(ride.status)
    )
      throw Error("Finish the active journey first.");
    ride = next;
    pending = false;
    render();
    send({ type: "ack", id: ride.id, revision: ride.revision });
    $("sync").textContent = "Received from rider. Acknowledgement sent.";
    return;
  }
  if (m.type === "action") {
    if (
      role !== "rider" ||
      peerRole !== "driver" ||
      typeof m.id !== "string" ||
      m.id.length > 80
    )
      throw Error("Invalid action.");
    if (seen.has(m.id)) {
      send({ type: "state", ride });
      return;
    }
    if (!ride || m.rideId !== ride.id) throw Error("Journey does not match.");
    try {
      ride = transition(ride, m.action, "driver", m.revision);
      seen.add(m.id);
      if (seen.size > 100) seen.delete(seen.values().next().value);
      send({ type: "state", ride });
      render();
      $("sync").textContent = "Update sent. Waiting for peer acknowledgement.";
    } catch (e) {
      send({ type: "error", text: e.message });
    }
    return;
  }
  if (
    m.type === "ack" &&
    role === "rider" &&
    ride &&
    m.id === ride.id &&
    m.revision === ride.revision
  ) {
    pending = false;
    $("sync").textContent =
      "Confirmed on your peer’s screen. Both tabs have revision " +
      ride.revision +
      ".";
    renderActions();
    return;
  }
  if (m.type === "error") {
    pending = false;
    renderActions();
    throw Error(cleanText(m.text, 200));
  }
  throw Error("Ignored an unknown peer message.");
}
function publish() {
  pending = true;
  send({ type: "state", ride });
  render();
  $("sync").textContent =
    "Sent. Waiting for your peer to confirm. Do not treat this as agreed yet.";
}
function addMessage(who, text) {
  const li = document.createElement("li");
  li.textContent = who + ": " + text;
  $("messages").append(li);
  while ($("messages").children.length > 20) $("messages").firstChild.remove();
}
function action(name) {
  if (!verified) throw Error("Verify the connection first.");
  if (pending)
    throw Error("Wait for your peer to confirm the previous change.");
  if (role === "rider") {
    ride = transition(ride, name, "rider", ride.revision);
    publish();
  } else {
    send({
      type: "action",
      id: crypto.randomUUID(),
      rideId: ride.id,
      action: name,
      revision: ride.revision,
    });
    pending = true;
    renderActions();
    $("sync").textContent =
      "Action sent. Waiting for the rider’s confirmed state.";
  }
}
function renderActions() {
  const wrap = $("trip-actions");
  wrap.replaceChildren();
  if (!ride) return;
  let options = [];
  if (role === "driver") {
    if (ride.status === "requested")
      options.push(["accept", "Agree fare & accept"]);
    if (ride.status === "accepted")
      options.push(["arrive", "I have arrived (test)"]);
    if (ride.status === "in_progress")
      options.push(["complete", "Complete test journey"]);
  }
  if (role === "rider" && ride.status === "arrived")
    options.push(["start", "Confirm partner & start test"]);
  if (["requested", "accepted", "arrived"].includes(ride.status))
    options.push(["cancel", "Cancel test"]);
  for (const [name, label] of options) {
    const b = document.createElement("button");
    b.textContent = label;
    b.disabled = pending;
    b.className = name === "cancel" ? "secondary" : "";
    b.onclick = () => guard(() => action(name));
    wrap.append(b);
  }
}
function render() {
  $("waiting").hidden = true;
  $("trip-app").hidden = false;
  $("role-note").textContent =
    "You are the " +
    role +
    ". Your peer’s identity and vehicle are not verified.";
  $("request-form").hidden =
    role !== "rider" ||
    (ride && !["completed", "cancelled"].includes(ride.status));
  $("trip-view").hidden = !ride;
  if (!ride) return;
  $("trip-status").textContent = ride.status.replaceAll("_", " ");
  $("revision").textContent = "Revision " + ride.revision;
  $("show-pickup").textContent = ride.pickup;
  $("show-destination").textContent = ride.destination;
  $("show-fare").textContent = "NPR " + ride.fare.toLocaleString("en-US");
  const help = {
    requested: "The driver must agree this exact fare and accept.",
    accepted:
      "Test accepted. Keep both tabs open; no background dispatch is running.",
    arrived: "The rider must check their test partner, then confirm the start.",
    in_progress:
      "Test journey in progress. No GPS tracking or emergency response is provided.",
    completed:
      "Test complete. No payment was taken. You can send another fictional request.",
    cancelled: "Test cancelled. No fee or payment was taken.",
  };
  $("trip-help").textContent = help[ride.status];
  renderActions();
}
function finishVerification() {
  if (!localVerified || !peerVerified) {
    message("Waiting for both testers to confirm the fingerprint.");
    return;
  }
  verified = true;
  $("incoming").value = $("outgoing").value = "";
  $("outgoing-box").hidden = true;
  status("Direct · verified by both");
  render();
  message("Both testers confirmed this pairing. Use fictional details only.");
}
async function guard(fn) {
  try {
    await fn();
  } catch (e) {
    message(e.message || "Something went wrong. Disconnect and try again.");
    if (!pc) {
      $("create").disabled = $("join").disabled = false;
    }
  }
}
$("create").onclick = () => guard(makeOffer);
$("join").onclick = () => {
  mode = "answer";
  $("incoming-box").hidden = false;
  $("incoming").placeholder = "Paste the initiator’s code";
  message(
    "Select the opposite role to your partner, read the notice, then paste their pairing code.",
  );
};
$("apply").onclick = () => guard(apply);
$("copy").onclick = () =>
  guard(async () => {
    await navigator.clipboard.writeText($("outgoing").value);
    message("Copied. Share privately with only your test partner.");
  });
$("disconnect").onclick = () => close();
$("verify").onclick = () =>
  guard(() => {
    if (!peerRole || dc?.readyState !== "open")
      throw Error("Wait for the peer to connect first.");
    localVerified = true;
    $("verify-box").hidden = true;
    send({ type: "verified" });
    finishVerification();
  });
$("request-form").onsubmit = (e) => {
  e.preventDefault();
  guard(() => {
    if (role !== "rider" || !verified)
      throw Error("Only the paired rider can send a request.");
    if (ride && !["completed", "cancelled"].includes(ride.status))
      throw Error("Finish or cancel the active test first.");
    if (pending)
      throw Error("Wait for peer confirmation before sending another request.");
    ride = requestRide({
      pickup: $("pickup").value,
      destination: $("destination").value,
      fare: $("fare").value,
    });
    publish();
  });
};
$("chat-form").onsubmit = (e) => {
  e.preventDefault();
  guard(() => {
    const text = cleanText($("chat").value, 160);
    send({ type: "chat", text });
    addMessage("You", text);
    $("chat").value = "";
  });
};
window.addEventListener("offline", () =>
  message(
    "Internet is offline. A local connection may survive, but no reconnection or action delivery is guaranteed.",
  ),
);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
