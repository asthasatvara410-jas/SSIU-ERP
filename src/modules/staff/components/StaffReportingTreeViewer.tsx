import React, { useState } from 'react';
import { Network, ChevronRight, ChevronDown, User, Award, Users, BookOpen, ShieldCheck, Plus, Key } from 'lucide-react';
import { SupervisorHierarchyNodeDTO } from '../types';
import { Badge } from '../../../components/common/Badge';
import { db } from '../../../services/db';
import { TargetFacultyAccountInfo } from './StaffFacultyAccountModal';

interface StaffReportingTreeViewerProps {
  hierarchy: SupervisorHierarchyNodeDTO[];
  onManageAccount?: (target: TargetFacultyAccountInfo) => void;
}

const TreeNodeItem: React.FC<{
  node: SupervisorHierarchyNodeDTO;
  depth?: number;
  onManageAccount?: (target: TargetFacultyAccountInfo) => void;
}> = ({ node, depth = 0, onManageAccount }) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 2);
  const hasChildren = Boolean(node.children && node.children.length > 0);

  // Check if this node has an existing login account
  const allUsers = db.getUsers();
  const existingUser = allUsers.find(
    u => (node.employeeId && (u.employeeId === node.employeeId || u.username === node.employeeId)) ||
         (node.email && u.email?.toLowerCase() === node.email.toLowerCase()) ||
         u.id === node.id
  );

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0, borderLeft: depth > 0 ? '2px dashed var(--border-color)' : 'none', paddingLeft: depth > 0 ? '1rem' : 0, marginTop: '0.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: depth === 0 ? 'var(--bg-light)' : '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: depth === 0 ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}

          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: depth === 0 ? 'var(--brand-navy)' : depth === 1 ? 'var(--brand-orange)' : '#6366F1',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            {depth === 0 ? 'HOI' : depth === 1 ? 'HOD' : 'FAC'}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>
              {node.name}
              {node.employeeId && (
                <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B' }}>
                  ({node.employeeId})
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {node.designation} &bull; {node.department}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge variant={node.role === 'PRINCIPAL' ? 'navy' : node.role === 'HOD' ? 'orange' : 'success'}>
            {node.role}
          </Badge>
          {node.assignedMenteesCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} /> {node.assignedMenteesCount} Mentees
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={12} /> {node.weeklyWorkloadHours} hrs/wk
          </span>

          {/* Login Account Action Button */}
          {existingUser ? (
            <button
              type="button"
              onClick={() => onManageAccount?.({
                facultyId: node.id,
                name: node.name,
                employeeId: node.employeeId,
                email: node.email,
                designation: node.designation,
                departmentName: node.department,
                departmentId: node.departmentId,
                instituteId: node.instituteId,
                role: node.role,
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                cursor: 'pointer',
              }}
              title={`Manage Login Account (${existingUser.username})`}
            >
              <ShieldCheck size={12} color="#059669" />
              <span>{existingUser.accountStatus || 'ACTIVE'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onManageAccount?.({
                facultyId: node.id,
                name: node.name,
                employeeId: node.employeeId,
                email: node.email,
                designation: node.designation,
                departmentName: node.department,
                departmentId: node.departmentId,
                instituteId: node.instituteId,
                role: node.role,
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                background: '#FFF7ED',
                color: '#C2410C',
                border: '1px solid #FDBA74',
                cursor: 'pointer',
              }}
              title="Provision ERP Login Account"
            >
              <Plus size={12} />
              <span>Login Account</span>
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {node.children!.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} onManageAccount={onManageAccount} />
          ))}
        </div>
      )}
    </div>
  );
};

export const StaffReportingTreeViewer: React.FC<StaffReportingTreeViewerProps> = ({ hierarchy, onManageAccount }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Network size={18} color="var(--brand-orange)" /> Institutional Faculty Reporting &amp; Mentorship Tree
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Hierarchical escalation and supervisory flow: Dean / Principal &rarr; Department HOD &rarr; Faculty &rarr; Assigned Mentees.
          </p>
        </div>
        <Badge variant="navy">Acyclic Hierarchy Active</Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {hierarchy.map(rootNode => (
          <TreeNodeItem key={rootNode.id} node={rootNode} onManageAccount={onManageAccount} />
        ))}
      </div>
    </div>
  );
};
