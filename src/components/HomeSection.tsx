import React from "react";
import { Layers, Headphones, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import type { DeckSection } from "../data/types";

interface HomeSectionProps {
  onSelectSection: (section: DeckSection) => void;
  examMasteredCount: number;
  studyMasteredCount: number;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  onSelectSection,
  examMasteredCount,
  studyMasteredCount,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Splunk</span>
          <span className="text-[#FF6B00]">Deck</span>
        </h1>
        <p className="text-xs text-[#8E9AA8]">
          Splunk Certified Power User prep — 3D flip cards, audio review & study decks.
        </p>
      </div>

      {/* 3 Main Selections */}
      <div className="flex flex-col gap-4">
        {/* Selection 1: Flash Cards */}
        <button
          onClick={() => onSelectSection("flashcards")}
          className="w-full text-left bg-gradient-to-br from-[#141A26] to-[#0E131E] hover:from-[#1A2234] hover:to-[#121926] border border-[#2A3446] hover:border-[#FF6B00] rounded-[24px] p-5 transition-all shadow-xl group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#FF6B00]" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors flex items-center gap-2">
                  <span>Flash Cards</span>
                </h2>
                <span className="text-xs text-[#8E9AA8] font-medium">
                  Power User Exam flip card stack (12 topics)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A2232] text-slate-400 group-hover:text-white group-hover:bg-[#FF6B00] transition">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293A] flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2.5 py-1 rounded-lg border border-[#FF6B00]/20">
              221 cards
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{examMasteredCount} / 221 mastered</span>
            </div>
          </div>
        </button>

        {/* Selection 2: Exam Question Review */}
        <button
          onClick={() => onSelectSection("review")}
          className="w-full text-left bg-gradient-to-br from-[#141A26] to-[#0E131E] hover:from-[#1A2234] hover:to-[#121926] border border-[#2A3446] hover:border-[#00B4D8] rounded-[24px] p-5 transition-all shadow-xl group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#00B4D8]" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#00B4D8]/10 border border-[#00B4D8]/30 flex items-center justify-center text-[#00B4D8] group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white group-hover:text-[#00B4D8] transition-colors flex items-center gap-2">
                  <span>Exam Question Review</span>
                </h2>
                <span className="text-xs text-[#8E9AA8] font-medium">
                  One-card read-through with Kokoro voice clips
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A2232] text-slate-400 group-hover:text-white group-hover:bg-[#00B4D8] transition">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293A] flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#00B4D8] bg-[#00B4D8]/10 px-2.5 py-1 rounded-lg border border-[#00B4D8]/20">
              221 cards
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{examMasteredCount} / 221 mastered</span>
            </div>
          </div>
        </button>

        {/* Selection 3: Exam Study */}
        <button
          onClick={() => onSelectSection("study")}
          className="w-full text-left bg-gradient-to-br from-[#141A26] to-[#0E131E] hover:from-[#1A2234] hover:to-[#121926] border border-[#2A3446] hover:border-[#A855F7] rounded-[24px] p-5 transition-all shadow-xl group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#A855F7]" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7] group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white group-hover:text-[#A855F7] transition-colors flex items-center gap-2">
                  <span>Exam Study</span>
                </h2>
                <span className="text-xs text-[#8E9AA8] font-medium">
                  Excel Q&A cards with hints (10 topics)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A2232] text-slate-400 group-hover:text-white group-hover:bg-[#A855F7] transition">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293A] flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-1 rounded-lg border border-[#A855F7]/20">
              141 cards
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{studyMasteredCount} / 141 mastered</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-2 text-center text-[11px] font-mono text-[#5A687C]">
        <span>Splunk Power User Exam Preparation · No Multiple Choice</span>
      </div>
    </div>
  );
};
