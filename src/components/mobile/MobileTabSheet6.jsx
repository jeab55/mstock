import React, { useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAppStore } from '../../store/appStore';

function fmt(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

export default function MobileTabSheet6() {
  const { setCustomMidList, selectedCompany } = useAppStore();
  const [text, setText] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const parseMids = (str) => str.split(/[\s,\n]+/).map(s => s.trim()).filter(Boolean);

  const handleApply = () => {
    const mids = parseMids(text);
    if (mids.length > 0) setCustomMidList(mids);
  };

  const handleClear = () => {
    setText('');
    setAiResult(null);
    setCustomMidList(null);
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    const res = await base44.functions.invoke('searchProductByDescription', { company: selectedCompany, description: aiQuery });
    const mids = res?.data?.mids || [];
    setAiResult({ mids, keywords: res?.data?.keywords });
    if (mids.length > 0) {
      setText(mids.join('\n'));
      setCustomMidList(mids);
    }
    setAiLoading(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 py-3 space-y-3">
      {/* Manual MID input */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">รหัสสินค้า (MID) — คั่นด้วย Space หรือขึ้นบรรทัดใหม่</label>
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder="เช่น: 1001 1002 1003"
            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'monospace' }}
          />
          {text && (
            <button onClick={handleClear} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
        <button onClick={handleApply}
          className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FF6B2B, #ff8c5a)' }}>
          <Search className="w-4 h-4" />
          ค้นหาสินค้า
        </button>
      </div>

      {/* AI search */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#FF6B2B' }} />
          <span className="text-xs font-semibold text-slate-300">ค้นหาด้วย AI</span>
        </div>
        <div className="flex gap-2">
          <input
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
            placeholder="อธิบายสินค้าที่ต้องการ..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button onClick={handleAiSearch} disabled={aiLoading}
            className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium"
            style={{ background: aiLoading ? 'rgba(255,107,43,0.3)' : 'rgba(255,107,43,0.8)', color: '#fff' }}>
            {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>

        {aiResult && (
          <div className="mt-2">
            {aiResult.keywords && <div className="text-xs text-slate-500 mb-1">keywords: {aiResult.keywords.join(', ')}</div>}
            {aiResult.mids.length === 0
              ? <div className="text-xs text-slate-500">ไม่พบสินค้า</div>
              : <div className="text-xs text-slate-400">พบ {aiResult.mids.length} รายการ: {aiResult.mids.slice(0, 10).join(', ')}{aiResult.mids.length > 10 ? ' ...' : ''}</div>
            }
          </div>
        )}
      </div>
    </div>
  );
}