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
import { useTranslation } from '@/i18n';
import type { Table, Reservation } from '@/types';

interface TableFormData {
  name: string;
  guestCount: number;
}

export default function TablesPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const { t } = useTranslation();
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
        r.reservation_date === today &&
        r.status !== 'cancelled'
    );

    const currentReservation = todayReservations?.find(
      (r: Reservation) => r.start_time <= currentTime && (r.end_time || '23:59') > currentTime
    );

    const nextReservation = todayReservations
      ?.filter((r: Reservation) => r.start_time > currentTime)
      .sort((a: Reservation, b: Reservation) => a.start_time.localeCompare(b.start_time))[0];

    if (currentReservation) {
      return { status: 'occupied', color: 'destructive', text: t.tablesSection.occupied };
    }

    if (nextReservation) {
      return { status: 'reserved', color: 'warning', text: `${t.tablesSection.reservationAt} ${nextReservation.start_time}` };
    }

    return { status: 'free', color: 'success', text: t.tablesSection.available };
  };

  const createMutation = useMutation({
    mutationFn: (data: TableFormData) =>
      tableApi.create({
        ...data,
        restaurantId: selectedRestaurant!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(t.tablesSection.tableCreated);
      setIsCreateOpen(false);
      setFormData({ name: '', guestCount: 2 });
    },
    onError: () => {
      toast.error(t.tablesSection.tableCreateError);
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
      toast.success(t.tablesSection.tableUpdated);
      setEditTable(null);
    },
    onError: () => {
      toast.error(t.tablesSection.tableUpdateError);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tableApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(t.tablesSection.tableDeleted);
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t.tablesSection.tableDeleteError);
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error(t.tablesSection.enterTableName);
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editTable || !formData.name.trim()) {
      toast.error(t.tablesSection.enterTableName);
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
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.tables }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">{t.tablesSection.selectRestaurant}</h3>
              <p className="text-muted-foreground text-center">
                {t.tablesSection.selectRestaurantForTables}
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
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.tables },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.tablesSection.title}</h1>
            <p className="text-muted-foreground">
              {t.tablesSection.manageTables} {selectedRestaurant.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.tablesSection.addTable}
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
              <h3 className="text-lg font-semibold mb-2">{t.tablesSection.noTables}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {t.tablesSection.addTablesForReservations}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t.tablesSection.addTable}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables?.map((table: Table) => {
              const tableStatus = getTableStatus(table.id);
              return (
                <Card key={table.id} className="flex flex-col">
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
                    <CardDescription className="flex items-center gap-3">
                      <span>ID: {table.id}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {table.guestCount} {t.tablesSection.seats}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(table)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t.tablesSection.edit}
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
            <DialogTitle>{t.tablesSection.newTable}</DialogTitle>
            <DialogDescription>
              {t.tablesSection.addNewTable}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.tablesSection.tableName}</Label>
              <Input
                id="name"
                placeholder={t.tablesSection.tablePlaceholder}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">{t.tablesSection.capacity}</Label>
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
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTable} onOpenChange={() => setEditTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.tablesSection.editTable}</DialogTitle>
            <DialogDescription>
              {t.tablesSection.editTableParams}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.tablesSection.tableName}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-guestCount">{t.tablesSection.capacity}</Label>
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
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tablesSection.deleteTableConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tablesSection.deleteTableWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
