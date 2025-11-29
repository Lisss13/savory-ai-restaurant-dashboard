'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dishApi, categoryApi, uploadApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import { NutritionInput } from '@/components/nutrition';
import type { MenuCategory, NutritionData } from '@/types';

const COMMON_ALLERGENS = [
  'Глютен',
  'Молоко',
  'Яйца',
  'Орехи',
  'Рыба',
  'Соя',
  'Сульфиты',
];

const ingredientSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  quantity: z.number().min(0, 'Количество должно быть положительным'),
});

const dishSchema = z.object({
  menuCategoryId: z.string().min(1, 'Выберите категорию'),
  name: z.string().min(1, 'Введите название блюда'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  description: z.string().optional(),
  image: z.string().optional(),
  // Nutrition values (КБЖУ)
  calories: z.number().min(0).max(9999).optional(),
  proteins: z.number().min(0).max(999).optional(),
  fats: z.number().min(0).max(999).optional(),
  carbohydrates: z.number().min(0).max(999).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Добавьте хотя бы один ингредиент'),
  isDishOfDay: z.boolean(),
});

type DishFormValues = z.infer<typeof dishSchema>;

export default function EditDishPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const dishId = Number(params.id);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    proteins: 0,
    fats: 0,
    carbohydrates: 0,
  });

  const { data: dish, isLoading: isDishLoading } = useQuery({
    queryKey: ['dish', dishId],
    queryFn: async () => {
      const response = await dishApi.getById(dishId);
      return response.data;
    },
    enabled: !!dishId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await categoryApi.getByRestaurant(selectedRestaurant.id);
      return response.data.categories;
    },
    enabled: !!selectedRestaurant,
  });

  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      menuCategoryId: '',
      name: '',
      price: 0,
      description: '',
      image: '',
      calories: 0,
      proteins: 0,
      fats: 0,
      carbohydrates: 0,
      ingredients: [{ name: '', quantity: 0 }],
      isDishOfDay: false,
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } =
    useFieldArray({
      control: form.control,
      name: 'ingredients',
    });

  useEffect(() => {
    if (dish) {
      form.reset({
        menuCategoryId: dish.menuCategory?.id?.toString() || '',
        name: dish.name,
        price: dish.price,
        description: dish.description || '',
        image: dish.image || '',
        calories: dish.calories || 0,
        proteins: dish.proteins || 0,
        fats: dish.fats || 0,
        carbohydrates: dish.carbohydrates || 0,
        ingredients: dish.ingredients?.length
          ? dish.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
          : [{ name: '', quantity: 0 }],
        isDishOfDay: dish.isDishOfDay || false,
      });
      setNutrition({
        calories: dish.calories || 0,
        proteins: dish.proteins || 0,
        fats: dish.fats || 0,
        carbohydrates: dish.carbohydrates || 0,
      });
      setSelectedAllergens(dish.allergens?.map((a) => a.name) || []);
    }
  }, [dish, form]);

  const updateMutation = useMutation({
    mutationFn: (data: DishFormValues) =>
      dishApi.update(dishId, {
        restaurant_id: selectedRestaurant!.id,
        menuCategoryId: parseInt(data.menuCategoryId),
        name: data.name,
        price: data.price,
        description: data.description,
        image: data.image,
        proteins: nutrition.proteins || 0,
        fats: nutrition.fats || 0,
        carbohydrates: nutrition.carbohydrates || 0,
        calories: nutrition.calories || 0,
        ingredients: data.ingredients,
        allergens: selectedAllergens.map((name) => ({ name })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes', selectedRestaurant?.id] });
      queryClient.invalidateQueries({ queryKey: ['dish', dishId] });
      toast.success('Блюдо обновлено');
      router.push('/dashboard/menu/dishes');
    },
    onError: () => {
      toast.error('Ошибка при обновлении блюда');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadApi.uploadImage(file);
      form.setValue('image', response.data.url);
      toast.success('Изображение загружено');
    } catch {
      toast.error('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const onSubmit = (data: DishFormValues) => {
    updateMutation.mutate(data);
  };

  if (isDishLoading) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: 'Дашборд', href: '/dashboard' },
            { title: 'Меню' },
            { title: 'Блюда', href: '/dashboard/menu/dishes' },
            { title: 'Редактирование' },
          ]}
        />
        <main className="flex-1 space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[600px]" />
            <div className="space-y-6">
              <Skeleton className="h-[280px]" />
              <Skeleton className="h-[200px]" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'Меню' },
          { title: 'Блюда', href: '/dashboard/menu/dishes' },
          { title: dish?.name || 'Редактирование' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Редактирование блюда</h1>
          <p className="text-muted-foreground">
            Измените информацию о блюде
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                  <CardDescription>
                    Базовые данные о блюде
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="menuCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Категория *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: MenuCategory) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название блюда *</FormLabel>
                        <FormControl>
                          <Input placeholder="Карбонара" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цена (₽) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="500"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Классическая итальянская паста..."
                            className="min-h-[100px]"
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDishOfDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Блюдо дня
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фото блюда</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value && (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={field.value}
                                  alt="Preview"
                                  className="object-cover w-full h-full"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => form.setValue('image', '')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                              className="hidden"
                              id="dish-image"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              asChild
                              disabled={isUploading}
                            >
                              <label htmlFor="dish-image" className="cursor-pointer">
                                {isUploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                Загрузить фото
                              </label>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Пищевая ценность (на 100г)</CardTitle>
                    <CardDescription>
                      Укажите КБЖУ блюда
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NutritionInput value={nutrition} onChange={setNutrition} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ингредиенты</CardTitle>
                    <CardDescription>
                      Состав блюда
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ingredientFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Название" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="г"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          disabled={ingredientFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendIngredient({ name: '', quantity: 0 })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить ингредиент
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Аллергены</CardTitle>
                    <CardDescription>
                      Выберите аллергены
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_ALLERGENS.map((allergen) => (
                        <Button
                          key={allergen}
                          type="button"
                          variant={
                            selectedAllergens.includes(allergen)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => toggleAllergen(allergen)}
                        >
                          {allergen}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Сохранить изменения
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  );
}
