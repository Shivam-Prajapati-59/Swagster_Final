"use client";

import CreateRoom from "@/components/custom/CreateRoom";
import ParticipantList from "@/components/custom/ParticipantList";
import QuestionDemo from "@/components/custom/QuestionDemo";

export default function Home() {
  return (
    <div className="flex flex-row items-center justify-between">
      <CreateRoom />
      <ParticipantList />
      <QuestionDemo />
    </div>
  );
}
