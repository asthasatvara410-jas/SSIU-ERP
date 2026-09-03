// ==============================================================================
// SWARRNIM STARTUP & INNOVATION UNIVERSITY — ADMISSION UTILITIES
// Central reusable utility for:
//   - Academic Year determination (July 1 boundary rule)
//   - Application Number / Admission Number generation (via db layer)
//   - Date formatting (DD/MM/YYYY)
// ==============================================================================

/**
 * UNIVERSITY ACADEMIC YEAR CONFIGURATION
 * Academic year starts on 1 July each year.
 * e.g. 01/07/2026 → 2027/06/30 = Academic Year 2026-27
 *      01/07/2027 → 2028/06/30 = Academic Year 2027-28
 */
const ACADEMIC_YEAR_START_MONTH = 7; // July (1-indexed)
const ACADEMIC_YEAR_START_DAY = 1;

/**
 * Get academic year label string (e.g. "2026-27") from a given date.
 *
 * Uses the university's July 1 boundary rule:
 *   - If date >= July 1 of year Y   → Academic Year = "Y-(Y+1 short)"   → e.g. 2026-27
 *   - If date < July 1 of year Y    → Academic Year = "(Y-1)-Y short"   → e.g. 2025-26
 *
 * @param date - Date object, ISO string (YYYY-MM-DD), or undefined (defaults to today)
 * @returns Academic year label e.g. "2026-27"
 */
export function getAcademicYearFromDate(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();

  // Guard against invalid dates
  if (isNaN(d.getTime())) {
    const now = new Date();
    return _computeAcademicYear(now);
  }

  return _computeAcademicYear(d);
}

function _computeAcademicYear(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed
  const day = d.getDate();

  // Check if on or after July 1 of the current year
  const isOnOrAfterStart =
    month > ACADEMIC_YEAR_START_MONTH ||
    (month === ACADEMIC_YEAR_START_MONTH && day >= ACADEMIC_YEAR_START_DAY);

  const startYear = isOnOrAfterStart ? year : year - 1;
  const endYear = startYear + 1;

  // Short 2-digit suffix for the end year (e.g. 2026 → 27, 2029 → 30)
  const endYearShort = String(endYear).slice(-2);

  return `${startYear}-${endYearShort}`;
}

/**
 * Get academic year start calendar year from a date.
 * e.g. for date 2026-08-24, returns 2026 (start of 2026-27)
 */
export function getAcademicYearStartYear(date?: Date | string | null): number {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const isOnOrAfterStart =
    month > ACADEMIC_YEAR_START_MONTH ||
    (month === ACADEMIC_YEAR_START_MONTH && day >= ACADEMIC_YEAR_START_DAY);

  return isOnOrAfterStart ? year : year - 1;
}

/**
 * Format a date as DD/MM/YYYY for display in the ERP UI.
 * @param date - ISO string, Date, or undefined (defaults to today)
 * @returns Formatted date string e.g. "24/08/2026"
 */
export function formatAdmissionDate(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return _formatDDMMYYYY(now);
  }
  return _formatDDMMYYYY(d);
}

function _formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Get today's date as ISO YYYY-MM-DD string (for storing in database).
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get today's date formatted as DD/MM/YYYY (for display).
 */
export function getTodayFormatted(): string {
  return formatAdmissionDate(new Date());
}
