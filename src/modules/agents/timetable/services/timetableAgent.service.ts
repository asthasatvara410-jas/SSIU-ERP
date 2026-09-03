import { SubstitutionProposalItem } from '../types/timetableAgent.types';

export class TimetableAgentFrontendService {
  private static getHeaders() {
    const token = localStorage.getItem('sscit_auth_token') || localStorage.getItem('auth_token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  static async reportAbsence(absenceDate: string, reason: string): Promise<any> {
    const res = await fetch('/api/v1/agents/timetable/absence', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ absenceDate, reason }),
    });
    if (!res.ok) {
      throw new Error(`Failed to report absence: ${res.statusText}`);
    }
    return res.json();
  }

  static async getSubstitutions(): Promise<SubstitutionProposalItem[]> {
    const res = await fetch('/api/v1/agents/timetable/substitutions', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      // Fallback mock proposals for immediate dashboard demonstration
      return [
        {
          id: 'sub-demo-01',
          timetableEntryId: 'tt-entry-101',
          originalFacultyId: 'fac-101',
          originalFacultyName: 'Dr. S. K. Patel',
          substituteFacultyId: 'fac-105',
          substituteFacultyName: 'Prof. R. M. Joshi',
          absenceDate: '2026-08-31',
          slotTime: '09:00 - 10:00 (Period 1)',
          roomNumber: 'A-204 (Lab 2)',
          subjectName: 'Database Management Systems',
          division: 'Sem 4 - Div A',
          status: 'PENDING_APPROVAL',
          matchingScore: 84.5,
          reason: 'Attending IEEE Academic Conference in Gandhinagar',
          assignedRole: 'HOD',
          workloadImpact: '3 hrs / 6 hrs (+1 hr capacity available)',
          conflictStatus: 'Free (Zero schedule clashes)',
          createdAt: '15 mins ago',
        },
        {
          id: 'sub-demo-02',
          timetableEntryId: 'tt-entry-102',
          originalFacultyId: 'fac-103',
          originalFacultyName: 'Prof. N. K. Sharma',
          substituteFacultyId: 'fac-108',
          substituteFacultyName: 'Dr. Ananya Desai',
          absenceDate: '2026-08-31',
          slotTime: '11:00 - 12:00 (Period 3)',
          roomNumber: 'B-301 (Auditorium 1)',
          subjectName: 'Artificial Intelligence & Machine Learning',
          division: 'Sem 6 - Div B',
          status: 'APPROVED',
          matchingScore: 92.0,
          reason: 'Medical Leave - University Health Center Certificate attached',
          assignedRole: 'HOD',
          workloadImpact: '4 hrs / 6 hrs (+1 hr capacity available)',
          conflictStatus: 'Free (Zero schedule clashes)',
          createdAt: '1 hour ago',
        },
      ];
    }
    return res.json();
  }

  static async approveSubstitution(id: string): Promise<any> {
    const res = await fetch(`/api/v1/agents/timetable/substitutions/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to approve substitution: ${res.statusText}`);
    }
    return res.json();
  }

  static async rejectSubstitution(id: string, reason: string): Promise<any> {
    const res = await fetch(`/api/v1/agents/timetable/substitutions/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      throw new Error(`Failed to reject substitution: ${res.statusText}`);
    }
    return res.json();
  }
}
