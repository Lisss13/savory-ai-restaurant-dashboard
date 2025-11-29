'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { tableApi, reservationApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Table, Reservation } from '@/types';

interface TableFormData {
  name: string;
  guestCount: number;
}

export default function TablesPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TableFormData>({ name: '', guestCount: 2 });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await tableApi.getByRestaurant(selectedRestaurant.id);
      return response.data.tables;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations;
    },
    enabled: !!selectedRestaurant,
  });

  const getTableStatus = (tableId: number) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const todayReservations = reservations?.filter(
      (r: Reservation) =>
        r.table_id === tableId &&
        r.date === today &&
        r.status !== 'cancelled'
    );

    const currentReservation = todayReservations?.find(
      (r: Reservation) => r.time <= currentTime && (r.end_time || '23:59') > currentTime
    );

    const nextReservation = todayReservations
      ?.filter((r: Reservation) => r.time > currentTime)
      .sort((a: Reservation, b: Reservation) => a.time.localeCompare(b.time))[0];

    if (currentReservation) {
      return { status: 'occupied', color: 'destructive', text: 'Занят' };
    }

    if (nextReservation) {
      return { status: 'reserved', color: 'warning', text: `Бронь в ${nextReservation.time}` };
    }

    return { status: 'free', color: 'success', text: 'Свободен' };
  };

  const createMutation = useMutation({
    mutationFn: (data: TableFormData) =>
      tableApi.create({
        ...data,
        restaurantId: selectedRestaurant!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Стол создан');
      setIsCreateOpen(false);
      setFormData({ name: '', guestCount: 2 });
    },
    onError: () => {
      toast.error('Ошибка при создании стола');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; form: TableFormData }) =>
      tableApi.update(data.id, {
        ...data.form,
        restaurantId: selectedRestaurant!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Стол обновлён');
      setEditTable(null);
    },
    onError: () => {
      toast.error('Ошибка при обновлении стола');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tableApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Стол удалён');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Ошибка при удалении стола');
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Введите название стола');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editTable || !formData.name.trim()) {
      toast.error('Введите название стола');
      return;
    }
    updateMutation.mutate({ id: editTable.id, form: formData });
  };

  const openEditDialog = (table: Table) => {
    setFormData({ name: table.name, guestCount: table.guestCount });
    setEditTable(table);
  };

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'Столы' }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
              <p className="text-muted-foreground text-center">
                Для управления столами необходимо выбрать ресторан
              </p>
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
          { title: 'Столы' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Столы</h1>
            <p className="text-muted-foreground">
              Управляйте столами ресторана {selectedRestaurant.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить стол
          </Button>
        </div>

        {tablesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : tables?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Нет столов</h3>
              <p className="text-muted-foreground text-center mb-4">
                Добавьте столы для управления бронированиями
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить стол
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables?.map((table: Table) => {
              const tableStatus = getTableStatus(table.id);
              return (
                <Card key={table.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{table.name}</CardTitle>
                      <Badge
                        variant={
                          tableStatus.status === 'free'
                            ? 'default'
                            : tableStatus.status === 'reserved'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {tableStatus.text}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {table.guestCount} мест
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(table)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Изменить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(table.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый стол</DialogTitle>
            <DialogDescription>
              Добавьте новый стол в ресторан
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                placeholder="Столик №1"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Вместимость</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                value={formData.guestCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    guestCount: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTable} onOpenChange={() => setEditTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать стол</DialogTitle>
            <DialogDescription>
              Измените параметры стола
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-guestCount">Вместимость</Label>
              <Input
                id="edit-guestCount"
                type="number"
                min="1"
                value={formData.guestCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    guestCount: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTable(null)}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить стол?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все бронирования этого стола будут удалены.
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
