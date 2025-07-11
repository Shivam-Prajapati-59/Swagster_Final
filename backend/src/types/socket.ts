import { Socket } from "socket.io";

export interface ExtendedSocket extends Socket {
  username?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export interface PlayerScore {
  username: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswers: number;
}

export interface QuizRoom {
  id: string;
  players: PlayerScore[];
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isQuizActive: boolean;
  hostSocketId: string;
  startTime?: Date;
  endTime?: Date;
  totalTime?: number;
}

export interface QuizRoom {
  roomId: string;
  participants: string[];
  quiz: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  leaderboard: PlayerScore[];
  questionStartTime?: number;
  answers: Record<string, { answer: number; timestamp: number }>;
}

// Client-to-Server Events
export interface ClientToServerEvents {
  joinRoom: (data: { roomId: string; username: string }) => void;
  leaveRoom: (data: { roomId: string; username: string }) => void;
  getRoomInfo: (roomId: string) => void;
  startQuiz: (data: { roomId: string }) => void;
  submitAnswer: (data: { roomId: string; answer: number }) => void;
  getLeaderboard: (data: { roomId: string }) => void;
  stopQuiz: (data: { roomId: string }) => void;
}

// Server-to-Client Events
export interface ServerToClientEvents {
  joinedRoom: (data: {
    roomId: string;
    username: string;
    participants: string[];
  }) => void;
  joinError: (message: string) => void;
  participants: (participants: string[]) => void;
  user_Joined: (message: string) => void;
  user_Left: (message: string) => void;
  roomInfo: (data: {
    roomId: string;
    participants: string[];
    participantCount: number;
  }) => void;

  // Quiz Events
  quizStarted: (data: { message: string; totalQuestions: number }) => void;
  quizQuestion: (data: {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    timeLeft: number;
  }) => void;
  answerSubmitted: (data: {
    message: string;
    answeredCount: number;
    totalParticipants: number;
  }) => void;
  participantAnswered: (data: {
    username: string;
    answeredCount: number;
    totalParticipants: number;
  }) => void;
  questionResults: (data: {
    question: QuizQuestion;
    correctAnswer: number;
    answers: Record<string, { answer: number; timestamp: number }>;
    leaderboard: PlayerScore[];
  }) => void;
  questionTimeUp: (data: { questionNumber: number }) => void;
  quizCompleted: (data: {
    message: string;
    finalLeaderboard: PlayerScore[];
  }) => void;
  quizStopped: (data: {
    message: string;
    finalLeaderboard: PlayerScore[];
  }) => void;
  leaderboardUpdate: (leaderboard: PlayerScore[]) => void;
  quizError: (message: string) => void;
}
