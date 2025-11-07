"use client";

import React from "react";
import dynamic from "next/dynamic";
import ChatInputForm from "@/components/ChatInputForm";
import { useChatInput } from "@/components/Chat";

const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

export default function ChatPanel() {
  const { 
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
  } = useChatInput();

  return (
    <>
      <div className="overflow-y-scroll flex-1">
        <div className="top-0 right-8 sticky h-4 bg-gradient-to-b dark:from-[#30242A] from-[#FFFBF5] to-transparent z-20" />
        <div className="flex flex-col">
          <Chat
            messages={messages}
            isLoading={isLoading}
            onContinue={handleContinue}
            onRetry={handleRetry}
            onEditStart={handleEdit}
            editingMessageId={editingMessageId}
            editingDraft={editingDraft}
            setEditingDraft={setEditingDraft}
            onEditCancel={handleEditCancel}
            onEditSubmit={handleEditSubmit}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
      <div className="px-4 pb-4">
        <ChatInputForm
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          inputRef={inputRef}
          onStop={handleStop}
        />
      </div>
    </>
  );
}
