'use client';

import type { NutritionData } from '@/types';

interface NutritionCardProps extends NutritionData {
  title?: string;
  showEmpty?: boolean;
}

export function NutritionCard({
  calories,
  proteins,
  fats,
  carbohydrates,
  title = 'Пищевая ценность (на 100г)',
  showEmpty = false,
}: NutritionCardProps) {
  const hasNutritionData = calories > 0 || proteins > 0 || fats > 0 || carbohydrates > 0;

  if (!hasNutritionData && !showEmpty) {
    return null;
  }

  if (!hasNutritionData && showEmpty) {
    return (
      <div className="border rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground mb-3">{title}</div>
        <div className="text-sm text-muted-foreground">Не указано</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm font-medium text-muted-foreground mb-3">{title}</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="space-y-1">
          <div className="text-xl font-semibold">{calories}</div>
          <div className="text-xs text-muted-foreground">ккал</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl font-semibold">{proteins}</div>
          <div className="text-xs text-muted-foreground">белки</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl font-semibold">{fats}</div>
          <div className="text-xs text-muted-foreground">жиры</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl font-semibold">{carbohydrates}</div>
          <div className="text-xs text-muted-foreground">углев.</div>
        </div>
      </div>
    </div>
  );
}
