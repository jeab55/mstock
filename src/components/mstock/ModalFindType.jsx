import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useMtypes } from '../../hooks/useStockData';

const COLS = [
  { key: 'id',   label: 'id',       width: 80 },
  { key: 'name', label: 'typename', width: 300 },
];

export default function ModalFindType({ onClose }) {
  const { selectedMtype, setSelectedMtype } = useAppStore();
  const [search, setSearch] = useState('');
  const { rows: baseRows, loading } = useMtypes(search);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [focusIdx, setFocusIdx] = useState(-1);

  const rows = [...baseRows, { id: '-SUM', name: 'สรุปยอด' }];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, rows.length - 2)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && focusIdx >= 0) { handleSelect(rows[focusIdx]); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, focusIdx]);

  const handleSelect = (row) => {
    if (row.id === '-SUM') return;
    setSelectedMtype(row.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 440, height: 440, borderColor: '#808080' }}>
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>FtypePicker — เลือกชนิดสินค้า</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => { setSearch(e.target.value); setFocusIdx(-1); }}
            autoFocus
            placeholder="พิมพ์เพื่อค้น typename..."
            style={{ fontSize: '12px' }}
          />
          <button className="delphi-btn px-2 py-0.5 text-xs" onClick={() => { setSelectedMtype(null); onClose(); }}>
            ทั้งหมด
          </button>
        </div>
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          <div className="flex sticky top-0 z-10 flex-shrink-0" style={{ background: '#d4d0c8' }}>
            {COLS.map((col, ci) => (
              <div key={ci} className="px-1.5 py-0.5 border-r border-b border-gray-400 truncate font-semibold flex-shrink-0"
                style={{ width: col.width, minWidth: col.width, fontSize: '12px' }}>
                {col.label}
              </div>
            ))}
          </div>
          {loading && (
            <div className="flex items-center justify-center py-4 text-xs text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin mr-2" />
              กำลังโหลด...
            </div>
          )}
          {!loading && rows.map((row, ri) => {
            const isSUM = row.id === '-SUM';
            const isSelected = row.id === selectedMtype;
            const isFocused  = focusIdx === ri;
            let bg = isSUM ? '#8EA583' : '#ffffff';
            let color = isSUM ? '#ffffff' : '#000000';
            if (isSelected) { bg = '#316ac5'; color = '#ffffff'; }
            else if ((isFocused || hoveredIdx === ri) && !isSUM) bg = '#e8f0fa';
            return (
              <div key={ri} className={`flex flex-shrink-0 ${isSUM ? 'font-bold' : 'cursor-pointer'}`}
                style={{ background: bg, color }}
                onClick={() => !isSUM && handleSelect(row)}
                onMouseEnter={() => setHoveredIdx(ri)}
                onMouseLeave={() => setHoveredIdx(-1)}>
                {COLS.map((col, ci) => (
                  <div key={ci} className="px-1.5 py-px truncate flex-shrink-0"
                    style={{ width: col.width, minWidth: col.width, borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                    {row[col.key] ?? ''}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
          {baseRows.length} รายการ
        </div>
      </div>
    </div>
  );
}