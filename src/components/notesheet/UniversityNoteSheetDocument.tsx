import React from 'react';
import { NoteSheet } from '../../types';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../../assets/logoBase64';
import { formatIndianNumber, formatIndianCurrency, amountToWords } from '../../utils/numberFormat';

interface UniversityNoteSheetDocumentProps {
  noteSheet: NoteSheet;
  isDraftPreview?: boolean;
  watermarkText?: string;
  hideHeaderBranding?: boolean;
}

/**
 * Official University Administrative Notesheet Document Renderer.
 * Designed to resemble a formal Microsoft Word administrative office document
 * printed on official University letterhead.
 *
 * Unified for:
 * 1. Notesheet Preview Canvas
 * 2. Official Backend Generated PDF & Isolated Print
 * 3. High Fidelity Electronic Archival
 */
export const UniversityNoteSheetDocument: React.FC<UniversityNoteSheetDocumentProps> = ({
  noteSheet,
  isDraftPreview = false,
  watermarkText,
  hideHeaderBranding = false
}) => {
  const isApproved = noteSheet.status === 'APPROVED';
  const isFinancial = Boolean(noteSheet.financialRequirement || noteSheet.budgetRequired);
  const movements = noteSheet.movements || [];
  const revisions = noteSheet.financialRevisionHistory || [];
  const items = noteSheet.items || [];
  const attachments = noteSheet.attachments || [];

  // Formatted amounts
  const requestedAmt = noteSheet.originalRequestedAmount || noteSheet.requestedAmount || noteSheet.estimatedCost || 0;
  const approvedAmt = noteSheet.approvedAmount !== undefined ? noteSheet.approvedAmount : (noteSheet.finalApprovedAmount !== undefined ? noteSheet.finalApprovedAmount : undefined);

  const instituteDisplayName = noteSheet.instituteName || noteSheet.instituteCode || 'Swarrnim Institute of Technology';
  const instituteShortName = noteSheet.instituteCode || (
    instituteDisplayName.toLowerCase().includes('technology') ? 'SIT' :
    instituteDisplayName.toLowerCase().includes('computing') ? 'SSCIT' :
    'SIT'
  );
  const departmentDisplayName = noteSheet.department || 'Department of Computer Engineering';

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'DRAFT';
      case 'PENDING_HOD': return 'PENDING HOD ENDORSEMENT';
      case 'PENDING_HOI': return 'PENDING PRINCIPAL / HOI ENDORSEMENT';
      case 'PENDING_DEPUTY_REGISTRAR': return 'PENDING DEPUTY REGISTRAR VERIFICATION';
      case 'PENDING_REGISTRAR': return 'PENDING REGISTRAR ENDORSEMENT';
      case 'PENDING_VICE_PRESIDENT': return 'PENDING VICE PRESIDENT FINAL SANCTION';
      case 'APPROVED': return 'APPROVED & SANCTIONED';
      case 'REJECTED': return 'REJECTED';
      case 'RETURNED': return 'RETURNED FOR REVISION';
      case 'CLARIFICATION': return 'CLARIFICATION SOUGHT';
      case 'CLOSED': return 'CLOSED / COMPLETED';
      default: return status.replace(/_/g, ' ');
    }
  };

  return (
    <div
      id="university-notesheet-document"
      className="notesheet-document university-notesheet-root relative bg-white text-black mx-auto"
      style={{
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        color: '#000000',
        lineHeight: 1.45,
        fontSize: '11px',
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF'
      }}
    >
      {/* Microsoft Word Page Border Box */}
      <div
        className="university-word-page-border w-full flex flex-col justify-between relative z-10"
        style={{
          border: '1px solid #000000',
          padding: '10mm 10mm',
          boxSizing: 'border-box',
          minHeight: 'calc(297mm - 20mm)',
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* Watermark for Draft / Status */}
      {(watermarkText || isDraftPreview || noteSheet.status === 'DRAFT') && (
        <div
          className="watermark-overlay absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.05]"
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: '5.5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              transform: 'rotate(-35deg)',
              color: '#000000',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap'
            }}
          >
            {watermarkText || (noteSheet.status === 'DRAFT' || isDraftPreview ? 'DRAFT NOTE' : noteSheet.status)}
          </span>
        </div>
      )}

      {/* ─── 1. OFFICIAL UNIVERSITY LETTERHEAD HEADER ─────────────────────── */}
      {!hideHeaderBranding && (
        <header className="university-letterhead text-center pb-2 mb-3 relative z-10 page-break-avoid" style={{ width: '100%' }}>
          {/* Logo - Centered in dedicated vertical document flow */}
          <div className="university-logo" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={SWARRNIM_LOGO_PNG_BASE64}
              alt="Swarrnim Startup & Innovation University"
              style={{
                display: 'block',
                margin: '0 auto',
                width: '85px',
                height: '85px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* 1. University Name (14px Bold Black) */}
          <div
            className="university-name"
            style={{
              marginTop: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              letterSpacing: '0.03em',
              color: '#000000',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
          </div>

          {/* 2. Institute / Department Full Official Name (14px Bold Black) */}
          <div
            className="institute-name"
            style={{
              marginTop: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#000000',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            {instituteDisplayName}
          </div>

          {/* Thin Divider Rule */}
          <div className="w-full h-[1px] bg-black mt-3 mb-3" />

          {/* Document Title (14px Bold Black Underlined) */}
          <div
            className="document-title"
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'underline',
              letterSpacing: '0.05em',
              textAlign: 'center',
              textTransform: 'uppercase',
              color: '#000000'
            }}
          >
            OFFICIAL NOTESHEET
          </div>
        </header>
      )}

      {/* ─── 2. OFFICIAL METADATA (MEMORANDUM STYLE - 11px Black) ─────────── */}
      <section className="metadata-section mb-3 relative z-10 text-black page-break-avoid" style={{ fontSize: '11px' }}>
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '11px', color: '#000000' }}>
          <tbody>
            <tr>
              <td className="py-1 pr-2 w-[55%] align-top">
                <strong>Notesheet Number:</strong>{' '}
                <span style={{ fontWeight: 'bold', color: '#000000' }}>{noteSheet.noteSheetNumber || 'DRAFT'}</span>
              </td>
              <td className="py-1 pl-2 w-[45%] text-right align-top">
                <strong>Date:</strong> {noteSheet.date || new Date().toISOString().split('T')[0]}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">
                <strong>Initiated By:</strong> {noteSheet.creatorName || 'Faculty / Staff'} ({noteSheet.creatorRole || 'Staff'})
              </td>
              <td className="py-1 pl-2 text-right align-top">
                <strong>Priority:</strong> {noteSheet.priority || 'NORMAL'}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">
                <strong>Department / Office:</strong> {departmentDisplayName}
              </td>
              <td className="py-1 pl-2 text-right align-top">
                <strong>Status:</strong> {getStatusText(noteSheet.status)}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">
                <strong>Document Version:</strong> v{noteSheet.version || '1.0'}{noteSheet.amendmentReason ? ' [AMENDED]' : ''}
              </td>
              <td className="py-1 pl-2 text-right align-top">
                <strong>Verification ID:</strong> <span style={{ fontWeight: 'bold' }}>{noteSheet.verificationId || noteSheet.noteSheetNumber}</span>
              </td>
            </tr>
            {noteSheet.workflowDueDate && (
              <tr>
                <td className="py-1 pr-2 align-top">
                  <strong>Workflow Target Date:</strong> {noteSheet.workflowDueDate}
                </td>
                <td className="py-1 pl-2 text-right align-top">
                  {noteSheet.referenceNumber && <span><strong>Ref:</strong> {noteSheet.referenceNumber}</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {(noteSheet.inwardNumber || noteSheet.outwardNumber) && (
          <div
            className="registrar-tracking-header border border-black bg-white p-2.5 mt-2 mb-2 page-break-avoid text-black"
            style={{ fontSize: '11px', lineHeight: 1.35, backgroundColor: '#FFFFFF' }}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* LEFT COLUMN: ORIGINATING INSTITUTE / DEPARTMENT & OUTWARD */}
              <div className="border-r border-black pr-3">
                <div className="font-bold uppercase tracking-wider mb-1 underline" style={{ fontSize: '11px' }}>
                  Originating Office Dispatch
                </div>
                <div><strong>Institute / Dept:</strong> {departmentDisplayName}</div>
                {noteSheet.outwardNumber ? (
                  <>
                    <div><strong>Outward No.:</strong> <span style={{ fontWeight: 'bold' }}>{noteSheet.outwardNumber}</span></div>
                    <div><strong>Date:</strong> {noteSheet.outwardDate || noteSheet.date}</div>
                  </>
                ) : (
                  <div><strong>Outward No.:</strong> <span className="italic">Pending Registrar Dispatch</span></div>
                )}
                <div><strong>Person Name:</strong> {noteSheet.creatorName || 'Faculty / Staff'}</div>
                <div><strong>Contact No.:</strong> {noteSheet.contactNumber || 'N/A'}</div>
              </div>

              {/* RIGHT COLUMN: REGISTRAR OFFICE INWARD */}
              <div className="pl-1">
                <div className="font-bold uppercase tracking-wider mb-1 underline" style={{ fontSize: '14px' }}>
                  REGISTRAR OFFICE
                </div>
                <div><strong>Inward No.:</strong> <span style={{ fontWeight: 'bold' }}>{noteSheet.inwardNumber}</span></div>
                <div><strong>Date:</strong> {noteSheet.inwardDate || noteSheet.date}</div>
                <div><strong>Receiver Name:</strong> {noteSheet.inwardReceivedByName || 'Registrar Directorate'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <strong>Sign:</strong>
                  <span className="font-bold">[✓ Authenticated Record]</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="w-full border-b border-black mt-1 mb-2.5" />
      </section>

      {/* ─── 3. SUBJECT (11px Black) ───────────────────────────────────────── */}
      <section className="subject-section mb-3 relative z-10 page-break-avoid text-black" style={{ fontSize: '11px' }}>
        <p className="m-0 leading-normal">
          <strong>SUBJECT:</strong>{' '}
          <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
            {noteSheet.subject || 'N/A'}
          </span>
        </p>
        {noteSheet.previousNoteSheetId && (
          <p className="m-0 mt-0.5 italic" style={{ fontSize: '11px' }}>
            (Reference to Previous Notesheet: {noteSheet.previousNoteSheetNumber || noteSheet.previousNoteSheetId})
          </p>
        )}
      </section>

      {/* ─── 4. SECTION 1: PROPOSAL SUMMARY (14px Heading / 11px Body) ──────── */}
      <section className="proposal-section mb-3 relative z-10 text-black">
        <h5 className="font-bold text-black uppercase mb-1 page-break-avoid" style={{ fontSize: '14px' }}>
          1. PROPOSAL &amp; REQUIREMENT SUMMARY
        </h5>
        <div
          className="text-justify text-black leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: '11px', lineHeight: 1.5 }}
        >
          {noteSheet.proposal || 'No proposal description provided.'}
        </div>
      </section>

      {/* ─── 5. SECTION 2: PURPOSE & JUSTIFICATION (14px Heading / 11px Body) ─ */}
      <section className="justification-section mb-3 relative z-10 text-black">
        <h5 className="font-bold text-black uppercase mb-1 page-break-avoid" style={{ fontSize: '14px' }}>
          2. PURPOSE &amp; ACADEMIC / ADMINISTRATIVE JUSTIFICATION
        </h5>
        <div
          className="text-justify text-black leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: '11px', lineHeight: 1.5 }}
        >
          {noteSheet.purposeJustification || 'No justification details provided.'}
        </div>
      </section>

      {/* ─── 6. SECTION 3: FINANCIAL IMPLICATION & ITEMIZED ESTIMATE ────────── */}
      {isFinancial && (
        <section className="financial-section mb-3 relative z-10 text-black">
          <h5 className="font-bold text-black uppercase mb-1 page-break-avoid" style={{ fontSize: '14px' }}>
            3. FINANCIAL IMPLICATION &amp; ITEMIZED BREAKDOWN
          </h5>

          {items.length > 0 && (
            <div className="mb-2">
              <table
                className="w-full text-left border-collapse border border-black bg-white"
                style={{ tableLayout: 'fixed', fontSize: '11px', color: '#000000' }}
              >
                <thead>
                  <tr className="border-b border-black bg-white font-bold">
                    <th className="p-1.5 w-[8%] text-center border-r border-black" style={{ letterSpacing: 'normal' }}>Sr. No.</th>
                    <th className="p-1.5 w-[42%] border-r border-black" style={{ letterSpacing: 'normal' }}>Item Description</th>
                    <th className="p-1.5 w-[12%] text-center border-r border-black" style={{ letterSpacing: 'normal' }}>Qty.</th>
                    <th className="p-1.5 w-[18%] text-right border-r border-black" style={{ letterSpacing: 'normal' }}>Unit Rate (Rs.)</th>
                    <th className="p-1.5 w-[20%] text-right" style={{ letterSpacing: 'normal' }}>Total Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="border-b border-black page-break-avoid bg-white">
                      <td className="p-1.5 text-center border-r border-black">{idx + 1}</td>
                      <td className="p-1.5 border-r border-black">
                        <strong>{it.itemName}</strong>
                        {it.description && <div style={{ fontSize: '11px' }}>{it.description}</div>}
                      </td>
                      <td className="p-1.5 text-center border-r border-black" style={{ whiteSpace: 'nowrap' }}>
                        {formatIndianNumber(it.quantity)} {it.unit ? `(${it.unit})` : ''}
                      </td>
                      <td className="p-1.5 text-right border-r border-black" style={{ whiteSpace: 'nowrap' }}>
                        {formatIndianCurrency(it.rate, 'Rs. ')}
                      </td>
                      <td className="p-1.5 text-right" style={{ whiteSpace: 'nowrap' }}>
                        {formatIndianCurrency(it.amount, 'Rs. ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 1. Total Requested Amount — Compact Box */}
          <div
            className="amount-summary-box border border-black bg-white py-1.5 px-2.5 mb-1.5 page-break-avoid text-black"
            style={{ fontSize: '11px', lineHeight: 1.2, backgroundColor: '#FFFFFF' }}
          >
            <div className="flex justify-between items-center font-bold text-black" style={{ margin: 0, padding: 0 }}>
              <span>Total Requested Amount:</span>
              <span className="text-right">{formatIndianCurrency(requestedAmt, 'Rs. ')}</span>
            </div>
            <div style={{ margin: 0, padding: 0, marginTop: '2px', fontSize: '11px' }}>
              <span className="font-bold italic">Amount in Words: </span>
              <span className="italic">{amountToWords(requestedAmt)}</span>
            </div>
          </div>

          {/* 2. Final Approved Amount — Compact Box */}
          {approvedAmt !== undefined && (
            <div
              className="amount-summary-box border border-black bg-white py-1.5 px-2.5 mb-1.5 page-break-avoid text-black"
              style={{ fontSize: '11px', lineHeight: 1.2, backgroundColor: '#FFFFFF' }}
            >
              <div className="flex justify-between items-center font-bold text-black" style={{ margin: 0, padding: 0 }}>
                <span>Final Approved / Sanctioned Amount:</span>
                <span className="text-right text-black font-bold">{formatIndianCurrency(approvedAmt, 'Rs. ')}</span>
              </div>
              <div style={{ margin: 0, padding: 0, marginTop: '2px', fontSize: '11px' }}>
                <span className="font-bold italic">Amount in Words: </span>
                <span className="italic">{amountToWords(approvedAmt)}</span>
              </div>
            </div>
          )}

          {/* Financial Revision Trail */}
          {revisions.length > 0 && (
            <div className="mt-2 mb-2">
              <p className="font-bold uppercase mb-1 page-break-avoid text-black" style={{ fontSize: '14px' }}>
                3.1 Financial Modification &amp; Stage Revision Trail:
              </p>
              <table
                className="w-full text-left border-collapse border border-black bg-white"
                style={{ tableLayout: 'fixed', fontSize: '11px', color: '#000000' }}
              >
                <thead>
                  <tr className="border-b border-black bg-white font-bold">
                    <th className="p-1 w-[25%] border-r border-black" style={{ letterSpacing: 'normal' }}>Stage / Approver</th>
                    <th className="p-1 w-[15%] text-right border-r border-black" style={{ letterSpacing: 'normal' }}>Previous (Rs.)</th>
                    <th className="p-1 w-[15%] text-right border-r border-black" style={{ letterSpacing: 'normal' }}>Revised (Rs.)</th>
                    <th className="p-1 w-[15%] text-right border-r border-black" style={{ letterSpacing: 'normal' }}>Net Change</th>
                    <th className="p-1 w-[18%] border-r border-black" style={{ letterSpacing: 'normal' }}>Reason / Remarks</th>
                    <th className="p-1 w-[12%]" style={{ letterSpacing: 'normal' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((rev, rIdx) => (
                    <tr key={rev.id || rIdx} className="border-b border-black page-break-avoid bg-white">
                      <td className="p-1 border-r border-black truncate">
                        {rev.actorName} ({rev.workflowStage || rev.actorRole})
                      </td>
                      <td className="p-1 text-right border-r border-black" style={{ whiteSpace: 'nowrap' }}>
                        {formatIndianCurrency(rev.previousAmount, 'Rs. ')}
                      </td>
                      <td className="p-1 text-right border-r border-black font-bold" style={{ whiteSpace: 'nowrap' }}>
                        {formatIndianCurrency(rev.newAmount, 'Rs. ')}
                      </td>
                      <td className="p-1 text-right border-r border-black" style={{ whiteSpace: 'nowrap' }}>
                        {rev.changeAmount > 0 ? `+Rs. ${formatIndianNumber(rev.changeAmount)}` : rev.changeAmount < 0 ? `-Rs. ${formatIndianNumber(Math.abs(rev.changeAmount))}` : 'Rs. 0'}
                      </td>
                      <td className="p-1 border-r border-black truncate">{rev.reason}</td>
                      <td className="p-1" style={{ whiteSpace: 'nowrap' }}>{new Date(rev.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── 7. SECTION: ANNEXURES & SUPPORTING DOCUMENTS (14px Heading / 11px Body) */}
      {attachments.length > 0 && (
        <section className="annexures-section mb-3 relative z-10 page-break-avoid text-black">
          <h5 className="font-bold text-black uppercase mb-1" style={{ fontSize: '14px' }}>
            {isFinancial ? '4' : '3'}. ANNEXURES &amp; SUPPORTING DOCUMENTS
          </h5>
          <ol className="list-decimal pl-5 space-y-0.5" style={{ fontSize: '11px' }}>
            {attachments.map((att: any, attIdx: number) => {
              const fileName = typeof att === 'string' ? att : (att.fileName || att.name || `Annexure ${attIdx + 1}`);
              const fileSize = typeof att === 'object' && att.fileSize ? ` (${(att.fileSize / 1024).toFixed(1)} KB)` : '';
              return (
                <li key={attIdx}>
                  <span>{fileName}</span>
                  {fileSize && <span>{fileSize}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ─── 7.5. MANUAL REMARKS / MODIFICATION (PHYSICAL OFFICE USE) ────── */}
      <section className="manual-remarks-section mb-4 mt-2 relative z-10 page-break-avoid text-black">
        <h5 className="font-bold text-black uppercase mb-1.5" style={{ fontSize: '14px', letterSpacing: '0.02em' }}>
          REMARKS / MODIFICATION, IF ANY:
        </h5>
        <div className="space-y-4 my-2">
          <div className="border-b border-black w-full" style={{ height: '1px' }}></div>
          <div className="border-b border-black w-full" style={{ height: '1px' }}></div>
          <div className="border-b border-black w-full" style={{ height: '1px' }}></div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-1 font-bold text-black" style={{ fontSize: '11px' }}>
          <div>
            <span>Signature: </span>
            <span className="font-normal">__________________________</span>
          </div>
          <div>
            <span>Date: </span>
            <span className="font-normal">____________________</span>
          </div>
        </div>
      </section>

      {/* ─── 8. SIGNATURE & OFFICIAL APPROVAL BLOCKS (14px Heading / 11px Body) */}
      <section className="signature-section mt-4 pt-3 border-t border-black relative z-10 page-break-avoid text-black">
        <h5 className="font-bold text-black uppercase mb-3 page-break-avoid" style={{ fontSize: '14px' }}>
          OFFICIAL APPROVAL &amp; SIGNATURE BLOCKS
        </h5>

        {movements.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {movements.map((mvt, idx) => {
              const isFinalStep = mvt.action === 'APPROVE' && isApproved && idx === movements.length - 1;
              const actorName = mvt.actorName || (mvt.fromUser ? mvt.fromUser.replace(/\s*\([^)]*\)\s*$/, '') : 'Authorized Official');
              const designation = mvt.designation || (mvt.fromUserRole ? (
                mvt.fromUserRole === 'FACULTY' ? 'Faculty' :
                mvt.fromUserRole === 'HOD' ? 'Head of Department' :
                mvt.fromUserRole === 'PRINCIPAL' ? 'Principal / HOI' :
                mvt.fromUserRole === 'DEPUTY_REGISTRAR' ? 'Deputy Registrar' :
                mvt.fromUserRole === 'REGISTRAR' ? 'Registrar' :
                mvt.fromUserRole === 'VICE_PRESIDENT' ? 'Vice President' :
                mvt.fromUserRole === 'ACCOUNTS_ADMIN' ? 'Finance & Accounts Officer' :
                mvt.fromUserRole === 'EXAM_CELL' ? 'Controller of Examination' :
                mvt.fromUserRole
              ) : 'Authorized Official');

              const blockTitle = mvt.action === 'SUBMIT'
                ? 'Initiated & Submitted by:'
                : isFinalStep
                ? 'Final Approved by:'
                : mvt.action === 'RETURN'
                ? 'Returned by:'
                : mvt.action === 'REJECT'
                ? 'Rejected by:'
                : 'Approved by:';

              const dateStr = mvt.date ? new Date(mvt.date).toLocaleDateString('en-GB') : (mvt.timestamp ? mvt.timestamp.split(',')[0] : 'N/A');

              return (
                <div key={idx} className="page-break-avoid" style={{ fontSize: '11px', color: '#000000' }}>
                  <p className="m-0 font-bold mb-2">{blockTitle}</p>
                  {mvt.signatureSnapshot?.signatureData ? (
                    <div className="h-9 mb-1 flex items-end">
                      <img
                        src={mvt.signatureSnapshot.signatureData}
                        alt="Official Signature"
                        className="max-h-8 max-w-[130px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-6" />
                  )}
                  <div className="w-52 border-b border-black mb-1.5" />
                  <p className="m-0 font-bold" style={{ fontSize: '11px' }}>{actorName}</p>
                  <p className="m-0" style={{ fontSize: '11px' }}>{designation}</p>
                  <p className="m-0 mt-0.5" style={{ fontSize: '11px' }}>
                    Date: {dateStr}
                  </p>
                  {mvt.remarks && mvt.remarks.trim() && (
                    <div className="mt-1" style={{ fontSize: '11px' }}>
                      <p className="m-0 font-bold">Remarks:</p>
                      <p className="m-0 italic mt-0.5 whitespace-pre-wrap leading-tight">"{mvt.remarks.trim()}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8" style={{ fontSize: '11px', color: '#000000' }}>
            <div>
              <p className="m-0 font-bold mb-4">Initiated &amp; Submitted by:</p>
              <div className="w-52 border-b border-black mb-1.5" />
              <p className="m-0 font-bold" style={{ fontSize: '11px' }}>{noteSheet.creatorName || 'Prof. / Faculty'}</p>
              <p className="m-0" style={{ fontSize: '11px' }}>{noteSheet.creatorRole || 'Faculty'} • {departmentDisplayName}</p>
              <p className="m-0 mt-0.5" style={{ fontSize: '11px' }}>Date: {noteSheet.date ? new Date(noteSheet.date).toLocaleDateString('en-GB') : 'N/A'}</p>
            </div>
            <div>
              <p className="m-0 font-bold mb-4">Status:</p>
              <p className="m-0 italic">Pending Workflow Submission</p>
            </div>
          </div>
        )}

        {!isApproved && noteSheet.status !== 'DRAFT' && (
          <div className="mt-4 p-2 bg-white border border-black text-center font-bold page-break-avoid" style={{ fontSize: '11px', backgroundColor: '#FFFFFF' }}>
            CURRENT STATUS: {getStatusText(noteSheet.status)} (Pending next review / sanction)
          </div>
        )}

        {/* ─── 10. OFFICIAL ELECTRONIC RECORD DISCLAIMER ───────────────────── */}
        <div className="w-full mt-6 pt-2 border-t border-black text-center page-break-avoid">
          <p className="m-0 italic leading-tight" style={{ fontSize: '11px', color: '#000000' }}>
            "This document is an authentic electronic administrative record of Swarrnim Startup &amp; Innovation University. The recorded cryptographic approval trail is legally valid and binding under University administrative statutes."
          </p>
        </div>
      </section>
      </div>
    </div>
  );
};
