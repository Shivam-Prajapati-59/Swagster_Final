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

// Store rooms and their participants
const rooms: Record<string, string[]> = {};

// Socket.IO connection
io.on("connection", (socket: ExtendedSocket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    // Remove user from all rooms they were in
    if (socket.data?.username && socket.data?.roomId) {
      const { username, roomId } = socket.data;

      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((name) => name !== username);

        // If room is empty, delete it
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
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
  });

  socket.on("leaveRoom", (data) => {
    const { roomId, username } = data;

    if (socket.data?.roomId === roomId && socket.data?.username === username) {
      // Leave the room
      socket.leave(roomId);

      // Remove user from room
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((name) => name !== username);

        // If room is empty, delete it
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
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
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
