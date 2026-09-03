import React from 'react';

export interface ExcelTableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  minWidth?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const ExcelTableContainer: React.FC<ExcelTableContainerProps> = ({
  children,
  minWidth,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`erp-excel-table-container ${className}`}
      style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        ...style
      }}
      {...props}
    >
      <div style={{ minWidth: minWidth || '100%' }}>
        {children}
      </div>
    </div>
  );
};

export interface ExcelTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  minWidth?: string | number;
}

export const ExcelTable: React.FC<ExcelTableProps> = ({
  children,
  className = '',
  minWidth,
  style,
  ...props
}) => {
  return (
    <table
      className={`erp-excel-table ${className}`}
      style={{
        minWidth: minWidth,
        ...style
      }}
      {...props}
    >
      {children}
    </table>
  );
};

export interface ExcelCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
  bold?: boolean;
  color?: string;
  children?: React.ReactNode;
}

export const ExcelTh: React.FC<ExcelCellProps> = ({
  align = 'left',
  mono = false,
  bold = true,
  color,
  children,
  className = '',
  style,
  ...props
}) => {
  const alignClass = align === 'right' ? 'cell-right' : align === 'center' ? 'cell-center' : 'cell-left';
  const monoClass = mono ? 'cell-mono' : '';

  return (
    <th
      className={`${alignClass} ${monoClass} ${className}`}
      style={{
        textAlign: align,
        color: color || '#0F172A',
        fontWeight: bold ? 700 : 500,
        ...style
      }}
      {...props}
    >
      {children}
    </th>
  );
};

export const ExcelTd: React.FC<ExcelCellProps> = ({
  align = 'left',
  mono = false,
  bold = false,
  color,
  children,
  className = '',
  style,
  ...props
}) => {
  const alignClass = align === 'right' ? 'cell-right' : align === 'center' ? 'cell-center' : 'cell-left';
  const monoClass = mono ? 'cell-mono' : '';

  return (
    <td
      className={`${alignClass} ${monoClass} ${className}`}
      style={{
        textAlign: align,
        color: color || 'inherit',
        fontWeight: bold ? 700 : 'normal',
        ...style
      }}
      {...props}
    >
      {children}
    </td>
  );
};
