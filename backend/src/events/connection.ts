import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import registerRoomEvents from "./roomEvents";
import registerQuizEvents from "./quizEvents";
import registerLeaderboardEvents from "./leaderboardEvents";

export default function handleConnection(io: Server, socket: ExtendedSocket) {
  console.log("New client connected:", socket.id);

  registerRoomEvents(io, socket);
  registerQuizEvents(io, socket);
  registerLeaderboardEvents(io, socket);

  socket.on("disconnect", () => {
    // handle disconnect logic or move it to its own file
    console.log("Client disconnected:", socket.id);
  });
}
