import { prisma } from './databaseService';
import type { StartupResearchGrant } from '@prisma/client';

/**
 * SSIU ERP — Startup, SSIP & Grant Management Backend API Service
 * File: src/services/grantService.ts
 *
 * Implements authoritative Prisma operations for:
 * 1. Allocating new institutional/government research & startup grants
 * 2. Incrementing and tracking expenditure against sanctioned budget limits
 * 3. Aggregating grant financial summaries for executive & departmental dashboards
 */

export interface GrantSummaryReport {
  totalGrants: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBalance: number;
  utilizationPercentage: number;
  grants: StartupResearchGrant[];
}

/**
 * Allocates a new research/startup grant in the system.
 *
 * @param title Title or project name associated with the grant
 * @param grantType Funding agency or grant scheme (e.g., "SSIP", "DST", "AICTE", "GUJCOST", "SERB")
 * @param amountAllocated Sanctioned grant budget in INR
 * @param facultyId Unique identifier of the Principal Investigator / Faculty Lead
 * @returns Promise resolving to the created StartupResearchGrant record
 */
export async function allocateGrant(
  title: string,
  grantType: string,
  amountAllocated: number,
  facultyId: string
): Promise<StartupResearchGrant> {
  if (!title || !title.trim()) {
    throw new Error('Grant title is required.');
  }
  if (!grantType || !grantType.trim()) {
    throw new Error('Grant type / funding agency is required.');
  }
  if (typeof amountAllocated !== 'number' || isNaN(amountAllocated) || amountAllocated <= 0) {
    throw new Error('Amount allocated must be a positive number.');
  }
  if (!facultyId || !facultyId.trim()) {
    throw new Error('Faculty / Principal Investigator ID is required.');
  }

  const cleanTitle = title.trim();
  const cleanGrantType = grantType.trim().toUpperCase();
  const cleanFacultyId = facultyId.trim();

  const newGrant = await prisma.startupResearchGrant.create({
    data: {
      title: cleanTitle,
      grantType: cleanGrantType,
      amountAllocated,
      amountSpent: 0.0,
      facultyId: cleanFacultyId,
      status: 'ACTIVE',
    },
  });

  return newGrant;
}

/**
 * Updates expenditure for an active grant by adding additional spend amount.
 * Validates that the cumulative expenditure does not exceed the sanctioned allocation.
 *
 * @param grantId Unique identifier of the grant record
 * @param additionalSpend Additional expenditure amount to record in INR
 * @returns Promise resolving to the updated StartupResearchGrant record
 */
export async function updateSpentAmount(
  grantId: string,
  additionalSpend: number
): Promise<StartupResearchGrant> {
  if (!grantId || !grantId.trim()) {
    throw new Error('Grant ID is required.');
  }
  if (typeof additionalSpend !== 'number' || isNaN(additionalSpend) || additionalSpend <= 0) {
    throw new Error('Additional spend amount must be a positive number.');
  }

  const cleanGrantId = grantId.trim();

  // Fetch current grant
  const existingGrant = await prisma.startupResearchGrant.findUnique({
    where: { id: cleanGrantId },
  });

  if (!existingGrant) {
    throw new Error(`Grant not found with ID: ${cleanGrantId}`);
  }

  const currentSpent = existingGrant.amountSpent || 0;
  const allocated = existingGrant.amountAllocated || 0;
  const newSpent = currentSpent + additionalSpend;

  // Strict budget cap validation
  if (newSpent > allocated) {
    throw new Error(
      `Expenditure exceeds allocated budget! Attempted cumulative spend of ₹${newSpent.toLocaleString()} exceeds allocated limit of ₹${allocated.toLocaleString()} (Remaining budget: ₹${(allocated - currentSpent).toLocaleString()}).`
    );
  }

  const updatedGrant = await prisma.startupResearchGrant.update({
    where: { id: cleanGrantId },
    data: {
      amountSpent: newSpent,
      updatedAt: new Date(),
    },
  });

  return updatedGrant;
}

/**
 * Retrieves all grants and computes an aggregate financial utilization summary for dashboards.
 *
 * @returns Promise resolving to the GrantSummaryReport containing totals and list of grants
 */
export async function getGrantsSummary(): Promise<GrantSummaryReport> {
  const grants = await prisma.startupResearchGrant.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalGrants = grants.length;
  let totalAllocated = 0;
  let totalSpent = 0;

  for (const g of grants) {
    totalAllocated += g.amountAllocated || 0;
    totalSpent += g.amountSpent || 0;
  }

  const remainingBalance = totalAllocated - totalSpent;
  const utilizationPercentage = totalAllocated > 0
    ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2))
    : 0;

  return {
    totalGrants,
    totalAllocated,
    totalSpent,
    remainingBalance,
    utilizationPercentage,
    grants,
  };
}

export const grantService = {
  allocateGrant,
  updateSpentAmount,
  getGrantsSummary,
};

export default grantService;
