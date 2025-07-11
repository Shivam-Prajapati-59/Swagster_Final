"use client";
import { getSocket } from "@/lib/socket";
import { useRoom } from "@/contexts/RoomContext";
import React, { useEffect, useState } from "react";

// Interface for player scores
interface PlayerScore {
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  lastAnswerTime?: number;
}

const ParticipantList = () => {
  const { isInRoom, roomId } = useRoom();
  const [participants, setParticipants] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [roomInfo, setRoomInfo] = useState<{
    roomId: string;
    participantCount: number;
  } | null>(null);

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
      setMessages((prev) => [...prev, `✅ ${message}`]);
      // Keep only last 10 messages
      setMessages((prev) => prev.slice(-10));
    });

    socket.on("user_Left", (message: string) => {
      console.log("User left:", message);
      setMessages((prev) => [...prev, `❌ ${message}`]);
      // Keep only last 10 messages
      setMessages((prev) => prev.slice(-10));
    });

    // Listen for room info updates
    socket.on(
      "roomInfo",
      (data: {
        roomId: string;
        participants: string[];
        participantCount: number;
      }) => {
        setRoomInfo({
          roomId: data.roomId,
          participantCount: data.participantCount,
        });
        setParticipants(data.participants);
      }
    );

    // Listen for leaderboard updates
    socket.on("leaderboardUpdate", (data: PlayerScore[]) => {
      console.log("Leaderboard updated:", data);
      setLeaderboard(data);
    });

    // Listen for successful room join to get initial data
    socket.on(
      "joinedRoom",
      (data: { roomId: string; username: string; participants: string[] }) => {
        setParticipants(data.participants);
        setRoomInfo({
          roomId: data.roomId,
          participantCount: data.participants.length,
        });
        // Clear messages when joining a new room
        setMessages([`🎉 Welcome to room ${data.roomId}!`]);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      socket.off("participants");
      socket.off("user_Joined");
      socket.off("user_Left");
      socket.off("roomInfo");
      socket.off("leaderboardUpdate");
      socket.off("joinedRoom");
    };
  }, []);

  // Show placeholder when not in room
  if (!isInRoom || !roomId) {
    return (
      <div className="p-4">
        <div className="text-center p-6">
          <p className="text-gray-400">👥 Join a room to see participants</p>
          <p className="text-sm text-gray-500 mt-2">
            Room dashboard will appear here once connected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Room Information */}
      {roomInfo && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            📊 Room Info
          </h2>
          <p className="text-sm text-gray-400">
            <strong>Room ID:</strong>
            <span className="font-mono text-blue-400 ml-2">
              {roomInfo.roomId}
            </span>
          </p>
          <p className="text-sm text-gray-400">
            <strong>Total Participants:</strong>
            <span className="text-green-400 ml-2">
              {roomInfo.participantCount}
            </span>
          </p>
        </div>
      )}

      {/* Participants List */}
      {participants.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-gray-400">👥 No participants yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Waiting for people to join...
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">
            👥 Online Participants ({participants.length})
          </h2>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {participants.map((name: string, index: number) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white font-medium">{name}</span>
                {/* Show crown for first participant (room creator) */}
                {index === 0 && (
                  <span className="ml-auto text-yellow-400">👑</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">
            🏆 Leaderboard
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {leaderboard.map((player, index) => (
              <div
                key={player.username}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? "bg-yellow-600 text-yellow-100"
                    : index === 1
                    ? "bg-gray-600 text-gray-100"
                    : index === 2
                    ? "bg-amber-700 text-amber-100"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <span className="font-bold mr-3">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `${index + 1}.`}
                  </span>
                  <span className="font-medium">{player.username}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{player.score} pts</div>
                  <div className="text-xs opacity-75">
                    {player.correctAnswers}/{player.totalAnswers} correct
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {messages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3">
            📢 Recent Activity
          </h2>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.slice(-5).map((message, index) => (
              <div
                key={index}
                className="text-sm text-gray-400 bg-gray-700 p-2 rounded transition-opacity duration-500"
              >
                {message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
