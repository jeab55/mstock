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
// OR custom mid list if customMidList is set
export function useLV1() {
  const { selectedCompany, selectedBranch, dateRange, selectedMtype, selectedBrand, customMidList } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const company  = selectedCompany;
    const branchId = selectedBranch.id;
    const mtype    = selectedMtype;
    const brand    = selectedBrand;
    const from     = dateRange.from;
    const to       = dateRange.to;

    if (!branchId) {
      console.log('[useLV1] skip — no branchId');
      return;
    }

    // If customMidList is set, use it; otherwise use mtype filter
    if (!customMidList && !mtype) {
      console.log('[useLV1] skip — no mtype or customMidList');
      return;
    }

    const isCustom = !!customMidList;
    console.log('[useLV1] fetch →', { company, branchId, mtype, brand, from, to, customMidList, isCustom });
    let cancelled = false;
    setLoading(true);

    api.stockcard(company, branchId, mtype, brand, from, to, isCustom ? customMidList : null)
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
  }, [selectedCompany, selectedBranch.id, dateRange.from, dateRange.to, selectedMtype, selectedBrand, customMidList]);

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

        // Helper: calc @T (value per unit) by doctype
        const calcUnitValue = (row) => {
          const ab = row.abill.toUpperCase();
          const cost = parseFloat(row.cost) || 0;
          const salePrice = parseFloat(row.sale_price) || 0;

          // For CR/AP/CT/WS/CA: @T = cost (unit cost)
          if (ab === 'CR' || ab === 'AP' || ab === 'CT' || ab === 'WS' || ab === 'CA') return cost;
          // For OS (ขาย): @T = profit per unit = (sale_price - cost)
          if (ab === 'OS') return salePrice - cost;
          // Default: cost
          return cost;
        };

        // Helper: calc total value by doctype
        const calcValue = (row, unitValue) => {
          const ab = row.abill.toUpperCase();
          const deb = parseFloat(row.debit) || 0;
          const cred = parseFloat(row.credit) || 0;

          // For CR/AP/CT: มูลค่า = @T × debit
          if (ab === 'CR' || ab === 'AP' || ab === 'CT') return unitValue * deb;
          // For OS: มูลค่า = @T × credit (profit per unit × qty)
          if (ab === 'OS') return unitValue * cred;
          // For WS: มูลค่า = -(@T × credit)
          if (ab === 'WS') return -(unitValue * cred);
          // Default
          return unitValue * (deb - cred);
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
        let receivedTotal = 0;   // CR+AP+CT total value
        let saleRevenue = 0;     // OS total revenue (credit × sale_price)
        let profitTotal = 0;     // OS total profit

        console.log('[useLV2] processing', order.length, 'groups from', moves.length, 'movements');
        for (const ab of order) {
          const g = groups[ab];
          result.push({ _isGroupHeader: true, abill: ':' + ab, billno: '', adate: '', debit: '', credit: '', salePrice: '', cost: '', profit: '', value: '' });

          let groupQtyD = 0, groupQtyC = 0, groupValue = 0, groupSaleTotal = 0, groupProfitTotal = 0;

          for (const m of g) {
            const adateStr = String(m.stockdate || m.adate || '');
            const dateStr  = adateStr.slice(5, 10).replace('-', '/') + '/' + adateStr.slice(0, 4);
            const d = parseFloat(m.debit)  || 0;
            const c = parseFloat(m.credit) || 0;
            const cost = parseFloat(m.cost) || 0;
            const salePrice = parseFloat(m.sale_price) || 0;
            const profitPerUnit = salePrice - cost;

            let value = 0;
            // Calculate mูลค่ารวม based on doctype
            if (ab === 'CR' || ab === 'AP' || ab === 'CT') {
              value = d * cost;  // debit × cost
              receivedTotal += value;
            } else if (ab === 'OS') {
              value = c * salePrice;  // credit × sale_price
              groupSaleTotal += value;
              groupProfitTotal += c * profitPerUnit;
              saleRevenue += value;
              profitTotal += c * profitPerUnit;
            } else if (ab === 'WS' || ab === 'CA') {
              value = c * cost;  // credit × cost
            } else {
              value = (d - c) * cost;
            }
            groupValue += value;
            groupQtyD += d;
            groupQtyC += c;

            result.push({
              _isRow: true,
              abill:     ab,
              billno:    m.billno,
              adate:     dateStr,
              debit:     d > 0 ? d : '',
              credit:    c > 0 ? c : '',
              salePrice: ab === 'OS' ? salePrice : '',
              cost:      cost,
              profit:    ab === 'OS' ? profitPerUnit : '',
              value:     value,
            });
          }

          // Subtotal row
          result.push({
            _isSubtotal: true,
            abill: '-',
            billno: ab === 'OS' ? `ยอดขาย: ${groupSaleTotal.toFixed(2)} (กำไร: ${groupProfitTotal.toFixed(2)})` : '',
            adate: '',
            debit: groupQtyD > 0 ? groupQtyD : (groupQtyC > 0 ? groupQtyC : ''),
            credit: '',
            salePrice: '',
            cost: '',
            profit: '',
            value: ab === 'OS' ? groupSaleTotal : groupValue,
            _isOSSubtotal: ab === 'OS',
          });
        }

        console.log('[useLV2] result', result.length, 'rows, footerData:', { receivedTotal, saleRevenue, profitTotal });
        setRows(result);
        setFooterData({
          receivedTotal,
          saleRevenue,
          profitTotal,
          roi: saleRevenue > 0 ? (profitTotal / saleRevenue * 100) : 0,
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
      .then(data => {
        if (cancelled) return;
        const rawRows = data.rows || [];
        const processed = rawRows.map(r => 
          r.id === '-SUM' ? { ...r, _isSubtotal: true } : r
        );
        setRows(processed);
      })
      .catch(e => { if (!cancelled) toast.error('โหลด LV4 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, typeid, dateRange.from, dateRange.to]);

  return { rows, loading };
}

// ─── useLV5 (TabChanidYoi left: per-brand grouped by type) ──────────────────
export function useLV5() {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch.id || !selectedBranch.code) return;
    let cancelled = false;
    setLoading(true);
    api.stockcardByBrand(selectedCompany, selectedBranch.id, selectedBranch.code, dateRange.from, dateRange.to)
      .then(data => {
        if (cancelled) return;
        const rawRows = data.rows || [];
        
        // Group by typeid, preserving order
        const grouped = [];
        const seen = new Set();
        let currentTypeId = null;
        
        for (const row of rawRows) {
          const typeid = row._typeid !== undefined ? row._typeid : 0;
          
          // Insert group header if new type
          if (typeid !== currentTypeId && !seen.has(typeid)) {
            grouped.push({
              _isGroupHeader: true,
              id: `_type_${typeid}`,
              name: row._typename || '(ไม่มี)',
              total: '',
              price: '',
              value: '',
              _typeid: typeid
            });
            seen.add(typeid);
            currentTypeId = typeid;
          }
          
          // Add data row or sum row
          if (row.id === '-SUM') {
            grouped.push({ ...row, _isSubtotal: true });
          } else {
            grouped.push(row);
          }
        }
        
        setRows(grouped);
      })
      .catch(e => { if (!cancelled) toast.error('โหลด LV5 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, dateRange.from, dateRange.to]);

  return { rows, loading };
}

// ─── useLV6 (TabChanidYoi right: per-mid for brand) ──────────────────────────
export function useLV6(brandid) {
  const { selectedCompany, selectedBranch, dateRange } = useAppStore();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brandid || !selectedBranch.id || !selectedBranch.code) { setRows([]); return; }
    let cancelled = false;
    setLoading(true);
    api.stockcardByMidBrand(selectedCompany, selectedBranch.id, selectedBranch.code, brandid, dateRange.from, dateRange.to)
      .then(data => {
        if (cancelled) return;
        const rawRows = data.rows || [];
        const processed = rawRows.map(r => 
          r.id === '-SUM' ? { ...r, _isSubtotal: true } : r
        );
        setRows(processed);
      })
      .catch(e => { if (!cancelled) toast.error('โหลด LV6 ล้มเหลว: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany, selectedBranch.id, selectedBranch.code, brandid, dateRange.from, dateRange.to]);

  return { rows, loading };
}