'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Users, Clock, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reservationApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Reservation } from '@/types';

export default function ReservationsAnalyticsPage() {
  const { selectedRestaurant } = useRestaurantStore();
  const [period, setPeriod] = useState('30');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id, 'analytics', period],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations || [];
    },
    enabled: !!selectedRestaurant,
  });

  // Calculate metrics
  const totalReservations = reservations?.length || 0;
  const avgGuestCount = reservations?.length
    ? Math.round(reservations.reduce((sum: number, r: Reservation) => sum + (r.guest_count || 0), 0) / reservations.length)
    : 0;

  // Time distribution
  const timeDistribution = reservations?.reduce((acc: Record<string, number>, r: Reservation) => {
    const hour = r.time?.split(':')[0] || '12';
    const key = `${hour}:00`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const timeData = Object.entries(timeDistribution)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Day of week distribution
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayDistribution = reservations?.reduce((acc: Record<number, number>, r: Reservation) => {
    const day = new Date(r.date).getDay();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  const dayData = dayNames.map((name, index) => ({
    day: name,
    count: dayDistribution[index] || 0,
  }));

  // Top guests (mock data since we don't have guest tracking)
  const guestStats = reservations?.reduce((acc: Record<string, { name: string; phone: string; visits: number }>, r: Reservation) => {
    const key = r.guest_phone || '';
    if (!acc[key]) {
      acc[key] = { name: r.guest_name || 'Гость', phone: r.guest_phone || '', visits: 0 };
    }
    acc[key].visits++;
    return acc;
  }, {} as Record<string, { name: string; phone: string; visits: number }>) || {};

  const topGuests = Object.values(guestStats)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  if (!selectedRestaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Аналитика' },
            { title: 'Бронирования' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Выберите ресторан для просмотра аналитики
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
          { title: 'Аналитика' },
          { title: 'Бронирования' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Аналитика бронирований</h1>
            <p className="text-muted-foreground">
              Детальная статистика по бронированиям
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Последние 7 дней</SelectItem>
              <SelectItem value="30">Последние 30 дней</SelectItem>
              <SelectItem value="90">Последние 90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Всего бронирований
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalReservations}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Среднее кол-во гостей
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{avgGuestCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Пиковое время
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {timeData.length > 0
                    ? timeData.reduce((max, curr) => (curr.count > max.count ? curr : max), timeData[0]).time
                    : '—'}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Конверсия
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">78%</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Распределение по времени</CardTitle>
              <CardDescription>
                Популярные часы для бронирований
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Бронирования" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Загруженность по дням недели</CardTitle>
              <CardDescription>
                Популярные дни для посещения
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" name="Бронирования" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Топ гостей</CardTitle>
            <CardDescription>
              Постоянные посетители
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topGuests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Нет данных о гостях
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Гость</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead className="text-right">Визитов</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topGuests.map((guest, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.phone || '—'}</TableCell>
                      <TableCell className="text-right">{guest.visits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
