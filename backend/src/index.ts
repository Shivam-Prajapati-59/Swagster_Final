import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import registerSocketEvents from "./events";
import { ClientToServerEvents, ServerToClientEvents } from "./types/socket";

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || "localhost";

const app = express();
const httpServer = createServer(app);

// Enable CORS for Express
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"]
        : ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Swagster Quiz Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    server: "online",
    port,
    hostname,
    environment: process.env.NODE_ENV || "development",
  });
});

// Create Socket.IO server with proper typing
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"]
        : ["http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Register all socket events
registerSocketEvents(io);

// Start the server
httpServer.listen(port, () => {
  console.log(`🚀 Swagster Quiz Server started successfully!`);
  console.log(`📍 Server running on: http://${hostname}:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Socket.IO ready for connections`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});
