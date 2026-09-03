export interface CouncilOrganization {
  id: string;
  code: string;
  name: string;
  committeeType: string;
  chairperson?: string | null;
  secretary?: string | null;
  status: string;
  createdAt: string;
  _count?: {
    members: number;
    meetings: number;
  };
}

export interface CouncilMember {
  id: string;
  committeeId: string;
  userId?: string | null;
  memberName: string;
  role: string;
  joinedAt: string;
  committee?: {
    id: string;
    name: string;
    code: string;
    committeeType: string;
  };
}

export interface CouncilMeeting {
  id: string;
  meetingNo: string;
  committeeId: string;
  meetingDate: string;
  venue?: string | null;
  agenda: string;
  minutes?: string | null;
  status: string;
  committee?: {
    id: string;
    name: string;
    code: string;
  };
  actionItems?: Array<{
    id: string;
    itemNumber: string;
    description: string;
    responsibleDepartment: string;
    responsiblePerson: string;
    deadline: string;
    status: string;
    complianceRemarks?: string | null;
  }>;
}

export interface EventProposal {
  id: string;
  requestNo: string;
  title: string;
  category: string;
  applicantEntity: string;
  instituteId?: string | null;
  departmentId?: string | null;
  submittedDate: string;
  status: string;
  actionedByUserId?: string | null;
  actionedByName?: string | null;
  actionedAt?: string | null;
  metadata?: {
    eventDate?: string;
    venue?: string;
    estimatedBudget?: number;
    expectedParticipants?: number;
    facultyCoordinator?: string;
    description?: string;
    reviewRemarks?: string;
    reviewedBy?: string;
  };
}

export interface CouncilDashboardMetrics {
  activeCouncilsCount: number;
  activeClubsCount: number;
  totalOfficeBearersCount: number;
  totalActiveMembersCount: number;
  upcomingEventsCount: number;
  pendingProposalsCount: number;
  pendingMoMsCount: number;
  actionItemsDueSoonCount: number;
  recentApprovedProposals: Array<{
    id: string;
    requestNo: string;
    title: string;
    applicantEntity: string;
    actionedAt: string;
    actionedByName: string;
    eventDate?: string;
    venue?: string;
  }>;
  timestamp: string;
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

export const studentCouncilService = {
  // 1. Council Directory
  async getCouncils(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/v1/student-council/councils?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load councils (${res.statusText})`);
    return res.json();
  },

  async createCouncil(payload: {
    name: string;
    code: string;
    academicYear?: string;
    chairperson?: string;
    secretary?: string;
  }) {
    const res = await fetch('/api/v1/student-council/councils', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create council (${res.statusText})`);
    }
    return res.json();
  },

  // 2. Clubs & Cells
  async getClubs(params?: { search?: string; committeeType?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.committeeType) query.set('committeeType', params.committeeType);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/v1/student-council/clubs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load clubs (${res.statusText})`);
    return res.json();
  },

  async createClub(payload: {
    name: string;
    code: string;
    committeeType: string;
    chairperson?: string;
    secretary?: string;
  }) {
    const res = await fetch('/api/v1/student-council/clubs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to register club (${res.statusText})`);
    }
    return res.json();
  },

  async getOrganizationDetails(id: string) {
    const res = await fetch(`/api/v1/student-council/organizations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch organization (${res.statusText})`);
    const json = await res.json();
    return json.data || json;
  },

  // 3. Members & Office Bearers
  async assignMember(payload: {
    committeeId: string;
    memberName: string;
    userId?: string;
    role?: string;
    department?: string;
  }) {
    const res = await fetch('/api/v1/student-council/members', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to assign member (${res.statusText})`);
    }
    return res.json();
  },

  async removeMember(memberId: string) {
    const res = await fetch(`/api/v1/student-council/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to remove member (${res.statusText})`);
    return res.json();
  },

  async getMembers(orgId: string, params?: { search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/v1/student-council/organizations/${orgId}/members?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load members (${res.statusText})`);
    return res.json();
  },

  async getOfficeBearers(params?: { committeeType?: string }) {
    const query = new URLSearchParams();
    if (params?.committeeType) query.set('committeeType', params.committeeType);

    const res = await fetch(`/api/v1/student-council/office-bearers?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load office bearers (${res.statusText})`);
    const json = await res.json();
    return json.data || json;
  },

  // 4. Meetings & MoM
  async getMeetings(committeeId?: string, params?: { status?: string }) {
    const query = new URLSearchParams();
    if (committeeId) query.set('committeeId', committeeId);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`/api/v1/student-council/meetings?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load meetings (${res.statusText})`);
    const json = await res.json();
    return json.data || json;
  },

  async createMeeting(payload: {
    committeeId: string;
    meetingDate: string;
    venue?: string;
    agenda: string;
    minutes?: string;
    actionItems?: Array<{
      itemNumber: string;
      description: string;
      responsibleDepartment?: string;
      responsiblePerson?: string;
      deadline: string;
    }>;
  }) {
    const res = await fetch('/api/v1/student-council/meetings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to record meeting (${res.statusText})`);
    }
    return res.json();
  },

  async updateMeetingStatus(meetingId: string, payload: { status: string; minutes?: string }) {
    const res = await fetch(`/api/v1/student-council/meetings/${meetingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update meeting status (${res.statusText})`);
    return res.json();
  },

  // 5. Event Proposals
  async getEventProposals(params?: { status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`/api/v1/student-council/event-proposals?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load event proposals (${res.statusText})`);
    const json = await res.json();
    return json.data || json;
  },

  async createEventProposal(payload: {
    title: string;
    organizingClub: string;
    eventDate: string;
    venue?: string;
    estimatedBudget?: number;
    expectedParticipants?: number;
    facultyCoordinator?: string;
    description?: string;
  }) {
    const res = await fetch('/api/v1/student-council/event-proposals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to submit proposal (${res.statusText})`);
    }
    return res.json();
  },

  async reviewEventProposal(proposalId: string, payload: { status: string; remarks?: string }) {
    const res = await fetch(`/api/v1/student-council/event-proposals/${proposalId}/review`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to review proposal (${res.statusText})`);
    }
    return res.json();
  },

  // 6. Dashboard Metrics
  async getDashboardMetrics(): Promise<CouncilDashboardMetrics> {
    const res = await fetch('/api/v1/student-council/dashboard', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load dashboard metrics (${res.statusText})`);
    const json = await res.json();
    return json.data || json;
  },
};
