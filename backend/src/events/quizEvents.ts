import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import {
  quizRooms,
  calculateScore,
  updateLeaderboard,
  nextQuestion,
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
      socket.emit("quizError", "Invalid room or user. Please join a room first.");
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
  socket.on("submitAnswer", (data) => {
    const { roomId, answer } = data;
    const username = socket.username;

    // Validation
    if (!username || !roomId || socket.roomId !== roomId) {
      socket.emit("quizError", "Invalid room or user. Please join a room first.");
      return;
    }

    if (typeof answer !== "number") {
      socket.emit("quizError", "Invalid answer format");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom || !quizRoom.isActive || quizRoom.currentQuestionIndex < 0) {
      socket.emit("quizError", "No active quiz question");
      return;
    }

    // Check if user already answered this question
    if (quizRoom.answers[username]) {
      socket.emit("quizError", "You have already answered this question");
      return;
    }

    const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];

    // Validate answer option
    if (answer < 0 || answer >= currentQuestion.options.length) {
      socket.emit("quizError", "Invalid answer option");
      return;
    }

    const currentTime = Date.now();
    const timeElapsed = Math.floor(
      (currentTime - (quizRoom.questionStartTime || 0)) / 1000
    );

    // Check if time limit exceeded
    if (timeElapsed >= currentQuestion.timeLimit) {
      socket.emit("quizError", "Time is up for this question");
      return;
    }

    // Record the answer
    quizRoom.answers[username] = {
      answer,
      timestamp: currentTime,
    };

    // Update player statistics
    const player = quizRoom.leaderboard.find((p) => p.username === username);
    if (player) {
      player.totalAnswers++;
      player.lastAnswerTime = currentTime;

      const isCorrect = answer === currentQuestion.correctAnswer;
      if (isCorrect) {
        player.correctAnswers++;
        const timeLeft = currentQuestion.timeLimit - timeElapsed;
        const points = calculateScore(true, timeLeft, currentQuestion.timeLimit);
        player.score += points;

        console.log(
          `${username} answered correctly and earned ${points} points`
        );
      } else {
        player.incorrectAnswers++;
        console.log(`${username} answered incorrectly`);
      }
    }

    // Notify user that answer was submitted
    socket.emit("answerSubmitted", {
      message: "Answer submitted successfully!",
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    // Notify other participants about the answer submission
    socket.to(roomId).emit("participantAnswered", {
      username,
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    console.log(
      `${username} submitted answer ${answer} for question ${
        quizRoom.currentQuestionIndex + 1
      } in room ${roomId}`
    );

    // Check if all participants have answered
    if (Object.keys(quizRoom.answers).length === quizRoom.participants.length) {
      console.log(
        `All participants answered question ${quizRoom.currentQuestionIndex + 1} in room ${roomId}`
      );
      // All answered - could trigger immediate next question or just wait for timer
    }
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
}
