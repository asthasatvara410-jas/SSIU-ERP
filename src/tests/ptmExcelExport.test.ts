import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

describe('PTM Excel Export', () => {
  it('embeds university logo into worksheet successfully', async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SSIU ERP Academic Cell';
    
    const sheet1 = workbook.addWorksheet('PTM Master Report', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: '11:11'
      }
    });

    const base64Data = SWARRNIM_LOGO_PNG_BASE64.replace(/^data:image\/\w+;base64,/, '');
    const logoId = workbook.addImage({
      base64: base64Data,
      extension: 'png'
    });

    sheet1.addImage(logoId, {
      tl: { col: 0.1, row: 0.1 },
      ext: { width: 120, height: 40 }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
