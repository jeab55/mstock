import React from 'react';

export default function Toolbar({ buttons }) {
  return (
    <div className="h-8 flex items-center gap-0.5 px-1 flex-shrink-0 delphi-toolbar">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          className="delphi-btn flex flex-col items-center px-2 py-0.5 min-w-[48px]"
          title={btn.label}
        >
          <span className="text-sm leading-none">{btn.icon}</span>
          <span className="text-[10px] leading-tight mt-0.5">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}