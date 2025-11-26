'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Store,
  UtensilsCrossed,
  Armchair,
  HelpCircle,
  CreditCard,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
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
        <div className="text-2xl font-bold">{value.toLocaleString('ru-RU')}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.data;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Админ-панель' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Админ-панель</h1>
          <p className="text-muted-foreground">
            Системная статистика и управление
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Всего пользователей"
            value={stats?.totalUsers || 0}
            icon={<Users className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Активных пользователей"
            value={stats?.activeUsers || 0}
            icon={<Users className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Организаций"
            value={stats?.totalOrganizations || 0}
            icon={<Building2 className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Ресторанов"
            value={stats?.totalRestaurants || 0}
            icon={<Store className="h-4 w-4" />}
            loading={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Блюд в системе"
            value={stats?.totalDishes || 0}
            icon={<UtensilsCrossed className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Столов"
            value={stats?.totalTables || 0}
            icon={<Armchair className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Вопросов"
            value={stats?.totalQuestions || 0}
            icon={<HelpCircle className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Активных подписок"
            value={stats?.activeSubscriptions || 0}
            icon={<CreditCard className="h-4 w-4" />}
            loading={isLoading}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>
              Недавние действия в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentActivity?.length ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.entityType} #{activity.entityId} • {activity.adminName}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Нет недавней активности
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
