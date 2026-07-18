export interface HeroMediaItem {
  url: string;
  alt?: string;
  media_type?: "image" | "video";
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  display_order?: number;
  active?: boolean;
}

export const getMediaTypeFromUrl = (url: string): "image" | "video" => {
  const extension = url.split(".").pop()?.split(/[#?]/)[0]?.toLowerCase();
  if (extension === "mp4" || extension === "webm") return "video";
  return "image";
};

export const buildHeroSlides = (
  data: Record<string, any> | null | undefined,
  fallbackUrl: string,
  fallbackAlt = "Kailash Mahadev Temple"
): HeroMediaItem[] => {
  const items: HeroMediaItem[] = [];

  if (data?.hero_images && Array.isArray(data.hero_images) && data.hero_images.length > 0) {
    for (const item of data.hero_images) {
      if (!item || !item.url) continue;
      const mediaType = item.media_type || getMediaTypeFromUrl(item.url);
      items.push({
        url: item.url,
        alt: item.alt || fallbackAlt,
        media_type: mediaType,
        title: item.title,
        subtitle: item.subtitle,
        button_text: item.button_text,
        button_link: item.button_link,
        display_order: item.display_order,
        active: item.active !== false,
      });
    }
  } else if (data?.hero_image_url) {
    items.push({
      url: data.hero_image_url,
      alt: fallbackAlt,
      media_type: getMediaTypeFromUrl(data.hero_image_url),
      active: true,
    });
  }

  if (items.length > 0) {
    const activeItems = items
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return activeItems.length > 0 ? activeItems : items;
  }

  return [{
    url: fallbackUrl,
    alt: fallbackAlt,
    media_type: "image",
    active: true,
  }];
};
