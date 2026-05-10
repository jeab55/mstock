import React from 'react';
import { FolderOpen, ChevronLeft, ChevronRight, Equal } from 'lucide-react';

export default function TopFilter({ branch, onOpenBranch }) {
  return (
    <div className="h-11 flex items-center gap-1 px-2 flex-shrink-0 overflow-x-auto" style={{ background: '#F9CBAC' }}>
      {/* Branch label */}
      <div
        className="px-2 py-0.5 text-xs border border-gray-400 min-w-[140px] truncate"
        style={{ background: '#FFFFE1' }}
      >
        {branch}
      </div>
      {/* Branch button */}
      <button
        onClick={onOpenBranch}
        className="delphi-btn flex items-center gap-1 text-xs px-2 py-0.5"
        style={{ background: '#c0dcc0' }}
      >
        <FolderOpen className="w-3 h-3" /> สาขา
      </button>

      <div className="w-px h-6 bg-gray-500 mx-1" />

      {/* สัปดาห์ */}
      <span className="text-xs whitespace-nowrap">สัปดาห์</span>
      <button className="delphi-btn px-1"><ChevronLeft className="w-3 h-3" /></button>
      <input type="number" defaultValue={19} className="w-10 text-xs text-center border border-gray-400 bg-white px-1" />
      <button className="delphi-btn px-1"><ChevronRight className="w-3 h-3" /></button>

      {/* เดือน */}
      <span className="text-xs ml-1 whitespace-nowrap">เดือน</span>
      <select className="text-xs border border-gray-400 bg-white px-1 py-0.5">
        <option>มกราคม</option><option>กุมภาพันธ์</option><option>มีนาคม</option>
        <option>เมษายน</option><option selected>พฤษภาคม</option><option>มิถุนายน</option>
        <option>กรกฎาคม</option><option>สิงหาคม</option><option>กันยายน</option>
        <option>ตุลาคม</option><option>พฤศจิกายน</option><option>ธันวาคม</option>
      </select>

      {/* ปี */}
      <span className="text-xs ml-1 whitespace-nowrap">ปี</span>
      <select className="text-xs border border-gray-400 bg-white px-1 py-0.5">
        <option>2025</option><option selected>2026</option><option>2027</option>
      </select>

      <div className="w-px h-6 bg-gray-500 mx-1" />

      {/* วันที่ */}
      <span className="text-xs whitespace-nowrap">วันที่</span>
      <input type="text" defaultValue="01/05/2569" className="w-[85px] text-xs border border-gray-400 bg-white px-1 text-center" />
      <span className="text-xs whitespace-nowrap">ถึง</span>
      <input type="text" defaultValue="31/05/2569" className="w-[85px] text-xs border border-gray-400 bg-white px-1 text-center" />

      {/* nav buttons */}
      <button className="delphi-btn px-1"><ChevronLeft className="w-3 h-3" /></button>
      <button className="delphi-btn px-1"><ChevronRight className="w-3 h-3" /></button>
      <button className="delphi-btn px-1"><Equal className="w-3 h-3" /></button>
    </div>
  );
}