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

    // ใช้ AI ที่มีความเชี่ยวชาญสูงกว่า (Claude Sonnet) แปลคำบรรยายเป็นคำค้นหา
    const keywords = await base44.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `คุณเป็นผู้เชี่ยวชาญด้านสินค้าเกษตร/อาหาร คำบรรยายสินค้า: "${description}"

วิเคราะห์และแปลเป็นคำค้นหาที่เฉพาะเจาะจง:
- ระบุสินค้าหลักที่เกี่ยวข้อง (พืช ผัก ผลไม้ เนื้อ ปลา ฯลฯ)
- รวมชื่อท้องถิ่นและชื่อวิทยาศาสตร์ถ้ารู้
- เพิ่มรูปแบบการขาย (สด แห้ง ดองหรือบดหากเกี่ยวข้อง)

ตัวอย่าง:
- "ผักกินกับน้ำพริก" → ["ผัก", "มะเขือ", "แตง", "อะไร", "มะเขือเทศ", "กะเพรา", "บุ้ง", "ผักช่อม"]
- "ไก่" → ["ไก่", "เนื้อไก่", "ไก่สด", "อกไก่", "ขาไก่"]

ส่งผลลัพธ์เป็น JSON: {"keywords": ["คำค้น1", "คำค้น2", ...]}`,
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
    console.log('[searchProductByDescription]', { description, searchTerms });
    
    // ค้นหาจากฐานข้อมูล: material.info หรือ material.mid ที่ตรงกับคำค้นหา
    let allMids = [];
    for (const term of searchTerms) {
      const trimmed = String(term).trim();
      if (!trimmed) continue;
      
      const q = `%${trimmed}%`;
      const rows = await query(company, `
        SELECT DISTINCT mid, info FROM material 
        WHERE (info LIKE ? OR mid LIKE ?) 
          AND cancelstatus = 0
        LIMIT 20
      `, [q, q]);
      
      allMids = allMids.concat(rows.map(r => r.mid));
      console.log(`  term="${trimmed}" → ${rows.length} results`);
    }

    // ลบซ้ำ และ จำกัด max 50 รายการ
    const uniqueMids = [...new Set(allMids)].slice(0, 50);
    console.log(`[searchProductByDescription] final: ${uniqueMids.length} unique mids`);
    
    return Response.json({ mids: uniqueMids, keywords: searchTerms });
  } catch (error) {
    console.error('searchProductByDescription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});