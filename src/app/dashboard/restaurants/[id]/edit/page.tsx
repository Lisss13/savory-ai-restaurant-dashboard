'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
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
import { getImageUrl, restaurantApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useTranslation } from '@/i18n';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

const workingHourSchema = z.object({
  day_of_week: z.number(),
  open_time: z.string(),
  close_time: z.string(),
  is_closed: z.boolean(),
});

export default function EditRestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const { t } = useTranslation();
  const restaurantId = Number(params.id);

  const DAYS_OF_WEEK = [
    { value: 0, label: t.restaurants.sunday },
    { value: 1, label: t.restaurants.monday },
    { value: 2, label: t.restaurants.tuesday },
    { value: 3, label: t.restaurants.wednesday },
    { value: 4, label: t.restaurants.thursday },
    { value: 5, label: t.restaurants.friday },
    { value: 6, label: t.restaurants.saturday },
  ];

  const defaultWorkingHours = DAYS_OF_WEEK.map((day) => ({
    day_of_week: day.value,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: day.value === 0,
  }));

  const restaurantSchema = z.object({
    name: z.string().min(1, t.restaurants.enterRestaurantName),
    address: z.string().min(1, t.restaurants.enterAddress),
    phone: z.string().min(1, t.restaurants.enterPhone),
    website: z.string().url(t.restaurants.enterValidUrl).optional().or(z.literal('')),
    description: z.string().optional(),
    image_url: z.string().optional(),
    currency: z.string().optional(),
    working_hours: z.array(workingHourSchema),
  });

  type RestaurantFormValues = z.infer<typeof restaurantSchema>;

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const response = await restaurantApi.getById(restaurantId);
      return response.data;
    },
    enabled: !!restaurantId,
  });

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      website: '',
      description: '',
      image_url: '',
      currency: 'USD',
      working_hours: defaultWorkingHours,
    },
  });

  const { isUploading, handleImageUpload } = useImageUpload({
    onSuccess: (url) => form.setValue('image_url', url),
    successMessage: t.restaurants.imageUploaded,
    errorMessage: t.restaurants.imageUploadError,
  });

  useEffect(() => {
    if (restaurant) {
      const workingHoursMap = new Map(
        restaurant.working_hours?.map((h) => [h.day_of_week, h]) || []
      );

      const formattedHours = DAYS_OF_WEEK.map((day) => {
        const existing = workingHoursMap.get(day.value);
        return existing
          ? {
              day_of_week: day.value,
              open_time: existing.open_time,
              close_time: existing.close_time,
              is_closed: false,
            }
          : {
              day_of_week: day.value,
              open_time: '09:00',
              close_time: '22:00',
              is_closed: true,
            };
      });

      form.reset({
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        website: restaurant.website || '',
        description: restaurant.description || '',
        image_url: restaurant.image_url || '',
        currency: restaurant.currency || 'USD',
        working_hours: formattedHours,
      });
    }
  }, [restaurant, form]);

  const updateMutation = useMutation({
    mutationFn: (data: RestaurantFormValues) =>
      restaurantApi.update(restaurantId, {
        ...data,
        organization_id: organization?.id,
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
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast.success(t.restaurants.restaurantUpdated);
      router.push('/dashboard/restaurants');
    },
    onError: () => {
      toast.error(t.restaurants.restaurantUpdateError);
    },
  });

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
    toast.success(t.restaurants.copiedToAll);
  };

  const onSubmit = (data: RestaurantFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: t.nav.dashboard, href: '/dashboard' },
            { title: t.nav.restaurants, href: '/dashboard/restaurants' },
            { title: t.common.edit },
          ]}
        />
        <main className="flex-1 space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
          </div>
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
          { title: restaurant?.name || t.common.edit },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.restaurants.editRestaurant}</h1>
          <p className="text-muted-foreground">
            {t.restaurants.editSubtitle}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t.restaurants.basicInfo}</CardTitle>
                  <CardDescription>
                    {t.restaurants.basicInfoDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.restaurants.restaurantName} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t.restaurants.restaurantNamePlaceholder} {...field} />
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
                        <FormLabel>{t.restaurants.address} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t.restaurants.addressPlaceholder} {...field} />
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
                        <FormLabel>{t.restaurants.phone} *</FormLabel>
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
                        <FormLabel>{t.restaurants.website}</FormLabel>
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
                        <FormLabel>{t.restaurants.description}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.restaurants.descriptionPlaceholder}
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
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.restaurants.currency}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.restaurants.selectCurrency} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.restaurants.restaurantPhoto}</FormLabel>
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
                                  {t.restaurants.uploadPhoto}
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
                  <CardTitle>{t.restaurants.workingHours}</CardTitle>
                  <CardDescription>
                    {t.restaurants.workingHoursDesc}
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
                        {t.restaurants.copyToAll}
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
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t.restaurants.saveChanges}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  );
}
