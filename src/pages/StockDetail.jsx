import React, { useEffect } from 'react';
import Header from '../components/mstock/Header';
import TopFilter from '../components/mstock/TopFilter';
import TabBar from '../components/mstock/TabBar';
import TabRakarn from '../components/mstock/TabRakarn';
import TabChanid from '../components/mstock/TabChanid';
import TabChanidYoi from '../components/mstock/TabChanidYoi';
import TabSheet6 from '../components/mstock/TabSheet6';
import StatusBar from '../components/mstock/StatusBar';
import ModalFindBrand from '../components/mstock/ModalFindBrand';
import ModalFindBranch from '../components/mstock/ModalFindBranch';
import ModalMidPicker from '../components/mstock/ModalMidPicker';
import { useAppStore } from '../store/appStore';
import { useBranches } from '../hooks/useStockData';

export default function StockDetail() {
  const { activeTab, setActiveTab, modalOpen, setModalOpen } = useAppStore();

  // Auto-load branches + set default branch on mount
  useBranches();

  // F8 → open branch modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'F8') { e.preventDefault(); setModalOpen('branch'); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setModalOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-tahoma)', minWidth: '1600px' }}>
      <Header />
      <TopFilter onOpenBranch={() => setModalOpen('branch')} onOpenMsubtype={() => setModalOpen('brand')} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-400 border-t-0">
        {activeTab === 'rakarn'    && <TabRakarn onOpenBrand={() => setModalOpen('brand')} onOpenMid={() => setModalOpen('mid')} />}
        {activeTab === 'chanid'    && <TabChanid />}
        {activeTab === 'chanidyoi' && <TabChanidYoi />}
        {activeTab === 'tabsheet6' && <TabSheet6 />}
      </div>

      <StatusBar />

      {modalOpen === 'branch' && <ModalFindBranch onClose={() => setModalOpen(null)} />}
      {modalOpen === 'brand'  && <ModalFindBrand  onClose={() => setModalOpen(null)} />}
      {modalOpen === 'mid'    && <ModalMidPicker   onClose={() => setModalOpen(null)} />}
    </div>
  );
}