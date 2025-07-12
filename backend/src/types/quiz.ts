export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
  timeLimit: number; // in seconds
}

export interface PlayerScore {
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  lastAnswerTime?: number;
}

export interface QuizRoom {
  roomId: string;
  participants: string[];
  quiz: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  leaderboard: PlayerScore[];
  questionStartTime?: number;
  answers: Record<
    string,
    {
      answer: number;
      timestamp: number;
    }
  >;
}
