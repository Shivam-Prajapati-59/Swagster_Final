"use client";

import CreateRoom from "@/components/custom/CreateRoom";
import ParticipantList from "@/components/custom/ParticipantList";
import QuizInterface from "@/components/custom/QuizInterface";
import QuestionDemo from "@/components/custom/QuestionDemo";
import { useRoom } from "@/contexts/RoomContext";
import { useState } from "react";

export default function Home() {
  const { isInRoom } = useRoom();
  const [activeTab, setActiveTab] = useState<"live" | "demo">("live");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
            🎯 Swagster Quiz Platform
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Create rooms, join quiz battles, and compete with friends in
            real-time!
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("live")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "live"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                🔴 Live Quiz
              </button>
              <button
                onClick={() => setActiveTab("demo")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "demo"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                🎮 Demo Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "live" ? (
          // Live Quiz Interface
          <div className="space-y-8">
            {/* Status indicator */}
            <div className="text-center">
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  isInRoom
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isInRoom ? "🟢 Connected to Room" : "🟡 Not Connected"}
              </div>
            </div>

            {/* Three column layout for desktop, stacked for mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Room Management */}
              <div className="order-1">
                <div className="bg-white rounded-lg shadow-sm border p-1">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 px-5 pt-4">
                    🏠 Room Management
                  </h2>
                  <CreateRoom />
                </div>
              </div>

              {/* Participants & Leaderboard */}
              <div className="order-3 lg:order-2">
                <div className="bg-white rounded-lg shadow-sm border p-1">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 px-5 pt-4">
                    👥 Room Dashboard
                  </h2>
                  <ParticipantList />
                </div>
              </div>

              {/* Quiz Interface */}
              <div className="order-2 lg:order-3">
                <div className="bg-white rounded-lg shadow-sm border p-1">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 px-5 pt-4">
                    🧠 Quiz Controls
                  </h2>
                  <QuizInterface />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                📖 How to Play
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-800">1.</span>
                  <span>
                    Create a room or join an existing one with your username
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-800">2.</span>
                  <span>Wait for friends to join, then start the quiz</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-800">3.</span>
                  <span>Answer questions quickly to earn more points!</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Demo Quiz
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                🎮 Demo Quiz Mode
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Try out our quiz interface with sample questions. No room
                required!
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  💡 <strong>Tip:</strong> This is a demo mode for testing the
                  quiz interface. Switch to "Live Quiz" mode to play with
                  friends in real-time!
                </p>
              </div>
            </div>
            <QuestionDemo />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              🚀 Swagster Quiz Platform
            </h3>
            <p className="text-gray-400 mb-4">
              Built with Next.js, Socket.IO, and TypeScript
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>⚡ Real-time multiplayer</span>
              <span>🏆 Live leaderboards</span>
              <span>⏱️ Timed questions</span>
              <span>📱 Mobile friendly</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
