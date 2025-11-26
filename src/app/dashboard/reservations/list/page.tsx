'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Phone,
  CalendarIcon,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { reservationApi, tableApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Reservation, Table as TableType, AvailableSlot } from '@/types';

const STATUS_MAP = {
  pending: { label: 'Ожидает', variant: 'secondary' as const },
  confirmed: { label: 'Подтверждено', variant: 'default' as const },
  cancelled: { label: 'Отменено', variant: 'destructive' as const },
  completed: { label: 'Завершено', variant: 'outline' as const },
  no_show: { label: 'Не явился', variant: 'destructive' as const },
};

interface CreateReservationForm {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  guest_count: number;
  reservation_date: Date | undefined;
  start_time: string;
  table_id: string;
  notes: string;
}

export default function ReservationsListPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateReservationForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    guest_count: 2,
    reservation_date: undefined,
    start_time: '',
    table_id: '',
    notes: '',
  });

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await reservationApi.getByRestaurant(selectedRestaurant.id);
      return response.data.reservations;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await tableApi.getByRestaurant(selectedRestaurant.id);
      return response.data.tables;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: availableSlots } = useQuery({
    queryKey: ['availableSlots', selectedRestaurant?.id, formData.reservation_date, formData.guest_count],
    queryFn: async () => {
      if (!selectedRestaurant || !formData.reservation_date) return [];
      const response = await reservationApi.getAvailableSlots(
        selectedRestaurant.id,
        format(formData.reservation_date, 'yyyy-MM-dd'),
        formData.guest_count
      );
      return response.data.slots;
    },
    enabled: !!selectedRestaurant && !!formData.reservation_date && formData.guest_count > 0,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      reservationApi.create({
        restaurant_id: selectedRestaurant!.id,
        table_id: parseInt(formData.table_id),
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        guest_count: formData.guest_count,
        reservation_date: format(formData.reservation_date!, 'yyyy-MM-dd'),
        start_time: formData.start_time,
        notes: formData.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Бронирование создано');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Ошибка при создании бронирования');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      reservationApi.update(id, { status: status as Reservation['status'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Статус обновлён');
    },
    onError: () => {
      toast.error('Ошибка при обновлении статуса');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: reservationApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Бронирование отменено');
    },
    onError: () => {
      toast.error('Ошибка при отмене бронирования');
    },
  });

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      guest_count: 2,
      reservation_date: undefined,
      start_time: '',
      table_id: '',
      notes: '',
    });
  };

  const filteredReservations = reservations?.filter((r: Reservation) => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate =
      !dateFilter || r.reservation_date === format(dateFilter, 'yyyy-MM-dd');
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'Бронирования' }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
              <p className="text-muted-foreground text-center">
                Для управления бронированиями необходимо выбрать ресторан
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
          { title: 'Бронирования' },
          { title: 'Список' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Бронирования</h1>
            <p className="text-muted-foreground">
              Список всех бронирований
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Новое бронирование
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или телефону..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="confirmed">Подтверждено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, 'dd.MM.yyyy') : 'Дата'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    locale={ru}
                  />
                  {dateFilter && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateFilter(undefined)}
                      >
                        Сбросить
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredReservations?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Бронирования не найдены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead>Гость</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead className="text-center">Гостей</TableHead>
                    <TableHead>Стол</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations?.map((reservation: Reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        {format(new Date(reservation.reservation_date), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell>
                        {reservation.start_time} - {reservation.end_time}
                      </TableCell>
                      <TableCell className="font-medium">
                        {reservation.customer_name}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${reservation.customer_phone}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          {reservation.customer_phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        {reservation.guest_count}
                      </TableCell>
                      <TableCell>{reservation.table_name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_MAP[reservation.status].variant}>
                          {STATUS_MAP[reservation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Подробнее
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {reservation.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: reservation.id,
                                    status: 'confirmed',
                                  })
                                }
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Подтвердить
                              </DropdownMenuItem>
                            )}
                            {reservation.status === 'confirmed' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: reservation.id,
                                    status: 'completed',
                                  })
                                }
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Завершить
                              </DropdownMenuItem>
                            )}
                            {(reservation.status === 'pending' ||
                              reservation.status === 'confirmed') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => cancelMutation.mutate(reservation.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Отменить
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новое бронирование</DialogTitle>
            <DialogDescription>
              Создайте бронирование для гостя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Имя гостя *</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label>Телефон *</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))
                  }
                  placeholder="+7 900 123-45-67"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customer_email: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.reservation_date
                        ? format(formData.reservation_date, 'dd.MM.yyyy')
                        : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.reservation_date}
                      onSelect={(date) =>
                        setFormData((prev) => ({ ...prev, reservation_date: date }))
                      }
                      locale={ru}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Гостей *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.guest_count}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guest_count: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {availableSlots && availableSlots.length > 0 && (
              <div className="space-y-2">
                <Label>Время и стол *</Label>
                <Select
                  value={`${formData.table_id}-${formData.start_time}`}
                  onValueChange={(value) => {
                    const [tableId, time] = value.split('-');
                    setFormData((prev) => ({
                      ...prev,
                      table_id: tableId,
                      start_time: time,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите время" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot: AvailableSlot) => (
                      <SelectItem
                        key={`${slot.table_id}-${slot.start_time}`}
                        value={`${slot.table_id}-${slot.start_time}`}
                      >
                        {slot.start_time} - {slot.table_name} ({slot.capacity} мест)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.reservation_date && availableSlots?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Нет доступных столов на выбранную дату
              </p>
            )}

            <div className="space-y-2">
              <Label>Примечание</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Столик у окна..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !formData.customer_name ||
                !formData.customer_phone ||
                !formData.reservation_date ||
                !formData.table_id ||
                !formData.start_time
              }
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
