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
import { useTranslation } from '@/i18n';

export default function OrganizationSettingsPage() {
  const queryClient = useQueryClient();
  const { organization, setOrganization } = useAuthStore();
  const { t } = useTranslation();

  const organizationSchema = z.object({
    name: z.string().min(1, t.errors.required),
    phone: z.string().min(1, t.errors.required),
  });

  type OrganizationFormValues = z.infer<typeof organizationSchema>;

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
      toast.success(t.settingsSection.organizationUpdated);
    },
    onError: () => {
      toast.error(t.settingsSection.updateError);
    },
  });

  const onSubmit = (data: OrganizationFormValues) => {
    updateMutation.mutate(data);
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.settings },
          { title: t.nav.organization },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.settingsSection.organizationSettings}</h1>
          <p className="text-muted-foreground">
            {t.settingsSection.organizationSubtitle}
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t.settingsSection.basicInfo}</CardTitle>
              <CardDescription>
                {t.settingsSection.organizationData}
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
                        <FormLabel>{t.settingsSection.organizationName}</FormLabel>
                        <FormControl>
                          <Input placeholder="Company LLC" {...field} />
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
                        <FormLabel>{t.settingsSection.contactPhone}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
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
                    {t.common.save}
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
