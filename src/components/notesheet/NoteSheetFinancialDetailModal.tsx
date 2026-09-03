import React, { useState } from 'react';
import { NoteSheet, ReimbursementClaim } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { NoteSheetFinancialSummaryCard } from './NoteSheetFinancialSummaryCard';
import { AddMoneyReceivedModal } from './AddMoneyReceivedModal';
import { AddExpenseModal } from './AddExpenseModal';
import { AddReimbursementModal } from './AddReimbursementModal';
import { AddRefundModal } from './AddRefundModal';
import { FinalSettlementModal } from './FinalSettlementModal';
import {
  X, IndianRupee, ArrowDownLeft, ArrowUpRight, Receipt, RotateCcw,
  CheckCircle2, FileText, Download, Check, Ban, DollarSign, Eye
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onRefresh: () => void;
}

export const NoteSheetFinancialDetailModal: React.FC<Props> = ({ noteSheet, onClose, onRefresh }) => {
  const { user, role } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'ESTIMATE_VS_ACTUAL' | 'INCOME' | 'EXPENSES' | 'REIMBURSEMENTS' | 'REFUNDS' | 'LEDGER'>('ESTIMATE_VS_ACTUAL');

  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showReimbModal, setShowReimbModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  // Pay reimbursement modal state
  const [payingClaim, setPayingClaim] = useState<ReimbursementClaim | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [payRefNo, setPayRefNo] = useState('');

  const fundAccounts = db.getFundAccounts();
  const summary = db.getNoteSheetFinancialSummary(noteSheet.id);
  const receipts = db.getMoneyReceived(noteSheet.id);
  const expenses = db.getExpenses(noteSheet.id);
  const reimbursements = db.getReimbursements(noteSheet.id);
  const refunds = db.getRefunds(noteSheet.id);
  const ledger = db.getAccountLedger(noteSheet.id);

  const canManageAccounts = role === 'SUPER_ADMIN' || role === 'REGISTRAR' || role === 'HOD' || role === 'PRINCIPAL';

  const handleProcessReimbursement = (claimId: string, action: 'APPROVE' | 'REJECT') => {
    db.processReimbursement(claimId, action, `Processed by ${user?.name || 'Admin'}`, undefined, user || undefined);
    onRefresh();
  };

  const handleDisburseReimbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingClaim) return;
    const accId = payAccountId || noteSheet.allocatedFundAccountId || fundAccounts[0]?.id;
    db.processReimbursement(payingClaim.id, 'PAY', 'Payment disbursed', {
      fundAccountId: accId,
      referenceNo: payRefNo || `PAY-REIMB-${Date.now().toString().slice(-6)}`
    }, user || undefined);
    setPayingClaim(null);
    onRefresh();
  };

  const handleExportNoteSheetLedger = () => {
    const headers = ['Date', 'Transaction ID', 'Type', 'Description', 'Reference', 'Money In (₹)', 'Money Out (₹)', 'Running Balance (₹)', 'Payment Mode', 'Created By'];
    const rows = ledger.map(l => [
      l.date,
      l.transactionId,
      l.transactionType,
      l.description,
      l.reference,
      l.moneyIn || '-',
      l.moneyOut || '-',
      l.balance,
      l.paymentMode,
      l.createdBy
    ]);
    exportToExcel(
      `Ledger - ${noteSheet.noteSheetNumber}`,
      headers,
      rows,
      { searchQuery: noteSheet.noteSheetNumber },
      { name: user?.name, role: user?.role }
    );
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1040, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)' }}>
      <div className="card" style={{ width: '96%', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 800 }}>
                {noteSheet.noteSheetNumber}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Account &amp; Fund Management Hub
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.25rem 0 0 0' }}>
              {noteSheet.subject} — Created by {noteSheet.creatorName} ({noteSheet.date})
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ color: '#FFFFFF' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Financial Summary Card */}
          <NoteSheetFinancialSummaryCard summary={summary} />

          {/* Action Toolbars */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowIncomeModal(true)}
                disabled={summary.isClosed}
                style={{ background: '#10b981', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <ArrowDownLeft size={15} /> + Add Income / Money Received
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowExpenseModal(true)}
                disabled={summary.isClosed}
                style={{ background: 'var(--brand-orange)', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <ArrowUpRight size={15} /> + Record Expense / Bill
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowReimbModal(true)}
                disabled={summary.isClosed}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Receipt size={15} color="var(--brand-orange)" /> Submit Reimbursement Claim
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRefundModal(true)}
                disabled={summary.isClosed}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={15} color="var(--brand-navy)" /> Return / Refund Money
              </button>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowSettlementModal(true)}
                style={{
                  background: summary.isClosed ? 'rgba(100, 116, 139, 0.2)' : 'var(--brand-navy)',
                  color: summary.isClosed ? '#334155' : '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700
                }}
              >
                <CheckCircle2 size={15} />
                {summary.isClosed ? 'View Settlement Report' : 'Final Settlement & Close Account'}
              </button>
            </div>
          </div>

          {/* Sub Tabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem', overflowX: 'auto' }}>
            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'ESTIMATE_VS_ACTUAL' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('ESTIMATE_VS_ACTUAL')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'ESTIMATE_VS_ACTUAL' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'ESTIMATE_VS_ACTUAL' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Estimate vs Actual ({noteSheet.items?.length || 0} items)
            </button>

            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'INCOME' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('INCOME')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'INCOME' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'INCOME' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Money Received ({receipts.length})
            </button>

            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'EXPENSES' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('EXPENSES')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'EXPENSES' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'EXPENSES' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Expenses &amp; Bills ({expenses.length})
            </button>

            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'REIMBURSEMENTS' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('REIMBURSEMENTS')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'REIMBURSEMENTS' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'REIMBURSEMENTS' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Reimbursements ({reimbursements.length})
            </button>

            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'REFUNDS' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('REFUNDS')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'REFUNDS' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'REFUNDS' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Refunds / Returned ({refunds.length})
            </button>

            <button
              type="button"
              className={`tab-btn ${activeSubTab === 'LEDGER' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('LEDGER')}
              style={{ padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeSubTab === 'LEDGER' ? '2.5px solid var(--brand-orange)' : 'none', color: activeSubTab === 'LEDGER' ? 'var(--brand-navy)' : 'var(--text-muted)' }}
            >
              Account Ledger ({ledger.length})
            </button>
          </div>

          {/* Sub-tab 1: Estimate vs Actual Expenses */}
          {activeSubTab === 'ESTIMATE_VS_ACTUAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Proposed Estimate vs Actual Expenses Realized
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total Estimated: <strong>₹{((noteSheet.totalEstimatedAmount || noteSheet.estimatedCost) || 0).toLocaleString('en-IN')}</strong> | Total Actual: <strong style={{ color: '#dc2626' }}>₹{summary.totalSpent.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Sr. No.</th>
                      <th>Proposed Item / Specification</th>
                      <th>Qty &amp; Unit</th>
                      <th>Estimated Rate</th>
                      <th>Estimated Total</th>
                      <th>Actual Spent</th>
                      <th>Variance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!noteSheet.items || noteSheet.items.length === 0) ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No itemized estimate details recorded. Single lumpsum budget of ₹{((noteSheet.totalEstimatedAmount || noteSheet.estimatedCost) || 0).toLocaleString('en-IN')} was approved.
                        </td>
                      </tr>
                    ) : (
                      noteSheet.items.map((item, idx) => {
                        // Find matching expenses by item name substring
                        const matchedExp = expenses.filter(e => e.itemName.toLowerCase().includes(item.itemName.toLowerCase()) || item.itemName.toLowerCase().includes(e.itemName.toLowerCase()));
                        const spentForItem = matchedExp.reduce((s, e) => s + e.totalAmount, 0);
                        const variance = item.amount - spentForItem;

                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{item.itemName}</div>
                              {item.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</div>}
                            </td>
                            <td>{item.quantity} {item.unit}</td>
                            <td>₹{item.rate.toLocaleString('en-IN')}</td>
                            <td style={{ fontWeight: 700 }}>₹{item.amount.toLocaleString('en-IN')}</td>
                            <td style={{ fontWeight: 700, color: spentForItem > item.amount ? '#dc2626' : '#10b981' }}>
                              ₹{spentForItem.toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontWeight: 700, color: variance < 0 ? '#dc2626' : '#059669' }}>
                              {variance >= 0 ? `+ ₹${variance.toLocaleString('en-IN')}` : `- ₹${Math.abs(variance).toLocaleString('en-IN')}`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Money Received */}
          {activeSubTab === 'INCOME' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  All Money Received / Credits Log
                </h4>
                <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.95rem' }}>
                  Total Received: ₹{summary.totalReceived.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Fund / Bank Account</th>
                      <th>Payment Mode</th>
                      <th>Reference ID</th>
                      <th>Received By</th>
                      <th>Remarks</th>
                      <th>Attachment</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No money received records found. Click "+ Add Income" above to log credits.
                        </td>
                      </tr>
                    ) : (
                      receipts.map(r => (
                        <tr key={r.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r.date}</td>
                          <td><span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8' }}>{r.source}</span></td>
                          <td>{r.bankAccountName}</td>
                          <td>{r.paymentMode}</td>
                          <td><code>{r.referenceNo}</code></td>
                          <td>{r.receivedBy}</td>
                          <td>{r.remarks || '-'}</td>
                          <td>
                            {r.receiptUrl ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--brand-navy)', fontSize: '0.75rem' }}>
                                <FileText size={13} /> {r.receiptUrl}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                            + ₹{r.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Expenses & Bills */}
          {activeSubTab === 'EXPENSES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  All Recorded Expenses &amp; Vendor Payments
                </h4>
                <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                  Total Spent: ₹{summary.totalSpent.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Item / Payee</th>
                      <th>Qty &amp; Unit</th>
                      <th>Rate</th>
                      <th>Vendor</th>
                      <th>Invoice No.</th>
                      <th>Paid From</th>
                      <th>Mode</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No expenses recorded yet. Click "+ Record Expense" above to log bills.
                        </td>
                      </tr>
                    ) : (
                      expenses.map(e => (
                        <tr key={e.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{e.date}</td>
                          <td><span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--brand-orange)' }}>{e.category}</span></td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{e.itemName}</div>
                            {e.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.description}</div>}
                          </td>
                          <td>{e.quantity} {e.unit}</td>
                          <td>₹{e.rate.toLocaleString('en-IN')}</td>
                          <td>{e.vendor}</td>
                          <td><code>{e.invoiceNo}</code></td>
                          <td>{e.paidFromAccountName}</td>
                          <td>{e.paymentMode}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            ₹{e.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Reimbursements */}
          {activeSubTab === 'REIMBURSEMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Faculty &amp; Student Reimbursement Claims
                </h4>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReimbModal(true)}>
                  + New Claim
                </button>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Date</th>
                      <th>Applicant</th>
                      <th>Role</th>
                      <th>Category</th>
                      <th>Purpose</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reimbursements.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No reimbursement claims submitted for this Note Sheet.
                        </td>
                      </tr>
                    ) : (
                      reimbursements.map(claim => (
                        <tr key={claim.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{claim.expenseDate}</td>
                          <td style={{ fontWeight: 700 }}>{claim.applicantName}</td>
                          <td><span className="badge">{claim.applicantRole}</span></td>
                          <td>{claim.category}</td>
                          <td>
                            <div>{claim.purpose}</div>
                            {claim.billAttachmentUrl && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
                                📎 {claim.billAttachmentUrl}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                            ₹{claim.amount.toLocaleString('en-IN')}
                          </td>
                          <td>
                            {claim.status === 'PAID' && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#16a34a', fontWeight: 700 }}>PAID</span>}
                            {claim.status === 'APPROVED' && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8', fontWeight: 700 }}>APPROVED</span>}
                            {claim.status === 'REJECTED' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', fontWeight: 700 }}>REJECTED</span>}
                            {claim.status === 'PENDING' && <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#b45309', fontWeight: 700 }}>PENDING</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {claim.status === 'PENDING' && canManageAccounts && (
                                <>
                                  <button
                                    className="btn btn-xs"
                                    style={{ background: '#10b981', color: '#fff' }}
                                    onClick={() => handleProcessReimbursement(claim.id, 'APPROVE')}
                                    title="Approve Claim"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    className="btn btn-xs"
                                    style={{ background: '#ef4444', color: '#fff' }}
                                    onClick={() => handleProcessReimbursement(claim.id, 'REJECT')}
                                    title="Reject Claim"
                                  >
                                    <Ban size={13} />
                                  </button>
                                </>
                              )}
                              {claim.status === 'APPROVED' && canManageAccounts && (
                                <button
                                  className="btn btn-xs"
                                  style={{ background: 'var(--brand-navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                  onClick={() => {
                                    setPayingClaim(claim);
                                    setPayAccountId(noteSheet.allocatedFundAccountId || fundAccounts[0]?.id || '');
                                  }}
                                  title="Disburse Payment"
                                >
                                  <DollarSign size={13} /> Pay Now
                                </button>
                              )}
                              {claim.status === 'PAID' && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Ref: {claim.paymentReference}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 5: Refunds */}
          {activeSubTab === 'REFUNDS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Returned / Refunded Money Log
                </h4>
                <div style={{ fontWeight: 800, color: '#7e22ce', fontSize: '0.95rem' }}>
                  Total Returned: ₹{summary.totalReturned.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Returned To Account</th>
                      <th>Payment Mode</th>
                      <th>Reference ID</th>
                      <th>Processed By</th>
                      <th>Remarks</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No refund or returned money records.
                        </td>
                      </tr>
                    ) : (
                      refunds.map(ref => (
                        <tr key={ref.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{ref.date}</td>
                          <td style={{ fontWeight: 700 }}>{ref.reason}</td>
                          <td>{ref.toAccountName}</td>
                          <td>{ref.paymentMode}</td>
                          <td><code>{ref.referenceNo}</code></td>
                          <td>{ref.processedBy}</td>
                          <td>{ref.remarks || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#7e22ce' }}>
                            + ₹{ref.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 6: Ledger */}
          {activeSubTab === 'LEDGER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    Complete Note Sheet Account Ledger
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Chronological audit trail of all credits, debits, running balances, and authorizations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportNoteSheetLedger}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} /> Export Ledger (Excel / CSV)
                </button>
              </div>

              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Date</th>
                      <th>Txn ID</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th style={{ textAlign: 'right' }}>Money In (₹)</th>
                      <th style={{ textAlign: 'right' }}>Money Out (₹)</th>
                      <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                      <th>Mode</th>
                      <th>Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No transactions recorded in ledger for this Note Sheet yet.
                        </td>
                      </tr>
                    ) : (
                      ledger.map(entry => (
                        <tr key={entry.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date}</td>
                          <td><code>{entry.transactionId}</code></td>
                          <td>
                            <span className="badge" style={{
                              background: entry.transactionType === 'MONEY_RECEIVED' ? 'rgba(16, 185, 129, 0.15)' :
                                entry.transactionType === 'EXPENSE' ? 'rgba(239, 68, 68, 0.15)' :
                                entry.transactionType === 'REFUND' ? 'rgba(168, 85, 247, 0.15)' :
                                'rgba(100, 116, 139, 0.15)',
                              color: entry.transactionType === 'MONEY_RECEIVED' ? '#16a34a' :
                                entry.transactionType === 'EXPENSE' ? '#dc2626' :
                                entry.transactionType === 'REFUND' ? '#7e22ce' :
                                '#334155',
                              fontWeight: 700
                            }}>
                              {entry.transactionType}
                            </span>
                          </td>
                          <td>{entry.description}</td>
                          <td><code>{entry.reference}</code></td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {entry.moneyIn > 0 ? `₹${entry.moneyIn.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                            {entry.moneyOut > 0 ? `₹${entry.moneyOut.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)' }}>
                            ₹{entry.balance.toLocaleString('en-IN')}
                          </td>
                          <td>{entry.paymentMode}</td>
                          <td>{entry.createdBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Financial calculations validated against real-time backend ledger source of truth.
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Hub
          </button>
        </div>

        {/* Sub-Modals */}
        {showIncomeModal && (
          <AddMoneyReceivedModal
            noteSheet={noteSheet}
            onClose={() => setShowIncomeModal(false)}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}

        {showExpenseModal && (
          <AddExpenseModal
            noteSheet={noteSheet}
            onClose={() => setShowExpenseModal(false)}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}

        {showReimbModal && (
          <AddReimbursementModal
            noteSheet={noteSheet}
            onClose={() => setShowReimbModal(false)}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}

        {showRefundModal && (
          <AddRefundModal
            noteSheet={noteSheet}
            onClose={() => setShowRefundModal(false)}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}

        {showSettlementModal && (
          <FinalSettlementModal
            noteSheet={noteSheet}
            onClose={() => setShowSettlementModal(false)}
            onSuccess={() => {
              onRefresh();
            }}
          />
        )}

        {/* Reimbursement Payment Modal */}
        {payingClaim && (
          <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', background: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                Disburse Reimbursement Payment
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Claimant: <strong>{payingClaim.applicantName}</strong> — Amount: <strong style={{ color: 'var(--brand-orange)' }}>₹{payingClaim.amount.toLocaleString('en-IN')}</strong>
              </p>

              <form onSubmit={handleDisburseReimbursement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Disburse From Fund Account *</label>
                  <select className="form-select" value={payAccountId} onChange={e => setPayAccountId(e.target.value)} required>
                    {fundAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Bal: ₹{a.currentBalance.toLocaleString('en-IN')})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment UTR / Reference Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UTR-REIMB-99120"
                    value={payRefNo}
                    onChange={e => setPayRefNo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPayingClaim(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Confirm &amp; Disburse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
