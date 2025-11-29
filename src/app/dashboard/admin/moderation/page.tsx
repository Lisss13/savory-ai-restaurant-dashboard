'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, UtensilsCrossed, Building2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Dish, Organization } from '@/types';

export default function AdminModerationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [deleteDishId, setDeleteDishId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const { data: dishes, isLoading: isDishesLoading } = useQuery({
    queryKey: ['adminDishes'],
    queryFn: async () => {
      const response = await adminApi.getDishes();
      return response.data.dishes || [];
    },
    enabled: isAdmin,
  });

  const { data: organizations } = useQuery({
    queryKey: ['adminOrganizations'],
    queryFn: async () => {
      const response = await adminApi.getOrganizations();
      return response.data.organizations || [];
    },
    enabled: isAdmin,
  });

  const deleteDishMutation = useMutation({
    mutationFn: (dishId: number) => adminApi.deleteDish(dishId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDishes'] });
      toast.success('Блюдо удалено');
      setDeleteDishId(null);
    },
    onError: () => {
      toast.error('Ошибка удаления блюда');
    },
  });

  const filteredDishes = dishes?.filter((dish: Dish & { organization?: Organization }) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = dish.name?.toLowerCase().includes(searchLower);
    const matchesOrg = filterOrg === 'all' || dish.organization?.id?.toString() === filterOrg;
    return matchesSearch && matchesOrg;
  }) || [];

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Админ-панель', href: '/dashboard/admin' },
          { title: 'Модерация' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Модерация контента</h1>
          <p className="text-muted-foreground">
            Просмотр и модерация блюд в системе
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Блюда</CardTitle>
                <CardDescription>
                  Всего: {filteredDishes.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={filterOrg} onValueChange={setFilterOrg}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Организация" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все организации</SelectItem>
                    {organizations?.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isDishesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет блюд для модерации</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Фото</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Организация</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDishes.map((dish: Dish & { organization?: Organization }) => (
                    <TableRow key={dish.id}>
                      <TableCell className="font-medium">{dish.id}</TableCell>
                      <TableCell>
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{dish.name}</TableCell>
                      <TableCell>{dish.price?.toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>{dish.menuCategory?.name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {dish.organization?.name || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDishId(dish.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteDishId} onOpenChange={() => setDeleteDishId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить блюдо?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Блюдо будет удалено из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDishId && deleteDishMutation.mutate(deleteDishId)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteDishMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
