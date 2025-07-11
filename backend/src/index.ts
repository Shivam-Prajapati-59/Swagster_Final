import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ExtendedSocket } from "./types/socket";

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || "localhost";

const app = express();
const httpServer = createServer(app);

// Apply CORS to HTTP server
app.use(cors());

// Basic route to verify HTTP is working
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Types for quiz functionality
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number; // in seconds
}

interface PlayerScore {
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  lastAnswerTime?: number;
}

interface QuizRoom {
  roomId: string;
  participants: string[];
  quiz: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  leaderboard: PlayerScore[];
  questionStartTime?: number;
  answers: Record<string, { answer: number; timestamp: number }>;
}

// Store rooms and their participants
const rooms: Record<string, string[]> = {};
const quizRooms: Record<string, QuizRoom> = {};

// Sample quiz questions - you can replace this with your own questions
const sampleQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    timeLimit: 30,
  },
  {
    id: "2",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    timeLimit: 25,
  },
  {
    id: "3",
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1,
    timeLimit: 15,
  },
  {
    id: "4",
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correctAnswer: 2,
    timeLimit: 30,
  },
  {
    id: "5",
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    correctAnswer: 1,
    timeLimit: 25,
  },
];

// Helper function to initialize quiz room
function initializeQuizRoom(roomId: string): void {
  if (!quizRooms[roomId]) {
    quizRooms[roomId] = {
      roomId,
      participants: rooms[roomId] || [],
      quiz: [...sampleQuestions],
      currentQuestionIndex: -1,
      isActive: false,
      leaderboard: [],
      answers: {},
    };
  }
}

// Helper function to calculate score based on correctness and time
function calculateScore(
  isCorrect: boolean,
  timeLeft: number,
  maxTime: number
): number {
  if (!isCorrect) return 0;

  // Base score for correct answer
  const baseScore = 100;

  // Time bonus (up to 50 points for quick answers)
  const timeBonus = Math.floor((timeLeft / maxTime) * 50);

  return baseScore + timeBonus;
}

// Helper function to update leaderboard
function updateLeaderboard(roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  // Sort leaderboard by score (descending), then by correct answers, then by username
  quizRoom.leaderboard.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.correctAnswers !== b.correctAnswers)
      return b.correctAnswers - a.correctAnswers;
    return a.username.localeCompare(b.username);
  });

  // Emit updated leaderboard to all participants
  io.to(roomId).emit("leaderboardUpdate", quizRoom.leaderboard);
}

// Socket.IO connection
io.on("connection", (socket: ExtendedSocket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    // Remove user from all rooms they were in
    if (socket.data?.username && socket.data?.roomId) {
      const { username, roomId } = socket.data;

      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((name) => name !== username);

        // Remove from quiz room as well
        if (quizRooms[roomId]) {
          quizRooms[roomId].participants = quizRooms[
            roomId
          ].participants.filter((name) => name !== username);
          quizRooms[roomId].leaderboard = quizRooms[roomId].leaderboard.filter(
            (player) => player.username !== username
          );
          updateLeaderboard(roomId);
        }

        // If room is empty, delete it
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
          delete quizRooms[roomId];
        } else {
          // Notify remaining users in the room
          io.to(roomId).emit("participants", rooms[roomId]);
          io.to(roomId).emit("user_Left", `${username} has left the room`);
        }
      }

      console.log(`${username} disconnected from room ${roomId}`);
    }

    console.log("Client disconnected:", socket.id);
  });

  socket.on("joinRoom", (data) => {
    const { roomId, username } = data;

    // Validate input
    if (!roomId || !username) {
      socket.emit("joinError", "Room ID and username are required");
      return;
    }

    // Check if user is already in a room
    if (socket.data?.roomId) {
      socket.emit("joinError", "You are already in a room");
      return;
    }

    // Join the specified room
    socket.join(roomId);

    // Store user info in socket for later use
    socket.data = {
      username: username,
      roomId: roomId,
    };

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Check if username already exists in room
    if (rooms[roomId].includes(username)) {
      socket.emit("joinError", "Username already taken in this room");
      socket.leave(roomId);
      socket.data = {};
      return;
    }

    // Add user to room
    rooms[roomId].push(username);

    // Initialize quiz room
    initializeQuizRoom(roomId);

    // Add user to quiz leaderboard if not already there
    if (!quizRooms[roomId].leaderboard.find((p) => p.username === username)) {
      quizRooms[roomId].leaderboard.push({
        username,
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
      });
    }

    console.log(`${username} joined room ${roomId}`);
    console.log(`Room ${roomId} now has:`, rooms[roomId]);

    // Confirm join to the user
    socket.emit("joinedRoom", {
      roomId,
      username,
      participants: rooms[roomId],
    });

    // Notify others in the room that a new user joined
    socket.to(roomId).emit("user_Joined", `${username} has joined the room`);

    // Send updated participant list to all users in the room
    io.to(roomId).emit("participants", rooms[roomId]);

    // Send current quiz state to the new user
    const quizRoom = quizRooms[roomId];
    if (quizRoom.isActive && quizRoom.currentQuestionIndex >= 0) {
      const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];
      const timeLeft = Math.max(
        0,
        currentQuestion.timeLimit -
          Math.floor((Date.now() - (quizRoom.questionStartTime || 0)) / 1000)
      );

      socket.emit("quizQuestion", {
        question: currentQuestion,
        questionNumber: quizRoom.currentQuestionIndex + 1,
        totalQuestions: quizRoom.quiz.length,
        timeLeft,
      });
    }

    // Send current leaderboard
    updateLeaderboard(roomId);
  });

  socket.on("leaveRoom", (data) => {
    const { roomId, username } = data;

    if (socket.data?.roomId === roomId && socket.data?.username === username) {
      // Leave the room
      socket.leave(roomId);

      // Remove user from room
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((name) => name !== username);

        // Remove from quiz room as well
        if (quizRooms[roomId]) {
          quizRooms[roomId].participants = quizRooms[
            roomId
          ].participants.filter((name) => name !== username);
          quizRooms[roomId].leaderboard = quizRooms[roomId].leaderboard.filter(
            (player) => player.username !== username
          );
          updateLeaderboard(roomId);
        }

        // If room is empty, delete it
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
          delete quizRooms[roomId];
        } else {
          // Notify remaining users
          io.to(roomId).emit("participants", rooms[roomId]);
          io.to(roomId).emit("user_Left", `${username} has left the room`);
        }
      }

      // Clear socket data
      socket.data = {};

      console.log(`${username} left room ${roomId}`);
    }
  });

  // Get room info
  socket.on("getRoomInfo", (roomId) => {
    if (rooms[roomId]) {
      socket.emit("roomInfo", {
        roomId,
        participants: rooms[roomId],
        participantCount: rooms[roomId].length,
      });
    } else {
      socket.emit("roomInfo", {
        roomId,
        participants: [],
        participantCount: 0,
      });
    }
  });

  // Quiz functionality
  socket.on("startQuiz", (data) => {
    const { roomId } = data;
    const username = socket.data?.username;

    if (!username || !roomId || socket.data?.roomId !== roomId) {
      socket.emit("quizError", "Invalid room or user");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Quiz room not found");
      return;
    }

    if (quizRoom.isActive) {
      socket.emit("quizError", "Quiz is already active");
      return;
    }

    // Start the quiz
    quizRoom.isActive = true;
    quizRoom.currentQuestionIndex = -1;
    quizRoom.answers = {};

    // Reset all player scores
    quizRoom.leaderboard.forEach((player) => {
      player.score = 0;
      player.correctAnswers = 0;
      player.totalAnswers = 0;
    });

    io.to(roomId).emit("quizStarted", {
      message: `Quiz started by ${username}!`,
      totalQuestions: quizRoom.quiz.length,
    });

    // Start first question after 3 seconds
    setTimeout(() => {
      nextQuestion(roomId);
    }, 3000);
  });

  socket.on("submitAnswer", (data) => {
    const { roomId, answer } = data;
    const username = socket.data?.username;

    if (!username || !roomId || socket.data?.roomId !== roomId) {
      socket.emit("quizError", "Invalid room or user");
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
    const currentTime = Date.now();
    const timeElapsed = Math.floor(
      (currentTime - (quizRoom.questionStartTime || 0)) / 1000
    );

    // Check if time is up
    if (timeElapsed >= currentQuestion.timeLimit) {
      socket.emit("quizError", "Time is up for this question");
      return;
    }

    // Store the answer
    quizRoom.answers[username] = {
      answer,
      timestamp: currentTime,
    };

    // Update player stats
    const player = quizRoom.leaderboard.find((p) => p.username === username);
    if (player) {
      player.totalAnswers++;
      player.lastAnswerTime = currentTime;

      const isCorrect = answer === currentQuestion.correctAnswer;
      if (isCorrect) {
        player.correctAnswers++;
        const timeLeft = currentQuestion.timeLimit - timeElapsed;
        const points = calculateScore(
          true,
          timeLeft,
          currentQuestion.timeLimit
        );
        player.score += points;
      }
    }

    // Confirm answer submission
    socket.emit("answerSubmitted", {
      message: "Answer submitted successfully!",
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    // Notify room about answer submission (without revealing the answer)
    socket.to(roomId).emit("participantAnswered", {
      username,
      answeredCount: Object.keys(quizRoom.answers).length,
      totalParticipants: quizRoom.participants.length,
    });

    console.log(
      `${username} submitted answer ${answer} for question ${
        quizRoom.currentQuestionIndex + 1
      }`
    );
  });

  socket.on("getLeaderboard", (data) => {
    const { roomId } = data;
    const username = socket.data?.username;

    if (!username || !roomId || socket.data?.roomId !== roomId) {
      socket.emit("quizError", "Invalid room or user");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Quiz room not found");
      return;
    }

    socket.emit("leaderboardUpdate", quizRoom.leaderboard);
  });

  socket.on("stopQuiz", (data) => {
    const { roomId } = data;
    const username = socket.data?.username;

    if (!username || !roomId || socket.data?.roomId !== roomId) {
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

    io.to(roomId).emit("quizStopped", {
      message: `Quiz stopped by ${username}`,
      finalLeaderboard: quizRoom.leaderboard,
    });

    updateLeaderboard(roomId);
  });
});

// Helper function to move to next question
function nextQuestion(roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom || !quizRoom.isActive) return;

  // Show results of previous question if there was one
  if (quizRoom.currentQuestionIndex >= 0) {
    const previousQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];
    const results = {
      question: previousQuestion,
      correctAnswer: previousQuestion.correctAnswer,
      answers: quizRoom.answers,
      leaderboard: quizRoom.leaderboard,
    };

    io.to(roomId).emit("questionResults", results);
    updateLeaderboard(roomId);

    // Wait 5 seconds before next question
    setTimeout(() => {
      proceedToNextQuestion(roomId);
    }, 5000);
  } else {
    // First question, proceed immediately
    proceedToNextQuestion(roomId);
  }
}

function proceedToNextQuestion(roomId: string): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom || !quizRoom.isActive) return;

  quizRoom.currentQuestionIndex++;

  // Check if quiz is complete
  if (quizRoom.currentQuestionIndex >= quizRoom.quiz.length) {
    // Quiz completed
    quizRoom.isActive = false;
    updateLeaderboard(roomId);

    io.to(roomId).emit("quizCompleted", {
      message: "Quiz completed!",
      finalLeaderboard: quizRoom.leaderboard,
    });

    return;
  }

  // Reset answers for new question
  quizRoom.answers = {};
  quizRoom.questionStartTime = Date.now();

  const currentQuestion = quizRoom.quiz[quizRoom.currentQuestionIndex];

  // Send new question to all participants
  io.to(roomId).emit("quizQuestion", {
    question: currentQuestion,
    questionNumber: quizRoom.currentQuestionIndex + 1,
    totalQuestions: quizRoom.quiz.length,
    timeLeft: currentQuestion.timeLimit,
  });

  // Set timer for this question
  setTimeout(() => {
    if (
      quizRoom.isActive &&
      quizRoom.currentQuestionIndex < quizRoom.quiz.length
    ) {
      io.to(roomId).emit("questionTimeUp", {
        questionNumber: quizRoom.currentQuestionIndex + 1,
      });

      // Move to next question after 2 seconds
      setTimeout(() => {
        nextQuestion(roomId);
      }, 2000);
    }
  }, currentQuestion.timeLimit * 1000);
}

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
