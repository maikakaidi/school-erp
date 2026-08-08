import * as XLSX from 'xlsx';

export function sendExcel(res, data, filename) {
  const wb = XLSX.utils.book_new();

  const buildSheet = (rows, sheetName) => {
    if (!rows || rows.length === 0) {
      const ws = XLSX.utils.json_to_sheet([{ Info: 'Aucune donnée' }]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length + 2, ...rows.map(r => String(r[key] || '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  if (Array.isArray(data) && data.length > 0 && data[0].sheetName && data[0].rows) {
    data.forEach(({ sheetName, rows }) => buildSheet(rows, sheetName));
  } else {
    buildSheet(Array.isArray(data) ? data : [], 'Données');
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
}
