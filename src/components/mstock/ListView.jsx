import React, { useState } from 'react';

function getRowStyle(firstCol) {
  const val = String(firstCol || '');
  if (val === '-SUM' || val === ':sum' || val === 'sum' || val === 'SUM') return { bg: '#8EA583', color: '#ffffff', bold: true };
  if (val.startsWith(':')) return { bg: '#B1E4F5', color: '#000000', bold: false, isSection: true };
  if (val.startsWith('+') || val.startsWith('<')) return { bg: '#C0DCC0', color: '#000000', bold: false };
  if (val === '-') return { bg: '#ffffff', color: '#000000', bold: false, isSubtotal: true }; // subtotal: numbers red per-cell
  if (val.startsWith('-') && val.length > 1) return { bg: '#ffffff', color: '#ff0000', bold: false };
  if (val.startsWith('[')) return { bg: '#BFF0F7', color: '#000000', bold: false };
  return { bg: '#ffffff', color: '#000000', bold: false };
}

function formatNum(v) {
  if (v === '' || v === undefined || v === null) return '';
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ListView({ columns, rows, headerRow, subHeaderRow, onRowClick, onRowDoubleClick, selectedIndex, className = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  return (
    <div className={`delphi-listview flex flex-col overflow-hidden ${className}`}>
      {/* Column headers */}
      <div className="flex flex-shrink-0" style={{ background: '#d4d0c8' }}>
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="text-xs px-1.5 py-0.5 border-r border-b border-gray-400 truncate flex-shrink-0"
            style={{
              width: col.width,
              minWidth: col.width,
              textAlign: col.align || 'left',
              fontWeight: 400,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Header row (+ row) */}
      {headerRow && (
        <div className="flex flex-shrink-0" style={{ background: '#C0DCC0' }}>
          {columns.map((col, ci) => (
            <div
              key={ci}
              className="text-xs px-1.5 py-px border-b truncate flex-shrink-0"
              style={{
                width: col.width,
                minWidth: col.width,
                textAlign: col.align || 'left',
                borderColor: '#f0f0f0',
              }}
            >
              {headerRow[col.key] !== undefined ? (typeof headerRow[col.key] === 'number' ? formatNum(headerRow[col.key]) : headerRow[col.key]) : ''}
            </div>
          ))}
        </div>
      )}

      {/* SubHeader row ([- row) */}
      {subHeaderRow && (
        <div className="flex flex-shrink-0" style={{ background: '#BFF0F7' }}>
          {columns.map((col, ci) => (
            <div
              key={ci}
              className="text-xs px-1.5 py-px border-b truncate flex-shrink-0"
              style={{
                width: col.width,
                minWidth: col.width,
                textAlign: col.align || 'left',
                borderColor: '#f0f0f0',
              }}
            >
              {subHeaderRow[col.key] !== undefined ? (typeof subHeaderRow[col.key] === 'number' ? formatNum(subHeaderRow[col.key]) : subHeaderRow[col.key]) : ''}
            </div>
          ))}
        </div>
      )}

      {/* Data rows */}
      <div className="flex-1 overflow-auto">
        {rows.map((row, ri) => {
          const firstVal = row[columns[0]?.key];
          const style = getRowStyle(firstVal);
          const isSelected = selectedIndex === ri;
          const isHovered = hoveredIdx === ri && !isSelected;

          let bgColor = style.bg || '#ffffff';
          let textColor = style.color || '#000000';
          if (isSelected) { bgColor = '#316ac5'; textColor = '#ffffff'; }
          else if (isHovered) { bgColor = '#e8f0fa'; }

          return (
            <div
              key={ri}
              className="flex cursor-pointer"
              style={{
                background: bgColor,
                color: textColor,
                fontWeight: style.bold ? 700 : 400,
              }}
              onClick={() => onRowClick?.(ri, row)}
              onDoubleClick={() => onRowDoubleClick?.(ri, row)}
              onMouseEnter={() => setHoveredIdx(ri)}
              onMouseLeave={() => setHoveredIdx(-1)}
            >
              {columns.map((col, ci) => {
                const val = row[col.key];
                const isNumeric = typeof val === 'number';
                const display = col.align === 'right' && isNumeric ? formatNum(val) : (val !== undefined && val !== null ? String(val) : '');
                // Red: negative numbers OR subtotal row numeric cells
                const isRed = !isSelected && (
                  (isNumeric && val < 0) ||
                  (style.isSubtotal && isNumeric && val !== 0)
                );
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
    </div>
  );
}