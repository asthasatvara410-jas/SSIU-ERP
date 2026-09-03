import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, 
  AlertCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { assetManagementService, BulkImportResult } from '../../services/assetManagementService';

interface BulkAssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkAssetImportModal: React.FC<BulkAssetImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Asset Name': 'Dell OptiPlex 7090 Desktop PC',
        'Category': 'IT_ELECTRONICS',
        'Sub Category': 'Desktop PC',
        'Brand': 'Dell',
        'Model': 'OptiPlex 7090',
        'Serial Number': 'DELL-SN-9901',
        'Quantity': 1,
        'Purchase Date': '2026-01-15',
        'Purchase Cost': 72000,
        'Vendor': 'Dell Direct India',
        'Invoice Number': 'INV-2026-001',
        'Is Serialized': 'true',
        'Warranty Start': '2026-01-15',
        'Warranty End': '2029-01-14',
        'Warranty Provider': 'Dell ProSupport'
      },
      {
        'Asset Name': 'Godrej Faculty Ergonomic Mesh Chairs',
        'Category': 'FURNITURE',
        'Sub Category': 'Office Chair',
        'Brand': 'Godrej',
        'Model': 'Motion High Back',
        'Serial Number': 'N/A',
        'Quantity': 25,
        'Purchase Date': '2026-01-20',
        'Purchase Cost': 8500,
        'Vendor': 'Godrej Interio',
        'Invoice Number': 'INV-2026-002',
        'Is Serialized': 'false',
        'Warranty Start': '2026-01-20',
        'Warranty End': '2027-01-19',
        'Warranty Provider': 'Godrej Warranty'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets_Template');
    XLSX.writeFile(workbook, 'SSIU_Bulk_Asset_Import_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImportResult(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          setError('The uploaded Excel sheet contains no rows.');
          setLoading(false);
          return;
        }

        setParsedRows(data);
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to parse Excel file: ${err.message}`);
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = () => {
    if (parsedRows.length === 0) {
      setError('Please upload a valid Excel file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = assetManagementService.processBulkAssetImport(parsedRows, user || {
        id: 'admin',
        name: 'Central Admin',
        role: 'STUDENT_ADMIN'
      } as any);

      setImportResult(result);
      setLoading(false);

      if (result.successCount > 0 && result.failureCount === 0) {
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(`Import processing failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDownloadErrorExcel = () => {
    if (!importResult || importResult.errors.length === 0) return;

    const errorRows = importResult.errors.map(err => ({
      'Row Number': err.row,
      'Asset Name': err.assetName,
      'Serial Number': err.serialNumber || 'N/A',
      'Validation Error': err.error
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Errors');
    XLSX.writeFile(workbook, `SSIU_Asset_Import_Errors_${Date.now()}.xlsx`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSpreadsheet size={22} style={{ color: '#10B981' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Bulk Excel Asset Ingestion
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
                Safe Transaction-Based Import • 100 to 5000+ Assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.35rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#991B1B', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Download Template */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '0.875rem', color: '#0F172A', display: 'block' }}>Step 1: Download Standard Asset Template</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Pre-formatted columns for Categories, Serial Numbers, Purchase Values, and Warranties.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Download size={14} />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Step 2: Upload Excel File */}
          <div>
            <strong style={{ fontSize: '0.875rem', color: '#0F172A', display: 'block', marginBottom: '0.5rem' }}>
              Step 2: Upload Completed Asset Sheet (.xlsx, .xls)
            </strong>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '1.75rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#FAFAFA'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <UploadCloud size={32} style={{ color: 'var(--brand-orange, #F37023)', margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                {fileName ? fileName : 'Click to Browse or Drag & Drop Excel File'}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Supports up to 5,000 asset rows per transaction batch
              </p>
            </div>
          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && !importResult && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  Parsed {parsedRows.length} Rows (Preview First 3)
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>Ready for Ingestion</span>
              </div>
              <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '0.75rem' }}>
                {parsedRows.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r['Asset Name'] || r['name']} ({r['Category'] || r['category']})</span>
                    <span style={{ fontFamily: 'monospace' }}>Serial: {r['Serial Number'] || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Result Summary */}
          {importResult && (
            <div style={{
              background: importResult.failureCount === 0 ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${importResult.failureCount === 0 ? '#6EE7B7' : '#FCA5A5'}`,
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {importResult.failureCount === 0 ? (
                  <CheckCircle2 size={18} style={{ color: '#059669' }} />
                ) : (
                  <AlertTriangle size={18} style={{ color: '#DC2626' }} />
                )}
                <strong style={{ fontSize: '0.875rem', color: importResult.failureCount === 0 ? '#065F46' : '#991B1B' }}>
                  {importResult.failureCount === 0
                    ? `Successfully Imported ${importResult.successCount} Assets!`
                    : `Validation Failed for ${importResult.failureCount} Row(s). Entire transaction rolled back to prevent database corruption.`}
                </strong>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', margin: '0.5rem 0', fontSize: '0.75rem', color: '#991B1B' }}>
                    {importResult.errors.slice(0, 5).map((e, idx) => (
                      <div key={idx} style={{ padding: '0.25rem 0' }}>
                        • Row {e.row} ({e.assetName}): {e.error}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
                        ...and {importResult.errors.length - 5} more error(s).
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadErrorExcel}
                    className="btn btn-sm"
                    style={{ background: '#DC2626', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={14} />
                    <span>Download Detailed Error Excel</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700 }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={loading || parsedRows.length === 0 || (importResult !== null && importResult.failureCount === 0)}
              onClick={handleProcessImport}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: (loading || parsedRows.length === 0) ? 0.6 : 1
              }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{loading ? 'Processing Batch...' : 'Confirm & Ingest Assets'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
