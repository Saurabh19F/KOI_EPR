import { api as apiClient } from './api';

// =============================================
// ENQUIRY APIs
// =============================================

export const enquiryApi = {
  // List all enquiries
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    customerId?: string;
  }) => {
    const response = await apiClient.get('/price-analysis/enquiries', { params });
    return response.data;
  },

  // Get single enquiry
  get: async (id: string) => {
    const response = await apiClient.get(`/price-analysis/enquiries/${id}`);
    return response.data;
  },

  // Create enquiry
  create: async (data: any) => {
    const response = await apiClient.post('/price-analysis/enquiries', data);
    return response.data;
  },

  // Update enquiry
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/price-analysis/enquiries/${id}`, data);
    return response.data;
  },

  // Submit enquiry
  submit: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/enquiries/${id}/submit`);
    return response.data;
  },

  // Add item to enquiry
  addItem: async (enquiryId: string, data: any) => {
    const response = await apiClient.post(`/price-analysis/enquiries/${enquiryId}/items`, data);
    return response.data;
  },

  // Update enquiry item
  updateItem: async (id: string, data: any) => {
    const response = await apiClient.put(`/price-analysis/enquiries/items/${id}`, data);
    return response.data;
  },

  // Delete enquiry item
  deleteItem: async (id: string) => {
    const response = await apiClient.delete(`/price-analysis/enquiries/items/${id}`);
    return response.data;
  },
};

// =============================================
// PURCHASE RATE APIs
// =============================================

export const purchaseRateApi = {
  // Get purchase rates for enquiry
  list: async (enquiryId: string) => {
    const response = await apiClient.get(`/price-analysis/purchase-rates/enquiry/${enquiryId}`);
    return response.data;
  },

  // Create purchase rate
  create: async (data: any) => {
    const response = await apiClient.post('/price-analysis/purchase-rates', data);
    return response.data;
  },

  // Update purchase rate
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/price-analysis/purchase-rates/${id}`, data);
    return response.data;
  },

  // Lock purchase rate
  lock: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/purchase-rates/${id}/lock`);
    return response.data;
  },

  // Unlock purchase rate
  unlock: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/purchase-rates/${id}/unlock`);
    return response.data;
  },
};

// =============================================
// RATE CALCULATION APIs
// =============================================

export const rateCalculationApi = {
  // List all calculations
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    enquiryId?: string;
  }) => {
    const response = await apiClient.get('/price-analysis/calculations', { params });
    return response.data;
  },

  // Get single calculation
  get: async (id: string) => {
    const response = await apiClient.get(`/price-analysis/calculations/${id}`);
    return response.data;
  },

  // Create calculation
  create: async (data: any) => {
    const response = await apiClient.post('/price-analysis/calculations', data);
    return response.data;
  },

  // Update calculation
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/price-analysis/calculations/${id}`, data);
    return response.data;
  },

  // Calculate rate lines
  calculate: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/calculate`);
    return response.data;
  },

  // Submit for approval
  submit: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/submit`);
    return response.data;
  },

  // Approve calculation
  approve: async (id: string, remarks?: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/approve`, { remarks });
    return response.data;
  },

  // Reject calculation
  reject: async (id: string, reason: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/reject`, { reason });
    return response.data;
  },

  // Lock calculation
  lock: async (id: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/lock`);
    return response.data;
  },

  // Create requote
  requote: async (id: string, reason: string) => {
    const response = await apiClient.post(`/price-analysis/calculations/${id}/requote`, { reason });
    return response.data;
  },

  // Add line
  addLine: async (calculationId: string, data: any) => {
    const response = await apiClient.post(`/price-analysis/calculations/${calculationId}/lines`, data);
    return response.data;
  },

  // Update line
  updateLine: async (id: string, data: any) => {
    const response = await apiClient.put(`/price-analysis/calculations/lines/${id}`, data);
    return response.data;
  },

  // Delete line
  deleteLine: async (id: string) => {
    const response = await apiClient.delete(`/price-analysis/calculations/lines/${id}`);
    return response.data;
  },

  // Bulk update lines
  bulkUpdateLines: async (calculationId: string, lines: any[]) => {
    const response = await apiClient.put(
      `/price-analysis/calculations/${calculationId}/lines/bulk`,
      lines
    );
    return response.data;
  },
};

// =============================================
// CURRENCY RATE APIs
// =============================================

export const currencyRateApi = {
  // Get latest rates
  getLatest: async () => {
    const response = await apiClient.get('/price-analysis/currency-rates/latest');
    return response.data;
  },

  // Set rate
  set: async (data: any) => {
    const response = await apiClient.post('/price-analysis/currency-rates', data);
    return response.data;
  },

  // Get history
  getHistory: async (currencyCode: string) => {
    const response = await apiClient.get(
      `/price-analysis/currency-rates/history/${currencyCode}`
    );
    return response.data;
  },
};

// =============================================
// HAULAGE RATE APIs
// =============================================

export const haulageRateApi = {
  // Get all rates
  list: async () => {
    const response = await apiClient.get('/price-analysis/haulage-rates');
    return response.data;
  },

  // Get rate by location
  getByLocation: async (location: string) => {
    const response = await apiClient.get(`/price-analysis/haulage-rates/${location}`);
    return response.data;
  },

  // Set rate
  set: async (data: any) => {
    const response = await apiClient.post('/price-analysis/haulage-rates', data);
    return response.data;
  },
};

// =============================================
// MARGIN RULE APIs
// =============================================

export const marginRuleApi = {
  list: async (filters?: {
    categoryId?: string;
    brandId?: string;
    country?: string;
  }) => {
    const response = await apiClient.get('/price-analysis/margin-rules', { params: filters });
    return response.data;
  },
};

// =============================================
// AUDIT & WORKFLOW APIs
// =============================================

export const auditApi = {
  getAuditLogs: async (params?: {
    entityType?: string;
    entityId?: string;
    performedBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/price-analysis/audit-logs', { params });
    return response.data;
  },

  getWorkflowLogs: async (params: {
    enquiryId?: string;
    rateCalculationId?: string;
  }) => {
    const response = await apiClient.get('/price-analysis/workflow-logs', { params });
    return response.data;
  },
};

// =============================================
// COMBINED API OBJECT
// =============================================

export const priceAnalysisApi = {
  enquiry: enquiryApi,
  purchaseRate: purchaseRateApi,
  rateCalculation: rateCalculationApi,
  currencyRate: currencyRateApi,
  haulageRate: haulageRateApi,
  marginRule: marginRuleApi,
  audit: auditApi,
};

export default priceAnalysisApi;