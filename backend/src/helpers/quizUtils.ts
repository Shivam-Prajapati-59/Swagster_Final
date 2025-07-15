import { Server } from "socket.io";
import { QuizQuestion, PlayerScore, QuizRoom } from "../types/socket";

// In-memory storage for quiz rooms
export const quizRooms: Record<string, QuizRoom> = {};

// Sample quiz questions
const sampleQuiz: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    correctAnswer: 0,
    timeLimit: 30,
  },
  {
    id: "q2",
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    timeLimit: 30,
  },
  {
    id: "q3",
    question: "Who wrote 'Romeo and Juliet'?",
    options: [
      "Leo Tolstoy",
      "William Wordsworth",
      "William Shakespeare",
      "Mark Twain",
    ],
    correctAnswer: 2,
    timeLimit: 30,
  },
  {
    id: "q4",
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: 1,
    timeLimit: 30,
  },
  {
    id: "q5",
    question:
      "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: 2,
    timeLimit: 30,
  },
];

/**
 * Calculate score based on correctness and time taken
 * @param isCorrect - Whether the answer is correct
 * @param timeLeft - Time remaining when answered
 * @param totalTime - Total time for the question
 * @returns Score points
 */
export function calculateScore(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number
): number {
  if (!isCorrect) return 0;

  // Base points for correct answer
  const basePoints = 100;

  // Bonus points based on speed (max 50 bonus points)
  const timeBonus = Math.floor((timeLeft / totalTime) * 50);

  return basePoints + timeBonus;
}

/**
 * Update and broadcast leaderboard to all participants
 * @param io - Socket.IO server instance
 * @param roomId - Room identifier
 */
export function updateLeaderboard(io: Server, roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  // Sort leaderboard by score (descending), then by correct answers, then by total answers
  quizRoom.leaderboard.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.correctAnswers !== b.correctAnswers)
      return b.correctAnswers - a.correctAnswers;
    return a.totalAnswers - b.totalAnswers;
  });

  // Broadcast updated leaderboard
  io.to(roomId).emit("leaderboardUpdate", quizRoom.leaderboard);
}

/**
 * Move to the next question or end the quiz
 * @param io - Socket.IO server instance
 * @param roomId - Room identifier
 */
export function nextQuestion(io: Server, roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom || !quizRoom.isActive) return;

  // Check if quiz is completed
  if (quizRoom.currentQuestionIndex >= quizRoom.quiz.length - 1) {
    endQuiz(io, roomId);
    return;
  }

  // Move to next question
  quizRoom.currentQuestionIndex++;
  quizRoom.answers = {};
  quizRoom.questionStartTime = Date.now();

  const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];
  const timeLimit = currentQuestion.timeLimit;

  // Broadcast new question
  io.to(roomId).emit("quizQuestion", {
    question: currentQuestion,
    questionNumber: quizRoom.currentQuestionIndex + 1,
    totalQuestions: quizRoom.quiz.length,
    timeLeft: timeLimit,
  });

  // Set timer for question timeout
  setTimeout(() => {
    handleQuestionTimeout(io, roomId);
  }, timeLimit * 1000);
}

/**
 * Handle question timeout
 * @param io - Socket.IO server instance
 * @param roomId - Room identifier
 */
function handleQuestionTimeout(io: Server, roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom || !quizRoom.isActive) return;

  const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];

  // Update scores for players who didn't answer
  quizRoom.participants.forEach((username) => {
    if (!quizRoom.answers[username]) {
      const player = quizRoom.leaderboard.find((p) => p.username === username);
      if (player) {
        player.totalAnswers++;
      }
    }
  });

  // Broadcast question results
  io.to(roomId).emit("questionResults", {
    question: currentQuestion,
    correctAnswer: currentQuestion.correctAnswer,
    answers: quizRoom.answers,
    leaderboard: quizRoom.leaderboard,
  });

  // Broadcast time up event
  io.to(roomId).emit("questionTimeUp", {
    questionNumber: quizRoom.currentQuestionIndex + 1,
  });

  // Update leaderboard
  updateLeaderboard(io, roomId);

  // Move to next question after showing results
  setTimeout(() => {
    nextQuestion(io, roomId);
  }, 5000);
}

/**
 * End the quiz and show final results
 * @param io - Socket.IO server instance
 * @param roomId - Room identifier
 */
function endQuiz(io: Server, roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  quizRoom.isActive = false;
  quizRoom.currentQuestionIndex = -1;

  // Update final leaderboard
  updateLeaderboard(io, roomId);

  // Broadcast quiz completion
  io.to(roomId).emit("quizCompleted", {
    message: "Quiz completed! Check out the final results.",
    finalLeaderboard: quizRoom.leaderboard,
  });
}

/**
 * Create a new quiz room with admin
 * @param roomId - Room identifier
 * @param adminUsername - Admin username who created the room
 * @returns Created quiz room
 */
export function createQuizRoom(
  roomId: string,
  adminUsername: string
): QuizRoom {
  const newRoom: QuizRoom = {
    roomId,
    admin: adminUsername, // Set admin
    participants: [],
    quiz: [...sampleQuiz],
    currentQuestionIndex: -1,
    isActive: false,
    leaderboard: [],
    answers: {},
    questionStartTime: 0,
  };

  quizRooms[roomId] = newRoom;
  return newRoom;
}

/**
 * Add participant to quiz room (only non-admin users)
 * @param roomId - Room identifier
 * @param username - Participant username
 */
export function addParticipant(roomId: string, username: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  // Don't add admin as participant
  if (username === quizRoom.admin) return;

  // Add to participants if not already present
  if (!quizRoom.participants.includes(username)) {
    quizRoom.participants.push(username);

    // Add to leaderboard
    const playerScore: PlayerScore = {
      username,
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalAnswers: 0,
    };
    quizRoom.leaderboard.push(playerScore);
  }
}

/**
 * Remove participant from quiz room
 * @param roomId - Room identifier
 * @param username - Participant username
 */
export function removeParticipant(roomId: string, username: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  // If admin leaves, delete the room
  if (username === quizRoom.admin) {
    delete quizRooms[roomId];
    return;
  }

  // Remove from participants
  const participantIndex = quizRoom.participants.indexOf(username);
  if (participantIndex > -1) {
    quizRoom.participants.splice(participantIndex, 1);
  }

  // Remove from leaderboard
  const leaderboardIndex = quizRoom.leaderboard.findIndex(
    (p) => p.username === username
  );
  if (leaderboardIndex > -1) {
    quizRoom.leaderboard.splice(leaderboardIndex, 1);
  }
}

/**
 * Check if user is admin of the room
 * @param roomId - Room identifier
 * @param username - Username to check
 * @returns true if user is admin
 */
export function isRoomAdmin(roomId: string, username: string): boolean {
  const quizRoom = quizRooms[roomId];
  return quizRoom ? quizRoom.admin === username : false;
}

/**
 * Start quiz (only admin can start)
 * @param io - Socket.IO server instance
 * @param roomId - Room identifier
 * @param adminUsername - Admin username
 * @returns true if quiz started successfully
 */
export function startQuiz(
  io: Server,
  roomId: string,
  adminUsername: string
): boolean {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom || quizRoom.admin !== adminUsername || quizRoom.isActive) {
    return false;
  }

  if (quizRoom.participants.length === 0) {
    return false; // No participants to start quiz
  }

  quizRoom.isActive = true;
  quizRoom.currentQuestionIndex = 0;
  quizRoom.questionStartTime = Date.now();

  const firstQuestion = quizRoom.quiz[0];

  // Broadcast quiz start to participants
  io.to(roomId).emit("quizStarted", {
    message: "Quiz started!",
    question: firstQuestion,
    questionNumber: 1,
    totalQuestions: quizRoom.quiz.length,
    timeLeft: firstQuestion.timeLimit,
  });

  // Set timer for first question
  setTimeout(() => {
    handleQuestionTimeout(io, roomId);
  }, firstQuestion.timeLimit * 1000);

  return true;
}
