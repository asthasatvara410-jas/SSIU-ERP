// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT MAPPING HISTORY MODAL
// ==============================================================================

import React, { useState } from 'react';
import { studentEnrollmentMappingService } from '../../services/studentEnrollmentMappingService';
import { StudentMappingHistoryRecord, StudentMappingHistoryRowDetail } from '../../types/studentMapping';
import { 
  FileText, XCircle, Search, Download, Calendar, Users, 
  CheckCircle2, AlertTriangle, ChevronRight, Eye, RefreshCw, Filter,
  FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { Badge } from '../common/Badge';

export interface StudentMappingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBulkMapModal?: () => void;
}

export const StudentMappingHistoryModal: React.FC<StudentMappingHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenBulkMapModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedHistory, setSelectedHistory] = useState<StudentMappingHistoryRecord | null>(null);
  const [rowSearch, setRowSearch] = useState('');

  if (!isOpen) return null;

  const historyList = studentEnrollmentMappingService.getStudentMappingHistories();

  const filteredHistory = historyList.filter(h => {
    if (filterAcademicYear !== 'ALL' && h.academicYear !== filterAcademicYear) return false;
    if (filterStatus !== 'ALL' && h.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        h.batchId.toLowerCase().includes(q) ||
        h.importedByName.toLowerCase().includes(q) ||
        h.department.toLowerCase().includes(q) ||
        h.program.toLowerCase().includes(q) ||
        (h.fileName && h.fileName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDownloadReport = (historyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    studentEnrollmentMappingService.exportMappingReport(historyId);
  };

  const filteredRows = (selectedHistory?.rowDetails || []).filter(r => {
    if (!rowSearch) return true;
    const q = rowSearch.toLowerCase();
    return (
      r.enrollmentNo.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      (r.studentEmail && r.studentEmail.toLowerCase().includes(q)) ||
      r.program.toLowerCase().includes(q)
    );
  });

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: selectedHistory ? '1250px' : '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #001F3F 0%, #0F2C59 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={22} color="var(--brand-orange)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Student Mapping Import History & Audit Trail
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Complete verifiable record of all bulk enrollment operations and semester transitions
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onOpenBulkMapModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBulkMapModal();
                }}
                className="btn btn-sm btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, var(--brand-orange) 0%, #D95300 100%)'
                }}
              >
                + New Bulk Mapping
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#F8FAFC' }}>
          
          {!selectedHistory ? (
            /* ─────────────────────────────────────────────────────────────
               VIEW 1: HISTORY BATCH SESSIONS TABLE
               ───────────────────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Search & Filter Controls */}
              <div 
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  backgroundColor: '#FFFFFF',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <input
                    className="form-control"
                    placeholder="Search by batch ID, user, department or program..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.875rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>

                <div style={{ width: '160px' }}>
                  <select 
                    className="form-control"
                    value={filterAcademicYear}
                    onChange={e => setFilterAcademicYear(e.target.value)}
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>

                <div style={{ width: '150px' }}>
                  <select 
                    className="form-control"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              {/* History Table */}
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <FileText size={42} style={{ opacity: 0.25, margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem', margin: 0 }}>No mapping history records found</p>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Execute your first bulk mapping to see audited batch sessions here.</p>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Date & Time</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Imported By</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Academic Year</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Department / Program</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Sem / Div</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Total</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Successful</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Failed</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((h) => (
                        <tr 
                          key={h.id}
                          onClick={() => setSelectedHistory(h)}
                          style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                              {new Date(h.timestamp).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{h.importedByName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--brand-orange)', fontWeight: 600 }}>{h.importedByRole}</div>
                          </td>

                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <Badge variant="navy">{h.academicYear}</Badge>
                          </td>

                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <div style={{ fontWeight: 700 }}>{h.department}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{h.program}</div>
                          </td>

                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            <span style={{ fontWeight: 700 }}>{h.semester}</span> / <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{h.division}</span>
                          </td>

                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>
                            {h.totalRecords}
                          </td>

                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            <span style={{ color: '#16A34A', fontWeight: 800 }}>{h.successful}</span>
                          </td>

                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            <span style={{ color: h.failed > 0 ? '#DC2626' : '#94A3B8', fontWeight: 700 }}>{h.failed}</span>
                          </td>

                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                            {h.status === 'COMPLETED' ? (
                              <Badge variant="active">COMPLETED</Badge>
                            ) : h.status === 'PARTIAL' ? (
                              <Badge variant="warning">PARTIAL</Badge>
                            ) : (
                              <Badge variant="danger">FAILED</Badge>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => setSelectedHistory(h)}
                                className="btn btn-sm btn-secondary"
                                title="Inspect Batch Details"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                onClick={(e) => handleDownloadReport(h.id, e)}
                                className="btn btn-sm btn-navy"
                                title="Download Full Excel Audit Report"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Download size={13} /> Report
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               VIEW 2: ROW-LEVEL DETAILS DRILLDOWN FOR SELECTED BATCH
               ───────────────────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Top Details Bar */}
              <div 
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <code style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-orange)', background: '#FFF7ED', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {selectedHistory.batchId}
                    </code>
                    {selectedHistory.status === 'COMPLETED' ? (
                      <Badge variant="active">COMPLETED</Badge>
                    ) : (
                      <Badge variant="warning">{selectedHistory.status}</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Imported on <strong>{new Date(selectedHistory.timestamp).toLocaleString()}</strong> by <strong>{selectedHistory.importedByName}</strong> ({selectedHistory.importedByRole})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => handleDownloadReport(selectedHistory.id)}
                    className="btn btn-navy"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                  >
                    <FileSpreadsheet size={15} /> Download Full Audit Report (.xlsx)
                  </button>
                  <button
                    onClick={() => setSelectedHistory(null)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                  >
                    ← Back to History List
                  </button>
                </div>
              </div>

              {/* Search in Batch Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Processed Student Rows ({selectedHistory.rowDetails.length} total)
                </div>
                <div style={{ position: 'relative', width: '260px' }}>
                  <input
                    className="form-control"
                    placeholder="Search student or enrollment..."
                    value={rowSearch}
                    onChange={e => setRowSearch(e.target.value)}
                    style={{ fontSize: '0.8125rem', height: '34px', paddingLeft: '2rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Rows Details Table */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto', maxHeight: '450px' }}>
                <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, borderBottom: '2px solid #CBD5E1', zIndex: 5 }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', width: '70px' }}>Row No</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Enrollment No</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Student Name</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Program / Sem / Div</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Mentor</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Action</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Execution Status & Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>Row {r.rowNo}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <code style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{r.enrollmentNo}</code>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {r.studentName}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <div>{r.program}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{r.semester} • Div {r.division}</div>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                          {r.mentor || 'Unassigned'}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <Badge variant={r.actionTaken === 'CREATED' ? 'active' : r.actionTaken === 'UPDATED' ? 'warning' : 'danger'}>
                            {r.actionTaken}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{ color: r.status === 'SUCCESS' ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                            {r.message}
                          </span>
                          {r.error && (
                            <div style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                              Error: {r.error}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div 
          style={{
            padding: '0.85rem 1.75rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
