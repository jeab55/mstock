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
    <div className="flex items-end pl-1 flex-shrink-0" style={{ background: '#d4d0c8', borderBottom: '2px solid #808080' }}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className="relative select-none"
          style={{
            marginLeft: tab.key === TABS[0].key ? 0 : 4,
            padding: '3px 16px 4px',
            fontSize: 12,
            fontFamily: 'var(--font-tahoma)',
            background: activeTab === tab.key ? '#ffffff' : '#d4d0c8',
            border: '1px solid #808080',
            borderBottom: activeTab === tab.key ? '2px solid #ffffff' : '1px solid #808080',
            marginBottom: activeTab === tab.key ? -2 : 0,
            color: activeTab === tab.key ? '#000' : '#555',
            fontWeight: activeTab === tab.key ? 600 : 400,
            cursor: 'pointer',
            zIndex: activeTab === tab.key ? 2 : 1,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#1a6bd1' }} />
          )}
        </button>
      ))}
    </div>
  );
}