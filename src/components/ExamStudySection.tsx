import React, { useState } from "react";
import { ArrowLeft, ChevronDown, Play, Sparkles, Terminal, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import type { StudyFlashcard, TopicDeckInfo, MasteredSide } from "../data/types";
import { STUDY_TOPIC_DECKS, shuffleArray } from "../data/cards";
import { FlipCardSession, type CardItem } from "./FlipCard";
import { RecallSession } from "./RecallCard";

interface ExamStudySectionProps {
  cards: StudyFlashcard[];
  onBack: () => void;
  isMastered: (id: number) => boolean;
  onMarkMastered: (id: number) => void;
  onResetBankMastery: (bank: "study", topic?: string, ids?: number[]) => void;
  onSessionChange?: (inSession: boolean) => void;
  masteredSide?: MasteredSide;
}

export const ExamStudySection: React.FC<ExamStudySectionProps> = ({
  cards,
  onBack,
  isMastered,
  onMarkMastered,
  onResetBankMastery,
  onSessionChange,
  masteredSide,
}) => {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    mode: "flashcard" | "recall";
    deckTitle: string;
    topicSlug: string;
    deckColor: string;
    cards: CardItem[];
  } | null>(null);

  React.useEffect(() => {
    onSessionChange?.(Boolean(activeSession));
  }, [activeSession, onSessionChange]);

  const totalCards = cards.length;
  const totalMastered = cards.filter((c) => isMastered(c.card)).length;
  const overallPercent = Math.round((totalMastered / Math.max(1, totalCards)) * 100);

  // If in active session, render FlipCardSession or RecallSession
  if (activeSession) {
    if (activeSession.mode === "flashcard") {
      return (
        <FlipCardSession
          deckTitle={activeSession.deckTitle}
          topicSlug={activeSession.topicSlug}
          deckColor={activeSession.deckColor}
          bankType="study"
          cards={activeSession.cards}
          masteredSide={masteredSide}
          onBack={() => setActiveSession(null)}
          onMarkMastered={onMarkMastered}
        />
      );
    } else {
      return (
        <RecallSession
          deckTitle={activeSession.deckTitle}
          topicSlug={activeSession.topicSlug}
          deckColor={activeSession.deckColor}
          cards={activeSession.cards}
          onBack={() => setActiveSession(null)}
          onMarkMastered={onMarkMastered}
        />
      );
    }
  }

  // Start Review All
  const startReviewAll = (mode: "flashcard" | "recall" = "flashcard") => {
    let pool = cards;
    if (mode === "recall") {
      pool = pool.filter((c) => c.answer.length <= 60);
    }
    let unmastered = pool.filter((c) => !isMastered(c.card));
    if (unmastered.length === 0) {
      unmastered = pool;
    }
    const shuffled = shuffleArray(unmastered).map((c) => ({
      id: c.card,
      question: c.question,
      answer: c.answer,
      topic: c.topic,
      hint: c.hint,
      needs_check: c.needs_check,
    }));

    setActiveSession({
      mode,
      deckTitle: "Review All Study Q&A",
      topicSlug: "study-all",
      deckColor: "#A855F7",
      cards: shuffled,
    });
  };

  // Start specific deck session
  const startDeckSession = (deck: TopicDeckInfo, mode: "flashcard" | "recall") => {
    let deckCards = cards.filter((c) => c.topic === deck.topic);
    if (mode === "recall") {
      deckCards = deckCards.filter((c) => c.answer.length <= 60);
    }
    let unmastered = deckCards.filter((c) => !isMastered(c.card));
    if (unmastered.length === 0) {
      unmastered = deckCards;
    }
    const shuffled = shuffleArray(unmastered).map((c) => ({
      id: c.card,
      question: c.question,
      answer: c.answer,
      topic: c.topic,
      hint: c.hint,
      needs_check: c.needs_check,
    }));

    setActiveSession({
      mode,
      deckTitle: deck.topic,
      topicSlug: deck.slug,
      deckColor: deck.color,
      cards: shuffled,
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="font-mono text-xs text-[#8E9AA8]">
          <span className="text-white font-bold">{totalCards}</span> cards · <span className="text-[#A855F7] font-bold">10</span> decks
        </div>
      </div>

      {/* Review All Hero Card */}
      <div className="w-full bg-[#121722] border border-[#2A3446] rounded-[24px] p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-[#A855F7] font-semibold">
              ./study --all
            </span>
            <h2 className="text-xl font-black text-white">Review All Study Cards</h2>
            <p className="text-xs text-[#8E9AA8]">
              {totalMastered} of {totalCards} cards mastered across 10 Excel Q&A decks
            </p>
          </div>

          {/* Mastery Percentage Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-9deg" viewBox="0 0 36 36">
              <path
                className="text-[#1A2232]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#A855F7] transition-all duration-500"
                strokeDasharray={`${overallPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-white">
              {overallPercent}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => startReviewAll("flashcard")}
            className="flex-1 py-3 px-4 rounded-xl bg-[#A855F7] hover:bg-[#B366F9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#A855F7]/25 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START 3D FLIP →</span>
          </button>
          <button
            onClick={() => startReviewAll("recall")}
            className="py-3 px-3 rounded-xl bg-[#1A2232] hover:bg-[#253044] border border-[#2A3446] text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            title="Recall Mode (114 cards <=60 chars)"
          >
            <Terminal className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Recall</span>
          </button>
        </div>
      </div>

      {/* Decks List Prompt Line */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8E9AA8] mt-1 px-1">
        <span>$ ls ~/study-decks (click deck to expand study modes)</span>
        <button
          onClick={() => onResetBankMastery("study")}
          className="text-[#5A687C] hover:text-amber-400 transition text-[10px]"
          title="Reset all study mastery"
        >
          reset all
        </button>
      </div>

      {/* 10 Topic Decks */}
      <div className="flex flex-col gap-2.5">
        {STUDY_TOPIC_DECKS.map((deck) => {
          const deckCards = cards.filter((c) => c.topic === deck.topic);
          const masteredInDeck = deckCards.filter((c) => isMastered(c.card)).length;
          const isExpanded = expandedTopic === deck.topic;
          const deckPercent = Math.round((masteredInDeck / Math.max(1, deck.totalCards)) * 100);
          const hasCheckFlag = deckCards.some((c) => c.needs_check);

          return (
            <div
              key={deck.topic}
              className="bg-[#121722] border border-[#242F42] hover:border-[#35435B] rounded-2xl overflow-hidden transition-all shadow-md"
            >
              {/* Row Header */}
              <button
                onClick={() => setExpandedTopic(isExpanded ? null : deck.topic)}
                className="w-full p-3.5 flex items-center justify-between text-left relative"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: deck.color }}
                />

                <div className="flex items-center gap-3 pl-1.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    style={{
                      backgroundColor: `${deck.color}15`,
                      color: deck.color,
                      border: `1px solid ${deck.color}35`,
                    }}
                  >
                    |
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{deck.topic}</h3>
                      {hasCheckFlag && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> flag
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400">
                        {masteredInDeck} / {deck.totalCards}
                      </span>
                      <div className="w-16 h-1 bg-[#1A2232] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${deckPercent}%`,
                            backgroundColor: deck.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {masteredInDeck === deck.totalCards && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Modes */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-[#0E131E] border-t border-[#1C2433] flex flex-col gap-2.5">
                  <div className="text-[10px] font-mono text-[#8E9AA8] uppercase tracking-wider">
                    Select Study Mode:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Mode 1: Flashcard */}
                    <button
                      onClick={() => startDeckSession(deck, "flashcard")}
                      className="p-3 rounded-xl bg-[#141A28] border border-[#2A3446] hover:border-[#A855F7] text-left transition group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Sparkles className="w-4 h-4 text-[#A855F7] group-hover:scale-110 transition-transform" />
                        <span className="font-mono text-[10px] text-slate-400">
                          {deck.totalCards} cards
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Flashcard Deck</div>
                        <div className="text-[10px] text-[#8E9AA8]">3D flip with hints</div>
                      </div>
                    </button>

                    {/* Mode 2: Recall */}
                    <button
                      onClick={() => startDeckSession(deck, "recall")}
                      disabled={deck.recallCards === 0}
                      className="p-3 rounded-xl bg-[#141A28] border border-[#2A3446] hover:border-[#00B4D8] disabled:opacity-40 text-left transition group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Terminal className="w-4 h-4 text-[#00B4D8] group-hover:scale-110 transition-transform" />
                        <span className="font-mono text-[10px] text-slate-400">
                          {deck.recallCards} cards
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Terminal Recall</div>
                        <div className="text-[10px] text-[#8E9AA8]">type short answer</div>
                      </div>
                    </button>
                  </div>

                  {/* Reset Deck Mastery Button */}
                  {masteredInDeck > 0 && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() =>
                          onResetBankMastery(
                            "study",
                            deck.topic,
                            deckCards.map((c) => c.card),
                          )
                        }
                        className="text-[10px] font-mono text-slate-500 hover:text-amber-400 flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>reset deck progress</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
