# Decay

> A quiet, offline companion that slowly fades if forgotten — and leaves behind a beautiful Death Certificate when it passes.

**Developer:** HAMZA POWERPLAYER ([hamzapowerplayer.com](https://hamzapowerplayer.com))  
**Version:** 1.0.0  
**License:** Proprietary — emotional-reflection purpose, provided as-is  
**Status:** Production-ready build for Play Store submission  
**Stack:** Expo SDK 57.0.25 · React Native 0.86.3 · TypeScript · Reanimated 3 · Skia

---

## Philosophy

Decay is not a utility. It is not gamified, not a pet, not a mascot, and not a performance metric. It is an interactive meditation on presence, impermanence, and the quiet dignity of being forgotten. The companion respires slowly; its decay is real, driven by actual neglect — days since last visit, quality of presence, and an unavoidable horizon no amount of care can outrun. When it finally passes, the app reveals a personal, elegantly composed Death Certificate: a lifespan, a poetic cause built from your real visit history, a sincere eulogy, and a quiet timestamp. There is no replay. The only return is a deliberate reinstall.

Every design decision — the void-charcoal palette (`#0B0D12` → `#12151C`), the warm gold glow (`#E8C888`), the Fractures/Cracking stages rendered in soft teal-lavender (`#8FA3B0` → `#A594C4`), the breathing animation rhythms tuned per decay stage — exists to make the experience feel held, not played.

---

## Core Architecture

### Offline-First, Zero-Backend

- **No network requests** — never analytics, never tracking, never third-party SDKs.
- **No login, no account** — all usage history lives locally on-device.
- **Storage:** `expo-sqlite` (v2 schema with atomic BEGIN/COMMIT/ROLLBACK, defensive schema versioning, monotonic elapsed-time tracking, clock-change resilience with backward-jump cap at `−1h`). Previous `AsyncStorage` state migrates cleanly via `migrateIfNeeded()`.
- **Data integrity:** transaction-safe writes; crash-safe; reinstall-boundary explicitly documented (sqlite DB local to `/data/data/<pkg>` — intentionally fresh on reinstall, with optional JSON export for manual continuity via the Quiet Archive).

### Decay Engine (`src/lib/decay.ts`)

Six stages, deterministic replay from visit history:

| Stage | Doorway (days) | Visual Character | Breath (s) | Scale | Glow |
|---|---|---|---|---|---|
| **Vibrant** | 0–2 | Full gold aurora, particles | 5.5 | 1.00 | 1.00 |
| **Dimming** | 3–6 | Soft amber edge | 6.5 | 0.97 | 0.88 |
| **Fading** | 7–13 | Teal-lavern desaturation | 7.5 | 0.93 | 0.70 |
| **Cracking** | 14–25 | Subtle fracture overlay | 8.5 | 0.88 | 0.55 |
| **Barely Holding On** | 26–45 | Near-transparent ghost, flicker | 10.0 | 0.80 | 0.34 |
| **Passing** | 46+ | Fully faded; next open triggers Certificate | 12.0 | 0.72 | 0.12 |

- **Neglect** computed by replaying real visits (`wasPresent = true` only after 10–15s presence); a real visit buys back ~12 days but never fully resets to Vibrant.
- **Impermanence horizon:** `HORIZON_BASE = 170` + `1 day/visit` (max 100), curved at `power=4`; even actively cared-for companions eventually reach Passing within ~6–9 months — intentional, not a failure.

### Memory Fragments (`src/lib/fragments.ts`)

45 offline fragment templates (15 openings / 15 details / 15 closings). Shown passively and rarely (~5–25% chance, weighted to longer visits), deterministically seeded from `plantedAt + visitCount + ms`. Never repeated identically for the same user; fade after ~6s; no button, no notification, no score.

---

## Screen Architecture (`src/app/` — Expo Router)

| Route | Purpose | Key Behavior |
|---|---|---|
| `/` (`index`) | Entry / routing hub | Routes to onboarding → home → certificate based on state |
| `/onboarding` | 3 quiet slides + `Begin` | First launch only; plants companion timestamp; soft glow appears on final slide |
| `/home` | Living companion | Breathing abstract form; passive 10–15s presence detection; ambient sound toggle (off by default) |
| `/certificate` | Death Certificate (auto-reveal) | Full-screen, no chrome, elegant card with lifespan / cause / eulogy / timestamp; `Save / Share` via `react-native-view-shot` (1080×1920, quality 1, 9:16 story ratio); **no restart button** |
| `/settings` | Minimal | Ambient sound, Developer Support (email / WhatsApp / Patreon), Terms, Privacy, About |
| `/archive` | Quiet Archive | Post-death list of passed companions; no counts, no achievements, respectful only; JSON export/import for manual continuity |

### Design System (`src/theme/index.ts`)

- **Palette:** `void-deep #0B0D12`, `void-mid #12151C`, `gold-warm #E8C888`, `teal-soft #8FA3B0`, `lavender-soft #A594C4`, `text-warm #F0EDE6`.
- **Typography:** `Fraunces` (serif, 300–400, emotional weight) for headings / eulogy / certificate; `Source Sans 3` (humanist sans, 400, 0.08em tracking) for UI.
- **Spacing:** 8pt base; generous negative space; companion feels alone in vast dark.
- **Seasons of Light:** barely perceptible time-of-day tint (`sunset` warm amber 5%, `late-night` cool lavender 4%, else 3%) — ambient layer, never a feature.

---

## Advanced Features (Pass 3)

### Memory Fragments
Passive, offline, weighted to real presence. No interaction required; fragments surface quietly and fade.

### Seasons of Light
Subtle background glow shift tied to real device time. Most users feel it rather than notice it explicitly.

### The Quiet Archive
After passing, `Keep it here` stores the certificate locally (no counts, no gallery framing). If you begin again after reinstall, both certificates live side-by-side — a quiet record across time, never a collection to complete.

### Presence Ritual
Real presence now respects authentic time: screen face-down or briefly dimmed (accelerometer `z<=-7` + proximity `<1`) still counts, with graceful timer-only fallback if sensors are unavailable — presence is never blocked by device limitations.

### Gentle Reminder (optional, off by default)
Soft local notification (`expo-notifications`) — max once every several days, message exactly: *"It's been a while."* Zero urgency, zero emojis, zero exclamation points. Easily disabled.

---

## Native Widget (`plugins/with-decay-widget.js`)

- **Visual-only** Android home-screen widget (no text, no numbers, no branding).
- Reflects live decay stage via native `RemoteViews`: radial glow (`GLOW` array per stage), core (`CORE` array), alpha (`ALPHA` 1.0 → 0.12), scale (`SCALE` 1.0 → 0.72), tremble for stage 4.
- Updates via `DecayWidgetModule.setStage()` + `DecayWidgetProvider.renderAll()`.
- **Reliability:** `DecayWidgetWorker.kt` schedules periodic update (30 min); `try/catch` around render with `readStage` default 0; never blank.
- **Battery resilience:** designed for Doze mode; relies on periodic worker rather than continuous polling.

---

## Sound (`assets/audio/ambient.wav` + `src/hooks/use-ambient-audio.ts`)

- Ambient breathing tone, off by default, never autoplayed.
- Stage-derived rate (`0.85`–`1.0`) + volume fade per stage; sound and visual decay together.
- SDK-57 guard: if `setRateAsync` unavailable, graceful fallback to volume-only.

---

## Quality & Accessibility

- **Animation:** Reanimated 3 + Skia; 60fps breathing/glow/particle; slow cross-fade between stages (2.5s); death reveal is the slowest moment (3.5s, no swipe, no button).
- **Micro-interactions:** haptic on presence registration; breathable easing curves vary by stage (full/slow → shallow/irregular).
- **Accessibility:** readable sizes (≥14pt), sufficient contrast, screen-reader labels on all interactive elements despite minimal UI.
- **Fully offline:** zero loading spinners, zero network dependencies, zero tracking.

---

## Developer Information

- **Contact / Feedback:** `hamzapowerplayer.global@gmail.com` / WhatsApp `+923129584661`
- **Developer Support:** `https://www.patreon.com/posts/heartfelt-thank-153029964`
- **Governance:** HAMZA POWERPLAYER (`hamzapowerplayer.com`)
- **Privacy:** collects NO personal data; requires NO account; all data stored 100% locally; no analytics SDKs; no network requests.
- **Terms:** entertainment / emotional-reflection purpose; irreversible death mechanic disclosed clearly; standard liability disclaimers.

---

## Project Structure (key paths)

```
decay/
├── src/app/              # Expo Router screens (onboarding, home, certificate, settings, archive)
├── src/lib/              # decays engine, fragments, sqlite store, eulogy generator, export, notification
├── src/components/       # CompanionForm, controls, page layout
├── src/hooks/            # use-presence, use-ambient-audio
├── src/theme/            # design tokens, stage visuals, season tint
├── assets/               # images (icon, splash, adaptive icons), audio (ambient.wav)
├── plugins/              # with-decay-widget.js (native Android widget config)
├── scripts/              # generate-decay-assets.js, reset-project.js
└── DECAY_UI_DESIGN_SPEC.md
```

---

## Build & Submission Notes

- **Dependencies:** `expo-sqlite` added (Pass 3); `expo-sensors` declared (Pass 3 — requires `npm install` + native rebuild for presence ritual); all SDK 57 compatible.
- **Native generation:** Continuous Native Generation — do not edit `android/` or `ios/` directly; configure via `app.json` and config plugins.
- **Development:** `npx expo start` / `expo run:android` / EAS build for Play Store submission.
- **Reinstall boundary:** documented intentionally in `sqlite-store.ts`; archive requires explicit user export/import for continuity.

---

*Built slowly. Without a single analytics SDK in it.*
