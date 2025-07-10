"use client";
import { getSocket } from "@/lib/socket";
import React, { useEffect, useState } from "react";

const ParticipantList = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();

    // Listen for participants updates
    socket.on("participants", (data: string[]) => {
      console.log("Received participants:", data);
      setParticipants(data);
    });

    // Listen for user join/leave messages
    socket.on("user_Joined", (message: string) => {
      console.log("User joined:", message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_Left", (message: string) => {
      console.log("User left:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("participants");
      socket.off("user_Joined");
      socket.off("user_Left");
    };
  }, []);

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-4 text-center">
        Room Participants
      </h1>

      {participants.length === 0 ? (
        <p className="text-gray-400 text-center">No participants yet</p>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            Online ({participants.length})
          </h2>
          <div className="space-y-1">
            {participants.map((name: string, index: number) => (
              <div
                key={index}
                className="flex items-center p-2 bg-gray-700 rounded-lg"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-white font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            Recent Activity
          </h2>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {messages.slice(-5).map((message, index) => (
              <p
                key={index}
                className="text-sm text-gray-400 bg-gray-700 p-2 rounded"
              >
                {message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
