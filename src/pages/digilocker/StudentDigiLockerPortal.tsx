import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Lock,
  ExternalLink, FileText, ArrowUpRight, Award, Clock,
  CheckCircle, AlertCircle, X, ShieldAlert, KeyRound, Radio
} from 'lucide-react';
import { DigiLockerApiService, DigiLockerStudentStatus } from '../../services/digilockerApiService';

export const StudentDigiLockerPortal: React.FC = () => {
  const [statusData, setStatusData] = useState<DigiLockerStudentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await DigiLockerApiService.getMyStatus();
      if (res.success && res.data) {
        setStatusData(res.data);
      } else {
        setError('Failed to retrieve DigiLocker connection status.');
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading DigiLocker details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConsentToggle = async (decision: boolean) => {
    setIsUpdatingConsent(true);
    setSyncNotice(null);
    try {
      const res = await DigiLockerApiService.updateConsent(decision);
      setSyncNotice({ type: 'success', message: res.message });
      await fetchStatus();
    } catch (err: any) {
      setSyncNotice({ type: 'error', message: err.message || 'Failed to update consent.' });
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setSyncNotice(null);
    try {
      if (!statusData?.consent.given) {
        await DigiLockerApiService.updateConsent(true);
      }
      const connectRes = await DigiLockerApiService.initiateConnect();
      if (connectRes.data?.authorizationUrl) {
        window.location.href = connectRes.data.authorizationUrl;
      } else {
        setSyncNotice({
          type: 'info',
          message: 'Official DigiLocker API credentials are not configured in this environment. Gateway connection is pending production onboarding.',
        });
      }
    } catch (err: any) {
      setSyncNotice({ type: 'error', message: err.message || 'DigiLocker authorization request failed.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await DigiLockerApiService.syncDocuments();
      setSyncNotice({ type: 'success', message: res.message });
      await fetchStatus();
    } catch (err: any) {
      setSyncNotice({ type: 'error', message: err.message || 'Synchronization failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your DigiLocker account? You can reconnect at any time.')) {
      return;
    }
    try {
      const res = await DigiLockerApiService.disconnect();
      setSyncNotice({ type: 'success', message: res.message });
      await fetchStatus();
    } catch (err: any) {
      setSyncNotice({ type: 'error', message: err.message || 'Failed to disconnect DigiLocker account.' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading DigiLocker repository status...</p>
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Unable to Load DigiLocker Portal</h2>
          <p className="text-xs text-slate-600">{error || 'An unexpected communication error occurred.'}</p>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, consent, connection, documentsSummary, documents, integration } = statusData;
  const isConnected = connection.status === 'CONNECTED';
  const isConfigured = integration.isConfigured;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Government of India • National Academic Depository (NAD)
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">My DigiLocker Documents</h1>
          <p className="text-indigo-200 text-xs mt-1">
            Access, verify, and synchronize your official SSIU academic degrees, marksheets, and certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-indigo-300 font-medium hidden sm:inline-block">
              {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition backdrop-blur-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow"
            >
              <KeyRound className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect DigiLocker'}
            </button>
          ) : (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Documents'}
            </button>
          )}
        </div>
      </div>

      {syncNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border ${
          syncNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : syncNotice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {syncNotice.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
            <span>{syncNotice.message}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── STATUS & INTEGRATION INFO CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Citizen Connection</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <div className="text-base font-bold text-slate-900">
              {isConnected ? 'DigiLocker Linked' : 'Not Connected'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            {connection.connectedAt ? `Connected: ${new Date(connection.connectedAt).toLocaleDateString()}` : 'Awaiting Authorization'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Citizen Consent</span>
          <div className="flex items-center gap-2 mt-1">
            {consent.given ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            <div className="text-base font-bold text-slate-900">
              {consent.given ? 'Consent Granted' : 'Pending Consent'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            {consent.consentAt ? `Active since ${new Date(consent.consentAt).toLocaleDateString()}` : 'Citizen approval required'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified Documents</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{documentsSummary.issued}</div>
          <div className="text-[11px] text-indigo-700 font-medium">Of {documentsSummary.total} Total Registered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gateway Environment</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <div className="text-sm font-bold text-slate-900">
              {isConfigured ? 'Production Gateway' : 'Demo Sandbox Mode'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            {isConfigured ? 'National NAD API' : 'Simulated Government Depository'}
          </div>
        </div>
      </div>

      {/* ─── VERIFIED STUDENT PROFILE ONBOARDING DATA (READ-ONLY) ─── */}
      {statusData.verifiedProfile && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-indigo-50/30 p-6 rounded-2xl border border-emerald-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Government-Verified Student Identity & Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official citizen identity attributes verified via DigiLocker / UIDAI / Income Tax / MoRTH.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Locked & Verified via DigiLocker
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Legal Name (As per Govt. Record)</span>
              <div className="text-sm font-bold text-slate-900">{statusData.verifiedProfile.legalName}</div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-only verified
              </div>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Date of Birth & Gender</span>
              <div className="text-sm font-bold text-slate-900">
                {statusData.verifiedProfile.dateOfBirth} • {statusData.verifiedProfile.gender}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-only verified
              </div>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Aadhaar (UIDAI Verified)</span>
              <div className="text-sm font-mono font-bold text-slate-900">{statusData.verifiedProfile.aadhaarMasked}</div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Identity Authenticated
              </div>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">PAN & Driving Licence</span>
              <div className="text-sm font-mono font-bold text-slate-900">
                {statusData.verifiedProfile.panNumber} / {statusData.verifiedProfile.drivingLicenseNumber}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-only verified
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic bg-white/60 p-2.5 rounded-lg border border-slate-200/60">
            Note: Verified government data is controlled by issuing authorities. To correct any discrepancy, please update the source document directly with the respective government department.
          </div>
        </div>
      )}

      {/* ─── CITIZEN CONSENT SETTINGS CARD ─── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" /> Citizen Consent & Data Privacy Policy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Under Information Technology (Preservation and Retention of Information by Intermediaries Providing Digital Locker Facilities) Rules, 2016.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleConsentToggle(!consent.given)}
              disabled={isUpdatingConsent}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                consent.given
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {isUpdatingConsent ? 'Updating...' : consent.given ? 'Revoke Consent' : 'Grant Citizen Consent'}
            </button>
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
          I hereby authorize <strong>Swarrnim Startup & Innovation University (SSIU)</strong> to issue, publish, and synchronize my verified degrees, transcripts, marksheets, and migration certificates directly to my Government of India DigiLocker account.
        </div>
      </div>

      {/* ─── DIGITAL CREDENTIALS REPOSITORY TABLE ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> University Academic Documents in DigiLocker
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official tamper-evident digital certificates registered in the National Academic Depository.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Document / Serial Number</th>
                <th className="py-3.5 px-4">Issuer Institution</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4">Last Sync</th>
                <th className="py-3.5 px-4 text-right">Depository Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        {doc.documentType}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{doc.documentNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.issuer || 'Swarrnim University'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        doc.status === 'ISSUED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {doc.status === 'ISSUED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {doc.status === 'ISSUED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          DigiLocker NAD <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Processing</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No digital certificates have been issued yet for this student account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
