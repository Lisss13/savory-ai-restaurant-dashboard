'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Store, Armchair, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { qrCodeApi, tableApi } from '@/lib/api';
import { useRestaurantStore } from '@/store/restaurant';
import type { Table } from '@/types';

export default function QRCodesPage() {
  const { selectedRestaurant } = useRestaurantStore();
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [tableQrPreview, setTableQrPreview] = useState<string | null>(null);

  const { data: tables } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      const response = await tableApi.getByRestaurant(selectedRestaurant.id);
      return response.data.tables;
    },
    enabled: !!selectedRestaurant,
  });

  // Auto-load restaurant QR code
  const { data: restaurantQrUrl, isLoading: isLoadingRestaurantQr } = useQuery({
    queryKey: ['restaurantQR', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return null;
      const blob = await qrCodeApi.getRestaurantQR(selectedRestaurant.id);
      return URL.createObjectURL(blob);
    },
    enabled: !!selectedRestaurant,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const loadTableQR = async (tableId: number) => {
    if (!selectedRestaurant) return;
    try {
      const blob = await qrCodeApi.getTableQR(selectedRestaurant.id, tableId);
      const url = URL.createObjectURL(blob);
      setTableQrPreview(url);
    } catch {
      toast.error('Ошибка загрузки QR-кода');
    }
  };

  const downloadRestaurantQR = async () => {
    if (!selectedRestaurant) return;
    setIsDownloading(true);
    try {
      const blob = await qrCodeApi.downloadRestaurantQR(selectedRestaurant.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${selectedRestaurant.name}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('QR-код скачан');
    } catch {
      toast.error('Ошибка скачивания QR-кода');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadTableQR = async (tableId: number, tableName: string) => {
    if (!selectedRestaurant) return;
    setIsDownloading(true);
    try {
      const blob = await qrCodeApi.downloadTableQR(selectedRestaurant.id, tableId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${tableName}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('QR-код скачан');
    } catch {
      toast.error('Ошибка скачивания QR-кода');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTableSelect = (value: string) => {
    setSelectedTableId(value);
    if (value) {
      loadTableQR(parseInt(value));
    }
  };

  if (!selectedRestaurant) {
    return (
      <>
        <Header breadcrumbs={[{ title: 'Дашборд', href: '/dashboard' }, { title: 'QR-коды' }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">Выберите ресторан</h3>
              <p className="text-muted-foreground text-center">
                Для генерации QR-кодов необходимо выбрать ресторан
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: 'Дашборд', href: '/dashboard' },
          { title: 'QR-коды' },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR-коды</h1>
          <p className="text-muted-foreground">
            Генерируйте QR-коды для ресторана и столов
          </p>
        </div>

        <Tabs defaultValue="restaurant" className="space-y-6">
          <TabsList>
            <TabsTrigger value="restaurant" className="gap-2">
              <Store className="h-4 w-4" />
              QR-код ресторана
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Armchair className="h-4 w-4" />
              QR-коды столов
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>QR-код ресторана</CardTitle>
                  <CardDescription>
                    Общий QR-код для входа в чат с рестораном
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square max-w-xs mx-auto bg-white rounded-lg p-4 flex items-center justify-center">
                    {isLoadingRestaurantQr ? (
                      <Skeleton className="w-full h-full" />
                    ) : restaurantQrUrl ? (
                      <img
                        src={restaurantQrUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">Ошибка загрузки QR-кода</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={downloadRestaurantQR}
                    disabled={isDownloading || !restaurantQrUrl}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Скачать
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Как использовать</CardTitle>
                  <CardDescription>
                    Инструкция по размещению QR-кода
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">1. Скачайте QR-код</h4>
                    <p className="text-sm text-muted-foreground">
                      Нажмите кнопку "Скачать" для загрузки PNG файла
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">2. Распечатайте</h4>
                    <p className="text-sm text-muted-foreground">
                      Распечатайте QR-код на плотной бумаге или заламинируйте
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">3. Разместите в зале</h4>
                    <p className="text-sm text-muted-foreground">
                      Разместите QR-код на видном месте: у входа, на стойке или барной стойке
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">4. Гости сканируют</h4>
                    <p className="text-sm text-muted-foreground">
                      Гости сканируют код камерой телефона и попадают в чат с AI-ассистентом
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>QR-код для стола</CardTitle>
                  <CardDescription>
                    Выберите стол для генерации QR-кода
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Выберите стол</Label>
                    <Select
                      value={selectedTableId}
                      onValueChange={handleTableSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите стол" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables?.map((table: Table) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            {table.name} ({table.guestCount} мест)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="aspect-square max-w-xs mx-auto bg-white rounded-lg p-4 flex items-center justify-center">
                    {tableQrPreview && selectedTableId ? (
                      <img
                        src={tableQrPreview}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">Выберите стол для предпросмотра</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      const table = tables?.find(
                        (t: Table) => t.id.toString() === selectedTableId
                      );
                      if (table) {
                        downloadTableQR(table.id, table.name);
                      }
                    }}
                    disabled={!selectedTableId || isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Скачать QR-код
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Массовая генерация</CardTitle>
                  <CardDescription>
                    Скачайте QR-коды для всех столов
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Всего столов: {tables?.length || 0}
                  </p>

                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {tables?.map((table: Table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Armchair className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{table.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({table.guestCount} мест)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadTableQR(table.id, table.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {(!tables || tables.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">
                      Нет столов для генерации QR-кодов
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
