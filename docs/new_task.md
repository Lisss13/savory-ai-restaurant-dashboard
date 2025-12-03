Задача: Обновить API вызов редактирования ресторана

Изменения в API

Endpoint: PATCH /restaurants/:id (был PUT, стал PATCH)

Что изменилось:

1. HTTP метод: PUT → PATCH
2. Убрано поле organization_id из тела запроса — теперь определяется автоматически из JWT токена
3. Partial update: Теперь можно отправлять только те поля, которые нужно обновить (не обязательно все)
4. Новый код ответа 403: Если ресторан принадлежит другой организации

Структура запроса (все поля опциональны):

interface UpdateRestaurantRequest {
name?: string;
address?: string;
phone?: string;
website?: string;
description?: string;
image_url?: string;
menu?: string;
currency?: string;           // ISO 4217: "USD", "EUR", "RUB"
reservation_duration?: number; // 30-480 минут
}

Примеры запросов:

// Обновить только название
await api.patch('/restaurants/1', { name: 'Новое название' });

// Обновить несколько полей
await api.patch('/restaurants/1', {
currency: 'EUR',
reservation_duration: 120
});

Обработка ошибок:

| Код | Описание                                |
  |-----|-----------------------------------------|
| 200 | Успешно обновлено                       |
| 403 | Ресторан принадлежит другой организации |
| 404 | Ресторан не найден                      |

Действия:

1. Изменить HTTP метод с PUT на PATCH
2. Убрать поле organization_id из формы/запроса
3. Отправлять только изменённые поля (не все)
4. Добавить обработку ошибки 403
