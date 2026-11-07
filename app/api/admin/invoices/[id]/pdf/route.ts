import { NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const esc = (value: unknown) => String(value ?? "").replace(/([()\\])/g, "\\$1").replace(/[\r\n]/g, " ");
const money = (value: unknown) => Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: unknown) => {
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const parsed = new Date(`${raw}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? "-" : new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};
const wrap = (value: unknown, length: number) => {
  const words = String(value || "-").trim().split(/\s+/), lines: string[] = [];
  let line = "";
  words.forEach((word) => { if (`${line} ${word}`.trim().length > length && line) { lines.push(line); line = word; } else line = `${line} ${word}`.trim(); });
  if (line) lines.push(line);
  return lines;
};

function invoicePdf(row: Record<string, unknown>) {
  const stream: string[] = ["q", "1 1 1 rg", "0 0 595 842 re f", "Q"];
  const text = (font: "F1" | "F2", size: number, x: number, y: number, value: unknown, color = "0.07 0.06 0.09") => stream.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${esc(value)}) Tj ET`);
  const rect = (x: number, y: number, width: number, height: number, fill?: string, stroke?: string) => { stream.push("q"); if (fill) stream.push(`${fill} rg`, `${x} ${y} ${width} ${height} re f`); if (stroke) stream.push(`${stroke} RG`, "0.8 w", `${x} ${y} ${width} ${height} re S`); stream.push("Q"); };
  const line = (x1: number, y1: number, x2: number, y2: number, color = "0.78 0.76 0.81") => stream.push(`q ${color} RG 0.65 w ${x1} ${y1} m ${x2} ${y2} l S Q`);
  const margin = 42, right = 553;

  rect(0, 796, 595, 46, "0.20 0.05 0.31");
  text("F2", 22, margin, 812, "M/S INDUS GAS", "1 1 1");
  text("F1", 8.5, margin, 798, "LPG distribution and cylinder supply", "0.91 0.82 0.96");
  text("F2", 16, right - 83, 810, "INVOICE", "1 1 1");

  text("F2", 9, margin, 766, "INDUS GAS");
  text("F1", 8, margin, 752, "Address: 3, E, Chinar Bagh, Lahore");
  text("F1", 8, margin, 739, "NTN: 1762407-8  |  STRN: 32-77-8763-9526-7");
  text("F2", 8, 402, 766, "INVOICE #"); text("F1", 7.5, 466, 766, String(row.invoice_no || "-").slice(0, 23));
  text("F2", 8, 402, 752, "BILLING DATE"); text("F1", 8, 478, 752, date(row.delivery_date));
  text("F2", 8, 402, 739, "DELIVERY #"); text("F1", 8, 478, 739, row.delivery_no);
  line(margin, 721, right, 721, "0.62 0.27 0.78");

  text("F2", 9, margin, 698, "BILL TO"); text("F2", 12, margin, 682, row.client_name);
  let customerY = 668;
  const customerAddress = String(row.address || "").startsWith("http") ? "Location: Google Maps link saved in branch profile" : row.address;
  [row.branch_name, ...wrap(customerAddress, 57)].forEach((value) => { text("F1", 8.5, margin, customerY, value, "0.25 0.23 0.29"); customerY -= 12; });

  const top = 603, columns = [42, 72, 265, 326, 383, 454, 553];
  rect(margin, top - 26, right - margin, 26, "0.20 0.05 0.31");
  ["SR.", "PRODUCT / DESCRIPTION", "UNIT", "QTY", "PRICE / KG", "AMOUNT"].forEach((heading, index) => text("F2", 7.5, columns[index] + 7, top - 16, heading, "1 1 1"));
  const rows = [
    Number(row.commercial_cylinder_count) > 0 ? { product: "Commercial LPG cylinders (45 kg)", unit: "KG", qty: Number(row.commercial_cylinder_count) * 45, price: Number(row.commercial_rate) / 45, amount: Number(row.commercial_subtotal) } : null,
    Number(row.domestic_cylinder_count) > 0 ? { product: "Domestic LPG cylinders (11.8 kg)", unit: "KG", qty: Number(row.domestic_cylinder_count) * 11.8, price: Number(row.domestic_rate) / 11.8, amount: Number(row.domestic_subtotal) } : null,
  ].filter(Boolean) as { product: string; unit: string; qty: number; price: number; amount: number }[];
  const rowHeight = rows.length === 2 ? 42 : 52, tableBottom = top - 26 - rowHeight * Math.max(rows.length, 1);
  rect(margin, tableBottom, right - margin, top - tableBottom, undefined, "0.42 0.39 0.46");
  columns.slice(1, -1).forEach((x) => line(x, tableBottom, x, top));
  rows.forEach((item, index) => {
    const y = top - 26 - rowHeight * index - 22;
    if (index) line(margin, top - 26 - rowHeight * index, right, top - 26 - rowHeight * index);
    text("F1", 8, 54, y, index + 1); text("F1", 8, 79, y, item.product); text("F1", 8, 279, y, item.unit);
    text("F1", 8, 339, y, item.qty.toLocaleString("en-PK", { maximumFractionDigits: 1 })); text("F1", 8, 392, y, money(item.price)); text("F1", 8, 463, y, money(item.amount));
  });

  const totalsTop = tableBottom - 27;
  text("F2", 9, 362, totalsTop, "Gross total"); text("F1", 9, 466, totalsTop, `PKR ${money(row.total_amount)}`); line(356, totalsTop - 8, right, totalsTop - 8);
  text("F2", 10, 362, totalsTop - 25, "Total amount"); text("F2", 10, 452, totalsTop - 25, `PKR ${money(row.total_amount)}`); line(356, totalsTop - 32, right, totalsTop - 32, "0.20 0.05 0.31");
  const notesY = totalsTop - 75;
  text("F2", 9, margin, notesY, "NOTES"); text("F1", 8, margin, notesY - 15, "- Please count cylinders while receiving the supply.", "0.25 0.23 0.29"); text("F1", 8, margin, notesY - 28, "- Payment is due according to the agreed customer terms.", "0.25 0.23 0.29");
  text("F1", 8, margin, 52, "This is a computer-generated invoice and does not require a signature.", "0.36 0.33 0.40"); text("F1", 8, 405, 52, "Thank you for your business.", "0.36 0.33 0.40"); line(margin, 66, right, 66, "0.62 0.27 0.78");

  const content = stream.join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let output = "%PDF-1.4\n", offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(output);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new NextResponse("Not found", { status: 404 });
  const result = await pool.query(`SELECT i.*,d.delivery_no,d.delivery_date,c.client_name,b.branch_name,b.address FROM invoices i JOIN deliveries d ON d.id=i.delivery_id JOIN clients c ON c.id=d.client_id JOIN branches b ON b.id=d.branch_id WHERE i.id=$1`, [id]);
  const row = result.rows[0];
  if (!row) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(invoicePdf(row), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=${row.invoice_no}.pdf` } });
}
