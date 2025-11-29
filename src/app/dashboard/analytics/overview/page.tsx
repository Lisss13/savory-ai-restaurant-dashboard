'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  CalendarDays,
  MessageSquare,
  Users,
  TrendingUp,
  TrendingDown,
  Armchair,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
import { reservationApi, chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, change, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20 mt-2" />
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
        {change !== undefined && (
          <p className={`text-xs flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(change)}% vs прошлый период
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsOverviewPage() {
  const { selectedRestaurant } = useRestaurantStore();
  const [period, setPeriod] = useState('7');

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(new Date(), parseInt(period)));

  const { data: reservations, isLoading: isReservationsLoading } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id, 'analytics', period],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations || [];
    },
    enabled: !!selectedRestaurant,
  });

  const { data: chatSessions, isLoading: isChatsLoading } = useQuery({
    queryKey: ['chatSessions', selectedRestaurant?.id, 'analytics', period],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      return response.data.sessions || [];
    },
    enabled: !!selectedRestaurant,
  });

  const isLoading = isReservationsLoading || isChatsLoading;

  // Calculate stats
  const totalReservations = reservations?.length || 0;
  const confirmedReservations = reservations?.filter((r: { status: string }) => r.status === 'confirmed').length || 0;
  const cancelledReservations = reservations?.filter((r: { status: string }) => r.status === 'cancelled').length || 0;
  const completedReservations = reservations?.filter((r: { status: string }) => r.status === 'completed').length || 0;
  const pendingReservations = reservations?.filter((r: { status: string }) => r.status === 'pending').length || 0;
  const totalChats = chatSessions?.length || 0;

  // Generate chart data
  const chartData = Array.from({ length: parseInt(period) }, (_, i) => {
    const date = subDays(new Date(), parseInt(period) - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayReservations = reservations?.filter((r: { reservation_date: string }) => {
      if (!r.reservation_date) return false;
      // Сравниваем строки напрямую, т.к. reservation_date уже в формате yyyy-MM-dd
      const rDateStr = r.reservation_date.split('T')[0]; // На случай если приходит ISO формат
      return rDateStr === dateStr;
    }).length || 0;

    return {
      date: format(date, 'd MMM', { locale: ru }),
      reservations: dayReservations,
    };
  });

  // Status distribution for pie chart
  const statusData = [
    { name: 'Подтверждено', value: confirmedReservations },
    { name: 'Завершено', value: completedReservations },
    { name: 'Отменено', value: cancelledReservations },
    { name: 'Ожидает', value: pendingReservations },
  ].filter((d) => d.value > 0);

  if (!selectedRestaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Аналитика' },
            { title: 'Обзор' },
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
          { title: 'Обзор' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
            <p className="text-muted-foreground">
              Общая статистика ресторана
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
          <StatCard
            title="Всего бронирований"
            value={totalReservations}
            change={12}
            icon={<CalendarDays className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Подтверждённых"
            value={confirmedReservations}
            change={8}
            icon={<Users className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Активных чатов"
            value={totalChats}
            change={-5}
            icon={<MessageSquare className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Процент отмен"
            value={totalReservations > 0 ? `${Math.round((cancelledReservations / totalReservations) * 100)}%` : '0%'}
            icon={<Armchair className="h-4 w-4" />}
            loading={isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Бронирования по дням</CardTitle>
              <CardDescription>
                Динамика за выбранный период
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.every(d => d.reservations === 0) ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Нет бронирований за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="reservations"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Бронирования"
                      dot={{ fill: '#8884d8', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Распределение по статусам</CardTitle>
              <CardDescription>
                Статусы бронирований
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : statusData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Нет данных для отображения
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
