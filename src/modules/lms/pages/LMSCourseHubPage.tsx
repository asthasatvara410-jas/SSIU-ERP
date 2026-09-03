import React, { useState } from 'react';
import { BookOpen, HelpCircle, FileText, Layers } from 'lucide-react';
import { SyllabusCoverageTracker } from '../components/SyllabusCoverageTracker';
import { OnlineQuizAssessmentDesk } from '../components/OnlineQuizAssessmentDesk';

export const LMSCourseHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SYLLABUS_MATERIALS' | 'ONLINE_ASSESSMENT'>('SYLLABUS_MATERIALS');
  const [selectedCourse, setSelectedCourse] = useState<string>('CS401');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            LMS & Digital Course Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Syllabus completion tracker, course materials repository, and client-masked online MCQ exam assessments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="CS401">CS401 — Database Management Systems</option>
            <option value="CS402">CS402 — Operating Systems</option>
            <option value="CS403">CS403 — Computer Networks</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SYLLABUS_MATERIALS')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'SYLLABUS_MATERIALS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Syllabus Coverage & Study Materials
        </button>

        <button
          onClick={() => setActiveTab('ONLINE_ASSESSMENT')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'ONLINE_ASSESSMENT'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Online MCQ Quiz Assessment
        </button>
      </div>

      {/* Content */}
      {activeTab === 'SYLLABUS_MATERIALS' && (
        <SyllabusCoverageTracker courseCode={selectedCourse} />
      )}
      {activeTab === 'ONLINE_ASSESSMENT' && (
        <OnlineQuizAssessmentDesk />
      )}
    </div>
  );
};
