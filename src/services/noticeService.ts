export interface ServerNotice {
  id: string;
  noticeNo: string;
  title: string;
  content: string;
  category: 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'FEES' | 'EVENT' | 'ADMINISTRATIVE' | 'GENERAL' | 'CIRCULAR' | string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' | string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED' | string;
  scopeType: 'UNIVERSITY_WIDE' | 'INSTITUTE_WIDE' | 'DEPARTMENT_WIDE' | 'ROLE_BASED' | 'TARGETED' | string;
  targetRole?: string;
  targetInstituteId?: string;
  targetDepartmentId?: string;
  publishedBy: string;
  isPinned: boolean;
  publishAt: string;
  expiresAt?: string | null;
  attachmentUrl?: string | null;
  publishedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNoticesResult {
  data: ServerNotice[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const getAuthHeaders = (): HeadersInit => {
  const token =
    localStorage.getItem('sscit_auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const noticeService = {
  async getNoticesServer(params: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
    search?: string;
    status?: string;
  }): Promise<PaginatedNoticesResult> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.priority && params.priority !== 'ALL') query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);

    const res = await fetch(`/api/v1/notices?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load notices: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async getNoticeByIdServer(id: string): Promise<ServerNotice> {
    const res = await fetch(`/api/v1/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load notice details: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async createNoticeServer(dto: {
    title: string;
    content: string;
    category: string;
    priority?: string;
    isPinned?: boolean;
    scopeType?: string;
    targetInstituteId?: string;
    targetDepartmentId?: string;
    targetRole?: string;
    publishAt?: string;
    expiresAt?: string;
    publishedBy?: string;
    attachmentUrl?: string;
    status?: string;
  }): Promise<ServerNotice> {
    const res = await fetch('/api/v1/notices', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to post notice.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async updateNoticeServer(id: string, dto: any): Promise<ServerNotice> {
    const res = await fetch(`/api/v1/notices/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update notice.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async publishNoticeServer(id: string): Promise<ServerNotice> {
    const res = await fetch(`/api/v1/notices/${id}/publish`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to publish notice.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async archiveNoticeServer(id: string): Promise<ServerNotice> {
    const res = await fetch(`/api/v1/notices/${id}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to archive notice.');
    }

    const json = await res.json();
    return json.data || json;
  },
};
