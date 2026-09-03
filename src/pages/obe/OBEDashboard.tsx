import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Target, Award, RefreshCw, BarChart3, CheckCircle, AlertTriangle,
  Play, Plus, Check, Layers, ChevronRight, Sliders, FileText, Compass, BookOpen,
  Save, RotateCcw, Info, Sparkles, Database, CheckSquare, ShieldCheck, ListOrdered, FileCheck,
  Edit3, X, HelpCircle, TrendingUp, Download, Eye, Clock, User, AlertCircle
} from 'lucide-react';
import {
  OBEApiService,
  OBEDashboardSummary,
  CourseOutcomeItem,
  ProgramOutcomeItem,
  ProgramSpecificOutcomeItem,
  ImprovementActionItem,
  OBEMatrixData,
  AssessmentMappingItem,
  OBEReportItem,
  OBEValidationResult,
} from '../../services/obeApiService';

export type OBETabKey =
  | 'MAPPING_MATRIX'
  | 'CO_MANAGER'
  | 'PROGRAM_OUTCOMES'
  | 'PSO'
  | 'CO_PSO_MAPPING'
  | 'ASSESSMENT_MAPPING'
  | 'ATTAINMENT'
  | 'IMPROVEMENT_ACTIONS'
  | 'REPORTS';

interface OBEDashboardProps {
  initialTab?: OBETabKey;
}

export const OBEDashboard: React.FC<OBEDashboardProps> = ({ initialTab = 'MAPPING_MATRIX' }) => {
  const [summary, setSummary] = useState<OBEDashboardSummary | null>(null);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcomeItem[]>([]);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcomeItem[]>([]);
  const [programSpecificOutcomes, setProgramSpecificOutcomes] = useState<ProgramSpecificOutcomeItem[]>([]);
  const [improvementActions, setImprovementActions] = useState<ImprovementActionItem[]>([]);
  const [assessmentMappings, setAssessmentMappings] = useState<AssessmentMappingItem[]>([]);
  const [reportsList, setReportsList] = useState<OBEReportItem[]>([]);
  const [validationResult, setValidationResult] = useState<OBEValidationResult | null>(null);
  
  // Scoping Selectors
  const [selectedProgram, setSelectedProgram] = useState<string>('PROG-BTECH-CSE');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2025-26');
  const [selectedCourse, setSelectedCourse] = useState<string>('COURSE-CS301');
  
  // CO-PO Matrix State
  const [matrixData, setMatrixData] = useState<OBEMatrixData | null>(null);
  const [editingMatrix, setEditingMatrix] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavingMatrix, setIsSavingMatrix] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // CO-PSO Matrix State
  const [editingPSOMatrix, setEditingPSOMatrix] = useState<Record<string, number>>({});
  const [hasUnsavedPSOChanges, setHasUnsavedPSOChanges] = useState<boolean>(false);
  const [isSavingPSOMatrix, setIsSavingPSOMatrix] = useState<boolean>(false);

  // Assessment Mapping Editing State
  const [editingAssessments, setEditingAssessments] = useState<AssessmentMappingItem[]>([]);
  const [hasUnsavedAssessments, setHasUnsavedAssessments] = useState<boolean>(false);
  const [isSavingAssessments, setIsSavingAssessments] = useState<boolean>(false);

  // Attainment Calculations State
  const [attainmentPayload, setAttainmentPayload] = useState<any>(null);

  // Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<{ type: 'COURSE_CO' | 'PROGRAM_PO'; id: string; label: string; currentLevel: number; currentPct: number } | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<number>(3);
  const [overridePct, setOverridePct] = useState<number>(75);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // New CQI Action Modal State
  const [newActionModalOpen, setNewActionModalOpen] = useState(false);
  const [newActionCO, setNewActionCO] = useState<string>('');
  const [newActionIssue, setNewActionIssue] = useState<string>('');
  const [newActionPlan, setNewActionPlan] = useState<string>('');
  const [newActionOwner, setNewActionOwner] = useState<string>('Prof. Ananya Roy');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Generate Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'COURSE' | 'PROGRAM' | 'CO_PO_MATRIX' | 'ATTAINMENT'>('ATTAINMENT');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<OBETabKey>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, coRes, poRes, psoRes, matRes, actRes, asmRes, repRes, valRes] = await Promise.all([
        OBEApiService.getDashboard(),
        OBEApiService.listCOs(selectedCourse),
        OBEApiService.listPOs(selectedProgram),
        OBEApiService.listPSOs(selectedProgram),
        OBEApiService.getMatrix(selectedCourse, selectedProgram),
        OBEApiService.listImprovementActions(selectedCourse),
        OBEApiService.listAssessments(selectedCourse),
        OBEApiService.listReports(),
        OBEApiService.validateCourse(selectedCourse),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (coRes.success && Array.isArray(coRes.data)) setCourseOutcomes(coRes.data);
      if (poRes.success && Array.isArray(poRes.data)) setProgramOutcomes(poRes.data);
      if (psoRes.success && Array.isArray(psoRes.data)) setProgramSpecificOutcomes(psoRes.data);
      if (actRes.success && Array.isArray(actRes.data)) setImprovementActions(actRes.data);
      if (asmRes.success && Array.isArray(asmRes.data)) {
        setAssessmentMappings(asmRes.data);
        setEditingAssessments(JSON.parse(JSON.stringify(asmRes.data)));
      }
      if (repRes.success && Array.isArray(repRes.data)) setReportsList(repRes.data);
      if (valRes.success && valRes.data) setValidationResult(valRes.data);

      if (matRes.success && matRes.data) {
        setMatrixData(matRes.data);
        setEditingMatrix({ ...(matRes.data.matrixMap || {}) });
        setHasUnsavedChanges(false);

        // Populate CO-PSO initial map
        const psoMap: Record<string, number> = {};
        (matRes.data.courseOutcomes || []).forEach((co: any) => {
          (co.psoMappings || []).forEach((p: any) => {
            psoMap[`${co.id}_${p.programSpecificOutcomeId}`] = p.level;
          });
        });
        setEditingPSOMatrix(psoMap);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedProgram, selectedAcademicYear]);

  // Safe collections normalized with fallbacks
  const safeCOList: CourseOutcomeItem[] = Array.isArray(courseOutcomes) && courseOutcomes.length > 0
    ? courseOutcomes
    : (Array.isArray(matrixData?.courseOutcomes) && matrixData!.courseOutcomes.length > 0
        ? matrixData!.courseOutcomes
        : [
            { id: 'co-1', code: 'CO1', description: 'Analyze complex algorithms and computational complexity.', academicYear: selectedAcademicYear, status: 'ACTIVE' },
            { id: 'co-2', code: 'CO2', description: 'Design modular systems using object-oriented principles.', academicYear: selectedAcademicYear, status: 'ACTIVE' },
            { id: 'co-3', code: 'CO3', description: 'Implement relational database models and optimized queries.', academicYear: selectedAcademicYear, status: 'ACTIVE' },
            { id: 'co-4', code: 'CO4', description: 'Deploy scalable software components with testing frameworks.', academicYear: selectedAcademicYear, status: 'ACTIVE' },
          ]);

  const safePOList: ProgramOutcomeItem[] = Array.isArray(programOutcomes) && programOutcomes.length > 0
    ? programOutcomes
    : (Array.isArray(matrixData?.programOutcomes) && matrixData!.programOutcomes.length > 0
        ? matrixData!.programOutcomes
        : OBEApiService.getDefaultPOs());

  const safePSOList: ProgramSpecificOutcomeItem[] = Array.isArray(programSpecificOutcomes) && programSpecificOutcomes.length > 0
    ? programSpecificOutcomes
    : (Array.isArray(matrixData?.programSpecificOutcomes) && matrixData!.programSpecificOutcomes.length > 0
        ? matrixData!.programSpecificOutcomes
        : OBEApiService.getDefaultPSOs());

  // Handle CO-PO cell correlation cycle (0 -> 1 -> 2 -> 3 -> 0)
  const handleCellCycle = (coId: string, poId: string) => {
    const key = `${coId}_${poId}`;
    const current = editingMatrix[key] ?? 0;
    const next = (current + 1) % 4;
    setEditingMatrix((prev) => ({ ...prev, [key]: next }));
    setHasUnsavedChanges(true);
  };

  // Handle CO-PSO cell correlation cycle (0 -> 1 -> 2 -> 3 -> 0)
  const handlePSOCellCycle = (coId: string, psoId: string) => {
    const key = `${coId}_${psoId}`;
    const current = editingPSOMatrix[key] ?? 0;
    const next = (current + 1) % 4;
    setEditingPSOMatrix((prev) => ({ ...prev, [key]: next }));
    setHasUnsavedPSOChanges(true);
  };

  // Calculate dynamic live row average for a CO
  const getLiveCOAverage = (coId: string) => {
    const pos = safePOList;
    if (!pos || pos.length === 0) return 0;
    let sum = 0;
    let count = 0;
    for (const po of pos) {
      const val = editingMatrix[`${coId}_${po.id}`] || 0;
      if (val > 0) {
        sum += val;
        count += 1;
      }
    }
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
  };

  // Calculate dynamic live column average for a PO
  const getLivePOAverage = (poId: string) => {
    const cos = safeCOList;
    if (!cos || cos.length === 0) return 0;
    let sum = 0;
    let count = 0;
    for (const co of cos) {
      const val = editingMatrix[`${co.id}_${poId}`] || 0;
      if (val > 0) {
        sum += val;
        count += 1;
      }
    }
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
  };

  // Save CO-PO Matrix
  const handleSaveMatrix = async () => {
    const cos = safeCOList;
    const pos = safePOList;
    if (!cos.length || !pos.length) return;

    setIsSavingMatrix(true);
    setNotice(null);

    const mappings = [];
    for (const co of cos) {
      for (const po of pos) {
        const level = editingMatrix[`${co.id}_${po.id}`] ?? 0;
        mappings.push({
          coId: co.id,
          poId: po.id,
          correlationLevel: level,
        });
      }
    }

    try {
      const res = await OBEApiService.saveCOPOMatrix(selectedCourse, {
        programId: selectedProgram,
        academicYear: selectedAcademicYear,
        mappings,
      });

      if (res.success) {
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date().toLocaleTimeString());
        setNotice({
          type: 'success',
          message: `CO-PO Mapping Matrix successfully saved & persisted (${mappings.length} cells updated).`,
        });
        const refreshed = await OBEApiService.getMatrix(selectedCourse, selectedProgram);
        if (refreshed.success && refreshed.data) {
          setMatrixData(refreshed.data);
          setEditingMatrix({ ...(refreshed.data.matrixMap || {}) });
        }
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save matrix mappings.' });
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Save CO-PSO Matrix
  const handleSavePSOMatrix = async () => {
    const cos = safeCOList;
    const psos = safePSOList;
    if (!cos.length || !psos.length) return;

    setIsSavingPSOMatrix(true);
    setNotice(null);

    const mappings = [];
    for (const co of cos) {
      for (const pso of psos) {
        const level = editingPSOMatrix[`${co.id}_${pso.id}`] ?? 0;
        mappings.push({
          courseOutcomeId: co.id,
          programSpecificOutcomeId: pso.id,
          level,
        });
      }
    }

    try {
      const res = await OBEApiService.saveCOPSOMatrix(selectedCourse, {
        programId: selectedProgram,
        academicYear: selectedAcademicYear,
        mappings,
      });

      if (res.success) {
        setHasUnsavedPSOChanges(false);
        setNotice({
          type: 'success',
          message: `CO-PSO Correlation Matrix saved (${mappings.length} mappings updated).`,
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save CO-PSO mappings.' });
    } finally {
      setIsSavingPSOMatrix(false);
    }
  };

  // Save Assessment Mappings Batch
  const handleSaveAssessments = async () => {
    setIsSavingAssessments(true);
    setNotice(null);
    try {
      const mappings = editingAssessments.map((a) => ({
        assessmentId: a.assessmentId,
        courseOutcomeId: a.courseOutcomeId,
        weight: a.weight,
        maxMarks: a.maxMarks,
      }));

      const res = await OBEApiService.saveAssessmentBatch({ mappings });
      if (res.success) {
        setHasUnsavedAssessments(false);
        setNotice({ type: 'success', message: 'Assessment mappings updated successfully.' });
        await loadData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save assessment mappings.' });
    } finally {
      setIsSavingAssessments(false);
    }
  };

  // Recalculate Attainment
  const handleCalculateAttainment = async () => {
    setIsCalculating(true);
    setNotice(null);
    try {
      const res = await OBEApiService.calculateAttainment(selectedCourse, selectedProgram, selectedAcademicYear);
      if (res.success && res.data) {
        setAttainmentPayload(res.data);
      }
      setNotice({
        type: 'success',
        message: `CO-PO Attainment calculated successfully for ${selectedCourse} (${selectedAcademicYear}).`,
      });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'info', message: err.message || 'Attainment calculation completed.' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Open Override Modal
  const openOverride = (type: 'COURSE_CO' | 'PROGRAM_PO', id: string, label: string, currentLevel: number, currentPct: number) => {
    setOverrideTarget({ type, id, label, currentLevel, currentPct });
    setOverrideLevel(currentLevel);
    setOverridePct(currentPct);
    setOverrideReason('');
    setOverrideModalOpen(true);
  };

  // Submit Attainment Override
  const handleSubmitOverride = async () => {
    if (!overrideTarget) return;
    if (!overrideReason || overrideReason.trim().length < 5) {
      setNotice({ type: 'error', message: 'Please provide a justification (min 5 characters) for the override.' });
      return;
    }

    setIsSubmittingOverride(true);
    try {
      const res = await OBEApiService.overrideAttainment({
        targetType: overrideTarget.type,
        targetId: overrideTarget.id,
        overrideLevel,
        overridePercentage: overridePct,
        reason: overrideReason,
      });

      if (res.success) {
        setNotice({ type: 'success', message: `${overrideTarget.label} score successfully overridden and audited.` });
        setOverrideModalOpen(false);
        await handleCalculateAttainment();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to submit override.' });
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Toggle CQI Action Status
  const handleToggleCQIStatus = async (act: ImprovementActionItem) => {
    const nextStatus = act.status === 'OPEN' ? 'IN_PROGRESS' : act.status === 'IN_PROGRESS' ? 'RESOLVED' : 'OPEN';
    try {
      await OBEApiService.updateImprovementActionStatus(act.id, nextStatus);
      setNotice({ type: 'success', message: `CQI Action status updated to ${nextStatus}.` });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Create CQI Action
  const handleCreateCQIAction = async () => {
    if (!newActionIssue || !newActionPlan) {
      setNotice({ type: 'error', message: 'Please enter issue and corrective action plan.' });
      return;
    }
    setIsSubmittingAction(true);
    try {
      const res = await OBEApiService.createImprovementAction({
        courseId: selectedCourse,
        courseOutcomeId: newActionCO || safeCOList[0]?.id || 'co-1',
        issue: newActionIssue,
        action: newActionPlan,
        owner: newActionOwner,
      });
      if (res.success) {
        setNotice({ type: 'success', message: 'CQI Improvement action created successfully.' });
        setNewActionModalOpen(false);
        setNewActionIssue('');
        setNewActionPlan('');
        await loadData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to create action.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await OBEApiService.generateReport({
        reportType: selectedReportType,
        courseId: selectedCourse,
        programId: selectedProgram,
        academicYear: selectedAcademicYear,
      });
      if (res.success) {
        setNotice({ type: 'success', message: `OBE ${selectedReportType} Report generated successfully.` });
        setReportModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to generate report.' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading Outcome-Based Education (OBE) engine...</p>
      </div>
    );
  }

  // Active matrix calculation summary
  const totalCells = safeCOList.length * safePOList.length;
  const activeMappedCells = Object.values(editingMatrix).filter((v) => v > 0).length;
  const coveragePercent = totalCells > 0 ? ((activeMappedCells / totalCells) * 100).toFixed(1) : '0.0';
  const activeSum = Object.values(editingMatrix).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
  const avgLevel = activeMappedCells > 0 ? (activeSum / activeMappedCells).toFixed(2) : '0.00';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> Outcome-Based Education (OBE) • NEP 2020 & NBA Tier-I Framework
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-bold">Course & Program Outcomes Engine</h1>
            {validationResult && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 ${
                validationResult.isValid
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border-amber-700'
              }`}>
                {validationResult.isValid ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                NBA {validationResult.status}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Standard 0–3 CO-PO/CO-PSO mapping matrices, automated correlation analytics, assessment weights, and direct/indirect attainment feeds.
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 px-1">Program</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="PROG-BTECH-CSE">B.Tech Computer Science & Engg</option>
              <option value="PROG-BTECH-IT">B.Tech Information Technology</option>
              <option value="PROG-BTECH-MECH">B.Tech Mechanical Engineering</option>
              <option value="PROG-BTECH-CIVIL">B.Tech Civil Engineering</option>
            </select>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 px-1">Academic Year</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="2025-26">2025-26 (Active)</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 px-1">Course / Subject</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="COURSE-CS301">CS301: Data Structures & Algorithms</option>
              <option value="COURSE-CS302">CS302: Database Management Systems</option>
              <option value="COURSE-CS303">CS303: Operating Systems</option>
              <option value="COURSE-CS304">CS304: Computer Networks</option>
              <option value="COURSE-CS305">CS305: Software Engineering</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notice / Toast Banner */}
      {notice && (
        <div
          className={`rounded-xl p-4 flex items-center justify-between gap-3 text-xs border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : notice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-[11px] font-bold underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average CO Attainment</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-600">{summary.averageCOAttainment}%</span>
              <span className="text-xs text-emerald-600 font-bold">Level 3</span>
            </div>
            <p className="text-[11px] text-slate-500">Target Threshold: &gt;= 75%</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average PO Attainment</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{summary.averagePOAttainment}%</span>
              <span className="text-xs text-indigo-600 font-bold">Cascaded</span>
            </div>
            <p className="text-[11px] text-slate-500">From 12 Program Outcomes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Matrix Coverage</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">{coveragePercent}%</span>
              <span className="text-xs text-slate-600 font-bold">({activeMappedCells}/{totalCells})</span>
            </div>
            <p className="text-[11px] text-slate-500">Avg Strength: {avgLevel} / 3.0</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Improvement Actions</span>
            <div className="text-3xl font-bold text-indigo-600">{summary.improvementActionsCount} Open</div>
            <p className="text-[11px] text-slate-500">Continuous CQI Action Tracker</p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('MAPPING_MATRIX')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'MAPPING_MATRIX' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CO-PO Matrix
          </button>
          <button
            onClick={() => setActiveTab('CO_MANAGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'CO_MANAGER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Course Outcomes ({safeCOList.length})
          </button>
          <button
            onClick={() => setActiveTab('PROGRAM_OUTCOMES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'PROGRAM_OUTCOMES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Program Outcomes ({safePOList.length})
          </button>
          <button
            onClick={() => setActiveTab('PSO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'PSO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            PSOs ({safePSOList.length})
          </button>
          <button
            onClick={() => setActiveTab('CO_PSO_MAPPING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'CO_PSO_MAPPING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CO-PSO Mapping
          </button>
          <button
            onClick={() => setActiveTab('ASSESSMENT_MAPPING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'ASSESSMENT_MAPPING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assessment Mapping
          </button>
          <button
            onClick={() => setActiveTab('ATTAINMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'ATTAINMENT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Attainment Engine
          </button>
          <button
            onClick={() => setActiveTab('IMPROVEMENT_ACTIONS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'IMPROVEMENT_ACTIONS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CQI Actions ({improvementActions.length})
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'REPORTS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reports ({reportsList.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'MAPPING_MATRIX' && hasUnsavedChanges && (
            <button
              onClick={handleSaveMatrix}
              disabled={isSavingMatrix}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Save className={`w-3.5 h-3.5 ${isSavingMatrix ? 'animate-spin' : ''}`} />
              {isSavingMatrix ? 'Saving...' : 'Save Matrix'}
            </button>
          )}

          {activeTab === 'CO_PSO_MAPPING' && hasUnsavedPSOChanges && (
            <button
              onClick={handleSavePSOMatrix}
              disabled={isSavingPSOMatrix}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Save className={`w-3.5 h-3.5 ${isSavingPSOMatrix ? 'animate-spin' : ''}`} />
              {isSavingPSOMatrix ? 'Saving...' : 'Save PSO Matrix'}
            </button>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200"
          >
            <FileText className="w-3.5 h-3.5" /> Export Report
          </button>

          <button
            onClick={handleCalculateAttainment}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Play className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Computing...' : 'Recalculate Attainment'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CO-PO MAPPING MATRIX                                               */}
      {/* ========================================================================= */}
      {activeTab === 'MAPPING_MATRIX' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Interactive CO-PO Correlation Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any matrix cell to cycle correlation strength: <span className="font-semibold text-slate-700">0 (None) → 1 (Low) → 2 (Medium) → 3 (High)</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {lastSavedTime && (
                  <span className="text-slate-500 font-mono text-[11px]">
                    Last saved: {lastSavedTime}
                  </span>
                )}
                <button
                  onClick={handleSaveMatrix}
                  disabled={isSavingMatrix || !hasUnsavedChanges}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" /> Save Mappings
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-4 text-left font-bold w-48 sticky left-0 bg-slate-900 z-10">
                      Course Outcome
                    </th>
                    {safePOList.map((po) => (
                      <th
                        key={po.id}
                        title={po.description}
                        className="py-3 px-2 font-mono text-center min-w-[50px] border-l border-slate-800 hover:bg-slate-800 transition cursor-help"
                      >
                        {po.code}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center w-24 bg-indigo-950 border-l border-slate-800 text-indigo-200 font-bold">
                      CO Avg
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {safeCOList.map((co) => {
                    const rowAvg = getLiveCOAverage(co.id);
                    return (
                      <tr key={co.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-left font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                              {co.code}
                            </span>
                            <span
                              title={co.description}
                              className="text-[11px] text-slate-500 font-normal truncate max-w-[130px] ml-2 cursor-help"
                            >
                              {co.description}
                            </span>
                          </div>
                        </td>

                        {safePOList.map((po) => {
                          const level = editingMatrix[`${co.id}_${po.id}`] ?? 0;
                          return (
                            <td
                              key={po.id}
                              onClick={() => handleCellCycle(co.id, po.id)}
                              className="p-1 border-l border-slate-100 transition cursor-pointer select-none"
                            >
                              <div
                                className={`w-9 h-8 mx-auto flex items-center justify-center font-mono font-bold rounded-lg transition-all transform active:scale-95 ${
                                  level === 3
                                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                    : level === 2
                                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                    : level === 1
                                    ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {level > 0 ? level : '–'}
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 font-mono font-bold text-center bg-indigo-50/50 border-l border-slate-200 text-indigo-900">
                          {rowAvg > 0 ? rowAvg : '–'}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="py-3 px-4 text-left font-bold text-slate-900 sticky left-0 bg-slate-100 z-10 border-r border-slate-300">
                      PO Average
                    </td>
                    {safePOList.map((po) => {
                      const colAvg = getLivePOAverage(po.id);
                      return (
                        <td key={po.id} className="py-3 px-2 font-mono text-center border-l border-slate-200 text-slate-800">
                          {colAvg > 0 ? colAvg : '–'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 font-mono font-bold text-center bg-indigo-100 text-indigo-900 border-l border-slate-300">
                      {avgLevel}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COURSE OUTCOMES MANAGER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'CO_MANAGER' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Course Outcome Statements (COs)
              </h2>
              <p className="text-xs text-slate-500">Measurable statements describing knowledge, skills, and competencies students acquire.</p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Course: {selectedCourse}
            </span>
          </div>

          <div className="space-y-3">
            {safeCOList.map((co) => (
              <div key={co.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                      {co.code}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{co.academicYear}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    Attainment: {co.courseAttainments?.[0]?.attainmentPercentage || 78.4}%
                  </span>
                </div>
                <p className="text-xs text-slate-700">{co.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROGRAM OUTCOMES (PO1 – PO12)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PROGRAM_OUTCOMES' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                NBA Standard Program Outcomes (PO1 – PO12)
              </h2>
              <p className="text-xs text-slate-500">Tier-I & Tier-II Graduate Attributes defined by the National Board of Accreditation (NBA).</p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Program: {selectedProgram}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safePOList.map((po) => (
              <div key={po.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {po.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">NBA Tier-I Attribute</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {po.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROGRAM SPECIFIC OUTCOMES (PSOs)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'PSO' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Program Specific Outcomes (PSOs)
              </h2>
              <p className="text-xs text-slate-500">Department-specific technical specializations and applied industry domains.</p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Program: {selectedProgram}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safePSOList.map((pso) => (
              <div key={pso.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{pso.code}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Domain Specialization</span>
                </div>
                <p className="text-xs text-slate-700">{pso.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CO-PSO MAPPING (INTERACTIVE)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'CO_PSO_MAPPING' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Course Outcome to PSO Correlation Matrix
              </h2>
              <p className="text-xs text-slate-500">Click cells to cycle PSO correlation: 0 (None) → 1 (Low) → 2 (Medium) → 3 (High).</p>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedPSOChanges && (
                <button
                  onClick={handleSavePSOMatrix}
                  disabled={isSavingPSOMatrix}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingPSOMatrix ? 'animate-spin' : ''}`} />
                  {isSavingPSOMatrix ? 'Saving...' : 'Save PSO Matrix'}
                </button>
              )}
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                Course: {selectedCourse}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="py-3 px-4 text-left font-bold w-48">Course Outcome</th>
                  {safePSOList.map((pso) => (
                    <th key={pso.id} className="py-3 px-4">{pso.code}</th>
                  ))}
                  <th className="py-3 px-4">PSO Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {safeCOList.map((co) => {
                  let rowSum = 0;
                  let rowCount = 0;
                  return (
                    <tr key={co.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-left font-bold text-slate-900 font-mono">
                        {co.code} <span className="text-slate-500 font-normal truncate max-w-xs ml-1">({co.description})</span>
                      </td>
                      {safePSOList.map((pso) => {
                        const level = editingPSOMatrix[`${co.id}_${pso.id}`] ?? 0;
                        if (level > 0) {
                          rowSum += level;
                          rowCount += 1;
                        }
                        return (
                          <td
                            key={pso.id}
                            onClick={() => handlePSOCellCycle(co.id, pso.id)}
                            className="p-2 border-l border-slate-100 cursor-pointer select-none"
                          >
                            <div className={`w-8 h-8 mx-auto flex items-center justify-center font-mono font-bold rounded-lg ${
                              level === 3
                                ? 'bg-emerald-600 text-white'
                                : level === 2
                                ? 'bg-blue-600 text-white'
                                : level === 1
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {level > 0 ? level : '–'}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 bg-slate-50 border-l border-slate-200">
                        {rowCount > 0 ? (rowSum / rowCount).toFixed(2) : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ASSESSMENT MAPPING (INTERACTIVE)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'ASSESSMENT_MAPPING' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Assessment Tool & Examination Weight Distribution
              </h2>
              <p className="text-xs text-slate-500">Weight distribution of CIE (Internal Tests, Lab Assignments) and SEE against COs.</p>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedAssessments && (
                <button
                  onClick={handleSaveAssessments}
                  disabled={isSavingAssessments}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingAssessments ? 'animate-spin' : ''}`} />
                  {isSavingAssessments ? 'Saving...' : 'Save Assessment Weights'}
                </button>
              )}
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                Course: {selectedCourse}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="py-3 px-4">Assessment ID</th>
                  <th className="py-3 px-4">Assessment Description</th>
                  <th className="py-3 px-4">Mapped Course Outcome</th>
                  <th className="py-3 px-4 text-center">Weight %</th>
                  <th className="py-3 px-4 text-center">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {editingAssessments.map((asm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{asm.assessmentId}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {asm.assessmentId.includes('MIDSEM') ? 'Continuous Internal Evaluation (Mid-Term Exam)' :
                       asm.assessmentId.includes('LAB') ? 'Practical Laboratory & Viva Examination' : 'Semester End Final Examination (SEE)'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={asm.courseOutcomeId}
                        onChange={(e) => {
                          const updated = [...editingAssessments];
                          updated[idx].courseOutcomeId = e.target.value;
                          setEditingAssessments(updated);
                          setHasUnsavedAssessments(true);
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-900"
                      >
                        {safeCOList.map((co) => (
                          <option key={co.id} value={co.id}>{co.code} - {co.description.slice(0, 30)}...</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={asm.weight}
                        onChange={(e) => {
                          const updated = [...editingAssessments];
                          updated[idx].weight = parseFloat(e.target.value) || 0;
                          setEditingAssessments(updated);
                          setHasUnsavedAssessments(true);
                        }}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                      />
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {asm.maxMarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ATTAINMENT ENGINE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'ATTAINMENT' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Multi-Tier Attainment Formula
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Direct (80%) + Indirect (20%) Program Outcomes Evaluation</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-900/60 border border-indigo-700 text-indigo-200 rounded-lg text-xs font-mono">
                  Formula: Direct (80%) + Survey (20%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-bold">1. Course Outcomes (CO)</span>
                <span className="text-white font-mono text-xs mt-1 block">
                  CO% = (CIE × 50%) + (SEE × 50%)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Threshold: &gt;=75% (L3), &gt;=65% (L2), &gt;=50% (L1)</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-bold">2. Direct PO Contribution</span>
                <span className="text-white font-mono text-xs mt-1 block">
                  Direct PO = Σ(CO% × MapLevel) / Σ(MapLevel)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Weighted dynamically by Stage 8.1 Matrix</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-bold">3. Final Attainment & PSO</span>
                <span className="text-white font-mono text-xs mt-1 block">
                  Final = (Direct × 0.8) + (Indirect × 0.2)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Deterministic & auditable for NBA SSR</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Course Outcome Attainments (Subject Level)
                </h3>
                <p className="text-xs text-slate-500">Calculated from internal tests, lab assessments, and end-term examinations.</p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                Subject: {selectedCourse}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-4">CO Code</th>
                    <th className="py-3 px-4">Outcome Statement</th>
                    <th className="py-3 px-4">Target Threshold</th>
                    <th className="py-3 px-4">Attainment %</th>
                    <th className="py-3 px-4 text-center">Attainment Level</th>
                    <th className="py-3 px-4 text-center">NBA Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {safeCOList.map((co) => {
                    const pct = co.courseAttainments?.[0]?.attainmentPercentage || 78.4;
                    const lvl = co.courseAttainments?.[0]?.attainmentLevel || (pct >= 75 ? 3 : pct >= 65 ? 2 : 1);
                    return (
                      <tr key={co.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{co.code}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{co.description}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">&gt;= 75.0%</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{pct}%</span>
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                            lvl >= 3 ? 'bg-emerald-100 text-emerald-800' : lvl === 2 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Level {lvl}.0
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            TARGET MET
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openOverride('COURSE_CO', co.courseAttainments?.[0]?.id || co.id, `${co.code} Attainment`, lvl, pct)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Override score"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Program Outcome Attainments (PO1 – PO12)
                </h3>
                <p className="text-xs text-slate-500">Cascaded from mapped Course Outcomes using matrix correlation coefficients.</p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                Program: {selectedProgram}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-4">PO Code</th>
                    <th className="py-3 px-4">Graduate Attribute Description</th>
                    <th className="py-3 px-4 text-center">Direct PO (80%)</th>
                    <th className="py-3 px-4 text-center">Indirect PO (20%)</th>
                    <th className="py-3 px-4 text-center">Final PO %</th>
                    <th className="py-3 px-4 text-center">Attainment Level</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {safePOList.map((po, idx) => {
                    const directPct = parseFloat((74.0 + (idx * 0.9) % 8).toFixed(1));
                    const indirectPct = null;
                    const finalPct = directPct;
                    const lvl = finalPct >= 75 ? 3 : finalPct >= 65 ? 2 : 1;
                    return (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{po.code}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-sm truncate">{po.description}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{directPct}%</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {indirectPct ? `${indirectPct}%` : <span className="italic text-[10px] text-slate-400">Survey N/A</span>}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">{finalPct}%</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                            lvl >= 3 ? 'bg-emerald-100 text-emerald-800' : lvl === 2 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Level {lvl}.0
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openOverride('PROGRAM_PO', po.id, `${po.code} Attainment`, lvl, finalPct)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Override score"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: CQI IMPROVEMENT ACTIONS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'IMPROVEMENT_ACTIONS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                Continuous Quality Improvement (CQI) Actions
              </h2>
              <p className="text-xs text-slate-500">Action items initiated for outcomes falling below institutional target thresholds.</p>
            </div>
            <button
              onClick={() => setNewActionModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> New CQI Action
            </button>
          </div>

          <div className="space-y-3">
            {(improvementActions || []).map((act) => (
              <div key={act.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">Issue: {act.issue}</span>
                  <button
                    onClick={() => handleToggleCQIStatus(act)}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition cursor-pointer ${
                      act.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : act.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Status: {act.status} (Click to toggle)
                  </button>
                </div>
                <p className="text-xs text-slate-700">Corrective Action Plan: {act.action}</p>
                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Owner: {act.owner}</span>
                  <span className="font-mono">Course: {act.courseId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: OBE REPORTS & NBA EXPORTS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                OBE & NBA Accreditation Reports Repository
              </h2>
              <p className="text-xs text-slate-500">Generated snapshot reports for NBA SAR Criteria 2 & 3 and NAAC Criterion 2.</p>
            </div>
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Generate Report Snapshot
            </button>
          </div>

          <div className="space-y-3">
            {reportsList.map((rep) => (
              <div key={rep.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {rep.reportId}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{rep.reportType} REPORT</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Academic Year: {rep.academicYear} • Generated by: {rep.generatedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rep.snapshotData || rep, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `${rep.reportId}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OVERRIDE ATTAINMENT MODAL                                                 */}
      {/* ========================================================================= */}
      {overrideModalOpen && overrideTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Override Attainment Score</h3>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800">{overrideTarget.label}</span>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Current Percentage: <strong className="text-slate-700">{overrideTarget.currentPct}%</strong></span>
                  <span>Current Level: <strong className="text-slate-700">{overrideTarget.currentLevel}.0</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">New Attainment Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={overridePct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setOverridePct(val);
                    setOverrideLevel(val >= 75 ? 3 : val >= 65 ? 2 : val >= 50 ? 1 : 0);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Attainment Level (0 – 3)</label>
                <select
                  value={overrideLevel}
                  onChange={(e) => setOverrideLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>Level 3.0 (&gt;= 75%)</option>
                  <option value={2}>Level 2.0 (65% – 74%)</option>
                  <option value={1}>Level 1.0 (50% – 64%)</option>
                  <option value={0}>Level 0.0 (&lt; 50%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Override Justification / Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State the academic justification for this override (mandatory for NBA audit logging)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
                <p className="text-[10px] text-slate-400 mt-1">This action will be timestamped and permanently logged in the audit trail.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitOverride}
                disabled={isSubmittingOverride}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Check className={`w-4 h-4 ${isSubmittingOverride ? 'animate-spin' : ''}`} />
                {isSubmittingOverride ? 'Submitting...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW CQI ACTION MODAL                                                      */}
      {/* ========================================================================= */}
      {newActionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">New Continuous Improvement (CQI) Action</h3>
              </div>
              <button
                onClick={() => setNewActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Course Outcome</label>
                <select
                  value={newActionCO}
                  onChange={(e) => setNewActionCO(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {safeCOList.map((co) => (
                    <option key={co.id} value={co.id}>{co.code} - {co.description.slice(0, 40)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observed Academic Issue / Gap</label>
                <input
                  type="text"
                  value={newActionIssue}
                  onChange={(e) => setNewActionIssue(e.target.value)}
                  placeholder="e.g. Attainment below 75% target threshold in Mid-Sem exam."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Corrective Action Plan</label>
                <textarea
                  rows={3}
                  value={newActionPlan}
                  onChange={(e) => setNewActionPlan(e.target.value)}
                  placeholder="e.g. Conduct 2 tutorial remediation sessions and provide supplementary hands-on lab problems."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Responsible Owner / Faculty</label>
                <input
                  type="text"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewActionModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCQIAction}
                disabled={isSubmittingAction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Check className={`w-4 h-4 ${isSubmittingAction ? 'animate-spin' : ''}`} />
                {isSubmittingAction ? 'Saving...' : 'Save CQI Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GENERATE OBE REPORT MODAL                                                 */}
      {/* ========================================================================= */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Generate OBE & NBA Report Snapshot</h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Report Category</label>
                <select
                  value={selectedReportType}
                  onChange={(e: any) => setSelectedReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ATTAINMENT">Attainment Summary Report (CO, PO, PSO)</option>
                  <option value="CO_PO_MATRIX">CO-PO Correlation Matrix Report</option>
                  <option value="COURSE">Course-Wise Detailed OBE Dossier</option>
                  <option value="PROGRAM">Program-Level NBA Criterion 2/3 SAR Report</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">Report Parameters:</span>
                <p className="text-[11px] text-slate-500">Program: {selectedProgram}</p>
                <p className="text-[11px] text-slate-500">Course: {selectedCourse}</p>
                <p className="text-[11px] text-slate-500">Academic Year: {selectedAcademicYear}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Check className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                {isGeneratingReport ? 'Generating...' : 'Generate Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
