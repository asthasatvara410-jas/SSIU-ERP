import React from 'react';
import { ExcelDataTable, ExcelDataTableProps, ExcelColumn, ExcelFilterOption, ExcelBulkAction } from './ExcelDataTable';

export type ERPDataGridProps<T extends { id: string | number }> = ExcelDataTableProps<T>;
export type ERPColumn<T> = ExcelColumn<T>;
export type ERPFilterOption = ExcelFilterOption;
export type ERPBulkAction<T> = ExcelBulkAction<T>;

/**
 * Universal Enterprise ERP Data Grid
 * Reusable high-performance spreadsheet data-grid with density toggle, search, multi-column sorting,
 * filtering, column visibility persistence, row selection, export to XLSX/CSV, error handling, and sticky headers.
 */
export function ERPDataGrid<T extends { id: string | number }>(props: ERPDataGridProps<T>): React.ReactElement {
  return <ExcelDataTable {...props} />;
}

export { ExcelDataTable };
export default ERPDataGrid;
