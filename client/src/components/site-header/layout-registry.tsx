import { normalizeHeaderLayout, type HeaderLayoutVariant } from "./layout-options";
import { classicLayoutDefinition } from "./layouts/classic-layout";
import { compactLayoutDefinition } from "./layouts/compact-layout";
import { v2LayoutDefinition } from "./layouts/v2-layout";
import type { HeaderLayoutRegistry } from "./layout-types";

const layoutRegistry: HeaderLayoutRegistry = {
  classic: classicLayoutDefinition,
  compact: compactLayoutDefinition,
  v2: v2LayoutDefinition,
};

export function getHeaderLayoutDefinition(layout: HeaderLayoutVariant | string | null | undefined) {
  // "v2" 不在 HEADER_LAYOUT_OPTIONS 里，normalize 会把它吞成 classic，需要先行判断
  if (layout === "v2") {
    return layoutRegistry.v2;
  }

  return layoutRegistry[normalizeHeaderLayout(layout ?? undefined)];
}
