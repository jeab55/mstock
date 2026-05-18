import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useBranches } from '../../hooks/useStockData';

function fmtLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: fmtLocal(monday), to: fmtLocal(sunday) };
}

export default function MobileFilterModal({ onClose }) {
  const { selectedBranch, setBranch, dateRange, setDateRange } = useAppStore();
  const { rows: branchRows, loading } = useBranches();
  const [search, setSearch] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo,   setCustomTo]   = useState(dateRange.to);
  const [mode, setMode] = useState('week'); // 'week' | 'month' | 'custom'

  const weekRange = getWeekRange(weekOffset);

  const filtered = branchRows.filter(b => !b._group && (
    !search ||
    (b.branchcode || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.branchname || '').toLowerCase().includes(search.toLowerCase())
  ));

  const handleApply = () => {
    if (mode === 'week')   setDateRange(weekRange);
    else if (mode === 'month') {
      const today = new Date();
      const from = fmtLocal(new Date(today.getFullYear(), today.getMonth(), 1));
      const to   = fmtLocal(new Date(today.getFullYear(), today.getMonth() + 1, 0));
      setDateRange({ from, to });
    } else {
      setDateRange({ from: customFrom, to: customTo });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-t-2xl flex flex-col max-h-[85vh]"
        style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-white font-semibold text-base">ตั้งค่าตัวกรอง</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Branch */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">สาขา</label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาสาขา..."
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {loading && <div className="text-xs text-slate-500 py-2 text-center">กำลังโหลด...</div>}
              {filtered.map((b, i) => {
                const isActive = b.id === selectedBranch.id || String(b.id) === String(selectedBranch.id);
                return (
                  <button key={i} onClick={() => setBranch({ id: String(b.id), code: b.branchcode, name: b.branchname, address: b.address || '' })}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ background: isActive ? 'rgba(255,107,43,0.2)' : 'rgba(255,255,255,0.05)', color: isActive ? '#FF6B2B' : '#CBD5E1', border: isActive ? '1px solid rgba(255,107,43,0.4)' : '1px solid transparent' }}>
                    <span className="font-medium">{b.branchcode}</span>
                    <span className="ml-2 text-xs opacity-70">{b.branchname}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date mode */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">ช่วงวันที่</label>
            <div className="flex gap-2 mb-3">
              {[['week','รายสัปดาห์'],['month','รายเดือน'],['custom','กำหนดเอง']].map(([k,l]) => (
                <button key={k} onClick={() => setMode(k)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: mode===k ? '#FF6B2B' : 'rgba(255,255,255,0.08)', color: mode===k ? '#fff' : '#94A3B8' }}>
                  {l}
                </button>
              ))}
            </div>

            {mode === 'week' && (
              <div className="flex items-center justify-between px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setWeekOffset(v => v-1)} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronLeft className="w-4 h-4 text-slate-300" /></button>
                <span className="text-sm text-white">{weekRange.from} — {weekRange.to}</span>
                <button onClick={() => setWeekOffset(v => v+1)} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronRight className="w-4 h-4 text-slate-300" /></button>
              </div>
            )}

            {mode === 'custom' && (
              <div className="flex gap-2">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} />
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Apply */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={handleApply}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #FF6B2B, #ff8c5a)' }}>
            ใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
}