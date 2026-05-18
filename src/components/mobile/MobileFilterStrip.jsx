import React from 'react';
import { useAppStore } from '../../store/appStore';

function fmtDateRange(from, to) {
  if (!from || !to) return '—';
  const f = new Date(from), t = new Date(to);
  const diffDays = Math.round((t - f) / 86400000);
  if (diffDays <= 7)  return `${from.slice(8)} – ${to.slice(8)} (${from.slice(5,7)})`;
  if (diffDays <= 31) return `${from.slice(5,7)}/${from.slice(0,4)}`;
  return `${from.slice(5,7)}/${from.slice(0,4)} – ${to.slice(5,7)}/${to.slice(0,4)}`;
}

export default function MobileFilterStrip({ onTap }) {
  const { selectedBranch, dateRange } = useAppStore();

  return (
    <div
      onClick={onTap}
      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 overflow-x-auto cursor-pointer"
      style={{ background: '#13131F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Chip icon="🏪" label={selectedBranch.code || selectedBranch.name} />
      <Chip icon="📅" label={fmtDateRange(dateRange.from, dateRange.to)} />
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.08)', color: '#CBD5E1' }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}