# План реализации Savory AI Restaurant Dashboard

## Общий прогресс

| Этап | Статус | Прогресс |
|------|--------|----------|
| Этап 1: MVP | ✅ Завершён | 100% |
| Этап 2: Бронирования | ✅ Завершён | 100% |
| Этап 3: Чаты | ✅ Завершён | 95% |
| Этап 4: Доп. функционал | ⏳ В процессе | 85% |
| Этап 5: Админ-панель | ✅ Завершён | 100% |
| Этап 6: Полировка | ❌ Не начат | 0% |

---

## Этап 1: MVP (Базовый функционал)

### 1.1 Аутентификация
| Задача | Статус | Файл |
|--------|--------|------|
| Страница входа | ✅ Готово | `src/app/(auth)/login/page.tsx` |
| Валидация формы входа | ✅ Готово | — |
| "Запомнить меня" | ✅ Готово | — |
| Редирект после входа | ✅ Готово | — |
| Страница регистрации | ✅ Готово | `src/app/(auth)/register/page.tsx` |
| Валидация регистрации | ✅ Готово | — |
| Восстановление пароля | ✅ Готово | `src/app/(auth)/forgot-password/page.tsx` |
| Сброс пароля | ✅ Готово | `src/app/(auth)/reset-password/page.tsx` |
| JWT токены | ✅ Готово | `src/lib/api.ts` |
| Interceptor авторизации | ✅ Готово | `src/lib/api.ts` |
| Auth store (Zustand) | ✅ Готово | `src/store/auth.ts` |

### 1.2 Базовый дашборд
| Задача | Статус | Файл |
|--------|--------|------|
| Главная страница | ✅ Готово | `src/app/dashboard/page.tsx` |
| Виджеты статистики | ✅ Готово | — |
| Список последних бронирований | ✅ Готово | — |
| Лента активности чатов | ✅ Готово | — |
| Выбор ресторана (глобальный) | ✅ Готово | `src/store/restaurant.ts` |

### 1.3 Управление рестораном
| Задача | Статус | Файл |
|--------|--------|------|
| Список ресторанов | ✅ Готово | `src/app/dashboard/restaurants/page.tsx` |
| Создание ресторана | ✅ Готово | `src/app/dashboard/restaurants/new/page.tsx` |
| Редактирование ресторана | ✅ Готово | `src/app/dashboard/restaurants/[id]/edit/page.tsx` |
| Удаление ресторана | ✅ Готово | — |
| Загрузка фото | ✅ Готово | `src/lib/api.ts` → `uploadApi` |
| Редактор расписания работы | ✅ Готово | — |
| Детальная страница ресторана | ✅ Готово | `src/app/dashboard/restaurants/[id]/page.tsx` |
| Настройки ресторана | ✅ Готово | `src/app/dashboard/restaurants/[id]/settings/page.tsx` |

### 1.4 Управление меню
| Задача | Статус | Файл |
|--------|--------|------|
| Категории меню | ✅ Готово | `src/app/dashboard/menu/categories/page.tsx` |
| Создание категории | ✅ Готово | модальное окно |
| Удаление категории | ✅ Готово | — |
| Drag-n-drop сортировка категорий | ❌ Отсутствует | — |
| Inline-редактирование категории | ❌ Отсутствует | — |
| Список блюд | ✅ Готово | `src/app/dashboard/menu/dishes/page.tsx` |
| Фильтрация по категории | ✅ Готово | — |
| Поиск по названию | ✅ Готово | — |
| Создание блюда | ✅ Готово | `src/app/dashboard/menu/dishes/new/page.tsx` |
| Редактирование блюда | ✅ Готово | `src/app/dashboard/menu/dishes/[id]/page.tsx` |
| Удаление блюда | ✅ Готово | — |
| "Блюдо дня" | ✅ Готово | — |
| Ингредиенты (динамический список) | ✅ Готово | — |
| Аллергены | ✅ Готово | — |
| Превью карточки блюда | ❌ Отсутствует | — |

### 1.5 Управление столами
| Задача | Статус | Файл |
|--------|--------|------|
| Список столов | ✅ Готово | `src/app/dashboard/tables/page.tsx` |
| Статус стола (свободен/занят) | ✅ Готово | — |
| Создание стола | ✅ Готово | модальное окно |
| Редактирование стола | ✅ Готово | модальное окно |
| Удаление стола | ✅ Готово | — |
| Отдельная страница создания | ❌ Отсутствует | `/dashboard/tables/new/page.tsx` |
| Отдельная страница редактирования | ❌ Отсутствует | `/dashboard/tables/[id]/page.tsx` |
| Визуальная схема зала | ❌ Отсутствует | — |
| Drag-n-drop позиционирование | ❌ Отсутствует | — |

---

## Этап 2: Бронирования

| Задача | Статус | Файл |
|--------|--------|------|
| Список бронирований | ✅ Готово | `src/app/dashboard/reservations/list/page.tsx` |
| Фильтрация по дате | ✅ Готово | — |
| Фильтрация по статусу | ✅ Готово | — |
| Поиск по имени/телефону | ✅ Готово | — |
| Календарь бронирований | ✅ Готово | `src/app/dashboard/reservations/calendar/page.tsx` |
| Таймлайн по столам | ✅ Готово | — |
| Цветовая маркировка статусов | ✅ Готово | — |
| Переключение день/неделя/месяц | ⚠️ Частично | только неделя |
| Детали бронирования | ✅ Готово | `src/app/dashboard/reservations/[id]/page.tsx` |
| Изменение статуса | ✅ Готово | — |
| Отмена бронирования | ✅ Готово | — |
| Создание бронирования (модал) | ✅ Готово | — |
| Получение доступных слотов | ✅ Готово | `reservationApi.getAvailableSlots` |
| Перетаскивание брони на другое время | ❌ Отсутствует | — |
| История изменений брони | ❌ Отсутствует | — |

---

## Этап 3: Чаты

| Задача | Статус | Файл |
|--------|--------|------|
| Интерфейс активных чатов | ✅ Готово | `src/app/dashboard/chats/active/page.tsx` |
| Трёхколоночный layout | ✅ Готово | — |
| Список сессий | ✅ Готово | — |
| Окно чата | ✅ Готово | — |
| Отправка сообщений от персонала | ✅ Готово | — |
| Закрытие чата | ✅ Готово | — |
| История чатов (архив) | ✅ Готово | `src/app/dashboard/chats/history/page.tsx` |
| Страница конкретного чата | ✅ Готово | `src/app/dashboard/chats/[sessionId]/page.tsx` |
| WebSocket real-time | ❌ Отсутствует | — |
| Индикатор непрочитанных | ✅ Готово | — |
| Шаблоны быстрых ответов | ✅ Готово | — |
| Кнопка "Вернуть AI" | ✅ Готово | — |

---

## Этап 4: Дополнительный функционал

### 4.1 QR-коды
| Задача | Статус | Файл |
|--------|--------|------|
| Генератор QR-кодов | ✅ Готово | `src/app/dashboard/qr-codes/page.tsx` |
| QR-код ресторана | ✅ Готово | — |
| QR-коды столиков | ✅ Готово | — |
| Скачивание QR | ✅ Готово | — |
| Массовая генерация | ❌ Отсутствует | — |
| Выбор размера/формата | ❌ Отсутствует | — |
| Генерация тейбл-тентов | ❌ Отсутствует | — |

### 4.2 Быстрые вопросы
| Задача | Статус | Файл |
|--------|--------|------|
| Список вопросов | ✅ Готово | `src/app/dashboard/questions/page.tsx` |
| Табы меню/бронирование | ✅ Готово | — |
| Создание вопроса | ✅ Готово | — |
| Удаление вопроса | ✅ Готово | — |
| Редактирование вопроса | ❌ Отсутствует | — |
| Drag-n-drop сортировка | ❌ Отсутствует | — |
| Выбор языка | ✅ Готово | — |

### 4.3 Аналитика
| Задача | Статус | Файл |
|--------|--------|------|
| Общая статистика | ✅ Готово | `src/app/dashboard/analytics/overview/page.tsx` |
| Карточки метрик | ✅ Готово | — |
| График бронирований | ✅ Готово | LineChart |
| Распределение по статусам | ✅ Готово | PieChart |
| Выбор периода | ✅ Готово | — |
| Статистика бронирований | ✅ Готово | `src/app/dashboard/analytics/reservations/page.tsx` |
| Распределение по времени | ✅ Готово | — |
| Популярность столов | ❌ Отсутствует | — |
| Топ-гости | ⚠️ Частично | мок-данные |
| Статистика чатов | ✅ Готово | `src/app/dashboard/analytics/chats/page.tsx` |
| % AI vs Персонал | ✅ Готово | — |
| Популярные вопросы | ✅ Готово | — |

### 4.4 Управление командой
| Задача | Статус | Файл |
|--------|--------|------|
| Список сотрудников | ✅ Готово | `src/app/dashboard/team/page.tsx` |
| Добавление сотрудника | ✅ Готово | модальное окно |
| Удаление из организации | ✅ Готово | — |
| Отдельная страница списка | ❌ Отсутствует | `/dashboard/team/members/page.tsx` |
| Страница приглашения | ❌ Отсутствует | `/dashboard/team/invite/page.tsx` |
| Изменение роли | ⚠️ Частично | — |
| Email-приглашения | ❌ Отсутствует | backend? |

### 4.5 Настройки
| Задача | Статус | Файл |
|--------|--------|------|
| Профиль пользователя | ✅ Готово | `src/app/dashboard/settings/profile/page.tsx` |
| Смена пароля | ✅ Готово | — |
| Загрузка аватара | ❌ Отсутствует | — |
| Настройки организации | ✅ Готово | `src/app/dashboard/settings/organization/page.tsx` |
| Управление языками | ✅ Готово | `src/app/dashboard/settings/languages/page.tsx` |
| Подписка | ✅ Готово | `src/app/dashboard/settings/subscription/page.tsx` |
| Продление подписки | ⚠️ Частично | UI есть, API готов |

---

## Этап 5: Админ-панель

| Задача | Статус | Файл |
|--------|--------|------|
| Статистика системы | ✅ Готово | `src/app/dashboard/admin/page.tsx` |
| Карточки метрик | ✅ Готово | — |
| Управление пользователями | ✅ Готово | `src/app/dashboard/admin/users/page.tsx` |
| Поиск пользователей | ✅ Готово | — |
| Активация/деактивация | ✅ Готово | — |
| Смена роли (user↔admin) | ✅ Готово | — |
| Удаление пользователя | ✅ Готово | — |
| Пагинация | ❌ Отсутствует | — |
| Управление организациями | ✅ Готово | `src/app/dashboard/admin/organizations/page.tsx` |
| Просмотр деталей | ❌ Отсутствует | — |
| Удаление организации | ✅ Готово | — |
| Модерация контента | ✅ Готово | `src/app/dashboard/admin/moderation/page.tsx` |
| Просмотр блюд | ✅ Готово | — |
| Фильтрация по организации | ✅ Готово | — |
| Удаление блюд | ✅ Готово | — |
| Логи действий | ✅ Готово | `src/app/dashboard/admin/logs/page.tsx` |
| Фильтрация по действию | ✅ Готово | — |
| Фильтрация по дате | ❌ Отсутствует | — |
| Пагинация | ❌ Отсутствует | — |

---

## Этап 6: Полировка

### 6.1 Темы
| Задача | Статус | Файл |
|--------|--------|------|
| Светлая тема | ✅ Готово | по умолчанию |
| Тёмная тема | ❌ Отсутствует | — |
| Переключатель тем | ❌ Отсутствует | — |
| Системная тема (авто) | ❌ Отсутствует | — |

### 6.2 Адаптивность
| Задача | Статус | Файл |
|--------|--------|------|
| Desktop (1920px+) | ✅ Готово | — |
| Laptop (1366px) | ✅ Готово | — |
| Tablet (768px) | ⚠️ Частично | — |
| Mobile (375px) | ⚠️ Частично | — |
| Коллапсируемый sidebar | ✅ Готово | — |

### 6.3 Локализация (i18n)
| Задача | Статус | Файл |
|--------|--------|------|
| Русский язык | ✅ Готово | по умолчанию |
| Английский язык | ❌ Отсутствует | — |
| Переключатель языков | ❌ Отсутствует | — |
| Форматирование дат | ✅ Готово | date-fns + ru locale |
| Форматирование валюты | ✅ Готово | — |

### 6.4 Доступность (a11y)
| Задача | Статус |
|--------|--------|
| Контраст текста ≥ 4.5:1 | ⚠️ Не проверено |
| Фокус-состояния | ✅ Готово (shadcn) |
| ARIA-атрибуты | ⚠️ Частично |
| Alt-тексты для изображений | ⚠️ Не проверено |

### 6.5 Производительность
| Задача | Статус |
|--------|--------|
| Ленивая загрузка изображений | ❌ Отсутствует |
| Виртуализация списков | ❌ Отсутствует |
| Кэширование (TanStack Query) | ✅ Готово |
| Code splitting | ✅ Готово (Next.js) |

### 6.6 Тестирование
| Задача | Статус |
|--------|--------|
| Unit-тесты компонентов | ❌ Отсутствует |
| Интеграционные тесты | ❌ Отсутствует |
| E2E тесты | ❌ Отсутствует |
| Покрытие ≥ 70% | ❌ 0% |

---

## Сводка по страницам

### Реализованные страницы (38)

#### Аутентификация (4)
- [x] `/login`
- [x] `/register`
- [x] `/forgot-password`
- [x] `/reset-password`

#### Дашборд (1)
- [x] `/dashboard`

#### Рестораны (5)
- [x] `/dashboard/restaurants`
- [x] `/dashboard/restaurants/new`
- [x] `/dashboard/restaurants/[id]`
- [x] `/dashboard/restaurants/[id]/edit`
- [x] `/dashboard/restaurants/[id]/settings`

#### Меню (4)
- [x] `/dashboard/menu/categories`
- [x] `/dashboard/menu/dishes`
- [x] `/dashboard/menu/dishes/new`
- [x] `/dashboard/menu/dishes/[id]`

#### Столы (1)
- [x] `/dashboard/tables`

#### Бронирования (3)
- [x] `/dashboard/reservations/list`
- [x] `/dashboard/reservations/calendar`
- [x] `/dashboard/reservations/[id]`

#### Чаты (3)
- [x] `/dashboard/chats/active`
- [x] `/dashboard/chats/history`
- [x] `/dashboard/chats/[sessionId]`

#### Вопросы (1)
- [x] `/dashboard/questions`

#### QR-коды (1)
- [x] `/dashboard/qr-codes`

#### Аналитика (3)
- [x] `/dashboard/analytics/overview`
- [x] `/dashboard/analytics/reservations`
- [x] `/dashboard/analytics/chats`

#### Команда (1)
- [x] `/dashboard/team`

#### Настройки (4)
- [x] `/dashboard/settings/profile`
- [x] `/dashboard/settings/organization`
- [x] `/dashboard/settings/languages`
- [x] `/dashboard/settings/subscription`

#### Админ-панель (5)
- [x] `/dashboard/admin`
- [x] `/dashboard/admin/users`
- [x] `/dashboard/admin/organizations`
- [x] `/dashboard/admin/moderation`
- [x] `/dashboard/admin/logs`

### Отсутствующие страницы (4)

- [ ] `/dashboard/tables/new` — создание стола (отдельная страница)
- [ ] `/dashboard/tables/[id]` — редактирование стола (отдельная страница)
- [ ] `/dashboard/team/members` — список сотрудников (отдельная страница)
- [ ] `/dashboard/team/invite` — приглашение сотрудника

---

## Приоритеты доработок

### Высокий приоритет (P0)
1. ❌ WebSocket для real-time чатов
2. ❌ Пагинация в админ-панели
3. ❌ Тёмная тема

### Средний приоритет (P1)
1. ✅ Страница конкретного чата `/chats/[sessionId]`
2. ❌ Drag-n-drop сортировка категорий
3. ✅ Шаблоны быстрых ответов в чатах
4. ❌ Мобильная адаптация (проверка/доработка)
5. ✅ Детальная страница ресторана
6. ✅ Настройки ресторана

### Низкий приоритет (P2)
1. ❌ Визуальная схема зала для столов
2. ❌ Переключение период в календаре (день/месяц)
3. ❌ Массовая генерация QR-кодов
4. ❌ Unit-тесты
5. ❌ Локализация (английский язык)
6. ❌ Страницы team/members, team/invite
7. ❌ Страницы tables/new, tables/[id]

---

## API интеграция

### Реализованные методы

| Модуль | Методы | Статус |
|--------|--------|--------|
| Auth | login, register, changePassword, requestPasswordReset, verifyPasswordReset, checkToken | ✅ |
| User | getById, update, create | ✅ |
| Organization | getAll, getById, update, addUser, removeUser, getLanguages, addLanguage, removeLanguage | ✅ |
| Language | getAll, create | ✅ |
| Restaurant | getAll, getById, create, update, delete, updateWorkingHours | ✅ |
| Table | getByRestaurant, getById, create, update, delete | ✅ |
| Category | getAll, create, delete | ✅ |
| Dish | getAll, getByCategory, getById, create, update, delete, setDishOfDay | ✅ |
| Reservation | getByRestaurant, getById, getAvailableSlots, create, update, cancel, delete | ✅ |
| Chat | getTableSessions, getTableSessionMessages, sendTableMessage, closeTableSession, getRestaurantSessions, getRestaurantSessionMessages, sendRestaurantMessage, closeRestaurantSession | ✅ |
| Question | getAll, getByLanguage, create, update, delete | ✅ |
| QRCode | getRestaurantQR, downloadRestaurantQR, getTableQR, downloadTableQR | ✅ |
| Subscription | getByOrganization, getActive, extend | ✅ |
| Upload | uploadImage | ✅ |
| Admin | getStats, getUsers, getUserById, updateUserStatus, updateUserRole, deleteUser, getOrganizations, getOrganizationById, deleteOrganization, getDishes, deleteDish, getLogs, getMyLogs | ✅ |

### Не реализованные API методы

- `PUT /categories/:id` — редактирование категории
- `PUT /questions/:id` — редактирование вопроса (API готов, UI нет)
- WebSocket endpoints для чатов

---

## Компоненты

### Общие (shadcn/ui) - все установлены
- [x] Button, Input, Label
- [x] Card, Badge, Skeleton
- [x] Table, Dialog, AlertDialog
- [x] Select, Tabs, Dropdown
- [x] Form, Calendar
- [x] Sidebar, Breadcrumb
- [x] Toast (sonner)
- [x] Progress

### Специфичные
- [x] Header с breadcrumbs
- [x] Sidebar навигация
- [x] StatCard (виджет статистики)
- [x] ChatWindow (окно чата)
- [x] ChatList (список чатов)
- [x] WorkingHoursEditor (расписание)
- [ ] TableFloorPlan (схема зала)
- [ ] DishCard (превью блюда)
- [ ] QRCodePreview с настройками

---

## Технический долг

1. **Типизация**: некоторые компоненты используют `any` или неточные типы
2. **Дублирование**: похожий код в разных страницах аналитики
3. **Мок-данные**: в аналитике используются захардкоженные данные
4. **Консистентность**: разные подходы к формам (иногда модальные, иногда отдельные страницы)
5. **Error boundaries**: отсутствуют компоненты обработки ошибок
6. **Loading states**: не везде однородные skeleton-загрузчики

---

*Последнее обновление: 26 ноября 2025 (Добавлены: детальная страница ресторана, настройки ресторана, страница чата, шаблоны ответов, кнопка возврата AI)*
