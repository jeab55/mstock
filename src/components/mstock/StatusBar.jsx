import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useLots } from '../../hooks/useStockData';
import { computeAvgPrice } from '../../lib/calc';

export default function StatusBar() {
  const { statusSecond } = useAppStore();
  const { lots, salePrice } = useLots();
  const avgPrice = useMemo(() => computeAvgPrice(lots), [lots]);

  const sep = <span style={{ width: 1, background: '#808080', alignSelf: 'stretch', margin: '2px 0' }} />;
  return (
    <div className="flex items-center flex-shrink-0 border-t" style={{ background: '#d4d0c8', borderColor: '#808080', height: 22, fontSize: 12, fontFamily: 'var(--font-tahoma)' }}>
      <div className="px-2 h-full flex items-center gap-1">
        <span style={{ color: '#555' }}>Lotid</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{lots.length}</span>
      </div>
      {sep}
      <div className="px-2 h-full flex items-center gap-1">
        <span style={{ color: '#555' }}>AvgPrice</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{avgPrice.toFixed(2)}</span>
      </div>
      {sep}
      <div className="px-2 h-full flex items-center gap-1">
        <span style={{ color: '#555' }}>Price</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{salePrice.toFixed(2)}</span>
      </div>
      {sep}
      <div className="px-2 h-full flex items-center gap-1">
        <span style={{ color: '#555' }}>Second</span>
        <span>{statusSecond}</span>
      </div>
    </div>
  );
}