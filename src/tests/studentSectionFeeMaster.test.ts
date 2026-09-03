import { describe, it, expect } from 'vitest';
import { studentSectionFeeMasterService } from '../services/studentSectionFeeMasterService';

describe('Student Section Fee Master Engine', () => {
  it('should load initial fee configs for all 18 official services', () => {
    const configs = studentSectionFeeMasterService.getFeeConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(18);
  });

  it('calculates transcript fee for currently enrolled student (1 copy, regular)', () => {
    const res = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'TRANSCRIPT',
      passoutStatus: 'NON_PASSOUT',
      copies: 1,
      isUrgent: false
    });

    expect(res.baseFee).toBe(300);
    expect(res.copiesFeeTotal).toBe(0);
    expect(res.urgentFee).toBe(0);
    expect(res.totalFee).toBe(300);
    expect(res.breakdownItems.length).toBe(1);
    expect(res.breakdownItems[0].head).toContain('Primary Official Copy — Enrolled Student');
  });

  it('calculates transcript fee for passout student with 3 copies and urgent processing', () => {
    const res = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'TRANSCRIPT',
      passoutStatus: 'PASSOUT',
      copies: 3,
      isUrgent: true,
      deliveryMode: 'DIGITAL'
    });

    // Base passout: ₹500 (covers 1st copy)
    // 2 extra copies: 2 * ₹200 = ₹400
    // Urgent: ₹500
    // Total: ₹1400
    expect(res.baseFee).toBe(500);
    expect(res.additionalCopiesCount).toBe(2);
    expect(res.copiesFeeTotal).toBe(400);
    expect(res.urgentFee).toBe(500);
    expect(res.totalFee).toBe(1400);
    expect(res.breakdownItems.some(item => item.head.includes('Additional Certified Copies'))).toBe(true);
    expect(res.breakdownItems.some(item => item.head.includes('Fast-Track Urgent'))).toBe(true);
  });

  it('calculates Document Verification fee based on selected document type', () => {
    // 1. Grade Sheet: ₹100
    const gradeRes = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'DOC_VERIFICATION',
      docTypeToVerify: 'Grade Sheet / Mark Sheet',
      copies: 1,
      isUrgent: false
    });
    expect(gradeRes.baseFee).toBe(100);
    expect(gradeRes.totalFee).toBe(100);

    // 2. Detailed Teaching Scheme / Syllabus: ₹500
    const syllabusRes = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'DOC_VERIFICATION',
      docTypeToVerify: 'Detailed Teaching Scheme / Syllabus',
      copies: 2,
      isUrgent: false
    });
    // Base: ₹500, Extra 1 copy: ₹200 => Total: ₹700
    expect(syllabusRes.baseFee).toBe(500);
    expect(syllabusRes.copiesFeeTotal).toBe(200);
    expect(syllabusRes.totalFee).toBe(700);
  });

  it('calculates Duplicate Marksheet fee per sheet correctly', () => {
    const res = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'MARKSHEET_COPY',
      copies: 4,
      isUrgent: false
    });
    // Base: ₹200, 3 extra copies: 3 * ₹200 = ₹600 => Total: ₹800
    expect(res.baseFee).toBe(200);
    expect(res.perCopyFee).toBe(200);
    expect(res.copiesFeeTotal).toBe(600);
    expect(res.totalFee).toBe(800);
  });

  it('calculates postal dispatch surcharge when physical delivery is selected', () => {
    const res = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'MIGRATION',
      passoutStatus: 'NON_PASSOUT',
      copies: 1,
      isUrgent: false,
      deliveryMode: 'PHYSICAL'
    });

    expect(res.baseFee).toBe(300);
    expect(res.postalCharges).toBe(50);
    expect(res.totalFee).toBe(350);
    expect(res.breakdownItems.some(item => item.head.includes('Physical Dispatch'))).toBe(true);
  });

  it('calculates SGPA/CGPA percentage conversion certificate fee', () => {
    const res = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: 'CGPA_CONVERSION_SCHEME',
      copies: 2,
      isUrgent: false
    });
    // Base: ₹100, 1 extra copy: ₹50 => Total: ₹150
    expect(res.baseFee).toBe(100);
    expect(res.copiesFeeTotal).toBe(50);
    expect(res.totalFee).toBe(150);
  });
});
