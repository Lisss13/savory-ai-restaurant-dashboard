'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Clock, Users, Bot } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslation } from '@/i18n';
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
import { chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { ChatSession } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ChatsAnalyticsPage() {
  const { t } = useTranslation();
  const { selectedRestaurant } = useRestaurantStore();
  const [period, setPeriod] = useState('30');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['chatSessions', selectedRestaurant?.id, 'analytics', period],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      return response.data.sessions || [];
    },
    enabled: !!selectedRestaurant,
  });

  // Calculate metrics
  const totalSessions = sessions?.length || 0;
  const tableSessions = sessions?.filter((s: ChatSession) => s.table).length || 0;
  const restaurantSessions = totalSessions - tableSessions;
  const avgResponseTime = '< 1 мин';
  const aiPercentage = 85;

  // Source distribution
  const sourceData = [
    { name: t.analyticsSection.tableChatSource, value: tableSessions },
    { name: t.analyticsSection.restaurantChatSource, value: restaurantSessions },
  ].filter((d) => d.value > 0);

  // Response type distribution
  const responseData = [
    { name: t.analyticsSection.aiBot, value: aiPercentage },
    { name: t.analyticsSection.staff, value: 100 - aiPercentage },
  ];

  // Popular questions (mock)
  const popularQuestions = [
    { question: 'Какие у вас фирменные блюда?', count: 45 },
    { question: 'Можно забронировать столик?', count: 38 },
    { question: 'Есть ли у вас вегетарианское меню?', count: 25 },
    { question: 'До скольки вы работаете?', count: 22 },
    { question: 'Есть ли детское меню?', count: 18 },
  ];

  if (!selectedRestaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.analytics },
            { title: t.analyticsSection.chats },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t.analyticsSection.selectRestaurantForAnalytics}
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
          { title: t.nav.analytics },
          { title: t.analyticsSection.chats },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.analyticsSection.chatsAnalytics}</h1>
            <p className="text-muted-foreground">
              {t.analyticsSection.guestCommunicationStats}
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t.analyticsSection.period} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t.analyticsSection.last7Days}</SelectItem>
              <SelectItem value="30">{t.analyticsSection.last30Days}</SelectItem>
              <SelectItem value="90">{t.analyticsSection.last90Days}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.analyticsSection.totalSessions}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalSessions}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.analyticsSection.avgResponseTime}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.analyticsSection.aiResponsePercent}
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiPercentage}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.analyticsSection.tableChats}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{tableSessions}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.analyticsSection.chatSources}</CardTitle>
              <CardDescription>
                {t.analyticsSection.distributionByType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : sourceData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t.analyticsSection.noData}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.analyticsSection.aiVsStaff}</CardTitle>
              <CardDescription>
                {t.analyticsSection.whoAnswersQuestions}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={responseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {responseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.analyticsSection.popularQuestions}</CardTitle>
            <CardDescription>
              {t.analyticsSection.whatGuestsAskMost}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={popularQuestions}
                layout="vertical"
                margin={{ left: 200 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="question"
                  width={190}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name={t.analyticsSection.requests} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
