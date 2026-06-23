import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { BASE_URL, mergeKeywords, SOCIAL_LINKS } from "@/constants/seo";
import { Facebook, Instagram, Youtube, Twitter, ExternalLink } from "lucide-react";

const FB_EMBED_URL = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(SOCIAL_LINKS.facebook)}&tabs=timeline&width=500&height=300&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;

const SocialPostsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Social Media — Kailash Mahadev Temple Agra (Facebook, Instagram, YouTube, X)"
        description="Official social media for kailash mandir agra, kailash mahadev, kailash mahadev temple agra — Facebook, Instagram @kailash_mahadev.agra, YouTube @KailashMahadevAgra, X @agra_mahadev. Live darshan & temple updates."
        canonical="/social"
        breadcrumbLabel="Social Media"
        keywords={mergeKeywords(
          "Kailash mandir social media",
          "Facebook Instagram YouTube Twitter",
          "kailash_mahadev.agra",
          "KailashMahadevAgra",
          "agra_mahadev"
        )}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Social Media — Kailash Mahadev Temple Agra",
            url: `${BASE_URL}/social`,
            description:
              "Official social media channels of Kailash Mahadev Temple Agra on Facebook, Instagram, YouTube and X.",
            isPartOf: { "@id": `${BASE_URL}#website` },
            about: { "@id": `${BASE_URL}#hindu-temple` },
          },
          {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            name: "Kailash Mahadev Temple Agra Social Profiles",
            url: `${BASE_URL}/social`,
            mainEntity: {
              "@type": "Organization",
              name: "Kailash Mahadev Temple Agra",
              url: BASE_URL,
              sameAs: [
                SOCIAL_LINKS.facebook,
                SOCIAL_LINKS.instagram,
                SOCIAL_LINKS.youtube,
                SOCIAL_LINKS.twitter,
              ],
            },
          },
        ]}
      />

      <Header />
      <main className="pt-10 pb-16">
        <section className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Kailash Mahadev Temple Agra — Social Media
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            Follow our official channels on Facebook, Instagram, YouTube and X for daily temple updates,
            darshan moments, puja highlights and festival celebrations.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { label: "Facebook", href: SOCIAL_LINKS.facebook, icon: Facebook },
              { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: Instagram },
              { label: "YouTube", href: SOCIAL_LINKS.youtube, icon: Youtube },
              { label: "X (Twitter)", href: SOCIAL_LINKS.twitter, icon: Twitter },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
                {label}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold text-lg mb-3">Instagram</h2>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
                <iframe
                  title="Instagram Feed — Kailash Mahadev Temple Agra"
                  src="https://www.instagram.com/kailash_mahadev.agra/embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  scrolling="no"
                  frameBorder={0}
                  allow="encrypted-media; picture-in-picture"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
              >
                @kailash_mahadev.agra <ExternalLink className="h-3 w-3" />
              </a>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold text-lg mb-3">Facebook</h2>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
                <iframe
                  title="Facebook Page — Kailash Mahadev Temple Agra"
                  src={FB_EMBED_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  scrolling="no"
                  frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
              >
                Kailash Mahadev Agra on Facebook <ExternalLink className="h-3 w-3" />
              </a>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold text-lg mb-3">YouTube</h2>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
                <iframe
                  title="YouTube Channel — Kailash Mahadev Agra"
                  src="https://www.youtube.com/embed?listType=search&list=Kailash%20Mahadev%20Agra&disablekb=1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
              >
                @KailashMahadevAgra <ExternalLink className="h-3 w-3" />
              </a>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold text-lg mb-3">X (Twitter)</h2>
              <div className="rounded-xl border border-border bg-muted/50 p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                <Twitter className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  Follow us on X for quick temple announcements, festival alerts and darshan updates.
                </p>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Twitter className="h-4 w-4" />
                  Follow @agra_mahadev
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SocialPostsPage;
