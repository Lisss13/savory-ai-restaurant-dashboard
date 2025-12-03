# Задача: Интеграция Chat API в клиентское приложение (Next.js)

## Цель
Проверить и улучшить работу клиентского приложения с Chat API. Убедиться что фронтенд корректно работает с чат-сессиями, отправляет сообщения AI-боту и отображает информацию о бронированиях.

---

## 1. Архитектура чатов

### Два типа чатов:
- **Table Chat** - чат для посетителей за столиком (через QR-код)
- **Restaurant Chat** - общий чат с рестораном (основной для бронирования)

### Роли сообщений:
- `user` - сообщение от пользователя
- `bot` - ответ AI-бота

---

## 2. API Endpoints

### Base URL
```
{{API_URL}}/chat
```

---

### 2.1 Restaurant Chat (основной)

#### Создание сессии чата
```http
POST /chat/restaurant/session/start
Content-Type: application/json

{
  "restaurantId": 1
}
```

**Ответ:**
```json
{
  "data": {
    "session": {
      "id": 123,
      "active": true,
      "lastActive": "2024-01-15T10:30:00Z",
      "restaurant": {
        "id": 1,
        "name": "Ресторан Пример"
      }
    }
  },
  "messages": ["Restaurant chat session started successfully"],
  "code": 200
}
```

#### Отправка сообщения
```http
POST /chat/restaurant/message/send
Content-Type: application/json

{
  "sessionId": 123,
  "content": "Хочу забронировать столик на завтра на 18:00"
}
```

**Ответ:**
```json
{
  "data": {
    "message": {
      "id": 456,
      "content": "Конечно! На сколько гостей вы хотите забронировать столик?",
      "sentAt": "2024-01-15T10:31:00Z"
    }
  },
  "messages": ["Message sent successfully"],
  "code": 200
}
```

#### Получение истории сообщений
```http
GET /chat/restaurant/session/{sessionId}/messages
```

**Ответ:**
```json
{
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "Хочу забронировать столик",
        "sentAt": "2024-01-15T10:30:00Z",
        "authorType": "user"
      },
      {
        "id": 2,
        "content": "Конечно! На какую дату и время?",
        "sentAt": "2024-01-15T10:30:05Z",
        "authorType": "bot"
      }
    ]
  },
  "messages": ["Messages retrieved successfully"],
  "code": 200
}
```

#### Получение всех сессий ресторана
```http
GET /chat/restaurant/sessions/{restaurantId}
```

**Ответ:**
```json
{
  "data": {
    "sessions": [
      {
        "id": 123,
        "active": true,
        "lastActive": "2024-01-15T10:30:00Z",
        "restaurant": { "id": 1, "name": "Ресторан" },
        "messages": []
      }
    ]
  },
  "messages": ["Restaurant chat sessions retrieved successfully"],
  "code": 200
}
```

**Ошибка 404** - если сессий нет:
```json
{
  "messages": ["No chat sessions found for this restaurant"],
  "code": 404
}
```

#### Закрытие сессии
```http
POST /chat/restaurant/session/close/{sessionId}
```

---

### 2.2 Table Chat (для QR-кодов)

#### Создание сессии
```http
POST /chat/table/session/start
Content-Type: application/json

{
  "tableId": 5,
  "restaurantId": 1
}
```

#### Отправка сообщения
```http
POST /chat/table/message/send
Content-Type: application/json

{
  "sessionId": 123,
  "content": "Что в составе пиццы Маргарита?"
}
```

#### Получение истории
```http
GET /chat/table/session/{sessionId}/messages
```

#### Получение сессий столика
```http
GET /chat/table/session/{tableId}
```

#### Закрытие сессии
```http
POST /chat/table/session/close/{sessionId}
```

---

### 2.3 Бронирования по чат-сессии

Получить бронирования, созданные в текущей чат-сессии:

```http
GET /reservations/session/{sessionId}
```

**Ответ:**
```json
{
  "data": {
    "reservations": [
      {
        "id": 789,
        "restaurantId": 1,
        "restaurantName": "Ресторан Пример",
        "tableId": 5,
        "tableName": "Столик у окна",
        "customerName": "Иван",
        "customerPhone": "+79001234567",
        "guestCount": 2,
        "reservationDate": "2024-01-16",
        "startTime": "18:00",
        "endTime": "20:00",
        "status": "pending"
      }
    ]
  },
  "messages": ["Reservations retrieved successfully"],
  "code": 200
}
```

---

## 3. Что нужно реализовать/проверить

### 3.1 Управление сессией чата

```typescript
// Пример хука для управления чат-сессией
interface ChatSession {
  id: number;
  active: boolean;
  lastActive: string;
  restaurant: { id: number; name: string };
}

// При открытии чата:
// 1. Проверить есть ли сохраненная активная сессия в localStorage
// 2. Если нет - создать новую через POST /chat/restaurant/session/start
// 3. Сохранить sessionId в localStorage
```

### 3.2 Отправка сообщений

```typescript
interface SendMessageRequest {
  sessionId: number;
  content: string;
}

interface BotResponse {
  message: {
    id: number;
    content: string;
    sentAt: string;
  };
}

// При отправке:
// 1. Показать сообщение пользователя сразу (optimistic update)
// 2. Отправить POST /chat/restaurant/message/send
// 3. Показать ответ бота
// 4. Обработать ошибки (сессия закрыта, сервер недоступен)
```

### 3.3 Отображение истории

```typescript
interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  authorType: 'user' | 'bot';
}

// При загрузке чата:
// 1. Загрузить историю GET /chat/restaurant/session/{sessionId}/messages
// 2. Отсортировать по sentAt
// 3. Отобразить с разными стилями для user/bot
```

### 3.4 Информация о бронировании в чате

```typescript
// После успешного бронирования через чат:
// 1. Вызвать GET /reservations/session/{sessionId}
// 2. Если есть бронирования - показать карточку с информацией
// 3. Обновлять при каждом новом сообщении от бота (может содержать подтверждение)
```

---

## 4. UI компоненты которые нужно проверить

### 4.1 Окно чата
- Заголовок с названием ресторана
- Список сообщений (user справа, bot слева)
- Поле ввода + кнопка отправки
- Индикатор загрузки при ожидании ответа

### 4.2 Сообщение
- Текст сообщения
- Время отправки (форматировать для локали)
- Визуальное различие user/bot (цвет, позиция)

### 4.3 Карточка бронирования
Показывать в чате после создания бронирования:
- Дата и время
- Название столика
- Количество гостей
- Статус бронирования
- ID для отмены

---

