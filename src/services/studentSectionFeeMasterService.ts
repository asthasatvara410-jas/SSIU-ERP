// ==============================================================================
// SWARRNIM STARTUP & INNOVATION UNIVERSITY — STUDENT SECTION FEE MASTER SERVICE
// ==============================================================================
// Single Source of Truth for all official University student service fees,
// condition rules (pass-out / non-pass-out, document types, number of copies,
// expedited charges, postal dispatch), and itemized fee breakdown calculations.
// ==============================================================================

import { db } from './db';
import { 
  ServiceFeeMasterConfig, 
  ServiceFeeCalculationResult, 
  ServiceFeeCalculationBreakdownItem,
  StudentServiceCategory 
} from '../types/studentSection';

export const INITIAL_SERVICE_FEE_MASTER_CONFIGS: ServiceFeeMasterConfig[] = [
  {
    id: 'fmc-transcript',
    serviceCode: 'TRANSCRIPT',
    serviceName: 'Official Academic Transcript',
    category: 'TRANSCRIPT',
    baseFeeEnrolled: 300,
    baseFeePassout: 500,
    perCopyFee: 200,
    firstCopyIncluded: true,
    urgentFee: 500,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-migration',
    serviceCode: 'MIGRATION',
    serviceName: 'Migration Certificate',
    category: 'MIGRATION',
    baseFeeEnrolled: 300,
    baseFeePassout: 400,
    perCopyFee: 200,
    firstCopyIncluded: true,
    urgentFee: 400,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-prov-degree',
    serviceCode: 'PROVISIONAL_DEGREE',
    serviceName: 'Provisional Degree Certificate',
    category: 'DEGREE',
    baseFeeEnrolled: 300,
    baseFeePassout: 300,
    perCopyFee: 150,
    firstCopyIncluded: true,
    urgentFee: 300,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-no-backlog',
    serviceCode: 'NO_BACKLOG',
    serviceName: 'No Backlog Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 150,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-trial',
    serviceCode: 'TRIAL_CERTIFICATE',
    serviceName: 'Trial Certificate / Attempt Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 200,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 200,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-passing',
    serviceCode: 'PASSING_CERTIFICATE',
    serviceName: 'Passing Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 200,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 200,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-doc-verification',
    serviceCode: 'DOC_VERIFICATION',
    serviceName: 'Document Verification & Attestation',
    category: 'VERIFICATION',
    baseFeeEnrolled: 200,
    baseFeePassout: 300,
    perCopyFee: 100,
    firstCopyIncluded: true,
    documentTypeRates: {
      'Grade Sheet / Mark Sheet': { baseFee: 100, perCopyFee: 100 },
      'Provisional Degree Certificate': { baseFee: 200, perCopyFee: 100 },
      'Degree Certificate': { baseFee: 300, perCopyFee: 150 },
      'Detailed Teaching Scheme / Syllabus': { baseFee: 500, perCopyFee: 200 },
      'Consolidated Transcript': { baseFee: 300, perCopyFee: 150 },
      'Other Official University Document': { baseFee: 200, perCopyFee: 100 }
    },
    urgentFee: 300,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-marksheet-dup',
    serviceCode: 'MARKSHEET_COPY',
    serviceName: 'Duplicate Grade Sheet / Mark Sheet',
    category: 'MARKSHEET',
    baseFeeEnrolled: 200,
    baseFeePassout: 200,
    perCopyFee: 200,
    firstCopyIncluded: true,
    urgentFee: 200,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-rank',
    serviceCode: 'RANK_CERTIFICATE',
    serviceName: 'Rank Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 200,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 200,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-language',
    serviceCode: 'LANGUAGE_OF_STUDY',
    serviceName: 'Language of Study / Medium of Instruction Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 150,
    baseFeePassout: 150,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-cgpa-conversion',
    serviceCode: 'CGPA_CONVERSION_SCHEME',
    serviceName: 'Scheme showing conversion of SGPA / CGPA into Percentage',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 100,
    baseFeePassout: 100,
    perCopyFee: 50,
    firstCopyIncluded: true,
    urgentFee: 100,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-auth-cert',
    serviceCode: 'AUTH_CERTIFICATE',
    serviceName: 'Certificate / Grade / Mark Sheet Authentication',
    category: 'VERIFICATION',
    baseFeeEnrolled: 250,
    baseFeePassout: 250,
    perCopyFee: 150,
    firstCopyIncluded: true,
    urgentFee: 250,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-bonafide',
    serviceCode: 'BONAFIDE',
    serviceName: 'Bonafide Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 100,
    baseFeePassout: 150,
    perCopyFee: 50,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-lor',
    serviceCode: 'LOR',
    serviceName: 'Letter of Recommendation (LOR)',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 150,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-transfer',
    serviceCode: 'TRANSFER_CERTIFICATE',
    serviceName: 'Transfer Certificate (TC) / Leaving Certificate (LC)',
    category: 'TRANSFER',
    baseFeeEnrolled: 250,
    baseFeePassout: 300,
    perCopyFee: 200,
    firstCopyIncluded: true,
    urgentFee: 250,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-character',
    serviceCode: 'CHARACTER_CERTIFICATE',
    serviceName: 'Character & Conduct Certificate',
    category: 'CERTIFICATE',
    baseFeeEnrolled: 100,
    baseFeePassout: 150,
    perCopyFee: 50,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-degree',
    serviceCode: 'DEGREE',
    serviceName: 'Original Degree Certificate (Convocation)',
    category: 'DEGREE',
    baseFeeEnrolled: 1500,
    baseFeePassout: 1500,
    perCopyFee: 1500,
    firstCopyIncluded: true,
    urgentFee: 1500,
    postalCharges: 100,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-duplicate-id',
    serviceCode: 'DUPLICATE_ID',
    serviceName: 'Duplicate Smart Student ID Card',
    category: 'DUPLICATE_ID',
    baseFeeEnrolled: 150,
    baseFeePassout: 150,
    perCopyFee: 150,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  },
  {
    id: 'fmc-other-cert',
    serviceCode: 'OTHER_CERTIFICATE',
    serviceName: 'Other Special Certificate / Service',
    category: 'OTHER',
    baseFeeEnrolled: 150,
    baseFeePassout: 200,
    perCopyFee: 100,
    firstCopyIncluded: true,
    urgentFee: 150,
    postalCharges: 50,
    processingCharges: 0,
    isRefundable: false,
    isActive: true
  }
];

export class StudentSectionFeeMasterEngine {
  private static instance: StudentSectionFeeMasterEngine;

  private constructor() {}

  public static getInstance(): StudentSectionFeeMasterEngine {
    if (!StudentSectionFeeMasterEngine.instance) {
      StudentSectionFeeMasterEngine.instance = new StudentSectionFeeMasterEngine();
    }
    return StudentSectionFeeMasterEngine.instance;
  }

  // ============================================================================
  // 1. GET ALL FEE CONFIGURATIONS (DATABASE PERSISTED)
  // ============================================================================
  public getFeeConfigs(): ServiceFeeMasterConfig[] {
    const configs = db.getState().studentSectionFeeConfigs;
    if (configs && Array.isArray(configs) && configs.length > 0) {
      return configs;
    }
    return INITIAL_SERVICE_FEE_MASTER_CONFIGS;
  }

  public getFeeConfigByServiceCode(serviceCode: string): ServiceFeeMasterConfig | undefined {
    const configs = this.getFeeConfigs();
    return configs.find(c => c.serviceCode === serviceCode) || 
           configs.find(c => c.serviceCode.toLowerCase() === serviceCode.toLowerCase());
  }

  // ============================================================================
  // 2. CENTRALIZED FEE CALCULATION ENGINE
  // ============================================================================
  public calculateServiceFee(params: {
    serviceCode: string;
    serviceName?: string;
    passoutStatus?: 'NON_PASSOUT' | 'PASSOUT';
    docTypeToVerify?: string;
    copies?: number;
    isUrgent?: boolean;
    deliveryMode?: 'DIGITAL' | 'PHYSICAL' | 'BOTH';
  }): ServiceFeeCalculationResult {
    const config = this.getFeeConfigByServiceCode(params.serviceCode);
    const passoutStatus = params.passoutStatus || 'NON_PASSOUT';
    const copies = Math.max(1, params.copies || 1);
    const isUrgent = Boolean(params.isUrgent);
    const deliveryMode = params.deliveryMode || 'DIGITAL';
    const docType = params.docTypeToVerify || 'Grade Sheet / Mark Sheet';

    // Fallback base configuration if not found
    const baseServiceName = params.serviceName || config?.serviceName || 'University Official Service';

    let baseRate = passoutStatus === 'PASSOUT' 
      ? (config?.baseFeePassout ?? 200) 
      : (config?.baseFeeEnrolled ?? 100);

    let perCopyRate = config?.perCopyFee ?? 100;

    // Check specific document type rate override (for Document Verification & Attestation)
    if (config?.documentTypeRates && config.documentTypeRates[docType]) {
      const docRate = config.documentTypeRates[docType];
      baseRate = docRate.baseFee;
      perCopyRate = docRate.perCopyFee;
    }

    // Marksheet duplication calculation: Every marksheet copy has equal per-sheet rate
    if (params.serviceCode === 'MARKSHEET_COPY') {
      baseRate = 200;
      perCopyRate = 200;
    }

    const additionalCopiesCount = Math.max(0, copies - 1);
    const copiesFeeTotal = additionalCopiesCount * perCopyRate;
    const urgentFee = isUrgent ? (config?.urgentFee ?? 250) : 0;
    
    // Postal dispatch charge only for physical delivery
    const postalCharges = (deliveryMode === 'PHYSICAL' || deliveryMode === 'BOTH') && (config?.postalCharges ?? 0) > 0
      ? (config?.postalCharges ?? 50)
      : 0;

    const processingCharges = config?.processingCharges ?? 0;

    const totalFee = baseRate + copiesFeeTotal + urgentFee + postalCharges + processingCharges;

    // Generate Itemized Breakdown for Receipt and Display
    const breakdownItems: ServiceFeeCalculationBreakdownItem[] = [
      {
        head: `${baseServiceName} (Primary Official Copy — ${passoutStatus === 'PASSOUT' ? 'Pass-out Alumnus' : 'Enrolled Student'})`,
        rate: baseRate,
        qty: '1 Copy',
        amount: baseRate
      }
    ];

    if (additionalCopiesCount > 0) {
      breakdownItems.push({
        head: `Additional Certified Copies (₹${perCopyRate}/copy)`,
        rate: perCopyRate,
        qty: `${additionalCopiesCount} Extra Cop${additionalCopiesCount > 1 ? 'ies' : 'y'}`,
        amount: copiesFeeTotal
      });
    }

    if (urgentFee > 0) {
      breakdownItems.push({
        head: '⚡ Fast-Track Urgent Expedited Processing Surcharge',
        rate: urgentFee,
        qty: 'Expedited SLA',
        amount: urgentFee
      });
    }

    if (postalCharges > 0) {
      breakdownItems.push({
        head: 'Official Physical Dispatch & Postal Handling Charge',
        rate: postalCharges,
        qty: 'Postal Service',
        amount: postalCharges
      });
    }

    if (processingCharges > 0) {
      breakdownItems.push({
        head: 'University Portal Processing Fee',
        rate: processingCharges,
        qty: 'Service Charge',
        amount: processingCharges
      });
    }

    return {
      serviceCode: params.serviceCode,
      serviceName: baseServiceName,
      passoutStatus,
      documentType: docType,
      copies,
      baseFee: baseRate,
      perCopyFee: perCopyRate,
      additionalCopiesCount,
      copiesFeeTotal,
      urgentFee,
      postalCharges,
      processingCharges,
      totalFee,
      breakdownItems
    };
  }
}

export const studentSectionFeeMasterService = StudentSectionFeeMasterEngine.getInstance();
