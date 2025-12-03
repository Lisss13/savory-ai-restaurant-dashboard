'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { chatApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { ChatSession, ChatMessage } from '@/types';

type ChatFilter = 'all' | 'active' | 'closed';

export default function ActiveChatsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();

  const QUICK_REPLIES = [
    { text: t.chatsSection.waiterComing, icon: '👨‍🍳' },
    { text: t.chatsSection.orderBeingPrepared, icon: '🍳' },
    { text: t.chatsSection.tableReserved, icon: '✅' },
    { text: t.chatsSection.thankYou, icon: '🙏' },
  ];
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: allSessions, isLoading } = useQuery({
    queryKey: ['chatSessions', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await chatApi.getRestaurantSessions(selectedRestaurant.id);
      // Handle both wrapped { sessions: [...] } and direct array responses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = response.data as any;
      return (rawData?.sessions || (Array.isArray(rawData) ? rawData : [])) as ChatSession[];
    },
    enabled: !!selectedRestaurant,
    refetchInterval: 10000,
  });

  // Helper to check if session is active
  const isSessionActive = (s: ChatSession) =>
    s.active === true ||
    s.status === 'active' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).is_active === true;

  // Filter sessions based on selected filter
  const sessions = useMemo(() => {
    if (!allSessions) return [];
    switch (chatFilter) {
      case 'active':
        return allSessions.filter(isSessionActive);
      case 'closed':
        return allSessions.filter((s) => !isSessionActive(s));
      case 'all':
      default:
        return allSessions;
    }
  }, [allSessions, chatFilter]);

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
      toast.error(t.chatsSection.sendError);
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => chatApi.closeRestaurantSession(selectedSession!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setSelectedSession(null);
      toast.success(t.chatsSection.chatClosed);
    },
    onError: () => {
      toast.error(t.chatsSection.chatCloseError);
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
    toast.success(t.chatsSection.aiReturnedSuccess);
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
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.chats }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">{t.restaurants.selectRestaurant}</h3>
              <p className="text-muted-foreground text-center">
                {t.chatsSection.selectRestaurantForChats}
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
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.chats },
          { title: t.nav.active },
        ]}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.chatsSection.activeChats}
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-3">
                  {totalUnread} {t.chatsSection.unread}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {t.chatsSection.communicateInRealTime}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="col-span-3">
            <CardHeader className="py-3 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {t.chatsSection.chatsCount} ({sessions?.length || 0})
                </CardTitle>
                {totalUnread > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Bell className="h-4 w-4 text-destructive animate-pulse" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{totalUnread} {t.chatsSection.waitingForResponse}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Tabs value={chatFilter} onValueChange={(v) => setChatFilter(v as ChatFilter)}>
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1 text-xs">
                    {t.chatsSection.filterActive}
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="flex-1 text-xs">
                    {t.chatsSection.filterClosed}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1 text-xs">
                    {t.chatsSection.filterAll}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sessions?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{t.chatsSection.noChatsFound}</p>
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
                                {session.table?.name || t.chatsSection.restaurantChat}
                              </p>
                              {session.table && (
                                <Badge variant="outline" className="text-xs px-1">
                                  {t.chatsSection.table}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.messages?.[session.messages.length - 1]?.content ||
                                t.chatsSection.noMessages}
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
                            {session.messageCount || 0} {t.chatsSection.messages}
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
                          {selectedSession.table?.name || t.chatsSection.restaurantChat}
                        </CardTitle>
                        <Badge variant={isAiEnabled ? 'default' : 'secondary'} className="text-xs">
                          {isAiEnabled ? t.chatsSection.ai : t.chatsSection.staff}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedSession.messageCount || 0} {t.chatsSection.messagesCount}
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
                        <TooltipContent>{t.chatsSection.openInSeparateWindow}</TooltipContent>
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
                        placeholder={t.chatsSection.typeMessage}
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
                <p>{t.chatsSection.selectChatFromList}</p>
              </CardContent>
            )}
          </Card>

          {/* Info Panel */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">{t.chatsSection.information}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.chatsSection.table}</p>
                    <p className="font-medium">
                      {selectedSession.table?.name || t.chatsSection.generalChat}
                    </p>
                  </div>

                  <Separator />

                  {/* Статус AI */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.chatsSection.aiStatus}</p>
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
                              {t.chatsSection.aiResponding}
                            </span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-400">
                              {t.chatsSection.staffChatting}
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
                        {t.chatsSection.returnToAi}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t.chatsSection.quickActions}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/reservations/list')}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      {t.chatsSection.createReservation}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      {t.chatsSection.call}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push(`/dashboard/chats/${selectedSession.id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t.chatsSection.openSeparately}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t.chatsSection.selectChatForInfo}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
