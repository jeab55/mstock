import React, { useMemo } from 'react';
import Header from '../components/mstock/Header';
import TopFilter from '../components/mstock/TopFilter';
import TabBar from '../components/mstock/TabBar';
import TabRakarn from '../components/mstock/TabRakarn';
import TabChanid from '../components/mstock/TabChanid';
import TabChanidYoi from '../components/mstock/TabChanidYoi';
import TabSheet6 from '../components/mstock/TabSheet6';
import StatusBar from '../components/mstock/StatusBar';
import ModalPicker from '../components/mstock/ModalPicker';
import ModalFindType from '../components/mstock/ModalFindType';
import { useAppStore } from '../store/appStore';
import { BRANCHES, MTYPES, BRANDS, MATERIALS } from '../data/mockData';

// Flatten branches for modal
function flattenBranches() {
  const rows = [];
  BRANCHES.forEach(section => {
    rows.push({ _section: section.section });
    section.items.forEach(item => rows.push(item));
  });
  return rows;
}

const BRANCH_COLS = [
  { key: 'rowid',   label: 'id',       width: 40 },
  { key: 'id',      label: 'รหัสสาขา', width: 70 },
  { key: 'name',    label: 'สาขา',     width: 200 },
  { key: 'address', label: 'ที่อยู่',   width: 290 },
];
const TYPE_COLS = [
  { key: 'id',   label: 'id',       width: 80 },
  { key: 'name', label: 'typename', width: 300 },
];
const BRAND_COLS = [
  { key: 'id',   label: 'id',        width: 80 },
  { key: 'name', label: 'brandname', width: 350 },
];
const MID_COLS = [
  { key: 'mid',  label: 'mid',  width: 80 },
  { key: 'info', label: 'info', width: 300 },
];

export default function StockDetail() {
  const { activeTab, setActiveTab, modalOpen, setModalOpen, setBranch, setSelectedMtype, setSelectedBrand, setSelectedMid } = useAppStore();
  const branchRows = useMemo(() => flattenBranches(), []);
  const midRows    = useMemo(() => MATERIALS.map(m => ({ mid: m.mid, info: m.info })), []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-tahoma)' }}>
      <Header />
      <TopFilter onOpenBranch={() => setModalOpen('branch')} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-400 border-t-0">
        {activeTab === 'rakarn'    && <TabRakarn    onOpenType={() => setModalOpen('type')} onOpenBrand={() => setModalOpen('brand')} onOpenMid={() => setModalOpen('mid')} />}
        {activeTab === 'chanid'    && <TabChanid />}
        {activeTab === 'chanidyoi' && <TabChanidYoi />}
        {activeTab === 'tabsheet6' && <TabSheet6 />}
      </div>

      <StatusBar />

      {/* Modals */}
      {modalOpen === 'branch' && (
        <ModalPicker
          title="FFindbranch"
          columns={BRANCH_COLS}
          rows={branchRows}
          searchKey="name"
          onSelect={(row) => { setBranch(row); setModalOpen(null); }}
          onClose={() => setModalOpen(null)}
        />
      )}
      {modalOpen === 'type' && (
        <ModalFindType onClose={() => setModalOpen(null)} />
      )}
      {modalOpen === 'brand' && (
        <ModalPicker
          title="Fsearch — ประเภท"
          columns={BRAND_COLS}
          rows={BRANDS}
          searchKey="name"
          onSelect={(row) => { setSelectedBrand(row.id); setModalOpen(null); }}
          onClose={() => setModalOpen(null)}
          sqlHint="select id ,brandname from brand where brandname like '%%'"
        />
      )}
      {modalOpen === 'mid' && (
        <ModalPicker
          title="Fsearch — รหัสสินค้า"
          columns={MID_COLS}
          rows={midRows}
          searchKey="info"
          onSelect={(row) => { setSelectedMid(row.mid); setModalOpen(null); }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  );
}