# Savory AI Restaurant Dashboard

Административная панель для управления ресторанами на базе Next.js 16. Интерфейс на русском языке.

## Стек технологий

- **Next.js 16** с App Router и React 19
- **shadcn/ui** — компоненты на базе Radix UI + Tailwind CSS
- **Zustand** — управление состоянием (авторизация, выбор ресторана)
- **TanStack Query** — серверное состояние и кеширование
- **Zod** + **react-hook-form** — валидация форм
- **Axios** — HTTP-клиент с JWT-интерцепторами
- **@dnd-kit** — drag-and-drop сортировка

## Требования

- Node.js 20+
- npm 10+
- Docker (опционально)

## Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd restaurant-dashboard

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
```

Отредактируйте `.env.local` и укажите URL бэкенда:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Запуск

### Локальная разработка

```bash
npm run dev
```

Приложение будет доступно на http://localhost:3000

### Production сборка

```bash
npm run build
npm run start
```

### Docker (рекомендуется для production)

Запуск одной командой:

```bash
docker compose up --build
```

С указанием URL API:

```bash
NEXT_PUBLIC_API_URL=http://api.example.com docker compose up --build
```

Приложение будет доступно на http://localhost:3000

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Production сборка |
| `npm run start` | Запуск production сервера |
| `npm run lint` | Проверка ESLint |
| `docker compose up --build` | Запуск в Docker |

## Структура проекта

```
src/
├── app/
│   ├── (auth)/              # Публичные страницы (вход, регистрация)
│   └── dashboard/           # Защищённые маршруты
├── components/
│   ├── ui/                  # shadcn/ui компоненты
│   └── layout/              # Sidebar, Header
├── lib/
│   └── api.ts               # API-клиент
├── store/                   # Zustand stores
└── types/                   # TypeScript типы
```

## Основные разделы

- `/dashboard` — Главная с статистикой
- `/dashboard/restaurants` — Управление ресторанами
- `/dashboard/menu/categories` — Категории меню (с drag-and-drop)
- `/dashboard/menu/dishes` — Блюда
- `/dashboard/tables` — Столики
- `/dashboard/reservations/list` — Бронирования (список)
- `/dashboard/reservations/calendar` — Бронирования (календарь)
- `/dashboard/chats/active` — Активные чаты
- `/dashboard/questions` — Быстрые вопросы для чат-бота
- `/dashboard/qr-codes` — Генерация QR-кодов
- `/dashboard/analytics/*` — Аналитика
- `/dashboard/team` — Команда
- `/dashboard/settings/*` — Настройки
- `/dashboard/admin/*` — Админ-панель

## Документация

- `docs/restaurant_dashboard_spec.md` — техническая спецификация
- `docs/swagger.yaml` — OpenAPI спецификация API
- `docs/new_task.md` — спецификация drag-and-drop сортировки

## Лицензия

Proprietary
