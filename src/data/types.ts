export interface ExamFlashcard {
  card: number;
  question: string;
  answer: string;
  hint: string | null;
  topic: string;
  source: string;
  exam_number: number;
}

export interface StudyFlashcard {
  card: number;
  row?: number;
  question: string;
  answer: string;
  hint: string | null;
  topic: string;
  source: string;
  needs_check?: boolean;
}

export interface TopicDeckInfo {
  topic: string;
  slug: string;
  color: string;
  totalCards: number;
  recallCards: number;
}

export type DeckSection = "flashcards" | "review" | "study";

export type StudyMode = "flashcard" | "recall";

export type CardDirection = "q_to_a" | "a_to_q" | "mix";

export interface UserAccount {
  googleId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  cloudSyncEnabled?: boolean;
}

export interface MasteryState {
  examMastered: Record<number, boolean>; // key is card number (1..221)
  studyMastered: Record<number, boolean>; // key is card number (1..141)
  updatedAt: number;
}
