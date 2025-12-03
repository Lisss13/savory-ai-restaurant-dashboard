// User types
export interface User {
  id: number;
  created_at: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

export interface Organization {
  id: number;
  created_at?: string;
  name: string;
  phone: string;
  admin_id?: number;
  admin?: UserInOrg;
  users?: UserInOrg[];
  languages?: Language[];
}

export interface UserInOrg {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  company: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  expires_at: number;
  user: User;
  organization: Organization;
}

// Language types
export interface Language {
  id: number;
  createdAt: string;
  code: string;
  name: string;
  description?: string;
}

// Restaurant types
export interface Restaurant {
  id: number;
  created_at: string;
  organization?: {
    id: number;
    name: string;
    phone: string;
  };
  name: string;
  address: string;
  phone: string;
  website?: string;
  description?: string;
  image_url?: string;
  currency?: string;
  working_hours: WorkingHour[];
}

export interface WorkingHour {
  id?: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface CreateRestaurantRequest {
  organization_id: number;
  name: string;
  address: string;
  phone: string;
  website?: string;
  description?: string;
  image_url?: string;
  currency?: string;
  working_hours: WorkingHour[];
}

export interface UpdateRestaurantRequest {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  image_url?: string;
  currency?: string;
  reservation_duration?: number;
  working_hours?: WorkingHour[];
}

// Table types
export interface Table {
  id: number;
  createdAt: string;
  restaurant?: {
    id: number;
    name: string;
  };
  name: string;
  guestCount: number;
}

export interface CreateTableRequest {
  name: string;
  guestCount: number;
  restaurantId: number;
}

// Menu Category types
export interface MenuCategory {
  id: number;
  created_at: string;
  restaurant_id: number;
  name: string;
  sort_order: number;
}

export interface CreateMenuCategoryRequest {
  name: string;
  restaurant_id: number;
  sort_order?: number;
}

export interface UpdateCategorySortOrderRequest {
  categories: { id: number; sort_order: number }[];
}

// Dish types
export interface Dish {
  id: number;
  created_at: string;
  restaurant?: {
    id: number;
    name: string;
    currency?: string;
  };
  menuCategory?: {
    id: number;
    name: string;
  };
  name: string;
  price: number;
  description?: string;
  image?: string;
  // Nutrition values (КБЖУ)
  proteins: number;
  fats: number;
  carbohydrates: number;
  calories: number;
  ingredients: Ingredient[];
  allergens?: Allergen[];
}

// Nutrition data interface
export interface NutritionData {
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
}

export interface Ingredient {
  id?: number;
  name: string;
  quantity: number;
}

export interface Allergen {
  id?: number;
  name: string;
  description?: string;
}

export interface CreateDishRequest {
  restaurant_id: number;
  menuCategoryId: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  // Nutrition values (КБЖУ)
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  calories?: number;
  ingredients: Ingredient[];
  allergens?: Allergen[];
}

// Reservation types
export interface Reservation {
  id: number;
  restaurant_id?: number;
  restaurant_name?: string;
  table_id?: number;
  table_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  guest_count: number;
  reservation_date: string;
  start_time: string;
  end_time?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at?: string;
}

export interface CreateReservationRequest {
  restaurant_id: number;
  table_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  guest_count: number;
  reservation_date: string;
  start_time: string;
  notes?: string;
}

export interface AvailableSlot {
  table_id: number;
  table_name: string;
  capacity: number;
  start_time: string;
  end_time: string;
}

// Chat types
export interface ChatSession {
  id: number;
  active: boolean;
  lastActive: string;
  table?: {
    id: number;
    name: string;
  };
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  authorType: 'user' | 'bot' | 'restaurant';
}

// Question types
export interface Question {
  id: number;
  created_at: string;
  text: string;
  language?: Language;
  chat_type: 'reservation' | 'menu';
  display_order: number;
}

export interface CreateQuestionRequest {
  text: string;
  languageCode?: string;
  chatType?: 'reservation' | 'menu';
  displayOrder?: number;
}

export interface ReorderQuestionsRequest {
  questionIds: number[];
}

// Subscription types
export interface Subscription {
  id: number;
  createdAt: string;
  organization?: {
    id: number;
    name: string;
    phone: string;
  };
  period: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  daysLeft: number;
}

// Extension Request types
export type ExtensionRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ExtensionRequest {
  id: number;
  createdAt: string;
  organization?: {
    id: number;
    name: string;
    phone: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  name: string;
  phone: string;
  email: string;
  period?: number;
  comment?: string;
  status: ExtensionRequestStatus;
  adminComment?: string;
}

export interface CreateExtensionRequestRequest {
  name: string;
  phone: string;
  email: string;
  period?: number;
  comment?: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  totalRestaurants: number;
  totalDishes: number;
  totalTables: number;
  totalQuestions: number;
  activeSubscriptions: number;
  recentActivity?: AdminActivity[];
}

export interface AdminActivity {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  adminName: string;
  createdAt: string;
}

export interface AdminLog {
  id: number;
  adminId: number;
  adminName: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: number;
  details?: string;
  ipAddress: string;
  createdAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  code: number;
  messages: string[];
  data: T;
  meta?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  reservationsToday: number;
  reservationsDelta: number;
  activeChats: number;
  tablesOccupied: number;
  tablesTotal: number;
  dishesCount: number;
}

// Support types
export interface SupportTicket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  email: string;
  phone?: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateSupportTicketRequest {
  title: string;
  description: string;
  email: string;
  phone?: string;
}

// Dishes by category response
export interface DishByCategory {
  category: {
    id: number;
    name: string;
  };
  dishes: Dish[];
}

export interface DishesByCategoryResponse {
  dishes: DishByCategory[];
}
