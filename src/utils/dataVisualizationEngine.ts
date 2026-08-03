import type { PublisherElement } from "../types/publisher";

export type ChartType = "column" | "bar" | "line" | "area" | "pie" | "doughnut" | "scatter" | "bubble" | "radar" | "funnel" | "waterfall" | "gauge" | "histogram" | "box-plot";
export type ChartDatum = { label: string; value: number; secondary?: number };
export type CalendarView = "month" | "week" | "day" | "academic" | "fiscal" | "planner";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  color?: string;
  notes?: string;
};


export type ConditionalFormatRule = {
  operator: "gt" | "gte" | "lt" | "lte" | "equals" | "contains" | "between";
  value: string | number;
  secondValue?: string | number;
  format: Record<string, string | number | boolean>;
};

export function conditionalFormatForValue(value: unknown, rules: ConditionalFormatRule[]): Record<string, string | number | boolean> {
  const text = String(value ?? ""); const number = Number(text);
  for (const rule of rules) {
    const target = Number(rule.value); const second = Number(rule.secondValue);
    const matches = rule.operator === "contains" ? text.toLowerCase().includes(String(rule.value).toLowerCase())
      : rule.operator === "equals" ? text === String(rule.value)
      : rule.operator === "gt" ? number > target
      : rule.operator === "gte" ? number >= target
      : rule.operator === "lt" ? number < target
      : rule.operator === "lte" ? number <= target
      : rule.operator === "between" ? number >= Math.min(target, second) && number <= Math.max(target, second)
      : false;
    if (matches) return { ...rule.format };
  }
  return {};
}

export function evaluateIfFormula(formula: string): string {
  const match = formula.trim().match(/^=IF\(([-+]?\d+(?:\.\d+)?)\s*(>=|<=|<>|=|>|<)\s*([-+]?\d+(?:\.\d+)?),\s*"([^"]*)",\s*"([^"]*)"\)$/i);
  if (!match) return formula;
  const left = Number(match[1]), right = Number(match[3]);
  const ok = match[2] === ">" ? left > right : match[2] === "<" ? left < right : match[2] === ">=" ? left >= right : match[2] === "<=" ? left <= right : match[2] === "<>" ? left !== right : left === right;
  return ok ? match[4] : match[5];
}

export type TableTemplateKind = "plain" | "banded" | "professional" | "invoice" | "price-list" | "schedule";

const escapeXml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function createProfessionalTableElement(
  id: string,
  zIndex: number,
  rows = 6,
  columns = 4,
  kind: TableTemplateKind = "professional",
): PublisherElement {
  const cells = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => row === 0 ? `Column ${column + 1}` : ""),
  );
  return {
    id, name: "Professional Table", type: "table" as any,
    x: 90, y: 120, width: Math.min(720, columns * 130), height: Math.max(180, rows * 42),
    rotation: 0, zIndex, opacity: 1,
    tableRows: rows, tableColumns: columns, tableCells: cells,
    tableColumnWidths: Array.from({ length: columns }, () => 130),
    tableRowHeights: Array.from({ length: rows }, () => 42),
    tableHeaderRows: 1, tableFooterRows: 0, tableShowHeader: true,
    tableRepeatHeader: true, tableBandedRows: kind !== "plain",
    tableStyle: kind, tableHeaderFill: "#0F766E", tableHeaderTextColor: "#FFFFFF",
    tableBodyFill: "#FFFFFF", tableAlternateFill: "#F1F5F9",
    tableBorderColor: "#94A3B8", tableBorderWidth: 1,
    tableCellPadding: 8, tableVerticalAlign: "middle", tableAutoFit: "contents",
    tableCellFormats: {}, tableMerges: [],
  } as any;
}

export function formatAdvancedValue(value: unknown, format: string, locale = "en-US", currency = "USD"): string {
  const raw = String(value ?? "");
  const number = Number(raw.replace(/[$,%\s]/g, ""));
  if (format === "general" || !format) return raw;
  if (format === "text") return raw;
  if (format === "number" && Number.isFinite(number)) return new Intl.NumberFormat(locale).format(number);
  if (format === "currency" && Number.isFinite(number)) return new Intl.NumberFormat(locale, { style: "currency", currency }).format(number);
  if (format === "percent" && Number.isFinite(number)) return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(number > 1 ? number / 100 : number);
  if (format === "scientific" && Number.isFinite(number)) return number.toExponential(3);
  if (format === "fraction" && Number.isFinite(number)) {
    const whole = Math.trunc(number); const fraction = Math.abs(number - whole);
    if (!fraction) return String(whole);
    let bestN = 0, bestD = 1, bestError = Infinity;
    for (let d = 1; d <= 64; d++) { const n = Math.round(fraction * d); const error = Math.abs(fraction - n / d); if (error < bestError) { bestN = n; bestD = d; bestError = error; } }
    return `${whole ? `${whole} ` : ""}${bestN}/${bestD}`;
  }
  if (["date", "time", "datetime"].includes(format)) {
    const date = new Date(raw); if (Number.isNaN(date.valueOf())) return raw;
    if (format === "date") return date.toLocaleDateString(locale);
    if (format === "time") return date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
    return date.toLocaleString(locale);
  }
  return raw;
}

function chartPalette(index: number) {
  return ["#0F766E", "#2563EB", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2", "#65A30D", "#DB2777"][index % 8];
}

export type ChartRenderOptions = { legendPosition?: "none" | "top" | "right" | "bottom" | "left"; axisMin?: number; axisMax?: number; showGridlines?: boolean; showDataLabels?: boolean };

export function buildChartSvg(type: ChartType, data: ChartDatum[], title = "Chart", width = 720, height = 420, options: ChartRenderOptions = {}): string {
  const safe = data.length ? data : [{ label: "No data", value: 0 }];
  const margin = { left: 64, right: 30, top: 58, bottom: 60 };
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const rawMax = Math.max(1, ...safe.map((item) => Math.abs(item.value)));
  const max = Number.isFinite(options.axisMax) ? Math.max(1, Math.abs(options.axisMax as number)) : rawMax;
  const min = Number.isFinite(options.axisMin) ? (options.axisMin as number) : 0;
  let body = `<rect width="${width}" height="${height}" rx="16" fill="#fff"/><text x="${width / 2}" y="32" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#0F172A">${escapeXml(title)}</text>`;
  if (type === "pie" || type === "doughnut") {
    const total = safe.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1;
    let angle = -Math.PI / 2; const cx = width * .38, cy = height * .54, radius = Math.min(plotW, plotH) * .34;
    safe.forEach((item, index) => {
      const next = angle + (Math.max(0, item.value) / total) * Math.PI * 2;
      const x1 = cx + radius * Math.cos(angle), y1 = cy + radius * Math.sin(angle);
      const x2 = cx + radius * Math.cos(next), y2 = cy + radius * Math.sin(next);
      const large = next - angle > Math.PI ? 1 : 0;
      body += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z" fill="${chartPalette(index)}"/>`;
      angle = next;
    });
    if (type === "doughnut") body += `<circle cx="${cx}" cy="${cy}" r="${radius * .52}" fill="#fff"/>`;
    safe.forEach((item, i) => { body += `<rect x="${width * .69}" y="${90 + i * 30}" width="14" height="14" rx="3" fill="${chartPalette(i)}"/><text x="${width * .69 + 22}" y="${102 + i * 30}" font-family="Arial" font-size="13" fill="#334155">${escapeXml(item.label)} (${escapeXml(item.value)})</text>`; });
  } else if (type === "gauge") {
    const cx=width/2, cy=height*.72, radius=Math.min(plotW,plotH)*.48, value=Math.max(0,Math.min(100,safe[0]?.value??0));
    body += `<path d="M ${cx-radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx+radius} ${cy}" fill="none" stroke="#E2E8F0" stroke-width="34"/>`;
    const a=Math.PI-(value/100)*Math.PI, x=cx+radius*Math.cos(a), y=cy-radius*Math.sin(a);
    body += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#0F766E" stroke-width="8" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="12" fill="#0F766E"/><text x="${cx}" y="${cy+55}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700">${value}%</text>`;
  } else if (type === "funnel") {
    safe.slice().sort((a,b)=>b.value-a.value).forEach((item,i,arr)=>{ const top=plotW*(1-i/(arr.length+1)), bottom=plotW*(1-(i+1)/(arr.length+1)), y=margin.top+i*(plotH/arr.length), h=plotH/arr.length-4, cx=width/2; body += `<path d="M ${cx-top/2} ${y} L ${cx+top/2} ${y} L ${cx+bottom/2} ${y+h} L ${cx-bottom/2} ${y+h} Z" fill="${chartPalette(i)}"/><text x="${cx}" y="${y+h/2+5}" text-anchor="middle" font-family="Arial" font-size="13" fill="#fff">${escapeXml(item.label)} ${item.value}</text>`; });
  } else if (type === "waterfall") {
    let running=0; const step=plotW/safe.length; safe.forEach((item,i)=>{ const before=running; running+=item.value; const y1=margin.top+plotH-Math.max(0,before)/Math.max(max,Math.abs(running),1)*plotH, y2=margin.top+plotH-Math.max(0,running)/Math.max(max,Math.abs(running),1)*plotH; const y=Math.min(y1,y2), h=Math.max(3,Math.abs(y2-y1)); body += `<rect x="${margin.left+i*step+step*.18}" y="${y}" width="${step*.64}" height="${h}" fill="${item.value>=0?'#0F766E':'#DC2626'}"/><text x="${margin.left+i*step+step/2}" y="${margin.top+plotH+22}" text-anchor="middle" font-family="Arial" font-size="10">${escapeXml(item.label)}</text>`; });
  } else if (type === "box-plot") {
    const values=safe.map(x=>x.value).sort((a,b)=>a-b), q=(p: number)=>values[Math.min(values.length-1,Math.floor((values.length-1)*p))]??0; const min=q(0),q1=q(.25),med=q(.5),q3=q(.75),mx=q(1), scale=(v: number)=>margin.left+(v-min)/(mx-min||1)*plotW, y=height/2; body += `<line x1="${scale(min)}" y1="${y}" x2="${scale(mx)}" y2="${y}" stroke="#334155" stroke-width="3"/><rect x="${scale(q1)}" y="${y-55}" width="${Math.max(2,scale(q3)-scale(q1))}" height="110" fill="#CCFBF1" stroke="#0F766E" stroke-width="3"/><line x1="${scale(med)}" y1="${y-55}" x2="${scale(med)}" y2="${y+55}" stroke="#0F766E" stroke-width="4"/>`;
  } else if (type === "radar") {
    const cx = width / 2, cy = height / 2 + 20, radius = Math.min(plotW, plotH) * .4;
    for (let ring = 1; ring <= 5; ring++) {
      const points = safe.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / safe.length; return `${cx + radius * ring / 5 * Math.cos(a)},${cy + radius * ring / 5 * Math.sin(a)}`; }).join(" ");
      body += `<polygon points="${points}" fill="none" stroke="#CBD5E1"/>`;
    }
    const points = safe.map((item, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / safe.length; const r = radius * Math.max(0, item.value) / max; body += `<text x="${cx + (radius + 22) * Math.cos(a)}" y="${cy + (radius + 22) * Math.sin(a)}" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">${escapeXml(item.label)}</text>`; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" ");
    body += `<polygon points="${points}" fill="#0F766E55" stroke="#0F766E" stroke-width="3"/>`;
  } else {
    if (options.showGridlines !== false) { for (let g=0; g<=5; g+=1) { const gy=margin.top+plotH-(g/5)*plotH; body += `<line x1="${margin.left}" y1="${gy}" x2="${margin.left+plotW}" y2="${gy}" stroke="#E2E8F0"/>`; } }
    body += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#64748B"/><line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="#64748B"/>`;
    const step = plotW / safe.length;
    if (type === "line" || type === "area" || type === "scatter" || type === "bubble") {
      const points = safe.map((item, i) => `${margin.left + step * (i + .5)},${margin.top + plotH - Math.max(0, item.value-min) / Math.max(1,max-min) * plotH}`).join(" ");
      if (type === "area") body += `<polygon points="${margin.left + step * .5},${margin.top + plotH} ${points} ${margin.left + step * (safe.length - .5)},${margin.top + plotH}" fill="#0F766E33"/>`;
      if (type !== "scatter" && type !== "bubble") body += `<polyline points="${points}" fill="none" stroke="#0F766E" stroke-width="4" stroke-linejoin="round"/>`;
      safe.forEach((item, i) => { const x = margin.left + step * (i + .5), y = margin.top + plotH - Math.max(0, item.value-min) / Math.max(1,max-min) * plotH; body += `<circle cx="${x}" cy="${y}" r="${type === "bubble" ? Math.max(6, Math.min(24, Math.abs(item.secondary ?? item.value) / max * 24)) : 6}" fill="${chartPalette(i)}"/><text x="${x}" y="${margin.top + plotH + 24}" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">${escapeXml(item.label)}</text>${options.showDataLabels?`<text x="${x}" y="${y-10}" text-anchor="middle" font-family="Arial" font-size="11" fill="#0F172A">${escapeXml(item.value)}</text>`:""}`; });
    } else {
      safe.forEach((item, i) => {
        if (type === "bar") { const barH = plotH / safe.length * .62, y = margin.top + i * plotH / safe.length + 8, w = Math.max(1, Math.max(0, item.value) / max * plotW); body += `<rect x="${margin.left}" y="${y}" width="${w}" height="${barH}" rx="5" fill="${chartPalette(i)}"/><text x="${margin.left - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-family="Arial" font-size="11">${escapeXml(item.label)}</text>`; }
        else { const barW = step * .62, x = margin.left + i * step + (step - barW) / 2, h = Math.max(1, Math.max(0, item.value-min) / Math.max(1,max-min) * plotH), y = margin.top + plotH - h; body += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="${chartPalette(i)}"/><text x="${x + barW / 2}" y="${margin.top + plotH + 24}" text-anchor="middle" font-family="Arial" font-size="11">${escapeXml(item.label)}</text>${options.showDataLabels?`<text x="${x+barW/2}" y="${Math.max(margin.top+12,y-6)}" text-anchor="middle" font-family="Arial" font-size="11" fill="#0F172A">${escapeXml(item.value)}</text>`:""}`; }
      });
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

export function createChartElement(id: string, zIndex: number, type: ChartType, data: ChartDatum[], title: string): PublisherElement {
  const svgMarkup = buildChartSvg(type, data, title);
  return { id, name: title || "Chart", type: "svg", x: 80, y: 100, width: 720, height: 420, rotation: 0, zIndex, opacity: 1, svgMarkup, svgOriginalMarkup: svgMarkup, svgViewBox: "0 0 720 420", assetKind: "custom", editableVector: true, chartType: type, chartData: data, chartTitle: title } as any;
}

export function monthMatrix(year: number, month: number, weekStartsMonday = false): Array<Array<number | null>> {
  const first = new Date(year, month, 1); const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() - (weekStartsMonday ? 1 : 0) + 7) % 7;
  const cells: Array<number | null> = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export function createCalendarElement(id: string, zIndex: number, year: number, month: number, events: CalendarEvent[] = [], weekStartsMonday = false): PublisherElement {
  const weekdays = weekStartsMonday ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const matrix = monthMatrix(year, month, weekStartsMonday);
  const cells = [weekdays, ...matrix.map((week) => week.map((day) => {
    if (!day) return "";
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = events.filter((event) => event.date.slice(0, 10) === iso);
    return [String(day), ...dayEvents.map((event) => `${event.time ? `${event.time} ` : ""}${event.title}`)].join("\n");
  }))];
  const title = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return {
    ...createProfessionalTableElement(id, zIndex, cells.length, 7, "schedule"),
    name: `${title} Calendar`, width: 760, height: Math.max(420, cells.length * 82), tableCells: cells,
    tableRowHeights: [42, ...Array.from({ length: cells.length - 1 }, () => 82)],
    tableHeaderFill: "#1D4ED8", tableAlternateFill: "#EFF6FF", tableCellPadding: 7,
    calendarView: "month", calendarYear: year, calendarMonth: month, calendarEvents: events,
  } as any;
}

export function createScheduleElement(id: string, zIndex: number, view: Exclude<CalendarView, "month">): PublisherElement {
  const headers = view === "day" ? ["Time", "Activity", "Owner", "Status"] : ["Date", "Time", "Event", "Location", "Owner"];
  const rows = view === "week" ? 8 : view === "academic" || view === "fiscal" ? 13 : 10;
  const element = createProfessionalTableElement(id, zIndex, rows, headers.length, "schedule") as any;
  element.name = `${view[0].toUpperCase()}${view.slice(1)} Schedule`;
  element.tableCells[0] = headers;
  element.calendarView = view;
  element.width = Math.min(800, headers.length * 145);
  return element;
}
