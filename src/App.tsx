import React, { useState, useMemo } from "react";
import type { DeckSection } from "./data/types";
import { EXAM_CARDS, STUDY_CARDS } from "./data/cards";
import { useMastery } from "./store/masteryStore";
import { Header } from "./components/Header";
import { HomeSection } from "./components/HomeSection";
import { FlashcardsSection } from "./components/FlashcardsSection";
import { ReviewSession } from "./components/ReviewCard";
import { ExamStudySection } from "./components/ExamStudySection";

export function App() {
  const [currentSection, setCurrentSection] = useState<DeckSection | null>(null);
  const [isChildSessionActive, setIsChildSessionActive] = useState<boolean>(false);

  const {
    mastery,
    user,
    googleClientId,
    cloudSyncEnabled,
    isSyncing,
    setUser,
    markMastered,
    unmarkMastered,
    resetBankMastery,
  } = useMastery();

  const examMasteredCount = useMemo(() => {
    return Object.keys(mastery.examMastered).length;
  }, [mastery.examMastered]);

  const studyMasteredCount = useMemo(() => {
    return Object.keys(mastery.studyMastered).length;
  }, [mastery.studyMastered]);

  const getSectionTitle = () => {
    if (currentSection === "flashcards") return "Flash Cards";
    if (currentSection === "review") return "Exam Review";
    if (currentSection === "study") return "Exam Study";
    return undefined;
  };

  // Exam Question Review is a standalone full-screen session (Linux Deck pattern)
  if (currentSection === "review") {
    return (
      <ReviewSession
        cards={EXAM_CARDS}
        onBack={() => setCurrentSection(null)}
        isMastered={(id) => Boolean(mastery.examMastered[id])}
        onMarkMastered={(id) => markMastered("exam", id)}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      {/* Universal Terminal Header with Google Sign-in on Home & Topic Deck lists */}
      {!isChildSessionActive && (
        <Header
          user={user}
          googleClientId={googleClientId}
          cloudSyncEnabled={cloudSyncEnabled}
          isSyncing={isSyncing}
          onUserChange={setUser}
          onBackToHome={() => {
            setIsChildSessionActive(false);
            setCurrentSection(null);
          }}
          currentTitle={getSectionTitle()}
        />
      )}

      {/* Main Content Area */}
      <div className={isChildSessionActive ? "flex-1 flex flex-col h-[100dvh] overflow-hidden" : "flex-1 flex flex-col"}>
        {currentSection === null && (
          <HomeSection
            onSelectSection={(sec) => {
              setIsChildSessionActive(false);
              setCurrentSection(sec);
            }}
            examMasteredCount={examMasteredCount}
            studyMasteredCount={studyMasteredCount}
          />
        )}

        {currentSection === "flashcards" && (
          <FlashcardsSection
            cards={EXAM_CARDS}
            onBack={() => {
              setIsChildSessionActive(false);
              setCurrentSection(null);
            }}
            isMastered={(id) => Boolean(mastery.examMastered[id])}
            onMarkMastered={(id) => markMastered("exam", id)}
            onResetBankMastery={resetBankMastery}
            onSessionChange={setIsChildSessionActive}
          />
        )}

        {currentSection === "study" && (
          <ExamStudySection
            cards={STUDY_CARDS}
            onBack={() => {
              setIsChildSessionActive(false);
              setCurrentSection(null);
            }}
            isMastered={(id) => Boolean(mastery.studyMastered[id])}
            onMarkMastered={(id) => markMastered("study", id)}
            onResetBankMastery={resetBankMastery}
            onSessionChange={setIsChildSessionActive}
          />
        )}
      </div>
    </div>
  );
}

export default App;
