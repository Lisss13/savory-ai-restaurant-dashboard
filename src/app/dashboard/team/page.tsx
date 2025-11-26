'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Mail, Trash2, UserCog, Loader2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { organizationApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { UserInOrg } from '@/types';

interface InviteFormData {
  name: string;
  email: string;
  password: string;
  role: 'manager' | 'staff';
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuthStore();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InviteFormData>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization', organization?.id],
    queryFn: async () => {
      if (!organization) return null;
      const response = await organizationApi.getById(organization.id);
      return response.data;
    },
    enabled: !!organization,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const userResponse = await userApi.create({
        name: data.name,
        email: data.email,
        password: data.password,
        company: organization?.name || '',
      });
      await organizationApi.addUser(organization!.id, userResponse.data.id);
      return userResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Сотрудник добавлен');
      setIsInviteOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    },
    onError: () => {
      toast.error('Ошибка при добавлении сотрудника');
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: number) => organizationApi.removeUser(organization!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Сотрудник удалён');
      setDeleteUserId(null);
    },
    onError: () => {
      toast.error('Ошибка при удалении сотрудника');
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const allUsers: (UserInOrg & { isAdmin: boolean })[] = orgData
    ? [
        { ...orgData.admin, isAdmin: true } as UserInOrg & { isAdmin: boolean },
        ...(orgData.users?.map((u: UserInOrg) => ({ ...u, isAdmin: false })) || []),
      ]
    : [];

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Команда' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Команда</h1>
            <p className="text-muted-foreground">
              Управляйте сотрудниками вашей организации
            </p>
          </div>
          <Button onClick={() => setIsInviteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Пригласить сотрудника
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Сотрудники</CardTitle>
            <CardDescription>
              Всего сотрудников: {allUsers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {member.id === user?.id && (
                              <p className="text-xs text-muted-foreground">Это вы</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </a>
                      </TableCell>
                      <TableCell>{member.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={member.isAdmin ? 'default' : 'secondary'}>
                          {member.isAdmin ? 'Администратор' : 'Сотрудник'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!member.isAdmin && member.id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <UserCog className="mr-2 h-4 w-4" />
                                Изменить роль
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteUserId(member.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить сотрудника</DialogTitle>
            <DialogDescription>
              Создайте аккаунт для нового сотрудника
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Имя *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="employee@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Минимум 8 символов"
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'manager' | 'staff') =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="staff">Сотрудник</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createUserMutation.mutate(formData)}
              disabled={
                createUserMutation.isPending ||
                !formData.name ||
                !formData.email ||
                !formData.password
              }
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Пригласить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              Сотрудник будет удалён из организации. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && removeUserMutation.mutate(deleteUserId)}
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
