import React, { useState } from 'react';
import { Award, FileText, CheckCircle2, ShieldCheck, QrCode, Printer } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { examinationResultsService } from '../services/examinationResultsService';
import { DigitalMarksheetPayload, DegreeCertificatePayload } from '../types';

export const MarksheetCertificateViewer: React.FC = () => {
  const [docType, setDocType] = useState<'MARKSHEET' | 'DEGREE'>('MARKSHEET');
  const [studentId, setStudentId] = useState<string>('stud-001');

  const marksheet: DigitalMarksheetPayload = examinationResultsService.generateMarksheetPayload(studentId, 4);
  const certificate: DegreeCertificatePayload = examinationResultsService.generateDegreeCertificatePayload(studentId);

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDocType('MARKSHEET')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              docType === 'MARKSHEET'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Digital Marksheet Preview
          </button>
          <button
            onClick={() => setDocType('DEGREE')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              docType === 'DEGREE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Degree Certificate Preview
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Enrollment No:</span>
          <input
            type="text"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="w-32 px-2.5 py-1 border border-slate-300 rounded font-mono text-xs font-medium"
          />
        </div>
      </div>

      {/* Document Render Area */}
      {docType === 'MARKSHEET' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-6 space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {marksheet.universityName}
            </h2>
            <p className="text-sm font-semibold text-indigo-700">{marksheet.institutionName}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold pt-2">
              Official Semester Grade Report & Academic Performance Record
            </p>
          </div>

          {/* Student Bio Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block">Candidate Name</span>
              <span className="font-bold text-slate-800">{marksheet.studentDetails.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Enrollment No</span>
              <span className="font-mono font-bold text-slate-800">{marksheet.studentDetails.enrollmentNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Program & Semester</span>
              <span className="font-semibold text-slate-800">Sem {marksheet.studentDetails.semester} ({marksheet.studentDetails.academicYear})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Result Status</span>
              <span className="font-bold text-emerald-700">{marksheet.evaluationSummary.resultStatus}</span>
            </div>
          </div>

          {/* Course Marks Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Credits</th>
                  <th className="py-2.5 px-3 text-center">Internal (30)</th>
                  <th className="py-2.5 px-3 text-center">External (70)</th>
                  <th className="py-2.5 px-3 text-center">Total (100)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksheet.evaluationSummary.courseMarks.map(c => (
                  <tr key={c.subjectId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{c.subjectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.subjectCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">{c.credits}</td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{c.internalMarks}</td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{c.externalMarks}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{c.totalMarks}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="navy">{c.grade}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{c.gradePoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SGPA & CGPA Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
            <div>
              <span className="text-[11px] text-indigo-700 font-medium block">Credits Earned</span>
              <span className="text-base font-bold text-indigo-950">
                {marksheet.evaluationSummary.totalCreditsEarned} / {marksheet.evaluationSummary.totalCreditsOffered}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-indigo-700 font-medium block">Semester SGPA</span>
              <span className="text-base font-bold text-indigo-950">{marksheet.evaluationSummary.sgpa.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] text-indigo-700 font-medium block">Cumulative CGPA</span>
              <span className="text-base font-bold text-indigo-950">{marksheet.evaluationSummary.cgpa.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] text-indigo-700 font-medium block">Active Backlogs</span>
              <span className="text-base font-bold text-emerald-700">{marksheet.evaluationSummary.backlogsCount}</span>
            </div>
          </div>

          {/* Tamper Evidence Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{marksheet.securityHash}</span>
            </div>
            <span>Verified Electronic Document • Controller of Examinations</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 rounded-2xl border-4 border-double border-amber-300/80 shadow-md p-10 max-w-3xl mx-auto space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              {certificate.universityName}
            </h2>
            <p className="text-xs tracking-widest text-amber-800 uppercase font-semibold">
              On the recommendation of the Academic Council confers upon
            </p>
          </div>

          <div className="py-4">
            <h3 className="text-3xl font-serif font-bold text-indigo-950 underline decoration-amber-400 underline-offset-8">
              {certificate.candidateName}
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-2">Enrollment No: {certificate.enrollmentNumber}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
            <p>the Degree of</p>
            <p className="text-lg font-bold text-slate-900">{certificate.programConferred}</p>
            <p className="text-xs text-slate-500">with specialization in {certificate.specialization}</p>
            <p className="text-xs font-semibold text-emerald-800 pt-2">
              Conferred with {certificate.divisionConferred.replace(/_/g, ' ')} (CGPA: {certificate.finalCgpa.toFixed(2)})
            </p>
          </div>

          <div className="border-t border-amber-200/80 pt-6 text-[11px] text-slate-500 space-y-1">
            <p className="italic">{certificate.disclaimer}</p>
            <p className="font-mono text-[10px] text-slate-400">{certificate.verificationDigest}</p>
          </div>
        </div>
      )}
    </div>
  );
};
