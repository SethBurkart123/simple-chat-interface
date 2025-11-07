import React, { KeyboardEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";
import clsx from "clsx";
import { motion } from 'framer-motion';

interface ChatInputFormProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onStop?: () => void;
}

const MAX_HEIGHT = 200;

const ChatInputForm: React.FC<ChatInputFormProps> = React.memo(({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  inputRef,
  onStop,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form && input.trim()) {
        form.requestSubmit();
      }
    }
  };

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();

    const resizeObserver = new ResizeObserver(adjustHeight);
    resizeObserver.observe(textarea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [input, inputRef]);

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={clsx(
        "relative flex flex-col items-center gap-2 rounded-3xl max-w-4xl mx-auto border border-border bg-card px-4 py-3 shadow-lg",
        "max-h-[calc(200px+4rem)]",
        "chat-input-form",
      )}
    >
      <div className="w-full min-h-[40px] max-h-[200px]">
        <textarea
          ref={inputRef}
          className={clsx(
            "w-full flex-1 border-none bg-transparent pt-2 px-1 text-lg shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground resize-none h-full",
            "min-h-[40px] max-h-[200px] overflow-y-auto",
            "query-input",
          )}
          placeholder="Ask anything"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </div>

      <div className="flex w-full items-center gap-2 pt-2">
        <div className="flex-1" />

        {isLoading ? (
          <Button
            type="button"
            size="icon"
            onClick={onStop}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Square className="size-4" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className={clsx(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
              input.trim() ? "opacity-100" : "cursor-not-allowed opacity-50"
            )}
            disabled={!input.trim()}
          >
            <ArrowUp className="size-5.5" />
          </Button>
        )}
      </div>
    </motion.form>
  );
});

ChatInputForm.displayName = 'ChatInputForm';

export default ChatInputForm;
