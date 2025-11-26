'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  X,
  User,
  Bot,
  Building2,
  Phone,
  CalendarPlus,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { ChatSession, ChatMessage } from '@/types';

const QUICK_REPLIES = [
  'Сейчас подойдёт официант',
  'Ваш заказ готовится',
  'Столик забронирован, ждём вас!',
  'Спасибо за обращение!',
];

export default function ActiveChatsPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['chatSessions', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      return response.data.sessions?.filter((s: ChatSession) => s.active) || [];
    },
    enabled: !!selectedRestaurant,
    refetchInterval: 10000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession) return [];
      const response = await chatApi.getRestaurantSessionMessages(selectedSession.id);
      return response.data.messages || [];
    },
    enabled: !!selectedSession,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendRestaurantMessage(selectedSession!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setMessage('');
    },
    onError: () => {
      toast.error('Ошибка отправки сообщения');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => chatApi.closeRestaurantSession(selectedSession!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setSelectedSession(null);
      toast.success('Чат закрыт');
    },
    onError: () => {
      toast.error('Ошибка закрытия чата');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedSession) return;
    sendMutation.mutate(message);
  };

  const handleQuickReply = (reply: string) => {
    if (!selectedSession) return;
    sendMutation.mutate(reply);
  };

  const getMessageIcon = (authorType: string) => {
    switch (authorType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'restaurant':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageColor = (authorType: string) => {
    switch (authorType) {
      case 'user':
        return 'bg-muted';
      case 'bot':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'restaurant':
        return 'bg-green-100 dark:bg-green-900/20';
      default:
        return 'bg-muted';
    }
  };

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'Чаты' }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
              <p className="text-muted-foreground text-center">
                Для просмотра чатов необходимо выбрать ресторан
              </p>
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
          { title: 'Активные' },
        ]}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Активные чаты</h1>
            <p className="text-muted-foreground">
              Общайтесь с посетителями в реальном времени
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">
                Чаты ({sessions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-340px)]">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sessions?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Нет активных чатов
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessions?.map((session: ChatSession) => (
                      <button
                        key={session.id}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                          selectedSession?.id === session.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {session.table?.name?.[0] || 'Ч'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {session.table?.name || 'Чат ресторана'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.messages?.[session.messages.length - 1]?.content ||
                                'Нет сообщений'}
                            </p>
                          </div>
                          {session.unreadCount && session.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full">
                              {session.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(session.lastActive), 'HH:mm', { locale: ru })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="col-span-6">
            {selectedSession ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedSession.table?.name?.[0] || 'Ч'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {selectedSession.table?.name || 'Чат ресторана'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Активен</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => closeMutation.mutate()}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100%-130px)]">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-3/4" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((msg: ChatMessage) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${
                              msg.authorType !== 'user' ? 'justify-end' : ''
                            }`}
                          >
                            {msg.authorType === 'user' && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {getMessageIcon(msg.authorType)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${getMessageColor(
                                msg.authorType
                              )}`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(msg.sentAt), 'HH:mm')}
                              </p>
                            </div>
                            {msg.authorType !== 'user' && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {getMessageIcon(msg.authorType)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {QUICK_REPLIES.map((reply) => (
                        <Button
                          key={reply}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReply(reply)}
                          disabled={sendMutation.isPending}
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите сообщение..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={sendMutation.isPending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || sendMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p>Выберите чат из списка</p>
              </CardContent>
            )}
          </Card>

          {/* Info Panel */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Информация</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Стол</p>
                    <p className="font-medium">
                      {selectedSession.table?.name || 'Общий чат'}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Быстрые действия</p>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Создать бронирование
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Позвонить
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Выберите чат для просмотра информации
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
