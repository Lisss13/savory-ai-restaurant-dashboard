'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UtensilsCrossed, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { authApi } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Введите корректный email'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(data.email);
      setIsEmailSent(true);
      toast.success('Код отправлен на вашу почту');
      sessionStorage.setItem('resetEmail', data.email);
      router.push('/reset-password');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { messages?: string[] } } };
      toast.error(err.response?.data?.messages?.[0] || 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
        <CardDescription>
          Введите email для получения кода восстановления
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmailSent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Код восстановления отправлен на вашу почту.
              Проверьте входящие сообщения.
            </p>
            <Button asChild className="w-full">
              <Link href="/reset-password">Ввести код</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Отправить код
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-4">
          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к входу
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
