import React, { useState, useMemo } from 'react';
import { Search, Printer, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, Eye, ArrowUp, ArrowDown, ArrowUpDown, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Badge } from './Badge';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filterSlot?: React.ReactNode;
  onAddClick?: () => void;
  addLabel?: string;
  onBulkImportClick?: () => void;
  bulkImportLabel?: string;
  onEditClick?: (item: T) => void;
  onDeleteClick?: (item: T) => void;
  onViewClick?: (item: T) => void;
  canMutate?: boolean;
  exportFilename?: string;
}

export function DataTable<T extends { id: string }>({
  title,
  subtitle,
  data,
  columns,
  searchPlaceholder = 'Search records by name, ID, or keyword...',
  searchFields,
  filterSlot,
  onAddClick,
  addLabel = 'Add Record',
  onBulkImportClick,
  bulkImportLabel = 'Bulk Import',
  onEditClick,
  onDeleteClick,
  onViewClick,
  canMutate = true,
  exportFilename = 'master-data'
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter(item => {
      if (searchFields && searchFields.length > 0) {
        return searchFields.some(field => {
          const val = item[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      }
      return Object.values(item).some(val => {
        if (typeof val === 'object' && val !== null) return false;
        return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);

  // Sort Logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = (a as any)[sortKey];
      let bVal = (b as any)[sortKey];
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(String(bVal));
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const exportableCols = columns.filter(c => c.key !== 'actions');
    const headers = exportableCols.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = sortedData.map(item => {
      return exportableCols.map(c => {
        let val = (item as any)[c.key];
        if (val === undefined || val === null) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFilename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const printableColumns = columns.filter(c => c.key !== 'actions');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - SSIU ERP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0F172A; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F2C59; padding-bottom: 12px; margin-bottom: 20px; }
          .title-area h1 { font-size: 20px; color: #0F2C59; margin: 0; font-weight: 800; }
          .title-area p { font-size: 12px; color: #F37023; margin: 3px 0 0 0; font-weight: 600; }
          .meta-info { font-size: 11px; color: #64748B; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
          th { background-color: #0F2C59; color: #FFFFFF; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-title">
            <div class="title-area">
              <h1>Swarrnim Startup & Innovation University</h1>
              <p>${title} ${subtitle ? `• ${subtitle}` : ''}</p>
            </div>
          </div>
          <div class="meta-info">
            <div><strong>SSIU ERP Master Record</strong></div>
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Total Records: ${sortedData.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              ${printableColumns.map(c => `<th>${c.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sortedData.map(item => `
              <tr>
                ${printableColumns.map(c => {
                  let val = (item as any)[c.key];
                  if (val === undefined || val === null) val = '-';
                  return `<td>${String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>Swarrnim Startup & Innovation University • SSIU ERP — University Management System</div>
          <div>Official Record • Confidential • Academic Session 2026–27</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header Toolbar */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {subtitle} ({data.length} total records)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export to Excel / CSV spreadsheet">
              <FileSpreadsheet size={15} color="#10B981" /> Export Excel
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} title="Export to PDF / Print official record">
              <Printer size={15} color="#EF4444" /> Print PDF
            </button>
            {onBulkImportClick && canMutate && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onBulkImportClick}
                title="Bulk Data Management (Excel Upload, Update & Validation)"
                style={{ borderColor: 'var(--brand-navy-medium)', color: 'var(--brand-navy)' }}
              >
                <UploadCloud size={15} color="var(--brand-orange)" /> {bulkImportLabel}
              </button>
            )}
            {onAddClick && canMutate && (
              <button className="btn btn-primary btn-sm" onClick={onAddClick}>
                <Plus size={16} /> {addLabel}
              </button>
            )}
          </div>
        </div>

        {/* Search & Custom Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          {filterSlot && <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{filterSlot}</div>}
        </div>
      </div>

      {/* Table Body */}
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              {columns.map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{
                      padding: '0.75rem 1rem',
                      fontWeight: 800,
                      color: isSorted ? 'var(--brand-orange)' : 'var(--brand-navy)',
                      width: col.width,
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      borderRight: '1px solid var(--border-light, #E2E8F0)',
                      fontSize: '0.8125rem'
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start'
                    }}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        isSorted ? (
                          sortOrder === 'asc' ? <ArrowUp size={14} color="var(--brand-orange)" /> : <ArrowDown size={14} color="var(--brand-orange)" />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
              {(onEditClick || onDeleteClick || onViewClick) && (
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--brand-navy-medium)', textAlign: 'right', width: '140px' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-navy)' }}>No records found</div>
                  <div style={{ fontSize: '0.84375rem', marginTop: '4px' }}>
                    {searchQuery ? `No matching records found for "${searchQuery}". Try a different keyword.` : 'There are currently no records available in this directory.'}
                  </div>
                  {searchQuery && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.85rem' }}
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    >
                      Clear Search Query
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: idx % 2 === 0 ? 'var(--bg-surface)' : 'rgba(248, 250, 252, 0.5)',
                    transition: 'background var(--transition-fast)'
                  }}
                  className="table-row-hover"
                >
                  {columns.map(col => (
                    <td 
                      key={col.key} 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        verticalAlign: 'middle',
                        textAlign: col.align || 'left',
                        borderRight: '1px solid var(--border-light, #F1F5F9)'
                      }}
                    >
                      {col.accessor ? (
                        col.accessor(item, (currentPage - 1) * pageSize + idx)
                      ) : col.key === 'status' ? (
                        <Badge variant={(item as any).status === 'ACTIVE' ? 'active' : 'inactive'}>
                          {(item as any).status}
                        </Badge>
                      ) : (
                        (item as any)[col.key] ?? '-'
                      )}
                    </td>
                  ))}
                  {(onEditClick || onDeleteClick || onViewClick) && (
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {onViewClick && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => onViewClick(item)}
                            title="View details"
                            style={{ color: 'var(--brand-navy-medium)' }}
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {onEditClick && canMutate && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => onEditClick(item)}
                            title="Edit record"
                            style={{ color: 'var(--brand-orange)' }}
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {onDeleteClick && canMutate && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => onDeleteClick(item)}
                            title="Delete record"
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          padding: '0.875rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface-hover)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Rows per page:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8125rem' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', padding: '0 0.5rem' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

