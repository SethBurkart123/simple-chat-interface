"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { chatStorage, StoredChat } from "@/lib/services/local-storage";

export interface ChatContextType {
  chatId: string;
  chatTitle: string;
  chatIds: string[];
  chats: Record<string, StoredChat>;
  startNewChat: () => void;
  switchChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  refreshChats: () => void;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [chats, setChats] = React.useState<Record<string, StoredChat>>({});
  const [currentChatId, setCurrentChatId] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadChats = React.useCallback(() => {
    const allChats = chatStorage.getAllChats();
    const chatsMap: Record<string, StoredChat> = {};
    allChats.forEach(chat => {
      chatsMap[chat.id] = chat;
    });
    setChats(chatsMap);
  }, []);

  React.useEffect(() => {
    loadChats();
    setIsLoaded(true);
  }, [loadChats]);

  React.useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    
    if (chatIdFromUrl && chatIdFromUrl !== currentChatId) {
      setCurrentChatId(chatIdFromUrl);
    } else if (!chatIdFromUrl && currentChatId) {
      setCurrentChatId('');
    }
  }, [searchParams, currentChatId]);

  const chatIds = React.useMemo(
    () => Object.keys(chats).sort((a, b) => {
      const chatA = chats[a];
      const chatB = chats[b];
      const timeA = new Date(chatA.updatedAt || chatA.createdAt || 0).getTime();
      const timeB = new Date(chatB.updatedAt || chatB.createdAt || 0).getTime();
      return timeB - timeA;
    }),
    [chats]
  );

  const chatTitle = React.useMemo(() => {
    if (!currentChatId || !chats[currentChatId]) {
      return "New Chat";
    }
    return chats[currentChatId].title;
  }, [currentChatId, chats]);

  const startNewChat = React.useCallback(() => {
    setCurrentChatId('');
    window.history.pushState(null, '', '/');
  }, []);

  const switchChat = React.useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    window.history.pushState(null, '', `/?chatId=${chatId}`);
  }, []);

  const deleteChat = React.useCallback((chatId: string) => {
    chatStorage.deleteChat(chatId);
    loadChats();
    if (currentChatId === chatId) {
      startNewChat();
    }
  }, [currentChatId, loadChats, startNewChat]);

  const renameChat = React.useCallback((chatId: string, title: string) => {
    chatStorage.updateChatTitle(chatId, title);
    loadChats();
  }, [loadChats]);

  const refreshChats = React.useCallback(() => {
    loadChats();
  }, [loadChats]);

  const value = React.useMemo<ChatContextType>(
    () => ({
      chatId: currentChatId,
      chatTitle,
      chatIds,
      chats,
      startNewChat,
      switchChat,
      deleteChat,
      renameChat,
      refreshChats,
    }),
    [
      currentChatId,
      chatTitle,
      chatIds,
      chats,
      startNewChat,
      switchChat,
      deleteChat,
      renameChat,
      refreshChats,
    ]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
