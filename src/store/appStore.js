import { create } from 'zustand';

const DEFAULT_BRANCH = { id: '', code: '', name: 'Loading...', address: '' };

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const fmt = (d) => d.toISOString().slice(0, 10);
const DEFAULT_FROM = fmt(new Date(y, m, 1));
const DEFAULT_TO   = fmt(new Date(y, m + 1, 0));

export const useAppStore = create((set) => ({
  selectedCompany:  'MMM',
  selectedBranch:   DEFAULT_BRANCH,
  dateRange:        { from: DEFAULT_FROM, to: DEFAULT_TO },
  selectedMtype:    '101',   // mtype.id — default เนื้อหมู (=101 in mtype table)
  selectedMid:      null,
  activeTab:        'rakarn',
  modalOpen:        null,
  statusSecond:     '',

  setCompany:        (c)  => set({ selectedCompany: c, selectedBranch: DEFAULT_BRANCH, selectedMid: null }),
  setBranch:         (b)  => set({ selectedBranch: b }),
  setDateRange:      (dr) => set({ dateRange: dr }),
  setSelectedMtype:  (id) => set({ selectedMtype: id, selectedMid: null }),
  setSelectedMid:    (mid)=> set({ selectedMid: mid }),
  setActiveTab:      (tab)=> set({ activeTab: tab }),
  setModalOpen:      (m)  => set({ modalOpen: m }),
  setStatusSecond:   (s)  => set({ statusSecond: s }),
}));