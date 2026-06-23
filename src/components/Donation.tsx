import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Wallet, CreditCard, Smartphone, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DonationQRCode from "./DonationQRCode";
import { useLanguage } from "@/contexts/LanguageContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const donationTiers = [
  {
    name: "Seva",
    tier: "seva",
    amount: 501,
    displayAmount: "₹501",
    descKey: "donation.sevaDesc",
    benefits: ["Name in daily prayers", "Digital prasad receipt"],
    popular: false,
  },
  {
    name: "Archana",
    tier: "bhakta",
    amount: 1101,
    displayAmount: "₹1,101",
    descKey: "donation.archanaDesc",
    benefits: ["Personal puja on your behalf", "Blessed prasad delivery", "Certificate of donation"],
    popular: true,
  },
  {
    name: "Abhishekam",
    tier: "dharma",
    amount: 2501,
    displayAmount: "₹2,501",
    descKey: "donation.abhishekamDesc",
    benefits: ["Rudrabhishek in your name", "Family blessings", "Video of ceremony", "Premium prasad kit"],
    popular: false,
  },
  {
    name: "Mahadan",
    tier: "mahadaan",
    amount: 5001,
    displayAmount: "₹5,001",
    descKey: "donation.mahadanDesc",
    benefits: ["All above benefits", "Name on donor wall", "Annual VIP darshan pass", "Direct priest blessing call"],
    popular: false,
  },
];

const paymentMethods = [
  { name: "UPI", icon: Smartphone },
  { name: "Card", icon: CreditCard },
  { name: "Wallet", icon: Wallet },
];

const Donation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { t } = useLanguage();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDonate = async (tier: typeof donationTiers[0]) => {
    if (!user) {
      toast.info("Please sign in to make a donation");
      navigate("/auth");
      return;
    }

    setLoadingTier(tier.tier);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-donation-order",
        {
          body: {
            amount: tier.amount,
            tier: tier.tier,
          },
        }
      );

      if (orderError) {
        throw new Error(orderError.message || "Failed to create donation order");
      }

      if (orderData?.error) {
        throw new Error(orderData.error);
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Shri Kailash Mahadev Temple",
        description: `${tier.name} Donation`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "verify-donation-payment",
              {
                body: {
                  donationId: orderData.donationId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              }
            );

            if (verifyError || verifyData?.error) {
              throw new Error("Payment verification failed");
            }

            toast.success("Thank you for your generous donation! 🙏");
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed. Please contact temple support.");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#ea580c",
        },
        modal: {
          ondismiss: () => {
            setLoadingTier(null);
            toast.info("Donation cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error(error.message || "Failed to initiate donation");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <section id="donate" className="py-10 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
            <Heart className="h-3 w-3 mr-1" />
            {t("donation.badge")}
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            {t("donation.title")} <span className="text-gradient-sacred">{t("donation.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {t("donation.subtitle")}
          </p>
        </div>

        {/* Donation Tiers - horizontal scroll on mobile */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
          {donationTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 active:scale-[0.98] min-w-[280px] md:min-w-0 snap-center flex-shrink-0 md:flex-shrink ${
                tier.popular
                  ? "border-2 border-gold bg-gradient-to-br from-gold/10 to-saffron/5"
                  : "hover:border-primary/30"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute top-0 right-0 rounded-none rounded-bl-lg bg-gold text-accent-foreground text-[10px] md:text-xs">
                  {t("donation.mostPopular")}
                </Badge>
              )}
              <CardHeader className="pb-3 md:pb-4">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{tier.name}</p>
                <CardTitle className={`font-heading text-2xl md:text-3xl ${tier.popular ? "text-gold" : "text-primary"}`}>
                  {tier.displayAmount}
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">{t(tier.descKey)}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-xs md:text-sm">
                      <CheckCircle className={`h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 flex-shrink-0 ${
                        tier.popular ? "text-gold" : "text-primary"
                      }`} />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-10 md:h-11 active:scale-[0.97] ${
                    tier.popular
                      ? "bg-gold hover:bg-gold-light text-accent-foreground"
                      : "bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                  }`}
                  onClick={() => handleDonate(tier)}
                  disabled={loadingTier === tier.tier}
                >
                  {loadingTier === tier.tier ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      {t("common.donateNow")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QR Code Section */}
        <div className="max-w-sm mx-auto mb-10 md:mb-12">
          <DonationQRCode />
        </div>

        {/* Payment Methods */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-3 md:mb-4">{t("donation.acceptedPayments")}</p>
          <div className="flex items-center justify-center gap-3 md:gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg bg-muted"
              >
                <method.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="text-xs md:text-sm font-medium">{method.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-3 md:mt-4">
            {t("donation.taxNote")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Donation;
