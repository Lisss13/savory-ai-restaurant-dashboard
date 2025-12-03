# 5A>>B25BAB28O B8?>2 <564C src/types/index.ts 8 swagger.yaml

## 1. WorkingHour - ;8H=55 ?>;5 `is_closed`

**TypeScript:**
```typescript
export interface WorkingHour {
  id?: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed?: boolean;  // <-- MB>3> ?>;O =5B 2 Swagger
}
```

**Swagger (WorkingHourResponse):** =5 A>45@68B ?>;5 `is_closed`

---

## 2. Restaurant - >BACBAB2CNI85 ?>;O 2 Swagger

**TypeScript:**
```typescript
export interface Restaurant {
  ...
  reservation_duration?: number;  // <-- =5B 2 Swagger RestaurantResponse
  min_reservation_time?: number;  // <-- =5B 2 Swagger RestaurantResponse
}
```

**Swagger (RestaurantResponse):** =5 A>45@68B ?>;O `reservation_duration` 8 `min_reservation_time` (E>BO `reservation_duration` 5ABL 2 UpdateRestaurantRequest)

---

## 3. MenuCategory - =5A>>B25BAB285 8<5=>20=8O ?>;59 (camelCase vs snake_case)

**TypeScript:**
```typescript
export interface MenuCategory {
  id: number;
  createdAt: string;      // <-- camelCase
  restaurantId: number;   // <-- camelCase
  name: string;
  sort_order: number;
}
```

**Swagger (MenuCategoryResponse):**
- `created_at` (snake_case)
- `restaurant_id` (snake_case)

---

## 4. Dish - =5A>>B25BAB285 8<5=>20=8O ?>;O createdAt

**TypeScript:**
```typescript
export interface Dish {
  id: number;
  createdAt: string;  // <-- camelCase
  ...
}
```

**Swagger (DishResponse):** 8A?>;L7C5B `created_at` (snake_case)

---

## 5. Dish - ;8H=55 ?>;5 `isDishOfDay`

**TypeScript:**
```typescript
export interface Dish {
  ...
  isDishOfDay?: boolean;  // <-- MB>3> ?>;O =5B 2 Swagger
}
```

**Swagger (DishResponse):** =5 A>45@68B ?>;5 `isDishOfDay`

---

## 6. Dish - ;8H=55 ?>;5 `organization`

**TypeScript:**
```typescript
export interface Dish {
  ...
  organization?: {
    id: number;
    name: string;
    phone: string;
  };  // <-- MB>3> ?>;O =5B 2 Swagger
}
```

**Swagger (DishResponse):** A>45@68B B>;L:> `restaurant`, => =5 `organization`

---

## 7. ChatSession - ;8H=55 ?>;5 `restaurant`

**TypeScript:**
```typescript
export interface ChatSession {
  ...
  restaurant?: {
    id: number;
    name: string;
  };  // <-- MB>3> ?>;O =5B 2 ChatSessionResponse
}
```

**Swagger:**
- `ChatSessionResponse` =5 A>45@68B ?>;5 `restaurant` (B>;L:> `table`)
- `RestaurantChatSessionResponse` A>45@68B `restaurant`, => MB> >B45;L=0O AE5<0

---

## 8. Reservation - =5A>>B25BAB285 AB@C:BC@K ?>;O table

**TypeScript:**
```typescript
export interface Reservation {
  ...
  table?: {
    id: number;
    name: string;
    capacity?: number;
  };  // <-- >1J5:B A capacity
}
```

**Swagger (ReservationResponse):**
- !>45@68B ?;>A:85 ?>;O `table_id` 8 `table_name`
- 5 A>45@68B 2;>65==K9 >1J5:B `table`
- 5 A>45@68B ?>;5 `capacity`

---

## 9. Table - =5A>>B25BAB285 8<5=>20=8O ?>;O createdAt

**TypeScript:**
```typescript
export interface Table {
  id: number;
  createdAt: string;  // <-- camelCase
  ...
}
```

**Swagger (TableResponse):** 8A?>;L7C5B `createdAt` (camelCase) - A>>B25BAB2C5B

---

## 10. Subscription - =5A>>B25BAB285 8<5=>20=8O ?>;O createdAt

**TypeScript:**
```typescript
export interface Subscription {
  id: number;
  createdAt: string;  // <-- camelCase
  ...
}
```

**Swagger (SubscriptionResponse):** 8A?>;L7C5B `createdAt` (camelCase) - A>>B25BAB2C5B

---

## 1I85 70<5G0=8O

1. **5?>A;54>20B5;L=>5 8A?>;L7>20=85 snake_case vs camelCase:** 5:>B>@K5 B8?K (MenuCategory, Dish) 8A?>;L7CNB camelCase 2 TypeScript, => snake_case 2 Swagger. @C385 (Table, Subscription) 8A?>;L7CNB camelCase 2 >1>8E <5AB0E.

2. **>?>;=8B5;L=K5 ?>;O 2 TypeScript:** 5A:>;L:> B8?>2 (Dish, ChatSession, Reservation) A>45@60B ?>;O, :>B>@KE =5B 2 Swagger. -B> <>65B 1KBL =0<5@5==> (5A;8 API 2>72@0I05B 1>;LH5 40==KE, G5< 4>:C<5=B8@>20=>) 8;8 >H81:>9.

3. ** 5:><5=40F8O:** @825AB8 B8?K 2 A>>B25BAB285 A> Swagger 8;8 >1=>28BL Swagger 4;O >B@065=8O D0:B8G5A:>3> API.
