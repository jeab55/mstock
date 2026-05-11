import { STOCK_MOVES, STOCK_LOTS, MATERIALS, MTYPES, BRANDS } from '../data/mockData';

// ─── helpers ────────────────────────────────────────────────────────────────
const dateOf = (adate) => adate.slice(0, 10); // "YYYY-MM-DD HH:MM" → "YYYY-MM-DD"

// ─── computeStockCard ────────────────────────────────────────────────────────
/**
 * carry = sum(debit-credit) for all moves where adate < dateFrom
 * debit  = sum(debit)  where dateFrom <= adate <= dateTo
 * credit = sum(credit) where dateFrom <= adate <= dateTo
 * total  = carry + debit - credit
 */
export function computeStockCard(mid, branch_id, dateFrom, dateTo) {
  const moves = STOCK_MOVES.filter(m => m.mid === mid && m.branch_id === branch_id);
  let carry = 0, debit = 0, credit = 0;
  for (const m of moves) {
    const d = dateOf(m.adate);
    if (d < dateFrom) {
      carry += (m.debit - m.credit);
    } else if (d >= dateFrom && d <= dateTo) {
      debit  += m.debit;
      credit += m.credit;
    }
  }
  return { carry, debit, credit, total: carry + debit - credit };
}

// keep backward-compat alias used elsewhere
export const computeMidStock = computeStockCard;

// ─── computeLots ─────────────────────────────────────────────────────────────
/**
 * Returns STOCK_LOTS for mid+branch sorted newest→oldest, with lotid 1..N assigned.
 */
export function computeLots(mid, branch_id) {
  const lots = STOCK_LOTS
    .filter(l => l.mid === mid && l.branch_id === branch_id)
    .sort((a, b) => b.adate.localeCompare(a.adate));
  return lots.map((l, i) => ({ ...l, lotid: i + 1 }));
}

// keep backward-compat alias
export function computeFIFOLots(mid, branch_id) {
  return computeLots(mid, branch_id);
}

// ─── computeAvgPrice ─────────────────────────────────────────────────────────
/** Weighted avg cost of lots where calc > 0 */
export function computeAvgPrice(lots) {
  const active = lots.filter(l => l.calc > 0);
  const totalQty   = active.reduce((a, l) => a + l.calc, 0);
  const totalValue = active.reduce((a, l) => a + l.cost * l.calc, 0);
  return totalQty > 0 ? totalValue / totalQty : 0;
}

// ─── computeCurrentPrice ─────────────────────────────────────────────────────
export function computeCurrentPrice(mid) {
  return MATERIALS.find(m => m.mid === mid)?.sale_price ?? 0;
}

// ─── getMaterial ─────────────────────────────────────────────────────────────
export function getMaterial(mid) {
  return MATERIALS.find(m => m.mid === mid) || null;
}

// ─── computeMovementsByDoctype ───────────────────────────────────────────────
/**
 * Returns moves grouped by doctype, sorted adate asc within each group.
 * Result: { AP: { rows, totalDebit, totalCredit }, CT: {...}, OS: {...}, ... }
 */
export function computeMovementsByDoctype(mid, branch_id, dateFrom, dateTo) {
  const moves = STOCK_MOVES
    .filter(m => {
      const d = dateOf(m.adate);
      return m.mid === mid && m.branch_id === branch_id && d >= dateFrom && d <= dateTo;
    })
    .sort((a, b) => a.adate.localeCompare(b.adate));

  const groups = {};
  for (const m of moves) {
    if (!groups[m.doctype]) groups[m.doctype] = [];
    groups[m.doctype].push(m);
  }

  const result = {};
  for (const [doctype, rows] of Object.entries(groups)) {
    const totalDebit  = rows.reduce((a, r) => a + r.debit,  0);
    const totalCredit = rows.reduce((a, r) => a + r.credit, 0);
    result[doctype] = { rows, totalDebit, totalCredit };
  }
  return result;
}

// ─── buildLV2Rows (replaces old version) ─────────────────────────────────────
/**
 * Build the movement list for the right panel (LV2).
 * Groups: header row (sectionBg), data rows, subtotal row (red nums).
 */
export function buildLV2Rows(mid, branch_id, dateFrom, dateTo) {
  const groups = computeMovementsByDoctype(mid, branch_id, dateFrom, dateTo);
  const DOCTYPES = ['AP','CT','OS','CR','WS','PR'];
  const rows = [];

  for (const doctype of DOCTYPES) {
    const g = groups[doctype];
    if (!g || g.rows.length === 0) continue;

    // section header row — abill starts with ':' → section color
    rows.push({ abill: ':' + doctype, billno: '', adate: '', debit: '', credit: '', at: '' });

    for (const m of g.rows) {
      const timeStr = m.adate.length > 10 ? m.adate.slice(11, 16) : '';
      const dateStr = m.adate.slice(5, 10).replace('-', '/');
      rows.push({
        abill:  doctype,
        billno: m.billno,
        adate:  dateStr + (timeStr ? ' ' + timeStr : ''),
        debit:  m.debit  > 0 ? m.debit  : '',
        credit: m.credit > 0 ? m.credit : '',
        at:     m.t || m.refinfo || '',
      });
    }

    // subtotal row — abill='-' → red numeric cells
    rows.push({
      abill:  '-',
      billno: '',
      adate:  '',
      debit:  g.totalDebit  > 0 ? g.totalDebit  : '',
      credit: g.totalCredit > 0 ? g.totalCredit : '',
      at:     '',
    });
  }
  return rows;
}

// ─── buildLV1Rows ─────────────────────────────────────────────────────────────
export function buildLV1Rows(branchid, date1, date2, typeFilter = null, brandFilter = null) {
  let mats = MATERIALS;
  if (typeFilter) mats = mats.filter(m => m.typeid === typeFilter);
  if (brandFilter) mats = mats.filter(m => m.brand === brandFilter);

  return mats.map(m => {
    const { carry, debit, credit, total } = computeStockCard(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, carry, debit, credit, total };
  });
}

// ─── buildLV3Rows ─────────────────────────────────────────────────────────────
export function buildLV3Rows(branchid, date1, date2) {
  const rows = [];
  let grandTotal = 0, grandValue = 0;
  for (const mt of MTYPES) {
    const mats = MATERIALS.filter(m => m.typeid === mt.id);
    let total = 0, value = 0;
    for (const m of mats) {
      const { total: t } = computeStockCard(m.mid, branchid, date1, date2);
      total += t;
      value += t * m.cost;
    }
    grandTotal += total;
    grandValue += value;
    rows.push({ id: mt.id, name: mt.name, total, price: total > 0 ? value / total : 0, value });
  }
  rows.push({ id: '-SUM', name: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue });
  return rows;
}

// ─── buildLV4Rows ─────────────────────────────────────────────────────────────
export function buildLV4Rows(typeid, branchid, date1, date2) {
  return MATERIALS.filter(m => m.typeid === typeid).map(m => {
    const { total } = computeStockCard(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, total, price: m.cost, value: total * m.cost };
  });
}

// ─── buildLV5Rows ─────────────────────────────────────────────────────────────
export function buildLV5Rows(branchid, date1, date2) {
  const rows = [];
  let grandTotal = 0, grandValue = 0;
  for (const br of BRANDS) {
    const mats = MATERIALS.filter(m => m.brand === br.id);
    let total = 0, value = 0;
    for (const m of mats) {
      const { total: t } = computeStockCard(m.mid, branchid, date1, date2);
      total += t;
      value += t * m.cost;
    }
    grandTotal += total;
    grandValue += value;
    rows.push({ id: br.id, name: br.name, total, price: total > 0 ? value / total : 0, value });
  }
  rows.push({ id: '-SUM', name: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue });
  return rows;
}

// ─── buildLV6Rows ─────────────────────────────────────────────────────────────
export function buildLV6Rows(brandid, branchid, date1, date2) {
  return MATERIALS.filter(m => m.brand === brandid).map(m => {
    const { total } = computeStockCard(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, total, price: m.cost, value: total * m.cost };
  });
}