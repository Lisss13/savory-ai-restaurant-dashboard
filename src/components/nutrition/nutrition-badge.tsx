'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';
import type { NutritionData } from '@/types';

interface NutritionBadgeProps extends NutritionData {
  showTooltip?: boolean;
}

export function NutritionBadge({
  calories,
  proteins,
  fats,
  carbohydrates,
  showTooltip = true,
}: NutritionBadgeProps) {
  const hasNutritionData = calories > 0 || proteins > 0 || fats > 0 || carbohydrates > 0;

  if (!hasNutritionData) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const content = (
    <div className="flex items-center gap-1 text-sm">
      <Flame className="h-3.5 w-3.5 text-orange-500" />
      <span>{calories} ккал</span>
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help inline-flex">{content}</div>
      </TooltipTrigger>
      <TooltipContent side="top" className="p-3">
        <div className="space-y-1.5 text-sm">
          <div className="font-medium mb-2">Пищевая ценность</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Калории:</span>
            <span className="font-medium">{calories} ккал</span>
            <span className="text-muted-foreground">Белки:</span>
            <span className="font-medium">{proteins} г</span>
            <span className="text-muted-foreground">Жиры:</span>
            <span className="font-medium">{fats} г</span>
            <span className="text-muted-foreground">Углеводы:</span>
            <span className="font-medium">{carbohydrates} г</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
