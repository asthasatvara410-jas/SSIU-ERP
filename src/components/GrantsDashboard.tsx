import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Rocket,
  DollarSign,
  Wallet,
  TrendingUp,
  Award,
  RefreshCw,
  CheckCircle2,
  Building,
} from 'lucide-react';

export interface GrantItem {
  id: string;
  title: string;
  grantType: string;
  amountAllocated: number;
  amountSpent: number;
  facultyId: string;
  facultyName?: string;
  status: string;
  createdAt: string;
}

interface GrantsDashboardProps {
  className?: string;
}

const CHART_COLORS = ['#6366f1', '#10b981']; // Spent (Indigo) vs Remaining (Emerald)

/**
 * SSIU ERP — Startup & Research Grants Financial Dashboard
 * File: src/components/GrantsDashboard.tsx
 *
 * Visualizes sanctioned research & startup grant budgets, cumulative expenditures,
 * and remaining balances using Recharts and Tailwind CSS.
 */
export const GrantsDashboard: React.FC<GrantsDashboardProps> = ({ className = '' }) => {
  const [grants, setGrants] = useState<GrantItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGrantsData = async () => {
      setIsLoading(true);
      try {
        // Simulate async data retrieval from grantService API
        await new Promise((resolve) => setTimeout(resolve, 600));

        const dummyGrants: GrantItem[] = [
          {
            id: 'grt-1',
            title: 'SSIP 2.0 IoT Smart Agriculture Drone Startup Fund',
            grantType: 'SSIP',
            amountAllocated: 100000,
            amountSpent: 45000,
            facultyId: 'FAC-SSCIT-012',
            facultyName: 'Dr. Rajesh Patel',
            status: 'ACTIVE',
            createdAt: '2026-06-15',
          },
          {
            id: 'grt-2',
            title: 'AICTE Smart Healthcare Diagnostics Innovation Prototype',
            grantType: 'AICTE',
            amountAllocated: 250000,
            amountSpent: 180000,
            facultyId: 'FAC-SSCIT-044',
            facultyName: 'Prof. Ananya Sharma',
            status: 'ACTIVE',
            createdAt: '2026-05-10',
          },
          {
            id: 'grt-3',
            title: 'GUJCOST Renewable Energy & Solar Microgrid Research',
            grantType: 'GUJCOST',
            amountAllocated: 150000,
            amountSpent: 65000,
            facultyId: 'FAC-SSCIT-089',
            facultyName: 'Dr. Vikram Desai',
            status: 'ACTIVE',
            createdAt: '2026-07-01',
          },
          {
            id: 'grt-4',
            title: 'DST SERB Quantum Cryptography Simulation Grant',
            grantType: 'DST',
            amountAllocated: 300000,
            amountSpent: 120000,
            facultyId: 'FAC-SSCIT-005',
            facultyName: 'Dr. Meera Iyer',
            status: 'ACTIVE',
            createdAt: '2026-04-20',
          },
          {
            id: 'grt-5',
            title: 'SSIP Student Incubation: Autonomous EV Telematics Kit',
            grantType: 'SSIP',
            amountAllocated: 80000,
            amountSpent: 32000,
            facultyId: 'FAC-SSCIT-021',
            facultyName: 'Prof. Jigar Ahir',
            status: 'ACTIVE',
            createdAt: '2026-08-01',
          },
        ];

        setGrants(dummyGrants);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrantsData();
  }, []);

  const totalAllocated = grants.reduce((sum, g) => sum + g.amountAllocated, 0);
  const totalSpent = grants.reduce((sum, g) => sum + g.amountSpent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const chartData = [
    { name: 'Total Spent Fund', value: totalSpent },
    { name: 'Remaining Balance', value: totalRemaining },
  ];

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full p-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Startup & Grants Financial Summary...</p>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span>SSIU Innovation & Research Council</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Startup & Grants Management</h2>
          <p className="text-xs text-indigo-200/80 mt-0.5">
            Real-time financial tracking of sanctioned SSIP, DST, AICTE & institutional research grants.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Active Grants: <strong className="text-white">{grants.length}</strong></span>
        </div>
      </div>

      {/* Top Section: Financial KPI Cards & Recharts Pie Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Total Allocated */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Allocated Fund</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalAllocated)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sanctioned across {grants.length} projects</p>
            </div>
            <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Total Spent */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent Fund</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{formatCurrency(totalSpent)}</h3>
              <p className="text-[11px] text-indigo-700/80 font-semibold mt-0.5">
                {overallUtilization.toFixed(1)}% Budget Utilized
              </p>
            </div>
            <div className="p-3.5 bg-indigo-100 rounded-2xl text-indigo-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Balance</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalRemaining)}</h3>
              <p className="text-[11px] text-emerald-700/80 font-semibold mt-0.5">Available for disbursement</p>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right Column: Recharts Pie Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Fund Allocation vs Expenditure</h3>
              <p className="text-xs text-slate-500">Visualizing total budget utilization breakdown</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
              SSIU Finance Ledger
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-xl bg-indigo-50/50">
              <span className="text-[11px] font-semibold text-indigo-600 block">Spent Proportion</span>
              <span className="text-sm font-extrabold text-slate-900">{overallUtilization.toFixed(1)}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/50">
              <span className="text-[11px] font-semibold text-emerald-600 block">Remaining Proportion</span>
              <span className="text-sm font-extrabold text-slate-900">{(100 - overallUtilization).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Grants Details Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sanctioned Grants & Projects Detail</h3>
            <p className="text-xs text-slate-500">Comprehensive expenditure audit and remaining balance by scheme</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Showing {grants.length} grants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-4">Grant Title & Investigator</th>
                <th className="p-4 text-center">Type / Scheme</th>
                <th className="p-4 text-right">Allocated Amount</th>
                <th className="p-4 text-right">Spent Amount</th>
                <th className="p-4 text-right">Remaining Balance</th>
                <th className="p-4 text-center">Utilization Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grants.map((g) => {
                const remaining = g.amountAllocated - g.amountSpent;
                const percentSpent = g.amountAllocated > 0 ? (g.amountSpent / g.amountAllocated) * 100 : 0;

                return (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
                    {/* Title */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{g.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-indigo-600" />
                        <span>PI: {g.facultyName || g.facultyId}</span>
                      </div>
                    </td>

                    {/* Grant Type Badge */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Building className="w-3 h-3" />
                        {g.grantType}
                      </span>
                    </td>

                    {/* Allocated Amount */}
                    <td className="p-4 text-right font-semibold text-slate-800">
                      {formatCurrency(g.amountAllocated)}
                    </td>

                    {/* Spent Amount */}
                    <td className="p-4 text-right font-bold text-indigo-600">
                      {formatCurrency(g.amountSpent)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="p-4 text-right font-bold text-emerald-600">
                      {formatCurrency(remaining)}
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>{percentSpent.toFixed(0)}%</span>
                        <span className="text-slate-400">{formatCurrency(remaining)} left</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentSpent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(percentSpent, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>All expenditures are subject to internal audit and utilization certificate submission.</span>
          <span className="font-mono text-slate-400">SSIU SSIP & Grants Engine v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default GrantsDashboard;
