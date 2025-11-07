import { RotateCcw, Play, Edit2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { chatStorage, type StoredMessage } from '@/lib/services/local-storage';
import { useChat } from '@/contexts/chat-context';

interface MessageActionsProps {
  message: StoredMessage;
  messageIndex: number;
  onContinue?: () => void;
  onRetry?: () => void;
  onEdit?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  isLoading?: boolean;
}

export function MessageActions({
  message,
  messageIndex,
  onContinue,
  onRetry,
  onEdit,
  onNavigate,
  isLoading = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const { chatId } = useChat();
  const [siblings, setSiblings] = useState<StoredMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!chatId) return;
    const { siblings: sibs, currentIndex: idx } = chatStorage.getSiblings(chatId, message.id);
    setSiblings(sibs);
    setCurrentIndex(idx);
  }, [chatId, message.id, message.content]);
  
  const hasVariants = siblings.length > 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < siblings.length - 1;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? 'Copied!' : 'Copy message'}</TooltipContent>
      </Tooltip>

      {message.role === 'assistant' && onContinue && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onContinue}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <Play className="size-3.5 mr-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Continue generation</TooltipContent>
        </Tooltip>
      )}

      {message.role === 'assistant' && onRetry && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RotateCcw className="size-3.5 mr-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Retry generation</TooltipContent>
        </Tooltip>
      )}

      {message.role === 'user' && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={isLoading}
              className="h-7 px-2 text-xs"
            >
              <Edit2 className="size-3.5 mr-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      )}

      {hasVariants && onNavigate && (
        <>
          <div className="h-4 w-px bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev || isLoading}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous variant</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground px-1">
            {currentIndex + 1}/{siblings.length}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={!hasNext || isLoading}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next variant</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
