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

    // ── schema (debug) ───────────────────────────────────────────────────────
    if (action === 'schema') {
      const mtSample  = await query(company, `SELECT * FROM mtype LIMIT 3`).catch(e => ({ err: e.message }));
      const matSample = await query(company, `SELECT mid, info, typeid, brand, cost, price3 FROM material LIMIT 2`).catch(e => ({ err: e.message }));
      const scSample  = await query(company, `SELECT * FROM stockcard LIMIT 2`).catch(e => ({ err: e.message }));
      const brSample  = await query(company, `SELECT * FROM branch LIMIT 3`).catch(e => ({ err: e.message }));
      const msubCheck = await query(company, `SELECT * FROM msubtype LIMIT 2`).catch(e => ({ err: e.message }));
      return Response.json({ mtSample, matSample, scSample, brSample, msubCheck });
    }

    // ── branches ──────────────────────────────────────────────────────────────
    // Real schema: branch_id (int), branch_name (varchar), address, shop (enum '0'/'1')
    if (action === 'branches') {
      const rows = await query(company, `
        SELECT branch_id as id, branch_name as branchname, address,
               shop, manid
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

    // ── msubtypes ─────────────────────────────────────────────────────────────
    if (action === 'msubtypes') {
      const q = params.q || '';
      // Try msubtype table; column may be subtypename or name
      const rows = await query(company, `
        SELECT id,
               COALESCE(subtypename, name, typename) as name
        FROM msubtype
        WHERE COALESCE(subtypename, name, typename) LIKE ?
        ORDER BY id
      `, [`%${q}%`]).catch(async () => {
        // fallback: use brand table or return empty
        return [];
      });
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
    // Real table: stockcard (mid, billno, stockdate, carry, debit, credit, branchid)
    // carry is pre-computed per row in the DB — we need to calculate period sums
    // Strategy:
    //   carry = SUM(debit - credit) WHERE stockdate < date1 (carry brought forward)
    //   debit  = SUM(debit)  WHERE stockdate BETWEEN date1 AND date2
    //   credit = SUM(credit) WHERE stockdate BETWEEN date1 AND date2
    if (action === 'stockcard') {
      const { branch, mtype, brand, from: date1, to: date2 } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, from, to required' }, { status: 400 });

      // Get materials
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
        SELECT mid,
               SUM(debit) - SUM(credit) as carry
        FROM stockcard
        WHERE branchid = ? AND mid IN (${placeholders})
          AND DATE(stockdate) < ?
        GROUP BY mid
      `, [branchId, ...mids, date1]);
      const carryMap = {};
      for (const r of carryRows) carryMap[r.mid] = parseFloat(r.carry) || 0;

      // period debit/credit
      const periodRows = await query(company, `
        SELECT mid,
               SUM(debit)  as debit,
               SUM(credit) as credit
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

    // ── movements (LV2) ───────────────────────────────────────────────────────
    // stockcard has: billno, stockdate, debit, credit, REF, stocktime
    // doctype derived from billno prefix (OS/CT/AP/CR/WS/PR)
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
          CASE
            WHEN billno LIKE 'AP%' THEN 'AP'
            WHEN billno LIKE 'CT%' THEN 'CT'
            WHEN billno LIKE 'OS%' THEN 'OS'
            WHEN billno LIKE 'CR%' THEN 'CR'
            WHEN billno LIKE 'WS%' THEN 'WS'
            WHEN billno LIKE 'PR%' THEN 'PR'
            ELSE 'OT'
          END as doctype,
          '' as t
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
            ELSE 7
          END,
          stockdate
      `, [Number(branch), mid, date1, date2]);

      return Response.json({ rows });
    }

    // ── lots (LV7) ────────────────────────────────────────────────────────────
    // stockcard stores per-entry rows; "lots" = CT (incoming) rows sorted newest→oldest
    // Use billno LIKE 'CT%' as lot entries
    if (action === 'lots') {
      const { branch, mid } = params;
      if (!branch || !mid) return Response.json({ error: 'branch, mid required' }, { status: 400 });

      const rows = await query(company, `
        SELECT billno, stockdate as adate, debit, credit, cost
        FROM stockcard
        WHERE branchid = ? AND mid = ?
          AND billno LIKE 'CT%'
          AND debit > 0
        ORDER BY stockdate DESC
        LIMIT 20
      `, [Number(branch), mid]);

      // sale_price from material
      const matRows = await query(company, `SELECT price3 FROM material WHERE mid = ? LIMIT 1`, [mid]);
      const salePrice = parseFloat(matRows[0]?.price3) || 0;

      // running calc (remaining in lot) — approximate from debit
      const lots = rows.map((r, i) => ({
        lotid:  i + 1,
        billno: r.billno,
        adate:  r.adate,
        debit:  parseFloat(r.debit)  || 0,
        calc:   parseFloat(r.debit)  || 0, // approximate; full FIFO needs more logic
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