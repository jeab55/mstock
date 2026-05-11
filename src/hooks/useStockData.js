/**
 * Central hook for all async stock data.
 * All hooks read from Zustand store and re-fetch when deps change (including company switch).
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { toast } from 'sonner';

// ─── useLV1 ──────────────────────────────────────────────────────────────────
export function useLV1() {
  const { selectedCompany, selectedBranch, dateRange, selectedMtype, selectedMsubtype, selectedBrand } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.stockcard(
        selectedCompany,
        selectedBranch.id,
        selectedMtype  || undefined,
        selectedBrand  || undefined,
        dateRange.from,
        dateRange.to
      );
      let r = data.rows || [];
      // Filter by brand (msubtype) if set and not already filtered server-side
      if (selectedMsubtype && selectedMsubtype !== '-SUM' && !selectedBrand) {
        r = r.filter(row => String(row.mid).startsWith(String(selectedMsubtype).slice(0, 3)));
      }
      setRows(r);
    } catch (e) {
      toast.error('โหลด LV1 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to, selectedMtype, selectedBrand, selectedMsubtype]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

// ─── useLV2 ──────────────────────────────────────────────────────────────────
export function useLV2() {
  const { selectedCompany, selectedBranch, dateRange, selectedMid } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedMid) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await api.movements(
        selectedCompany, selectedBranch.id, selectedMid, dateRange.from, dateRange.to
      );
      // Build grouped rows: section header, data rows, subtotal
      const moves = data.rows || [];
      // Collect all unique doctypes in order of appearance (preserve sort from server)
      const DOCTYPES_ORDER = ['AP','CT','OS','CR','WS','PR','CA','TR'];
      const groups = {};
      for (const m of moves) {
        const dt = m.doctype || 'OT';
        if (!groups[dt]) groups[dt] = [];
        groups[dt].push(m);
      }
      // Also pick up any doctype not in the predefined order
      const seenDoctypes = [...new Set(moves.map(m => m.doctype || 'OT'))];
      const orderedDoctypes = [
        ...DOCTYPES_ORDER.filter(d => groups[d]),
        ...seenDoctypes.filter(d => !DOCTYPES_ORDER.includes(d) && groups[d]),
      ];

      const result = [];
      for (const doctype of orderedDoctypes) {
        const g = groups[doctype];
        if (!g || g.length === 0) continue;
        result.push({ abill: ':' + doctype, billno: '', adate: '', debit: '', credit: '', at: '' });
        let totalD = 0, totalC = 0;
        for (const m of g) {
          const adateStr = String(m.adate);
          const dateStr = adateStr.slice(5, 10).replace('-', '/');
          const timeStr = adateStr.length > 10 ? adateStr.slice(11, 16) : '';
          const d = parseFloat(m.debit)  || 0;
          const c = parseFloat(m.credit) || 0;
          totalD += d; totalC += c;
          result.push({
            abill:  doctype,
            billno: m.billno,
            adate:  dateStr + (timeStr ? ' ' + timeStr : ''),
            debit:  d > 0 ? d : '',
            credit: c > 0 ? c : '',
            at:     m.refinfo || '',
          });
        }
        result.push({ abill: '-', billno: '', adate: '', debit: totalD > 0 ? totalD : '', credit: totalC > 0 ? totalC : '', at: '' });
      }
      setRows(result);
    } catch (e) {
      toast.error('โหลด LV2 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to, selectedMid]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useLots ─────────────────────────────────────────────────────────────────
export function useLots() {
  const { selectedCompany, selectedBranch, selectedMid } = useAppStore();
  const [lots, setLots]           = useState([]);
  const [salePrice, setSalePrice] = useState(0);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async () => {
    if (!selectedMid) { setLots([]); return; }
    setLoading(true);
    try {
      const data = await api.lots(selectedCompany, selectedBranch.id, selectedMid);
      setLots(data.lots || []);
      setSalePrice(data.salePrice || 0);
    } catch (e) {
      toast.error('โหลด Lots ล้มเหลว: ' + e.message);
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, selectedMid]);

  useEffect(() => { load(); }, [load]);
  return { lots, salePrice, loading };
}

// ─── useBranches ─────────────────────────────────────────────────────────────
export function useBranches() {
  const { selectedCompany, selectedBranch, setBranch } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.branches(selectedCompany);
      const r = data.rows || [];
      setRows(r);
      // Auto-set default branch name when loading or after company switch
      if (r.length > 0 && (selectedBranch.name === 'Loading...' || selectedBranch.id === '1')) {
        const first = r[0];
        setBranch({ id: String(first.id), code: String(first.id), name: first.branchname, address: first.address || '' });
      }
    } catch (e) {
      toast.error('โหลดสาขาล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

// ─── useMtypes ───────────────────────────────────────────────────────────────
export function useMtypes(q = '') {
  const { selectedCompany } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.mtypes(selectedCompany, q);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลดชนิดสินค้าล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, q]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useMsubtypes (uses brand table) ─────────────────────────────────────────
export function useMsubtypes(q = '') {
  const { selectedCompany } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // brand table = ชนิดย่อย (msubtype equivalent)
      const data = await api.msubtypes(selectedCompany, q);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลดประเภทสินค้าล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, q]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useLV3 (TabChanid left panel: per-mtype summary) ────────────────────────
export function useLV3() {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.stockcardByType(selectedCompany, selectedBranch.id, dateRange.from, dateRange.to);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลด LV3 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useLV4 (TabChanid right panel: per-material for selected mtype) ─────────
export function useLV4(typeid) {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!typeid) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await api.stockcardByMidType(selectedCompany, selectedBranch.id, typeid, dateRange.from, dateRange.to);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลด LV4 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, typeid, dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useLV5 (TabChanidYoi left panel: per-brand summary) ─────────────────────
export function useLV5() {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.stockcardByBrand(selectedCompany, selectedBranch.id, dateRange.from, dateRange.to);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลด LV5 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}

// ─── useLV6 (TabChanidYoi right panel: per-material for selected brand) ───────
export function useLV6(brandid) {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!brandid) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await api.stockcardByMidBrand(selectedCompany, selectedBranch.id, brandid, dateRange.from, dateRange.to);
      setRows(data.rows || []);
    } catch (e) {
      toast.error('โหลด LV6 ล้มเหลว: ' + e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch.id, brandid, dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading };
}