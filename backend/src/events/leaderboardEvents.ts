import { Server } from "socket.io";
import { ExtendedSocket } from "../types/socket";
import { quizRooms } from "../helpers/quizUtils";

export default function registerLeaderboardEvents(
  io: Server,
  socket: ExtendedSocket
) {
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
}
