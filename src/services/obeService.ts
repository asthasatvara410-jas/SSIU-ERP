import { prisma } from './databaseService';
import type { CourseOutcome, ProgramOutcome, COPOMapping } from '@prisma/client';

/**
 * SSIU ERP — Outcome-Based Education (OBE) Backend API Service
 * File: src/services/obeService.ts
 *
 * Implements authoritative Prisma backend functions for:
 * 1. Course Outcome (CO) creation
 * 2. Program Outcome (PO) creation
 * 3. CO-PO articulation mapping with correlation levels (1 to 3)
 * 4. Fetching structured CO-PO articulation matrix for frontend display
 */

export interface COPOMatrixCell {
  poId: string;
  poCode: string;
  correlationLevel: number;
}

export interface COPOMatrixRow {
  coId: string;
  coCode: string;
  coDescription: string;
  subjectId: string | null;
  mappings: Record<string, number>; // Map of PO Code -> Correlation Level (1-3 or 0)
  cells: COPOMatrixCell[];
}

export interface COPOMatrixResponse {
  programOutcomes: Array<{
    id: string;
    code: string;
    description: string;
  }>;
  courseOutcomes: Array<{
    id: string;
    code: string;
    description: string;
    subjectId: string | null;
  }>;
  matrix: COPOMatrixRow[];
}

/**
 * Creates a new Course Outcome (CO) in the OBE repository.
 *
 * @param code Course Outcome identifier (e.g., "CO1", "CO2")
 * @param description Detailed learning outcome description
 * @param subjectId Associated academic subject/course identifier
 * @returns Promise resolving to the created CourseOutcome record
 */
export async function createCourseOutcome(
  code: string,
  description: string,
  subjectId: string
): Promise<CourseOutcome> {
  if (!code || !code.trim()) {
    throw new Error('Course Outcome code is required (e.g., "CO1").');
  }
  if (!description || !description.trim()) {
    throw new Error('Course Outcome description is required.');
  }
  if (!subjectId || !subjectId.trim()) {
    throw new Error('Subject ID is required to link Course Outcome.');
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanDesc = description.trim();
  const cleanSubjectId = subjectId.trim();

  const newCO = await prisma.courseOutcome.create({
    data: {
      code: cleanCode,
      description: cleanDesc,
      subjectId: cleanSubjectId,
      academicYear: '2025-26',
      version: 'v1.0',
      status: 'ACTIVE',
      tenantId: 'DEFAULT',
    },
  });

  return newCO;
}

/**
 * Creates a new Program Outcome (PO) in the OBE repository.
 *
 * @param code Program Outcome identifier (e.g., "PO1", "PO2")
 * @param description Detailed graduate attribute/outcome description
 * @returns Promise resolving to the created ProgramOutcome record
 */
export async function createProgramOutcome(
  code: string,
  description: string
): Promise<ProgramOutcome> {
  if (!code || !code.trim()) {
    throw new Error('Program Outcome code is required (e.g., "PO1").');
  }
  if (!description || !description.trim()) {
    throw new Error('Program Outcome description is required.');
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanDesc = description.trim();

  const newPO = await prisma.programOutcome.create({
    data: {
      code: cleanCode,
      description: cleanDesc,
      version: 'v1.0',
      status: 'ACTIVE',
      tenantId: 'DEFAULT',
    },
  });

  return newPO;
}

/**
 * Maps a Course Outcome (CO) to a Program Outcome (PO) with correlation weighting.
 * Ensures the correlation level is strictly between 1 (Low) and 3 (High).
 *
 * @param coId Identifier of the Course Outcome
 * @param poId Identifier of the Program Outcome
 * @param correlationLevel Integer correlation level (1 = Low, 2 = Medium, 3 = High)
 * @returns Promise resolving to the created/updated COPOMapping record
 */
export async function mapCOtoPO(
  coId: string,
  poId: string,
  correlationLevel: number
): Promise<COPOMapping> {
  if (!coId || !coId.trim()) {
    throw new Error('Course Outcome ID (coId) is required for mapping.');
  }
  if (!poId || !poId.trim()) {
    throw new Error('Program Outcome ID (poId) is required for mapping.');
  }

  const cleanCoId = coId.trim();
  const cleanPoId = poId.trim();

  // Validate correlation level is an integer between 1 and 3
  if (
    typeof correlationLevel !== 'number' ||
    !Number.isInteger(correlationLevel) ||
    correlationLevel < 1 ||
    correlationLevel > 3
  ) {
    throw new Error(
      `Invalid correlation level: ${correlationLevel}. Correlation level must be an integer between 1 (Low), 2 (Medium), and 3 (High).`
    );
  }

  // Verify existence of Course Outcome
  const existingCO = await prisma.courseOutcome.findUnique({
    where: { id: cleanCoId },
  });
  if (!existingCO) {
    throw new Error(`Course Outcome not found with ID: ${cleanCoId}`);
  }

  // Verify existence of Program Outcome
  const existingPO = await prisma.programOutcome.findUnique({
    where: { id: cleanPoId },
  });
  if (!existingPO) {
    throw new Error(`Program Outcome not found with ID: ${cleanPoId}`);
  }

  // Upsert the CO-PO Mapping record
  const mapping = await prisma.cOPOMapping.upsert({
    where: {
      coId_poId: {
        coId: cleanCoId,
        poId: cleanPoId,
      },
    },
    update: {
      correlationLevel,
      weight: correlationLevel / 3.0,
      updatedAt: new Date(),
    },
    create: {
      coId: cleanCoId,
      poId: cleanPoId,
      correlationLevel,
      weight: correlationLevel / 3.0,
      tenantId: existingCO.tenantId || 'DEFAULT',
    },
  });

  return mapping;
}

/**
 * Fetches all Program Outcomes and Course Outcomes with their active mappings,
 * and structures the data into a 2D matrix suitable for tabular rendering on the frontend.
 *
 * @returns Promise resolving to the structured COPOMatrixResponse
 */
export async function getCOPOMatrix(): Promise<COPOMatrixResponse> {
  const [pos, cos] = await Promise.all([
    prisma.programOutcome.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    }),
    prisma.courseOutcome.findMany({
      where: { status: 'ACTIVE' },
      include: {
        copoMappings: {
          include: {
            programOutcome: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    }),
  ]);

  const matrix: COPOMatrixRow[] = cos.map((co) => {
    const mappings: Record<string, number> = {};
    const cells: COPOMatrixCell[] = [];

    // Map each PO against the CO
    for (const po of pos) {
      const match = co.copoMappings.find((m) => m.poId === po.id);
      const level = match ? match.correlationLevel : 0;
      mappings[po.code] = level;
      cells.push({
        poId: po.id,
        poCode: po.code,
        correlationLevel: level,
      });
    }

    return {
      coId: co.id,
      coCode: co.code,
      coDescription: co.description,
      subjectId: co.subjectId,
      mappings,
      cells,
    };
  });

  return {
    programOutcomes: pos.map((po) => ({
      id: po.id,
      code: po.code,
      description: po.description,
    })),
    courseOutcomes: cos.map((co) => ({
      id: co.id,
      code: co.code,
      description: co.description,
      subjectId: co.subjectId,
    })),
    matrix,
  };
}

export const obeService = {
  createCourseOutcome,
  createProgramOutcome,
  mapCOtoPO,
  getCOPOMatrix,
};

export default obeService;
