'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
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
import { categoryApi, dishApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { MenuCategory, Dish } from '@/types';

interface SortableCategoryItemProps {
  category: MenuCategory;
  dishCount: number;
  onEdit: (category: MenuCategory) => void;
  onDelete: (id: number) => void;
}

function SortableCategoryItem({ category, dishCount, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{category.name}</p>
      </div>
      <Badge variant="secondary">
        {dishCount} блюд
      </Badge>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category.id)}
          disabled={dishCount > 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await categoryApi.getByRestaurant(selectedRestaurant.id);
      return response.data.categories;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: dishes } = useQuery({
    queryKey: ['dishes', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await dishApi.getByRestaurant(selectedRestaurant.id);
      return response.data.dishes;
    },
    enabled: !!selectedRestaurant,
  });

  const sortedCategories = useMemo(() =>
    [...(categories || [])].sort((a: MenuCategory, b: MenuCategory) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
    [categories]
  );

  const getDishCount = (categoryId: number) => {
    return dishes?.filter((d: Dish) => d.menuCategory?.id === categoryId).length || 0;
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryApi.create({ name, restaurant_id: selectedRestaurant!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant?.id] });
      toast.success('Категория создана');
      setIsCreateOpen(false);
      setNewCategoryName('');
    },
    onError: () => {
      toast.error('Ошибка при создании категории');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      categoryApi.update(id, { name, restaurant_id: selectedRestaurant!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant?.id] });
      toast.success('Категория обновлена');
      setEditCategory(null);
    },
    onError: () => {
      toast.error('Ошибка при обновлении категории');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant?.id] });
      toast.success('Категория удалена');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Ошибка при удалении категории');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (newCategories: MenuCategory[]) =>
      categoryApi.updateSortOrder({
        categories: newCategories.map((cat, index) => ({
          id: cat.id,
          sort_order: index,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant?.id] });
      toast.success('Порядок сохранён');
    },
    onError: () => {
      toast.error('Ошибка при сохранении порядка');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
      const newIndex = sortedCategories.findIndex((c) => c.id === over.id);

      const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);

      // Optimistic update
      queryClient.setQueryData(
        ['categories', selectedRestaurant?.id],
        newOrder.map((c, index) => ({ ...c, sort_order: index }))
      );

      reorderMutation.mutate(newOrder);
    }
  };

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'Меню' }, { title: 'Категории' }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
              <p className="text-muted-foreground text-center">
                Для управления категориями меню необходимо выбрать ресторан
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const handleCreate = () => {
    if (!newCategoryName.trim()) {
      toast.error('Введите название категории');
      return;
    }
    createMutation.mutate(newCategoryName);
  };

  const handleUpdate = () => {
    if (!editCategory?.name.trim()) {
      toast.error('Введите название категории');
      return;
    }
    updateMutation.mutate({ id: editCategory.id, name: editCategory.name });
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Меню' },
          { title: 'Категории' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Категории меню</h1>
            <p className="text-muted-foreground">
              Управляйте категориями блюд
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Все категории</CardTitle>
            <CardDescription>
              Перетащите для изменения порядка отображения в меню
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет категорий. Создайте первую категорию.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedCategories.map((category: MenuCategory) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        dishCount={getDishCount(category.id)}
                        onEdit={setEditCategory}
                        onDelete={setDeleteId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая категория</DialogTitle>
            <DialogDescription>
              Введите название для новой категории меню
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название категории"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
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

      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>
              Измените название категории
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название категории"
              value={editCategory?.name || ''}
              onChange={(e) =>
                setEditCategory((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>
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
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Категория будет удалена.
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
