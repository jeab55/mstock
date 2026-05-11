/**
 * ModalFindMids — ค้นราคาสินค้าหลายตัว (ใส่ mid หลายตัวคั่นด้วย comma/space/newline)
 */
import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export default function ModalFindMids({ onClose }) {
  const { setCustomMidList } = useAppStore();
  const [input, setInput] = useState('');
  const textareaRef = useRef();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSearch = () => {
    // Parse: split by comma/space/newline, trim, filter empty
    const mids = input
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (mids.length === 0) return;
    
    setCustomMidList(mids);
    onClose();
  };

  const handleClear = () => {
    setInput('');
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleSearch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-[#d4d0c8] border-2 shadow-lg flex flex-col" style={{ width: 480, borderColor: '#808080' }}>
        {/* Title */}
        <div className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0" style={{ background: '#7c8db0' }}>
          <span>ค้นราคา — ใส่รหัสสินค้าหลายตัว</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 flex-1 overflow-auto">
          <div>
            <label className="text-xs text-gray-700 mb-1 block">
              ใส่รหัสสินค้า (mid) คั่นด้วย , (comma) หรือเว้นวรรค หรือขึ้นบรรทัดใหม่
            </label>
            <textarea
              ref={textareaRef}
              className="w-full border border-gray-400 bg-white p-2 text-xs font-mono"
              style={{ height: '100px', resize: 'none' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="101008,101115,101116&#10;หรือ&#10;101008 101115 101116&#10;หรือบรรทัดละตัว"
            />
          </div>

          <div className="text-xs text-gray-600">
            ตัวอย่าง: '101008,101115,101116,403451' หรือ '101008 101115 101116 403451'
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-400 flex-shrink-0" style={{ background: '#f0f0f0' }}>
          <button
            onClick={handleClear}
            className="delphi-btn px-4 py-1 text-xs"
            style={{ background: '#d4d0c8', border: '1px solid #999' }}
          >
            ล้าง
          </button>
          <button
            onClick={handleSearch}
            className="delphi-btn px-4 py-1 text-xs"
            style={{ background: '#7b9fc7', color: '#fff', border: '1px solid #336699' }}
          >
            ค้นหา
          </button>
          <button
            onClick={onClose}
            className="delphi-btn px-4 py-1 text-xs"
            style={{ background: '#d4d0c8', border: '1px solid #999' }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}