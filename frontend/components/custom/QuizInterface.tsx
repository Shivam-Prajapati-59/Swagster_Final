"use client";

import React, { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useRoom } from "@/contexts/RoomContext";

// Interfaces matching backend types
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface PlayerScore {
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

const QuizInterface = () => {
  const { roomId, username, isInRoom } = useRoom();

  // Quiz state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [questionAnsweredTime, setQuestionAnsweredTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // UI state
  const [quizStatus, setQuizStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && currentQuestion && timeLeft > 0 && !hasAnswered) {
      timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuizActive, currentQuestion, timeLeft, hasAnswered]);

  useEffect(() => {
    const socket = getSocket();

    // Quiz event listeners
    socket.on("quizStarted", (data) => {
      console.log("Quiz started:", data);
      setIsQuizActive(true);
      setQuizStatus(data.message);
      setTotalQuestions(data.totalQuestions);
      setError("");
      setShowResults(false);
    });

    socket.on("quizQuestion", (data) => {
      console.log("New question:", data);
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setTimeLeft(data.timeLeft);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowResults(false);
      setAnsweredCount(0);
      setError("");
      setQuestionStartTime(Date.now());
    });

    socket.on("answerSubmitted", (data) => {
      console.log("Answer submitted:", data);
      setHasAnswered(true);
      setAnsweredCount(data.answeredCount);
      setTotalParticipants(data.totalParticipants);
    });

    socket.on("participantAnswered", (data) => {
      console.log("Participant answered:", data);
      setAnsweredCount(data.answeredCount);
      setTotalParticipants(data.totalParticipants);
    });

    socket.on("questionResults", (data) => {
      console.log("Question results:", data);
      setShowResults(true);
      setQuizResults(data);
    });

    socket.on("questionTimeUp", (data) => {
      console.log("Time up:", data);
      setTimeLeft(0);
      if (!hasAnswered) {
        setQuizStatus("⏰ Time's up! Moving to next question...");
      }
    });

    socket.on("quizCompleted", (data) => {
      console.log("Quiz completed:", data);
      setIsQuizActive(false);
      setCurrentQuestion(null);
      setQuizStatus("🎉 " + data.message);
      setShowResults(true);
      setQuizResults({ finalLeaderboard: data.finalLeaderboard });
    });

    socket.on("quizStopped", (data) => {
      console.log("Quiz stopped:", data);
      setIsQuizActive(false);
      setCurrentQuestion(null);
      setQuizStatus("🛑 " + data.message);
    });

    socket.on("quizError", (errorMessage) => {
      console.error("Quiz error:", errorMessage);
      setError(errorMessage);
    });

    // Cleanup
    return () => {
      socket.off("quizStarted");
      socket.off("quizQuestion");
      socket.off("answerSubmitted");
      socket.off("participantAnswered");
      socket.off("questionResults");
      socket.off("questionTimeUp");
      socket.off("quizCompleted");
      socket.off("quizStopped");
      socket.off("quizError");
    };
  }, [hasAnswered]);

  // Start quiz function
  const handleStartQuiz = () => {
    if (!roomId) {
      setError("Please join a room first");
      return;
    }

    const socket = getSocket();
    socket.emit("startQuiz", { roomId });
  };

  // Submit answer function
  const handleSubmitAnswer = (answerIndex: number) => {
    if (hasAnswered || timeLeft <= 0) return;

    if (!roomId) {
      setError("Not connected to a room");
      return;
    }

    const timeTakenMs = Date.now() - questionStartTime;
    const timeTakenSec = (timeTakenMs / 1000).toFixed(2); // e.g., "8.45"
    setQuestionAnsweredTime(parseFloat(timeTakenSec));

    const socket = getSocket();
    setSelectedAnswer(answerIndex);
    socket.emit("submitAnswer", { roomId, answer: answerIndex });
  };

  // Stop quiz function
  const handleStopQuiz = () => {
    if (!roomId) {
      setError("Not connected to a room");
      return;
    }

    const socket = getSocket();
    socket.emit("stopQuiz", { roomId });
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If not in a room, show message to join first
  if (!isInRoom || !roomId) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            ⚠️ Please join a room first to start or participate in quizzes
          </div>
          <p className="text-gray-600 text-sm">
            Use the "Room Management" panel to create or join a room, then come
            back here to start the quiz!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        {/* Room info */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 text-sm">
          Room: <span className="font-mono font-bold">{roomId}</span> | Player:{" "}
          <span className="font-bold">{username}</span>
        </div>

        {/* Status message */}
        {quizStatus && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
            {quizStatus}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Quiz controls when no active quiz */}
      {!isQuizActive && !currentQuestion && (
        <div className="text-center space-y-4">
          <p className="text-gray-600 mb-6 text-sm">
            Ready to start a quiz? Click the button below to begin!
          </p>
          <div className="space-x-4">
            <button
              onClick={handleStartQuiz}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              🚀 Start Quiz
            </button>
          </div>
        </div>
      )}

      {/* Active quiz interface */}
      {isQuizActive && currentQuestion && (
        <div className="space-y-4">
          {/* Question header */}
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="font-medium text-gray-600">
              Q{questionNumber}/{totalQuestions}
            </span>
            <div className="flex items-center space-x-4">
              <span
                className={`font-bold ${
                  timeLeft <= 10 ? "text-red-500" : "text-green-500"
                }`}
              >
                ⏱️ {formatTime(timeLeft)}
              </span>
              <span className="text-gray-600">
                {answeredCount}/{totalParticipants} answered
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`,
              }}
            ></div>
          </div>

          {/* Question */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentQuestion.question}
            </h2>

            {/* Answer options */}
            <div className="grid gap-2">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  "w-full p-3 text-left rounded-lg border-2 transition-all duration-200 text-sm ";

                if (hasAnswered) {
                  if (index === currentQuestion.correctAnswer) {
                    buttonClass +=
                      "border-green-500 bg-green-100 text-green-800";
                  } else if (index === selectedAnswer) {
                    buttonClass += "border-red-500 bg-red-100 text-red-800";
                  } else {
                    buttonClass += "border-gray-300 bg-gray-100 text-gray-600";
                  }
                } else if (selectedAnswer === index) {
                  buttonClass += "border-blue-500 bg-blue-100 text-blue-800";
                } else {
                  buttonClass +=
                    "border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-800";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSubmitAnswer(index)}
                    disabled={hasAnswered || timeLeft <= 0}
                    className={buttonClass}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Answer feedback */}
            {hasAnswered && (
              <div className="mt-4 text-center">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <p className="text-green-600 font-semibold text-sm">
                    ✅ Correct! Well done!
                  </p>
                ) : (
                  <p className="text-red-600 font-semibold text-sm">
                    ❌ Incorrect. The correct answer was:{" "}
                    {String.fromCharCode(65 + currentQuestion.correctAnswer)}
                  </p>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  ⏱️ You answered in{" "}
                  <strong>{questionAnsweredTime} seconds</strong>
                </div>
              </div>
            )}
          </div>

          {/* Quiz controls */}
          <div className="text-center">
            <button
              onClick={handleStopQuiz}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              🛑 Stop Quiz
            </button>
          </div>
        </div>
      )}

      {/* Results display */}
      {showResults && quizResults && quizResults.finalLeaderboard && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            🏆 Final Results
          </h3>
          <div className="space-y-2">
            {quizResults.finalLeaderboard.map(
              (player: PlayerScore, index: number) => (
                <div
                  key={player.username}
                  className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                    index === 0
                      ? "bg-yellow-200"
                      : index === 1
                      ? "bg-gray-200"
                      : index === 2
                      ? "bg-amber-200"
                      : "bg-blue-100"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-bold mr-2">
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
                    <div className="text-xs text-gray-600">
                      {player.correctAnswers}/{player.totalAnswers} correct
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;
