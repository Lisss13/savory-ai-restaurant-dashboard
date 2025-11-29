'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supportApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { SupportTicket } from '@/types';

const supportSchema = z.object({
  title: z.string().min(5, 'Минимум 5 символов').max(100, 'Максимум 100 символов'),
  description: z.string().min(20, 'Опишите проблему подробнее (минимум 20 символов)'),
  email: z.string().email('Введите корректный email'),
  phone: z.string().optional(),
});

type SupportFormValues = z.infer<typeof supportSchema>;

function TicketStatusBadge({ status }: { status: SupportTicket['status'] }) {
  if (status === 'completed') {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Решено
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      В работе
    </Badge>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{ticket.title}</CardTitle>
            <CardDescription>
              {new Date(ticket.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </CardDescription>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {ticket.description}
        </p>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>Email: {ticket.email}</span>
          {ticket.phone && <span>Телефон: {ticket.phone}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function TicketsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-support-tickets'],
    queryFn: async () => {
      const response = await supportApi.getMy(1, 50);
      return response.data.tickets;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет обращений</h3>
          <p className="text-muted-foreground text-center">
            Вы ещё не отправляли обращений в службу поддержки
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      title: '',
      description: '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: SupportFormValues) => supportApi.create(data),
    onSuccess: () => {
      toast.success('Обращение отправлено! Мы свяжемся с вами в ближайшее время.');
      form.reset({
        title: '',
        description: '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => {
      toast.error('Не удалось отправить обращение. Попробуйте позже.');
    },
  });

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Настройки' },
          { title: 'Поддержка' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Служба поддержки</h1>
          <p className="text-muted-foreground">
            Опишите вашу проблему, и мы поможем её решить
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Новое обращение</CardTitle>
                <CardDescription>
                  Заполните форму, чтобы связаться с нашей командой поддержки
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      createTicketMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тема обращения</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Кратко опишите проблему"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание проблемы</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Подробно опишите вашу проблему или вопрос..."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Чем подробнее вы опишете проблему, тем быстрее мы сможем помочь
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email для связи</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="example@mail.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон (необязательно)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+7 (999) 123-45-67"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Укажите, если хотите, чтобы мы перезвонили
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Отправить обращение
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Мои обращения</h2>
            <TicketsList />
          </div>
        </div>
      </main>
    </>
  );
}
