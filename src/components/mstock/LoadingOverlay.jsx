import React from 'react';

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="bg-white/70 rounded px-3 py-1 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
        <span style={{ fontSize: '11px', color: '#444' }}>กำลังโหลด...</span>
      </div>
    </div>
  );
}