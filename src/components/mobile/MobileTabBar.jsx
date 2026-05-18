import React from 'react';
import { BarChart2, Layers, Grid3X3, Search } from 'lucide-react';

const TABS = [
  { key: 'rakarn',    label: 'รักษาน์',    Icon: BarChart2 },
  { key: 'chanid',    label: 'ชนิด',       Icon: Layers },
  { key: 'chanidyoi', label: 'ชนิดย่อย',   Icon: Grid3X3 },
  { key: 'tabsheet6', label: 'ค้นหา',      Icon: Search },
];

export default function MobileTabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex-shrink-0 flex border-t" style={{ background: '#0F0F1A', borderColor: 'rgba(255,255,255,0.1)' }}>
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button key={key} onClick={() => onTabChange(key)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{ color: active ? '#FF6B2B' : '#64748B' }}>
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
            {active && <div className="w-5 h-0.5 rounded-full mt-0.5" style={{ background: '#FF6B2B' }} />}
          </button>
        );
      })}
    </div>
  );
}