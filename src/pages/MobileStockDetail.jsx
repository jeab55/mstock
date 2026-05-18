import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useBranches } from '../hooks/useStockData';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileFilterStrip from '../components/mobile/MobileFilterStrip';
import MobileTabBar from '../components/mobile/MobileTabBar';
import MobileTabRakarn from '../components/mobile/MobileTabRakarn';
import MobileTabChanid from '../components/mobile/MobileTabChanid';
import MobileTabChanidYoi from '../components/mobile/MobileTabChanidYoi';
import MobileTabSheet6 from '../components/mobile/MobileTabSheet6';
import MobileFilterModal from '../components/mobile/MobileFilterModal';

export default function MobileStockDetail() {
  const { activeTab, setActiveTab } = useAppStore();
  const [showFilter, setShowFilter] = useState(false);

  useBranches();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0F0F1A] text-white" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <MobileHeader onFilterOpen={() => setShowFilter(true)} />
      <MobileFilterStrip onTap={() => setShowFilter(true)} />

      <div className="flex-1 overflow-hidden">
        {activeTab === 'rakarn'    && <MobileTabRakarn />}
        {activeTab === 'chanid'    && <MobileTabChanid />}
        {activeTab === 'chanidyoi' && <MobileTabChanidYoi />}
        {activeTab === 'tabsheet6' && <MobileTabSheet6 />}
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {showFilter && <MobileFilterModal onClose={() => setShowFilter(false)} />}
    </div>
  );
}