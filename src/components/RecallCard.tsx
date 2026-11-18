import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, Lightbulb, Check, AlertCircle, ArrowRight } from "lucide-react";
import type { CardItem } from "./FlipCard";

interface RecallSessionProps {
  deckTitle: string;
  topicSlug: string;
  deckColor: string;
  cards: CardItem[];
  onBack: () => void;
  onMarkMastered: (id: number) => void;
}

export const RecallSession: React.FC<RecallSessionProps> = ({
  deckTitle,
  topicSlug,
  deckColor,
  cards,
  onBack,
  onMarkMastered,
}) => {
  const [queue, setQueue] = useState<CardItem[]>(cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [completed, setCompleted] = useState<boolean>(cards.length === 0);

  const inputRef = useRef<HTMLInputElement>(null);
  const initialTotal = useMemo(() => cards.length, [cards]);
  const currentCard = queue[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, queue]);

  const cleanForCompare = (s: string) => {
    return s
      .toLowerCase()
      .trim()
      .replace(/[.;,`'"]+$/g, "")
      .replace(/\s+/g, " ");
  };

  const handleVerify = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!currentCard || status !== "idle") return;

      const userClean = cleanForCompare(inputVal);
      const answerClean = cleanForCompare(currentCard.answer);

      if (userClean === answerClean) {
        setStatus("correct");
        onMarkMastered(currentCard.id);
        setTimeout(() => {
          const nextQueue = queue.filter((_, idx) => idx !== currentIndex);
          if (nextQueue.length === 0) {
            setCompleted(true);
          } else {
            setQueue(nextQueue);
            setCurrentIndex((prev) => (prev >= nextQueue.length ? 0 : prev));
          }
          setInputVal("");
          setShowHint(false);
          setStatus("idle");
        }, 800);
      } else {
        setStatus("incorrect");
      }
    },
    [currentCard, status, inputVal, onMarkMastered, queue, currentIndex],
  );

  const handleSkipOrContinue = useCallback(() => {
    if (!currentCard) return;
    const nextQueue = [...queue];
    const [moved] = nextQueue.splice(currentIndex, 1);
    nextQueue.push(moved);
    setQueue(nextQueue);
    setCurrentIndex((prev) => (prev >= nextQueue.length ? 0 : prev));
    setInputVal("");
    setShowHint(false);
    setStatus("idle");
  }, [currentCard, queue, currentIndex]);

  if (completed || !currentCard) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center p-6 text-center bg-[#0B0E14] select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-5">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Recall Mastered!</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          All recall cards in <span className="text-white font-semibold">{deckTitle}</span> have been answered correctly.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#FF7A00] text-white font-bold text-sm shadow-xl shadow-[#FF6B00]/20 transition"
        >
          Return to Decks
        </button>
      </main>
    );
  }

  const hintPrefix = currentCard.answer.slice(0, 3);
  const totalChars = currentCard.answer.length;
  const progressRatio = Math.max(0, (initialTotal - queue.length) / Math.max(1, initialTotal));

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#0B0E14] select-none">
      <div className="w-full max-w-lg mx-auto flex-1 min-h-0 flex flex-col justify-between px-4 pt-2 pb-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {/* Header: shrink-0 */}
        <div className="flex items-center justify-between shrink-0 py-1 mb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B00] hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-white tracking-wide truncate max-w-[170px]">
            {deckTitle}
          </div>
          <div className="font-mono text-[10px] text-[#FF6B00] font-bold tracking-wider">
            TERMINAL RECALL
          </div>
        </div>
        <div className="w-10 text-right font-mono text-[11px] text-slate-400">
          {currentIndex + 1}/{queue.length}
        </div>
      </div>

      {/* Main Recall Card: flex-1 min-h-0 relative */}
      <div className="relative flex-1 min-h-0 w-full my-1 rounded-[32px] bg-[#0F141F] border border-[#2A3446] p-5 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Top prompt: shrink-0 */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#8E9AA8]">
            <span className="text-[#FF6B00] font-bold">admin@splunk</span>
            <span>:~/{topicSlug}</span>
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

        {/* Question Prompt: flex-1 min-h-0 overflow-y-auto */}
        <div className="flex-1 min-h-0 my-2 py-1 flex flex-col justify-center overflow-y-auto">
          <div className="text-white text-sm sm:text-base font-medium leading-relaxed mb-3">
            {currentCard.question}
          </div>

          {/* Hint Section */}
          {showHint ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Hint:</span> Starts with <strong className="text-white">"{hintPrefix}"</strong> ({totalChars} characters)
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-mono mb-3 opacity-90 hover:opacity-100 transition self-start"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Show Hint (No Penalty)</span>
            </button>
          )}

          {/* User Input Form */}
          <form onSubmit={handleVerify} className="flex flex-col gap-2">
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono font-bold text-[#FF6B00] text-sm">
                |
              </span>
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="type answer..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={status !== "idle"}
                className={`w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#0B0E14] border font-mono text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                  status === "correct"
                    ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                    : status === "incorrect"
                    ? "border-red-500 bg-red-950/20 text-red-300"
                    : "border-[#2A3446] focus:border-[#FF6B00]"
                }`}
              />
            </div>

            {status === "incorrect" && (
              <div className="mt-1 p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs flex flex-col gap-1 text-red-200">
                <div className="flex items-center gap-1.5 font-bold text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Not quite! Expected answer:</span>
                </div>
                <div className="font-mono bg-black/40 p-2 rounded-lg text-emerald-300 break-words text-xs">
                  {currentCard.answer}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Card Footer Progress: shrink-0 */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1C2433] shrink-0">
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

      {/* Bottom Action Controls: shrink-0 */}
      <div className="w-full shrink-0 flex gap-3 pt-1 pb-1">
        {status === "idle" ? (
          <>
            <button
              type="button"
              onClick={handleSkipOrContinue}
              className="py-3 px-4 rounded-2xl bg-[#1A2232] hover:bg-[#253044] border border-[#2A3446] text-slate-400 hover:text-white font-bold text-xs transition"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={!inputVal.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
            >
              <span>Submit Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSkipOrContinue}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#FF7A00] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
          >
            <span>Continue Next Card</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </main>
);
};
