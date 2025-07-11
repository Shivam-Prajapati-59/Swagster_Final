// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Connect to backend running on port 3000 (as per your backend config)
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};

// Helper function to disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
