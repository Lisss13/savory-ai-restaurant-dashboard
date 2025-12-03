'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  MessageSquare,
  Armchair,
  UtensilsCrossed,
  Plus,
  QrCode,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth';
import { useRestaurantStore } from '@/store/restaurant';
import { restaurantApi, reservationApi, chatApi, dishApi, tableApi } from '@/lib/api';
import type { Restaurant, Reservation, ChatSession, Dish, Table } from '@/types';
import { useTranslation } from '@/i18n';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend !== undefined && (
              <>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
              </>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { organization } = useAuthStore();
  const { selectedRestaurant, setSelectedRestaurant, setRestaurants } = useRestaurantStore();
  const { t } = useTranslation();

  const { data: restaurantsData, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurants', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const response = await restaurantApi.getByOrganization(organization.id);
      return response.data.restaurants;
    },
    enabled: !!organization?.id,
  });

  useEffect(() => {
    if (restaurantsData) {
      setRestaurants(restaurantsData);
      if (!selectedRestaurant && restaurantsData.length > 0) {
        setSelectedRestaurant(restaurantsData[0]);
      }
    }
  }, [restaurantsData, selectedRestaurant, setRestaurants, setSelectedRestaurant]);

  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: chatSessions, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      return response.data.sessions;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await tableApi.getByRestaurant(selectedRestaurant.id);
      return response.data.tables;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: dishes, isLoading: dishesLoading } = useQuery({
    queryKey: ['dishes', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await dishApi.getByRestaurant(selectedRestaurant.id);
      return response.data.dishes;
    },
    enabled: !!selectedRestaurant,
  });

  const todayReservations = reservations?.filter((r: Reservation) => {
    const today = new Date().toISOString().split('T')[0];
    return r.reservation_date === today;
  }) || [];

  const activeChats = chatSessions?.filter((c: ChatSession) => c.active) || [];

  const recentReservations = reservations?.slice(0, 5) || [];

  const isLoading = restaurantsLoading || reservationsLoading || chatsLoading || tablesLoading || dishesLoading;

  return (
    <>
      <Header breadcrumbs={[{ title: t.nav.dashboard }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
            <p className="text-muted-foreground">
              {t.dashboard.welcomeBack}, {organization?.name || t.common.user}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/qr-codes">
                <QrCode className="mr-2 h-4 w-4" />
                {t.dashboard.qrCode}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/menu/dishes/new">
                <Plus className="mr-2 h-4 w-4" />
                {t.dashboard.addDish}
              </Link>
            </Button>
          </div>
        </div>

        {!selectedRestaurant && !restaurantsLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.dashboard.noRestaurants}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {t.dashboard.createFirstRestaurant}
              </p>
              <Button asChild>
                <Link href="/dashboard/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.createRestaurant}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(selectedRestaurant || restaurantsLoading) && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title={t.dashboard.todayReservations}
                value={todayReservations.length}
                description={t.dashboard.last7Days}
                icon={<CalendarDays className="h-4 w-4" />}
                trend={12}
                loading={isLoading}
              />
              <StatCard
                title={t.dashboard.activeChats}
                value={activeChats.length}
                description={t.dashboard.awaitingResponse}
                icon={<MessageSquare className="h-4 w-4" />}
                loading={isLoading}
              />
              <StatCard
                title={t.dashboard.tables}
                value={`${todayReservations.length}/${tables?.length || 0}`}
                description={t.dashboard.bookedToday}
                icon={<Armchair className="h-4 w-4" />}
                loading={isLoading}
              />
              <StatCard
                title={t.dashboard.menuItems}
                value={dishes?.length || 0}
                description={t.dashboard.activeItems}
                icon={<UtensilsCrossed className="h-4 w-4" />}
                loading={isLoading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t.dashboard.recentReservations}</CardTitle>
                    <CardDescription>
                      {t.dashboard.last5Reservations}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/reservations/list">
                      {t.common.all}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : recentReservations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.dashboard.noReservations}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentReservations.map((reservation: Reservation) => (
                        <div
                          key={reservation.id}
                          className="flex items-center gap-4"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {reservation.customer_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.reservation_date} {reservation.start_time} • {reservation.guest_count} {t.common.guests}
                            </p>
                          </div>
                          <Badge
                            variant={
                              reservation.status === 'confirmed'
                                ? 'default'
                                : reservation.status === 'pending'
                                ? 'secondary'
                                : reservation.status === 'cancelled'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {reservation.status === 'confirmed' && t.reservations.confirmed}
                            {reservation.status === 'pending' && t.reservations.pending}
                            {reservation.status === 'cancelled' && t.reservations.cancelled}
                            {reservation.status === 'completed' && t.reservations.completed}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t.dashboard.activeChats}</CardTitle>
                    <CardDescription>
                      {t.dashboard.lastMessages}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/chats/active">
                      {t.common.all}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeChats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.dashboard.noActiveChats}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeChats.slice(0, 5).map((session: ChatSession) => (
                        <Link
                          key={session.id}
                          href={`/dashboard/chats/${session.id}`}
                          className="flex items-center gap-4 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {session.table?.name || t.dashboard.restaurantChat}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.messages?.[session.messages.length - 1]?.content || t.dashboard.noMessages}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
