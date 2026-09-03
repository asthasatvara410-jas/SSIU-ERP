import React, { useState } from 'react';
import { Scan, FileText, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { dmsOcrVerificationService } from '../services/dmsOcrVerificationService';
import { AcademicDocumentCategory, OcrExtractionResult } from '../types';

export const OcrExtractionSandbox: React.FC = () => {
  const [docCategory, setDocCategory] = useState<AcademicDocumentCategory>('LEAVING_CERTIFICATE');
  const [studentId, setStudentId] = useState<string>('stud-001');
  const [rawOcrText, setRawOcrText] = useState<string>(
    'GUJARAT SECONDARY EDUCATION BOARD\nSCHOOL LEAVING CERTIFICATE\nName: AARAV PATEL\nFather: SURESH PATEL\nDOB: 14/05/2004\nSchool: Sharda Mandir High School\nConduct: Good'
  );
  const [extractionResult, setExtractionResult] = useState<OcrExtractionResult | null>(null);

  const handleRunOcr = () => {
    const result = dmsOcrVerificationService.extractAndValidateDocument(
      docCategory,
      rawOcrText,
      studentId
    );
    setExtractionResult(result);
  };

  const handleLoadSample = (sampleType: 'LC_CLEAN' | '12TH_MISMATCH') => {
    if (sampleType === 'LC_CLEAN') {
      setDocCategory('LEAVING_CERTIFICATE');
      setRawOcrText(
        'GUJARAT SECONDARY EDUCATION BOARD\nSCHOOL LEAVING CERTIFICATE\nName: AARAV PATEL\nFather: SURESH PATEL\nDOB: 14/05/2004\nSchool: Sharda Mandir High School\nConduct: Good'
      );
    } else {
      setDocCategory('MARKSHEET_12TH');
      setRawOcrText(
        'CENTRAL BOARD OF SECONDARY EDUCATION\nHIGHER SECONDARY CERTIFICATE\nName: AARAV PATEL\nDOB: 22/09/2002\nAggregate: 84.5%'
      );
    }
    setExtractionResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-600" />
              OCR Text Extraction & Master Cross-Validation Sandbox
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulate document OCR scanning and test automatic cross-validation against the student master database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadSample('LC_CLEAN')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Load Clean LC
            </button>
            <button
              onClick={() => handleLoadSample('12TH_MISMATCH')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Load Anomaly 12th
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Document Classification Category
            </label>
            <select
              value={docCategory}
              onChange={e => setDocCategory(e.target.value as AcademicDocumentCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="LEAVING_CERTIFICATE">Leaving Certificate (LC)</option>
              <option value="MARKSHEET_10TH">10th Standard Marksheet</option>
              <option value="MARKSHEET_12TH">12th Standard Marksheet</option>
              <option value="DEGREE_CERTIFICATE">Degree / Diploma Certificate</option>
              <option value="AADHAAR_CARD">Aadhaar Card / National ID</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Target Student Master ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Raw OCR Stream / Extracted Document Text
          </label>
          <textarea
            rows={4}
            value={rawOcrText}
            onChange={e => setRawOcrText(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleRunOcr}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Extract Fields & Validate Against Student Master
        </button>
      </div>

      {/* Extraction Result Showcase */}
      {extractionResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Extraction & Cross-Validation Audit Results
              </h4>
              <p className="text-xs text-slate-500 font-mono">ID: {extractionResult.extractionId}</p>
            </div>
            <Badge variant={extractionResult.anomalyDetected ? 'danger' : 'success'}>
              {extractionResult.anomalyDetected ? 'Anomalies Detected' : 'All Fields Verified'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extracted Fields */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-800 block mb-2">Parsed Key-Value Entities:</span>
              {Object.entries(extractionResult.extractedFields).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="font-mono text-slate-500">{key}:</span>
                  <span className="font-semibold text-slate-900">{val}</span>
                </div>
              ))}
            </div>

            {/* Cross-Validation Matches */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-800 block mb-2">Master Database Cross-Validation:</span>
              {extractionResult.crossValidationMatches.map(m => (
                <div key={m.fieldKey} className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <div>
                    <span className="font-medium text-slate-700">{m.fieldLabel}</span>
                    <div className="text-[11px] text-slate-500">
                      OCR: {m.extractedValue} | Master: {m.masterValue}
                    </div>
                  </div>
                  <Badge variant={m.isMatch ? 'success' : 'danger'}>
                    {m.isMatch ? 'Match' : 'Mismatch'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
