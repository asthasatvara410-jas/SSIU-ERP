import React from 'react';
import { HallTicketData } from '../../types/hallTicket';
import logoSvg from '../../assets/swarrnim-logo.svg';

interface HallTicketPrintProps {
  ticket: HallTicketData;
}

/**
 * Isolated print utility that opens an invisible iframe containing ONLY the Hall Ticket
 * ensuring no sidebar, navigation, dashboard, or browser ERP chrome appears in the print output.
 */
export function printIsolatedHallTicket(elementId: string = 'ssiu-ht-doc') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Examination Hall Ticket - ${elem.getAttribute('data-hallticket-no') || 'SSIU'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
            color: #000000;
          }
          #ssiu-ht-doc {
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 8mm !important;
            box-shadow: none !important;
            outline: none !important;
            border: 1.5px solid #000000 !important;
            background: #FFFFFF !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          table {
            border-collapse: collapse;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${elem.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

export const HallTicketPrint: React.FC<HallTicketPrintProps> = ({ ticket }) => {
  const defaultInstructions = [
    'Candidate must carry this Hall Ticket to the examination centre for every examination session. No entry is permitted without the Hall Ticket.',
    'Candidate must carry a valid University Enrollment Card / Photo ID along with this Hall Ticket.',
    'Candidate must report to the allocated examination centre at least 30 minutes before the scheduled commencement of the examination.',
    'Electronic gadgets, mobile phones, smart watches, programmable calculators, and Bluetooth devices are strictly prohibited inside the examination hall.',
    'Follow all instructions issued by the examination authorities and invigilators. Verify question paper code before writing.',
    'Hall Ticket must be preserved until completion of the entire examination process and result declaration.',
  ];

  const candidateInstructions = ticket.instructions && ticket.instructions.length > 0
    ? ticket.instructions
    : defaultInstructions;

  return (
    <>
      {/* ── PRINT ISOLATION STYLES FOR NATIVE WINDOW.PRINT ──────────────── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Hide all ERP elements */
          body * {
            visibility: hidden !important;
          }
          /* Make ONLY the official Hall Ticket visible */
          #ssiu-ht-doc,
          #ssiu-ht-doc * {
            visibility: visible !important;
          }
          #ssiu-ht-wrap {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            position: static !important;
          }
          #ssiu-ht-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 8mm !important;
            box-shadow: none !important;
            outline: none !important;
            border: 1.5px solid #000000 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── A4 SCREEN PREVIEW WRAPPER ────────────────────────────────────── */}
      <div
        id="ssiu-ht-wrap"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          background: '#CBD5E1',
          padding: '24px 12px 32px',
          overflowX: 'auto',
        }}
      >
        {/* ── OFFICIAL UNIVERSITY HALL TICKET (REFERENCE DESIGN FORMAT) ────── */}
        <div
          id="ssiu-ht-doc"
          data-hallticket-no={ticket.hallTicketNo}
          style={{
            width: '210mm',
            minHeight: '297mm',
            background: '#FFFFFF',
            boxSizing: 'border-box',
            padding: '10mm 12mm',
            fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: '9pt',
            color: '#000000',
            lineHeight: 1.35,
            /* Thin professional outer border around complete document */
            border: '1.5px solid #000000',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            position: 'relative',
          }}
        >
          {/* ═══ 1. HEADER (FOLLOWING REFERENCE IMAGE) ═══════════════════════ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            marginBottom: '10px',
            borderBottom: '1.5px solid #000000',
          }}>
            {/* University Logo on the left */}
            <div style={{ width: '85px', flexShrink: 0 }}>
              <img
                src={logoSvg}
                alt="SSIU Logo"
                style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* University Name & Title in Center */}
            <div style={{ flex: 1, textAlign: 'center', paddingRight: '20px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '13pt',
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
              }}>
                SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
              </h1>
              <div style={{
                fontSize: '10pt',
                fontWeight: 800,
                color: '#000000',
                marginTop: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}>
                END SEM EXAM {ticket.examSession?.toUpperCase() || 'SUMMER- 2026'}
              </div>
              <div style={{
                fontSize: '11pt',
                fontWeight: 900,
                color: '#000000',
                marginTop: '3px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                HALL TICKET
              </div>
            </div>
          </div>

          {/* ═══ 2. STUDENT INFORMATION & PHOTO / SIGNATURE SECTION ══════════ */}
          <div style={{ display: 'flex', marginBottom: '12px', gap: '0' }}>
            {/* Student Information Table (Left Side) */}
            <table style={{
              flex: 1,
              borderCollapse: 'collapse',
              border: '1px solid #000000',
              fontSize: '8.5pt',
            }}>
              <tbody>
                <tr>
                  <td style={{ width: '28%', padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    STUDENT NAME
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #000000', textTransform: 'uppercase' }}>
                    {ticket.studentName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    ENROLLMENT NO
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', fontFamily: 'monospace', fontSize: '9.5pt' }}>
                    {ticket.enrollmentNo}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    BRANCH NAME
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #000000', textTransform: 'uppercase' }}>
                    {ticket.programName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    SEMESTER
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #000000' }}>
                    {ticket.semesterName?.replace(/Semester\s*/i, '') || '2'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    HALL TICKET NO
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', fontFamily: 'monospace' }}>
                    {ticket.hallTicketNo}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    EXAM CENTRE
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #000000', textTransform: 'uppercase' }}>
                    {ticket.centreName} (CODE: {ticket.centreCode})
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000', background: '#FFFFFF' }}>
                    ROOM &amp; SEAT NO
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 800, border: '1px solid #000000' }}>
                    ROOM: {ticket.subjects[0]?.roomNo || '101'} &nbsp;|&nbsp; SEAT: {ticket.examSeatNo}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Photo & Signature Column (Right Side - Exactly as in Reference) */}
            <div style={{
              width: '125px',
              border: '1px solid #000000',
              borderLeft: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
              padding: '4px',
            }}>
              {/* Photo Box */}
              <div style={{
                width: '115px',
                height: '135px',
                border: '1px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F8FAFC',
                overflow: 'hidden',
              }}>
                {ticket.photoUrl ? (
                  <img
                    src={ticket.photoUrl}
                    alt="Student Photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: '8pt' }}>
                    <div style={{ fontSize: '18pt', marginBottom: '2px' }}>📷</div>
                    <div style={{ fontWeight: 800 }}>PHOTO</div>
                  </div>
                )}
              </div>

              {/* Student Signature Box directly beneath Photo (Reference Design) */}
              <div style={{
                width: '115px',
                height: '42px',
                border: '1px solid #000000',
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '2px',
                background: '#FFFFFF',
              }}>
                <div style={{
                  fontSize: '7pt',
                  fontWeight: 900,
                  color: '#000000',
                  letterSpacing: '0.5px',
                }}>
                  SIGN
                </div>
              </div>
            </div>
          </div>

          {/* ═══ 3. CIRCULAR UNIVERSITY EXAM SECTION SEAL (REFERENCE DESIGN) ══ */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '8px 0',
          }}>
            <div style={{
              width: '94px',
              height: '94px',
              borderRadius: '50%',
              border: '2px solid #1E3A8A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              transform: 'rotate(-4deg)',
              color: '#1E3A8A',
              background: '#FFFFFF',
            }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '1px dashed #1E3A8A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2px',
              }}>
                <div style={{ fontSize: '5pt', fontWeight: 900, letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                  SWARRNIM STARTUP &amp;
                </div>
                <div style={{ fontSize: '4.8pt', fontWeight: 900, letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                  INNOVATION UNIVERSITY
                </div>
                <div style={{
                  fontSize: '8pt',
                  fontWeight: 900,
                  color: '#1E3A8A',
                  margin: '1px 0',
                  borderTop: '1px solid #1E3A8A',
                  borderBottom: '1px solid #1E3A8A',
                  padding: '1px 4px',
                  letterSpacing: '0.5px',
                }}>
                  EXAM SECTION
                </div>
                <div style={{ fontSize: '5pt', fontWeight: 800 }}>
                  GANDHINAGAR
                </div>
              </div>
            </div>
          </div>

          {/* ═══ 4. EXAMINATION SCHEDULE TABLE (REFERENCE DESIGN) ════════════ */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000000',
            fontSize: '8pt',
            marginBottom: '12px',
          }}>
            <thead>
              <tr style={{ background: '#FFFFFF' }}>
                <th style={{ padding: '6px 4px', border: '1px solid #000000', textAlign: 'center', width: '6%', fontWeight: 900 }}>
                  DATE
                </th>
                <th style={{ padding: '6px 4px', border: '1px solid #000000', textAlign: 'center', width: '14%', fontWeight: 900 }}>
                  SUB. CODE
                </th>
                <th style={{ padding: '6px 6px', border: '1px solid #000000', textAlign: 'left', width: '38%', fontWeight: 900 }}>
                  SUBJECT / PAPER TITLE
                </th>
                <th style={{ padding: '6px 4px', border: '1px solid #000000', textAlign: 'center', width: '14%', fontWeight: 900 }}>
                  TIME
                </th>
                <th style={{ padding: '6px 4px', border: '1px solid #000000', textAlign: 'center', width: '12%', fontWeight: 900 }}>
                  ROOM &amp; SEAT
                </th>
                <th style={{ padding: '6px 4px', border: '1px solid #000000', textAlign: 'center', width: '16%', fontWeight: 900 }}>
                  SIGN
                </th>
              </tr>
            </thead>
            <tbody>
              {(ticket.subjects || []).map((sub, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000000', fontWeight: 700, fontFamily: 'monospace' }}>
                    {sub.examDate}
                  </td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000000', fontWeight: 800, fontFamily: 'monospace' }}>
                    {sub.subjectCode}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #000000', fontWeight: 700 }}>
                    {sub.subjectName}
                  </td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000000', fontWeight: 600 }}>
                    {sub.examTime}
                  </td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000000', fontWeight: 700 }}>
                    {sub.roomNo} / {sub.seatNo || ticket.examSeatNo}
                  </td>
                  <td style={{ padding: '5px 4px', border: '1px solid #000000', textAlign: 'center' }}>
                    &nbsp;
                  </td>
                </tr>
              ))}
              {(ticket.subjects || []).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'center', border: '1px solid #000000', color: '#64748B' }}>
                    No subjects scheduled for this candidate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ═══ 5. IMPORTANT CANDIDATE INSTRUCTIONS ══════════════════════════ */}
          <div style={{
            border: '1px solid #000000',
            padding: '6px 8px',
            marginBottom: '16px',
            fontSize: '7.2pt',
            lineHeight: 1.4,
          }}>
            <div style={{ fontWeight: 900, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              IMPORTANT CANDIDATE INSTRUCTIONS:
            </div>
            <ol style={{ margin: 0, paddingLeft: '16px' }}>
              {candidateInstructions.map((inst, idx) => (
                <li key={idx} style={{ marginBottom: '1.5px' }}>{inst}</li>
              ))}
            </ol>
          </div>

          {/* ═══ 6. AUTHORIZATION / SIGNATURE AREA (REFERENCE DESIGN) ═════════ */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '20px',
            marginTop: '10px',
          }}>
            {/* Left: Controller of Examination */}
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ height: '32px' }} />
              <div style={{
                borderTop: '1px solid #000000',
                paddingTop: '4px',
                fontWeight: 800,
                fontSize: '8.5pt',
                color: '#000000',
              }}>
                Controller of Examination
              </div>
              <div style={{ fontSize: '6.5pt', color: '#475569', marginTop: '1px' }}>
                Swarrnim Startup &amp; Innovation University
              </div>
            </div>

            {/* Center: Issue Date */}
            <div style={{ textAlign: 'center', fontSize: '7pt', color: '#475569', paddingBottom: '6px' }}>
              <div>Date of Issue: <strong>{ticket.generatedDate || new Date().toLocaleDateString('en-IN')}</strong></div>
              <div style={{ fontFamily: 'monospace', marginTop: '1px' }}>Ref: {ticket.hallTicketNo}</div>
            </div>

            {/* Right: Centre Superintendent Seal Area */}
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ height: '32px' }} />
              <div style={{
                borderTop: '1px solid #000000',
                paddingTop: '4px',
                fontWeight: 800,
                fontSize: '8.5pt',
                color: '#000000',
              }}>
                Centre Superintendent
              </div>
              <div style={{ fontSize: '6.5pt', color: '#475569', marginTop: '1px' }}>
                Signature &amp; Examination Seal
              </div>
            </div>
          </div>
        </div>{/* /#ssiu-ht-doc */}
      </div>{/* /#ssiu-ht-wrap */}
    </>
  );
};
