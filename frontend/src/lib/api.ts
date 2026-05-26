const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'dance_org_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/api${endpoint}`;
  const token = getAuthToken();
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || 'Request failed');
  }

  // Some endpoints return empty body (e.g., DELETE with no content)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ====================================================================
// News API helpers
// ====================================================================

export const newsApi = {
  list: (params?: {
    category?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<unknown[]>(`/v1/news${qs ? '?' + qs : ''}`);
  },

  get: (slug: string) => api.get<unknown>(`/v1/news/admin/${slug}`),

  create: (body: unknown) => api.post<unknown>('/v1/news', body),

  update: (slug: string, body: unknown) =>
    api.put<unknown>(`/v1/news/${slug}`, body),

  remove: (slug: string) => api.delete(`/v1/news/${slug}`),

  categories: () => api.get<unknown[]>('/v1/news/categories'),

  tags: () => api.get<unknown[]>('/v1/news/tags'),
};

// ====================================================================
// Upload API helpers
// ====================================================================

export const uploadApi = {
  image: async (file: File): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const errorMsg = error.detail || `Upload failed (HTTP ${response.status})`;
      throw new Error(`${errorMsg} | URL: ${API_URL}/api/v1/upload/image | Status: ${response.status}`);
    }

    return response.json();
  },
};
