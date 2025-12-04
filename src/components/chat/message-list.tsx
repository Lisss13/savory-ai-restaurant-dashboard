import { useRef, useEffect } from 'react';
import {format, Locale} from 'date-fns';
import { User, Bot, Building2, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatMessage } from '@/types';

interface MessageListProps {
  messages?: ChatMessage[];
  isLoading?: boolean;
  emptyMessage?: string;
  autoScroll?: boolean;
  dateLocale?: Locale;
}

export function MessageList({
  messages = [],
  isLoading = false,
  emptyMessage = 'No messages',
  autoScroll = true,
  dateLocale,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const getMessageIcon = (authorType: string) => {
    switch (authorType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'restaurant':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageColor = (authorType: string) => {
    switch (authorType) {
      case 'user':
        return 'bg-muted';
      case 'bot':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'restaurant':
        return 'bg-green-100 dark:bg-green-900/20';
      default:
        return 'bg-muted';
    }
  };

  return (
    <ScrollArea className="flex-1 p-4">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-3/4" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.authorType !== 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.authorType === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getMessageIcon(msg.authorType)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${getMessageColor(
                  msg.authorType
                )}`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(msg.sentAt), 'HH:mm', dateLocale ? { locale: dateLocale } : undefined)}
                </p>
              </div>
              {msg.authorType !== 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={
                      msg.authorType === 'bot'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }
                  >
                    {getMessageIcon(msg.authorType)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );
}