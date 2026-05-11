import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { MTYPES, BRANDS } from '../data/mockData';
import { buildLV2Rows, computeAvgPrice, computeFIFOLots, getMaterial } from './calc';

function fmt2(n) {
  if (n === '' || n === undefined || n === null) return '';
  const v = typeof n === 'number' ? n : parseFloat(n);
  return isNaN(v) ? '' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getFilterLabel(selectedMtype, selectedMsubtype) {
  const mt = MTYPES.find(t => t.id === selectedMtype);
  const ms = BRANDS.find(b => b.id === selectedMsubtype);
  const parts = [];
  if (mt) parts.push('ชนิด: ' + mt.name);
  if (ms) parts.push('ประเภท: ' + ms.name);
  return parts.join(' | ') || 'ทั้งหมด';
}

// ─── Print 1: compact LV1 ────────────────────────────────────────────────────
export function printLV1(lv1Rows, { selectedBranch, dateRange, selectedMtype, selectedMsubtype, user }) {
  const { from: date1, to: date2 } = dateRange;
  const filterLabel = getFilterLabel(selectedMtype, selectedMsubtype);
  const printDate = new Date().toLocaleDateString('th-TH');
  const userName = user?.full_name || user?.email || '-';

  const totals = lv1Rows.reduce((a, r) => ({
    carry:  a.carry  + (r.carry  || 0),
    debit:  a.debit  + (r.debit  || 0),
    credit: a.credit + (r.credit || 0),
    total:  a.total  + (r.total  || 0),
  }), { carry: 0, debit: 0, credit: 0, total: 0 });

  const rows = lv1Rows.map(r => `
    <tr>
      <td>${r.mid}</td>
      <td>${r.info || ''}</td>
      <td class="num">${fmt2(r.carry)}</td>
      <td class="num">${fmt2(r.debit)}</td>
      <td class="num">${fmt2(r.credit)}</td>
      <td class="num">${fmt2(r.total)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>รายงานสต็อก</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: Tahoma, Arial, sans-serif; font-size: 10pt; color: #000; }
    h2 { margin: 0; font-size: 12pt; }
    .sub { font-size: 9pt; color: #444; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #e0e0e0; border: 1px solid #999; padding: 3px 5px; text-align: left; font-size: 9pt; }
    td { border: 1px solid #bbb; padding: 2px 5px; font-size: 9pt; }
    .num { text-align: right; }
    .foot td { background: #f0f0f0; font-weight: bold; }
    @media print { button { display: none; } }
  </style></head><body>
  <h2>รายงานสต็อกสินค้า — ${selectedBranch.name}</h2>
  <div class="sub">ช่วงวันที่: ${date1} ถึง ${date2}</div>
  <div class="sub">Filter: ${filterLabel}</div>
  <div class="sub">พิมพ์เมื่อ: ${printDate} &nbsp;|&nbsp; ผู้พิมพ์: ${userName}</div>
  <table>
    <thead><tr>
      <th style="width:75px">รหัส</th>
      <th>ชื่อสินค้า</th>
      <th style="width:80px" class="num">ยกมา</th>
      <th style="width:80px" class="num">รับเข้า</th>
      <th style="width:80px" class="num">จ่ายออก</th>
      <th style="width:80px" class="num">คงเหลือ</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="foot">
      <td colspan="2">รวมทั้งหมด (${lv1Rows.length} รายการ)</td>
      <td class="num">${fmt2(totals.carry)}</td>
      <td class="num">${fmt2(totals.debit)}</td>
      <td class="num">${fmt2(totals.credit)}</td>
      <td class="num">${fmt2(totals.total)}</td>
    </tr></tfoot>
  </table>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ─── Print 2: LV1 + LV2 detailed (landscape) ─────────────────────────────────
export function printLV1LV2(lv1Rows, { selectedBranch, dateRange, selectedMtype, selectedMsubtype, user }) {
  const { from: date1, to: date2 } = dateRange;
  const filterLabel = getFilterLabel(selectedMtype, selectedMsubtype);
  const printDate = new Date().toLocaleDateString('th-TH');
  const userName = user?.full_name || user?.email || '-';
  const branchid = selectedBranch.id;

  let bodyHtml = '';
  lv1Rows.forEach(r => {
    const mat = getMaterial(r.mid);
    const lv2 = buildLV2Rows(r.mid, branchid, date1, date2);
    const movRows = lv2.filter(row => row.billno).map(row => `
      <tr>
        <td>${row.abill || ''}</td>
        <td>${row.billno || ''}</td>
        <td>${row.adate || ''}</td>
        <td class="num">${row.debit !== '' ? fmt2(row.debit) : ''}</td>
        <td class="num">${row.credit !== '' ? fmt2(row.credit) : ''}</td>
        <td>${row.at || ''}</td>
      </tr>`).join('');
    if (!movRows) return;
    bodyHtml += `
      <div class="mid-block">
        <div class="mid-header">${r.mid} — ${r.info || ''} &nbsp;|&nbsp; ยกมา: ${fmt2(r.carry)} &nbsp; รับเข้า: ${fmt2(r.debit)} &nbsp; จ่ายออก: ${fmt2(r.credit)} &nbsp; คงเหลือ: ${fmt2(r.total)}</div>
        <table>
          <thead><tr>
            <th style="width:50px">ประเภท</th><th style="width:160px">เลขที่บิล</th>
            <th style="width:75px">วันที่</th>
            <th style="width:70px" class="num">รับเข้า</th>
            <th style="width:70px" class="num">จ่ายออก</th>
            <th>อ้างอิง</th>
          </tr></thead>
          <tbody>${movRows}</tbody>
        </table>
      </div>`;
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>รายงานสต็อกละเอียด</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Tahoma, Arial, sans-serif; font-size: 9pt; color: #000; }
    h2 { margin: 0; font-size: 11pt; }
    .sub { font-size: 8pt; color: #444; margin: 1px 0; }
    .mid-block { margin-top: 10px; page-break-inside: avoid; }
    .mid-header { background: #ddeeff; border: 1px solid #99bbdd; padding: 3px 6px; font-weight: bold; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 2px; }
    th { background: #e8e8e8; border: 1px solid #999; padding: 2px 4px; font-size: 8pt; }
    td { border: 1px solid #ccc; padding: 1px 4px; font-size: 8pt; }
    .num { text-align: right; }
    .page-num { position: fixed; bottom: 5mm; right: 10mm; font-size: 8pt; color: #888; }
    @media print { button { display: none; } }
  </style></head><body>
  <h2>รายงานสต็อกสินค้าละเอียด — ${selectedBranch.name}</h2>
  <div class="sub">ช่วงวันที่: ${date1} ถึง ${date2} &nbsp;|&nbsp; Filter: ${filterLabel} &nbsp;|&nbsp; พิมพ์เมื่อ: ${printDate} &nbsp;|&nbsp; ผู้พิมพ์: ${userName}</div>
  ${bodyHtml}
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ─── Export Excel ─────────────────────────────────────────────────────────────
export function exportExcel(lv1Rows, { selectedBranch, dateRange, selectedMtype, selectedMsubtype }) {
  const { from: date1, to: date2 } = dateRange;
  const mt = MTYPES.find(t => t.id === selectedMtype);
  const mtName = mt ? mt.name.replace(/[/\\?*[\]:]/g, '-') : 'ทั้งหมด';
  const branchCode = selectedBranch.id;

  const header = ['รหัส', 'ชื่อสินค้า', 'ยกมา', 'รับเข้า', 'จ่ายออก', 'คงเหลือ', 'ราคาเฉลี่ย', 'ราคาขาย', 'มูลค่า'];
  const dataRows = lv1Rows.map(r => {
    const mat = getMaterial(r.mid);
    const lots = computeFIFOLots(r.mid, selectedBranch.id);
    const avg = computeAvgPrice(lots);
    const price3 = mat?.price3 || 0;
    const value = r.total * avg;
    return [r.mid, r.info || '', r.carry, r.debit, r.credit, r.total, +avg.toFixed(4), price3, +value.toFixed(2)];
  });

  // Grand total row
  const totals = lv1Rows.reduce((a, r) => {
    const lots = computeFIFOLots(r.mid, selectedBranch.id);
    const avg = computeAvgPrice(lots);
    return { carry: a.carry + r.carry, debit: a.debit + r.debit, credit: a.credit + r.credit, total: a.total + r.total, value: a.value + r.total * avg };
  }, { carry: 0, debit: 0, credit: 0, total: 0, value: 0 });
  dataRows.push(['รวม', '', totals.carry, totals.debit, totals.credit, totals.total, '', '', +totals.value.toFixed(2)]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');

  const filename = `Stock_${branchCode}_${mtName}_${date1}-${date2}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── Export PDF ───────────────────────────────────────────────────────────────
export function exportPDF(lv1Rows, { selectedBranch, dateRange, selectedMtype, selectedMsubtype, user }) {
  const { from: date1, to: date2 } = dateRange;
  const filterLabel = getFilterLabel(selectedMtype, selectedMsubtype);
  const printDate = new Date().toLocaleDateString('th-TH');
  const userName = user?.full_name || user?.email || '-';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  doc.setFontSize(12);
  doc.text(`Stock Report - ${selectedBranch.name}`, 14, 14);
  doc.setFontSize(9);
  doc.text(`Date: ${date1} to ${date2}  |  Filter: ${filterLabel}`, 14, 20);
  doc.text(`Printed: ${printDate}  |  By: ${userName}`, 14, 25);

  const totals = lv1Rows.reduce((a, r) => ({
    carry:  a.carry  + (r.carry  || 0),
    debit:  a.debit  + (r.debit  || 0),
    credit: a.credit + (r.credit || 0),
    total:  a.total  + (r.total  || 0),
  }), { carry: 0, debit: 0, credit: 0, total: 0 });

  // Draw table manually (no jspdf-autotable)
  const colWidths = [22, 68, 20, 20, 20, 22];
  const colX = [14];
  for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);
  const rowH = 6;
  const headers = ['รหัส', 'ชื่อสินค้า', 'ยกมา', 'รับเข้า', 'จ่ายออก', 'คงเหลือ'];
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  const drawRow = (cells, y, bold, bgGray) => {
    if (bgGray) { doc.setFillColor(210, 210, 210); doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F'); }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    cells.forEach((cell, ci) => {
      const isNum = ci >= 2;
      const x = isNum ? colX[ci] + colWidths[ci] - 1 : colX[ci] + 1;
      doc.text(String(cell), x, y + 4, { align: isNum ? 'right' : 'left', maxWidth: colWidths[ci] - 2 });
    });
    doc.setDrawColor(160);
    doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), rowH);
  };

  let y = 29;
  drawRow(headers, y, true, true);
  y += rowH;

  const allRows = [
    ...lv1Rows.map(r => [r.mid, r.info || '', fmt2(r.carry), fmt2(r.debit), fmt2(r.credit), fmt2(r.total)]),
    ['รวม', `${lv1Rows.length} รายการ`, fmt2(totals.carry), fmt2(totals.debit), fmt2(totals.credit), fmt2(totals.total)],
  ];

  allRows.forEach((row, ri) => {
    if (y + rowH > pageH - 15) {
      doc.addPage();
      y = 14;
      drawRow(headers, y, true, true);
      y += rowH;
    }
    const isTotal = ri === allRows.length - 1;
    drawRow(row, y, isTotal, isTotal);
    y += rowH;
  });

  doc.setFontSize(8);
  doc.text(`หน้า 1 / ${doc.internal.getNumberOfPages()}`, pageW - 14, pageH - 8, { align: 'right' });

  const mt = MTYPES.find(t => t.id === selectedMtype);
  const mtName = mt ? mt.name.replace(/[/\\?*[\]:]/g, '-') : 'all';
  doc.save(`Stock_${selectedBranch.id}_${mtName}_${date1}-${date2}.pdf`);
}