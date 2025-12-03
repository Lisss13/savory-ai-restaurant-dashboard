'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { useLanguageStore } from '@/store/language';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Bot,
  Building2,
  CalendarPlus,
  X,
  Clock,
  Calendar,
  Users,
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
import { chatApi, reservationApi } from '@/lib/api';
import type { ChatMessage, Reservation } from '@/types';

export default function ChatSessionPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const dateLocale = language === 'ru' ? ru : enUS;

  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = parseInt(params.sessionId as string);

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick replies with translations
  const QUICK_REPLIES = [
    { text: t.chatsSection.waiterComing, icon: '👨‍🍳' },
    { text: t.chatsSection.orderBeingPrepared, icon: '🍳' },
    { text: t.chatsSection.tableReserved, icon: '✅' },
    { text: t.chatsSection.thankYou, icon: '🙏' },
    { text: t.chatsSection.waitAMoment, icon: '⏳' },
    { text: t.chatsSection.sorryNotPossible, icon: '😔' },
  ];

  // Get chat messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      const response = await chatApi.getRestaurantSessionMessages(sessionId);
      // Handle both array directly and { messages: [...] } formats
      const data = response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.isArray(data) ? data : ((data as any)?.messages || []);
    },
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  // Get reservations for this session
  const { data: reservationsData } = useQuery({
    queryKey: ['sessionReservations', sessionId],
    queryFn: async () => {
      try {
        const response = await reservationApi.getBySession(sessionId);
        return response.data.reservations || [];
      } catch {
        return [];
      }
    },
    enabled: !!sessionId,
    refetchInterval: 10000,
  });

  const reservations = reservationsData || [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendRestaurantMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionReservations', sessionId] });
      setMessage('');
    },
    onError: () => {
      toast.error(t.chatsSection.sendError);
    },
  });

  // Close chat mutation
  const closeMutation = useMutation({
    mutationFn: () => chatApi.closeRestaurantSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      toast.success(t.chatsSection.chatClosed);
      router.push('/dashboard/chats/active');
    },
    onError: () => {
      toast.error(t.chatsSection.chatCloseError);
    },
  });

  // Scroll to last message
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
        return t.chatsSection.guest;
      case 'bot':
        return t.chatsSection.aiBot;
      case 'restaurant':
        return t.chatsSection.staffMember;
      default:
        return t.chatsSection.system;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">{t.reservations.confirmed}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t.reservations.cancelled}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t.reservations.pending}</Badge>;
      case 'completed':
        return <Badge variant="outline">{t.reservations.completed}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Chat statistics
  const chatStats = {
    totalMessages: messages?.length || 0,
    userMessages: messages?.filter((m: ChatMessage) => m.authorType === 'user').length || 0,
    botMessages: messages?.filter((m: ChatMessage) => m.authorType === 'bot').length || 0,
    startTime: messages?.[0]?.sentAt,
    lastMessageTime: messages?.[messages.length - 1]?.sentAt,
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.chats, href: '/dashboard/chats/active' },
          { title: `${t.chatsSection.chatSession} #${sessionId}` },
        ]}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t.chatsSection.chatSession} #{sessionId}
            </h1>
            <p className="text-muted-foreground">
              {t.chatsSection.viewAndManage}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              {t.chatsSection.closeChat}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Chat Window */}
          <Card className="col-span-8">
            <CardHeader className="py-3 border-b">
              <div className="flex items-center justify-end">
                <p className="text-sm text-muted-foreground">
                  {chatStats.totalMessages} {t.chatsSection.messagesCount}
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
                    <p>{t.chatsSection.noMessagesInChat}</p>
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
                            {format(new Date(msg.sentAt), 'HH:mm:ss', { locale: dateLocale })}
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
                <p className="text-xs text-muted-foreground mb-2">{t.chatsSection.quickReplies}:</p>
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
                    placeholder={t.chatsSection.typeMessage}
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
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="col-span-4 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{t.chatsSection.chatInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-auto max-h-[calc(100vh-320px)]">
              {/* Statistics */}
              <div className="space-y-3">
                <p className="text-sm font-medium">{t.chatsSection.statistics}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xl font-bold">{chatStats.userMessages}</p>
                    <p className="text-xs text-muted-foreground">{t.chatsSection.fromGuest}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                    <p className="text-xl font-bold text-blue-600">{chatStats.botMessages}</p>
                    <p className="text-xs text-muted-foreground">{t.chatsSection.fromAi}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold">{chatStats.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">{t.chatsSection.totalMessages}</p>
                </div>
              </div>

              <Separator />

              {/* Time */}
              <div className="space-y-3">
                <p className="text-sm font-medium">{t.chatsSection.time}</p>
                {chatStats.startTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.chatsSection.chatStarted}:</span>
                    <span>{format(new Date(chatStats.startTime), 'd MMM yyyy HH:mm', { locale: dateLocale })}</span>
                  </div>
                )}
                {chatStats.lastMessageTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.chatsSection.lastMessage}:</span>
                    <span>{format(new Date(chatStats.lastMessageTime), 'HH:mm:ss', { locale: dateLocale })}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reservations */}
              <div className="space-y-3">
                <p className="text-sm font-medium">{t.chatsSection.reservationsInChat}</p>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.chatsSection.noReservationsInChat}</p>
                ) : (
                  <div className="space-y-3">
                    {reservations.map((reservation: Reservation) => (
                      <div
                        key={reservation.id}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{reservation.id}</span>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {format(new Date(reservation.reservation_date), 'd MMM yyyy', { locale: dateLocale })} {reservation.start_time}
                            </span>
                          </div>
                          {reservation.table_name && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span>{reservation.table_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{reservation.guest_count} {t.chatsSection.guestsCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{reservation.customer_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Quick actions */}
              <div className="space-y-3">
                <p className="text-sm font-medium">{t.chatsSection.quickActions}</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reservations/list?create=true')}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    {t.chatsSection.createReservation}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
