// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Use environment variable for production, localhost for development
    const serverUrl =
      process.env.NODE_ENV === "production"
        ? "https://your-backend-domain.com"
        : "http://localhost:3000";

    socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Connected to Swagster Quiz Server!");
      console.log("🆔 Socket ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("🔥 Connection error:", error.message);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
    });

    socket.on("reconnect_error", (error) => {
      console.error("🔄❌ Reconnection failed:", error.message);
    });
  }

  return socket;
};

// Helper function to disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
};

// Helper function to check connection status
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

// Helper function to get socket ID
export const getSocketId = (): string | undefined => {
  return socket?.id;
};
