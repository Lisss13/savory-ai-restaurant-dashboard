'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Armchair,
  CalendarDays,
  MessageSquare,
  HelpCircle,
  QrCode,
  BarChart3,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  LifeBuoy,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { useRestaurantStore } from '@/store/restaurant';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTranslation } from '@/i18n';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuthStore();
  const { selectedRestaurant } = useRestaurantStore();
  const { t } = useTranslation();

  const mainNavItems = [
    {
      title: t.nav.dashboard,
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t.nav.restaurants,
      url: '/dashboard/restaurants',
      icon: Store,
    },
  ];

  const restaurantNavItems = [
    {
      title: t.nav.menu,
      icon: UtensilsCrossed,
      items: [
        { title: t.nav.categories, url: '/dashboard/menu/categories' },
        { title: t.nav.dishes, url: '/dashboard/menu/dishes' },
      ],
    },
    {
      title: t.nav.tables,
      url: '/dashboard/tables',
      icon: Armchair,
    },
    {
      title: t.nav.reservations,
      icon: CalendarDays,
      items: [
        { title: t.nav.calendar, url: '/dashboard/reservations/calendar' },
        { title: t.nav.list, url: '/dashboard/reservations/list' },
      ],
    },
    {
      title: t.nav.chats,
      icon: MessageSquare,
      items: [
        { title: t.nav.active, url: '/dashboard/chats/active' },
        { title: t.nav.history, url: '/dashboard/chats/history' },
      ],
    },
    {
      title: t.nav.questions,
      url: '/dashboard/questions',
      icon: HelpCircle,
    },
    {
      title: t.nav.qrCodes,
      url: '/dashboard/qr-codes',
      icon: QrCode,
    },
    {
      title: t.nav.analytics,
      icon: BarChart3,
      items: [
        { title: t.nav.overview, url: '/dashboard/analytics/overview' },
        { title: t.nav.reservations, url: '/dashboard/analytics/reservations' },
        { title: t.nav.chats, url: '/dashboard/analytics/chats' },
      ],
    },
  ];

  const settingsNavItems = [
    {
      title: t.nav.team,
      url: '/dashboard/team',
      icon: Users,
    },
    {
      title: t.nav.settings,
      icon: Settings,
      items: [
        { title: t.nav.profile, url: '/dashboard/settings/profile' },
        { title: t.nav.organization, url: '/dashboard/settings/organization' },
        { title: t.nav.languages, url: '/dashboard/settings/languages' },
        { title: t.nav.subscription, url: '/dashboard/settings/subscription' },
      ],
    },
    {
      title: t.nav.support,
      url: '/dashboard/settings/support',
      icon: LifeBuoy,
    },
  ];

  const adminNavItems = [
    {
      title: t.nav.adminPanel,
      icon: Shield,
      items: [
        { title: t.nav.statistics, url: '/dashboard/admin' },
        { title: t.nav.users, url: '/dashboard/admin/users' },
        { title: t.nav.organizations, url: '/dashboard/admin/organizations' },
        { title: t.nav.moderation, url: '/dashboard/admin/moderation' },
        { title: t.nav.logs, url: '/dashboard/admin/logs' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <span className="font-semibold">Savory AI</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.main}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {selectedRestaurant && (
          <SidebarGroup>
            <SidebarGroupLabel>{selectedRestaurant.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {restaurantNavItems.map((item) =>
                  item.items ? (
                    <Collapsible key={item.title} defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>{subItem.title}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.management}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) =>
                item.items ? (
                  <Collapsible key={item.title} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t.nav.administration}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <Collapsible key={item.title} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile">
                <Settings className="mr-2 h-4 w-4" />
                {t.nav.settings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t.auth.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
