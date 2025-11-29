'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  Armchair,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { reservationApi } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает подтверждения', variant: 'secondary' },
  confirmed: { label: 'Подтверждено', variant: 'default' },
  cancelled: { label: 'Отменено', variant: 'destructive' },
  completed: { label: 'Завершено', variant: 'outline' },
};

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reservationId = Number(params.id);

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const response = await reservationApi.getById(reservationId);
      return response.data;
    },
    enabled: !!reservationId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => reservationApi.update(reservationId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Статус обновлён');
    },
    onError: () => {
      toast.error('Ошибка обновления статуса');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => reservationApi.cancel(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Бронирование отменено');
    },
    onError: () => {
      toast.error('Ошибка отмены бронирования');
    },
  });

  if (isLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Бронирования', href: '/dashboard/reservations/list' },
            { title: 'Детали' },
          ]}
        />
        <main className="flex-1 space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </main>
      </>
    );
  }

  if (!reservation) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Бронирования', href: '/dashboard/reservations/list' },
            { title: 'Не найдено' },
          ]}
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Бронирование не найдено
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const statusConfig = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Бронирования', href: '/dashboard/reservations/list' },
          { title: `#${reservation.id}` },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Бронирование #{reservation.id}
            </h1>
            <Badge variant={statusConfig.variant} className="mt-2">
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex gap-2">
            {reservation.status === 'pending' && (
              <Button
                onClick={() => updateStatusMutation.mutate('confirmed')}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Подтвердить
              </Button>
            )}
            {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Отменить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отменить бронирование?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Гость будет уведомлён об отмене.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Назад</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelMutation.mutate()}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Отменить бронь
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Информация о госте</CardTitle>
              <CardDescription>Контактные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reservation.customer_name}</p>
                  <p className="text-sm text-muted-foreground">Имя гостя</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <a
                    href={`tel:${reservation.customer_phone}`}
                    className="font-medium hover:text-primary"
                  >
                    {reservation.customer_phone}
                  </a>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                </div>
              </div>
              {reservation.customer_email && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <a
                        href={`mailto:${reservation.customer_email}`}
                        className="font-medium hover:text-primary"
                      >
                        {reservation.customer_email}
                      </a>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                </>
              )}
              {reservation.notes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{reservation.notes}</p>
                      <p className="text-sm text-muted-foreground">Примечание</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Детали бронирования</CardTitle>
              <CardDescription>Дата, время и место</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(reservation.reservation_date), 'd MMMM yyyy', { locale: ru })}
                  </p>
                  <p className="text-sm text-muted-foreground">Дата</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reservation.start_time}{reservation.end_time ? ` - ${reservation.end_time}` : ''}</p>
                  <p className="text-sm text-muted-foreground">Время</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reservation.guest_count} чел.</p>
                  <p className="text-sm text-muted-foreground">Количество гостей</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Armchair className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reservation.table_name || '—'}</p>
                  <p className="text-sm text-muted-foreground">Столик</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-start">
          <Button variant="outline" onClick={() => router.back()}>
            Назад к списку
          </Button>
        </div>
      </main>
    </>
  );
}
