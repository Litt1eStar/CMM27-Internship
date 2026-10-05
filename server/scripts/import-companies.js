import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { supabase } from '../src/lib/supabase.js';

const TYPE_MAP = {
  'โปรดักชั่น งานโฆษณา และสื่อออนไลน์': 1,
  'ผลิตรายการโทรทัศน์': 2,
  'ผลิตสื่อออนไลน์และออฟไลน์': 3,
  'งานออกแบบ': 4,
  'งานการศึกษา งานฝึกอบรม': 5,
  'งานวิศวกรรม': 6,
  'งานบริการ งานท่องเที่ยว': 7,
  'งานไอที': 8,
  'งานประกันภัย': 9,
  'งานการตลาด': 10,
  'งานอสังหาริมทรัพย์': 11,
  'งานขาย': 12,
  // Freeform mappings
  'VFX': 1,
  'ค่ายเพลง': 3,
  'นำเข้าวัตถุดิบญี่ปุ่น': 10,
  'Developer': 8,
  'เนื่องจาก Tokyo University of Technology เป็นมหาวิทยาลัย': 5,
  'มหาวิทยาลัย': 5,
  'Information & Communication Technology': 8,
  'E-Sports': 3,
  'การผลิตและส่งกระแสไฟฟ้า': 6,
  'ขนส่งสินค้า': 7,
  'ส่งเสริมและสนับสนุนนักเรียน นักศึกษา และกลุ่มstartup': 5,
  'ค่ายดนตรี โปรดัคชั่น': 1,
  'ทำสื่ออินเตอร์แอคทีฟ โปรเจคชั่นแมฟปิ้ง': 1,
};

async function main() {
  const commit = process.argv.includes('--commit');
  const filePath = process.argv.find((a) => !a.startsWith('--') && a.endsWith('.csv')) || '../company.csv';

  console.log(`Reading companies from ${filePath}...`);
  const text = await readFile(filePath, 'utf8');
  const records = parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`Read ${records.length} raw survey records.`);

  // Get advisor user for created_by
  const { data: advisors, error: advErr } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'ADVISOR')
    .limit(1);

  if (advErr || !advisors?.length) {
    throw new Error('No advisor user found in database to assign as created_by.');
  }
  const creatorId = advisors[0].id;

  const byKey = new Map();

  for (const r of records) {
    const rawName = r['ชื่อสถานที่ฝึกงาน']?.trim();
    if (!rawName) continue;

    // Normalize company name key
    const key = rawName.toLowerCase().replace(/^(บริษัท|บจก\.?)\s*/i, '').trim();

    const mode = (r['รุปแบบการฝึกงาน'] || 'ONSITE').trim().toUpperCase();
    const workMode = ['ONSITE', 'HYBRID', 'ONLINE'].includes(mode) ? mode : 'ONSITE';

    const rawType = r['ประเภทธุรกิจ (อ้างอิงจาก JobDB)'];
    const businessTypeId = TYPE_MAP[rawType] || 1;

    const pos = r['ตำแหน่งงานที่ทำ']?.trim();
    const comp = r['ค่าตอบแทนรายวัน']?.trim();
    const recmd = r['แนะนำให้น้องๆมาฝึกงานที่นี่มั้ย']?.trim();
    const tip = r['สิ่งที่ควรเตรียมก่อนไปฝึกงาน']?.trim();
    const fav = r['สิ่งที่ประทับใจในการฝึกงาน']?.trim();

    const noteParts = [];
    if (pos) noteParts.push(`ตำแหน่ง: ${pos}`);
    if (comp) noteParts.push(`ค่าตอบแทน: ${comp}`);
    if (recmd) noteParts.push(`คำแนะนำ: ${recmd}`);
    if (fav) noteParts.push(`สิ่งที่ประทับใจ: ${fav}`);
    if (tip) noteParts.push(`สิ่งที่ควรเตรียม: ${tip}`);

    const note = noteParts.join(' | ').slice(0, 990);

    if (!byKey.has(key)) {
      byKey.set(key, {
        name: rawName,
        business_type_id: businessTypeId,
        work_mode: workMode,
        source_type: 'SENIOR',
        url: null,
        note: note || null,
        created_by: creatorId,
      });
    }
  }

  const companies = Array.from(byKey.values());
  console.log(`Prepared ${companies.length} unique companies for import.`);

  if (!commit) {
    console.log('\nSample prepared entries:');
    console.log(companies.slice(0, 3));
    console.log('\nDry run only. Re-run with --commit to write to the database.');
    return;
  }

  console.log('\nInserting companies into database...');
  let inserted = 0;
  for (const comp of companies) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', comp.name.trim())
      .maybeSingle();

    if (existing) {
      console.log(`Skipping existing: ${comp.name}`);
      continue;
    }

    const { error } = await supabase.from('companies').insert(comp);
    if (error) {
      console.error(`Error inserting ${comp.name}:`, error.message);
    } else {
      inserted++;
    }
  }

  console.log(`Successfully imported ${inserted} companies into the database!`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
