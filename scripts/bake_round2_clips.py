#!/usr/bin/env python3
"""Bake Kokoro af_heart audio clips for Splunk Deck Round 2:
- Flash Cards (221 cards): flash-q-<card>.mp3 and flash-a-<card>.mp3
- Exam Study (141 cards): study-q-<n>.mp3 and study-a-<n>.mp3 (answer + 'Tip: ' + hint if hint exists)
Voice: Kokoro af_heart, 64k mono MP3, 24kHz.
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
EXAM_FILE = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "src", "data", "splunk_exam_flashcards.json"))
STUDY_FILE = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "src", "data", "splunk_flashcards.json"))
OUT_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "public", "audio"))

VOICE = "af_heart"
SPEED = 1.0
LANG = "en-us"
WORKERS = 7

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
    filename = item["file"]
    spoken_text = item["spoken"]
    out_path = os.path.join(OUT_DIR, filename)

    if os.path.exists(out_path) and os.path.getsize(out_path) > 800:
        return (item["id"], filename, "skipped", "")

    try:
        text_for_kokoro = re.sub(r"\b([A-Z]) (?=[A-Z]\b)", r"\1, ", spoken_text)
        samples, rate = _kokoro.create(text_for_kokoro, voice=VOICE, speed=SPEED, lang=LANG)
        if len(samples) == 0:
            return (item["id"], filename, "failed", "empty audio")

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
                return (item["id"], filename, "failed", "ffmpeg: " + r.stderr.strip()[:200])

        if not os.path.exists(out_path) or os.path.getsize(out_path) <= 400:
            return (item["id"], filename, "failed", "mp3 too small or missing")

        return (item["id"], filename, "ok", "")
    except Exception as e:
        return (item["id"], filename, "failed", str(e)[:200])

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    with open(EXAM_FILE) as f:
        exam_cards = json.load(f)["cards"]

    with open(STUDY_FILE) as f:
        study_cards = json.load(f)["cards"]

    jobs = []
    flash_manifest = []
    study_manifest = []

    # 1. Flash Cards: 221 cards -> 442 clips
    # flash-q-<card>.mp3 and flash-a-<card>.mp3
    for c in exam_cards:
        cid = c["card"]
        q_norm = normalize_splunk_tts(c["question"]).rstrip(" .?!")
        a_norm = normalize_splunk_tts(c["answer"]).rstrip(" .?!")

        q_spoken = f"{q_norm}."
        a_spoken = f"{a_norm}."

        q_file = f"flash-q-{cid}.mp3"
        a_file = f"flash-a-{cid}.mp3"

        jobs.append({
            "id": f"flash-q-{cid}",
            "file": q_file,
            "spoken": q_spoken,
        })
        jobs.append({
            "id": f"flash-a-{cid}",
            "file": a_file,
            "spoken": a_spoken,
        })

        flash_manifest.append({
            "card": cid,
            "exam_number": c.get("exam_number"),
            "topic": c.get("topic"),
            "question_file": q_file,
            "question_url": f"/splunk_deck/audio/{q_file}",
            "question_spoken": q_spoken,
            "answer_file": a_file,
            "answer_url": f"/splunk_deck/audio/{a_file}",
            "answer_spoken": a_spoken,
        })

    # 2. Exam Study: 141 cards -> 282 clips
    # study-q-<n>.mp3 and study-a-<n>.mp3
    for c in study_cards:
        cid = c["card"]
        q_norm = normalize_splunk_tts(c["question"]).rstrip(" .?!")
        a_norm = normalize_splunk_tts(c["answer"]).rstrip(" .?!")

        q_spoken = f"{q_norm}."
        if c.get("hint"):
            hint_norm = normalize_splunk_tts(c["hint"]).rstrip(" .?!")
            a_spoken = f"{a_norm}. Tip: {hint_norm}."
        else:
            a_spoken = f"{a_norm}."

        q_file = f"study-q-{cid}.mp3"
        a_file = f"study-a-{cid}.mp3"

        jobs.append({
            "id": f"study-q-{cid}",
            "file": q_file,
            "spoken": q_spoken,
        })
        jobs.append({
            "id": f"study-a-{cid}",
            "file": a_file,
            "spoken": a_spoken,
        })

        study_manifest.append({
            "card": cid,
            "topic": c.get("topic"),
            "question_file": q_file,
            "question_url": f"/splunk_deck/audio/{q_file}",
            "question_spoken": q_spoken,
            "answer_file": a_file,
            "answer_url": f"/splunk_deck/audio/{a_file}",
            "answer_spoken": a_spoken,
            "hint": c.get("hint"),
        })

    with open(os.path.join(OUT_DIR, "manifest-flash.json"), "w") as f:
        json.dump(flash_manifest, f, indent=2)

    with open(os.path.join(OUT_DIR, "manifest-study.json"), "w") as f:
        json.dump(study_manifest, f, indent=2)

    print(f"Jobs total: {len(jobs)} (Flash: {len(flash_manifest)*2}, Study: {len(study_manifest)*2}). Workers: {WORKERS}")

    started = time.time()
    done = failed = skipped = 0
    failures = []

    with ProcessPoolExecutor(max_workers=WORKERS, initializer=_init) as ex:
        for i, (job_id, name, status, err) in enumerate(ex.map(_job, jobs), 1):
            if status == "ok":
                done += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed += 1
                failures.append(f"{job_id} ({name}): {err}")

            if i % 50 == 0 or i == len(jobs):
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
