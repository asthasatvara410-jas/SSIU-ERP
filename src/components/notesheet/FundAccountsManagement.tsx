import React, { useState } from 'react';
import { FundAccount, FundSource, ExpenseCategory } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Landmark, Plus, Edit2, CheckCircle2, ShieldAlert, Layers, Tags } from 'lucide-react';

interface Props {
  onRefresh: () => void;
}

export const FundAccountsManagement: React.FC<Props> = ({ onRefresh }) => {
  const { user, role } = useAuth();
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>(() => db.getFundAccounts());
  const [fundSources, setFundSources] = useState<FundSource[]>(() => db.getFundSources());
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => db.getExpenseCategories());

  // Edit / Create Account State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FundAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [accountDesc, setAccountDesc] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Edit / Create Category State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // Edit / Create Source State
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [sourceDesc, setSourceDesc] = useState('');

  const isAdmin = role === 'SUPER_ADMIN' || role === 'REGISTRAR';

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountCode(`FUND-${Date.now().toString().slice(-4)}`);
    setAccountDesc('');
    setOpeningBalance(0);
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (acc: FundAccount) => {
    setEditingAccount(acc);
    setAccountName(acc.name);
    setAccountCode(acc.code);
    setAccountDesc(acc.description || '');
    setOpeningBalance(acc.openingBalance || 0);
    setShowAccountModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    if (editingAccount) {
      db.saveFundAccount({
        ...editingAccount,
        name: accountName.trim(),
        code: accountCode.trim(),
        description: accountDesc.trim(),
        openingBalance: Number(openingBalance)
      }, user || undefined);
    } else {
      db.saveFundAccount({
        id: `fund-acc-${Date.now()}`,
        name: accountName.trim(),
        code: accountCode.trim() || `ACC-${Date.now().toString().slice(-4)}`,
        description: accountDesc.trim(),
        openingBalance: Number(openingBalance),
        totalCredits: Number(openingBalance),
        totalDebits: 0,
        currentBalance: Number(openingBalance),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, user || undefined);
    }

    setFundAccounts(db.getFundAccounts());
    setShowAccountModal(false);
    onRefresh();
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    db.saveExpenseCategory({
      id: `cat-${Date.now()}`,
      name: categoryName.trim(),
      code: categoryCode.trim() || categoryName.trim().toUpperCase().replace(/\s+/g, '_'),
      description: categoryDesc.trim(),
      isActive: true
    }, user || undefined);

    setExpenseCategories(db.getExpenseCategories());
    setShowCategoryModal(false);
    onRefresh();
  };

  const handleSaveSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;

    db.saveFundSource({
      id: `src-${Date.now()}`,
      name: sourceName.trim(),
      code: sourceCode.trim() || sourceName.trim().toUpperCase().replace(/\s+/g, '_'),
      description: sourceDesc.trim(),
      isActive: true
    }, user || undefined);

    setFundSources(db.getFundSources());
    setShowSourceModal(false);
    onRefresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Landmark size={20} color="var(--brand-orange)" /> Fund Accounts &amp; Multi-Head Ledgers
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure university fund heads, track account balances, manage income sources and expense categories.
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSourceModal(true)}>
              + Add Fund Source
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCategoryModal(true)}>
              + Add Expense Category
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddAccount} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={15} /> Add Fund Account
            </button>
          </div>
        )}
      </div>

      {/* Fund Accounts Master Cards / Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={16} /> University Fund Accounts ({fundAccounts.length})
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
            Total University Funds: ₹{fundAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name / Head</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Opening Balance (₹)</th>
                <th style={{ textAlign: 'right' }}>Total Credits (₹)</th>
                <th style={{ textAlign: 'right' }}>Total Debits (₹)</th>
                <th style={{ textAlign: 'right' }}>Current Balance (₹)</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {fundAccounts.map(acc => (
                <tr key={acc.id}>
                  <td><code>{acc.code}</code></td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{acc.name}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{acc.description || '-'}</td>
                  <td style={{ textAlign: 'right' }}>₹{(acc.openingBalance || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>+ ₹{(acc.totalCredits || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>- ₹{(acc.totalDebits || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: acc.currentBalance <= 0 ? '#dc2626' : '#059669', fontSize: '0.95rem' }}>
                    ₹{(acc.currentBalance || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#16a34a', fontWeight: 700 }}>
                      {acc.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEditAccount(acc)} title="Edit Account">
                        <Edit2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Fund Sources & Expense Categories */}
      <div className="grid-2">
        
        {/* Fund Sources */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tags size={16} color="var(--brand-orange)" /> Standard Fund Sources ({fundSources.length})
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {fundSources.map(s => (
              <span key={s.id} className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}>
                {s.name} ({s.code})
              </span>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tags size={16} color="var(--brand-navy)" /> Configured Expense Categories ({expenseCategories.length})
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {expenseCategories.map(c => (
              <span key={c.id} className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--brand-orange)', padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {showAccountModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              {editingAccount ? 'Edit Fund Account' : 'Create New Fund Account'}
            </h3>
            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Research & Innovation Fund" value={accountName} onChange={e => setAccountName(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Account Code *</label>
                  <input type="text" className="form-input" placeholder="e.g. RIF-04" value={accountCode} onChange={e => setAccountCode(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input type="number" min="0" step="any" className="form-input" value={openingBalance} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Account purpose and scope details..." value={accountDesc} onChange={e => setAccountDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAccountModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', background: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Add Expense Category
            </h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Guest Hospitality, Logistics" value={categoryName} onChange={e => setCategoryName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category Code</label>
                <input type="text" className="form-input" placeholder="e.g. HOSPITALITY" value={categoryCode} onChange={e => setCategoryCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="Brief scope..." value={categoryDesc} onChange={e => setCategoryDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showSourceModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', background: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Add Fund Source
            </h3>
            <form onSubmit={handleSaveSource} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Source Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Industry CSR Grant" value={sourceName} onChange={e => setSourceName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Source Code</label>
                <input type="text" className="form-input" placeholder="e.g. CSR_GRANT" value={sourceCode} onChange={e => setSourceCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="Brief description..." value={sourceDesc} onChange={e => setSourceDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSourceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
