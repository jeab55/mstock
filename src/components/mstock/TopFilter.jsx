import React, { useState } from 'react';
import { FolderOpen, ChevronLeft, ChevronRight, Equal } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const today = new Date();

const MONTH_NAMES = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

// Use local date methods — never toISOString() which converts to UTC and shifts date at UTC+7
function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function parseDate(s) { return new Date(s + 'T00:00:00'); }

// ISO week number (local date only)
function getWeek(d) {
  const thu = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(thu.getFullYear(), 0, 1);
  return Math.ceil((((thu - yearStart) / 86400000) + 1) / 7);
}

function weekRange(year, week) {
  // Use local date — find Monday of ISO week 1, then offset by (week-1)*7
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7; // 1=Mon..7=Sun
  const mon1 = new Date(year, 0, 4 - dow + 1);
  const mon = new Date(mon1);
  mon.setDate(mon1.getDate() + (week - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: fmt(mon), to: fmt(sun) };
}

export default function TopFilter({ onOpenBranch }) {
  const { selectedBranch, dateRange, setDateRange } = useAppStore();

  // Independent month/year state — not derived from dateRange so user overrides don't corrupt them
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());

  // Week is derived from current dateRange.from for display
  const curWeek = getWeek(parseDate(dateRange.from));

  const applyMonth = (m, y) => {
    const first = new Date(y, m, 1);
    const last  = new Date(y, m + 1, 0); // day 0 of next month = last day of this month
    setDateRange({ from: fmt(first), to: fmt(last) });
  };

  const handleMonthChange = (m) => {
    setSelMonth(m);
    applyMonth(m, selYear);
  };

  const handleYearChange = (y) => {
    setSelYear(y);
    applyMonth(selMonth, y);
  };

  const setWeek = (w) => {
    const range = weekRange(selYear, w);
    setDateRange(range);
  };

  const shiftDate1 = (delta) => {
    const d = parseDate(dateRange.from);
    d.setDate(d.getDate() + delta);
    setDateRange({ ...dateRange, from: fmt(d) });
  };

  const setEqualDates = () => {
    setDateRange({ from: dateRange.from, to: dateRange.from });
  };

  const handleFrom = (e) => setDateRange({ ...dateRange, from: e.target.value });
  const handleTo   = (e) => setDateRange({ ...dateRange, to: e.target.value });

  return (
    <div className="h-11 flex items-center gap-1 px-2 flex-shrink-0" style={{ background: '#F9CBAC', fontSize: '12px' }}>
      {/* Branch label */}
      <div className="px-1.5 py-0.5 border border-gray-400 truncate" style={{ background: '#FFFFE1', maxWidth: '160px', minWidth: '100px' }}>
        {selectedBranch.name}
      </div>
      <button onClick={onOpenBranch} className="delphi-btn flex items-center gap-1 px-1.5 py-0.5 flex-shrink-0" style={{ background: '#c0dcc0' }}>
        <FolderOpen className="w-3 h-3" /> สาขา
      </button>

      <div className="w-px h-6 bg-gray-500 mx-1" />

      {/* สัปดาห์ */}
      <span className="whitespace-nowrap flex-shrink-0">สัปดาห์</span>
      <button className="delphi-btn px-1 flex-shrink-0" onClick={() => setWeek(Math.max(1, curWeek - 1))}><ChevronLeft className="w-3 h-3" /></button>
      <input
        type="number"
        className="w-8 text-center border border-gray-400 bg-white px-0.5 flex-shrink-0"
        style={{ fontSize: '12px' }}
        value={curWeek}
        onChange={e => setWeek(Number(e.target.value))}
      />
      <button className="delphi-btn px-1 flex-shrink-0" onClick={() => setWeek(curWeek + 1)}><ChevronRight className="w-3 h-3" /></button>

      {/* เดือน */}
      <span className="ml-1 whitespace-nowrap flex-shrink-0">เดือน</span>
      <select
        className="border border-gray-400 bg-white px-1 py-0.5 flex-shrink-0"
        style={{ fontSize: '12px' }}
        value={selMonth}
        onChange={e => handleMonthChange(Number(e.target.value))}
      >
        {MONTH_NAMES.map((mn, i) => <option key={i} value={i}>{mn}</option>)}
      </select>

      {/* ปี */}
      <span className="ml-1 whitespace-nowrap flex-shrink-0">ปี</span>
      <select
        className="border border-gray-400 bg-white px-1 py-0.5 flex-shrink-0"
        style={{ fontSize: '12px' }}
        value={selYear}
        onChange={e => handleYearChange(Number(e.target.value))}
      >
        {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <div className="w-px h-6 bg-gray-500 mx-1 flex-shrink-0" />

      {/* วันที่ */}
      <span className="whitespace-nowrap flex-shrink-0">วันที่</span>
      <input type="date" value={dateRange.from} onChange={handleFrom} className="w-[110px] border border-gray-400 bg-white px-1 text-center flex-shrink-0" style={{ fontSize: '12px' }} />
      <span className="whitespace-nowrap flex-shrink-0">ถึง</span>
      <input type="date" value={dateRange.to} onChange={handleTo} className="w-[110px] border border-gray-400 bg-white px-1 text-center flex-shrink-0" style={{ fontSize: '12px' }} />

      <button className="delphi-btn px-1 flex-shrink-0" onClick={() => shiftDate1(-1)}><ChevronLeft className="w-3 h-3" /></button>
      <button className="delphi-btn px-1 flex-shrink-0" onClick={() => shiftDate1(1)}><ChevronRight className="w-3 h-3" /></button>
      <button className="delphi-btn px-1 flex-shrink-0" onClick={setEqualDates}><Equal className="w-3 h-3" /></button>
    </div>
  );
}