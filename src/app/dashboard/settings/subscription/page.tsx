'use client';

import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { CreditCard, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/i18n';

export default function SubscriptionPage() {
  const { organization } = useAuthStore();
  const { t, language } = useTranslation();

  const dateLocale = language === 'ru' ? ruLocale : enUS;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', organization?.id],
    queryFn: async () => {
      if (!organization) return null;
      const response = await subscriptionApi.getActive(organization.id);
      return response.data;
    },
    enabled: !!organization,
  });

  const daysRemaining = subscription?.endDate
    ? differenceInDays(new Date(subscription.endDate), new Date())
    : 0;
  const totalDays = subscription?.startDate && subscription?.endDate
    ? differenceInDays(new Date(subscription.endDate), new Date(subscription.startDate))
    : 365;
  const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

  return (
    <>
      <Header
        breadcrumbs={[
          { title: t.nav.dashboard, href: '/dashboard' },
          { title: t.nav.settings },
          { title: t.nav.subscription },
        ]}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.settingsSection.subscription}</h1>
          <p className="text-muted-foreground">
            {t.settingsSection.subscriptionSubtitle}
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.settingsSection.currentPlan}</CardTitle>
                  <CardDescription>
                    {t.settingsSection.subscriptionInfo}
                  </CardDescription>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : subscription?.isActive ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t.settingsSection.active}
                  </Badge>
                ) : (
                  <Badge variant="destructive">{t.settingsSection.inactive}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : subscription ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.settingsSection.plan}</p>
                        <p className="font-medium">
                          {subscription.period === 12 ? t.settingsSection.yearly : `${subscription.period} ${t.settingsSection.monthly}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.settingsSection.startDate}</p>
                        <p className="font-medium">
                          {format(new Date(subscription.startDate), 'd MMMM yyyy', { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.settingsSection.endDate}</p>
                        <p className="font-medium">
                          {format(new Date(subscription.endDate), 'd MMMM yyyy', { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.settingsSection.daysRemaining}</p>
                        <p className="font-medium">{daysRemaining > 0 ? daysRemaining : 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.settingsSection.subscriptionProgress}</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t.settingsSection.noActiveSubscription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settingsSection.manageSubscription}</CardTitle>
              <CardDescription>
                {t.settingsSection.manageSubscriptionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" size="lg">
                {t.settingsSection.extendSubscription}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t.settingsSection.contactSupportForPlan}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
