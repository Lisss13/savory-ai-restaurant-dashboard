'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calculator, Loader2 } from 'lucide-react';
import { dishApi } from '@/lib/api';
import { useTranslation } from '@/i18n';
import { CalculateNutritionModal } from './calculate-nutrition-modal';
import type { NutritionData } from '@/types';

interface Ingredient {
  name: string;
  quantity: number;
}

interface NutritionInputProps {
  value: NutritionData;
  onChange: (value: NutritionData) => void;
  // Optional props for AI calculation
  dishName?: string;
  dishDescription?: string;
  ingredients?: Ingredient[];
}

export function NutritionInput({
  value,
  onChange,
  dishName,
  dishDescription,
  ingredients,
}: NutritionInputProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const handleChange = (field: keyof NutritionData, inputValue: string) => {
    const numericValue = inputValue === '' ? 0 : parseFloat(inputValue);
    onChange({
      ...value,
      [field]: isNaN(numericValue) ? 0 : numericValue,
    });
  };

  // Check if calculation is possible
  const canCalculate =
    dishName?.trim() &&
    dishDescription?.trim() &&
    ingredients &&
    ingredients.length > 0 &&
    ingredients.some((ing) => ing.name.trim() && ing.quantity > 0);

  // Check if calculation feature is available
  const showCalculateButton =
    dishName !== undefined &&
    dishDescription !== undefined &&
    ingredients !== undefined;

  const calculateMutation = useMutation({
    mutationFn: async () => {
      if (!dishName || !dishDescription || !ingredients) {
        throw new Error('Missing required data');
      }

      // Filter valid ingredients
      const validIngredients = ingredients.filter(
        (ing) => ing.name.trim() && ing.quantity > 0
      );

      const response = await dishApi.calculateNutrition({
        name: dishName,
        description: dishDescription,
        ingredients: validIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
        })),
      });

      return response.data;
    },
    onSuccess: (data) => {
      // Map API response to NutritionData format
      onChange({
        calories: data.calories,
        proteins: data.protein,
        fats: data.fat,
        carbohydrates: data.carbs,
      });
      setIsModalOpen(false);
      setCalculationError(null);
      toast.success(t.menuSection.calculateNutritionSuccess);
    },
    onError: () => {
      setCalculationError(t.menuSection.calculateNutritionError);
    },
  });

  const handleOpenModal = () => {
    setCalculationError(null);
    setIsModalOpen(true);
  };

  const handleCalculate = () => {
    setCalculationError(null);
    calculateMutation.mutate();
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Укажите пищевую ценность для информирования гостей</span>
        </div>

        {showCalculateButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            disabled={!canCalculate || calculateMutation.isPending}
          >
            {calculateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.menuSection.calculateNutritionCalculating}
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                {t.menuSection.calculateNutrition}
              </>
            )}
          </Button>
        )}
      </div>

      {showCalculateButton && (
        <CalculateNutritionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          dishName={dishName || ''}
          dishDescription={dishDescription || ''}
          ingredients={ingredients || []}
          isLoading={calculateMutation.isPending}
          error={calculationError}
          onCalculate={handleCalculate}
        />
      )}
    </div>
  );
}
