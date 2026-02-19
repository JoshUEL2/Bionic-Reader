export enum AppState {
  IDLE = 'IDLE',
  READING = 'READING',
  PAUSED = 'PAUSED',
  STATS = 'STATS'
}

export enum HighlightMode {
  FIRST_LETTER = 'First Letter',
  FIRST_TWO = 'First Two Letters',
  FIRST_HALF = 'First Half',
  ORP_OPTIMAL = 'Optimal (Scientific)',
  NONE = 'No Highlight'
}

export interface ReadingSession {
  id: string;
  date: number;
  wordsRead: number;
  durationSeconds: number;
  wpm: number;
}

export interface ReadingStats {
  totalWords: number;
  totalTimeSeconds: number;
  sessions: ReadingSession[];
}

export interface WordToken {
  word: string;
  originalIndex: number; // Index in the full text array
  hasPunctuation: boolean; // For pause logic
}