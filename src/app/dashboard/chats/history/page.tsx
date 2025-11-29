'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MessageSquare, Search, Calendar, Eye, Clock, User, Bot, Building2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { ChatSession } from '@/types';

export default function ChatHistoryPage() {
  const router = useRouter();
  const { selectedRestaurant } = useRestaurantStore();
  const [search, setSearch] = useState('');
  const [chatType, setChatType] = useState<string>('all');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['chatSessions', selectedRestaurant?.id, 'history'],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      return response.data.sessions || [];
    },
    enabled: !!selectedRestaurant,
  });

  const filteredSessions = sessions?.filter((session: ChatSession) => {
    const matchesSearch = !search ||
      session.id.toString().includes(search);
    const matchesType = chatType === 'all' ||
      (chatType === 'table' && session.table) ||
      (chatType === 'restaurant' && !session.table);
    const isClosed = session.status === 'closed';
    return matchesSearch && matchesType && isClosed;
  }) || [];

  if (!selectedRestaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Чаты' },
            { title: 'История' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Выберите ресторан для просмотра истории чатов
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
          { title: 'Чаты' },
          { title: 'История' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">История чатов</h1>
          <p className="text-muted-foreground">
            Архив завершённых чат-сессий
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Завершённые чаты</CardTitle>
                <CardDescription>
                  Всего: {filteredSessions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={chatType} onValueChange={setChatType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Тип чата" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все чаты</SelectItem>
                    <SelectItem value="table">Столики</SelectItem>
                    <SelectItem value="restaurant">Ресторан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет завершённых чатов</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Столик</TableHead>
                    <TableHead>Начат</TableHead>
                    <TableHead>Завершён</TableHead>
                    <TableHead>Сообщений</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session: ChatSession) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">#{session.id}</TableCell>
                      <TableCell>
                        <Badge variant={session.table ? 'default' : 'secondary'}>
                          {session.table ? 'Столик' : 'Ресторан'}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.table?.name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.createdAt), 'd MMM HH:mm', { locale: ru })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.closedAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.closedAt), 'd MMM HH:mm', { locale: ru })}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{session.messageCount || 0}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/chats/${session.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Просмотр
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Открыть историю чата</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
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
