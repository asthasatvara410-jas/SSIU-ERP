import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { feesFinanceScholarshipGovernanceService } from './feesFinanceScholarshipGovernanceService';

export interface BookMasterRecord {
  id: string;
  isbn: string;
  title: string;
  authorNames: string[];
  publisherName: string;
  edition: string;
  publicationYear: number;
  category: string;
  totalCopies: number;
}

export interface BookCopyRecord {
  id: string;
  bookId: string;
  accessionNumber: string;
  barcode: string;
  locationShelf: string;
  status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'DAMAGED' | 'LOST';
  condition: 'NEW' | 'GOOD' | 'DAMAGED';
}

export interface BookCirculationRecord {
  id: string;
  issueNumber: string;
  memberId: string;
  copyId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  renewalCount: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface LibraryFineRecord {
  id: string;
  circulationId: string;
  memberId: string;
  fineAmount: number;
  daysOverdue: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
}

export interface DigitalResourceRecord {
  id: string;
  title: string;
  resourceType: 'E_BOOK' | 'E_JOURNAL' | 'RESEARCH_DATABASE';
  provider: string;
  accessUrl: string;
  licenseValidUntil: string;
  status: 'ACTIVE' | 'EXPIRED';
}

class LibraryManagementGovernanceService {
  private static instance: LibraryManagementGovernanceService;

  private books: BookMasterRecord[] = [
    {
      id: 'bk-01',
      isbn: '978-0078022159',
      title: 'Database System Concepts',
      authorNames: ['Abraham Silberschatz', 'Henry F. Korth', 'S. Sudarshan'],
      publisherName: 'McGraw-Hill Education',
      edition: '7th Edition',
      publicationYear: 2020,
      category: 'Computer Science',
      totalCopies: 5
    }
  ];

  private copies: BookCopyRecord[] = [
    { id: 'cpy-01', bookId: 'bk-01', accessionNumber: 'ACC-2026-000101', barcode: 'BAR-DB-01', locationShelf: 'Rack 4 - Shelf B', status: 'AVAILABLE', condition: 'GOOD' },
    { id: 'cpy-02', bookId: 'bk-01', accessionNumber: 'ACC-2026-000102', barcode: 'BAR-DB-02', locationShelf: 'Rack 4 - Shelf B', status: 'ISSUED', condition: 'GOOD' },
    { id: 'cpy-03', bookId: 'bk-01', accessionNumber: 'ACC-2026-000103', barcode: 'BAR-DB-03', locationShelf: 'Rack 4 - Shelf B', status: 'AVAILABLE', condition: 'GOOD' },
    { id: 'cpy-04', bookId: 'bk-01', accessionNumber: 'ACC-2026-000104', barcode: 'BAR-DB-04', locationShelf: 'Rack 4 - Shelf B', status: 'AVAILABLE', condition: 'GOOD' },
    { id: 'cpy-05', bookId: 'bk-01', accessionNumber: 'ACC-2026-000105', barcode: 'BAR-DB-05', locationShelf: 'Rack 4 - Shelf B', status: 'DAMAGED', condition: 'DAMAGED' }
  ];

  private circulations: BookCirculationRecord[] = [
    {
      id: 'circ-01',
      issueNumber: 'ISS-2026-000412',
      memberId: 'stud-001',
      copyId: 'cpy-02',
      issueDate: '2026-08-10',
      dueDate: '2026-08-24',
      renewalCount: 0,
      status: 'OVERDUE'
    }
  ];

  private fines: LibraryFineRecord[] = [
    {
      id: 'fine-01',
      circulationId: 'circ-01',
      memberId: 'stud-001',
      fineAmount: 80, // 4 days * 20 Rs
      daysOverdue: 4,
      status: 'PENDING'
    }
  ];

  private digitalResources: DigitalResourceRecord[] = [
    {
      id: 'dig-01',
      title: 'IEEE Xplore Digital Library Subscription',
      resourceType: 'RESEARCH_DATABASE',
      provider: 'IEEE',
      accessUrl: 'https://ieeexplore.ieee.org',
      licenseValidUntil: '2027-12-31',
      status: 'ACTIVE'
    }
  ];

  private constructor() {}

  public static getInstance(): LibraryManagementGovernanceService {
    if (!LibraryManagementGovernanceService.instance) {
      LibraryManagementGovernanceService.instance = new LibraryManagementGovernanceService();
    }
    return LibraryManagementGovernanceService.instance;
  }

  // ─── BOOK AVAILABILITY & CIRCULATION ENGINE ───────────────────────────

  public getBookAvailability(bookId: string): {
    total: number;
    available: number;
    issued: number;
    damaged: number;
  } {
    const bookCopies = this.copies.filter(c => c.bookId === bookId);
    return {
      total: bookCopies.length,
      available: bookCopies.filter(c => c.status === 'AVAILABLE').length,
      issued: bookCopies.filter(c => c.status === 'ISSUED').length,
      damaged: bookCopies.filter(c => c.status === 'DAMAGED').length
    };
  }

  public issueBook(params: {
    copyId: string;
    memberId: string;
    memberType: 'STUDENT' | 'FACULTY' | 'STAFF';
  }): BookCirculationRecord {
    const copy = this.copies.find(c => c.id === params.copyId);
    if (!copy) throw new Error(`Book copy ${params.copyId} not found`);

    if (copy.status !== 'AVAILABLE') {
      throw new Error(`Book copy ${copy.accessionNumber} cannot be issued because status is ${copy.status}`);
    }

    copy.status = 'ISSUED';
    const loanDays = params.memberType === 'FACULTY' ? 30 : 14;
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    const newCirc: BookCirculationRecord = {
      id: `circ-${Date.now()}`,
      issueNumber: `ISS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      memberId: params.memberId,
      copyId: params.copyId,
      issueDate: issueDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      renewalCount: 0,
      status: 'ISSUED'
    };

    this.circulations.push(newCirc);
    return newCirc;
  }

  // ─── LIBRARY CLEARANCE ENGINE ─────────────────────────────────────────

  public getMemberLibraryClearance(memberId: string): {
    status: 'CLEARED' | 'PENDING' | 'BLOCKED';
    activeIssuedCount: number;
    pendingFineAmount: number;
  } {
    const activeIssues = this.circulations.filter(c => c.memberId === memberId && (c.status === 'ISSUED' || c.status === 'OVERDUE'));
    const pendingFines = this.fines.filter(f => f.memberId === memberId && f.status === 'PENDING');
    const totalPendingFine = pendingFines.reduce((sum, f) => sum + f.fineAmount, 0);

    const isBlocked = activeIssues.length > 0 || totalPendingFine > 0;

    return {
      status: isBlocked ? 'BLOCKED' : 'CLEARED',
      activeIssuedCount: activeIssues.length,
      pendingFineAmount: totalPendingFine
    };
  }

  public getDigitalResources(): DigitalResourceRecord[] {
    return this.digitalResources;
  }
}

export const libraryManagementGovernanceService = LibraryManagementGovernanceService.getInstance();
