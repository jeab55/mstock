/**
 * Central hook for all async stock data.
 * Replaces mock-data based computations in TabRakarn / StatusBar.
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
        selectedMtype || undefined,
        selectedBrand || undefined,
        dateRange.from,
        dateRange.to
      );
      let r = data.rows || [];
      // filter by subtype prefix if set
      if (selectedMsubtype && selectedMsubtype !== '-SUM') {
        r = r.filter(row => String(row.mid).startsWith(selectedMsubtype));
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
    if (!selectedMid) return;
    setLoading(true);
    try {
      const data = await api.movements(
        selectedCompany, selectedBranch.id, selectedMid, dateRange.from, dateRange.to
      );
      // Build grouped rows same format as buildLV2Rows
      const moves = data.rows || [];
      const DOCTYPES = ['AP','CT','OS','CR','WS','PR'];
      const groups = {};
      for (const m of moves) {
        const dt = m.doctype;
        if (!groups[dt]) groups[dt] = [];
        groups[dt].push(m);
      }
      const result = [];
      for (const doctype of DOCTYPES) {
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
            at:     m.t || m.refinfo || '',
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
    if (!selectedMid) return;
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
      // Auto-update default branch name when first loaded
      if (r.length > 0 && selectedBranch.name === 'Loading...') {
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

// ─── useMsubtypes ────────────────────────────────────────────────────────────
export function useMsubtypes(q = '') {
  const { selectedCompany } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
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