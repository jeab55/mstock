import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV1, useLV2, useLots } from '../../hooks/useStockData';
import { computeAvgPrice } from '../../lib/calc';
import { printLV1, printLV1LV2, exportExcel, exportPDF } from '../../lib/reportExport';
import { base44 } from '@/api/base44Client';

const LV1_COLS = [
  { key: 'mid',    label: 'mid',     width: 80 },
  { key: 'info',   label: 'Info',    width: 280 },
  { key: 'carry',  label: 'Carry',   width: 80, align: 'right' },
  { key: 'debit',  label: 'Debit+',  width: 80, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 80, align: 'right' },
  { key: 'total',  label: 'Total',   width: 80, align: 'right' },
];

const LV2_COLS = [
  { key: 'abill',  label: 'Abill',   width: 60 },
  { key: 'billno', label: 'Billno',  width: 190 },
  { key: 'adate',  label: 'Adate',   width: 85 },
  { key: 'debit',  label: 'Debit+',  width: 80, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 80, align: 'right' },
  { key: 'at',     label: '@T',      width: 220 },
];

const LV7_COLS = [
  { key: 'lot',    label: 'lot',    width: 40 },
  { key: 'billno', label: 'Billno', width: 190 },
  { key: 'adate',  label: 'Adate',  width: 85 },
  { key: 'debit',  label: 'Debit',  width: 80, align: 'right' },
  { key: 'calc',   label: 'Calc',   width: 80, align: 'right' },
  { key: 'cost',   label: 'Cost',   width: 80, align: 'right' },
];

export default function TabRakarn({ onOpenBrand, onOpenMid }) {
  const { selectedBranch, dateRange, selectedMid, setSelectedMid, setStatusSecond, selectedMtype } = useAppStore();
  const [busy, setBusy] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  // F3 shortcut → open brand picker
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'F3') { e.preventDefault(); onOpenBrand?.(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenBrand]);

  // ── Real API data ──────────────────────────────────────────────────────────
  const { rows: lv1Rows, loading: lv1Loading } = useLV1();
  const { rows: lv2Rows, loading: lv2Loading } = useLV2();
  const { lots, salePrice, loading: lotsLoading } = useLots();

  const lv7Rows = useMemo(() => lots.map((l, i) => ({
    lot:    String(l.lotid),
    billno: l.billno,
    adate:  String(l.adate).slice(0, 10),
    debit:  l.debit,
    calc:   l.calc,
    cost:   l.cost,
    _lotIdx: i,
  })), [lots]);

  const avgPrice = useMemo(() => computeAvgPrice(lots), [lots]);

  const selectedLv1Index = useMemo(() =>
    lv1Rows.findIndex(r => r.mid === selectedMid),
    [lv1Rows, selectedMid]
  );

  // LV1 header summary
  const lv1Summary = useMemo(() => {
    const carry  = lv1Rows.reduce((a, r) => a + (r.carry  || 0), 0);
    const debit  = lv1Rows.reduce((a, r) => a + (r.debit  || 0), 0);
    const credit = lv1Rows.reduce((a, r) => a + (r.credit || 0), 0);
    const total  = lv1Rows.reduce((a, r) => a + (r.total  || 0), 0);
    return { carry, debit, credit, total };
  }, [lv1Rows]);

  const lv1Header = useMemo(() => ({
    header:    { mid: '+' + selectedBranch.name, info: '', carry: '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), total: '' },
    subHeader: { mid: '[-', info: '', carry: lv1Summary.carry, debit: lv1Summary.debit, credit: lv1Summary.credit, total: lv1Summary.total },
  }), [selectedBranch, dateRange, lv1Summary]);

  // Selected mid info
  const selectedMidInfo = useMemo(() => lv1Rows.find(r => r.mid === selectedMid), [lv1Rows, selectedMid]);

  const lv2Header = useMemo(() => {
    const s = selectedMidInfo || {};
    return {
      header:    { abill: '+' + selectedBranch.name.slice(0, 14), billno: selectedMid || '', adate: s.info || '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), at: `${(s.carry||0).toFixed(2)} | ${(s.debit||0).toFixed(2)} | ${(s.credit||0).toFixed(2)} | ${(s.total||0).toFixed(2)}` },
      subHeader: { abill: '[-', billno: s.info || '', adate: '', debit: s.carry || '', credit: s.debit || '', at: `${(s.credit||0).toFixed(2)}    ${(s.total||0).toFixed(2)}` },
    };
  }, [selectedMid, selectedMidInfo, selectedBranch, dateRange]);

  const hasData = lv1Rows.length > 0;

  const runAsync = useCallback(async (key, fn) => {
    if (busy) return;
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  }, [busy]);

  const { selectedCompany } = useAppStore();
  const reportCtx = { selectedBranch, dateRange, selectedMtype, user: currentUser };

  const handlePrint1 = () => runAsync('p1', async () => printLV1(lv1Rows, reportCtx));
  const handlePrint2 = () => runAsync('p2', async () => printLV1LV2(lv1Rows, reportCtx));
  const handleExcel  = () => runAsync('e1', async () => exportExcel(lv1Rows, reportCtx));
  const handlePDF    = () => runAsync('e2', async () => exportPDF(lv1Rows, reportCtx));

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
    const info = selectedMidInfo?.info || '';
    setStatusSecond(`${row.debit || row.credit} X 1 = ${avgPrice.toFixed(2)} [ ${row.billno} ]`);
  };

  const noDataTip = !hasData ? 'ไม่มีข้อมูลให้พิมพ์/ส่งออก' : undefined;
  const toolbarButtons = [
    { icon: '📑', iconKey: '📑', label: 'ชนิด',    onClick: onOpenBrand },
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
        <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: '38%' }}>
          <div className="overflow-hidden relative" style={{ height: '70%' }}>
            {lv1Loading && <LoadingOverlay />}
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
          <div className="overflow-hidden relative" style={{ height: '30%' }}>
            {lotsLoading && <LoadingOverlay />}
            <ListView
              columns={LV7_COLS}
              rows={lv7Rows}
              rowStyleFn={(row) => {
                if (row._lotIdx === 0) return { bg: '#2c2c2c', color: '#ffffff' };
                return { bg: '#ffffff', color: '#cc0000' };
              }}
              className="h-full"
            />
          </div>
        </div>
        {/* Right: LV2 */}
        <div className="overflow-hidden flex flex-col flex-1 relative">
          {lv2Loading && <LoadingOverlay />}
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