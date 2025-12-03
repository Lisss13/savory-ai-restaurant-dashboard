'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Banknote,
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
import { restaurantApi, tableApi, reservationApi, chatApi, getImageUrl } from '@/lib/api';
import { useTranslation } from '@/i18n';
import { useLanguageStore } from '@/store/language';
import type { Table, Reservation, ChatSession } from '@/types';

export default function RestaurantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = Number(params.id);
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const dateLocale = language === 'ru' ? ruLocale : enUS;

  const DAYS_OF_WEEK = [
    { value: 0, label: t.restaurantDetail.sunday, short: t.restaurantDetail.sundayShort },
    { value: 1, label: t.restaurantDetail.monday, short: t.restaurantDetail.mondayShort },
    { value: 2, label: t.restaurantDetail.tuesday, short: t.restaurantDetail.tuesdayShort },
    { value: 3, label: t.restaurantDetail.wednesday, short: t.restaurantDetail.wednesdayShort },
    { value: 4, label: t.restaurantDetail.thursday, short: t.restaurantDetail.thursdayShort },
    { value: 5, label: t.restaurantDetail.friday, short: t.restaurantDetail.fridayShort },
    { value: 6, label: t.restaurantDetail.saturday, short: t.restaurantDetail.saturdayShort },
  ];

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

    if (!todayHours) return false;

    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  };

  const getTodayReservationsCount = () => {
    if (!reservations) return 0;
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter((r: Reservation) => r.reservation_date === today && r.status !== 'cancelled').length;
  };

  const getActiveChatsCount = () => {
    if (!chatSessions) return 0;
    return chatSessions.filter((s: ChatSession) => s.active === true).length;
  };

  if (isLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.restaurants, href: '/dashboard/restaurants' },
            { title: t.restaurantDetail.loading },
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
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.restaurants, href: '/dashboard/restaurants' },
            { title: t.restaurantDetail.notFound },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t.restaurantDetail.restaurantNotFound}
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
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.restaurants, href: '/dashboard/restaurants' },
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
                  {isOpen() ? t.restaurantDetail.open : t.restaurantDetail.closed}
                </Badge>
              </div>
              <p className="text-muted-foreground">{restaurant.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/qr-codes?restaurant=${restaurantId}`}>
                <QrCode className="mr-2 h-4 w-4" />
                {t.restaurantDetail.qrCode}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/restaurants/${restaurantId}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                {t.restaurantDetail.settings}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/restaurants/${restaurantId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.restaurantDetail.edit}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.restaurantDetail.tables}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t.restaurantDetail.totalSeats}: {tables?.reduce((acc: number, tbl: Table) => acc + tbl.guestCount, 0) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.restaurantDetail.reservationsToday}</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTodayReservationsCount()}</div>
              <p className="text-xs text-muted-foreground">
                {t.restaurantDetail.total}: {reservations?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.restaurantDetail.activeChats}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveChatsCount()}</div>
              <p className="text-xs text-muted-foreground">
                {t.restaurantDetail.totalSessions}: {chatSessions?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.restaurantDetail.organization}</CardTitle>
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
              <CardTitle>{t.restaurantDetail.restaurantInfo}</CardTitle>
              <CardDescription>{t.restaurantDetail.basicDataAndContacts}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {restaurant.image_url && (
                <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={getImageUrl(restaurant.image_url)}
                    alt={restaurant.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              {restaurant.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t.restaurantDetail.description}</h4>
                  <p className="text-muted-foreground">{restaurant.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">{t.restaurantDetail.address}</h4>
                    <p className="text-muted-foreground">{restaurant.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">{t.restaurantDetail.phone}</h4>
                    <p className="text-muted-foreground">{restaurant.phone}</p>
                  </div>
                </div>
                {restaurant.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">{t.restaurantDetail.website}</h4>
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
                    <h4 className="text-sm font-medium">{t.restaurantDetail.createdAt}</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(restaurant.created_at), 'd MMMM yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">{t.restaurantDetail.currency}</h4>
                    <p className="text-muted-foreground">{restaurant.currency || 'RUB'}</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.restaurantDetail.workingSchedule}
              </CardTitle>
              <CardDescription>{t.restaurantDetail.workingHoursDesc}</CardDescription>
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
                            {t.restaurantDetail.today}
                          </Badge>
                        )}
                      </span>
                      {isClosed ? (
                        <span className="text-muted-foreground text-sm">{t.restaurantDetail.dayOff}</span>
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
            <CardTitle>{t.restaurantDetail.quickActions}</CardTitle>
            <CardDescription>{t.restaurantDetail.quickActionsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/tables">
                  <Users className="h-6 w-6 mb-2" />
                  <span>{t.restaurantDetail.tableManagement}</span>
                  <span className="text-xs text-muted-foreground">{tables?.length || 0} {t.restaurantDetail.tablesCount}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/reservations/list">
                  <CalendarDays className="h-6 w-6 mb-2" />
                  <span>{t.restaurantDetail.reservations}</span>
                  <span className="text-xs text-muted-foreground">{getTodayReservationsCount()} {t.restaurantDetail.todaySuffix}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/chats/active">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span>{t.restaurantDetail.chats}</span>
                  <span className="text-xs text-muted-foreground">{getActiveChatsCount()} {t.restaurantDetail.activeCount}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/dashboard/menu/dishes">
                  <UtensilsCrossed className="h-6 w-6 mb-2" />
                  <span>{t.restaurantDetail.menu}</span>
                  <span className="text-xs text-muted-foreground">{t.restaurantDetail.dishManagement}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
