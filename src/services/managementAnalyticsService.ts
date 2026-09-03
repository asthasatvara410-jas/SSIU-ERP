export interface ManagementSummaryPayload {
  totalStudents: number;
  totalFacultyStaff: number;
  pendingNotesheets: number;
  approvedNotesheets: number;
  monthlyApprovedExpense: number;
  todayGatePassOutings: number;
  currentlyOutsideStudents: number;
  openHelpdeskTickets: number;
  appliedScope: {
    role: string;
    instituteId: string | null;
    departmentId: string | null;
  };
  timestamp: string;
}

export interface ManagementNotesheetsPayload {
  totalNotesheets: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  departmentWisePending: Array<{ department: string; count: number }>;
  departmentWiseTotal: Array<{ department: string; count: number }>;
  averageProcessingTimeHours: number;
  oldestPendingNotesheets: Array<{
    id: string;
    notesheetNumber: string;
    title: string;
    department: string;
    priority: string;
    status: string;
    estimatedCost: number;
    createdAt: string;
    ageDays: number;
  }>;
  timestamp: string;
}

export interface ManagementExpensesPayload {
  totalApprovedAmount: number;
  departmentWiseApprovedExpense: Array<{ department: string; amount: number }>;
  monthlyApprovedExpenseTrend: Array<{ month: string; amount: number }>;
  approvedVsPendingValue: {
    approvedValue: number;
    pendingValue: number;
    totalPipelineValue: number;
    approvedPercentage: number;
  };
  timestamp: string;
}

export interface ManagementGatePassPayload {
  todayOutings: number;
  dateRangeTotalOutings: number;
  averageDailyOutings: number;
  currentlyOutsideCount: number;
  returnedCount: number;
  departmentWiseOutings: Array<{ department: string; count: number }>;
  hostelWiseOutings: Array<{ hostel: string; count: number }>;
  dailyOutingTrend: Array<{ date: string; outings: number }>;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  timestamp: string;
}

export interface AnalyticsFilterParams {
  fromDate?: string;
  toDate?: string;
  instituteId?: string;
  departmentId?: string;
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

export const managementAnalyticsService = {
  async getSummary(params?: AnalyticsFilterParams): Promise<ManagementSummaryPayload> {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.instituteId && params.instituteId !== 'ALL') query.append('instituteId', params.instituteId);
    if (params?.departmentId && params.departmentId !== 'ALL') query.append('departmentId', params.departmentId);

    const res = await fetch(`/api/v1/analytics/management/summary?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load management summary (${res.statusText})`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async getNotesheets(params?: AnalyticsFilterParams): Promise<ManagementNotesheetsPayload> {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.instituteId && params.instituteId !== 'ALL') query.append('instituteId', params.instituteId);
    if (params?.departmentId && params.departmentId !== 'ALL') query.append('departmentId', params.departmentId);

    const res = await fetch(`/api/v1/analytics/management/notesheets?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load notesheets analytics (${res.statusText})`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async getExpenses(params?: AnalyticsFilterParams): Promise<ManagementExpensesPayload> {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.instituteId && params.instituteId !== 'ALL') query.append('instituteId', params.instituteId);
    if (params?.departmentId && params.departmentId !== 'ALL') query.append('departmentId', params.departmentId);

    const res = await fetch(`/api/v1/analytics/management/expenses?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load financial analytics (${res.statusText})`);
    }

    const json = await res.json();
    return json.data || json;
  },

  async getGatePass(params?: AnalyticsFilterParams): Promise<ManagementGatePassPayload> {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.instituteId && params.instituteId !== 'ALL') query.append('instituteId', params.instituteId);
    if (params?.departmentId && params.departmentId !== 'ALL') query.append('departmentId', params.departmentId);

    const res = await fetch(`/api/v1/analytics/management/gate-pass?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load gate pass analytics (${res.statusText})`);
    }

    const json = await res.json();
    return json.data || json;
  },
};
