import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  BASE_URL,
  breadcrumbSchema,
  DEFAULT_AUTHOR,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  OPENING_HOURS,
  SAME_AS,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
  SOCIAL_LINKS,
  TEMPLE_ADDRESS,
  TEMPLE_GEO,
  TWITTER_HANDLE,
  webPageSchema,
} from "@/constants/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  breadcrumbLabel?: string;
  ogType?: string;
  ogImage?: string;
  ogLocale?: string;
  twitterSite?: string;
  twitterCreator?: string;
  keywords?: string;
  author?: string;
  applicationName?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const normalizePath = (path: string) => {
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

const extractPathFromUrl = (url: string): string => {
  try {
    // If it's a full URL, extract just the path
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).pathname;
    }
    // Otherwise assume it's already a path
    return url;
  } catch {
    return url;
  }
};

const SEOHead = ({
  title,
  description,
  canonical,
  breadcrumbLabel,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  ogLocale = "en_US",
  twitterSite = TWITTER_HANDLE,
  twitterCreator = TWITTER_HANDLE,
  keywords = DEFAULT_KEYWORDS,
  author = DEFAULT_AUTHOR,
  applicationName = SITE_NAME,
  noindex = false,
  jsonLd,
}: SEOHeadProps) => {
  const location = useLocation();
  const extractedPath = extractPathFromUrl(canonical ?? location.pathname);
  const pagePath = normalizePath(extractedPath);

  const isActiveRoute = useMemo(() => {
    const current = normalizePath(location.pathname);
    return current === pagePath;
  }, [location.pathname, pagePath]);

  const jsonLdString = useMemo(
    () => (jsonLd ? JSON.stringify(jsonLd) : ""),
    [jsonLd]
  );

  useEffect(() => {
    // Update meta tags for SEO

    const canonicalUrl = `${BASE_URL}${pagePath === "/" ? "/" : pagePath}`;
    const robotsContent = noindex
      ? "noindex, nofollow"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    console.log("[SEOHead] Setting description:", description.substring(0, 80));
    setMeta("name", "keywords", keywords);
    setMeta("name", "robots", robotsContent);
    setMeta("name", "googlebot", robotsContent);
    setMeta("name", "bingbot", robotsContent);
    setMeta("name", "author", author);
    setMeta("name", "application-name", applicationName);
    setMeta("name", "publisher", SITE_NAME);
    setMeta("name", "creator", SITE_NAME);
    setMeta("name", "geo.placename", "Agra");
    setMeta("name", "geo.region", "IN-UP");
    setMeta("name", "geo.position", `${TEMPLE_GEO.latitude};${TEMPLE_GEO.longitude}`);
    setMeta("name", "ICBM", `${TEMPLE_GEO.latitude}, ${TEMPLE_GEO.longitude}`);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:image:secure_url", ogImage);
    setMeta("property", "og:image:alt", `${title} | ${SITE_NAME}`);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:locale", ogLocale);
    setMeta("property", "og:locale:alternate", "hi_IN");
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "article:publisher", SOCIAL_LINKS.facebook);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);
    setMeta("name", "twitter:image:alt", `${title} | ${SITE_NAME}`);
    setMeta("name", "twitter:site", twitterSite);
    setMeta("name", "twitter:creator", twitterCreator);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    const setLink = (rel: string, href: string, dataKey: string, extra?: Record<string, string>) => {
      let el = document.querySelector(`link[data-seo-link="${dataKey}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("data-seo-link", dataKey);
        document.head.appendChild(el);
      }
      el.setAttribute("rel", rel);
      el.setAttribute("href", href);
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
      }
    };

    setLink("alternate", canonicalUrl, "hreflang-en", { hreflang: "en" });
    setLink(
      "alternate",
      `${canonicalUrl}${canonicalUrl.includes("?") ? "&" : "?"}lang=hi`,
      "hreflang-hi",
      { hreflang: "hi" }
    );
    setLink("alternate", canonicalUrl, "hreflang-x-default", { hreflang: "x-default" });
    setLink("author", `${BASE_URL}/llms.txt`, "llms-txt", { type: "text/plain", title: "AI site summary" });

    setLink("me", SOCIAL_LINKS.facebook, "me-facebook");
    setLink("me", SOCIAL_LINKS.instagram, "me-instagram");
    setLink("me", SOCIAL_LINKS.youtube, "me-youtube");
    setLink("me", SOCIAL_LINKS.twitter, "me-twitter");

    const postalAddress = { "@type": "PostalAddress", ...TEMPLE_ADDRESS };

    const graphNodes: Record<string, unknown>[] = [
      {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}#localbusiness`,
        name: SITE_NAME,
        description:
          "Historic Hindu Shiva temple in Sikandra, Agra with daily darshan, aarti, puja booking, and live streaming services.",
        image: ogImage,
        url: BASE_URL,
        telephone: "+91-9XXXXXXXXX",
        email: "contact@kailashmahadev.in",
        address: postalAddress,
        geo: {
          "@type": "GeoCoordinates",
          latitude: TEMPLE_GEO.latitude,
          longitude: TEMPLE_GEO.longitude,
        },
        hasMap: "https://maps.google.com/?q=27.2381,77.9356",
        priceRange: "₹0-₹10000",
        openingHoursSpecification: OPENING_HOURS,
        sameAs: [...SAME_AS],
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}#organization`,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: BASE_URL,
        logo: `${BASE_URL}/icons/icon-512x512.png`,
        image: ogImage,
        description:
          "Official website for kailash mandir, kailash mandir agra, kailash mahadev, kailash mahadev agra, kailash mahadev mandir agra, kailash mahadev temple agra.",
        sameAs: [...SAME_AS],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Support",
          availableLanguage: ["en", "hi"],
          areaServed: "IN",
          url: `${BASE_URL}/contact`,
        },
        address: postalAddress,
      },
      {
        "@type": "HinduTemple",
        "@id": `${BASE_URL}#hindu-temple`,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: BASE_URL,
        description:
          "kailash mandir · kailash mahadev mandir agra · kailash mahadev temple — Shiva temple in Sikandra, Agra.",
        sameAs: [...SAME_AS],
        address: postalAddress,
        geo: {
          "@type": "GeoCoordinates",
          latitude: TEMPLE_GEO.latitude,
          longitude: TEMPLE_GEO.longitude,
        },
        image: ogImage,
        openingHoursSpecification: OPENING_HOURS,
        isAccessibleForFree: true,
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}#website`,
        name: SITE_NAME,
        url: BASE_URL,
        description: "Official website of Kailash Mahadev Temple Agra — darshan, puja, donations, live stream.",
        publisher: { "@id": `${BASE_URL}#organization` },
        sameAs: [...SAME_AS],
        inLanguage: ["en", "hi"],
        isAccessibleForFree: true,
      },
      {
        "@type": "AggregateRating",
        "@id": `${BASE_URL}#aggregaterating`,
        ratingValue: "4.8",
        reviewCount: "450",
        bestRating: "5",
        worstRating: "1",
        itemReviewed: {
          "@id": `${BASE_URL}#localbusiness`,
        },
      },
    ];

    if (breadcrumbLabel && pagePath !== "/") {
      graphNodes.push(
        webPageSchema(title, pagePath, description) as Record<string, unknown>,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: breadcrumbLabel, path: pagePath },
        ]) as Record<string, unknown>
      );
    }

    const extraNodes = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const graphPayload = {
      "@context": "https://schema.org",
      "@graph": [...graphNodes, ...extraNodes],
    };

    let scriptEl = document.querySelector("script[data-seo-jsonld]") as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "application/ld+json");
      scriptEl.setAttribute("data-seo-jsonld", "true");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(graphPayload);
  }, [
    isActiveRoute,
    title,
    description,
    pagePath,
    ogType,
    ogImage,
    ogLocale,
    twitterSite,
    twitterCreator,
    keywords,
    author,
    applicationName,
    noindex,
    breadcrumbLabel,
    jsonLdString,
  ]);

  return null;
};

export { SEOHead };
export default SEOHead;
