import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { hrmsService, BulkEmployeeImportRow, BulkImportResult } from '../../services/hrmsService';
import { User as UserType } from '../../types';
import * as XLSX from 'xlsx';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface BulkEmployeeImportModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkEmployeeImportModal: React.FC<BulkEmployeeImportModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const sampleTemplate: BulkEmployeeImportRow[] = [
    {
      name: 'Dr. Vikramaditya Rathore',
      email: 'vikram.rathore@ssiu.edu.in',
      phone: '9876500011',
      designation: 'Professor',
      employeeType: 'FACULTY',
      employmentType: 'PERMANENT',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      joiningDate: '2026-08-01',
      salary: 110000,
      panNo: 'ABCDE9876F',
      aadhaarNo: '9988-7766-5544',
      qualification: 'Ph.D Machine Learning & Robotics',
      experienceYears: 12,
      bankAccountNo: '309100887766'
    },
    {
      name: 'Anjali Deshmukh',
      email: 'anjali.deshmukh@ssiu.edu.in',
      phone: '9876500012',
      designation: 'Senior Accountant',
      employeeType: 'ADMINISTRATIVE',
      employmentType: 'PERMANENT',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      joiningDate: '2026-08-01',
      salary: 60000,
      panNo: 'FGHIJ5432K',
      aadhaarNo: '1122-3344-5566',
      qualification: 'M.Com, Chartered Accountant Inter',
      experienceYears: 6,
      bankAccountNo: '309100223344'
    }
  ];

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(sampleTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'University_Employee_Bulk_Import_Template.xlsx');
  };

  const handleLoadSample = () => {
    setImportText(JSON.stringify(sampleTemplate, null, 2));
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    setResult(null);

    try {
      let parsedRows: BulkEmployeeImportRow[] = [];
      try {
        parsedRows = JSON.parse(importText);
      } catch (err) {
        // Fallback parse CSV / TSV
        const lines = importText.trim().split('\n');
        parsedRows = lines.map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          return {
            name: cols[0] || '',
            email: cols[1] || '',
            phone: cols[2] || '',
            designation: cols[3] || 'Staff Member',
            employeeType: cols[4] || 'FACULTY',
            employmentType: cols[5] || 'PERMANENT',
            instituteId: cols[6] || 'inst-1',
            departmentId: cols[7] || 'dept-1',
            joiningDate: cols[8] || '2026-08-01',
            salary: Number(cols[9]) || 50000,
            panNo: cols[10] || 'ABCDE1234F',
            aadhaarNo: cols[11] || '1234-5678-9012',
            qualification: cols[12] || 'Postgraduate',
            experienceYears: Number(cols[13]) || 3
          };
        });
      }

      const res = hrmsService.processBulkEmployeeImport(parsedRows, currentUser);
      setResult(res);
      if (res.success) {
        onSuccess(res.successCount);
      }
    } catch (err: any) {
      setResult({
        success: false,
        totalProcessed: 0,
        successCount: 0,
        failureCount: 1,
        errors: [{ row: 1, field: 'format', message: err.message || 'Invalid format.' }],
        importedIds: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-base">Bulk Employee Excel Import (Transaction-Safe)</h3>
              <p className="text-xs text-emerald-100">Batch ingest 500–1000+ staff records with duplicate checks & row-level error isolation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white">Download Standard University HR Template</h5>
              <p className="text-slate-500 mt-0.5">Pre-configured columns for personal, academic, salary, PAN, Aadhaar & department IDs.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 transition"
              >
                Load Sample JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download .xlsx
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Paste JSON / CSV Batch Payload:</label>
            <textarea 
              value={importText} 
              onChange={e => setImportText(e.target.value)} 
              rows={8} 
              placeholder='[ { "name": "Dr. Example", "email": "example@ssiu.edu.in", "phone": "9876543210", ... } ]'
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-xl border ${result.success ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 text-rose-800 dark:text-rose-200'}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                <span>{result.success ? `Successfully imported ${result.successCount} employees!` : `Batch Import Failed (${result.failureCount} errors)`}</span>
              </div>
              {!result.success && result.errors.length > 0 && (
                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-xs bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                      <span><strong>Row {err.row} ({err.field}):</strong> {err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing || !importText.trim()}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {isProcessing ? 'Validating Batch...' : 'Validate & Import'}
          </button>
        </div>

      </div>
    </div>
  );
};
