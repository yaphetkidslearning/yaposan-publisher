import type { TablePreset } from "../data/tablePresets";

type AnyElement = Record<string, any>;

export function makeTableCells(rows: number, columns: number, preset?: TablePreset): string[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      if (preset?.style === "calendar" && row === 0) return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][column] ?? "";
      if (preset?.style === "invoice" && row === 0) return ["ITEM", "DESCRIPTION", "QTY", "RATE", "AMOUNT"][column] ?? "";
      if (preset?.style === "price-list" && row === 0) return ["ITEM", "DESCRIPTION", "PRICE"][column] ?? "";
      if (row === 0) return `Column ${column + 1}`;
      return "";
    }),
  );
}

export function createTableElement(preset: TablePreset, x: number, y: number, zIndex: number, id: string): AnyElement {
  const columnWidth = preset.style === "calendar" ? 92 : preset.style === "invoice" ? 120 : 135;
  const rowHeight = preset.style === "calendar" ? 70 : 44;
  return {
    id,
    name: preset.name,
    type: "table",
    x,
    y,
    width: Math.max(280, preset.columns * columnWidth),
    height: Math.max(120, preset.rows * rowHeight),
    rotation: 0,
    zIndex,
    opacity: 1,
    tableRows: preset.rows,
    tableColumns: preset.columns,
    tableCells: makeTableCells(preset.rows, preset.columns, preset),
    tableHeaderRows: preset.headerRows ?? 0,
    tableHeaderColumns: preset.headerColumns ?? 0,
    tableStyle: preset.style,
    tableBorderColor: "#94A3B8",
    tableBorderWidth: 1,
    tableCellPadding: 8,
    tableHeaderFill: "#0F766E",
    tableHeaderTextColor: "#FFFFFF",
    tableBodyFill: "#FFFFFF",
    tableAlternateFill: "#F1F5F9",
    tableTextColor: "#172033",
    tableFontSize: 14,
    tableFontFamily: "Arial",
    tableBoldHeader: true,
    tableBandedRows: preset.style !== "plain",
    tableBandedColumns: false,
    tableShowHeader: true,
    tableVerticalAlign: "middle",
    tableTextAlign: "left",
    tableSelectionStart: { row: 0, column: 0 },
    tableSelectionEnd: { row: 0, column: 0 },
    tableActiveCell: { row: 0, column: 0 },
    tableCellFormats: {},
    tableMerges: [],
    tableColumnWidths: Array.from({ length: preset.columns }, () => columnWidth),
    tableRowHeights: Array.from({ length: preset.rows }, () => rowHeight),
    tableRepeatHeader: true,
    tableAllowPageSplit: true,
    tableCurrency: "USD",
    fillColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
  };
}

export function resizeTableData(element: AnyElement, rows: number, columns: number): AnyElement {
  const old = Array.isArray(element.tableCells) ? element.tableCells : [];
  const cells = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => old[row]?.[column] ?? (row === 0 ? `Column ${column + 1}` : "")),
  );
  return { ...element, tableRows: rows, tableColumns: columns, tableCells: cells };
}

export function addTableRow(element: AnyElement, index?: number): AnyElement {
  const rows = element.tableRows ?? 1;
  const columns = element.tableColumns ?? 1;
  const insertAt = Math.max(0, Math.min(rows, index ?? rows));
  const cells = [...(element.tableCells ?? [])];
  cells.splice(insertAt, 0, Array.from({ length: columns }, () => ""));
  return { ...element, tableRows: rows + 1, tableCells: cells };
}

export function deleteTableRow(element: AnyElement, index?: number): AnyElement {
  const rows = Math.max(1, element.tableRows ?? 1);
  if (rows <= 1) return element;
  const removeAt = Math.max(0, Math.min(rows - 1, index ?? rows - 1));
  const cells = [...(element.tableCells ?? [])];
  cells.splice(removeAt, 1);
  return { ...element, tableRows: rows - 1, tableCells: cells };
}

export function addTableColumn(element: AnyElement, index?: number): AnyElement {
  const columns = element.tableColumns ?? 1;
  const insertAt = Math.max(0, Math.min(columns, index ?? columns));
  const cells = (element.tableCells ?? []).map((row: string[]) => {
    const copy = [...row]; copy.splice(insertAt, 0, ""); return copy;
  });
  return { ...element, tableColumns: columns + 1, tableCells: cells };
}

export function deleteTableColumn(element: AnyElement, index?: number): AnyElement {
  const columns = Math.max(1, element.tableColumns ?? 1);
  if (columns <= 1) return element;
  const removeAt = Math.max(0, Math.min(columns - 1, index ?? columns - 1));
  const cells = (element.tableCells ?? []).map((row: string[]) => row.filter((_: string, i: number) => i !== removeAt));
  return { ...element, tableColumns: columns - 1, tableCells: cells };
}

export function updateTableCell(element: AnyElement, row: number, column: number, text: string): AnyElement {
  const cells = (element.tableCells ?? []).map((items: string[]) => [...items]);
  if (!cells[row]) cells[row] = [];
  cells[row][column] = text;
  return { ...element, tableCells: cells };
}

export function csvToTable(csv: string): { rows: number; columns: number; cells: string[][] } {
  let rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < csv.length; i++) { const ch = csv[i]; if (ch === "\"") { if (quoted && csv[i + 1] === "\"") { cell += "\""; i++; } else quoted = !quoted; } else if (ch === "," && !quoted) { row.push(cell); cell = ""; } else if ((ch === "\n" || ch === "\r") && !quoted) { if (ch === "\r" && csv[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += ch; }
  row.push(cell); if (row.length > 1 || row[0] !== "") rows.push(row);
  const columns = Math.max(1, ...rows.map((r) => r.length)); rows = rows.map((r) => [...r, ...Array.from({ length: columns - r.length }, () => "")]);
  return { rows: Math.max(1, rows.length), columns, cells: rows.length ? rows : [[""]] };
}

export function tableToCsv(element: AnyElement): string {
  return (element.tableCells ?? []).map((row: string[]) => row.map((cell) => {
    const value = String(cell ?? "");
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",")).join("\n");
}
