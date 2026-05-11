import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const COLS = [
  { key: 'mid',  label: 'mid',  width: 90 },
  { key: 'info', label: 'info', width: 320 },
];

export default function ModalMidPicker({ onClose }) {
  const { selectedCompany, selectedMtype, setSelectedMid } = useAppStore();
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  useEffect(() => {
    setLoading(true);
    api.materials(selectedCompany, selectedMtype || undefined)
      .then(d => setAllRows(d.rows || []))
      .catch(e => toast.error('โหลดรหัสสินค้าล้มเหลว: ' + e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany, selectedMtype]);

  const filtered = useMemo(() => {
    if (!search) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(r =>
      String(r.mid).toLowerCase().includes(q) ||
      String(r.info || '').toLowerCase().includes(q)
    );
  }, [allRows, search]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 480, height: 480, borderColor: '#808080' }}>
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>Fsearch — รหัสสินค้า</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <input
            type="text"
            className="flex-1 border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            placeholder="พิมพ์เพื่อค้น mid หรือชื่อสินค้า..."
            style={{ fontSize: '12px' }}
          />
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
          {!loading && filtered.map((row, ri) => (
            <div key={ri} className="flex flex-shrink-0 cursor-pointer"
              style={{ background: hoveredIdx === ri ? '#e8f0fa' : '#ffffff' }}
              onClick={() => { setSelectedMid(row.mid); onClose(); }}
              onMouseEnter={() => setHoveredIdx(ri)}
              onMouseLeave={() => setHoveredIdx(-1)}>
              {COLS.map((col, ci) => (
                <div key={ci} className="px-1.5 py-px truncate flex-shrink-0"
                  style={{ width: col.width, minWidth: col.width, borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  {row[col.key] ?? ''}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
          {filtered.length} รายการ
        </div>
      </div>
    </div>
  );
}