import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Check, Undo2, ArrowLeft, Hand, AlertTriangle } from "lucide-react";
import type { CardDirection } from "../data/types";

export interface CardItem {
  id: number;
  question: string;
  answer: string;
  topic: string;
  color?: string;
  hint?: string | null;
  needs_check?: boolean;
}

interface FlipCardSessionProps {
  deckTitle: string;
  topicSlug: string;
  deckColor: string;
  cards: CardItem[];
  onBack: () => void;
  onMarkMastered: (id: number) => void;
  onUnmarkMastered?: (id: number) => void;
}

export const FlipCardSession: React.FC<FlipCardSessionProps> = ({
  deckTitle,
  topicSlug,
  deckColor,
  cards,
  onBack,
  onMarkMastered,
}) => {
  // Session queue: unmastered cards passed in. Re-queues missed cards to end.
  const [queue, setQueue] = useState<CardItem[]>(cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<CardDirection>("q_to_a");
  const [flipped, setFlipped] = useState<boolean>(false);
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | null>(null);
  const [completed, setCompleted] = useState<boolean>(cards.length === 0);

  const initialTotal = useMemo(() => cards.length, [cards]);
  const currentCard = queue[currentIndex];

  // Randomize direction if mix
  const isQuestionFront = useMemo(() => {
    if (direction === "q_to_a") return true;
    if (direction === "a_to_q") return false;
    return Math.random() > 0.5;
  }, [direction, currentIndex, queue]);

  const flipCard = useCallback(() => {
    if (flyDirection) return;
    setFlipped((prev) => !prev);
  }, [flyDirection]);

  const handleNext = useCallback(
    (knowIt: boolean) => {
      if (flyDirection || !currentCard) return;

      setFlyDirection(knowIt ? "right" : "left");

      setTimeout(() => {
        if (knowIt) {
          onMarkMastered(currentCard.id);
          const nextQueue = queue.filter((_, idx) => idx !== currentIndex);
          if (nextQueue.length === 0) {
            setCompleted(true);
          } else {
            setQueue(nextQueue);
            setCurrentIndex((prev) => (prev >= nextQueue.length ? 0 : prev));
          }
        } else {
          // Re-queue to end
          const nextQueue = [...queue];
          const [moved] = nextQueue.splice(currentIndex, 1);
          nextQueue.push(moved);
          setQueue(nextQueue);
          setCurrentIndex((prev) => (prev >= nextQueue.length ? 0 : prev));
        }

        setFlipped(false);
        setFlyDirection(null);
      }, 230);
    },
    [flyDirection, currentCard, queue, currentIndex, onMarkMastered],
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flipCard();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNext(false); // Don't know
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext(true); // Know it
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, handleNext]);

  if (completed || !currentCard) {
    return (
      <div className="w-full max-w-md mx-auto min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-5">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Deck Mastered!</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          All cards in <span className="text-white font-semibold">{deckTitle}</span> have been completed for this session.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#FF7A00] text-white font-bold text-sm shadow-xl shadow-[#FF6B00]/20 transition"
        >
          Return to Decks
        </button>
      </div>
    );
  }

  const frontText = isQuestionFront ? currentCard.question : currentCard.answer;
  const backText = isQuestionFront ? currentCard.answer : currentCard.question;
  const frontLabel = isQuestionFront ? "QUESTION" : "ANSWER";
  const backLabel = isQuestionFront ? "ANSWER" : "QUESTION";

  const totalInSession = initialTotal;
  const remainingInSession = queue.length;
  const progressRatio = Math.max(0, (totalInSession - remainingInSession) / Math.max(1, totalInSession));

  return (
    <div className="w-full max-w-md mx-auto min-h-[calc(100vh-65px)] flex flex-col justify-between px-4 py-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B00] hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-white tracking-wide truncate max-w-[200px]">
            {deckTitle}
          </div>
          <div className="font-mono text-[10px] text-[#00B4D8] font-bold tracking-wider">
            3D FLIP DECK
          </div>
        </div>
        <div className="w-10 text-right font-mono text-[11px] text-slate-400">
          {currentIndex + 1}/{queue.length}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative flex-1 min-h-[360px] max-h-[460px] my-2 w-full">
        {/* Layered deck visual depth underneath */}
        <div className="absolute inset-x-3 -bottom-2 h-full rounded-[32px] bg-[#0E131E] border border-[#1A2232] pointer-events-none opacity-60" />
        <div className="absolute inset-x-1.5 -bottom-1 h-full rounded-[32px] bg-[#121724] border border-[#232D3F] pointer-events-none opacity-80" />

        {/* Moving / Flipping Card */}
        <div
          className="relative w-full h-full rounded-[32px] transition-transform duration-200"
          style={{
            transform: flyDirection === "left"
              ? "translateX(-120%) rotate(-12deg)"
              : flyDirection === "right"
              ? "translateX(120%) rotate(12deg)"
              : "none",
            perspective: "1400px",
          }}
        >
          <div
            className="preserve-3d relative w-full h-full rounded-[32px]"
            style={{
              transform: `rotateY(${flipped ? 180 : 0}deg)`,
              transition: "transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1)",
            }}
          >
            {/* FRONT FACE */}
            <div
              className="backface-hidden absolute inset-0 rounded-[32px] bg-[#0F141F] border border-[#2A3446] p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
              style={{
                boxShadow: `0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              {/* Card Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deckColor }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A3446]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A3446]" />
                </div>
                <div className="flex items-center gap-2">
                  {currentCard.needs_check && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      <AlertTriangle className="w-3 h-3" /> check
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-[#8E9AA8]">
                    admin@splunk:~/{topicSlug}
                  </span>
                </div>
              </div>

              {/* Card Center Content */}
              <div className="my-auto flex flex-col items-center justify-center text-center px-1">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wider mb-3"
                  style={{
                    backgroundColor: `${deckColor}20`,
                    color: deckColor,
                    border: `1px solid ${deckColor}40`,
                  }}
                >
                  {frontLabel}
                </span>

                <div className="text-white font-medium text-base sm:text-lg leading-relaxed max-h-[220px] overflow-y-auto">
                  {frontText.includes("=") || frontText.includes("|") || frontText.includes("stats") || frontText.includes("eval") ? (
                    <p className="font-mono text-sm sm:text-base text-slate-100 bg-[#0B0E14] p-3 rounded-xl border border-[#242F42] text-left break-words">
                      <span className="text-[#FF6B00] font-bold mr-1">|</span> {frontText}
                    </p>
                  ) : (
                    <p className="break-words">{frontText}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#8E9AA8]/80 font-medium">
                  <Hand className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Tap center to flip</span>
                </div>
              </div>

              {/* Card Bottom Progress */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1C2433]">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>card {currentIndex + 1} of {queue.length}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#FF6B00] font-bold">|</span>
                    <span className="w-1.5 h-3 bg-[#FF6B00] inline-block animate-blink" />
                  </div>
                </div>
                <div className="w-full h-1 bg-[#1C2433] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(5, progressRatio * 100)}%`,
                      backgroundColor: deckColor,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="backface-hidden absolute inset-0 rounded-[32px] bg-[#141A28] border p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
              style={{
                transform: "rotateY(180deg)",
                borderColor: `${deckColor}60`,
                boxShadow: `0 0 30px ${deckColor}25`,
              }}
            >
              {/* Back Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deckColor }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deckColor }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A3446]" />
                </div>
                <span
                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: `${deckColor}20`,
                    color: deckColor,
                    border: `1px solid ${deckColor}40`,
                  }}
                >
                  {currentCard.topic}
                </span>
              </div>

              {/* Back Center Content */}
              <div className="my-auto flex flex-col items-center justify-center text-center px-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">
                  {backLabel}
                </span>

                <div className="text-white font-medium text-base sm:text-lg leading-relaxed max-h-[200px] overflow-y-auto">
                  {backText.includes("=") || backText.includes("|") || backText.includes("stats") || backText.includes("eval") ? (
                    <p className="font-mono text-sm sm:text-base text-emerald-300 bg-[#0B0E14] p-3 rounded-xl border border-[#242F42] text-left break-words">
                      <span className="text-[#FF6B00] font-bold mr-1">|</span> {backText}
                    </p>
                  ) : (
                    <p className="text-slate-100 font-semibold break-words">{backText}</p>
                  )}
                </div>

                {/* Hint if present */}
                {currentCard.hint && (
                  <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono max-w-xs text-left">
                    <span className="font-bold">Hint:</span> {currentCard.hint}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Hand className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Tap center to flip back</span>
                </div>
              </div>

              {/* Back Bottom Progress */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1F2739]">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>card {currentIndex + 1} of {queue.length}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#00B4D8] font-bold">|</span>
                    <span className="w-1.5 h-3 bg-[#00B4D8] inline-block animate-blink" />
                  </div>
                </div>
                <div className="w-full h-1 bg-[#1F2739] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(5, progressRatio * 100)}%`,
                      backgroundColor: deckColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3-ZONE TAP OVERLAY (outside flip container so left stays left!) */}
          <div className="absolute inset-0 z-30 flex">
            {/* Left 20%: Don't know */}
            <button
              type="button"
              aria-label="Don't know"
              onClick={() => handleNext(false)}
              className="w-1/5 h-full opacity-0 cursor-pointer focus:outline-none"
            />
            {/* Center 60%: Flip */}
            <button
              type="button"
              aria-label="Flip card"
              onClick={flipCard}
              className="w-3/5 h-full opacity-0 cursor-pointer focus:outline-none"
            />
            {/* Right 20%: Know it */}
            <button
              type="button"
              aria-label="Know it"
              onClick={() => handleNext(true)}
              className="w-1/5 h-full opacity-0 cursor-pointer focus:outline-none"
            />
          </div>

          {/* Floating Stamps during fly-off */}
          {flyDirection === "left" && (
            <div className="absolute top-6 left-6 z-40 px-3 py-1.5 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-amber-400 font-mono font-black text-sm tracking-wider flex items-center gap-1.5 shadow-2xl rotate-[-12deg] pointer-events-none">
              <Undo2 className="w-4 h-4" />
              <span>REVIEW</span>
            </div>
          )}
          {flyDirection === "right" && (
            <div className="absolute top-6 right-6 z-40 px-3 py-1.5 rounded-xl bg-emerald-950/90 border-2 border-[#FF6B00] text-[#FF6B00] font-mono font-black text-sm tracking-wider flex items-center gap-1.5 shadow-2xl rotate-[12deg] pointer-events-none">
              <Check className="w-4 h-4" />
              <span>MASTERED</span>
            </div>
          )}
        </div>
      </div>

      {/* Direction Switcher */}
      <div className="my-2 flex items-center justify-center gap-2">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          DIRECTION:
        </span>
        <div className="flex bg-[#121722] p-1 rounded-xl border border-[#242F42]">
          <button
            onClick={() => setDirection("q_to_a")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              direction === "q_to_a"
                ? "bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Q → A
          </button>
          <button
            onClick={() => setDirection("a_to_q")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              direction === "a_to_q"
                ? "bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            A → Q
          </button>
          <button
            onClick={() => setDirection("mix")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              direction === "mix"
                ? "bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mix
          </button>
        </div>
      </div>

      {/* Bottom Action Buttons (Above Safe Area) */}
      <div className="w-full flex gap-3 pt-1 pb-2">
        {/* Don't Know Button */}
        <button
          onClick={() => handleNext(false)}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#2A1D0E] hover:bg-[#3D2812] border-2 border-amber-600/60 active:scale-[0.98] transition flex flex-col items-center justify-center shadow-lg shadow-amber-950/40"
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
            <Undo2 className="w-4 h-4" />
            <span>Don't know</span>
          </div>
          <span className="text-[10px] text-amber-500/70 font-mono mt-0.5">tap left edge</span>
        </button>

        {/* Know It Button */}
        <button
          onClick={() => handleNext(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#0D2418] hover:bg-[#123322] border-2 border-[#FF6B00] active:scale-[0.98] transition flex flex-col items-center justify-center shadow-lg shadow-[#FF6B00]/20"
        >
          <div className="flex items-center gap-1.5 text-[#FF6B00] font-bold text-sm">
            <Check className="w-4 h-4" />
            <span>Know it</span>
          </div>
          <span className="text-[10px] text-[#FF6B00]/70 font-mono mt-0.5">tap right edge</span>
        </button>
      </div>
    </div>
  );
};
