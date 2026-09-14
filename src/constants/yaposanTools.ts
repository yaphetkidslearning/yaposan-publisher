export type YaposanToolAccess = "free" | "bring_your_own" | "yaposan_credits";
export type YaposanToolCategory = "publish" | "image" | "design" | "documents" | "web" | "ai";

export type YaposanToolDefinition = {
  id: string;
  name: string;
  description: string;
  category: YaposanToolCategory;
  href: string;
  icon: string;
  access: YaposanToolAccess;
  includedByDefault: boolean;
};

// rule: free Yaposan capabilities are present by default. Users do not
// need to create an AI Page or install these tools before they can use them.
export const YAPOSAN_TOOL_CATALOG: YaposanToolDefinition[] = [
  { id: "publisher", name: "Publisher", description: "Create flyers, brochures, catalogs, labels, books and other layouts.", category: "publish", href: "/editor?fresh=1", icon: "documents-outline", access: "free", includedByDefault: true },
  { id: "templates", name: "Templates", description: "Start from Yaposan's free design and publishing templates.", category: "publish", href: "/templates", icon: "grid-outline", access: "free", includedByDefault: true },
  { id: "background-remover", name: "Background Remover", description: "Remove or replace product and photo backgrounds with Yaposan's photo workflow.", category: "image", href: "/photo-studio", icon: "cut-outline", access: "free", includedByDefault: true },
  { id: "product-photo", name: "Product Photo Studio", description: "Prepare catalog-white and transparent product images.", category: "image", href: "/product-photo-studio", icon: "camera-outline", access: "free", includedByDefault: true },
  { id: "image-editor", name: "Image Editor", description: "Edit, crop, compose and prepare images for creative work.", category: "image", href: "/image-editor", icon: "image-outline", access: "free", includedByDefault: true },
  { id: "catalog-creator", name: "Catalog Creator", description: "Build product catalogs from Publisher templates and product assets.", category: "design", href: "/editor?fresh=1&type=catalog", icon: "albums-outline", access: "free", includedByDefault: true },
  { id: "brand-kit", name: "Brand Kit", description: "Keep colors, logos and reusable brand assets together.", category: "design", href: "/brand-kit", icon: "color-palette-outline", access: "free", includedByDefault: true },
  { id: "presentation", name: "Presentation Studio", description: "Create presentations with Yaposan's creative editor tools.", category: "design", href: "/presentation-studio", icon: "easel-outline", access: "free", includedByDefault: true },
  { id: "documents", name: "PDF & Document Tools", description: "Work with common document and PDF creation utilities.", category: "documents", href: "/document-tools", icon: "document-text-outline", access: "free", includedByDefault: true },
  { id: "web-studio", name: "Web Studio", description: "Create and publish web experiences from Yaposan.", category: "web", href: "/web-studio", icon: "globe-outline", access: "free", includedByDefault: true },
  { id: "ai-image", name: "AI Image Generator", description: "Generate images by connecting your own AI provider or using optional Yaposan credits.", category: "ai", href: "/ai-image-generator", icon: "sparkles-outline", access: "bring_your_own", includedByDefault: true },
  { id: "ai-writer", name: "AI Writer", description: "Use your connected AI provider for writing and content assistance.", category: "ai", href: "/ai-writer", icon: "create-outline", access: "bring_your_own", includedByDefault: true },
];

export const FREE_YAPOSAN_TOOLS = YAPOSAN_TOOL_CATALOG.filter(tool => tool.access === "free" && tool.includedByDefault);
