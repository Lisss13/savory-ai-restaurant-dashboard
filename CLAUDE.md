# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build with TypeScript checking
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Specification & API Documentation

- **Technical specification**: `docs/restaurant_dashboard_spec.md` - full project requirements, UI/UX specs, page descriptions, and feature details
- **Server API**: `docs/swagger.yaml` - OpenAPI 3.0 specification for all backend endpoints
- **Current tasks**: `docs/new_task.md` - current task or feature being implemented

**Important**: When implementing new functionality, always refer to these files to ensure compliance with the spec and correct API usage.

## Environment

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend API endpoint (default: `http://localhost:4000`).

## Architecture

This is a **Savory AI Restaurant Dashboard** - a Next.js 16 admin panel for restaurant management with multilingual support (Russian/English).

### Tech Stack
- **Next.js 16** with App Router and React 19
- **shadcn/ui** components (Radix primitives + Tailwind)
- **Zustand** for client state (auth, restaurant selection, language)
- **TanStack Query** for server state and caching
- **Zod** + **react-hook-form** for form validation
- **Axios** for API requests with JWT interceptors
- **@dnd-kit** for drag-and-drop sorting functionality

### Key Directories

```
src/
├── app/
│   ├── (auth)/          # Public auth pages (login, register, password reset)
│   └── dashboard/       # Protected dashboard routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # App sidebar, header (with restaurant selector)
│   └── nutrition.tsx    # Nutrition input component (КБЖУ)
├── hooks/
│   ├── use-image-upload.ts  # Reusable image upload hook
│   └── use-mobile.ts        # Mobile detection hook
├── i18n/
│   ├── index.ts         # useTranslation hook
│   ├── ru.ts            # Russian translations
│   └── en.ts            # English translations
├── lib/
│   └── api.ts           # Centralized API client with all endpoints
├── store/
│   ├── auth.ts          # Auth state (JWT, user)
│   ├── restaurant.ts    # Selected restaurant
│   └── language.ts      # Language preference (ru/en)
└── types/
    └── index.ts         # All TypeScript interfaces
```

## Internationalization (i18n)

### IMPORTANT: Translation Pattern

The `t` from `useTranslation()` is an **OBJECT**, not a function!

```typescript
// ✅ CORRECT - t is an object with nested properties
const { t } = useTranslation();
<h1>{t.menuSection.title}</h1>
<Button>{t.common.save}</Button>
toast.success(t.tablesSection.tableCreated);

// ❌ WRONG - t is NOT a function
t('menuSection.title')  // This will NOT work!
```

### Translation Structure

Translations are organized by sections in `src/i18n/ru.ts` and `src/i18n/en.ts`:

```typescript
{
  common: { save, cancel, delete, ... },
  auth: { login, logout, ... },
  nav: { dashboard, menu, tables, ... },
  menuSection: { title, addDish, ... },
  tablesSection: { title, addTable, ... },
  // ... other sections
}
```

### Adding New Translations

1. Add keys to both `ru.ts` and `en.ts` in the same section
2. Use descriptive key names: `dishCreated`, `dishCreateError`
3. Group related translations together

## Common Patterns

### Image Upload

Use the reusable `useImageUpload` hook:

```typescript
import { useImageUpload } from '@/hooks/use-image-upload';

const { isUploading, handleImageUpload } = useImageUpload({
  onSuccess: (url) => form.setValue('image', url),
});

<Input type="file" onChange={handleImageUpload} disabled={isUploading} />
```

### Card Layout with Aligned Buttons

For cards in a grid where buttons should align at the bottom:

```tsx
<Card className="flex flex-col">
  <CardHeader>...</CardHeader>
  <CardContent className="mt-auto">
    <Button>...</Button>
  </CardContent>
</Card>
```

### Form Pattern

Forms use react-hook-form with zod schemas:

```typescript
const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  isDishOfDay: z.boolean(),  // NOT .default() for checkboxes
});

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', price: 0, isDishOfDay: false },
});
```

### API Pattern

All API calls go through functions in `src/lib/api.ts`:

```typescript
const { data } = await restaurantApi.getAll();
const { data } = await dishApi.create({ menuCategoryId, name, price, ... });
const { data } = await questionApi.reorder({ questionIds: [1, 2, 3] });
```

### Mutations with Toast Notifications

```typescript
const createMutation = useMutation({
  mutationFn: (data) => dishApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    toast.success(t.menuSection.dishCreated);
    router.push('/dashboard/menu/dishes');
  },
  onError: () => {
    toast.error(t.menuSection.dishCreateError);
  },
});
```

## Authentication Flow

JWT tokens stored in localStorage. The `useAuthStore` handles login/logout and persists to `auth-storage`. The API client's interceptor auto-attaches tokens and redirects to `/login` on 401.

## Route Structure

- `/` redirects to `/login`
- `/dashboard` - Main dashboard with stats
- `/dashboard/restaurants` - Restaurant CRUD
- `/dashboard/menu/categories` - Menu categories with drag-and-drop sorting
- `/dashboard/menu/dishes` - Dishes management (list, create, edit)
- `/dashboard/menu/dishes/new` - Create new dish
- `/dashboard/menu/dishes/[id]` - Edit dish
- `/dashboard/tables` - Table management
- `/dashboard/reservations/list`, `/dashboard/reservations/calendar` - Reservations
- `/dashboard/chats/active`, `/dashboard/chats/history` - Customer chat interface
- `/dashboard/questions` - Quick questions for chatbot with drag-and-drop sorting
- `/dashboard/qr-codes` - QR code generation
- `/dashboard/analytics/*` - Analytics pages (overview, reservations, chats)
- `/dashboard/team` - Team/staff management
- `/dashboard/settings/profile` - User profile
- `/dashboard/settings/organization` - Organization settings
- `/dashboard/settings/languages` - Language management
- `/dashboard/settings/subscription` - Subscription management
- `/dashboard/settings/support` - Support tickets (create & view)
- `/dashboard/admin/*` - Admin-only pages (stats, users, organizations, moderation, logs)

## Restaurant Selection

When user has multiple restaurants, a dropdown appears in the header to switch between them. The selected restaurant is persisted in `restaurant-storage` via Zustand. Many pages require a selected restaurant to load data.

## Drag-and-Drop Sorting

Uses `@dnd-kit/core` and `@dnd-kit/sortable`:
- **Questions page**: `PUT /questions/reorder` with `{ questionIds: number[] }`
- **Categories page**: `PUT /categories/sort-order` with `{ categories: [{ id, sort_order }] }`

Both implement optimistic updates for smooth UX.

## Deployment (Railway)

### Production URLs
- **Frontend**: https://frontend-production.up.railway.app
- **Backend**: https://lively-possibility-production.up.railway.app

### Deployment Commands

```bash
railway link              # Привязка к проекту/сервису
railway variables set NEXT_PUBLIC_API_URL=https://lively-possibility-production.up.railway.app
railway up                # Деплой
railway domain            # Получение публичного домена
```

### Configuration Files
- `railway.toml` - Railway build configuration with Dockerfile builder
- `Dockerfile` - Multi-stage build for Next.js standalone output
- `.dockerignore` - Files excluded from Docker build

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (set before build) |
| `PORT` | Auto-set by Railway |

**Important**: `NEXT_PUBLIC_API_URL` must be set before deployment because Next.js injects it at build time, not runtime.
