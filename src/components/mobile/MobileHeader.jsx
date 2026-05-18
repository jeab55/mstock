import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const COMPANIES = [
  { code: 'MMM', label: 'MMM' },
  { code: 'MMD', label: 'MMD' },
  { code: 'TUR', label: 'TUR' },
];

export default function MobileHeader({ onFilterOpen }) {
  const { selectedCompany, setCompany, selectedBranch } = useAppStore();
  const [showCompany, setShowCompany] = useState(false);

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ background: '#0F0F1A', borderColor: 'rgba(255,255,255,0.1)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🧊</span>
        <span className="font-bold text-white text-base tracking-wide">mStock</span>
      </div>

      {/* Company switcher */}
      <div className="relative">
        <button
          onClick={() => setShowCompany(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: '#FF6B2B', color: '#fff' }}
        >
          {selectedCompany}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {showCompany && (
          <div className="absolute top-full right-0 mt-1 z-50 rounded-xl overflow-hidden shadow-xl"
            style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)' }}>
            {COMPANIES.map(c => (
              <button key={c.code}
                onClick={() => { setCompany(c.code); setShowCompany(false); }}
                className="block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
                style={{ color: selectedCompany === c.code ? '#FF6B2B' : '#fff', minWidth: 80 }}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branch + filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 max-w-[90px] truncate">{selectedBranch.name}</span>
        <button onClick={onFilterOpen} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <SlidersHorizontal className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
}