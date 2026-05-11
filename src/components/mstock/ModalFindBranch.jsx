import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { BRANCHES_FULL } from '../../data/mockData';

const COLS = [
  { key: 'rowid',   label: 'id',       width: 45 },
  { key: 'id',      label: 'รหัสสาขา', width: 75 },
  { key: 'name',    label: 'สาขา',     width: 220 },
  { key: 'address', label: 'ที่อยู่',   width: 310 },
];

export default function ModalFindBranch({ onClose }) {
  const { selectedBranch, setBranch } = useAppStore();
  const [sCode, setSCode]    = useState('');
  const [sName, setSName]    = useState('');
  const [sAddr, setSAddr]    = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [focusIdx, setFocusIdx]  = useState(-1);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const codeRef = useRef(null);

  // Build flat rows with section headers
  const allRows = useMemo(() => {
    const rows = [];
    BRANCHES_FULL.forEach(group => {
      if (!showInactive && group.section === 'หยุดดำเนินการ') return;
      rows.push({ _section: group.section });
      group.items.forEach(item => rows.push(item));
    });
    return rows;
  }, [showInactive]);

  // Filter data rows only (not sections), then rebuild with section headers
  const filtered = useMemo(() => {
    const qCode = sCode.toLowerCase();
    const qName = sName.toLowerCase();
    const qAddr = sAddr.toLowerCase();

    const rows = [];
    BRANCHES_FULL.forEach(group => {
      if (!showInactive && group.section === 'หยุดดำเนินการ') return;
      const items = group.items.filter(item => {
        const matchCode = !qCode || String(item.id).toLowerCase().includes(qCode);
        const matchName = !qName || item.name.toLowerCase().includes(qName);
        const matchAddr = !qAddr || (item.address || '').toLowerCase().includes(qAddr);
        return matchCode && matchName && matchAddr;
      });
      if (items.length > 0) {
        rows.push({ _section: group.section });
        items.forEach(item => rows.push(item));
      }
    });
    return rows;
  }, [sCode, sName, sAddr, showInactive]);

  const dataRows = filtered.filter(r => !r._section);

  const handleSelect = (row) => {
    if (row._section) return;
    setBranch(row);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // move focus to next data row (skip section headers)
        let next = focusIdx + 1;
        while (next < filtered.length && filtered[next]._section) next++;
        if (next < filtered.length) setFocusIdx(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let prev = focusIdx - 1;
        while (prev >= 0 && filtered[prev]._section) prev--;
        if (prev >= 0) setFocusIdx(prev);
      } else if (e.key === 'Enter') {
        if (focusIdx >= 0 && focusIdx < filtered.length && !filtered[focusIdx]._section) {
          handleSelect(filtered[focusIdx]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, focusIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 800, height: 520, borderColor: '#808080' }}>

        {/* Title bar — purple */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7b5fa0' }}>
          <span>FFindbranch — เลือกสาขา</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* 3 Search inputs */}
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#e0d8f0' }}>
          <input
            ref={codeRef}
            type="text"
            className="text-xs border border-gray-400 bg-white px-1 py-0.5"
            style={{ width: 120 }}
            value={sCode}
            onChange={e => { setSCode(e.target.value); setFocusIdx(-1); }}
            autoFocus
            placeholder="ค้นด้วยรหัส"
          />
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={sName}
            onChange={e => { setSName(e.target.value); setFocusIdx(-1); }}
            placeholder="ค้นด้วยชื่อ"
          />
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={sAddr}
            onChange={e => { setSAddr(e.target.value); setFocusIdx(-1); }}
            placeholder="ค้นด้วยที่อยู่"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto mx-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Column headers */}
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
            if (row._section) {
              return (
                <div key={ri} className="flex flex-shrink-0 font-semibold" style={{ background: '#FFF2CC' }}>
                  <div className="text-xs px-1.5 py-0.5 w-full" style={{ borderBottom: '1px solid #e8d87a' }}>
                    ─── {row._section} ───
                  </div>
                </div>
              );
            }
            const isSelected = row.rowid === selectedBranch?.rowid;
            const isFocused  = focusIdx === ri && !isSelected;
            const isHovered  = hoveredIdx === ri && !isSelected && !isFocused;
            const isEven     = dataRows.indexOf(row) % 2 === 0;

            let bg = isEven ? '#ffffff' : '#f5f5f5';
            let color = '#000000';
            if (isSelected) { bg = '#316ac5'; color = '#ffffff'; }
            else if (isFocused) { bg = '#cce0ff'; }
            else if (isHovered) { bg = '#e8f0fa'; }

            return (
              <div
                key={ri}
                className="flex flex-shrink-0 cursor-pointer"
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
                    style={{ width: col.width, minWidth: col.width, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {row[col.key] ?? ''}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="h-8 flex items-center justify-between px-2 flex-shrink-0 border-t border-gray-400" style={{ background: '#d4d0c8' }}>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="w-3 h-3"
              />
              สถานะของสาขา
            </label>
            <button className="delphi-btn px-2 py-0.5 text-xs" onClick={() => console.log('TODO: ผลิตสินค้า')}>
              ผลิตสินค้า
            </button>
          </div>
          <button className="delphi-btn px-2 py-0.5 text-xs" onClick={() => console.log('TODO: F1 เพิ่ม')}>
            F1 เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}