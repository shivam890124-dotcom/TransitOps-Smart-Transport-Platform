const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const token = localStorage.getItem('transit_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errMsg = 'An unexpected server error occurred';
    try {
      const errorData = await response.json();
      errMsg = errorData.message || errMsg;
    } catch (e) {
      // JSON parsing failed, use status text
      errMsg = response.statusText || errMsg;
    }
    throw new Error(errMsg);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Concrete endpoint helpers
export const api = {
  auth: {
    login: (credentials: any) => apiRequest('/auth/login', 'POST', credentials),
    register: (userData: any) => apiRequest('/auth/register', 'POST', userData),
    profile: () => apiRequest('/auth/profile', 'GET'),
  },
  vehicles: {
    list: (params?: { status?: string; type?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiRequest(`/vehicles${qs ? '?' + qs : ''}`, 'GET');
    },
    get: (id: string) => apiRequest(`/vehicles/${id}`, 'GET'),
    create: (data: any) => apiRequest('/vehicles', 'POST', data),
    update: (id: string, data: any) => apiRequest(`/vehicles/${id}`, 'PUT', data),
    delete: (id: string) => apiRequest(`/vehicles/${id}`, 'DELETE'),
  },
  drivers: {
    list: (params?: { status?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiRequest(`/drivers${qs ? '?' + qs : ''}`, 'GET');
    },
    get: (id: string) => apiRequest(`/drivers/${id}`, 'GET'),
    create: (data: any) => apiRequest('/drivers', 'POST', data),
    update: (id: string, data: any) => apiRequest(`/drivers/${id}`, 'PUT', data),
    delete: (id: string) => apiRequest(`/drivers/${id}`, 'DELETE'),
  },
  trips: {
    list: (params?: { status?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiRequest(`/trips${qs ? '?' + qs : ''}`, 'GET');
    },
    get: (id: string) => apiRequest(`/trips/${id}`, 'GET'),
    create: (data: any) => apiRequest('/trips', 'POST', data),
    updateStatus: (id: string, status: string, actualArrivalTime?: string) => 
      apiRequest(`/trips/${id}/status`, 'PUT', { status, actualArrivalTime }),
    delete: (id: string) => apiRequest(`/trips/${id}`, 'DELETE'),
  },
  maintenance: {
    list: (params?: { status?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiRequest(`/maintenance${qs ? '?' + qs : ''}`, 'GET');
    },
    create: (data: any) => apiRequest('/maintenance', 'POST', data),
    update: (id: string, data: any) => apiRequest(`/maintenance/${id}`, 'PUT', data),
    delete: (id: string) => apiRequest(`/maintenance/${id}`, 'DELETE'),
  }
};
