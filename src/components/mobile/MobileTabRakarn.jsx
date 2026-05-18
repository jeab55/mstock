import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLV1, useLots } from '../../hooks/useStockData';
import { useAppStore } from '../../store/appStore';

function fmt(n) {
  if (n == null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

export default function MobileTabRakarn() {
  const { rows, loading } = useLV1();
  const { setSelectedMid } = useAppStore();
  const [expandedMid, setExpandedMid] = useState(null);

  const dataRows = rows.filter(r => !r._isSubtotal);
  const sumRow   = rows.find(r => r._isSubtotal);

  const handleCardTap = (row) => {
    const mid = row.mid || row.id;
    if (expandedMid === mid) { setExpandedMid(null); }
    else { setExpandedMid(mid); setSelectedMid(mid); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Summary bar */}
      {sumRow && (
        <div className="flex-shrink-0 grid grid-cols-3 gap-px px-3 py-2"
          style={{ background: '#13131F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <SumCell label="จำนวน" value={fmt(sumRow.total)} />
          <SumCell label="ราคา" value={fmt(sumRow.price)} />
          <SumCell label="รวม" value={fmt(sumRow.value)} highlight />
        </div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && <LoadingCards />}
        {!loading && dataRows.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">ไม่มีข้อมูล</div>
        )}
        {!loading && dataRows.map((row, i) => {
          const mid = row.mid || row.id;
          const isExpanded = expandedMid === mid;
          return (
            <div key={i}>
              <button onClick={() => handleCardTap(row)} className="w-full text-left rounded-xl p-3 transition-all"
                style={{ background: isExpanded ? 'rgba(255,107,43,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isExpanded ? 'rgba(255,107,43,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 font-mono">{mid}</div>
                    <div className="text-sm text-white font-medium truncate mt-0.5">{row.info || row.name || '—'}</div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-xs text-slate-400">{fmt(row.total)} กก.</div>
                    <div className="text-sm font-semibold" style={{ color: '#FF6B2B' }}>{fmt(row.value)}</div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 ml-2 flex-shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-slate-500 ml-2 flex-shrink-0 mt-0.5" />}
                </div>
              </button>
              {isExpanded && <ExpandedLotPanel mid={mid} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SumCell({ label, value, highlight }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-xs font-semibold" style={{ color: highlight ? '#FF6B2B' : '#CBD5E1' }}>{value}</div>
    </div>
  );
}

function ExpandedLotPanel({ mid }) {
  const { lots, salePrice, loading } = useLots();
  if (loading) return <div className="py-3 text-center text-xs text-slate-500">กำลังโหลด Lots...</div>;
  if (!lots || lots.length === 0) return null;
  return (
    <div className="mx-1 mb-1 rounded-b-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none' }}>
      <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">FIFO Lots</div>
      {lots.map((lot, i) => (
        <div key={i} className="flex justify-between px-3 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-xs text-slate-400">{lot.billno || `Lot ${i+1}`}</span>
          <span className="text-xs text-white">{parseFloat(lot.bal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} กก.</span>
          <span className="text-xs" style={{ color: '#FF6B2B' }}>{parseFloat(lot.price3 || lot.cost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingCards() {
  return (
    <>
      {[1,2,3,4].map(i => (
        <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', height: 64 }} />
      ))}
    </>
  );
}