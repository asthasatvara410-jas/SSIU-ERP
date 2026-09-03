import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD & METRICS (Role Scoped)
  // ══════════════════════════════════════════════════════════════════════════════

  async getDashboard(userId?: string, userRole?: string) {
    const now = new Date();

    const [
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCopies,
      reservedCount,
      activeMembers,
      digitalCount,
      policies,
    ] = await Promise.all([
      this.prisma.book.count({ where: { status: { not: 'ARCHIVED' } } }),
      this.prisma.bookCopy.count({ where: { status: { not: 'WITHDRAWN' } } }),
      this.prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.libraryIssue.count({ where: { status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } } }),
      this.prisma.libraryIssue.count({
        where: {
          status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] },
          dueDate: { lt: now },
        },
      }),
      this.prisma.libraryReservation.count({ where: { status: 'ACTIVE' } }),
      this.prisma.libraryMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.digitalResource.count({ where: { status: 'ACTIVE' } }),
      this.prisma.libraryPolicy.findMany({ where: { status: 'ACTIVE' } }),
    ]);

    // Unpaid fines total
    const unpaidFinesAgg = await this.prisma.libraryFine.aggregate({
      where: { status: 'UNPAID' },
      _sum: { amount: true },
    });
    const outstandingFines = Number(unpaidFinesAgg._sum.amount || 0);

    // If user is STUDENT or FACULTY, provide personalized library stats
    let myStats = null;
    if (userId) {
      const member = await this.prisma.libraryMembership.findFirst({
        where: { userId, status: 'ACTIVE' },
      });

      if (member) {
        const [myIssued, myOverdue, myReservations, myFinesAgg] = await Promise.all([
          this.prisma.libraryIssue.count({
            where: { memberId: member.id, status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } },
          }),
          this.prisma.libraryIssue.count({
            where: {
              memberId: member.id,
              status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] },
              dueDate: { lt: now },
            },
          }),
          this.prisma.libraryReservation.count({
            where: { memberId: member.id, status: 'ACTIVE' },
          }),
          this.prisma.libraryFine.aggregate({
            where: { memberId: member.id, status: 'UNPAID' },
            _sum: { amount: true },
          }),
        ]);

        myStats = {
          membershipNo: member.membershipNo,
          memberType: member.memberType,
          issueLimit: member.issueLimit,
          validity: member.validity,
          myIssued,
          myOverdue,
          myReservations,
          myOutstandingFines: Number(myFinesAgg._sum.amount || 0),
        };
      }
    }

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      issuedBooks: issuedCopies,
      overdueBooks: overdueCopies,
      reservedBooks: reservedCount,
      activeMembers,
      pendingReturns: issuedCopies,
      outstandingFines,
      digitalResources: digitalCount,
      policiesCount: policies.length,
      myStats,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. LIBRARY MASTERS (Library, Section, Shelf, Category, Author, Publisher)
  // ══════════════════════════════════════════════════════════════════════════════

  async getLibraries() {
    return this.prisma.library.findMany({
      include: {
        sections: { include: { shelves: true } },
        _count: { select: { copies: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createLibrary(data: { code: string; name: string; instituteId?: string; location?: string; description?: string }) {
    const existing = await this.prisma.library.findUnique({ where: { code: data.code.trim().toUpperCase() } });
    if (existing) throw new ConflictException(`Library with code '${data.code}' already exists.`);
    return this.prisma.library.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        instituteId: data.instituteId,
        location: data.location,
        description: data.description,
      },
    });
  }

  async getSections(libraryId?: string) {
    return this.prisma.librarySection.findMany({
      where: libraryId ? { libraryId } : undefined,
      include: { library: true, shelves: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSection(data: { libraryId: string; code: string; name: string; description?: string }) {
    return this.prisma.librarySection.create({
      data: {
        libraryId: data.libraryId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description,
      },
    });
  }

  async getShelves(sectionId?: string) {
    return this.prisma.libraryShelf.findMany({
      where: sectionId ? { sectionId } : undefined,
      include: { section: { include: { library: true } } },
      orderBy: { shelfNumber: 'asc' },
    });
  }

  async createShelf(data: { sectionId: string; shelfNumber: string; floor?: string; capacity?: number }) {
    return this.prisma.libraryShelf.create({
      data: {
        sectionId: data.sectionId,
        shelfNumber: data.shelfNumber.trim(),
        floor: data.floor || 'Ground',
        capacity: data.capacity || 100,
      },
    });
  }

  async getCategories() {
    return this.prisma.libraryCategory.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { code: string; name: string; description?: string; parentCategoryId?: string }) {
    const existing = await this.prisma.libraryCategory.findUnique({ where: { code: data.code.trim().toUpperCase() } });
    if (existing) throw new ConflictException(`Category with code '${data.code}' already exists.`);
    return this.prisma.libraryCategory.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description,
        parentCategoryId: data.parentCategoryId,
      },
    });
  }

  async getAuthors() {
    return this.prisma.libraryAuthor.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createAuthor(data: { name: string; bio?: string; email?: string }) {
    return this.prisma.libraryAuthor.create({
      data: {
        name: data.name.trim(),
        bio: data.bio,
        email: data.email,
      },
    });
  }

  async getPublishers() {
    return this.prisma.libraryPublisher.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createPublisher(data: { name: string; address?: string; contact?: string; email?: string }) {
    return this.prisma.libraryPublisher.create({
      data: {
        name: data.name.trim(),
        address: data.address,
        contact: data.contact,
        email: data.email,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. BOOK CATALOG (Title Master)
  // ══════════════════════════════════════════════════════════════════════════════

  async createBook(data: {
    isbn: string;
    title: string;
    subtitle?: string;
    authorName: string;
    authorId?: string;
    publisherName?: string;
    publisherId?: string;
    edition?: string;
    publicationYear?: number;
    language?: string;
    categoryId?: string;
    subjectId?: string;
    description?: string;
    keywords?: string[];
    coverImage?: string;
    resourceType?: string;
  }) {
    const cleanIsbn = data.isbn.trim();
    const existing = await this.prisma.book.findUnique({ where: { isbn: cleanIsbn } });
    if (existing) throw new ConflictException(`Book with ISBN '${cleanIsbn}' already exists in the catalog.`);

    return this.prisma.book.create({
      data: {
        isbn: cleanIsbn,
        title: data.title.trim(),
        subtitle: data.subtitle,
        authorName: data.authorName.trim(),
        authorId: data.authorId,
        publisherName: data.publisherName,
        publisherId: data.publisherId,
        edition: data.edition,
        publicationYear: data.publicationYear,
        language: data.language || 'English',
        categoryId: data.categoryId,
        subjectId: data.subjectId,
        description: data.description,
        keywords: data.keywords || [],
        coverImage: data.coverImage,
        resourceType: data.resourceType || 'BOOK',
        totalCopies: 0,
        availableCopies: 0,
        status: 'AVAILABLE',
      },
      include: { category: true, subject: true, author: true, publisher: true },
    });
  }

  async updateBook(id: string, data: Partial<{
    title: string;
    subtitle?: string;
    authorName?: string;
    publisherName?: string;
    edition?: string;
    publicationYear?: number;
    language?: string;
    categoryId?: string;
    subjectId?: string;
    description?: string;
    keywords?: string[];
    coverImage?: string;
    resourceType?: string;
    status?: string;
  }>) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found.');
    return this.prisma.book.update({
      where: { id },
      data,
      include: { category: true, subject: true, author: true, publisher: true },
    });
  }

  async getBooks(query?: {
    search?: string;
    category?: string;
    subjectId?: string;
    resourceType?: string;
    language?: string;
    availability?: string;
  }) {
    const where: any = {};

    if (query?.category) where.categoryId = query.category;
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.resourceType) where.resourceType = query.resourceType;
    if (query?.language) where.language = query.language;

    if (query?.availability === 'AVAILABLE') {
      where.availableCopies = { gt: 0 };
    } else if (query?.availability === 'UNAVAILABLE') {
      where.availableCopies = { lte: 0 };
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { subtitle: { contains: s, mode: 'insensitive' } },
        { authorName: { contains: s, mode: 'insensitive' } },
        { publisherName: { contains: s, mode: 'insensitive' } },
        { isbn: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { keywords: { has: s } },
      ];
    }

    return this.prisma.book.findMany({
      where,
      include: {
        category: true,
        subject: true,
        author: true,
        publisher: true,
        copies: {
          select: { id: true, accessionNo: true, barcode: true, condition: true, status: true, rack: true },
        },
        _count: { select: { copies: true, reservations: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async getBookById(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        subject: true,
        author: true,
        publisher: true,
        copies: {
          include: { library: true, shelf: { include: { section: true } } },
        },
        reservations: {
          where: { status: 'ACTIVE' },
          include: { member: { include: { user: true } } },
        },
        digitalResources: true,
      },
    });
    if (!book) throw new NotFoundException('Book not found in library catalog.');
    return book;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. BOOK COPIES (Physical Inventory)
  // ══════════════════════════════════════════════════════════════════════════════

  async createBookCopy(data: {
    bookId: string;
    accessionNo?: string;
    barcode?: string;
    libraryId?: string;
    shelfId?: string;
    rack?: string;
    purchaseDate?: Date;
    cost?: number;
    condition?: string;
  }) {
    const book = await this.prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) throw new NotFoundException('Book not found.');

    const accessionNo = data.accessionNo?.trim() || await this.nextSeq('ACC', () => this.prisma.bookCopy.count());
    const barcode = data.barcode?.trim() || `BC-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingAcc = await this.prisma.bookCopy.findUnique({ where: { accessionNo } });
    if (existingAcc) throw new ConflictException(`Accession number '${accessionNo}' already exists.`);

    const existingBarcode = await this.prisma.bookCopy.findUnique({ where: { barcode } });
    if (existingBarcode) throw new ConflictException(`Barcode '${barcode}' already exists.`);

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.create({
        data: {
          accessionNo,
          barcode,
          bookId: data.bookId,
          libraryId: data.libraryId,
          shelfId: data.shelfId,
          rack: data.rack,
          purchaseDate: data.purchaseDate || new Date(),
          cost: data.cost || 0,
          condition: data.condition || 'NEW',
          status: 'AVAILABLE',
        },
        include: { book: true, library: true, shelf: true },
      });

      await tx.book.update({
        where: { id: data.bookId },
        data: {
          totalCopies: { increment: 1 },
          availableCopies: { increment: 1 },
          status: 'AVAILABLE',
        },
      });

      return copy;
    });
  }

  async getCopies(query?: { bookId?: string; libraryId?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query?.bookId) where.bookId = query.bookId;
    if (query?.libraryId) where.libraryId = query.libraryId;
    if (query?.status) where.status = query.status;

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { accessionNo: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
        { rack: { contains: s, mode: 'insensitive' } },
        { book: { title: { contains: s, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.bookCopy.findMany({
      where,
      include: {
        book: true,
        library: true,
        shelf: { include: { section: true } },
        issues: {
          where: { status: { in: ['ISSUED', 'OVERDUE', 'RENEWED'] } },
          include: { member: { include: { user: true } } },
        },
      },
      orderBy: { accessionNo: 'asc' },
    });
  }

  async updateCopyStatus(copyId: string, status: string, condition?: string, remarks?: string) {
    const copy = await this.prisma.bookCopy.findUnique({ where: { id: copyId } });
    if (!copy) throw new NotFoundException('Book copy not found.');

    const wasAvailable = copy.status === 'AVAILABLE';
    const isNowAvailable = status === 'AVAILABLE';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bookCopy.update({
        where: { id: copyId },
        data: {
          status,
          ...(condition ? { condition } : {}),
        },
        include: { book: true },
      });

      if (wasAvailable && !isNowAvailable) {
        await tx.book.update({
          where: { id: copy.bookId },
          data: {
            availableCopies: { decrement: 1 },
          },
        });
      } else if (!wasAvailable && isNowAvailable) {
        await tx.book.update({
          where: { id: copy.bookId },
          data: {
            availableCopies: { increment: 1 },
            status: 'AVAILABLE',
          },
        });
      }

      return updated;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. MEMBERSHIP (Student, Faculty, Employee)
  // ══════════════════════════════════════════════════════════════════════════════

  async getMembers(query?: { memberType?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query?.memberType) where.memberType = query.memberType;
    if (query?.status) where.status = query.status;

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { membershipNo: { contains: s, mode: 'insensitive' } },
        { user: { username: { contains: s, mode: 'insensitive' } } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
        { user: { student: { firstName: { contains: s, mode: 'insensitive' } } } },
        { user: { student: { lastName: { contains: s, mode: 'insensitive' } } } },
        { user: { faculty: { firstName: { contains: s, mode: 'insensitive' } } } },
        { user: { faculty: { lastName: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.libraryMembership.findMany({
      where,
      include: {
        user: {
          include: {
            student: { include: { batch: { include: { program: true } } } },
            faculty: { include: { department: true } },
            employee: true,
          },
        },
        _count: {
          select: {
            issues: { where: { status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } } },
            reservations: { where: { status: 'ACTIVE' } },
            fines: { where: { status: 'UNPAID' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrCreateMembership(userId: string) {
    const existing = await this.prisma.libraryMembership.findFirst({
      where: { userId },
      include: {
        user: { include: { student: true, faculty: true, employee: true } },
      },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, faculty: true, employee: true },
    });
    if (!user) throw new NotFoundException('User record not found.');

    let memberType = 'STUDENT';
    let issueLimit = 3;
    let instituteId = undefined;
    let departmentId = undefined;

    if (user.student) {
      memberType = 'STUDENT';
      issueLimit = 3;
      instituteId = user.student.instituteId;
      departmentId = user.student.departmentId;
    } else if (user.faculty) {
      memberType = 'FACULTY';
      issueLimit = 8;
      instituteId = user.faculty.instituteId;
      departmentId = user.faculty.departmentId;
    } else if (user.employee) {
      memberType = 'EMPLOYEE';
      issueLimit = 4;
      instituteId = user.employee.instituteId;
      departmentId = user.employee.departmentId;
    }

    // Check policy for default issue limit
    const policy = await this.prisma.libraryPolicy.findFirst({
      where: { memberType, status: 'ACTIVE' },
    });
    if (policy) {
      issueLimit = policy.maxBooksIssued;
    }

    const membershipNo = await this.nextSeq('LIB-MEM', () => this.prisma.libraryMembership.count());
    const validity = new Date();
    validity.setFullYear(validity.getFullYear() + (memberType === 'STUDENT' ? 4 : 5));

    return this.prisma.libraryMembership.create({
      data: {
        membershipNo,
        userId,
        memberType,
        instituteId,
        departmentId,
        issueLimit,
        validity,
        status: 'ACTIVE',
      },
      include: {
        user: { include: { student: true, faculty: true, employee: true } },
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. BOOK ISSUE / CIRCULATION
  // ══════════════════════════════════════════════════════════════════════════════

  async issueBook(data: {
    memberId?: string;
    userId?: string;
    copyId?: string;
    accessionNo?: string;
    barcode?: string;
    issuedByUserId?: string;
    customLoanDays?: number;
  }) {
    // 1. Resolve member
    let member = null;
    if (data.memberId) {
      member = await this.prisma.libraryMembership.findUnique({
        where: { id: data.memberId },
        include: { user: { include: { student: true, faculty: true } } },
      });
    } else if (data.userId) {
      member = await this.getOrCreateMembership(data.userId);
    }
    if (!member) throw new NotFoundException('Library member record not found.');
    if (member.status !== 'ACTIVE') throw new ForbiddenException(`Library membership is ${member.status}. Cannot issue books.`);
    if (new Date() > member.validity) throw new ForbiddenException('Library membership has expired. Please renew membership.');

    // Check active loan limit
    const activeLoans = await this.prisma.libraryIssue.count({
      where: { memberId: member.id, status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } },
    });
    if (activeLoans >= member.issueLimit) {
      throw new BadRequestException(`Issue limit of ${member.issueLimit} books reached. Current active: ${activeLoans}`);
    }

    // Check unpaid fines block
    const unpaidFines = await this.prisma.libraryFine.count({
      where: { memberId: member.id, status: 'UNPAID' },
    });
    if (unpaidFines > 0) {
      throw new BadRequestException(`Member has ${unpaidFines} unpaid fine(s). Clear fines before new book issues.`);
    }

    // 2. Resolve book copy
    let copy = null;
    if (data.copyId) {
      copy = await this.prisma.bookCopy.findUnique({ where: { id: data.copyId }, include: { book: true } });
    } else if (data.accessionNo) {
      copy = await this.prisma.bookCopy.findUnique({ where: { accessionNo: data.accessionNo.trim() }, include: { book: true } });
    } else if (data.barcode) {
      copy = await this.prisma.bookCopy.findUnique({ where: { barcode: data.barcode.trim() }, include: { book: true } });
    }
    if (!copy) throw new NotFoundException('Book copy not found with provided identifiers.');
    if (copy.status !== 'AVAILABLE' && copy.status !== 'RESERVED') {
      throw new BadRequestException(`Book copy ${copy.accessionNo} is currently ${copy.status} and cannot be issued.`);
    }

    // 3. Determine loan days from policy
    let loanDays = data.customLoanDays || (member.memberType === 'FACULTY' ? 30 : 14);
    let maxRenewals = 2;
    const policy = await this.prisma.libraryPolicy.findFirst({
      where: { memberType: member.memberType, status: 'ACTIVE' },
    });
    if (policy) {
      if (!data.customLoanDays) loanDays = policy.loanDurationDays;
      maxRenewals = policy.maxRenewals;
    }

    const issueNo = await this.nextSeq('ISS', () => this.prisma.libraryIssue.count());
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.libraryIssue.create({
        data: {
          issueNo,
          memberId: member.id,
          copyId: copy.id,
          issueDate,
          dueDate,
          issuedByUserId: data.issuedByUserId,
          maxRenewals,
          status: 'ISSUED',
        },
        include: {
          copy: { include: { book: true } },
          member: { include: { user: true } },
        },
      });

      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'ISSUED' },
      });

      await tx.book.update({
        where: { id: copy.bookId },
        data: {
          availableCopies: { decrement: 1 },
          status: copy.book.availableCopies - 1 <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
        },
      });

      // Fulfill reservation if this member had reserved it
      await tx.libraryReservation.updateMany({
        where: {
          memberId: member.id,
          bookId: copy.bookId,
          status: 'ACTIVE',
        },
        data: { status: 'FULFILLED' },
      });

      return issue;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. RETURN BOOK & OVERDUE FINE
  // ══════════════════════════════════════════════════════════════════════════════

  async returnBook(data: {
    issueId?: string;
    accessionNo?: string;
    barcode?: string;
    condition?: string; // GOOD | DAMAGED | REPAIR
    receivedByUserId?: string;
    remarks?: string;
  }) {
    let issue = null;
    if (data.issueId) {
      issue = await this.prisma.libraryIssue.findUnique({
        where: { id: data.issueId },
        include: { copy: { include: { book: true } }, member: true },
      });
    } else if (data.accessionNo || data.barcode) {
      const copy = await this.prisma.bookCopy.findFirst({
        where: {
          OR: [
            ...(data.accessionNo ? [{ accessionNo: data.accessionNo.trim() }] : []),
            ...(data.barcode ? [{ barcode: data.barcode.trim() }] : []),
          ],
        },
      });
      if (copy) {
        issue = await this.prisma.libraryIssue.findFirst({
          where: { copyId: copy.id, status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } },
          include: { copy: { include: { book: true } }, member: true },
        });
      }
    }

    if (!issue) throw new NotFoundException('Active issue record not found for this book copy.');
    if (issue.status === 'RETURNED') throw new BadRequestException('This book has already been returned.');

    const returnDate = new Date();
    const condition = data.condition || 'GOOD';

    // Calculate policy-driven overdue fine
    let finePerDay = 5.0;
    const policy = await this.prisma.libraryPolicy.findFirst({
      where: { memberType: issue.member.memberType, status: 'ACTIVE' },
    });
    if (policy) {
      finePerDay = Number(policy.finePerDay);
    }

    let overdueFine = 0;
    if (returnDate > issue.dueDate) {
      const diffMs = returnDate.getTime() - issue.dueDate.getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      overdueFine = overdueDays * finePerDay;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Return Record
      await tx.libraryReturn.create({
        data: {
          issueId: issue.id,
          returnDate,
          receivedByUserId: data.receivedByUserId,
          condition,
          fineCharged: overdueFine,
          remarks: data.remarks,
        },
      });

      // 2. Update Issue Status
      await tx.libraryIssue.update({
        where: { id: issue.id },
        data: {
          returnedDate: returnDate,
          fineAmount: overdueFine,
          status: 'RETURNED',
        },
      });

      // 3. Create Fine Record if overdue
      if (overdueFine > 0) {
        const fineNo = await this.nextSeq('FINE', () => tx.libraryFine.count());
        await tx.libraryFine.create({
          data: {
            fineNo,
            issueId: issue.id,
            memberId: issue.memberId,
            amount: overdueFine,
            reason: 'OVERDUE',
            status: 'UNPAID',
            remarks: `Late return for ${issue.copy.book.title} (Overdue fine calculated per policy)`,
          },
        });
      }

      // 4. Update Copy & Book Inventory
      const nextCopyStatus = condition === 'DAMAGED' ? 'DAMAGED' : condition === 'REPAIR' ? 'REPAIR' : 'AVAILABLE';

      await tx.bookCopy.update({
        where: { id: issue.copyId },
        data: {
          condition,
          status: nextCopyStatus,
        },
      });

      if (nextCopyStatus === 'AVAILABLE') {
        await tx.book.update({
          where: { id: issue.copy.bookId },
          data: {
            availableCopies: { increment: 1 },
            status: 'AVAILABLE',
          },
        });

        // Check if there are active reservations to fulfill
        const nextReservation = await tx.libraryReservation.findFirst({
          where: { bookId: issue.copy.bookId, status: 'ACTIVE' },
          orderBy: { requestDate: 'asc' },
        });

        if (nextReservation) {
          await tx.libraryReservation.update({
            where: { id: nextReservation.id },
            data: { notifiedAt: new Date() },
          });
        }
      }

      return {
        issueId: issue.id,
        bookTitle: issue.copy.book.title,
        accessionNo: issue.copy.accessionNo,
        overdueFine,
        condition,
        status: 'RETURNED',
      };
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. RENEWAL
  // ══════════════════════════════════════════════════════════════════════════════

  async renewBook(issueId: string, requestedByUserId?: string) {
    const issue = await this.prisma.libraryIssue.findUnique({
      where: { id: issueId },
      include: {
        copy: { include: { book: true } },
        member: { include: { user: true } },
      },
    });
    if (!issue) throw new NotFoundException('Issue record not found.');
    if (issue.status === 'RETURNED') throw new BadRequestException('Cannot renew already returned book.');

    // Check overdue block
    const now = new Date();
    if (now > issue.dueDate) {
      throw new BadRequestException('Book is currently overdue. Cannot renew; please return the book and clear fines.');
    }

    // Check renewal count limit
    if (issue.renewalCount >= issue.maxRenewals) {
      throw new BadRequestException(`Maximum renewal limit (${issue.maxRenewals}) reached for this book issue.`);
    }

    // Check if book has active reservation queue by other members
    const activeReservations = await this.prisma.libraryReservation.count({
      where: {
        bookId: issue.copy.bookId,
        status: 'ACTIVE',
        memberId: { not: issue.memberId },
      },
    });
    if (activeReservations > 0) {
      throw new BadRequestException('Cannot renew: this title has pending reservations from other university members.');
    }

    // Determine extension days
    let extensionDays = issue.member.memberType === 'FACULTY' ? 30 : 14;
    const policy = await this.prisma.libraryPolicy.findFirst({
      where: { memberType: issue.member.memberType, status: 'ACTIVE' },
    });
    if (policy) extensionDays = policy.loanDurationDays;

    const newDueDate = new Date(issue.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    return this.prisma.libraryIssue.update({
      where: { id: issueId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
        status: 'RENEWED',
      },
      include: {
        copy: { include: { book: true } },
        member: { include: { user: true } },
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. RESERVATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  async reserveBook(bookId: string, userId: string) {
    const member = await this.getOrCreateMembership(userId);
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found.');

    // Check existing active reservation
    const existing = await this.prisma.libraryReservation.findFirst({
      where: { bookId, memberId: member.id, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('You already have an active reservation for this title.');

    const reservationNo = await this.nextSeq('RES', () => this.prisma.libraryReservation.count());
    const requestDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14); // 14 days reservation queue window

    return this.prisma.libraryReservation.create({
      data: {
        reservationNo,
        memberId: member.id,
        bookId,
        requestDate,
        expiryDate,
        status: 'ACTIVE',
      },
      include: { book: true, member: { include: { user: true } } },
    });
  }

  async getReservations(query?: { bookId?: string; memberId?: string; userId?: string; status?: string }) {
    const where: any = {};
    if (query?.bookId) where.bookId = query.bookId;
    if (query?.memberId) where.memberId = query.memberId;
    if (query?.status) where.status = query.status;

    if (query?.userId) {
      const member = await this.prisma.libraryMembership.findFirst({ where: { userId: query.userId } });
      if (member) where.memberId = member.id;
    }

    return this.prisma.libraryReservation.findMany({
      where,
      include: {
        book: true,
        member: {
          include: {
            user: {
              include: {
                student: { include: { batch: { include: { program: true } } } },
                faculty: { include: { department: true } },
              },
            },
          },
        },
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  async cancelReservation(reservationId: string, userId?: string) {
    const res = await this.prisma.libraryReservation.findUnique({
      where: { id: reservationId },
      include: { member: true },
    });
    if (!res) throw new NotFoundException('Reservation record not found.');
    if (userId && res.member.userId !== userId) {
      throw new ForbiddenException('Cannot cancel reservation belonging to another user.');
    }

    return this.prisma.libraryReservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. OVERDUE & FINES (Finance Integration)
  // ══════════════════════════════════════════════════════════════════════════════

  async getOverdueIssues() {
    const now = new Date();
    const issues = await this.prisma.libraryIssue.findMany({
      where: {
        status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: {
        copy: { include: { book: true, library: true } },
        member: {
          include: {
            user: {
              include: {
                student: { include: { batch: { include: { program: true } } } },
                faculty: { include: { department: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Auto compute real-time overdue days & fine
    return issues.map((i) => {
      const diffMs = now.getTime() - i.dueDate.getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const finePerDay = i.member.memberType === 'FACULTY' ? 5 : 5;
      const currentCalculatedFine = overdueDays * finePerDay;

      return {
        ...i,
        overdueDays,
        currentCalculatedFine,
      };
    });
  }

  async getFines(query?: { memberId?: string; userId?: string; status?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.memberId) where.memberId = query.memberId;

    if (query?.userId) {
      const member = await this.prisma.libraryMembership.findFirst({ where: { userId: query.userId } });
      if (member) where.memberId = member.id;
    }

    return this.prisma.libraryFine.findMany({
      where,
      include: {
        member: {
          include: {
            user: {
              include: {
                student: { include: { batch: { include: { program: true } } } },
                faculty: true,
              },
            },
          },
        },
        issue: {
          include: { copy: { include: { book: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordFinePayment(fineId: string, data: { transactionRef: string; remarks?: string }) {
    const fine = await this.prisma.libraryFine.findUnique({ where: { id: fineId } });
    if (!fine) throw new NotFoundException('Fine record not found.');
    if (fine.status === 'PAID') throw new BadRequestException('Fine is already paid.');

    return this.prisma.libraryFine.update({
      where: { id: fineId },
      data: {
        status: 'PAID',
        transactionRef: data.transactionRef,
        paidAt: new Date(),
        remarks: data.remarks || 'Paid via Central Finance & Accounts Ledger',
      },
    });
  }

  async waiveFine(fineId: string, remarks: string) {
    const fine = await this.prisma.libraryFine.findUnique({ where: { id: fineId } });
    if (!fine) throw new NotFoundException('Fine record not found.');
    return this.prisma.libraryFine.update({
      where: { id: fineId },
      data: {
        status: 'WAIVED',
        remarks: `Waived by authority: ${remarks}`,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. LOST / DAMAGED BOOK INCIDENTS
  // ══════════════════════════════════════════════════════════════════════════════

  async reportIncident(data: {
    copyId: string;
    userId: string;
    incidentType: 'LOST' | 'DAMAGED';
    description: string;
    evidenceDocId?: string;
  }) {
    const member = await this.getOrCreateMembership(data.userId);
    const copy = await this.prisma.bookCopy.findUnique({ where: { id: data.copyId }, include: { book: true } });
    if (!copy) throw new NotFoundException('Book copy not found.');

    // Calculate replacement cost per policy
    let multiplier = 1.5;
    const policy = await this.prisma.libraryPolicy.findFirst({
      where: { memberType: member.memberType, status: 'ACTIVE' },
    });
    if (policy) {
      multiplier = data.incidentType === 'LOST' ? Number(policy.lostBookMultiplier) : Number(policy.damageFinePercentage) / 100;
    }

    const baseCost = Number(copy.cost) > 0 ? Number(copy.cost) : 500;
    const replacementCost = Math.round(baseCost * multiplier);

    const incidentNo = await this.nextSeq('INC', () => this.prisma.libraryIncident.count());

    return this.prisma.$transaction(async (tx) => {
      const incident = await tx.libraryIncident.create({
        data: {
          incidentNo,
          memberId: member.id,
          copyId: copy.id,
          incidentType: data.incidentType,
          description: data.description,
          evidenceDocId: data.evidenceDocId,
          replacementCost,
          status: 'REPORTED',
        },
        include: { copy: { include: { book: true } }, member: { include: { user: true } } },
      });

      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: data.incidentType === 'LOST' ? 'LOST' : 'DAMAGED' },
      });

      return incident;
    });
  }

  async getIncidents(query?: { status?: string; incidentType?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.incidentType) where.incidentType = query.incidentType;

    return this.prisma.libraryIncident.findMany({
      where,
      include: {
        copy: { include: { book: true, library: true } },
        member: {
          include: {
            user: {
              include: {
                student: { include: { batch: { include: { program: true } } } },
                faculty: true,
              },
            },
          },
        },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async resolveIncident(incidentId: string, data: { chargeFine: boolean; resolutionRemarks: string }) {
    const incident = await this.prisma.libraryIncident.findUnique({
      where: { id: incidentId },
      include: { copy: { include: { book: true } }, member: true },
    });
    if (!incident) throw new NotFoundException('Incident not found.');

    return this.prisma.$transaction(async (tx) => {
      if (data.chargeFine && Number(incident.replacementCost) > 0) {
        const fineNo = await this.nextSeq('FINE', () => tx.libraryFine.count());
        await tx.libraryFine.create({
          data: {
            fineNo,
            memberId: incident.memberId,
            amount: incident.replacementCost,
            reason: incident.incidentType === 'LOST' ? 'LOST_BOOK' : 'DAMAGED_BOOK',
            status: 'UNPAID',
            remarks: `Replacement cost for ${incident.incidentType} copy (${incident.copy.book.title}): ${data.resolutionRemarks}`,
          },
        });
      }

      return tx.libraryIncident.update({
        where: { id: incidentId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionRemarks: data.resolutionRemarks,
        },
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 12. LIBRARY NO-DUES CLEARANCE (Unified Integration)
  // ══════════════════════════════════════════════════════════════════════════════

  async checkNoDues(userId: string) {
    const member = await this.prisma.libraryMembership.findFirst({
      where: { userId },
      include: {
        user: { include: { student: true, faculty: true, employee: true } },
      },
    });

    if (!member) {
      return {
        cleared: true,
        membershipExists: false,
        pendingBooksCount: 0,
        unpaidFinesTotal: 0,
        pendingIncidentsCount: 0,
        remarks: 'No active library record or obligations found. Clearance auto-approved.',
      };
    }

    const [activeIssues, unpaidFines, pendingIncidents] = await Promise.all([
      this.prisma.libraryIssue.findMany({
        where: { memberId: member.id, status: { in: ['ISSUED', 'RENEWED', 'OVERDUE'] } },
        include: { copy: { include: { book: true } } },
      }),
      this.prisma.libraryFine.findMany({
        where: { memberId: member.id, status: 'UNPAID' },
      }),
      this.prisma.libraryIncident.findMany({
        where: { memberId: member.id, status: { in: ['REPORTED', 'VERIFIED', 'CHARGED'] } },
      }),
    ]);

    const unpaidFinesTotal = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);
    const cleared = activeIssues.length === 0 && unpaidFinesTotal === 0 && pendingIncidents.length === 0;

    return {
      cleared,
      membershipExists: true,
      membershipNo: member.membershipNo,
      memberType: member.memberType,
      pendingBooksCount: activeIssues.length,
      pendingBooks: activeIssues.map((i) => ({
        issueNo: i.issueNo,
        title: i.copy.book.title,
        accessionNo: i.copy.accessionNo,
        dueDate: i.dueDate,
        status: i.status,
      })),
      unpaidFinesTotal,
      unpaidFines: unpaidFines.map((f) => ({
        fineNo: f.fineNo,
        amount: f.amount,
        reason: f.reason,
      })),
      pendingIncidentsCount: pendingIncidents.length,
      remarks: cleared
        ? 'Library No-Dues verified: No pending book returns or outstanding fines.'
        : `Clearance pending: ${activeIssues.length} book(s) to return, ₹${unpaidFinesTotal} fines outstanding.`,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 13. DIGITAL RESOURCES & COURSE MAPPING
  // ══════════════════════════════════════════════════════════════════════════════

  async createDigitalResource(data: {
    title: string;
    description?: string;
    resourceType: string;
    fileDocId?: string;
    accessUrl?: string;
    bookId?: string;
    programId?: string;
    subjectId?: string;
    unitNumber?: number;
    facultyId?: string;
    isRestricted?: boolean;
    allowedRoles?: string[];
  }) {
    const resourceCode = await this.nextSeq('DIG', () => this.prisma.digitalResource.count());
    return this.prisma.digitalResource.create({
      data: {
        resourceCode,
        title: data.title.trim(),
        description: data.description,
        resourceType: data.resourceType,
        fileDocId: data.fileDocId,
        accessUrl: data.accessUrl,
        bookId: data.bookId,
        programId: data.programId,
        subjectId: data.subjectId,
        unitNumber: data.unitNumber,
        facultyId: data.facultyId,
        isRestricted: data.isRestricted ?? true,
        allowedRoles: data.allowedRoles || ['STUDENT', 'FACULTY', 'LIBRARY_ADMIN', 'SUPER_ADMIN'],
        status: 'ACTIVE',
      },
      include: { book: true, program: true, subject: true },
    });
  }

  async getDigitalResources(query?: {
    programId?: string;
    subjectId?: string;
    resourceType?: string;
    search?: string;
    userRole?: string;
  }) {
    const where: any = { status: 'ACTIVE' };
    if (query?.programId) where.programId = query.programId;
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.resourceType) where.resourceType = query.resourceType;

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { resourceCode: { contains: s, mode: 'insensitive' } },
      ];
    }

    return this.prisma.digitalResource.findMany({
      where,
      include: {
        book: true,
        program: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementDigitalDownload(resourceId: string) {
    return this.prisma.digitalResource.update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 14. LIBRARY NOTICES
  // ══════════════════════════════════════════════════════════════════════════════

  async getNotices(audience?: string) {
    const now = new Date();
    return this.prisma.libraryNotice.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now },
        ...(audience && audience !== 'ALL' ? { OR: [{ audience: 'ALL' }, { audience }] } : {}),
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createNotice(data: {
    title: string;
    description: string;
    audience?: string;
    targetId?: string;
    priority?: string;
    startDate?: Date;
    endDate: Date;
  }) {
    const noticeNo = await this.nextSeq('LIB-NOT', () => this.prisma.libraryNotice.count());
    return this.prisma.libraryNotice.create({
      data: {
        noticeNo,
        title: data.title.trim(),
        description: data.description,
        audience: data.audience || 'ALL',
        targetId: data.targetId,
        priority: data.priority || 'NORMAL',
        startDate: data.startDate || new Date(),
        endDate: data.endDate,
        status: 'ACTIVE',
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 15. LIBRARY POLICIES
  // ══════════════════════════════════════════════════════════════════════════════

  async getPolicies() {
    return this.prisma.libraryPolicy.findMany({
      orderBy: { memberType: 'asc' },
    });
  }

  async createOrUpdatePolicy(data: {
    code: string;
    name: string;
    memberType: string;
    maxBooksIssued: number;
    loanDurationDays: number;
    maxRenewals: number;
    finePerDay: number;
    reservationDurationDays?: number;
    gracePeriodDays?: number;
    lostBookMultiplier?: number;
    damageFinePercentage?: number;
  }) {
    return this.prisma.libraryPolicy.upsert({
      where: { code: data.code.trim().toUpperCase() },
      update: {
        name: data.name,
        memberType: data.memberType,
        maxBooksIssued: data.maxBooksIssued,
        loanDurationDays: data.loanDurationDays,
        maxRenewals: data.maxRenewals,
        finePerDay: data.finePerDay,
        reservationDurationDays: data.reservationDurationDays || 3,
        gracePeriodDays: data.gracePeriodDays || 0,
        lostBookMultiplier: data.lostBookMultiplier || 1.5,
        damageFinePercentage: data.damageFinePercentage || 50,
      },
      create: {
        code: data.code.trim().toUpperCase(),
        name: data.name,
        memberType: data.memberType,
        maxBooksIssued: data.maxBooksIssued,
        loanDurationDays: data.loanDurationDays,
        maxRenewals: data.maxRenewals,
        finePerDay: data.finePerDay,
        reservationDurationDays: data.reservationDurationDays || 3,
        gracePeriodDays: data.gracePeriodDays || 0,
        lostBookMultiplier: data.lostBookMultiplier || 1.5,
        damageFinePercentage: data.damageFinePercentage || 50,
        status: 'ACTIVE',
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 16. REPORTS & ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════════

  async getReports(type: string) {
    switch (type) {
      case 'INVENTORY':
        return this.prisma.book.findMany({
          include: { category: true, _count: { select: { copies: true } } },
          orderBy: { title: 'asc' },
        });

      case 'COPIES':
        return this.prisma.bookCopy.findMany({
          include: { book: true, library: true, shelf: true },
          orderBy: { accessionNo: 'asc' },
        });

      case 'CIRCULATION':
        return this.prisma.libraryIssue.findMany({
          include: {
            copy: { include: { book: true } },
            member: { include: { user: true } },
          },
          orderBy: { issueDate: 'desc' },
          take: 200,
        });

      case 'FINES':
        return this.prisma.libraryFine.findMany({
          include: {
            member: { include: { user: true } },
            issue: { include: { copy: { include: { book: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'POPULAR':
        return this.prisma.book.findMany({
          include: {
            _count: { select: { copies: true, reservations: true } },
          },
          orderBy: { totalCopies: 'desc' },
          take: 20,
        });

      default:
        return this.getDashboard();
    }
  }
}
