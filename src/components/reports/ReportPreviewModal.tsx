import React from 'react';
import { 
  SingleRecordDossier, MultiRecordReportData, reportEngine 
} from '../../services/reportService';
import { Badge } from '../common/Badge';
import { 
  Printer, Download, FileText, X, Building2, ShieldCheck, CheckCircle2, Award 
} from 'lucide-react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleDossier?: SingleRecordDossier | null;
  multiReport?: MultiRecordReportData | null;
  user?: any;
  role?: string | null;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  singleDossier,
  multiReport,
  user,
  role
}) => {
  if (!isOpen) return null;

  const generatedByStr = user?.name ? `${user.name} (${role || 'OFFICER'})` : 'Authorized ERP Officer';

  const handlePrint = () => {
    if (singleDossier) {
      reportEngine.triggerPrint(singleDossier.title, singleDossier.recordType, generatedByStr, `Record: ${singleDossier.referenceId}`, 1);
    } else if (multiReport) {
      const filterStr = multiReport.appliedFilters.map(f => `${f.label}: ${f.value}`).join(' | ');
      reportEngine.triggerPrint(multiReport.reportTitle, multiReport.moduleName, generatedByStr, filterStr, multiReport.totalCount);
    }
  };

  const handleExcel = () => {
    if (singleDossier) {
      reportEngine.exportSingleRecordExcel(singleDossier, generatedByStr);
    } else if (multiReport) {
      reportEngine.exportExcel(multiReport);
    }
  };

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
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Control Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#0F2C59',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="#F37023" />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              Official Institutional Report Preview &amp; Export Center
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#F37023',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Printer size={15} /> Print / Save PDF
            </button>

            <button
              onClick={handleExcel}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Download size={15} /> Export Multi-Sheet Excel
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div
          id="ssiu-official-report-canvas"
          style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FAFAFA'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {/* 1. Official Letterhead Header */}
            <div
              style={{
                borderBottom: '2px solid #0F2C59',
                paddingBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <img 
                    src="/assets/SSIUlogo-RfrbuGFJ.png" 
                    alt="SSIU Logo" 
                    style={{ height: '36px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2C59', margin: 0, letterSpacing: '-0.3px' }}>
                    SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                  </h2>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                  Approved by UGC, AICTE, Govt of Gujarat • NAAC Accredited Autonomous Digital Campus
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                  Bhoyan Rathod, Opp. IFFCO, Gandhinagar-382420, Gujarat, India • www.swarrnim.edu.in
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Badge variant="gold">OFFICIAL AUDIT REPORT</Badge>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                  Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Ref: SSIU/ERP/REP/{Date.now().toString().slice(-6)}
                </div>
              </div>
            </div>

            {/* 2. Single Record Dossier View */}
            {singleDossier && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2C59', margin: 0 }}>
                    {singleDossier.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {singleDossier.subtitle}
                  </p>
                </div>

                {/* Header Attributes Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  {singleDossier.headerFields.map((f, i) => (
                    <div key={i}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        {f.label}:
                      </span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F2C59', marginTop: '2px' }}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dossier Sections */}
                {singleDossier.sections.map((sec, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2C59', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem', margin: 0 }}>
                      {sec.title}
                    </h4>

                    {sec.metrics && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {sec.metrics.map((m, mIdx) => (
                          <div key={mIdx} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>{m.label}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: m.color || '#0F2C59', marginTop: '2px' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sec.table && (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                          <thead style={{ backgroundColor: '#F8FAFC' }}>
                            <tr>
                              {sec.table.headers.map((h, hIdx) => (
                                <th key={hIdx} style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#0F2C59' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sec.table.rows.map((r, rIdx) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                {r.map((cell, cIdx) => (
                                  <td key={cIdx} style={{ padding: '0.6rem 0.85rem' }}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 3. Multi-Record / Filter-wise / Dashboard View */}
            {multiReport && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2C59', margin: 0 }}>
                    {multiReport.reportTitle}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748B' }}>
                    <span>Module: <strong>{multiReport.moduleName}</strong></span>
                    <span>Total Records: <strong>{multiReport.totalCount}</strong></span>
                    <span>Generated By: <strong>{multiReport.generatedBy}</strong></span>
                  </div>
                </div>

                {/* Applied Filters Pill Bar */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Applied Scope:</span>
                  {multiReport.appliedFilters.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: '#0F2C59'
                      }}
                    >
                      {f.label}: <strong>{f.value}</strong>
                    </span>
                  ))}
                </div>

                {/* Summary Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {multiReport.summaryMetrics.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${m.color || '#0F2C59'}`
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{m.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2C59', marginTop: '4px' }}>
                        {m.value}
                      </div>
                      {m.sublabel && (
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>{m.sublabel}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Data Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                    <thead style={{ backgroundColor: '#F8FAFC' }}>
                      <tr>
                        {multiReport.headers.map((h, i) => (
                          <th key={i} style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {multiReport.rows.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '0.65rem 0.85rem' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {multiReport.rows.length > 50 && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', color: '#64748B' }}>
                      Showing first 50 records in preview. Full {multiReport.rows.length} records available in Excel/PDF export.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Official Signature & Stamp Footer */}
            <div
              style={{
                marginTop: '2rem',
                borderTop: '1px dashed #CBD5E1',
                paddingTop: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ height: '40px' }} />
                <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0F2C59' }}>
                  Prepared By / Officer In-Charge
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>ERP Operations Desk</div>
              </div>

              <div>
                <div style={{ height: '40px' }} />
                <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0F2C59' }}>
                  Verified By / HOD / Dean
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Academic &amp; Quality Audit</div>
              </div>

              <div>
                <div style={{ height: '40px' }} />
                <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0F2C59' }}>
                  Registrar / Controller of Exams
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Swarrnim University Secretariat</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
