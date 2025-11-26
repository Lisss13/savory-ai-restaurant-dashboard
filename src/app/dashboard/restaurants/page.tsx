'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  MapPin,
  Phone,
  Globe,
  MoreHorizontal,
  Pencil,
  Trash2,
  QrCode,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { restaurantApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Restaurant } from '@/types';

export default function RestaurantsPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant, setSelectedRestaurant } = useRestaurantStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await restaurantApi.getAll();
      return response.data.restaurants;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: restaurantApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast.success('Ресторан удалён');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Ошибка при удалении ресторана');
    },
  });

  const isOpen = (restaurant: Restaurant) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = restaurant.working_hours?.find(
      (h) => h.day_of_week === dayOfWeek
    );

    if (!todayHours || todayHours.is_closed) return false;

    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  };

  const handleSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    toast.success(`Выбран ресторан: ${restaurant.name}`);
  };

  return (
    <>
      <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'Рестораны' }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Рестораны</h1>
            <p className="text-muted-foreground">
              Управляйте вашими заведениями
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/restaurants/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить ресторан
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : restaurants?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Нет ресторанов</h3>
              <p className="text-muted-foreground text-center mb-4">
                Создайте свой первый ресторан
              </p>
              <Button asChild>
                <Link href="/dashboard/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать ресторан
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants?.map((restaurant: Restaurant) => (
              <Card
                key={restaurant.id}
                className={`relative ${
                  selectedRestaurant?.id === restaurant.id
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
              >
                {selectedRestaurant?.id === restaurant.id && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {restaurant.name}
                      <Badge variant={isOpen(restaurant) ? 'default' : 'secondary'}>
                        {isOpen(restaurant) ? 'Открыто' : 'Закрыто'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{restaurant.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSelect(restaurant)}>
                        <Check className="mr-2 h-4 w-4" />
                        Выбрать
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/qr-codes?restaurant=${restaurant.id}`}>
                          <QrCode className="mr-2 h-4 w-4" />
                          QR-код
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(restaurant.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {restaurant.image_url && (
                    <div className="relative h-32 mb-4 rounded-md overflow-hidden bg-muted">
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{restaurant.phone}</span>
                    </div>
                    {restaurant.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          {restaurant.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => handleSelect(restaurant)}
                  >
                    {selectedRestaurant?.id === restaurant.id
                      ? 'Выбран'
                      : 'Выбрать'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить ресторан?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные ресторана будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
