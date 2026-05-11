import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { MTYPES } from '../../data/mockData';

const COLS = [
  { key: 'id',   label: 'id',       width: 80 },
  { key: 'name', label: 'typename', width: 300 },
];

export default function ModalFindType({ onClose }) {
  const { selectedMtype, setSelectedMtype } = useAppStore();
  const [search, setSearch] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const filtered = useMemo(() => {
    if (!search) return MTYPES;
    const q = search.toLowerCase();
    return MTYPES.filter(r =>
      String(r.id).toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (row) => {
    setSelectedMtype(row.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 440, height: 440, borderColor: '#808080' }}>
        {/* Title bar */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>FtypePicker — เลือกชนิดสินค้า</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            placeholder="พิมพ์เพื่อค้น typename..."
          />
          <button
            className="delphi-btn px-2 py-0.5 text-xs"
            onClick={() => { setSelectedMtype(null); onClose(); }}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 flex-shrink-0" style={{ background: '#d4d0c8' }}>
            {COLS.map((col, ci) => (
              <div
                key={ci}
                className="text-xs px-1.5 py-0.5 border-r border-b border-gray-400 truncate font-semibold flex-shrink-0"
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((row, ri) => {
            const isSelected = row.id === selectedMtype;
            const isHovered = hoveredIdx === ri && !isSelected;
            let bg = '#ffffff';
            if (isSelected) bg = '#316ac5';
            else if (isHovered) bg = '#e8f0fa';

            return (
              <div
                key={ri}
                className="flex cursor-pointer flex-shrink-0"
                style={{ background: bg, color: isSelected ? '#ffffff' : '#000000' }}
                onClick={() => handleSelect(row)}
                onMouseEnter={() => setHoveredIdx(ri)}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                {COLS.map((col, ci) => (
                  <div
                    key={ci}
                    className="text-xs px-1.5 py-px truncate flex-shrink-0"
                    style={{ width: col.width, minWidth: col.width, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {row[col.key] ?? ''}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
          {selectedMtype
            ? `ชนิดที่เลือก: ${selectedMtype} — ${MTYPES.find(m => m.id === selectedMtype)?.name || ''}`
            : 'แสดงทั้งหมด'}
        </div>
      </div>
    </div>
  );
}