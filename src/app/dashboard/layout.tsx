'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useAuthStore } from '@/store/auth';
import { useRestaurantStore } from '@/store/restaurant';
import { useSubscriptionStore } from '@/store/subscription';
import { restaurantApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, checkAuth, organization } = useAuthStore();
  const { setRestaurants, setSelectedRestaurant, selectedRestaurant } = useRestaurantStore();
  const { fetchActiveSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        await checkAuth();
        setIsLoading(false);
      } catch {
        router.push('/login');
      }
    };

    verifyAuth();
  }, [checkAuth, router]);

  useEffect(() => {
    const loadRestaurants = async () => {
      if (!organization?.id) return;

      try {
        const response = await restaurantApi.getByOrganization(organization.id);
        const restaurants = response.data.restaurants;
        setRestaurants(restaurants);

        if (!selectedRestaurant && restaurants.length > 0) {
          setSelectedRestaurant(restaurants[0]);
        }
      } catch (error) {
        console.error('Failed to load restaurants:', error);
      }
    };

    loadRestaurants();
  }, [organization?.id, setRestaurants, setSelectedRestaurant, selectedRestaurant]);

  // Load subscription data
  useEffect(() => {
    if (organization?.id) {
      fetchActiveSubscription(organization.id);
    }
  }, [organization?.id, fetchActiveSubscription]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
