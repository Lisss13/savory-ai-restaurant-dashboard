'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
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
import { useTranslation } from '@/i18n';
import type { Reservation, Table as TableType, AvailableSlot } from '@/types';

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
  const { t } = useTranslation();
  const router = useRouter();
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

  const STATUS_MAP = {
    pending: { label: t.reservations.pending, variant: 'secondary' as const },
    confirmed: { label: t.reservations.confirmed, variant: 'default' as const },
    cancelled: { label: t.reservations.cancelled, variant: 'destructive' as const },
    completed: { label: t.reservations.completed, variant: 'outline' as const },
  };

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
      toast.success(t.reservations.reservationCreated);
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t.reservations.reservationCreateError);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      reservationApi.update(id, { status: status as Reservation['status'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success(t.reservations.statusUpdated);
    },
    onError: () => {
      toast.error(t.reservations.statusUpdateError);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: reservationApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success(t.reservations.reservationCancelled);
    },
    onError: () => {
      toast.error(t.reservations.reservationCancelError);
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
    const customerName = r.customer_name || '';
    const customerPhone = r.customer_phone || '';
    const matchesSearch =
      !search ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate =
      !dateFilter || r.reservation_date === format(dateFilter, 'yyyy-MM-dd');
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.reservations }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">{t.restaurants.selectRestaurant}</h3>
              <p className="text-muted-foreground text-center">
                {t.reservations.selectRestaurantForReservations}
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
          { title: t.nav.reservations },
          { title: t.nav.list },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.reservations.listTitle}</h1>
            <p className="text-muted-foreground">
              {t.reservations.listSubtitle}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.reservations.newReservation}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.reservations.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t.reservations.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.reservations.allStatuses}</SelectItem>
                  <SelectItem value="pending">{t.reservations.pending}</SelectItem>
                  <SelectItem value="confirmed">{t.reservations.confirmed}</SelectItem>
                  <SelectItem value="cancelled">{t.reservations.cancelled}</SelectItem>
                  <SelectItem value="completed">{t.reservations.completed}</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, 'dd.MM.yyyy') : t.reservations.date}
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
                        {t.reservations.reset}
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
                {t.reservations.reservationsNotFound}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.reservations.date}</TableHead>
                    <TableHead>{t.reservations.time}</TableHead>
                    <TableHead>{t.reservations.guest}</TableHead>
                    <TableHead>{t.reservations.phone}</TableHead>
                    <TableHead className="text-center">{t.reservations.guests}</TableHead>
                    <TableHead>{t.reservations.table}</TableHead>
                    <TableHead>{t.reservations.status}</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations?.map((reservation: Reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        {reservation.reservation_date ? format(new Date(reservation.reservation_date), 'dd.MM.yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{reservation.start_time || '—'} - {reservation.end_time || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {reservation.customer_name || '—'}
                      </TableCell>
                      <TableCell>
                        {reservation.customer_phone ? (
                          <a
                            href={`tel:${reservation.customer_phone}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Phone className="h-3 w-3" />
                            {reservation.customer_phone}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {reservation.guest_count || 0}
                      </TableCell>
                      <TableCell>{reservation.table_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_MAP[reservation.status]?.variant || 'secondary'}>
                          {STATUS_MAP[reservation.status]?.label || reservation.status}
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
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t.reservations.viewDetails}
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
                                {t.reservations.confirm}
                              </DropdownMenuItem>
                            )}
                            {(reservation.status === 'pending' ||
                              reservation.status === 'confirmed') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => cancelMutation.mutate(reservation.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                {t.common.cancel}
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
            <DialogTitle>{t.reservations.createReservation}</DialogTitle>
            <DialogDescription>
              {t.reservations.createReservationDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.reservations.guestName} *</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  placeholder={t.reservations.guestNamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.reservations.phoneRequired} *</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))
                  }
                  placeholder={t.reservations.phonePlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.reservations.email}</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customer_email: e.target.value }))
                }
                placeholder={t.reservations.emailPlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.reservations.dateRequired} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.reservation_date
                        ? format(formData.reservation_date, 'dd.MM.yyyy')
                        : t.reservations.selectDate}
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
                <Label>{t.reservations.guestsRequired} *</Label>
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
                <Label>{t.reservations.timeAndTable} *</Label>
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
                    <SelectValue placeholder={t.reservations.selectTime} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot: AvailableSlot) => (
                      <SelectItem
                        key={`${slot.table_id}-${slot.start_time}`}
                        value={`${slot.table_id}-${slot.start_time}`}
                      >
                        {slot.start_time} - {slot.table_name} ({slot.capacity} {t.reservations.seats})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.reservation_date && availableSlots?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t.reservations.noAvailableTables}
              </p>
            )}

            <div className="space-y-2">
              <Label>{t.reservations.note}</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t.reservations.notePlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t.common.cancel}
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
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
