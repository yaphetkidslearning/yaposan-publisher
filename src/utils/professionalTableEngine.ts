export type CellCoord = { row: number; column: number };
export type CellRange = { startRow: number; startColumn: number; endRow: number; endColumn: number };
type AnyTable = Record<string, any>;

const cellKey = (row: number, column: number) => `${row}:${column}`;
const cloneCells = (table: AnyTable): string[][] => (table.tableCells ?? []).map((row: any[]) => row.map((v) => String(v ?? "")));

export function normalizeCellRange(a: CellCoord, b: CellCoord): CellRange {
  return { startRow: Math.min(a.row, b.row), startColumn: Math.min(a.column, b.column), endRow: Math.max(a.row, b.row), endColumn: Math.max(a.column, b.column) };
}

export function activeRange(table: AnyTable): CellRange {
  const a = table.tableSelectionStart ?? table.tableActiveCell ?? { row: 0, column: 0 };
  const b = table.tableSelectionEnd ?? a;
  return normalizeCellRange(a, b);
}

export function selectWholeRow(table: AnyTable, row: number, extend = false): AnyTable {
  const last = Math.max(0, Number(table.tableColumns ?? 1) - 1);
  const start = extend && table.tableSelectionStart ? table.tableSelectionStart : { row, column: 0 };
  return { ...table, tableSelectionStart: start, tableSelectionEnd: { row, column: last }, tableActiveCell: { row, column: 0 }, tableSelectionKind: "row" };
}

export function selectWholeColumn(table: AnyTable, column: number, extend = false): AnyTable {
  const last = Math.max(0, Number(table.tableRows ?? 1) - 1);
  const start = extend && table.tableSelectionStart ? table.tableSelectionStart : { row: 0, column };
  return { ...table, tableSelectionStart: start, tableSelectionEnd: { row: last, column }, tableActiveCell: { row: 0, column }, tableSelectionKind: "column" };
}

export function copyCellRange(table: AnyTable): { rows: string[][]; formats: Record<string, any>; width: number; height: number } {
  const range = activeRange(table); const cells = cloneCells(table); const formats = table.tableCellFormats ?? {}; const copied: Record<string, any> = {};
  const rows = Array.from({ length: range.endRow - range.startRow + 1 }, (_, r) => Array.from({ length: range.endColumn - range.startColumn + 1 }, (_, c) => cells[range.startRow + r]?.[range.startColumn + c] ?? ""));
  for (let r = range.startRow; r <= range.endRow; r++) for (let c = range.startColumn; c <= range.endColumn; c++) if (formats[cellKey(r,c)]) copied[cellKey(r-range.startRow,c-range.startColumn)] = { ...formats[cellKey(r,c)] };
  return { rows, formats: copied, width: rows[0]?.length ?? 0, height: rows.length };
}

export function pasteCellRange(table: AnyTable, clipboard: ReturnType<typeof copyCellRange>): AnyTable {
  if (!clipboard?.rows?.length) return table;
  const start = table.tableActiveCell ?? table.tableSelectionStart ?? { row: 0, column: 0 };
  const rows = Number(table.tableRows ?? 1), columns = Number(table.tableColumns ?? 1); const cells = cloneCells(table); const formats = { ...(table.tableCellFormats ?? {}) };
  for (let r = 0; r < clipboard.height; r++) for (let c = 0; c < clipboard.width; c++) {
    const tr = start.row + r, tc = start.column + c; if (tr >= rows || tc >= columns) continue;
    cells[tr][tc] = clipboard.rows[r]?.[c] ?? ""; const fmt = clipboard.formats[cellKey(r,c)]; if (fmt) formats[cellKey(tr,tc)] = { ...fmt };
  }
  return { ...table, tableCells: cells, tableCellFormats: formats, tableSelectionStart: start, tableSelectionEnd: { row: Math.min(rows-1,start.row+clipboard.height-1), column: Math.min(columns-1,start.column+clipboard.width-1) } };
}

export function cutCellRange(table: AnyTable) { const clipboard = copyCellRange(table); const range = activeRange(table), cells = cloneCells(table), formats = { ...(table.tableCellFormats ?? {}) };
  for (let r=range.startRow;r<=range.endRow;r++) for(let c=range.startColumn;c<=range.endColumn;c++){ cells[r][c]=""; delete formats[cellKey(r,c)]; }
  return { table: { ...table, tableCells: cells, tableCellFormats: formats }, clipboard };
}

function rangesOverlap(a: CellRange, b: CellRange) { return !(a.endRow < b.startRow || a.startRow > b.endRow || a.endColumn < b.startColumn || a.startColumn > b.endColumn); }
export function validateMerge(table: AnyTable, range: CellRange): string | null {
  if (range.startRow===range.endRow && range.startColumn===range.endColumn) return "Select at least two cells.";
  const overlap = (table.tableMerges ?? []).find((m: any) => rangesOverlap(m, range));
  return overlap ? "The selection overlaps an existing merged region." : null;
}

export function mergeRangePreservingContents(table: AnyTable): AnyTable {
  const range=activeRange(table); const error=validateMerge(table,range); if(error) return {...table,tableLastError:error};
  const cells=cloneCells(table), backup:Record<string,string>={}, values:string[]=[];
  for(let r=range.startRow;r<=range.endRow;r++) for(let c=range.startColumn;c<=range.endColumn;c++){ backup[cellKey(r,c)]=cells[r]?.[c]??""; if(String(cells[r]?.[c]??"").trim()) values.push(String(cells[r][c])); if(!(r===range.startRow&&c===range.startColumn)) cells[r][c]=""; }
  cells[range.startRow][range.startColumn]=values.join(" ");
  return {...table,tableCells:cells,tableMerges:[...(table.tableMerges??[]),{...range,id:`merge-${Date.now()}`,backup}],tableLastError:undefined};
}

export function splitMergeRestoringContents(table:AnyTable):AnyTable { const range=activeRange(table); const cells=cloneCells(table); const keep:any[]=[];
  for(const m of table.tableMerges??[]){ if(!rangesOverlap(m,range)){keep.push(m);continue;} if(m.backup) for(const [k,v] of Object.entries(m.backup)){const [r,c]=k.split(":").map(Number); if(cells[r]) cells[r][c]=String(v??"");} }
  return {...table,tableCells:cells,tableMerges:keep}; }

function shiftCoord(value:number,index:number,delta:number,removeCount=0){ if(delta>0) return value>=index?value+delta:value; if(value>=index+removeCount) return value-removeCount; return value>=index?index:value; }
export function shiftTableMetadata(table:AnyTable,axis:"row"|"column",index:number,delta:number,removeCount=0):AnyTable {
  const merges=(table.tableMerges??[]).map((m:any)=>{ const x={...m}; if(axis==="row"){x.startRow=shiftCoord(x.startRow,index,delta,removeCount);x.endRow=shiftCoord(x.endRow,index,delta,removeCount);}else{x.startColumn=shiftCoord(x.startColumn,index,delta,removeCount);x.endColumn=shiftCoord(x.endColumn,index,delta,removeCount);} return x; }).filter((m:any)=>m.endRow>=m.startRow&&m.endColumn>=m.startColumn);
  const formats:Record<string,any>={}; for(const [k,v] of Object.entries(table.tableCellFormats??{})){let [r,c]=k.split(":").map(Number); if(axis==="row"){if(delta<0&&r>=index&&r<index+removeCount)continue;r=shiftCoord(r,index,delta,removeCount);}else{if(delta<0&&c>=index&&c<index+removeCount)continue;c=shiftCoord(c,index,delta,removeCount);} formats[cellKey(r,c)]=v;}
  return {...table,tableMerges:merges,tableCellFormats:formats};
}

export function resizeColumn(table:AnyTable,column:number,width:number):AnyTable {const values=Array.from({length:table.tableColumns??1},(_,i)=>Number(table.tableColumnWidths?.[i]??120));values[column]=Math.max(28,width);return{...table,tableColumnWidths:values,width:values.reduce((a,b)=>a+b,0)};}
export function resizeRow(table:AnyTable,row:number,height:number):AnyTable {const values=Array.from({length:table.tableRows??1},(_,i)=>Number(table.tableRowHeights?.[i]??44));values[row]=Math.max(22,height);return{...table,tableRowHeights:values,height:values.reduce((a,b)=>a+b,0)};}

export function reorderRows(table:AnyTable,from:number,to:number):AnyTable {if(from===to)return table;const cells=cloneCells(table),heights=[...(table.tableRowHeights??[])];const [row]=cells.splice(from,1);cells.splice(to,0,row);if(heights.length){const[h]=heights.splice(from,1);heights.splice(to,0,h);}return{...table,tableCells:cells,tableRowHeights:heights,tableMerges:[]};}
export function reorderColumns(table:AnyTable,from:number,to:number):AnyTable {if(from===to)return table;const cells=cloneCells(table).map(row=>{const[v]=row.splice(from,1);row.splice(to,0,v);return row;});const widths=[...(table.tableColumnWidths??[])];if(widths.length){const[w]=widths.splice(from,1);widths.splice(to,0,w);}return{...table,tableCells:cells,tableColumnWidths:widths,tableMerges:[]};}

function colIndex(label:string){let n=0;for(const ch of label.toUpperCase())n=n*26+(ch.charCodeAt(0)-64);return n-1;}
function coord(ref:string){const m=/^([A-Z]+)(\d+)$/i.exec(ref.trim());return m?{column:colIndex(m[1]),row:Number(m[2])-1}:null;}
function valueAt(table:AnyTable,ref:string,stack:Set<string>):number {const p=coord(ref);if(!p)return NaN;const raw=String(table.tableCells?.[p.row]?.[p.column]??"");if(raw.startsWith("=")){if(stack.has(ref))throw new Error("#CIRC!");stack.add(ref);const v=evaluateFormula(raw,table,stack);stack.delete(ref);return Number(v);}const n=Number(raw.replace(/[$,%]/g,""));return Number.isFinite(n)?n:0;}
function valuesForRange(table:AnyTable,a:string,b:string,stack:Set<string>){const x=coord(a),y=coord(b);if(!x||!y)return[];const out:number[]=[];for(let r=Math.min(x.row,y.row);r<=Math.max(x.row,y.row);r++)for(let c=Math.min(x.column,y.column);c<=Math.max(x.column,y.column);c++){const letters=String.fromCharCode(65+c);out.push(valueAt(table,`${letters}${r+1}`,stack));}return out;}
export function evaluateFormula(formula:string,table:AnyTable,stack=new Set<string>()):string {if(!formula.startsWith("="))return formula;try{let expr=formula.slice(1).toUpperCase();expr=expr.replace(/(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)/g,(_,fn,a,b)=>{const vals=valuesForRange(table,a,b,stack).filter(Number.isFinite);if(fn==="SUM")return String(vals.reduce((x,y)=>x+y,0));if(fn==="AVERAGE")return String(vals.reduce((x,y)=>x+y,0)/(vals.length||1));if(fn==="MIN")return String(vals.length?Math.min(...vals):0);if(fn==="MAX")return String(vals.length?Math.max(...vals):0);return String(vals.length);});expr=expr.replace(/[A-Z]+\d+/g,(ref)=>String(valueAt(table,ref,stack)));if(!/^[0-9+\-*/().\s]+$/.test(expr))return"#VALUE!";const result=Function(`"use strict";return (${expr})`)();if(!Number.isFinite(result))return result===Infinity?"#DIV/0!":"#VALUE!";return String(Math.round(result*1e10)/1e10);}catch(error:any){const m=String(error?.message??error);return m.includes("CIRC")?"#CIRC!":m.includes("REF")?"#REF!":"#VALUE!";}}

export function applyMultiColumnSort(table:AnyTable,sorts:Array<{column:number;direction:"asc"|"desc";type?:"text"|"number"|"date"}>):AnyTable {const header=Number(table.tableHeaderRows??0),head=cloneCells(table).slice(0,header),body=cloneCells(table).slice(header);body.sort((a,b)=>{for(const s of sorts){let av:any=a[s.column]??"",bv:any=b[s.column]??"";if(s.type==="number"){av=Number(av);bv=Number(bv);}else if(s.type==="date"){av=new Date(av).valueOf();bv=new Date(bv).valueOf();}else{av=String(av).toLowerCase();bv=String(bv).toLowerCase();}if(av<bv)return s.direction==="asc"?-1:1;if(av>bv)return s.direction==="asc"?1:-1;}return 0;});return{...table,tableCells:[...head,...body],tableSorts:sorts};}
export function applyColumnFilters(table:AnyTable,filters:Array<{column:number;operator:"contains"|"equals"|"gt"|"lt"|"before"|"after";value:string}>):AnyTable{return{...table,tableFilters:filters};}
export function visibleRowsAdvanced(table:AnyTable):number[]{const rows=Number(table.tableRows??1),header=Number(table.tableHeaderRows??0),filters=table.tableFilters??[];return Array.from({length:rows},(_,i)=>i).filter(r=>r<header||filters.every((f:any)=>{const raw=String(table.tableCells?.[r]?.[f.column]??"");if(f.operator==="contains")return raw.toLowerCase().includes(String(f.value).toLowerCase());if(f.operator==="equals")return raw===String(f.value);if(f.operator==="gt")return Number(raw)>Number(f.value);if(f.operator==="lt")return Number(raw)<Number(f.value);if(f.operator==="before")return new Date(raw)<new Date(f.value);if(f.operator==="after")return new Date(raw)>new Date(f.value);return true;}));}

export function tableAccessibilityLabel(table:AnyTable,row:number,column:number){const header=Number(table.tableHeaderRows??0);const columnName=String(table.tableCells?.[Math.max(0,header-1)]?.[column]??`Column ${column+1}`);return `${row<header?"Header":"Cell"}, row ${row+1}, column ${column+1}, ${columnName}`;}
