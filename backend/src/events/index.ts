import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import registerRoomEvents from "./roomEvents";
import registerQuizEvents from "./quizEvents";

/**
 * Register all socket events
 * @param io - Socket.IO server instance
 */
export default function registerSocketEvents(io: Server) {
  io.on("connection", (socket: ExtendedSocket) => {
    console.log(`New client connected: ${socket.id}`);

    // Register room management events
    registerRoomEvents(io, socket);

    // Register quiz events
    registerQuizEvents(io, socket);

    // Handle general disconnection
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error(`Connection error for ${socket.id}:`, error);
    });

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to Swagster Quiz Platform!",
      socketId: socket.id,
    });
  });

  // Handle server-level errors
  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  console.log("Socket events registered successfully");
}
