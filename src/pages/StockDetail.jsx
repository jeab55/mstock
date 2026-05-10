import React, { useState, useMemo } from 'react';
import Header from '../components/mstock/Header';
import TopFilter from '../components/mstock/TopFilter';
import TabBar from '../components/mstock/TabBar';
import TabRakarn from '../components/mstock/TabRakarn';
import TabChanid from '../components/mstock/TabChanid';
import TabChanidYoi from '../components/mstock/TabChanidYoi';
import TabSheet6 from '../components/mstock/TabSheet6';
import StatusBar from '../components/mstock/StatusBar';
import ModalPicker from '../components/mstock/ModalPicker';
import { BRANCHES, MTYPES, BRANDS, LISTVIEW1_ITEMS } from '../data/mockData';

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
  { key: 'rowid', label: 'id', width: 40 },
  { key: 'id', label: 'รหัสสาขา', width: 70 },
  { key: 'name', label: 'สาขา', width: 200 },
  { key: 'address', label: 'ที่อยู่', width: 290 },
];

const TYPE_COLS = [
  { key: 'id', label: 'id', width: 80 },
  { key: 'name', label: 'typename', width: 300 },
];

const BRAND_COLS = [
  { key: 'id', label: 'id', width: 80 },
  { key: 'name', label: 'brandname', width: 350 },
];

const MID_COLS = [
  { key: 'mid', label: 'mid', width: 80 },
  { key: 'info', label: 'info', width: 300 },
];

export default function StockDetail() {
  const [activeTab, setActiveTab] = useState('rakarn');
  const [branch, setBranch] = useState('สำนักงานใหญ่');
  const [modal, setModal] = useState(null); // 'branch' | 'type' | 'brand' | 'mid' | null

  const branchRows = useMemo(() => flattenBranches(), []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-tahoma)' }}>
      <Header />
      <TopFilter branch={branch} onOpenBranch={() => setModal('branch')} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-400 border-t-0">
        {activeTab === 'rakarn' && (
          <TabRakarn
            onOpenType={() => setModal('type')}
            onOpenBrand={() => setModal('brand')}
            onOpenMid={() => setModal('mid')}
          />
        )}
        {activeTab === 'chanid' && <TabChanid />}
        {activeTab === 'chanidyoi' && <TabChanidYoi />}
        {activeTab === 'tabsheet6' && <TabSheet6 />}
      </div>

      <StatusBar />

      {/* Modals */}
      {modal === 'branch' && (
        <ModalPicker
          title="FFindbranch"
          columns={BRANCH_COLS}
          rows={branchRows}
          onSelect={(row) => setBranch(row.name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'type' && (
        <ModalPicker
          title="Fsearch"
          columns={TYPE_COLS}
          rows={MTYPES}
          onSelect={() => {}}
          onClose={() => setModal(null)}
          sqlHint="select id ,typename from mtype where typename like '%%'"
        />
      )}
      {modal === 'brand' && (
        <ModalPicker
          title="Fsearch"
          columns={BRAND_COLS}
          rows={BRANDS}
          onSelect={() => {}}
          onClose={() => setModal(null)}
          sqlHint="select id ,brandname from brand where brandname like '%%'"
        />
      )}
      {modal === 'mid' && (
        <ModalPicker
          title="Fsearch"
          columns={MID_COLS}
          rows={LISTVIEW1_ITEMS}
          onSelect={() => {}}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}