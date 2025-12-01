'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Store, Armchair, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
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
  const { t } = useTranslation();
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
      toast.error(t.qrSection.qrLoadError);
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
      toast.success(t.qrSection.qrDownloaded);
    } catch {
      toast.error(t.qrSection.qrDownloadError);
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
      toast.success(t.qrSection.qrDownloaded);
    } catch {
      toast.error(t.qrSection.qrDownloadError);
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
        <Header breadcrumbs={[{ title: t.nav.dashboard, href: '/dashboard' }, { title: t.nav.qrCodes }]} />
        <main className="flex-1 p-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h3 className="text-lg font-semibold mb-2">{t.qrSection.selectRestaurant}</h3>
              <p className="text-muted-foreground text-center">
                {t.qrSection.selectRestaurantRequired}
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
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.qrCodes },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.qrSection.title}</h1>
          <p className="text-muted-foreground">
            {t.qrSection.subtitle}
          </p>
        </div>

        <Tabs defaultValue="restaurant" className="space-y-6">
          <TabsList>
            <TabsTrigger value="restaurant" className="gap-2">
              <Store className="h-4 w-4" />
              {t.qrSection.restaurantQRCode}
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Armchair className="h-4 w-4" />
              {t.qrSection.tableQRCodes}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t.qrSection.restaurantQRCode}</CardTitle>
                  <CardDescription>
                    {t.qrSection.restaurantQRDesc}
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
                        <p className="text-sm">{t.qrSection.errorLoadingQR}</p>
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
                    {t.qrSection.download}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.qrSection.howToUse}</CardTitle>
                  <CardDescription>
                    {t.qrSection.howToUseDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{t.qrSection.step1Title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.qrSection.step1Desc}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">{t.qrSection.step2Title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.qrSection.step2Desc}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">{t.qrSection.step3Title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.qrSection.step3Desc}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">{t.qrSection.step4Title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.qrSection.step4Desc}
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
                  <CardTitle>{t.qrSection.tableQRCode}</CardTitle>
                  <CardDescription>
                    {t.qrSection.selectTableForQR}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.qrSection.selectTable}</Label>
                    <Select
                      value={selectedTableId}
                      onValueChange={handleTableSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.qrSection.selectTable} />
                      </SelectTrigger>
                      <SelectContent>
                        {tables?.map((table: Table) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            {table.name} ({table.guestCount} {t.qrSection.seats})
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
                        <p className="text-sm">{t.qrSection.selectTablePreview}</p>
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
                    {t.qrSection.downloadTableQR}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.qrSection.bulkGeneration}</CardTitle>
                  <CardDescription>
                    {t.qrSection.bulkGenerationDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t.qrSection.totalTables}: {tables?.length || 0}
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
                            ({table.guestCount} {t.qrSection.seats})
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
                      {t.qrSection.noTablesForQR}
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
