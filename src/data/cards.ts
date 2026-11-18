import examData from "./splunk_exam_flashcards.json";
import studyData from "./splunk_flashcards.json";
import type { ExamFlashcard, StudyFlashcard, TopicDeckInfo } from "./types";

export const EXAM_CARDS: ExamFlashcard[] = examData.cards as ExamFlashcard[];
export const STUDY_CARDS: StudyFlashcard[] = studyData.cards as StudyFlashcard[];

export const TOPIC_COLORS: Record<string, string> = {
  "Search & SPL": "#FF6B00",
  "Stats & Charts": "#00B4D8",
  "Transactions": "#A855F7",
  "Visualizations": "#EC4899",
  "Lookups": "#10B981",
  "Fields & Extraction": "#F59E0B",
  "Pivot & Data Models": "#3B82F6",
  "Macros": "#6366F1",
  "Eval & Calculated Fields": "#14B8A6",
  "Event Types & Tags": "#8B5CF6",
  "Workflow Actions": "#F97316",
  "CIM & Normalizing": "#06B6D4",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function buildTopicDecks(cards: Array<{ topic: string; answer: string }>): TopicDeckInfo[] {
  const map = new Map<string, { total: number; recall: number }>();
  for (const c of cards) {
    const entry = map.get(c.topic) || { total: 0, recall: 0 };
    entry.total += 1;
    if (c.answer.length <= 60) {
      entry.recall += 1;
    }
    map.set(c.topic, entry);
  }

  const result: TopicDeckInfo[] = [];
  for (const [topic, stats] of map.entries()) {
    result.push({
      topic,
      slug: slugify(topic),
      color: TOPIC_COLORS[topic] || "#FF6B00",
      totalCards: stats.total,
      recallCards: stats.recall,
    });
  }
  return result;
}

export const EXAM_TOPIC_DECKS: TopicDeckInfo[] = buildTopicDecks(EXAM_CARDS);
export const STUDY_TOPIC_DECKS: TopicDeckInfo[] = buildTopicDecks(STUDY_CARDS);

/** Shuffle helper for fresh sessions */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
