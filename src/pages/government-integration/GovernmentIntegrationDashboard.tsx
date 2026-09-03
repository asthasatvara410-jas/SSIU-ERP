import React, { useState, useEffect } from 'react';
import {
  Landmark, ShieldCheck, RefreshCw, CheckCircle, ExternalLink,
  Lock, AlertTriangle, FileCheck, Layers, Server, ArrowUpRight
} from 'lucide-react';
import {
  GovernmentIntegrationApiService,
  GovernmentAdminDashboard,
  StudentABCData,
  DigiLockerData,
  DigitalCredentialItem,
} from '../../services/governmentIntegrationApiService';

export const GovernmentIntegrationDashboard: React.FC = () => {
  const [adminDash, setAdminDash] = useState<GovernmentAdminDashboard | null>(null);
  const [abcData, setAbcData] = useState<StudentABCData | null>(null);
  const [digiLocker, setDigiLocker] = useState<DigiLockerData | null>(null);
  const [credentials, setCredentials] = useState<DigitalCredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STUDENT_SERVICES' | 'ADMIN_DIAGNOSTICS'>('STUDENT_SERVICES');

  // Link ABC Modal / Input
  const [abcInput, setAbcInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [admRes, abcRes, dlRes, crdRes] = await Promise.all([
        GovernmentIntegrationApiService.getAdminDashboard(),
        GovernmentIntegrationApiService.getABCProfile(),
        GovernmentIntegrationApiService.getDigiLockerProfile(),
        GovernmentIntegrationApiService.listCredentials(),
      ]);
      if (admRes.success) setAdminDash(admRes.data);
      if (abcRes.success) setAbcData(abcRes.data);
      if (dlRes.success) setDigiLocker(dlRes.data);
      if (crdRes.success) setCredentials(crdRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLinkABC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abcInput.trim() || !/^\d{12}$/.test(abcInput.trim())) return;
    setIsLinking(true);
    try {
      const res = await GovernmentIntegrationApiService.linkABCId(abcInput.trim());
      if (res.success) {
        setAbcInput('');
        await loadData();
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleSyncCredits = async () => {
    setIsSyncing(true);
    try {
      const res = await GovernmentIntegrationApiService.syncCredits();
      if (res.success) {
        await loadData();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRevokeDigiLocker = async () => {
    if (confirm('Are you sure you want to disconnect your DigiLocker account from SSIU ERP?')) {
      const res = await GovernmentIntegrationApiService.revokeDigiLocker();
      if (res.success) {
        await loadData();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Connecting to National Academic Integration Gateway...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Landmark className="w-4 h-4" /> Ministry of Education • National Academic Depository
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Government Academic & Credential Gateway</h1>
          <p className="text-slate-300 text-xs mt-1">
            Academic Bank of Credits (ABC / APAAR), DigiLocker NAD Credential Publication, and National Scholarship Integration.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-200">ISO 27001 & DPDPA Verified</span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('STUDENT_SERVICES')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'STUDENT_SERVICES' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Academic Credentials & ABC
        </button>
        <button
          onClick={() => setActiveTab('ADMIN_DIAGNOSTICS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ADMIN_DIAGNOSTICS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          National Gateway Diagnostics (Admin)
        </button>
      </div>

      {/* Student Services Tab */}
      {activeTab === 'STUDENT_SERVICES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ABC Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                      NEP 2020 COMPLIANT
                    </span>
                    {abcData?.verificationStatus && (
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        abcData.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {abcData.verificationStatus}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Academic Bank of Credits (ABC / APAAR)</h2>
                  <p className="text-xs text-slate-500">Universal student academic credit repository managed by MoE.</p>
                </div>
              </div>

              {abcData?.abcId ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Linked ABC ID:</span>
                    <span className="font-mono font-bold text-slate-800 tracking-wider">{abcData.abcId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Credit Sync Status:</span>
                    <span className="font-bold text-emerald-600">{abcData.syncStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Last Synchronized:</span>
                    <span className="text-slate-600">{abcData.lastSyncedAt ? new Date(abcData.lastSyncedAt).toLocaleDateString() : 'Never'}</span>
                  </div>

                  <button
                    onClick={handleSyncCredits}
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchronizing with ABC Gateway...' : 'Sync Academic Credits to ABC'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLinkABC} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Enter 12-Digit APAAR / ABC ID</label>
                    <input
                      type="text"
                      value={abcInput}
                      onChange={(e) => setAbcInput(e.target.value)}
                      placeholder="e.g. 123456789012"
                      maxLength={12}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs shadow"
                  >
                    {isLinking ? 'Linking...' : 'Link ABC / APAAR Account'}
                  </button>
                </form>
              )}
            </div>

            {/* DigiLocker Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full border border-teal-200">
                      DIGITAL INDIA
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                      digiLocker?.connectionStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {digiLocker?.connectionStatus || 'NOT_CONNECTED'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">DigiLocker National Academic Depository</h2>
                  <p className="text-xs text-slate-500">Access verified digital degrees, diplomas, and grade marksheets.</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Connection Status:</span>
                  <span className="font-bold text-slate-800">{digiLocker?.connectionStatus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Published Credentials:</span>
                  <span className="font-bold text-blue-600">{credentials.length} Academic Records</span>
                </div>

                {digiLocker?.connectionStatus === 'CONNECTED' ? (
                  <button
                    onClick={handleRevokeDigiLocker}
                    className="w-full py-2.5 bg-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Disconnect DigiLocker
                  </button>
                ) : (
                  <button
                    onClick={() => GovernmentIntegrationApiService.connectDigiLocker('DL-USER-REF-2026').then(loadData)}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition text-xs shadow"
                  >
                    Connect DigiLocker Account
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Published Credentials List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">University-Issued Digital Credentials in DigiLocker</h2>
              <span className="text-xs text-slate-500 font-mono">{credentials.length} Records</span>
            </div>

            <div className="divide-y divide-slate-100">
              {credentials.map(c => (
                <div key={c.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                        {c.credentialType}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Credential No: {c.credentialNumber}</h3>
                    <p className="text-[11px] text-slate-500">Issued by SSIU • Published on: {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                    Provider: {c.provider}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Diagnostics Tab */}
      {activeTab === 'ADMIN_DIAGNOSTICS' && adminDash && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ABC Linked Students</span>
              <div className="text-3xl font-bold text-blue-600">{adminDash.abcSummary.totalLinked}</div>
              <p className="text-[11px] text-slate-500">{adminDash.abcSummary.verified} Verified by APAAR</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Credit Sync Success</span>
              <div className="text-3xl font-bold text-emerald-600">{adminDash.abcSummary.synced}</div>
              <p className="text-[11px] text-slate-500">Verified institutional credits pushed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">DigiLocker Connected</span>
              <div className="text-3xl font-bold text-teal-600">{adminDash.digiLockerSummary.connectedStudents}</div>
              <p className="text-[11px] text-slate-500">Active student NAD authorizations</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Published Credentials</span>
              <div className="text-3xl font-bold text-slate-900">{adminDash.digiLockerSummary.publishedCredentials}</div>
              <p className="text-[11px] text-slate-500">0 Publication failures</p>
            </div>
          </div>

          {/* Provider Health Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Official Government Integration Health Matrix</h2>
              <span className="text-xs text-slate-500 font-mono">Live Monitoring</span>
            </div>

            <div className="divide-y divide-slate-100">
              {adminDash.providers.map(p => (
                <div key={p.name} className="p-5 hover:bg-slate-50/50 transition flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">Integration Mode: <span className="font-mono text-blue-700">{p.mode}</span></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{p.latency}ms Latency</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-xl ${
                      p.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
