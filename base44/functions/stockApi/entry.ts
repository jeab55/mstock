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
  if (!host || !user || !password || !database) throw new Error(`Missing DB credentials for company: ${c}`);
  pools[c] = mysql.createPool({ host, port, user, password, database, waitForConnections: true, connectionLimit: 5, connectTimeout: 10000 });
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

    const body = await req.json().catch(() => ({}));
    const { action, company, ...params } = body;
    if (!company) return Response.json({ error: 'company required' }, { status: 400 });

    // ── branches — Delphi: FFindbranch, customtype + custombranch ────────────
    // A1: SELECT DISTINCT c.id, c.customtype, COUNT(*) AS SC FROM customtype c
    //     INNER JOIN custombranch b ON c.id = b.customtypeid
    //     WHERE b.activestatus = ? GROUP BY customtype HAVING SC > 0
    // A2: SELECT * FROM custombranch INNER JOIN customtype ON ...
    //     WHERE customcode LIKE ? AND name LIKE ? AND address LIKE ?
    //       AND activestatus = ? AND customtypeid = ?
    if (action === 'branches') {
      const activeOnly = params.activeOnly !== false; // default true
      const activeStatus = activeOnly ? 1 : 0;
      const qCode    = params.qCode    ? `%${params.qCode}%`    : '%';
      const qName    = params.qName    ? `%${params.qName}%`    : '%';
      const qAddress = params.qAddress ? `${params.qAddress}%`  : '%';

      // A1: get groups
      const groups = await query(company, `
        SELECT DISTINCT c.id AS id, c.customtype AS customtype, COUNT(*) AS SC
        FROM customtype c
        INNER JOIN custombranch b ON c.id = b.customtypeid
        WHERE b.activestatus = ?
        GROUP BY c.id, c.customtype
        HAVING SC > 0
        ORDER BY c.id
      `, [activeStatus]);

      // A2: for each group get branches
      const result = [];
      for (const g of groups) {
        const branches = await query(company, `
          SELECT b.customid, b.customcode, b.name, b.address, b.activestatus, b.customtypeid
          FROM custombranch b
          INNER JOIN customtype c ON b.customtypeid = c.id
          WHERE b.customcode LIKE ? AND b.name LIKE ? AND b.address LIKE ?
            AND b.activestatus = ? AND b.customtypeid = ?
          ORDER BY b.customid
        `, [qCode, qName, qAddress, activeStatus, g.id]);

        if (branches.length > 0) {
          result.push({ _group: true, id: g.id, customtype: g.customtype });
          for (const b of branches) {
            result.push({
              id:         b.customid,
              branchcode: b.customcode,
              branchname: b.name,
              address:    b.address || '',
              typeid:     b.customtypeid,
            });
          }
        }
      }
      return Response.json({ rows: result });
    }

    // ── mtypes — Delphi: Fsearch.pas table='mtype', column='typename' ────────
    // SELECT id, typename FROM mtype WHERE typename LIKE '%xxx%' ORDER BY id
    if (action === 'mtypes') {
      const q = params.q || '';
      const rows = await query(company, `
        SELECT id, typename AS name FROM mtype
        WHERE typename LIKE ? ORDER BY id
      `, [`%${q}%`]);
      return Response.json({ rows });
    }

    // ── brands — "ประเภท" picker — filter by typeid if provided ────────────
    // SELECT id, brandname FROM brand WHERE brandname LIKE ? AND (typeid IS NULL OR typeid = ?) ORDER BY id
    if (action === 'brands') {
      const typeid = params.typeid ? Number(params.typeid) : null;
      const q = params.q || '';
      let sql = `SELECT id, brandname AS name FROM brand WHERE brandname LIKE ?`;
      const args = [`%${q}%`];
      if (typeid) {
        sql += ` AND (typeid IS NULL OR typeid = ?)`;
        args.push(typeid);
      }
      sql += ` ORDER BY id`;
      const rows = await query(company, sql, args);
      return Response.json({ rows });
    }

    // ── materials ─────────────────────────────────────────────────────────────
    if (action === 'materials') {
      const { mtype } = params;
      let sql = `SELECT mid, info FROM material WHERE cancelstatus = 0`;
      const args = [];
      if (mtype) { sql += ` AND typeid = ?`; args.push(Number(mtype)); }
      sql += ` ORDER BY mid`;
      const rows = await query(company, sql, args);
      return Response.json({ rows });
    }

    // ── stockcard (LV1) — Delphi exact SQL (filter by mtype.typeid + optional brand.id, or custom mids list) ─────
    if (action === 'stockcard') {
      const { branch, mtype, brand, from: date1, to: date2, mids: customMids } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, from, to required' }, { status: 400 });
      
      const isCustom = Array.isArray(customMids) && customMids.length > 0;
      if (!isCustom && !mtype) return Response.json({ error: 'mtype or mids required' }, { status: 400 });

      const d1time = `${date1} 00:00:00`;
      const d2time = `${date2} 23:59:59`;
      const args = [d1time, d1time, d1time, d2time, d1time, d2time];

      let where = `WHERE a.branchid = ?`;
      args.push(Number(branch));
      
      if (isCustom) {
        // Custom mids filter
        const placeholders = customMids.map(() => '?').join(',');
        where += ` AND a.mid IN (${placeholders})`;
        args.push(...customMids);
      } else {
        // mtype + optional brand filter
        where += ` AND m.typeid = ?`;
        args.push(Number(mtype));
        if (brand) {
          where += ` AND m.brand = ?`;
          args.push(Number(brand));
        }
      }

      const rows = await query(company, `
        SELECT
          t.typename,
          a.mid,
          m.info,
          SUM(IF(a.stockdate < ?, a.debit,  0)) AS carryd,
          SUM(IF(a.stockdate < ?, a.credit, 0)) AS carryc,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.credit, 0)) AS credit_,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.debit,  0)) AS debit_
        FROM stockcard a
        INNER JOIN material m ON a.mid = m.mid
        INNER JOIN mtype t ON t.id = m.typeid
        ${where}
        GROUP BY a.mid, t.typename
        ORDER BY a.mid
      `, args);

      const result = rows.map(r => {
        const carryd = parseFloat(r.carryd)  || 0;
        const carryc = parseFloat(r.carryc)  || 0;
        const debit  = parseFloat(r.debit_)  || 0;
        const credit = parseFloat(r.credit_) || 0;
        const carry  = carryd - carryc;
        const total  = carry + debit - credit;
        return { mid: r.mid, info: r.info, carry, debit, credit, total };
      });
      return Response.json({ rows: result });
    }

    // ── movements (LV2) — Delphi exact SQL + cost, price3 ──────────────────────────────────
    if (action === 'movements') {
    const { branch, mid, brand, branchcode, from: date1, to: date2 } = params;
    if (!branch || !mid || !date1 || !date2) return Response.json({ error: 'branch, mid, from, to required' }, { status: 400 });

    const d1time = `${date1} 00:00:00`;
    const d2time = `${date2} 23:59:59`;
    const args = [d1time, d2time, Number(branch), mid];

    let where = `WHERE a.stockdate BETWEEN ? AND ? AND a.branchid = ? AND a.mid = ?`;
    if (brand) {
      where = `WHERE a.stockdate BETWEEN ? AND ? AND a.branchid = ? AND a.mid = ? AND gm.brand = ?`;
      args.push(Number(brand));
    }

    // cost: fallback COALESCE(NULLIF(stockcard.cost,0), POS.material_{branchcode}.cost, material.cost, 0)
    // — handles OS rows where cost=0 by using branch or global material cost
    // sale_price: POS.material_{branchcode}.price3 (for OS profit calc)
    const rows = await query(company, `
      SELECT
        SUBSTRING(a.billno, 1, 2) AS abill,
        a.billno,
        a.stockdate,
        a.debit,
        a.credit,
        COALESCE(NULLIF(a.cost, 0), pm.cost, gm.cost, 0) AS cost,
        COALESCE(pm.price3, gm.price3, 0) AS sale_price
      FROM stockcard a
      INNER JOIN material gm ON a.mid = gm.mid
      LEFT JOIN ${branchcode ? `POS.material_${branchcode}` : 'material'} pm ON a.mid = pm.mid
      INNER JOIN mtype t ON t.id = gm.typeid
      ${where}
      ORDER BY a.billno, a.stockdate
    `, args);

    return Response.json({ rows });
    }

    // ── lots (LV7 FIFO) — Delphi exact SQL ──────────────────────────────────
    // Uses POS.material_{branchcode} for bal + price3
    // Falls back to material.bal if POS schema unavailable
    if (action === 'lots') {
      const { branch, mid, branchcode } = params;
      if (!branch || !mid) return Response.json({ error: 'branch, mid required' }, { status: 400 });

      // Get salePrice + bal from material (fallback if POS unavailable)
      const matRow = await query(company, `SELECT price3, bal FROM material WHERE mid = ? LIMIT 1`, [mid]);
      const salePrice = parseFloat(matRow[0]?.price3) || 0;
      const bal       = parseFloat(matRow[0]?.bal)    || 0;

      // Try POS.material_{branchcode} for accurate bal + price3
      let posBal = bal;
      let posPrice = salePrice;
      if (branchcode) {
        const posTable = `POS.material_${branchcode}`;
        try {
          const posRows = await query(company, `SELECT bal, price3 FROM ${posTable} WHERE mid = ? LIMIT 1`, [mid]);
          if (posRows[0]) {
            posBal   = parseFloat(posRows[0].bal)    || bal;
            posPrice = parseFloat(posRows[0].price3) || salePrice;
          }
        } catch (_) { /* POS schema not accessible, use fallback */ }
      }

      // Delphi FIFO lot query (window functions)
      // SELECT t.*, t.bal-sumdebit AS valueleft,
      //   CASE WHEN t.bal-sumdebit > 0 THEN t.debit
      //        ELSE t.bal-(sumdebit-t.debit) END AS stockcalc
      // FROM (
      //   SELECT s.id, m.mid, s.billno, s.stockdate, s.cost, m.bal, s.debit,
      //     SUM(s.debit) OVER (ORDER BY s.id DESC) AS sumdebit,
      //     ROW_NUMBER() OVER (ORDER BY s.id DESC) AS lotid
      //   FROM material m INNER JOIN stockcard s ON m.mid=s.mid
      //   WHERE s.debit > 0 AND s.branchid=? AND SUBSTR(billno,1,2)<>'CA' AND s.mid=?
      //   ORDER BY s.id DESC
      // ) AS t
      // WHERE t.bal-(sumdebit-t.debit) > 0
      let lots = [];
      try {
        const lotRows = await query(company, `
          SELECT t.id, t.mid, t.billno, t.stockdate, t.cost, t.bal, t.debit,
                 t.bal - t.sumdebit AS valueleft,
                 CASE WHEN t.bal - t.sumdebit > 0
                      THEN t.debit
                      ELSE t.bal - (t.sumdebit - t.debit)
                 END AS stockcalc,
                 t.lotid
          FROM (
            SELECT s.id, m.mid, s.billno, s.stockdate, s.cost, ? AS bal, s.debit,
                   SUM(s.debit) OVER (ORDER BY s.id DESC) AS sumdebit,
                   ROW_NUMBER() OVER (ORDER BY s.id DESC) AS lotid
            FROM material m
            INNER JOIN stockcard s ON m.mid = s.mid
            WHERE s.debit > 0 AND s.branchid = ?
              AND SUBSTR(s.billno, 1, 2) <> 'CA'
              AND s.mid = ?
          ) AS t
          WHERE t.bal - (t.sumdebit - t.debit) > 0
          ORDER BY t.lotid
        `, [posBal, Number(branch), mid]);

        lots = lotRows.map(r => ({
          lotid:  Number(r.lotid),
          billno: r.billno,
          adate:  r.stockdate,
          debit:  parseFloat(r.debit)      || 0,
          calc:   parseFloat(r.stockcalc)  || 0,
          cost:   parseFloat(r.cost)       || 0,
        }));
      } catch (e) {
        // Fallback: simple debit rows if window functions unavailable
        console.error('lots FIFO error:', e.message);
        const fallback = await query(company, `
          SELECT billno, stockdate, debit, cost FROM stockcard
          WHERE branchid = ? AND mid = ? AND debit > 0
            AND SUBSTR(billno, 1, 2) <> 'CA'
          ORDER BY id DESC LIMIT 20
        `, [Number(branch), mid]);
        lots = fallback.map((r, i) => ({
          lotid:  i + 1,
          billno: r.billno,
          adate:  r.stockdate,
          debit:  parseFloat(r.debit) || 0,
          calc:   parseFloat(r.debit) || 0,
          cost:   parseFloat(r.cost)  || 0,
        }));
      }

      return Response.json({ lots, salePrice: posPrice });
    }

    // ── stockcard_bytype (LV3: sum per mtype) — Delphi BitBtn2Click line 676-695
    // Uses POS.material_{branchcode}.cost for price/totalvalue
    if (action === 'stockcard_bytype') {
      const { branch, branchcode, from: date1, to: date2 } = params;
      if (!branch || !branchcode || !date1 || !date2) return Response.json({ error: 'branch, branchcode, from, to required' }, { status: 400 });
      const branchId = Number(branch);
      const d1time = `${date1} 00:00:00`;
      const d2time = `${date2} 23:59:59`;
      const posTable = `POS.material_${branchcode}`;

      // Delphi SQL (finddetailstock.pas BitBtn2Click lines 676-695)
      // GROUP BY t.id, t.typename — aggregate per mtype using POS cost
      const rows = await query(company, `
        SELECT
          t.id,
          t.typename,
          SUM(IF(a.stockdate < ?, a.debit,  0)) AS carryd,
          SUM(IF(a.stockdate < ?, a.credit, 0)) AS carryc,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.debit,  0)) AS debit_,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.credit, 0)) AS credit_,
          SUM(
            (IF(a.stockdate < ?, a.debit, 0) - IF(a.stockdate < ?, a.credit, 0)
             + IF(a.stockdate BETWEEN ? AND ?, a.debit, 0) - IF(a.stockdate BETWEEN ? AND ?, a.credit, 0))
            * m.cost
          ) AS totalvalue,
          AVG(m.cost) AS lcost
        FROM stockcard a
        INNER JOIN ${posTable} m ON a.mid = m.mid
        INNER JOIN mtype t ON t.id = m.typeid
        WHERE a.branchid = ?
        GROUP BY t.id, t.typename
        ORDER BY t.id
      `, [
        d1time,                                 // carryd IF
        d1time,                                 // carryc IF
        d1time, d2time,                         // debit_ BETWEEN
        d1time, d2time,                         // credit_ BETWEEN
        d1time, d1time,                         // totalvalue carry part
        d1time, d2time, d1time, d2time,         // totalvalue period part
        branchId
      ]);

      let grandQty = 0, grandValue = 0;
      const result = [];
      for (const r of rows) {
        const carryd = parseFloat(r.carryd)     || 0;
        const carryc = parseFloat(r.carryc)     || 0;
        const debit  = parseFloat(r.debit_)     || 0;
        const credit = parseFloat(r.credit_)    || 0;
        const qty    = carryd - carryc + debit - credit;
        const price  = parseFloat(r.lcost)      || 0;
        const value  = parseFloat(r.totalvalue) || 0;
        if (qty !== 0) {
          grandQty   += qty;
          grandValue += value;
          result.push({ id: String(r.id), name: r.typename, total: qty, price, value });
        }
      }
      // -SUM row: qty total, price blank (null → formatNum shows ''), value total
      result.push({ id: '-SUM', name: '', total: grandQty, price: null, value: grandValue });
      return Response.json({ rows: result });
    }

    // ── stockcard_bybrand (LV5: sum per brand using POS for cost, grouped by type) ───────
    if (action === 'stockcard_bybrand') {
      const { branch, branchcode, from: date1, to: date2 } = params;
      if (!branch || !date1 || !date2) return Response.json({ error: 'branch, branchcode, from, to required' }, { status: 400 });
      const branchId = Number(branch);
      const d1time = `${date1} 00:00:00`;
      const d2time = `${date2} 23:59:59`;
      const posTable = `POS.material_${branchcode}`;

      // Get all types
      const types = await query(company, `SELECT id, typename FROM mtype ORDER BY id`);
      
      // Get all brands grouped by type
      const brands = await query(company, `
        SELECT b.id, b.brandname AS name, COALESCE(b.typeid, 0) AS typeid
        FROM brand b
        ORDER BY b.typeid, b.id
      `);

      const rows = await query(company, `
        SELECT m.brand, m.typeid,
          SUM(IF(a.stockdate < ?, a.debit - a.credit, 0)) AS carry,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.debit,  0)) AS debit,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.credit, 0)) AS credit,
          SUM(
            (IF(a.stockdate < ?, a.debit, 0) - IF(a.stockdate < ?, a.credit, 0)
             + IF(a.stockdate BETWEEN ? AND ?, a.debit, 0) - IF(a.stockdate BETWEEN ? AND ?, a.credit, 0))
            * m.cost
          ) AS totalvalue
        FROM stockcard a
        INNER JOIN ${posTable} m ON a.mid = m.mid
        WHERE a.branchid = ?
        GROUP BY m.brand, m.typeid
      `, [
        d1time,
        d1time, d2time,
        d1time, d2time,
        d1time, d1time, d1time, d2time, d1time, d2time,
        branchId
      ]);

      const brandMap = {};
      for (const r of rows) {
        const carry  = parseFloat(r.carry)  || 0;
        const debit  = parseFloat(r.debit)  || 0;
        const credit = parseFloat(r.credit) || 0;
        const total  = carry + debit - credit;
        const value  = parseFloat(r.totalvalue) || 0;
        brandMap[r.brand] = { total, value, typeid: r.typeid };
      }

      let grandTotal = 0, grandValue = 0;
      const result = [];

      // Group by type
      const typeMap = {};
      for (const t of types) typeMap[t.id] = t.typename;

      brands.forEach(br => {
        const typeid = br.typeid || 0;
        const agg = brandMap[br.id] || { total: 0, value: 0 };
        if (agg.total !== 0) {
          const price = agg.total > 0 ? agg.value / agg.total : 0;
          grandTotal += agg.total;
          grandValue += agg.value;
          
          result.push({
            id: String(br.id),
            name: br.name,
            total: agg.total,
            price,
            value: agg.value,
            _typeid: typeid,
            _typename: br.typeid ? typeMap[br.typeid] : '(ไม่มี)'
          });
        }
      });

      result.push({ id: '-SUM', name: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue, _typeid: -1, _typename: '' });
      return Response.json({ rows: result });
    }

    // ── stockcard_bymid_type (LV4) — uses POS.material_{branchcode} ──────────
    if (action === 'stockcard_bymid_type') {
      const { branch, branchcode, mtype, from: date1, to: date2 } = params;
      if (!branch || !branchcode || !mtype || !date1 || !date2) return Response.json({ error: 'branch, branchcode, mtype, from, to required' }, { status: 400 });
      const branchId = Number(branch);
      const d1time = `${date1} 00:00:00`;
      const d2time = `${date2} 23:59:59`;
      const posTable = `POS.material_${branchcode}`;

      const rows = await query(company, `
        SELECT a.mid, m.info, m.cost, m.brand,
          SUM(IF(a.stockdate < ?, a.debit,  0)) AS carryd,
          SUM(IF(a.stockdate < ?, a.credit, 0)) AS carryc,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.debit,  0)) AS debit_,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.credit, 0)) AS credit_,
          SUM(
            (IF(a.stockdate < ?, a.debit, 0) - IF(a.stockdate < ?, a.credit, 0)
             + IF(a.stockdate BETWEEN ? AND ?, a.debit, 0) - IF(a.stockdate BETWEEN ? AND ?, a.credit, 0))
            * m.cost
          ) AS totalvalue
        FROM stockcard a
        INNER JOIN ${posTable} m ON a.mid = m.mid
        WHERE a.branchid = ? AND m.typeid = ?
        GROUP BY a.mid, m.info, m.cost, m.brand
        ORDER BY m.brand, a.mid
      `, [
        d1time, d1time,
        d1time, d2time,
        d1time, d2time,
        d1time, d1time, d1time, d2time, d1time, d2time,
        branchId, Number(mtype)
      ]);

      let grandTotal = 0, grandValue = 0;
      const result = [];
      
      // Get brand names
      const brands = await query(company, `SELECT id, brandname FROM brand ORDER BY id`);
      const brandMap = {};
      for (const b of brands) {
        brandMap[b.id] = b.brandname;
      }
      
      // Group by brand
      const brandGroups = {};
      for (const r of rows) {
        const carryd = parseFloat(r.carryd)     || 0;
        const carryc = parseFloat(r.carryc)     || 0;
        const debit  = parseFloat(r.debit_)     || 0;
        const credit = parseFloat(r.credit_)    || 0;
        const total  = carryd - carryc + debit - credit;
        const price  = parseFloat(r.cost)       || 0;
        const value  = parseFloat(r.totalvalue) || 0;
        
        if (total !== 0) {
          const bid = r.brand || 0;
          if (!brandGroups[bid]) {
            brandGroups[bid] = { name: brandMap[bid] || '(ไม่มี)', rows: [], total: 0, value: 0 };
          }
          brandGroups[bid].rows.push({ mid: r.mid, info: r.info, total, price, value });
          brandGroups[bid].total += total;
          brandGroups[bid].value += value;
          grandTotal += total;
          grandValue += value;
        }
      }
      
      // Build output with group headers and subtotals
      const brandIds = Object.keys(brandGroups).sort((a, b) => Number(a) - Number(b));
      for (const bid of brandIds) {
        const grp = brandGroups[bid];
        
        result.push({
          _isGroupHeader: true,
          id: `_brand_${bid}`,
          mid: grp.name,
          info: '',
          total: '',
          price: '',
          value: ''
        });
        
        for (const row of grp.rows) {
          result.push(row);
        }
        
        result.push({
          _isSubtotal: true,
          id: `-SUM_${bid}`,
          mid: '',
          info: '',
          total: grp.total,
          price: grp.total > 0 ? grp.value / grp.total : 0,
          value: grp.value
        });
      }
      
      // Grand total
      result.push({
        _isSubtotal: true,
        id: '-SUM',
        mid: '',
        info: '',
        total: grandTotal,
        price: grandTotal > 0 ? grandValue / grandTotal : 0,
        value: grandValue
      });
      
      return Response.json({ rows: result });
    }

    // ── stockcard_bymid_brand (LV6) ───────────────────────────────────────────
    if (action === 'stockcard_bymid_brand') {
      const { branch, branchcode, brand, from: date1, to: date2 } = params;
      if (!branch || !brand || !date1 || !date2) return Response.json({ error: 'branch, brand, from, to required' }, { status: 400 });
      const branchId = Number(branch);
      const d1time = `${date1} 00:00:00`;
      const d2time = `${date2} 23:59:59`;
      const posTable = `POS.material_${branchcode}`;

      const rows = await query(company, `
        SELECT a.mid, m.info, m.cost,
          SUM(IF(a.stockdate < ?, a.debit - a.credit, 0)) AS carry,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.debit,  0)) AS debit,
          SUM(IF(a.stockdate BETWEEN ? AND ?, a.credit, 0)) AS credit,
          SUM(
            (IF(a.stockdate < ?, a.debit, 0) - IF(a.stockdate < ?, a.credit, 0)
             + IF(a.stockdate BETWEEN ? AND ?, a.debit, 0) - IF(a.stockdate BETWEEN ? AND ?, a.credit, 0))
            * m.cost
          ) AS totalvalue
        FROM stockcard a
        INNER JOIN ${posTable} m ON a.mid = m.mid
        WHERE a.branchid = ? AND m.brand = ?
        GROUP BY a.mid, m.info, m.cost
        ORDER BY a.mid
      `, [
        d1time,
        d1time, d2time,
        d1time, d2time,
        d1time, d1time, d1time, d2time, d1time, d2time,
        branchId, Number(brand)
      ]);

      let grandTotal = 0, grandValue = 0;
      const result = [];
      for (const r of rows) {
        const carry  = parseFloat(r.carry)  || 0;
        const debit  = parseFloat(r.debit)  || 0;
        const credit = parseFloat(r.credit) || 0;
        const total  = carry + debit - credit;
        const cost   = parseFloat(r.cost)   || 0;
        const value  = parseFloat(r.totalvalue) || 0;
        if (total !== 0) {
          grandTotal += total;
          grandValue += value;
          result.push({ mid: r.mid, info: r.info, total, price: cost, value });
        }
      }
      result.push({ id: '-SUM', mid: '', info: '', total: grandTotal, price: grandTotal > 0 ? grandValue / grandTotal : 0, value: grandValue });
      return Response.json({ rows: result });
    }

    // ── schema (debug) ────────────────────────────────────────────────────────
    if (action === 'schema') {
      const custombranch  = await query(company, `SELECT customid, customcode, name, activestatus, customtypeid FROM custombranch LIMIT 5`).catch(e => ({ err: e.message }));
      const customtype    = await query(company, `SELECT * FROM customtype LIMIT 5`).catch(e => ({ err: e.message }));
      const brandSample   = await query(company, `SELECT id, brandname FROM brand LIMIT 5`).catch(e => ({ err: e.message }));
      const matSample     = await query(company, `SELECT mid, info, typeid, brand, cost, price3, bal FROM material LIMIT 3`).catch(e => ({ err: e.message }));
      const scBranchIds   = await query(company, `SELECT DISTINCT branchid, COUNT(*) as cnt FROM stockcard GROUP BY branchid ORDER BY cnt DESC LIMIT 10`).catch(e => ({ err: e.message }));
      const scSample      = await query(company, `SELECT mid, billno, stockdate, debit, credit, branchid FROM stockcard WHERE debit > 0 LIMIT 5`).catch(e => ({ err: e.message }));
      const brand101mids  = await query(company, `SELECT mid, info FROM material WHERE brand=101 LIMIT 5`).catch(e => ({ err: e.message }));
      return Response.json({ custombranch, customtype, brandSample, matSample, scBranchIds, scSample, brand101mids });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('stockApi error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});