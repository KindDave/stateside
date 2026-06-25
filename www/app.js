/* ============================================================
   STATESIDE — app logic
   ============================================================ */
"use strict";

/* ---------- persisted settings ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("ss_" + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem("ss_" + k, JSON.stringify(v)); }
};
const settings = {
  rate: store.get("rate", 0.95),
  voiceName: store.get("voice", ""),
  aiKey: store.get("aikey", "")
};

/* ---------- voice: native (Capacitor) or web, via VoiceEngine ---------- */
const V = window.VoiceEngine;

function speak(text, rate) { if (V) V.speak(text, rate || settings.rate); }

const onair = document.getElementById("onair");
function setOnAir(on) { onair.classList.toggle("live", on); }

const ERR = {
  "not-allowed": "Microphone access blocked. Allow mic/speech access, then try again.",
  "audio-capture": "No microphone found. Plug one in and try again.",
  "no-speech": "Didn't catch anything — try again, a bit louder.",
  "unsupported": V && V.isNative ? "Speech recognition isn't available on this device." : "Voice scoring needs Chrome or Edge.",
  "start-failed": "Couldn't start the mic — try once more."
};

/* generic mic toggle, one recorder at a time */
function toggleMic(btn, onFinal, onErr) {
  if (!V) { onErr && onErr("unsupported"); return; }
  if (V.active) { V.stopListening(); return; }
  if (!V.recognitionSupported) { onErr && onErr("unsupported"); return; }
  btn.classList.add("rec"); setOnAir(true);
  V.startListening(
    (text, conf) => { btn.classList.remove("rec"); setOnAir(false); onFinal(text, conf); },
    (e) => { btn.classList.remove("rec"); setOnAir(false); onErr && onErr(e); }
  );
}

/* ---------- scoring ---------- */
function normalize(s) {
  return (s || "").toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}
function wordSim(a, b) {
  if (a === b) return 1;
  const d = lev(a, b);
  return 1 - d / Math.max(a.length, b.length, 1);
}
function strSim(a, b) {
  a = normalize(a); b = normalize(b);
  if (!a && !b) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length, 1);
}
function scorePhrase(target, spoken) {
  const t = normalize(target).split(" ").filter(Boolean);
  const s = normalize(spoken).split(" ").filter(Boolean);
  const used = new Array(s.length).fill(false);
  let hits = 0; const marks = [];
  for (const w of t) {
    let bi = -1, best = 0.62;
    for (let i = 0; i < s.length; i++) {
      if (used[i]) continue;
      const sim = wordSim(w, s[i]);
      if (sim > best) { best = sim; bi = i; }
    }
    if (bi >= 0) { used[bi] = true; hits++; marks.push({ w, ok: true }); }
    else marks.push({ w, ok: false });
  }
  const wordPct = t.length ? hits / t.length : 0;
  const score = Math.round(100 * (0.7 * wordPct + 0.3 * strSim(target, spoken)));
  return { score: Math.max(0, Math.min(100, score)), marks, spoken: s.join(" ") };
}
function verdict(score) {
  if (score >= 90) return ["Spot on — native-level clarity.", "#9fd07f"];
  if (score >= 75) return ["Great — very clear and natural.", "#cbe08a"];
  if (score >= 55) return ["Good effort — getting there.", "#e8c25a"];
  if (score > 0)   return ["Keep at it — replay the model and mirror it.", "#ff9b6b"];
  return ["Didn't quite catch that — try again.", "#ff9b6b"];
}

/* ============================================================
   TABS
   ============================================================ */
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("tab--active", t === btn));
  const name = btn.dataset.tab;
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("panel--active", p.id === "panel-" + name));
  if (V) { V.cancelSpeak(); V.stopListening(); }
});

/* ============================================================
   SOUNDS LAB
   ============================================================ */
const soundList = document.getElementById("soundList");
const soundDetail = document.getElementById("soundDetail");
let activeSound = 0;

function renderSoundList() {
  soundList.innerHTML = SOUNDS.map((s, i) => `
    <button class="soundcard ${i === activeSound ? "active" : ""}" data-i="${i}">
      <span class="soundcard__ipa">${s.ipa}</span>
      <span>
        <span class="soundcard__t">${s.title}</span>
        <span class="soundcard__s">${s.sub}</span>
      </span>
    </button>`).join("");
}
function renderSoundDetail() {
  const s = SOUNDS[activeSound];
  const chips = (arr) => arr.map(w => `<button class="chip" data-say="${w}">${w}<span class="chip__spk">▶</span></button>`).join("");
  const pairs = (s.pairs || []).map(p => `
    <div class="pair">
      <button data-say="${p[0]}">${p[0]}</button>
      <button data-say="${p[1]}">${p[1]}</button>
    </div>`).join("");
  soundDetail.innerHTML = `
    <div class="detail__top">
      <div class="detail__ipa">${s.ipa}</div>
      <div class="detail__head">
        <h2>${s.title}</h2>
        <div class="sub">${s.sub}</div>
      </div>
    </div>
    <div class="tip">${s.tip}</div>

    <div class="chips__label">Words — tap to hear</div>
    <div class="chips">${chips(s.words)}</div>

    <div class="chips__label">Sentences — tap to hear</div>
    <div class="chips">${s.sentences.map(t => `<button class="chip" data-say="${t}">${t}<span class="chip__spk">▶</span></button>`).join("")}</div>

    ${s.pairs && s.pairs.length ? `<div class="pairs__label">Minimal pairs — hear the difference</div><div class="pairs">${pairs}</div>` : ""}

    <div class="deck">
      <div class="deck__label">★ Practice — say it, get scored</div>
      <div class="deck__target" id="deckTarget">${s.sentences[0]}</div>
      <div class="deck__row">
        <button class="micbtn" id="deckMic" aria-label="Record">
          <span class="micbtn__icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><path d="M12 17v4"></path><path d="M8 21h8"></path></svg>
          </span>
          <span class="micbtn__wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        </button>
        <button class="tinybtn" id="deckListen">▶ Hear model</button>
        <span class="deck__hint">Tap any word or sentence above to load it here.</span>
      </div>
      <div class="result" id="deckResult">
        <div class="result__bar"><div class="result__fill" id="deckFill"></div></div>
        <div class="result__meta">
          <span class="result__score" id="deckScore">—</span>
          <span class="result__verdict" id="deckVerdict"></span>
        </div>
        <div class="result__heard" id="deckHeard"></div>
      </div>
    </div>`;
}
let deckTargetText = SOUNDS[0].sentences[0];

soundList.addEventListener("click", (e) => {
  const b = e.target.closest(".soundcard"); if (!b) return;
  activeSound = +b.dataset.i;
  renderSoundList(); renderSoundDetail();
  deckTargetText = SOUNDS[activeSound].sentences[0];
});

soundDetail.addEventListener("click", (e) => {
  const say = e.target.closest("[data-say]");
  if (say) {
    const txt = say.dataset.say;
    speak(txt);
    // also load into practice deck
    deckTargetText = txt;
    const dt = document.getElementById("deckTarget");
    if (dt) dt.textContent = txt;
    const r = document.getElementById("deckResult"); if (r) r.classList.remove("show");
    return;
  }
  if (e.target.closest("#deckListen")) { speak(deckTargetText); return; }
  const mic = e.target.closest("#deckMic");
  if (mic) {
    toggleMic(mic,
      (text) => showDeckResult(text),
      (err) => showDeckError(err));
  }
});
function showDeckResult(text) {
  const res = scorePhrase(deckTargetText, text);
  const [vtxt, color] = verdict(res.score);
  document.getElementById("deckResult").classList.add("show");
  const fill = document.getElementById("deckFill");
  fill.style.width = res.score + "%"; fill.style.background = color;
  document.getElementById("deckScore").textContent = res.score + "%";
  document.getElementById("deckScore").style.color = color;
  document.getElementById("deckVerdict").textContent = vtxt;
  document.getElementById("deckHeard").innerHTML = text
    ? "heard: " + res.marks.map(m => `<span class="${m.ok ? "ok" : "bad"}">${m.w}</span>`).join(" ")
    : "heard: (silence)";
}
function showDeckError(err) {
  document.getElementById("deckResult").classList.add("show");
  document.getElementById("deckScore").textContent = "—";
  document.getElementById("deckVerdict").textContent = ERR[err] || "Something went wrong.";
  document.getElementById("deckFill").style.width = "0%";
  document.getElementById("deckHeard").textContent = "";
}

/* ============================================================
   SHADOWING
   ============================================================ */
const shadowGrid = document.getElementById("shadowGrid");
function renderShadow() {
  shadowGrid.innerHTML = SHADOW.map((s, i) => `
    <div class="scard" data-i="${i}">
      <div class="scard__formal">Textbook: “${s.formal}”</div>
      <div class="scard__casual">${s.casual}</div>
      <div class="scard__note">${s.note}</div>
      <div class="scard__row">
        <button class="pill" data-act="natural">▶ Natural</button>
        <button class="pill" data-act="slow">🐢 Slow</button>
        <button class="pill pill--rec" data-act="rec">● Shadow it</button>
      </div>
      <div class="scard__result">
        <span class="score"></span> <span class="vtxt"></span>
        <div class="heard"></div>
      </div>
    </div>`).join("");
}
shadowGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]"); if (!btn) return;
  const card = e.target.closest(".scard");
  const item = SHADOW[+card.dataset.i];
  if (btn.dataset.act === "natural") return speak(item.casual);
  if (btn.dataset.act === "slow") return speak(item.casual, 0.7);
  if (btn.dataset.act === "rec") {
    toggleMic(btn,
      (text) => {
        const res1 = scorePhrase(item.formal, text);
        const res2 = scorePhrase(item.casual, text);
        const res = res1.score >= res2.score ? res1 : res2;
        const [vtxt, color] = verdict(res.score);
        const box = card.querySelector(".scard__result");
        box.classList.add("show");
        box.querySelector(".score").textContent = res.score + "%";
        box.querySelector(".score").style.color = color === "#9fd07f" ? "var(--olive)" : (res.score >= 55 ? "var(--gold)" : "var(--vermilion)");
        box.querySelector(".vtxt").textContent = vtxt;
        box.querySelector(".heard").textContent = text ? "heard: " + text : "heard: (silence)";
      },
      (err) => {
        const box = card.querySelector(".scard__result");
        box.classList.add("show");
        box.querySelector(".score").textContent = "";
        box.querySelector(".vtxt").textContent = ERR[err] || "Try again.";
        box.querySelector(".heard").textContent = "";
      });
  }
});

/* ============================================================
   CONVERSATION
   ============================================================ */
const chat = document.getElementById("chat");
const chatEmpty = document.getElementById("chatEmpty");
const scenarioList = document.getElementById("scenarioList");
const convDock = document.getElementById("convDock");
const convTitle = document.getElementById("convTitle");
const convHint = document.getElementById("convHint");
const convMic = document.getElementById("convMic");
const convRestart = document.getElementById("convRestart");

let conv = null; // {scenario, step, history}
const GENERIC = [
  "That's interesting — tell me more about that.",
  "Oh nice. And how do you feel about it?",
  "Gotcha. What else is going on with you?",
  "Cool, cool. Anything else on your mind?",
  "I hear you. So what's next for you?"
];

function renderScenarios() {
  scenarioList.innerHTML = SCENARIOS.map(s => `
    <button class="scenbtn" data-id="${s.id}">
      <span class="scenbtn__emoji">${s.emoji}</span> ${s.title}
    </button>`).join("");
}
scenarioList.addEventListener("click", (e) => {
  const b = e.target.closest(".scenbtn"); if (!b) return;
  document.querySelectorAll(".scenbtn").forEach(x => x.classList.toggle("active", x === b));
  startScenario(SCENARIOS.find(s => s.id === b.dataset.id));
});
convRestart.addEventListener("click", () => { if (conv) startScenario(conv.scenario); });

function startScenario(scn) {
  conv = { scenario: scn, step: 0, history: [] };
  chat.innerHTML = "";
  chatEmpty.style.display = "none";
  convDock.hidden = false;
  convRestart.hidden = false;
  convTitle.textContent = scn.emoji + "  " + scn.title;
  botSay(scn.opener);
}
function bubble(text, who) {
  const div = document.createElement("div");
  div.className = "bubble bubble--" + who;
  div.textContent = text;
  if (who === "bot") {
    const spk = document.createElement("button");
    spk.className = "bubble__spk"; spk.title = "Replay"; spk.textContent = "▶";
    spk.onclick = () => speak(text);
    div.appendChild(spk);
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}
function botSay(text) {
  bubble(text, "bot");
  conv.history.push({ role: "assistant", content: text });
  speak(text);
}
function typing() {
  const div = document.createElement("div");
  div.className = "bubble bubble--bot bubble--typing";
  div.innerHTML = "<i></i><i></i><i></i>";
  chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
  return div;
}

convMic.addEventListener("click", () => {
  if (!conv) return;
  toggleMic(convMic,
    (text) => {
      if (!text) { convHint.textContent = "Didn't catch that — tap and try again."; return; }
      convHint.textContent = "Tap the mic and speak your reply";
      bubble(text, "me");
      conv.history.push({ role: "user", content: text });
      respond(text);
    },
    (err) => { convHint.textContent = ERR[err] || "Try again."; });
});

async function respond(userText) {
  const t = typing();
  if (settings.aiKey) {
    try {
      const reply = await aiReply();
      t.remove(); botSay(reply); return;
    } catch (e) {
      t.remove();
      botSay("(AI partner unavailable — switching to the built-in partner.) " + scriptedReply(userText));
      return;
    }
  }
  // scripted: small natural delay
  await new Promise(r => setTimeout(r, 650));
  t.remove();
  botSay(scriptedReply(userText));
}
function scriptedReply(userText) {
  const scn = conv.scenario;
  let reaction = "";
  const low = " " + normalize(userText) + " ";
  for (const key in scn.reactions) {
    if (key.split("|").some(k => low.includes(" " + k) || low.includes(k + " ") || low.includes(" " + k + " "))) {
      reaction = scn.reactions[key] + " "; break;
    }
  }
  let line;
  if (conv.step < scn.script.length) line = scn.script[conv.step++];
  else line = GENERIC[(conv.step++ - scn.script.length) % GENERIC.length];
  return reaction + line;
}
async function aiReply() {
  const scn = conv.scenario;
  const sys = `You are ${scn.persona} in a casual spoken conversation, helping someone practice American English. Scenario: "${scn.title}". Reply in 1-2 short, warm, natural sentences of everyday American English. Ask a follow-up question to keep the chat going. Never mention being an AI or break character.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": settings.aiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      system: sys,
      messages: conv.history
    })
  });
  if (!res.ok) throw new Error("api " + res.status);
  const data = await res.json();
  return (data.content && data.content[0] && data.content[0].text) || "Sorry, could you say that again?";
}

/* ============================================================
   SETTINGS MODAL
   ============================================================ */
const modal = document.getElementById("settingsModal");
const voiceSelect = document.getElementById("voiceSelect");
const rateRange = document.getElementById("rateRange");
const rateVal = document.getElementById("rateVal");
const aiKeyInput = document.getElementById("aiKey");

function renderVoiceOptions() {
  if (!voiceSelect || !V) return;
  const list = V.listVoices();
  voiceSelect.innerHTML = list.map(v =>
    `<option value="${v.name}" ${v.name === V.currentVoiceName ? "selected" : ""}>${v.name}</option>`
  ).join("") || `<option>No US voice found</option>`;
}
document.getElementById("settingsBtn").onclick = () => { modal.hidden = false; };
modal.addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) modal.hidden = true; });
voiceSelect.onchange = () => {
  if (V) V.setVoice(voiceSelect.value);
  settings.voiceName = voiceSelect.value; store.set("voice", settings.voiceName);
};
rateRange.value = settings.rate;
rateVal.textContent = (+settings.rate).toFixed(2) + "×";
rateRange.oninput = () => {
  settings.rate = +rateRange.value;
  rateVal.textContent = settings.rate.toFixed(2) + "×";
  store.set("rate", settings.rate);
};
document.getElementById("testVoice").onclick = () => speak("Hi there! This is how your American voice sounds. Let's practice.");
aiKeyInput.value = settings.aiKey;
aiKeyInput.oninput = () => { settings.aiKey = aiKeyInput.value.trim(); store.set("aikey", settings.aiKey); };

/* ============================================================
   BOOT
   ============================================================ */
function showNotice() {
  const n = document.getElementById("notice");
  const msgs = [];
  if (V && !V.isNative && !V.recognitionSupported) msgs.push("Voice <b>scoring & conversation</b> need <b>Chrome</b> or <b>Edge</b> (this browser can't do speech recognition). Listening to model audio still works everywhere.");
  if (location.protocol === "file:") msgs.push("Open this via a local server (e.g. <code>http://localhost:8000</code>) so the microphone is allowed — opening the file directly blocks the mic.");
  if (msgs.length) { n.innerHTML = msgs.join("<br>"); n.hidden = false; }
}

if (V) {
  V.onVoicesChanged(renderVoiceOptions);
  V.init(settings.voiceName).then(renderVoiceOptions);
}
renderSoundList();
renderSoundDetail();
renderShadow();
renderScenarios();
showNotice();

/* ---------- PWA: install + offline (browser only; the native app doesn't need it) ---------- */
const RUN_NATIVE = !!(V && V.isNative);
if (!RUN_NATIVE && !/[?&]nosw/.test(location.search) && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}

const installBtn = document.getElementById("installBtn");
let deferredPrompt = null;
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isStandalone) installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => { installBtn.hidden = true; });

/* iOS Safari has no install prompt — show a one-time "Add to Home Screen" hint */
(function iosHint() {
  if (RUN_NATIVE) return;
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const inSafari = iOS && !/crios|fxios|edgios/i.test(navigator.userAgent);
  if (iOS && !isStandalone && inSafari && !store.get("iosHintSeen", false)) {
    const n = document.getElementById("notice");
    const prev = n.hidden ? "" : n.innerHTML + "<br>";
    n.innerHTML = prev + "📲 <b>Install on your iPhone:</b> tap the <b>Share</b> icon, then <b>Add to Home Screen</b>. <a href='#' id='iosDismiss'>Got it</a>";
    n.hidden = false;
    const dz = document.getElementById("iosDismiss");
    if (dz) dz.onclick = (e) => { e.preventDefault(); store.set("iosHintSeen", true); n.hidden = true; };
  }
})();
