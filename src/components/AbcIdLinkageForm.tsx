import React, { useState } from 'react';
import { Landmark, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

interface AbcIdLinkageFormProps {
  studentId?: string;
  onSuccess?: (abcId: string) => void;
  className?: string;
}

/**
 * SSIU ERP — Academic Bank of Credits (ABC / APAAR) Linkage Form
 * File: src/components/AbcIdLinkageForm.tsx
 *
 * Provides students with an interface to link their 12-digit
 * Ministry of Education APAAR / ABC ID with validation, error handling,
 * and loading states.
 */
export const AbcIdLinkageForm: React.FC<AbcIdLinkageFormProps> = ({
  studentId = 'CURRENT_STUDENT',
  onSuccess,
  className = '',
}) => {
  const [abcId, setAbcId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate 12-digit numeric APAAR / ABC format
  const validateAbcId = (value: string): boolean => {
    return /^\d{12}$/.test(value.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAbcId(rawVal);
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedId = abcId.trim();

    if (!trimmedId) {
      setErrorMessage('Please enter your 12-digit ABC / APAAR ID.');
      return;
    }

    if (!validateAbcId(trimmedId)) {
      setErrorMessage('Invalid ABC ID. It must be exactly 12 numeric digits.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to backend service / endpoint
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSuccessMessage(`ABC ID ${trimmedId} has been successfully linked to student account (${studentId})!`);
      setAbcId('');
      if (onSuccess) {
        onSuccess(trimmedId);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to link ABC ID. Please verify your ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Landmark className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Academic Bank of Credits (ABC)</h3>
              <p className="text-xs text-indigo-200/80">National Academic Depository (NAD) / APAAR</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            NEP 2020
          </span>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Info Box */}
        <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Linking your 12-digit ABC / APAAR ID allows automatic credit transfer, academic mobility, and digital degree verification under National Education Policy guidelines.
          </p>
        </div>

        {/* Input Field */}
        <div className="space-y-1.5">
          <label htmlFor="abcIdInput" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            12-Digit ABC / APAAR ID <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="abcIdInput"
              type="text"
              inputMode="numeric"
              value={abcId}
              onChange={handleInputChange}
              placeholder="e.g. 123456789012"
              maxLength={12}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 text-sm font-mono tracking-widest bg-slate-50 border rounded-xl transition duration-150 focus:outline-none focus:ring-2 focus:bg-white ${
                errorMessage
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 text-slate-900'
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 pointer-events-none">
              {abcId.length}/12
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || abcId.length !== 12}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying & Linking ABC ID...</span>
            </>
          ) : (
            <>
              <Landmark className="w-4 h-4" />
              <span>Link ABC ID</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AbcIdLinkageForm;
