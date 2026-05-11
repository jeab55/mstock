import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV1, useLV2, useLots } from '../../hooks/useStockData';
import { computeAvgPrice } from '../../lib/calc';
import { printLV1, printLV2, exportExcel, exportPDFLV2 } from '../../lib/reportExport';
import { base44 } from '@/api/base44Client';

const LV1_COLS = [
  { key: 'mid',    label: 'mid',     width: 80 },
  { key: 'info',   label: 'Info',    width: 200 },
  { key: 'carry',  label: 'Carry',   width: 90, align: 'right' },
  { key: 'debit',  label: 'Debit+',  width: 90, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 90, align: 'right' },
  { key: 'total',  label: 'Total',   width: 90, align: 'right' },
];

const LV2_COLS = [
  { key: 'abill',      label: 'Abill',       width: 50 },
  { key: 'billno',     label: 'Billno',      width: 160 },
  { key: 'adate',      label: 'Adate',       width: 80 },
  { key: 'debit',      label: 'Debit+',      width: 80, align: 'right' },
  { key: 'credit',     label: 'Credit-',     width: 80, align: 'right' },
  { key: 'salePrice',  label: 'ราคาขาย/หน่วย', width: 100, align: 'right' },
  { key: 'cost',       label: 'ราคาทุน/หน่วย', width: 100, align: 'right' },
  { key: 'profit',     label: 'กำไร/หน่วย',   width: 100, align: 'right' },
  { key: 'value',      label: 'มูลค่ารวม (บาท)', width: 120, align: 'right' },
];

const LV7_COLS = [
  { key: 'lot',    label: 'lot',    width: 50 },
  { key: 'billno', label: 'Billno', width: 160 },
  { key: 'adate',  label: 'Adate',  width: 90 },
  { key: 'debit',  label: 'Debit',  width: 90, align: 'right' },
  { key: 'calc',   label: 'Calc',   width: 90, align: 'right' },
  { key: 'cost',   label: 'Cost',   width: 90, align: 'right' },
];

export default function TabRakarn({ onOpenBrand, onOpenMid, onOpenMsubtype, onOpenFindMids }) {
  const { selectedBranch, dateRange, selectedMid, setSelectedMid, setStatusSecond, selectedMtype, customMidList, setCustomMidList } = useAppStore();
  const [busy, setBusy] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  // F2 shortcut → open mtype picker, F3 → open brand/subtype picker
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') { e.preventDefault(); onOpenBrand?.(); }
      if (e.key === 'F3') { e.preventDefault(); onOpenMsubtype?.(); }
      if (e.key === 'F7') { e.preventDefault(); onOpenFindMids?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenBrand, onOpenMsubtype, onOpenFindMids]);

  // ── Real API data ──────────────────────────────────────────────────────────
  const { rows: lv1Rows, loading: lv1Loading } = useLV1();
  const { rows: lv2Rows, footerData, loading: lv2Loading } = useLV2();
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

  const lv1Header = useMemo(() => {
    const headerLabel = customMidList 
      ? `+ค้นเฉพาะ ${customMidList.length} รหัส` 
      : '+' + selectedBranch.name;
    return {
      header:    { mid: headerLabel, info: '', carry: '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), total: '' },
      subHeader: { mid: '[-', info: '', carry: lv1Summary.carry, debit: lv1Summary.debit, credit: lv1Summary.credit, total: lv1Summary.total },
    };
  }, [selectedBranch, dateRange, lv1Summary, customMidList]);

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
  const handlePrint2 = () => runAsync('p2', async () => printLV2(lv2Rows, { selectedBranch, selectedMid, selectedMidInfo: selectedMidInfo?.info, dateRange, user: currentUser, footerData }));
  const handleExcel  = () => runAsync('e1', async () => exportExcel(lv1Rows, reportCtx));
  const handlePDF    = () => runAsync('e2', async () => exportPDFLV2(lv2Rows, { selectedBranch, selectedMid, selectedMidInfo: selectedMidInfo?.info, dateRange, user: currentUser, footerData }));

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
  const noDataTip2 = !selectedMid ? 'เลือก mid ในกริดซ้ายก่อน' : noDataTip;
  const toolbarButtons = [
    { icon: '📑', iconKey: '📑', label: 'ชนิด',    onClick: onOpenBrand, group: 0 },
    { icon: '📋', iconKey: '📋', label: 'ประเภท',  onClick: onOpenMsubtype, disabled: !selectedMtype || !!customMidList, title: customMidList ? 'ล้างค้นก่อน' : (!selectedMtype ? 'เลือกชนิดก่อน' : undefined), group: 0 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ย่อ',  onClick: handlePrint1,  disabled: !hasData || !!busy, loading: busy === 'p1', title: noDataTip || 'พิมพ์ LV1 (สรุปสต๊อก) A4 ตั้ง', group: 1 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ละเอียด',  onClick: handlePrint2,  disabled: !selectedMid || !!busy, loading: busy === 'p2', title: noDataTip2 || 'พิมพ์ LV2 (movement detail) A4 แนวนอน', group: 1 },
    { icon: '📤', iconKey: '📤', label: 'Excel', onClick: handleExcel,   disabled: !hasData || !!busy, loading: busy === 'e1', title: noDataTip || 'ส่งออก LV1 เป็นไฟล์ Excel', group: 2 },
    { icon: '📄', iconKey: '📄', label: 'PDF', onClick: handlePDF,     disabled: !selectedMid || !!busy, loading: busy === 'e2', title: noDataTip2 || 'ส่งออก LV2 เป็นไฟล์ PDF', group: 2 },
    { icon: '❓', iconKey: '❓', label: 'ค้นรหัส',     onClick: onOpenMid, title: 'ค้นหารหัสสินค้า', group: 3 },
    { icon: '💲', iconKey: '💲', label: 'ค้นสินค้า',  onClick: onOpenFindMids, title: 'ค้นหารหัสสินค้าหลายตัวพร้อมกัน (F7)', group: 3 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: LV1 + LV7 */}
        <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: '45%' }}>
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
        {/* Vertical divider */}
        <div className="flex-shrink-0" style={{ width: 4, background: '#a0a0a0' }} />
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
            footerData={footerData}
          />
        </div>
      </div>
    </div>
  );
}