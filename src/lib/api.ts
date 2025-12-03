import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Organization,
  Restaurant,
  CreateRestaurantRequest,
  Table,
  CreateTableRequest,
  MenuCategory,
  CreateMenuCategoryRequest,
  UpdateCategorySortOrderRequest,
  Dish,
  CreateDishRequest,
  DishesByCategoryResponse,
  Reservation,
  CreateReservationRequest,
  AvailableSlot,
  ChatSession,
  ChatMessage,
  Question,
  CreateQuestionRequest,
  ReorderQuestionsRequest,
  Subscription,
  ExtensionRequest,
  CreateExtensionRequestRequest,
  AdminStats,
  AdminLog,
  Language,
  SupportTicket,
  CreateSupportTicketRequest,
} from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper function to get full image URL
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/request-password-reset', { email });
    return response.data;
  },

  verifyPasswordReset: async (email: string, code: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/verify-password-reset', { email, code, newPassword });
    return response.data;
  },

  checkToken: async (): Promise<ApiResponse<{ id: number; email: string; company_id: number }>> => {
    const response = await apiClient.get('/auth/chek');
    return response.data;
  },
};

// User API
export const userApi = {
  getById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/user/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch(`/user/${id}`, data);
    return response.data;
  },

  create: async (data: { name: string; company: string; email: string; phone?: string; password: string }): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/user', data);
    return response.data;
  },
};

// Organization API
export const organizationApi = {
  getAll: async (): Promise<ApiResponse<{ organizations: Organization[] }>> => {
    const response = await apiClient.get('/organization');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.get(`/organization/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.patch(`/organization/${id}`, data);
    return response.data;
  },

  addUser: async (orgId: number, userId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/organization/${orgId}/users`, { user_id: userId });
    return response.data;
  },

  removeUser: async (orgId: number, userId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/organization/${orgId}/users`, { data: { user_id: userId } });
    return response.data;
  },

  getLanguages: async (id: number): Promise<ApiResponse<Language[]>> => {
    const response = await apiClient.get(`/organization/${id}/languages`);
    return response.data;
  },

  addLanguage: async (orgId: number, languageId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/organization/${orgId}/languages`, { languageId });
    return response.data;
  },

  removeLanguage: async (orgId: number, languageId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/organization/${orgId}/languages`, { data: { languageId } });
    return response.data;
  },
};

// Language API
export const languageApi = {
  getAll: async (): Promise<ApiResponse<{ languages: Language[] }>> => {
    const response = await apiClient.get('/languages');
    return response.data;
  },

  create: async (data: { code: string; name: string; description?: string }): Promise<ApiResponse<Language>> => {
    const response = await apiClient.post('/languages', data);
    return response.data;
  },
};

// Restaurant API
export const restaurantApi = {
  getAll: async (): Promise<ApiResponse<{ restaurants: Restaurant[] }>> => {
    const response = await apiClient.get('/restaurants');
    return response.data;
  },

  getByOrganization: async (organizationId: number): Promise<ApiResponse<{ restaurants: Restaurant[] }>> => {
    const response = await apiClient.get(`/restaurants/organization/${organizationId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Restaurant>> => {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  },

  create: async (data: CreateRestaurantRequest): Promise<ApiResponse<Restaurant>> => {
    const response = await apiClient.post('/restaurants', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateRestaurantRequest>): Promise<ApiResponse<Restaurant>> => {
    const response = await apiClient.put(`/restaurants/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/restaurants/${id}`);
    return response.data;
  },

  updateWorkingHours: async (id: number, workingHours: { day_of_week: number; open_time: string; close_time: string }[]): Promise<ApiResponse<void>> => {
    const response = await apiClient.put(`/restaurants/${id}/working-hours`, { working_hours: workingHours });
    return response.data;
  },
};

// Table API
export const tableApi = {
  getByRestaurant: async (restaurantId: number): Promise<ApiResponse<{ tables: Table[] }>> => {
    const response = await apiClient.get(`/tables/restaurant/${restaurantId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Table>> => {
    const response = await apiClient.get(`/tables/${id}`);
    return response.data;
  },

  create: async (data: CreateTableRequest): Promise<ApiResponse<Table>> => {
    const response = await apiClient.post('/tables', data);
    return response.data;
  },

  update: async (id: number, data: CreateTableRequest): Promise<ApiResponse<Table>> => {
    const response = await apiClient.put(`/tables/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/tables/${id}`);
    return response.data;
  },
};

// Menu Category API
export const categoryApi = {
  getByRestaurant: async (restaurantId: number): Promise<ApiResponse<{ categories: MenuCategory[] }>> => {
    const response = await apiClient.get(`/categories/restaurant/${restaurantId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<MenuCategory>> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateMenuCategoryRequest): Promise<ApiResponse<MenuCategory>> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateMenuCategoryRequest>): Promise<ApiResponse<MenuCategory>> => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  updateSortOrder: async (data: UpdateCategorySortOrderRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.put('/categories/sort-order', data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

// Dish API
export const dishApi = {
  getByRestaurant: async (restaurantId: number): Promise<ApiResponse<{ dishes: Dish[] }>> => {
    const response = await apiClient.get(`/dishes/restaurant/${restaurantId}`);
    return response.data;
  },

  getByCategory: async (restaurantId: number): Promise<ApiResponse<DishesByCategoryResponse>> => {
    const response = await apiClient.get(`/dishes/category/${restaurantId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Dish>> => {
    const response = await apiClient.get(`/dishes/${id}`);
    return response.data;
  },

  create: async (data: CreateDishRequest): Promise<ApiResponse<Dish>> => {
    const response = await apiClient.post('/dishes', data);
    return response.data;
  },

  update: async (id: number, data: CreateDishRequest): Promise<ApiResponse<Dish>> => {
    const response = await apiClient.put(`/dishes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/dishes/${id}`);
    return response.data;
  },

  getDishOfDay: async (restaurantId: number): Promise<ApiResponse<Dish>> => {
    const response = await apiClient.get(`/dishes/dish-of-day/${restaurantId}`);
    return response.data;
  },

  setDishOfDay: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/dishes/dish-of-day/${id}`);
    return response.data;
  },
};

// Reservation API
export const reservationApi = {
  getAll: async (): Promise<ApiResponse<{ reservations: Reservation[] }>> => {
    const response = await apiClient.get('/reservations');
    return response.data;
  },

  getByRestaurant: async (restaurantId: number): Promise<ApiResponse<{ reservations: Reservation[] }>> => {
    const response = await apiClient.get(`/reservations/restaurant/${restaurantId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data;
  },

  getAvailableSlots: async (restaurantId: number, date: string, guestCount?: number): Promise<ApiResponse<{ restaurant_id: number; restaurant_name: string; date: string; slots: AvailableSlot[] }>> => {
    const params = new URLSearchParams({ date });
    if (guestCount) params.append('guest_count', guestCount.toString());
    const response = await apiClient.get(`/reservations/available/${restaurantId}?${params}`);
    return response.data;
  },

  getMyReservations: async (phone: string): Promise<ApiResponse<{ reservations: Reservation[] }>> => {
    const response = await apiClient.get(`/reservations/my?phone=${encodeURIComponent(phone)}`);
    return response.data;
  },

  create: async (data: CreateReservationRequest): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post('/reservations', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Reservation>): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.patch(`/reservations/${id}`, data);
    return response.data;
  },

  cancel: async (id: number): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/cancel`);
    return response.data;
  },

  cancelByPhone: async (id: number, phone: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/cancel/public`, { phone });
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/reservations/${id}`);
    return response.data;
  },
};

// Chat API
export const chatApi = {
  // Table chat
  getTableSessions: async (tableId: number): Promise<ApiResponse<{ sessions: ChatSession[] }>> => {
    const response = await apiClient.get(`/chat/table/session/${tableId}`);
    return response.data;
  },

  getTableSessionMessages: async (sessionId: number): Promise<ApiResponse<{ messages: ChatMessage[] }>> => {
    const response = await apiClient.get(`/chat/table/session/${sessionId}/messages`);
    return response.data;
  },

  sendTableMessage: async (sessionId: number, content: string): Promise<ApiResponse<ChatMessage>> => {
    const response = await apiClient.post('/chat/table/message/send', { sessionId, content });
    return response.data;
  },

  closeTableSession: async (sessionId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/chat/table/session/close/${sessionId}`);
    return response.data;
  },

  // Restaurant chat
  getRestaurantSessions: async (restaurantId: number): Promise<ApiResponse<{ sessions: ChatSession[] }>> => {
    const response = await apiClient.get(`/chat/restaurant/sessions/${restaurantId}`);
    return response.data;
  },

  getRestaurantSessionMessages: async (sessionId: number): Promise<ApiResponse<{ messages: ChatMessage[] }>> => {
    const response = await apiClient.get(`/chat/restaurant/session/${sessionId}/messages`);
    return response.data;
  },

  sendRestaurantMessage: async (sessionId: number, content: string): Promise<ApiResponse<ChatMessage>> => {
    const response = await apiClient.post('/chat/restaurant/message/send', { sessionId, content });
    return response.data;
  },

  closeRestaurantSession: async (sessionId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/chat/restaurant/session/close/${sessionId}`);
    return response.data;
  },
};

// Question API
export const questionApi = {
  getAll: async (): Promise<ApiResponse<{ questions: Question[] }>> => {
    const response = await apiClient.get('/questions');
    return response.data;
  },

  getByLanguage: async (code: string): Promise<ApiResponse<{ questions: Question[] }>> => {
    const response = await apiClient.get(`/questions/language/${code}`);
    return response.data;
  },

  create: async (data: CreateQuestionRequest): Promise<ApiResponse<Question>> => {
    const response = await apiClient.post('/questions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateQuestionRequest>): Promise<ApiResponse<Question>> => {
    const response = await apiClient.put(`/questions/${id}`, data);
    return response.data;
  },

  reorder: async (data: ReorderQuestionsRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.put('/questions/reorder', data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/questions/${id}`);
    return response.data;
  },
};

// QR Code API - using local API routes as proxy to avoid CORS
export const qrCodeApi = {
  getRestaurantQR: async (restaurantId: number): Promise<Blob> => {
    const response = await fetch(`/api/qrcode/restaurant/${restaurantId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch QR code: ${response.status}`);
    }
    return response.blob();
  },

  downloadRestaurantQR: async (restaurantId: number): Promise<Blob> => {
    const response = await fetch(`/api/qrcode/restaurant/${restaurantId}/download`);
    if (!response.ok) {
      throw new Error(`Failed to download QR code: ${response.status}`);
    }
    return response.blob();
  },

  getTableQR: async (restaurantId: number, tableId: number): Promise<Blob> => {
    const response = await fetch(`/api/qrcode/restaurant/${restaurantId}/table/${tableId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch QR code: ${response.status}`);
    }
    return response.blob();
  },

  downloadTableQR: async (restaurantId: number, tableId: number): Promise<Blob> => {
    const response = await fetch(`/api/qrcode/restaurant/${restaurantId}/table/${tableId}/download`);
    if (!response.ok) {
      throw new Error(`Failed to download QR code: ${response.status}`);
    }
    return response.blob();
  },
};

// Subscription API
export const subscriptionApi = {
  getAll: async (): Promise<ApiResponse<{ subscriptions: Subscription[] }>> => {
    const response = await apiClient.get('/subscriptions');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.get(`/subscriptions/${id}`);
    return response.data;
  },

  getByOrganization: async (orgId: number): Promise<ApiResponse<Subscription[]>> => {
    const response = await apiClient.get(`/subscriptions/organization/${orgId}`);
    return response.data;
  },

  getActive: async (orgId: number): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.get(`/subscriptions/organization/${orgId}/active`);
    return response.data;
  },

  create: async (data: { organizationId: number; period: number; startDate: string }): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.post('/subscriptions', data);
    return response.data;
  },

  update: async (id: number, data: { period: number; startDate: string; isActive?: boolean }): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.put(`/subscriptions/${id}`, data);
    return response.data;
  },

  extend: async (subscriptionId: number, period: number): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.post(`/subscriptions/${subscriptionId}/extend`, { period });
    return response.data;
  },

  deactivate: async (subscriptionId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/subscriptions/${subscriptionId}/deactivate`);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/subscriptions/${id}`);
    return response.data;
  },
};

// Extension Request API
export const extensionRequestApi = {
  getAll: async (): Promise<ApiResponse<{ requests: ExtensionRequest[] }>> => {
    const response = await apiClient.get('/subscriptions/extension-requests');
    return response.data;
  },

  getMy: async (): Promise<ApiResponse<{ requests: ExtensionRequest[] }>> => {
    const response = await apiClient.get('/subscriptions/extension-requests/my');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<ExtensionRequest>> => {
    const response = await apiClient.get(`/subscriptions/extension-requests/${id}`);
    return response.data;
  },

  getByStatus: async (status: string): Promise<ApiResponse<{ requests: ExtensionRequest[] }>> => {
    const response = await apiClient.get(`/subscriptions/extension-requests/status/${status}`);
    return response.data;
  },

  create: async (data: CreateExtensionRequestRequest): Promise<ApiResponse<ExtensionRequest>> => {
    const response = await apiClient.post('/subscriptions/extension-requests', data);
    return response.data;
  },

  updateStatus: async (id: number, status: string, adminComment?: string): Promise<ApiResponse<ExtensionRequest>> => {
    const response = await apiClient.patch(`/subscriptions/extension-requests/${id}/status`, { status, adminComment });
    return response.data;
  },
};

// File Upload API
export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getUsers: async (page = 1, pageSize = 20): Promise<ApiResponse<{ users: User[]; totalCount: number; page: number; pageSize: number }>> => {
    const response = await apiClient.get(`/admin/users?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: number, isActive: boolean): Promise<ApiResponse<void>> => {
    const response = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  updateUserRole: async (id: number, role: 'user' | 'admin'): Promise<ApiResponse<void>> => {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  getOrganizations: async (page = 1, pageSize = 20): Promise<ApiResponse<{ organizations: Organization[]; totalCount: number; page: number; pageSize: number }>> => {
    const response = await apiClient.get(`/admin/organizations?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  getOrganizationById: async (id: number): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.get(`/admin/organizations/${id}`);
    return response.data;
  },

  deleteOrganization: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/admin/organizations/${id}`);
    return response.data;
  },

  getDishes: async (page = 1, pageSize = 20): Promise<ApiResponse<{ dishes: Dish[]; totalCount: number; page: number; pageSize: number }>> => {
    const response = await apiClient.get(`/admin/dishes?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  deleteDish: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/admin/dishes/${id}`);
    return response.data;
  },

  getLogs: async (page = 1, pageSize = 20): Promise<ApiResponse<{ logs: AdminLog[]; totalCount: number; page: number; pageSize: number }>> => {
    const response = await apiClient.get(`/admin/logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  getMyLogs: async (page = 1, pageSize = 20): Promise<ApiResponse<{ logs: AdminLog[]; totalCount: number; page: number; pageSize: number }>> => {
    const response = await apiClient.get(`/admin/logs/me?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Admin Support methods
  getSupportTickets: async (page = 1, pageSize = 10, status?: 'in_progress' | 'completed'): Promise<ApiResponse<{ tickets: SupportTicket[]; total_count: number; page: number; page_size: number }>> => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (status) params.append('status', status);
    const response = await apiClient.get(`/admin/support?${params}`);
    return response.data;
  },

  updateSupportTicketStatus: async (id: number, status: 'in_progress' | 'completed'): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.patch(`/admin/support/${id}/status`, { status });
    return response.data;
  },
};

// Support API
export const supportApi = {
  create: async (data: CreateSupportTicketRequest): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.post('/support', data);
    return response.data;
  },

  getMy: async (page = 1, pageSize = 10): Promise<ApiResponse<{ tickets: SupportTicket[]; total_count: number; page: number; page_size: number }>> => {
    const response = await apiClient.get(`/support/my?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.get(`/support/${id}`);
    return response.data;
  },
};
