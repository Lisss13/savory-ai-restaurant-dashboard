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

### Key Directories

- `src/app/(auth)/` - Public auth pages (login, register, password reset)
- `src/app/dashboard/` - Protected dashboard routes (requires authentication)
- `src/lib/api.ts` - Centralized API client with all endpoint functions
- `src/store/` - Zustand stores (`auth.ts` for auth state, `restaurant.ts` for selected restaurant)
- `src/types/index.ts` - All TypeScript interfaces matching the backend API
- `src/components/ui/` - shadcn/ui components
- `src/components/layout/` - App sidebar and header

### Authentication Flow

JWT tokens stored in localStorage. The `useAuthStore` handles login/logout and persists to `auth-storage`. The API client's interceptor auto-attaches tokens and redirects to `/login` on 401.

### Route Structure

- `/` redirects to `/login`
- `/dashboard` - Main dashboard with stats
- `/dashboard/restaurants` - Restaurant CRUD
- `/dashboard/menu/categories`, `/dashboard/menu/dishes` - Menu management
- `/dashboard/tables` - Table management
- `/dashboard/reservations/list` - Reservations
- `/dashboard/chats/active` - Customer chat interface
- `/dashboard/qr-codes` - QR code generation
- `/dashboard/team` - Team/staff management
- `/dashboard/settings/profile` - User profile
- `/dashboard/admin` - Admin-only statistics (role-gated)

### API Pattern

All API calls go through functions in `src/lib/api.ts`. Example:
```typescript
const { data } = await restaurantApi.getAll();
const { data } = await dishApi.create({ menuCategoryId, name, price, ... });
```

### Form Pattern

Forms use react-hook-form with zod schemas. Boolean fields in zod schemas must be `z.boolean()` (not `.default()`) to work with the resolver.
