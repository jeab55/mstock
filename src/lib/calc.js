import { STOCKCARD, MATERIALS, MTYPES, BRANDS } from '../data/mockData';

/**
 * Compute carry/debit/credit/total for a single mid+branch over a date range.
 */
export function computeMidStock(mid, branchid, date1, date2) {
  const records = STOCKCARD.filter(s => s.mid === mid && s.branchid === branchid);

  let carryd = 0, carryc = 0, debit = 0, credit = 0;
  for (const r of records) {
    if (r.stockdate < date1) {
      carryd += r.debit;
      carryc += r.credit;
    } else if (r.stockdate >= date1 && r.stockdate <= date2) {
      debit  += r.debit;
      credit += r.credit;
    }
  }
  const carry = carryd - carryc;
  return { carry, debit, credit, total: carry + debit - credit };
}

/**
 * Build ListView1 rows: all materials for a given branchid, filtered by typeid if provided.
 */
export function buildLV1Rows(branchid, date1, date2, typeFilter = null, brandFilter = null) {
  let mats = MATERIALS;
  if (typeFilter) mats = mats.filter(m => m.typeid === typeFilter);
  if (brandFilter) mats = mats.filter(m => m.brand === brandFilter);

  return mats.map(m => {
    const { carry, debit, credit, total } = computeMidStock(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, carry, debit, credit, total };
  });
}

/**
 * Build ListView2: bill movements for a mid+branch in date range, grouped by billno prefix.
 */
export function buildLV2Rows(mid, branchid, date1, date2) {
  const records = STOCKCARD.filter(
    s => s.mid === mid && s.branchid === branchid &&
         s.stockdate >= date1 && s.stockdate <= date2
  ).sort((a, b) => a.stockdate.localeCompare(b.stockdate) || a.id - b.id);

  const groups = {};
  const groupOrder = [];
  for (const r of records) {
    const prefix = r.billno.replace(/\d.*/, '').toUpperCase() || 'OTHER';
    if (!groups[prefix]) { groups[prefix] = []; groupOrder.push(prefix); }
    groups[prefix].push(r);
  }

  const rows = [];
  for (const prefix of [...new Set(groupOrder)]) {
    rows.push({ abill: ':' + prefix, billno: '', adate: '', debit: '', credit: '', at: '' });
    let gd = 0, gc = 0;
    for (const r of groups[prefix]) {
      const dateStr = r.stockdate.slice(5).replace('-', '/') + ' ' + (r.ref?.match(/\d{2}:\d{2}/) ? r.ref.match(/\d{2}:\d{2}/)[0] : '');
      rows.push({
        abill: prefix,
        billno: r.billno,
        adate: r.stockdate.slice(5).replace('-', '/'),
        debit: r.debit || '',
        credit: r.credit || '',
        at: r.ref || (r.cost ? String(r.cost.toFixed(7)) : ''),
      });
      gd += r.debit;
      gc += r.credit;
    }
    rows.push({ abill: '-', billno: '', adate: '', debit: gd || '', credit: gc || '', at: '' });
  }
  return rows;
}

/**
 * Build LV1 header/subheader from branch + mid info.
 */
export function buildLV1Header(branchName, mid, date1, date2, stock) {
  const mat = MATERIALS.find(m => m.mid === mid);
  return {
    header: { mid: '+' + branchName, info: mat?.info || '', carry: '', debit: date1.slice(2), credit: date2.slice(2), total: '' },
    subHeader: { mid: '[-', info: mat?.info || '', carry: stock.carry, debit: stock.debit, credit: stock.credit, total: stock.total },
  };
}

/**
 * FIFO lots: newest CR/CT lots first, show remaining balance from oldest.
 */
export function computeFIFOLots(mid, branchid) {
  const all = STOCKCARD.filter(s => s.mid === mid && s.branchid === branchid);
  const totalBalance = all.reduce((a, s) => a + s.debit - s.credit, 0);

  const inRecords = all
    .filter(r => r.debit > 0 && !r.billno.startsWith('CA'))
    .sort((a, b) => b.id - a.id); // newest first

  let cumDebit = 0;
  const lots = [];
  for (let i = 0; i < inRecords.length; i++) {
    const r = inRecords[i];
    const remaining = totalBalance - cumDebit;
    if (remaining <= 0) break;
    const calc = Math.min(r.debit, remaining);
    lots.push({
      lot: String(i + 1),
      billno: r.billno,
      adate: r.stockdate,
      debit: r.debit,
      calc,
      cost: r.cost,
    });
    cumDebit += r.debit;
  }
  return lots;
}

/**
 * Weighted average cost of active FIFO lots.
 */
export function computeAvgPrice(lots) {
  const totalQty   = lots.reduce((a, l) => a + l.calc, 0);
  const totalValue = lots.reduce((a, l) => a + l.cost * l.calc, 0);
  return totalQty > 0 ? totalValue / totalQty : 0;
}

/**
 * Build ListView3: mtype summary for a branch+date range.
 */
export function buildLV3Rows(branchid, date1, date2) {
  const rows = [];
  let grandTotal = 0, grandValue = 0;

  for (const mt of MTYPES) {
    const mats = MATERIALS.filter(m => m.typeid === mt.id);
    let total = 0, value = 0;
    for (const m of mats) {
      const { total: t } = computeMidStock(m.mid, branchid, date1, date2);
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

/**
 * Build ListView4: materials within a mtype for a branch+date range.
 */
export function buildLV4Rows(typeid, branchid, date1, date2) {
  const mats = MATERIALS.filter(m => m.typeid === typeid);
  return mats.map(m => {
    const { total } = computeMidStock(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, total, price: m.cost, value: total * m.cost };
  });
}

/**
 * Build ListView5: brand summary for a branch+date range.
 */
export function buildLV5Rows(branchid, date1, date2) {
  const rows = [];
  let grandTotal = 0, grandValue = 0;

  for (const br of BRANDS) {
    const mats = MATERIALS.filter(m => m.brand === br.id);
    let total = 0, value = 0;
    for (const m of mats) {
      const { total: t } = computeMidStock(m.mid, branchid, date1, date2);
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

/**
 * Build ListView6: materials within a brand for a branch+date range.
 */
export function buildLV6Rows(brandid, branchid, date1, date2) {
  const mats = MATERIALS.filter(m => m.brand === brandid);
  return mats.map(m => {
    const { total } = computeMidStock(m.mid, branchid, date1, date2);
    return { mid: m.mid, info: m.info, total, price: m.cost, value: total * m.cost };
  });
}

export function getMaterial(mid) {
  return MATERIALS.find(m => m.mid === mid) || null;
}