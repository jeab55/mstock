import React, { useState, useEffect } from 'react';
import Toolbar from './Toolbar';
import ListView from './ListView';
import LoadingOverlay from './LoadingOverlay';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useLV3, useLV4, useMtypes } from '../../hooks/useStockData';
import { printLV3, printLV4 } from '../../lib/reportExport';
import { base44 } from '@/api/base44Client';

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
  const { setSelectedMtype, selectedBranch, dateRange } = useAppStore();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);
  const [selectedLv3, setSelectedLv3] = useState(-1);
  const [selectedTypeid, setSelectedTypeid] = useState(null);
  const [filterTypeid, setFilterTypeid] = useState(null); // null = ทั้งหมด
  const [showFindType, setShowFindType] = useState(false);

  const { rows: allLv3Rows, loading: lv3Loading } = useLV3();
  const { rows: lv4Rows, loading: lv4Loading } = useLV4(selectedTypeid);

  // กรอง LV3 ตาม filterTypeid ที่เลือกจาก modal
  const lv3Rows = filterTypeid
    ? allLv3Rows.filter(r => r.id === '-SUM' || String(r.id) === String(filterTypeid))
    : allLv3Rows;

  const ctx = { selectedBranch, dateRange, user: currentUser };
  const typeName = selectedTypeid ? allLv3Rows.find(r => String(r.id) === String(selectedTypeid))?.name : null;

  const toolbarButtons = [
    { icon: '💲', iconKey: '💲', label: 'ค้นชนิด', onClick: () => setShowFindType(true), title: 'ค้นหาข้อมูลชนิดสินค้า', group: 0 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ซ้าย', onClick: () => printLV3(lv3Rows, ctx), title: 'พิมพ์รายงานชนิด (ซ้าย)', group: 1 },
    { icon: '🖨', iconKey: '🖨', label: 'พิมพ์ขวา',  onClick: () => printLV4(lv4Rows, { ...ctx, typeName }), title: 'พิมพ์รายงานรายสินค้าตามชนิด (ขวา)', group: 1 },
  ];

  const handleLv3Click = (i, row) => {
    if (row.id === '-SUM') return;
    setSelectedLv3(i);
    setSelectedTypeid(row.id);
    setSelectedMtype(row.id);
  };

  const handleTypeSelect = (typeid) => {
    setFilterTypeid(typeid);
    setSelectedTypeid(typeid); // โหลด LV4 ทันทีเมื่อเลือกจาก modal
    setSelectedLv3(-1);
    setShowFindType(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {showFindType && (
        <ModalFindTypePicker
          currentFilter={filterTypeid}
          onSelect={handleTypeSelect}
          onClose={() => setShowFindType(false)}
        />
      )}
      <Toolbar buttons={toolbarButtons} />
      {filterTypeid && (
        <div className="flex items-center gap-2 px-2 py-0.5 text-xs flex-shrink-0" style={{ background: '#fffbe6', borderBottom: '1px solid #ccc' }}>
          <span>กรอง: <strong>{allLv3Rows.find(r => String(r.id) === String(filterTypeid))?.name || `id:${filterTypeid}`}</strong></span>
          <button onClick={() => handleTypeSelect(null)} className="text-red-600 hover:underline">✕ ล้าง</button>
        </div>
      )}
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

// ─── ModalFindTypePicker ──────────────────────────────────────────────────────
function ModalFindTypePicker({ currentFilter, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const { rows, loading } = useMtypes(search);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [focusIdx, setFocusIdx] = useState(-1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, rows.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && focusIdx >= 0 && rows[focusIdx]) onSelect(rows[focusIdx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, focusIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 440, height: 440, borderColor: '#808080' }}>
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>Fsearch — เลือกชนิดสินค้า (mtype)</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <span className="text-xs text-gray-600">[F1]</span>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => { setSearch(e.target.value); setFocusIdx(-1); }}
            autoFocus
            placeholder="พิมพ์เพื่อค้น typename..."
          />
          <button className="delphi-btn px-2 py-0.5 text-xs" onClick={() => onSelect(null)}>ทั้งหมด</button>
        </div>
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          <div className="flex sticky top-0 z-10" style={{ background: '#d4d0c8' }}>
            <div className="px-1.5 py-0.5 border-r border-b border-gray-400 flex-shrink-0" style={{ width: 55, fontSize: 12 }}>id</div>
            <div className="px-1.5 py-0.5 border-b border-gray-400 flex-shrink-0" style={{ width: 300, fontSize: 12 }}>typename</div>
          </div>
          {loading && <div className="py-4 text-center text-xs text-gray-500">กำลังโหลด...</div>}
          {!loading && rows.map((row, ri) => {
            const isSelected = String(row.id) === String(currentFilter);
            const isFocused  = focusIdx === ri;
            let bg = '#ffffff';
            if (isSelected) bg = '#316ac5';
            else if (isFocused || hoveredIdx === ri) bg = '#e8f0fa';
            return (
              <div key={ri} className="flex cursor-pointer flex-shrink-0"
                style={{ background: bg, color: isSelected ? '#ffffff' : '#000000' }}
                onClick={() => onSelect(row.id)}
                onMouseEnter={() => setHoveredIdx(ri)}
                onMouseLeave={() => setHoveredIdx(-1)}>
                <div className="px-1.5 py-px flex-shrink-0 border-b" style={{ width: 55, fontSize: 12, borderColor: '#f0f0f0' }}>{row.id}</div>
                <div className="px-1.5 py-px flex-shrink-0 border-b" style={{ width: 300, fontSize: 12, borderColor: '#f0f0f0' }}>{row.name}</div>
              </div>
            );
          })}
        </div>
        <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
          {rows.length} รายการ
        </div>
      </div>
    </div>
  );
}