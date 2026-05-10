import React from 'react';
import { useAppStore } from '../../store/appStore';

const TABS = [
  { key: "rakarn",    label: "รายการ" },
  { key: "chanid",    label: "ชนิด" },
  { key: "chanidyoi", label: "ชนิดย่อย" },
  { key: "tabsheet6", label: "TabSheet6" },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex items-end pl-1 flex-shrink-0" style={{ background: '#d4d0c8' }}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-1 text-xs relative -mb-px ${
            activeTab === tab.key
              ? 'bg-white border border-gray-500 border-b-white z-10'
              : 'bg-[#d4d0c8] border border-gray-500 border-b-gray-500 hover:bg-[#e0dcd4]'
          }`}
          style={{ marginLeft: tab.key === TABS[0].key ? 0 : -1 }}
        >
          {tab.label}
        </button>
      ))}
      <div className="flex-1 border-b border-gray-500" />
    </div>
  );
}