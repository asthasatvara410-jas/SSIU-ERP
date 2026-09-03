import React, { useState } from 'react';
import { Shield, Lock, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Send, HelpCircle, EyeOff } from 'lucide-react';

interface AnonymousComplaintFormProps {
  onSuccess?: (ticketData: { caseNumber: string; isAnonymous: boolean }) => void;
  className?: string;
}

const CATEGORIES = [
  { value: 'Ragging', label: 'Anti-Ragging (Urgent / Immediate Action)' },
  { value: 'Harassment', label: 'Internal Complaints Committee / Harassment' },
  { value: 'Infrastructure', label: 'Campus Infrastructure & Hostel Facilities' },
  { value: 'Academics', label: 'Academic & Examination Inquiries' },
  { value: 'Other', label: 'Administrative & General Grievance' },
];

/**
 * SSIU ERP — UGC Grievance & Anonymous Complaint Submission Form
 * File: src/components/AnonymousComplaintForm.tsx
 *
 * Provides a confidential, reassuring submission portal for students
 * to lodge grievances with an active "Safe Mode: Identity Hidden" toggle.
 */
export const AnonymousComplaintForm: React.FC<AnonymousComplaintFormProps> = ({
  onSuccess,
  className = '',
}) => {
  const [category, setCategory] = useState<string>('Ragging');
  const [description, setDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage('Please provide a detailed description of the grievance.');
      return;
    }

    if (description.trim().length < 15) {
      setErrorMessage('Please provide at least 15 characters describing the issue in detail.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate call to createGrievanceTicket backend API
      await new Promise((resolve) => setTimeout(resolve, 800));

      const generatedTicket = `GRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketNumber(generatedTicket);
      setSuccessMessage(
        isAnonymous
          ? 'Your complaint has been submitted anonymously. No personal student identifiers were saved or attached to this ticket.'
          : 'Your complaint has been submitted securely to the Grievance Redressal Committee.'
      );

      if (onSuccess) {
        onSuccess({ caseNumber: generatedTicket, isAnonymous });
      }

      // Reset fields
      setDescription('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit grievance ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessMessage(null);
    setTicketNumber(null);
    setDescription('');
    setCategory('Ragging');
    setIsAnonymous(true);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header Container */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>UGC Grievance Redressal Portal</span>
          </div>

          {/* Safe Mode Badge */}
          {isAnonymous ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>Safe Mode: Identity Hidden</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identified Mode</span>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mt-2">Submit a Confidential Grievance</h2>
        <p className="text-xs text-indigo-200/80 mt-1">
          Your voice matters. All submissions are processed directly by the designated statutory committees under strict confidentiality.
        </p>
      </div>

      {/* Main Content / Form */}
      <div className="p-6">
        {successMessage ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">Grievance Registered Successfully</h3>
              <p className="text-xs text-emerald-700 mt-1">{successMessage}</p>
            </div>

            {ticketNumber && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 inline-block font-mono text-sm font-bold text-slate-800 shadow-sm">
                Ticket Reference: <span className="text-indigo-600">{ticketNumber}</span>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded-xl transition"
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Anonymous Toggle Box */}
            <div
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none flex items-start justify-between gap-4 ${
                isAnonymous
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    isAnonymous ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Submit Anonymously - Your identity will be completely hidden
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    When active, your name, enrollment number, and personal profile are strictly excluded from the ticket record.
                  </p>
                  {isAnonymous && (
                    <div className="flex items-center gap-1.5 mt-2 text-emerald-700 font-bold text-[11px]">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Safe Mode: Identity Hidden</span>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-1"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="complaint-category" className="block text-xs font-bold text-slate-700 mb-1.5">
                Grievance Category <span className="text-red-500">*</span>
              </label>
              <select
                id="complaint-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="complaint-description" className="block text-xs font-bold text-slate-700">
                  Grievance Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {description.length} characters
                </span>
              </div>
              <textarea
                id="complaint-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the incident or grievance in detail, including date, location, and relevant context..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-y"
              />
            </div>

            {/* Security Assurance Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                Emergency cases (Anti-Ragging / Safety) are automatically routed with highest priority to the designated squad.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition duration-150 ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Confidential Grievance...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Grievance Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AnonymousComplaintForm;
