import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, BookOpen, Compass, Heart, Mail } from "lucide-react";

export default function AuthorProfilePage() {
  return (
    <>
      <SEOHead
        title="Author Profile | Kailash Mahadev Temple Agra"
        description="Meet the editorial team behind the devotional content, temple insights, and spiritual guidance shared on the Kailash Mahadev Temple Agra website."
        canonical="/author/kailash-mahadev-temple-agra"
        ogType="article"
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-24">
          <section className="border-b border-border/60 bg-gradient-to-br from-maroon/10 via-background to-background">
            <div className="container mx-auto px-4 py-16 md:px-6 lg:py-24">
              <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="max-w-3xl">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Author Profile</p>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Kailash Mahadev Temple Agra Editorial Team
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    The editorial team curates temple history, darshan guidance, puja information, and spiritual wisdom for devotees seeking a deeper connection with Kailash Mahadev Temple Agra.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to="/blogs" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                      Explore Articles
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary">
                      <Mail className="h-4 w-4" />
                      Contact Us
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/10">
                  <div className="flex items-center gap-4">
                    <img
                      src="/placeholder.svg"
                      alt="Kailash Mahadev Temple Agra editorial team"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="text-xl font-semibold">Kailash Mahadev Temple Agra</h2>
                      <p className="text-sm text-muted-foreground">Temple history, rituals & pilgrimage guidance</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Compass className="mt-0.5 h-4 w-4 text-primary" />
                      <span>Specializes in temple history, darshan timings, ceremony details, and spiritual guidance for visitors.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                      <span>Publishes devotional articles and practical guidance to help devotees prepare for their visit.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Heart className="mt-0.5 h-4 w-4 text-primary" />
                      <span>Committed to preserving cultural heritage and making sacred knowledge accessible online.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-16 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-border/70 bg-card/70 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold">About the author team</h2>
                <p className="mt-4 leading-8 text-muted-foreground">
                  Our team combines temple knowledge, cultural storytelling, and visitor-focused guidance to create meaningful content for devotees, first-time visitors, and spiritual seekers.
                </p>
                <p className="mt-4 leading-8 text-muted-foreground">
                  Each article is created to be useful, informative, and easy to navigate across desktop and mobile devices, while preserving the temple’s credibility and spiritual tone.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/70 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold">Explore more</h2>
                <div className="mt-6 space-y-3">
                  <Link to="/blogs" className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
                    <span>Browse all blog articles</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/knowledge-hub" className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
                    <span>Visit the Knowledge Hub</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/darshan-timings" className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
                    <span>Check darshan timings</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
