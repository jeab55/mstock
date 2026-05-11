import React, { useState } from 'react';

function getRowStyle(firstCol, isSubtotal, isGroupHeader, isOSSubtotal) {
  if (isGroupHeader) return { bg: '#B1E4F5', color: '#000000', bold: false, isSection: true };
  if (isOSSubtotal) return { bg: '#C0DCC0', color: '#000000', bold: true, isSubtotal: true };
  if (isSubtotal) return { bg: '#FFF9C4', color: '#000000', bold: true, isSubtotal: true };
  
  const val = String(firstCol || '');
  if (val === '-SUM' || val === ':sum' || val === 'sum' || val === 'SUM') return { bg: '#8EA583', color: '#ffffff', bold: true };
  if (val.startsWith(':')) return { bg: '#B1E4F5', color: '#000000', bold: false, isSection: true };
  if (val.startsWith('+') || val.startsWith('<')) return { bg: '#C0DCC0', color: '#000000', bold: false };
  if (val === '-') return { bg: '#ffffff', color: '#000000', bold: false, isSubtotal: true };
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

export default function ListView({ columns, rows, headerRow, subHeaderRow, onRowClick, onRowDoubleClick, selectedIndex, className = '', rowStyleFn, footerData }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  return (
    <div className={`delphi-listview flex flex-col overflow-hidden ${className}`}>
      {/* Column headers */}
      <div className="flex flex-shrink-0" style={{ background: '#d4d0c8' }}>
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="px-1.5 py-0.5 border-r border-b border-gray-400 truncate flex-shrink-0"
            style={{
              width: col.width,
              minWidth: col.width,
              textAlign: col.align || 'left',
              fontWeight: 400,
              fontSize: '12px',
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Header row (+ row) */}
      {headerRow && (
        <div className="flex flex-shrink-0" style={{ background: '#C0DCC0' }}>
          {columns.map((col, ci) => {
            const val = headerRow[col.key];
            const display = val !== undefined ? (typeof val === 'number' ? formatNum(val) : val) : '';
            return (
              <div key={ci} className="px-1.5 py-px border-b flex-shrink-0"
                style={{ width: col.width, minWidth: col.width, textAlign: col.align || 'left', borderColor: '#f0f0f0', fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontVariantNumeric: col.align === 'right' ? 'tabular-nums' : undefined }}
                title={display}>
                {display}
              </div>
            );
          })}
        </div>
      )}

      {/* SubHeader row ([- row) */}
      {subHeaderRow && (
        <div className="flex flex-shrink-0" style={{ background: '#BFF0F7' }}>
          {columns.map((col, ci) => {
            const val = subHeaderRow[col.key];
            const display = val !== undefined ? (typeof val === 'number' ? formatNum(val) : val) : '';
            return (
              <div key={ci} className="px-1.5 py-px border-b flex-shrink-0"
                style={{ width: col.width, minWidth: col.width, textAlign: col.align || 'left', borderColor: '#f0f0f0', fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontVariantNumeric: col.align === 'right' ? 'tabular-nums' : undefined }}
                title={display}>
                {display}
              </div>
            );
          })}
        </div>
      )}

      {/* Data rows */}
      <div className="flex-1 overflow-auto">
        {rows.map((row, ri) => {
          const firstVal = row[columns[0]?.key];
          const isGroupHeader = row._isGroupHeader;
          const isSubtotal = row._isSubtotal;
          const isOSSubtotal = row._isOSSubtotal;
          const style = getRowStyle(firstVal, isSubtotal, isGroupHeader, isOSSubtotal);
          const isSelected = selectedIndex === ri;
          const isHovered = hoveredIdx === ri && !isSelected;

          const customStyle = rowStyleFn ? rowStyleFn(row, ri) : null;

          let bgColor = customStyle?.bg || style.bg || '#ffffff';
          let textColor = customStyle?.color || style.color || '#000000';
          if (isSelected) { bgColor = '#316ac5'; textColor = '#ffffff'; }
          else if (isHovered && !customStyle) { bgColor = '#e8f0fa'; }

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
                let display = val !== undefined && val !== null ? String(val) : '';
                
                // Format numeric columns
                if (col.align === 'right' && isNumeric) {
                  display = formatNum(val);
                }
                
                // Color profit and value columns
                let valueColor = undefined;
                if ((col.key === 'value' || col.key === 'profit') && isNumeric && !isSelected) {
                  if (val < 0) valueColor = '#ff0000';
                  else if (val > 0) valueColor = '#008000';
                }

                return (
                  <div
                    key={ci}
                    className="px-1.5 py-px flex-shrink-0"
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      textAlign: col.align || 'left',
                      borderBottom: '1px solid #f0f0f0',
                      color: valueColor || undefined,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: 12,
                      fontWeight: col.key === 'value' && !isSelected ? 'bold' : undefined,
                      fontVariantNumeric: col.align === 'right' ? 'tabular-nums' : undefined,
                    }}
                    title={display}
                  >
                    {display}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {footerData && (
        <div className="flex-shrink-0" style={{ background: '#8EA583', color: '#ffffff', borderTop: '1px solid #666', padding: '4px 8px', fontSize: '12px', fontFamily: 'var(--font-tahoma)', fontWeight: 'bold' }}>
          รวมรับเข้า: {footerData.receivedTotal.toFixed(2)} บาท | ยอดขายรวม: {footerData.saleRevenue.toFixed(2)} (กำไร: {footerData.profitTotal.toFixed(2)}) บาท | ROI: {footerData.roi.toFixed(1)}%
        </div>
      )}
    </div>
  );
}