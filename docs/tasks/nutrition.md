# ТЗ: Фронтенд — Расчёт КБЖУ блюда

## Контекст

Добавить функционал расчёта калорий, белков, жиров и углеводов (КБЖУ) для блюда через AI. Расчёт вызывается вручную пользователем через кнопку.

## Где добавить

Страница/компонент редактирования блюда в админке ресторана. Рядом с полями ввода КБЖУ.

---

## Требования к UI

### 1. Кнопка запуска

- Текст: «Рассчитать КБЖУ» (или «Calculate Nutrition» для EN)
- Расположение: рядом с полями calories, protein, fat, carbs
- Состояния:
    - `disabled` — если поля name ИЛИ description ИЛИ ingredients пустые
    - `loading` — пока идёт запрос (показать спиннер, текст «Расчёт...»)
    - `default` — обычное состояние

### 2. Модальное окно подтверждения

При клике на кнопку открывается модальное окно со следующим содержимым:

```
Заголовок: "Расчёт КБЖУ"

Текст: "AI рассчитает примерные значения на основе следующих данных:"

[Секция данных]
Название: {значение поля name}
Описание: {значение поля description}
Ингредиенты:
  - {ingredient.name}: {ingredient.quantity} г
  - {ingredient.name}: {ingredient.quantity} г
  - ...

[Предупреждение]
Текст: "Значения будут приблизительными. Рекомендуем проверить и скорректировать при необходимости."
Стиль: серый/приглушённый текст

[Кнопки]
- "Отмена" — закрывает окно, ничего не делает
- "Рассчитать" — отправляет запрос
```

### 3. Состояния модального окна

При нажатии «Рассчитать»:
- Кнопка «Рассчитать» переходит в состояние loading (спиннер + текст «Расчёт...»)
- Кнопка «Отмена» становится disabled
- Закрытие окна по клику вне области — отключено

### 4. После успешного ответа

- Модальное окно закрывается
- Поля calories, protein, fat, carbs заполняются значениями из ответа
- Показать toast/уведомление: «КБЖУ рассчитано» (зелёный, автоскрытие через 3 сек)

### 5. При ошибке

- Модальное окно остаётся открытым
- Показать текст ошибки внутри модального окна (красный цвет)
- Текст: «Не удалось рассчитать. Попробуйте позже.»
- Кнопки возвращаются в обычное состояние

---

## API запрос

```
POST /dishes/calculate-nutrition

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "name": string,
  "description": string,
  "ingredients": [
    { "name": string, "quantity": number },
    { "name": string, "quantity": number }
  ]
}

Все поля обязательные.
ingredients — массив, минимум 1 элемент.
```

### Response 200

```json
{
  "code": number,
  "messages": [
    "success"
  ],
  "data": {
    "calories": number,
    "protein": number,
    "fat": number,
    "carbs": number
  }
}
```

### Response 400

```json
{
  "code": 400,
  "messages": [
    "name is required"
  ]
}
```
```json
{
  "code": 400,
  "messages": [
    "description is required"
  ]
}
```
```json
{
  "code": 400,
  "messages": [
    "ingredients is required"
  ]
}
```
```json
{
  "code": 400,
  "messages": [
    "ingredients must have at least one item"
  ]
}
```

### Response 500

```json
{
  "code": 500,
  "messages": [
    "calculation failed"
  ]
}
```

---

## Типы TypeScript

```typescript
interface Ingredient {
  name: string;
  quantity: number;
}

interface CalculateNutritionRequest {
  name: string;
  description: string;
  ingredients: Ingredient[];
}

interface CalculateNutritionResponse {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
```

---

## Ограничения

- НЕ добавлять автоматический расчёт при сохранении блюда
- НЕ добавлять периодический перерасчёт
- НЕ изменять существующую логику сохранения блюда
- НЕ добавлять новые поля в форму кроме кнопки
