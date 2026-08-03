import { queryMergeRecords, resolveBoundElement } from "./mailMergeEngine";
export const LABEL_TEMPLATES = [
    { id: "avery-5160", name: "Address Labels 1 × 2⅝ in", manufacturer: "Avery", productCode: "5160 / 8160", kind: "mailing-label", pageWidthIn: 8.5, pageHeightIn: 11, columns: 3, rows: 10, itemWidthIn: 2.625, itemHeightIn: 1, marginLeftIn: 0.1875, marginTopIn: 0.5, horizontalGapIn: 0.125, verticalGapIn: 0 },
    { id: "avery-5163", name: "Shipping Labels 2 × 4 in", manufacturer: "Avery", productCode: "5163 / 8163", kind: "shipping-label", pageWidthIn: 8.5, pageHeightIn: 11, columns: 2, rows: 5, itemWidthIn: 4, itemHeightIn: 2, marginLeftIn: 0.15625, marginTopIn: 0.5, horizontalGapIn: 0.1875, verticalGapIn: 0 },
    { id: "avery-5371", name: "Business Cards 2 × 3½ in", manufacturer: "Avery", productCode: "5371 / 8371", kind: "business-card", pageWidthIn: 8.5, pageHeightIn: 11, columns: 2, rows: 5, itemWidthIn: 3.5, itemHeightIn: 2, marginLeftIn: 0.75, marginTopIn: 0.5, horizontalGapIn: 0, verticalGapIn: 0 },
    { id: "avery-5395", name: "Name Badges 2⅓ × 3⅜ in", manufacturer: "Avery", productCode: "5395", kind: "name-badge", pageWidthIn: 8.5, pageHeightIn: 11, columns: 2, rows: 4, itemWidthIn: 3.375, itemHeightIn: 2.333, marginLeftIn: 0.6875, marginTopIn: 0.5835, horizontalGapIn: 0.375, verticalGapIn: 0 },
    { id: "yaposan-id-8", name: "CR80 ID Cards · 8-up", manufacturer: "Yaposan", kind: "id-card", pageWidthIn: 8.5, pageHeightIn: 11, columns: 2, rows: 4, itemWidthIn: 3.375, itemHeightIn: 2.125, marginLeftIn: 0.6875, marginTopIn: 1.0, horizontalGapIn: 0.375, verticalGapIn: 0.125 },
    { id: "yaposan-ticket-10", name: "Event Tickets · 10-up", manufacturer: "Yaposan", kind: "ticket", pageWidthIn: 8.5, pageHeightIn: 11, columns: 2, rows: 5, itemWidthIn: 4, itemHeightIn: 2, marginLeftIn: 0.125, marginTopIn: 0.5, horizontalGapIn: 0.25, verticalGapIn: 0 },
    { id: "yaposan-invitation-2", name: "Invitations 5 × 7 in · 2-up", manufacturer: "Yaposan", kind: "invitation", pageWidthIn: 11, pageHeightIn: 8.5, columns: 2, rows: 1, itemWidthIn: 5, itemHeightIn: 7, marginLeftIn: 0.375, marginTopIn: 0.75, horizontalGapIn: 0.25, verticalGapIn: 0 },
    { id: "yaposan-certificate-1", name: "Certificates · Letter", manufacturer: "Yaposan", kind: "certificate", pageWidthIn: 11, pageHeightIn: 8.5, columns: 1, rows: 1, itemWidthIn: 11, itemHeightIn: 8.5, marginLeftIn: 0, marginTopIn: 0, horizontalGapIn: 0, verticalGapIn: 0 },
];
export const DEFAULT_MERGE_PRINT_SETTINGS = { templateId: "avery-5160", copies: 1, duplex: false, flipEdge: "long", sequencing: "record-major", startPosition: 0, includeDuplicates: false, cropMarks: false, printBackgrounds: true };
function text(value) { return String(value ?? "").trim(); }
function field(values, names) { for (const name of names)
    if (text(values[name]))
        return text(values[name]); return ""; }
export function contactDisplayName(contact) { return field(contact.values, ["full_name", "name", "recipient", "company", "email"]) || "Unnamed recipient"; }
export function importContactsFromSource(source, existing = []) {
    const signatures = new Set(existing.map((item) => JSON.stringify(item.values)));
    const now = Date.now();
    const added = source.records.map((record, index) => ({ id: `contact-${now}-${index}`, values: Object.fromEntries(Object.entries(record.values).map(([key, value]) => [key, text(value)])), groupIds: [], createdAt: now, updatedAt: now })).filter((item) => { const signature = JSON.stringify(item.values); if (signatures.has(signature))
        return false; signatures.add(signature); return true; });
    return [...existing, ...added];
}
export function validateAddressBook(contacts) {
    const issues = [];
    for (const contact of contacts) {
        const values = contact.values;
        const name = field(values, ["full_name", "name", "recipient", "company"]);
        const address = field(values, ["address", "address_1", "street", "street_address"]);
        const city = field(values, ["city", "town"]);
        const postal = field(values, ["zip", "zipcode", "zip_code", "postal_code"]);
        const email = field(values, ["email", "email_address"]);
        if (!name)
            issues.push({ contactId: contact.id, field: "name", message: "Recipient name or company is missing.", severity: "warning" });
        if (!address)
            issues.push({ contactId: contact.id, field: "address", message: "Street address is missing.", severity: "error" });
        if (!city)
            issues.push({ contactId: contact.id, field: "city", message: "City is missing.", severity: "error" });
        if (!postal)
            issues.push({ contactId: contact.id, field: "postal_code", message: "Postal code is missing.", severity: "error" });
        else if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/.test(postal))
            issues.push({ contactId: contact.id, field: "postal_code", message: "Postal code format looks invalid.", severity: "warning" });
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            issues.push({ contactId: contact.id, field: "email", message: "Email address format is invalid.", severity: "warning" });
    }
    return issues;
}
export function createContactGroup(name, contacts, selectedIds) {
    const now = Date.now();
    const id = `contact-group-${now}`;
    const unique = [...new Set(selectedIds.filter((item) => contacts.some((contact) => contact.id === item)))];
    const group = { id, name: name.trim() || "New group", color: "#007D76", contactIds: unique, createdAt: now };
    return { group, contacts: contacts.map((contact) => unique.includes(contact.id) ? { ...contact, groupIds: [...new Set([...contact.groupIds, id])], updatedAt: now } : contact) };
}
export function exportContactsCsv(contacts) {
    const headers = [...new Set(contacts.flatMap((item) => Object.keys(item.values)))];
    const escape = (value) => /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    return [headers.join(","), ...contacts.map((item) => headers.map((header) => escape(item.values[header] ?? "")).join(","))].join("\n");
}
function activeSource(data) { return data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0]; }
export function getPrintRecords(data, settings) {
    const source = activeSource(data);
    if (!source)
        return [];
    const duplicateIds = new Set(source.duplicateRecordIds);
    let records = queryMergeRecords(source, data).filter((record) => settings.includeDuplicates || !duplicateIds.has(record.id));
    if (settings.selectedGroupId && data.addressBook) {
        const group = data.addressBook.groups.find((item) => item.id === settings.selectedGroupId);
        if (group) {
            const signatures = new Set(data.addressBook.contacts.filter((item) => group.contactIds.includes(item.id)).map((item) => JSON.stringify(item.values)));
            records = records.filter((record) => signatures.has(JSON.stringify(Object.fromEntries(Object.entries(record.values).map(([k, v]) => [k, text(v)])))));
        }
    }
    return records;
}
function cloneForSlot(element, record, source, data, recordIndex, scale, offsetX, offsetY, suffix) {
    const resolved = resolveBoundElement(element, { source, record, recordIndex, fieldProperties: data.fieldProperties });
    return { ...resolved, id: `${element.id}-${suffix}`, x: offsetX + element.x * scale, y: offsetY + element.y * scale, width: element.width * scale, height: element.height * scale, fontSize: element.fontSize ? element.fontSize * scale : element.fontSize, borderWidth: element.borderWidth ? element.borderWidth * scale : element.borderWidth, zIndex: element.zIndex };
}
export function buildPrintMergeProject(project, settings) {
    const data = project.mailMergeData;
    if (!data)
        throw new Error("No mail merge data is configured.");
    const source = activeSource(data);
    if (!source)
        throw new Error("Select a data source.");
    const template = LABEL_TEMPLATES.find((item) => item.id === settings.templateId);
    if (!template)
        throw new Error("Print template was not found.");
    const base = project.pages[0];
    if (!base)
        throw new Error("The publication has no page to merge.");
    const records = getPrintRecords(data, settings);
    if (!records.length)
        throw new Error("No recipients match the current filters.");
    const expanded = settings.sequencing === "record-major" ? records.flatMap((record) => Array.from({ length: Math.max(1, settings.copies) }, () => record)) : Array.from({ length: Math.max(1, settings.copies) }, () => records).flat();
    const slots = template.columns * template.rows;
    const entries = [...Array(Math.max(0, settings.startPosition)).fill(undefined), ...expanded];
    const dpi = 96;
    const pages = [];
    for (let pageIndex = 0; pageIndex < Math.ceil(entries.length / slots); pageIndex++) {
        const elements = [];
        for (let slot = 0; slot < slots; slot++) {
            const record = entries[pageIndex * slots + slot];
            if (!record)
                continue;
            const col = slot % template.columns, row = Math.floor(slot / template.columns);
            const itemW = template.itemWidthIn * dpi, itemH = template.itemHeightIn * dpi;
            const x = (template.marginLeftIn + col * (template.itemWidthIn + template.horizontalGapIn)) * dpi;
            const y = (template.marginTopIn + row * (template.itemHeightIn + template.verticalGapIn)) * dpi;
            const scale = Math.min(itemW / base.width, itemH / base.height);
            const dx = x + (itemW - base.width * scale) / 2, dy = y + (itemH - base.height * scale) / 2;
            const recordIndex = records.findIndex((item) => item.id === record.id);
            base.elements.forEach((element) => { const cloned = cloneForSlot(element, record, source, data, recordIndex, scale, dx, dy, `${pageIndex}-${slot}`); if (!cloned.hidden)
                elements.push(cloned); });
            if (settings.cropMarks) {
                const mark = (id, x1, y1, x2, y2) => ({ id, name: "Crop mark", type: "line", x: x1, y: y1, width: x2 - x1, height: y2 - y1, rotation: 0, zIndex: 9999, opacity: 1, borderColor: "#000000", borderWidth: 1 });
                elements.push(mark(`cm-t-${pageIndex}-${slot}`, x, y - 6, x + itemW, y - 6), mark(`cm-b-${pageIndex}-${slot}`, x, y + itemH + 6, x + itemW, y + itemH + 6));
            }
        }
        pages.push({ id: `print-page-${Date.now()}-${pageIndex}`, name: `Print Sheet ${pageIndex + 1}`, width: template.pageWidthIn * dpi, height: template.pageHeightIn * dpi, orientation: template.pageWidthIn > template.pageHeightIn ? "landscape" : "portrait", sizeKey: template.pageWidthIn === 8.5 && template.pageHeightIn === 11 ? "letter" : "custom", backgroundColor: settings.printBackgrounds ? base.backgroundColor : "#FFFFFF", margin: 0, bleed: 0, elements });
    }
    return { ...project, id: `${project.id}-print-${Date.now()}`, name: `${project.name} - ${template.name}`, updatedAt: Date.now(), pages, activePageId: pages[0].id, mailMergeData: { ...data, previewEnabled: false, printSettings: settings, printHistory: [{ id: `print-job-${Date.now()}`, createdAt: Date.now(), templateId: template.id, templateName: template.name, recordCount: records.length, copies: settings.copies, sheetCount: pages.length, duplex: settings.duplex, pageCount: pages.length }, ...(data.printHistory ?? [])].slice(0, 50) } };
}
export function estimatePrintJob(data, settings) { const template = LABEL_TEMPLATES.find((item) => item.id === settings.templateId) ?? LABEL_TEMPLATES[0]; const records = getPrintRecords(data, settings); const impressions = records.length * Math.max(1, settings.copies) + Math.max(0, settings.startPosition); const slots = template.columns * template.rows; const sheets = Math.ceil(impressions / slots); return { records: records.length, impressions, sheets, pages: settings.duplex ? Math.ceil(sheets / 2) * 2 : sheets, slotsPerSheet: slots, unusedSlots: sheets * slots - impressions }; }
