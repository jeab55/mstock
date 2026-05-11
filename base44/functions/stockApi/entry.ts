import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import mysql from 'npm:mysql2@3.11.3/promise';

// ─── Connection pool cache ────────────────────────────────────────────────────
const pools = {};

function getPool(company) {
  const c = String(company).toUpperCase();
  if (pools[c]) return pools[c];

  const prefix = `DB_${c}`;
  const host     = Deno.env.get(`${prefix}_HOST`);
  const port     = parseInt(Deno.env.get(`${prefix}_PORT`) || '3306');
  const user     = Deno.env.get(`${prefix}_USER`);
  const password = Deno.env.get(`${prefix}_PASS`);
  const database = Deno.env.get(`${prefix}_NAME`);

  if (!host || !user || !password || !database) {
    throw new Error(`Missing DB credentials for company: ${c}`);
  }

  pools[c] = mysql.createPool({
    host, port, user, password, database,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 10000,
  });
  return pools[c];
}

async function query(company, sql, params = []) {
  const pool = getPool(company);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, company, ...params } = body;

    if (!company) return Response.json({ error: 'company required' }, { status: 400 });

    // ── schema (debug) ────────────────────────────────────────────────────────
    if (action === 'schema') {
      const mtSample      = await query(company, `SELECT * FROM mtype LIMIT 3`).catch(e => ({ err: e.message }));
      const matSample     = await query(company, `SELECT mid, info, typeid, brand, cost, price3 FROM material LIMIT 2`).catch(e => ({ err: e.message }));
      const scSample      = await query(company, `SELECT * FROM stockcard LIMIT 2`).catch(e => ({ err: e.message }));
      const brSample      = await query(company, `SELECT * FROM branch LIMIT 3`).catch(e => ({ err: e.message }));
      const brandCheck    = await query(company, `SELECT * FROM brand LIMIT 3`).catch(e => ({ err: e.message }));
      const billnoPat     = await query(company, `SELECT DISTINCT LEFT(billno,3) as prefix, COUNT(*) as cnt FROM stockcard WHERE branchid=1 GROUP BY LEFT(billno,3) ORDER BY cnt DESC LIMIT 15`).catch(e => ({ err: e.message }));
      const branch1Sample = await query(company, `SELECT mid, billno, stockdate, debit, credit, branchid, REF FROM stockcard WHERE branchid=1 AND (debit>0 OR credit>0) LIMIT 5`).catch(e => ({ err: e.message }));
      return Response.json({ mtSample, matSample, scSample, brSample, brandCheck, billnoPat, branch1Sample });
    }

    // ── branches ──────────────────────────────────────────────────────────────
    // Real schema: branch_id (int), branch_name (varchar), address
    if (action === 'branches') {
      const rows = await query(company, `
        SELECT branch_id as id, branch_name as branchname, address, shop, manid
        FROM branch
        ORDER BY branch_id
      `);
      return Response.json({ rows });
    }

    // ── mtypes ────────────────────────────────────────────────────────────────
    if (action === 'mtypes') {
      const q = params.q || '';
      const rows = await query(company, `
        SELECT id, typename as name FROM mtype
        WHERE typename LIKE ? ORDER BY orderid, id
      `, [`%${q}%`]);
      return Response.json({ rows });
    }

    // ── brands (ชนิดย่อย / msubtype) ─────────────────────────────────────────
    // The 'brand' table holds sub-categories per mtype.
    // brand.id matches material.brand
    if (action === 'brands') {
      const q      = params.q || '';
      const mtype  = params.mtype;
      let sql = `SELECT id, brandname as name, typeid FROM brand WHERE brandname LIKE ?`;
      const args = [`%${q}%`];
      if (mtype) { sql += ` AND typeid = ?`; args.push(Number(mtype)); }
      sql += ` ORDER BY typeid, id`;
      const rows = await query(company, sql, args);
      return Response.json({ rows });
    }

    // ── msubtypes — alias for brands (backward compat) ────────────────────────
    if (action === 'msubtypes') {
      const q = params.q || '';
      const rows = await query(company, `
        SELECT id, brandname as name, typeid FROM brand
        WHERE brandname LIKE ? ORDER BY typeid, id
      `, [`%${q}%`]);
      return Response.json({ rows });
    }

    // ── materials ─────────────────────────────────────────────────────────────
    if (action === 'materials') {
      const { mtype, brand } = params;
      let sql = `SELECT mid, info, typeid, brand, cost, price3 as sale_price FROM material WHERE cancelstatus = 0`;
      const args = [];
      if (mtype) { sql += ` AND typeid = ?`; args.push(Number(mtype)); }
      if (brand)  { sql += ` AND brand = ?`;  args.push(Number(brand)); }
      sql += ` ORDER BY mid`;
      const rows = await query(company, sql, args);
      return Response.json({ rows });
    }

    // ── stockcard (LV1) ───────────────────────────────────────────────────────
    // carry = SUM(debit-credit) WHERE stockdate < date1  (carry brought forward)
    // debit  = SUM(debit)  WHERE stockdate BETWEEN date1 AND date2
    // credit = SUM(credit) WHERE stockdate BETWEEN date1 AND date2
    if (action === 'stockcard') {
      const { branch, mtype, brand, from: date1, to: date2 } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, from, to required' }, { status: 400 });

      // Get matching materials
      let matSql = `SELECT mid, info FROM material WHERE cancelstatus = 0`;
      const matArgs = [];
      if (mtype) { matSql += ` AND typeid = ?`; matArgs.push(Number(mtype)); }
      if (brand)  { matSql += ` AND brand = ?`;  matArgs.push(Number(brand)); }
      matSql += ` ORDER BY mid`;
      const mats = await query(company, matSql, matArgs);
      if (mats.length === 0) return Response.json({ rows: [] });

      const mids = mats.map(m => m.mid);
      const placeholders = mids.map(() => '?').join(',');
      const branchId = Number(branch);

      // carry before period
      const carryRows = await query(company, `
        SELECT mid, SUM(debit) - SUM(credit) as carry
        FROM stockcard
        WHERE branchid = ? AND mid IN (${placeholders})
          AND DATE(stockdate) < ?
        GROUP BY mid
      `, [branchId, ...mids, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      // period debit/credit
      const periodRows = await query(company, `
        SELECT mid, SUM(debit) as debit, SUM(credit) as credit
        FROM stockcard
        WHERE branchid = ? AND mid IN (${placeholders})
          AND DATE(stockdate) >= ? AND DATE(stockdate) <= ?
        GROUP BY mid
      `, [branchId, ...mids, date1, date2]);
      const periodMap = {};
      for (const r of periodRows) periodMap[r.mid] = { debit: parseFloat(r.debit) || 0, credit: parseFloat(r.credit) || 0 };

      const rows = mats.map(m => {
        const carry  = carryMap[m.mid]  || 0;
        const debit  = periodMap[m.mid]?.debit  || 0;
        const credit = periodMap[m.mid]?.credit || 0;
        return { mid: m.mid, info: m.info, carry, debit, credit, total: carry + debit - credit };
      });
      return Response.json({ rows });
    }

    // ── stockcard_bytype (LV3: sum per mtype) ─────────────────────────────────
    // Returns per-mtype summary: { id, name, total, value, price(avg_cost) }
    if (action === 'stockcard_bytype') {
      const { branch, from: date1, to: date2 } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, from, to required' }, { status: 400 });
      const branchId = Number(branch);

      // Get all mtypes
      const mtypes = await query(company, `SELECT id, typename as name FROM mtype ORDER BY orderid, id`);

      // carry before period per (mid)
      const carryRows = await query(company, `
        SELECT sc.mid, SUM(sc.debit) - SUM(sc.credit) as carry
        FROM stockcard sc
        WHERE sc.branchid = ? AND DATE(sc.stockdate) < ?
        GROUP BY sc.mid
      `, [branchId, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      // period debit/credit per mid
      const periodRows = await query(company, `
        SELECT sc.mid, SUM(sc.debit) as debit, SUM(sc.credit) as credit
        FROM stockcard sc
        WHERE sc.branchid = ? AND DATE(sc.stockdate) >= ? AND DATE(sc.stockdate) <= ?
        GROUP BY sc.mid
      `, [branchId, date1, date2]);
      const periodMap = {};
      for (const r of periodRows) periodMap[r.mid] = { debit: parseFloat(r.debit) || 0, credit: parseFloat(r.credit) || 0 };

      // Get materials with cost
      const mats = await query(company, `SELECT mid, typeid, cost FROM material WHERE cancelstatus = 0`);
      const matMap = {};
      for (const m of mats) matMap[m.mid] = { typeid: m.typeid, cost: parseFloat(m.cost) || 0 };

      // Aggregate per mtype
      const typeAgg = {};
      for (const m of mats) {
        const carry  = carryMap[m.mid]  || 0;
        const debit  = periodMap[m.mid]?.debit  || 0;
        const credit = periodMap[m.mid]?.credit || 0;
        const total  = carry + debit - credit;
        const value  = total * (parseFloat(m.cost) || 0);
        const tid = m.typeid;
        if (!typeAgg[tid]) typeAgg[tid] = { total: 0, value: 0 };
        typeAgg[tid].total += total;
        typeAgg[tid].value += value;
      }

      let grandTotal = 0, grandValue = 0;
      const rows = mtypes.map(mt => {
        const agg = typeAgg[mt.id] || { total: 0, value: 0 };
        grandTotal += agg.total;
        grandValue += agg.value;
        return {
          id: String(mt.id),
          name: mt.name,
          total: agg.total,
          price: agg.total > 0 ? agg.value / agg.total : 0,
          value: agg.value,
        };
      });
      rows.push({ id: '-SUM', name: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue });
      return Response.json({ rows });
    }

    // ── stockcard_bybrand (LV5: sum per brand) ────────────────────────────────
    // Returns per-brand summary: { id, name, total, value, price(avg_cost) }
    if (action === 'stockcard_bybrand') {
      const { branch, from: date1, to: date2 } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, from, to required' }, { status: 400 });
      const branchId = Number(branch);

      // Get all brands
      const brands = await query(company, `SELECT id, brandname as name, typeid FROM brand ORDER BY typeid, id`);

      // carry per mid
      const carryRows = await query(company, `
        SELECT mid, SUM(debit) - SUM(credit) as carry
        FROM stockcard
        WHERE branchid = ? AND DATE(stockdate) < ?
        GROUP BY mid
      `, [branchId, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      // period per mid
      const periodRows = await query(company, `
        SELECT mid, SUM(debit) as debit, SUM(credit) as credit
        FROM stockcard
        WHERE branchid = ? AND DATE(stockdate) >= ? AND DATE(stockdate) <= ?
        GROUP BY mid
      `, [branchId, date1, date2]);
      const periodMap = {};
      for (const r of periodRows) periodMap[r.mid] = { debit: parseFloat(r.debit) || 0, credit: parseFloat(r.credit) || 0 };

      // materials
      const mats = await query(company, `SELECT mid, brand, cost FROM material WHERE cancelstatus = 0`);

      // Aggregate per brand
      const brandAgg = {};
      for (const m of mats) {
        const carry  = carryMap[m.mid]  || 0;
        const debit  = periodMap[m.mid]?.debit  || 0;
        const credit = periodMap[m.mid]?.credit || 0;
        const total  = carry + debit - credit;
        const value  = total * (parseFloat(m.cost) || 0);
        const bid = m.brand;
        if (!brandAgg[bid]) brandAgg[bid] = { total: 0, value: 0 };
        brandAgg[bid].total += total;
        brandAgg[bid].value += value;
      }

      let grandTotal = 0, grandValue = 0;
      const rows = brands.map(br => {
        const agg = brandAgg[br.id] || { total: 0, value: 0 };
        grandTotal += agg.total;
        grandValue += agg.value;
        return {
          id: String(br.id),
          name: br.name,
          total: agg.total,
          price: agg.total > 0 ? agg.value / agg.total : 0,
          value: agg.value,
        };
      });
      rows.push({ id: '-SUM', name: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue });
      return Response.json({ rows });
    }

    // ── stockcard_bymid_type (LV4: materials for one mtype) ──────────────────
    if (action === 'stockcard_bymid_type') {
      const { branch, mtype, from: date1, to: date2 } = params;
      if (!branch || !mtype || !date1 || !date2) return Response.json({ error: 'branch, mtype, from, to required' }, { status: 400 });
      const branchId = Number(branch);

      const mats = await query(company, `SELECT mid, info, cost FROM material WHERE cancelstatus = 0 AND typeid = ? ORDER BY mid`, [Number(mtype)]);
      if (mats.length === 0) return Response.json({ rows: [] });
      const mids = mats.map(m => m.mid);
      const placeholders = mids.map(() => '?').join(',');

      const carryRows = await query(company, `SELECT mid, SUM(debit)-SUM(credit) as carry FROM stockcard WHERE branchid=? AND mid IN (${placeholders}) AND DATE(stockdate)<? GROUP BY mid`, [branchId, ...mids, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      const periodRows = await query(company, `SELECT mid, SUM(debit) as debit, SUM(credit) as credit FROM stockcard WHERE branchid=? AND mid IN (${placeholders}) AND DATE(stockdate)>=? AND DATE(stockdate)<=? GROUP BY mid`, [branchId, ...mids, date1, date2]);
      const periodMap = {};
      for (const r of periodRows) periodMap[r.mid] = { debit: parseFloat(r.debit) || 0, credit: parseFloat(r.credit) || 0 };

      const rows = mats.map(m => {
        const carry  = carryMap[m.mid]  || 0;
        const debit  = periodMap[m.mid]?.debit  || 0;
        const credit = periodMap[m.mid]?.credit || 0;
        const total  = carry + debit - credit;
        const cost   = parseFloat(m.cost) || 0;
        return { mid: m.mid, info: m.info, total, price: cost, value: total * cost };
      });
      return Response.json({ rows });
    }

    // ── stockcard_bymid_brand (LV6: materials for one brand) ─────────────────
    if (action === 'stockcard_bymid_brand') {
      const { branch, brand, from: date1, to: date2 } = params;
      if (!branch || !brand || !date1 || !date2) return Response.json({ error: 'branch, brand, from, to required' }, { status: 400 });
      const branchId = Number(branch);

      const mats = await query(company, `SELECT mid, info, cost FROM material WHERE cancelstatus = 0 AND brand = ? ORDER BY mid`, [Number(brand)]);
      if (mats.length === 0) return Response.json({ rows: [] });
      const mids = mats.map(m => m.mid);
      const placeholders = mids.map(() => '?').join(',');

      const carryRows = await query(company, `SELECT mid, SUM(debit)-SUM(credit) as carry FROM stockcard WHERE branchid=? AND mid IN (${placeholders}) AND DATE(stockdate)<? GROUP BY mid`, [branchId, ...mids, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      const periodRows = await query(company, `SELECT mid, SUM(debit) as debit, SUM(credit) as credit FROM stockcard WHERE branchid=? AND mid IN (${placeholders}) AND DATE(stockdate)>=? AND DATE(stockdate)<=? GROUP BY mid`, [branchId, ...mids, date1, date2]);
      const periodMap = {};
      for (const r of periodRows) periodMap[r.mid] = { debit: parseFloat(r.debit) || 0, credit: parseFloat(r.credit) || 0 };

      const rows = mats.map(m => {
        const carry  = carryMap[m.mid]  || 0;
        const debit  = periodMap[m.mid]?.debit  || 0;
        const credit = periodMap[m.mid]?.credit || 0;
        const total  = carry + debit - credit;
        const cost   = parseFloat(m.cost) || 0;
        return { mid: m.mid, info: m.info, total, price: cost, value: total * cost };
      });
      return Response.json({ rows });
    }

    // ── movements (LV2) ───────────────────────────────────────────────────────
    // Real billno format: OS16260..., CT16260..., AP16260..., CA (carry-adj), etc.
    // Derive doctype from billno prefix (2-char alpha prefix)
    if (action === 'movements') {
      const { branch, mid, from: date1, to: date2 } = params;
      if (!branch || !mid || !date1 || !date2) return Response.json({ error: 'branch, mid, from, to required' }, { status: 400 });

      const rows = await query(company, `
        SELECT
          billno,
          stockdate as adate,
          debit,
          credit,
          REF as refinfo,
          cost,
          CASE
            WHEN billno LIKE 'AP%' THEN 'AP'
            WHEN billno LIKE 'CT%' THEN 'CT'
            WHEN billno LIKE 'OS%' THEN 'OS'
            WHEN billno LIKE 'CR%' THEN 'CR'
            WHEN billno LIKE 'WS%' THEN 'WS'
            WHEN billno LIKE 'PR%' THEN 'PR'
            WHEN billno LIKE 'CA%' THEN 'CA'
            WHEN billno LIKE 'TR%' THEN 'TR'
            ELSE LEFT(TRIM(billno), 2)
          END as doctype
        FROM stockcard
        WHERE branchid = ? AND mid = ?
          AND DATE(stockdate) >= ? AND DATE(stockdate) <= ?
        ORDER BY
          CASE
            WHEN billno LIKE 'AP%' THEN 1
            WHEN billno LIKE 'CT%' THEN 2
            WHEN billno LIKE 'OS%' THEN 3
            WHEN billno LIKE 'CR%' THEN 4
            WHEN billno LIKE 'WS%' THEN 5
            WHEN billno LIKE 'PR%' THEN 6
            WHEN billno LIKE 'CA%' THEN 7
            WHEN billno LIKE 'TR%' THEN 8
            ELSE 9
          END,
          stockdate
      `, [Number(branch), mid, date1, date2]);

      return Response.json({ rows });
    }

    // ── lots (LV7) ────────────────────────────────────────────────────────────
    // "Lots" = CT (incoming) rows ordered newest→oldest.
    // If no CT rows, fallback to any debit rows (CA carry entries etc.)
    if (action === 'lots') {
      const { branch, mid } = params;
      if (!branch || !mid) return Response.json({ error: 'branch, mid required' }, { status: 400 });

      // Try CT prefix first
      let rows = await query(company, `
        SELECT billno, stockdate as adate, debit, credit, cost
        FROM stockcard
        WHERE branchid = ? AND mid = ?
          AND billno LIKE 'CT%'
          AND debit > 0
        ORDER BY stockdate DESC
        LIMIT 20
      `, [Number(branch), mid]);

      // Fallback: any debit rows if no CT found
      if (rows.length === 0) {
        rows = await query(company, `
          SELECT billno, stockdate as adate, debit, credit, cost
          FROM stockcard
          WHERE branchid = ? AND mid = ?
            AND debit > 0
          ORDER BY stockdate DESC
          LIMIT 20
        `, [Number(branch), mid]);
      }

      // sale_price from material
      const matRows = await query(company, `SELECT price3 FROM material WHERE mid = ? LIMIT 1`, [mid]);
      const salePrice = parseFloat(matRows[0]?.price3) || 0;

      // running calc (remaining in each lot) — approximate from debit
      const lots = rows.map((r, i) => ({
        lotid:  i + 1,
        billno: r.billno,
        adate:  r.adate,
        debit:  parseFloat(r.debit)  || 0,
        calc:   parseFloat(r.debit)  || 0,
        cost:   parseFloat(r.cost)   || 0,
      }));

      return Response.json({ lots, salePrice });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('stockApi error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});