'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { restaurantApi, uploadApi, getImageUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Воскресенье' },
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
];

const workingHourSchema = z.object({
  day_of_week: z.number(),
  open_time: z.string(),
  close_time: z.string(),
  is_closed: z.boolean(),
});

const restaurantSchema = z.object({
  name: z.string().min(1, 'Введите название ресторана'),
  address: z.string().min(1, 'Введите адрес'),
  phone: z.string().min(1, 'Введите телефон'),
  website: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  description: z.string().optional(),
  image_url: z.string().optional(),
  working_hours: z.array(workingHourSchema),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;

const defaultWorkingHours = DAYS_OF_WEEK.map((day) => ({
  day_of_week: day.value,
  open_time: '09:00',
  close_time: '22:00',
  is_closed: day.value === 0,
}));

export default function NewRestaurantPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      website: '',
      description: '',
      image_url: '',
      working_hours: defaultWorkingHours,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RestaurantFormValues) =>
      restaurantApi.create({
        ...data,
        organization_id: organization?.id || 0,
        working_hours: data.working_hours
          .filter((h) => !h.is_closed)
          .map((h) => ({
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] });
      toast.success('Ресторан создан');
      router.push('/dashboard/restaurants');
    },
    onError: () => {
      toast.error('Ошибка при создании ресторана');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadApi.uploadImage(file);
      form.setValue('image_url', response.data.url);
      toast.success('Изображение загружено');
    } catch {
      toast.error('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToAllDays = (sourceIndex: number) => {
    const source = form.getValues(`working_hours.${sourceIndex}`);
    const currentHours = form.getValues('working_hours');

    form.setValue(
      'working_hours',
      currentHours.map((h, i) =>
        i === sourceIndex
          ? h
          : {
              ...h,
              open_time: source.open_time,
              close_time: source.close_time,
              is_closed: source.is_closed,
            }
      )
    );
    toast.success('Расписание скопировано на все дни');
  };

  const onSubmit = (data: RestaurantFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Рестораны', href: '/dashboard/restaurants' },
          { title: 'Новый ресторан' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новый ресторан</h1>
          <p className="text-muted-foreground">
            Заполните информацию о вашем заведении
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                  <CardDescription>
                    Базовые данные о ресторане
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название ресторана *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ресторан Гурман" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес *</FormLabel>
                        <FormControl>
                          <Input placeholder="ул. Пушкина, д. 10" {...field} />
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
                        <FormLabel>Телефон *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+7 (900) 123-45-67"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Веб-сайт</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://restaurant.com"
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
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о вашем ресторане..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фото ресторана</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value && (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={getImageUrl(field.value)}
                                  alt="Preview"
                                  className="object-cover w-full h-full"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => form.setValue('image_url', '')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                className="hidden"
                                id="image-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                asChild
                                disabled={isUploading}
                              >
                                <label htmlFor="image-upload" className="cursor-pointer">
                                  {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                  )}
                                  Загрузить фото
                                </label>
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Расписание работы</CardTitle>
                  <CardDescription>
                    Укажите часы работы ресторана
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={day.value} className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`working_hours.${index}.is_closed`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!field.value}
                                onCheckedChange={(checked) =>
                                  field.onChange(!checked)
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="w-28 text-sm font-medium">
                        {day.label}
                      </span>
                      <FormField
                        control={form.control}
                        name={`working_hours.${index}.open_time`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={form.watch(
                                  `working_hours.${index}.is_closed`
                                )}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">—</span>
                      <FormField
                        control={form.control}
                        name={`working_hours.${index}.close_time`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={form.watch(
                                  `working_hours.${index}.is_closed`
                                )}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAllDays(index)}
                      >
                        Копировать
                      </Button>
                    </div>
                  ))}
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Создать ресторан
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  );
}
