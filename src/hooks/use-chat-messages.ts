import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import type { ChatMessage } from '@/types';

/**
 * Custom hook for fetching chat messages for a specific session
 * @param sessionId The ID of the chat session
 * @param refetchInterval Optional refetch interval in milliseconds (default: 5000)
 * @returns Query result with messages data and loading state
 */
export function useChatMessages(sessionId: number | null, refetchInterval = 5000) {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await chatApi.getRestaurantSessionMessages(sessionId);
      // Handle both array directly and { messages: [...] } formats
      const data = response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.isArray(data) ? data : ((data as any)?.messages || []);
    },
    enabled: !!sessionId,
    refetchInterval,
  });
}