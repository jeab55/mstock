import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { LISTVIEW1_HEADER, LISTVIEW1_SUBHEADER, LISTVIEW1_ITEMS, LISTVIEW2_HEADER, LISTVIEW2_SUBHEADER, LISTVIEW2_ITEMS, LISTVIEW7_ITEMS } from '../../data/mockData';

const LV1_COLS = [
  { key: 'mid', label: 'mid', width: 70 },
  { key: 'info', label: 'Info', width: 200 },
  { key: 'carry', label: 'Carry', width: 70, align: 'right' },
  { key: 'debit', label: 'Debit+', width: 70, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 70, align: 'right' },
  { key: 'total', label: 'Total', width: 70, align: 'right' },
];

const LV2_COLS = [
  { key: 'abill', label: 'Abill', width: 60 },
  { key: 'billno', label: 'Billno', width: 160 },
  { key: 'adate', label: 'Adate', width: 80 },
  { key: 'debit', label: 'Debit+', width: 70, align: 'right' },
  { key: 'credit', label: 'Credit-', width: 70, align: 'right' },
  { key: 'at', label: '@T', width: 140 },
];

const LV7_COLS = [
  { key: 'lot', label: 'lot', width: 40 },
  { key: 'billno', label: 'Billno', width: 160 },
  { key: 'adate', label: 'Adate', width: 80 },
  { key: 'debit', label: 'Debit', width: 70, align: 'right' },
  { key: 'calc', label: 'Calc', width: 70, align: 'right' },
  { key: 'cost', label: 'Cost', width: 70, align: 'right' },
];

export default function TabRakarn({ onOpenType, onOpenBrand, onOpenMid }) {
  const [selectedLv1, setSelectedLv1] = useState(2); // default select 101006

  const toolbarButtons = [
    { icon: '📑', iconKey: '📑', label: 'ชนิด', onClick: onOpenType },
    { icon: '🏷', iconKey: '📑', label: 'ประเภท', onClick: onOpenBrand },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2', onClick: () => {} },
    { icon: 'AA', iconKey: 'AA1', label: 'ส่งต่อ 1', onClick: () => {} },
    { icon: 'AA', iconKey: 'AA2', label: 'ส่งต่อ 2', onClick: () => {} },
    { icon: '❓', iconKey: '❓', label: 'รหัส', onClick: onOpenMid },
    { icon: '💲', iconKey: '💲', label: 'ค้นราคา', onClick: () => {} },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left side: LV1 + LV7 */}
        <div className="flex flex-col overflow-hidden" style={{ width: '56%' }}>
          {/* ListView1 — 70% height */}
          <div className="overflow-hidden" style={{ height: '70%' }}>
            <ListView
              columns={LV1_COLS}
              rows={LISTVIEW1_ITEMS}
              headerRow={LISTVIEW1_HEADER}
              subHeaderRow={LISTVIEW1_SUBHEADER}
              selectedIndex={selectedLv1}
              onRowClick={(i) => setSelectedLv1(i)}
              className="h-full"
            />
          </div>
          {/* ListView7 — 30% height */}
          <div className="overflow-hidden" style={{ height: '30%' }}>
            <ListView
              columns={LV7_COLS}
              rows={LISTVIEW7_ITEMS}
              className="h-full"
            />
          </div>
        </div>
        {/* Right side: LV2 */}
        <div className="overflow-hidden" style={{ width: '44%' }}>
          <ListView
            columns={LV2_COLS}
            rows={LISTVIEW2_ITEMS}
            headerRow={LISTVIEW2_HEADER}
            subHeaderRow={LISTVIEW2_SUBHEADER}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}