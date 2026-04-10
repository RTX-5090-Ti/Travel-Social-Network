import { useContext } from "react";

import { ChatContext } from "./chat-context";

export function useChat() {
  const ctx = useContext(ChatContext);

  if (!ctx) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return ctx;
}
