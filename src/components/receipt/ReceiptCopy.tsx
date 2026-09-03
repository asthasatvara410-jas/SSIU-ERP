import React from 'react';
import { UniversalFeeReceiptData } from './receiptTypes';
import logoSvg from '../../assets/swarrnim-logo.svg';

interface ReceiptCopyProps {
  receipt: UniversalFeeReceiptData;
  copyType: 'STUDENT COPY' | 'DEPARTMENT COPY' | 'OFFICE COPY' | string;
  isPrint?: boolean;
}

export const ReceiptCopy: React.FC<ReceiptCopyProps> = ({ receipt, copyType, isPrint = false }) => {
  const brandNavy = '#0F2C59';
  const brandOrange = '#F37023';
  const borderCol = '#94A3B8';
  const textDark = '#0F172A';
  const textMuted = '#475569';

  // Format currency safely
  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div
      className="receipt-copy"
      style={{
        width: '100%',
        height: 'auto',
        boxSizing: 'border-box',
        border: '1.5px solid #0F2C59',
        borderRadius: isPrint ? '0px' : '4px',
        padding: '6px 8px',
        background: '#FFFFFF',
        color: textDark,
        fontFamily: "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
        fontSize: '9.5px',
        lineHeight: 1.25,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ── 1. HEADER SECTION ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${brandNavy}`, paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <img
              src={logoSvg}
              alt="SSIU"
              style={{ height: '32px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: '10.5px', color: brandNavy, letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
              </div>
              <div style={{ fontSize: '8px', fontWeight: 800, color: brandOrange, marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {receipt.departmentOrSectionTitle || 'FINANCE & ACCOUNTS DEPARTMENT'}
              </div>
              <div style={{ fontSize: '7px', color: textMuted }}>
                Gandhinagar – 382420, Gujarat, India • www.swarrnim.edu.in
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '6px' }}>
            <div style={{
              background: copyType.includes('STUDENT') ? '#EFF6FF' : '#FFF7ED',
              color: copyType.includes('STUDENT') ? '#1D4ED8' : '#C2410C',
              border: `1px solid ${copyType.includes('STUDENT') ? '#3B82F6' : '#F97316'}`,
              fontWeight: 900,
              fontSize: '8.5px',
              padding: '1px 6px',
              borderRadius: '2px',
              letterSpacing: '0.5px',
              display: 'inline-block',
              marginBottom: '2px'
            }}>
              {copyType}
            </div>
            <div>
              <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#047857', border: '1px solid #10B981', background: '#ECFDF5', padding: '0 4px', borderRadius: '2px' }}>
                ✓ {receipt.paymentStatus || 'PAID & VERIFIED'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. RECEIPT TITLE STRIP ─────────────────────────────────────────── */}
        <div style={{
          background: brandNavy,
          color: '#FFFFFF',
          textAlign: 'center',
          padding: '2px 4px',
          fontWeight: 900,
          fontSize: '9px',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          {receipt.receiptTitle || 'OFFICIAL UNIVERSITY FEE PAYMENT RECEIPT'}
        </div>

        {/* ── 3. TRANSACTION METADATA STRIP ─────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', background: '#F8FAFC', border: `1px solid ${borderCol}` }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 4px', color: textMuted, width: '22%' }}>Receipt No:</td>
              <td style={{ padding: '2px 4px', fontWeight: 800, fontFamily: 'monospace', color: brandNavy, width: '30%' }}>
                {receipt.receiptNo}
              </td>
              <td style={{ padding: '2px 4px', color: textMuted, width: '20%', textAlign: 'right' }}>Date &amp; Time:</td>
              <td style={{ padding: '2px 4px', fontWeight: 700, textAlign: 'right', width: '28%' }}>
                {receipt.paymentDate}{receipt.paymentTime ? ` (${receipt.paymentTime})` : ''}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', color: textMuted }}>Txn ID:</td>
              <td style={{ padding: '2px 4px', fontWeight: 700, fontFamily: 'monospace', color: textDark }}>
                {receipt.transactionId}
              </td>
              <td style={{ padding: '2px 4px', color: textMuted, textAlign: 'right' }}>Pay Mode:</td>
              <td style={{ padding: '2px 4px', fontWeight: 700, textAlign: 'right', color: brandNavy }}>
                {receipt.paymentMode || 'Online UPI'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 4. STUDENT & ACADEMIC INFORMATION ─────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: `1px solid ${borderCol}` }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 4px', color: textMuted, width: '22%', borderBottom: `1px solid #E2E8F0` }}>Student Name:</td>
              <td style={{ padding: '2px 4px', fontWeight: 800, color: brandNavy, borderBottom: `1px solid #E2E8F0`, width: '38%' }}>
                {receipt.studentName}
              </td>
              <td style={{ padding: '2px 4px', color: textMuted, width: '20%', borderBottom: `1px solid #E2E8F0` }}>Enrollment No:</td>
              <td style={{ padding: '2px 4px', fontWeight: 800, fontFamily: 'monospace', color: brandOrange, borderBottom: `1px solid #E2E8F0`, width: '20%' }}>
                {receipt.enrollmentNo}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', color: textMuted, borderBottom: `1px solid #E2E8F0` }}>Institute:</td>
              <td style={{ padding: '2px 4px', color: textDark, borderBottom: `1px solid #E2E8F0` }}>
                {receipt.instituteName || 'Swarrnim University'}
              </td>
              <td style={{ padding: '2px 4px', color: textMuted, borderBottom: `1px solid #E2E8F0` }}>Semester:</td>
              <td style={{ padding: '2px 4px', fontWeight: 700, color: textDark, borderBottom: `1px solid #E2E8F0` }}>
                {receipt.semesterName || 'Semester 1'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 4px', color: textMuted }}>Program / Dept:</td>
              <td style={{ padding: '2px 4px', color: textDark }}>
                {receipt.programName}{receipt.departmentName ? ` (${receipt.departmentName})` : ''}
              </td>
              <td style={{ padding: '2px 4px', color: textMuted }}>Acad. Year:</td>
              <td style={{ padding: '2px 4px', fontWeight: 700, color: textDark }}>
                {receipt.academicYear || '2026-2027'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 4B. EXTRA MODULE DETAILS (If any) ──────────────────────────────── */}
        {receipt.extraDetails && receipt.extraDetails.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginBottom: '4px', background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
            <tbody>
              <tr>
                {receipt.extraDetails.map((detail, idx) => (
                  <td key={idx} style={{ padding: '2px 4px', borderRight: idx < receipt.extraDetails!.length - 1 ? '1px solid #DDD6FE' : 'none' }}>
                    <span style={{ color: '#6B21A8' }}>{detail.label}: </span>
                    <strong style={{ color: brandNavy }}>{detail.value}</strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        {/* ── 5. FEE BREAKDOWN TABLE ────────────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '4px', border: `1px solid ${brandNavy}` }}>
          <thead>
            <tr style={{ background: '#1E3A5F', color: '#FFFFFF' }}>
              <th style={{ padding: '2px 4px', width: '8%', textAlign: 'center', borderRight: '1px solid #475569' }}>Sr.</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', borderRight: '1px solid #475569' }}>Particulars / Fee Head</th>
              <th style={{ padding: '2px 4px', width: '22%', textAlign: 'center', borderRight: '1px solid #475569' }}>Qty / Term</th>
              <th style={{ padding: '2px 4px', width: '22%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF' }}>
                <td style={{ padding: '2px 4px', textAlign: 'center', borderRight: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
                  {item.sr || idx + 1}
                </td>
                <td style={{ padding: '2px 4px', color: textDark, fontWeight: 600, borderRight: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
                  {item.head}
                </td>
                <td style={{ padding: '2px 4px', textAlign: 'center', color: textMuted, borderRight: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
                  {item.qty || '1'}
                </td>
                <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: brandNavy, borderBottom: `1px solid ${borderCol}` }}>
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#EFF6FF', fontWeight: 900 }}>
              <td colSpan={3} style={{ padding: '3px 4px', textAlign: 'right', color: brandNavy, fontSize: '9px', borderRight: `1px solid ${borderCol}` }}>
                TOTAL AMOUNT PAID:
              </td>
              <td style={{ padding: '3px 4px', textAlign: 'right', color: brandNavy, fontSize: '10px', fontFamily: 'monospace' }}>
                {formatCurrency(receipt.totalPaid)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 6. AMOUNT IN WORDS BOX ────────────────────────────────────────── */}
        <div style={{
          border: `1px dashed ${borderCol}`,
          background: '#F8FAFC',
          padding: '2px 6px',
          fontSize: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ color: textMuted }}>Amount in Words: </span>
          <strong style={{ fontStyle: 'italic', color: brandNavy }}>{receipt.amountInWords || 'Rupees Only'}</strong>
        </div>
      </div>

      {/* ── 7. SIGNATURES & OFFICIAL SEAL ──────────────────────────────────── */}
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px', marginTop: '4px' }}>
          <tbody>
            <tr>
              <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'bottom', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                <div style={{ fontWeight: 700, color: textDark }}>
                  {receipt.studentAcknowledgementTitle || 'Student Acknowledgement'}
                </div>
              </td>
              <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'bottom', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                <div style={{ fontWeight: 700, color: '#047857' }}>DIGITALLY CONFIRMED</div>
                <div style={{ fontWeight: 700, color: textDark }}>Finance &amp; Accounts Officer</div>
              </td>
              <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'bottom', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                <div style={{ fontWeight: 700, color: brandNavy }}>AUTHORIZED SEAL</div>
                <div style={{ fontWeight: 700, color: textDark }}>{receipt.authorizedSignatoryTitle || 'Controller of Examinations'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 8. FOOTER NOTE ─────────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid #CBD5E1`, paddingTop: '2px', marginTop: '2px', fontSize: '6.5px', color: textMuted, textAlign: 'center', lineHeight: 1.3 }}>
          <div>* {receipt.officialDisclaimer || 'This is a computer-generated official University Fee Receipt.'} *</div>
          <div>Authorized under Swarrnim Startup &amp; Innovation University Regulations.</div>
        </div>
      </div>
    </div>
  );
};
