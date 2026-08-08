import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Excel Export', () => {
  it('should export data as Excel buffer', async () => {
    const { sendExcel } = await import('../utils/excel.export.js');
    const res = {
      setHeader: () => {},
      send: (buf) => {
        assert.ok(Buffer.isBuffer(buf));
        assert.ok(buf.length > 0);
        // XLSX magic bytes: PK (ZIP header)
        assert.strictEqual(buf[0], 0x50);
        assert.strictEqual(buf[1], 0x4B);
      },
    };
    sendExcel(res, [
      { Matricule: 'CSP001', Nom: 'Diallo', Prénom: 'Amadou' },
      { Matricule: 'CSP002', Nom: 'Oumarou', Prénom: 'Fatima' },
    ], 'test.xlsx');
  });

  it('should handle empty data', async () => {
    const { sendExcel } = await import('../utils/excel.export.js');
    const res = {
      setHeader: () => {},
      send: (buf) => {
        assert.ok(Buffer.isBuffer(buf));
        assert.ok(buf.length > 0);
      },
    };
    sendExcel(res, [], 'empty.xlsx');
  });

  it('should support multiple sheets', async () => {
    const { sendExcel } = await import('../utils/excel.export.js');
    const res = {
      setHeader: () => {},
      send: (buf) => {
        assert.ok(Buffer.isBuffer(buf));
        assert.ok(buf.length > 0);
      },
    };
    sendExcel(res, [
      { sheetName: 'Feuille1', rows: [{ A: 1 }] },
      { sheetName: 'Feuille2', rows: [{ B: 2 }] },
    ], 'multi.xlsx');
  });
});
