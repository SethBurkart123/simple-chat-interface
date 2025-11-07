"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { MessageActions } from "./MessageActions";
import "katex/dist/katex.min.css";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { StoredMessage } from "@/lib/services/local-storage";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  message?: StoredMessage;
  messageIndex: number;
  onContinue?: () => void;
  onRetry?: () => void;
  onEdit?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  isLoading?: boolean;
  isLastAssistantMessage?: boolean;
}

export default React.memo(function ChatMessage({
  role,
  content,
  isStreaming,
  message,
  messageIndex,
  onContinue,
  onRetry,
  onEdit,
  onNavigate,
  isLoading,
  isLastAssistantMessage,
}: ChatMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const existingIndicators = contentRef.current.querySelectorAll(
      ".inline-typewriter-indicator"
    );
    existingIndicators.forEach((el) => el.remove());

    if (isStreaming && content !== "") {
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.nodeValue?.trim() === "") return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let lastTextNode: Text | null = null;
      while (walker.nextNode()) {
        lastTextNode = walker.currentNode as Text;
      }

      if (lastTextNode && lastTextNode.parentNode) {
        const indicatorSpan = document.createElement("span");
        indicatorSpan.classList.add("inline-typewriter-indicator");

        if (lastTextNode.nextSibling) {
          lastTextNode.parentNode.insertBefore(
            indicatorSpan,
            lastTextNode.nextSibling
          );
        } else {
          lastTextNode.parentNode.appendChild(indicatorSpan);
        }
      }
    }

    return () => {
      if (contentRef.current) {
        const indicators = contentRef.current.querySelectorAll(
          ".inline-typewriter-indicator"
        );
        indicators.forEach((el) => el.remove());
      }
    };
  }, [isStreaming, content]);

  const showActions = !!message;

  return (
    <div
      className={clsx(
        "flex w-full group/message",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={`relative mb-2 ${role === "assistant" && "w-full"}`}>
        {role === "user" ? (
          <div className="rounded-3xl max-w-3xl text-base leading-relaxed bg-muted text-muted-foreground px-5 py-2.5 w-fit ml-auto">
            <p>{content}</p>
          </div>
        ) : (
          <div
            className={clsx(
              "rounded-3xl text-base leading-relaxed max-w-full min-w-0 text-card-foreground",
              "prose prose-zinc dark:prose-invert prose-p:my-2 prose-li:my-0.5 px-2 py-2.5 w-full"
            )}
          >
            <div
              ref={contentRef}
              className="relative assistant-message w-full prose !max-w-none dark:prose-invert prose-zinc"
            >
              {content === "" && isStreaming ? (
                <div className="inline-block">
                  <div className="size-[0.65rem] bg-primary rounded-full animate-pulse"></div>
                </div>
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </div>
          </div>
        )}
        
        {showActions && isStreaming !== true && (
          <div className={clsx(
            "flex items-center gap-1 transition-opacity duration-200 px-1 pointer-events-auto",
            role === "user" ? "justify-end" : "justify-start",
            role === "user"
              ? "opacity-0 group-hover/message:opacity-100 hover:opacity-100 focus-within:opacity-100"
              : isLastAssistantMessage
                ? "opacity-100"
                : "opacity-0 group-hover/message:opacity-100 hover:opacity-100 focus-within:opacity-100"
          )}>
            <MessageActions
              message={message!}
              messageIndex={messageIndex}
              onContinue={onContinue}
              onRetry={onRetry}
              onEdit={onEdit}
              onNavigate={onNavigate}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
});
