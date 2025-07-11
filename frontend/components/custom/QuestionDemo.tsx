"use client";

import React, { useState } from "react";

// Demo quiz data for testing UI without backend connection
const demoQuiz = {
  id: "demo-quiz",
  title: "Demo Quiz",
  description: "This is a demo quiz for testing purposes.",
  questions: [
    {
      id: "1",
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      answer: "Paris",
    },
    {
      id: "2",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "4",
    },
    {
      id: "3",
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      answer: "Jupiter",
    },
  ],
};

const QuestionDemo = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = demoQuiz.questions[currentIndex];

  // Handle option selection in demo mode
  const handleOptionClick = (option: string) => {
    if (!selectedOption) {
      setSelectedOption(option);
      setShowResult(true);
    }
  };

  // Navigate to next question
  const goToNext = () => {
    if (currentIndex < demoQuiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const isCorrect = selectedOption === currentQuestion.answer;

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          {demoQuiz.title}
        </h1>
        <p className="mb-4 text-gray-700 dark:text-gray-300 text-center">
          {demoQuiz.description}
        </p>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            Q{currentIndex + 1}. {currentQuestion.question}
          </h2>
          <ul className="space-y-2">
            {currentQuestion.options.map((option, idx) => {
              let optionClass =
                "cursor-pointer px-4 py-2 rounded border transition-all";

              if (selectedOption) {
                if (option === currentQuestion.answer) {
                  optionClass +=
                    " border-green-500 bg-green-100 text-green-800";
                } else if (option === selectedOption) {
                  optionClass += " border-red-500 bg-red-100 text-red-800";
                } else {
                  optionClass += " border-gray-300 text-gray-500";
                }
              } else {
                optionClass +=
                  " border-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-800 dark:text-gray-200";
              }

              return (
                <li
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className={optionClass}
                >
                  {option}
                </li>
              );
            })}
          </ul>

          {/* Show result feedback */}
          {showResult && (
            <p
              className={`mt-4 text-center font-semibold ${
                isCorrect ? "text-green-500" : "text-red-500"
              }`}
            >
              {isCorrect
                ? "✅ Correct!"
                : `❌ Incorrect. Correct answer: ${currentQuestion.answer}`}
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded ${
              currentIndex === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            ← Previous
          </button>

          <span className="flex items-center text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {demoQuiz.questions.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentIndex === demoQuiz.questions.length - 1}
            className={`px-4 py-2 rounded ${
              currentIndex === demoQuiz.questions.length - 1
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionDemo;
