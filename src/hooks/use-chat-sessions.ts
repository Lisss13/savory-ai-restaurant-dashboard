import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import type { ChatSession } from '@/types';

/**
 * Custom hook for fetching chat sessions for a restaurant
 * @param restaurantId The ID of the restaurant
 * @param refetchInterval Optional refetch interval in milliseconds (default: 10000)
 * @returns Query result with sessions data and loading state
 */
export function useChatSessions(restaurantId: number | null, refetchInterval = 10000) {
  return useQuery({
    queryKey: ['chatSessions', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const response = await chatApi.getRestaurantSessions(restaurantId);
      return response.data.sessions || [];
    },
    enabled: !!restaurantId,
    refetchInterval,
  });
}