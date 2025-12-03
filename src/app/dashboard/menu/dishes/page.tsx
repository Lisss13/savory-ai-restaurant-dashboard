'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Filter,
  FolderOpen,
  UtensilsCrossed,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { dishApi, categoryApi, getImageUrl } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import { RestaurantRequired } from '@/components/restaurant-required';
import { useTranslation } from '@/i18n';
import type { Dish, MenuCategory } from '@/types';

export default function DishesPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const { t, language } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: dishes, isLoading: dishesLoading } = useQuery({
    queryKey: ['dishes', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await dishApi.getByRestaurant(selectedRestaurant.id);
      return response.data.dishes;
    },
    enabled: !!selectedRestaurant,
  });

  const { data: categories, isLoading: categoriesLoading, isSuccess: categoriesLoaded } = useQuery({
    queryKey: ['categories', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await categoryApi.getByRestaurant(selectedRestaurant.id);
      return response.data.categories || [];
    },
    enabled: !!selectedRestaurant,
  });

  const deleteMutation = useMutation({
    mutationFn: dishApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes', selectedRestaurant?.id] });
      toast.success(t.menuSection.dishDeleted);
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t.menuSection.dishDeleteError);
    },
  });

  const dishOfDayMutation = useMutation({
    mutationFn: dishApi.setDishOfDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes', selectedRestaurant?.id] });
      toast.success(t.menuSection.dishOfDayUpdated);
    },
    onError: () => {
      toast.error(t.menuSection.dishOfDayError);
    },
  });

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.menu }, { title: t.nav.dishes }]} />
        <main className="flex-1 p-6">
          <RestaurantRequired title={t.menuSection.dishes.toLowerCase()} />
        </main>
      </>
    );
  }

  // Show message if no categories exist
  const hasNoCategories = categoriesLoaded && (!categories || categories.length === 0);

  if (hasNoCategories) {
    return (
      <>
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.menu }, { title: t.nav.dishes }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.menuSection.noCategories}</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {t.menuSection.createCategoryFirst}
              </p>
              <Button asChild>
                <Link href="/dashboard/menu/categories">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.menuSection.createCategory}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const filteredDishes = dishes?.filter((dish: Dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || dish.menuCategory?.id.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: language === 'ru' ? 'RUB' : 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.menu },
          { title: t.nav.dishes },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.menuSection.dishes}</h1>
            <p className="text-muted-foreground">
              {t.menuSection.manageDishes}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/menu/dishes/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.menuSection.addDish}
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.menuSection.searchDishes}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t.menuSection.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.menuSection.allCategories}</SelectItem>
                  {categories?.map((category: MenuCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dishesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDishes?.length === 0 ? (
              search || categoryFilter !== 'all' ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.menuSection.dishesNotFound}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t.menuSection.noDishes}</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {t.menuSection.addFirstDish}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/menu/dishes/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t.menuSection.addDish}
                    </Link>
                  </Button>
                </div>
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t.menuSection.photo}</TableHead>
                    <TableHead>{t.menuSection.name}</TableHead>
                    <TableHead>{t.menuSection.category}</TableHead>
                    <TableHead className="text-right">{t.menuSection.price}</TableHead>
                    <TableHead className="w-24 text-center">{t.menuSection.dishOfDay}</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDishes?.map((dish: Dish) => (
                    <TableRow key={dish.id}>
                      <TableCell>
                        {dish.image ? (
                          <img
                            src={getImageUrl(dish.image)}
                            alt={dish.name}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            {t.menuSection.noPhoto}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dish.name}</p>
                          {dish.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {dish.menuCategory?.name || t.menuSection.noCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(dish.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dishOfDayMutation.mutate(dish.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/menu/dishes/${dish.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t.common.edit}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(dish.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.common.delete}
                            </DropdownMenuItem>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.menuSection.deleteDishConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.menuSection.deleteDishWarning}
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
