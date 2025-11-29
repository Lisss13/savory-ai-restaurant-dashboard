'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { languageApi, organizationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Language } from '@/types';

export default function LanguagesSettingsPage() {
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const [deleteLanguageId, setDeleteLanguageId] = useState<number | null>(null);

  const { data: allLanguages, isLoading: isAllLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await languageApi.getAll();
      return response.data.languages || [];
    },
  });

  const { data: orgLanguages, isLoading: isOrgLoading } = useQuery({
    queryKey: ['organization', organization?.id, 'languages'],
    queryFn: async () => {
      if (!organization) return [];
      const response = await organizationApi.getById(organization.id);
      return response.data.languages || [];
    },
    enabled: !!organization,
  });

  const isLoading = isAllLoading || isOrgLoading;

  const orgLanguageIds = new Set(orgLanguages?.map((l: Language) => l.id) || []);

  const addLanguageMutation = useMutation({
    mutationFn: (languageId: number) =>
      organizationApi.addLanguage(organization!.id, languageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization?.id, 'languages'] });
      toast.success('Язык добавлен');
    },
    onError: () => {
      toast.error('Ошибка добавления языка');
    },
  });

  const removeLanguageMutation = useMutation({
    mutationFn: (languageId: number) =>
      organizationApi.removeLanguage(organization!.id, languageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization?.id, 'languages'] });
      toast.success('Язык удалён');
      setDeleteLanguageId(null);
    },
    onError: () => {
      toast.error('Ошибка удаления языка');
    },
  });

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Настройки' },
          { title: 'Языки' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Языки</h1>
          <p className="text-muted-foreground">
            Управляйте языками вашей организации
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Доступные языки</CardTitle>
            <CardDescription>
              Выберите языки, на которых будет доступен ваш контент
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Язык</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLanguages?.map((language: Language) => {
                    const isEnabled = orgLanguageIds.has(language.id);
                    return (
                      <TableRow key={language.id}>
                        <TableCell className="font-medium">
                          {language.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{language.code}</Badge>
                        </TableCell>
                        <TableCell>
                          {isEnabled ? (
                            <Badge variant="default">
                              <Check className="mr-1 h-3 w-3" />
                              Включён
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Выключен</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEnabled ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteLanguageId(language.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addLanguageMutation.mutate(language.id)}
                              disabled={addLanguageMutation.isPending}
                            >
                              {addLanguageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteLanguageId} onOpenChange={() => setDeleteLanguageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить язык?</AlertDialogTitle>
            <AlertDialogDescription>
              Контент на этом языке станет недоступен для гостей.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLanguageId && removeLanguageMutation.mutate(deleteLanguageId)}
              className="bg-destructive text-destructive-foreground"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
