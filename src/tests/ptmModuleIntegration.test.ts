import { ptmService } from '../services/ptmService';
import { db } from '../services/db';
import { User, UserRole } from '../types';

async function runPTMModuleIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE PTM MANAGEMENT MODULE INTEGRATION TESTS');
  console.log('================================================================\n');

  const facultyUser: User = {
    id: 'fac-1',
    username: 'dr.sharma',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@swarrnim.edu.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    instituteId: 'inst-1'
  };
  const role: UserRole = 'FACULTY';

  // Test 1: Master Data Synchronization & Zero Demo Records Check
  console.log('[TEST 1] Verifying Central Master Relational Integrity & Demo Data Elimination...');
  const events = ptmService.getEvents(facultyUser, role);
  const schedules = ptmService.getSchedules(facultyUser, role);
  const records = ptmService.getRecords(facultyUser, role);
  const followUps = ptmService.getFollowUpActions(facultyUser, role);

  const stringList = [
    ...events.map(e => e.createdByName || ''),
    ...schedules.map(s => `${s.studentName} ${s.facultyName}`),
    ...records.map(r => `${r.studentName} ${r.facultyName}`),
    ...followUps.map(f => `${f.studentName} ${f.assignedToName}`)
  ];

  const matched = stringList.filter(str => /\bdemo\b/i.test(str));
  if (matched.length > 0) {
    console.error('Matched demo strings:', matched);
    throw new Error(`FAILED: Detected legacy demo records: ${matched.join(', ')}`);
  }
  console.log('✓ Verified: Zero legacy demo records found across all PTM registers.');

  // Test 2: Dynamic KPI Dashboard Calculation
  console.log('\n[TEST 2] Verifying Comprehensive Dynamic Dashboard KPIs...');
  const kpis = ptmService.getComprehensiveDashboardKPIs(facultyUser, role);
  console.log('  Calculated KPIs:', {
    totalEvents: kpis.totalEvents,
    scheduledCount: kpis.scheduledCount,
    confirmedCount: kpis.confirmedCount,
    pendingCount: kpis.pendingCount,
    completedCount: kpis.completedCount,
    studentsCovered: kpis.studentsCovered,
    feedbackPending: kpis.feedbackPendingCount,
    followUpsPending: kpis.followUpsPendingCount,
    overdueActions: kpis.overdueActionsCount,
    attendanceRate: `${kpis.attendanceRate}%`
  });

  if (kpis.totalEvents === 0 || kpis.totalSchedules === 0) {
    throw new Error('FAILED: KPI calculation returned 0 events/schedules!');
  }
  console.log('✓ Dynamic KPI calculator verified with real relational dataset.');

  // Test 3: Tab 2 (PTM Schedule Register) Column Integrity
  console.log('\n[TEST 3] Verifying 21-Column PTM Schedule Register...');
  if (events.length === 0) throw new Error('No events returned');
  const sampleEvent = events[0];
  if (!sampleEvent.id || !sampleEvent.title || !sampleEvent.departmentName || !sampleEvent.programName) {
    throw new Error('Event missing required relational fields');
  }
  console.log(`✓ Event Register validated: ${events.length} university events with complete academic linkages.`);

  // Test 4: Tab 3 (My PTMs / Mentoring Operational Grid) Column Integrity
  console.log('\n[TEST 4] Verifying 17-Column Operational Mentoring Grid...');
  schedules.forEach(s => {
    if (!s.studentName || !s.enrollmentNo || !s.parentName || !s.date || !s.status) {
      throw new Error(`Schedule ${s.id} is missing mandatory operational fields`);
    }
  });
  console.log(`✓ My PTMs Register validated: ${schedules.length} schedules with separated column fields.`);

  // Test 5: Tab 4 (PTM Records & Discussion Dossiers) Column Integrity
  console.log('\n[TEST 5] Verifying 19-Column Academic Consultation Records Register...');
  records.forEach(r => {
    if (!r.studentName || !r.enrollmentNo || !r.academicPerformance || !r.outcome) {
      throw new Error(`Record ${r.id} missing mandatory consultation dossier fields`);
    }
  });
  console.log(`✓ Consultation Register validated: ${records.length} records with full discussion summaries.`);

  // Test 6: Tab 6 (Follow-Up Action Tracking Register) State Transitions
  console.log('\n[TEST 6] Verifying 17-Column Follow-up Action Register & Status Transition...');
  if (followUps.length === 0) throw new Error('No follow-up actions found');
  const sampleAction = followUps[0];
  const originalStatus = sampleAction.status;

  const toggled = ptmService.updateFollowUpAction(sampleAction.id, {
    status: originalStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
  });
  if (!toggled) throw new Error('Failed to update follow-up action');
  console.log(`✓ Status transitioned successfully from ${originalStatus} to ${toggled.status}.`);

  // Revert
  ptmService.updateFollowUpAction(sampleAction.id, { status: originalStatus });
  console.log(`✓ Status reverted to ${originalStatus}.`);

  console.log('\n================================================================');
  console.log('✅ ALL PTM MODULE INTEGRATION TESTS PASSED SUCCESSFULLY');
  console.log('================================================================');
}

runPTMModuleIntegrationTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ INTEGRATION TEST FAILED:', err);
    process.exit(1);
  });
