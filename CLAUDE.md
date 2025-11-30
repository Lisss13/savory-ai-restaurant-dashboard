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
- **Sorting feature spec**: `docs/new_task.md` - drag-and-drop sorting for questions and menu categories

**Important**: When implementing new functionality, always refer to these files to ensure compliance with the spec and correct API usage.

## Environment

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend API endpoint (default: `http://localhost:4000`).

## Architecture

This is a **Savory AI Restaurant Dashboard** - a Next.js 16 admin panel for restaurant management with Russian localization.

### Tech Stack
- **Next.js 16** with App Router and React 19
- **shadcn/ui** components (Radix primitives + Tailwind)
- **Zustand** for client state (auth, restaurant selection)
- **TanStack Query** for server state and caching
- **Zod** + **react-hook-form** for form validation
- **Axios** for API requests with JWT interceptors
- **@dnd-kit** for drag-and-drop sorting functionality

### Key Directories

- `src/app/(auth)/` - Public auth pages (login, register, password reset)
- `src/app/dashboard/` - Protected dashboard routes (requires authentication)
- `src/lib/api.ts` - Centralized API client with all endpoint functions
- `src/store/` - Zustand stores (`auth.ts` for auth state, `restaurant.ts` for selected restaurant)
- `src/types/index.ts` - All TypeScript interfaces matching the backend API
- `src/components/ui/` - shadcn/ui components
- `src/components/layout/` - App sidebar and header (with restaurant selector)

### Authentication Flow

JWT tokens stored in localStorage. The `useAuthStore` handles login/logout and persists to `auth-storage`. The API client's interceptor auto-attaches tokens and redirects to `/login` on 401. Logout redirects user to `/login`.

### Route Structure

- `/` redirects to `/login`
- `/dashboard` - Main dashboard with stats
- `/dashboard/restaurants` - Restaurant CRUD
- `/dashboard/menu/categories` - Menu categories with drag-and-drop sorting
- `/dashboard/menu/dishes` - Dishes management
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

### API Pattern

All API calls go through functions in `src/lib/api.ts`. Example:
```typescript
const { data } = await restaurantApi.getAll();
const { data } = await dishApi.create({ menuCategoryId, name, price, ... });
const { data } = await supportApi.create({ title, description, email });
const { data } = await questionApi.reorder({ questionIds: [1, 2, 3] });
const { data } = await categoryApi.updateSortOrder({ categories: [{ id: 1, sort_order: 0 }] });
```

### Form Pattern

Forms use react-hook-form with zod schemas. Boolean fields in zod schemas must be `z.boolean()` (not `.default()`) to work with the resolver.

### Drag-and-Drop Sorting

Uses `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop functionality:
- **Questions page**: Reorder via `PUT /questions/reorder` with `{ questionIds: number[] }`
- **Categories page**: Reorder via `PUT /categories/sort-order` with `{ categories: [{ id, sort_order }] }`

Both implement optimistic updates for smooth UX.

### Restaurant Selection

When user has multiple restaurants, a dropdown appears in the header to switch between them. The selected restaurant is persisted in `restaurant-storage` via Zustand. Restaurants are loaded in the dashboard layout to ensure availability across all pages.

## Deployment (Railway)

### Production URLs
- **Frontend**: https://frontend-production.up.railway.app (после `railway domain`)
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
