import { create } from 'zustand';
import { BRANCHES } from '../data/mockData';

const DEFAULT_BRANCH = BRANCHES[0].items[0]; // สำนักงานใหญ่

// Default to current month; data is seeded for May 2026
const today = new Date();
const y = today.getFullYear();
const m = today.getMonth(); // 0-indexed
const firstDay = new Date(y, m, 1);
const lastDay  = new Date(y, m + 1, 0);
const fmt = (d) => d.toISOString().slice(0, 10);
// Use May 2026 as default so test data shows immediately
const DEFAULT_FROM = '2026-05-01';
const DEFAULT_TO   = '2026-05-31';

export const useAppStore = create((set, get) => ({
  selectedCompany: 'MMM',
  selectedBranch: DEFAULT_BRANCH,
  dateRange: { from: DEFAULT_FROM, to: DEFAULT_TO },
  selectedMtype: '101',
  selectedMsubtype: null,
  selectedBrand: '501',
  selectedMid: '101006',
  activeTab: 'rakarn',
  modalOpen: null,
  statusSecond: '',

  setCompany: (c) => set({ selectedCompany: c, selectedBranch: DEFAULT_BRANCH }),
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