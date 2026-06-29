import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import SEOHead from "@/components/SEOHead";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const detectRecoverySession = async () => {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(search);

      const isRecoveryFromUrl =
        hashParams.get("type") === "recovery" ||
        searchParams.get("type") === "recovery" ||
        hash.includes("type=recovery");

      if (isRecoveryFromUrl) {
        setIsRecovery(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setIsRecovery(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setIsRecovery(true);
        }
      }
    });

    void detectRecoverySession();

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Your reset link is invalid or has expired. Please request a new one.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("We could not verify your password reset session. Please request a new link.");
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err: any) {
      setError(err?.message || "Unable to update password right now. Please try again.");
      toast.error(err?.message || "Unable to update password right now.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
        <div className="absolute inset-0 temple-pattern opacity-30" />
        <div className="relative z-10 w-full max-w-md">
          <Card className="border-2 border-gold/30 shadow-2xl">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verifying your reset link…</p>
              <Link to="/auth" className="text-sm text-primary hover:underline inline-block">
                Back to Sign In
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
        <div className="absolute inset-0 temple-pattern opacity-30" />
        <div className="relative z-10 w-full max-w-md">
          <Card className="border-2 border-gold/30 shadow-2xl">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="font-heading text-xl font-semibold">Password Updated!</h2>
              <p className="text-muted-foreground">Redirecting you to sign in…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
      <SEOHead
        title="Reset Password"
        description="Reset your Kailash Mahadev Temple Agra devotee account password."
        canonical="/reset-password"
        noindex
      />
      <div className="absolute inset-0 temple-pattern opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <Card className="border-2 border-gold/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-saffron flex items-center justify-center glow-saffron">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl">Set New Password</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a strong password for your account
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <p className="text-xs text-muted-foreground">
                Min 8 chars, uppercase, number & special character required
              </p>

              <Button
                type="submit"
                className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating…
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
