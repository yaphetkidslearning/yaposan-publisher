import type { PublisherPage, PublisherProject } from "../types/publisher";
import { createBlankPage } from "../constants/publisher";

export type PageIdFactory = (prefix: string) => string;

export function addProjectPage(
  project: PublisherProject,
  idFactory: PageIdFactory,
): PublisherProject {
  const page = createBlankPage(project.pages.length + 1);
  page.id = idFactory("page");
  return {
    ...project,
    updatedAt: Date.now(),
    pages: [...project.pages, page],
    activePageId: page.id,
  };
}

export function duplicateProjectPage(
  project: PublisherProject,
  idFactory: PageIdFactory,
): PublisherProject {
  const sourceIndex = project.pages.findIndex(
    (page) => page.id === project.activePageId,
  );
  const resolvedIndex = sourceIndex >= 0 ? sourceIndex : 0;
  const source = project.pages[resolvedIndex];
  if (!source) return project;

  const copy: PublisherPage = {
    ...(JSON.parse(JSON.stringify(source)) as PublisherPage),
    id: idFactory("page"),
    name: `${source.name} Copy`,
    elements: source.elements.map((element) => ({
      ...element,
      id: idFactory(element.type),
    })),
  };

  return {
    ...project,
    updatedAt: Date.now(),
    pages: [
      ...project.pages.slice(0, resolvedIndex + 1),
      copy,
      ...project.pages.slice(resolvedIndex + 1),
    ],
    activePageId: copy.id,
  };
}

export function deleteProjectPage(project: PublisherProject): PublisherProject {
  if (project.pages.length <= 1) return project;

  const sourceIndex = project.pages.findIndex(
    (page) => page.id === project.activePageId,
  );
  const resolvedIndex = sourceIndex >= 0 ? sourceIndex : 0;
  const source = project.pages[resolvedIndex];
  if (!source) return project;

  const pages = project.pages.filter((page) => page.id !== source.id);
  const nextActive = pages[Math.max(0, resolvedIndex - 1)] ?? pages[0];

  return {
    ...project,
    updatedAt: Date.now(),
    pages,
    activePageId: nextActive.id,
  };
}

export function selectProjectPage(
  project: PublisherProject,
  pageId: string,
): PublisherProject {
  if (!project.pages.some((page) => page.id === pageId)) return project;
  return {
    ...project,
    activePageId: pageId,
    updatedAt: Date.now(),
  };
}
