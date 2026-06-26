import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Wallet, CreditCard, Smartphone, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DonationQRCode from "./DonationQRCode";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DEFAULT_DONATION_AMOUNT,
  DONATION_MAX_AMOUNT,
  DONATION_MIN_AMOUNT,
  getDonationValidationError,
} from "@/lib/donationValidation";
import { DEFAULT_DONATION_SETTINGS, fetchDonationSettings, type DonationSettings } from "@/lib/donationSettings";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const paymentMethods = [
  { name: "UPI", icon: Smartphone },
  { name: "Card", icon: CreditCard },
  { name: "Wallet", icon: Wallet },
];

const Donation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>(String(DEFAULT_DONATION_AMOUNT));
  const [customAmountMode, setCustomAmountMode] = useState(false);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const loaded = await fetchDonationSettings();
        setSettings(loaded);
        setDonationAmount(String(loaded.default_amount));
        setCustomAmountMode(false);
      } catch (error) {
        console.error("Failed to load donation settings", error);
        setSettings(DEFAULT_DONATION_SETTINGS);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const parsedDonationAmount = useMemo(() => Number(donationAmount || settings.default_amount), [donationAmount, settings.default_amount]);
  const donationValidationError = useMemo(
    () => getDonationValidationError(donationAmount, { minAmount: settings.minimum_amount, maxAmount: settings.maximum_amount }),
    [donationAmount, settings.maximum_amount, settings.minimum_amount]
  );
  const selectedAmountLabel = useMemo(() => `₹${parsedDonationAmount.toLocaleString("en-IN")}`, [parsedDonationAmount]);

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

  const handleDonate = async () => {
    if (!user) {
      toast.info("Please sign in to make a donation");
      navigate("/auth");
      return;
    }

    const validationError = getDonationValidationError(donationAmount, { minAmount: settings.minimum_amount, maxAmount: settings.maximum_amount });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const amount = Number(donationAmount);
    if (amount < settings.minimum_amount || amount > settings.maximum_amount) {
      toast.error(`Donation amount must be between ₹${settings.minimum_amount.toLocaleString("en-IN")} and ₹${settings.maximum_amount.toLocaleString("en-IN")}.`);
      return;
    }

    if (!settings.enable_razorpay) {
      toast.error("Razorpay donations are currently unavailable.");
      return;
    }

    const suggestedAmounts = settings.suggested_amounts;
    if (!settings.enable_custom_amount && !suggestedAmounts.includes(amount)) {
      toast.error("Please choose one of the suggested donation amounts.");
      return;
    }

    setLoadingTier("custom");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      console.log("[Donation] initiating donation order", {
        amount,
        tier: "custom",
      });

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-donation-order",
        {
          body: {
            amount,
            tier: "custom",
          },
        }
      );

      console.log("[Donation] create-donation-order response", orderData);

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
        description: `Donation of ${selectedAmountLabel}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            console.log("[Donation] Razorpay success response", response);

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

            console.log("[Donation] verify-donation-payment response", verifyData);

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || "Payment verification failed");
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

  const handleQuickAmountSelect = (amount: number) => {
    setDonationAmount(String(amount));
    setCustomAmountMode(false);
  };

  const handleCustomAmountToggle = () => {
    if (!settings.enable_custom_amount) {
      return;
    }
    setCustomAmountMode(true);
    setDonationAmount(donationAmount || String(settings.default_amount));
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

        <div className="max-w-2xl mx-auto mb-10 md:mb-12">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl text-primary">Make a Custom Donation</CardTitle>
              <p className="text-sm text-muted-foreground">Choose an amount below or enter your own. Payments still go through the same secure Razorpay flow.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {!settingsLoading && settings.enable_suggested_amounts && settings.suggested_amounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.suggested_amounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={String(amount) === donationAmount && !customAmountMode ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => handleQuickAmountSelect(amount)}
                    >
                      ₹{amount.toLocaleString("en-IN")}
                    </Button>
                  ))}
                </div>
              )}

              {settings.enable_custom_amount && (
                <div className="space-y-2">
                  <label htmlFor="donation-amount" className="text-sm font-medium text-foreground">
                    Donation Amount (₹)
                  </label>
                  <Input
                    id="donation-amount"
                    inputMode="numeric"
                    value={donationAmount}
                    onChange={(event) => {
                      const nextValue = event.target.value.replace(/\D/g, "");
                      setDonationAmount(nextValue);
                      setCustomAmountMode(true);
                    }}
                    placeholder="Enter amount"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum ₹{settings.minimum_amount.toLocaleString("en-IN")}, maximum ₹{settings.maximum_amount.toLocaleString("en-IN")}, whole rupees only.
                  </p>
                  {donationValidationError && (
                    <p className="text-sm text-red-600">{donationValidationError}</p>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">You will donate</p>
                    <p className="text-2xl font-heading font-semibold text-primary">{selectedAmountLabel}</p>
                  </div>
                  <Button
                    className="bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                    onClick={handleDonate}
                    disabled={loadingTier === "custom" || Boolean(donationValidationError) || settingsLoading}
                  >
                    {loadingTier === "custom" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.processing")}
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        {t("common.donateNow")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Section */}
        <div className="max-w-sm mx-auto mb-10 md:mb-12">
          <DonationQRCode />
        </div>

        {/* Payment Methods */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-3 md:mb-4">{t("donation.acceptedPayments")}</p>
          <div className="flex items-center justify-center gap-3 md:gap-4">
            {paymentMethods.filter((method) => settings.enable_quick_upi || method.name !== "UPI").map((method) => (
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
