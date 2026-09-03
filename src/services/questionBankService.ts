import {
  QuestionBankItem,
  QuestionReviewItem,
  ExamPaperItem,
  ExamPaperQuestionItem,
  ExamPaperReviewItem,
  QuestionFilterState,
  PaperFilterState,
  QuestionBankMetrics,
  BulkUploadPreviewItem,
  BulkUploadRowError,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuestionStatus,
  ExamPaperStatus,
  ExamType,
} from '../types/questionBank';

class QuestionBankService {
  private questions: QuestionBankItem[] = [];
  private papers: ExamPaperItem[] = [];
  private initialized = false;

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    if (this.initialized) return;

    // Seed 10 Realistic Approved and Draft Questions
    this.questions = [
      {
        id: 'q-101',
        questionCode: 'QBK-2026-CS-00001',
        questionText: 'Explain the difference between Symmetric and Asymmetric Cryptography with suitable examples and mathematical foundations.',
        questionType: 'DESCRIPTIVE',
        correctAnswer: 'Symmetric uses identical keys for encryption/decryption (AES, DES). Asymmetric uses key-pairs (RSA, ECC) with private and public components.',
        explanation: 'Bloom taxonomy Level: Analyze (CO3). Rubric: 2 marks for definition, 2 marks for key exchange, 3 marks for algorithms.',
        marks: 7,
        difficultyLevel: 'MEDIUM',
        bloomLevel: 'ANALYZE',
        subjectId: 'sub-cs-701',
        subjectName: 'Network Security & Cryptography',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 7,
        topic: 'Public Key Infrastructure',
        unit: 'Unit 3: Cryptographic Algorithms',
        createdBy: 'fac-101',
        createdByName: 'Dr. Rajesh Sharma',
        status: 'AVAILABLE_FOR_PAPER',
        reviews: [
          {
            id: 'rev-q1',
            questionId: 'q-101',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'APPROVED',
            remarks: 'High quality question aligned with NBA Course Outcome CO3.',
            createdAt: '2026-08-15T10:00:00.000Z',
          },
        ],
        createdAt: '2026-08-14T09:00:00.000Z',
        updatedAt: '2026-08-15T10:00:00.000Z',
      },
      {
        id: 'q-102',
        questionCode: 'QBK-2026-CS-00002',
        questionText: 'Which algorithm is typically utilized in Diffie-Hellman Key Exchange to guarantee computational hardness?',
        questionType: 'MCQ',
        options: ['Discrete Logarithm Problem', 'Knapsack Optimization', 'Shortest Vector Lattice', 'Integer Matrix Factorization'],
        correctAnswer: 'Discrete Logarithm Problem',
        explanation: 'Diffie-Hellman relies on the hardness of calculating discrete logs in cyclic groups.',
        marks: 2,
        difficultyLevel: 'EASY',
        bloomLevel: 'REMEMBER',
        subjectId: 'sub-cs-701',
        subjectName: 'Network Security & Cryptography',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 7,
        topic: 'Key Management',
        unit: 'Unit 2: Key Distribution Protocols',
        createdBy: 'fac-101',
        createdByName: 'Dr. Rajesh Sharma',
        status: 'AVAILABLE_FOR_PAPER',
        reviews: [
          {
            id: 'rev-q2',
            questionId: 'q-102',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'APPROVED',
            remarks: 'Standard conceptual MCQ verified.',
            createdAt: '2026-08-15T10:05:00.000Z',
          },
        ],
        createdAt: '2026-08-14T09:30:00.000Z',
        updatedAt: '2026-08-15T10:05:00.000Z',
      },
      {
        id: 'q-103',
        questionCode: 'QBK-2026-CS-00003',
        questionText: 'Design a high-throughput Convolutional Neural Network pipeline for real-time edge defect detection in industrial fabrication.',
        questionType: 'LONG_ANSWER',
        correctAnswer: 'Architecture: MobileNetV3 backbone + Squeeze-and-Excitation attention + TensorRT quantization pipeline (FP16/INT8).',
        explanation: 'Bloom: Create (CO5). Rubric: 3 marks network architecture, 3 marks quantization and inference optimization, 4 marks latency benchmarking.',
        marks: 10,
        difficultyLevel: 'HARD',
        bloomLevel: 'CREATE',
        subjectId: 'sub-cs-802',
        subjectName: 'Deep Learning & Computer Vision',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 8,
        topic: 'Edge AI Deployment',
        unit: 'Unit 4: Model Quantization & Acceleration',
        createdBy: 'fac-102',
        createdByName: 'Prof. Ananya Iyer',
        status: 'AVAILABLE_FOR_PAPER',
        reviews: [
          {
            id: 'rev-q3',
            questionId: 'q-103',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'APPROVED',
            remarks: 'Excellent industry-relevant application problem.',
            createdAt: '2026-08-18T14:20:00.000Z',
          },
        ],
        createdAt: '2026-08-17T11:00:00.000Z',
        updatedAt: '2026-08-18T14:20:00.000Z',
      },
      {
        id: 'q-104',
        questionCode: 'QBK-2026-CS-00004',
        questionText: 'Calculate the minimum Time Complexity of finding Strongly Connected Components in a directed graph using Tarjan Algorithm.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'O(V + E) where V is the number of vertices and E is the number of edges.',
        explanation: 'Tarjan performs a single Depth First Search traversal.',
        marks: 3,
        difficultyLevel: 'MEDIUM',
        bloomLevel: 'APPLY',
        subjectId: 'sub-cs-301',
        subjectName: 'Advanced Data Structures & Algorithms',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 3,
        topic: 'Graph Algorithms',
        unit: 'Unit 3: Graph Traversal & Connectivity',
        createdBy: 'fac-101',
        createdByName: 'Dr. Rajesh Sharma',
        status: 'AVAILABLE_FOR_PAPER',
        reviews: [
          {
            id: 'rev-q4',
            questionId: 'q-104',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'APPROVED',
            remarks: 'Clear and unambiguous.',
            createdAt: '2026-08-20T09:00:00.000Z',
          },
        ],
        createdAt: '2026-08-19T16:00:00.000Z',
        updatedAt: '2026-08-20T09:00:00.000Z',
      },
      {
        id: 'q-105',
        questionCode: 'QBK-2026-CS-00005',
        questionText: 'What are the ACID properties in database transactions and how does Write-Ahead Logging (WAL) ensure durability during a power outage?',
        questionType: 'DESCRIPTIVE',
        correctAnswer: 'Atomicity, Consistency, Isolation, Durability. WAL records modifications to non-volatile storage before dirty buffer pages are written to disk.',
        explanation: 'Bloom: Understand & Apply. Rubric: 2 marks ACID definitions, 3 marks WAL mechanics, 2 marks crash recovery sequence.',
        marks: 7,
        difficultyLevel: 'MEDIUM',
        bloomLevel: 'UNDERSTAND',
        subjectId: 'sub-cs-402',
        subjectName: 'Database Management Systems',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 4,
        topic: 'Transaction Processing',
        unit: 'Unit 4: Concurrency & Recovery',
        createdBy: 'fac-103',
        createdByName: 'Dr. Vikram Patel',
        status: 'SUBMITTED_FOR_REVIEW',
        reviews: [
          {
            id: 'rev-q5',
            questionId: 'q-105',
            reviewerId: 'fac-103',
            reviewerRole: 'FACULTY',
            action: 'SUBMITTED',
            remarks: 'Submitted for Midterm Question Bank inclusion.',
            createdAt: '2026-08-25T11:00:00.000Z',
          },
        ],
        createdAt: '2026-08-25T11:00:00.000Z',
        updatedAt: '2026-08-25T11:00:00.000Z',
      },
      {
        id: 'q-106',
        questionCode: 'QBK-2026-CS-00006',
        questionText: 'Which of the following sorting algorithms is NOT in-place?',
        questionType: 'MCQ',
        options: ['QuickSort', 'HeapSort', 'MergeSort', 'InsertionSort'],
        correctAnswer: 'MergeSort',
        explanation: 'Standard MergeSort requires O(N) auxiliary space.',
        marks: 2,
        difficultyLevel: 'EASY',
        bloomLevel: 'REMEMBER',
        subjectId: 'sub-cs-301',
        subjectName: 'Advanced Data Structures & Algorithms',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 3,
        topic: 'Divide & Conquer',
        unit: 'Unit 2: Sorting Techniques',
        createdBy: 'fac-101',
        createdByName: 'Dr. Rajesh Sharma',
        status: 'DRAFT',
        createdAt: '2026-08-28T15:00:00.000Z',
        updatedAt: '2026-08-28T15:00:00.000Z',
      },
    ];

    // Seed 3 Realistic Exam Papers in various lifecycle stages
    this.papers = [
      {
        id: 'ppr-201',
        paperCode: 'PPR-2026-CS-0001',
        title: 'B.Tech Semester VII Regular Midterm Examination — Network Security & Cryptography',
        subjectId: 'sub-cs-701',
        subjectName: 'Network Security & Cryptography',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 7,
        examType: 'MIDTERM',
        totalMarks: 30,
        durationMinutes: 90,
        instructions: '1. All questions are compulsory.\n2. Write clear equations and block diagrams.\n3. Programmable calculators are prohibited.',
        status: 'PUBLISHED',
        createdBy: 'fac-101',
        createdByName: 'Dr. Rajesh Sharma',
        publishedAt: '2026-08-22T10:00:00.000Z',
        lockedAt: '2026-08-21T18:00:00.000Z',
        questions: [
          {
            id: 'pq-1',
            examPaperId: 'ppr-201',
            questionId: 'q-102',
            section: 'SECTION_A',
            questionOrder: 1,
            marks: 2,
            question: this.questions.find(q => q.id === 'q-102'),
            createdAt: '2026-08-20T10:00:00.000Z',
          },
          {
            id: 'pq-2',
            examPaperId: 'ppr-201',
            questionId: 'q-101',
            section: 'SECTION_B',
            questionOrder: 2,
            marks: 7,
            question: this.questions.find(q => q.id === 'q-101'),
            createdAt: '2026-08-20T10:00:00.000Z',
          },
        ],
        reviews: [
          {
            id: 'pr-1',
            examPaperId: 'ppr-201',
            reviewerId: 'fac-101',
            reviewerRole: 'FACULTY',
            action: 'SUBMITTED_FOR_HOD',
            remarks: 'Midterm paper assembled with approved question bank items.',
            createdAt: '2026-08-20T10:30:00.000Z',
          },
          {
            id: 'pr-2',
            examPaperId: 'ppr-201',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'HOD_APPROVED',
            remarks: 'Paper structure, Bloom taxonomy weightage, and mark breakdown verified.',
            createdAt: '2026-08-21T11:00:00.000Z',
          },
          {
            id: 'pr-3',
            examPaperId: 'ppr-201',
            reviewerId: 'hoi-01',
            reviewerRole: 'PRINCIPAL',
            action: 'HOI_LOCKED',
            remarks: 'Final paper audited and cryptographically locked.',
            createdAt: '2026-08-21T18:00:00.000Z',
          },
          {
            id: 'pr-4',
            examPaperId: 'ppr-201',
            reviewerId: 'hoi-01',
            reviewerRole: 'PRINCIPAL',
            action: 'PUBLISHED',
            remarks: 'Paper published to examination hall and student portal.',
            createdAt: '2026-08-22T10:00:00.000Z',
          },
        ],
        createdAt: '2026-08-20T09:00:00.000Z',
        updatedAt: '2026-08-22T10:00:00.000Z',
      },
      {
        id: 'ppr-202',
        paperCode: 'PPR-2026-CS-0002',
        title: 'B.Tech Semester VIII Endterm Examination — Deep Learning & Computer Vision',
        subjectId: 'sub-cs-802',
        subjectName: 'Deep Learning & Computer Vision',
        departmentId: 'dept-cse',
        departmentName: 'Computer Engineering',
        programId: 'prog-btech-cse',
        programName: 'B.Tech Computer Engineering',
        academicYear: '2025-26',
        semester: 8,
        examType: 'ENDTERM',
        totalMarks: 70,
        durationMinutes: 180,
        instructions: '1. Section A is compulsory (20 marks).\n2. Answer any 5 questions from Section B.',
        status: 'SUBMITTED_FOR_HOI',
        createdBy: 'fac-102',
        createdByName: 'Prof. Ananya Iyer',
        questions: [
          {
            id: 'pq-3',
            examPaperId: 'ppr-202',
            questionId: 'q-103',
            section: 'SECTION_C',
            questionOrder: 1,
            marks: 10,
            question: this.questions.find(q => q.id === 'q-103'),
            createdAt: '2026-08-26T14:00:00.000Z',
          },
        ],
        reviews: [
          {
            id: 'pr-5',
            examPaperId: 'ppr-202',
            reviewerId: 'fac-102',
            reviewerRole: 'FACULTY',
            action: 'SUBMITTED_FOR_HOD',
            remarks: 'Endterm question paper submitted for departmental scrutiny.',
            createdAt: '2026-08-26T15:00:00.000Z',
          },
          {
            id: 'pr-6',
            examPaperId: 'ppr-202',
            reviewerId: 'hod-01',
            reviewerRole: 'HOD',
            action: 'HOD_APPROVED',
            remarks: 'Scrutinized and recommended to Institute Examination Superintendent.',
            createdAt: '2026-08-27T10:00:00.000Z',
          },
        ],
        createdAt: '2026-08-26T14:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
    ];

    this.initialized = true;
  }

  // --- QUESTION OPERATIONS ---

  getQuestions(filters?: QuestionFilterState, userRole?: string, user?: any): QuestionBankItem[] {
    let result = [...this.questions];

    if (userRole === 'STUDENT') {
      result = result.filter(q => q.status === 'AVAILABLE_FOR_PAPER' || q.status === 'HOD_APPROVED');
    } else if (filters?.myOnly && user?.id) {
      result = result.filter(q => q.createdBy === user.id);
    }

    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      result = result.filter(q => q.academicYear === filters.academicYear);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      result = result.filter(q => q.departmentId === filters.departmentId);
    }
    if (filters?.subjectId && filters.subjectId !== 'ALL') {
      result = result.filter(q => q.subjectId === filters.subjectId);
    }
    if (filters?.difficultyLevel && filters.difficultyLevel !== 'ALL') {
      result = result.filter(q => q.difficultyLevel === filters.difficultyLevel);
    }
    if (filters?.questionType && filters.questionType !== 'ALL') {
      result = result.filter(q => q.questionType === filters.questionType);
    }
    if (filters?.bloomLevel && filters.bloomLevel !== 'ALL') {
      result = result.filter(q => q.bloomLevel === filters.bloomLevel);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(q => q.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(item =>
        item.questionText.toLowerCase().includes(q) ||
        item.questionCode.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        (item.subjectName && item.subjectName.toLowerCase().includes(q))
      );
    }

    // Sanitize for student: strip answer & internal reviewer notes
    if (userRole === 'STUDENT') {
      return result.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
        reviews: [],
      }));
    }

    return result;
  }

  getApprovedQuestionsForSubject(subjectId: string): QuestionBankItem[] {
    return this.questions.filter(
      q => q.subjectId === subjectId && (q.status === 'AVAILABLE_FOR_PAPER' || q.status === 'HOD_APPROVED')
    );
  }

  createQuestion(payload: Partial<QuestionBankItem>, user: any, userRole: string): QuestionBankItem {
    if (userRole === 'STUDENT') {
      throw new Error('Students are not permitted to create questions.');
    }

    const count = this.questions.length + 1;
    const year = new Date().getFullYear();
    const subCode = payload.subjectId?.slice(0, 4).toUpperCase() || 'GEN';
    const questionCode = `QBK-${year}-${subCode}-${String(count).padStart(5, '0')}`;

    const newQuestion: QuestionBankItem = {
      id: `q-${Date.now()}`,
      questionCode,
      questionText: payload.questionText || '',
      questionType: payload.questionType || 'MCQ',
      options: payload.options || [],
      correctAnswer: payload.correctAnswer || '',
      explanation: payload.explanation || '',
      marks: Number(payload.marks) || 1,
      difficultyLevel: payload.difficultyLevel || 'MEDIUM',
      bloomLevel: payload.bloomLevel || 'UNDERSTAND',
      subjectId: payload.subjectId || 'sub-cs-701',
      subjectName: payload.subjectName || 'Computer Science Subject',
      departmentId: payload.departmentId || 'dept-cse',
      departmentName: payload.departmentName || 'Computer Engineering',
      programId: payload.programId || 'prog-btech-cse',
      programName: payload.programName || 'B.Tech Computer Engineering',
      academicYear: payload.academicYear || '2025-26',
      semester: Number(payload.semester) || 1,
      topic: payload.topic || '',
      unit: payload.unit || '',
      attachmentUrl: payload.attachmentUrl,
      createdBy: user?.id || 'fac-user',
      createdByName: user?.name || 'Faculty Member',
      status: payload.status === 'SUBMITTED_FOR_REVIEW' ? 'SUBMITTED_FOR_REVIEW' : 'DRAFT',
      reviews: payload.status === 'SUBMITTED_FOR_REVIEW'
        ? [
            {
              id: `rev-${Date.now()}`,
              questionId: `q-${Date.now()}`,
              reviewerId: user?.id || 'fac-user',
              reviewerRole: userRole,
              action: 'SUBMITTED',
              remarks: 'Question submitted for review.',
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.questions.unshift(newQuestion);
    return newQuestion;
  }

  updateQuestion(id: string, payload: Partial<QuestionBankItem>, user: any, userRole: string): QuestionBankItem {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx === -1) throw new Error(`Question ${id} not found.`);

    const q = this.questions[idx];
    if (userRole === 'STUDENT') throw new Error('Students cannot modify questions.');
    if (userRole === 'FACULTY' && q.createdBy !== user?.id) {
      throw new Error('Faculty can only modify their own questions.');
    }
    if (userRole === 'FACULTY' && q.status === 'HOD_APPROVED') {
      throw new Error('Cannot edit an approved question directly.');
    }

    const updated = {
      ...q,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.questions[idx] = updated;
    return updated;
  }

  deleteQuestion(id: string, user: any, userRole: string): boolean {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx === -1) throw new Error(`Question ${id} not found.`);

    const q = this.questions[idx];
    if (userRole === 'STUDENT') throw new Error('Students cannot delete questions.');
    if (userRole === 'FACULTY' && q.createdBy !== user?.id) {
      throw new Error('Faculty can only delete their own draft questions.');
    }
    if (userRole === 'FACULTY' && q.status !== 'DRAFT' && q.status !== 'REJECTED') {
      throw new Error('Faculty can only delete DRAFT or REJECTED questions.');
    }

    // Check if used in paper
    const isUsed = this.papers.some(p => p.questions.some(pq => pq.questionId === id));
    if (isUsed) {
      throw new Error('Cannot delete a question that is assigned to existing examination papers.');
    }

    this.questions.splice(idx, 1);
    return true;
  }

  submitQuestionForReview(id: string, user: any, userRole: string): QuestionBankItem {
    const q = this.questions.find(item => item.id === id);
    if (!q) throw new Error(`Question ${id} not found.`);

    if (userRole === 'FACULTY' && q.createdBy !== user?.id) {
      throw new Error('Faculty can only submit their own questions.');
    }

    q.status = 'SUBMITTED_FOR_REVIEW';
    q.updatedAt = new Date().toISOString();
    q.reviews = q.reviews || [];
    q.reviews.push({
      id: `rev-${Date.now()}`,
      questionId: id,
      reviewerId: user?.id || 'fac-user',
      reviewerRole: userRole,
      action: 'SUBMITTED',
      remarks: 'Submitted for HOD review.',
      createdAt: new Date().toISOString(),
    });

    return q;
  }

  reviewQuestion(id: string, decision: 'APPROVED' | 'REJECTED', remarks: string, user: any, userRole: string): QuestionBankItem {
    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      throw new Error('Only HOD or higher authority can review questions.');
    }

    const q = this.questions.find(item => item.id === id);
    if (!q) throw new Error(`Question ${id} not found.`);

    // Self-approval defense
    if (q.createdBy === user?.id && userRole !== 'SUPER_ADMIN') {
      throw new Error('Creator cannot approve their own questions as HOD.');
    }

    q.status = decision === 'APPROVED' ? 'AVAILABLE_FOR_PAPER' : 'REJECTED';
    q.updatedAt = new Date().toISOString();
    q.reviews = q.reviews || [];
    q.reviews.push({
      id: `rev-${Date.now()}`,
      questionId: id,
      reviewerId: user?.id || 'hod-01',
      reviewerRole: userRole,
      action: decision,
      remarks,
      createdAt: new Date().toISOString(),
    });

    return q;
  }

  // --- BULK UPLOAD VALIDATOR & IMPORTER ---

  parseAndValidateBulkCsv(csvContent: string): { preview: BulkUploadPreviewItem[]; errors: BulkUploadRowError[] } {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { preview: [], errors: [{ row: 1, field: 'file', error: 'File is empty or missing headers.' }] };
    }

    const preview: BulkUploadPreviewItem[] = [];
    const errors: BulkUploadRowError[] = [];

    // Header expected: questionText,questionType,options,correctAnswer,explanation,marks,difficultyLevel,bloomLevel,topic,unit
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const rowNum = i + 1;

      const questionText = cols[0] || '';
      const questionType = (cols[1]?.toUpperCase() || 'MCQ') as QuestionType;
      const optionsRaw = cols[2] || '';
      const options = optionsRaw ? optionsRaw.split(';').map(o => o.trim()) : undefined;
      const correctAnswer = cols[3] || '';
      const explanation = cols[4] || '';
      const marks = Number(cols[5]) || 1;
      const difficultyLevel = (cols[6]?.toUpperCase() || 'MEDIUM') as DifficultyLevel;
      const bloomLevel = (cols[7]?.toUpperCase() || 'UNDERSTAND') as BloomLevel;
      const topic = cols[8] || '';
      const unit = cols[9] || '';

      const rowErrors: string[] = [];

      if (!questionText) {
        rowErrors.push('Missing question text');
        errors.push({ row: rowNum, field: 'questionText', error: 'Question text is required.' });
      }
      if (marks <= 0) {
        rowErrors.push('Marks must be > 0');
        errors.push({ row: rowNum, field: 'marks', error: 'Marks must be greater than zero.' });
      }
      if (questionType === 'MCQ' && (!options || options.length < 2)) {
        rowErrors.push('MCQ requires at least 2 semicolon-separated options');
        errors.push({ row: rowNum, field: 'options', error: 'MCQ requires at least 2 choices.' });
      }

      preview.push({
        row: rowNum,
        questionText,
        questionType,
        options,
        correctAnswer,
        explanation,
        marks,
        difficultyLevel,
        bloomLevel,
        topic,
        unit,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    return { preview, errors };
  }

  commitBulkUpload(
    items: BulkUploadPreviewItem[],
    subjectId: string,
    subjectName: string,
    departmentId: string,
    departmentName: string,
    academicYear: string,
    semester: number,
    user: any
  ): { importedCount: number } {
    const validItems = items.filter(i => i.isValid);
    const existingCount = this.questions.length;
    const year = new Date().getFullYear();
    const subCode = subjectId.slice(0, 4).toUpperCase();

    validItems.forEach((item, idx) => {
      const qCode = `QBK-${year}-${subCode}-${String(existingCount + idx + 1).padStart(5, '0')}`;
      this.questions.push({
        id: `q-bulk-${Date.now()}-${idx}`,
        questionCode: qCode,
        questionText: item.questionText,
        questionType: item.questionType,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        marks: item.marks,
        difficultyLevel: item.difficultyLevel,
        bloomLevel: item.bloomLevel,
        subjectId,
        subjectName,
        departmentId,
        departmentName,
        academicYear,
        semester,
        topic: item.topic,
        unit: item.unit,
        createdBy: user?.id || 'fac-user',
        createdByName: user?.name || 'Faculty Member',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return { importedCount: validItems.length };
  }

  // --- EXAM PAPER OPERATIONS ---

  getPapers(filters?: PaperFilterState, userRole?: string, user?: any): ExamPaperItem[] {
    let result = [...this.papers];

    if (userRole === 'STUDENT') {
      result = result.filter(p => p.status === 'PUBLISHED');
    } else if (filters?.myOnly && user?.id) {
      result = result.filter(p => p.createdBy === user.id);
    }

    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      result = result.filter(p => p.academicYear === filters.academicYear);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      result = result.filter(p => p.departmentId === filters.departmentId);
    }
    if (filters?.subjectId && filters.subjectId !== 'ALL') {
      result = result.filter(p => p.subjectId === filters.subjectId);
    }
    if (filters?.examType && filters.examType !== 'ALL') {
      result = result.filter(p => p.examType === filters.examType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.paperCode.toLowerCase().includes(q) ||
        (p.subjectName && p.subjectName.toLowerCase().includes(q))
      );
    }

    if (userRole === 'STUDENT') {
      return result.map(p => ({
        ...p,
        reviews: [],
        questions: p.questions.map(pq => ({
          ...pq,
          question: pq.question ? {
            ...pq.question,
            correctAnswer: undefined,
            explanation: undefined,
            reviews: [],
          } : undefined,
        })),
      }));
    }

    return result;
  }

  createExamPaper(payload: Partial<ExamPaperItem>, user: any, userRole: string): ExamPaperItem {
    if (userRole === 'STUDENT') throw new Error('Students cannot create exam papers.');

    const count = this.papers.length + 1;
    const year = new Date().getFullYear();
    const subCode = payload.subjectId?.slice(0, 4).toUpperCase() || 'GEN';
    const paperCode = `PPR-${year}-${subCode}-${String(count).padStart(4, '0')}`;

    const newPaper: ExamPaperItem = {
      id: `ppr-${Date.now()}`,
      paperCode,
      title: payload.title || 'Examination Question Paper Draft',
      subjectId: payload.subjectId || 'sub-cs-701',
      subjectName: payload.subjectName || 'Computer Science Subject',
      departmentId: payload.departmentId || 'dept-cse',
      departmentName: payload.departmentName || 'Computer Engineering',
      programId: payload.programId || 'prog-btech-cse',
      programName: payload.programName || 'B.Tech Computer Engineering',
      academicYear: payload.academicYear || '2025-26',
      semester: Number(payload.semester) || 1,
      examType: payload.examType || 'MIDTERM',
      totalMarks: Number(payload.totalMarks) || 100,
      durationMinutes: Number(payload.durationMinutes) || 180,
      instructions: payload.instructions || '1. All questions are compulsory unless specified.\n2. Programmable calculators prohibited.',
      status: 'DRAFT',
      createdBy: user?.id || 'fac-user',
      createdByName: user?.name || 'Faculty Member',
      questions: payload.questions || [],
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.papers.unshift(newPaper);
    return newPaper;
  }

  updateExamPaper(id: string, payload: Partial<ExamPaperItem>, user: any, userRole: string): ExamPaperItem {
    const p = this.papers.find(item => item.id === id);
    if (!p) throw new Error(`Exam Paper ${id} not found.`);

    if (p.status === 'HOI_LOCKED' || p.status === 'PUBLISHED') {
      throw new Error(`Cannot modify ${p.status} exam paper.`);
    }
    if (userRole === 'STUDENT') throw new Error('Students cannot modify exam papers.');
    if (userRole === 'FACULTY' && p.createdBy !== user?.id) {
      throw new Error('Faculty can only modify their own draft papers.');
    }

    Object.assign(p, payload, { updatedAt: new Date().toISOString() });
    return p;
  }

  submitPaperForHOD(id: string, user: any, userRole: string): ExamPaperItem {
    const p = this.papers.find(item => item.id === id);
    if (!p) throw new Error(`Exam Paper ${id} not found.`);

    if (userRole === 'FACULTY' && p.createdBy !== user?.id) {
      throw new Error('Faculty can only submit their own papers.');
    }
    if (p.questions.length === 0) {
      throw new Error('Cannot submit empty exam paper without questions.');
    }

    p.status = 'SUBMITTED_FOR_HOD';
    p.updatedAt = new Date().toISOString();
    p.reviews = p.reviews || [];
    p.reviews.push({
      id: `pr-${Date.now()}`,
      examPaperId: id,
      reviewerId: user?.id || 'fac-user',
      reviewerRole: userRole,
      action: 'SUBMITTED_FOR_HOD',
      remarks: 'Paper assembled and submitted for departmental HOD approval.',
      createdAt: new Date().toISOString(),
    });

    return p;
  }

  reviewPaperByHOD(id: string, decision: 'HOD_APPROVED' | 'HOD_REJECTED', remarks: string, user: any, userRole: string): ExamPaperItem {
    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      throw new Error('Only HOD can review exam papers at HOD stage.');
    }

    const p = this.papers.find(item => item.id === id);
    if (!p) throw new Error(`Exam Paper ${id} not found.`);

    if (p.createdBy === user?.id && userRole !== 'SUPER_ADMIN') {
      throw new Error('Creator cannot approve their own paper as HOD.');
    }

    p.status = decision;
    p.updatedAt = new Date().toISOString();
    p.reviews = p.reviews || [];
    p.reviews.push({
      id: `pr-${Date.now()}`,
      examPaperId: id,
      reviewerId: user?.id || 'hod-01',
      reviewerRole: userRole,
      action: decision,
      remarks,
      createdAt: new Date().toISOString(),
    });

    return p;
  }

  submitPaperForHOI(id: string, user: any, userRole: string): ExamPaperItem {
    const p = this.papers.find(item => item.id === id);
    if (!p) throw new Error(`Exam Paper ${id} not found.`);

    if (p.status !== 'HOD_APPROVED') {
      throw new Error('Paper must be HOD_APPROVED before submitting to HOI.');
    }

    p.status = 'SUBMITTED_FOR_HOI';
    p.updatedAt = new Date().toISOString();
    p.reviews = p.reviews || [];
    p.reviews.push({
      id: `pr-${Date.now()}`,
      examPaperId: id,
      reviewerId: user?.id || 'hod-01',
      reviewerRole: userRole,
      action: 'SUBMITTED_FOR_HOI',
      remarks: 'Escalated to HOI / Principal for final locking.',
      createdAt: new Date().toISOString(),
    });

    return p;
  }

  reviewPaperByHOI(id: string, decision: 'HOI_LOCKED' | 'HOI_REJECTED' | 'PUBLISHED', remarks: string, user: any, userRole: string): ExamPaperItem {
    if (userRole === 'STUDENT' || userRole === 'FACULTY' || userRole === 'HOD') {
      throw new Error('Only HOI / Principal can lock and publish exam papers.');
    }

    const p = this.papers.find(item => item.id === id);
    if (!p) throw new Error(`Exam Paper ${id} not found.`);

    p.status = decision;
    p.updatedAt = new Date().toISOString();
    if (decision === 'HOI_LOCKED') {
      p.lockedAt = new Date().toISOString();
    } else if (decision === 'PUBLISHED') {
      p.publishedAt = new Date().toISOString();
      if (!p.lockedAt) p.lockedAt = new Date().toISOString();
    }

    p.reviews = p.reviews || [];
    p.reviews.push({
      id: `pr-${Date.now()}`,
      examPaperId: id,
      reviewerId: user?.id || 'hoi-01',
      reviewerRole: userRole,
      action: decision,
      remarks,
      createdAt: new Date().toISOString(),
    });

    return p;
  }

  // --- METRICS & REPORTING ---

  getMetrics(filters?: QuestionFilterState, userRole?: string, user?: any): QuestionBankMetrics {
    const allQ = this.questions;
    const allP = this.papers;

    const diffDist: Record<DifficultyLevel, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
    allQ.forEach(q => { diffDist[q.difficultyLevel] = (diffDist[q.difficultyLevel] || 0) + 1; });

    const bloomDist: Record<BloomLevel, number> = {
      REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
    };
    allQ.forEach(q => { bloomDist[q.bloomLevel] = (bloomDist[q.bloomLevel] || 0) + 1; });

    const typeDist: Record<QuestionType, number> = {
      MCQ: 0, MULTIPLE_SELECT: 0, TRUE_FALSE: 0, SHORT_ANSWER: 0, LONG_ANSWER: 0, DESCRIPTIVE: 0, NUMERICAL: 0,
    };
    allQ.forEach(q => { typeDist[q.questionType] = (typeDist[q.questionType] || 0) + 1; });

    return {
      totalQuestions: allQ.length,
      draftQuestions: allQ.filter(q => q.status === 'DRAFT').length,
      pendingReviewQuestions: allQ.filter(q => q.status === 'SUBMITTED_FOR_REVIEW').length,
      approvedQuestions: allQ.filter(q => q.status === 'HOD_APPROVED' || q.status === 'AVAILABLE_FOR_PAPER').length,
      rejectedQuestions: allQ.filter(q => q.status === 'REJECTED').length,
      availableQuestions: allQ.filter(q => q.status === 'AVAILABLE_FOR_PAPER' || q.status === 'HOD_APPROVED').length,
      totalPapers: allP.length,
      draftPapers: allP.filter(p => p.status === 'DRAFT').length,
      pendingHOD: allP.filter(p => p.status === 'SUBMITTED_FOR_HOD').length,
      hodApproved: allP.filter(p => p.status === 'HOD_APPROVED').length,
      pendingHOI: allP.filter(p => p.status === 'SUBMITTED_FOR_HOI').length,
      hoiLocked: allP.filter(p => p.status === 'HOI_LOCKED').length,
      publishedPapers: allP.filter(p => p.status === 'PUBLISHED').length,
      rejectedPapers: allP.filter(p => p.status === 'HOD_REJECTED' || p.status === 'HOI_REJECTED').length,
      facultyMetrics: {
        myQuestions: allQ.filter(q => q.createdBy === user?.id).length,
        myDrafts: allQ.filter(q => q.createdBy === user?.id && q.status === 'DRAFT').length,
        myPending: allQ.filter(q => q.createdBy === user?.id && q.status === 'SUBMITTED_FOR_REVIEW').length,
        myApproved: allQ.filter(q => q.createdBy === user?.id && (q.status === 'HOD_APPROVED' || q.status === 'AVAILABLE_FOR_PAPER')).length,
        myPapers: allP.filter(p => p.createdBy === user?.id).length,
        myPaperDrafts: allP.filter(p => p.createdBy === user?.id && p.status === 'DRAFT').length,
      },
      difficultyDistribution: diffDist,
      bloomDistribution: bloomDist,
      typeDistribution: typeDist,
    };
  }

  // --- 15 PRE-CONFIGURED EXCEL & AUDIT REPORTS EXPORT ---

  exportComprehensiveReports(filters?: QuestionFilterState, userRole?: string, user?: any) {
    const questions = this.getQuestions(filters, userRole, user);
    const papers = this.getPapers(filters as any, userRole, user);

    const csvData: string[] = [];
    csvData.push('=== SSIU SMART EXAMINATION & QUESTION BANK AUDIT REPORT ===');
    csvData.push(`Generated On: ${new Date().toLocaleString()}`);
    csvData.push(`Total Questions: ${questions.length}`);
    csvData.push(`Total Exam Papers: ${papers.length}`);
    csvData.push('\n--- SECTION 1: QUESTION BANK AUDIT INVENTORY ---');
    csvData.push('Code,Question Text,Type,Marks,Difficulty,Bloom Level,Subject,Department,Status,Created By');

    questions.forEach(q => {
      const cleanText = q.questionText.replace(/,/g, ' ').replace(/\n/g, ' ');
      csvData.push(`${q.questionCode},"${cleanText}",${q.questionType},${q.marks},${q.difficultyLevel},${q.bloomLevel},${q.subjectName || q.subjectId},${q.departmentName || q.departmentId},${q.status},${q.createdByName || q.createdBy}`);
    });

    csvData.push('\n--- SECTION 2: EXAM PAPERS & WORKFLOW AUDIT ---');
    csvData.push('Paper Code,Title,Exam Type,Total Marks,Duration Min,Status,Subject,Department,Locked At,Published At');

    papers.forEach(p => {
      const cleanTitle = p.title.replace(/,/g, ' ');
      csvData.push(`${p.paperCode},"${cleanTitle}",${p.examType},${p.totalMarks},${p.durationMinutes},${p.status},${p.subjectName || p.subjectId},${p.departmentName || p.departmentId},${p.lockedAt || 'N/A'},${p.publishedAt || 'N/A'}`);
    });

    const blob = new Blob([csvData.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSIU_Exam_QuestionBank_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadCsvTemplate() {
    const template = [
      'questionText,questionType,options,correctAnswer,explanation,marks,difficultyLevel,bloomLevel,topic,unit',
      '"What is the primary function of an operating system kernel?",MCQ,"Memory management;User interface;Hardware design;Power delivery","Memory management","The kernel manages system resources.",2,EASY,REMEMBER,"OS Architecture","Unit 1"',
      '"Explain the working principle of Transformer attention mechanism.",DESCRIPTIVE,"","Scaled dot product attention computes softmax(QK^T / sqrt(d_k))V","Attention weights determine contextual embeddings.",7,HARD,ANALYZE,"Self-Attention","Unit 3"',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SSIU_Question_Bank_Upload_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const questionBankService = new QuestionBankService();
