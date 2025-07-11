import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ExtendedSocket } from "../types/socket";

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || "localhost";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

const rooms = {
  room123: {
    users: {
      alice: {
        score: 0,
        answers: { q1: "A" },
      },
      bob: {
        score: 0,
        answers: {},
      },
    },
    quiz: {
      questions: [
        {
          id: "q1",
          question: "What is the capital of France?",
          options: {
            A: "Paris",
            B: "London",
            C: "Berlin",
            D: "Madrid",
          },
          correctAnswer: "A",
        },
        {
          id: "q2",
          question: "Which planet is known as the Red Planet?",
          options: {
            A: "Earth",
            B: "Mars",
            C: "Jupiter",
            D: "Saturn",
          },
          correctAnswer: "B",
        },
        {
          id: "q3",
          question: "Who wrote 'Romeo and Juliet'?",
          options: {
            A: "Leo Tolstoy",
            B: "William Wordsworth",
            C: "William Shakespeare",
            D: "Mark Twain",
          },
          correctAnswer: "C",
        },
      ],
    },
  },
};

io.on("connection", (socket: ExtendedSocket) => {});
