import React from 'react';

// Spinner SVG
const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="7" cy="7" r="5" stroke="#666" strokeWidth="2" strokeDasharray="20 10" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// Delphi-style bitmap button icons using text/symbols
const ICON_MAP = {
  '📤': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="7" width="14" height="9" fill="#fff" stroke="#666" strokeWidth="1"/>
      <polygon points="9,1 5,6 8,6 8,10 10,10 10,6 13,6" fill="#336"/>
    </svg>
  ),
  '📄': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="1" width="11" height="14" fill="#fff" stroke="#c00" strokeWidth="1"/>
      <text x="3.5" y="10" fontSize="7" fill="#c00" fontWeight="bold">PDF</text>
    </svg>
  ),
  '📑': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="1" width="11" height="14" rx="0" fill="#fff" stroke="#666" strokeWidth="1"/>
      <rect x="5" y="1" width="8" height="4" fill="#c0dcc0" stroke="#666" strokeWidth="1"/>
      <line x1="4" y1="8" x2="11" y2="8" stroke="#333" strokeWidth="1"/>
      <line x1="4" y1="10" x2="11" y2="10" stroke="#333" strokeWidth="1"/>
      <line x1="4" y1="12" x2="9" y2="12" stroke="#333" strokeWidth="1"/>
    </svg>
  ),
  '🖨': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="6" width="14" height="8" rx="1" fill="#ccc" stroke="#666" strokeWidth="1"/>
      <rect x="4" y="2" width="10" height="5" fill="#fff" stroke="#666" strokeWidth="1"/>
      <rect x="4" y="11" width="10" height="5" fill="#fff" stroke="#666" strokeWidth="1"/>
      <circle cx="13" cy="9" r="1" fill="#0a0"/>
    </svg>
  ),
  'AA1': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <text x="1" y="13" fontSize="9" fontWeight="bold" fill="#333">A</text>
      <text x="8" y="15" fontSize="11" fontWeight="bold" fill="#333">A</text>
      <line x1="1" y1="15" x2="17" y2="15" stroke="#666" strokeWidth="0.5"/>
    </svg>
  ),
  'AA2': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <text x="1" y="13" fontSize="9" fontWeight="bold" fill="#333">A</text>
      <text x="8" y="15" fontSize="11" fontWeight="bold" fill="#333">A</text>
      <line x1="1" y1="15" x2="17" y2="15" stroke="#c00" strokeWidth="0.5"/>
    </svg>
  ),
  '❓': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" fill="#ff0" stroke="#c80" strokeWidth="1.5"/>
      <text x="6" y="13" fontSize="10" fontWeight="bold" fill="#c60">?</text>
    </svg>
  ),
  '💲': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" fill="#c0dcc0" stroke="#666" strokeWidth="1"/>
      <text x="5.5" y="13" fontSize="10" fontWeight="bold" fill="#333">฿</text>
    </svg>
  ),
  '🔍': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5" fill="none" stroke="#333" strokeWidth="1.5"/>
      <line x1="12" y1="12" x2="16" y2="16" stroke="#333" strokeWidth="2"/>
    </svg>
  ),
  'send1': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="10" height="10" fill="#fff" stroke="#666" strokeWidth="1"/>
      <polygon points="13,9 17,6 17,12" fill="#333"/>
    </svg>
  ),
  'send2': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="10" height="10" fill="#fff" stroke="#c00" strokeWidth="1"/>
      <polygon points="13,9 17,6 17,12" fill="#c00"/>
    </svg>
  ),
};

export default function Toolbar({ buttons }) {
  return (
    <div className="flex items-end gap-px px-1 pt-1 pb-0 flex-shrink-0" style={{ background: '#d4d0c8', borderBottom: '1px solid #808080', minHeight: 44 }}>
      {buttons.map((btn, i) => {
        const isDisabled = !!btn.disabled;
        return (
          <button
            key={i}
            onClick={isDisabled ? undefined : btn.onClick}
            disabled={isDisabled}
            className="flex flex-col items-center justify-end px-1.5 pb-0.5 select-none"
            style={{
              background: '#d4d0c8',
              border: '1px solid',
              borderColor: '#ffffff #808080 #808080 #ffffff',
              minWidth: 42,
              height: 38,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
            title={btn.title || btn.label}
            onMouseDown={e => { if (!isDisabled) e.currentTarget.style.borderColor = '#808080 #ffffff #ffffff #808080'; }}
            onMouseUp={e => { if (!isDisabled) e.currentTarget.style.borderColor = '#ffffff #808080 #808080 #ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ffffff #808080 #808080 #ffffff'; }}
          >
            <span className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
              {btn.loading ? <Spinner /> : (ICON_MAP[btn.iconKey] || <span style={{ fontSize: 14 }}>{btn.icon}</span>)}
            </span>
            <span style={{ fontSize: 9, lineHeight: '12px', whiteSpace: 'nowrap', color: '#000' }}>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}