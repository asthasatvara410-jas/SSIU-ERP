import { prisma } from './databaseService';
import type { GrievanceTicket } from '@prisma/client';

/**
 * SSIU ERP — UGC Grievance System Backend API Service
 * File: src/services/grievanceService.ts
 *
 * Provides backend service operations for:
 * 1. Registering student/faculty grievance tickets (with strict identity shielding for anonymous submissions)
 * 2. Admin & ICC Committee ticket retrieval with status filtering
 * 3. Administrative ticket status updates and progressive escalation tracking
 */

export interface CreateGrievanceTicketParams {
  category: string;
  description: string;
  isAnonymous: boolean;
  studentId?: string;
}

export interface UpdateTicketStatusParams {
  ticketId: string;
  newStatus: string;
  escalationLevel?: number;
}

/**
 * Creates a new grievance ticket in the database.
 * 
 * Strict Anonymity Guarantee:
 * If `isAnonymous` is true, the `studentId` parameter is strictly ignored / omitted
 * to ensure that no student identity is persisted or linked to the ticket.
 *
 * @param category Grievance category (e.g., "Ragging", "Harassment", "Academic", "Infrastructure", "Administrative")
 * @param description Detailed description of the grievance issue
 * @param isAnonymous Whether the complaint is filed anonymously
 * @param studentId Optional student identifier (strictly ignored if isAnonymous is true)
 * @returns Promise resolving to the created GrievanceTicket record
 */
export async function createGrievanceTicket(
  category: string,
  description: string,
  isAnonymous: boolean,
  studentId?: string
): Promise<GrievanceTicket> {
  if (!category || !category.trim()) {
    throw new Error('Grievance category is required.');
  }
  if (!description || !description.trim()) {
    throw new Error('Grievance description is required.');
  }

  const cleanCategory = category.trim();
  const cleanDescription = description.trim();
  const anonymousFlag = Boolean(isAnonymous);

  // If isAnonymous is true, studentId is strictly ignored or saved as null to protect identity.
  // The GrievanceTicket model stores isAnonymous, category, description, status, escalationLevel.
  const ticket = await prisma.grievanceTicket.create({
    data: {
      category: cleanCategory,
      description: cleanDescription,
      isAnonymous: anonymousFlag,
      status: 'Pending',
      escalationLevel: 0,
    },
  });

  return ticket;
}

/**
 * Fetches grievance tickets for the Admin / ICC Committee with optional status filtering.
 *
 * @param status Optional filter for ticket status (e.g., "Pending", "InProgress", "Resolved")
 * @returns Promise resolving to a list of matching GrievanceTicket records
 */
export async function getGrievanceTickets(status?: string): Promise<GrievanceTicket[]> {
  const whereClause = status && status.trim()
    ? { status: status.trim() }
    : {};

  const tickets = await prisma.grievanceTicket.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tickets;
}

/**
 * Updates the progress status and optional escalation level of an existing grievance ticket.
 *
 * @param ticketId Unique identifier of the ticket to update
 * @param newStatus Updated progress status (e.g., "Pending", "InProgress", "Resolved", "Escalated")
 * @param escalationLevel Optional numeric escalation tier (e.g., 1 for HOD, 2 for Registrar, 3 for VC)
 * @returns Promise resolving to the updated GrievanceTicket record
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: string,
  escalationLevel?: number
): Promise<GrievanceTicket> {
  if (!ticketId || !ticketId.trim()) {
    throw new Error('Ticket ID is required.');
  }
  if (!newStatus || !newStatus.trim()) {
    throw new Error('New status is required.');
  }

  const cleanTicketId = ticketId.trim();
  const cleanStatus = newStatus.trim();

  // Verify ticket exists
  const existingTicket = await prisma.grievanceTicket.findUnique({
    where: { id: cleanTicketId },
  });

  if (!existingTicket) {
    throw new Error(`Grievance ticket not found with ID: ${cleanTicketId}`);
  }

  const updateData: { status: string; escalationLevel?: number; updatedAt: Date } = {
    status: cleanStatus,
    updatedAt: new Date(),
  };

  if (typeof escalationLevel === 'number' && !isNaN(escalationLevel)) {
    updateData.escalationLevel = escalationLevel;
  }

  const updatedTicket = await prisma.grievanceTicket.update({
    where: { id: cleanTicketId },
    data: updateData,
  });

  return updatedTicket;
}

export const grievanceService = {
  createGrievanceTicket,
  getGrievanceTickets,
  updateTicketStatus,
};

export default grievanceService;
