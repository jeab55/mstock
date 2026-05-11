import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { company, description } = body;

    if (!company || !description) {
      return Response.json({ error: 'company and description required' }, { status: 400 });
    }

    // Use LLM to search for products matching the description
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `คุณเป็นผู้ช่วยค้นหาสินค้าในระบบคลังสินค้า
      
ผู้ใช้พิมพ์: "${description}"

ให้ค้นหารหัสสินค้า (mid) ที่เกี่ยวข้องกับคำนี้ แล้วส่งออกมาเป็นรหัสเท่านั้น
ถ้าเป็นไก่ ให้ค้นรหัสที่เกี่ยวกับไก่
ถ้าเป็นผัก ให้ค้นรหัสที่เกี่ยวกับผัก
ถ้าเป็น "ผักกินกับน้ำพริก" ให้ค้นรหัสผักหลายชนิดที่เกี่ยวข้อง

ส่งออกเป็น JSON: {"mids": ["101008", "101115", "101116"]}`,
      response_json_schema: {
        type: "object",
        properties: {
          mids: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({ mids: result.mids || [] });
  } catch (error) {
    console.error('searchProductByDescription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});