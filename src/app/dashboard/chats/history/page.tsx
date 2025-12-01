'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MessageSquare, Search, Calendar, Eye, Clock, User, Bot, Building2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
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
  const { t } = useTranslation();
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
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.chats },
            { title: t.nav.history },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t.chatsSection.selectRestaurantToView}
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
          { title: t.nav.chats },
          { title: t.nav.history },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.chatsSection.chatHistory}</h1>
          <p className="text-muted-foreground">
            {t.chatsSection.archiveOfChatSessions}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.chatsSection.completedChats}</CardTitle>
                <CardDescription>
                  {t.chatsSection.total}: {filteredSessions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.chatsSection.searchById}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={chatType} onValueChange={setChatType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t.chatsSection.chatType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.chatsSection.allChats}</SelectItem>
                    <SelectItem value="table">{t.chatsSection.tables}</SelectItem>
                    <SelectItem value="restaurant">{t.chatsSection.restaurant}</SelectItem>
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
                <p>{t.chatsSection.noCompletedChats}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t.chatsSection.type}</TableHead>
                    <TableHead>{t.chatsSection.table}</TableHead>
                    <TableHead>{t.chatsSection.started}</TableHead>
                    <TableHead>{t.chatsSection.completed}</TableHead>
                    <TableHead>{t.chatsSection.messagesCount}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session: ChatSession) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">#{session.id}</TableCell>
                      <TableCell>
                        <Badge variant={session.table ? 'default' : 'secondary'}>
                          {session.table ? t.chatsSection.table : t.chatsSection.restaurant}
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
                                {t.chatsSection.view}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t.chatsSection.openChatHistory}</p>
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
