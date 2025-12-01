'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface SortableQuestionItemProps {
  question: Question;
  onDelete: (id: number) => void;
  allLanguagesText: string;
}

function SortableQuestionItem({ question, onDelete, allLanguagesText }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{question.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {question.language?.name || allLanguagesText}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(question.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function QuestionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [formData, setFormData] = useState({
    text: '',
    type: 'menu' as 'menu' | 'reservation',
    languageId: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      toast.success(t.questionsSection.questionAdded);
      setIsCreateOpen(false);
      setFormData({ text: '', type: 'menu', languageId: '' });
    },
    onError: () => {
      toast.error(t.questionsSection.questionAddError);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => questionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t.questionsSection.questionDeleted);
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t.questionsSection.questionDeleteError);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (questionIds: number[]) => questionApi.reorder({ questionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t.questionsSection.orderSaved);
    },
    onError: () => {
      toast.error(t.questionsSection.orderSaveError);
    },
  });

  const menuQuestions = useMemo(() =>
    (questions?.filter((q: Question) => q.chat_type === 'menu') || [])
      .sort((a: Question, b: Question) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [questions]
  );

  const reservationQuestions = useMemo(() =>
    (questions?.filter((q: Question) => q.chat_type === 'reservation') || [])
      .sort((a: Question, b: Question) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [questions]
  );

  const handleDragEnd = (event: DragEndEvent, questionsList: Question[]) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questionsList.findIndex((q) => q.id === active.id);
      const newIndex = questionsList.findIndex((q) => q.id === over.id);

      const newOrder = arrayMove(questionsList, oldIndex, newIndex);
      const questionIds = newOrder.map((q) => q.id);

      // Optimistic update
      queryClient.setQueryData(['questions'], (old: Question[] | undefined) => {
        if (!old) return old;
        const otherQuestions = old.filter((q) => q.chat_type !== questionsList[0]?.chat_type);
        return [...otherQuestions, ...newOrder.map((q, index) => ({ ...q, display_order: index }))];
      });

      reorderMutation.mutate(questionIds);
    }
  };

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
          <p>{t.questionsSection.noQuestionsInCategory}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFormData({ ...formData, type: activeTab as 'menu' | 'reservation' });
              setIsCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t.questionsSection.addQuestion}
          </Button>
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleDragEnd(event, questionsList)}
      >
        <SortableContext
          items={questionsList.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {questionsList.map((question: Question) => (
              <SortableQuestionItem
                key={question.id}
                question={question}
                onDelete={setDeleteId}
                allLanguagesText={t.questionsSection.allLanguages}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.questions },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.questionsSection.title}</h1>
            <p className="text-muted-foreground">
              {t.questionsSection.subtitle}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.questionsSection.addQuestion}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.questionsSection.questionsByCategory}</CardTitle>
            <CardDescription>
              {t.questionsSection.dragToReorderDisplay}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="menu">
                  {t.questionsSection.menuQuestions} ({menuQuestions.length})
                </TabsTrigger>
                <TabsTrigger value="reservation">
                  {t.questionsSection.reservationQuestions} ({reservationQuestions.length})
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
            <DialogTitle>{t.questionsSection.addQuestion}</DialogTitle>
            <DialogDescription>
              {t.questionsSection.createNewQuestion}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.questionsSection.questionText} *</Label>
              <Input
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder={t.questionsSection.questionTextPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.questionsSection.questionType} *</Label>
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
                  <SelectItem value="menu">{t.questionsSection.aboutMenu}</SelectItem>
                  <SelectItem value="reservation">{t.questionsSection.aboutReservation}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.questionsSection.language}</Label>
              <Select
                value={formData.languageId}
                onValueChange={(value) =>
                  setFormData({ ...formData, languageId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.questionsSection.allLanguages} />
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
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formData.text}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t.common.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.questionsSection.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.questionsSection.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
