'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  Sparkles,
  Circle,
  Bell,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { ChatSession, ChatMessage } from '@/types';

const QUICK_REPLIES = [
  { text: 'Сейчас подойдёт официант', icon: '👨‍🍳' },
  { text: 'Ваш заказ готовится', icon: '🍳' },
  { text: 'Столик забронирован, ждём вас!', icon: '✅' },
  { text: 'Спасибо за обращение!', icon: '🙏' },
];

export default function ActiveChatsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
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
      setIsAiEnabled(false);
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

  // Определяем статус AI при смене чата
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessages = messages.slice(-5);
      const hasStaffMessage = lastMessages.some((m: ChatMessage) => m.authorType === 'restaurant');
      setIsAiEnabled(!hasStaffMessage);
    } else {
      setIsAiEnabled(true);
    }
  }, [messages, selectedSession?.id]);

  const handleSend = () => {
    if (!message.trim() || !selectedSession) return;
    sendMutation.mutate(message);
  };

  const handleQuickReply = (reply: string) => {
    if (!selectedSession) return;
    sendMutation.mutate(reply);
  };

  const handleReturnToAi = () => {
    setIsAiEnabled(true);
    toast.success('AI-бот снова отвечает на сообщения');
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

  // Подсчёт общего количества непрочитанных
  const totalUnread = sessions?.reduce((acc: number, s: ChatSession) => acc + (s.unreadCount || 0), 0) || 0;

  // Определяем, ожидает ли чат ответа
  const isWaitingResponse = (session: ChatSession) => {
    return session.unreadCount && session.unreadCount > 0;
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
            <h1 className="text-3xl font-bold tracking-tight">
              Активные чаты
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-3">
                  {totalUnread} непрочитанных
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Общайтесь с посетителями в реальном времени
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="col-span-3">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Чаты ({sessions?.length || 0})
                </CardTitle>
                {totalUnread > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Bell className="h-4 w-4 text-destructive animate-pulse" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{totalUnread} сообщений ожидают ответа</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Нет активных чатов</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessions?.map((session: ChatSession) => (
                      <button
                        key={session.id}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors relative ${
                          selectedSession?.id === session.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        {/* Индикатор ожидания ответа */}
                        {isWaitingResponse(session) && (
                          <Circle className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 fill-destructive text-destructive animate-pulse" />
                        )}

                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={session.table ? 'bg-primary/10' : 'bg-secondary'}>
                              {session.table?.name?.[0] || 'Р'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {session.table?.name || 'Чат ресторана'}
                              </p>
                              {session.table && (
                                <Badge variant="outline" className="text-xs px-1">
                                  Стол
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.messages?.[session.messages.length - 1]?.content ||
                                'Нет сообщений'}
                            </p>
                          </div>
                          {session.unreadCount && session.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full shrink-0">
                              {session.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {session.lastActive && !isNaN(new Date(session.lastActive).getTime())
                              ? format(new Date(session.lastActive), 'HH:mm', { locale: ru })
                              : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.messageCount || 0} сообщ.
                          </p>
                        </div>
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
                        {selectedSession.table?.name?.[0] || 'Р'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {selectedSession.table?.name || 'Чат ресторана'}
                        </CardTitle>
                        <Badge variant={isAiEnabled ? 'default' : 'secondary'} className="text-xs">
                          {isAiEnabled ? 'AI' : 'Персонал'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedSession.messageCount || 0} сообщений
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/chats/${selectedSession.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Открыть в отдельном окне</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="icon" onClick={() => closeMutation.mutate()}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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
                                <AvatarFallback
                                  className={
                                    msg.authorType === 'bot'
                                      ? 'bg-blue-100 text-blue-600'
                                      : 'bg-green-100 text-green-600'
                                  }
                                >
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
                          key={reply.text}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReply(reply.text)}
                          disabled={sendMutation.isPending}
                          className="text-xs"
                        >
                          <span className="mr-1">{reply.icon}</span>
                          {reply.text}
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

                  {/* Статус AI */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Статус AI</p>
                    <div
                      className={`p-3 rounded-lg ${
                        isAiEnabled
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAiEnabled ? (
                          <>
                            <Bot className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 dark:text-green-400">
                              AI отвечает
                            </span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-400">
                              Персонал ведёт диалог
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isAiEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleReturnToAi}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Вернуть AI
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Быстрые действия</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/reservations/list')}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Создать бронирование
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Позвонить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push(`/dashboard/chats/${selectedSession.id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Открыть отдельно
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
