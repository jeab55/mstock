import React from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV1 } from '../../hooks/useStockData';

const LV1_COLS = [
  { key: 'mid',    label: 'mid',     width: 80 },
  { key: 'info',   label: 'Info',    width: 200 },
  { key: 'carry',  label: 'Carry',   width: 90, align: 'right' },
  { key: 'debit',  label: 'Debit+',  width: 90, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 90, align: 'right' },
  { key: 'total',  label: 'Total',   width: 90, align: 'right' },
];

export default function TabSheet6({ onOpenFindMids }) {
  const { customMidList, selectedBranch, dateRange } = useAppStore();
  const { rows: lv1Rows, loading: lv1Loading } = useLV1();

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นสินค้า', onClick: onOpenFindMids, title: 'ค้นหารหัสสินค้าหลายตัวพร้อมกัน (F7)', group: 0 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์',   onClick: () => {}, title: 'พิมพ์รายงาน', group: 1 },
  ];

  const lv1Summary = lv1Rows.reduce((acc, r) => ({
    carry: acc.carry + (r.carry || 0),
    debit: acc.debit + (r.debit || 0),
    credit: acc.credit + (r.credit || 0),
    total: acc.total + (r.total || 0),
  }), { carry: 0, debit: 0, credit: 0, total: 0 });

  const lv1Header = customMidList ? {
    header: { mid: `+ค้นเฉพาะ ${customMidList.length} รหัส`, info: '', carry: '', debit: dateRange.from.slice(2), credit: dateRange.to.slice(2), total: '' },
    subHeader: { mid: '[-', info: '', carry: lv1Summary.carry, debit: lv1Summary.debit, credit: lv1Summary.credit, total: lv1Summary.total },
  } : null;

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
      <div className="flex-1 overflow-hidden relative">
        {lv1Loading && <LoadingOverlay />}
        <ListView
          columns={LV1_COLS}
          rows={lv1Rows}
          headerRow={lv1Header?.header}
          subHeaderRow={lv1Header?.subHeader}
          className="h-full"
        />
      </div>
    </div>
  );
}