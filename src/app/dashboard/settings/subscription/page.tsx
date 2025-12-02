'use client';

import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { CreditCard, Calendar, Clock, CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/i18n';
import type { Subscription } from '@/types';

type SubscriptionStatus = 'active' | 'expired' | 'deactivated';

function getSubscriptionStatus(subscription: Subscription): SubscriptionStatus {
  if (!subscription.isActive) return 'deactivated';
  if (subscription.daysLeft <= 0) return 'expired';
  return 'active';
}

function SubscriptionWarningBanner({
  subscription,
  t
}: {
  subscription: Subscription;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const status = getSubscriptionStatus(subscription);
  const daysLeft = subscription.daysLeft;

  // Deactivated subscription
  if (status === 'deactivated') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>{t.settingsSection.subscriptionDeactivated}</AlertTitle>
        <AlertDescription>
          {t.settingsSection.contactSupportForPlan}
        </AlertDescription>
      </Alert>
    );
  }

  // Expired subscription (isActive true but daysLeft = 0)
  if (status === 'expired') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>{t.settingsSection.subscriptionExpired}</AlertTitle>
        <AlertDescription>
          {t.settingsSection.contactSupportForPlan}
        </AlertDescription>
      </Alert>
    );
  }

  // Critical warning: 7 days or less
  if (daysLeft <= 7 && daysLeft > 1) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {t.settingsSection.subscriptionExpiresSoon.replace('{days}', String(daysLeft))}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t.settingsSection.contactSupportForPlan}</span>
          <Button variant="outline" size="sm" className="ml-4">
            {t.settingsSection.extendNow}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Tomorrow
  if (daysLeft === 1) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t.settingsSection.subscriptionExpiresTomorrow}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t.settingsSection.contactSupportForPlan}</span>
          <Button variant="outline" size="sm" className="ml-4">
            {t.settingsSection.extendNow}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Warning: 14 days or less (but more than 7)
  if (daysLeft <= 14) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 [&>svg]:text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t.settingsSection.subscriptionExpiresWarning}</AlertTitle>
        <AlertDescription>
          {t.settingsSection.subscriptionExpiresSoon.replace('{days}', String(daysLeft))}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

function SubscriptionStatusBadge({
  subscription,
  t
}: {
  subscription: Subscription;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const status = getSubscriptionStatus(subscription);

  if (status === 'active') {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        {t.settingsSection.active}
      </Badge>
    );
  }

  if (status === 'expired') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        {t.settingsSection.expired}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      {t.settingsSection.inactive}
    </Badge>
  );
}

export default function SubscriptionPage() {
  const { organization } = useAuthStore();
  const { t, language } = useTranslation();

  const dateLocale = language === 'ru' ? ruLocale : enUS;

  // Fetch active subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', organization?.id],
    queryFn: async () => {
      if (!organization) return null;
      const response = await subscriptionApi.getActive(organization.id);
      return response.data;
    },
    enabled: !!organization,
  });

  // Fetch subscription history
  const { data: subscriptionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['subscription-history', organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const response = await subscriptionApi.getByOrganization(organization.id);
      return response.data;
    },
    enabled: !!organization,
  });

  const daysRemaining = subscription?.daysLeft ?? 0;
  const totalDays = subscription?.startDate && subscription?.endDate
    ? differenceInDays(new Date(subscription.endDate), new Date(subscription.startDate))
    : 365;
  const progress = Math.max(0, Math.min(100, ((totalDays - Math.max(0, daysRemaining)) / totalDays) * 100));

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

        <div className="max-w-4xl space-y-6">
          {/* Warning Banner */}
          {subscription && <SubscriptionWarningBanner subscription={subscription} t={t} />}

          {/* Current Subscription Card */}
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
                ) : subscription ? (
                  <SubscriptionStatusBadge subscription={subscription} t={t} />
                ) : null}
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

          {/* Manage Subscription Card */}
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

          {/* Subscription History Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>{t.settingsSection.subscriptionHistory}</CardTitle>
                  <CardDescription>
                    {t.settingsSection.subscriptionHistoryDesc}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : subscriptionHistory && subscriptionHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.settingsSection.period}</TableHead>
                        <TableHead>{t.settingsSection.startDate}</TableHead>
                        <TableHead>{t.settingsSection.endDate}</TableHead>
                        <TableHead>{t.settingsSection.status}</TableHead>
                        <TableHead>{t.settingsSection.createdAt}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionHistory
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              {sub.period} {t.settingsSection.months}
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.startDate), language === 'ru' ? 'dd.MM.yyyy' : 'MMM dd, yyyy', { locale: dateLocale })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.endDate), language === 'ru' ? 'dd.MM.yyyy' : 'MMM dd, yyyy', { locale: dateLocale })}
                            </TableCell>
                            <TableCell>
                              <SubscriptionStatusBadge subscription={sub} t={t} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(sub.createdAt), language === 'ru' ? 'dd.MM.yyyy' : 'MMM dd, yyyy', { locale: dateLocale })}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t.settingsSection.noSubscriptionHistory}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
