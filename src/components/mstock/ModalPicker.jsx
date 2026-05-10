import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

export default function ModalPicker({ title, columns, rows, onSelect, onClose, searchKey }) {
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
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 560, height: 440, borderColor: '#808080' }}>
        {/* Header */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs" style={{ background: '#7c8db0' }}>
          <span>{title}</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>
        {/* Search */}
        <div className="flex items-center gap-1 px-2 py-1 bg-[#d4d0c8]">
          <Search className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-600">F1 ค้น</span>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            placeholder="พิมพ์เพื่อค้นหา..."
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
            return (
              <div
                key={ri}
                className={`flex ${isSection ? '' : 'cursor-pointer hover:bg-[#e8f0fa]'}`}
                style={isSection ? { background: '#B1E4F5', fontWeight: 600 } : {}}
                onClick={() => { if (!isSection) { onSelect(row); onClose(); } }}
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
                      {row[col.key] || ''}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}