import { db } from './db';
import { inputSanitizer } from './inputSanitizer';
import { 
  StudentGatePass, 
  GatePassStatus, 
  GatePassType,
  GatePassAuditEntry 
} from '../types';

export class StudentGatePassService {
  private static instance: StudentGatePassService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): StudentGatePassService {
    if (!StudentGatePassService.instance) {
      StudentGatePassService.instance = new StudentGatePassService();
    }
    return StudentGatePassService.instance;
  }

  private generateRequestNo(seq: number): string {
    return `GP/2026/${String(seq).padStart(6, '0')}`;
  }

  private generateSecureQrToken(reqNo: string): string {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `GP_TOKEN_${reqNo.replace(/[^A-Z0-9]/gi, '_')}_${randomHex}`;
  }

  private ensureInitialized() {
    const state = db.getState();
    if (!state.studentGatePasses || state.studentGatePasses.length === 0) {
      const students = db.getStudents();
      const hostels = db.getHostels();
      const currentStu = students[0] || {
        id: 'stu-1',
        name: 'Aditya Sharma',
        enrollmentNo: '26SSIU001',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };

      const seedPasses: StudentGatePass[] = [
        {
          id: 'gp-1',
          requestNo: 'GP/2026/000001',
          gatePassNo: 'GP/2026/000001',
          studentId: currentStu.id,
          studentName: currentStu.name,
          enrollmentNo: currentStu.enrollmentNo,
          studentPhoto: currentStu.photo,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Science & Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostels[0]?.id || 'hst-1',
          hostelName: hostels[0]?.name || 'Vivekananda Boys Hostel (Block A)',
          block: 'Block A',
          roomNo: 'A-204',
          bedNo: 'Bed-1 (Window Side)',
          parentGuardianName: 'Mr. Rameshchandra Sharma',
          parentGuardianMobile: '+91 98250 11223',
          passType: 'Personal',
          purpose: 'Family Visit',
          reason: 'Visiting family for birthday dinner.',
          destination: 'Gandhinagar Sector 21 (Home)',
          destinationAddress: 'Plot 450, Sector 21, Gandhinagar, Gujarat',
          leavingDate: '2026-08-24',
          leavingTime: '17:30',
          expectedReturnDate: '2026-08-24',
          expectedReturnTime: '21:00',
          outingDate: '2026-08-24',
          expectedOutTime: '17:30',
          travelMode: 'Public Transport',
          modeOfTravel: 'Public Transport',
          travelingWith: 'Alone',
          emergencyContact: '+91 98250 11223',
          studentRemarks: 'Will return before hostel curfew.',
          declarationAccepted: true,
          isEmergency: false,
          priority: 'NORMAL',
          status: 'APPROVED',
          qrToken: 'GP_TOKEN_000001_A8B7C9',
          qrCodeData: 'SSIU-GP:GP/2026/000001:GP_TOKEN_000001_A8B7C9',
          approvedBy: 'user-hosteladmin',
          approvedByName: 'Dr. Rajesh Patel (Chief Warden)',
          approvedAt: '2026-08-24T10:15:00Z',
          wardenRemarks: 'Approved. Ensure return before 09:30 PM curfew.',
          createdAt: '2026-08-24T08:30:00Z',
          updatedAt: '2026-08-24T10:15:00Z',
          history: [
            {
              id: 'aud-1',
              action: 'CREATED',
              userId: currentStu.id,
              userName: currentStu.name,
              userRole: 'STUDENT',
              timestamp: '2026-08-24T08:25:00Z',
              remarks: 'Draft created'
            },
            {
              id: 'aud-2',
              action: 'SUBMITTED',
              userId: currentStu.id,
              userName: currentStu.name,
              userRole: 'STUDENT',
              timestamp: '2026-08-24T08:30:00Z',
              remarks: 'Gate pass requested by student'
            },
            {
              id: 'aud-3',
              action: 'APPROVED',
              userId: 'user-hosteladmin',
              userName: 'Dr. Rajesh Patel',
              userRole: 'HOSTEL_ADMIN',
              timestamp: '2026-08-24T10:15:00Z',
              remarks: 'Approved by Chief Warden'
            },
            {
              id: 'aud-4',
              action: 'QR_GENERATED',
              userId: 'SYSTEM',
              userName: 'SSIU Gate Pass System',
              userRole: 'SYSTEM',
              timestamp: '2026-08-24T10:15:01Z',
              remarks: 'Secure verification QR token generated'
            }
          ]
        },
        {
          id: 'gp-2',
          requestNo: 'GP/2026/000002',
          gatePassNo: 'GP/2026/000002',
          studentId: currentStu.id,
          studentName: currentStu.name,
          enrollmentNo: currentStu.enrollmentNo,
          studentPhoto: currentStu.photo,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Science & Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostels[0]?.id || 'hst-1',
          hostelName: hostels[0]?.name || 'Vivekananda Boys Hostel (Block A)',
          block: 'Block A',
          roomNo: 'A-204',
          bedNo: 'Bed-1 (Window Side)',
          parentGuardianName: 'Mr. Rameshchandra Sharma',
          parentGuardianMobile: '+91 98250 11223',
          passType: 'Medical',
          purpose: 'Medical',
          reason: 'Dental appointment follow-up checkup.',
          destination: 'Apollo Clinic, Gandhinagar Highway',
          destinationAddress: 'Opp. Infocity, Gandhinagar Highway',
          leavingDate: '2026-08-25',
          leavingTime: '15:00',
          expectedReturnDate: '2026-08-25',
          expectedReturnTime: '18:00',
          outingDate: '2026-08-25',
          expectedOutTime: '15:00',
          travelMode: 'Two Wheeler',
          modeOfTravel: 'Two Wheeler',
          travelingWith: 'Friend',
          emergencyContact: '+91 98250 11223',
          studentRemarks: 'Have clinic prescription appointment slip.',
          declarationAccepted: true,
          isEmergency: false,
          priority: 'NORMAL',
          status: 'PENDING',
          createdAt: '2026-08-24T11:00:00Z',
          updatedAt: '2026-08-24T11:00:00Z',
          history: [
            {
              id: 'aud-5',
              action: 'SUBMITTED',
              userId: currentStu.id,
              userName: currentStu.name,
              userRole: 'STUDENT',
              timestamp: '2026-08-24T11:00:00Z',
              remarks: 'Gate pass requested for medical checkup'
            }
          ]
        },
        {
          id: 'gp-3',
          requestNo: 'GP/2026/000003',
          gatePassNo: 'GP/2026/000003',
          studentId: currentStu.id,
          studentName: currentStu.name,
          enrollmentNo: currentStu.enrollmentNo,
          studentPhoto: currentStu.photo,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Science & Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostels[0]?.id || 'hst-1',
          hostelName: hostels[0]?.name || 'Vivekananda Boys Hostel (Block A)',
          block: 'Block A',
          roomNo: 'A-204',
          bedNo: 'Bed-1 (Window Side)',
          parentGuardianName: 'Mr. Rameshchandra Sharma',
          parentGuardianMobile: '+91 98250 11223',
          passType: 'Other',
          purpose: 'Academic',
          reason: 'Reference book collection for final semester project.',
          destination: 'Gujarat Technological Library, Ahmedabad',
          destinationAddress: 'Near Visat Junction, Chandkheda, Ahmedabad',
          leavingDate: '2026-08-20',
          leavingTime: '09:00',
          expectedReturnDate: '2026-08-20',
          expectedReturnTime: '17:00',
          outingDate: '2026-08-20',
          expectedOutTime: '09:00',
          travelMode: 'Public Transport',
          modeOfTravel: 'Campus Bus',
          travelingWith: 'Alone',
          emergencyContact: '+91 98250 11223',
          studentRemarks: 'Library card verified by HOD.',
          declarationAccepted: true,
          isEmergency: false,
          priority: 'NORMAL',
          status: 'COMPLETED',
          qrToken: 'GP_TOKEN_000003_K9L2M4',
          qrCodeData: 'SSIU-GP:GP/2026/000003:GP_TOKEN_000003_K9L2M4',
          approvedBy: 'user-hosteladmin',
          approvedByName: 'Dr. Rajesh Patel',
          approvedAt: '2026-08-19T16:00:00Z',
          wardenRemarks: 'Approved for academic library visit.',
          actualOutDateTime: '2026-08-20T09:05:00Z',
          actualCheckOutTime: '2026-08-20T09:05:00Z',
          actualOutRecordedBy: 'sec-1',
          actualOutRecordedByName: 'Officer Vikram Singh (Main Gate)',
          actualCheckOutStaff: 'Officer Vikram Singh (Main Gate)',
          actualInDateTime: '2026-08-20T16:45:00Z',
          actualCheckInTime: '2026-08-20T16:45:00Z',
          actualInRecordedBy: 'sec-1',
          actualInRecordedByName: 'Officer Vikram Singh (Main Gate)',
          actualCheckInStaff: 'Officer Vikram Singh (Main Gate)',
          isLateReturn: false,
          createdAt: '2026-08-19T14:30:00Z',
          updatedAt: '2026-08-20T16:45:00Z',
          history: [
            {
              id: 'aud-6',
              action: 'SUBMITTED',
              userId: currentStu.id,
              userName: currentStu.name,
              userRole: 'STUDENT',
              timestamp: '2026-08-19T14:30:00Z',
              remarks: 'Submitted request'
            },
            {
              id: 'aud-7',
              action: 'APPROVED',
              userId: 'user-hosteladmin',
              userName: 'Dr. Rajesh Patel',
              userRole: 'HOSTEL_ADMIN',
              timestamp: '2026-08-19T16:00:00Z',
              remarks: 'Approved by Warden'
            },
            {
              id: 'aud-8',
              action: 'CHECKED_OUT',
              userId: 'sec-1',
              userName: 'Officer Vikram Singh',
              userRole: 'SECURITY',
              timestamp: '2026-08-20T09:05:00Z',
              remarks: 'Exit verified at Main Gate'
            },
            {
              id: 'aud-9',
              action: 'CHECKED_IN',
              userId: 'sec-1',
              userName: 'Officer Vikram Singh',
              userRole: 'SECURITY',
              timestamp: '2026-08-20T16:45:00Z',
              remarks: 'Campus return verified on-time'
            },
            {
              id: 'aud-10',
              action: 'COMPLETED',
              userId: 'SYSTEM',
              userName: 'SSIU Gate Pass System',
              userRole: 'SYSTEM',
              timestamp: '2026-08-20T16:45:01Z',
              remarks: 'Gate Pass cycle completed successfully'
            }
          ]
        },
        {
          id: 'gp-4',
          requestNo: 'GP/2026/000004',
          gatePassNo: 'GP/2026/000004',
          studentId: currentStu.id,
          studentName: currentStu.name,
          enrollmentNo: currentStu.enrollmentNo,
          studentPhoto: currentStu.photo,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Science & Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostels[0]?.id || 'hst-1',
          hostelName: hostels[0]?.name || 'Vivekananda Boys Hostel (Block A)',
          block: 'Block A',
          roomNo: 'A-204',
          bedNo: 'Bed-1 (Window Side)',
          parentGuardianName: 'Mr. Rameshchandra Sharma',
          parentGuardianMobile: '+91 98250 11223',
          passType: 'Emergency',
          purpose: 'Emergency',
          reason: 'Urgent family medical situation at home.',
          destination: 'Sector 7, Gandhinagar',
          destinationAddress: 'House 112, Sector 7, Gandhinagar',
          leavingDate: '2026-08-15',
          leavingTime: '20:00',
          expectedReturnDate: '2026-08-16',
          expectedReturnTime: '08:00',
          outingDate: '2026-08-15',
          expectedOutTime: '20:00',
          travelMode: 'Four Wheeler',
          modeOfTravel: 'Cab',
          travelingWith: 'Parent / Guardian',
          emergencyContact: '+91 98250 11223',
          studentRemarks: 'Father accompanied student.',
          declarationAccepted: true,
          isEmergency: true,
          priority: 'EMERGENCY',
          status: 'COMPLETED',
          qrToken: 'GP_TOKEN_000004_E9X3R7',
          qrCodeData: 'SSIU-GP:GP/2026/000004:GP_TOKEN_000004_E9X3R7',
          approvedBy: 'user-hosteladmin',
          approvedByName: 'Dr. Rajesh Patel',
          approvedAt: '2026-08-15T19:30:00Z',
          wardenRemarks: 'Emergency clearance granted. Father confirmed over phone call.',
          actualOutDateTime: '2026-08-15T20:05:00Z',
          actualCheckOutTime: '2026-08-15T20:05:00Z',
          actualOutRecordedBy: 'sec-1',
          actualOutRecordedByName: 'Officer Vikram Singh',
          actualCheckOutStaff: 'Officer Vikram Singh',
          actualInDateTime: '2026-08-16T07:45:00Z',
          actualCheckInTime: '2026-08-16T07:45:00Z',
          actualInRecordedBy: 'sec-1',
          actualInRecordedByName: 'Officer Vikram Singh',
          actualCheckInStaff: 'Officer Vikram Singh',
          isLateReturn: false,
          createdAt: '2026-08-15T19:15:00Z',
          updatedAt: '2026-08-16T07:45:00Z',
          history: [
            {
              id: 'aud-11',
              action: 'SUBMITTED',
              userId: currentStu.id,
              userName: currentStu.name,
              userRole: 'STUDENT',
              timestamp: '2026-08-15T19:15:00Z',
              remarks: 'EMERGENCY request submitted'
            },
            {
              id: 'aud-12',
              action: 'APPROVED',
              userId: 'user-hosteladmin',
              userName: 'Dr. Rajesh Patel',
              userRole: 'HOSTEL_ADMIN',
              timestamp: '2026-08-15T19:30:00Z',
              remarks: 'Emergency clearance approved'
            },
            {
              id: 'aud-13',
              action: 'CHECKED_OUT',
              userId: 'sec-1',
              userName: 'Officer Vikram Singh',
              userRole: 'SECURITY',
              timestamp: '2026-08-15T20:05:00Z',
              remarks: 'Exit verified'
            },
            {
              id: 'aud-14',
              action: 'CHECKED_IN',
              userId: 'sec-1',
              userName: 'Officer Vikram Singh',
              userRole: 'SECURITY',
              timestamp: '2026-08-16T07:45:00Z',
              remarks: 'Returned safely'
            }
          ]
        }
      ];

      (state as any).studentGatePasses = seedPasses;
      db.saveState();
    }
  }

  /**
   * Evaluates all active outside passes and marks those exceeding expected return time as OVERDUE
   */
  public evaluateOverduePasses(): void {
    const state = db.getState();
    const list: StudentGatePass[] = (state as any).studentGatePasses || [];
    const now = new Date();
    let stateChanged = false;

    for (const pass of list) {
      if (pass.status === 'CHECKED_OUT' || pass.status === 'OUT') {
        const retDateStr = pass.expectedReturnDate || pass.leavingDate || pass.outingDate;
        const retTimeStr = pass.expectedReturnTime || '21:00';
        const [hours, mins] = retTimeStr.split(':').map(Number);
        
        const expDate = new Date(retDateStr);
        expDate.setHours(hours || 21, mins || 0, 0, 0);

        if (now.getTime() > expDate.getTime()) {
          pass.status = 'OVERDUE';
          pass.updatedAt = now.toISOString();
          pass.history.push({
            id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            action: 'MARKED_OVERDUE',
            userId: 'SYSTEM',
            userName: 'SSIU Gate Pass System',
            userRole: 'SYSTEM',
            timestamp: now.toISOString(),
            remarks: `Gate Pass is OVERDUE. Expected return was ${retDateStr} at ${retTimeStr}.`
          });
          stateChanged = true;

          // Alert Warden & Student
          db.addNotification({
            title: '⚠️ Student Gate Pass Overdue Alert',
            message: `Student ${pass.studentName} (${pass.enrollmentNo}) has not returned from ${pass.destination}. Expected return was ${retTimeStr}.`,
            module: 'HOSTEL' as any,
            priority: 'HIGH' as any,
            linkTab: 'hostel'
          });
        }
      }
    }

    if (stateChanged) {
      db.saveState();
    }
  }

  /**
   * Retrieves all gate passes matching optional filters
   */
  public getGatePasses(filters?: {
    studentId?: string;
    enrollmentNo?: string;
    hostelId?: string;
    status?: string;
    passType?: string;
    priority?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): StudentGatePass[] {
    this.ensureInitialized();
    this.evaluateOverduePasses();

    const state = db.getState();
    let list: StudentGatePass[] = (state as any).studentGatePasses || [];

    if (filters?.studentId) {
      list = list.filter(g => g.studentId === filters.studentId);
    }
    if (filters?.enrollmentNo) {
      list = list.filter(g => g.enrollmentNo.toLowerCase() === filters.enrollmentNo!.toLowerCase());
    }
    if (filters?.hostelId && filters.hostelId !== 'ALL') {
      list = list.filter(g => g.hostelId === filters.hostelId);
    }
    if (filters?.passType && filters.passType !== 'ALL') {
      list = list.filter(g => g.passType === filters.passType);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      list = list.filter(g => g.priority === filters.priority);
    }
    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status === 'ACTIVE') {
        list = list.filter(g => g.status === 'APPROVED' || g.status === 'ACTIVE');
      } else if (filters.status === 'PENDING') {
        list = list.filter(g => g.status === 'PENDING' || g.status === 'SUBMITTED' || g.status === 'UNDER_REVIEW');
      } else if (filters.status === 'OUTSIDE') {
        list = list.filter(g => g.status === 'CHECKED_OUT' || g.status === 'OUT' || g.status === 'OVERDUE');
      } else {
        list = list.filter(g => g.status === filters.status);
      }
    }
    if (filters?.fromDate) {
      list = list.filter(g => (g.leavingDate || g.outingDate) >= filters.fromDate!);
    }
    if (filters?.toDate) {
      list = list.filter(g => (g.leavingDate || g.outingDate) <= filters.toDate!);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(g =>
        g.requestNo?.toLowerCase().includes(q) ||
        g.gatePassNo?.toLowerCase().includes(q) ||
        g.studentName?.toLowerCase().includes(q) ||
        g.enrollmentNo?.toLowerCase().includes(q) ||
        g.destination?.toLowerCase().includes(q) ||
        g.roomNo?.toLowerCase().includes(q) ||
        g.reason?.toLowerCase().includes(q) ||
        g.passType?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getGatePassById(idOrNo: string): StudentGatePass | undefined {
    this.ensureInitialized();
    this.evaluateOverduePasses();
    const list = this.getGatePasses();
    return list.find(g => 
      g.id === idOrNo || 
      g.requestNo === idOrNo || 
      g.gatePassNo === idOrNo ||
      g.qrToken === idOrNo
    );
  }

  /**
   * Check if student has an existing active, approved, pending, or outside gate pass
   */
  public hasActiveOrOverlappingPass(enrollmentNo: string): { hasActive: boolean; activePass?: StudentGatePass } {
    this.ensureInitialized();
    this.evaluateOverduePasses();
    const passes = this.getGatePasses({ enrollmentNo });
    const activePass = passes.find(p => 
      p.status === 'SUBMITTED' || 
      p.status === 'UNDER_REVIEW' || 
      p.status === 'PENDING' || 
      p.status === 'APPROVED' || 
      p.status === 'ACTIVE' || 
      p.status === 'CHECKED_OUT' || 
      p.status === 'OUT' || 
      p.status === 'OVERDUE'
    );
    return {
      hasActive: Boolean(activePass),
      activePass
    };
  }

  /**
   * Creates a new Student Gate Pass Request
   */
  public createGatePass(data: Partial<StudentGatePass>, user: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];

    const enrollmentNo = data.enrollmentNo || user?.enrollmentNo || user?.username || '26SSIU001';

    // Validation: Check for duplicate / overlapping active gate pass
    const { hasActive, activePass } = this.hasActiveOrOverlappingPass(enrollmentNo);
    if (hasActive && activePass) {
      throw new Error(`You already have an active or overlapping Gate Pass (${activePass.requestNo} - Status: ${activePass.status}).`);
    }

    // Validation: Date & Time logic
    const leavingDate = data.leavingDate || data.outingDate || new Date().toISOString().split('T')[0];
    const leavingTime = data.leavingTime || data.expectedOutTime || '17:00';
    const returnDate = data.expectedReturnDate || leavingDate;
    const returnTime = data.expectedReturnTime || '21:00';

    const startDateTime = new Date(`${leavingDate}T${leavingTime}:00`);
    const endDateTime = new Date(`${returnDate}T${returnTime}:00`);

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      throw new Error('Expected Return Date & Time must be after the Leaving Date & Time.');
    }

    // Next sequential request number: GP/2026/00000X
    const nextSeq = existingList.length + 1;
    const requestNo = this.generateRequestNo(nextSeq);
    const isEmergency = data.passType === 'Emergency' || data.isEmergency === true;
    const priority = isEmergency ? 'EMERGENCY' : (data.priority || 'NORMAL');

    const newPass: StudentGatePass = {
      id: `gp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestNo,
      gatePassNo: requestNo,
      studentId: data.studentId || user?.id || 'stu-1',
      studentName: data.studentName || user?.name || 'Student',
      enrollmentNo,
      studentPhoto: data.studentPhoto || (user as any)?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      instituteId: data.instituteId,
      instituteName: data.instituteName || 'SSIT - Institute of Technology',
      departmentId: data.departmentId,
      departmentName: data.departmentName || 'Computer Science & Engineering',
      programId: data.programId,
      programName: data.programName || 'B.Tech CSE',
      semester: data.semester || 4,
      hostelId: data.hostelId || 'hst-1',
      hostelName: data.hostelName || 'Vivekananda Boys Hostel (Block A)',
      block: data.block || 'Block A',
      roomNo: data.roomNo || 'A-204',
      bedNo: data.bedNo || 'Bed-1',
      parentGuardianName: data.parentGuardianName || 'Mr. Rameshchandra Sharma',
      parentGuardianMobile: data.parentGuardianMobile || data.emergencyContact || '+91 98250 11223',
      passType: data.passType || 'Personal',
      purpose: data.purpose || data.passType || 'Personal',
      reason: inputSanitizer.sanitizePlainText(data.reason || data.studentRemarks || 'Personal visit', 500),
      destination: inputSanitizer.sanitizePlainText(data.destination || '', 200),
      destinationAddress: inputSanitizer.sanitizePlainText(data.destinationAddress || data.destination || '', 300),
      leavingDate,
      leavingTime,
      expectedReturnDate: returnDate,
      expectedReturnTime: returnTime,
      outingDate: leavingDate,
      expectedOutTime: leavingTime,
      travelMode: data.travelMode || data.modeOfTravel || 'Public Transport',
      modeOfTravel: data.modeOfTravel || data.travelMode || 'Public Transport',
      travelingWith: data.travelingWith || 'Alone',
      emergencyContact: data.emergencyContact || data.parentGuardianMobile || '+91 98250 11223',
      studentRemarks: inputSanitizer.sanitizePlainText(data.studentRemarks || '', 500),
      attachment: data.attachment || data.supportingDocument,
      supportingDocument: data.supportingDocument || data.attachment,
      declarationAccepted: data.declarationAccepted ?? true,
      isEmergency,
      priority,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `aud-${Date.now()}-1`,
          action: 'CREATED',
          userId: user?.id || 'student',
          userName: user?.name || 'Student',
          userRole: 'STUDENT',
          timestamp: new Date().toISOString(),
          remarks: 'Gate Pass request created'
        },
        {
          id: `aud-${Date.now()}-2`,
          action: 'SUBMITTED',
          userId: user?.id || 'student',
          userName: user?.name || 'Student',
          userRole: 'STUDENT',
          timestamp: new Date().toISOString(),
          remarks: isEmergency ? 'EMERGENCY Gate Pass request submitted for immediate review' : 'Gate Pass request submitted for Warden review'
        }
      ]
    };

    (state as any).studentGatePasses = [newPass, ...existingList];
    db.saveState();

    // Trigger Notifications
    db.addNotification({
      title: isEmergency ? '🚨 Emergency Gate Pass Request' : 'New Gate Pass Request',
      message: `${newPass.studentName} (${newPass.enrollmentNo}) has submitted request ${newPass.requestNo} for ${newPass.passType} to ${newPass.destination}.`,
      module: 'HOSTEL' as any,
      priority: isEmergency ? 'HIGH' : 'MEDIUM' as any,
      linkTab: 'hostel'
    });

    return newPass;
  }

  /**
   * Warden approves Gate Pass and generates secure QR token
   */
  public approveGatePass(id: string, wardenRemarks: string, user: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];
    const pass = existingList.find(g => g.id === id || g.requestNo === id || g.gatePassNo === id);

    if (!pass) throw new Error('Gate pass not found.');

    const qrToken = this.generateSecureQrToken(pass.requestNo);
    pass.status = 'APPROVED';
    pass.approvedBy = user?.id || 'warden-1';
    pass.approvedByName = user?.name || 'Chief Hostel Warden';
    pass.approvedAt = new Date().toISOString();
    pass.wardenRemarks = wardenRemarks?.trim() || 'Approved by Hostel Warden';
    pass.qrToken = qrToken;
    pass.qrCodeData = `SSIU-GP:${pass.requestNo}:${qrToken}`;
    pass.updatedAt = new Date().toISOString();

    pass.history.push({
      id: `aud-${Date.now()}-appr`,
      action: 'APPROVED',
      userId: user?.id || 'warden',
      userName: user?.name || 'Warden',
      userRole: user?.role || 'HOSTEL_ADMIN',
      timestamp: new Date().toISOString(),
      remarks: pass.wardenRemarks
    });

    pass.history.push({
      id: `aud-${Date.now()}-qr`,
      action: 'QR_GENERATED',
      userId: 'SYSTEM',
      userName: 'SSIU Gate Pass System',
      userRole: 'SYSTEM',
      timestamp: new Date().toISOString(),
      remarks: 'Digital Gate Pass QR token activated'
    });

    db.saveState();

    // Student Notification
    db.addNotification({
      title: 'Gate Pass Approved',
      message: `Your Gate Pass ${pass.requestNo} has been approved by ${pass.approvedByName}. Digital Gate Pass is now active.`,
      module: 'HOSTEL' as any,
      priority: 'HIGH' as any,
      linkTab: 'hostel'
    });

    return pass;
  }

  /**
   * Warden rejects Gate Pass with mandatory reason
   */
  public rejectGatePass(id: string, rejectionReason: string, user: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];
    const pass = existingList.find(g => g.id === id || g.requestNo === id || g.gatePassNo === id);

    if (!pass) throw new Error('Gate pass not found.');
    if (!rejectionReason?.trim()) throw new Error('Rejection reason is mandatory.');

    pass.status = 'REJECTED';
    pass.rejectedBy = user?.id || 'warden-1';
    pass.rejectedByName = user?.name || 'Chief Hostel Warden';
    pass.rejectedAt = new Date().toISOString();
    pass.rejectedReason = rejectionReason.trim();
    pass.updatedAt = new Date().toISOString();

    pass.history.push({
      id: `aud-${Date.now()}-rej`,
      action: 'REJECTED',
      userId: user?.id || 'warden',
      userName: user?.name || 'Warden',
      userRole: user?.role || 'HOSTEL_ADMIN',
      timestamp: new Date().toISOString(),
      remarks: `Rejected: ${rejectionReason.trim()}`
    });

    db.saveState();

    // Student Notification
    db.addNotification({
      title: 'Gate Pass Rejected',
      message: `Your Gate Pass request ${pass.requestNo} was rejected: ${rejectionReason.trim()}.`,
      module: 'HOSTEL' as any,
      priority: 'HIGH' as any,
      linkTab: 'hostel'
    });

    return pass;
  }

  /**
   * Student can cancel their own request ONLY when in DRAFT, SUBMITTED, or PENDING state
   */
  public cancelGatePass(id: string, reason: string, user: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];
    const pass = existingList.find(g => g.id === id || g.requestNo === id || g.gatePassNo === id);

    if (!pass) throw new Error('Gate pass not found.');
    if (pass.status !== 'DRAFT' && pass.status !== 'SUBMITTED' && pass.status !== 'PENDING') {
      throw new Error(`Cannot cancel a Gate Pass with status ${pass.status}. Only unapproved requests can be cancelled.`);
    }

    pass.status = 'CANCELLED';
    pass.cancellationReason = reason?.trim() || 'Cancelled by Student';
    pass.cancelledAt = new Date().toISOString();
    pass.updatedAt = new Date().toISOString();

    pass.history.push({
      id: `aud-${Date.now()}-can`,
      action: 'CANCELLED',
      userId: user?.id || 'student',
      userName: user?.name || 'Student',
      userRole: 'STUDENT',
      timestamp: new Date().toISOString(),
      remarks: pass.cancellationReason
    });

    db.saveState();

    db.addNotification({
      title: 'Gate Pass Cancelled',
      message: `Gate Pass ${pass.requestNo} has been cancelled.`,
      module: 'HOSTEL' as any,
      priority: 'LOW' as any,
      linkTab: 'hostel'
    });

    return pass;
  }

  /**
   * Security Officer records student exit (CHECK OUT)
   */
  public recordGatePassOut(id: string, securityUser: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];
    const pass = existingList.find(g => g.id === id || g.requestNo === id || g.gatePassNo === id || g.qrToken === id);

    if (!pass) throw new Error('Gate pass not found.');
    if (pass.status !== 'APPROVED' && pass.status !== 'ACTIVE') {
      throw new Error(`Cannot Check Out pass with status ${pass.status}. Pass must be APPROVED.`);
    }

    const now = new Date();
    pass.status = 'CHECKED_OUT';
    pass.actualCheckOutTime = now.toISOString();
    pass.actualOutDateTime = now.toISOString();
    pass.actualCheckOutStaff = securityUser?.name || 'Main Campus Gate Security';
    pass.actualOutRecordedBy = securityUser?.id || 'security-1';
    pass.actualOutRecordedByName = securityUser?.name || 'Main Campus Gate Security';
    pass.updatedAt = now.toISOString();

    pass.history.push({
      id: `aud-${Date.now()}-out`,
      action: 'CHECKED_OUT',
      userId: securityUser?.id || 'security',
      userName: securityUser?.name || 'Security Officer',
      userRole: 'SECURITY',
      timestamp: now.toISOString(),
      remarks: `Campus exit verified at Main Gate by ${pass.actualCheckOutStaff}`
    });

    db.saveState();

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.addNotification({
      title: 'Gate Check-Out Recorded',
      message: `Student ${pass.studentName} (${pass.enrollmentNo}) checked out of campus at ${timeStr}. Expected return: ${pass.expectedReturnTime}.`,
      module: 'HOSTEL' as any,
      priority: 'MEDIUM' as any,
      linkTab: 'hostel'
    });

    return pass;
  }

  /**
   * Security Officer records student return (CHECK IN)
   */
  public recordGatePassIn(id: string, securityUser: any): StudentGatePass {
    this.ensureInitialized();
    const state = db.getState();
    const existingList: StudentGatePass[] = (state as any).studentGatePasses || [];
    const pass = existingList.find(g => g.id === id || g.requestNo === id || g.gatePassNo === id || g.qrToken === id);

    if (!pass) throw new Error('Gate pass not found.');
    if (pass.status !== 'CHECKED_OUT' && pass.status !== 'OUT' && pass.status !== 'OVERDUE') {
      throw new Error(`Cannot Check In pass with status ${pass.status}. Student must be marked CHECKED_OUT first.`);
    }

    const now = new Date();
    pass.status = 'COMPLETED';
    pass.actualCheckInTime = now.toISOString();
    pass.actualInDateTime = now.toISOString();
    pass.actualCheckInStaff = securityUser?.name || 'Main Campus Gate Security';
    pass.actualInRecordedBy = securityUser?.id || 'security-1';
    pass.actualInRecordedByName = securityUser?.name || 'Main Campus Gate Security';

    // Calculate late return
    const retDateStr = pass.expectedReturnDate || pass.leavingDate || pass.outingDate;
    const [expHours, expMins] = (pass.expectedReturnTime || '21:00').split(':').map(Number);
    const expDate = new Date(retDateStr);
    expDate.setHours(expHours || 21, expMins || 0, 0, 0);

    const isLate = now.getTime() > expDate.getTime();
    pass.isLateReturn = isLate;
    pass.updatedAt = now.toISOString();

    pass.history.push({
      id: `aud-${Date.now()}-in`,
      action: 'CHECKED_IN',
      userId: securityUser?.id || 'security',
      userName: securityUser?.name || 'Security Officer',
      userRole: 'SECURITY',
      timestamp: now.toISOString(),
      remarks: isLate ? 'Campus return recorded - LATE RETURN' : 'Campus return recorded on-time'
    });

    pass.history.push({
      id: `aud-${Date.now()}-comp`,
      action: 'COMPLETED',
      userId: 'SYSTEM',
      userName: 'SSIU Gate Pass System',
      userRole: 'SYSTEM',
      timestamp: now.toISOString(),
      remarks: 'Gate Pass cycle closed'
    });

    db.saveState();

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.addNotification({
      title: isLate ? '⚠️ Gate Return Recorded (LATE)' : 'Gate Return Recorded',
      message: `Student ${pass.studentName} (${pass.enrollmentNo}) returned to campus at ${timeStr}${isLate ? ' (Late Return Flagged)' : ''}.`,
      module: 'HOSTEL' as any,
      priority: isLate ? 'HIGH' : 'MEDIUM' as any,
      linkTab: 'hostel'
    });

    return pass;
  }

  /**
   * Security QR Verification method
   */
  public verifyGatePassQR(qrDataOrTokenOrNo: string): { 
    valid: boolean; 
    pass?: StudentGatePass; 
    code: 'VALID' | 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'REJECTED' | 'PENDING' | 'CANCELLED' | 'OUTSIDE_VALID_TIME'; 
    message: string 
  } {
    this.ensureInitialized();
    this.evaluateOverduePasses();

    let query = qrDataOrTokenOrNo.trim();
    if (query.startsWith('SSIU-GP:')) {
      const parts = query.split(':');
      query = parts[2] || parts[1] || query;
    }

    const passes = this.getGatePasses();
    const pass = passes.find(p => 
      p.qrToken?.toLowerCase() === query.toLowerCase() ||
      p.requestNo?.toLowerCase() === query.toLowerCase() ||
      p.gatePassNo?.toLowerCase() === query.toLowerCase() ||
      p.id === query
    );

    if (!pass) {
      return { 
        valid: false, 
        code: 'NOT_FOUND', 
        message: 'Gate Pass Not Found. QR token is not recognized in university registry.' 
      };
    }

    if (pass.status === 'REJECTED') {
      return { 
        valid: false, 
        pass, 
        code: 'REJECTED', 
        message: `Gate Pass is REJECTED by Warden: ${pass.rejectedReason || 'Unauthorized movement'}.` 
      };
    }

    if (pass.status === 'CANCELLED') {
      return { 
        valid: false, 
        pass, 
        code: 'CANCELLED', 
        message: 'Gate Pass Has Been Cancelled by Student.' 
      };
    }

    if (pass.status === 'COMPLETED' || pass.status === 'RETURNED') {
      return { 
        valid: false, 
        pass, 
        code: 'ALREADY_USED', 
        message: `Gate Pass Has Already Been Completed. Return was recorded at ${pass.actualCheckInTime?.split('T')[1]?.substring(0, 5) || 'earlier'}.` 
      };
    }

    if (pass.status === 'SUBMITTED' || pass.status === 'UNDER_REVIEW' || pass.status === 'PENDING') {
      return { 
        valid: false, 
        pass, 
        code: 'PENDING', 
        message: 'Gate Pass Is Pending Warden Review. Campus exit is not authorized.' 
      };
    }

    return { 
      valid: true, 
      pass, 
      code: 'VALID', 
      message: pass.status === 'CHECKED_OUT' || pass.status === 'OVERDUE' 
        ? 'Valid Gate Pass - Student Currently Outside Campus (Ready for Check-In)'
        : 'Valid Approved Gate Pass - Ready for Campus Check-Out' 
    };
  }

  /**
   * Generates Student Dashboard KPI Metrics
   */
  public getStudentMetrics(enrollmentNo: string) {
    const list = this.getGatePasses({ enrollmentNo });
    return {
      totalRequests: list.length,
      pending: list.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW' || p.status === 'PENDING').length,
      approved: list.filter(p => p.status === 'APPROVED' || p.status === 'ACTIVE').length,
      active: list.filter(p => p.status === 'APPROVED' || p.status === 'ACTIVE' || p.status === 'CHECKED_OUT' || p.status === 'OUT').length,
      rejected: list.filter(p => p.status === 'REJECTED').length,
      completed: list.filter(p => p.status === 'COMPLETED' || p.status === 'RETURNED').length,
      overdue: list.filter(p => p.status === 'OVERDUE').length
    };
  }

  /**
   * Generates Warden Dashboard KPI Metrics
   */
  public getWardenMetrics(hostelId?: string) {
    const list = this.getGatePasses(hostelId ? { hostelId } : undefined);
    const today = new Date().toISOString().split('T')[0];

    return {
      pendingRequests: list.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW' || p.status === 'PENDING').length,
      emergencyRequests: list.filter(p => (p.isEmergency || p.passType === 'Emergency') && (p.status === 'SUBMITTED' || p.status === 'PENDING')).length,
      approvedToday: list.filter(p => p.approvedAt?.startsWith(today)).length,
      studentsOutside: list.filter(p => p.status === 'CHECKED_OUT' || p.status === 'OUT' || p.status === 'OVERDUE').length,
      expectedReturnsToday: list.filter(p => (p.status === 'CHECKED_OUT' || p.status === 'OUT') && p.expectedReturnDate === today).length,
      overdueStudents: list.filter(p => p.status === 'OVERDUE').length,
      completedToday: list.filter(p => p.status === 'COMPLETED' && p.actualCheckInTime?.startsWith(today)).length
    };
  }

  /**
   * Returns list of students currently outside campus
   */
  public getCurrentlyOutsideStudents(hostelId?: string): StudentGatePass[] {
    const list = this.getGatePasses(hostelId ? { hostelId } : undefined);
    return list.filter(p => p.status === 'CHECKED_OUT' || p.status === 'OUT' || p.status === 'OVERDUE');
  }

  /**
   * Exports list of gate passes to CSV format
   */
  public exportGatePassesToCsv(passes: StudentGatePass[]): string {
    const headers = [
      'Request No',
      'Enrollment No',
      'Student Name',
      'Program',
      'Hostel',
      'Block',
      'Room',
      'Pass Type',
      'Reason',
      'Destination',
      'Leaving Date',
      'Leaving Time',
      'Expected Return Date',
      'Expected Return Time',
      'Emergency Contact',
      'Status',
      'Approved By',
      'Check-Out Time',
      'Check-In Time',
      'Late Return'
    ];

    const rows = passes.map(p => [
      `"${p.requestNo}"`,
      `"${p.enrollmentNo}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.programName || ''}"`,
      `"${p.hostelName || ''}"`,
      `"${p.block || ''}"`,
      `"${p.roomNo || ''}"`,
      `"${p.passType || ''}"`,
      `"${(p.reason || '').replace(/"/g, '""')}"`,
      `"${(p.destination || '').replace(/"/g, '""')}"`,
      `"${p.leavingDate || p.outingDate || ''}"`,
      `"${p.leavingTime || p.expectedOutTime || ''}"`,
      `"${p.expectedReturnDate || ''}"`,
      `"${p.expectedReturnTime || ''}"`,
      `"${p.emergencyContact || ''}"`,
      `"${p.status}"`,
      `"${p.approvedByName || ''}"`,
      `"${p.actualCheckOutTime || p.actualOutDateTime || ''}"`,
      `"${p.actualCheckInTime || p.actualInDateTime || ''}"`,
      `"${p.isLateReturn ? 'YES' : 'NO'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const studentGatePassService = StudentGatePassService.getInstance();
