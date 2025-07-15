"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Room context interface
interface RoomContextType {
  roomId: string | null;
  username: string | null;
  isInRoom: boolean;
  isAdmin: boolean;
  setRoomData: (roomId: string, username: string, isAdmin?: boolean) => void;
  clearRoomData: () => void;
}

// Create context
const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Provider component
export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const isInRoom = Boolean(roomId && username);

  const setRoomData = (
    newRoomId: string,
    newUsername: string,
    adminStatus: boolean = false
  ) => {
    setRoomId(newRoomId);
    setUsername(newUsername);
    setIsAdmin(adminStatus);
  };

  const clearRoomData = () => {
    setRoomId(null);
    setUsername(null);
    setIsAdmin(false);
  };

  return (
    <RoomContext.Provider
      value={{
        roomId,
        username,
        isInRoom,
        isAdmin,
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
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
