import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import mysql from 'npm:mysql2@3.11.3/promise';

function getPool(company) {
  const c = String(company).toUpperCase();
  const prefix = `DB_${c}`;
  const host     = Deno.env.get(`${prefix}_HOST`);
  const port     = parseInt(Deno.env.get(`${prefix}_PORT`) || '3306');
  const user     = Deno.env.get(`${prefix}_USER`);
  const password = Deno.env.get(`${prefix}_PASS`);
  const database = Deno.env.get(`${prefix}_NAME`);
  if (!host || !user || !password || !database) throw new Error(`Missing DB credentials for company: ${c}`);
  return mysql.createPool({ host, port, user, password, database, waitForConnections: true, connectionLimit: 5, connectTimeout: 10000 });
}

async function query(company, sql, params = []) {
  const pool = getPool(company);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { company, description } = body;

    if (!company || !description) {
      return Response.json({ error: 'company and description required' }, { status: 400 });
    }

    // ใช้ AI แปลคำบรรยายเป็นคำค้นหา (คำหลัก)
    const keywords = await base44.integrations.Core.InvokeLLM({
      prompt: `แปลคำบรรยายสินค้า "${description}" เป็นคำค้นหาหลักๆ ที่ใช้ค้นในฐานข้อมูล
เช่น: "ผักกินกับน้ำพริก" → "ผัก, มะเขือ, แตง, กะเพรา, บุ้งไทย"
ส่งเป็น JSON: {"keywords": ["ผัก", "มะเขือ", "แตง"]}`,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    const searchTerms = keywords.keywords || [description];
    
    // ค้นหาจากฐานข้อมูล: material.info หรือ material.mid ที่ตรงกับคำค้นหา
    let allMids = [];
    for (const term of searchTerms) {
      const q = `%${term}%`;
      const rows = await query(company, `
        SELECT DISTINCT mid FROM material 
        WHERE (info LIKE ? OR mid LIKE ?) 
          AND cancelstatus = 0
        LIMIT 20
      `, [q, q]);
      allMids = allMids.concat(rows.map(r => r.mid));
    }

    // ลบซ้ำ และ จำกัด max 50 รายการ
    const uniqueMids = [...new Set(allMids)].slice(0, 50);
    
    return Response.json({ mids: uniqueMids });
  } catch (error) {
    console.error('searchProductByDescription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});