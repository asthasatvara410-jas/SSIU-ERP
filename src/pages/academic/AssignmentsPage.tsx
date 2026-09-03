import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { Assignment, AssignmentSubmission } from '../../types';
import { 
  FileCheck, Calendar, Clock, Plus, Upload, CheckCircle2, Award, 
  FileText, Download, Eye, Trash2, Search, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, FileSpreadsheet, Printer, SlidersHorizontal, 
  ChevronLeft, ChevronRight, Check, X, AlertCircle, AlertTriangle, 
  ExternalLink, BookOpen, User, Layers, RefreshCw
} from 'lucide-react';
import { fileStorage } from '../../services/fileStorage';
import { assignmentService } from '../../services/assignmentService';
import { AssignmentSubmissionDetailsDrawer } from '../../components/academic/AssignmentSubmissionDetailsDrawer';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type SortField = 
  | 'srNo'
  | 'unitNo'
  | 'assignmentNo'
  | 'title'
  | 'subject'
  | 'faculty'
  | 'totalMarks'
  | 'submissions'
  | 'status'
  | 'deadline'
  | 'submissionStatus'
  | 'submittedDate'
  | 'obtainedMarks';

type SortOrder = 'asc' | 'desc';

export const AssignmentsPage: React.FC = () => {
  const { user, role } = useAuth();

  const subjects = db.getSubjects();
  const divisions = db.getDivisions();
  const assignments = db.getAssignments();
  const submissions = db.getAssignmentSubmissions();

  // Selected State for Modals & Submissions Drawer
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedAssignmentForDrawer, setSelectedAssignmentForDrawer] = useState<Assignment | null>(null);
  const [isSubmissionsDrawerOpen, setIsSubmissionsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [isViewSubmissionModalOpen, setIsViewSubmissionModalOpen] = useState(false);
  const [isViewGradeModalOpen, setIsViewGradeModalOpen] = useState(false);
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<AssignmentSubmission | null>(null);

  // Form State for Faculty Assignment Creator
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || '');
  const [unitNo, setUnitNo] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2024-11-15');
  const [totalMarks, setTotalMarks] = useState(20);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  // Submission Form State for Student
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Grading Form State for Faculty
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [obtainedMarks, setObtainedMarks] = useState(18);
  const [feedback, setFeedback] = useState('Good work!');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState<string>('ALL');

  // Sorting & Pagination States
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Column Visibility Controls
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    srNo: true,
    unit: true,
    assignmentNo: true,
    title: true,
    subject: true,
    description: true,
    faculty: true,
    maxMarks: true,
    submissions: true,
    status: true,
    deadline: true,
    submissionStatus: true,
    submittedOn: true,
    marks: true,
    actions: true,
  });

  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Date Formatter Helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Check if deadline is passed
  const isDeadlinePassed = (deadlineStr: string) => {
    try {
      const d = new Date(deadlineStr);
      d.setHours(23, 59, 59, 999);
      return d.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  // Helper to extract clean assignment number
  const getAssignmentNumberStr = (asg: Assignment, index: number) => {
    const match = asg.title.match(/Assignment\s*(\d+)/i);
    if (match) {
      return `Assignment ${match[1]}`;
    }
    return `Assignment ${index + 1}`;
  };

  // Clean title without "Assignment X:" prefix if redundant
  const getCleanTitle = (titleStr: string) => {
    return titleStr.replace(/^Assignment\s*\d+\s*:\s*/i, '').trim() || titleStr;
  };

  // Handle Handlers for Create/Submit/Delete/Grade
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let attachmentUrl = '';
      if (assignmentFile) {
        attachmentUrl = await fileStorage.saveFile(assignmentFile);
      }
      
      const newAsg: Omit<Assignment, 'id'> = {
        subjectId,
        divisionId,
        unitNo: Number(unitNo),
        title,
        description,
        deadline,
        totalMarks: Number(totalMarks),
        attachmentUrl,
        createdByFacultyId: user?.id || 'fac-1',
        createdByFacultyName: user?.name || 'Prof. Demo Faculty',
        createdDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      };

      db.addEntity<Assignment>('assignments', newAsg, `Created assignment: ${title}`);
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setAssignmentFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) {
      alert('Please select a file to submit.');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileUrl = await fileStorage.saveFile(submissionFile);

      const newSubm: Omit<AssignmentSubmission, 'id'> = {
        assignmentId: selectedAssignment.id,
        studentId: user?.id || 'stu-1',
        studentName: user?.name || 'Demo Student',
        enrollmentNo: user?.enrollmentNo || '230101001',
        submittedDate: new Date().toISOString().split('T')[0],
        fileUrl,
        notes: submissionNotes,
        status: 'SUBMITTED'
      };

      db.addEntity<AssignmentSubmission>('assignmentSubmissions', newSubm, `Submitted assignment ${selectedAssignment.title}`);
      setIsSubmitModalOpen(false);
      setSubmissionNotes('');
      setSubmissionFile(null);
    } catch(err) {
      console.error(err);
      alert('Failed to upload submission.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const asg = assignments.find(a => a.id === id);
      if (asg?.attachmentUrl?.startsWith('idb://')) {
        await fileStorage.deleteFile(asg.attachmentUrl);
      }
      db.deleteEntity('assignments', id, 'Deleted assignment');
    }
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    db.updateEntity<AssignmentSubmission>('assignmentSubmissions', selectedSubmission.id, {
      status: 'GRADED',
      obtainedMarks: Number(obtainedMarks),
      feedback
    }, `Graded assignment submission for ${selectedSubmission.studentName}`);

    setIsGradingModalOpen(false);
    setSelectedSubmission(null);
  };

  // Process and enrich assignments data with submission details
  const enrichedAssignments = useMemo(() => {
    return assignments.map((asg, index) => {
      const subj = db.getSubjectById(asg.subjectId);
      const studentSubm = submissions.find(
        s => s.assignmentId === asg.id && (s.studentId === user?.id || role !== 'STUDENT')
      );
      const stats = assignmentService.getAssignmentStats(asg);
      const submissionsDisplay = `${stats.submittedCount} / ${stats.totalEnrolled} Submitted`;
      const passed = isDeadlinePassed(asg.deadline);

      let submissionStatusText = 'Pending Submission';
      let submissionStatusVariant: 'gold' | 'active' | 'navy' | 'danger' = 'gold';

      if (studentSubm) {
        if (studentSubm.status === 'GRADED' || studentSubm.obtainedMarks !== undefined) {
          submissionStatusText = 'Evaluated';
          submissionStatusVariant = 'active';
        } else {
          submissionStatusText = 'Submitted';
          submissionStatusVariant = 'navy';
        }
      } else if (passed) {
        submissionStatusText = 'Deadline Passed';
        submissionStatusVariant = 'danger';
      }

      const assignmentNoStr = getAssignmentNumberStr(asg, index);
      const cleanTitle = getCleanTitle(asg.title);

      return {
        ...asg,
        rawIndex: index + 1,
        assignmentNoStr,
        cleanTitle,
        subjectName: subj ? `${subj.name} (${subj.code})` : 'General Subject',
        subjectCode: subj?.code || '',
        studentSubm,
        stats,
        submissionsDisplay,
        totalSubms: stats.submittedCount,
        isPassed: passed,
        submissionStatusText,
        submissionStatusVariant,
        obtainedMarks: studentSubm?.obtainedMarks,
        submittedDate: studentSubm?.submittedDate
      };
    });
  }, [assignments, submissions, user, role]);

  // Extract unique filter options
  const availableUnits = useMemo(() => {
    const units = Array.from(new Set(assignments.map(a => a.unitNo))).sort((a, b) => a - b);
    return units;
  }, [assignments]);

  const availableSubjects = useMemo(() => {
    const subIds = Array.from(new Set(assignments.map(a => a.subjectId)));
    return subIds.map(id => db.getSubjectById(id)).filter(Boolean);
  }, [assignments]);

  // Filtered & Searched data
  const filteredAssignments = useMemo(() => {
    return enrichedAssignments.filter(item => {
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCleanTitle = item.cleanTitle.toLowerCase().includes(q);
        const matchSubj = item.subjectName.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchFac = (item.createdByFacultyName || '').toLowerCase().includes(q);
        const matchUnit = `unit ${item.unitNo}`.toLowerCase().includes(q);
        const matchAsgNo = item.assignmentNoStr.toLowerCase().includes(q);

        if (!matchTitle && !matchCleanTitle && !matchSubj && !matchDesc && !matchFac && !matchUnit && !matchAsgNo) {
          return false;
        }
      }

      // Unit Filter
      if (selectedUnitFilter !== 'ALL') {
        if (item.unitNo !== Number(selectedUnitFilter)) return false;
      }

      // Subject Filter
      if (selectedSubjectFilter !== 'ALL') {
        if (item.subjectId !== selectedSubjectFilter) return false;
      }

      // Submission Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'PENDING' && item.submissionStatusText !== 'Pending Submission') return false;
        if (selectedStatusFilter === 'SUBMITTED' && item.submissionStatusText !== 'Submitted') return false;
        if (selectedStatusFilter === 'EVALUATED' && item.submissionStatusText !== 'Evaluated') return false;
        if (selectedStatusFilter === 'PASSED' && item.submissionStatusText !== 'Deadline Passed') return false;
      }

      // Deadline Filter
      if (selectedDeadlineFilter !== 'ALL') {
        if (selectedDeadlineFilter === 'UPCOMING' && item.isPassed) return false;
        if (selectedDeadlineFilter === 'PASSED' && !item.isPassed) return false;
      }

      return true;
    });
  }, [
    enrichedAssignments, 
    searchQuery, 
    selectedUnitFilter, 
    selectedSubjectFilter, 
    selectedStatusFilter, 
    selectedDeadlineFilter
  ]);

  // Sorting
  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'srNo':
          valA = a.rawIndex;
          valB = b.rawIndex;
          break;
        case 'unitNo':
          valA = a.unitNo;
          valB = b.unitNo;
          break;
        case 'assignmentNo':
          valA = a.assignmentNoStr;
          valB = b.assignmentNoStr;
          break;
        case 'title':
          valA = a.cleanTitle.toLowerCase();
          valB = b.cleanTitle.toLowerCase();
          break;
        case 'subject':
          valA = a.subjectName.toLowerCase();
          valB = b.subjectName.toLowerCase();
          break;
        case 'faculty':
          valA = (a.createdByFacultyName || '').toLowerCase();
          valB = (b.createdByFacultyName || '').toLowerCase();
          break;
        case 'totalMarks':
          valA = a.totalMarks;
          valB = b.totalMarks;
          break;
        case 'submissions':
          valA = a.stats.submittedCount;
          valB = b.stats.submittedCount;
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        case 'deadline':
          valA = new Date(a.deadline).getTime() || 0;
          valB = new Date(b.deadline).getTime() || 0;
          break;
        case 'submissionStatus':
          valA = a.submissionStatusText;
          valB = b.submissionStatusText;
          break;
        case 'submittedDate':
          valA = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
          valB = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
          break;
        case 'obtainedMarks':
          valA = a.obtainedMarks !== undefined ? a.obtainedMarks : -1;
          valB = b.obtainedMarks !== undefined ? b.obtainedMarks : -1;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAssignments, sortField, sortOrder]);

  // Pagination calculations
  const totalEntries = sortedAssignments.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalEntries / pageSize);
  const currentSafePage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedAssignments = useMemo(() => {
    if (pageSize === 0) return sortedAssignments;
    const start = (currentSafePage - 1) * pageSize;
    return sortedAssignments.slice(start, start + pageSize);
  }, [sortedAssignments, currentSafePage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // KPI Summary Counts
  const kpiStats = useMemo(() => {
    const total = enrichedAssignments.length;
    const pending = enrichedAssignments.filter(a => a.submissionStatusText === 'Pending Submission').length;
    const submitted = enrichedAssignments.filter(a => a.submissionStatusText === 'Submitted').length;
    const evaluated = enrichedAssignments.filter(a => a.submissionStatusText === 'Evaluated').length;
    const overdue = enrichedAssignments.filter(a => a.submissionStatusText === 'Deadline Passed').length;

    return { total, pending, submitted, evaluated, overdue };
  }, [enrichedAssignments]);

  // Export to Excel Functionality
  const handleExportExcel = () => {
    try {
      const rows = sortedAssignments.map((item, idx) => ({
        'Sr. No.': idx + 1,
        'Unit': `UNIT ${item.unitNo}`,
        'Assignment': item.assignmentNoStr,
        'Title': item.cleanTitle,
        'Subject': item.subjectName,
        'Description': item.description,
        'Faculty': item.createdByFacultyName,
        'Max Marks': item.totalMarks,
        'Submissions': item.submissionsDisplay,
        'Assignment Status': item.status || 'ACTIVE',
        'Deadline': formatDate(item.deadline),
        'Submission Status': item.submissionStatusText,
        'Submitted On': formatDate(item.submittedDate),
        'Marks / Grade': item.obtainedMarks !== undefined ? `${item.obtainedMarks} / ${item.totalMarks}` : '—'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments');

      // Auto fit column widths
      const maxColWidths = [
        { wch: 8 },  // Sr. No.
        { wch: 10 }, // Unit
        { wch: 15 }, // Assignment
        { wch: 35 }, // Title
        { wch: 35 }, // Subject
        { wch: 45 }, // Description
        { wch: 22 }, // Faculty
        { wch: 12 }, // Max Marks
        { wch: 20 }, // Submissions
        { wch: 16 }, // Status
        { wch: 15 }, // Deadline
        { wch: 20 }, // Submission Status
        { wch: 15 }, // Submitted On
        { wch: 15 }  // Marks
      ];
      worksheet['!cols'] = maxColWidths;

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `SSIU_Academic_Assignments_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Export Excel Error:', err);
      alert('Failed to export Excel.');
    }
  };

  // Export to PDF Functionality
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Title & University Header
      doc.setFontSize(16);
      doc.setTextColor(15, 44, 89); // #0F2C59 Navy
      doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(243, 112, 35); // Orange
      doc.text('DIRECTORATE OF ACADEMIC AFFAIRS • COURSEWORK ASSIGNMENTS & SUBMISSIONS', 14, 21);

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Muted
      doc.text(`Generated On: ${new Date().toLocaleString('en-IN')} | Total Records: ${sortedAssignments.length}`, 14, 27);

      const tableHeaders = [
        ['Sr.', 'Unit', 'Assignment', 'Title', 'Subject / Code', 'Faculty', 'Max', 'Submissions', 'Deadline', 'Status']
      ];

      const tableData = sortedAssignments.map((item, idx) => [
        String(idx + 1),
        `Unit ${item.unitNo}`,
        item.assignmentNoStr,
        item.cleanTitle,
        item.subjectName,
        item.createdByFacultyName || '—',
        String(item.totalMarks),
        item.submissionsDisplay,
        formatDate(item.deadline),
        item.status || 'ACTIVE'
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 32,
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [15, 44, 89],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 14, halign: 'center' },
          2: { cellWidth: 22 },
          3: { cellWidth: 48 },
          4: { cellWidth: 46 },
          5: { cellWidth: 30 },
          6: { cellWidth: 12, halign: 'right' },
          7: { cellWidth: 28, halign: 'center' },
          8: { cellWidth: 22, halign: 'center' },
          9: { cellWidth: 18, halign: 'center' }
        }
      });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`SSIU_Academic_Assignments_${dateStr}.pdf`);
    } catch (err) {
      console.error('Export PDF Error:', err);
      alert('Failed to export PDF.');
    }
  };

  // Print Functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── PRINT MEDIA STYLES ──────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-assignments-table, #printable-assignments-table * {
            visibility: visible !important;
          }
          #printable-assignments-table {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          .no-print-toolbar, .no-print-kpis, .no-print-pagination, .no-print-actions-cell, .no-print-header-actions {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#FFFFFF',
        padding: '1.25rem 1.5rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: '#0F2C59',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.3px' }}>
                Academic Assignments &amp; Submissions
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                View active coursework assignments, upload submissions &amp; view grades
              </p>
            </div>
          </div>
        </div>

        <div className="no-print-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {role !== 'STUDENT' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Plus size={15} /> Create Assignment
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="no-print-kpis grid-4" style={{ gap: '1rem' }}>
        <div style={{
          background: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #0F2C59'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Coursework</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>{kpiStats.total}</div>
          </div>
          <div style={{ background: '#F1F5F9', color: '#0F2C59', padding: '8px', borderRadius: '6px' }}>
            <FileText size={20} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #F37023'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Submission</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F37023', marginTop: '2px' }}>{kpiStats.pending}</div>
          </div>
          <div style={{ background: '#FEF3C7', color: '#D97706', padding: '8px', borderRadius: '6px' }}>
            <Clock size={20} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #0284C7'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Work</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{kpiStats.submitted}</div>
          </div>
          <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '8px', borderRadius: '6px' }}>
            <Upload size={20} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #16A34A'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluated &amp; Graded</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>{kpiStats.evaluated}</div>
          </div>
          <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '8px', borderRadius: '6px' }}>
            <Award size={20} />
          </div>
        </div>
      </div>

      {/* ── EXCEL-STYLE TABLE CONTAINER ──────────────────────────────────────── */}
      <div 
        id="printable-assignments-table"
        style={{
          background: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #CBD5E1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Professional Toolbar */}
        <div className="no-print-toolbar" style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #CBD5E1',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          
          {/* Left Controls: Search & Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  height: '32px',
                  paddingLeft: '32px',
                  paddingRight: '10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F2C59',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Unit Filter */}
            <select
              value={selectedUnitFilter}
              onChange={e => { setSelectedUnitFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Units</option>
              {availableUnits.map(u => (
                <option key={u} value={String(u)}>Unit {u}</option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubjectFilter}
              onChange={e => { setSelectedSubjectFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                maxWidth: '180px'
              }}
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map(s => s && (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={e => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Submission</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="EVALUATED">Evaluated</option>
              <option value="PASSED">Deadline Passed</option>
            </select>

            {/* Deadline Filter */}
            <select
              value={selectedDeadlineFilter}
              onChange={e => { setSelectedDeadlineFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Deadlines</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PASSED">Deadline Passed</option>
            </select>

            {(searchQuery || selectedUnitFilter !== 'ALL' || selectedSubjectFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedDeadlineFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedUnitFilter('ALL');
                  setSelectedSubjectFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSelectedDeadlineFilter('ALL');
                  setCurrentPage(1);
                }}
                style={{ height: '32px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Reset
              </button>
            )}
          </div>

          {/* Right Controls: Export & Column Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', borderColor: '#A7F3D0', background: '#F0FDF4' }}
              title="Export to Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} /> Export Excel
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportPDF}
              style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}
              title="Export to PDF"
            >
              <FileText size={15} /> Export PDF
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Print Table"
            >
              <Printer size={15} /> Print
            </button>

            {/* Column Visibility Dropdown */}
            <div style={{ position: 'relative' }} ref={columnDropdownRef}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsColumnDropdownOpen(prev => !prev)}
                style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <SlidersHorizontal size={14} /> Columns
              </button>

              {isColumnDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  width: '210px',
                  padding: '0.5rem',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2C59', padding: '4px 6px', borderBottom: '1px solid #F1F5F9' }}>
                    TOGGLE COLUMNS
                  </div>
                  {Object.entries({
                    srNo: '1. Sr. No.',
                    unit: '2. Unit',
                    assignmentNo: '3. Assignment No.',
                    title: '4. Assignment Title',
                    subject: '5. Subject / Code',
                    description: '6. Description',
                    faculty: '7. Faculty',
                    maxMarks: '8. Max Marks',
                    submissions: '9. Submissions',
                    status: '10. Assignment Status',
                    deadline: '11. Deadline',
                    submissionStatus: '12. Submission Status',
                    submittedOn: '13. Submitted On',
                    marks: '14. Marks / Grade',
                    actions: '15. Actions'
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 6px',
                        fontSize: '0.78125rem',
                        cursor: 'pointer',
                        color: '#334155',
                        borderRadius: '4px',
                        userSelect: 'none'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={() => setVisibleColumns(prev => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof visibleColumns]
                        }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ── EXCEL-STYLE DATA TABLE (HORIZONTAL SCROLL) ── */}
        <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            textAlign: 'left',
            background: '#FFFFFF',
            minWidth: '1050px'
          }}>
            {/* Sticky Table Header */}
            <thead>
              <tr style={{
                background: '#F1F5F9',
                color: '#0F2C59',
                borderBottom: '2px solid #CBD5E1'
              }}>
                
                {visibleColumns.srNo && (
                  <th 
                    onClick={() => handleSort('srNo')}
                    style={{
                      padding: '10px 8px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      width: '55px',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                      Sr. {sortField === 'srNo' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.unit && (
                  <th 
                    onClick={() => handleSort('unitNo')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '75px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                      Unit {sortField === 'unitNo' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.assignmentNo && (
                  <th 
                    onClick={() => handleSort('assignmentNo')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '115px',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Assignment {sortField === 'assignmentNo' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.title && (
                  <th 
                    onClick={() => handleSort('title')}
                    style={{
                      padding: '10px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      minWidth: '180px',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Assignment Title {sortField === 'title' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.subject && (
                  <th 
                    onClick={() => handleSort('subject')}
                    style={{
                      padding: '10px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      minWidth: '180px',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Subject / Course Code {sortField === 'subject' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.description && (
                  <th 
                    style={{
                      padding: '10px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      minWidth: '180px',
                      borderRight: '1px solid #E2E8F0'
                    }}
                  >
                    Description
                  </th>
                )}

                {visibleColumns.faculty && (
                  <th 
                    onClick={() => handleSort('faculty')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      minWidth: '130px',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Faculty {sortField === 'faculty' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.maxMarks && (
                  <th 
                    onClick={() => handleSort('totalMarks')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '80px',
                      textAlign: 'right',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      Max {sortField === 'totalMarks' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.submissions && (
                  <th 
                    onClick={() => handleSort('submissions')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '150px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Submissions {sortField === 'submissions' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.status && (
                  <th 
                    onClick={() => handleSort('status')}
                    style={{
                      padding: '10px 8px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '75px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Status
                  </th>
                )}

                {visibleColumns.deadline && (
                  <th 
                    onClick={() => handleSort('deadline')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '105px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Deadline {sortField === 'deadline' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.submissionStatus && (
                  <th 
                    onClick={() => handleSort('submissionStatus')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '135px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Submission {sortField === 'submissionStatus' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.submittedOn && (
                  <th 
                    onClick={() => handleSort('submittedDate')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '105px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Submitted On {sortField === 'submittedDate' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.marks && (
                  <th 
                    onClick={() => handleSort('obtainedMarks')}
                    style={{
                      padding: '10px 10px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      width: '100px',
                      textAlign: 'center',
                      borderRight: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Marks / Grade {sortField === 'obtainedMarks' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="#94A3B8" />}
                    </div>
                  </th>
                )}

                {visibleColumns.actions && (
                  <th 
                    className="no-print-actions-cell"
                    style={{
                      padding: '10px 12px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                      minWidth: '150px'
                    }}
                  >
                    Actions
                  </th>
                )}

              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={28} color="#94A3B8" />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#334155' }}>No assignments found</span>
                      <span style={{ fontSize: '0.8125rem' }}>Try clearing filters or search criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((asg, idx) => {
                  const absoluteIndex = (currentSafePage - 1) * (pageSize || 1) + idx + 1;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={asg.id}
                      style={{
                        background: isEven ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? '#FFFFFF' : '#F8FAFC')}
                    >
                      {/* 1. Sr. No. */}
                      {visibleColumns.srNo && (
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                          {absoluteIndex}
                        </td>
                      )}

                      {/* 2. Unit */}
                      {visibleColumns.unit && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            background: '#FFF7ED',
                            color: '#C2410C',
                            border: '1px solid #FFEDD5',
                            borderRadius: '4px',
                            fontSize: '0.71875rem',
                            fontWeight: 800
                          }}>
                            UNIT {asg.unitNo}
                          </span>
                        </td>
                      )}

                      {/* 3. Assignment No. */}
                      {visibleColumns.assignmentNo && (
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                          {asg.assignmentNoStr}
                        </td>
                      )}

                      {/* 4. Assignment Title */}
                      {visibleColumns.title && (
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          <div>
                            {asg.cleanTitle}
                            {asg.attachmentUrl && (
                              <span style={{
                                marginLeft: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '0.6875rem',
                                color: '#F37023',
                                background: '#FFF7ED',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                verticalAlign: 'middle',
                                fontWeight: 700
                              }}>
                                <FileText size={11} /> Spec
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* 5. Subject / Course Code */}
                      {visibleColumns.subject && (
                        <td style={{ padding: '8px 12px', color: '#334155', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                          <div style={{ fontWeight: 600, color: '#0F2C59' }}>{asg.subjectName}</div>
                        </td>
                      )}

                      {/* 6. Description */}
                      {visibleColumns.description && (
                        <td style={{ padding: '8px 12px', color: '#64748B', borderRight: '1px solid #E2E8F0', maxWidth: '280px' }}>
                          <div style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.75rem',
                            lineHeight: 1.35
                          }} title={asg.description}>
                            {asg.description || 'No detailed instructions provided.'}
                          </div>
                        </td>
                      )}

                      {/* 7. Faculty */}
                      {visibleColumns.faculty && (
                        <td style={{ padding: '8px 10px', color: '#475569', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem', whiteSpace: 'nowrap' }}>
                          {asg.createdByFacultyName || 'Prof. Demo Faculty'}
                        </td>
                      )}

                      {/* 8. Max Marks */}
                      {visibleColumns.maxMarks && (
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          {asg.totalMarks}
                        </td>
                      )}

                      {/* 9. Submissions */}
                      {visibleColumns.submissions && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignmentForDrawer(asg);
                              setIsSubmissionsDrawerOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78125rem',
                              fontWeight: 800,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#DBEAFE';
                              e.currentTarget.style.borderColor = '#93C5FD';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#EFF6FF';
                              e.currentTarget.style.borderColor = '#BFDBFE';
                              e.currentTarget.style.transform = 'none';
                            }}
                            title="Click to view detailed student submissions roster"
                          >
                            <CheckCircle2 size={13} color="#2563EB" />
                            <span>{asg.submissionsDisplay}</span>
                          </button>
                        </td>
                      )}

                      {/* 10. Assignment Status */}
                      {visibleColumns.status && (
                        <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant="active">{asg.status || 'ACTIVE'}</Badge>
                        </td>
                      )}

                      {/* 11. Deadline */}
                      {visibleColumns.deadline && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: asg.isPassed ? '#DC2626' : '#0F2C59' }}>
                            {formatDate(asg.deadline)}
                          </div>
                          {asg.isPassed && (
                            <div style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 700 }}>
                              Overdue
                            </div>
                          )}
                        </td>
                      )}

                      {/* 12. Submission Status */}
                      {visibleColumns.submissionStatus && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant={asg.submissionStatusVariant}>
                            {asg.submissionStatusText}
                          </Badge>
                        </td>
                      )}

                      {/* 13. Submitted On */}
                      {visibleColumns.submittedOn && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                          {formatDate(asg.submittedDate)}
                        </td>
                      )}

                      {/* 14. Marks / Grade */}
                      {visibleColumns.marks && (
                        <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                          {asg.obtainedMarks !== undefined ? (
                            <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.8125rem' }}>
                              {asg.obtainedMarks} / {asg.totalMarks}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                      )}

                      {/* 15. Actions */}
                      {visibleColumns.actions && (
                        <td className="no-print-actions-cell" style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            
                            {/* Document View/Download */}
                            {asg.attachmentUrl && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm py-1 px-2"
                                  onClick={() => fileStorage.viewFile(asg.attachmentUrl!)}
                                  title="View Problem Statement Document"
                                  style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem' }}
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm py-1 px-2"
                                  onClick={() => fileStorage.downloadFile(asg.attachmentUrl!, asg.title)}
                                  title="Download Problem Spec"
                                  style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem' }}
                                >
                                  <Download size={13} />
                                </button>
                              </>
                            )}

                            {/* Student Role Actions */}
                            {role === 'STUDENT' ? (
                              asg.studentSubm ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm py-1 px-2"
                                    onClick={() => {
                                      setSelectedStudentSubmission(asg.studentSubm!);
                                      setSelectedAssignment(asg);
                                      setIsViewSubmissionModalOpen(true);
                                    }}
                                    title="View My Submission"
                                    style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem', color: '#0284C7', borderColor: '#BAE6FD' }}
                                  >
                                    View Submission
                                  </button>

                                  {asg.obtainedMarks !== undefined && (
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm py-1 px-2"
                                      onClick={() => {
                                        setSelectedStudentSubmission(asg.studentSubm!);
                                        setSelectedAssignment(asg);
                                        setIsViewGradeModalOpen(true);
                                      }}
                                      title="View Evaluation & Feedback"
                                      style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem', color: '#16A34A', borderColor: '#BBF7D0' }}
                                    >
                                      <Award size={13} /> View Grade
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm py-1 px-2"
                                  onClick={() => {
                                    setSelectedAssignment(asg);
                                    setIsSubmitModalOpen(true);
                                  }}
                                  title="Upload Assignment Submission"
                                  style={{ height: '26px', padding: '0 8px', fontSize: '0.71875rem', background: '#F37023', borderColor: '#F37023' }}
                                >
                                  <Upload size={13} /> Upload Submission
                                </button>
                              )
                            ) : (
                              /* Faculty / Admin Role Actions */
                              <>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm py-1 px-2"
                                  onClick={() => {
                                    setSelectedAssignmentForDrawer(asg);
                                    setIsSubmissionsDrawerOpen(true);
                                  }}
                                  title="View and Review Student Submissions Roster"
                                  style={{ height: '26px', padding: '0 8px', fontSize: '0.71875rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FileSpreadsheet size={12} /> Submissions ({asg.stats.submittedCount})
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm py-1 px-2"
                                  onClick={() => handleDeleteAssignment(asg.id)}
                                  title="Delete Assignment"
                                  style={{ height: '26px', padding: '0 6px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}

                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── EXCEL-STYLE BOTTOM PAGINATION BAR ────────────────────────────── */}
        <div className="no-print-pagination" style={{
          background: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: '#475569'
        }}>
          {/* Entries Info & Rows Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>
              Showing <strong>{totalEntries === 0 ? 0 : (currentSafePage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentSafePage * pageSize, totalEntries)}</strong> of <strong>{totalEntries}</strong> entries
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="rowsPerPageSelect" style={{ fontSize: '0.75rem', color: '#64748B' }}>Rows per page:</label>
              <select
                id="rowsPerPageSelect"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  height: '28px',
                  padding: '0 4px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F2C59'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={0}>All</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          {pageSize > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentSafePage === 1}
                style={{ height: '28px', width: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Previous Page"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    height: '28px',
                    minWidth: '28px',
                    padding: '0 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: p === currentSafePage ? '1px solid #0F2C59' : '1px solid #CBD5E1',
                    background: p === currentSafePage ? '#0F2C59' : '#FFFFFF',
                    color: p === currentSafePage ? '#FFFFFF' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentSafePage === totalPages}
                style={{ height: '28px', width: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Next Page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL 1: CREATE ASSIGNMENT MODAL (FACULTY) ─────────────────────── */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="#F37023" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Create New Assignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Subject / Course *</label>
                <select className="form-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Unit Number *</label>
                  <input type="number" className="form-input" min={1} max={10} value={unitNo} onChange={e => setUnitNo(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Max Marks *</label>
                  <input type="number" className="form-input" min={5} max={100} value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Assignment Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Assignment 1: ER Diagram & Relational Schema Design" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Problem Statement / Description *</label>
                <textarea className="form-input" rows={3} placeholder="Detailed instructions and rubric requirements..." value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Submission Deadline Date *</label>
                <input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Problem Specification Document (Optional)</label>
                <input type="file" className="form-input" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isUploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Publishing...' : 'Publish Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: STUDENT UPLOAD SUBMISSION MODAL ───────────────────────── */}
      {isSubmitModalOpen && selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Upload Assignment Submission
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#F37023', fontWeight: 700, marginTop: '2px' }}>
                  {selectedAssignment.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                <div><strong>Max Marks:</strong> {selectedAssignment.totalMarks} | <strong>Unit:</strong> Unit {selectedAssignment.unitNo}</div>
                <div><strong>Deadline:</strong> {formatDate(selectedAssignment.deadline)}</div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Upload Solution / Report Document *</label>
                <input type="file" className="form-input" required onChange={e => setSubmissionFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*" />
                <span style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '3px' }}>Accepted formats: PDF, DOC, DOCX, ZIP, PPT, XLSX (Max 25MB)</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Submission Notes / Self Remarks</label>
                <textarea className="form-input" rows={3} placeholder="Add any comments, explanations, or links for faculty evaluation..." value={submissionNotes} onChange={e => setSubmissionNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} disabled={isUploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading} style={{ background: '#F37023', borderColor: '#F37023' }}>
                  {isUploading ? 'Uploading...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: STUDENT VIEW SUBMISSION MODAL ─────────────────────────── */}
      {isViewSubmissionModalOpen && selectedAssignment && selectedStudentSubmission && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#0284C7" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                    My Submission Details
                  </h3>
                  <div style={{ fontSize: '0.78125rem', color: '#F37023', fontWeight: 700 }}>
                    {selectedAssignment.title}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewSubmissionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>Submission Status:</span>
                  <Badge variant={selectedStudentSubmission.status === 'GRADED' ? 'active' : 'navy'}>
                    {selectedStudentSubmission.status}
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>Submitted On:</span>
                  <span style={{ fontWeight: 800, color: '#0F2C59' }}>{formatDate(selectedStudentSubmission.submittedDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>Enrollment No:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#F37023' }}>{selectedStudentSubmission.enrollmentNo}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Student Notes / Remarks
                </div>
                <div style={{ padding: '0.75rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8125rem', color: '#334155' }}>
                  {selectedStudentSubmission.notes || 'No notes attached with this submission.'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Uploaded Attachment
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileStorage.viewFile(selectedStudentSubmission.fileUrl)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> View Document
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => fileStorage.downloadFile(selectedStudentSubmission.fileUrl, `Submission_${selectedAssignment.title}`)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsViewSubmissionModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: STUDENT VIEW GRADE & FEEDBACK MODAL ────────────────────── */}
      {isViewGradeModalOpen && selectedAssignment && selectedStudentSubmission && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} color="#16A34A" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Faculty Evaluation &amp; Grade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewGradeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1.25rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  OBTAINED SCORE
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                  {selectedStudentSubmission.obtainedMarks} <span style={{ fontSize: '1.125rem', color: '#64748B' }}>/ {selectedAssignment.totalMarks}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#15803D', marginTop: '2px' }}>
                  Percentage: {Math.round(((selectedStudentSubmission.obtainedMarks || 0) / selectedAssignment.totalMarks) * 100)}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Faculty Feedback &amp; Remarks
                </div>
                <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8125rem', color: '#0F2C59', fontStyle: 'italic' }}>
                  "{selectedStudentSubmission.feedback || 'Good work! All required sections completed properly.'}"
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>
                Evaluated by: <strong>{selectedAssignment.createdByFacultyName || 'Course Faculty'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsViewGradeModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: FACULTY REVIEW & GRADING MODAL ─────────────────────────── */}
      {isGradingModalOpen && selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Submissions Review: {selectedAssignment.title}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Review uploaded student solutions and assign score out of {selectedAssignment.totalMarks}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGradingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto' }}>
              {submissions.filter(s => s.assignmentId === selectedAssignment.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={28} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, color: '#334155' }}>No student submissions received yet</div>
                  <div style={{ fontSize: '0.8125rem' }}>Submissions uploaded by enrolled students will appear here for grading.</div>
                </div>
              ) : (
                submissions.filter(s => s.assignmentId === selectedAssignment.id).map(subm => (
                  <div key={subm.id} style={{ padding: '0.85rem 1rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>{subm.studentName}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F37023', marginLeft: '6px', fontSize: '0.78125rem' }}>({subm.enrollmentNo})</span>
                      </div>
                      <Badge variant={subm.status === 'GRADED' ? 'active' : 'inactive'}>{subm.status}</Badge>
                    </div>

                    <div style={{ fontSize: '0.78125rem', color: '#64748B', marginBottom: '0.65rem' }}>
                      Submitted: {formatDate(subm.submittedDate)} • Notes: {subm.notes || 'None'}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-sm py-1" onClick={() => fileStorage.viewFile(subm.fileUrl)} style={{ fontSize: '0.71875rem' }}>
                          <Eye size={12} /> View Submission
                        </button>
                        <button className="btn btn-secondary btn-sm py-1" onClick={() => fileStorage.downloadFile(subm.fileUrl, `${subm.studentName}_Submission`)} style={{ fontSize: '0.71875rem' }}>
                          <Download size={12} /> Download
                        </button>
                      </div>

                      {subm.obtainedMarks !== undefined ? (
                        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Award size={14} /> Score: {subm.obtainedMarks} / {selectedAssignment.totalMarks} ({subm.feedback})
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedSubmission(subm);
                            setObtainedMarks(18);
                            setFeedback('Good structure and clean code.');
                          }}
                          style={{ fontSize: '0.75rem' }}
                        >
                          Grade Student
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedSubmission && (
              <form onSubmit={handleGradeSubmission} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F2C59' }}>
                  Grading Solution for <span style={{ color: '#F37023' }}>{selectedSubmission.studentName}</span>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Marks (Out of {selectedAssignment.totalMarks}) *</label>
                    <input type="number" className="form-input" min={0} max={selectedAssignment.totalMarks} value={obtainedMarks} onChange={e => setObtainedMarks(Number(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Faculty Feedback / Comments</label>
                    <input type="text" className="form-input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback comments..." />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedSubmission(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save &amp; Publish Score</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsGradingModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL / DRAWER: ASSIGNMENT SUBMISSION DETAILS ─────────────────────── */}
      <AssignmentSubmissionDetailsDrawer
        isOpen={isSubmissionsDrawerOpen}
        onClose={() => {
          setIsSubmissionsDrawerOpen(false);
          setSelectedAssignmentForDrawer(null);
        }}
        assignment={selectedAssignmentForDrawer}
        onSubmissionsUpdated={() => {
          // Submissions updated in db
        }}
      />

    </div>
  );
};
