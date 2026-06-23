import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import {
  BASE_URL,
  DEFAULT_OG_IMAGE,
  mergeKeywords,
  SAME_AS,
  SITE_ALTERNATE_NAMES,
  TEMPLE_GEO,
} from "@/constants/seo";
import Footer from "@/components/Footer";
import About from "@/components/About";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Users, BookOpen, Sparkles, Calendar, ArrowRight,
  MapPin, Mountain, Landmark, Clock, Navigation, Star, Leaf, Eye,
  Sun, Moon, Sunrise, Sunset, User, Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutPage = () => {
  const { t } = useLanguage();
  const revealAbout = useScrollReveal();
  const revealLocation = useScrollReveal();
  const revealMyth = useScrollReveal();
  const revealArch = useScrollReveal();
  const revealShivling = useScrollReveal();
  const revealFestivals = useScrollReveal();
  const revealSpirit = useScrollReveal();
  const revealVisit = useScrollReveal();
  const revealNearby = useScrollReveal();
  const revealFacts = useScrollReveal();
  const revealValues = useScrollReveal();
  const revealCta = useScrollReveal();
  const revealPriests = useScrollReveal();
  const revealRituals = useScrollReveal();

  const values = [
    { icon: Heart, title: t("about.shivlingBelief1"), desc: t("about.shivlingBelief2") },
    { icon: Users, title: t("about.spiritPoint1"), desc: t("about.spiritDesc") },
    { icon: BookOpen, title: t("about.archFeature1"), desc: t("about.archNote") },
    { icon: Sparkles, title: t("about.shivlingBelief4"), desc: t("about.mythConclusion") },
  ];

  const mythSteps = [
    t("about.mythStep1"),
    t("about.mythStep2"),
    t("about.mythStep3"),
    t("about.mythStep4"),
    t("about.mythStep5"),
  ];

  const archFeatures = [
    { icon: Landmark, text: t("about.archFeature1") },
    { icon: Mountain, text: t("about.archFeature2") },
    { icon: Users, text: t("about.archFeature3") },
    { icon: Heart, text: t("about.archFeature4") },
    { icon: Navigation, text: t("about.archFeature5") },
  ];

  const festivals = [
    { title: t("about.festival1Title"), desc: t("about.festival1Desc"), icon: Star },
    { title: t("about.festival2Title"), desc: t("about.festival2Desc"), icon: Leaf },
    { title: t("about.festival3Title"), desc: t("about.festival3Desc"), icon: Calendar },
  ];

  const facts = [
    t("about.fact1"),
    t("about.fact2"),
    t("about.fact3"),
    t("about.fact4"),
  ];

  const nearbyPlaces = [
    t("about.nearby1"),
    t("about.nearby2"),
    t("about.nearby3"),
    t("about.nearby4"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Kailash Mandir | Kailash Mahadev Temple Agra History"
        description="History of kailash mandir agra, kailash mahadev mandir, kailash mahadev temple agra — twin Shivlings by Lord Parashurama in Sikandra, Agra. Official temple website & social: Facebook, Instagram, YouTube, X."
        canonical="/about"
        breadcrumbLabel="About Temple"
        keywords={mergeKeywords("temple history", "Lord Parashurama twin Shivlings", "Sikandra mandir")}

        jsonLd={[
          {
            "@type": ["HinduTemple", "Place", "TouristAttraction"],
            "@id": `${BASE_URL}/about#about-temple`,
            name: "Kailash Mahadev Temple Agra",
            alternateName: [...SITE_ALTERNATE_NAMES],
            description:
              "One of the most ancient and sacred Shiva temples located near Sikandra in Agra, Uttar Pradesh. Famous for its unique twin Shivlings believed to have been installed by Lord Parashurama over 5000 years ago.",
            url: `${BASE_URL}/about`,
            image: DEFAULT_OG_IMAGE,
            sameAs: [...SAME_AS],
            address: {
              "@type": "PostalAddress",
              streetAddress: "Sikandra",
              addressLocality: "Agra",
              addressRegion: "Uttar Pradesh",
              postalCode: "282007",
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: TEMPLE_GEO.latitude,
              longitude: TEMPLE_GEO.longitude,
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "05:00",
                closes: "12:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "16:00",
                closes: "21:00",
              },
            ],
            isAccessibleForFree: true,
            publicAccess: true,
            touristType: "Pilgrimage",
            additionalProperty: [
              { "@type": "PropertyValue", name: "Established", value: "5000+ years ago (mythological)" },
              { "@type": "PropertyValue", name: "Deity", value: "Lord Shiva" },
              {
                "@type": "PropertyValue",
                name: "Unique Feature",
                value: "Twin Shivlings installed by Lord Parashurama",
              },
              { "@type": "PropertyValue", name: "River", value: "Yamuna River Bank" },
            ],
          },
        ]}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title={t("about.title")}
          highlight={t("about.titleHighlight")}
          subtitle={t("about.description2")}
          mantra="ॐ नमः शिवाय"
        />

        {/* Section 1: Introduction */}
        <section ref={revealAbout.ref} className={revealAbout.className}>
          <About />
        </section>

        <TempleDivider />

        {/* Section 2: Geographic Location */}
        <section ref={revealLocation.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealLocation.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <MapPin className="h-3 w-3 mr-1" />
                {t("about.locationBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.locationTitle")} <span className="text-gradient-sacred">{t("about.locationHighlight")}</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="space-y-6">
                <Card className="border-gold/10">
                  <CardContent className="p-6 space-y-3">
                    {[
                      [`📍 ${t("about.locationCity")}`, t("about.locationState")],
                      [`🏘️ ${t("about.locationArea")}`, t("about.locationRiver")],
                      [`📏 ${t("about.locationDistance")}`, ""],
                    ].map(([label, sub], i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{label}</p>
                          {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-gold/10">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-heading font-semibold text-foreground mb-2">{t("about.nearbyHighlight")}</h3>
                    <p className="text-muted-foreground text-sm">🕌 {t("about.locationLandmark1")}</p>
                    <p className="text-muted-foreground text-sm">🛣️ {t("about.locationLandmark2")}</p>
                    <p className="text-muted-foreground text-sm mt-4 italic">{t("about.locationDesc")}</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-gold/10 overflow-hidden">
                <CardContent className="p-0 h-full min-h-[300px] md:min-h-full">
                  <iframe
                    title="Kailash Mahadev Temple Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3548.5!2d78.0!3d27.22!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3974771a7bfc1f7d%3A0x2c4c4c4c4c4c4c4c!2sKailash%20Temple%2C%20Sikandra%2C%20Agra%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: "300px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 3: Mythological History */}
        <section ref={revealMyth.ref} className={`py-12 md:py-20 bg-background ${revealMyth.className}`}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <BookOpen className="h-3 w-3 mr-1" />
                {t("about.mythBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.mythTitle")} <span className="text-gradient-sacred">{t("about.mythHighlight")}</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-lg text-center mb-8 leading-relaxed">{t("about.mythIntro")}</p>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-primary to-maroon" />
              <div className="space-y-6">
                {mythSteps.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-6">
                    <div className="absolute left-6 w-4 h-4 rounded-full bg-gold border-4 border-background -translate-x-1/2 z-10 mt-1" />
                    <div className="ml-14">
                      <Card className="border-gold/10 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-center gap-3">
                            <span className="text-gold font-heading font-bold text-lg">{i + 1}.</span>
                            <p className="text-foreground">{step}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="mt-8 border-gold/20 bg-gold/5">
              <CardContent className="p-5 text-center">
                <p className="text-foreground font-medium italic">{t("about.mythConclusion")}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <TempleDivider />

        {/* Section 4: Architecture */}
        <section ref={revealArch.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealArch.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Landmark className="h-3 w-3 mr-1" />
                {t("about.archBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.archTitle")} <span className="text-gradient-sacred">{t("about.archHighlight")}</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{t("about.archDesc")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {archFeatures.map((f, i) => (
                <Card key={i} className="border-gold/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-saffron flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <p className="text-foreground text-sm font-medium">{f.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground italic mt-6">{t("about.archNote")}</p>
          </div>
        </section>

        <TempleDivider />

        {/* Section 4b: Temple Trust & Priests */}
        <section ref={revealPriests.ref} className={`py-12 md:py-20 bg-background ${revealPriests.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <Users className="h-3 w-3 mr-1" />
                Temple Administration
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                Our Sacred <span className="text-gradient-sacred">Guardians</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                The temple is managed by a dedicated trust committee and served by learned priests who have devoted their lives to Lord Shiva's worship.
              </p>
            </div>

            {/* Trust Committee */}
            <div className="max-w-4xl mx-auto mb-10">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Temple Trust Committee
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Shri Ramesh Giri Ji", role: "Chairman", desc: "Overseeing temple development & community service since 1995" },
                  { name: "Mahant Shri Subhash Giri Ji", role: "Secretary", desc: "Managing daily operations, devotee services & event coordination" },
                  { name: "Mahant Shri Nirmal Giri Ji", role: "Treasurer", desc: "Financial management, donations & temple fund allocation" },
                ].map((member, i) => (
                  <Card key={i} className="border-gold/10 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground text-sm">{member.name}</p>
                          <Badge className="bg-primary/10 text-primary text-[10px]">{member.role}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Head Priests */}
            <div className="max-w-4xl mx-auto">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" />
                Head Priests (Mahantas)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Mahant Chandrakant Giri Ji", exp: "35+ years", specialty: "Rudrabhishek, Laghu Rudra & Vedic rituals", desc: "Head priest conducting major pujas and guiding spiritual ceremonies for devotees from across India." },
                  { name: "Mahant Keshav Giri  Ji", exp: "25+ years", specialty: "Maha Mrityunjaya Jaap & Shiv Chalisa", desc: "Expert in mantra recitation and traditional Shaiva rituals, known for powerful Mrityunjaya ceremonies." },
                  { name: "Mahant Gaurav Giri ji", exp: "20+ years", specialty: "Daily Aarti & Abhishek ceremonies", desc: "Conducts daily worship rituals with devotion, ensuring the sanctum's sacred atmosphere is maintained." },
                  { name: "Mahant Kapil Giri Ji", exp: "15+ years", specialty: "Festival pujas & devotee guidance", desc: "Specializes in festival-specific rituals and provides personalized spiritual guidance to devotees." },
                ].map((priest, i) => (
                  <Card key={i} className="border-gold/10 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center">
                          <span className="text-primary-foreground font-heading text-lg">ॐ</span>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground text-sm">{priest.name}</p>
                          <div className="flex gap-2">
                            <Badge className="bg-gold/10 text-gold text-[10px]">{priest.exp}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-primary font-medium mb-1">Specialty: {priest.specialty}</p>
                      <p className="text-sm text-muted-foreground">{priest.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 4c: Daily Rituals Breakdown */}
        <section ref={revealRituals.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealRituals.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Clock className="h-3 w-3 mr-1" />
                Daily Sacred Schedule
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                Temple <span className="text-gradient-sacred">Daily Rituals</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                The temple follows an ancient daily worship schedule that begins before dawn and continues until night, honoring Lord Shiva with six aarti ceremonies.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { time: "4:00 AM", name: "Mangla Aarti", icon: Moon, desc: "The first aarti of the day, performed in the sacred pre-dawn hours. The temple resonates with the sound of bells and conch shells.", special: true },
                { time: "4:30 AM", name: "Abhishek & Shringar", icon: Sparkles, desc: "The sacred Shivling is bathed with milk, honey, curd, ghee, and gangajal, followed by elaborate decoration.", special: false },
                { time: "5:00 AM", name: "Shringar Darshan", icon: Sunrise, desc: "First darshan of the day where devotees witness the beautifully adorned Shivling with flowers and chandan.", special: false },
                { time: "7:30 AM", name: "Bhog Aarti", icon: Sun, desc: "Morning bhog (food offering) is prepared and offered to Lord Shiva with devotional hymns.", special: false },
                { time: "12:00 PM", name: "Raj Bhog Aarti", icon: Sun, desc: "The grand midday aarti with elaborate bhog offering. Temple doors close after this for afternoon rest.", special: true },
                { time: "4:00 PM", name: "Temple Reopens", icon: Clock, desc: "Evening darshan begins. Devotees gather for the sacred evening atmosphere.", special: false },
                { time: "7:30 PM", name: "Sandhya Aarti", icon: Sunset, desc: "The most attended aarti of the day. Hundreds of diyas are lit creating a mesmerizing divine atmosphere.", special: true },
                { time: "9:00 PM", name: "Shayan Aarti", icon: Moon, desc: "The final aarti of the day. Lord Shiva is offered rest for the night with lullaby bhajans.", special: false },
              ].map((ritual, i) => (
                <Card key={i} className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${ritual.special ? "border-gold/30 bg-gold/5" : "border-border"}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ritual.special ? "bg-gold/20" : "bg-primary/10"}`}>
                      <ritual.icon className={`h-5 w-5 ${ritual.special ? "text-gold" : "text-primary"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-heading font-bold text-sm ${ritual.special ? "text-gold" : "text-primary"}`}>{ritual.time}</span>
                        {ritual.special && (
                          <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-1.5">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            Special
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-heading font-semibold text-foreground text-sm mb-1">{ritual.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ritual.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/darshan-timings">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground group">
                  View Full Darshan Schedule <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 5: Twin Shivlings */}
        <section ref={revealShivling.ref} className={`py-12 md:py-20 bg-background ${revealShivling.className}`}>
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
              <Eye className="h-3 w-3 mr-1" />
              {t("about.shivlingBadge")}
            </Badge>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">
              {t("about.shivlingTitle")} <span className="text-gradient-sacred">{t("about.shivlingHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">{t("about.shivlingDesc")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[t("about.shivlingBelief1"), t("about.shivlingBelief2"), t("about.shivlingBelief3"), t("about.shivlingBelief4")].map((belief, i) => (
                <Card key={i} className="border-gold/10 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5 flex items-center gap-3">
                    <span className="text-gold text-xl">🙏</span>
                    <p className="text-foreground font-medium text-sm">{belief}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 6: Festivals */}
        <section ref={revealFestivals.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealFestivals.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Calendar className="h-3 w-3 mr-1" />
                {t("about.festivalBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.festivalTitle")} <span className="text-gradient-sacred">{t("about.festivalHighlight")}</span>
              </h2>
              <p className="text-muted-foreground mt-3">{t("about.festivalDesc")}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {festivals.map((f, i) => (
                <Card key={i} className="text-center border-gold/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                      <f.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 7: Spiritual Environment */}
        <section ref={revealSpirit.ref} className={`py-12 md:py-20 bg-background ${revealSpirit.className}`}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <Leaf className="h-3 w-3 mr-1" />
                {t("about.spiritBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.spiritTitle")} <span className="text-gradient-sacred">{t("about.spiritHighlight")}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[t("about.spiritPoint1"), t("about.spiritPoint2"), t("about.spiritPoint3"), t("about.spiritPoint4")].map((point, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-gold text-lg">🕉️</span>
                  <p className="text-foreground">{point}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground italic mt-6">{t("about.spiritDesc")}</p>
          </div>
        </section>

        <TempleDivider />

        {/* Section 8: Visiting Information */}
        <section ref={revealVisit.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealVisit.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Clock className="h-3 w-3 mr-1" />
                {t("about.visitBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.visitTitle")} <span className="text-gradient-sacred">{t("about.visitHighlight")}</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-gold/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t("about.visitTimings")}</h3>
                  <p className="text-sm text-muted-foreground">{t("about.visitMorning")}</p>
                  <p className="text-sm text-muted-foreground">{t("about.visitEvening")}</p>
                </CardContent>
              </Card>
              <Card className="border-gold/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t("about.visitBestTime")}</h3>
                  <p className="text-sm text-muted-foreground">• {t("about.visitBestTime1")}</p>
                  <p className="text-sm text-muted-foreground">• {t("about.visitBestTime2")}</p>
                  <p className="text-sm text-muted-foreground">• {t("about.visitBestTime3")}</p>
                </CardContent>
              </Card>
              <Card className="border-gold/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center mb-4">
                    <Navigation className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t("about.visitHowToReach")}</h3>
                  <p className="text-sm text-muted-foreground">• {t("about.visitReach1")}</p>
                  <p className="text-sm text-muted-foreground">• {t("about.visitReach2")}</p>
                  <p className="text-sm text-muted-foreground">• {t("about.visitReach3")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 9: Nearby Places */}
        <section ref={revealNearby.ref} className={`py-12 md:py-20 bg-background ${revealNearby.className}`}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <MapPin className="h-3 w-3 mr-1" />
                {t("about.nearbyBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.nearbyTitle")} <span className="text-gradient-sacred">{t("about.nearbyHighlight")}</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nearbyPlaces.map((place, i) => (
                <Card key={i} className="text-center border-gold/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5">
                    <MapPin className="h-8 w-8 text-gold mx-auto mb-2" />
                    <p className="font-medium text-foreground text-sm">{place}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Section 10: Interesting Facts */}
        <section ref={revealFacts.ref} className={`py-12 md:py-20 bg-muted temple-pattern ${revealFacts.className}`}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                {t("about.factsBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("about.factsTitle")} <span className="text-gradient-sacred">{t("about.factsHighlight")}</span>
              </h2>
            </div>
            <div className="space-y-4">
              {facts.map((fact, i) => (
                <Card key={i} className="border-gold/10 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-2xl font-heading font-bold text-gold">{i + 1}</span>
                    <p className="text-foreground">{fact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* CTA */}
        <section ref={revealCta.ref} className={`relative py-16 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={shivaLingam} alt="Visit Kailash Mahadev Temple" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
              {t("about.visitTitle")} <span className="text-gold-light">{t("about.visitHighlight")}</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">
              {t("about.spiritDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/darshan-timings">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
                  {t("hero.viewDarshanTimings")}
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  {t("contact.badge")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
