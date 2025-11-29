'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lightbulb } from 'lucide-react';
import type { NutritionData } from '@/types';

interface NutritionInputProps {
  value: NutritionData;
  onChange: (value: NutritionData) => void;
}

export function NutritionInput({ value, onChange }: NutritionInputProps) {
  const handleChange = (field: keyof NutritionData, inputValue: string) => {
    const numericValue = inputValue === '' ? 0 : parseFloat(inputValue);
    onChange({
      ...value,
      [field]: isNaN(numericValue) ? 0 : numericValue,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="calories">Калории</Label>
          <div className="relative">
            <Input
              id="calories"
              type="number"
              min={0}
              max={9999}
              step={1}
              placeholder="0"
              value={value.calories || ''}
              onChange={(e) => handleChange('calories', e.target.value)}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ккал
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proteins">Белки</Label>
          <div className="relative">
            <Input
              id="proteins"
              type="number"
              min={0}
              max={999}
              step={0.1}
              placeholder="0"
              value={value.proteins || ''}
              onChange={(e) => handleChange('proteins', e.target.value)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              г
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fats">Жиры</Label>
          <div className="relative">
            <Input
              id="fats"
              type="number"
              min={0}
              max={999}
              step={0.1}
              placeholder="0"
              value={value.fats || ''}
              onChange={(e) => handleChange('fats', e.target.value)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              г
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carbohydrates">Углеводы</Label>
          <div className="relative">
            <Input
              id="carbohydrates"
              type="number"
              min={0}
              max={999}
              step={0.1}
              placeholder="0"
              value={value.carbohydrates || ''}
              onChange={(e) => handleChange('carbohydrates', e.target.value)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              г
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>Укажите пищевую ценность для информирования гостей</span>
      </div>
    </div>
  );
}
