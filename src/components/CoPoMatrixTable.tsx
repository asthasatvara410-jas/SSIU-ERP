import React, { useState, useEffect } from 'react';
import { Layers, Award, Info, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface ProgramOutcomeHeader {
  id: string;
  code: string;
  description: string;
}

export interface CourseOutcomeRow {
  id: string;
  code: string;
  description: string;
  subjectCode?: string;
  mappings: Record<string, number>; // PO Code -> 0 (unmapped), 1 (Low), 2 (Medium), 3 (High)
}

interface CoPoMatrixTableProps {
  courseCode?: string;
  courseTitle?: string;
  className?: string;
}

/**
 * SSIU ERP — Outcome-Based Education (OBE) CO-PO Matrix Table
 * File: src/components/CoPoMatrixTable.tsx
 *
 * Displays the 2D articulation matrix mapping Course Outcomes (COs)
 * to Program Outcomes (POs) with standardized color-coded correlation levels:
 * - Level 3: High Correlation (Dark Green)
 * - Level 2: Medium Correlation (Light Green)
 * - Level 1: Low Correlation (Yellow / Amber)
 * - Level 0: Unmapped (Gray Dash)
 */
export const CoPoMatrixTable: React.FC<CoPoMatrixTableProps> = ({
  courseCode = 'CS801',
  courseTitle = 'Advanced Cloud Architecture & Distributed Systems',
  className = '',
}) => {
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcomeHeader[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcomeRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMatrixData = async () => {
      setIsLoading(true);
      try {
        // Simulate async retrieval from backend obeService / API
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockPOs: ProgramOutcomeHeader[] = [
          { id: 'po-1', code: 'PO1', description: 'Engineering Knowledge: Apply knowledge of mathematics and science.' },
          { id: 'po-2', code: 'PO2', description: 'Problem Analysis: Identify, formulate, and analyze complex engineering problems.' },
          { id: 'po-3', code: 'PO3', description: 'Design/Development: Design solutions for public health, safety, and cultural needs.' },
          { id: 'po-4', code: 'PO4', description: 'Investigation: Use research-based knowledge and methods for complex analysis.' },
          { id: 'po-5', code: 'PO5', description: 'Modern Tool Usage: Create and apply appropriate engineering and IT tools.' },
          { id: 'po-6', code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by contextual knowledge.' },
        ];

        const mockCOs: CourseOutcomeRow[] = [
          {
            id: 'co-1',
            code: 'CO1',
            description: 'Understand and apply fundamentals of distributed cloud systems and multi-tenant architectures.',
            subjectCode: courseCode,
            mappings: { PO1: 3, PO2: 2, PO3: 0, PO4: 1, PO5: 2, PO6: 0 },
          },
          {
            id: 'co-2',
            code: 'CO2',
            description: 'Design and deploy scalable microservices using cloud-native orchestration tools.',
            subjectCode: courseCode,
            mappings: { PO1: 2, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 1 },
          },
          {
            id: 'co-3',
            code: 'CO3',
            description: 'Analyze security protocols, zero-trust authentication, and compliance in cloud deployments.',
            subjectCode: courseCode,
            mappings: { PO1: 2, PO2: 2, PO3: 1, PO4: 3, PO5: 2, PO6: 2 },
          },
          {
            id: 'co-4',
            code: 'CO4',
            description: 'Implement distributed storage solutions, cache layers, and disaster recovery strategies.',
            subjectCode: courseCode,
            mappings: { PO1: 3, PO2: 2, PO3: 3, PO4: 2, PO5: 3, PO6: 0 },
          },
          {
            id: 'co-5',
            code: 'CO5',
            description: 'Evaluate cost, latency, and performance trade-offs in hybrid cloud infrastructure.',
            subjectCode: courseCode,
            mappings: { PO1: 1, PO2: 3, PO3: 2, PO4: 2, PO5: 2, PO6: 1 },
          },
        ];

        setProgramOutcomes(mockPOs);
        setCourseOutcomes(mockCOs);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatrixData();
  }, [courseCode]);

  /**
   * Helper function to render color-coded correlation level badge
   */
  const renderLevelBadge = (level: number) => {
    switch (level) {
      case 3:
        return (
          <span
            title="High Correlation (Level 3)"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm"
          >
            3
          </span>
        );
      case 2:
        return (
          <span
            title="Medium Correlation (Level 2)"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-sm"
          >
            2
          </span>
        );
      case 1:
        return (
          <span
            title="Low Correlation (Level 1)"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 shadow-sm"
          >
            1
          </span>
        );
      default:
        return (
          <span
            title="No Correlation (Unmapped)"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200"
          >
            —
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[280px] space-y-3">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading CO-PO Articulation Matrix...</p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Container */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Outcome-Based Education (OBE)
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            CO-PO Articulation Matrix: {courseCode}
          </h3>
          <p className="text-xs text-indigo-200/80 mt-0.5">{courseTitle}</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>NBA SAR Criterion 3 Compliant</span>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-600 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          Correlation Scale:
        </span>
        <div className="flex flex-wrap items-center gap-3 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              3
            </span>
            <span className="text-slate-700">Level 3 (High: 67–100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-300">
              2
            </span>
            <span className="text-slate-700">Level 2 (Medium: 34–66%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center border border-amber-300">
              1
            </span>
            <span className="text-slate-700">Level 1 (Low: 1–33%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-slate-100 text-slate-400 font-medium text-[10px] flex items-center justify-center border border-slate-200">
              —
            </span>
            <span className="text-slate-500">Unmapped (0)</span>
          </div>
        </div>
      </div>

      {/* Responsive Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4 border-r border-slate-200 min-w-[100px] w-28">CO Code</th>
              <th className="p-4 border-r border-slate-200 min-w-[260px]">Course Outcome Description</th>
              {programOutcomes.map((po) => (
                <th
                  key={po.id}
                  title={po.description}
                  className="p-3 text-center border-r last:border-r-0 border-slate-200 min-w-[70px] w-20 cursor-help group"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-indigo-950 font-bold">{po.code}</span>
                    <span className="text-[10px] font-normal text-slate-400 group-hover:text-indigo-600 transition">
                      Info
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {courseOutcomes.map((co) => (
              <tr key={co.id} className="hover:bg-slate-50/80 transition duration-150">
                <td className="p-4 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{co.code}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-700 font-normal leading-relaxed border-r border-slate-200">
                  {co.description}
                </td>
                {programOutcomes.map((po) => {
                  const level = co.mappings[po.code] ?? 0;
                  return (
                    <td
                      key={po.id}
                      className="p-3 text-center border-r last:border-r-0 border-slate-200 align-middle"
                    >
                      {renderLevelBadge(level)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>Hover over PO column headers for Graduate Attribute definitions.</span>
        <span className="font-mono text-slate-400">Version: v1.0 • SSIU OBE Matrix Engine</span>
      </div>
    </div>
  );
};

export default CoPoMatrixTable;
