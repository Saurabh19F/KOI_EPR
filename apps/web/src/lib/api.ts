import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry auth endpoints to prevent infinite loops
    if (originalRequest?.url?.includes('/auth/') || originalRequest?.url?.includes('/auth-v2/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window !== 'undefined') {
          const refreshToken = sessionStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/auth-v2/refresh`, {
              refreshToken,
            });

            // Refresh returns only accessToken, keep existing refreshToken
            const { accessToken } = response.data;
            sessionStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Clear tokens on refresh failure
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  twoFactorRequired?: boolean;
  challengeToken?: string;
  userId?: string;
  user?: {
    userId: string;
    email: string;
    name: string;
    companyId?: string;
    isSuperAdmin?: boolean;
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
}

export interface UserProfile {
  userId: string;
  userCode?: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  departmentId?: string;
  departmentName?: string;
  companyId?: string;
  role: string;
  roles?: Array<{ roleId: string; roleName: string; roleCode: string }>;
  permissions?: string[];
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth-v2/login', data),
  register: (data: any) => api.post('/auth-v2/register', data),
  refresh: (refreshToken: string) => api.post('/auth-v2/refresh', { refreshToken }),
  me: () => api.get('/auth-v2/me'),
  getProfile: () => api.get('/auth-v2/me'),
  updateProfile: (id: string, data: { name?: string; phone?: string; preferences?: Record<string, any>; avatar?: string }) => api.patch(`/users/${id}`, data),
  changePassword: (data: any) => api.post('/auth-v2/change-password', data),
  setup2FA: (method?: string) => api.post('/auth-v2/two-factor/setup', { method }),
  verify2FASetup: (code: string) => api.post('/auth-v2/two-factor/verify-setup', { code }),
  disable2FA: (data: { password?: string; code?: string }) => api.post('/auth-v2/two-factor/disable', data),
  get2FAStatus: () => api.get('/auth-v2/two-factor/status'),
  getSessions: () => api.get('/auth-v2/sessions'),
  revokeSession: (sessionId: string) => api.post('/auth-v2/sessions/revoke', { sessionId }),
  revokeOtherSessions: (currentSessionId: string) => api.post('/auth-v2/sessions/revoke-all', { currentSessionId }),
  getApiKeys: () => api.get('/auth-v2/api-keys'),
  createApiKey: (data: { name: string; scopes?: string[]; expiresInDays?: number }) => api.post('/auth-v2/api-keys', data),
  revokeApiKey: (id: string) => api.delete(`/auth-v2/api-keys/${id}`),
  getLoginActivity: (params?: { page?: number; limit?: number }) => api.get('/auth-v2/login-activity', { params }),
  getSecurityAuditLog: (params?: { page?: number; limit?: number; eventType?: string }) => api.get('/auth-v2/security-audit', { params }),
  logout: () => api.post('/auth-v2/logout'),
  seedUsers: () => api.post<{ message: string; users: any[] }>('/auth-v2/seed'),
};

// Users API
export const usersApi = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; departmentId?: string; isActive?: boolean }) =>
    api.get<PaginatedResponse<UserProfile>>('/users', { params }),
  getUser: (id: string) => api.get<UserProfile>(`/users/${id}`),
  createUser: (data: any) => api.post<UserProfile>('/users', data),
  updateUser: (id: string, data: any) => api.patch<UserProfile>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete<{ success: boolean }>(`/users/${id}`),
  changePassword: (id: string, data: any) => api.patch(`/users/${id}/change-password`, data),
  assignRoles: (id: string, roleIds: string[]) => api.patch(`/users/${id}/assign-roles`, { roleIds }),
  getRoles: (params?: { departmentId?: string }) => api.get<any[]>('/users/roles', { params }),
  getDepartments: () => api.get<any[]>('/users/departments'),
};

// Masters API
export const mastersApi = {
  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    segmentId?: string;
    source?: string;
    productStatus?: string;
  }) => api.get<PaginatedResponse<any>>('/masters/products', { params }),
  getProduct: (id: string) => api.get(`/masters/products/${id}`),
  createProduct: (data: any) => api.post('/masters/products', data),
  updateProduct: (id: string, data: any) => api.patch(`/masters/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/masters/products/${id}`),
  generateSku: (data: any) =>
    api.post<{ sku: string }>('/masters/products/generate-sku', data),
  getPendingMisReviewProducts: () => api.get('/masters/products/pending-mis-review'),
  misReviewProduct: (id: string, body: any) => api.patch(`/masters/products/${id}/mis-review`, body),
  reviewProduct: (id: string, body: any) => api.patch(`/masters/products/${id}/review`, body),


  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/masters/customers', { params }),
  getCustomer: (id: string) => api.get(`/masters/customers/${id}`),
  createCustomer: (data: any) => api.post('/masters/customers', data),
  updateCustomer: (id: string, data: any) => api.patch(`/masters/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/masters/customers/${id}`),
  generateBuyerCode: () => api.get<{ buyerCode: string }>('/masters/customers/generate-code'),

  // Vendors
  getVendors: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/masters/vendors', { params }),




  // Reference Data
  getCategories: () => api.get('/masters/categories'),
  createCategory: (data: any) => api.post('/masters/categories', data),
  getSegments: () => api.get('/masters/segments'),
  getGroups: () => api.get('/masters/groups'),
  getBrands: () => api.get('/masters/brands'),
  createBrand: (data: any) => api.post('/masters/brands', data),
  getUoms: () => api.get('/masters/uoms'),
  getGstRates: () => api.get('/masters/gst-rates'),
  createGstRate: (data: any) => api.post('/masters/gst-rates', data),
  getCountries: () => api.get('/masters/countries'),
  createCountry: (data: any) => api.post('/masters/countries', data),
  getCurrencies: () => api.get('/masters/currencies'),
  createCurrency: (data: any) => api.post('/masters/currencies', data),
  getPaymentTerms: () => api.get('/masters/payment-terms'),
  createPaymentTerms: (data: any) => api.post('/masters/payment-terms', data),
  getPacking: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/masters/packing', { params }),
  getPorts: () => api.get('/masters/ports'),
  createPort: (data: any) => api.post('/masters/ports', data),
  getZones: () => api.get('/masters/zones'),
  createZone: (data: any) => api.post('/masters/zones', data),
  getLocations: () => api.get('/masters/locations'),
  createLocation: (data: any) => api.post('/masters/locations', data),

  // Margin Rules
  getMarginRules: () => api.get('/masters/margin-rules'),
  createMarginRule: (data: any) => api.post('/masters/margin-rules', data),
  updateMarginRule: (id: string, data: any) => api.patch(`/masters/margin-rules/${id}`, data),
  deleteMarginRule: (id: string) => api.delete(`/masters/margin-rules/${id}`),

  // Roles & Permissions
  getRoles: () => api.get('/users/roles'),
  getRole: (id: string) => api.get(`/users/roles/${id}`),
  createRole: (data: any) => api.post('/users/roles', data),
  updateRole: (id: string, data: any) => api.patch(`/users/roles/${id}`, data),
  assignRolePermissions: (id: string, permissionIds: string[]) =>
    api.patch(`/users/roles/${id}/permissions`, { permissionIds }),
  getPermissions: () => api.get('/users/roles/permissions'),
};

// Sales Enquiries API
export const salesApi = {
  // Enquiries CRUD
  getEnquiries: (params?: { page?: number; limit?: number; status?: string; search?: string; createdBy?: string; unassigned?: boolean }) =>
    api.get<PaginatedResponse<any>>('/sales-enquiries', { params }),
  getEnquiry: (id: string) => api.get(`/sales-enquiries/${id}`),
  getEnquiryByNumber: (enquiryNumber: string) => api.get(`/sales-enquiries/number/${enquiryNumber}`),
  createEnquiry: (data: any) => api.post('/sales-enquiries', data),
  updateEnquiry: (id: string, data: any) => api.patch(`/sales-enquiries/${id}`, data),
  updateEnquiryStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status, remarks }),
  getStatusTransitions: (id: string) => api.get(`/sales-enquiries/${id}/status-transitions`),
  deleteEnquiry: (id: string) => api.delete(`/sales-enquiries/${id}`),
  getEnquiryStats: () => api.get('/sales-enquiries/stats'),
  getPurchaseUsers: () => api.get<{ userId: string; name: string }[]>('/sales-enquiries/lookup/purchase-users'),
  misReview: (id: string, action: 'approve' | 'requote', remarks: string, requoteItemIds?: string[]) =>
    api.post(`/sales-enquiries/${id}/mis-review`, { action, remarks, requoteItemIds }),

  // Enquiry Items
  getEnquiryItems: (id: string) => api.get(`/sales-enquiries/${id}/items`),
  addEnquiryItem: (id: string, data: any) => api.post(`/sales-enquiries/${id}/items`, data),
  updateEnquiryItem: (itemId: string, data: any) => api.patch(`/sales-enquiries/items/${itemId}`, data),
  deleteEnquiryItem: (itemId: string) => api.delete(`/sales-enquiries/items/${itemId}`),

  // Documents
  getEnquiryDocuments: (id: string) => api.get(`/sales-enquiries/${id}/documents`),
  uploadEnquiryDocument: (id: string, data: any) => api.post(`/sales-enquiries/${id}/documents`, data),
  deleteEnquiryDocument: (docId: string) => api.delete(`/sales-enquiries/documents/${docId}`),

  // Punching Logs (status change history)
  getEnquiryPunchingLogs: (id: string) => api.get(`/sales-enquiries/${id}/punching-logs`),

  // Reminders
  getEnquiryReminders: (id: string) => api.get(`/sales-enquiries/${id}/reminders`),
  addEnquiryReminder: (id: string, data: any) => api.post(`/sales-enquiries/${id}/reminders`, data),
  getPendingReminders: () => api.get('/sales-enquiries/reminders/pending'),
  markReminderSent: (reminderId: string) => api.patch(`/sales-enquiries/reminders/${reminderId}/sent`, {}),

  // Convenience status shortcuts - all use the single PATCH /status endpoint
  submitEnquiry: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'submitted', remarks }),
  punchEnquiry: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'punched', remarks }),
  verifyEnquiry: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'verified', remarks }),
  sendToPurchase: (id: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'purchase_pending' }),
  approveEnquiry: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'approval_pending', remarks }),
  markWon: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'won', remarks }),
  markLost: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'lost', remarks }),
  cancelEnquiry: (id: string, remarks?: string) =>
    api.patch(`/sales-enquiries/${id}/status`, { status: 'cancelled', remarks }),
  convertToSalesOrder: (id: string) => api.post(`/sales-enquiries/${id}/convert-to-sales-order`, {}),
};

// Sales Order to Dispatch API
export const salesOrderApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<PaginatedResponse<any>>('/sales-orders', { params }),
  getOrder: (id: string) => api.get(`/sales-orders/${id}`),
  getOrderByNumber: (orderNumber: string) => api.get(`/sales-orders/number/${orderNumber}`),
  createOrder: (data: any) => api.post('/sales-orders', data),
  updateOrder: (id: string, data: any) => api.patch(`/sales-orders/${id}`, data),
  confirmOrder: (id: string) => api.patch(`/sales-orders/${id}/confirm`, {}),
  cancelOrder: (id: string) => api.patch(`/sales-orders/${id}/cancel`, {}),
  repunchOrder: (id: string, data: any) => api.patch(`/sales-orders/${id}/repunch`, data),
  sendQuotationEmail: (id: string, reQuotation?: boolean) =>
    api.post(`/sales-orders/${id}/send-email`, {}, { params: { reQuotation: reQuotation ? 'true' : undefined } }),
  exportExcel: (id: string) =>
    api.get(`/sales-orders/${id}/export-excel`, { responseType: 'blob' }),
  getStats: () => api.get('/sales-orders/stats'),
  downloadQuotationPdf: (id: string, options?: { showGst?: boolean; showDiscount?: boolean }) =>
    api.get(`/sales-orders/${id}/quotation-pdf`, {
      params: {
        showGst: options?.showGst !== false ? undefined : 'false',
        showDiscount: options?.showDiscount !== false ? undefined : 'false',
      },
      responseType: 'blob',
    }),
  downloadSheetExcel: (id: string, withRate = true) =>
    api.get(`/sales-orders/${id}/sheet-excel`, {
      params: { withRate: withRate ? undefined : 'false' },
      responseType: 'blob',
    }),

  getDeliveryNotes: (params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/sales-orders/delivery-notes', { params }),
  getDeliveryNote: (id: string) => api.get(`/sales-orders/delivery-notes/${id}`),
  createDeliveryNote: (data: any) => api.post('/sales-orders/delivery-notes', data),

  getInvoices: (params?: { page?: number; limit?: number; status?: string; search?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/sales-orders/invoices', { params }),
  getInvoice: (id: string) => api.get(`/sales-orders/invoices/${id}`),
  createInvoice: (data: any) => api.post('/sales-orders/invoices', data),
  downloadInvoicePdf: (id: string) => api.get(`/sales-orders/invoices/${id}/pdf`, { responseType: 'blob' }),
  createCreditNote: (data: any) => api.post('/sales-orders/credit-notes', data),
  generatePOs: (id: string) => api.post(`/sales-orders/${id}/generate-pos`, {}),
};

// FMS (Workflow) API
export const fmsApi = {
  // Workflow Definitions
  getWorkflows: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<any>>('/fms/workflows', { params }),
  getWorkflow: (id: string) => api.get(`/fms/workflows/${id}`),
  createWorkflow: (data: any) => api.post('/fms/workflows', data),
  updateWorkflow: (id: string, data: any) => api.patch(`/fms/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/fms/workflows/${id}`),

  // Workflow Instances
  getInstances: (params?: { page?: number; limit?: number; workflowId?: string; status?: string }) =>
    api.get<PaginatedResponse<any>>('/fms/instances', { params }),
  getInstance: (id: string) => api.get(`/fms/instances/${id}`),
  startWorkflow: (workflowId: string, entityType: string, entityId: string) =>
    api.post('/fms/instances', { workflowId, entityType, entityId }),
  takeAction: (instanceId: string, action: string, remarks?: string) =>
    api.post(`/fms/instances/${instanceId}/action`, { action, remarks }),

  // Tasks (Pending Approvals)
  getTasks: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<any>>('/fms/tasks', { params }),
  getMyTasks: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<any>>('/fms/tasks/my', { params }),
  getDelayedTasks: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<any>>('/fms/tasks/delayed', { params }),

  // Dashboard Stats
  getDashboardStats: () => api.get('/fms/dashboard/stats'),

  // Complete Task
  completeTask: (id: string, data?: any) => api.post(`/fms/tasks/${id}/complete`, data),

  // Escalate Task
  escalateTask: (id: string, reason: string) => api.post(`/fms/tasks/${id}/escalate`, { reason }),

  // Approval Chains
  getApprovalChains: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<any>>('/fms/approval-chains', { params }),
  getApprovalChain: (id: string) => api.get(`/fms/approval-chains/${id}`),
  createApprovalChain: (data: any) => api.post('/fms/approval-chains', data),
  updateApprovalChain: (id: string, data: any) => api.patch(`/fms/approval-chains/${id}`, data),
  deleteApprovalChain: (id: string) => api.delete(`/fms/approval-chains/${id}`),

  // Quality FMS
  getQualityTasks: (params?: { page?: number; limit?: number; status?: string; inspectorId?: string }) =>
    api.get<PaginatedResponse<any>>('/fms/quality', { params }),
  getQualityTask: (id: string) => api.get(`/fms/quality/${id}`),
  createQualityTask: (data: any) => api.post('/fms/quality', data),
  updateQualityTask: (id: string, data: any) => api.patch(`/fms/quality/${id}`, data),
  updateQualityStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/fms/quality/${id}/status`, { status, remarks }),

  // PO Tracking
  getPoTracking: (params?: { page?: number; limit?: number; status?: string; vendorId?: string }) =>
    api.get<PaginatedResponse<any>>('/fms/po-tracking', { params }),
  getPoTrackingEntry: (id: string) => api.get(`/fms/po-tracking/${id}`),
  createPoTracking: (data: any) => api.post('/fms/po-tracking', data),
  updatePoTracking: (id: string, data: any) => api.patch(`/fms/po-tracking/${id}`, data),
  updatePoTrackingStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/fms/po-tracking/${id}/status`, { status, remarks }),
};

// Purchase Quotes API
export const purchaseApi = {
  // Quotes
  getQuotes: (params?: { page?: number; limit?: number; status?: string; search?: string; enquiryOrderId?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase/quotes', { params }),
  getQuote: (id: string) => api.get(`/purchase/quotes/${id}`),
  getQuoteByNumber: (quoteNo: string) => api.get(`/purchase/quotes/number/${quoteNo}`),
  createQuote: (data: any) => api.post('/purchase/quotes', data),
  createQuoteFromEnquiry: (enquiryId: string, data: any) => api.post(`/purchase/quotes/from-enquiry/${enquiryId}`, data),
  updateQuote: (id: string, data: any) => api.patch(`/purchase/quotes/${id}`, data),
  updateQuoteStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/purchase/quotes/${id}/status`, { status, remarks }),
  deleteQuote: (id: string) => api.delete(`/purchase/quotes/${id}`),

  // Quote Items
  addQuoteItems: (quoteId: string, items: any[]) => api.post(`/purchase/quotes/${quoteId}/items`, items),
  updateQuoteItem: (itemId: string, data: any) => api.patch(`/purchase/items/${itemId}`, data),
  deleteQuoteItem: (itemId: string) => api.delete(`/purchase/items/${itemId}`),

  // Status Actions
  submitQuote: (id: string) => api.post(`/purchase/quotes/${id}/submit`),
  approveQuote: (id: string, remarks?: string) => api.post(`/purchase/quotes/${id}/approve`, { remarks }),

  // Convert to PO
  convertToPO: (id: string, data: {
    vendorId: string;
    vendorName: string;
    vendorCode?: string;
    vendorGstin?: string;
    billingAddress?: string;
    shippingAddress?: string;
    expectedDeliveryDate?: string;
    notes?: string;
  }) => api.post(`/purchase/quotes/${id}/convert-to-po`, data),
};

// Purchase Indent Dashboard API
export const purchaseIndentApi = {
  getDashboard: (params?: { page?: number; limit?: number; search?: string; salesPersonName?: string; status?: string; fromDate?: string; toDate?: string }) =>
    api.get('/purchase/indent/dashboard', { params }),
  getReport: (params?: { page?: number; limit?: number; search?: string; salesPersonName?: string; assignedTo?: string; status?: string; fromDate?: string; toDate?: string }) =>
    api.get('/purchase/indent/report', { params }),
  getPendancy: () => api.get('/purchase/indent/pendancy'),
  getStats: () => api.get('/purchase/indent/stats'),
  getItemsByOrder: (orderNo: string) => api.get(`/purchase/indent/items/order/${orderNo}`),
  getItemsByAssignee: (assignedTo: string) => api.get(`/purchase/indent/items/assignee/${assignedTo}`),
  createItem: (data: any) => api.post('/purchase/indent/items', data),
  bulkCreate: (data: { enquiryOrderId: string; plannedDate?: string; items: any[] }) =>
    api.post('/purchase/indent/bulk-create', data),
  updateItem: (id: string, data: any) => api.patch(`/purchase/indent/items/${id}`, data),
  markRaised: (id: string, data: { purchaseQuoteId: string; purchaseQuoteNo?: string; remarks?: string }) =>
    api.post(`/purchase/indent/mark-raised/${id}`, data),
  syncFromEnquiry: (enquiryOrderId: string) => api.post(`/purchase/indent/sync/${enquiryOrderId}`),
  assignItems: (data: { itemIds: string[]; assignedTo: string; assignedToName: string }) =>
    api.post('/purchase/indent/assign', data),
};

// Purchase Order to GRN/Invoice API
export const purchaseOrderApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string; myOrders?: boolean; purchasePersonId?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders', { params }),
  getOrder: (id: string) => api.get(`/purchase-orders/${id}`),
  getOrdersByVendor: (vendorId: string) => api.get(`/purchase-orders/by-vendor/${vendorId}`),
  createOrder: (data: any) => api.post('/purchase-orders', data),
  updateOrder: (id: string, data: any) => api.patch(`/purchase-orders/${id}`, data),
  approveOrder: (id: string) => api.patch(`/purchase-orders/${id}/approve`, {}),
  cancelOrder: (id: string) => api.patch(`/purchase-orders/${id}/cancel`, {}),
  getStats: () => api.get('/purchase-orders/stats'),
  downloadPdf: (id: string) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' }),

  getGrns: (params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/grns', { params }),
  getGrn: (id: string) => api.get(`/purchase-orders/grns/${id}`),
  createGrn: (data: any) => api.post('/purchase-orders/grns', data),

  getInvoices: (params?: { page?: number; limit?: number; status?: string; search?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/invoices', { params }),
  getInvoice: (id: string) => api.get(`/purchase-orders/invoices/${id}`),
  createInvoice: (data: any) => api.post('/purchase-orders/invoices', data),
  createDebitNote: (data: any) => api.post('/purchase-orders/debit-notes', data),

  // Vendor Master
  getVendors: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/vendors', { params }),
  getVendor: (id: string) => api.get(`/purchase-orders/vendors/${id}`),
  createVendor: (data: any) => api.post('/purchase-orders/vendors', data),
  updateVendor: (id: string, data: any) => api.patch(`/purchase-orders/vendors/${id}`, data),
  deleteVendor: (id: string) => api.delete(`/purchase-orders/vendors/${id}`),

  // PO Approval
  submitForApproval: (data: { orderId: string; remarks?: string }) =>
    api.post('/purchase-orders/approvals/submit', data),
  getApprovals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/approvals', { params }),
  approveApproval: (id: string, data?: { remarks?: string }) =>
    api.patch(`/purchase-orders/approvals/${id}/approve`, data || {}),
  rejectApproval: (id: string, data: { rejectionReason: string }) =>
    api.patch(`/purchase-orders/approvals/${id}/reject`, data),

  // Order Sheet / Tracking
  getOrderSheet: (params?: { page?: number; limit?: number; search?: string; purchasePerson?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/order-sheet', { params }),
  getTrackingFMS: () => api.get('/purchase-orders/tracking-fms'),
  getDatabaseView: (params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/database', { params }),

  // Accountant Review
  getAccountantReview: (params?: { page?: number; limit?: number; search?: string; activityStatus?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase-orders/accountant-review', { params }),
  updateActivity1: (id: string, data: any) =>
    api.patch(`/purchase-orders/accountant-review/${id}/activity1`, data),
  updateActivity2: (id: string, data: any) =>
    api.patch(`/purchase-orders/accountant-review/${id}/activity2`, data),
};

// Labels API
export const labelsApi = {
  getLabels: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<any>>('/purchase/labels', { params }),
  getLabel: (id: string) => api.get(`/purchase/labels/${id}`),
  createLabel: (data: any) => api.post('/purchase/labels', data),
  updateLabel: (id: string, data: any) => api.patch(`/purchase/labels/${id}`, data),
  deleteLabel: (id: string) => api.delete(`/purchase/labels/${id}`),
  assignDesigner: (id: string, designerId: string, designerName: string) =>
    api.post(`/purchase/labels/${id}/assign-designer`, { designerId, designerName }),
  completeLabel: (id: string, data: any) => api.post(`/purchase/labels/${id}/complete`, data),
};

// Rate / Price Analysis API
export const rateApi = {
  // Analysis
  getAnalysis: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<PaginatedResponse<any>>('/rate/analysis', { params }),
  getAnalysisById: (id: string) => api.get(`/rate/analysis/${id}`),
  getAnalysisByNumber: (analysisNo: string) => api.get(`/rate/analysis/number/${analysisNo}`),
  createAnalysis: (data: any) => api.post('/rate/analysis', data),
  createAnalysisFromQuote: (quoteId: string, data: any) => api.post(`/rate/analysis/from-quote/${quoteId}`, data),
  updateAnalysis: (id: string, data: any) => api.patch(`/rate/analysis/${id}`, data),
  updateAnalysisStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/rate/analysis/${id}/status`, { status, remarks }),
  deleteAnalysis: (id: string) => api.delete(`/rate/analysis/${id}`),

  // Analysis Items
  addAnalysisItems: (analysisId: string, items: any[]) => api.post(`/rate/analysis/${analysisId}/items`, items),
  updateAnalysisItem: (itemId: string, data: any) => api.patch(`/rate/items/${itemId}`, data),
  deleteAnalysisItem: (itemId: string) => api.delete(`/rate/items/${itemId}`),

  // Status Actions
  calculateAnalysis: (id: string) => api.post(`/rate/analysis/${id}/calculate`),
  submitAnalysis: (id: string) => api.post(`/rate/analysis/${id}/submit`),
  approveAnalysis: (id: string, remarks?: string) => api.post(`/rate/analysis/${id}/approve`, { remarks }),
  rejectAnalysis: (id: string, remarks?: string) => api.post(`/rate/analysis/${id}/reject`, { remarks }),
  lockAnalysis: (id: string) => api.post(`/rate/analysis/${id}/lock`),

  // Currency Rates
  getCurrencyRates: () => api.get('/rate/currency'),
  getCurrencyRate: (currencyId: string) => api.get(`/rate/currency/${currencyId}`),
  createCurrencyRate: (data: any) => api.post('/rate/currency', data),
  updateCurrencyRate: (id: string, data: any) => api.patch(`/rate/currency/${id}`, data),
  deleteCurrencyRate: (id: string) => api.delete(`/rate/currency/${id}`),

  // Haulage Rates
  getHaulageRates: () => api.get('/rate/haulage'),
  createHaulageRate: (data: any) => api.post('/rate/haulage', data),
  updateHaulageRate: (id: string, data: any) => api.patch(`/rate/haulage/${id}`, data),
  deleteHaulageRate: (id: string) => api.delete(`/rate/haulage/${id}`),

  // Final Currency Rates
  getFinalCurrencyRates: () => api.get('/rate/final-currency-rates'),
  updateFinalCurrencyRate: (id: string, marginBuffer: number) =>
    api.patch(`/rate/final-currency-rates/${id}`, { marginBuffer }),

  // Version History
  getVersionHistory: (analysisId: string) => api.get(`/rate/analysis/${analysisId}/versions`),
  createRequote: (analysisId: string, data: { reason: string; remarks?: string }) =>
    api.post(`/rate/analysis/${analysisId}/requote`, data),
  getVersionById: (versionId: string) => api.get(`/rate/versions/${versionId}`),

  // Previous Year Comparison
  getPreviousYearComparison: (analysisId: string) =>
    api.get(`/rate/analysis/${analysisId}/previous-year`),

  // Audit Logs
  getAuditLogs: (params?: { page?: number; limit?: number; entityType?: string; entityId?: string }) =>
    api.get('/rate/audit-logs', { params }),

  // Formula Master
  getFormulas: (type?: string) => api.get('/rate/formulas', { params: { type } }),
  createFormula: (data: any) => api.post('/rate/formulas', data),
  updateFormula: (id: string, data: any) => api.patch(`/rate/formulas/${id}`, data),

  // Bulk Operations
  bulkCalculate: (analysisIds: string[]) => api.post('/rate/analysis/bulk-calculate', { analysisIds }),

  // Alias methods for compatibility
  saveCurrencyRate: (data: any) => data.id ? api.patch(`/rate/currency/${data.id}`, data) : api.post('/rate/currency', data),
  saveHaulageRate: (data: any) => data.id ? api.patch(`/rate/haulage/${data.id}`, data) : api.post('/rate/haulage', data),
};

// Reports API
export const reportsApi = {
  getDashboardStats: (companyId?: string, days?: number) => api.get('/reports/dashboard', { params: { companyId, days } }),
  getSalesReport: (params?: any) => api.get('/reports/sales', { params }),
  getPurchaseReport: (params?: any) => api.get('/reports/purchase', { params }),
  getPriceAnalysisReport: (params?: any) => api.get('/reports/rate-analysis', { params }),
  getPartyComparisonReport: (params?: any) => api.get('/reports/party-comparison', { params }),
  getSalesSummary: (params?: any) => api.get('/reports/sales/summary', { params }),
  getPurchaseSummary: (params?: any) => api.get('/reports/purchase/summary', { params }),
  getRateAnalysisSummary: (params?: any) => api.get('/reports/rate-analysis/summary', { params }),
  getFmsSummary: () => api.get('/reports/fms/summary'),
  getProductReport: (params?: any) => api.get('/reports/products', { params }),
  getLowStockProducts: () => api.get('/reports/products/low-stock'),
  exportToExcel: (type: string, params?: any) =>
    api.get(`/reports/export/excel/${type}`, { params, responseType: 'blob' }),
  exportToPdf: (type: string, params?: any) =>
    api.get(`/reports/export/pdf/${type}`, { params, responseType: 'blob' }),
};

// Admin API (Number Series, Email Templates, Departments)
export const adminApi = {
  // Number Series
  getNumberSeries: () => api.get('/admin/number-series'),
  getNumberSeriesById: (id: string) => api.get(`/admin/number-series/${id}`),
  createNumberSeries: (data: any) => api.post('/admin/number-series', data),
  updateNumberSeries: (id: string, data: any) => api.patch(`/admin/number-series/${id}`, data),
  deleteNumberSeries: (id: string) => api.delete(`/admin/number-series/${id}`),
  resetNumberSeries: (id: string) => api.post(`/admin/number-series/${id}/reset`),
  getNextNumber: (module: string) => api.get(`/admin/number-series/next/${module}`),

  // Email Templates
  getEmailTemplates: () => api.get('/admin/email-templates'),
  getEmailTemplate: (id: string) => api.get(`/admin/email-templates/${id}`),
  createEmailTemplate: (data: any) => api.post('/admin/email-templates', data),
  updateEmailTemplate: (id: string, data: any) => api.patch(`/admin/email-templates/${id}`, data),
  deleteEmailTemplate: (id: string) => api.delete(`/admin/email-templates/${id}`),
  sendTestEmail: (templateId: string, email: string) =>
    api.post(`/admin/email-templates/${templateId}/test`, { email }),

  // Departments
  getDepartments: () => api.get('/admin/departments'),
  getDepartment: (id: string) => api.get(`/admin/departments/${id}`),
  createDepartment: (data: any) => api.post('/admin/departments', data),
  updateDepartment: (id: string, data: any) => api.patch(`/admin/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/admin/departments/${id}`),
  getDepartmentUsers: (id: string) => api.get(`/admin/departments/${id}/users`),
};

// Inventory API
export const inventoryApi = {
  // Warehouses
  getWarehouses: () => api.get('/inventory/warehouses'),
  getWarehouse: (id: string) => api.get(`/inventory/warehouses/${id}`),
  createWarehouse: (data: any) => api.post('/inventory/warehouses', data),
  updateWarehouse: (id: string, data: any) => api.patch(`/inventory/warehouses/${id}`, data),
  deleteWarehouse: (id: string) => api.delete(`/inventory/warehouses/${id}`),

  // Stock
  getStock: (params?: any) => api.get('/inventory/stock', { params }),
  getStockSummary: (warehouseId?: string) => api.get('/inventory/stock/summary', {
    params: warehouseId ? { warehouseId } : {}
  }),
  getStockByProduct: (productId: string) => api.get(`/inventory/stock/product/${productId}`),
  getStockValuation: (warehouseId?: string) => api.get('/inventory/stock/valuation', {
    params: warehouseId ? { warehouseId } : {}
  }),

  // Movements
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),

  // Adjustments
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
  transferStock: (data: any) => api.post('/inventory/transfer', data),

  // Alerts
  getLowStockAlerts: (warehouseId?: string) => api.get('/inventory/alerts/low-stock', {
    params: warehouseId ? { warehouseId } : {}
  }),
  getOutOfStockProducts: (warehouseId?: string) => api.get('/inventory/alerts/out-of-stock', {
    params: warehouseId ? { warehouseId } : {}
  }),
};

// Files API
export interface FileRecord {
  fileId: string;
  companyId?: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface PresignedUploadRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
  moduleName: string;
}

export interface ConfirmUploadRequest {
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  moduleName: string;
  recordId: string;
}

export const filesApi = {
  // Generate presigned upload URL
  getPresignedUploadUrl: (data: PresignedUploadRequest) =>
    api.post<{ success: boolean; data: PresignedUploadResponse }>('/files/presigned-upload', data),

  // Confirm upload after presigned upload
  confirmUpload: (data: ConfirmUploadRequest) =>
    api.post<{ success: boolean; data: FileRecord }>('/files/confirm-upload', data),

  // Direct upload (alternative)
  upload: (data: any) =>
    api.post<{ success: boolean; data: FileRecord }>('/files/upload', data),

  // Get files for entity
  getFiles: (entityType: string, entityId: string) =>
    api.get<{ success: boolean; data: FileRecord[] }>(`/files/entity/${entityType}/${entityId}`),

  // Get presigned download URL
  getPresignedDownloadUrl: (fileId: string) =>
    api.post<{ success: boolean; data: { downloadUrl: string; key: string; expiresIn: number } }>(
      `/files/presigned-download/${fileId}`,
      {}
    ),

  // Update file
  updateFile: (id: string, data: { fileName?: string; fileUrl?: string }) =>
    api.patch<{ success: boolean; data: FileRecord }>(`/files/${id}`, data),

  // Delete file
  deleteFile: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/files/${id}`),

  // Validate file before upload
  validateFile: (mimeType: string, fileSize: number) =>
    api.get<{ success: boolean; valid: boolean; message?: string }>('/files/validate', {
      params: { mimeType, fileSize },
    }),
};

// Notifications API
export interface NotificationRecord {
  notificationId: string;
  companyId?: string;
  userId: string;
  moduleName?: string;
  recordId?: string;
  title: string;
  message: string;
  notificationType: string;
  status: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export const notificationsApi = {
  // Get notifications
  getNotifications: (params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    moduleName?: string;
  }) => api.get<{ success: boolean; data: NotificationRecord[]; total: number }>('/notifications', { params }),

  // Get unread count
  getUnreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),

  // Create notification (admin/system use)
  createNotification: (data: {
    userId?: string;
    title: string;
    message: string;
    moduleName?: string;
    recordId?: string;
    notificationType?: string;
  }) => api.post<{ success: boolean; data: NotificationRecord }>('/notifications', data),

  // Mark as read
  markAsRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: () => api.post<{ success: boolean }>('/notifications/mark-all-read'),

  // Delete notification
  deleteNotification: (id: string) => api.delete<{ success: boolean }>(`/notifications/${id}`),
};

// Search API
export interface SearchResult {
  module: string;
  moduleLabel: string;
  icon?: string;
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
  url?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  modules: Record<string, number>;
}

export const searchApi = {
  // Global search
  search: (params: {
    q: string;
    module?: string;
    page?: number;
    limit?: number;
  }) => api.get<SearchResponse>('/search', { params }),

  // Search suggestions for autocomplete
  getSuggestions: (q: string, limit?: number) =>
    api.get<{ module: string; title: string; id: string; subtitle?: string; url?: string }[]>(
      '/search/suggestions',
      { params: { q, limit } }
    ),
};

// Accounts API
export const accountsApi = {
  getStats: () => api.get('/accounts/stats'),
  getIndentToPO: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/accounts/indent-to-po', { params }),
  getPendingPOs: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/accounts/pending-pos', { params }),
  getLedgerEntries: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<PaginatedResponse<any>>('/accounts/ledger', { params }),
  getPODetails: (orderId: string) => api.get(`/accounts/po/${orderId}`),
  getLedgerEntry: (id: string) => api.get(`/accounts/ledger/${id}`),
  uploadLedger: (data: any) => api.post('/accounts/ledger', data),
  updateLedger: (id: string, data: any) => api.patch(`/accounts/ledger/${id}`, data),
  approveLedger: (id: string, data?: { chiefAccountantRemarks?: string }) =>
    api.patch(`/accounts/ledger/${id}/approve`, data || {}),
  rejectLedger: (id: string, data: { rejectionReason: string; chiefAccountantRemarks?: string }) =>
    api.patch(`/accounts/ledger/${id}/reject`, data),
};
