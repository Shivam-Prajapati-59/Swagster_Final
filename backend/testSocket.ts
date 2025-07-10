// testSocket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Make sure your backend is running on this port

socket.on("connection", () => {
  console.log("✅ Connected to server!");
  console.log("Socket ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server.");
});
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
// ts-node testSocket.ts
