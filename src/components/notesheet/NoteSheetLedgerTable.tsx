import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { LedgerTransactionType } from '../../types';
import { BookOpen, Search, Download, Filter, Calendar } from 'lucide-react';
import { exportToExcel } from '../../services/exportService';

export const NoteSheetLedgerTable: React.FC = () => {
  const { user } = useAuth();
  const [ledgerEntries] = useState(() => db.getAccountLedger());
  const fundAccounts = db.getFundAccounts();
  const noteSheets = db.getNoteSheets();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFundAccount, setSelectedFundAccount] = useState('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedNoteSheet, setSelectedNoteSheet] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          entry.description.toLowerCase().includes(q) ||
          entry.transactionId.toLowerCase().includes(q) ||
          entry.reference.toLowerCase().includes(q) ||
          (entry.noteSheetNumber && entry.noteSheetNumber.toLowerCase().includes(q)) ||
          entry.createdBy.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Fund Account
      if (selectedFundAccount !== 'ALL' && entry.fundAccountId !== selectedFundAccount) {
        return false;
      }

      // Transaction Type
      if (selectedType !== 'ALL' && entry.transactionType !== selectedType) {
        return false;
      }

      // Note Sheet
      if (selectedNoteSheet !== 'ALL' && entry.noteSheetId !== selectedNoteSheet) {
        return false;
      }

      // Date Range
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;

      return true;
    });
  }, [ledgerEntries, searchQuery, selectedFundAccount, selectedType, selectedNoteSheet, startDate, endDate]);

  const totalMoneyIn = filteredEntries.reduce((s, e) => s + (e.moneyIn || 0), 0);
  const totalMoneyOut = filteredEntries.reduce((s, e) => s + (e.moneyOut || 0), 0);

  const handleExport = () => {
    const headers = [
      'Date', 'Transaction ID', 'Note Sheet No.', 'Fund Account', 'Transaction Type',
      'Description', 'Reference', 'Money In (₹)', 'Money Out (₹)', 'Running Balance (₹)',
      'Payment Mode', 'Created By'
    ];
    const rows = filteredEntries.map(e => [
      e.date,
      e.transactionId,
      e.noteSheetNumber || '-',
      e.fundAccountName,
      e.transactionType,
      e.description,
      e.reference,
      e.moneyIn || 0,
      e.moneyOut || 0,
      e.balance,
      e.paymentMode,
      e.createdBy
    ]);

    exportToExcel(
      'Account Ledger Audit Report',
      headers,
      rows,
      {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchQuery: searchQuery || undefined
      },
      { name: user?.name, role: user?.role }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <BookOpen size={20} color="var(--brand-orange)" /> Comprehensive Account Ledger &amp; Audit Trail
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Complete historical record of all university fund allocations, income credits, expenses, reimbursements and settlements.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Download size={15} /> Export Ledger (Excel / CSV)
        </button>
      </div>

      {/* Filter Panel */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Ledger</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                placeholder="Search transaction, payee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Fund Account</label>
            <select className="form-select" style={{ fontSize: '0.85rem' }} value={selectedFundAccount} onChange={e => setSelectedFundAccount(e.target.value)}>
              <option value="ALL">All Fund Accounts</option>
              {fundAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Transaction Type</label>
            <select className="form-select" style={{ fontSize: '0.85rem' }} value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="MONEY_RECEIVED">Money Received (Credit)</option>
              <option value="EXPENSE">Expense (Debit)</option>
              <option value="REFUND">Refund / Return (Credit)</option>
              <option value="ALLOCATION">Initial Allocation</option>
              <option value="SETTLEMENT">Final Settlement</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Note Sheet</label>
            <select className="form-select" style={{ fontSize: '0.85rem' }} value={selectedNoteSheet} onChange={e => setSelectedNoteSheet(e.target.value)}>
              <option value="ALL">All Note Sheets</option>
              {noteSheets.map(n => (
                <option key={n.id} value={n.id}>{n.noteSheetNumber}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
            <input type="date" className="form-input" style={{ fontSize: '0.85rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
            <input type="date" className="form-input" style={{ fontSize: '0.85rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Ledger Filter Summary Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            Showing <strong>{filteredEntries.length}</strong> transactions
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 700 }}>
            <span style={{ color: '#16a34a' }}>Total In: + ₹{totalMoneyIn.toLocaleString('en-IN')}</span>
            <span style={{ color: '#dc2626' }}>Total Out: - ₹{totalMoneyOut.toLocaleString('en-IN')}</span>
            <span style={{ color: 'var(--brand-navy)' }}>Net Flow: ₹{(totalMoneyIn - totalMoneyOut).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)' }}>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Note Sheet</th>
                <th>Fund Head / Account</th>
                <th>Type</th>
                <th>Description</th>
                <th>Reference</th>
                <th style={{ textAlign: 'right' }}>Money In (₹)</th>
                <th style={{ textAlign: 'right' }}>Money Out (₹)</th>
                <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                <th>Payment Mode</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No ledger transactions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date}</td>
                    <td><code>{entry.transactionId}</code></td>
                    <td>
                      <strong style={{ color: 'var(--brand-navy)' }}>{entry.noteSheetNumber || '-'}</strong>
                    </td>
                    <td>{entry.fundAccountName}</td>
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
                      {entry.moneyIn > 0 ? `+ ₹${entry.moneyIn.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      {entry.moneyOut > 0 ? `- ₹${entry.moneyOut.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--brand-navy)' }}>
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

    </div>
  );
};
