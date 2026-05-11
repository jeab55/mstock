import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV5, useLV6 } from '../../hooks/useStockData';

const LV5_COLS = [
  { key: 'id',    label: 'รหัส',    width: 55 },
  { key: 'name',  label: 'ชนิดย่อย', width: 260 },
  { key: 'total', label: 'กกเหลือ',  width: 90,  align: 'right' },
  { key: 'price', label: 'ราคา',    width: 80,  align: 'right' },
  { key: 'value', label: 'รวม',     width: 110, align: 'right' },
];

const LV6_COLS = [
  { key: 'mid',   label: 'mid',   width: 70 },
  { key: 'info',  label: 'Info',  width: 200 },
  { key: 'total', label: 'Total', width: 80,  align: 'right' },
  { key: 'price', label: 'price', width: 80,  align: 'right' },
  { key: 'value', label: 'value', width: 100, align: 'right' },
];

export default function TabChanidYoi() {
  const { setSelectedBrand } = useAppStore();
  const [selectedLv5, setSelectedLv5] = useState(-1);
  const [selectedBrandid, setSelectedBrandid] = useState(null);

  const { rows: lv5Rows, loading: lv5Loading } = useLV5();
  const { rows: lv6Rows, loading: lv6Loading } = useLV6(selectedBrandid);

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นประเภท', onClick: () => {}, title: 'ค้นหาข้อมูลประเภทสินค้า' },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ย่อ',   onClick: () => {}, title: 'พิมพ์รายงานแบบกะทัดรัด' },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ละเอียด',   onClick: () => {}, title: 'พิมพ์รายงานแบบละเอียด' },
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
        <div className="overflow-hidden relative" style={{ width: '50%' }}>
          {lv5Loading && <LoadingOverlay />}
          <ListView
            columns={LV5_COLS}
            rows={lv5Rows}
            selectedIndex={selectedLv5}
            onRowClick={handleLv5Click}
            className="h-full"
          />
        </div>
        <div className="overflow-hidden relative" style={{ width: '50%' }}>
          {lv6Loading && <LoadingOverlay />}
          <ListView columns={LV6_COLS} rows={lv6Rows} className="h-full" />
        </div>
      </div>
    </div>
  );
}