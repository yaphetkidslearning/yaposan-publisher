import type {
    PublisherElement,
    PublisherElementType,
} from "../types/publisher";

type ShapeTemplateElement =
  Partial<PublisherElement> &
  Record<string, unknown>;

export type ShapeTemplate = {
  id: string;
  name: string;
  category: string;
  elements: ShapeTemplateElement[];
};

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  name: string,
): ShapeTemplateElement {
  return {
    type: "rectangle" as PublisherElementType,
    x,
    y,
    width,
    height,
    fillColor,
    borderColor: "transparent",
    borderWidth: 0,
    rotation: 0,
    opacity: 1,
    name,
  };
}

function line(
  x: number,
  y: number,
  width: number,
  height: number,
  name: string,
): ShapeTemplateElement {
  return {
    type: "line" as PublisherElementType,
    x,
    y,
    width,
    height,
    fillColor: "#64748B",
    borderColor: "#64748B",
    borderWidth: 3,
    rotation: 0,
    opacity: 1,
    name,
  };
}

function circle(
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  borderColor: string,
  borderWidth: number,
  name: string,
): ShapeTemplateElement {
  return {
    type: "circle" as PublisherElementType,
    x,
    y,
    width,
    height,
    fillColor,
    borderColor,
    borderWidth,
    rotation: 0,
    opacity: 1,
    name,
  };
}

function arrow(
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  name: string,
): ShapeTemplateElement {
  return {
    type: "arrow" as PublisherElementType,
    x,
    y,
    width,
    height,
    fillColor,
    borderColor: "transparent",
    borderWidth: 0,
    rotation: 0,
    opacity: 1,
    name,
  };
}

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  {
    id: "timeline",
    name: "Timeline",
    category: "Business",
    elements: [
      line(40, 110, 520, 24, "Timeline"),

      ...[70, 210, 350, 490].map((x, index) =>
        circle(
          x,
          90,
          48,
          48,
          ["#0D9488", "#2563EB", "#7C3AED", "#F59E0B"][index],
          "#FFFFFF",
          3,
          `Step ${index + 1}`,
        ),
      ),
    ],
  },

  {
    id: "org-chart",
    name: "Org Chart",
    category: "Business",
    elements: [
      rect(220, 30, 210, 90, "#DBEAFE", "Director"),
      rect(60, 210, 190, 84, "#DCFCE7", "Team A"),
      rect(380, 210, 190, 84, "#FCE7F3", "Team B"),
      line(325, 120, 24, 90, "Connector"),
      line(155, 180, 360, 24, "Connector"),
    ],
  },

  {
    id: "flowchart",
    name: "Flowchart",
    category: "Flowchart",
    elements: [
      rect(210, 30, 230, 90, "#DBEAFE", "Start"),
      rect(210, 190, 230, 90, "#FEF3C7", "Process"),
      rect(210, 350, 230, 90, "#DCFCE7", "Finish"),
      line(315, 120, 24, 70, "Connector"),
      line(315, 280, 24, 70, "Connector"),
    ],
  },

  {
    id: "mind-map",
    name: "Mind Map",
    category: "Education",
    elements: [
      circle(
        240,
        170,
        180,
        180,
        "#FDE68A",
        "#D97706",
        3,
        "Main Idea",
      ),

      rect(30, 40, 170, 80, "#DBEAFE", "Topic 1"),
      rect(460, 40, 170, 80, "#DCFCE7", "Topic 2"),
      rect(30, 410, 170, 80, "#FCE7F3", "Topic 3"),
      rect(460, 410, 170, 80, "#EDE9FE", "Topic 4"),
    ],
  },

  {
    id: "process",
    name: "Process Diagram",
    category: "Business",
    elements: [0, 1, 2, 3].map((index) =>
      arrow(
        40 + index * 150,
        180,
        130,
        90,
        ["#0D9488", "#2563EB", "#7C3AED", "#F59E0B"][index],
        `Process ${index + 1}`,
      ),
    ),
  },

  {
    id: "infographic",
    name: "Infographic Blocks",
    category: "Business",
    elements: [
      rect(40, 40, 560, 110, "#0F766E", "Header"),
      rect(40, 180, 170, 300, "#DBEAFE", "Block 1"),
      rect(235, 180, 170, 300, "#DCFCE7", "Block 2"),
      rect(430, 180, 170, 300, "#FCE7F3", "Block 3"),
    ],
  },
];