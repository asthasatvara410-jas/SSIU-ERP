import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.trim().length < 2) {
      return { query, results: [] };
    }

    const q = query.trim();

    const [students, faculty, policies, circulars, researchProjects, placementDrives] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { enrollmentNo: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.faculty.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { employeeCode: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.policy.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { policyNo: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.circular.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { circularNo: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.researchProject.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { projectCode: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.placementDrive.findMany({
        where: {
          OR: [
            { jobRole: { contains: q, mode: 'insensitive' } },
            { driveCode: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
    ]);

    const results = [
      ...students.map((s) => ({ type: 'STUDENT', id: s.id, title: `${s.firstName} ${s.lastName} (${s.enrollmentNo})`, link: `/students/${s.id}` })),
      ...faculty.map((f) => ({ type: 'FACULTY', id: f.id, title: `${f.firstName} ${f.lastName} (${f.employeeCode})`, link: `/faculty/${f.id}` })),
      ...policies.map((p) => ({ type: 'POLICY', id: p.id, title: `${p.title} (${p.policyNo})`, link: `/governance/policies` })),
      ...circulars.map((c) => ({ type: 'CIRCULAR', id: c.id, title: `${c.title} (${c.circularNo})`, link: `/governance/circulars` })),
      ...researchProjects.map((r) => ({ type: 'RESEARCH_PROJECT', id: r.id, title: `${r.title} (${r.projectCode})`, link: `/research/projects/${r.id}` })),
      ...placementDrives.map((d) => ({ type: 'PLACEMENT_DRIVE', id: d.id, title: `${d.jobRole} (${d.driveCode})`, link: `/placement/drives/${d.id}` })),
    ];

    return {
      query: q,
      totalResults: results.length,
      results,
    };
  }
}
