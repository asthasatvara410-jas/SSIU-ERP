import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MapStudentFacultyDto } from './dto/map-student-faculty.dto';
import { MapStudentMentorDto } from './dto/map-student-mentor.dto';
import { MapFacultySubjectDto } from './dto/map-faculty-subject.dto';

@Injectable()
export class AcademicMappingService {
  private readonly logger = new Logger(AcademicMappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Student -> Faculty Subject Mapping
  async mapStudentToFaculty(dto: MapStudentFacultyDto, assignedByUserId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId }, include: { batch: { include: { semesters: true } } } });
    if (!student) throw new NotFoundException('Student not found.');

    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) throw new NotFoundException('Faculty not found.');

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found.');

    if (student.instituteId !== faculty.instituteId) {
      throw new BadRequestException(`Academic Mismatch: Student (${student.enrollmentNo}) and Faculty (${faculty.employeeCode}) belong to different institutes.`);
    }

    const existing = await this.prisma.studentFacultyMapping.findUnique({
      where: {
        studentId_subjectId_mappingType: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          mappingType: dto.mappingType || 'COURSE_TEACHER',
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Student is already mapped to a ${dto.mappingType || 'COURSE_TEACHER'} for subject '${subject.code}'.`);
    }

    const semesterId = subject.semesterId || student.batch.semesters[0]?.id;
    const divisionId = student.currentDivisionId;

    if (!semesterId || !divisionId) {
      throw new BadRequestException('Student division or subject semester is not configured.');
    }

    return this.prisma.studentFacultyMapping.create({
      data: {
        studentId: dto.studentId,
        facultyId: dto.facultyId,
        subjectId: dto.subjectId,
        semesterId,
        divisionId,
        mappingType: dto.mappingType || 'COURSE_TEACHER',
        assignedByUserId,
      },
      include: {
        student: { select: { enrollmentNo: true, firstName: true, lastName: true } },
        faculty: { select: { employeeCode: true, firstName: true, lastName: true } },
        subject: { select: { code: true, name: true } },
      },
    });
  }

  // 2. Student -> Mentor Mapping
  async mapStudentToMentor(dto: MapStudentMentorDto, assignedByUserId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found.');

    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.mentorFacultyId } });
    if (!faculty) throw new NotFoundException('Mentor Faculty not found.');

    const ay = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!ay) throw new NotFoundException('Academic Year not found.');

    if (student.instituteId !== faculty.instituteId) {
      throw new BadRequestException(`Mentor Mismatch: Student and Mentor Faculty belong to different institutes.`);
    }

    const existing = await this.prisma.studentMentorMapping.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: dto.studentId,
          academicYearId: dto.academicYearId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Student '${student.enrollmentNo}' already has an assigned mentor for Academic Year '${ay.code}'.`);
    }

    return this.prisma.studentMentorMapping.create({
      data: {
        studentId: dto.studentId,
        mentorFacultyId: dto.mentorFacultyId,
        academicYearId: dto.academicYearId,
        assignedByUserId,
      },
      include: {
        student: { select: { enrollmentNo: true, firstName: true, lastName: true } },
        faculty: { select: { employeeCode: true, firstName: true, lastName: true } },
        academicYear: { select: { code: true } },
      },
    });
  }

  // 3. Faculty -> Subject Mapping
  async mapFacultyToSubject(dto: MapFacultySubjectDto) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) throw new NotFoundException('Faculty not found.');

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found.');

    const existing = await this.prisma.facultySubjectMapping.findUnique({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: dto.facultyId,
          subjectId: dto.subjectId,
          divisionId: dto.divisionId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Faculty '${faculty.employeeCode}' is already assigned to subject '${subject.code}' for this division.`);
    }

    return this.prisma.facultySubjectMapping.create({
      data: {
        facultyId: dto.facultyId,
        subjectId: dto.subjectId,
        divisionId: dto.divisionId,
        semesterId: dto.semesterId,
      },
      include: {
        faculty: { select: { employeeCode: true, firstName: true, lastName: true } },
        subject: { select: { code: true, name: true } },
        division: { select: { name: true } },
      },
    });
  }

  // 4. Queries & Listing
  async getStudentMappings(query?: { studentId?: string; facultyId?: string; subjectId?: string }) {
    const where: any = {};
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.facultyId) where.facultyId = query.facultyId;
    if (query?.subjectId) where.subjectId = query.subjectId;

    const courseMappings = await this.prisma.studentFacultyMapping.findMany({
      where,
      include: {
        student: { select: { id: true, enrollmentNo: true, firstName: true, lastName: true, email: true } },
        faculty: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true } },
        subject: { select: { id: true, code: true, name: true, credits: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const mentorMappings = await this.prisma.studentMentorMapping.findMany({
      where: query?.studentId ? { studentId: query.studentId } : query?.facultyId ? { mentorFacultyId: query.facultyId } : {},
      include: {
        student: { select: { id: true, enrollmentNo: true, firstName: true, lastName: true, email: true } },
        faculty: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true } },
        academicYear: { select: { code: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return { courseMappings, mentorMappings };
  }

  async deactivateMapping(type: 'course' | 'mentor' | 'faculty-subject', id: string) {
    if (type === 'course') {
      return this.prisma.studentFacultyMapping.update({ where: { id }, data: { status: 'INACTIVE' } });
    } else if (type === 'mentor') {
      return this.prisma.studentMentorMapping.update({ where: { id }, data: { status: 'INACTIVE' } });
    } else {
      return this.prisma.facultySubjectMapping.update({ where: { id }, data: { status: 'INACTIVE' } });
    }
  }
}
