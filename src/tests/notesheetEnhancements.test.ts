import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../services/db';
import { DOCUMENT_CATEGORIES } from '../pages/admin-offices/NoteSheetPage';

describe('Notesheet Module Additions & Enhancements Test Suite', () => {
  it('1. Verifies DOCUMENT_CATEGORIES contains Quotation 1, Quotation 2, Quotation 3 and Supporting Evidence', () => {
    assert.ok(DOCUMENT_CATEGORIES.includes('Quotation'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Quotation 1'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Quotation 2'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Quotation 3'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Bill'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Supporting Evidence'));
    assert.ok(DOCUMENT_CATEGORIES.includes('Approval Letter'));
  });

  it('2. Verifies auto-reminder system checkAndSendPendingNotesheetReminders executes cleanly', () => {
    const reminderResult = db.checkAndSendPendingNotesheetReminders();
    assert.ok(reminderResult !== undefined);
    assert.strictEqual(typeof reminderResult.remindersSent, 'number');
    assert.ok(Array.isArray(reminderResult.details));
  });

  it('3. Verifies Notesheet verification integrity check returns authentic verification metadata', () => {
    const allSheets = db.getNoteSheets();
    assert.ok(allSheets.length > 0, 'Should have seed notesheets');
    const firstSheet = allSheets[0];

    const verificationResult = db.verifyNoteSheetIntegrity(firstSheet.id);
    assert.strictEqual(verificationResult.integrityStatus, 'VERIFIED_AUTHENTIC');
    assert.strictEqual(verificationResult.notesheetNumber, firstSheet.noteSheetNumber);
    assert.strictEqual(verificationResult.valid, true);
  });

  it('4. Verifies Notesheet Analytics summary includes real counts for pending, approved, and rejected', () => {
    const analytics = db.getNoteSheetAnalytics();
    assert.ok(analytics.totalNotesheets >= 0);
    assert.ok(analytics.approvedCount >= 0);
    assert.ok(analytics.rejectedCount >= 0);
    assert.ok(analytics.pendingCount >= 0);
    assert.ok(analytics.pendingAgeing !== undefined);
  });
});
