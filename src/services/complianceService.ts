import { prisma } from './databaseService';
import type { AcademicBankOfCredit, AcademicCreditLedger, AbcSyncRecord } from '@prisma/client';

/**
 * SSIU ERP — Govt & NEP Compliance API Service (Academic Bank of Credits)
 * File: src/services/complianceService.ts
 *
 * Implements authoritative Prisma backend service functions for:
 * 1. Linking student ABC (Academic Bank of Credits) / APAAR ID
 * 2. Fetching student ABC credit details and ledger entries
 */

export interface StudentABCDetailsResponse extends AcademicBankOfCredit {
  creditEntries?: AcademicCreditLedger[];
  syncRecords?: AbcSyncRecord[];
}

export interface LinkABCResult {
  success: boolean;
  message: string;
  data?: AcademicBankOfCredit;
  error?: string;
}

/**
 * Links a student with their Academic Bank of Credits (ABC / APAAR) ID.
 * Creates a new record in the AcademicBankOfCredit table.
 * Handles duplicate entry conflicts for both studentId and abcId.
 *
 * @param studentId Unique identifier of the student
 * @param abcId 12-digit APAAR / ABC identifier
 * @param totalCredits Total accumulated academic credits
 * @returns Promise resolving to the created AcademicBankOfCredit record
 * @throws Error if the student or ABC ID is already registered, or on validation/database failure
 */
export async function linkABCId(
  studentId: string,
  abcId: string,
  totalCredits: number = 0
): Promise<AcademicBankOfCredit> {
  if (!studentId || !studentId.trim()) {
    throw new Error('Student ID is required to link an ABC account.');
  }

  const cleanedAbcId = abcId ? abcId.trim() : '';
  if (!cleanedAbcId) {
    throw new Error('ABC ID is required.');
  }

  // Pre-check for existing registration
  const existingStudentABC = await prisma.academicBankOfCredit.findFirst({
    where: {
      OR: [
        { studentId: studentId.trim() },
        { abcId: cleanedAbcId }
      ]
    }
  });

  if (existingStudentABC) {
    if (existingStudentABC.studentId === studentId.trim()) {
      throw new Error(`Academic Bank of Credit record already exists for student ID: ${studentId}`);
    }
    if (existingStudentABC.abcId === cleanedAbcId) {
      throw new Error(`ABC ID ${cleanedAbcId} is already linked to another student record.`);
    }
  }

  try {
    const newEntry = await prisma.academicBankOfCredit.create({
      data: {
        studentId: studentId.trim(),
        abcId: cleanedAbcId,
        totalCredits: Math.max(0, Math.floor(totalCredits)),
        status: 'ACTIVE',
        verificationStatus: 'PENDING_VERIFICATION',
        syncStatus: 'NOT_SYNCED',
        tenantId: 'DEFAULT',
      }
    });

    return newEntry;
  } catch (error: any) {
    // Handle Prisma Unique Constraint Violation (P2002)
    if (error?.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(', ')
        : error?.meta?.target || 'studentId/abcId';
      throw new Error(`Unique constraint violation: ABC entry already exists for ${target}.`);
    }

    throw new Error(`Failed to link ABC ID: ${error?.message || String(error)}`);
  }
}

/**
 * Retrieves the Academic Bank of Credit details and linked credit entries for a student.
 *
 * @param studentId Unique identifier of the student
 * @returns Promise resolving to the student's ABC record with credit entries, or null if not found
 */
export async function getStudentABCDetails(
  studentId: string
): Promise<StudentABCDetailsResponse | null> {
  if (!studentId || !studentId.trim()) {
    throw new Error('Student ID is required to fetch ABC details.');
  }

  const details = await prisma.academicBankOfCredit.findUnique({
    where: {
      studentId: studentId.trim()
    },
    include: {
      creditEntries: true,
      syncRecords: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });

  return details;
}

export const complianceService = {
  linkABCId,
  getStudentABCDetails,
};

export default complianceService;
