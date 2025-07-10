"use client";

import { getSocket } from "@/lib/socket";
import React, { useState } from "react";

const CreateRoom = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
  };

  const handleJoinRoom = () => {
    if (roomId && username) {
      const socket = getSocket();
      socket.emit("joinRoom", { roomId, username });
      setIsInRoom(true);

      // Listen for join confirmation or errors
      socket.on("joinedRoom", (data) => {
        console.log("Successfully joined room:", data);
      });

      socket.on("joinError", (error) => {
        console.error("Error joining room:", error);
        setIsInRoom(false);
      });
    } else {
      console.error("Room ID and Username are required to join a room.");
    }
  };

  const handleCreateRoom = () => {
    if (username) {
      generateRoomId();
      // Wait for room ID to be generated, then join
      setTimeout(() => {
        const socket = getSocket();
        const newRoomId = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        setRoomId(newRoomId);
        socket.emit("joinRoom", { roomId: newRoomId, username });
        setIsInRoom(true);
      }, 100);
    } else {
      console.error("Username is required to create a room.");
    }
  };

  const handleLeaveRoom = () => {
    const socket = getSocket();
    socket.emit("leaveRoom", { roomId, username });
    setIsInRoom(false);
    setRoomId("");
  };

  if (isInRoom) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <div className="space-y-4 text-black">
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-600 mb-2">
              Connected to Room
            </h2>
            <p className="text-gray-600">
              Room ID: <span className="font-mono font-bold">{roomId}</span>
            </p>
            <p className="text-gray-600">
              Username: <span className="font-bold">{username}</span>
            </p>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room ID (Optional - leave empty to create new room)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room ID or leave empty"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
            />
            <button
              onClick={generateRoomId}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateRoom}
            disabled={!username}
            className="flex-1 p-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Create Room
          </button>

          <button
            onClick={handleJoinRoom}
            disabled={!roomId || !username}
            className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
