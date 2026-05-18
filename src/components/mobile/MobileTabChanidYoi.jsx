import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLV5, useLV6 } from '../../hooks/useStockData';

function fmt(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

export default function MobileTabChanidYoi() {
  const { rows: lv5Rows, loading } = useLV5();
  const [selectedBrandid, setSelectedBrandid] = useState(null);
  const [collapsedTypes, setCollapsedTypes] = useState({});

  const { rows: lv6Rows, loading: lv6Loading } = useLV6(selectedBrandid);
  const selectedBrandName = selectedBrandid ? lv5Rows.find(r => String(r.id) === String(selectedBrandid))?.name : null;

  const toggleType = (typeid) => setCollapsedTypes(prev => ({ ...prev, [typeid]: !prev[typeid] }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading && <div className="text-center py-8 text-xs text-slate-500">กำลังโหลด...</div>}
        {!loading && lv5Rows.map((row, i) => {
          if (row._isGroupHeader) {
            const collapsed = collapsedTypes[row._typeid];
            return (
              <button key={i} onClick={() => toggleType(row._typeid)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 mt-2 text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-semibold text-slate-300">{row.name}</span>
                {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            );
          }

          const parentTypeid = row._typeid;
          if (collapsedTypes[parentTypeid] && !row._isGrandTotal) return null;

          if (row._isGrandTotal) {
            return (
              <div key={i} className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)' }}>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-white">รวมทั้งหมด</span>
                  <span className="text-sm font-bold" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</span>
                </div>
              </div>
            );
          }

          if (row._isSubtotal) {
            return (
              <div key={i} className="flex justify-between px-3 py-1.5 rounded mb-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-slate-500">รวมกลุ่ม</span>
                <span className="text-xs font-semibold text-slate-300">{fmt(row.value)}</span>
              </div>
            );
          }

          const isActive = String(row.id) === String(selectedBrandid);
          return (
            <button key={i} onClick={() => setSelectedBrandid(isActive ? null : row.id)}
              className="w-full text-left rounded-xl p-3 mb-1 transition-all"
              style={{ background: isActive ? 'rgba(255,107,43,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(255,107,43,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-mono mr-1">{row.id}</span>
                  <span className="text-sm text-white">{row.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{fmt(row.total)}</div>
                  <div className="text-xs font-semibold" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</div>
                </div>
              </div>

              {/* Inline LV6 */}
              {isActive && (
                <div className="mt-2 pt-2 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {lv6Loading && <div className="text-xs text-slate-500 text-center py-1">กำลังโหลด...</div>}
                  {!lv6Loading && lv6Rows.filter(r => !r._isSubtotal).map((r, ri) => (
                    <div key={ri} className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono mr-1">{r.mid}</span>
                        <span className="text-xs text-slate-300">{r.info}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#FF6B2B' }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}