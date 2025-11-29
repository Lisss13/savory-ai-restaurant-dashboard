'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { organizationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const organizationSchema = z.object({
  name: z.string().min(1, 'Введите название организации'),
  phone: z.string().min(1, 'Введите телефон'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export default function OrganizationSettingsPage() {
  const queryClient = useQueryClient();
  const { organization, setOrganization } = useAuthStore();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        phone: organization.phone,
      });
    }
  }, [organization, form]);

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationFormValues) =>
      organizationApi.update(organization!.id, data),
    onSuccess: (response) => {
      setOrganization(response.data);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Настройки организации обновлены');
    },
    onError: () => {
      toast.error('Ошибка обновления настроек');
    },
  });

  const onSubmit = (data: OrganizationFormValues) => {
    updateMutation.mutate(data);
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Настройки' },
          { title: 'Организация' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки организации</h1>
          <p className="text-muted-foreground">
            Управляйте данными вашей организации
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Данные вашей организации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название организации</FormLabel>
                        <FormControl>
                          <Input placeholder="ООО Ресторан" {...field} />
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
                        <FormLabel>Контактный телефон</FormLabel>
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

                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
