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
import { useTranslation } from '@/i18n';

function TicketStatusBadge({ status, t }: { status: SupportTicket['status']; t: ReturnType<typeof useTranslation>['t'] }) {
  if (status === 'completed') {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {t.supportSection.resolved}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      {t.supportSection.inProgress}
    </Badge>
  );
}

function TicketCard({ ticket, t, language }: { ticket: SupportTicket; t: ReturnType<typeof useTranslation>['t']; language: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{ticket.title}</CardTitle>
            <CardDescription>
              {new Date(ticket.created_at).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </CardDescription>
          </div>
          <TicketStatusBadge status={ticket.status} t={t} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {ticket.description}
        </p>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>Email: {ticket.email}</span>
          {ticket.phone && <span>{t.auth.phone}: {ticket.phone}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function TicketsList({ t, language }: { t: ReturnType<typeof useTranslation>['t']; language: string }) {
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
          <h3 className="text-lg font-semibold mb-2">{t.supportSection.noTickets}</h3>
          <p className="text-muted-foreground text-center">
            {t.supportSection.noTicketsDesc}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} t={t} language={language} />
      ))}
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const supportSchema = z.object({
    title: z.string().min(5, t.supportSection.minSubjectLength).max(100, t.supportSection.maxSubjectLength),
    description: z.string().min(20, t.supportSection.minDescriptionLength),
    email: z.string().email(t.auth.invalidEmail),
    phone: z.string().optional(),
  });

  type SupportFormValues = z.infer<typeof supportSchema>;

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
      toast.success(t.supportSection.ticketSent);
      form.reset({
        title: '',
        description: '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => {
      toast.error(t.supportSection.ticketError);
    },
  });

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.settings },
          { title: t.nav.support },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.supportSection.title}</h1>
          <p className="text-muted-foreground">
            {t.supportSection.subtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t.supportSection.createTicket}</CardTitle>
                <CardDescription>
                  {t.supportSection.createTicketDesc}
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
                          <FormLabel>{t.supportSection.subject}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.supportSection.subjectPlaceholder}
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
                          <FormLabel>{t.supportSection.description}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.supportSection.descriptionPlaceholder}
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.supportSection.descriptionHint}
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
                          <FormLabel>{t.supportSection.emailForContact}</FormLabel>
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
                          <FormLabel>{t.supportSection.phoneOptional}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.supportSection.phoneHint}
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
                      {t.supportSection.sendTicket}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t.supportSection.myTickets}</h2>
            <TicketsList t={t} language={language} />
          </div>
        </div>
      </main>
    </>
  );
}
