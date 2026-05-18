/**
 * Export/Print functions for Tab ชนิด (LV3) and Tab ชนิดย่อย (LV5)
 */
import * as XLSX from 'xlsx';

function fmt2(n) {
  if (n === '' || n === undefined || n === null) return '';
  const v = typeof n === 'number' ? n : parseFloat(n);
  return isNaN(v) ? '' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtmlTable(cols, rows) {
  const thead = `<tr>${cols.map(c => `<th style="width:${c.width}px;text-align:${c.align||'left'}">${c.label}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => {
    const bg = r._isGrandTotal ? '#8EA583' : r._isSubtotal ? '#e8e8e8' : r._isGroupHeader ? '#d4d0c8' : 'white';
    const fw = (r._isSubtotal || r._isGroupHeader) ? 'bold' : 'normal';
    const cells = cols.map(c => {
      const v = r[c.key];
      const txt = (c.align === 'right' && v !== '' && v !== undefined) ? fmt2(v) : (v ?? '');
      return `<td style="text-align:${c.align||'left'};font-weight:${fw}">${txt}</td>`;
    }).join('');
    return `<tr style="background:${bg}">${cells}</tr>`;
  }).join('');
  return `<table>${thead}${tbody}</table>`;
}

// ─── Print compact (LV3 or LV5) ──────────────────────────────────────────────
export function printSummaryCompact(rows, cols, { title, selectedBranch, dateRange, user }) {
  const { from: date1, to: date2 } = dateRange;
  const userName = user?.full_name || user?.email || '-';
  const printDate = new Date().toLocaleDateString('th-TH');
  const tableHtml = buildHtmlTable(cols, rows.filter(r => !r._isGroupHeader));

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: Tahoma, Arial, sans-serif; font-size: 9pt; color: #000; }
    h2 { margin:0; font-size:11pt; } .sub { font-size:8pt; color:#444; margin:1px 0; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { background:#e0e0e0; border:1px solid #999; padding:2px 4px; font-size:8pt; }
    td { border:1px solid #bbb; padding:1px 4px; font-size:8pt; }
    @media print { button { display:none; } }
  </style></head><body>
  <h2>${title} — ${selectedBranch.name}</h2>
  <div class="sub">ช่วงวันที่: ${date1} ถึง ${date2} &nbsp;|&nbsp; พิมพ์เมื่อ: ${printDate} &nbsp;|&nbsp; ผู้พิมพ์: ${userName}</div>
  ${tableHtml}
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ─── Print detailed (LV3+LV4 or LV5+LV6) ────────────────────────────────────
export function printSummaryDetailed(lv1Rows, lv2RowsMap, cols, detailCols, { title, selectedBranch, dateRange, user }) {
  const { from: date1, to: date2 } = dateRange;
  const userName = user?.full_name || user?.email || '-';
  const printDate = new Date().toLocaleDateString('th-TH');

  let bodyHtml = '';
  for (const row of lv1Rows) {
    if (row._isSubtotal || row._isGroupHeader) continue;
    const detailRows = lv2RowsMap[row.id] || [];
    if (detailRows.length === 0) continue;
    const detailTable = buildHtmlTable(detailCols, detailRows);
    bodyHtml += `<div style="margin-top:10px;page-break-inside:avoid">
      <div style="background:#ddeeff;border:1px solid #99bbdd;padding:3px 6px;font-weight:bold;font-size:8pt">
        ${row.id ? `[${row.id}]` : ''} ${row.name || ''} &nbsp;|&nbsp; รวม: ${fmt2(row.total)} ชิ้น &nbsp;|&nbsp; มูลค่า: ${fmt2(row.value)} บาท
      </div>${detailTable}</div>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ละเอียด</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Tahoma, Arial, sans-serif; font-size: 8pt; color: #000; }
    h2 { margin:0; font-size:10pt; } .sub { font-size:7pt; color:#444; margin:1px 0; }
    table { width:100%; border-collapse:collapse; margin-top:2px; }
    th { background:#e8e8e8; border:1px solid #999; padding:1px 3px; font-size:7pt; }
    td { border:1px solid #ccc; padding:1px 3px; font-size:7pt; }
    @media print { button { display:none; } }
  </style></head><body>
  <h2>${title} ละเอียด — ${selectedBranch.name}</h2>
  <div class="sub">ช่วงวันที่: ${date1} ถึง ${date2} &nbsp;|&nbsp; พิมพ์เมื่อ: ${printDate} &nbsp;|&nbsp; ผู้พิมพ์: ${userName}</div>
  ${bodyHtml}
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ─── Export Excel ─────────────────────────────────────────────────────────────
export function exportSummaryExcel(rows, cols, { title, selectedBranch, dateRange }) {
  const { from: date1, to: date2 } = dateRange;
  const header = cols.map(c => c.label);
  const dataRows = rows
    .filter(r => !r._isGroupHeader)
    .map(r => cols.map(c => {
      const v = r[c.key];
      if (v === '' || v === undefined || v === null) return '';
      if (c.align === 'right') return typeof v === 'number' ? v : parseFloat(v) || 0;
      return String(v);
    }));

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  ws['!cols'] = cols.map(c => ({ wch: Math.round(c.width / 7) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');
  const safeName = title.replace(/[/\\?*[\]:]/g, '-');
  XLSX.writeFile(wb, `${safeName}_${selectedBranch.id}_${date1}-${date2}.xlsx`);
}

// ─── Export PDF (print to new window) ─────────────────────────────────────────
export function exportSummaryPDF(rows, cols, { title, selectedBranch, dateRange, user }) {
  printSummaryCompact(rows, cols, { title, selectedBranch, dateRange, user });
}