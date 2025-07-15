import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import registerRoomEvents from "./roomEvents";
import registerQuizEvents from "./quizEvents";
import registerLeaderboardEvents from "./leaderboardEvents";
import { removeParticipant } from "../helpers/quizUtils";

export default function handleConnection(io: Server, socket: ExtendedSocket) {
  console.log("New client connected:", socket.id);

  registerRoomEvents(io, socket);
  registerQuizEvents(io, socket);
  registerLeaderboardEvents(io, socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Handle cleanup when user disconnects
    if (socket.roomId && socket.username) {
      removeParticipant(socket.roomId, socket.username);

      // Notify others in room
      socket.to(socket.roomId).emit("participantLeft", {
        username: socket.username,
      });
    }
  });
}
