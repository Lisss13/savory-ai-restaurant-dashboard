'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, FileText, User, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { AdminLog } from '@/types';

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  create: { label: 'Создание', variant: 'default' },
  update: { label: 'Обновление', variant: 'secondary' },
  delete: { label: 'Удаление', variant: 'destructive' },
  login: { label: 'Вход', variant: 'outline' },
  logout: { label: 'Выход', variant: 'outline' },
};

export default function AdminLogsPage() {
  const router = useRouter();
  const { isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['adminLogs'],
    queryFn: async () => {
      const response = await adminApi.getLogs();
      return response.data.logs || [];
    },
    enabled: isAdmin,
  });

  const filteredLogs = logs?.filter((log: AdminLog) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      log.action?.toLowerCase().includes(searchLower) ||
      log.adminName?.toLowerCase().includes(searchLower) ||
      log.entityType?.toLowerCase().includes(searchLower);
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  }) || [];

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Админ-панель', href: '/dashboard/admin' },
          { title: 'Логи' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Логи действий</h1>
          <p className="text-muted-foreground">
            История действий администраторов
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Логи</CardTitle>
                <CardDescription>
                  Всего записей: {filteredLogs.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Действие" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все действия</SelectItem>
                    <SelectItem value="create">Создание</SelectItem>
                    <SelectItem value="update">Обновление</SelectItem>
                    <SelectItem value="delete">Удаление</SelectItem>
                    <SelectItem value="login">Вход</SelectItem>
                    <SelectItem value="logout">Выход</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет записей в логах</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Администратор</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>ID объекта</TableHead>
                    <TableHead>Детали</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AdminLog) => {
                    const actionConfig = ACTION_LABELS[log.action] || { label: log.action, variant: 'outline' as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(log.createdAt), 'd MMM yyyy HH:mm', { locale: ru })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {log.adminName || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionConfig.variant}>
                            {actionConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entityType || '—'}</TableCell>
                        <TableCell>
                          {log.entityId ? `#${log.entityId}` : '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.details || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
