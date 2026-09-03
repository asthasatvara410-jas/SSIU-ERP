import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, RefreshCw, BookOpen, AlertCircle, CheckCircle,
  Clock, ExternalLink, Link2, ChevronRight, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { AbcApiService, AbcStudentProfile } from '../../services/abcApiService';

export const StudentAbcPortal: React.FC = () => {
  const [profileData, setProfileData] = useState<AbcStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Link ABC ID modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [inputAbcId, setInputAbcId] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // Selected Course Drawer
  const [selectedCourse, setSelectedCourse] = useState<AbcStudentProfile['credits']['courses'][0] | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AbcApiService.getMyAbcProfile();
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        setError('We could not load your academic credit information.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ABC profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    const clean = inputAbcId.trim().replace(/[\s-]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{12}$/.test(clean)) {
      setLinkError('Invalid ABC ID format: Must be exactly 12 alphanumeric characters (e.g. ABC-123456789012)');
      return;
    }

    setIsSubmittingLink(true);
    try {
      const res = await AbcApiService.linkAbcId(profileData?.student.id || 'me', inputAbcId);
      if (res.success) {
        setIsLinkModalOpen(false);
        setInputAbcId('');
        await fetchProfile();
      } else {
        setLinkError(res.message || 'Failed to link ABC ID.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'Error occurred while linking ABC ID.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleSyncCredits = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const studentId = profileData?.student.id || 'me';
      const res = await AbcApiService.syncCredits(studentId);
      setSyncNotice(res.message || 'DigiLocker synchronization completed successfully.');
      await fetchProfile();
    } catch (err: any) {
      setSyncNotice(err.message || 'DigiLocker synchronization failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading academic credit ledger and ABC profile...</p>
      </div>
    );
  }

  // Error State
  if (error || !profileData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Unable to Load Academic Credits</h2>
          <p className="text-xs text-slate-600">{error || 'An unexpected error occurred while communicating with the ABC service.'}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, abcProfile, credits } = profileData;
  const isVerified = abcProfile.verificationStatus === 'VERIFIED';
  const isPending = abcProfile.verificationStatus === 'PENDING_VERIFICATION';
  const isNotLinked = !abcProfile.abcId || abcProfile.verificationStatus === 'NOT_SUBMITTED';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Academic Bank of Credits • UGC NEP 2020
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">National Academic Credit Ledger</h1>
          <p className="text-indigo-200 text-xs mt-1">
            Official earned credit points for {student.name} ({student.enrollmentNo}) under the DigiLocker NAD framework.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isNotLinked ? (
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow"
            >
              <Link2 className="w-4 h-4" />
              Link ABC ID
            </button>
          ) : (
            <button
              onClick={handleSyncCredits}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync with DigiLocker'}
            </button>
          )}
        </div>
      </div>

      {syncNotice && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl p-4 flex items-center gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ABC ID Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ABC ID Number</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isVerified
                  ? 'bg-emerald-100 text-emerald-800'
                  : isPending
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {abcProfile.verificationStatus.replace('_', ' ')}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-slate-800 tracking-wide">
            {abcProfile.abcId || <span className="text-slate-400 italic text-sm">Not Linked</span>}
          </div>
          <p className="text-[11px] text-slate-500">
            {isVerified ? 'Verified by Academic Section' : isPending ? 'Pending Mentor Verification' : 'Click Link to register ABC ID'}
          </p>
        </div>

        {/* Total Earned Credits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Earned Credits</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-600">{credits.totalEarnedCredits}</span>
            <span className="text-xs text-slate-500">/ 160 Degree Req.</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((credits.totalEarnedCredits / 160) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Courses</span>
          <div className="text-3xl font-bold text-emerald-600">
            {credits.courses.filter(c => c.status === 'EARNED').length}
          </div>
          <p className="text-[11px] text-slate-500">Earned with official passing grades</p>
        </div>

        {/* Pending / Incomplete */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending / Incomplete</span>
          <div className="text-3xl font-bold text-amber-600">
            {credits.courses.filter(c => c.status !== 'EARNED').length}
          </div>
          <p className="text-[11px] text-slate-500">In-progress or backlog courses</p>
        </div>
      </div>

      {/* Semester Summaries & Course Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Semester-wise Accumulation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Semester Credit Summary
          </h2>

          {credits.semesterWise.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No semester records evaluated yet.</p>
          ) : (
            <div className="space-y-3">
              {credits.semesterWise.map((sem, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Semester {sem.semesterNumber}</div>
                    <div className="text-[11px] text-slate-500">{sem.academicYear} • SGPA: {sem.sgpa ?? 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-indigo-600">{sem.earnedCredits} Cr</div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                      {sem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Course Credit Ledger */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Course Credit Ledger
            </h2>
            <span className="text-xs text-slate-500">Click a course for full academic details</span>
          </div>

          {credits.courses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No academic credits are available yet. Complete semester examinations to accumulate credits.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Course Name</th>
                    <th className="py-2.5 px-3">Credits</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Credit Status</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credits.courses.map((course, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedCourse(course)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{course.courseCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{course.courseName}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600">{course.creditValue} Cr</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{course.grade || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            course.status === 'EARNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : course.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-600">
                        <ChevronRight className="w-4 h-4 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Link ABC ID */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                Link Academic Bank of Credits (ABC) ID
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12-Digit ABC / APAAR ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC-123456789012"
                  value={inputAbcId}
                  onChange={e => setInputAbcId(e.target.value)}
                  className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtain your 12-digit ABC ID from your Government DigiLocker or abc.gov.in account.
                </p>
              </div>

              {linkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow"
                >
                  {isSubmittingLink ? 'Validating...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Course Details */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">{selectedCourse.courseCode}</span>
                <h3 className="font-bold text-base text-slate-900">{selectedCourse.courseName}</h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Credit Value</span>
                <span className="font-bold text-slate-800 text-sm">{selectedCourse.creditValue} Credits</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Grade Obtained</span>
                <span className="font-bold text-slate-800 text-sm">{selectedCourse.grade || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Academic Year</span>
                <span className="font-bold text-slate-800">{selectedCourse.academicYear}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Credit Status</span>
                <span className="font-bold text-emerald-600">{selectedCourse.status}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-medium text-slate-800">{selectedCourse.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Earned Date:</span>
                <span className="font-medium text-slate-800">
                  {selectedCourse.earnedAt ? new Date(selectedCourse.earnedAt).toLocaleDateString() : 'Pending final publication'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
