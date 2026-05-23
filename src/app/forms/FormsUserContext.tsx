"use client";

import { createContext, useContext, type ReactNode } from "react";

const FormsUserContext = createContext<string | null>(null);

export function FormsUserProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <FormsUserContext.Provider value={userId}>
      {children}
    </FormsUserContext.Provider>
  );
}

export function useFormsUserId(): string | null {
  return useContext(FormsUserContext);
}
