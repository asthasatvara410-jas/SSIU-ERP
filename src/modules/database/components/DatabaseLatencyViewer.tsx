/**
 * SSIU ERP — Database Latency & Metrics Viewer Component
 * File: src/modules/database/components/DatabaseLatencyViewer.tsx
 */

import React from 'react';
import { Database, Activity, HardDrive, Cpu, Layers, CheckCircle2 } from 'lucide-react';
import { DatabaseHealthStatusDTO, TableRecordMetricDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface DatabaseLatencyViewerProps {
  health: DatabaseHealthStatusDTO;
  tables: TableRecordMetricDTO[];
}

export const DatabaseLatencyViewer: React.FC<DatabaseLatencyViewerProps> = ({
  health,
  tables,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Engine</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{health.engine}</div>
            <Badge variant="success" style={{ marginTop: '0.25rem' }}><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> {health.status}</Badge>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Query Latency (Avg)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{health.averageQueryLatencyMs} ms</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Optimal Performance</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Connection Pool</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{health.activeConnectionsCount} / {health.maxPoolSize}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Connections</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Relational Tables</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{health.totalTablesCount} Models</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prisma Managed</div>
          </div>
        </div>
      </div>

      {/* Table Records Breakdown */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--brand-orange)" /> Core Table Metrics &amp; Relational Indexing
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Table Name</th>
                <th>Domain Category</th>
                <th>Record Count</th>
                <th>Foreign Keys</th>
                <th>Indexed Columns</th>
                <th>Est. Storage (KB)</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(t => (
                <tr key={t.tableName}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}><code>{t.tableName}</code></td>
                  <td><Badge variant="navy">{t.category}</Badge></td>
                  <td style={{ fontWeight: 600 }}>{t.rowCount} rows</td>
                  <td>{t.hasForeignKeys ? '✅ Enabled' : 'None'}</td>
                  <td>{t.indexedColumnsCount} Indexes</td>
                  <td>{t.storageUsageEstimateKb.toFixed(1)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
