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

  const { data: restaurantsData, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await restaurantApi.getAll();
      return response.data.restaurants;
    },
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
    queryKey: ['dishes'],
    queryFn: async () => {
      const response = await dishApi.getAll();
      return response.data.dishes;
    },
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
      <Header breadcrumbs={[{ title: 'Дашборд' }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
            <p className="text-muted-foreground">
              Добро пожаловать, {organization?.name || 'Пользователь'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/qr-codes">
                <QrCode className="mr-2 h-4 w-4" />
                QR-код
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/menu/dishes/new">
                <Plus className="mr-2 h-4 w-4" />
                Добавить блюдо
              </Link>
            </Button>
          </div>
        </div>

        {!selectedRestaurant && !restaurantsLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет ресторанов</h3>
              <p className="text-muted-foreground text-center mb-4">
                Создайте свой первый ресторан, чтобы начать работу
              </p>
              <Button asChild>
                <Link href="/dashboard/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать ресторан
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(selectedRestaurant || restaurantsLoading) && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Бронирования сегодня"
                value={todayReservations.length}
                description="за последние 7 дней"
                icon={<CalendarDays className="h-4 w-4" />}
                trend={12}
                loading={isLoading}
              />
              <StatCard
                title="Активные чаты"
                value={activeChats.length}
                description="ожидают ответа"
                icon={<MessageSquare className="h-4 w-4" />}
                loading={isLoading}
              />
              <StatCard
                title="Столы"
                value={`${todayReservations.length}/${tables?.length || 0}`}
                description="забронировано сегодня"
                icon={<Armchair className="h-4 w-4" />}
                loading={isLoading}
              />
              <StatCard
                title="Блюда в меню"
                value={dishes?.length || 0}
                description="активных позиций"
                icon={<UtensilsCrossed className="h-4 w-4" />}
                loading={isLoading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Последние бронирования</CardTitle>
                    <CardDescription>
                      5 последних бронирований
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/reservations/list">
                      Все
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
                      Нет бронирований
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
                              {reservation.reservation_date} в {reservation.start_time} • {reservation.guest_count} гостей
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
                            {reservation.status === 'confirmed' && 'Подтверждено'}
                            {reservation.status === 'pending' && 'Ожидает'}
                            {reservation.status === 'cancelled' && 'Отменено'}
                            {reservation.status === 'completed' && 'Завершено'}
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
                    <CardTitle>Активные чаты</CardTitle>
                    <CardDescription>
                      Последние сообщения от посетителей
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/chats/active">
                      Все
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
                      Нет активных чатов
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
                              {session.table?.name || 'Чат ресторана'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.messages?.[session.messages.length - 1]?.content || 'Нет сообщений'}
                            </p>
                          </div>
                          {session.unreadCount && session.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full">
                              {session.unreadCount}
                            </Badge>
                          )}
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
