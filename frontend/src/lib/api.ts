const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('[API Config] NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL, '=> API_URL =', API_URL);

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

/**
 * Extracts a readable error message from various error formats.
 * Handles:
 *   - Error objects (Error.message)
 *   - FastAPI dict errors: { detail: "..." }
 *   - FastAPI validation errors: { detail: [{ msg: "...", loc: [...] }] }
 *   - String errors
 *   - Unknown objects
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string' && err.length > 0) return err;

  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;

    // FastAPI-style detail
    if ('detail' in e && e.detail != null) {
      const detail = e.detail;

      // String detail
      if (typeof detail === 'string') return detail;

      // Array of validation errors: [{ msg: "...", loc: ["body", "field"] }]
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item: unknown) => {
            if (item && typeof item === 'object') {
              const d = item as Record<string, unknown>;
              if (typeof d.msg === 'string') return d.msg;
              if (typeof d.message === 'string') return d.message;
              if (typeof d.detail === 'string') return d.detail;
              // loc + msg
              const loc = Array.isArray(d.loc) ? d.loc.join('.') : '';
              const msg = typeof d.msg === 'string' ? d.msg : '';
              return loc ? `${loc}: ${msg}` : msg;
            }
            return String(item);
          })
          .filter(Boolean);
        if (messages.length > 0) return messages.join('; ');
      }

      // Nested object detail
      if (typeof detail === 'object' && !Array.isArray(detail)) {
        const d = detail as Record<string, unknown>;
        if (typeof d.detail === 'string') return d.detail;
        if (typeof d.message === 'string') return d.message;
        return JSON.stringify(detail);
      }
    }

    // Direct message field
    if ('message' in e && typeof e.message === 'string') return e.message;
    if ('error' in e && typeof e.error === 'string') return e.error;
  }

  return 'An unexpected error occurred';
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const fullUrl = `${API_URL}/api${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Merge headers from options
  if (options.headers) {
    if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
      for (const [key, value] of Object.entries(options.headers as Record<string, string>)) {
        if (value != null) headers[key] = value;
      }
    }
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };

  console.log('[API Request]', options.method || 'GET', fullUrl, 'Token:', token ? 'yes' : 'no');

  let response: Response;
  try {
    response = await fetch(fullUrl, config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    console.error('[API Network Error]', fullUrl, message);
    throw new Error(`Network error: ${message}. Is the backend running at ${API_URL}?`);
  }

  console.log('[API Response]', response.status, response.statusText, fullUrl);

  if (!response.ok) {
    let errorData: Record<string, unknown> = { detail: response.statusText };
    try {
      const parsed = await response.json();
      if (parsed && typeof parsed === 'object') {
        errorData = parsed as Record<string, unknown>;
      }
    } catch {
      const text = await response.text().catch(() => '');
      if (text) errorData = { detail: text };
    }
    const message = getErrorMessage(errorData);
    console.error('[API Error]', response.status, fullUrl, errorData);
    throw new Error(`${response.status}: ${message}`);
  }

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
// News API types
// ====================================================================

export interface NewsCategory {
  id?: string;
  slug: string;
  name: string;
  name_zh?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface NewsTag {
  id?: string;
  slug: string;
  name: string;
  name_zh?: string;
  created_at?: string;
}

export interface NewsArticle {
  id: string;
  group_id?: string;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  cover_image?: string;
  is_published: boolean;
  locale: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  categories: NewsCategory[];
  tags: NewsTag[];
  rendered_body?: string;
}

export interface ArticleTranslationSummary {
  id: string;
  locale: string;
  slug: string;
  title: string;
  summary?: string;
  is_published: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewsArticleGroup {
  id: string;
  shared_slug: string;
  translations: ArticleTranslationSummary[];
  categories: NewsCategory[];
  tags: NewsTag[];
  created_at?: string;
  updated_at?: string;
}

export interface ArticleCreateBody {
  title: string;
  slug: string;
  summary?: string;
  body: string;
  cover_image?: string;
  category_slugs: string[];
  tag_slugs: string[];
  locale: string;
  is_published: boolean;
}

export interface ArticleUpdateBody {
  title?: string;
  summary?: string;
  body?: string;
  cover_image?: string;
  category_slugs?: string[];
  tag_slugs?: string[];
  locale?: string;
  is_published?: boolean;
}

export interface PerformanceItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  venue?: string;
  cover_image?: string;
  is_current: boolean;
  created_at?: string;
}

export interface PerformanceBody {
  slug: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  venue?: string;
  cover_image?: string;
  is_current: boolean;
}

// ====================================================================
// News API helpers
// ====================================================================

export const newsApi = {
  // Article endpoints
  // Public list: only published articles
  list: (params?: {
    category?: string;
    tag?: string;
    search?: string;
    locale?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.locale) query.set('locale', params.locale);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<NewsArticle[]>(`/v1/news${qs ? '?' + qs : ''}`);
  },

  // Admin list: ALL articles including drafts (requires auth)
  adminList: (params?: {
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
    return api.get<NewsArticle[]>(`/v1/news/admin/list${qs ? '?' + qs : ''}`);
  },

  adminGroups: (params?: {
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
    return api.get<NewsArticleGroup[]>(`/v1/news/admin/groups${qs ? '?' + qs : ''}`);
  },

  get: (slug: string, locale?: string) =>
    api.get<NewsArticle>(`/v1/news/admin/${slug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  publicGet: (slug: string, locale?: string) =>
    api.get<NewsArticle>(`/v1/news/${slug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  createArticle: (body: ArticleCreateBody) => api.post<NewsArticle>('/v1/news', body),

  updateArticle: (slug: string, body: ArticleUpdateBody) =>
    api.put<NewsArticle>(`/v1/news/${slug}`, body),

  removeArticle: (slug: string) => api.delete<Record<string, unknown>>(`/v1/news/${slug}`),

  // Category endpoints
  categories: () => api.get<NewsCategory[]>('/v1/news/categories'),

  createCategory: (body: NewsCategory) => api.post<NewsCategory>('/v1/news/categories', body),

  updateCategory: (slug: string, body: Partial<NewsCategory>) =>
    api.put<NewsCategory>(`/v1/news/categories/${slug}`, body),

  deleteCategory: (slug: string) => api.delete<Record<string, unknown>>(`/v1/news/categories/${slug}`),

  // Tag endpoints
  tags: () => api.get<NewsTag[]>('/v1/news/tags'),

  createTag: (body: NewsTag) => api.post<NewsTag>('/v1/news/tags', body),

  updateTag: (slug: string, body: Partial<NewsTag>) =>
    api.put<NewsTag>(`/v1/news/tags/${slug}`, body),

  deleteTag: (slug: string) => api.delete<Record<string, unknown>>(`/v1/news/tags/${slug}`),

  // Toggle publish status (hide/unpublish or publish)
  togglePublish: (slug: string, published: boolean) =>
    api.put<NewsArticle>(`/v1/news/${slug}/status`, { is_published: published }),
};

export const performanceApi = {
  list: (params?: { current?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.current) query.set('current', 'true');
    const qs = query.toString();
    return api.get<PerformanceItem[]>(`/v1/events/performances${qs ? '?' + qs : ''}`);
  },

  getBySlug: (slug: string) =>
    api.get<PerformanceItem>(`/v1/events/performances/slug/${slug}`),

  get: (id: string) =>
    api.get<PerformanceItem>(`/v1/events/performances/${id}`),

  create: (body: PerformanceBody) =>
    api.post<PerformanceItem>('/v1/events/performances', body),

  update: (id: string, body: Partial<PerformanceBody>) =>
    api.put<PerformanceItem>(`/v1/events/performances/${id}`, body),

  remove: (id: string) =>
    api.delete<Record<string, unknown>>(`/v1/events/performances/${id}`),
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
      const errorMsg = getErrorMessage(error);
      console.error('[Upload Error]', response.status, errorMsg);
      throw new Error(errorMsg);
    }

    return response.json();
  },
  video: async (file: File): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/video`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const errorMsg = getErrorMessage(error);
      console.error('[Video Upload Error]', response.status, errorMsg);
      throw new Error(errorMsg);
    }

    return response.json();
  },
  file: async (file: File): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const errorMsg = getErrorMessage(error);
      console.error('[File Upload Error]', response.status, errorMsg);
      throw new Error(errorMsg);
    }

    return response.json();
  },
};

// ====================================================================
// Site settings API helpers
// ====================================================================

export interface RegistrationLinks {
  registration_url: string;
  summer_camp_registration_url: string;
  summer_camp_enabled: boolean;
}

export const settingsApi = {
  registrationLinks: () => api.get<RegistrationLinks>('/v1/settings/registration-links'),
  updateRegistrationLinks: (body: RegistrationLinks) =>
    api.put<RegistrationLinks>('/v1/settings/registration-links', body),
  site: () => api.get<SystemSettings>('/v1/settings/site'),
  updateSite: (body: SystemSettings) => api.put<SystemSettings>('/v1/settings/site', body),
};

export interface SystemSettings {
  site_name: string;
  logo_url: string;
  header_cta_label: string;
  header_cta_href: string;
  show_admin_login: boolean;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_href: string;
  footer_description: string;
  footer_newsletter_title: string;
  footer_newsletter_text: string;
  copyright_text: string;
  privacy_href: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  outbound_email: string;
  classroom_request_limit_per_contact: number;
  program_pricing_json: string;
  classroom_pricing_json: string;
  youtube_url: string;
  xiaohongshu_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
}

export interface HomepageButton {
  label: string;
  href: string;
}

export interface HomepageHeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  primary: HomepageButton;
  secondary: HomepageButton;
  image_url: string;
  overlay: string;
  is_active: boolean;
}

export interface HomepageStat {
  value: string;
  label: string;
}

export interface HomepageCta {
  title: string;
  subtitle: string;
  note: string;
  primary: HomepageButton;
  secondary: HomepageButton;
}

export interface HomepageSettings {
  hero_slides: HomepageHeroSlide[];
  stats: HomepageStat[];
  cta: HomepageCta;
}

export const homepageApi = {
  get: () => api.get<HomepageSettings>('/v1/settings/homepage'),
  update: (body: HomepageSettings) => api.put<HomepageSettings>('/v1/settings/homepage', body),
};

// ====================================================================
// Faculty API helpers
// ====================================================================

export interface FacultyMember {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  photo_url?: string;
  specialties?: string;
  achievements?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export interface FacultyMemberBody {
  name: string;
  role?: string;
  bio?: string;
  photo_url?: string;
  specialties?: string;
  achievements?: string;
  is_active: boolean;
  order_index: number;
}

export const facultyApi = {
  list: () => api.get<FacultyMember[]>('/v1/faculty'),
  adminList: () => api.get<FacultyMember[]>('/v1/faculty/admin/list'),
  create: (body: FacultyMemberBody) => api.post<FacultyMember>('/v1/faculty', body),
  update: (id: string, body: Partial<FacultyMemberBody>) =>
    api.put<FacultyMember>(`/v1/faculty/${id}`, body),
  remove: (id: string) => api.delete<Record<string, unknown>>(`/v1/faculty/${id}`),
};

// ====================================================================
// Programs API helpers
// ====================================================================

export interface ProgramItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  level?: string;
  syllabus_ref?: string;
  cover_image?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface ProgramBody {
  slug: string;
  name: string;
  description?: string;
  category: string;
  level?: string;
  syllabus_ref?: string;
  cover_image?: string;
  order_index: number;
}

export const programApi = {
  list: () => api.get<ProgramItem[]>('/v1/programs/'),
  adminList: () => api.get<ProgramItem[]>('/v1/programs/admin/list'),
  create: (body: ProgramBody) => api.post<ProgramItem>('/v1/programs/', body),
  update: (id: string, body: Partial<ProgramBody> & { is_active?: boolean }) =>
    api.put<ProgramItem>(`/v1/programs/${id}`, body),
  remove: (id: string) => api.delete<Record<string, unknown>>(`/v1/programs/${id}`),
};

// ====================================================================
// Classroom timetable API helpers
// ====================================================================

export type ClassroomRoom = 'large' | 'small';
export type ClassroomBookingType = 'internal' | 'external';
export type ClassroomBookingStatus = 'pending' | 'confirmed' | 'rejected';

export interface ClassroomBooking {
  id: string;
  room: ClassroomRoom;
  booking_type: ClassroomBookingType;
  status: ClassroomBookingStatus;
  title: string;
  teacher_name?: string;
  applicant_name?: string;
  applicant_contact?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClassroomBookingBody {
  room: ClassroomRoom;
  booking_type: ClassroomBookingType;
  status?: ClassroomBookingStatus;
  title: string;
  teacher_name?: string;
  applicant_name?: string;
  applicant_contact?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes?: string;
  captcha_token?: string;
  captcha_answer?: string;
}

export type ClassroomReceiptStatus = 'sent' | 'not_requested' | 'not_configured' | 'failed';

export interface ClassroomBookingCreateResponse {
  booking: ClassroomBooking;
  receipt_email?: string;
  receipt_status: ClassroomReceiptStatus;
}

export interface ClassroomCaptcha {
  question: string;
  token: string;
}

export const classroomApi = {
  list: (params?: { room?: ClassroomRoom; status?: ClassroomBookingStatus }) => {
    const query = new URLSearchParams();
    if (params?.room) query.set('room', params.room);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<ClassroomBooking[]>(`/v1/classrooms/bookings${qs ? '?' + qs : ''}`);
  },
  create: (body: ClassroomBookingBody) =>
    api.post<ClassroomBookingCreateResponse>('/v1/classrooms/bookings', body),
  captcha: () => api.get<ClassroomCaptcha>('/v1/classrooms/captcha'),
  verifyCaptcha: (body: { token: string; answer: string }) =>
    api.post<{ valid: boolean }>('/v1/classrooms/captcha/verify', body),
  update: (id: string, body: Partial<ClassroomBookingBody>) =>
    api.put<ClassroomBooking>(`/v1/classrooms/bookings/${id}`, body),
  remove: (id: string) =>
    api.delete<Record<string, unknown>>(`/v1/classrooms/bookings/${id}`),
};

// ====================================================================
// Course schedule and school policy API helpers
// ====================================================================

export interface CourseScheduleItem {
  id: string;
  day_of_week: number;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseScheduleItemBody {
  day_of_week: number;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location: string;
  is_active: boolean;
  order_index: number;
}

export interface SchoolPolicy {
  title: string;
  body_markdown: string;
  updated_at?: string;
}

export const scheduleApi = {
  list: (params?: { includeInactive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.includeInactive) query.set('include_inactive', 'true');
    const qs = query.toString();
    return api.get<CourseScheduleItem[]>(`/v1/schedules/classes${qs ? '?' + qs : ''}`);
  },
  create: (body: CourseScheduleItemBody) =>
    api.post<CourseScheduleItem>('/v1/schedules/classes', body),
  update: (id: string, body: Partial<CourseScheduleItemBody>) =>
    api.put<CourseScheduleItem>(`/v1/schedules/classes/${id}`, body),
  remove: (id: string) =>
    api.delete<Record<string, unknown>>(`/v1/schedules/classes/${id}`),
  policy: () => api.get<SchoolPolicy>('/v1/schedules/policy'),
  updatePolicy: (body: SchoolPolicy) => api.put<SchoolPolicy>('/v1/schedules/policy', body),
};
