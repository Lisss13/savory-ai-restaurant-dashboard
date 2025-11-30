'use client';

import Link from 'next/link';
import { Store, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRestaurantStore } from '@/store/restaurant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RestaurantRequiredProps {
  title?: string;
}

export function RestaurantRequired({ title = 'данными' }: RestaurantRequiredProps) {
  const { restaurants, selectedRestaurant, setSelectedRestaurant } = useRestaurantStore();

  // If restaurant is selected, don't render anything
  if (selectedRestaurant) {
    return null;
  }

  // No restaurants in organization
  if (!restaurants || restaurants.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Нет ресторанов</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Для управления {title} необходимо сначала создать ресторан
          </p>
          <Button asChild>
            <Link href="/dashboard/restaurants/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать ресторан
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Restaurants exist but none selected
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Для управления {title} необходимо выбрать ресторан
        </p>
        <Select
          onValueChange={(value) => {
            const restaurant = restaurants.find((r) => r.id.toString() === value);
            if (restaurant) {
              setSelectedRestaurant(restaurant);
            }
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Выберите ресторан" />
          </SelectTrigger>
          <SelectContent>
            {restaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
