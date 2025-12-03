# Несоответствия типов между src/types/index.ts и swagger.yaml

**Статус: ИСПРАВЛЕНО**

## 1. WorkingHour - лишнее поле `is_closed` - ИСПРАВЛЕНО

Удалено поле `is_closed` из интерфейса `WorkingHour`. UI формы используют локальную схему для отображения checkbox "Закрыто", но фильтруют эти записи при отправке в API.

---

## 2. Restaurant - отсутствующие поля в Swagger - ИСПРАВЛЕНО

Удалены поля `reservation_duration` и `min_reservation_time` из интерфейса `Restaurant`. Создан отдельный интерфейс `UpdateRestaurantRequest` с полем `reservation_duration` для обновления (согласно Swagger).

---

## 3. MenuCategory - несоответствие именования полей (camelCase vs snake_case) - ИСПРАВЛЕНО

Изменены поля в интерфейсе `MenuCategory`:
- `createdAt` -> `created_at`
- `restaurantId` -> `restaurant_id`

---

## 4. Dish - несоответствие именования поля createdAt - ИСПРАВЛЕНО

Изменено поле `createdAt` на `created_at` в интерфейсе `Dish`.

---

## 5. Dish - лишнее поле `isDishOfDay` - ИСПРАВЛЕНО

Удалено поле `isDishOfDay` из интерфейса `Dish`. Функционал "Блюдо дня" работает через отдельный API endpoint `POST /dishes/dish-of-day/{id}`.

---

## 6. Dish - лишнее поле `organization` - ИСПРАВЛЕНО

Удалено поле `organization` из интерфейса `Dish`.

---

## 7. ChatSession - лишнее поле `restaurant` - ИСПРАВЛЕНО

Удалено поле `restaurant` из интерфейса `ChatSession`.

---

## 8. Reservation - несоответствие структуры поля table - ИСПРАВЛЕНО

Удалён вложенный объект `table` из интерфейса `Reservation`. Используются плоские поля `table_id` и `table_name` согласно Swagger.

---

## 9. Table - несоответствие именования поля createdAt - НЕ ТРЕБУЕТСЯ

Swagger использует `createdAt` (camelCase) - соответствует TypeScript.

---

## 10. Subscription - несоответствие именования поля createdAt - НЕ ТРЕБУЕТСЯ

Swagger использует `createdAt` (camelCase) - соответствует TypeScript.

---

## Изменения в коде

### Типы (src/types/index.ts):
- `WorkingHour`: удалено `is_closed`
- `Restaurant`: удалены `reservation_duration`, `min_reservation_time`
- `CreateRestaurantRequest`: удалены `reservation_duration`, `min_reservation_time`
- Добавлен `UpdateRestaurantRequest` с `reservation_duration`
- `MenuCategory`: `createdAt` -> `created_at`, `restaurantId` -> `restaurant_id`
- `Dish`: `createdAt` -> `created_at`, удалены `isDishOfDay`, `organization`
- `ChatSession`: удалено `restaurant`
- `Reservation`: удалён вложенный объект `table`

### API (src/lib/api.ts):
- Добавлен импорт `UpdateRestaurantRequest`
- `restaurantApi.update` использует `UpdateRestaurantRequest`

### UI компоненты:
- Удалён UI для `isDishOfDay` в редактировании блюда
- Удалён UI для `reservation_duration`/`min_reservation_time` на странице ресторана
- Удалён `min_reservation_time` из настроек ресторана
- Исправлены ссылки на `table.id` -> `table_id` в бронированиях
- Удалены проверки `is_closed` в проверке времени работы
