'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Store, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useRestaurantStore } from '@/store/restaurant';

interface HeaderProps {
  breadcrumbs?: { title: string; href?: string }[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const { setTheme } = useTheme();
  const { restaurants, selectedRestaurant, setSelectedRestaurant } = useRestaurantStore();

  const hasMultipleRestaurants = restaurants.length > 1;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {index < breadcrumbs.length - 1 ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="ml-auto flex items-center gap-2">
        {hasMultipleRestaurants && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Store className="h-4 w-4" />
                <span className="max-w-[150px] truncate">
                  {selectedRestaurant?.name || 'Выберите ресторан'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {restaurants.map((restaurant) => (
                <DropdownMenuItem
                  key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{restaurant.name}</span>
                  {selectedRestaurant?.id === restaurant.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Переключить тему</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Светлая
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Тёмная
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              Системная
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
