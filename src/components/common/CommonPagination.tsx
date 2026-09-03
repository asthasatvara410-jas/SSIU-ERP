// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED PAGINATION COMPONENT
// ==============================================================================

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface CommonPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  style?: React.CSSProperties;
}

export const CommonPagination: React.FC<CommonPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
  style
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`common-pagination ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #E2E8F0)',
        fontSize: '0.8125rem',
        color: 'var(--text-color, #1E293B)',
        ...style
      }}
    >
      {/* Showing results indicator & page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted, #64748B)' }}>
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.75rem' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '2px 6px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color, #CBD5E1)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          style={{ padding: '4px 6px' }}
        >
          <ChevronsLeft size={13} />
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          style={{ padding: '4px 6px' }}
        >
          <ChevronLeft size={13} />
        </button>

        <span style={{ padding: '0 8px', fontWeight: 700, fontSize: '0.75rem' }}>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          style={{ padding: '4px 6px' }}
        >
          <ChevronRight size={13} />
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          style={{ padding: '4px 6px' }}
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
};
