import React, { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const COMPANIES = ["MMM", "TUR", "MMD"];

export default function Header() {
  const { selectedCompany, setCompany } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="h-12 flex items-center justify-between px-3" style={{ background: '#2c2c2c' }}>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-sm tracking-wide">mstock</span>
        <span className="text-gray-400 text-xs">ระบบสต็อกสินค้า</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-3 py-1 text-white text-xs border border-gray-600 rounded-sm hover:bg-gray-700"
          >
            {selectedCompany} <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-400 shadow-md z-50">
              {COMPANIES.map(c => (
                <div
                  key={c}
                  className="px-4 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white"
                  onClick={() => { setCompany(c); setOpen(false); }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </div>
  );
}