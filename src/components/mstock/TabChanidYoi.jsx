import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { LISTVIEW5_ITEMS, LISTVIEW6_ITEMS } from '../../data/mockData';

const LV5_COLS = [
  { key: 'id', label: 'รหัส', width: 55 },
  { key: 'name', label: 'ชนิดย่อย', width: 260 },
  { key: 'total', label: 'กกเหลือ', width: 90, align: 'right' },
  { key: 'price', label: 'ราคา', width: 80, align: 'right' },
  { key: 'value', label: 'รวม', width: 110, align: 'right' },
];

const LV6_COLS = [
  { key: 'mid', label: 'mid', width: 70 },
  { key: 'info', label: 'Info', width: 200 },
  { key: 'total', label: 'Total', width: 80, align: 'right' },
  { key: 'price', label: 'price', width: 80, align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanidYoi() {
  const [selectedLv5, setSelectedLv5] = useState(-1);
  const [drillData, setDrillData] = useState([]);

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นประเภท', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2', onClick: () => {} },
    { icon: 'AA', iconKey: 'AA1', label: 'ส่งต่อ 1', onClick: () => {} },
    { icon: 'AA', iconKey: 'AA2', label: 'ส่งต่อ 2', onClick: () => {} },
  ];

  const handleDoubleClick = (i, row) => {
    setSelectedLv5(i);
    setDrillData(LISTVIEW6_ITEMS);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV5_COLS}
            rows={LISTVIEW5_ITEMS}
            selectedIndex={selectedLv5}
            onRowClick={(i) => setSelectedLv5(i)}
            onRowDoubleClick={handleDoubleClick}
            className="h-full"
          />
        </div>
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV6_COLS}
            rows={drillData}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}