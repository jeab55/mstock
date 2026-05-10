import React, { useState, useMemo } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import { useAppStore } from '../../store/appStore';
import { buildLV3Rows, buildLV4Rows } from '../../lib/calc';

const LV3_COLS = [
  { key: 'id',    label: 'รหัส',   width: 55 },
  { key: 'name',  label: 'ชนิด',   width: 200 },
  { key: 'total', label: 'กกเหลือ', width: 90, align: 'right' },
  { key: 'price', label: 'ราคา',   width: 80, align: 'right' },
  { key: 'value', label: 'รวม',    width: 110, align: 'right' },
];

const LV4_COLS = [
  { key: 'mid',   label: 'mid',   width: 70 },
  { key: 'info',  label: 'Info',  width: 200 },
  { key: 'total', label: 'Total', width: 80, align: 'right' },
  { key: 'price', label: 'price', width: 80, align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanid() {
  const { selectedBranch, dateRange, setSelectedMtype } = useAppStore();
  const [selectedLv3, setSelectedLv3] = useState(-1);
  const [selectedTypeid, setSelectedTypeid] = useState(null);
  const branchid = selectedBranch.id;
  const { from: date1, to: date2 } = dateRange;

  const lv3Rows = useMemo(() => buildLV3Rows(branchid, date1, date2), [branchid, date1, date2]);
  const lv4Rows = useMemo(() =>
    selectedTypeid ? buildLV4Rows(selectedTypeid, branchid, date1, date2) : [],
    [selectedTypeid, branchid, date1, date2]
  );

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นชนิด', onClick: () => {} },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 1', onClick: () => console.log('TODO: พิมพ์ 1') },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ 2', onClick: () => console.log('TODO: พิมพ์ 2') },
  ];

  const handleLv3Click = (i, row) => {
    if (row.id === '-SUM') return;
    setSelectedLv3(i);
    setSelectedTypeid(row.id);
    setSelectedMtype(row.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 flex overflow-hidden">
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView
            columns={LV3_COLS}
            rows={lv3Rows}
            selectedIndex={selectedLv3}
            onRowClick={handleLv3Click}
            className="h-full"
          />
        </div>
        <div className="overflow-hidden" style={{ width: '50%' }}>
          <ListView columns={LV4_COLS} rows={lv4Rows} className="h-full" />
        </div>
      </div>
    </div>
  );
}