import type { SectionCard, SectionCardConfig } from "@/types/data";

interface SectionCardItem {
  slug: string;
  href?: string;
  title: string;
  description?: string;
  summary: string;
}

export function toSectionCard(item: SectionCardItem, config: SectionCardConfig): SectionCard {
  return {
    key: item.href ?? item.slug,
    title: item[config.titleField] ?? "",
    href: config.hrefField ? item[config.hrefField] ?? "" : `${config.hrefPrefix}${item.slug}`,
    summary: item.summary,
  };
}
