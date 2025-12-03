'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreditCard, Calendar, Clock, CheckCircle, AlertTriangle, XCircle, History,
  Plus, Send, Mail, Phone, User, MessageSquare, FileText, Eye
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { subscriptionApi, extensionRequestApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';
import type { Subscription, ExtensionRequest, ExtensionRequestStatus } from '@/types';

type SubscriptionStatus = 'active' | 'expired' | 'deactivated';

function getSubscriptionStatus(subscription: Subscription): SubscriptionStatus {
  if (!subscription.isActive) return 'deactivated';
  if (subscription.daysLeft <= 0) return 'expired';
  return 'active';
}

function SubscriptionWarningBanner({
  subscription,
  t,
  onExtendClick
}: {
  subscription: Subscription;
  t: ReturnType<typeof useTranslation>['t'];
  onExtendClick: () => void;
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
          <Button variant="outline" size="sm" className="ml-4" onClick={onExtendClick}>
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
          <Button variant="outline" size="sm" className="ml-4" onClick={onExtendClick}>
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

function ExtensionRequestStatusBadge({
  status,
  t
}: {
  status: ExtensionRequestStatus;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          {t.settingsSection.statusPending}
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.settingsSection.statusApproved}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {t.settingsSection.statusRejected}
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.settingsSection.statusCompleted}
        </Badge>
      );
    default:
      return null;
  }
}

// Form schema for extension request
const extensionRequestSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().min(5, 'Введите телефон'),
  email: z.string().email('Введите корректный email'),
  period: z.string().optional(),
  comment: z.string().optional(),
});

type ExtensionRequestFormData = z.infer<typeof extensionRequestSchema>;

export default function SubscriptionPage() {
  const { organization, user } = useAuthStore();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);

  const dateLocale = language === 'ru' ? ruLocale : enUS;

  // Form setup
  const form = useForm<ExtensionRequestFormData>({
    resolver: zodResolver(extensionRequestSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      period: '',
      comment: '',
    },
  });

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

  // Fetch extension requests
  const { data: extensionRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['extension-requests'],
    queryFn: async () => {
      const response = await extensionRequestApi.getMy();
      return response.data.requests;
    },
  });

  // Create extension request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: ExtensionRequestFormData) => {
      const response = await extensionRequestApi.create({
        name: data.name,
        phone: data.phone,
        email: data.email,
        period: data.period ? parseInt(data.period) : undefined,
        comment: data.comment || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-requests'] });
      toast.success(t.settingsSection.requestSent, {
        description: t.settingsSection.requestSentDesc,
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error(t.settingsSection.requestError);
    },
  });

  const onSubmit = (data: ExtensionRequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const handleOpenCreateDialog = () => {
    form.reset({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      period: '',
      comment: '',
    });
    setIsCreateDialogOpen(true);
  };

  const daysRemaining = subscription?.daysLeft ?? 0;
  const totalDays = subscription?.startDate && subscription?.endDate
    ? differenceInDays(new Date(subscription.endDate), new Date(subscription.startDate))
    : 365;
  const progress = Math.max(0, Math.min(100, ((totalDays - Math.max(0, daysRemaining)) / totalDays) * 100));

  const getPeriodLabel = (period: number | undefined) => {
    if (!period) return '-';
    switch (period) {
      case 1: return t.settingsSection.month1;
      case 3: return t.settingsSection.months3;
      case 6: return t.settingsSection.months6;
      case 12: return t.settingsSection.months12;
      default: return `${period} ${t.settingsSection.months}`;
    }
  };

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
          {subscription && <SubscriptionWarningBanner subscription={subscription} t={t} onExtendClick={handleOpenCreateDialog} />}

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
              <Button className="w-full" size="lg" onClick={handleOpenCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t.settingsSection.requestExtension}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t.settingsSection.contactSupportForPlan}
              </p>
            </CardContent>
          </Card>

          {/* Extension Requests Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>{t.settingsSection.extensionRequests}</CardTitle>
                  <CardDescription>
                    {t.settingsSection.extensionRequestsDesc}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : extensionRequests && extensionRequests.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.settingsSection.requestDate}</TableHead>
                        <TableHead>{t.settingsSection.requestPeriod}</TableHead>
                        <TableHead>{t.settingsSection.requestStatus}</TableHead>
                        <TableHead>{t.settingsSection.requestComment2}</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extensionRequests
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {format(new Date(request.createdAt), language === 'ru' ? 'dd.MM.yyyy HH:mm' : 'MMM dd, yyyy HH:mm', { locale: dateLocale })}
                            </TableCell>
                            <TableCell>
                              {getPeriodLabel(request.period)}
                            </TableCell>
                            <TableCell>
                              <ExtensionRequestStatusBadge status={request.status} t={t} />
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {request.comment || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t.settingsSection.noExtensionRequests}</p>
                  <p className="text-sm">{t.settingsSection.noExtensionRequestsDesc}</p>
                </div>
              )}
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

      {/* Create Extension Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.settingsSection.newExtensionRequest}</DialogTitle>
            <DialogDescription>
              {t.settingsSection.newExtensionRequestDesc}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settingsSection.contactName}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t.settingsSection.contactNamePlaceholder}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settingsSection.contactPhone}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t.settingsSection.contactPhonePlaceholder}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settingsSection.contactEmail}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder={t.settingsSection.contactEmailPlaceholder}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settingsSection.desiredPeriod}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.settingsSection.selectPeriod} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{t.settingsSection.month1}</SelectItem>
                        <SelectItem value="3">{t.settingsSection.months3}</SelectItem>
                        <SelectItem value="6">{t.settingsSection.months6}</SelectItem>
                        <SelectItem value="12">{t.settingsSection.months12}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settingsSection.requestComment}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.settingsSection.requestCommentPlaceholder}
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={createRequestMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {t.settingsSection.sendRequest}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.settingsSection.requestDetails}
            </DialogTitle>
            <DialogDescription>
              {t.settingsSection.requestDetailsDesc}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settingsSection.requestDate}</span>
                <span className="font-medium">
                  {format(new Date(selectedRequest.createdAt), language === 'ru' ? 'dd.MM.yyyy HH:mm' : 'MMM dd, yyyy HH:mm', { locale: dateLocale })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settingsSection.requestStatus}</span>
                <ExtensionRequestStatusBadge status={selectedRequest.status} t={t} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settingsSection.requestPeriod}</span>
                <span className="font-medium">{getPeriodLabel(selectedRequest.period)}</span>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">{t.settingsSection.contactInfo}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.email}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.comment && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">{t.settingsSection.requestComment}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.comment}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t.settingsSection.adminResponse}</h4>
                {selectedRequest.adminComment ? (
                  <p className="text-sm">{selectedRequest.adminComment}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t.settingsSection.noAdminResponse}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
