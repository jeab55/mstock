import React from 'react';

export default function StatusBar({ lotId = "1", avgPrice = "136.00", price = "156.00" }) {
  return (
    <div className="h-[22px] flex items-center text-xs flex-shrink-0 border-t" style={{ background: '#d4d0c8', borderColor: '#808080' }}>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">Lotid:</span>&nbsp;<span>{lotId}</span>
      </div>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">AvgPrice:</span>&nbsp;<span>{avgPrice}</span>
      </div>
      <div className="px-2 border-r border-gray-500 h-full flex items-center">
        <span className="text-gray-600">Price:</span>&nbsp;<span>{price}</span>
      </div>
      <div className="px-2 h-full flex items-center">
        <span className="text-gray-600">Second:</span>
      </div>
    </div>
  );
}