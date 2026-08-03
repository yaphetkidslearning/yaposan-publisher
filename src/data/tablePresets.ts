export type TablePreset = {
  id: string;
  name: string;
  rows: number;
  columns: number;
  headerRows?: number;
  headerColumns?: number;
  style: "plain" | "banded" | "professional" | "invoice" | "calendar" | "price-list";
};

export const TABLE_PRESETS: TablePreset[] = [
  { id: "table-2x2", name: "2 x 2 Table", rows: 2, columns: 2, headerRows: 1, style: "plain" },
  { id: "table-3x3", name: "3 x 3 Table", rows: 3, columns: 3, headerRows: 1, style: "banded" },
  { id: "table-4x4", name: "4 x 4 Table", rows: 4, columns: 4, headerRows: 1, style: "professional" },
  { id: "price-list", name: "Price List", rows: 6, columns: 3, headerRows: 1, style: "price-list" },
  { id: "invoice", name: "Invoice Table", rows: 7, columns: 5, headerRows: 1, style: "invoice" },
  { id: "weekly-calendar", name: "Weekly Calendar", rows: 6, columns: 7, headerRows: 1, style: "calendar" },
];
