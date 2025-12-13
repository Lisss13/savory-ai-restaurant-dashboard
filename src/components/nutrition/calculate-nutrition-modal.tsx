'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/i18n';

interface Ingredient {
  name: string;
  quantity: number;
}

interface CalculateNutritionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishName: string;
  dishDescription: string;
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
  onCalculate: () => void;
}

export function CalculateNutritionModal({
  open,
  onOpenChange,
  dishName,
  dishDescription,
  ingredients,
  isLoading,
  error,
  onCalculate,
}: CalculateNutritionModalProps) {
  const { t } = useTranslation();

  // Filter valid ingredients (with name and quantity > 0)
  const validIngredients = ingredients.filter(
    (ing) => ing.name.trim() && ing.quantity > 0
  );

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (isLoading) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isLoading}
        onPointerDownOutside={(e) => {
          if (isLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t.menuSection.calculateNutritionTitle}</DialogTitle>
          <DialogDescription>
            {t.menuSection.calculateNutritionDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dish data section */}
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {t.menuSection.calculateNutritionName}:
              </span>
              <p className="text-sm">{dishName}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {t.menuSection.calculateNutritionDescription}:
              </span>
              <p className="text-sm">{dishDescription || '—'}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {t.menuSection.calculateNutritionIngredients}:
              </span>
              <ul className="mt-1 space-y-1 text-sm">
                {validIngredients.map((ingredient, index) => (
                  <li key={index}>
                    • {ingredient.name}: {ingredient.quantity} г
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning */}
          <p className="text-sm text-muted-foreground">
            {t.menuSection.calculateNutritionWarning}
          </p>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.common.cancel}
          </Button>
          <Button onClick={onCalculate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.menuSection.calculateNutritionCalculating}
              </>
            ) : (
              t.menuSection.calculateNutrition
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
