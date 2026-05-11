import React, { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const COMPANIES = [
  { id: "MMM", label: "MMM — มั่งมี" },
  { id: "TUR", label: "TUR — ทองอุไร" },
  { id: "MMD", label: "MMD — mmd" },
];

export default function Header() {
  const { selectedCompany, setCompany } = useAppStore();
  const [open, setOpen] = useState(false);

  const handleSelect = (companyId) => {
    setCompany(companyId);   // resets branch + clears mid → all hooks re-fetch automatically
    setOpen(false);
  };

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
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-400 shadow-md z-50 min-w-max">
              {COMPANIES.map(c => (
                <div
                  key={c.id}
                  className={`px-4 py-1.5 text-xs cursor-pointer whitespace-nowrap ${c.id === selectedCompany ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 hover:text-white'}`}
                  onClick={() => handleSelect(c.id)}
                >
                  {c.label}
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