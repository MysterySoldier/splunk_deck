# Splunk Deck data

Built 2026-11-17 from Tobias's own study material. Do not invent questions;
the files below are the whole bank.

NO MULTIPLE CHOICE (Tobias 2026-11-17 2041 EST). No quiz with options, no
distractors, anywhere in the app.

## Three sections (Tobias 2026-11-17 2044 EST)

Home shows three sections, each with its count:

1. **Flash Cards** — `splunk_exam_flashcards.json`, 221 flip cards from the
   Power User exam bank (question front, just the correct answer on the back).
   Decks by topic (12 topics). Recall mode for short answers (163 cards,
   answer 60 chars or less): type the answer, hint = first 3 chars + total
   length, hint does not penalise. Compare typed answers case-insensitively,
   ignoring trailing punctuation.
2. **Exam Question Review** — the same 221 questions as a read-through list,
   grouped by topic, question + answer only. No flipping, no typing, just
   read. Show the honest count line at the top: "221 of 289 — 20 multi-select
   held out (no answer recorded), 48 still missing."
3. **Exam Study** — `splunk_flashcards.json`, 141 Q&A pairs from
   `Exam_study.xlsx` (uploaded 2026-11-17), his own sheet. Flip cards with
   his hints on the back (15 cards have a hint). Decks by topic (10 topics).
   Recall mode for short answers (114 cards). This section is separate from
   the exam bank — do not mix the two banks.

## Files

- `splunk_exam_flashcards.json` — 221 cards, the Flash Cards + Review bank.
- `splunk_exam_questions.json` — the 241 multiple-choice source questions
  (ExamEdge screenshots). Kept as the source record only; the app never
  shows options.
- `splunk_flashcards.json` — 141 cards, the Exam Study bank.

## Counts — be honest, do not round up

- The full ExamEdge Study Mode set is **289** questions (screenshots say
  "Study Mode, 289 Questions"; Tobias said 288, same set, one off).
- In hand: 241 unique. Missing 48 (numbers 11, 54–62, 97, 101–111, 117,
  131–140, 145, 148, 154, 164, 191–200, 286).
- Of the 241, 20 are multi-select with no recorded answer — held out of
  both Flash Cards and Review. So both sections show 221.
- His spelling in the sheet is kept as-is (scetion, mispelled, etc.).

## Flags — check with Tobias

- Exam Study rows 112 vs 153: same question ("correct syntax for the
  transaction command?"). Row 112's answer is about CIM (looks mixed up);
  row 153's SPL answer looks right. Row 112 carries `needs_check`.
- Exam Study rows 152 vs 156: same question ("syntax to represent an
  argument in a macro definition?"). Row 152's answer is a fillnull command
  (looks mixed up); row 156 ($argument$) looks right. Row 152 carries
  `needs_check`.

## Linux Deck rules to copy (from deck.mysterylabs.dev playthrough 2026-11-14)

- Home shows sections/decks with counts + Review All. No sign-in, no
  settings, no search, no stats screen.
- Flashcards: flip, "Know it" (green, marks mastered) / "Don't know" (amber,
  re-queues to the end). May press without flipping. Card shows "card N of M"
  + thin progress bar.
- Mastery is shared across modes at deck level. A fresh session shows ONLY
  unmastered cards, shuffled. Missed / Don't know re-queues to the end.
  Session ends when every card in it is answered right once.
- No timer, no streak, no numeric score, no percentage, no pass/fail.
  Per-answer progress saves immediately.
- Phone-first: fit the phone screen without scrolling as much as possible.

## Later, not now

- 35 extra questions exist in `~/workspace/goals/splunk-learning/files/
  test-mode-100-video/answers.json` (Test Mode video, not in the 241) — but
  Tobias found 10 of the 100 test-mode answers wrong, so do NOT add them
  until their answers are checked.
