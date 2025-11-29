'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { questionApi, languageApi } from '@/lib/api';
import type { Question, Language } from '@/types';

export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [formData, setFormData] = useState({
    text: '',
    type: 'menu' as 'menu' | 'reservation',
    languageId: '',
  });

  const { data: questions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await questionApi.getAll();
      return response.data.questions || [];
    },
  });

  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await languageApi.getAll();
      return response.data.languages || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      questionApi.create({
        text: formData.text,
        chatType: formData.type as 'menu' | 'reservation',
        languageCode: languages?.find((l: { id: number; code: string }) => l.id.toString() === formData.languageId)?.code,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Вопрос добавлен');
      setIsCreateOpen(false);
      setFormData({ text: '', type: 'menu', languageId: '' });
    },
    onError: () => {
      toast.error('Ошибка при добавлении вопроса');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => questionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Вопрос удалён');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Ошибка при удалении вопроса');
    },
  });

  const menuQuestions = questions?.filter((q: Question) => q.chat_type === 'menu') || [];
  const reservationQuestions = questions?.filter((q: Question) => q.chat_type === 'reservation') || [];

  const renderQuestionList = (questionsList: Question[]) => {
    if (isQuestionsLoading) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (questionsList.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>Нет вопросов в этой категории</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFormData({ ...formData, type: activeTab as 'menu' | 'reservation' });
              setIsCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить вопрос
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {questionsList.map((question: Question) => (
          <div
            key={question.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex-1">
              <p className="font-medium">{question.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {question.language?.name || 'Русский'}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(question.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Вопросы' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Быстрые вопросы</h1>
            <p className="text-muted-foreground">
              Настройте вопросы, которые гости видят при начале чата
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить вопрос
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вопросы по категориям</CardTitle>
            <CardDescription>
              Перетащите вопросы для изменения порядка
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="menu">
                  Вопросы о меню ({menuQuestions.length})
                </TabsTrigger>
                <TabsTrigger value="reservation">
                  Вопросы о бронировании ({reservationQuestions.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="menu">
                {renderQuestionList(menuQuestions)}
              </TabsContent>
              <TabsContent value="reservation">
                {renderQuestionList(reservationQuestions)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить вопрос</DialogTitle>
            <DialogDescription>
              Создайте новый быстрый вопрос для чата
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Текст вопроса *</Label>
              <Input
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Какие у вас фирменные блюда?"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип вопроса *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'menu' | 'reservation') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">О меню</SelectItem>
                  <SelectItem value="reservation">О бронировании</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Язык</Label>
              <Select
                value={formData.languageId}
                onValueChange={(value) =>
                  setFormData({ ...formData, languageId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  {languages?.map((lang: Language) => (
                    <SelectItem key={lang.id} value={lang.id.toString()}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formData.text}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
