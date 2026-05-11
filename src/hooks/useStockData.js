/**
 * Central hook for all async stock data.
 * Reads from Zustand store; re-fetches when deps change.
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { toast } from 'sonner';

// ─── useLV1 ──────────────────────────────────────────────────────────────────
// Delphi LV1: stockcard grouped by mid for a mtype+brand(optional)+branch+daterange
export function useLV1() {
  const { selectedCompany, selectedBranch, dateRange, selectedMtype, selectedBrand } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const company  = selectedCompany;
    const branchId = selectedBranch.id;
    const mtype    = selectedMtype;
    const brand    = selectedBrand;
    const from     = dateRange.from;
    const to       = dateRange.to;

    if (!branchId || !mtype) {
      console.log('[useLV1] skip — no branchId or mtype', { branchId, mtype });
      return;
    }

    console.log('[useLV1] fetch →', { company, branchId, mtype, brand, from, to });
    let cancelled = false;
    setLoading(true);

    api.stockcard(company, branchId, mtype, brand, from, to)
      .then(data => {
        if (cancelled) return;
        console.log('[useLV1] got', (data.rows || []).length, 'rows');
        setRows(data.rows || []);
      })
      .catch(e => {
        if (cancelled) return;
        toast.error('โหลด LV1 ล้มเหลว: ' + e.message);
        setRows([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to, selectedMtype, selectedBrand]);

  return { rows, loading };
}

// ─── useLV2 ──────────────────────────────────────────────────────────────────
// Delphi LV2: movements for one mid grouped by Abill (SUBSTR(billno,1,2)) with value calc + subtotals
export function useLV2() {
  const { selectedCompany, selectedBranch, dateRange, selectedMid, selectedBrand } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMid) { setRows([]); setFooterData(null); return; }
    const company    = selectedCompany;
    const branchId   = selectedBranch.id;
    const branchcode = selectedBranch.code;
    const from       = dateRange.from;
    const to         = dateRange.to;
    const mid        = selectedMid;
    const brand      = selectedBrand;

    console.log('[useLV2] fetch →', { company, branchId, mid, from, to });
    let cancelled = false;
    setLoading(true);

    api.movements(company, branchId, branchcode, mid, null, from, to)
      .then(data => {
        if (cancelled) return;
        const moves = data.rows || [];

        // Helper: format time from timestamp (HH:mm)
        const formatTime = (ts) => {
          if (!ts) return '';
          const str = String(ts);
          if (str.length >= 5) {
            const hh = str.substring(11, 13);
            const mm = str.substring(14, 16);
            return `${hh}:${mm}`;
          }
          return '';
        };

        // Helper: calc value by doctype using stockcard.cost
        const calcValue = (row) => {
          const ab = row.abill.toUpperCase();
          const cost = parseFloat(row.row_cost) || 0;  // stockcard.cost
          const salePrice = parseFloat(row.sale_price) || 0;
          const deb = parseFloat(row.debit) || 0;
          const cred = parseFloat(row.credit) || 0;

          // For CR/AP/CT (รับเข้า): มูลค่า = debit × cost
          if (ab === 'CR' || ab === 'AP' || ab === 'CT') return deb * cost;
          // For OS (ขาย): profit = (sale_price - cost) × qty
          if (ab === 'OS') return (salePrice - cost) * cred;
          // For WS (ลดลง): loss = -(cost × qty)
          if (ab === 'WS') return -(cred * cost);
          // Default: use cost
          return (deb - cred) * cost;
        };

        // Group by abill
        const groups = {};
        const order  = [];
        for (const m of moves) {
          const ab = String(m.abill || '').trim().toUpperCase();
          if (!groups[ab]) { groups[ab] = []; order.push(ab); }
          groups[ab].push(m);
        }

        const result = [];
        let totalIncome = 0, totalCost = 0, totalProfit = 0;

        console.log('[useLV2] processing', order.length, 'groups from', moves.length, 'movements');
        for (const ab of order) {
          const g = groups[ab];
          result.push({ _isGroupHeader: true, abill: ':' + ab, billno: '', adate: '', debit: '', credit: '', at: '', value: '' });

          let groupQtyD = 0, groupQtyC = 0, groupValue = 0, groupSaleTotal = 0, groupCostTotal = 0, groupProfitTotal = 0;

          for (const m of g) {
           const adateStr = String(m.stockdate || m.adate || '');
           const dateStr  = adateStr.slice(5, 10).replace('-', '/');
           const timeStr  = adateStr.length > 10 ? adateStr.slice(11, 16) : '';
           const d = parseFloat(m.debit)  || 0;
           const c = parseFloat(m.credit) || 0;
           const cost = parseFloat(m.row_cost) || 0;  // stockcard.cost
           const salePrice = parseFloat(m.sale_price) || 0;

           let value = calcValue(m);
           groupValue += value;

           // Track for OS special subtotal
           if (ab === 'OS') {
             groupSaleTotal += salePrice * c;  // ยอดขาย
             groupCostTotal += cost * c;  // ต้นทุนขาย (cost of goods sold)
             groupProfitTotal += value;  // กำไร
             totalIncome += salePrice * c;
             totalCost += cost * c;
             totalProfit += value;
           } else {
             totalIncome += value;
             if (ab !== 'WS') totalCost += d * cost;
           }

           groupQtyD += d;
           groupQtyC += c;

           result.push({
             _isRow: true,
             abill:  ab,
             billno: m.billno,
             adate:  dateStr + (timeStr ? ' ' + timeStr : ''),
             debit:  d > 0 ? d : '',
             credit: c > 0 ? c : '',
             at:     formatTime(m.T),  // display as HH:mm
             value,
             cost,
             salePrice,
           });
          }

          // Subtotal row
          if (ab === 'OS') {
            result.push({
              _isSubtotal: true,
              abill: '-',
              billno: `ขาย=${groupSaleTotal.toFixed(2)} บาท | ต้นทุน=${groupCostTotal.toFixed(2)} บาท | กำไร=${groupProfitTotal.toFixed(2)} บาท`,
              adate: '',
              debit: groupQtyC,
              credit: '',
              at: '',
              value: groupProfitTotal,
            });
          } else {
            result.push({
              _isSubtotal: true,
              abill: '-',
              billno: '',
              adate: '',
              debit: groupQtyD > 0 ? groupQtyD : (groupQtyC > 0 ? groupQtyC : ''),
              credit: '',
              at: '',
              value: groupValue,
            });
          }
        }

        console.log('[useLV2] result', result.length, 'rows, footerData:', { totalIncome, totalCost, totalProfit });
        setRows(result);
        setFooterData({
          totalIncome,
          totalCost,
          totalProfit,
          roi: totalCost > 0 ? (totalProfit / totalCost * 100) : 0,
        });
      })
      .catch(e => {
        if (cancelled) return;
        console.error('[useLV2] error:', e);
        toast.error('โหลด LV2 ล้มเหลว: ' + e.message);
        setRows([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, dateRange.from, dateRange.to, selectedMid]);

  return { rows, footerData, loading };
}

// ─── useLots ─────────────────────────────────────────────────────────────────
// Delphi FIFO lot grid: POS.material_{branchcode} for bal + price3
export function useLots() {
  const { selectedCompany, selectedBranch, selectedMid } = useAppStore();
  const [lots, setLots]           = useState([]);
  const [salePrice, setSalePrice] = useState(0);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!selectedMid) { setLots([]); setSalePrice(0); return; }
    const company    = selectedCompany;
    const branchId   = selectedBranch.id;
    const branchcode = selectedBranch.code;
    const mid        = selectedMid;

    let cancelled = false;
    setLoading(true);

    api.lots(company, branchId, mid, branchcode)
      .then(data => {
        if (cancelled) return;
        setLots(data.lots || []);
        setSalePrice(data.salePrice || 0);
      })
      .catch(e => {
        if (cancelled) return;
        toast.error('โหลด Lots ล้มเหลว: ' + e.message);
        setLots([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedMid]);

  return { lots, salePrice, loading };
}

// ─── useBranches ─────────────────────────────────────────────────────────────
// Delphi FFindbranch: customtype + custombranch with group headers
export function useBranches(opts = {}) {
  const { selectedCompany, selectedBranch, setBranch } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const company = selectedCompany;
    let cancelled = false;
    setLoading(true);

    api.branches(company, opts)
      .then(data => {
        if (cancelled) return;
        const r = data.rows || [];
        setRows(r);
        // Auto-set default branch: prefer typeid=2 (ร้านค้า), fallback to first real branch
        if (selectedBranch.name === 'Loading...') {
          const shops = r.filter(b => !b._group && b.typeid === 2);
          const first = shops[0] || r.find(b => !b._group);
          if (first) {
            console.log('[useBranches] auto-set branch →', first);
            setBranch({ id: String(first.id), code: first.branchcode, name: first.branchname, address: first.address || '' });
          }
        }
      })
      .catch(e => {
        if (cancelled) return;
        toast.error('โหลดสาขาล้มเหลว: ' + e.message);
        setRows([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCompany]);

  return { rows, loading };
}

// ─── useBrands ────────────────────────────────────────────────────────────────
// "ชนิด" picker — brand table (SELECT id, brandname FROM brand WHERE brandname LIKE ?)
export function useBrands(q = '') {
  const { selectedCompany } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.brands(selectedCompany, q)
      .then(data => { if (!cancelled) setRows(data.rows || []); })
      .catch(e => { if (!cancelled) toast.error('โหลดชนิดสินค้าล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, q]);

  return { rows, loading };
}

// ─── useLV3 (TabChanid left: per-mtype) ──────────────────────────────────────
export function useLV3() {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch.id || !selectedBranch.code) return;
    let cancelled = false;
    setLoading(true);
    api.stockcardByType(selectedCompany, selectedBranch.id, selectedBranch.code, dateRange.from, dateRange.to)
      .then(data => { if (!cancelled) setRows(data.rows || []); })
      .catch(e => { if (!cancelled) toast.error('โหลด LV3 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, dateRange.from, dateRange.to]);

  return { rows, loading };
}

// ─── useLV4 (TabChanid right: per-mid for mtype) ─────────────────────────────
export function useLV4(typeid) {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!typeid || !selectedBranch.id || !selectedBranch.code) { setRows([]); return; }
    let cancelled = false;
    setLoading(true);
    api.stockcardByMidType(selectedCompany, selectedBranch.id, selectedBranch.code, typeid, dateRange.from, dateRange.to)
      .then(data => { if (!cancelled) setRows(data.rows || []); })
      .catch(e => { if (!cancelled) toast.error('โหลด LV4 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, typeid, dateRange.from, dateRange.to]);

  return { rows, loading };
}

// ─── useLV5 (TabChanidYoi left: per-brand) ───────────────────────────────────
export function useLV5() {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch.id) return;
    let cancelled = false;
    setLoading(true);
    api.stockcardByBrand(selectedCompany, selectedBranch.id, dateRange.from, dateRange.to)
      .then(data => { if (!cancelled) setRows(data.rows || []); })
      .catch(e => { if (!cancelled) toast.error('โหลด LV5 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to]);

  return { rows, loading };
}

// ─── useLV6 (TabChanidYoi right: per-mid for brand) ──────────────────────────
export function useLV6(brandid) {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brandid || !selectedBranch.id) { setRows([]); return; }
    let cancelled = false;
    setLoading(true);
    api.stockcardByMidBrand(selectedCompany, selectedBranch.id, brandid, dateRange.from, dateRange.to)
      .then(data => { if (!cancelled) setRows(data.rows || []); })
      .catch(e => { if (!cancelled) toast.error('โหลด LV6 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, brandid, dateRange.from, dateRange.to]);

  return { rows, loading };
}