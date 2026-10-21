import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, Phone, User, LogIn, ShieldCheck, BookOpen, MessageCircle, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { role, isAdmin, isPriest, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const desktopNavLinks = [
    { name: t("nav.home"), href: "/", isRoute: true },
    { name: t("nav.about"), href: "/about", isRoute: true },
    { name: t("nav.contact"), href: "/contact", isRoute: true },
    { name: t("nav.pujas"), href: "/pujas", isRoute: true },
    { name: t("nav.donate"), href: "/donate", isRoute: true },
    { name: t("liveDarshan.title") || "Live Darshan", href: "/live-darshan", isRoute: true },
  ];

  const mobileNavLinks = [
    { name: t("nav.home"), href: "/", isRoute: true },
    { name: t("nav.about"), href: "/about", isRoute: true },
    { name: t("liveDarshan.title") || "Live Darshan", href: "/live-darshan", isRoute: true },
    { name: t("nav.darshan"), href: "/darshan-timings", isRoute: true },
    { name: t("nav.events"), href: "/events", isRoute: true },
    { name: t("nav.gallery"), href: "/gallery", isRoute: true },
    { name: t("nav.donate"), href: "/donate", isRoute: true },
    { name: t("nav.notices"), href: "/notice-board", isRoute: true },
    { name: t("nav.contact"), href: "/contact", isRoute: true },
    { name: t("nav.pujas"), href: "/pujas", isRoute: true },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const accountHref = useMemo(() => {
    switch (role) {
      case "super_admin":
      case "admin":
        return "/admin";
      case "priest":
        return "/priest";
      default:
        return "/dashboard";
    }
  }, [role]);

  const shouldHoldAccountActions = !!user && roleLoading;

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }, 500);
      } else {
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsOpen(false);
  };

  const handleHelpline = () => {
    window.open("tel:+918859692841");
    toast.info("Calling temple helpline...");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-saffron flex items-center justify-center glow-saffron">
              <span className="text-primary-foreground font-heading text-lg md:text-xl">ॐ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-sm md:text-base font-semibold text-foreground">
                Kailash Mahadev
              </h1>
              <p className="text-xs text-muted-foreground">Temple Agra</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-2 xl:gap-3 min-w-0 overflow-x-auto scrollbar-hide px-4 py-1.5 rounded-full bg-background/80 border border-primary/15 shadow-sm backdrop-blur-md">
            {desktopNavLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`whitespace-nowrap text-sm font-medium transition-all relative py-1 px-2 rounded-full ${
                    active
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-gold via-primary to-gold shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <LanguageToggle />
            <ThemeToggle />
            {!shouldHoldAccountActions && isAdmin && (
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex text-primary hover:bg-primary/10"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {t("common.admin")}
                </Button>
              </Link>
            )}

            {!shouldHoldAccountActions && isPriest && !isAdmin && (
              <Link to="/priest">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex text-maroon hover:bg-maroon/10"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t("common.myPujas")}
                </Button>
              </Link>
            )}
            
            {user ? (
              shouldHoldAccountActions ? (
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  className="hidden md:flex bg-gradient-saffron text-primary-foreground"
                >
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.myAccount")}
                </Button>
              ) : (
                <Link to={accountHref}>
                  <Button
                    variant="default"
                    size="sm"
                    className="hidden md:flex bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t("common.myAccount")}
                  </Button>
                </Link>
              )
            ) : (
              <Link to="/auth">
                <Button
                  variant="default"
                  size="sm"
                  className="hidden md:flex bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("common.signIn")}
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-3 pb-6 border-b border-border">
                    <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center">
                      <span className="text-primary-foreground font-heading text-xl">ॐ</span>
                    </div>
                    <div>
                      <h2 className="font-heading font-semibold">Kailash Mahadev</h2>
                      <p className="text-sm text-muted-foreground">Temple Agra</p>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col gap-1.5">
                    {mobileNavLinks.map((link) => {
                      const active = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-between ${
                            active
                              ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
                              : "text-foreground hover:bg-muted hover:text-primary"
                          }`}
                        >
                          <span>{link.name}</span>
                          {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-auto pt-6 border-t border-border space-y-3">
                    {!shouldHoldAccountActions && isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full mb-2">
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {t("nav.adminDashboard")}
                        </Button>
                      </Link>
                    )}
                    {!shouldHoldAccountActions && isPriest && !isAdmin && (
                      <Link to="/priest" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full mb-2">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {t("common.myPujas")}
                        </Button>
                      </Link>
                    )}
                    {user ? (
                      shouldHoldAccountActions ? (
                        <Button disabled className="w-full bg-gradient-saffron text-primary-foreground">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("common.myAccount")}
                        </Button>
                      ) : (
                        <Link to={accountHref} onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                            <User className="h-4 w-4 mr-2" />
                            {t("common.myAccount")}
                          </Button>
                        </Link>
                      )
                    ) : (
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                          <LogIn className="h-4 w-4 mr-2" />
                          {t("common.signIn")}
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleHelpline}>
                      <Phone className="h-4 w-4 mr-2" />
                      {t("common.templeHelpline")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
