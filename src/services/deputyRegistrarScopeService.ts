import { db } from './db';
import { 
  DeputyRegistrarScopeMapping, 
  DeputyRegistrarScopeAudit, 
  DeputyRegistrarScopeLevel, 
  DeputyRegistrarScopeStatus, 
  Institute, 
  Department, 
  User 
} from '../types';
import * as XLSX from 'xlsx';

export interface DeputyRegistrarScopeSummaryKPIs {
  activeDeputyRegistrars: number;
  assignedInstitutes: number;
  assignedDepartments: number;
  unassignedInstitutes: number;
  unassignedDepartments: number;
  recentChangesCount: number;
}

export interface ScopeFilterParams {
  status?: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'INACTIVE';
  instituteId?: string;
  departmentId?: string;
  searchQuery?: string;
}

export interface ScopeConflictResult {
  hasConflict: boolean;
  conflictingDetails: Array<{
    departmentId: string;
    departmentName: string;
    assignedToUserName: string;
    assignedToUserId: string;
    instituteName: string;
  }>;
}

class DeputyRegistrarScopeService {
  private static instance: DeputyRegistrarScopeService;

  private constructor() {}

  public static getInstance(): DeputyRegistrarScopeService {
    if (!DeputyRegistrarScopeService.instance) {
      DeputyRegistrarScopeService.instance = new DeputyRegistrarScopeService();
    }
    return DeputyRegistrarScopeService.instance;
  }

  // 1. Get filtered list of Deputy Registrar scopes
  public getDeputyRegistrarAssignments(filters?: ScopeFilterParams): DeputyRegistrarScopeMapping[] {
    const rawScopes = (db.getState()?.deputyRegistrarScopes || []) as DeputyRegistrarScopeMapping[];
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const users = db.getUsers();

    let items = rawScopes.map(s => {
      const user = users.find(u => u.id === s.userId);
      const inst = institutes.find(i => i.id === s.instituteId);
      const deptNames = (s.departmentIds || []).map(dId => departments.find(d => d.id === dId)?.name || dId);

      return {
        ...s,
        userName: s.userName || user?.name || 'Deputy Registrar',
        employeeId: s.employeeId || (user as any)?.employeeId || `DR-${s.userId.slice(-3).toUpperCase()}`,
        userEmail: s.userEmail || user?.email || 'deputy.registrar@swarrnim.edu.in',
        designation: s.designation || (user as any)?.designation || 'Deputy Registrar',
        instituteName: inst?.name || s.instituteName || 'Institute',
        instituteCode: inst?.code || s.instituteCode || 'INST',
        departmentNames: deptNames.length > 0 ? deptNames : s.departmentNames || ['All Departments'],
        scopeLevel: s.scopeLevel || (s.departmentIds?.length > 1 ? 'MULTI_DEPARTMENT' : (s.departmentIds?.length === 1 ? 'DEPARTMENT' : 'INSTITUTE')),
        effectiveFrom: s.effectiveFrom || s.createdAt?.split('T')[0] || '2026-08-01',
        status: s.status || 'ACTIVE'
      };
    });

    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter(s => s.status === filters.status);
    }
    if (filters?.instituteId && filters.instituteId !== 'ALL') {
      items = items.filter(s => s.instituteId === filters.instituteId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      items = items.filter(s => s.departmentIds.includes(filters.departmentId!));
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      items = items.filter(s => 
        (s.userName || '').toLowerCase().includes(q) ||
        (s.employeeId || '').toLowerCase().includes(q) ||
        (s.userEmail || '').toLowerCase().includes(q) ||
        (s.instituteName || '').toLowerCase().includes(q) ||
        (s.departmentNames || []).some(d => d.toLowerCase().includes(q))
      );
    }

    return items;
  }

  // 2. Dynamic summary KPIs
  public getSummaryKPIs(): DeputyRegistrarScopeSummaryKPIs {
    const rawScopes = (db.getState()?.deputyRegistrarScopes || []) as DeputyRegistrarScopeMapping[];
    const activeScopes = rawScopes.filter(s => s.status === 'ACTIVE');
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const audits = (db.getState()?.deputyRegistrarScopeAudits || []) as DeputyRegistrarScopeAudit[];

    const activeUserIds = new Set(activeScopes.map(s => s.userId));
    const assignedInstIds = new Set(activeScopes.map(s => s.instituteId));
    
    const assignedDeptIds = new Set<string>();
    activeScopes.forEach(s => {
      (s.departmentIds || []).forEach(dId => assignedDeptIds.add(dId));
    });

    const unassignedInstitutes = Math.max(0, institutes.length - assignedInstIds.size);
    const unassignedDepartments = Math.max(0, departments.length - assignedDeptIds.size);

    return {
      activeDeputyRegistrars: activeUserIds.size,
      assignedInstitutes: assignedInstIds.size,
      assignedDepartments: assignedDeptIds.size,
      unassignedInstitutes,
      unassignedDepartments,
      recentChangesCount: audits.length
    };
  }

  // 3. List of users eligible as Deputy Registrar
  public getDeputyRegistrarsList(): User[] {
    const users = db.getUsers();
    return users.filter(u => 
      u.role === 'DEPUTY_REGISTRAR' || 
      u.role === 'REGISTRAR' || 
      (u.role as string) === 'ASSISTANT_REGISTRAR' ||
      u.id.includes('deputy') || 
      u.email.includes('deputy')
    );
  }

  // 4. Scope Conflict Detection
  public checkScopeConflicts(params: {
    targetUserId: string;
    instituteId: string;
    departmentIds: string[];
    excludeScopeId?: string;
  }): ScopeConflictResult {
    const activeScopes = ((db.getState()?.deputyRegistrarScopes || []) as DeputyRegistrarScopeMapping[])
      .filter(s => s.status === 'ACTIVE' && s.id !== params.excludeScopeId);

    const departments = db.getDepartments();
    const institutes = db.getInstitutes();

    const conflicts: ScopeConflictResult['conflictingDetails'] = [];

    params.departmentIds.forEach(deptId => {
      const match = activeScopes.find(s => 
        s.instituteId === params.instituteId && 
        s.departmentIds.includes(deptId) &&
        s.userId !== params.targetUserId
      );

      if (match) {
        const dept = departments.find(d => d.id === deptId);
        const inst = institutes.find(i => i.id === params.instituteId);
        conflicts.push({
          departmentId: deptId,
          departmentName: dept?.name || deptId,
          assignedToUserName: match.userName || 'Another Deputy Registrar',
          assignedToUserId: match.userId,
          instituteName: inst?.name || 'Institute'
        });
      }
    });

    return {
      hasConflict: conflicts.length > 0,
      conflictingDetails: conflicts
    };
  }

  // 5. Assign New Scope
  public createAssignment(params: {
    userId: string;
    instituteId: string;
    departmentIds: string[];
    scopeLevel?: DeputyRegistrarScopeLevel;
    effectiveFrom?: string;
    effectiveTo?: string;
    reason?: string;
  }, currentUser: User): DeputyRegistrarScopeMapping {
    if (!currentUser || currentUser.role !== 'REGISTRAR') {
      throw new Error('403 Forbidden: Only the Registrar can assign Deputy Registrar jurisdictions.');
    }

    if (!params.userId || !params.instituteId) {
      throw new Error('Please select a Deputy Registrar and an Institute.');
    }

    const state = db.getState();
    if (!state.deputyRegistrarScopes) state.deputyRegistrarScopes = [];
    if (!state.deputyRegistrarScopeAudits) state.deputyRegistrarScopeAudits = [];

    const targetUser = db.getUsers().find(u => u.id === params.userId);
    const inst = db.getInstitutes().find(i => i.id === params.instituteId);
    const departments = db.getDepartments();
    const deptNames = params.departmentIds.map(dId => departments.find(d => d.id === dId)?.name || dId);

    const now = new Date().toISOString();
    const newScope: DeputyRegistrarScopeMapping = {
      id: `dr-scope-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      userName: targetUser?.name || 'Deputy Registrar',
      employeeId: (targetUser as any)?.employeeId || `DR-${params.userId.slice(-3).toUpperCase()}`,
      userEmail: targetUser?.email || 'deputy.registrar@swarrnim.edu.in',
      designation: (targetUser as any)?.designation || 'Deputy Registrar',
      instituteId: params.instituteId,
      instituteCode: inst?.code || 'INST',
      instituteName: inst?.name || 'Institute',
      departmentIds: Array.from(new Set([...params.departmentIds])),
      departmentNames: deptNames,
      scopeLevel: params.scopeLevel || (params.departmentIds.length > 1 ? 'MULTI_DEPARTMENT' : 'DEPARTMENT'),
      effectiveFrom: params.effectiveFrom || now.split('T')[0],
      effectiveTo: params.effectiveTo,
      reason: params.reason || 'Official jurisdictional delegation under the Office of the Registrar',
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    state.deputyRegistrarScopes.push(newScope);

    // Audit Log
    state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scopeId: newScope.id,
      userId: params.userId,
      userName: targetUser?.name || 'Deputy Registrar',
      employeeId: newScope.employeeId,
      instituteId: params.instituteId,
      instituteName: inst?.name,
      departmentId: params.departmentIds.join(','),
      departmentName: deptNames.join(', '),
      oldScope: 'None',
      newScope: `${inst?.name} [${deptNames.join(', ')}]`,
      action: 'ASSIGNED',
      reason: params.reason || 'Initial jurisdictional assignment',
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      timestamp: now,
      details: `Assigned new scope covering ${deptNames.length} department(s)`
    });

    (db as any).saveState?.();
    return newScope;
  }

  // 6. Edit / Update Scope
  public updateAssignment(scopeId: string, params: {
    instituteId: string;
    departmentIds: string[];
    scopeLevel?: DeputyRegistrarScopeLevel;
    effectiveFrom?: string;
    effectiveTo?: string;
    reason?: string;
  }, currentUser: User): DeputyRegistrarScopeMapping {
    if (!currentUser || currentUser.role !== 'REGISTRAR') {
      throw new Error('403 Forbidden: Only the Registrar can modify Deputy Registrar jurisdictions.');
    }

    const state = db.getState();
    const scope = (state.deputyRegistrarScopes || []).find((s: DeputyRegistrarScopeMapping) => s.id === scopeId);
    if (!scope) {
      throw new Error('Scope assignment record not found.');
    }

    const departments = db.getDepartments();
    const inst = db.getInstitutes().find(i => i.id === params.instituteId);
    const oldDeptNames = (scope.departmentNames || []).join(', ');
    const newDeptNames = params.departmentIds.map(dId => departments.find(d => d.id === dId)?.name || dId);

    const now = new Date().toISOString();
    scope.instituteId = params.instituteId;
    scope.instituteCode = inst?.code || scope.instituteCode;
    scope.instituteName = inst?.name || scope.instituteName;
    scope.departmentIds = Array.from(new Set([...params.departmentIds]));
    scope.departmentNames = newDeptNames;
    scope.scopeLevel = params.scopeLevel || scope.scopeLevel;
    scope.effectiveFrom = params.effectiveFrom || scope.effectiveFrom;
    scope.effectiveTo = params.effectiveTo || scope.effectiveTo;
    scope.reason = params.reason || scope.reason;
    scope.assignedByUserId = currentUser.id;
    scope.assignedByName = currentUser.name;
    scope.updatedAt = now;

    // Audit Log
    state.deputyRegistrarScopeAudits = state.deputyRegistrarScopeAudits || [];
    state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scopeId: scope.id,
      userId: scope.userId,
      userName: scope.userName || 'Deputy Registrar',
      employeeId: scope.employeeId,
      instituteId: params.instituteId,
      instituteName: inst?.name,
      departmentId: params.departmentIds.join(','),
      departmentName: newDeptNames.join(', '),
      oldScope: `${scope.instituteName} [${oldDeptNames}]`,
      newScope: `${inst?.name} [${newDeptNames.join(', ')}]`,
      action: 'UPDATED',
      reason: params.reason || 'Scope updated by Registrar',
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      timestamp: now,
      details: `Updated scope for ${newDeptNames.length} department(s)`
    });

    (db as any).saveState?.();
    return scope;
  }

  // 7. Transfer Scope Workflow
  public transferScope(params: {
    fromUserId: string;
    toUserId: string;
    instituteId: string;
    departmentIds: string[];
    reason: string;
  }, currentUser: User): { fromScope?: DeputyRegistrarScopeMapping; toScope: DeputyRegistrarScopeMapping } {
    if (!currentUser || currentUser.role !== 'REGISTRAR') {
      throw new Error('403 Forbidden: Only the Registrar can transfer Deputy Registrar jurisdictions.');
    }

    if (params.fromUserId === params.toUserId) {
      throw new Error('Transfer destination must be a different Deputy Registrar.');
    }

    const state = db.getState();
    if (!state.deputyRegistrarScopes) state.deputyRegistrarScopes = [];
    const rawScopes = (state.deputyRegistrarScopes || []) as DeputyRegistrarScopeMapping[];
    const fromUser = db.getUsers().find(u => u.id === params.fromUserId);
    const toUser = db.getUsers().find(u => u.id === params.toUserId);
    const inst = db.getInstitutes().find(i => i.id === params.instituteId);
    const departments = db.getDepartments();

    // 1. Remove transferred departments from FROM user's scope
    const fromScope = rawScopes.find(s => s.userId === params.fromUserId && s.instituteId === params.instituteId && s.status === 'ACTIVE');
    if (fromScope) {
      fromScope.departmentIds = fromScope.departmentIds.filter(dId => !params.departmentIds.includes(dId));
      fromScope.departmentNames = fromScope.departmentIds.map(dId => departments.find(d => d.id === dId)?.name || dId);
      if (fromScope.departmentIds.length === 0) {
        fromScope.status = 'INACTIVE';
      }
      fromScope.updatedAt = new Date().toISOString();
    }

    // 2. Add transferred departments to TO user's scope
    let toScope = rawScopes.find(s => s.userId === params.toUserId && s.instituteId === params.instituteId && s.status === 'ACTIVE');
    const now = new Date().toISOString();
    const transferredDeptNames = params.departmentIds.map(dId => departments.find(d => d.id === dId)?.name || dId);

    if (toScope) {
      toScope.departmentIds = Array.from(new Set([...toScope.departmentIds, ...params.departmentIds]));
      toScope.departmentNames = toScope.departmentIds.map(dId => departments.find(d => d.id === dId)?.name || dId);
      toScope.updatedAt = now;
    } else {
      toScope = {
        id: `dr-scope-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: params.toUserId,
        userName: toUser?.name || 'Deputy Registrar',
        employeeId: (toUser as any)?.employeeId || `DR-${params.toUserId.slice(-3).toUpperCase()}`,
        userEmail: toUser?.email || 'deputy.registrar@swarrnim.edu.in',
        designation: (toUser as any)?.designation || 'Deputy Registrar',
        instituteId: params.instituteId,
        instituteCode: inst?.code || 'INST',
        instituteName: inst?.name || 'Institute',
        departmentIds: Array.from(new Set([...params.departmentIds])),
        departmentNames: transferredDeptNames,
        scopeLevel: params.departmentIds.length > 1 ? 'MULTI_DEPARTMENT' : 'DEPARTMENT',
        effectiveFrom: now.split('T')[0],
        reason: params.reason || 'Transferred from previous Deputy Registrar',
        assignedByUserId: currentUser.id,
        assignedByName: currentUser.name,
        assignedByRole: 'REGISTRAR',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      };
      state.deputyRegistrarScopes.push(toScope);
    }

    // 3. Audit Log
    state.deputyRegistrarScopeAudits = state.deputyRegistrarScopeAudits || [];
    state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scopeId: toScope.id,
      userId: params.toUserId,
      userName: toUser?.name || 'Deputy Registrar',
      employeeId: toScope.employeeId,
      instituteId: params.instituteId,
      instituteName: inst?.name,
      departmentId: params.departmentIds.join(','),
      departmentName: transferredDeptNames.join(', '),
      oldScope: `${fromUser?.name || 'Previous DR'} [${transferredDeptNames.join(', ')}]`,
      newScope: `${toUser?.name || 'New DR'} [${transferredDeptNames.join(', ')}]`,
      action: 'TRANSFERRED',
      reason: params.reason || 'Administrative re-allocation of responsibilities',
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      timestamp: now,
      details: `Transferred ${params.departmentIds.length} department(s) from ${fromUser?.name} to ${toUser?.name}`
    });

    (db as any).saveState?.();
    return { fromScope, toScope };
  }

  // 8. Revoke or Suspend Scope
  public revokeScope(scopeId: string, reason: string, status: 'REVOKED' | 'SUSPENDED', currentUser: User): DeputyRegistrarScopeMapping {
    if (!currentUser || currentUser.role !== 'REGISTRAR') {
      throw new Error('403 Forbidden: Only the Registrar can revoke or suspend Deputy Registrar jurisdictions.');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Mandatory justification reason required to revoke/suspend jurisdiction.');
    }

    const state = db.getState();
    const scope = (state.deputyRegistrarScopes || []).find((s: DeputyRegistrarScopeMapping) => s.id === scopeId);
    if (!scope) {
      throw new Error('Scope assignment not found.');
    }

    const now = new Date().toISOString();
    scope.status = status;
    scope.revokedByUserId = currentUser.id;
    scope.revokedByName = currentUser.name;
    scope.revokedAt = now;
    scope.revokeReason = reason.trim();
    scope.updatedAt = now;

    // Audit Log
    state.deputyRegistrarScopeAudits = state.deputyRegistrarScopeAudits || [];
    state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scopeId: scope.id,
      userId: scope.userId,
      userName: scope.userName || 'Deputy Registrar',
      employeeId: scope.employeeId,
      instituteId: scope.instituteId,
      instituteName: scope.instituteName,
      departmentId: (scope.departmentIds || []).join(','),
      departmentName: (scope.departmentNames || []).join(', '),
      oldScope: `${scope.instituteName} [${(scope.departmentNames || []).join(', ')}]`,
      newScope: status,
      action: status,
      reason: reason.trim(),
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      timestamp: now,
      details: `${status} jurisdiction for ${scope.userName}. Reason: ${reason.trim()}`
    });

    (db as any).saveState?.();
    return scope;
  }

  // 9. Reactivate Scope
  public reactivateScope(scopeId: string, reason: string, effectiveFrom: string, currentUser: User): DeputyRegistrarScopeMapping {
    if (!currentUser || currentUser.role !== 'REGISTRAR') {
      throw new Error('403 Forbidden: Only the Registrar can reactivate Deputy Registrar jurisdictions.');
    }

    const state = db.getState();
    const scope = (state.deputyRegistrarScopes || []).find((s: DeputyRegistrarScopeMapping) => s.id === scopeId);
    if (!scope) {
      throw new Error('Scope assignment not found.');
    }

    const now = new Date().toISOString();
    scope.status = 'ACTIVE';
    scope.effectiveFrom = effectiveFrom || now.split('T')[0];
    scope.reason = reason || 'Reactivated by Registrar order';
    scope.assignedByUserId = currentUser.id;
    scope.assignedByName = currentUser.name;
    scope.updatedAt = now;

    // Audit Log
    state.deputyRegistrarScopeAudits = state.deputyRegistrarScopeAudits || [];
    state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scopeId: scope.id,
      userId: scope.userId,
      userName: scope.userName || 'Deputy Registrar',
      employeeId: scope.employeeId,
      instituteId: scope.instituteId,
      instituteName: scope.instituteName,
      departmentId: (scope.departmentIds || []).join(','),
      departmentName: (scope.departmentNames || []).join(', '),
      oldScope: 'INACTIVE / REVOKED',
      newScope: `${scope.instituteName} [${(scope.departmentNames || []).join(', ')}]`,
      action: 'REACTIVATED',
      reason: reason || 'Delegation restored by Registrar order',
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByRole: 'REGISTRAR',
      timestamp: now,
      details: `Reactivated jurisdiction for ${scope.userName}`
    });

    (db as any).saveState?.();
    return scope;
  }

  // 10. Get Audit History
  public getAuditHistory(scopeId?: string): DeputyRegistrarScopeAudit[] {
    const audits = (db.getState()?.deputyRegistrarScopeAudits || []) as DeputyRegistrarScopeAudit[];
    if (scopeId) {
      return audits.filter(a => a.scopeId === scopeId);
    }
    return audits;
  }

  // 11. Export Roster
  public exportRoster(filters?: ScopeFilterParams, format: 'XLSX' | 'CSV' = 'XLSX'): void {
    const items = this.getDeputyRegistrarAssignments(filters);
    const headers = [
      'Deputy Registrar', 'Employee ID', 'Email', 'Designation',
      'Assigned Institute', 'Assigned Departments', 'Scope Level',
      'Status', 'Effective From', 'Assigned By', 'Last Modified'
    ];

    const rows = items.map(s => [
      s.userName,
      s.employeeId,
      s.userEmail,
      s.designation,
      s.instituteName,
      (s.departmentNames || []).join('; '),
      s.scopeLevel,
      s.status,
      s.effectiveFrom,
      s.assignedByName || 'Registrar',
      s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''
    ]);

    const filename = `SSIU_Deputy_Registrar_Jurisdictions_${new Date().toISOString().split('T')[0]}`;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DR Jurisdictions');
    XLSX.writeFile(wb, `${filename}.${format === 'CSV' ? 'csv' : 'xlsx'}`);
  }
}

export const deputyRegistrarScopeService = DeputyRegistrarScopeService.getInstance();
