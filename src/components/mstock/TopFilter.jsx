import React, { useState } from 'react';
import { FolderOpen, ChevronLeft, ChevronRight, Equal, ChevronDown } from 'lucide-react';
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
    const last  = new Date(y, m + 1, 0);
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
    const clamped = Math.max(1, Math.min(53, w));
    const range = weekRange(selYear, clamped);
    setDateRange(range);
  };

  const shiftWeek = (delta) => {
    let newWeek = curWeek + delta;
    let newYear = selYear;
    if (newWeek < 1) {
      newYear = selYear - 1;
      newWeek = 53;
    } else if (newWeek > 53) {
      newYear = selYear + 1;
      newWeek = 1;
    }
    setSelYear(newYear);
    const range = weekRange(newYear, newWeek);
    setDateRange(range);
  };

  const shiftDateDay = (delta) => {
    const d = parseDate(dateRange.from);
    d.setDate(d.getDate() + delta);
    setDateRange({ ...dateRange, from: fmt(d) });
  };

  const setEqualDates = () => {
    setDateRange({ from: dateRange.from, to: dateRange.from });
  };

  const handleFrom = (e) => setDateRange({ ...dateRange, from: e.target.value });
  const handleTo   = (e) => setDateRange({ ...dateRange, to: e.target.value });

  const btnIconStyle = {
    background: '#d4d0c8',
    border: '1px solid #999',
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    padding: 0,
    fontSize: 14,
  };
  const btnTextStyle = {
    background: '#d4d0c8',
    border: '1px solid #999',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    cursor: 'pointer', flexShrink: 0,
    padding: '0 8px',
    fontSize: 13,
    height: 28,
    fontFamily: 'var(--font-tahoma)',
  };
  const labelStyle = { fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-tahoma)' };
  const selectStyle = { fontSize: 13, border: '1px solid #999', background: '#fff', height: 28, fontFamily: 'var(--font-tahoma)', padding: '0 2px', cursor: 'pointer' };
  const inputDateStyle = { fontSize: 13, border: '1px solid #999', background: '#fff', height: 28, fontFamily: 'var(--font-tahoma)', textAlign: 'center', padding: '0 4px' };

  return (
    <div className="flex items-center gap-2 px-3 flex-shrink-0 overflow-x-auto" style={{ background: '#F9CBAC', height: 40 }}>
      {/* Branch */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="px-2 truncate flex-shrink-0" style={{ background: '#FFFFE1', maxWidth: 140, minWidth: 70, height: 28, lineHeight: '28px', fontSize: 13, border: '1px solid #999' }}
          title={selectedBranch.name}>
          {selectedBranch.name}
        </div>
        <button onClick={onOpenBranch} style={btnTextStyle} title="เปลี่ยนสาขา">
          <FolderOpen className="w-4 h-4" /> สาขา
        </button>
      </div>

      <div className="flex-shrink-0" style={{ width: 1, height: 28, background: '#ccc' }} />

      {/* สัปดาห์ */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span style={labelStyle}>สัปดาห์</span>
        <button style={btnIconStyle} onClick={() => shiftWeek(-1)} title="สัปดาห์ก่อนหน้า">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input type="number" style={{ ...selectStyle, width: 40, textAlign: 'center' }}
          value={curWeek} onChange={e => setWeek(Number(e.target.value))} />
        <button style={btnIconStyle} onClick={() => shiftWeek(1)} title="สัปดาห์ถัดไป">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-shrink-0" style={{ width: 1, height: 28, background: '#ccc' }} />

      {/* เดือน */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span style={labelStyle}>เดือน</span>
        <div style={{ position: 'relative', display: 'flex' }}>
          <select style={{ ...selectStyle, appearance: 'none', paddingRight: 24 }} value={selMonth} onChange={e => handleMonthChange(Number(e.target.value))}>
            {MONTH_NAMES.map((mn, i) => <option key={i} value={i}>{mn}</option>)}
          </select>
          <ChevronDown className="w-3 h-3" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
        </div>
      </div>

      {/* ปี */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span style={labelStyle}>ปี</span>
        <div style={{ position: 'relative', display: 'flex' }}>
          <select style={{ ...selectStyle, appearance: 'none', paddingRight: 24, width: 64 }} value={selYear} onChange={e => handleYearChange(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="w-3 h-3" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
        </div>
      </div>

      <div className="flex-shrink-0" style={{ width: 1, height: 28, background: '#ccc' }} />

      {/* วันที่ */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span style={labelStyle}>วันที่</span>
        <input type="date" value={dateRange.from} onChange={handleFrom} style={{ ...inputDateStyle, width: 120 }} />
        <span style={labelStyle}>ถึง</span>
        <input type="date" value={dateRange.to} onChange={handleTo} style={{ ...inputDateStyle, width: 120 }} />
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button style={btnIconStyle} onClick={() => shiftDateDay(-1)} title="วันก่อนหน้า">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button style={btnIconStyle} onClick={() => shiftDateDay(1)} title="วันถัดไป">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button style={btnIconStyle} onClick={setEqualDates} title="ตั้ง from = to">
          <Equal className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}