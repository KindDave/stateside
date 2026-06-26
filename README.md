# Stateside — American English Studio

A voice-driven app for practicing **American English pronunciation, accent, and natural
conversation**. It speaks to you with a US voice, listens through your mic, scores how close
you got, and runs live conversation practice.

It runs **three ways from one codebase**:

- a plain **website** (no build),
- an installable **PWA** on your phone's home screen,
- a real **native app** (Android/iOS) via Capacitor, using on-device speech engines.

> **Live app:** https://kinddave.github.io/stateside/ — auto-deployed from `www/` by
> GitHub Pages. **On iPhone:** open that link in **Safari → Share → Add to Home Screen.**

## What's inside

**01 · Sounds** — A lab for the sounds that define a General American accent: the rhotic R,
the flap T (*water → "wadder"*), TH, the bright short A, the schwa (rhythm), sheep-vs-ship,
the dark L, and the O glide. Tap any word or sentence to hear it, then record yourself and
get a percentage score with word-by-word feedback.

**02 · Shadowing** — How Americans actually talk: linking and reductions (*gonna, wanna,
gotta, whatcha, lemme*). Hear the natural version, then echo it back.

**03 · Conversation** — Six real-life scenarios (coffee shop, small talk, job interview,
restaurant, directions, making plans). Your partner speaks first; hold the mic and reply out
loud. Works fully offline with a scripted partner, or plug in an Anthropic API key (Settings)
to make it open-ended, powered by Claude.

## Project layout

```
www/                 ← the whole web app (this is also Capacitor's webDir)
  index.html, styles.css, lessons.js
  voice.js           ← VoiceEngine: native speech on phones, Web Speech API in browsers
  app.js             ← UI + scoring + conversation engine
  manifest.webmanifest, service-worker.js, icon-*.png
android/             ← generated native Android project (open in Android Studio)
assets/              ← 1024px icon + splash sources for @capacitor/assets
make_icons.py        ← regenerates www icons + assets sources (needs Pillow)
capacitor.config.json, package.json
```

`voice.js` is the key glue: the app only ever calls `VoiceEngine.speak()` /
`startListening()`, and the engine picks the implementation — **native plugins** inside the
Capacitor app, the **Web Speech API** in a browser.

## 1) Run as a website

The mic needs a *secure context*, so serve over `localhost` (don't double-click the file):

```bash
npm run serve              # → http://localhost:8000   (serves www/)
# or:  python -m http.server 8000 --directory www
```

Open in **Chrome or Edge** (they have speech recognition; Firefox/Safari can play model audio
but can't score your voice) and allow the mic. Add `?nosw` to the URL to bypass the
service-worker cache while developing.

## 2) Install as a phone PWA

The app installs to your home screen, runs full-screen, and works offline — no app store.

**Important:** the mic only works over **https** (or localhost). Opening the dev server over
your LAN (`http://192.168.x.x`) plays audio but **won't** record. So host it on HTTPS:

1. **Free static hosting (easiest)** — drag the **`www/`** folder onto
   [Netlify Drop](https://app.netlify.com/drop) (or use Cloudflare Pages / Vercel / GitHub
   Pages). You get an `https://…` link in seconds.
2. **Tunnel from your computer** — `cloudflared tunnel --url http://localhost:8000`
   (or `ngrok http 8000`), then open the printed `https://…` link on the phone.

Then: **Android (Chrome)** → ⋮ → *Install app*; **iPhone (Safari)** → Share → *Add to Home
Screen*. (On iOS Safari, speech *recognition* is limited — the native app below fixes that.)

## 3) Build the native app (Android / iOS)

Already scaffolded. The native speech plugins are installed and the Android project exists
with mic permissions wired in.

```bash
npm install                # restore dependencies if needed
npm run sync               # copy www/ + plugins into the native projects (run after web edits)

# Android  (Android Studio + JDK 17 — works on Windows)
npm run open:android       # opens the project; press ▶ Run to a device/emulator

# iOS  (requires a Mac + Xcode)
npm run add:ios            # creates the ios/ project (Mac only)
npm run open:ios
```

**What's already configured**

- `capacitor.config.json` — appId `com.stateside.app`, appName **Stateside**, `webDir: www`.
  (Change `appId` to your own reverse-domain before publishing.)
- Plugins: [`@capacitor-community/speech-recognition`](https://github.com/capacitor-community/speech-recognition)
  + [`@capacitor-community/text-to-speech`](https://github.com/capacitor-community/text-to-speech),
  auto-selected by `voice.js` when running natively.
- **Android** `AndroidManifest.xml` — `RECORD_AUDIO` permission and the Android-11+
  `<queries>` entry for the on-device recognizer are added. Launcher icon + splash generated.

**iOS — add these two keys to `ios/App/App/Info.plist`** (after `npm run add:ios`):

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Stateside listens to your speech to score your pronunciation.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>Stateside uses speech recognition to check your American English.</string>
```

Regenerate icons/splash any time with `python make_icons.py` then
`npx @capacitor/assets generate` (regenerates from `assets/`).

## Notes

- **Privacy:** everything runs on-device. The browser/native speech engine does the
  recognition. An optional API key (for open-ended conversation) is stored only on the device
  and sent directly to Anthropic.
- **Scoring** compares the words the recognizer heard against the target — it rewards
  intelligibility and clear word shapes. It's a practice aid, not a phonetics lab.
- Pick your US voice and model speed in **Settings** (gear icon).
