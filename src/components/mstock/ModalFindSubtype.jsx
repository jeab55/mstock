import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { MSUBTYPES } from '../../data/mockData';

const COLS = [
  { key: 'id',   label: 'id',          width: 80 },
  { key: 'name', label: 'subtypename', width: 360 },
];

export default function ModalFindSubtype({ onClose }) {
  const { selectedMsubtype, setSelectedMsubtype } = useAppStore();
  const [search, setSearch] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const base = !search
      ? MSUBTYPES
      : MSUBTYPES.filter(r => {
          const q = search.toLowerCase();
          return String(r.id).toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
        });
    return [...base, { id: '-SUM', name: 'สรุปยอด' }];
  }, [search]);

  const handleSelect = (row) => {
    if (row.id === '-SUM') return;
    setSelectedMsubtype(row.id);
    onClose();
  };

  // Keyboard: Esc close, Enter select focused, Arrow keys navigate
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx(i => Math.min(i + 1, filtered.length - 2)); // skip -SUM
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        if (focusIdx >= 0 && focusIdx < filtered.length - 1) {
          handleSelect(filtered[focusIdx]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, focusIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 500, height: 460, borderColor: '#808080' }}>
        {/* Title bar */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#4a7aab' }}>
          <span>FSubtypePicker — เลือกประเภทสินค้า</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Search bar — โทนสีฟ้าอ่อน */}
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#b8d4f0' }}>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => { setSearch(e.target.value); setFocusIdx(-1); }}
            autoFocus
            placeholder="พิมพ์เพื่อค้น subtypename..."
          />
          <button
            className="delphi-btn px-2 py-0.5 text-xs"
            onClick={() => { setSelectedMsubtype(null); onClose(); }}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 flex-shrink-0" style={{ background: '#d4e8f8' }}>
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
            const isSUM = row.id === '-SUM';
            const isSelected = row.id === selectedMsubtype;
            const isFocused = focusIdx === ri && !isSelected && !isSUM;
            const isHovered = hoveredIdx === ri && !isSelected && !isSUM && !isFocused;
            let bg = isSUM ? '#C8DDF5' : '#ffffff';
            let color = isSUM ? '#1a3a5c' : '#000000';
            if (isSelected) { bg = '#316ac5'; color = '#ffffff'; }
            else if (isFocused) { bg = '#cce0ff'; }
            else if (isHovered) { bg = '#e8f2fb'; }

            return (
              <div
                key={ri}
                className={`flex flex-shrink-0 ${isSUM ? 'font-bold' : 'cursor-pointer'}`}
                style={{ background: bg, color }}
                onClick={() => handleSelect(row)}
                onDoubleClick={() => handleSelect(row)}
                onMouseEnter={() => { setHoveredIdx(ri); setFocusIdx(ri); }}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                {COLS.map((col, ci) => (
                  <div
                    key={ci}
                    className="text-xs px-1.5 py-px truncate flex-shrink-0"
                    style={{ width: col.width, minWidth: col.width, borderBottom: '1px solid #eaf2fb' }}
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
          select id, subtypename from msubtype where subtypename like '%{search || ''}%'
        </div>
      </div>
    </div>
  );
}