export interface HelpdeskTicketServer {
  id: string;
  ticketNo: string;
  userId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  assignedTo?: string | null;
  status: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    erpId: string;
    username: string;
  };
  messages?: HelpdeskMessageServer[];
  auditTrail?: any[];
}

export interface HelpdeskMessageServer {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  messageType: 'USER_MESSAGE' | 'STAFF_RESPONSE' | 'INTERNAL_NOTE';
  attachmentUrl?: string;
  createdAt: string;
}

export interface PaginatedHelpdeskResult {
  data: HelpdeskTicketServer[];
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

export const helpdeskService = {
  async getTicketsServer(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    my?: boolean;
    assignedOnly?: boolean;
  }): Promise<PaginatedHelpdeskResult> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.my) query.append('my', 'true');
    if (params.assignedOnly) query.append('assignedOnly', 'true');

    const res = await fetch(`/api/v1/it/tickets?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load tickets: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async getTicketByIdServer(id: string): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load ticket details: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async createTicketServer(dto: {
    category: string;
    title: string;
    description: string;
    priority?: string;
    attachmentUrl?: string;
    departmentId?: string;
  }): Promise<HelpdeskTicketServer> {
    const res = await fetch('/api/v1/it/tickets', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create ticket.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async addCommentServer(
    ticketId: string,
    dto: {
      message: string;
      messageType?: 'USER_MESSAGE' | 'STAFF_RESPONSE' | 'INTERNAL_NOTE';
      attachmentUrl?: string;
    }
  ): Promise<HelpdeskMessageServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to send reply message.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async assignTicketServer(ticketId: string, assignedToUserId: string, remarks?: string): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedToUserId, remarks }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign ticket.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async updateStatusServer(
    ticketId: string,
    status: string,
    remarks?: string,
    resolution?: string
  ): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, remarks, resolution }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update ticket status.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async resolveTicketServer(ticketId: string, resolution: string): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolution }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to resolve ticket.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async closeTicketServer(ticketId: string, remarks?: string): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/close`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to close ticket.');
    }

    const json = await res.json();
    return json.data || json;
  },

  async reopenTicketServer(ticketId: string, remarks?: string): Promise<HelpdeskTicketServer> {
    const res = await fetch(`/api/v1/it/tickets/${ticketId}/reopen`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reopen ticket.');
    }

    const json = await res.json();
    return json.data || json;
  },
};
