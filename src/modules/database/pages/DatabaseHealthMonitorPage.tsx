/**
 * SSIU ERP — Database Health Monitor & Schema Inspector Main Page
 * File: src/modules/database/pages/DatabaseHealthMonitorPage.tsx
 */

import React, { useState, useMemo } from 'react';
import { Database, HardDrive, FileCode, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { databaseHealthMonitorService } from '../services/databaseHealthMonitorService';
import { DatabaseLatencyViewer } from '../components/DatabaseLatencyViewer';
import { Badge } from '../../../components/common/Badge';

export const DatabaseHealthMonitorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'SCHEMA'>('HEALTH');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const health = useMemo(() => databaseHealthMonitorService.getDatabaseHealthStatus(), [refreshKey]);
  const tables = useMemo(() => databaseHealthMonitorService.getTableMetrics(), [refreshKey]);
  const prismaModels = useMemo(() => databaseHealthMonitorService.getPrismaSchemaModels(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Database size={24} color="var(--brand-orange)" /> Database Architecture &amp; Health Center
          </h2>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            PostgreSQL Engine Telemetry, Connection Pool Status &amp; Read-Only Prisma Schema Inspector
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'HEALTH' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('HEALTH')}
          >
            <HardDrive size={16} /> Engine Telemetry
          </button>
          <button 
            className={`btn ${activeTab === 'SCHEMA' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('SCHEMA')}
          >
            <FileCode size={16} /> Schema Architecture
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="Refresh Metrics"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* TAB 1: HEALTH */}
      {activeTab === 'HEALTH' && (
        <DatabaseLatencyViewer health={health} tables={tables} />
      )}

      {/* TAB 2: SCHEMA */}
      {activeTab === 'SCHEMA' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Prisma Relational Data Models Architecture (Read-Only Specification)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {prismaModels.map(model => (
              <div key={model.modelName} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', background: 'var(--bg-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--brand-navy)' }}><code>model {model.modelName}</code></span>
                  <Badge variant="success">Normalized</Badge>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {model.description}
                </p>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Primary Key:</strong> <code>{model.primaryKey}</code></div>
                  <div><strong>Field Count:</strong> {model.fieldCount} defined attributes</div>
                  <div><strong>Relational Joins:</strong> {model.relationsCount} relations</div>
                  <div><strong>Audit Trail:</strong> {model.isAuditLogged ? '✅ Append-Only Logged' : 'None'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
