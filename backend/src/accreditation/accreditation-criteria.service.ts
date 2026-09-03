import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DefaultCriterionDef {
  criterionNumber: number;
  code: string;
  title: string;
  description: string;
  weightage: number;
  metrics: Array<{
    code: string;
    name: string;
    description: string;
    formula?: string;
    unit: string;
    sourceModule: string;
    calculationMethod: string;
  }>;
}

@Injectable()
export class AccreditationCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  getDefaultNaacCriteria(): DefaultCriterionDef[] {
    return [
      {
        criterionNumber: 1,
        code: 'CR1',
        title: 'Curricular Aspects',
        description: 'Curriculum design, academic flexibility, feedback system and value-added courses.',
        weightage: 150,
        metrics: [
          { code: '1.1.1', name: 'Curricula Developed and Implemented', description: 'Total academic programs with revised curriculum in 5-year cycle', unit: 'COUNT', sourceModule: 'ACADEMICS', calculationMethod: 'COUNT' },
          { code: '1.2.1', name: 'New Courses Introduced', description: 'Percentage of new courses introduced across all programs', unit: 'PERCENTAGE', sourceModule: 'ACADEMICS', calculationMethod: 'PERCENTAGE' },
          { code: '1.3.2', name: 'Value-Added Courses', description: 'Value-added courses imparting transferable and life skills', unit: 'COUNT', sourceModule: 'ACADEMICS', calculationMethod: 'COUNT' },
        ],
      },
      {
        criterionNumber: 2,
        code: 'CR2',
        title: 'Teaching-Learning and Evaluation',
        description: 'Student enrollment, student-teacher ratio, teaching profiles and evaluation reforms.',
        weightage: 200,
        metrics: [
          { code: '2.1.1', name: 'Enrolment Percentage', description: 'Average enrollment percentage across sanctioned seats', unit: 'PERCENTAGE', sourceModule: 'STUDENTS', calculationMethod: 'PERCENTAGE' },
          { code: '2.2.2', name: 'Student-Full Time Teacher Ratio', description: 'Ratio of total enrolled students to full-time faculty', unit: 'RATIO', sourceModule: 'FACULTY', calculationMethod: 'RATIO' },
          { code: '2.6.3', name: 'Pass Percentage of Final Year Students', description: 'Pass percentage of final year students during evaluation year', unit: 'PERCENTAGE', sourceModule: 'EXAMINATIONS', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 3,
        code: 'CR3',
        title: 'Research, Innovations and Extension',
        description: 'Grants, ecosystem for innovations, publications, citations and extension activities.',
        weightage: 250,
        metrics: [
          { code: '3.1.1', name: 'Grants for Research Projects', description: 'Total research grants received from government and non-government agencies', unit: 'INR_LAKHS', sourceModule: 'RESEARCH', calculationMethod: 'SUM' },
          { code: '3.2.2', name: 'Innovation Ecosystem Workshops', description: 'Workshops/seminars conducted on Research Methodology, IPR and Entrepreneurship', unit: 'COUNT', sourceModule: 'INCUBATION', calculationMethod: 'COUNT' },
          { code: '3.3.1', name: 'Research Papers Published in Journals', description: 'Number of research papers published in UGC-CARE / Scopus / WoS indexed journals', unit: 'COUNT', sourceModule: 'RESEARCH', calculationMethod: 'COUNT' },
        ],
      },
      {
        criterionNumber: 4,
        code: 'CR4',
        title: 'Infrastructure and Learning Resources',
        description: 'Physical facilities, library resources, IT infrastructure and campus maintenance.',
        weightage: 100,
        metrics: [
          { code: '4.1.1', name: 'Infrastructure and Physical Facilities', description: 'Adequacy of physical classrooms, labs, computing centers', unit: 'COUNT', sourceModule: 'INFRASTRUCTURE', calculationMethod: 'COUNT' },
          { code: '4.2.2', name: 'Library Subscriptions and E-Resources', description: 'Annual expenditure on purchase of books and journals', unit: 'INR_LAKHS', sourceModule: 'LIBRARY', calculationMethod: 'SUM' },
        ],
      },
      {
        criterionNumber: 5,
        code: 'CR5',
        title: 'Student Support and Progression',
        description: 'Scholarships, capability enhancement, placement, higher education and alumni engagement.',
        weightage: 100,
        metrics: [
          { code: '5.1.1', name: 'Government & Institutional Scholarships', description: 'Percentage of students benefited by scholarships and freeships', unit: 'PERCENTAGE', sourceModule: 'FEES', calculationMethod: 'PERCENTAGE' },
          { code: '5.2.1', name: 'Placement of Outgoing Students', description: 'Percentage of placement and progression to higher education', unit: 'PERCENTAGE', sourceModule: 'PLACEMENTS', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 6,
        code: 'CR6',
        title: 'Governance, Leadership and Management',
        description: 'Vision, organizational structure, e-governance, faculty empowerment and financial management.',
        weightage: 100,
        metrics: [
          { code: '6.2.2', name: 'Implementation of E-Governance', description: 'ERP implementation across Administration, Finance, Student Admission and Examinations', unit: 'SCORE', sourceModule: 'IQAC', calculationMethod: 'COUNT' },
          { code: '6.3.2', name: 'Financial Support to Faculty', description: 'Percentage of teachers provided financial support for conferences/workshops', unit: 'PERCENTAGE', sourceModule: 'HR', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 7,
        code: 'CR7',
        title: 'Institutional Values and Best Practices',
        description: 'Gender equity, environmental consciousness, inclusivity, distinctiveness and best practices.',
        weightage: 100,
        metrics: [
          { code: '7.1.1', name: 'Gender Equity Initiatives', description: 'Measures initiated by the institution for gender equity', unit: 'COUNT', sourceModule: 'CAMPUS', calculationMethod: 'COUNT' },
          { code: '7.1.3', name: 'Green Campus Initiatives', description: 'Clean and green campus initiatives and environmental audits', unit: 'COUNT', sourceModule: 'CAMPUS', calculationMethod: 'COUNT' },
        ],
      },
    ];
  }

  getDefaultNbaCriteria(): DefaultCriterionDef[] {
    return [
      {
        criterionNumber: 1,
        code: 'NBA-C1',
        title: 'Vision, Mission and Program Educational Objectives',
        description: 'Establishment, process of dissemination and correlation of Vision, Mission, and PEOs.',
        weightage: 50,
        metrics: [
          { code: 'NBA-1.1', name: 'PEO Correlation & Consistency', description: 'Consistency of PEOs with Department and Institute Vision and Mission', unit: 'SCORE', sourceModule: 'OBE', calculationMethod: 'COUNT' },
        ],
      },
      {
        criterionNumber: 2,
        code: 'NBA-C2',
        title: 'Program Curriculum and Teaching-Learning Processes',
        description: 'Curriculum structure, Course Outcomes, and pedagogy alignment.',
        weightage: 100,
        metrics: [
          { code: 'NBA-2.1', name: 'CO-PO Mapping Matrix Coverage', description: 'Attainment of Program Outcomes through mapped Course Outcomes', unit: 'PERCENTAGE', sourceModule: 'OBE', calculationMethod: 'PERCENTAGE' },
          { code: 'NBA-2.2', name: 'CO-PSO Mapping Coverage', description: 'Program Specific Outcome mapping and curriculum delivery coverage', unit: 'PERCENTAGE', sourceModule: 'OBE', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 3,
        code: 'NBA-C3',
        title: 'Course Outcomes and Program Outcomes',
        description: 'Attainment of COs, POs and PSOs via continuous direct and indirect assessments.',
        weightage: 175,
        metrics: [
          { code: 'NBA-3.1', name: 'Direct Assessment CO Attainment', description: 'Average CO attainment levels in internal CIE and university examinations', unit: 'PERCENTAGE', sourceModule: 'OBE', calculationMethod: 'AVERAGE' },
          { code: 'NBA-3.2', name: 'PO Attainment (Direct + Indirect)', description: 'Cascaded Program Outcome attainment through correlation matrix and exit surveys', unit: 'PERCENTAGE', sourceModule: 'OBE', calculationMethod: 'AVERAGE' },
          { code: 'NBA-3.3', name: 'PSO Attainment', description: 'Program Specific Outcome weighted attainment levels', unit: 'PERCENTAGE', sourceModule: 'OBE', calculationMethod: 'AVERAGE' },
        ],
      },
      {
        criterionNumber: 4,
        code: 'NBA-C4',
        title: 'Students’ Performance',
        description: 'Enrolment ratio, success rate, academic performance, and placement progression.',
        weightage: 100,
        metrics: [
          { code: 'NBA-4.1', name: 'Success Rate without Backlog', description: 'Graduation rate of students in stipulated duration without backlogs', unit: 'PERCENTAGE', sourceModule: 'EXAMINATIONS', calculationMethod: 'PERCENTAGE' },
          { code: 'NBA-4.2', name: 'Placement, Higher Studies & Startups', description: 'Percentage of students placed in industry, higher studies, or entrepreneurs', unit: 'PERCENTAGE', sourceModule: 'PLACEMENTS', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 5,
        code: 'NBA-C5',
        title: 'Faculty Information and Contributions',
        description: 'Student-Faculty ratio, faculty cadre, Ph.D. qualifications, and retention.',
        weightage: 200,
        metrics: [
          { code: 'NBA-5.1', name: 'Student-Faculty Ratio (SFR)', description: 'Full-time student to regular faculty ratio in program', unit: 'RATIO', sourceModule: 'FACULTY', calculationMethod: 'RATIO' },
          { code: 'NBA-5.2', name: 'Faculty Cadre Proportion', description: 'Professor, Associate Professor, and Assistant Professor distribution', unit: 'RATIO', sourceModule: 'FACULTY', calculationMethod: 'RATIO' },
          { code: 'NBA-5.3', name: 'Faculty Ph.D. Qualification Ratio', description: 'Percentage of faculty holding Ph.D. degree in department', unit: 'PERCENTAGE', sourceModule: 'FACULTY', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 6,
        code: 'NBA-C6',
        title: 'Facilities and Technical Support',
        description: 'Adequacy of laboratories, computing infrastructure, and technical staff support.',
        weightage: 80,
        metrics: [
          { code: 'NBA-6.1', name: 'Laboratory & Computing Facilities', description: 'Adequacy of equipment and software tools in departmental laboratories', unit: 'SCORE', sourceModule: 'CAMPUS', calculationMethod: 'SCORE' },
        ],
      },
      {
        criterionNumber: 7,
        code: 'NBA-C7',
        title: 'Continuous Improvement',
        description: 'Actions taken on PO/PSO attainment gaps and continuous quality enhancement.',
        weightage: 50,
        metrics: [
          { code: 'NBA-7.1', name: 'PO Attainment Improvement Actions', description: 'Documented remedial and curricular actions based on PO attainment gaps', unit: 'SCORE', sourceModule: 'OBE', calculationMethod: 'SCORE' },
        ],
      },
      {
        criterionNumber: 8,
        code: 'NBA-C8',
        title: 'First Year Academics',
        description: 'First year student-faculty ratio, qualification of faculty, and academic results.',
        weightage: 50,
        metrics: [
          { code: 'NBA-8.1', name: 'First Year Academic Performance', description: 'Pass percentage of first year students in university examinations', unit: 'PERCENTAGE', sourceModule: 'EXAMINATIONS', calculationMethod: 'PERCENTAGE' },
        ],
      },
      {
        criterionNumber: 9,
        code: 'NBA-C9',
        title: 'Student Support Systems',
        description: 'Mentoring system, feedback mechanisms, and career guidance/counseling.',
        weightage: 50,
        metrics: [
          { code: 'NBA-9.1', name: 'Mentoring & Student Progression', description: 'Faculty-student mentoring system efficiency and progression tracking', unit: 'SCORE', sourceModule: 'CAMPUS', calculationMethod: 'SCORE' },
        ],
      },
      {
        criterionNumber: 10,
        code: 'NBA-C10',
        title: 'Governance, Institutional Support and Financial Resources',
        description: 'Departmental budget allocation, utilization, and institutional leadership support.',
        weightage: 120,
        metrics: [
          { code: 'NBA-10.1', name: 'Financial Resource Utilization', description: 'Adequacy of budget allocation and utilization for program laboratories and faculty', unit: 'PERCENTAGE', sourceModule: 'FINANCE', calculationMethod: 'PERCENTAGE' },
        ],
      },
    ];
  }

  async ensureFrameworkInitialized(name: 'NAAC' | 'NBA', tenantId: string) {
    let framework = await this.prisma.accreditationFramework.findFirst({
      where: { name, tenantId },
      include: {
        criteria: {
          include: { metrics: true },
        },
      },
    });

    if (!framework) {
      framework = await this.prisma.accreditationFramework.create({
        data: {
          tenantId,
          name,
          version: 'v2026.1',
          academicYearRange: '2021-22 to 2025-26',
        },
        include: {
          criteria: {
            include: { metrics: true },
          },
        },
      });
    }

    const criteriaDefs = name === 'NAAC' ? this.getDefaultNaacCriteria() : this.getDefaultNbaCriteria();

    for (const cr of criteriaDefs) {
      let crit = framework.criteria.find(c => c.code === cr.code);
      if (!crit) {
        crit = await this.prisma.accreditationCriterion.create({
          data: {
            tenantId,
            frameworkId: framework.id,
            criterionNumber: cr.criterionNumber,
            code: cr.code,
            title: cr.title,
            description: cr.description,
            weightage: cr.weightage,
          },
          include: { metrics: true },
        });
      }

      for (const m of cr.metrics) {
        const existingMetric = crit.metrics?.find((em: any) => em.code === m.code);
        if (!existingMetric) {
          await this.prisma.accreditationMetric.create({
            data: {
              tenantId,
              criterionId: crit.id,
              code: m.code,
              name: m.name,
              description: m.description,
              formula: m.formula,
              unit: m.unit,
              sourceModule: m.sourceModule,
              calculationMethod: m.calculationMethod,
            },
          });
        }
      }
    }

    framework = await this.prisma.accreditationFramework.findUnique({
      where: { id: framework.id },
      include: {
        criteria: {
          include: { metrics: true },
        },
      },
    });

    return framework!;
  }
}
