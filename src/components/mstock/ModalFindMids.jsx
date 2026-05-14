/**
 * ModalFindMids — ค้นราคาสินค้าหลายตัว (ใส่ mid หลายตัวคั่นด้วย comma/space/newline หรือใช้ AI)
 */
import React, { useState, useRef, useEffect } from 'react';
import { X, Wand2, Copy } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ModalFindMids({ onClose }) {
  const { setCustomMidList, selectedCompany } = useAppStore();
  const [input, setInput] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await base44.functions.invoke('searchProductByDescription', {
        company: selectedCompany,
        description: aiQuery
      });
      const mids = res.data?.mids || [];
      const keywords = res.data?.keywords || [];
      
      if (mids.length === 0) {
        toast.warning(`ไม่พบสินค้า (ค้นหา: ${keywords.join(', ')})`);
        return;
      }
      
      setInput(mids.join(', '));
      setAiQuery('');
      toast.success(`พบ ${mids.length} รหัสสินค้า (ค้นหา: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''})`);
    } catch (e) {
      toast.error('AI search ล้มเหลว: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setAiQuery('');
    textareaRef.current?.focus();
  };

  const handleCopy = () => {
    if (!input.trim()) {
      toast.warning('ไม่มีข้อมูลที่จะคัดลอก');
      return;
    }
    navigator.clipboard.writeText(input).then(() => {
      toast.success('คัดลอกแล้ว');
    });
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
          <span>ค้นสินค้า — ใส่รหัสสินค้าหลายตัว</span>
          <button onClick={onClose} className="hover:bg-red-600 px-1"><X className="w-3 h-3" /></button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 flex-1 overflow-auto">
          {/* AI Search */}
          <div>
            <label className="text-xs text-gray-700 mb-1 block font-semibold">🤖 AI ค้นหาสินค้า</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="flex-1 border border-gray-400 bg-white px-2 py-1 text-xs"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                placeholder="เช่น 'ผักกินกับน้ำพริก' หรือ 'ไก่'"
                disabled={aiLoading}
              />
              <button
                onClick={handleAISearch}
                disabled={aiLoading || !aiQuery.trim()}
                className="delphi-btn px-3 py-1 text-xs flex items-center gap-1"
                style={{ background: aiLoading ? '#ccc' : '#7b9fc7', color: '#fff', border: '1px solid #336699' }}
              >
                <Wand2 className="w-3 h-3" />
                {aiLoading ? 'ค้น...' : 'ค้น'}
              </button>
            </div>
          </div>

          {/* Manual input */}
          <div>
            <label className="text-xs text-gray-700 mb-1 block font-semibold">
              หรือใส่รหัสสินค้า (mid) ด้วยมือ
            </label>
            <textarea
              ref={textareaRef}
              className="w-full border border-gray-400 bg-white p-2 text-xs font-mono"
              style={{ height: '80px', resize: 'none' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="101008,101115,101116&#10;หรือ&#10;101008 101115 101116"
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
            onClick={handleCopy}
            disabled={!input.trim()}
            className="delphi-btn px-4 py-1 text-xs flex items-center gap-1"
            style={{ background: input.trim() ? '#d4d0c8' : '#ccc', border: '1px solid #999' }}
            title="คัดลอกรหัสสินค้า"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          <button
            onClick={handleSearch}
            disabled={!input.trim()}
            className="delphi-btn px-4 py-1 text-xs"
            style={{ background: input.trim() ? '#7b9fc7' : '#ccc', color: '#fff', border: '1px solid #336699' }}
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