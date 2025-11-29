'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Clock, Bell, Bot, Shield } from 'lucide-react';
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
import { useAuthStore } from '@/store/auth';

const settingsSchema = z.object({
  reservation_duration: z.number().min(15).max(480),
  min_reservation_time: z.number().min(0).max(1440),
  auto_confirm_reservations: z.boolean(),
  send_reminder_notifications: z.boolean(),
  reminder_time_before: z.number().min(15).max(1440),
  ai_enabled: z.boolean(),
  ai_response_delay: z.number().min(0).max(60),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormValues = {
  reservation_duration: 120,
  min_reservation_time: 60,
  auto_confirm_reservations: false,
  send_reminder_notifications: true,
  reminder_time_before: 60,
  ai_enabled: true,
  ai_response_delay: 2,
};

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
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
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormValues) =>
      restaurantApi.update(restaurantId, {
        organization_id: organization?.id,
        reservation_duration: data.reservation_duration,
        min_reservation_time: data.min_reservation_time,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast.success('Настройки сохранены');
    },
    onError: () => {
      toast.error('Ошибка при сохранении настроек');
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

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Уведомления
                  </CardTitle>
                  <CardDescription>
                    Настройки уведомлений для гостей
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="send_reminder_notifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Напоминания о бронировании
                          </FormLabel>
                          <FormDescription>
                            Отправлять напоминания гостям перед визитом
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

                  <FormField
                    control={form.control}
                    name="reminder_time_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Время напоминания (минуты до визита)</FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                            disabled={!form.watch('send_reminder_notifications')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите время" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 минут</SelectItem>
                              <SelectItem value="30">30 минут</SelectItem>
                              <SelectItem value="60">1 час</SelectItem>
                              <SelectItem value="120">2 часа</SelectItem>
                              <SelectItem value="180">3 часа</SelectItem>
                              <SelectItem value="1440">1 день</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          За сколько отправлять напоминание
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI-ассистент
                  </CardTitle>
                  <CardDescription>
                    Настройки AI-бота для чатов
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="ai_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Включить AI-ассистента
                          </FormLabel>
                          <FormDescription>
                            AI будет автоматически отвечать на вопросы гостей
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

                  <FormField
                    control={form.control}
                    name="ai_response_delay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Задержка ответа AI (секунды)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="60"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            disabled={!form.watch('ai_enabled')}
                          />
                        </FormControl>
                        <FormDescription>
                          Имитация набора сообщения для более естественного общения
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Безопасность
                  </CardTitle>
                  <CardDescription>
                    Параметры доступа и безопасности
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Требовать подтверждение телефона</h4>
                        <p className="text-sm text-muted-foreground">
                          Гости должны подтвердить номер телефона при бронировании
                        </p>
                      </div>
                      <Switch disabled />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Двухфакторная аутентификация</h4>
                        <p className="text-sm text-muted-foreground">
                          Дополнительная защита аккаунта ресторана
                        </p>
                      </div>
                      <Switch disabled />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Дополнительные настройки безопасности будут доступны в будущих обновлениях
                  </p>
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
