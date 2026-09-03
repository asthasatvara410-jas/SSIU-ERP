import React, { useState, useMemo } from 'react';
import { 
  Box, Layers, Building2, Monitor, BookOpen, Wrench, ArrowRightLeft, 
  RotateCcw, ShoppingCart, FileText, Download, Plus, Search, Filter, 
  CheckCircle2, AlertTriangle, ShieldCheck, QrCode, Sparkles, Printer,
  Eye, RefreshCw, UploadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService } from '../../services/assetManagementService';
import { resourceAllocationService } from '../../services/resourceAllocationService';
import { UniversityAsset, AssetCategory, AssetStatus } from '../../types';
import { RegisterAssetModal } from '../../components/assets/RegisterAssetModal';
import { AllocateAssetModal } from '../../components/assets/AllocateAssetModal';
import { TransferAssetModal } from '../../components/assets/TransferAssetModal';
import { ReturnAssetModal } from '../../components/assets/ReturnAssetModal';
import { LogMaintenanceModal } from '../../components/assets/LogMaintenanceModal';
import { AssetDetailModal } from '../../components/assets/AssetDetailModal';
import { BulkAssetImportModal } from '../../components/assets/BulkAssetImportModal';
import { CreateAssetRequestModal } from '../../components/assets/CreateAssetRequestModal';
import { AllocateClassroomModal } from '../../components/resource-allocation/AllocateClassroomModal';
import { AllocateLaboratoryModal } from '../../components/resource-allocation/AllocateLaboratoryModal';
import { AllocateFacultyModal } from '../../components/resource-allocation/AllocateFacultyModal';
import { ClassroomAllocationBoard } from '../../components/resource-allocation/ClassroomAllocationBoard';

type AssetWorkspaceTab = 
  | 'DASHBOARD'
  | 'ASSET_REGISTER'
  | 'DEPARTMENT_ALLOCATION'
  | 'CLASSROOM_ALLOCATION'
  | 'LAB_ALLOCATION'
  | 'FACULTY_ALLOCATION'
  | 'TRANSFERS_RETURNS'
  | 'MAINTENANCE_WARRANTY'
  | 'ALLOCATION_REQUESTS'
  | 'REPORTS_AUDIT';

export const UniversityAssetManagementPage: React.FC<{ initialTab?: AssetWorkspaceTab }> = ({
  initialTab = 'DASHBOARD'
}) => {
  const { user, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<AssetWorkspaceTab>(initialTab);

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [selectedAssetForAction, setSelectedAssetForAction] = useState<UniversityAsset | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [classroomViewMode, setClassroomViewMode] = useState<'TABLE' | 'BOARD'>('TABLE');

  // Master Data
  const assets = db.getUniversityAssets();
  const departments = db.getDepartments();
  const allocations = db.getAssetDepartmentAllocations();
  const requests = db.getAssetAllocationRequests();
  const transfers = db.getAssetTransferRecords();
  const returns = db.getAssetReturnRecords();
  const maintenanceLogs = db.getAssetMaintenanceRecords();
  const crAllocations = db.getClassroomAllocations();
  const labAllocations = db.getLaboratoryAllocations();
  const facAllocations = db.getFacultyAllocations();
  const conflicts = resourceAllocationService.detectAllConflicts();

  const metrics = assetManagementService.getAssetDashboardMetrics();
  const resourceStats = resourceAllocationService.getDashboardStats();
  const expiringWarranties = assetManagementService.getExpiringWarranties(60);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = !searchQuery || 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchDept = departmentFilter === 'ALL' || a.currentDepartmentId === departmentFilter;

      return matchSearch && matchCategory && matchStatus && matchDept;
    });
  }, [assets, searchQuery, categoryFilter, statusFilter, departmentFilter]);

  const handleExportExcel = () => {
    assetManagementService.exportAssetRegisterExcel(filteredAssets);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1B3D 0%, #1E293B 100%)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(243, 112, 35, 0.2)',
              border: '1px solid #F37023',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F37023'
            }}>
              <Box size={20} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              University Resource & Asset Management
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0.35rem 0 0 0' }}>
            Centralized Asset Master • Department Allocations • Classrooms • Labs • Workload • Conflict Management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsBulkImportModalOpen(true)}
            className="btn btn-secondary"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <UploadCloud size={16} />
            <span>Bulk Excel Ingestion</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              background: 'var(--brand-orange, #F37023)',
              borderColor: 'var(--brand-orange, #F37023)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus size={16} />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* 10-Submodule Navigation Bar */}
      <div style={{
        display: 'flex',
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        padding: '0.35rem',
        overflowX: 'auto',
        gap: '0.25rem'
      }}>
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: Box },
          { id: 'ASSET_REGISTER', label: `Asset Master (${assets.length})`, icon: Layers },
          { id: 'DEPARTMENT_ALLOCATION', label: 'Dept Allocation', icon: Building2 },
          { id: 'CLASSROOM_ALLOCATION', label: `Classrooms (${crAllocations.length})`, icon: BookOpen },
          { id: 'LAB_ALLOCATION', label: `Laboratories (${labAllocations.length})`, icon: Monitor },
          { id: 'FACULTY_ALLOCATION', label: 'Faculty Load', icon: ShieldCheck },
          { id: 'TRANSFERS_RETURNS', label: 'Transfers & Returns', icon: ArrowRightLeft },
          { id: 'MAINTENANCE_WARRANTY', label: `Maintenance (${maintenanceLogs.length})`, icon: Wrench },
          { id: 'ALLOCATION_REQUESTS', label: `Requests (${requests.length})`, icon: ShoppingCart },
          { id: 'REPORTS_AUDIT', label: 'Reports & Export', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id as any)}
              style={{
                padding: '0.6rem 0.95rem',
                border: 'none',
                borderRadius: '6px',
                background: active ? 'var(--brand-navy, #0B1B3D)' : 'transparent',
                color: active ? '#FFFFFF' : '#64748B',
                fontWeight: active ? 800 : 600,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} style={{ color: active ? 'var(--brand-orange, #F37023)' : '#94A3B8' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBMODULE 1: DASHBOARD */}
      {currentTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>Total Registered Assets</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--brand-navy, #0B1B3D)', marginTop: '0.25rem' }}>
                {metrics.totalAssets}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>₹{metrics.totalValue.toLocaleString()} Valuation</span>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>In-Stock Store Inventory</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '0.25rem' }}>
                {metrics.inStock}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Available for allocation</span>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>Allocated to Departments</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7', marginTop: '0.25rem' }}>
                {metrics.allocated}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Active in Labs & Offices</span>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>Classrooms / Labs</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.25rem' }}>
                {resourceStats.allocatedClassrooms} / {resourceStats.allocatedLabs}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Allocated across university</span>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>Active Conflicts</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: conflicts.length > 0 ? '#EF4444' : '#10B981', marginTop: '0.25rem' }}>
                {conflicts.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: conflicts.length > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                {conflicts.length === 0 ? '✓ Zero Schedule Clashes' : 'Requires Resolution'}
              </span>
            </div>
          </div>

          {/* Department-wise & Category Summaries */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Category Breakdown */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                Category-wise Asset Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(metrics.categoryBreakdown).map(([cat, data]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{cat.replace(/_/g, ' ')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{data.count} units</span>
                      <span style={{ color: '#16A34A', fontWeight: 700, minWidth: '90px', textAlign: 'right' }}>₹{data.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Breakdown */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                Department-wise Allocation Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(metrics.departmentBreakdown).map(([deptId, data]) => (
                  <div key={deptId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{data.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 800, color: '#0284C7' }}>{data.count} assets</span>
                      <span style={{ color: '#16A34A', fontWeight: 700, minWidth: '90px', textAlign: 'right' }}>₹{data.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 2: ASSET MASTER CATALOG */}
      {currentTab === 'ASSET_REGISTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search Asset Name, Asset ID, Serial Number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="ALL">All Categories</option>
                <option value="IT_ELECTRONICS">IT & Electronics</option>
                <option value="FURNITURE">Furniture</option>
                <option value="CLASSROOM">Classroom Assets</option>
                <option value="LABORATORY">Laboratory Assets</option>
                <option value="OFFICE">Office Equipment</option>
                <option value="NETWORKING">Networking</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset Name & Brand</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Serial / Tag</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Current Placement</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a => {
                  const dept = departments.find(d => d.id === a.currentDepartmentId);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-navy, #0B1B3D)' }}>
                        {a.assetId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{a.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{a.brand} • {a.model}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>
                          {a.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                        {a.serialNumber || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: a.availableQuantity > 0 ? '#16A34A' : '#64748B' }}>
                          {a.availableQuantity} Avail / {a.totalQuantity} Total
                        </strong>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{dept?.name || 'Central Store'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{a.assignedPersonName || a.building || 'Main Facility'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          background: a.status === 'ALLOCATED' || a.status === 'IN_USE' ? '#E0F2FE' : (a.status === 'IN_STOCK' ? '#DCFCE7' : '#FEF3C7'),
                          color: a.status === 'ALLOCATED' || a.status === 'IN_USE' ? '#0369A1' : (a.status === 'IN_STOCK' ? '#15803D' : '#B45309'),
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedAssetForAction(a); setIsDetailModalOpen(true); }}
                            className="btn btn-sm btn-secondary"
                            title="View Dossier & QR Code"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <Eye size={13} />
                          </button>
                          {a.availableQuantity > 0 && (
                            <button
                              type="button"
                              onClick={() => { setSelectedAssetForAction(a); setIsAllocateModalOpen(true); }}
                              className="btn btn-sm"
                              title="Allocate Stock"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', background: 'var(--brand-orange, #F37023)', color: '#FFFFFF', fontWeight: 700 }}
                            >
                              Allocate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMODULE 4: CLASSROOM ALLOCATION */}
      {currentTab === 'CLASSROOM_ALLOCATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setClassroomViewMode('TABLE')}
                className={`btn btn-sm ${classroomViewMode === 'TABLE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Table Matrix View
              </button>
              <button
                type="button"
                onClick={() => setClassroomViewMode('BOARD')}
                className={`btn btn-sm ${classroomViewMode === 'BOARD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Visual Drag & Drop Board
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsClassroomModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>Allocate Classroom</span>
            </button>
          </div>

          {classroomViewMode === 'BOARD' ? (
            <ClassroomAllocationBoard />
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Classroom</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Building & Floor</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Department & Program</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Academic Placement</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Capacity</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Effective Period</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crAllocations.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy, #0B1B3D)' }}>
                        {c.roomNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        {c.building} • {c.floor}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{c.departmentName}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.programName}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                          {c.semesterName} ({c.divisionName})
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16A34A' }}>
                        {c.capacity} Seats
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748B' }}>
                        {c.effectiveFrom} to {c.effectiveTo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBMODULE 5: LABORATORY ALLOCATION */}
      {currentTab === 'LAB_ALLOCATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              University Laboratory & Specialized Facility Allocations
            </strong>
            <button
              type="button"
              onClick={() => setIsLabModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>Allocate Laboratory</span>
            </button>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Laboratory Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Room & Building</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department & Placement</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Workstations & Capacity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Faculty In-Charge</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {labAllocations.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#0F172A', display: 'block' }}>{l.labName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{l.labType}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {l.roomNumber} ({l.building})
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{l.departmentName}</div>
                      <span style={{ fontSize: '0.72rem', color: '#0284C7' }}>{l.semesterName} ({l.divisionName})</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{l.computerCount || 0} PCs</strong> • Cap: {l.capacity}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: l.assignedFacultyName ? '#0284C7' : '#64748B', fontWeight: 600 }}>
                      {l.assignedFacultyName || 'Dept In-Charge'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMODULE 6: FACULTY ALLOCATION */}
      {currentTab === 'FACULTY_ALLOCATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Faculty Teaching Workload & Subject Allocation Ledger
            </strong>
            <button
              type="button"
              onClick={() => setIsFacultyModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>Assign Faculty Teaching Load</span>
            </button>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Professor / Faculty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject & Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department & Placement</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Teaching Hours</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Weekly Load</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {facAllocations.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#0F172A', display: 'block' }}>{f.facultyName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Code: {f.employeeCode}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#0F172A', display: 'block' }}>{f.subjectName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{f.subjectCode}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{f.departmentName}</div>
                      <span style={{ fontSize: '0.72rem', color: '#0284C7' }}>{f.semesterName} ({f.divisionName})</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#475569' }}>
                      {f.theoryHours} Th + {f.practicalHours} Pr
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: f.teachingLoad > 18 ? '#DC2626' : '#16A34A' }}>
                      {f.teachingLoad} Hrs / Wk
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMODULE 7: TRANSFERS & RETURNS */}
      {currentTab === 'TRANSFERS_RETURNS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Transfers Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
              Inter-Department Asset Transfers ({transfers.length})
            </div>
            {transfers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No inter-department asset transfers recorded.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Asset ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Asset Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>From Department</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Destination Department</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date & Transferred By</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>{t.assetId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{t.assetName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{t.fromDepartmentName || 'Store'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0284C7', fontWeight: 700 }}>{t.toDepartmentName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>{t.transferDate} • {t.transferredBy}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Returns Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
              Returns to Central University Store ({returns.length})
            </div>
            {returns.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No asset return records currently logged.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Asset ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Asset Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Returned From</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Condition</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Return Date & Officer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>{r.assetId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{r.assetName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{r.fromDepartmentName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#10B981' }}>{r.condition}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>{r.returnDate} • {r.receivedBy}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUBMODULE 8: MAINTENANCE & WARRANTY */}
      {currentTab === 'MAINTENANCE_WARRANTY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Warranty Expiration Alert Center */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: '#D97706' }} />
              <strong style={{ fontSize: '0.9rem', color: '#92400E' }}>
                OEM Warranty Expiring Within 60 Days ({expiringWarranties.length} Assets)
              </strong>
            </div>
            {expiringWarranties.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#78350F', margin: 0 }}>
                All active warranties are in healthy operational standing.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                {expiringWarranties.map(a => (
                  <div key={a.id} style={{ background: '#FFFFFF', border: '1px solid #FDE68A', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <strong style={{ color: '#0F172A', display: 'block' }}>{a.name}</strong>
                    <span style={{ color: '#D97706', fontWeight: 700 }}>Expires: {a.warrantyEnd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
              Maintenance Service & Repair Logs ({maintenanceLogs.length})
            </div>
            {maintenanceLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No maintenance tickets logged.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Asset ID & Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Issue & Service Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Vendor / Technician</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Cost (₹)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{m.assetName}</strong>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748B' }}>{m.assetId}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{m.issueDescription}</div>
                        <span style={{ fontSize: '0.7rem', color: '#8B5CF6', fontWeight: 700 }}>{m.serviceType}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{m.vendor || 'In-House Service'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16A34A' }}>₹{(m.cost || m.actualCost || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>{m.maintenanceDate}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUBMODULE 9: ALLOCATION REQUESTS */}
      {currentTab === 'ALLOCATION_REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Department Asset & Resource Allocation Requisitions
            </strong>
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>Submit Requisition</span>
            </button>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Request No</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Item & Quantity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Justification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Requested By</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-navy, #0B1B3D)' }}>
                      {r.requestNo}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                      {r.departmentName}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#0F172A' }}>{r.requestedQuantity}x {r.subCategory}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>{r.category}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: r.priority === 'HIGH' || r.priority === 'URGENT' ? '#FEE2E2' : '#EFF6FF',
                        color: r.priority === 'HIGH' || r.priority === 'URGENT' ? '#DC2626' : '#2563EB',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px'
                      }}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '250px' }}>
                      {r.justification}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      {r.requestedBy}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: r.status === 'ALLOCATED' || r.status === 'APPROVED' ? '#DCFCE7' : '#FEF3C7',
                        color: r.status === 'ALLOCATED' || r.status === 'APPROVED' ? '#15803D' : '#B45309',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px'
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMODULE 10: REPORTS & AUDIT */}
      {currentTab === 'REPORTS_AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              University Asset & Resource Allocation Reports
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Export authoritative reports across Department inventories, Classroom schedules, Maintenance expenses, and Statutory asset registers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Complete University Asset Register', desc: 'Full itemized catalogue with valuation & serials.', action: handleExportExcel },
                { title: 'Department-Wise Asset Ledger', desc: 'Classroom, lab & office assets per department.', action: handleExportExcel },
                { title: 'Classroom & Lab Allocation Schedule', desc: 'Timetable integration & room utilization.', action: handleExportExcel },
                { title: 'Warranty & Maintenance Audit Report', desc: 'OEM contracts, service logs, and maintenance cost.', action: handleExportExcel },
                { title: 'Inter-Department Transfer Register', desc: 'Historical audit trail of all asset movements.', action: handleExportExcel },
                { title: 'Store Stock & Available Inventory', desc: 'Unallocated procurement stock in central depot.', action: handleExportExcel }
              ].map((rep, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A', display: 'block' }}>{rep.title}</strong>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 1rem 0' }}>{rep.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={rep.action}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    <Download size={14} />
                    <span>Download Excel Report</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isRegisterModalOpen && (
        <RegisterAssetModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
        />
      )}

      {isBulkImportModalOpen && (
        <BulkAssetImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
        />
      )}

      {isAllocateModalOpen && (
        <AllocateAssetModal
          isOpen={isAllocateModalOpen}
          asset={selectedAssetForAction}
          onClose={() => setIsAllocateModalOpen(false)}
        />
      )}

      {isTransferModalOpen && (
        <TransferAssetModal
          isOpen={isTransferModalOpen}
          asset={selectedAssetForAction}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}

      {isReturnModalOpen && (
        <ReturnAssetModal
          isOpen={isReturnModalOpen}
          asset={selectedAssetForAction}
          onClose={() => setIsReturnModalOpen(false)}
        />
      )}

      {isMaintenanceModalOpen && (
        <LogMaintenanceModal
          isOpen={isMaintenanceModalOpen}
          asset={selectedAssetForAction}
          onClose={() => setIsMaintenanceModalOpen(false)}
        />
      )}

      {isDetailModalOpen && (
        <AssetDetailModal
          isOpen={isDetailModalOpen}
          asset={selectedAssetForAction}
          onClose={() => setIsDetailModalOpen(false)}
          onAllocate={() => setIsAllocateModalOpen(true)}
          onTransfer={() => setIsTransferModalOpen(true)}
          onReturn={() => setIsReturnModalOpen(true)}
          onMaintenance={() => setIsMaintenanceModalOpen(true)}
        />
      )}

      {isClassroomModalOpen && (
        <AllocateClassroomModal
          isOpen={isClassroomModalOpen}
          onClose={() => setIsClassroomModalOpen(false)}
        />
      )}

      {isLabModalOpen && (
        <AllocateLaboratoryModal
          isOpen={isLabModalOpen}
          onClose={() => setIsLabModalOpen(false)}
        />
      )}

      {isFacultyModalOpen && (
        <AllocateFacultyModal
          isOpen={isFacultyModalOpen}
          onClose={() => setIsFacultyModalOpen(false)}
        />
      )}

      {isRequestModalOpen && (
        <CreateAssetRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
        />
      )}
    </div>
  );
};
