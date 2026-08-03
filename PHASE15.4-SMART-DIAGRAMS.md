# Phase 15.4 — Smart Diagrams

Phase 15.4 adds an editable smart-diagram system to the real Yaposan Publisher editor.

## Included diagram families

- Organization charts
- Flowcharts
- Timelines
- Mind maps
- Process diagrams
- Decision trees
- Pyramid diagrams
- Cycle diagrams
- Venn diagrams
- Swimlane diagrams

## Editing and integration

Open **Insert → Data & Diagrams → Diagram**. Each diagram is created as grouped native publication objects: shapes, text labels, lanes, and connectors. This preserves selection, movement, resizing, recoloring, grouping/ungrouping, layers, save/load, undo/redo, and export compatibility.

The diagram engine stores diagram type, group, role, connector routing, and node metadata on each object. Five themes and horizontal/vertical layouts are available.

## Verification

```powershell
npm install
npx tsc --noEmit
npm run test:phase15.4
npm run verify:phase15.4
```
