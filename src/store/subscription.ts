import { create } from 'zustand';
import type { Subscription } from '@/types';
import { subscriptionApi } from '@/lib/api';

interface SubscriptionState {
  activeSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;

  fetchActiveSubscription: (organizationId: number) => Promise<void>;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  activeSubscription: null,
  isLoading: false,
  error: null,

  fetchActiveSubscription: async (organizationId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await subscriptionApi.getActive(organizationId);
      set({ activeSubscription: response.data, isLoading: false });
    } catch {
      set({ activeSubscription: null, isLoading: false, error: 'Failed to fetch subscription' });
    }
  },

  clearSubscription: () => {
    set({ activeSubscription: null, isLoading: false, error: null });
  },
}));
