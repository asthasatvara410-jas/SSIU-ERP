import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { FeeInvoice, FeeInvoiceStatus } from '../../types';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FeeInvoiceViewModal } from './FeeInvoiceViewModal';
import { GenerateInvoiceModal } from './GenerateInvoiceModal';
import {
  FileText, Plus, Search, Filter, Printer, Eye, CheckCircle2,
  AlertTriangle, XCircle, DollarSign, Calendar, Layers, ShieldAlert, ArrowUpRight
} from 'lucide-react';

export const FeeInvoiceManagementTab: React.FC = () => {
  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => db.getFeeInvoices());

  const programs = db.getPrograms();
  const semesters = db.getSemesters();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [progFilter, setProgFilter] = useState<string>('ALL');

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<FeeInvoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<FeeInvoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Administrative error / Fee adjustment required');

  const refreshInvoices = () => {
    setInvoices([...db.getFeeInvoices()]);
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        searchTerm === '' ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.enrollmentNo || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesProg = progFilter === 'ALL' || inv.programId === progFilter;

      return matchesSearch && matchesStatus && matchesProg;
    });
  }, [invoices, searchTerm, statusFilter, progFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalDemands = invoices.length;
    const totalAmount = invoices
      .filter(i => i.status !== 'CANCELLED')
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const issuedCount = invoices.filter(i => i.status === 'ISSUED').length;
    const cancelledCount = invoices.filter(i => i.status === 'CANCELLED').length;

    return { totalDemands, totalAmount, issuedCount, cancelledCount };
  }, [invoices]);

  const handleIssueDraft = (invoiceId: string) => {
    db.issueFeeInvoice(invoiceId);
    refreshInvoices();
  };

  const handleConfirmCancel = () => {
    if (cancellingInvoice) {
      db.cancelFeeInvoice(cancellingInvoice.id, cancellationReason);
      setCancellingInvoice(null);
      refreshInvoices();
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Overview */}
      <div className="grid-4">
        <StatCard
          title="Total Invoiced Amount"
          value={`₹${stats.totalAmount.toLocaleString('en-IN')}`}
          subtitle="Cumulative demand value"
          icon={DollarSign}
          colorScheme="blue"
        />
        <StatCard
          title="Total Demands Generated"
          value={stats.totalDemands}
          subtitle="All academic invoices"
          icon={FileText}
          colorScheme="navy"
        />
        <StatCard
          title="Active Issued Invoices"
          value={stats.issuedCount}
          subtitle="Demanded from students"
          icon={CheckCircle2}
          colorScheme="green"
        />
        <StatCard
          title="Cancelled Invoices"
          value={stats.cancelledCount}
          subtitle="Voided demand notices"
          icon={XCircle}
          colorScheme="gold"
        />
      </div>

      {/* Action Header & Search Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Official Fee Invoices &amp; Demands
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Generate, issue, and manage official fee demand notices from assigned student fee ledgers.
            </p>
          </div>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            Generate Fee Invoice
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid-4" style={{ marginTop: '0.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Invoices</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Invoice #, student or enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Demand Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">ISSUED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Program Filter</label>
            <select
              className="form-select"
              value={progFilter}
              onChange={(e) => setProgFilter(e.target.value)}
            >
              <option value="ALL">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setProgFilter('ALL'); }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Invoice Number</th>
                <th style={{ padding: '0.75rem' }}>Student &amp; Enrollment</th>
                <th style={{ padding: '0.75rem' }}>Program &amp; Term</th>
                <th style={{ padding: '0.75rem' }}>Invoice Date</th>
                <th style={{ padding: '0.75rem' }}>Due Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Amount (₹)</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    <FileText size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No fee invoices found matching your filters.</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>
                      Click "Generate Fee Invoice" to create official demands from assigned fee ledgers.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const prog = db.getProgramById(inv.programId || '');
                  const sem = db.getSemesterById(inv.semesterId || '');

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Invoice No */}
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: '#1e40af' }}>
                        {inv.invoiceNumber}
                      </td>

                      {/* Student */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{inv.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {inv.enrollmentNo}
                        </div>
                      </td>

                      {/* Program & Semester */}
                      <td style={{ padding: '0.75rem' }}>
                        <Badge variant="navy">{prog?.code || 'B.Tech'} • {sem?.code || `Sem ${inv.semesterId}`}</Badge>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '0.75rem', color: '#475569' }}>{inv.invoiceDate}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>{inv.dueDate}</td>

                      {/* Amount */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {inv.status === 'ISSUED' && <Badge variant="success">ISSUED</Badge>}
                        {inv.status === 'DRAFT' && <Badge variant="gold">DRAFT</Badge>}
                        {inv.status === 'CANCELLED' && <Badge variant="danger">CANCELLED</Badge>}
                        {inv.status === 'PAID' && <Badge variant="success">PAID</Badge>}
                        {inv.status === 'OVERDUE' && <Badge variant="danger">OVERDUE</Badge>}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewingInvoice(inv)}
                            title="View Demand Details"
                          >
                            <Eye size={13} />
                            View
                          </button>

                          {inv.status === 'DRAFT' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleIssueDraft(inv.id)}
                              title="Issue this Draft Demand"
                            >
                              <CheckCircle2 size={13} />
                              Issue
                            </button>
                          )}

                          {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setCancellingInvoice(inv)}
                              title="Cancel Fee Demand"
                            >
                              <XCircle size={13} />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <GenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={() => refreshInvoices()}
      />

      {/* View Fee Invoice / Demand Modal */}
      <FeeInvoiceViewModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
      />

      {/* Cancel Confirmation Dialog */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Cancel Fee Demand Notice
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel fee invoice <strong>{cancellingInvoice.invoiceNumber}</strong> for <strong>{cancellingInvoice.studentName}</strong> (₹{Number(cancellingInvoice.totalAmount).toLocaleString('en-IN')})?
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Reason for Cancellation *
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Invoiced incorrect fee head amount, reissue required"
                className="form-control text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancellingInvoice(null)}
                className="btn btn-secondary btn-sm"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancellationReason.trim()}
                className="btn btn-danger btn-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
