/* ============================================================
   STATESIDE — VoiceEngine
   One API for speech that works two ways:
   • Native app (Capacitor)  -> @capacitor-community/text-to-speech
                                + @capacitor-community/speech-recognition
   • Browser                 -> Web Speech API (speechSynthesis / SpeechRecognition)
   app.js talks only to window.VoiceEngine and never cares which is live.
   ============================================================ */
(function () {
  "use strict";

  const Cap = window.Capacitor;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === "function" && Cap.isNativePlatform());

  // Native plugin proxies (only meaningful inside the Capacitor shell)
  const NTTS = isNative && Cap.registerPlugin ? Cap.registerPlugin("TextToSpeech") : null;
  const NSR  = isNative && Cap.registerPlugin ? Cap.registerPlugin("SpeechRecognition") : null;

  // Web fallbacks
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const WebSR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const Engine = {
    isNative,
    platform: isNative ? "native" : "web",
    recognitionSupported: !!(NSR || WebSR),
    ttsSupported: !!(NTTS || synth),
    active: false,            // currently listening?

    _voices: [],              // [{ name, lang }]
    currentVoiceName: "",

    // ---- web internals ----
    _webRec: null,
    // ---- native internals ----
    _nativeHandle: null,
    _nativeLast: [],
    _onFinal: null,
    _onErr: null,

    /* ---------------- init / voices ---------------- */
    async init(prefName) {
      this.currentVoiceName = prefName || "";
      if (isNative && NTTS) {
        try {
          const { voices } = await NTTS.getSupportedVoices();
          this._voices = (voices || [])
            .filter(v => /en[-_]?US/i.test(v.lang || ""))
            .map(v => ({ name: v.name, lang: v.lang }));
        } catch { this._voices = []; }
      } else if (synth) {
        this._loadWebVoices();
        // voices often arrive async
        synth.onvoiceschanged = () => { this._loadWebVoices(); this._notify(); };
      }
      this._pickVoice();
      return this;
    },

    _loadWebVoices() {
      if (!synth) return;
      let vs = synth.getVoices().filter(v => /en[-_]?US/i.test(v.lang) || /english.*united states/i.test(v.name));
      if (!vs.length) vs = synth.getVoices().filter(v => /^en/i.test(v.lang));
      const pref = ["Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Microsoft Guy", "Microsoft Zira", "Alex"];
      vs.sort((a, b) => {
        const ai = pref.findIndex(p => a.name.includes(p));
        const bi = pref.findIndex(p => b.name.includes(p));
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      this._voices = vs.map(v => ({ name: v.name, lang: v.lang, _native: v }));
    },

    _pickVoice() {
      const found = this._voices.find(v => v.name === this.currentVoiceName);
      if (!found && this._voices.length) this.currentVoiceName = this._voices[0].name;
    },

    listVoices() { return this._voices.map(v => ({ name: v.name, lang: v.lang })); },
    setVoice(name) { this.currentVoiceName = name; },

    _onVoicesChanged: null,
    onVoicesChanged(cb) { this._onVoicesChanged = cb; },
    _notify() { this._pickVoice(); if (this._onVoicesChanged) this._onVoicesChanged(); },

    /* ---------------- speak ---------------- */
    speak(text, rate) {
      rate = rate || 0.95;
      if (isNative && NTTS) {
        NTTS.stop().catch(() => {});
        NTTS.speak({
          text,
          lang: "en-US",
          rate: Math.max(0.1, Math.min(2, rate)),
          pitch: 1.0,
          volume: 1.0,
          voice: this._voiceIndexForNative(),
          category: "playback"
        }).catch(() => {});
        return;
      }
      if (synth) {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        const v = this._voices.find(x => x.name === this.currentVoiceName);
        if (v && v._native) u.voice = v._native;
        u.rate = rate; u.pitch = 1;
        synth.speak(u);
      }
    },
    _voiceIndexForNative() {
      const i = this._voices.findIndex(v => v.name === this.currentVoiceName);
      return i >= 0 ? i : undefined;
    },
    cancelSpeak() {
      if (isNative && NTTS) { NTTS.stop().catch(() => {}); return; }
      if (synth) synth.cancel();
    },

    /* ---------------- listen ---------------- */
    async startListening(onFinal, onErr) {
      if (this.active) return;
      this._onFinal = onFinal; this._onErr = onErr;

      if (isNative && NSR) {
        try {
          const perm = await NSR.requestPermissions();
          const ok = perm && (perm.speechRecognition === "granted" || perm.speechRecognition === "prompt" || perm.audioRecording === "granted");
          if (perm && perm.speechRecognition === "denied") { onErr && onErr("not-allowed"); return; }
          this._nativeLast = [];
          this._nativeHandle = await NSR.addListener("partialResults", (d) => {
            if (d && d.matches && d.matches.length) this._nativeLast = d.matches;
          });
          // some versions emit a listeningState event when it stops on its own
          try {
            this._stateHandle = await NSR.addListener("listeningState", (s) => {
              if (s && s.status === "stopped" && this.active) this._finishNative();
            });
          } catch {}
          this.active = true;
          await NSR.start({ language: "en-US", maxResults: 3, partialResults: true, popup: false });
        } catch (e) {
          this.active = false;
          onErr && onErr((e && /denied|permission/i.test(e.message || "")) ? "not-allowed" : "start-failed");
        }
        return;
      }

      if (WebSR) {
        const r = new WebSR();
        r.lang = "en-US"; r.interimResults = true; r.maxAlternatives = 3; r.continuous = false;
        let finalText = "", conf = 0;
        r.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) { finalText += res[0].transcript + " "; conf = res[0].confidence || conf; }
          }
        };
        r.onerror = (e) => { this.active = false; this._onErr && this._onErr(e.error); };
        r.onend = () => { this.active = false; this._onFinal && this._onFinal(finalText.trim(), conf); };
        this._webRec = r; this.active = true;
        try { r.start(); } catch { this.active = false; onErr && onErr("start-failed"); }
        return;
      }

      onErr && onErr("unsupported");
    },

    stopListening() {
      if (!this.active) return;
      if (isNative && NSR) { NSR.stop().then(() => this._finishNative()).catch(() => this._finishNative()); return; }
      if (this._webRec) { try { this._webRec.stop(); } catch {} }
    },

    _finishNative() {
      if (!this.active) return;
      this.active = false;
      const text = (this._nativeLast && this._nativeLast[0]) || "";
      if (this._nativeHandle && this._nativeHandle.remove) this._nativeHandle.remove();
      if (this._stateHandle && this._stateHandle.remove) this._stateHandle.remove();
      this._nativeHandle = this._stateHandle = null;
      this._onFinal && this._onFinal(text, 0.9);
    }
  };

  window.VoiceEngine = Engine;
})();
