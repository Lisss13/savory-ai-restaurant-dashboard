import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Restaurant } from '@/types';

interface RestaurantState {
  selectedRestaurant: Restaurant | null;
  restaurants: Restaurant[];

  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  clearSelectedRestaurant: () => void;
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      selectedRestaurant: null,
      restaurants: [],

      setSelectedRestaurant: (restaurant) => {
        set({ selectedRestaurant: restaurant });
      },

      setRestaurants: (restaurants) => {
        set({ restaurants });
      },

      clearSelectedRestaurant: () => {
        set({ selectedRestaurant: null });
      },
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({
        selectedRestaurant: state.selectedRestaurant,
      }),
    }
  )
);
