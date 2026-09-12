const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('reloop_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (email?: string) => fetchApi(`/auth/me${email ? `?email=${email}` : ''}`),

  // Companies
  getCompanies: () => fetchApi('/companies'),
  getCompanyDetail: (id: string) => fetchApi(`/companies/${id}`),
  getCircularLoop: (id: string) => fetchApi(`/companies/${id}/circular-loop`),
  getCompanyAnalytics: (id: string) => fetchApi(`/companies/${id}/analytics`),

  // Materials
  getMaterials: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return fetchApi(`/materials?${q.toString()}`);
  },
  getMaterial: (id: string) => fetchApi(`/materials/${id}`),
  createMaterial: (data: any) => fetchApi('/materials', { method: 'POST', body: JSON.stringify(data) }),
  deleteMaterial: (id: string) => fetchApi(`/materials/${id}`, { method: 'DELETE' }),
  parseSearch: (query: string) => fetchApi('/materials/parse-search', { method: 'POST', body: JSON.stringify({ query }) }),

  // Requirements
  getRequirements: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/requirements?${q}`);
  },
  createRequirement: (data: any) => fetchApi('/requirements', { method: 'POST', body: JSON.stringify(data) }),
  getRequirementMatches: (id: string) => fetchApi(`/requirements/${id}/matching-materials`),

  // Matching & Recommendations
  getRecommendations: (companyId?: string) => fetchApi(`/matching/recommendations${companyId ? `?company_id=${companyId}` : ''}`),
  getBestBuyers: (materialId: string) => fetchApi(`/matching/${materialId}/best-buyers`),
  getWhyMatch: (materialId: string, buyerId?: string) => fetchApi(`/matching/${materialId}/why-match${buyerId ? `?buyer_id=${buyerId}` : ''}`),

  // Orders
  getOrders: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/orders?${q}`);
  },
  getOrderDetail: (id: string) => fetchApi(`/orders/${id}`),
  createOrder: (data: any) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) => fetchApi(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  clearOrders: () => fetchApi('/orders/clear', { method: 'DELETE' }),
  deleteOrder: (id: string) => fetchApi(`/orders/${id}`, { method: 'DELETE' }),

  // Contracts
  getContracts: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((result, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') result[key] = String(value);
        return result;
      }, {})
    ).toString();
    return fetchApi(`/contracts?${q}`);
  },
  getContractDetail: (id: string) => fetchApi(`/contracts/${id}`),
  createContract: (data: any) => fetchApi('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  signContract: (id: string) => fetchApi(`/contracts/${id}/sign`, { method: 'PUT' }),

  // Logistics
  getShipments: () => fetchApi('/logistics'),
  getShipmentDetail: (id: string) => fetchApi(`/logistics/${id}`),
  getRouteQuote: (data: any) => fetchApi('/logistics/quote', { method: 'POST', body: JSON.stringify(data) }),
  optimizeConsolidation: (data: any) => fetchApi('/logistics/optimize', { method: 'POST', body: JSON.stringify(data) }),

  // Inspections & Disputes
  getInspections: () => fetchApi('/inspections'),
  submitInspection: (data: any) => fetchApi('/inspections', { method: 'POST', body: JSON.stringify(data) }),
  raiseDispute: (data: any) => fetchApi('/inspections/dispute', { method: 'POST', body: JSON.stringify(data) }),
  resolveDispute: (id: string, data: any) => fetchApi(`/inspections/dispute/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),

  // Impact
  getImpactDashboard: () => fetchApi('/impact/dashboard'),

  // Simulator
  runSimulation: (data: any) => fetchApi('/simulator/run', { method: 'POST', body: JSON.stringify(data) }),

  // AI
  parseListingAI: (text: string) => fetchApi('/ai/parse', { method: 'POST', body: JSON.stringify({ text }) }),
  chatAssistant: (message: string, context?: any) => fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) }),

  // Admin
  resetDemoData: () => fetchApi('/admin/reset-demo-data', { method: 'POST' }),
  runFullDemoFlow: () => fetchApi('/admin/run-full-demo-flow', { method: 'POST' }),
};
