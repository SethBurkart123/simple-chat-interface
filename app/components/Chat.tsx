"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@/contexts/chat-context";
import ChatMessageList from "./ChatMessageList";
import { openai } from "@/lib/services/openai";
import { chatStorage, StoredMessage } from "@/lib/services/local-storage";
import { generateUUID } from "@/lib/utils";

interface ChatProps {
  messages: StoredMessage[];
  isLoading: boolean;
  onContinue: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onEditStart: (messageId: string) => void;
  editingMessageId: string | null;
  editingDraft: string;
  setEditingDraft: (val: string) => void;
  onEditCancel: () => void;
  onEditSubmit: () => void;
  onNavigate: (messageIndex: number, direction: 'prev' | 'next') => void;
}

export default function Chat({ 
  messages, 
  isLoading, 
  onContinue,
  onRetry,
  onEditStart,
  editingMessageId,
  editingDraft,
  setEditingDraft,
  onEditCancel,
  onEditSubmit,
  onNavigate,
}: ChatProps) {

  return (
    <div className="flex-1 px-4 py-6 max-w-[50rem] w-full mx-auto">
      <ChatMessageList 
        messages={messages}
        isLoading={isLoading}
        onContinue={onContinue}
        onRetry={onRetry}
        onEditStart={onEditStart}
        editingMessageId={editingMessageId}
        editingDraft={editingDraft}
        setEditingDraft={setEditingDraft}
        onEditCancel={onEditCancel}
        onEditSubmit={onEditSubmit}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function useChatInput() {
  const { chatId, refreshChats } = useChat();

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateWindowTitle = useCallback((messages: StoredMessage[]) => {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.length > 40 
        ? firstUserMessage.content.substring(0, 40) + '...'
        : firstUserMessage.content;
      document.title = title;
    } else {
      document.title = 'New Chat';
    }
  }, []);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      document.title = 'New Chat';
      return;
    }
    
    const branch = chatStorage.getActiveBranch(chatId);
    setMessages(branch);
    updateWindowTitle(branch);
  }, [chatId, updateWindowTitle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const streamResponse = async (
    conversationHistory: StoredMessage[],
    currentChatId: string | null,
    onUpdate: (content: string) => void
  ): Promise<string> => {
    const openaiMessages = conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await openai.streamChat(openaiMessages);
    
    let fullContent = '';
    
    return new Promise((resolve, reject) => {
      openai.parseStream(
        response,
        (chunk) => {
          fullContent += chunk;
          onUpdate(fullContent);
        },
        () => resolve(fullContent),
        (error) => reject(error)
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    let currentChatId = chatId;
    const userMessageContent = input.trim();

    const parentId = messages.length > 0 ? messages[messages.length - 1].id : null;

    const userMessage: StoredMessage = {
      id: generateUUID(),
      role: "user",
      content: userMessageContent,
      createdAt: new Date().toISOString(),
      parentMessageId: parentId,
    };

    const assistantMessageId = generateUUID();
    const assistantMessage: StoredMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      parentMessageId: userMessage.id,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const conversationHistory = [...messages, userMessage];
      
      const fullContent = await streamResponse(
        conversationHistory,
        currentChatId,
        (content) => {
          setMessages(prev => {
            const withoutLast = prev.filter(m => m.id !== assistantMessageId);
            return [
              ...withoutLast,
              { ...assistantMessage, content },
            ];
          });
        }
      );

      assistantMessage.content = fullContent;

      if (!currentChatId) {
        const newChat = chatStorage.createChat(chatStorage.generateTitle(userMessageContent));
        currentChatId = newChat.id;
        window.history.replaceState(null, '', `/?chatId=${currentChatId}`);
        refreshChats();
      }

      chatStorage.addMessage(currentChatId, userMessage);
      chatStorage.addMessage(currentChatId, assistantMessage);
      
      const branch = chatStorage.getActiveBranch(currentChatId);
      setMessages(branch);
      
      // Update window title with first user message
      updateWindowTitle(branch);

    } catch (error) {
      console.error("Error streaming chat:", error);
      const errorMessage: StoredMessage = {
        id: generateUUID(),
        role: "assistant",
        content: "Sorry, there was an error processing your request: " + error,
        parentMessageId: parentId,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => {
        const withoutLast = prev.filter(m => m.id !== assistantMessageId);
        return [...withoutLast, errorMessage];
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleContinue = useCallback(async (messageId: string) => {
    if (!chatId) return;

    setIsLoading(true);
    
    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const conversationHistory = messages.slice(0, messageIndex + 1);
      
      await streamResponse(
        conversationHistory,
        chatId,
        (content) => {
          setMessages(prev =>
            prev.map(m => m.id === messageId ? { ...m, content } : m)
          );
        }
      );

      const branch = chatStorage.getActiveBranch(chatId);
      setMessages(branch);
      updateWindowTitle(branch);
    } catch (error) {
      console.error('Failed to continue message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, messages, updateWindowTitle]);

  const handleRetry = useCallback(async (messageId: string) => {
    if (!chatId) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const messageToRetry = messages[messageIndex];
    const newMessageId = generateUUID();
    const newMessage: StoredMessage = {
      id: newMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      parentMessageId: messageToRetry.parentMessageId,
    };

    setMessages(prev => [
      ...prev.slice(0, messageIndex),
      newMessage,
    ]);

    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(0, messageIndex);
      
      const fullContent = await streamResponse(
        conversationHistory,
        chatId,
        (content) => {
          setMessages(prev => {
          const updated = [...prev];
            const idx = updated.findIndex(m => m.id === newMessageId);
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], content };
            }
          return updated;
          });
        }
      );

      newMessage.content = fullContent;
      
      chatStorage.addMessage(chatId, newMessage);

      const branch = chatStorage.getActiveBranch(chatId);
      setMessages(branch);
      updateWindowTitle(branch);
    } catch (error) {
      console.error('Failed to retry message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, messages, updateWindowTitle]);

  const handleEdit = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.role !== 'user') return;

    setEditingDraft(msg.content);
    setEditingMessageId(messageId);
  }, [messages]);

  const handleEditCancel = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft("");
  }, []);

  const handleEditSubmit = useCallback(async () => {
    const messageId = editingMessageId;
    const newContent = editingDraft.trim();
    if (!messageId || !newContent || !chatId) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const originalMessage = messages[messageIndex];
    
    // Check if content changed
    if (originalMessage.content === newContent) {
      setEditingMessageId(null);
      return;
    }

    const userMsgId = generateUUID();
    const assistantTempId = generateUUID();

    const userMessage: StoredMessage = {
      id: userMsgId,
      role: 'user',
      content: newContent,
      createdAt: new Date().toISOString(),
      parentMessageId: originalMessage.parentMessageId,
    };

    const assistantMessage: StoredMessage = {
      id: assistantTempId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      parentMessageId: userMessage.id,
    };

    setMessages(prev => {
      const updated = [...prev];
      updated[messageIndex] = userMessage;
      return [...updated.slice(0, messageIndex + 1), assistantMessage];
    });

    setEditingMessageId(null);
    setIsLoading(true);

    try {
      const conversationHistory = [
        ...messages.slice(0, messageIndex),
        userMessage,
      ];
      
      const fullContent = await streamResponse(
        conversationHistory,
        chatId,
        (content) => {
          setMessages(prev => {
          const updated = [...prev];
            const idx = updated.findIndex(m => m.id === assistantTempId);
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], content };
            }
          return updated;
          });
        }
      );

      assistantMessage.content = fullContent;

      chatStorage.addMessage(chatId, userMessage);
      chatStorage.addMessage(chatId, assistantMessage);

      const branch = chatStorage.getActiveBranch(chatId);
      setMessages(branch);
      updateWindowTitle(branch);
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, editingDraft, editingMessageId, messages, updateWindowTitle]);

  const handleStop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const handleNavigate = useCallback((messageIndex: number, direction: 'prev' | 'next') => {
    if (!chatId) return;
    
    const message = messages[messageIndex];
    if (!message) return;
    
    chatStorage.switchToSibling(chatId, message.id, direction);
    
    const branch = chatStorage.getActiveBranch(chatId);
    setMessages([...branch]);
    updateWindowTitle(branch);
  }, [chatId, messages, updateWindowTitle]);

  return {
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    inputRef,
    messages,
    handleStop,
    handleContinue,
    handleRetry,
    handleEdit,
    editingMessageId,
    editingDraft,
    setEditingDraft,
    handleEditCancel,
    handleEditSubmit,
    handleNavigate,
  };
}
