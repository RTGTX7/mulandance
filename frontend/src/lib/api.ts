export function getApiBaseUrl(): string {
  // All browser requests pass through the same-origin Next.js BFF.
  return '';
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(`${status}: ${message}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

export type LocaleCode = 'zh' | 'en' | 'fr';
export type LocalizedFieldMap = Partial<Record<LocaleCode, Record<string, string>>>;

export function getAuthToken(): string | null {
  return null;
}

export function setAuthToken(_token: string): void {
  // Compatibility shim while legacy login routes redirect to Logto.
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') window.location.assign('/auth/sign-out');
}

export function isAuthenticated(): boolean {
  // HttpOnly sessions are checked by server layouts and protected APIs.
  return true;
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
  const apiUrl = getApiBaseUrl();
  const fullUrl = `${apiUrl}/api${endpoint}`;
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
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  console.log('[API Request]', options.method || 'GET', fullUrl);

  let response: Response;
  try {
    response = await fetch(fullUrl, config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    console.error('[API Network Error]', fullUrl, message);
    throw new Error(`Network error: ${message}. Is the backend running at ${apiUrl}?`);
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
    // Form validation and conflict checks intentionally return 4xx. Keep those
    // visible while developing without reporting them as application failures.
    const log = response.status >= 500 ? console.error : console.warn;
    log('[API Error]', response.status, fullUrl, errorData);
    throw new ApiRequestError(response.status, message, errorData.detail);
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
  show_on_homepage: boolean;
  translations: ArticleTranslationSummary[];
  categories: NewsCategory[];
  tags: NewsTag[];
  created_at?: string;
  updated_at?: string;
}

export interface NewsArticleGroupListResponse {
  items: NewsArticleGroup[];
  total: number;
  limit: number;
  offset: number;
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
  published_at?: string;
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
  published_at?: string;
}

export interface AiDraft {
  locale: string;
  fields: Record<string, string>;
  warnings?: string[];
}

export interface AiTranslateResponse {
  module: string;
  source_locale: string;
  drafts: AiDraft[];
  warnings?: string[];
}

export interface AiTranslateJobCreateResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
}

export interface AiTranslateJobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: AiTranslateResponse | null;
  error?: string;
}

export interface AiExtractResponse {
  module: string;
  source_locale: string;
  drafts: AiDraft[];
  warnings?: string[];
}

export interface AiExtractJobCreateResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
}

export interface AiExtractJobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: AiExtractResponse | null;
  error?: string;
}

export interface AiExtractItem {
  drafts: AiDraft[];
  warnings?: string[];
}

export interface AiExtractManyResponse {
  module: string;
  source_locale: string;
  items: AiExtractItem[];
  warnings?: string[];
}

export interface AiExtractManyJobCreateResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
}

export interface AiExtractManyJobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: AiExtractManyResponse | null;
  error?: string;
}

export interface FixedCourseImportIssue {
  id: string;
  field: string;
  message: string;
  blocking: boolean;
  resolved: boolean;
}

export interface FixedCourseImportSlot {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  room_id?: string | null;
  teacher_id?: string | null;
}

export interface FixedCourseImportDraft {
  template: {
    title: string;
    description: string;
    translations: LocalizedFieldMap;
  };
  offering: {
    name: string;
    start_date: string;
    end_date: string;
    is_public: boolean;
  };
  slots: FixedCourseImportSlot[];
  questions: FixedCourseImportIssue[];
  assumptions: FixedCourseImportIssue[];
}

export interface FixedCourseImportResponse {
  version: 'fixed_course_import.v1';
  drafts: FixedCourseImportDraft[];
  warnings: string[];
}

export interface FixedCourseImportJobCreateResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
}

export interface FixedCourseImportJobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: FixedCourseImportResponse | null;
  error?: string;
}

export interface ImportedMedia {
  url: string;
  path: string;
  source_url: string;
  content_type: string;
  size: number;
}

export interface ImportedSource {
  url: string;
  title?: string;
  description?: string;
  text?: string;
  source_published_at?: string;
  images?: string[];
  media?: ImportedMedia[];
  video_url?: string;
  is_video?: boolean;
  warnings?: string[];
}

export interface AiArticleImportItem {
  source: ImportedSource;
  content_type?: 'news' | 'performance';
  suggested_category_slugs?: string[];
  suggested_tag_slugs?: string[];
  drafts: AiDraft[];
  warnings?: string[];
}

export interface AiArticleImportResponse {
  items: AiArticleImportItem[];
  warnings?: string[];
}

export interface AiArticleImportJobEntry {
  url: string;
  status: 'saved' | 'generated' | 'duplicate' | 'invalid' | 'failed';
  message?: string;
  saved_slug?: string;
}

export interface AiArticleImportJobCreateResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
}

export interface AiArticleImportJobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: AiArticleImportResponse | null;
  error?: string;
  total?: number;
  completed?: number;
  failed?: number;
  current_url?: string;
  errors?: string[];
  saved?: number;
  saved_slugs?: string[];
  entries?: AiArticleImportJobEntry[];
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
  related_article_ids?: string[];
  created_at?: string;
  translations?: LocalizedFieldMap;
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
  related_article_ids?: string[];
  translations?: LocalizedFieldMap;
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
    homepage?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.locale) query.set('locale', params.locale);
    if (params?.homepage) query.set('homepage', 'true');
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
    status?: 'all' | 'published' | 'draft' | 'missing';
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<NewsArticleGroupListResponse>(`/v1/news/admin/groups${qs ? '?' + qs : ''}`);
  },

  get: (slug: string, locale?: string) =>
    api.get<NewsArticle>(`/v1/news/admin/${slug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  publicGet: (slug: string, locale?: string) =>
    api.get<NewsArticle>(`/v1/news/${slug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  publicByIds: (ids: string[], locale?: string) => {
    const query = new URLSearchParams();
    query.set('ids', ids.join(','));
    if (locale) query.set('locale', locale);
    return api.get<NewsArticle[]>(`/v1/news/by-ids?${query.toString()}`);
  },

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

  bulkTogglePublish: (slugs: string[], published: boolean) =>
    api.post<{ updated: number; items: NewsArticleGroup[] }>('/v1/news/admin/groups/bulk-status', {
      slugs,
      is_published: published,
    }),

  bulkDelete: (slugs: string[]) =>
    api.post<{ deleted: number }>('/v1/news/admin/groups/bulk-delete', {
      slugs,
      is_published: false,
    }),

  setHomepageVisibility: (slug: string, visible: boolean) =>
    api.put<NewsArticleGroup>(`/v1/news/admin/groups/${encodeURIComponent(slug)}/homepage`, {
      show_on_homepage: visible,
    }),
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const aiApi = {
  translate: async (body: {
    module: string;
    source_locale: string;
    target_locales: string[];
    fields: Record<string, string>;
    tone?: string;
  }) => {
    const job = await api.post<AiTranslateJobCreateResponse>('/v1/ai/translate/jobs', body);
    while (true) {
      await wait(2500);
      const status = await api.get<AiTranslateJobStatusResponse>(`/v1/ai/translate/jobs/${job.job_id}`);
      if (status.status === 'succeeded' && status.result) return status.result;
      if (status.status === 'failed') throw new Error(status.error || 'AI translation failed');
    }
  },

  extract: async (body: {
    module: string;
    source_locale: string;
    target_locales: string[];
    raw_text: string;
    target_fields: string[];
    instruction?: string;
  }) => {
    const job = await api.post<AiExtractJobCreateResponse>('/v1/ai/extract/jobs', body);
    while (true) {
      await wait(2500);
      const status = await api.get<AiExtractJobStatusResponse>(`/v1/ai/extract/jobs/${job.job_id}`);
      if (status.status === 'succeeded' && status.result) return status.result;
      if (status.status === 'failed') throw new Error(status.error || 'AI extraction failed');
    }
  },

  extractMany: async (body: {
    module: string;
    source_locale: string;
    target_locales: string[];
    raw_text: string;
    target_fields: string[];
    instruction?: string;
    max_items?: number;
  }) => {
    const job = await api.post<AiExtractManyJobCreateResponse>('/v1/ai/extract-many/jobs', body);
    while (true) {
      await wait(2500);
      const status = await api.get<AiExtractManyJobStatusResponse>(`/v1/ai/extract-many/jobs/${job.job_id}`);
      if (status.status === 'succeeded' && status.result) return status.result;
      if (status.status === 'failed') throw new Error(status.error || 'AI bulk extraction failed');
    }
  },

  fixedCourseImport: async (body: {
    raw_text: string;
    source_locale: string;
    ui_locale: string;
    max_items?: number;
  }) => {
    const job = await api.post<FixedCourseImportJobCreateResponse>('/v1/ai/fixed-course-import/jobs', body);
    while (true) {
      await wait(2500);
      const status = await api.get<FixedCourseImportJobStatusResponse>(`/v1/ai/fixed-course-import/jobs/${job.job_id}`);
      if (status.status === 'succeeded' && status.result) return status.result;
      if (status.status === 'failed') throw new Error(status.error || 'Fixed course AI import failed');
    }
  },

  startArticleUrlImportJob: (body: {
    urls: string[];
    source_locale: string;
    target_locales: string[];
    manual_text?: string;
    extra_instruction?: string;
    category_slugs?: string[];
    tag_slugs?: string[];
    available_category_slugs?: string[];
    available_tag_slugs?: string[];
    auto_save_to_drafts?: boolean;
  }) => api.post<AiArticleImportJobCreateResponse>('/v1/ai/import-article-urls/jobs', body),

  getArticleUrlImportJob: (jobId: string) =>
    api.get<AiArticleImportJobStatusResponse>(`/v1/ai/import-article-urls/jobs/${jobId}`),

  appendArticleUrlImportJob: (jobId: string, urls: string[]) =>
    api.post<AiArticleImportJobStatusResponse>(`/v1/ai/import-article-urls/jobs/${jobId}/append`, { urls }),

  importArticleUrls: async (body: {
    urls: string[];
    source_locale: string;
    target_locales: string[];
    manual_text?: string;
    extra_instruction?: string;
    category_slugs?: string[];
    tag_slugs?: string[];
    available_category_slugs?: string[];
    available_tag_slugs?: string[];
    auto_save_to_drafts?: boolean;
  }) => {
    const job = await aiApi.startArticleUrlImportJob(body);
    while (true) {
      await wait(2500);
      const status = await aiApi.getArticleUrlImportJob(job.job_id);
      if (status.status === 'succeeded' && status.result) return status.result;
      if (status.status === 'failed') throw new Error(status.error || 'AI import failed');
    }
  },
};

export const performanceApi = {
  list: (params?: { current?: boolean; locale?: string }) => {
    const query = new URLSearchParams();
    if (params?.current) query.set('current', 'true');
    if (params?.locale) query.set('locale', params.locale);
    const qs = query.toString();
    return api.get<PerformanceItem[]>(`/v1/events/performances${qs ? '?' + qs : ''}`);
  },

  getBySlug: (slug: string, locale?: string) =>
    api.get<PerformanceItem>(`/v1/events/performances/slug/${encodeURIComponent(slug)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  get: (id: string, locale?: string) =>
    api.get<PerformanceItem>(`/v1/events/performances/${encodeURIComponent(id)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),

  create: (body: PerformanceBody) =>
    api.post<PerformanceItem>('/v1/events/performances', body),

  update: (id: string, body: Partial<PerformanceBody>) =>
    api.put<PerformanceItem>(`/v1/events/performances/${encodeURIComponent(id)}`, body),

  remove: (id: string) =>
    api.delete<Record<string, unknown>>(`/v1/events/performances/${encodeURIComponent(id)}`),
};

// ====================================================================
// Upload API helpers
// ====================================================================

export const uploadApi = {
  image: async (file: File, module: string): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = getApiBaseUrl();
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/image?module=${encodeURIComponent(module)}`, {
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
  video: async (file: File, module: string): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = getApiBaseUrl();
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/video?module=${encodeURIComponent(module)}`, {
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
  file: async (file: File, module: string): Promise<{ url: string; filename: string; path: string }> => {
    const API_URL = getApiBaseUrl();
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/file?module=${encodeURIComponent(module)}`, {
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
// Content backup API helpers
// ====================================================================

export interface BackupInfo {
  filename: string;
  size: number;
  created_at: string;
  format_version: number;
  app_version: string;
  schema_revision: string;
}

export interface BackupListResponse {
  items: BackupInfo[];
}

export interface BackupRestoreResponse {
  message: string;
  pre_restore_backup: string;
  restored_database: boolean;
  restored_files: number;
}

function backupAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readBackupFetchError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null);
  if (payload) return getErrorMessage(payload);
  const text = await response.text().catch(() => '');
  return text || fallback;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || null;
}

export const backupApi = {
  list: () => api.get<BackupListResponse>('/v1/backups/list'),

  exportSnapshot: async (): Promise<string> => {
    const API_URL = getApiBaseUrl();
    const response = await fetch(`${API_URL}/api/v1/backups/export`, {
      method: 'GET',
      headers: backupAuthHeaders(),
    });

    if (!response.ok) {
      const message = await readBackupFetchError(response, 'Backup export failed');
      throw new Error(message);
    }

    const blob = await response.blob();
    const filename =
      filenameFromDisposition(response.headers.get('content-disposition')) ||
      `mulandance-content-manual-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return filename;
  },

  restore: async (file: File): Promise<BackupRestoreResponse> => {
    const API_URL = getApiBaseUrl();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/backups/restore`, {
      method: 'POST',
      headers: backupAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const message = await readBackupFetchError(response, 'Backup restore failed');
      throw new Error(message);
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
  site: (locale?: string) => api.get<SystemSettings>(`/v1/settings/site${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  siteAll: () => api.get<SystemSettings>('/v1/settings/site/all'),
  siteDraft: () => api.get<SystemSettingsDraftResponse>('/v1/settings/site/draft'),
  saveSiteDraft: (body: SystemSettings) =>
    api.put<SystemSettingsDraftResponse>('/v1/settings/site/draft', body),
  publishSite: () => api.post<SystemSettingsDraftResponse>('/v1/settings/site/publish', {}),
  updateSite: (body: SystemSettings) => api.put<SystemSettings>('/v1/settings/site', body),
  schoolPolicy: (locale = 'zh') =>
    api.get<SchoolPolicy>(`/v1/settings/school-policy?locale=${encodeURIComponent(locale)}`),
  schoolPolicies: () => api.get<SchoolPolicyBundle>('/v1/settings/school-policy/all'),
  updateSchoolPolicies: (body: SchoolPolicyBundle) =>
    api.put<SchoolPolicyBundle>('/v1/settings/school-policy', body),
  ai: () => api.get<AiProviderSettings>('/v1/settings/ai'),
  aiModels: () => api.get<{ models: string[] }>('/v1/settings/ai/models'),
  testAiModels: (body: { api_base_url: string; api_key?: string }) => api.post<{ models: string[] }>('/v1/settings/ai/models', body),
  updateAi: (body: AiProviderSettingsUpdate) =>
    api.put<AiProviderSettings>('/v1/settings/ai', body),
};

// ====================================================================
// Admin accounts API helpers
// ====================================================================

export type AdminRole = 'super_admin' | 'admin';

export interface AdminAccount {
  id: string;
  email: string;
  role: AdminRole;
  first_name: string;
  last_name: string;
  nickname_zh: string;
  nickname_en: string;
  nickname_fr: string;
  is_active: boolean;
  created_at: string;
  phone?: string | null;
  translations?: LocalizedFieldMap;
  permissions: Record<string, { view: boolean; manage: boolean }>;
  account_type?: 'teacher' | 'staff_admin' | 'parent' | 'student' | 'alumni' | null;
  provisioning_status: 'pending' | 'active' | 'rejected';
  logto_linked: boolean;
}

export interface AdminAccountBody {
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname_zh?: string;
  nickname_en?: string;
  nickname_fr?: string;
  is_active?: boolean;
  phone?: string;
  account_type?: 'teacher' | 'staff_admin' | 'parent' | 'student' | 'alumni' | null;
  provisioning_status?: 'pending' | 'active' | 'rejected';
}

export interface AdminAccountListResponse {
  items: AdminAccount[];
  total: number;
  limit: number;
  offset: number;
}

export interface PortalUser {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'alumni' | 'public' | AdminRole;
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export const usersApi = {
  me: () => api.get<AdminAccount>('/v1/users/me'),
  portalMe: () => api.get<PortalUser>('/v1/users/me'),
  updatePortalMe: (body: { first_name?: string; last_name?: string; phone?: string }) =>
    api.put<PortalUser>('/v1/users/me', body),
  updateMe: (body: {
    first_name?: string;
    last_name?: string;
    nickname_zh?: string;
    nickname_en?: string;
    nickname_fr?: string;
    phone?: string;
  }) => api.put<AdminAccount>('/v1/users/me', body),
  adminAccounts: (params?: {
    search?: string;
    status?: 'all' | 'active' | 'disabled';
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<AdminAccountListResponse>(`/v1/users/admin/accounts${qs ? '?' + qs : ''}`);
  },
  createAdminAccount: (body: Required<Pick<AdminAccountBody, 'email' | 'first_name' | 'last_name'>> & AdminAccountBody) =>
    api.post<AdminAccount>('/v1/users/admin/accounts', body),
  updateAdminAccount: (id: string, body: AdminAccountBody) =>
    api.put<AdminAccount>(`/v1/users/admin/accounts/${id}`, body),
  permissionCatalog: () => api.get<PermissionCatalogItem[]>('/v1/users/permissions/catalog'),
  accountPermissions: (id: string) =>
    api.get<AccountPermissionsResponse>(`/v1/users/admin/accounts/${id}/permissions`),
  updateAccountPermissions: (id: string, permissions: PermissionGrant[]) =>
    api.put<AccountPermissionsResponse>(`/v1/users/admin/accounts/${id}/permissions`, { permissions }),
  permissionPresets: () => api.get<PermissionPreset[]>('/v1/users/admin/permission-presets'),
  createPermissionPreset: (body: PermissionPresetBody) =>
    api.post<PermissionPreset>('/v1/users/admin/permission-presets', body),
  updatePermissionPreset: (id: string, body: PermissionPresetBody) =>
    api.put<PermissionPreset>(`/v1/users/admin/permission-presets/${id}`, body),
  deletePermissionPreset: (id: string) =>
    api.delete<{ detail: string }>(`/v1/users/admin/permission-presets/${id}`),
  logtoBindingRequests: (status = 'pending') =>
    api.get<LogtoBindingRequest[]>(`/v1/users/admin/logto-binding-requests?status=${encodeURIComponent(status)}`),
  approveLogtoBinding: (id: string, account_type: 'teacher' | 'staff_admin', note = '') =>
    api.post<LogtoBindingRequest>(`/v1/users/admin/logto-binding-requests/${id}/approve`, { account_type, note }),
  rejectLogtoBinding: (id: string, note = '') =>
    api.post<LogtoBindingRequest>(`/v1/users/admin/logto-binding-requests/${id}/reject`, { note }),
  accountTypeDefaults: () => api.get<AccountTypeDefault[]>('/v1/users/admin/account-type-defaults'),
  updateAccountTypeDefault: (accountType: AccountTypeDefault['account_type'], preset_id?: string | null) =>
    api.put<AccountTypeDefault>(`/v1/users/admin/account-type-defaults/${accountType}`, { preset_id: preset_id || null }),
  syncAccountTypeDefault: (accountType: AccountTypeDefault['account_type'], user_ids: string[] = []) =>
    api.post<{ updated: number }>(`/v1/users/admin/account-type-defaults/${accountType}/sync`, { confirm: true, user_ids }),
};

export interface AccountTypeDefault {
  account_type: 'teacher' | 'staff_admin' | 'parent' | 'student' | 'alumni';
  preset_id?: string | null;
}

export interface LogtoBindingRequest {
  id: string;
  user_id: string;
  email: string;
  logto_subject: string;
  requested_account_type?: string | null;
  status: string;
  review_note: string;
  created_at: string;
  reviewed_at?: string | null;
}

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
  translations?: LocalizedFieldMap;
}

export interface AiProviderSettings {
  enabled: boolean;
  thinking_enabled: boolean;
  image_enabled: boolean;
  provider: string;
  api_base_url: string;
  model: string;
  timeout_seconds: number;
  feature_models: Record<string, string>;
  api_key_set: boolean;
  api_key_masked: string;
}

export interface AiProviderSettingsUpdate {
  enabled: boolean;
  thinking_enabled: boolean;
  image_enabled: boolean;
  provider: string;
  api_base_url: string;
  model: string;
  timeout_seconds: number;
  feature_models: Record<string, string>;
  api_key?: string;
  clear_api_key?: boolean;
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

export type PricingCatalogKind = 'program' | 'rental';
export type PricingBlockType = 'info' | 'payment' | 'notice' | 'cta';
export type PricingTranslations = Partial<Record<LocaleCode, Record<string, string | string[]>>>;

export interface PricingOption {
  id?: string;
  label: string;
  amount: string;
  currency: string;
  unit: string;
  note: string;
  sort_order: number;
  translations: PricingTranslations;
}

export interface PricingPlan {
  id?: string;
  program_id?: string | null;
  room_id?: string | null;
  title: string;
  description: string;
  badge: string;
  image_url: string;
  details: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  translations: PricingTranslations;
  options: PricingOption[];
  program_name?: string;
  room_name?: string;
  studio_name?: string;
  room_is_rentable?: boolean;
}

export interface PricingContentBlock {
  id?: string;
  block_type: PricingBlockType;
  title: string;
  body: string;
  items: string[];
  is_active: boolean;
  sort_order: number;
  translations: PricingTranslations;
}

export interface PricingCatalog {
  id?: string;
  kind: PricingCatalogKind;
  title: string;
  subtitle: string;
  translations: PricingTranslations;
  plans: PricingPlan[];
  blocks: PricingContentBlock[];
  is_dirty?: boolean;
  published_at?: string | null;
}

export const pricingApi = {
  publicCatalog: (kind: PricingCatalogKind, locale: string) =>
    api.get<PricingCatalog>(`/v1/pricing/public/${kind}?locale=${encodeURIComponent(locale)}`),
  adminCatalog: (kind: PricingCatalogKind) => api.get<PricingCatalog>(`/v1/pricing/admin/${kind}`),
  saveDraft: (kind: PricingCatalogKind, body: PricingCatalog) =>
    api.put<PricingCatalog>(`/v1/pricing/admin/${kind}`, body),
  publish: (kind: PricingCatalogKind) =>
    api.post<{ catalog: PricingCatalog; warnings: string[] }>(`/v1/pricing/admin/${kind}/publish`, {}),
};

export interface HomepageSection {
  title: string;
  subtitle: string;
  link_label: string;
  is_enabled: boolean;
}

export type HomepageBlockType = 'hero' | 'stats' | 'performances' | 'programs' | 'news' | 'media' | 'cta';
export interface HomepageBlock {
  id: string;
  type: HomepageBlockType;
  title: string;
  subtitle: string;
  body: string;
  media_url: string;
  media_type: 'auto' | 'image' | 'video';
  layout: 'default' | 'media_left' | 'media_right' | 'full_bleed';
  link: HomepageButton;
  is_enabled: boolean;
}

export interface HomepageSections {
  programs: HomepageSection;
  performances: HomepageSection;
  news: HomepageSection;
}

export interface HomepageSettings {
  hero_slides: HomepageHeroSlide[];
  stats: HomepageStat[];
  sections: HomepageSections;
  cta: HomepageCta;
  blocks?: HomepageBlock[];
}

export type HomepageSettingsBundle = Record<LocaleCode, HomepageSettings>;

export const homepageApi = {
  get: (locale?: string) => api.get<HomepageSettings>(`/v1/settings/homepage${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  getAll: () => api.get<HomepageSettingsBundle>('/v1/settings/homepage/all'),
  update: (body: HomepageSettings, locale?: string) => api.put<HomepageSettings>(`/v1/settings/homepage${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, body),
  updateAll: (body: HomepageSettingsBundle) => api.put<HomepageSettingsBundle>('/v1/settings/homepage/all', body),
  draft: () => api.get<{ bundle: HomepageSettingsBundle; is_dirty: boolean; published_at?: string | null }>('/v1/settings/homepage/draft'),
  saveDraft: (body: HomepageSettingsBundle) => api.put<{ bundle: HomepageSettingsBundle; is_dirty: boolean; published_at?: string | null }>('/v1/settings/homepage/draft', body),
  publish: () => api.post<{ bundle: HomepageSettingsBundle; is_dirty: boolean; published_at?: string | null }>('/v1/settings/homepage/publish', {}),
};

export type HomepageV2BlockType =
  | 'hero_carousel'
  | 'video_hero'
  | 'media_story'
  | 'video_player'
  | 'image_marquee'
  | 'masonry_gallery'
  | 'awards_showcase'
  | 'sponsor_wall'
  | 'campaign'
  | 'testimonials'
  | 'statistics'
  | 'feature_grid'
  | 'program_directory'
  | 'performances'
  | 'latest_news'
  | 'timeline'
  | 'editorial_quote'
  | 'cta';

export interface HomepageV2LocalizedContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  label: string;
  caption: string;
  alt_text: string;
  primary_label: string;
  secondary_label: string;
  link_label: string;
}

export type HomepageV2Translations = Record<LocaleCode, HomepageV2LocalizedContent>;
export interface HomepageV2Link { href: string; new_tab: boolean; }
export interface HomepageV2Schedule { start_at: string | null; end_at: string | null; timezone: string; }
export interface HomepageV2Design {
  theme: 'white' | 'soft_lilac' | 'dark_plum' | 'transparent';
  width: 'contained' | 'wide' | 'full';
  spacing: 'compact' | 'normal' | 'spacious';
  alignment: 'left' | 'center' | 'right';
  media_ratio: 'auto' | 'square' | 'portrait' | 'landscape' | 'cinematic';
  overlay: 'none' | 'light' | 'medium' | 'dark';
}
export interface HomepageV2Behavior {
  animation: 'none' | 'fade_up' | 'stagger' | 'reveal' | 'soft_zoom';
  autoplay: boolean;
  loop: boolean;
  speed: 'slow' | 'normal' | 'fast';
}
export interface HomepageV2DataSource {
  source: 'none' | 'programs' | 'performances' | 'news';
  limit: number;
  sort: 'default' | 'newest' | 'oldest' | 'manual';
  category: string;
}
export interface HomepageV2Item {
  id: string;
  is_enabled: boolean;
  media_type: 'image' | 'video' | 'logo' | 'none';
  media_url: string;
  mobile_url: string;
  poster_url: string;
  focal_x: number;
  focal_y: number;
  content: HomepageV2Translations;
  link: HomepageV2Link;
  schedule: HomepageV2Schedule;
  meta: Record<string, unknown>;
}
export interface HomepageV2Block {
  id: string;
  type: HomepageV2BlockType;
  schema_version: number;
  admin_label: string;
  is_enabled: boolean;
  schedule: HomepageV2Schedule;
  design: HomepageV2Design;
  behavior: HomepageV2Behavior;
  content: HomepageV2Translations;
  items: HomepageV2Item[];
  primary_link: HomepageV2Link;
  secondary_link: HomepageV2Link;
  data_source: HomepageV2DataSource;
  config: Record<string, unknown>;
}
export interface HomepageDocumentV2 { version: 2; blocks: HomepageV2Block[]; }
export interface HomepageV2DraftResponse {
  document: HomepageDocumentV2;
  is_dirty: boolean;
  published_at?: string | null;
  warnings: string[];
}

export const homepageV2Api = {
  get: (locale?: string) => api.get<HomepageDocumentV2>(`/v1/settings/homepage/v2${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  draft: () => api.get<HomepageV2DraftResponse>('/v1/settings/homepage/v2/draft'),
  saveDraft: (body: HomepageDocumentV2) => api.put<HomepageV2DraftResponse>('/v1/settings/homepage/v2/draft', body),
  publish: () => api.post<HomepageV2DraftResponse>('/v1/settings/homepage/v2/publish', {}),
};

// ====================================================================
// Faculty API helpers
// ====================================================================

export interface FacultyMember {
  id: string;
  user_id?: string | null;
  is_self_managed?: boolean;
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
  translations?: LocalizedFieldMap;
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
  translations?: LocalizedFieldMap;
}

export const facultyApi = {
  list: (locale?: string) => api.get<FacultyMember[]>(`/v1/faculty${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  adminList: () => api.get<FacultyMember[]>('/v1/faculty/admin/list'),
  create: (body: FacultyMemberBody) => api.post<FacultyMember>('/v1/faculty', body),
  update: (id: string, body: Partial<FacultyMemberBody>) =>
    api.put<FacultyMember>(`/v1/faculty/${id}`, body),
  remove: (id: string) => api.delete<Record<string, unknown>>(`/v1/faculty/${id}`),
  myProfile: () => api.get<FacultyMember>('/v1/faculty/me/profile'),
  updateMyProfile: (body: Omit<FacultyMemberBody, 'is_active' | 'order_index'>) =>
    api.put<FacultyMember>('/v1/faculty/me/profile', body),
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
  translations?: LocalizedFieldMap;
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
  translations?: LocalizedFieldMap;
}

export const programApi = {
  list: (locale?: string) => api.get<ProgramItem[]>(`/v1/programs${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
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
  translations?: LocalizedFieldMap;
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
  translations?: LocalizedFieldMap;
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
  list: (params?: { room?: ClassroomRoom; status?: ClassroomBookingStatus; locale?: string }) => {
    const query = new URLSearchParams();
    if (params?.room) query.set('room', params.room);
    if (params?.status) query.set('status', params.status);
    if (params?.locale) query.set('locale', params.locale);
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
  translations?: LocalizedFieldMap;
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
  translations?: LocalizedFieldMap;
}

export interface SchoolPolicy {
  title: string;
  body_markdown: string;
  updated_at?: string;
}

export interface SchoolPolicyBundle {
  zh: SchoolPolicy;
  en: SchoolPolicy;
  fr: SchoolPolicy;
}

export const scheduleApi = {
  list: (params?: { includeInactive?: boolean; locale?: string }) => {
    const query = new URLSearchParams();
    if (params?.includeInactive) query.set('include_inactive', 'true');
    if (params?.locale) query.set('locale', params.locale);
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

// ====================================================================
// Unified scheduling API
// ====================================================================

export type ScheduleBookingType = 'solo' | 'duet' | 'trio' | 'group' | 'rehearsal' | 'makeup' | 'private' | 'external_rental' | 'room_lock';
export type ScheduleBookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface StudioRoom {
  id: string;
  studio_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  is_rentable: boolean;
}

export interface Studio { id: string; name: string; is_active: boolean; }

export interface CourseTemplate {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  allow_unassigned_teacher?: boolean;
  allow_unassigned_room?: boolean;
  translations?: LocalizedFieldMap;
  offering_count: number;
  is_ai_draft?: boolean;
  draft_questions?: FixedCourseImportIssue[];
  draft_assumptions?: FixedCourseImportIssue[];
  unresolved_question_count?: number;
}

export interface CourseTemplateBody {
  title: string;
  description: string;
  is_active: boolean;
  allow_unassigned_teacher?: boolean;
  allow_unassigned_room?: boolean;
  translations?: LocalizedFieldMap;
}

export type SitePageSlug = 'about' | 'contact';
export type SitePageBlockType = 'hero' | 'rich_text' | 'bullet_list' | 'media_story' | 'values_grid' | 'contact_details' | 'office_hours' | 'contact_form' | 'map_link' | 'cta';
export interface SitePageLocalizedContent {
  eyebrow: string; title: string; subtitle: string; body: string; label: string;
  caption: string; alt_text: string; primary_label: string; secondary_label: string;
  placeholder: string; success_message: string; name_label: string; email_label: string;
  subject_label: string; message_label: string;
}
export interface SitePageTranslations { zh: SitePageLocalizedContent; en: SitePageLocalizedContent; fr: SitePageLocalizedContent; }
export interface SitePageBlock {
  id: string; type: SitePageBlockType; admin_label: string; is_enabled: boolean;
  content: SitePageTranslations; items: Array<Record<string, unknown>>;
  image_url: string; mobile_image_url: string; focal_point: string;
  decorative_image: boolean; href: string; design: Record<string, unknown>;
}
export interface SitePageDocument { slug: SitePageSlug; schema_version: number; hero: SitePageBlock; blocks: SitePageBlock[]; }
export interface SitePagePublicResponse { page: SitePageDocument; locale: string; contact: { email: string; phone: string; address: string; social: Record<string, string> }; }
export interface SitePageDraftResponse { page: SitePageDocument; is_dirty: boolean; published_at?: string | null; warnings: string[]; }

export const pagesApi = {
  public: (slug: SitePageSlug, locale?: string) => api.get<SitePagePublicResponse>(`/v1/pages/${slug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  draft: (slug: SitePageSlug) => api.get<SitePageDraftResponse>(`/v1/pages/admin/${slug}/draft`),
  saveDraft: (slug: SitePageSlug, page: SitePageDocument) => api.put<SitePageDraftResponse>(`/v1/pages/admin/${slug}/draft`, page),
  publish: (slug: SitePageSlug) => api.post<SitePageDraftResponse>(`/v1/pages/admin/${slug}/publish`, {}),
};

export interface PermissionCatalogItem {
  key: string;
  group: string;
  parent?: string | null;
  label_key: string;
}

export interface PermissionGrant {
  key: string;
  can_view: boolean;
  can_manage: boolean;
}

export interface AccountPermissionsResponse {
  user_id: string;
  permissions: PermissionGrant[];
  effective_permissions: Record<string, { view: boolean; manage: boolean }>;
}

export interface PermissionPresetBody {
  name: string;
  description: string;
  permissions: PermissionGrant[];
}

export interface PermissionPreset extends PermissionPresetBody {
  id: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SystemSettingsDraftResponse {
  settings: SystemSettings;
  is_dirty: boolean;
  published_at?: string | null;
}

export interface CourseOfferingSlot {
  teacher_id?: string | null;
  room_id?: string | null;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  sort_order: number;
}

export interface CourseOffering {
  id: string;
  course_template_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_public: boolean;
  slots: CourseOfferingSlot[];
}

export interface CourseOfferingBody extends Omit<CourseOffering, 'id' | 'course_template_id'> {}

export interface FixedClassPlan {
  id: string;
  title: string;
  description: string;
  teacher_id?: string | null;
  room_id: string;
  day_of_week: number;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  is_active: boolean;
  translations?: LocalizedFieldMap;
}

export interface FixedClassPlanBody extends Omit<FixedClassPlan, 'id'> {}

export interface ScheduleBooking {
  id: string;
  room_id: string;
  teacher_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  booking_type: ScheduleBookingType;
  title: string;
  student_name: string;
  participant_count: number;
  notes: string;
  is_public: boolean;
  status: ScheduleBookingStatus;
  is_locked: boolean;
  created_by_id?: string | null;
  external_request_id?: string | null;
}

export interface ScheduleBookingBody extends Omit<ScheduleBooking, 'id' | 'status' | 'is_locked' | 'created_by_id'> {}

export interface ScheduleBookingBatchItem {
  id: string;
  booking: ScheduleBookingBody;
}

export interface ScheduleCalendarEvent {
  id: string;
  source: 'fixed' | 'booking';
  date: string;
  room_id: string;
  room_name: string;
  teacher_id?: string | null;
  start_time: string;
  end_time: string;
  title: string;
  booking_type?: ScheduleBookingType;
  status: string;
  is_locked: boolean;
  is_public: boolean;
  description: string;
}

export interface CoordinationRequestBody {
  booking_id?: string | null;
  requested_date: string;
  requested_room_id?: string | null;
  requested_start_time: string;
  requested_end_time: string;
  message: string;
}

export type ExternalRentalRequestMode = 'single' | 'weekly';
export type ExternalRentalRequestStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface PublicRentalResource {
  id: string;
  studio_id: string;
  studio_name: string;
  name: string;
}

export interface RoomOccupancy {
  room_id: string;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface ExternalRentalRequestBody {
  room_id: string;
  request_mode: ExternalRentalRequestMode;
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  title: string;
  applicant_name: string;
  applicant_contact: string;
  notes: string;
  captcha_token?: string;
  captcha_answer?: string;
}

export interface ExternalRentalRequest extends Omit<ExternalRentalRequestBody, 'captcha_token' | 'captcha_answer'> {
  id: string;
  status: ExternalRentalRequestStatus;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const unifiedScheduleApi = {
  studios: () => api.get<Studio[]>('/v1/schedule/studios'),
  createStudio: (body: Omit<Studio, 'id'>) => api.post<Studio>('/v1/schedule/studios', body),
  updateStudio: (id: string, body: Omit<Studio, 'id'>) => api.put<Studio>(`/v1/schedule/studios/${id}`, body),
  removeStudio: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/studios/${id}`),
  resources: (activeOnly = true) => api.get<StudioRoom[]>(`/v1/schedule/resources?active_only=${activeOnly}`),
  createRoom: (body: Omit<StudioRoom, 'id'>) => api.post<StudioRoom>('/v1/schedule/rooms', body),
  updateRoom: (id: string, body: Omit<StudioRoom, 'id'>) => api.put<StudioRoom>(`/v1/schedule/rooms/${id}`, body),
  removeRoom: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/rooms/${id}`),
  courseTemplates: () => api.get<CourseTemplate[]>('/v1/schedule/course-templates'),
  createCourseTemplate: (body: CourseTemplateBody) => api.post<CourseTemplate>('/v1/schedule/course-templates', body),
  updateCourseTemplate: (id: string, body: CourseTemplateBody) => api.put<CourseTemplate>(`/v1/schedule/course-templates/${id}`, body),
  createCourseDraft: (body: FixedCourseImportDraft) => api.post<CourseTemplate>('/v1/schedule/course-drafts', body),
  removeCourseTemplate: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/course-templates/${id}`),
  courseOfferings: (templateId: string) => api.get<CourseOffering[]>(`/v1/schedule/course-templates/${templateId}/offerings`),
  createCourseOffering: (templateId: string, body: CourseOfferingBody) => api.post<CourseOffering>(`/v1/schedule/course-templates/${templateId}/offerings`, body),
  updateCourseOffering: (id: string, body: CourseOfferingBody) => api.put<CourseOffering>(`/v1/schedule/course-offerings/${id}`, body),
  removeCourseOffering: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/course-offerings/${id}`),
  publicClasses: (start: string, end: string, locale = 'zh') => api.get<ScheduleCalendarEvent[]>(`/v1/schedule/public/classes?start=${start}&end=${end}&locale=${encodeURIComponent(locale)}`),
  calendar: (start: string, end: string, mine = false) => api.get<ScheduleCalendarEvent[]>(`/v1/schedule/calendar?start=${start}&end=${end}&mine=${mine}`),
  fixedPlans: () => api.get<FixedClassPlan[]>('/v1/schedule/fixed-plans'),
  createFixedPlan: (body: FixedClassPlanBody) => api.post<FixedClassPlan>('/v1/schedule/fixed-plans', body),
  updateFixedPlan: (id: string, body: FixedClassPlanBody) => api.put<FixedClassPlan>(`/v1/schedule/fixed-plans/${id}`, body),
  removeFixedPlan: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/fixed-plans/${id}`),
  addFixedException: (planId: string, body: { date: string; kind: 'cancel' | 'replace'; room_id?: string; start_time?: string; end_time?: string; title?: string; description?: string }) => api.post(`/v1/schedule/fixed-plans/${planId}/exceptions`, body),
  bookings: (start: string, end: string, mine = false) => api.get<ScheduleBooking[]>(`/v1/schedule/bookings?start=${start}&end=${end}&mine=${mine}`),
  createBooking: (body: ScheduleBookingBody) => api.post<ScheduleBooking>('/v1/schedule/bookings', body),
  batchUpdateBookings: (items: ScheduleBookingBatchItem[]) => api.put<ScheduleBooking[]>('/v1/schedule/bookings/batch', { items }),
  updateBooking: (id: string, body: ScheduleBookingBody & Partial<Pick<ScheduleBooking, 'status' | 'is_locked'>>) => api.put<ScheduleBooking>(`/v1/schedule/bookings/${id}`, body),
  cancelBooking: (id: string) => api.delete<Record<string, unknown>>(`/v1/schedule/bookings/${id}`),
  createCoordination: (body: CoordinationRequestBody) => api.post('/v1/schedule/coordination-requests', body),
  coordinationRequests: () => api.get('/v1/schedule/coordination-requests'),
  resolveCoordination: (id: string, status: 'approved' | 'rejected', resolution_note = '') => api.put(`/v1/schedule/coordination-requests/${id}`, { status, resolution_note }),
  swapRooms: (first: string, second: string) => api.post(`/v1/schedule/bookings/${first}/swap/${second}`, {}),
  rentalResources: () => api.get<PublicRentalResource[]>('/v1/schedule/public/rental-resources'),
  roomOccupancy: (start: string, end: string, roomId?: string) => api.get<RoomOccupancy[]>(`/v1/schedule/public/room-occupancy?start=${start}&end=${end}${roomId ? `&room_id=${encodeURIComponent(roomId)}` : ''}`),
  externalRentalRequests: (status?: ExternalRentalRequestStatus) => api.get<ExternalRentalRequest[]>(`/v1/schedule/external-rental-requests${status ? `?status=${status}` : ''}`),
  createExternalRentalRequest: (body: ExternalRentalRequestBody) => api.post<ExternalRentalRequest>('/v1/schedule/external-rental-requests', body),
  updateExternalRentalRequest: (id: string, body: ExternalRentalRequestBody) => api.put<ExternalRentalRequest>(`/v1/schedule/external-rental-requests/${id}`, body),
  approveExternalRentalRequest: (id: string, note = '') => api.post<ExternalRentalRequest>(`/v1/schedule/external-rental-requests/${id}/approve`, { note }),
  rejectExternalRentalRequest: (id: string, note = '') => api.post<ExternalRentalRequest>(`/v1/schedule/external-rental-requests/${id}/reject`, { note }),
  cancelExternalRentalRequest: (id: string) => api.post<ExternalRentalRequest>(`/v1/schedule/external-rental-requests/${id}/cancel`, {}),
};
