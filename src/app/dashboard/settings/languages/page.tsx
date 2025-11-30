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
import { useTranslation } from '@/i18n';

export default function LanguagesSettingsPage() {
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const { t } = useTranslation();
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
      toast.success(t.settingsSection.languageAdded);
    },
    onError: () => {
      toast.error(t.settingsSection.languageAddError);
    },
  });

  const removeLanguageMutation = useMutation({
    mutationFn: (languageId: number) =>
      organizationApi.removeLanguage(organization!.id, languageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization?.id, 'languages'] });
      toast.success(t.settingsSection.languageRemoved);
      setDeleteLanguageId(null);
    },
    onError: () => {
      toast.error(t.settingsSection.languageRemoveError);
    },
  });

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.settings },
          { title: t.nav.languages },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.settingsSection.languages}</h1>
          <p className="text-muted-foreground">
            {t.settingsSection.languagesSubtitle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.settingsSection.availableLanguages}</CardTitle>
            <CardDescription>
              {t.settingsSection.selectLanguages}
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
                    <TableHead>{t.language.select}</TableHead>
                    <TableHead>{t.settingsSection.languageCode}</TableHead>
                    <TableHead>{t.settingsSection.languageStatus}</TableHead>
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
                              {t.settingsSection.enabled}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t.settingsSection.disabled}</Badge>
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
            <AlertDialogTitle>{t.settingsSection.removeLanguage}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.settingsSection.removeLanguageWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLanguageId && removeLanguageMutation.mutate(deleteLanguageId)}
              className="bg-destructive text-destructive-foreground"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
