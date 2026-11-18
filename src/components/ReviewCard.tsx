import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Check, ArrowRight } from "lucide-react";
import type { ExamFlashcard } from "../data/types";
import { TOPIC_COLORS, slugify } from "../data/cards";

interface ReviewSessionProps {
  cards: ExamFlashcard[]; // Topic-grouped 221 cards
  onBack: () => void;
  isMastered: (id: number) => boolean;
  onMarkMastered: (id: number) => void;
}

const MUTE_STORAGE_KEY = "splunk_deck_review_muted";

export const ReviewSession: React.FC<ReviewSessionProps> = ({
  cards,
  onBack,
  isMastered,
  onMarkMastered,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentCard = cards[currentIndex];
  const topicColor = TOPIC_COLORS[currentCard?.topic || ""] || "#00B4D8";
  const topicSlug = slugify(currentCard?.topic || "");

  // Toggle mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      if (next && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return next;
    });
  };

  // Play audio clip with fallback
  const playCurrentClip = useCallback(() => {
    if (isMuted || !currentCard) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = `/splunk_deck/audio/review-card-${currentCard.card}.mp3`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      // Fallback to speechSynthesis if clip fails to load
      try {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(
            `${currentCard.question}. Answer: ${currentCard.answer}`,
          );
          utterance.rate = 1.0;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        }
      } catch {
        setIsPlaying(false);
      }
    };

    audio.play().catch(() => {
      setIsPlaying(false);
    });
  }, [currentCard, isMuted]);

  // Read aloud automatically when card appears
  useEffect(() => {
    playCurrentClip();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    };
  }, [currentIndex, playCurrentClip]);

  // Advance card: Left = Mark Mastered, Right = Next without mastering
  const handleAdvance = useCallback(
    (master: boolean) => {
      if (flyDirection || !currentCard) return;

      if (master) {
        onMarkMastered(currentCard.card);
      }

      setFlyDirection(master ? "left" : "right");

      setTimeout(() => {
        setFlyDirection(null);
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Loop back to start
          setCurrentIndex(0);
        }
      }, 200);
    },
    [flyDirection, currentCard, currentIndex, cards.length, onMarkMastered],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleAdvance(true); // Left = mark mastered
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleAdvance(false); // Right = next without mastering
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        playCurrentClip();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdvance, playCurrentClip]);

  if (!currentCard) return null;

  const mastered = isMastered(currentCard.card);
  const progressRatio = (currentIndex + 1) / cards.length;

  return (
    <div className="w-full max-w-md mx-auto min-h-[calc(100vh-65px)] flex flex-col justify-between px-4 py-3 select-none">
      {/* Top Header & Honest Count Line */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#00B4D8] hover:text-white transition py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <div className="text-xs font-bold text-white tracking-wide truncate max-w-[200px]">
              Exam Question Review
            </div>
            <div className="font-mono text-[10px] text-[#00B4D8] font-bold tracking-wider">
              KOKORO REAL-VOICE
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={playCurrentClip}
              className={`p-1.5 rounded-lg border text-xs transition ${
                isPlaying
                  ? "bg-[#00B4D8]/20 border-[#00B4D8] text-[#00B4D8] animate-pulse"
                  : "bg-[#1A2232] border-[#2A3446] text-slate-400 hover:text-white"
              }`}
              title="Replay Voice (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border text-xs transition ${
                isMuted
                  ? "bg-red-950/30 border-red-700/50 text-red-400"
                  : "bg-[#1A2232] border-[#2A3446] text-slate-300 hover:text-white"
              }`}
              title="Mute / Unmute (M)"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* The Honest Count Line Required by Tobias */}
        <div className="text-center bg-[#0E131E] border border-[#1A2232] py-1 px-2.5 rounded-xl text-[11px] font-mono text-[#8E9AA8]">
          221 of 289 — 20 multi-select held out (no answer recorded), 48 still missing.
        </div>
      </div>

      {/* Main Review Card (No Flip — Both Question and Answer Shown) */}
      <div className="relative flex-1 min-h-[380px] max-h-[480px] my-2 w-full">
        {/* Layered deck visual depth underneath */}
        <div className="absolute inset-x-3 -bottom-2 h-full rounded-[32px] bg-[#0E131E] border border-[#1A2232] pointer-events-none opacity-60" />
        <div className="absolute inset-x-1.5 -bottom-1 h-full rounded-[32px] bg-[#121724] border border-[#232D3F] pointer-events-none opacity-80" />

        <div
          className="relative w-full h-full rounded-[32px] bg-[#0F141F] border border-[#2A3446] p-6 flex flex-col justify-between shadow-2xl transition-transform duration-200 overflow-hidden"
          style={{
            transform: flyDirection === "left"
              ? "translateX(-120%) rotate(-10deg)"
              : flyDirection === "right"
              ? "translateX(120%) rotate(10deg)"
              : "none",
            boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Top Row: dots, topic, audio status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topicColor }} />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2A3446]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2A3446]" />
            </div>
            <div className="flex items-center gap-2">
              {mastered && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  <Check className="w-3 h-3" /> Mastered
                </span>
              )}
              <span
                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  backgroundColor: `${topicColor}20`,
                  color: topicColor,
                  border: `1px solid ${topicColor}40`,
                }}
              >
                {currentCard.topic}
              </span>
            </div>
          </div>

          {/* Card Body: Question & Answer (Scrollable if tall) */}
          <div className="my-auto py-2 flex flex-col gap-4 overflow-y-auto max-h-[300px]">
            {/* Question */}
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#FF6B00] font-bold mb-1.5">
                <span>|</span>
                <span>QUESTION (EXAM #{currentCard.exam_number})</span>
              </div>
              <p className="text-white text-base sm:text-lg font-medium leading-snug">
                {currentCard.question}
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#1F293A]"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-[#00B4D8] font-bold uppercase">
                Answer
              </span>
              <div className="flex-grow border-t border-[#1F293A]"></div>
            </div>

            {/* Answer */}
            <div className="bg-[#0B0E14] p-3.5 rounded-2xl border border-[#242F42]">
              {currentCard.answer.includes("=") || currentCard.answer.includes("|") || currentCard.answer.includes("stats") || currentCard.answer.includes("eval") ? (
                <p className="font-mono text-sm sm:text-base text-emerald-300 break-words">
                  <span className="text-[#FF6B00] font-bold mr-1">|</span> {currentCard.answer}
                </p>
              ) : (
                <p className="text-slate-100 text-sm sm:text-base font-semibold leading-relaxed">
                  {currentCard.answer}
                </p>
              )}
            </div>
          </div>

          {/* Card Footer Progress */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1C2433]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>card {currentIndex + 1} of {cards.length}</span>
              <div className="flex items-center gap-1.5">
                {isPlaying && (
                  <span className="flex items-center gap-1 text-[10px] text-[#00B4D8] font-bold">
                    <Volume2 className="w-3 h-3 animate-pulse" /> Playing
                  </span>
                )}
                <span className="text-[#00B4D8] font-bold">|</span>
                <span className="w-1.5 h-3 bg-[#00B4D8] inline-block animate-blink" />
              </div>
            </div>
            <div className="w-full h-1 bg-[#1C2433] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(2, progressRatio * 100)}%`,
                  backgroundColor: topicColor,
                }}
              />
            </div>
          </div>

          {/* TAP ZONES OVERLAY:
              EXPLICIT REQUIREMENT:
              LEFT side = mark mastered and advance!
              RIGHT side = next card without mastering!
              (Reverse of the flip-card edges — follow the user's words exactly.)
          */}
          <div className="absolute inset-0 z-30 flex">
            {/* Left 50%: Mark Mastered & Advance */}
            <button
              type="button"
              aria-label="Mark mastered and advance"
              onClick={() => handleAdvance(true)}
              className="w-1/2 h-full opacity-0 cursor-pointer focus:outline-none"
            />
            {/* Right 50%: Next card without mastering */}
            <button
              type="button"
              aria-label="Next card without mastering"
              onClick={() => handleAdvance(false)}
              className="w-1/2 h-full opacity-0 cursor-pointer focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Controls:
          LEFT: Mark Mastered (Splunk accent)
          RIGHT: Next Card without mastering
      */}
      <div className="w-full flex gap-3 pt-2 pb-2">
        {/* Left Button: Mark Mastered */}
        <button
          onClick={() => handleAdvance(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#0D2418] hover:bg-[#123322] border-2 border-[#FF6B00] active:scale-[0.98] transition flex flex-col items-center justify-center shadow-lg shadow-[#FF6B00]/20"
        >
          <div className="flex items-center gap-1.5 text-[#FF6B00] font-bold text-sm">
            <Check className="w-4 h-4" />
            <span>Mark Mastered</span>
          </div>
          <span className="text-[10px] text-[#FF6B00]/70 font-mono mt-0.5">tap left edge</span>
        </button>

        {/* Right Button: Next Card */}
        <button
          onClick={() => handleAdvance(false)}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#1A2232] hover:bg-[#253044] border-2 border-[#2A3446] active:scale-[0.98] transition flex flex-col items-center justify-center shadow-lg shadow-black/40"
        >
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-sm">
            <span>Next Card</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">tap right edge</span>
        </button>
      </div>
    </div>
  );
};
