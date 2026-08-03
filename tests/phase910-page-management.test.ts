import assert from "node:assert/strict";
import test from "node:test";

import {
  addProjectPage,
  deleteProjectPage,
  duplicateProjectPage,
  selectProjectPage,
} from "../src/utils/pageProjectActions";
import type { PublisherProject } from "../src/types/publisher";

let counter = 0;
const id = (prefix: string) => `${prefix}-test-${++counter}`;

function project(): PublisherProject {
  return {
    id: "project-1",
    name: "Test",
    createdAt: 1,
    updatedAt: 1,
    autoSave: true,
    version: 2,
    activePageId: "page-1",
    pages: [
      {
        id: "page-1",
        name: "Page 1",
        width: 816,
        height: 1056,
        sizeKey: "letter",
        orientation: "portrait",
        margin: 36,
        bleed: 12,
        backgroundColor: "#fff",
        elements: [
          {
            id: "text-1",
            name: "Text",
            type: "text",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            rotation: 0,
            zIndex: 1,
            opacity: 1,
          },
        ],
      },
    ],
  } as PublisherProject;
}

test("add page updates count and active page", () => {
  const next = addProjectPage(project(), id);
  assert.equal(next.pages.length, 2);
  assert.equal(next.activePageId, next.pages[1].id);
  assert.notEqual(next.pages, project().pages);
});

test("duplicate page inserts a unique editable copy", () => {
  const next = duplicateProjectPage(project(), id);
  assert.equal(next.pages.length, 2);
  assert.equal(next.activePageId, next.pages[1].id);
  assert.equal(next.pages[1].name, "Page 1 Copy");
  assert.notEqual(next.pages[0].id, next.pages[1].id);
  assert.notEqual(next.pages[0].elements[0].id, next.pages[1].elements[0].id);
});

test("select and delete page remain synchronized", () => {
  const added = addProjectPage(project(), id);
  const selected = selectProjectPage(added, added.pages[0].id);
  assert.equal(selected.activePageId, added.pages[0].id);
  const deleted = deleteProjectPage(selected);
  assert.equal(deleted.pages.length, 1);
  assert.equal(deleted.activePageId, deleted.pages[0].id);
});

test("last page cannot be deleted", () => {
  const current = project();
  assert.equal(deleteProjectPage(current), current);
});
