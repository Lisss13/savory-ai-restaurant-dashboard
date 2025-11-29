'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reservationApi, tableApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Reservation, Table } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  cancelled: 'bg-red-500',
  completed: 'bg-green-500',
  no_show: 'bg-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
  completed: 'Завершено',
  no_show: 'Не явился',
};

export default function ReservationsCalendarPage() {
  const { selectedRestaurant } = useRestaurantStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: reservations, isLoading: isReservationsLoading } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations || [];
    },
    enabled: !!selectedRestaurant,
  });

  const { data: tables, isLoading: isTablesLoading } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await tableApi.getByRestaurant(selectedRestaurant.id);
      return response.data.tables || [];
    },
    enabled: !!selectedRestaurant,
  });

  const isLoading = isReservationsLoading || isTablesLoading;

  const filteredReservations = reservations?.filter((r: Reservation) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  }) || [];

  const getReservationsForDayAndTable = (date: Date, tableId: number) => {
    return filteredReservations.filter((r: Reservation) => {
      const reservationDate = new Date(r.date);
      return isSameDay(reservationDate, date) && r.table?.id === tableId;
    });
  };

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (!selectedRestaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Бронирования' },
            { title: 'Календарь' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Выберите ресторан для просмотра календаря бронирований
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
          { title: 'Бронирования' },
          { title: 'Календарь' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Календарь бронирований</h1>
            <p className="text-muted-foreground">
              Визуальное расписание бронирований по столам
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="confirmed">Подтверждено</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
                <SelectItem value="no_show">Не явился</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(weekStart, 'd MMMM', { locale: ru })} — {format(weekEnd, 'd MMMM yyyy', { locale: ru })}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Сегодня
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-left min-w-[120px]">Стол</th>
                      {weekDays.map((day) => (
                        <th
                          key={day.toISOString()}
                          className={`border p-2 text-center min-w-[140px] ${
                            isSameDay(day, new Date()) ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          <div className="font-medium">
                            {format(day, 'EEEEEE', { locale: ru })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(day, 'd MMM', { locale: ru })}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tables?.map((table: Table) => (
                      <tr key={table.id}>
                        <td className="border p-2 font-medium bg-muted/50">
                          {table.name}
                          <div className="text-xs text-muted-foreground">
                            до {table.guestCount} чел.
                          </div>
                        </td>
                        {weekDays.map((day) => {
                          const dayReservations = getReservationsForDayAndTable(day, table.id);
                          return (
                            <td
                              key={day.toISOString()}
                              className={`border p-1 align-top ${
                                isSameDay(day, new Date()) ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="space-y-1 min-h-[60px]">
                                {dayReservations.map((reservation: Reservation) => (
                                  <div
                                    key={reservation.id}
                                    className={`text-xs p-1 rounded text-white ${
                                      STATUS_COLORS[reservation.status] || 'bg-gray-500'
                                    }`}
                                  >
                                    <div className="font-medium">{reservation.time}</div>
                                    <div className="truncate">{reservation.guest_name}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <Badge
              key={status}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
              {label}
            </Badge>
          ))}
        </div>
      </main>
    </>
  );
}
