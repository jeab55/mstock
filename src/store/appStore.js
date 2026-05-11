import { create } from 'zustand';

const DEFAULT_BRANCH = { id: '', code: '', name: 'Loading...', address: '' };

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
function fmtLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const DEFAULT_FROM = fmtLocal(new Date(y, m, 1));
const DEFAULT_TO   = fmtLocal(new Date(y, m + 1, 0));

export const useAppStore = create((set) => ({
  selectedCompany:  'MMM',
  selectedBranch:   DEFAULT_BRANCH,
  dateRange:        { from: DEFAULT_FROM, to: DEFAULT_TO },
  selectedMtype:    '101',   // mtype.id — default เนื้อหมู (=101 in mtype table)
  selectedBrand:    null,    // brand.id — optional, filtered by selectedMtype
  selectedMid:      null,
  activeTab:        'rakarn',
  modalOpen:        null,
  statusSecond:     '',

  setCompany:        (c)  => set({ selectedCompany: c, selectedBranch: DEFAULT_BRANCH, selectedMid: null }),
  setBranch:         (b)  => set({ selectedBranch: b }),
  setDateRange:      (dr) => set({ dateRange: dr }),
  setSelectedMtype:  (id) => set({ selectedMtype: id, selectedMid: null, selectedBrand: null }),
  setSelectedBrand:  (id) => set({ selectedBrand: id }),
  setSelectedMid:    (mid)=> set({ selectedMid: mid }),
  setActiveTab:      (tab)=> set({ activeTab: tab }),
  setModalOpen:      (m)  => set({ modalOpen: m }),
  setStatusSecond:   (s)  => set({ statusSecond: s }),
}));