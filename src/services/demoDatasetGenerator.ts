import { 
  Institute, Department, Program, Semester, Division, Subject, 
  Faculty, Student, StudentDocument, ApprovalRequest, StudentResult, StudentMarks,
  FixedAsset, AssetTransferRecord, AssetMaintenanceRecord, AssetReturnRecord
} from '../types';

// ============================================================================
// REALISTIC INDIAN DEMOGRAPHIC SEED POOLS
// ============================================================================

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad', 'Sai', 'Arnav', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith', 'Aaryavart', 'Dhruv', 'Kabir',
  'Ananya', 'Harsh', 'Jay', 'Dev', 'Manan', 'Smit', 'Keval', 'Parth', 'Yash', 'Meet',
  'Darshan', 'Ronak', 'Bhavya', 'Chirag', 'Het', 'Om', 'Deep', 'Nisarg', 'Ruturaj', 'Vatsal',
  'Siddharth', 'Varun', 'Rohan', 'Karan', 'Tanmay', 'Akash', 'Gaurav', 'Nikhil', 'Rahul', 'Aniket'
];

const FIRST_NAMES_FEMALE = [
  'Aadhya', 'Ananya', 'Diya', 'Isha', 'Aanya', 'Saanvi', 'Myra', 'Prisha', 'Riya', 'Anvi',
  'Pari', 'Avani', 'Sara', 'Kyra', 'Siya', 'Navya', 'Khushi', 'Aditi', 'Trisha', 'Mahi',
  'Pooja', 'Drashti', 'Bhoomi', 'Kinjal', 'Nidhi', 'Hiral', 'Radhika', 'Vidhi', 'Twinkle', 'Shruti',
  'Mansi', 'Payal', 'Krutika', 'Jhanvi', 'Hetvi', 'Maitri', 'Forum', 'Kavya', 'Krisha', 'Shreya',
  'Sneha', 'Meera', 'Priyanka', 'Neha', 'Divya', 'Anjali', 'Simran', 'Tanvi', 'Rashi', 'Ishita'
];

const MIDDLE_NAMES = [
  'Kumar', 'Bhai', 'Lal', 'Chandra', 'Kant', 'Prasad', 'Ramesh', 'Suresh', 'Dinesh', 'Mahesh',
  'Rajesh', 'Mukesh', 'Pravin', 'Bharat', 'Jayesh', 'Hasmukh', 'Natvar', 'Shailesh', 'Dipak', 'Ashok'
];

const LAST_NAMES = [
  'Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Trivedi', 'Pandya', 'Dave', 'Prajapati', 'Bhatt',
  'Vyas', 'Chaudhary', 'Gohil', 'Rathod', 'Solanki', 'Chavda', 'Barot', 'Makwana', 'Thakkar', 'Soni',
  'Modi', 'Gajjar', 'Panchal', 'Donga', 'Radadiya', 'Vekariya', 'Sojitra', 'Kotadiya', 'Sheth', 'Zala',
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Mishra', 'Agarwal', 'Kapoor', 'Malhotra', 'Reddy', 'Nair'
];

const CITIES = [
  { city: 'Gandhinagar', state: 'Gujarat', pin: '382010' },
  { city: 'Ahmedabad', state: 'Gujarat', pin: '380015' },
  { city: 'Vadodara', state: 'Gujarat', pin: '390001' },
  { city: 'Surat', state: 'Gujarat', pin: '395007' },
  { city: 'Rajkot', state: 'Gujarat', pin: '360001' },
  { city: 'Bhavnagar', state: 'Gujarat', pin: '364001' },
  { city: 'Jamnagar', state: 'Gujarat', pin: '361001' },
  { city: 'Junagadh', state: 'Gujarat', pin: '362001' },
  { city: 'Anand', state: 'Gujarat', pin: '388001' },
  { city: 'Mehsana', state: 'Gujarat', pin: '384001' }
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];

// Pseudo-random deterministic generator to ensure 100% reproducible demo state
class DeterministicRNG {
  private seed: number;

  constructor(seed = 123456789) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ============================================================================
// 1. GENERATE 500 CANONICAL FACULTY RECORDS (FAC-2026-000001 - FAC-2026-000500)
// ============================================================================

export function generateCanonicalFaculty(
  institutes: Institute[],
  departments: Department[]
): Faculty[] {
  const rng = new DeterministicRNG(42);
  const facultyList: Faculty[] = [];

  const designations: Faculty['designation'][] = [
    'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'
  ];

  const qualifications = ['Ph.D. in Computer Science', 'M.Tech in CSE', 'Ph.D. in Mechanical Engg', 'M.Pharm', 'MD / MS', 'M.Des', 'MBA', 'Ph.D. in Management', 'Ph.D. in Physics'];
  const specializations = ['Artificial Intelligence', 'Data Science', 'Cloud Computing', 'Thermal Engineering', 'Structural Design', 'Pharmaceutics', 'Pediatrics', 'UI/UX Design', 'Supply Chain', 'Quantum Materials'];

  // Seed primary demo faculty (fac-1 / FAC-2026-000001) for seamless demo login compatibility
  const totalFacultyCount = 500;

  for (let i = 1; i <= totalFacultyCount; i++) {
    const padIndex = i.toString().padStart(6, '0');
    const facultyId = i === 1 ? 'fac-1' : `FAC-2026-${padIndex}`;
    const empId = `EMP-2026-${i.toString().padStart(4, '0')}`;

    const isMale = rng.next() > 0.4;
    const firstName = isMale ? rng.choice(FIRST_NAMES_MALE) : rng.choice(FIRST_NAMES_FEMALE);
    const middleName = rng.choice(MIDDLE_NAMES);
    const lastName = rng.choice(LAST_NAMES);
    const fullName = i === 1 ? 'Dr. Rajesh Shah' : `Dr. ${firstName} ${lastName}`;

    // Distribution: Heavy on SIT / SSCIT, then distributed across other 10 institutes
    let targetInst: Institute;
    let targetDept: Department;

    if (i <= 200) {
      // Primary Engineering & Computing Faculty (SIT / SSCIT)
      targetInst = institutes.find(inst => inst.id === 'inst-sit' || inst.id === 'inst-1') || institutes[0];
      const deptList = departments.filter(d => d.instituteId === targetInst.id);
      targetDept = deptList.length > 0 ? (i <= 100 ? (deptList.find(d => d.id === 'dept-1') || deptList[0]) : rng.choice(deptList)) : departments[0];
    } else {
      // Distributed across remaining institutes
      targetInst = institutes[i % institutes.length];
      const deptList = departments.filter(d => d.instituteId === targetInst.id);
      targetDept = deptList.length > 0 ? rng.choice(deptList) : departments[0];
    }

    const cityObj = rng.choice(CITIES);
    const designation = i === 1 ? 'Professor' : rng.choice(designations);
    const experience = rng.nextInt(3, 24);

    facultyList.push({
      id: facultyId,
      employeeId: empId,
      name: fullName,
      email: i === 1 ? 'faculty@university.edu' : `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@swarrnim.edu.in`,
      phone: `+91 ${rng.nextInt(90000, 99999)} ${rng.nextInt(10000, 99999)}`,
      photo: isMale 
        ? `https://images.unsplash.com/photo-${1500000000000 + (i % 500)}?auto=format&fit=crop&w=200&q=80`
        : `https://images.unsplash.com/photo-${1540000000000 + (i % 500)}?auto=format&fit=crop&w=200&q=80`,
      designation,
      instituteId: targetInst.id,
      departmentId: targetDept.id,
      qualification: rng.choice(qualifications),
      specialization: rng.choice(specializations),
      joiningDate: `201${rng.nextInt(7, 9)}-0${rng.nextInt(1, 9)}-15`,
      dateOfBirth: `198${rng.nextInt(0, 9)}-0${rng.nextInt(1, 9)}-${rng.nextInt(10, 28)}`,
      bloodGroup: rng.choice(BLOOD_GROUPS),
      address: `${rng.nextInt(101, 999)}, Swarrnim Faculty Enclave, ${cityObj.city}, ${cityObj.state} ${cityObj.pin}`,
      experienceYears: experience,
      subjectIds: ['CSE-401', 'CSE-402', 'sub-1', 'sub-2'],
      status: i % 40 === 0 ? 'ON_LEAVE' : 'ACTIVE'
    });
  }

  return facultyList;
}

// ============================================================================
// 2. GENERATE EXACTLY 2,000 CANONICAL STUDENTS (STU-2026-000001 - STU-2026-002000)
// ============================================================================

export function generateCanonicalStudents(
  institutes: Institute[],
  departments: Department[],
  programs: Program[],
  semesters: Semester[],
  divisions: Division[],
  facultyList: Faculty[]
): Student[] {
  const rng = new DeterministicRNG(99);
  const students: Student[] = [];

  const totalStudents = 2000;

  // Major Mentors Pool (first 25 faculty in SIT CSE)
  const mentorPool = facultyList.slice(0, 25);

  for (let i = 1; i <= totalStudents; i++) {
    const padIndex = i.toString().padStart(6, '0');
    const studentId = i === 1 ? 'stu-1' : `STU-2026-${padIndex}`;
    const enrollmentNo = `260101${i.toString().padStart(4, '0')}`;
    const rollNo = `26CSE${(i % 120 + 1).toString().padStart(3, '0')}`;

    const isMale = rng.next() > 0.45;
    const firstName = isMale ? rng.choice(FIRST_NAMES_MALE) : rng.choice(FIRST_NAMES_FEMALE);
    const middleName = rng.choice(MIDDLE_NAMES);
    const lastName = rng.choice(LAST_NAMES);
    const fullName = i === 1 ? 'Jigar Patel' : `${firstName} ${middleName} ${lastName}`;

    // Scope distribution matching exact requirements:
    // 1 to 1000: SIT / SSCIT (Primary Engineering & Computing) -> Principal sees ~1,000
    // 1 to 700: Computer Engineering (dept-1) -> HOD of CSE sees ~700
    // 1 to 500: Major Faculty Teaching Scope (CSE-401) & Mentorship assignments -> Faculty sees ~500
    // 1001 to 2000: Distributed across the other 11 constituent colleges
    let targetInst: Institute;
    let targetDept: Department;
    let targetProg: Program;

    if (i <= 1000) {
      // Primary Engineering Institute
      targetInst = institutes.find(inst => inst.id === 'inst-sit' || inst.id === 'inst-1') || institutes[0];
      const deptList = departments.filter(d => d.instituteId === targetInst.id);
      
      if (i <= 700) {
        targetDept = deptList.find(d => d.id === 'dept-1') || deptList[0];
      } else {
        targetDept = deptList[i % deptList.length] || departments[0];
      }
    } else {
      // Distributed across the remaining 11 Institutes
      targetInst = institutes[i % institutes.length];
      const deptList = departments.filter(d => d.instituteId === targetInst.id);
      targetDept = deptList.length > 0 ? deptList[i % deptList.length] : departments[0];
    }

    const progList = programs.filter(p => p.departmentId === targetDept.id || p.instituteId === targetInst.id);
    targetProg = progList.length > 0 ? progList[0] : programs[0];

    const targetSem = semesters.find(s => s.programId === targetProg.id) || semesters[0];
    const targetDiv = divisions.find(d => d.semesterId === targetSem.id) || divisions[0];

    // Assigned mentor from mentor pool
    const assignedMentor = mentorPool[(i - 1) % mentorPool.length];

    const cityObj = rng.choice(CITIES);
    const standingRoll = rng.next();
    const academicStanding: Student['academicStanding'] = 
      standingRoll > 0.90 ? 'ACADEMIC_RISK' : (standingRoll > 0.80 ? 'ATTENDANCE_SHORTAGE' : 'GOOD_STANDING');

    students.push({
      id: studentId,
      enrollmentNo: i === 1 ? '230101001' : enrollmentNo,
      universityId: `SSIU-2026-${targetProg.code || 'CS'}-${padIndex}`,
      grNo: `GR-2026-${padIndex}`,
      rollNo,
      name: fullName,
      firstName,
      middleName,
      lastName,
      fullName,
      email: i === 1 ? 'student@university.edu' : `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@swarrnim.edu.in`,
      phone: `+91 ${rng.nextInt(90000, 99999)} ${rng.nextInt(10000, 99999)}`,
      mobile: `+91 ${rng.nextInt(90000, 99999)} ${rng.nextInt(10000, 99999)}`,
      photo: isMale
        ? `https://images.unsplash.com/photo-${1530000000000 + (i % 600)}?auto=format&fit=crop&w=200&q=80`
        : `https://images.unsplash.com/photo-${1540000000000 + (i % 600)}?auto=format&fit=crop&w=200&q=80`,
      gender: isMale ? 'Male' : 'Female',
      dateOfBirth: `200${rng.nextInt(3, 6)}-0${rng.nextInt(1, 9)}-${rng.nextInt(10, 28)}`,
      dob: `200${rng.nextInt(3, 6)}-0${rng.nextInt(1, 9)}-${rng.nextInt(10, 28)}`,
      bloodGroup: rng.choice(BLOOD_GROUPS),
      category: rng.choice(CATEGORIES),
      admissionDate: '2023-07-15',
      admissionYear: '2023',
      academicYear: '2025-26',
      academicYearId: 'ay-2024',
      batchId: 'batch-2023-2027',
      instituteId: targetInst.id,
      instituteName: targetInst.name,
      departmentId: targetDept.id,
      programId: targetProg.id,
      programName: targetProg.name,
      branch: targetDept.name,
      branchName: targetDept.name,
      semesterId: targetSem.id,
      divisionId: targetDiv.id,
      mentorId: assignedMentor.id,
      guardianName: `${middleName} ${lastName}`,
      guardianPhone: `+91 ${rng.nextInt(90000, 99999)} ${rng.nextInt(10000, 99999)}`,
      address: `Flat ${rng.nextInt(101, 804)}, Shivalik Heights, ${cityObj.city}, ${cityObj.state} ${cityObj.pin}`,
      city: cityObj.city,
      state: cityObj.state,
      country: 'India',
      academicStanding,
      abcId: `${rng.nextInt(1000, 9999)}-${rng.nextInt(1000, 9999)}-${rng.nextInt(1000, 9999)}`,
      abcIdStatus: 'VERIFIED',
      academicLifecycleStatus: 'PURSUING',
      status: 'ACTIVE'
    });
  }

  return students;
}

// ============================================================================
// 3. GENERATE CONNECTED STUDENT DOCUMENTS
// ============================================================================

export function generateCanonicalStudentDocuments(students: Student[]): StudentDocument[] {
  const docs: StudentDocument[] = [];
  const docTypes: { title: string; category: StudentDocument['category']; fileName: string }[] = [
    { title: 'Aadhaar Card', category: 'IDENTITY', fileName: 'Aadhaar_Card.pdf' },
    { title: 'Class 10th Marksheet', category: 'ACADEMIC', fileName: 'Class_10th_Marksheet.pdf' },
    { title: 'Class 12th Marksheet', category: 'ACADEMIC', fileName: 'Class_12th_Marksheet.pdf' },
    { title: 'School Leaving Certificate', category: 'CERTIFICATE', fileName: 'School_Leaving_Certificate.pdf' },
    { title: 'Caste Certificate', category: 'CERTIFICATE', fileName: 'Caste_Certificate.pdf' }
  ];

  students.forEach((student, sIdx) => {
    // Generate 3 standard documents per student
    docTypes.slice(0, 3).forEach((dt, dIdx) => {
      const isVerified = sIdx % 10 !== 0;
      docs.push({
        id: `sdoc-${student.id}-${dIdx + 1}`,
        studentId: student.id,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        title: `${student.name} - ${dt.title}`,
        category: dt.category,
        fileName: `${student.enrollmentNo}_${dt.fileName}`,
        fileSize: '1.4 MB',
        fileUrl: `https://swarrnim.edu.in/vault/docs/${student.id}_${dt.fileName}`,
        uploadDate: '2023-07-20',
        status: isVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
        isLocked: isVerified,
        verifiedBy: isVerified ? 'Demo Registrar 1' : undefined,
        verifiedAt: isVerified ? '2023-07-25' : undefined,
        remarks: isVerified ? 'Verified against state central repository.' : 'Pending document verification.'
      });
    });
  });

  return docs;
}

// ============================================================================
// 4. GENERATE CONNECTED RESULTS & MARKS
// ============================================================================

export function generateCanonicalStudentResults(students: Student[]): StudentResult[] {
  const rng = new DeterministicRNG(777);
  return students.map((student) => {
    const isGood = student.academicStanding === 'GOOD_STANDING';
    const sgpa = isGood ? +(rng.nextInt(75, 98) / 10).toFixed(2) : +(rng.nextInt(45, 64) / 10).toFixed(2);
    const cgpa = +(sgpa * 0.98).toFixed(2);
    const totalMaxMarks = 400;
    const totalMarksObtained = Math.round((sgpa / 10) * totalMaxMarks);

    return {
      id: `res-${student.id}-sem4`,
      examId: 'exam-1',
      examName: 'Summer 2025 Regular Examination',
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      programId: student.programId || 'prog-1',
      programName: student.programName || 'B.Tech CSE',
      departmentId: student.departmentId || 'dept-1',
      semesterId: student.semesterId || 'sem-cse-4',
      totalCredits: 24,
      earnedCredits: isGood ? 24 : 18,
      totalMarksObtained,
      totalMaxMarks,
      percentage: +(totalMarksObtained / totalMaxMarks * 100).toFixed(2),
      sgpa,
      cgpa,
      backlogsCount: isGood ? 0 : 2,
      status: isGood ? 'PASS' : 'ATKT',
      isPublished: true,
      publishedDate: '2025-06-15'
    };
  });
}
