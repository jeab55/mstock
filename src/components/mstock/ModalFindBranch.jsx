/**
 * Delphi FFindbranch — custombranch picker with customtype group headers.
 * 3 search fields: customcode (F1), name (F2), address (F3)
 * Double-click or Enter → set branch
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const COLS = [
  { key: 'id',         label: 'customid',   width: 70 },
  { key: 'branchcode', label: 'customcode',  width: 80 },
  { key: 'branchname', label: 'name',        width: 220 },
  { key: 'address',    label: 'address',     width: 280 },
];

export default function ModalFindBranch({ onClose }) {
  const { selectedBranch, setBranch } = useAppStore();
  const { selectedCompany } = useAppStore();

  const [qCode,    setQCode]    = useState('');
  const [qName,    setQName]    = useState('');
  const [qAddress, setQAddress] = useState('');
  const [allRows,  setAllRows]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const [hovered,  setHovered]  = useState(-1);

  const ref1 = useRef(), ref2 = useRef(), ref3 = useRef();

  // Fetch on mount and when search changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.branches(selectedCompany, { qCode, qName, qAddress, activeOnly: true })
      .then(data => { if (!cancelled) setAllRows(data.rows || []); })
      .catch(e => toast.error('โหลดสาขาล้มเหลว: ' + e.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, qCode, qName, qAddress]);

  // Flat non-group rows for keyboard nav
  const dataRows = useMemo(() => allRows.filter(r => !r._group), [allRows]);

  const handleSelect = (row) => {
    setBranch({ id: String(row.id), code: row.branchcode, name: row.branchname, address: row.address || '' });
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'F1') { e.preventDefault(); ref1.current?.focus(); return; }
      if (e.key === 'F2') { e.preventDefault(); ref2.current?.focus(); return; }
      if (e.key === 'F3') { e.preventDefault(); ref3.current?.focus(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, dataRows.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && focusIdx >= 0) handleSelect(dataRows[focusIdx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dataRows, focusIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 700, height: 520, borderColor: '#808080' }}>
        {/* Title */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>FFindbranch — เลือกสาขา</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Search fields — F1/F2/F3 */}
        <div className="flex items-center gap-2 px-2 py-1 flex-shrink-0 flex-wrap" style={{ background: '#c0dcc0' }}>
          <label className="text-xs flex items-center gap-1">
            <span className="text-gray-600">[F1] รหัส:</span>
            <input ref={ref1} type="text" className="w-20 border border-gray-400 bg-white px-1 py-0.5 text-xs" autoFocus
              value={qCode} onChange={e => { setQCode(e.target.value); setFocusIdx(-1); }} />
          </label>
          <label className="text-xs flex items-center gap-1">
            <span className="text-gray-600">[F2] ชื่อ:</span>
            <input ref={ref2} type="text" className="w-40 border border-gray-400 bg-white px-1 py-0.5 text-xs"
              value={qName} onChange={e => { setQName(e.target.value); setFocusIdx(-1); }} />
          </label>
          <label className="text-xs flex items-center gap-1">
            <span className="text-gray-600">[F3] ที่อยู่:</span>
            <input ref={ref3} type="text" className="w-36 border border-gray-400 bg-white px-1 py-0.5 text-xs"
              value={qAddress} onChange={e => { setQAddress(e.target.value); setFocusIdx(-1); }} />
          </label>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Column headers */}
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

          {!loading && allRows.map((row, ri) => {
            if (row._group) {
              // Group header — Delphi section row (blue background)
              return (
                <div key={`g${ri}`} className="flex flex-shrink-0" style={{ background: '#B1E4F5' }}>
                  <div className="px-1.5 py-px text-xs font-bold flex-1" style={{ fontSize: '12px' }}>
                    {row.customtype}
                  </div>
                </div>
              );
            }

            const isSelected = String(row.id) === String(selectedBranch.id);
            const dataIdx    = dataRows.indexOf(row);
            const isFocused  = focusIdx === dataIdx;
            let bg = '#ffffff', color = '#000000';
            if (isSelected)                    { bg = '#316ac5'; color = '#ffffff'; }
            else if (isFocused || hovered === ri) bg = '#e8f0fa';

            return (
              <div key={ri} className="flex flex-shrink-0 cursor-pointer"
                style={{ background: bg, color }}
                onClick={() => handleSelect(row)}
                onDoubleClick={() => handleSelect(row)}
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
          {dataRows.length} สาขา
        </div>
      </div>
    </div>
  );
}