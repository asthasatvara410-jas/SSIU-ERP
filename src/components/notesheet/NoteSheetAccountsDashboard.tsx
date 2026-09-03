import React, { useState } from 'react';
import { db } from '../../services/db';
import { NoteSheet } from '../../types';
import {
  Landmark, ArrowDownLeft, ArrowUpRight, Wallet, AlertTriangle,
  Receipt, FileCheck, PieChart, TrendingUp, AlertCircle, Eye, ArrowRight
} from 'lucide-react';

interface Props {
  onOpenNoteSheetFinance: (noteSheet: NoteSheet) => void;
}

export const NoteSheetAccountsDashboard: React.FC<Props> = ({ onOpenNoteSheetFinance }) => {
  const stats = db.getOverallFinancialStats();
  const fundAccounts = db.getFundAccounts();
  const expenses = db.getExpenses();
  const receipts = db.getMoneyReceived();
  const noteSheets = db.getNoteSheets();
  const ledger = db.getAccountLedger().slice(0, 8); // top 8 recent transactions

  // Category-wise expense calculation
  const categoryMap: { [cat: string]: number } = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.totalAmount;
  });
  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const maxCategorySpent = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  // Warning note sheets (>=75% utilization)
  const warningNoteSheets = noteSheets
    .filter(n => n.status === 'APPROVED' || n.status === 'COMPLETED')
    .map(n => ({
      noteSheet: n,
      summary: db.getNoteSheetFinancialSummary(n.id)
    }))
    .filter(item => item.summary.warningLevel !== 'NORMAL')
    .sort((a, b) => b.summary.utilizedPercentage - a.summary.utilizedPercentage);

  return (
    <div className="notesheet-module-container space-y-6">
      
      {/* 7 KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Funds Available</span>
            <Landmark size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.35rem' }}>
            ₹ {stats.totalFundsAvailable.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
            Across {fundAccounts.length} Fund Heads
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #1d4ed8', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Money Received</span>
            <ArrowDownLeft size={18} color="#1d4ed8" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1e40af', marginTop: '0.35rem' }}>
            ₹ {stats.totalMoneyReceived.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {receipts.length} credits recorded
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #dc2626', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Money Spent</span>
            <ArrowUpRight size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹ {stats.totalMoneySpent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {expenses.length} bills / expenses
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--brand-orange)', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Net Disbursed Balance</span>
            <Wallet size={18} color="var(--brand-orange)" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '0.35rem' }}>
            ₹ {stats.totalBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Unspent active note balance
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #7e22ce', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Approved Note Budgets</span>
            <FileCheck size={18} color="#7e22ce" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#6b21a8', marginTop: '0.35rem' }}>
            ₹ {stats.totalApprovedBudgets.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats.activeNoteSheetsCount} sanctioned proposals
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #eab308', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Pending Claims</span>
            <Receipt size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#b45309', marginTop: '0.35rem' }}>
            {stats.pendingReimbursementsCount + stats.pendingExpensesCount}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Awaiting verification / approval
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Budget Overuse Risk</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ef4444', marginTop: '0.35rem' }}>
            {warningNoteSheets.length} Notes
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#ef4444', marginTop: '0.2rem', fontWeight: 600 }}>
            Exceeding 75% or 95% limit
          </div>
        </div>
      </div>

      {/* WARNING / BUDGET UTILIZATION NOTIFICATIONS */}
      {warningNoteSheets.length > 0 && (
        <div className="card" style={{ border: '1.5px solid #f97316', background: 'rgba(249, 115, 22, 0.05)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--brand-orange)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Budget Threshold Warnings &amp; Exhaustion Alerts ({warningNoteSheets.length})
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {warningNoteSheets.map(({ noteSheet, summary }) => (
              <div key={noteSheet.id} style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--brand-navy)' }}>{noteSheet.noteSheetNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{noteSheet.subject}</div>
                  </div>
                  <span className="badge" style={{
                    background: summary.warningLevel === 'EXHAUSTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                    color: summary.warningLevel === 'EXHAUSTED' ? '#dc2626' : 'var(--brand-orange)',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}>
                    {summary.utilizedPercentage.toFixed(1)}% Utilized
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Budget: ₹{summary.approvedBudget.toLocaleString('en-IN')}</span>
                  <span>Spent: <strong style={{ color: '#dc2626' }}>₹{summary.totalSpent.toLocaleString('en-IN')}</strong></span>
                  <span>Remaining: <strong style={{ color: summary.balanceAvailable <= 0 ? '#dc2626' : '#059669' }}>₹{summary.balanceAvailable.toLocaleString('en-IN')}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => onOpenNoteSheetFinance(noteSheet)}
                    style={{ color: 'var(--brand-orange)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Manage Account <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS CHARTS GRID */}
      <div className="grid-2">
        
        {/* Category-wise Expense Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PieChart size={18} color="var(--brand-orange)" /> Category-wise Expense Distribution
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: ₹{stats.totalMoneySpent.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categoryEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No expense data recorded.</div>
            ) : (
              categoryEntries.map(([cat, amount]) => {
                const percent = stats.totalMoneySpent > 0 ? (amount / stats.totalMoneySpent) * 100 : 0;
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{cat}</span>
                      <span>
                        <strong style={{ color: 'var(--brand-orange)' }}>₹{amount.toLocaleString('en-IN')}</strong> ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ height: '7px', width: '100%', background: 'var(--bg-surface-hover)', borderRadius: '3.5px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-orange) 0%, var(--brand-navy) 100%)', borderRadius: '3.5px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Fund Heads Balance Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Landmark size={18} color="var(--brand-navy)" /> Fund Account Balances
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {fundAccounts.length} Active Accounts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fundAccounts.map(acc => (
              <div key={acc.id} style={{ padding: '0.75rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>{acc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {acc.code} | Credits: ₹{(acc.totalCredits || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: acc.currentBalance <= 0 ? '#dc2626' : '#059669' }}>
                    ₹{(acc.currentBalance || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT FINANCIAL TRANSACTIONS LEDGER */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Recent Financial Transactions (Audit Trail)
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing latest {ledger.length} entries
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Note Sheet</th>
                <th>Type</th>
                <th>Description</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Money In (₹)</th>
                <th style={{ textAlign: 'right' }}>Money Out (₹)</th>
                <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date}</td>
                  <td><code>{entry.transactionId}</code></td>
                  <td>
                    <strong style={{ color: 'var(--brand-navy)' }}>{entry.noteSheetNumber || '-'}</strong>
                  </td>
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
                  <td>{entry.fundAccountName}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {entry.moneyIn > 0 ? `+ ₹${entry.moneyIn.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    {entry.moneyOut > 0 ? `- ₹${entry.moneyOut.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    ₹{entry.balance.toLocaleString('en-IN')}
                  </td>
                  <td>{entry.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
