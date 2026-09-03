import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { hallTicketDataService } from '../../services/hallTicketDataService';
import { hallTicketPdfService } from '../../services/hallTicketPdfService';
import { HallTicketData } from '../../types/hallTicket';
import { HallTicketPrint, printIsolatedHallTicket } from '../../components/hall-ticket/HallTicketPrint';
import {
  FileText,
  Download,
  Printer,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Eye,
  RefreshCw,
  QrCode,
  X
} from 'lucide-react';
import logoSvg from '../../assets/swarrnim-logo.svg';

interface HallTicketPageProps {
  setActiveTab?: (tab: string) => void;
}

export const HallTicketPage: React.FC<HallTicketPageProps> = ({ setActiveTab }) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isAdminOrFaculty = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'FACULTY' || role === 'REGISTRAR';

  const exams = db.getExams();
  const programs = db.getPrograms();
  const departments = db.getDepartments();
  const semesters = db.getSemesters();
  const students = db.getStudents();
  const forms = db.getExamForms();

  // Filters State
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [generatingBulk, setGeneratingBulk] = useState<boolean>(false);

  // Modal Preview for Admin / Faculty
  const [previewTicket, setPreviewTicket] = useState<HallTicketData | null>(null);

  // Current Exam Object
  const currentExam = useMemo(() => exams.find(e => e.id === selectedExamId) || exams[0], [exams, selectedExamId]);

  // Current Student (for Student View)
  const currentStudent = useMemo(() => {
    if (!isStudent) return null;
    return students.find(s => s.id === user?.id || s.email === user?.email || s.enrollmentNo === user?.enrollmentNo) || students[0];
  }, [students, user, isStudent]);

  // Current Student Form
  const currentStudentForm = useMemo(() => {
    if (!currentStudent || !currentExam) return null;
    return forms.find(f => f.examId === currentExam.id && (f.studentId === currentStudent.id || f.enrollmentNo === currentStudent.enrollmentNo));
  }, [forms, currentExam, currentStudent]);

  // Student Hall Ticket Data
  const studentHallTicket = useMemo(() => {
    if (!currentStudent || !currentExam) return null;
    return hallTicketDataService.getHallTicketForStudent(currentExam.id, currentStudent.id);
  }, [currentExam, currentStudent]);

  // Admin Hall Tickets List (Filtered)
  const adminHallTickets = useMemo(() => {
    if (isStudent || !currentExam) return [];
    return hallTicketDataService.getAllHallTicketsForExam(currentExam.id, {
      programId: selectedProgramId,
      semesterId: selectedSemesterId,
      status: selectedStatus,
      search: searchQuery
    });
  }, [isStudent, currentExam, selectedProgramId, selectedSemesterId, selectedStatus, searchQuery]);

  // Handler: View PDF in New Tab
  const handleViewPdf = (ticket: HallTicketData) => {
    hallTicketPdfService.openInNewTab(ticket);
  };

  // Handler: Download Single PDF
  const handleDownloadPdf = (ticket: HallTicketData) => {
    hallTicketPdfService.downloadPdf(ticket);
  };

  // Handler: Print Single PDF / Open Preview
  const handlePrintPdf = (ticket: HallTicketData) => {
    setPreviewTicket(ticket);
  };

  // Handler: Download Bulk PDFs
  const handleDownloadBulk = async () => {
    if (adminHallTickets.length === 0) return;
    setGeneratingBulk(true);
    try {
      await hallTicketPdfService.downloadBulkPdf(
        adminHallTickets,
        `HallTickets_${currentExam.code || 'EXAM'}_${adminHallTickets.length}_Students.pdf`
      );
    } finally {
      setGeneratingBulk(false);
    }
  };

  // Examination Navigation Tabs
  const examNavTabs = [
    { id: 'exam-forms', label: 'Exam Forms', icon: FileText },
    { id: 'exam-fees-student', label: 'Exam Fees', icon: Layers },
    { id: 'exam-hallticket', label: 'Hall Ticket', icon: QrCode, active: true },
    { id: 'exam-backlog', label: 'Backlog / Re-Exam', icon: RefreshCw },
    { id: 'exam-reassessment', label: 'Reassessment / Rechecking', icon: Filter },
    { id: 'exam-results', label: 'Results', icon: CheckCircle }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── 1. EXAMINATION MODULE NAVIGATION HEADER ──────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                EXAMINATION CONTROLLER PORTAL
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-600">Official Admit Cards</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Examination Hall Ticket &amp; Admit Card
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {isStudent
                ? 'View, download, and print your official university examination hall ticket with allocated exam room and seat number.'
                : 'Manage student admit cards, seating plans, bulk PDF generation, and official hall ticket issuance.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="SSIU" className="h-10 w-auto object-contain hidden md:block" />
          </div>
        </div>

        {/* Examination Sub-Navigation Tabs */}
        {setActiveTab && (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pt-5 -mb-6 pb-0">
            {examNavTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                  tab.active
                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. FILTER & SELECTION BAR ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Exam Event */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Examination Event
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.session || 'Summer 2026'})
                </option>
              ))}
            </select>
          </div>

          {/* Program Filter (Admin only) */}
          {!isStudent && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Program / Degree
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
              >
                <option value="ALL">All Programs &amp; Branches</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Semester Filter (Admin only) */}
          {!isStudent && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Semester
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={selectedSemesterId}
                onChange={e => setSelectedSemesterId(e.target.value)}
              >
                <option value="ALL">All Semesters</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.code}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className={isStudent ? 'lg:col-span-3' : ''}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Candidate
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, enrollment no, hall ticket no..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. STUDENT VIEW: OFFICIAL LIVE HALL TICKET DOCUMENT PREVIEW ───── */}
      {isStudent && (
        <div className="space-y-6">
          {!currentStudentForm ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center no-print">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-slate-900">No Exam Form Submitted</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                You have not registered or submitted an examination form for <strong>{currentExam?.name}</strong> yet.
              </p>
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('exam-forms')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition"
                >
                  <FileText className="w-4 h-4" /> Go to Exam Forms
                </button>
              )}
            </div>
          ) : !studentHallTicket ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center no-print">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-slate-900">Hall Ticket Under Verification</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Your exam form status is <Badge variant="active">{currentStudentForm.status}</Badge>.
                Hall tickets are issued once form verification and seating allocations are finalized by the Controller of Examinations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Document Actions Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ OFFICIAL HALL TICKET READY
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      AY {studentHallTicket.academicYear} • {studentHallTicket.examSession}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    {studentHallTicket.studentName} — Official Examination Admit Card
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Enrollment No: <strong className="text-slate-900 font-mono">{studentHallTicket.enrollmentNo}</strong> • Hall Ticket No: <strong className="text-blue-900 font-mono">{studentHallTicket.hallTicketNo}</strong> • Allocated Seat: <strong className="text-orange-600 font-mono">{studentHallTicket.examSeatNo}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => printIsolatedHallTicket('ssiu-ht-doc')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Official Hall Ticket
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(studentHallTicket)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>

                  <button
                    onClick={() => handleViewPdf(studentHallTicket)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in PDF Viewer
                  </button>
                </div>
              </div>

              {/* On-Screen A4 Proportion Document Preview */}
              <div className="rounded-xl overflow-hidden shadow-md border border-slate-300">
                <HallTicketPrint ticket={studentHallTicket} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. ADMIN & CONTROLLER VIEW: BULK ACTIONS & MANAGEMENT DIRECTORY ── */}
      {isAdminOrFaculty && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Registered Candidates</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{forms.filter(f => f.examId === selectedExamId).length}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Hall Tickets Ready</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{adminHallTickets.length}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Exam Session</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{currentExam.session || 'Summer 2026'}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Exam Centre</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">SSIU Main Campus</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Directory Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Issued Hall Tickets Directory ({adminHallTickets.length} Students)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Examination: <strong>{currentExam?.name}</strong> (Code: {currentExam?.code})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadBulk}
                  disabled={adminHallTickets.length === 0 || generatingBulk}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {generatingBulk ? 'Generating Bulk PDF...' : `Download Bulk Hall Tickets (${adminHallTickets.length})`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Enrollment No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Program &amp; Branch</th>
                    <th className="py-3 px-4">Hall Ticket No</th>
                    <th className="py-3 px-4 text-center">Seat No</th>
                    <th className="py-3 px-4 text-center">Papers</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {adminHallTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No issued hall tickets found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    adminHallTickets.map((ticket, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{ticket.enrollmentNo}</td>
                        <td className="py-3 px-4 font-bold text-blue-950">{ticket.studentName}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{ticket.programName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-600">{ticket.hallTicketNo}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-800 rounded font-black text-[11px] border border-orange-200">
                            {ticket.examSeatNo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{ticket.subjects.length}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ISSUED
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewTicket(ticket)}
                              title="Preview &amp; Print Official Hall Ticket"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded transition border border-blue-200 flex items-center gap-1 font-bold text-[11px] px-2"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(ticket)}
                              title="Download PDF"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition border border-slate-300"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setPreviewTicket(ticket);
                                setTimeout(() => {
                                  printIsolatedHallTicket('ssiu-admin-ht-preview-inner');
                                }, 200);
                              }}
                              title="Print Hall Ticket Document"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition border border-slate-300"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ADMIN DOCUMENT PREVIEW MODAL ───────────────────────────────── */}
      {previewTicket && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-300">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Official Examination Hall Ticket Preview — {previewTicket.studentName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Enrollment: {previewTicket.enrollmentNo} | Hall Ticket No: {previewTicket.hallTicketNo} | Seat: {previewTicket.examSeatNo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printIsolatedHallTicket('ssiu-admin-ht-preview-inner')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Hall Ticket
                </button>
                <button
                  onClick={() => handleDownloadPdf(previewTicket)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={() => handleViewPdf(previewTicket)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                </button>
                <button
                  onClick={() => setPreviewTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Document Preview */}
            <div className="p-6 overflow-y-auto bg-slate-200 flex justify-center">
              <div id="ssiu-admin-ht-preview-inner" className="w-full flex justify-center">
                <HallTicketPrint ticket={previewTicket} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
