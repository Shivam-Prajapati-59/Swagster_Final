"use client";

import { getSocket } from "@/lib/socket";
import { useRoom } from "@/contexts/RoomContext";
import React, { useState, useEffect } from "react";

const CreateRoom = () => {
  const { roomId, username, isInRoom, setRoomData, clearRoomData } = useRoom();
  const [inputRoomId, setInputRoomId] = useState<string>("");
  const [inputUsername, setInputUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const socket = getSocket();

    // Listen for successful room join
    socket.on("joinedRoom", (data) => {
      console.log("Successfully joined room:", data);
      setRoomData(data.roomId, data.username);
      setIsLoading(false);
      setError("");
    });

    // Listen for join errors
    socket.on("joinError", (errorMessage) => {
      console.error("Error joining room:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("joinedRoom");
      socket.off("joinError");
    };
  }, [setRoomData]);

  // Generate a random room ID
  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInputRoomId(newRoomId);
  };

  // Handle joining an existing room
  const handleJoinRoom = () => {
    if (!inputRoomId.trim() || !inputUsername.trim()) {
      setError("Room ID and Username are required");
      return;
    }

    setIsLoading(true);
    setError("");

    const socket = getSocket();
    socket.emit("joinRoom", {
      roomId: inputRoomId.trim(),
      username: inputUsername.trim(),
    });
  };

  // Handle creating a new room
  const handleCreateRoom = () => {
    if (!inputUsername.trim()) {
      setError("Username is required to create a room");
      return;
    }

    // Generate a new room ID
    const newRoomId = inputRoomId;
    setInputRoomId(newRoomId);

    setIsLoading(true);
    setError("");

    const socket = getSocket();
    socket.emit("joinRoom", {
      roomId: newRoomId,
      username: inputUsername.trim(),
    });
  };

  // Handle leaving the current room
  const handleLeaveRoom = () => {
    const socket = getSocket();
    socket.emit("leaveRoom", { roomId, username });

    // Reset state
    clearRoomData();
    setInputRoomId("");
    setInputUsername("");
    setError("");
  };

  // If user is in a room, show room info and leave option
  if (isInRoom && roomId && username) {
    return (
      <div className="p-4">
        <div className="space-y-4 text-black">
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-600 mb-2">
              ✅ Connected to Room
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-gray-600 mb-2">
                <strong>Room ID:</strong>
                <span className="font-mono font-bold text-blue-600 ml-2">
                  {roomId}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Username:</strong>
                <span className="font-bold text-green-600 ml-2">
                  {username}
                </span>
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Share the Room ID with others to let them join!
            </p>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            🚪 Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Room creation/joining interface
  return (
    <div className="p-4">
      <div className="space-y-4 text-black">
        {/* Display error messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        {/* Username input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👤 Username
          </label>
          <input
            type="text"
            placeholder="Enter your username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            disabled={isLoading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black disabled:bg-gray-100"
          />
        </div>

        {/* Room ID input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏠 Room ID (Optional - leave empty to create new room)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room ID or leave empty"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black disabled:bg-gray-100"
            />
            <button
              onClick={generateRoomId}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              🎲
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCreateRoom}
            disabled={!inputUsername.trim() || isLoading}
            className="flex-1 p-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? "⏳" : "🆕 Create"}
          </button>

          <button
            onClick={handleJoinRoom}
            disabled={!inputRoomId.trim() || !inputUsername.trim() || isLoading}
            className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? "⏳" : "🚪 Join"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          💡 Create a room to start a new quiz, or join an existing room with
          its ID
        </p>
      </div>
    </div>
  );
};

export default CreateRoom;
