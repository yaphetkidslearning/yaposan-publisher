export type TableCellCoord = { row: number; column: number };
export type TableCellRange = { startRow: number; startColumn: number; endRow: number; endColumn: number };
export type TableCellFormat = {
  fillColor?: string; textColor?: string; fontFamily?: string; fontSize?: number;
  bold?: boolean; italic?: boolean; underline?: boolean;
  textAlign?: "left" | "center" | "right"; verticalAlign?: "top" | "middle" | "bottom";
  padding?: number; wrap?: boolean; numberFormat?: "general" | "number" | "currency" | "percent" | "date";
  borderTop?: boolean; borderRight?: boolean; borderBottom?: boolean; borderLeft?: boolean;
  borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "dashed" | "dotted";
};
export type TableMerge = TableCellRange & { id: string };

type AnyTable = Record<string, any>;
const key = (r:number,c:number) => `${r}:${c}`;
export function normalizeRange(a: TableCellCoord, b: TableCellCoord): TableCellRange {
  return { startRow: Math.min(a.row,b.row), startColumn: Math.min(a.column,b.column), endRow: Math.max(a.row,b.row), endColumn: Math.max(a.column,b.column) };
}
export function getSelectedRange(table: AnyTable): TableCellRange {
  const a = table.tableSelectionStart ?? {row:0,column:0};
  const b = table.tableSelectionEnd ?? a;
  return normalizeRange(a,b);
}
export function selectTableCell(table: AnyTable, row:number, column:number, extend=false): AnyTable {
  const start = extend && table.tableSelectionStart ? table.tableSelectionStart : {row,column};
  return {...table, tableSelectionStart:start, tableSelectionEnd:{row,column}, tableActiveCell:{row,column}};
}
export function clearSelectedCells(table:AnyTable):AnyTable {
  const range=getSelectedRange(table); const cells=(table.tableCells??[]).map((r:any[])=>[...r]);
  for(let r=range.startRow;r<=range.endRow;r++) for(let c=range.startColumn;c<=range.endColumn;c++) if(cells[r]) cells[r][c]="";
  return {...table,tableCells:cells};
}
export function formatSelectedCells(table:AnyTable, format:TableCellFormat):AnyTable {
  const range=getSelectedRange(table); const formats={...(table.tableCellFormats??{})};
  for(let r=range.startRow;r<=range.endRow;r++) for(let c=range.startColumn;c<=range.endColumn;c++) formats[key(r,c)]={...(formats[key(r,c)]??{}),...format};
  return {...table,tableCellFormats:formats};
}
export function mergeSelectedCells(table:AnyTable):AnyTable {
  const range=getSelectedRange(table); if(range.startRow===range.endRow && range.startColumn===range.endColumn) return table;
  const merges:TableMerge[]=[...(table.tableMerges??[])].filter(m=>m.endRow<range.startRow||m.startRow>range.endRow||m.endColumn<range.startColumn||m.startColumn>range.endColumn);
  merges.push({...range,id:`merge-${Date.now()}`});
  const cells=(table.tableCells??[]).map((r:any[])=>[...r]);
  const combined=[] as string[];
  for(let r=range.startRow;r<=range.endRow;r++) for(let c=range.startColumn;c<=range.endColumn;c++) if(String(cells[r]?.[c]??"").trim()) combined.push(String(cells[r][c]));
  if(cells[range.startRow]) cells[range.startRow][range.startColumn]=combined.join(" ");
  return {...table,tableMerges:merges,tableCells:cells};
}
export function splitSelectedCells(table:AnyTable):AnyTable {
  const range=getSelectedRange(table); return {...table,tableMerges:(table.tableMerges??[]).filter((m:TableMerge)=>m.endRow<range.startRow||m.startRow>range.endRow||m.endColumn<range.startColumn||m.startColumn>range.endColumn)};
}
export function insertRowAtSelection(table:AnyTable, after=false):AnyTable {
  const range=getSelectedRange(table), index=(after?range.endRow+1:range.startRow), cols=table.tableColumns??1;
  const cells=[...(table.tableCells??[])]; cells.splice(index,0,Array.from({length:cols},()=>""));
  return {...table,tableRows:(table.tableRows??1)+1,tableCells:cells,tableRowHeights:insertNumber(table.tableRowHeights,index,44)};
}
export function deleteSelectedRows(table:AnyTable):AnyTable {
  const range=getSelectedRange(table), count=range.endRow-range.startRow+1, rows=table.tableRows??1; if(rows<=count) return table;
  const cells=[...(table.tableCells??[])]; cells.splice(range.startRow,count);
  return {...table,tableRows:rows-count,tableCells:cells,tableRowHeights:removeNumbers(table.tableRowHeights,range.startRow,count),tableSelectionStart:{row:Math.min(range.startRow,rows-count-1),column:0},tableSelectionEnd:{row:Math.min(range.startRow,rows-count-1),column:0}};
}
export function insertColumnAtSelection(table:AnyTable, after=false):AnyTable {
  const range=getSelectedRange(table), index=(after?range.endColumn+1:range.startColumn);
  const cells=(table.tableCells??[]).map((r:any[])=>{const x=[...r];x.splice(index,0,"");return x;});
  return {...table,tableColumns:(table.tableColumns??1)+1,tableCells:cells,tableColumnWidths:insertNumber(table.tableColumnWidths,index,120)};
}
export function deleteSelectedColumns(table:AnyTable):AnyTable {
  const range=getSelectedRange(table), count=range.endColumn-range.startColumn+1, cols=table.tableColumns??1; if(cols<=count) return table;
  const cells=(table.tableCells??[]).map((r:any[])=>{const x=[...r];x.splice(range.startColumn,count);return x;});
  return {...table,tableColumns:cols-count,tableCells:cells,tableColumnWidths:removeNumbers(table.tableColumnWidths,range.startColumn,count)};
}
function insertNumber(values:any,index:number,value:number){const x=Array.isArray(values)?[...values]:[];x.splice(index,0,value);return x;}
function removeNumbers(values:any,index:number,count:number){const x=Array.isArray(values)?[...values]:[];x.splice(index,count);return x;}
export function distributeTableColumns(table:AnyTable):AnyTable {const cols=table.tableColumns??1;return {...table,tableColumnWidths:Array.from({length:cols},()=>Math.max(40,(table.width??cols*120)/cols))};}
export function distributeTableRows(table:AnyTable):AnyTable {const rows=table.tableRows??1;return {...table,tableRowHeights:Array.from({length:rows},()=>Math.max(24,(table.height??rows*44)/rows))};}
export function autoFitTableContents(table:AnyTable):AnyTable {
  const rows=table.tableRows??1,cols=table.tableColumns??1,cells=table.tableCells??[];
  const widths=Array.from({length:cols},(_,c)=>Math.min(320,Math.max(56,...Array.from({length:rows},(_,r)=>String(cells[r]?.[c]??"").length*8+24))));
const heights = Array.from(
  { length: rows },
  (_, rowIndex) => {
    const longestCellLength = Math.max(
      1,
      ...Array.from(
        { length: cols },
        (_, columnIndex) =>
          String(
            cells[rowIndex]?.[columnIndex] ?? "",
          ).length,
      ),
    );

    const estimatedLines = Math.ceil(
      longestCellLength / 24,
    );

    return Math.min(
      180,
      Math.max(
        32,
        estimatedLines * 22 + 12,
      ),
    );
  },
);
  return {...table,tableColumnWidths:widths,tableRowHeights:heights,width:widths.reduce((a,b)=>a+b,0),height:heights.reduce((a,b)=>a+b,0)};
}
export function autoFitTableWidth(table:AnyTable):AnyTable {return distributeTableColumns(table);}
export function moveTableRow(table:AnyTable,from:number,to:number):AnyTable {const cells=[...(table.tableCells??[])];const [row]=cells.splice(from,1);cells.splice(to,0,row);return {...table,tableCells:cells};}
export function moveTableColumn(table:AnyTable,from:number,to:number):AnyTable {return {...table,tableCells:(table.tableCells??[]).map((r:any[])=>{const x=[...r];const [v]=x.splice(from,1);x.splice(to,0,v);return x;})};}
export function sortTable(table:AnyTable,column:number,direction:"asc"|"desc"):AnyTable {const header=table.tableHeaderRows??0;const head=(table.tableCells??[]).slice(0,header);const body=(table.tableCells??[]).slice(header).sort((a:any[],b:any[])=>String(a[column]??"").localeCompare(String(b[column]??""),undefined,{numeric:true})*(direction==="asc"?1:-1));return {...table,tableCells:[...head,...body],tableSort:{column,direction}};}
export function applyTableFilter(table:AnyTable,column:number,query:string):AnyTable {return {...table,tableFilter:{column,query}};}
export function visibleRowIndexes(table:AnyTable):number[]{const rows=table.tableRows??1,filter=table.tableFilter;if(!filter?.query)return Array.from({length:rows},(_,i)=>i);const header=table.tableHeaderRows??0;return Array.from({length:rows},(_,i)=>i).filter(i=>i<header||String(table.tableCells?.[i]?.[filter.column]??"").toLowerCase().includes(String(filter.query).toLowerCase()));}
export function formatTableValue(value:any,format?:string,currency="USD"):string {const s=String(value??"");const n=Number(s.replace(/[$,%]/g,""));if(format==="currency"&&Number.isFinite(n))return new Intl.NumberFormat(undefined,{style:"currency",currency}).format(n);if(format==="percent"&&Number.isFinite(n))return `${n}%`;if(format==="number"&&Number.isFinite(n))return new Intl.NumberFormat().format(n);if(format==="date"){const d=new Date(s);if(!Number.isNaN(d.valueOf()))return d.toLocaleDateString();}return s;}
export function calculateFormula(formula:string,table:AnyTable):string {if(!formula.startsWith("="))return formula;const cells=table.tableCells??[];const rangeValues=(a:string,b:string)=>{const p=(x:string)=>({c:x.charCodeAt(0)-65,r:Number(x.slice(1))-1});const x=p(a),y=p(b),v:number[]=[];for(let r=x.r;r<=y.r;r++)for(let c=x.c;c<=y.c;c++){const n=Number(cells[r]?.[c]);if(Number.isFinite(n))v.push(n);}return v;};try{const m=formula.match(/^=(SUM|AVERAGE|MIN|MAX)\(([A-Z]\d+):([A-Z]\d+)\)$/i);if(m){const v=rangeValues(m[2],m[3]);const op=m[1].toUpperCase();const result=op==="SUM"?v.reduce((a,b)=>a+b,0):op==="AVERAGE"?(v.reduce((a,b)=>a+b,0)/(v.length||1)):op==="MIN"?Math.min(...v):Math.max(...v);return String(Number.isFinite(result)?result:0);}return formula;}catch{return "#ERROR";}}
export function parseCsvRobust(text:string):string[][] {const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell="";}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell="";}else cell+=ch;}row.push(cell);if(row.length>1||row[0]!=="")rows.push(row);const cols=Math.max(1,...rows.map(r=>r.length));return rows.map(r=>[...r,...Array.from({length:cols-r.length},()=>"")]);}
export function splitTableForPages(table:AnyTable,availableHeight:number):AnyTable[]{const heights=table.tableRowHeights??Array.from({length:table.tableRows??1},()=>44);const header=table.tableHeaderRows??0;const out:AnyTable[]=[];let start=header;while(start<heights.length){let h=heights.slice(0,header).reduce((a:number,b:number)=>a+b,0),end=start;while(end<heights.length&&h+heights[end]<=availableHeight){h+=heights[end];end++;}if(end===start)end++;const indexes=[...Array.from({length:header},(_,i)=>i),...Array.from({length:end-start},(_,i)=>start+i)];out.push({...table,id:`${table.id}-part-${out.length+1}`,tableRows:indexes.length,tableCells:indexes.map(i=>table.tableCells?.[i]??[]),tableRowHeights:indexes.map(i=>heights[i]),name:`${table.name} (${out.length+1})`});start=end;}return out;}
