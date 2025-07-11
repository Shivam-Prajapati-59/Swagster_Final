"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Room context interface
interface RoomContextType {
  roomId: string | null;
  username: string | null;
  isInRoom: boolean;
  setRoomData: (roomId: string, username: string) => void;
  clearRoomData: () => void;
}

// Create context
const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Provider component
export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  const setRoomData = (newRoomId: string, newUsername: string) => {
    setRoomId(newRoomId);
    setUsername(newUsername);
    setIsInRoom(true);
  };

  const clearRoomData = () => {
    setRoomId(null);
    setUsername(null);
    setIsInRoom(false);
  };

  return (
    <RoomContext.Provider
      value={{
        roomId,
        username,
        isInRoom,
        setRoomData,
        clearRoomData,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

// Custom hook to use room context
export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
