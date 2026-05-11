import { create } from 'zustand';

// Default branch placeholder — will be replaced when branches load from API
// MMM branch_id=1 is สาขา ปตท บ้านไผ่ (first branch)
const DEFAULT_BRANCH = { id: '1', code: '1', name: 'Loading...', address: '' };

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const fmt = (d) => d.toISOString().slice(0, 10);
const DEFAULT_FROM = fmt(new Date(y, m, 1));
const DEFAULT_TO   = fmt(new Date(y, m + 1, 0));

export const useAppStore = create((set, get) => ({
  selectedCompany: 'MMM',
  selectedBranch: DEFAULT_BRANCH,
  dateRange: { from: DEFAULT_FROM, to: DEFAULT_TO },
  selectedMtype: '101',
  selectedMsubtype: null,
  selectedBrand: null,
  selectedMid: null,
  activeTab: 'rakarn',
  modalOpen: null,
  statusSecond: '',

  setCompany: (c) => set({ selectedCompany: c, selectedBranch: DEFAULT_BRANCH, selectedMid: null }),
  setBranch: (b) => set({ selectedBranch: b }),
  setDateRange: (dr) => set({ dateRange: dr }),
  setSelectedMtype: (id) => set({ selectedMtype: id }),
  setSelectedMsubtype: (id) => set({ selectedMsubtype: id }),
  setSelectedBrand: (id) => set({ selectedBrand: id }),
  setSelectedMid: (mid) => set({ selectedMid: mid }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setModalOpen: (m) => set({ modalOpen: m }),
  setStatusSecond: (s) => set({ statusSecond: s }),
}));