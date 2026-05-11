import React from 'react';

// Spinner SVG
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="10" cy="10" r="8" stroke="#666" strokeWidth="2" strokeDasharray="20 10" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// Delphi-style bitmap button icons using text/symbols
const ICON_MAP = {
  '📤': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="11" fill="#fff" stroke="#f97316" strokeWidth="1.5"/>
      <polygon points="12,2 7,8 11,8 11,13 13,13 13,8 17,8" fill="#f97316"/>
    </svg>
  ),
  '📄': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="14" height="18" fill="#fff" stroke="#c00" strokeWidth="1.5"/>
      <text x="5" y="14" fontSize="9" fill="#c00" fontWeight="bold">PDF</text>
    </svg>
  ),
  '📑': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="14" height="18" fill="#fff" stroke="#666" strokeWidth="1.5"/>
      <rect x="6" y="2" width="11" height="5" fill="#c0dcc0" stroke="#666" strokeWidth="1"/>
      <line x1="5" y1="10" x2="14" y2="10" stroke="#333" strokeWidth="1"/>
      <line x1="5" y1="13" x2="14" y2="13" stroke="#333" strokeWidth="1"/>
      <line x1="5" y1="16" x2="12" y2="16" stroke="#333" strokeWidth="1"/>
    </svg>
  ),
  '🖨': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="10" rx="1" fill="#ccc" stroke="#666" strokeWidth="1.5"/>
      <rect x="5" y="3" width="14" height="6" fill="#fff" stroke="#666" strokeWidth="1.5"/>
      <rect x="5" y="15" width="14" height="6" fill="#fff" stroke="#666" strokeWidth="1.5"/>
      <circle cx="17" cy="12" r="1.5" fill="#0a0"/>
    </svg>
  ),
  '❓': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#ffaa00" strokeWidth="2"/>
      <text x="8" y="17" fontSize="13" fontWeight="bold" fill="#cc6600">?</text>
    </svg>
  ),
  '💲': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#c0dcc0" stroke="#666" strokeWidth="1.5"/>
      <text x="7" y="17" fontSize="13" fontWeight="bold" fill="#333">฿</text>
    </svg>
  ),
};

// Helper: group buttons with separators
function groupButtons(buttons) {
  const groups = [];
  let current = [];
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].group !== undefined && current.length > 0 && buttons[i].group !== buttons[i - 1]?.group) {
      groups.push(current);
      current = [];
    }
    current.push(buttons[i]);
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

export default function Toolbar({ buttons }) {
  const groups = groupButtons(buttons);
  
  return (
    <div className="flex items-center flex-shrink-0" style={{ background: '#f5f5f5', borderBottom: '1px solid #999', height: 68, padding: '6px 8px', gap: '6px', fontFamily: 'var(--font-tahoma)' }}>
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {group.map((btn, bi) => {
            const isDisabled = !!btn.disabled;
            const isActive = !!btn.active;
            return (
              <button
                key={bi}
                onClick={isDisabled ? undefined : btn.onClick}
                disabled={isDisabled}
                className="flex flex-col items-center justify-center select-none transition-colors"
                style={{
                  background: isActive ? '#cce4f7' : '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minWidth: '72px',
                  height: '56px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  padding: '4px',
                  gap: '4px',
                }}
                title={btn.title || btn.label}
                onMouseEnter={e => { if (!isDisabled && !isActive) e.currentTarget.style.background = '#f0f0f0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? '#cce4f7' : '#f5f5f5'; }}
              >
                <span className="flex items-center justify-center" style={{ width: 24, height: 24 }}>
                  {btn.loading ? <Spinner /> : (ICON_MAP[btn.iconKey] || <span style={{ fontSize: 16 }}>{btn.icon}</span>)}
                </span>
                <span style={{ fontSize: '12px', lineHeight: '14px', whiteSpace: 'nowrap', color: '#333', textAlign: 'center' }}>
                  {btn.label}
                </span>
              </button>
            );
          })}
          {gi < groups.length - 1 && (
            <div style={{ width: '1px', height: '40px', background: '#999', margin: '0 2px' }} />
          )}
        </div>
      ))}
    </div>
  );
}