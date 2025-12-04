import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatApi } from '@/lib/api';

/**
 * Custom hook for chat-related mutations (sending messages, closing chats)
 * @param sessionId The ID of the chat session
 * @param options Configuration options
 * @returns Object containing mutation functions and states
 */
export function useChatMutations(
  sessionId: number,
  options: {
    onSendSuccess?: () => void;
    onSendError?: (error: Error) => void;
    onCloseSuccess?: () => void;
    onCloseError?: (error: Error) => void;
    errorMessages?: {
      sendError?: string;
      closeError?: string;
    };
  } = {}
) {
  const queryClient = useQueryClient();
  
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendRestaurantMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionReservations', sessionId] });
      if (options.onSendSuccess) {
        options.onSendSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error(options.errorMessages?.sendError || 'Failed to send message');
      if (options.onSendError) {
        options.onSendError(error);
      }
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => chatApi.closeRestaurantSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      if (options.onCloseSuccess) {
        options.onCloseSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error(options.errorMessages?.closeError || 'Failed to close chat');
      if (options.onCloseError) {
        options.onCloseError(error);
      }
    },
  });

  return {
    sendMessage: sendMutation.mutate,
    closeChat: closeMutation.mutate,
    isSending: sendMutation.isPending,
    isClosing: closeMutation.isPending,
  };
}