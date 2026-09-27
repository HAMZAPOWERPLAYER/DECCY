# DECAY — UI Design Specification
Status: production handoff  |  App: C:\New folder\decay  |  Palette: void-charcoal / warm gold / teal-lavender

---

## 1. Design Tokens

### Palette (no saturation, no status colors)
| Token | Hex | Use |
|---|---|---|
| `void-deep` | `#0B0D12` | base background, onboarding, cert |
| `void-mid` | `#12151C` | secondary bg, widget bg |
| `gold-warm` | `#E8C888` | companion full health, certificate lines, subtle bloom |
| `amber-soft` | `#D4A96A` | companion dim edge glow |
| `teal-soft` | `#8FA3B0` | early fade stage |
| `lavender-soft` | `#A594C4` | late fade / cracking |
| `lavender-deep` | `#7A7488` | barely-holding-on ghost |
| `text-warm` | `#F0EDE6` | all body / heading text (never #FFFFFF) |
| `text-dim` | `#9A958E` | secondary text, timestamps |
| `hairline` | `#24272F` | 1px rules (only where needed) |

### Typography
- Headings / eulogy / certificate: `Fraunces` (Google Font), 48–72pt, weight 300–400, letter-spacing -0.02em, line-height 1.15. All emotional weight lives here.
- UI / body / settings labels: `Source Sans 3`, 14–16pt, weight 400, letter-spacing 0.08em (labels) / 0.01em (body), line-height 1.6.
- Numbers / lifespan: same serif, 72pt, weight 300, warm gold.

### Spacing Scale (8pt base)
- `xs` 4pt  |  `sm` 8pt  |  `md` 16pt  |  `lg` 32pt  |  `xl` 64pt  |  `xxl` 120pt
- Screen padding: `lg` (32pt) horizontal, `xl` (64pt) top at home
- Negative space is the primary layout tool; never crowd.

---

## 2. Companion Form — Abstract Organic Blob
Not a mascot, never cute. A slow-breathing radial-gradient metaball.
- Shape: large soft oval with 3 overlapping radial blobs (metaball-style) so edges feel organic, not geometric.
- Breathing: scale 1.0 → 1.03 → 1.0 over ~5s, with alpha 0.85 → 1.0 → 0.85, synchronized.
- Core glow: radial gradient `#E8C888` → `#12151C` (soft falloff, ~180pt radius at full scale).
- Bloom: extremely soft radial glow behind the form (`#E8C888` at 0.08 alpha, 300pt radius) — no hard shadow, only ambient bleed.
- Particle drift (vibrant only): 12–18 tiny dots of `#F0EDE6` at 0.4 alpha, drifting slowly upward, 15–28s cycle.
- No outline, no stroke, no border.

---

## 3. Screen Specs (pixel-accurate)

### 3.1 Onboarding — 3 slides + Begin
All slides: `void-deep` bg, single centered line, minimal progress dots at bottom (3 dots, current filled `gold-warm`, others `#24272F`). No images, no icons, no cards.
- **Slide 1**: Serif line: "This companion lives because you notice it." Subtle: "Not a pet. Not a game." Centered vertically, y ≈ 40%.
- **Slide 2**: Serif line: "It will fade if you forget it. That is not a failure — it is its nature." Centered.
- **Slide 3**: Serif line: "When it passes, you will receive a quiet record of the time you shared." Centered.
- **Begin screen**: Same dark. First faint companion bloom appears softly at center (scale 0.7, alpha 0.3, gold), growing over 1.2s. Button below: plain word "Begin" in `Source Sans 3` 16pt, `text-warm`, letter-spacing 0.12em, no background, no border, with invisible 44pt touch target. On press: companion brightens to full, screen fades out after 0.6s.

### 3.2 Home / Companion — 3 stage variations
Same layout for all: full-screen dark, companion centered, nothing else visible until long-press / timer interaction (see below).
- **Position**: companion center, x=50%, y=46% (slightly above true center for emotional lightness).
- **Vibrant stage** (0–2 days neglect): form at 100% scale, gold glow full, bloom active, particles drifting. Companion is warm and present.
- **Fading stage** (7–13 days): form at ~85% scale, color shifted to `#8FA3B0` / `#A594C4`, glow at ~50% alpha, bloom reduced, particles gone. More dark space visible around it; it feels smaller in the void.
- **Barely-holding-on stage** (26–45 days): form at ~55% scale, `#7A7488`, near-transparent (0.25 alpha), almost a ghost outline, no bloom, occasional faint flicker (2–3s interval). The screen feels enormous and empty around it.

**Interaction**: staying on screen for 10–15s = "real visit". On register: haptic (light), companion brightens slightly for 0.8s, decay score pushes back (not fully reset — per `HEAL_PER_VISIT` 12 days). No progress bars, no numbers shown anywhere.

**Ambient sound toggle**: placed only in Settings; off by default. No sound indicator on home.

### 3.3 Death Certificate — full screen, no chrome
Full-bleed `void-deep`. No navbar, no back button, no close. One centered elegant composition.
- **Card frame** (very subtle): thin 1pt `gold-warm` line, open at bottom, framing text with 48pt margin inside. Not a filled card — just a faint rule.
- **Top decorative line**: thin 1pt gold rule, 120pt wide, centered, with tiny 6pt gold circles at ends (minimal celestial motif).
- **Lifespan**: serif 72pt, `gold-warm`, weight 300: "Lived for 41 days". Below: `text-dim` 14pt sans: "Passed at 3:17 AM on the 41st day."
- **Cause line**: serif 20pt, `text-warm`, italic-leaning: "Neglect, 6 days of silence, then a long gentle forgetting." (generated from true `visitLog` / `analysis` data.)
- **Eulogy**: 2–4 sentences, serif 18pt, `text-warm`, line-height 1.5. Sincere tone, zero guilt, zero jokes.
- **Timestamp**: `text-dim` 12pt at very bottom, centered, quiet.
- **Bottom action**: "Save / Share" text link, 14pt sans, `text-warm`, letter-spacing 0.1em, with a thin 1pt gold underline on hover/focus only. No bright button fill — this is not a CTA.
- No restart text anywhere on this screen.

### 3.4 Settings — minimal list
`void-deep` bg, same padding, no cards.
- List rows: thin 1pt `hairline` top rule, 48pt row height, 16pt left/right padding.
- Row contents: label `Source Sans 3` 15pt `text-warm`; value / toggle right-aligned.
- Sections separated by 32pt vertical space (not lines): Ambient Sound, Developer Support, Terms & Conditions, Privacy Policy, About.
- **Developer Support row** (when expanded): calm prose block, email `hamzapowerplayer.global@gmail.com`, WhatsApp `+923129584661`, Patreon link `https://www.patreon.com/posts/heartfelt-thank-153029964` — all plain text links, no badges, no stars request.
- Toggle (Ambient Sound): minimal custom toggle, 28pt track (`#24272F` / `#E8C888` when on), 20pt thumb (`#F0EDE6`). No color other than gold/charcoal.

### 3.5 Widget — visual only
Small square (min 150pt / 4×4 grid cell). `void-mid` bg.
- Companion drawn at center, stage-matched colors / alpha / scale (same logic as home, but rendered natively via `RemoteViews` gradient + scale/alpha in Kotlin `DecayWidgetProvider`).
- No text, no numbers, no branding overlay.
- For vibrant: full gold glow; for barely-holding-on: faint `#7A7488` ghost at small scale with slight tremble (`Math.random()` 0.72–1.0 scale for stage 4).

---

## 4. Component Details (for RN / Skia)

### CompanionForm (`src/components/companion-form.tsx`)
- Canvas / Skia `Canvas` 300×300pt, centered.
- 3 radial-gradient ellipses overlapping with soft `blendMode` (screen / soft-light) to form metaball.
- Reanimated `useSharedValue` for `scale`, `alpha`, `tremble`; `useAnimatedStyle` updates.
- At passing (dead): component unmounts / fades to 0 over 2s, then app routes to `/certificate`.

### Page / Prose layout (`src/components/page.tsx`)
- Full-screen dark container.
- `Page` accepts `title` (small 12pt `text-dim` label at top) and `subtitle` (14pt `text-warm` under).
- `Prose` block: max-width 640pt, centered horizontally, 32pt top/bottom padding.

### ListRow (`src/components/controls.tsx`)
- Touchable with 44pt min height.
- Left text: label + optional note in `text-dim`. Right: chevron or toggle.
- No arrow icons unless needed — settings uses simple text only.

---

## 5. Responsive / Accessibility
- All text ≥ 14pt; headings ≥ 18pt.
- Contrast ratios ≥ 4.5:1 for `text-warm` on `void-deep`; gold on dark ≈ 5.2:1.
- Screen-reader labels on every interactive element (`accessibilityLabel`, `accessibilityRole`).
- No hidden gestures required — presence timer is passive (no tap needed).
- Widget updates via `DecayWidgetModule.setStage()` + `refresh()`; no continuous polling; only updates on visit / boot / periodic work.

---

## 6. Deliverable Alignment
This spec maps 1:1 to the existing codebase at `C:\New folder\decay`:
- `plugins/with-decay-widget.js` → widget Kotlin + XML layout (`res/layout/decay_widget.xml` with `Bloom`/`Core` `ImageView`s)
- `src/lib/decay.ts` → stage logic / doorway values
- `src/lib/eulogy.ts` + `analysis.ts` → certificate generation
- `assets/images/` + `assets/audio/ambient.wav` → visual/audio assets
- `app.json` / `app.config.ts` → adaptive icon, scheme, orientation

No gamified colors, no cards, no mascot — only the breathing form, the dark, and the words.
