import React from 'react';
import { BookOpen, CheckCircle2, Clock, FileText, Download, ExternalLink } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { lmsCourseService } from '../services/lmsCourseService';
import { CourseSyllabusSummary, StudyResourceItem } from '../types';

interface SyllabusCoverageTrackerProps {
  courseCode?: string;
}

export const SyllabusCoverageTracker: React.FC<SyllabusCoverageTrackerProps> = ({ courseCode = 'CS401' }) => {
  const syllabus: CourseSyllabusSummary = lmsCourseService.getCourseSyllabusSummary(courseCode);
  const resources: StudyResourceItem[] = lmsCourseService.getStudyResources(courseCode);

  return (
    <div className="space-y-6">
      {/* Course Summary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {syllabus.courseCode}
              </span>
              <span className="text-xs text-slate-500">Semester {syllabus.semester}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{syllabus.courseName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Faculty In-Charge: {syllabus.facultyName}</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Overall Syllabus Coverage</span>
              <span className="text-xl font-bold text-indigo-700">{syllabus.overallCompletionPercentage}%</span>
            </div>
            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${syllabus.overallCompletionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unit Progression Grid */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Unit-wise Curriculum & Learning Outcomes
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {syllabus.units.map(unit => (
            <div key={unit.unitId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Unit {unit.unitNumber}
                  </span>
                  <h5 className="font-semibold text-slate-900 text-sm">{unit.unitTitle}</h5>
                </div>
                <Badge variant={unit.completionPercentage === 100 ? 'success' : 'navy'}>
                  {unit.completionPercentage}% Complete
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${unit.completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Planned: {unit.totalPlannedHours} Hours</span>
                <span>Completed: {unit.completedHours} Hours</span>
                <span>Topics: {unit.completedTopicsCount}/{unit.topicsCount}</span>
              </div>

              <div className="border-t border-slate-100 pt-2.5">
                <span className="text-[11px] font-medium text-slate-600 block mb-1">Key Learning Outcomes:</span>
                <ul className="space-y-1">
                  {unit.learningOutcomes.map((outcome, oIdx) => (
                    <li key={oIdx} className="text-xs text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Materials Abstraction */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Authorized Course Study Materials & Digital Handouts
        </h4>

        <div className="divide-y divide-slate-100">
          {resources.map(res => (
            <div key={res.resourceId} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{res.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Uploaded by {res.authorName} • {res.uploadDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="purple">{res.resourceType.replace('_', ' ')}</Badge>
                <a
                  href={res.safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Open Resource"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
