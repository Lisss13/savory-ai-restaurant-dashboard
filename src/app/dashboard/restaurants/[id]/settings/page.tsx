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

const settingsSchema = z.object({
  reservation_duration: z.number().min(15).max(480),
  min_reservation_time: z.number().min(0).max(1440),
  auto_confirm_reservations: z.boolean(),
  send_reminder_notifications: z.boolean(),
  reminder_time_before: z.number().min(15).max(1440),
  ai_enabled: z.boolean(),
  ai_response_delay: z.number().min(0).max(60),
  currency: z.string().min(1),
});

const CURRENCIES = [
  { value: 'RUB', label: 'RUB — Российский рубль', symbol: '₽' },
  { value: 'USD', label: 'USD — Доллар США', symbol: '$' },
  { value: 'EUR', label: 'EUR — Евро', symbol: '€' },
  { value: 'KZT', label: 'KZT — Казахстанский тенге', symbol: '₸' },
  { value: 'BYN', label: 'BYN — Белорусский рубль', symbol: 'Br' },
  { value: 'UAH', label: 'UAH — Украинская гривна', symbol: '₴' },
  { value: 'GEL', label: 'GEL — Грузинский лари', symbol: '₾' },
  { value: 'AZN', label: 'AZN — Азербайджанский манат', symbol: '₼' },
  { value: 'AMD', label: 'AMD — Армянский драм', symbol: '֏' },
  { value: 'UZS', label: 'UZS — Узбекский сум', symbol: 'сўм' },
];

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormValues = {
  reservation_duration: 120,
  min_reservation_time: 60,
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
      reservation_duration: restaurant?.reservation_duration || defaultSettings.reservation_duration,
      min_reservation_time: restaurant?.min_reservation_time || defaultSettings.min_reservation_time,
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
        min_reservation_time: data.min_reservation_time,
        currency: data.currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast.success('Настройки сохранены');
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      if (error.response?.status === 403) {
        toast.error('Нет доступа к этому ресторану');
      } else {
        toast.error('Ошибка при сохранении настроек');
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
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Рестораны', href: '/dashboard/restaurants' },
            { title: 'Загрузка...', href: `/dashboard/restaurants/${restaurantId}` },
            { title: 'Настройки' },
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
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Рестораны', href: '/dashboard/restaurants' },
            { title: 'Не найден' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ресторан не найден
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
          { title: 'Рестораны', href: '/dashboard/restaurants' },
          { title: restaurant.name, href: `/dashboard/restaurants/${restaurantId}` },
          { title: 'Настройки' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Настройки ресторана</h1>
            <p className="text-muted-foreground">
              Управляйте параметрами {restaurant.name}
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
                    Настройки бронирования
                  </CardTitle>
                  <CardDescription>
                    Параметры для бронирования столов
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reservation_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Длительность бронирования (минуты)</FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите длительность" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 минут</SelectItem>
                              <SelectItem value="60">1 час</SelectItem>
                              <SelectItem value="90">1.5 часа</SelectItem>
                              <SelectItem value="120">2 часа</SelectItem>
                              <SelectItem value="150">2.5 часа</SelectItem>
                              <SelectItem value="180">3 часа</SelectItem>
                              <SelectItem value="240">4 часа</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Стандартная продолжительность бронирования стола
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_reservation_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Минимальное время до бронирования (минуты)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="1440"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          За сколько минут до визита можно забронировать стол
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
                            Автоподтверждение броней
                          </FormLabel>
                          <FormDescription>
                            Автоматически подтверждать новые бронирования
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
                    Валюта меню
                  </CardTitle>
                  <CardDescription>
                    Валюта для отображения цен в меню ресторана
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Валюта</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите валюту" />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Выбранная валюта будет отображаться рядом с ценами блюд
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
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Сохранить настройки
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  );
}
