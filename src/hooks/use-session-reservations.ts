import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '@/lib/api';
import type { Reservation } from '@/types';

/**
 * Custom hook for fetching reservations associated with a chat session
 * @param sessionId The ID of the chat session
 * @param refetchInterval Optional refetch interval in milliseconds (default: 10000)
 * @returns Query result with reservations data
 */
export function useSessionReservations(sessionId: number | null, refetchInterval = 10000) {
  return useQuery({
    queryKey: ['sessionReservations', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      try {
        const response = await reservationApi.getBySession(sessionId);
        return response.data.reservations || [];
      } catch {
        return [];
      }
    },
    enabled: !!sessionId,
    refetchInterval,
  });
}