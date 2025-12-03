'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Clock, Bell, Bot, Shield, Banknote } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { restaurantApi } from '@/lib/api';
import { useTranslation } from '@/i18n';

const settingsSchema = z.object({
  reservation_duration: z.number().min(15).max(480),
  auto_confirm_reservations: z.boolean(),
  send_reminder_notifications: z.boolean(),
  reminder_time_before: z.number().min(15).max(1440),
  ai_enabled: z.boolean(),
  ai_response_delay: z.number().min(0).max(60),
  currency: z.string().min(1),
});

const CURRENCY_KEYS = ['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH', 'GEL', 'AZN', 'AMD', 'UZS'] as const;

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormValues = {
  reservation_duration: 120,
  auto_confirm_reservations: false,
  send_reminder_notifications: true,
  reminder_time_before: 60,
  ai_enabled: true,
  ai_response_delay: 2,
  currency: 'RUB',
};

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const restaurantId = Number(params.id);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const response = await restaurantApi.getById(restaurantId);
      return response.data;
    },
    enabled: !!restaurantId,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      reservation_duration: defaultSettings.reservation_duration,
      auto_confirm_reservations: defaultSettings.auto_confirm_reservations,
      send_reminder_notifications: defaultSettings.send_reminder_notifications,
      reminder_time_before: defaultSettings.reminder_time_before,
      ai_enabled: defaultSettings.ai_enabled,
      ai_response_delay: defaultSettings.ai_response_delay,
      currency: restaurant?.currency || defaultSettings.currency,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormValues) =>
      restaurantApi.update(restaurantId, {
        reservation_duration: data.reservation_duration,
        currency: data.currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast.success(t.restaurants.settingsSaved);
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      if (error.response?.status === 403) {
        toast.error(t.restaurants.noAccess);
      } else {
        toast.error(t.restaurants.settingsError);
      }
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.restaurants, href: '/dashboard/restaurants' },
            { title: t.common.loading, href: `/dashboard/restaurants/${restaurantId}` },
            { title: t.nav.settings },
          ]}
        />
        <main className="flex-1 space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </main>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.restaurants, href: '/dashboard/restaurants' },
            { title: t.restaurants.notFound },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t.restaurants.restaurantNotFound}
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
          { title: t.nav.restaurants, href: '/dashboard/restaurants' },
          { title: restaurant.name, href: `/dashboard/restaurants/${restaurantId}` },
          { title: t.nav.settings },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.restaurants.settingsTitle}</h1>
            <p className="text-muted-foreground">
              {t.restaurants.settingsSubtitle} {restaurant.name}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Reservation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t.restaurants.reservationSettingsTitle}
                  </CardTitle>
                  <CardDescription>
                    {t.restaurants.reservationSettingsDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reservation_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.restaurants.reservationDuration}</FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.restaurants.selectDuration} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">{t.restaurants.minutes30}</SelectItem>
                              <SelectItem value="60">{t.restaurants.hour1}</SelectItem>
                              <SelectItem value="90">{t.restaurants.hours1_5}</SelectItem>
                              <SelectItem value="120">{t.restaurants.hours2}</SelectItem>
                              <SelectItem value="150">{t.restaurants.hours2_5}</SelectItem>
                              <SelectItem value="180">{t.restaurants.hours3}</SelectItem>
                              <SelectItem value="240">{t.restaurants.hours4}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          {t.restaurants.durationDesc}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="auto_confirm_reservations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t.restaurants.autoConfirm}
                          </FormLabel>
                          <FormDescription>
                            {t.restaurants.autoConfirmDesc}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Currency Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    {t.restaurants.currencyMenuTitle}
                  </CardTitle>
                  <CardDescription>
                    {t.restaurants.currencyMenuDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.restaurants.currency}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.restaurants.selectCurrency} />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCY_KEYS.map((key) => (
                                <SelectItem key={key} value={key}>
                                  {t.restaurants[`currency${key}` as keyof typeof t.restaurants]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          {t.restaurants.currencyHint}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t.restaurants.saveSettings}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  );
}
