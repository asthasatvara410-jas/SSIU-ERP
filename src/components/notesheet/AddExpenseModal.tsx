import React, { useState, useEffect } from 'react';
import { NoteSheet, PaymentMode } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowUpRight, AlertTriangle, UploadCloud, AlertCircle } from 'lucide-react';

interface Props {
  noteSheet: NoteSheet;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<Props> = ({ noteSheet, onClose, onSuccess }) => {
  const { user } = useAuth();
  const fundAccounts = db.getFundAccounts().filter(a => a.status === 'ACTIVE');
  const expenseCategories = db.getExpenseCategories().filter(c => c.isActive);
  const financialSummary = db.getNoteSheetFinancialSummary(noteSheet.id);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(expenseCategories[0]?.name || 'Event');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('Nos');
  const [rate, setRate] = useState<number | ''>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paidFromAccountId, setPaidFromAccountId] = useState(noteSheet.allocatedFundAccountId || fundAccounts[0]?.id || '');
  const [paidBy, setPaidBy] = useState(user?.name || 'Authorized Officer');
  const [remarks, setRemarks] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-calculate Total Amount: Quantity * Rate
  useEffect(() => {
    const q = Number(quantity) || 0;
    const r = Number(rate) || 0;
    setTotalAmount(Math.round(q * r * 100) / 100);
  }, [quantity, rate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg('Please enter an item or expense name.');
      return;
    }
    if (totalAmount <= 0) {
      setErrorMsg('Please enter valid quantity and rate greater than 0.');
      return;
    }
    if (!paidFromAccountId) {
      setErrorMsg('Please select a fund account to pay from.');
      return;
    }
    if (!vendor.trim()) {
      setErrorMsg('Please enter the vendor or payee name.');
      return;
    }
    if (!invoiceNo.trim()) {
      setErrorMsg('Please enter invoice or bill number.');
      return;
    }

    const selectedAcc = fundAccounts.find(a => a.id === paidFromAccountId);
    const paidFromAccountName = selectedAcc ? selectedAcc.name : 'University Fund';

    const result = db.addExpense({
      noteSheetId: noteSheet.id,
      noteSheetNumber: noteSheet.noteSheetNumber,
      date,
      category,
      itemName: itemName.trim(),
      description: description.trim() || undefined,
      quantity: Number(quantity),
      unit,
      rate: Number(rate),
      totalAmount,
      paymentMode,
      vendor: vendor.trim(),
      invoiceNo: invoiceNo.trim(),
      referenceNo: referenceNo.trim() || undefined,
      paidFromAccountId,
      paidFromAccountName,
      paidBy,
      paidById: user?.id || 'admin-1',
      remarks: remarks.trim() || undefined,
      invoiceUrl: invoiceUrl.trim() || undefined,
      isApproved: true,
      approvedBy: user?.name
    }, user || { id: 'admin-1', name: 'Finance Officer', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' });

    if (!result.success) {
      setErrorMsg(result.message || 'Failed to record expense.');
      return;
    }

    onSuccess();
    onClose();
  };

  const isExceeding = totalAmount > financialSummary.balanceAvailable && financialSummary.balanceAvailable > 0;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'REGISTRAR';

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpRight size={20} color="var(--color-danger, #dc2626)" /> Add Expense / Record Bill Payment
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Note Sheet: <strong>{noteSheet.noteSheetNumber}</strong> — Available Balance: <strong style={{ color: financialSummary.balanceAvailable <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>₹{financialSummary.balanceAvailable.toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {financialSummary.isClosed && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger, #dc2626)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> This Note Sheet account is settled and closed. New expenses are disabled.
          </div>
        )}

        {isExceeding && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--brand-orange, #ea580c)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <div>
              <strong>Budget Warning:</strong> Expense amount (₹{totalAmount.toLocaleString('en-IN')}) exceeds available remaining balance (₹{financialSummary.balanceAvailable.toLocaleString('en-IN')}).
              {!isAdmin && <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Only Registrar or Super Admin can approve expenses exceeding the sanctioned budget.</div>}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #dc2626)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Expense Date *</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required disabled={financialSummary.isClosed} />
            </div>

            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required disabled={financialSummary.isClosed}>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Item / Expense Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Stage Sound System, Flex Banners, Refreshments"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              required
              disabled={financialSummary.isClosed}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Purpose</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Stage audio system rental for opening ceremony"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={financialSummary.isClosed}
            />
          </div>

          {/* Quantity, Unit, Rate, Total Amount calculation row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1.3fr', gap: '0.75rem', alignItems: 'flex-end', background: 'var(--bg-surface-hover)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity *</label>
              <input
                type="number"
                min="0.01"
                step="any"
                className="form-input"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                required
                disabled={financialSummary.isClosed}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit *</label>
              <select className="form-select" value={unit} onChange={e => setUnit(e.target.value)} disabled={financialSummary.isClosed}>
                <option value="Nos">Nos</option>
                <option value="Pcs">Pcs</option>
                <option value="Units">Units</option>
                <option value="Set">Set</option>
                <option value="Kg">Kg</option>
                <option value="Ltr">Ltr</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
                <option value="Lot">Lot</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="0.00"
                value={rate}
                onChange={e => setRate(e.target.value ? parseFloat(e.target.value) : '')}
                required
                disabled={financialSummary.isClosed}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Amount</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-orange)' }}>
                ₹ {totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Vendor / Payee Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sound Prodigy Ltd., Apex Print Hub"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                required
                disabled={financialSummary.isClosed}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice / Bill Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-2026-4401, Bill #1029"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                required
                disabled={financialSummary.isClosed}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Paid From Fund Account *</label>
              <select className="form-select" value={paidFromAccountId} onChange={e => setPaidFromAccountId(e.target.value)} required disabled={financialSummary.isClosed}>
                {fundAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (Bal: ₹{a.currentBalance.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} required disabled={financialSummary.isClosed}>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Reference Number / UTR</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UTR-NEFT-88912"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                disabled={financialSummary.isClosed}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bill / Invoice Attachment</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vendor_Tax_Invoice.pdf"
                  value={invoiceUrl}
                  onChange={e => setInvoiceUrl(e.target.value)}
                  disabled={financialSummary.isClosed}
                />
                <span style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)' }}>
                  <UploadCloud size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Accounting Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Tax invoice verified against delivered items in good condition."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={financialSummary.isClosed}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={financialSummary.isClosed || (isExceeding && !isAdmin)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowUpRight size={16} /> Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
