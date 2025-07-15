import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import {
  createQuizRoom,
  addParticipant,
  removeParticipant,
  quizRooms,
  isRoomAdmin,
  startQuiz,
} from "../helpers/quizUtils";

/**
 * Register room management events
 * @param io - Socket.IO server instance
 * @param socket - Extended socket instance
 */
export default function registerRoomEvents(io: Server, socket: ExtendedSocket) {
  socket.on("createRoom", ({ roomId, username }) => {
    // Create room with admin
    const room = createQuizRoom(roomId, username);

    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;
    socket.isAdmin = true; // Set admin flag

    socket.emit("roomCreated", {
      roomId,
      admin: username,
      participants: room.participants,
      isAdmin: true,
    });

    console.log(`Room ${roomId} created by admin ${username}`);
  });

  socket.on("joinRoom", ({ roomId, username, isAdmin }) => {
    console.log(
      `Join room request: ${username} -> ${roomId}, isAdmin: ${isAdmin}`
    );

    if (!roomId || !username) {
      socket.emit("joinError", "Room ID and username are required");
      return;
    }

    let room = quizRooms[roomId];

    // If room doesn't exist and user wants to be admin, create it
    if (!room && isAdmin) {
      room = createQuizRoom(roomId, username);
      socket.join(roomId);
      socket.username = username;
      socket.roomId = roomId;
      socket.isAdmin = true;

      socket.emit("joinedRoom", {
        roomId,
        username,
        participants: room.participants,
        admin: room.admin,
        isAdmin: true,
      });

      console.log(`Room ${roomId} created by admin ${username}`);
      return;
    }

    // If room doesn't exist and user is not admin
    if (!room) {
      socket.emit("joinError", "Room not found");
      return;
    }

    // Check if quiz is already active
    if (room.isActive) {
      socket.emit("joinError", "Quiz is already active in this room");
      return;
    }

    // Check if user is the admin trying to rejoin
    if (username === room.admin) {
      socket.join(roomId);
      socket.username = username;
      socket.roomId = roomId;
      socket.isAdmin = true;

      socket.emit("joinedRoom", {
        roomId,
        username,
        participants: room.participants,
        admin: room.admin,
        isAdmin: true,
      });

      // Notify others that admin rejoined
      socket.to(roomId).emit("participantJoined", {
        username,
        participants: room.participants,
        admin: room.admin,
      });
      return;
    }

    // Regular participant joining
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;
    socket.isAdmin = false;

    addParticipant(roomId, username);

    // Notify all in room about new participant
    io.to(roomId).emit("participantJoined", {
      username,
      participants: room.participants,
      admin: room.admin,
    });

    socket.emit("joinedRoom", {
      roomId,
      username,
      participants: room.participants,
      admin: room.admin,
      isAdmin: false,
    });

    console.log(`${username} joined room ${roomId}`);
  });

  socket.on("leaveRoom", ({ roomId, username }) => {
    if (!roomId || !username) return;

    console.log(`${username} leaving room ${roomId}`);

    socket.leave(roomId);
    removeParticipant(roomId, username);

    // If admin left, room is deleted, notify all participants
    if (!quizRooms[roomId]) {
      io.to(roomId).emit("roomDeleted", {
        message: "Room has been deleted because admin left",
      });
    } else {
      // Notify others about participant leaving
      socket.to(roomId).emit("participantLeft", {
        username,
        participants: quizRooms[roomId].participants,
      });
    }

    // Clear socket data
    socket.username = undefined;
    socket.roomId = undefined;
    socket.isAdmin = undefined;
  });

  socket.on("startQuiz", ({ roomId }) => {
    if (!socket.username || !socket.isAdmin) {
      socket.emit("quizError", "Only admin can start the quiz");
      return;
    }

    if (!isRoomAdmin(roomId, socket.username)) {
      socket.emit("quizError", "You are not the admin of this room");
      return;
    }

    const success = startQuiz(io, roomId, socket.username);
    if (!success) {
      socket.emit(
        "quizError",
        "Cannot start quiz. Make sure you have participants."
      );
    }
  });

  socket.on("getRoomInfo", (roomId) => {
    if (!roomId) {
      socket.emit("quizError", "Room ID is required");
      return;
    }

    const room = quizRooms[roomId];
    if (!room) {
      socket.emit("quizError", "Room not found");
      return;
    }

    socket.emit("roomInfo", {
      roomId: room.roomId,
      participants: room.participants,
      admin: room.admin,
      participantCount: room.participants.length,
      isActive: room.isActive,
    });
  });
}
