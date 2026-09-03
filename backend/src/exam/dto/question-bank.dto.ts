import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsArray,
  Min,
  Max,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type QuestionType =
  | 'MCQ'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'DESCRIPTIVE'
  | 'NUMERICAL';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export type BloomLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export type QuestionStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'HOD_APPROVED'
  | 'REJECTED'
  | 'AVAILABLE_FOR_PAPER';

export type ExamPaperStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_HOD'
  | 'HOD_APPROVED'
  | 'HOD_REJECTED'
  | 'SUBMITTED_FOR_HOI'
  | 'HOI_LOCKED'
  | 'HOI_REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ExamType =
  | 'MIDTERM'
  | 'ENDTERM'
  | 'INTERNAL'
  | 'PRACTICAL'
  | 'REMEDIAL'
  | 'CLASS_TEST';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'The formulation and text of the question',
    example: 'Explain the working principle of RSA Asymmetric Key Encryption.',
  })
  @IsNotEmpty({ message: 'Question text is required.' })
  @IsString({ message: 'Question text must be a string.' })
  @MinLength(5, { message: 'Question text must be at least 5 characters long.' })
  questionText: string;

  @ApiProperty({
    description: 'Format/Type of question',
    enum: ['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'DESCRIPTIVE', 'NUMERICAL'],
    example: 'DESCRIPTIVE',
  })
  @IsNotEmpty({ message: 'Question type is required.' })
  @IsString()
  @IsIn(['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'DESCRIPTIVE', 'NUMERICAL'], {
    message: 'Invalid question type specified.',
  })
  questionType: QuestionType;

  @ApiPropertyOptional({
    description: 'Choice options for MCQ / MULTIPLE_SELECT questions',
    example: ['Option A', 'Option B', 'Option C', 'Option D'],
  })
  @IsOptional()
  @IsArray({ message: 'Options must be an array of strings.' })
  options?: string[];

  @ApiPropertyOptional({
    description: 'Model solution or correct answer for evaluation',
    example: 'RSA uses prime factorization hardness: n = pq, phi(n) = (p-1)(q-1).',
  })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({
    description: 'Evaluation rubric breakdown and Bloom explanation',
    example: 'Bloom level Analyze (CO3). 2 marks for definition, 2 marks for key exchange, 3 marks for equations.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({
    description: 'Maximum marks allocated for this question',
    example: 7,
    minimum: 0.5,
  })
  @IsNotEmpty({ message: 'Marks allocation is required.' })
  @IsNumber({}, { message: 'Marks must be a valid number.' })
  @Min(0.5, { message: 'Marks must be at least 0.5.' })
  marks: number;

  @ApiPropertyOptional({
    description: 'Cognitive difficulty tier',
    enum: ['EASY', 'MEDIUM', 'HARD'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  @IsIn(['EASY', 'MEDIUM', 'HARD'], { message: 'Difficulty must be EASY, MEDIUM, or HARD.' })
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Bloom Taxonomy cognitive domain level',
    enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
    default: 'UNDERSTAND',
  })
  @IsOptional()
  @IsString()
  @IsIn(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'], {
    message: 'Invalid Bloom taxonomy level specified.',
  })
  bloomLevel?: BloomLevel;

  @ApiProperty({
    description: 'Target Subject Identifier',
    example: 'CS701',
  })
  @IsNotEmpty({ message: 'Subject ID is required.' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({
    description: 'Department Identifier (auto-resolved from subject if omitted)',
    example: 'dept-cse',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Academic Program Identifier',
    example: 'prog-btech-cse',
  })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({
    description: 'Academic Year session (e.g. 2025-26)',
    example: '2025-26',
  })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({
    description: 'Semester number (1-10)',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  semester?: number;

  @ApiPropertyOptional({
    description: 'Syllabus topic',
    example: 'Public Key Infrastructure',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Course unit / module',
    example: 'Unit 3: Cryptographic Algorithms',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Attachment or diagram asset URL',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Client suggested status (Note: Server forces DRAFT on initial creation)',
    enum: ['DRAFT', 'SUBMITTED_FOR_REVIEW'],
  })
  @IsOptional()
  @IsString()
  status?: QuestionStatus;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'DESCRIPTIVE', 'NUMERICAL'])
  questionType?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  marks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])
  bloomLevel?: BloomLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReviewQuestionDto {
  @ApiProperty({
    description: 'Review decision: APPROVED or REJECTED',
    enum: ['APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Scrutiny remarks and justification',
    example: 'Question verified against Course Outcome CO3.',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkUploadQuestionsDto {
  @ApiProperty({ description: 'Subject ID for all imported questions', example: 'CS701' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Program ID' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Academic Year ID', example: '2025-26' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Semester number', example: 7 })
  @IsOptional()
  @IsNumber()
  semester?: number;

  @ApiProperty({ description: 'Array of question items to upload', type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: Partial<CreateQuestionDto>[];
}

export class ExamPaperQuestionItemDto {
  @ApiProperty({ description: 'Question ID from Question Bank' })
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Assigned Section (e.g. SECTION_A, SECTION_B, SECTION_C)' })
  @IsNotEmpty()
  @IsString()
  section: string;

  @ApiProperty({ description: 'Sequence order inside section' })
  @IsNotEmpty()
  @IsNumber()
  questionOrder: number;

  @ApiProperty({ description: 'Marks allocated in paper' })
  @IsNotEmpty()
  @IsNumber()
  marks: number;
}

export class CreateExamPaperDto {
  @ApiProperty({ description: 'Exam Paper Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Program ID' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Semester number' })
  @IsOptional()
  @IsNumber()
  semester?: number;

  @ApiProperty({ description: 'Exam Type (MIDTERM, ENDTERM, etc.)' })
  @IsNotEmpty()
  @IsString()
  examType: ExamType;

  @ApiProperty({ description: 'Target Total Marks' })
  @IsNotEmpty()
  @IsNumber()
  totalMarks: number;

  @ApiProperty({ description: 'Duration in Minutes' })
  @IsNotEmpty()
  @IsNumber()
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Instructions for candidate' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ description: 'Questions mapped to sections', type: [ExamPaperQuestionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamPaperQuestionItemDto)
  questions: ExamPaperQuestionItemDto[];
}

export class UpdateExamPaperDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ type: [ExamPaperQuestionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamPaperQuestionItemDto)
  questions?: ExamPaperQuestionItemDto[];
}

export class ReviewExamPaperDto {
  @ApiProperty({
    description: 'Review action (HOD_APPROVED, HOD_REJECTED, HOI_LOCKED, HOI_REJECTED, PUBLISHED)',
    enum: ['HOD_APPROVED', 'HOD_REJECTED', 'HOI_LOCKED', 'HOI_REJECTED', 'PUBLISHED'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['HOD_APPROVED', 'HOD_REJECTED', 'HOI_LOCKED', 'HOI_REJECTED', 'PUBLISHED'])
  action: 'HOD_APPROVED' | 'HOD_REJECTED' | 'HOI_LOCKED' | 'HOI_REJECTED' | 'PUBLISHED';

  @ApiPropertyOptional({ description: 'Review remarks and scrutiny feedback' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
