'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Bot,
  Building2,
  Phone,
  CalendarPlus,
  X,
  Sparkles,
  Clock,
  Mail,
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
import type { ChatMessage } from '@/types';

const QUICK_REPLIES = [
  { text: 'Сейчас подойдёт официант', icon: '👨‍🍳' },
  { text: 'Ваш заказ готовится', icon: '🍳' },
  { text: 'Столик забронирован, ждём вас!', icon: '✅' },
  { text: 'Спасибо за обращение!', icon: '🙏' },
  { text: 'Минутку, уточню информацию', icon: '⏳' },
  { text: 'К сожалению, это невозможно', icon: '😔' },
];

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = parseInt(params.sessionId as string);

  const [message, setMessage] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Получаем сообщения чата
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      const response = await chatApi.getRestaurantSessionMessages(sessionId);
      return response.data.messages || [];
    },
    enabled: !!sessionId,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Отправка сообщения
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendRestaurantMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      setMessage('');
      // При отправке сообщения персоналом AI отключается
      setIsAiEnabled(false);
    },
    onError: () => {
      toast.error('Ошибка отправки сообщения');
    },
  });

  // Закрытие чата
  const closeMutation = useMutation({
    mutationFn: () => chatApi.closeRestaurantSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast.success('Чат закрыт');
      router.push('/dashboard/chats/active');
    },
    onError: () => {
      toast.error('Ошибка закрытия чата');
    },
  });

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message);
  };

  const handleQuickReply = (reply: string) => {
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
        return 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
      case 'restaurant':
        return 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
      default:
        return 'bg-muted';
    }
  };

  const getAuthorLabel = (authorType: string) => {
    switch (authorType) {
      case 'user':
        return 'Гость';
      case 'bot':
        return 'AI-бот';
      case 'restaurant':
        return 'Персонал';
      default:
        return 'Система';
    }
  };

  // Анализ последних сообщений для определения статуса AI
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessages = messages.slice(-5);
      const hasStaffMessage = lastMessages.some((m: ChatMessage) => m.authorType === 'restaurant');
      if (hasStaffMessage) {
        setIsAiEnabled(false);
      }
    }
  }, [messages]);

  // Подсчёт статистики чата
  const chatStats = {
    totalMessages: messages?.length || 0,
    userMessages: messages?.filter((m: ChatMessage) => m.authorType === 'user').length || 0,
    botMessages: messages?.filter((m: ChatMessage) => m.authorType === 'bot').length || 0,
    staffMessages: messages?.filter((m: ChatMessage) => m.authorType === 'restaurant').length || 0,
    startTime: messages?.[0]?.sentAt,
    lastMessageTime: messages?.[messages.length - 1]?.sentAt,
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Чаты', href: '/dashboard/chats/active' },
          { title: `Чат #${sessionId}` },
        ]}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Чат #{sessionId}</h1>
            <p className="text-muted-foreground">
              Просмотр и управление чат-сессией
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAiEnabled && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleReturnToAi}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Вернуть AI
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Включить автоматические ответы AI-бота</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="destructive"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Закрыть чат
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Chat Window */}
          <Card className="col-span-8">
            <CardHeader className="py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isAiEnabled ? 'default' : 'secondary'}>
                    {isAiEnabled ? (
                      <>
                        <Bot className="mr-1 h-3 w-3" />
                        AI активен
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-1 h-3 w-3" />
                        Персонал отвечает
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {chatStats.totalMessages} сообщений
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-3/4" />
                    ))}
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4" />
                    <p>Нет сообщений в этом чате</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((msg: ChatMessage) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.authorType !== 'user' ? 'justify-end' : ''
                        }`}
                      >
                        {msg.authorType === 'user' && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10">
                              {getMessageIcon(msg.authorType)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${getMessageColor(
                            msg.authorType
                          )}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {getAuthorLabel(msg.authorType)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(msg.sentAt), 'HH:mm:ss', { locale: ru })}
                          </p>
                        </div>
                        {msg.authorType !== 'user' && (
                          <Avatar className="h-8 w-8 shrink-0">
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

              {/* Quick replies */}
              <div className="px-4 py-2 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Быстрые ответы:</p>
                <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите сообщение..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sendMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isAiEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    AI-бот приостановлен. Нажмите &quot;Вернуть AI&quot; для возобновления автоматических ответов.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="text-lg">Информация о чате</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Статистика */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Статистика</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{chatStats.totalMessages}</p>
                    <p className="text-xs text-muted-foreground">Всего сообщений</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{chatStats.userMessages}</p>
                    <p className="text-xs text-muted-foreground">От гостя</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-2xl font-bold text-blue-600">{chatStats.botMessages}</p>
                    <p className="text-xs text-muted-foreground">От AI</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600">{chatStats.staffMessages}</p>
                    <p className="text-xs text-muted-foreground">От персонала</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Время */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Время</p>
                {chatStats.startTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Начат:</span>
                    <span>{format(new Date(chatStats.startTime), 'd MMM yyyy HH:mm', { locale: ru })}</span>
                  </div>
                )}
                {chatStats.lastMessageTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Последнее:</span>
                    <span>{format(new Date(chatStats.lastMessageTime), 'HH:mm:ss', { locale: ru })}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Быстрые действия */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Быстрые действия</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reservations/list?create=true')}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Создать бронирование
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="mr-2 h-4 w-4" />
                    Позвонить гостю
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Отправить email
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Статус AI */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Статус AI-бота</p>
                <div
                  className={`p-3 rounded-lg ${
                    isAiEnabled
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isAiEnabled ? (
                      <>
                        <Bot className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            AI активен
                          </p>
                          <p className="text-xs text-green-600/70">
                            Автоматически отвечает на вопросы
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-700 dark:text-yellow-400">
                            AI приостановлен
                          </p>
                          <p className="text-xs text-yellow-600/70">
                            Персонал ведёт диалог
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {!isAiEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleReturnToAi}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Вернуть AI
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
