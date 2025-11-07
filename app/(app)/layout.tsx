"use client";

import React from "react";
import { ChatProvider, useChat } from "@/contexts/chat-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function NewChatButton() {
  const { startNewChat } = useChat();
  
  return (
    <Button
      onClick={startNewChat}
      size="icon"
      className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full shadow-lg"
      variant="default"
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full">
      <NewChatButton />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <LayoutContent>{children}</LayoutContent>
    </ChatProvider>
  );
}
