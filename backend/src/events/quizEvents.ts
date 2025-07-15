import { DefaultEventsMap, Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import {
  quizRooms,
  calculateScore,
  updateLeaderboard,
  nextQuestion,
  isRoomAdmin,
} from "../helpers/quizUtils";

/**
 * Register quiz-related events
 * @param io - Socket.IO server instance
 * @param socket - Extended socket instance
 */
export default function registerQuizEvents(io: Server, socket: ExtendedSocket) {
  /**
   * Handle quiz start requests
   */
  socket.on("startQuiz", (data) => {
    const { roomId } = data;
    const username = socket.username;

    // Validation
    if (!username || !roomId || socket.roomId !== roomId) {
      socket.emit(
        "quizError",
        "Invalid room or user. Please join a room first."
      );
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Quiz room not found");
      return;
    }

    // Check if quiz is already active
    if (quizRoom.isActive) {
      socket.emit("quizError", "Quiz is already active in this room");
      return;
    }

    // Check if there are enough participants (minimum 1 for testing, can be increased)
    if (quizRoom.participants.length < 1) {
      socket.emit("quizError", "Need at least 1 participant to start the quiz");
      return;
    }

    // Check if there are questions available
    if (!quizRoom.quiz || quizRoom.quiz.length === 0) {
      socket.emit("quizError", "No questions available for this quiz");
      return;
    }

    // Initialize quiz state
    quizRoom.isActive = true;
    quizRoom.currentQuestionIndex = -1;
    quizRoom.answers = {};

    // Reset all player scores
    quizRoom.leaderboard.forEach((player) => {
      player.score = 0;
      player.correctAnswers = 0;
      player.incorrectAnswers = 0;
      player.totalAnswers = 0;
    });

    // Notify all participants that quiz has started
    io.to(roomId).emit("quizStarted", {
      message: `Quiz started by ${username}! Get ready...`,
      totalQuestions: quizRoom.quiz.length,
    });

    console.log(
      `Quiz started in room ${roomId} by ${username}. ${quizRoom.quiz.length} questions available.`
    );

    // Start first question after a 3-second delay
    setTimeout(() => {
      nextQuestion(io, roomId);
    }, 3000);
  });

  /**
   * Handle answer submissions
   */
  socket.on("submitAnswer", ({ roomId, answer }) => {
    // Only participants (non-admin) can submit answers
    if (socket.isAdmin) {
      socket.emit("quizError", "Admin cannot participate in quiz");
      return;
    }

    const username = socket.username;
    if (!username || !roomId || socket.roomId !== roomId) {
      socket.emit(
        "quizError",
        "Invalid room or user. Please join a room first."
      );
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom || !quizRoom.isActive) {
      socket.emit("quizError", "No active quiz in this room");
      return;
    }

    // Check if user already answered
    if (quizRoom.answers[username]) {
      socket.emit("quizError", "You have already answered this question");
      return;
    }

    // Record the answer
    quizRoom.answers[username] = {
      answer,
      timestamp: Date.now(),
    };

    // Update player score
    const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];
    const player = quizRoom.leaderboard.find((p) => p.username === username);

    if (player) {
      player.totalAnswers++;

      if (answer === currentQuestion.correctAnswer) {
        player.correctAnswers++;
        // Calculate score based on time
        const timeElapsed =
          (Date.now() - (quizRoom.questionStartTime || 0)) / 1000;
        const timeLeft = Math.max(0, currentQuestion.timeLimit - timeElapsed);
        const score = calculateScore(true, timeLeft, currentQuestion.timeLimit);
        player.score += score;
      } else {
        player.incorrectAnswers++;
      }

      player.lastAnswerTime = Date.now();
    }

    // Notify the participant
    socket.emit("answerSubmitted", {
      message: "Answer submitted successfully",
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    // Notify all participants about answer count
    io.to(roomId).emit("participantAnswered", {
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    console.log(`${username} answered question in room ${roomId}`);
  });

  /**
   * Handle quiz stop requests
   */
  socket.on("stopQuiz", (data) => {
    const { roomId } = data;
    const username = socket.username;

    // Validation
    if (!username || !roomId || socket.roomId !== roomId) {
      socket.emit("quizError", "Invalid room or user");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Quiz room not found");
      return;
    }

    if (!quizRoom.isActive) {
      socket.emit("quizError", "No active quiz to stop");
      return;
    }

    // Stop the quiz
    quizRoom.isActive = false;
    quizRoom.currentQuestionIndex = -1;
    quizRoom.answers = {};

    // Notify all participants
    io.to(roomId).emit("quizStopped", {
      message: `Quiz stopped by ${username}`,
      finalLeaderboard: quizRoom.leaderboard,
    });

    // Update and broadcast final leaderboard
    updateLeaderboard(io, roomId);

    console.log(`Quiz stopped in room ${roomId} by ${username}`);
  });

  // Admin-only events
  socket.on("nextQuestion", ({ roomId }) => {
    if (!socket.isAdmin || !isRoomAdmin(roomId, socket.username!)) {
      socket.emit("error", { message: "Only admin can control quiz flow" });
      return;
    }

    nextQuestion(io, roomId);
  });

  socket.on("endQuiz", ({ roomId }) => {
    if (!socket.isAdmin || !isRoomAdmin(roomId, socket.username!)) {
      socket.emit("error", { message: "Only admin can end quiz" });
      return;
    }

    endQuiz(io, roomId);
  });
}
function endQuiz(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  roomId: any
) {
  throw new Error("Function not implemented.");
}
