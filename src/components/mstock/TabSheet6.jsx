import React, { useMemo } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV1, useLV2 } from '../../hooks/useStockData';
import { computeAvgPrice } from '../../lib/calc';
import { useLots } from '../../hooks/useStockData';

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

export default function TabSheet6({ onOpenFindMids }) {
  const { customMidList, selectedBranch, dateRange, selectedMid, setSelectedMid } = useAppStore();
  const { rows: lv1Rows, loading: lv1Loading } = useLV1();
  const { rows: lv2Rows, footerData, loading: lv2Loading } = useLV2();
  const { lots } = useLots();

  const avgPrice = useMemo(() => computeAvgPrice(lots), [lots]);

  const selectedLv1Index = useMemo(() =>
    lv1Rows.findIndex(r => r.mid === selectedMid),
    [lv1Rows, selectedMid]
  );

  const lv1Summary = useMemo(() => {
    const carry  = lv1Rows.reduce((a, r) => a + (r.carry  || 0), 0);
    const debit  = lv1Rows.reduce((a, r) => a + (r.debit  || 0), 0);
    const credit = lv1Rows.reduce((a, r) => a + (r.credit || 0), 0);
    const total  = lv1Rows.reduce((a, r) => a + (r.total  || 0), 0);
    return { carry, debit, credit, total };
  }, [lv1Rows]);

  const lv1Header = customMidList ? {
    header: { mid: `+ค้นเฉพาะ ${customMidList.length} รหัส`, info: '', carry: '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), total: '' },
    subHeader: { mid: '[-', info: '', carry: lv1Summary.carry, debit: lv1Summary.debit, credit: lv1Summary.credit, total: lv1Summary.total },
  } : null;

  const selectedMidInfo = useMemo(() => lv1Rows.find(r => r.mid === selectedMid), [lv1Rows, selectedMid]);

  const lv2Header = useMemo(() => {
    const s = selectedMidInfo || {};
    return {
      header:    { abill: '+' + selectedBranch.name.slice(0, 14), billno: selectedMid || '', adate: s.info || '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), at: `${(s.carry||0).toFixed(2)} | ${(s.debit||0).toFixed(2)} | ${(s.credit||0).toFixed(2)} | ${(s.total||0).toFixed(2)}` },
      subHeader: { abill: '[-', billno: s.info || '', adate: '', debit: s.carry || '', credit: s.debit || '', at: `${(s.credit||0).toFixed(2)}    ${(s.total||0).toFixed(2)}` },
    };
  }, [selectedMid, selectedMidInfo, selectedBranch, dateRange]);

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นสินค้า', onClick: onOpenFindMids, title: 'ค้นหารหัสสินค้าหลายตัวพร้อมกัน (F7)', group: 0 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์',   onClick: () => {}, title: 'พิมพ์รายงาน', group: 1 },
  ];

  const handleLv1Click = (i, row) => {
    if (row.mid && !row.mid.startsWith('+') && !row.mid.startsWith('[-')) {
      setSelectedMid(row.mid);
    }
  };

  if (!customMidList) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar buttons={toolbarButtons} />
        <div className="flex-1 flex items-center justify-center bg-white">
          <span className="text-sm text-gray-400">กดปุ่ม "ค้นสินค้า" เพื่อค้นหา</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: LV1 */}
        <div className="overflow-hidden relative" style={{ width: '45%' }}>
          {lv1Loading && <LoadingOverlay />}
          <ListView
            columns={LV1_COLS}
            rows={lv1Rows}
            headerRow={lv1Header?.header}
            subHeaderRow={lv1Header?.subHeader}
            selectedIndex={selectedLv1Index}
            onRowClick={handleLv1Click}
            className="h-full"
          />
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
            className="h-full"
            footerData={footerData}
          />
        </div>
      </div>
    </div>
  );
}