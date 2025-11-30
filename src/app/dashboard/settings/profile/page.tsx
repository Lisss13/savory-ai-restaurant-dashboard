'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { userApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/i18n';

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);

  const profileSchema = z.object({
    name: z.string().min(1, t.settingsSection.enterName),
    email: z.string().email(t.auth.invalidEmail),
    phone: z.string().optional(),
  });

  const passwordSchema = z.object({
    oldPassword: z.string().min(8, t.auth.passwordMinLength),
    newPassword: z.string().min(8, t.auth.passwordMinLength),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t.settingsSection.passwordsDoNotMatch,
    path: ['confirmPassword'],
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;
  type PasswordFormValues = z.infer<typeof passwordSchema>;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => userApi.update(user!.id, data),
    onSuccess: (response) => {
      setUser(response.data);
      toast.success(t.settingsSection.profileUpdated);
    },
    onError: () => {
      toast.error(t.settingsSection.profileUpdateError);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormValues) =>
      authApi.changePassword(data.oldPassword, data.newPassword),
    onSuccess: () => {
      toast.success(t.settingsSection.passwordChanged);
      passwordForm.reset();
      setIsPasswordFormVisible(false);
    },
    onError: () => {
      toast.error(t.settingsSection.passwordChangeError);
    },
  });

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.settings },
          { title: t.nav.profile },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.settingsSection.profile}</h1>
          <p className="text-muted-foreground">
            {t.settingsSection.profileSubtitle}
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t.settingsSection.personalData}</CardTitle>
              <CardDescription>
                {t.settingsSection.updateYourInfo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit((data) =>
                    updateProfileMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.name}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.email}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.phone}</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t.common.save}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settingsSection.security}</CardTitle>
              <CardDescription>
                {t.settingsSection.changePasswordDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isPasswordFormVisible ? (
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordFormVisible(true)}
                >
                  {t.settingsSection.changePassword}
                </Button>
              ) : (
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit((data) =>
                      changePasswordMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settingsSection.currentPassword}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settingsSection.newPassword}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settingsSection.confirmNewPassword}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPasswordFormVisible(false);
                          passwordForm.reset();
                        }}
                      >
                        {t.common.cancel}
                      </Button>
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t.settingsSection.changePassword}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
