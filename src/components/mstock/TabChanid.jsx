import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV3, useLV4 } from '../../hooks/useStockData';

const LV3_COLS = [
  { key: 'id',    label: 'รหัส',    width: 55 },
  { key: 'name',  label: 'ชนิด',    width: 200 },
  { key: 'total', label: 'กกเหลือ', width: 90,  align: 'right' },
  { key: 'price', label: 'ราคา',    width: 80,  align: 'right' },
  { key: 'value', label: 'รวม',     width: 110, align: 'right' },
];

const LV4_COLS = [
  { key: 'mid',   label: 'mid',   width: 70 },
  { key: 'info',  label: 'Info',  width: 200 },
  { key: 'total', label: 'Total', width: 80,  align: 'right' },
  { key: 'price', label: 'price', width: 80,  align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanid() {
  const { setSelectedMtype } = useAppStore();
  const [selectedLv3, setSelectedLv3] = useState(-1);
  const [selectedTypeid, setSelectedTypeid] = useState(null);

  const { rows: lv3Rows, loading: lv3Loading } = useLV3();
  const { rows: lv4Rows, loading: lv4Loading } = useLV4(selectedTypeid);

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นชนิด', onClick: () => {}, title: 'ค้นหาข้อมูลชนิดสินค้า' },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ย่อ',  onClick: () => {}, title: 'พิมพ์รายงานแบบกะทัดรัด' },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ละเอียด',  onClick: () => {}, title: 'พิมพ์รายงานแบบละเอียด' },
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
        <div className="overflow-hidden relative" style={{ width: '50%' }}>
          {lv3Loading && <LoadingOverlay />}
          <ListView
            columns={LV3_COLS}
            rows={lv3Rows}
            selectedIndex={selectedLv3}
            onRowClick={handleLv3Click}
            className="h-full"
          />
        </div>
        <div className="overflow-hidden relative" style={{ width: '50%' }}>
          {lv4Loading && <LoadingOverlay />}
          <ListView columns={LV4_COLS} rows={lv4Rows} className="h-full" />
        </div>
      </div>
    </div>
  );
}