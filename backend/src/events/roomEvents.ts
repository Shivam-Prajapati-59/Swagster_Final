import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import {
  quizRooms,
  createQuizRoom,
  addParticipant,
  removeParticipant,
  updateLeaderboard,
} from "../helpers/quizUtils";

/**
 * Register room management events
 * @param io - Socket.IO server instance
 * @param socket - Extended socket instance
 */
export default function registerRoomEvents(io: Server, socket: ExtendedSocket) {
  /**
   * Handle room join requests
   */
  socket.on("joinRoom", (data) => {
    const { roomId, username } = data;

    // Validation
    if (!roomId || !username) {
      socket.emit("joinError", "Room ID and username are required");
      return;
    }

    if (roomId.length < 3) {
      socket.emit("joinError", "Room ID must be at least 3 characters long");
      return;
    }

    if (username.length < 2) {
      socket.emit("joinError", "Username must be at least 2 characters long");
      return;
    }

    // Leave current room if already in one
    if (socket.username && socket.roomId) {
      socket.leave(socket.roomId);
      removeParticipant(socket.roomId, socket.username);

      // Notify others in the old room
      socket
        .to(socket.roomId)
        .emit("user_Left", `${socket.username} left the room`);
      socket
        .to(socket.roomId)
        .emit("participants", quizRooms[socket.roomId]?.participants || []);
    }

    // Create room if it doesn't exist
    if (!quizRooms[roomId]) {
      createQuizRoom(roomId);
      console.log(`Created new room: ${roomId}`);
    }

    const quizRoom = quizRooms[roomId];

    // Check if username is already taken in this room
    if (quizRoom.participants.includes(username)) {
      socket.emit("joinError", "Username is already taken in this room");
      return;
    }

    // Check room capacity (optional - limit to 50 players)
    if (quizRoom.participants.length >= 50) {
      socket.emit("joinError", "Room is full (maximum 50 participants)");
      return;
    }

    // Join the room
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;

    // Add participant to room
    addParticipant(roomId, username);

    // Notify user of successful join
    socket.emit("joinedRoom", {
      roomId,
      username,
      participants: quizRoom.participants,
    });

    // Notify others in the room
    socket.to(roomId).emit("user_Joined", `${username} joined the room`);
    socket.to(roomId).emit("participants", quizRoom.participants);

    // Send room info to all participants
    io.to(roomId).emit("roomInfo", {
      roomId,
      participants: quizRoom.participants,
      participantCount: quizRoom.participants.length,
    });

    // Update leaderboard
    updateLeaderboard(io, roomId);

    console.log(
      `${username} joined room ${roomId}. Total participants: ${quizRoom.participants.length}`
    );
  });

  /**
   * Handle room leave requests
   */
  socket.on("leaveRoom", (data) => {
    const { roomId, username } = data;

    if (!roomId || !username) return;

    handleUserLeave(io, socket, roomId, username);
  });

  /**
   * Handle room info requests
   */
  socket.on("getRoomInfo", (roomId) => {
    if (!roomId) {
      socket.emit("quizError", "Room ID is required");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Room not found");
      return;
    }

    socket.emit("roomInfo", {
      roomId,
      participants: quizRoom.participants,
      participantCount: quizRoom.participants.length,
    });
  });

  /**
   * Handle leaderboard requests
   */
  socket.on("getLeaderboard", (data) => {
    const { roomId } = data;

    if (!roomId) {
      socket.emit("quizError", "Room ID is required");
      return;
    }

    const quizRoom = quizRooms[roomId];
    if (!quizRoom) {
      socket.emit("quizError", "Room not found");
      return;
    }

    updateLeaderboard(io, roomId);
  });

  /**
   * Handle socket disconnection
   */
  socket.on("disconnect", () => {
    if (socket.username && socket.roomId) {
      console.log(`${socket.username} disconnected from room ${socket.roomId}`);
      handleUserLeave(io, socket, socket.roomId, socket.username);
    }
  });
}

/**
 * Handle user leaving a room (used by both leaveRoom and disconnect)
 * @param io - Socket.IO server instance
 * @param socket - Socket instance
 * @param roomId - Room identifier
 * @param username - Username
 */
function handleUserLeave(
  io: Server,
  socket: ExtendedSocket,
  roomId: string,
  username: string
): void {
  const quizRoom = quizRooms[roomId];
  if (!quizRoom) return;

  // Remove from room
  socket.leave(roomId);
  removeParticipant(roomId, username);

  // Notify others
  socket.to(roomId).emit("user_Left", `${username} left the room`);

  // Update participants list
  if (quizRooms[roomId]) {
    // Check if room still exists
    socket.to(roomId).emit("participants", quizRoom.participants);

    // Send updated room info
    io.to(roomId).emit("roomInfo", {
      roomId,
      participants: quizRoom.participants,
      participantCount: quizRoom.participants.length,
    });

    // Update leaderboard
    updateLeaderboard(io, roomId);
  }

  // Clear socket data
  socket.username = undefined;
  socket.roomId = undefined;

  console.log(
    `${username} left room ${roomId}. Remaining participants: ${quizRoom.participants.length}`
  );
}
