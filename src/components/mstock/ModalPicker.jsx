import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

export default function ModalPicker({ title, columns, rows, onSelect, onClose, searchKey, sqlHint }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      columns.some(col => String(row[col.key] || '').toLowerCase().includes(q))
    );
  }, [rows, search, columns]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 640, height: 460, borderColor: '#808080' }}>
        {/* Header */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs" style={{ background: '#7c8db0' }}>
          <span>{title}</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>
        {/* Search */}
        <div className="flex items-center gap-1 px-2 py-1" style={{ background: '#c0dcc0' }}>
          <div className="flex items-center gap-1 px-2 py-0.5 border border-gray-500" style={{ background: '#FFFFE1' }}>
            <span className="text-xs font-bold text-yellow-600">💡</span>
            <span className="text-xs font-semibold">F1 ค้น</span>
          </div>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            placeholder=""
          />
        </div>
        {/* Table */}
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Column headers */}
          <div className="flex sticky top-0 z-10" style={{ background: '#d4d0c8' }}>
            {columns.map((col, ci) => (
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
            const isSection = row._section;
            const firstKey = columns[0]?.key;
            const firstVal = String(row[firstKey] || '');
            const isSumRow = firstVal === '-SUM' || firstVal === ':sum' || firstVal === 'sum';
            const isColon = firstVal.startsWith(':') && !isSumRow;

            let rowBg = 'transparent';
            let rowFw = 400;
            let clickable = !isSection && !isSumRow;
            if (isSection) rowBg = '#B1E4F5', rowFw = 600;
            else if (isSumRow) rowBg = '#8EA583';
            else if (isColon) rowBg = '#B1E4F5';

            return (
              <div
                key={ri}
                className={`flex ${clickable ? 'cursor-pointer hover:bg-[#e8f0fa]' : ''}`}
                style={{ background: rowBg, fontWeight: rowFw }}
                onClick={() => { if (clickable) { onSelect(row); onClose(); } }}
              >
                {isSection ? (
                  <div className="text-xs px-1.5 py-0.5 w-full">─── {row._section} ───</div>
                ) : (
                  columns.map((col, ci) => (
                    <div
                      key={ci}
                      className="text-xs px-1.5 py-0.5 border-b truncate flex-shrink-0"
                      style={{ width: col.width, minWidth: col.width, borderColor: '#f0f0f0' }}
                    >
                      {row[col.key] !== undefined ? row[col.key] : ''}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        {/* SQL hint status bar */}
        {sqlHint && (
          <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
            {sqlHint}
          </div>
        )}
      </div>
    </div>
  );
}