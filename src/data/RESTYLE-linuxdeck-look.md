# Splunk Deck restyle — look like Linux Deck (Tobias 2026-11-17 2054 EST)

Tobias: "Hate the look." / "Doesn't look like a flash cards."
The current card screen (see `splunkdeck-now.jpg` in this folder) is a flat
box with a huge empty black gap, a lone Flip button, and the Know/Don't know
buttons hidden behind the app's bottom toolbar. It must become Linux Deck's
3D Flip Deck. Style only — content, counts, banks, and rules do not change.

## Reference

- `linuxdeck-card-front.jpg` — Linux Deck card, description side up.
- `linuxdeck-card-back.jpg` — same card flipped, command side up.
- `splunkdeck-now.jpg` — Splunk Deck now (the bad look). Note the buttons
  cut off behind the bottom bar: the layout MUST keep all controls above the
  bottom safe area, whole screen fits without scrolling.
- Linux Deck source (copy the styling, not the data):
  `~/workspace/projects/LinuxDeck/web/src/components/deck/FlipCard.tsx`,
  `CardFaces.tsx`, `DeckRows.tsx`, and the `term` palette in
  `~/workspace/projects/LinuxDeck/web/tailwind.config.ts`.

## Palette + type — SPLUNK THEME (Tobias 2057 EST)

Layout and shapes stay Linux Deck (see below), but do NOT copy Linux
Deck's exact colors and font. Use a Splunk theme instead:

- Dark Splunk look: near-black background, dark panels, white text.
- Accent: Splunk brand orange/coral for the primary accent (buttons,
  active pills, progress, highlights) with a teal secondary where a second
  accent is needed — NOT Linux Deck's lime green `#8CE564`.
- "Don't know" stays a warm amber; "Know it" uses the Splunk accent.
- Font: clean modern sans for UI text, labels, and card text. Monospace
  ONLY for SPL code, commands, and search strings (not for everything
  like Linux Deck's JetBrains Mono).
- Splunk touches welcome: the terminal `$` prompt may become a `|` pipe
  prompt (SPL is all pipes), and the home prompt line may read
  `admin@splunk` instead of `root@deck`. Keep it subtle, not gimmicky.
- Dark theme everywhere: home, deck lists, all three sections,
  review list, recall. No light theme, no flat grey boxes.

## The flashcard screen (copy Linux Deck exactly)

- Header: green `< Back`, deck name centered, `3D FLIP DECK` subtitle under
  it, mode icons top right (flashcard / recall).
- One BIG rounded card (`rounded-[32px]`, green lime border, stacked-deck
  edge layers visible underneath) filling most of the screen.
- Card top row: three dots top left (first filled in deck lime), context
  path top right in dim mono (Splunk equivalent of `~/files`, e.g. the
  topic slug).
- Card center: the question or answer in large type, centered. SPL/commands
  in mono with a green `$` prefix. Flipped side shows a lime topic pill at
  top (like `FILE & DIR MANAGEMENT`) and `TAP TO REVEAL` under the text.
- Card footer inside the card: `card N of M` in dim mono, thin progress bar,
  `$` + blinking lime cursor block.
- Real 3D flip on tap (rotateY, perspective ~1400). Tap zones on ONE overlay
  outside the flip container so left stays left when flipped: left 20%
  Don't know, center 60% flip, right 20% Know it. Card flies left (Don't
  know) / right (Know it) with a `REVIEW` amber / `MASTERED` lime stamp.
- Below the card: `DIRECTION` segmented control — Splunk wording:
  `Q → A` / `A → Q` / `Mix`. Active pill lime.
- Bottom: two big rounded buttons, `↩ Don't know` amber on dark amber,
  `✓ Know it` lime on dark green, with `tap left edge` / `tap right edge`
  hints under them. MUST sit fully above the bottom safe area — never
  hidden behind any app toolbar.
- Keep: pressable without flipping, re-queue, session = unmastered only,
  mastery shared across modes, saves immediately, no score/timer.

## Home screen (Tobias 2056 EST — see `linuxdeck-home-list.jpg` + `linuxdeck-home-expanded.jpg`)

Copy the Linux Deck home layout, adapted to three sections:

- Top: mono prompt line `root@deck :~#` + blinking lime cursor block.
  NO audio toggle (Splunk Deck has no audio clips — do not add a fake one).
- Big title `SplunkDeck`, then the multi-color segmented bar, then the
  counts line in dim mono (e.g. `221 questions · 12 decks · 0 mastered`).
- Hero card `Review All Cards` (`./review --all`, lime `START →` button,
  big mastery % ring, `0 of N mastered`). One per section, or one hero for
  the section being viewed — keep the three sections (Flash Cards,
  Exam Question Review, Exam Study) with their counts 221 / 221 / 141.
- `$ ls ~/decks (click deck to expand study modes)` line above the list.
- Deck rows: dark charcoal rounded rows, colored left edge + icon tile per
  deck (each deck its own accent color like Linux Deck), name, `0/N` count,
  thin progress bar in the deck color, chevron. Tap expands in place.
- Expanded deck shows `Select Study Mode:` + mode cards. ONLY TWO MODES:
  Mode 1 Flashcard Deck (`3D flip card stack`) and Recall (`type the
  answer` — Splunk's version of Terminal Recall). DO NOT copy Linux Deck's
  Mode 2 Multiple Choice — Splunk Deck has NO multiple choice anywhere.
- Exam Question Review list uses the same dark terminal styling (mono
  questions, lime answers), not flat grey boxes.
- Recall screen: same terminal styling, `$` prefixed mono input, hint box
  amber (`💡 Hint: Starts with ... (N chars)`), green/red verify boxes.
- Home counts/rings are fine (Tobias likes scoreboards). Sessions still
  have no score, no timer, no pass/fail.
