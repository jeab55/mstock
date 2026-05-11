/**
 * Delphi "ชนิด" picker — Fsearch.pas with table='mtype', column='typename'
 * SELECT id, typename FROM mtype WHERE typename LIKE '%xxx%' ORDER BY id
 * F1 focuses search. -SUM row at footer.
 */
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const COLS = [
  { key: 'id',   label: 'id',       width: 60 },
  { key: 'name', label: 'typename', width: 340 },
];

export default function ModalFindBrand({ onClose }) {
  const { selectedMtype, setSelectedMtype } = useAppStore();
  const { selectedCompany } = useAppStore();
  const [search, setSearch]     = useState('');
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const [hovered, setHovered]   = useState(-1);
  const inputRef = useRef();

  // Load from mtype table
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.mtypes(selectedCompany, search)
      .then(data => {
        if (cancelled) return;
        setRows(data.rows || []);
      })
      .catch(e => toast.error('โหลดชนิดสินค้าล้มเหลว: ' + e.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, search]);

  // All rows including -SUM footer
  const displayRows = [...rows, { id: '-SUM', name: 'สรุปยอด' }];

  const handleSelect = (row) => {
    if (row.id === '-SUM') return;
    setSelectedMtype(String(row.id));
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'F1')     { e.preventDefault(); inputRef.current?.focus(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, rows.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && focusIdx >= 0) handleSelect(rows[focusIdx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, focusIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 460, height: 460, borderColor: '#808080' }}>
        {/* Title */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>Fsearch — เลือกชนิดสินค้า (mtype)</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Search — F1 focus */}
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <span className="text-xs text-gray-600">[F1]</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border border-gray-400 bg-white px-1 py-0.5"
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

        {/* List */}
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
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin mr-2" />กำลังโหลด...
            </div>
          )}

          {!loading && displayRows.map((row, ri) => {
            const isSUM      = row.id === '-SUM';
            const isSelected = String(row.id) === String(selectedMtype);
            const isFocused  = focusIdx === ri;
            let bg = isSUM ? '#8EA583' : '#ffffff';
            let color = isSUM ? '#ffffff' : '#000000';
            if (isSelected && !isSUM) { bg = '#316ac5'; color = '#ffffff'; }
            else if ((isFocused || hovered === ri) && !isSUM) bg = '#e8f0fa';
            return (
              <div key={ri}
                className={`flex flex-shrink-0 ${isSUM ? 'font-bold' : 'cursor-pointer'}`}
                style={{ background: bg, color }}
                onClick={() => handleSelect(row)}
                onMouseEnter={() => setHovered(ri)}
                onMouseLeave={() => setHovered(-1)}>
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
          {rows.length} รายการ
        </div>
      </div>
    </div>
  );
}