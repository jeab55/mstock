import React, { useEffect } from 'react';
import Header from '../components/mstock/Header';
import TopFilter from '../components/mstock/TopFilter';
import TabBar from '../components/mstock/TabBar';
import TabRakarn from '../components/mstock/TabRakarn';
import TabChanid from '../components/mstock/TabChanid';
import TabChanidYoi from '../components/mstock/TabChanidYoi';
import TabSheet6 from '../components/mstock/TabSheet6.jsx';
import StatusBar from '../components/mstock/StatusBar';
import ModalFindBrand from '../components/mstock/ModalFindBrand';
import ModalFindBranch from '../components/mstock/ModalFindBranch';
import ModalFindSubtype from '../components/mstock/ModalFindSubtype';
import ModalMidPicker from '../components/mstock/ModalMidPicker';
import ModalFindMids from '../components/mstock/ModalFindMids.jsx';
import ModalFindMidsT6 from '../components/mstock/ModalFindMidsT6.jsx';
import { useAppStore } from '../store/appStore';
import { useBranches } from '../hooks/useStockData';

export default function StockDetail() {
  const { activeTab, setActiveTab, modalOpen, setModalOpen } = useAppStore();

  // Auto-load branches + set default branch on mount
  useBranches();

  // F2 → brand, F3 → subtype, F7 → findmids (rakarn), F8 → findmids-t6 (tabsheet6) or branch
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') { e.preventDefault(); setModalOpen('brand'); }
      if (e.key === 'F3') { e.preventDefault(); setModalOpen('subtype'); }
      if (e.key === 'F7') { e.preventDefault(); setModalOpen('findmids'); }
      if (e.key === 'F8') { e.preventDefault(); setModalOpen(activeTab === 'tabsheet6' ? 'findmidst6' : 'branch'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setModalOpen, activeTab]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-tahoma)', minWidth: '1600px' }}>
      <Header />
      <TopFilter onOpenBranch={() => setModalOpen('branch')} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-400 border-t-0">
        {activeTab === 'rakarn'    && <TabRakarn onOpenBrand={() => setModalOpen('brand')} onOpenMid={() => setModalOpen('mid')} onOpenMsubtype={() => setModalOpen('subtype')} onOpenFindMids={() => setModalOpen('findmids')} />}
        {activeTab === 'chanid'    && <TabChanid />}
        {activeTab === 'chanidyoi' && <TabChanidYoi />}
        {activeTab === 'tabsheet6' && <TabSheet6 onOpenFindMids={() => setModalOpen('findmidst6')} />}
      </div>

      <StatusBar />

      {modalOpen === 'branch' && <ModalFindBranch onClose={() => setModalOpen(null)} />}
      {modalOpen === 'brand'  && <ModalFindBrand  onClose={() => setModalOpen(null)} />}
      {modalOpen === 'subtype' && <ModalFindSubtype onClose={() => setModalOpen(null)} />}
      {modalOpen === 'mid'    && <ModalMidPicker   onClose={() => setModalOpen(null)} />}
      {modalOpen === 'findmids'   && <ModalFindMids     onClose={() => setModalOpen(null)} />}
      {modalOpen === 'findmidst6' && <ModalFindMidsT6   onClose={() => setModalOpen(null)} />}
    </div>
  );
}