import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuickReply {
  text: string;
  icon?: string;
}

interface MessageInputProps {
  onSend: (message: string) => void;
  quickReplies?: QuickReply[];
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
}

export function MessageInput({
  onSend,
  quickReplies = [],
  placeholder = 'Type a message...',
  disabled = false,
  inputClassName,
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message);
    setMessage('');
  };

  const handleQuickReply = (reply: string) => {
    if (disabled) return;
    onSend(reply);
  };

  return (
    <div className="p-4 border-t">
      {quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickReplies.map((reply) => (
            <Button
              key={reply.text}
              variant="outline"
              size="sm"
              onClick={() => handleQuickReply(reply.text)}
              disabled={disabled}
              className="text-xs"
            >
              {reply.icon && <span className="mr-1">{reply.icon}</span>}
              {reply.text}
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          className={inputClassName}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}