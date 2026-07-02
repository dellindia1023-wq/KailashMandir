export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

import { supabase } from "@/integrations/supabase/client";

export const openRazorpayCheckout = async (
  opts: { orderId: string; bookingId: string; amount: number; currency: string; keyId: string },
  title?: string,
  email?: string,
) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Failed to load Razorpay script");

  if (typeof window === "undefined") throw new Error("Razorpay checkout requires browser environment");
  const Razorpay = (window as any).Razorpay;
  if (!Razorpay) throw new Error("Razorpay not available");

  return new Promise<void>((resolve, reject) => {
    const handler = async (response: any) => {
      try {
        await supabase.functions.invoke("verify-razorpay-payment", {
          body: {
            bookingId: opts.bookingId,
            razorpayOrderId: opts.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        });
        resolve();
      } catch (err) {
        console.error("verify error", err);
        reject(err);
      }
    };

    const rzp = new Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      name: title || "Kailash Mahadev Temple",
      description: "Puja Booking Payment",
      amount: opts.amount,
      currency: opts.currency || "INR",
      prefill: { email },
      handler,
    });

    rzp.open();
  });
};
