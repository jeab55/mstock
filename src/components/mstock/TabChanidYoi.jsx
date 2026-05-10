import React, { useState, useMemo } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { useAppStore } from '../../store/appStore';
import { buildLV5Rows, buildLV6Rows } from '../../lib/calc';

const LV5_COLS = [
  { key: 'id',    label: 'รหัส',    width: 55 },
  { key: 'name',  label: 'ชนิดย่อย', width: 260 },
  { key: 'total', label: 'กกเหลือ',  width: 90, align: 'right' },
  { key: 'price', label: 'ราคา',    width: 80, align: 'right' },
  { key: 'value', label: 'รวม',     width: 110, align: 'right' },
];

const LV6_COLS = [
  { key: 'mid',   label: 'mid',   width: 70 },
  { key: 'info',  label: 'Info',  width: 200 },
  { key: 'total', label: 'Total', width: 80, align: 'right' },
  { key: 'price', label: 'price', width: 80, align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanidYoi() {
  const { selectedBranch, dateRange, setSelectedBrand } = useAppStore();
  const [selectedLv5, setSelectedLv5] = useState(-1);
  const [selectedBrandid, setSelectedBrandid] = useState(null);
  const branchid = selectedBranch.id;
  const { from: date1, to: date2 } = dateRange;

  const lv5Rows = useMemo(() => buildLV5Rows(branchid, date1, date2), [branchid, date1, date2]);
  const lv6Rows = useMemo(() =>
    selectedBrandid ? buildLV6Rows(selectedBrandid, branchid, date1, date2) : [],
    [selectedBrandid, branchid, date1, date2]
  );

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นประเภท', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1', onClick: () => console.log('TODO: พิมพ์ 1') },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2', onClick: () => console.log('TODO: พิมพ์ 2') },
  ];

  const handleLv5Click = (i, row) => {
    if (row.id === '-SUM') return;
    setSelectedLv5(i);
    setSelectedBrandid(row.id);
    setSelectedBrand(row.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV5_COLS}
            rows={lv5Rows}
            selectedIndex={selectedLv5}
            onRowClick={handleLv5Click}
            className="h-full"
          />
        </div>
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView columns={LV6_COLS} rows={lv6Rows} className="h-full" />
        </div>
      </div>
    </div>
  );
}