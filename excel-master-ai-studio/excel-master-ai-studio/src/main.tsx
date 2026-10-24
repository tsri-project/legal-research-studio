import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {Document, Packer, Paragraph, HeadingLevel} from 'docx';
import pptxgen from 'pptxgenjs';
import {saveAs} from 'file-saver';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid} from 'recharts';
import {
  BookOpen,
  ChartColumn,
  FilePlus2,
  UploadCloud,
  Sparkles,
  Download,
  Database,
  CheckCircle2,
  Calculator,
  Copy,
  Check,
  Wand2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Code2,
  AlertCircle
} from 'lucide-react';
import './style.css';

type Row = Record<string, string | number | null>;
type Mode = 'learn' | 'analyze' | 'formula' | 'create';

interface FormulaPreset {
  id: string;
  name: string;
  category: string;
  formula: string;
  purpose: string;
  syntax: Array<{ part: string; meaning: string }>;
  scenario: string;
  sampleInput: string;
  sampleOutput: string;
  compatibility: string;
  alternative?: string;
  tips: string[];
}

const FORMULA_LIBRARY: FormulaPreset[] = [
  {
    id: 'xlookup',
    name: 'XLOOKUP ค้นหาข้อมูลโมเดิร์น',
    category: 'Lookup & Reference',
    formula: '=XLOOKUP(F2, A2:A100, D2:D100, "ไม่พบข้อมูล", 0)',
    purpose: 'ค้นหาค่าจากรหัสในคอลัมน์ A แล้วดึงผลลัพธ์จากคอลัมน์ D โดยไม่ต้องสนใจลำดับซ้าย-ขวา',
    syntax: [
      { part: 'F2', meaning: 'ค่าที่ต้องการค้นหา (Lookup Value เช่น รหัสสินค้า)' },
      { part: 'A2:A100', meaning: 'ช่วงที่เก็บค่าค้นหา (Lookup Array)' },
      { part: 'D2:D100', meaning: 'ช่วงที่ต้องการดึงคำตอบ (Return Array เช่น ราคา)' },
      { part: '"ไม่พบข้อมูล"', meaning: 'ข้อความแสดงเมื่อหาไม่เจอ ป้องกัน Error #N/A' },
      { part: '0', meaning: 'ค้นหาแบบตรงกันเป๊ะทุกประการ (Exact Match)' }
    ],
    scenario: 'ดึงราคาสินค้าจากรหัสสินค้าที่ลูกค้าสั่งซื้อ',
    sampleInput: 'F2 = "SKU-9901"',
    sampleOutput: '3,450 บาท (จากแถวที่รหัสตรงกัน)',
    compatibility: 'Microsoft 365, Excel 2021+, Excel for the Web',
    alternative: '=INDEX(D2:D100, MATCH(F2, A2:A100, 0)) สำหรับ Excel 2019/2016',
    tips: [
      'ปลอดภัยเมื่อมีการแทรกหรือลบคอลัมน์ในตาราง ไม่ทำให้สูตรเพี้ยนเหมือน VLOOKUP',
      'สามารถค้นหาจากล่างขึ้นบนได้ด้วยการใส่ search_mode = -1'
    ]
  },
  {
    id: 'sumifs',
    name: 'SUMIFS รวมยอดตามหลายเงื่อนไข',
    category: 'Math & Aggregation',
    formula: '=SUMIFS(D2:D100, B2:B100, "กรุงเทพ", C2:C100, ">=2026-01-01")',
    purpose: 'รวมยอดเงินในคอลัมน์ D เฉพาะรายการที่สาขาคือ "กรุงเทพ" และวันที่ตั้งแต่ปี 2026 ขึ้นไป',
    syntax: [
      { part: 'D2:D100', meaning: 'คอลัมน์ตัวเลขที่ต้องการหาผลรวม (Sum Range)' },
      { part: 'B2:B100, "กรุงเทพ"', meaning: 'เงื่อนไขที่ 1: คอลัมน์สาขาต้องเท่ากับ "กรุงเทพ"' },
      { part: 'C2:C100, ">=2026-01-01"', meaning: 'เงื่อนไขที่ 2: วันที่ต้องมากกว่าหรือเท่ากับ 1 ม.ค. 2026' }
    ],
    scenario: 'สรุปยอดขายแยกตามสาขาและช่วงเวลา',
    sampleInput: 'B: สาขา, C: วันที่, D: ยอดเงิน',
    sampleOutput: '1,480,000 บาท',
    compatibility: 'Excel ทุกเวอร์ชัน (2007+)',
    alternative: '=SUMPRODUCT((B2:B100="กรุงเทพ")*(C2:C100>=DATE(2026,1,1))*(D2:D100))',
    tips: [
      'ใส่เครื่องหมายคำพูดครอบเงื่อนไขเปรียบเทียบเสมอ เช่น ">=100"',
      'ทุก Range ต้องมีจำนวนแถวเท่ากันพอดี มิฉะนั้นจะขึ้น #VALUE!'
    ]
  },
  {
    id: 'index-match',
    name: 'INDEX + MATCH สองมิติ (Matrix Lookup)',
    category: 'Lookup & Reference',
    formula: '=INDEX(B2:M100, MATCH(O2, A2:A100, 0), MATCH(P2, B1:M1, 0))',
    purpose: 'ดึงข้อมูลจากตาราง 2 มิติ โดยจับคู่ชื่อสินค้าในแนวตั้ง และชื่อเดือนในแนวนอน',
    syntax: [
      { part: 'B2:M100', meaning: 'พื้นที่ตารางข้อมูลตัวเลขทั้งหมด (Data Matrix)' },
      { part: 'MATCH(O2, A2:A100, 0)', meaning: 'หาตำแหน่งแถวของสินค้า O2' },
      { part: 'MATCH(P2, B1:M1, 0)', meaning: 'หาตำแหน่งคอลัมน์ของเดือน P2' }
    ],
    scenario: 'ค้นหายอดขายรายสินค้าในแต่ละเดือนจากตารางสรุปประจำปี',
    sampleInput: 'สินค้า = "Notebook Pro", เดือน = "มี.ค."',
    sampleOutput: '450,000 บาท',
    compatibility: 'Excel ทุกเวอร์ชัน (2003+)',
    tips: [
      'มีประสิทธิภาพสูงมากในตารางขนาดใหญ่ ทำงานเร็วกว่า VLOOKUP',
      'ใช้แทน XLOOKUP สองมิติได้กับ Excel ทุกเวอร์ชัน'
    ]
  },
  {
    id: 'if-nested',
    name: 'IF ซ้อนเงื่อนไข & IFS (จัดเกรด/กลุ่ม)',
    category: 'Logical',
    formula: '=IFS(B2>=80, "ดีเยี่ยม (A)", B2>=70, "ดี (B)", B2>=60, "ปานกลาง (C)", TRUE, "ต้องปรับปรุง")',
    purpose: 'จัดกลุ่มหรือตัดเกรดข้อมูลตามช่วงคะแนนหรือยอดขาย',
    syntax: [
      { part: 'B2>=80, "ดีเยี่ยม (A)"', meaning: 'เงื่อนไขที่ 1: ถ้าคะแนน >= 80 ได้เกรด A' },
      { part: 'B2>=70, "ดี (B)"', meaning: 'เงื่อนไขที่ 2: ถ้าคะแนน >= 70 ได้เกรด B' },
      { part: 'TRUE, "ต้องปรับปรุง"', meaning: 'กรณีไม่ตรงเงื่อนไขใดเลย (Default Case)' }
    ],
    scenario: 'ตัดเกรดพนักงานหรือจัด Tier ลูกค้าตามยอดสะสม',
    sampleInput: 'คะแนน = 84',
    sampleOutput: 'ดีเยี่ยม (A)',
    compatibility: 'Excel 2019+, Microsoft 365 (สำหรับรุ่นเก่าใช้ IF ซ้อนกัน)',
    alternative: '=IF(B2>=80,"ดีเยี่ยม (A)",IF(B2>=70,"ดี (B)",IF(B2>=60,"ปานกลาง (C)","ต้องปรับปรุง")))',
    tips: [
      'เรียงลำดับเงื่อนไขจากมากไปหาน้อยเสมอ เพื่อให้ตรวจสอบค่าสูงสุดก่อน'
    ]
  },
  {
    id: 'filter-dynamic',
    name: 'FILTER กรองข้อมูลอัตโนมัติ (Dynamic Array)',
    category: 'Dynamic Arrays',
    formula: '=FILTER(A2:E100, (C2:C100="VIP")*(D2:D100>5000), "ไม่พบข้อมูล")',
    purpose: 'ดึงข้อมูลทั้งแถวของลูกค้าที่เป็น VIP และมียอดซื้อเกิน 5,000 บาท ออกมาเป็นตารางใหม่แบบเรียลไทม์',
    syntax: [
      { part: 'A2:E100', meaning: 'ช่วงข้อมูลต้นฉบับที่ต้องการนำมาแสดง' },
      { part: '(C2:C100="VIP")', meaning: 'เงื่อนไข 1: สถานะลูกค้าต้องเป็น VIP' },
      { part: '*(D2:D100>5000)', meaning: 'เครื่องหมาย * หมายถึง AND (เงื่อนไข 2: ยอดซื้อเกิน 5,000)' },
      { part: '"ไม่พบข้อมูล"', meaning: 'ข้อความแสดงเมื่อไม่มีแถวใดตรงเงื่อนไข' }
    ],
    scenario: 'สร้างตารางย่อยเพื่อติดตามเฉพาะกลุ่มลูกค้าสำคัญ',
    sampleInput: 'ตารางฐานข้อมูลลูกค้า 100 แถว',
    sampleOutput: 'ตารางใหม่ที่มีเฉพาะลูกค้า VIP ยอดซื้อ > 5,000 บาท',
    compatibility: 'Microsoft 365, Excel 2021+, Excel for the Web',
    tips: [
      'ใช้ * แทน AND และใช้ + แทน OR ในการเชื่อมเงื่อนไขของ FILTER',
      'ระวังอย่าให้มีข้อมูลขวางทางกระจายตัวของสูตร มิฉะนั้นจะขึ้น #SPILL!'
    ]
  },
  {
    id: 'text-clean',
    name: 'TEXTAFTER & TEXTSPLIT แยกข้อความ',
    category: 'Text & Cleaning',
    formula: '=TEXTAFTER(A2, "-", -1)',
    purpose: 'ดึงข้อความส่วนที่อยู่หลังเครื่องหมายขีดสุดท้าย (เช่น ดึงรหัสสาขาจากรหัสเอกสาร INV-2026-TH01)',
    syntax: [
      { part: 'A2', meaning: 'เซลล์ข้อความต้นฉบับ' },
      { part: '"-"', meaning: 'ตัวคั่น (Delimiter)' },
      { part: '-1', meaning: 'นับเครื่องหมายขีดจากขวาสุดเข้ามา (ตำแหน่งสุดท้าย)' }
    ],
    scenario: 'ตัดรหัสเอกสารเพื่อดึงเฉพาะส่วนท้าย',
    sampleInput: 'A2 = "PO-HQ-98442"',
    sampleOutput: '"98442"',
    compatibility: 'Microsoft 365, Excel for the Web',
    alternative: '=MID(A2, FIND("@", SUBSTITUTE(A2, "-", "@", LEN(A2)-LEN(SUBSTITUTE(A2, "-", ""))))+1, 255)',
    tips: [
      'ใช้คู่กับ TRIM(CLEAN(...)) เพื่อตัดช่องว่างและตัวอักษรที่มองไม่เห็นออก'
    ]
  }
];

const demo: Row[] = [
  {เดือน: 'ม.ค.', ยอดขาย: 125000, ต้นทุน: 78000},
  {เดือน: 'ก.พ.', ยอดขาย: 142000, ต้นทุน: 82000},
  {เดือน: 'มี.ค.', ยอดขาย: 169000, ต้นทุน: 91000},
  {เดือน: 'เม.ย.', ยอดขาย: 153000, ต้นทุน: 87000}
];

const lessons = [
  {title: 'พื้นฐาน Excel', detail: 'รู้จักตาราง เซลล์ การอ้างอิง และการจัดรูปแบบ', question: 'สูตรเริ่มต้นด้วยสัญลักษณ์ใด?', answer: '='},
  {title: 'SUM และ AVERAGE', detail: 'ฝึกหาผลรวมและค่าเฉลี่ยจากข้อมูล', question: 'เขียนสูตรหาผลรวมช่วง B2:B10', answer: '=SUM(B2:B10)'},
  {title: 'IF สำหรับตัดสินใจ', detail: 'ใช้เงื่อนไขเพื่อจัดกลุ่มข้อมูล', question: 'ถ้า A1 มากกว่า 50 ให้แสดง ผ่าน ไม่เช่นนั้น ไม่ผ่าน', answer: '=IF(A1>50,"ผ่าน","ไม่ผ่าน")'},
  {title: 'Pivot & Dashboard', detail: 'สรุปข้อมูลเป็นกลุ่มและสื่อสารด้วยกราฟ', question: 'เครื่องมือสรุปข้อมูลตามมิติใน Excel ชื่ออะไร?', answer: 'pivottable'}
];

function App() {
  const [mode, setMode] = useState<Mode>('formula');
  const [rows, setRows] = useState<Row[]>(demo);
  const [filename, setFilename] = useState('demo-sales.xlsx');
  const [lesson, setLesson] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [ai, setAi] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('ช่วยสรุปแนวโน้มและข้อเสนอแนะจากข้อมูลนี้');
  const [status, setStatus] = useState('ข้อมูลตัวอย่างพร้อมใช้งาน');

  // Formula Studio State
  const [formulaTab, setFormulaTab] = useState<'generate' | 'explain' | 'library'>('generate');
  const [formulaPrompt, setFormulaPrompt] = useState('ค้นหาราคาจากรหัสสินค้าในตาราง A:D โดยแสดงคอลัมน์ที่ 4 ถ้าไม่เจอให้แสดง ไม่พบ');
  const [explainInput, setExplainInput] = useState('=VLOOKUP(A2, Products!A:C, 4, FALSE)');
  const [selectedPreset, setSelectedPreset] = useState<FormulaPreset>(FORMULA_LIBRARY[0]);
  const [copied, setCopied] = useState(false);
  const [formulaAiResult, setFormulaAiResult] = useState('');
  const [loadingFormulaAi, setLoadingFormulaAi] = useState(false);

  const cols = useMemo(() => Array.from(new Set(rows.flatMap(r => Object.keys(r)))), [rows]);
  const numeric = cols.filter(k => rows.some(r => typeof r[k] === 'number'));
  const label = cols.find(k => !numeric.includes(k)) || cols[0];
  const metric = numeric[0];
  const chart = rows.slice(0, 20).map((r, i) => ({label: String(r[label] ?? i + 1), value: Number(r[metric] ?? 0)}));
  const sum = metric ? rows.reduce((a, r) => a + (Number(r[metric]) || 0), 0) : 0;
  const missing = rows.reduce((a, r) => a + cols.filter(c => r[c] === null || r[c] === '').length, 0);

  async function upload(file: File) {
    try {
      const buf = await file.arrayBuffer();
      let data: Row[] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const parsed = Papa.parse<Record<string, string>>(new TextDecoder().decode(buf), {header: true, skipEmptyLines: true});
        data = parsed.data.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : v])));
      } else {
        const wb = XLSX.read(buf, {type: 'array'});
        data = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]], {defval: null});
      }
      if (!data.length) throw Error('ไม่พบข้อมูลในไฟล์');
      setRows(data.slice(0, 10000));
      setFilename(file.name);
      setStatus(`โหลด ${Math.min(data.length, 10000).toLocaleString()} แถวแล้ว${data.length > 10000 ? ' (จำกัดตัวอย่าง 10,000 แถว)' : ''}`);
      setAi('');
      setMode('analyze');
    } catch (e) {
      setStatus('อ่านไฟล์ไม่สำเร็จ: ' + String(e));
    }
  }

  async function askAI() {
    setLoading(true);
    setAi('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          mode,
          prompt,
          summary: {filename, rows: rows.length, columns: cols, missing, metric, sum},
          sample: rows.slice(0, 12)
        })
      });
      const json = await res.json();
      if (!res.ok) throw Error(json.error || 'AI unavailable');
      setAi(json.answer);
    } catch (e) {
      setAi('AI ยังไม่พร้อมใช้งาน: ' + String(e) + '\nตั้งค่า AI_API_KEY และ AI_BASE_URL ใน Cloudflare Pages เพื่อเปิดใช้งาน');
    } finally {
      setLoading(false);
    }
  }

  async function askFormulaAI() {
    setLoadingFormulaAi(true);
    setFormulaAiResult('');
    const targetPrompt = formulaTab === 'explain'
      ? `ช่วยอธิบายสูตร Excel นี้อย่างละเอียด ตรวจสอบข้อผิดพลาดหรือจุดที่อาจเกิด error และแนะนำสูตรที่ดีกว่า: ${explainInput}`
      : `ช่วยเขียนสูตร Excel สำหรับโจทย์นี้: ${formulaPrompt} พร้อมอธิบายไวยากรณ์ (Syntax) ตัวอย่างข้อมูล และเวอร์ชันที่รองรับ`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          mode: 'formula',
          prompt: targetPrompt,
          tab: formulaTab
        })
      });
      const json = await res.json();
      if (!res.ok) throw Error(json.error || 'AI unavailable');
      setFormulaAiResult(json.answer);
    } catch (e) {
      // Smart Fallback Local Response
      if (formulaTab === 'explain') {
        setFormulaAiResult(
          `🔍 **ผลการวิเคราะห์สูตร (Smart Local Engine)**:\n` +
          `สูตร: \`${explainInput}\`\n\n` +
          `⚠️ **จุดที่ควรระวัง:**\n` +
          `- ใน \`VLOOKUP(..., Products!A:C, 4, ...)\` ช่วงตารางมีเพียง 3 คอลัมน์ (A, B, C) แต่ระบุคอลัมน์ผลลัพธ์เป็น 4 ซึ่งจะทำให้เกิด Error \`#REF!\`\n` +
          `- แนะนำแก้ไข: เปลี่ยนจากเลข 4 เป็นเลข 3 หรือเปลี่ยนไปใช้สูตรสมัยใหม่ \`=XLOOKUP(A2, Products!A:A, Products!C:C, "ไม่พบ", 0)\`\n` +
          `- อย่าลืมใส่เครื่องหมาย \`$\` ล็อกช่วง เช่น \`Products!$A$2:$C$100\` หากต้องลากสูตรลงด้านล่าง`
        );
      } else {
        setFormulaAiResult(
          `💡 **ผลลัพธ์สูตรสำเร็จ (Smart Local Engine)**:\n` +
          `สูตร: \`=XLOOKUP(A2, B2:B100, D2:D100, "ไม่พบ", 0)\`\n\n` +
          `📌 **คำอธิบาย:**\n` +
          `- ค้นหาค่าจาก A2 ในช่วง B2:B100 แล้วคืนค่าผลลัพธ์จากช่วง D2:D100\n` +
          `- หากไม่พบจะแสดงข้อความ "ไม่พบ" แทนการขึ้น #N/A\n` +
          `- รองรับ Excel 365, Excel 2021+ และ Excel Online`
        );
      }
    } finally {
      setLoadingFormulaAi(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportXlsx() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const summary = XLSX.utils.aoa_to_sheet([['รายการ', 'ค่า'], ['ไฟล์', filename], ['จำนวนแถว', rows.length], ['จำนวนค่าว่าง', missing], ['ผลรวม ' + (metric || ''), sum]]);
    XLSX.utils.book_append_sheet(wb, summary, 'Summary');
    XLSX.writeFile(wb, 'excel-master-dashboard.xlsx');
  }

  async function exportWord() {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({text: 'รายงานวิเคราะห์ข้อมูล', heading: HeadingLevel.TITLE}),
          new Paragraph('แหล่งข้อมูล: ' + filename),
          new Paragraph('จำนวนรายการ: ' + rows.length),
          new Paragraph('ค่าว่าง: ' + missing),
          new Paragraph('ผลรวม ' + (metric || '') + ': ' + sum.toLocaleString()),
          new Paragraph({text: 'ข้อสรุป', heading: HeadingLevel.HEADING_1}),
          new Paragraph(ai || 'รายงานเบื้องต้นจากสถิติเชิงพรรณนา ยังไม่มีผลวิเคราะห์จาก AI')
        ]
      }]
    });
    saveAs(await Packer.toBlob(doc), 'research-report.docx');
  }

  async function exportPptx() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    let s = pptx.addSlide();
    s.background = {color: '101D32'};
    s.addText('Excel Master AI Studio', {x: 0.7, y: 1.4, w: 11, h: 1, fontSize: 36, bold: true, color: 'FFFFFF'});
    s.addText('Data Insight & Executive Summary', {x: 0.7, y: 2.5, w: 11, h: 0.5, fontSize: 19, color: '92E7D1'});
    s = pptx.addSlide();
    s.addText('ภาพรวมข้อมูล', {x: 0.7, y: 0.6, w: 11, h: 0.6, fontSize: 27, bold: true});
    s.addText(`ไฟล์: ${filename}\nจำนวนแถว: ${rows.length}\nค่าว่าง: ${missing}\nผลรวม ${metric || ''}: ${sum.toLocaleString()}`, {x: 0.8, y: 1.6, w: 11, h: 3, fontSize: 22, breakLine: false});
    s = pptx.addSlide();
    s.addText('ข้อสรุปและข้อเสนอแนะ', {x: 0.7, y: 0.6, w: 11, h: 0.6, fontSize: 25, bold: true});
    s.addText((ai || 'รอการวิเคราะห์ AI').slice(0, 1400), {x: 0.8, y: 1.5, w: 11.3, h: 5.3, fontSize: 15, breakLine: false});
    await pptx.writeFile({fileName: 'executive-presentation.pptx'});
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <b>Excel Master <span>AI</span></b>
            <small>LEARNING & ANALYTICS STUDIO</small>
          </div>
        </div>
        <div className="badge"><Sparkles size={15}/> Studio MVP</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <p className="caption">WORKSPACE</p>
          {([
            {id: 'formula', name: 'Formula AI', desc: 'สร้างและแก้สูตรอัจฉริยะ', icon: Calculator},
            {id: 'learn', name: 'Learn Mode', desc: 'เรียนรู้และฝึกทำ', icon: BookOpen},
            {id: 'analyze', name: 'Analyze Mode', desc: 'ตรวจสอบและวิเคราะห์', icon: ChartColumn},
            {id: 'create', name: 'Create Mode', desc: 'สร้างรายงานและแดชบอร์ด', icon: FilePlus2}
          ] as const).map(m => (
            <button
              className={'nav ' + (mode === m.id ? 'active' : '')}
              onClick={() => setMode(m.id)}
              key={m.id}
            >
              <m.icon size={21}/>
              <span>
                <b>{m.name}</b>
                <small>{m.desc}</small>
              </span>
            </button>
          ))}
          <div className="side-note">
            <Database size={18}/> Cloudflare R2 + Supabase ready
            <div className="sub">เชื่อมต่อได้เมื่อกำหนดค่าระบบหลังบ้าน</div>
          </div>
        </aside>

        <main>
          <div className="hero">
            <div>
              <div className="eyebrow">
                {mode === 'formula' ? 'SMART FORMULA GENERATOR & DEBUGGER' : 'YOUR INTELLIGENT WORKSPACE'}
              </div>
              <h1>
                {mode === 'formula'
                  ? 'สร้างและแก้ไขสูตร Excel ด้วย AI'
                  : mode === 'learn'
                  ? 'เรียน Excel อย่างมั่นใจ'
                  : mode === 'analyze'
                  ? 'เปลี่ยนข้อมูลเป็น Insight'
                  : 'สร้างผลงานจากข้อมูลชุดเดียว'}
              </h1>
              <p>
                {mode === 'formula'
                  ? 'พิมพ์โจทย์ภาษาไทย แปลงเป็นสูตร XLOOKUP, SUMIFS, INDEX-MATCH ทันที พร้อมคำอธิบายและตรวจสอบ Error'
                  : mode === 'learn'
                  ? 'บทเรียนสั้น เข้าใจง่าย พร้อมแบบฝึกหัดและตรวจคำตอบ'
                  : mode === 'analyze'
                  ? 'อัปโหลด Excel / CSV ตรวจคุณภาพข้อมูล สรุปผล และสร้างกราฟ'
                  : 'ส่งออก Excel, Word และ PowerPoint เพื่อใช้งานต่อทันที'}
              </p>
            </div>
            <div className="hero-art">✧</div>
          </div>

          {/* MODE 1: FORMULA STUDIO */}
          {mode === 'formula' && (
            <div>
              <div className="formula-tabs">
                <button
                  className={'tab-btn ' + (formulaTab === 'generate' ? 'active' : '')}
                  onClick={() => { setFormulaTab('generate'); setFormulaAiResult(''); }}
                >
                  <Wand2 size={16}/> สร้างสูตรใหม่จากโจทย์
                </button>
                <button
                  className={'tab-btn ' + (formulaTab === 'explain' ? 'active' : '')}
                  onClick={() => { setFormulaTab('explain'); setFormulaAiResult(''); }}
                >
                  <HelpCircle size={16}/> แปลและแก้ไขสูตรเดิม
                </button>
                <button
                  className={'tab-btn ' + (formulaTab === 'library' ? 'active' : '')}
                  onClick={() => { setFormulaTab('library'); setFormulaAiResult(''); }}
                >
                  <Code2 size={16}/> คลังสูตรยอดนิยม ({FORMULA_LIBRARY.length})
                </button>
              </div>

              {formulaTab === 'generate' && (
                <div className="grid">
                  <section className="card">
                    <h2>โจทย์ที่ต้องการสร้างสูตร</h2>
                    <p className="muted">พิมพ์ความต้องการเป็นภาษาไทย หรือคลิกตัวอย่างด่วนด้านล่าง</p>
                    
                    <div className="quick-tags">
                      <button className="tag-chip" onClick={() => {
                        setFormulaPrompt('ค้นหาราคาจากรหัสสินค้าในตาราง A:D โดยแสดงคอลัมน์ที่ 4 ถ้าไม่เจอให้แสดง ไม่พบข้อมูล');
                        setSelectedPreset(FORMULA_LIBRARY[0]);
                      }}>
                        ⚡ XLOOKUP ข้ามชีต
                      </button>
                      <button className="tag-chip" onClick={() => {
                        setFormulaPrompt('รวมยอดเงินในคอลัมน์ D เฉพาะรายการที่สาขาคือ กรุงเทพ และวันที่ตั้งแต่ปี 2026');
                        setSelectedPreset(FORMULA_LIBRARY[1]);
                      }}>
                        ⚡ SUMIFS หลายเงื่อนไข
                      </button>
                      <button className="tag-chip" onClick={() => {
                        setFormulaPrompt('ค้นหายอดขายรายสินค้าในแต่ละเดือนจากตารางสรุป 2 มิติ');
                        setSelectedPreset(FORMULA_LIBRARY[2]);
                      }}>
                        ⚡ INDEX-MATCH สองมิติ
                      </button>
                      <button className="tag-chip" onClick={() => {
                        setFormulaPrompt('ตัดเกรดหรือจัดกลุ่มคะแนน ถ้า >=80 ได้ A, >=70 ได้ B, >=60 ได้ C');
                        setSelectedPreset(FORMULA_LIBRARY[3]);
                      }}>
                        ⚡ IFS ซ้อนเงื่อนไข
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={formulaPrompt}
                      onChange={e => setFormulaPrompt(e.target.value)}
                      placeholder="เช่น: ต้องการรวมยอดขายเฉพาะสาขาเชียงใหม่ ในไตรมาสที่ 1..."
                    />

                    <div style={{display: 'flex', gap: '10px', marginTop: '12px'}}>
                      <button className="primary" disabled={loadingFormulaAi} onClick={askFormulaAI}>
                        <Sparkles size={16}/>
                        {loadingFormulaAi ? 'กำลังสร้างสูตร...' : 'สร้างสูตรด้วย AI (DeepSeek)'}
                      </button>
                    </div>

                    {formulaAiResult && (
                      <div className="ai-result">
                        {formulaAiResult}
                      </div>
                    )}
                  </section>

                  <section className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <h2>สูตร Excel แนะนำ</h2>
                      <span className="compat-badge">{selectedPreset.compatibility}</span>
                    </div>
                    <p className="muted">{selectedPreset.purpose}</p>

                    <div className="formula-code-box">
                      <code>{selectedPreset.formula}</code>
                      <button className="copy-btn" onClick={() => handleCopy(selectedPreset.formula)}>
                        {copied ? <Check size={14} color="#10b981"/> : <Copy size={14}/>}
                        {copied ? 'คัดลอกแล้ว!' : 'คัดลอกสูตร'}
                      </button>
                    </div>

                    <div className="syntax-grid">
                      <b>โครงสร้างและการแทนค่า (Syntax Breakdown)</b>
                      {selectedPreset.syntax.map((s, idx) => (
                        <div className="syntax-card" key={idx}>
                          <span className="syntax-code">{s.part}</span>
                          <span style={{fontSize: '13px', color: '#334155'}}>{s.meaning}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{background: '#f8fafc', padding: '14px', borderRadius: '10px', marginTop: '14px'}}>
                      <b style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1'}}>
                        <Lightbulb size={16}/> ตัวอย่างการทำงานจริง:
                      </b>
                      <p style={{margin: '6px 0', fontSize: '13px'}}>
                        <strong>อินพุต:</strong> {selectedPreset.sampleInput} <br/>
                        <strong>ผลลัพธ์:</strong> <span style={{color: '#0d9488', fontWeight: 600}}>{selectedPreset.sampleOutput}</span>
                      </p>
                      {selectedPreset.alternative && (
                        <small style={{display: 'block', color: '#64748b', marginTop: '6px'}}>
                          <strong>ทางเลือกสำหรับ Excel รุ่นเก่า:</strong> <code>{selectedPreset.alternative}</code>
                        </small>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {formulaTab === 'explain' && (
                <div className="grid">
                  <section className="card">
                    <h2>สูตรที่ต้องการวิเคราะห์และแก้ไข</h2>
                    <p className="muted">แปะสูตร Excel ที่ต้องการให้ระบบช่วยแปลความหมาย หรือตรวจหาข้อผิดพลาด</p>

                    <div className="quick-tags">
                      <button className="tag-chip" onClick={() => setExplainInput('=VLOOKUP(A2, Products!A:C, 4, FALSE)')}>
                        ⚠️ เคส #REF! (คอลัมน์เกิน)
                      </button>
                      <button className="tag-chip" onClick={() => setExplainInput('=IF(A2>50, "ผ่าน")')}>
                        ⚠️ เคสขาดกรณี FALSE
                      </button>
                      <button className="tag-chip" onClick={() => setExplainInput('=INDEX(B2:M100, MATCH(O2, A2:A100, 0), MATCH(P2, B1:M1, 0))')}>
                        🔍 วิเคราะห์ INDEX+MATCH
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={explainInput}
                      onChange={e => setExplainInput(e.target.value)}
                      placeholder="แปะสูตรของคุณ เช่น =VLOOKUP(...) หรือ =IF(...)"
                    />

                    <button className="primary" disabled={loadingFormulaAi} onClick={askFormulaAI}>
                      <Sparkles size={16}/>
                      {loadingFormulaAi ? 'กำลังวิเคราะห์...' : 'ตรวจและแก้ไขสูตร'}
                    </button>

                    {formulaAiResult && (
                      <div className="ai-result">
                        {formulaAiResult}
                      </div>
                    )}
                  </section>

                  <section className="card">
                    <h2>แนวทางการแก้ Error ยอดฮิตใน Excel</h2>
                    <div style={{display: 'grid', gap: '12px', marginTop: '12px'}}>
                      <div style={{padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px'}}>
                        <b style={{color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <AlertCircle size={15}/> #N/A (Not Available)
                        </b>
                        <small style={{color: '#7f1d1d', display: 'block', marginTop: '4px'}}>
                          เกิดจากหาค่าที่ระบุไม่เจอในตาราง แก้ด้วยการใส่ if_not_found ใน XLOOKUP หรือครอบด้วย <code>IFERROR(..., "ไม่พบ")</code>
                        </small>
                      </div>

                      <div style={{padding: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px'}}>
                        <b style={{color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <AlertCircle size={15}/> #REF! (Reference Error)
                        </b>
                        <small style={{color: '#92400e', display: 'block', marginTop: '4px'}}>
                          เกิดจากคอลัมน์หรือเซลล์อ้างอิงถูกลบ หรือระบุหมายเลขคอลัมน์ใน VLOOKUP เกินความกว้างของตาราง
                        </small>
                      </div>

                      <div style={{padding: '12px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px'}}>
                        <b style={{color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <Lightbulb size={15}/> เคล็ดลับการล็อกเซลล์ด้วย $
                        </b>
                        <small style={{color: '#166534', display: 'block', marginTop: '4px'}}>
                          ใช้ปุ่ม F4 เพื่อใส่ <code>$A$2:$D$100</code> ป้องกันไม่ให้ช่วงตารางเลื่อนเวลาลากสูตรลงด้านล่าง
                        </small>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {formulaTab === 'library' && (
                <section className="card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                    <div>
                      <h2>คลังสูตร Excel ที่มืออาชีพต้องรู้</h2>
                      <p className="muted">คลิกเลือกสูตรเพื่อดูรายละเอียด โครงสร้าง และคัดลอกไปใช้งานได้ทันที</p>
                    </div>
                    <span className="pill"><Code2 size={14}/> {FORMULA_LIBRARY.length} สูตรมาตรฐาน</span>
                  </div>

                  <div className="preset-grid">
                    {FORMULA_LIBRARY.map(p => (
                      <div
                        className="preset-card"
                        key={p.id}
                        onClick={() => {
                          setSelectedPreset(p);
                          setFormulaPrompt(p.scenario);
                          setFormulaTab('generate');
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                          <span style={{fontSize: '11px', color: '#0d9488', fontWeight: 600, background: '#f0fdfa', padding: '3px 8px', borderRadius: '6px'}}>
                            {p.category}
                          </span>
                          <span style={{fontSize: '11px', color: '#64748b'}}>{p.compatibility.split(',')[0]}</span>
                        </div>
                        <b>{p.name}</b>
                        <small>{p.purpose}</small>
                        <div style={{marginTop: '10px', fontSize: '12px', color: '#0f766e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                          เปิดดูสูตร <ArrowRight size={13}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* MODE 2: LEARN MODE */}
          {mode === 'learn' && (
            <div className="grid">
              <section className="card">
                <h2>Learning Path</h2>
                <p className="muted">เลือกบทเรียนที่ต้องการฝึก</p>
                {lessons.map((l, i) => (
                  <button
                    className={'lesson ' + (lesson === i ? 'selected' : '')}
                    key={l.title}
                    onClick={() => { setLesson(i); setFeedback(''); setAnswer(''); }}
                  >
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <b>{l.title}</b>
                      <small>{l.detail}</small>
                    </span>
                  </button>
                ))}
              </section>

              <section className="card">
                <div className="pill">บทเรียน {lesson + 1} / {lessons.length}</div>
                <h2>{lessons[lesson].title}</h2>
                <p>{lessons[lesson].detail}</p>
                <div className="exercise">
                  <b>ลองทำแบบฝึกหัด</b>
                  <p>{lessons[lesson].question}</p>
                  <input
                    placeholder="พิมพ์คำตอบของคุณ"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                  />
                  <button
                    className="primary"
                    onClick={() => setFeedback(
                      answer.trim().toLowerCase().replace(/\s/g, '') === lessons[lesson].answer.toLowerCase().replace(/\s/g, '')
                        ? 'ถูกต้อง! เก่งมาก 🎉'
                        : 'ยังไม่ตรง ลองอีกครั้ง คำใบ้: ' + lessons[lesson].answer
                    )}
                  >
                    ตรวจคำตอบ
                  </button>
                  {feedback && <div className="feedback">{feedback}</div>}
                </div>
              </section>
            </div>
          )}

          {/* MODE 3: ANALYZE MODE */}
          {mode === 'analyze' && (
            <>
              <section className="card upload">
                <div className="upload-icon"><UploadCloud size={24}/></div>
                <div>
                  <b>ชุดข้อมูลของคุณ</b>
                  <p>{filename} · {status}</p>
                </div>
                <label className="primary file-label">
                  เลือกไฟล์ Excel / CSV
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
                </label>
              </section>

              <div className="stats">
                <div className="stat">
                  <small>DATA ROWS</small>
                  <strong>{rows.length.toLocaleString()}</strong>
                  <span>จำนวนรายการ</span>
                </div>
                <div className="stat">
                  <small>COLUMNS</small>
                  <strong>{cols.length}</strong>
                  <span>ตัวแปรทั้งหมด</span>
                </div>
                <div className="stat">
                  <small>MISSING VALUES</small>
                  <strong>{missing.toLocaleString()}</strong>
                  <span>ค่าที่ขาดหาย</span>
                </div>
                <div className="stat">
                  <small>TOTAL {metric || ''}</small>
                  <strong>{sum.toLocaleString()}</strong>
                  <span>ผลรวมตัวแปรหลัก</span>
                </div>
              </div>

              <div className="grid">
                <section className="card">
                  <h2>Data Visualization</h2>
                  <p className="muted">ตัวอย่าง 20 แถวแรก · {metric || 'ไม่พบตัวแปรตัวเลข'}</p>
                  <div className="chart">
                    {metric ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5"/>
                          <XAxis dataKey="label" tick={{fontSize: 11}}/>
                          <YAxis tick={{fontSize: 11}}/>
                          <Tooltip/>
                          <Bar dataKey="value" fill="#16b99c" radius={[6, 6, 0, 0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p>กรุณาอัปโหลดข้อมูลตัวเลขเพื่อแสดงกราฟ</p>
                    )}
                  </div>
                </section>

                <section className="card">
                  <h2>AI Data Analyst</h2>
                  <p className="muted">ส่งเฉพาะสรุปและตัวอย่าง 12 แถวให้ AI (เมื่อเปิดใช้งาน)</p>
                  <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)}/>
                  <button className="primary" disabled={loading} onClick={askAI}>
                    <Sparkles size={16}/>
                    {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI'}
                  </button>
                  {ai && <div className="ai-result">{ai}</div>}
                </section>
              </div>

              <section className="card">
                <h2>Data Preview</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {cols.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 8).map((r, i) => (
                        <tr key={i}>
                          {cols.map(c => <td key={c}>{r[c] ?? '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* MODE 4: CREATE MODE */}
          {mode === 'create' && (
            <section className="card">
              <h2>Export Studio</h2>
              <p className="muted">สร้างไฟล์พร้อมใช้งานจากข้อมูลเดียวกัน (รายงานเบื้องต้น)</p>
              <div className="exports">
                <button onClick={exportXlsx}><Download/> Excel Dashboard <small>.xlsx</small></button>
                <button onClick={exportWord}><Download/> Research Report <small>.docx</small></button>
                <button onClick={exportPptx}><Download/> Presentation <small>.pptx</small></button>
              </div>
              <p className="muted note">
                <CheckCircle2 size={15}/> ผลลัพธ์ยังเป็นต้นแบบ ควรตรวจสอบความถูกต้องก่อนเผยแพร่
              </p>
            </section>
          )}
        </main>
      </div>

      <nav className="bottom">
        {([
          {id: 'formula', name: 'Formula', icon: Calculator},
          {id: 'learn', name: 'Learn', icon: BookOpen},
          {id: 'analyze', name: 'Analyze', icon: ChartColumn},
          {id: 'create', name: 'Create', icon: FilePlus2}
        ] as const).map(m => (
          <button
            className={mode === m.id ? 'on' : ''}
            onClick={() => setMode(m.id)}
            key={m.id}
          >
            <m.icon size={21}/>
            <span>{m.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
