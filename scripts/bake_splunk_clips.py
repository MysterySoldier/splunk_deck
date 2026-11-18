#!/usr/bin/env python3
"""Bake Kokoro af_heart audio clips for Splunk Deck Exam Question Review (221 cards).
Each clip reads the question, then 'Answer,', then the answer.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("KOKORO_MODEL", "/home/mystery_soldier/kokoro-models/kokoro-v1.0.onnx")
VOICES_PATH = os.environ.get("KOKORO_VOICES", "/home/mystery_soldier/kokoro-models/voices-v1.0.bin")
CARDS_FILE = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "src", "data", "splunk_exam_flashcards.json"))
OUT_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "public", "audio"))
MANIFEST_FILE = os.path.join(OUT_DIR, "manifest.json")
VOICE = "af_heart"
SPEED = 1.0
LANG = "en-us"
WORKERS = 6

_kokoro = None

def _init():
    global _kokoro
    from kokoro_onnx import Kokoro
    _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

def normalize_splunk_tts(text: str) -> str:
    if not text:
        return ""
    t = text

    # Common punctuation and operators
    t = t.replace("|", " pipe ")
    t = t.replace("!=", " not equals ")
    t = t.replace("<=", " less than or equal to ")
    t = t.replace(">=", " greater than or equal to ")
    t = t.replace("==", " equals ")
    t = t.replace("=", " equals ")
    t = t.replace("->", " arrow ")
    t = t.replace("/", " slash ")
    t = t.replace("\\", " backslash ")
    t = t.replace("_time", " underscore time ")
    t = t.replace("_raw", " underscore raw ")
    t = t.replace("$$", " dollar dollar ")
    t = t.replace("$", " dollar ")
    t = t.replace("*", " asterisk ")
    t = t.replace("...", " dot dot dot ")
    t = t.replace("<", " less than ")
    t = t.replace(">", " greater than ")
    t = t.replace("&", " and ")
    t = t.replace("%", " percent ")
    t = t.replace("#", " hash ")
    t = t.replace("@", " at ")

    # Splunk command and function pronunciations
    t = re.sub(r"\bdedup\b", "dee dup", t, flags=re.IGNORECASE)
    t = re.sub(r"\bmvexpand\b", "M V expand", t, flags=re.IGNORECASE)
    t = re.sub(r"\beval\b", "ee-val", t, flags=re.IGNORECASE)
    t = re.sub(r"\bspath\b", "S path", t, flags=re.IGNORECASE)
    t = re.sub(r"\bfieldformat\b", "field format", t, flags=re.IGNORECASE)
    t = re.sub(r"\biplocation\b", "I P location", t, flags=re.IGNORECASE)
    t = re.sub(r"\binputlookup\b", "input lookup", t, flags=re.IGNORECASE)
    t = re.sub(r"\boutputlookup\b", "output lookup", t, flags=re.IGNORECASE)
    t = re.sub(r"\beventstats\b", "event stats", t, flags=re.IGNORECASE)
    t = re.sub(r"\bstreamstats\b", "stream stats", t, flags=re.IGNORECASE)
    t = re.sub(r"\btimechart\b", "time chart", t, flags=re.IGNORECASE)
    t = re.sub(r"\brangemap\b", "range map", t, flags=re.IGNORECASE)
    t = re.sub(r"\baddtotals\b", "add totals", t, flags=re.IGNORECASE)
    t = re.sub(r"\bfillnull\b", "fill null", t, flags=re.IGNORECASE)
    t = re.sub(r"\bchart\b", "chart", t, flags=re.IGNORECASE)
    t = re.sub(r"\bstats\b", "stats", t, flags=re.IGNORECASE)
    t = re.sub(r"\btop\b", "top", t, flags=re.IGNORECASE)
    t = re.sub(r"\brare\b", "rare", t, flags=re.IGNORECASE)
    t = re.sub(r"\btable\b", "table", t, flags=re.IGNORECASE)
    t = re.sub(r"\brex\b", "rex", t, flags=re.IGNORECASE)
    t = re.sub(r"\berex\b", "ee-rex", t, flags=re.IGNORECASE)

    # Word-based acronyms (pronounced as words)
    t = re.sub(r"\bPOST\b", "post", t)
    t = re.sub(r"\bGET\b", "get", t)
    t = re.sub(r"\bAND\b", "and", t)
    t = re.sub(r"\bOR\b", "or", t)
    t = re.sub(r"\bNOT\b", "not", t)
    t = re.sub(r"\bJSON\b", "J son", t)
    t = re.sub(r"\bSOC\b", "sock", t)
    t = re.sub(r"\bCRON\b", "cron", t)
    t = re.sub(r"\bVALUE\b", "value", t)
    t = re.sub(r"\bREJECT\b", "reject", t)

    # Abbreviations that are spelled out letter-by-letter
    t = re.sub(r"\bCIM\b", "C, I, M", t)
    t = re.sub(r"\bSPL\b", "S, P, L", t)
    t = re.sub(r"\bUI\b", "U, I", t)
    t = re.sub(r"\bIP\b", "I, P", t)
    t = re.sub(r"\bURI\b", "U, R, I", t)
    t = re.sub(r"\bURL\b", "U, R, L", t)
    t = re.sub(r"\bCSV\b", "C, S, V", t)
    t = re.sub(r"\bXML\b", "X, M, L", t)
    t = re.sub(r"\bJSESSIONID\b", "J session I D", t)
    t = re.sub(r"\bSD\b", "S, D", t)
    t = re.sub(r"\bFX\b", "F, X", t)
    t = re.sub(r"\bLAX\b", "L, A, X", t)
    t = re.sub(r"\bOK\b", "O, K", t)

    # Any remaining 2+ uppercase letter blocks: spell out letter by letter
    t = re.sub(r"\b([A-Z]{2,})\b", lambda m: ", ".join(list(m.group(1))), t)

    # Clean multiple spaces and ensure clean punctuation
    t = re.sub(r"\s+", " ", t).strip()
    return t

def _job(item):
    import soundfile as sf
    card_id = item["card"]
    filename = item["file"]
    spoken_text = item["spoken"]
    out_path = os.path.join(OUT_DIR, filename)

    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return (card_id, filename, "skipped", "")

    try:
        # Extra pause smoothing for letter commas
        text_for_kokoro = re.sub(r"\b([A-Z]) (?=[A-Z]\b)", r"\1, ", spoken_text)
        samples, rate = _kokoro.create(text_for_kokoro, voice=VOICE, speed=SPEED, lang=LANG)
        if len(samples) == 0:
            return (card_id, filename, "failed", "empty audio")

        with tempfile.TemporaryDirectory() as td:
            wav_path = os.path.join(td, "clip.wav")
            sf.write(wav_path, samples, rate)
            r = subprocess.run(
                [
                    "ffmpeg", "-y", "-v", "error", "-i", wav_path,
                    "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "24000", out_path,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if r.returncode != 0:
                return (card_id, filename, "failed", "ffmpeg: " + r.stderr.strip()[:200])

        if not os.path.exists(out_path) or os.path.getsize(out_path) <= 500:
            return (card_id, filename, "failed", "mp3 too small or missing")

        return (card_id, filename, "ok", "")
    except Exception as e:
        return (card_id, filename, "failed", str(e)[:200])

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(CARDS_FILE) as f:
        data = json.load(f)
    cards = data["cards"]

    jobs = []
    manifest = []
    for c in cards:
        card_id = c["card"]
        q_norm = normalize_splunk_tts(c["question"]).rstrip(" .?!")
        a_norm = normalize_splunk_tts(c["answer"]).rstrip(" .?!")
        # Format: each clip reads the question, then "Answer,", then the answer.
        spoken = f"{q_norm}? Answer, {a_norm}."
        filename = f"review-card-{card_id}.mp3"
        url = f"/splunk_deck/audio/{filename}"
        job_item = {
            "card": card_id,
            "exam_number": c.get("exam_number"),
            "topic": c.get("topic"),
            "file": filename,
            "url": url,
            "spoken": spoken,
        }
        jobs.append(job_item)
        manifest.append({
            "card": card_id,
            "exam_number": c.get("exam_number"),
            "topic": c.get("topic"),
            "file": filename,
            "url": url,
            "question": c["question"],
            "answer": c["answer"],
            "spoken": spoken,
        })

    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest written with {len(manifest)} items. Starting audio bake ({WORKERS} workers)...", flush=True)

    started = time.time()
    done = failed = skipped = 0
    failures = []

    with ProcessPoolExecutor(max_workers=WORKERS, initializer=_init) as ex:
        for i, (card_id, name, status, err) in enumerate(ex.map(_job, jobs), 1):
            if status == "ok":
                done += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed += 1
                failures.append(f"card {card_id} ({name}): {err}")

            if i % 20 == 0 or i == len(jobs):
                print(
                    f"[{i}/{len(jobs)}] ok={done} skipped={skipped} failed={failed} "
                    f"elapsed={time.time() - started:.0f}s",
                    flush=True,
                )

    print(
        f"DONE: ok={done} skipped={skipped} failed={failed} "
        f"elapsed={time.time() - started:.1f}s",
        flush=True,
    )
    if failures:
        print("FAILURES:")
        for fail in failures:
            print("  " + fail)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
