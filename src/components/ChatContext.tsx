import React, { createContext, useContext, useState } from "react";

/** Shape of the global chat context */
interface ChatCtx {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

/** Default values (will be overwritten by provider) */
const ChatContext = createContext<ChatCtx>({
  unreadCount: 0,
  setUnreadCount: () => {},
});

/** Provider component you’ll wrap the whole app with */
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <ChatContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

/** Small helper so you can import just one hook */
export const useChatContext = () => useContext(ChatContext);
