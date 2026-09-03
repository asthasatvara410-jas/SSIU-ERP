import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Filter, RotateCcw, Download, RefreshCw, Eye, EyeOff, 
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, 
  Check, X, Edit3, Printer, FileSpreadsheet, Layers, SlidersHorizontal, CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  key: string;
  header: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  editable?: boolean;
  sticky?: 'left' | 'right';
  defaultVisible?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  getRawValue?: (item: T) => any;
  editType?: 'text' | 'number' | 'select';
  editOptions?: { label: string; value: any }[];
}

export interface ExcelFilterOption {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  disabled?: boolean;
  tooltip?: string;
}

export interface ExcelBulkAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  onClick: (selectedItems: T[]) => void;
}

export interface ExcelDataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: ExcelColumn<T>[];
  keyField?: keyof T;
  title?: string;
  subtitle?: string;
  storageKey?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  filters?: ExcelFilterOption[];
  onFilterChange?: (filterKey: string, value: string) => void;
  onResetFilters?: () => void;
  bulkActions?: ExcelBulkAction<T>[];
  enableSelection?: boolean;
  enableInlineEditing?: boolean;
  onSaveInlineEdit?: (item: T, editedValues: Partial<T>) => Promise<boolean | void> | boolean | void;
  exportFilename?: string;
  exportTitle?: string;
  exportMetadata?: Record<string, string>;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  lastUpdated?: string | Date;
  onRefresh?: () => void;
  toolbarExtra?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  rowHighlightPredicate?: (item: T) => string | undefined; // Returns CSS background color if any
}

export function ExcelDataTable<T extends { id: string | number }>({
  data,
  columns,
  keyField = 'id' as keyof T,
  title,
  subtitle,
  storageKey,
  searchPlaceholder = 'Search records...',
  searchFields,
  filters = [],
  onFilterChange,
  onResetFilters,
  bulkActions = [],
  enableSelection = true,
  enableInlineEditing = false,
  onSaveInlineEdit,
  exportFilename = 'ERP_Register_Export',
  exportTitle,
  exportMetadata,
  pageSizeOptions = [10, 25, 50, 100, 200],
  defaultPageSize = 25,
  isLoading = false,
  error = null,
  onRetry,
  lastUpdated,
  onRefresh,
  toolbarExtra,
  emptyMessage = 'No records found',
  emptyDescription = 'Try adjusting your search query or active filters to find what you are looking for.',
  rowHighlightPredicate
}: ExcelDataTableProps<T>) {
  // ─── Density Control State ──────────────────────────────────────────────
  const [density, setDensity] = useState<'COMPACT' | 'COMFORTABLE'>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`sscit_grid_density_${storageKey}`);
      if (saved === 'COMPACT' || saved === 'COMFORTABLE') return saved;
    }
    return 'COMPACT';
  });

  const toggleDensity = () => {
    const next = density === 'COMPACT' ? 'COMFORTABLE' : 'COMPACT';
    setDensity(next);
    if (storageKey) {
      localStorage.setItem(`sscit_grid_density_${storageKey}`, next);
    }
  };

  // ─── Search & Pagination State ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ─── Sorting State ────────────────────────────────────────────────────────
  const [sortColumnKey, setSortColumnKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ─── Selection State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // ─── Column Visibility ────────────────────────────────────────────────────
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`sscit_grid_cols_${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return new Set(parsed);
          }
        }
      } catch (e) {}
    }
    return new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key));
  });

  const handleToggleColumn = (key: string) => {
    const newSet = new Set(visibleColumnKeys);
    if (newSet.has(key)) {
      if (newSet.size > 1) newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setVisibleColumnKeys(newSet);
    if (storageKey) {
      localStorage.setItem(`sscit_grid_cols_${storageKey}`, JSON.stringify(Array.from(newSet)));
    }
  };

  const handleResetColumns = () => {
    const defaultSet = new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key));
    setVisibleColumnKeys(defaultSet);
    if (storageKey) {
      localStorage.removeItem(`sscit_grid_cols_${storageKey}`);
    }
  };

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // ─── Inline Editing State ─────────────────────────────────────────────────
  const [editingRowId, setEditingRowId] = useState<string | number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Close column picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Search Filtering ─────────────────────────────────────────────────────
  const searchedData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();

    return data.filter(item => {
      if (searchFields && searchFields.length > 0) {
        return searchFields.some(field => {
          const val = (item as any)[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      }
      // Fallback: search all primitive values in item
      return Object.values(item).some(val => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchFields]);

  // ─── Sorting ──────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortColumnKey) return searchedData;

    const col = columns.find(c => c.key === sortColumnKey);
    return [...searchedData].sort((a, b) => {
      let valA = col?.getRawValue ? col.getRawValue(a) : (a as any)[sortColumnKey];
      let valB = col?.getRawValue ? col.getRawValue(b) : (b as any)[sortColumnKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [searchedData, sortColumnKey, sortDirection, columns]);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Keep currentPage valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // ─── Active Columns ───────────────────────────────────────────────────────
  const activeColumns = useMemo(() => {
    return columns.filter(c => visibleColumnKeys.has(c.key));
  }, [columns, visibleColumnKeys]);

  // ─── Sorting Handler ──────────────────────────────────────────────────────
  const handleColumnSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortColumnKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnKey(key);
      setSortDirection('asc');
    }
  };

  // ─── Selection Handlers ───────────────────────────────────────────────────
  const isPageAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.has(item[keyField] as any));
  const isAllTotalSelected = sortedData.length > 0 && selectedIds.size === sortedData.length;

  const handleToggleSelectPage = () => {
    const newSet = new Set(selectedIds);
    if (isPageAllSelected) {
      paginatedData.forEach(item => newSet.delete(item[keyField] as any));
    } else {
      paginatedData.forEach(item => newSet.add(item[keyField] as any));
    }
    setSelectedIds(newSet);
  };

  const handleSelectAllTotal = () => {
    const newSet = new Set<string | number>();
    sortedData.forEach(item => newSet.add(item[keyField] as any));
    setSelectedIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleToggleRowSelect = (id: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Selected items array
  const selectedItems = useMemo(() => {
    return data.filter(item => selectedIds.has(item[keyField] as any));
  }, [data, selectedIds, keyField]);

  // ─── Inline Editing Handlers ──────────────────────────────────────────────
  const handleStartEdit = (item: T) => {
    setEditingRowId(item[keyField] as any);
    const initialValues: Record<string, any> = {};
    columns.forEach(col => {
      if (col.editable) {
        initialValues[col.key] = col.getRawValue ? col.getRawValue(item) : (item as any)[col.key];
      }
    });
    setEditValues(initialValues);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (item: T) => {
    if (!onSaveInlineEdit) return;
    setIsSavingEdit(true);
    try {
      await onSaveInlineEdit(item, editValues as Partial<T>);
      setEditingRowId(null);
      setEditValues({});
    } catch (err) {
      console.error('Failed to save inline edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Export to Excel (.xlsx) ──────────────────────────────────────────────
  const handleExportXLSX = (onlySelected: boolean = false) => {
    const listToExport = onlySelected && selectedItems.length > 0 ? selectedItems : sortedData;
    if (listToExport.length === 0) return;

    // Header metadata rows if provided
    const headerRows: any[] = [];
    if (exportTitle || exportMetadata) {
      headerRows.push({ 'Col1': 'SWARRNIM STARTUP & INNOVATION UNIVERSITY' });
      if (exportTitle) headerRows.push({ 'Col1': exportTitle });
      if (exportMetadata) {
        Object.entries(exportMetadata).forEach(([k, v]) => {
          headerRows.push({ 'Col1': `${k}: ${v}` });
        });
      }
      headerRows.push({ 'Col1': `Generated: ${new Date().toLocaleString()}` });
      headerRows.push({}); // Empty separator row
    }

    // Build data rows matching active columns
    const dataRows = listToExport.map((item, idx) => {
      const row: Record<string, any> = { '#': idx + 1 };
      activeColumns.forEach(col => {
        if (col.key === 'select' || col.key === 'actions') return;
        const val = col.getRawValue ? col.getRawValue(item) : (item as any)[col.key];
        row[col.header] = val !== undefined && val !== null ? val : '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);

    // Auto-calculate column widths
    const colKeys = Object.keys(dataRows[0] || {});
    const colWidths = colKeys.map(k => {
      const maxLen = Math.max(
        k.length,
        ...dataRows.map(r => String(r[k] || '').length)
      );
      return { wch: Math.min(45, Math.max(10, maxLen + 3)) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Register');
    const filename = `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ─── Export to CSV ────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const dataRows = sortedData.map((item, idx) => {
      const row: Record<string, any> = { '#': idx + 1 };
      activeColumns.forEach(col => {
        if (col.key === 'select' || col.key === 'actions') return;
        const val = col.getRawValue ? col.getRawValue(item) : (item as any)[col.key];
        row[col.header] = val !== undefined && val !== null ? val : '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Print Handler ────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      
      {/* ═══ SPREADSHEET TOOLBAR & CONTROLS ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: '0.85rem 1.15rem', 
          background: '#FFFFFF', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {/* Top Header if title is provided */}
        {(title || subtitle) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              {title && (
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {toolbarExtra && <div>{toolbarExtra}</div>}
          </div>
        )}

        {/* Search, Dependent Filters & Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left Group: Search and Dependent Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flex: '1 1 500px' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
              <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', height: '32px', fontSize: '0.78125rem' }}
              />
            </div>

            {/* Dynamic Filter Dropdowns */}
            {filters.map(filt => (
              <div key={filt.key} style={{ minWidth: '130px', flex: '0 1 auto' }}>
                <select
                  className="form-control"
                  value={filt.value}
                  disabled={filt.disabled}
                  onChange={e => onFilterChange && onFilterChange(filt.key, e.target.value)}
                  style={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    fontWeight: filt.disabled ? 700 : 500,
                    background: filt.disabled ? '#F1F5F9' : '#FFFFFF' 
                  }}
                  title={filt.tooltip || filt.label}
                >
                  {filt.options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Reset Filters */}
            {onResetFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onResetFilters();
                }}
                className="btn btn-outline btn-sm"
                style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                title="Reset All Filters to Default"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}

          </div>

          {/* Right Group: Excel Spreadsheet Utilities */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Density Toggle */}
            <button
              type="button"
              onClick={toggleDensity}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              title={`Toggle Row Density (Current: ${density})`}
            >
              <Layers size={13} /> {density === 'COMPACT' ? 'Compact' : 'Comfortable'}
            </button>

            {/* Refresh */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="btn btn-secondary btn-sm"
                style={{ height: '32px', padding: '0 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}
                title="Refresh Dataset"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}

            {/* Column Visibility Picker */}
            <div style={{ position: 'relative' }} ref={columnPickerRef}>
              <button
                type="button"
                onClick={() => setIsColumnPickerOpen(prev => !prev)}
                className="btn btn-secondary btn-sm"
                style={{ height: '32px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                title="Customize Visible Columns"
              >
                <SlidersHorizontal size={13} /> Columns ({activeColumns.length}/{columns.length})
              </button>

              {isColumnPickerOpen && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '36px', 
                  background: '#FFFFFF', 
                  border: '1px solid #CBD5E1', 
                  borderRadius: '6px', 
                  padding: '0.65rem', 
                  width: '240px', 
                  zIndex: 20, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>
                    <span>TOGGLE COLUMNS</span>
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-orange, #F37023)', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                    >
                      Reset
                    </button>
                  </div>
                  {columns.map(col => (
                    <label 
                      key={col.key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.75rem', 
                        padding: '3px 0', 
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumnKeys.has(col.key)}
                        onChange={() => handleToggleColumn(col.key)}
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Export XLSX */}
            <button
              type="button"
              onClick={() => handleExportXLSX(false)}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Export filtered records to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} color="#10B981" /> Export (.xlsx)
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Export as CSV text file"
            >
              <Download size={13} /> CSV
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', padding: '0 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}
              title="Print Table View"
            >
              <Printer size={13} />
            </button>

            {/* Last updated timestamp */}
            {lastUpdated && (
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}>
                Updated: {typeof lastUpdated === 'string' ? lastUpdated : lastUpdated.toLocaleTimeString()}
              </span>
            )}

          </div>

        </div>

        {/* Error message banner */}
        {error && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.85rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#991B1B', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn btn-xs btn-outline" style={{ fontSize: '0.6875rem' }}>
                Retry
              </button>
            )}
          </div>
        )}

        {/* ═══ BULK SELECTION ACTIONS BAR ═══ */}
        {enableSelection && selectedIds.size > 0 && (
          <div style={{ 
            marginTop: '0.65rem', 
            padding: '0.45rem 0.85rem', 
            background: '#EFF6FF', 
            border: '1px solid #BFDBFE', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 800, color: '#1E40AF' }}>
                ✓ {selectedIds.size} of {totalRecords} Records Selected
              </span>

              {!isAllTotalSelected && totalRecords > paginatedData.length && (
                <button
                  type="button"
                  onClick={handleSelectAllTotal}
                  style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.75rem' }}
                >
                  Select all {totalRecords} records across all pages
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleExportXLSX(true)}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}
              >
                <Download size={12} /> Export Selected ({selectedIds.size})
              </button>

              {bulkActions.map(act => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => act.onClick(selectedItems)}
                  className={`btn btn-sm ${act.variant === 'primary' ? 'btn-primary' : act.variant === 'danger' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  {act.icon} {act.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearSelection}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═══ SPREADSHEET TABLE GRID CONTAINER ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: 0, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          border: '1px solid #CBD5E1', 
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '0.8125rem',
              textAlign: 'left'
            }}
          >
            {/* Sticky Table Header */}
            <thead 
              style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 4, 
                background: '#0B192C', 
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <tr>
                {/* Checkbox Column */}
                {enableSelection && (
                  <th style={{ width: '42px', padding: '0.65rem 0.4rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                    <input
                      type="checkbox"
                      checked={isPageAllSelected}
                      onChange={handleToggleSelectPage}
                      style={{ cursor: 'pointer', transform: 'scale(1.05)' }}
                      title={isPageAllSelected ? 'Deselect Page' : 'Select Visible Page'}
                    />
                  </th>
                )}

                {/* Data Columns */}
                {activeColumns.map(col => {
                  const isSorted = sortColumnKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleColumnSort(col.key, col.sortable)}
                      style={{
                        padding: '0.65rem 0.65rem',
                        fontWeight: 800,
                        textAlign: col.align || 'left',
                        width: col.width,
                        minWidth: col.minWidth || '80px',
                        cursor: col.sortable !== false ? 'pointer' : 'default',
                        userSelect: 'none',
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} style={{ color: 'var(--brand-orange, #F37023)', marginLeft: '4px', verticalAlign: 'middle' }} />
                          ) : (
                            <ArrowDown size={12} style={{ color: 'var(--brand-orange, #F37023)', marginLeft: '4px', verticalAlign: 'middle' }} />
                          )
                        ) : (
                          <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: '4px', verticalAlign: 'middle' }} />
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + (enableSelection ? 1 : 0)} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <Layers size={36} style={{ opacity: 0.3, margin: '0 auto 0.65rem' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                      {emptyMessage}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                      {emptyDescription}
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const isSelected = selectedIds.has(item[keyField] as any);
                  const isEditing = editingRowId === item[keyField];
                  const highlightBg = rowHighlightPredicate ? rowHighlightPredicate(item) : undefined;
                  const rowBg = isSelected 
                    ? '#EFF6FF' 
                    : highlightBg || (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC');

                  return (
                    <tr
                      key={String(item[keyField])}
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid #E2E8F0',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      {/* Checkbox */}
                      {enableSelection && (
                        <td style={{ 
                          padding: density === 'COMPACT' ? '0.35rem 0.4rem' : '0.65rem 0.5rem', 
                          textAlign: 'center', 
                          borderRight: '1px solid #E2E8F0' 
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(item[keyField] as any)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      )}

                      {/* Columns */}
                      {activeColumns.map(col => {
                        const isColEditable = enableInlineEditing && col.editable && isEditing;
                        const cellVal = (editValues as any)[col.key] !== undefined 
                          ? (editValues as any)[col.key] 
                          : (item as any)[col.key];

                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: density === 'COMPACT' ? '0.35rem 0.55rem' : '0.65rem 0.75rem',
                              fontSize: density === 'COMPACT' ? '0.78125rem' : '0.8125rem',
                              lineHeight: 1.35,
                              textAlign: col.align || 'left',
                              borderRight: '1px solid #E2E8F0',
                              verticalAlign: 'middle',
                              color: '#334155'
                            }}
                          >
                            {isColEditable ? (
                              col.editType === 'number' ? (
                                <input
                                  type="number"
                                  className="form-control"
                                  value={cellVal ?? ''}
                                  onChange={e => setEditValues(prev => ({ ...prev, [col.key]: Number(e.target.value) }))}
                                  style={{ height: '28px', fontSize: '0.75rem', width: '75px', textAlign: 'center' }}
                                />
                              ) : col.editType === 'select' && col.editOptions ? (
                                <select
                                  className="form-control"
                                  value={cellVal}
                                  onChange={e => setEditValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                                  style={{ height: '28px', fontSize: '0.75rem' }}
                                >
                                  {col.editOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  value={cellVal ?? ''}
                                  onChange={e => setEditValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                                  style={{ height: '28px', fontSize: '0.75rem' }}
                                />
                              )
                            ) : (
                              col.render ? col.render(item, (currentPage - 1) * pageSize + idx) : (item as any)[col.key]
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ PAGINATION & FOOTER STATUS ═══ */}
        <div 
          style={{ 
            padding: '0.65rem 1rem', 
            background: '#F8FAFC', 
            borderTop: '1px solid #E2E8F0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          {/* Status count */}
          <div>
            Showing <strong>{totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>–<strong>{Math.min(totalRecords, currentPage * pageSize)}</strong> of <strong>{totalRecords}</strong> Records
          </div>

          {/* Page size dropdown and page navigators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ height: '28px', fontSize: '0.725rem', width: '70px', padding: '0 4px' }}
              >
                {pageSizeOptions.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ height: '28px', padding: '0 6px', fontSize: '0.7rem' }}
                title="First Page"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ height: '28px', padding: '0 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              <span style={{ padding: '0 6px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ height: '28px', padding: '0 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                Next <ChevronRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ height: '28px', padding: '0 6px', fontSize: '0.7rem' }}
                title="Last Page"
              >
                »
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
