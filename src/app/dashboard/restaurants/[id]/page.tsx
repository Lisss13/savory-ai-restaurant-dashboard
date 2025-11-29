'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Pencil,
  Settings,
  QrCode,
  Users,
  CalendarDays,
  MessageSquare,
  UtensilsCrossed,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { restaurantApi, tableApi, reservationApi, chatApi } from '@/lib/api';
import type { Table, Reservation, ChatSession } from '@/types';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Воскресенье', short: 'Вс' },
  { value: 1, label: 'Понедельник', short: 'Пн' },
  { value: 2, label: 'Вторник', short: 'Вт' },
  { value: 3, label: 'Среда', short: 'Ср' },
  { value: 4, label: 'Четверг', short: 'Чт' },
  { value: 5, label: 'Пятница', short: 'Пт' },
  { value: 6, label: 'Суббота', short: 'Сб' },
];

export default function RestaurantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = Number(params.id);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const response = await restaurantApi.getById(restaurantId);
      return response.data;
    },
    enabled: !!restaurantId,
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      const response = await tableApi.getByRestaurant(restaurantId);
      return response.data.tables;
    },
    enabled: !!restaurantId,
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', restaurantId],
    queryFn: async () => {
      const response = await reservationApi.getByRestaurant(restaurantId);
      return response.data.reservations;
    },
    enabled: !!restaurantId,
  });

  const { data: chatSessions } = useQuery({
    queryKey: ['chatSessions', restaurantId],
    queryFn: async () => {
      const response = await chatApi.getRestaurantSessions(restaurantId);
      return response.data.sessions;
    },
    enabled: !!restaurantId,
  });

  const isOpen = () => {
    if (!restaurant) return false;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = restaurant.working_hours?.find(
      (h) => h.day_of_week === dayOfWeek
    );

    if (!todayHours || todayHours.is_closed) return false;

    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  };

  const getTodayReservationsCount = () => {
    if (!reservations) return 0;
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter((r: Reservation) => r.date === today && r.status !== 'cancelled').length;
  };

  const getActiveChatsCount = () => {
    if (!chatSessions) return 0;
    return chatSessions.filter((s: ChatSession) => s.status === 'active').length;
  };

  if (isLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Рестораны', href: '/dashboard/restaurants' },
            { title: 'Загрузка...' },
          ]}
        />
        <main className="flex-1 space-y-6 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px] lg:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </main>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Рестораны', href: '/dashboard/restaurants' },
            { title: 'Не найден' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ресторан не найден
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Рестораны', href: '/dashboard/restaurants' },
          { title: restaurant.name },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
                <Badge variant={isOpen() ? 'default' : 'secondary'}>
                  {isOpen() ? 'Открыто' : 'Закрыто'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{restaurant.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/qr-codes?restaurant=${restaurantId}`}>
                <QrCode className="mr-2 h-4 w-4" />
                QR-код
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/restaurants/${restaurantId}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/restaurants/${restaurantId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Столы</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Всего мест: {tables?.reduce((acc: number, t: Table) => acc + t.guestCount, 0) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Бронирований сегодня</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTodayReservationsCount()}</div>
              <p className="text-xs text-muted-foreground">
                Всего: {reservations?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные чаты</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveChatsCount()}</div>
              <p className="text-xs text-muted-foreground">
                Всего сессий: {chatSessions?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Организация</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{restaurant.organization?.name || '—'}</div>
              <p className="text-xs text-muted-foreground">
                {restaurant.organization?.phone || '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Информация о ресторане</CardTitle>
              <CardDescription>Основные данные и контакты</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {restaurant.image_url && (
                <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              {restaurant.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Описание</h4>
                  <p className="text-muted-foreground">{restaurant.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Адрес</h4>
                    <p className="text-muted-foreground">{restaurant.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Телефон</h4>
                    <p className="text-muted-foreground">{restaurant.phone}</p>
                  </div>
                </div>
                {restaurant.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Веб-сайт</h4>
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {restaurant.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Дата создания</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(restaurant.created_at), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>

              {(restaurant.reservation_duration || restaurant.min_reservation_time) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">Настройки бронирования</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {restaurant.reservation_duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Длительность брони:</span>
                          <span className="font-medium">{restaurant.reservation_duration} мин</span>
                        </div>
                      )}
                      {restaurant.min_reservation_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Мин. время до брони:</span>
                          <span className="font-medium">{restaurant.min_reservation_time} мин</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Расписание работы
              </CardTitle>
              <CardDescription>Часы работы ресторана</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = restaurant.working_hours?.find(
                    (h) => h.day_of_week === day.value
                  );
                  const isClosed = !hours;
                  const isToday = new Date().getDay() === day.value;

                  return (
                    <div
                      key={day.value}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                        isToday ? 'bg-muted' : ''
                      }`}
                    >
                      <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                        {day.label}
                        {isToday && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Сегодня
                          </Badge>
                        )}
                      </span>
                      {isClosed ? (
                        <span className="text-muted-foreground text-sm">Выходной</span>
                      ) : (
                        <span className="text-sm">
                          {hours.open_time} — {hours.close_time}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Перейдите к управлению рестораном</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/tables">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Управление столами</span>
                  <span className="text-xs text-muted-foreground">{tables?.length || 0} столов</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/reservations/list">
                  <CalendarDays className="h-6 w-6 mb-2" />
                  <span>Бронирования</span>
                  <span className="text-xs text-muted-foreground">{getTodayReservationsCount()} сегодня</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/chats/active">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span>Чаты</span>
                  <span className="text-xs text-muted-foreground">{getActiveChatsCount()} активных</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/menu/dishes">
                  <UtensilsCrossed className="h-6 w-6 mb-2" />
                  <span>Меню</span>
                  <span className="text-xs text-muted-foreground">Управление блюдами</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
