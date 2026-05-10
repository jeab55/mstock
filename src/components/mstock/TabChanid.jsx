import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { LISTVIEW3_ITEMS, LISTVIEW4_ITEMS } from '../../data/mockData';

const LV3_COLS = [
  { key: 'id', label: 'รหัส', width: 55 },
  { key: 'name', label: 'ชนิด', width: 200 },
  { key: 'total', label: 'กกเหลือ', width: 90, align: 'right' },
  { key: 'price', label: 'ราคา', width: 80, align: 'right' },
  { key: 'value', label: 'รวม', width: 110, align: 'right' },
];

const LV4_COLS = [
  { key: 'mid', label: 'mid', width: 70 },
  { key: 'info', label: 'Info', width: 200 },
  { key: 'total', label: 'Total', width: 80, align: 'right' },
  { key: 'price', label: 'price', width: 80, align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanid() {
  const [selectedLv3, setSelectedLv3] = useState(-1);
  const [drillData, setDrillData] = useState([]);

  // LISTVIEW3_ITEMS already has a ':sum' row at the end

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นชนิด', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2', onClick: () => {} },
  ];

  const handleDoubleClick = (i, row) => {
    if (row.id === ':sum') return;
    setSelectedLv3(i);
    // For mock, always show LISTVIEW4_ITEMS (pretend drill into เนื้อหมู)
    setDrillData(LISTVIEW4_ITEMS);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        {/* ListView3 */}
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV3_COLS}
            rows={LISTVIEW3_ITEMS}
            selectedIndex={selectedLv3}
            onRowClick={(i) => setSelectedLv3(i)}
            onRowDoubleClick={handleDoubleClick}
            className="h-full"
          />
        </div>
        {/* ListView4 */}
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV4_COLS}
            rows={drillData}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}