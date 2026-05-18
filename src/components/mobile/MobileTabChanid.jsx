import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLV3, useLV4, useMtypes } from '../../hooks/useStockData';
import { useAppStore } from '../../store/appStore';

function fmt(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

export default function MobileTabChanid() {
  const { rows: lv3Rows, loading: lv3Loading } = useLV3();
  const [selectedTypeid, setSelectedTypeid] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const { rows: lv4Rows, loading: lv4Loading } = useLV4(selectedTypeid);

  const dataRows = lv3Rows.filter(r => r.id !== '-SUM');
  const sumRow   = lv3Rows.find(r => r.id === '-SUM');
  const selectedTypeName = selectedTypeid ? lv3Rows.find(r => String(r.id) === String(selectedTypeid))?.name : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: '#13131F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => setShowSearch(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
          <Search className="w-3.5 h-3.5" />
          ค้นชนิด
        </button>
        {selectedTypeid && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(255,107,43,0.15)', color: '#FF6B2B' }}>
            <span className="truncate max-w-[120px]">{selectedTypeName}</span>
            <button onClick={() => setSelectedTypeid(null)}><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* LV3 list */}
        <div className={`overflow-y-auto ${selectedTypeid ? 'flex-none max-h-48' : 'flex-1'} px-3 py-2 space-y-1.5`}>
          {lv3Loading && <div className="text-center py-6 text-xs text-slate-500">กำลังโหลด...</div>}
          {!lv3Loading && dataRows.map((row, i) => {
            const isActive = String(row.id) === String(selectedTypeid);
            return (
              <button key={i} onClick={() => setSelectedTypeid(row.id)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{ background: isActive ? 'rgba(255,107,43,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? 'rgba(255,107,43,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-mono mr-2">{row.id}</span>
                    <span className="text-sm text-white">{row.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{fmt(row.total)} กก.</div>
                    <div className="text-xs font-semibold" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</div>
                  </div>
                </div>
              </button>
            );
          })}
          {sumRow && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)' }}>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-white">รวมทั้งหมด</span>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{fmt(sumRow.total)} กก.</div>
                  <div className="text-sm font-bold" style={{ color: '#FF6B2B' }}>{fmt(sumRow.value)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LV4 detail */}
        {selectedTypeid && (
          <div className="flex-1 overflow-y-auto border-t px-3 py-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-xs text-slate-500 pb-1">รายสินค้าใน: {selectedTypeName}</div>
            {lv4Loading && <div className="text-center py-4 text-xs text-slate-500">กำลังโหลด...</div>}
            {!lv4Loading && lv4Rows.map((row, i) => {
              if (row._isGroupHeader) return <div key={i} className="text-xs font-semibold text-slate-400 pt-2 pb-0.5">{row.info || row.mid}</div>;
              if (row._isSubtotal) return (
                <div key={i} className="flex justify-between py-1 px-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xs text-slate-400">รวม</span>
                  <span className="text-xs font-semibold" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</span>
                </div>
              );
              return (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <div className="text-xs text-slate-500 font-mono">{row.mid}</div>
                    <div className="text-xs text-white">{row.info}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{fmt(row.total)}</div>
                    <div className="text-xs" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSearch && <MobileSearchModal onClose={() => setShowSearch(false)} onSelect={(id) => { setSelectedTypeid(id); setShowSearch(false); }} />}
    </div>
  );
}

function MobileSearchModal({ onClose, onSelect }) {
  const [q, setQ] = useState('');
  const { rows, loading } = useMtypes(q);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-t-2xl flex flex-col max-h-[70vh]" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Search className="w-4 h-4 text-slate-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="ค้นหาชนิดสินค้า..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600" />
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button onClick={() => onSelect(null)} className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">— ทั้งหมด —</button>
          {loading && <div className="text-center py-4 text-xs text-slate-500">กำลังโหลด...</div>}
          {rows.map((row, i) => (
            <button key={i} onClick={() => onSelect(row.id)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <span className="text-xs text-slate-500 font-mono w-8">{row.id}</span>
              <span className="text-sm text-white">{row.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}