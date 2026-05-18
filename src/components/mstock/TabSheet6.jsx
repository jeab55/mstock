import React, { useState } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { useAppStore } from '../../store/appStore';
import { useLV4MidList } from '../../hooks/useStockData';

const COLS = [
  { key: 'mid',   label: 'mid',     width: 70 },
  { key: 'info',  label: 'Info',    width: 300 },
  { key: 'total', label: 'กกเหลือ', width: 90,  align: 'right' },
  { key: 'price', label: 'ราคา',   width: 80,  align: 'right' },
  { key: 'value', label: 'รวม',    width: 110, align: 'right' },
];

export default function TabSheet6({ onOpenFindMids }) {
  const { customMidListT6 } = useAppStore();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const midList = customMidListT6 || [];
  const { rows, loading } = useLV4MidList(midList);

  const toolbarButtons = [
    { icon: '🔍', label: 'ค้นรหัส (F8)', onClick: onOpenFindMids, title: 'ค้นหาสินค้าจากรหัส (F8)', group: 0 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar buttons={toolbarButtons} />
      <div className="flex-1 relative overflow-hidden">
        {loading && <LoadingOverlay />}
        {midList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            กด F8 หรือปุ่ม &quot;ค้นรหัส&quot; เพื่อเลือกรายการสินค้า
          </div>
        ) : (
          <ListView
            columns={COLS}
            rows={rows}
            selectedIndex={selectedIndex}
            onRowClick={(i) => setSelectedIndex(i)}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}