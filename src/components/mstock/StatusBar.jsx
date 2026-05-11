import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useLots } from '../../hooks/useStockData';
import { computeAvgPrice } from '../../lib/calc';

export default function StatusBar() {
  const { statusSecond } = useAppStore();
  const { lots, salePrice } = useLots();
  const avgPrice = useMemo(() => computeAvgPrice(lots), [lots]);

  return (
    <div className="h-[22px] flex items-center text-xs flex-shrink-0 border-t" style={{ background: '#d4d0c8', borderColor: '#808080' }}>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">Lotid:</span>&nbsp;<span>{lots.length}</span>
      </div>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">AvgPrice:</span>&nbsp;<span>{avgPrice.toFixed(2)}</span>
      </div>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">Price:</span>&nbsp;<span>{salePrice.toFixed(2)}</span>
      </div>
      <div className="px-2 h-full flex items-center">
        <span className="text-gray-600">Second:</span>&nbsp;<span>{statusSecond}</span>
      </div>
    </div>
  );
}