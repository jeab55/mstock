import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { useAppStore } from '../../store/appStore';
import { buildLV1Rows, buildLV2Rows, computeFIFOLots, computeAvgPrice, computeMidStock, getMaterial } from '../../lib/calc';
import { MATERIALS } from '../../data/mockData';
import { printLV1, printLV1LV2, exportExcel, exportPDF } from '../../lib/reportExport';
import { base44 } from '@/api/base44Client';

const LV1_COLS = [
  { key: 'mid',    label: 'mid',     width: 70 },
  { key: 'info',   label: 'Info',    width: 200 },
  { key: 'carry',  label: 'Carry',   width: 70, align: 'right' },
  { key: 'debit',  label: 'Debit+',  width: 70, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 70, align: 'right' },
  { key: 'total',  label: 'Total',   width: 70, align: 'right' },
];

const LV2_COLS = [
  { key: 'abill',  label: 'Abill',   width: 60 },
  { key: 'billno', label: 'Billno',  width: 160 },
  { key: 'adate',  label: 'Adate',   width: 80 },
  { key: 'debit',  label: 'Debit+',  width: 70, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 70, align: 'right' },
  { key: 'at',     label: '@T',      width: 140 },
];

const LV7_COLS = [
  { key: 'lot',    label: 'lot',   width: 40 },
  { key: 'billno', label: 'Billno', width: 160 },
  { key: 'adate',  label: 'Adate', width: 80 },
  { key: 'debit',  label: 'Debit', width: 70, align: 'right' },
  { key: 'calc',   label: 'Calc',  width: 70, align: 'right' },
  { key: 'cost',   label: 'Cost',  width: 70, align: 'right' },
];

export default function TabRakarn({ onOpenType, onOpenBrand, onOpenMid, onOpenSubtype }) {
  const { selectedBranch, dateRange, selectedMid, selectedMtype, selectedMsubtype, selectedBrand, setSelectedMid, setStatusSecond } = useAppStore();
  const [busy, setBusy] = useState(null); // 'p1'|'p2'|'e1'|'e2'|null

  // Get current user once
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  // F3 shortcut
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'F3') { e.preventDefault(); onOpenSubtype?.(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenSubtype]);
  const branchid = selectedBranch.id;
  const { from: date1, to: date2 } = dateRange;

  // LV1 rows — filter by msubtype (brand prefix match) if set
  const lv1Rows = useMemo(() => {
    let rows = buildLV1Rows(branchid, date1, date2, selectedMtype || null, selectedBrand || null);
    if (selectedMsubtype && selectedMsubtype !== '-SUM') {
      rows = rows.filter(r => String(r.mid).startsWith(selectedMsubtype));
    }
    return rows;
  }, [branchid, date1, date2, selectedMtype, selectedBrand, selectedMsubtype]);

  const selectedLv1Index = useMemo(() =>
    lv1Rows.findIndex(r => r.mid === selectedMid),
    [lv1Rows, selectedMid]
  );

  // LV1 header
  const lv1Header = useMemo(() => {
    const mat = getMaterial(selectedMid);
    const stock = computeMidStock(selectedMid, branchid, date1, date2);
    return {
      header:    { mid: '+' + selectedBranch.name, info: mat?.info || '', carry: '', debit: date1.slice(2), credit: date2.slice(2), total: '' },
      subHeader: { mid: '[-', info: mat?.info || '', carry: stock.carry, debit: stock.debit, credit: stock.credit, total: stock.total },
    };
  }, [selectedMid, selectedBranch, branchid, date1, date2]);

  // LV2 rows
  const lv2Rows = useMemo(() =>
    buildLV2Rows(selectedMid, branchid, date1, date2),
    [selectedMid, branchid, date1, date2]
  );

  // LV2 header
  const lv2Header = useMemo(() => {
    const mat = getMaterial(selectedMid);
    const stock = computeMidStock(selectedMid, branchid, date1, date2);
    return {
      header:    { abill: '+' + selectedBranch.name.slice(0, 14) + '..', billno: selectedMid, adate: mat?.info || '', debit: date1.slice(2), credit: date2.slice(2), at: `${stock.carry.toFixed(2)} | ${stock.debit.toFixed(2)} | ${stock.credit.toFixed(2)} | ${stock.total.toFixed(2)}` },
      subHeader: { abill: '[-', billno: mat?.info || '', adate: '', debit: stock.carry, credit: stock.debit, at: `${stock.credit.toFixed(2)}    ${stock.total.toFixed(2)}` },
    };
  }, [selectedMid, selectedBranch, branchid, date1, date2]);

  // LV7 FIFO lots
  const lv7Rows = useMemo(() =>
    computeFIFOLots(selectedMid, branchid),
    [selectedMid, branchid]
  );

  const avgPrice = useMemo(() => computeAvgPrice(lv7Rows), [lv7Rows]);

  // Status bar update
  const mat = getMaterial(selectedMid);

  const hasData = lv1Rows.length > 0;
  const reportCtx = { selectedBranch, dateRange, selectedMtype, selectedMsubtype, user: currentUser };

  const runAsync = useCallback(async (key, fn) => {
    if (busy) return;
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  }, [busy]);

  const handlePrint1    = () => runAsync('p1', async () => printLV1(lv1Rows, reportCtx));
  const handlePrint2    = () => runAsync('p2', async () => printLV1LV2(lv1Rows, reportCtx));
  const handleExcel     = () => runAsync('e1', async () => exportExcel(lv1Rows, { ...reportCtx }));
  const handlePDF       = () => runAsync('e2', async () => exportPDF(lv1Rows, reportCtx));

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F5') { e.preventDefault(); if (hasData) handlePrint1(); }
      if (e.key === 'F6') { e.preventDefault(); if (hasData) handlePrint2(); }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); if (hasData) handleExcel(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); if (hasData) handlePDF(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasData, lv1Rows, reportCtx, busy]);

  const handleLv1Click = (i, row) => {
    if (row.mid && !row.mid.startsWith('+') && !row.mid.startsWith('[-')) {
      setSelectedMid(row.mid);
    }
  };

  const handleLv2DblClick = (i, row) => {
    if (!row.billno) return;
    const mat2 = getMaterial(selectedMid);
    setStatusSecond(`${row.debit || row.credit} X 1 = ${mat2?.cost?.toFixed(2) || ''} [ ${row.billno} ]`);
  };

  const noDataTip = !hasData ? 'ไม่มีข้อมูลให้พิมพ์/ส่งออก' : undefined;
  const toolbarButtons = [
    { icon: '📑', iconKey: '📑', label: 'ชนิด',    onClick: onOpenType },
    { icon: '🏷', iconKey: '📑', label: 'ประเภท',  onClick: onOpenSubtype },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1',  onClick: handlePrint1,  disabled: !hasData || !!busy, loading: busy === 'p1', title: noDataTip },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2',  onClick: handlePrint2,  disabled: !hasData || !!busy, loading: busy === 'p2', title: noDataTip },
    { icon: '📤', iconKey: '📤', label: 'ส่งต่อ 1', onClick: handleExcel,   disabled: !hasData || !!busy, loading: busy === 'e1', title: noDataTip },
    { icon: '📄', iconKey: '📄', label: 'ส่งต่อ 2', onClick: handlePDF,     disabled: !hasData || !!busy, loading: busy === 'e2', title: noDataTip },
    { icon: '❓', iconKey: '❓', label: 'รหัส',     onClick: onOpenMid },
    { icon: '💲', iconKey: '💲', label: 'ค้นราคา',  onClick: () => {} },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: LV1 + LV7 */}
        <div className="flex flex-col overflow-hidden" style={{ width: '56%' }}>
          <div className="overflow-hidden" style={{ height: '70%' }}>
            <ListView
              columns={LV1_COLS}
              rows={lv1Rows}
              headerRow={lv1Header.header}
              subHeaderRow={lv1Header.subHeader}
              selectedIndex={selectedLv1Index}
              onRowClick={handleLv1Click}
              className="h-full"
            />
          </div>
          <div className="overflow-hidden" style={{ height: '30%' }}>
            <ListView
              columns={LV7_COLS}
              rows={lv7Rows}
              className="h-full"
            />
          </div>
        </div>
        {/* Right: LV2 */}
        <div className="overflow-hidden flex flex-col" style={{ width: '44%' }}>
          <ListView
            columns={LV2_COLS}
            rows={lv2Rows}
            headerRow={lv2Header.header}
            subHeaderRow={lv2Header.subHeader}
            onRowDoubleClick={handleLv2DblClick}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}