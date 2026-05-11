import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { MTYPES } from '../../data/mockData';
import { buildLV3Rows } from '../../lib/calc';

const COLS = [
  { key: 'id',     label: 'id',       width: 60 },
  { key: 'name',   label: 'typename', width: 210 },
  { key: 'total',  label: 'คงเหลือ',  width: 80,  align: 'right' },
  { key: 'price',  label: 'ราคาเฉลี่ย', width: 90, align: 'right' },
  { key: 'value',  label: 'มูลค่า',   width: 110, align: 'right' },
];

function fmt(n) {
  if (n === '' || n === undefined || n === null) return '';
  const v = typeof n === 'number' ? n : parseFloat(n);
  if (isNaN(v)) return String(n);
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ModalFindType({ onClose }) {
  const { selectedBranch, dateRange, selectedMtype, setSelectedMtype } = useAppStore();
  const [search, setSearch] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const branchid = selectedBranch.id;
  const { from: date1, to: date2 } = dateRange;

  // Rows with live stock calculation (buildLV3Rows includes -SUM)
  const allRows = useMemo(() => buildLV3Rows(branchid, date1, date2), [branchid, date1, date2]);

  const filtered = useMemo(() => {
    if (!search) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(r =>
      r.id === '-SUM' ||
      String(r.id).toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q)
    );
  }, [allRows, search]);

  const handleSelect = (row) => {
    if (row.id === '-SUM') {
      setSelectedMtype(null); // ทั้งหมด
    } else {
      setSelectedMtype(row.id);
    }
    onClose();
  };

  const totalW = COLS.reduce((a, c) => a + c.width, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 600, height: 480, borderColor: '#808080' }}>
        {/* Title bar */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>Ffinddetailstock — ค้นหาชนิดสินค้า</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Branch + date info bar */}
        <div className="flex items-center gap-2 px-2 py-0.5 text-xs flex-shrink-0" style={{ background: '#F9CBAC' }}>
          <span className="font-semibold truncate">{selectedBranch.name}</span>
          <span className="text-gray-600">{date1} → {date2}</span>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ background: '#c0dcc0' }}>
          <div className="flex items-center gap-1 px-2 py-0.5 border border-gray-500" style={{ background: '#FFFFE1' }}>
            <span className="text-xs font-bold text-yellow-600">💡</span>
            <span className="text-xs font-semibold">F1 ค้น</span>
          </div>
          <input
            type="text"
            className="flex-1 text-xs border border-gray-400 bg-white px-1 py-0.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            placeholder="พิมพ์เพื่อค้นหา..."
          />
          <button
            className="delphi-btn px-2 py-0.5 text-xs"
            onClick={() => { setSelectedMtype(null); onClose(); }}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto mx-1 mb-1 border-2 bg-white" style={{ borderStyle: 'inset', borderColor: '#d4d0c8' }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 flex-shrink-0" style={{ background: '#d4d0c8', minWidth: totalW }}>
            {COLS.map((col, ci) => (
              <div
                key={ci}
                className="text-xs px-1.5 py-0.5 border-r border-b border-gray-400 truncate font-semibold flex-shrink-0"
                style={{ width: col.width, minWidth: col.width, textAlign: col.align || 'left' }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((row, ri) => {
            const isSUM = row.id === '-SUM';
            const isSelected = row.id === selectedMtype;
            const isHovered = hoveredIdx === ri && !isSelected;

            let bg = isSUM ? '#8EA583' : '#ffffff';
            let color = isSUM ? '#ffffff' : '#000000';
            let fw = isSUM ? 700 : 400;
            if (isSelected) { bg = '#316ac5'; color = '#ffffff'; }
            else if (isHovered && !isSUM) { bg = '#e8f0fa'; }

            return (
              <div
                key={ri}
                className="flex cursor-pointer flex-shrink-0"
                style={{ background: bg, color, fontWeight: fw, minWidth: totalW }}
                onClick={() => handleSelect(row)}
                onMouseEnter={() => setHoveredIdx(ri)}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                {COLS.map((col, ci) => {
                  const val = row[col.key];
                  const isNum = typeof val === 'number';
                  const display = col.align === 'right' && isNum ? fmt(val) : (val !== undefined && val !== null ? String(val) : '');
                  const isRed = !isSelected && !isSUM && isNum && val < 0;
                  return (
                    <div
                      key={ci}
                      className="text-xs px-1.5 py-px truncate flex-shrink-0"
                      style={{
                        width: col.width,
                        minWidth: col.width,
                        textAlign: col.align || 'left',
                        borderBottom: '1px solid #f0f0f0',
                        color: isRed ? '#ff0000' : undefined,
                      }}
                    >
                      {display}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="h-5 flex items-center px-2 text-xs text-gray-600 border-t border-gray-400 flex-shrink-0" style={{ background: '#d4d0c8' }}>
          {selectedMtype
            ? `ชนิดที่เลือก: ${selectedMtype} — ${MTYPES.find(m => m.id === selectedMtype)?.name || ''}`
            : 'แสดงทั้งหมด'}
        </div>
      </div>
    </div>
  );
}